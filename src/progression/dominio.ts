// A classe que se manifesta nos estilos (marco 39, 12/11/2026, D-155). Substitui o atributo de classe do marco 28
// (`dominio`: Bravura, Instinto, Arcano, Ritual, Engenho), que melhorava a classe igual para todos, em quatro marcos de
// 25 em 25 pontos. Agora cada estilo do pentagrama traz as suas melhorias de classe (`estilos.json`, `melhorias`): a
// cada `degrauPct` da ponta (5%, uns 5 pontos postos no par do estilo), um degrau a mais. As chaves são as mesmas que o
// combate já consultava (fúria, aura, servos, carga, encarnação, falcão...), então a classe cresce na direção do
// estilo: o Carniceiro alarga a aura e a fúria, o Comandante ergue o estandarte, o Senhor da Horda chama mais servos.
// Cada chave soma o que os cinco estilos dão e para no teto (`balance.dominio.tetos`); quem espalha pontos também tem
// degraus em várias pontas e não fica sem classe. As skills de classe e as ultimates crescem com todos os degraus.
// Sem a arma natural, os fatores rendem só `semFamiliaridadePct` e os marcos ficam travados. Puro.

import type { ContextoSimulacao } from '../core/contexto';
import type { Entidade, TrilhaDeClasse } from '../entities/entidade';
import { temFamiliaridade } from './armas';
import { radarDe, type Estilo, type MelhoriaDeClasse, type RadarDeEstilos } from './estilos';

type Ctx = Pick<ContextoSimulacao, 'balance' | 'conteudo'>;

const VAZIA: TrilhaDeClasse = { chaves: {}, degraus: 0 };
const MEMORIA = new WeakMap<RadarDeEstilos, TrilhaDeClasse>();

/** Os degraus de uma ponta: um a cada `degrauPct` da intensidade (pontos e itens). */
export function degrausDaPonta(ctx: Ctx, intensidade: number): number {
  return Math.max(0, Math.floor((intensidade * 100) / ctx.balance.dominio.degrauPct + 1e-9));
}

/**
 * A parte da ponta que conta para os degraus: os pontos e os itens, sem a inclinação inicial (D-153), para que a primeira
 * melhoria venha com os primeiros pontos postos no estilo e não já no nível 1.
 */
export function pontaConquistada(radar: RadarDeEstilos, k: number): number {
  return (radar.base[k] ?? 0) + (radar.itens[k] ?? 0);
}

/** O valor de uma melhoria com tantos degraus (0 antes do `desde`). */
export function valorDaMelhoria(m: MelhoriaDeClasse, degraus: number): number {
  if (degraus < m.desde) return 0;
  const v = m.base + m.porDegrau * degraus;
  return m.inteiro ? Math.floor(v + 1e-9) : v;
}

/** A trilha a partir do radar: a soma de cada chave entre os estilos, no teto. */
export function trilhaDoRadar(ctx: Ctx, radar: RadarDeEstilos): TrilhaDeClasse {
  const memo = MEMORIA.get(radar);
  if (memo) return memo;
  const chaves: Record<string, number> = {};
  let degraus = 0;
  radar.estilos.forEach((est: Estilo, k) => {
    const d = degrausDaPonta(ctx, pontaConquistada(radar, k));
    degraus += d;
    for (const m of est.melhorias) {
      const v = valorDaMelhoria(m, d);
      if (v > 0) chaves[m.chave] = (chaves[m.chave] ?? 0) + v;
    }
  });
  for (const [c, v] of Object.entries(chaves)) {
    const teto = ctx.balance.dominio.tetos[c];
    if (teto !== undefined) chaves[c] = Math.min(teto, v);
  }
  const t = { chaves, degraus };
  MEMORIA.set(radar, t);
  return t;
}

/**
 * A trilha de classe de quem tem ficha (pelo radar) ou, sem a ficha à mão (os outros jogadores no online e no Mundo),
 * a que veio publicada na entidade. Invocações não têm.
 */
export function trilhaDe(ctx: Ctx, e: Entidade): TrilhaDeClasse {
  if (e.invocacao) return VAZIA;
  if (e.bolsa) {
    const r = radarDe(ctx, e.bolsa, e.atributos, e.nivel);
    return r ? trilhaDoRadar(ctx, r) : VAZIA;
  }
  return e.trilhaClasse ?? VAZIA;
}

function rendimento(ctx: Ctx, e: Entidade): number {
  return !e.bolsa || temFamiliaridade(ctx, e) ? 1 : ctx.balance.dominio.semFamiliaridadePct / 100;
}

/** O multiplicador contínuo da chave (`1 + valor%`); 1 se nenhum estilo dá a chave. */
export function fatorDeDominio(ctx: Ctx, e: Entidade, chave: string): number {
  const v = trilhaDe(ctx, e).chaves[chave];
  if (!v) return 1;
  return 1 + (v * rendimento(ctx, e)) / 100;
}

/** O valor de marco da chave (0 se nenhum estilo dá). Sem a arma natural, os marcos ficam travados. */
export function marcoDe(ctx: Ctx, e: Entidade, chave: string): number {
  const v = trilhaDe(ctx, e).chaves[chave] ?? 0;
  if (v <= 0 || (e.bolsa && !temFamiliaridade(ctx, e))) return 0;
  return v;
}

/**
 * 08/11/2026 (D-138): o marco pelo que é público (a classe e a arma à mostra), para a apresentação: no online e no
 * Mundo o estado chega sem a bolsa (a dos outros nunca vem). Com a bolsa, é o `marcoDe`.
 */
export function marcoAMostra(ctx: Ctx, e: Entidade, chave: string): number {
  if (e.bolsa || e.invocacao) return e.invocacao ? 0 : marcoDe(ctx, e, chave);
  const classe = e.classeId ?? '';
  const natural = ctx.conteudo.armas.naturalDaClasse.get(classe);
  const familia = (desenho: string | null | undefined) => (desenho ? ctx.conteudo.armas.familias.get(desenho) : undefined);
  const naMao = !natural || familia(e.aparencia?.arma) === natural
    || (ctx.conteudo.armas.porFamilia[natural].maos === 'qualquer' && familia(e.aparencia?.secundaria) === natural);
  if (!naMao) return 0;
  return e.trilhaClasse?.chaves[chave] ?? 0;
}

/** A skill é de classe para quem a lança: exclusiva da classe ou ultimate (e etapa dela) da própria classe. */
export function ehSkillDeClasse(ctx: Ctx, e: Entidade, habId: string): boolean {
  if (e.invocacao) return false;
  const classe = e.bolsa?.classeId;
  if (!classe) return false;
  if (ctx.conteudo.classes.get(classe)?.exclusivas.includes(habId)) return true;
  const ult = ctx.conteudo.ultimates.get(habId) ?? ctx.conteudo.ultimates.get(habId.replace(/_\d+$/, ''));
  return ult?.classe === classe;
}

/** O multiplicador das skills de classe e ultimates (dano, cura e potência): cresce com os degraus de todos os estilos. */
export function fatorDeSkillDeClasse(ctx: Ctx, e: Entidade, habId: string): number {
  if (!ehSkillDeClasse(ctx, e, habId)) return 1;
  return 1 + (trilhaDe(ctx, e).degraus * ctx.balance.dominio.skillsPorDegrauPct * rendimento(ctx, e)) / 100;
}
