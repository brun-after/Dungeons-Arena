// O social dentro de uma sala do Mundo (marco 30, 30/10/2026, D-129): o chat local e o da região (o do grupo vai
// ao servidor, que conhece todas as salas) e a troca direta entre dois jogadores perto. A sala passa quem está nela
// e como avisar cada um; aqui ficam as regras. Puro.

import type { ContextoSimulacao } from '../core/contexto';
import type { EntidadeId } from '../core/comandos';
import { vivo, type Entidade } from '../entities/entidade';
import type { AcaoDoMundo } from './acoes';
import type { AvisoDoMundo, MotivoDoMundo } from './avisos';
import { limparTexto, type LimiteDoChat } from './chat';
import type { AcaoSocial } from './pendencias';
import { executarTroca, ofertaVista, type Troca, type TrocasDaSala } from './troca';

export interface Participante {
  sessaoId: string;
  e: Entidade;
  identidade: string;
  avisar: (a: AvisoDoMundo) => void;
}

export interface SalaSocial {
  ctx: ContextoSimulacao;
  agora: number;
  participantes: () => Participante[];
  /** O pedido social que passa entre salas (o chat do grupo). */
  pedirAoServidor: (acao: AcaoSocial) => void;
}

const distancia = (a: Entidade, b: Entidade): number => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

const recusar = (p: Participante, motivo: MotivoDoMundo): void => {
  p.avisar({ tipo: 'recusa', motivo });
};

export function atenderChat(sala: SalaSocial, quem: Participante, acao: Extract<AcaoDoMundo, { a: 'chat' }>, limite: LimiteDoChat): void {
  const regras = sala.ctx.balance.mundo.chat;
  const texto = limparTexto(acao.texto, regras.maxTexto);
  if (!texto) {
    recusar(quem, 'chat_vazio');
    return;
  }
  if (!limite.permitir(quem.identidade, sala.agora)) {
    recusar(quem, 'chat_rapido');
    return;
  }
  if (acao.canal === 'grupo') {
    sala.pedirAoServidor({ a: 'chat', canal: 'grupo', texto });
    return;
  }
  const aviso: AvisoDoMundo = { tipo: 'chat', canal: acao.canal, de: quem.e.nome, texto };
  for (const p of sala.participantes()) if (acao.canal === 'regiao' || distancia(p.e, quem.e) <= regras.raioLocal) p.avisar(aviso);
}

function lados(t: Troca, quem: EntidadeId): { meu: Troca['a']; outro: Troca['a'] } {
  return t.a.id === quem ? { meu: t.a, outro: t.b } : { meu: t.b, outro: t.a };
}

/** O estado da troca como cada lado o vê. */
function avisarTroca(sala: SalaSocial, t: Troca, estado: 'convite' | 'aberta' | 'feita' | 'cancelada'): void {
  const ps = sala.participantes();
  for (const p of ps) {
    if (p.e.id !== t.a.id && p.e.id !== t.b.id) continue;
    // O convite só vai para quem foi convidado.
    if (estado === 'convite' && p.e.id !== t.b.id) continue;
    const { meu, outro } = lados(t, p.e.id);
    const outroE = ps.find((x) => x.e.id === outro.id)?.e;
    p.avisar({
      tipo: 'troca',
      estado,
      com: outroE?.nome ?? '',
      comId: outro.id,
      minha: ofertaVista(meu, p.e.bolsa),
      dele: ofertaVista(outro, outroE?.bolsa ?? null),
      confirmei: meu.confirmou,
      confirmou: outro.confirmou,
    });
  }
}

/** Os dois da troca, vivos e perto um do outro. */
function juntos(sala: SalaSocial, a: EntidadeId, b: EntidadeId): [Entidade, Entidade] | null {
  const ps = sala.participantes();
  const ea = ps.find((p) => p.e.id === a)?.e;
  const eb = ps.find((p) => p.e.id === b)?.e;
  if (!ea || !eb || !vivo(ea) || !vivo(eb) || distancia(ea, eb) > sala.ctx.balance.mundo.troca.raio) return null;
  return [ea, eb];
}

export function atenderTroca(sala: SalaSocial, quem: Participante, acao: Extract<AcaoDoMundo, { a: 'troca' }>, trocas: TrocasDaSala): void {
  const eu = quem.e.id;
  if (acao.op === 'propor') {
    const motivo = juntos(sala, eu, acao.alvo) ? trocas.propor(eu, acao.alvo) : 'longe';
    const t = trocas.de(eu);
    if (motivo || !t) recusar(quem, motivo ?? 'troca_invalida');
    else avisarTroca(sala, t, 'convite');
  } else if (acao.op === 'aceitar') {
    if (!juntos(sala, eu, acao.de)) {
      recusar(quem, 'longe');
      return;
    }
    const t = trocas.aceitar(eu, acao.de);
    if (typeof t === 'string') recusar(quem, t);
    else avisarTroca(sala, t, 'aberta');
  } else if (acao.op === 'oferecer') {
    const bolsa = quem.e.bolsa;
    const valida = bolsa !== null && acao.ouro <= bolsa.ouro && acao.itens.every((o) => (bolsa.mochila.find((m) => m.invId === o.invId)?.qtd ?? 0) >= o.qtd);
    const t = valida ? trocas.oferecer(eu, acao.itens, acao.ouro, sala.ctx.balance.mundo.troca.maxItens) : 'troca_invalida';
    if (typeof t === 'string') recusar(quem, t);
    else avisarTroca(sala, t, 'aberta');
  } else if (acao.op === 'confirmar') {
    const r = trocas.confirmar(eu);
    if (typeof r === 'string') {
      recusar(quem, r);
      return;
    }
    if (!r.pronta) {
      avisarTroca(sala, r.troca, 'aberta');
      return;
    }
    const par = juntos(sala, r.troca.a.id, r.troca.b.id);
    const motivo = par?.[0].bolsa && par[1].bolsa ? executarTroca(sala.ctx, r.troca, par[0].bolsa, par[1].bolsa) : 'longe';
    trocas.remover(r.troca);
    if (motivo) {
      for (const p of sala.participantes()) if (p.e.id === r.troca.a.id || p.e.id === r.troca.b.id) recusar(p, motivo);
      avisarTroca(sala, r.troca, 'cancelada');
    } else {
      avisarTroca(sala, r.troca, 'feita');
    }
  } else {
    cancelarTrocaDe(sala, eu, trocas);
  }
}

/** Desfaz a troca de quem pediu, saiu da sala ou morreu (os dois lados ficam sabendo). */
export function cancelarTrocaDe(sala: SalaSocial, id: EntidadeId, trocas: TrocasDaSala): void {
  const t = trocas.cancelar(id);
  if (t) avisarTroca(sala, t, 'cancelada');
}
