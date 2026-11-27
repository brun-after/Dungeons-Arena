// D-174 (14/11/2026): a transmutação. A skill de classe (e a ultimate) com a runa de outro elemento passa a ser feita
// inteira desse elemento, não só a levar um toque dele: o Círculo rúnico do Mago nasce de gelo e, com a runa de raio,
// é de raio — as lascas de gelo viram arcos, a geada do chão some, o azul vira o violeta do raio. O desenho da skill (a
// silhueta: o círculo, a corrente, o giro, a lâmina, os ossos do Necromante) fica como é; o que troca é a matéria e a
// cor. Funciona por cima das assinaturas, sem reescrevê-las:
// - cada elemento tem a sua matéria em quatro papéis (a partícula leve, o corpo, o fumo e a marca no chão);
// - a textura que é matéria do elemento de origem vira a do mesmo papel no elemento da runa;
// - toda cor é refeita no matiz da runa, guardando o claro e o escuro (o branco segue branco; o aço, quase).
// D-206, continuação (26/11/2026): a fusão também transmuta. A troca pode ter como destino uma liga (ligas-materia.ts):
// a assinatura do núcleo passa a ser feita da mistura — o espinho de terra de uma fusão com fogo é lava incandescente;
// a bola de fogo com pedra vira gotas de magma. A liga diz a matéria que entra no lugar da de cada elemento, a rampa
// de cor (do escuro ao claro: cada cor cai nela pela claridade) e se brilha (a silhueta ganha uma passada somada).
// Só desenho.

import type { Emissao } from '../presets-particula';
import type { SistemaParticulas } from '../particulas';
import type { CenaVfx, FamiliaVfx } from './cena';
import { COR_DA_RUNA, type Runa } from './manifestacao-runa';
import type { Animacao, Pincel } from './pincel';
import { ehTexturaRica } from './texturas';

export interface Troca {
  de: Runa;
  para: Runa;
  /** D-206: a troca para uma liga da fusão (então `para` é igual a `de`, e a matéria e a cor vêm da liga). */
  liga?: Transmuta;
}

export type Papel = 'leve' | 'corpo' | 'fumo' | 'marca';
export type Textura = Emissao['textura'];

/** D-206: a matéria da liga, por elemento de origem e papel; a rampa de cor; o brilho incandescente. */
export interface Transmuta {
  cor: number;
  rampa: readonly number[];
  materia: Partial<Record<Runa, Partial<Record<Papel, readonly Textura[]>>>>;
  brilho: boolean;
}

/** A cor a usar no lugar da cor da skill, quando há troca. */
export const corDaTroca = (t: Troca): number => t.liga?.cor ?? COR_DA_RUNA[t.para];

/** A matéria de cada elemento, por papel (a primeira de cada lista é a que entra quando outro elemento vira este). */
const MATERIA: Readonly<Record<Runa, Readonly<Record<Papel, readonly Textura[]>>>> = {
  fogo: { leve: ['brasa', 'chama'], corpo: ['chama3', 'chama0', 'chama1', 'chama2', 'chama4', 'chama5', 'chama6', 'chama7'], fumo: ['fumaca1', 'fumaca2', 'fumaca3', 'fumaca', 'cinza'], marca: ['queimado'] },
  gelo: { leve: ['floco', 'cristal'], corpo: ['gelo'], fumo: ['floco'], marca: ['geada'] },
  raio: { leve: ['faisca'], corpo: ['arco'], fumo: ['faisca'], marca: [] },
  terra: { leve: ['lasca'], corpo: ['rocha'], fumo: ['lasca'], marca: ['rachadura'] },
  veneno: { leve: ['bolha', 'gota'], corpo: ['gota_viva'], fumo: ['bolha'], marca: ['poca_veneno'] },
  trevas: { leve: ['cinza'], corpo: ['alma'], fumo: ['fumaca2'], marca: ['poca_sangue'] },
  sagrado: { leve: ['cintilar'], corpo: ['estrela'], fumo: ['cintilar'], marca: [] },
  psiquico: { leve: ['runa1', 'runa', 'runa0', 'runa2', 'runa3'], corpo: ['olho'], fumo: ['runa2'], marca: [] },
  vento: { leve: ['corte', 'folha'], corpo: ['corte'], fumo: ['folha'], marca: [] },
  fisico: { leve: ['faisca'], corpo: ['estilhaco'], fumo: ['lasca'], marca: ['rachadura'] },
};
const PAPEIS: readonly Papel[] = ['corpo', 'leve', 'fumo', 'marca'];

/** O elemento de que a assinatura é feita, pela família dela (as físicas, do arco e da corrente são o aço). */
const ELEMENTO_DA_FAMILIA: Readonly<Record<FamiliaVfx, Runa>> = {
  fogo: 'fogo', gelo: 'gelo', raio: 'raio', terra: 'terra', veneno: 'veneno', trevas: 'trevas', luz: 'sagrado', arcano: 'psiquico',
  corrente: 'fisico', fisico: 'fisico', arqueiro: 'fisico', falcao: 'fisico', vento: 'fisico',
};

