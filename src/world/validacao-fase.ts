// Validação de fase (§3.9, §3.10): a mesma função serve ao conteúdo oficial (teste no CI)
// e, no futuro, ao editor e à importação. Conteúdo inválido é recusado com o erro na célula,
// nunca quebra o jogo. Marco 2: schema mínimo, spawn passável e spawn alcançando a saída.
// Marco 6C (13/10/2026): avisos (não bloqueiam): fase sem inimigos e inimigo inalcançável.
// Marco 9A (14/10/2026): baú, loja e loot, com os itens conferidos no catálogo quando informado.
// Marco 10A-1 (14/10/2026): porta de saída e portas internas (validacao-portas.ts).

import { normalizarEfeito } from '../combat/normalizar-efeito';
import { REGISTRO_EFEITOS } from '../combat/registro-efeitos';
import { Leitor } from '../core/validar';
import { alcancaveis } from './navegacao';
import { lerPortasInternas, lerPortaSaida, validarPortasNaFase } from './validacao-portas';
import {
  CARACTERE_CELULA,
  carregarFase,
  passavel,
  type FaseJson,
  type InimigoPosicionado,
  type ObjetoPosicionadoJson,
  type SpawnJson,
} from './fase';

export interface ErroFase {
  mensagem: string;
  x?: number;
  y?: number;
}

/** Erros bloqueiam salvar, testar e importar; avisos só alertam (§3.10). */
export type ResultadoValidacao = { ok: true; fase: FaseJson; avisos: ErroFase[] } | { ok: false; erros: ErroFase[]; avisos: ErroFase[] };

export const TAMANHO_MIN = 8;
export const TAMANHO_MAX = 120;
const TIPOS = ['campanha', 'arena', 'ambas'] as const;

function ehObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function ehInteiro(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v);
}

/** O que a validação precisa saber de um item: se existe e de que tipo é (a chave do baú). */
export type ItensConhecidos = ReadonlyMap<string, { readonly tipo: string }>;

/**
 * `presetsConhecidos`: quando informado, cada inimigo posicionado precisa referenciar um preset
 * existente no catálogo (o editor e o CI passam o catálogo oficial). `itensConhecidos`: idem para
 * os itens de baú, loja e loot; a chave do baú precisa ser um item do tipo `chave`.
 */
export function validarFase(entrada: unknown, presetsConhecidos?: ReadonlySet<string>, itensConhecidos?: ItensConhecidos): ResultadoValidacao {
  const erros: ErroFase[] = [];
  const avisos: ErroFase[] = [];
  if (!ehObjeto(entrada)) return { ok: false, erros: [{ mensagem: 'a fase precisa ser um objeto' }], avisos };

  const { id, nome, ordem, tipo, mapa, spawns, inimigos, objetos, portaSaida, portasInternas } = entrada;
  if (typeof id !== 'string' || id.trim() === '') erros.push({ mensagem: 'id ausente' });
  if (typeof nome !== 'string' || nome.trim() === '') erros.push({ mensagem: 'nome ausente' });
  if (!ehInteiro(ordem)) erros.push({ mensagem: 'ordem precisa ser inteiro' });
  if (typeof tipo !== 'string' || !(TIPOS as readonly string[]).includes(tipo)) {
    erros.push({ mensagem: `tipo precisa ser ${TIPOS.join(', ')}` });
  }

  const linhas = validarMapa(mapa, erros);
  const listaSpawns = validarSpawns(spawns, erros);
  const listaInimigos = validarInimigos(inimigos, erros, presetsConhecidos);
  const listaObjetos = validarObjetos(objetos, erros, itensConhecidos);
  const saida = lerPortaSaida(portaSaida, erros, itensConhecidos);
  const internas = lerPortasInternas(portasInternas, erros);
  if (erros.length > 0 || !linhas || !listaSpawns) return { ok: false, erros, avisos };

  const json: FaseJson = {
    id: id as string,
    nome: nome as string,
    ordem: ordem as number,
    tipo: tipo as FaseJson['tipo'],
    mapa: linhas,
    spawns: listaSpawns,
    inimigos: listaInimigos,
    objetos: listaObjetos,
    ...(saida && { portaSaida: saida }),
    ...(internas && { portasInternas: internas }),
  };
  validarJogabilidade(json, erros, avisos);
  return erros.length > 0 ? { ok: false, erros, avisos } : { ok: true, fase: json, avisos };
}

const TIPOS_OBJETO = ['orbe_hp', 'orbe_recurso', 'orbe_efeito'] as const;
const MAX_ITENS_OBJETO = 20;
const MAX_OURO_OBJETO = 100_000;

const normalizado = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1;

