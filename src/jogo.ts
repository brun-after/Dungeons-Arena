// Montagem da sessão de campanha no navegador: liga simulação, renderização, entrada e interface.
// A simulação só recebe comandos pela fila; a apresentação só lê o estado e os eventos.

import type { Comando } from './core/comandos';
import { criarFila, enfileirar, retirarAte } from './core/comandos';
import { BALANCE_PADRAO, type ContextoSimulacao } from './core/contexto';
import { criarEntidade, criarEstado } from './core/estado';
import { Barramento } from './core/events';
import type { EventoSimulacao, EventosDaSimulacao } from './core/eventos-simulacao';
import { hashTexto } from './core/rng';
import { simular } from './core/simulacao';
import fase01 from './data/fases/fase-01.json';
import { t } from './i18n';
import { ligarPonteiro } from './input/ponteiro';
import { ligarTeclado } from './input/teclado';
import { detectarToque, sinaisDoNavegador, vibrar } from './plataforma/dispositivo';
import { iniciarLaco } from './plataforma/laco-navegador';
import { gravarPreferencias, lerPreferencias } from './plataforma/preferencias';
import { prepararSessaoDeTela } from './plataforma/sessao-tela';
import { Camera } from './render/camera';
import { CELULA_PX } from './render/camera-calculo';
import { Interpolador } from './render/interpolacao';
import { CamadaEntidades } from './render/sprites';
import { criarPalco, type Palco } from './render/stage';
import { criarTerreno } from './render/terreno';
import { mostrarAviso } from './ui/aviso';
import { criarCabecalho } from './ui/cabecalho';
import { criarControles, type Controles } from './ui/controles';
import { Diagnostico } from './ui/diagnostico';
import { carregarFase } from './world/fase';
import { velocidade } from './world/movimento';
import { validarFase } from './world/validacao-fase';

const ID_JOGADOR = 'j1';
const LEITURA_FAIXA_MS = 1000;

function publicar(bus: Barramento<EventosDaSimulacao>, ev: EventoSimulacao): void {
  switch (ev.t) {
    case 'moveu':
      bus.emitir('moveu', ev);
      break;
    case 'caminhoFalhou':
      bus.emitir('caminhoFalhou', ev);
      break;
    case 'ataqueSolicitado':
      bus.emitir('ataqueSolicitado', ev);
      break;
  }
}

function div(classe: string): HTMLDivElement {
  const el = document.createElement('div');
  el.className = classe;
  return el;
}

export async function iniciarJogo(raiz: HTMLElement): Promise<void> {
  const toque = detectarToque(sinaisDoNavegador());
  document.body.classList.toggle('toque', toque);
  const prefs = lerPreferencias();

  const validacao = validarFase(fase01);
  if (!validacao.ok) throw new Error(`fase oficial inválida: ${validacao.erros.map((e) => e.mensagem).join('; ')}`);
  const fase = carregarFase(validacao.fase);
  const ctx: ContextoSimulacao = { fase, balance: BALANCE_PADRAO };
  const estado = criarEstado({ semente: hashTexto(fase.id), faseId: fase.id });
  const spawn = fase.spawns[0] ?? { x: 1, y: 1 };
  estado.entidades.push(criarEntidade({ id: ID_JOGADOR, tipo: 'jogador', x: spawn.x, y: spawn.y, jogadorId: 'local' }));
  const jogador = () => estado.entidades.find((e) => e.id === ID_JOGADOR);

  raiz.textContent = '';
  const host = div('palco');
  const ui = div('camada-ui');
  raiz.append(host, ui);

  let palco: Palco;
  try {
    palco = await criarPalco(host);
  } catch {
    const erro = div('erro');
    erro.setAttribute('role', 'alert');
    erro.textContent = t('erro.graficos');
    ui.append(erro);
    return;
  }
  prepararSessaoDeTela(toque);

  const camera = new Camera(fase.largura * CELULA_PX, fase.altura * CELULA_PX, prefs.camera, toque);
  const terreno = criarTerreno(palco.terreno, fase);
  const sprites = new CamadaEntidades(palco.entidades, ID_JOGADOR);
  const interp = new Interpolador();
  const fila = criarFila();
  const emitir = (cmd: Comando) => enfileirar(fila, { tick: estado.tick, entidadeId: ID_JOGADOR, cmd });
  const isometrico = () => false; // a visão isométrica entra no marco 13

  let controles: Controles | null = null;
  if (toque) {
    controles = criarControles({
      tipo: prefs.controle,
      aoMudarDirecao: (dir) => emitir({ t: 'mover', dir }),
      aoAtacar: () => emitir({ t: 'ataqueBasico' }),
      aoInteragir: () => emitir({ t: 'interagir' }),
      isometrico,
    });
    ui.append(controles.elemento);
  }
  ui.append(
    criarCabecalho({
      nomeFase: fase.nome,
      controle: prefs.controle,
      camera: prefs.camera,
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
    camera.centralizar(j ? { x: j.x, y: j.y } : spawn);
  };
  lerFaixa(performance.now());
  reenquadrar();
  palco.aoRedimensionar(reenquadrar);

  ligarTeclado({
    aoMudarDirecao: (dir) => emitir({ t: 'mover', dir }),
    aoAtacar: () => emitir({ t: 'ataqueBasico' }),
    isometrico,
  });
  ligarPonteiro(palco.canvas, { camera, aoIrPara: (c) => emitir({ t: 'irPara', x: c.x, y: c.y }) });
  palco.canvas.addEventListener('contextmenu', (ev) => {
    ev.preventDefault();
  });

  const bus = new Barramento<EventosDaSimulacao>();
  let ataques = 0;
  bus.on('caminhoFalhou', () => {
    vibrar([50, 30, 50]);
  });
  bus.on('ataqueSolicitado', (ev) => {
    ataques++;
    sprites.pulsar(ev.id, performance.now());
  });

  const eventos: EventoSimulacao[] = [];
  let ultimoQuadroMs = performance.now();
  iniciarLaco({
    simular: (dtMs) => {
      interp.registrarAntesDoTick(estado);
      eventos.length = 0;
      simular(estado, ctx, retirarAte(fila, estado.tick), eventos, dtMs);
      for (const ev of eventos) publicar(bus, ev);
    },
    renderizar: (alpha) => {
      const agora = performance.now();
      const dtS = Math.min(0.1, (agora - ultimoQuadroMs) / 1000);
      ultimoQuadroMs = agora;
      lerFaixa(agora);

      const j = jogador();
      if (j) {
        camera.seguirCelula({ x: j.x, y: j.y });
        camera.atualizar(dtS, interp.posicao(j, alpha), velocidade(j.destreza, ctx.balance.movimento.velocidadeBaseMs));
      }
      camera.aplicar(palco.mundo);
      terreno.atualizarVisibilidade(...camera.retanguloVisivel(palco.altura()));
      sprites.desenhar(estado, interp, alpha, agora);
      palco.renderizar();

      diag?.quadro(agora, () => {
        const p = j ? interp.posicao(j, alpha) : { x: 0, y: 0 };
        return {
          tick: estado.tick,
          celula: { x: j?.x ?? 0, y: j?.y ?? 0 },
          tela: camera.paraTela(p.x, p.y),
          entidades: estado.entidades.length,
          ataques,
          zoom: camera.zoom,
        };
      });
    },
  });
}
