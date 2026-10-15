// Criação de jogadores e inimigos a partir do conteúdo. HP e mana são sempre derivados das
// bases validadas (§2.5, §3.7). Marco 6: o jogador da campanha nasce com a bolsa (base + mochila).

import type { Balance } from '../core/contexto';
import type { EntidadeId } from '../core/comandos';
import { hpMaximo, manaMaxima } from '../progression/ficha';
import { criarBolsa } from '../progression/inventario';
import { ATRIBUTOS_NEUTROS, criarEntidade, type Atributos, type Entidade } from './entidade';
import type { ClasseJogador, PresetInimigo } from './presets';

export function criarJogador(
  classe: ClasseJogador,
  id: EntidadeId,
  x: number,
  y: number,
  balance: Balance,
  jogadorId = 'local',
): Entidade {
  const e = criarEntidade({
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
  // Sem nada equipado, a ficha derivada coincide com a da classe.
  e.bolsa = criarBolsa(classe, balance.economia.ouroInicial);
  return e;
}

export interface OpcoesInimigo {
  nivel?: number;
  /** Override de HP base da instância (§2.5: precede o da fase e o do preset). */
  hpBase?: number;
  /** Marco 14: habilidades a mais da instância (as geradas por semente nas fases geradas). */
  habilidadesExtras?: readonly string[];
}

/** Marco 15 (§2.5, D-061): os atributos do inimigo no nível, a partir do neutro, pelo crescimento do balance. */
export function atributosDoInimigo(nivel: number, balance: Balance): Atributos {
  const a: Atributos = { ...ATRIBUTOS_NEUTROS };
  for (const c of balance.inimigos.crescimento) a[c.atributo] += c.porNivel * Math.max(0, nivel - c.aPartirDoNivel + 1);
  return a;
}

export function criarInimigo(
  preset: PresetInimigo,
  id: EntidadeId,
  x: number,
  y: number,
  balance: Balance,
  opcoes: OpcoesInimigo = {},
): Entidade {
  const nivel = opcoes.nivel ?? 1;
  const atributos = atributosDoInimigo(nivel, balance);
  const e = criarEntidade({
    id,
    tipo: 'inimigo',
    x,
    y,
    nome: preset.nome,
    classe: preset.classe,
    defesa: preset.defesa,
    atributos,
    hpMax: Math.max(1, Math.round((hpMaximo(opcoes.hpBase ?? preset.hpBase, atributos.constituicao, balance.hp.hpAtributoMult, balance.hp.dificuldadeMult) * balance.inimigos.vidaPct) / 100)),
    manaMax: manaMaxima(atributos.sabedoria),
    ataqueBasico: preset.ataqueBasico,
    habilidades: [...preset.habilidades, ...(opcoes.habilidadesExtras ?? [])],
    autoAtaque: false,
    preset: preset.id,
    arquetipo: preset.arquetipo,
    nivel,
    // XP cresce com o nível (o mesmo goblin no nível 5 vale mais).
    xpBase: Math.round(preset.xp * (1 + (balance.inimigos.xpPorNivelPct / 100) * (nivel - 1))),
  });
  return e;
}
