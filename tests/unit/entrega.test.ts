// Marco 49 (21/11/2026, D-194): o motor de entrega — a rota paramétrica, a leitura da `entrega` e cada eixo no
// núcleo: a parábola que passa por cima, a salva, o par convergente, o céu, o feixe com exposição, o giro no alvo, o
// chão amaldiçoado, o sentido de volta e os grãos.
import { describe, expect, it } from 'vitest';
import { fonteDaHabilidade } from '../../src/combat/acao';
import { processarCanais } from '../../src/combat/entrega/canal';
import { lancarEntrega } from '../../src/combat/entrega/lancar';
import { comprimento, pontoEm, type Rota, type TipoRota } from '../../src/combat/entrega/rota';
import { ENTREGA_PADRAO, lerEntrega, type Entrega } from '../../src/combat/entrega/tipos';
import { resolverHabilidade } from '../../src/combat/compilar-habilidade';
import type { DefinicaoHabilidade, Habilidade } from '../../src/combat/habilidades';
import { moverProjeteis } from '../../src/combat/projeteis';
import { processarSolos } from '../../src/combat/solos';
import type { Conteudo } from '../../src/core/conteudo';
import { criarEstado, type EstadoJogo } from '../../src/core/estado';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { DT_MS } from '../../src/core/loop';
import { Leitor } from '../../src/core/validar';
import type { Entidade } from '../../src/entities/entidade';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const obter = <T,>(v: T | undefined | null): T => {
  if (v === undefined || v === null) throw new Error('ausente');
  return v;
};

function rota(tipo: TipoRota, extra: Partial<Rota> = {}): Rota {
  const r: Rota = { tipo, ox: 2, oy: 5, dx: 9, dy: 5, semente: 42, lado: 1, altura: 1.5, largura: 1.2, voltas: 3, giro: 0.35, desvio: 0, comp: 0, ...extra };
  r.comp = comprimento(r);
  return r;
}

describe('a rota (pontoEm)', () => {
  it('cada trajetória sai da origem e chega no destino, no chão', () => {
    for (const tipo of ['reta', 'parabola', 'espiral', 'convergente', 'caotica'] as const) {
      const r = rota(tipo);
      expect(pontoEm(r, 0), tipo).toEqual({ x: 2, y: 5, z: 0 });
      const fim = pontoEm(r, 1);
      expect(fim.x, tipo).toBeCloseTo(9);
      expect(fim.y, tipo).toBeCloseTo(5);
      expect(fim.z, tipo).toBeCloseTo(0);
    }
  });

  it('a parábola sobe no meio; a convergente e a caótica saem da linha; a queda desce até o chão', () => {
    expect(pontoEm(rota('parabola'), 0.5).z).toBeCloseTo(1.5);
    expect(Math.abs(pontoEm(rota('convergente'), 0.5).y - 5)).toBeGreaterThan(0.5);
    expect(pontoEm(rota('convergente', { lado: -1 }), 0.5).y - 5).toBeCloseTo(-(pontoEm(rota('convergente'), 0.5).y - 5));
    const caotica = [0.2, 0.4, 0.6, 0.8].map((t) => pontoEm(rota('caotica'), t).y - 5);
    expect(caotica.some((v) => Math.abs(v) > 0.1)).toBe(true);
    expect(pontoEm(rota('queda', { altura: 6 }), 0).z).toBe(6);
    expect(pontoEm(rota('queda', { altura: 6 }), 1)).toEqual({ x: 9, y: 5, z: 0 });
  });

  it('é determinística pela semente (o núcleo e a tela veem o mesmo ponto)', () => {
    const a = pontoEm(rota('caotica', { semente: 7 }), 0.37);
    const b = pontoEm(rota('caotica', { semente: 7 }), 0.37);
    const c = pontoEm(rota('caotica', { semente: 8 }), 0.37);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });

  it('a órbita dá uma volta em quem lança e depois parte', () => {
    const r = rota('orbita', { altura: 1 });
    const meioDoGiro = pontoEm(r, 0.175);
    expect(Math.hypot(meioDoGiro.x - 2, meioDoGiro.y - 5)).toBeCloseTo(1);
    expect(pontoEm(r, 1).x).toBeCloseTo(9);
  });
});

describe('a leitura da entrega', () => {
  it('preenche o padrão e recusa as combinações que o motor não aceita', () => {
    const l = new Leitor('t');
    expect(lerEntrega(l, { trajetoria: 'parabola' })).toEqual({ ...ENTREGA_PADRAO, trajetoria: 'parabola' });
    expect(l.erros).toEqual([]);
    const ruim = new Leitor('t');
    lerEntrega(ruim, { cadencia: 'feixe', trajetoria: 'espiral' });
    lerEntrega(ruim, { origem: 'ceu', trajetoria: 'caotica' });
    lerEntrega(ruim, { quantidade: 3 });
    expect(ruim.erros.length).toBe(3);
  });
});

