// Marco 51 (21/11/2026, D-197): a cena da forja (canvas 2D, no tom sombrio do jogo). A fornalha à esquerda respira
// em brasa; a bigorna no meio tem o círculo rúnico; a peça na mesa brilha na cor do elemento. Ao forjar, a cena corre
// em fases: aquecer (o material derrete na cor do elemento), martelar (faíscas no ritmo dos golpes; tocar acrescenta
// golpes), gravar (as runas acendem uma a uma) e temperar (vapor). No fim, a peça gira com os engastes acesos. Só
// conta a história: o resultado vem do núcleo, pelo comando. Com `prefers-reduced-motion`, as fases passam sem
// animação.

export type FaseDaForja = 'parada' | 'aquecer' | 'martelar' | 'gravar' | 'temperar' | 'pronta';

export interface CenaDaForja {
  /** A cor do elemento da peça (ou do material); null = aço. */
  cor: string | null;
  /** Quantos engastes a peça tem e quantos estão cheios. */
  engastes: number;
  cheios: number;
  /** Há uma peça na bigorna? */
  temPeca: boolean;
}

interface Particula { x: number; y: number; vx: number; vy: number; vida: number; cor: string; tam: number }

const DURACAO: Record<Exclude<FaseDaForja, 'parada' | 'pronta'>, number> = { aquecer: 900, martelar: 1100, gravar: 800, temperar: 700 };
const ORDEM: FaseDaForja[] = ['aquecer', 'martelar', 'gravar', 'temperar', 'pronta'];

export interface Forja {
  elemento: HTMLCanvasElement;
  /** Corre as fases e chama `aoFim` quando a peça fica pronta (é aí que o comando sai). */
  forjar: (aoFim: () => void) => void;
  fase: () => FaseDaForja;
  /** Volta a animar depois que a mesa redesenha e o canvas é posto de novo na página. */
  reanimar: () => void;
}

