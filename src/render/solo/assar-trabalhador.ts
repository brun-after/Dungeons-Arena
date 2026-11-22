// O trabalhador que pinta o chão (22/11/2026, D-202). Pintar um bloco de 16×16 células leva dezenas de milissegundos
// (as camadas recortadas, as áreas elementais, as sombras), e no fio da página isso parava o quadro: na troca de
// região, um bloco por quadro a ~40 ms cada, e ao andar, a cada bloco novo. Aqui o mesmo AssadorDeSolo pinta num
// OffscreenCanvas e devolve o ImageBitmap; a página só calcula os pesos e manda a imagem pronta para a tela.

import { AssadorDeSolo, novaTela } from './assar';
import type { MensagemAoTrabalhador, RespostaDoTrabalhador } from './assar-protocolo';
import type { TexturaSolo } from '../../world/solo';

const assadores = new Map<number, AssadorDeSolo>();

interface EscopoDoTrabalhador {
  addEventListener(tipo: 'message', ouvir: (ev: MessageEvent<MensagemAoTrabalhador>) => void): void;
  postMessage(mensagem: RespostaDoTrabalhador, transferir: Transferable[]): void;
}
const escopo = globalThis as unknown as EscopoDoTrabalhador;

escopo.addEventListener('message', (ev) => {
  const m = ev.data;
  if (m.tipo === 'assador') {
    assadores.set(m.id, new AssadorDeSolo(new Map<TexturaSolo, ImageBitmap>(m.texturas), m.tema, m.escala, m.areas, m.semente));
    return;
  }
  if (m.tipo === 'soltar') {
    assadores.delete(m.id);
    return;
  }
  const assador = assadores.get(m.id);
  if (!assador) {
    escopo.postMessage({ pedido: m.pedido, imagem: null }, []);
    return;
  }
  const tela = novaTela(m.largura, m.altura) as OffscreenCanvas;
  assador.assar(tela, m.pesos, m.origemX, m.origemY);
  const imagem = tela.transferToImageBitmap();
  escopo.postMessage({ pedido: m.pedido, imagem }, [imagem]);
});
