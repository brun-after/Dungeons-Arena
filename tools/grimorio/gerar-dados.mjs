// Marco 24 (24/10/2026, D-094 a D-096): gera os dados do jogo a partir do Grimório das Classes (o desenho aprovado) e das
// especificações em specs/ (a mecânica de cada skill, ultimate e combo). Escreve, em src/data:
//   skills.json (versão 6) · ultimates.json · classes.json (versão 5) · combos.json (versão 3) · os livros em itens.json ·
//   as invocações novas em inimigos.json.
// Rodar de novo é seguro: o resultado depende só do Grimório, das specs e do estado anterior dos arquivos (que ele lê para
// manter o que não é do marco 24). Uso: node tools/grimorio/gerar-dados.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { D, idCodigo, raiz } from './grimorio.mjs';
import { habilidade, slug } from './specs/dsl.mjs';
import { AJUSTES, PASSIVAS_ANTIGAS, RENOMEADAS, SKILLS } from './specs/skills.mjs';
import { CONDICOES_ANTIGOS, MECANICA } from './specs/combos.mjs';
import * as ultGuerreiro from './specs/ultimates-guerreiro.mjs';
import * as ultMago from './specs/ultimates-mago.mjs';
import * as ultArqueiro from './specs/ultimates-arqueiro.mjs';
import * as ultNecromante from './specs/ultimates-necromante.mjs';
import * as ultAventureiro from './specs/ultimates-aventureiro.mjs';

const dados = (arq) => join(raiz, 'src', 'data', arq);
const ler = (arq) => JSON.parse(readFileSync(dados(arq), 'utf8'));
const escrever = (arq, v) => writeFileSync(dados(arq), `${JSON.stringify(v, null, 2)}\n`);
const renomear = (id) => RENOMEADAS[id] ?? id;
const catalogo = JSON.parse(readFileSync(join(raiz, 'tools', 'grimorio', 'catalogo.json'), 'utf8'));

// ---------------- skills.json ----------------
const skillsAntes = ler('skills.json');
const porId = new Map(skillsAntes.habilidades.filter((h) => !(h.id in RENOMEADAS)).map((h) => [h.id, h]));
for (const [id, ajuste] of Object.entries(AJUSTES)) porId.set(id, { ...porId.get(id), ...ajuste });
for (const s of SKILLS) porId.set(s.id, JSON.parse(JSON.stringify(s)));
for (const [id, h] of porId) if (h.fusao) porId.set(id, { ...h, fusao: h.fusao.map(renomear) });
for (const [id, p] of Object.entries(PASSIVAS_ANTIGAS)) {
  const h = porId.get(id);
  porId.set(id, { ...h, familiaEvolucao: p.familia, passiva: { ...h.passiva, tipo: p.tipo } });
}
// A família geral (as 9 da sintonia) em cada ativa e passiva geral.
for (const f of catalogo.familias) for (const id of [...f.ativas, ...f.passivas]) porId.set(id, { ...porId.get(id), familiaGeral: f.id });
const habilidades = [...porId.values()];
escrever('skills.json', { versao: 6, habilidades });

// ---------------- ultimates.json ----------------
const ESPECS = { guerreiro: ultGuerreiro, mago: ultMago, arqueiro: ultArqueiro, necromante: ultNecromante, aventureiro: ultAventureiro };
const TIPO_PADRAO = { guerreiro: 'fisico', arqueiro: 'fisico', aventureiro: 'fisico', mago: 'magico', necromante: 'magico' };
const CAMPOS_FORMA = ['politicaAlvo', 'politicaImpacto', 'tipoArea', 'raioArea', 'alcanceCelulas', 'velocidadeProjetil'];

