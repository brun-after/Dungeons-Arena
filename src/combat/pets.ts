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
import { chebyshev } from './geometria';
import type { Habilidade } from './habilidades';
import { construirEfeito } from './registro-efeitos';

export const PETS = ['falcao', 'lobo', 'urso'] as const;
export type Pet = (typeof PETS)[number];

const PRESETS: Record<Pet, string> = { falcao: 'falcao_companheiro', lobo: 'lobo_companheiro', urso: 'urso_companheiro' };

/** O companheiro ativo do Aventureiro (sem escolha, o falcão). */
export const petDe = (e: Entidade): Pet => e.bolsa?.pet ?? 'falcao';
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
  const bolsa = e.bolsa;
  if (!bolsa || bolsa.classeId !== 'aventureiro') return;
  const proximo = PETS[(PETS.indexOf(petDe(e)) + 1) % PETS.length] ?? 'falcao';
  bolsa.pet = proximo;
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

/** Grito de fera (Rosnar, Rugido): o controle dura `baseMs`, mais `porNivelMs` por nível que o alvo tem a menos. */
export function duracaoDoGrito(ctx: ContextoSimulacao, quem: Entidade | undefined, alvo: Entidade): number {
  const g = ctx.balance.ajustesClasses.aventureiro.gritoDeFera;
  const diferenca = Math.max(0, (quem?.nivel ?? alvo.nivel) - alvo.nivel);
  return Math.min(g.maxMs, g.baseMs + diferenca * g.porNivelMs);
}
