// Afinidade elemental dos inimigos (marco 23, 24/10/2026, D-092). Um afixo por instância, não um preset novo: o
// gerador sorteia o elemento (pelo tema da fase) e a fábrica o põe na entidade. O inimigo afim:
// - absorve o próprio elemento: resistência `absorcaoPct` (150) = o golpe cura metade do dano em vez de ferir, e o
//   estado do elemento não pega nele (gelo não resfria o inimigo de gelo);
// - é fraco ao oposto (`fraquezaPct`, −50: +50% de dano);
// - ganha uma habilidade do elemento (data/afinidades.json) e o nome leva o elemento ("Goblin de Gelo").
// A variante extrema (o chefe do tema elemental e 1 em 8 dos afins) é imune a todo outro elemento e leva o dobro do
// oposto: só cai pelo oposto ou pelo golpe sem elemento. Números em balance.afinidade.

import type { ContextoSimulacao } from '../core/contexto';
import { Leitor } from '../core/validar';
import type { Entidade } from '../entities/entidade';
import { ELEMENTOS, type Elemento } from './elementos';

export interface DadosAfinidade {
  oposto: Elemento;
  habilidade: string;
  sufixo: string;
}

export interface CatalogoAfinidades {
  elementos: ReadonlyMap<Elemento, DadosAfinidade>;
  /** O qualificativo da variante extrema ("Primordial"). */
  nomeExtrema: string;
}

export interface Afinidade {
  elemento: Elemento;
  extrema: boolean;
}

const ehElemento = (v: string): v is Elemento => (ELEMENTOS as readonly string[]).includes(v);

export function lerAfinidades(json: unknown): { afinidades: CatalogoAfinidades; erros: string[] } {
  const l = new Leitor('afinidades.json');
  const topo = l.objeto(json, 'raiz');
  const raiz = l.objeto(topo.elementos, 'elementos');
  const afinidades = new Map<Elemento, DadosAfinidade>();
  for (const e of ELEMENTOS) {
    const o = l.objeto(raiz[e], e);
    const oposto = l.texto(o, 'oposto');
    if (!ehElemento(oposto) || oposto === e) l.erro(`${e}: oposto inválido "${oposto}"`);
    afinidades.set(e, { oposto: ehElemento(oposto) ? oposto : e, habilidade: l.texto(o, 'habilidade'), sufixo: l.texto(o, 'sufixo') });
  }
  return { afinidades: { elementos: afinidades, nomeExtrema: l.texto(topo, 'nomeExtrema') }, erros: l.erros };
}

/**
 * A resistência que a afinidade impõe ao elemento, ou null quando ela não decide (o golpe sem elemento e os
 * elementos neutros para o afim comum seguem a resistência do preset).
 */
export function resistenciaDaAfinidade(ctx: ContextoSimulacao, alvo: Entidade, elemento: Elemento): number | null {
  const a = alvo.afinidade;
  if (!a) return null;
  const b = ctx.balance.afinidade;
  if (elemento === a.elemento) return b.absorcaoPct;
  if (elemento === ctx.conteudo.afinidades.elementos.get(a.elemento)?.oposto) return a.extrema ? b.extremaFraquezaPct : b.fraquezaPct;
  return a.extrema ? 100 : null;
}

/** Quanto do dano o alvo absorve como cura, em % (0 = não absorve). */
export function absorcaoPct(ctx: ContextoSimulacao, alvo: Entidade, elemento: Elemento | null): number {
  if (!elemento) return 0;
  const r = resistenciaDaAfinidade(ctx, alvo, elemento);
  return r !== null && r > 100 ? r - 100 : 0;
}

/** O estado que o elemento afim aplica não pega no afim (o tipo do estado de `elementos.json`). */
export function imuneAoEstado(ctx: ContextoSimulacao, alvo: Entidade, tipo: string): boolean {
  const a = alvo.afinidade;
  return !!a && ctx.conteudo.elementos.get(a.elemento)?.estado.tipo === tipo;
}

/** O nome do inimigo afim: "Goblin de Gelo", e "Goblin Primordial de Gelo" na variante extrema. */
export function nomeComAfinidade(nome: string, catalogo: CatalogoAfinidades, a: Afinidade): string {
  const dados = catalogo.elementos.get(a.elemento);
  if (!dados) return nome;
  return `${nome}${a.extrema ? ` ${catalogo.nomeExtrema}` : ''} ${dados.sufixo}`;
}
