// As máscaras do chão texturizado (marco 31, 31/10/2026, D-130). Para cada bloco de 16×16 células, o peso de cada
// camada (a base do tema, o mato, a estrada, a água, a pedra da parede, o vazio) numa grade de amostras finas
// (`amostrasPorCelula`). O peso é a célula interpolada entre os centros, deslocada pelo ruído e afiada por
// `smoothstep`: a borda entre dois chãos vira uma curva macia, nunca a linha da célula. Mais três máscaras: as
// manchas da variação (que quebram a repetição da base), a oclusão junto às paredes e a sombra de escala grande.
// Tudo em coordenadas de mundo: o mesmo ponto dá o mesmo peso nos dois blocos vizinhos. Puro (testável no Node).
// Fora do exterior do Mundo (a campanha, as masmorras), o que fica além da borda andável é `vazio`: transparente,
// como antes (pedido do usuário, 31/10/2026); só a parede que encosta no chão leva a pedra.

import { chaoAberto, tipoEm, type Fase, type TipoCelula } from '../../world/fase';
import type { SoloTema, TexturaSolo } from '../../world/solo';
import { fbm, smoothstep } from './ruido';

/**
 * A camada pintada numa célula: uma textura, a água (cor), o escuro (a base das fachadas) ou o vazio (transparente:
 * além da borda andável, fora do exterior).
 */
export type CamadaSolo = TexturaSolo | 'agua' | 'escuro' | 'vazio';

export interface ConfigSolo {
  amostrasPorCelula: number;
  raioMistura: number;
  ruidoBorda: number;
  aoRaio: number;
  aoForca: number;
  macroForca: number;
  variacaoCobre: number;
}

export interface PesosDoBloco {
  /** Amostras por lado (largura e altura do bloco em células × amostras por célula). */
  largura: number;
  altura: number;
  /** Na ordem de pintura: a primeira cobre tudo; as outras, por cima, com o seu peso. */
  camadas: { camada: CamadaSolo; pesos: Float32Array }[];
  /** As manchas da textura de variação, sobre o chão de base. */
  variacao: Float32Array;
  /** O escurecimento junto às paredes (0 a `aoForca`). */
  ao: Float32Array;
  /** A sombra de escala grande (0 a `macroForca`). */
  macro: Float32Array;
}

const SEMENTE_BORDA_X = 101;
const SEMENTE_BORDA_Y = 211;
const SEMENTE_VARIACAO = 307;
const SEMENTE_MACRO = 401;
/** A faixa de mistura da parede, em fração da do chão. */
const FIRMEZA_PAREDE = 0.3;

/** Que camada pinta a célula, pelo tipo e pelo solo do tema. */
export function camadaDaCelula(tipo: TipoCelula, solo: SoloTema): CamadaSolo {
  switch (tipo) {
    case 'piso':
    case 'saida':
      return solo.base;
    case 'parede':
      return solo.parede;
    case 'mato':
      return solo.mato;
    case 'estrada':
      return 'estrada';
    case 'agua':
      return 'agua';
    default:
      return 'escuro';
  }
}

/** A parede que encosta (inclusive na diagonal) num chão andável: a borda visível da sala. */
function paredeDeBorda(fase: Fase, x: number, y: number): boolean {
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const t = tipoEm(fase, x + dx, y + dy);
    if (t === 'saida' || chaoAberto(t)) return true;
  }
  return false;
}

/** A camada da célula na fase: fora do exterior, a parede funda e o vazio ficam transparentes. */
function camadaNaFase(fase: Fase, x: number, y: number, solo: SoloTema): CamadaSolo {
  const tipo = tipoEm(fase, x, y);
  if (!fase.exterior && (tipo === 'vazio' || (tipo === 'parede' && !paredeDeBorda(fase, x, y)))) return 'vazio';
  return camadaDaCelula(tipo, solo);
}

/** Fecha a passagem: parede, vazio e a base da fachada (a oclusão escurece o chão junto a elas). */
const fechada = (tipo: TipoCelula) => tipo === 'parede' || tipo === 'vazio' || tipo === 'fachada';

/** A ordem de pintura: o chão de base embaixo; a parede e o escuro por último (cobrem as bordas). */
function ordem(c: CamadaSolo, solo: SoloTema): number {
  if (c === solo.base) return 0;
  if (c === 'agua') return 3;
  if (c === solo.parede) return 4;
  if (c === 'escuro') return 5;
  if (c === 'vazio') return 6;
  if (c === 'estrada') return 2;
  return 1;
}

/**
 * Os pesos de um bloco. `bx`, `by`: a célula do canto; `celulasX`, `celulasY`: o tamanho (o último bloco da linha
 * pode ser menor). `semente` vem da fase (o mesmo chão em toda montagem).
 */
