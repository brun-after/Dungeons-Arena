import { painelPersonagem, retratoPersonagem } from './ui/retrato-personagem';
import capaSelecao from './assets/dungeons-portao.webp';
import { normalizarCodigo } from './input/atalhos';
import { lerPreferencias } from './plataforma/preferencias';
import { ConsultaParty } from './plataforma/consulta-party';
// O modo Mundo no navegador (marco 29, 30/10/2026, D-128): `?jogo=mundo`. Exige a conta (o personagem mora no
// servidor); sem nuvem no build, vale a conta local do servidor de desenvolvimento. Fluxo:
// - a lista dos personagens do Mundo (separados da campanha), com jogar, excluir ou criar;
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
import { conectarMundo, personagensDoMundo, excluirPersonagemDoMundo, type PedidoDoMundo, type PersonagemDoMundo } from './plataforma/transporte-colyseus';
import { SLOTS_DO_MUNDO } from './mundo/ficha-mundo';
import { dialogo, paragrafo } from './ui/mundo-dialogos';
import { mostrarAviso } from './ui/aviso';
import { montarCena, type Cena } from './ui/cena';
import { criarPaineisDaEconomia } from './ui/mundo-economia';
import { abrirMapa, abrirPortal, criarFaixaDoLugar, textoDoAviso } from './ui/mundo-paineis';
import { criarAnuncioDeChefe } from './ui/anuncio-chefe';
import { criarRelogioDoMundo } from './ui/relogio-mundo';
import { criarPainelSocial } from './ui/mundo-social';
import { reinoDoConteudo } from './mundo/reino';
import { criarCondutor } from './ui/condutor';
import { criarEscolhaDeRenascer } from './ui/escolha-renascer';
import { criarGuiaMundo, criarOrientacaoMundo, esquecerLapide, marcarLapide, type OrientacaoMundo } from './ui/orientacao-mundo';
import { abrirPortalTemporario } from './ui/portal-mapa';
import { PORTAL_TEMPORARIO } from './mundo/objetos-mundo';
import type { ContextoSimulacao } from './core/contexto';
import { proximaEtapa } from './mundo/orientacao';
import { vigiaDaPassagem } from './ui/passagem-mundo';
import type { CenaDoMundo } from './ui/cena-mundo';
import { recorteDaVizinha } from './world/recorte-vizinha';
import { temaDaFase } from './combat/clima';
import { ENDERECO_DO_MENU } from './ui/menu';

// 09/11/2026 (D-144): 20 s (a sala nova pode estar nascendo: gerar a região leva tempo no servidor).
const ESPERA_ENTRADA_MS = 20_000;
/** Marco 41 (D-169): a cena nova aparece no máximo neste tempo, mesmo sem o personagem ou o chão prontos. */
const REVELAR_EM_MS = 4000;
const agoraMs = () => relogioDoNavegador.agoraMs();
const conteudo = conteudoOficial();
const modo = modoPorId(conteudo, MODO_MUNDO);
const reino = reinoDoConteudo(conteudo);
/** 09/11/2026 (D-143): o terreno das outras regiões para o mapa do Portal temporário (gerado pela mesma semente). */
const terrenos = new Map<string, ContextoSimulacao>();
function terrenoDe(id: string): ContextoSimulacao | null {
  const guardado = terrenos.get(id);
  if (guardado) return guardado;
  const l = lerLugar(reino, id);
  if (l?.tipo !== 'regiao') return null;
  const ctx = montarLugar(conteudo, reino, l, modo).ctx;
  if (terrenos.size > 6) terrenos.clear();
  terrenos.set(id, ctx);
  return ctx;
}

