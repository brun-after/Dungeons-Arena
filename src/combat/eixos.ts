// Os eixos das skills (marco 40, 12/11/2026, D-157). Todo núcleo declara os eixos que um estilo pode empurrar, e cada
// estilo empurra o seu eixo principal (o secundário, na metade da faixa, quando a skill não tem o principal). A forma de
// cada eixo cresce em 10 faixas, de 10% a 100% da ponta (D-156), e cobra dano por alvo na mesma fração.
// Quatro eixos já tinham forma (os modificadores de equipamento: área, alvos, perfuração e eco, em forma-do-estilo.ts);
// os cinco novos ficam aqui:
// - controle: os estados que prendem ou atrapalham duram mais e, da faixa `vizinhoDesde`, passam a um vizinho;
// - sustento: parte do golpe (ou da cura) volta para quem usa, como escudo que se acumula;
// - marca: cada acerto deixa uma marca que acumula até `max` vezes; cada uma expõe o alvo;
// - grupo: parte do efeito vai para os aliados em volta (cura, escudo ou dano extra);
// - invocação: as invocações da skill duram mais.
// Puro: só transforma a habilidade compilada.

import type { Habilidade, Modificador } from './habilidades';
import { construirEfeito, type EfeitoCanonico, type TipoEfeito } from './registro-efeitos';

export const EIXOS = ['area', 'alvos', 'perfuracao', 'eco', 'controle', 'sustento', 'marca', 'grupo', 'invocacao'] as const;
export type Eixo = (typeof EIXOS)[number];

/** Marco 40 (D-157): o papel do núcleo; decide a função secundária do elemento (papeis.json). */
export const PAPEIS = ['dano', 'controle', 'cura', 'defesa', 'mobilidade', 'invocacao'] as const;
export type Papel = (typeof PAPEIS)[number];

/** As formas dos eixos novos (os outros quatro usam o nome do modificador). */
export const FORMAS_NOVAS = ['controle', 'sustento', 'marca', 'grupo', 'invocacao'] as const;
export type FormaNova = (typeof FORMAS_NOVAS)[number];
/** O nome da forma na chave e na habilidade compilada. */
export type FormaId = Modificador | FormaNova;
export const FORMAS: readonly FormaId[] = ['maior_e_mais_lenta', 'encadear', 'atravessar', 'ecoar', ...FORMAS_NOVAS];

const MOD_DO_EIXO: Readonly<Record<Eixo, FormaId>> = {
  area: 'maior_e_mais_lenta',
  alvos: 'encadear',
  perfuracao: 'atravessar',
  eco: 'ecoar',
  controle: 'controle',
  sustento: 'sustento',
  marca: 'marca',
  grupo: 'grupo',
  invocacao: 'invocacao',
};

export function formaDoEixo(e: Eixo): FormaId {
  return MOD_DO_EIXO[e];
}

/** Marco 40 (13/11/2026, D-163): o eixo de uma forma (o inverso de `formaDoEixo`). */
export function eixoDaForma(f: FormaId): Eixo {
  return EIXOS.find((e) => MOD_DO_EIXO[e] === f) ?? 'area';
}

export function ehEixo(v: unknown): v is Eixo {
  return typeof v === 'string' && (EIXOS as readonly string[]).includes(v);
}

export function ehForma(v: unknown): v is FormaId {
  return typeof v === 'string' && (FORMAS as readonly string[]).includes(v);
}

export function ehFormaNova(v: FormaId): v is FormaNova {
  return (FORMAS_NOVAS as readonly string[]).includes(v);
}

/** As regras dos eixos (`balance.habilidades.eixos`). */
export interface RegrasEixos {
  /** O dano por alvo que cada forma cobra na faixa 10 (em %, negativo); na faixa f, f/10 disso. */
  custoPct: Readonly<Record<FormaId, number>>;
  controle: { duracaoPorFaixaPct: number; vizinhoDesde: number; vizinhoRaio: number; vizinhoDuracaoPct: number };
  sustento: { fracaoPorFaixaPct: number; tetoMult: number; escudoMs: number };
  marca: { pctPorMarcaMax: number; max: number; duracaoMs: number };
  grupo: { fracaoPorFaixaPct: number; danoPorFaixaPct: number; raio: number; duracaoMs: number };
  invocacao: { duracaoPorFaixaPct: number };
}

