// 18/10/2026: diferença de nível e desgaste permanente, independente por fase.
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { Bolsa, Entidade } from '../entities/entidade';
import { ehObjeto } from '../core/validar';
import { xpParaProximo } from './nivel';

/** Confere fichas cooperativas e migra o rascunho anterior sem apagar os valores registrados. */
export function lerHistoricoXp(v: unknown): NonNullable<Bolsa['xpPorFase']> {
  if (!ehObjeto(v)) return {};
  return Object.fromEntries(Object.entries(v).flatMap(([id, r]) => {
    if (!id || id.length > 200 || !ehObjeto(r)) return [];
    const acumulado = r.xpBaseAcumulado ?? r.xp;
    if (typeof acumulado !== 'number' || !Number.isFinite(acumulado) || acumulado < 0) return [];
    const h = r.meiaVidaXp;
    return [[id, { xpBaseAcumulado: acumulado, ...(typeof h === 'number' && Number.isFinite(h) && h > 0 ? { meiaVidaXp: h } : {}) }]];
  }));
}

/** Retornos do grupo/arena não podem substituir contadores por um retrato mais antigo. */
export function unirHistoricosXp(atual: unknown, recebido: unknown): NonNullable<Bolsa['xpPorFase']> {
  const a = lerHistoricoXp(atual), b = lerHistoricoXp(recebido);
  return Object.fromEntries([...new Set([...Object.keys(a), ...Object.keys(b)])].map(id => {
    const anterior = a[id], novo = b[id];
    const h = anterior?.meiaVidaXp ?? novo?.meiaVidaXp;
    return [id, { xpBaseAcumulado: Math.max(anterior?.xpBaseAcumulado ?? 0, novo?.xpBaseAcumulado ?? 0), ...(h !== undefined ? { meiaVidaXp: h } : {}) }];
  }));
}

/** Fases mistas usam o menor nível configurado; fases só com spawner usam o nível da criatura. */
export function nivelDaFase(ctx: ContextoSimulacao, morto: Entidade): number {
  return ctx.fase.inimigos.length ? Math.min(...ctx.fase.inimigos.map(e => e.nivel ?? 1)) : morto.nivel;
}

export function aplicaAntifarmDeFase(ctx: ContextoSimulacao, jogador: Entidade, morto: Entidade): boolean {
  return !!jogador.bolsa && ctx.modo.sobrevivencia.estudoAvanca && !morto.invocacao && morto.controlador === 'ia';
}

export function xpDeCriatura(estado: EstadoJogo, ctx: ContextoSimulacao, jogador: Entidade, morto: Entidade, bruto: number): number {
  if (!aplicaAntifarmDeFase(ctx, jogador, morto) || !jogador.bolsa || bruto <= 0) return bruto;
  const nivel = nivelDaFase(ctx, morto);
  const d = jogador.nivel - nivel;
  // Mesmo com desgaste anterior, inimigos do mesmo nível ou acima dão XP integral sem alterar A.
  if (d <= 0) return bruto;
  const historico = jogador.bolsa.xpPorFase ??= {};
  let registro = Object.hasOwn(historico, estado.faseId) ? historico[estado.faseId] : undefined;
  if (!registro) {
    registro = { xpBaseAcumulado: 0 };
    Object.defineProperty(historico, estado.faseId, { value: registro, enumerable: true, writable: true, configurable: true });
  }
  // H nunca depende do nível futuro do jogador e não muda com reajustes da tabela após ser fixado.
  const h = registro.meiaVidaXp ??= xpParaProximo(nivel, ctx.balance.xp);
  const r = ctx.balance.xp.criaturasInferiores;
  const fatorNivel = 0.5 ** (d / r.niveisPorMeiaVida);
  const fatorFadiga = 0.5 ** (registro.xpBaseAcumulado / h);
  const ganho = Math.max(r.xpMinimo, bruto * fatorNivel * fatorFadiga);
  // A soma usa a cota ANTES das duas reduções, inclusive quando já se atingiu o piso de 1 XP.
  registro.xpBaseAcumulado = Math.min(Number.MAX_VALUE, registro.xpBaseAcumulado + bruto);
  return ganho;
}
