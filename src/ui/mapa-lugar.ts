// 02/11/2026: mapa do terreno atual com posição, entradas e pontos pessoais persistentes.
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import { t } from '../i18n';
import { portaDa } from '../mundo/reino';
import { tipoEm } from '../world/fase';

export function mapaDoLugar(ctx: ContextoSimulacao, estado: () => EstadoJogo | null, idLocal: string, lugar: string, descobertas: readonly string[]): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.className = 'mapa-terreno';
  c.width = 700;
  c.height = 700;
  c.tabIndex = 0;
  c.setAttribute('aria-label', t('mundo.mapa.pontos'));
  const g = c.getContext('2d');
  if (!g) return c;
  const fase = ctx.fase;
  const escala = c.width / Math.max(fase.largura, fase.altura);
  const regiao = [...ctx.conteudo.reinos.values()].flatMap(r => r.regioes).find(r => lugar === `regiao:${r.id}`);
  const entradas = regiao?.estruturas.filter(e => !e.escondida || descobertas.includes(`${e.destino.tipo}:${e.destino.id}`)) ?? [];
  const chave = `mapa:pontos:${lugar}`;
  let pontos: { x: number; y: number }[] = [];
  try {
    const v: unknown = JSON.parse(localStorage.getItem(chave) ?? '[]');
    if (Array.isArray(v)) pontos = v.filter((p: unknown): p is { x: number; y: number } => typeof p === 'object' && p !== null && 'x' in p && 'y' in p && typeof p.x === 'number' && typeof p.y === 'number' && Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.y >= 0 && p.x < fase.largura && p.y < fase.altura).slice(0, 50);
  } catch { /* Sem armazenamento: funciona durante esta abertura. */ }
  const fundo = document.createElement('canvas');
  fundo.width = fase.largura;
  fundo.height = fase.altura;
  const fg = fundo.getContext('2d');
  const cores: Record<string, string> = { mato: '#486440', estrada: '#aa9167', agua: '#396f92', piso: '#61566b', fachada: '#a08970', parede: '#242631', saida: '#e9bd65' };
  if (fg) for (let y = 0; y < fase.altura; y++) for (let x = 0; x < fase.largura; x++) {
    fg.fillStyle = cores[tipoEm(fase, x, y)] ?? '#161a21';
    fg.fillRect(x, y, 1, 1);
  }
  const desenhar = () => {
    g.clearRect(0, 0, c.width, c.height);
    g.globalAlpha = .8;
    g.imageSmoothingEnabled = false;
    g.drawImage(fundo, 0, 0, fase.largura * escala, fase.altura * escala);
    g.globalAlpha = 1;
    const atual = estado();
    g.font = 'bold 12px sans-serif';
    g.textAlign = 'center';
    // O estado recebido é recortado por proximidade. As entradas do mapa vêm do reino,
    // para que a cartografia mostre também as dungeons distantes já conhecidas.
    for (const estrutura of entradas) {
      const o = portaDa(estrutura).porta;
      g.fillStyle = '#ffd875';
      g.fillRect(o.x * escala - 3, o.y * escala - 3, 6, 6);
      const tx = Math.max(65, Math.min(c.width - 65, o.x * escala));
      g.strokeStyle = '#10151c'; g.lineWidth = 3;
      g.strokeText(estrutura.nome, tx, o.y * escala - 9, 160);
      g.fillText(estrutura.nome, tx, o.y * escala - 9, 160);
    }
    for (const p of pontos) {
      g.fillStyle = '#ffdb68';
      const x = (p.x + .5) * escala, y = (p.y + .5) * escala;
      g.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 3 : 8;
        const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
        if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
      }
      g.closePath(); g.fill();
    }
    const eu = atual?.entidades.find(e => e.id === idLocal);
    if (eu) {
      g.fillStyle = '#ffffff'; g.strokeStyle = '#10151c'; g.lineWidth = 2;
      g.beginPath(); g.arc((eu.x + .5) * escala, (eu.y + .5) * escala, 5, 0, Math.PI * 2); g.fill(); g.stroke();
    }
  };
  c.addEventListener('click', e => {
    const r = c.getBoundingClientRect();
    const x = Math.floor((e.clientX - r.left) / r.width * c.width / escala);
    const y = Math.floor((e.clientY - r.top) / r.height * c.height / escala);
    if (x < 0 || y < 0 || x >= fase.largura || y >= fase.altura) return;
    const perto = pontos.findIndex(p => Math.hypot(p.x - x, p.y - y) * escala < 14);
    if (perto >= 0) pontos.splice(perto, 1);
    else if (pontos.length < 50) pontos.push({ x, y });
    try { localStorage.setItem(chave, JSON.stringify(pontos)); } catch { /* Armazenamento opcional. */ }
    desenhar();
  });
  desenhar();
  // O diálogo não pausa o Mundo; posição continua atualizando e o fechamento cancela o timer.
  const timer = window.setInterval(() => { if (c.isConnected) desenhar(); else clearInterval(timer); }, 200);
  return c;
}
