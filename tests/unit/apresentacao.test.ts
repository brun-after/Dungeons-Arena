// Marco 12 (14/10/2026): partes puras da apresentação (áudio, qualidade, efeitos como dado, impacto) e a
// garantia de que nada disso muda o jogo (D-056).

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { compor, PASSOS_POR_LACO } from '../../src/audio/composicao';
import { climaDoEstado, ContextoMusical, PERMANENCIA_MS } from '../../src/audio/contexto-musical';
import { DISTANCIA_SILENCIO, MULTIPLICADOR_POSICIONAL, panPorPosicao, volumePorDistancia } from '../../src/audio/espacial';
import { LimitadorDeSom, PASSO_GLOBAL_MS, PASSO_POR_ENTIDADE_MS, variacaoDeTom } from '../../src/audio/limitador';
import { sonsDoEvento, somDaHabilidade, SONS } from '../../src/audio/mapeamento';
import type { Habilidade } from '../../src/combat/habilidades';
import { digest } from '../../src/core/digest';
import { criarEstado } from '../../src/core/estado';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { normalizarPreferencias, PREFERENCIAS_PADRAO } from '../../src/plataforma/preferencias';
import { ControladorImpacto, IMPACTOS_SIMULTANEOS, RECEITAS } from '../../src/render/impacto';
import { MonitorDeQualidade, PRESETS_QUALIDADE, qualidadePadrao } from '../../src/render/qualidade';
import { visualDe } from '../../src/render/visual-habilidade';
import { validarFase } from '../../src/world/validacao-fase';
import { criarBotAleatorio, criarCenario, rodar } from '../sim/harness';
import { CONTEUDO, contexto, faseOficial01, SALA_ABERTA } from '../apoio/fases';

function obter<T>(v: T | undefined | null, nome: string): T {
  if (v === undefined || v === null) throw new Error(`${nome} ausente`);
  return v;
}

describe('áudio: limites e espaço (§2.14)', () => {
  it('o mesmo som no máximo a cada 80 ms e com até 4 vozes', () => {
    const l = new LimitadorDeSom();
    expect(l.permitir('golpe', 0, 1000)).toBe(true);
    expect(l.permitir('golpe', 50, 1000)).toBe(false);
    expect(l.permitir('golpe', 80, 1000)).toBe(true);
    expect(l.permitir('golpe', 160, 1000)).toBe(true);
    expect(l.permitir('golpe', 240, 1000)).toBe(true);
    expect(l.permitir('golpe', 320, 1000)).toBe(false);
    expect(l.permitir('acerto', 320, 100)).toBe(true);
    expect(l.permitir('golpe', 1100, 1000)).toBe(true);
  });

  it('passos: 450 ms por entidade e 140 ms no total', () => {
    const l = new LimitadorDeSom();
    expect(l.permitirPasso('a', 0)).toBe(true);
    expect(l.permitirPasso('b', PASSO_GLOBAL_MS - 1)).toBe(false);
    expect(l.permitirPasso('b', PASSO_GLOBAL_MS)).toBe(true);
    expect(l.permitirPasso('a', PASSO_POR_ENTIDADE_MS - 1)).toBe(false);
    expect(l.permitirPasso('a', PASSO_POR_ENTIDADE_MS)).toBe(true);
  });

  it('volume cai com a distância até o silêncio em 20 células; pan pelo X', () => {
    expect(volumePorDistancia(0)).toBe(MULTIPLICADOR_POSICIONAL);
    expect(volumePorDistancia(10)).toBeCloseTo(MULTIPLICADOR_POSICIONAL / 2);
    expect(volumePorDistancia(DISTANCIA_SILENCIO)).toBe(0);
    expect(panPorPosicao(0, 0)).toBe(0);
    expect(panPorPosicao(100, 0)).toBe(1);
    expect(panPorPosicao(-100, 0)).toBe(-1);
    expect(variacaoDeTom(0)).toBeCloseTo(0.92);
    expect(variacaoDeTom(0.999)).toBeLessThan(1.08);
  });
});

