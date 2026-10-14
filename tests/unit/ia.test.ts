import { describe, expect, it } from 'vitest';
import type { Conteudo } from '../../src/core/conteudo';
import { BALANCE_PADRAO, type ContextoSimulacao } from '../../src/core/contexto';
import { buscarEntidade, criarEstado } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { criarRng } from '../../src/core/rng';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import { ticksDe } from '../../src/core/tempo';
import { chebyshev } from '../../src/combat/geometria';
import type { Entidade } from '../../src/entities/entidade';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { sortearHesitacaoS } from '../../src/entities/ia';
import type { PresetInimigo } from '../../src/entities/presets';
import { verificarInvariantes } from '../sim/harness';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const REGRAS = BALANCE_PADRAO.ia;

function obter<T>(v: T | undefined, nome: string): T {
  if (v === undefined) throw new Error(`${nome} ausente`);
  return v;
}

/** Contexto com presets ajustados (detecção e hesitação) para cenas curtas e determinísticas. */
function ctxCom(mapa: string[], ajustes: Record<string, Partial<PresetInimigo>> = {}): ContextoSimulacao {
  const presets = new Map(CONTEUDO.presets);
  for (const [id, ajuste] of Object.entries(ajustes)) presets.set(id, { ...obter(presets.get(id), id), ...ajuste });
  const conteudo: Conteudo = { ...CONTEUDO, presets };
  return { ...contexto(faseDeTexto(mapa)), conteudo };
}

function cena(ctx: ContextoSimulacao, jogador: [number, number] | null, inimigos: [string, number, number][]) {
  const estado = criarEstado({ semente: 3, faseId: 'teste' });
  if (jogador) {
    estado.entidades.push(criarJogador(obter(CONTEUDO.classes.get('aventureiro'), 'classe'), 'j', jogador[0], jogador[1], ctx.balance));
  }
  inimigos.forEach(([preset, x, y], i) => {
    estado.entidades.push(criarInimigo(obter(ctx.conteudo.presets.get(preset), preset), `i${i}`, x, y, ctx.balance));
  });
  const eventos: EventoSimulacao[] = [];
  const ent = (id: string): Entidade => obter(buscarEntidade(estado, id), id);
  const rodar = (ticks: number, parar?: () => boolean) => {
    for (let i = 0; i < ticks; i++) {
      simular(estado, ctx, [], eventos, DT_MS);
      expect(verificarInvariantes(estado, ctx)).toEqual([]);
      if (parar?.()) return;
    }
  };
  const de = <T extends EventoSimulacao['t']>(t: T) => eventos.filter((e): e is Extract<EventoSimulacao, { t: T }> => e.t === t);
  return { estado, eventos, ent, rodar, de };
}

describe('hesitação (§2.6)', () => {
  function distribuicao(carisma: number, presetS: number, n = 20_000) {
    const rng = criarRng(11);
    const contagem = new Map<number, number>();
    for (let i = 0; i < n; i++) {
      const s = sortearHesitacaoS(rng, carisma, 10, presetS, REGRAS);
      contagem.set(s, (contagem.get(s) ?? 0) + 1);
    }
    return (s: number) => (contagem.get(s) ?? 0) / n;
  }

  it('segue a tabela: 2 s 10%, 5 s 30%, 7 s 50%, 10 s no restante', () => {
    const p = distribuicao(10, 10);
    expect(p(2)).toBeCloseTo(0.1, 1);
    expect(p(5)).toBeCloseTo(0.3, 1);
    expect(p(7)).toBeCloseTo(0.5, 1);
    expect(p(10)).toBeCloseTo(0.1, 1);
  });

  it('Carisma do alvo faz hesitar mais: cada ponto multiplica as chances curtas por 0.9', () => {
    const p = distribuicao(14, 10);
    const f = 0.9 ** 4;
    expect(p(2)).toBeCloseTo(0.1 * f, 1);
    expect(p(10)).toBeCloseTo(1 - 0.9 * f, 1);
  });

  it('o tempo é escalado pela hesitação do preset (D-024)', () => {
    const p = distribuicao(10, 5, 4_000);
    expect(p(1) + p(2.5) + p(3.5) + p(5)).toBeCloseTo(1, 5);
  });

  it('é reprodutível pela semente', () => {
    const a = criarRng(5);
    const b = criarRng(5);
    for (let i = 0; i < 50; i++) expect(sortearHesitacaoS(a, 12, 10, 6, REGRAS)).toBe(sortearHesitacaoS(b, 12, 10, 6, REGRAS));
  });
});

describe('patrulha', () => {
  it('dá um passo a cada ~1500 ms, só em células válidas', () => {
    const c = cena(ctxCom(SALA_ABERTA), null, [['goblin', 5, 5]]);
    c.rodar(ticksDe(60_000));
    const passos = c.de('moveu').map((e) => e.tick);
    expect(passos.length).toBeGreaterThan(15);
    expect(passos.length).toBeLessThanOrEqual(41);
    for (let i = 1; i < passos.length; i++) {
      expect((passos[i] ?? 0) - (passos[i - 1] ?? 0)).toBeGreaterThanOrEqual(ticksDe(1500) - 1);
    }
  });
});

