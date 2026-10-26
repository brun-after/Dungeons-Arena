// Golpe no quebrável (marco 26, 26/10/2026, D-113). Clicar ou tocar num barril, caixote ou vaso: no alcance do básico,
// o golpe sai na hora, mirado na célula; longe, o personagem anda até ele e golpeia ao chegar. A interface só emite
// intenções (`irPara` e `ataqueBasico` com a célula); quem quebra é a simulação (combat/quebraveis.ts).

import { alcanceDe } from '../combat/acao';
import { celulaOcupada } from '../combat/geometria';
import { habilidadeDoAtor } from '../combat/perfil';
import { quebravelEm } from '../combat/quebraveis';
import type { Celula, Comando } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { Entidade } from '../entities/entidade';

/** Quanto tempo o golpe pendente espera o personagem chegar (depois disso, desiste). */
const ESPERA_MS = 5000;
/** Entre duas tentativas do golpe pendente (o básico pode estar em recarga): o mesmo ritmo do automático. */
const RETENTAR_MS = 250;

export interface GolpeNoQuebravel {
  /** O toque caiu num quebrável? Então cuida dele (golpe ou caminho) e devolve true. */
  tocar: (c: Celula, agoraMs: number) => boolean;
  /** A cada quadro: golpeia o pendente quando ele entra no alcance. */
  atualizar: (agoraMs: number) => void;
  /** Outro comando de movimento cancela o golpe pendente. */
  esquecer: () => void;
}

export function criarGolpeNoQuebravel(o: {
  ctx: ContextoSimulacao;
  estado: () => EstadoJogo;
  jogador: () => Entidade | undefined;
  emitir: (cmd: Comando) => void;
}): GolpeNoQuebravel {
  let pendente: (Celula & { ateMs: number; tentarEm: number }) | null = null;
  const noAlcance = (e: Entidade, c: Celula): boolean => {
    const hab = habilidadeDoAtor(o.ctx, e, e.ataqueBasico, o.estado().tick);
    if (!hab) return false;
    const p = celulaOcupada(e);
    return Math.max(Math.abs(p.x - c.x), Math.abs(p.y - c.y)) <= alcanceDe(o.ctx, e, hab, o.estado().tick);
  };
  const golpear = (c: Celula) => {
    o.emitir({ t: 'ataqueBasico', alvo: { x: c.x, y: c.y } });
  };
  return {
    tocar: (c, agoraMs) => {
      const local = o.jogador();
      if (!local || !quebravelEm(o.estado(), c.x, c.y)) return false;
      if (noAlcance(local, c)) {
        pendente = null;
        golpear(c);
        return true;
      }
      pendente = { x: c.x, y: c.y, ateMs: agoraMs + ESPERA_MS, tentarEm: 0 };
      o.emitir({ t: 'irPara', x: c.x, y: c.y });
      return true;
    },
    atualizar: (agoraMs) => {
      if (!pendente) return;
      const local = o.jogador();
      if (!local || agoraMs > pendente.ateMs || !quebravelEm(o.estado(), pendente.x, pendente.y)) {
        pendente = null;
        return;
      }
      if (agoraMs < pendente.tentarEm || !noAlcance(local, pendente)) return;
      // O golpe pode ser recusado (recarga, ocupado): tenta de novo até o objeto quebrar ou o tempo acabar.
      golpear(pendente);
      pendente.tentarEm = agoraMs + RETENTAR_MS;
    },
    esquecer: () => {
      pendente = null;
    },
  };
}
