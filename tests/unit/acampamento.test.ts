// Marco 44 (15/11/2026, D-178): a fogueira de acampamento: montar com lenha, acender, descansar, a caixa e o renascer.
import { describe, expect, it } from 'vitest';
import { modoPorId } from '../../src/core/conteudo';
import type { ContextoSimulacao } from '../../src/core/contexto';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { ticksDe } from '../../src/core/tempo';
import { aplicarEfeito } from '../../src/combat/efeitos';
import { construirEfeito } from '../../src/combat/registro-efeitos';
import { criarJogador } from '../../src/entities/fabrica';
import { apagadaDeAcampamento, conferirAcampamentos, processarAcampamentos } from '../../src/mundo/acampamento';
import { acampamentoValido, garantirAcampamento, registrarAcampamentos, renascerNoAcampamento } from '../../src/mundo/acampamento-sala';
import { fichaNova } from '../../src/mundo/ficha-mundo';
import { lerLugar, montarLugar } from '../../src/mundo/lugares';
import { interagirNoMundo } from '../../src/mundo/objetos-mundo';
import { MODO_MUNDO } from '../../src/mundo/sala-mundo';
import { usarItem } from '../../src/progression/inventario';
import { passavel } from '../../src/world/fase';
import { fogoAceso } from '../../src/world/fogo-aceso';
import { emRefugio } from '../../src/world/refugio';
import { CONTEUDO } from '../apoio/fases';

function cena() {
  const reino = CONTEUDO.reinos.get('reino_central');
  if (!reino) throw new Error('reino');
  const lugar = lerLugar(reino, 'regiao:campos_do_oeste');
  if (!lugar) throw new Error('lugar');
  const m = montarLugar(CONTEUDO, reino, lugar, modoPorId(CONTEUDO, MODO_MUNDO));
  const ctx: ContextoSimulacao = { ...m.ctx, modo: { ...m.ctx.modo, escuro: 1 } };
  const estado = m.estado;
  estado.entidades = [];
  estado.objetos = [];
  const classe = CONTEUDO.classes.get('mago');
  if (!classe) throw new Error('classe');
  // Uma célula livre fora da vila, longe das bordas.
  const livre = (x: number, y: number) => [0, 1, -1].every((dx) => [0, 1, -1].every((dy) => passavel(ctx.fase, x + dx, y + dy) && !emRefugio(ctx.fase, x + dx, y + dy)));
  let x = 40;
  let y = 40;
  for (let k = 0; k < 4000 && !livre(x, y); k++) [x, y] = [30 + (k % 60), 30 + Math.floor(k / 60)];
  const eu = criarJogador(classe, 'p1', x, y, ctx.balance);
  if (eu.bolsa) eu.bolsa.personagemId = 'pers1';
  estado.entidades.push(eu);
  return { reino, ctx, estado, eu };
}

function montar() {
  const c = cena();
  const bolsa = c.eu.bolsa;
  if (!bolsa) throw new Error('bolsa');
  bolsa.mochila.push({ invId: 'l1', itemId: 'lenha', qtd: 1, ref: null });
  const saida: EventoSimulacao[] = [];
  usarItem(c.estado, c.eu, c.ctx, 'l1', saida);
  const fogo = c.estado.objetos.find((o) => o.tipo === 'fogueira');
  if (!fogo) throw new Error(`sem fogueira: ${JSON.stringify(saida.filter((e) => e.t === 'itemRecusado'))}`);
  return { ...c, fogo, saida };
}

