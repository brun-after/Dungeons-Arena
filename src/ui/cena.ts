// Cena de jogo no navegador, compartilhada pela campanha e pela arena: palco, câmera, camadas do
// mundo, HUD, controles, cabeçalho, entrada e feedback. Quem chama decide de onde vem o estado
// (simulação local ou cliente de rede) e para onde vão os comandos.
// Marco 12 (14/10/2026): áudio, efeitos, luz, minimapa, prompt, pausa e configurações (ui/apresentacao.ts).

import { recargaRestante } from '../combat/acao';
import { celulaOcupada } from '../combat/geometria';
import type { Habilidade } from '../combat/habilidades';
import type { Celula, Comando } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import { Barramento } from '../core/events';
import type { EventosDaSimulacao } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import type { Entidade, PontoVisual } from '../entities/entidade';
import { t } from '../i18n';
import { ligarPonteiro } from '../input/ponteiro';
import { ligarTeclado, type Teclado } from '../input/teclado';
import { podeFerir } from '../modos/relacao';
import { consumiveisComAtalho } from '../progression/inventario';
import { detectarToque, sinaisDoNavegador } from '../plataforma/dispositivo';
import { lerPreferencias } from '../plataforma/preferencias';
import { prepararSessaoDeTela } from '../plataforma/sessao-tela';
import { Camera } from '../render/camera';
import { CELULA_PX } from '../render/camera-calculo';
import { CamadaNumeros } from '../render/numeros';
import { CamadaFluxo } from '../render/fluxo';
import { CamadaObjetos } from '../render/objetos';
import { CamadaPortas } from '../render/portas';
import { CamadaEntidades } from '../render/sprites';
import { criarPalco, type Palco } from '../render/stage';
import { CamadaTelegrafia } from '../render/telegrafia';
import { criarTerreno } from '../render/terreno';
import { velocidade } from '../world/movimento';
import { mostrarAviso } from './aviso';
import { criarCabecalho } from './cabecalho';
import { criarControles, type Controles } from './controles';
import { Diagnostico, type DadosRede } from './diagnostico';
import { montarApresentacao } from './apresentacao';
import { ligarFeedback } from './feedback';
import type { AcaoDaPausa } from './pausa';
import { criarLoja } from './loja';
import { criarMochila } from './mochila';
import { criarBarraHabilidades } from './habilidades';
import { Hud } from './hud';

const LEITURA_FAIXA_MS = 1000;
/** Teclas 1–4 são das habilidades; as seguintes, dos consumíveis (D-050). */
const ATALHOS_DE_HABILIDADE = 4;

export interface OpcoesCena {
  raiz: HTMLElement;
  ctx: ContextoSimulacao;
  idLocal: string;
  habilidades: readonly Habilidade[];
  /** Estado atual a desenhar (a arena troca o objeto a cada reconciliação). */
  estado: () => EstadoJogo;
  emitir: (cmd: Comando) => void;
  /** Botões extras no cabeçalho (ex.: "Menu" da campanha, que salva antes de sair). */
  acoesExtras?: HTMLElement[];
  /** Marco 12: a pausa para a simulação (campanha) ou só abre o menu (arena). */
  pausaOJogo?: boolean;
  /** Ações extras no menu de pausa (ex.: "Salvar e sair"). */
  acoesDaPausa?: AcaoDaPausa[];
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
  const jogador = () => o.estado().entidades.find((e) => e.id === idLocal);

  o.raiz.textContent = '';
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
  prepararSessaoDeTela(toque);

