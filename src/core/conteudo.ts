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
import itensFormasJson from '../data/itens-formas.json';
import conjuntosJson from '../data/conjuntos.json';
import ressonanciasJson from '../data/ressonancias.json';
import combosJson from '../data/combos.json';
import interacoesBuffJson from '../data/interacoes-buff.json';
import missoesJson from '../data/missoes.json';
import origensJson from '../data/origens.json';
import forjaJson from '../data/forja.json';
import campanhaJson from '../data/modos/campanha.json';
import cooperativoJson from '../data/modos/cooperativo.json';
import livreJson from '../data/modos/livre.json';
import mundoJson from '../data/modos/mundo.json';
import skillsJson from '../data/skills.json';
import ultimatesJson from '../data/ultimates.json';
import sintoniaJson from '../data/sintonia.json';
import sinergiasJson from '../data/sinergias.json';
import temasJson from '../data/temas.json';
import afinidadesJson from '../data/afinidades.json';
import armasJson from '../data/armas.json';
import reinoCentralJson from '../data/mundo/reino-central.json';
import { conferirReino, lerReino, type Reino } from '../mundo/reino';
import { lerArmas, type RegrasDeArmas } from '../progression/armas';
import { lerUltimates, type Ultimate } from '../combat/ultimates';
import { lerSintonia, type RegrasSintonia } from '../progression/sintonia';
import { lerSinergias, type SinergiaPassiva } from '../progression/sinergias-passivas';
import { conferirClassesEUltimates } from './conteudo-classes';
import { lerAfinidades, type CatalogoAfinidades } from '../combat/afinidade';
import { lerTemas, type Tema } from '../world/temas';
import { lerInteracoes, type Interacoes } from '../combat/acumulo';
import { lerElementos, type DefinicaoElemento, type Elemento } from '../combat/elementos';
import { compilarHabilidade, lerCaminhos, type Caminho, type FontesCompilacao } from '../combat/compilar-habilidade';
import { orcamentoNoNivel, poderDaHabilidade } from '../combat/orcamento';
import { lerHabilidades, type Catalogo, type DefinicaoHabilidade, type Habilidade } from '../combat/habilidades';
import { lerClasses, lerPresets, type ClasseJogador, type PresetInimigo } from '../entities/presets';
import { lerModo, RARIDADES, type ModoDeJogo } from '../modos/modo';
import { CatalogoDeItens, lerBasesDeItem, type BasesDeItem } from '../progression/gerar-item';
import { lerItensComFormas, type ItensComFormas } from '../progression/gerar-item-base';
import { lerConjuntos, type Conjunto } from '../progression/conjuntos';
import { lerRessonancias, type Ressonancia } from '../progression/ressonancias';
import { lerCombos, lerRegrasDeBuff, type Combo, type RegraDeBuff } from '../combat/combos';
import { lerMissoes, lerOrigens, type Missao, type OrigemRara } from '../progression/missoes';
import { lerForja, type ReceitaDeForja } from '../progression/forja';
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
  /** Marco 18 (D-069): os itens base com formas (o catálogo resolve os ids `ib_`) e os conjuntos. */
  itensComFormas: ItensComFormas;
  conjuntos: Catalogo<Conjunto>;
  /** Marco 18 (D-068): as ressonâncias de atributo. */
  ressonancias: Catalogo<Ressonancia>;
  /** Marco 18 (D-068): os combos de sequência. */
  combos: Catalogo<Combo>;
  /** Marco 18 (camada 6): as regras de buff × habilidade. */
  regrasDeBuff: Catalogo<RegraDeBuff>;
  /** Marco 18 (D-070): missões, origens raras e as receitas da forja. */
  missoes: Catalogo<Missao>;
  origens: Catalogo<OrigemRara>;
  forja: Catalogo<ReceitaDeForja>;
  /** Marco 23 (D-092): os 20 temas de fase e as afinidades elementais dos inimigos. */
  temas: Catalogo<Tema>;
  afinidades: CatalogoAfinidades;
  /** Marco 23 (D-093): as famílias de arma e o básico de cada uma. */
  armas: RegrasDeArmas;
  /** Marco 24 (D-094): as 140 ultimates (as definições delas e das etapas ficam em `definicoes`). */
  ultimates: Catalogo<Ultimate>;
  /** Marco 24 (D-095): data/sintonia.json (Domínios, sintonias por classe, vertentes e encarnações duplas). */
  sintonia: RegrasSintonia;
  /** Marco 24 (D-096): data/sinergias.json (as sinergias passivas). */
  sinergias: readonly SinergiaPassiva[];
  /** Marco 29 (D-128): os reinos do modo Mundo (src/data/mundo). */
  reinos: Catalogo<Reino>;
}

