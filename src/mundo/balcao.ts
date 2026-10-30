// O balcão da vila do Mundo (marco 30, 30/10/2026, D-129): o quadro de missões e o banco. A sala monta o balcão de
// quem pediu (a entidade, a ficha, onde está e o que tem perto) e estes atendimentos fazem o resto, respondendo por
// avisos. Tudo precisa do NPC perto (o banco abre em qualquer vila; o quadro só oferece as missões da sua vila,
// mas entrega as de qualquer uma). Puro.

import type { ContextoSimulacao } from '../core/contexto';
import type { Bolsa, Entidade } from '../entities/entidade';
import type { AcaoDoMundo } from './acoes';
import type { AvisoDoMundo, MotivoDoMundo } from './avisos';
import { guardarNoBanco, moverOuro, tirarDoBanco } from './banco';
import type { FichaDoMundo } from './ficha-mundo';
import { abandonarMissao, aceitarMissao, diaDe, entregarMissao, feitasNoDia, ofertasDoQuadro, type MissaoDoMundo } from './missoes-mundo';
import type { PapelNpc, Reino } from './reino';

export interface Balcao {
  ctx: ContextoSimulacao;
  reino: Reino;
  e: Entidade;
  bolsa: Bolsa;
  ficha: FichaDoMundo;
  /** A região com vila onde a sessão está (null fora delas). */
  vila: string | null;
  /** Relógio de parede do servidor (ms). */
  agora: number;
  perto: (papel: PapelNpc) => boolean;
  avisar: (a: AvisoDoMundo) => void;
  /** Põe o item na mochila (ou no chão, se não couber). */
  dar: (itemId: string) => void;
  darXp: (xp: number) => void;
}

const recusar = (b: Balcao, motivo: MotivoDoMundo): void => {
  b.avisar({ tipo: 'recusa', motivo });
};

/** As missões do reino por id (montado uma vez por reino). */
const PORID = new WeakMap<Reino, ReadonlyMap<string, MissaoDoMundo>>();
export function missoesPorId(reino: Reino): ReadonlyMap<string, MissaoDoMundo> {
  let m = PORID.get(reino);
  if (!m) {
    m = new Map(reino.missoes.map((x) => [x.id, x]));
    PORID.set(reino, m);
  }
  return m;
}

function ofertas(b: Balcao): string[] {
  return b.vila ? ofertasDoQuadro(b.reino.missoes, b.vila, diaDe(b.agora), b.ctx.balance.mundo.missoes.ofertasPorQuadro) : [];
}

/** O quadro da vila: as ofertas do dia, as aceitas e as já entregues hoje. */
export function avisoDoQuadro(b: Balcao): AvisoDoMundo {
  return { tipo: 'quadro', ofertas: ofertas(b), ativas: b.ficha.missoes.ativas.map((a) => ({ ...a })), feitasHoje: feitasNoDia(b.ficha, diaDe(b.agora)) };
}

export function avisoDoBanco(b: Balcao): AvisoDoMundo {
  return { tipo: 'banco', itens: b.ficha.banco.itens.map((i) => ({ ...i })), ouro: b.ficha.banco.ouro, slots: b.ctx.balance.mundo.banco.slots };
}

export function atenderMissao(b: Balcao, acao: Extract<AcaoDoMundo, { a: 'missao' }>): void {
  if (!b.perto('missoes')) {
    recusar(b, 'longe');
    return;
  }
  const dia = diaDe(b.agora);
  if (acao.op === 'aceitar') {
    const motivo = aceitarMissao(b.ficha, ofertas(b), acao.id, dia, b.ctx.balance.mundo.missoes.ativasMax);
    if (motivo) recusar(b, motivo);
  } else if (acao.op === 'abandonar') {
    const motivo = abandonarMissao(b.ficha, acao.id);
    if (motivo) recusar(b, motivo);
  } else {
    const r = entregarMissao(b.ficha, missoesPorId(b.reino), b.bolsa.mochila, acao.id, dia);
    if (typeof r === 'string') {
      recusar(b, r);
    } else {
      b.bolsa.ouro += r.recompensa.ouro;
      if (r.recompensa.xp > 0) b.darXp(r.recompensa.xp);
      for (const itemId of r.recompensa.itens) b.dar(itemId);
      b.avisar({ tipo: 'recompensa', nome: r.nome, itens: [...r.recompensa.itens], ouro: r.recompensa.ouro, xp: r.recompensa.xp });
    }
  }
  b.avisar(avisoDoQuadro(b));
}

export function atenderBanco(b: Balcao, acao: Extract<AcaoDoMundo, { a: 'banco' | 'bancoOuro' }>): void {
  if (!b.perto('banco')) {
    recusar(b, 'longe');
    return;
  }
  let motivo: MotivoDoMundo | null;
  if (acao.a === 'bancoOuro') {
    motivo = moverOuro(b.ficha.banco, b.bolsa, acao.op, acao.valor);
  } else {
    const lista = acao.op === 'guardar' ? b.bolsa.mochila : b.ficha.banco.itens;
    const item = b.ctx.conteudo.itens.get(lista.find((i) => i.invId === acao.invId)?.itemId ?? '');
    const regras = b.ctx.balance.inventario;
    motivo = !item
      ? 'sem_item'
      : acao.op === 'guardar'
        ? guardarNoBanco(b.ficha.banco, b.bolsa, item, acao.invId, acao.qtd, b.ctx.balance.mundo.banco.slots, regras.pilhaMax)
        : tirarDoBanco(b.ficha.banco, b.bolsa, item, acao.invId, acao.qtd, regras);
  }
  if (motivo) recusar(b, motivo);
  b.avisar(avisoDoBanco(b));
}
