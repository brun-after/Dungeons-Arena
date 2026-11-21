// Marco 42 (15/11/2026, D-176): o relevo: as regras pelo desnível e a geração nas regiões do Mundo.
import { describe, expect, it } from 'vitest';
import { BALANCE_PADRAO } from '../../src/core/contexto';
import { criarEstado } from '../../src/core/estado';
import { DT_MS } from '../../src/core/loop';
import { simular, type EventoSimulacao } from '../../src/core/simulacao';
import { criarJogador } from '../../src/entities/fabrica';
import { gerarExterior } from '../../src/world/gerador-exterior';
import { caminho } from '../../src/world/navegacao';
import { alturaEm, fatorDeSubida, passaDesnivel, tiroPassaEntre } from '../../src/world/relevo';
import { alturaEscalavel, lentidaoDaQuedaPct, travessiaAPe } from '../../src/world/escalada';
import { OBSTACULO } from '../../src/world/geografia';
import { tiroLivre } from '../../src/combat/linha-de-tiro';
import type { Fase } from '../../src/world/fase';
import { CONTEUDO, contexto, faseDeTexto } from '../apoio/fases';

const R = BALANCE_PADRAO.relevo;

/** Uma sala aberta com as alturas por linha (um dígito por célula). */
function comAlturas(mapa: string[], alturas: string[]): Fase {
  const f = faseDeTexto(mapa);
  const a = new Uint8Array(f.largura * f.altura);
  alturas.forEach((linha, y) => {
    for (let x = 0; x < linha.length; x++) a[y * f.largura + x] = Number(linha.charAt(x));
  });
  return { ...f, alturas: a };
}

const MAPA = ['##########', '#........#', '#........#', '#........#', '##########'];

