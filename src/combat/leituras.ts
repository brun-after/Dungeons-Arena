// Marco 40 (12/11/2026, D-159): as leituras de estilo das skills de classe. Cada skill de classe diz, para cada um dos
// cinco estilos da classe, que eixo aquele estilo empurra nela (a forma, gradual de 10% a 100% da ponta) e o que muda
// além da forma (efeitos graduais pela faixa, como os da função secundária). O texto é o que a carta mostra.
// Marco 40 (13/11/2026, D-161): a leitura faz o que o texto promete. Além dos efeitos, ela pode mudar a própria skill
// (`ajustes`: raio, alcance, saltos, perfuração, conjuração, dano, recarga, ininterrupta), a partir de uma faixa, e
// trazer efeitos para quando a skill abate (`aoAbater`, aplicados por progression/morte.ts).

import type { Leitor } from '../core/validar';
import { ehObjeto } from '../core/validar';
import { EIXOS, type Eixo } from './eixos';
import { TIPOS_AREA, type Habilidade, type TipoArea } from './habilidades';
import { cabeNaSkill, lerEfeitosGraduais, naFaixa, type EfeitoSecundario } from './papeis';
import { construirEfeito, REGISTRO_EFEITOS, type EfeitoCanonico } from './registro-efeitos';

/** O que a leitura muda na skill, inteiro a partir da faixa `desde`. */
export interface AjustesLeitura {
  desde: number;
  /** Células a mais (ou a menos) no raio da área e no alcance. */
  raio?: number;
  alcance?: number;
  tipoArea?: TipoArea;
  /** Saltos para vizinhos (cada um com `saltoPct`% do golpe). */
  saltos?: number;
  saltoPct?: number;
  /** O projétil atravessa todos. */
  perfura?: boolean;
  /** Multiplicadores em %: 100 = sem mudança. */
  conjuracaoPct?: number;
  danoPct?: number;
  recargaPct?: number;
  ininterrupta?: boolean;
  /** Na armadilha: quantas vezes arma de novo sozinha e o escudo que dá ao aliado que pisa. */
  rearmes?: number;
  escudoAliado?: number;
  /** Criaturas a mais (ou a menos, até 1) em cada invocação da skill. */
  invocacoes?: number;
}

export interface Leitura {
  eixo: Eixo;
  texto: string;
  efeitos: readonly EfeitoSecundario[];
  ajustes?: AjustesLeitura;
  aoAbater?: readonly EfeitoSecundario[];
}

/** estilo -> leitura. */
export type Leituras = Readonly<Record<string, Leitura>>;

const CAMPOS = ['eixo', 'texto', 'efeitos', 'ajustes', 'aoAbater'];
const CAMPOS_AJUSTE = ['desde', 'raio', 'alcance', 'tipoArea', 'saltos', 'saltoPct', 'perfura', 'conjuracaoPct', 'danoPct', 'recargaPct', 'ininterrupta', 'rearmes', 'escudoAliado', 'invocacoes'];

export function lerAjustes(l: Leitor, v: unknown, onde: string): AjustesLeitura {
  const o = l.objeto(v, `${onde}.ajustes`);
  for (const k of Object.keys(o)) if (!CAMPOS_AJUSTE.includes(k)) l.erro(`${onde}.ajustes: campo desconhecido "${k}"`);
  const n = (k: string, min: number, max: number) => (o[k] === undefined ? undefined : l.numero(o, k, { min, max }));
  const a: AjustesLeitura = { desde: n('desde', 1, 10) ?? 1 };
  const raio = n('raio', -3, 3);
  const alcance = n('alcance', -5, 5);
  const saltos = n('saltos', 1, 4);
  const saltoPct = n('saltoPct', 10, 100);
  const conjuracaoPct = n('conjuracaoPct', 30, 300);
  const danoPct = n('danoPct', 30, 300);
  const recargaPct = n('recargaPct', 30, 300);
  if (raio !== undefined) a.raio = raio;
  if (alcance !== undefined) a.alcance = alcance;
  if (o.tipoArea !== undefined) a.tipoArea = l.opcao(o, 'tipoArea', TIPOS_AREA);
  if (saltos !== undefined) a.saltos = saltos;
  if (saltoPct !== undefined) a.saltoPct = saltoPct;
  if (o.perfura !== undefined) a.perfura = l.booleano(o, 'perfura');
  if (conjuracaoPct !== undefined) a.conjuracaoPct = conjuracaoPct;
  if (danoPct !== undefined) a.danoPct = danoPct;
  if (recargaPct !== undefined) a.recargaPct = recargaPct;
  if (o.ininterrupta !== undefined) a.ininterrupta = l.booleano(o, 'ininterrupta');
  const rearmes = n('rearmes', 1, 3);
  const escudoAliado = n('escudoAliado', 1, 40);
  const invocacoes = n('invocacoes', -3, 3);
  if (invocacoes !== undefined) a.invocacoes = invocacoes;
  if (rearmes !== undefined) a.rearmes = rearmes;
  if (escudoAliado !== undefined) a.escudoAliado = escudoAliado;
  return a;
}

