// O modo Mundo no navegador (marco 29, 30/10/2026, D-128): `?jogo=mundo`. Exige a conta (o personagem mora no
// servidor); sem nuvem no build, vale a conta local do servidor de desenvolvimento. Fluxo:
// - a lista dos 3 personagens do Mundo (separados da campanha), com "Jogar" ou o formulário de criação;
// - a entrada na vila salva; a sala do servidor decide tudo (a mesma cena da campanha, com o estado da rede);
// - a troca de sala (borda, porta, saída da dungeon, portal, renascer na vila) sem recarregar a página: a cena é
//   desmontada, a conexão nova entra com o bilhete e o contexto do lugar é gerado aqui pela mesma semente.
// Marco 30 (30/10/2026, D-129): o painel social (grupo e chat) e os diálogos do quadro, do banco, do mercado e da
// troca, todos respondendo aos avisos da sala.

import { conteudoOficial, modoPorId } from './core/conteudo';
import { buscarEntidade, criarEstado } from './core/estado';
import { t, type ChaveTexto } from './i18n';
import type { AcaoDoMundo } from './mundo/acoes';
import type { AvisoDoMundo } from './mundo/avisos';
import { lerLugar, montarLugar } from './mundo/lugares';
import { MODO_MUNDO } from './mundo/sala-mundo';
import { ClienteArena } from './net/cliente';
import { MonitorDeConexao } from './net/qualidade';
import { iniciarLaco, relogioDoNavegador } from './plataforma/laco-navegador';
import { nuvemDoBuild } from './plataforma/nuvem';
import { enderecoDoServidor } from './plataforma/servidor';
import { sairDaTelaCheia } from './plataforma/sessao-tela';
import { conectarMundo, personagensDoMundo, type PedidoDoMundo, type PersonagemDoMundo } from './plataforma/transporte-colyseus';
import { mostrarAviso } from './ui/aviso';
import { montarCena, type Cena } from './ui/cena';
import { criarPaineisDaEconomia } from './ui/mundo-economia';
import { abrirMapa, abrirPortal, criarFaixaDoLugar, textoDoAviso } from './ui/mundo-paineis';
import { criarPainelSocial } from './ui/mundo-social';
import { reinoDoConteudo } from './mundo/reino';

const ESPERA_ENTRADA_MS = 10_000;
const agoraMs = () => relogioDoNavegador.agoraMs();
const conteudo = conteudoOficial();
const modo = modoPorId(conteudo, MODO_MUNDO);
const reino = reinoDoConteudo(conteudo);

function tela(raiz: HTMLElement): HTMLElement {
  raiz.textContent = '';
  const el = document.createElement('section');
  el.className = 'tela-menu';
  const h = document.createElement('h1');
  h.textContent = t('mundo.titulo');
  const sub = document.createElement('p');
  sub.className = 'subtitulo-menu';
  sub.textContent = t('mundo.subtitulo');
  el.append(h, sub);
  raiz.append(el);
  return el;
}

function botao(texto: string, fazer: () => void, classe = 'botao-menu'): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = classe;
  b.textContent = texto;
  b.addEventListener('click', fazer);
  return b;
}

function voltarAoMenu(): HTMLAnchorElement {
  const a = document.createElement('a');
  a.className = 'botao-menu';
  a.href = './';
  a.textContent = t('mundo.voltar');
  return a;
}

function mostrarErro(raiz: HTMLElement, texto: string): void {
  const el = tela(raiz);
  const p = document.createElement('p');
  p.setAttribute('role', 'alert');
  p.textContent = texto;
  el.append(p, voltarAoMenu());
}

/** A conta local do servidor sem nuvem (desenvolvimento): um id por aparelho. */
function contaLocal(): string {
  try {
    const guardado = localStorage.getItem('dungeons-arena:mundo-local');
    if (guardado) return guardado;
    const novo = Math.random().toString(36).slice(2, 12);
    localStorage.setItem('dungeons-arena:mundo-local', novo);
    return novo;
  } catch {
    return 'aparelho';
  }
}

/** O token da conta: o da nuvem do build; sem nuvem, a conta local do servidor de desenvolvimento (null: sem login). */
async function tokenDaConta(): Promise<string | null> {
  const nuvem = nuvemDoBuild();
  return nuvem ? await nuvem.token() : `local:${contaLocal()}`;
}

