// Marco 24 (24/10/2026, D-095): a sintonia do Necromante (os mortos) e as vertentes dele.
import { describe, expect, it } from 'vitest';
import { aplicarEfeito } from '../../src/combat/efeitos';
import { habilidadeDoAtor } from '../../src/combat/perfil';
import { construirEfeito } from '../../src/combat/registro-efeitos';
import { aoCairOMorto, aoGolpeDoMorto, ataqueDoMorto, curaGeralNosMortos, mortoEsquivou, mortoInamovivel, retornoDoServo, vidaDoMorto } from '../../src/combat/sintonia-necromante';
import { criarEstado } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import { clonarEntidade, type Entidade } from '../../src/entities/entidade';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

function obter<T>(v: T | undefined | null, nome = 'valor'): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

function cena(gerais: (string | null)[] = []) {
  const ctx = contexto(faseDeTexto(SALA_ABERTA));
  const estado = criarEstado({ semente: 13, faseId: 'teste' });
  const j = criarJogador(obter(CONTEUDO.classes.get('necromante')), 'j', 3, 5, ctx.balance);
  j.nivel = 10;
  const bolsa = obter(j.bolsa);
  gerais.forEach((id, i) => {
    if (id && !bolsa.conhecidas.some((c) => c.id === id)) bolsa.conhecidas.push({ id, rank: 1, caminhos: [] });
    bolsa.barra[2 + i] = id;
  });
  j.habilidades = bolsa.barra.filter((id): id is string => id !== null);
  j.autoAtaque = false;
  const b = criarInimigo(obter(CONTEUDO.presets.get('boneco')), 'b', 7, 5, ctx.balance);
  b.hp = b.hpMax = 5000;
  estado.entidades.push(j, b);
  const eventos: EventoSimulacao[] = [];
  // O servo se ergue sozinho no primeiro tick.
  simular(estado, ctx, [], eventos, DT_MS);
  const servo = obter(estado.entidades.find((e) => e.invocacao?.necromancia === 'servo'), 'servo');
  /** Mais mortos do mesmo dono (cópias do servo como reanimados). */
  const maisMortos = (n: number): Entidade[] => Array.from({ length: n }, (_, i) => {
    const m = clonarEntidade(servo);
    m.id = `m${i}`;
    m.x = 6;
    m.y = 4 + i;
    if (m.invocacao) m.invocacao.necromancia = 'reanimado';
    estado.entidades.push(m);
    return m;
  });
  const tem = (e: Entidade, tipo: string) => e.efeitos.some((f) => f.tipo === tipo && f.ateTick > estado.tick);
  return { ctx, estado, j, b, servo, eventos, maisMortos, tem };
}

