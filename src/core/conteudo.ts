// Conteúdo oficial (§3.9): todos os catálogos lidos, validados e com referências cruzadas
// conferidas. Conteúdo oficial inválido quebra o teste no CI; no jogo, a carga lança erro claro.

import classesJson from '../data/classes.json';
import inimigosJson from '../data/inimigos.json';
import campanhaJson from '../data/modos/campanha.json';
import skillsJson from '../data/skills.json';
import { lerHabilidades, type Catalogo, type Habilidade } from '../combat/habilidades';
import { lerClasses, lerPresets, type ClasseJogador, type PresetInimigo } from '../entities/presets';
import { lerModo, type ModoDeJogo } from '../modos/modo';

export interface Conteudo {
  habilidades: Catalogo<Habilidade>;
  presets: Catalogo<PresetInimigo>;
  classes: Catalogo<ClasseJogador>;
  modoCampanha: ModoDeJogo;
}

export interface FontesDeConteudo {
  skills: unknown;
  inimigos: unknown;
  classes: unknown;
  campanha: unknown;
}

export function lerConteudo(fontes: FontesDeConteudo): { conteudo: Conteudo; erros: string[] } {
  const h = lerHabilidades(fontes.skills);
  const p = lerPresets(fontes.inimigos);
  const c = lerClasses(fontes.classes);
  const m = lerModo(fontes.campanha, 'modos/campanha.json');
  const erros = [...h.erros, ...p.erros, ...c.erros, ...m.erros];

  const conferir = (dono: string, ids: readonly string[]) => {
    for (const id of ids) if (!h.habilidades.has(id)) erros.push(`${dono}: habilidade desconhecida "${id}"`);
  };
  for (const preset of p.presets.values()) conferir(`preset ${preset.id}`, [preset.ataqueBasico, ...preset.habilidades]);
  for (const classe of c.classes.values()) conferir(`classe ${classe.id}`, [classe.ataqueBasico, ...classe.habilidades]);

  return {
    conteudo: { habilidades: h.habilidades, presets: p.presets, classes: c.classes, modoCampanha: m.modo },
    erros,
  };
}

export const FONTES_OFICIAIS: FontesDeConteudo = {
  skills: skillsJson,
  inimigos: inimigosJson,
  classes: classesJson,
  campanha: campanhaJson,
};

export function conteudoOficial(): Conteudo {
  const { conteudo, erros } = lerConteudo(FONTES_OFICIAIS);
  if (erros.length > 0) throw new Error(`conteúdo oficial inválido:\n${erros.join('\n')}`);
  return conteudo;
}
