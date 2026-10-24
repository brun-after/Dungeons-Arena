// Marco 24 (24/10/2026, D-094): conferências do conteúdo das skills de classe e das ultimates — cada skill de classe é
// exclusiva de uma classe, o livro de classe aponta para a dona, cada ultimate é de um par da própria classe, e toda
// referência de efeito (etapa, resposta, invocação) existe. Chamado por lerConteudo (conteudo.ts).

import type { DefinicaoHabilidade } from '../combat/habilidades';
import type { EfeitoCanonico } from '../combat/registro-efeitos';
import type { Ultimate } from '../combat/ultimates';
import type { ClasseJogador, PresetInimigo } from '../entities/presets';
import type { Item } from '../progression/itens';

/** Os efeitos que apontam para outra habilidade pelo `ref`. */
const REF_HABILIDADE = new Set(['fase', 'contragolpe', 'zerar_recarga']);
/** Os efeitos que apontam para um preset pelo `ref` (a invocação temporária exige um preset de invocação). */
const REF_PRESET = new Set(['invocar', 'invocar_temporario']);

function todosOsEfeitos(def: DefinicaoHabilidade): EfeitoCanonico[] {
  const lista: EfeitoCanonico[] = [...def.base.efeitos];
  for (const m of Object.values(def.marcos)) lista.push(...m.efeitos);
  for (const v of Object.values(def.variantes)) lista.push(...v.efeitos, ...v.trocar);
  return lista.flatMap((e) => (e.interno ? [e, e.interno] : [e]));
}

export function conferirClassesEUltimates(
  definicoes: ReadonlyMap<string, DefinicaoHabilidade>,
  classes: ReadonlyMap<string, ClasseJogador>,
  ultimates: ReadonlyMap<string, Ultimate>,
  presets: ReadonlyMap<string, PresetInimigo>,
  itens: ReadonlyMap<string, Item>,
): string[] {
  const erros: string[] = [];
  const dona = new Map<string, string>();
  for (const c of classes.values()) {
    for (const id of c.exclusivas) {
      if (!definicoes.has(id)) erros.push(`classe ${c.id}: skill exclusiva desconhecida "${id}"`);
      const outra = dona.get(id);
      if (outra) erros.push(`skill "${id}" exclusiva de ${outra} e de ${c.id}`);
      dona.set(id, c.id);
    }
    if (c.geralInicial !== null && (!definicoes.has(c.geralInicial) || !definicoes.get(c.geralInicial)?.familiaGeral)) {
      erros.push(`classe ${c.id}: a geral inicial "${c.geralInicial}" precisa ser uma skill geral`);
    }
  }
  for (const it of itens.values()) {
    if (it.classe === undefined || it.ensina === null) continue;
    if (dona.get(it.ensina) !== it.classe) erros.push(`item ${it.id}: livro de ${it.classe} ensina "${it.ensina}", que não é exclusiva dela`);
  }
  for (const u of ultimates.values()) {
    const c = classes.get(u.classe);
    if (!c) erros.push(`ultimate ${u.id}: classe desconhecida "${u.classe}"`);
    else for (const id of u.par) if (!c.exclusivas.includes(id)) erros.push(`ultimate ${u.id}: "${id}" não é exclusiva de ${c.id}`);
  }
  for (const def of definicoes.values()) {
    for (const id of def.fusao ?? []) if (!definicoes.has(id)) erros.push(`habilidade ${def.base.id}: fusão com a habilidade desconhecida "${id}"`);
    for (const e of todosOsEfeitos(def)) {
      if (e.ref === null) continue;
      if (REF_HABILIDADE.has(e.tipo) && !definicoes.has(e.ref)) erros.push(`habilidade ${def.base.id}: ${e.tipo} aponta para a habilidade desconhecida "${e.ref}"`);
      if (REF_PRESET.has(e.tipo) && !presets.has(e.ref)) erros.push(`habilidade ${def.base.id}: ${e.tipo} aponta para o preset desconhecido "${e.ref}"`);
      if (e.tipo === 'invocar_temporario' && !presets.get(e.ref)?.invocacao) erros.push(`habilidade ${def.base.id}: "${e.ref}" não é preset de invocação`);
    }
  }
  return erros;
}
