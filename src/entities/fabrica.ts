// Criação de jogadores e inimigos a partir do conteúdo. HP e mana são sempre derivados das
// bases validadas (§2.5, §3.7).

import type { Balance } from '../core/contexto';
import type { EntidadeId } from '../core/comandos';
import { hpMaximo, manaMaxima } from '../progression/ficha';
import { criarEntidade, type Entidade } from './entidade';
import type { ClasseJogador, PresetInimigo } from './presets';

export function criarJogador(
  classe: ClasseJogador,
  id: EntidadeId,
  x: number,
  y: number,
  balance: Balance,
  jogadorId = 'local',
): Entidade {
  return criarEntidade({
    id,
    tipo: 'jogador',
    x,
    y,
    nome: classe.nome,
    jogadorId,
    atributos: classe.atributos,
    classe: classe.classe,
    defesa: classe.defesa,
    hpMax: hpMaximo(classe.hpBase, classe.atributos.constituicao, balance.hp.hpAtributoMult, balance.hp.dificuldadeMult),
    manaMax: manaMaxima(classe.atributos.sabedoria),
    ataqueBasico: classe.ataqueBasico,
    habilidades: classe.habilidades,
    autoAtaque: true,
  });
}

export interface OpcoesInimigo {
  nivel?: number;
  /** Override de HP base da instância (§2.5: precede o da fase e o do preset). */
  hpBase?: number;
}

export function criarInimigo(
  preset: PresetInimigo,
  id: EntidadeId,
  x: number,
  y: number,
  balance: Balance,
  opcoes: OpcoesInimigo = {},
): Entidade {
  const e = criarEntidade({
    id,
    tipo: 'inimigo',
    x,
    y,
    nome: preset.nome,
    classe: preset.classe,
    defesa: preset.defesa,
    hpMax: hpMaximo(opcoes.hpBase ?? preset.hpBase, 10, balance.hp.hpAtributoMult, balance.hp.dificuldadeMult),
    manaMax: manaMaxima(10),
    ataqueBasico: preset.ataqueBasico,
    habilidades: preset.habilidades,
    autoAtaque: false,
    preset: preset.id,
    arquetipo: preset.arquetipo,
    nivel: opcoes.nivel ?? 1,
    xpBase: preset.xp,
  });
  return e;
}