/** Lista de ids de item (conteúdo do baú, estoque da loja), conferidos no catálogo se houver. */
function listaDeItens(v: unknown, campo: string, erros: ErroFase[], itens: ItensConhecidos | undefined): string[] | null {
  if (!Array.isArray(v) || v.length > MAX_ITENS_OBJETO || !v.every((i): i is string => typeof i === 'string' && i !== '')) {
    erros.push({ mensagem: `${campo} precisa ser uma lista de até ${MAX_ITENS_OBJETO} ids de item` });
    return null;
  }
  for (const id of v) if (itens && !itens.has(id)) erros.push({ mensagem: `${campo}: item desconhecido "${id}"` });
  return [...v];
}

/** Armadilha de fase (marco 9A-2): dano fixo, efeito opcional de um componente, única ou com rearme. */
function armadilhaDeFase(o: Record<string, unknown>, x: number, y: number, erros: ErroFase[]): ObjetoPosicionadoJson | 'erro' {
  const valor = o.valor;
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor < 0 || valor > 1000 || (o.modo !== 'unica' && o.modo !== 'rearme')) {
    erros.push({ mensagem: 'armadilha precisa de valor entre 0 e 1000 e modo unica|rearme' });
    return 'erro';
  }
  let efeito;
  if (o.efeito !== undefined) {
    const l = new Leitor('armadilha');
    const efeitos = normalizarEfeito(o.efeito, l);
    efeito = efeitos[0];
    if (l.erros.length > 0 || efeitos.length !== 1 || !efeito) {
      erros.push({ mensagem: `armadilha: efeito precisa ter um componente válido${l.erros[0] ? ` (${l.erros[0]})` : ''}` });
      return 'erro';
    }
  }
  if (o.modo === 'unica') return { tipo: 'armadilha', x, y, valor, modo: 'unica', ...(efeito && { efeito }) };
  const rearme = o.rearmeMs;
  if (!ehInteiro(rearme) || rearme < 100 || rearme > 600_000) {
    erros.push({ mensagem: 'armadilha com rearme precisa de rearmeMs inteiro entre 100 e 600000' });
    return 'erro';
  }
  return { tipo: 'armadilha', x, y, valor, modo: 'rearme', rearmeMs: rearme, ...(efeito && { efeito }) };
}

/** Baú, loja, loot (marco 9A) e armadilha (9A-2). Devolve null quando o objeto não é de um desses tipos. */
function objetoDeEconomia(o: Record<string, unknown>, erros: ErroFase[], itens: ItensConhecidos | undefined): ObjetoPosicionadoJson | null | 'erro' {
  if (o.tipo !== 'bau' && o.tipo !== 'loja' && o.tipo !== 'loot' && o.tipo !== 'armadilha') return null;
  if (!normalizado(o.x) || !normalizado(o.y)) {
    erros.push({ mensagem: `${o.tipo}: x e y precisam ficar entre 0 e 1` });
    return 'erro';
  }
  const { x, y } = o;
  if (o.tipo === 'armadilha') return armadilhaDeFase(o, x, y, erros);
  if (o.tipo === 'loja') {
    const estoque = listaDeItens(o.estoque, 'estoque da loja', erros, itens);
    if (!estoque || estoque.length === 0) {
      if (estoque) erros.push({ mensagem: 'a loja precisa de ao menos um item no estoque' });
      return 'erro';
    }
    return { tipo: 'loja', x, y, estoque };
  }
  if (o.tipo === 'loot') {
    const qtd = o.quantidade;
    if (typeof o.itemId !== 'string' || !ehInteiro(qtd) || qtd < 1 || qtd > 99) {
      erros.push({ mensagem: 'loot precisa de itemId e quantidade inteira entre 1 e 99' });
      return 'erro';
    }
    if (itens && !itens.has(o.itemId)) erros.push({ mensagem: `loot: item desconhecido "${o.itemId}"` });
    return { tipo: 'loot', x, y, itemId: o.itemId, quantidade: qtd };
  }
  const loot = listaDeItens(o.loot, 'loot do baú', erros, itens);
  const ouro = o.ouro ?? 0;
  if (!ehInteiro(ouro) || ouro < 0 || ouro > MAX_OURO_OBJETO) {
    erros.push({ mensagem: 'ouro do baú precisa ser inteiro entre 0 e 100000' });
    return 'erro';
  }
  if (!loot) return 'erro';
  if (o.chave === undefined) return { tipo: 'bau', x, y, loot, ouro };
  if (typeof o.chave !== 'string' || o.chave === '') {
    erros.push({ mensagem: 'chave do baú precisa ser um id de item' });
    return 'erro';
  }
  const chave = itens?.get(o.chave);
  if (itens && chave?.tipo !== 'chave') erros.push({ mensagem: `chave do baú precisa ser um item do tipo chave ("${o.chave}")` });
  return { tipo: 'bau', x, y, loot, ouro, chave: o.chave };
}

