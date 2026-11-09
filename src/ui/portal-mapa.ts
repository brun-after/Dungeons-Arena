// O diálogo do Portal temporário (09/11/2026, D-143): escolher a região (das descobertas; abre na da lápide, se ela
// ainda estiver marcada) e tocar no mapa do terreno o ponto da outra ponta; confirmar abre o portal. A sala confere
// tudo de novo (o item, a região, dungeon).

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import { t } from '../i18n';
import { capitalDoAtlas, territorioDoLugar, type Reino } from '../mundo/reino';
import { mapaDoLugar } from './mapa-lugar';
import { dialogo, paragrafo } from './mundo-dialogos';
import { lapideAtiva, type OrientacaoMundo } from './orientacao-mundo';
import { janelaComZoom } from './zoom-mapa';

export interface OpcoesDoPortal {
  reino: Reino;
  lugar: string;
  descobertas: readonly string[];
  orientacao: OrientacaoMundo;
  idLocal: string;
  estado: () => EstadoJogo | null;
  /** Quantos Portais temporários há na mochila. */
  quantos: number;
  /** O contexto (o terreno) de uma região; null se não der para montar. */
  ctxDe: (lugar: string) => ContextoSimulacao | null;
  abrir: (lugar: string, x: number, y: number) => void;
}

export function abrirPortalTemporario(o: OpcoesDoPortal): void {
  if (document.querySelector('.mapa-expandido')) return;
  const d = dialogo(t('mundo.portalT.titulo'));
  d.el.classList.add('mapa-expandido');
  if (o.quantos <= 0) {
    d.corpo.append(paragrafo(t('mundo.portalT.semItem')));
    return;
  }
  if (!o.lugar.startsWith('regiao:')) {
    d.corpo.append(paragrafo(t('mundo.recusa.portal_dungeon')));
    return;
  }
  const ajuda = document.createElement('details');
  ajuda.className = 'ajuda-mapa';
  const resumo = document.createElement('summary');
  resumo.textContent = t('mundo.portalT.resumo', { n: o.quantos });
  ajuda.append(resumo, paragrafo(t('mundo.portalT.instrucoes')));
  const regioes = o.reino.regioes.filter((r) => o.descobertas.includes(`regiao:${r.id}`) || capitalDoAtlas(o.reino, r.id));
  const lapide = lapideAtiva(o.orientacao, Date.now());
  const rotulo = document.createElement('label');
  rotulo.className = 'campo-mundo';
  rotulo.textContent = t('mundo.portalT.regiao');
  const escolha = document.createElement('select');
  for (const r of regioes) {
    const op = document.createElement('option');
    op.value = `regiao:${r.id}`;
    op.textContent = `${territorioDoLugar(o.reino, r.id).nome} · ${r.nome}${lapide?.lugar === op.value ? ` · ${t('mundo.lapide.nome')}` : ''}`;
    escolha.append(op);
  }
  escolha.value = lapide && regioes.some((r) => `regiao:${r.id}` === lapide.lugar) ? lapide.lugar : o.lugar;
  rotulo.append(escolha);
  const status = paragrafo('', 'destino-mapa');
  status.setAttribute('role', 'status');
  const confirmar = document.createElement('button');
  confirmar.type = 'button';
  confirmar.className = 'botao-menu';
  confirmar.textContent = t('mundo.portalT.confirmar');
  const area = document.createElement('section');
  area.className = 'painel-cartografia';
  let ponto: { x: number; y: number } | null = null;
  const atualizar = () => {
    confirmar.disabled = !ponto;
    const nome = escolha.selectedOptions[0]?.textContent ?? '';
    status.textContent = ponto ? t('mundo.portalT.destino', { nome, x: ponto.x, y: ponto.y }) : t('mundo.portalT.toque');
  };
  const montar = () => {
    const lugar = escolha.value;
    ponto = lapide?.lugar === lugar ? { ...lapide.ponto } : null;
    const ctx = o.ctxDe(lugar);
    area.textContent = '';
    if (!ctx) {
      area.append(paragrafo(t('mundo.portalT.semMapa')));
    } else {
      const canvas = mapaDoLugar(ctx, lugar === o.lugar ? o.estado : () => null, o.idLocal, lugar, o.descobertas, o.orientacao, {
        escolher: (c) => { ponto = c; atualizar(); },
        escolhido: () => ponto,
      });
      const { janela, zoom } = janelaComZoom(canvas, d.el, { reduzir: t('mundo.mapa.reduzir'), ampliar: t('mundo.mapa.ampliar') });
      area.append(zoom, janela);
    }
    atualizar();
  };
  escolha.addEventListener('change', montar);
  confirmar.addEventListener('click', () => {
    if (!ponto) return;
    o.abrir(escolha.value, ponto.x, ponto.y);
    d.fechar();
  });
  d.corpo.append(ajuda, rotulo, status, area, confirmar);
  montar();
}
