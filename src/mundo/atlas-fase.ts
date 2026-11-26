// Marco 54 (26/11/2026, D-207): cada região do Mundo contínuo gerada para o lugar dela no atlas. Puro.
// A região é gerada sozinha (determinística pela semente, sem olhar a vizinha) num quadrado que cabe a área dela, com o
// conteúdo escrito à mão (vila, estruturas, matas) deslocado para o centro da área; os lados abertos puxam o chão para
// o perfil da costura (world/costura.ts) e a estrada vai ao cruzamento, onde a da vizinha também chega. No fim fica só
// o retângulo da área (world/recorte-exterior.ts), em coordenadas dela; o atlas é a área mais (x, y).

import { perfilDaCostura, type LadoAberto, type Recorte } from '../world/costura';
import { gerarExterior, type ExteriorGerado, type OpcoesContinuas } from '../world/gerador-exterior';
import { recortarExterior } from '../world/recorte-exterior';
import { costuraDoLado, ladosAbertos, type AreaNoAtlas, type Atlas } from './atlas';
import type { Reino, RegiaoDoMundo } from './reino';

export interface GeracaoNoAtlas {
  /** A região com o conteúdo deslocado para dentro do quadrado gerado. */
  regiao: RegiaoDoMundo;
  opcoes: OpcoesContinuas;
}

function areaDe(atlas: Atlas, regiao: RegiaoDoMundo): AreaNoAtlas {
  const area = atlas.areas.get(regiao.id);
  if (!area) throw new Error(`região fora do atlas: ${regiao.id}`);
  return area;
}

/** O que `gerarExterior` recebe para gerar a região no lugar dela do atlas. */
export function geracaoNoAtlas(reino: Reino, atlas: Atlas, regiao: RegiaoDoMundo): GeracaoNoAtlas {
  const area = areaDe(atlas, regiao);
  // Uma célula de folga em volta: a borda do recorte nunca é a moldura do quadrado.
  const n = Math.max(area.largura, area.altura) + 2;
  const recorte: Recorte = { x: (n - area.largura) >> 1, y: (n - area.altura) >> 1, largura: area.largura, altura: area.altura };
  const ox = recorte.x + area.dx;
  const oy = recorte.y + area.dy;
  const deslocada: RegiaoDoMundo = {
    ...regiao,
    tamanho: n,
    vila: regiao.vila && { ...regiao.vila, x: regiao.vila.x + ox, y: regiao.vila.y + oy },
    estruturas: regiao.estruturas.map((e) => ({ ...e, x: e.x + ox, y: e.y + oy })),
    ...(regiao.matas && { matas: regiao.matas.map((m) => ({ ...m, x: m.x + ox, y: m.y + oy })) }),
  };
  const abertos: LadoAberto[] = [];
  const cruzamentos: OpcoesContinuas['cruzamentos'][number][] = [];
  for (const lado of ladosAbertos(reino, regiao)) {
    const c = costuraDoLado(atlas, regiao.id, lado);
    if (!c) continue;
    const perfil = perfilDaCostura(c.par, c.inicio, c.fim);
    const vertical = lado === 'leste' || lado === 'oeste';
    // Do local ao longo do lado (no quadrado) para o atlas.
    const desloc = vertical ? area.y - recorte.y : area.x - recorte.x;
    abertos.push({ lado, em: (i) => perfil.em(i + desloc) });
    const ao = perfil.cruzamento - desloc;
    const borda = lado === 'oeste' ? recorte.x : lado === 'leste' ? recorte.x + recorte.largura - 1 : lado === 'norte' ? recorte.y : recorte.y + recorte.altura - 1;
    cruzamentos.push({ x: vertical ? borda : ao, y: vertical ? ao : borda, nivel: perfil.em(perfil.cruzamento).altura });
  }
  return { regiao: deslocada, opcoes: { n, recorte, abertos, cruzamentos } };
}

/** A região gerada para o atlas, em coordenadas da área dela. */
export function gerarRegiaoNoAtlas(reino: Reino, atlas: Atlas, regiao: RegiaoDoMundo): ExteriorGerado {
  const g = geracaoNoAtlas(reino, atlas, regiao);
  return recortarExterior(gerarExterior(reino, g.regiao, g.opcoes), g.opcoes.n, g.opcoes.recorte);
}
