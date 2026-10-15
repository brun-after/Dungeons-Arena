// Adaptador do laço para o navegador: requestAnimationFrame + performance.now.
// O cálculo do passo fixo mora em core/loop.ts; aqui só se agenda o quadro.
// Marco 12 (14/10/2026): `pausado` (pausa da campanha) para a simulação e descarta o tempo acumulado,
// para não haver uma avalanche de ticks ao voltar; o desenho continua.

import type { Relogio } from '../core/clock';
import { avancarLaco, criarAcumulador } from '../core/loop';

export const relogioDoNavegador: Relogio = {
  agoraMs: () => performance.now(),
};

export interface OpcoesLaco {
  simular: (dtMs: number) => void;
  renderizar: (alpha: number) => void;
  relogio?: Relogio;
  pausado?: () => boolean;
}

/** Inicia o laço. Retorna a função que o interrompe. */
export function iniciarLaco(opcoes: OpcoesLaco): () => void {
  const relogio = opcoes.relogio ?? relogioDoNavegador;
  const acumulador = criarAcumulador();
  let quadro = 0;
  let ultimoAlpha = 0;
  let parado = false;

  const aoQuadro = (): void => {
    if (opcoes.pausado?.()) {
      acumulador.anteriorMs = null;
      acumulador.acumuladoMs = 0;
    } else {
      ultimoAlpha = avancarLaco(acumulador, relogio.agoraMs(), opcoes.simular).alpha;
    }
    opcoes.renderizar(ultimoAlpha);
    // Marco 16: parar de dentro do próprio quadro não agenda o seguinte.
    if (!parado) quadro = requestAnimationFrame(aoQuadro);
  };
  quadro = requestAnimationFrame(aoQuadro);

  return () => {
    parado = true;
    cancelAnimationFrame(quadro);
  };
}
