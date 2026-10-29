// Formas de área e alvos de suporte (D-057, D-059). Marco 14 (14/10/2026). Pura.
// - quadrado: em volta da célula mirada (o de antes);
// - linha: Bresenham de quem conjura em direção à mira, até o alcance, parando na primeira parede;
// - cone: 90° em direção à mira, com comprimento = raio (teste inteiro, sem trigonometria);
// - ao redor: em volta de quem conjura, sem ele.
// Quem é atingido sai da relação do modo: `podeFerir` para ofensivas, `podeAjudar` para as de suporte. A
// telegrafia (render) usa as mesmas células.

import type { Celula } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import { vivo, type Entidade } from '../entities/entidade';
import { podeAjudar, podeFerir } from '../modos/relacao';
import { passavel, type Fase } from '../world/fase';
import { celulaOcupada, chebyshev } from './geometria';
import type { Habilidade } from './habilidades';
import { REGISTRO_EFEITOS } from './registro-efeitos';

/** Células de Bresenham de `a` (exclusive) a `b` (inclusive). */
export function bresenham(a: Celula, b: Celula): Celula[] {
  const saida: Celula[] = [];
  let { x, y } = a;
  const dx = Math.abs(b.x - a.x);
  const dy = -Math.abs(b.y - a.y);
  const sx = a.x < b.x ? 1 : -1;
  const sy = a.y < b.y ? 1 : -1;
  let erro = dx + dy;
  while (x !== b.x || y !== b.y) {
    const e2 = 2 * erro;
    if (e2 >= dy) {
      erro += dy;
      x += sx;
    }
    if (e2 <= dx) {
      erro += dx;
      y += sy;
    }
    saida.push({ x, y });
  }
  return saida;
}

/**
 * A linha sai de quem conjura, passa pela mira e vai até o alcance; para antes da primeira parede. Marco 26
 * (29/10/2026, D-125): com `barreira`, só ela encerra a linha (a investida passa pelas paredes, como o dash).
 */
export function celulasDaLinha(origem: Celula, mira: Celula, alcance: number, fase: Fase, barreira?: (c: Celula) => boolean): Celula[] {
  const dx = mira.x - origem.x;
  const dy = mira.y - origem.y;
  const passos = Math.max(Math.abs(dx), Math.abs(dy));
  if (passos === 0 || alcance <= 0) return [];
  // Estende a direção até o alcance (o ponto final é a mira escalada, arredondada).
  const fim = { x: origem.x + Math.round((dx * alcance) / passos), y: origem.y + Math.round((dy * alcance) / passos) };
  const saida: Celula[] = [];
  for (const c of bresenham(origem, fim)) {
    if (barreira ? barreira(c) : !passavel(fase, c.x, c.y)) break;
    saida.push(c);
  }
  return saida;
}

/** Cone de 90° para a mira: dentro do raio (Chebyshev) e a menos de 45° do eixo (`2·(v·d)² ≥ |v|²·|d|²`). */
export function celulasDoCone(origem: Celula, mira: Celula, raio: number): Celula[] {
  const d = { x: mira.x - origem.x, y: mira.y - origem.y };
  const d2 = d.x * d.x + d.y * d.y;
  if (d2 === 0 || raio <= 0) return [];
  const saida: Celula[] = [];
  for (let y = -raio; y <= raio; y++) {
    for (let x = -raio; x <= raio; x++) {
      if (x === 0 && y === 0) continue;
      const dot = x * d.x + y * d.y;
      if (dot <= 0 || 2 * dot * dot < (x * x + y * y) * d2) continue;
      saida.push({ x: origem.x + x, y: origem.y + y });
    }
  }
  return saida;
}

export function celulasDoQuadrado(centro: Celula, raio: number): Celula[] {
  const saida: Celula[] = [];
  for (let y = -raio; y <= raio; y++) {
    for (let x = -raio; x <= raio; x++) saida.push({ x: centro.x + x, y: centro.y + y });
  }
  return saida;
}

/** As células que a habilidade de área atinge, dadas a origem (quem conjura) e a mira. */
/** Marco 26 (29/10/2026, D-125): a habilidade desloca quem a lança (avanço, teleporte em `em: conjurador`)? */
export function deslocaQuemConjura(hab: Habilidade): boolean {
  return hab.efeitos.some((ef) => ef.em === 'conjurador' && REGISTRO_EFEITOS[ef.tipo].deslocaConjurador);
}

export function celulasDaForma(hab: Habilidade, origem: Celula, mira: Celula, fase: Fase, barreira?: (c: Celula) => boolean): Celula[] {
  switch (hab.tipoArea) {
    case 'quadrado':
      return celulasDoQuadrado(mira, hab.raioArea);
    case 'linha':
      return celulasDaLinha(origem, mira, hab.alcanceCelulas, fase, barreira);
    case 'cone':
      return celulasDoCone(origem, mira, hab.raioArea);
    case 'ao_redor':
      // Marco 24 (24/10/2026): a célula de quem conjura entra. Jogadores não se bloqueiam, e quem estava na mesma
      // célula (dois avanços cruzados) escapava do Redemoinho; o próprio conjurador sai pelo `afetavel`.
      return celulasDoQuadrado(origem, hab.raioArea);
    case 'nenhuma':
      return [];
  }
}

/** A habilidade ajuda (aliado, aliados) em vez de ferir? */
export function deSuporte(hab: Habilidade): boolean {
  return hab.politicaAlvo === 'aliado' || hab.politicaAlvo === 'aliados';
}

/** Quem a habilidade pode afetar, pela relação do modo (nunca pelo tipo da entidade, §2.5). */
export function afetavel(ctx: ContextoSimulacao, ator: Entidade, alvo: Entidade, hab: Habilidade): boolean {
  if (!vivo(alvo)) return false;
  return deSuporte(hab) ? podeAjudar(ator, alvo, ctx.modo) : podeFerir(ator, alvo, ctx.modo);
}

/** Quem está nas células: os afetáveis, na linha pela distância e depois por id; nos demais, por id. */
export function alvosDaForma(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade, hab: Habilidade, celulas: readonly Celula[]): Entidade[] {
  const chaves = new Set(celulas.map((c) => `${c.x},${c.y}`));
  const origem = celulaOcupada(ator);
  const naArea = estado.entidades.filter((e) => {
    const c = celulaOcupada(e);
    return chaves.has(`${c.x},${c.y}`) && afetavel(ctx, ator, e, hab);
  });
  // Marco 22 (D-089): o golpe no falcão cai no dono; com os dois na área, o dono é atingido uma vez só.
  const dentro = naArea.filter((e) => !e.invocacao?.companheiro || !naArea.some((d) => d.id === e.invocacao?.donoId));
  const porId = (a: Entidade, b: Entidade) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  if (hab.tipoArea === 'linha') return dentro.sort((a, b) => chebyshev(origem, celulaOcupada(a)) - chebyshev(origem, celulaOcupada(b)) || porId(a, b));
  return dentro.sort(porId);
}
