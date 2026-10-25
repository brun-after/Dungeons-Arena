// Cena de jogo no navegador, compartilhada pela campanha e pela arena: palco, câmera, camadas do
// mundo, HUD, controles, cabeçalho, entrada e feedback. Quem chama decide de onde vem o estado
// (simulação local ou cliente de rede) e para onde vão os comandos.
// Marco 12 (14/10/2026): áudio, efeitos, luz, minimapa, prompt, pausa e configurações (ui/apresentacao.ts).
// Marco 13 (14/10/2026): visão de cima ou isométrica (ui/visao.ts), modelos de criatura e token por imagem.
// Marco 14 (14/10/2026): a barra de habilidades segue a barra escolhida do jogador (compilada pela chave dele)
// e os efeitos do HUD ganham duração e cartão.

import { proximoHostil, recargaRestante } from '../combat/acao';
import { celulaOcupada } from '../combat/geometria';
import type { Habilidade } from '../combat/habilidades';
import type { Dificuldade } from '../modos/dificuldade';
import { resolverHabilidade } from '../combat/compilar-habilidade';
import { habilidadeDoAtor } from '../combat/perfil';
import { dizimoErgue } from '../combat/necromancia';
import type { Celula, Comando } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import { Barramento } from '../core/events';
import type { EventosDaSimulacao } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import { SLOTS_BARRA, type Entidade, type PontoVisual } from '../entities/entidade';
import { t } from '../i18n';
import { ligarPonteiro } from '../input/ponteiro';
import { ligarTeclado, type Teclado } from '../input/teclado';
import { podeFerir } from '../modos/relacao';
import { consumiveisComAtalho } from '../progression/inventario';
import { detectarToque, sinaisDoNavegador } from '../plataforma/dispositivo';
import { gravarPreferencias, lerPreferencias, type Preferencias } from '../plataforma/preferencias';
import { prepararSessaoDeTela } from '../plataforma/sessao-tela';
import { Camera } from '../render/camera';
import { criarProjecao } from '../render/projecao';
import { definirCoresDosElementos } from '../render/adornos';
import { CamadaNumeros } from '../render/numeros';
import { CamadaFluxo } from '../render/fluxo';
import { CamadaObjetos } from '../render/objetos';
import { carregarTexturasDeIcones } from '../render/icones-textura';
import { CamadaPortas } from '../render/portas';
import { CamadaEntidades } from '../render/sprites';
import { criarPalco, type Palco } from '../render/stage';
import { CamadaTelegrafia } from '../render/telegrafia';
import { descreverAfinidade, dicaDoClima } from './descrever-elemento';
import { temaDaFase } from '../combat/clima';
import { criarTerreno } from '../render/terreno';
import type { TexturasTileset } from '../render/tileset-textura';
import { velocidade } from '../world/movimento';
import { faixaSuperior, mostrarAviso } from './aviso';
import { criarCabecalho } from './cabecalho';
import { criarBarraConsumiveis } from './consumiveis';
import { criarBotaoUltimate } from './ultimate';
import { cargaDe, ultimateDe } from '../combat/carga-ultimate';
import { criarControles, type Controles } from './controles';
import { Diagnostico, type DadosRede } from './diagnostico';
import { montarApresentacao } from './apresentacao';
import { ligarFeedback } from './feedback';
import { ligarFeedbackGrimorio } from './feedback-grimorio';
import { ligarCinematicaUltimate } from './cinematica-ultimate';
import { nuvemDoBuild } from '../plataforma/nuvem';
import type { AcaoDaPausa } from './pausa';
import { criarLoja } from './loja';
import { criarMochila } from './mochila';
import { DadoD20 } from './dado';
import { criarBarraHabilidades } from './habilidades';
import { criarSeletorBarra } from './seletor-barra';
import { Hud } from './hud';
import { identidadeDaClasse } from './barra-classe';
import { QuadroAlvo } from './quadro-alvo';
import { montarVisao, type ControleVisao } from './visao';

const LEITURA_FAIXA_MS = 1000;
/** Teclas 1–4 são das habilidades; as seguintes, dos consumíveis (D-050). */
// Marco 24 (D-094): 1–6 são as habilidades da barra; 7–9 e 0, os consumíveis.
const ATALHOS_DE_HABILIDADE = SLOTS_BARRA;

