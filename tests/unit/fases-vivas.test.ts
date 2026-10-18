// Fases vivas (17/10/2026): regressões de progressão, geração, autoria, armadilhas e teto de levas.
import { describe, expect, it } from 'vitest';
import campanha from '../../src/data/campanha.json';
import { aplicarEfeito } from '../../src/combat/efeitos';
import { processarGatilhos } from '../../src/combat/efeitos-fluxo';
import { construirEfeito } from '../../src/combat/registro-efeitos';
import { clonarEstado, criarEstado } from '../../src/core/estado';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { chaveDaFase, lerRegistro, VERSAO_SCHEMA, type RefFase, type RegistroProgresso } from '../../src/save/esquema';
import { faseSeguinte, estadoInicialDaFase, contextoDaFase, faseOficialOuGerada } from '../../src/save/fases-campanha';
import { chegadaNaFase, comRetorno, faseAnterior, referenciaConhecida } from '../../src/save/retorno';
import { avancarFase } from '../../src/save/transicao';
import { processarAmbientes } from '../../src/world/ambientes';
import { processarEnxame } from '../../src/world/enxame';
import { carregarFase, type FaseJson } from '../../src/world/fase';
import { catalogoDeGeracao, gerarFase, type ParametrosGeracao } from '../../src/world/gerador';
import { interagir } from '../../src/world/interacao';
import { alcancaveis } from '../../src/world/navegacao';
import { povoarFase } from '../../src/world/populacao';
import { processarPortas } from '../../src/world/portas';
import { validarFase } from '../../src/world/validacao-fase';
import { CONTEUDO, contexto, SALA_ABERTA } from '../apoio/fases';

const catalogo = catalogoDeGeracao(CONTEUDO, campanha.geradas.estoque);
const presets = new Set(CONTEUDO.presets.keys());
function obter<T>(v: T | null | undefined): T { if (v === null || v === undefined) throw Error('ausente'); return v; }
const parametros = (s: number, extra: Partial<ParametrosGeracao> = {}): ParametrosGeracao => ({
  id: `viva-${s}`, nome: 'Salas', semente: s, salas: 12, nivelInimigos: 5, matizGraus: 28,
  largura: 60, altura: 40, ambientesVivos: true, ...extra,
});
function cenario(extra: Partial<FaseJson> = {}) {
  const json: FaseJson = { id: 'sala', nome: 'Sala', ordem: 1, tipo: 'campanha', mapa: SALA_ABERTA, spawns: [{ x: 2, y: 2 }], ...extra };
  const ctx = contexto(carregarFase(json));
  const estado = criarEstado({ semente: 4, faseId: json.id });
  const j = criarJogador(obter(CONTEUDO.classes.get('aventureiro')), 'j', 2, 2, ctx.balance);
  estado.entidades.push(j);
  povoarFase(estado, ctx);
  const eventos: EventoSimulacao[] = [];
  return { estado, ctx, j, eventos };
}

