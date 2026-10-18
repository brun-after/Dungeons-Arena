// Ferramentas do editor além do pincel (§3.10). Marco 11A (16/10/2026), D-066. Puras e testadas: balde
// (preenchimento 4-conexo com teto de 20.000 células), retângulo, redimensionar (8 a 120, ancorado no canto superior
// esquerdo, recortando o que sair), portas internas em par, porta de saída com tranca e "distribuir" (limpa as peças
// à mão para o autotiling voltar). As de célula devolvem `Alteracao[]` (histórico por traço); as de metadados mexem
// na fase e quem chama guarda o retrato de antes e depois.

import type { Celula } from '../core/comandos';
import { codigoDeTipo, type PortaInterna } from '../world/fase';
import { TAMANHO_MAX, TAMANHO_MIN } from '../world/validacao-fase';
import { aplicarFerramenta, clonarFaseEditavel, dentro, lerCelula, type Alteracao, type FaseEditavel, type Ferramenta, type SaidaEditavel } from './grade';

export const TETO_BALDE = 20_000;

export interface ResultadoBalde {
  alteracoes: Alteracao[];
  /** A região passou do teto: nada foi pintado. */
  excedeu: boolean;
}

/**
 * Balde: pinta a região 4-conexa de células do mesmo tipo de terreno que a tocada. Passando de `TETO_BALDE`
 * células, recusa inteiro (nada de meio balde).
 */
export function preencher(f: FaseEditavel, inicio: Celula, ferramenta: Ferramenta, teto = TETO_BALDE): ResultadoBalde {
  if (!dentro(f, inicio.x, inicio.y)) return { alteracoes: [], excedeu: false };
  const alvo = f.celulas[inicio.y * f.largura + inicio.x];
  const vistas = new Uint8Array(f.largura * f.altura);
  const regiao: Celula[] = [];
  const fila: Celula[] = [inicio];
  vistas[inicio.y * f.largura + inicio.x] = 1;
  for (let i = 0; i < fila.length; i++) {
    const c = fila[i] as Celula;
    regiao.push(c);
    if (regiao.length > teto) return { alteracoes: [], excedeu: true };
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const x = c.x + dx;
      const y = c.y + dy;
      const k = y * f.largura + x;
      if (!dentro(f, x, y) || vistas[k] === 1 || f.celulas[k] !== alvo) continue;
      vistas[k] = 1;
      fila.push({ x, y });
    }
  }
  return { alteracoes: regiao.flatMap((c) => aplicarFerramenta(f, ferramenta, c.x, c.y)), excedeu: false };
}

/** As células do retângulo entre dois cantos (cheio ou só o contorno), recortadas ao mapa. */
export function celulasDoRetangulo(f: FaseEditavel, a: Celula, b: Celula, vazado = false): Celula[] {
  const x0 = Math.max(0, Math.min(a.x, b.x));
  const x1 = Math.min(f.largura - 1, Math.max(a.x, b.x));
  const y0 = Math.max(0, Math.min(a.y, b.y));
  const y1 = Math.min(f.altura - 1, Math.max(a.y, b.y));
  const celulas: Celula[] = [];
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (!vazado || x === x0 || x === x1 || y === y0 || y === y1) celulas.push({ x, y });
    }
  }
  return celulas;
}

export function retangulo(f: FaseEditavel, a: Celula, b: Celula, ferramenta: Ferramenta, vazado = false): Alteracao[] {
  return celulasDoRetangulo(f, a, b, vazado).flatMap((c) => aplicarFerramenta(f, ferramenta, c.x, c.y));
}

export interface ResultadoRedimensionar {
  fase: FaseEditavel;
  /** Quantas coisas (spawn, inimigos, objetos, portas, peças) ficaram fora e saíram. */
  removidos: number;
}

/**
 * Redimensiona ancorado no canto superior esquerdo. A área nova nasce parede; spawn, inimigos, objetos, portas e
 * peças fora do novo tamanho saem (e são contados, para o aviso).
 */