function nomeDaClasse(id: string): string {
  return conteudo.classes.get(id)?.nome ?? id;
}

function nomeDaVila(id: string): string {
  const r = reino.regioes.find((x) => x.id === id);
  return r?.vila?.nome ?? r?.nome ?? id;
}

export async function iniciarMundo(raiz: HTMLElement): Promise<void> {
  const servidor = enderecoDoServidor();
  if (!servidor) {
    mostrarErro(raiz, t('mundo.semServidor'));
    return;
  }
  const token = await tokenDaConta();
  if (token === null) {
    const el = tela(raiz);
    const p = document.createElement('p');
    p.textContent = t('mundo.precisaConta');
    el.append(p, botao(t('mundo.entrarConta'), () => void nuvemDoBuild()?.entrar()), voltarAoMenu());
    return;
  }
  const el = tela(raiz);
  const carregando = document.createElement('p');
  carregando.textContent = t('mundo.carregando');
  el.append(carregando);
  let lista: PersonagemDoMundo[];
  try {
    lista = await personagensDoMundo(servidor, token);
  } catch {
    mostrarErro(raiz, t('mundo.falhaLista'));
    return;
  }
  carregando.remove();
  for (let slot = 1; slot <= 3; slot++) {
    const p = lista.find((x) => x.slot === slot);
    const cartao = document.createElement('div');
    cartao.className = 'cartao-slot';
    const h = document.createElement('h2');
    h.textContent = t('mundo.slot', { n: slot });
    cartao.append(h);
    if (p) {
      const resumo = document.createElement('p');
      resumo.className = 'resumo-slot';
      resumo.textContent = t('mundo.resumo', { nome: p.nome, classe: nomeDaClasse(p.classeId), nivel: p.nivel, vila: nomeDaVila(p.vilaSalva) });
      const jogar = botao(t('mundo.jogar'), () => {
        void jogarNoMundo(raiz, servidor, token, { lugar: `regiao:${p.vilaSalva}`, slot });
      });
      jogar.setAttribute('aria-label', t('mundo.jogarRotulo', { nome: p.nome }));
      cartao.append(resumo, jogar);
    } else {
      cartao.append(formularioDeCriacao(slot, (classeId, nome) => {
        void jogarNoMundo(raiz, servidor, token, { lugar: `regiao:${reino.inicio}`, slot, criar: { classeId, nome } });
      }));
    }
    el.append(cartao);
  }
  el.append(voltarAoMenu());
}

function formularioDeCriacao(slot: number, criar: (classeId: string, nome: string) => void): HTMLElement {
  const form = document.createElement('form');
  form.className = 'form-mundo';
  const rotuloNome = document.createElement('label');
  rotuloNome.textContent = t('mundo.nome');
  const nome = document.createElement('input');
  nome.maxLength = 24;
  nome.id = `mundo-nome-${String(slot)}`;
  rotuloNome.htmlFor = nome.id;
  const rotuloClasse = document.createElement('label');
  rotuloClasse.textContent = t('mundo.classe');
  const classe = document.createElement('select');
  classe.id = `mundo-classe-${String(slot)}`;
  rotuloClasse.htmlFor = classe.id;
  for (const c of conteudo.classes.values()) {
    const op = document.createElement('option');
    op.value = c.id;
    op.textContent = c.nome;
    classe.append(op);
  }
  const enviar = document.createElement('button');
  enviar.type = 'submit';
  enviar.className = 'botao-menu';
  enviar.textContent = t('mundo.comecar');
  form.append(rotuloNome, nome, rotuloClasse, classe, enviar);
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    enviar.disabled = true;
    criar(classe.value, nome.value);
  });
  return form;
}

/** Espera o bemVindo (ou a recusa) da sala. */
async function esperarEntrada(eu: ClienteArena): Promise<boolean> {
  const inicio = Date.now();
  while (!eu.conectado && eu.erro === null && Date.now() - inicio < ESPERA_ENTRADA_MS) {
    await new Promise((r) => setTimeout(r, 30));
  }
  return eu.conectado;
}

function motivoDoErro(e: unknown): string {
  const texto = e instanceof Error ? e.message : '';
  const conhecido = ['sem_conta', 'ja_jogando', 'sem_personagem', 'fora_da_vila_salva', 'bilhete_invalido'].find((m) => texto.includes(m));
  return conhecido ? t(`mundo.erro.${conhecido}` as ChaveTexto) : t('mundo.falha');
}

