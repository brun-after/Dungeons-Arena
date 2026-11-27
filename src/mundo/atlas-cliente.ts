// Marco 55 (26/11/2026, D-208): o Mundo contínuo no cliente. A fase do atlas nasce vazia (o vazio é sólido e não se
// desenha) e cada região gerada (no trabalhador, plataforma/gerador-remoto.ts) é carimbada nela; a predição anda nesta
// fase. Para o desenho, cada região guarda a fase dela (em coordenadas da área) e o contexto com o tema: a cena põe a
// região perto da câmera no lugar dela do atlas (render/camada-regiao.ts). Puro.

import type { Conteudo } from '../core/conteudo';
import { BALANCE_PADRAO, type ContextoSimulacao } from '../core/contexto';
import type { ModoDeJogo } from '../modos/modo';
import { contextoDaFase } from '../save/fases-campanha';
import { esquecerCopas } from '../world/camuflagem';
import type { Fase } from '../world/fase';
import type { ExteriorGerado, PontoDoExterior } from '../world/gerador-exterior';
import { montarAtlas, type AreaNoAtlas, type Atlas } from './atlas';
import { carimbarNoAtlas, faseVaziaDoAtlas, type RegiaoCarimbada } from './atlas-carimbo';
import { comMateriais } from './lugares';
import type { Reino } from './reino';
import { mapaDeZonas, regrasDasZonas, type MapaDeZonas } from './zonas';

/** Uma região já no cliente: a fase dela (coordenadas da área), o contexto do desenho (tema, paleta) e onde fica. */
export interface RegiaoNoCliente {
  regiaoId: string;
  area: AreaNoAtlas;
  ctx: ContextoSimulacao;
  ex: ExteriorGerado;
}

export interface AtlasDoCliente {
  readonly atlas: Atlas;
  readonly zonas: MapaDeZonas;
  /** O contexto da predição: a fase do atlas (o mesmo objeto do começo ao fim) e o modo com as regras das zonas. */
  readonly ctx: ContextoSimulacao;
  readonly regioes: ReadonlyMap<string, RegiaoNoCliente>;
  /** Os pontos do exterior das regiões que já chegaram, em coordenadas do atlas (NPCs, portas, pedras). */
  pontos(): readonly PontoDoExterior[];
  /** Carimba a região gerada; null se a fase dela não vale (fica vazia no atlas). */
  receber(regiaoId: string, ex: ExteriorGerado): RegiaoNoCliente | null;
  /** A região cuja área tem a célula (x, y), ou null fora de todas. */
  regiaoEm(x: number, y: number): RegiaoNoCliente | null;
  /** A id da área que tem a célula, já chegada ou não. */
  areaEm(x: number, y: number): string | null;
  /** As regiões na ordem de pedir: a do ponto, as que encostam nela, e o resto pela distância. */
  ordemDePedido(x: number, y: number): string[];
}

export function criarAtlasDoCliente(conteudo: Conteudo, reino: Reino, modoBase: ModoDeJogo): AtlasDoCliente {
  const atlas = montarAtlas(reino);
  const zonas = mapaDeZonas(reino, atlas);
  const fase: Fase = faseVaziaDoAtlas(reino, atlas);
  const modo: ModoDeJogo = { ...comMateriais(modoBase, reino, reino.inicio), fogoAmigo: false, zonas: regrasDasZonas(reino, zonas, () => false, BALANCE_PADRAO.mundo.eventos.luaLootPct) };
  const ctx: ContextoSimulacao = { fase, balance: BALANCE_PADRAO, conteudo, modo };
  const regioes = new Map<string, RegiaoNoCliente>();
  const partes: RegiaoCarimbada[] = [];
  let pontos: readonly PontoDoExterior[] = [];
  const areas = [...atlas.areas.entries()];
  const areaEm = (x: number, y: number): string | null => {
    const cx = Math.floor(x);
    const cy = Math.floor(y);
    for (const [id, a] of areas) if (cx >= a.x && cy >= a.y && cx < a.x + a.largura && cy < a.y + a.altura) return id;
    return null;
  };
  const centro = (a: AreaNoAtlas) => ({ x: a.x + a.largura / 2, y: a.y + a.altura / 2 });
  return {
    atlas,
    zonas,
    ctx,
    regioes,
    pontos: () => pontos,
    receber(regiaoId, ex) {
      const area = atlas.areas.get(regiaoId);
      if (!area || regioes.has(regiaoId)) return regioes.get(regiaoId) ?? null;
      const r = contextoDaFase(conteudo, ex.fase, modoBase);
      if (!r.ok) return null;
      // A fase da região como a sala por região a montava (mundo/lugares.ts), em coordenadas da área: o desenho lê as
      // alturas, os obstáculos, o bioma, as estruturas e os telhados dela.
      const regiao = reino.regioes.find((x) => x.id === regiaoId);
      const local: Fase = {
        ...r.ctx.fase,
        exterior: true,
        alturas: ex.alturas,
        obstaculos: ex.obstaculos,
        cenario: ex.pecas,
        ninhos: ex.ninhos,
        telhados: ex.fase.telhados ?? [],
        estruturas: (regiao?.estruturas ?? []).map((e) => ({ x: e.x + area.dx, y: e.y + area.dy, tipo: e.tipo })),
        refugios: [...(ex.vila ? [{ x: ex.vila.x, y: ex.vila.y, raio: ex.vila.raio + 0.5 }] : []), ...(ex.abrigo ? [{ x: ex.abrigo.x, y: ex.abrigo.y, raio: ex.abrigo.raio + 0.5 }] : [])],
        ...(regiao?.bioma && { bioma: regiao.bioma }),
        escuroBase: regiao?.escuroBase ?? 0,
        ...(regiao?.matas && { matas: regiao.matas.map((m) => ({ ...m, x: m.x + area.dx, y: m.y + area.dy })) }),
      };
      const parte: RegiaoCarimbada = { regiaoId, area, fase: local, ex };
      partes.push(parte);
      pontos = carimbarNoAtlas(reino, fase, partes, [parte]).pontos;
      if (fase.obstaculos) esquecerCopas(fase.obstaculos);
      const nova: RegiaoNoCliente = { regiaoId, area, ctx: { ...r.ctx, fase: local }, ex };
      regioes.set(regiaoId, nova);
      return nova;
    },
    regiaoEm(x, y) {
      const id = areaEm(x, y);
      return id ? (regioes.get(id) ?? null) : null;
    },
    areaEm,
    ordemDePedido(x, y) {
      const aqui = areaEm(x, y);
      const encostam = (a: AreaNoAtlas, b: AreaNoAtlas) => a.x <= b.x + b.largura && b.x <= a.x + a.largura && a.y <= b.y + b.altura && b.y <= a.y + a.altura;
      const daqui = aqui ? atlas.areas.get(aqui) : undefined;
      return areas
        .map(([id, a]) => {
          const c = centro(a);
          const d = Math.hypot(c.x - x, c.y - y);
          return { id, peso: id === aqui ? -2 : daqui && encostam(a, daqui) ? -1 + d / 1e6 : d };
        })
        .sort((p, q) => p.peso - q.peso)
        .map((p) => p.id);
    },
  };
}
