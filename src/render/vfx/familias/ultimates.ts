// D-173 (14/11/2026): as assinaturas das 21 famílias de ultimate, feitas à mão, uma por família (antes, cada família
// tomava emprestada a assinatura de uma skill comum). O desenho segue o que a ultimate conta: a Aniquilação são dois
// sóis que se fundem; o Cárcere, grades que caem do alto; o Santuário, a cúpula com a borda de correntes; o Cometa, a
// queda com a cratera; a Matilha, as garras que cruzam a área; a Legião, as mãos que rompem o chão. A cor da runa
// (`a.cor`) tinge tudo, e a classe ainda soma as criaturas ou as etapas dela por cima.

import type { CenaVfx, DefAssinatura, P } from '../cena';
import { arcoDeGolpe, brotar, cair, circuloNoChao, clarao, clarear, cupula, escurecer, feixe, ondaDeChoque, orbitar, PX, sortear, tremido, tween } from '../blocos';
import { cintilar, em, faiscasMetal, nevoa, poeira } from '../emissoes';
import { elastica, sai } from '../pincel';
import type { Emissao } from '../../presets-particula';

const ELOS = (n: number, o: Partial<Emissao> = {}) => em({ textura: 'elo', quantidade: n, vidaMs: [350, 600], velocidade: [80, 170], direcao: 'cima', abertura: 1.2, gravidade: 560, escala: [0.3, 0.22], alpha: [1, 0.5], raio: 5, cor: 0xb8c0c8, giro: [-10, 10], ...o });
const ALMAS = (n: number, o: Partial<Emissao> = {}) => em({ textura: 'alma', quantidade: n, vidaMs: [600, 1000], velocidade: [30, 80], direcao: 'cima', gravidade: -50, escala: [0.35, 0.55], alpha: [0.9, 0], aditivo: true, raio: 10, cor: null, ...o });
const PEDRAS = (n: number, o: Partial<Emissao> = {}) => em({ textura: 'rocha', quantidade: n, vidaMs: [450, 750], velocidade: [100, 220], direcao: 'cima', abertura: 1.1, gravidade: 620, escala: [0.3, 0.2], alpha: [1, 0.7], raio: 6, cor: 0x8a7258, giro: [-6, 6], ...o });
const GOTAS = (n: number, o: Partial<Emissao> = {}) => em({ textura: 'gota_viva', quantidade: n, vidaMs: [320, 560], velocidade: [80, 170], direcao: 'cima', abertura: 1.2, gravidade: 600, escala: [0.22, 0.12], alpha: [1, 0.3], raio: 3, cores: [0xd83040, 0x7a1020], esticar: 0.2, ...o });
const RUNAS = (n: number, o: Partial<Emissao> = {}) => em({ textura: 'runa1', quantidade: n, vidaMs: [500, 900], velocidade: [10, 40], direcao: 'cima', escala: [0.25, 0.45], alpha: [1, 0], aditivo: true, raio: 14, cor: null, ...o });
const LAMINAS = (n: number, o: Partial<Emissao> = {}) => em({ textura: 'lamina', quantidade: n, vidaMs: [280, 460], velocidade: [120, 220], arrasto: 1, escala: [0.4, 0.3], alpha: [1, 0], raio: 4, cor: 0xe8eef4, giro: [-12, 12], ...o });
const FOLHAS = (n: number, o: Partial<Emissao> = {}) => em({ textura: 'folha', quantidade: n, vidaMs: [700, 1100], velocidade: [20, 60], direcao: 'cima', gravidade: -10, escala: [0.3, 0.2], alpha: [1, 0], raio: 12, cor: 0x8fe08f, giro: [-3, 3], ...o });
const PENAS = (n: number, o: Partial<Emissao> = {}) => em({ textura: 'pena', quantidade: n, vidaMs: [600, 1000], velocidade: [40, 120], gravidade: 40, arrasto: 1.6, escala: [0.4, 0.3], alpha: [1, 0], raio: 6, cor: 0xfff6dc, giro: [-4, 4], ...o });

