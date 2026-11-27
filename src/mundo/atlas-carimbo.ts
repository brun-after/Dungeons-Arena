// Marco 55 (26/11/2026, D-208): o carimbo das regiões no atlas, o mesmo no servidor e no cliente. Puro.
// O servidor gera as 24 regiões ao subir e carimba todas de uma vez (mundo/mundo-continuo.ts); o cliente gera cada uma
// num trabalhador (mundo/gerador-remoto.ts), a de onde o jogador está primeiro, e carimba conforme chegam: a fase do
// atlas é a mesma desde o começo (o mesmo objeto e os mesmos vetores de células), e o que ainda não chegou é vazio.
// As listas da fase (spawns, áreas, refúgios, telhados…) saem sempre na mesma ordem, a canônica (a região de início
// primeiro, depois a ordem do reino), seja qual for a ordem em que as regiões chegaram: o índice de uma área fixa
// (`TerrenoVivo.cobre`) é o mesmo no servidor e no cliente quando as regiões antes dela já estão carimbadas.

import type { Celula } from '../core/comandos';
import { codigoDeTipo, type Fase } from '../world/fase';
import type { ExteriorGerado, PontoDoExterior } from '../world/gerador-exterior';
import type { Refugio } from '../world/refugio';
import { paraOAtlas, type AreaNoAtlas, type Atlas } from './atlas';
import type { Reino } from './reino';

export const ID_DO_MUNDO = 'mundo_atlas';

/** Uma região gerada para o atlas: a fase dela (em coordenadas da área), o que o gerador deu e onde fica. */
export interface RegiaoCarimbada {
  regiaoId: string;
  area: AreaNoAtlas;
  fase: Fase;
  ex: ExteriorGerado;
}

export const moverNoAtlas = <T extends { x: number; y: number }>(o: T, a: AreaNoAtlas): T => ({ ...o, x: o.x + a.x, y: o.y + a.y });

export function moverPonto(p: PontoDoExterior, a: AreaNoAtlas): PontoDoExterior {
  return p.tipo === 'estrutura' ? { ...p, porta: moverNoAtlas(p.porta, a), frente: moverNoAtlas(p.frente, a) } : moverNoAtlas(p, a);
}

/** A ordem canônica das regiões carimbadas: a de início primeiro (o primeiro spawn é a Vila do Centro), depois a do reino. */
export function emOrdemCanonica(reino: Reino, partes: readonly RegiaoCarimbada[]): RegiaoCarimbada[] {
  const ordem = new Map(reino.regioes.map((r, i) => [r.id, r.id === reino.inicio ? -1 : i]));
  return [...partes].sort((p, q) => (ordem.get(p.regiaoId) ?? 0) - (ordem.get(q.regiaoId) ?? 0));
}

/** A fase do atlas ainda sem nenhuma região: tudo vazio, sem altura nem obstáculo. */
export function faseVaziaDoAtlas(reino: Reino, atlas: Atlas): Fase {
  const total = atlas.largura * atlas.altura;
  const fase: Fase = {
    id: ID_DO_MUNDO,
    nome: reino.nome,
    ordem: 0,
    largura: atlas.largura,
    altura: atlas.altura,
    celulas: new Uint8Array(total).fill(codigoDeTipo('vazio')),
    tipo: 'campanha',
    spawns: [],
    inimigos: [],
    objetos: [],
    portaSaida: null,
    portasInternas: [],
    matizGraus: 0,
    tilesetId: null,
    pecas: {},
    eventos: [],
    ambientes: [],
    tema: null,
    refugios: [],
    estruturas: reino.regioes.flatMap((r) => {
      const a = atlas.areas.get(r.id);
      return a ? r.estruturas.map((e) => ({ ...paraOAtlas(a, e.x, e.y), tipo: e.tipo })) : [];
    }),
    exterior: true,
    matas: reino.regioes.flatMap((r) => {
      const a = atlas.areas.get(r.id);
      return a ? (r.matas ?? []).map((m) => ({ ...m, ...paraOAtlas(a, m.x, m.y) })) : [];
    }),
    ninhos: [],
    alturas: new Uint8Array(total),
    obstaculos: new Uint8Array(total),
    cenario: [],
    telhados: [],
  };
  return fase;
}

