// Ficha de sessão no PvP (§3.7). O save local é editável e não prova nada: o servidor constrói a
// ficha a partir do pedido do cliente (não confiável), aplicando tetos e orçamento do modo, e
// recalcula HP, mana e defesa das bases validadas. Devolve a ficha efetiva e a prévia do que mudou.

import type { Conteudo } from '../core/conteudo';
import type { Balance } from '../core/contexto';
import { hash53, serializarCanonico } from '../core/digest';
import { ehObjeto } from '../core/validar';
import { ATRIBUTOS_NEUTROS, type Atributos, type ClasseCombate } from '../entities/entidade';
import type { ClasseJogador } from '../entities/presets';
import type { ClampDeFicha, ModoDeJogo } from '../modos/modo';
import { hpMaximo, manaMaxima } from '../progression/ficha';
import { pontosUteis } from '../progression/efeitos-atributo';

const ATRIBUTOS = Object.keys(ATRIBUTOS_NEUTROS) as (keyof Atributos)[];
const NEUTRO = 10;

export interface FichaDeSessao {
  classeId: string;
  classe: ClasseCombate;
  atributos: Atributos;
  habilidades: string[];
  ataqueBasico: string;
  nivel: number;
  hpMax: number;
  manaMax: number;
  defesa: number;
}

export interface Alteracao {
  campo: string;
  pedido: string;
  efetivo: string;
}

export interface PreviaDeFicha {
  ficha: FichaDeSessao;
  alteracoes: Alteracao[];
  /** Hash da política e do catálogo usados: a entrada revalida contra ele (§3.7). */
  hashPolitica: string;
}

function numeroOu(v: unknown, padrao: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : padrao;
}

/** Reduz 1 ponto do maior atributo (desempate pela ordem do modo) até caber no limite. */
function reduzirAte(a: Atributos, limite: number, ordem: readonly (keyof Atributos)[], medida: (a: Atributos) => number): void {
  for (let guarda = 0; medida(a) > limite && guarda < 10_000; guarda++) {
    let alvo: keyof Atributos | null = null;
    for (const k of ordem) if (a[k] > 1 && (alvo === null || a[k] > a[alvo])) alvo = k;
    if (alvo === null) return;
    a[alvo]--;
  }
}

/** Reescala a soma para `total` com arredondamento por maiores restos (determinístico). */
function escalar(a: Atributos, total: number, ordem: readonly (keyof Atributos)[]): void {
  const soma = ATRIBUTOS.reduce((s, k) => s + a[k], 0);
  if (soma <= total) return;
  const fator = total / soma;
  const restos: { k: keyof Atributos; resto: number }[] = [];
  let usado = 0;
  for (const k of ATRIBUTOS) {
    const bruto = a[k] * fator;
    a[k] = Math.max(1, Math.floor(bruto));
    usado += a[k];
    restos.push({ k, resto: bruto - Math.floor(bruto) });
  }
  restos.sort((x, y) => y.resto - x.resto || ordem.indexOf(y.k) - ordem.indexOf(x.k));
  for (const { k } of restos) {
    if (usado >= total) break;
    a[k]++;
    usado++;
  }
}

const somaTotal = (a: Atributos) => ATRIBUTOS.reduce((s, k) => s + a[k], 0);
const somaAcimaDoNeutro = (a: Atributos) => ATRIBUTOS.reduce((s, k) => s + Math.max(0, a[k] - NEUTRO), 0);

function aplicarClampDeAtributos(a: Atributos, c: ClampDeFicha): void {
  for (const k of ATRIBUTOS) a[k] = Math.min(c.atributoMax, Math.max(1, a[k]));
  if (c.modo === 'escalar') escalar(a, c.atributoTotalMax, c.ordemReducao);
  else reduzirAte(a, c.atributoTotalMax, c.ordemReducao, somaTotal);
  // O orçamento conta só os pontos acima do neutro; reduz o maior deles primeiro.
  for (let guarda = 0; somaAcimaDoNeutro(a) > c.orcamentoAtributos && guarda < 10_000; guarda++) {
    let alvo: keyof Atributos | null = null;
    for (const k of c.ordemReducao) if (a[k] > NEUTRO && (alvo === null || a[k] > a[alvo])) alvo = k;
    if (alvo === null) break;
    a[alvo]--;
  }
}