export interface FontesDeConteudo {
  skills: unknown;
  /** Marco 24: data/ultimates.json. */
  ultimates: unknown;
  sintonia: unknown;
  sinergias: unknown;
  inimigos: unknown;
  classes: unknown;
  itens: unknown;
  /** Marco 17: data/itens-base.json. */
  itensBase: unknown;
  elementos: unknown;
  interacoes: unknown;
  caminhos: unknown;
  /** Marco 18: data/itens-formas.json e data/conjuntos.json. */
  itensFormas: unknown;
  conjuntos: unknown;
  ressonancias: unknown;
  combos: unknown;
  interacoesBuff: unknown;
  missoes: unknown;
  origens: unknown;
  forja: unknown;
  temas: unknown;
  afinidades: unknown;
  armas: unknown;
  /** Arquivo -> JSON de cada modo em src/data/modos. */
  modos: Readonly<Record<string, unknown>>;
  /** Marco 29: arquivo -> JSON de cada reino em src/data/mundo (opcional nos testes). */
  reinos?: Readonly<Record<string, unknown>>;
}

export function lerConteudo(fontes: FontesDeConteudo): { conteudo: Conteudo; erros: string[] } {
  const h = lerHabilidades(fontes.skills);
  const ul = lerUltimates(fontes.ultimates);
  const si = lerSintonia(fontes.sintonia);
  const sg = lerSinergias(fontes.sinergias);
  for (const [id, def] of ul.definicoes) {
    if (h.definicoes.has(id)) ul.erros.push(`ultimates.json: "${id}" já existe em skills.json`);
    h.definicoes.set(id, def);
  }
  const p = lerPresets(fontes.inimigos);
  const c = lerClasses(fontes.classes);
  const it = lerItens(fontes.itens);
  const ib = lerBasesDeItem(fontes.itensBase);
  const el = lerElementos(fontes.elementos);
  const ia = lerInteracoes(fontes.interacoes);
  const cm = lerCaminhos(fontes.caminhos);
  const fo = lerItensComFormas(fontes.itensFormas);
  const cj = lerConjuntos(fontes.conjuntos);
  const rs = lerRessonancias(fontes.ressonancias);
  const cb = lerCombos(fontes.combos);
  const rb = lerRegrasDeBuff(fontes.interacoesBuff);
  const mi = lerMissoes(fontes.missoes);
  const og = lerOrigens(fontes.origens);
  const fj = lerForja(fontes.forja);
  const tm = lerTemas(fontes.temas, new Set([...p.presets.values()].filter((x) => x.invocacao === null).map((x) => x.id)));
  const af = lerAfinidades(fontes.afinidades);
  const ar = lerArmas(fontes.armas);
  const erros = [...ul.erros, ...tm.erros, ...af.erros, ...ar.erros, ...h.erros, ...p.erros, ...c.erros, ...it.erros, ...ib.erros, ...el.erros, ...ia.erros, ...cm.erros, ...fo.erros, ...cj.erros, ...rs.erros, ...cb.erros, ...rb.erros, ...mi.erros, ...og.erros, ...fj.erros];
  for (const conj of cj.conjuntos.values()) {
    for (const peca of conj.pecas) if (!fo.dados.bases.has(peca)) erros.push(`conjunto ${conj.id}: base desconhecida "${peca}"`);
  }
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
  // Marco 29 (30/10/2026, D-128): os reinos do Mundo, conferidos contra presets, itens e temas.
  const reinos = new Map<string, Reino>();
  for (const [arquivo, json] of Object.entries(fontes.reinos ?? {})) {
    const r = lerReino(json);
    erros.push(...r.erros.map((e) => `mundo/${arquivo}: ${e}`));
    if (!r.reino) continue;
    const existe = { preset: (id: string) => p.presets.has(id), item: (id: string) => it.itens.has(id), tema: (id: string) => tm.temas.has(id) };
    erros.push(...conferirReino(r.reino, existe).map((e) => `mundo/${arquivo}: ${e}`));
    reinos.set(r.reino.id, r.reino);
  }
  const modoCampanha = modos.get('campanha');
  if (!modoCampanha) erros.push('modo "campanha" ausente');

  const conferir = (dono: string, ids: readonly string[]) => {
    for (const id of ids) if (!h.definicoes.has(id)) erros.push(`${dono}: habilidade desconhecida "${id}"`);
  };
  for (const preset of p.presets.values()) conferir(`preset ${preset.id}`, [preset.ataqueBasico, ...preset.habilidades]);
  for (const classe of c.classes.values()) {
    conferir(`classe ${classe.id}`, [classe.ataqueBasico, ...classe.habilidades, ...classe.exclusivas]);
    if (classe.iniciais.length !== 2) erros.push(`classe ${classe.id}: são 2 skills de classe iniciais (as teclas 1 e 2)`);
    for (const { id } of classe.itensIniciais) if (!it.itens.has(id)) erros.push(`classe ${classe.id}: item inicial desconhecido "${id}"`);
    // Marco 27 (D-126): a arma de partida é uma arma de mão principal com desenho em armas.json.
    const arma = classe.armaInicial ? it.itens.get(classe.armaInicial) : undefined;
    if (classe.armaInicial && (arma?.slotPadrao !== 'arma_principal' || !arma.arma)) erros.push(`classe ${classe.id}: arma inicial inválida "${classe.armaInicial}"`);
  }
  for (const item of it.itens.values()) if (item.ensina !== null) conferir(`item ${item.id}`, [item.ensina]);
  for (const combo of cb.combos.values()) conferir(`combo ${combo.id}`, combo.sequencia.filter((s) => s !== '@ultimate'));
  erros.push(...conferirClassesEUltimates(h.definicoes, c.classes, ul.ultimates, p.presets, it.itens));
  erros.push(...si.erros, ...sg.erros);
  for (const s of sg.sinergias) {
    if (!h.definicoes.get(s.passiva)?.base.passiva) erros.push(`sinergias.json: ${s.id} pede a passiva "${s.passiva}"`);
    for (const id of s.sequencia) if (!h.definicoes.has(id)) erros.push(`sinergias.json: ${s.id} com skill desconhecida "${id}"`);
  }
  for (const v of si.sintonia.vertentes) if (!c.classes.has(v.classe)) erros.push(`sintonia.json: vertente ${v.id} de classe desconhecida "${v.classe}"`);
  for (const [e, a] of af.afinidades.elementos) conferir(`afinidade ${e}`, [a.habilidade]);
  conferir('armas.json', Object.values(ar.armas.basicoDaFamilia));
  for (const id of c.classes.keys()) if (!ar.armas.naturalDaClasse.has(id)) erros.push(`armas.json: classe sem família natural "${id}"`);
  for (const r of fj.receitas.values()) {
    for (const x of r.entrada) if (!it.itens.has(x.item)) erros.push(`forja ${r.id}: item desconhecido "${x.item}"`);
    if (r.saida.tipo === 'item' && !it.itens.has(r.saida.item)) erros.push(`forja ${r.id}: item desconhecido "${r.saida.item}"`);
  }
  for (const m of mi.missoes.values()) {
    const rec = m.recompensa;
    if ('id' in rec ? !it.itens.has(rec.id) : !fo.dados.bases.has(rec.base)) erros.push(`missão ${m.id}: recompensa desconhecida`);
  }
  for (const o of og.origens.values()) {
    const item = o.item;
    if ('id' in item ? !it.itens.has(item.id) : !fo.dados.bases.has(item.base)) erros.push(`origem ${o.id}: item desconhecido`);
  }
  if (!RARIDADES.includes(BALANCE_PADRAO.drops.raridadeMinBoss)) erros.push('balance.json: drops.raridadeMinBoss desconhecida');
  // Marco 14: o que o jogador alcança (classes e livros) cabe no orçamento de poder, em todo rank e caminho.
  const jogaveis = new Set<string>();
  for (const classe of c.classes.values()) for (const id of [...classe.habilidades, ...classe.exclusivas]) jogaveis.add(id);
  for (const item of it.itens.values()) if (item.ensina) jogaveis.add(item.ensina);
  for (const id of jogaveis) {
    const def = h.definicoes.get(id);
    if (def && !def.basico && !def.interna) erros.push(...foraDoOrcamento(def, fontesCompilacao));
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
      itens: new CatalogoDeItens(it.itens, ib.bases, BALANCE_PADRAO.itensGerados, fo.dados, el.elementos),
      itensBase: ib.bases,
      elementos: el.elementos,
      interacoes: ia.interacoes,
      itensComFormas: fo.dados,
      conjuntos: cj.conjuntos,
      ressonancias: rs.ressonancias,
      combos: cb.combos,
      regrasDeBuff: rb.regras,
      missoes: mi.missoes,
      origens: og.origens,
      forja: fj.receitas,
      temas: tm.temas,
      afinidades: af.afinidades,
      armas: ar.armas,
      ultimates: ul.ultimates,
      sintonia: si.sintonia,
      sinergias: sg.sinergias,
      reinos,
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
  ultimates: ultimatesJson,
  sintonia: sintoniaJson,
  sinergias: sinergiasJson,
  inimigos: inimigosJson,
  classes: classesJson,
  itens: itensJson,
  itensBase: itensBaseJson,
  elementos: elementosJson,
  interacoes: interacoesJson,
  caminhos: caminhosJson,
  itensFormas: itensFormasJson,
  conjuntos: conjuntosJson,
  ressonancias: ressonanciasJson,
  combos: combosJson,
  interacoesBuff: interacoesBuffJson,
  missoes: missoesJson,
  origens: origensJson,
  forja: forjaJson,
  temas: temasJson,
  afinidades: afinidadesJson,
  armas: armasJson,
  modos: { 'campanha.json': campanhaJson, 'cooperativo.json': cooperativoJson, 'livre.json': livreJson, 'mundo.json': mundoJson },
  reinos: { 'reino-central.json': reinoCentralJson },
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
