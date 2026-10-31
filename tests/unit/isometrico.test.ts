// Marco 13 (14/10/2026), D-058: projeção, câmera nas duas visões, profundidade, caminhada por fatias, token por
// imagem, atlas dos modelos e a garantia de que a visão não muda o jogo.

import { describe, expect, it } from 'vitest';
import type { ComandoDoTick, Dir8 } from '../../src/core/comandos';
import { digest } from '../../src/core/digest';
import { rumoDaTela } from '../../src/input/direcao';
import { normalizarPreferencias } from '../../src/plataforma/preferencias';
import { alturaDaTira, pose, TIRAS, type EntradaPose, type EstiloCaminhada } from '../../src/render/caminhada';
import { Camera } from '../../src/render/camera';
import { CELULA_PX } from '../../src/render/camera-calculo';
import { chaveQuadro, gerarAtlas, LADO_PX, VISTAS } from '../../src/render/modelos/atlas';
import { ehModelo, MODELO_JOGADOR, MODELOS } from '../../src/render/modelos';
import { ESPESSURA_PAREDE, paredesDaSala, paredeDeBorda, placasDaParede } from '../../src/render/paredes-iso';
import { alfaDoTelhado, dentroDoTelhado } from '../../src/render/telhados-iso';
import type { Telhado } from '../../src/world/fase';
import balance from '../../src/data/balance.json';
import { celulaSobProjetado, centroDaCelula, criarProjecao, profundidade, type Visao } from '../../src/render/projecao';
import { caixaVisivel, encaixar, LIMITE_BYTES, validarArquivo, validarDimensoes } from '../../src/render/token-imagem';
import { criarBotAleatorio, criarCenario, rodar, type Produtor } from '../sim/harness';
import { CONTEUDO, faseDeTexto } from '../apoio/fases';

const VISOES: readonly Visao[] = ['cima', 'iso'];
const DIRECOES: readonly Dir8[] = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];

describe('projeção (§2.16, §4.5)', () => {
  it('ida e volta em todas as células de uma fase 60×40, nas duas visões', () => {
    for (const v of VISOES) {
      const p = criarProjecao(v, 60, 40);
      for (let y = 0; y < 40; y++) {
        for (let x = 0; x < 60; x++) {
          const c = centroDaCelula(x, y);
          const t = p.projetar(c.x, c.y);
          const volta = p.desprojetar(t.x, t.y);
          expect(volta.x).toBeCloseTo(c.x, 6);
          expect(volta.y).toBeCloseTo(c.y, 6);
          expect(celulaSobProjetado(p, t.x, t.y)).toEqual({ x, y });
        }
      }
    }
  });

  it('o mundo projetado cabe em [0, largura] × [0, altura]; de cima é a identidade', () => {
    const cima = criarProjecao('cima', 60, 40);
    expect([cima.largura, cima.altura]).toEqual([60 * CELULA_PX, 40 * CELULA_PX]);
    expect(cima.projetar(10, 20)).toEqual({ x: 10, y: 20 });
    const iso = criarProjecao('iso', 60, 40);
    for (const [x, y] of [[0, 0], [60, 0], [0, 40], [60, 40]] as const) {
      const t = iso.projetar(x * CELULA_PX, y * CELULA_PX);
      expect(t.x).toBeGreaterThanOrEqual(-1e-9);
      expect(t.x).toBeLessThanOrEqual(iso.largura + 1e-9);
      expect(t.y).toBeGreaterThanOrEqual(-1e-9);
      expect(t.y).toBeLessThanOrEqual(iso.altura + 1e-9);
    }
    // 2:1: a célula vira um losango duas vezes mais largo que alto.
    const n = iso.projetar(0, 0);
    const l = iso.projetar(CELULA_PX, 0);
    const s = iso.projetar(CELULA_PX, CELULA_PX);
    const o = iso.projetar(0, CELULA_PX);
    expect((l.x - o.x) / (s.y - n.y)).toBeCloseTo(2, 9);
  });

  it('a matriz do chão é a mesma projeção (o que está no plano e o que está em pé se alinham)', () => {
    for (const v of VISOES) {
      const p = criarProjecao(v, 30, 20);
      const m = p.matriz;
      for (const [x, y] of [[0, 0], [100, 37], [1440, 960], [-5, 12]] as const) {
        const t = p.projetar(x, y);
        expect(m.a * x + m.c * y + m.tx).toBeCloseTo(t.x, 9);
        expect(m.b * x + m.d * y + m.ty).toBeCloseTo(t.y, 9);
      }
    }
  });

  it('no isométrico, "para cima" no teclado anda para cima na tela, nas 8 direções', () => {
    const p = criarProjecao('iso', 20, 20);
    const tela: Readonly<Record<Dir8, readonly [number, number]>> = { N: [0, -1], NE: [1, -1], E: [1, 0], SE: [1, 1], S: [0, 1], SO: [-1, 1], O: [-1, 0], NO: [-1, -1] };
    for (const d of DIRECOES) {
      const g = rumoDaTela(d, true);
      if (g.dir === 'parado') throw new Error('sem direção');
      const a = p.projetar(0, 0);
      const b = p.projetar(g.dx, g.dy);
      const angTela = Math.atan2(b.y - a.y, b.x - a.x);
      const angPedido = Math.atan2(tela[d][1], tela[d][0]);
      // Marco 26 (D-105): pela inversa da projeção, o andar na tela é o pedido (só o arredondamento em ±1000).
      expect(Math.abs(Math.atan2(Math.sin(angTela - angPedido), Math.cos(angTela - angPedido)))).toBeLessThan(0.002);
    }
  });
});

