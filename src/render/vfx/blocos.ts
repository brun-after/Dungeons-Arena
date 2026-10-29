// Blocos das silhuetas (marco 26, 29/10/2026, D-124). As peças com que as assinaturas montam o desenho de cada skill:
// onda de choque, clarão, bola de fogo, relâmpago ramificado, feixe, corrente de elos, arco de golpe, o que brota do
// chão, o que cai do céu, o que gira em volta e o círculo no chão. Posições em células; o desenho, em px de tela.

import type { CenaVfx, P } from './cena';
import { elastica, entra, pico, sai, suave, type NomeTextura } from './pincel';
import { QUADROS_CHAMA, QUADROS_FUMACA, type TexturaRica } from './texturas';

/** Quantos px de tela tem uma célula (o pincel trabalha em px; as texturas têm 32 px de lado). */
export const PX = 48;
const LADO = 32;

const misturar = (a: number, b: number, f: number): number => {
  const c = (s: number) => Math.round(((a >> s) & 0xff) + (((b >> s) & 0xff) - ((a >> s) & 0xff)) * f);
  return (c(16) << 16) | (c(8) << 8) | c(0);
};
export const clarear = (cor: number, f: number) => misturar(cor, 0xffffff, f);
export const escurecer = (cor: number, f: number) => misturar(cor, 0x000000, f);

/** A onda de choque: um anel que cresce até `raio` células (achatado no chão do isométrico). */
export function ondaDeChoque(c: CenaVfx, em: P, cor: number, raio: number, ms = 380, textura: NomeTextura = 'choque', noChao = true): void {
  const achatar = c.iso && noChao ? 0.5 : 1;
  c.tocar({
    ms,
    desenhar: (t, _ms, p) => {
      const q = noChao ? c.chao(em) : c.tela(em);
      const s = ((raio * 2 * PX) / LADO) * sai(t);
      p.desenhar(textura, q.x, q.y, { sx: s, sy: s * achatar, alpha: (1 - t) * 0.9, cor, aditivo: true });
    },
  });
}

/** O clarão do acerto: a estrela de lente que pisca. */
export function clarao(c: CenaVfx, em: P, cor: number, tamanho = 1.6, ms = 180): void {
  c.tocar({
    ms,
    enfeite: true,
    desenhar: (t, _ms, p) => {
      const q = c.tela(em);
      const s = tamanho * (0.6 + 0.6 * sai(t));
      p.desenhar('clarao', q.x, q.y, { sx: s, sy: s, alpha: pico(t, 0.2), cor: clarear(cor, 0.5), aditivo: true, rot: t * 0.4 });
    },
  });
}

/** Um sprite que vai de um estado a outro (o caso geral das peças simples). */
export interface Tween {
  textura: NomeTextura;
  quadros?: readonly TexturaRica[];
  de: P;
  para?: P;
  /** Escala (1 = 32 px) no começo e no fim; alpha idem; rot idem. */
  s?: readonly [number, number];
  sy?: readonly [number, number];
  a?: readonly [number, number];
  rot?: readonly [number, number];
  cor: number;
  corFim?: number;
  aditivo?: boolean;
  ms: number;
  atrasoMs?: number;
  curva?: (t: number) => number;
  /** Desloca em px de tela (y negativo = sobe) além do caminho entre `de` e `para`. */
  subir?: number;
  noChao?: boolean;
  enfeite?: boolean;
  aoFim?: () => void;
}