/** Uma etapa ou a ultimate inteira, no formato de skills.json. */
function definicao(id, nomeHab, e, classe, extra) {
  const esp = ESPECS[classe];
  const forma = Object.fromEntries(CAMPOS_FORMA.filter((k) => e[k] !== undefined).map((k) => [k, e[k]]));
  const tipoAtaque = e.tipo ?? esp.TIPO ?? TIPO_PADRAO[classe];
  return habilidade({
    id,
    nome: nomeHab,
    icone: 'coroa',
    grau: 'S',
    tipoAtaque,
    ...forma,
    ...(e.alcance !== undefined ? { alcanceCelulas: e.alcance } : {}),
    formulaDano: e.d ?? null,
    formulaCura: e.formulaCura ?? null,
    custoRecurso: e.custoRecurso ?? 0,
    ...(e.custoVida ? { custoVida: e.custoVida } : {}),
    recargaMs: 0,
    conjuracaoMs: e.conjuracaoMs ?? 300,
    interrupcao: e.interrupcao ?? 'ininterrupta',
    ...(e.el ? { elemento: e.el } : {}),
    ...(e.mods ? { mods: e.mods } : {}),
    ...(e.variantes ? { variantes: e.variantes } : {}),
    ...(esp.BASE ?? {}),
    tags: ['ultimate', ...(esp.BASE?.tags ?? [])],
    ...extra,
    efeitos: e.ef ?? [],
  });
}

const ultimates = [];
const internas = [];
for (const c of D.classes) {
  const esp = ESPECS[c.id];
  if (!esp || esp.default.length !== c.pares.length) throw new Error(`${c.id}: ${esp?.default.length} ultimates nas specs, ${c.pares.length} no Grimório`);
  c.pares.forEach((par, i) => {
    const e = esp.default[i];
    const id = `ult_${slug(par.nome)}`;
    const cor = par.cores?.[0] ?? '#e0c068';
    const visual = { cor, conjuracao: 'runas', impacto: e.impacto ?? 'explosao', camera: e.camera ?? 'leve', som: 'nivel', ...(e.projetil ? { projetil: e.projetil } : {}) };
    const fases = (e.fases ?? []).map(([s, etapa, onde], k) => {
      const sub = `${id}_${k + 1}`;
      internas.push(definicao(sub, `${par.nome} (${k + 2}ª etapa)`, { ...etapa, impacto: etapa.impacto ?? e.impacto }, c.id, {
        interna: true,
        visual: { cor, impacto: etapa.impacto ?? e.impacto ?? 'explosao', camera: 'leve', som: 'golpe' },
      }));
      const f = { tipo: 'fase', ref: sub, duracaoMs: Math.round(s * 1000) };
      return onde === 'eu' ? { ...f, em: 'conjurador' } : f;
    });
    const def = definicao(id, par.nome, { ...e, ef: [...(e.ef ?? []), ...fases] }, c.id, { visual });
    internas.unshift(def);
    ultimates.push({ id, classe: c.id, par: [idCodigo(c.skills[par.a]), idCodigo(c.skills[par.b])], texto: par.texto });
  });
  for (const [id, e] of Object.entries(esp.EXTRAS ?? {})) {
    internas.push(definicao(id, id, e, c.id, { interna: true, visual: { cor: '#d0603f', impacto: e.impacto ?? 'chamas', camera: 'leve', som: 'golpe' } }));
  }
}
// As etapas ficam depois das ultimates, na ordem em que foram geradas.
const principais = new Set(ultimates.map((u) => u.id));
escrever('ultimates.json', {
  versao: 1,
  ultimates,
  habilidades: [...internas.filter((h) => principais.has(h.id)), ...internas.filter((h) => !principais.has(h.id))],
});

// ---------------- classes.json ----------------
// As listas novas (exclusivas, iniciais, geralInicial) substituem o kit antigo (`habilidades`, `aprendiveis`): o kit
// inicial é derivado delas no jogo (entities/presets.ts).
const classesAntes = ler('classes.json');
const classes = classesAntes.classes.map((antes) => {
  const k = { ...antes };
  delete k.habilidades;
  delete k.aprendiveis;
  const cat = catalogo.classes.find((c) => c.id === k.id);
  if (!cat) return k;
  return {
    ...k,
    exclusivas: cat.skills,
    iniciais: cat.iniciais,
    geralInicial: cat.geralInicial,
  };
});
escrever('classes.json', { versao: 5, classes });