describe('regras do relevo (D-176)', () => {
  it('a tabela: encosta anda; muro baixo só salta; muro alto só voa; acima, ninguém', () => {
    expect(passaDesnivel(R, R.encostaMax, 'andar')).toBe(true);
    expect(passaDesnivel(R, R.muroBaixoMax, 'andar')).toBe(false);
    expect(passaDesnivel(R, R.muroBaixoMax, 'saltar')).toBe(true);
    expect(passaDesnivel(R, R.muroBaixoMax + 1, 'saltar')).toBe(false);
    expect(passaDesnivel(R, R.muroAltoMax, 'voar')).toBe(true);
    expect(passaDesnivel(R, R.muroAltoMax + 1, 'voar')).toBe(false);
    // Descer saltando ou voando: qualquer altura; a pé, o muro também barra na descida.
    expect(passaDesnivel(R, -9, 'saltar')).toBe(true);
    expect(passaDesnivel(R, -R.muroBaixoMax, 'andar')).toBe(false);
  });

  it('subir a encosta custa velocidade; descer não; a montaria sente menos', () => {
    const f = comAlturas(MAPA, ['0000000000', '0012000000', '0000000000', '0000000000', '0000000000']);
    expect(fatorDeSubida(f, R, { x: 1, y: 1 }, { x: 2, y: 1 })).toBeCloseTo(1 - R.subidaPctPorNivel / 100, 5);
    expect(fatorDeSubida(f, R, { x: 3, y: 1 }, { x: 2, y: 1 })).toBe(1);
    expect(fatorDeSubida(f, R, { x: 1, y: 1 }, { x: 2, y: 1 }, true)).toBeGreaterThan(fatorDeSubida(f, R, { x: 1, y: 1 }, { x: 2, y: 1 }));
  });

  it('a navegação contorna pela rampa o que não se escala', () => {
    // Uma montanha (acima do que se escala) na coluna 4, com uma rampa (encosta) na linha 3.
    const f = comAlturas(MAPA, ['0000000000', '0000900000', '0000900000', '0000200000', '0000000000']);
    const r = caminho(f, { x: 2, y: 1 }, { x: 6, y: 1 }, 60);
    expect(r.status).toBe('alcancado');
    expect(r.passos.some((p) => p.y === 3 && p.x === 4)).toBe(true);
    expect(r.passos.every((p) => alturaEm(f, p.x, p.y) !== 9)).toBe(true);
  });

  it('D-191: a navegação passa pelo muro que se escala e desce a queda', () => {
    const f = comAlturas(MAPA, ['0000000000', '0000500000', '0000500000', '0000500000', '0000000000']);
    const r = caminho(f, { x: 2, y: 2 }, { x: 6, y: 2 }, 60);
    expect(r.status).toBe('alcancado');
    expect(r.passos.length).toBe(4);
  });

  it('o tiro passa o muro baixo e para no alto; de cima, atira para baixo', () => {
    const baixo = comAlturas(MAPA, ['0000000000', '0000300000', '0000300000', '0000300000', '0000000000']);
    const alto = comAlturas(MAPA, ['0000000000', '0000500000', '0000500000', '0000500000', '0000000000']);
    expect(tiroPassaEntre(baixo, { x: 3, y: 2 }, { x: 4, y: 2 })).toBe(true);
    expect(tiroPassaEntre(alto, { x: 3, y: 2 }, { x: 4, y: 2 })).toBe(false);
    expect(tiroPassaEntre(alto, { x: 4, y: 2 }, { x: 5, y: 2 })).toBe(true);
    const ctx = contexto(alto);
    const estado = criarEstado({ semente: 1, faseId: 't' });
    expect(tiroLivre(estado, ctx, { x: 1, y: 2 }, { x: 7, y: 2 })).toBe(false);
  });

  /** Anda para leste desde (2, 2) por `ticks`: o jogador, as travessias vistas e quantos ticks passou nelas. */
  function andarParaLeste(alturas: string[], ticks: number, atributos?: { vontade: number; destreza: number }) {
    const f = comAlturas(MAPA, alturas);
    const ctx = contexto(f);
    const estado = criarEstado({ semente: 1, faseId: 't' });
    const classe = CONTEUDO.classes.get('guerreiro');
    if (!classe) throw new Error('classe');
    const j = criarJogador(classe, 'p1', 2, 2, ctx.balance);
    if (atributos) Object.assign(j.atributos, atributos);
    estado.entidades.push(j);
    j.rumoX = 1;
    j.rumoY = 0;
    j.direcao = 'E';
    const vistos = new Set<string>();
    let ticksNaTravessia = 0;
    let pouso: { recuoPct: number; recuoAteTick: number; tick: number } | null = null;
    const ev: EventoSimulacao[] = [];
    for (let i = 0; i < ticks; i++) {
      const antes = !!j.escalada;
      simular(estado, ctx, [], ev, DT_MS);
      if (j.escalada) {
        vistos.add(j.escalada.tipo);
        ticksNaTravessia++;
      } else if (antes && !pouso) pouso = { recuoPct: j.recuoPct ?? 0, recuoAteTick: j.recuoAteTick ?? 0, tick: estado.tick };
    }
    return { f, j, vistos, ticksNaTravessia, pouso };
  }

  const MURO_BAIXO = ['0000000000', '0000333000', '0000333000', '0000333000', '0000000000'];

  it('D-191: a pé, o corpo escala o muro (perdendo tempo) em vez de travar', () => {
    const plano = andarParaLeste(['0000000000', '0000000000', '0000000000', '0000000000', '0000000000'], 150);
    const muro = andarParaLeste(MURO_BAIXO, 150);
    expect(muro.vistos.has('subir')).toBe(true);
    expect(muro.j.px).toBeGreaterThan(4.3);
    expect(alturaEm(muro.f, muro.j.px, muro.j.py)).toBe(3);
    // O muro custou tempo: no plano o corpo foi mais longe.
    expect(plano.j.px).toBeGreaterThan(muro.j.px + 0.3);
  });

  it('D-191: Vontade e Destreza encurtam a escalada; o muro mais alto demora mais', () => {
    const muro = ['0000000000', '0000555000', '0000555000', '0000555000', '0000000000'];
    const fraco = andarParaLeste(muro, 300, { vontade: 10, destreza: 10 });
    const forte = andarParaLeste(muro, 300, { vontade: 40, destreza: 40 });
    expect(fraco.vistos.has('subir')).toBe(true);
    expect(forte.ticksNaTravessia).toBeLessThan(fraco.ticksNaTravessia);
    const baixo = andarParaLeste(MURO_BAIXO, 300, { vontade: 10, destreza: 10 });
    expect(baixo.ticksNaTravessia).toBeLessThan(fraco.ticksNaTravessia);
  });

  it('D-191: acima da altura do corpo e mais metade, o muro segue barrando', () => {
    const r = andarParaLeste(['0000000000', '0000999000', '0000999000', '0000999000', '0000000000'], 200);
    expect(r.vistos.size).toBe(0);
    expect(r.j.px).toBeLessThan(3.6);
  });

  it('D-191: a queda vira um pulo curto, e o impacto segura 10% a 20% pela altura', () => {
    const r = andarParaLeste(['0000000000', '5555000000', '5555000000', '5555000000', '0000000000'], 150);
    expect(r.vistos.has('descer')).toBe(true);
    expect(r.j.px).toBeGreaterThan(4.3);
    expect(r.pouso?.recuoPct ?? 0).toBeGreaterThanOrEqual(R.escalada.quedaLentidaoMinPct);
    expect(r.pouso?.recuoAteTick ?? 0).toBeGreaterThan(r.pouso?.tick ?? 0);
    expect(lentidaoDaQuedaPct(R, R.encostaMax + 1)).toBeCloseTo(R.escalada.quedaLentidaoMinPct, 5);
    expect(lentidaoDaQuedaPct(R, R.escalada.quedaMaxNiveis)).toBeCloseTo(R.escalada.quedaLentidaoMaxPct, 5);
    expect(travessiaAPe(R, -(R.escalada.quedaMaxNiveis + 1))).toBeNull();
    expect(travessiaAPe(R, alturaEscalavel(R))).toBe('subir');
    expect(travessiaAPe(R, alturaEscalavel(R) + 1)).toBeNull();
  });

  it('D-191: a árvore no alto do muro não vira escalada', () => {
    const f = comAlturas(MAPA, MURO_BAIXO);
    const obstaculos = new Uint8Array(f.largura * f.altura);
    for (let y = 1; y <= 3; y++) obstaculos[y * f.largura + 4] = OBSTACULO.arvore;
    const ctx = contexto({ ...f, obstaculos });
    const estado = criarEstado({ semente: 1, faseId: 't' });
    const classe = CONTEUDO.classes.get('guerreiro');
    if (!classe) throw new Error('classe');
    const j = criarJogador(classe, 'p1', 2, 2, ctx.balance);
    estado.entidades.push(j);
    j.rumoX = 1;
    j.rumoY = 0;
    j.direcao = 'E';
    for (let i = 0; i < 150; i++) {
      simular(estado, ctx, [], [], DT_MS);
      expect(j.escalada ?? null).toBeNull();
    }
  });
});