/** A troca que a runa pede a uma assinatura desta família (null: a skill já é desse elemento). */
export function trocaDe(familia: FamiliaVfx, runa: Runa | undefined): Troca | null {
  if (!runa) return null;
  const de = ELEMENTO_DA_FAMILIA[familia];
  return de === runa ? null : { de, para: runa };
}

/** A textura no elemento da runa: a matéria de origem vira a do mesmo papel; o resto (a silhueta) fica. */
export function texturaTrocada<T extends string>(t: T, troca: Troca): T | Textura | null {
  for (const papel of PAPEIS) {
    if (!MATERIA[troca.de][papel].includes(t as Textura)) continue;
    if (troca.liga) return troca.liga.materia[troca.de]?.[papel]?.[0] ?? t;
    return MATERIA[troca.para][papel][0] ?? (papel === 'marca' ? null : (MATERIA[troca.para].leve[0] ?? t));
  }
  return t;
}

/** A cor no matiz da runa, guardando o quanto ela era clara e viva (branco fica branco; cinza, cinza). */
export function corTrocada(cor: number, troca: Troca): number {
  const r = (cor >> 16) & 255;
  const g = (cor >> 8) & 255;
  const b = cor & 255;
  const max = Math.max(r, g, b);
  if (max === 0) return 0;
  if (troca.liga) return naRampa(troca.liga.rampa, (max + Math.min(r, g, b)) / 510);
  const palidez = Math.min(r, g, b) / max;
  const brilho = max / 255;
  const alvo = COR_DA_RUNA[troca.para];
  const canal = (desloca: number) => {
    const a = (alvo >> desloca) & 255;
    // O matiz da runa, clareado na medida da palidez da cor original e escurecido no brilho dela.
    return Math.round((a + (255 - a) * palidez * palidez) * brilho);
  };
  return (canal(16) << 16) | (canal(8) << 8) | canal(0);
}

/** D-206: a cor na rampa da liga pela claridade (0 = o primeiro tom, 1 = o último), interpolada. */
export function naRampa(rampa: readonly number[], claridade: number): number {
  const k = Math.max(0, Math.min(1, claridade)) * (rampa.length - 1);
  const i = Math.min(rampa.length - 2, Math.floor(k));
  const a = rampa[i] ?? 0;
  const b = rampa[i + 1] ?? a;
  const f = k - i;
  const c = (s: number) => Math.round(((a >> s) & 255) * (1 - f) + ((b >> s) & 255) * f);
  return (c(16) << 16) | (c(8) << 8) | c(0);
}

/** D-206: as matérias de corpo (que a luz não atravessa): trocadas para elas, deixam de somar e ganham a crosta. */
const OPACAS: ReadonlySet<string> = new Set(['rocha', 'gelo', 'estilhaco', 'gota_viva', 'espinho', 'lasca', 'cristal']);

/** As emissões da assinatura, feitas do elemento da runa. */
export function emissoesTrocadas(lista: readonly Emissao[], troca: Troca): Emissao[] {
  return lista.flatMap((e) => {
    const textura = (texturaTrocada(e.textura, troca) ?? e.textura);
    // A matéria nova não herda o flipbook da antiga (a labareda tem quadros; o cristal, não).
    const { quadros, ...semQuadros } = e;
    const base: Emissao = textura !== e.textura || !quadros ? semQuadros : e;
    const trocada: Emissao = {
      ...base,
      textura,
      cor: e.cor === null ? null : corTrocada(e.cor, troca),
      ...(e.cores ? { cores: e.cores.map((c) => (c === null ? null : corTrocada(c, troca))) } : {}),
      ...(e.corFinal !== undefined && e.corFinal !== null ? { corFinal: corTrocada(e.corFinal, troca) } : {}),
      ...(e.aoMorrer ? { aoMorrer: emissoesTrocadas(e.aoMorrer, troca) } : {}),
    };
    // D-206: na liga incandescente, a matéria opaca leva junto um brilho somado (a pedra que é lava, o cristal ígneo).
    const rampa = troca.liga?.brilho ? troca.liga.rampa : null;
    // A matéria que a liga pôs no lugar (a chama que virou pedra) deixa de ser luz somada: é corpo, com o brilho junto.
    const trocouMateria = textura !== e.textura && OPACAS.has(textura);
    if (!rampa || (e.aditivo && !trocouMateria) || !(['corpo', 'leve'] as const).some((p) => MATERIA[troca.de][p].includes(e.textura))) return [trocada];
    const brilho: Emissao = { ...trocada };
    delete brilho.aoMorrer;
    delete brilho.cores;
    return [{ ...trocada, aditivo: false }, { ...brilho, quantidade: Math.max(1, Math.ceil(e.quantidade / 2)), aditivo: true, cor: rampa[rampa.length - 2] ?? 0xffffff, alpha: [Math.min(1, e.alpha[0]) * 0.7, 0] }];
  });
}

