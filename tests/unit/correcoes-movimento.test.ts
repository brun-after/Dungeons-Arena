// D-170 (14/11/2026): as correções do movimento da classe e dos companheiros: a caça marcada que acaba, o urso que luta
// nadando, o limite do Posto dos Mortos, a camuflagem em combate e a armadilha sob o Arqueiro, que espera o retardo
// (e não fere quem saltou para trás a tempo).
import { describe, expect, it } from 'vitest';
import { movimentoAtivo } from '../../src/combat/movimento-classe';
import { cacaDoPet, marcar, petDoCompanheiro } from '../../src/combat/pets';
import type { Comando } from '../../src/core/comandos';
import type { ContextoSimulacao } from '../../src/core/contexto';
import { criarEstado, type Armadilha } from '../../src/core/estado';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { DT_MS } from '../../src/core/loop';
import { simular } from '../../src/core/simulacao';
import { posicionar } from '../../src/entities/entidade';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const obter = <T,>(v: T | undefined | null): T => {
  if (v === undefined || v === null) throw new Error('ausente');
  return v;
};
const padrao = contexto(faseDeTexto(SALA_ABERTA));

function cena(classe: string, nivel = 1, ctx: ContextoSimulacao = padrao, x = 2, y = 5) {
  const estado = criarEstado({ semente: 3, faseId: ctx.fase.id });
  const j = criarJogador(obter(CONTEUDO.classes.get(classe)), 'j', x, y, ctx.balance);
  j.nivel = nivel;
  estado.entidades.push(j);
  const eventos: EventoSimulacao[] = [];
  const passo = (cmds: Comando[] = [], ms = DT_MS) => {
    for (let t = 0; t < ms; t += DT_MS) {
      simular(estado, ctx, t === 0 ? cmds.map((cmd) => ({ tick: estado.tick, entidadeId: 'j', cmd })) : [], eventos, DT_MS);
    }
  };
  const orc = (ox: number, oy: number) => {
    const o = criarInimigo(obter(CONTEUDO.presets.get('orc')), `o${ox}${oy}`, ox, oy, ctx.balance);
    estado.entidades.push(o);
    return o;
  };
  const ativar = (id: string) => {
    for (let i = 0; i < 3 && movimentoAtivo(ctx, j)?.id !== id; i++) passo([{ t: 'trocarMovimento' }]);
    expect(movimentoAtivo(ctx, j)?.id).toBe(id);
  };
  return { estado, j, eventos, passo, orc, ativar };
}

