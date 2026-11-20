// O sorteio das peças de armadura geradas (marco 47, 20/11/2026, D-190). Puro.
//
// Um sorteio só para a vitrine das lojas (progression/vitrine.ts) e para o loot (progression/loot-pecas.ts): o perfil
// (data/equipamento-sorteio.json) diz a folga de nível e o peso de cada raridade. A peça é um `gi_` de armadura (marco
// 17), com o perfil do marco 46 (propósito, estilo, grau, elemento e efeitos) fixo pelo id. O elemento pode ser puxado:
// tenta sementes até a peça sair no elemento pedido (com teto), sem mexer em data/pecas.json. Quem chama dá o RNG:
// nunca o do combate.

import type { ContextoSimulacao } from '../core/contexto';
import { aleatorio, inteiro, type EstadoRng } from '../core/rng';
import { Leitor } from '../core/validar';
import type { Elemento } from '../combat/elementos';
import { DIFICULDADES, type Dificuldade } from '../modos/dificuldade';
import { RARIDADES, type Raridade } from '../modos/modo';
import { ehPecaDeArmadura } from './graus';
import { ehCatalogoDeItens, idItemGerado } from './gerar-item';
import type { Item } from './itens';

export interface PerfilDeSorteio {
  /** Quantas peças: a vitrine mostra tantas; o chefe solta tantas. */
  quantidade: number;
  /** O nível de cada peça: o do alvo mais um sorteio entre [min, max]. */
  folgaNivel: readonly [number, number];
  pesoRaridade: Readonly<Record<Raridade, number>>;
  /** O peso das raridades acima de comum sobe com o nível (`itensGerados.raridadePorNivelPct`), como nos drops. */
  crescePorNivel: boolean;
}

export interface RegrasDoSorteio {
  perfis: ReadonlyMap<string, PerfilDeSorteio>;
  lojas: {
    /** Os ofícios (`ref` da loja) com vitrine; `semOficio`: também a loja sem ref (a da campanha). */
    oficios: readonly string[];
    semOficio: boolean;
    perfilVila: string;
    perfilDungeon: string;
    preco: { multRaridade: Readonly<Record<Raridade, number>>; porGrauPct: number; porEfeitoPct: number };
  };
  loot: {
    perfilComum: string;
    chancePorAbatePct: number;
    garantia: { abatesSemPeca: number; abatesSemRara: number; raridade: Raridade };
    elementoDaCriaturaPct: number;
    tentativasDoElemento: number;
    raridadePorDificuldadePct: Readonly<Record<Dificuldade, number>>;
    chefe: string;
    chefeMaior: string;
    chefeFiloPrimeira: string;
    bau: { perfil: string; chancePct: number };
  };
}