describe('câmera nas duas visões', () => {
  it('clicar no centro projetado de uma célula devolve a mesma célula, com zoom e deslocamento', () => {
    for (const v of VISOES) {
      const cam = new Camera(criarProjecao(v, 60, 40), 'janela', false);
      cam.definirVista({ largura: 1280, altura: 720 });
      cam.zoomEm(1.7, 300, 200);
      cam.centralizar({ x: 31, y: 17 });
      for (const c of [{ x: 31, y: 17 }, { x: 28, y: 20 }, { x: 35, y: 14 }]) {
        const t = cam.paraTela(c.x, c.y);
        expect(cam.celulaSob(t.x, t.y)).toEqual(c);
      }
    }
  });

  it('trocar a visão mantém o mesmo ponto da fase no centro da vista', () => {
    const cam = new Camera(criarProjecao('cima', 60, 40), 'janela', false);
    cam.definirVista({ largura: 800, altura: 600 });
    cam.centralizar({ x: 30, y: 20 });
    cam.definirProjecao(criarProjecao('iso', 60, 40));
    expect(cam.celulaSob(400, 300)).toEqual({ x: 30, y: 20 });
    cam.definirProjecao(criarProjecao('cima', 60, 40));
    expect(cam.celulaSob(400, 300)).toEqual({ x: 30, y: 20 });
  });

  it('o retângulo visível (descarte do terreno) cobre os quatro cantos da vista', () => {
    const cam = new Camera(criarProjecao('iso', 60, 40), 'janela', false);
    cam.definirVista({ largura: 800, altura: 600 });
    cam.centralizar({ x: 30, y: 20 });
    const [x0, y0, x1, y1] = cam.retanguloVisivel(600);
    for (const [sx, sy] of [[0, 0], [800, 0], [0, 600], [800, 600]] as const) {
      const c = cam.celulaSob(sx, sy);
      expect(c.x * CELULA_PX).toBeGreaterThanOrEqual(Math.floor(x0) - CELULA_PX);
      expect(c.x * CELULA_PX).toBeLessThanOrEqual(x1);
      expect(c.y * CELULA_PX).toBeGreaterThanOrEqual(Math.floor(y0) - CELULA_PX);
      expect(c.y * CELULA_PX).toBeLessThanOrEqual(y1);
    }
  });
});

