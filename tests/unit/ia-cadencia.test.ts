// 08/11/2026 (D-139): a cadência dos inimigos. Em alcance, o inimigo ataca sem parar, no intervalo do preset encurtado
// pelo nível; a skill da vez que não alcança cede ao básico; a fração de skills sobe com o nível.
import { describe, expect, it } from 'vitest';
import { registrarParticipacao } from '../../src/combat/participacao';
import { criarEstado } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { ticksDe } from '../../src/core/tempo';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import { criarInimigo, criarJogador, type OpcoesInimigo } from '../../src/entities/fabrica';
import { bonusCadenciaPct, fracaoHabilidadePct, intervaloDeAtaqueMs, vezDaHabilidade } from '../../src/entities/ia-cadencia';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const ctx = contexto(faseDeTexto(SALA_ABERTA));
const regras = ctx.balance.ia.cadencia;
const SEGUNDOS = 20;

function obter<T>(v: T | undefined, nome: string): T {
  if (v === undefined) throw new Error(`${nome} ausente`);
  return v;
}

/**
 * O inimigo e um jogador que não morre nem revida, a `distancia` células; devolve as ações iniciadas pelo inimigo.
 * `provocado`: o jogador já o golpeou (o revide põe o inimigo a persegui-lo mesmo fora da detecção).
 */
function duelo(presetId: string, opcoes: OpcoesInimigo, distancia = 1, provocado = false): { habilidadeId: string; tick: number }[] {
  const estado = criarEstado({ semente: 7, faseId: 'teste' });
  const j = criarJogador(obter(CONTEUDO.classes.get('guerreiro'), 'guerreiro'), 'j', 5 + distancia, 5, ctx.balance);
  j.autoAtaque = false;
  j.hpMax = j.hp = 1e9;
  const e = criarInimigo(obter(CONTEUDO.presets.get(presetId), presetId), 'g', 5, 5, ctx.balance, opcoes);
  if (provocado) registrarParticipacao(e, j.id, 1, ctx);
  estado.entidades.push(j, e);
  const eventos: EventoSimulacao[] = [];
  for (let i = 0; i < ticksDe(SEGUNDOS * 1000); i++) simular(estado, ctx, [], eventos, DT_MS);
  const saida: { habilidadeId: string; tick: number }[] = [];
  for (const ev of eventos) if (ev.t === 'acaoIniciada' && ev.atorId === 'g') saida.push({ habilidadeId: ev.habilidadeId, tick: ev.tick });
  return saida;
}

/** Maior espera entre dois ataques seguidos, em ticks. */
function maiorEspera(acoes: { tick: number }[]): number {
  let maior = 0;
  for (let i = 1; i < acoes.length; i++) maior = Math.max(maior, obter(acoes[i], 'ação').tick - obter(acoes[i - 1], 'ação').tick);
  return maior;
}

