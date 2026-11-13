// Runas nas skills de classe e nas ultimates (marco 39, 12/11/2026, D-151). As skills de classe deixam de ter elemento
// fixo: cada uma tem um encaixe de runa, que já vem com a runa padrão da classe (Mago Fogo, Necromante Trevas, Guerreiro
// Físico, Arqueiro Raio, Aventureiro Terra; `runaPadrao` de classes.json); a skill que já tem elemento no catálogo (a
// Nova de gelo do Mago) vem com a runa dele, para a identidade da classe continuar inteira. O jogador troca a runa por qualquer elemento
// com que tenha vínculo (uma única skill de fogo na barra já basta). Se o vínculo com o elemento da runa zera, a runa
// some e o encaixe volta para a padrão (a escolha fica guardada, mas não vale).
// A skill passa a ter duas partes: a base, neutra (o poder base, os estilos, o domínio), e a elemental, que vem da runa
// e cresce com o vínculo: de `fracaoMinPct` (20%) do dano no vínculo 0 até `fracaoMaxPct` (60%) no vínculo cheio. As
// resistências e absorções do alvo só pegam a parte elemental (combat/golpe.ts). A duração do estado do elemento também
// cresce com o vínculo.
// A runa interage com o papel sem trocá-lo: a skill de dano ganha o estado do elemento; a cura, uma função secundária
// pelo elemento (sagrado cura mais; gelo e terra deixam parte em escudo). O vínculo vai na chave da skill em faixas de
// 0 a 10, para a memória das skills compiladas continuar valendo. Puro.

import type { ContextoSimulacao } from '../core/contexto';
import type { Bolsa, Entidade } from '../entities/entidade';
import { PONTAS_ELEMENTAIS, vinculoDe, type PontaElemental } from '../progression/vinculo';
import type { DefinicaoElemento, Elemento } from './elementos';
import type { Habilidade } from './habilidades';
import { idDoEncaixe, levaRuna, runaPadraoDaSkill } from './encaixe-runa';
import { construirEfeito } from './registro-efeitos';
import { aplicarSecundario, type TabelaDePapeis } from './papeis';
import { ultimateDe } from './ultimate-do-par';

export { levaRuna, runaPadrao, runaPadraoDaSkill } from './encaixe-runa';

export interface RegrasRunas {
  /** O vínculo mínimo (em %) para a runa escolhida valer; abaixo dele, o encaixe volta para a padrão. */
  vinculoMinPct: number;
  fracaoMinPct: number;
  fracaoMaxPct: number;
  /** A duração do estado do elemento no vínculo 0, em % da do catálogo (cheia no vínculo máximo). */
  duracaoMinPct: number;
  /** A cura a mais da runa sagrada no vínculo cheio, em %. */
  curaSagradoPct: number;
  /** O escudo da runa de gelo e de terra na cura: `escudoBase + escudoPorFaixa × faixa`, por `escudoMs`. */
  escudoBase: number;
  escudoPorFaixa: number;
  escudoMs: number;
  /** Marco 40 (D-160): o dano a mais da ultimate por faixa do elemento mais fraco do par, quando os dois diferem, em %. */
  parPorFaixaPct: number;
  /** O dano a mais do combo quando as duas skills da sequência estão com a mesma runa, em %. */
  parComboPct: number;
}

export const FAIXAS_DE_VINCULO = 10;

export function ehPonta(v: unknown): v is PontaElemental {
  return typeof v === 'string' && (PONTAS_ELEMENTAIS as readonly string[]).includes(v);
}

type Ctx = Pick<ContextoSimulacao, 'conteudo' | 'balance'>;

/** A runa ainda vale? (o uso esfria sem nunca chegar a zero: abaixo do mínimo, conta como zerado) */
function vale(ctx: Ctx, vinculo: number): boolean {
  return vinculo * 100 >= ctx.balance.habilidades.runas.vinculoMinPct;
}

/** As runas que o personagem tem agora para a skill: a padrão dela e as de todo elemento com vínculo. */
export function runasDisponiveis(ctx: Ctx, e: Pick<Entidade, 'bolsa'>, id: string, tick: number): PontaElemental[] {
  const bolsa = e.bolsa;
  if (!bolsa) return [];
  const v = vinculoDe(ctx, e, tick);
  const padrao = runaPadraoDaSkill(ctx, bolsa, id);
  return PONTAS_ELEMENTAIS.filter((p) => p === padrao || vale(ctx, v[p]));
}

