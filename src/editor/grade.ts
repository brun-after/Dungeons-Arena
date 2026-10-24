// Núcleo do editor de fases (§3.10). Marco 6C (13/10/2026). Puro e testado: a fase editável é a
// mesma `Fase` do jogo (as células vivem num Uint8Array compartilhado com o renderizador), mais o
// spawn e os inimigos. Cada ferramenta devolve as alterações feitas, para o histórico desfazer.
// Marco 8A (14/10/2026): orbes (vida, mana e de efeito), com a lista de efeitos tirada do registro.
// Marco 11A (16/10/2026, D-066): a fase editável cobre tudo o que o `FaseJson` tem — baú, loja, loot, armadilha,
// fonte de som, inimigo com nível, porta de saída com tranca (o chefe marcado pela célula), portas internas,
// matiz, tileset e peças à mão — e a ida e volta pelo JSON não perde nada.

import { construirEfeito, ehTipoEfeito, REGISTRO_EFEITOS, type EfeitoCanonico } from '../combat/registro-efeitos';
import type { AreaAmbiente } from '../world/ambiente-tipos';
import type { Celula } from '../core/comandos';
import { serializarCanonico } from '../core/digest';
import {
  carregarFase,
  caractereDeTipo,
  codigoDeTipo,
  tipoEm,
  type Fase,
  type FaseJson,
  type InimigoPosicionado,
  type ObjetoPosicionadoJson,
  type PortaInterna,
  type PortaSaida,
  type TipoCelula,
} from '../world/fase';
import { TAMANHO_MAX, TAMANHO_MIN } from '../world/validacao-fase';

/** Objeto da fase como no JSON oficial, mas com `x` e `y` em células (o JSON normaliza para 0–1). */
export type ObjetoEditavel = ObjetoPosicionadoJson;
type SemPosicao<T> = T extends unknown ? Omit<T, 'x' | 'y'> : never;
/** O objeto que uma ferramenta coloca (a posição vem do toque). */
export type ModeloDeObjeto = SemPosicao<ObjetoPosicionadoJson>;

/** Porta de saída no editor: o chefe é marcado pela célula (o índice muda quando a lista de inimigos muda). */
export interface SaidaEditavel {
  x: number;
  y: number;
  tranca: PortaSaida['tranca'];
  chave?: string;
  chefe?: Celula;
}

export interface FaseEditavel {
  id: string;
  nome: string;
  largura: number;
  altura: number;
  celulas: Uint8Array;
  spawn: Celula | null;
  inimigos: InimigoPosicionado[];
  objetos: ObjetoEditavel[];
  portaSaida: SaidaEditavel | null;
  portasInternas: PortaInterna[];
  matizGraus: number;
  ambientes?: AreaAmbiente[];
  eventos?: string[];
  /** Marco 23 (D-092): o tema vai e volta pelo editor. */
  tema?: string;
  /** O atlas desta fase; null herda (§2.16). */
  tilesetId: string | null;
  /** Peças à mão por índice de célula (`chave@t`). */
  pecas: Record<string, string>;
}

/** Valores dos orbes de vida e mana colocados no editor (os mesmos das fases oficiais). */
const VALOR_ORBE: Readonly<Record<'orbe_hp' | 'orbe_recurso', number>> = { orbe_hp: 30, orbe_recurso: 50 };

/**
 * Chave de um orbe na interface: `orbe_hp`, `orbe_recurso` ou `efeito:<tipo>`.
 * A lista de efeitos vem do registro (§2.8): um tipo novo elegível aparece no editor sozinho.
 */
export function chavesDeOrbe(): string[] {
  return ['orbe_hp', 'orbe_recurso', ...Object.values(REGISTRO_EFEITOS).filter((d) => d.elegivelParaOrbe).map((d) => `efeito:${d.id}`)];
}

/** Chave de exibição de um objeto: o tipo, ou `efeito:<tipo>` no orbe de efeito. */
export function chaveDoObjeto(o: ModeloDeObjeto): string {
  return o.tipo === 'orbe_efeito' && o.efeito ? `efeito:${o.efeito.tipo}` : o.tipo;
}

/** O orbe de uma chave da lista (`orbe_hp`, `orbe_recurso`, `efeito:<tipo>`). */
export function orbeDaChave(chave: string): ModeloDeObjeto | null {
  if (chave === 'orbe_hp' || chave === 'orbe_recurso') return { tipo: chave, valor: VALOR_ORBE[chave], modo: 'pct' };
  const tipo = chave.startsWith('efeito:') ? chave.slice('efeito:'.length) : '';
  return ehTipoEfeito(tipo) ? { tipo: 'orbe_efeito', valor: 1, modo: 'abs', efeito: construirEfeito(tipo) } : null;
}