export function criarCenaDaForja(largura: number, altura: number, cena: () => CenaDaForja): Forja {
  const canvas = document.createElement('canvas');
  canvas.className = 'cena-forja';
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(largura * dpr);
  canvas.height = Math.round(altura * dpr);
  canvas.style.width = `${String(largura)}px`;
  canvas.style.height = `${String(altura)}px`;
  canvas.setAttribute('aria-hidden', 'true');
  const g = canvas.getContext('2d');
  const parado = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const parts: Particula[] = [];
  let fase: FaseDaForja = 'parada';
  let faseDesde = 0;
  let aoFim: (() => void) | null = null;
  const bigorna = { x: largura * 0.55, y: altura * 0.68 };
  const fornalha = { x: largura * 0.16, y: altura * 0.62 };

  const faiscas = (x: number, y: number, n: number, cor: string) => {
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
      const v = 1.5 + Math.random() * 3.5;
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: 1, cor, tam: 1 + Math.random() * 1.5 });
    }
  };
  canvas.addEventListener('pointerdown', () => {
    if (fase !== 'martelar') return;
    faiscas(bigorna.x, bigorna.y - 14, 18, '#ffd27a');
  });

  const quadro = (agora: number) => {
    if (!g) {
      rodando = false;
      return;
    }
    const c = cena();
    const cor = c.cor ?? '#c9d2dc';
    if (fase !== 'parada' && fase !== 'pronta') {
      const dur = parado ? 0 : DURACAO[fase];
      if (agora - faseDesde >= dur) {
        fase = ORDEM[ORDEM.indexOf(fase) + 1] ?? 'pronta';
        faseDesde = agora;
        if (fase === 'pronta') {
          const fim = aoFim;
          aoFim = null;
          fim?.();
        }
      }
    }
    const t = (agora - faseDesde) / 1000;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    // O fundo: pedra escura e a luz da fornalha.
    g.fillStyle = '#0d0b0a';
    g.fillRect(0, 0, largura, altura);
    const respira = 0.75 + Math.sin(agora / 400) * 0.08 + (fase === 'aquecer' ? 0.25 : 0);
    const luz = g.createRadialGradient(fornalha.x, fornalha.y, 4, fornalha.x, fornalha.y, largura * 0.45 * respira);
    luz.addColorStop(0, fase === 'aquecer' ? `${cor}dd` : '#ff8a26cc');
    luz.addColorStop(0.4, '#ff5a1a44');
    luz.addColorStop(1, 'transparent');
    g.fillStyle = luz;
    g.fillRect(0, 0, largura, altura);
    // A fornalha: a boca em arco e as brasas.
    g.fillStyle = '#231a14';
    g.fillRect(fornalha.x - 34, fornalha.y - 46, 68, 70);
    g.fillStyle = '#ff7a1c';
    g.beginPath();
    g.arc(fornalha.x, fornalha.y + 4, 20, Math.PI, 0);
    g.lineTo(fornalha.x + 20, fornalha.y + 18);
    g.lineTo(fornalha.x - 20, fornalha.y + 18);
    g.fill();
    if (!parado && Math.random() < 0.4) parts.push({ x: fornalha.x + (Math.random() - 0.5) * 30, y: fornalha.y, vx: (Math.random() - 0.5) * 0.4, vy: -0.6 - Math.random(), vida: 1, cor: '#ff9a3a', tam: 1.2 });
    // A bigorna e o círculo rúnico sobre ela.
    g.fillStyle = '#2b2d31';
    g.beginPath();
    g.moveTo(bigorna.x - 52, bigorna.y - 10);
    g.lineTo(bigorna.x + 44, bigorna.y - 10);
    g.lineTo(bigorna.x + 62, bigorna.y - 20);
    g.lineTo(bigorna.x + 30, bigorna.y + 2);
    g.lineTo(bigorna.x + 18, bigorna.y + 26);
    g.lineTo(bigorna.x - 22, bigorna.y + 26);
    g.lineTo(bigorna.x - 34, bigorna.y + 2);
    g.closePath();
    g.fill();
    const runas = Math.max(1, c.engastes);
    const acesas = fase === 'gravar' ? Math.min(runas, Math.floor((t / Math.max(0.1, DURACAO.gravar / 1000)) * runas) + 1) : fase === 'temperar' || fase === 'pronta' ? runas : c.cheios;
    g.save();
    g.translate(bigorna.x, bigorna.y - 34);
    g.scale(1, 0.32);
    g.strokeStyle = cor;
    g.lineWidth = 2;
    g.globalAlpha = 0.55 + (fase === 'gravar' ? 0.4 : 0);
    g.beginPath();
    g.arc(0, 0, 46, 0, Math.PI * 2);
    g.stroke();
    for (let i = 0; i < runas; i++) {
      const a = (i / runas) * Math.PI * 2 + agora / 2000;
      g.globalAlpha = i < acesas ? 1 : 0.25;
      g.fillStyle = cor;
      g.beginPath();
      g.arc(Math.cos(a) * 46, Math.sin(a) * 46, 6, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
    // A peça na bigorna.
    if (c.temPeca) {
      const quente = fase === 'aquecer' || fase === 'martelar' ? 1 : fase === 'gravar' ? 0.6 : 0.2;
      g.save();
      g.translate(bigorna.x, bigorna.y - 18);
      if (fase === 'pronta' && !parado) g.rotate(Math.sin(agora / 500) * 0.15);
      g.shadowColor = cor;
      g.shadowBlur = 8 + quente * 18;
      g.fillStyle = quente > 0.5 ? '#ffb46a' : '#d8dde4';
      g.fillRect(-40, -4, 80, 8);
      g.fillStyle = cor;
      g.fillRect(-46, -6, 8, 12);
      g.restore();
    }
    // O martelo e as faíscas no ritmo.
    if (fase === 'martelar' && !parado) {
      const batida = (t * 3.2) % 1;
      const alto = batida < 0.5 ? batida * 2 : 2 - batida * 2;
      g.save();
      g.translate(bigorna.x + 30, bigorna.y - 70 + alto * -30);
      g.rotate(-0.6 + alto * 0.8);
      g.fillStyle = '#5a4a3a';
      g.fillRect(-3, 0, 6, 46);
      g.fillStyle = '#7d8187';
      g.fillRect(-14, -8, 28, 14);
      g.restore();
      if (batida > 0.95 || batida < 0.05) faiscas(bigorna.x, bigorna.y - 20, 6, '#ffd27a');
    }
    // O vapor da têmpera.
    if (fase === 'temperar' && !parado) for (let i = 0; i < 3; i++) parts.push({ x: bigorna.x + (Math.random() - 0.5) * 70, y: bigorna.y - 20, vx: (Math.random() - 0.5) * 0.5, vy: -0.8 - Math.random() * 0.6, vida: 1, cor: '#d8e2ea', tam: 4 + Math.random() * 5 });
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      if (!p) continue;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.tam > 3 ? -0.01 : 0.12;
      p.vida -= p.tam > 3 ? 0.02 : 0.03;
      if (p.vida <= 0) {
        parts.splice(i, 1);
        continue;
      }
      g.globalAlpha = p.tam > 3 ? p.vida * 0.35 : p.vida;
      g.fillStyle = p.cor;
      g.beginPath();
      g.arc(p.x, p.y, p.tam, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
    if (canvas.isConnected) requestAnimationFrame(quadro);
    else rodando = false;
  };
  let rodando = false;
  let tentativas = 0;
  const comecar = () => {
    if (canvas.isConnected) {
      rodando = true;
      requestAnimationFrame(quadro);
    } else if (++tentativas < 40) setTimeout(comecar, 50);
  };
  if (typeof requestAnimationFrame === 'function') comecar();
  return {
    elemento: canvas,
    fase: () => fase,
    reanimar: () => {
      if (rodando || typeof requestAnimationFrame !== 'function') return;
      tentativas = 0;
      comecar();
    },
    forjar: (fim) => {
      if (fase !== 'parada' && fase !== 'pronta') return;
      aoFim = fim;
      fase = 'aquecer';
      faseDesde = performance.now();
      if (parado) {
        fase = 'pronta';
        aoFim = null;
        fim();
      }
    },
  };
}
