// Paredes em bloco no isométrico (§2.16). Marco 13 (14/10/2026), D-058.
// Marco 26 (25/10/2026, D-106): placas finas e baixas em vez do prisma da célula inteira — 0,2 célula de espessura
// (80% mais fina) e 0,18 de altura (70% mais baixa que 0,6), ao longo de cada aresta entre parede e chão, dentro da
// célula de parede: a face fica na aresta, onde o corpo do personagem encosta. Nas quinas, um bloquinho 0,2 × 0,2
// fecha a placa. As faces da frente no tom do topo da fase (com o matiz), a de cima escura. O resto da célula de
// parede é a rocha plana e escura do terreno, como na visão de cima. Desenhadas por diagonal (um Graphics por x + y),
// na mesma camada das entidades e com o `zIndex` da diagonal: quem passa atrás de uma parede fica atrás dela.
// De cima, as paredes continuam no terreno, como antes.
// Marco 31 (31/10/2026, D-130, revê o D-106 a pedido do usuário): paredes altas como no Diablo (`visual.paredeIso.
// altura`, 1,15 célula) e um pouco mais grossas (0,3), com as faces na textura de pedra do tema (inclinada pela face,
// as juntas seguem a diagonal) e sem contorno. Com o jogador numa sala ou corredor, somem as paredes da frente de todo o
// chão que ele alcança andando até `alcanceSala` passos (`paredesDaSala`): a sala inteira e um pouco além, estável
// enquanto ele anda (só muda ao trocar de célula, e a borda fica longe dele). Os Graphics são por diagonal e por faixa
// de 2 células da tela.

import { FillPattern, Graphics, Matrix, type Container, type Texture } from 'pixi.js';
import { ehPilar } from '../world/decoracao';
import { chaoAberto, tipoEm, type Fase } from '../world/fase';
import { CELULA_PX } from './camera-calculo';
import { clarear, escurecer } from './modelos/svg';
import { profundidade, type Projecao } from './projecao';

/** Espessura da placa, em células. */
export const ESPESSURA_PAREDE = 0.3;
/** A largura (em x - y, células) de cada faixa de parede: o esmaecimento acende ou apaga uma faixa inteira. */
const FAIXA = 2;
/** Quantas células da textura de pedra cabem numa repetição (na horizontal e na vertical). */
const CELULAS_POR_TEXTURA = 2;
/** Quanto do caminho até o alfa alvo o esmaecimento anda por segundo (rápido, sem piscar). */
const VELOCIDADE_FADE = 8;

export interface OpcoesParedesIso {
  /** A cor das faces (a do topo da parede do tema, ou a do tileset do jogador). */
  cor: number;
  /** A pedra das faces (null: cor lisa). */
  textura: Texture | null;
  /** Altura em células. */
  altura: number;
  /** Até quantos passos de chão a partir do jogador as paredes da frente somem, e até que alfa. */
  alcanceSala: number;
  alphaFade: number;
}

/**
 * A pedra numa face vertical: a textura corre ao longo da aresta (`eixoX`: a face sul, ao longo de x; senão a leste,
 * ao longo de y) e cai na vertical, `CELULAS_POR_TEXTURA` células por repetição. Também usada nas fachadas.
 */
export function pedraDaFace(textura: Texture, p: Projecao, eixoX: boolean): FillPattern {
  const origem = p.projetar(0, 0);
  const passo = eixoX ? p.projetar(CELULA_PX, 0) : p.projetar(0, CELULA_PX);
  const k = 1 / (textura.width / CELULAS_POR_TEXTURA);
  const m = new Matrix((passo.x - origem.x) * k, (passo.y - origem.y) * k, 0, CELULA_PX * k, origem.x, origem.y);
  const f = new FillPattern(textura, 'repeat');
  f.setTransform(m);
  return f;
}

/** Uma faixa de parede e as células de parede dela (índices `y·largura + x`). */
interface Faixa {
  g: Graphics;
  celulas: number[];
}

const ehParede = (fase: Fase, x: number, y: number) => tipoEm(fase, x, y) === 'parede';
const deAndar = (fase: Fase, x: number, y: number) => {
  const tipo = tipoEm(fase, x, y);
  // Marco 29 (D-128): o chão do exterior (mato e estrada) também levanta a borda das rochas e dos muros.
  return tipo === 'saida' || chaoAberto(tipo);
};

/**
 * Marco 31 (D-130): as paredes que somem com o jogador na célula (cx, cy). Anda pelo chão (4 vizinhos) até `alcance`
 * passos; de cada célula alcançada, as paredes vizinhas (8) mais à frente na tela (diagonal x + y maior) são as que
 * podem cobri-la. Fora do chão (numa porta, por exemplo), nenhuma. Puro.
 */
