// Skins de personagem (06/11/2026): o catálogo e os códigos, o comando `skin` (só da classe da skin, só visual), a
// aparência pública que leva a skin pela rede e a normalização das preferências (liberadas e escolhidas por classe).

import { describe, expect, it } from 'vitest';
import { lerComando } from '../../src/arena/protocolo';
import type { Comando } from '../../src/core/comandos';
import { BALANCE_PADRAO } from '../../src/core/contexto';
import { buscarEntidade, criarEstado } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import { clonarEntidade } from '../../src/entities/entidade';
import { criarJogador } from '../../src/entities/fabrica';
import { hashDoCodigo, normalizarCodigo, SKINS, skinDoCodigo, skinEscolhida, skinPorId, skinsDaClasse, skinValida } from '../../src/entities/skins';
import { normalizarPreferencias, PREFERENCIAS_PADRAO } from '../../src/plataforma/preferencias';
import { atualizarAparencias } from '../../src/progression/buffs';
import { CONTEUDO, contexto, faseDeTexto } from '../apoio/fases';

const SALA = ['########', '#......#', '#......#', '########'];
const CODIGO = 'NECRO-CEIFADOR-9QX4';

function obter<T>(v: T | undefined | null, nome: string): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

function cena(classeId: string) {
  const ctx = contexto(faseDeTexto(SALA));
  const estado = criarEstado({ semente: 3, faseId: 'teste' });
  estado.entidades.push(criarJogador(obter(CONTEUDO.classes.get(classeId), classeId), 'j', 2, 2, BALANCE_PADRAO));
  const eventos: EventoSimulacao[] = [];
  const tick = (...cmds: Comando[]) => {
    simular(estado, ctx, cmds.map((cmd) => ({ tick: estado.tick, entidadeId: 'j', cmd })), eventos, DT_MS);
  };
  return { ctx, estado, tick, j: () => obter(buscarEntidade(estado, 'j'), 'j') };
}

describe('catálogo de skins', () => {
  it('cada skin é de uma classe que existe, com id e código únicos', () => {
    expect(SKINS.length).toBeGreaterThan(0);
    for (const s of SKINS) {
      expect(CONTEUDO.classes.has(s.classe)).toBe(true);
      expect(s.classeNome).toBe(obter(CONTEUDO.classes.get(s.classe), s.classe).nome);
    }
    expect(new Set(SKINS.map((s) => s.id)).size).toBe(SKINS.length);
    expect(new Set(SKINS.map((s) => s.codigo)).size).toBe(SKINS.length);
  });

  it('o código vale sem diferença de maiúsculas, espaços e traços; o catálogo não guarda o texto do código', () => {
    expect(normalizarCodigo(' necro-ceifador 9qx4 ')).toBe('NECROCEIFADOR9QX4');
    for (const variante of [CODIGO, 'necro ceifador 9qx4', 'NECROCEIFADOR9QX4', ' Necro_Ceifador_9QX4 ']) {
      expect(skinDoCodigo(variante)?.id).toBe('necromante-ceifador');
    }
    expect(JSON.stringify(SKINS).toUpperCase()).not.toContain('CEIFADOR9QX4');
    expect(hashDoCodigo(CODIGO)).toBe(skinPorId('necromante-ceifador')?.codigo);
  });

  it('cada skin do catálogo abre com o próprio código, e só com ele', () => {
    expect(skinDoCodigo('MAGO-SOMBRA-RUBRA-4KR7')?.id).toBe('mago-sombra-rubra');
    expect(skinDoCodigo('mago sombra rubra 4kr7')?.classe).toBe('mago');
    expect(skinDoCodigo(CODIGO)?.classe).toBe('necromante');
    expect(JSON.stringify(SKINS).toUpperCase()).not.toContain('SOMBRARUBRA4KR7');
    expect(skinDoCodigo('AVENT-MAGICO-6TQ2')?.id).toBe('aventureiro-magico');
    expect(skinDoCodigo('avent magico 6tq2')?.classe).toBe('aventureiro');
  });

  it('código errado, curto ou vazio não libera nada', () => {
    for (const ruim of ['', '   ', 'abc', 'NECRO-CEIFADOR-0000', 'ceifador']) expect(skinDoCodigo(ruim)).toBeNull();
  });

  it('a skin só vale para a classe dela', () => {
    expect(skinValida('necromante', 'necromante-ceifador')).toBe(true);
    expect(skinValida('guerreiro', 'necromante-ceifador')).toBe(false);
    expect(skinValida('mago', 'mago-sombra-rubra')).toBe(true);
    expect(skinValida('necromante', 'mago-sombra-rubra')).toBe(false);
    expect(skinValida('aventureiro', 'aventureiro-magico')).toBe(true);
    expect(skinValida('mago', 'aventureiro-magico')).toBe(false);
    expect(skinValida('necromante', 'nao-existe')).toBe(false);
    expect(skinsDaClasse('necromante').map((s) => s.id)).toContain('necromante-ceifador');
    expect(skinsDaClasse('guerreiro')).toEqual([]);
  });

  it('skinEscolhida ignora entrada de outra classe e id desconhecido', () => {
    expect(skinEscolhida({ necromante: 'necromante-ceifador' }, 'necromante')).toBe('necromante-ceifador');
    expect(skinEscolhida({ guerreiro: 'necromante-ceifador' }, 'guerreiro')).toBeNull();
    expect(skinEscolhida({ necromante: 'x' }, 'necromante')).toBeNull();
    expect(skinEscolhida({}, 'necromante')).toBeNull();
    expect(skinEscolhida({}, '__proto__')).toBeNull();
  });
});