describe('fases vivas e preservação da campanha', () => {
  it('100 sementes comuns e 100 espirais têm inimigos, ambientes e saídas válidos e alcançáveis', () => {
    for (const formato of ['salas', 'espiral'] as const) for (let s = 1; s <= 100; s++) {
      const json = gerarFase(parametros(s, { formato, ...(formato === 'espiral' && { largura: 84, altura: 56 }) }), catalogo);
      const v = validarFase(json, presets, CONTEUDO.itens);
      expect(v.ok, JSON.stringify(v.ok ? v.avisos : v.erros)).toBe(true);
      if (!v.ok) continue;
      const fase = carregarFase(v.fase), spawn = obter(fase.spawns[0]);
      const alcance = alcancaveis(fase, spawn);
      const saida = obter(fase.portaSaida);
      expect(alcance[saida.y * fase.largura + saida.x]).toBe(1);
      for (const p of [...fase.inimigos, ...fase.objetos, ...(fase.ambientes ?? [])]) expect(alcance[p.y * fase.largura + p.x]).toBe(1);
      expect(fase.objetos.some((o) => o.tipo === 'santuario')).toBe(true);
    }
  });

  it('a maioria das fases conserva salas e tamanho; só algumas têm enxame, mapa maior ou espiral', () => {
    let ref: RefFase = { tipo: 'oficial', id: 'fase-02' };
    let normais = 0, enxames = 0, espirais = 0, grandes = 0;
    for (let i = 0; i < 100; i++) {
      ref = obter(faseSeguinte(ref));
      if (ref.tipo !== 'gerada') throw Error('gerada');
      if (ref.params.formato === 'salas') normais++;
      if (ref.params.formato === 'espiral') espirais++;
      if ((ref.params.largura ?? 0) > 60) grandes++;
      if (ref.params.eventos?.includes('enxame')) enxames++;
    }
    expect(normais).toBeGreaterThan(85);
    expect(espirais).toBeGreaterThan(0);
    expect(grandes).toBeLessThan(30);
    expect(enxames).toBeGreaterThan(0);
    expect(enxames).toBeLessThan(25);
  });

  it('campos novos só entram em novas referências; o gerador legado conserva terreno e população', () => {
    const legado = parametros(27); delete legado.ambientesVivos;
    const viva = gerarFase({ ...legado, ambientesVivos: true }, catalogo);
    const antiga = gerarFase(legado, catalogo);
    expect(viva.mapa).toEqual(antiga.mapa);
    expect(viva.inimigos).toEqual(antiga.inimigos);
    expect(antiga.ambientes).toBeUndefined();
    expect(antiga.objetos?.some((o) => o.tipo === 'santuario')).toBe(false);
  });

  it('retorno funciona nas oficiais, nas aventuras e nas geradas, sem portal na fase inicial', () => {
    const c = cenario();
    expect(comRetorno(c.ctx.fase, { tipo: 'oficial', id: 'fase-01' }).portaRetorno).toBeUndefined();
    const fase = comRetorno(c.ctx.fase, { tipo: 'oficial', id: 'fase-02' });
    expect(faseAnterior({ tipo: 'oficial', id: 'fase-02' })).toEqual({ tipo: 'oficial', id: 'fase-01' });
    expect(faseAnterior({ tipo: 'aventura', id: 'a', indice: 3 })).toMatchObject({ indice: 2 });
    const eventos: EventoSimulacao[] = [{ t: 'moveu', tick: 0, id: c.j.id, x: 2, y: 2 }];
    processarPortas(c.estado, { ...c.ctx, fase }, eventos);
    expect(eventos.some((e) => e.t === 'saidaAlcancada' && e.retorno)).toBe(true);
    const parada: EventoSimulacao[] = [];
    processarPortas(c.estado, { ...c.ctx, fase }, parada);
    expect(parada).toEqual([]);
    expect(chegadaNaFase(fase, false)).not.toEqual(fase.portaRetorno);
  });

  it('ida e volta mantém objetos consumidos e parâmetros exatos após exportar/importar', () => {
    const c = cenario();
    const a: RefFase = { tipo: 'gerada', id: 'gerada-1', numero: 1, params: parametros(81, { id: 'gerada-1', estilo: ['PPPPPPPP0'] }) };
    const b = obter(faseSeguinte(a));
    const r: RegistroProgresso = { versaoSchema: VERSAO_SCHEMA, slot: 1, criadoEm: 0, atualizadoEm: 0, faseRef: a,
      nomeFase: 'A', estado: c.estado, estatisticas: { mortes: 0, inimigosDerrotados: 0 }, fasesVisitadas: {}, certificado: null };
    c.estado.objetos = [];
    const ida = avancarFase(r, { ref: b, nome: 'B', spawn: { x: 3, y: 3 }, novoEstado: () => criarEstado({ semente: 1, faseId: b.id }) }, 1);
    const lido = lerRegistro(JSON.parse(JSON.stringify(ida)));
    expect(lido.ok).toBe(true); if (!lido.ok) return;
    expect(faseAnterior(b, lido.registro.referenciasFases)).toEqual(a);
    expect(referenciaConhecida(a, lido.registro.referenciasFases)).toEqual(a);
    const jogador = obter(lido.registro.estado.entidades.find((e) => e.controlador !== 'ia'));
    jogador.hp = 17; jogador.mana = 8;
    const volta = avancarFase(lido.registro, { ref: a, nome: 'A', spawn: { x: 4, y: 4 }, novoEstado: () => { throw Error('não recriar'); } }, 2);
    expect(volta.estado.objetos).toEqual([]);
    expect(volta.estado.entidades.find((e) => e.id === jogador.id)).toMatchObject({ hp: 17, mana: 8 });
    expect(volta.referenciasFases?.[chaveDaFase(b)]).toEqual(b);
  });
});

