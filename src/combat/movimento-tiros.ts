// Marco 40 (14/11/2026, D-168): balançando na corda da Chegada, o Arqueiro atira o básico, assim que ele estiver pronto, no
// inimigo mais perto dentro do alcance (sem precisar de alvo nem parar o balanço). A partir do marco elemental, o tiro
// leva a ponta do Arqueiro (movimento-extras.ts, `basicoElemental`).

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { vivo } from '../entities/entidade';
import { alcanceDe, alvoOfensivoValido, iniciarAcao } from './acao';
import { celulaOcupada, chebyshev } from './geometria';
import { naTirolesa } from './movimento-classe';
import { habilidadeDoAtor } from './perfil';

export function processarTirosDoBalanco(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): void {
  for (const e of estado.entidades) {
    if (!naTirolesa(e) || !vivo(e) || e.acao || !e.ataqueBasico) continue;
    const hab = habilidadeDoAtor(ctx, e, e.ataqueBasico, estado.tick);
    if (!hab) continue;
    const alcance = alcanceDe(ctx, e, hab, estado.tick);
    const origem = celulaOcupada(e);
    let melhor: { id: string; d: number } | null = null;
    for (const o of estado.entidades) {
      if (o === e || !alvoOfensivoValido(estado, ctx, e, o)) continue;
      const d = chebyshev(origem, celulaOcupada(o));
      if (d <= alcance && (!melhor || d < melhor.d)) melhor = { id: o.id, d };
    }
    if (!melhor) continue;
    // A recusa (a recarga do básico) não vai para a tela: tenta de novo no tick seguinte.
    const tentativa: EventoSimulacao[] = [];
    if (iniciarAcao(estado, ctx, e, e.ataqueBasico, melhor.id, tentativa)) saida.push(...tentativa);
  }
}