function validarObjetos(objetos: unknown, erros: ErroFase[], itens: ItensConhecidos | undefined): ObjetoPosicionadoJson[] {
  if (objetos === undefined) return [];
  if (!Array.isArray(objetos)) {
    erros.push({ mensagem: 'objetos precisa ser uma lista' });
    return [];
  }
  const lista: ObjetoPosicionadoJson[] = [];
  for (const o of objetos) {
    const economia = ehObjeto(o) ? objetoDeEconomia(o, erros, itens) : null;
    if (economia === 'erro') continue;
    if (economia) {
      lista.push(economia);
      continue;
    }
    // Orbe de efeito (marco 8A): o efeito é normalizado pelo registro e precisa ser elegível ao orbe.
    if (ehObjeto(o) && o.tipo === 'orbe_efeito' && normalizado(o.x) && normalizado(o.y)) {
      const l = new Leitor('orbe de efeito');
      const efeitos = normalizarEfeito(o.efeito, l);
      const efeito = efeitos[0];
      if (l.erros.length > 0 || efeitos.length !== 1 || !efeito || !REGISTRO_EFEITOS[efeito.tipo].elegivelParaOrbe) {
        erros.push({ mensagem: `orbe de efeito precisa de um efeito elegível ao orbe${l.erros[0] ? ` (${l.erros[0]})` : ''}` });
        continue;
      }
      lista.push({ tipo: 'orbe_efeito', x: o.x, y: o.y, valor: 1, modo: 'abs', efeito });
      continue;
    }
    if (
      !ehObjeto(o) ||
      typeof o.tipo !== 'string' ||
      !(TIPOS_OBJETO as readonly string[]).includes(o.tipo) ||
      !normalizado(o.x) ||
      !normalizado(o.y) ||
      typeof o.valor !== 'number' ||
      !(o.valor > 0) ||
      (o.modo !== 'abs' && o.modo !== 'pct')
    ) {
      erros.push({ mensagem: 'objeto precisa de tipo válido, x e y entre 0 e 1, valor > 0 e modo abs|pct' });
      continue;
    }
    lista.push({ tipo: o.tipo as (typeof TIPOS_OBJETO)[number], x: o.x, y: o.y, valor: o.valor, modo: o.modo });
  }
  return lista;
}

function validarInimigos(
  inimigos: unknown,
  erros: ErroFase[],
  presetsConhecidos: ReadonlySet<string> | undefined,
): InimigoPosicionado[] {
  if (inimigos === undefined) return [];
  if (!Array.isArray(inimigos)) {
    erros.push({ mensagem: 'inimigos precisa ser uma lista' });
    return [];
  }
  const lista: InimigoPosicionado[] = [];
  for (const i of inimigos) {
    if (!ehObjeto(i) || typeof i.preset !== 'string' || !ehInteiro(i.x) || !ehInteiro(i.y)) {
      erros.push({ mensagem: 'inimigo precisa de preset, x e y inteiros' });
      continue;
    }
    if (presetsConhecidos && !presetsConhecidos.has(i.preset)) {
      erros.push({ mensagem: `preset de inimigo desconhecido "${i.preset}"`, x: i.x, y: i.y });
    }
    const item: InimigoPosicionado = { preset: i.preset, x: i.x, y: i.y };
    if (i.nivel !== undefined) {
      if (ehInteiro(i.nivel) && i.nivel >= 1) item.nivel = i.nivel;
      else erros.push({ mensagem: 'nível do inimigo inválido', x: i.x, y: i.y });
    }
    if (i.hpBase !== undefined) {
      if (typeof i.hpBase === 'number' && i.hpBase >= 1) item.hpBase = i.hpBase;
      else erros.push({ mensagem: 'hpBase do inimigo inválido', x: i.x, y: i.y });
    }
    lista.push(item);
  }
  return lista;
}

function validarMapa(mapa: unknown, erros: ErroFase[]): string[] | null {
  if (!Array.isArray(mapa) || !mapa.every((l): l is string => typeof l === 'string')) {
    erros.push({ mensagem: 'mapa precisa ser uma lista de linhas de texto' });
    return null;
  }
  const altura = mapa.length;
  const largura = mapa[0]?.length ?? 0;
  if (altura < TAMANHO_MIN || altura > TAMANHO_MAX || largura < TAMANHO_MIN || largura > TAMANHO_MAX) {
    erros.push({ mensagem: `dimensões precisam ficar entre ${TAMANHO_MIN} e ${TAMANHO_MAX} células` });
    return null;
  }
  mapa.forEach((linha, y) => {
    if (linha.length !== largura) erros.push({ mensagem: `linha com ${linha.length} células (esperado ${largura})`, y });
    for (let x = 0; x < linha.length; x++) {
      const c = linha[x] ?? '';
      if (!(c in CARACTERE_CELULA)) erros.push({ mensagem: `caractere inválido '${c}'`, x, y });
    }
  });
  return mapa;
}

