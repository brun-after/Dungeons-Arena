// Conteúdo oficial (§3.9): todos os catálogos lidos, validados e com referências cruzadas
// conferidas. Conteúdo oficial inválido quebra o teste no CI; no jogo, a carga lança erro claro.
// Marco 14 (14/10/2026): elementos, interações entre efeitos, caminhos de evolução e as definições de
// habilidade (D-059). `habilidades` continua sendo o catálogo compilado no rank 1 (arena, render e áudio).

import classesJson from '../data/classes.json';
import caminhosJson from '../data/caminhos.json';
import elementosJson from '../data/elementos.json';
import interacoesJson from '../data/interacoes.json';
import inimigosJson from '../data/inimigos.json';
import itensJson from '../data/itens.json';
import itensBaseJson from '../data/itens-base.json';
import campanhaJson from '../data/modos/campanha.json';
import cooperativoJson from '../data/modos/cooperativo.json';
import livreJson from '../data/modos/livre.json';
import skillsJson from '../data/skills.json';
import { lerInteracoes, type Interacoes } from '../combat/acumulo';
import { lerElementos, type DefinicaoElemento, type Elemento } from '../combat/elementos';
import { compilarHabilidade, lerCaminhos, type Caminho, type FontesCompilacao } from '../combat/compilar-habilidade';
import { orcamentoNoNivel, poderDaHabilidade } from '../combat/orcamento';
import { lerHabilidades, type Catalogo, type DefinicaoHabilidade, type Habilidade } from '../combat/habilidades';
import { lerClasses, lerPresets, type ClasseJogador, type PresetInimigo } from '../entities/presets';
import { lerModo, RARIDADES, type ModoDeJogo } from '../modos/modo';
import { CatalogoDeItens, lerBasesDeItem, type BasesDeItem } from '../progression/gerar-item';
import { lerItens, type Item } from '../progression/itens';
import { BALANCE_PADRAO } from './contexto';

export interface Conteudo {
  /** O catálogo compilado no rank 1, sem caminhos (o que a arena e a apresentação leem). */
  habilidades: Catalogo<Habilidade>;
  /** Marco 14: as definições (camadas, ranks e evoluções) e os moldes de caminho. */
  definicoes: Catalogo<DefinicaoHabilidade>;
  caminhos: Catalogo<Caminho>;
  presets: Catalogo<PresetInimigo>;
  classes: Catalogo<ClasseJogador>;
  modos: Catalogo<ModoDeJogo>;
  modoCampanha: ModoDeJogo;
  itens: Catalogo<Item>;
  /** Marco 17: as bases do equipamento gerado por semente (o catálogo de itens resolve os ids `gi_`). */
  itensBase: BasesDeItem;
  /** Marco 14: os 5 elementos e as regras de acúmulo, oposição, transformação e sinergia. */
  elementos: ReadonlyMap<Elemento, DefinicaoElemento>;
  interacoes: Interacoes;
}

export interface FontesDeConteudo {
  skills: unknown;
  inimigos: unknown;
  classes: unknown;
  itens: unknown;
  /** Marco 17: data/itens-base.json. */
  itensBase: unknown;
  elementos: unknown;
  interacoes: unknown;
  caminhos: unknown;
  /** Arquivo -> JSON de cada modo em src/data/modos. */
  modos: Readonly<Record<string, unknown>>;
}

