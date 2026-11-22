// Os marcos da cartografia do Mundo (marco 53, 22/11/2026, D-203): o que ajuda o jogador a se achar no minimapa e no
// mapa do lugar. Portões nas passagens para as outras regiões, casinhas onde há casa, o prédio de cada serviço da vila
// (taverna, banco, mercado, ferraria, botica) com a sua cor e o seu sinal, a entrada das dungeons, as pedras de save e
// de portal, as fogueiras e o vendedor da noite. Tudo vem da fase e do estado (nada fixo por região). Desenho em
// canvas 2D, em vetor, do tamanho pedido.

import type { EstadoJogo } from '../core/estado';
import type { Fase, TipoPredio } from '../world/fase';
import { REF_NOTURNO } from '../mundo/vila-noite';
import { t, type ChaveTexto } from '../i18n';

export type TipoDeMarco = 'portao' | 'casa' | TipoPredio | 'masmorra' | 'pedra_save' | 'pedra_portal' | 'fogueira' | 'noturno';

export interface MarcoDoMapa {
  tipo: TipoDeMarco;
  x: number;
  y: number;
  /** O nome que o mapa grande escreve ao lado (os prédios e os portões). */
  rotulo?: string;
}

/** Os marcos fixos da fase (mudam só com a fase): calcule uma vez. */
export function marcosDaFase(fase: Fase, nomeDoDestino: (lugar: string) => string | null = () => null): MarcoDoMapa[] {
  const marcos: MarcoDoMapa[] = [];
  for (const p of fase.passagens ?? []) {
    const nome = p.destino ? nomeDoDestino(p.destino) : null;
    marcos.push({ tipo: 'portao', x: (p.x0 + p.x1) / 2, y: (p.y0 + p.y1) / 2, ...(nome && { rotulo: nome }) });
  }
  for (const c of fase.telhados ?? []) {
    const x = c.x + (c.largura - 1) / 2;
    const y = c.y + (c.altura - 1) / 2;
    marcos.push(c.predio ? { tipo: c.predio, x, y, rotulo: t(`mapa.predio.${c.predio}` as ChaveTexto) } : { tipo: 'casa', x, y });
  }
  return marcos;
}

/** Os marcos que dependem do estado (as pedras, as fogueiras acesas, o vendedor que só vem à noite). */
export function marcosDoEstado(estado: EstadoJogo): MarcoDoMapa[] {
  const marcos: MarcoDoMapa[] = [];
  for (const o of estado.objetos) {
    if (o.tipo === 'pedra_save' || o.tipo === 'pedra_portal' || o.tipo === 'fogueira') marcos.push({ tipo: o.tipo, x: o.x, y: o.y });
    else if (o.tipo === 'loja' && o.ref === REF_NOTURNO) marcos.push({ tipo: 'noturno', x: o.x, y: o.y, rotulo: t('mapa.predio.noturno') });
    else if (o.tipo === 'porta_estrutura') marcos.push({ tipo: 'masmorra', x: o.x, y: o.y });
  }
  return marcos;
}

const COR_PREDIO: Readonly<Record<TipoPredio, string>> = {
  taverna: '#d98b3a',
  banco: '#9fb4c8',
  mercado: '#d65c5c',
  ferreiro: '#b0b0b0',
  alquimista: '#4fbf9f',
};

/** A cor do rótulo do marco no mapa grande. */
export function corDoMarco(tipo: TipoDeMarco): string {
  if (tipo in COR_PREDIO) return COR_PREDIO[tipo as TipoPredio];
  if (tipo === 'portao') return '#ffd77a';
  if (tipo === 'noturno') return '#c9a0ff';
  return '#e6dccb';
}

