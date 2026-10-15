// Compilador de habilidades (D-059). Marco 14 (14/10/2026). Puro e memoizado.
// Uma chave (`id@rank/caminhos+mods`, chave-habilidade.ts) vira a `Habilidade` que todo o pipeline lê:
//   1. o rank escala dano, cura e efeitos (balance.habilidades.ranks);
//   2. os caminhos de evolução (caminhos.json) mexem em dano, custo, recarga, duração, alcance, raio, elemento,
//      efeitos e modificadores;
//   3. o elemento acrescenta o seu estado (elementos.json), se a habilidade ainda não o aplica;
//   4. os modificadores: atravessar (projétil perfura), encadear (2 saltos de 50%), maior e mais lenta (raio +1,
//      conjuração ×1,5, dano ×1,25) e ecoar (o golpe ecoa 600 ms depois com metade do dano).
// Modificador que não combina com a habilidade é ignorado e não entra na chave compilada. A memória é por
// conteúdo e regras de rank: como compilar é puro, ela não muda o digest.

import type { ContextoSimulacao } from '../core/contexto';
import { Leitor, ehObjeto } from '../core/validar';
import { formatarChave, lerChave } from './chave-habilidade';
import { faixaDaFormula } from './dados';
import { ehElemento, type DefinicaoElemento, type Elemento } from './elementos';
import { gerarDefinicao } from './gerar-habilidade';
import { etiquetasDe, MODIFICADORES, type Catalogo, type DefinicaoHabilidade, type Habilidade, type Modificador } from './habilidades';
import { normalizarEfeitos } from './normalizar-efeito';
import { construirEfeito, REGISTRO_EFEITOS, type EfeitoCanonico } from './registro-efeitos';

export interface Caminho {
  id: string;
  nome: string;
  icone: string;
  mods: readonly Modificador[];
  danoPct: number;
  custoPct: number;
  recargaPct: number;
  duracaoPct: number;
  alcance: number;
  raio: number;
  elemento: Elemento | null;
  efeitos: readonly EfeitoCanonico[];
}

export interface RegrasRank {
  nivelMinimo: number;
  danoPct: number;
  efeitoPct: number;
}

export interface RegrasHabilidades {
  pontosPorNivel: number;
  rankMax: number;
  ranksEvolucao: readonly number[];
  ranks: readonly RegrasRank[];
}

/** O que a compilação consulta do conteúdo. */
export interface FontesCompilacao {
  caminhos: Catalogo<Caminho>;
  elementos: ReadonlyMap<Elemento, DefinicaoElemento>;
}

export function lerCaminhos(json: unknown): { caminhos: Map<string, Caminho>; erros: string[] } {
  const raiz = new Leitor('caminhos.json');
  const lista = raiz.lista(raiz.objeto(json, 'raiz'), 'caminhos');
  const erros = [...raiz.erros];
  const caminhos = new Map<string, Caminho>();
  for (const item of lista) {
    const l = new Leitor(`caminho ${ehObjeto(item) && typeof item.id === 'string' ? item.id : '?'}`);
    const o = l.objeto(item, 'caminho');
    const n = (campo: string, min: number, max: number) => (o[campo] === undefined ? 0 : l.numero(o, campo, { min, max }));
    const mods = o.mods === undefined ? [] : l.listaDeTextos(o, 'mods').filter((m): m is Modificador => {
      if ((MODIFICADORES as readonly string[]).includes(m)) return true;
      l.erro(`modificador desconhecido "${m}"`);
      return false;
    });
    const elemento = o.elemento === undefined ? null : ehElemento(o.elemento) ? o.elemento : null;
    if (o.elemento !== undefined && !elemento) l.erro(`elemento desconhecido "${JSON.stringify(o.elemento)}"`);
    const c: Caminho = {
      id: l.texto(o, 'id'),
      nome: l.texto(o, 'nome'),
      icone: l.texto(o, 'icone'),
      mods,
      danoPct: n('danoPct', -90, 300),
      custoPct: n('custoPct', -90, 300),
      recargaPct: n('recargaPct', -90, 300),
      duracaoPct: n('duracaoPct', -90, 300),
      alcance: n('alcance', -5, 5),
      raio: n('raio', -2, 2),
      elemento,
      efeitos: o.efeitos === undefined ? [] : normalizarEfeitos(l.lista(o, 'efeitos'), l),
    };
    if (!/^[a-z0-9_]+$/.test(c.id)) l.erro(`id "${c.id}" só aceita a–z, 0–9 e _`);
    if (caminhos.has(c.id)) l.erro('id repetido');
    erros.push(...l.erros);
    caminhos.set(c.id, c);
  }
  return { caminhos, erros };
}

