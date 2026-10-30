// O reino do modo Mundo (marco 29, 30/10/2026, D-128): dado em src/data/mundo/<reino>.json. O reino é uma grade de
// regiões; cada região tem o bioma, o perigo (seguro, normal, perigoso), a faixa de nível, o tema, a semente do
// terreno, a vila (quando tem) e as estruturas (as entradas das dungeons e dos covis). As dungeons com objetivo
// (`masmorras`, instanciadas por grupo) e os covis de boss (compartilhados) ficam em listas próprias. Puro.
// Marco 30 (30/10/2026, D-129): as missões do quadro, os materiais que os monstros deixam e os NPCs do banco e do
// mercado.

import { ehObjeto, Leitor, type Objeto } from '../core/validar';
import { conferirMissoes, lerMissaoDoMundo, type MissaoDoMundo } from './missoes-mundo';

export type Perigo = 'seguro' | 'normal' | 'perigoso';
export const PERIGOS: readonly Perigo[] = ['seguro', 'normal', 'perigoso'];

export type PapelNpc = 'mercador' | 'ferreiro' | 'alquimista' | 'missoes' | 'portal' | 'save' | 'banco' | 'mercado';
export const PAPEIS_NPC: readonly PapelNpc[] = ['mercador', 'ferreiro', 'alquimista', 'missoes', 'portal', 'save', 'banco', 'mercado'];

/** Marco 30: o material que um preset deixa ao morrer no Mundo (no chão, como o loot). */
export interface MaterialDeInimigo {
  itemId: string;
  chancePct: number;
}

export type Bioma = 'campo' | 'floresta' | 'pantano' | 'colinas' | 'ruinas' | 'neve';
export const BIOMAS: readonly Bioma[] = ['campo', 'floresta', 'pantano', 'colinas', 'ruinas', 'neve'];

export type TipoEstrutura = 'caverna' | 'castelo' | 'torre' | 'mina' | 'templo' | 'cripta';
export const TIPOS_ESTRUTURA: readonly TipoEstrutura[] = ['caverna', 'castelo', 'torre', 'mina', 'templo', 'cripta'];

/** O que muda com o perigo da região: PvP, quantos monstros, a chance de elite e o loot. */
export interface RegrasDePerigo {
  pvp: boolean;
  /** Inimigos por 1000 células andáveis. */
  densidadePor1000: number;
  elitePct: number;
  /** Marco 30 (D-129): a elite nasce estes níveis acima do topo da faixa da região. */
  eliteNiveis: number;
  /** Multiplicador da chance de item dos drops, em %. */
  lootPct: number;
}

export interface DestinoDeEstrutura {
  tipo: 'masmorra' | 'covil';
  id: string;
}

/** Uma estrutura vista de fora: a fachada ocupa `largura`×`altura` células a partir de (x, y); a porta fica embaixo. */
export interface EstruturaDoMundo {
  id: string;
  nome: string;
  tipo: TipoEstrutura;
  x: number;
  y: number;
  largura: number;
  altura: number;
  destino: DestinoDeEstrutura;
  /** Escondida: só aparece no mapa de quem chegou perto (a descoberta). */
  escondida: boolean;
}

export interface VilaDoMundo {
  nome: string;
  /** Centro da praça e o raio dos muros. */
  x: number;
  y: number;
  raio: number;
  npcs: PapelNpc[];
}

export interface RegiaoDoMundo {
  id: string;
  nome: string;
  gx: number;
  gy: number;
  bioma: Bioma;
  perigo: Perigo;
  nivel: readonly [number, number];
  tema: string | null;
  semente: number;
  inimigos: readonly string[];
  vila: VilaDoMundo | null;
  estruturas: readonly EstruturaDoMundo[];
  /** Os pontos de coleta: o material e quantos espalhados pela região. */
  coleta: readonly { itemId: string; quantidade: number }[];
}