/** Desenha o ícone com o centro em (x, y), cabendo num quadrado de lado `l` (px da tela). */
export function desenharMarco(g: CanvasRenderingContext2D, tipo: TipoDeMarco, x: number, y: number, l: number): void {
  const h = l / 2;
  g.save();
  g.lineJoin = 'round';
  g.lineWidth = Math.max(1, l / 9);
  g.strokeStyle = '#12100c';
  if (tipo === 'portao') {
    // Dois pilares e o arco, em dourado.
    g.fillStyle = '#ffd77a';
    g.beginPath();
    g.moveTo(x - h, y + h);
    g.lineTo(x - h, y - h * 0.1);
    g.arc(x, y - h * 0.1, h, Math.PI, 0);
    g.lineTo(x + h, y + h);
    g.lineTo(x + h * 0.45, y + h);
    g.lineTo(x + h * 0.45, y);
    g.arc(x, y, h * 0.45, 0, Math.PI, true);
    g.lineTo(x - h * 0.45, y + h);
    g.closePath();
    g.fill();
    g.stroke();
  } else if (tipo === 'casa' || tipo in COR_PREDIO) {
    // A casinha: parede clara e telhado na cor do serviço (ou marrom, na casa comum).
    const telhado = tipo === 'casa' ? '#9a6a45' : COR_PREDIO[tipo as TipoPredio];
    g.fillStyle = '#e8dcc4';
    g.beginPath();
    g.rect(x - h * 0.7, y - h * 0.05, h * 1.4, h * 1.0);
    g.fill();
    g.stroke();
    g.fillStyle = telhado;
    g.beginPath();
    g.moveTo(x - h, y);
    g.lineTo(x, y - h);
    g.lineTo(x + h, y);
    g.closePath();
    g.fill();
    g.stroke();
    if (tipo !== 'casa') sinalDoPredio(g, tipo as TipoPredio, x, y + h * 0.45, h * 0.42);
  } else if (tipo === 'masmorra') {
    // A boca da caverna: o arco escuro com a borda de pedra.
    g.fillStyle = '#8a7f72';
    g.beginPath();
    g.moveTo(x - h, y + h);
    g.quadraticCurveTo(x - h, y - h, x, y - h);
    g.quadraticCurveTo(x + h, y - h, x + h, y + h);
    g.closePath();
    g.fill();
    g.stroke();
    g.fillStyle = '#120d0a';
    g.beginPath();
    g.ellipse(x, y + h * 0.35, h * 0.45, h * 0.6, 0, Math.PI, 0);
    g.lineTo(x + h * 0.45, y + h);
    g.lineTo(x - h * 0.45, y + h);
    g.closePath();
    g.fill();
  } else if (tipo === 'pedra_save' || tipo === 'pedra_portal') {
    // O cristal: azul no save, violeta no portal.
    g.fillStyle = tipo === 'pedra_save' ? '#5cc8ff' : '#b77cff';
    g.beginPath();
    g.moveTo(x, y - h);
    g.lineTo(x + h * 0.6, y);
    g.lineTo(x, y + h);
    g.lineTo(x - h * 0.6, y);
    g.closePath();
    g.fill();
    g.stroke();
  } else if (tipo === 'fogueira' || tipo === 'noturno') {
    // A chama (a lanterna do vendedor da noite, em lilás).
    g.fillStyle = tipo === 'fogueira' ? '#ff9a3c' : '#c9a0ff';
    g.beginPath();
    g.moveTo(x, y - h);
    g.quadraticCurveTo(x + h * 0.8, y, x, y + h * 0.8);
    g.quadraticCurveTo(x - h * 0.8, y, x, y - h);
    g.fill();
    g.stroke();
  }
  g.restore();
}

/** O sinal de cada serviço na parede da casinha. */
function sinalDoPredio(g: CanvasRenderingContext2D, tipo: TipoPredio, x: number, y: number, r: number): void {
  g.fillStyle = '#2a1e14';
  g.strokeStyle = '#2a1e14';
  g.lineWidth = Math.max(1, r / 3);
  g.beginPath();
  if (tipo === 'taverna') {
    // A caneca.
    g.rect(x - r * 0.5, y - r * 0.6, r * 0.8, r * 1.1);
    g.fill();
    g.beginPath();
    g.arc(x + r * 0.35, y - r * 0.05, r * 0.35, -Math.PI / 2, Math.PI / 2);
    g.stroke();
  } else if (tipo === 'banco') {
    // A moeda.
    g.fillStyle = '#c99a2e';
    g.arc(x, y, r * 0.6, 0, Math.PI * 2);
    g.fill();
  } else if (tipo === 'mercado') {
    // A balança.
    g.moveTo(x, y - r * 0.7);
    g.lineTo(x, y + r * 0.6);
    g.moveTo(x - r * 0.7, y - r * 0.4);
    g.lineTo(x + r * 0.7, y - r * 0.4);
    g.stroke();
  } else if (tipo === 'ferreiro') {
    // A bigorna.
    g.moveTo(x - r * 0.8, y - r * 0.4);
    g.lineTo(x + r * 0.8, y - r * 0.4);
    g.lineTo(x + r * 0.3, y + r * 0.1);
    g.lineTo(x + r * 0.4, y + r * 0.6);
    g.lineTo(x - r * 0.4, y + r * 0.6);
    g.lineTo(x - r * 0.3, y + r * 0.1);
    g.closePath();
    g.fill();
  } else {
    // O frasco.
    g.fillStyle = '#2f8f74';
    g.arc(x, y + r * 0.15, r * 0.55, 0, Math.PI * 2);
    g.fill();
    g.fillRect(x - r * 0.18, y - r * 0.75, r * 0.36, r * 0.5);
  }
}
