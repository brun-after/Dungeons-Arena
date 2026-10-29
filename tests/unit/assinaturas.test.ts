// Marco 26 (29/10/2026, D-124): as assinaturas visuais. Toda skill ativa resolve uma assinatura que existe; nenhuma
// cai no brilho genérico; dentro de um kit e entre as ultimates de uma classe, nada se repete; o tema manda (fogo é
// fogo, corrente é corrente, giro gira); e cada assinatura tem silhueta própria.

import { describe, expect, it } from 'vitest';
import { ASSINATURAS_VISUAIS, VARIANTES_VISUAIS } from '../../src/combat/assinaturas-visuais';
import { resolverHabilidade } from '../../src/combat/compilar-habilidade';
import { ELEMENTOS } from '../../src/combat/elementos';
import type { Habilidade } from '../../src/combat/habilidades';
import { BALANCE_PADRAO } from '../../src/core/contexto';
import { ASSINATURAS, texturasDe, VARIANTES } from '../../src/render/vfx/assinaturas';
import { assinaturaDe, formaVfx } from '../../src/render/vfx/resolver';
import { ehTexturaRica, TEXTURAS_RICAS } from '../../src/render/vfx/texturas';
import { TEXTURAS_PARTICULA } from '../../src/render/presets-particula';
import { visualDe } from '../../src/render/visual-habilidade';
import { CONTEUDO } from '../apoio/fases';

const ativas = (): Habilidade[] => [...CONTEUDO.habilidades.values()].filter((h) => !h.passiva);
const ctx = { conteudo: CONTEUDO, balance: BALANCE_PADRAO };
const FOGO = new Set(Object.entries(ASSINATURAS).filter(([, d]) => d.familia === 'fogo').map(([n]) => n));
const GIROS = new Set(['redemoinho', 'ciclone_de_fogo', 'turbilhao_de_correntes', 'furacao']);

