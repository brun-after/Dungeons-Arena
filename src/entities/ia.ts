// Inteligência artificial (§2.6) — etapa 2 do tick, só na simulação (no servidor, na arena).
// Três estados contínuos: patrulha -> hesitação -> perseguição. A IA age pelas mesmas funções
// internas que os comandos usam (iniciarAcao, planejarCaminho), nunca por atalho (D-025).
// Alvo, detecção e dano passam sempre por `relacao()` (via alvoOfensivoValido).

import type { Celula, Dir8 } from '../core/comandos';
import type { ContextoSimulacao, RegrasIa } from '../core/contexto';
import { buscarEntidade, type EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { aleatorio, criarRng, escolher, hashTexto, type EstadoRng } from '../core/rng';
import { ticksDe } from '../core/tempo';
import { alvoOfensivoValido, iniciarAcao, prioridadeDeAlvo, recargaRestante } from '../combat/acao';
import { resolverHabilidade } from '../combat/compilar-habilidade';
import { fatoresDoMundo, perfilDaIa, type PerfilIa } from '../modos/dificuldade';
import { excedeLimite } from '../combat/efeitos-fluxo';
import { REGISTRO_EFEITOS } from '../combat/registro-efeitos';
import { celulaOcupada, chebyshev } from '../combat/geometria';
import { ordemRotativa } from '../world/colisao';
import { passavel } from '../world/fase';
import { celulaLivre, pararMovimento, planejarCaminho, VETOR_DIR } from '../world/movimento';
import { emPasso, vivo, type Entidade, type EstadoIa, type ModoIa } from './entidade';
import { processarInvocacao } from './ia-invocacao';
import { alvoMaisFerido, celulaDeCerco, destinoDeCura, fugaDoAviso, perigoDoCaminho } from './ia-tatica';
import { emPerigo, naAreaAfim } from '../world/perigos';
import type { PresetInimigo } from './presets';

const CARDINAIS: readonly Dir8[] = ['N', 'E', 'S', 'O'];
const REVERSA: Readonly<Partial<Record<Dir8, Dir8>>> = { N: 'S', S: 'N', E: 'O', O: 'E' };

const manhattan = (a: Celula, b: Celula) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

/**
 * Hesitação ao detectar o alvo pela primeira vez (§2.6). A tabela da spec vale para 10 s; o tempo
 * sorteado é escalado pela hesitação do preset (D-024). Carisma do alvo acima do neutro multiplica
 * as chances das opções curtas por `fatorCarisma` por ponto: hesita-se mais diante de quem tem Carisma.
 */
export function sortearHesitacaoS(rng: EstadoRng, carismaAlvo: number, carismaNeutro: number, hesitacaoPresetS: number, regras: RegrasIa): number {
  const fator = regras.fatorCarisma ** (carismaAlvo - carismaNeutro);
  const u = aleatorio(rng);
  let acumulado = 0;
  let escolhido = regras.hesitacaoBaseS;
  for (const opcao of regras.hesitacao) {
    acumulado += opcao.chance * fator;
    if (u < acumulado) {
      escolhido = opcao.s;
      break;
    }
  }
  return (escolhido * hesitacaoPresetS) / regras.hesitacaoBaseS;
}

/** Marco 26 (28/10/2026, D-118): o "?" curto — o inimigo reage em no máximo `hesitacaoMaxS`. */
export function hesitacaoComTeto(segundos: number, regras: RegrasIa): number {
  return Math.min(segundos, regras.hesitacaoMaxS);
}

function criarEstadoIa(estado: EstadoJogo, e: Entidade, regras: RegrasIa): EstadoIa {
  // Desvio por id: inimigos da mesma sala não andam todos no mesmo tick.
  const desvio = hashTexto(e.id) % Math.max(1, ticksDe(regras.patrulhaPassoMs));
  return {
    modo: 'patrulha',
    modoDesdeTick: estado.tick,
    alvoId: null,
    hesitacaoAteTick: 0,
    detectados: [],
    foraDaZonaTicks: 0,
    proximaAvaliacaoTick: estado.tick,
    proximoPassoTick: estado.tick + desvio,
    direcaoPatrulha: null,
    recentes: [],
    proximaChecagemDesistenciaTick: 0,
    falhasCaminho: 0,
    alvoCacheX: -1,
    alvoCacheY: -1,
    proximoAtaqueTick: 0,
    ataquesFeitos: 0,
    ultimaAgressaoVista: estado.tick,
    rng: criarRng(hashTexto(`${estado.faseId}:${e.id}:${e.geracao}`)),
  };
}

function mudarModo(ia: EstadoIa, modo: ModoIa, tick: number): void {
  ia.modo = modo;
  ia.modoDesdeTick = tick;
}

/** Hostil válido mais próximo dentro do raio Manhattan; empate por menor HP e depois id. */
function detectar(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, raio: number): Entidade | null {
  const origem = celulaOcupada(e);
  let melhor: Entidade | null = null;
  let melhorDist = Infinity;
  for (const outro of estado.entidades) {
    if (outro.id === e.id || !alvoOfensivoValido(estado, ctx, e, outro)) continue;
    const d = manhattan(origem, celulaOcupada(outro));
    if (d > raio) continue;
    // Avatar hostil primeiro (§2.9, marco 10A-3); depois o mais próximo, menor HP e id.
    const p = prioridadeDeAlvo(outro);
    const pm = melhor ? prioridadeDeAlvo(melhor) : Infinity;
    if (!melhor || p < pm || (p === pm && (d < melhorDist || (d === melhorDist && (outro.hp < melhor.hp || (outro.hp === melhor.hp && outro.id < melhor.id)))))) {
      melhor = outro;
      melhorDist = d;
    }
  }
  return melhor;
}

/** Último tick em que `e` deu dano ao alvo ou recebeu dano dele. */
function ultimaInteracao(e: Entidade, alvo: Entidade): number {
  const dei = alvo.participacao.find((p) => p.id === e.id)?.tick ?? -Infinity;
  const recebi = e.participacao.find((p) => p.id === alvo.id)?.tick ?? -Infinity;
  return Math.max(dei, recebi);
}

export function processarIa(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): void {
  for (const e of ordemRotativa(estado.entidades, estado.tick)) {
    if (e.controlador !== 'ia' || !vivo(e) || e.arquetipo === 'boneco') continue;
    const preset = ctx.conteudo.presets.get(e.preset);
    if (!preset) continue;
    e.ia ??= criarEstadoIa(estado, e, ctx.balance.ia);
    const ia = e.ia;
    // Marco 10A-3: invocações e dominados têm IA própria (§2.9).
    if (e.invocacao) {
      processarInvocacao(estado, ctx, e, ia, preset, saida);
      continue;
    }
    revidar(estado, ctx, e, ia, saida);
    if (reagirAoEstado(estado, ctx, e, ia, saida)) continue;
    switch (ia.modo) {
      case 'patrulha':
        if (!tentarDetectar(estado, ctx, e, ia, preset, saida)) patrulhar(estado, ctx, e, ia);
        break;
      case 'hesitando':
        hesitar(estado, ctx, e, ia, preset, saida);
        break;
      case 'perseguindo':
        perseguir(estado, ctx, e, ia, preset, saida);
        break;
    }
  }
}

/**
 * Marco 18 (17/10/2026): revide imediato. Quem leva um golpe persegue o agressor na hora — sem hesitação, saindo da
 * patrulha ou do "?" — e troca de alvo se outro bater depois. Lê a participação (quem deu dano e quando) e só olha os
 * golpes mais novos que o último já revidado. Regra em `balance.ia.revide`.
 */
function revidar(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, ia: EstadoIa, saida: EventoSimulacao[]): void {
  if (!ctx.balance.ia.revide) return;
  let ultimo: { id: string; tick: number } | null = null;
  for (const p of e.participacao) if (p.tick > ia.ultimaAgressaoVista && (!ultimo || p.tick > ultimo.tick)) ultimo = p;
  if (!ultimo) return;
  ia.ultimaAgressaoVista = ultimo.tick;
  if (ia.modo === 'perseguindo' && ia.alvoId === ultimo.id) return;
  const agressor = buscarEntidade(estado, ultimo.id);
  if (!agressor || !alvoOfensivoValido(estado, ctx, e, agressor)) return;
  comecarPerseguicao(estado, ctx, e, ia, agressor.id, saida);
}

/**
 * Marco 24 (24/10/2026, D-097): os estados que mandam na IA. Aterrorizado foge de quem aplicou; confuso vaga sem
 * atacar; desafiado persegue quem desafiou (e só ele). Devolve se o estado tomou o tick (a IA normal não roda).
 */
function reagirAoEstado(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, ia: EstadoIa, saida: EventoSimulacao[]): boolean {
  const f = e.efeitos.find((x) => x.ateTick > estado.tick && REGISTRO_EFEITOS[x.tipo].ia !== null);
  if (!f) return false;
  const modo = REGISTRO_EFEITOS[f.tipo].ia;
  const quem = buscarEntidade(estado, f.origemId);
  if (modo === 'foge') {
    if (quem && vivo(quem)) recuar(estado, ctx, e, celulaOcupada(quem));
    return true;
  }
  if (modo === 'vaga') {
    patrulhar(estado, ctx, e, ia);
    return true;
  }
  if (quem && alvoOfensivoValido(estado, ctx, e, quem) && (ia.modo !== 'perseguindo' || ia.alvoId !== quem.id)) comecarPerseguicao(estado, ctx, e, ia, quem.id, saida);
  return false;
}

function voltarAPatrulhar(estado: EstadoJogo, e: Entidade, ia: EstadoIa): void {
  mudarModo(ia, 'patrulha', estado.tick);
  ia.alvoId = null;
  ia.falhasCaminho = 0;
  ia.direcaoPatrulha = null;
  pararMovimento(e);
}

function comecarPerseguicao(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, ia: EstadoIa, alvoId: string, saida: EventoSimulacao[]): void {
  // Ajuste de 15/10/2026: quem já foi perseguido volta a ser perseguido sem hesitar.
  if (!ia.detectados.includes(alvoId)) ia.detectados.push(alvoId);
  ia.foraDaZonaTicks = 0;
  mudarModo(ia, 'perseguindo', estado.tick);
  ia.alvoId = alvoId;
  ia.falhasCaminho = 0;
  ia.alvoCacheX = -1;
  ia.alvoCacheY = -1;
  ia.proximaChecagemDesistenciaTick = estado.tick + ticksDe(ctx.balance.ia.checagemDesistenciaMs);
  saida.push({ t: 'iaPerseguindo', tick: estado.tick, id: e.id, alvoId });
}

function tentarDetectar(
  estado: EstadoJogo,
  ctx: ContextoSimulacao,
  e: Entidade,
  ia: EstadoIa,
  preset: PresetInimigo,
  saida: EventoSimulacao[],
): boolean {
  const alvo = detectar(estado, ctx, e, preset.deteccao);
  if (!alvo) return false;
  pararMovimento(e);
  if (ia.detectados.includes(alvo.id)) {
    comecarPerseguicao(estado, ctx, e, ia, alvo.id, saida);
    return true;
  }
  ia.foraDaZonaTicks = 0;
  // Marco 15: a dificuldade encurta ou alonga o "?".
  const segundos = hesitacaoComTeto(sortearHesitacaoS(ia.rng, alvo.atributos.carisma, ctx.balance.combate.carismaNeutro, preset.hesitacaoS, ctx.balance.ia) * fatoresDoMundo(estado, ctx).hesitacao, ctx.balance.ia);
  mudarModo(ia, 'hesitando', estado.tick);
  ia.alvoId = alvo.id;
  ia.hesitacaoAteTick = estado.tick + ticksDe(segundos * 1000);
  saida.push({ t: 'iaNotou', tick: estado.tick, id: e.id, alvoId: alvo.id, hesitacaoAteTick: ia.hesitacaoAteTick });
  return true;
}

/**
 * Hesitação (§2.6). Ajuste de 15/10/2026 (D-060): é preciso **ficar** na zona de atenção. Dentro do raio, a contagem
 * anda; fora, ela pausa e, passada a graça, o inimigo desiste e volta a patrulhar. Quem golpeia o inimigo durante o
 * "?" é perseguido na hora.
 */
function hesitar(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, ia: EstadoIa, preset: PresetInimigo, saida: EventoSimulacao[]): void {
  const alvo = ia.alvoId ? buscarEntidade(estado, ia.alvoId) : undefined;
  // Desarmada se o alvo sumir, morrer ou ficar invisível (§2.6).
  if (!alvo || !alvoOfensivoValido(estado, ctx, e, alvo)) {
    voltarAPatrulhar(estado, e, ia);
    return;
  }
  if (ultimaInteracao(e, alvo) >= ia.modoDesdeTick) {
    comecarPerseguicao(estado, ctx, e, ia, alvo.id, saida);
    return;
  }
  if (manhattan(celulaOcupada(e), celulaOcupada(alvo)) > preset.deteccao) {
    ia.foraDaZonaTicks++;
    ia.hesitacaoAteTick++;
    if (ia.foraDaZonaTicks >= ticksDe(ctx.balance.ia.gracaForaDaZonaMs)) {
      saida.push({ t: 'iaDesistiu', tick: estado.tick, id: e.id, alvoId: alvo.id });
      voltarAPatrulhar(estado, e, ia);
    }
    return;
  }
  ia.foraDaZonaTicks = 0;
  if (estado.tick >= ia.hesitacaoAteTick) comecarPerseguicao(estado, ctx, e, ia, alvo.id, saida);
}

function patrulhar(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, ia: EstadoIa): void {
  const regras = ctx.balance.ia;
  if (estado.tick >= ia.proximaAvaliacaoTick) {
    ia.proximaAvaliacaoTick = estado.tick + ticksDe(regras.patrulhaAvaliacaoMs);
    ia.direcaoPatrulha = escolherDirecaoPatrulha(estado, ctx, e, ia);
  }
  // Só age com a fila de movimento vazia (§2.6).
  if (estado.tick < ia.proximoPassoTick || emPasso(e) || e.caminho.length > 0 || e.waypoints.length > 0) return;
  ia.proximoPassoTick = estado.tick + ticksDe(regras.patrulhaPassoMs);
  if (!ia.direcaoPatrulha) return;
  const [dx, dy] = VETOR_DIR[ia.direcaoPatrulha];
  const destino = { x: e.x + dx, y: e.y + dy };
  // Marco 25 (25/10/2026, D-100): a patrulha não pisa em chão que fere (antes pisava, mesmo sem perseguir).
  if (!celulaLivre(e, destino.x, destino.y, estado, ctx) || emPerigo(estado, ctx, e, destino.x, destino.y)) {
    ia.direcaoPatrulha = null;
    return;
  }
  e.caminho = [destino];
  ia.recentes = [...ia.recentes, { x: e.x, y: e.y }].slice(-3);
}

function escolherDirecaoPatrulha(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, ia: EstadoIa): Dir8 | null {
  const regras = ctx.balance.ia;
  const u = aleatorio(ia.rng);
  if (u < regras.chanceAproximar) {
    // Aproxima do hostil mais próximo, sem limite de raio, pelo eixo de maior distância.
    const alvo = detectar(estado, ctx, e, Infinity);
    if (alvo) {
      const dx = alvo.x - e.x;
      const dy = alvo.y - e.y;
      const d: Dir8 | null = Math.abs(dx) >= Math.abs(dy) && dx !== 0 ? (dx > 0 ? 'E' : 'O') : dy !== 0 ? (dy > 0 ? 'S' : 'N') : null;
      const [vx, vy] = d ? VETOR_DIR[d] : [0, 0];
      if (d && !emPerigo(estado, ctx, e, e.x + vx, e.y + vy)) return d;
    }
  } else if (u < regras.chanceAproximar + regras.chanceManter && ia.direcaoPatrulha) {
    return ia.direcaoPatrulha;
  }
  const reversa = ia.direcaoPatrulha ? REVERSA[ia.direcaoPatrulha] : undefined;
  const andaveis = CARDINAIS.filter((d) => {
    const [dx, dy] = VETOR_DIR[d];
    const c = { x: e.x + dx, y: e.y + dy };
    return passavel(ctx.fase, c.x, c.y) && !ia.recentes.some((r) => r.x === c.x && r.y === c.y);
  });
  // Marco 25 (D-100): fora do perigo; só se não houver outra saída (nasceu no meio das brasas) passa por ele.
  const seguras = andaveis.filter((d) => !emPerigo(estado, ctx, e, e.x + VETOR_DIR[d][0], e.y + VETOR_DIR[d][1]));
  const validas = seguras.length > 0 ? seguras : andaveis;
  const preferidas = validas.filter((d) => d !== reversa);
  const opcoes = preferidas.length > 0 ? preferidas : validas;
  return opcoes.length > 0 ? escolher(ia.rng, opcoes) : null;
}

/** Qual habilidade a IA usa agora: o boss alterna o golpe com a área (§2.6). */
/**
 * Revezamento (marco 8A-2): ataques ímpares usam as habilidades do preset em rodízio; se a da vez
 * estiver em recarga ou estourar o limite do modo, usa o ataque básico (nunca trava tentando).
 */
function habilidadeDaVez(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, ia: EstadoIa): string {
  if (e.habilidades.length === 0 || ia.ataquesFeitos % 2 === 0) return e.ataqueBasico;
  const id = e.habilidades[Math.floor(ia.ataquesFeitos / 2) % e.habilidades.length];
  const hab = id ? resolverHabilidade(ctx, id) : undefined;
  if (!hab || recargaRestante(estado, e.id, hab.id) > 0 || excedeLimite(estado, ctx, e, hab.efeitos)) return e.ataqueBasico;
  return hab.id;
}

function perseguir(
  estado: EstadoJogo,
  ctx: ContextoSimulacao,
  e: Entidade,
  ia: EstadoIa,
  preset: PresetInimigo,
  saida: EventoSimulacao[],
): void {
  const regras = ctx.balance.ia;
  const alvo = ia.alvoId ? buscarEntidade(estado, ia.alvoId) : undefined;
  if (!alvo || !alvoOfensivoValido(estado, ctx, e, alvo)) {
    voltarAPatrulhar(estado, e, ia);
    return;
  }
  // Desiste após um tempo sem interação, checando periodicamente com uma chance (§2.6).
  if (estado.tick >= ia.proximaChecagemDesistenciaTick) {
    ia.proximaChecagemDesistenciaTick = estado.tick + ticksDe(regras.checagemDesistenciaMs);
    const semInteracao = estado.tick - Math.max(ultimaInteracao(e, alvo), ia.modoDesdeTick);
    if (semInteracao >= ticksDe(regras.desistirAposMs) && aleatorio(ia.rng) < regras.chanceDesistir) {
      saida.push({ t: 'iaDesistiu', tick: estado.tick, id: e.id, alvoId: alvo.id });
      voltarAPatrulhar(estado, e, ia);
      return;
    }
  }

  // Marco 25 (25/10/2026, D-100): a tática da dificuldade (entities/ia-tatica.ts).
  const perfil = perfilDaIa(estado, ctx);
  const maisFerido = perfil.focoFracoPct > 0 ? alvoMaisFerido(estado, ctx, e, alvo, preset.deteccao, perfil) : null;
  if (maisFerido) {
    comecarPerseguicao(estado, ctx, e, ia, maisFerido.id, saida);
    return;
  }
  // Quem já conjura o próprio golpe não larga a conjuração para se esquivar.
  const fuga = emPasso(e) || e.acao ? null : fugaDoAviso(estado, ctx, e, perfil);
  if (fuga) {
    const fim = e.caminho.at(-1);
    if (fim?.x !== fuga.x || fim.y !== fuga.y) planejarCaminho(e, fuga, ctx, estado.tick, saida, 4);
    return;
  }

  const hab = resolverHabilidade(ctx, habilidadeDaVez(estado, ctx, e, ia));
  const basico = resolverHabilidade(ctx, e.ataqueBasico);
  if (!hab || !basico) return;
  // O deslocamento segue o alcance do ataque básico; habilidade em si mesmo vale de qualquer distância.
  const alcanceAtaque = hab.politicaAlvo === 'proprio' ? Infinity : hab.alcanceCelulas;
  const origem = celulaOcupada(e);
  const celulaAlvo = celulaOcupada(alvo);
  const distancia = chebyshev(origem, celulaAlvo);
  const mantemDistancia = e.arquetipo === 'atirador' || e.arquetipo === 'controlador';
  const distanciaMax = mantemDistancia ? Math.min(regras.distanciaMaxAtirador, basico.alcanceCelulas) : basico.alcanceCelulas;

  // Atirador e controlador recuam antes de atacar; só atacam de perto se estiverem encurralados. Marco 25: ferido
  // (abaixo de `recuaHpPct`), o atirador mantém a distância máxima.
  const ferido = e.hp * 100 < e.hpMax * perfil.recuaHpPct;
  const distanciaMin = ferido ? distanciaMax : regras.distanciaMinAtirador;
  const cura = destinoDeCura(estado, ctx, e, ia, perfil);
  let recuando = false;
  if (cura) {
    // O afim ferido vai à área do próprio elemento e fica nela (ataca se o alvo vier).
    if (!naAreaAfim(ctx, e)) aproximar(estado, ctx, e, ia, cura, saida, perfil);
    else if (!emPasso(e)) pararMovimento(e);
  } else if (mantemDistancia && distancia < distanciaMin) {
    recuando = recuar(estado, ctx, e, celulaAlvo);
  } else if (distancia > distanciaMax) {
    // O corpo a corpo cerca: cada perseguidor do alvo mira uma célula em volta dele.
    const cerco = perfil.cercar && !mantemDistancia ? celulaDeCerco(estado, ctx, e, alvo) : null;
    aproximar(estado, ctx, e, ia, cerco ?? celulaAlvo, saida, perfil);
  } else if (!emPasso(e)) {
    pararMovimento(e);
  }

  if (!recuando && distancia <= alcanceAtaque && !e.acao && estado.tick >= ia.proximoAtaqueTick) {
    if (iniciarAcao(estado, ctx, e, hab.id, alvo.id, saida)) {
      ia.proximoAtaqueTick = estado.tick + ticksDe(preset.intervaloAtaqueMs);
      ia.ataquesFeitos++;
    }
  }
}

function aproximar(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, ia: EstadoIa, celulaAlvo: Celula, saida: EventoSimulacao[], perfil: PerfilIa): void {
  const regras = ctx.balance.ia;
  const proxima = e.waypoints[0] ?? e.caminho[0];
  const bloqueado = proxima !== undefined && !emPasso(e) && !celulaLivre(e, proxima.x, proxima.y, estado, ctx);
  const semCaminho = !proxima;
  const alvoAndou = ia.alvoCacheX < 0 || manhattan({ x: ia.alvoCacheX, y: ia.alvoCacheY }, celulaAlvo) >= regras.recalcularDistancia;
  if (!semCaminho && !bloqueado && !alvoAndou) return;

  ia.alvoCacheX = celulaAlvo.x;
  ia.alvoCacheY = celulaAlvo.y;
  if (planejarCaminho(e, celulaAlvo, ctx, estado.tick, saida, regras.maxPassosPerseguicao, perigoDoCaminho(estado, ctx, e, perfil))) {
    ia.falhasCaminho = 0;
    return;
  }
  // Após algumas falhas seguidas, desiste deste alvo (§2.3: cache do perseguidor).
  ia.falhasCaminho++;
  if (ia.falhasCaminho >= regras.maxFalhasCaminho) {
    saida.push({ t: 'iaDesistiu', tick: estado.tick, id: e.id, alvoId: ia.alvoId ?? '' });
    voltarAPatrulhar(estado, e, ia);
  }
}

/**
 * Atirador e controlador recuam para a vizinha livre que mais se afasta do alvo.
 * Retorna se está recuando (passo em curso ou vizinha melhor encontrada); false = encurralado.
 */
function recuar(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, celulaAlvo: Celula): boolean {
  if (emPasso(e)) return true;
  let melhor: Celula | null = null;
  let melhorCheb = chebyshev({ x: e.x, y: e.y }, celulaAlvo);
  let melhorMan = manhattan({ x: e.x, y: e.y }, celulaAlvo);
  for (const d of CARDINAIS) {
    const [dx, dy] = VETOR_DIR[d];
    const c = { x: e.x + dx, y: e.y + dy };
    if (!celulaLivre(e, c.x, c.y, estado, ctx)) continue;
    const cheb = chebyshev(c, celulaAlvo);
    const man = manhattan(c, celulaAlvo);
    if (cheb > melhorCheb || (cheb === melhorCheb && man > melhorMan)) {
      melhor = c;
      melhorCheb = cheb;
      melhorMan = man;
    }
  }
  e.direcao = 'parado';
  e.waypoints = [];
  e.caminho = melhor ? [melhor] : [];
  return melhor !== null;
}