/** Os estados que prendem ou atrapalham: o eixo de controle mexe só neles. */
export const ESTADOS_DE_CONTROLE: readonly TipoEfeito[] = ['atordoar', 'silenciar', 'sem_movimento', 'sem_ataque', 'congelado', 'enraizado', 'cego', 'aterrorizado', 'confuso', 'resfriado', 'desafiado', 'atolado'];
const INVOCACOES: readonly TipoEfeito[] = ['invocar', 'invocar_temporario'];

const temControle = (h: Habilidade) => h.efeitos.some((e) => e.em !== 'conjurador' && ESTADOS_DE_CONTROLE.includes(e.tipo));
const temEscudo = (h: Habilidade) => h.efeitos.some((e) => e.tipo === 'escudo' || e.tipo === 'escudo_acumulado');

/** A forma nova cabe nesta skill? (a skill precisa ter aquilo que o eixo empurra) */
export function formaNovaCabe(h: Habilidade, f: FormaNova): boolean {
  switch (f) {
    case 'controle':
      return temControle(h);
    case 'sustento':
      return h.formulaDano !== null || h.formulaCura !== null;
    case 'marca':
      return h.formulaDano !== null && h.politicaAlvo === 'hostil';
    case 'grupo':
      return h.formulaDano !== null || h.formulaCura !== null || temEscudo(h);
    case 'invocacao':
      return h.efeitos.some((e) => INVOCACOES.includes(e.tipo));
  }
}

/**
 * Aplica as formas novas na habilidade compilada. `media` é o golpe médio (dano, ou cura quando a skill não fere),
 * já com o multiplicador; os valores saem dele. Devolve a habilidade com os efeitos novos.
 */
export function aplicarFormasNovas(h: Habilidade, formas: readonly { mod: FormaNova; faixa: number }[], media: number, r: RegrasEixos): Habilidade {
  let efeitos: EfeitoCanonico[] = [...h.efeitos];
  let controleVizinho: Habilidade['controleVizinho'];
  for (const { mod, faixa } of formas) {
    const g = Math.max(0, Math.min(10, faixa)) / 10;
    switch (mod) {
      case 'controle': {
        const k = 1 + (r.controle.duracaoPorFaixaPct * faixa) / 100;
        efeitos = efeitos.map((e) => (e.em !== 'conjurador' && ESTADOS_DE_CONTROLE.includes(e.tipo) ? { ...e, duracaoMs: Math.round(e.duracaoMs * k) } : e));
        if (faixa >= r.controle.vizinhoDesde) controleVizinho = { raio: r.controle.vizinhoRaio, duracaoPct: r.controle.vizinhoDuracaoPct };
        break;
      }
      case 'sustento': {
        const valor = Math.max(1, Math.round((media * r.sustento.fracaoPorFaixaPct * faixa) / 100));
        efeitos.push(construirEfeito('escudo_acumulado', { valor, pct: Math.round(valor * r.sustento.tetoMult), duracaoMs: r.sustento.escudoMs, em: 'conjurador' }));
        break;
      }
      case 'marca':
        efeitos.push(construirEfeito('marca_estilo', { valor: 1, pct: Math.round(r.marca.pctPorMarcaMax * g * 10) / 10, duracaoMs: r.marca.duracaoMs }));
        break;
      case 'grupo': {
        const fracao = (r.grupo.fracaoPorFaixaPct * faixa) / 100;
        if (h.formulaCura !== null) efeitos.push(construirEfeito('cura', { valor: Math.max(1, Math.round(media * fracao)), em: 'aliados' }));
        for (const e of h.efeitos) if (e.tipo === 'escudo' && e.em !== 'aliados') efeitos.push({ ...e, valor: Math.max(1, Math.round(e.valor * fracao)), em: 'aliados' });
        if (h.formulaDano !== null) efeitos.push(construirEfeito('bonus_dano', { pct: Math.round(r.grupo.danoPorFaixaPct * faixa), duracaoMs: r.grupo.duracaoMs, em: 'aliados' }));
        break;
      }
      case 'invocacao': {
        const k = 1 + (r.invocacao.duracaoPorFaixaPct * faixa) / 100;
        efeitos = efeitos.map((e) => (INVOCACOES.includes(e.tipo) && e.duracaoMs > 0 ? { ...e, duracaoMs: Math.round(e.duracaoMs * k) } : e));
        break;
      }
    }
  }
  return { ...h, efeitos, ...(controleVizinho && { controleVizinho }) };
}
