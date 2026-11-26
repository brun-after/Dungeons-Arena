// Marco 54 (26/11/2026, D-207): o lugar do Mundo contínuo. As 24 regiões, cada uma gerada no lugar dela do atlas
// (mundo/atlas-fase.ts) e validada como fase própria, são carimbadas numa fase só, do tamanho do atlas. O que fica
// entre as áreas (o canto abaixo da Travessia) é vazio. Os ids dos inimigos (`i000`…) saem da ordem da lista única, e
// os dos objetos de cada região levam a id dela, então nada colide. Puro.

import type { Conteudo } from '../core/conteudo';
import { BALANCE_PADRAO, type ContextoSimulacao } from '../core/contexto';
import type { Celula } from '../core/comandos';
import type { ModoDeJogo } from '../modos/modo';
import { contextoDaFase, estadoInicialDaFase } from '../save/fases-campanha';
import { codigoDeTipo, type Fase } from '../world/fase';
import type { ExteriorGerado, PontoDoExterior } from '../world/gerador-exterior';
import type { Refugio } from '../world/refugio';
import { montarAtlas, paraOAtlas, type AreaNoAtlas, type Atlas } from './atlas';
import { gerarRegiaoNoAtlas } from './atlas-fase';
import { comMateriais, type LugarMontado } from './lugares';
import { objetosDoExterior } from './objetos-mundo';
import { territorioDoLugar, type MaterialDeInimigo, type Reino, type RegiaoDoMundo } from './reino';
import { mapaDeZonas, type MapaDeZonas } from './zonas';

export const ID_DO_MUNDO = 'mundo_atlas';

export interface MundoMontado extends LugarMontado {
  atlas: Atlas;
  zonas: MapaDeZonas;
  /** As regiões com vila, estruturas e matas em coordenadas do atlas (as regras por zona leem estas). */
  regioesNoAtlas: ReadonlyMap<string, RegiaoDoMundo>;
  regiaoDoAtlas: RegiaoDoMundo;
}

/** A região com o que ela tem de posição (vila, estruturas, matas) levado ao atlas. */
export function regiaoNoAtlas(r: RegiaoDoMundo, a: AreaNoAtlas): RegiaoDoMundo {
  return {
    ...r,
    vila: r.vila && { ...r.vila, ...paraOAtlas(a, r.vila.x, r.vila.y) },
    estruturas: r.estruturas.map((e) => ({ ...e, ...paraOAtlas(a, e.x, e.y) })),
    ...(r.matas && { matas: r.matas.map((m) => ({ ...m, ...paraOAtlas(a, m.x, m.y) })) }),
  };
}

const mover = <T extends { x: number; y: number }>(o: T, a: AreaNoAtlas): T => ({ ...o, x: o.x + a.x, y: o.y + a.y });

function moverPonto(p: PontoDoExterior, a: AreaNoAtlas): PontoDoExterior {
  return p.tipo === 'estrutura' ? { ...p, porta: mover(p.porta, a), frente: mover(p.frente, a) } : mover(p, a);
}

/** Os materiais que os monstros deixam, de todos os reinos do atlas. */
function comTodosOsMateriais(modo: ModoDeJogo, reino: Reino): ModoDeJogo {
  const base = comMateriais(modo, reino, reino.inicio);
  const materiais: Record<string, readonly MaterialDeInimigo[]> = { ...base.materiaisDeInimigos };
  for (const t of reino.territorios ?? []) {
    for (const [preset, lista] of Object.entries(t.materiais)) {
      const atual = materiais[preset] ?? [];
      materiais[preset] = [...atual, ...lista.filter((m) => !atual.some((x) => x.itemId === m.itemId))];
    }
  }
  return { ...base, materiaisDeInimigos: materiais };
}

/** Monta a fase do atlas inteiro, o estado inicial (inimigos e objetos de todas as regiões) e as zonas. */
export function montarMundoContinuo(conteudo: Conteudo, reino: Reino, modoBase: ModoDeJogo): MundoMontado {
  const etapas = etapasDoMundoContinuo(conteudo, reino, modoBase);
  for (;;) {
    const r = etapas.next();
    if (r.done) return r.value;
  }
}

/**
 * A mesma montagem em etapas: cada `next()` gera uma região (0,4 a 0,9 s de CPU). O servidor espera entre elas para
 * não travar o processo enquanto sobe (como o `aquecer` das regiões fazia).
 */
