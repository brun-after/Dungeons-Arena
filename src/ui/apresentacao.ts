// Apresentação do marco 12 (14/10/2026), D-056: junta numa peça só o que a cena ganhou — áudio, partículas,
// presets de impacto, luz, minimapa, prompt de interação, pausa, configurações e guia —, aplica as
// preferências (qualidade, escala da interface, movimento reduzido) e decide se o jogo está pausado.
// Nada aqui muda a simulação: tudo lê estado e eventos.

import { MotorAudio } from '../audio/motor';
import type { Catalogo, Habilidade } from '../combat/habilidades';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { Barramento } from '../core/events';
import type { EventosDaSimulacao } from '../core/eventos-simulacao';
import type { Entidade, PontoVisual } from '../entities/entidade';
import { lerPreferencias, type NivelQualidade, type Preferencias } from '../plataforma/preferencias';
import type { Camera } from '../render/camera';
import { EfeitosDeHabilidade } from '../render/efeitos-habilidade';
import { ControladorImpacto } from '../render/impacto';
import { CamadaLuz, type PontoDeLuz } from '../render/luz';
import { SistemaParticulas } from '../render/particulas';
import { MonitorDeQualidade, PRESETS_QUALIDADE, qualidadePadrao, type PresetQualidade } from '../render/qualidade';
import type { Palco } from '../render/stage';
import { Graphics } from 'pixi.js';
import { t } from '../i18n';
import { criarMinimapa } from './minimapa';
import { criarPausa, type AcaoDaPausa } from './pausa';
import { criarPrompt } from './prompt';
import { ligarSom } from './som';

export interface OpcoesApresentacao {
  ctx: ContextoSimulacao;
  palco: Palco;
  camera: Camera;
  ui: HTMLElement;
  bus: Barramento<EventosDaSimulacao>;
  estado: () => EstadoJogo;
  idLocal: string;
  habilidades: Catalogo<Habilidade>;
  toque: boolean;
  /** Campanha: a pausa para a simulação. Arena: o menu abre e o mundo segue. */
  pausaOJogo: boolean;
  acoesDaPausa: readonly AcaoDaPausa[];
  aviso: (texto: string) => void;
  /** Ao mudar câmera ou controle nas Configurações. */
  aoMudarPreferencias: (p: Preferencias) => void;
}

export interface Apresentacao {
  botaoPausa: HTMLButtonElement;
  abrirPausa: () => void;
  pausado: () => boolean;
  /** Algum modal da pausa está aberto (o teclado não chega ao jogo). */
  menuAberto: () => boolean;
  movimentoReduzido: () => boolean;
  qualidade: () => PresetQualidade;
  /** Antes de aplicar a câmera: atualiza efeitos, som, minimapa e prompt; devolve se o desenho congela. */
  quadro: (estado: EstadoJogo, agoraMs: number, dtMs: number, posicao: (e: Entidade) => PontoVisual) => boolean;
  /** Depois de atualizar a câmera: aplica o tremor e o flash. */
  aplicarCamera: (agoraMs: number) => void;
}