/** A runa que vale no encaixe (a escolhida, se ainda há vínculo; senão, a padrão) e a faixa do vínculo com ela. */
export function runaDoAtor(ctx: Ctx, e: Pick<Entidade, 'bolsa'>, id: string, tick: number): { runa: PontaElemental; faixa: number } | null {
  const bolsa = e.bolsa;
  if (!bolsa || !levaRuna(ctx, id)) return null;
  const v = vinculoDe(ctx, e, tick);
  const escolhida = bolsa.runas?.[idDoEncaixe(ctx, id)];
  const runa = escolhida && vale(ctx, v[escolhida]) ? escolhida : runaPadraoDaSkill(ctx, bolsa, id);
  return { runa, faixa: Math.max(0, Math.min(FAIXAS_DE_VINCULO, Math.round(v[runa] * FAIXAS_DE_VINCULO))) };
}

/** A fração elemental (0 a 1) na faixa do vínculo. */
export function fracaoElemental(r: RegrasRunas, faixa: number): number {
  return (r.fracaoMinPct + ((r.fracaoMaxPct - r.fracaoMinPct) * faixa) / FAIXAS_DE_VINCULO) / 100;
}

/** A skill compilada com a runa: o elemento, a parte elemental, o estado do elemento e a função secundária. */
export function aplicarRuna(h: Habilidade, runa: PontaElemental, faixa: number, elementos: ReadonlyMap<Elemento, DefinicaoElemento>, r: RegrasRunas, papeis?: TabelaDePapeis): Habilidade {
  const elemento: Elemento | null = runa === 'fisico' ? null : runa;
  const v = faixa / FAIXAS_DE_VINCULO;
  // O estado do elemento antigo da skill sai (a skill de classe fica neutra); o da runa entra, se a skill fere.
  const antigo = h.elemento ? elementos.get(h.elemento)?.estado.tipo : undefined;
  let efeitos = h.efeitos.filter((e) => e.tipo !== antigo);
  const estado = elemento ? elementos.get(elemento)?.estado : undefined;
  if (estado && h.formulaDano !== null && !efeitos.some((e) => e.tipo === estado.tipo)) {
    efeitos = [...efeitos, { ...estado, duracaoMs: Math.round((estado.duracaoMs * (r.duracaoMinPct + (100 - r.duracaoMinPct) * v)) / 100) }];
  }
  let multCura = h.multCura;
  const tags = [...new Set([...h.tags.filter((t) => t !== 'elemental'), ...(elemento ? ['elemental'] : [])])];
  // Marco 40 (12/11/2026, D-157): a skill com papel tira a função secundária da tabela papel × elemento.
  if (h.papel && papeis?.get(h.papel)) {
    return aplicarSecundario({ ...h, elemento, efeitos, tags, runa, faixaRuna: faixa, fracaoElemental: fracaoElemental(r, faixa) }, papeis, runa, faixa);
  }
  // A cura ganha a função secundária do elemento (sem deixar de curar).
  if (h.formulaCura !== null && h.formulaDano === null) {
    if (runa === 'sagrado') multCura *= 1 + (r.curaSagradoPct * v) / 100;
    if (runa === 'gelo' || runa === 'terra') {
      efeitos = [...efeitos, construirEfeito('escudo', { valor: Math.round(r.escudoBase + r.escudoPorFaixa * faixa), duracaoMs: r.escudoMs })];
    }
  }
  return { ...h, elemento, efeitos, multCura, tags, runa, faixaRuna: faixa, fracaoElemental: fracaoElemental(r, faixa) };
}

/**
 * O comando `escolherRuna`: troca a runa do encaixe de uma skill que o personagem conhece. Só aceita a padrão ou um
 * elemento com vínculo; `null` (ou a padrão) apaga a escolha. Fora disso, nada muda.
 */
export function escolherRuna(ctx: Ctx, e: Pick<Entidade, 'bolsa' | 'habilidades'>, habilidade: string, runa: PontaElemental | null, tick: number): boolean {
  const bolsa = e.bolsa;
  if (!bolsa || !levaRuna(ctx, habilidade)) return false;
  const id = idDoEncaixe(ctx, habilidade);
  // Marco 40 (D-160): a ultimate que o personagem tem é a da família do par dele.
  const conhece = bolsa.conhecidas.some((c) => c.id === id) || ultimateDe(ctx, e)?.id === id;
  if (!conhece) return false;
  if (runa === null || runa === runaPadraoDaSkill(ctx, bolsa, id)) {
    if (bolsa.runas) bolsa.runas = Object.fromEntries(Object.entries(bolsa.runas).filter(([k]) => k !== id));
    return true;
  }
  if (!runasDisponiveis(ctx, e, id, tick).includes(runa)) return false;
  (bolsa.runas ??= {})[id] = runa;
  return true;
}

/** O último tick em que o uso foi registrado (a referência da ficha, que não tem o tick do jogo). */
export function ultimoTickDeUso(bolsa: Pick<Bolsa, 'vinculoUso'>): number {
  return Math.max(0, ...Object.values(bolsa.vinculoUso ?? {}).map((u) => u.tick));
}