describe('cadência pelo nível (regras)', () => {
  const goblin = (nivel: number) => criarInimigo(obter(CONTEUDO.presets.get('goblin'), 'goblin'), 'g', 0, 0, ctx.balance, { nivel });

  it('o intervalo encurta com o nível, até o teto do bônus e sem passar do piso', () => {
    const base = obter(CONTEUDO.presets.get('goblin'), 'goblin').intervaloAtaqueMs;
    expect(intervaloDeAtaqueMs(goblin(1), base, regras)).toBe(base);
    const n30 = intervaloDeAtaqueMs(goblin(30), base, regras);
    const n60 = intervaloDeAtaqueMs(goblin(60), base, regras);
    expect(n30).toBeLessThan(base);
    expect(n60).toBeLessThan(n30);
    expect(bonusCadenciaPct(goblin(100), regras)).toBe(regras.maxPct);
    expect(intervaloDeAtaqueMs(goblin(100), 1000, regras)).toBeGreaterThanOrEqual(regras.intervaloMinMs);
    // Um preset que já é mais rápido que o piso não fica mais lento.
    expect(intervaloDeAtaqueMs(goblin(1), 500, regras)).toBe(500);
  });

  it('o chefe ganha só parte do bônus', () => {
    const boss = criarInimigo(obter(CONTEUDO.presets.get('boss'), 'boss'), 'b', 0, 0, ctx.balance, { nivel: 30 });
    expect(bonusCadenciaPct(boss, regras)).toBeCloseTo(bonusCadenciaPct(goblin(30), regras) * regras.chefeMult, 6);
  });

  it('a fração de skills parte do revezamento antigo (ímpares) e sobe com o nível', () => {
    expect(fracaoHabilidadePct(goblin(1), regras)).toBe(regras.habilidadeBasePct);
    expect(fracaoHabilidadePct(goblin(30), regras)).toBeGreaterThan(fracaoHabilidadePct(goblin(1), regras));
    expect(fracaoHabilidadePct(goblin(100), regras)).toBe(regras.habilidadeMaxPct);
    const meio = [0, 1, 2, 3, 4, 5].map((n) => vezDaHabilidade(n, 50));
    expect(meio.map((v) => v.habilidade)).toEqual([false, true, false, true, false, true]);
    expect(meio.filter((v) => v.habilidade).map((v) => v.indice)).toEqual([0, 1, 2]);
    const tres = [0, 1, 2, 3, 4, 5, 6, 7].filter((n) => vezDaHabilidade(n, 75).habilidade).length;
    expect(tres).toBe(6);
  });
});

describe('inimigo em alcance ataca sem parar', () => {
  it('o goblin colado no alvo ataca no ritmo do intervalo do preset', () => {
    const acoes = duelo('goblin', { nivel: 1 });
    const intervalo = obter(CONTEUDO.presets.get('goblin'), 'goblin').intervaloAtaqueMs;
    const esperado = Math.floor((SEGUNDOS * 1000) / intervalo);
    expect(acoes.length).toBeGreaterThanOrEqual(esperado - 1);
    expect(acoes.length).toBeLessThanOrEqual(esperado + 1);
    // Nada de longas pausas andando: a maior espera é o próprio intervalo (com um tick de folga).
    expect(maiorEspera(acoes.slice(1))).toBeLessThanOrEqual(ticksDe(intervalo) + 1);
  });

  it('o ritmo sobe com o nível, na medida das regras', () => {
    const preset = obter(CONTEUDO.presets.get('troll'), 'troll');
    const contagem = [1, 30, 60].map((nivel) => duelo('troll', { nivel }).length);
    expect(contagem[1]).toBeGreaterThan(obter(contagem[0], 'n1'));
    expect(contagem[2]).toBeGreaterThan(obter(contagem[1], 'n30'));
    const troll60 = criarInimigo(preset, 't', 0, 0, ctx.balance, { nivel: 60 });
    const esperado = Math.floor((SEGUNDOS * 1000) / intervaloDeAtaqueMs(troll60, preset.intervaloAtaqueMs, regras));
    expect(contagem[2]).toBeGreaterThanOrEqual(esperado - 1);
  });

  it('as skills ganham espaço com o nível', () => {
    const fracao = (nivel: number) => {
      const acoes = duelo('vampiro', { nivel });
      return acoes.filter((a) => a.habilidadeId !== 'raio_vampirico').length / acoes.length;
    };
    expect(fracao(1)).toBe(0);
    expect(fracao(60)).toBeGreaterThan(0.25);
  });

  it('a skill da vez de alcance menor que o básico cede a vez ao básico (antes, o inimigo parava de atacar)', () => {
    // O esqueleto (flecha, alcance 5) com o dardo tóxico (alcance 4), golpeado a 5 células: só a flecha alcança.
    const acoes = duelo('esqueleto', { nivel: 1, habilidadesExtras: ['dardo_toxico'] }, 5, true);
    const intervalo = obter(CONTEUDO.presets.get('esqueleto'), 'esqueleto').intervaloAtaqueMs;
    expect(acoes.length).toBeGreaterThanOrEqual(Math.floor((SEGUNDOS * 1000) / intervalo) - 2);
    expect(maiorEspera(acoes.slice(1))).toBeLessThanOrEqual(ticksDe(intervalo) + 1);
  });
});
