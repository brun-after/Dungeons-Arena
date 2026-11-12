// Marco 39 (12/11/2026, D-146): a Força vira Vontade (e, D-147, as ressonâncias dão lugar aos estilos). A migração 28 › 29 troca a chave `forca` por `vontade` nos
// atributos de toda entidade gravada (e na base da ficha, quem tem bolsa). Ela não devolve pontos nem mexe na build:
// quem ainda não passou pelo sistema novo (sem `bolsa.sistema`) vê a tela de atualização ao entrar no jogo, e é lá
// que os pontos voltam. Puro.

import { ehObjeto, type Objeto } from '../core/validar';

/** Troca `forca` por `vontade` num objeto de atributos (o valor antigo vence se os dois existirem por engano). */
export function vontadeNoLugarDaForca(a: unknown): unknown {
  if (!ehObjeto(a) || !('forca' in a)) return a;
  const { forca, ...resto } = a;
  return { ...resto, vontade: typeof resto.vontade === 'number' ? resto.vontade : forca };
}

function migrarEntidades(v: unknown): unknown {
  if (!ehObjeto(v) || !Array.isArray(v.entidades)) return v;
  return { ...v, entidades: v.entidades.map((bruto: unknown) => {
    if (!ehObjeto(bruto)) return bruto;
    // D-147: as ressonâncias saem; a lista dos estilos despertos começa vazia (o tick a preenche).
    const x: Objeto = Object.fromEntries(Object.entries(bruto).filter(([k]) => k !== 'ressonancias'));
    x.estilos = Array.isArray(bruto.estilos) ? bruto.estilos : [];
    const bolsa = ehObjeto(x.bolsa) ? { ...x.bolsa, atributosBase: vontadeNoLugarDaForca(x.bolsa.atributosBase) } : x.bolsa;
    return { ...x, atributos: vontadeNoLugarDaForca(x.atributos), ...(bolsa !== undefined && { bolsa }) };
  }) };
}

/** D-155: tira o atributo de classe (`dominio`) de um objeto de atributos. */
export function semAtributoDeClasse(a: unknown): unknown {
  if (!ehObjeto(a) || !('dominio' in a)) return a;
  return Object.fromEntries(Object.entries(a).filter(([k]) => k !== 'dominio'));
}

function semDominioNasEntidades(v: unknown): unknown {
  if (!ehObjeto(v) || !Array.isArray(v.entidades)) return v;
  return { ...v, entidades: v.entidades.map((x: unknown) => {
    if (!ehObjeto(x)) return x;
    const bolsa = ehObjeto(x.bolsa) ? { ...x.bolsa, atributosBase: semAtributoDeClasse(x.bolsa.atributosBase) } : x.bolsa;
    return { ...x, atributos: semAtributoDeClasse(x.atributos), ...(bolsa !== undefined && { bolsa }) };
  }) };
}

/**
 * Marco 39 (12/11/2026, D-155): a migração 29 › 30 tira o atributo de classe. Os pontos que estavam nele voltam na tela de
 * atualização (o sistema do personagem passou a 40, então ela aparece de novo e devolve o orçamento inteiro).
 */
export function migrarSemAtributoDeClasse(r: Objeto): Objeto {
  const fasesVisitadas = ehObjeto(r.fasesVisitadas)
    ? Object.fromEntries(Object.entries(r.fasesVisitadas).map(([id, fase]) => [id, semDominioNasEntidades(fase)])) : r.fasesVisitadas;
  return { ...r, estado: semDominioNasEntidades(r.estado), fasesVisitadas };
}

export function migrarForcaParaVontade(r: Objeto): Objeto {
  const fasesVisitadas = ehObjeto(r.fasesVisitadas)
    ? Object.fromEntries(Object.entries(r.fasesVisitadas).map(([id, fase]) => [id, migrarEntidades(fase)])) : r.fasesVisitadas;
  return { ...r, estado: migrarEntidades(r.estado), fasesVisitadas };
}
