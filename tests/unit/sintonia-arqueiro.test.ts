// Marco 24 (24/10/2026, D-095): a sintonia do Arqueiro (Mira firme e tiro cheio) e as vertentes dele.
import { describe, expect, it } from 'vitest';
import { aplicarEfeito } from '../../src/combat/efeitos';
import { fracaoMira } from '../../src/combat/mira';
import { habilidadeDoAtor } from '../../src/combat/perfil';
import { construirEfeito } from '../../src/combat/registro-efeitos';
import { miraDaGeral, miraProtegida, processarMiras } from '../../src/combat/sintonia-arqueiro';
import { lerComando } from '../../src/arena/protocolo';
import { criarEstado } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

function obter<T>(v: T | undefined | null, nome = 'valor'): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

function cena(gerais: (string | null)[] = [], alvos: [number, number][] = [[6, 5]]) {
  const ctx = contexto(faseDeTexto(SALA_ABERTA));
  const estado = criarEstado({ semente: 11, faseId: 'teste' });
  const j = criarJogador(obter(CONTEUDO.classes.get('arqueiro')), 'j', 2, 5, ctx.balance);
  j.nivel = 10;
  const bolsa = obter(j.bolsa);
  gerais.forEach((id, i) => {
    if (id && !bolsa.conhecidas.some((c) => c.id === id)) bolsa.conhecidas.push({ id, rank: 1, caminhos: [] });
    bolsa.barra[2 + i] = id;
  });
  j.habilidades = bolsa.barra.filter((id): id is string => id !== null);
  j.autoAtaque = false;
  estado.entidades.push(j);
  const bonecos = alvos.map(([x, y], i) => {
    const b = criarInimigo(obter(CONTEUDO.presets.get('boneco')), `b${i}`, x, y, ctx.balance);
    b.hp = b.hpMax = 5000;
    estado.entidades.push(b);
    return b;
  });
  const eventos: EventoSimulacao[] = [];
  const tick = (cmd?: Parameters<typeof lerComando>[0]) => {
    simular(estado, ctx, cmd ? [{ tick: estado.tick, entidadeId: 'j', cmd: obter(lerComando(cmd)) }] : [], eventos, DT_MS);
  };
  /** Mira cheia e um tiro no primeiro boneco, até o projétil (e os ricochetes) acabarem. */
  const tiroCheio = () => {
    j.mira = { desdeTick: estado.tick - 100_000 };
    tick({ t: 'ataqueBasico', alvo: 'b0' });
    for (let i = 0; i < 200; i++) {
      tick();
      if (eventos.some((e) => e.t === 'projetilFim') && estado.projeteis.length === 0) break;
    }
    expect(eventos.some((e) => e.t === 'tiroCarregado')).toBe(true);
  };
  const tem = (e: { efeitos: { tipo: string; ateTick: number }[] }, tipo: string) => e.efeitos.some((f) => f.tipo === tipo && f.ateTick > estado.tick);
  return { ctx, estado, j, bonecos, eventos, tick, tiroCheio, tem };
}

