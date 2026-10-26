// Movimento (§2.3). Marco 26 (25/10/2026, D-104): livre — posição contínua em qualquer ângulo, corpo redondo que
// desliza nas paredes e em volta de quem bloqueia, irPara em trechos retos; a célula é o arredondamento da posição.
import { describe, expect, it } from 'vitest';
import type { Comando } from '../../src/core/comandos';
import { criarEntidade, criarEstado, type EstadoJogo } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import { corpoCabe } from '../../src/world/corpo';
import type { Fase } from '../../src/world/fase';
import { integrarEntidade, velocidade } from '../../src/world/movimento';
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
  return { estado, ctx, eventos, jogador, tick, ticks };
}

const RAIO = contexto(faseDeTexto(SALA_ABERTA)).balance.movimento.raioCorpo;

/** Sala com um pilar no meio (o canto que o caminho precisa contornar). */
const SALA_PILAR = [
  '############',
  '#..........#',
  '#..........#',
  '#..........#',
  '#....##....#',
  '#....##....#',
  '#....##....#',
  '#..........#',
  '#..........#',
  '#..........#',
  '#..........#',
  '############',
];

describe('velocidade (§2.3)', () => {
  it('destreza 10 anda 2,5 células/s e destreza 20 anda 3,75', () => {
    expect(velocidade(10, 400)).toBeCloseTo(2.5);
    expect(velocidade(20, 400)).toBeCloseTo(3.75);
  });

  it('respeita os pisos de multiplicador e de velocidade', () => {
    expect(velocidade(-100, 400)).toBeCloseTo(0.5); // mult mínimo 0.2
    expect(velocidade(10, 400, true)).toBeCloseTo(3.25); // dominado ×1.3
  });

  it('em 1 s para leste, a destreza 10 anda 2,5 células e a célula acompanha', () => {
    const c = cenario(SALA_ABERTA, 2, 5);
    c.tick({ t: 'mover', dir: 'E' });
    c.ticks(59);
    expect(c.jogador().px).toBeCloseTo(4.5, 5);
    expect(c.jogador().py).toBe(5);
    expect(c.jogador().x).toBe(Math.round(c.jogador().px));
  });
});

describe('movimento livre (marco 26)', () => {
  it('a diagonal anda em linha reta, na mesma velocidade', () => {
    const c = cenario(SALA_ABERTA, 2, 2);
    c.tick({ t: 'mover', dir: 'SE' });
    c.ticks(59);
    const j = c.jogador();
    expect(j.px - 2).toBeCloseTo(j.py - 2, 9);
    expect(Math.sqrt((j.px - 2) ** 2 + (j.py - 2) ** 2)).toBeCloseTo(2.5, 5);
  });

  it('o vetor exato anda em qualquer ângulo (aqui 2:1)', () => {
    const c = cenario(SALA_ABERTA, 2, 2);
    c.tick({ t: 'mover', dir: 'SE', dx: 1000, dy: 500 });
    c.ticks(59);
    const j = c.jogador();
    expect((j.px - 2) / (j.py - 2)).toBeCloseTo(2, 6);
    expect(j.direcao).toBe('SE'); // 26,6° cai no octante SE
  });

  it('desliza na parede: a diagonal contra a parede vira o eixo livre', () => {
    // Parede à direita (x = 11): SE desce rente a ela até o canto.
    const c = cenario(SALA_ABERTA, 10, 5);
    c.tick({ t: 'mover', dir: 'SE' });
    c.ticks(600);
    expect(c.jogador()).toMatchObject({ x: 10, y: 10 });
    expect(c.jogador().px).toBeCloseTo(10.5 - RAIO, 3);
  });

  it('nem em velocidade alta o corpo atravessa a parede', () => {
    const c = cenario(SALA_ABERTA, 8, 5, 400);
    const j = c.jogador();
    c.tick({ t: 'mover', dir: 'E' });
    for (let i = 0; i < 5; i++) integrarEntidade(j, c.estado, c.ctx, c.eventos, 1000);
    expect(j.px).toBeLessThanOrEqual(10.5 - RAIO + 1e-9);
    expect(corpoCabe(c.ctx.fase, j.px, j.py, RAIO)).toBe(true);
  });

  it('parar para na hora, onde estiver', () => {
    const c = cenario();
    c.tick({ t: 'mover', dir: 'E' });
    c.ticks(5);
    const px = c.jogador().px;
    c.tick({ t: 'mover', dir: 'parado' });
    c.ticks(30);
    expect(c.jogador().px).toBe(px);
    expect(c.jogador().px).toBeGreaterThan(5);
    expect(c.jogador().px).toBeLessThan(5.5);
  });

  it('o relógio de caminhada avança por distância, não por tempo', () => {
    const c = cenario();
    c.ticks(120);
    expect(c.jogador().relogioAndar).toBe(0);
    c.tick({ t: 'mover', dir: 'E' });
    c.ticks(23);
    expect(c.jogador().relogioAndar).toBeCloseTo(400, 3);
  });

  it('mudar só a célula (teletransporte escrito direto) leva a posição contínua junto', () => {
    const c = cenario();
    Object.assign(c.jogador(), { x: 8, y: 3 });
    c.tick();
    expect(c.jogador()).toMatchObject({ px: 8, py: 3 });
  });
});