const mediaDe = (formula: string | null) => {
  if (formula === null) return 0;
  const f = faixaDaFormula(formula);
  return (f.min + f.max) / 2;
};

/** Efeitos cujo `valor` é força (dano, cura, escudo): o rank escala; contagens e distâncias não. */
function valorEscala(ef: EfeitoCanonico): boolean {
  const d = REGISTRO_EFEITOS[ef.tipo];
  return d.periodico !== null || d.escudo || d.instantaneo === 'cura' || d.instantaneo === 'recurso' || d.instantaneo === 'dano' || d.ataqueBasico === 'dano' || d.rastro === 'dano' || d.fluxo === 'armadilha';
}

function escalar(ef: EfeitoCanonico, valor: number, duracao: number): EfeitoCanonico {
  return {
    ...ef,
    duracaoMs: ef.duracaoMs > 0 ? Math.round(ef.duracaoMs * duracao) : ef.duracaoMs,
    valor: valorEscala(ef) ? Math.round(ef.valor * valor) : ef.valor,
    interno: ef.interno ? escalar(ef.interno, valor, duracao) : null,
  };
}

/** O modificador combina com a habilidade? (Os que não combinam são ignorados.) */
export function modificadorCabe(h: Habilidade, mod: Modificador): boolean {
  const ofensiva = h.formulaDano !== null && (h.politicaAlvo === 'hostil' || h.politicaAlvo === 'celula');
  switch (mod) {
    case 'atravessar':
      return h.politicaImpacto === 'projetil';
    case 'encadear':
      return ofensiva && (h.politicaImpacto === 'contato' || h.politicaImpacto === 'projetil');
    case 'maior_e_mais_lenta':
      return h.politicaImpacto === 'area';
    case 'ecoar':
      return ofensiva;
  }
}

export interface OpcoesCompilacao {
  rank: number;
  caminhos: readonly string[];
  mods: readonly Modificador[];
}

