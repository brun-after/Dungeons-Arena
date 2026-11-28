// Marco 56 (27/11/2026, D-209): os andares das masmorras do Mundo: a geração por andar (salas repartidas, o chefe e a
// recompensa só no último, a escada para cima ao lado da chegada) e as escadas na sala (descer leva o grupo perto ao
// próximo andar na mesma instância; subir volta ao de cima, ao lado da escada dele; no primeiro, sai à porta).

import { describe, expect, it } from 'vitest';
import { versaoDoConteudo, type MensagemServidor } from '../../src/arena/protocolo';
import { BALANCE_PADRAO } from '../../src/core/contexto';
import { buscarEntidade } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { posicionar, type Entidade } from '../../src/entities/entidade';
import { andaresDe, salasDoAndar } from '../../src/mundo/andares';
import type { AvisoDoMundo } from '../../src/mundo/avisos';
import { fichaNova, type FichaDoMundo } from '../../src/mundo/ficha-mundo';
import { idDoLugar, lerLugar, montarLugar } from '../../src/mundo/lugares';
import { SalaMundo } from '../../src/mundo/sala-mundo';
import { portaDa, type Reino } from '../../src/mundo/reino';
import { modoPorId } from '../../src/core/conteudo';
import { passavel } from '../../src/world/fase';
import { CONTEUDO } from '../apoio/fases';

function obter<T>(v: T | undefined | null, nome: string): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

const REINO: Reino = obter(CONTEUDO.reinos.get('reino_central'), 'reino');
const TOCA = obter(REINO.masmorras.find((m) => m.id === 'toca_dos_goblins'), 'toca');

function sala(lugar: string, instancia?: string): SalaMundo {
  return new SalaMundo(REINO, obter(lerLugar(REINO, lugar), lugar), CONTEUDO, { semente: 9, agora: () => 1_000_000, ...(instancia && { instancia }) });
}

function ficha(): FichaDoMundo {
  return obter(fichaNova({ conteudo: CONTEUDO, balance: BALANCE_PADRAO }, REINO, 'guerreiro', 'Tester', 'pers-0001-teste'), 'ficha');
}

function entrar(s: SalaMundo, identidade: string) {
  s.reservar(identidade, ficha(), null);
  const recebidas: MensagemServidor[] = [];
  const conexao = s.conectar((t) => recebidas.push(JSON.parse(t) as MensagemServidor), identidade);
  conexao.receber(JSON.stringify({ t: 'entrar', nome: 'x', pedidoFicha: null, versaoConteudo: versaoDoConteudo() }));
  const bem = recebidas.find((m) => m.t === 'bemVindo');
  if (bem?.t !== 'bemVindo') throw new Error('não entrou');
  const seq = { n: 0 };
  return {
    e: (): Entidade => obter(buscarEntidade(s.estado, bem.entidadeId), 'entidade'),
    avisos: () => recebidas.flatMap((m): AvisoDoMundo[] => (m.t === 'mundo' ? [m.aviso] : [])),
    interagir: () => {
      conexao.receber(JSON.stringify({ t: 'cmd', pacote: { sessaoId: bem.sessaoId, seq: ++seq.n, epocaSala: s.epoca, tickCliente: s.estado.tick, cmd: { t: 'interagir' } } }));
    },
  };
}

const rodar = (s: SalaMundo, n = 1) => {
  for (let i = 0; i < n; i++) s.tick(DT_MS);
};

/** Tira os monstros (a saída do último andar abre com o chefe morto). */
function limpar(s: SalaMundo): void {
  for (const e of s.estado.entidades) if (e.controlador === 'ia') e.hp = 0;
  rodar(s, 2);
}