describe('sintonia do Necromante (D-095)', () => {
  it('as 9 famílias do Necromante e as 3 vertentes têm mecânica nos dados', () => {
    expect(Object.keys(obter(CONTEUDO.sintonia.efeitosDaClasse.necromante))).toHaveLength(9);
    for (const v of CONTEUDO.sintonia.vertentes.filter((x) => x.classe === 'necromante')) expect(CONTEUDO.sintonia.efeitosDaVertente[v.id]?.length).toBeGreaterThan(0);
  });

  it('técnica e veneno: os golpes dos mortos fazem sangrar e envenenam', () => {
    const c = cena(['golpe_atordoante', 'flecha_venenosa']);
    aoGolpeDoMorto(c.estado, c.ctx, c.servo, c.b, c.eventos);
    expect(c.tem(c.b, 'sangrando')).toBe(true);
    expect(c.tem(c.b, 'envenenado')).toBe(true);
    // O golpe de quem não é morto não faz nada.
    const outro = cena(['golpe_atordoante']);
    aoGolpeDoMorto(outro.estado, outro.ctx, outro.j, outro.b, outro.eventos);
    expect(outro.tem(outro.b, 'sangrando')).toBe(false);
  });

  it('psíquico: golpeado por 3 mortos diferentes, o hostil fica aterrorizado', () => {
    const c = cena(['agulha_mental']);
    const [m0, m1] = c.maisMortos(2).map((m) => obter(m));
    aoGolpeDoMorto(c.estado, c.ctx, c.servo, c.b, c.eventos);
    aoGolpeDoMorto(c.estado, c.ctx, obter(m0), c.b, c.eventos);
    expect(c.tem(c.b, 'aterrorizado')).toBe(false);
    aoGolpeDoMorto(c.estado, c.ctx, obter(m1), c.b, c.eventos);
    expect(c.tem(c.b, 'aterrorizado')).toBe(true);
  });

  it('arcana, fogo e sagrado: o morto que cai solta seta, explode e cura em volta', () => {
    const c = cena(['seta_arcana', 'bola_de_fogo', 'lanca_radiante']);
    const [m] = c.maisMortos(1).map((x) => obter(x));
    c.j.hp = 1;
    aoCairOMorto(c.estado, c.ctx, obter(m), c.eventos);
    expect(c.b.hp).toBeLessThan(c.b.hpMax);
    expect(c.tem(c.b, 'queimando')).toBe(true);
    expect(c.eventos.some((e) => e.t === 'explodiu')).toBe(true);
    const cura = cena(['lanca_radiante']);
    cura.j.hp = 1;
    cura.servo.x = 4;
    aoCairOMorto(cura.estado, cura.ctx, cura.servo, cura.eventos);
    expect(cura.j.hp).toBeGreaterThan(1);
  });

  it('suporte: a cura geral salta para os mortos perto do alvo', () => {
    const c = cena(['curar']);
    c.servo.hp = 1;
    curaGeralNosMortos(c.estado, c.ctx, c.j, c.j, obter(habilidadeDoAtor(c.ctx, c.j, 'curar')), 10, c.eventos);
    expect(c.servo.hp).toBeGreaterThan(1);
  });

  it('terra: mais vida e sem empurrão; sombra: esquivam parte dos golpes', () => {
    const c = cena(['estaca_de_pedra', 'passo_sombrio']);
    expect(vidaDoMorto(c.ctx, c.j, 100, 0)).toBe(120);
    expect(mortoInamovivel(c.estado, c.ctx, c.servo)).toBe(true);
    expect(mortoInamovivel(c.estado, c.ctx, c.j)).toBe(false);
    const esquivas = Array.from({ length: 200 }, () => mortoEsquivou(c.estado, c.ctx, c.servo)).filter(Boolean).length;
    expect(esquivas).toBeGreaterThan(15);
    expect(esquivas).toBeLessThan(70);
    expect(mortoEsquivou(c.estado, c.ctx, c.j)).toBe(false);
  });

  it('Lich: os mortos atiram de longe; Pastor das almas: o servo volta em 4 s', () => {
    const lich = cena(['seta_arcana', 'explosao', 'punhal_das_sombras', 'passo_sombrio']);
    expect(ataqueDoMorto(lich.estado, lich.ctx, lich.servo)).toEqual({ habilidade: 'dardo_arcano', alcance: 4 });
    expect(ataqueDoMorto(lich.estado, lich.ctx, lich.j)).toBeNull();
    const pastor = cena(['lanca_radiante', 'chuva_de_estrelas', 'curar', 'barreira']);
    expect(retornoDoServo(pastor.ctx, pastor.j, 0)).toBe(4000);
    expect(retornoDoServo(lich.ctx, lich.j, 0)).toBeNull();
  });

  it('Senhor da praga: o veneno dos mortos se espalha e dobra no aterrorizado', () => {
    const c = cena(['flecha_venenosa', 'dardo_toxico', 'agulha_mental', 'telecinese']);
    const vizinho = criarInimigo(obter(CONTEUDO.presets.get('boneco')), 'v', 8, 5, c.ctx.balance);
    c.estado.entidades.push(vizinho);
    aplicarEfeito(c.estado, c.ctx, c.b, construirEfeito('aterrorizado', { duracaoMs: 3000 }), { id: 'j', x: 3, y: 5 }, null, c.eventos);
    aoGolpeDoMorto(c.estado, c.ctx, c.servo, c.b, c.eventos);
    expect(c.tem(vizinho, 'envenenado')).toBe(true);
    const noAlvo = Math.max(...c.b.efeitos.filter((f) => f.tipo === 'envenenado').map((f) => f.valor));
    const noVizinho = Math.max(...vizinho.efeitos.filter((f) => f.tipo === 'envenenado').map((f) => f.valor));
    expect(noAlvo).toBeGreaterThan(noVizinho);
  });
});
