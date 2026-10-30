// O solo amaldiçoado (marco 27, 29/10/2026, D-126): o básico do Necromante é uma área sob o alvo que pulsa algumas
// vezes e some, sem projétil. A runa do Códice das runas é o mesmo solo, com um pulso só e um atraso. Cada cajado muda
// o solo pela variação (`variacao.solo`): cresce, salta, sai em meia-lua, enraíza, solta uma alma, drena, persegue,
// colhe. A fonte de dano é congelada no lançamento, como a do projétil. Puro e determinístico.

import type { Celula, EntidadeId } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import { buscarEntidade, novoId, type EstadoJogo, type Projetil } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { aleatorio } from '../core/rng';
import { ticksDe } from '../core/tempo';
import { vivo, type Entidade } from '../entities/entidade';
import { podeFerir } from '../modos/relacao';
import { passavel } from '../world/fase';
import { resolverHabilidade } from './compilar-habilidade';
import type { FonteDeDano } from './dano';
import { aplicarEfeito } from './efeitos';
import { celulaOcupada, chebyshev } from './geometria';
import { aplicarImpacto } from './golpe';
import type { Habilidade } from './habilidades';
import { construirEfeito } from './registro-efeitos';
import type { SoloDaVariacao } from './variacoes';

/** Um solo no chão. Só primitivos: a definição vem da habilidade, resolvida pela chave. */
export interface Solo {
  id: number;
  acaoId: number;
  donoId: EntidadeId;
  equipeDono: string;
  chave: string;
  habilidadeId: string;
  x: number;
  y: number;
  /** Para onde a meia-lua abre (de quem lançou para o alvo). */
  dirX: number;
  dirY: number;
  raio: number;
  pulsosRestantes: number;
  /** Quantos pulsos já deu (o primeiro enraíza). */
  pulsados: number;
  proximoTick: number;
  /** Quantas vezes ainda salta ao acabar (Praga). */
  saltos: number;
  /** O solo que persegue segue este alvo até `persegueAteTick`. */
  alvoId?: EntidadeId;
  persegueAteTick?: number;
  bonusAtributo: number;
  carisma: number;
  multRolagem: number;
  potencia: number;
  multDano: number;
  multCura: number;
  d20Minimo?: number;
}

/** A alma do Lamento: velocidade e quanto procura um hostil em volta do solo. */
const ALMA_VELOCIDADE = 7;
const ALMA_RAIO = 5;
/** Até onde a Praga procura o próximo hostil. */
const PRAGA_RAIO = 4;

const hostil = (estado: EstadoJogo, ctx: ContextoSimulacao, s: Pick<Solo, 'donoId' | 'equipeDono'>, e: Entidade) =>
  vivo(e) && e.id !== s.donoId && podeFerir({ id: s.donoId, equipe: s.equipeDono }, e, ctx.modo) && e.invisivelAteTick <= estado.tick;

/** As células do solo agora: um quadrado em volta do centro, ou a meia-lua aberta para a frente. */
export function celulasDoSolo(ctx: ContextoSimulacao, s: Solo, forma: SoloDaVariacao['forma']): Celula[] {
  const celulas: Celula[] = [];
  const r = forma === 'cone' ? s.raio + 1 : s.raio;
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      // A meia-lua: só a metade da frente, sem a ponta de trás.
      if (forma === 'cone' && dx * s.dirX + dy * s.dirY < -0.2) continue;
      const x = s.x + dx;
      const y = s.y + dy;
      if (passavel(ctx.fase, x, y)) celulas.push({ x, y });
    }
  }
  return celulas;
}

function fonteDoSolo(estado: EstadoJogo, s: Solo, pct: number): FonteDeDano {
  const dono = buscarEntidade(estado, s.donoId);
  return {
    id: s.donoId,
    equipe: dono?.equipe ?? s.equipeDono,
    bonusAtributo: s.bonusAtributo,
    carisma: s.carisma,
    multRolagem: s.multRolagem,
    potencia: s.potencia,
    multDano: (s.multDano * pct) / 100,
    multCura: s.multCura,
    ...(s.d20Minimo ? { d20Minimo: s.d20Minimo } : {}),
  };
}

