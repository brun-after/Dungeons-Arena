import { describe, expect, it } from 'vitest';
import { acaoBloqueada, aplicarEfeito, bonusAtaqueBasico, imuneADano, movimentoBloqueado, multiplicadorDanoCausado, projeteisAtravessam } from '../../src/combat/efeitos';
import { normalizarEfeito } from '../../src/combat/normalizar-efeito';
import {
  construirEfeito,
  elegiveisParaOrbe,
  REGISTRO_EFEITOS,
  sortearEfeitoDeOrbe,
  TIPOS_EFEITO,
  type DefinicaoEfeito,
  type EfeitoCanonico,
  type TipoEfeito,
} from '../../src/combat/registro-efeitos';
import type { Comando } from '../../src/core/comandos';
import { BALANCE_PADRAO, type Balance } from '../../src/core/contexto';
import { buscarEntidade, criarEstado } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { criarRng } from '../../src/core/rng';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import { ticksDe } from '../../src/core/tempo';
import { Leitor } from '../../src/core/validar';
import { chavesDeOrbe } from '../../src/editor/grade';
import type { Entidade } from '../../src/entities/entidade';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { lerRegistro, VERSAO_SCHEMA } from '../../src/save/esquema';
import { bloqueia } from '../../src/world/colisao';
import { largarOrbeEfeito } from '../../src/world/objetos';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

function obter<T>(v: T | undefined | null, nome: string): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

/** Jogador em (3,5) e um goblin (sem IA ativa no primeiro tick) em (5,5), na sala aberta. */
function cenario(balance: Balance = BALANCE_PADRAO) {
  const ctx = contexto(faseDeTexto(SALA_ABERTA), balance);
  const estado = criarEstado({ semente: 5, faseId: 'teste' });
  estado.entidades.push(criarJogador(obter(CONTEUDO.classes.get('aventureiro'), 'classe'), 'j', 3, 5, balance));
  const goblin = criarInimigo(obter(CONTEUDO.presets.get('boneco'), 'boneco'), 'g', 5, 5, balance);
  estado.entidades.push(goblin);
  const eventos: EventoSimulacao[] = [];
  const ent = (id: string): Entidade => obter(buscarEntidade(estado, id), id);
  const tick = (cmds: [string, Comando][] = []) => {
    simular(estado, ctx, cmds.map(([entidadeId, cmd]) => ({ tick: estado.tick, entidadeId, cmd })), eventos, DT_MS);
  };
  const ticks = (n: number) => {
    for (let i = 0; i < n; i++) tick();
  };
  const aplicar = (id: string, tipo: TipoEfeito, parcial: Partial<Omit<EfeitoCanonico, 'tipo'>> = {}, mira: { x: number; y: number } | null = null) => {
    const origem = ent('j');
    aplicarEfeito(estado, ctx, ent(id), construirEfeito(tipo, parcial), { id: origem.id, x: origem.x, y: origem.y }, mira, eventos);
  };
  return { ctx, estado, eventos, ent, tick, ticks, aplicar };
}