/** O conteúdo com uma skill de teste (a Bola de fogo, ou a Explosão de fogo, com a entrega dada). */
function comSkill(id: string, deId: string, entrega: Partial<Entrega>, sobre: Partial<Habilidade> = {}): Conteudo {
  const def = obter(CONTEUDO.definicoes.get(deId));
  const nova: DefinicaoHabilidade = { ...def, base: { ...def.base, ...sobre, id, chave: id, entrega: { ...ENTREGA_PADRAO, ...entrega } } };
  const definicoes = new Map(CONTEUDO.definicoes);
  definicoes.set(id, nova);
  return { ...CONTEUDO, definicoes };
}

function cena(entrega: Partial<Entrega>, deId = 'projetil_fogo', sobre: Partial<Habilidade> = {}, mapa = SALA_ABERTA) {
  const conteudo = comSkill('teste_entrega', deId, entrega, sobre);
  const ctx = { ...contexto(faseDeTexto(mapa)), conteudo };
  const estado = criarEstado({ semente: 3, faseId: 'teste' });
  const j = criarJogador(obter(CONTEUDO.classes.get('mago')), 'j', 2, 5, ctx.balance);
  j.mana = j.manaMax = 500;
  estado.entidades.push(j);
  const inimigo = (id: string, x: number, y: number) => {
    const e = criarInimigo(obter(ctx.conteudo.presets.get('goblin')), id, x, y, ctx.balance);
    e.hp = e.hpMax = 5000;
    e.autoAtaque = false;
    estado.entidades.push(e);
    return e;
  };
  const hab = obter(resolverHabilidade(ctx, 'teste_entrega'));
  const saida: EventoSimulacao[] = [];
  const lancar = (alvo: Entidade | null, mira = alvo ? { x: alvo.x, y: alvo.y } : { x: 8, y: 5 }) => {
    const fonte = { ...fonteDaHabilidade(j, ctx, estado.tick, hab), d20Minimo: 20 };
    return lancarEntrega(estado, ctx, j, hab, { acaoId: 1, fonte, hab, mira }, { x: 2, y: 5 }, alvo, mira, saida);
  };
  const passar = (ms: number) => {
    for (let t = 0; t < Math.ceil(ms / DT_MS); t++) {
      estado.tick++;
      processarCanais(estado, ctx, saida);
      moverProjeteis(estado, ctx, saida, DT_MS);
      processarSolos(estado, ctx, saida);
    }
  };
  return { ctx, estado, j, inimigo, hab, saida, lancar, passar };
}

const impactosEm = (saida: readonly EventoSimulacao[], id: string) => saida.filter((e) => e.t === 'impacto' && e.alvoId === id);
const projeteisDe = (estado: EstadoJogo) => estado.projeteis.filter((p) => p.habilidadeId === 'teste_entrega');

