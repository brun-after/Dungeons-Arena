// 02/11/2026: exército próprio do boss e atenção atraída por combate recente no Mundo.
import { fogoAceso } from '../world/fogo-aceso';
import { fatorDaNoite, percepcaoNoEscuro } from '../mundo/noite';
import { temLuzPropria } from '../combat/luz-propria';
import { hashTexto } from '../core/rng';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import { invocar } from '../combat/efeitos-fluxo';
import { chaveDoExercito } from '../combat/necromancia';
import { construirEfeito } from '../combat/registro-efeitos';
import { alvoOfensivoValido } from '../combat/acao';
import { chebyshev } from '../combat/geometria';
import { podeAjudar } from '../modos/relacao';
import { criarInimigo } from './fabrica';
import { vivo, type Entidade } from './entidade';

/**
 * 15/11/2026 (D-179): quantos mortos o necromante inimigo mantém de pé, pelo nível: `noNivelBase` no `nivelBase` e uma
 * vaga a cada `niveisPorVaga` níveis (para cima e para baixo), entre 1 e `maximo` (nível 8: 4; nível 50: 10).
 */
export function limiteDoExercito(ctx: ContextoSimulacao, nivel: number): number {
  const r = ctx.balance.mundo.exercitoNecromante;
  return Math.max(1, Math.min(r.maximo, r.noNivelBase + Math.floor((nivel - r.nivelBase) / r.niveisPorVaga)));
}

export function processarExercitoNecromante(estado: EstadoJogo, ctx: ContextoSimulacao, dono: Entidade, saida: EventoSimulacao[]): void {
  if (dono.preset !== 'necromante_ancestral' || dono.invocacao || !vivo(dono)) return;
  const alvo = estado.entidades.find(e=>e.id===dono.ia?.alvoId);
  if (!alvo || !alvoOfensivoValido(estado,ctx,dono,alvo)) return;
  const chave = chaveDoExercito(dono.id);
  if ((estado.recargas[chave] ?? 0) > estado.tick) return;
  const r = ctx.balance.mundo.exercitoNecromante;
  const vivos = estado.entidades.filter(e=>vivo(e)&&e.invocacao?.donoId===dono.id);
  if(vivos.length>=limiteDoExercito(ctx,dono.nivel)) return;
  // 15/11/2026 (D-179): um de cada vez, a cada `recargaMs` (antes, todas as vagas de uma vez).
  if(estado.entidades.filter(e=>vivo(e)&&e.controlador==='ia').length>=ctx.modo.limites.npcs) return;
  const ref = r.presets[vivos.length%r.presets.length];
  const preset=ref?ctx.conteudo.presets.get(ref):undefined;
  if(!ref||!preset) return;
  const indice=estado.entidades.length;
  invocar(estado,ctx,dono,construirEfeito('invocar',{ref,valor:1,duracaoMs:r.duracaoMs}),saida);
  const e=estado.entidades[indice];
  if(e?.invocacao){
    const inv=e.invocacao;
    inv.exercitoBoss=true;
    const escalado=criarInimigo(preset,e.id,e.x,e.y,ctx.balance,{nivel:dono.nivel});
    Object.assign(e,escalado,{tipo:'invocacao',equipe:dono.equipe,grupo:dono.grupo,invocacao:inv,xpBase:0});
  }
  estado.recargas[chave]=estado.tick+ticksDe(r.recargaMs);
}

export function raioDeAtencao(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, base0: number): number {
  if(!ctx.fase.exterior) return base0;
  // Marco 44 (D-178): o escuro entra por alvo (raioContra), porque quem está iluminado é visto de longe.
  const base=base0;
  const r=ctx.balance.mundo.atencaoBatalha, desde=estado.tick-ticksDe(r.memoriaMs);
  // Marco 44 (15/11/2026, D-178): à noite, a batalha por perto também é notada de mais perto e chama menos (50% na noite
  // fechada): antes o raio e o bônus eram os do dia.
  const noite=fatorDaNoite(ctx), raioBatalha=r.raio*noite;
  const porId=new Map(estado.entidades.map(a=>[a.id,a]));
  const batalha=estado.entidades.some(a=>{
    if(!vivo(a)||a===e||!podeAjudar(e,a,ctx.modo)||chebyshev(e,a)>raioBatalha)return false;
    const recebeu=a.participacao.some(p=>{const alvo=porId.get(p.id);return p.tick>=desde&&alvo&&alvoOfensivoValido(estado,ctx,e,alvo);});
    const alvo=a.ia?.alvoId?porId.get(a.ia.alvoId):undefined;
    const atacou=alvo&&alvoOfensivoValido(estado,ctx,e,alvo)&&alvo.participacao.some(p=>p.id===a.id&&p.tick>=desde);
    return recebeu||!!atacou;
  });
  return base+(batalha?r.bonus*noite:0);
}