describe('perigo, Sabedoria e Engenho', () => {
  it('santuário não toma a interação da loja quando ambos estão à mesma distância', () => {
    const c = cenario({ objetos: [{ tipo: 'santuario', x: 3.5 / 12, y: 2.5 / 12 }, { tipo: 'loja', x: 2.5 / 12, y: 3.5 / 12, estoque: ['pocao_vida'] }] });
    interagir(c.estado, c.ctx, c.j, c.eventos);
    expect(c.j.interacao?.tipo).toBe('loja');
    expect(c.estado.objetos[0]?.abertoTick).toBe(0);
  });
  const armadilha = { tipo: 'armadilha' as const, x: 3.5 / 12, y: 2.5 / 12, valor: 30, modo: 'rearme' as const, rearmeMs: 4500 };
  it('Engenho não converte armadilhas ocultas; uma revelada passa à equipe do jogador', () => {
    const c = cenario({ objetos: [armadilha] });
    aplicarEfeito(c.estado, c.ctx, c.j, construirEfeito('engenho'), { id: c.j.id, x: 2, y: 2 }, null, c.eventos);
    interagir(c.estado, c.ctx, c.j, c.eventos);
    const a = obter(c.estado.armadilhas[0]);
    expect(a.donoId).toBe('fase');
    a.reveladaPara.push(c.j.id);
    interagir(c.estado, c.ctx, c.j, c.eventos);
    expect(a.donoId).toBe(c.j.id);
    expect(a.equipeDono).toBe(c.j.equipe);
    expect(a.valor).toBe(30);
    expect(a.rearmeTicks).toBeGreaterThan(0);
    const hp = c.j.hp; c.j.x = a.x; c.j.y = a.y;
    processarGatilhos(c.estado, c.ctx, () => {}, c.eventos);
    expect(c.j.hp).toBe(hp);
    const goblin = criarInimigo(obter(CONTEUDO.presets.get('goblin')), 'inimigo', a.x, a.y, c.ctx.balance);
    c.estado.entidades.push(goblin);
    const antes = goblin.hp;
    processarGatilhos(c.estado, c.ctx, () => {}, c.eventos);
    expect(goblin.hp).toBeLessThan(antes);
    expect(c.eventos.find((e) => e.t === 'armadilhaDisparou')).toMatchObject({ x: a.x, y: a.y });
  });

  it('santuário dá o buff uma vez; sem ele, interagir inicia o desarme normal', () => {
    const c = cenario({ objetos: [{ tipo: 'santuario', x: 2.5 / 12, y: 3.5 / 12 }] });
    interagir(c.estado, c.ctx, c.j, c.eventos);
    expect(c.j.efeitos.some((f) => f.tipo === 'engenho')).toBe(true);
    expect(c.estado.objetos[0]?.abertoTick).toBeGreaterThan(0);
    const d = cenario({ objetos: [armadilha] });
    obter(d.estado.armadilhas[0]).reveladaPara.push(d.j.id);
    interagir(d.estado, d.ctx, d.j, d.eventos);
    expect(d.j.interacao?.tipo).toBe('desarme');
  });

  it('água e superfícies perigosas afetam os dois lados; fora delas o piso continua normal', () => {
    for (const [tipo, efeito] of [['agua', 'molhado'], ['brasas', 'queimando'], ['miasma', 'envenenado']] as const) {
      const c = cenario({ ambientes: [{ tipo, x: 2, y: 2, raio: 1 }] });
      const g = criarInimigo(obter(CONTEUDO.presets.get('goblin')), 'g', 3, 2, c.ctx.balance);
      const longe = criarInimigo(obter(CONTEUDO.presets.get('goblin')), 'longe', 7, 7, c.ctx.balance);
      c.estado.entidades.push(g, longe);
      processarAmbientes(c.estado, c.ctx, c.eventos);
      expect(c.j.efeitos.some((f) => f.tipo === efeito)).toBe(true);
      expect(g.efeitos.some((f) => f.tipo === efeito)).toBe(true);
      expect(longe.efeitos).toEqual([]);
    }
  });

  it('pisar entre os pulsos aplica o terreno imediatamente e respeita a recarga', () => {
    const c = cenario({ ambientes: [{ tipo: 'brasas', x: 2, y: 2, raio: 1 }] });
    c.estado.tick = 13;
    c.eventos.push({ t: 'moveu', tick: 13, id: c.j.id, x: 2, y: 2 });
    processarAmbientes(c.estado, c.ctx, c.eventos);
    expect(c.j.efeitos.some((f) => f.tipo === 'queimando')).toBe(true);
    const recarga = c.estado.recargas['terreno:j:0'];
    c.estado.tick++;
    c.eventos.push({ t: 'moveu', tick: 14, id: c.j.id, x: 2, y: 2 });
    processarAmbientes(c.estado, c.ctx, c.eventos);
    expect(c.estado.recargas['terreno:j:0']).toBe(recarga);
  });
});

