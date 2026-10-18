// Experimentos de balanceamento (18/10/2026): cenários pareados e intervenções locais, sem mudar os dados do jogo.
import type { ContextoSimulacao } from '../../src/core/contexto';
import { vivo } from '../../src/entities/entidade';
import type { Dificuldade } from '../../src/modos/dificuldade';
import { BotDeDuelo, CONTEUDO, contextoDoCenario, inimigo, jogadorTipico, mundo, TICKS_POR_S } from './cenarios';
import { MedidorCombate, type MetricasCombate } from './metricas';

export const CLASSES_DIAGNOSTICO = [...CONTEUDO.classes.keys()];
export const CENARIOS = ['duelo', 'pressao', 'atrito', 'chefe'] as const;
export type Cenario = typeof CENARIOS[number];
export const INTERVENCOES = ['base', 'sem_cura_basico', 'sem_pocoes', 'sem_barra', 'sem_defesa'] as const;
export type Intervencao = typeof INTERVENCOES[number];
export interface ConfiguracaoDiagnostico {
  classe: string; nivel: number; dificuldade: Dificuldade; cenario: Cenario; semente: number;
  intervencao?: Intervencao; limiteS?: number;
}
export interface AmostraCombate {
  configuracao: ConfiguracaoDiagnostico;
  resultado: 'vitoria' | 'morte' | 'limite';
  tempoS: number; ondasConcluidas: number; ondasPlanejadas: number; abates: number;
  hpInicial: number; hpFinal: number; hpMax: number; defesa: number; manaInicial: number; manaFinal: number;
  /** Saldo não explicado pelos eventos: inclui regeneração por movimento e outras fontes sem evento. */
  saldoHpSemEvento: number; saldoManaSemEvento: number;
  metricas: MetricasCombate;
  ondas: EtapaCombate[];
}
export interface EtapaCombate {
  numero: number; alvos: string[]; hpEntrada: number; hpSaida: number; manaEntrada: number; manaSaida: number;
  tempoS: number; dano: number; recebido: number; cura: number; manaGasta: number;
  resultado: 'vitoria' | 'morte' | 'limite';
}
const ondasDe = (cenario: Cenario): string[][] => {
  switch (cenario) {
    case 'duelo': return [['orc']];
    case 'pressao': return [['orc', 'goblin', 'esqueleto']];
    case 'atrito': return [['goblin'], ['orc'], ['esqueleto'], ['orc'], ['goblin']];
    case 'chefe': return [['boss']];
  }
};

export function contextoExperimental(intervencao: Intervencao): ContextoSimulacao {
  const ctx = contextoDoCenario();
  if (intervencao !== 'sem_cura_basico') return ctx;
  return { ...ctx, balance: { ...ctx.balance, recursos: { ...ctx.balance.recursos, curaBasicoPorClassePct: {} } } };
}

export function simularDiagnostico(configuracao: ConfiguracaoDiagnostico): AmostraCombate {
  const { classe, nivel, dificuldade, cenario, semente, intervencao = 'base', limiteS = 90 } = configuracao;
  if (!CONTEUDO.classes.has(classe) || !Number.isInteger(nivel) || nivel < 1 || nivel > 30 || !Number.isFinite(limiteS) || limiteS <= 0 || !Number.isSafeInteger(semente)) throw new Error('Configuração de diagnóstico inválida');
  const ctx = contextoExperimental(intervencao);
  const j = jogadorTipico(ctx, classe, nivel);
  if (intervencao === 'sem_pocoes' && j.bolsa) j.bolsa.mochila = j.bolsa.mochila.filter(i => i.itemId !== 'pocao_vida');
  if (intervencao === 'sem_barra') j.habilidades = [];
  if (intervencao === 'sem_defesa') j.defesa = 0;
  const hpInicial = j.hp, hpMax = j.hpMax, defesa = j.defesa, manaInicial = j.mana;
  const m = mundo(ctx, semente, [j], dificuldade);
  m.bots.push(new BotDeDuelo(j.id, intervencao !== 'sem_barra'));
  const ids = new Set<string>();
  const medidor = new MedidorCombate(j.id, ids);
  const ondas = ondasDe(cenario);
  const etapas: EtapaCombate[] = [];
  let ondasConcluidas = 0, serial = 0;
  for (const onda of ondas) {
    if (!vivo(j) || m.estado.tick >= limiteS * TICKS_POR_S) break;
    // Troca de onda imediata: não restaura HP, mana, recargas, poções ou invocações; sem XP/respawn de alvos.
    m.estado.entidades = m.estado.entidades.filter(e => !ids.has(e.id));
    const alvos = onda.map((preset, i) => {
      const id = `alvo-${++serial}`;
      const x = Math.min(20, Math.max(2, j.x + 3)), y = Math.min(15, Math.max(2, j.y + (i - 1) * 2));
      const e = inimigo(ctx, preset, nivel, id, x, y);
      e.xpBase = 0;
      ids.add(id);
      return e;
    });
    m.estado.entidades.push(...alvos);
    const entrada = { tick: m.estado.tick, hp: j.hp, mana: j.mana, ...medidor.metricas };
    while (vivo(j) && alvos.some(vivo) && m.estado.tick < limiteS * TICKS_POR_S) {
      medidor.amostrar(j, m.estado, ctx);
      const inicio = m.eventos.length;
      m.rodar(1);
      medidor.registrar(m.eventos.slice(inicio));
      m.estado.respawns = [];
    }
    const venceu = alvos.every(e => !vivo(e));
    etapas.push({ numero: etapas.length + 1, alvos: [...onda], hpEntrada: entrada.hp, hpSaida: j.hp,
      manaEntrada: entrada.mana, manaSaida: j.mana, tempoS: (m.estado.tick - entrada.tick) / TICKS_POR_S,
      dano: medidor.metricas.dano - entrada.dano, recebido: medidor.metricas.recebido - entrada.recebido,
      cura: medidor.metricas.cura - entrada.cura, manaGasta: medidor.metricas.manaGasta - entrada.manaGasta,
      resultado: !vivo(j) ? 'morte' : venceu ? 'vitoria' : 'limite' });
    // Uma troca letal simultânea é derrota, mesmo que o último inimigo também tenha caído.
    if (venceu && vivo(j)) ondasConcluidas++;
    else break;
  }
  const metricas = medidor.metricas;
  if (j.nivel !== nivel) throw new Error('O diagnóstico não pode subir o nível do personagem');
  return {
    configuracao: { ...configuracao, intervencao, limiteS },
    resultado: !vivo(j) ? 'morte' : ondasConcluidas === ondas.length ? 'vitoria' : 'limite',
    tempoS: m.estado.tick / TICKS_POR_S, ondasConcluidas, ondasPlanejadas: ondas.length,
    abates: m.eventos.filter(e => e.t === 'morreu' && ids.has(e.id)).length,
    hpInicial, hpFinal: j.hp, hpMax, defesa, manaInicial, manaFinal: j.mana,
    saldoHpSemEvento: j.hp - hpInicial + metricas.recebido + metricas.vidaGasta - metricas.cura,
    saldoManaSemEvento: j.mana - manaInicial + metricas.manaGasta - metricas.manaRestauradaEventos,
    metricas, ondas: etapas,
  };
}
