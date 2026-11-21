import { podeAjudar } from '../modos/relacao';
import { criarLuzesDeMagia } from './luzes-magia';
import { fogoAceso } from '../world/fogo-aceso';
import { luzesDosAmbientes } from '../render/solo/ambientes-solo';
import { faixaSuperior } from './aviso';
import { IndicadorCombo } from './combos';
import { fracaoMira } from '../combat/mira';
import { perfilVisualDe } from '../render/perfil-visual';
import { corPelaParticipacao } from '../render/movimento/nuvem-nevoa';
import { vinculoDe, type PontaElemental } from '../progression/vinculo';
import { visualDasComuns } from '../render/visual-comum';
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
import { EfeitosDeDominio } from '../render/efeitos-dominio';
import { AreaDaAura, corDaAura } from '../render/area-aura';
import { TerrenosVivosVisual } from '../render/terrenos-vivos-visual';
import { raioDaAura } from '../combat/ajustes-classes';
import { marcoAMostra } from '../progression/dominio';
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
import { ACHATAMENTO_ISO, CamadaEscuridao, type LuzNaTela } from '../render/escuridao';
import { horaDoMundo, luzDaHora } from '../mundo/ciclo';
import { temLuzPropria } from '../combat/luz-propria';
import { agoraDoMundo } from './hora-do-mundo';
import { alfaNoEscuro } from './visao-no-escuro';
import { centroDaCelula } from '../render/projecao';
import { CELULA_PX } from '../render/camera-calculo';
import { ESCURIDAO_PADRAO } from '../world/solo';
import { temaDaFase } from '../combat/clima';
import type { Elemento } from '../combat/elementos';
import { decoracoesDaFase } from '../world/decoracao';
import { CamadaLuz, cintilacao, type PontoDeLuz } from '../render/luz';
import { SistemaParticulas } from '../render/particulas';
import { escalaDaResolucao, fpsAlvo, PuladorDeQuadros } from '../render/desempenho';
import { ECONOMIA_RESOLUCAO, limitesAutomaticos, MonitorDeQualidade, presetComEconomia, PRESETS_QUALIDADE, qualidadePadrao, type PresetQualidade } from '../render/qualidade';
import type { Palco } from '../render/stage';
import { Graphics } from 'pixi.js';
import { t } from '../i18n';
import { Medidor } from './medidor';
import { criarMinimapa } from './minimapa';
import { criarPausa, type AcaoDaPausa, type OpcaoDificuldade } from './pausa';
import { criarPrompt } from './prompt';
import { letraInteragir } from '../input/teclas';
import { ligarSom, timbrePeloEstado } from './som';
import { classeDaHabilidade } from './runa-dom';
import { DiretorVfx } from '../render/vfx/diretor';
import { CorpoEmMovimento } from '../render/movimento/corpo-movimento';
import { RastrosDeMovimento } from '../render/movimento/rastros-movimento';
import { brilhoDoOrbeXp } from '../progression/orbe-xp';
import { COR_ORBE_XP } from '../render/orbe-xp';
import { EntregaNaTela } from '../render/entrega-tela';

export interface OpcoesApresentacao {
  destinoMapa?: (() => { x: number; y: number } | null) | undefined;
  /** Câmera auxiliar sem áudio, com orçamento de 30 fps e resolução de no máximo um pixel por ponto CSS. */
  observador?: boolean;
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
  /** Marco 26 (D-107): o joystick ou o D-pad aparece (toque sem mouse); decide a opção do tipo nas Configurações. */
  direcional?: boolean;
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
  /** Marco 26 (D-122): o salvamento durou `ms`; o medidor mostra e a qualidade automática não conta o quadro. */
  anotarSalvamento: (ms: number) => void;
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
  // D-199 (21/11/2026): no toque, a automática não desce do baixo; aperta a economia (resolução, partículas, 30 fps).
  const limites = limitesAutomaticos(toque);
  const monitor = new MonitorDeQualidade(prefs.qualidade === 'auto' ? qualidadePadrao(toque) : prefs.qualidade, limites.piso, limites.economiaMax);
  const nivel = (): NivelQualidade => (prefs.qualidade === 'auto' ? monitor.nivel : prefs.qualidade);
  const economia = () => (prefs.qualidade === 'auto' ? monitor.economia : 0);
  const qualidade = () => presetComEconomia(nivel(), economia());
  const alvoFps = () => o.observador ? 30 : fpsAlvo(prefs.fps, nivel(), economia());
  const pulador = new PuladorDeQuadros();
  const medidor = new Medidor();