const clonarEfeito = (e: EfeitoCanonico): EfeitoCanonico => ({ ...e });

/** Clone explícito de um objeto (listas e efeito copiados). */
export function clonarObjeto<T extends ModeloDeObjeto>(o: T): T {
  const c: ModeloDeObjeto = { ...o };
  if (c.tipo === 'bau') c.loot = [...c.loot];
  if (c.tipo === 'loja') c.estoque = [...c.estoque];
  if ((c.tipo === 'orbe_efeito' || c.tipo === 'orbe_hp' || c.tipo === 'orbe_recurso' || c.tipo === 'armadilha') && c.efeito) c.efeito = clonarEfeito(c.efeito);
  return c as T;
}

const clonarInimigo = (i: InimigoPosicionado): InimigoPosicionado => ({ ...i, ...(i.habilidades && { habilidades: [...i.habilidades] }), ...(i.afinidade && { afinidade: { ...i.afinidade } }) });

/** Clone explícito da fase inteira (retrato do histórico, gravação). */
export function clonarFaseEditavel(f: FaseEditavel): FaseEditavel {
  return {
    ...f,
    celulas: new Uint8Array(f.celulas),
    ...(f.ambientes && { ambientes: f.ambientes.map((a) => ({ ...a })) }),
    ...(f.eventos && { eventos: [...f.eventos] }),
    ...(f.tema && { tema: f.tema }),
    spawn: f.spawn ? { ...f.spawn } : null,
    inimigos: f.inimigos.map(clonarInimigo),
    objetos: f.objetos.map((o) => clonarObjeto(o)),
    portaSaida: f.portaSaida ? { ...f.portaSaida, ...(f.portaSaida.chefe && { chefe: { ...f.portaSaida.chefe } }) } : null,
    portasInternas: f.portasInternas.map((p) => ({ ...p, a: { ...p.a }, b: { ...p.b } })),
    pecas: { ...f.pecas },
  };
}

export type Ferramenta =
  | { t: 'terreno'; tipo: TipoCelula }
  | { t: 'spawn' }
  | { t: 'inimigo'; preset: string; nivel?: number }
  | { t: 'objeto'; modelo: ModeloDeObjeto }
  | { t: 'peca'; peca: string | null }
  | { t: 'remover' };

/** Tudo o que existe numa célula: terreno, spawn, inimigo, objeto e a peça à mão. */
export interface ConteudoCelula {
  tipo: TipoCelula;
  spawn: boolean;
  inimigo: InimigoPosicionado | null;
  objeto: ModeloDeObjeto | null;
  peca: string | null;
}

export interface Alteracao {
  x: number;
  y: number;
  antes: ConteudoCelula;
  depois: ConteudoCelula;
}

export function novaFaseEditavel(id: string, nome: string, largura: number, altura: number): FaseEditavel {
  const l = Math.max(TAMANHO_MIN, Math.min(TAMANHO_MAX, Math.round(largura)));
  const a = Math.max(TAMANHO_MIN, Math.min(TAMANHO_MAX, Math.round(altura)));
  const celulas = new Uint8Array(l * a);
  for (let y = 0; y < a; y++) {
    for (let x = 0; x < l; x++) {
      const borda = x === 0 || y === 0 || x === l - 1 || y === a - 1;
      celulas[y * l + x] = codigoDeTipo(borda ? 'parede' : 'piso');
    }
  }
  return { id, nome, largura: l, altura: a, celulas, spawn: { x: 1, y: 1 }, inimigos: [], objetos: [], portaSaida: null, portasInternas: [], matizGraus: 0, tilesetId: null, pecas: {} };
}

/** A mesma `Fase` do jogo, compartilhando as células e as peças (o renderizador vê cada pincelada). */
export function comoFase(f: FaseEditavel): Fase {
  return {
    id: f.id,
    nome: f.nome,
    ordem: 1,
    largura: f.largura,
    altura: f.altura,
    celulas: f.celulas,
    tipo: 'campanha',
    spawns: f.spawn ? [f.spawn] : [],
    inimigos: f.inimigos,
    objetos: [],
    portaSaida: null,
    portasInternas: f.portasInternas,
    matizGraus: f.matizGraus,
    tilesetId: f.tilesetId,
    pecas: f.pecas,
    eventos: [...(f.eventos ?? [])],
    tema: f.tema ?? null,
    ambientes: f.ambientes ?? [],
  };
}

const naCelula = (c: Celula, x: number, y: number) => c.x === x && c.y === y;

