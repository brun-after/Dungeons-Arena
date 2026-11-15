// D-174 (14/11/2026): a transmutação. A skill de classe (e a ultimate) com a runa de outro elemento passa a ser feita
// inteira desse elemento, não só a levar um toque dele: o Círculo rúnico do Mago nasce de gelo e, com a runa de raio,
// é de raio — as lascas de gelo viram arcos, a geada do chão some, o azul vira o violeta do raio. O desenho da skill (a
// silhueta: o círculo, a corrente, o giro, a lâmina, os ossos do Necromante) fica como é; o que troca é a matéria e a
// cor. Funciona por cima das assinaturas, sem reescrevê-las:
// - cada elemento tem a sua matéria em quatro papéis (a partícula leve, o corpo, o fumo e a marca no chão);
// - a textura que é matéria do elemento de origem vira a do mesmo papel no elemento da runa;
// - toda cor é refeita no matiz da runa, guardando o claro e o escuro (o branco segue branco; o aço, quase).
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
}

type Papel = 'leve' | 'corpo' | 'fumo' | 'marca';
type Textura = Emissao['textura'];

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

/** As emissões da assinatura, feitas do elemento da runa. */
export function emissoesTrocadas(lista: readonly Emissao[], troca: Troca): Emissao[] {
  return lista.map((e) => {
    const textura = (texturaTrocada(e.textura, troca) ?? e.textura);
    // A matéria nova não herda o flipbook da antiga (a labareda tem quadros; o cristal, não).
    const { quadros, ...semQuadros } = e;
    const base: Emissao = textura !== e.textura || !quadros ? semQuadros : e;
    return {
      ...base,
      textura,
      cor: e.cor === null ? null : corTrocada(e.cor, troca),
      ...(e.cores ? { cores: e.cores.map((c) => (c === null ? null : corTrocada(c, troca))) } : {}),
      ...(e.corFinal !== undefined && e.corFinal !== null ? { corFinal: corTrocada(e.corFinal, troca) } : {}),
    };
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
    p.desenhar(textura, x, y, t?.cor === undefined ? t : { ...t, cor: corTrocada(t.cor, troca) });
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
export function naRunaDaSkill(familia: FamiliaVfx, runa: Runa | undefined, lista: readonly Emissao[], cor: number): { lista: readonly Emissao[]; cor: number } {
  const troca = trocaDe(familia, runa);
  return troca ? { lista: emissoesTrocadas(lista, troca), cor: COR_DA_RUNA[troca.para] } : { lista, cor };
}
