import { describe, expect, it } from 'vitest';
import type { Comando } from '../../src/core/comandos';
import { criarEntidade, criarEstado, type EstadoJogo } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import type { Fase } from '../../src/world/fase';
import { velocidade } from '../../src/world/movimento';
import { contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

function cenario(mapa: string[] = SALA_ABERTA, x = 5, y = 5, destreza = 10) {
  const fase: Fase = faseDeTexto(mapa);
  const estado = criarEstado({ semente: 1, faseId: fase.id });
  estado.entidades.push(criarEntidade({ id: 'j', tipo: 'jogador', x, y, atributos: { destreza } }));
  const ctx = contexto(fase);
  const eventos: EventoSimulacao[] = [];
  const jogador = () => {
    const j = estado.entidades[0];
    if (!j) throw new Error('sem jogador');
    return j;
  };
  const tick = (cmd?: Comando) => {
    simular(estado, ctx, cmd ? [{ tick: estado.tick, entidadeId: 'j', cmd }] : [], eventos, DT_MS);
  };
  const ticks = (n: number) => {
    for (let i = 0; i < n; i++) tick();
  };
  return { estado, eventos, jogador, tick, ticks };
}

const posicoes = (eventos: EventoSimulacao[]) =>
  eventos.flatMap((e) => (e.t === 'moveu' ? [[e.x, e.y] as const] : []));

describe('velocidade (§2.3)', () => {
  it('destreza 10 anda 2,5 células/s e destreza 20 anda 3,75', () => {
    expect(velocidade(10, 400)).toBeCloseTo(2.5);
    expect(velocidade(20, 400)).toBeCloseTo(3.75);
  });

  it('respeita os pisos de multiplicador e de velocidade', () => {
    expect(velocidade(-100, 400)).toBeCloseTo(0.5); // mult mínimo 0.2
    expect(velocidade(10, 400, true)).toBeCloseTo(3.25); // dominado ×1.3
  });

  it('no tick real, 24 ticks completam exatamente uma célula na destreza 10', () => {
    const c = cenario();
    c.tick({ t: 'mover', dir: 'E' });
    c.ticks(22);
    expect(c.jogador().x).toBe(5);
    c.ticks(1);
    expect(c.jogador().x).toBe(6);
  });

  it('destreza 20 percorre 3,75 células em 1 s', () => {
    const c = cenario(SALA_ABERTA, 1, 5, 20);
    c.tick({ t: 'mover', dir: 'E' });
    c.ticks(59);
    const j = c.jogador();
    expect(j.x).toBe(4);
    expect(j.progressoPasso).toBeCloseTo(0.75, 5);
  });
});

describe('movimento cardinal com entrada Dir8 (§2.3)', () => {
  it('diagonal alterna passos cardinais, começando por X', () => {
    const c = cenario();
    c.tick({ t: 'mover', dir: 'SE' });
    c.ticks(119);
    expect(posicoes(c.eventos).slice(0, 4)).toEqual([
      [6, 5],
      [6, 6],
      [7, 6],
      [7, 7],
    ]);
  });

  it('eixo bloqueado cede ao outro; ambos bloqueados param', () => {
    // Parede à direita: SE vira só S até o canto.
    const c = cenario(SALA_ABERTA, 10, 5);
    c.tick({ t: 'mover', dir: 'SE' });
    c.ticks(600);
    expect(c.jogador()).toMatchObject({ x: 10, y: 10, progressoPasso: 0 });
  });

  it('parar não cancela o passo em curso', () => {
    const c = cenario();
    c.tick({ t: 'mover', dir: 'E' });
    c.ticks(5);
    c.tick({ t: 'mover', dir: 'parado' });
    c.ticks(30);
    expect(c.jogador()).toMatchObject({ x: 6, destinoX: 6, progressoPasso: 0 });
  });

  it('trocar de direção abaixo de 50% do passo cancela o passo', () => {
    const c = cenario();
    c.tick({ t: 'mover', dir: 'E' });
    c.ticks(5); // ~25% do passo
    c.tick({ t: 'mover', dir: 'N' });
    expect(c.jogador()).toMatchObject({ x: 5, destinoX: 5, destinoY: 4 });
  });

  it('trocar de direção acima de 50% termina o passo antes de virar', () => {
    const c = cenario();
    c.tick({ t: 'mover', dir: 'E' });
    c.ticks(15); // ~67% do passo
    c.tick({ t: 'mover', dir: 'N' });
    c.ticks(40);
    expect(posicoes(c.eventos)[0]).toEqual([6, 5]);
    expect(c.jogador().y).toBeLessThan(5);
  });

  it('virar para uma diagonal que começa pela mesma célula não cancela o passo', () => {
    const c = cenario();
    c.tick({ t: 'mover', dir: 'E' });
    c.ticks(5);
    const antes = c.jogador().progressoPasso;
    c.tick({ t: 'mover', dir: 'SE' });
    expect(c.jogador().destinoX).toBe(6);
    expect(c.jogador().progressoPasso).toBeGreaterThan(antes);
  });

  it('o relógio de caminhada avança por distância, não por tempo', () => {
    const c = cenario();
    c.ticks(120);
    expect(c.jogador().relogioAndar).toBe(0);
    c.tick({ t: 'mover', dir: 'E' });
    c.ticks(23);
    expect(c.jogador().relogioAndar).toBeCloseTo(400, 3);
  });
});

describe('irPara e fila de waypoints', () => {
  it('segue o caminho até o destino com no máximo 2 waypoints na fila', () => {
    const c = cenario();
    c.tick({ t: 'irPara', x: 9, y: 8 });
    let maiorFila = 0;
    for (let i = 0; i < 600; i++) {
      c.tick();
      maiorFila = Math.max(maiorFila, c.jogador().waypoints.length);
    }
    expect(c.jogador()).toMatchObject({ x: 9, y: 8 });
    expect(maiorFila).toBeLessThanOrEqual(2);
  });

  it('destino inalcançável gera evento e não move', () => {
    const c = cenario();
    c.tick({ t: 'irPara', x: 0, y: 0 });
    c.ticks(60);
    expect(c.jogador()).toMatchObject({ x: 5, y: 5 });
    expect(c.eventos).toContainEqual({ t: 'caminhoFalhou', tick: 0, id: 'j', status: 'inacessivel' });
  });

  it('entrada direcional cancela o caminho do irPara', () => {
    const c = cenario();
    c.tick({ t: 'irPara', x: 9, y: 5 });
    c.ticks(30);
    c.tick({ t: 'mover', dir: 'S' });
    expect(c.jogador().caminho).toEqual([]);
    expect(c.jogador().waypoints).toEqual([]);
  });
});

describe('colisão na integração', () => {
  function doisInimigos(estado: EstadoJogo) {
    estado.entidades.length = 0;
    estado.entidades.push(criarEntidade({ id: 'a', tipo: 'inimigo', x: 3, y: 5 }));
    estado.entidades.push(criarEntidade({ id: 'b', tipo: 'inimigo', x: 7, y: 5 }));
  }

  it('dois inimigos indo para a mesma célula nunca a dividem', () => {
    const c = cenario();
    doisInimigos(c.estado);
    const comandos = [
      { tick: 0, entidadeId: 'a', cmd: { t: 'mover', dir: 'E' } as Comando },
      { tick: 0, entidadeId: 'b', cmd: { t: 'mover', dir: 'O' } as Comando },
    ];
    simular(c.estado, contexto(faseDeTexto(SALA_ABERTA)), comandos, c.eventos, DT_MS);
    for (let i = 0; i < 300; i++) simular(c.estado, contexto(faseDeTexto(SALA_ABERTA)), [], c.eventos, DT_MS);
    const [a, b] = c.estado.entidades;
    expect(a && b && Math.abs(a.x - b.x)).toBe(1);
  });

  it('jogador atravessa inimigo pela regra padrão do modo', () => {
    const c = cenario();
    c.estado.entidades.push(criarEntidade({ id: 'i', tipo: 'inimigo', x: 6, y: 5 }));
    c.tick({ t: 'mover', dir: 'E' });
    c.ticks(60);
    expect(c.jogador().x).toBeGreaterThan(6);
  });
});