export function tween(c: CenaVfx, o: Tween): void {
  const s = o.s ?? [1, 1];
  const a = o.a ?? [1, 0];
  const r = o.rot ?? [0, 0];
  const f = o.curva ?? suave;
  c.tocar({
    ms: o.ms,
    ...(o.atrasoMs ? { atrasoMs: o.atrasoMs } : {}),
    ...(o.enfeite ? { enfeite: true } : {}),
    ...(o.aoFim ? { aoFim: o.aoFim } : {}),
    desenhar: (t, ms, p) => {
      const k = f(t);
      const ini = o.noChao ? c.chao(o.de) : c.tela(o.de);
      const fim = o.para ? (o.noChao ? c.chao(o.para) : c.tela(o.para)) : ini;
      const esc = s[0] + (s[1] - s[0]) * k;
      const escY = o.sy ? o.sy[0] + (o.sy[1] - o.sy[0]) * k : esc;
      const quadro = o.quadros ? (o.quadros[Math.floor(ms / 60) % o.quadros.length] ?? o.textura) : o.textura;
      p.desenhar(quadro, ini.x + (fim.x - ini.x) * k, ini.y + (fim.y - ini.y) * k + (o.subir ?? 0) * k, {
        sx: esc,
        sy: escY,
        alpha: a[0] + (a[1] - a[0]) * t,
        rot: r[0] + (r[1] - r[0]) * k,
        cor: o.corFim === undefined ? o.cor : misturar(o.cor, o.corFim, t),
        aditivo: o.aditivo ?? false,
      });
    },
  });
}

/**
 * A bola de fogo que explode: labaredas grandes em flipbook que crescem e sobem em cogumelo, o miolo branco-amarelo,
 * o anel de calor, brasas que voam e viram fumaça, fumaça escura que sobe e a cratera queimada no chão.
 */
export function bolaDeFogo(c: CenaVfx, em: P, raio = 1, cor = 0xff7b39): void {
  const n = c.reduzido ? 6 : 11;
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI * 2 + Math.random() * 0.5;
    const d = Math.random() * 0.35 * raio;
    tween(c, {
      textura: 'chama0',
      quadros: QUADROS_CHAMA,
      de: { x: em.x + Math.cos(ang) * d * 0.4, y: em.y + Math.sin(ang) * d * 0.4 },
      para: { x: em.x + Math.cos(ang) * d, y: em.y + Math.sin(ang) * d },
      s: [0.8 * raio, (2.4 + Math.random()) * raio],
      a: [1, 0],
      cor: 0xffb84a,
      corFim: escurecer(cor, 0.45),
      aditivo: true,
      ms: 420 + Math.random() * 200,
      subir: -PX * 0.7 * raio,
      curva: sai,
    });
  }
  // O miolo branco que estoura primeiro.
  tween(c, { textura: 'brasa', de: em, s: [1.5 * raio, 4.2 * raio], a: [1, 0], cor: 0xfff6d0, aditivo: true, ms: 220, curva: sai });
  ondaDeChoque(c, em, clarear(cor, 0.2), 1.6 * raio, 360);
  // A fumaça escura que fica e sobe (o cogumelo).
  for (let i = 0; i < (c.reduzido ? 2 : 4); i++) {
    tween(c, {
      textura: QUADROS_FUMACA[i % 3] ?? 'fumaca1',
      de: { x: em.x + (Math.random() - 0.5) * 0.5 * raio, y: em.y },
      s: [1 * raio, 2.6 * raio],
      a: [0.65, 0],
      rot: [0, (Math.random() - 0.5) * 1.5],
      cor: 0x5a4e46,
      ms: 900 + Math.random() * 400,
      atrasoMs: 120,
      subir: -PX * 1.2 * raio,
      curva: sai,
      enfeite: true,
    });
  }
  c.marca('queimado', em.x, em.y, 0x1a1210, 2.2 * raio, 3200);
  c.marca('queimado', em.x, em.y, 0xff5a1a, 1.4 * raio, 1200, true);
}

/** Pontos do relâmpago: zigue-zague pelo meio do segmento (deslocamento do ponto médio). */
function zigue(a: P, b: P, profundidade: number, amplitude: number, saida: P[]): void {
  if (profundidade === 0) {
    saida.push(b);
    return;
  }
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const comp = Math.hypot(dx, dy) || 1;
  const desvio = (Math.random() - 0.5) * amplitude;
  const m = { x: mx - (dy / comp) * desvio, y: my + (dx / comp) * desvio };
  zigue(a, m, profundidade - 1, amplitude / 2, saida);
  zigue(m, b, profundidade - 1, amplitude / 2, saida);
}

/**
 * O relâmpago ramificado: o caminho em zigue-zague refeito a cada 50 ms (crepita), núcleo branco fino, halo grosso
 * na cor e dois galhos que nascem do meio. `de`/`ate` podem seguir quem anda.
 */