describe('profundidade e paredes em prisma', () => {
  it('quem está numa diagonal maior fica na frente; a parede da mesma diagonal fica atrás', () => {
    const p = criarProjecao('iso', 20, 20);
    const parede = (d: number) => profundidade(p, d, 0) - 0.01;
    expect(profundidade(p, 5, 6)).toBeGreaterThan(parede(10));
    expect(profundidade(p, 5, 4)).toBeLessThan(parede(10));
    expect(profundidade(p, 3, 7)).toBeGreaterThan(parede(10));
    // De cima, a profundidade é o Y: a ordem de antes.
    const cima = criarProjecao('cima', 20, 20);
    expect(profundidade(cima, 9, 3)).toBeLessThan(profundidade(cima, 0, 4));
  });

  it('só a parede que encosta num piso vira prisma; a rocha de dentro fica plana', () => {
    const fase = faseDeTexto(['#####', '#####', '##..#', '#####']);
    expect(paredeDeBorda(fase, 0, 0)).toBe(false);
    expect(paredeDeBorda(fase, 1, 1)).toBe(true); // diagonal do piso
    expect(paredeDeBorda(fase, 2, 1)).toBe(true);
    expect(paredeDeBorda(fase, 2, 2)).toBe(false); // é piso
    expect(paredeDeBorda(fase, 4, 0)).toBe(false);
  });

  it('marco 31 (D-130, revê o D-106): placas de 0,3 e altas (1,15 célula), na aresta que encosta no chão', () => {
    expect(ESPESSURA_PAREDE).toBeCloseTo(0.3);
    expect(balance.visual.paredeIso.altura).toBeCloseTo(1.15);
    // Sala 2×1 em (2..3, 2): a parede de cima tem a placa na aresta sul; a da esquerda, na leste.
    const fase = faseDeTexto(['#####', '#####', '##..#', '#####']);
    expect(placasDaParede(fase, 2, 1)).toEqual([{ x0: 0, y0: 0.7, x1: 1, y1: 1, frenteSul: true, frenteLeste: false }]);
    expect(placasDaParede(fase, 1, 2)).toEqual([{ x0: 0.7, y0: 0, x1: 1, y1: 1, frenteSul: false, frenteLeste: true }]);
    // A quina que só toca o chão na diagonal fecha com um bloquinho 0,3 × 0,3.
    expect(placasDaParede(fase, 1, 1)).toEqual([{ x0: 0.7, y0: 0.7, x1: 1, y1: 1, frenteSul: true, frenteLeste: true }]);
    expect(placasDaParede(fase, 0, 0)).toEqual([]);
    expect(placasDaParede(fase, 2, 2)).toEqual([]);
  });

  it('marco 31 (D-130): o muro de uma célula com chão dos dois lados é uma parede fina pelo meio', () => {
    // Muro horizontal entre duas salas e a quina de um muro em diagonal (chão em cantos opostos).
    const fase = faseDeTexto(['#####', '#...#', '#####', '#...#', '#####']);
    expect(placasDaParede(fase, 2, 2)).toEqual([{ x0: 0, y0: 0.35, x1: 1, y1: 0.65, frenteSul: true, frenteLeste: false }]);
    const diagonal = faseDeTexto(['#####', '#.###', '#####', '###.#', '#####']);
    expect(placasDaParede(diagonal, 2, 2)).toEqual([
      { x0: 0.35, y0: 0, x1: 0.65, y1: 0.35, frenteSul: false, frenteLeste: true },
      { x0: 0, y0: 0.35, x1: 1, y1: 0.65, frenteSul: true, frenteLeste: false },
      { x0: 0.35, y0: 0.65, x1: 0.65, y1: 1, frenteSul: false, frenteLeste: true },
    ]);
  });

  it('marco 31 (D-130): somem as paredes da frente da sala inteira, não as das outras salas', () => {
    // Duas salas ligadas por uma porta na parede do meio (linha 3); o jogador na de cima.
    const fase = faseDeTexto(['#######', '#.....#', '#.....#', '###.###', '#.....#', '#.....#', '#######']);
    const n = fase.largura;
    const somem = paredesDaSala(fase, 1, 1, 6);
    // A parede do meio, à frente da sala de cima, some; a de cima (atrás da sala) não.
    expect(somem.has(3 * n + 1)).toBe(true);
    expect(somem.has(3 * n + 5)).toBe(true);
    expect(somem.has(0 * n + 2)).toBe(false);
    // Com alcance 6, o fundo da sala de baixo fica longe: a parede da frente dela continua.
    expect(somem.has(6 * n + 1)).toBe(false);
    // Andar dentro da sala não muda o conjunto das paredes dela (só a borda do alcance, longe).
    const outra = paredesDaSala(fase, 2, 1, 6);
    expect(outra.has(3 * n + 1)).toBe(true);
    expect(paredesDaSala(fase, 0, 0, 3).size).toBe(0);
  });

  it('marco 31 (D-130): o telhado `perto` some de perto; o `dentro`, só ao entrar', () => {
    const casa: Telhado = { x: 10, y: 10, largura: 6, altura: 5, revela: 'dentro', estilo: 'palha' };
    const vila: Telhado = { ...casa, revela: 'perto', estilo: 'telha' };
    const perto = balance.visual.paredeIso.telhadoPerto;
    expect(dentroDoTelhado(casa, 12, 12)).toBe(true);
    expect(dentroDoTelhado(casa, 10, 12)).toBe(false); // na parede
    expect(alfaDoTelhado(casa, { x: 13, y: 16 }, perto)).toBe(1); // à porta, ainda fora
    expect(alfaDoTelhado(casa, { x: 13, y: 12 }, perto)).toBe(0);
    expect(alfaDoTelhado(vila, { x: 13, y: 16 }, perto)).toBeLessThan(0.5);
    expect(alfaDoTelhado(vila, { x: 13, y: 16 + perto + 1 }, perto)).toBe(1);
    expect(alfaDoTelhado(vila, null, perto)).toBe(1);
  });
});