export function* etapasDoMundoContinuo(conteudo: Conteudo, reino: Reino, modoBase: ModoDeJogo): Generator<string, MundoMontado> {
  const atlas = montarAtlas(reino);
  const L = atlas.largura;
  const total = L * atlas.altura;
  const celulas = new Uint8Array(total).fill(codigoDeTipo('vazio'));
  const alturas = new Uint8Array(total);
  const obstaculos = new Uint8Array(total);
  const partes: { fase: Fase; area: AreaNoAtlas; ex: ExteriorGerado; regiaoId: string }[] = [];
  for (const regiao of reino.regioes) {
    const area = atlas.areas.get(regiao.id);
    if (!area) continue;
    const ex = gerarRegiaoNoAtlas(reino, atlas, regiao);
    const r = contextoDaFase(conteudo, ex.fase, modoBase);
    if (!r.ok) throw new Error(`região ${regiao.id} inválida no atlas: ${r.erro}`);
    const f = r.ctx.fase;
    for (let y = 0; y < f.altura; y++) {
      const de = y * f.largura;
      const para = (area.y + y) * L + area.x;
      celulas.set(f.celulas.subarray(de, de + f.largura), para);
      alturas.set(ex.alturas.subarray(de, de + f.largura), para);
      obstaculos.set(ex.obstaculos.subarray(de, de + f.largura), para);
    }
    partes.push({ fase: f, area, ex, regiaoId: regiao.id });
    yield regiao.id;
  }
  // A região de início primeiro: o primeiro spawn da fase é a Vila do Centro.
  partes.sort((p, q) => Number(q.regiaoId === reino.inicio) - Number(p.regiaoId === reino.inicio));
  const refugios: Refugio[] = [];
  const pontos: PontoDoExterior[] = [];
  const rotas: Celula[][] = [];
  for (const { area, ex } of partes) {
    if (ex.vila) refugios.push({ x: ex.vila.x + area.x, y: ex.vila.y + area.y, raio: ex.vila.raio + 0.5 });
    if (ex.abrigo) refugios.push({ x: ex.abrigo.x + area.x, y: ex.abrigo.y + area.y, raio: ex.abrigo.raio + 0.5 });
    pontos.push(...ex.pontos.map((p) => moverPonto(p, area)));
    rotas.push(...ex.rotas.map((rota) => rota.map((c) => mover(c, area))));
  }
  const fase: Fase = {
    id: ID_DO_MUNDO,
    nome: reino.nome,
    ordem: 0,
    largura: L,
    altura: atlas.altura,
    celulas,
    tipo: 'campanha',
    spawns: partes.flatMap(({ fase: f, area }) => f.spawns.map((s) => mover(s, area))),
    inimigos: partes.flatMap(({ fase: f, area }) => f.inimigos.map((i) => mover(i, area))),
    objetos: partes.flatMap(({ fase: f, area }) => f.objetos.map((o) => mover(o, area))),
    portaSaida: null,
    portasInternas: [],
    matizGraus: 0,
    tilesetId: null,
    pecas: {},
    eventos: [],
    ambientes: partes.flatMap(({ fase: f, area }) => (f.ambientes ?? []).map((a) => mover(a, area))),
    tema: null,
    refugios,
    estruturas: reino.regioes.flatMap((r) => {
      const a = atlas.areas.get(r.id);
      return a ? r.estruturas.map((e) => ({ ...paraOAtlas(a, e.x, e.y), tipo: e.tipo })) : [];
    }),
    exterior: true,
    matas: reino.regioes.flatMap((r) => {
      const a = atlas.areas.get(r.id);
      return a ? (r.matas ?? []).map((m) => ({ ...m, ...paraOAtlas(a, m.x, m.y) })) : [];
    }),
    ninhos: partes.flatMap(({ ex, area }) => ex.ninhos.map((n) => mover(n, area))),
    alturas,
    obstaculos,
    cenario: partes.flatMap(({ ex, area }) => ex.pecas.map((p) => mover(p, area))),
    telhados: partes.flatMap(({ fase: f, area }) => (f.telhados ?? []).map((t) => mover(t, area))),
  };
  const ctx: ContextoSimulacao = { fase, balance: BALANCE_PADRAO, conteudo, modo: comTodosOsMateriais(modoBase, reino) };
  const estado = estadoInicialDaFase(ctx);
  // Os objetos de cada região (lojas pelo reino dela), com a id da região na frente; os errantes, na ordem das rotas.
  let errante = 0;
  for (const { ex, area, regiaoId } of partes) {
    const deslocado: ExteriorGerado = { ...ex, pontos: ex.pontos.map((p) => moverPonto(p, area)), rotas: ex.rotas.map((rota) => rota.map((c) => mover(c, area))) };
    for (const o of objetosDoExterior(territorioDoLugar(reino, regiaoId), deslocado)) {
      estado.objetos.push({ ...o, objetoId: o.objetoId.startsWith('errante-') ? `errante-${String(errante++)}` : `${regiaoId}:${o.objetoId}` });
    }
  }
  const exterior: ExteriorGerado = {
    fase: { id: ID_DO_MUNDO, nome: reino.nome, ordem: 0, tipo: 'campanha', mapa: [], spawns: fase.spawns.map((s) => ({ ...s })) },
    pontos,
    passagens: { norte: [], sul: [], leste: [], oeste: [] },
    faixas: [],
    enfeites: [],
    vila: null,
    abrigo: null,
    rotas,
    alturas,
    obstaculos,
    pecas: fase.cenario ?? [],
    ninhos: fase.ninhos ?? [],
  };
  const regioesNoAtlas = new Map<string, RegiaoDoMundo>();
  for (const r of reino.regioes) {
    const a = atlas.areas.get(r.id);
    if (a) regioesNoAtlas.set(r.id, regiaoNoAtlas(r, a));
  }
  const inicio = regioesNoAtlas.get(reino.inicio) ?? [...regioesNoAtlas.values()][0];
  if (!inicio) throw new Error('atlas sem regiões');
  // As estruturas de todas as regiões numa só (as escoltas e as escondidas procuram por id e posição).
  const regiaoDoAtlas: RegiaoDoMundo = { ...inicio, estruturas: [...regioesNoAtlas.values()].flatMap((r) => r.estruturas) };
  return { ctx, estado, exterior, atlas, zonas: mapaDeZonas(reino, atlas), regioesNoAtlas, regiaoDoAtlas };
}