describe('andares das masmorras', () => {
  it('reparte as salas, com o chefe e a loja só onde cabem e a escada para cima ao lado da chegada', () => {
    expect(andaresDe(TOCA)).toBe(3);
    expect(andaresDe({ salas: 5 })).toBe(1);
    expect(andaresDe({ salas: 7 })).toBe(2);
    expect(andaresDe({ salas: 9, andares: 6 })).toBe(3);
    expect([1, 2, 3].map((n) => salasDoAndar(20, n, 3))).toEqual([7, 7, 6]);
    expect(lerLugar(REINO, 'masmorra:toca_dos_goblins:4')).toBeNull();
    expect(lerLugar(REINO, 'masmorra:toca_dos_goblins:1')).toBeNull();
    const modo = modoPorId(CONTEUDO, 'mundo');
    for (const n of [1, 2, 3]) {
      const lugar = obter(lerLugar(REINO, n === 1 ? 'masmorra:toca_dos_goblins' : `masmorra:toca_dos_goblins:${String(n)}`), 'andar');
      expect(idDoLugar(lugar)).toBe(n === 1 ? 'masmorra:toca_dos_goblins' : `masmorra:toca_dos_goblins:${String(n)}`);
      const { ctx } = montarLugar(CONTEUDO, REINO, lugar, modo);
      const f = ctx.fase;
      expect(f.andar).toEqual({ numero: n, total: 3 });
      expect(f.inimigos.some((i) => i.preset === TOCA.boss && i.nivel === TOCA.nivel && f.portaSaida?.tranca === 'boss')).toBe(n === 3);
      expect(f.portaSaida?.tranca).toBe(n === 3 ? 'boss' : 'livre');
      expect(f.objetos.some((o) => o.tipo === 'loja')).toBe(n === 1);
      const spawn = obter(f.spawns[0], 'spawn');
      const escada = obter(f.portaRetorno, 'escada para cima');
      expect(escada).not.toEqual(spawn);
      expect(Math.max(Math.abs(escada.x - spawn.x), Math.abs(escada.y - spawn.y))).toBe(1);
    }
  });

  it('a escada para baixo leva quem está perto ao próximo andar, na mesma instância; quem está longe fica', () => {
    const s = sala('masmorra:toca_dos_goblins', 'grupo:g1:toca_dos_goblins');
    const a = entrar(s, 'u1');
    const b = entrar(s, 'u2');
    const c = entrar(s, 'u3');
    limpar(s);
    const saida = obter(s.ctx.fase.portaSaida, 'escada para baixo');
    posicionar(a.e(), saida.x, saida.y);
    posicionar(b.e(), saida.x - 1, saida.y);
    // O ponto andável mais longe da escada (além do raio do grupo).
    const f = s.ctx.fase;
    let longe = { x: 0, y: 0, d: -1 };
    for (let y = 0; y < f.altura; y++) for (let x = 0; x < f.largura; x++) {
      const d = Math.max(Math.abs(x - saida.x), Math.abs(y - saida.y));
      if (d > longe.d && passavel(f, x, y)) longe = { x, y, d };
    }
    expect(longe.d).toBeGreaterThan(BALANCE_PADRAO.mundo.andares.raioDoGrupo);
    posicionar(c.e(), longe.x, longe.y);
    rodar(s, 2);
    a.interagir();
    rodar(s, 4);
    const trocas = s.retirarPendencias().filter((x) => x.tipo === 'trocar');
    expect(trocas.map((t) => t.identidade).sort()).toEqual(['u1', 'u2']);
    for (const t of trocas) expect(t).toMatchObject({ destino: 'masmorra:toca_dos_goblins:2', instancia: 'grupo:g1:toca_dos_goblins', chegada: null });
    expect(c.e().morto).toBe(false);
  });

  it('a escada para cima volta ao andar de cima ao lado da escada dele; no primeiro, sai à porta sem recompensa', () => {
    const s2 = sala('masmorra:toca_dos_goblins:2', 'u1:1');
    const a = entrar(s2, 'u1');
    expect(a.avisos()).toContainEqual(expect.objectContaining({ tipo: 'lugar', lugar: 'masmorra:toca_dos_goblins', andar: { numero: 2, total: 3 } }));
    const subir = obter(s2.ctx.fase.portaRetorno, 'escada para cima');
    posicionar(a.e(), subir.x, subir.y);
    rodar(s2, 2);
    a.interagir();
    rodar(s2, 4);
    const volta = s2.retirarPendencias().find((x) => x.tipo === 'trocar');
    expect(volta).toMatchObject({ destino: 'masmorra:toca_dos_goblins', instancia: 'u1:1' });
    const acima = sala('masmorra:toca_dos_goblins');
    const descer = obter(acima.ctx.fase.portaSaida, 'escada para baixo');
    const chegada = obter(volta?.chegada, 'chegada');
    expect(Math.max(Math.abs(chegada.x - descer.x), Math.abs(chegada.y - descer.y))).toBeLessThanOrEqual(5);
    expect(chegada).not.toEqual(descer);

    const s1 = sala('masmorra:toca_dos_goblins', 'u1:1');
    const b = entrar(s1, 'u1');
    const sair = obter(s1.ctx.fase.portaRetorno, 'escada para cima');
    posicionar(b.e(), sair.x, sair.y);
    rodar(s1, 2);
    b.interagir();
    rodar(s1, 4);
    const fora = s1.retirarPendencias().find((x) => x.tipo === 'trocar');
    const estrutura = obter(REINO.regioes.flatMap((r) => r.estruturas).find((e) => e.destino.id === 'toca_dos_goblins'), 'estrutura');
    expect(fora).toMatchObject({ destino: expect.stringMatching(/^regiao:/), chegada: portaDa(estrutura).frente, instancia: null });
    expect(b.avisos().some((x) => x.tipo === 'recompensa')).toBe(false);
  });
});