  const camera = new Camera(fase.largura * CELULA_PX, fase.altura * CELULA_PX, prefs.camera, toque);
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
    habilidades: ctx.conteudo.habilidades,
    toque,
    pausaOJogo: o.pausaOJogo ?? false,
    acoesDaPausa: o.acoesDaPausa ?? [],
    aviso: (texto) => {
      mostrarAviso(ui, texto);
    },
    aoMudarPreferencias: (p) => {
      camera.modo = p.camera;
      controles?.trocarTipo(p.controle);
    },
  });
  const terreno = criarTerreno(palco.terreno, fase);
  const sprites = new CamadaEntidades(palco.entidades, idLocal);
  const telegrafia = new CamadaTelegrafia(palco.chao, palco.voo);
  const objetos = new CamadaObjetos(palco.chao, (id) => ctx.conteudo.itens.get(id)?.raridade, ticksDe(ctx.balance.economia.bauCongelaMs), {
    curto: ticksDe(ctx.balance.descanso.curtoMs),
    longo: ticksDe(ctx.balance.descanso.longoMs),
  });
  const fluxo = new CamadaFluxo(palco.chao);
  const portas = new CamadaPortas(palco.chao, fase, ticksDe(ctx.balance.portas.janelaPortaBossMs));
  const numeros = new CamadaNumeros(palco.efeitos, ap.movimentoReduzido);
  const isometrico = () => false; // a visão isométrica entra no marco 13
  const usarHabilidade = (id: string) => {
    emitir({ t: 'usarHabilidade', id });
  };

  // Toque ou clique num hostil seleciona o alvo; em qualquer outra célula, vai até ela.
  const aoTocarCelula = (c: Celula) => {
    const local = jogador();
    const hostil = o.estado().entidades.find((e) => {
      const oc = celulaOcupada(e);
      return oc.x === c.x && oc.y === c.y && !!local && podeFerir(local, e, ctx.modo) && !e.morto;
    });
    emitir(hostil ? { t: 'selecionarAlvo', alvo: hostil.id } : { t: 'irPara', x: c.x, y: c.y });
  };

  const hud = new Hud(ui);
  const barra = criarBarraHabilidades(o.habilidades, usarHabilidade);
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
      aoAtacar: () => {
        emitir({ t: 'ataqueBasico' });
      },
      aoInteragir: () => {
        emitir({ t: 'interagir' });
      },
      isometrico,
    });
    controles.direita.append(barra.elemento);
    ui.append(controles.elemento);
  } else {
    ui.append(barra.elemento);
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
  if (toque && innerHeight > innerWidth) mostrarAviso(ui, t('aviso.girar'));

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
  palco.aoRedimensionar(reenquadrar);

  teclado = ligarTeclado({
    aoMudarDirecao: (dir) => {
      emitir({ t: 'mover', dir });
    },
    aoAtacar: () => {
      emitir({ t: 'ataqueBasico' });
    },
    // 1–4: habilidades; 5–9 e 0: consumíveis na ordem da mochila (D-050).
    aoAtalho: (indice) => {
      if (indice >= ATALHOS_DE_HABILIDADE) {
        usarAtalhoDeConsumivel(indice - ATALHOS_DE_HABILIDADE);
        return;
      }
      const h = o.habilidades[indice];
      if (h) usarHabilidade(h.id);
    },
    aoInteragir: () => {
      emitir({ t: 'interagir' });
    },
    aoDescansar: (longo) => {
      emitir({ t: 'descansar', tipo: longo ? 'longo' : 'curto' });
    },
    aoDispensar: () => {
      emitir({ t: 'dispensar' });
    },
    // `Esc` contextual (§2.15): com alvo, cancela a mira; sem alvo, pausa (ou abre o menu, na arena).
    aoCancelar: () => {
      if (jogador()?.alvoSelecionado) emitir({ t: 'selecionarAlvo', alvo: null });
      else ap.abrirPausa();
    },
    isometrico,
    aoMochila: mochila.alternar,
    bloqueado: () => mochila.aberta() || loja.aberta() || ap.menuAberto(),
  });
  ligarPonteiro(palco.canvas, { camera, aoIrPara: aoTocarCelula });
  palco.canvas.addEventListener('contextmenu', (ev) => {
    ev.preventDefault();
  });

  const feedback = ligarFeedback({
    bus,
    estado: o.estado,
    idLocal,
    numeros,
    hud,
    agora: () => performance.now(),
    itens: ctx.conteudo.itens,
    aviso: (texto) => {
      mostrarAviso(ui, texto);
    },
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
      barra.atualizar((h) => ({
        recarga: h.recargaMs > 0 ? recargaRestante(estado, j.id, h.id) / ticksDe(h.recargaMs) : 0,
        semMana: j.mana < h.custoRecurso,
      }));
    }
    hud.atualizar(j);
    mochila.atualizar();
    loja.atualizar();
    if (q.rede) hud.mostrarRede(q.rede);
    // Marco 12: efeitos, som, luz, minimapa e prompt; o congelamento de impacto só segura o desenho.
    const congelado = ap.quadro(estado, q.agoraMs, dtMs, q.posicao);
    ap.aplicarCamera(q.agoraMs);
    terreno.atualizarVisibilidade(...camera.retanguloVisivel(palco.altura()));
    const reduzido = ap.movimentoReduzido();
    objetos.desenhar(estado, q.agoraMs, reduzido);
    portas.desenhar(estado, q.agoraMs, reduzido);
    fluxo.desenhar(estado, idLocal);
    if (!congelado) {
      telegrafia.desenhar(estado, ctx, idLocal, q.alpha);
      sprites.desenhar(estado, ctx, q.posicao, q.alpha, q.aoRemover);
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
        zoom: camera.zoom,
        ...(q.rede && { rede: q.rede }),
      };
    });
  };
  return { bus, hud, quadro, pausado: ap.pausado };
}
