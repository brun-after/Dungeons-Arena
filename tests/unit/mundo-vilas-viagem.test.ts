// Marco 38 (08/11/2026, D-141 e D-142): o guerreiro que conjura andando, o peso FOR/INT, a pedra de retorno com
// círculo, os mercadores errantes, a fusão elemental, os prédios das vilas e o deserto entre os reinos.

import { describe, expect, it } from 'vitest';
import { encadeioDoGuerreiro } from '../../src/combat/acao';
import { resolverHabilidade } from '../../src/combat/compilar-habilidade';
import { BALANCE_PADRAO } from '../../src/core/contexto';
import { criarEstado } from '../../src/core/estado';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { criarJogador } from '../../src/entities/fabrica';
import { ErrantesDaRegiao } from '../../src/mundo/errantes';
import { REF_ERRANTE } from '../../src/mundo/objetos-mundo';
import { PAPEIS_OBRIGATORIOS, regiaoPorId, reinoDoConteudo, vizinha, type Reino } from '../../src/mundo/reino';
import { idDoCirculo, RetornosDaSala } from '../../src/mundo/retorno';
import { multiplicadorDeRolagem } from '../../src/progression/efeitos-atributo';
import { fundivel, idFundido, lerIdFundido } from '../../src/progression/fusao-elemental';
import { ticksDe } from '../../src/core/tempo';
import { gerarExterior } from '../../src/world/gerador-exterior';
import { novoObjeto } from '../../src/world/objeto-novo';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

function obter<T>(v: T | null | undefined): T {
  if (v == null) throw new Error('Conteúdo ausente');
  return v;
}
const reino = (): Reino => obter(CONTEUDO.reinos.get('reino_central'));

function cena(classe = 'guerreiro') {
  const ctx = contexto(faseDeTexto(SALA_ABERTA));
  const estado = criarEstado({ semente: 1, faseId: 'teste' });
  const j = criarJogador(obter(CONTEUDO.classes.get(classe)), 'j', 3, 3, ctx.balance);
  estado.entidades.push(j);
  return { ctx, estado, j };
}

describe('D-141: peso dos atributos e o guerreiro', () => {
  it('a rolagem das habilidades pesa 35% Força e 65% Inteligência', () => {
    const base = { vontade: 10, destreza: 10, constituicao: 10, inteligencia: 10, sabedoria: 10, carisma: 10 };
    const comFor = multiplicadorDeRolagem({ ...base, vontade: 30 }, BALANCE_PADRAO);
    const comInt = multiplicadorDeRolagem({ ...base, inteligencia: 30 }, BALANCE_PADRAO);
    const k = BALANCE_PADRAO.atributos.efeitos.rolagemPorPontoPct / 100;
    expect(comFor).toBeCloseTo(1 + 20 * 0.35 * k);
    expect(comInt).toBeCloseTo(1 + 20 * 0.65 * k);
  });

  it('a habilidade logo depois do básico sai 2× mais rápida, só para o guerreiro', () => {
    const c = cena();
    const hab = obter(resolverHabilidade(c.ctx, obter(c.j.habilidades.find((h) => h !== c.j.ataqueBasico))));
    expect(encadeioDoGuerreiro(c.estado, c.ctx, c.j, hab)).toBe(1);
    c.j.ultimoBasicoTick = c.estado.tick;
    c.estado.tick += ticksDe(500);
    expect(encadeioDoGuerreiro(c.estado, c.ctx, c.j, hab)).toBe(2);
    c.estado.tick += ticksDe(1000);
    expect(encadeioDoGuerreiro(c.estado, c.ctx, c.j, hab)).toBe(1);
    const mago = cena('mago');
    const habMago = obter(resolverHabilidade(mago.ctx, obter(mago.j.habilidades.find((h) => h !== mago.j.ataqueBasico))));
    mago.j.ultimoBasicoTick = mago.estado.tick;
    expect(encadeioDoGuerreiro(mago.estado, mago.ctx, mago.j, habMago)).toBe(1);
  });
});

describe('D-142: pedra de retorno com círculo', () => {
  function conjurar() {
    const c = cena();
    const retornos = new RetornosDaSala();
    const saida: EventoSimulacao[] = [];
    retornos.iniciar(c.estado, c.ctx, c.j, saida);
    return { ...c, retornos };
  }

  it('abre o círculo, deixa inalvejável e leva à pedra no fim', () => {
    const c = conjurar();
    expect(c.estado.objetos.some((o) => o.objetoId === idDoCirculo(c.j.id) && o.tipo === 'circulo_retorno')).toBe(true);
    expect(c.j.invisivelAteTick).toBeGreaterThan(c.estado.tick);
    expect(c.j.efeitos.some((f) => f.tipo === 'imune_dano')).toBe(true);
    c.estado.tick += ticksDe(4900);
    expect(c.retornos.conferir(c.estado, c.ctx)).toEqual([]);
    c.estado.tick += ticksDe(100);
    expect(c.retornos.conferir(c.estado, c.ctx)).toEqual([{ entidadeId: c.j.id, fim: 'concluido' }]);
    expect(c.estado.objetos.some((o) => o.tipo === 'circulo_retorno')).toBe(false);
  });

  it('sair do círculo no começo cancela e devolve a proteção', () => {
    const c = conjurar();
    c.estado.tick += ticksDe(1000);
    c.j.px += 3;
    expect(c.retornos.conferir(c.estado, c.ctx)).toEqual([{ entidadeId: c.j.id, fim: 'cancelado' }]);
    expect(c.j.invisivelAteTick).toBeLessThanOrEqual(c.estado.tick);
    expect(c.j.efeitos.some((f) => f.tipo === 'imune_dano')).toBe(false);
  });

  it('sair no último segundo desvia', () => {
    const c = conjurar();
    c.estado.tick += ticksDe(4500);
    c.j.px += 3;
    expect(c.retornos.conferir(c.estado, c.ctx)).toEqual([{ entidadeId: c.j.id, fim: 'desviado' }]);
  });
});