function tela(raiz: HTMLElement): HTMLElement {
  raiz.textContent = '';
  const el = document.createElement('section');
  el.className = 'tela-menu tela-mundo';
  const h = document.createElement('h1');
  h.textContent = t('mundo.titulo');
  const sub = document.createElement('p');
  sub.className = 'subtitulo-menu';
  sub.textContent = t('mundo.subtitulo');
  const voltar = voltarAoMenu();
  voltar.classList.add('voltar-selecao');
  el.append(voltar, h, sub);
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
  a.className = 'link-menu';
  a.href = ENDERECO_DO_MENU;
  a.textContent = t('mundo.voltar');
  return a;
}

function mostrarErro(raiz: HTMLElement, texto: string): void {
  const el = tela(raiz);
  const p = document.createElement('p');
  p.setAttribute('role', 'alert');
  p.textContent = texto;
  el.append(p);
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
    el.append(p, botao(t('mundo.entrarConta'), () => void nuvemDoBuild()?.entrar()));
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
  // D-205 (25/11/2026): a sala de seleção (entrega visual da VPS): o palco com o retrato do escolhido e o cartão dele
  // (jogar, excluir, a ficha e a aparência num recolhível), e os cinco espaços embaixo para escolher ou criar.
  el.classList.add('sala-selecao-mundo');
  el.style.setProperty('--capa-selecao', `url("${capaSelecao}")`);
  const grade = document.createElement('div');
  grade.className = 'mundo-grade-personagens';
  const palco = document.createElement('div');
  palco.className = 'mundo-palco';
  const selecao = document.createElement('nav');
  selecao.className = 'mundo-selecao-slots';
  selecao.setAttribute('aria-label', t('mundo.selecao.rotulo'));
  grade.append(palco, selecao);
  el.append(grade);
  const inicial = lista[0]?.slot ?? 1;
  for (let slot = 1; slot <= SLOTS_DO_MUNDO; slot++) {
    const p = lista.find((x) => x.slot === slot);
    const cartao = document.createElement('div');
    cartao.className = 'cartao-slot';
    const h = document.createElement('h2');
    h.textContent = p?.nome ?? t('mundo.selecao.criar');
    cartao.append(h);
    const classeEnivel = p ? t('mundo.selecao.classe', { classe: conteudo.classes.get(p.classeId)?.nome ?? p.classeId, nivel: p.nivel }) : '';
    let montar = () => { palco.replaceChildren(cartao); };
    if (p) {
      cartao.append(paragrafo(classeEnivel, 'mundo-classe-selecionada'));
      const resumo = document.createElement('p');
      resumo.className = 'resumo-slot';
      resumo.textContent = t('mundo.localDoPersonagem', { slot, vila: nomeDaVila(p.vilaSalva) });
      const jogar = botao(t('mundo.jogar'), () => {
        void jogarNoMundo(raiz, servidor, token, { lugar: `regiao:${p.vilaSalva}`, slot });
      });
      jogar.setAttribute('aria-label', t('mundo.jogarRotulo', { nome: p.nome }));
      const excluir = botao(t('mundo.excluir'), () => {
        const d = dialogo(t('mundo.excluirTitulo', { nome: p.nome }));
        d.corpo.append(paragrafo(t('mundo.excluirAviso', { nome: p.nome })));
        const rotulo = document.createElement('label');
        rotulo.className = 'campo-mundo';
        rotulo.textContent = t('mundo.excluirNome');
        const nome = document.createElement('input');
        nome.maxLength = 24;
        nome.autocomplete = 'off';
        rotulo.append(nome);
        const erro = paragrafo('');
        erro.setAttribute('role', 'alert');
        const confirmar = botao(t('mundo.excluirConfirmar'), () => {
          confirmar.disabled = true;
          nome.disabled = true;
          void excluirPersonagemDoMundo(servidor, token, slot, nome.value).then(() => {
            d.fechar();
            return iniciarMundo(raiz);
          }).catch((e: unknown) => {
            const motivo = e instanceof Error ? e.message : '';
            const chave = motivo === 'ja_jogando' ? 'mundo.excluirOnline' : motivo === 'mercado_pendente' ? 'mundo.excluirMercado' : 'mundo.excluirFalha';
            erro.textContent = t(chave);
            nome.disabled = false;
            confirmar.disabled = nome.value !== p.nome;
          });
        }, 'botao-menu botao-perigo');
        confirmar.disabled = true;
        nome.addEventListener('input', () => { confirmar.disabled = nome.value !== p.nome; });
        d.corpo.append(rotulo, erro, confirmar);
        nome.focus();
      }, 'botao-menu botao-perigo');
      excluir.setAttribute('aria-label', t('mundo.excluirTitulo', { nome: p.nome }));
      const acoes = document.createElement('div');
      acoes.className = 'acoes-slot';
      acoes.append(jogar, excluir);
      const ficha = document.createElement('details');
      ficha.className = 'mundo-ficha-selecionada';
      const abrirFicha = document.createElement('summary');
      abrirFicha.textContent = t('mundo.selecao.ficha');
      ficha.append(abrirFicha);
      // A troca de skin refaz o retrato do palco sem fechar a ficha.
      ficha.addEventListener('toggle', () => {
        if (ficha.open && ficha.childElementCount === 1) ficha.append(painelPersonagem(p.classeId, p.previa ? { ...p.previa, nivel: p.nivel } : undefined, { escolherSkin: true, atualizarRetratoExterno: () => { montar(); } }));
      });
      cartao.append(resumo, acoes, ficha);
      if (!p.previa?.atributos) cartao.append(paragrafo(t('mundo.selecao.semFicha')));
      montar = () => {
        const retrato = retratoPersonagem(p.classeId, p.previa);
        retrato.classList.add('mundo-retrato-palco');
        const anterior = palco.querySelector('.mundo-retrato-palco');
        if (anterior && cartao.parentElement === palco) anterior.replaceWith(retrato);
        else palco.replaceChildren(retrato, cartao);
      };
    } else {
      cartao.append(formularioDeCriacao(slot, (classeId, nome) => {
        void jogarNoMundo(raiz, servidor, token, { lugar: `regiao:${reino.inicio}`, slot, criar: { classeId, nome } });
      }));
    }
    const seletor = botao(p?.nome ?? t('mundo.selecao.vazio'), () => {
      for (const outro of selecao.querySelectorAll('button')) outro.setAttribute('aria-pressed', String(outro === seletor));
      montar();
    }, 'mundo-slot-seletor');
    seletor.setAttribute('aria-label', p ? t('mundo.selecao.escolher', { nome: p.nome }) : t('mundo.selecao.criarNo', { n: slot }));
    seletor.setAttribute('aria-pressed', 'false');
    const detalhe = document.createElement('small');
    detalhe.textContent = p ? classeEnivel : t('mundo.slot', { n: slot });
    seletor.append(detalhe);
    selecao.append(seletor);
    if (slot === inicial) seletor.click();
  }
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
  const previa = document.createElement('div');
  const atualizarPrevia = () => { previa.replaceChildren(painelPersonagem(classe.value, undefined, { escolherSkin: true })); };
  classe.addEventListener('change', atualizarPrevia);
  atualizarPrevia();
  form.append(previa, rotuloNome, nome, rotuloClasse, classe, enviar);
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    enviar.disabled = true;
    criar(classe.value, nome.value);
  });
  return form;
}

