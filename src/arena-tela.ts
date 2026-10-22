// Telas da arena no navegador. As duas variantes usam o mesmo `rodarArena`:
// - loopback (`?arena=loopback&latencia=80&jitter=20&perda=0.01`): sala, você e um bot na mesma
//   página, ligados por rede simulada (marco 4);
// - online (`?arena=online`): lobby -> servidor real por WSS (marco 5).
// Marco 17 (15/10/2026, D-063): online, o personagem de um slot entra inteiro com o certificado do servidor; ao sair
// (e a cada 2 min), o personagem certificado volta para o slot com o que a arena deu.

import type { Certificado } from './integridade/certificado';
import { certificarSlot, gravarCertificadoNoSlot } from './plataforma/certificacao';
import { sincronizarSlot } from './plataforma/nuvem';
import { MonitorDeConexao } from './net/qualidade';
import { enderecoDoServidor } from './plataforma/servidor';
import { contextoDaArena } from './arena/contexto-arena';
import { versaoDoConteudo } from './arena/protocolo';
import { SalaArena } from './arena/sala';
import type { ContextoSimulacao } from './core/contexto';
import { buscarEntidade, criarEstado } from './core/estado';
import { t } from './i18n';
import { BotDeArena } from './net/bot';
import { ClienteArena } from './net/cliente';
import { ligarSala } from './net/ligacao';
import { RedeLocal, REDE_PERFEITA } from './net/rede-local';
import { iniciarLaco, relogioDoNavegador } from './plataforma/laco-navegador';
import { conectarArena, type PedidoDeSala } from './plataforma/transporte-colyseus';
import { mostrarAviso } from './ui/aviso';
import { montarCena } from './ui/cena';
import { mostrarLobby, type OpcoesLobby } from './ui/lobby';

const JANELA_ERROS = 120;
const ESPERA_ENTRADA_MS = 10_000;
const ESPERA_CERTIFICADO_MS = 4000;
const GRAVAR_A_CADA_MS = 120_000;
const agoraMs = () => relogioDoNavegador.agoraMs();

function p95(valores: readonly number[]): number {
  if (valores.length === 0) return 0;
  const o = [...valores].sort((a, b) => a - b);
  return o[Math.min(o.length - 1, Math.floor(o.length * 0.95))] ?? 0;
}

interface OpcoesArena {
  raiz: HTMLElement;
  ctx: ContextoSimulacao;
  eu: ClienteArena;
  /** Chamado a cada tick, antes do seu cliente (sala e bot do loopback). */
  antesDoTick?: (dtMs: number) => void;
  latenciaSimuladaMs: number;
  /** Código da sala, mostrado para compartilhar (só online). */
  codigo?: string;
  /** Marco 17: botões a mais no cabeçalho (o "Salvar e sair" da arena online). */
  acoesExtras?: HTMLElement[];
}

/** Laço da arena: cena compartilhada + seu cliente (predição, reconciliação, interpolação). */
async function rodarArena(o: OpcoesArena): Promise<{ avisar: (texto: string) => void } | null> {
  const { ctx, eu } = o;
  // Antes do bemVindo, a cena desenha um estado vazio da fase.
  const vazio = criarEstado({ semente: 0, faseId: ctx.fase.id });
  const idLocal = eu.entidadeId ?? 'p1';

  const cena = await montarCena({
    raiz: o.raiz,
    ctx,
    idLocal,
    estado: () => eu.previsto ?? vazio,
    emitir: (cmd) => {
      eu.enviarComando(cmd);
    },
    acoesExtras: o.acoesExtras ?? [],
  });
  if (!cena) return null;
  // Os eventos da sala (dano, coleta, mortes) alimentam o mesmo feedback da campanha.
  eu.aoEventos = (eventos) => {
    for (const ev of eventos) cena.bus.emitir(ev.t, ev);
  };
  const avisar = (texto: string) => {
    mostrarAviso(o.raiz.querySelector<HTMLElement>('.camada-ui') ?? o.raiz, texto);
  };
  if (o.codigo) avisar(t('lobby.codigoDaSala', { codigo: o.codigo }));
  const monitor = new MonitorDeConexao();

  iniciarLaco({
    simular: (dtMs) => {
      o.antesDoTick?.(dtMs);
      eu.passo();
    },
    renderizar: (alpha) => {
      const id = eu.entidadeId ?? idLocal;
      const conectado = eu.conectado && !!(eu.previsto && buscarEntidade(eu.previsto, id));
      // Perfil degradado (§3.6): avisa, sem mudar as regras.
      if (eu.entidadeId && monitor.atualizar(agoraMs(), eu.rttMs, conectado)) avisar(t('rede.instavel'));
      cena.quadro({
        alpha,
        agoraMs: agoraMs(),
        posicao: (e) => (e.id === id ? eu.posicaoVisualPropria() : eu.posicaoRemota(e.id)) ?? { x: e.x, y: e.y },
        rede: {
          rttMs: eu.rttMs,
          latenciaSimuladaMs: o.latenciaSimuladaMs,
          erroP95: p95(eu.erros.slice(-JANELA_ERROS)),
          conectado,
        },
      });
    },
    quadroPermitido: cena.quadroPermitido,
  });
  return { avisar };
}

function numeroDaUrl(params: URLSearchParams, nome: string, padrao: number, max: number): number {
  const v = Number(params.get(nome));
  return Number.isFinite(v) && params.has(nome) ? Math.min(max, Math.max(0, v)) : padrao;
}