describe('registro (§2.8)', () => {
  it('tem os 26 tipos da spec, os 10 do marco 14 e os 5 do marco 18, com os pesos de orbe', () => {
    expect(TIPOS_EFEITO).toHaveLength(41);
    const pesos = Object.fromEntries(elegiveisParaOrbe().map((d) => [d.id, d.pesoOrbe]));
    expect(pesos).toEqual({
      cura_periodica: 20,
      bonus_dano: 18,
      ab_dano: 14,
      ab_recarga: 10,
      recuperar_recurso: 8,
      ab_alcance: 8,
      ab_multi_alvo: 6,
      imune_dano: 4,
      fantasma: 2,
      atravessar: 2,
      rastro_dano: 2,
    });
  });

  it('um tipo novo elegível entra no sorteio do orbe sem tocar em mais nada', () => {
    const novo: DefinicaoEfeito = { ...REGISTRO_EFEITOS.bonus_dano, id: 'bonus_dano', pesoOrbe: 1000 };
    const registro = { so_o_novo: novo };
    expect(elegiveisParaOrbe(registro).map((d) => d.pesoOrbe)).toEqual([1000]);
    expect(sortearEfeitoDeOrbe(criarRng(1), registro)?.tipo).toBe('bonus_dano');
  });

  it('o editor lista exatamente os elegíveis do registro', () => {
    const efeitos = chavesDeOrbe().filter((c) => c.startsWith('efeito:'));
    expect(efeitos).toEqual(elegiveisParaOrbe().map((d) => `efeito:${d.id}`));
  });

  it('o sorteio do orbe segue os pesos (10 mil sorteios)', () => {
    const rng = criarRng(42);
    const contagem = new Map<string, number>();
    for (let i = 0; i < 10_000; i++) {
      const e = obter(sortearEfeitoDeOrbe(rng), 'efeito');
      contagem.set(e.tipo, (contagem.get(e.tipo) ?? 0) + 1);
    }
    const total = elegiveisParaOrbe().reduce((s, d) => s + d.pesoOrbe, 0);
    for (const d of elegiveisParaOrbe()) {
      const esperado = (d.pesoOrbe / total) * 10_000;
      expect(Math.abs((contagem.get(d.id) ?? 0) - esperado)).toBeLessThan(Math.max(60, esperado * 0.12));
    }
  });
});

describe('normalização (§2.8)', () => {
  it('objeto combinado vira uma entrada por componente, sem campos cruzados', () => {
    const l = new Leitor('teste');
    const r = normalizarEfeito({ atordoar: 1500, dano_periodico: 3, bonus_dano: { pct: 40 }, duracaoMs: 4000 }, l);
    expect(l.erros).toEqual([]);
    expect(r).toEqual([
      { tipo: 'atordoar', duracaoMs: 1500, valor: 0, pct: 0, em: 'alvo', interno: null, ref: null },
      { tipo: 'dano_periodico', duracaoMs: 4000, valor: 3, pct: 0, em: 'alvo', interno: null, ref: null },
      { tipo: 'bonus_dano', duracaoMs: 4000, valor: 0, pct: 40, em: 'alvo', interno: null, ref: null },
    ]);
  });

  it('forma canônica, padrão do registro e campo omitido valendo 0 quando outro foi dado', () => {
    const l = new Leitor('teste');
    expect(normalizarEfeito({ tipo: 'cura', pct: 40 }, l)).toEqual([{ tipo: 'cura', duracaoMs: 0, valor: 0, pct: 40, em: 'alvo', interno: null, ref: null }]);
    expect(normalizarEfeito({ cura_periodica: true }, l)).toEqual([construirEfeito('cura_periodica')]);
    expect(normalizarEfeito({ tipo: 'avanco', valor: 2, em: 'conjurador' }, l)[0]?.em).toBe('conjurador');
    expect(l.erros).toEqual([]);
  });

  it('aponta tipo desconhecido, campo estranho e efeito vazio', () => {
    const l = new Leitor('teste');
    normalizarEfeito({ veneno: 3 }, l);
    normalizarEfeito({ atordoar: { duracao: 3 } }, l);
    normalizarEfeito({ duracaoMs: 100 }, l);
    normalizarEfeito({ tipo: 'nada' }, l);
    expect(l.erros.join('\n')).toMatch(/desconhecido "veneno"/);
    expect(l.erros.join('\n')).toMatch(/campo desconhecido "duracao"/);
    expect(l.erros.join('\n')).toMatch(/sem componente/);
    expect(l.erros.join('\n')).toMatch(/desconhecido "nada"/);
  });
});

