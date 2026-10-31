// Retrato da classe (marco 26, 28/10/2026, D-116): o mesmo desenho do personagem no jogo (render/modelos, vista 3/4,
// quadro parado), com a arma e a mão secundária da classe, para a tela de seleção. Só monta o SVG a partir das
// constantes do código: nada de texto do jogador entra aqui.

import { equipamento3d } from './adornos';
import { SEM_GIRO } from './equipamento-3d';
import { armaDe, atlasDe, existeArma3d, maoNoQuadro, urlDoAtlas } from './personagens-3d';
import { adornosDoBipede } from './modelos/adornos';
import { ARMA_DE_CLASSE, MODELOS, OPCOES_JOGAVEIS } from './modelos/index';
import { LADO_QUADRO } from './modelos/svg';

const ehJogavel = (m: string): m is keyof typeof OPCOES_JOGAVEIS => Object.hasOwn(OPCOES_JOGAVEIS, m);

/** O miolo SVG (quadro de 64) do retrato do modelo da classe, ou null se o modelo não for jogável. */
export function mioloDoRetrato(modelo: string): string | null {
  if (!ehJogavel(modelo)) return null;
  const arma = ARMA_DE_CLASSE[modelo];
  const camadas = adornosDoBipede(OPCOES_JOGAVEIS[modelo], '34', {
    arma: arma.arma,
    secundaria: arma.secundaria,
    cabeca: null,
    corpo: null,
    capa: null,
    corElemento: null,
    forma: null,
    formaMaxima: null,
  });
  const sombra = `<ellipse cx="${LADO_QUADRO / 2}" cy="60" rx="15" ry="3.5" fill="#000" fill-opacity="0.35"/>`;
  return sombra + camadas.atras + MODELOS[modelo].desenhar('34', 0) + camadas.frente + camadas.secundaria + camadas.arma;
}

/** A direção do atlas de frente para a câmera (para baixo na tela). */
const DE_FRENTE = 1;

function imagem(url: Promise<string>): Promise<HTMLImageElement> {
  return url.then((u) => {
    const img = new Image();
    img.src = u;
    return img.decode().then(() => img);
  });
}

/**
 * Marco 32 (31/10/2026, D-131): o retrato pré-renderizado (o primeiro quadro parado, de frente, com a arma da classe
 * na mão), num canvas do tamanho do quadro. Null se a classe não tiver atlas; `pronto` resolve false se a imagem falhar
 * (quem chama mantém o desenho de antes).
 */
export function retrato3d(modelo: string): { canvas: HTMLCanvasElement; pronto: Promise<boolean> } | null {
  const corpo = atlasDe(modelo);
  const urlCorpo = urlDoAtlas(modelo);
  if (!corpo || !urlCorpo) return null;
  const canvas = document.createElement('canvas');
  canvas.width = corpo.quadroL;
  canvas.height = corpo.quadroA;
  const eq = equipamento3d(modelo, null, existeArma3d);
  const armas = (['d', 'e'] as const).flatMap((lado) => {
    const a = lado === 'd' ? eq?.arma : eq?.secundaria;
    const dados = a ? armaDe(a.modelo) : null;
    const mao = maoNoQuadro(modelo, lado, DE_FRENTE, 0);
    return a && dados && mao ? [{ a, dados, mao }] : [];
  });
  const pronto = Promise.all([imagem(urlCorpo), ...armas.map((x) => imagem(x.dados.url))]).then(
    ([img, ...imgsArmas]) => {
      const g = canvas.getContext('2d');
      if (!g) return false;
      const desenharArma = (j: number) => {
        const x = armas[j];
        const im = imgsArmas[j];
        if (!x || !im) return;
        const m = x.dados.medidas;
        g.save();
        g.translate(x.mao.x, x.mao.y);
        if (!SEM_GIRO.has(x.a.modelo)) {
          g.rotate(x.mao.angulo);
          g.scale(1, x.mao.encurta);
        }
        g.drawImage(im, x.a.grau * m.celL, 0, m.celL, m.celA, -m.pegaX, -m.pegaY, m.celL, m.celA);
        g.restore();
      };
      armas.forEach((x, j) => {
        if (!x.mao.frente) desenharArma(j);
      });
      g.drawImage(img, 0, DE_FRENTE * corpo.quadroA, corpo.quadroL, corpo.quadroA, 0, 0, corpo.quadroL, corpo.quadroA);
      armas.forEach((x, j) => {
        if (x.mao.frente) desenharArma(j);
      });
      return true;
    },
    () => false,
  );
  return { canvas, pronto };
}
