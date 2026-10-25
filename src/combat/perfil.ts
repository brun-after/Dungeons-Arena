// Como cada habilidade funciona para quem a usa (D-057, D-059). Marco 14 (14/10/2026). Puro.
// - A chave do ator: o rank e os caminhos de `bolsa.conhecidas`, mais os modificadores do equipamento que
//   combinam com as etiquetas da habilidade. Quem não tem bolsa (inimigos, arena) usa o id puro: rank 1.
// - O perfil: as afinidades da classe e as passivas conhecidas, por etiqueta, viram bônus de dano, cura,
//   alcance, custo e recarga. São números de tempo de execução (não entram na chave).

import type { ContextoSimulacao } from '../core/contexto';
import type { Bolsa, Entidade } from '../entities/entidade';
import { formatarChave } from './chave-habilidade';
import { definicaoDe, resolverHabilidade } from './compilar-habilidade';
import type { DefinicaoHabilidade, Habilidade, Modificador, Passiva, Variante } from './habilidades';
import { furiaAtual } from './furia';
import { modificadoresDosConjuntos } from '../progression/ganchos-do-portador';
import { sintoniaDe } from '../progression/sintonia';

export type ContextoPerfil = Pick<ContextoSimulacao, 'conteudo' | 'balance'>;

export interface PerfilHabilidade {
  danoPct: number;
  curaPct: number;
  alcance: number;
  custoPct: number;
  recargaPct: number;
}

export const PERFIL_NEUTRO: PerfilHabilidade = { danoPct: 0, curaPct: 0, alcance: 0, custoPct: 0, recargaPct: 0 };

/**
 * Marco 24 (24/10/2026, D-094): as variantes que o estado do ator liga nesta habilidade — o Frenesi, a fúria acima da
 * metade, o elemento encarnado e, nas ultimates, as marcas de Domínio da barra. Sem `tick`, vale o que está guardado (os efeitos vencidos saem no fim de cada tick).
 */
export function variantesDoAtor(ctx: ContextoPerfil, ator: Entidade, def: DefinicaoHabilidade | null, tick?: number): Variante[] {
  if (!def || Object.keys(def.variantes).length === 0) return [];
  const saida: Variante[] = [];
  const vale = (ate: number) => tick === undefined || ate > tick;
  if (def.variantes.frenesi && ator.efeitos.some((f) => f.tipo === 'frenesi' && vale(f.ateTick))) saida.push('frenesi');
  if (def.variantes.furia_alta && ator.furia) {
    const agora = tick ?? ator.furia.ultimoTick;
    if (furiaAtual(ctx, ator, agora) * 2 >= ctx.balance.ajustesClasses.guerreiro.furia.max) saida.push('furia_alta');
  }
  if (ator.encarnacao && vale(ator.encarnacaoAteTick ?? 0)) {
    const v = `enc_${ator.encarnacao}` as Variante;
    if (def.variantes[v]) saida.push(v);
  }
  // Marco 24 (D-095): o Domínio (2 gerais da mesma família nas teclas 3–6) marca qualquer ultimate.
  if (def.base.tags.includes('ultimate')) {
    for (const f of sintoniaDe(ctx, ator).dominios) {
      const v = `dom_${f}` as Variante;
      if (def.variantes[v]) saida.push(v);
    }
  }
  return saida;
}

/** A chave compilada da habilidade para este ator. */
export function chaveDoAtor(ctx: ContextoPerfil, ator: Entidade, id: string, tick?: number): string {
  const bolsa = ator.bolsa;
  if (!bolsa) return formatarChave({ id, rank: 1, caminhos: [], mods: [], variantes: variantesDoAtor(ctx, ator, definicaoDe(ctx, id), tick) });
  const conhecida = bolsa.conhecidas.find((c) => c.id === id);
  const tags = definicaoDe(ctx, id)?.base.tags ?? [];
  const mods: Modificador[] = [];
  for (const entrada of Object.values(bolsa.equipamento)) {
    const item = entrada ? ctx.conteudo.itens.get(entrada.itemId) : undefined;
    for (const m of item?.modificadores ?? []) if (m.tag === null || tags.includes(m.tag)) mods.push(m.mod);
  }
  // Marco 18 (D-069): os conjuntos completos também dão modificadores (a Vigília do caçador faz as flechas ecoarem).
  for (const m of modificadoresDosConjuntos(ctx, bolsa)) if ((m.tag === null || tags.includes(m.tag)) && !mods.includes(m.mod)) mods.push(m.mod);
  return formatarChave({ id, rank: conhecida?.rank ?? 1, caminhos: conhecida?.caminhos ?? [], mods, variantes: variantesDoAtor(ctx, ator, definicaoDe(ctx, id), tick) });
}

/** A habilidade compilada que este ator usa (com `tick`, as variantes conferem o prazo dos estados). */
export function habilidadeDoAtor(ctx: ContextoPerfil, ator: Entidade, id: string, tick?: number): Habilidade | undefined {
  return resolverHabilidade(ctx, chaveDoAtor(ctx, ator, id, tick));
}

/** As passivas que o personagem conhece, escaladas pelo rank. Marco 24 (D-095): as gerais, só as ligadas. */
export function passivasDaBolsa(ctx: ContextoPerfil, bolsa: Bolsa): Passiva[] {
  const saida: Passiva[] = [];
  for (const c of bolsa.conhecidas) {
    const def = definicaoDe(ctx, c.id);
    const p = def?.base.passiva;
    if (def?.familiaGeral && !bolsa.passivasAtivas?.includes(c.id)) continue;
    if (p) saida.push(escalarPassiva(p, c.rank, ctx));
  }
  return saida;
}

/** O rank escala a passiva pelo mesmo `efeitoPct` dos efeitos. */
function escalarPassiva(p: Passiva, rank: number, ctx: ContextoPerfil): Passiva {
  const r = ctx.balance.habilidades.ranks[rank - 1] ?? ctx.balance.habilidades.ranks.at(-1);
  const k = 1 + (r?.efeitoPct ?? 0) / 100;
  return {
    ...p,
    tenacidadePct: (p.tenacidadePct ?? 0) * k,
    fluxoEscudoPct: (p.fluxoEscudoPct ?? 0) * k,
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
  const regras = ctx.balance.ajustesClasses;
  const nivel = Math.min(ctx.balance.xp.nivelMax, Math.max(1, ator.nivel));
  const afinidades = (ctx.conteudo.classes.get(bolsa.classeId)?.afinidades ?? []).map((f) => {
    if (bolsa.classeId === 'guerreiro' && f.tag === 'contato') return { ...f, danoPct: regras.guerreiro.contatoMaxPct * Math.min(1, (nivel - 1) / (regras.guerreiro.contatoNivel - 1)) ** regras.guerreiro.contatoExpoente };
    if (bolsa.classeId === 'mago' && f.tag === 'magico') {
      const m = regras.mago;
      const danoPct = nivel < m.nivelIntermediario ? m.inicialPct + (m.intermediarioPct - m.inicialPct) * (nivel - 1) / (m.nivelIntermediario - 1)
        : nivel <= m.fimIntermediario ? m.intermediarioPct : m.intermediarioPct + (m.inicialPct - m.intermediarioPct) * Math.min(1, (nivel - m.fimIntermediario) / (m.nivelFinal - m.fimIntermediario));
      return { ...f, danoPct };
    }
    return f;
  });
  const fontes = [...afinidades, ...passivasDaBolsa(ctx, bolsa)];
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