describe('relevo das regiões (D-176)', () => {
  const reino = CONTEUDO.reinos.get('reino_central');
  if (!reino) throw new Error('reino');

  it('é determinístico e as colinas têm encostas e muros', () => {
    const regiao = reino.regioes.find((r) => r.bioma === 'colinas');
    if (!regiao) throw new Error('colinas');
    const a = gerarExterior(reino, regiao).alturas;
    const b = gerarExterior(reino, regiao).alturas;
    expect([...a]).toEqual([...b]);
    const n = regiao.tamanho ?? reino.tamanhoRegiao;
    let encostas = 0;
    let muros = 0;
    for (let y = 1; y < n - 1; y++) {
      for (let x = 1; x < n - 2; x++) {
        const d = Math.abs((a[y * n + x + 1] ?? 0) - (a[y * n + x] ?? 0));
        if (d > 0 && d <= R.encostaMax) encostas++;
        else if (d > R.encostaMax) muros++;
      }
    }
    expect(encostas).toBeGreaterThan(200);
    expect(muros).toBeGreaterThan(20);
  });

  it('a vila e as chegadas ficam planas (na altura delas: marco 43, D-177)', () => {
    for (const regiao of reino.regioes) {
      const ex = gerarExterior(reino, regiao);
      const n = regiao.tamanho ?? reino.tamanhoRegiao;
      const a = (x: number, y: number) => ex.alturas[y * n + x];
      for (const s of ex.fase.spawns) expect(a(s.x + 1, s.y), `${regiao.id} chegada`).toBe(a(s.x, s.y));
      const v = regiao.vila;
      if (v) for (const [dx, dy] of [[3, 0], [0, 3], [-3, 0], [0, -3]] as const) expect(a(v.x + dx, v.y + dy), `${regiao.id} vila`).toBe(a(v.x, v.y));
    }
  });

  it('D-191: a saída de cada passagem não tem muro (a boca fica na altura da passagem e a encosta sobe dali)', () => {
    for (const r of CONTEUDO.reinos.values()) {
      for (const regiao of r.regioes) {
        const ex = gerarExterior(r, regiao);
        const n = ex.fase.mapa.length;
        const a = (x: number, y: number) => ex.alturas[y * n + x] ?? 0;
        for (const p of ex.faixas) {
          const vertical = p.lado === 'norte' || p.lado === 'sul';
          const [lo, hi] = vertical ? [p.area.x0, p.area.x1] : [p.area.y0, p.area.y1];
          // Pelo meio do corredor, da borda até 6 células além da saída.
          for (let t = lo + 3; t <= hi - 3; t++) {
            for (let d = 0; d < 34; d++) {
              const cel = (k: number): [number, number] => (p.lado ==='norte' ? [t, k] : p.lado === 'sul' ? [t, n - 1 - k] : p.lado === 'oeste' ? [k, t] : [n - 1 - k, t]);
              const [x0, y0] = cel(d);
              const [x1, y1] = cel(d + 1);
              if (ex.fase.mapa[y0]?.[x0] === '#' || ex.fase.mapa[y1]?.[x1] === '#') continue;
              expect(Math.abs(a(x1, y1) - a(x0, y0)), `${regiao.id} ${p.lado} (${x0}, ${y0})`).toBeLessThanOrEqual(R.encostaMax);
            }
          }
        }
      }
    }
  });

  it('as estruturas, a coleta e as luzes ficam onde se chega a pé', () => {
    for (const regiao of reino.regioes) {
      const ex = gerarExterior(reino, regiao);
      const fase = { ...faseDeTexto(ex.fase.mapa), alturas: ex.alturas };
      const origem = ex.fase.spawns[0];
      if (!origem) continue;
      for (const p of ex.pontos) {
        if (p.tipo !== 'coleta' && p.tipo !== 'estrutura') continue;
        const c = p.tipo === 'estrutura' ? p.frente : p;
        expect(caminho(fase, origem, c, 100_000).status, `${regiao.id} ${p.tipo}`).toBe('alcancado');
      }
    }
  });
});

describe('cavernas no morro (D-176)', () => {
  it('a caverna se abre no penhasco: o morro atrás sobe um muro alto e a boca fica no nível da frente', () => {
    let vistas = 0;
    for (const reino of CONTEUDO.reinos.values()) {
      for (const regiao of reino.regioes) {
        const cavernas = regiao.estruturas.filter((e) => !e.escondida && (e.tipo === 'caverna' || e.tipo === 'mina'));
        if (cavernas.length === 0) continue;
        const a = gerarExterior(reino, regiao).alturas;
        const n = regiao.tamanho ?? reino.tamanhoRegiao;
        for (const e of cavernas) {
          const x = e.x + Math.floor(e.largura / 2);
          const frente = a[(e.y + e.altura) * n + x] ?? 0;
          const porta = a[(e.y + e.altura - 1) * n + x] ?? 0;
          const fachada = a[e.y * n + e.x] ?? 0;
          expect(porta, `${regiao.id} ${e.id} porta`).toBe(frente);
          expect(fachada - frente, `${regiao.id} ${e.id} morro`).toBeGreaterThan(R.muroBaixoMax);
          vistas++;
        }
      }
    }
    expect(vistas).toBeGreaterThan(0);
  });
});