export interface OpcoesCena {
  raiz: HTMLElement;
  ctx: ContextoSimulacao;
  idLocal: string;
  /** Estado atual a desenhar (a arena troca o objeto a cada reconciliação). */
  estado: () => EstadoJogo;
  emitir: (cmd: Comando) => void;
  /** Botões extras no cabeçalho (ex.: "Menu" da campanha, que salva antes de sair). */
  acoesExtras?: HTMLElement[];
  /** Marco 12: a pausa para a simulação (campanha) ou só abre o menu (arena). */
  pausaOJogo?: boolean;
  /** Ações extras no menu de pausa (ex.: "Salvar e sair"). */
  acoesDaPausa?: AcaoDaPausa[];
  /** Marco 15: quem pode trocar a dificuldade (campanha solo e anfitrião do grupo). */
  dificuldade?: { atual: () => Dificuldade; definir: (d: Dificuldade) => void };
  /** Marco 11A (D-066): o tileset do jogador já carregado (só nas aventuras do editor). */
  tileset?: TexturasTileset | null;
  /** Marco 18: registrar a primeira descoberta do servidor na nuvem (a arena e os testes desligam). */
  nuvemDescobertas?: boolean;
}

export interface QuadroCena {
  alpha: number;
  agoraMs: number;
  /** Onde desenhar cada entidade. */
  posicao: (e: Entidade) => PontoVisual;
  aoRemover?: (id: string) => void;
  rede?: DadosRede;
}

export interface Cena {
  bus: Barramento<EventosDaSimulacao>;
  hud: Hud;
  quadro: (q: QuadroCena) => void;
  /** Marco 12: a simulação deve parar (campanha com a pausa aberta). */
  pausado: () => boolean;
  /** Marco 20: teto de fps escolhido nas Configurações (para o laço). */
  quadroPermitido: (agoraMs: number) => boolean;
  /** Marco 15: tira a cena da página (troca de fase no cooperativo, sem recarregar a conexão). */
  desmontar: () => void;
}

function div(classe: string): HTMLDivElement {
  const el = document.createElement('div');
  el.className = classe;
  return el;
}

