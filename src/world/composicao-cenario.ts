// A composição dos lugares do exterior do Mundo (marco 43, 15/11/2026, D-177). O que fica em pé em cada lugar sai da
// função dele, não de um sorteio espalhado: a praça tem o poço, os bancos e as lanternas; a casa guarda barris,
// caixotes e lenha junto da parede; cada ofício tem o seu canto (a bigorna e as armas do ferreiro, o caldeirão do
// alquimista, a banca do mercado, as mesas da taverna); fora do muro ficam as roças (cercas, feno, cocho); a estrada
// tem os marcos e as placas; a mina, a carroça e o madeiramento; a ruína, os escombros; a margem da água, os juncos.
// As listas ficam em data/mundo/cenario.json (`composicao`); a variante e o lugar exato saem do hash da célula.
// O que é sólido vira obstáculo (OBSTACULO.objeto) só onde não fecha passagem: encostado em algo e com os vizinhos
// livres num arco só em volta (o teste local de corte). Puro.

import CENARIO from '../data/mundo/cenario.json';
import type { Celula } from '../core/comandos';
import type { Telhado } from './fase';

export interface PecaDoCenario {
  /** A série de src/assets/cenario (render/cenario-iso.ts escolhe a variante). */
  nome: string;
  /** Posição em células (o centro da célula é o inteiro). */
  x: number;
  y: number;
  escala?: number;
  /** Ocupa a célula (vira obstáculo). */
  solido: boolean;
}

export interface EntradaComposicao {
  n: number;
  semente: number;
  bioma: string;
  em: (x: number, y: number) => string;
  /** Marca a célula como obstáculo do cenário (o gerador põe '#' e o código do objeto). */
  ocupar: (x: number, y: number) => void;
  /** Onde não vai nada (as passagens entre as regiões). */
  bloqueada: (c: Celula) => boolean;
  vila: { x: number; y: number; raio: number } | null;
  telhados: readonly Telhado[];
  estruturas: readonly { tipo: string; frente: Celula; escondida: boolean }[];
  /** As pontas das estradas que saem da região (as placas). */
  entradas: readonly Celula[];
  /** O que não pode ser tapado (as portas, os NPCs, as chegadas). */
  reservadas: readonly Celula[];
}

type Composicao = typeof CENARIO.composicao;

const ANDA = new Set([',', '.']);
const RING: readonly (readonly [number, number])[] = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]];

function hash(x: number, y: number, s: number): number {
  let h = (Math.imul(x, 374_761_393) + Math.imul(y, 668_265_263) + Math.imul(s, 1_013_904_223)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1_274_126_177);
  return ((h ^ (h >>> 16)) >>> 0) / 4_294_967_296;
}

const escolher = <T>(lista: readonly T[], t: number): T | undefined => lista[Math.min(lista.length - 1, Math.floor(t * lista.length))];

