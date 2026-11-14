// Marco 41 (14/11/2026, D-169): as passagens entre as regiões do Mundo. A faixa é a mesma nas duas regiões (célula a
// célula e enfeite a enfeite), nada do gerador cai dentro dela, os monstros não entram e ninguém fere ninguém lá.

import { describe, expect, it } from 'vitest';
import { BALANCE_PADRAO } from '../../src/core/contexto';
import { criarEstado } from '../../src/core/estado';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { alvoOfensivoValido } from '../../src/combat/acao';
import { imuneADano } from '../../src/combat/efeitos';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { posicionar, type Entidade } from '../../src/entities/entidade';
import { recolherComitiva, soltarComitiva } from '../../src/mundo/comitiva';
import { lerLugar, montarLugar } from '../../src/mundo/lugares';
import { LADOS, ladoOposto, vizinha, type Reino } from '../../src/mundo/reino';
import { modoPorId } from '../../src/core/conteudo';
import { MODO_MUNDO } from '../../src/mundo/sala-mundo';
import { gerarExterior } from '../../src/world/gerador-exterior';
import { podePisarNoRefugio } from '../../src/world/refugio';
import { emPassagem, processarPassagens } from '../../src/world/passagem';
import { celulaDaFaixa, LARGURA_PASSAGEM, PROFUNDIDADE_PASSAGEM, tipoDaPassagem } from '../../src/world/passagens-exterior';
import { CONTEUDO } from '../apoio/fases';

function obter<T>(v: T | undefined | null, nome: string): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

const REINOS: Reino[] = [...CONTEUDO.reinos.values()];
const REINO = obter(CONTEUDO.reinos.get('reino_central'), 'reino');