export function relampago(c: CenaVfx, de: () => P | null, ate: () => P | null, cor: number, ms = 260, largura = 1): void {
  let caminho: P[] = [];
  let galhos: P[][] = [];
  let ultimo = -1;
  c.tocar({
    ms,
    desenhar: (t, decorrido, p) => {
      const pa = de();
      const pb = ate();
      if (!pa || !pb) return false;
      const a = c.tela(pa);
      const b = c.tela(pb);
      if (Math.floor(decorrido / 50) !== ultimo) {
        ultimo = Math.floor(decorrido / 50);
        const comp = Math.hypot(b.x - a.x, b.y - a.y);
        caminho = [a];
        zigue(a, b, comp > 160 ? 5 : 4, Math.min(60, comp * 0.35), caminho);
        galhos = [];
        for (let g = 0; g < 2; g++) {
          const base = caminho[Math.floor(caminho.length * (0.3 + g * 0.3))];
          if (!base) continue;
          const ang = Math.atan2(b.y - a.y, b.x - a.x) + (g === 0 ? 0.8 : -0.8) + (Math.random() - 0.5) * 0.6;
          const fim = { x: base.x + Math.cos(ang) * comp * 0.25, y: base.y + Math.sin(ang) * comp * 0.25 };
          const ramo: P[] = [base];
          zigue(base, fim, 3, comp * 0.12, ramo);
          galhos.push(ramo);
        }
      }
      // Pisca: forte no começo, some em tremulação.
      const alpha = t < 0.15 ? 1 : (1 - t) * (0.6 + 0.4 * Math.random());
      const tracar = (pts: P[], w: number, a2: number) => {
        for (let i = 1; i < pts.length; i++) {
          const p0 = pts[i - 1];
          const p1 = pts[i];
          if (!p0 || !p1) continue;
          p.esticar('feixe', p0, p1, 26 * w * largura, { alpha: alpha * a2 * 0.55, cor, aditivo: true });
          p.esticar('feixe', p0, p1, 7 * w * largura, { alpha: alpha * a2, cor: 0xffffff, aditivo: true });
        }
      };
      tracar(caminho, 1, 1);
      for (const g of galhos) tracar(g, 0.55, 0.7);
      p.desenhar('clarao', b.x, b.y, { sx: 1.4 * largura, alpha: alpha * 0.9, cor: clarear(cor, 0.4), aditivo: true, rot: decorrido * 0.01 });
      return undefined;
    },
  });
}

/** O feixe reto (luz, gelo, plasma): cresce da origem, pulsa e afina até sumir. */
export function feixe(c: CenaVfx, de: P, ate: P, cor: number, largura = 1, ms = 380, textura: NomeTextura = 'feixe'): void {
  c.tocar({
    ms,
    desenhar: (t, decorrido, p) => {
      const a = c.tela(de);
      const b0 = c.tela(ate);
      const k = Math.min(1, t / 0.18);
      const b = { x: a.x + (b0.x - a.x) * sai(k), y: a.y + (b0.y - a.y) * sai(k) };
      const pulso = 1 + 0.12 * Math.sin(decorrido * 0.06);
      const fim = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
      p.esticar(textura, a, b, 44 * largura * pulso * fim, { alpha: 0.6 * fim, cor, aditivo: true });
      p.esticar(textura, a, b, 14 * largura * fim, { alpha: fim, cor: 0xffffff, aditivo: true });
      p.desenhar('clarao', a.x, a.y, { sx: 1.1 * largura, alpha: fim, cor, aditivo: true });
      p.desenhar('clarao', b.x, b.y, { sx: 1.5 * largura * pulso, alpha: fim, cor: clarear(cor, 0.4), aditivo: true });
    },
  });
}

export type PontaCorrente = 'gancho' | 'bola_ferro' | 'algema' | 'laco';

export interface OpcoesCorrente {
  de: () => P | null;
  ate: () => P | null;
  /** Tinta do metal (cinza no ferro; roxo na sombria; laranja na em brasa). */
  cor: number;
  ponta: PontaCorrente;
  /** O brilho em volta dos elos (a sombria solta névoa, a em brasa arde). */
  brilho?: number;
  /** Voo até o alvo, tempo preso e o recolhimento (ms). */
  vooMs?: number;
  presoMs?: number;
  recolheMs?: number;
  /** Ao prender (faíscas, tranco): chamado uma vez. */
  aoPrender?: () => void;
}

