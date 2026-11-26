// Marco 54 (26/11/2026, D-207): o atlas do Mundo contínuo. As regiões deixam de ser mapas soltos e viram retângulos
// encostados num espaço de coordenadas único. Puro.
//
// - Cada reino (território) é uma grade: a coluna tem a largura da maior região dela e a linha, a altura da maior.
//   A região passa a ocupar o retângulo inteiro da célula (mais larga ou mais alta que o `tamanho` de antes), e o
//   conteúdo escrito em coordenadas locais (vila, estruturas, matas) fica centrado nele pelo `dx`/`dy`.
// - Os reinos ficam lado a lado, na ordem das colunas do atlas (o Central, a Travessia, o Eclipse), todos no topo.
// - Entre duas vizinhas que aceitam a passagem (`vizinha`, `reino.ts`), a borda comum é uma costura aberta: o chão
//   segue de uma para a outra. Os outros lados ficam fechados (montanha, como hoje).

import { LADOS, ladoOposto, vizinha, type LadoDaRegiao, type Reino, type RegiaoDoMundo } from './reino';

/** O retângulo da região no atlas e o deslocamento do conteúdo local dentro dele. */
export interface AreaNoAtlas {
  x: number;
  y: number;
  largura: number;
  altura: number;
  /** O conteúdo da região (escrito para o quadrado `tamanho`) começa em (dx, dy) dentro da área. */
  dx: number;
  dy: number;
}

/** Uma costura aberta: o trecho da borda comum entre duas vizinhas, em coordenadas do atlas. */
export interface Costura {
  /** A chave do par (as duas ids em ordem), a mesma vista dos dois lados. */
  par: string;
  a: string;
  b: string;
  /** O lado de `a` onde fica a costura (`b` está do lado oposto). */
  lado: LadoDaRegiao;
  /** Vertical (leste/oeste: a linha x fixa) ou horizontal (norte/sul: a linha y fixa). */
  vertical: boolean;
  /** A linha da borda: a primeira coluna (ou linha) de quem está a leste (ou ao sul). */
  linha: number;
  /** O trecho comum ao longo da borda, [inicio, fim). */
  inicio: number;
  fim: number;
}

export interface Atlas {
  largura: number;
  altura: number;
  areas: ReadonlyMap<string, AreaNoAtlas>;
  costuras: readonly Costura[];
}

/** A menor borda comum de uma costura aberta (o validador do atlas cobra). */
export const COSTURA_MINIMA = 64;

function territorioDe(reino: Reino, r: RegiaoDoMundo): Reino {
  return reino.territorios?.find((t) => t.regioes.some((x) => x.id === r.id)) ?? reino;
}

/** Monta o atlas do reino (o do conteúdo junta os três reinos, `reinoDoConteudo`). */
export function montarAtlas(reino: Reino): Atlas {
  const grupos = new Map<Reino, RegiaoDoMundo[]>();
  for (const r of reino.regioes) {
    const t = territorioDe(reino, r);
    const lista = grupos.get(t) ?? [];
    lista.push(r);
    grupos.set(t, lista);
  }
  const ordem = [...grupos.entries()].sort((p, q) => Math.min(...p[1].map((r) => r.gx)) - Math.min(...q[1].map((r) => r.gx)));
  const areas = new Map<string, AreaNoAtlas>();
  let x0 = 0;
  let alturaTotal = 0;
  for (const [territorio, regioes] of ordem) {
    const gx0 = Math.min(...regioes.map((r) => r.gx));
    const colunas: number[] = [];
    const linhas: number[] = [];
    for (const r of regioes) {
      const t = r.tamanho ?? territorio.tamanhoRegiao;
      colunas[r.gx - gx0] = Math.max(colunas[r.gx - gx0] ?? 0, t);
      linhas[r.gy] = Math.max(linhas[r.gy] ?? 0, t);
    }
    const inicioDa = (lista: readonly (number | undefined)[], i: number) => lista.slice(0, i).reduce<number>((s, v) => s + (v ?? 0), 0);
    for (const r of regioes) {
      const t = r.tamanho ?? territorio.tamanhoRegiao;
      const largura = colunas[r.gx - gx0] ?? t;
      const altura = linhas[r.gy] ?? t;
      areas.set(r.id, {
        x: x0 + inicioDa(colunas, r.gx - gx0),
        y: inicioDa(linhas, r.gy),
        largura,
        altura,
        dx: Math.floor((largura - t) / 2),
        dy: Math.floor((altura - t) / 2),
      });
    }
    x0 += inicioDa(colunas, colunas.length);
    alturaTotal = Math.max(alturaTotal, inicioDa(linhas, linhas.length));
  }
  return { largura: x0, altura: alturaTotal, areas, costuras: costurasDoAtlas(reino, areas) };
}