/**
 * Marco 44 (15/11/2026, D-178): iluminado é quem leva a tocha acesa ou está a até `raioDoFogo` de um poste de tocha ou
 * de uma fogueira. No escuro, quem está iluminado vê e é visto como de dia.
 */
export function iluminado(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade): boolean {
  if (temLuzPropria(e)) return true;
  const r = ctx.balance.mundo.tocha.raioDoFogo;
  return estado.objetos.some((o) => fogoAceso(o, estado.tick) && chebyshev(o, e) <= r);
}

/** Como o monstro reage a quem leva a tocha: o mais forte é atraído, o mais fraco evita, o igual decide na sorte. */
export type ReacaoAoFogo = 'normal' | 'atraido' | 'evita';

export function reacaoAoFogo(estado: EstadoJogo, ctx: ContextoSimulacao, monstro: Entidade, alvo: Entidade): ReacaoAoFogo {
  if (!ctx.fase.exterior || !temLuzPropria(alvo)) return 'normal';
  if (monstro.nivel > alvo.nivel) return 'atraido';
  if (monstro.nivel < alvo.nivel) return 'evita';
  const t = ctx.balance.mundo.tocha;
  // O sorteio é por par e por janela de tempo (o mesmo resultado no mesmo estado, sem guardar nada).
  const janela = Math.floor(estado.tick / Math.max(1, ticksDe(t.janelaIguaisMs)));
  return (hashTexto(`${monstro.id}|${alvo.id}|${janela}`) % 100) < t.iguaisAvancamPct ? 'atraido' : 'evita';
}

/** Quem atacou o monstro (ele sempre persegue quem o feriu, com ou sem fogo). */
function provocou(monstro: Entidade, alvo: Entidade): boolean {
  return monstro.participacao.some((p) => p.id === alvo.id);
}

/**
 * O raio de atenção do monstro contra este alvo (células), a partir do raio dele: no escuro, encolhe para quem não
 * está iluminado; contra quem leva a tocha, cresce para os mais fortes e some para os que evitam (a menos que provocados).
 */
export function raioContra(estado: EstadoJogo, ctx: ContextoSimulacao, monstro: Entidade, alvo: Entidade, raio: number): number {
  if (!ctx.fase.exterior) return raio;
  const reacao = reacaoAoFogo(estado, ctx, monstro, alvo);
  if (reacao === 'evita' && !provocou(monstro, alvo)) return -1;
  const visto = iluminado(estado, ctx, alvo) ? raio : percepcaoNoEscuro(ctx, alvo, raio);
  return reacao === 'atraido' ? visto * ctx.balance.mundo.tocha.atraiMult : visto;
}

/** O portador da tocha que este monstro evita e que está perto demais (a menos de `afastaRaio`), ou null. */
export function fogoQueAfasta(estado: EstadoJogo, ctx: ContextoSimulacao, monstro: Entidade): Entidade | null {
  if (!ctx.fase.exterior) return null;
  const r = ctx.balance.mundo.tocha.afastaRaio;
  for (const a of estado.entidades) {
    if (a === monstro || !vivo(a) || a.controlador === 'ia' || chebyshev(a, monstro) >= r) continue;
    if (!alvoOfensivoValido(estado, ctx, monstro, a) || provocou(monstro, a)) continue;
    if (reacaoAoFogo(estado, ctx, monstro, a) === 'evita') return a;
  }
  return null;
}
