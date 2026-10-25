// Marco 24 (24/10/2026, D-095): a sintonia do Guerreiro pelas famílias das gerais de tecla e as vertentes dele.
import { describe, expect, it } from 'vitest';
import { protecaoInicial, pulsarAura } from '../../src/combat/ajustes-classes';
import { aplicarEfeito } from '../../src/combat/efeitos';
import { encherFuria } from '../../src/combat/frenesi';
import { furiaAtual } from '../../src/combat/furia';
import { construirEfeito } from '../../src/combat/registro-efeitos';
import { furiaDaGeral, inamovivelPelaSintonia, processarCarcereiros, prolongarFrenesi, reforcoDaGeral } from '../../src/combat/sintonia-guerreiro';
import { lerComando } from '../../src/arena/protocolo';
import { definicaoDe } from '../../src/combat/compilar-habilidade';
import { habilidadeDoAtor } from '../../src/combat/perfil';
import { criarEstado } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { efeitosDeSintonia } from '../../src/progression/sintonia';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

function obter<T>(v: T | undefined | null, nome = 'valor'): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

function cena(gerais: (string | null)[] = [], nivel = 10) {
  const ctx = contexto(faseDeTexto(SALA_ABERTA));
  const estado = criarEstado({ semente: 7, faseId: 'teste' });
  const j = criarJogador(obter(CONTEUDO.classes.get('guerreiro')), 'j', 3, 5, ctx.balance);
  j.nivel = nivel;
  const bolsa = obter(j.bolsa);
  gerais.forEach((id, i) => {
    if (id && !bolsa.conhecidas.some((c) => c.id === id)) bolsa.conhecidas.push({ id, rank: 1, caminhos: [] });
    bolsa.barra[2 + i] = id;
  });
  j.habilidades = bolsa.barra.filter((id): id is string => id !== null);
  const b = criarInimigo(obter(CONTEUDO.presets.get('boneco')), 'b', 4, 5, ctx.balance);
  b.hp = b.hpMax = 5000;
  estado.entidades.push(j, b);
  const eventos: EventoSimulacao[] = [];
  const tick = (cmd?: Parameters<typeof lerComando>[0]) => {
    simular(estado, ctx, cmd ? [{ tick: estado.tick, entidadeId: 'j', cmd: obter(lerComando(cmd)) }] : [], eventos, DT_MS);
  };
  const origem = { id: 'j', x: j.x, y: j.y };
  return { ctx, estado, j, b, eventos, tick, origem };
}

const hab = (c: ReturnType<typeof cena>, id: string) => obter(habilidadeDoAtor(c.ctx, c.j, id), id);