describe('detecção, hesitação e perseguição', () => {
  const CORREDOR_COM_PAREDE = [
    '############',
    '#..........#',
    '#..........#',
    '##.######..#',
    '#..........#',
    '#..........#',
    '#..........#',
    '############',
  ];

  it('perseguidor nota, hesita, contorna a parede e ataca', () => {
    const ctx = ctxCom(CORREDOR_COM_PAREDE, { goblin: { deteccao: 8, hesitacaoS: 1 } });
    const c = cena(ctx, [5, 5], [['goblin', 5, 1]]);
    c.rodar(ticksDe(20_000), () => c.de('impacto').some((e) => e.fonteId === 'i0'));
    expect(c.de('iaNotou')).toMatchObject([{ id: 'i0', alvoId: 'j' }]);
    expect(c.de('iaPerseguindo')[0]?.tick).toBeGreaterThanOrEqual(c.de('iaNotou')[0]?.hesitacaoAteTick ?? Infinity);
    expect(c.de('impacto').some((e) => e.fonteId === 'i0' && e.alvoId === 'j')).toBe(true);
  });

  it('jogador invisível não é notado', () => {
    const ctx = ctxCom(SALA_ABERTA, { goblin: { deteccao: 8 } });
    const c = cena(ctx, [5, 5], [['goblin', 7, 5]]);
    c.ent('j').invisivelAteTick = 10_000;
    c.rodar(ticksDe(5_000));
    expect(c.de('iaNotou')).toHaveLength(0);
  });

  it('desiste depois de muito tempo sem interação', () => {
    // Intervalo de ataque enorme: persegue, mas nunca interage.
    const ctx = ctxCom(SALA_ABERTA, { goblin: { deteccao: 8, hesitacaoS: 0.1, intervaloAtaqueMs: 1e9 } });
    const c = cena(ctx, [5, 5], [['goblin', 8, 5]]);
    c.estado.recargas.ignorado = 0;
    // Impede o jogador de reagir: sem ataque automático.
    c.ent('j').autoAtaque = false;
    c.rodar(ticksDe(180_000), () => c.de('iaDesistiu').length > 0);
    const desistiu = obter(c.de('iaDesistiu')[0], 'desistência');
    const comecou = obter(c.de('iaPerseguindo')[0], 'perseguição');
    expect(desistiu.tick - comecou.tick).toBeGreaterThanOrEqual(ticksDe(10_000));
  });

  it('alvo inalcançável: após 3 falhas de caminho, desiste', () => {
    const ILHAS = ['##########', '#...#....#', '#...#....#', '#...#....#', '##########', '##########', '##########', '##########'];
    const ctx = ctxCom(ILHAS, { goblin: { deteccao: 8, hesitacaoS: 0.1 } });
    const c = cena(ctx, [6, 2], [['goblin', 2, 2]]);
    c.rodar(ticksDe(5_000), () => c.de('iaDesistiu').length > 0);
    expect(c.de('iaDesistiu')).toHaveLength(1);
    expect(c.de('caminhoFalhou').length).toBeGreaterThanOrEqual(3);
  });
});

describe('arquétipos', () => {
  it('atirador recua quando o jogador encosta e atira de longe', () => {
    const ctx = ctxCom(SALA_ABERTA, { esqueleto: { hesitacaoS: 0.1 } });
    const c = cena(ctx, [5, 5], [['esqueleto', 6, 5]]);
    c.ent('j').autoAtaque = false;
    c.rodar(ticksDe(8_000), () => c.de('projetilLancado').length > 0);
    const e = c.ent('i0');
    expect(chebyshev(e, c.ent('j'))).toBeGreaterThanOrEqual(BALANCE_PADRAO.ia.distanciaMinAtirador);
    expect(c.de('projetilLancado')).toMatchObject([{ donoId: 'i0', habilidadeId: 'flecha' }]);
  });

  it('controlador lança área na célula do alvo', () => {
    const ctx = ctxCom(SALA_ABERTA, { cultista: { hesitacaoS: 0.1, deteccao: 6 } });
    const c = cena(ctx, [3, 5], [['cultista', 7, 5]]);
    c.ent('j').autoAtaque = false;
    c.rodar(ticksDe(6_000), () => c.de('acaoIniciada').length > 0);
    const j = c.ent('j');
    expect(c.de('acaoIniciada')[0]).toMatchObject({ atorId: 'i0', habilidadeId: 'marca_de_area', alvoX: j.x, alvoY: j.y });
  });

  it('boss reveza golpe com as habilidades (área e invocação)', () => {
    const ctx = ctxCom(SALA_ABERTA, { boss: { hesitacaoS: 0.1 } });
    const c = cena(ctx, [5, 5], [['boss', 6, 5]]);
    const j = c.ent('j');
    j.autoAtaque = false;
    j.hp = j.hpMax = 100_000;
    c.rodar(ticksDe(15_000), () => c.de('acaoIniciada').length >= 4);
    const usadas = c.de('acaoIniciada').map((e) => e.habilidadeId);
    expect(usadas.slice(0, 4)).toEqual(['golpe_demoniaco', 'marca_de_area', 'golpe_demoniaco', 'invocar_lacaios']);
  });

  it('o jogador ataca sozinho quem o persegue, sem selecionar alvo', () => {
    const ctx = ctxCom(SALA_ABERTA, { goblin: { hesitacaoS: 0.1, deteccao: 6 } });
    const c = cena(ctx, [3, 5], [['goblin', 7, 5]]);
    c.rodar(ticksDe(10_000), () => c.de('acaoIniciada').some((e) => e.atorId === 'j'));
    expect(c.de('acaoIniciada').find((e) => e.atorId === 'j')).toMatchObject({ alvoId: 'i0' });
  });
});
