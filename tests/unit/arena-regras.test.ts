import { describe, expect, it } from 'vitest';
import { entrarNaArena } from '../../src/arena/entrada';
import { construirFichaDeSessao } from '../../src/arena/ficha-sessao';
import { FONTES_OFICIAIS, modoPorId } from '../../src/core/conteudo';
import { BALANCE_PADRAO } from '../../src/core/contexto';
import { buscarEntidade, criarEstado } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import { ticksDe } from '../../src/core/tempo';
import { ATRIBUTOS_NEUTROS, type Atributos } from '../../src/entities/entidade';
import { criarInimigo } from '../../src/entities/fabrica';
import { lerModo, type ModoDeJogo } from '../../src/modos/modo';
import { podeFerir } from '../../src/modos/relacao';
import { largarObjeto } from '../../src/world/objetos';
import { validarFase } from '../../src/world/validacao-fase';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const LIVRE = modoPorId(CONTEUDO, 'livre');
const ATRIBUTOS = Object.keys(ATRIBUTOS_NEUTROS) as (keyof Atributos)[];
const soma = (a: Atributos) => ATRIBUTOS.reduce((s, k) => s + a[k], 0);
const acimaDoNeutro = (a: Atributos) => ATRIBUTOS.reduce((s, k) => s + Math.max(0, a[k] - 10), 0);

function obter<T>(v: T | undefined, nome: string): T {
  if (v === undefined) throw new Error(`${nome} ausente`);
  return v;
}

describe('descritor de modo (§2.13)', () => {
  const livreJson = (FONTES_OFICIAIS.modos as Record<string, Record<string, unknown>>)['livre.json'] ?? {};

  it('rejeita progressaoContaParaCampanha: true (§3.7)', () => {
    const { erros } = lerModo({ ...livreJson, progressaoContaParaCampanha: true }, 'teste');
    expect(erros.some((e) => e.includes('progressaoContaParaCampanha'))).toBe(true);
  });

  it('modo preset precisa de presetClasse', () => {
    const clamp = { ...(livreJson.clamp as object), modo: 'preset', presetClasse: null };
    expect(lerModo({ ...livreJson, clamp }, 'teste').erros.some((e) => e.includes('presetClasse'))).toBe(true);
  });
});

describe('ficha de sessão (§3.7)', () => {
  it('save adulterado não passa dos tetos nem do orçamento; HP e habilidades nunca vêm do cliente', () => {
    const pedido = {
      classeId: 'aventureiro',
      atributos: Object.fromEntries(ATRIBUTOS.map((k) => [k, 99])),
      habilidades: ['golpe_demoniaco', 'seta_arcana', 'seta_arcana', 'inexistente'],
      nivel: 50,
      hpMax: 9999,
    };
    const { ficha, alteracoes } = construirFichaDeSessao(pedido, LIVRE, CONTEUDO, BALANCE_PADRAO);
    const clamp = obter(LIVRE.clamp ?? undefined, 'clamp');
    for (const k of ATRIBUTOS) expect(ficha.atributos[k]).toBeLessThanOrEqual(clamp.atributoMax);
    expect(soma(ficha.atributos)).toBeLessThanOrEqual(clamp.atributoTotalMax);
    expect(acimaDoNeutro(ficha.atributos)).toBeLessThanOrEqual(clamp.orcamentoAtributos);
    expect(ficha.habilidades).toEqual(['seta_arcana']);
    expect(ficha.nivel).toBe(clamp.nivelMax);
    expect(ficha.hpMax).toBeLessThan(9999);
    expect(alteracoes.map((a) => a.campo)).toEqual(expect.arrayContaining(['hpMax', 'nivel', 'habilidades', 'atributos.forca']));
  });

  it('pedido honesto (a ficha da classe) não sofre alterações', () => {
    const classe = obter(CONTEUDO.classes.get('aventureiro'), 'classe');
    const pedido = { classeId: classe.id, atributos: classe.atributos, habilidades: classe.habilidades, nivel: 1 };
    expect(construirFichaDeSessao(pedido, LIVRE, CONTEUDO, BALANCE_PADRAO).alteracoes).toEqual([]);
  });

  it('a redução é determinística e usa a ordem do modo no desempate', () => {
    const pedido = { classeId: 'aventureiro', atributos: { forca: 16, destreza: 16, constituicao: 16, inteligencia: 16, sabedoria: 16, carisma: 16 } };
    const a = construirFichaDeSessao(pedido, LIVRE, CONTEUDO, BALANCE_PADRAO).ficha.atributos;
    const b = construirFichaDeSessao(pedido, LIVRE, CONTEUDO, BALANCE_PADRAO).ficha.atributos;
    expect(a).toEqual(b);
    expect(acimaDoNeutro(a)).toBe(12);
  });

  it('modo escalar reescala com arredondamento determinístico', () => {
    const escalar: ModoDeJogo = { ...LIVRE, clamp: { ...obter(LIVRE.clamp ?? undefined, 'clamp'), modo: 'escalar', orcamentoAtributos: 100 } };
    const pedido = { classeId: 'aventureiro', atributos: { forca: 16, destreza: 15, constituicao: 14, inteligencia: 13, sabedoria: 12, carisma: 11 } };
    const r1 = construirFichaDeSessao(pedido, escalar, CONTEUDO, BALANCE_PADRAO).ficha.atributos;
    const r2 = construirFichaDeSessao(pedido, escalar, CONTEUDO, BALANCE_PADRAO).ficha.atributos;
    expect(r1).toEqual(r2);
    expect(soma(r1)).toBe(72);
    expect(r1.forca).toBeGreaterThanOrEqual(r1.carisma);
  });

  it('preset dá a mesma ficha a qualquer pedido (acesso simétrico, Duelo)', () => {
    const preset: ModoDeJogo = { ...LIVRE, clamp: { ...obter(LIVRE.clamp ?? undefined, 'clamp'), modo: 'preset', presetClasse: 'aventureiro' } };
    const a = construirFichaDeSessao({ atributos: { forca: 99 } }, preset, CONTEUDO, BALANCE_PADRAO).ficha;
    const b = construirFichaDeSessao({ classeId: 'x', habilidades: [] }, preset, CONTEUDO, BALANCE_PADRAO).ficha;
    expect(a).toEqual(b);
  });
});