describe('a entrega no núcleo', () => {
  it('a parábola passa por cima de quem está no caminho e acerta onde cai', () => {
    const c = cena({ trajetoria: 'parabola' });
    const noCaminho = c.inimigo('a', 5, 5);
    const alvo = c.inimigo('b', 8, 5);
    expect(c.lancar(alvo)).toBe(true);
    c.passar(1500);
    expect(impactosEm(c.saida, noCaminho.id)).toHaveLength(0);
    expect(impactosEm(c.saida, alvo.id)).toHaveLength(1);
  });

  it('a parábola passa por cima da parede que a reta não passa', () => {
    const mapa = ['############', '#....#.....#', '#....#.....#', '#....#.....#', '#....#.....#', '#....#.....#', '#....#.....#', '############'];
    const c = cena({ trajetoria: 'parabola' }, 'projetil_fogo', {}, mapa);
    const alvo = c.inimigo('b', 8, 5);
    c.lancar(alvo);
    c.passar(1500);
    expect(impactosEm(c.saida, alvo.id)).toHaveLength(1);
  });

  it('a salva solta os tiros em sequência, cada um com a sua parte', () => {
    const c = cena({ cadencia: 'salva', quantidade: 4 });
    const alvo = c.inimigo('b', 8, 5);
    c.lancar(alvo);
    const tiros = projeteisDe(c.estado);
    expect(tiros).toHaveLength(4);
    expect(new Set(tiros.map((p) => p.saiEm ?? 0)).size).toBe(4);
    const r = c.ctx.balance.entrega.salva;
    const unico = cena({});
    unico.lancar(unico.inimigo('b', 8, 5));
    expect(obter(tiros[0]).multDano).toBeCloseTo((obter(projeteisDe(unico.estado)[0]).multDano * (100 / 4 + r.extraPct)) / 100);
    c.passar(2000);
    expect(impactosEm(c.saida, alvo.id)).toHaveLength(4);
  });

  it('o par convergente sai pelos lados e as duas metades acertam o alvo', () => {
    const c = cena({ trajetoria: 'convergente' });
    const alvo = c.inimigo('b', 8, 5);
    c.lancar(alvo);
    const [a, b] = projeteisDe(c.estado);
    expect(obter(a).parId).toBe(obter(b).id);
    c.passar(300);
    expect(Math.sign(obter(a).y - 5)).toBe(-Math.sign(obter(b).y - 5));
    c.passar(1500);
    expect(impactosEm(c.saida, alvo.id)).toHaveLength(2);
  });

  it('o céu só fere quando cai, numa área em volta do ponto', () => {
    const c = cena({ origem: 'ceu' });
    const alvo = c.inimigo('b', 8, 5);
    const vizinho = c.inimigo('c', 8, 6);
    c.lancar(alvo);
    c.passar(200);
    expect(impactosEm(c.saida, alvo.id)).toHaveLength(0);
    c.passar(800);
    expect(impactosEm(c.saida, alvo.id)).toHaveLength(1);
    expect(impactosEm(c.saida, vizinho.id)).toHaveLength(1);
  });

  it('o feixe pulsa enquanto dura, paga mana e a exposição cresce; pedir de novo solta', () => {
    const c = cena({ cadencia: 'feixe', duracaoMs: 2000 });
    const alvo = c.inimigo('b', 6, 5);
    c.lancar(alvo);
    expect(c.j.canal?.tipo).toBe('feixe');
    const mana = c.j.mana;
    c.passar(1100);
    expect(impactosEm(c.saida, alvo.id).length).toBeGreaterThanOrEqual(4);
    expect(c.j.mana).toBeLessThan(mana);
    expect(obter(c.j.canal).exposicao[alvo.id]).toBeGreaterThan(0);
    c.passar(1200);
    expect(c.j.canal).toBeUndefined();
  });

  it('o feixe troca para o alvo que o jogador escolhe e salta, quando o alvo cai, para o mais perto dele', () => {
    const c = cena({ cadencia: 'feixe', duracaoMs: 3000 });
    const a = c.inimigo('a', 6, 5);
    const b = c.inimigo('b', 5, 8);
    const perto = c.inimigo('c', 6, 7);
    const longe = c.inimigo('d', 2, 10);
    c.j.alvoSelecionado = a.id;
    c.lancar(a);
    c.passar(300);
    c.j.alvoSelecionado = b.id;
    c.passar(300);
    expect(obter(c.j.canal).alvoId).toBe(b.id);
    const antes = impactosEm(c.saida, b.id).length;
    c.passar(500);
    expect(impactosEm(c.saida, b.id).length).toBeGreaterThan(antes);
    // O alvo cai: o feixe segue no mais perto de onde ele estava (c, a 1 célula), não apaga nem vai ao longe.
    b.hp = 0;
    b.morto = true;
    c.passar(300);
    expect(obter(c.j.canal).alvoId).toBe(perto.id);
    expect(impactosEm(c.saida, longe.id)).toHaveLength(0);
  });

  it('o efeito que gira fica no alvo e fere a cada volta', () => {
    const c = cena({ permanencia: 'gira' });
    const alvo = c.inimigo('b', 6, 5);
    c.lancar(alvo);
    c.passar(800);
    expect(projeteisDe(c.estado)[0]?.perm?.alvoId).toBe(alvo.id);
    c.passar(2000);
    expect(impactosEm(c.saida, alvo.id).length).toBeGreaterThanOrEqual(4);
    c.passar(3000);
    expect(projeteisDe(c.estado)).toHaveLength(0);
  });

  it('o chão amaldiçoado fica onde a magia acertou e pulsa', () => {
    const c = cena({ marca: 'chao' });
    const alvo = c.inimigo('b', 6, 5);
    c.lancar(alvo);
    c.passar(600);
    expect(c.estado.solos?.some((s) => s.entrega === 'marca')).toBe(true);
    const antes = impactosEm(c.saida, alvo.id).length;
    c.passar(2000);
    expect(impactosEm(c.saida, alvo.id).length).toBeGreaterThan(antes);
  });

  it('alvo → usuário: fere o alvo na hora e volta trazendo vida', () => {
    const c = cena({ sentido: 'volta' });
    const alvo = c.inimigo('b', 7, 5);
    c.j.hp = 10;
    c.lancar(alvo);
    expect(impactosEm(c.saida, alvo.id)).toHaveLength(1);
    expect(projeteisDe(c.estado)[0]?.traz?.tipo).toBe('vida');
    c.passar(1500);
    expect(c.j.hp).toBeGreaterThan(10);
  });

  it('os grãos saem em nuvem, cada um com uma parte pequena', () => {
    const c = cena({ corpo: 'graos' });
    const alvo = c.inimigo('b', 7, 5);
    c.lancar(alvo);
    const graos = projeteisDe(c.estado);
    expect(graos).toHaveLength(c.ctx.balance.entrega.graos.quantidade);
    c.passar(2000);
    expect(impactosEm(c.saida, alvo.id).length).toBeGreaterThan(3);
  });

  it('a área que cai do céu espera a queda e fere a área toda', () => {
    const c = cena({ origem: 'ceu' }, 'explosao_fogo');
    const alvo = c.inimigo('b', 8, 5);
    c.lancar(alvo, { x: 8, y: 5 });
    expect(impactosEm(c.saida, alvo.id)).toHaveLength(0);
    c.passar(800);
    expect(impactosEm(c.saida, alvo.id)).toHaveLength(1);
  });
});