export function montarApresentacao(o: OpcoesApresentacao): Apresentacao {
  const { ctx, palco, camera, toque, idLocal } = o;
  let prefs = lerPreferencias();
  const sistema = matchMedia('(prefers-reduced-motion: reduce)');
  const reduzido = () => (prefs.movimentoReduzido === 'sistema' ? sistema.matches : prefs.movimentoReduzido === 'sempre');
  const monitor = new MonitorDeQualidade(prefs.qualidade === 'auto' ? qualidadePadrao(toque) : prefs.qualidade);
  const nivel = (): NivelQualidade => (prefs.qualidade === 'auto' ? monitor.nivel : prefs.qualidade);
  const qualidade = () => PRESETS_QUALIDADE[nivel()];

  const motor = new MotorAudio({ musica: prefs.volumeMusica, efeitos: prefs.volumeEfeitos, mudo: prefs.mudo });
  const som = ligarSom({ motor, bus: o.bus, estado: o.estado, idLocal, habilidades: o.habilidades, fase: ctx.fase });
  const particulas = new SistemaParticulas(palco.efeitos, palco.app.renderer);
  const impacto = new ControladorImpacto(() => prefs.efeitosDeTela && !reduzido() && qualidade().impacto);
  const efeitos = new EfeitosDeHabilidade({ particulas, impacto, habilidades: o.habilidades, idLocal, qualidade });
  efeitos.ligar(o.bus, o.estado, () => performance.now());
  const luz = new CamadaLuz(palco.luz);
  const flash = new Graphics();
  palco.tela.addChild(flash);

  const minimapa = criarMinimapa(ctx, idLocal, toque);
  const prompt = criarPrompt(ctx, idLocal, toque);
  o.ui.append(minimapa.elemento, prompt.elemento);

  let pausaAberta = false;
  const aplicarPreferencias = () => {
    document.body.classList.toggle('movimento-reduzido', reduzido());
    for (const n of ['minimo', 'baixo', 'medio', 'alto'] as const) document.body.classList.toggle(`qualidade-${n}`, nivel() === n);
    document.documentElement.style.setProperty('--escala-ui', String(prefs.escalaInterface));
    document.body.dataset.qualidade = nivel();
    motor.definirVolumes({ musica: prefs.volumeMusica, efeitos: prefs.volumeEfeitos, mudo: prefs.mudo });
    particulas.limite = qualidade().particulas;
    if (particulas.limite === 0) particulas.limpar();
  };
  aplicarPreferencias();
  sistema.addEventListener('change', aplicarPreferencias);

  const pausa = criarPausa({
    pausaOJogo: o.pausaOJogo,
    toque,
    acoes: o.acoesDaPausa,
    aoMudarPreferencias: (p) => {
      prefs = p;
      if (p.qualidade !== 'auto') monitor.nivel = p.qualidade;
      aplicarPreferencias();
      o.aoMudarPreferencias(p);
    },
    aoMudarEstado: (aberta) => {
      pausaAberta = aberta;
      if (o.pausaOJogo) motor.pausar(aberta);
    },
  });

  const pontosDeLuz = (estado: EstadoJogo, posicao: (e: Entidade) => PontoVisual): PontoDeLuz[] => {
    const pontos: PontoDeLuz[] = [];
    const eu = estado.entidades.find((e) => e.id === idLocal);
    if (eu) {
      const p = posicao(eu);
      // Ajuste de 14/10/2026: o brilho em volta do jogador pela metade (feedback de jogo).
      pontos.push({ x: p.x, y: p.y, cor: 0xffd9a0, semente: 0, intensidade: 0.5 });
    }
    for (const obj of estado.objetos) {
      if (obj.tipo === 'loja' || obj.tipo === 'bau' || obj.tipo === 'saida') pontos.push({ x: obj.x, y: obj.y, cor: 0xffc070, semente: obj.x * 31 + obj.y });
    }
    const s = ctx.fase.portaSaida;
    if (s) pontos.push({ x: s.x, y: s.y, cor: estado.saidaAberta || s.tranca === 'livre' ? 0x9cf0b0 : 0xb0b0c0, semente: 7 });
    for (const obj of ctx.fase.objetos) if (obj.tipo === 'fonte_som' && obj.som === 'fogo') pontos.push({ x: obj.x, y: obj.y, cor: 0xff9a40, semente: obj.x + obj.y * 13 });
    return pontos;
  };

  // Enquadrar dois (§2.4, só campanha): o alvo selecionado e engajado divide o quadro com o jogador.
  const focoDoQuadro = (estado: EstadoJogo, posicao: (e: Entidade) => PontoVisual): PontoVisual | null => {
    if (!o.pausaOJogo || !prefs.enquadrarDois) return null;
    const eu = estado.entidades.find((e) => e.id === idLocal);
    const alvo = eu?.alvoSelecionado ? estado.entidades.find((e) => e.id === eu.alvoSelecionado) : undefined;
    if (!eu || !alvo || alvo.morto || Math.max(Math.abs(alvo.x - eu.x), Math.abs(alvo.y - eu.y)) > 8) return null;
    const a = posicao(eu);
    const b = posicao(alvo);
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  };

  return {
    botaoPausa: pausa.botao,
    abrirPausa: pausa.abrir,
    pausado: () => o.pausaOJogo && pausaAberta,
    menuAberto: pausa.aberta,
    movimentoReduzido: reduzido,
    qualidade,
    quadro: (estado, agoraMs, dtMs, posicao) => {
      if (prefs.qualidade === 'auto') {
        const caiu = monitor.registrar(dtMs, agoraMs);
        if (caiu) {
          aplicarPreferencias();
          o.aviso(t('aviso.qualidadeReduzida'));
        }
      }
      const eu = estado.entidades.find((e) => e.id === idLocal);
      const pos = eu ? posicao(eu) : null;
      som.quadro(pos, agoraMs);
      camera.enquadrar(focoDoQuadro(estado, posicao), agoraMs);
      efeitos.quadro(estado, agoraMs, posicao);
      particulas.atualizar(Math.min(100, dtMs));
      luz.desenhar(pontosDeLuz(estado, posicao), agoraMs, qualidade().luz, reduzido());
      minimapa.atualizar(estado, agoraMs);
      prompt.atualizar(estado, agoraMs);
      document.body.dataset.particulas = String(particulas.quantidade);
      return impacto.quadro(agoraMs).congelado;
    },
    aplicarCamera: (agoraMs) => {
      const q = impacto.quadro(agoraMs);
      camera.aplicar(palco.mundo, q);
      flash.clear();
      if (q.flash > 0) flash.rect(0, 0, palco.largura(), palco.altura()).fill({ color: q.corFlash, alpha: q.flash });
    },
  };
}