/**
 * Marco 41 (D-169): a cena de antes na troca de sala (sai quando a nova está pronta). Ela segue ligada até sair: a
 * vista dela (onde o jogador estava) é lida na hora em que a nova aparece, e as teclas mantidas passam para a nova.
 */
interface TrocaDeCena {
  tirar: () => void;
  cena: CenaDoMundo | null;
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

/** 09/11/2026 (D-144): as recusas que não melhoram tentando de novo (o resto é rede, sala nascendo ou saindo). */
const RECUSAS_DEFINITIVAS = ['sem_conta', 'sem_personagem', 'fora_da_vila_salva', 'bilhete_invalido'];
const TENTATIVAS_DE_ENTRADA = 3;

/**
 * 09/11/2026 (D-144): conecta com novas tentativas. A troca de sala caía na tela de erro por uma falha passageira
 * (a sala antiga ainda soltando o personagem, a nova nascendo, a rede do celular piscando).
 */
async function conectarComTentativas(servidor: string, token: string, pedido: PedidoDoMundo): Promise<Awaited<ReturnType<typeof conectarMundo>>> {
  let ultimoErro: unknown = null;
  for (let tentativa = 0; tentativa < TENTATIVAS_DE_ENTRADA; tentativa++) {
    if (tentativa > 0) await new Promise((r) => setTimeout(r, 600 * tentativa));
    try {
      return await conectarMundo(servidor, token, pedido);
    } catch (e) {
      ultimoErro = e;
      const texto = e instanceof Error ? e.message : '';
      if (RECUSAS_DEFINITIVAS.some((m) => texto.includes(m))) break;
    }
  }
  throw ultimoErro instanceof Error ? ultimoErro : new Error('falha');
}

/**
 * Entra num lugar e joga; a troca de sala chama de novo, com o bilhete. 09/11/2026 (D-144): o token é renovado a
 * cada entrada (o da nuvem vence em 1 h) e, se a viagem pelo bilhete falhar de vez, o personagem volta pela vila
 * salva (`vilaSalva`) em vez de cair na tela de erro.
 * Marco 41 (14/11/2026, D-169): na troca, a cena de antes fica na tela (parada no último quadro) enquanto a nova
 * conecta e monta escondida por cima; quando o personagem já está na sala nova, a nova aparece e a velha sai
 * (`troca`). Sem tela preta: na passagem entre as regiões, os dois mapas mostram o mesmo trecho, e a câmera começa
 * com o personagem no mesmo ponto da vista em que estava.
 */
async function jogarNoMundo(raiz: HTMLElement, servidor: string, tokenAntigo: string, pedido: PedidoDoMundo, orientacao: OrientacaoMundo = criarOrientacaoMundo(), vilaSalva: string | null = null, troca: TrocaDeCena | null = null): Promise<void> {
  const anterior = troca?.tirar ?? null;
  /** Tira a cena de antes (se ainda está na tela) e mostra o erro. */
  const falhar = (texto: string) => {
    anterior?.();
    mostrarErro(raiz, texto);
  };
  const lugar = lerLugar(reino, pedido.lugar);
  if (!lugar) {
    falhar(t('mundo.falha'));
    return;
  }
  const token = (await tokenDaConta().catch(() => null)) ?? tokenAntigo;
  if (!anterior) raiz.textContent = '';
  const nomeDoLugar = lugar.tipo === 'regiao' ? lugar.regiao.nome : lugar.tipo === 'masmorra' ? lugar.masmorra.nome : lugar.covil.nome;
  // A camada desta cena: escondida até o personagem chegar, por cima da de antes.
  const camada = document.createElement('div');
  camada.className = 'camada-mundo';
  if (anterior) camada.style.visibility = 'hidden';
  raiz.append(camada);
  if (!anterior) mostrarAviso(camada, pedido.bilhete ? t('mundo.trocando', { lugar: nomeDoLugar }) : t('mundo.conectando'), ESPERA_ENTRADA_MS);
  // Sem a viagem, a volta pela vila salva (a ficha já foi gravada pela sala anterior).
  const voltarPelaVila = (): boolean => {
    if (!pedido.bilhete || pedido.slot === undefined || !vilaSalva) return false;
    camada.remove();
    void jogarNoMundo(raiz, servidor, token, { lugar: `regiao:${vilaSalva}`, slot: pedido.slot }, orientacao, null, troca && { tirar: troca.tirar, cena: null });
    return true;
  };
  let conexao: Awaited<ReturnType<typeof conectarMundo>>;
  try {
    conexao = await conectarComTentativas(servidor, token, pedido);
  } catch (e) {
    if (voltarPelaVila()) return;
    falhar(motivoDoErro(e));
    return;
  }
  // D-169: o mapa da região pode já estar pronto (preparado enquanto se andava pela passagem).
  const ctx = (lugar.tipo === 'regiao' ? terrenoDe(pedido.lugar) : null) ?? montarLugar(conteudo, reino, lugar, modo).ctx;
  const eu = new ClienteArena({ ctx, transporte: conexao.transporte, nome: '', pedidoFicha: null, agoraMs });
  let visoesExternas: Extract<AvisoDoMundo, { tipo: 'visoesParty' }>['visoes'] = [];
  const consultaParty = new ConsultaParty();
  const pollingParty: { timer?: ReturnType<typeof setInterval> } = {};
  let membrosParty: Extract<AvisoDoMundo, { tipo: 'grupo' }>['membros'] = [];
  let ultimoLugar: Extract<AvisoDoMundo, { tipo: 'lugar' }> | null = null;
  const avisosAntes: AvisoDoMundo[] = [];
  eu.aoMundo = (a) => avisosAntes.push(a);
  eu.entrar();
  if (!(await esperarEntrada(eu))) {
    await conexao.encerrar();
    if (voltarPelaVila()) return;
    falhar(t('mundo.falha'));
    return;
  }

  const vazio = criarEstado({ semente: 0, faseId: ctx.fase.id });
  const monitor = new MonitorDeConexao();
  const faixa = criarFaixaDoLugar();
  const anuncioChefe = criarAnuncioDeChefe(); // Marco 53 (22/11/2026, D-203): o chefe que surge, em destaque.
  let pararLaco: (() => void) | null = null;
  let cena: Cena | null = null;
  let saindo = false;
  const avisar = (texto: string, ms?: number) => {
    mostrarAviso(camada.querySelector<HTMLElement>('.camada-ui') ?? camada, texto, ms);
  };
  const idDoJogador = () => eu.entidadeId ?? 'p1';
  const vilaSalvaAgora = (): string | null => ultimoLugar?.vilaSalva ?? vilaSalva;
  const estadoAtual = () => eu.previsto;
  const enviarAcao = (acao: AcaoDoMundo) => {
    eu.acaoDoMundo(acao);
  };
  // Marco 53 (22/11/2026, D-203): o condutor anda sozinho até o ponto do mapa ou atrás do companheiro seguido.
  const condutor = criarCondutor(() => ctx.fase, (cmd) => { eu.enviarComando(cmd); }, (c) => {
    if (c) avisar(c.tipo === 'seguir' ? t('mundo.condutor.seguindo', { nome: c.nome }) : t('mundo.condutor.indo'), 3500);
  });
  const social = criarPainelSocial({
    ctx, reino, estado: estadoAtual, idLocal: idDoJogador, enviar: enviarAcao, avisar: (texto) => { avisar(texto, 4000); },
    seguir: (nome) => { condutor.conduzir(nome ? { tipo: 'seguir', nome } : null); },
    seguindo: () => { const c = condutor.atual(); return c?.tipo === 'seguir' ? c.nome : null; },
  });
  const economia = criarPaineisDaEconomia({
    ctx,
    reino,
    eu: () => (eu.previsto ? (buscarEntidade(eu.previsto, idDoJogador()) ?? null) : null),
    enviar: enviarAcao,
    agoraMs: () => Date.now(),
  });
  // Marco 42 (15/11/2026, D-176): o relógio do dia e da noite.
  const relogio = criarRelogioDoMundo(ctx.balance.mundo.ciclo, (texto) => { avisar(texto, 4000); });
  const desmontar = () => {
    clearInterval(pollingParty.timer);
    relogio.destruir();
    pararLaco?.();
    cena?.desmontar();
    cena = null;
    removeEventListener('keydown', teclaMapa);
    document.querySelector('.mapa-expandido')?.remove();
  };
  const verMapa = () => {
    if (ultimoLugar) abrirMapa(reino, ultimoLugar.lugar, ultimoLugar.descobertas, ultimoLugar.vilaSalva, { ctx, estado: estadoAtual, idLocal: idDoJogador(), membros: membrosParty, orientacao, andar: (p) => { condutor.conduzir({ tipo: 'ponto', x: p.x, y: p.y }); } });
  };
  const teclaMapa = (ev: KeyboardEvent) => {
    // 19/11/2026 (D-187): a tecla do mapa vem das Configurações (o M, por padrão).
    if (normalizarCodigo(ev.code) === lerPreferencias().atalhos.mapa && !(ev.target instanceof HTMLInputElement)) verMapa();
  };

  const tratarAviso = (a: AvisoDoMundo) => {
    if (a.tipo === 'lugar') {
      ultimoLugar = a;
      enviarAcao({a:'grupo',op:'consultar'});
      faixa.mostrar(a);
      anuncioChefe.chegou();
      if (a.pvp) avisar(t('mundo.perigo.perigoso'), 6000);
    } else if (a.tipo === 'portais') {
      abrirPortal(a, Date.now(), (destino, pagamento) => {
        eu.viajar(destino, pagamento);
      });
    } else if (a.tipo === 'visoesParty') {
      consultaParty.concluir();
      visoesExternas = a.visoes;
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
      membrosParty = a.membros;
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
    } else if (a.tipo === 'portalAberto') {
      const nome = reino.regioes.find((r) => a.destino === `regiao:${r.id}`)?.nome ?? a.destino;
      avisar(t('mundo.portalT.aberto', { nome, s: Math.max(1, Math.round((a.fim - Date.now()) / 1000)) }), 5000);
    } else if (a.tipo === 'trocarSala') {
      if (saindo) return;
      saindo = true;
      // D-169: o laço para (o último quadro fica na tela); a cena só sai quando a nova estiver pronta.
      pararLaco?.();
      pararLaco = null;
      const tirar = () => {
        desmontar();
        camada.remove();
      };
      // A sala de antes já soltou o personagem: a nova conecta sem esperar o fechamento desta.
      void conexao.encerrar();
      void jogarNoMundo(raiz, servidor, token, { lugar: a.lugar, bilhete: a.bilhete, instancia: a.instancia, ...(pedido.slot !== undefined && { slot: pedido.slot }) }, orientacao, ultimoLugar?.vilaSalva ?? vilaSalva, { tirar, cena: cena?.mundo ?? null });
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

  // 09/11/2026 (D-143): o Portal temporário: escolhe a região e o ponto no mapa e confirma.
  const portal = document.createElement('button');
  portal.type = 'button';
  portal.className = 'botao-cabecalho';
  portal.textContent = t('mundo.portalT.botao');
  portal.title = t('mundo.portalT.dica');
  portal.addEventListener('click', () => {
    const j = eu.previsto ? buscarEntidade(eu.previsto, idDoJogador()) : undefined;
    const quantos = j?.bolsa?.mochila.filter((m) => m.itemId === PORTAL_TEMPORARIO).reduce((s, m) => s + m.qtd, 0) ?? 0;
    abrirPortalTemporario({
      reino, lugar: pedido.lugar, descobertas: ultimoLugar?.descobertas ?? [], orientacao, idLocal: idDoJogador(), estado: estadoAtual, quantos,
      ctxDe: (id) => (id === pedido.lugar ? ctx : terrenoDe(id)),
      abrir: (lugar, x, y) => { enviarAcao({ a: 'portal', lugar, x, y }); },
    });
  });

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
    raiz: camada,
    ctx,
    idLocal,
    estado: () => eu.previsto ?? vazio,
    emitir: (cmd) => {
      condutor.comandoDoJogador(cmd);
      eu.enviarComando(cmd);
    },
    acoesExtras: [mapa, portal, retorno, sair],
    pausaOJogo: false,
    partyMundo: true,
    destinoMapa: () => orientacao.destino ? proximaEtapa(reino, pedido.lugar, orientacao.destino, ctx.fase)?.ponto ?? null : null,
    visoesExternas: () => visoesExternas,
    acoesDaPausa: [{ rotulo: t('mundo.sairRotulo'), fazer: () => { sair.click(); } }],
    // Marco 38 (D-142): o mercado é uma loja só; o botão fecha a loja e pede os anúncios do reino.
    troca: troca?.cena ? { desvio: troca.cena.desvio(), teclas: troca.cena.teclas } : null,
    abrirAnuncios: () => {
      eu.enviarComando({ t: 'fecharLoja' });
      enviarAcao({ a: 'mercado', op: 'listar', pagina: 0, busca: '' });
    },
  });
  if (!cena) {
    anterior?.();
    camada.style.visibility = '';
    return;
  }
  const c = cena;
  const guia = criarGuiaMundo(orientacao, reino, pedido.lugar, ctx, idLocal, () => ultimoLugar?.descobertas ?? []);
  camada.querySelector('.camada-ui')?.append(faixa.elemento, anuncioChefe.elemento, relogio.elemento, social.elemento, guia.elemento);
  // Marco 53 (22/11/2026, D-203): morto fora de dungeon, a escolha de onde renascer.
  const nomeDaRegiao = (id: string | undefined) => reino.regioes.find((r) => r.id === id)?.nome ?? id ?? '';
  const renascer = criarEscolhaDeRenascer(camada.querySelector<HTMLElement>('.camada-ui') ?? camada, enviarAcao, () => ({
    save: nomeDaRegiao(vilaSalvaAgora() ?? undefined), central: nomeDaRegiao(reino.inicio),
  }));
  camada.querySelector('.cabecalho h1')?.remove();
  const mini = camada.querySelector<HTMLElement>('.minimapa');
  if (mini) {
    mini.style.pointerEvents = 'auto';
    mini.style.cursor = 'pointer';
    mini.tabIndex = 0;
    mini.setAttribute('role', 'button');
    mini.setAttribute('aria-label', t('mundo.mapa.rotulo'));
    mini.addEventListener('click', verMapa);
    mini.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); verMapa(); } });
  }
  pollingParty.timer = setInterval(() => {
    if (!lerPreferencias().visaoParty || membrosParty.length < 2 || document.hidden) {
      visoesExternas = [];
      return;
    }
    if (consultaParty.podeConsultar(agoraMs())) enviarAcao({ a: 'grupo', op: 'visoes' });
  }, 250);
  addEventListener('keydown', teclaMapa);
  eu.aoEventos = (eventos) => {
    for (const ev of eventos) {
      c.bus.emitir(ev.t, ev);
      const meu = 'id' in ev && ev.id === eu.entidadeId;
      if (ev.t === 'tumuloCriado' && meu) {
        // Marco 53 (22/11/2026, D-203): a escolha de onde renascer.
        renascer.abrir();
        // Marco 44 (15/11/2026, D-178): na noite fechada não fica túmulo (objetoId vazio).
        if (!ev.objetoId) avisar(t('mundo.semTumulo'), 6000);
        else {
          // 09/11/2026 (D-143): a lápide fica marcada no mapa e vira o destino da rota.
          marcarLapide(orientacao, pedido.lugar, { x: ev.x, y: ev.y }, ctx.balance.mundo.portalTemporario.lapideMin, Date.now());
          avisar(t('mundo.tumulo'), 6000);
        }
      } else if (ev.t === 'tumuloAberto' && meu) {
        // Marco 53 (D-203): recolheu o túmulo: a marca e a seta saem.
        esquecerLapide(orientacao);
      }
    }
  };
  eu.aoMundo = tratarAviso;
  for (const a of avisosAntes.splice(0)) tratarAviso(a);
  conexao.aoMudar((estado) => {
    if (saindo) return;
    avisar(t(`conexao.${estado}`));
    // Marco 53 (22/11/2026, D-203): a sala caiu de vez (o notebook dormiu, a aba ficou suspensa além da reserva):
    // o personagem volta sozinho pela vila salva, em vez de ficar parado numa tela sem conexão.
    const vila = ultimoLugar?.vilaSalva ?? vilaSalva;
    const slot = pedido.slot;
    if (estado !== 'encerrada' || slot === undefined || !vila) return;
    saindo = true;
    avisar(t('conexao.voltando'), 4000);
    setTimeout(() => {
      desmontar();
      camada.remove();
      void jogarNoMundo(raiz, servidor, token, { lugar: `regiao:${vila}`, slot }, orientacao);
    }, 1500);
  });
  // D-169: a cena de antes sai quando o personagem aparece aqui com o chão à vista pronto (ou em poucos segundos).
  // Na hora, o jogador volta ao ponto da vista em que estava na de antes (a câmera desliza dali até o centro).
  let antes = anterior;
  const revelar = () => {
    if (!antes && camada.style.visibility !== 'hidden') return;
    const desvio = troca?.cena?.desvio();
    if (desvio) c.mundo.recentrar(desvio);
    camada.style.visibility = '';
    antes?.();
    antes = null;
  };
  if (antes) setTimeout(revelar, REVELAR_EM_MS);
  // D-169: ao entrar numa passagem, o mapa de lá é preparado e o pedaço dele além da borda é desenhado.
  let vizinhaAtual = '';
  const vigia = vigiaDaPassagem(ctx.fase, (area) => {
    const ctxLa = area.destino ? terrenoDe(area.destino) : null;
    if (!ctxLa || !area.lado || vizinhaAtual === area.destino) return;
    vizinhaAtual = area.destino ?? '';
    c.mundo.vizinha(recorteDaVizinha(ctx.fase.largura, area.lado, ctxLa.fase), temaDaFase(ctxLa));
  }, (texto) => { avisar(texto, 3500); });
  pararLaco = iniciarLaco({
    simular: () => {
      eu.passo();
    },
    renderizar: (alpha) => {
      guia.atualizar(eu.previsto, agoraMs());
      if (eu.previsto) anuncioChefe.atualizar(eu.previsto, agoraMs());
      const id = eu.entidadeId ?? idLocal;
      const euAgora = eu.previsto ? buscarEntidade(eu.previsto, id) : undefined;
      condutor.atualizar(eu.previsto, euAgora, agoraMs());
      renascer.atualizar(euAgora?.morto ?? false);
      const conectado = eu.conectado && !!(eu.previsto && buscarEntidade(eu.previsto, id));
      if (monitor.atualizar(agoraMs(), eu.rttMs, conectado)) avisar(t('rede.instavel'));
      c.quadro({
        alpha,
        agoraMs: agoraMs(),
        posicao: (e) => (e.id === id ? eu.posicaoVisualPropria() : eu.posicaoRemota(e.id)) ?? { x: e.x, y: e.y },
        rede: { rttMs: eu.rttMs, latenciaSimuladaMs: 0, erroP95: 0, conectado,
          baseTick: eu.baseTick, tempoSemEstadoMs: eu.tempoSemEstadoMs, ressincronizacoes: eu.ressincronizacoes },
      });
      if (conectado && antes && c.mundo.chaoPronto()) revelar();
      vigia(eu.previsto ? buscarEntidade(eu.previsto, id) : undefined);
    },
    quadroPermitido: c.quadroPermitido,
  });
}
