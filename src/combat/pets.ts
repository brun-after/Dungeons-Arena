// Marco 40 (13/11/2026, D-165): os três companheiros do Aventureiro (Grimório das Skills, "Os companheiros do
// Aventureiro"). Um ativo por vez — falcão, lobo ou urso —, trocado pela skill fixa da tecla 1 (Troca de companheiro).
// O companheiro é o veículo: as skills de classe saem dele (`origemDaHabilidade`) e cada uma tem a versão do lobo e a
// do urso (as variantes `pet_lobo` e `pet_urso` em skills.json; o falcão é a skill como está). A vida é a do dono: o
// golpe no companheiro cai no Aventureiro, na fração de cada um (o falcão, frágil; o urso, o que mais aguenta), e
// cada um é atingido por uma coisa: o falcão, no ar, só por projéteis; o lobo, por golpes de perto e projéteis; o urso,
// por tudo. O lobo fica colado no dono e toma para si um golpe de perto de tempos em tempos; o urso provoca quem chega.

import type { ContextoSimulacao } from '../core/contexto';
import { buscarEntidade, type EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import { vivo, type Entidade } from '../entities/entidade';
import { podeFerir } from '../modos/relacao';
import { reflexoDoFalcao } from './ajustes-classes';
import { aplicarEfeito } from './efeitos';
import { celulaOcupada, chebyshev } from './geometria';
import type { Celula } from '../core/comandos';
import { passavel } from '../world/fase';
import type { Habilidade } from './habilidades';
import { construirEfeito } from './registro-efeitos';

export const PETS = ['falcao', 'lobo', 'urso'] as const;
export type Pet = (typeof PETS)[number];

const PRESETS: Record<Pet, string> = { falcao: 'falcao_companheiro', lobo: 'lobo_companheiro', urso: 'urso_companheiro' };

/** O companheiro ativo do Aventureiro (sem escolha, o falcão). */
export const petDe = (e: Entidade): Pet => e.bolsa?.pet ?? e.petAtivo ?? 'falcao';
export const presetDoPet = (pet: Pet): string => PRESETS[pet];
/** Qual dos três é este companheiro (pelo preset). */
export const petDoCompanheiro = (c: Entidade): Pet => PETS.find((p) => PRESETS[p] === c.preset) ?? 'falcao';

/** A fração do dano no companheiro que chega ao dono (cai com o nível até o nível pleno). */
export function reflexoDoPet(ctx: ContextoSimulacao, pet: Pet, nivel: number): number {
  if (pet === 'falcao') return reflexoDoFalcao(ctx, nivel);
  const [inicio, fim] = ctx.balance.ajustesClasses.aventureiro.pets[pet].reflexoPct;
  const pleno = ctx.balance.xp.nivelPlenoDasClasses;
  const t = (Math.min(pleno, Math.max(1, nivel)) - 1) / (pleno - 1);
  return (inicio + (fim - inicio) * t) / 100;
}

/** O golpe alcança o companheiro? O falcão, no ar, só leva projéteis; o lobo, golpes de perto e projéteis; o urso, tudo. */
export function golpeAlcancaOPet(pet: Pet, hab: Habilidade): boolean {
  if (pet === 'falcao') return hab.politicaImpacto === 'projetil';
  if (pet === 'lobo') return hab.politicaImpacto === 'projetil' || hab.politicaImpacto === 'contato';
  return true;
}

/** O passo do lobo e do urso, em ms por célula (o falcão tem o voo dele). */
export const passoDoPet = (ctx: ContextoSimulacao, pet: Exclude<Pet, 'falcao'>): number => ctx.balance.ajustesClasses.aventureiro.pets[pet].passoMs;

/** Troca de companheiro: o próximo (do falcão ao lobo, do lobo ao urso, do urso ao falcão); o que sai some e o novo chega no tick seguinte. */
export function trocarPet(estado: EstadoJogo, e: Entidade, saida: EventoSimulacao[]): void {
  // Marco 40 (14/11/2026, D-166): também na arena, onde a ficha não tem bolsa (o companheiro fica na entidade).
  if (!marcaComOBasico(e)) return;
  const proximo = PETS[(PETS.indexOf(petDe(e)) + 1) % PETS.length] ?? 'falcao';
  if (e.bolsa) e.bolsa.pet = proximo;
  e.petAtivo = proximo;
  for (const c of estado.entidades) {
    if (!vivo(c) || c.invocacao?.donoId !== e.id || !c.invocacao.companheiro) continue;
    c.invocacao.companheiro = false;
    c.hp = 0;
    c.participacao = [];
  }
  saida.push({ t: 'companheiroTrocado', tick: estado.tick, id: e.id, pet: proximo });
}

/** O lobo colado no dono toma para si o golpe de perto (um a cada `interceptarMs`). Devolve o lobo, se tomou. */
export function loboIntercepta(estado: EstadoJogo, ctx: ContextoSimulacao, alvo: Entidade, hab: Habilidade): Entidade | null {
  if (hab.politicaImpacto !== 'contato' || hab.formulaDano === null || !alvo.bolsa || petDe(alvo) !== 'lobo') return null;
  const lobo = estado.entidades.find((c) => vivo(c) && c.invocacao?.companheiro && c.invocacao.donoId === alvo.id);
  if (!lobo || chebyshev(lobo, alvo) > 1) return null;
  const chave = `lobo:intercepta:${alvo.id}`;
  if ((estado.recargas[chave] ?? 0) > estado.tick) return null;
  estado.recargas[chave] = estado.tick + ticksDe(ctx.balance.ajustesClasses.aventureiro.pets.lobo.interceptarMs);
  return lobo;
}

/** A cada `provocarMs`, o urso provoca os inimigos perto dele (eles vão atrás do urso). */
export function processarPets(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): void {
  const u = ctx.balance.ajustesClasses.aventureiro.pets.urso;
  if (estado.tick % ticksDe(u.provocarMs) !== 0) return;
  for (const urso of estado.entidades) {
    if (!vivo(urso) || !urso.invocacao?.companheiro || petDoCompanheiro(urso) !== 'urso') continue;
    const dono = buscarEntidade(estado, urso.invocacao.donoId);
    if (!dono) continue;
    for (const o of estado.entidades) {
      if (o === urso || !vivo(o) || o.invocacao || chebyshev(o, urso) > u.provocarRaio || !podeFerir(dono, o, ctx.modo)) continue;
      aplicarEfeito(estado, ctx, o, construirEfeito('desafiado', { duracaoMs: u.provocarMs, pct: 0 }), { id: urso.id, x: urso.x, y: urso.y }, null, saida);
    }
  }
}

// --- Marco 40 (14/11/2026, D-166): a caça marcada. O básico do Aventureiro não fere: marca o alvo, e o companheiro
// ativo vai até ele (mais rápido enquanto caça) e ataca com o básico dele. A recarga do básico dobra
// (`ajustesClasses.aventureiro.marca`). As skills de contato do lobo e do urso saem num bote até o alvo.

/** Quem marca a caça com o básico: o Aventureiro (não as invocações dele). */
export const marcaComOBasico = (e: Entidade): boolean => (e.bolsa?.classeId ?? e.classeId ?? '') === 'aventureiro' && !e.invocacao;

const companheiroVivo = (estado: EstadoJogo, dono: Entidade): Entidade | undefined =>
  estado.entidades.find((c) => vivo(c) && c.invocacao?.companheiro === true && c.invocacao.donoId === dono.id);

/** O básico do Aventureiro acertou: marca o alvo para o companheiro (e não fere). */
export function marcarACaca(estado: EstadoJogo, dono: Entidade, alvo: Entidade, saida: EventoSimulacao[]): boolean {
  if (!marcaComOBasico(dono)) return false;
  // Marcar o companheiro de outro marca o dono dele (o falcão no ar nem leva mordida; a caça é quem o comanda). A marca
  // fica no dono: o companheiro que chega na troca segue caçando.
  const presa = alvo.invocacao?.companheiro ? (buscarEntidade(estado, alvo.invocacao.donoId) ?? alvo) : alvo;
  dono.cacaMarcada = presa.id;
  saida.push({ t: 'cacaMarcada', tick: estado.tick, id: dono.id, alvoId: presa.id });
  return true;
}

/** O alvo marcado do companheiro, se ainda vivo (o morto apaga a marca). */
export function cacaDoPet(estado: EstadoJogo, pet: Entidade): Entidade | null {
  if (!pet.invocacao?.companheiro) return null;
  const dono = buscarEntidade(estado, pet.invocacao.donoId);
  const id = dono?.cacaMarcada;
  if (!dono || !id) return null;
  const alvo = buscarEntidade(estado, id);
  if (alvo && vivo(alvo)) return alvo;
  dono.cacaMarcada = null; // null, não delete: o patch da arena não remove campos (14/11/2026).
  return null;
}

/** O fator de velocidade do companheiro que corre atrás da caça marcada. */
export const pressaDaCaca = (estado: EstadoJogo, ctx: ContextoSimulacao, pet: Entidade): number =>
  cacaDoPet(estado, pet) ? 1 + ctx.balance.ajustesClasses.aventureiro.marca.velocidadePct / 100 : 1;

/**
 * O bote do lobo e do urso na skill de contato: o companheiro corre até a célula livre ao lado do alvo, na velocidade
 * dele (com a pressa da caça), e o golpe chega quando ele chega. Devolve os ticks do bote (null: sem bote, o falcão).
 */
export function boteDoPet(estado: EstadoJogo, ctx: ContextoSimulacao, dono: Entidade, mira: Celula, alvoId: string | null, saida: EventoSimulacao[]): number | null {
  const pet = companheiroVivo(estado, dono);
  const tipo = pet ? petDoCompanheiro(pet) : 'falcao';
  if (!pet || tipo === 'falcao') return null;
  const de = celulaOcupada(pet);
  let melhor: Celula | null = null;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const c = { x: mira.x + dx, y: mira.y + dy };
      if ((dx === 0 && dy === 0) || !passavel(ctx.fase, c.x, c.y)) continue;
      if (estado.entidades.some((o) => o !== pet && vivo(o) && !o.invocacao?.companheiro && celulaOcupada(o).x === c.x && celulaOcupada(o).y === c.y)) continue;
      if (!melhor || chebyshev(c, de) < chebyshev(melhor, de)) melhor = c;
    }
  }
  if (!melhor) return null;
  const celulas = chebyshev(de, melhor);
  const ms = (celulas * passoDoPet(ctx, tipo)) / (1 + ctx.balance.ajustesClasses.aventureiro.marca.velocidadePct / 100);
  pet.x = melhor.x;
  pet.y = melhor.y;
  pet.px = melhor.x;
  pet.py = melhor.y;
  pet.caminho = [];
  pet.waypoints = [];
  if (alvoId) dono.cacaMarcada = alvoId;
  if (celulas > 0) saida.push({ t: 'deslocado', tick: estado.tick, id: pet.id, deX: de.x, deY: de.y, paraX: melhor.x, paraY: melhor.y, origemId: pet.id, causa: 'avanco', ms });
  return ticksDe(ms);
}

/** Grito de fera (Rosnar, Rugido): o controle dura `baseMs`, mais `porNivelMs` por nível que o alvo tem a menos. */
export function duracaoDoGrito(ctx: ContextoSimulacao, quem: Entidade | undefined, alvo: Entidade): number {
  const g = ctx.balance.ajustesClasses.aventureiro.gritoDeFera;
  const diferenca = Math.max(0, (quem?.nivel ?? alvo.nivel) - alvo.nivel);
  return Math.min(g.maxMs, g.baseMs + diferenca * g.porNivelMs);
}
