// Validação de fase (§3.9, §3.10): a mesma função serve ao conteúdo oficial (teste no CI)
// e, no futuro, ao editor e à importação. Conteúdo inválido é recusado com o erro na célula,
// nunca quebra o jogo. Marco 2: schema mínimo, spawn passável e spawn alcançando a saída.

import { alcancaveis } from './navegacao';
import { CARACTERE_CELULA, carregarFase, passavel, type FaseJson, type SpawnJson } from './fase';

export interface ErroFase {
  mensagem: string;
  x?: number;
  y?: number;
}

export type ResultadoValidacao = { ok: true; fase: FaseJson } | { ok: false; erros: ErroFase[] };

export const TAMANHO_MIN = 8;
export const TAMANHO_MAX = 120;
const TIPOS = ['campanha', 'arena', 'ambas'] as const;

function ehObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function ehInteiro(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v);
}

export function validarFase(entrada: unknown): ResultadoValidacao {
  const erros: ErroFase[] = [];
  if (!ehObjeto(entrada)) return { ok: false, erros: [{ mensagem: 'a fase precisa ser um objeto' }] };

  const { id, nome, ordem, tipo, mapa, spawns } = entrada;
  if (typeof id !== 'string' || id.trim() === '') erros.push({ mensagem: 'id ausente' });
  if (typeof nome !== 'string' || nome.trim() === '') erros.push({ mensagem: 'nome ausente' });
  if (!ehInteiro(ordem)) erros.push({ mensagem: 'ordem precisa ser inteiro' });
  if (typeof tipo !== 'string' || !(TIPOS as readonly string[]).includes(tipo)) {
    erros.push({ mensagem: `tipo precisa ser ${TIPOS.join(', ')}` });
  }

  const linhas = validarMapa(mapa, erros);
  const listaSpawns = validarSpawns(spawns, erros);
  if (erros.length > 0 || !linhas || !listaSpawns) return { ok: false, erros };

  const json: FaseJson = {
    id: id as string,
    nome: nome as string,
    ordem: ordem as number,
    tipo: tipo as FaseJson['tipo'],
    mapa: linhas,
    spawns: listaSpawns,
  };
  validarJogabilidade(json, erros);
  return erros.length > 0 ? { ok: false, erros } : { ok: true, fase: json };
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

function validarJogabilidade(json: FaseJson, erros: ErroFase[]): void {
  const fase = carregarFase(json);
  for (const s of fase.spawns) {
    if (!passavel(fase, s.x, s.y)) erros.push({ mensagem: 'spawn em célula não passável', x: s.x, y: s.y });
  }
  const primeiro = fase.spawns[0];
  if (!primeiro || erros.length > 0) return;

  // O spawn precisa alcançar todas as saídas (§3.10, jogabilidade).
  const alcance = alcancaveis(fase, primeiro);
  json.mapa.forEach((linha, y) => {
    for (let x = 0; x < linha.length; x++) {
      if (linha[x] === 'S' && alcance[y * fase.largura + x] !== 1) {
        erros.push({ mensagem: 'saída inalcançável a partir do spawn', x, y });
      }
    }
  });
}
