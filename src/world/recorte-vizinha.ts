// O pedaço da região vizinha visto além da borda (marco 41, 14/11/2026, D-169). Perto de uma passagem, a borda do
// mapa mostrava o vazio: a faixa da passagem existe igual nos dois mapas, mas o que vem depois dela só existe no mapa
// do outro lado. O recorte leva:
// - o mapa da vizinha só com o trecho logo depois da faixa dela (o resto vira vazio), para o que fica em pé;
// - o mapa inteiro, para o chão (desenhado por baixo do daqui);
// - o deslocamento (em células) que leva as coordenadas de lá às daqui.
// O cliente desenha o recorte deslocado, e o caminho continua além da borda, com o chão, as árvores, as casas e as
// lanternas que se verão ao chegar.
// Puro.

import { codigoDeTipo, type Fase } from './fase';
import { celulaDaFaixa, PROFUNDIDADE_PASSAGEM } from './passagens-exterior';
import type { LadoDaRegiao } from '../mundo/reino';

/** Até onde o recorte vai além da borda e para os lados do corredor (o quanto a câmera mostra, com folga). */
export const RECORTE_FUNDO = 40;
export const RECORTE_LADO = 34;

export interface RecorteVizinho {
  /** O mapa de lá, só com o trecho além da borda daqui (as coordenadas continuam as de lá): o que fica em pé. */
  fase: Fase;
  /**
   * O mapa de lá inteiro: o chão. Fica por baixo do daqui (onde os dois se cobrem, vale o daqui), e os blocos assados
   * são os mesmos que a cena de lá vai usar (render/solo/assados-guardados.ts).
   */
  completa: Fase;
  /** Somado a uma célula de lá, dá a mesma célula nas coordenadas daqui. */
  dx: number;
  dy: number;
}

const OPOSTO: Readonly<Record<LadoDaRegiao, LadoDaRegiao>> = { norte: 'sul', sul: 'norte', leste: 'oeste', oeste: 'leste' };

/**
 * O recorte da vizinha `la` vista pela passagem do lado `lado` daqui (um mapa quadrado de `nAqui` células). A faixa
 * daqui na profundidade `d` é a de lá em `PROFUNDIDADE - 1 - d`; logo, além da borda daqui (d = −1) fica a
 * profundidade `PROFUNDIDADE` de lá, a primeira célula de lá que o mapa daqui não tem.
 */
export function recorteDaVizinha(nAqui: number, lado: LadoDaRegiao, la: Fase): RecorteVizinho {
  const nLa = la.largura;
  const oposto = OPOSTO[lado];
  const aqui0 = celulaDaFaixa(nAqui, lado, 0, 0);
  const la0 = celulaDaFaixa(nLa, oposto, 0, PROFUNDIDADE_PASSAGEM - 1);
  const dx = aqui0.x - la0.x;
  const dy = aqui0.y - la0.y;
  const celulas = new Uint8Array(la.celulas.length).fill(codigoDeTipo('vazio'));
  const dentro = new Set<number>();
  for (let d = PROFUNDIDADE_PASSAGEM; d < PROFUNDIDADE_PASSAGEM + RECORTE_FUNDO; d++) {
    for (let u = -RECORTE_LADO; u < RECORTE_LADO; u++) {
      const c = celulaDaFaixa(nLa, oposto, u, d);
      if (c.x < 0 || c.y < 0 || c.x >= nLa || c.y >= la.altura) continue;
      const k = c.y * nLa + c.x;
      celulas[k] = la.celulas[k] ?? codigoDeTipo('vazio');
      dentro.add(k);
    }
  }
  const tem = (x: number, y: number) => dentro.has(y * nLa + x);
  const fase: Fase = {
    ...la,
    celulas,
    enfeites: (la.enfeites ?? []).filter((e) => tem(e.x, e.y)),
    estruturas: (la.estruturas ?? []).filter((e) => tem(e.x, e.y)),
    telhados: (la.telhados ?? []).filter((t) => tem(t.x, t.y) && tem(t.x + t.largura - 1, t.y + t.altura - 1)),
    passagens: [],
  };
  return { fase, completa: la, dx, dy };
}