describe('efeitos com duração', () => {
  it('reaplicar estende a duração e fica com o maior valor; nunca encurta', () => {
    const c = cenario();
    c.aplicar('g', 'dano_periodico', { duracaoMs: 4000, valor: 2 });
    c.aplicar('g', 'dano_periodico', { duracaoMs: 1000, valor: 5 });
    const f = obter(c.ent('g').efeitos[0], 'efeito');
    expect(f.ateTick).toBe(ticksDe(4000));
    expect(f.valor).toBe(5);
    expect(c.ent('g').efeitos).toHaveLength(1);
  });

  it('expira no tick certo', () => {
    const c = cenario();
    c.aplicar('j', 'sem_movimento', { duracaoMs: 500 });
    expect(movimentoBloqueado(c.ent('j'), c.estado.tick)).toBe(true);
    c.ticks(ticksDe(500) + 1);
    expect(c.ent('j').efeitos).toHaveLength(0);
  });

  it('dano_periodico: a cada 1000 ms, inclusive no último; respeita imunidade; dá participação', () => {
    const c = cenario();
    const hp = c.ent('g').hp;
    c.aplicar('g', 'dano_periodico', { duracaoMs: 3000, valor: 2 });
    c.ticks(ticksDe(3000) + 2);
    expect(c.ent('g').hp).toBe(hp - 6);
    expect(c.ent('g').participacao.map((p) => p.id)).toContain('j');
    c.aplicar('g', 'imune_dano');
    c.aplicar('g', 'dano_periodico', { duracaoMs: 2000, valor: 2 });
    c.ticks(ticksDe(2000) + 2);
    expect(c.ent('g').hp).toBe(hp - 6);
  });

  it('cura_periodica e recuperar_recurso restauram por intervalo, sem passar do máximo', () => {
    const c = cenario();
    const j = c.ent('j');
    j.hp = 10;
    j.mana = 0;
    c.aplicar('j', 'cura_periodica', { duracaoMs: 2000, valor: 5 });
    c.aplicar('j', 'recuperar_recurso', { duracaoMs: 2000, valor: 3 });
    c.ticks(ticksDe(2000) + 1);
    expect(c.ent('j').hp).toBe(20);
    // A regeneração natural de mana (1/s) também corre: 2 s × (3 + 1).
    expect(c.ent('j').mana).toBe(8);
    expect(c.eventos.filter((e) => e.t === 'efeitoResultado').length).toBe(4);
  });

  it('bloqueios: atordoar (tudo), silenciar (mágicas), sem_ataque (físicas), sem_movimento', () => {
    const c = cenario();
    const j = c.ent('j');
    const t = c.estado.tick;
    c.aplicar('j', 'silenciar');
    expect([acaoBloqueada(j, t, 'magico'), acaoBloqueada(j, t, 'fisico')]).toEqual([true, false]);
    j.efeitos = [];
    c.aplicar('j', 'sem_ataque');
    expect([acaoBloqueada(j, t, 'magico'), acaoBloqueada(j, t, 'fisico'), movimentoBloqueado(j, t)]).toEqual([false, true, false]);
    j.efeitos = [];
    c.aplicar('j', 'atordoar');
    expect([acaoBloqueada(j, t, 'magico'), acaoBloqueada(j, t, 'fisico'), movimentoBloqueado(j, t)]).toEqual([true, true, true]);
  });

  it('bonus_dano e modificar_dano: somam entre si e se multiplicam', () => {
    const c = cenario();
    const j = c.ent('j');
    c.aplicar('j', 'bonus_dano', { pct: 50 });
    c.aplicar('j', 'modificar_dano', { pct: 20 });
    expect(multiplicadorDanoCausado(j, c.estado.tick)).toBeCloseTo(1.5 * 0.8);
  });

  it('imune_dano zera o dano do golpe, mas não impede a cura', () => {
    const c = cenario();
    const g = c.ent('g');
    c.aplicar('g', 'imune_dano');
    expect(imuneADano(g, c.estado.tick)).toBe(true);
    g.hp = 5;
    c.aplicar('g', 'cura', { valor: 3 });
    expect(g.hp).toBe(8);
  });

  it('os quatro ab_* mudam o ataque básico (dano, recarga, alcance, alvos)', () => {
    const c = cenario();
    const j = c.ent('j');
    c.aplicar('j', 'ab_dano', { valor: 4 });
    c.aplicar('j', 'ab_recarga', { pct: 90 });
    c.aplicar('j', 'ab_alcance', { valor: 2 });
    c.aplicar('j', 'ab_multi_alvo', { valor: 1 });
    expect(bonusAtaqueBasico(j, c.estado.tick)).toEqual({ dano: 4, recargaPct: 75, alcance: 2, alvosExtras: 1 });
  });

  it('ab_alcance deixa o ataque básico acertar mais longe', () => {
    const c = cenario();
    c.ent('g').x = c.ent('g').destinoX = 7;
    c.tick([['j', { t: 'ataqueBasico', alvo: 'g' }]]);
    expect(c.eventos.find((e) => e.t === 'acaoRecusada')).toMatchObject({ motivo: 'fora_de_alcance' });
    c.aplicar('j', 'ab_alcance', { valor: 2 });
    c.tick([['j', { t: 'ataqueBasico', alvo: 'g' }]]);
    expect(c.eventos.some((e) => e.t === 'acaoIniciada' && e.atorId === 'j')).toBe(true);
  });

  it('ab_multi_alvo acerta alvos extras no alcance', () => {
    const c = cenario();
    const outro = criarInimigo(obter(CONTEUDO.presets.get('boneco'), 'boneco'), 'g2', 4, 6, BALANCE_PADRAO);
    c.estado.entidades.push(outro);
    c.ent('g').x = c.ent('g').destinoX = 4;
    c.aplicar('j', 'ab_multi_alvo', { valor: 1 });
    c.tick([['j', { t: 'ataqueBasico', alvo: 'g' }]]);
    c.ticks(ticksDe(1000));
    const alvos = new Set(c.eventos.flatMap((e) => (e.t === 'impacto' ? [e.alvoId] : [])));
    expect([...alvos].sort()).toEqual(['g', 'g2']);
  });

  it('fantasma: não colide com entidades; atravessar: projéteis perfuram', () => {
    const c = cenario();
    const [j, g] = [c.ent('j'), c.ent('g')];
    const regras = { jogadorBloqueiaJogador: true, jogadorBloqueiaInimigo: true };
    expect(bloqueia(j, g, regras)).toBe(true);
    c.aplicar('j', 'fantasma');
    expect(bloqueia(j, g, regras)).toBe(false);
    c.aplicar('j', 'atravessar');
    expect(projeteisAtravessam(j, c.estado.tick)).toBe(true);
  });
});