describe('caminhada por fatias (§2.16)', () => {
  const base: EntradaPose = { estilo: 'passada', tMs: 1234, andando: true, ataqueMs: null, fase: 0, tiras: true, reduzido: false };

  it('é determinística pelo tempo e tem 18 tiras', () => {
    expect(pose(base)).toEqual(pose({ ...base }));
    expect(pose(base).tiras).toHaveLength(TIRAS);
    expect(alturaDaTira(0)).toBeGreaterThan(alturaDaTira(TIRAS - 1));
  });

  it('bípede: abaixo do corte, duas colunas em fase oposta; acima, sem colunas', () => {
    for (const estilo of ['passada', 'marcha'] as const) {
      const p = pose({ ...base, estilo, tMs: 95 });
      const pernas = p.tiras.filter((t) => t.colunas);
      expect(pernas.length).toBeGreaterThan(0);
      for (const t of pernas) {
        if (!t.colunas) continue;
        expect(t.colunas.esquerda.dx).toBeCloseTo(-t.colunas.direita.dx, 12);
      }
      expect(p.tiras[0]?.colunas).toBeNull();
    }
  });

  it('cada estilo tem o seu motor; flutuar paira mesmo parado', () => {
    const estilos: EstiloCaminhada[] = ['quique', 'passada', 'marcha', 'flutuar', 'deslizar'];
    const assinaturas = new Set(estilos.map((estilo) => JSON.stringify(pose({ ...base, estilo, tMs: 333 }))));
    expect(assinaturas.size).toBe(estilos.length);
    const parado = pose({ ...base, estilo: 'flutuar', andando: false, tMs: 700 });
    expect(parado.dy).toBeLessThan(0);
    // O quique sobe e desce.
    expect(pose({ ...base, estilo: 'quique', tMs: 105 }).dy).toBeLessThan(0);
  });

  it('ataque: empurrão até 0,20 da largura e esticamento até 1,06 em 400 ms, igual para todos', () => {
    for (const estilo of ['quique', 'passada', 'deslizar'] as const) {
      const meio = pose({ ...base, estilo, ataqueMs: 200 });
      expect(meio.empurrao).toBeCloseTo(0.2, 9);
      expect(meio.escalaY).toBeCloseTo(1.06, 9);
      expect(pose({ ...base, estilo, ataqueMs: 0 }).empurrao).toBeCloseTo(0, 9);
    }
  });

  it('atalho de qualidade: um desenho só; movimento reduzido: parado', () => {
    expect(pose({ ...base, tiras: false }).tiras).toEqual([]);
    const reduzida = pose({ ...base, reduzido: true });
    expect([reduzida.dy, reduzida.empurrao, reduzida.rotacao, reduzida.escalaX, reduzida.escalaY]).toEqual([0, 0, 0, 1, 1]);
    expect(reduzida.tiras.every((t) => t.dx === 0 && t.dy === 0 && !t.colunas)).toBe(true);
  });
});

