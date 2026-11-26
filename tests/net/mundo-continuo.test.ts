// Marco 54 (26/11/2026, D-207): a sala do Mundo contínuo. O atlas inteiro numa sala: cruzar a costura muda a zona
// sem troca de sala, o portal só reposiciona, o PvP é o da zona dos dois e o que está longe hiberna.

import { describe, expect, it } from 'vitest';
import { versaoDoConteudo, type MensagemServidor } from '../../src/arena/protocolo';
import { BALANCE_PADRAO } from '../../src/core/contexto';
import { buscarEntidade } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { modoPorId } from '../../src/core/conteudo';
import { posicionar, type Entidade } from '../../src/entities/entidade';
import { podeFerir } from '../../src/modos/relacao';
import type { AvisoDoMundo } from '../../src/mundo/avisos';
import { fichaNova, type FichaDoMundo } from '../../src/mundo/ficha-mundo';
import { montarMundoContinuo } from '../../src/mundo/mundo-continuo';
import { reinoDoConteudo } from '../../src/mundo/reino';
import { SalaMundoContinuo } from '../../src/mundo/sala-continua';
import { MODO_MUNDO } from '../../src/mundo/sala-mundo';
import { zonaEm } from '../../src/mundo/zonas';
import { CONTEUDO } from '../apoio/fases';

function obter<T>(v: T | undefined | null, nome: string): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

const REINO = reinoDoConteudo(CONTEUDO);
const MUNDO = montarMundoContinuo(CONTEUDO, REINO, modoPorId(CONTEUDO, MODO_MUNDO));
const relogio = 1_000_000;

function sala(): SalaMundoContinuo {
  return new SalaMundoContinuo(REINO, CONTEUDO, MUNDO, { semente: 9, agora: () => relogio });
}

function ficha(id: string): FichaDoMundo {
  return obter(fichaNova({ conteudo: CONTEUDO, balance: BALANCE_PADRAO }, REINO, 'guerreiro', 'Tester', id), 'ficha');
}

function entrar(s: SalaMundoContinuo, identidade: string, regiao = REINO.inicio) {
  s.reservar(identidade, ficha(`pers-${identidade}`), s.chegadaNoAtlas(regiao, null));
  const recebidas: MensagemServidor[] = [];
  const conexao = s.conectar((t) => recebidas.push(JSON.parse(t) as MensagemServidor), identidade);
  conexao.receber(JSON.stringify({ t: 'entrar', nome: 'x', pedidoFicha: null, versaoConteudo: versaoDoConteudo() }));
  const bem = recebidas.find((m) => m.t === 'bemVindo');
  if (bem?.t !== 'bemVindo') throw new Error(`não entrou: ${JSON.stringify(recebidas.slice(0, 2))}`);
  const avisos = () => recebidas.flatMap((m): AvisoDoMundo[] => (m.t === 'mundo' ? [m.aviso] : []));
  const e = (): Entidade => obter(buscarEntidade(s.estado, bem.entidadeId), 'entidade');
  return { conexao, recebidas, bem, avisos, e, enviar: (msg: unknown) => { conexao.receber(JSON.stringify(msg)); } };
}

const rodar = (s: SalaMundoContinuo, n = 1) => {
  for (let i = 0; i < n; i++) s.tick(DT_MS);
};

describe('sala do Mundo contínuo', () => {
  it('entra ao lado da pedra da vila e avisa a zona como lugar', () => {
    const s = sala();
    const c = entrar(s, 'u1');
    expect(zonaEm(MUNDO.zonas, c.e().x, c.e().y)).toBe(REINO.inicio);
    const lugar = c.avisos().find((a) => a.tipo === 'lugar');
    expect(lugar?.tipo === 'lugar' && lugar.lugar).toBe(`regiao:${REINO.inicio}`);
  });

  it('cruzar a costura muda a zona sem trocar de sala', () => {
    const s = sala();
    const c = entrar(s, 'u1');
    rodar(s, 2);
    const campos = obter(MUNDO.atlas.areas.get('campos_do_oeste'), 'área');
    posicionar(c.e(), campos.x + (campos.largura >> 1), campos.y + (campos.altura >> 1));
    rodar(s, 2);
    expect(s.retirarPendencias().some((p) => p.tipo === 'trocar')).toBe(false);
    const lugares = c.avisos().filter((a) => a.tipo === 'lugar');
    expect(lugares.at(-1)?.tipo === 'lugar' && lugares.at(-1)).toMatchObject({ lugar: 'regiao:campos_do_oeste' });
    expect(c.avisos().some((a) => a.tipo === 'descoberta' && a.lugar === 'regiao:campos_do_oeste')).toBe(true);
  });

  it('o portal leva à outra vila sem sair da sala', () => {
    const s = sala();
    const c = entrar(s, 'u1');
    obter(c.e().bolsa, 'bolsa').ouro = 10_000;
    const pedra = obter(s.estado.objetos.find((o) => o.tipo === 'pedra_portal' && zonaEm(MUNDO.zonas, o.x, o.y) === REINO.inicio), 'pedra');
    posicionar(c.e(), pedra.x, pedra.y + 1);
    c.enviar({ t: 'viajar', destino: 'eclipse_baluarte', pagamento: 'ouro' });
    expect(s.retirarPendencias().some((p) => p.tipo === 'trocar')).toBe(false);
    expect(zonaEm(MUNDO.zonas, c.e().x, c.e().y)).toBe('eclipse_baluarte');
  });

  it('o PvP é da zona dos dois', () => {
    const s = sala();
    const a = entrar(s, 'u1');
    const b = entrar(s, 'u2');
    const perigosa = obter(REINO.regioes.find((r) => REINO.perigos[r.perigo].pvp), 'região perigosa');
    const area = obter(MUNDO.atlas.areas.get(perigosa.id), 'área');
    const meio = { x: area.x + (area.largura >> 1), y: area.y + (area.altura >> 1) };
    a.e().equipe = 'x';
    b.e().equipe = 'x';
    expect(podeFerir(a.e(), b.e(), s.ctx.modo)).toBe(false);
    posicionar(a.e(), meio.x, meio.y);
    posicionar(b.e(), meio.x + 1, meio.y);
    expect(podeFerir(a.e(), b.e(), s.ctx.modo)).toBe(true);
  });

  it('o que está longe dorme e o estado da sala fica pequeno', () => {
    const s = sala();
    entrar(s, 'u1');
    rodar(s, BALANCE_PADRAO.mundo.hibernacao.aCadaTicks + 1);
    expect(s.estado.entidades.length).toBeLessThan(MUNDO.estado.entidades.length / 10);
    expect(s.dormindo().entidades).toBeGreaterThan(MUNDO.estado.entidades.length / 2);
  });
});