describe('instantâneos', () => {
  it('cura e recuperar_recurso sem duração: valor fixo + percentual, até o máximo', () => {
    const c = cenario();
    const j = c.ent('j');
    j.hp = 1;
    j.mana = 0;
    c.aplicar('j', 'cura', { valor: 5, pct: 10 });
    c.aplicar('j', 'recuperar_recurso', { duracaoMs: 0, valor: 1, pct: 50 });
    expect(j.hp).toBe(1 + 5 + Math.round(j.hpMax * 0.1));
    expect(j.mana).toBe(1 + Math.round(j.manaMax * 0.5));
    expect(j.efeitos).toHaveLength(0);
  });

  it('teleporte só para célula livre e passável', () => {
    const c = cenario();
    c.aplicar('j', 'teleporte', {}, { x: 8, y: 8 });
    expect([c.ent('j').x, c.ent('j').y]).toEqual([8, 8]);
    c.aplicar('j', 'teleporte', {}, { x: 0, y: 0 });
    expect([c.ent('j').x, c.ent('j').y]).toEqual([8, 8]);
  });

  it('avanço vai em direção à mira, sem passar dela; empurrão afasta e para na parede', () => {
    const c = cenario();
    c.aplicar('j', 'avanco', { valor: 5 }, { x: 3, y: 2 });
    expect([c.ent('j').x, c.ent('j').y]).toEqual([3, 2]);
    // Goblin em (5,5), origem do empurrão em (3,2): sai na diagonal até encostar na parede.
    c.aplicar('g', 'empurrao', { valor: 10 });
    const g = c.ent('g');
    expect([g.x, g.y]).toEqual([10, 10]);
    expect(g.destinoX).toBe(g.x);
  });
});

