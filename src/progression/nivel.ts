// Subida de nível (§2.12). Marco 6 (13/10/2026). Em laço, preservando o XP excedente: cada nível
// dá pontos de atributo e o aumento automático de HP base; a ficha é recalculada no fim.

import type { Balance, ContextoSimulacao } from '../core/contexto';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import type { Entidade } from '../entities/entidade';
import { recalcularFicha } from './derivados';
import { sincronizarRanksDeClasse } from './habilidades-classe';
import { NOMES_ATRIBUTOS } from './itens';

/**
 * XP para passar do nível `nivel` ao seguinte: tabela configurável, com fallback `nivel × 100`. Marco 28 (30/10/2026,
 * D-127): acima do nível da curva longa, cada nível custa mais `crescimentoPct`% por nível (o 100 é meta de muitas horas).
 */
export function xpParaProximo(nivel: number, xp: Balance['xp']): number {
  const base = xp.tabela[nivel - 1] ?? nivel * xp.fallbackPorNivel;
  const acima = Math.max(0, nivel - xp.curvaLonga.aPartirDe);
  return Math.round(base * (1 + (acima * xp.curvaLonga.crescimentoPct) / 100));
}

/** Marco 28 (D-127): os pontos de atributo que chegar ao nível `nivel` dá (crescem por faixa depois do 30). */
export function pontosDoNivel(nivel: number, xp: Balance['xp']): number {
  let pontos = xp.pontosPorNivel;
  for (const f of xp.pontosPorFaixa) if (nivel >= f.aPartirDe) pontos = f.pontos;
  return pontos;
}

/** Marco 28 (30/10/2026, D-127): o teto do atributo-base pelos pontos gastos: nível + folga, até o máximo. */
export function tetoDoAtributo(nivel: number, b: Balance): number {
  return Math.min(b.atributos.maximo, nivel + b.atributos.folgaSobreNivel);
}

/** Marco 28 (D-127): todos os pontos de atributo do nível 2 até `nivel`. */
export function pontosAteONivel(nivel: number, xp: Balance['xp']): number {
  let soma = 0;
  for (let n = 2; n <= nivel; n++) soma += pontosDoNivel(n, xp);
  return soma;
}

/** D-075: acumula frações para que penalidade e antifarm não virem sempre 1 XP por abate. */
export function concederXpDeProgressao(e: Entidade, ctx: ContextoSimulacao, valor: number, tick: number, saida: EventoSimulacao[]): void {
  const total = Math.max(0, valor) + (e.bolsa?.xpFracao ?? 0);
  const inteiro = Math.floor(total + 1e-9);
  if (e.bolsa) e.bolsa.xpFracao = Math.max(0, total - inteiro);
  if (inteiro > 0) {
    e.xp += inteiro;
    saida.push({ t: 'xpGanho', tick, id: e.id, xp: inteiro });
    aplicarSubidas(e, ctx, tick, saida);
  }
}

export function aplicarSubidas(e: Entidade, ctx: ContextoSimulacao, tick: number, saida: EventoSimulacao[]): void {
  if (!e.bolsa) return;
  const regras = ctx.balance.xp;
  let subiu = false;
  while (e.nivel < regras.nivelMax && e.xp >= xpParaProximo(e.nivel, regras)) {
    e.xp -= xpParaProximo(e.nivel, regras);
    e.nivel++;
    e.bolsa.pontosAtributo += pontosDoNivel(e.nivel, regras);
    // Marco 14: cada nível dá pontos de habilidade (ranks e aprender).
    e.bolsa.pontosHabilidade += ctx.balance.habilidades.pontosPorNivel;
    subiu = true;
    saida.push({ t: 'subiuNivel', tick, id: e.id, nivel: e.nivel });
  }
  // Marco 24 (D-094): as skills de classe sobem de rank com o nível.
  if (subiu) sincronizarRanksDeClasse(e, ctx, tick, saida);
  if (subiu) recalcularFicha(e, ctx);
}

/**
 * Perda de XP na morte (§2.12, marco 10A-2). Sem `perdeNivel`, o XP para em 0. Com ele, o que faltar
 * desce níveis em laço: cada nível perdido devolve o XP daquele nível e revoga os pontos que ele deu
 * (primeiro os não distribuídos, depois dos atributos-base acima do neutro, na ordem da ficha).
 * Devolve quantos níveis foram perdidos.
 */
export function perderXp(e: Entidade, ctx: ContextoSimulacao, quanto: number, perdeNivel: boolean): number {
  if (!e.bolsa || quanto <= 0) return 0;
  const regras = ctx.balance.xp;
  e.xp -= quanto;
  let niveis = 0;
  while (perdeNivel && e.xp < 0 && e.nivel > 1) {
    const revogados = pontosDoNivel(e.nivel, regras);
    e.nivel--;
    e.xp += xpParaProximo(e.nivel, regras);
    niveis++;
    // Marco 14: só os pontos de habilidade não gastos voltam (ranks e caminhos ficam).
    e.bolsa.pontosHabilidade = Math.max(0, e.bolsa.pontosHabilidade - ctx.balance.habilidades.pontosPorNivel);
    let revogar = revogados;
    const livres = Math.min(revogar, e.bolsa.pontosAtributo);
    e.bolsa.pontosAtributo -= livres;
    revogar -= livres;
    for (const nome of NOMES_ATRIBUTOS) {
      while (revogar > 0 && e.bolsa.atributosBase[nome] > 10) {
        e.bolsa.atributosBase[nome]--;
        revogar--;
      }
    }
  }
  e.xp = Math.max(0, e.xp);
  if (niveis > 0) recalcularFicha(e, ctx);
  return niveis;
}
