// Campanha cooperativa no navegador (marco 15, 15/10/2026, D-061): `?jogo=grupo&slot=N&criar=1` cria o grupo na fase
// do slot; `?jogo=grupo&slot=N&codigo=XXXXXX` entra num grupo. Cada um joga com o personagem do próprio slot; a
// sala do servidor decide tudo (a mesma cena da campanha, com o estado vindo da rede, como na arena).
// - O personagem volta para o slot de quem jogou: a cada 30 s, ao subir de nível, ao pegar item, ao trocar de fase,
//   ao sair e ao esconder a página. Só a progressão muda; a fase do slot continua a dele.
// - O anfitrião também leva o avanço de fase para o slot dele (como se tivesse passado sozinho).
// - Fase nova: a cena é desmontada e montada de novo com o contexto novo; a conexão continua a mesma.

import { conteudoOficial, modoPorId } from './core/conteudo';
import { buscarEntidade, criarEstado, type Entidade } from './core/estado';
import { MODO_COOPERATIVO } from './coop/sala-campanha';
import { atualizarPersonagemNoSave, pedidoDoPersonagem } from './coop/personagem';
import type { ContextoSimulacao } from './core/contexto';
import { t, type ChaveTexto } from './i18n';
import type { Dificuldade } from './modos/dificuldade';
import { ClienteArena, type NovaFase } from './net/cliente';
import { MonitorDeConexao } from './net/qualidade';
import { iniciarLaco, relogioDoNavegador } from './plataforma/laco-navegador';
import { carregarSlot, gravarRegistro } from './plataforma/saves';
import { enderecoDoServidor } from './plataforma/servidor';
import { sairDaTelaCheia } from './plataforma/sessao-tela';
import { conectarCampanha, type ConexaoCampanha } from './plataforma/transporte-colyseus';
import { jogadorDoSave, type RefFase, type RegistroProgresso } from './save/esquema';
import { contextoDaFase, estadoInicialDaFase, faseOficialOuGerada } from './save/fases-campanha';
import { avancarFase } from './save/transicao';
import { mostrarAviso } from './ui/aviso';
import { montarCena, type Cena } from './ui/cena';
import { criarPainelGrupo } from './ui/grupo';
import { naSaidaAberta } from './world/portas';

const AUTOSAVE_MS = 30_000;
const ESPERA_ENTRADA_MS = 10_000;
const agoraMs = () => relogioDoNavegador.agoraMs();

export interface OpcoesGrupo {
  slot: number;
  /** Código do grupo para entrar; sem ele, cria. */
  codigo?: string;
  dificuldade?: Dificuldade;
}

function mostrarErro(raiz: HTMLElement, texto: string): void {
  raiz.textContent = '';
  const tela = document.createElement('section');
  tela.className = 'tela-menu';
  const p = document.createElement('p');
  p.setAttribute('role', 'alert');
  p.textContent = texto;
  const voltar = document.createElement('a');
  voltar.className = 'botao-menu';
  voltar.href = './?jogo=campanha';
  voltar.textContent = t('slots.voltar');
  tela.append(p, voltar);
  raiz.append(tela);
}

const conteudo = conteudoOficial();
const modo = modoPorId(conteudo, MODO_COOPERATIVO);

function contextoDe(ref: RefFase): ContextoSimulacao | null {
  const r = contextoDaFase(conteudo, faseOficialOuGerada(ref, conteudo), modo);
  return r.ok ? r.ctx : null;
}

/** Espera o bemVindo (ou a recusa) da sala. */
async function esperarEntrada(eu: ClienteArena): Promise<boolean> {
  const inicio = Date.now();
  while (!eu.conectado && eu.erro === null && Date.now() - inicio < ESPERA_ENTRADA_MS) {
    await new Promise((r) => setTimeout(r, 30));
  }
  return eu.conectado;
}

