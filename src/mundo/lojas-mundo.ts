// 02/11/2026: oferta temporária sem RNG de combate; dungeons têm estoque superior ao das vilas.
import type { Conteudo } from '../core/conteudo';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo, ObjetoNoMundo } from '../core/estado';
import { hashTexto } from '../core/rng';
import { ticksDe } from '../core/tempo';
import type { Reino } from './reino';

export function estoqueDeDungeon(conteudo: Conteudo, reino: Reino, nivel: number): string[] {
  const raros=[...conteudo.itens.values()].filter(i=>i.raridade==='raro'&&i.valorBase>0&&i.id!=='chave_cripta');
  const avancados=nivel>=30?['couraca_trono','manto_abismo','livro_chuva_de_estrelas','runa_de_fusao','tomo_potencial']:['couraca_expedicao','capa_sombria','anel_do_eco','aceleracao_mente_rara','essencia_fogo','essencia_gelo'];
  return [...new Set([...Object.values(reino.lojas).flat(), 'pergaminho_retorno',...avancados,...raros.slice(0,8).map(i=>i.id)])];
}

export function ofertasDoMundo(estado: EstadoJogo, ctx: ContextoSimulacao, loja: ObjetoNoMundo): string[] {
  if(!ctx.fase.exterior) return [];
  const r=ctx.balance.mundo.ofertas;
  const periodo=ticksDe(r.periodoS*1000), duracao=ticksDe(r.duracaoS*1000);
  // A origem é compartilhada pelo servidor na mesma sala; nunca usa Date.now no núcleo.
  const deslocamento=hashTexto(`${estado.faseId}/${loja.objetoId}`)%periodo;
  const tempo=estado.tick+deslocamento;
  if(tempo%periodo>=duracao) return [];
  const lista=ctx.fase.id.includes('eclipse_')?r.avancadas:r.centrais;
  const rodada=Math.floor(tempo/periodo);
  return [...lista].sort((a,b)=>hashTexto(`${rodada}/${loja.objetoId}/${a}`)-hashTexto(`${rodada}/${loja.objetoId}/${b}`)).slice(0,r.quantidade);
}
