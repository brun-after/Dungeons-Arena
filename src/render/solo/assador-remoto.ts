// Quem pede a pintura do chão (22/11/2026, D-202). Onde há Worker e OffscreenCanvas, o bloco é pintado no trabalhador
// (render/solo/assar-trabalhador.ts) e chega como ImageBitmap alguns quadros depois, sem parar a tela; sem eles (ou se
// o trabalhador falhar), o AssadorDeSolo pinta na página, como antes. Um trabalhador só, para todas as cenas.

import type { AreaAmbiente } from '../../world/ambiente-tipos';
import type { SoloTema } from '../../world/solo';
import { AssadorDeSolo, novaTela, type TelaDoSolo } from './assar';
import type { MensagemAoTrabalhador, RespostaDoTrabalhador } from './assar-protocolo';
import type { PesosDoBloco } from './mascaras';
import type { TexturasDoSolo } from './texturas';

/** O chão de um bloco, pronto: a imagem do trabalhador ou a tela pintada na página. */
export type ImagemAssada = TelaDoSolo | ImageBitmap;

export interface AssadorDoBloco {
  /** Lado da imagem para `celulas` células. */
  lado(celulas: number): number;
  /** Pinta o bloco de `largura` × `altura` px; null se não deu (o bloco fica na cor lisa). */
  assar(pesos: PesosDoBloco, origemX: number, origemY: number, largura: number, altura: number): Promise<ImagemAssada | null>;
  /** A cena saiu: o trabalhador esquece as texturas dela. */
  soltar(): void;
}

let trabalhador: Worker | null = null;
let falhou = false;
let proximoId = 1;
let proximoPedido = 1;
const esperando = new Map<number, (imagem: ImageBitmap | null) => void>();

function oTrabalhador(): Worker | null {
  if (falhou) return null;
  if (trabalhador) return trabalhador;
  if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined' || typeof createImageBitmap === 'undefined') {
    falhou = true;
    return null;
  }
  try {
    const t = new Worker(new URL('./assar-trabalhador.ts', import.meta.url), { type: 'module' });
    t.addEventListener('message', (ev: MessageEvent<RespostaDoTrabalhador>) => {
      const fim = esperando.get(ev.data.pedido);
      esperando.delete(ev.data.pedido);
      fim?.(ev.data.imagem);
    });
    t.addEventListener('error', () => {
      // Sem o trabalhador daqui em diante: os pedidos em curso voltam vazios e a página pinta os próximos.
      falhou = true;
      trabalhador = null;
      t.terminate();
      for (const fim of esperando.values()) fim(null);
      esperando.clear();
    });
    trabalhador = t;
    return t;
  } catch {
    falhou = true;
    return null;
  }
}

export function criarAssador(texturas: TexturasDoSolo, tema: SoloTema, escala: number, areas: readonly AreaAmbiente[], semente: number): AssadorDoBloco {
  const local = new AssadorDeSolo(texturas, tema, escala, areas, semente);
  const pintarAqui = (pesos: PesosDoBloco, origemX: number, origemY: number, largura: number, altura: number): ImagemAssada => {
    const tela = novaTela(largura, altura);
    local.assar(tela, pesos, origemX, origemY);
    return tela;
  };
  const t = oTrabalhador();
  const id = proximoId++;
  const enviar = (m: MensagemAoTrabalhador) => { t?.postMessage(m); };
  enviar({ tipo: 'assador', id, texturas: [...texturas], tema, escala, areas, semente });
  let solto = false;
  return {
    lado: (celulas) => local.lado(celulas),
    assar: (pesos, origemX, origemY, largura, altura) => {
      const agora = falhou ? null : t;
      if (!agora || solto) return Promise.resolve(solto ? null : pintarAqui(pesos, origemX, origemY, largura, altura));
      const pedido = proximoPedido++;
      return new Promise<ImagemAssada | null>((pronto) => {
        // Se o trabalhador cair no meio, a página pinta este bloco (os pesos não foram transferidos).
        esperando.set(pedido, (imagem) => { pronto(imagem ?? (solto ? null : pintarAqui(pesos, origemX, origemY, largura, altura))); });
        agora.postMessage({ tipo: 'assar', id, pedido, pesos, origemX, origemY, largura, altura } satisfies MensagemAoTrabalhador);
      });
    },
    soltar: () => {
      solto = true;
      enviar({ tipo: 'soltar', id });
    },
  };
}
