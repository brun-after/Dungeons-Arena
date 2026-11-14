// A função secundária do elemento pelo papel do núcleo (marco 40, 12/11/2026, D-157). O elemento mantém a função
// principal da skill e acrescenta uma secundária, que depende do papel: na skill de dano, o fogo queima (estado de
// elementos.json) e o sagrado cura os aliados; na cura, o gelo deixa escudo; na defesa, o fogo queima quem bate. A
// tabela fica em papeis.json, cheia na faixa 10 da sintonia (ou da runa, nas skills de classe) e proporcional abaixo
// dela; com `desde`, o efeito só entra a partir daquela faixa, inteiro. Puro.

import { ehObjeto, Leitor } from '../core/validar';
import { PAPEIS, type Papel } from './eixos';
import type { Habilidade } from './habilidades';
import { normalizarEfeitos } from './normalizar-efeito';
import { REGISTRO_EFEITOS, type EfeitoCanonico } from './registro-efeitos';
import { PONTAS_ELEMENTAIS, type PontaElemental } from '../progression/vinculo';

export interface EfeitoSecundario {
  efeito: EfeitoCanonico;
  /** A faixa a partir da qual entra (1 = desde a primeira, proporcional). */
  desde: number;
}

export interface Secundario {
  /** Cura a mais da própria skill na faixa 10, em %. */
  curaPct: number;
  efeitos: readonly EfeitoSecundario[];
}

export type TabelaDePapeis = ReadonlyMap<Papel, ReadonlyMap<PontaElemental, Secundario>>;

export function lerPapeis(json: unknown): { papeis: Map<Papel, Map<PontaElemental, Secundario>>; erros: string[] } {
  const l = new Leitor('papeis.json');
  const raiz = l.objeto(l.objeto(json, 'raiz').papeis, 'papeis');
  const papeis = new Map<Papel, Map<PontaElemental, Secundario>>();
  for (const k of Object.keys(raiz)) {
    if (!(PAPEIS as readonly string[]).includes(k)) {
      l.erro(`papel desconhecido "${k}"`);
      continue;
    }
    const porElemento = new Map<PontaElemental, Secundario>();
    const o = l.objeto(raiz[k], k);
    for (const el of Object.keys(o)) {
      if (!(PONTAS_ELEMENTAIS as readonly string[]).includes(el)) {
        l.erro(`${k}: elemento desconhecido "${el}"`);
        continue;
      }
      const e = l.objeto(o[el], `${k}.${el}`);
      const efeitos = lerEfeitosGraduais(l, l.lista(e, 'efeitos'), `${k}.${el}`);
      porElemento.set(el as PontaElemental, { curaPct: e.curaPct === undefined ? 0 : l.numero(e, 'curaPct', { min: 0, max: 100 }), efeitos });
    }
    papeis.set(k as Papel, porElemento);
  }
  return { papeis, erros: l.erros };
}

/** O efeito na faixa: com `desde` > 1, inteiro a partir dela; senão, valor e pct (ou a duração) na fração da faixa. */
export function naFaixa(s: EfeitoSecundario, faixa: number): EfeitoCanonico | null {
  if (faixa < s.desde) return null;
  if (s.desde > 1) return s.efeito;
  const g = Math.max(0, Math.min(10, faixa)) / 10;
  const e = s.efeito;
  if (e.valor !== 0 || e.pct !== 0) return { ...e, valor: e.valor === 0 ? 0 : Math.max(1, Math.round(e.valor * g)), pct: Math.round(e.pct * g * 10) / 10 };
  return { ...e, duracaoMs: Math.round(e.duracaoMs * g) };
}

/**
 * Marco 40 (D-158): o efeito "no alvo" só entra quando o alvo é quem ele serve — o ruim, num golpe em inimigo; o bom,
 * numa skill em aliado ou em si. Assim um campo ou uma postura não congela quem conjura.
 */
export function cabeNaSkill(h: Habilidade, e: EfeitoCanonico): boolean {
  if (e.em !== 'alvo') return true;
  // Marco 40 (13/11/2026, D-161): o que cai no lugar (fase, armadilha, invocação, campo) não é estado de alguém: sempre cabe.
  const d = REGISTRO_EFEITOS[e.tipo];
  if (d.fluxo === 'fase' || d.fluxo === 'armadilha' || d.fluxo === 'invocar' || d.instantaneo === 'campo_cura' || d.instantaneo === 'campo_veneno') return true;
  const feriAlvo = h.politicaAlvo === 'hostil' || (h.politicaImpacto === 'area' && h.politicaAlvo !== 'aliados');
  return REGISTRO_EFEITOS[e.tipo].positivo !== feriAlvo;
}

/** Lê os efeitos graduais (com `desde` opcional) de uma lista crua. */
export function lerEfeitosGraduais(l: Leitor, lista: readonly unknown[], onde: string): EfeitoSecundario[] {
  const efeitos: EfeitoSecundario[] = [];
  for (const bruto of lista) {
    if (!ehObjeto(bruto)) continue;
    const { desde, ...resto } = bruto;
    const d = desde === undefined ? 1 : Number(desde);
    if (!Number.isInteger(d) || d < 1 || d > 10) l.erro(`${onde}: desde inválido`);
    for (const efeito of normalizarEfeitos([resto], l)) efeitos.push({ efeito, desde: d });
  }
  return efeitos;
}

/** A habilidade com a função secundária do papel no elemento, na faixa (0 = nada). Não repete um efeito que ela já tem. */
export function aplicarSecundario(h: Habilidade, tabela: TabelaDePapeis | undefined, ponta: PontaElemental, faixa: number): Habilidade {
  const sec = h.papel ? tabela?.get(h.papel)?.get(ponta) : undefined;
  if (!sec || faixa <= 0) return h;
  const efeitos = [...h.efeitos];
  for (const s of sec.efeitos) {
    const e = naFaixa(s, faixa);
    if (e && cabeNaSkill(h, e) && !efeitos.some((x) => x.tipo === e.tipo && x.em === e.em)) efeitos.push(e);
  }
  const multCura = h.formulaCura !== null ? h.multCura * (1 + (sec.curaPct * faixa) / 1000) : h.multCura;
  return { ...h, efeitos, multCura };
}
