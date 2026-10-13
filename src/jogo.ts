// Montagem da sessão de campanha no navegador: liga simulação, renderização, entrada e interface.
// A simulação só recebe comandos pela fila; a apresentação só lê o estado e os eventos.

import { recargaRestante } from './combat/acao';
import { celulaOcupada } from './combat/geometria';
import type { Habilidade } from './combat/habilidades';
import type { Celula, Comando } from './core/comandos';
import { criarFila, enfileirar, retirarAte } from './core/comandos';
import { conteudoOficial } from './core/conteudo';
import { BALANCE_PADRAO, type ContextoSimulacao } from './core/contexto';
import { criarEstado } from './core/estado';
import { Barramento } from './core/events';
import type { EventoSimulacao, EventosDaSimulacao } from './core/eventos-simulacao';
import { hashTexto } from './core/rng';
import { simular } from './core/simulacao';
import { ticksDe } from './core/tempo';
import fase01 from './data/fases/fase-01.json';
import { criarJogador } from './entities/fabrica';
import { t } from './i18n';
import { ligarPonteiro } from './input/ponteiro';
import { ligarTeclado } from './input/teclado';
import { podeFerir } from './modos/relacao';
import { detectarToque, sinaisDoNavegador } from './plataforma/dispositivo';
import { iniciarLaco } from './plataforma/laco-navegador';
import { gravarPreferencias, lerPreferencias } from './plataforma/preferencias';
import { prepararSessaoDeTela } from './plataforma/sessao-tela';
import { Camera } from './render/camera';
import { CELULA_PX } from './render/camera-calculo';
import { Interpolador } from './render/interpolacao';
import { CamadaNumeros } from './render/numeros';
import { CamadaEntidades } from './render/sprites';
import { criarPalco, type Palco } from './render/stage';
import { CamadaTelegrafia } from './render/telegrafia';
import { criarTerreno } from './render/terreno';
import { mostrarAviso } from './ui/aviso';
import { criarCabecalho } from './ui/cabecalho';
import { criarControles, type Controles } from './ui/controles';
import { Diagnostico } from './ui/diagnostico';
import { ligarFeedback } from './ui/feedback';
import { criarBarraHabilidades } from './ui/habilidades';
import { Hud } from './ui/hud';
import { carregarFase } from './world/fase';
import { velocidade } from './world/movimento';
import { povoarFase } from './world/populacao';
import { validarFase } from './world/validacao-fase';

const ID_JOGADOR = 'j1';
const LEITURA_FAIXA_MS = 1000;

function div(classe: string): HTMLDivElement {
  const el = document.createElement('div');
  el.className = classe;
  return el;
}

function montarContexto(): ContextoSimulacao {
  const conteudo = conteudoOficial();
  const validacao = validarFase(fase01, new Set(conteudo.presets.keys()));
  if (!validacao.ok) throw new Error(`fase oficial inválida: ${validacao.erros.map((e) => e.mensagem).join('; ')}`);
  return { fase: carregarFase(validacao.fase), balance: BALANCE_PADRAO, conteudo, modo: conteudo.modoCampanha };
}