describe('fase de arena (§3.10)', () => {
  const base = { id: 'a', nome: 'A', ordem: 1, tipo: 'arena', mapa: Array.from({ length: 8 }, (_, y) => (y === 0 || y === 7 ? '#'.repeat(10) : '#........#')) };

  it('precisa de dois spawns não adjacentes', () => {
    expect(validarFase({ ...base, spawns: [{ x: 1, y: 1 }] }).ok).toBe(false);
    expect(validarFase({ ...base, spawns: [{ x: 1, y: 1 }, { x: 2, y: 2 }] }).ok).toBe(false);
    expect(validarFase({ ...base, spawns: [{ x: 1, y: 1 }, { x: 8, y: 6 }] }).ok).toBe(true);
  });

  it('toda célula passável precisa ser alcançável', () => {
    const mapa = [...base.mapa];
    mapa[3] = '#####....#';
    mapa[4] = '#..#.....#';
    mapa[5] = '#..#.....#';
    mapa[6] = '####.....#';
    const r = validarFase({ ...base, mapa, spawns: [{ x: 5, y: 1 }, { x: 8, y: 6 }] });
    expect(r.ok).toBe(false);
  });
});

describe('coleta transacional (§3.6)', () => {
  function arena(modoId = 'livre', balance = BALANCE_PADRAO) {
    const ctx = contexto(faseDeTexto(SALA_ABERTA), balance, modoId);
    const estado = criarEstado({ semente: 1, faseId: 'teste' });
    const eventos: EventoSimulacao[] = [];
    const entrar = (n: number) => {
      const { ficha } = construirFichaDeSessao({ classeId: 'aventureiro' }, ctx.modo, CONTEUDO, BALANCE_PADRAO);
      return entrarNaArena(estado, ctx, `p${n}`, `j${n}`, ficha, `Jogador ${n}`);
    };
    const tick = () => {
      simular(estado, ctx, [], eventos, DT_MS);
    };
    return { ctx, estado, eventos, entrar, tick };
  }

  it('dez jogadores na mesma célula do orbe, no mesmo tick: uma coleta só', () => {
    for (let semente = 0; semente < 5; semente++) {
      const a = arena();
      const jogadores = Array.from({ length: 10 }, (_, i) => a.entrar(i));
      for (const j of jogadores) {
        j.x = j.destinoX = 5;
        j.y = j.destinoY = 5;
        j.hp = 10;
        j.autoAtaque = false;
      }
      a.estado.tick = semente; // muda quem é o primeiro na ordem rotativa
      largarObjeto(a.estado, 'orbe_hp', 5, 5, 30, 'pct', a.eventos);
      a.tick();
      const coletas = a.eventos.filter((e) => e.t === 'coletou');
      expect(coletas).toHaveLength(1);
      expect(a.estado.objetos).toHaveLength(0);
      expect(jogadores.filter((j) => j.hp > 10)).toHaveLength(1);
    }
  });

  it('IA não coleta; quem está com a vida cheia não desperdiça o orbe', () => {
    const a = arena();
    const j = a.entrar(1);
    j.x = j.destinoX = 3;
    j.y = j.destinoY = 3;
    const inimigo = criarInimigo(obter(CONTEUDO.presets.get('boneco'), 'boneco'), 'b', 5, 5, BALANCE_PADRAO);
    a.estado.entidades.push(inimigo);
    largarObjeto(a.estado, 'orbe_hp', 5, 5, 30, 'pct', a.eventos);
    largarObjeto(a.estado, 'orbe_hp', 3, 3, 30, 'pct', a.eventos);
    a.tick();
    expect(a.eventos.filter((e) => e.t === 'coletou')).toHaveLength(0);
    expect(a.estado.objetos).toHaveLength(2);
  });

  it('drop só na primeira morte do inimigo', () => {
    const balance = { ...BALANCE_PADRAO, drops: { ...BALANCE_PADRAO.drops, chanceOrbeHp: 1 } };
    const a = arena('livre', balance);
    const boneco = obter(CONTEUDO.presets.get('boneco'), 'boneco');
    const primeira = criarInimigo(boneco, 'b1', 4, 4, balance);
    const reincidente = criarInimigo(boneco, 'b2', 6, 6, balance);
    reincidente.abates = 1;
    primeira.hp = 0;
    reincidente.hp = 0;
    a.estado.entidades.push(primeira, reincidente);
    a.tick();
    const surgidos = a.eventos.filter((e): e is Extract<EventoSimulacao, { t: 'objetoSurgiu' }> => e.t === 'objetoSurgiu');
    expect(surgidos.map((e) => [e.x, e.y])).toEqual([[4, 4]]);
  });

  it('no Livre, cada jogador é a própria equipe: dois jogadores se atacam', () => {
    const a = arena();
    const j1 = a.entrar(1);
    const j2 = a.entrar(2);
    expect(j1.equipe).not.toBe(j2.equipe);
    expect(podeFerir(j1, j2, a.ctx.modo)).toBe(true);
    j2.x = j2.destinoX = j1.x + 1;
    j2.y = j2.destinoY = j1.y;
    simular(a.estado, a.ctx, [{ tick: 0, entidadeId: j1.id, cmd: { t: 'ataqueBasico' } }], a.eventos, DT_MS);
    expect(a.eventos.find((e) => e.t === 'acaoIniciada')).toMatchObject({ atorId: j1.id, alvoId: j2.id });
  });

  it('respawn do Livre: 5 s, no spawn mais longe do inimigo, sem ficar morto', () => {
    const ctx = contexto(faseDeTexto(SALA_ABERTA), BALANCE_PADRAO, 'livre');
    const fase = { ...ctx.fase, spawns: [{ x: 1, y: 1 }, { x: 10, y: 10 }] };
    const estado = criarEstado({ semente: 1, faseId: 'teste' });
    const c = { ...ctx, fase };
    const { ficha } = construirFichaDeSessao({ classeId: 'aventureiro' }, c.modo, CONTEUDO, BALANCE_PADRAO);
    const j1 = entrarNaArena(estado, c, 'p1', 'j1', ficha, 'Um');
    const j2 = entrarNaArena(estado, c, 'p2', 'j2', ficha, 'Dois');
    j2.x = j2.destinoX = 2;
    j2.y = j2.destinoY = 2;
    j1.hp = 0;
    const eventos: EventoSimulacao[] = [];
    for (let i = 0; i < ticksDe(5000) + 2; i++) simular(estado, c, [], eventos, DT_MS);
    const revivido = obter(buscarEntidade(estado, 'j1'), 'j1');
    expect(revivido.morto).toBe(false);
    expect([revivido.x, revivido.y]).toEqual([10, 10]);
    expect(eventos.find((e) => e.t === 'reviveu')?.tick).toBeGreaterThanOrEqual(ticksDe(5000));
  });
});