/**
 * A corrente de elos: sai da mão girando em arco, a ponta (gancho, bola, algema ou laço) crava no alvo, a corrente
 * fica esticada enquanto o alvo é arrastado e recolhe elo por elo até a mão. Os elos alternam de frente e de lado,
 * como uma corrente de verdade, e a catenária cede no voo e no recolhimento.
 */
export function corrente(c: CenaVfx, o: OpcoesCorrente): void {
  const voo = o.vooMs ?? 170;
  const preso = o.presoMs ?? 260;
  const recolhe = o.recolheMs ?? 220;
  const total = voo + preso + recolhe;
  let prendeu = false;
  let ultimoAlvo: P | null = null;
  c.tocar({
    ms: total,
    desenhar: (_t, ms, p) => {
      const pa = o.de();
      const pb = o.ate() ?? ultimoAlvo;
      if (!pa || !pb) return false;
      ultimoAlvo = pb;
      const a = c.tela(pa);
      const b = c.tela(pb);
      // Até onde a corrente chega (0 a 1 do caminho) e quanto ela cede (a barriga da catenária).
      let alcance: number;
      let barriga: number;
      if (ms < voo) {
        alcance = sai(ms / voo);
        barriga = 0.35 * (1 - ms / voo);
      } else if (ms < voo + preso) {
        alcance = 1;
        barriga = 0.04 * Math.sin(((ms - voo) / preso) * Math.PI * 3) * (1 - (ms - voo) / preso);
        if (!prendeu) {
          prendeu = true;
          o.aoPrender?.();
        }
      } else {
        const k = (ms - voo - preso) / recolhe;
        alcance = 1 - entra(k);
        barriga = 0.2 * k;
      }
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const comp = Math.hypot(dx, dy);
      if (comp < 2) return undefined;
      const nx = -dy / comp;
      const ny = dx / comp;
      const passo = 18;
      const elos = Math.max(2, Math.floor((comp * alcance) / passo));
      const ang = Math.atan2(dy, dx);
      // A barriga cede para baixo na tela (a gravidade), mais no meio.
      const ponto = (f: number) => {
        const curva = Math.sin(f * Math.PI) * barriga * comp;
        const sobe = c.iso ? -Math.sin(f * Math.PI) * 10 * (ms < voo ? 1 : 0) : 0;
        return { x: a.x + dx * f * alcance + nx * curva * 0.3, y: a.y + dy * f * alcance + Math.abs(curva) + sobe + ny * curva * 0.3 };
      };
      for (let i = 0; i < elos; i++) {
        const f = (i + 0.5) / elos;
        const q = ponto(f);
        const prox = ponto(Math.min(1, f + 1 / elos));
        const rot = Math.atan2(prox.y - q.y, prox.x - q.x) + Math.PI / 2;
        if (o.brilho !== undefined && i % 2 === 0) p.desenhar('brasa', q.x, q.y, { sx: 1.2, alpha: 0.4, cor: o.brilho, aditivo: true });
        p.desenhar(i % 2 === 0 ? 'elo' : 'elo_lado', q.x, q.y, { rot, sx: 0.7, sy: 0.78, cor: o.cor });
      }
      const fim = ponto(1);
      if (o.ponta === 'laco') {
        // O laço: um anel de elos apertando em volta do alvo.
        const r = 20 * (ms < voo ? 1.4 : 1 - 0.3 * Math.min(1, (ms - voo) / 120));
        for (let i = 0; i < 10; i++) {
          const a2 = (i / 10) * Math.PI * 2 + ms * 0.004;
          p.desenhar(i % 2 === 0 ? 'elo' : 'elo_lado', fim.x + Math.cos(a2) * r, fim.y + Math.sin(a2) * r * (c.iso ? 0.6 : 1), { rot: a2, sx: 0.45, sy: 0.5, cor: o.cor });
        }
      } else {
        const tamanho = o.ponta === 'bola_ferro' ? 1.05 : 0.9;
        const giro = o.ponta === 'bola_ferro' && ms < voo ? ms * 0.03 : 0;
        if (o.brilho !== undefined) p.desenhar('brasa', fim.x, fim.y, { sx: 2, alpha: 0.5, cor: o.brilho, aditivo: true });
        p.desenhar(o.ponta, fim.x, fim.y, { rot: ang + Math.PI / 2 + giro, sx: tamanho, cor: o.cor });
      }
      return undefined;
    },
  });
}

