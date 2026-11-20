// D-172 (14/11/2026): um botão por movimento. O Shift usa o principal da classe; o T e o G, os outros dois, da recarga
// menor para a maior; o Aventureiro tem um só, o do companheiro ativo. Em combate, os que não são o principal recarregam
// mais devagar.
import { describe, expect, it } from 'vitest';
import { movimentoAtivo, movimentosDosBotoes } from '../../src/combat/movimento-classe';
import { lerComando } from '../../src/arena/protocolo';
import type { Comando } from '../../src/core/comandos';
import { criarEstado } from '../../src/core/estado';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { DT_MS } from '../../src/core/loop';
import { ticksDe } from '../../src/core/tempo';
import { simular } from '../../src/core/simulacao';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const obter = <T,>(v: T | undefined | null): T => {
  if (v === undefined || v === null) throw new Error('ausente');
  return v;
};
const ctx = contexto(faseDeTexto(SALA_ABERTA));

function cena(classe: string) {
  const estado = criarEstado({ semente: 3, faseId: ctx.fase.id });
  const j = criarJogador(obter(CONTEUDO.classes.get(classe)), 'j', 5, 5, ctx.balance);
  j.autoAtaque = false;
  estado.entidades.push(j);
  const eventos: EventoSimulacao[] = [];
  const passo = (cmds: Comando[] = [], ms = DT_MS) => {
    for (let t = 0; t < ms; t += DT_MS) simular(estado, ctx, t === 0 ? cmds.map((cmd) => ({ tick: estado.tick, entidadeId: 'j', cmd })) : [], eventos, DT_MS);
  };
  return { estado, j, eventos, passo };
}
const ids = (classe: string) => movimentosDosBotoes(ctx, cena(classe).j).map((m) => m.id);

describe('os botões do movimento (D-172)', () => {
  it('o principal no primeiro botão e os outros da recarga menor para a maior', () => {
    expect(ids('mago')).toEqual(['voo_arcano', 'ancora_runica', 'acelerar']);
    expect(ids('guerreiro')).toEqual(['arremetida', 'marcha_de_guerra', 'salto_de_guerra']);
    expect(ids('necromante')).toEqual(['troca_de_corpo', 'posto_dos_mortos', 'forma_de_nevoa']);
    expect(ids('arqueiro')).toEqual(['salto_atras', 'chegada', 'camuflagem']);
    // D-188: o Aventureiro: a troca no Shift, a montaria da fera da vez no V e o Chamado no X.
    expect(ids('aventureiro')).toEqual(['troca_de_companheiro', 'falcao_carrega', 'chamado']);
  });

  it('cada botão usa o próprio movimento, sem trocar antes', () => {
    const c = cena('mago');
    c.passo([{ t: 'movimentoClasse', botao: 1 }]);
    expect(c.j.movimentoClasse?.ancora).toBeDefined();
    expect(movimentoAtivo(ctx, c.j)?.id).toBe('ancora_runica');
    c.passo([{ t: 'movimentoClasse', botao: 0, dx: 1000, dy: 0 }]);
    expect(c.j.movimentoClasse?.modo?.tipo).toBe('voo');
    // A Âncora segue fincada: a 2ª ativação, pelo mesmo botão, volta ao totem.
    expect(c.j.movimentoClasse?.ancora).toBeDefined();
  });

  it('em combate, os que não são o principal recarregam mais devagar; o principal, não', () => {
    const fora = cena('arqueiro');
    fora.passo([{ t: 'movimentoClasse', botao: 2 }]);
    const recargaFora = obter(fora.j.movimentoClasse?.cargas.camuflagem?.[0]) - fora.estado.tick;

    const luta = cena('arqueiro');
    luta.estado.entidades.push(criarInimigo(obter(CONTEUDO.presets.get('orc')), 'o', 7, 5, ctx.balance));
    luta.passo([], 1500);
    luta.passo([{ t: 'movimentoClasse', botao: 2 }]);
    const recargaLuta = obter(luta.j.movimentoClasse?.cargas.camuflagem?.[0]) - luta.estado.tick;
    expect(recargaLuta).toBeGreaterThan(recargaFora * 1.8);

    luta.passo([{ t: 'movimentoClasse', botao: 0, dx: 1000, dy: 0 }]);
    const principal = obter(luta.j.movimentoClasse?.cargas.salto_atras?.[0]) - luta.estado.tick;
    expect(principal).toBeLessThanOrEqual(ticksDe(3500));
  });

  it('o protocolo aceita o botão de 0 a 2', () => {
    expect(lerComando({ t: 'movimentoClasse', botao: 2 })).toEqual({ t: 'movimentoClasse', botao: 2 });
    expect(lerComando({ t: 'movimentoClasse', botao: 3 })).toBeNull();
    expect(lerComando({ t: 'movimentoClasse', botao: 1.5 })).toBeNull();
  });
});