export function lerConteudo(fontes: FontesDeConteudo): { conteudo: Conteudo; erros: string[] } {
  const h = lerHabilidades(fontes.skills);
  const p = lerPresets(fontes.inimigos);
  const c = lerClasses(fontes.classes);
  const it = lerItens(fontes.itens);
  const ib = lerBasesDeItem(fontes.itensBase);
  const el = lerElementos(fontes.elementos);
  const ia = lerInteracoes(fontes.interacoes);
  const cm = lerCaminhos(fontes.caminhos);
  const erros = [...h.erros, ...p.erros, ...c.erros, ...it.erros, ...ib.erros, ...el.erros, ...ia.erros, ...cm.erros];
  const fontesCompilacao = { caminhos: cm.caminhos, elementos: el.elementos };
  const habilidades = new Map<string, Habilidade>();
  for (const [id, def] of h.definicoes) {
    habilidades.set(id, compilarHabilidade(def, { rank: 1, caminhos: [], mods: [] }, fontesCompilacao, BALANCE_PADRAO.habilidades));
    for (const [rank, caminhos] of Object.entries(def.evolucoes)) {
      for (const c of caminhos) if (!cm.caminhos.has(c)) erros.push(`habilidade ${id}: caminho desconhecido "${c}" no rank ${rank}`);
    }
  }

  const modos = new Map<string, ModoDeJogo>();
  for (const [arquivo, json] of Object.entries(fontes.modos)) {
    const m = lerModo(json, `modos/${arquivo}`);
    erros.push(...m.erros);
    if (modos.has(m.modo.id)) erros.push(`modos/${arquivo}: id repetido "${m.modo.id}"`);
    modos.set(m.modo.id, m.modo);
  }
  const modoCampanha = modos.get('campanha');
  if (!modoCampanha) erros.push('modo "campanha" ausente');

  const conferir = (dono: string, ids: readonly string[]) => {
    for (const id of ids) if (!h.definicoes.has(id)) erros.push(`${dono}: habilidade desconhecida "${id}"`);
  };
  for (const preset of p.presets.values()) conferir(`preset ${preset.id}`, [preset.ataqueBasico, ...preset.habilidades]);
  for (const classe of c.classes.values()) {
    conferir(`classe ${classe.id}`, [classe.ataqueBasico, ...classe.habilidades, ...classe.aprendiveis]);
    if (classe.habilidades.length > 4) erros.push(`classe ${classe.id}: no máximo 4 habilidades iniciais (as teclas 1–4)`);
    for (const { id } of classe.itensIniciais) if (!it.itens.has(id)) erros.push(`classe ${classe.id}: item inicial desconhecido "${id}"`);
  }
  for (const item of it.itens.values()) if (item.ensina !== null) conferir(`item ${item.id}`, [item.ensina]);
  if (!RARIDADES.includes(BALANCE_PADRAO.drops.raridadeMinBoss)) erros.push('balance.json: drops.raridadeMinBoss desconhecida');
  // Marco 14: o que o jogador alcança (classes e livros) cabe no orçamento de poder, em todo rank e caminho.
  const jogaveis = new Set<string>();
  for (const classe of c.classes.values()) for (const id of [...classe.habilidades, ...classe.aprendiveis]) jogaveis.add(id);
  for (const item of it.itens.values()) if (item.ensina) jogaveis.add(item.ensina);
  for (const id of jogaveis) {
    const def = h.definicoes.get(id);
    if (def && !def.basico) erros.push(...foraDoOrcamento(def, fontesCompilacao));
  }
  for (const modo of modos.values()) {
    const clamp = modo.clamp;
    if (clamp && clamp.habilidadesPermitidas !== 'qualquer') conferir(`modo ${modo.id}`, clamp.habilidadesPermitidas);
    if (clamp?.presetClasse && !c.classes.has(clamp.presetClasse)) {
      erros.push(`modo ${modo.id}: presetClasse desconhecida "${clamp.presetClasse}"`);
    }
  }

  return {
    conteudo: {
      habilidades,
      definicoes: h.definicoes,
      caminhos: cm.caminhos,
      presets: p.presets,
      classes: c.classes,
      modos,
      modoCampanha: modoCampanha ?? lerModo(campanhaJson, 'campanha').modo,
      itens: new CatalogoDeItens(it.itens, ib.bases, BALANCE_PADRAO.itensGerados),
      itensBase: ib.bases,
      elementos: el.elementos,
      interacoes: ia.interacoes,
    },
    erros,
  };
}

/** Todas as combinações de rank e caminhos que passam do orçamento do nível mínimo do rank. */
export function foraDoOrcamento(def: DefinicaoHabilidade, fontes: FontesCompilacao): string[] {
  const regras = BALANCE_PADRAO.habilidades;
  const erros: string[] = [];
  let combinacoes: string[][] = [[]];
  for (let rank = 1; rank <= regras.rankMax; rank++) {
    const opcoes = regras.ranksEvolucao.includes(rank) ? (def.evolucoes[rank] ?? []) : [];
    if (opcoes.length > 0) combinacoes = combinacoes.flatMap((c) => opcoes.map((o) => [...c, o]));
    const nivel = Math.max(regras.ranks[rank - 1]?.nivelMinimo ?? 1, def.base.nivelMinimo);
    const limite = orcamentoNoNivel(nivel, BALANCE_PADRAO.orcamento);
    for (const caminhos of combinacoes) {
      const poder = poderDaHabilidade(compilarHabilidade(def, { rank, caminhos, mods: [] }, fontes, regras), BALANCE_PADRAO.orcamento);
      if (poder > limite + 1e-9) {
        erros.push(`habilidade ${def.base.id}: rank ${rank} ${caminhos.join('+') || '(base)'} passa do orçamento (${poder.toFixed(2)} > ${limite.toFixed(2)})`);
      }
    }
  }
  return erros;
}

export const FONTES_OFICIAIS: FontesDeConteudo = {
  skills: skillsJson,
  inimigos: inimigosJson,
  classes: classesJson,
  itens: itensJson,
  itensBase: itensBaseJson,
  elementos: elementosJson,
  interacoes: interacoesJson,
  caminhos: caminhosJson,
  modos: { 'campanha.json': campanhaJson, 'cooperativo.json': cooperativoJson, 'livre.json': livreJson },
};

export function conteudoOficial(): Conteudo {
  const { conteudo, erros } = lerConteudo(FONTES_OFICIAIS);
  if (erros.length > 0) throw new Error(`conteúdo oficial inválido:\n${erros.join('\n')}`);
  return conteudo;
}

export function modoPorId(conteudo: Conteudo, id: string): ModoDeJogo {
  const modo = conteudo.modos.get(id);
  if (!modo) throw new Error(`modo desconhecido: ${id}`);
  return modo;
}
