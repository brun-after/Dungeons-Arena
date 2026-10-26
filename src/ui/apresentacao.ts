import { faixaSuperior } from './aviso';
import { IndicadorCombo } from './combos';
import { fracaoMira } from '../combat/mira';
import { CamadaCombosTaticos } from '../render/combos-taticos';
// Apresentação do marco 12 (14/10/2026), D-056: junta numa peça só o que a cena ganhou — áudio, partículas,
// presets de impacto, luz, minimapa, prompt de interação, pausa, configurações e guia —, aplica as
// preferências (qualidade, escala da interface, movimento reduzido) e decide se o jogo está pausado.
// Nada aqui muda a simulação: tudo lê estado e eventos.
// Marco 20 (21/10/2026, D-087): o modo de desempenho (teto de fps, escala da resolução e o medidor) também mora aqui.

import { hashTexto } from '../core/rng';
import { MotorAudio } from '../audio/motor';
import type { BuscaHabilidade } from '../combat/habilidades';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { Barramento } from '../core/events';
import type { EventosDaSimulacao } from '../core/eventos-simulacao';
import type { Entidade, PontoVisual } from '../entities/entidade';
import { lerPreferencias, type NivelQualidade, type Preferencias } from '../plataforma/preferencias';
import type { Camera } from '../render/camera';
import { EfeitosDeHabilidade } from '../render/efeitos-habilidade';
import { EfeitosDeClasse } from '../render/efeitos-classe';
import { EfeitosDeArma } from '../render/efeitos-arma';
import type { AjusteVisual } from '../render/sprites';
import { VooDoFalcao } from '../render/voo-falcao';
import { golpeDaAcao } from '../render/golpe-visual';
import { corDaFuria } from '../render/materiais';
import { ehElemento } from '../combat/elementos';
import { elementosDaDupla } from '../combat/encarnacao';
import { fracaoFuria } from '../combat/furia';
import { sintoniaDe } from '../progression/sintonia';
import { ControladorImpacto } from '../render/impacto';
import { temaDaFase } from '../combat/clima';
import type { Elemento } from '../combat/elementos';
import { decoracoesDaFase } from '../world/decoracao';
import { CamadaLuz, type PontoDeLuz } from '../render/luz';
import { SistemaParticulas } from '../render/particulas';
import { escalaDaResolucao, fpsAlvo, PuladorDeQuadros } from '../render/desempenho';
import { MonitorDeQualidade, PRESETS_QUALIDADE, qualidadePadrao, type PresetQualidade } from '../render/qualidade';
import type { Palco } from '../render/stage';
import { Graphics } from 'pixi.js';
import { t } from '../i18n';
import { Medidor } from './medidor';
import { criarMinimapa } from './minimapa';
import { criarPausa, type AcaoDaPausa, type OpcaoDificuldade } from './pausa';
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
  /** Marco 14: acha a habilidade pela chave do evento (rank, caminhos, geradas). */
  habilidades: BuscaHabilidade;
  toque: boolean;
  /** Campanha: a pausa para a simulação. Arena: o menu abre e o mundo segue. */
  pausaOJogo: boolean;
  acoesDaPausa: readonly AcaoDaPausa[];
  aviso: (texto: string) => void;
  /** Marco 15: a dificuldade, quando a sessão deixa trocar. */
  dificuldade?: OpcaoDificuldade | undefined;
  /** Ao mudar câmera ou controle nas Configurações. */
  aoMudarPreferencias: (p: Preferencias) => void;
}

export interface Apresentacao {
  /** Marco 11A: as partículas, para a telegrafia e os rastros também serem partícula. */
  particulas: SistemaParticulas;
  botaoPausa: HTMLButtonElement;
  abrirPausa: () => void;
  pausado: () => boolean;
  /** Algum modal da pausa está aberto (o teclado não chega ao jogo). */
  menuAberto: () => boolean;
  movimentoReduzido: () => boolean;
  qualidade: () => PresetQualidade;
  /** Marco 20: o laço desenha este quadro? (teto de fps). */
  quadroPermitido: (agoraMs: number) => boolean;
  /** Marco 24 (D-098): a posição desenhada (o falcão voa solto) e o ajuste do voo para os sprites. */
  posicaoVisual: (base: (e: Entidade) => PontoVisual) => (e: Entidade) => PontoVisual;
  ajusteVisual: (e: Entidade, agoraMs: number) => AjusteVisual | null;
  /** Antes de aplicar a câmera: atualiza efeitos, som, minimapa e prompt; devolve se o desenho congela. */
  quadro: (estado: EstadoJogo, agoraMs: number, dtMs: number, posicao: (e: Entidade) => PontoVisual) => boolean;
  /** Depois de atualizar a câmera: aplica o tremor e o flash. */
  aplicarCamera: (agoraMs: number) => void;
  /** Marco 15: desmonta (fecha o áudio e solta os ouvintes globais). */
  encerrar: () => void;
}