describe('assinaturas visuais', () => {
  it('o registro cobre a lista fechada, sem sobra', () => {
    expect(Object.keys(ASSINATURAS).sort()).toEqual([...ASSINATURAS_VISUAIS].sort());
    expect(Object.keys(VARIANTES).sort()).toEqual([...VARIANTES_VISUAIS].sort());
  });

  it('toda skill ativa dos dados diz a sua assinatura (e ela existe)', () => {
    for (const h of ativas()) {
      expect(h.visual?.assinatura, h.id).toBeDefined();
      expect(ASSINATURAS[assinaturaDe(h)], h.id).toBeDefined();
    }
  });

  it('cada assinatura tem silhueta e matéria própria (não só brilho e ponto)', () => {
    for (const [nome, d] of Object.entries(ASSINATURAS)) {
      expect(!!(d.aoAcertar ?? d.naArea ?? d.emSi ?? d.corpo), nome).toBe(true);
      const texturas = [...texturasDe(d)];
      if (texturas.length) expect(texturas.some((t) => t !== 'brilho' && t !== 'ponto'), nome).toBe(true);
      for (const t of texturas) expect(ehTexturaRica(t) || (TEXTURAS_PARTICULA as readonly string[]).includes(t), `${nome}: ${t}`).toBe(true);
    }
  });

  it('dentro do kit de cada classe, nenhuma skill repete a assinatura com a mesma variante e cor', () => {
    for (const classe of CONTEUDO.classes.values()) {
      const vistos = new Map<string, string>();
      for (const id of [classe.ataqueBasico, ...classe.exclusivas]) {
        const h = id ? CONTEUDO.habilidades.get(id) : undefined;
        if (!h) continue;
        const chave = `${assinaturaDe(h)}|${h.visual?.variante ?? ''}|${visualDe(h).cor}`;
        expect(vistos.get(chave), `${classe.id}: ${id} repete ${vistos.get(chave) ?? ''}`).toBeUndefined();
        vistos.set(chave, id);
      }
    }
  });

  it('entre as ultimates de cada classe, nenhuma repete a assinatura com a mesma variante', () => {
    const porClasse = new Map<string, Map<string, string>>();
    for (const u of CONTEUDO.ultimates.values()) {
      const h = CONTEUDO.habilidades.get(u.id);
      expect(h, u.id).toBeDefined();
      if (!h) continue;
      const mapa = porClasse.get(u.classe) ?? new Map<string, string>();
      porClasse.set(u.classe, mapa);
      const chave = `${assinaturaDe(h)}|${h.visual?.variante ?? ''}`;
      expect(mapa.get(chave), `${u.classe}: ${u.id} repete ${mapa.get(chave) ?? ''}`).toBeUndefined();
      mapa.set(chave, u.id);
    }
  });

  it('o tema manda: fogo é fogo, corrente é corrente, giro gira', () => {
    for (const h of ativas()) {
      const nome = assinaturaDe(h);
      const etapa = /_\d+$/.test(h.id);
      // O fogo é da família do fogo, ou leva o toque de brasas, ou é a corrente em brasa (os Grilhões).
      if (h.elemento === 'fogo' && !etapa) expect(FOGO.has(nome) || h.visual?.variante === 'brasas' || nome === 'grilhoes', h.id).toBe(true);
      if (/corrente|cadeia_sombria|grilh|laco_do|acorrent/.test(h.id)) expect(ASSINATURAS[nome].familia, h.id).toBe('corrente');
      if (/redemoinho|turbilh|rodopi|ciclone|vortice|furacao/.test(h.id)) expect(GIROS.has(nome), h.id).toBe(true);
    }
  });

  it('as etapas de vários elementos mostram o elemento da etapa', () => {
    const etapa = (id: string) => CONTEUDO.habilidades.get(id);
    expect(etapa('ult_lanca_dos_quatro_ventos_1')?.visual?.assinatura).toBe('mao_em_chamas');
    expect(etapa('ult_lanca_dos_quatro_ventos_2')?.visual?.assinatura).toBe('toque_eletrico');
    expect(etapa('ult_lanca_dos_quatro_ventos_3')?.visual?.assinatura).toBe('golpe_pesado');
    expect(etapa('ult_danca_dos_elementos_1')?.visual?.assinatura).toBe('tempestade_de_gelo');
  });

  it('as skills geradas deduzem pelo elemento e pela forma (nunca o genérico)', () => {
    const vistas = new Set<string>();
    for (let semente = 1; semente < 1500; semente++) {
      const h = resolverHabilidade(ctx, `g_${semente}_1`);
      if (!h?.elemento) continue;
      vistas.add(`${h.elemento}:${formaVfx(h)}`);
      const nome = assinaturaDe(h);
      if (h.elemento === 'fogo') expect(FOGO.has(nome), h.id).toBe(true);
    }
    expect(vistas.size).toBeGreaterThan(15);
    for (const el of ELEMENTOS) expect([...vistas].some((v) => v.startsWith(`${el}:`)) || !['fogo', 'gelo', 'raio', 'veneno', 'psiquico'].includes(el)).toBe(true);
  });

  it('as correções de tema ficaram (Marca sombria, Lança tempestuosa, giros que faltavam)', () => {
    const h = (id: string) => CONTEUDO.habilidades.get(id);
    expect(h('marca_de_area')?.visual?.assinatura).toBe('marca_sombria');
    expect(h('lanca_tempestuosa')?.visual?.cor).not.toBe('#a0d8ef');
    expect(h('chuva_de_estrelas')?.visual?.assinatura).toBe('chuva_de_estrelas');
    for (const id of ['ciclone_flamejante', 'contragolpe_giro', 'ult_olho_do_furacao', 'ult_turbilhao_de_correntes']) expect(h(id)?.visual?.animacao, id).toBe('giro');
    // As ultimates conjuram no círculo da classe: o preset de runas genérico saiu.
    for (const u of CONTEUDO.ultimates.values()) expect(h(u.id)?.visual?.conjuracao ?? null, u.id).toBeNull();
  });

  it('o atlas rico tem nomes únicos e os quadros da chama', () => {
    expect(new Set(TEXTURAS_RICAS).size).toBe(TEXTURAS_RICAS.length);
    for (let i = 0; i < 8; i++) expect(ehTexturaRica(`chama${i}`)).toBe(true);
  });
});