// ---------------- combos.json ----------------
const combosAntes = ler('combos.json');
const antigos = new Map(combosAntes.combos.map((c) => [c.id, c]));
const destinoDe = (id) => {
  const h = porId.get(id);
  if (!h) return 'alvo';
  if (h.politicaImpacto === 'proprio' || h.politicaAlvo === 'aliados' || h.politicaAlvo === 'proprio') return 'ator';
  return h.politicaImpacto === 'area' && h.politicaAlvo === 'celula' ? 'mira' : 'alvo';
};
const usados = new Set();
const combos = [];
for (const g of D.combos) {
  if (g.tipo === 'sinergia') continue;
  const sequencia = g.seq.map(idCodigo);
  const visualG = g.visual ?? g.sugestao;
  // Só os combos de antes do marco 24 (`nova: false` no Grimório) são preservados; os novos saem sempre das specs.
  const antigo = g.id && g.nova === false ? antigos.get(g.id) : undefined;
  if (antigo) {
    combos.push({ ...antigo, nome: g.nome, texto: g.texto, sequencia, ...(CONDICOES_ANTIGOS[antigo.id] ? { condicoes: CONDICOES_ANTIGOS[antigo.id] } : {}), visual: { ...antigo.visual, cor: visualG.cor } });
    usados.add(antigo.id);
    continue;
  }
  const m = MECANICA[g.nome];
  if (!m) throw new Error(`combo sem mecânica nas specs: ${g.nome}`);
  const id = g.id && !g.id.startsWith('v11_') ? g.id : slug(g.nome);
  const temAlvo = sequencia.every((s) => s === '@ultimate' || destinoDe(s) === 'alvo');
  const combo = {
    id,
    nome: g.nome,
    janelaMs: sequencia.length === 3 ? 3000 : 2000,
    mesmoAlvo: temAlvo,
    texto: g.texto,
    danoPct: m.dano ?? 0,
    ...(m.d20 ? { d20Minimo: m.d20 } : {}),
    ...(m.alvo?.length ? { noAlvo: m.alvo } : {}),
    ...(m.eu?.length ? { noProprio: m.eu } : {}),
    ...(m.volta ? { emVolta: { raio: m.volta[0], efeitos: m.volta[1] } } : {}),
    ...(m.mira ? { naMira: { raio: m.mira[0], efeitos: m.mira[1] } } : {}),
    sequencia,
    condicoes: m.cond ?? [],
    visual: { cor: visualG.cor, formas: visualG.formas, movimento: visualG.movimento, duracaoMs: 800, destinos: visualG.formas.map((_, i) => destinoDe(sequencia[Math.min(i + sequencia.length - 2, sequencia.length - 1)])) },
  };
  combos.push(combo);
  usados.add(id);
}
const sobrando = [...antigos.keys()].filter((k) => !usados.has(k));
if (sobrando.length) throw new Error(`combos antigos fora do Grimório: ${sobrando.join(', ')}`);
const ids = new Set();
for (const c of combos) {
  if (ids.has(c.id)) throw new Error(`combo repetido: ${c.id}`);
  ids.add(c.id);
}
escrever('combos.json', { versao: 3, combos, recompensas: combosAntes.recompensas });