export async function iniciarGrupo(raiz: HTMLElement, o: OpcoesGrupo): Promise<void> {
  const servidor = enderecoDoServidor();
  if (!servidor) {
    mostrarErro(raiz, t('grupo.semServidor'));
    return;
  }
  const leitura = await carregarSlot(o.slot).catch(() => null);
  const personagem = leitura && leitura !== 'invalido' ? jogadorDoSave(leitura.estado) : undefined;
  const pedido = personagem ? pedidoDoPersonagem(personagem) : null;
  if (!leitura || leitura === 'invalido' || !pedido) {
    mostrarErro(raiz, t('grupo.semPersonagem'));
    return;
  }
  if (!o.codigo && leitura.faseRef.tipo === 'aventura') {
    mostrarErro(raiz, t('grupo.aventura'));
    return;
  }
  raiz.textContent = '';
  mostrarAviso(raiz, t('grupo.conectando'), ESPERA_ENTRADA_MS);

  let conexao: ConexaoCampanha;
  try {
    conexao = await conectarCampanha(
      servidor,
      o.codigo ? { codigo: o.codigo } : { criar: { faseRef: leitura.faseRef, dificuldade: o.dificuldade ?? leitura.estado.dificuldade } },
    );
  } catch (e) {
    const motivo = e instanceof Error ? e.message : '';
    mostrarErro(raiz, t(motivo === 'nao_encontrada' ? 'grupo.naoEncontrado' : motivo === 'nao_e_grupo' ? 'grupo.naoEGrupo' : 'grupo.falha'));
    return;
  }
  const ctxInicial = contextoDe(conexao.faseRef);
  if (!ctxInicial) {
    mostrarErro(raiz, t('slots.faseAusente'));
    return;
  }
  const eu = new ClienteArena({ ctx: ctxInicial, transporte: conexao.transporte, nome: pedido.nome, pedidoFicha: pedido, agoraMs, contextoDe });
  eu.entrar();
  if (!(await esperarEntrada(eu))) {
    conexao.transporte.fechar();
    mostrarErro(raiz, eu.erro ? t(`grupo.erro.${eu.erro}` as ChaveTexto) : t('grupo.falha'));
    return;
  }

  // O personagem como a sala o tem agora (estado público + a bolsa do canal privado).
  const meuPersonagem = (): Entidade | undefined => {
    const id = eu.entidadeId;
    const e = eu.previsto && id ? buscarEntidade(eu.previsto, id) : undefined;
    return e?.bolsa ? e : undefined;
  };
  // Gravações em fila: uma de cada vez, sempre a partir do que está no slot.
  let fila: Promise<void> = Promise.resolve();
  const gravar = (transformar?: (r: RegistroProgresso) => RegistroProgresso): Promise<void> => {
    const e = meuPersonagem();
    if (!e) return fila;
    const copia = structuredClone(e);
    fila = fila
      .then(async () => {
        const r = await carregarSlot(o.slot);
        if (!r || r === 'invalido') return;
        const atualizado = atualizarPersonagemNoSave(r, copia, eu.ctx, Date.now());
        await gravarRegistro(transformar ? transformar(atualizado) : atualizado);
      })
      .catch(() => {
        mostrarAviso(raiz, t('slots.falhaGravar'), 5000);
      });
    return fila;
  };

  let cena: Cena | null = null;
  let pararLaco: (() => void) | null = null;
  const vazio = criarEstado({ semente: 0, faseId: ctxInicial.fase.id });
  const monitor = new MonitorDeConexao();
  const avisar = (texto: string, ms?: number) => {
    mostrarAviso(raiz.querySelector<HTMLElement>('.camada-ui') ?? raiz, texto, ms);
  };

  const montar = async (): Promise<void> => {
    pararLaco?.();
    cena?.desmontar();
    const ctx = eu.ctx;
    const idLocal = eu.entidadeId ?? 'p1';
    const sair = document.createElement('button');
    sair.type = 'button';
    sair.className = 'botao-cabecalho';
    sair.textContent = t('grupo.sair');
    sair.setAttribute('aria-label', t('grupo.sairRotulo'));
    sair.addEventListener('click', () => {
      sair.disabled = true;
      sairDaTelaCheia();
      void gravar().finally(() => {
        conexao.transporte.fechar();
        location.href = './?jogo=campanha';
      });
    });
    const painel = criarPainelGrupo(conexao.codigo);
    cena = await montarCena({
      raiz,
      ctx,
      idLocal,
      estado: () => eu.previsto ?? vazio,
      emitir: (cmd) => {
        eu.enviarComando(cmd);
      },
      acoesExtras: [sair],
      pausaOJogo: false,
      acoesDaPausa: [{ rotulo: t('grupo.sairRotulo'), fazer: () => { sair.click(); } }],
      dificuldade: {
        atual: () => eu.previsto?.dificuldade ?? 'normal',
        definir: (nivel) => {
          if (eu.anfitriao) eu.enviarComando({ t: 'definirDificuldade', nivel });
          else avisar(t('grupo.soAnfitriao'));
        },
      },
    });
    if (!cena) return;
    const c = cena;
    raiz.querySelector('.camada-ui')?.append(painel.elemento);
    eu.aoEventos = (eventos) => {
      for (const ev of eventos) c.bus.emitir(ev.t, ev);
    };
    c.bus.on('subiuNivel', (ev) => {
      if (ev.id === eu.entidadeId) void gravar();
    });
    c.bus.on('coletou', (ev) => {
      if (ev.tipo === 'item' && ev.id === eu.entidadeId) void gravar();
    });
    pararLaco = iniciarLaco({
      simular: () => {
        eu.passo();
      },
      renderizar: (alpha) => {
        const id = eu.entidadeId ?? idLocal;
        const conectado = eu.conectado && !!(eu.previsto && buscarEntidade(eu.previsto, id));
        if (monitor.atualizar(agoraMs(), eu.rttMs, conectado)) avisar(t('rede.instavel'));
        const estado = eu.previsto ?? vazio;
        painel.atualizar(estado, id, eu.anfitriaoId, (e) => naSaidaAberta(estado, eu.ctx, e), agoraMs());
        c.quadro({
          alpha,
          agoraMs: agoraMs(),
          posicao: (e) => (e.id === id ? eu.posicaoVisualPropria() : eu.posicaoRemota(e.id)) ?? { x: e.x, y: e.y },
          rede: { rttMs: eu.rttMs, latenciaSimuladaMs: 0, erroP95: 0, conectado },
        });
      },
    });
  };

  // Fase nova: grava (o anfitrião leva o avanço para o slot dele), desmonta e monta de novo.
  eu.aoNovaFase = (msg: NovaFase) => {
    const ehAnfitriao = eu.anfitriao;
    void gravar((r) => {
      if (!ehAnfitriao) return r;
      const campanha = contextoDaFase(conteudo, faseOficialOuGerada(msg.faseRef, conteudo));
      if (!campanha.ok) return r;
      const spawn = campanha.ctx.fase.spawns[0] ?? { x: 1, y: 1 };
      return avancarFase(r, { ref: msg.faseRef, nome: msg.nome, spawn, novoEstado: () => estadoInicialDaFase(campanha.ctx) }, Date.now());
    });
    void montar().then(() => {
      avisar(t('fase.entrando', { nome: msg.nome }), 3000);
    });
  };
  eu.aoFimDaCampanha = () => {
    avisar(t('fase.fimDaCampanha'), 6000);
  };
  conexao.aoMudar((estado) => {
    avisar(t(`conexao.${estado}`));
  });

  await montar();
  avisar(t('grupo.codigoAviso', { codigo: conexao.codigo }), 8000);
  const ajustes = eu.previaAlteracoes;
  if (ajustes.length > 0) avisar(t('grupo.fichaAjustada', { campos: ajustes.join(', ') }), 8000);

  setInterval(() => void gravar(), AUTOSAVE_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void gravar();
  });
  addEventListener('pagehide', () => {
    void gravar();
  });
}