export function lerLeituras(l: Leitor, v: unknown): Leituras {
  const saida: Record<string, Leitura> = {};
  const o = l.objeto(v, 'leituras');
  for (const [estilo, bruto] of Object.entries(o)) {
    if (!/^[a-z_]+$/.test(estilo)) l.erro(`leituras: estilo "${estilo}" só aceita a–z e _`);
    const onde = `leituras.${estilo}`;
    const x = l.objeto(bruto, onde);
    const eixo = l.texto(x, 'eixo');
    if (!(EIXOS as readonly string[]).includes(eixo)) l.erro(`${onde}: eixo desconhecido "${eixo}"`);
    for (const k of Object.keys(x)) if (!CAMPOS.includes(k)) l.erro(`${onde}: campo desconhecido "${k}"`);
    const lista = (k: string) => {
      if (x[k] !== undefined && !Array.isArray(x[k])) l.erro(`${onde}: ${k} precisa ser lista`);
      return lerEfeitosGraduais(l, Array.isArray(x[k]) ? x[k] : [], onde);
    };
    const efeitos = lista('efeitos');
    const aoAbater = x.aoAbater === undefined ? undefined : lista('aoAbater');
    saida[estilo] = {
      eixo: eixo as Eixo,
      texto: ehObjeto(x) && typeof x.texto === 'string' ? x.texto : '',
      efeitos,
      ...(x.ajustes !== undefined && { ajustes: lerAjustes(l, x.ajustes, onde) }),
      ...(aoAbater && { aoAbater }),
    };
  }
  return saida;
}

export function ajustar(h: Habilidade, a: AjustesLeitura): Habilidade {
  const s = { ...h };
  if (a.raio !== undefined) s.raioArea = Math.max(0, Math.min(5, s.raioArea + a.raio));
  if (a.alcance !== undefined) s.alcanceCelulas = Math.max(0, s.alcanceCelulas + a.alcance);
  if (a.tipoArea) s.tipoArea = a.tipoArea;
  if (a.saltos !== undefined) s.saltos = { quantidade: Math.max(s.saltos?.quantidade ?? 0, a.saltos), raio: s.saltos?.raio ?? 3, pct: a.saltoPct ?? s.saltos?.pct ?? 50 };
  if (a.perfura) s.perfura = true;
  if (a.conjuracaoPct !== undefined) s.conjuracaoMs = Math.round((s.conjuracaoMs * a.conjuracaoPct) / 100);
  if (a.danoPct !== undefined) s.multDano = s.multDano * (a.danoPct / 100);
  if (a.recargaPct !== undefined) s.recargaMs = Math.round((s.recargaMs * a.recargaPct) / 100);
  if (a.ininterrupta) s.interrupcao = 'ininterrupta';
  const mais = a.invocacoes;
  if (mais !== undefined) s.efeitos = s.efeitos.map((e) => (e.tipo === 'invocar' || e.tipo === 'invocar_temporario' ? { ...e, valor: Math.max(1, e.valor + mais) } : e));
  if (a.rearmes !== undefined || a.escudoAliado !== undefined) {
    const { rearmes, escudoAliado } = a;
    s.efeitos = s.efeitos.map((e) => (e.tipo !== 'armadilha' ? e : {
      ...e,
      ...(rearmes !== undefined && { pct: rearmes }),
      ...(escudoAliado !== undefined && { aliado: construirEfeito('escudo', { valor: escudoAliado, duracaoMs: 5000 }) }),
    }));
  }
  return s;
}

/**
 * A skill com as leituras ativas, cada uma na faixa do seu estilo: os efeitos (sem repetir um que ela já tem), os
 * ajustes (da faixa `desde`) e os efeitos ao abater.
 */
export function aplicarLeituras(h: Habilidade, leituras: Leituras | undefined, ativas: readonly { estilo: string; faixa: number }[]): Habilidade {
  if (!leituras || ativas.length === 0) return h;
  let saida: Habilidade = { ...h, efeitos: [...h.efeitos] };
  const aoAbater: EfeitoCanonico[] = [...(h.aoAbater ?? [])];
  for (const a of ativas) {
    const leitura = leituras[a.estilo];
    if (!leitura) continue;
    for (const s of leitura.efeitos) {
      const e = naFaixa(s, a.faixa);
      // Ecos e fases somam (cada um é um golpe a mais); os outros não se repetem.
      const soma = e && (REGISTRO_EFEITOS[e.tipo].fluxo === 'atrasado' || REGISTRO_EFEITOS[e.tipo].fluxo === 'fase');
      if (e && cabeNaSkill(saida, e) && (soma || !saida.efeitos.some((x) => x.tipo === e.tipo && x.em === e.em))) saida.efeitos.push(e);
    }
    if (leitura.ajustes && a.faixa >= leitura.ajustes.desde) saida = ajustar(saida, leitura.ajustes);
    for (const s of leitura.aoAbater ?? []) {
      const e = naFaixa(s, a.faixa);
      if (e) aoAbater.push(e);
    }
  }
  return aoAbater.length > 0 ? { ...saida, aoAbater } : saida;
}
