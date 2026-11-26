import { marcadorDaEntidade } from './minimapa';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import { t } from '../i18n';
import { portaDa, reinoDoConteudo } from '../mundo/reino';
import { proximaEtapa } from '../mundo/orientacao';
import { tipoEm } from '../world/fase';
import { cartografia, rosaDosVentos } from './cartografia';
import { lapideAtiva, type OrientacaoMundo } from './orientacao-mundo';
import { desenharMarco, marcosDaFase, marcosDoEstado, type MarcoDoMapa, type TipoDeMarco } from './marcos-do-mapa';
import { FONTE_DO_JOGO } from './runa-texto';
import { lerLugar } from '../mundo/lugares';

/** 09/11/2026 (D-143): o modo de escolher um ponto (o destino do Portal temporário), no lugar de marcar. */
export interface EscolhaNoMapa {
  escolher: (c: { x: number; y: number }) => void;
  escolhido: () => { x: number; y: number } | null;
}

/**
 * Marco 53 (22/11/2026, D-203): `andar` leva o personagem até o ponto marcado (o condutor, ui/condutor.ts); só no mapa
 * do lugar onde ele está.
 * D-205 (25/11/2026): a cartografia em pergaminho da entrega visual: papel, moldura, bússola num medalhão, rótulos
 * que não se sobrepõem, clique num marco para segui-lo e o índice dos pontos (`indice`) ao lado do mapa.
 */