describe('personagem por imagem', () => {
  const imagem = (l: number, a: number, visiveis: readonly [number, number][]) => {
    const d = new Uint8ClampedArray(l * a * 4);
    for (const [x, y] of visiveis) d[(y * l + x) * 4 + 3] = 255;
    return d;
  };

  it('recorta a transparência pela caixa dos pixels visíveis', () => {
    expect(caixaVisivel(imagem(10, 8, [[3, 2], [6, 5], [4, 4]]), 10, 8)).toEqual({ x: 3, y: 2, l: 4, a: 4 });
    expect(caixaVisivel(imagem(4, 4, [[0, 0]]), 4, 4)).toEqual({ x: 0, y: 0, l: 1, a: 1 });
    // Borda quase transparente (antialias) não conta.
    const quase = imagem(4, 4, [[1, 1]]);
    quase[(3 * 4 + 3) * 4 + 3] = 3;
    expect(caixaVisivel(quase, 4, 4)).toEqual({ x: 1, y: 1, l: 1, a: 1 });
  });

  it('recusa vazia, gigante, de formato estranho e corrompida', () => {
    expect(caixaVisivel(new Uint8ClampedArray(16 * 4), 4, 4)).toBeNull();
    expect(validarArquivo('image/png', 1000)).toBeNull();
    expect(validarArquivo('image/svg+xml', 1000)).toBe('formato');
    expect(validarArquivo('text/plain', 10)).toBe('formato');
    expect(validarArquivo('image/png', LIMITE_BYTES + 1)).toBe('grande');
    expect(validarArquivo('image/webp', 0)).toBe('corrompida');
    expect(validarDimensoes(1024, 1024)).toBeNull();
    expect(validarDimensoes(1025, 10)).toBe('dimensoes');
    expect(validarDimensoes(0, 10)).toBe('corrompida');
  });

  it('normaliza a altura para 1,12 célula com origem nos pés', () => {
    const e = encaixar({ x: 0, y: 0, l: 50, a: 200 }, CELULA_PX * 1.12);
    expect(e.escala * 200).toBeCloseTo(CELULA_PX * 1.12, 9);
    expect([e.ancoraX, e.ancoraY]).toEqual([0.5, 1]);
  });

  it('a aparência é preferência normalizada', () => {
    expect(normalizarPreferencias({ tamanhoToken: 2, sentidoToken: 'esquerda' })).toMatchObject({ tamanhoToken: 1.3, sentidoToken: 'esquerda' });
    expect(normalizarPreferencias({ tamanhoToken: 'x' })).toMatchObject({ tamanhoToken: 1, sentidoToken: 'direita' });
    // Marco 31 (D-130): o jogo é só isométrico; a visão guardada antes some das preferências.
    expect(normalizarPreferencias({ visao: 'cima', versaoVisual: 1 })).not.toHaveProperty('visao');
  });
});

