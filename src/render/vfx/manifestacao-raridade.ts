// O nível de raridade da fusão no visual (marco 52, 21/11/2026, D-198). A magia é a mesma (a assinatura, a forma e a
// matéria do elemento não mudam); cada nível acima do comum acrescenta camadas de detalhe por cima dela, feitas à mão:
// - 2º nível: o brilho se lapida. Na mão, faíscas claras na cor da magia; no rastro, centelhas; no acerto, um halo
//   claro e uma chuva de centelhas; na área, um anel externo que passa da borda.
// - 1º nível: tudo do 2º e a filigrana dourada. Na mão, pontos de luz orbitam; no rastro, a esteira dobra e doura; no
//   acerto, o clarão de ouro, raios que se abrem em estrela, o glifo rúnico que gira no chão e um segundo halo; na
//   área, o círculo rúnico dourado sob o centro e colunas de luz que sobem das células.
// Com movimento reduzido, ficam só o halo e o anel (sem estrela, colunas nem órbitas). Só desenho.

import { circuloNoChao, clarao, clarear, ondaDeChoque, orbitar, sortear, tween } from './blocos';
import type { Acerto, AreaVfx, CenaVfx, P } from './cena';
import { cintilar } from './emissoes';

export type NivelVisual = 1 | 2;

const OURO = 0xffdf8a;

/** A cor da magia puxada para o ouro (o 1º nível) ou só clareada (o 2º). */
const tom = (cor: number, n: NivelVisual): number => (n === 1 ? misturar(cor, OURO, 0.55) : clarear(cor, 0.35));

function misturar(a: number, b: number, f: number): number {
  const c = (s: number) => Math.round(((a >> s) & 255) * (1 - f) + ((b >> s) & 255) * f);
  return (c(16) << 16) | (c(8) << 8) | c(0);
}

/** Na mão de quem conjura (a cada pulso da conjuração). */
export function raridadeNaConjuracao(c: CenaVfx, n: NivelVisual, pos: P, cor: number): void {
  const t = tom(cor, n);
  c.particulas.emitirLista([cintilar(n === 1 ? 4 : 2, { raio: 14, escala: [0.08, 0.35] })], pos.x, pos.y, t);
  if (n === 1 && !c.reduzido) orbitar(c, () => pos, 'cintilar', OURO, { n: 3, raio: 0.55, ms: 260, voltas: 0.5, tamanho: 0.35, aditivo: true });
}

/** No rastro do projétil. */
export function raridadeNoRastro(c: CenaVfx, n: NivelVisual, x: number, y: number, cor: number): void {
  c.particulas.emitirLista([cintilar(n === 1 ? 2 : 1, { raio: 6, vidaMs: [300, 520], velocidade: [4, 16] })], x, y, tom(cor, n));
}

/** No acerto (os três primeiros alvos). */
export function raridadeNoAcerto(c: CenaVfx, n: NivelVisual, a: Acerto): void {
  if (a.indice >= 3) return;
  const t = tom(a.cor, n);
  const e = Math.max(1, a.escala);
  ondaDeChoque(c, a.ate, t, 0.6 * e, 320, 'choque', false);
  c.particulas.emitirLista([cintilar(n === 1 ? 9 : 5, { raio: 18, velocidade: [20, 60], direcao: 'livre', gravidade: 10 })], a.ate.x, a.ate.y, t);
  if (n !== 1) return;
  clarao(c, a.ate, OURO, 1.5 * e, 220);
  ondaDeChoque(c, a.ate, OURO, 1 * e, 420);
  if (c.reduzido) return;
  circuloNoChao(c, () => a.ate, 'circulo_runico', OURO, 1.3 * e, 650, 1.4);
  // A estrela: seis raios curtos se abrem do ponto do acerto.
  for (let k = 0; k < 6; k++) {
    const ang = (k / 6) * Math.PI * 2 + Math.random() * 0.3;
    const fim = { x: a.ate.x + Math.cos(ang) * 0.9 * e, y: a.ate.y + Math.sin(ang) * 0.9 * e };
    tween(c, { textura: 'feixe', de: a.ate, para: fim, s: [0.18, 0.05], a: [0.9, 0], cor: OURO, aditivo: true, ms: 240, atrasoMs: 40 });
  }
}

/** No estouro da área. */
export function raridadeNaArea(c: CenaVfx, n: NivelVisual, a: AreaVfx): void {
  const t = tom(a.cor, n);
  const raio = Math.max(1, a.raio);
  ondaDeChoque(c, a.centro, t, raio + 0.5, 460);
  for (const q of sortear(a.celulas, n === 1 ? 6 : 3)) c.particulas.emitirLista([cintilar(n === 1 ? 3 : 2, { raio: 10 })], q.x, q.y, t);
  if (n !== 1) return;
  circuloNoChao(c, () => a.centro, 'circulo_runico', OURO, 1.2 + raio * 0.9, 820, 0.8);
  if (c.reduzido) return;
  // As colunas de luz: sobem de algumas células e se apagam no alto.
  sortear(a.celulas, 4).forEach((q, k) => {
    tween(c, { textura: 'feixe', de: q, s: [0.25, 0.1], sy: [0.2, 1.6], rot: [Math.PI / 2, Math.PI / 2], a: [0.85, 0], cor: OURO, aditivo: true, ms: 520, atrasoMs: 60 * k, subir: -26 });
  });
}