describe('passagens entre as regiões (D-169)', () => {
  it('a faixa é igual nas duas vizinhas, célula a célula e nos enfeites', () => {
    for (const reino of REINOS) {
      const gerados = new Map(reino.regioes.map((r) => [r.id, gerarExterior(reino, r)]));
      for (const regiao of reino.regioes) {
        const a = obter(gerados.get(regiao.id), regiao.id);
        const na = regiao.tamanho ?? reino.tamanhoRegiao;
        for (const lado of LADOS) {
          const outra = vizinha(reino, regiao, lado);
          if (!outra) continue;
          const b = obter(gerados.get(outra.id), outra.id);
          const nb = outra.tamanho ?? reino.tamanhoRegiao;
          const fa = obter(a.faixas.find((f) => f.lado === lado), `${regiao.id} ${lado}`);
          const fb = obter(b.faixas.find((f) => f.lado === ladoOposto(lado)), `${outra.id} oposto`);
          expect(fa.tipo).toBe(fb.tipo);
          const enfeitesB = new Map(b.enfeites.map((d) => [`${d.x},${d.y}`, d]));
          for (let d = 0; d < PROFUNDIDADE_PASSAGEM; d++) {
            for (let u = -3; u < LARGURA_PASSAGEM + 3; u++) {
              const ca = celulaDaFaixa(na, lado, u, d);
              const cb = celulaDaFaixa(nb, ladoOposto(lado), u, PROFUNDIDADE_PASSAGEM - 1 - d);
              expect(a.fase.mapa[ca.y]?.[ca.x], `${regiao.id}→${outra.id} u${u} d${d}`).toBe(b.fase.mapa[cb.y]?.[cb.x]);
              const ea = a.enfeites.find((x) => x.x === ca.x && x.y === ca.y);
              const eb = enfeitesB.get(`${cb.x},${cb.y}`);
              expect(ea?.tipo).toBe(eb?.tipo);
            }
          }
        }
      }
    }
  });

  it('o corredor é andável de ponta a ponta e nada do gerador cai na passagem', () => {
    for (const reino of REINOS) {
      for (const regiao of reino.regioes) {
        const ex = gerarExterior(reino, regiao);
        const n = regiao.tamanho ?? reino.tamanhoRegiao;
        const fase = { passagens: ex.faixas.map((f) => f.area) };
        for (const f of ex.faixas) {
          for (let d = 0; d <= PROFUNDIDADE_PASSAGEM; d++) {
            const c = celulaDaFaixa(n, f.lado, Math.floor(LARGURA_PASSAGEM / 2), d);
            expect([',', '.', '='], `${regiao.id} ${f.lado} d${d}`).toContain(ex.fase.mapa[c.y]?.[c.x]);
          }
        }
        for (const i of ex.fase.inimigos ?? []) expect(emPassagem(fase, i.x, i.y), `${regiao.id} inimigo`).toBe(false);
        for (const p of ex.pontos) {
          const c = p.tipo === 'estrutura' ? p.porta : p;
          expect(emPassagem(fase, c.x, c.y), `${regiao.id} ${p.tipo}`).toBe(false);
        }
        for (const o of ex.fase.objetos ?? []) expect(emPassagem(fase, o.x, o.y), `${regiao.id} objeto`).toBe(false);
        // E nenhuma armadilha embaixo de um monstro (ele a disparava sozinho, parado).
        for (const o of ex.fase.objetos ?? []) for (const i of ex.fase.inimigos ?? []) expect(Math.max(Math.abs(o.x - i.x), Math.abs(o.y - i.y)), `${regiao.id} armadilha`).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('o tipo segue o par de biomas, dos dois lados', () => {
    expect(tipoDaPassagem('campo', 'deserto')).toBe('canion');
    expect(tipoDaPassagem('pantano', 'floresta')).toBe('passarela');
    expect(tipoDaPassagem('neve', 'colinas')).toBe('desfiladeiro');
    expect(tipoDaPassagem('ruinas', 'campo')).toBe('portao');
    expect(tipoDaPassagem('colinas', 'campo')).toBe('ponte');
    expect(tipoDaPassagem('floresta', 'campo')).toBe('trilha');
    expect(tipoDaPassagem('campo', 'campo')).toBe('trilha');
  });

  it('o monstro não entra, ninguém de dentro é alvo nem fere, e a trégua deixa imune', () => {
    const lugar = obter(lerLugar(REINO, 'regiao:vila_do_centro'), 'lugar');
    const { ctx, exterior } = montarLugar(CONTEUDO, REINO, lugar, modoPorId(CONTEUDO, MODO_MUNDO));
    const faixa = obter(exterior?.faixas.find((f) => f.lado === 'oeste'), 'faixa');
    const n = lugar.tipo === 'regiao' ? (lugar.regiao.tamanho ?? REINO.tamanhoRegiao) : 0;
    const dentro = celulaDaFaixa(n, faixa.lado, 2, 8);
    const fora = celulaDaFaixa(n, faixa.lado, 2, PROFUNDIDADE_PASSAGEM + 2);
    const estado = criarEstado({ semente: 1, faseId: ctx.fase.id });
    const jogador = criarJogador(obter(CONTEUDO.classes.get('guerreiro'), 'classe'), 'p1', dentro.x, dentro.y, BALANCE_PADRAO);
    const monstro = criarInimigo(obter(CONTEUDO.presets.get('goblin'), 'goblin'), 'm1', fora.x, fora.y, BALANCE_PADRAO);
    monstro.ia = monstro.ia ? { ...monstro.ia, alvoId: 'p1' } : null;
    estado.entidades.push(jogador, monstro);
    // O monstro não pisa na passagem, nem perseguindo; quem já está dentro sai livre.
    expect(podePisarNoRefugio(estado, ctx, monstro, dentro.x, dentro.y)).toBe(false);
    posicionar(monstro, dentro.x, dentro.y + 1);
    expect(podePisarNoRefugio(estado, ctx, monstro, fora.x, fora.y)).toBe(true);
    posicionar(monstro, fora.x, fora.y);
    // Ninguém de dentro é alvo, e quem está dentro não fere quem está fora.
    expect(alvoOfensivoValido(estado, ctx, monstro, jogador)).toBe(false);
    expect(alvoOfensivoValido(estado, ctx, jogador, monstro)).toBe(false);
    // A trégua (renovada a cada tick) deixa imune a qualquer dano, também ao periódico.
    processarPassagens(estado, ctx);
    expect(imuneADano(jogador, estado.tick)).toBe(true);
    expect(imuneADano(monstro, estado.tick)).toBe(false);
    posicionar(jogador, fora.x + 1, fora.y);
    expect(alvoOfensivoValido(estado, ctx, monstro, jogador)).toBe(true);
    estado.tick += 60;
    processarPassagens(estado, ctx);
    expect(imuneADano(jogador, estado.tick)).toBe(false);
  });
});

describe('invocações na troca de sala (D-169)', () => {
  const ctxBase = (() => {
    const lugar = obter(lerLugar(REINO, 'regiao:vila_do_centro'), 'lugar');
    return montarLugar(CONTEUDO, REINO, lugar, modoPorId(CONTEUDO, MODO_MUNDO)).ctx;
  })();

  function servo(dono: Entidade, id: string, extra: Partial<NonNullable<Entidade['invocacao']>> = {}): Entidade {
    const e = criarInimigo(obter(CONTEUDO.presets.get('servo_ossuario'), 'preset'), id, 4, 3, BALANCE_PADRAO);
    e.equipe = dono.equipe;
    e.invocacao = { donoId: dono.id, expiraTick: 1600, dominado: false, comportamento: 'agressivo', avatar: false, golpesRestantes: 0, abates: 0, criadoTick: 0, nivelDominacao: 0, ...extra };
    return e;
  }

  it('a isca viaja com os golpes que aguenta, o servo do posto segue como comum e os efeitos contam a viagem', () => {
    const antiga = criarEstado({ semente: 1, faseId: 'a' });
    antiga.tick = 1000;
    const dono = criarJogador(obter(CONTEUDO.classes.get('necromante'), 'classe'), 'p1', 3, 3, BALANCE_PADRAO);
    const isca = servo(dono, 'v1', { avatar: true, comportamento: 'isca', golpesRestantes: 3 });
    isca.tipo = 'avatar';
    const posto = servo(dono, 'v2', { posto: { x: 40, y: 40, ateTick: 1500 }, nevoaAteTick: 1100 });
    posto.efeitos.push({ tipo: 'acelerado', ateTick: 1300, origemId: 'p1', valor: 0, pct: 30, proximoTick: 0, interno: null, ref: null, inicioTick: 990, acumulos: 1 });
    antiga.entidades.push(dono, isca, posto);
    const comitiva = recolherComitiva(antiga, dono.id);
    expect(comitiva).toHaveLength(2);

    const nova = criarEstado({ semente: 2, faseId: 'b' });
    nova.tick = 50;
    const chegou = criarJogador(obter(CONTEUDO.classes.get('necromante'), 'classe'), 'p9', 6, 6, BALANCE_PADRAO);
    nova.entidades.push(chegou);
    const saida: EventoSimulacao[] = [];
    const novos = soltarComitiva(nova, ctxBase, chegou, comitiva, saida, 100);
    const iscaNova = obter(nova.entidades.find((e) => e.id === novos.get('v1')), 'isca');
    expect(iscaNova.tipo).toBe('avatar');
    expect(iscaNova.invocacao?.golpesRestantes).toBe(3);
    expect(iscaNova.invocacao?.expiraTick).toBe(50 + 600 - 100);
    const postoNovo = obter(nova.entidades.find((e) => e.id === novos.get('v2')), 'posto');
    expect(postoNovo.invocacao?.posto).toBeUndefined();
    expect(postoNovo.invocacao?.nevoaAteTick).toBe(50 + 100 - 100);
    const acelerado = obter(postoNovo.efeitos.find((f) => f.tipo === 'acelerado'), 'acelerado');
    expect(acelerado.ateTick).toBe(50 + 300 - 100);
    expect(acelerado.origemId).toBe('p9');
  });

  it('a que venceu durante a viagem não chega', () => {
    const antiga = criarEstado({ semente: 1, faseId: 'a' });
    antiga.tick = 1000;
    const dono = criarJogador(obter(CONTEUDO.classes.get('necromante'), 'classe'), 'p1', 3, 3, BALANCE_PADRAO);
    antiga.entidades.push(dono, servo(dono, 'v1', { expiraTick: 1050 }));
    const nova = criarEstado({ semente: 2, faseId: 'b' });
    const chegou = criarJogador(obter(CONTEUDO.classes.get('necromante'), 'classe'), 'p2', 6, 6, BALANCE_PADRAO);
    nova.entidades.push(chegou);
    soltarComitiva(nova, ctxBase, chegou, recolherComitiva(antiga, dono.id), [], 60);
    expect(nova.entidades.filter((e) => e.invocacao)).toHaveLength(0);
  });
});
