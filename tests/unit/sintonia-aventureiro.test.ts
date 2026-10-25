// Marco 24 (24/10/2026, D-095): a sintonia do Aventureiro (o falcão) e as vertentes dele.
import { describe, expect, it } from 'vitest';
import { habilidadeDoAtor } from '../../src/combat/perfil';
import { construirEfeito } from '../../src/combat/registro-efeitos';
import { aoAcertarComFalcao, criticoDoFalcao, escudoComFalcao, falcaoDeGuarda, falcaoGuardiaoAbsorve } from '../../src/combat/sintonia-aventureiro';
import { criarEstado } from '../../src/core/estado';
import { ticksDe } from '../../src/core/tempo';
import type { EventoSimulacao } from '../../src/core/simulacao';
import type { Entidade } from '../../src/entities/entidade';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

function obter<T>(v: T | undefined | null, nome = 'valor'): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

function cena(gerais: (string | null)[] = []) {
  const ctx = contexto(faseDeTexto(SALA_ABERTA));
  const estado = criarEstado({ semente: 17, faseId: 'teste' });
  const j = criarJogador(obter(CONTEUDO.classes.get('aventureiro')), 'j', 3, 5, ctx.balance);
  j.nivel = 10;
  const bolsa = obter(j.bolsa);
  gerais.forEach((id, i) => {
    if (id && !bolsa.conhecidas.some((c) => c.id === id)) bolsa.conhecidas.push({ id, rank: 1, caminhos: [] });
    bolsa.barra[2 + i] = id;
  });
  j.habilidades = bolsa.barra.filter((id): id is string => id !== null);
  const b = criarInimigo(obter(CONTEUDO.presets.get('boneco')), 'b', 5, 5, ctx.balance);
  const v = criarInimigo(obter(CONTEUDO.presets.get('boneco')), 'v', 6, 5, ctx.balance);
  for (const x of [b, v]) x.hp = x.hpMax = 5000;
  estado.entidades.push(j, b, v);
  const eventos: EventoSimulacao[] = [];
  const hab = (id: string) => obter(habilidadeDoAtor(ctx, j, id), id);
  const acerto = (id: string, dano: number, cura = 0, alvo: Entidade = b) => { aoAcertarComFalcao(estado, ctx, j, alvo, hab(id), dano, cura, eventos); };
  const tem = (e: Entidade, tipo: string) => e.efeitos.some((f) => f.tipo === tipo && f.ateTick > estado.tick);
  return { ctx, estado, j, b, v, eventos, hab, acerto, tem };
}