describe('áudio: mapeamento e música', () => {
  it('toda habilidade oficial tem um som válido; o conteúdo manda, o prefixo e o tipo deduzem', () => {
    for (const h of CONTEUDO.habilidades.values()) expect(SONS).toContain(somDaHabilidade(h));
    const base = obter(CONTEUDO.habilidades.get('golpe'), 'golpe');
    const semVisual = (id: string, extra: Partial<Habilidade> = {}): Habilidade => ({ ...base, id, visual: null, ...extra });
    expect(somDaHabilidade(semVisual('flecha_de_gelo'))).toBe('projetil');
    expect(somDaHabilidade(semVisual('curar_grupo'))).toBe('cura');
    expect(somDaHabilidade(semVisual('xyz', { tipoAtaque: 'magico' }))).toBe('magia');
    expect(somDaHabilidade(semVisual('xyz', { politicaImpacto: 'area', tipoArea: 'quadrado' }))).toBe('explosao');
  });

  it('eventos viram sons; coleta e nível só do jogador local, como som global', () => {
    const hab = (id: string) => CONTEUDO.habilidades.get(id);
    expect(sonsDoEvento({ t: 'coletou', tick: 0, id: 'j', objetoId: 'o', tipo: 'ouro', ganho: 5, itemId: null }, 'j', hab)).toEqual([{ som: 'moeda', origemId: null }]);
    expect(sonsDoEvento({ t: 'coletou', tick: 0, id: 'k', objetoId: 'o', tipo: 'ouro', ganho: 5, itemId: null }, 'j', hab)).toEqual([]);
    const impacto = { t: 'impacto', tick: 0, acaoId: 1, fonteId: 'j', alvoId: 'g', habilidadeId: 'golpe', chave: 'golpe', dano: 5, cura: 0, d20: 15, mult: 1.2, falha: false, critico: false, imune: false, indice: 0 } as const;
    const comSinergias = { ...impacto, sinergias: [] as string[] };
    expect(sonsDoEvento(comSinergias, 'j', hab)).toEqual([{ som: 'acerto', origemId: 'g' }]);
    expect(sonsDoEvento({ ...comSinergias, critico: true }, 'j', hab)).toEqual([{ som: 'critico', origemId: 'g' }]);
    expect(sonsDoEvento({ ...comSinergias, falha: true }, 'j', hab)).toEqual([{ som: 'falha', origemId: 'g' }]);
  });

  it('a mesma fase compõe a mesma música; climas e fases diferentes, músicas diferentes', () => {
    const a = compor('fase-01', 'exploracao');
    expect(a).toEqual(compor('fase-01', 'exploracao'));
    expect(a.passos).toHaveLength(PASSOS_POR_LACO);
    expect(compor('fase-02', 'exploracao')).not.toEqual(a);
    const combate = compor('fase-01', 'combate');
    const chefe = compor('fase-01', 'chefe');
    expect(a.bpm).toBeLessThan(combate.bpm);
    expect(combate.bpm).toBeLessThan(chefe.bpm);
    expect(chefe.passos.filter((p) => p.bumbo).length).toBeGreaterThan(a.passos.filter((p) => p.bumbo).length);
  });

  it('o clima: combate com perseguição, chefe com boss; desce só depois de 4 s', () => {
    const ctx = contexto(faseOficial01());
    const estado = criarEstado({ semente: 1, faseId: 'x' });
    const classe = obter(CONTEUDO.classes.get('aventureiro'), 'classe');
    estado.entidades.push(criarJogador(classe, 'j', 5, 5, ctx.balance));
    const g = criarInimigo(obter(CONTEUDO.presets.get('goblin'), 'goblin'), 'g', 7, 5, ctx.balance);
    const b = criarInimigo(obter(CONTEUDO.presets.get('boss'), 'boss'), 'b', 9, 5, ctx.balance);
    estado.entidades.push(g, b);
    expect(climaDoEstado(estado, 'j')).toBe('exploracao');
    g.ia = { modo: 'perseguindo', alvoId: 'j' } as NonNullable<typeof g.ia>;
    expect(climaDoEstado(estado, 'j')).toBe('combate');
    b.ia = { modo: 'perseguindo', alvoId: 'j' } as NonNullable<typeof b.ia>;
    expect(climaDoEstado(estado, 'j')).toBe('chefe');
    const m = new ContextoMusical();
    expect(m.atualizar('combate', 0)).toBe('combate');
    expect(m.atualizar('exploracao', PERMANENCIA_MS - 1)).toBe('combate');
    expect(m.atualizar('exploracao', PERMANENCIA_MS)).toBe('exploracao');
  });
});