export async function iniciarJogo(raiz: HTMLElement): Promise<void> {
  const toque = detectarToque(sinaisDoNavegador());
  document.body.classList.toggle('toque', toque);
  const prefs = lerPreferencias();
  const movimentoReduzido = matchMedia('(prefers-reduced-motion: reduce)');

  const ctx = montarContexto();
  const { fase, conteudo } = ctx;
  const estado = criarEstado({ semente: hashTexto(fase.id), faseId: fase.id });
  const spawn = fase.spawns[0] ?? { x: 1, y: 1 };
  const classe = conteudo.classes.get('aventureiro');
  if (!classe) throw new Error('classe inicial ausente');
  estado.entidades.push(criarJogador(classe, ID_JOGADOR, spawn.x, spawn.y, ctx.balance));
  povoarFase(estado, ctx);
  const jogador = () => estado.entidades.find((e) => e.id === ID_JOGADOR);
  const habilidades = classe.habilidades
    .map((id) => conteudo.habilidades.get(id))
    .filter((h): h is Habilidade => h !== undefined);

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
  const telegrafia = new CamadaTelegrafia(palco.chao, palco.voo);
  const numeros = new CamadaNumeros(palco.efeitos, () => movimentoReduzido.matches);
  const interp = new Interpolador();
  const fila = criarFila();
  const emitir = (cmd: Comando) => enfileirar(fila, { tick: estado.tick, entidadeId: ID_JOGADOR, cmd });
  const isometrico = () => false; // a visão isométrica entra no marco 13
  const usarHabilidade = (id: string) => emitir({ t: 'usarHabilidade', id });

  // Toque ou clique num hostil seleciona o alvo; em qualquer outra célula, vai até ela.
  const aoTocarCelula = (c: Celula) => {
    const local = jogador();
    const hostil = estado.entidades.find((e) => {
      const o = celulaOcupada(e);
      return o.x === c.x && o.y === c.y && !!local && podeFerir(local, e, ctx.modo) && !e.morto;
    });
    emitir(hostil ? { t: 'selecionarAlvo', alvo: hostil.id } : { t: 'irPara', x: c.x, y: c.y });
  };

  const hud = new Hud(ui);
  const barra = criarBarraHabilidades(habilidades, usarHabilidade);
  let controles: Controles | null = null;
  if (toque) {
    controles = criarControles({
      tipo: prefs.controle,
      aoMudarDirecao: (dir) => emitir({ t: 'mover', dir }),
      aoAtacar: () => emitir({ t: 'ataqueBasico' }),
      aoInteragir: () => emitir({ t: 'interagir' }),
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
      acoesExtras: [hud.botaoLog],
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
    aoAtalho: (indice) => {
      const h = habilidades[indice];
      if (h) usarHabilidade(h.id);
    },
    aoCancelar: () => emitir({ t: 'selecionarAlvo', alvo: null }),
    isometrico,
  });
  ligarPonteiro(palco.canvas, { camera, aoIrPara: aoTocarCelula });
  palco.canvas.addEventListener('contextmenu', (ev) => {
    ev.preventDefault();
  });

  const bus = new Barramento<EventosDaSimulacao>();
  const feedback = ligarFeedback({ bus, estado, idLocal: ID_JOGADOR, numeros, hud, agora: () => performance.now() });

  const eventos: EventoSimulacao[] = [];
  let ultimoQuadroMs = performance.now();
  iniciarLaco({
    simular: (dtMs) => {
      interp.registrarAntesDoTick(estado);
      eventos.length = 0;
      simular(estado, ctx, retirarAte(fila, estado.tick), eventos, dtMs);
      for (const ev of eventos) bus.emitir(ev.t, ev);
    },
    renderizar: (alpha) => {
      const agora = performance.now();
      const dtS = Math.min(0.1, (agora - ultimoQuadroMs) / 1000);
      ultimoQuadroMs = agora;
      lerFaixa(agora);

      const j = jogador();
      if (j) {
        camera.seguirCelula({ x: j.x, y: j.y });
        camera.atualizar(dtS, interp.posicao(j, alpha), velocidade(j.atributos.destreza, ctx.balance.movimento.velocidadeBaseMs));
        barra.atualizar((h) => ({
          recarga: h.recargaMs > 0 ? recargaRestante(estado, j.id, h.id) / ticksDe(h.recargaMs) : 0,
          semMana: j.mana < h.custoRecurso,
        }));
      }
      hud.atualizar(j);
      camera.aplicar(palco.mundo);
      terreno.atualizarVisibilidade(...camera.retanguloVisivel(palco.altura()));
      telegrafia.desenhar(estado, ctx, ID_JOGADOR, alpha);
      sprites.desenhar(estado, ctx, interp, alpha);
      numeros.atualizar(agora);
      palco.renderizar();

      diag?.quadro(agora, () => {
        const p = j ? interp.posicao(j, alpha) : { x: 0, y: 0 };
        return {
          tick: estado.tick,
          celula: { x: j?.x ?? 0, y: j?.y ?? 0 },
          tela: camera.paraTela(p.x, p.y),
          entidades: estado.entidades.length,
          impactos: feedback.impactos(),
          hp: j?.hp ?? 0,
          zoom: camera.zoom,
        };
      });
    },
  });
}