describe('correções do movimento (D-170)', () => {
  it('a caça marcada dura 5 s depois do último golpe e acaba com a morte do Aventureiro', () => {
    const c = cena('aventureiro', 10);
    obter(c.j.bolsa).pet = 'lobo';
    c.passo([], 200);
    const lobo = obter(c.estado.entidades.find((e) => e.invocacao?.donoId === 'j' && petDoCompanheiro(e) === 'lobo'));
    const orc = c.orc(9, 9);
    marcar(c.estado, padrao, c.j, orc.id);
    expect(cacaDoPet(c.estado, lobo)?.id).toBe(orc.id);
    c.passo([], 4800);
    expect(cacaDoPet(c.estado, lobo)?.id).toBe(orc.id);
    c.passo([], 400);
    expect(cacaDoPet(c.estado, lobo)).toBeNull();
    marcar(c.estado, padrao, c.j, orc.id);
    c.j.hp = 0;
    c.j.morto = true;
    expect(cacaDoPet(c.estado, lobo)).toBeNull();
  });

  it('o urso luta nadando (o lobo, não)', () => {
    expect(padrao.balance.ajustesClasses.aventureiro.pets.urso.nadaLutando).toBe(true);
    expect(padrao.balance.ajustesClasses.aventureiro.pets.lobo.nadaLutando).toBeFalsy();
  });

  it('o Posto deixa o servo da passiva; longe demais do Necromante, o servo volta para perto dele', () => {
    const ctx: ContextoSimulacao = { ...padrao, balance: { ...padrao.balance, movimentoClasse: { ...padrao.balance.movimentoClasse, posto: { limite: 4 } } } };
    const c = cena('necromante', 20, ctx);
    c.passo([], 1500);
    c.ativar('posto_dos_mortos');
    c.passo([{ t: 'movimentoClasse', alvo: { x: 3, y: 3 } }]);
    const servo = obter(c.estado.entidades.find((e) => e.invocacao?.donoId === 'j' && e.invocacao.posto));
    expect(servo.invocacao?.necromancia).toBe('servo');
    posicionar(c.j, 9, 9);
    c.passo([], 100);
    expect(servo.invocacao?.posto).toBeUndefined();
    expect(Math.max(Math.abs(servo.x - 9), Math.abs(servo.y - 9))).toBeLessThanOrEqual(2);
  });

  it('o inimigo que já perseguia o Arqueiro camuflado segue atrás, mas não ataca', () => {
    const c = cena('arqueiro', 1);
    // Sem o básico sozinho (atacar tira a camuflagem).
    c.j.autoAtaque = false;
    const orc = c.orc(6, 5);
    c.passo([], 1500);
    expect(orc.ia?.modo).toBe('perseguindo');
    c.ativar('camuflagem');
    c.passo([{ t: 'movimentoClasse' }]);
    const vida = c.j.hp;
    c.passo([], 3000);
    expect(orc.ia?.modo).toBe('perseguindo');
    expect(orc.ia?.alvoId).toBe('j');
    expect(c.j.hp).toBe(vida);
  });

  function armadilhaEm(c: ReturnType<typeof cena>, x: number, y: number): Armadilha {
    const dono = c.orc(10, 10);
    const a: Armadilha = { id: 900 + x * 10 + y, donoId: dono.id, equipeDono: dono.equipe, x, y, valor: 6, interno: null, ateTick: Infinity, origem: 'fase', permanente: true, rearmeTicks: 0, inerteAteTick: 0, reveladaPara: [] };
    c.estado.armadilhas.push(a);
    return a;
  }

  it('a armadilha sob o Arqueiro espera o retardo e se revela; sem o salto, fere de qualquer jeito', () => {
    const c = cena('arqueiro', 1, padrao, 6, 5);
    const a = armadilhaEm(c, 6, 5);
    const vida = c.j.hp;
    c.passo();
    expect(c.j.hp).toBe(vida);
    expect(a.pisada?.id).toBe('j');
    expect(a.reveladaPara).toContain('j');
    expect(c.eventos.some((e) => e.t === 'armadilhaRevelada' && e.id === 'j')).toBe(true);
    c.passo([], 400);
    expect(c.j.hp).toBeLessThan(vida);
    expect(c.estado.armadilhas.some((x) => x.id === a.id)).toBe(false);
  });

  it('com o Salto para Trás a tempo, a armadilha dispara no vazio e some; a outra, onde ele cai, fere na hora', () => {
    const c = cena('arqueiro', 1, padrao, 6, 5);
    c.ativar('salto_atras');
    c.j.olhando = 'E';
    const a = armadilhaEm(c, 6, 5);
    c.passo();
    const vida = c.j.hp;
    c.passo([{ t: 'movimentoClasse', dx: 1000, dy: 0 }]);
    expect(c.j.x).toBeLessThan(6);
    c.passo([], 400);
    expect(c.j.hp).toBe(vida);
    expect(c.estado.armadilhas.some((x) => x.id === a.id)).toBe(false);
    expect(c.eventos.some((e) => e.t === 'armadilhaDisparou' && e.armadilhaId === a.id && e.protegido)).toBe(true);

    const d = cena('arqueiro', 1, padrao, 6, 5);
    d.ativar('salto_atras');
    d.j.olhando = 'E';
    armadilhaEm(d, 6, 5);
    d.passo();
    d.passo([{ t: 'movimentoClasse', dx: 1000, dy: 0 }]);
    // Ele cai em outra armadilha: o dano vem na hora, sem o retardo.
    const onde = { x: d.j.x, y: d.j.y };
    const outra = armadilhaEm(d, onde.x, onde.y);
    const vidaD = d.j.hp;
    d.passo();
    expect(d.j.hp).toBeLessThan(vidaD);
    expect(d.estado.armadilhas.some((x) => x.id === outra.id)).toBe(false);
  });
});
