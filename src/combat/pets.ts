// Marco 40 (13/11/2026, D-165): os três companheiros do Aventureiro (Grimório das Skills, "Os companheiros do
// Aventureiro"). Um ativo por vez — falcão, lobo ou urso —, trocado no Shift (D-188; antes, a skill fixa da tecla 1).
// D-188 (19/11/2026): cada um tem um fôlego (combat/feras.ts); o cansado não luta nem é veículo.
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
import { aplicarEfeito } from './efeitos';
import { celulaOcupada, chebyshev } from './geometria';
import type { Celula } from '../core/comandos';
import { passavel } from '../world/fase';
import type { Habilidade } from './habilidades';
import { construirEfeito } from './registro-efeitos';
import { leituraDoAtivo, leituraDoCompanheiro } from './pets-estilos';

export const PETS = ['falcao', 'lobo', 'urso'] as const;
export type Pet = (typeof PETS)[number];

const PRESETS: Record<Pet, string> = { falcao: 'falcao_companheiro', lobo: 'lobo_companheiro', urso: 'urso_companheiro' };

/** O companheiro ativo do Aventureiro (sem escolha, o falcão). */
export const petDe = (e: Entidade): Pet => e.bolsa?.pet ?? e.petAtivo ?? 'falcao';
export const presetDoPet = (pet: Pet): string => PRESETS[pet];
/**
 * D-204 (22/11/2026): a cópia da fera que as ultimates do Aventureiro trazem no lugar das criaturas. Faz o que a fera
 * faz (caça a marca, segue o dono, o urso provoca), com vida própria e o tempo das criaturas que substitui.
 */
export const ehCopiaDoPet = (c: Entidade): boolean => c.invocacao?.copiaDoPet === true;

/** D-204: a fera ou uma cópia dela (quem caça a marca do dono). */
const cacaPelaMarca = (c: Entidade): boolean => c.invocacao?.companheiro === true || ehCopiaDoPet(c);

/** D-204: com uma cópia viva, o repasse do dano na fera ao dono cai (dividido por `copiasDoPet.repasseDivisor`). */
export function fatorDasCopias(estado: EstadoJogo, ctx: ContextoSimulacao, dono: Entidade): number {
  const viva = estado.entidades.some((c) => vivo(c) && ehCopiaDoPet(c) && c.invocacao?.donoId === dono.id);
  return viva ? 1 / Math.max(1, ctx.balance.ajustesClasses.aventureiro.copiasDoPet.repasseDivisor) : 1;
}

/** D-204: a caça acaba (a troca de fera e o Chamado). A fera e as cópias param de perseguir e voltam ao dono. */
export function soltarACaca(dono: Entidade): void {
  if (dono.cacaMarcada) dono.cacaMarcada = null; // null, não delete: o patch da arena não remove campos.
}

/** Qual dos três é este companheiro (pelo preset). */
export const petDoCompanheiro = (c: Entidade): Pet => PETS.find((p) => PRESETS[p] === c.preset) ?? 'falcao';

/** A classe de quem tem feras (pela bolsa ou, na rede, pelo `classeId`). */
export const classeDoAventureiro = (e: Entidade): string => e.bolsa?.classeId ?? e.classeId ?? '';

/** D-188: a fera não está cansada (descansada, pode levar e lutar). */
export const feraDisponivel = (e: Entidade, pet: Pet): boolean => e.feras?.[pet]?.cansado !== true;

/** D-188: a fera da vez está descansada (com as três cansadas, a da vez também está). */
export const feraAtivaDisponivel = (e: Entidade): boolean => feraDisponivel(e, petDe(e));

/** D-188: este companheiro está cansado (não luta, não protege, não provoca). */
export function companheiroCansado(estado: EstadoJogo, c: Entidade): boolean {
  if (!c.invocacao?.companheiro) return false;
  const dono = buscarEntidade(estado, c.invocacao.donoId);
  return !!dono && !feraDisponivel(dono, petDoCompanheiro(c));
}

/** O golpe alcança o companheiro? O falcão, no ar, só leva projéteis; o lobo, golpes de perto e projéteis; o urso, tudo. */
export function golpeAlcancaOPet(pet: Pet, hab: Habilidade): boolean {
  if (pet === 'falcao') return hab.politicaImpacto === 'projetil';
  if (pet === 'lobo') return hab.politicaImpacto === 'projetil' || hab.politicaImpacto === 'contato';
  return true;
}

/** O passo do lobo e do urso, em ms por célula (o falcão tem o voo dele). */
export const passoDoPet = (ctx: ContextoSimulacao, pet: Exclude<Pet, 'falcao'>): number => ctx.balance.ajustesClasses.aventureiro.pets[pet].passoMs;

/** O lobo colado no dono toma para si o golpe de perto (um a cada `interceptarMs`). Devolve o lobo, se tomou. */
export function loboIntercepta(estado: EstadoJogo, ctx: ContextoSimulacao, alvo: Entidade, hab: Habilidade): Entidade | null {
  if (hab.politicaImpacto !== 'contato' || hab.formulaDano === null || !alvo.bolsa || petDe(alvo) !== 'lobo') return null;
  const lobo = estado.entidades.find((c) => vivo(c) && c.invocacao?.companheiro && c.invocacao.donoId === alvo.id);
  // D-188: o lobo cansado não toma golpe por ninguém.
  if (!lobo || chebyshev(lobo, alvo) > 1 || !feraDisponivel(alvo, 'lobo')) return null;
  const chave = `lobo:intercepta:${alvo.id}`;
  if ((estado.recargas[chave] ?? 0) > estado.tick) return null;
  // D-173: o lobo do Sobrevivente toma golpes mais vezes.
  const menos = Math.min(80, leituraDoAtivo(ctx, alvo, 'interceptarMenosPct'));
  estado.recargas[chave] = estado.tick + ticksDe(ctx.balance.ajustesClasses.aventureiro.pets.lobo.interceptarMs * (1 - menos / 100));
  return lobo;
}