describe('orbe de efeito', () => {
  it('pisar no orbe aplica o efeito pelo dispatcher (o ofensivo chega armado, D-067)', () => {
    const c = cenario();
    largarOrbeEfeito(c.estado, construirEfeito('cura_periodica'), 3, 5, c.eventos);
    c.tick();
    expect(c.ent('j').efeitos.map((f) => f.tipo)).toEqual(['cura_periodica']);
    expect(c.estado.objetos).toHaveLength(0);
    largarOrbeEfeito(c.estado, construirEfeito('bonus_dano'), 3, 5, c.eventos);
    c.tick();
    expect(c.ent('j').efeitos.map((f) => f.tipo)).toEqual(['cura_periodica']);
    expect(c.ent('j').buffsArmados.map((b) => b.efeito.tipo)).toEqual(['bonus_dano']);
  });

  it('inimigo solta orbe de efeito num sorteio próprio', () => {
    const balance = { ...BALANCE_PADRAO, drops: { ...BALANCE_PADRAO.drops, chanceOrbeHp: 0, chanceOrbeRecurso: 0, chanceItem: 0, chanceOrbeEfeito: 1, ouroPorXp: 0 } };
    const c = cenario(balance);
    const goblin = criarInimigo(obter(CONTEUDO.presets.get('goblin'), 'goblin'), 'gob', 7, 7, balance);
    goblin.hp = 0;
    c.estado.entidades.push(goblin);
    c.tick();
    expect(c.estado.objetos.map((o) => o.tipo)).toEqual(['orbe_efeito']);
  });
});

describe('conteúdo que exercita os efeitos', () => {
  it('as habilidades dos inimigos trazem os efeitos do 8A', () => {
    const efeitosDe = (id: string) => obter(CONTEUDO.habilidades.get(id), id).efeitos.map((e) => e.tipo);
    expect(efeitosDe('teia')).toEqual(['sem_movimento']);
    expect(efeitosDe('marca_de_area')).toEqual(['dano_periodico']);
    expect(efeitosDe('golpe_viscoso')).toEqual(['modificar_dano', 'rastro_efeito']);
    expect(efeitosDe('golpe_pesado')).toEqual(['empurrao']);
    expect(obter(CONTEUDO.habilidades.get('raio_vampirico'), 'raio').efeitos[0]).toMatchObject({ tipo: 'cura', em: 'conjurador' });
  });
});

describe('save v1 → v2', () => {
  it('um save da versão 1 abre com os campos novos neutros', () => {
    const c = cenario();
    c.aplicar('j', 'atordoar');
    const v1 = {
      versaoSchema: 1,
      slot: 1,
      criadoEm: 1,
      atualizadoEm: 2,
      faseRef: { tipo: 'oficial', id: 'fase-01' },
      nomeFase: 'Teste',
      estatisticas: { inimigosDerrotados: 0, mortes: 0 },
      estado: {
        ...c.estado,
        entidades: c.estado.entidades.map((e) => ({ ...e, efeitos: e.efeitos.map(({ tipo, ateTick, origemId }) => ({ tipo, ateTick, origemId })) })),
        objetos: [{ objetoId: 'f:0', tipo: 'orbe_hp', x: 1, y: 1, valor: 30, modo: 'pct', geracao: 0, itemId: null }],
        projeteis: [{ id: 1, acaoId: 1, donoId: 'j', equipeDono: 'x', habilidadeId: 'raio', x: 1, y: 1, dirX: 1, dirY: 0, restante: 3, velocidade: 8, bonusAtributo: 1, carisma: 10 }],
      },
    };
    const r = lerRegistro(v1);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.registro.versaoSchema).toBe(VERSAO_SCHEMA);
    expect(r.registro.estado.entidades.find((e) => e.id === 'j')?.efeitos[0]).toMatchObject({ tipo: 'atordoar', valor: 0, pct: 0, proximoTick: 0 });
    expect(r.registro.estado.objetos[0]?.efeito).toBeNull();
    expect(r.registro.estado.projeteis[0]).toMatchObject({ multDano: 1, atravessa: false, atingidos: [] });
  });
});
