// D-173 (14/11/2026): os companheiros do Aventureiro leem os estilos do dono (Grimório das Skills, "Os companheiros e
// os estilos"). Cada estilo dá a cada companheiro um jeito próprio, em `ajustesClasses.aventureiro.estilosDosPets`
// (por estilo, companheiro e campo, o valor na faixa 10), crescendo com a faixa da forma do estilo (formasDosEstilos):
// - Mestre de Feras: o falcão ataca mais vezes; as feras do Chamado duram mais com o lobo; o urso provoca mais longe.
// - Batedor: os três andam mais rápido (o falcão voa mais longe na mesma volta; o lobo e o urso, menos lentos).
// - Implacável: o golpe do companheiro volta (mais dano); a pata do urso empurra.
// - Sobrevivente: o mergulho do falcão cura o dono; o lobo toma golpes mais vezes; menos dano chega ao dono.
// - Xamã: o golpe do companheiro leva o estado da runa do dono (o mergulho do falcão, em área).
// Puro.

import type { ContextoSimulacao } from '../core/contexto';
import { buscarEntidade, type EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { vivo, type Entidade } from '../entities/entidade';
import { podeFerir } from '../modos/relacao';
import { formasDosEstilos } from '../progression/estilos';
import { aplicarEfeito } from './efeitos';
import { runaPadrao } from './encaixe-runa';
import { chebyshev } from './geometria';
import type { Habilidade } from './habilidades';
import { petDe, petDoCompanheiro, type Pet } from './pets';
import { construirEfeito } from './registro-efeitos';

export const CAMPOS_DO_PET = [
  'ataquePct', 'passoPct', 'provocarRaio', 'invocacaoPct', 'repetirPct', 'empurrao', 'curaNoGolpePct',
  'reflexoMenosPct', 'interceptarMenosPct', 'runaNoGolpe', 'runaRaio',
  // D-188 (19/11/2026): o fôlego e as ações do X pelos estilos (combat/feras.ts, combat/movimento-feras.ts).
  'golpeMenosPct', 'skillMenosPct', 'descansoMenosPct', 'drenoMenosPct', 'cansacoMenosPct', 'arremessoPct', 'disparadaMenosPct',
  'quedaAtordoaMs', 'quedaRuna', 'disparadaEmpurra', 'disparadaRuna', 'contencaoEmpurra', 'contencaoMaisMs', 'bloqueioMaisPct', 'contencaoRuna',
] as const;
export type CampoDoPet = (typeof CAMPOS_DO_PET)[number];

const FAIXAS = 10;

/** O quanto os estilos do dono dão ao companheiro neste campo (a soma de cada estilo, na faixa dele). */
export function leituraDoPet(ctx: ContextoSimulacao, dono: Entidade, pet: Pet, campo: CampoDoPet): number {
  const tabela = ctx.balance.ajustesClasses.aventureiro.estilosDosPets;
  if (!tabela || !dono.bolsa) return 0;
  let soma = 0;
  for (const f of formasDosEstilos(ctx, dono)) soma += ((tabela[f.estilo.id]?.[pet]?.[campo] ?? 0) * f.faixa) / FAIXAS;
  return soma;
}

/** A leitura do companheiro que é esta entidade (0 para quem não é companheiro). */
export function leituraDoCompanheiro(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, campo: CampoDoPet): number {
  if (!e.invocacao?.companheiro) return 0;
  const dono = buscarEntidade(estado, e.invocacao.donoId);
  return dono ? leituraDoPet(ctx, dono, petDoCompanheiro(e), campo) : 0;
}

/** A leitura do companheiro ativo do dono (as feras do Chamado, o lobo que intercepta). */
export const leituraDoAtivo = (ctx: ContextoSimulacao, dono: Entidade, campo: CampoDoPet): number => leituraDoPet(ctx, dono, petDe(dono), campo);

/** O fator do intervalo entre os ataques do companheiro (1 para os outros). */
export const ritmoDoCompanheiro = (estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade): number => 1 + leituraDoCompanheiro(estado, ctx, e, 'ataquePct') / 100;

/** O fator do passo do companheiro (Batedor). */
export const passoDoCompanheiro = (estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade): number => 1 + leituraDoCompanheiro(estado, ctx, e, 'passoPct') / 100;

/** O fator do golpe do companheiro (Implacável: o golpe volta). */
export const golpeDoCompanheiro = (estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade): number => 1 + leituraDoCompanheiro(estado, ctx, e, 'repetirPct') / 100;

/**
 * Depois do golpe do companheiro: a cura do dono (Sobrevivente), o empurrão da pata (Implacável) e o estado da runa
 * do dono no alvo (Xamã; no raio, nos hostis em volta).
 */
export function aposGolpeDoCompanheiro(estado: EstadoJogo, ctx: ContextoSimulacao, pet: Entidade, alvo: Entidade, hab: Habilidade, saida: EventoSimulacao[]): void {
  if (!pet.invocacao?.companheiro || hab.formulaDano === null) return;
  const dono = buscarEntidade(estado, pet.invocacao.donoId);
  if (!dono?.bolsa || !vivo(dono)) return;
  const tipo = petDoCompanheiro(pet);
  const ler = (c: CampoDoPet) => leituraDoPet(ctx, dono, tipo, c);
  const origem = { id: pet.id, x: pet.x, y: pet.y };
  const cura = Math.round((dono.hpMax * ler('curaNoGolpePct')) / 100);
  if (cura > 0) aplicarEfeito(estado, ctx, dono, construirEfeito('cura', { valor: cura, duracaoMs: 0 }), origem, null, saida);
  const empurrao = Math.floor(ler('empurrao'));
  if (empurrao > 0 && vivo(alvo)) aplicarEfeito(estado, ctx, alvo, construirEfeito('empurrao', { valor: empurrao }), origem, null, saida);
  const runa = ler('runaNoGolpe');
  if (runa <= 0) return;
  const elemento = runaPadrao(ctx, dono.bolsa);
  const base = elemento === 'fisico' ? construirEfeito('atolado', { pct: 30, duracaoMs: 1500 }) : ctx.conteudo.elementos.get(elemento)?.estado;
  if (!base) return;
  // O estado dura mais quanto mais forte a leitura (até a duração inteira do elemento).
  const estadoDaRuna = { ...base, duracaoMs: Math.round(base.duracaoMs * Math.min(1, runa)) };
  const raio = Math.floor(ler('runaRaio'));
  const alvos = raio > 0 ? estado.entidades.filter((o) => vivo(o) && !o.invocacao?.companheiro && chebyshev(o, alvo) <= raio && podeFerir(dono, o, ctx.modo)) : [alvo];
  for (const o of alvos) if (vivo(o)) aplicarEfeito(estado, ctx, o, estadoDaRuna, origem, null, saida);
}
