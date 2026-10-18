// Orçamento de poder (D-057, D-059). Marco 14 (14/10/2026). Puro.
// Cada peça da habilidade compilada tem custo: o dano médio pela forma (e pelos saltos), a cura, cada efeito
// pela força e duração. O tempo (recarga e conjuração) e o custo (mana e vida) descontam. A habilidade só vale
// se o poder couber no orçamento do nível — catálogo, evoluções, livros e geradas, todos pela mesma conta.
// Os números ficam em balance.json (`orcamento`); o modo ajusta o total por `orcamentoHabilidadePct`.

import type { ContextoSimulacao } from '../core/contexto';
import { faixaDaFormula } from './dados';
import type { Habilidade } from './habilidades';
import { REGISTRO_EFEITOS, type EfeitoCanonico } from './registro-efeitos';

export interface RegrasOrcamento {
  base: number;
  porNivel: number;
  /** Habilidades geradas (inimigos e livros raros) usam esta fração do orçamento. */
  geradaPct: number;
  fatorForma: {
    contato: number;
    projetil: number;
    perfura: number;
    quadradoPorRaio: number;
    linha: number;
    cone: number;
    conePorRaio: number;
    aoRedorPorRaio: number;
    aliados: number;
  };
  /** Ajuste de 15/10/2026: quanto andar conjurando encarece a habilidade (fração do poder). */
  mobilidade: { lenta: number; livre: number };
  pesos: {
    controlePorS: number;
    travaPorS: number;
    periodico: number;
    escudo: number;
    buffPorPctS: number;
    deslocamentoPorCelula: number;
    teleporte: number;
    troca: number;
    invocacao: number;
    cura: number;
    recurso: number;
    imunePorS: number;
    marca: number;
    atrasado: number;
    rastro: number;
    dominar: number;
    armadilha: number;
  };
}

const media = (formula: string | null) => {
  if (formula === null) return 0;
  const f = faixaDaFormula(formula);
  return (f.min + f.max) / 2;
};

/** Quanto a forma multiplica o dano (quantos alvos ela tende a pegar). */
export function fatorDaForma(h: Habilidade, r: RegrasOrcamento): number {
  const f = r.fatorForma;
  if (h.politicaImpacto === 'projetil') return h.perfura ? f.perfura : f.projetil;
  if (h.politicaImpacto !== 'area') return f.contato;
  switch (h.tipoArea) {
    case 'quadrado':
      return 1 + f.quadradoPorRaio * h.raioArea;
    case 'linha':
      return f.linha;
    case 'cone':
      return f.cone + f.conePorRaio * h.raioArea;
    case 'ao_redor':
      return h.politicaAlvo === 'aliados' ? f.aliados : 1 + f.aoRedorPorRaio * h.raioArea;
    case 'nenhuma':
      return 1;
  }
}

/** Custo de um efeito: controle e trava por segundo, periódicos pelo total, buffs por % × segundo. */
export function pesoDoEfeito(ef: EfeitoCanonico, r: RegrasOrcamento): number {
  const d = REGISTRO_EFEITOS[ef.tipo];
  const p = r.pesos;
  const s = ef.duracaoMs / 1000;
  if (d.fluxo === 'atrasado') return ef.interno ? pesoDoEfeito(ef.interno, r) * p.atrasado : 0;
  if (d.fluxo === 'invocar') return p.invocacao * Math.max(1, ef.valor);
  if (d.fluxo === 'armadilha') return ef.valor * p.armadilha;
  switch (d.instantaneo) {
    case 'drenar_invocacao':
      return ef.valor * p.cura;
    case 'comandar_mortos':
      return (ef.pct + 20) * s * p.buffPorPctS * 4;
    case 'cura':
      return ef.valor * p.cura + ef.pct * 0.3 * p.cura;
    case 'recurso':
      return ef.valor * p.recurso;
    case 'dano':
      return ef.valor;
    case 'teleporte':
      return p.teleporte;
    case 'trocar':
      return p.troca;
    case 'avanco':
    case 'empurrao':
    case 'puxao':
      return ef.valor * p.deslocamentoPorCelula;
    case null:
      break;
  }
  if (d.periodico === 'dano' || d.periodico === 'cura') return ef.valor * s * p.periodico + (d.curaRecebida < 0 ? (ef.pct * s * p.buffPorPctS) / 2 : 0);
  if (d.periodico === 'recurso') return ef.valor * s * p.recurso;
  if (d.bloqueiaAcoes === 'todas') return s * p.controlePorS;
  if (d.bloqueiaMovimento || d.bloqueiaAcoes !== 'nenhuma') return s * p.travaPorS;
  if (d.imuneDano) return s * p.imunePorS;
  if (d.escudo) return ef.valor * p.escudo;
  if (d.rastro) return p.rastro;
  if (d.domina) return p.dominar;
  if (d.danoCausado !== 0 || d.danoRecebido !== 0 || d.lentidao || d.ataqueBasico) return Math.abs(ef.pct || ef.valor * 10) * s * p.buffPorPctS;
  return p.marca;
}

/** Poder da habilidade compilada. */
export function poderDaHabilidade(h: Habilidade, r: RegrasOrcamento): number {
  const saltos = h.saltos ? (h.saltos.quantidade * h.saltos.pct) / 100 : 0;
  const dano = media(h.formulaDano) * h.multDano * fatorDaForma(h, r) * (1 + saltos);
  const cura = media(h.formulaCura) * h.multCura * r.pesos.cura * (h.politicaAlvo === 'aliados' ? r.fatorForma.aliados : 1);
  const efeitos = h.efeitos.reduce((soma, ef) => soma + pesoDoEfeito(ef, r), 0);
  const recargaS = h.recargaMs / 1000;
  const tempo = 5 / (5 + recargaS);
  const conjuracao = 1 - Math.min(0.5, (h.conjuracaoMs / 1000) * 0.1);
  const custo = 1 + h.custoRecurso / 10 + h.custoVida / 15;
  const mobilidade = 1 + (h.mobilidade === 'trava' ? 0 : r.mobilidade[h.mobilidade]);
  return ((dano + cura + efeitos) * tempo * conjuracao * mobilidade) / custo;
}

/** Orçamento no nível: `(base + porNivel × (nível − 1)) × pct do modo`. */
export function orcamentoNoNivel(nivel: number, r: RegrasOrcamento, pctModo = 100): number {
  return (r.base + r.porNivel * (Math.max(1, nivel) - 1)) * (pctModo / 100);
}

export function cabeNoOrcamento(h: Habilidade, nivel: number, ctx: Pick<ContextoSimulacao, 'balance'>, pct = 100): boolean {
  return poderDaHabilidade(h, ctx.balance.orcamento) <= orcamentoNoNivel(nivel, ctx.balance.orcamento, pct) + 1e-9;
}
