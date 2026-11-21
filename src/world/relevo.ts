// O relevo (marco 42, 15/11/2026, D-176). Cada célula do exterior do Mundo tem uma altura inteira (`Fase.alturas`); a
// regra é pelo desnível entre a célula de onde se sai e a de destino, com os limiares em `balance.relevo`:
// - encosta (desnível até `encostaMax`): anda, mais devagar na subida (`subidaPctPorNivel` por nível);
// - muro baixo (até `muroBaixoMax`): o salto passa; o tiro passa;
// - muro alto (até `muroAltoMax`): o voo passa; o tiro que sobe para;
// - montanha (acima): ninguém passa, nem voando.
// Descer pelo salto ou pelo voo vale qualquer altura. 20/11/2026 (D-191): a pé, o muro se escala e a queda se desce
// num pulo curto (world/escalada.ts); o modo `andar` daqui é o passo sem escalar.
// Sem `alturas` (as masmorras, a arena, a campanha), tudo é plano e nada muda. Puro.

import { BALANCE_PADRAO } from '../core/contexto';
import type { Fase } from './fase';
import { travessiaAPe, type RegrasEscalada } from './escalada';

export interface RegrasRelevo {
  encostaMax: number;
  muroBaixoMax: number;
  muroAltoMax: number;
  /** Quanto a subida tira da velocidade, por nível de desnível (%). */
  subidaPctPorNivel: number;
  /** A montaria sobe com esta fração da penalidade. */
  montariaFator: number;
  /** 20/11/2026 (D-191): a escalada e o pulo curto de quem anda. */
  escalada: RegrasEscalada;
}

/** O modo de quem atravessa: a pé, saltando ou voando. */
export type ModoDeTravessia = 'andar' | 'saltar' | 'voar';

/** A altura da célula (0 fora do mapa e sem relevo). */
export function alturaEm(fase: Pick<Fase, 'alturas' | 'largura' | 'altura'>, x: number, y: number): number {
  const a = fase.alturas;
  if (!a) return 0;
  const i = Math.round(x);
  const j = Math.round(y);
  if (i < 0 || j < 0 || i >= fase.largura || j >= fase.altura) return 0;
  return a[j * fase.largura + i] ?? 0;
}

/** O desnível de `de` para `para` (positivo = sobe). */
export function desnivel(fase: Pick<Fase, 'alturas' | 'largura' | 'altura'>, de: { x: number; y: number }, para: { x: number; y: number }): number {
  return alturaEm(fase, para.x, para.y) - alturaEm(fase, de.x, de.y);
}

/** Passa de uma altura para a outra no modo? */
export function passaDesnivel(r: RegrasRelevo, d: number, modo: ModoDeTravessia): boolean {
  if (modo === 'andar') return Math.abs(d) <= r.encostaMax;
  // Descer saltando ou voando: qualquer altura.
  if (d <= 0) return true;
  return modo === 'saltar' ? d <= r.muroBaixoMax : d <= r.muroAltoMax;
}

/** A célula (i, j) barra quem está na altura `h0` no modo (para os ganchos de `corpoCabe`). */
export function barraPorAltura(fase: Fase, r: RegrasRelevo, h0: number, modo: ModoDeTravessia): ((i: number, j: number) => boolean) | null {
  if (!fase.alturas) return null;
  return (i, j) => !passaDesnivel(r, alturaEm(fase, i, j) - h0, modo);
}

/** O fator de velocidade de quem anda de `de` para `para` (1 no plano e na descida). */
export function fatorDeSubida(fase: Fase, r: RegrasRelevo, de: { x: number; y: number }, para: { x: number; y: number }, montado = false): number {
  const d = desnivel(fase, de, para);
  if (d <= 0) return 1;
  const pct = r.subidaPctPorNivel * Math.min(d, r.encostaMax) * (montado ? r.montariaFator : 1);
  return Math.max(0.2, 1 - pct / 100);
}

/** O tiro passa da célula `de` para a vizinha `para`: só a parede que sobe além do muro baixo o para. */
export function tiroPassaRelevo(fase: Fase, r: RegrasRelevo, de: { x: number; y: number }, para: { x: number; y: number }): boolean {
  return desnivel(fase, de, para) <= r.muroBaixoMax;
}

/**
 * A pé, de uma célula para a vizinha (a navegação; os limiares do balance padrão, iguais no cliente e no servidor).
 * 20/11/2026 (D-191): escalando o muro e descendo a queda num pulo curto também se passa.
 */
export function andavelEntre(fase: Fase, ax: number, ay: number, bx: number, by: number): boolean {
  if (!fase.alturas) return true;
  return travessiaAPe(BALANCE_PADRAO.relevo, alturaEm(fase, bx, by) - alturaEm(fase, ax, ay)) !== null;
}

/** Quantos níveis sobe de uma célula para a vizinha (0 no plano e na descida). */
export function subidaEntre(fase: Fase, ax: number, ay: number, bx: number, by: number): number {
  if (!fase.alturas) return 0;
  return Math.max(0, alturaEm(fase, bx, by) - alturaEm(fase, ax, ay));
}

/** O tiro passa de uma célula para a vizinha (os limiares do balance padrão: as formas e a linha de tiro). */
export function tiroPassaEntre(fase: Fase, de: { x: number; y: number }, para: { x: number; y: number }): boolean {
  return !fase.alturas || desnivel(fase, de, para) <= BALANCE_PADRAO.relevo.muroBaixoMax;
}