describe('sintonia do Arqueiro (D-095)', () => {
  it('as 9 famílias do Arqueiro e as 3 vertentes têm mecânica nos dados', () => {
    expect(Object.keys(obter(CONTEUDO.sintonia.efeitosDaClasse.arqueiro))).toHaveLength(9);
    for (const v of CONTEUDO.sintonia.vertentes.filter((x) => x.classe === 'arqueiro')) expect(CONTEUDO.sintonia.efeitosDaVertente[v.id]?.length).toBeGreaterThan(0);
  });

  it('técnica: a geral técnica que fere enche 25% da Mira', () => {
    const c = cena(['golpe_atordoante']);
    c.j.mira = { desdeTick: 0 };
    miraDaGeral(c.ctx, c.j, obter(habilidadeDoAtor(c.ctx, c.j, 'golpe_atordoante')), 0);
    expect(fracaoMira(c.ctx, c.j, 0)).toBeCloseTo(0.25, 1);
    miraDaGeral(c.ctx, c.j, obter(habilidadeDoAtor(c.ctx, c.j, 'bola_de_fogo')), 0);
    expect(fracaoMira(c.ctx, c.j, 0)).toBeCloseTo(0.25, 1);
  });

  it('suporte: com escudo, levar dano não zera a Mira', () => {
    const c = cena(['barreira']);
    expect(miraProtegida(c.ctx, c.j, 0)).toBe(false);
    aplicarEfeito(c.estado, c.ctx, c.j, construirEfeito('escudo', { valor: 10, duracaoMs: 5000 }), { id: 'j', x: 2, y: 5 }, null, c.eventos);
    expect(miraProtegida(c.ctx, c.j, 0)).toBe(true);
  });

  it('psíquico: o tiro cheio silencia', () => {
    const c = cena(['agulha_mental']);
    c.tiroCheio();
    expect(c.tem(obter(c.bonecos[0]), 'silenciar')).toBe(true);
  });

  it('veneno e terra: o veneno do alvo passa aos atravessados e o último é enraizado', () => {
    const c = cena(['flecha_venenosa', 'estaca_de_pedra'], [[5, 5], [7, 5]]);
    const [b0, b1] = c.bonecos.map((b) => obter(b));
    aplicarEfeito(c.estado, c.ctx, obter(b0), construirEfeito('envenenado', { valor: 2, duracaoMs: 8000 }), { id: 'j', x: 2, y: 5 }, null, c.eventos);
    c.tiroCheio();
    expect(c.tem(obter(b1), 'envenenado')).toBe(true);
    expect(c.tem(obter(b1), 'enraizado')).toBe(true);
    expect(c.tem(obter(b0), 'enraizado')).toBe(false);
  });

  it('arcana: o tiro cheio vira mágico e ricocheteia no hostil mais perto', () => {
    const c = cena(['seta_arcana'], [[6, 5], [6, 8]]);
    c.tiroCheio();
    expect(c.eventos.some((e) => e.t === 'impacto' && e.alvoId === 'b1')).toBe(true);
  });

  it('fogo: o tiro cheio deixa fogo na linha', () => {
    const c = cena(['bola_de_fogo']);
    c.tiroCheio();
    expect(c.estado.rastros.filter((r) => r.donoId === 'j').length).toBeGreaterThan(2);
  });

  it('sagrado: o tiro cheio cura os aliados que atravessa', () => {
    const c = cena(['lanca_radiante']);
    const aliado = criarJogador(obter(CONTEUDO.classes.get('mago')), 'a', 4, 5, c.ctx.balance);
    aliado.hp = 1;
    c.estado.entidades.push(aliado);
    c.tiroCheio();
    expect(aliado.hp).toBeGreaterThan(1);
  });

  it('sombra: invisível, a Mira enche no dobro da velocidade', () => {
    const c = cena(['passo_sombrio']);
    c.j.mira = { desdeTick: 0 };
    c.j.invisivelAteTick = 1000;
    processarMiras(c.estado, c.ctx, c.eventos);
    expect(c.j.mira.desdeTick).toBe(-1);
  });

  it('Sentinela: parado com a Mira cheia, escudo em você a cada segundo', () => {
    const c = cena(['estaca_de_pedra', 'abalo_sismico', 'lanca_radiante', 'chuva_de_estrelas']);
    c.j.mira = { desdeTick: -100_000 };
    processarMiras(c.estado, c.ctx, c.eventos);
    expect(c.tem(c.j, 'escudo_acumulado')).toBe(true);
  });

  it('Caçador noturno: o tiro cheio invisível dobra o veneno do alvo', () => {
    const c = cena(['punhal_das_sombras', 'passo_sombrio', 'flecha_venenosa', 'dardo_toxico']);
    const b0 = obter(c.bonecos[0]);
    aplicarEfeito(c.estado, c.ctx, b0, construirEfeito('envenenado', { valor: 2, duracaoMs: 8000 }), { id: 'j', x: 2, y: 5 }, null, c.eventos);
    c.j.invisivelAteTick = 100_000;
    c.tiroCheio();
    expect(b0.efeitos.find((f) => f.tipo === 'envenenado')?.valor).toBeGreaterThanOrEqual(4);
  });
});