/** Lança o solo sob o alvo (ou na célula mirada). Chamado por acao.ts no lugar do impacto comum. */
export function lancarSolo(estado: EstadoJogo, ator: Entidade, hab: Habilidade, acaoId: number, fonte: FonteDeDano, alvo: Entidade | null, mira: Celula, saida: EventoSimulacao[]): void {
  const def = hab.variacao?.solo;
  if (!def) return;
  const centro = alvo ? celulaOcupada(alvo) : mira;
  const de = celulaOcupada(ator);
  const dx = centro.x - de.x;
  const dy = centro.y - de.y;
  const n = Math.hypot(dx, dy) || 1;
  criarSolo(estado, def, {
    id: novoId(estado),
    acaoId,
    donoId: ator.id,
    equipeDono: ator.equipe,
    chave: hab.chave,
    habilidadeId: hab.id,
    x: centro.x,
    y: centro.y,
    dirX: dx / n,
    dirY: dy / n,
    raio: def.raio,
    pulsosRestantes: def.pulsos,
    pulsados: 0,
    proximoTick: estado.tick + ticksDe(def.atrasoMs),
    saltos: def.salta,
    ...(alvo && def.persegueMs > 0 && { alvoId: alvo.id, persegueAteTick: estado.tick + ticksDe(def.persegueMs) }),
    bonusAtributo: fonte.bonusAtributo,
    carisma: fonte.carisma,
    multRolagem: fonte.multRolagem,
    potencia: fonte.potencia,
    multDano: fonte.multDano,
    multCura: fonte.multCura,
    ...(fonte.d20Minimo ? { d20Minimo: fonte.d20Minimo } : {}),
  }, saida);
}

function criarSolo(estado: EstadoJogo, def: SoloDaVariacao, s: Solo, saida: EventoSimulacao[]): void {
  (estado.solos ??= []).push(s);
  saida.push({ t: 'soloCriado', tick: estado.tick, soloId: s.id, acaoId: s.acaoId, donoId: s.donoId, habilidadeId: s.habilidadeId, chave: s.chave, x: s.x, y: s.y, raio: s.raio, forma: def.forma, atrasoMs: def.atrasoMs });
}

/** Um pulso: fere os hostis no solo; o primeiro enraíza; o dreno cura; a colheita marca quem cai. */
function pulsar(estado: EstadoJogo, ctx: ContextoSimulacao, s: Solo, def: SoloDaVariacao, hab: Habilidade, saida: EventoSimulacao[]): void {
  const celulas = celulasDoSolo(ctx, s, def.forma);
  const dentro = (e: Entidade) => {
    const c = celulaOcupada(e);
    return celulas.some((k) => k.x === c.x && k.y === c.y);
  };
  const alvos = estado.entidades.filter((e) => hostil(estado, ctx, s, e) && dentro(e)).sort((a, b) => (a.id < b.id ? -1 : 1));
  saida.push({ t: 'soloPulsou', tick: estado.tick, soloId: s.id, x: s.x, y: s.y, raio: s.raio, atingidos: alvos.length });
  let drenado = 0;
  const fonte = fonteDoSolo(estado, s, def.pctPulso);
  alvos.forEach((alvo, indice) => {
    const antes = alvo.hp;
    aplicarImpacto(estado, ctx, alvo, { acaoId: s.acaoId, fonte, hab, indice, secundario: indice > 0, mira: { x: s.x, y: s.y } }, saida);
    drenado += Math.max(0, antes - alvo.hp);
    if (s.pulsados === 0 && def.enraizaMs > 0 && vivo(alvo)) {
      aplicarEfeito(estado, ctx, alvo, construirEfeito('enraizado', { duracaoMs: def.enraizaMs }), { id: s.donoId, x: s.x, y: s.y, acaoId: s.acaoId }, null, saida);
    }
    // Colheita: quem cai no solo pode se erguer como morto de quem lançou (necromancia.ts, na morte).
    if (alvo.hp <= 0 && def.colheitaPct > 0 && !alvo.invocacao && aleatorio(estado.rng) * 100 < def.colheitaPct) alvo.colhidoPor = s.donoId;
  });
  s.pulsados++;
  if (def.drenoPct > 0 && drenado > 0) drenar(estado, s, Math.round((drenado * def.drenoPct) / 100), saida);
}

/** O dreno cura quem lançou e os mortos dele, igualmente, sem passar da vida máxima. */
function drenar(estado: EstadoJogo, s: Solo, total: number, saida: EventoSimulacao[]): void {
  if (total <= 0) return;
  const dono = buscarEntidade(estado, s.donoId);
  if (!dono || !vivo(dono)) return;
  const grupo = [dono, ...estado.entidades.filter((e) => vivo(e) && e.invocacao?.donoId === dono.id && !!e.invocacao.necromancia)];
  const parte = Math.max(1, Math.round(total / grupo.length));
  for (const e of grupo) {
    const cura = Math.min(parte, e.hpMax - e.hp);
    if (cura <= 0) continue;
    e.hp += cura;
    saida.push({ t: 'efeitoResultado', tick: estado.tick, alvoId: e.id, origemId: s.donoId, tipo: 'cura', dano: 0, cura, mana: 0 });
  }
}