/** Dungeon com objetivo: instanciada por grupo; derrotar o chefe conclui e entrega a recompensa. */
export interface MasmorraDoMundo {
  id: string;
  nome: string;
  nivel: number;
  salas: number;
  tema: string | null;
  inimigos: readonly string[];
  boss: string;
  recompensa: readonly string[];
  /** Horas até a recompensa valer de novo para o mesmo personagem. */
  recargaH: number;
}

/** Covil de boss: compartilhado; o boss renasce e quem lutou leva o próprio sorteio do drop exclusivo. */
export interface CovilDoMundo {
  id: string;
  nome: string;
  nivel: number;
  salas: number;
  tema: string | null;
  inimigos: readonly string[];
  boss: string;
  dropExclusivo: string;
  chanceDropPct: number;
  renascerMin: number;
}

export interface Reino {
  id: string;
  nome: string;
  tamanhoRegiao: number;
  largura: number;
  altura: number;
  /** A região onde todo personagem novo começa (e a vila onde salva pela primeira vez). */
  inicio: string;
  perigos: Readonly<Record<Perigo, RegrasDePerigo>>;
  /** O estoque das lojas da vila, por papel (ids de item). */
  lojas: Readonly<Partial<Record<PapelNpc, readonly string[]>>>;
  /** Marco 30 (D-129): o estoque do mercador errante (o evento de região). */
  mercadorErrante: readonly string[];
  regioes: readonly RegiaoDoMundo[];
  masmorras: readonly MasmorraDoMundo[];
  covis: readonly CovilDoMundo[];
  /** Marco 30: as missões dos quadros das vilas. */
  missoes: readonly MissaoDoMundo[];
  /** Marco 30: preset -> os materiais que ele deixa ao morrer. */
  materiais: Readonly<Record<string, readonly MaterialDeInimigo[]>>;
}

export type LadoDaRegiao = 'norte' | 'sul' | 'leste' | 'oeste';
export const LADOS: readonly LadoDaRegiao[] = ['norte', 'sul', 'leste', 'oeste'];
const PASSO: Readonly<Record<LadoDaRegiao, readonly [number, number]>> = { norte: [0, -1], sul: [0, 1], leste: [1, 0], oeste: [-1, 0] };

function lerNivel(l: Leitor, o: Objeto): readonly [number, number] {
  const n = l.lista(o, 'nivel');
  const min = typeof n[0] === 'number' ? n[0] : 1;
  const max = typeof n[1] === 'number' ? n[1] : min;
  if (!Number.isInteger(min) || !Number.isInteger(max) || min < 1 || max > 100 || min > max) l.erro('nivel: [min, max] entre 1 e 100');
  return [min, max];
}

function lerEstrutura(l: Leitor, v: unknown, tamanho: number): EstruturaDoMundo {
  const o = l.objeto(v, 'estrutura');
  const d = l.objeto(o.destino, 'destino');
  const e: EstruturaDoMundo = {
    id: l.texto(o, 'id'),
    nome: l.texto(o, 'nome'),
    tipo: l.opcao(o, 'tipo', TIPOS_ESTRUTURA),
    x: l.numero(o, 'x', { min: 2, max: tamanho - 3, inteiro: true }),
    y: l.numero(o, 'y', { min: 2, max: tamanho - 3, inteiro: true }),
    largura: l.numero(o, 'largura', { min: 3, max: 9, inteiro: true }),
    altura: l.numero(o, 'altura', { min: 2, max: 7, inteiro: true }),
    destino: { tipo: l.opcao(d, 'tipo', ['masmorra', 'covil'] as const), id: l.texto(d, 'id') },
    escondida: o.escondida === undefined ? false : l.booleano(o, 'escondida'),
  };
  if (e.x + e.largura >= tamanho - 2 || e.y + e.altura >= tamanho - 3) l.erro(`estrutura ${e.id}: fora da região`);
  return e;
}