function costurasDoAtlas(reino: Reino, areas: ReadonlyMap<string, AreaNoAtlas>): Costura[] {
  const costuras: Costura[] = [];
  for (const r of reino.regioes) {
    for (const lado of ['leste', 'sul'] as const) {
      const v = vizinha(reino, r, lado);
      const a = areas.get(r.id);
      const b = v && areas.get(v.id);
      if (!v || !a || !b) continue;
      const vertical = lado === 'leste';
      const inicio = vertical ? Math.max(a.y, b.y) : Math.max(a.x, b.x);
      const fim = vertical ? Math.min(a.y + a.altura, b.y + b.altura) : Math.min(a.x + a.largura, b.x + b.largura);
      costuras.push({ par: [r.id, v.id].sort().join('|'), a: r.id, b: v.id, lado, vertical, linha: vertical ? b.x : b.y, inicio, fim });
    }
  }
  return costuras;
}

/** Os lados da região que são costura aberta (o resto da borda fica fechado). */
export function ladosAbertos(reino: Reino, r: RegiaoDoMundo): LadoDaRegiao[] {
  return LADOS.filter((lado) => vizinha(reino, r, lado) !== undefined);
}

/** A costura do lado da região (vista dela), se aberta. */
export function costuraDoLado(atlas: Atlas, regiaoId: string, lado: LadoDaRegiao): Costura | undefined {
  return atlas.costuras.find((c) => (c.a === regiaoId && c.lado === lado) || (c.b === regiaoId && ladoOposto(c.lado) === lado));
}

/** Os problemas do atlas: áreas que se sobrepõem e costuras abertas sem borda comum suficiente. */
export function conferirAtlas(atlas: Atlas): string[] {
  const erros: string[] = [];
  const lista = [...atlas.areas.entries()];
  for (let i = 0; i < lista.length; i++) {
    for (let j = i + 1; j < lista.length; j++) {
      const [ia, a] = lista[i] as [string, AreaNoAtlas];
      const [ib, b] = lista[j] as [string, AreaNoAtlas];
      if (a.x < b.x + b.largura && b.x < a.x + a.largura && a.y < b.y + b.altura && b.y < a.y + a.altura) erros.push(`${ia} e ${ib} se sobrepõem`);
    }
  }
  for (const c of atlas.costuras) if (c.fim - c.inicio < COSTURA_MINIMA) erros.push(`costura ${c.par}: borda comum de ${String(c.fim - c.inicio)}`);
  return erros;
}

/** Local da região (coordenadas do conteúdo, quadrado `tamanho`) para o atlas. */
export function paraOAtlas(area: AreaNoAtlas, x: number, y: number): { x: number; y: number } {
  return { x: area.x + area.dx + x, y: area.y + area.dy + y };
}

/** Do atlas para o local da região (o inverso de `paraOAtlas`). */
export function doAtlas(area: AreaNoAtlas, x: number, y: number): { x: number; y: number } {
  return { x: x - area.x - area.dx, y: y - area.y - area.dy };
}