// ---------------- livros (itens.json) ----------------
const itensAntes = ler('itens.json');
const classeDe = new Map(catalogo.classes.flatMap((c) => c.skills.map((s) => [s, c.id])));
const NOME_CLASSE = Object.fromEntries(classesAntes.classes.map((c) => [c.id, c.nome]));
const livroDe = (skill) => {
  const h = porId.get(skill);
  const classe = classeDe.get(skill);
  const quem = classe ? `Só ${NOME_CLASSE[classe]} pode ler.` : 'Qualquer classe pode ler.';
  return {
    id: `livro_${skill}`,
    nome: `Livro: ${h.nome}`,
    tipo: 'livro',
    descricao: `Ensina ${h.nome} (rank 1). ${quem}`,
    icone: 'livro',
    raridade: classe ? 'raro' : 'incomum',
    valorBase: classe ? 110 : 70,
    slotPadrao: null,
    nivelMinimo: h.nivelMinimo ?? 1,
    bonusAtributos: {},
    bonusDefesa: 0,
    dropavel: true,
    ensina: skill,
    ...(classe ? { classe } : {}),
  };
};
const ensinaveis = [...catalogo.classes.flatMap((c) => c.skills), ...catalogo.familias.flatMap((f) => [...f.ativas, ...f.passivas])];
const itens = [];
const livrosFeitos = new Set();
for (const it of itensAntes.itens) {
  if (it.tipo !== 'livro' || !it.ensina) { itens.push(it); continue; }
  const skill = renomear(it.ensina);
  if (!porId.has(skill)) continue;
  itens.push({ ...livroDe(skill), raridade: it.raridade, valorBase: it.valorBase, ...(classeDe.has(skill) ? { raridade: 'raro', valorBase: Math.max(it.valorBase, 110) } : {}) });
  livrosFeitos.add(skill);
}
for (const s of ensinaveis) if (!livrosFeitos.has(s)) { itens.push(livroDe(s)); livrosFeitos.add(s); }
escrever('itens.json', { ...itensAntes, itens });

// ---------------- invocações novas (inimigos.json) ----------------
const inimigosAntes = ler('inimigos.json');
const chave = Object.keys(inimigosAntes).find((k) => Array.isArray(inimigosAntes[k]));
const presets = inimigosAntes[chave];
const NOVAS = [
  { id: 'esqueleto_profano', nome: 'Esqueleto profano', hpBase: 35, modelo: 'esqueleto', ataqueBasico: 'golpe', intervaloAtaqueMs: 1500, defesa: 1 },
  { id: 'espectro', nome: 'Espectro', hpBase: 30, modelo: 'sombra', ataqueBasico: 'golpe', intervaloAtaqueMs: 1600, defesa: 0 },
  { id: 'cavaleiro_da_morte', nome: 'Cavaleiro da morte', hpBase: 120, modelo: 'esqueleto', ataqueBasico: 'golpe_pesado', intervaloAtaqueMs: 1800, defesa: 3 },
  { id: 'copia_ilusoria', nome: 'Cópia ilusória', hpBase: 15, modelo: 'sombra', ataqueBasico: 'golpe', intervaloAtaqueMs: 2000, defesa: 0 },
  { id: 'falcao_espectral', nome: 'Falcão espectral', hpBase: 20, modelo: 'falcao', ataqueBasico: 'golpe', intervaloAtaqueMs: 1200, defesa: 0 },
];
for (const n of NOVAS) {
  if (presets.some((p) => p.id === n.id)) continue;
  presets.push({
    id: n.id, nome: n.nome, hpBase: n.hpBase, hesitacaoS: 0, deteccao: 5, xp: 0, modelo: n.modelo, arquetipo: 'perseguidor', classe: 'corpo_a_corpo',
    defesa: n.defesa, ataqueBasico: n.ataqueBasico, habilidades: [], intervaloAtaqueMs: n.intervaloAtaqueMs, invocacao: { comportamento: 'agressivo' },
  });
}
escrever('inimigos.json', inimigosAntes);

console.log(`skills ${habilidades.length} · ultimates ${ultimates.length} (+${internas.length - ultimates.length} etapas) · combos ${combos.length} · livros ${livrosFeitos.size}`);
