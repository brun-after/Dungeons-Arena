// A sintonia do Necromante (marco 24, 24/10/2026, D-095): a família das gerais de tecla muda os mortos (o servo, os
// reanimados e os ecos); as vertentes Lich, Senhor da praga e Pastor das almas somam as suas. Cada função é o ponto de
// entrada de um tipo do vocabulário (progression/sintonia-efeitos.ts); os números vêm de data/sintonia.json.

import type { ContextoSimulacao } from '../core/contexto';
import { buscarEntidade, type EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { aleatorio } from '../core/rng';
import { ticksDe } from '../core/tempo';
import { vivo, type Entidade } from '../entities/entidade';
import { podeAjudar, podeFerir } from '../modos/relacao';
import { efeitoDeSintonia, efeitosDeSintonia, somaDeSintonia } from '../progression/sintonia';
import { definicaoDe } from './compilar-habilidade';
import { aplicarEfeito, REGISTRO_EFEITOS, type OrigemDoEfeito } from './efeitos';
import { causarDano } from './efeitos-fluxo';
import { celulaOcupada, chebyshev } from './geometria';
import type { Habilidade } from './habilidades';
import { construirEfeito, type EfeitoCanonico } from './registro-efeitos';

const origemDe = (e: Entidade): OrigemDoEfeito => ({ id: e.id, x: e.x, y: e.y });
const ativo = (e: Entidade, tipo: string, tick: number): boolean => e.efeitos.some((f) => f.tipo === tipo && f.ateTick > tick);

/** O Necromante dono de um morto (servo, reanimado ou eco); undefined para o resto. */
export function donoDoMorto(estado: EstadoJogo, e: Entidade | undefined): Entidade | undefined {
  if (!e?.invocacao?.necromancia) return undefined;
  const dono = buscarEntidade(estado, e.invocacao.donoId);
  return dono && vivo(dono) ? dono : undefined;
}

/** Os mortos vivos de um dono, do mais perto ao mais longe de `de`. */
function mortosDe(estado: EstadoJogo, dono: Entidade, de: Entidade): Entidade[] {
  const c = celulaOcupada(de);
  return estado.entidades
    .filter((e) => vivo(e) && e.invocacao?.donoId === dono.id && !!e.invocacao.necromancia)
    .sort((a, b) => chebyshev(c, celulaOcupada(a)) - chebyshev(c, celulaOcupada(b)) || (a.id < b.id ? -1 : 1));
}

/**
 * O golpe de um morto que feriu: técnica (sangra), veneno e Senhor da praga (envenena, também em volta, e o veneno
 * dobra nos aterrorizados), e psíquico (3 mortos no mesmo hostil o aterrorizam).
 */
export function aoGolpeDoMorto(estado: EstadoJogo, ctx: ContextoSimulacao, morto: Entidade, alvo: Entidade, saida: EventoSimulacao[]): void {
  const dono = donoDoMorto(estado, morto);
  if (!dono || !vivo(alvo) || !podeFerir(dono, alvo, ctx.modo)) return;
  const tick = estado.tick;
  const dobras = efeitosDeSintonia(ctx, dono, 'estadoDobraEm', tick);
  const reforcar = (e: Entidade, ef: EfeitoCanonico): EfeitoCanonico =>
    dobras.some((d) => d.estado === ef.tipo && d.habilidade && ativo(e, d.habilidade, tick)) ? { ...ef, valor: ef.valor * 2 } : ef;
  for (const ef of efeitosDeSintonia(ctx, dono, 'mortoAplica', tick)) {
    if (!ef.efeito) continue;
    for (const e of estado.entidades) {
      if (e !== alvo && (ef.raio <= 0 || !vivo(e) || !podeFerir(dono, e, ctx.modo) || chebyshev(celulaOcupada(e), celulaOcupada(alvo)) > ef.raio)) continue;
      aplicarEfeito(estado, ctx, e, reforcar(e, ef.efeito), origemDe(morto), { x: e.x, y: e.y }, saida);
    }
  }
  const medo = efeitoDeSintonia(ctx, dono, 'mortoAterroriza', tick);
  if (!medo?.efeito) return;
  // Os golpes recentes de cada morto em cada hostil, no dono: `golpe:alvo/geração:morto` com o tick.
  const janela = ticksDe(medo.ms);
  const prefixo = `golpe:${alvo.id}/${alvo.geracao}:`;
  const vistos = { ...Object.fromEntries(Object.entries(dono.sintoniaVistos ?? {}).filter(([, t]) => tick - t <= janela)), [prefixo + morto.id]: tick };
  const golpes = Object.keys(vistos).filter((k) => k.startsWith(prefixo));
  const aterroriza = golpes.length >= medo.n;
  dono.sintoniaVistos = aterroriza ? Object.fromEntries(Object.entries(vistos).filter(([k]) => !k.startsWith(prefixo))) : vistos;
  if (aterroriza) aplicarEfeito(estado, ctx, alvo, medo.efeito, origemDe(dono), null, saida);
}

/** Suporte: as curas e os escudos gerais do Necromante também saltam para os mortos mais perto do alvo. */
export function curaGeralNosMortos(estado: EstadoJogo, ctx: ContextoSimulacao, dono: Entidade, alvo: Entidade, hab: Habilidade, cura: number, saida: EventoSimulacao[]): void {
  if (!definicaoDe(ctx, hab.id)?.familiaGeral || alvo.invocacao?.necromancia) return;
  const n = Math.max(0, ...efeitosDeSintonia(ctx, dono, 'curaGeralNosMortos', estado.tick).map((ef) => ef.n));
  if (n <= 0) return;
  const escudos = hab.efeitos.filter((ef) => REGISTRO_EFEITOS[ef.tipo].escudo && ef.em !== 'conjurador');
  if (cura <= 0 && escudos.length === 0) return;
  for (const m of mortosDe(estado, dono, alvo).filter((m) => m !== alvo).slice(0, n)) {
    if (cura > 0) aplicarEfeito(estado, ctx, m, construirEfeito('cura', { valor: cura }), origemDe(dono), null, saida);
    for (const ef of escudos) aplicarEfeito(estado, ctx, m, ef, origemDe(dono), null, saida);
  }
}

/** Arcana, fogo, sagrado e Pastor das almas: o morto que cai solta uma seta, explode em chamas ou cura em volta. */
export function aoCairOMorto(estado: EstadoJogo, ctx: ContextoSimulacao, morto: Entidade, saida: EventoSimulacao[]): void {
  const dono = donoDoMorto(estado, morto);
  if (!dono) return;
  const tick = estado.tick;
  const c = celulaOcupada(morto);
  const hostis = estado.entidades.filter((e) => vivo(e) && e !== morto && podeFerir(dono, e, ctx.modo))
    .sort((a, b) => chebyshev(c, celulaOcupada(a)) - chebyshev(c, celulaOcupada(b)) || (a.id < b.id ? -1 : 1));
  for (const ef of efeitosDeSintonia(ctx, dono, 'mortoCaiSeta', tick)) {
    const alvo = hostis.find((e) => chebyshev(c, celulaOcupada(e)) <= ef.raio && e.invisivelAteTick <= tick);
    if (alvo) causarDano(estado, ctx, alvo, ef.valor, dono.id, 'armadilha', saida);
  }
  for (const ef of efeitosDeSintonia(ctx, dono, 'mortoCaiExplode', tick)) {
    saida.push({ t: 'explodiu', tick, id: morto.id, x: morto.x, y: morto.y, raio: ef.raio });
    for (const e of hostis.filter((h) => chebyshev(c, celulaOcupada(h)) <= ef.raio)) {
      causarDano(estado, ctx, e, ef.valor, dono.id, 'armadilha', saida);
      if (ef.efeito) aplicarEfeito(estado, ctx, e, ef.efeito, origemDe(dono), null, saida);
    }
  }
  const curas = efeitosDeSintonia(ctx, dono, 'mortoCaiCura', tick);
  if (curas.length === 0) return;
  const valor = Math.max(...curas.map((ef) => ef.valor));
  const raio = Math.max(...curas.map((ef) => ef.raio));
  for (const e of estado.entidades) {
    if (!vivo(e) || e === morto || e.invocacao || !podeAjudar(dono, e, ctx.modo) || chebyshev(c, celulaOcupada(e)) > raio) continue;
    aplicarEfeito(estado, ctx, e, construirEfeito('cura', { valor }), origemDe(dono), null, saida);
  }
}

/** Terra: os mortos têm mais vida (no momento em que se erguem). */
export function vidaDoMorto(ctx: ContextoSimulacao, dono: Entidade, hpMax: number, tick: number): number {
  return Math.round(hpMax * (1 + somaDeSintonia(ctx, dono, 'mortoVida', 'pct', tick) / 100));
}

/** Terra: os mortos não sofrem empurrão nem puxão. */
export function mortoInamovivel(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade): boolean {
  const dono = donoDoMorto(estado, e);
  return !!dono && efeitoDeSintonia(ctx, dono, 'mortoInamovivel', estado.tick) !== null;
}

/** Sombra: o morto esquiva parte dos golpes (usa o RNG só quando a sintonia vale). */
export function mortoEsquivou(estado: EstadoJogo, ctx: ContextoSimulacao, alvo: Entidade): boolean {
  const dono = donoDoMorto(estado, alvo);
  if (!dono) return false;
  const pct = somaDeSintonia(ctx, dono, 'mortoEsquiva', 'pct', estado.tick);
  return pct > 0 && aleatorio(estado.rng) * 100 < Math.min(100, pct);
}

/** Lich: o ataque do morto vira esta habilidade, de até `raio` células (null: o golpe de perto de sempre). */
export function ataqueDoMorto(estado: EstadoJogo, ctx: ContextoSimulacao, morto: Entidade): { habilidade: string; alcance: number } | null {
  const dono = donoDoMorto(estado, morto);
  const ef = dono ? efeitoDeSintonia(ctx, dono, 'mortoAtira', estado.tick) : null;
  return ef?.habilidade ? { habilidade: ef.habilidade, alcance: Math.max(1, ef.raio) } : null;
}

/** Pastor das almas: o servo que cai volta mais cedo (ms; null: o tempo de sempre). */
export function retornoDoServo(ctx: ContextoSimulacao, dono: Entidade | undefined, tick: number): number | null {
  const ef = dono ? efeitoDeSintonia(ctx, dono, 'retornoDoServo', tick) : null;
  return ef ? ef.ms : null;
}
