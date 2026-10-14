// Cena de jogo no navegador, compartilhada pela campanha e pela arena: palco, câmera, camadas do
// mundo, HUD, controles, cabeçalho, entrada e feedback. Quem chama decide de onde vem o estado
// (simulação local ou cliente de rede) e para onde vão os comandos.

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
import { detectarToque, sinaisDoNavegador } from '../plataforma/dispositivo';
import { gravarPreferencias, lerPreferencias } from '../plataforma/preferencias';
import { prepararSessaoDeTela } from '../plataforma/sessao-tela';
import { Camera } from '../render/camera';
import { CELULA_PX } from '../render/camera-calculo';
import { CamadaNumeros } from '../render/numeros';
import { CamadaObjetos } from '../render/objetos';
import { CamadaEntidades } from '../render/sprites';
import { criarPalco, type Palco } from '../render/stage';
import { CamadaTelegrafia } from '../render/telegrafia';
import { criarTerreno } from '../render/terreno';
import { velocidade } from '../world/movimento';
import { mostrarAviso } from './aviso';
import { criarCabecalho } from './cabecalho';
import { criarControles, type Controles } from './controles';
import { Diagnostico, type DadosRede } from './diagnostico';
import { ligarFeedback } from './feedback';
import { criarMochila } from './mochila';
import { criarBarraHabilidades } from './habilidades';
import { Hud } from './hud';

const LEITURA_FAIXA_MS = 1000;

export interface OpcoesCena {
  raiz: HTMLElement;
  ctx: ContextoSimulacao;
  idLocal: string;
  habilidades: readonly Habilidade[];
  /** Estado atual a desenhar (a arena troca o objeto a cada reconciliação). */
  estado: () => EstadoJogo;
  emitir: (cmd: Comando) => void;
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
  const movimentoReduzido = matchMedia('(prefers-reduced-motion: reduce)');
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
  const terreno = criarTerreno(palco.terreno, fase);
  const sprites = new CamadaEntidades(palco.entidades, idLocal);
  const telegrafia = new CamadaTelegrafia(palco.chao, palco.voo);
  const objetos = new CamadaObjetos(palco.chao, (id) => ctx.conteudo.itens.get(id)?.raridade);
  const numeros = new CamadaNumeros(palco.efeitos, () => movimentoReduzido.matches);
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
    toque,
    aoAbrir: () => {
      teclado?.soltarTudo();
      emitir({ t: 'mover', dir: 'parado' });
    },
  });
  let controles: Controles | null = null;
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
      controle: prefs.controle,
      camera: prefs.camera,
      status: hud.status,
      acoesExtras: [mochila.botao, hud.botaoLog],
      aoTrocarControle: () => {
        prefs.controle = prefs.controle === 'joystick' ? 'dpad' : 'joystick';
        controles?.trocarTipo(prefs.controle);
        gravarPreferencias(prefs);
        return prefs.controle;
      },
      aoTrocarCamera: () => {
        prefs.camera = prefs.camera === 'janela' ? 'centralizada' : 'janela';
        camera.modo = prefs.camera;
        gravarPreferencias(prefs);
        return prefs.camera;
      },
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
    aoAtalho: (indice) => {
      const h = o.habilidades[indice];
      if (h) usarHabilidade(h.id);
    },
    aoCancelar: () => {
      emitir({ t: 'selecionarAlvo', alvo: null });
    },
    isometrico,
    aoMochila: mochila.alternar,
    bloqueado: mochila.aberta,
  });
  ligarPonteiro(palco.canvas, { camera, aoIrPara: aoTocarCelula });
  palco.canvas.addEventListener('contextmenu', (ev) => {
    ev.preventDefault();
  });

  const bus = new Barramento<EventosDaSimulacao>();
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
    const dtS = Math.min(0.1, (q.agoraMs - ultimoQuadroMs) / 1000);
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
    if (q.rede) hud.mostrarRede(q.rede);
    camera.aplicar(palco.mundo);
    terreno.atualizarVisibilidade(...camera.retanguloVisivel(palco.altura()));
    objetos.desenhar(estado, q.agoraMs, movimentoReduzido.matches);
    telegrafia.desenhar(estado, ctx, idLocal, q.alpha);
    sprites.desenhar(estado, ctx, q.posicao, q.alpha, q.aoRemover);
    numeros.atualizar(q.agoraMs);
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
  return { bus, hud, quadro };
}
