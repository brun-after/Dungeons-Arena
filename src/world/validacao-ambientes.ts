// Validação da autoria/importação (17/10/2026).
import { ehObjeto } from '../core/validar';
import { TIPOS_AMBIENTE, type AreaAmbiente, type TipoAmbiente } from './ambiente-tipos';
import type { ErroFase } from './validacao-fase';
export function lerAmbientes(v: unknown, mapa: readonly string[], erros: ErroFase[]): AreaAmbiente[] {
  if (v === undefined) return [];
  if (!Array.isArray(v) || v.length > 24) { erros.push({ mensagem: 'ambientes: até 24 áreas' }); return []; }
  const resultado: AreaAmbiente[] = [];
  for (const a of v) {
    if (!ehObjeto(a) || !(TIPOS_AMBIENTE as readonly unknown[]).includes(a.tipo) ||
      typeof a.x !== 'number' || !Number.isInteger(a.x) || typeof a.y !== 'number' || !Number.isInteger(a.y) ||
      typeof a.raio !== 'number' || !Number.isInteger(a.raio) || a.raio < 1 || a.raio > 3 || !['.', 'S'].includes(mapa[a.y]?.[a.x] ?? '')) {
      erros.push({ mensagem: 'ambiente inválido: tipo, centro passável e raio 1–3' }); continue;
    }
    resultado.push({ tipo: a.tipo as TipoAmbiente, x: a.x, y: a.y, raio: a.raio });
  }
  return resultado;
}
