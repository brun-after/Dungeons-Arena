// Marco 40 (13/11/2026, D-164): o movimento da classe — o alcance que cresce com o nível, as viagens limitadas por
// espaço e tempo (o bônus sai ao atacar ou ser atingido), o salto do Guerreiro, os telhados, a imunidade ao chão e o
// Posto dos Mortos.
import { describe, expect, it } from 'vitest';
import { fonteDaHabilidade } from '../../src/combat/acao';
import { aplicarImpacto } from '../../src/combat/golpe';
import { alcanceNoNivel, fatorDeVelocidade, movimentoAtivo, movimentosLiberados, noAr, parametros, postoDormente } from '../../src/combat/movimento-classe';
import { habilidadeDoAtor } from '../../src/combat/perfil';
import { lerComando } from '../../src/arena/protocolo';
import type { Comando } from '../../src/core/comandos';
import { criarEstado } from '../../src/core/estado';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { DT_MS } from '../../src/core/loop';
import { simular } from '../../src/core/simulacao';
import { clonarEntidade, posicionar, type Entidade } from '../../src/entities/entidade';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { carregarFase } from '../../src/world/fase';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const obter = <T,>(v: T | undefined | null): T => {
  if (v === undefined || v === null) throw new Error('ausente');
  return v;
};
const ctx = contexto(faseDeTexto(SALA_ABERTA));
const viagem = 1 + ctx.balance.movimentoClasse.viagemPct / 100;

function cena(classe: string, nivel = 1, c = ctx) {
  const estado = criarEstado({ semente: 3, faseId: c.fase.id });
  const j = criarJogador(obter(CONTEUDO.classes.get(classe)), 'j', 2, 5, c.balance);
  j.nivel = nivel;
  estado.entidades.push(j);
  const eventos: EventoSimulacao[] = [];
  const passo = (cmds: Comando[] = [], ms = DT_MS) => {
    for (let t = 0; t < ms; t += DT_MS) {
      simular(estado, c, t === 0 ? cmds.map((cmd) => ({ tick: estado.tick, entidadeId: 'j', cmd })) : [], eventos, DT_MS);
    }
  };
  const orc = (x: number, y: number) => {
    const o = criarInimigo(obter(CONTEUDO.presets.get('orc')), `o${x}${y}`, x, y, c.balance);
    estado.entidades.push(o);
    return o;
  };
  return { estado, j, eventos, passo, orc };
}
const modo = (e: Entidade) => e.movimentoClasse?.modo?.tipo;
const golpear = (c: ReturnType<typeof cena>, alvo: Entidade, de: Entidade) => {
  const hab = obter(habilidadeDoAtor(ctx, de, de.ataqueBasico));
  aplicarImpacto(c.estado, ctx, alvo, { acaoId: 1, fonte: { ...fonteDaHabilidade(de, ctx, 0, hab), d20Minimo: 20 }, hab, indice: 0 }, c.eventos);
  return hab;
};