function lerRegiao(l: Leitor, v: unknown, tamanho: number): RegiaoDoMundo {
  const o = l.objeto(v, 'regiao');
  const vila = o.vila === undefined || o.vila === null ? null : l.objeto(o.vila, 'vila');
  return {
    id: l.texto(o, 'id'),
    nome: l.texto(o, 'nome'),
    gx: l.numero(o, 'gx', { min: 0, max: 15, inteiro: true }),
    gy: l.numero(o, 'gy', { min: 0, max: 15, inteiro: true }),
    bioma: l.opcao(o, 'bioma', BIOMAS),
    perigo: l.opcao(o, 'perigo', PERIGOS),
    nivel: lerNivel(l, o),
    tema: o.tema === undefined || o.tema === null ? null : l.texto(o, 'tema'),
    semente: l.numero(o, 'semente', { min: 0, inteiro: true }),
    inimigos: l.listaDeTextos(o, 'inimigos'),
    vila: vila
      ? {
          nome: l.texto(vila, 'nome'),
          x: l.numero(vila, 'x', { min: 20, max: tamanho - 21, inteiro: true }),
          y: l.numero(vila, 'y', { min: 20, max: tamanho - 21, inteiro: true }),
          raio: l.numero(vila, 'raio', { min: 10, max: 20, inteiro: true }),
          npcs: l.listaDeTextos(vila, 'npcs').map((p) => (PAPEIS_NPC.includes(p as PapelNpc) ? (p as PapelNpc) : (l.erro(`npc desconhecido "${p}"`), 'mercador'))),
        }
      : null,
    estruturas: (o.estruturas === undefined ? [] : l.lista(o, 'estruturas')).map((x) => lerEstrutura(l, x, tamanho)),
    coleta: (o.coleta === undefined ? [] : l.lista(o, 'coleta')).map((x) => {
      const c = l.objeto(x, 'coleta');
      return { itemId: l.texto(c, 'itemId'), quantidade: l.numero(c, 'quantidade', { min: 1, max: 40, inteiro: true }) };
    }),
  };
}

function lerPerigos(l: Leitor, v: unknown): Record<Perigo, RegrasDePerigo> {
  const o = l.objeto(v, 'perigos');
  const ler = (p: Perigo): RegrasDePerigo => {
    const r = l.objeto(o[p], p);
    return {
      pvp: l.booleano(r, 'pvp'),
      densidadePor1000: l.numero(r, 'densidadePor1000', { min: 0, max: 50 }),
      elitePct: l.numero(r, 'elitePct', { min: 0, max: 100 }),
      eliteNiveis: r.eliteNiveis === undefined ? 0 : l.numero(r, 'eliteNiveis', { min: 0, max: 30, inteiro: true }),
      lootPct: l.numero(r, 'lootPct', { min: 0, max: 500 }),
    };
  };
  return { seguro: ler('seguro'), normal: ler('normal'), perigoso: ler('perigoso') };
}