export function paredesDaSala(fase: Fase, cx: number, cy: number, alcance: number): Set<number> {
  const paredes = new Set<number>();
  if (!deAndar(fase, cx, cy)) return paredes;
  const n = fase.largura;
  const passos = new Map<number, number>([[cy * n + cx, 0]]);
  const fila = [cy * n + cx];
  for (let i = 0; i < fila.length; i++) {
    const k = fila[i] as number;
    const x = k % n;
    const y = (k - x) / n;
    const dist = passos.get(k) ?? 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx + dy > 0 && ehParede(fase, x + dx, y + dy)) paredes.add((y + dy) * n + x + dx);
      }
    }
    if (dist >= alcance) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = x + dx;
      const ny = y + dy;
      const nk = ny * n + nx;
      if (passos.has(nk) || !deAndar(fase, nx, ny)) continue;
      passos.set(nk, dist + 1);
      fila.push(nk);
    }
  }
  return paredes;
}

/** Parede que encosta (inclusive na diagonal) num piso ou numa saída: a borda visível da sala. */
export function paredeDeBorda(fase: Fase, x: number, y: number): boolean {
  if (!ehParede(fase, x, y)) return false;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) if ((dx !== 0 || dy !== 0) && deAndar(fase, x + dx, y + dy)) return true;
  }
  return false;
}

/** Uma placa dentro da célula de parede, em frações da célula, e quais faces da frente aparecem. */
export interface Placa {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  frenteSul: boolean;
  frenteLeste: boolean;
}

/**
 * Marco 26 (D-106): as placas de uma célula de parede, de trás para a frente: uma por aresta que encosta em chão e um
 * bloquinho em cada quina que só toca chão na diagonal. Uma face da frente some quando a célula vizinha daquele lado
 * é parede: ali a placa continua (ou vira a quina) e a face ficaria escondida.
 */
export function placasDaParede(fase: Fase, x: number, y: number): Placa[] {
  // Marco 26 (D-109): o pilar não ganha placas; fica de pé como coluna alta (render/decoracao-iso.ts).
  if (!ehParede(fase, x, y) || ehPilar(fase, x, y)) return [];
  const t = ESPESSURA_PAREDE;
  const chao = (dx: number, dy: number) => deAndar(fase, x + dx, y + dy);
  const abertoSul = !ehParede(fase, x, y + 1);
  const abertoLeste = !ehParede(fase, x + 1, y);
  const norte = chao(0, -1);
  const oeste = chao(-1, 0);
  const leste = chao(1, 0);
  const sul = chao(0, 1);
  const placas: Placa[] = [];
  const placa = (x0: number, y0: number, x1: number, y1: number, frenteSul: boolean, frenteLeste: boolean) => {
    placas.push({ x0, y0, x1, y1, frenteSul, frenteLeste });
  };
  // Marco 31 (31/10/2026, D-130): o muro de uma célula, com chão dos dois lados (o muro da vila, as casas, a parede
  // fina entre duas salas), vira uma só parede fina pelo meio da célula, com braços até as paredes vizinhas: duas
  // placas nas arestas, com um vão no meio, pareciam duas paredes.
  const opostos = (norte && sul) || (leste && oeste) || (chao(-1, -1) && chao(1, 1)) || (chao(1, -1) && chao(-1, 1));
  if (opostos) return placasDoMeio(fase, x, y, t);
  if (norte) placa(0, 0, 1, t, true, abertoLeste);
  if (oeste) placa(0, 0, t, 1, abertoSul, true);
  if (!norte && !oeste && chao(-1, -1)) placa(0, 0, t, t, true, true);
  if (!norte && !leste && chao(1, -1)) placa(1 - t, 0, 1, t, true, abertoLeste);
  if (!sul && !oeste && chao(-1, 1)) placa(0, 1 - t, t, 1, abertoSul, true);
  if (leste) placa(1 - t, 0, 1, 1, abertoSul, true);
  if (sul) placa(0, 1 - t, 1, 1, true, abertoLeste);
  if (!sul && !leste && chao(1, 1)) placa(1 - t, 1 - t, 1, 1, true, true);
  return placas;
}

/**
 * Marco 31 (D-130): a parede fina pelo meio da célula: o braço de trás (norte), a barra de oeste a leste (só o miolo
 * quando não há parede dos lados) e o braço da frente (sul), cada braço só até a parede vizinha daquele lado.
 */
function placasDoMeio(fase: Fase, x: number, y: number, t: number): Placa[] {
  const a = 0.5 - t / 2;
  const b = 0.5 + t / 2;
  const norte = ehParede(fase, x, y - 1);
  const sul = ehParede(fase, x, y + 1);
  const oeste = ehParede(fase, x - 1, y);
  const leste = ehParede(fase, x + 1, y);
  const placas: Placa[] = [];
  if (norte) placas.push({ x0: a, y0: 0, x1: b, y1: a, frenteSul: false, frenteLeste: true });
  placas.push({ x0: oeste ? 0 : a, y0: a, x1: leste ? 1 : b, y1: b, frenteSul: true, frenteLeste: !leste });
  if (sul) placas.push({ x0: a, y0: b, x1: b, y1: 1, frenteSul: false, frenteLeste: true });
  return placas;
}

