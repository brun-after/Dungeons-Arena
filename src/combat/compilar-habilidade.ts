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

import { areaDaForma, ecoDaForma, perfuracaoDaForma, saltosDaForma } from './forma-do-estilo';
import type { ContextoSimulacao } from '../core/contexto';
import { Leitor, ehObjeto } from '../core/validar';
import { formatarChave, lerChave } from './chave-habilidade';
import { faixaDaFormula } from './dados';
import { ehElemento, type DefinicaoElemento, type Elemento } from './elementos';
import { gerarDefinicao } from './gerar-habilidade';
import { etiquetasDe, MODIFICADORES, type Catalogo, type DefinicaoHabilidade, type Habilidade, type Modificador, type Variante } from './habilidades';
import { normalizarEfeitos } from './normalizar-efeito';
import { construirEfeito, REGISTRO_EFEITOS, type EfeitoCanonico } from './registro-efeitos';
import { aplicarRuna, type RegrasRunas } from './runas';
import { aplicarFormasNovas, ehFormaNova, formaNovaCabe, type FormaId, type FormaNova, type RegrasEixos } from './eixos';
import { aplicarSecundario, type TabelaDePapeis } from './papeis';
import { aplicarLeituras } from './leituras';
import { aplicarFios, type FiosDaUltimate } from './fios-ultimate';
import type { Fusao } from './ultimates';

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
  /** 07/11/2026 (D-136): os mesmos ajustes de cargas, disparo e lança dos marcos. */
  cargas: number;
  disparoPct: number;
  lancaAlem: number;
  lancaLados: boolean;
}

export interface RegrasRank {
  nivelMinimo: number;
  danoPct: number;
  efeitoPct: number;
}

export interface RegrasHabilidades {
  pontosPorNivel: number;
  /** Ajuste de 15/10/2026: fração da velocidade de quem conjura uma habilidade `lenta`. */
  velocidadeConjurandoLenta: number;
  rankMax: number;
  ranksEvolucao: readonly number[];
  ranks: readonly RegrasRank[];
  /** Marco 18 (D-068): tempo de estudo por grau (ms), a redução pela Inteligência e quantas acelerações cabem. */
  estudo: { B: number; A: number; S: number; reducaoPorIntPct: number; reducaoMaxPct: number };
  /** Marco 39 (D-151): a parte elemental das runas e a função secundária delas (combat/runas.ts). */
  runas: RegrasRunas;
  /** Marco 40 (D-157): as formas dos nove eixos (combat/eixos.ts). */
  eixos: RegrasEixos;
}

