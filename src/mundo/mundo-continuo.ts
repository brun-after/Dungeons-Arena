// Marco 54 (26/11/2026, D-207): o lugar do Mundo contínuo. As 24 regiões, cada uma gerada no lugar dela do atlas
// (mundo/atlas-fase.ts) e validada como fase própria, são carimbadas numa fase só, do tamanho do atlas. O que fica
// entre as áreas (o canto abaixo da Travessia) é vazio. Os ids dos inimigos (`i000`…) saem da ordem da lista única, e
// os dos objetos de cada região levam a id dela, então nada colide. Puro.

import type { Conteudo } from '../core/conteudo';
import { BALANCE_PADRAO, type ContextoSimulacao } from '../core/contexto';
import type { ModoDeJogo } from '../modos/modo';
import { contextoDaFase, estadoInicialDaFase } from '../save/fases-campanha';
import type { ExteriorGerado } from '../world/gerador-exterior';
import { areasEfetivasEm } from '../world/terrenos-vivos';
import { montarAtlas, paraOAtlas, type AreaNoAtlas, type Atlas } from './atlas';
import { carimbarCelulas, carimbarNoAtlas, emOrdemCanonica, faseVaziaDoAtlas, moverNoAtlas, moverPonto, type RegiaoCarimbada } from './atlas-carimbo';
import { gerarRegiaoNoAtlas } from './atlas-fase';
import { comMateriais, type LugarMontado } from './lugares';
import { objetosDoExterior } from './objetos-mundo';
import { territorioDoLugar, type MaterialDeInimigo, type Reino, type RegiaoDoMundo } from './reino';
import { mapaDeZonas, type MapaDeZonas } from './zonas';

import { ID_DO_MUNDO } from './atlas-carimbo';
export { ID_DO_MUNDO };

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
  // Marco 55 (D-208): o carimbo é o mesmo do cliente (mundo/atlas-carimbo.ts).
  const fase = faseVaziaDoAtlas(reino, atlas);
  const partes: RegiaoCarimbada[] = [];
  for (const regiao of reino.regioes) {
    const area = atlas.areas.get(regiao.id);
    if (!area) continue;
    const ex = gerarRegiaoNoAtlas(reino, atlas, regiao);
    const r = contextoDaFase(conteudo, ex.fase, modoBase);
    if (!r.ok) throw new Error(`região ${regiao.id} inválida no atlas: ${r.erro}`);
    const parte = { fase: r.ctx.fase, area, ex, regiaoId: regiao.id };
    carimbarCelulas(fase, parte);
    partes.push(parte);
    yield regiao.id;
  }
  const { pontos, rotas } = carimbarNoAtlas(reino, fase, partes, []);
  const ctx: ContextoSimulacao = { fase, balance: BALANCE_PADRAO, conteudo, modo: comTodosOsMateriais(modoBase, reino) };
  const estado = estadoInicialDaFase(ctx);
  // Os objetos de cada região (lojas pelo reino dela), com a id da região na frente; os errantes, na ordem das rotas.
  let errante = 0;
  for (const { ex, area, regiaoId } of emOrdemCanonica(reino, partes)) {
    const deslocado: ExteriorGerado = { ...ex, pontos: ex.pontos.map((p) => moverPonto(p, area)), rotas: ex.rotas.map((rota) => rota.map((c) => moverNoAtlas(c, area))) };
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
    alturas: fase.alturas ?? new Uint8Array(0),
    obstaculos: fase.obstaculos ?? new Uint8Array(0),
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
  // O que o tique só calcularia na primeira vez (o índice das áreas fixas) sai daqui, numa etapa própria, para não
  // travar o primeiro tique da sala. As copas são por bloco (world/camuflagem.ts, D-208).
  yield 'areas';
  areasEfetivasEm(estado, ctx.fase.ambientes ?? [], 0, 0);
  return { ctx, estado, exterior, atlas, zonas: mapaDeZonas(reino, atlas), regioesNoAtlas, regiaoDoAtlas };
}