export function redimensionar(f: FaseEditavel, largura: number, altura: number): ResultadoRedimensionar {
  const l = Math.max(TAMANHO_MIN, Math.min(TAMANHO_MAX, Math.round(largura)));
  const a = Math.max(TAMANHO_MIN, Math.min(TAMANHO_MAX, Math.round(altura)));
  const nova = clonarFaseEditavel(f);
  const dentroNovo = (c: Celula) => c.x < l && c.y < a;
  let removidos = 0;
  const celulas = new Uint8Array(l * a).fill(codigoDeTipo('parede'));
  for (let y = 0; y < Math.min(a, f.altura); y++) {
    for (let x = 0; x < Math.min(l, f.largura); x++) celulas[y * l + x] = f.celulas[y * f.largura + x] ?? codigoDeTipo('parede');
  }
  const filtrar = <T>(lista: T[], ok: (v: T) => boolean): T[] => {
    const ficam = lista.filter(ok);
    removidos += lista.length - ficam.length;
    return ficam;
  };
  nova.largura = l;
  nova.altura = a;
  nova.celulas = celulas;
  if (nova.spawn && !dentroNovo(nova.spawn)) {
    nova.spawn = null;
    removidos++;
  }
  nova.inimigos = filtrar(nova.inimigos, dentroNovo);
  nova.objetos = filtrar(nova.objetos, dentroNovo);
  if (nova.ambientes) nova.ambientes = filtrar(nova.ambientes, dentroNovo);
  nova.portasInternas = filtrar(nova.portasInternas, (p) => dentroNovo(p.a) && dentroNovo(p.b));
  if (nova.portaSaida && !dentroNovo(nova.portaSaida)) {
    nova.portaSaida = null;
    removidos++;
  }
  const pecas: Record<string, string> = {};
  for (const [k, v] of Object.entries(f.pecas)) {
    const i = Number(k);
    const x = i % f.largura;
    const y = Math.floor(i / f.largura);
    if (x < l && y < a) pecas[String(y * l + x)] = v;
    else removidos++;
  }
  nova.pecas = pecas;
  return { fase: nova, removidos };
}

/** Copia o conteúdo de `origem` para `f` mantendo a identidade do objeto (o desfazer do redimensionar). */
export function substituirFase(f: FaseEditavel, origem: FaseEditavel): void {
  const c = clonarFaseEditavel(origem);
  Object.assign(f, c);
}

const MAX_PORTAS = 20;

/** Uma porta interna nova entre duas células passáveis distintas; null se não couber ou se repetir extremo. */
export function adicionarPortaInterna(f: FaseEditavel, a: Celula, b: Celula, nome: (numero: number) => string): PortaInterna | null {
  if (f.portasInternas.length >= MAX_PORTAS || (a.x === b.x && a.y === b.y)) return null;
  const ocupada = (c: Celula) => f.portasInternas.some((p) => (p.a.x === c.x && p.a.y === c.y) || (p.b.x === c.x && p.b.y === c.y));
  const passavelEm = (c: Celula) => {
    const t = lerCelula(f, c.x, c.y).tipo;
    return t === 'piso';
  };
  if (ocupada(a) || ocupada(b) || !passavelEm(a) || !passavelEm(b)) return null;
  const numero = Math.max(0, ...f.portasInternas.map((p) => p.numero)) + 1;
  const porta: PortaInterna = { numero, nome: nome(numero), a: { ...a }, b: { ...b } };
  f.portasInternas.push(porta);
  return porta;
}

/** Tira a porta interna com um extremo na célula; devolve se havia. */
export function removerPortaInternaEm(f: FaseEditavel, c: Celula): boolean {
  const antes = f.portasInternas.length;
  f.portasInternas = f.portasInternas.filter((p) => !((p.a.x === c.x && p.a.y === c.y) || (p.b.x === c.x && p.b.y === c.y)));
  return f.portasInternas.length !== antes;
}

/** A porta de saída na célula `S` tocada (a célula vira saída se ainda não for). */
export function definirSaida(f: FaseEditavel, c: Celula, saida: Omit<SaidaEditavel, 'x' | 'y'>): void {
  if (!dentro(f, c.x, c.y)) return;
  f.celulas[c.y * f.largura + c.x] = codigoDeTipo('saida');
  f.portaSaida = { ...saida, x: c.x, y: c.y, ...(saida.chefe && { chefe: { ...saida.chefe } }) };
}

/** Marca (ou desmarca) o inimigo da célula como o chefe que abre a saída. Sem saída na fase, usa o primeiro `S`. */
export function marcarChefe(f: FaseEditavel, c: Celula, chefe: boolean): boolean {
  if (!f.inimigos.some((i) => i.x === c.x && i.y === c.y)) return false;
  if (!chefe) {
    const s = f.portaSaida;
    if (s?.tranca === 'boss' && s.chefe?.x === c.x && s.chefe.y === c.y) f.portaSaida = { x: s.x, y: s.y, tranca: 'livre' };
    return true;
  }
  let s = f.portaSaida;
  if (!s) {
    const i = f.celulas.indexOf(codigoDeTipo('saida'));
    if (i < 0) return false;
    s = { x: i % f.largura, y: Math.floor(i / f.largura), tranca: 'livre' };
  }
  f.portaSaida = { x: s.x, y: s.y, tranca: 'boss', chefe: { ...c } };
  return true;
}

/** "Distribuir" (§3.10): apaga as peças à mão, e o autotiling volta a decidir. Portas, saídas e spawns ficam. */
export function distribuir(f: FaseEditavel): Alteracao[] {
  const alteracoes: Alteracao[] = [];
  for (const k of Object.keys(f.pecas)) {
    const i = Number(k);
    const x = i % f.largura;
    const y = Math.floor(i / f.largura);
    alteracoes.push(...aplicarFerramenta(f, { t: 'peca', peca: null }, x, y));
  }
  return alteracoes;
}
