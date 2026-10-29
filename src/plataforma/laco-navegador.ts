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
  /** Marco 20: teto de fps; quando devolve false, este quadro do navegador é pulado inteiro (simula no próximo). */
  quadroPermitido?: (agoraMs: number) => boolean;
  /** Marco 26 (D-122): orçamento de simulação por quadro, em ms (a campanha solo usa `ORCAMENTO_SIM_SOLO_MS`). */
  orcamentoMs?: number;
}

/** Inicia o laço. Retorna a função que o interrompe. */
export function iniciarLaco(opcoes: OpcoesLaco): () => void {
  const relogio = opcoes.relogio ?? relogioDoNavegador;
  const acumulador = criarAcumulador();
  let quadro = 0;
  let ultimoAlpha = 0;
  let parado = false;

  const aoQuadro = (): void => {
    if (opcoes.quadroPermitido && !opcoes.quadroPermitido(relogio.agoraMs())) {
      if (!parado) quadro = requestAnimationFrame(aoQuadro);
      return;
    }
    if (opcoes.pausado?.()) {
      acumulador.anteriorMs = null;
      acumulador.acumuladoMs = 0;
    } else {
      const orcamento = opcoes.orcamentoMs === undefined ? undefined : { ms: opcoes.orcamentoMs, relogio: () => relogio.agoraMs() };
      ultimoAlpha = avancarLaco(acumulador, relogio.agoraMs(), opcoes.simular, orcamento).alpha;
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