export function montarApresentacao(o: OpcoesApresentacao): Apresentacao {
  const { ctx, palco, camera, toque, idLocal } = o;
  let prefs = lerPreferencias();
  const sistema = matchMedia('(prefers-reduced-motion: reduce)');
  const reduzido = () => (prefs.movimentoReduzido === 'sistema' ? sistema.matches : prefs.movimentoReduzido === 'sempre');
  const monitor = new MonitorDeQualidade(prefs.qualidade === 'auto' ? qualidadePadrao(toque) : prefs.qualidade);
  const nivel = (): NivelQualidade => (prefs.qualidade === 'auto' ? monitor.nivel : prefs.qualidade);
  const qualidade = () => PRESETS_QUALIDADE[nivel()];
  const alvoFps = () => fpsAlvo(prefs.fps, nivel());
  const pulador = new PuladorDeQuadros();
  const medidor = new Medidor();

  const motor = new MotorAudio({ musica: prefs.volumeMusica, efeitos: prefs.volumeEfeitos, mudo: prefs.mudo });
  const som = ligarSom({ motor, bus: o.bus, estado: o.estado, idLocal, habilidades: o.habilidades, fase: ctx.fase });
  const particulas = new SistemaParticulas(palco.efeitos, palco.app.renderer, () => camera.projecaoAtual);
  const impacto = new ControladorImpacto(() => prefs.efeitosDeTela && !reduzido() && qualidade().impacto);
  // Marco 23 (D-092): o tema da fase dá as partículas do ar, a cor da luz e as tochas acesas.
  const tema = temaDaFase(ctx);
  const corElemento = (el: Elemento) => Number.parseInt((ctx.conteudo.elementos.get(el)?.cor ?? '#ffffff').slice(1), 16);
  // Marco 24 (25/10/2026, D-098): o golpe de cada arma (pose, rastro e forma) e o giro do Redemoinho.
  const golpeDe = (e: Entidade, chave: string) => golpeDaAcao(ctx, e, chave, e.classeId ?? '');
  const efeitosArma = new EfeitosDeArma({
    particulas, impacto, golpeDe, corElemento,
    armaDe: (e) => {
      const el = e.aparencia?.elementoArma;
      return { elemento: ehElemento(el) ? el : null, forma: e.aparencia?.formaArma ?? null };
    },
    corDaFuria: (e, tick) => {
      const f = fracaoFuria(ctx, e, tick);
      return f === null ? null : corDaFuria(f, (e.furia?.frenesiAteTick ?? 0) > tick);
    },
  });
  efeitosArma.ligar(o.bus, o.estado, () => performance.now());
  // Marco 24 (25/10/2026, D-098): o falcão voa solto, bate as asas, pousa no ombro e tem o voo de cada skill.
  const voo = new VooDoFalcao({
    particulas, habilidades: o.habilidades, reduzido,
    parDaUltimate: (id) => ctx.conteudo.ultimates.get(id.replace(/_\d+$/, ''))?.par ?? null,
  });
  voo.ligar(o.bus, o.estado, () => performance.now());
  const efeitos = new EfeitosDeHabilidade({
    particulas, impacto, habilidades: o.habilidades, idLocal, qualidade, fase: ctx.fase,
    miraCheia: (e, tick) => fracaoMira(ctx, e, tick) === 1,
    clima: tema?.particulas ?? null,
    corElemento,
    golpeDeArma: (fonte, chave) => efeitosArma.cuidaDoImpacto(fonte, chave),
    aoGirar: (centro, cor) => {
      efeitosArma.laminasDoGiro(centro, cor);
    },
  });
  efeitos.ligar(o.bus, o.estado, () => performance.now());
  // Marco 24 (25/10/2026): a ultimate, a fúria e o Frenesi do Guerreiro, a encarnação dupla e a vertente.
  const efeitosClasse = new EfeitosDeClasse({
    particulas, impacto, habilidades: o.habilidades,
    fracaoFuria: (e, tick) => fracaoFuria(ctx, e, tick),
    elementosDaDupla: (e, tick) => elementosDaDupla(ctx, e, tick),
    deClasse: (e, id) => !!e.classeId && (ctx.conteudo.classes.get(e.classeId)?.exclusivas.includes(id) ?? false),
    vertenteDe: (e) => sintoniaDe(ctx, e).vertente?.id ?? null,
  });
  efeitosClasse.ligar(o.bus, o.estado, () => performance.now());
  const combos = new CamadaCombosTaticos(palco.efeitos, () => camera.projecaoAtual, reduzido, () => qualidade().particulas === 0, 24, particulas);
  combos.ligar(o.bus, o.estado, () => performance.now());
  const luz = new CamadaLuz(palco.luz);
  const flash = new Graphics();
  palco.tela.addChild(flash);

  const minimapa = criarMinimapa(ctx, idLocal, toque);
  const prompt = criarPrompt(ctx, idLocal, toque);
  const indicadorCombo = new IndicadorCombo();
  o.ui.append(minimapa.elemento, prompt.elemento, medidor.elemento);
  faixaSuperior(o.ui).append(indicadorCombo.elemento);

  let pausaAberta = false;
  const aplicarPreferencias = () => {
    document.body.classList.toggle('movimento-reduzido', reduzido());
    for (const n of ['minimo', 'baixo', 'medio', 'alto'] as const) document.body.classList.toggle(`qualidade-${n}`, nivel() === n);
    document.documentElement.style.setProperty('--escala-ui', String(prefs.escalaInterface));
    document.body.dataset.qualidade = nivel();
    motor.definirVolumes({ musica: prefs.volumeMusica, efeitos: prefs.volumeEfeitos, mudo: prefs.mudo });
    particulas.limite = qualidade().particulas;
    // Marco 11A: movimento reduzido também reduz as partículas (metade, sem giro).
    particulas.reduzido = reduzido();
    if (particulas.limite === 0) particulas.limpar();
    palco.definirEscala(escalaDaResolucao(prefs.resolucao, toque));
    medidor.mostrar(prefs.medidor);
  };
  aplicarPreferencias();
  sistema.addEventListener('change', aplicarPreferencias);

  const pausa = criarPausa({
    dificuldade: o.dificuldade,
    // Marco 18: a fase gerada mostra a semente (vem do id; as oficiais mostram o próprio id).
    fase: { nome: ctx.fase.nome, semente: (hashTexto(ctx.fase.id) >>> 0).toString(36).toUpperCase().slice(0, 6) },
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

  const acesos = decoracoesDaFase(ctx.fase, tema).filter((d) => d.tipo === 'tocha' || d.tipo === 'vela' || d.tipo === 'lava');
  const pontosDeLuz = (estado: EstadoJogo, posicao: (e: Entidade) => PontoVisual): PontoDeLuz[] => {
    const pontos: PontoDeLuz[] = [];
    const eu = estado.entidades.find((e) => e.id === idLocal);
    if (eu) {
      const p = posicao(eu);
      // Ajuste de 14/10/2026: o brilho em volta do jogador pela metade (feedback de jogo).
      pontos.push({ x: p.x, y: p.y, cor: tema?.luz ?? 0xffd9a0, semente: 0, intensidade: 0.5 });
      // As tochas, velas e fendas de lava do tema perto do jogador.
      for (const d of acesos) if (Math.abs(d.x - p.x) < 12 && Math.abs(d.y - p.y) < 9) pontos.push({ x: d.x, y: d.y - (d.tipo === 'tocha' ? 0.35 : 0), cor: d.tipo === 'vela' ? 0xffd890 : 0xff9a40, semente: d.x * 7 + d.y, intensidade: d.tipo === 'lava' ? 0.4 : 0.6 });
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
    particulas,
    encerrar: () => {
      combos.destruir();
      motor.destruir();
      sistema.removeEventListener('change', aplicarPreferencias);
    },
    botaoPausa: pausa.botao,
    abrirPausa: pausa.abrir,
    pausado: () => o.pausaOJogo && pausaAberta,
    menuAberto: pausa.aberta,
    movimentoReduzido: reduzido,
    qualidade,
    quadroPermitido: (agoraMs) => pulador.deveDesenhar(agoraMs, alvoFps()),
    posicaoVisual: (base) => voo.posicao(base),
    ajusteVisual: (e, agoraMs) => voo.ajuste(e, agoraMs),
    quadro: (estado, agoraMs, dtMs, base) => {
      voo.quadro(estado, agoraMs, base);
      const posicao = voo.posicao(base);
      medidor.registrar(dtMs, agoraMs);
      if (prefs.qualidade === 'auto') {
        const caiu = monitor.registrar(dtMs, agoraMs, alvoFps());
        if (caiu) {
          aplicarPreferencias();
          o.aviso(t('aviso.qualidadeReduzida'));
        }
      }
      const eu = estado.entidades.find((e) => e.id === idLocal);
      indicadorCombo.atualizar(estado, ctx, eu);
      const pos = eu ? posicao(eu) : null;
      som.quadro(pos, agoraMs);
      camera.enquadrar(focoDoQuadro(estado, posicao), agoraMs);
      efeitos.quadro(estado, agoraMs, posicao);
      efeitosClasse.quadro(estado, agoraMs, posicao);
      efeitosArma.quadro(estado, agoraMs, posicao);
      combos.desenhar(estado, agoraMs);
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

