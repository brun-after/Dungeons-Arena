// O cliente nas passagens entre as regiões do Mundo (marco 41, 14/11/2026, D-169). Quem entra numa passagem:
// - vê o nome dela (a ponte, a passarela, o desfiladeiro…) e o aviso da trégua;
// - já tem o mapa da região do outro lado preparado em segundo plano (a troca no meio da passagem não espera a
//   geração do mapa).
// Quem chega à região nova já dentro da passagem não vê o nome de novo.

import { t, type ChaveTexto } from '../i18n';
import type { Entidade } from '../entities/entidade';
import { passagemNoPonto, type AreaDePassagem } from '../world/passagem';

/** De quantos em quantos quadros a posição é conferida (a passagem tem 28 células por lado: sobra tempo). */
const QUADROS_POR_CONFERENCIA = 10;

/** Roda `fazer` quando o navegador estiver folgado (ou logo, onde não há `requestIdleCallback`). */
function quandoFolgado(fazer: () => void): void {
  if (typeof requestIdleCallback === 'function') requestIdleCallback(fazer, { timeout: 500 });
  else setTimeout(fazer, 0);
}

export function vigiaDaPassagem(fase: { readonly passagens?: readonly AreaDePassagem[] }, preparar: (destino: string) => void, avisar: (texto: string) => void): (e: Entidade | undefined) => void {
  let atual: AreaDePassagem | null = null;
  let quadros = 0;
  let primeiro = true;
  return (e) => {
    if (!e || quadros++ % QUADROS_POR_CONFERENCIA !== 0) return;
    const aqui = passagemNoPonto(fase, e.x, e.y);
    if (aqui && aqui !== atual) {
      if (!primeiro && aqui.tipo) avisar(t(`mundo.passagem.${aqui.tipo}` as ChaveTexto));
      const destino = aqui.destino;
      if (destino) quandoFolgado(() => { preparar(destino); });
    }
    atual = aqui;
    primeiro = false;
  };
}
