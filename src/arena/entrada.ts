// Entrada de um jogador na arena (§2.13, "Ciclo de uma sala", passo 3): a entidade nasce da ficha
// de sessão validada (§3.7), na equipe e no local que o modo define.

import type { EntidadeId } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import { posicionar, criarEntidade, type Entidade } from '../entities/entidade';
import { equipeDeEntrada, localDeRespawn } from '../modos/regras';
import type { FichaDeSessao } from './ficha-sessao';

export function entrarNaArena(
  estado: EstadoJogo,
  ctx: ContextoSimulacao,
  jogadorId: string,
  entidadeId: EntidadeId,
  ficha: FichaDeSessao,
  nome: string,
): Entidade {
  const e = criarEntidade({
    id: entidadeId,
    tipo: 'jogador',
    x: 0,
    y: 0,
    nome,
    equipe: equipeDeEntrada(ctx.modo, jogadorId, estado),
    controlador: 'remoto',
    jogadorId,
    atributos: ficha.atributos,
    classe: ficha.classe,
    defesa: ficha.defesa,
    hpMax: ficha.hpMax,
    manaMax: ficha.manaMax,
    ataqueBasico: ficha.ataqueBasico,
    habilidades: ficha.habilidades,
    autoAtaque: true,
    nivel: ficha.nivel,
  });
  const local = localDeRespawn(estado, ctx.fase, ctx.modo, e, estado.rng);
  e.classeId = ficha.classeId;
  posicionar(e, local.x, local.y);
  e.origemX = local.x;
  e.origemY = local.y;
  estado.entidades.push(e);
  return e;
}
