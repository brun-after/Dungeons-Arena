// Marco 55 (26/11/2026, D-208): o Mundo contínuo na cena. A câmera, as entidades, os objetos e os efeitos andam nas
// coordenadas do atlas; o chão e o que fica em pé são de cada região, desenhada no lugar dela (render/camada-regiao.ts)
// quando a vista chega perto e solta quando se afasta. A altura do chão de cada ponto (a projeção de quem anda) vem do
// relevo da região dele. A região que ainda não chegou do trabalhador não se desenha (é o vazio, que não se anda).

import type { Balance } from '../core/contexto';
import type { AtlasDoCliente, RegiaoNoCliente } from '../mundo/atlas-cliente';
import { temaDaFase } from '../combat/clima';
import { CELULA_PX } from '../render/camera-calculo';
import { criarCamadaDaRegiao, type CamadaDaRegiao } from '../render/camada-regiao';
import type { ObjetosPreRenderizados } from '../render/objetos-3d';
import type { PintorDeDesenhos } from '../render/pintura';
import type { Projecao } from '../render/projecao';
import { relevoDaFase } from '../render/relevo-tela';
import type { Palco } from '../render/stage';
import type { RegrasDaCamuflagem } from '../world/camuflagem';
import { codigoDeTipo, type Fase } from '../world/fase';

/** A região ganha a camada quando a vista chega a tantas células dela; perde quando se afasta o dobro. */
const MARGEM_CELULAS = 48;

type Vista = readonly [number, number, number, number];

export interface MeiosDoAtlasNaCena {
  palco: Palco;
  projecao: () => Projecao;
  balance: Balance;
  escalaSolo: () => number;
  pintor: PintorDeDesenhos | null;
  modelos3d: ObjetosPreRenderizados | null;
  quebraveis: ReadonlySet<string>;
  camuflagem?: RegrasDaCamuflagem;
}

export interface AtlasNaCena {
  /** Desenha as regiões perto da vista (px de plano do atlas) e solta as longe. */
  desenhar: (vista: Vista, jogador: { x: number; y: number } | null, agoraMs: number, dtMs: number, reduzido: boolean) => void;
  /** A região do jogador já chegou e o chão à vista está assado. */
  pronto: (jogador: { x: number; y: number } | null) => boolean;
  oculto: (x: number, y: number) => boolean;
  destruir: () => void;
}

export interface DesenhoDoAtlas {
  /** A fase do atlas (a da predição). */
  readonly fase: Fase;
  /** Uma fase de 1×1 vazia: o que a cena desenharia da fase inteira (o chão, as paredes) fica com as regiões. */
  readonly faseVazia: Fase;
  /** A altura do chão em px de tela num ponto em px de plano do atlas (a do relevo da região dele). */
  alturaPx: (xPlano: number, yPlano: number) => number;
  montar: (m: MeiosDoAtlasNaCena) => AtlasNaCena;
}

export function desenhoDoAtlas(atlas: AtlasDoCliente): DesenhoDoAtlas {
  const fase = atlas.ctx.fase;
  const faseVazia: Fase = {
    ...fase,
    largura: 1,
    altura: 1,
    celulas: new Uint8Array([codigoDeTipo('vazio')]),
    spawns: [],
    inimigos: [],
    objetos: [],
    ambientes: [],
    refugios: [],
    estruturas: [],
    matas: [],
    ninhos: [],
    cenario: [],
    telhados: [],
    alturas: new Uint8Array(1),
    obstaculos: new Uint8Array(1),
  };
  let ultima: RegiaoNoCliente | null = null;
  const regiaoDoPonto = (cx: number, cy: number): RegiaoNoCliente | null => {
    const a = ultima?.area;
    if (a && cx >= a.x && cy >= a.y && cx < a.x + a.largura && cy < a.y + a.altura) return ultima;
    const r = atlas.regiaoEm(cx, cy);
    if (r) ultima = r;
    return r;
  };
  return {
    fase,
    faseVazia,
    alturaPx: (xPlano, yPlano) => {
      const r = regiaoDoPonto(Math.floor(xPlano / CELULA_PX), Math.floor(yPlano / CELULA_PX));
      if (!r) return 0;
      const relevo = relevoDaFase(r.ctx.fase);
      return relevo ? relevo.alturaPx(xPlano - r.area.x * CELULA_PX, yPlano - r.area.y * CELULA_PX) : 0;
    },
    montar: (m) => {
      const camadas = new Map<string, CamadaDaRegiao>();
      const perto = (r: RegiaoNoCliente, [x0, y0, x1, y1]: Vista, folgaCelulas: number) => {
        const f = folgaCelulas * CELULA_PX;
        const a = r.area;
        return (a.x + a.largura) * CELULA_PX > x0 - f && a.x * CELULA_PX < x1 + f && (a.y + a.altura) * CELULA_PX > y0 - f && a.y * CELULA_PX < y1 + f;
      };
      let vistaAtual: Vista | null = null;
      return {
        desenhar: (vista, jogador, agoraMs, dtMs, reduzido) => {
          vistaAtual = vista;
          let criou = false;
          for (const r of atlas.regioes.values()) {
            const camada = camadas.get(r.regiaoId);
            if (!camada && !criou && perto(r, vista, MARGEM_CELULAS)) {
              // Uma por quadro: montar as paredes, as fachadas e os enfeites de uma região leva dezenas de ms.
              camadas.set(r.regiaoId, criarCamadaDaRegiao({ palco: m.palco, projecao: m.projecao(), balance: m.balance, escalaSolo: m.escalaSolo(), pintor: m.pintor, modelos3d: m.modelos3d, quebraveis: m.quebraveis, ...(m.camuflagem && { camuflagem: m.camuflagem }) }, r.ctx.fase, temaDaFase(r.ctx), r.area.x, r.area.y));
              criou = true;
            } else if (camada && !perto(r, vista, MARGEM_CELULAS * 2)) {
              camada.destruir();
              camadas.delete(r.regiaoId);
            }
          }
          for (const c of camadas.values()) c.desenhar(vista, jogador, agoraMs, dtMs, reduzido);
        },
        pronto: (jogador) => {
          if (!jogador) return false;
          const aqui = atlas.regiaoEm(Math.floor(jogador.x), Math.floor(jogador.y));
          if (!aqui || !camadas.has(aqui.regiaoId)) return false;
          const v = vistaAtual;
          return [...atlas.regioes.values()].every((r) => !v || !perto(r, v, 0) || (camadas.get(r.regiaoId)?.pronto() ?? false));
        },
        oculto: (x, y) => {
          const r = atlas.regiaoEm(Math.floor(x), Math.floor(y));
          return r ? (camadas.get(r.regiaoId)?.oculto(x, y) ?? false) : false;
        },
        destruir: () => {
          for (const c of camadas.values()) c.destruir();
          camadas.clear();
        },
      };
    },
  };
}
