import { describe, expect, it } from 'vitest';
import { comKit, CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { clonarEstado, criarEstado } from '../../src/core/estado';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import type { Entidade } from '../../src/entities/entidade';
import { chaveServo, colherMorto, processarServosNecromantes } from '../../src/combat/necromancia';
import { processarMortes } from '../../src/progression/morte';
import { ticksDe } from '../../src/core/tempo';
import { aplicarEfeito, multiplicadorCuraRecebida, multiplicadorDanoCausado } from '../../src/combat/efeitos';
import { construirEfeito } from '../../src/combat/registro-efeitos';
import { iniciarAcao, processarAcoes } from '../../src/combat/acao';
import { resolverHabilidade } from '../../src/combat/compilar-habilidade';
import { prepararSequencia } from '../../src/combat/sequencias';
import { aplicarImpacto } from '../../src/combat/golpe';
import { perfilPara } from '../../src/combat/perfil';
import { lerRegistro, MIGRACOES, VERSAO_SCHEMA } from '../../src/save/esquema';
import { lerIdItemBase } from '../../src/progression/gerar-item-base';
import { estadoPublico } from '../../src/arena/estado-publico';
import { GeradorDePatches, aplicarPatch } from '../../src/arena/patches';

function obter<T>(v: T | null | undefined): T { if (v == null) throw Error('ausente'); return v; }
function cena() {
  const ctx = contexto(faseDeTexto(SALA_ABERTA), undefined, 'cooperativo');
  const estado = criarEstado({ faseId: 'teste', semente: 9 });
  const j = criarJogador(obter(CONTEUDO.classes.get('necromante')), 'j', 5, 5, ctx.balance);
  j.equipe = 'grupo'; j.autoAtaque = false;
  estado.entidades.push(j);
  const eventos: EventoSimulacao[] = [];
  const passiva = () => { processarServosNecromantes(estado, ctx, eventos); };
  const meus = () => estado.entidades.filter((e) => e.hp > 0 && e.invocacao?.donoId === j.id);
  const servo = () => obter(meus().find((e) => e.invocacao?.necromancia === 'servo'));
  const npc = (id = 'n') => {
    const e = criarInimigo(obter(CONTEUDO.presets.get('goblin')), id, 7, 5, ctx.balance);
    e.equipe = 'monstros'; estado.entidades.push(e); return e;
  };
  const matar = (e: Entidade, por?: Entidade) => { e.hp = 0; e.participacao = por ? [{ id: por.id, tick: estado.tick }] : []; processarMortes(estado, ctx, eventos); };
  const aplicar = (e: Entidade, tipo: Parameters<typeof construirEfeito>[0], campos: Parameters<typeof construirEfeito>[1] = {}) => { aplicarEfeito(estado, ctx, e, construirEfeito(tipo, campos), j, null, eventos); };
  return { ctx, estado, j, eventos, passiva, meus, servo, npc, matar, aplicar };
}

describe('Necromante: passiva e colheita', () => {
  it('nasce com um servo mesmo sem inimigos; não cria duplicatas nem exige skill equipada', () => {
    const c = cena(); c.j.habilidades = []; c.passiva(); c.passiva();
    expect(c.meus()).toHaveLength(1);
    expect(c.servo().xpBase).toBe(0);
    expect(c.servo().equipe).toBe(c.j.equipe);
    expect(c.servo().invocacao?.expiraTick).toBeGreaterThan(1_000_000);
  });
  it('a ficha de treino sem bolsa também mantém a passiva da classe', () => {
    const c = cena(); c.j.bolsa = null; c.passiva();
    expect(c.meus()).toHaveLength(1);
  });
  it('servo retorna após oito segundos da morte, e não enquanto o dono estiver morto', () => {
    const c = cena(); c.passiva(); c.estado.tick = 5000; c.matar(c.servo());
    c.passiva(); expect(c.meus()).toHaveLength(0);
    c.estado.tick += ticksDe(8000) - 1; c.passiva(); expect(c.meus()).toHaveLength(0);
    c.estado.tick++; c.j.hp = 0; c.passiva(); expect(c.meus()).toHaveLength(0);
    c.j.hp = 1; c.passiva(); expect(c.meus()).toHaveLength(1);
    expect(c.estado.recargas[chaveServo(c.j.id)]).toBe(c.estado.tick);
  });
  it('abates próprios e dos mortos geram reanimados com aparência do inimigo e XP para o dono', () => {
    const c = cena(); c.passiva();
    c.matar(c.npc('a'), c.j);
    expect(c.meus()).toHaveLength(2);
    const a = obter(c.meus().find((e) => e.invocacao?.necromancia === 'reanimado'));
    expect(a.invocacao?.modeloOriginal).toBe('goblin');
    expect(a.invocacao?.expiraTick).toBe(c.estado.tick + ticksDe(c.ctx.balance.necromancia.duracaoMortoMs));
    const xp = c.j.xp; c.matar(c.npc('b'), c.servo());
    expect(c.meus()).toHaveLength(3); expect(c.j.xp).toBeGreaterThan(xp);
    c.matar(a, c.j); expect(c.meus()).toHaveLength(2);
  });
  it('máximo de dez mortos (marco 22), com espaço reservado ao servo; sem abates distantes ou de outros', () => {
    const c = cena(); c.passiva();
    for (let i = 0; i < 14; i++) c.matar(c.npc(String(i)), c.j);
    expect(c.meus()).toHaveLength(10);
    c.matar(c.servo()); c.matar(c.npc('extra'), c.j); expect(c.meus()).toHaveLength(9);
    c.estado.tick += ticksDe(8000); c.passiva(); expect(c.meus()).toHaveLength(10);
    const d = cena(); const longe = d.npc(); longe.x = 30; d.matar(longe, d.j);
    expect(d.meus()).toHaveLength(0);
    d.matar(d.npc('outro')); expect(d.meus()).toHaveLength(0);
  });
  it('aliado deixa eco com modelo e equipamento, e revive como personagem independente', () => {
    const c = cena(); c.passiva();
    const aliado = criarJogador(obter(CONTEUDO.classes.get('mago')), 'aliado', 6, 5, c.ctx.balance);
    aliado.equipe = c.j.equipe; c.estado.entidades.push(aliado);
    c.matar(aliado);
    const eco = obter(c.meus().find((e) => e.invocacao?.necromancia === 'eco'));
    expect(eco.invocacao?.modeloOriginal).toBe('mago'); expect(eco.bolsa).toBeNull();
    expect(aliado.morto).toBe(true); expect(aliado.invocacao).toBeNull();
    c.estado.tick = aliado.reviverEmTick; processarMortes(c.estado, c.ctx, c.eventos);
    expect(aliado.morto).toBe(false); expect(aliado.hp).toBeGreaterThan(0);
    expect(c.meus()).toContain(eco);
    c.matar(aliado); expect(c.meus().filter((e) => e.invocacao?.necromancia === 'eco')).toHaveLength(1);
  });
  it('morte de invocações não gera novos mortos nem ecos em cascata', () => {
    const c = cena(); c.passiva(); const servo = c.servo(); c.matar(servo, c.j);
    colherMorto(c.estado, c.ctx, servo, c.j, c.eventos);
    expect(c.meus()).toHaveLength(0);
  });
  it('uma morte não cria cópias para dois Necromantes e dono morto não reanima abates', () => {
    const c = cena();
    const outro = criarJogador(obter(CONTEUDO.classes.get('necromante')), 'outro', 4, 5, c.ctx.balance);
    outro.equipe = c.j.equipe; c.estado.entidades.push(outro);
    const aliado = criarJogador(obter(CONTEUDO.classes.get('mago')), 'aliado', 5, 6, c.ctx.balance);
    aliado.equipe = c.j.equipe; c.estado.entidades.push(aliado); c.matar(aliado);
    expect(c.estado.entidades.filter((e) => e.invocacao?.necromancia === 'eco')).toHaveLength(1);
    c.j.hp = 0; c.matar(c.npc('fim'), c.j);
    expect(c.estado.entidades.some((e) => e.invocacao?.necromancia === 'reanimado')).toBe(false);
  });
  it('dominação existente transforma o original sem gerar reanimado duplicado', () => {
    const c = cena(); c.passiva(); const n = c.npc();
    c.aplicar(n, 'dominar_ao_matar', { duracaoMs: 8000 }); c.matar(n, c.j);
    expect(n.invocacao?.dominado).toBe(true);
    expect(c.meus().some((e) => e.invocacao?.necromancia === 'reanimado')).toBe(false);
  });
});

describe('rituais, combos e Trevas', () => {
  it('Dízimo transfere vida real, não drena jogador nem invocação alheia e respeita redução de cura', () => {
    const c = cena(); c.passiva(); c.j.hp -= 30;
    const s = c.servo(), antes = s.hp, vida = c.j.hp;
    c.aplicar(c.j, 'envenenado', { pct: 50, valor: 0, duracaoMs: 5000 });
    c.aplicar(c.j, 'drenar_invocacao', { valor: 18 });
    expect(s.hp).toBe(antes - 18); expect(c.j.hp).toBe(vida + 9);
    c.j.hp = c.j.hpMax; c.aplicar(c.j, 'drenar_invocacao', { valor: 18 }); expect(s.hp).toBe(antes - 18);
    s.invocacao = { ...obter(s.invocacao), donoId: 'outro' }; c.j.hp -= 10;
    c.aplicar(c.j, 'drenar_invocacao', { valor: 18 }); expect(c.j.hp).toBe(c.j.hpMax - 10);
  });
  it('recusa Dízimo sem gastar mana ou recarga com vida cheia (havendo morto) ou sem vaga para erguer', () => {
    const c = cena(); c.passiva(); const mana = c.j.mana;
    expect(iniciarAcao(c.estado, c.ctx, c.j, 'dizimo_vital', undefined, c.eventos)).toBe(false);
    // Marco 22 (D-090): sem morto ao alcance, o Dízimo ergue um; sem vaga, recusa.
    c.servo().x = 30;
    // Uma vaga só, ocupada pelo servo distante.
    const ctxSemVaga = { ...c.ctx, modo: { ...c.ctx.modo, limites: { ...c.ctx.modo.limites, invocacoesPorJogador: 1 } }, balance: { ...c.ctx.balance, necromancia: { ...c.ctx.balance.necromancia, servosExtras: 0 } } };
    c.j.hp--; expect(iniciarAcao(c.estado, ctxSemVaga, c.j, 'dizimo_vital', undefined, c.eventos)).toBe(false);
    expect(c.eventos.filter((e) => e.t === 'acaoRecusada').map((e) => e.motivo)).toEqual(['vida_cheia', 'sem_invocacao']);
    expect(c.j.mana).toBe(mana); expect(c.estado.recargas).toEqual({});
  });
  it('sem morto ao alcance, o Dízimo ergue o servo caído, mesmo com a vida cheia, e libera o retorno dele', () => {
    const c = cena(); c.passiva(); c.matar(c.servo());
    expect(c.meus()).toHaveLength(0);
    expect(c.estado.recargas[chaveServo(c.j.id)]).toBeGreaterThan(c.estado.tick);
    expect(iniciarAcao(c.estado, c.ctx, c.j, 'dizimo_vital', undefined, c.eventos)).toBe(true);
    c.estado.tick = obter(c.j.acao).lancamentoTick; processarAcoes(c.estado, c.ctx, c.eventos);
    expect(c.servo().invocacao?.necromancia).toBe('servo');
    expect(c.estado.recargas[chaveServo(c.j.id)]).toBeLessThanOrEqual(c.estado.tick);
    expect(c.j.hp).toBe(c.j.hpMax);
  });
  it('com o servo vivo mas longe, o Dízimo ergue um reanimado', () => {
    const c = cena(); c.passiva();
    const s = c.servo(); s.x = 13;
    c.aplicar(c.j, 'drenar_invocacao', { valor: 18 });
    expect(c.meus().map((e) => e.invocacao?.necromancia).sort()).toEqual(['reanimado', 'servo']);
  });
  it('o morto além da distância de retorno volta para o lado do Necromante', () => {
    const c = cena(); c.passiva();
    const s = c.servo(); s.x = 5 + c.ctx.balance.necromancia.distanciaRetorno; s.y = 5;
    c.passiva();
    expect(s.x).toBe(5 + c.ctx.balance.necromancia.distanciaRetorno);
    s.x = 5 + c.ctx.balance.necromancia.distanciaRetorno + 1;
    c.passiva();
    expect(Math.max(Math.abs(s.x - c.j.x), Math.abs(s.y - c.j.y))).toBeLessThanOrEqual(2);
    expect(c.eventos.filter((e) => e.t === 'invocacaoRetornou')).toEqual([expect.objectContaining({ id: s.id, donoId: c.j.id })]);
  });
  it('conjuração real do Dízimo pode consumir um servo e arma seu retorno', () => {
    const c = cena(); c.passiva(); c.servo().hp = 4; c.j.hp -= 20;
    expect(iniciarAcao(c.estado, c.ctx, c.j, 'dizimo_vital', undefined, c.eventos)).toBe(true);
    c.estado.tick = obter(c.j.acao).lancamentoTick; processarAcoes(c.estado, c.ctx, c.eventos);
    processarMortes(c.estado, c.ctx, c.eventos);
    expect(c.meus()).toHaveLength(0); expect(c.estado.recargas[chaveServo(c.j.id)]).toBe(c.estado.tick + ticksDe(8000));
  });
  it('os dois combos do kit de antes dependem de acerto e de dreno efetivo', () => {
    for (const id of ['sepultura_aberta', 'tributo_da_legiao']) {
      const c = cena(); c.passiva(); const alvo = c.npc(); alvo.hp = alvo.hpMax = 10000; c.j.hp -= 20;
      // Marco 24: as quatro skills do kit de antes (garras e comando agora vêm de livro).
      comKit(c.j, ['dardo_funesto', 'dizimo_vital', 'garras_do_ossuario', 'comando_sepulcral']);
      let acao = 1;
      for (const skill of obter(CONTEUDO.combos.get(id)).sequencia) {
        const base = obter(resolverHabilidade(c.ctx, skill));
        const destino = base.politicaAlvo === 'proprio' ? c.j : alvo;
        const hab = prepararSequencia(c.estado, c.ctx, c.j, base, acao, destino, destino);
        aplicarImpacto(c.estado, c.ctx, destino, { acaoId: acao++, hab, fonte: { id: c.j.id, equipe: c.j.equipe, bonusAtributo: 0, carisma: 10, multRolagem: 1, potencia: 1, multDano: 1, multCura: 1, d20Minimo: 20 }, indice: 0, mira: destino }, c.eventos);
        c.estado.tick++;
      }
      expect(c.eventos.some((e) => e.t === 'comboFeito' && e.combo === id), id).toBe(true);
    }
  });
  it('Trevas unifica Sombra, preserva Eclipse e aplica Definhando com afinidade da classe', () => {
    const c = cena(); expect(CONTEUDO.elementos.has('trevas')).toBe(true);
    expect([...CONTEUDO.elementos.keys()]).not.toContain('sombra');
    expect(obter(CONTEUDO.habilidades.get('punhal_das_sombras')).elemento).toBe('trevas');
    expect(obter(CONTEUDO.interacoes.sinergias.find((s) => s.id === 'eclipse')).elemento).toBe('trevas');
    const h = obter(resolverHabilidade(c.ctx, 'dardo_funesto'));
    expect(perfilPara(c.ctx, c.j, h)).toMatchObject({ danoPct: -65, custoPct: -20 });
    c.aplicar(c.j, 'definhando', { pct: 20, duracaoMs: 4000 });
    expect(multiplicadorDanoCausado(c.j, 0)).toBe(0.8); expect(multiplicadorCuraRecebida(c.j, 0)).toBe(0.8);
  });
  it.each([17, 18])('save v%i migra para Trevas sem reativar enxames concluídos', (versaoSchema) => {
    const c = cena();
    const estado = { ...c.estado, entidades: [{ ...c.j, aparencia: { elementoArma: 'sombra' } }] };
    const faseRef = { tipo: 'gerada', id: 'gerada-1', numero: 1, params: {
      id: 'gerada-1', nome: 'Profundezas', semente: 41, salas: 12, nivelInimigos: 5, matizGraus: 28,
      largura: 60, altura: 40, ambientesVivos: true, eventos: [], enxameConcluido: true,
    } };
    const lido = lerRegistro({ versaoSchema, slot: 1, faseRef, estado,
      fasesVisitadas: { 'oficial:fase-02': estado }, referenciasFases: { 'gerada:gerada-1': faseRef }, certificado: null });
    expect(lido.ok).toBe(true);
    if (!lido.ok) return;
    expect(lido.registro.versaoSchema).toBe(VERSAO_SCHEMA);
    expect(lido.registro.estado.entidades[0]?.aparencia?.elementoArma).toBe('trevas');
    expect(lido.registro.fasesVisitadas['oficial:fase-02']?.entidades[0]?.aparencia?.elementoArma).toBe('trevas');
    expect(lido.registro.faseRef).toEqual(faseRef);
    expect(lido.registro.referenciasFases?.['gerada:gerada-1']).toEqual(faseRef);
  });

  it('saves/patches conservam mortos e a migração converte o elemento antigo sem trocar IDs', () => {
    const c = cena(); c.passiva(); c.matar(c.npc(), c.j);
    const clone = clonarEstado(c.estado); expect(clone.entidades).toEqual(c.estado.entidades);
    const gerador = new GeradorDePatches();
    const publico = estadoPublico(c.estado); gerador.gerar(publico);
    obter(c.meus()[0]).hp--; const novo = estadoPublico(c.estado);
    expect(aplicarPatch(publico, obter(gerador.gerar(novo)))).toEqual(novo);
    const antigo = { estado: { entidades: [{ aparencia: { elementoArma: 'sombra' } }] }, fasesVisitadas: { a: { fonte: { elemento: 'sombra' } } }, itemId: 'ib_cajado_comum_sombra_1_1', certificado: { dados: { elemento: 'sombra' }, assinatura: 'preservada' } };
    const migrado = obter(MIGRACOES[18])(antigo);
    expect(JSON.stringify(migrado)).toContain('"elementoArma":"trevas"'); expect(JSON.stringify(migrado)).toContain('"elemento":"trevas"');
    expect(migrado.itemId).toBe(antigo.itemId);
    expect(migrado.certificado).toEqual(antigo.certificado);
    expect(lerIdItemBase(antigo.itemId)?.elemento).toBe('trevas'); expect(VERSAO_SCHEMA).toBe(28);
    expect(CONTEUDO.itens.get(antigo.itemId)).toMatchObject({ id: antigo.itemId, elemento: 'trevas' });
  });
});
