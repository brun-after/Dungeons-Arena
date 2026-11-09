// 02/11/2026: oferta temporária sem RNG de combate; dungeons têm estoque superior ao das vilas.
import type { Conteudo } from '../core/conteudo';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo, ObjetoNoMundo } from '../core/estado';
import { hashTexto } from '../core/rng';
import { ticksDe } from '../core/tempo';
import type { Reino } from './reino';
import type { Item } from '../progression/itens';

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

type RegrasLojaDungeon = ContextoSimulacao['balance']['mundo']['lojaDungeon'];
const DIA_MS = 86_400_000;

/**
 * 09/11/2026 (D-144): a semana das lojas das dungeons (sobe a cada `diaRenovacao` à meia-noite no `fusoHoras`). O
 * relógio é o do servidor; a sala aplica o estoque e o cliente o recebe nos objetos.
 */
export function semanaDaLoja(agoraMs: number, r: RegrasLojaDungeon): number {
  const dia = Math.floor((agoraMs + r.fusoHoras * 3_600_000) / DIA_MS);
  // 01/01/1970 foi uma quinta (dia da semana 4): o primeiro dia de renovação depois dele.
  const primeiro = (((r.diaRenovacao - 4) % 7) + 7) % 7;
  return Math.floor((dia - primeiro) / 7);
}

/**
 * 09/11/2026 (D-144): o estoque da semana de uma dungeon. Antes era o mesmo para todas as dungeons do reino (as lojas
 * da vila mais 8 raros fixos). Agora cada dungeon sorteia o seu (determinístico pela dungeon e pela semana): o básico
 * da vila da região, incomuns e raros garantidos e a chance de um raro a mais, um épico e um lendário.
 */
export function estoqueSemanalDaDungeon(conteudo: Conteudo, territorio: Reino, dungeon: { id: string; nivel: number }, semana: number, r: RegrasLojaDungeon): string[] {
  const s = `${dungeon.id}/${semana}`;
  const chance = (nome: string, pct: number) => hashTexto(`${s}/${nome}`) % 10_000 < pct * 100;
  const embaralhar = (lista: readonly string[], nome: string) => [...lista].sort((a, b) => hashTexto(`${s}/${nome}/${a}`) - hashTexto(`${s}/${nome}/${b}`) || a.localeCompare(b));
  const vendavel = (i: Item) => i.valorBase > 0 && i.tipo !== 'chave' && i.nivelMinimo <= dungeon.nivel + r.nivelFolga;
  const daRaridade = (raridade: Item['raridade']) => [...conteudo.itens.values()].filter((i) => i.raridade === raridade && vendavel(i)).map((i) => i.id);
  const vila = [...new Set(Object.values(territorio.lojas).flat())].filter((id) => { const i = conteudo.itens.get(id); return !!i && vendavel(i); });
  const raros = embaralhar(daRaridade('raro'), 'raro');
  const qtdRaros = r.raros + (chance('raroExtra', r.raroExtraChancePct) ? 1 : 0);
  return [...new Set([
    'pergaminho_retorno',
    ...embaralhar(vila, 'vila').slice(0, r.basicos),
    ...embaralhar(daRaridade('incomum'), 'incomum').slice(0, r.incomuns),
    ...raros.slice(0, qtdRaros),
    ...(chance('epico', r.epicoChancePct) ? embaralhar(daRaridade('epico'), 'epico').slice(0, 1) : []),
    ...(chance('lendario', r.lendarioChancePct) ? embaralhar(daRaridade('lendario'), 'lendario').slice(0, 1) : []),
  ])].filter((id) => conteudo.itens.has(id));
}
