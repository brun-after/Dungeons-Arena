// O alvo das habilidades de suporte de alvo único (09/11/2026, D-144): buffs, curas e escudos. Por padrão vão no
// próprio personagem; com Shift, no aliado ou invocação por perto com a menor vida (jogadores primeiro); e quem tocou
// ou clicou num aliado (ou invocação) antes da habilidade a manda nele (o jeito do celular, sem Shift). O núcleo só
// recebe o id do alvo no comando e confere (alcance, relação), como em qualquer pedido.

import type { Celula, EntidadeId } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import { alcanceDe, alvoDeSuporteValido } from '../combat/acao';
import { celulaOcupada, chebyshev } from '../combat/geometria';
import { habilidadeDoAtor } from '../combat/perfil';
import { vivo, type Entidade } from '../entities/entidade';

export interface OpcoesAlvoDeSuporte {
  ctx: ContextoSimulacao;
  estado: () => EstadoJogo;
  jogador: () => Entidade | undefined;
  /** Mostra quem ficou escolhido (o nome) ou que a escolha acabou (null). */
  aoEscolher: (nome: string | null) => void;
}

export interface AlvoDeSuporte {
  /** O alvo a pedir para a habilidade (undefined: não é suporte de alvo único; o núcleo decide). */
  alvoPara(habilidadeId: string): EntidadeId | undefined;
  /** Toque ou clique numa célula: no aliado, escolhe-o e devolve true; fora dele, esquece a escolha. */
  tocar(c: Celula): boolean;
  destruir(): void;
}

/** O aliado ou invocação no alcance com a menor fração de vida, jogadores antes das invocações (sem contar o próprio). */
export function aliadoMaisFeridoPerto(estado: EstadoJogo, ctx: ContextoSimulacao, eu: Entidade, alcance: number): Entidade | null {
  const origem = celulaOcupada(eu);
  const candidatos = estado.entidades.filter((e) => e.id !== eu.id && alvoDeSuporteValido(ctx, eu, e) && chebyshev(origem, celulaOcupada(e)) <= alcance);
  const fracao = (e: Entidade) => e.hp / Math.max(1, e.hpMax);
  candidatos.sort((a, b) => Number(!!a.invocacao) - Number(!!b.invocacao) || fracao(a) - fracao(b) || a.id.localeCompare(b.id));
  return candidatos[0] ?? null;
}

export function criarAlvoDeSuporte(o: OpcoesAlvoDeSuporte): AlvoDeSuporte {
  let escolhido: EntidadeId | null = null;
  let shift = false;
  const teclas = (ev: KeyboardEvent) => { shift = ev.shiftKey; };
  const soltar = () => { shift = false; };
  addEventListener('keydown', teclas);
  addEventListener('keyup', teclas);
  addEventListener('blur', soltar);

  const valido = (eu: Entidade, id: EntidadeId | null): Entidade | null => {
    const e = id ? o.estado().entidades.find((x) => x.id === id) : undefined;
    return e && e.id !== eu.id && vivo(e) && alvoDeSuporteValido(o.ctx, eu, e) ? e : null;
  };
  const esquecer = () => {
    if (escolhido === null) return;
    escolhido = null;
    o.aoEscolher(null);
  };

  return {
    alvoPara: (habilidadeId) => {
      const eu = o.jogador();
      const estado = o.estado();
      const hab = eu ? habilidadeDoAtor(o.ctx, eu, habilidadeId, estado.tick) : undefined;
      if (!eu || hab?.politicaAlvo !== 'aliado') return undefined;
      if (shift) return aliadoMaisFeridoPerto(estado, o.ctx, eu, alcanceDe(o.ctx, eu, hab, estado.tick))?.id ?? eu.id;
      const aliado = valido(eu, escolhido);
      if (!aliado) esquecer();
      return aliado?.id ?? eu.id;
    },
    tocar: (c) => {
      const eu = o.jogador();
      const aliado = eu ? o.estado().entidades.find((e) => {
        const oc = celulaOcupada(e);
        return oc.x === c.x && oc.y === c.y && !!valido(eu, e.id) && !e.invocacao?.companheiro;
      }) : undefined;
      if (!aliado) {
        esquecer();
        return false;
      }
      escolhido = aliado.id;
      o.aoEscolher(aliado.nome);
      return true;
    },
    destruir: () => {
      removeEventListener('keydown', teclas);
      removeEventListener('keyup', teclas);
      removeEventListener('blur', soltar);
    },
  };
}