export async function iniciarArenaLoopback(raiz: HTMLElement): Promise<void> {
  const params = new URLSearchParams(location.search);
  const condicao = {
    ...REDE_PERFEITA,
    latenciaMs: numeroDaUrl(params, 'latencia', 40, 500),
    jitterMs: numeroDaUrl(params, 'jitter', 10, 200),
    perda: numeroDaUrl(params, 'perda', 0, 0.2),
  };
  const ctx = contextoDaArena();
  const sala = new SalaArena(ctx, { semente: Date.now() % 100_000, versaoConteudo: versaoDoConteudo() });
  const rede = new RedeLocal(condicao, 2026);
  const conectar = (nome: string) => {
    const { cliente, servidor } = rede.conectar();
    ligarSala(sala, servidor);
    return new ClienteArena({ ctx, transporte: cliente, nome, pedidoFicha: { classeId: 'aventureiro' }, agoraMs });
  };
  const eu = conectar('Você');
  const outro = conectar('Bot');
  const bot = new BotDeArena(outro, 7, 0.6);

  // O bot só entra depois de você: assim você é sempre o jogador p1 da sala.
  eu.entrar();
  let botEntrou = false;
  await rodarArena({
    raiz,
    ctx,
    eu,
    latenciaSimuladaMs: condicao.latenciaMs,
    antesDoTick: (dtMs) => {
      rede.bombear(agoraMs());
      sala.tick(dtMs);
      if (!botEntrou && eu.conectado) {
        outro.entrar();
        botEntrou = true;
      }
      bot.agir();
      outro.passo();
    },
  });
}


/** Espera o bemVindo (ou a recusa da sala). */
async function esperarEntrada(eu: ClienteArena): Promise<void> {
  const inicio = Date.now();
  while (!eu.conectado && eu.erro === null && Date.now() - inicio < ESPERA_ENTRADA_MS) {
    await new Promise((r) => setTimeout(r, 30));
  }
  if (eu.erro !== null) throw new Error(eu.erro);
  if (!eu.conectado) throw new Error('sem_resposta');
}

/** Marco 17: pede o certificado da sala e grava o personagem no slot (devolve se gravou). */
async function guardarPersonagem(eu: ClienteArena, slot: number): Promise<boolean> {
  const certificado = await new Promise<Certificado | null>((resolver) => {
    const desistir = setTimeout(() => {
      resolver(null);
    }, ESPERA_CERTIFICADO_MS);
    eu.aoCertificado = (c) => {
      clearTimeout(desistir);
      resolver(c);
    };
    eu.pedirCertificado();
  });
  return certificado ? gravarCertificadoNoSlot(slot, certificado).catch(() => false) : false;
}

export function iniciarArenaOnline(raiz: HTMLElement): void {
  const servidor = enderecoDoServidor();
  const opcoes: OpcoesLobby = {
    raiz,
    servidor,
    aoEscolher: async (pedido: PedidoDeSala, slot: number | null) => {
      if (!servidor) return;
      // Marco 17: o personagem do slot é conferido pelo servidor antes de entrar (sem isso, ficha de treino).
      let pedidoFicha: unknown = { classeId: 'aventureiro' };
      if (slot !== null) {
        const r = await certificarSlot(servidor, slot);
        if (!r.ok) throw new Error(`certificado:${r.motivo}`);
        pedidoFicha = { certificado: r.certificado };
      }
      const conexao = await conectarArena(servidor, pedido);
      // A fase vem da sala (escolhida por quem criou): o contexto precisa ser o mesmo do servidor.
      const ctx = contextoDaArena('livre', conexao.fase);
      const eu = new ClienteArena({ ctx, transporte: conexao.transporte, nome: 'Você', pedidoFicha, agoraMs });
      eu.entrar();
      try {
        // Espera o bemVindo, para saber qual entidade é você antes de montar a cena.
        await esperarEntrada(eu);
      } catch (e) {
        conexao.transporte.fechar();
        throw e;
      }
      const sair = document.createElement('button');
      sair.type = 'button';
      sair.className = 'botao-cabecalho';
      sair.textContent = t('arena.salvarESair');
      sair.setAttribute('aria-label', t('arena.salvarESairRotulo'));
      const tela = await rodarArena({ raiz, ctx, eu, latenciaSimuladaMs: 0, codigo: conexao.codigo, acoesExtras: [sair] });
      sair.addEventListener('click', () => {
        sair.disabled = true;
        void (async () => {
          if (slot !== null) {
            const salvo = await guardarPersonagem(eu, slot);
            tela?.avisar(t(salvo ? 'arena.salvo' : 'arena.naoSalvo', { n: slot }));
            // Marco 17: sair da arena envia o slot para a nuvem (quando há conta; o certificado já veio da sala).
            if (salvo) await sincronizarSlot(slot);
          }
          conexao.transporte.fechar();
          setTimeout(() => {
            location.href = './?arena=online';
          }, 600);
        })();
      });
      // A cada 2 min, o slot recebe o personagem certificado (uma queda não perde o que a arena deu).
      if (slot !== null) {
        setInterval(() => {
          void guardarPersonagem(eu, slot);
        }, GRAVAR_A_CADA_MS);
      }
      // §4.12: reconexão amigável — mostra o estado em vez de cair para o menu.
      conexao.aoMudar((estado) => {
        tela?.avisar(t(`conexao.${estado}`));
      });
    },
  };
  mostrarLobby(opcoes);
}
