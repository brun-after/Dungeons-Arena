// Marco 55 (26/11/2026, D-208): o trabalhador que gera as regiões do Mundo contínuo no cliente. Gerar uma região leva
// de 0,4 a 0,9 s (D-144), e no fio da página isso parava o jogo; aqui a mesma geração do servidor
// (`gerarRegiaoNoAtlas`, pura e determinística pela semente) roda à parte e devolve a região pronta para carimbar.

import { conteudoOficial } from '../core/conteudo';
import { montarAtlas } from '../mundo/atlas';
import { gerarRegiaoNoAtlas } from '../mundo/atlas-fase';
import type { PedidoDeRegiao, RespostaDeRegiao } from './gerar-regiao-protocolo';
import { reinoDoConteudo } from '../mundo/reino';

interface EscopoDoTrabalhador {
  addEventListener(tipo: 'message', ouvir: (ev: MessageEvent<PedidoDeRegiao>) => void): void;
  postMessage(mensagem: RespostaDeRegiao, transferir: Transferable[]): void;
}
const escopo = globalThis as unknown as EscopoDoTrabalhador;
const reino = reinoDoConteudo(conteudoOficial());
const atlas = montarAtlas(reino);

escopo.addEventListener('message', (ev) => {
  const { pedido, regiaoId } = ev.data;
  const regiao = reino.regioes.find((r) => r.id === regiaoId);
  if (!regiao) {
    escopo.postMessage({ pedido, regiaoId, ex: null }, []);
    return;
  }
  try {
    const ex = gerarRegiaoNoAtlas(reino, atlas, regiao);
    escopo.postMessage({ pedido, regiaoId, ex }, [ex.alturas.buffer, ex.obstaculos.buffer]);
  } catch {
    escopo.postMessage({ pedido, regiaoId, ex: null }, []);
  }
});