export function lerSorteioDePecas(json: unknown): { sorteio: RegrasDoSorteio; erros: string[] } {
  const l = new Leitor('equipamento-sorteio.json');
  const o = l.objeto(json, 'raiz');
  const porRaridade = (v: unknown, campo: string) => {
    const r = l.objeto(v, campo);
    return Object.fromEntries(RARIDADES.map((x) => [x, l.numero(r, x, { min: 0 })])) as Record<Raridade, number>;
  };
  const perfis = new Map<string, PerfilDeSorteio>();
  for (const [id, v] of Object.entries(l.objeto(o.perfis, 'perfis'))) {
    const x = l.objeto(v, `perfis.${id}`);
    const folga = l.lista(x, 'folgaNivel').filter((n): n is number => typeof n === 'number' && Number.isInteger(n));
    const [min = 0, max = 0] = folga;
    if (folga.length !== 2 || min > max) l.erro(`perfis.${id}.folgaNivel: [min, max] inteiros`);
    const pesoRaridade = porRaridade(x.pesoRaridade, `perfis.${id}.pesoRaridade`);
    if (RARIDADES.every((r) => pesoRaridade[r] <= 0)) l.erro(`perfis.${id}.pesoRaridade: algum peso acima de 0`);
    perfis.set(id, { quantidade: l.numero(x, 'quantidade', { min: 1, max: 40, inteiro: true }), folgaNivel: [min, max], pesoRaridade, crescePorNivel: l.booleano(x, 'crescePorNivel') });
  }
  const perfil = (v: string) => {
    if (!perfis.has(v)) l.erro(`perfil "${v}" não existe em perfis`);
    return v;
  };
  const lj = l.objeto(o.lojas, 'lojas');
  const pr = l.objeto(lj.preco, 'lojas.preco');
  const lt = l.objeto(o.loot, 'loot');
  const g = l.objeto(lt.garantia, 'loot.garantia');
  const dif = l.objeto(lt.raridadePorDificuldadePct, 'loot.raridadePorDificuldadePct');
  const bau = l.objeto(lt.bau, 'loot.bau');
  return {
    sorteio: {
      perfis,
      lojas: {
        oficios: l.listaDeTextos(lj, 'oficios'),
        semOficio: l.booleano(lj, 'semOficio'),
        perfilVila: perfil(l.texto(lj, 'perfilVila')),
        perfilDungeon: perfil(l.texto(lj, 'perfilDungeon')),
        preco: { multRaridade: porRaridade(pr.multRaridade, 'lojas.preco.multRaridade'), porGrauPct: l.numero(pr, 'porGrauPct', { min: 0 }), porEfeitoPct: l.numero(pr, 'porEfeitoPct', { min: 0 }) },
      },
      loot: {
        perfilComum: perfil(l.texto(lt, 'perfilComum')),
        chancePorAbatePct: l.numero(lt, 'chancePorAbatePct', { min: 0, max: 100 }),
        garantia: {
          abatesSemPeca: l.numero(g, 'abatesSemPeca', { min: 1, inteiro: true }),
          abatesSemRara: l.numero(g, 'abatesSemRara', { min: 1, inteiro: true }),
          raridade: l.opcao(g, 'raridade', RARIDADES),
        },
        elementoDaCriaturaPct: l.numero(lt, 'elementoDaCriaturaPct', { min: 0, max: 100 }),
        tentativasDoElemento: l.numero(lt, 'tentativasDoElemento', { min: 1, max: 200, inteiro: true }),
        raridadePorDificuldadePct: Object.fromEntries(DIFICULDADES.map((d) => [d, l.numero(dif, d, { min: -100 })])) as Record<Dificuldade, number>,
        chefe: perfil(l.texto(lt, 'chefe')),
        chefeMaior: perfil(l.texto(lt, 'chefeMaior')),
        chefeFiloPrimeira: perfil(l.texto(lt, 'chefeFiloPrimeira')),
        bau: { perfil: perfil(l.texto(bau, 'perfil')), chancePct: l.numero(bau, 'chancePct', { min: 0, max: 100 }) },
      },
    },
    erros: l.erros,
  };
}

/** O pedido de uma peça: o nível, o perfil e, se houver, a raridade mínima, o bônus de raridade e o elemento puxado. */
export interface PedidoDePeca {
  nivel: number;
  perfil: PerfilDeSorteio;
  raridadeMin?: Raridade;
  /** % a mais (ou a menos) no peso das raridades acima de comum (a dificuldade). */
  bonusRaridadePct?: number;
  /** O elemento que a peça tende a ter, com a chance `elementoPct` (0 a 100). */
  elemento?: Elemento | null;
  elementoPct?: number;
}