describe('sintonia do Guerreiro (D-095)', () => {
  it('as 9 famílias do Guerreiro e as 3 vertentes têm mecânica nos dados', () => {
    expect(Object.keys(obter(CONTEUDO.sintonia.efeitosDaClasse.guerreiro))).toHaveLength(9);
    for (const v of CONTEUDO.sintonia.vertentes.filter((x) => x.classe === 'guerreiro')) expect(CONTEUDO.sintonia.efeitosDaVertente[v.id]?.length).toBeGreaterThan(0);
  });

  it('técnica: a geral técnica que fere enche a fúria; com Domínio, o dobro; a de outra família, nada', () => {
    const um = cena(['golpe_atordoante', null, null, null]);
    expect(furiaDaGeral(um.ctx, um.j, hab(um, 'golpe_atordoante'), 0)).toBe(12);
    expect(furiaDaGeral(um.ctx, um.j, hab(um, 'bola_de_fogo'), 0)).toBe(0);
    const dois = cena(['golpe_atordoante', 'investida', null, null]);
    expect(furiaDaGeral(dois.ctx, dois.j, hab(dois, 'golpe_atordoante'), 0)).toBe(24);
    // No jogo: o golpe atordoante no boneco sobe a barra.
    um.j.autoAtaque = false;
    um.tick({ t: 'usarHabilidade', id: 'golpe_atordoante', alvo: 'b' });
    for (let i = 0; i < 60; i++) um.tick();
    expect(furiaAtual(um.ctx, um.j, um.estado.tick)).toBeGreaterThan(0);
  });

  it('arcana: a aura alcança +1 célula', () => {
    const c = cena(['seta_arcana', null, null, null]);
    c.b.x = 6;
    pulsarAura(c.estado, c.ctx, c.j, c.b, 100, c.eventos);
    expect(c.b.hp).toBeLessThan(c.b.hpMax);
    const sem = cena();
    sem.b.x = 6;
    pulsarAura(sem.estado, sem.ctx, sem.j, sem.b, 100, sem.eventos);
    expect(sem.b.hp).toBe(sem.b.hpMax);
  });

  it('suporte: no Frenesi, as curas e os escudos gerais rendem o dobro', () => {
    const c = cena(['curar', null, null, null]);
    expect(reforcoDaGeral(c.ctx, c.j, hab(c, 'curar'), c.estado.tick)).toBe(1);
    encherFuria(c.estado, c.ctx, c.j, c.origem, c.eventos);
    expect(reforcoDaGeral(c.ctx, c.j, hab(c, 'curar'), c.estado.tick)).toBe(2);
    expect(reforcoDaGeral(c.ctx, c.j, hab(c, 'brado'), c.estado.tick)).toBe(1);
  });

  it('fogo e psíquico: o pulso queima sempre e, no Frenesi, faz hesitar', () => {
    const c = cena(['bola_de_fogo', 'agulha_mental', null, null]);
    pulsarAura(c.estado, c.ctx, c.j, c.b, 100, c.eventos);
    expect(c.b.efeitos.some((f) => f.tipo === 'queimando')).toBe(true);
    expect(c.b.efeitos.some((f) => f.tipo === 'sem_ataque')).toBe(false);
    encherFuria(c.estado, c.ctx, c.j, c.origem, c.eventos);
    pulsarAura(c.estado, c.ctx, c.j, c.b, 100, c.eventos);
    expect(c.b.efeitos.some((f) => f.tipo === 'sem_ataque')).toBe(true);
  });

  it('veneno: um hostil envenenado perto já liga a resistência contra grupos (fora do Frenesi)', () => {
    const c = cena(['flecha_venenosa', null, null, null], 30);
    expect(protecaoInicial(c.estado, c.ctx, c.j, c.b)).toBe(1);
    aplicarEfeito(c.estado, c.ctx, c.b, construirEfeito('envenenado', { valor: 1, duracaoMs: 5000 }), c.origem, null, c.eventos);
    expect(protecaoInicial(c.estado, c.ctx, c.j, c.b)).toBeLessThan(1);
  });

  it('terra: no Frenesi, nem empurrão nem puxão', () => {
    const c = cena(['estaca_de_pedra', null, null, null]);
    expect(inamovivelPelaSintonia(c.ctx, c.j, c.estado.tick)).toBe(false);
    encherFuria(c.estado, c.ctx, c.j, c.origem, c.eventos);
    expect(inamovivelPelaSintonia(c.ctx, c.j, c.estado.tick)).toBe(true);
    aplicarEfeito(c.estado, c.ctx, c.j, construirEfeito('empurrao', { valor: 2 }), { id: 'b', x: c.b.x, y: c.b.y }, null, c.eventos);
    expect(c.j.x).toBe(3);
  });

  it('sombra: encher a fúria deixa o próximo golpe pelas costas', () => {
    const c = cena(['punhal_das_sombras', null, null, null]);
    encherFuria(c.estado, c.ctx, c.j, c.origem, c.eventos);
    expect(c.j.costasGarantidas).toBe(true);
    c.b.olhando = 'E';
    c.j.autoAtaque = false;
    c.tick({ t: 'ataqueBasico', alvo: 'b' });
    for (let i = 0; i < 120 && !c.eventos.some((e) => e.t === 'impacto'); i++) c.tick();
    expect(c.eventos.some((e) => e.t === 'impacto' && e.alvoId === 'b' && e.costas)).toBe(true);
    expect(c.j.costasGarantidas).toBeUndefined();
  });

  it('sagrado: a cura da aura alcança os aliados a até 2 células', () => {
    const c = cena(['lanca_radiante', null, null, null], 30);
    const aliado = criarJogador(obter(CONTEUDO.classes.get('mago')), 'a', 2, 5, c.ctx.balance);
    aliado.hp = 1;
    c.estado.entidades.push(aliado);
    c.j.hp = 1;
    pulsarAura(c.estado, c.ctx, c.j, c.b, 400, c.eventos);
    expect(aliado.hp).toBeGreaterThan(1);
  });

  it('Berserker: no Frenesi, cada queimado perto prolonga o Frenesi, até +3 s', () => {
    const c = cena(['bola_de_fogo', 'anel_de_chamas', 'golpe_atordoante', 'investida']);
    expect(efeitosDeSintonia(c.ctx, c.j, 'frenesiPorEstadoPerto', 0)).toHaveLength(0);
    encherFuria(c.estado, c.ctx, c.j, c.origem, c.eventos);
    expect(efeitosDeSintonia(c.ctx, c.j, 'frenesiPorEstadoPerto', c.estado.tick)).toHaveLength(1);
    const fim = obter(c.j.furia?.frenesiAteTick);
    aplicarEfeito(c.estado, c.ctx, c.b, construirEfeito('queimando', { valor: 1, duracaoMs: 5000 }), c.origem, null, c.eventos);
    for (let i = 0; i < 20; i++) prolongarFrenesi(c.estado, c.ctx, c.j, [c.b]);
    expect(obter(c.j.furia?.frenesiAteTick) - fim).toBe(3000 / DT_MS);
  });

  it('Carcereiro: o desafiado que chega a 1 célula fica enraizado, uma vez por desafio', () => {
    const c = cena(['estaca_de_pedra', 'abalo_sismico', 'agulha_mental', 'telecinese']);
    expect(definicaoDe(c.ctx, 'telecinese')?.familiaGeral).toBe('psiquico');
    aplicarEfeito(c.estado, c.ctx, c.b, construirEfeito('desafiado', { pct: 15, duracaoMs: 3000 }), c.origem, null, c.eventos);
    processarCarcereiros(c.estado, c.ctx, c.eventos);
    expect(c.b.efeitos.some((f) => f.tipo === 'enraizado')).toBe(true);
    c.b.efeitos = c.b.efeitos.filter((f) => f.tipo !== 'enraizado');
    processarCarcereiros(c.estado, c.ctx, c.eventos);
    expect(c.b.efeitos.some((f) => f.tipo === 'enraizado')).toBe(false);
  });
});