export interface ParedesIso {
  /** Marco 31 (D-130): a parede da frente esmaece perto do jogador (em células; null sem jogador). */
  esmaecer: (jogador: { x: number; y: number } | null, dtMs: number) => void;
  destruir: () => void;
}

/** Marco 11A: `o.cor` (a cor média da parede do tileset do jogador) substitui a paleta da fase. */
export function criarParedesIso(camada: Container, fase: Fase, p: Projecao, o: OpcoesParedesIso): ParedesIso {
  const base = o.cor;
  const topo = escurecer(base, 0.55);
  const esquerda = escurecer(base, 0.05);
  const direita = escurecer(base, 0.35);
  const h = o.altura * CELULA_PX;
  const canto = (x: number, y: number) => p.projetar(x * CELULA_PX, y * CELULA_PX);
  const pedraSul = o.textura ? pedraDaFace(o.textura, p, true) : null;
  const pedraLeste = o.textura ? pedraDaFace(o.textura, p, false) : null;
  const face = (pedra: FillPattern | null, cor: number) => (pedra ? { fill: pedra, color: cor } : { color: cor });
  /** Caixa [x0, x1] × [y0, y1] (em células) com altura `h`; as faces da frente só se não houver placa encostada. */
  const caixa = (g: Graphics, x0: number, y0: number, x1: number, y1: number, frenteSul: boolean, frenteLeste: boolean) => {
    const n = canto(x0, y0);
    const l = canto(x1, y0);
    const s = canto(x1, y1);
    const ponto = canto(x0, y1);
    if (frenteSul) g.poly([ponto.x, ponto.y, s.x, s.y, s.x, s.y - h, ponto.x, ponto.y - h]).fill(face(pedraSul, esquerda));
    if (frenteLeste) g.poly([s.x, s.y, l.x, l.y, l.x, l.y - h, s.x, s.y - h]).fill(face(pedraLeste, direita));
    g.poly([n.x, n.y - h, l.x, l.y - h, s.x, s.y - h, ponto.x, ponto.y - h]).fill(topo);
    // A aresta de cima das faces, um pouco mais clara: dá o volume da pedra.
    if (frenteSul) g.moveTo(ponto.x, ponto.y - h).lineTo(s.x, s.y - h).stroke({ width: 1, color: clarear(base, 0.2), alpha: 0.35 });
  };
  const faixas: Faixa[] = [];
  for (let d = 0; d <= fase.largura + fase.altura - 2; d++) {
    const porFaixa = new Map<number, Faixa>();
    for (let x = Math.max(0, d - fase.altura + 1); x <= Math.min(d, fase.largura - 1); x++) {
      const y = d - x;
      const placas = placasDaParede(fase, x, y);
      if (placas.length === 0) continue;
      const chave = Math.floor((x - y) / FAIXA);
      let f = porFaixa.get(chave);
      if (!f) {
        f = { g: new Graphics(), celulas: [] };
        porFaixa.set(chave, f);
      }
      f.celulas.push(y * fase.largura + x);
      for (const pl of placas) caixa(f.g, x + pl.x0, y + pl.y0, x + pl.x1, y + pl.y1, pl.frenteSul, pl.frenteLeste);
    }
    for (const [chave, f] of porFaixa) {
      // Um pouco antes da diagonal: quem está na mesma diagonal é desenhado por cima.
      f.g.zIndex = profundidade(p, d, 0) - 0.01;
      f.g.label = `paredes-${d}-${chave}`;
      camada.addChild(f.g);
      faixas.push(f);
    }
  }
  // O conjunto da sala só é refeito quando o jogador troca de célula.
  let celulaJogador = -1;
  let somem = new Set<number>();
  return {
    esmaecer: (jogador, dtMs) => {
      const cx = jogador ? Math.floor(jogador.x + 0.5) : -1;
      const cy = jogador ? Math.floor(jogador.y + 0.5) : -1;
      const celula = jogador ? cy * fase.largura + cx : -1;
      if (celula !== celulaJogador) {
        celulaJogador = celula;
        // Na porta (fora do chão), a sala de antes continua.
        const nova = jogador ? paredesDaSala(fase, cx, cy, o.alcanceSala) : new Set<number>();
        if (!jogador || nova.size > 0) somem = nova;
      }
      const passo = Math.min(1, (VELOCIDADE_FADE * dtMs) / 1000);
      for (const f of faixas) {
        const alvo = f.celulas.some((c) => somem.has(c)) ? o.alphaFade : 1;
        if (f.g.alpha !== alvo) f.g.alpha = Math.abs(alvo - f.g.alpha) < 0.01 ? alvo : f.g.alpha + (alvo - f.g.alpha) * passo;
      }
    },
    destruir: () => {
      for (const f of faixas) f.g.destroy();
      faixas.length = 0;
    },
  };
}
