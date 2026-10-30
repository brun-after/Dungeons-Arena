// Marco 28 (30/10/2026, D-127): com o que a habilidade escala, para o cartão mostrar. A fonte é a mesma do combate
// (`fonteDe`/`fonteDaHabilidade` em combat/acao.ts): a rolagem (a média dos atributos da `escalaRolagem`, ou Força e o
// segundo atributo), o bônus fixo (`escalaCom`), o atributo de classe (skills de classe e ultimates) e o % de dano dos
// itens. O cartão só lê as partes; nenhum texto é escrito à mão por skill. Puro.

import type { Habilidade } from '../combat/habilidades';
import type { ContextoSimulacao } from '../core/contexto';
import type { Atributos, Entidade } from '../entities/entidade';
import { fatorDeSkillDeClasse } from './dominio';
import { atributosDeFormula, multiplicadorDeRolagem } from './efeitos-atributo';

type Ctx = Pick<ContextoSimulacao, 'balance' | 'conteudo'>;

export interface EscalaDaHabilidade {
  /** Os atributos da rolagem, com o peso de cada um (em %). */
  rolagem: { atributo: keyof Atributos; pesoPct: number }[];
  /** O atributo do bônus fixo de dano. */
  bonusCom: keyof Atributos;
  /** Se o atributo de classe fortalece a skill. */
  deClasse: boolean;
  /** O efeito atual na ficha de quem lança, em % extra. */
  rolagemPct: number;
  classePct: number;
  itensPct: number;
}

export function escalaDaHabilidade(ctx: Ctx, e: Entidade, hab: Pick<Habilidade, 'id' | 'escalaCom' | 'escalaRolagem'>): EscalaDaHabilidade {
  const lista: (keyof Atributos)[] = hab.escalaRolagem?.length ? [...hab.escalaRolagem] : ['forca', hab.escalaCom === 'destreza' ? 'destreza' : 'inteligencia'];
  const pesos = new Map<keyof Atributos, number>();
  for (const a of lista) pesos.set(a, (pesos.get(a) ?? 0) + 100 / lista.length);
  const classe = fatorDeSkillDeClasse(ctx, e, hab.id);
  const pct = (f: number) => Math.round((f - 1) * 100);
  return {
    rolagem: [...pesos].map(([atributo, pesoPct]) => ({ atributo, pesoPct: Math.round(pesoPct) })),
    bonusCom: hab.escalaCom,
    deClasse: classe > 1 || fatorDeSkillDeClasse(ctx, { ...e, atributos: { ...e.atributos, dominio: 100 } }, hab.id) > 1,
    rolagemPct: pct(multiplicadorDeRolagem(atributosDeFormula(e, ctx.balance), ctx.balance, hab.escalaCom, hab.escalaRolagem)),
    classePct: pct(classe),
    itensPct: Math.round(e.danoItensPct ?? 0),
  };
}