/** Monta a cena. Retorna null se os gráficos não puderem iniciar (a mensagem já fica na tela). */
export async function montarCena(o: OpcoesCena): Promise<Cena | null> {
  const { ctx, idLocal, emitir } = o;
  const { fase } = ctx;
  const toque = detectarToque(sinaisDoNavegador());
  document.body.classList.toggle('toque', toque);
  const prefs = lerPreferencias();
  let aparencia: Preferencias = prefs;
  const jogador = () => o.estado().entidades.find((e) => e.id === idLocal);

  o.raiz.textContent = '';
  // Marco 16: os modais vão para o <body> (modal.ts); ao desmontar, saem os que esta cena criou.
  const modaisDeAntes = new Set(document.querySelectorAll('dialog.modal'));
  const host = div('palco');
  const ui = div('camada-ui');
  o.raiz.append(host, ui);
  let palco: Palco;
  try {
    palco = await criarPalco(host);
  } catch {
    const erro = div('erro');
    erro.setAttribute('role', 'alert');
    erro.textContent = t('erro.graficos');
    ui.append(erro);
    return null;
  }
  const encerrarSessaoDeTela = prepararSessaoDeTela(toque);

  const camera = new Camera(criarProjecao(prefs.visao, fase.largura, fase.altura), prefs.camera, toque);
  let visao: ControleVisao | null = null;
  const bus = new Barramento<EventosDaSimulacao>();
  let controles: Controles | null = null;
  const ap = montarApresentacao({
    ctx,
    palco,
    camera,
    ui,
    bus,
    estado: o.estado,
    idLocal,
    habilidades: (chave) => resolverHabilidade(ctx, chave),
    toque,
    pausaOJogo: o.pausaOJogo ?? false,
    acoesDaPausa: o.acoesDaPausa ?? [],
    dificuldade: o.dificuldade,
    aviso: (texto) => {
      mostrarAviso(ui, texto);
    },
    aoMudarPreferencias: (p) => {
      camera.modo = p.camera;
      controles?.trocarTipo(p.controle);
      if (p.sentidoToken !== aparencia.sentidoToken || p.tamanhoToken !== aparencia.tamanhoToken) sprites.reiniciarVisual();
      aparencia = p;
      visao?.definir(p.visao);
    },
  });
  const terreno = criarTerreno(palco.terreno, fase, o.tileset ?? null, temaDaFase(ctx));
  const projecao = () => camera.projecaoAtual;
  const sprites = new CamadaEntidades(palco.entidades, {
    idLocal,
    projecao,
    biblioteca: () => visao?.biblioteca() ?? null,
    tokenProprio: () => visao?.tokenProprio() ?? null,
    aparencia: () => ({ tamanho: aparencia.tamanhoToken, imagemOlhaEsquerda: aparencia.sentidoToken === 'esquerda' }),
    usarTiras: () => ap.qualidade().tiras,
    reduzido: () => ap.movimentoReduzido(),
    corElemento: (el) => Number.parseInt((ctx.conteudo.elementos.get(el)?.cor ?? '#ffffff').slice(1), 16),
    ajuste: (e, agoraMs) => ap.ajusteVisual(e, agoraMs),
  });
  const telegrafia = new CamadaTelegrafia(palco.chao, palco.voo, projecao, () => aparencia.areaExata, ap.particulas);
  await carregarTexturasDeIcones([...new Set([...ctx.conteudo.itens.values()].map((i) => i.icone)), 'pergaminho']);
  const objetos = new CamadaObjetos(
    palco.chao,
    (id) => ctx.conteudo.itens.get(id)?.raridade,
    ticksDe(ctx.balance.economia.bauCongelaMs),
    { camada: palco.entidades, projecao },
    (id) => ctx.conteudo.itens.get(id)?.icone,
  );
  const fluxo = new CamadaFluxo(palco.chao, () => ap.particulas.limite > 0, () => ticksDe(ctx.balance.armadilhas.desarmeMs));
  bus.on('armadilhaDisparou', (ev) => {
    if (ev.x !== undefined && ev.y !== undefined) fluxo.disparou(ev.x, ev.y, ev.tick);
  });
  const portas = new CamadaPortas(palco.chao, fase, ticksDe(ctx.balance.portas.janelaPortaBossMs));
  const numeros = new CamadaNumeros(palco.efeitos, ap.movimentoReduzido, projecao);
  visao = await montarVisao({
    palco,
    camera,
    fase,
    corParede: o.tileset?.corParede ?? temaDaFase(ctx)?.paleta.paredeTopo ?? null,
    aoTrocar: () => {
      sprites.reiniciarVisual();
      objetos.reiniciarVisual();
    },
  });
  const isometrico = () => camera.projecaoAtual.visao === 'iso';
  // Tecla V: alterna e guarda a escolha (a mesma das Configurações).
  const alternarVisao = () => {
    const nova = isometrico() ? 'cima' : 'iso';
    aparencia = { ...lerPreferencias(), visao: nova };
    gravarPreferencias(aparencia);
    visao.definir(nova);
  };
  const usarHabilidade = (id: string) => {
    emitir({ t: 'usarHabilidade', id });
  };

  // Toque ou clique num hostil seleciona e trava o alvo (no travado, destrava: D-065); em outra célula, vai até ela.
  const aoTocarCelula = (c: Celula) => {
    const local = jogador();
    const hostil = o.estado().entidades.find((e) => {
      const oc = celulaOcupada(e);
      return oc.x === c.x && oc.y === c.y && !!local && podeFerir(local, e, ctx.modo) && !e.morto;
    });
    if (!hostil) emitir({ t: 'irPara', x: c.x, y: c.y });
    else if (local?.alvoSelecionado === hostil.id && local.alvoTravado) emitir({ t: 'selecionarAlvo', alvo: hostil.id, travar: false });
    else emitir({ t: 'selecionarAlvo', alvo: hostil.id });
  };
  // Ajuste de 15/10/2026 (D-065): Q / botão de alvo trocam para o hostil seguinte (e travam); T / segurar o botão trava ou destrava.
  const trocarAlvo = (sentido: 1 | -1) => {
    const local = jogador();
    if (!local) return;
    const proximo = proximoHostil(o.estado(), ctx, local, local.alvoSelecionado, sentido, ctx.balance.combate.raioTrocaAlvo);
    if (proximo) emitir({ t: 'selecionarAlvo', alvo: proximo.id });
  };
  const travarAlvo = () => {
    const local = jogador();
    const atual = local?.alvoSelecionado ? o.estado().entidades.find((e) => e.id === local.alvoSelecionado && !e.morto) : undefined;
    if (local && atual) emitir({ t: 'selecionarAlvo', alvo: atual.id, travar: !local.alvoTravado });
    else trocarAlvo(1);
  };

  const dadosHabilidade = (id: string) => {
    const h = resolverHabilidade(ctx, id);
    return h ? { nome: h.nome, icone: h.icone } : null;
  };
  // Marco 18: as cores dos elementos para o brilho da arma elemental no token.
  definirCoresDosElementos((el) => {
    const cor = ctx.conteudo.elementos.get(el as never)?.cor;
    return cor ? Number.parseInt(cor.slice(1), 16) : null;
  });
  const hud = new Hud(ui, (id) => o.estado().entidades.find((e) => e.id === id)?.nome ?? null, dadosHabilidade);
  const corDoElemento = (h: Habilidade) => (h.elemento ? (ctx.conteudo.elementos.get(h.elemento)?.cor ?? null) : null);
  // D-067: o seletor rápido põe uma habilidade ativa conhecida na tecla do botão (clique direito ou toque longo).
  const seletor = criarSeletorBarra(ui, (slot, id) => { emitir({ t: 'equiparHabilidade', id, slot }); });
  const pedirTroca = (id: string | null, ancora: HTMLElement) => {
    const bolsa = jogador()?.bolsa;
    if (!bolsa) return;
    const slot = id ? bolsa.barra.indexOf(id) : bolsa.barra.indexOf(null);
    if (slot < 0) return;
    const opcoes = bolsa.conhecidas
      .map((c) => resolverHabilidade(ctx, c.id))
      .filter((h): h is Habilidade => !!h && !h.passiva)
      .map((h) => ({ id: h.id, nome: h.nome, icone: h.icone }));
    seletor.abrir(slot, id, opcoes, ancora);
  };
  const barra = criarBarraHabilidades(usarHabilidade, corDoElemento, pedirTroca);
  // Ajuste de 15/10/2026 (D-060): o d20 perto da barra (o chip do canto saiu).
  const dado = new DadoD20();
  ui.append(dado.elemento);
  const quadroAlvo = new QuadroAlvo((alvo) => descreverAfinidade(ctx, alvo));
  faixaSuperior(ui).append(quadroAlvo.elemento);
  // Marco 14: a barra é a do jogador (teclas 1–4), refeita quando muda (rank, caminho ou troca de tecla).
  let habilidadesDaBarra: (Habilidade | null)[] = [];
  let chaveDaBarra = '';
  const sincronizarBarra = (j: Entidade) => {
    const bolsa = j.bolsa;
    // Marco 24 (25/10/2026, D-094): com bolsa, a barra é posicional (a tecla é o espaço, mesmo com vazios antes).
    const habs = bolsa
      ? bolsa.barra.map((id) => (id && j.habilidades.includes(id) ? (habilidadeDoAtor(ctx, j, id) ?? null) : null))
      : j.habilidades.map((id) => habilidadeDoAtor(ctx, j, id) ?? null);
    const ativa = (id: string) => {
      const h = resolverHabilidade(ctx, id);
      return !!h && !h.passiva;
    };
    // D-067: o "+" aparece com tecla livre e alguma ativa conhecida fora da barra.
    const livre = !!bolsa?.barra.includes(null) && bolsa.conhecidas.some((c) => !bolsa.barra.includes(c.id) && ativa(c.id));
    const chave = `${habs.map((h) => h?.chave ?? '-').join('|')}/${livre}`;
    if (chave === chaveDaBarra) return;
    chaveDaBarra = chave;
    habilidadesDaBarra = habs;
    barra.definir(habs, livre);
  };
  // Marco 6: mochila e ficha. Ao abrir, o jogador para; enquanto aberta, o teclado não chega ao jogo.
  let teclado: Teclado | null = null;
  const mochila = criarMochila({
    ctx,
    jogador,
    emitir,
    estado: o.estado,
    toque,
    aoAbrir: () => {
      teclado?.soltarTudo();
      emitir({ t: 'mover', dir: 'parado' });
    },
  });
  // Marco 9A: a loja abre sozinha com a janela da simulação; a mochila fecha para dar lugar a ela.
  const loja = criarLoja({
    ctx,
    estado: o.estado,
    jogador,
    emitir,
    aoAbrir: () => {
      if (mochila.aberta()) mochila.alternar();
      teclado?.soltarTudo();
    },
  });
  // D-067: poções e pergaminhos à direita, sem abrir a mochila.
  const consumiveis = criarBarraConsumiveis(ctx, emitir, toque);
  ui.append(consumiveis.elemento);
  // Marco 24 (D-094): a ultimate pelo botão (anel de carga) e pela tecla R; o alvo dela é o selecionado.
  const usarUltimate = () => {
    const alvo = jogador()?.alvoSelecionado;
    emitir(alvo ? { t: 'usarUltimate', alvo } : { t: 'usarUltimate' });
  };
  const botaoUltimate = criarBotaoUltimate(usarUltimate);
  const alternarBasico = () => {
    emitir({ t: 'autoAtaque', ligado: !(jogador()?.autoAtaque ?? true) });
  };
  const usarAtalhoDeConsumivel = (n: number) => {
    const bolsa = jogador()?.bolsa;
    const entrada = bolsa ? consumiveisComAtalho(bolsa, ctx.conteudo.itens)[n] : undefined;
    if (entrada) emitir({ t: 'usarItem', invId: entrada.invId });
  };
  if (toque) {
    controles = criarControles({
      tipo: prefs.controle,
      aoMudarDirecao: (dir) => {
        emitir({ t: 'mover', dir });
      },
      principal: botaoUltimate.elemento,
      aoInteragir: () => {
        emitir({ t: 'interagir' });
      },
      aoTrocarAlvo: () => {
        trocarAlvo(1);
        // Marco 24 (D-097): tocar no alvo também liga o básico.
        emitir({ t: 'autoAtaque', ligado: true });
      },
      aoTravarAlvo: travarAlvo,
      aoPararAtaque: alternarBasico,
      isometrico,
    });
    controles.direita.append(barra.elemento);
    ui.append(controles.elemento);
  } else {
    // A barra se redesenha inteira; a ultimate fica ao lado dela, numa fila própria.
    const fila = document.createElement('div');
    fila.className = 'fila-barra';
    fila.append(barra.elemento, botaoUltimate.elemento);
    ui.append(fila);
  }
  ui.append(
    criarCabecalho({
      nomeFase: fase.nome,
      status: hud.status,
      acoesExtras: [mochila.botao, hud.botaoLog, ap.botaoPausa, ...(o.acoesExtras ?? [])],
    }),
  );
  const diag = Diagnostico.ativo() ? new Diagnostico() : null;
  if (diag) ui.append(diag.elemento);
  // Marco 16: o aviso de girar aparece em toda troca para retrato (não só ao montar).
  let retrato = innerHeight > innerWidth;
  if (toque && retrato) mostrarAviso(ui, t('aviso.girar'));

  // A câmera desconta a faixa de controles (§2.4), lida no máximo uma vez por segundo.
  let alturaFaixa = 0;
  let faixaLidaEm = -Infinity;
  const atualizarVista = () => {
    camera.definirVista({ largura: palco.largura(), altura: palco.altura() - alturaFaixa });
  };
  const lerFaixa = (agora: number) => {
    if (!controles || agora - faixaLidaEm < LEITURA_FAIXA_MS) return;
    faixaLidaEm = agora;
    const altura = controles.elemento.getBoundingClientRect().height;
    if (altura !== alturaFaixa) {
      alturaFaixa = altura;
      atualizarVista();
    }
  };
  // Ao mudar o tamanho (inclusive girar o aparelho), a câmera volta a enquadrar o jogador.
  const reenquadrar = () => {
    atualizarVista();
    const j = jogador();
    camera.centralizar(j ? { x: j.x, y: j.y } : (fase.spawns[0] ?? { x: 1, y: 1 }));
  };
  lerFaixa(performance.now());
  reenquadrar();
  let releitura: ReturnType<typeof setTimeout> | undefined;
  palco.aoRedimensionar(() => {
    reenquadrar();
    const agora = innerHeight > innerWidth;
    if (toque && agora && !retrato) mostrarAviso(ui, t('aviso.girar'));
    retrato = agora;
    // A faixa de controles muda de colunas ao girar: relê a altura 300 ms depois e enquadra de novo.
    clearTimeout(releitura);
    releitura = setTimeout(() => {
      faixaLidaEm = -Infinity;
      lerFaixa(performance.now());
      reenquadrar();
    }, 300);
  });

  teclado = ligarTeclado({
    aoMudarDirecao: (dir) => {
      emitir({ t: 'mover', dir });
    },
    aoAtacar: () => {
      emitir({ t: 'ataqueBasico' });
    },
    // 1–6: habilidades; 7–9 e 0: consumíveis na ordem da mochila (D-050, marco 24).
    aoAtalho: (indice) => {
      if (indice >= ATALHOS_DE_HABILIDADE) {
        usarAtalhoDeConsumivel(indice - ATALHOS_DE_HABILIDADE);
        return;
      }
      const h = habilidadesDaBarra[indice];
      if (h) usarHabilidade(h.id);
    },
    aoInteragir: () => {
      emitir({ t: 'interagir' });
    },
    aoDispensar: () => {
      emitir({ t: 'dispensar' });
    },
    aoAlternarVisao: alternarVisao,
    aoTrocarAlvo: trocarAlvo,
    aoTravarAlvo: travarAlvo,
    aoUltimate: usarUltimate,
    aoAlternarBasico: alternarBasico,
    // `Esc` contextual (§2.15): com alvo, cancela a mira; sem alvo, pausa (ou abre o menu, na arena).
    aoCancelar: () => {
      if (jogador()?.alvoSelecionado) emitir({ t: 'selecionarAlvo', alvo: null });
      else ap.abrirPausa();
    },
    isometrico,
    aoMochila: mochila.alternar,
    bloqueado: () => mochila.aberta() || loja.aberta() || ap.menuAberto() || seletor.aberto(),
  });
  ligarPonteiro(palco.canvas, { camera, aoIrPara: aoTocarCelula });
  palco.canvas.addEventListener('contextmenu', (ev) => {
    ev.preventDefault();
  });

  const feedback = ligarFeedback({
    bus,
    nomeHabilidade: (id) => dadosHabilidade(id)?.nome ?? id,
    estado: o.estado,
    idLocal,
    numeros,
    hud,
    agora: () => performance.now(),
    itens: ctx.conteudo.itens,
    aviso: (texto) => {
      mostrarAviso(ui, texto);
    },
    nomeDaHabilidade: (id) => resolverHabilidade(ctx, id)?.nome ?? id,
    dado,
    opostoDe: (el) => ctx.conteudo.afinidades.elementos.get(el)?.oposto,
  });
  // Marco 23 (D-092): o chip do tema e, ao entrar, o aviso do clima.
  const tema = temaDaFase(ctx);
  if (tema) {
    const dica = dicaDoClima(ctx);
    hud.mostrarTema(tema.nome, dica, tema.elemento);
    hud.registrar(dica ? t('log.temaClima', { nome: tema.nome, dica }) : t('log.tema', { nome: tema.nome }));
  }
  // Marco 18 (D-068 a D-070): combos, ressonâncias, missões, origens raras, forja e descobertas.
  ligarCinematicaUltimate(ui, bus, idLocal, (chave) => resolverHabilidade(ctx, chave));
  ligarFeedbackGrimorio({
    bus,
    ctx,
    idLocal,
    hud,
    numeros,
    agora: () => performance.now(),
    posicao: (id) => o.estado().entidades.find((x) => x.id === id) ?? null,
    aviso: (texto) => {
      mostrarAviso(ui, texto);
    },
    nuvem: o.nuvemDescobertas === false ? null : nuvemDoBuild(),
  });

  let ultimoQuadroMs = performance.now();
  let celulaCentralizada = false;
  const quadro = (q: QuadroCena) => {
    const estado = o.estado();
    const dtMs = q.agoraMs - ultimoQuadroMs;
    const dtS = Math.min(0.1, dtMs / 1000);
    ultimoQuadroMs = q.agoraMs;
    lerFaixa(q.agoraMs);

    const j = jogador();
    if (j) {
      // Na arena o jogador só existe depois do bemVindo: centraliza na primeira vez.
      if (!celulaCentralizada) {
        camera.centralizar({ x: j.x, y: j.y });
        celulaCentralizada = true;
      }
      camera.seguirCelula({ x: j.x, y: j.y });
      camera.atualizar(dtS, q.posicao(j), velocidade(j.atributos.destreza, ctx.balance.movimento.velocidadeBaseMs));
      sincronizarBarra(j);
      barra.atualizar((h) => ({
        recarga: h.recargaMs > 0 ? recargaRestante(estado, j.id, h.id) / ticksDe(h.recargaMs) : 0,
        semMana: j.mana < h.custoRecurso,
        // Marco 22 (D-090): sem morto ao alcance, o Dízimo vital ergue um; o botão mostra o ícone de invocar.
        ...(h.efeitos.some((ef) => ef.tipo === 'drenar_invocacao') && dizimoErgue(estado, ctx, j) && { icone: 'invocar', dica: t('habilidades.dizimoErgue') }),
      }));
    }
    hud.atualizar(j, estado.tick, identidadeDaClasse(ctx, j, estado.tick));
    feedback.conferirBasico();
    const alvo = j?.alvoSelecionado ? estado.entidades.find((e) => e.id === j.alvoSelecionado) : undefined;
    quadroAlvo.atualizar(j, alvo);
    controles?.marcarTrava(!!alvo && j?.alvoTravado === true);
    controles?.marcarBasico(j?.autoAtaque ?? true);
    if (j) {
      const u = ultimateDe(ctx, j);
      botaoUltimate.atualizar(cargaDe(j) / ctx.balance.ultimate.max, u ? (ctx.conteudo.definicoes.get(u.id)?.base.nome ?? u.id) : null);
    }
    dado.atualizar(q.agoraMs);
    mochila.atualizar();
    loja.atualizar();
    consumiveis.atualizar(j);
    if (q.rede) hud.mostrarRede(q.rede);
    // Marco 12: efeitos, som, luz, minimapa e prompt; o congelamento de impacto só segura o desenho.
    const congelado = ap.quadro(estado, q.agoraMs, dtMs, q.posicao);
    ap.aplicarCamera(q.agoraMs);
    terreno.atualizarVisibilidade(...camera.retanguloVisivel(palco.altura()));
    const reduzido = ap.movimentoReduzido();
    objetos.desenhar(estado, q.agoraMs, reduzido);
    portas.desenhar(estado, q.agoraMs, reduzido);
    fluxo.desenhar(estado, idLocal, ap.movimentoReduzido());
    if (!congelado) {
      telegrafia.desenhar(estado, ctx, idLocal, q.alpha);
      sprites.desenhar(estado, ctx, ap.posicaoVisual(q.posicao), q.alpha, q.agoraMs, q.aoRemover);
      numeros.atualizar(q.agoraMs);
    }
    palco.renderizar();

    diag?.quadro(q.agoraMs, () => {
      const p = j ? q.posicao(j) : { x: 0, y: 0 };
      return {
        tick: estado.tick,
        celula: { x: j?.x ?? 0, y: j?.y ?? 0 },
        tela: camera.paraTela(p.x, p.y),
        entidades: estado.entidades.length,
        impactos: feedback.impactos(),
        hp: j?.hp ?? 0,
        nivel: j?.nivel ?? 0,
        equipados: j?.bolsa ? Object.values(j.bolsa.equipamento).filter((i) => i !== null).length : 0,
        dificuldade: estado.dificuldade,
        zoom: camera.zoom,
        ...(q.rede && { rede: q.rede }),
      };
    });
  };
  return {
    bus,
    hud,
    quadro,
    pausado: ap.pausado,
    quadroPermitido: ap.quadroPermitido,
    desmontar: () => {
      clearTimeout(releitura);
      teclado.desligar();
      encerrarSessaoDeTela();
      hud.destruir();
      visao.destruir();
      ap.encerrar();
      for (const d of document.querySelectorAll('dialog.modal')) if (!modaisDeAntes.has(d)) d.remove();
      palco.destruir();
      o.raiz.textContent = '';
    },
  };
}