describe('sintonia do Aventureiro (D-095)', () => {
  it('as 9 famílias do Aventureiro e as 3 vertentes têm mecânica nos dados', () => {
    expect(Object.keys(obter(CONTEUDO.sintonia.efeitosDaClasse.aventureiro))).toHaveLength(9);
    for (const v of CONTEUDO.sintonia.vertentes.filter((x) => x.classe === 'aventureiro')) expect(CONTEUDO.sintonia.efeitosDaVertente[v.id]?.length).toBeGreaterThan(0);
  });

  it('técnica e arcana: o falcão golpeia junto com a geral técnica (40%) e repete a Seta (30%)', () => {
    const c = cena(['golpe_atordoante', 'seta_arcana']);
    c.acerto('golpe_atordoante', 50);
    expect(c.b.hpMax - c.b.hp).toBe(20);
    c.acerto('seta_arcana', 50);
    expect(c.b.hpMax - c.b.hp).toBe(35);
    c.acerto('bola_de_fogo', 50);
    expect(c.b.hpMax - c.b.hp).toBe(35);
  });

  it('fogo e terra: o Mergulho queima o alvo e atordoa quem está a 1 célula dele', () => {
    const c = cena(['bola_de_fogo', 'estaca_de_pedra']);
    c.acerto('mergulho', 10);
    expect(c.tem(c.b, 'queimando')).toBe(true);
    expect(c.tem(c.v, 'atordoar')).toBe(true);
    expect(c.tem(c.v, 'queimando')).toBe(false);
  });

  it('veneno e psíquico: as garras envenenam e o Grito silencia (mesmo sem ferir)', () => {
    const c = cena(['flecha_venenosa', 'agulha_mental']);
    c.acerto('garras_cegantes', 5);
    expect(c.tem(c.b, 'envenenado')).toBe(true);
    c.acerto('grito_do_falcao', 0);
    expect(c.tem(c.b, 'silenciar')).toBe(true);
  });

  it('sagrado: o Retorno ao punho cura também os aliados a até 2 células', () => {
    const c = cena(['lanca_radiante']);
    const aliado = criarJogador(obter(CONTEUDO.classes.get('mago')), 'a', 4, 5, c.ctx.balance);
    aliado.hp = 1;
    c.estado.entidades.push(aliado);
    c.acerto('retorno_ao_punho', 0, 9, c.j);
    expect(aliado.hp).toBe(10);
  });

  it('sombra: o primeiro golpe do falcão depois de um tempo é crítico', () => {
    const c = cena(['passo_sombrio']);
    const fonte = { id: 'j', equipe: c.j.equipe, bonusAtributo: 0, carisma: 0, multRolagem: 1, potencia: 1, multDano: 1, multCura: 1 };
    expect(criticoDoFalcao(c.ctx, c.j, c.hab('mergulho'), fonte, 100).d20Minimo).toBe(16);
    expect(criticoDoFalcao(c.ctx, c.j, c.hab('mergulho'), fonte, 110).d20Minimo).toBeUndefined();
    expect(criticoDoFalcao(c.ctx, c.j, c.hab('golpe_atordoante'), fonte, 1000).d20Minimo).toBeUndefined();
  });

  it('suporte: os escudos recebidos rendem 25% a mais', () => {
    const c = cena(['barreira']);
    expect(escudoComFalcao(c.ctx, c.j, construirEfeito('escudo', { valor: 20, duracaoMs: 3000 }), 0).valor).toBe(25);
    expect(escudoComFalcao(c.ctx, c.j, construirEfeito('queimando', { valor: 20, duracaoMs: 3000 }), 0).valor).toBe(20);
  });

  it('Druida: o falcão fica de guarda e absorve um golpe a cada 4 s', () => {
    const c = cena(['estaca_de_pedra', 'abalo_sismico', 'curar', 'barreira']);
    expect(falcaoDeGuarda(c.ctx, c.j, 0)).toBe(true);
    const golpe = obter(habilidadeDoAtor(c.ctx, c.b, c.b.ataqueBasico));
    expect(falcaoGuardiaoAbsorve(c.ctx, c.j, c.b, golpe, 100)).toBe(true);
    expect(falcaoGuardiaoAbsorve(c.ctx, c.j, c.b, golpe, 110)).toBe(false);
    expect(falcaoGuardiaoAbsorve(c.ctx, c.j, c.b, golpe, 100 + ticksDe(4000))).toBe(true);
  });

  it('Rapina: a geral técnica faz o falcão golpear com tudo, uma vez a cada 4 s', () => {
    const c = cena(['golpe_atordoante', 'investida', 'punhal_das_sombras', 'passo_sombrio']);
    c.acerto('golpe_atordoante', 50);
    // 80% (técnica com Domínio) + 100% (Rapina).
    expect(c.b.hpMax - c.b.hp).toBe(90);
    c.acerto('golpe_atordoante', 50);
    expect(c.b.hpMax - c.b.hp).toBe(130);
  });

  it('Tempestuoso: as magias gerais repetem com 50% e silenciam', () => {
    const c = cena(['seta_arcana', 'explosao', 'agulha_mental', 'telecinese']);
    c.acerto('bola_de_fogo', 40);
    expect(c.b.hpMax - c.b.hp).toBe(20);
    expect(c.tem(c.b, 'silenciar')).toBe(true);
  });
});
