// A região vizinha além da borda (marco 41, 14/11/2026, D-169). Perto de uma passagem, o mapa daqui acabava no vazio;
// agora o pedaço de lá logo depois da faixa (world/recorte-vizinha.ts) é desenhado deslocado, por baixo do chão
// daqui: o chão (no próprio container, sob demanda como o de cá), as paredes, as fachadas, os enfeites e os telhados
// em pé (na camada das entidades, com a projeção deslocada, então a ordem de desenho com o resto segue certa).
// Só aparência: a simulação não sabe dele.

import { Container, ImageSource, Texture } from 'pixi.js';
import type { Balance } from '../core/contexto';
import type { RecorteVizinho } from '../world/recorte-vizinha';
import type { Tema } from '../world/temas';
import { CELULA_PX } from './camera-calculo';
import { criarDecoracaoIso, type DecoracaoIso } from './decoracao-iso';
import { criarEstruturasIso, type EstruturasIso } from './estruturas-iso';
import type { ObjetosPreRenderizados } from './objetos-3d';
import { criarParedesIso, type ParedesIso } from './paredes-iso';
import type { PintorDeDesenhos } from './pintura';
import type { Projecao } from './projecao';
import { soloDaFase } from './solo/solo-da-fase';
import type { Palco } from './stage';
import { criarTelhados, type Telhados } from './telhados-iso';
import { criarTerreno, paletaDe } from './terreno';

export interface MeiosDaVizinha {
  palco: Palco;
  projecao: Projecao;
  balance: Balance;
  /** A resolução do chão assado (a qualidade de agora). */
  escalaSolo: number;
  pintor: PintorDeDesenhos | null;
  modelos3d: ObjetosPreRenderizados | null;
}

export interface CamadaVizinha {
  /** O retângulo visível (px de plano daqui), o jogador (em células daqui) e o tempo do quadro. */
  desenhar: (vista: readonly [number, number, number, number], jogador: { x: number; y: number } | null, agoraMs: number, dtMs: number, reduzido: boolean) => void;
  destruir: () => void;
}

/** A projeção daqui vista de lá: leva as coordenadas de lá às daqui antes de projetar. */
export function projecaoDeslocada(p: Projecao, dx: number, dy: number): Projecao {
  const mx = dx * CELULA_PX;
  const my = dy * CELULA_PX;
  const m = p.matriz;
  return {
    ...p,
    matriz: { ...m, tx: m.a * mx + m.c * my + m.tx, ty: m.b * mx + m.d * my + m.ty },
    projetar: (x, y) => p.projetar(x + mx, y + my),
    desprojetar: (x, y) => {
      const q = p.desprojetar(x, y);
      return { x: q.x - mx, y: q.y - my };
    },
  };
}

export function criarVizinha(m: MeiosDaVizinha, r: RecorteVizinho, tema: Tema | null): CamadaVizinha {
  const { fase, dx, dy } = r;
  const mx = dx * CELULA_PX;
  const my = dy * CELULA_PX;
  const chao = new Container();
  chao.position.set(mx, my);
  // Por baixo do chão daqui: onde os dois mapas se cobrem, vale o daqui.
  m.palco.terreno.addChildAt(chao, 0);
  // O chão é o do mapa de lá inteiro (o mesmo assado da cena de lá); o que fica em pé, só o do recorte.
  const solo = soloDaFase(r.completa, tema, m.balance.visual.solo, m.escalaSolo, m.pintor);
  const terreno = criarTerreno(chao, r.completa, null, tema, new Set(), solo);
  terreno.definirVisao(true);
  const p = projecaoDeslocada(m.projecao, dx, dy);
  const cfg = m.balance.visual.paredeIso;
  const cor = tema?.paleta.paredeTopo ?? paletaDe(fase.matizGraus).paredeTopo;
  let pedra: Texture | null = null;
  const criarParedes = () => criarParedesIso(m.palco.entidades, fase, p, { cor, textura: pedra, altura: cfg.altura, alcanceSala: cfg.alcanceSala, alphaFade: cfg.alphaFade });
  let paredes: ParedesIso = criarParedes();
  let estruturas: EstruturasIso = criarEstruturasIso(m.palco.entidades, fase, p, null);
  const enfeites: DecoracaoIso = criarDecoracaoIso(m.palco.entidades, fase, tema, p, new Set(), m.pintor, m.modelos3d);
  const telhados: Telhados | null = fase.telhados?.length ? criarTelhados(m.palco.entidades, fase, p, { altura: cfg.altura, perto: cfg.telhadoPerto }) : null;
  let destruida = false;
  void solo.texturas.then((t) => {
    const img = t.get(solo.tema.parede);
    if (!img || destruida) return;
    // Marco 41 (D-169): uma textura só desta cena (a imagem é guardada entre as cenas; `Texture.from` daria a mesma
    // textura às duas, e a cena que sai a destruiria debaixo da outra).
    pedra = new Texture({ source: new ImageSource({ resource: img, addressMode: 'repeat' }) });
    paredes.destruir();
    paredes = criarParedes();
    estruturas.destruir();
    estruturas = criarEstruturasIso(m.palco.entidades, fase, p, pedra);
  });
  return {
    desenhar: ([x0, y0, x1, y1], jogador, agoraMs, dtMs, reduzido) => {
      terreno.atualizarVisibilidade(x0 - mx, y0 - my, x1 - mx, y1 - my);
      terreno.animar(agoraMs, reduzido);
      const la = jogador ? { x: jogador.x - dx, y: jogador.y - dy } : null;
      paredes.esmaecer(la, dtMs);
      telhados?.atualizar(la, dtMs);
    },
    destruir: () => {
      destruida = true;
      paredes.destruir();
      estruturas.destruir();
      enfeites.destruir();
      telhados?.destruir();
      terreno.destruir();
      chao.destroy({ children: true });
      pedra?.destroy(true);
    },
  };
}