export function mapaDoLugar(ctx: ContextoSimulacao, estado: () => EstadoJogo | null, idLocal: string, lugar: string, descobertas: readonly string[], orientacao?: OrientacaoMundo, escolha?: EscolhaNoMapa, andar?: (ponto: { x: number; y: number }) => void, indice?: HTMLElement): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.className = 'mapa-terreno'; c.width = 1000; c.height = 520; c.tabIndex = 0;
  c.setAttribute('aria-label', t('mundo.mapa.pontos'));
  const g = c.getContext('2d');
  if (!g) return c;
  const fase = ctx.fase;
  const mapa = cartografia(fase.largura, fase.altura, c.width, c.height, 30);
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
    const papel = fg.createRadialGradient(490, 235, 130, 490, 235, 580);
    papel.addColorStop(0, '#eedab1'); papel.addColorStop(0.76, '#d3b383'); papel.addColorStop(1, '#a67950');
    fg.fillStyle = papel; fg.fillRect(0, 0, c.width, c.height);
    fg.fillStyle = '#6b3e2514';
    for (let i = 0; i < 3300; i++) fg.fillRect((i * 223) % c.width, (i * i * 37 + i * 17) % c.height, i % 5 + 1, 1);
    fg.strokeStyle = '#805c3b'; fg.strokeRect(10.5, 10.5, c.width - 21, c.height - 21);
    fg.strokeStyle = '#805c3b88'; fg.strokeRect(15.5, 15.5, c.width - 31, c.height - 31);
    fg.save(); fg.transform(m.a, m.b, m.c, m.d, m.e, m.f);
    const cores: Record<string, string> = { mato: '#838a5d', estrada: '#e1ba7f', agua: '#486e73', piso: '#a88a64', fachada: '#af7451', parede: '#634634', saida: '#8eb38a' };
    for (let y = 0; y < fase.altura; y++) for (let x = 0; x < fase.largura; x++) {
      const tipo = tipoEm(fase, x, y);
      fg.fillStyle = cores[tipo] ?? '#816448'; fg.fillRect(x, y, 1.02, 1.02);
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
    fg.beginPath();
    fg.arc(916, 71, 39, 0, Math.PI * 2);
    fg.fillStyle = '#4b3322'; fg.fill();
    fg.strokeStyle = '#a57a46'; fg.lineWidth = 2; fg.stroke();
    rosaDosVentos(fg, 916, 71, 25);
  }
  // Marco 53 (22/11/2026, D-203): os marcos do lugar (portões com o nome de onde levam, casas, serviços da vila).
  const nomeDoDestino = (id: string) => {
    if (!descobertas.includes(id)) {
      const lado = fase.passagens?.find(p => p.destino === id)?.lado;
      return lado ? t('mundo.mapa.travessia', { lado: t(`mundo.mapa.${lado}`) }) : t('mundo.mapa.desconhecida');
    }
    const l = lerLugar(reino, id);
    return l?.tipo === 'regiao' ? l.regiao.nome : null;
  };
  const destinos: MarcoDoMapa[] = [
    ...marcosDaFase(fase, nomeDoDestino),
    ...entradas.map((estrutura): MarcoDoMapa => ({ tipo: 'masmorra', ...portaDa(estrutura).porta, rotulo: estrutura.nome })),
  ];
  const seguir = (marco: MarcoDoMapa) => {
    if (!marco.rotulo) return;
    const ponto = { x: Math.floor(marco.x), y: Math.floor(marco.y) };
    orientacao?.definir({ lugar, nome: marco.rotulo, ponto });
    andar?.(ponto);
    desenhar();
  };
  let cursor = { x: Math.floor(fase.largura / 2), y: Math.floor(fase.altura / 2) };
  let mostrarCursor = false;
  // O rótulo tenta acima, abaixo e mais acima do marco; com as três posições ocupadas, fica sem rótulo.
  const ocupados: { x: number; y: number; largura: number }[] = [];
  const rotulo = (nome: string, x: number, y: number, cor = '#302012') => {
    g.font = `16px "${FONTE_DO_JOGO}", Georgia, serif`;
    const largura = Math.min(220, g.measureText(nome).width + 16);
    const esquerda = Math.max(20, Math.min(c.width - largura - 20, x - largura / 2));
    for (const topo of [y - 33, y + 13, y - 57]) {
      if (topo < 20 || topo + 22 > c.height - 20 ||
        ocupados.some(r => topo < r.y + 25 && topo + 25 > r.y && esquerda < r.x + r.largura + 4 && esquerda + largura + 4 > r.x)) continue;
      ocupados.push({ x: esquerda, y: topo, largura });
      g.fillStyle = '#f5dfb5'; g.strokeStyle = '#78512c'; g.lineWidth = 1;
      g.beginPath(); g.roundRect(esquerda, topo, largura, 22, 3); g.fill(); g.stroke();
      g.fillStyle = cor; g.textAlign = 'center'; g.fillText(nome, esquerda + largura / 2, topo + 16, largura - 10);
      break;
    }
  };
  const desenhar = () => {
    g.clearRect(0, 0, c.width, c.height);
    ocupados.length = 0;
    g.drawImage(fundo, 0, 0);
    const atual = estado(), eu = atual?.entidades.find(e => e.id === idLocal);
    const etapa = orientacao?.destino ? proximaEtapa(reino, lugar, orientacao.destino, fase) : null;
    if (eu && etapa?.ponto) {
      const a = mapa.ponto(eu.x, eu.y), b = mapa.ponto(etapa.ponto.x, etapa.ponto.y);
      g.strokeStyle = '#f6ce78'; g.lineWidth = 2; g.setLineDash([7, 6]);
      g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); g.setLineDash([]);
      g.strokeRect(b.x - 7, b.y - 7, 14, 14);
    }
    const marcos = [...destinos, ...(atual ? marcosDoEstado(atual).filter((x) => x.tipo !== 'masmorra') : [])];
    for (const m of marcos) {
      const p = mapa.ponto(m.x, m.y);
      desenharMarco(g, m.tipo, p.x, p.y, m.tipo === 'casa' ? 11 : 21);
    }
    // Só os lugares de passagem e os ninhos levam rótulo no papel; os serviços ficam no índice.
    for (const m of marcos) {
      if (!m.rotulo || !COM_ROTULO.has(m.tipo)) continue;
      const p = mapa.ponto(m.x, m.y);
      rotulo(m.rotulo, p.x, p.y, m.tipo === 'saida' ? '#2e5437' : m.tipo === 'ninho' ? '#82281d' : undefined);
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
      const marcador = marcadorDaEntidade(ctx, idLocal, entidade, eu, atual ?? undefined);
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
      rotulo(t('mundo.lapide.nome'), q.x, q.y, '#55386b');
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
    const destino = destinos.find((m) => {
      if (!m.rotulo || m.tipo === 'casa') return false;
      const p = mapa.ponto(m.x, m.y);
      return Math.hypot(p.x - q.x, p.y - q.y) < 13;
    });
    if (destino?.rotulo && orientacao) {
      seguir(destino);
      return;
    }
    const perto = pontos.findIndex(p => { const a = mapa.ponto(p.x, p.y); return Math.hypot(a.x - q.x, a.y - q.y) < 14; });
    if (perto >= 0) {
      const marcado = pontos[perto];
      const ativo = orientacao?.destino;
      const selecionado = ativo?.lugar === lugar && ativo.ponto?.x === marcado?.x && ativo.ponto?.y === marcado?.y;
      if (orientacao && marcado && !selecionado) {
        orientacao.definir({ lugar, nome: t('mundo.mapa.ponto', marcado), ponto: marcado });
        andar?.(marcado);
      } else { pontos.splice(perto, 1); if (selecionado) orientacao?.definir(null); }
    } else if (pontos.length < 50) {
      pontos.push({ x, y });
      orientacao?.definir({ lugar, nome: t('mundo.mapa.ponto', { x, y }), ponto: { x, y } });
      andar?.({ x, y });
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
  if (indice) preencherIndice(indice, destinos, seguir);
  desenhar();
  // Escondido (outra aba do painel), o mapa não redesenha.
  const timer = window.setInterval(() => {
    if (!c.isConnected) clearInterval(timer);
    else if (!c.closest('[hidden]')) desenhar();
  }, 250);
  return c;
}

const COM_ROTULO: ReadonlySet<TipoDeMarco> = new Set<TipoDeMarco>(['saida', 'portao', 'masmorra', 'ninho']);

const GRUPOS_DO_INDICE: readonly { nome: 'mundo.mapa.indice.entradas' | 'mundo.mapa.indice.ninhos' | 'mundo.mapa.indice.servicos'; tipos: readonly TipoDeMarco[] }[] = [
  { nome: 'mundo.mapa.indice.entradas', tipos: ['masmorra', 'portao', 'saida'] },
  { nome: 'mundo.mapa.indice.ninhos', tipos: ['ninho'] },
  { nome: 'mundo.mapa.indice.servicos', tipos: ['banco', 'ferreiro', 'mercado', 'taverna', 'alquimista'] },
];

/** O índice ao lado do mapa: os pontos com nome, por grupo; um clique segue o ponto como o clique no marco. */
function preencherIndice(indice: HTMLElement, marcos: readonly MarcoDoMapa[], seguir: (marco: MarcoDoMapa) => void): void {
  for (const [i, grupo] of GRUPOS_DO_INDICE.entries()) {
    const pontos = marcos.filter(m => m.rotulo && grupo.tipos.includes(m.tipo));
    if (pontos.length === 0) continue;
    const secao = document.createElement('details');
    secao.open = i < 2;
    const titulo = document.createElement('summary');
    titulo.textContent = t(grupo.nome);
    secao.append(titulo);
    for (const marco of pontos) {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.marco = marco.tipo;
      b.textContent = marco.rotulo ?? '';
      b.addEventListener('click', () => { seguir(marco); });
      secao.append(b);
    }
    indice.append(secao);
  }
}