function validarSpawns(spawns: unknown, erros: ErroFase[]): SpawnJson[] | null {
  if (!Array.isArray(spawns) || spawns.length === 0) {
    erros.push({ mensagem: 'a fase precisa de ao menos um spawn' });
    return null;
  }
  const lista: SpawnJson[] = [];
  for (const s of spawns) {
    if (!ehObjeto(s) || !ehInteiro(s.x) || !ehInteiro(s.y)) {
      erros.push({ mensagem: 'spawn precisa de x e y inteiros' });
      continue;
    }
    if (s.equipe !== undefined && typeof s.equipe !== 'string') erros.push({ mensagem: 'equipe do spawn inválida', x: s.x, y: s.y });
    lista.push(typeof s.equipe === 'string' ? { x: s.x, y: s.y, equipe: s.equipe } : { x: s.x, y: s.y });
  }
  return lista;
}

function validarJogabilidade(json: FaseJson, erros: ErroFase[], avisos: ErroFase[]): void {
  const fase = carregarFase(json);
  for (const s of fase.spawns) {
    if (!passavel(fase, s.x, s.y)) erros.push({ mensagem: 'spawn em célula não passável', x: s.x, y: s.y });
  }
  // Inimigos dentro dos limites, em célula passável e sem dois na mesma célula (§3.10).
  const ocupadas = new Set<string>();
  for (const i of fase.inimigos) {
    const chave = `${i.x},${i.y}`;
    if (!passavel(fase, i.x, i.y)) erros.push({ mensagem: 'inimigo em célula não passável', x: i.x, y: i.y });
    if (ocupadas.has(chave)) erros.push({ mensagem: 'dois inimigos na mesma célula', x: i.x, y: i.y });
    ocupadas.add(chave);
  }
  const celulasDeObjeto = new Set<string>();
  for (const o of fase.objetos) {
    const chave = `${o.x},${o.y}`;
    if (!passavel(fase, o.x, o.y)) erros.push({ mensagem: 'objeto em célula não passável', x: o.x, y: o.y });
    if (celulasDeObjeto.has(chave)) erros.push({ mensagem: 'dois objetos na mesma célula', x: o.x, y: o.y });
    celulasDeObjeto.add(chave);
  }
  const primeiro = fase.spawns[0];
  if (!primeiro || erros.length > 0) return;

  // O spawn precisa alcançar todas as saídas (§3.10, jogabilidade).
  const alcance = alcancaveis(fase, primeiro);
  if (fase.tipo !== 'arena' && fase.inimigos.length === 0) avisos.push({ mensagem: 'fase sem inimigos' });
  for (const i of fase.inimigos) {
    if (alcance[i.y * fase.largura + i.x] !== 1) avisos.push({ mensagem: 'inimigo inalcançável a partir do spawn', x: i.x, y: i.y });
  }
  json.mapa.forEach((linha, y) => {
    for (let x = 0; x < linha.length; x++) {
      if (linha[x] === 'S' && alcance[y * fase.largura + x] !== 1) {
        erros.push({ mensagem: 'saída inalcançável a partir do spawn', x, y });
      }
    }
  });
  validarPortasNaFase(fase, alcance, erros);
  if (fase.tipo !== 'campanha') validarArena(fase, alcance, erros);
}

/**
 * Arena (§3.10): ao menos dois spawns, nenhum par adjacente, e todo spawn alcança o resto da fase
 * (toda célula passável é alcançável a partir do primeiro spawn).
 */
function validarArena(fase: ReturnType<typeof carregarFase>, alcance: Uint8Array, erros: ErroFase[]): void {
  if (fase.spawns.length < 2) erros.push({ mensagem: 'arena precisa de ao menos dois spawns' });
  fase.spawns.forEach((a, i) => {
    fase.spawns.slice(i + 1).forEach((b) => {
      if (Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) <= 1) {
        erros.push({ mensagem: 'spawns de arena não podem ser adjacentes', x: b.x, y: b.y });
      }
    });
  });
  for (let y = 0; y < fase.altura; y++) {
    for (let x = 0; x < fase.largura; x++) {
      if (passavel(fase, x, y) && alcance[y * fase.largura + x] !== 1) {
        erros.push({ mensagem: 'célula da arena inalcançável a partir dos spawns', x, y });
        return;
      }
    }
  }
}
