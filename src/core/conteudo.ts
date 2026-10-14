// Conteúdo oficial (§3.9): todos os catálogos lidos, validados e com referências cruzadas
// conferidas. Conteúdo oficial inválido quebra o teste no CI; no jogo, a carga lança erro claro.

import classesJson from '../data/classes.json';
import inimigosJson from '../data/inimigos.json';
import itensJson from '../data/itens.json';
import campanhaJson from '../data/modos/campanha.json';
import livreJson from '../data/modos/livre.json';
import skillsJson from '../data/skills.json';
import { lerHabilidades, type Catalogo, type Habilidade } from '../combat/habilidades';
import { lerClasses, lerPresets, type ClasseJogador, type PresetInimigo } from '../entities/presets';
import { lerModo, RARIDADES, type ModoDeJogo } from '../modos/modo';
import { lerItens, type Item } from '../progression/itens';
import { BALANCE_PADRAO } from './contexto';

export interface Conteudo {
  habilidades: Catalogo<Habilidade>;
  presets: Catalogo<PresetInimigo>;
  classes: Catalogo<ClasseJogador>;
  modos: Catalogo<ModoDeJogo>;
  modoCampanha: ModoDeJogo;
  itens: Catalogo<Item>;
}

export interface FontesDeConteudo {
  skills: unknown;
  inimigos: unknown;
  classes: unknown;
  itens: unknown;
  /** Arquivo → JSON de cada modo em src/data/modos. */
  modos: Readonly<Record<string, unknown>>;
}

export function lerConteudo(fontes: FontesDeConteudo): { conteudo: Conteudo; erros: string[] } {
  const h = lerHabilidades(fontes.skills);
  const p = lerPresets(fontes.inimigos);
  const c = lerClasses(fontes.classes);
  const it = lerItens(fontes.itens);
  const erros = [...h.erros, ...p.erros, ...c.erros, ...it.erros];

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
    for (const id of ids) if (!h.habilidades.has(id)) erros.push(`${dono}: habilidade desconhecida "${id}"`);
  };
  for (const preset of p.presets.values()) conferir(`preset ${preset.id}`, [preset.ataqueBasico, ...preset.habilidades]);
  for (const classe of c.classes.values()) {
    conferir(`classe ${classe.id}`, [classe.ataqueBasico, ...classe.habilidades]);
    for (const { id } of classe.itensIniciais) if (!it.itens.has(id)) erros.push(`classe ${classe.id}: item inicial desconhecido "${id}"`);
  }
  if (!RARIDADES.includes(BALANCE_PADRAO.drops.raridadeMinBoss)) erros.push('balance.json: drops.raridadeMinBoss desconhecida');
  for (const modo of modos.values()) {
    const clamp = modo.clamp;
    if (clamp && clamp.habilidadesPermitidas !== 'qualquer') conferir(`modo ${modo.id}`, clamp.habilidadesPermitidas);
    if (clamp?.presetClasse && !c.classes.has(clamp.presetClasse)) {
      erros.push(`modo ${modo.id}: presetClasse desconhecida "${clamp.presetClasse}"`);
    }
  }

  return {
    conteudo: {
      habilidades: h.habilidades,
      presets: p.presets,
      classes: c.classes,
      modos,
      modoCampanha: modoCampanha ?? lerModo(campanhaJson, 'campanha').modo,
      itens: it.itens,
    },
    erros,
  };
}

export const FONTES_OFICIAIS: FontesDeConteudo = {
  skills: skillsJson,
  inimigos: inimigosJson,
  classes: classesJson,
  itens: itensJson,
  modos: { 'campanha.json': campanhaJson, 'livre.json': livreJson },
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
