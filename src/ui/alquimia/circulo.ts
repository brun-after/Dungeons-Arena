// Marco 50 (21/11/2026, D-196): o círculo vivo da bancada (canvas 2D). O anel externo gira com as marcas rúnicas;
// cada vértice ocupado brilha na cor do elemento da skill e solta faíscas para o centro; as linhas entre os vértices
// ocupados formam o triângulo da fórmula. O tom muda com a mistura: dourado na ressonância, vermelho e trêmulo na
// instabilidade, violeta no neutro. Ao transmutar, o círculo se fecha num clarão. Só apresentação: nada aqui muda o
// estado do jogo. Com `prefers-reduced-motion`, desenha parado.

export type TomDoCirculo = 'vazio' | 'neutro' | 'ressonante' | 'instavel';

export interface CenaDoCirculo {
  /** A cor de cada vértice (núcleo, forma, eco); null = vazio. */
  vertices: readonly (string | null)[];
  tom: TomDoCirculo;
  /** Quantas runas e material estão no anel (acendem marcas no anel). */
  runas: readonly string[];
  material: string | null;
}

const TONS: Record<TomDoCirculo, string> = { vazio: '#6d6480', neutro: '#9b7bff', ressonante: '#f2c14e', instavel: '#e0503c' };
/** Os ângulos dos três vértices (o núcleo no alto). */
export const ANGULOS_DOS_VERTICES = [-Math.PI / 2, Math.PI / 6, (5 * Math.PI) / 6] as const;

interface Faisca { x: number; y: number; vx: number; vy: number; vida: number; cor: string }

export interface Circulo {
  elemento: HTMLCanvasElement;
  /** Dispara o clarão da transmutação. */
  transmutar: () => void;
}

