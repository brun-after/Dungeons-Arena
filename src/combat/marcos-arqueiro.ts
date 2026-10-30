// Os marcos do Instinto, o atributo de classe do Arqueiro (marco 28, 30/10/2026, D-127). Todos partem do tiro
// carregado (a Mira firme cheia):
// - 25, Caçada em cadeia: o tiro que abate salta para o hostil mais perto ainda não atingido, com parte do dano;
// - 50, Flecha-âncora: onde o tiro para, crava uma flecha que atira sozinha (uma invocação `torre`) por um tempo;
// - 75, Disparo explosivo: onde o tiro para, uma explosão em volta (com o elemento da flecha, se tiver);
// - 100, Tempestade de aço: o tiro vai o dobro mais longe e deixa uma chuva de flechas pela linha que percorreu.
// Os números ficam em `balance.dominio` (classes.arqueiro.marcos e efeitos). Puro.

import type { ContextoSimulacao } from '../core/contexto';
import { buscarEntidade, novoId, type EstadoJogo, type Projetil } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { posicionar, vivo, type Entidade } from '../entities/entidade';
import { podeFerir } from '../modos/relacao';
import { marcoDe } from '../progression/dominio';
import { passavel } from '../world/fase';
import { resolverHabilidade } from './compilar-habilidade';
import { invocar } from './efeitos-fluxo';
import { celulaOcupada, chebyshev } from './geometria';
import { aplicarImpacto } from './golpe';
import { fonteDoProjetil } from './projeteis-variacoes';
import { construirEfeito } from './registro-efeitos';

/** O alcance do tiro carregado com a Tempestade de aço (o dobro, cruzando a tela). */
export function alcanceDoTiroCarregado(ctx: ContextoSimulacao, ator: Entidade, alcance: number): number {
  return marcoDe(ctx, ator, 'tempestadePct') > 0 ? alcance * 2 : alcance;
}

/** Caçada em cadeia: o tiro carregado abateu `alvo` e salta para o próximo hostil, com `cadeiaPct`% do dano. */
export function cacadaEmCadeia(estado: EstadoJogo, ctx: ContextoSimulacao, p: Projetil, alvo: Entidade, saida: EventoSimulacao[]): void {
  const dono = buscarEntidade(estado, p.donoId);
  const pct = dono ? marcoDe(ctx, dono, 'cadeiaPct') : 0;
  if (!dono || pct <= 0 || vivo(alvo)) return;
  const origem = celulaOcupada(alvo);
  const proximo = estado.entidades
    .filter((e) => vivo(e) && e.id !== dono.id && !p.atingidos.includes(e.id) && e.invisivelAteTick <= estado.tick && podeFerir(dono, e, ctx.modo))
    .sort((a, b) => chebyshev(origem, celulaOcupada(a)) - chebyshev(origem, celulaOcupada(b)) || (a.id < b.id ? -1 : 1))[0];
  if (!proximo || chebyshev(origem, celulaOcupada(proximo)) > ctx.balance.dominio.efeitos.ancoraAlcance) return;
  const destino = celulaOcupada(proximo);
  const dx = destino.x - origem.x;
  const dy = destino.y - origem.y;
  const d = Math.max(1e-6, Math.hypot(dx, dy));
  const novo: Projetil = { ...p, id: novoId(estado), x: origem.x, y: origem.y, dirX: dx / d, dirY: dy / d, restante: d + 0.5, atingidos: [...p.atingidos], multDano: (p.multDano * pct) / 100 };
  delete novo.curados;
  estado.projeteis.push(novo);
  saida.push({ t: 'projetilLancado', tick: estado.tick, projetilId: novo.id, acaoId: p.acaoId, donoId: p.donoId, habilidadeId: p.habilidadeId, chave: p.chave });
}

/** Onde o tiro carregado parou: a Flecha-âncora, o Disparo explosivo e a Tempestade de aço. */
export function aoPararOTiroCarregado(estado: EstadoJogo, ctx: ContextoSimulacao, p: Projetil, saida: EventoSimulacao[]): void {
  const dono = buscarEntidade(estado, p.donoId);
  if (!dono || !vivo(dono)) return;
  const ef = ctx.balance.dominio.efeitos;
  const fim = { x: Math.round(p.x), y: Math.round(p.y) };
  const hab = resolverHabilidade(ctx, p.chave);
  const atingir = (celulas: readonly { x: number; y: number }[], pct: number, raio: number) => {
    if (!hab || pct <= 0) return;
    const fonte = fonteDoProjetil(estado, p, pct / 100);
    const feridos = new Set<string>();
    for (const c of celulas) {
      for (const e of estado.entidades) {
        if (feridos.has(e.id) || !vivo(e) || e.id === dono.id || !podeFerir(dono, e, ctx.modo) || chebyshev(c, celulaOcupada(e)) > raio) continue;
        feridos.add(e.id);
        aplicarImpacto(estado, ctx, e, { acaoId: p.acaoId, fonte, hab, indice: 1, secundario: true }, saida);
      }
    }
  };
  // Tempestade de aço: a chuva cai pelas últimas células do caminho.
  const tempestade = marcoDe(ctx, dono, 'tempestadePct');
  if (tempestade > 0) {
    const celulas = [];
    for (let i = 0; i < ef.tempestadeCelulas; i++) {
      const c = { x: Math.round(p.x - p.dirX * i), y: Math.round(p.y - p.dirY * i) };
      if (passavel(ctx.fase, c.x, c.y)) celulas.push(c);
    }
    saida.push({ t: 'marcoDeClasse', tick: estado.tick, id: dono.id, marco: 'tempestade', celulas });
    atingir(celulas, tempestade, 0);
  }
  // Disparo explosivo: uma explosão em volta de onde parou.
  const explosao = marcoDe(ctx, dono, 'explosaoPct');
  if (explosao > 0) {
    saida.push({ t: 'marcoDeClasse', tick: estado.tick, id: dono.id, marco: 'explosao', celulas: [fim] });
    atingir([fim], explosao, ef.explosaoRaio);
  }
  // Flecha-âncora: uma flecha cravada que atira sozinha (não conta no limite de invocações).
  const ancoraMs = marcoDe(ctx, dono, 'ancoraMs');
  if (ancoraMs > 0 && passavel(ctx.fase, fim.x, fim.y)) {
    const antes = estado.entidades.length;
    invocar(estado, ctx, dono, construirEfeito('invocar_temporario', { ref: 'flecha_ancora', valor: 1, duracaoMs: ancoraMs }), saida);
    const torre = estado.entidades.length > antes ? estado.entidades[estado.entidades.length - 1] : undefined;
    if (torre) {
      if (!estado.entidades.some((o) => o !== torre && vivo(o) && celulaOcupada(o).x === fim.x && celulaOcupada(o).y === fim.y)) {
        posicionar(torre, fim.x, fim.y);
        torre.origemX = fim.x;
        torre.origemY = fim.y;
      }
      torre.atributos = { ...torre.atributos, destreza: dono.atributos.destreza, forca: dono.atributos.forca };
      torre.nivel = dono.nivel;
    }
  }
}