/** A porta de saída do JSON: o chefe vira o índice do inimigo naquela célula (fora da lista se ele sumiu). */
function saidaParaJson(f: FaseEditavel): PortaSaida | undefined {
  const s = f.portaSaida;
  if (!s) return undefined;
  if (s.tranca === 'chave') return { x: s.x, y: s.y, tranca: 'chave', chave: s.chave ?? '' };
  if (s.tranca === 'boss') {
    const chefe = s.chefe;
    const indice = chefe ? f.inimigos.findIndex((i) => naCelula(i, chefe.x, chefe.y)) : -1;
    return { x: s.x, y: s.y, tranca: 'boss', bossIndice: indice >= 0 ? indice : f.inimigos.length };
  }
  return { x: s.x, y: s.y, tranca: 'livre' };
}

export function paraFaseJson(f: FaseEditavel, ordem = 1): FaseJson {
  const fase = comoFase(f);
  const mapa: string[] = [];
  for (let y = 0; y < f.altura; y++) {
    let linha = '';
    for (let x = 0; x < f.largura; x++) linha += caractereDeTipo(tipoEm(fase, x, y));
    mapa.push(linha);
  }
  const saida = saidaParaJson(f);
  return {
    id: f.id,
    nome: f.nome,
    ordem,
    tipo: 'campanha',
    mapa,
    spawns: f.spawn ? [{ x: f.spawn.x, y: f.spawn.y }] : [],
    inimigos: f.inimigos.map(clonarInimigo),
    // Coordenadas normalizadas no centro da célula: voltam exatamente para a mesma célula.
    objetos: f.objetos.map((o) => ({ ...clonarObjeto(o), x: (o.x + 0.5) / f.largura, y: (o.y + 0.5) / f.altura })),
    ...(saida && { portaSaida: saida }),
    ...(f.ambientes?.length && { ambientes: f.ambientes.map((a) => ({ ...a })) }),
    ...(f.eventos?.length && { eventos: [...f.eventos] }),
    ...(f.tema && { tema: f.tema }),
    ...(f.portasInternas.length > 0 && { portasInternas: f.portasInternas.map((p) => ({ ...p, a: { ...p.a }, b: { ...p.b } })) }),
    ...(f.matizGraus !== 0 && { matizGraus: f.matizGraus }),
    ...(f.tilesetId && { tileset: { atlasId: f.tilesetId } }),
    ...(Object.keys(f.pecas).length > 0 && { pecas: { ...f.pecas } }),
  };
}

/** De uma fase já validada (importação, ou a gravada no banco): nada se perde. */
export function deFaseJson(json: FaseJson): FaseEditavel {
  const fase = carregarFase(json);
  const s = json.portaSaida;
  const chefe = s?.tranca === 'boss' && s.bossIndice !== undefined ? fase.inimigos[s.bossIndice] : undefined;
  return {
    id: json.id,
    nome: json.nome,
    largura: fase.largura,
    altura: fase.altura,
    celulas: new Uint8Array(fase.celulas),
    spawn: fase.spawns[0] ? { ...fase.spawns[0] } : null,
    inimigos: fase.inimigos.map(clonarInimigo),
    objetos: (json.objetos ?? []).map((o, i) => {
      const c = fase.objetos[i];
      return { ...clonarObjeto(o), x: c?.x ?? 0, y: c?.y ?? 0 };
    }),
    portaSaida: s
      ? { x: s.x, y: s.y, tranca: s.tranca, ...(s.chave !== undefined && { chave: s.chave }), ...(chefe && { chefe: { x: chefe.x, y: chefe.y } }) }
      : null,
    portasInternas: fase.portasInternas.map((p) => ({ ...p, a: { ...p.a }, b: { ...p.b } })),
    matizGraus: fase.matizGraus,
    tilesetId: fase.tilesetId,
    pecas: { ...json.pecas },
    ambientes: (json.ambientes ?? []).map((a) => ({ ...a })),
    eventos: [...(json.eventos ?? [])],
    ...(json.tema && { tema: json.tema }),
  };
}

export function dentro(f: FaseEditavel, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < f.largura && y < f.altura;
}

export function lerCelula(f: FaseEditavel, x: number, y: number): ConteudoCelula {
  const inimigo = f.inimigos.find((i) => naCelula(i, x, y));
  const objeto = f.objetos.find((o) => naCelula(o, x, y));
  return {
    tipo: tipoEm(comoFase(f), x, y),
    spawn: !!f.spawn && naCelula(f.spawn, x, y),
    inimigo: inimigo ? clonarInimigo(inimigo) : null,
    objeto: objeto ? semPosicao(objeto) : null,
    peca: f.pecas[String(y * f.largura + x)] ?? null,
  };
}