/**
 * O arco do golpe: a meia-lua da arma varrendo na frente do alvo, perpendicular ao ataque, com o fio claro.
 * `lado` alterna o sentido (golpes duplos se cruzam).
 */
export function arcoDeGolpe(c: CenaVfx, de: P | null, ate: P, cor: number, tamanho = 1, lado: 1 | -1 = 1, ms = 200, textura: NomeTextura = 'arco_golpe'): void {
  const base = de ? Math.atan2(c.tela(ate).y - c.tela(de).y, c.tela(ate).x - c.tela(de).x) : Math.random() * Math.PI * 2;
  c.tocar({
    ms,
    desenhar: (t, _ms, p) => {
      const q = c.tela(ate);
      const rot = base + Math.PI / 2 + lado * (-0.9 + 1.8 * sai(t));
      const s = tamanho * (1.6 + 0.4 * t);
      p.desenhar(textura, q.x - Math.cos(base) * 6, q.y - Math.sin(base) * 6, { rot, sx: s * lado, sy: s, alpha: pico(t, 0.25), cor, aditivo: true });
      p.desenhar(textura, q.x - Math.cos(base) * 6, q.y - Math.sin(base) * 6, { rot, sx: s * 0.8 * lado, sy: s * 0.8, alpha: pico(t, 0.25) * 0.9, cor: 0xffffff, aditivo: true });
    },
  });
}

/** Algo que brota do chão (espinho, mão de osso, cristal, pilar): sobe com um pulo, fica e afunda. */
export function brotar(c: CenaVfx, em: P, textura: NomeTextura, cor: number, tamanho = 1, ms = 700, aditivo = false, atrasoMs = 0): void {
  c.tocar({
    ms,
    atrasoMs,
    desenhar: (t, _ms, p) => {
      const q = c.chao(em);
      const sobe = t < 0.3 ? elastica(t / 0.3) : t > 0.75 ? 1 - entra((t - 0.75) / 0.25) : 1;
      const s = tamanho * 1.3;
      // Âncora embaixo: cresce do chão para cima.
      p.desenhar(textura, q.x, q.y + 4, { sx: s, sy: s * Math.max(0.01, sobe), ax: 0.5, ay: 0.92, alpha: Math.min(1, sobe * 1.5), cor, aditivo });
    },
  });
}

/** Algo que cai do alto até a célula (flecha, estrela, meteoro, estaca de gelo) e chama `aoChegar` no chão. */
/** `contraMao`: a peça aponta para trás do movimento (a chama do meteoro deixa a cauda para cima). */
export function cair(c: CenaVfx, em: P, textura: NomeTextura, cor: number, o: { altura?: number; ms?: number; tamanho?: number; atrasoMs?: number; inclinacao?: number; aditivo?: boolean; quadros?: readonly TexturaRica[]; contraMao?: boolean; aoChegar?: () => void }): void {
  const altura = o.altura ?? 160;
  const incl = o.inclinacao ?? 0;
  c.tocar({
    ms: o.ms ?? 260,
    ...(o.atrasoMs ? { atrasoMs: o.atrasoMs } : {}),
    ...(o.aoChegar ? { aoFim: o.aoChegar } : {}),
    desenhar: (t, ms, p) => {
      const q = c.chao(em);
      const k = entra(t);
      const x = q.x - incl * altura * (1 - k);
      const y = q.y - altura * (1 - k);
      const nome = o.quadros ? (o.quadros[Math.floor(ms / 60) % o.quadros.length] ?? textura) : textura;
      p.desenhar(nome, x, y, { rot: Math.atan2(altura, incl * altura) + Math.PI / 2 + (o.contraMao ? Math.PI : 0), sx: o.tamanho ?? 1, alpha: 1, cor, aditivo: o.aditivo ?? false });
    },
  });
}

