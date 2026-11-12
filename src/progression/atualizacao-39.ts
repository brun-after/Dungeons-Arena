// A atualização do personagem para o sistema do marco 39 (12/11/2026, D-149). O personagem criado antes não tem a
// marca `bolsa.sistema` e vê, ao entrar no jogo (campanha, grupo, Mundo ou arena), a tela de atualização. Ela devolve
// todos os pontos de atributo — os da classe voltam à base, e o orçamento inteiro do nível no sistema novo fica livre,
// atributo de classe incluído — para o jogador montar a build no pentagrama antes de jogar.
// O orçamento novo é menor em números (3 por nível até o 30 e 2 depois), mas o jogo foi calibrado nele: o poder base
// do nível e os estilos dão a um personagem com o orçamento novo a força que a build focada tinha no antigo (D-148).
// Nível, XP, itens, ouro, habilidades e ranks não mudam.
// O comando chega com a distribuição pedida; a simulação confere cada ponto (teto do nível, orçamento) e o que sobrar
// fica livre, para distribuir depois. Puro.

import type { ContextoSimulacao } from '../core/contexto';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { SISTEMA_DO_PERSONAGEM, type Bolsa, type Entidade } from '../entities/entidade';
import { recalcularFicha } from './derivados';
import { NOMES_ATRIBUTOS, type NomeAtributo } from './itens';
import { pontosAteONivel, tetoDoAtributo } from './nivel';

/** O personagem ainda não passou pela tela de atualização? */
export function precisaDaAtualizacao(bolsa: Pick<Bolsa, 'sistema'> | null | undefined): boolean {
  return !!bolsa && bolsa.sistema !== SISTEMA_DO_PERSONAGEM;
}

/** Os pontos que a tela devolve: todo o orçamento do nível no sistema novo. */
export function pontosDaAtualizacao(e: Pick<Entidade, 'nivel'>, ctx: Pick<ContextoSimulacao, 'balance'>): number {
  return pontosAteONivel(e.nivel, ctx.balance.xp);
}

/** Os pontos que o personagem tinha postos e livres antes (só para a tela mostrar o antes). */
export function pontosAntes(bolsa: Bolsa, ctx: Pick<ContextoSimulacao, 'conteudo'>): number {
  const base = ctx.conteudo.classes.get(bolsa.classeId)?.atributos;
  if (!base) return bolsa.pontosAtributo;
  return NOMES_ATRIBUTOS.reduce((s, a) => s + Math.max(0, bolsa.atributosBase[a] - base[a]), 0) + bolsa.pontosAtributo;
}

/**
 * Aplica a distribuição pedida sobre a base da classe, ponto a ponto e na ordem dos atributos, sem passar do teto do
 * nível nem do orçamento; o resto fica livre. Marca o personagem no sistema atual. Devolve se aplicou.
 */
export function aplicarAtualizacao(e: Entidade, ctx: ContextoSimulacao, pedido: Partial<Record<NomeAtributo, number>>, tick: number, saida: EventoSimulacao[]): boolean {
  const bolsa = e.bolsa;
  if (!bolsa || !precisaDaAtualizacao(bolsa)) return false;
  const classe = ctx.conteudo.classes.get(bolsa.classeId);
  if (!classe) return false;
  const teto = (a: NomeAtributo) => tetoDoAtributo(e.nivel, ctx.balance, classe.atributos[a]);
  let livres = pontosDaAtualizacao(e, ctx);
  const base = { ...classe.atributos };
  for (const a of NOMES_ATRIBUTOS) {
    const quer = Math.max(0, Math.floor(pedido[a] ?? 0));
    const cabe = Math.max(0, Math.min(quer, livres, teto(a) - base[a], ctx.balance.atributos.maximo - base[a]));
    base[a] += cabe;
    livres -= cabe;
  }
  bolsa.atributosBase = base;
  bolsa.pontosAtributo = livres;
  bolsa.sistema = SISTEMA_DO_PERSONAGEM;
  recalcularFicha(e, ctx);
  e.hp = Math.min(e.hp, e.hpMax);
  saida.push({ t: 'personagemAtualizado', tick, id: e.id, sistema: SISTEMA_DO_PERSONAGEM });
  return true;
}