export function pesosDoBloco(fase: Fase, solo: SoloTema, bx: number, by: number, celulasX: number, celulasY: number, cfg: ConfigSolo, semente: number): PesosDoBloco {
  const a = cfg.amostrasPorCelula;
  const largura = celulasX * a;
  const altura = celulasY * a;
  // A camada de cada célula do bloco e de uma borda de 2 (a interpolação e a oclusão olham os vizinhos).
  const borda = 2;
  const lc = celulasX + borda * 2;
  const ac = celulasY + borda * 2;
  const camadaEm: CamadaSolo[] = [];
  const fechadaEm: boolean[] = [];
  const presentes = new Set<CamadaSolo>();
  for (let y = 0; y < ac; y++) for (let x = 0; x < lc; x++) {
    const tipo = tipoEm(fase, bx + x - borda, by + y - borda);
    const c = camadaNaFase(fase, bx + x - borda, by + y - borda, solo);
    camadaEm.push(c);
    fechadaEm.push(fechada(tipo));
    presentes.add(c);
  }
  const lista = [...presentes].sort((p, q) => ordem(p, solo) - ordem(q, solo));
  const camadas = lista.map((camada) => ({ camada, pesos: new Float32Array(largura * altura) }));
  const variacao = new Float32Array(largura * altura);
  const ao = new Float32Array(largura * altura);
  const macro = new Float32Array(largura * altura);
  const base = lista[0];
  const k = cfg.raioMistura;
  const celula = (cx: number, cy: number) => {
    const ix = Math.max(0, Math.min(lc - 1, cx - bx + borda));
    const iy = Math.max(0, Math.min(ac - 1, cy - by + borda));
    return iy * lc + ix;
  };
  for (let j = 0; j < altura; j++) {
    for (let i = 0; i < largura; i++) {
      const u = bx + (i + 0.5) / a;
      const v = by + (j + 0.5) / a;
      // O ponto deslocado pelo ruído: a borda entre os chãos vira curva.
      const du = (fbm(u * 0.45, v * 0.45, semente + SEMENTE_BORDA_X) - 0.5) * 2 * cfg.ruidoBorda;
      const dv = (fbm(u * 0.45, v * 0.45, semente + SEMENTE_BORDA_Y) - 0.5) * 2 * cfg.ruidoBorda;
      const pu = u + du - 0.5;
      const pv = v + dv - 0.5;
      const x0 = Math.floor(pu);
      const y0 = Math.floor(pv);
      const tx = pu - x0;
      const ty = pv - y0;
      const n = j * largura + i;
      const c00 = camadaEm[celula(x0, y0)];
      const c10 = camadaEm[celula(x0 + 1, y0)];
      const c01 = camadaEm[celula(x0, y0 + 1)];
      const c11 = camadaEm[celula(x0 + 1, y0 + 1)];
      for (const { camada, pesos } of camadas) {
        if (camada === base) {
          pesos[n] = 1;
          continue;
        }
        // A célula interpolada entre os centros (bilinear) e afiada em volta de 0,5: a faixa de mistura tem 2k. A
        // borda da parede e do escuro é mais firme (a pedra não se mistura com o chão como a grama com a terra).
        const bil = (c00 === camada ? (1 - tx) * (1 - ty) : 0) + (c10 === camada ? tx * (1 - ty) : 0) + (c01 === camada ? (1 - tx) * ty : 0) + (c11 === camada ? tx * ty : 0);
        const kc = camada === solo.parede || camada === 'escuro' || camada === 'vazio' ? k * FIRMEZA_PAREDE : k;
        pesos[n] = bil === 0 ? 0 : smoothstep(0.5 - kc, 0.5 + kc, bil);
      }
      // As manchas da variação: ruído de escala média, só sobre a base.
      const cobertura = fbm(u * 0.18, v * 0.18, semente + SEMENTE_VARIACAO);
      const limiar = 1 - cfg.variacaoCobre;
      const ehBase = camadaEm[celula(Math.floor(u), Math.floor(v))] === base;
      variacao[n] = ehBase ? smoothstep(limiar - 0.08, limiar + 0.08, cobertura) * 0.85 : 0;
      // A oclusão: a distância do ponto à célula fechada mais perto (até 2 células).
      if (!fechadaEm[celula(Math.floor(u), Math.floor(v))]) {
        let d = 9;
        for (let cy = Math.floor(v) - 2; cy <= Math.floor(v) + 2; cy++) {
          for (let cx = Math.floor(u) - 2; cx <= Math.floor(u) + 2; cx++) {
            if (!fechadaEm[celula(cx, cy)]) continue;
            const ex = Math.max(cx - u, 0, u - (cx + 1));
            const ey = Math.max(cy - v, 0, v - (cy + 1));
            d = Math.min(d, Math.hypot(ex, ey));
          }
        }
        ao[n] = cfg.aoForca * (1 - smoothstep(0, cfg.aoRaio, d)) * (0.85 + 0.3 * fbm(u * 1.3, v * 1.3, semente + 3));
      }
      macro[n] = cfg.macroForca * smoothstep(0.35, 0.75, fbm(u * 0.07, v * 0.07, semente + SEMENTE_MACRO));
    }
  }
  return { largura, altura, camadas, variacao, ao, macro };
}