export function comporCenario(e: EntradaComposicao): PecaDoCenario[] {
  const C: Composicao = CENARIO.composicao;
  const pecas: PecaDoCenario[] = [];
  const usadas = new Set<number>();
  const reservada = new Set<number>();
  for (const c of e.reservadas) for (const [dx, dy] of [[0, 0], ...RING] as const) reservada.add((c.y + dy) * e.n + c.x + dx);
  const anda = (x: number, y: number) => ANDA.has(e.em(x, y)) && !usadas.has(y * e.n + x);
  const interna = (x: number, y: number) => x > 1 && y > 1 && x < e.n - 2 && y < e.n - 2;
  const livre = (x: number, y: number) => interna(x, y) && anda(x, y) && !e.bloqueada({ x, y }) && !reservada.has(y * e.n + x);
  /** Tirar a célula do caminho não separa os vizinhos andáveis (um arco só no anel de 8) nem toca a estrada. */
  const naoCorta = (x: number, y: number) => {
    let arcos = 0;
    for (let i = 0; i < 8; i++) {
      const [ax, ay] = RING[i] as readonly [number, number];
      const [bx, by] = RING[(i + 1) % 8] as readonly [number, number];
      const a = anda(x + ax, y + ay) || e.em(x + ax, y + ay) === '=';
      const b = anda(x + bx, y + by) || e.em(x + bx, y + by) === '=';
      if (!a && b) arcos++;
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) if (e.em(x + dx, y + dy) === '=') return false;
    return arcos <= 1;
  };
  const por = (serie: string | undefined, x: number, y: number, solido: boolean, escala?: number): boolean => {
    if (!serie || !livre(x, y)) return false;
    if (solido && !naoCorta(x, y)) return false;
    usadas.add(y * e.n + x);
    if (solido) e.ocupar(x, y);
    pecas.push({ nome: serie, x, y, solido, ...(escala !== undefined && { escala }) });
    return true;
  };
  /** O anel em volta de um retângulo (fora dele, a `d` células), em ordem fixa. */
  const anel = (r: { x: number; y: number; largura: number; altura: number }, d: number): Celula[] => {
    const c: Celula[] = [];
    for (let x = r.x - d; x < r.x + r.largura + d; x++) c.push({ x, y: r.y - d }, { x, y: r.y + r.altura - 1 + d });
    for (let y = r.y - d + 1; y < r.y + r.altura - 1 + d; y++) c.push({ x: r.x - d, y }, { x: r.x + r.largura - 1 + d, y });
    return c;
  };
  /** Põe `quantas` peças da lista em volta do retângulo, longe da porta (meio da parede sul). */
  const emVolta = (r: { x: number; y: number; largura: number; altura: number }, lista: readonly string[], quantas: number, s: number) => {
    const porta = { x: r.x + Math.floor(r.largura / 2), y: r.y + r.altura };
    const candidatas = anel(r, 1).filter((c) => Math.abs(c.x - porta.x) > 1 || Math.abs(c.y - porta.y) > 0);
    candidatas.sort((a, b) => hash(a.x, a.y, s) - hash(b.x, b.y, s));
    let postas = 0;
    for (const c of candidatas) {
      if (postas >= quantas) break;
      if (por(escolher(lista, hash(c.x, c.y, s + 1)), c.x, c.y, true)) postas++;
    }
  };

  /** O cercado w×h em (x0, y0): a cerca no contorno com a porteira no lado virado para a vila, o feno e o cocho dentro. */
  const cercado = (x0: number, y0: number, w: number, h: number, vila: { x: number; y: number }, s: number): boolean => {
    for (let y = y0 - 1; y <= y0 + h; y++) for (let x = x0 - 1; x <= x0 + w; x++) if (!livre(x, y) || e.em(x, y) === '=') return false;
    for (let y = y0 - 2; y <= y0 + h + 1; y++) for (let x = x0 - 2; x <= x0 + w + 1; x++) if (e.em(x, y) === '=') return false;
    const cx = x0 + (w - 1) / 2;
    const cy = y0 + (h - 1) / 2;
    const dx = vila.x - cx;
    const dy = vila.y - cy;
    const porteira = Math.abs(dx) > Math.abs(dy)
      ? { x: dx > 0 ? x0 + w - 1 : x0, y: Math.round(cy) }
      : { x: Math.round(cx), y: dy > 0 ? y0 + h - 1 : y0 };
    for (const c of anel({ x: x0 + 1, y: y0 + 1, largura: w - 2, altura: h - 2 }, 1)) {
      if (c.x === porteira.x && c.y === porteira.y) continue;
      usadas.add(c.y * e.n + c.x);
      e.ocupar(c.x, c.y);
      pecas.push({ nome: 'cerca', x: c.x, y: c.y, solido: true });
    }
    const dentro: Celula[] = [];
    for (let y = y0 + 1; y < y0 + h - 1; y++) for (let x = x0 + 1; x < x0 + w - 1; x++) if (Math.abs(x - porteira.x) + Math.abs(y - porteira.y) > 1) dentro.push({ x, y });
    dentro.sort((a, b) => hash(a.x, a.y, s) - hash(b.x, b.y, s));
    dentro.slice(0, 3).forEach((c, i) => por(i === 0 ? 'cocho' : escolher(C.roca, hash(c.x, c.y, s + 1)), c.x, c.y, true));
    return true;
  };

  // As casas e os prédios: o que se guarda junto da parede e o canto de cada ofício.
  e.telhados.forEach((t, i) => {
    if (t.revela === 'dentro') {
      emVolta(t, C.abandonada, 2, 100 + i);
      return;
    }
    const oficio = t.predio ? (C.predio as Record<string, string[] | undefined>)[t.predio] : undefined;
    if (oficio) emVolta(t, oficio, 3, 200 + i);
    emVolta(t, C.casa, 1 + Math.floor(hash(t.x, t.y, 7) * 2), 300 + i);
  });
  // A praça: o poço num canto do cruzamento, com os dois bancos virados para ele (do lado de fora da rua), e uma
  // lanterna em cada portão (é onde se chega à noite). Nada mais: praça cheia não é praça.
  const v = e.vila;
  if (v) {
    const cantos = [3, 4, 5, 6].flatMap((d) => [[d, d], [-d, d], [d, -d], [-d, -d]] as const);
    for (const [dx, dy] of cantos) {
      if (!por('poco', v.x + dx, v.y + dy, true)) continue;
      por('banco', v.x + dx + Math.sign(dx) * 2, v.y + dy, true);
      por('banco', v.x + dx, v.y + dy + Math.sign(dy) * 2, true);
      break;
    }
    const r = v.raio - 2;
    for (const [px, py] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      for (const lado of [2, -2, 3, -3]) if (por('poste_lanterna', v.x + px * r + (py !== 0 ? lado : 0), v.y + py * r + (px !== 0 ? lado : 0), true)) break;
    }
    // As roças: um cercado plano encostado na vila (dentro do chão que o relevo achata), com uma porteira virada
    // para a vila e o feno e o cocho lá dentro. Só onde o cercado inteiro e uma volta de folga cabem livres.
    if (C.rocaBiomas.includes(e.bioma)) {
      let feitas = 0;
      for (let k = 0; k < 24 && feitas < C.rocas; k++) {
        const ang = hash(v.x, v.y, 400 + k) * Math.PI * 2;
        const dist = v.raio + 1 + C.cercado.altura / 2;
        const deitado = Math.abs(Math.cos(ang)) < 0.7;
        const w = deitado ? C.cercado.largura : C.cercado.altura;
        const h = deitado ? C.cercado.altura : C.cercado.largura;
        const x0 = Math.round(v.x + Math.cos(ang) * dist - w / 2);
        const y0 = Math.round(v.y + Math.sin(ang) * dist - h / 2);
        if (cercado(x0, y0, w, h, v, 430 + k)) feitas++;
      }
    }
  }
  // As estruturas: a mina tem a carroça e o madeiramento; a caverna, troncos e pedras; a cripta e o templo, ruína.
  e.estruturas.forEach((s, i) => {
    if (s.escondida) return;
    const lista = (C.estrutura as Record<string, string[] | undefined>)[s.tipo];
    if (!lista) return;
    for (const [dx, dy] of [[-3, 0], [3, 0], [-3, 2], [3, 2], [-2, 3], [2, 3]] as const) if (hash(s.frente.x + dx, s.frente.y + dy, 500 + i) < 0.7) por(escolher(lista, hash(s.frente.x, s.frente.y + dy, 510 + dx)), s.frente.x + dx, s.frente.y + dy, true);
  });
  // As placas nas pontas das estradas e os marcos pelo caminho.
  for (const c of e.entradas) for (const [dx, dy] of [[3, 2], [-2, 3], [2, -2]] as const) if (por('placa', c.x + dx, c.y + dy, true)) break;
  for (let y = 2; y < e.n - 2; y += 1) {
    for (let x = 2; x < e.n - 2; x += 1) {
      if (e.em(x, y) !== '=' || hash(x, y, 600) > C.marcoPorCelulaDeEstrada) continue;
      for (const [dx, dy] of [[2, 0], [-1, 0], [0, 2], [0, -1]] as const) if (por(escolher(C.estrada, hash(x, y, 610)), x + dx, y + dy, true)) break;
    }
  }
  // A margem da água: juncos e pedras com musgo (os juncos não ocupam).
  const margem = (C.margem as Record<string, string[] | undefined>)[e.bioma] ?? [];
  if (margem.length > 0) {
    for (let y = 2; y < e.n - 2; y++) {
      for (let x = 2; x < e.n - 2; x++) {
        if (!ANDA.has(e.em(x, y)) || hash(x, y, 700) > C.margemPorCelula) continue;
        if (![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx = 0, dy = 0]) => e.em(x + dx, y + dy) === '~')) continue;
        const nome = escolher(margem, hash(x, y, 710));
        por(nome, x, y, nome !== 'juncos');
      }
    }
  }
  return pecas;
}