/** Os pesos efetivos de raridade do pedido (o nível, a dificuldade e a raridade mínima). */
export function pesosDoPedido(ctx: ContextoSimulacao, p: Omit<PedidoDePeca, 'elemento' | 'elementoPct'>): Record<Raridade, number> {
  const porNivel = p.perfil.crescePorNivel ? 1 + (ctx.balance.itensGerados.raridadePorNivelPct / 100) * Math.max(0, p.nivel - 1) : 1;
  const bonus = Math.max(0, 1 + (p.bonusRaridadePct ?? 0) / 100);
  const min = p.raridadeMin ? RARIDADES.indexOf(p.raridadeMin) : 0;
  const pesos = Object.fromEntries(RARIDADES.map((r, i) => [r, i < min ? 0 : Math.max(0, p.perfil.pesoRaridade[r]) * (r === 'comum' ? 1 : porNivel * bonus)])) as Record<Raridade, number>;
  // Sem nenhum peso na faixa pedida (o perfil não chega à raridade mínima), vale a mínima.
  if (RARIDADES.every((r) => pesos[r] <= 0)) pesos[p.raridadeMin ?? 'comum'] = 1;
  return pesos;
}

function raridadePorPeso(rng: EstadoRng, pesos: Readonly<Record<Raridade, number>>): Raridade {
  const total = RARIDADES.reduce((s, r) => s + pesos[r], 0);
  let sorteio = aleatorio(rng) * total;
  for (const r of RARIDADES) {
    sorteio -= pesos[r];
    if (pesos[r] > 0 && sorteio < 0) return r;
  }
  return [...RARIDADES].reverse().find((r) => pesos[r] > 0) ?? 'comum';
}

/** As bases de armadura dos itens gerados (vazio num catálogo montado à mão). */
function basesDeArmadura(ctx: ContextoSimulacao): string[] {
  const itens = ctx.conteudo.itens;
  return ehCatalogoDeItens(itens) ? [...itens.basesDeItem.bases.values()].filter((b) => ehPecaDeArmadura(b.slot)).map((b) => b.base) : [];
}

/** Sorteia uma peça de armadura (o id `gi_`), ou null sem bases de armadura no catálogo. */
export function sortearPeca(ctx: ContextoSimulacao, rng: EstadoRng, p: PedidoDePeca): string | null {
  const itens = ctx.conteudo.itens;
  const bases = basesDeArmadura(ctx);
  if (!ehCatalogoDeItens(itens) || bases.length === 0) return null;
  const raridade = raridadePorPeso(rng, pesosDoPedido(ctx, p));
  const base = bases[inteiro(rng, 0, bases.length - 1)] ?? bases[0] ?? '';
  const nivel = Math.max(1, Math.min(itens.regrasDeItem.nivelMax, Math.round(p.nivel) + inteiro(rng, p.perfil.folgaNivel[0], p.perfil.folgaNivel[1])));
  const puxar = !!p.elemento && aleatorio(rng) * 100 < (p.elementoPct ?? 0);
  const tentativas = puxar ? ctx.conteudo.sorteio.loot.tentativasDoElemento : 1;
  let id = '';
  for (let i = 0; i < tentativas; i++) {
    id = idItemGerado(base, nivel, raridade, inteiro(rng, 0, 0x7fffffff));
    if (!puxar || itens.get(id)?.peca?.elemento === p.elemento) break;
  }
  return id;
}

/** O nível da fase: a média dos níveis dos inimigos (1 sem inimigos). */
export function nivelDaFase(ctx: ContextoSimulacao): number {
  const lista = ctx.fase.inimigos;
  if (lista.length === 0) return 1;
  return Math.max(1, Math.round(lista.reduce((s, i) => s + (i.nivel ?? 1), 0) / lista.length));
}

/** O preço-base de uma peça de armadura: o valor do item pela raridade, pelo grau e pelos efeitos. */
export function precoDaPeca(r: RegrasDoSorteio, item: Item): number {
  if (!item.peca) return item.valorBase;
  const p = r.lojas.preco;
  const mult = p.multRaridade[item.raridade] * (1 + (p.porGrauPct * item.peca.grau) / 100) * (1 + (p.porEfeitoPct * item.peca.efeitos.length) / 100);
  return Math.round(item.valorBase * mult);
}
