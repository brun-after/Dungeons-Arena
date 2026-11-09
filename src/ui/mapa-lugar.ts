import { marcadorDaEntidade } from './minimapa';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import { t } from '../i18n';
import { portaDa, reinoDoConteudo } from '../mundo/reino';
import { proximaEtapa } from '../mundo/orientacao';
import { tipoEm } from '../world/fase';
import { cartografia, rosaDosVentos } from './cartografia';
import { lapideAtiva, type OrientacaoMundo } from './orientacao-mundo';

/** 09/11/2026 (D-143): o modo de escolher um ponto (o destino do Portal temporário), no lugar de marcar. */
export interface EscolhaNoMapa {
  escolher: (c: { x: number; y: number }) => void;
  escolhido: () => { x: number; y: number } | null;
}

export function mapaDoLugar(ctx: ContextoSimulacao, estado: () => EstadoJogo | null, idLocal: string, lugar: string, descobertas: readonly string[], orientacao?: OrientacaoMundo, escolha?: EscolhaNoMapa): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.className = 'mapa-terreno'; c.width = 1000; c.height = 520; c.tabIndex = 0;
  c.setAttribute('aria-label', t('mundo.mapa.pontos'));
  const g = c.getContext('2d');
  if (!g) return c;
  const fase = ctx.fase;
  const mapa = cartografia(fase.largura, fase.altura, c.width, c.height, 10);
  const reino = reinoDoConteudo(ctx.conteudo);
  const regiao = reino.regioes.find(r => lugar === `regiao:${r.id}`);
  const entradas = regiao?.estruturas.filter(e => !e.escondida || descobertas.includes(`${e.destino.tipo}:${e.destino.id}`)) ?? [];
  const chave = `mapa:pontos:${lugar}`;
  let pontos: { x: number; y: number }[] = [];
  try {
    const v: unknown = JSON.parse(localStorage.getItem(chave) ?? '[]');
    if (Array.isArray(v)) pontos = v.filter((p: unknown): p is { x: number; y: number } => typeof p === 'object' && p !== null && 'x' in p && 'y' in p && typeof p.x === 'number' && typeof p.y === 'number' && Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.y >= 0 && p.x < fase.largura && p.y < fase.altura).slice(0, 50);
  } catch { /* Armazenamento opcional. */ }
  // A cartografia é calculada uma vez; só posições, rótulos e o rumo são atualizados.
  const fundo = document.createElement('canvas'); fundo.width = c.width; fundo.height = c.height;
  const fg = fundo.getContext('2d');
  const m = mapa.matriz;
  if (fg) {
    fg.save(); fg.transform(m.a, m.b, m.c, m.d, m.e, m.f);
    const cores: Record<string, string> = { mato: '#3d6051', estrada: '#b5a17b', agua: '#28586c', piso: '#74736b', fachada: '#b3aa91', parede: '#263d39', saida: '#ecd395' };
    for (let y = 0; y < fase.altura; y++) for (let x = 0; x < fase.largura; x++) {
      const tipo = tipoEm(fase, x, y);
      fg.fillStyle = cores[tipo] ?? '#101e25'; fg.fillRect(x, y, 1.02, 1.02);
      // Margens dos rios, fachadas e relevos: detalhe derivado do terreno real.
      if (tipo === 'agua' || tipo === 'fachada' || tipo === 'parede') {
        fg.strokeStyle = tipo === 'agua' ? '#6392a0' : '#80917b'; fg.lineWidth = .12;
        fg.beginPath();
        if (x > 0 && tipoEm(fase, x - 1, y) !== tipo) { fg.moveTo(x, y); fg.lineTo(x, y + 1); }
        if (y > 0 && tipoEm(fase, x, y - 1) !== tipo) { fg.moveTo(x, y); fg.lineTo(x + 1, y); }
        fg.stroke();
      }
    }
    fg.strokeStyle = 'rgba(220,232,210,.1)'; fg.lineWidth = .15;
    for (let x = 0; x <= fase.largura; x += 20) { fg.beginPath(); fg.moveTo(x, 0); fg.lineTo(x, fase.altura); fg.stroke(); }
    for (let y = 0; y <= fase.altura; y += 20) { fg.beginPath(); fg.moveTo(0, y); fg.lineTo(fase.largura, y); fg.stroke(); }
    fg.strokeStyle = '#b8c3a2'; fg.lineWidth = .4; fg.strokeRect(0, 0, fase.largura, fase.altura);
    fg.restore();
    rosaDosVentos(fg, 925, 65, 30);
    fg.font = '12px sans-serif'; fg.fillStyle = '#98afb4'; fg.textAlign = 'left';
    fg.fillText(t('mundo.mapa.bussola'), 25, 30);
  }
  let cursor = { x: Math.floor(fase.largura / 2), y: Math.floor(fase.altura / 2) };
  let mostrarCursor = false;
  const rotulo = (nome: string, x: number, y: number, cor: string) => {
    g.font = '600 13px sans-serif';
    const largura = Math.min(190, g.measureText(nome).width + 18);
    const tx = Math.max(largura / 2 + 5, Math.min(c.width - largura / 2 - 5, x));
    const ty = Math.max(45, y - 15);
    g.fillStyle = '#12242bea'; g.fillRect(tx - largura / 2, ty - 16, largura, 23);
    g.fillStyle = cor; g.textAlign = 'center'; g.fillText(nome, tx, ty, largura - 12);
  };
  const desenhar = () => {
    g.clearRect(0, 0, c.width, c.height);
    g.drawImage(fundo, 0, 0);
    const atual = estado(), eu = atual?.entidades.find(e => e.id === idLocal);
    const etapa = orientacao?.destino ? proximaEtapa(reino, lugar, orientacao.destino, fase) : null;
    if (eu && etapa?.ponto) {
      const a = mapa.ponto(eu.x, eu.y), b = mapa.ponto(etapa.ponto.x, etapa.ponto.y);
      g.strokeStyle = '#f6ce78'; g.lineWidth = 2; g.setLineDash([7, 6]);
      g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); g.setLineDash([]);
      g.strokeRect(b.x - 7, b.y - 7, 14, 14);
    }
    for (const estrutura of entradas) {
      const o = portaDa(estrutura).porta, p = mapa.ponto(o.x, o.y);
      g.fillStyle = '#f6ce78'; g.beginPath(); g.moveTo(p.x, p.y - 6); g.lineTo(p.x + 6, p.y); g.lineTo(p.x, p.y + 6); g.lineTo(p.x - 6, p.y); g.closePath(); g.fill();
      rotulo(estrutura.nome, p.x, p.y, '#f6ce78');
    }
    for (const p of pontos) {
      const q = mapa.ponto(p.x, p.y);
      g.fillStyle = '#ffe0a0'; g.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 5, raio = i % 2 ? 4 : 10;
        const x = q.x + Math.cos(a) * raio, y = q.y + Math.sin(a) * raio;
        if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.closePath(); g.fill();
    }
    for (const entidade of atual?.entidades ?? []) {
      if (entidade.id === idLocal) continue;
      const marcador = marcadorDaEntidade(ctx, idLocal, entidade, eu);
      if (!marcador) continue;
      const p = mapa.ponto(entidade.x, entidade.y);
      g.fillStyle = marcador.cor;
      g.beginPath();
      g.arc(p.x, p.y, marcador.r * 1.8, 0, Math.PI * 2);
      g.fill();
    }
    if (eu) {
      const p = mapa.ponto(eu.x, eu.y);
      g.fillStyle = '#ffffff'; g.strokeStyle = '#13262d'; g.lineWidth = 3;
      g.beginPath(); g.arc(p.x, p.y, 7, 0, Math.PI * 2); g.fill(); g.stroke();
      g.strokeStyle = '#ffffff77'; g.lineWidth = 1; g.beginPath(); g.arc(p.x, p.y, 12, 0, Math.PI * 2); g.stroke();
    }
    // 09/11/2026 (D-143): a lápide de quem morreu (5 min) e o ponto escolhido para o portal.
    const lapide = lapideAtiva(orientacao, Date.now());
    if (lapide?.lugar === lugar) {
      const q = mapa.ponto(lapide.ponto.x, lapide.ponto.y);
      g.fillStyle = '#d9d4ff'; g.strokeStyle = '#1b1530'; g.lineWidth = 2;
      g.beginPath(); g.roundRect(q.x - 6, q.y - 12, 12, 16, [6, 6, 1, 1]); g.fill(); g.stroke();
      g.strokeStyle = '#1b1530'; g.beginPath(); g.moveTo(q.x, q.y - 9); g.lineTo(q.x, q.y); g.moveTo(q.x - 3, q.y - 6); g.lineTo(q.x + 3, q.y - 6); g.stroke();
      rotulo(t('mundo.lapide.nome'), q.x, q.y - 8, '#d9d4ff');
    }
    const alvo = escolha?.escolhido();
    if (alvo) {
      const q = mapa.ponto(alvo.x, alvo.y);
      g.strokeStyle = '#5ce1ff'; g.lineWidth = 3;
      g.beginPath(); g.ellipse(q.x, q.y, 11, 6, 0, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.ellipse(q.x, q.y - 12, 6, 11, 0, 0, Math.PI * 2); g.stroke();
    }
    if (mostrarCursor) { const p = mapa.ponto(cursor.x, cursor.y); g.strokeStyle = '#ffffff'; g.strokeRect(p.x - 8, p.y - 8, 16, 16); }
  };
  const marcar = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= fase.largura || y >= fase.altura) return;
    if (escolha) {
      escolha.escolher({ x, y });
      desenhar();
      return;
    }
    const q = mapa.ponto(x, y);
    const perto = pontos.findIndex(p => { const a = mapa.ponto(p.x, p.y); return Math.hypot(a.x - q.x, a.y - q.y) < 14; });
    if (perto >= 0) {
      const marcado = pontos[perto];
      const ativo = orientacao?.destino;
      const selecionado = ativo?.lugar === lugar && ativo.ponto?.x === marcado?.x && ativo.ponto?.y === marcado?.y;
      if (orientacao && marcado && !selecionado) orientacao.definir({ lugar, nome: t('mundo.mapa.ponto', marcado), ponto: marcado });
      else { pontos.splice(perto, 1); if (selecionado) orientacao?.definir(null); }
    } else if (pontos.length < 50) {
      pontos.push({ x, y });
      orientacao?.definir({ lugar, nome: t('mundo.mapa.ponto', { x, y }), ponto: { x, y } });
    }
    try { localStorage.setItem(chave, JSON.stringify(pontos)); } catch { /* Armazenamento opcional. */ }
    desenhar();
  };
  c.addEventListener('click', e => {
    const r = c.getBoundingClientRect();
    const p = mapa.celula((e.clientX - r.left) / r.width * c.width, (e.clientY - r.top) / r.height * c.height);
    marcar(p.x, p.y);
  });
  c.addEventListener('keydown', e => {
    const delta = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key];
    if (delta) { e.preventDefault(); mostrarCursor = true; cursor = { x: Math.max(0, Math.min(fase.largura - 1, cursor.x + (delta[0] ?? 0))), y: Math.max(0, Math.min(fase.altura - 1, cursor.y + (delta[1] ?? 0))) }; desenhar(); }
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); marcar(cursor.x, cursor.y); }
  });
  desenhar();
  const timer = window.setInterval(() => { if (c.isConnected) desenhar(); else clearInterval(timer); }, 100);
  return c;
}