  const motor = new MotorAudio({ musica: prefs.volumeMusica, efeitos: prefs.volumeEfeitos, mudo: o.observador || prefs.mudo });
  const ehBasico = (id: string) => ctx.conteudo.definicoes.get(id)?.basico === true;
  const som = ligarSom({ motor, bus: o.bus, estado: o.estado, idLocal, habilidades: o.habilidades,
    basico: ehBasico, timbre: timbrePeloEstado(ctx, o.estado, ehBasico), fase: ctx.fase });
  const particulas = new SistemaParticulas(palco.efeitos, palco.app.renderer, () => camera.projecaoAtual);
  const impacto = new ControladorImpacto(() => prefs.efeitosDeTela && !reduzido() && qualidade().impacto);
  // Marco 23 (D-092): o tema da fase dá as partículas do ar, a cor da luz e as tochas acesas.
  const tema = temaDaFase(ctx);
  const vis = ctx.balance.visual.luz;
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
    // Marco 40 (D-160): a ultimate é da família do par; o falcão voa com ela só pelo voo genérico (a etapa 4 refaz o visual).
    parDaUltimate: () => null,
  });
  voo.ligar(o.bus, o.estado, () => performance.now());
  // Marco 26 (29/10/2026, D-124): as assinaturas das skills (silhuetas acima, marcas no chão, corpos que deslizam).
  const visualComum = visualDasComuns(ctx.conteudo);
  const diretor = new DiretorVfx({ efeitos: palco.efeitos, chao: palco.chao, particulas, impacto, reduzido });
  // Marco 49 (21/11/2026, D-194): a entrega na tela (sombras, círculos, o feixe, o giro e o pulso no alvo, o corpo).
  const entregaTela = new EntregaNaTela({ chao: palco.marcas, ar: palco.efeitos, particulas, habilidades: o.habilidades, reduzido });
  // Marco 40 (13/11/2026, D-164): o movimento da classe no corpo (voo alto, salto, corrida, montaria, névoa) e o que ele
  // deixa no mundo (a nuvem de escuridão, os símbolos de conjuração, a corda, a poeira e as rachaduras).
  const tiposDoMovimento = new Map([...ctx.conteudo.movimentos.values()].flat().map((m) => [m.id, m.tipo] as const));
  let posicaoDoQuadro: (e: Entidade) => PontoVisual = (e) => ({ x: e.px, y: e.py });
  const petsDoMovimento = new Map([...ctx.conteudo.movimentos.values()].flat().map((m) => [m.id, m.pet] as const));
  const corpoMovimento = new CorpoEmMovimento({
    tipoDe: (id) => tiposDoMovimento.get(id) ?? null, posicao: (e) => posicaoDoQuadro(e), petDoMovimento: (id) => petsDoMovimento.get(id) ?? null,
    // D-191: a altura do chão desenhado (a escalada sobe rente ao muro).
    chaoPx: (x, y) => {
      const c = centroDaCelula(x, y);
      return camera.projecaoAtual.alturaDoChao(c.x, c.y);
    },
  });
  // Marco 40 (14/11/2026): o companheiro que é o veículo do dono (a montaria, o falcão que carrega) vai com ele.
  const comVeiculo = (p: (e: Entidade) => PontoVisual) => (e: Entidade) => corpoMovimento.posicaoForcada(e, o.estado(), p) ?? p(e);
  corpoMovimento.ligar(o.bus, o.estado, () => performance.now());
  const corDaPonta = (p: PontaElemental) => Number.parseInt((p === 'fisico' ? '#d8cfc0' : ctx.conteudo.elementos.get(p)?.cor ?? '#ffffff').slice(1), 16);
  const rastrosMovimento = new RastrosDeMovimento(palco.chao, palco.efeitos, corpoMovimento, {
    projecao: () => camera.projecaoAtual, posicao: (e) => posicaoDoQuadro(e), reduzido,
    // D-168: a cor da ponta (o Físico, a do aço) e quem o jogador local vê como aliado (o rastro do Piscar com eco).
    corDaPonta,
    // D-181 (16/11/2026): as cinzas da névoa na mistura das afinidades, cada uma pelo quanto participa.
    corDasAfinidades: (e) => corPelaParticipacao(vinculoDe(ctx, e, o.estado().tick), corDaPonta),
    aliadoDoLocal: (e) => {
      const eu = o.estado().entidades.find((x) => x.id === idLocal);
      return e.id === idLocal || (!!eu && podeAjudar(eu, e, ctx.modo));
    },
    // D-170: a formação do círculo do Acelerar e a linha do limite do Posto dos Mortos.
    formarAcelerarMs: ctx.balance.movimentoClasse.acelerar.formarMs, limitePosto: ctx.balance.movimentoClasse.posto.limite,
  });
  rastrosMovimento.ligar(o.bus, o.estado, () => performance.now());  const efeitos = new EfeitosDeHabilidade({
    particulas, impacto, habilidades: o.habilidades, idLocal, qualidade, fase: ctx.fase, diretor,
    // Marco 40 (D-160): a classe da ultimate é a de quem a lança (a família vem do par dele).
    classeDaUltimate: (id, atorId) => {
      if (!ctx.conteudo.ultimates.has(id.replace(/_\d+$/, ''))) return null;
      const e = o.estado().entidades.find((x) => x.id === atorId);
      return e?.bolsa?.classeId ?? e?.classeId ?? null;
    },
    // D-175: o núcleo da skill comum e se ela divide a assinatura com outra (visual-comum.ts).
    comum: (id) => visualComum.get(id) ?? null,
    // D-174: o estilo mais forte e a afinidade dominante de quem lança, para o visual das skills de classe.
    perfilVisual: (atorId) => perfilVisualDe(ctx, o.estado().entidades.find((x) => x.id === atorId), o.estado().tick),
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
    deClasse: (e, id) => !!e.classeId && classeDaHabilidade(ctx.conteudo, id) === e.classeId,
    vertenteDe: (e) => sintoniaDe(ctx, e).vertente?.id ?? null,
  });
  efeitosClasse.ligar(o.bus, o.estado, () => performance.now());
  // Marco 28 (30/10/2026, D-127): a aura visível, os orbes e os marcos do atributo de classe.
  const corDoElemento = (el: string | null | undefined): number | null => {
    const def = ehElemento(el) ? ctx.conteudo.elementos.get(el) : undefined;
    return def ? Number.parseInt(def.cor.slice(1), 16) : null;
  };
  // 08/11/2026 (D-138): a área da aura no chão, acesa só pelo pulso que atinge alguém.
  const areaDaAura = new AreaDaAura({ plano: palco.marcas });
  const efeitosDominio = new EfeitosDeDominio({
    particulas,
    area: areaDaAura,
    // 08/11/2026 (D-138): pelo que é público (sem a bolsa, no online e no Mundo, a aura sumia); a força conta os
    // marcos alcançados (25, 50, 75 e 100: o anel fica mais denso e mais claro).
    // Quando ela aparece quem decide é o pulso (`auraPulsou`, só com alguém atingido); aqui, o raio, a cor e a força.
    auraDe: (e, tick) => {
      if (marcoAMostra(ctx, e, 'auraVisivel') <= 0) return null;
      const raio = e.bolsa ? raioDaAura(ctx, e, tick) : ctx.balance.ajustesClasses.guerreiro.auraRaio + marcoAMostra(ctx, e, 'auraRaio');
      // 08/11/2026 (D-138): a cor vai do amarelo ao vermelho; o fogo nos inimigos sai da força 3. Marco 39 (12/11/2026,
      // D-155): sem o atributo de classe, segue os degraus da trilha de classe (4 por quarto da escala antiga).
      const brilho = Math.min(100, (e.trilhaClasse?.degraus ?? 0) * 4);
      return { raio, cor: corDaAura(brilho), forca: Math.min(4, Math.max(1, Math.floor(brilho / 25))) };
    },
    orbesDe: (e) => {
      const n = e.encarnacao ? marcoAMostra(ctx, e, 'orbes') : 0;
      return n > 0 ? { n, cor: corDoElemento(e.encarnacao) ?? 0xffffff } : null;
    },
  });
  efeitosDominio.ligar(o.bus, o.estado);
  // 08/11/2026 (D-138): os terrenos vivos (a água congelada, o vapor, os focos do Mundo).
  const terrenosVivos = new TerrenosVivosVisual(particulas);
  terrenosVivos.ligar(o.bus);
  const combos = new CamadaCombosTaticos(palco.efeitos, () => camera.projecaoAtual, reduzido, () => qualidade().particulas === 0, 24, particulas);
  combos.ligar(o.bus, o.estado, () => performance.now());
  const luz = new CamadaLuz(palco.luz);
  // Marco 31 (31/10/2026, D-130): o escuro fora da luz. O exterior do Mundo é céu aberto (menos escuro).
  const escuridao = new CamadaEscuridao(palco.escuro, palco.app.renderer);
  const escuroTema = tema?.escuridao ?? ESCURIDAO_PADRAO;
  // Ajuste de 31/10/2026 (pedido do usuário): o escuro fora da luz fica mais claro pela `clareza` (0,5 = metade).
  const nivelEscuro = (ctx.fase.exterior ? vis.escuridaoExterior : escuroTema.nivel) * (1 - vis.clareza);
  // Marco 42 (15/11/2026, D-176): no exterior do Mundo, o escuro segue a hora (mundo/ciclo.ts).
  const escuroAgora = (): { ambiente: number; nivel: number } => {
    if (!ctx.fase.exterior) return { ambiente: escuroTema.ambiente, nivel: nivelEscuro };
    const ciclo = ctx.balance.mundo.ciclo;
    const hora = horaDoMundo(agoraDoMundo(), ciclo);
    // Marco 44 (D-178): a mata fechada não escurece a tela: ela esconde pela sombra das árvores (world/camuflagem.ts).
    return luzDaHora(hora, ciclo);
  };
  let pontosDoQuadro: PontoDeLuz[] = [];
  /** As luzes do quadro, da grade para a tela (depois da câmera aplicada). */
  const desenharEscuro = (agoraMs: number) => {
    const proj = camera.projecaoAtual;
    const zoom = palco.mundo.scale.x || 1;
    escuridao.achatamento = proj.visao === 'iso' ? ACHATAMENTO_ISO : 1;
    let centro: { x: number; y: number } | null = null;
    const luzes: LuzNaTela[] = [];
    for (const p of pontosDoQuadro) {
      const c = centroDaCelula(p.x, p.y);
      const tela = palco.mundo.toGlobal(proj.projetar(c.x, c.y));
      // A luz do jogador sobe até o peito (ilumina o corpo, não só os pés).
      const y = tela.y - (p.jogador && proj.visao === 'iso' ? CELULA_PX * 0.35 * zoom : 0);
      if (p.jogador && !centro) centro = { x: tela.x, y };
      const pulso = reduzido() ? 1 : 0.92 + (cintilacao(agoraMs, p.semente) - 0.55) * 0.8;
      luzes.push({ x: tela.x, y, raio: (p.raio ?? vis.raioObjeto) * CELULA_PX * zoom, cor: p.cor, intensidade: Math.min(1, (p.intensidade ?? 1) * 1.6) * pulso });
    }
    const modo = qualidade().escuridao;
    // D-199: o atributo só é escrito quando muda (escrever no body a cada quadro invalida o estilo da página).
    if (document.body.dataset.escuridao !== modo) document.body.dataset.escuridao = modo;
    const { ambiente, nivel } = escuroAgora();
    // Marco 43 (D-177): no céu aberto, o mínimo de luz cai com a noite (até `realceNoite` na noite fechada).
    const ciclo = ctx.balance.mundo.ciclo;
    const noite = Math.max(0, Math.min(1, nivel / ciclo.quadros.noite.nivel));
    const realceMinimo = ctx.fase.exterior ? vis.realceMinimo + (ciclo.realceNoite - vis.realceMinimo) * noite : vis.realceMinimo;
    // Marco 44 (15/11/2026, D-178): no exterior a noite depende das luzes (postes, fogueiras, a vila, a tocha): a vinheta,
    // que só abre um claro em volta do jogador, apagava todas. Lá, mesmo na qualidade baixa, vale o mapa de luzes, numa
    // resolução menor.
    const noMapa = ctx.fase.exterior && modo === 'vinheta';
    escuridao.desenhar(palco.mundo, palco.largura(), palco.altura(), { modo: noMapa ? 'mapa' : modo, ambiente, nivel, realceMinimo, resolucao: noMapa ? Math.min(vis.resolucaoMapa, 0.3) : vis.resolucaoMapa }, centro, luzes);
  };
  const flash = new Graphics();
  palco.tela.addChild(flash);

  const minimapa = criarMinimapa(ctx, idLocal, toque, o.destinoMapa);
  const prompt = criarPrompt(ctx, idLocal, toque, () => letraInteragir(prefs.teclasMovimento, camera.projecaoAtual.visao === 'iso', prefs.atalhos));
  const indicadorCombo = new IndicadorCombo();
  o.ui.append(minimapa.elemento, prompt.elemento, medidor.elemento);
  faixaSuperior(o.ui).append(indicadorCombo.elemento);

  let pausaAberta = false;
  const aplicarPreferencias = () => {
    document.body.classList.toggle('movimento-reduzido', reduzido());
    for (const n of ['minimo', 'baixo', 'medio', 'alto'] as const) document.body.classList.toggle(`qualidade-${n}`, nivel() === n);
    document.documentElement.style.setProperty('--escala-ui', String(prefs.escalaInterface));
    document.body.dataset.qualidade = nivel();
    document.body.dataset.economia = String(economia());
    motor.definirVolumes({ musica: prefs.volumeMusica, efeitos: prefs.volumeEfeitos, mudo: o.observador || prefs.mudo });
    particulas.limite = qualidade().particulas;
    // Marco 11A: movimento reduzido também reduz as partículas (metade, sem giro).
    particulas.reduzido = reduzido();
    if (particulas.limite === 0) {
      particulas.limpar();
      diretor.limpar();
      corpoMovimento.limpar();
      rastrosMovimento.limpar();
    }
    // D-199: a economia do toque põe o palco em meia resolução (só com a resolução automática).
    const meia = prefs.resolucao === 'auto' && economia() >= ECONOMIA_RESOLUCAO ? 0.5 : 1;
    palco.definirEscala(Math.min(escalaDaResolucao(prefs.resolucao, toque), meia, o.observador ? 1 / Math.min(window.devicePixelRatio || 1, 2) : 1));
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
    direcional: o.direcional ?? toque,
    acoes: o.acoesDaPausa,
    aoMudarPreferencias: (p) => {
      prefs = p;
      if (p.qualidade !== 'auto') monitor.nivel = monitor.teto = p.qualidade;
      aplicarPreferencias();
      o.aoMudarPreferencias(p);
    },
    aoMudarEstado: (aberta) => {
      pausaAberta = aberta;
      if (o.pausaOJogo) motor.pausar(aberta);
    },
  });

  const luzesDeMagia = criarLuzesDeMagia(ctx, o.bus, o.estado, corDoElemento, vis.raioMagia);
  const acesos = decoracoesDaFase(ctx.fase, tema).filter((d) => d.tipo === 'tocha' || d.tipo === 'vela' || d.tipo === 'lava');
  // Marco 31 (D-130): as áreas elementais que brilham (brasas, raios, geada, luz sagrada) iluminam em volta.
  const luzesDasAreas = luzesDosAmbientes(ctx.fase.ambientes ?? []);
  // Marco 42 (15/11/2026, D-176): no Mundo, a luz em volta é a da tocha; sem ela, só um halo curto.
  // Marco 43 (D-177): com a tocha, a luz é quente e forte; sem ela, só um halo frio e fraco nos pés (o luar).
  // Marco 44 (15/11/2026, D-178): à noite, a vila não fica no breu: cada casa tem a janela acesa na frente (luz quente,
  // fraca e curta, como a de uma vela atrás do vidro), além das lanternas dos portões e do poste da praça.
  const janelas = ctx.fase.exterior ? (ctx.fase.telhados ?? []).map((t) => ({ x: t.x + t.largura / 2, y: t.y + t.altura + 0.4 })) : [];
  // E o clarão das ruas: a luz de todas as janelas e lanternas somada, fraca, mais forte no centro e sumindo nos muros.
  const vilas = ctx.fase.exterior ? (ctx.fase.refugios ?? []).filter((r) => r.raio >= 8) : [];
  const semTocha = (e: Entidade) => Boolean(ctx.modo.luzSoComTocha) && !temLuzPropria(e);
  const luzDoJogador = (e: Entidade): { raio: number; cor: number; intensidade: number } => {
    if (semTocha(e)) return { raio: vis.raioSemTocha, cor: 0x9fb4d8, intensidade: vis.intensidadeSemTocha };
    if (ctx.modo.luzSoComTocha) return { raio: vis.raioJogador, cor: 0xff9a48, intensidade: vis.intensidadeTocha };
    return { raio: vis.raioJogador, cor: tema?.luz ?? 0xffd9a0, intensidade: 0.5 };
  };
  const pontosDeLuz = (estado: EstadoJogo, posicao: (e: Entidade) => PontoVisual): PontoDeLuz[] => {
    const pontos: PontoDeLuz[] = [];
    const eu = estado.entidades.find((e) => e.id === idLocal);
    if (eu) {
      const p = posicao(eu);
      // Ajuste de 14/10/2026: o brilho em volta do jogador pela metade (feedback de jogo).
      pontos.push({ x: p.x, y: p.y, semente: 0, ...luzDoJogador(eu), jogador: true });
      // Marco 44 (15/11/2026, D-178): sem tocha, o halo em anéis: a célula do jogador 30% mais clara, o anel seguinte
      // 20% e o outro 10% (`luz.haloSemTocha`). Discos empilhados: cada um soma a diferença para o anel de fora.
      if (semTocha(eu)) {
        const h = vis.haloSemTocha;
        for (let k = 0; k < h.length; k++) {
          const extra = (h[k] ?? 0) - (h[k + 1] ?? 0);
          if (extra > 0) pontos.push({ x: p.x, y: p.y, semente: 0, cor: 0x9fb4d8, intensidade: vis.intensidadeSemTocha * extra, raio: k + 1.5, jogador: true });
        }
      }
      // As tochas, velas e fendas de lava do tema perto do jogador.
      for (const a of luzesDasAreas) if (Math.abs(a.x - p.x) < 14 && Math.abs(a.y - p.y) < 11) pontos.push({ x: a.x, y: a.y, cor: a.cor, semente: a.x * 11 + a.y, intensidade: 0.4, raio: a.raio });
      for (const v of vilas) pontos.push({ x: v.x, y: v.y, cor: 0xffbe80, semente: v.x + v.y * 3, intensidade: vis.intensidadeVila, raio: v.raio * 1.1 });
      for (const j of janelas) if (Math.abs(j.x - p.x) < 16 && Math.abs(j.y - p.y) < 12) pontos.push({ x: j.x, y: j.y, cor: 0xffb466, semente: j.x * 5 + j.y, intensidade: vis.intensidadeJanela, raio: vis.raioJanela });
      for (const d of acesos) if (Math.abs(d.x - p.x) < 12 && Math.abs(d.y - p.y) < 9) pontos.push({ x: d.x, y: d.y - (d.tipo === 'tocha' ? 0.35 : 0), cor: d.tipo === 'vela' ? 0xffd890 : 0xff9a40, semente: d.x * 7 + d.y, intensidade: d.tipo === 'lava' ? 0.4 : 0.6, raio: d.tipo === 'vela' ? vis.raioObjeto : vis.raioTocha });
    }
    // Marco 31 (31/10/2026, D-130): os outros jogadores também levam luz, e os projéteis brilham no escuro.
    for (const e of estado.entidades) {
      if (e.id === idLocal || e.morto || e.arquetipo !== 'jogador' || e.invocacao) continue;
      const q = posicao(e);
      const l = luzDoJogador(e);
      pontos.push({ x: q.x, y: q.y, cor: l.cor, semente: q.x * 3 + q.y, intensidade: l.intensidade * 0.75, raio: l.raio * 0.85, jogador: true });
    }
    // Marco 44 (15/11/2026, D-178): a magia ilumina onde está e por onde passa, na cor do elemento (ui/luzes-magia.ts).
    pontos.push(...luzesDeMagia.pontos(estado, performance.now()));
    const nivelLocal = estado.entidades.find((e) => e.id === idLocal)?.nivel ?? 1;
    for (const obj of estado.objetos) {
      // 16/11/2026 (D-184): a luz de XP do jogador local brilha no escuro, mais forte quanto mais XP leva.
      if (obj.tipo === 'orbe_xp') {
        if (obj.ref === idLocal) pontos.push({ x: obj.x, y: obj.y, cor: COR_ORBE_XP, semente: obj.x * 19 + obj.y, intensidade: 0.25 + 0.55 * brilhoDoOrbeXp(obj, nivelLocal, ctx.balance), raio: 0.8 + 1.4 * brilhoDoOrbeXp(obj, nivelLocal, ctx.balance) });
        continue;
      }
      if (obj.tipo === 'loja' || obj.tipo === 'bau' || obj.tipo === 'saida') pontos.push({ x: obj.x, y: obj.y, cor: 0xffc070, semente: obj.x * 31 + obj.y, raio: vis.raioObjeto, ...(ctx.fase.exterior && { intensidade: vis.intensidadeJanela }) });
      // Marco 42 (15/11/2026, D-176): o poste de tocha e a fogueira (maior) iluminam em volta (marco 43: do alto do poste).
      // Marco 44 (D-178): a fogueira de acampamento só ilumina acesa.
      else if (fogoAceso(obj, estado.tick)) {
        // Marco 44 (D-178): o fogo é a fonte: a chama fica acesa por inteiro (um núcleo curto e pleno, no alto do poste), e
        // a luz que ela joga no chão nasce embaixo dela e cai com a distância.
        const alto = obj.tipo === 'poste_tocha' ? 0.75 : 0.25;
        pontos.push({ x: obj.x, y: obj.y, cor: 0xff9a40, semente: obj.x * 13 + obj.y, intensidade: vis.intensidadeFogo, raio: obj.tipo === 'fogueira' ? vis.raioTocha * 1.6 : vis.raioTocha });
        pontos.push({ x: obj.x - alto, y: obj.y - alto, cor: 0xffd8a0, semente: obj.x * 17 + obj.y, intensidade: 1, raio: obj.tipo === 'fogueira' ? 1.1 : 0.7 });
      }
    }
    const s = ctx.fase.portaSaida;
    if (s) pontos.push({ x: s.x, y: s.y, cor: estado.saidaAberta || s.tranca === 'livre' ? 0x9cf0b0 : 0xb0b0c0, semente: 7, raio: vis.raioObjeto });
    for (const obj of ctx.fase.objetos) if (obj.tipo === 'fonte_som' && obj.som === 'fogo') pontos.push({ x: obj.x, y: obj.y, cor: 0xff9a40, semente: obj.x + obj.y * 13, raio: vis.raioTocha });
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

  const deslizando = (f: (e: Entidade) => PontoVisual) => (e: Entidade) => diretor.ponto(e.id, f(e));

  return {
    particulas,
    encerrar: () => {
      combos.destruir();
      diretor.destruir();
      rastrosMovimento.destruir();
      areaDaAura.destruir();
      motor.destruir();
      sistema.removeEventListener('change', aplicarPreferencias);
    },
    anotarSalvamento: (ms) => {
      medidor.anotarSalvamento(ms);
      monitor.ignorarProximo();
    },
    botaoPausa: pausa.botao,
    abrirPausa: pausa.abrir,
    pausado: () => o.pausaOJogo && pausaAberta,
    menuAberto: pausa.aberta,
    movimentoReduzido: reduzido,
    qualidade,
    quadroPermitido: (agoraMs) => pulador.deveDesenhar(agoraMs, alvoFps()),
    // D-124: o corpo puxado, empurrado ou arremessado desliza em vez de pular.
    posicaoVisual: (base) => comVeiculo(deslizando(voo.posicao(base))),
    ajusteVisual: (e, agoraMs) => {
      const a = corpoMovimento.ajusteForcado(e, agoraMs, o.estado()) ?? voo.ajuste(e, agoraMs) ?? corpoMovimento.ajuste(e, agoraMs, o.estado());
      // Marco 44 (D-178): no escuro, o inimigo além da visão some.
      const estado = o.estado();
      const v = alfaNoEscuro(ctx, estado, estado.entidades.find((x) => x.id === idLocal), e);
      if (v >= 1) return a;
      return a ? { ...a, alfa: (a.alfa ?? 1) * v } : { alturaPx: 0, inclina: 0, escala: 1, tinta: null, quadro: null, zMais: 0, alfa: v };
    },
    quadro: (estado, agoraMs, dtMs, base) => {
      diretor.relogio(agoraMs);
      voo.quadro(estado, agoraMs, base);
      const posicao = comVeiculo(deslizando(voo.posicao(base)));
      posicaoDoQuadro = posicao;
      medidor.registrar(dtMs, agoraMs, estado.tick, () => ({
        vivos: estado.entidades.reduce((n, e) => n + (e.morto ? 0 : 1), 0),
        objetos: estado.objetos.length,
        qualidade: nivel(),
      }));
      if (prefs.qualidade === 'auto') {
        const antes = monitor.nivel;
        const mudou = monitor.registrar(dtMs, agoraMs, alvoFps());
        if (mudou) {
          aplicarPreferencias();
          // Marco 26 (D-122): só a descida avisa; a volta é silenciosa.
          if (PRESETS_QUALIDADE[mudou].particulas < PRESETS_QUALIDADE[antes].particulas) o.aviso(t('aviso.qualidadeReduzida'));
        }
      }
      const eu = estado.entidades.find((e) => e.id === idLocal);
      indicadorCombo.atualizar(estado, ctx, eu);
      const pos = eu ? posicao(eu) : null;
      som.quadro(pos, agoraMs);
      camera.enquadrar(focoDoQuadro(estado, posicao), agoraMs);
      efeitos.quadro(estado, agoraMs, posicao);
      entregaTela.quadro(estado, agoraMs, posicao);
      rastrosMovimento.quadro(estado, agoraMs);
      efeitosClasse.quadro(estado, agoraMs, posicao);
      efeitosDominio.quadro(estado, agoraMs, posicao);
      terrenosVivos.quadro(estado, agoraMs, pos);
      efeitosArma.quadro(estado, agoraMs, posicao);
      combos.desenhar(estado, agoraMs);
      particulas.atualizar(Math.min(100, dtMs));
      pontosDoQuadro = pontosDeLuz(estado, posicao);
      luz.desenhar(pontosDoQuadro, agoraMs, qualidade().luz, reduzido());
      minimapa.atualizar(estado, agoraMs);
      prompt.atualizar(estado, agoraMs);
      const vivas = String(particulas.quantidade);
      if (document.body.dataset.particulas !== vivas) document.body.dataset.particulas = vivas;
      return impacto.quadro(agoraMs).congelado;
    },
    aplicarCamera: (agoraMs) => {
      const q = impacto.quadro(agoraMs);
      camera.aplicar(palco.mundo, q);
      desenharEscuro(agoraMs);
      flash.clear();
      if (q.flash > 0) flash.rect(0, 0, palco.largura(), palco.altura()).fill({ color: q.corFlash, alpha: q.flash });
    },
  };
}

