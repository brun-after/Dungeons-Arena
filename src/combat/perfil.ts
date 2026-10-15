// Como cada habilidade funciona para quem a usa (D-057, D-059). Marco 14 (14/10/2026). Puro.
// - A chave do ator: o rank e os caminhos de `bolsa.conhecidas`, mais os modificadores do equipamento que
//   combinam com as etiquetas da habilidade. Quem não tem bolsa (inimigos, arena) usa o id puro: rank 1.
// - O perfil: as afinidades da classe e as passivas conhecidas, por etiqueta, viram bônus de dano, cura,
//   alcance, custo e recarga. São números de tempo de execução (não entram na chave).

import type { ContextoSimulacao } from '../core/contexto';
import type { Bolsa, Entidade } from '../entities/entidade';
import { formatarChave } from './chave-habilidade';
import { definicaoDe, resolverHabilidade } from './compilar-habilidade';
import type { Habilidade, Modificador, Passiva } from './habilidades';

export type ContextoPerfil = Pick<ContextoSimulacao, 'conteudo' | 'balance'>;

export interface PerfilHabilidade {
  danoPct: number;
  curaPct: number;
  alcance: number;
  custoPct: number;
  recargaPct: number;
}

export const PERFIL_NEUTRO: PerfilHabilidade = { danoPct: 0, curaPct: 0, alcance: 0, custoPct: 0, recargaPct: 0 };

/** A chave compilada da habilidade para este ator. */
export function chaveDoAtor(ctx: ContextoPerfil, ator: Entidade, id: string): string {
  const bolsa = ator.bolsa;
  if (!bolsa) return id;
  const conhecida = bolsa.conhecidas.find((c) => c.id === id);
  const tags = definicaoDe(ctx, id)?.base.tags ?? [];
  const mods: Modificador[] = [];
  for (const entrada of Object.values(bolsa.equipamento)) {
    const item = entrada ? ctx.conteudo.itens.get(entrada.itemId) : undefined;
    for (const m of item?.modificadores ?? []) if (m.tag === null || tags.includes(m.tag)) mods.push(m.mod);
  }
  return formatarChave({ id, rank: conhecida?.rank ?? 1, caminhos: conhecida?.caminhos ?? [], mods });
}

/** A habilidade compilada que este ator usa. */
export function habilidadeDoAtor(ctx: ContextoPerfil, ator: Entidade, id: string): Habilidade | undefined {
  return resolverHabilidade(ctx, chaveDoAtor(ctx, ator, id));
}

/** As passivas que o personagem conhece, escaladas pelo rank. */
export function passivasDaBolsa(ctx: ContextoPerfil, bolsa: Bolsa): Passiva[] {
  const saida: Passiva[] = [];
  for (const c of bolsa.conhecidas) {
    const p = definicaoDe(ctx, c.id)?.base.passiva;
    if (p) saida.push(escalarPassiva(p, c.rank, ctx));
  }
  return saida;
}

/** O rank escala a passiva pelo mesmo `efeitoPct` dos efeitos. */
function escalarPassiva(p: Passiva, rank: number, ctx: ContextoPerfil): Passiva {
  const r = ctx.balance.habilidades.ranks[rank - 1] ?? ctx.balance.habilidades.ranks.at(-1);
  const k = 1 + (r?.efeitoPct ?? 0) / 100;
  return {
    tag: p.tag,
    danoPct: p.danoPct * k,
    curaPct: p.curaPct * k,
    alcance: p.alcance,
    custoPct: p.custoPct * k,
    recargaPct: p.recargaPct * k,
    hpMaxPct: p.hpMaxPct * k,
    manaMaxPct: p.manaMaxPct * k,
    defesa: Math.round(p.defesa * k),
  };
}

/** Afinidades da classe e passivas conhecidas que valem para esta habilidade (pela etiqueta). */
export function perfilPara(ctx: ContextoPerfil, ator: Entidade, hab: Habilidade): PerfilHabilidade {
  const bolsa = ator.bolsa;
  if (!bolsa) return PERFIL_NEUTRO;
  const fontes = [...(ctx.conteudo.classes.get(bolsa.classeId)?.afinidades ?? []), ...passivasDaBolsa(ctx, bolsa)];
  const p = { ...PERFIL_NEUTRO };
  for (const f of fontes) {
    if (f.tag !== null && !hab.tags.includes(f.tag)) continue;
    p.danoPct += f.danoPct;
    p.curaPct += f.curaPct;
    p.alcance += f.alcance;
    p.custoPct += f.custoPct;
    p.recargaPct += f.recargaPct;
  }
  p.custoPct = Math.max(-90, p.custoPct);
  p.recargaPct = Math.max(-75, p.recargaPct);
  return p;
}