/** A cada `provocarMs`, o urso provoca os inimigos perto dele (eles vão atrás do urso). */
export function processarPets(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): void {
  const u = ctx.balance.ajustesClasses.aventureiro.pets.urso;
  if (estado.tick % ticksDe(u.provocarMs) !== 0) return;
  for (const urso of estado.entidades) {
    if (!vivo(urso) || !urso.invocacao || !cacaPelaMarca(urso) || petDoCompanheiro(urso) !== 'urso') continue;
    const dono = buscarEntidade(estado, urso.invocacao.donoId);
    // D-204: a cópia do urso provoca como ele (e não cansa: o fôlego é o da fera).
    if (!dono || (!ehCopiaDoPet(urso) && !feraDisponivel(dono, 'urso'))) continue;
    // D-173: o urso do Mestre de Feras provoca mais longe.
    const raio = u.provocarRaio + Math.floor(leituraDoCompanheiro(estado, ctx, urso, 'provocarRaio'));
    for (const o of estado.entidades) {
      if (o === urso || !vivo(o) || o.invocacao || chebyshev(o, urso) > raio || !podeFerir(dono, o, ctx.modo)) continue;
      aplicarEfeito(estado, ctx, o, construirEfeito('desafiado', { duracaoMs: u.provocarMs, pct: 0 }), { id: urso.id, x: urso.x, y: urso.y }, null, saida);
    }
  }
}

// --- Marco 40 (14/11/2026, D-166): a caça marcada. O básico do Aventureiro não fere: marca o alvo, e o companheiro
// ativo vai até ele (mais rápido enquanto caça) e ataca com o básico dele. A recarga do básico dobra
// (`ajustesClasses.aventureiro.marca`). As skills de contato do lobo e do urso saem num bote até o alvo.

/** Quem marca a caça com o básico: o Aventureiro (não as invocações dele). D-188: com a fera da vez descansada; sem fera, o básico fere. */
export const marcaComOBasico = (e: Entidade): boolean => classeDoAventureiro(e) === 'aventureiro' && !e.invocacao && feraAtivaDisponivel(e);

const companheiroVivo = (estado: EstadoJogo, dono: Entidade): Entidade | undefined =>
  estado.entidades.find((c) => vivo(c) && c.invocacao?.companheiro === true && c.invocacao.donoId === dono.id);

/** O básico do Aventureiro acertou: marca o alvo para o companheiro (e não fere). */
export function marcarACaca(estado: EstadoJogo, ctx: ContextoSimulacao, dono: Entidade, alvo: Entidade, saida: EventoSimulacao[]): boolean {
  if (!marcaComOBasico(dono)) return false;
  // Marcar o companheiro de outro marca o dono dele (o falcão no ar nem leva mordida; a caça é quem o comanda). A marca
  // fica no dono; D-204: a troca de fera a solta (o que chega não segue caçando).
  const presa = alvo.invocacao?.companheiro ? (buscarEntidade(estado, alvo.invocacao.donoId) ?? alvo) : alvo;
  marcar(estado, ctx, dono, presa.id);
  saida.push({ t: 'cacaMarcada', tick: estado.tick, id: dono.id, alvoId: presa.id });
  return true;
}

/** D-170: marca (ou renova) a caça do dono por `marca.duracaoMs`. */
export function marcar(estado: EstadoJogo, ctx: ContextoSimulacao, dono: Entidade, id: string): void {
  dono.cacaMarcada = id;
  dono.cacaAteTick = estado.tick + ticksDe(ctx.balance.ajustesClasses.aventureiro.marca.duracaoMs);
}

/**
 * O alvo marcado do companheiro, se ainda vivo (o morto apaga a marca). D-170: a marca também acaba com o dono morto e
 * 5 s depois do último golpe que a renovou.
 */
export function cacaDoPet(estado: EstadoJogo, pet: Entidade): Entidade | null {
  if (!pet.invocacao || !cacaPelaMarca(pet)) return null;
  const dono = buscarEntidade(estado, pet.invocacao.donoId);
  const id = dono?.cacaMarcada;
  if (!dono || !id) return null;
  const alvo = buscarEntidade(estado, id);
  if (alvo && vivo(alvo) && vivo(dono) && (dono.cacaAteTick ?? Infinity) > estado.tick) return alvo;
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
  if (!pet || tipo === 'falcao' || !feraDisponivel(dono, tipo)) return null;
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
  if (alvoId) marcar(estado, ctx, dono, alvoId);
  if (celulas > 0) saida.push({ t: 'deslocado', tick: estado.tick, id: pet.id, deX: de.x, deY: de.y, paraX: melhor.x, paraY: melhor.y, origemId: pet.id, causa: 'avanco', ms });
  return ticksDe(ms);
}

/** Grito de fera (Rosnar, Rugido): o controle dura `baseMs`, mais `porNivelMs` por nível que o alvo tem a menos. */
export function duracaoDoGrito(ctx: ContextoSimulacao, quem: Entidade | undefined, alvo: Entidade): number {
  const g = ctx.balance.ajustesClasses.aventureiro.gritoDeFera;
  const diferenca = Math.max(0, (quem?.nivel ?? alvo.nivel) - alvo.nivel);
  return Math.min(g.maxMs, g.baseMs + diferenca * g.porNivelMs);
}