describe('a fogueira de acampamento (D-178)', () => {
  it('a lenha monta a fogueira apagada com a caixa ao lado, e a lenha é gasta', () => {
    const { estado, eu, fogo } = montar();
    expect(eu.bolsa?.mochila.some((m) => m.itemId === 'lenha')).toBe(false);
    expect(estado.objetos.some((o) => o.tipo === 'caixa_acampamento')).toBe(true);
    expect(apagadaDeAcampamento(fogo, estado.tick)).toBe(true);
    expect(fogoAceso(fogo, estado.tick)).toBe(false);
  });

  it('apagada, pede a tocha acesa; com ela, acende', () => {
    const { ctx, estado, eu, fogo } = montar();
    expect(interagirNoMundo(estado, ctx, eu, fogo, [])).toBe('fogo_apagado');
    aplicarEfeito(estado, ctx, eu, construirEfeito('tocha', { duracaoMs: 60_000 }), { id: eu.id, x: eu.x, y: eu.y }, null, []);
    const saida: EventoSimulacao[] = [];
    expect(interagirNoMundo(estado, ctx, eu, fogo, saida)).toBeNull();
    expect(fogoAceso(fogo, estado.tick)).toBe(true);
    expect(saida.some((e) => e.t === 'acampamentoAceso' && e.dono === 'pers1')).toBe(true);
  });

  it('uma skill de fogo mirada nela acende', () => {
    const { ctx, estado, eu, fogo } = montar();
    const saida: EventoSimulacao[] = [{ t: 'acaoIniciada', tick: 0, acaoId: 1, atorId: eu.id, habilidadeId: 'bola_de_fogo', chave: 'bola_de_fogo@1', alvoId: null, alvoX: fogo.x, alvoY: fogo.y, inicioTick: 0, lancamentoTick: 0, impactoPrevistoTick: 0 }];
    processarAcampamentos(estado, ctx, saida, 0);
    expect(fogoAceso(fogo, estado.tick)).toBe(true);
  });

  it('à noite, descansar perto do fogo cura e, ao clarear, dá o bônus do amanhecer', () => {
    const { ctx, estado, eu, fogo } = montar();
    fogo.valor = estado.tick + ticksDe(600_000);
    eu.hp = 1;
    const a = ctx.balance.mundo.acampamento;
    for (let s = 0; s < a.descansoMinS; s++) conferirAcampamentos(estado, ctx, 1, () => false);
    expect(eu.hp).toBeGreaterThan(1);
    expect(eu.efeitos.find((f) => f.tipo === 'descansado')?.valor).toBe(a.descansoMinS);
    conferirAcampamentos(estado, ctx, 0, () => false);
    expect(eu.efeitos.some((f) => f.tipo === 'descansado')).toBe(false);
    expect(eu.efeitos.find((f) => f.tipo === 'bonus_dano')?.pct).toBe(a.bonusDanoPct);
  });

  it('o fogo aceso à noite chama monstros', () => {
    const { ctx, estado, fogo } = montar();
    fogo.valor = estado.tick + ticksDe(600_000);
    let chamados = 0;
    for (let s = 0; s < 600; s++) {
      estado.tick += 30;
      fogo.valor = estado.tick + 100;
      conferirAcampamentos(estado, ctx, 1, () => { chamados++; return true; });
    }
    expect(chamados).toBeGreaterThan(0);
  });

  it('a ficha guarda o acampamento aceso: renasce nele, a sala refaz a fogueira e, vencido, a caixa vai ao banco', () => {
    const { reino, ctx, estado, fogo } = montar();
    const ficha = fichaNova(ctx, reino, 'mago', 'Teste', 'pers1');
    if (!ficha) throw new Error('ficha');
    const saida: EventoSimulacao[] = [];
    fogo.valor = 0;
    saida.push({ t: 'acampamentoAceso', tick: estado.tick, objetoId: fogo.objetoId, dono: 'pers1', x: fogo.x, y: fogo.y, ateTick: estado.tick + ticksDe(60_000) });
    registrarAcampamentos(saida, 'campos_do_oeste', (d) => (d === 'pers1' ? ficha : undefined), 1000, estado.tick, ctx);
    expect(renascerNoAcampamento(ficha, 2000)).toEqual({ regiao: 'campos_do_oeste', x: fogo.x, y: fogo.y });
    estado.objetos = [];
    garantirAcampamento(estado, ctx, ficha, 'campos_do_oeste', 'pers1', 2000);
    expect(estado.objetos.filter((o) => o.ref === 'acampamento:pers1').map((o) => o.tipo).sort()).toEqual(['caixa_acampamento', 'fogueira']);
    ficha.acampamento?.caixa.itens.push({ invId: 'b1', itemId: 'tocha', qtd: 2, ref: null });
    expect(acampamentoValido(ficha, 1000 + ctx.balance.mundo.acampamento.duraMin * 60_000 + 1)).toBeNull();
    expect(ficha.banco.itens.some((i) => i.itemId === 'tocha')).toBe(true);
  });
});