describe('enxame limitado', () => {
  it('reservas não simulam IA; nascem em levas, respeitam o teto e sobrevivem à cópia do save', () => {
    const p = parametros(41, { salas: 20, eventos: ['enxame'] });
    const ref: RefFase = { tipo: 'gerada', id: p.id, numero: 1, params: p };
    const lido = contextoDaFase(CONTEUDO, faseOficialOuGerada(ref, CONTEUDO));
    expect(lido.ok).toBe(true); if (!lido.ok) return;
    const ctx = lido.ctx, estado = estadoInicialDaFase(ctx);
    expect(estado.entidades.length).toBeLessThanOrEqual(ctx.balance.ambiente.enxameInicio);
    expect(estado.reservaEnxame?.length).toBeGreaterThan(20);
    const alvo = obter(ctx.fase.inimigos[obter(estado.reservaEnxame?.[0])]);
    const j = criarJogador(obter(CONTEUDO.classes.get('aventureiro')), 'j', alvo.x + 6, alvo.y, ctx.balance);
    estado.entidades.push(j);
    const quantos = estado.entidades.length;
    processarEnxame(estado, ctx);
    expect(estado.entidades.length).toBeGreaterThan(quantos);
    expect(estado.entidades.length - quantos).toBeLessThanOrEqual(ctx.balance.ambiente.enxameLeva);
    for (let t = 0; t < 30; t++) { estado.tick += 60; processarEnxame(estado, ctx); }
    expect(estado.entidades.filter((e) => e.controlador === 'ia').length).toBeLessThanOrEqual(ctx.balance.ambiente.enxameAtivos);
    const copia = clonarEstado(estado);
    expect(copia.reservaEnxame).toEqual(estado.reservaEnxame);
    expect(copia.reservaEnxame).not.toBe(estado.reservaEnxame);
  });
});
