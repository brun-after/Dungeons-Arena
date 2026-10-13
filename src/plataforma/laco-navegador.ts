// Adaptador do laço para o navegador: requestAnimationFrame + performance.now.
// O cálculo do passo fixo mora em core/loop.ts; aqui só se agenda o quadro.

import type { Relogio } from '../core/clock';
import { avancarLaco, criarAcumulador } from '../core/loop';

export const relogioDoNavegador: Relogio = {
  agoraMs: () => performance.now(),
};

export interface OpcoesLaco {
  simular: (dtMs: number) => void;
  renderizar: (alpha: number) => void;
  relogio?: Relogio;
}

/** Inicia o laço. Retorna a função que o interrompe. */
export function iniciarLaco(opcoes: OpcoesLaco): () => void {
  const relogio = opcoes.relogio ?? relogioDoNavegador;
  const acumulador = criarAcumulador();
  let quadro = 0;

  const aoQuadro = (): void => {
    const { alpha } = avancarLaco(acumulador, relogio.agoraMs(), opcoes.simular);
    opcoes.renderizar(alpha);
    quadro = requestAnimationFrame(aoQuadro);
  };
  quadro = requestAnimationFrame(aoQuadro);

  return () => {
    cancelAnimationFrame(quadro);
  };
}