describe('qualidade (§4.10)', () => {
  it('padrão: baixo no toque e alto no desktop; mínimo sem partículas', () => {
    expect(qualidadePadrao(true)).toBe('baixo');
    expect(qualidadePadrao(false)).toBe('alto');
    expect(PRESETS_QUALIDADE.minimo.particulas).toBe(0);
    expect(PRESETS_QUALIDADE.alto.poeira).toBe(true);
  });

  it('desce um nível com média abaixo de 45 fps em duas verificações seguidas e nunca sobe', () => {
    const m = new MonitorDeQualidade('alto');
    let t = 0;
    const rodarS = (s: number, fps: number) => {
      const mudancas: string[] = [];
      for (let i = 0; i < s * fps; i++) {
        t += 1000 / fps;
        const r = m.registrar(1000 / fps, t);
        if (r) mudancas.push(r);
      }
      return mudancas;
    };
    expect(rodarS(6, 60)).toEqual([]);
    expect(rodarS(5, 30)).toEqual([]);
    expect(rodarS(5.5, 30)).toEqual(['medio']);
    expect(rodarS(30, 60)).toEqual([]);
    expect(m.nivel).toBe('medio');
  });
});

describe('preferências', () => {
  it('os campos novos são normalizados; lixo volta ao padrão', () => {
    expect(normalizarPreferencias({})).toEqual(PREFERENCIAS_PADRAO);
    const p = normalizarPreferencias({ qualidade: 'medio', volumeMusica: 2, escalaInterface: 0.1, movimentoReduzido: 'sempre', mudo: 'sim' });
    expect(p).toMatchObject({ qualidade: 'medio', volumeMusica: 1, escalaInterface: 0.8, movimentoReduzido: 'sempre', mudo: false });
  });
});

describe('efeitos visuais como dado (D-055)', () => {
  it('as habilidades oficiais (fora as passivas) têm visual; sem o bloco, ele é deduzido', () => {
    // Marco 14: 16 do marco 12 e 22 do sistema de habilidades; marco 18: as 4 fusões e a Chuva de estrelas.
    expect(CONTEUDO.habilidades.size).toBe(60);
    for (const h of CONTEUDO.habilidades.values()) {
      if (h.passiva) continue;
      expect(h.visual).not.toBeNull();
      const v = visualDe(h);
      expect(v.impacto ?? v.conjuracao).not.toBeNull();
    }
    const explosao = obter(CONTEUDO.habilidades.get('explosao'), 'explosao');
    expect(visualDe({ ...explosao, visual: null })).toMatchObject({ impacto: 'explosao', camera: 'leve' });
    const curar = obter(CONTEUDO.habilidades.get('curar'), 'curar');
    expect(visualDe({ ...curar, visual: null })).toMatchObject({ impacto: 'brilho', cor: 0x2ecc71 });
  });

  it('presets de impacto: até 3 ao mesmo tempo, fila para o resto, nada com os efeitos desligados', () => {
    let ligado = true;
    const c = new ControladorImpacto(() => ligado);
    for (let i = 0; i < 5; i++) c.pedir('forte', 0);
    expect(c.quadro(10).congelado).toBe(true);
    expect(c.ativosAgora).toBe(IMPACTOS_SIMULTANEOS);
    expect(c.quadro(310).dx).not.toBe(0);
    ligado = false;
    expect(c.quadro(320)).toMatchObject({ dx: 0, dy: 0, flash: 0, congelado: false });
  });
});

