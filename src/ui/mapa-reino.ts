import type { Reino } from '../mundo/reino';
import { t } from '../i18n';
import { cartografia } from './cartografia';

/** Atlas vetorial: os eixos seguem a mesma projeção do terreno local. */
export function atlasDoReino(reino: Reino, lugar: string, descobertas: readonly string[], escolher: (id: string, nome: string) => void): SVGSVGElement {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 1000 550');
  svg.setAttribute('aria-label', t('mundo.mapa.atlas'));
  svg.classList.add('atlas-reino');
  const mapa = cartografia(reino.largura, reino.altura, 1000, 550, 50);
  for (const r of reino.regioes) {
    const vista = descobertas.includes(`regiao:${r.id}`);
    const grupo = document.createElementNS(ns, 'g');
    grupo.dataset.atual = String(lugar === `regiao:${r.id}` || r.estruturas.some(e => lugar === `${e.destino.tipo}:${e.destino.id}`));
    grupo.dataset.perigo = vista ? r.perigo : 'desconhecido';
    const poligono = document.createElementNS(ns, 'polygon');
    poligono.setAttribute('points', [[r.gx, r.gy], [r.gx + 1, r.gy], [r.gx + 1, r.gy + 1], [r.gx, r.gy + 1]].map(([x, y]) => { const p = mapa.ponto((x ?? 0) - .5, (y ?? 0) - .5); return `${p.x},${p.y}`; }).join(' '));
    grupo.append(poligono);
    const p = mapa.ponto(r.gx, r.gy);
    const texto = document.createElementNS(ns, 'text');
    texto.setAttribute('x', String(p.x)); texto.setAttribute('y', String(p.y - 4));
    texto.textContent = vista ? r.nome : t('mundo.mapa.desconhecida');
    const detalhe = document.createElementNS(ns, 'text');
    detalhe.setAttribute('x', String(p.x)); detalhe.setAttribute('y', String(p.y + 17)); detalhe.classList.add('atlas-detalhe');
    detalhe.textContent = grupo.dataset.atual === 'true' ? t('mundo.mapa.aqui') : vista ? `${r.nivel[0]}–${r.nivel[1]}${r.perigo === 'perigoso' ? ' · PvP' : ''}` : '· · ·';
    grupo.append(texto, detalhe);
    if (vista) {
      grupo.setAttribute('role', 'button'); grupo.setAttribute('tabindex', '0');
      grupo.setAttribute('aria-label', t('mundo.mapa.marcar', { nome: r.nome }));
      const selecionar = () => { escolher(`regiao:${r.id}`, r.nome); };
      grupo.addEventListener('click', selecionar);
      grupo.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selecionar(); } });
    }
    svg.append(grupo);
  }
  return svg;
}