describe('irPara em trechos retos', () => {
  it('a diagonal sai num trecho só, sem escadinha, e chega ao destino', () => {
    const c = cenario();
    c.tick({ t: 'irPara', x: 9, y: 8 });
    expect([...c.jogador().waypoints, ...c.jogador().caminho]).toHaveLength(1);
    let maiorFila = 0;
    const rumos = new Set<string>();
    let antes = { x: c.jogador().px, y: c.jogador().py };
    for (let i = 0; i < 600; i++) {
      c.tick();
      const j = c.jogador();
      maiorFila = Math.max(maiorFila, j.waypoints.length);
      const dx = j.px - antes.x;
      const dy = j.py - antes.y;
      if (dx !== 0 || dy !== 0) rumos.add((dy / dx).toFixed(3));
      antes = { x: j.px, y: j.py };
    }
    expect(c.jogador()).toMatchObject({ x: 9, y: 8 });
    expect(rumos.size).toBe(1);
    expect(maiorFila).toBeLessThanOrEqual(2);
  });

  it('o ponto tocado com fração é o fim do caminho', () => {
    const c = cenario();
    c.tick({ t: 'irPara', x: 8.3, y: 6.7 });
    c.ticks(300);
    expect(c.jogador().px).toBeCloseTo(8.3, 1);
    expect(c.jogador().py).toBeCloseTo(6.7, 1);
  });

  it('contorna o pilar sem encostar nele e com poucas mudanças de rumo', () => {
    const c = cenario(SALA_PILAR, 3, 5);
    c.tick({ t: 'irPara', x: 9, y: 5 });
    expect(c.jogador().caminho.length + c.jogador().waypoints.length).toBeLessThanOrEqual(3);
    for (let i = 0; i < 600; i++) {
      c.tick();
      const j = c.jogador();
      expect(corpoCabe(c.ctx.fase, j.px, j.py, RAIO)).toBe(true);
    }
    expect(c.jogador()).toMatchObject({ x: 9, y: 5 });
  });

  // Marco 26 (26/10/2026, D-114): o clique do jogador nunca se perde.
  it('clique na parede vai à célula livre mais perto dele, sem caminhoFalhou', () => {
    const c = cenario();
    c.tick({ t: 'irPara', x: 0, y: 0 });
    c.ticks(120);
    expect(c.jogador()).toMatchObject({ x: 1, y: 1 });
    expect(c.eventos.some((e) => e.t === 'caminhoFalhou')).toBe(false);
  });

  it('clique fora do mapa anda até a borda naquela direção', () => {
    const c = cenario();
    c.tick({ t: 'irPara', x: -30, y: 5 });
    c.ticks(120);
    expect(c.jogador()).toMatchObject({ x: 1, y: 5 });
  });

  it('já na célula mais perto, anda reto na direção do clique até encostar', () => {
    const c = cenario(SALA_ABERTA, 1, 5);
    const x0 = c.jogador().px;
    c.tick({ t: 'irPara', x: -5, y: 5.2 });
    c.ticks(40);
    expect(c.jogador().px).toBeLessThan(x0);
    expect(c.jogador().x).toBe(1);
    expect(c.eventos.some((e) => e.t === 'caminhoFalhou')).toBe(false);
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

  it('dois inimigos indo um contra o outro param a dois raios, sem se sobrepor', () => {
    const c = cenario();
    doisInimigos(c.estado);
    const comandos = [
      { tick: 0, entidadeId: 'a', cmd: { t: 'mover', dir: 'E' } as Comando },
      { tick: 0, entidadeId: 'b', cmd: { t: 'mover', dir: 'O' } as Comando },
    ];
    simular(c.estado, c.ctx, comandos, c.eventos, DT_MS);
    for (let i = 0; i < 300; i++) simular(c.estado, c.ctx, [], c.eventos, DT_MS);
    const [a, b] = c.estado.entidades;
    if (!a || !b) throw new Error('sem inimigos');
    expect(b.px - a.px).toBeGreaterThanOrEqual(2 * RAIO - 1e-9);
    expect(b.px - a.px).toBeLessThan(2 * RAIO + 0.25);
  });

  it('o corpo desliza em volta de quem bloqueia, em vez de parar', () => {
    const c = cenario();
    doisInimigos(c.estado);
    const [a, b] = c.estado.entidades;
    if (!a || !b) throw new Error('sem inimigos');
    // `b` parado um pouco abaixo da linha de `a`: `a` encosta e escorrega por cima dele.
    Object.assign(b, { x: 5, y: 5, px: 5, py: 5.2 });
    simular(c.estado, c.ctx, [{ tick: 0, entidadeId: 'a', cmd: { t: 'mover', dir: 'E' } }], c.eventos, DT_MS);
    for (let i = 0; i < 200; i++) simular(c.estado, c.ctx, [], c.eventos, DT_MS);
    expect(a.px).toBeGreaterThan(6);
  });

  it('jogador atravessa inimigo pela regra padrão do modo', () => {
    const c = cenario();
    c.estado.entidades.push(criarEntidade({ id: 'i', tipo: 'inimigo', x: 6, y: 5 }));
    c.tick({ t: 'mover', dir: 'E' });
    c.ticks(60);
    expect(c.jogador().x).toBeGreaterThan(6);
  });
});