describe('intensidade dos efeitos de tela (ajuste de 14/10/2026)', () => {
  it('tremor e flash pela metade: o forte treme até 4,5 px e pisca até 0,11', () => {
    expect(RECEITAS).toMatchObject({ leve: { tremorPx: 2 }, forte: { tremorPx: 4.5, flash: 0.11 }, dano: { tremorPx: 2.5, flash: 0.09 } });
    const c = new ControladorImpacto(() => true);
    c.pedir('forte', 0);
    let maxTremor = 0;
    let maxFlash = 0;
    for (let t = 0; t < 300; t += 5) {
      const q = c.quadro(t);
      maxTremor = Math.max(maxTremor, Math.abs(q.dx), Math.abs(q.dy));
      maxFlash = Math.max(maxFlash, q.flash);
    }
    expect(maxTremor).toBeLessThanOrEqual(4.5);
    expect(maxFlash).toBeLessThanOrEqual(0.11);
  });
});

describe('fonte sonora da fase', () => {
  it('valida som, alcance e volume; a fase 1 e a 2 têm fontes', () => {
    const fase = (o: unknown) => validarFase({ id: 'a', nome: 'a', ordem: 1, tipo: 'campanha', mapa: SALA_ABERTA, spawns: [{ x: 2, y: 2 }], objetos: [o] });
    expect(fase({ tipo: 'fonte_som', x: 0.5, y: 0.5, sfxId: 'fogo', raio: 6, volume: 0.6 }).ok).toBe(true);
    expect(fase({ tipo: 'fonte_som', x: 0.5, y: 0.5, sfxId: 'trovao', raio: 6, volume: 0.6 }).ok).toBe(false);
    expect(fase({ tipo: 'fonte_som', x: 0.5, y: 0.5, sfxId: 'fogo', raio: 0, volume: 0.6 }).ok).toBe(false);
    expect(fase({ tipo: 'fonte_som', x: 0.5, y: 0.5, sfxId: 'fogo', raio: 6, volume: 2 }).ok).toBe(false);
    expect(faseOficial01().objetos.filter((o) => o.tipo === 'fonte_som').map((o) => o.som)).toEqual(['fogo', 'goteira', 'vento']);
  });
});

describe('a apresentação não muda o jogo (D-056)', () => {
  const PASTAS = ['core', 'combat', 'world', 'entities', 'progression', 'modos', 'save'].map((p) => join('src', p));
  const arquivos = (pasta: string): string[] =>
    readdirSync(pasta).flatMap((n) => {
      const c = join(pasta, n);
      return statSync(c).isDirectory() ? arquivos(c) : c.endsWith('.ts') ? [c] : [];
    });

  it('o núcleo não importa render, áudio nem interface', () => {
    const ofensores = PASTAS.flatMap(arquivos).filter((c) => /from '(\.\.\/)+(render|audio|ui)\//.test(readFileSync(c, 'utf8')));
    expect(ofensores).toEqual([]);
  });

  it('o mesmo digest com e sem o visual das habilidades', () => {
    const semVisual = new Map([...CONTEUDO.habilidades].map(([id, h]) => [id, { ...h, visual: null }]));
    const a = criarCenario({ semente: 21 });
    const b = criarCenario({ semente: 21, ctx: { ...a.ctx, conteudo: { ...a.ctx.conteudo, habilidades: semVisual } } });
    rodar(a, 1_500, criarBotAleatorio(6));
    rodar(b, 1_500, criarBotAleatorio(6));
    expect(digest(a.estado)).toBe(digest(b.estado));
  });
});