/** Lê e confere o reino; os ids de preset, item e tema são conferidos por quem tem o catálogo (`conferirReino`). */
export function lerReino(json: unknown): { reino: Reino | null; erros: string[] } {
  const l = new Leitor('reino');
  const o = l.objeto(json, 'raiz');
  const tamanho = l.numero(o, 'tamanhoRegiao', { min: 64, max: 160, inteiro: true });
  const reino: Reino = {
    id: l.texto(o, 'id'),
    nome: l.texto(o, 'nome'),
    tamanhoRegiao: tamanho,
    largura: l.numero(o, 'largura', { min: 1, max: 16, inteiro: true }),
    altura: l.numero(o, 'altura', { min: 1, max: 16, inteiro: true }),
    inicio: l.texto(o, 'inicio'),
    perigos: lerPerigos(l, o.perigos),
    lojas: ehObjeto(o.lojas) ? Object.fromEntries(Object.entries(o.lojas).filter(([k]) => PAPEIS_NPC.includes(k as PapelNpc)).map(([k, v]) => [k, Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []])) : {},
    mercadorErrante: o.mercadorErrante === undefined ? [] : l.listaDeTextos(o, 'mercadorErrante'),
    regioes: l.lista(o, 'regioes').map((x) => lerRegiao(l, x, tamanho)),
    masmorras: l.lista(o, 'masmorras').map((x) => {
      const m = l.objeto(x, 'masmorra');
      return {
        id: l.texto(m, 'id'),
        nome: l.texto(m, 'nome'),
        nivel: l.numero(m, 'nivel', { min: 1, max: 100, inteiro: true }),
        salas: l.numero(m, 'salas', { min: 3, max: 20, inteiro: true }),
        tema: m.tema === undefined || m.tema === null ? null : l.texto(m, 'tema'),
        inimigos: l.listaDeTextos(m, 'inimigos'),
        boss: l.texto(m, 'boss'),
        recompensa: l.listaDeTextos(m, 'recompensa'),
        recargaH: l.numero(m, 'recargaH', { min: 0, max: 24 * 14 }),
      };
    }),
    covis: l.lista(o, 'covis').map((x) => {
      const c = l.objeto(x, 'covil');
      return {
        id: l.texto(c, 'id'),
        nome: l.texto(c, 'nome'),
        nivel: l.numero(c, 'nivel', { min: 1, max: 100, inteiro: true }),
        salas: l.numero(c, 'salas', { min: 3, max: 20, inteiro: true }),
        tema: c.tema === undefined || c.tema === null ? null : l.texto(c, 'tema'),
        inimigos: l.listaDeTextos(c, 'inimigos'),
        boss: l.texto(c, 'boss'),
        dropExclusivo: l.texto(c, 'dropExclusivo'),
        chanceDropPct: l.numero(c, 'chanceDropPct', { min: 0, max: 100 }),
        renascerMin: l.numero(c, 'renascerMin', { min: 1, max: 24 * 60 }),
      };
    }),
    missoes: o.missoes === undefined ? [] : l.lista(o, 'missoes').map((x) => lerMissaoDoMundo(l, x)),
    materiais: lerMateriais(l, o.materiais),
  };
  const erros = [...l.erros];
  const ids = new Set<string>();
  for (const id of [...reino.regioes.map((r) => r.id), ...reino.masmorras.map((m) => m.id), ...reino.covis.map((c) => c.id)]) {
    if (ids.has(id)) erros.push(`id repetido "${id}"`);
    ids.add(id);
  }
  for (const r of reino.regioes) {
    if (r.gx >= reino.largura || r.gy >= reino.altura) erros.push(`região ${r.id}: fora da grade`);
    if (reino.regioes.some((x) => x !== r && x.gx === r.gx && x.gy === r.gy)) erros.push(`região ${r.id}: célula da grade repetida`);
    for (const e of r.estruturas) {
      const lista = e.destino.tipo === 'masmorra' ? reino.masmorras : reino.covis;
      if (!lista.some((x) => x.id === e.destino.id)) erros.push(`estrutura ${e.id}: destino desconhecido "${e.destino.id}"`);
    }
  }
  if (!reino.regioes.some((r) => r.id === reino.inicio && r.vila)) erros.push('inicio: precisa ser uma região com vila');
  erros.push(
    ...conferirMissoes(reino.missoes, {
      preset: () => true,
      item: () => true,
      regiao: (id) => reino.regioes.some((r) => r.id === id),
      vila: (id) => reino.regioes.some((r) => r.id === id && r.vila),
      covil: (id) => reino.covis.some((c) => c.id === id),
      masmorra: (id) => reino.masmorras.some((m) => m.id === id),
    }),
  );
  return { reino: erros.length === 0 ? reino : null, erros };
}

function lerMateriais(l: Leitor, v: unknown): Record<string, readonly MaterialDeInimigo[]> {
  if (v === undefined) return {};
  const o = l.objeto(v, 'materiais');
  const r: Record<string, MaterialDeInimigo[]> = {};
  for (const [preset, lista] of Object.entries(o)) {
    r[preset] = (Array.isArray(lista) ? lista : []).map((x) => {
      const m = l.objeto(x, `materiais.${preset}`);
      return { itemId: l.texto(m, 'itemId'), chancePct: l.numero(m, 'chancePct', { min: 0, max: 100 }) };
    });
  }
  return r;
}

