// Marco 28 (30/10/2026, D-127): com o que a habilidade escala, para o cartão mostrar. A fonte é a mesma do combate
// (`fonteDe`/`fonteDaHabilidade` em combat/acao.ts). Marco 39 (12/11/2026, D-148): quem tem ficha escala pelo poder base
// (a rolagem cresce com o nível), pelos estilos (dano e, nas de área, dano em área), pelo atributo de classe (skills
// de classe e ultimates) e pelo % de dano dos itens. O cartão só lê as partes; nenhum texto é escrito à mão por skill.
// Puro.

import type { Habilidade } from '../combat/habilidades';
import { multiplicadorDosEstilos, poderBase } from '../combat/poder-base';
import type { ContextoSimulacao } from '../core/contexto';
import type { Entidade } from '../entities/entidade';
import { ehSkillDeClasse, fatorDeSkillDeClasse } from './dominio';
import { efeitosDeEstiloDe } from './estilos';

type Ctx = Pick<ContextoSimulacao, 'balance' | 'conteudo'>;

export interface EscalaDaHabilidade {
  /** Se o atributo de classe fortalece a skill. */
  deClasse: boolean;
  /** O efeito atual na ficha de quem lança, em % extra. */
  rolagemPct: number;
  estilosPct: number;
  classePct: number;
  itensPct: number;
}

export function escalaDaHabilidade(ctx: Ctx, e: Entidade, hab: Pick<Habilidade, 'id' | 'politicaImpacto' | 'raioArea'>): EscalaDaHabilidade {
  const classe = fatorDeSkillDeClasse(ctx, e, hab.id);
  const pct = (f: number) => Math.round((f - 1) * 100);
  const poder = poderBase(e.nivel, ctx.balance, e.bolsa ? ctx.conteudo.classes.get(e.bolsa.classeId)?.poderPct : undefined);
  return {
    deClasse: ehSkillDeClasse(ctx, e, hab.id),
    rolagemPct: pct(poder.multRolagem),
    estilosPct: pct(multiplicadorDosEstilos(efeitosDeEstiloDe(ctx, e), hab)),
    classePct: pct(classe),
    itensPct: Math.round(e.danoItensPct ?? 0),
  };
}