/** O que a compilação consulta do conteúdo. */
export interface FontesCompilacao {
  caminhos: Catalogo<Caminho>;
  elementos: ReadonlyMap<Elemento, DefinicaoElemento>;
  /** Marco 40 (D-157): a função secundária do elemento pelo papel (papeis.json). */
  papeis?: TabelaDePapeis;
  /** Marco 40 (D-160): as fusões de eixos das ultimates. */
  fusoes?: ReadonlyMap<string, Fusao>;
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
      icone: l.icone(o, 'icone'),
      mods,
      danoPct: n('danoPct', -90, 300),
      custoPct: n('custoPct', -90, 300),
      recargaPct: n('recargaPct', -90, 300),
      duracaoPct: n('duracaoPct', -90, 300),
      alcance: n('alcance', -5, 5),
      raio: n('raio', -2, 2),
      elemento,
      efeitos: o.efeitos === undefined ? [] : normalizarEfeitos(l.lista(o, 'efeitos'), l),
      cargas: n('cargas', 0, 4),
      disparoPct: n('disparoPct', -75, 100),
      lancaAlem: n('lancaAlem', 0, 3),
      lancaLados: o.lancaLados === undefined ? false : l.booleano(o, 'lancaLados'),
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
  return d.periodico !== null || d.escudo || d.instantaneo === 'cura' || d.instantaneo === 'recurso' || d.instantaneo === 'dano' || d.instantaneo === 'campo_cura' || d.instantaneo === 'campo_veneno' || d.ataqueBasico === 'dano' || d.rastro === 'dano' || d.fluxo === 'armadilha';
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
  /** Marco 24: as variantes ligadas (Frenesi, fúria alta, elemento encarnado). */
  variantes?: readonly Variante[];
  /** Marco 39 (D-151): a runa do encaixe e a faixa do vínculo com ela. */
  runa?: { runa: 'fisico' | Elemento; faixa: number };
  /** Marco 39 (D-156): as formas dos estilos, cada uma na sua faixa. */
  formas?: readonly { mod: FormaId; faixa: number }[];
  /** Marco 40 (D-157): a faixa da sintonia com o elemento da skill comum. */
  sintonia?: number;
  /** Marco 40 (D-159): as leituras de estilo ativas (skills de classe). */
  leituras?: readonly { estilo: string; faixa: number }[];
  /** Marco 40 (D-160): os fios da ultimate (os elementos do par e a fusão dos estilos). */
  fios?: FiosDaUltimate;
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
  // 07/11/2026 (D-136): cargas, disparo do círculo no ar e lança dos mortos somam por marco e caminho.
  let cargas = b.cargas ?? 1;
  let disparo = 1;
  let lancaAlem = b.lanca?.alem ?? 0;
  let lancaLados = b.lanca?.lados ?? false;
  const somar = (x: { cargas: number; disparoPct: number; lancaAlem: number; lancaLados: boolean }) => {
    cargas += x.cargas;
    disparo *= 1 + x.disparoPct / 100;
    lancaAlem += x.lancaAlem;
    lancaLados ||= x.lancaLados;
  };
  // Marco 18 (D-068): os marcos dos níveis alcançados (o toque do 2, a assinatura do 4) valem como caminhos fixos.
  for (const [nivel, m] of Object.entries(def.marcos)) {
    if (Number(nivel) > rank) continue;
    multDano *= 1 + m.danoPct / 100;
    multCura *= 1 + m.danoPct / 100;
    custo *= 1 + m.custoPct / 100;
    recarga *= 1 + m.recargaPct / 100;
    duracao *= 1 + m.duracaoPct / 100;
    alcance += m.alcance;
    if (b.politicaImpacto === 'area') raio += m.raio;
    extras.push(...m.efeitos);
    for (const x of m.mods) mods.add(x);
    somar(m);
  }
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
    somar(c);
  }
  // Marco 24 (24/10/2026, D-094): as variantes ligadas valem como marcos, e ainda mudam conjuração, elemento e trocam
  // efeitos do mesmo tipo. Só entram na chave as que a definição tem.
  let conjuracao = 1;
  let trocados: EfeitoCanonico[] = [];
  const variantes = (op.variantes ?? []).filter((v) => def.variantes[v] !== undefined).sort();
  for (const v of variantes) {
    const m = def.variantes[v];
    if (!m) continue;
    multDano *= 1 + m.danoPct / 100;
    multCura *= 1 + m.danoPct / 100;
    custo *= 1 + m.custoPct / 100;
    recarga *= 1 + m.recargaPct / 100;
    duracao *= 1 + m.duracaoPct / 100;
    conjuracao *= 1 + m.conjuracaoPct / 100;
    alcance += m.alcance;
    if (b.politicaImpacto === 'area') raio += m.raio;
    if (m.elemento) elemento = m.elemento;
    extras.push(...m.efeitos);
    trocados = [...trocados.filter((t) => !m.trocar.some((x) => x.tipo === t.tipo)), ...m.trocar];
    for (const x of m.mods) mods.add(x);
  }
  const efeitos = [...b.efeitos.filter((e) => !trocados.some((t) => t.tipo === e.tipo)), ...trocados, ...extras];
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
    conjuracaoMs: Math.max(0, Math.round(b.conjuracaoMs * conjuracao)),
    elemento,
    rank,
    perfura: false,
    saltos: null,
    escalaVisual: 1 + 0.15 * (rank - 1),
  };
  if (cargas > 1) h.cargas = Math.min(6, cargas);
  else delete h.cargas;
  if (b.disparoMs) h.disparoMs = Math.max(0, Math.round(b.disparoMs * disparo));
  if (b.lanca) h.lanca = { alem: Math.min(4, lancaAlem), lados: lancaLados, ...(b.lanca.junto ? { junto: true } : {}) };
  // Marco 19 (17/10/2026): a distância real do passo acompanha alcance de rank e caminho.
  for (const efeito of h.efeitos) if (efeito.tipo === 'passo_sombrio') efeito.valor = h.alcanceCelulas;
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
  // Marco 39 (12/11/2026, D-156): as formas dos estilos, na faixa de cada uma (o que o equipamento já dá vale inteiro).
  // Marco 40 (D-157): as formas dos eixos novos entram se a skill tem aquilo que o eixo empurra.
  const formas = (op.formas ?? []).filter((f) => f.faixa > 0 && (ehFormaNova(f.mod) ? formaNovaCabe(h, f.mod) : !aplicados.includes(f.mod) && modificadorCabe(h, f.mod)));
  let ecoFracao = aplicados.includes('ecoar') ? 0.5 : 0;
  for (const f of formas) {
    if (f.mod === 'atravessar') h.perfuraAlvos = perfuracaoDaForma(f.faixa);
    if (f.mod === 'encadear') h.saltos = saltosDaForma(f.faixa);
    if (f.mod === 'ecoar') ecoFracao = ecoDaForma(f.faixa);
    if (f.mod === 'maior_e_mais_lenta') {
      const a = areaDaForma(f.faixa);
      h.raioArea = Math.min(5, h.raioArea + a.raioExtra);
      h.conjuracaoMs = Math.round(h.conjuracaoMs * a.conjuracaoMult);
      multDano *= a.danoMult;
    }
  }
  if (formas.length > 0) h.formas = formas.map((f) => ({ mod: f.mod, faixa: f.faixa }));
  const novas = formas.filter((f): f is { mod: FormaNova; faixa: number } => ehFormaNova(f.mod));
  if (novas.length > 0) {
    const media = h.formulaDano !== null ? mediaDe(h.formulaDano) * multDano : mediaDe(h.formulaCura) * multCura;
    const comNovas = aplicarFormasNovas(h, novas, media, regras.eixos);
    h.efeitos = comNovas.efeitos;
    if (comNovas.controleVizinho) h.controleVizinho = comNovas.controleVizinho;
  }
  if (ecoFracao > 0) {
    const eco = Math.max(1, Math.round(mediaDe(h.formulaDano) * multDano * ecoFracao));
    h.efeitos.push(construirEfeito('efeito_atrasado', { duracaoMs: 600, interno: construirEfeito('dano_direto', { valor: eco }) }));
  }
  h.multDano = multDano;
  h.multCura = multCura;
  h.tags = etiquetasDe(h, b.tags);
  // Marco 40 (12/11/2026, D-159): as leituras de estilo da skill de classe, cada uma na faixa do seu estilo.
  const leituras = def.leituras ? (op.leituras ?? []).filter((l) => l.faixa > 0 && def.leituras?.[l.estilo]) : [];
  if (leituras.length > 0) h.efeitos = aplicarLeituras(h, def.leituras, leituras).efeitos;
  const fios = op.fios && b.tags.includes('ultimate') ? op.fios : undefined;
  // Na chave só entram os modificadores de fora (equipamento): os da definição e dos caminhos já estão implícitos.
  h.chave = formatarChave({ id: b.id, rank, caminhos: caminhosValidos, mods: op.mods.filter((m) => aplicados.includes(m)), variantes, ...(formas.length > 0 && { formas }), ...(leituras.length > 0 && { leituras }), ...(fios && { fios }), ...(op.sintonia !== undefined && !op.runa && { sintonia: op.sintonia }), ...(op.runa && { runa: op.runa }) });
  // Marco 40 (12/11/2026, D-157): na skill comum, a função secundária do papel no elemento dela, na faixa da sintonia, e
  // o estado do elemento dura de `duracaoMinPct` a 100% por ela (como a runa).
  if (op.sintonia !== undefined && !op.runa && h.papel) {
    const g = Math.max(0, Math.min(10, op.sintonia)) / 10;
    const k = (regras.runas.duracaoMinPct + (100 - regras.runas.duracaoMinPct) * g) / 100;
    const tipoEstado = h.elemento ? fontes.elementos.get(h.elemento)?.estado.tipo : undefined;
    const comEstado = tipoEstado ? { ...h, efeitos: h.efeitos.map((e) => (e.tipo === tipoEstado ? { ...e, duracaoMs: Math.round(e.duracaoMs * k) } : e)) } : h;
    return aplicarSecundario(comEstado, fontes.papeis, h.elemento ?? 'fisico', op.sintonia);
  }
  // Marco 39 (12/11/2026, D-151): a runa troca o elemento e põe a parte elemental (por último, sobre tudo o que veio antes).
  const comRuna = op.runa ? aplicarRuna(h, op.runa.runa, op.runa.faixa, fontes.elementos, regras.runas, fontes.papeis) : h;
  // Marco 40 (13/11/2026, D-160): na ultimate, os fios de elemento, o par de elementos e a fusão dos estilos.
  return fios ? aplicarFios(comRuna, fios, fontes, regras.runas) : comRuna;
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