/** Ao acabar: a Praga salta para o hostil mais perto; o Lamento solta uma alma que persegue um hostil. */
function aoAcabar(estado: EstadoJogo, ctx: ContextoSimulacao, s: Solo, def: SoloDaVariacao, saida: EventoSimulacao[]): void {
  const centro = { x: s.x, y: s.y };
  const perto = (raio: number) =>
    estado.entidades
      .filter((e) => hostil(estado, ctx, s, e) && chebyshev(centro, celulaOcupada(e)) <= raio)
      .sort((a, b) => chebyshev(centro, celulaOcupada(a)) - chebyshev(centro, celulaOcupada(b)) || (a.id < b.id ? -1 : 1));
  if (s.saltos > 0) {
    const fora = perto(PRAGA_RAIO).find((e) => chebyshev(centro, celulaOcupada(e)) > s.raio) ?? perto(PRAGA_RAIO)[0];
    if (fora) {
      const c = celulaOcupada(fora);
      criarSolo(estado, def, { ...s, id: novoId(estado), x: c.x, y: c.y, raio: def.raio, pulsosRestantes: Math.max(1, def.pulsos - 1), pulsados: 1, proximoTick: estado.tick + ticksDe(def.intervaloMs), saltos: s.saltos - 1 }, saida);
    }
  }
  if (def.almaPct > 0) {
    const alvo = perto(ALMA_RAIO)[0];
    if (alvo) soltarAlma(estado, s, alvo, def.almaPct, saida);
  }
}

/** A alma do Lamento é um projétil teleguiado (a variação `guiado` da mesma habilidade) com parte do golpe. */
function soltarAlma(estado: EstadoJogo, s: Solo, alvo: Entidade, pct: number, saida: EventoSimulacao[]): void {
  const c = celulaOcupada(alvo);
  const dx = c.x - s.x;
  const dy = c.y - s.y;
  const n = Math.hypot(dx, dy) || 1;
  const p: Projetil = {
    id: novoId(estado),
    acaoId: s.acaoId,
    donoId: s.donoId,
    equipeDono: s.equipeDono,
    habilidadeId: s.habilidadeId,
    chave: s.chave,
    x: s.x,
    y: s.y,
    dirX: dx / n,
    dirY: dy / n,
    restante: n + 0.5,
    velocidade: ALMA_VELOCIDADE,
    bonusAtributo: s.bonusAtributo,
    carisma: s.carisma,
    multRolagem: s.multRolagem,
    potencia: s.potencia,
    multDano: (s.multDano * pct) / 100,
    multCura: s.multCura,
    atravessa: false,
    atingidos: [],
    var: { fase: 'ida', alvoId: alvo.id, paredes: 0, ricochetes: 0 },
  };
  estado.projeteis.push(p);
  saida.push({ t: 'projetilLancado', tick: estado.tick, projetilId: p.id, acaoId: s.acaoId, donoId: s.donoId, habilidadeId: s.habilidadeId, chave: s.chave });
}

/** Por tick: persegue, pulsa na hora certa, cresce (Expansão) e, no último pulso, acaba (e salta ou solta a alma). */
export function processarSolos(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): void {
  if (!estado.solos?.length) return;
  const restantes: Solo[] = [];
  // Os que nascem no laço (a Praga) entram no fim da lista, são visitados ainda aqui e pulsam no próximo intervalo.
  for (const s of estado.solos) {
    const hab = resolverHabilidade(ctx, s.chave);
    const def = hab?.variacao?.solo;
    if (!hab || !def) {
      saida.push({ t: 'soloFim', tick: estado.tick, soloId: s.id });
      continue;
    }
    if (s.alvoId && (s.persegueAteTick ?? 0) > estado.tick) {
      const alvo = buscarEntidade(estado, s.alvoId);
      if (alvo && vivo(alvo)) {
        const c = celulaOcupada(alvo);
        s.x = c.x;
        s.y = c.y;
      }
    }
    if (estado.tick >= s.proximoTick) {
      pulsar(estado, ctx, s, def, hab, saida);
      s.pulsosRestantes--;
      s.proximoTick = estado.tick + ticksDe(def.intervaloMs);
      if (def.cresce) s.raio++;
      if (s.pulsosRestantes <= 0) {
        aoAcabar(estado, ctx, s, def, saida);
        saida.push({ t: 'soloFim', tick: estado.tick, soloId: s.id });
        continue;
      }
    }
    restantes.push(s);
  }
  estado.solos = restantes;
}