/** Confere os ids contra o catálogo (presets, itens e temas). */
export function conferirReino(reino: Reino, existe: { preset: (id: string) => boolean; item: (id: string) => boolean; tema: (id: string) => boolean }): string[] {
  const erros: string[] = [];
  const presets = (dono: string, lista: readonly string[]) => {
    for (const p of lista) if (!existe.preset(p)) erros.push(`${dono}: preset desconhecido "${p}"`);
  };
  const itens = (dono: string, lista: readonly string[]) => {
    for (const i of lista) if (!existe.item(i)) erros.push(`${dono}: item desconhecido "${i}"`);
  };
  const tema = (dono: string, t: string | null) => {
    if (t !== null && !existe.tema(t)) erros.push(`${dono}: tema desconhecido "${t}"`);
  };
  for (const r of reino.regioes) {
    presets(r.id, r.inimigos);
    itens(r.id, r.coleta.map((c) => c.itemId));
    tema(r.id, r.tema);
  }
  for (const m of reino.masmorras) {
    presets(m.id, [...m.inimigos, m.boss]);
    itens(m.id, m.recompensa);
    tema(m.id, m.tema);
  }
  for (const c of reino.covis) {
    presets(c.id, [...c.inimigos, c.boss]);
    itens(c.id, [c.dropExclusivo]);
    tema(c.id, c.tema);
  }
  for (const [papel, lista] of Object.entries(reino.lojas)) itens(`loja ${papel}`, lista);
  itens('mercadorErrante', reino.mercadorErrante);
  for (const [preset, lista] of Object.entries(reino.materiais)) {
    presets('materiais', [preset]);
    itens(`materiais ${preset}`, lista.map((m) => m.itemId));
  }
  erros.push(
    ...conferirMissoes(reino.missoes, { preset: existe.preset, item: existe.item, regiao: () => true, vila: () => true, covil: () => true, masmorra: () => true }),
  );
  return erros;
}

export function regiaoPorId(reino: Reino, id: string): RegiaoDoMundo | undefined {
  return reino.regioes.find((r) => r.id === id);
}

export function regiaoEm(reino: Reino, gx: number, gy: number): RegiaoDoMundo | undefined {
  return reino.regioes.find((r) => r.gx === gx && r.gy === gy);
}

/** A região vizinha pelo lado (undefined na borda do reino). */
export function vizinha(reino: Reino, r: RegiaoDoMundo, lado: LadoDaRegiao): RegiaoDoMundo | undefined {
  const [dx, dy] = PASSO[lado];
  return regiaoEm(reino, r.gx + dx, r.gy + dy);
}

export function ladoOposto(lado: LadoDaRegiao): LadoDaRegiao {
  return lado === 'norte' ? 'sul' : lado === 'sul' ? 'norte' : lado === 'leste' ? 'oeste' : 'leste';
}

/** A estrutura que leva a um destino (para voltar à porta ao sair do interior). */
export function estruturaDoDestino(reino: Reino, destinoId: string): { regiao: RegiaoDoMundo; estrutura: EstruturaDoMundo } | null {
  for (const regiao of reino.regioes) {
    const estrutura = regiao.estruturas.find((e) => e.destino.id === destinoId);
    if (estrutura) return { regiao, estrutura };
  }
  return null;
}

/** A célula da porta (embaixo, no meio da fachada) e a da frente dela, onde se chega ao sair. */
export function portaDa(e: Pick<EstruturaDoMundo, 'x' | 'y' | 'largura' | 'altura'>): { porta: { x: number; y: number }; frente: { x: number; y: number } } {
  const x = e.x + Math.floor(e.largura / 2);
  return { porta: { x, y: e.y + e.altura - 1 }, frente: { x, y: e.y + e.altura } };
}

/** O reino do Mundo no conteúdo (marco 29: o Reino Central, o único por enquanto). */
export function reinoDoConteudo(conteudo: { reinos: ReadonlyMap<string, Reino> }): Reino {
  const reino = conteudo.reinos.get('reino_central');
  if (!reino) throw new Error('reino_central ausente');
  return reino;
}