describe('movimento da classe (D-164)', () => {
  it('três mecânicas por classe, todas no nível 1 (D-167); a de longa distância cobre 10 células no 1 e 20 no 100', () => {
    for (const classe of ['mago', 'arqueiro', 'guerreiro', 'necromante', 'aventureiro']) {
      const lista = obter(CONTEUDO.movimentos.get(classe));
      // Marco 40 (14/11/2026): as três liberadas desde o nível 1 (D-167); as do Aventureiro são as dos companheiros.
      expect(lista.map((m) => m.nivel)).toEqual([1, 1, 1]);
      const longa = obter(lista[0]);
      expect(['voo', 'tirolesa', 'salto', 'nevoa', 'montaria']).toContain(longa.tipo);
      expect(alcanceNoNivel(parametros(longa, 1), 1)).toBe(10);
      expect(alcanceNoNivel(parametros(longa, 55), 55)).toBe(15);
      expect(alcanceNoNivel(parametros(longa, 100), 100)).toBe(20);
    }
    const { j, passo } = cena('mago', 1);
    expect(movimentosLiberados(ctx, j)).toHaveLength(3);
    expect(movimentoAtivo(ctx, j)?.id).toBe('voo_arcano');
    passo([{ t: 'trocarMovimento' }]);
    expect(movimentoAtivo(ctx, j)?.id).toBe('piscar');
  });

  it('o Voo Arcano dura o tempo de andar o alcance, sem limite de dano, e perde a velocidade ao atacar', () => {
    const c = cena('mago');
    const { j, eventos, passo } = c;
    passo([{ t: 'movimentoClasse' }]);
    expect(modo(j)).toBe('voo');
    expect(noAr(j)).toBe(true);
    expect(fatorDeVelocidade(ctx, j)).toBeCloseTo(viagem);
    const m = obter(j.movimentoClasse?.modo);
    const duracaoS = ((m.ateTick ?? 0) - m.desdeTick) * DT_MS / 1000;
    expect(duracaoS).toBeGreaterThan(1);
    expect(duracaoS).toBeLessThan(6);
    c.orc(4, 5);
    passo([{ t: 'ataqueBasico', alvo: 'o45' }]);
    expect(eventos.some((e) => e.t === 'acaoRecusada' && e.motivo === 'movimento')).toBe(false);
    passo([], 1500);
    expect(eventos.some((e) => e.t === 'movimentoClasse' && e.fase === 'perdeu')).toBe(true);
    expect(fatorDeVelocidade(ctx, j)).toBe(1);
    passo([], 6000);
    expect(modo(j)).toBeUndefined();
  });

  it('o golpe de perto, do chão, não alcança quem voa', () => {
    const c = cena('mago');
    const o = c.orc(3, 5);
    c.j.movimentoClasse = { ativo: 'voo_arcano', cargas: {}, modo: { tipo: 'voo', id: 'voo_arcano', desdeTick: 0, ateTick: 9999 } };
    const hp = c.j.hp;
    expect(golpear(c, c.j, o).politicaImpacto).toBe('contato');
    expect(c.j.hp).toBe(hp);
    expect(c.eventos.some((e) => e.t === 'esquivou')).toBe(true);
  });

  it('voando, sobe no telhado; não pousa lá, e quando o voo acaba desce fora dele', () => {
    const mapa = ['##########', '#........#', '#...##...#', '#...##...#', '#........#', '##########'];
    const fase = carregarFase({ id: 't', nome: 't', ordem: 1, tipo: 'campanha', mapa, spawns: [{ x: 1, y: 1 }], telhados: [{ x: 4, y: 2, largura: 2, altura: 2, revela: 'perto', estilo: 'telha' }] });
    const c = contexto(fase);
    const { j, eventos, passo } = cena('mago', 1, c);
    j.movimentoClasse = { ativo: 'voo_arcano', cargas: {}, modo: { tipo: 'voo', id: 'voo_arcano', desdeTick: 0, ateTick: 99_999 } };
    posicionar(j, 2, 2);
    passo([{ t: 'mover', dir: 'E', dx: 1000, dy: 0 }], 500);
    passo([{ t: 'mover', dir: 'parado' }]);
    expect(j.x).toBeGreaterThanOrEqual(4);
    expect(j.x).toBeLessThanOrEqual(5);
    passo([{ t: 'movimentoClasse' }]);
    expect(modo(j)).toBe('voo');
    expect(eventos.some((e) => e.t === 'movimentoClasse' && e.motivo === 'pouso')).toBe(true);
    obter(obter(j.movimentoClasse).modo).ateTick = 0;
    passo();
    expect(modo(j)).toBeUndefined();
    expect(fase.celulas[j.y * fase.largura + j.x]).not.toBe(fase.celulas[2 * fase.largura + 4]);
  });

  it('a Tirolesa corre reta, não muda de rumo e para na parede', () => {
    const { j, passo } = cena('arqueiro');
    passo([{ t: 'movimentoClasse', dx: 1000, dy: 0 }]);
    expect(modo(j)).toBe('tirolesa');
    passo([{ t: 'mover', dir: 'S', dx: 0, dy: 1000 }], 200);
    expect(j.y).toBe(5);
    passo([{ t: 'mover', dir: 'parado' }], 1500);
    expect(modo(j)).toBeUndefined();
    expect(j.x).toBe(10);
    expect(j.y).toBe(5);
  });

  it('o Salto de Guerra cai o mais longe que cabe e atordoa os inimigos em volta da queda', () => {
    const c = cena('guerreiro');
    const perto = c.orc(9, 4);
    const longe = c.orc(5, 9);
    c.passo([{ t: 'movimentoClasse', dx: 1000, dy: 0 }]);
    expect(modo(c.j)).toBe('salto');
    expect(noAr(c.j)).toBe(true);
    c.passo([], 1000);
    expect(modo(c.j)).toBeUndefined();
    expect(c.j.x).toBe(10);
    expect(perto.efeitos.some((f) => f.tipo === 'atordoar')).toBe(true);
    expect(longe.efeitos.some((f) => f.tipo === 'atordoar')).toBe(false);
  });

  it('o Lobo perde a velocidade ao ser atingido; o Urso, montaria pesada, não', () => {
    const lobo = cena('aventureiro');
    obter(lobo.j.bolsa).pet = 'lobo';
    lobo.passo([{ t: 'movimentoClasse' }]);
    expect(modo(lobo.j)).toBe('montado');
    expect(fatorDeVelocidade(ctx, lobo.j)).toBeCloseTo(viagem);
    golpear(lobo, lobo.j, lobo.orc(3, 5));
    expect(modo(lobo.j)).toBe('montado');
    expect(fatorDeVelocidade(ctx, lobo.j)).toBe(1);

    const urso = cena('aventureiro', 25);
    obter(urso.j.bolsa).pet = 'urso';
    urso.passo([{ t: 'movimentoClasse' }]);
    expect(urso.j.movimentoClasse?.modo?.pesada).toBe(true);
    golpear(urso, urso.j, urso.orc(3, 5));
    expect(fatorDeVelocidade(ctx, urso.j)).toBeCloseTo(1 + ctx.balance.movimentoClasse.viagemPesadaPct / 100);
  });

  it('o movimento do Aventureiro é o do companheiro ativo: o falcão o leva voando; o G não troca; trocar de companheiro encerra', () => {
    const c = cena('aventureiro');
    expect(movimentoAtivo(ctx, c.j)?.id).toBe('falcao_carrega');
    c.passo([{ t: 'trocarMovimento' }]);
    expect(movimentoAtivo(ctx, c.j)?.id).toBe('falcao_carrega');
    c.passo([{ t: 'movimentoClasse' }]);
    expect(modo(c.j)).toBe('voo');
    obter(c.j.bolsa).pet = 'urso';
    expect(movimentoAtivo(ctx, c.j)?.id).toBe('urso');
    c.passo([], 100);
    expect(modo(c.j)).toBeUndefined();
  });

  it('a Forma de Névoa deixa intocável; o clone copia o estado; a rede aceita os comandos', () => {
    const { j, passo } = cena('necromante');
    passo([{ t: 'movimentoClasse' }]);
    expect(modo(j)).toBe('nevoa');
    expect(j.efeitos.some((f) => f.tipo === 'imune_dano')).toBe(true);
    const copia = clonarEntidade(j);
    obter(copia.movimentoClasse).cargas['forma_de_nevoa']?.push(99);
    expect(obter(j.movimentoClasse).cargas['forma_de_nevoa']).toHaveLength(1);
    expect(lerComando({ t: 'movimentoClasse', dx: 1000, dy: -1000 })).toEqual({ t: 'movimentoClasse', dx: 1000, dy: -1000 });
    expect(lerComando({ t: 'movimentoClasse' })).toEqual({ t: 'movimentoClasse' });
    expect(lerComando({ t: 'movimentoClasse', dx: 5000, dy: 0 })).toBeNull();
    expect(lerComando({ t: 'trocarMovimento' })).toEqual({ t: 'trocarMovimento' });
  });

  it('o Posto dos Mortos deixa o servo parado e oculto longe do Necromante; usar de novo troca de corpo com ele', () => {
    const c = cena('necromante', 20);
    c.passo([], 1500);
    const servo = obter(c.estado.entidades.find((e) => e.invocacao?.donoId === 'j' && e.invocacao.necromancia));
    c.passo([{ t: 'trocarMovimento' }]);
    c.passo([{ t: 'trocarMovimento' }]);
    expect(movimentoAtivo(ctx, c.j)?.id).toBe('posto_dos_mortos');
    c.passo([{ t: 'movimentoClasse' }]);
    const posto = obter(servo.invocacao?.posto);
    posicionar(c.j, 10, 10);
    posicionar(servo, 1, 1);
    obter(servo.invocacao).posto = { x: 1, y: 1 };
    c.passo([], 600);
    expect(postoDormente(c.estado, ctx, servo)).toBe(true);
    expect(servo.x).toBe(1);
    expect(servo.invisivelAteTick).toBeGreaterThan(c.estado.tick);
    expect(posto).toBeDefined();
    c.passo([], 4000);
    c.passo([{ t: 'movimentoClasse' }]);
    expect(c.j.x).toBe(1);
    expect(c.j.y).toBe(1);
    expect(servo.invocacao?.posto).toBeUndefined();
  });
});