describe('comando skin', () => {
  it('veste a skin da classe e volta ao equipamento com null', () => {
    const c = cena('necromante');
    expect(c.j().skin ?? null).toBeNull();
    c.tick({ t: 'skin', id: 'necromante-ceifador' });
    expect(c.j().skin).toBe('necromante-ceifador');
    c.tick({ t: 'skin', id: null });
    expect(c.j().skin ?? null).toBeNull();
  });

  it('o mago veste a skin dele e recusa a do necromante', () => {
    const c = cena('mago');
    c.tick({ t: 'skin', id: 'mago-sombra-rubra' });
    expect(c.j().skin).toBe('mago-sombra-rubra');
    c.tick({ t: 'skin', id: 'necromante-ceifador' });
    expect(c.j().skin ?? null).toBeNull();
  });

  it('recusa skin de outra classe ou inexistente (e limpa a anterior)', () => {
    const g = cena('guerreiro');
    g.tick({ t: 'skin', id: 'necromante-ceifador' });
    expect(g.j().skin ?? null).toBeNull();
    const n = cena('necromante');
    n.tick({ t: 'skin', id: 'necromante-ceifador' });
    n.tick({ t: 'skin', id: 'invencao' });
    expect(n.j().skin ?? null).toBeNull();
  });

  it('é só visual: não mexe em vida, defesa nem atributos', () => {
    const c = cena('necromante');
    const antes = JSON.stringify([c.j().hp, c.j().hpMax, c.j().defesa, c.j().atributos]);
    c.tick({ t: 'skin', id: 'necromante-ceifador' });
    expect(JSON.stringify([c.j().hp, c.j().hpMax, c.j().defesa, c.j().atributos])).toBe(antes);
  });

  it('a skin vai na aparência pública (que vai pela rede) sem apagar o equipamento, e a cópia do estado a leva', () => {
    const c = cena('necromante');
    atualizarAparencias(c.estado, c.ctx);
    const equipamento = { ...c.j().aparencia };
    c.tick({ t: 'skin', id: 'necromante-ceifador' });
    atualizarAparencias(c.estado, c.ctx);
    expect(c.j().aparencia?.skin).toBe('necromante-ceifador');
    expect(c.j().aparencia?.arma).toBe(equipamento.arma);
    expect(c.j().bolsa?.equipamento).toBeDefined();
    expect(clonarEntidade(c.j()).skin).toBe('necromante-ceifador');
    expect(clonarEntidade(c.j()).aparencia?.skin).toBe('necromante-ceifador');
    c.tick({ t: 'skin', id: null });
    atualizarAparencias(c.estado, c.ctx);
    expect(c.j().aparencia?.skin ?? null).toBeNull();
  });
});

describe('protocolo da skin', () => {
  it('aceita id curto ou null; recusa o resto', () => {
    expect(lerComando({ t: 'skin', id: 'necromante-ceifador' })).toEqual({ t: 'skin', id: 'necromante-ceifador' });
    expect(lerComando({ t: 'skin', id: null })).toEqual({ t: 'skin', id: null });
    expect(lerComando({ t: 'skin', id: 5 })).toBeNull();
    expect(lerComando({ t: 'skin', id: 'x'.repeat(65) })).toBeNull();
    expect(lerComando({ t: 'skin' })).toBeNull();
  });
});

describe('preferências de skin', () => {
  it('começam vazias', () => {
    expect(PREFERENCIAS_PADRAO.skinsLiberadas).toEqual([]);
    expect(PREFERENCIAS_PADRAO.skinsEscolhidas).toEqual({});
    expect(normalizarPreferencias(undefined).skinsLiberadas).toEqual([]);
  });

  it('mantém a liberada e a escolha da classe certa', () => {
    const p = normalizarPreferencias({ skinsLiberadas: ['necromante-ceifador', 'necromante-ceifador'], skinsEscolhidas: { necromante: 'necromante-ceifador' } });
    expect(p.skinsLiberadas).toEqual(['necromante-ceifador']);
    expect(p.skinsEscolhidas).toEqual({ necromante: 'necromante-ceifador' });
  });

  it('descarta id desconhecido, escolha sem liberar e escolha para a classe errada', () => {
    expect(normalizarPreferencias({ skinsLiberadas: ['x', 5, null] }).skinsLiberadas).toEqual([]);
    expect(normalizarPreferencias({ skinsEscolhidas: { necromante: 'necromante-ceifador' } }).skinsEscolhidas).toEqual({});
    const errada = normalizarPreferencias({ skinsLiberadas: ['necromante-ceifador'], skinsEscolhidas: { guerreiro: 'necromante-ceifador', necromante: 7 } });
    expect(errada.skinsEscolhidas).toEqual({});
    expect(normalizarPreferencias({ skinsLiberadas: 'necromante-ceifador', skinsEscolhidas: 'x' }).skinsLiberadas).toEqual([]);
  });
});