/** Entra num lugar e joga; a troca de sala chama de novo, com o bilhete. */
async function jogarNoMundo(raiz: HTMLElement, servidor: string, token: string, pedido: PedidoDoMundo): Promise<void> {
  const lugar = lerLugar(reino, pedido.lugar);
  if (!lugar) {
    mostrarErro(raiz, t('mundo.falha'));
    return;
  }
  raiz.textContent = '';
  const nomeDoLugar = lugar.tipo === 'regiao' ? lugar.regiao.nome : lugar.tipo === 'masmorra' ? lugar.masmorra.nome : lugar.covil.nome;
  mostrarAviso(raiz, pedido.bilhete ? t('mundo.trocando', { lugar: nomeDoLugar }) : t('mundo.conectando'), ESPERA_ENTRADA_MS);
  let conexao: Awaited<ReturnType<typeof conectarMundo>>;
  try {
    conexao = await conectarMundo(servidor, token, pedido);
  } catch (e) {
    mostrarErro(raiz, motivoDoErro(e));
    return;
  }
  const ctx = montarLugar(conteudo, reino, lugar, modo).ctx;
  const eu = new ClienteArena({ ctx, transporte: conexao.transporte, nome: '', pedidoFicha: null, agoraMs });
  let ultimoLugar: Extract<AvisoDoMundo, { tipo: 'lugar' }> | null = null;
  const avisosAntes: AvisoDoMundo[] = [];
  eu.aoMundo = (a) => avisosAntes.push(a);
  eu.entrar();
  if (!(await esperarEntrada(eu))) {
    conexao.transporte.fechar();
    mostrarErro(raiz, t('mundo.falha'));
    return;
  }

  const vazio = criarEstado({ semente: 0, faseId: ctx.fase.id });
  const monitor = new MonitorDeConexao();
  const faixa = criarFaixaDoLugar();
  let pararLaco: (() => void) | null = null;
  let cena: Cena | null = null;
  let saindo = false;
  const avisar = (texto: string, ms?: number) => {
    mostrarAviso(raiz.querySelector<HTMLElement>('.camada-ui') ?? raiz, texto, ms);
  };
  const idDoJogador = () => eu.entidadeId ?? 'p1';
  const estadoAtual = () => eu.previsto;
  const enviarAcao = (acao: AcaoDoMundo) => {
    eu.acaoDoMundo(acao);
  };
  const social = criarPainelSocial({ ctx, reino, estado: estadoAtual, idLocal: idDoJogador, enviar: enviarAcao, avisar: (texto) => { avisar(texto, 4000); } });
  const economia = criarPaineisDaEconomia({
    ctx,
    reino,
    eu: () => (eu.previsto ? (buscarEntidade(eu.previsto, idDoJogador()) ?? null) : null),
    enviar: enviarAcao,
    agoraMs: () => Date.now(),
  });
  const desmontar = () => {
    pararLaco?.();
    cena?.desmontar();
    cena = null;
    removeEventListener('keydown', teclaMapa);
  };
  const verMapa = () => {
    if (ultimoLugar) abrirMapa(reino, ultimoLugar.lugar, ultimoLugar.descobertas, ultimoLugar.vilaSalva);
  };
  const teclaMapa = (ev: KeyboardEvent) => {
    if ((ev.key === 'm' || ev.key === 'M') && !(ev.target instanceof HTMLInputElement)) verMapa();
  };

  const tratarAviso = (a: AvisoDoMundo) => {
    if (a.tipo === 'lugar') {
      ultimoLugar = a;
      faixa.mostrar(a);
      if (a.pvp) avisar(t('mundo.perigo.perigoso'), 6000);
    } else if (a.tipo === 'portais') {
      abrirPortal(a, Date.now(), (destino, pagamento) => {
        eu.viajar(destino, pagamento);
      });
    } else if (a.tipo === 'quadro') {
      economia.quadro(a);
    } else if (a.tipo === 'banco') {
      economia.banco(a);
    } else if (a.tipo === 'mercado') {
      economia.mercado(a);
    } else if (a.tipo === 'missao') {
      avisar(economia.missao(a), 4000);
    } else if (a.tipo === 'chat') {
      social.chat(a);
    } else if (a.tipo === 'grupo') {
      social.grupo(a);
    } else if (a.tipo === 'convite') {
      social.convite(a);
    } else if (a.tipo === 'troca') {
      social.troca(a);
    } else if (a.tipo === 'evento') {
      // Marco 30 (D-129): o evento da região vai para o chat (canal do Mundo) e para a faixa de avisos.
      const min = Math.max(1, Math.round((a.fim - Date.now()) / 60_000));
      const texto = a.evento ? t(`mundo.evento.${a.evento}` as ChaveTexto, { min, pct: ctx.balance.mundo.eventos.luaLootPct }) : t('mundo.evento.fim');
      social.chat({ tipo: 'chat', canal: 'sistema', de: '', texto });
      avisar(texto, 6000);
    } else if (a.tipo === 'trocarSala') {
      if (saindo) return;
      saindo = true;
      desmontar();
      void conexao.encerrar().finally(() => {
        void jogarNoMundo(raiz, servidor, token, { lugar: a.lugar, bilhete: a.bilhete, instancia: a.instancia });
      });
    } else {
      const texto = textoDoAviso(a);
      if (texto) avisar(texto, 4000);
    }
  };

  const sair = document.createElement('button');
  sair.type = 'button';
  sair.className = 'botao-cabecalho';
  sair.textContent = t('mundo.sair');
  sair.setAttribute('aria-label', t('mundo.sairRotulo'));
  sair.addEventListener('click', () => {
    saindo = true;
    sair.disabled = true;
    sairDaTelaCheia();
    desmontar();
    void conexao.encerrar().finally(() => {
      location.href = './?jogo=mundo';
    });
  });
  const mapa = document.createElement('button');
  mapa.type = 'button';
  mapa.className = 'botao-cabecalho';
  mapa.textContent = t('mundo.mapa.botao');
  mapa.setAttribute('aria-label', t('mundo.mapa.rotulo'));
  mapa.addEventListener('click', verMapa);

  const retorno = document.createElement('button');
  retorno.type = 'button';
  retorno.className = 'botao-cabecalho';
  retorno.textContent = t('mundo.retorno.botao');
  retorno.title = t('mundo.retorno.dica');
  retorno.addEventListener('click', () => {
    eu.viajar('ultima_vila_salva', 'pergaminho');
  });

  const idLocal = eu.entidadeId ?? 'p1';
  cena = await montarCena({
    raiz,
    ctx,
    idLocal,
    estado: () => eu.previsto ?? vazio,
    emitir: (cmd) => {
      eu.enviarComando(cmd);
    },
    acoesExtras: [mapa, retorno, sair],
    pausaOJogo: false,
    acoesDaPausa: [{ rotulo: t('mundo.sairRotulo'), fazer: () => { sair.click(); } }],
  });
  if (!cena) return;
  const c = cena;
  raiz.querySelector('.camada-ui')?.append(faixa.elemento, social.elemento);
  social.ajustarAoToque();
  addEventListener('keydown', teclaMapa);
  eu.aoEventos = (eventos) => {
    for (const ev of eventos) {
      c.bus.emitir(ev.t, ev);
      if (ev.t === 'tumuloCriado' && ev.id === eu.entidadeId) avisar(t('mundo.tumulo'), 6000);
    }
  };
  eu.aoMundo = tratarAviso;
  for (const a of avisosAntes.splice(0)) tratarAviso(a);
  conexao.aoMudar((estado) => {
    if (!saindo) avisar(t(`conexao.${estado}`));
  });
  pararLaco = iniciarLaco({
    simular: () => {
      eu.passo();
    },
    renderizar: (alpha) => {
      const id = eu.entidadeId ?? idLocal;
      const conectado = eu.conectado && !!(eu.previsto && buscarEntidade(eu.previsto, id));
      if (monitor.atualizar(agoraMs(), eu.rttMs, conectado)) avisar(t('rede.instavel'));
      c.quadro({
        alpha,
        agoraMs: agoraMs(),
        posicao: (e) => (e.id === id ? eu.posicaoVisualPropria() : eu.posicaoRemota(e.id)) ?? { x: e.x, y: e.y },
        rede: { rttMs: eu.rttMs, latenciaSimuladaMs: 0, erroP95: 0, conectado },
      });
    },
    quadroPermitido: c.quadroPermitido,
  });
}