describe('D-142: mercadores errantes', () => {
  it('andam pela rota e param quando um jogador chega perto', () => {
    const c = cena();
    const rota = Array.from({ length: 10 }, (_, i) => ({ x: 20 + i, y: 20 }));
    const o = novoObjeto('errante-0', 'loja', 20, 20, { ref: REF_ERRANTE });
    c.estado.objetos.push(o);
    const errantes = new ErrantesDaRegiao([rota]);
    const passo = ticksDe(c.ctx.balance.mundo.errantes.passoMs);
    for (let i = 0; i < 3; i++) {
      errantes.andar(c.estado, c.ctx);
      c.estado.tick += passo;
    }
    expect(o.x).toBe(23);
    c.j.x = o.x + 1;
    c.j.y = o.y;
    errantes.andar(c.estado, c.ctx);
    expect(o.x).toBe(23);
  });
});

describe('D-142: fusão elemental', () => {
  it('o id fundido vira item com o efeito na arma e a resistência nas outras peças', () => {
    const itens = CONTEUDO.itens;
    const espada = obter(itens.get('espada_curta'));
    expect(fundivel(espada)).toBe(true);
    const id = idFundido('fogo', 2, espada.id);
    expect(lerIdFundido(id)).toEqual({ elemento: 'fogo', grau: 2, base: espada.id });
    const fundida = obter(itens.get(id));
    expect(fundida.nome).toContain('II');
    expect(fundida.valorBase).toBeGreaterThan(espada.valorBase);
    expect(fundivel(fundida)).toBe(false);
    expect(lerIdFundido(idFundido('fogo', 1, id))).toBeNull();
  });

  it('as receitas de fusão estão no ferreiro, com grau', () => {
    const fusoes = [...CONTEUDO.forja.values()].filter((r) => r.saida.tipo === 'fundir');
    expect(fusoes.length).toBeGreaterThanOrEqual(15);
    for (const r of fusoes) expect(r.grau).toBeGreaterThanOrEqual(3);
  });
});

describe('D-142: vilas e travessia', () => {
  it('toda vila tem mercado, ferreiro e alquimista, cada um no seu prédio', () => {
    for (const r of CONTEUDO.reinos.values()) {
      for (const regiao of r.regioes.filter((x) => x.vila)) {
        const vila = obter(regiao.vila);
        for (const p of PAPEIS_OBRIGATORIOS) expect(vila.npcs).toContain(p);
        const ex = gerarExterior(r, regiao);
        const predios = new Set((ex.fase.telhados ?? []).map((t) => t.predio).filter(Boolean));
        for (const p of ['mercado', 'ferreiro', 'alquimista'] as const) expect(predios.has(p), `${regiao.id}: ${p}`).toBe(true);
      }
    }
  });

  it('toda região sem vila tem a pedra de save no centro', () => {
    const r = reino();
    for (const regiao of r.regioes.filter((x) => !x.vila)) {
      const ex = gerarExterior(r, regiao);
      const n = regiao.tamanho ?? r.tamanhoRegiao;
      const save = ex.pontos.find((p) => p.tipo === 'npc' && p.papel === 'save');
      expect(save, regiao.id).toBeDefined();
      expect(ex.abrigo).not.toBeNull();
      if (save && 'x' in save) {
        expect(Math.abs(save.x - Math.floor(n / 2))).toBeLessThanOrEqual(2);
        expect(Math.abs(save.y - Math.floor(n / 2))).toBeLessThanOrEqual(2);
      }
    }
  });

  it('o deserto liga o Centro ao Eclipse só pelas passagens', () => {
    const atlas = reinoDoConteudo(CONTEUDO);
    const dunas = obter(regiaoPorId(atlas, 'dunas_do_poente'));
    const garganta = obter(regiaoPorId(atlas, 'garganta_do_sol'));
    expect(vizinha(atlas, dunas, 'oeste')?.id).toBe('colinas_do_sudeste');
    expect(vizinha(atlas, dunas, 'norte')?.id).toBe('mar_de_areia');
    expect(vizinha(atlas, dunas, 'leste')).toBeFalsy();
    expect(vizinha(atlas, garganta, 'leste')?.id).toBe('eclipse_baluarte');
    expect(vizinha(atlas, garganta, 'oeste')).toBeFalsy();
    const faixas = obter(dunas.faixas);
    expect(faixas.length).toBe(2);
  });
});