export function construirFichaDeSessao(pedido: unknown, modo: ModoDeJogo, conteudo: Conteudo, balance: Balance): PreviaDeFicha {
  const p = ehObjeto(pedido) ? pedido : {};
  const alteracoes: Alteracao[] = [];
  const registrar = (campo: string, pedidoValor: unknown, efetivo: unknown) => {
    const a = serializarCanonico(pedidoValor ?? null);
    const b = serializarCanonico(efetivo);
    if (a !== b) alteracoes.push({ campo, pedido: a, efetivo: b });
  };

  const c = modo.clamp;
  const classes = [...conteudo.classes.values()];
  const padrao = classes[0];
  if (!padrao) throw new Error('nenhuma classe no catálogo');
  const pedidaClasse = typeof p.classeId === 'string' ? conteudo.classes.get(p.classeId) : undefined;
  const classe: ClasseJogador = (c?.modo === 'preset' && c.presetClasse ? conteudo.classes.get(c.presetClasse) : pedidaClasse) ?? padrao;
  registrar('classe', p.classeId, classe.id);

  // Atributos: no preset, a ficha oficial; senão, o pedido dentro dos tetos e do orçamento.
  const pedidos = ehObjeto(p.atributos) ? p.atributos : {};
  const atributos: Atributos = { ...classe.atributos };
  if (c?.modo !== 'preset') {
    for (const k of ATRIBUTOS) atributos[k] = numeroOu(pedidos[k], classe.atributos[k]);
    if (c) aplicarClampDeAtributos(atributos, c);
  }
  for (const k of ATRIBUTOS) registrar(`atributos.${k}`, pedidos[k] ?? classe.atributos[k], atributos[k]);

  // Habilidades: só as legais da classe e do modo (§3.7), nunca as "provadas" pelo save.
  const legais = classe.habilidades.filter((h) => !c || c.habilidadesPermitidas === 'qualquer' || c.habilidadesPermitidas.includes(h));
  const pedidasHab = Array.isArray(p.habilidades) ? p.habilidades.filter((h): h is string => typeof h === 'string') : legais;
  const slots = c?.slotsHabilidade ?? legais.length;
  const habilidades = c?.modo === 'preset' ? legais.slice(0, slots) : [...new Set(pedidasHab)].filter((h) => legais.includes(h)).slice(0, slots);
  registrar('habilidades', p.habilidades ?? legais, habilidades);

  const nivel = Math.min(c?.nivelMax ?? balance.xp.nivelMax, Math.max(1, numeroOu(p.nivel, 1)));
  registrar('nivel', p.nivel ?? 1, nivel);

  // HP, mana e defesa: sempre derivados; nada do cliente é aceito (§2.5, §3.7).
  let hpMax = hpMaximo(classe.hpBase, pontosUteis(atributos.constituicao, balance), balance.hp.hpAtributoMult, balance.hp.dificuldadeMult);
  // Marco 15: a vida do modo (o Livre dura mais, D-061).
  if (c) hpMax = Math.max(1, Math.round((hpMax * c.vidaPct) / 100));
  if (c?.hpMaxAbsoluto) hpMax = Math.min(hpMax, c.hpMaxAbsoluto);
  if (p.hpMax !== undefined) registrar('hpMax', p.hpMax, hpMax);

  const ficha: FichaDeSessao = {
    classeId: classe.id,
    classe: classe.classe,
    atributos,
    habilidades,
    ataqueBasico: classe.ataqueBasico,
    nivel,
    hpMax,
    manaMax: manaMaxima(pontosUteis(atributos.sabedoria, balance)),
    defesa: classe.defesa,
  };
  return { ficha, alteracoes, hashPolitica: hash53(serializarCanonico({ modo: modo.id, clamp: c, classe })) };
}