/** Escreve as células, as alturas e os obstáculos da região nos vetores do atlas (no lugar). */
export function carimbarCelulas(atlasFase: Fase, p: RegiaoCarimbada): void {
  const L = atlasFase.largura;
  const { fase: f, area, ex } = p;
  for (let y = 0; y < f.altura; y++) {
    const de = y * f.largura;
    const para = (area.y + y) * L + area.x;
    atlasFase.celulas.set(f.celulas.subarray(de, de + f.largura), para);
    atlasFase.alturas?.set(ex.alturas.subarray(de, de + f.largura), para);
    atlasFase.obstaculos?.set(ex.obstaculos.subarray(de, de + f.largura), para);
  }
}

/** As listas da fase do atlas com as regiões carimbadas (na ordem canônica), e os pontos e as rotas do exterior. */
export function listasDoAtlas(reino: Reino, partes: readonly RegiaoCarimbada[]): {
  fase: Pick<Fase, 'spawns' | 'inimigos' | 'objetos' | 'ambientes' | 'refugios' | 'ninhos' | 'cenario' | 'telhados'>;
  pontos: PontoDoExterior[];
  rotas: Celula[][];
} {
  const ordem = emOrdemCanonica(reino, partes);
  const refugios: Refugio[] = [];
  const pontos: PontoDoExterior[] = [];
  const rotas: Celula[][] = [];
  for (const { area, ex } of ordem) {
    if (ex.vila) refugios.push({ x: ex.vila.x + area.x, y: ex.vila.y + area.y, raio: ex.vila.raio + 0.5 });
    if (ex.abrigo) refugios.push({ x: ex.abrigo.x + area.x, y: ex.abrigo.y + area.y, raio: ex.abrigo.raio + 0.5 });
    pontos.push(...ex.pontos.map((p) => moverPonto(p, area)));
    rotas.push(...ex.rotas.map((rota) => rota.map((c) => moverNoAtlas(c, area))));
  }
  return {
    fase: {
      spawns: ordem.flatMap(({ fase: f, area }) => f.spawns.map((s) => moverNoAtlas(s, area))),
      inimigos: ordem.flatMap(({ fase: f, area }) => f.inimigos.map((i) => moverNoAtlas(i, area))),
      objetos: ordem.flatMap(({ fase: f, area }) => f.objetos.map((o) => moverNoAtlas(o, area))),
      ambientes: ordem.flatMap(({ fase: f, area }) => (f.ambientes ?? []).map((a) => moverNoAtlas(a, area))),
      refugios,
      ninhos: ordem.flatMap(({ ex, area }) => ex.ninhos.map((n) => moverNoAtlas(n, area))),
      cenario: ordem.flatMap(({ ex, area }) => ex.pecas.map((p) => moverNoAtlas(p, area))),
      // Os telhados vêm do gerador (a leitura da fase não os guarda; mundo/lugares.ts fazia igual).
      telhados: ordem.flatMap(({ fase: f, ex, area }) => (ex.fase.telhados ?? f.telhados ?? []).map((t) => moverNoAtlas(t, area))),
    },
    pontos,
    rotas,
  };
}

/**
 * Carimba as regiões na fase do atlas: as células no lugar e as listas trocadas por listas novas (quem guarda um
 * índice por lista, como `areasEfetivasEm`, refaz na próxima pergunta).
 */
export function carimbarNoAtlas(reino: Reino, atlasFase: Fase, todas: readonly RegiaoCarimbada[], novas: readonly RegiaoCarimbada[] = todas): { pontos: PontoDoExterior[]; rotas: Celula[][] } {
  for (const p of novas) carimbarCelulas(atlasFase, p);
  const l = listasDoAtlas(reino, todas);
  Object.assign(atlasFase, l.fase);
  return { pontos: l.pontos, rotas: l.rotas };
}