/** `n` peças girando em volta de quem gira (lâminas do redemoinho, chamas do ciclone, penas, correntes). */
export function orbitar(c: CenaVfx, centro: () => P | null, textura: NomeTextura, cor: number, o: { n?: number; raio?: number; ms?: number; voltas?: number; tamanho?: number; aditivo?: boolean; quadros?: readonly TexturaRica[]; tangente?: boolean; rastro?: number }): void {
  const n = o.n ?? 4;
  const raio = (o.raio ?? 1) * PX;
  const voltas = o.voltas ?? 1.5;
  c.tocar({
    ms: o.ms ?? 450,
    desenhar: (t, ms, p) => {
      const pc = centro();
      if (!pc) return false;
      const q = c.tela(pc);
      const alpha = t < 0.15 ? t / 0.15 : t > 0.8 ? (1 - t) / 0.2 : 1;
      const r = raio * (0.6 + 0.4 * sai(Math.min(1, t * 3)));
      for (let k = 0; k <= (o.rastro ?? 0); k++) {
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 + (t - k * 0.03) * voltas * Math.PI * 2;
          const x = q.x + Math.cos(a) * r;
          const y = q.y + Math.sin(a) * r * (c.iso ? 0.55 : 1);
          const nome = o.quadros ? (o.quadros[(Math.floor(ms / 60) + i) % o.quadros.length] ?? textura) : textura;
          p.desenhar(nome, x, y, { rot: o.tangente === false ? 0 : a + Math.PI, sx: (o.tamanho ?? 0.8) * (1 - k * 0.2), alpha: alpha * (1 - k * 0.3), cor, aditivo: o.aditivo ?? false });
        }
      }
      return undefined;
    },
  });
}

/** O círculo no chão (rúnico, glifo, a runa da classe): aparece girando, brilha e some. */
export function circuloNoChao(c: CenaVfx, em: () => P | null, textura: NomeTextura, cor: number, tamanho = 2.5, ms = 700, giro = 1): void {
  c.tocar({
    ms,
    desenhar: (t, _ms, p) => {
      const pc = em();
      if (!pc) return false;
      const q = c.chao(pc);
      const s = tamanho * (0.7 + 0.3 * sai(Math.min(1, t * 3)));
      const alpha = t < 0.2 ? t / 0.2 : t > 0.75 ? (1 - t) / 0.25 : 1;
      p.desenhar(textura, q.x, q.y, { sx: s, sy: s * (c.iso ? 0.5 : 1), rot: c.iso ? 0 : t * giro * Math.PI, alpha: alpha * 0.9, cor, aditivo: true });
      return undefined;
    },
  });
}

/** A cúpula de hexágonos que se forma em volta (a barreira): os hexágonos chegam de fora e encaixam. */
export function cupula(c: CenaVfx, em: () => P | null, cor: number, ms = 650, raio = 0.8): void {
  const n = 8;
  c.tocar({
    ms,
    desenhar: (t, _ms, p) => {
      const pc = em();
      if (!pc) return false;
      const q = c.tela(pc);
      const chega = elastica(Math.min(1, t / 0.45));
      const alpha = t > 0.7 ? (1 - t) / 0.3 : 1;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const r = raio * PX * (1.8 - 0.8 * chega);
        p.desenhar('hexagono', q.x + Math.cos(a) * r, q.y + Math.sin(a) * r * 0.85, { sx: 0.55, alpha: alpha * 0.85, cor, aditivo: true, rot: a });
      }
      p.desenhar('choque', q.x, q.y, { sx: raio * 3.4, alpha: alpha * 0.5 * chega, cor, aditivo: true });
      return undefined;
    },
  });
}

/** Pontos sorteados de uma lista (sem repetir), para espalhar pela área. */
export function sortear<T>(lista: readonly T[], n: number): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = copia[i];
    const b = copia[j];
    if (a !== undefined && b !== undefined) {
      copia[i] = b;
      copia[j] = a;
    }
  }
  return copia.slice(0, n);
}

export const tremido = (p: P, r = 0.4): P => ({ x: p.x + (Math.random() - 0.5) * r, y: p.y + (Math.random() - 0.5) * r });
