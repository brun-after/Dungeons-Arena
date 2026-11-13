// Marco 40 (12/11/2026, D-158): as 54 gerais antigas deixam o jogador e dão lugar às skills comuns de núcleo. Cada
// geral vai para a variante mais próxima (`nucleos.json`, campo `legado`). A skill nova entra no rank 1 com os caminhos
// zerados (os caminhos antigos não existem nela), e os pontos dos ranks acima do 1 voltam. A barra, as liberadas, o
// estudo e os livros na mochila seguem o mesmo mapa. As passivas gerais saem das ligadas. Puro e idempotente: uma
// bolsa sem gerais antigas sai igual. Vale para o save (migração 30 › 31) e para as fichas que chegam ao servidor
// (Mundo, grupo, arena e certificado, por `conferirPersonagem`).

import { ehObjeto, type Objeto } from '../core/validar';

const PREFIXO_LIVRO = 'livro_';

/** A bolsa crua sem as gerais antigas (ou ela mesma, quando não há nada a trocar). */
export function semSkillsDoLegado(b: Objeto, legado: ReadonlyMap<string, string>): Objeto {
  const novo = (id: unknown): unknown => (typeof id === 'string' ? (legado.get(id) ?? id) : id);
  const antiga = (id: unknown): boolean => typeof id === 'string' && legado.has(id);
  const livroNovo = (itemId: unknown): unknown => {
    if (typeof itemId !== 'string' || !itemId.startsWith(PREFIXO_LIVRO)) return itemId;
    const n = legado.get(itemId.slice(PREFIXO_LIVRO.length));
    return n ? `${PREFIXO_LIVRO}${n}` : itemId;
  };
  const conhecidasBrutas = Array.isArray(b.conhecidas) ? b.conhecidas : [];
  const temLegado = conhecidasBrutas.some((c) => ehObjeto(c) && antiga(c.id))
    || [b.barra, b.liberadas, b.passivasAtivas].some((l) => Array.isArray(l) && l.some(antiga))
    || (ehObjeto(b.estudo) && antiga(b.estudo.id))
    || (Array.isArray(b.mochila) && b.mochila.some((i) => ehObjeto(i) && (livroNovo(i.itemId) !== i.itemId || antiga(i.ref))));
  if (!temLegado) return b;

  let devolvidos = 0;
  const conhecidas: unknown[] = [];
  const vistas = new Set<string>();
  for (const c of conhecidasBrutas) {
    if (!ehObjeto(c) || typeof c.id !== 'string') continue;
    const rank = typeof c.rank === 'number' && Number.isFinite(c.rank) ? Math.max(1, Math.round(c.rank)) : 1;
    if (!antiga(c.id)) {
      if (!vistas.has(c.id)) { vistas.add(c.id); conhecidas.push(c); }
      continue;
    }
    devolvidos += rank - 1;
    const id = String(novo(c.id));
    if (vistas.has(id)) continue;
    vistas.add(id);
    conhecidas.push({ id, rank: 1, caminhos: [] });
  }
  const unicos = (l: unknown): unknown[] => [...new Set((Array.isArray(l) ? l : []).map(novo))];
  const barra = Array.isArray(b.barra) ? b.barra.map(novo).map((id, i, todos) => (id !== null && todos.indexOf(id) !== i ? null : id)) : b.barra;
  const estudo = ehObjeto(b.estudo) && antiga(b.estudo.id)
    ? (vistas.has(String(novo(b.estudo.id))) ? null : { ...b.estudo, id: novo(b.estudo.id) })
    : b.estudo;
  const mochila = Array.isArray(b.mochila)
    ? b.mochila.map((i: unknown) => (ehObjeto(i) ? { ...i, itemId: livroNovo(i.itemId), ...(antiga(i.ref) && { ref: novo(i.ref) }) } : i))
    : b.mochila;
  const pontos = typeof b.pontosHabilidade === 'number' && Number.isFinite(b.pontosHabilidade) ? b.pontosHabilidade : 0;
  return {
    ...b,
    conhecidas,
    barra,
    liberadas: unicos(b.liberadas),
    // As passivas gerais viraram skills ativas: nenhuma fica ligada.
    passivasAtivas: (Array.isArray(b.passivasAtivas) ? b.passivasAtivas : []).filter((id) => !antiga(id)),
    estudo,
    mochila,
    pontosHabilidade: pontos + devolvidos,
  };
}

function migrarEntidades(v: unknown, legado: ReadonlyMap<string, string>): unknown {
  if (!ehObjeto(v) || !Array.isArray(v.entidades)) return v;
  return { ...v, entidades: v.entidades.map((x: unknown) => {
    if (!ehObjeto(x) || !ehObjeto(x.bolsa)) return x;
    const bolsa = semSkillsDoLegado(x.bolsa, legado);
    if (bolsa === x.bolsa) return x;
    const habilidades = Array.isArray(bolsa.barra) ? bolsa.barra.filter((id): id is string => typeof id === 'string') : x.habilidades;
    return { ...x, bolsa, habilidades, tatica: undefined };
  }) };
}

/** A migração 30 › 31: as gerais antigas de todo jogador gravado (na fase atual e nas visitadas) viram skills comuns. */
export function migrarSkillsDeNucleo(r: Objeto, legado: ReadonlyMap<string, string>): Objeto {
  const fasesVisitadas = ehObjeto(r.fasesVisitadas)
    ? Object.fromEntries(Object.entries(r.fasesVisitadas).map(([id, fase]) => [id, migrarEntidades(fase, legado)])) : r.fasesVisitadas;
  return { ...r, estado: migrarEntidades(r.estado, legado), fasesVisitadas };
}