function semPosicao(o: ObjetoEditavel): ModeloDeObjeto {
  return Object.fromEntries(Object.entries(clonarObjeto(o)).filter(([k]) => k !== 'x' && k !== 'y')) as ModeloDeObjeto;
}

/** Escreve o conteúdo de uma célula (usado também para desfazer e refazer). */
export function escreverCelula(f: FaseEditavel, x: number, y: number, c: ConteudoCelula): void {
  f.celulas[y * f.largura + x] = codigoDeTipo(c.tipo);
  if (c.spawn) f.spawn = { x, y };
  else if (f.spawn && naCelula(f.spawn, x, y)) f.spawn = null;
  f.inimigos = f.inimigos.filter((i) => !naCelula(i, x, y));
  if (c.inimigo) f.inimigos.push({ ...clonarInimigo(c.inimigo), x, y });
  f.objetos = f.objetos.filter((o) => !naCelula(o, x, y));
  if (c.objeto) f.objetos.push({ ...clonarObjeto(c.objeto), x, y });
  const indice = String(y * f.largura + x);
  if (c.peca) f.pecas[indice] = c.peca;
  else if (indice in f.pecas) f.pecas = Object.fromEntries(Object.entries(f.pecas).filter(([k]) => k !== indice));
}

const iguais = (a: ConteudoCelula, b: ConteudoCelula) => serializarCanonico(a) === serializarCanonico(b);

/**
 * Aplica a ferramenta numa célula. Regras: terreno sólido (parede, vazio) tira spawn, inimigo e objeto de
 * cima; spawn, inimigo e objeto só ficam em célula passável (vira piso se preciso); o spawn é único, então
 * movê-lo altera duas células.
 */
export function aplicarFerramenta(f: FaseEditavel, ferramenta: Ferramenta, x: number, y: number): Alteracao[] {
  if (!dentro(f, x, y)) return [];
  const alteracoes: Alteracao[] = [];
  const mudar = (cx: number, cy: number, depois: ConteudoCelula) => {
    const antes = lerCelula(f, cx, cy);
    if (iguais(antes, depois)) return;
    escreverCelula(f, cx, cy, depois);
    alteracoes.push({ x: cx, y: cy, antes, depois });
  };
  const atual = lerCelula(f, x, y);
  const piso = (c: ConteudoCelula): TipoCelula => (c.tipo === 'piso' || c.tipo === 'saida' ? c.tipo : 'piso');
  switch (ferramenta.t) {
    case 'terreno': {
      const solido = ferramenta.tipo === 'parede' || ferramenta.tipo === 'vazio';
      mudar(x, y, solido ? { ...atual, tipo: ferramenta.tipo, spawn: false, inimigo: null, objeto: null } : { ...atual, tipo: ferramenta.tipo });
      break;
    }
    case 'spawn': {
      const anterior = f.spawn;
      if (anterior && !naCelula(anterior, x, y)) mudar(anterior.x, anterior.y, { ...lerCelula(f, anterior.x, anterior.y), spawn: false });
      mudar(x, y, { ...atual, tipo: piso(atual), spawn: true, inimigo: null });
      break;
    }
    case 'inimigo':
      mudar(x, y, { ...atual, tipo: piso(atual), spawn: false, inimigo: { preset: ferramenta.preset, x, y, ...(ferramenta.nivel && ferramenta.nivel > 1 && { nivel: ferramenta.nivel }) } });
      break;
    case 'objeto':
      mudar(x, y, { ...atual, tipo: piso(atual), objeto: clonarObjeto(ferramenta.modelo) });
      break;
    case 'peca':
      mudar(x, y, { ...atual, peca: ferramenta.peca });
      break;
    case 'remover':
      mudar(x, y, { ...atual, spawn: false, inimigo: null, objeto: null, peca: null });
      break;
  }
  return alteracoes;
}

/** Células de uma linha entre duas células (Bresenham), para o traço não pular células. */
export function linhaDeCelulas(a: Celula, b: Celula): Celula[] {
  const celulas: Celula[] = [];
  let { x, y } = a;
  const dx = Math.abs(b.x - x);
  const dy = -Math.abs(b.y - y);
  const sx = x < b.x ? 1 : -1;
  const sy = y < b.y ? 1 : -1;
  let erro = dx + dy;
  for (;;) {
    celulas.push({ x, y });
    if (x === b.x && y === b.y) break;
    const e2 = 2 * erro;
    if (e2 >= dy) {
      erro += dy;
      x += sx;
    }
    if (e2 <= dx) {
      erro += dx;
      y += sy;
    }
  }
  return celulas;
}