export function compilarHabilidade(def: DefinicaoHabilidade, op: OpcoesCompilacao, fontes: FontesCompilacao, regras: RegrasHabilidades): Habilidade {
  const b = def.base;
  const rank = Math.max(1, Math.min(regras.rankMax, Math.floor(op.rank)));
  const r = regras.ranks[rank - 1] ?? regras.ranks.at(-1) ?? { nivelMinimo: 1, danoPct: 0, efeitoPct: 0 };
  let multDano = 1 + r.danoPct / 100;
  let multCura = 1 + r.danoPct / 100;
  const escalaEfeito = 1 + r.efeitoPct / 100;
  let custo = 1;
  let recarga = 1;
  let duracao = 1;
  let alcance = b.alcanceCelulas;
  let raio = b.raioArea;
  let elemento = b.elemento;
  const extras: EfeitoCanonico[] = [];
  const mods = new Set<Modificador>([...def.mods, ...op.mods]);
  const caminhosValidos: string[] = [];
  for (const id of op.caminhos) {
    const c = fontes.caminhos.get(id);
    if (!c) continue;
    caminhosValidos.push(id);
    multDano *= 1 + c.danoPct / 100;
    multCura *= 1 + c.danoPct / 100;
    custo *= 1 + c.custoPct / 100;
    recarga *= 1 + c.recargaPct / 100;
    duracao *= 1 + c.duracaoPct / 100;
    alcance += c.alcance;
    if (b.politicaImpacto === 'area') raio += c.raio;
    if (c.elemento) elemento = c.elemento;
    extras.push(...c.efeitos);
    for (const m of c.mods) mods.add(m);
  }
  const efeitos = [...b.efeitos, ...extras];
  // O elemento acrescenta o seu estado (o de um caminho elemental também).
  const estado = elemento ? fontes.elementos.get(elemento)?.estado : undefined;
  if (estado && b.formulaDano !== null && !efeitos.some((e) => e.tipo === estado.tipo)) efeitos.push({ ...estado });

  const h: Habilidade = {
    ...b,
    efeitos: efeitos.map((e) => escalar(e, escalaEfeito, duracao * escalaEfeito)),
    alcanceCelulas: Math.max(0, Math.min(30, alcance)),
    raioArea: Math.max(0, Math.min(5, raio)),
    custoRecurso: Math.max(0, Math.round(b.custoRecurso * custo)),
    custoVida: Math.max(0, Math.round(b.custoVida * custo)),
    recargaMs: Math.max(0, Math.round(b.recargaMs * recarga)),
    elemento,
    rank,
    perfura: false,
    saltos: null,
    escalaVisual: 1 + 0.15 * (rank - 1),
  };
  const aplicados = [...mods].filter((m) => modificadorCabe(h, m)).sort();
  for (const m of aplicados) {
    if (m === 'atravessar') h.perfura = true;
    if (m === 'encadear') h.saltos = { quantidade: 2, raio: 3, pct: 50 };
    if (m === 'maior_e_mais_lenta') {
      h.raioArea = Math.min(5, h.raioArea + 1);
      h.conjuracaoMs = Math.round(h.conjuracaoMs * 1.5);
      multDano *= 1.25;
    }
  }
  if (aplicados.includes('ecoar')) {
    const eco = Math.max(1, Math.round(mediaDe(h.formulaDano) * multDano * 0.5));
    h.efeitos.push(construirEfeito('efeito_atrasado', { duracaoMs: 600, interno: construirEfeito('dano_direto', { valor: eco }) }));
  }
  h.multDano = multDano;
  h.multCura = multCura;
  h.tags = etiquetasDe(h, b.tags);
  h.chave = formatarChave({ id: b.id, rank, caminhos: caminhosValidos, mods: aplicados });
  return h;
}

/** O contexto que a resolução precisa (conteúdo e regras de rank). */
export type ContextoHabilidades = Pick<ContextoSimulacao, 'conteudo' | 'balance'>;

/** A definição do catálogo ou, para os ids `g_`, a gerada pela semente. */
export function definicaoDe(ctx: ContextoHabilidades, id: string): DefinicaoHabilidade | null {
  return ctx.conteudo.definicoes.get(id) ?? gerarDefinicao(id, ctx);
}

const memoria = new WeakMap<object, WeakMap<object, Map<string, Habilidade | null>>>();

/** A habilidade compilada de uma chave (memoizada). Chave inválida ou id desconhecido: undefined. */
export function resolverHabilidade(ctx: ContextoHabilidades, chave: string): Habilidade | undefined {
  let porRegras = memoria.get(ctx.conteudo);
  if (!porRegras) memoria.set(ctx.conteudo, (porRegras = new WeakMap<object, Map<string, Habilidade | null>>()));
  let porChave = porRegras.get(ctx.balance.habilidades);
  if (!porChave) porRegras.set(ctx.balance.habilidades, (porChave = new Map<string, Habilidade | null>()));
  const pronto = porChave.get(chave);
  if (pronto !== undefined) return pronto ?? undefined;
  const partes = lerChave(chave);
  const def = partes ? definicaoDe(ctx, partes.id) : null;
  const h = partes && def ? compilarHabilidade(def, partes, ctx.conteudo, ctx.balance.habilidades) : null;
  porChave.set(chave, h);
  return h ?? undefined;
}