export function criarCirculo(tamanho: number, cena: () => CenaDoCirculo): Circulo {
  const canvas = document.createElement('canvas');
  canvas.className = 'circulo-alquimia';
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(tamanho * dpr);
  canvas.height = Math.round(tamanho * dpr);
  canvas.style.width = `${String(tamanho)}px`;
  canvas.style.height = `${String(tamanho)}px`;
  canvas.setAttribute('aria-hidden', 'true');
  const g = canvas.getContext('2d');
  const parado = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const faiscas: Faisca[] = [];
  let clarao = 0;
  let inicio = -1;
  const centro = tamanho / 2;
  const raio = tamanho * 0.36;
  const ponto = (ang: number, r = raio) => ({ x: centro + Math.cos(ang) * r, y: centro + Math.sin(ang) * r });

  const quadro = (agora: number) => {
    if (!g) return;
    if (inicio < 0) inicio = agora;
    const tSeg = (agora - inicio) / 1000;
    const c = cena();
    const tom = TONS[c.tom];
    const tremor = c.tom === 'instavel' && !parado ? Math.sin(tSeg * 37) * 0.8 : 0;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, tamanho, tamanho);
    // O fundo: um halo no tom.
    const halo = g.createRadialGradient(centro, centro, raio * 0.2, centro, centro, raio * 1.35);
    halo.addColorStop(0, `${tom}33`);
    halo.addColorStop(1, 'transparent');
    g.fillStyle = halo;
    g.fillRect(0, 0, tamanho, tamanho);
    // Os dois anéis e as marcas rúnicas girando.
    g.save();
    g.translate(centro + tremor, centro);
    g.strokeStyle = tom;
    g.lineWidth = 1.5;
    g.globalAlpha = 0.8;
    for (const r of [raio * 1.18, raio * 1.04]) {
      g.beginPath();
      g.arc(0, 0, r, 0, Math.PI * 2);
      g.stroke();
    }
    const giro = parado ? 0 : tSeg * 0.25;
    const acesas = c.runas.length * 4 + (c.material ? 4 : 0);
    for (let i = 0; i < 24; i++) {
      const ang = giro + (i / 24) * Math.PI * 2;
      g.save();
      g.rotate(ang);
      g.translate(raio * 1.11, 0);
      g.globalAlpha = i < acesas ? 1 : 0.45;
      g.beginPath();
      // Uma marca de três traços (variada pelo índice).
      const k = i % 3;
      g.moveTo(-3, -4);
      g.lineTo(k === 0 ? 3 : 0, 4);
      g.moveTo(3, -4);
      g.lineTo(k === 1 ? -3 : 0, 4);
      if (k === 2) {
        g.moveTo(-3, 0);
        g.lineTo(3, 0);
      }
      g.stroke();
      g.restore();
    }
    g.restore();
    // O triângulo da fórmula entre os vértices ocupados, e cada vértice no tom do elemento.
    const pts = ANGULOS_DOS_VERTICES.map((a) => ponto(a));
    g.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % 3];
      const ca = c.vertices[i];
      const cb = c.vertices[(i + 1) % 3];
      if (!a || !b) continue;
      g.globalAlpha = ca && cb ? 0.9 : 0.2;
      g.strokeStyle = ca && cb ? tom : '#ffffff';
      g.beginPath();
      g.moveTo(a.x, a.y);
      g.lineTo(b.x, b.y);
      g.stroke();
    }
    pts.forEach((p, i) => {
      const cor = c.vertices[i];
      g.globalAlpha = 1;
      const pulso = parado ? 1 : 1 + Math.sin(tSeg * 3 + i) * 0.12;
      const brilho = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, 26 * pulso);
      brilho.addColorStop(0, cor ? `${cor}cc` : '#ffffff22');
      brilho.addColorStop(1, 'transparent');
      g.fillStyle = brilho;
      g.beginPath();
      g.arc(p.x, p.y, 26 * pulso, 0, Math.PI * 2);
      g.fill();
      // As faíscas saem do vértice ocupado para o centro.
      if (cor && !parado && Math.random() < 0.35) {
        const ang = Math.atan2(centro - p.y, centro - p.x) + (Math.random() - 0.5) * 0.6;
        const v = 0.6 + Math.random() * 0.9;
        faiscas.push({ x: p.x, y: p.y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, vida: 1, cor });
      }
    });
    // As faíscas e o clarão.
    for (let i = faiscas.length - 1; i >= 0; i--) {
      const f = faiscas[i];
      if (!f) continue;
      f.x += f.vx;
      f.y += f.vy;
      f.vida -= 0.012;
      if (f.vida <= 0 || Math.hypot(f.x - centro, f.y - centro) < 4) {
        faiscas.splice(i, 1);
        continue;
      }
      g.globalAlpha = f.vida;
      g.fillStyle = f.cor;
      g.fillRect(f.x - 1, f.y - 1, 2, 2);
    }
    if (clarao > 0) {
      g.globalAlpha = clarao;
      const luz = g.createRadialGradient(centro, centro, 0, centro, centro, raio * 1.3 * (1.4 - clarao * 0.4));
      luz.addColorStop(0, '#ffffff');
      luz.addColorStop(0.4, tom);
      luz.addColorStop(1, 'transparent');
      g.fillStyle = luz;
      g.fillRect(0, 0, tamanho, tamanho);
      clarao = Math.max(0, clarao - 0.02);
    }
    g.globalAlpha = 1;
    if (canvas.isConnected && !parado) requestAnimationFrame(quadro);
  };
  // Começa quando o canvas entrar na página (e para sozinho quando sair dela).
  let tentativas = 0;
  const comecar = () => {
    if (canvas.isConnected) requestAnimationFrame(quadro);
    else if (++tentativas < 40) setTimeout(comecar, 50);
  };
  if (typeof requestAnimationFrame === 'function') comecar();
  return {
    elemento: canvas,
    transmutar: () => {
      clarao = 1;
      if (parado) requestAnimationFrame(quadro);
    },
  };
}