const anel = (centro: P, raio: number, n: number): P[] => Array.from({ length: n }, (_, i) => ({ x: centro.x + Math.cos((i / n) * Math.PI * 2) * raio, y: centro.y + Math.sin((i / n) * Math.PI * 2) * raio }));
const angulo = (c: CenaVfx, de: P, ate: P): number => Math.atan2(c.tela(ate).y - c.tela(de).y, c.tela(ate).x - c.tela(de).x);
const raioDe = (a: { raio: number }, min = 1.5): number => Math.max(min, a.raio);
const ponta = (a: { celulas: readonly P[]; origem: P; mira: P }): P =>
  a.celulas.reduce((m, p) => (Math.hypot(p.x - a.origem.x, p.y - a.origem.y) > Math.hypot(m.x - a.origem.x, m.y - a.origem.y) ? p : m), a.mira);

export const ULTIMATES_VFX = {
  /** Aniquilação: dois sóis descem girando um em volta do outro, fundem-se no centro e estouram em dois anéis. */
  ult_aniquilacao: {
    familia: 'arcano',
    impacto: [cintilar(8), RUNAS(2)],
    marca: 'queimado',
    camera: 'forte',
    naArea: (c, a) => {
      const r = raioDe(a);
      orbitar(c, () => a.centro, 'clarao', clarear(a.cor, 0.3), { n: 2, raio: r * 0.7, ms: 380, voltas: 1.2, tamanho: 1.4, aditivo: true, rastro: 3 });
      tween(c, { textura: 'clarao', de: a.centro, s: [0.4, 3.2], a: [1, 0], cor: 0xffffff, aditivo: true, ms: 320, atrasoMs: 360, curva: sai });
      ondaDeChoque(c, a.centro, a.cor, r + 0.5, 460);
      ondaDeChoque(c, a.centro, clarear(a.cor, 0.5), r * 0.6, 340);
      c.particulas.emitirLista([cintilar(16, { raio: r * PX * 0.8 }), RUNAS(5, { raio: r * PX * 0.6 })], a.centro.x, a.centro.y, a.cor);
    },
  },
  /** Execução da presa: as algemas fecham nos presos e a lâmina do carrasco cai do alto no centro. */
  ult_execucao_presa: {
    familia: 'corrente',
    impacto: [ELOS(4), GOTAS(3)],
    camera: 'leve',
    naArea: (c, a) => {
      for (const p of sortear(a.celulas, Math.min(6, a.celulas.length))) tween(c, { textura: 'algema', de: { x: p.x, y: p.y - 0.8 }, para: p, s: [1.2, 0.7], a: [0, 1], cor: 0xc8d0d8, ms: 220, curva: elastica });
      cair(c, a.centro, 'lamina', 0xf4f8ff, { altura: 5, ms: 300, tamanho: 2.2, atrasoMs: 260, aoChegar: () => { ondaDeChoque(c, a.centro, a.cor, raioDe(a), 320); c.tremor('forte'); } });
    },
    aoAcertar: (c, a) => { arcoDeGolpe(c, { x: a.ate.x, y: a.ate.y - 1 }, a.ate, 0xffffff, 1.3 * a.escala); },
  },
  /** Sangria: o corte largo abre a área e o sangue sobe em fios até quem lançou, como cura. */
  ult_sangria: {
    familia: 'trevas',
    impacto: [GOTAS(8)],
    marca: 'poca_sangue',
    naArea: (c, a) => {
      arcoDeGolpe(c, a.origem, a.centro, 0xff5060, 2 * a.escala, 1, 260);
      arcoDeGolpe(c, a.origem, a.centro, 0xff5060, 1.6 * a.escala, -1, 260);
      c.particulas.emitirLista([GOTAS(14, { raio: raioDe(a) * PX * 0.6 })], a.centro.x, a.centro.y, a.cor);
    },
    aoAcertar: (c, a) => {
      const volta = c.ondeEsta(a.fonteId) ?? a.de;
      if (volta) tween(c, { textura: 'gota_viva', de: a.ate, para: volta, s: [0.5, 0.2], a: [1, 0.4], cor: 0xff4050, aditivo: true, ms: 420, atrasoMs: 80 + a.indice * 40, subir: -18, aoFim: () => { clarao(c, volta, 0x70e0a0, 0.9); } });
    },
  },
  /** Contragolpe: a casca de hexágonos se fecha, pulsa a cada golpe guardado e, no fim, estilhaça para fora. */
  ult_contragolpe: {
    familia: 'fisico',
    impacto: [faiscasMetal(8), em({ textura: 'estilhaco', quantidade: 5, vidaMs: [300, 500], velocidade: [120, 220], escala: [0.4, 0.2], alpha: [1, 0], aditivo: true, raio: 4, cor: null, giro: [-10, 10] })],
    emSi: (c, a) => {
      cupula(c, () => c.ondeEsta(a.id) ?? a.pos, a.cor, 900, 1);
      orbitar(c, () => c.ondeEsta(a.id) ?? a.pos, 'hexagono', clarear(a.cor, 0.4), { n: 4, raio: 1, ms: 2600, voltas: 2, tamanho: 0.6, aditivo: true });
    },
    naArea: (c, a) => {
      for (const p of anel(a.origem, raioDe(a), 10)) tween(c, { textura: 'estilhaco', de: a.origem, para: p, s: [0.8, 0.3], a: [1, 0], rot: [angulo(c, a.origem, p), angulo(c, a.origem, p)], cor: clarear(a.cor, 0.4), aditivo: true, ms: 300, curva: sai });
      ondaDeChoque(c, a.origem, a.cor, raioDe(a), 340);
    },
  },
  /** Cometa: o risco de luz na linha do salto e a queda no fim, com a cratera e as pedras que voam. */
  ult_cometa: {
    familia: 'terra',
    impacto: [PEDRAS(6), poeira(4, { forma: 'ponto' })],
    marca: 'rachadura',
    camera: 'forte',
    naArea: (c, a) => {
      const fim = ponta(a);
      feixe(c, a.origem, fim, clarear(a.cor, 0.3), 1.4, 320);
      cair(c, fim, 'rocha', a.cor, { altura: 6, ms: 340, tamanho: 2.6, inclinacao: 0.5, aoChegar: () => {
        ondaDeChoque(c, fim, a.cor, 2.2, 420);
        c.marca('rachadura', fim.x, fim.y, escurecer(a.cor, 0.5), 2.4, 5000);
        c.particulas.emitirLista([PEDRAS(14, { raio: 20 }), poeira(12, { raio: 30 })], fim.x, fim.y, a.cor);
        c.tremor('forte');
      } });
    },
  },
  /** Exército em fúria: o estandarte crava no chão e o grito corre pelas criaturas, que acendem os olhos. */
  ult_exercito_em_furia: {
    familia: 'trevas',
    impacto: [ALMAS(3), faiscasMetal(4)],
    camera: 'leve',
    emSi: (c, a) => {
      brotar(c, a.pos, 'lamina', a.cor, 1.8, 1200, true);
      for (let i = 0; i < 3; i++) ondaDeChoque(c, a.pos, i === 1 ? 0xff4040 : a.cor, 1.5 + i, 420 + i * 80, 'onda_som', false);
      c.particulas.emitirLista([ALMAS(8, { raio: 30 })], a.pos.x, a.pos.y, a.cor);
    },
    naArea: (c, a) => {
      for (const p of sortear(a.celulas, Math.min(5, a.celulas.length))) tween(c, { textura: 'olho', de: { x: p.x, y: p.y - 0.9 }, s: [0.2, 0.7], sy: [0.05, 0.6], a: [1, 0], cor: 0xff4040, aditivo: true, ms: 600, curva: elastica });
    },
  },
  /** Cárcere: as grades caem do alto em volta da área, uma a uma, e o cadeado fecha no centro. */
  ult_carcere: {
    familia: 'corrente',
    impacto: [ELOS(5)],
    camera: 'leve',
    naArea: (c, a) => {
      const r = raioDe(a);
      anel(a.centro, r, 12).forEach((p, i) => { cair(c, p, 'feixe', 0xb8c4d0, { altura: 4, ms: 220, tamanho: 1.3, atrasoMs: i * 25, inclinacao: Math.PI / 2, aoChegar: () => { c.particulas.emitirLista([faiscasMetal(2)], p.x, p.y, a.cor); } }); });
      tween(c, { textura: 'algema', de: { x: a.centro.x, y: a.centro.y - 1.4 }, para: a.centro, s: [2.4, 1.4], a: [0, 1], cor: clarear(a.cor, 0.3), aditivo: true, ms: 380, atrasoMs: 320, curva: elastica, aoFim: () => { ondaDeChoque(c, a.centro, a.cor, r, 300); } });
    },
  },
  /** Santuário: o círculo rúnico acende, a cúpula sobe do chão e a borda fica de correntes de luz. */
  ult_santuario: {
    familia: 'luz',
    impacto: [cintilar(5), FOLHAS(2)],
    naArea: (c, a) => {
      const r = raioDe(a, 2);
      circuloNoChao(c, () => a.centro, 'circulo_runico', a.cor, r * 2, 1600, 0.4);
      cupula(c, () => a.centro, clarear(a.cor, 0.4), 1200, r * 0.8);
      orbitar(c, () => a.centro, 'elo', 0xfff0b0, { n: 10, raio: r, ms: 1600, voltas: 0.6, tamanho: 0.5, aditivo: true, tangente: true });
      c.particulas.emitirLista([cintilar(12, { raio: r * PX * 0.5, direcao: 'cima' })], a.centro.x, a.centro.y, 0xfff4c0);
    },
  },
  /** Fortaleza: os muros brotam em volta, pedra por pedra, com ameias e poeira. */
  ult_fortaleza: {
    familia: 'terra',
    impacto: [PEDRAS(5), cintilar(2)],
    marca: 'rachadura',
    camera: 'leve',
    naArea: (c, a) => {
      const r = raioDe(a);
      anel(a.centro, r, 10).forEach((p, i) => {
        brotar(c, p, 'rocha', escurecer(a.cor, 0.2), 1.5, 1400, false, i * 40);
        brotar(c, { x: p.x, y: p.y - 0.45 }, 'hexagono', clarear(a.cor, 0.3), 0.6, 1200, true, i * 40 + 120);
      });
      c.particulas.emitirLista([poeira(14, { raio: r * PX * 0.9 })], a.centro.x, a.centro.y, a.cor);
    },
  },
  /** Armadilha viva: o avanço risca a linha e, atrás, as mandíbulas de espinho se fecham uma a uma. */
  ult_armadilha_viva: {
    familia: 'arqueiro',
    impacto: [em({ textura: 'espinho', quantidade: 5, vidaMs: [300, 500], velocidade: [80, 160], direcao: 'cima', gravidade: 420, escala: [0.4, 0.25], alpha: [1, 0], raio: 4, cor: 0xb8a070, giro: [-8, 8] })],
    naArea: (c, a) => {
      const fim = ponta(a);
      const n = 5;
      for (let i = 0; i < n; i++) {
        const p = { x: a.origem.x + ((fim.x - a.origem.x) * i) / n, y: a.origem.y + ((fim.y - a.origem.y) * i) / n };
        brotar(c, { x: p.x - 0.25, y: p.y }, 'espinho', a.cor, 1, 900, false, i * 70);
        brotar(c, { x: p.x + 0.25, y: p.y }, 'espinho', a.cor, 1, 900, false, i * 70 + 40);
      }
      tween(c, { textura: 'arco_golpe', de: a.origem, para: fim, s: [0.8, 1.2], a: [0.9, 0], rot: [angulo(c, a.origem, fim), angulo(c, a.origem, fim)], cor: 0xf0e8d8, aditivo: true, ms: 280 });
    },
  },
  /** Carcereiros: dois ganchos saem de quem lança, cravam longe e voltam arrastando as correntes. */
  ult_carcereiros: {
    familia: 'corrente',
    impacto: [ELOS(4), ALMAS(2)],
    emSi: (c, a) => {
      for (const lado of [-1, 1]) {
        const longe = { x: a.pos.x + lado * 3, y: a.pos.y - 0.5 };
        tween(c, { textura: 'gancho', de: a.pos, para: longe, s: [0.8, 1], a: [1, 1], rot: [lado > 0 ? 0 : Math.PI, lado > 0 ? 0 : Math.PI], cor: 0xc8d0d8, ms: 260, curva: sai, aoFim: () => {
          tween(c, { textura: 'gancho', de: longe, para: a.pos, s: [1, 0.7], a: [1, 0], cor: 0xc8d0d8, ms: 420 });
          c.particulas.emitirLista([ELOS(4)], longe.x, longe.y, a.cor, a.pos);
        } });
      }
      circuloNoChao(c, () => c.ondeEsta(a.id) ?? a.pos, 'circulo_runico', a.cor, 2.2, 900, -1);
    },
    aoAcertar: (c, a) => { tween(c, { textura: 'algema', de: { x: a.ate.x, y: a.ate.y - 0.7 }, para: a.ate, s: [1.2, 0.7], a: [0, 1], cor: 0xc8d0d8, ms: 240, curva: elastica }); },
  },
  /** Renascer: duas asas de luz se abrem, as penas sobem e um pilar claro desce no aliado caído. */
  ult_renascer: {
    familia: 'luz',
    impacto: [PENAS(4), cintilar(4)],
    naArea: (c, a) => {
      for (const lado of [-1, 1]) tween(c, { textura: 'asa', de: { x: a.origem.x + lado * 0.3, y: a.origem.y - 0.6 }, para: { x: a.origem.x + lado * 1.1, y: a.origem.y - 0.9 }, s: [0.4, 2], sy: [0.4, 2], a: [1, 0], rot: [0, lado * 0.3], cor: 0xfff6dc, aditivo: true, ms: 900, curva: sai });
      feixe(c, { x: a.origem.x, y: a.origem.y - 5 }, a.origem, 0xfff4c0, 2.2, 700);
      ondaDeChoque(c, a.origem, 0xfff0a0, raioDe(a, 2), 600);
      c.particulas.emitirLista([PENAS(12, { raio: 30, direcao: 'cima', gravidade: -30 }), cintilar(10, { raio: 40 })], a.origem.x, a.origem.y, 0xfff4c0);
    },
    aoAcertar: (c, a) => { feixe(c, { x: a.ate.x, y: a.ate.y - 3 }, a.ate, 0xfff4c0, 0.8, 420); },
  },
  /** Bastião: três anéis de escudos giram em volta do grupo e batem, um depois do outro, a cada renovação. */
  ult_bastiao: {
    familia: 'luz',
    impacto: [cintilar(4), faiscasMetal(2)],
    naArea: (c, a) => {
      const centro = () => c.ondeEsta(a.atorId) ?? a.origem;
      for (let i = 0; i < 3; i++) orbitar(c, centro, 'hexagono', clarear(a.cor, 0.2 + i * 0.2), { n: 5 + i, raio: 0.9 + i * 0.7, ms: 1400, voltas: i % 2 ? -0.8 : 0.8, tamanho: 0.7, aditivo: true });
      ondaDeChoque(c, a.origem, a.cor, raioDe(a, 2), 500);
    },
    aoAcertar: (c, a) => { cupula(c, () => c.ondeEsta(a.alvoId) ?? a.ate, a.cor, 520, 0.7); },
  },
  /** Peregrino: os passos acendem no chão, um a um, e deles brotam folhas que curam quem pisa. */
  ult_peregrino: {
    familia: 'luz',
    impacto: [FOLHAS(4), cintilar(3)],
    naArea: (c, a) => {
      const fim = ponta(a);
      const n = 6;
      for (let i = 0; i <= n; i++) {
        const p = { x: a.origem.x + ((fim.x - a.origem.x) * i) / n, y: a.origem.y + ((fim.y - a.origem.y) * i) / n };
        tween(c, { textura: 'circulo_runico', de: p, s: [0.2, 1], a: [1, 0], cor: 0x9ff0b0, aditivo: true, ms: 1400, atrasoMs: i * 70, noChao: true });
        brotar(c, tremido(p, 0.5), 'folha', 0x8fe08f, 0.8, 1200, false, i * 70 + 100);
      }
    },
  },
  /** Guardiões: três luzes descem em espiral, pousam em volta e ficam girando devagar sobre o grupo. */
  ult_guardioes: {
    familia: 'luz',
    impacto: [ALMAS(2, { cor: 0xfff4c0 }), cintilar(3)],
    naArea: (c, a) => {
      const centro = () => c.ondeEsta(a.atorId) ?? a.origem;
      anel(a.origem, 1.4, 3).forEach((p, i) => { cair(c, p, 'alma', 0xfff4c0, { altura: 5, ms: 520, tamanho: 1.3, atrasoMs: i * 120, aditivo: true, aoChegar: () => { clarao(c, p, 0xfff4c0, 1.1); } }); });
      orbitar(c, centro, 'alma', 0xfff4c0, { n: 3, raio: 1.4, ms: 2400, voltas: 1.5, tamanho: 0.9, aditivo: true, rastro: 2 });
      circuloNoChao(c, centro, 'circulo_runico', a.cor, 3, 1800, 0.3);
    },
    emSi: (c, a) => { orbitar(c, () => c.ondeEsta(a.id) ?? a.pos, 'alma', 0xfff4c0, { n: 3, raio: 1.2, ms: 2000, voltas: 1.5, tamanho: 0.9, aditivo: true }); },
  },
  /** Inabalável: o corpo vira pedra de baixo para cima, o olho da fúria abre e a provocação corre em volta. */
  ult_inabalavel: {
    familia: 'fisico',
    impacto: [PEDRAS(3), faiscasMetal(5)],
    camera: 'leve',
    naArea: (c, a) => {
      const centro = () => c.ondeEsta(a.atorId) ?? a.origem;
      orbitar(c, centro, 'rocha', escurecer(a.cor, 0.1), { n: 6, raio: 0.6, ms: 900, voltas: 0.5, tamanho: 0.7 });
      tween(c, { textura: 'olho', de: { x: a.origem.x, y: a.origem.y - 1.3 }, s: [0.3, 1.5], sy: [0.05, 1.2], a: [1, 0], cor: 0xff5a3a, aditivo: true, ms: 900, curva: elastica });
      for (let i = 0; i < 2; i++) ondaDeChoque(c, a.origem, 0xff5a3a, raioDe(a, 2) * (0.6 + i * 0.4), 460 + i * 120, 'onda_som', false);
    },
    emSi: (c, a) => { cupula(c, () => c.ondeEsta(a.id) ?? a.pos, 0xc8b89a, 800, 0.7); },
  },
  /** Avanço blindado: a proa de escudos corta a linha e joga poeira e faíscas para os dois lados. */
  ult_avanco_blindado: {
    familia: 'fisico',
    impacto: [faiscasMetal(8), poeira(4, { forma: 'ponto' })],
    camera: 'forte',
    naArea: (c, a) => {
      const fim = ponta(a);
      const ang = angulo(c, a.origem, fim);
      for (const d of [-0.35, 0, 0.35]) tween(c, { textura: 'hexagono', de: { x: a.origem.x, y: a.origem.y + d }, para: { x: fim.x, y: fim.y + d }, s: [1, 1.3], a: [1, 0.1], rot: [ang, ang], cor: clarear(a.cor, 0.3), aditivo: true, ms: 300 });
      tween(c, { textura: 'onda_som', de: fim, s: [0.8, 2.6], a: [1, 0], rot: [ang + Math.PI / 2, ang + Math.PI / 2], cor: 0xffffff, aditivo: true, ms: 340, atrasoMs: 240, curva: sai });
      c.particulas.emitirLista([poeira(14, { forma: 'ponto', direcao: 'cima', raio: 6 }), faiscasMetal(8)], a.origem.x, a.origem.y, a.cor, fim);
    },
  },
  /** Muralha viva: os escudos se plantam em fila, um a um, cada um com um clarão quando encaixa. */
  ult_muralha_viva: {
    familia: 'fisico',
    impacto: [faiscasMetal(6), cintilar(2)],
    naArea: (c, a) => {
      const n = 5;
      for (let i = 0; i < n; i++) {
        const p = { x: a.origem.x + (i - (n - 1) / 2) * 0.8, y: a.origem.y - 0.4 };
        cair(c, p, 'hexagono', clarear(a.cor, 0.3), { altura: 2.5, ms: 240, tamanho: 1.2, atrasoMs: i * 70, aditivo: true, aoChegar: () => { clarao(c, p, a.cor, 0.9); c.particulas.emitirLista([poeira(3, { forma: 'ponto' })], p.x, p.y, a.cor); } });
      }
    },
    emSi: (c, a) => { for (let i = 0; i < 3; i++) brotar(c, { x: a.pos.x + (i - 1) * 0.8, y: a.pos.y - 0.3 }, 'hexagono', clarear(a.cor, 0.3), 1.1, 1200, true, i * 80); },
  },
  /** Tempestade de passos: a cada salto fica uma silhueta de luz, e os cortes ligam uma na outra. */
  ult_tempestade_de_passos: {
    familia: 'fisico',
    impacto: [LAMINAS(5), faiscasMetal(3)],
    camera: 'leve',
    naArea: (c, a) => {
      const pontos = sortear(a.celulas, Math.min(4, a.celulas.length));
      let anterior = a.origem;
      pontos.forEach((p, i) => {
        const de = anterior;
        tween(c, { textura: 'arco_golpe', de, para: p, s: [0.6, 1.4], a: [1, 0], rot: [angulo(c, de, p), angulo(c, de, p)], cor: clarear(a.cor, 0.4), aditivo: true, ms: 220, atrasoMs: i * 110 });
        tween(c, { textura: 'clarao', de: p, s: [0.5, 1.5], a: [0.9, 0], cor: a.cor, aditivo: true, ms: 380, atrasoMs: i * 110 + 60 });
        anterior = p;
      });
    },
    aoAcertar: (c, a) => { arcoDeGolpe(c, a.de, a.ate, clarear(a.cor, 0.4), 1.2 * a.escala, a.indice % 2 ? -1 : 1); },
  },
  /** Matilha: três rasgos de garra cruzam a área em onda, com poeira e pelos no rastro. */
  ult_matilha: {
    familia: 'falcao',
    impacto: [em({ textura: 'garra', quantidade: 2, vidaMs: [260, 400], escala: [0.9, 0.6], alpha: [1, 0], aditivo: true, cor: null, giro: [-2, 2] }), GOTAS(3)],
    camera: 'leve',
    naArea: (c, a) => {
      const fim = ponta(a);
      const ang = angulo(c, a.origem, fim);
      for (const [i, d] of [-0.8, 0, 0.8].entries()) {
        const de = { x: a.origem.x, y: a.origem.y + d };
        const ate = { x: fim.x, y: fim.y + d };
        tween(c, { textura: 'garra', de, para: ate, s: [1, 1.8], a: [1, 0.2], rot: [ang, ang], cor: clarear(a.cor, 0.3), aditivo: true, ms: 360, atrasoMs: i * 90, curva: sai });
        c.particulas.emitirLista([poeira(6, { forma: 'ponto', direcao: 'cima', raio: 5 })], de.x, de.y, a.cor, ate);
      }
    },
    emSi: (c, a) => { for (let i = 0; i < 3; i++) ondaDeChoque(c, a.pos, a.cor, 1 + i * 0.7, 360 + i * 80, 'onda_som', false); },
  },
  /** Legião: o chão racha em círculo e as mãos rompem a terra por toda a volta, sob uma névoa baixa. */
  ult_legiao: {
    familia: 'trevas',
    impacto: [ALMAS(4), em({ textura: 'osso', quantidade: 4, vidaMs: [450, 700], velocidade: [100, 200], direcao: 'cima', abertura: 1.1, gravidade: 600, escala: [0.28, 0.22], alpha: [1, 0.6], raio: 6, cor: 0xece4d0, giro: [-10, 10] })],
    marca: 'rachadura',
    camera: 'forte',
    emSi: (c, a) => {
      circuloNoChao(c, () => a.pos, 'circulo_runico', a.cor, 4, 1600, -0.5);
      anel(a.pos, 1.6, 8).forEach((p, i) => { brotar(c, tremido(p, 0.3), 'mao_ossea', clarear(a.cor, 0.2), 1.1, 1300, false, i * 70); });
      c.marca('rachadura', a.pos.x, a.pos.y, escurecer(a.cor, 0.4), 3, 4000);
      c.particulas.emitirLista([nevoa(10, { cor: escurecer(a.cor, 0.3), raio: 60 }), ALMAS(8, { raio: 60 })], a.pos.x, a.pos.y, a.cor);
    },
    naArea: (c, a) => { for (const p of sortear(a.celulas, Math.min(6, a.celulas.length))) brotar(c, p, 'mao_ossea', clarear(a.cor, 0.2), 1, 1100, false, Math.random() * 300); },
  },
} satisfies Record<string, DefAssinatura>;
