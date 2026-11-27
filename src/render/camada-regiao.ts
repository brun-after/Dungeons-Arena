// Marco 55 (26/11/2026, D-208): uma região do Mundo contínuo desenhada no lugar dela do atlas. É o que a vizinha além
// da borda fazia (render/vizinha.ts, D-169), agora com a região inteira: o chão (num container deslocado, sob demanda
// e assado por bloco), as paredes, as fachadas, os enfeites, os telhados, as árvores e rochas e as faces de penhasco,
// tudo na camada das entidades com a projeção deslocada (a ordem de desenho com quem anda segue certa). A cena põe as
// regiões perto da câmera e tira as longe (ui/atlas-na-cena.ts). Só aparência: a simulação anda na fase do atlas.

import { Container, ImageSource, Texture } from 'pixi.js';
import type { Balance } from '../core/contexto';
import type { RegrasDaCamuflagem } from '../world/camuflagem';
import type { Fase } from '../world/fase';
import type { Tema } from '../world/temas';
import { CELULA_PX } from './camera-calculo';
import { criarCenarioIso, type CenarioIso } from './cenario-iso';
import { criarDecoracaoIso, type DecoracaoIso } from './decoracao-iso';
import { criarEstruturasIso, type EstruturasIso } from './estruturas-iso';
import type { ObjetosPreRenderizados } from './objetos-3d';
import { criarParedesIso, type ParedesIso } from './paredes-iso';
import type { PintorDeDesenhos } from './pintura';
import type { Projecao } from './projecao';
import { criarPenhascosIso, type PenhascosIso } from './relevo-iso';
import { soloDaFase } from './solo/solo-da-fase';
import type { Palco } from './stage';
import { criarTelhados, type Telhados } from './telhados-iso';
import { criarTerreno, paletaDe, type Terreno } from './terreno';

export interface MeiosDaRegiao {
  palco: Palco;
  /** A projeção do atlas (a da câmera). */
  projecao: Projecao;
  balance: Balance;
  escalaSolo: number;
  pintor: PintorDeDesenhos | null;
  modelos3d: ObjetosPreRenderizados | null;
  quebraveis: ReadonlySet<string>;
  camuflagem?: RegrasDaCamuflagem;
}

type Vista = readonly [number, number, number, number];

export interface CamadaDaRegiao {
  /** A vista (px de plano do atlas), o jogador (células do atlas) e o tempo do quadro. */
  desenhar: (vista: Vista, jogador: { x: number; y: number } | null, agoraMs: number, dtMs: number, reduzido: boolean) => void;
  /** O chão à vista já está assado. */
  pronto: () => boolean;
  /** Quem está em (x, y) do atlas fica escondido sob um telhado fechado desta região? */
  oculto: (x: number, y: number) => boolean;
  destruir: () => void;
}

/** A projeção do atlas vista da região: leva as coordenadas dela às do atlas antes de projetar. */
export function projecaoDeslocada(p: Projecao, dx: number, dy: number): Projecao {
  const mx = dx * CELULA_PX;
  const my = dy * CELULA_PX;
  const m = p.matriz;
  return {
    ...p,
    matriz: { ...m, tx: m.a * mx + m.c * my + m.tx, ty: m.b * mx + m.d * my + m.ty },
    projetar: (x, y) => p.projetar(x + mx, y + my),
    alturaDoChao: (x, y) => p.alturaDoChao(x + mx, y + my),
    desprojetar: (x, y) => {
      const q = p.desprojetar(x, y);
      return { x: q.x - mx, y: q.y - my };
    },
  };
}

/** A região `fase` (em coordenadas da área) com o canto da área em (`dx`, `dy`) do atlas. */
export function criarCamadaDaRegiao(m: MeiosDaRegiao, fase: Fase, tema: Tema | null, dx: number, dy: number): CamadaDaRegiao {
  const mx = dx * CELULA_PX;
  const my = dy * CELULA_PX;
  const chao = new Container({ label: `regiao-${fase.id}` });
  chao.position.set(mx, my);
  m.palco.terreno.addChild(chao);
  const solo = soloDaFase(fase, tema, m.balance.visual, m.escalaSolo, m.pintor);
  const terreno: Terreno = criarTerreno(chao, fase, null, tema, m.quebraveis, solo);
  terreno.definirVisao(true);
  const p = projecaoDeslocada(m.projecao, dx, dy);
  const cfg = m.balance.visual.paredeIso;
  const cor = tema?.paleta.paredeTopo ?? paletaDe(fase.matizGraus).paredeTopo;
  let pedra: Texture | null = null;
  const criarParedes = () => criarParedesIso(m.palco.entidades, fase, p, { cor, textura: pedra, altura: cfg.altura, alcanceSala: cfg.alcanceSala, alphaFade: cfg.alphaFade });
  let paredes: ParedesIso = criarParedes();
  let estruturas: EstruturasIso = criarEstruturasIso(m.palco.entidades, fase, p, null);
  const enfeites: DecoracaoIso = criarDecoracaoIso(m.palco.entidades, fase, tema, p, m.quebraveis, m.pintor, m.modelos3d);
  const telhados: Telhados | null = fase.telhados?.length ? criarTelhados(m.palco.entidades, fase, p, { altura: cfg.altura, perto: cfg.telhadoPerto }) : null;
  const cenario: CenarioIso | null = criarCenarioIso(m.palco.entidades, chao, fase, p, fase.cenario ?? [], m.camuflagem);
  const penhascos: PenhascosIso | null = criarPenhascosIso(m.palco.entidades, fase, p);
  let destruida = false;
  void solo.texturas.then((t) => {
    const img = t.get(solo.tema.parede);
    if (!img || destruida) return;
    // Uma textura só desta camada (a imagem é guardada entre as cenas; a camada que sai destruiria a de outra).
    pedra = new Texture({ source: new ImageSource({ resource: img, addressMode: 'repeat' }) });
    paredes.destruir();
    paredes = criarParedes();
    estruturas.destruir();
    estruturas = criarEstruturasIso(m.palco.entidades, fase, p, pedra);
  });
  return {
    desenhar: ([x0, y0, x1, y1], jogador, agoraMs, dtMs, reduzido) => {
      const local: Vista = [x0 - mx, y0 - my, x1 - mx, y1 - my];
      terreno.atualizarVisibilidade(...local);
      terreno.animar(agoraMs, reduzido);
      const la = jogador ? { x: jogador.x - dx, y: jogador.y - dy } : null;
      paredes.esmaecer(la, dtMs);
      telhados?.atualizar(la, dtMs);
      cenario?.atualizar(local, la, dtMs);
      penhascos?.atualizar(local);
    },
    pronto: () => terreno.pronto(),
    oculto: (x, y) => telhados?.oculto(x - dx, y - dy) ?? false,
    destruir: () => {
      destruida = true;
      paredes.destruir();
      estruturas.destruir();
      enfeites.destruir();
      telhados?.destruir();
      cenario?.destruir();
      penhascos?.destruir();
      terreno.destruir();
      chao.destroy({ children: true });
      pedra?.destroy(true);
    },
  };
}
