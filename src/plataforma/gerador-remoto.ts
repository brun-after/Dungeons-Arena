// Marco 55 (26/11/2026, D-208): quem pede as regiões do Mundo contínuo ao trabalhador (gerar-regiao-trabalhador.ts),
// uma de cada vez, na ordem da fila: quem pede de novo uma região que ainda espera a passa para a frente (a de onde o
// jogador está, depois as vizinhas, depois o resto). Sem Worker (os testes no Node, um navegador antigo), a página gera
// ela mesma, uma região por vez entre os quadros.

import type { ExteriorGerado } from '../world/gerador-exterior';
import { gerarRegiaoNoAtlas } from '../mundo/atlas-fase';
import type { Atlas } from '../mundo/atlas';
import type { Reino } from '../mundo/reino';
import type { PedidoDeRegiao, RespostaDeRegiao } from './gerar-regiao-protocolo';

export interface GeradorDeRegioes {
  /** Pede as regiões nesta ordem de prioridade (as primeiras saem antes); cada uma chega uma vez por `aoGerar`. */
  pedir(regioes: readonly string[]): void;
  /** Quantas ainda faltam (na fila ou sendo geradas). */
  faltam(): number;
  destruir(): void;
}

export function criarGeradorDeRegioes(reino: Reino, atlas: Atlas, aoGerar: (regiaoId: string, ex: ExteriorGerado | null) => void): GeradorDeRegioes {
  let fila: string[] = [];
  const feitas = new Set<string>();
  let emCurso: string | null = null;
  let destruido = false;
  let proximoPedido = 1;
  let trabalhador: Worker | null = null;
  if (typeof Worker !== 'undefined') {
    try {
      trabalhador = new Worker(new URL('./gerar-regiao-trabalhador.ts', import.meta.url), { type: 'module' });
      trabalhador.addEventListener('message', (ev: MessageEvent<RespostaDeRegiao>) => { chegou(ev.data.regiaoId, ev.data.ex); });
      trabalhador.addEventListener('error', () => {
        // Sem o trabalhador daqui em diante: a região em curso volta para a fila e a página gera as próximas.
        trabalhador?.terminate();
        trabalhador = null;
        if (emCurso) fila.unshift(emCurso);
        emCurso = null;
        seguir();
      });
    } catch {
      trabalhador = null;
    }
  }
  const gerarAqui = (regiaoId: string) => {
    setTimeout(() => {
      if (destruido) return;
      const regiao = reino.regioes.find((r) => r.id === regiaoId);
      let ex: ExteriorGerado | null;
      try {
        ex = regiao ? gerarRegiaoNoAtlas(reino, atlas, regiao) : null;
      } catch {
        ex = null;
      }
      chegou(regiaoId, ex);
    }, 0);
  };
  function chegou(regiaoId: string, ex: ExteriorGerado | null): void {
    if (destruido) return;
    emCurso = null;
    feitas.add(regiaoId);
    aoGerar(regiaoId, ex);
    seguir();
  }
  function seguir(): void {
    if (destruido || emCurso) return;
    const proxima = fila.shift();
    if (!proxima) return;
    emCurso = proxima;
    if (trabalhador) {
      const m: PedidoDeRegiao = { pedido: proximoPedido++, regiaoId: proxima };
      trabalhador.postMessage(m);
    } else gerarAqui(proxima);
  }
  return {
    pedir(regioes) {
      const novas = regioes.filter((id) => !feitas.has(id) && id !== emCurso);
      fila = [...novas, ...fila.filter((id) => !novas.includes(id))];
      seguir();
    },
    faltam: () => fila.length + (emCurso ? 1 : 0),
    destruir() {
      destruido = true;
      fila = [];
      trabalhador?.terminate();
      trabalhador = null;
    },
  };
}
