// 02/11/2026: exército próprio do boss e atenção atraída por combate recente no Mundo.
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import { invocar } from '../combat/efeitos-fluxo';
import { construirEfeito } from '../combat/registro-efeitos';
import { alvoOfensivoValido } from '../combat/acao';
import { chebyshev } from '../combat/geometria';
import { podeAjudar } from '../modos/relacao';
import { criarInimigo } from './fabrica';
import { vivo, type Entidade } from './entidade';

export function limiteDoExercito(ctx: ContextoSimulacao, nivel: number): number {
  const r = ctx.balance.mundo.exercitoNecromante;
  return Math.min(r.maximo,r.minimo + Math.floor(Math.max(0,nivel-1)/r.niveisPorVaga));
}

export function processarExercitoNecromante(estado: EstadoJogo, ctx: ContextoSimulacao, dono: Entidade, saida: EventoSimulacao[]): void {
  if (dono.preset !== 'necromante_ancestral' || dono.invocacao || !vivo(dono)) return;
  const alvo = estado.entidades.find(e=>e.id===dono.ia?.alvoId);
  if (!alvo || !alvoOfensivoValido(estado,ctx,dono,alvo)) return;
  const chave = `exercito-boss:${dono.id}`;
  if ((estado.recargas[chave] ?? 0) > estado.tick) return;
  const r = ctx.balance.mundo.exercitoNecromante;
  const vivos = estado.entidades.filter(e=>vivo(e)&&e.invocacao?.donoId===dono.id);
  const vagas = limiteDoExercito(ctx,dono.nivel)-vivos.length;
  if(vagas<=0) return;
  for(let i=0;i<vagas;i++) {
    if(estado.entidades.filter(e=>vivo(e)&&e.controlador==='ia').length>=ctx.modo.limites.npcs) break;
    const ref = r.presets[(vivos.length+i)%r.presets.length];
    if(!ref) continue;
    const preset=ctx.conteudo.presets.get(ref);
    if(!preset) continue;
    const indice=estado.entidades.length;
    invocar(estado,ctx,dono,construirEfeito('invocar',{ref,valor:1,duracaoMs:r.duracaoMs}),saida);
    const e=estado.entidades[indice];
    if(!e?.invocacao) continue;
    const inv=e.invocacao;
    inv.exercitoBoss=true;
    const escalado=criarInimigo(preset,e.id,e.x,e.y,ctx.balance,{nivel:dono.nivel});
    Object.assign(e,escalado,{tipo:'invocacao',equipe:dono.equipe,grupo:dono.grupo,invocacao:inv,xpBase:0});
  }
  estado.recargas[chave]=estado.tick+ticksDe(r.recargaMs);
}

export function raioDeAtencao(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, base: number): number {
  if(!ctx.fase.exterior) return base;
  const r=ctx.balance.mundo.atencaoBatalha, desde=estado.tick-ticksDe(r.memoriaMs);
  const porId=new Map(estado.entidades.map(a=>[a.id,a]));
  const batalha=estado.entidades.some(a=>{
    if(!vivo(a)||a===e||!podeAjudar(e,a,ctx.modo)||chebyshev(e,a)>r.raio)return false;
    const recebeu=a.participacao.some(p=>{const alvo=porId.get(p.id);return p.tick>=desde&&alvo&&alvoOfensivoValido(estado,ctx,e,alvo);});
    const alvo=a.ia?.alvoId?porId.get(a.ia.alvoId):undefined;
    const atacou=alvo&&alvoOfensivoValido(estado,ctx,e,alvo)&&alvo.participacao.some(p=>p.id===a.id&&p.tick>=desde);
    return recebeu||!!atacou;
  });
  return base+(batalha?r.bonus:0);
}