/** O sistema de partículas que emite já no elemento da runa. */
function particulasTrocadas(p: SistemaParticulas, troca: Troca): SistemaParticulas {
  const emitirLista: SistemaParticulas['emitirLista'] = (lista, x, y, cor, ate, dir) => { p.emitirLista(emissoesTrocadas(lista, troca), x, y, corTrocada(cor, troca), ate, dir); };
  return new Proxy(p, {
    get(alvo, chave) {
      if (chave === 'emitirLista') return emitirLista;
      const v: unknown = Reflect.get(alvo, chave, alvo);
      return typeof v === 'function' ? (v as (...a: unknown[]) => unknown).bind(alvo) : v;
    },
  });
}

/** O pincel que desenha a silhueta na matéria e na cor da runa. */
function pincelTrocado(p: Pincel, troca: Troca): Pincel {
  const desenhar: Pincel['desenhar'] = (nome, x, y, t) => {
    const textura = texturaTrocada(nome, troca);
    if (textura === null) return;
    // D-206: a liga incandescente (lava, plasma, cristal ígneo): a silhueta opaca sai na crosta escura da rampa e o
    // brilho somado pulsa por cima, como a lava que respira.
    const rampa = troca.liga?.brilho && (!t?.aditivo || (textura !== nome && OPACAS.has(textura))) ? troca.liga.rampa : null;
    if (!rampa) {
      p.desenhar(textura, x, y, t?.cor === undefined ? t : { ...t, cor: corTrocada(t.cor, troca) });
      return;
    }
    const cor = t?.cor ?? 0xffffff;
    const claridade = (Math.max(cor >> 16, (cor >> 8) & 255, cor & 255) + Math.min(cor >> 16, (cor >> 8) & 255, cor & 255)) / 510;
    // A crosta: escura, opaca; o miolo: a mesma silhueta menor, somada e pulsando, para a borda ficar escura e o
    // centro aceso (o espinho de lava, a pedra em brasa, o cristal com fogo dentro).
    p.desenhar(textura, x, y, { ...t, aditivo: false, cor: naRampa(rampa, 0.12 + claridade * 0.25) });
    const pulso = 0.6 + 0.35 * Math.sin(performance.now() / 130 + x * 0.05);
    const miolo = 0.74;
    p.desenhar(textura, x, y, { ...t, sx: (t?.sx ?? 1) * miolo, sy: (t?.sy ?? 1) * miolo, cor: naRampa(rampa, 0.92), aditivo: true, alpha: (t?.alpha ?? 1) * pulso });
    p.desenhar(textura, x, y, { ...t, sx: (t?.sx ?? 1) * 1.08, sy: (t?.sy ?? 1) * 1.08, cor: naRampa(rampa, 0.6), aditivo: true, alpha: (t?.alpha ?? 1) * 0.22 });
  };
  return new Proxy(p, {
    get(alvo, chave) {
      if (chave === 'desenhar') return desenhar;
      const v: unknown = Reflect.get(alvo, chave, alvo);
      return typeof v === 'function' ? (v as (...a: unknown[]) => unknown).bind(alvo) : v;
    },
  });
}

/** A cena em que tudo o que a assinatura desenhar sai no elemento da runa. */
export function cenaTrocada(c: CenaVfx, troca: Troca): CenaVfx {
  return {
    ...c,
    particulas: particulasTrocadas(c.particulas, troca),
    tocar: (a: Animacao) => { c.tocar({ ...a, desenhar: (t, ms, p) => a.desenhar(t, ms, pincelTrocado(p, troca)) }); },
    marca: (nome, x, y, cor, escala, ms, aditivo) => {
      const textura = texturaTrocada(nome, troca);
      if (textura === null || !ehTexturaRica(textura)) return;
      c.marca(textura, x, y, corTrocada(cor, troca), escala, ms, aditivo);
    },
  };
}

/** O corpo do projétil em voo (e qualquer lista solta da assinatura), com a cor a usar, no elemento da runa. */
export function naRunaDaSkill(familia: FamiliaVfx, runa: Runa | undefined, lista: readonly Emissao[], cor: number, mistura?: Troca | null): { lista: readonly Emissao[]; cor: number } {
  const troca = trocaDe(familia, runa) ?? mistura ?? null;
  return troca ? { lista: emissoesTrocadas(lista, troca), cor: corDaTroca(troca) } : { lista, cor };
}

/** O elemento de que a assinatura desta família é feita. */
export const elementoDaFamilia = (familia: FamiliaVfx): Runa => ELEMENTO_DA_FAMILIA[familia];
