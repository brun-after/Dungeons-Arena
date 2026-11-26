// O d20 desenhado (25/11/2026, D-205, da entrega visual): um icosaedro regular no Canvas 2D. A face escolhida pelo
// combate é alinhada à câmera no fim da rolagem; os números usam a fonte do jogo.
import { FONTE_DO_JOGO } from './runa-texto';

type Vetor = readonly [number, number, number];
const PHI = (1 + Math.sqrt(5)) / 2;
const VERTICES: readonly Vetor[] = [
  [-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0],
  [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI],
  [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1],
];
const FACES: readonly Vetor[] = [
  [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
  [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
  [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
  [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
];
/** O vértice da lista (os índices das faces são fixos e sempre existem). */
const em = (lista: readonly Vetor[], i: number): Vetor => lista[i] ?? [0, 0, 0];
const centro = (a: Vetor, b: Vetor, c: Vetor): Vetor =>
  [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3];
const produto = (a: Vetor, b: Vetor) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const normalizar = ([x, y, z]: Vetor): Vetor => {
  const norma = Math.hypot(x, y, z);
  return [x / norma, y / norma, z / norma];
};
const cruzar = (a: Vetor, b: Vetor): Vetor =>
  [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const normais = FACES.map(([i, j, k]) => normalizar(centro(em(VERTICES, i), em(VERTICES, j), em(VERTICES, k))));
const numeros: number[] = [];
let proximo = 1;
for (const [indice, normal] of normais.entries()) {
  if (numeros[indice] !== undefined) continue;
  const oposta = normais.findIndex((outra) => produto(normal, outra) < -0.999);
  numeros[indice] = proximo;
  numeros[oposta] = 21 - proximo;
  proximo++;
}
const orientacoes = FACES.map(([i, j, k]) => {
  const a = em(VERTICES, i), b = em(VERTICES, j), c = em(VERTICES, k);
  const frente = normalizar(centro(a, b, c));
  const direita = normalizar(cruzar(a, frente));
  const cima = cruzar(frente, direita);
  return VERTICES.map((v): Vetor => [produto(v, direita), produto(v, cima), produto(v, frente)]);
});

export const TAMANHO_DADO = 144;
const MEIO = TAMANHO_DADO / 2;
const LUZ = normalizar([-1, 1.4, 2.3]);
const OLHO = 7;

export function desenharIcosaedro(ctx: CanvasRenderingContext2D, valor: number, tom: number, progresso: number): void {
  const emGiro = (1 - progresso) ** 2;
  const x = emGiro * Math.PI * 4.4;
  const y = emGiro * Math.PI * 3.1;
  const cx = Math.cos(x), sx = Math.sin(x), cy = Math.cos(y), sy = Math.sin(y);
  const pontos = orientacoes[numeros.indexOf(valor)]?.map(([vx, vy, vz]): Vetor => {
    const z = vy * sx + vz * cx;
    return [vx * cy + z * sy, vy * cx - vz * sx, z * cy - vx * sy];
  });
  if (!pontos) return;
  const projetar = ([px, py, pz]: Vetor) => {
    const escala = 29 * OLHO / (OLHO - pz);
    return [MEIO + px * escala, MEIO - py * escala] as const;
  };
  ctx.clearRect(0, 0, TAMANHO_DADO, TAMANHO_DADO);
  ctx.lineJoin = 'round';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  FACES.forEach(([i, j, k], indice) => {
    const a = em(pontos, i), b = em(pontos, j), c = em(pontos, k);
    const meio = centro(a, b, c);
    const normal = normalizar(meio);
    if (OLHO * normal[2] <= produto(meio, normal)) return;
    const [ax, ay] = projetar(a), [bx, by] = projetar(b), [cxFace, cyFace] = projetar(c);
    const luz = Math.max(0, produto(normal, LUZ));
    const brilho = 18 + 33 * luz;
    const metal = ctx.createLinearGradient(ax, ay, (bx + cxFace) / 2, (by + cyFace) / 2);
    metal.addColorStop(0, `hsl(${tom}, 52%, ${brilho + 13}%)`);
    metal.addColorStop(0.56, `hsl(${tom}, 42%, ${brilho}%)`);
    metal.addColorStop(1, `hsl(${tom}, 44%, ${brilho - 9}%)`);
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.lineTo(cxFace, cyFace);
    ctx.closePath();
    ctx.fillStyle = metal;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = `hsl(${tom + 7}, 49%, ${brilho + 18}%)`;
    ctx.stroke();
    const [tx, ty] = projetar(meio);
    ctx.font = `700 ${Math.round(9 + 30 * normal[2] ** 2)}px "${FONTE_DO_JOGO}", Georgia, serif`;
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#231812';
    ctx.fillStyle = '#fff2d2';
    const numero = String(numeros[indice]);
    ctx.strokeText(numero, tx, ty);
    ctx.fillText(numero, tx, ty);
  });
}