describe('atlas dos modelos (gerado no build)', () => {
  const atlas = gerarAtlas();

  it('todo modelo dos presets, das classes e o do jogador existem, nas duas vistas', () => {
    // Marco 14: os modelos das classes jogáveis também.
    const usados = new Set([...[...CONTEUDO.presets.values()].map((p) => p.modelo), ...[...CONTEUDO.classes.values()].map((c) => c.modelo)]);
    for (const m of [...usados, MODELO_JOGADOR]) {
      expect(ehModelo(m), m).toBe(true);
      if (!ehModelo(m)) continue;
      for (const v of VISTAS) for (let q = 0; q < MODELOS[m].quadros; q++) expect(atlas.quadros[chaveQuadro(m, v, q)], `${m}/${v}/${q}`).toBeDefined();
    }
    // Os 11 da spec.
    for (const m of ['goblin', 'esqueleto', 'orc', 'troll', 'vampiro', 'demonio', 'generico', 'lobo', 'aranha', 'slime', 'cultista']) expect(ehModelo(m), m).toBe(true);
    // Marco 26 (D-108): os quadros de braços e pernas (parado, quatro da passada e o golpe); o falcão segue com as asas.
    expect(MODELOS.aventureiro.quadros).toBe(6);
    expect(MODELOS.falcao.membros).toBe(false);
    for (const m of Object.values(MODELOS)) if (m.membros) expect(m.quadros).toBe(6);
    expect(Math.max(atlas.largura, atlas.altura)).toBeLessThanOrEqual(4096);
  });

  it('o JSON aponta quadros dentro da imagem, sem sobreposição, e o SVG é limpo', () => {
    const quadros = Object.values(atlas.quadros);
    expect(quadros.length).toBe(Object.values(MODELOS).reduce((s, m) => s + m.quadros * VISTAS.length, 0));
    const cantos = new Set<string>();
    for (const q of quadros) {
      expect(q.x + q.l).toBeLessThanOrEqual(atlas.largura);
      expect(q.y + q.a).toBeLessThanOrEqual(atlas.altura);
      expect([q.l, q.a]).toEqual([LADO_PX, LADO_PX]);
      expect(LADO_PX % TIRAS).toBe(0);
      cantos.add(`${q.x},${q.y}`);
    }
    expect(cantos.size).toBe(quadros.length);
    expect(atlas.svg.startsWith('<svg')).toBe(true);
    expect(atlas.svg).not.toMatch(/NaN|undefined|Infinity/);
    expect(gerarAtlas().svg).toBe(atlas.svg);
  });
});

describe('a visão não muda o jogo (D-058)', () => {
  // A entrada isométrica passa pelo remapeamento (teclado) e pela projeção (toque) e chega aos mesmos comandos.
  const pelaTelaIsometrica = (produtor: Produtor): Produtor => {
    const p = criarProjecao('iso', 60, 60);
    return (estado) =>
      produtor(estado).map((c): ComandoDoTick => {
        if (c.cmd.t === 'mover' && c.cmd.dir !== 'parado') {
          const alvo = c.cmd.dir;
          const naTela = DIRECOES.find((d) => rumoDaTela(d, true).dir === alvo);
          return { ...c, cmd: { t: 'mover', dir: naTela ? rumoDaTela(naTela, true).dir : 'parado' } };
        }
        if (c.cmd.t === 'irPara') {
          const centro = centroDaCelula(c.cmd.x, c.cmd.y);
          const t = p.projetar(centro.x, centro.y);
          return { ...c, cmd: { t: 'irPara', ...celulaSobProjetado(p, t.x, t.y) } };
        }
        return c;
      });
  };

  it('o mesmo digest jogando de cima e no isométrico', () => {
    const a = criarCenario({ semente: 33 });
    const b = criarCenario({ semente: 33 });
    rodar(a, 1_500, criarBotAleatorio(9));
    rodar(b, 1_500, pelaTelaIsometrica(criarBotAleatorio(9)));
    expect(digest(a.estado)).toBe(digest(b.estado));
  });
});
