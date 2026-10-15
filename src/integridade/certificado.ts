// Certificado do personagem (marco 17, 15/10/2026, D-063). Puro: a forma, a leitura e a conta de crescimento.
// Quem assina é só o servidor (HMAC com a chave que nunca sai dele, server/certificacao.ts). O cliente guarda o
// certificado junto do save e o manda ao entrar na arena: lá, a ficha inteira só vale com a assinatura certa e o
// personagem igual ao retrato. Editar o arquivo muda o retrato; o personagem segue jogável local e no grupo, mas a
// arena o recorta como uma ficha de treino.
//
// Crescimento plausível: entre um certificado e o seguinte, o XP, o ouro e os itens novos não passam do teto por
// minuto de jogo (balance.integridade, com folga), contado pelo relógio do servidor. Personagem sem certificado
// anterior só é certificado até `nivelSemHistorico`.

import type { Balance } from '../core/contexto';
import { serializarCanonico } from '../core/digest';
import { ehObjeto } from '../core/validar';
import type { PedidoDePersonagem } from '../coop/personagem';
import { xpParaProximo } from '../progression/nivel';

export interface Certificado {
  /** O personagem como foi certificado (nome, nível, XP e bolsa). */
  retrato: PedidoDePersonagem;
  /** Relógio do servidor, em ms desde a época Unix. */
  emitidoEm: number;
  /** HMAC-SHA256 em hexadecimal de `conteudoAssinado(retrato, emitidoEm)`. */
  assinatura: string;
}

/** O que a assinatura cobre (o mesmo texto no servidor que assina e no que confere). */
export function conteudoAssinado(retrato: unknown, emitidoEm: number): string {
  return serializarCanonico({ retrato, emitidoEm });
}

/** O personagem é exatamente o do retrato? (comparação canônica: a ordem das chaves não importa) */
export function mesmoPersonagem(a: unknown, b: unknown): boolean {
  return serializarCanonico(a) === serializarCanonico(b);
}

export function lerCertificado(v: unknown): Certificado | null {
  if (!ehObjeto(v) || !ehObjeto(v.retrato) || typeof v.emitidoEm !== 'number' || !Number.isFinite(v.emitidoEm)) return null;
  if (typeof v.assinatura !== 'string' || !/^[0-9a-f]{64}$/.test(v.assinatura)) return null;
  // A forma do retrato é a do pedido de personagem; quem confere a ficha é `conferirPersonagem`.
  return { retrato: v.retrato as unknown as PedidoDePersonagem, emitidoEm: v.emitidoEm, assinatura: v.assinatura };
}

/** XP acumulado desde o nível 1 (para comparar personagens em níveis diferentes). */
export function xpTotal(nivel: number, xp: number, regras: Balance['xp']): number {
  let total = xp;
  for (let n = 1; n < nivel; n++) total += xpParaProximo(n, regras);
  return total;
}

/** Quantas unidades de cada item a bolsa tem (mochila e equipamento). */
function contagemDeItens(p: PedidoDePersonagem): Map<string, number> {
  const m = new Map<string, number>();
  const somar = (itemId: string, qtd: number) => m.set(itemId, (m.get(itemId) ?? 0) + qtd);
  for (const i of p.bolsa.mochila) somar(i.itemId, i.qtd);
  for (const i of Object.values(p.bolsa.equipamento)) if (i) somar(i.itemId, i.qtd);
  return m;
}

export type MotivoCertificado = 'ficha_invalida' | 'sem_id' | 'sem_historico' | 'outro_personagem' | 'xp_demais' | 'ouro_demais' | 'itens_demais';

export type AvaliacaoCrescimento = { ok: true } | { ok: false; motivo: MotivoCertificado };

/**
 * O crescimento de `anterior` para `novo` cabe em `minutos` de jogo? `valorDeVenda` diz quanto a loja paga por um
 * item (o ouro de vender o que sumiu da bolsa conta como ganho legítimo).
 */
export function avaliarCrescimento(
  anterior: PedidoDePersonagem,
  novo: PedidoDePersonagem,
  minutos: number,
  balance: Balance,
  valorDeVenda: (itemId: string) => number,
): AvaliacaoCrescimento {
  const r = balance.integridade;
  if (anterior.bolsa.personagemId !== novo.bolsa.personagemId || anterior.bolsa.classeId !== novo.bolsa.classeId) {
    return { ok: false, motivo: 'outro_personagem' };
  }
  const ganhoXp = xpTotal(novo.nivel, novo.xp, balance.xp) - xpTotal(anterior.nivel, anterior.xp, balance.xp);
  const porMinuto = r.xpPorMinutoBase * (1 + (r.xpPorMinutoPorNivelPct / 100) * (novo.nivel - 1));
  if (ganhoXp > porMinuto * minutos + r.folgaXp) return { ok: false, motivo: 'xp_demais' };

  const antes = contagemDeItens(anterior);
  const depois = contagemDeItens(novo);
  let novos = 0;
  let vendidos = 0;
  for (const [id, q] of depois) novos += Math.max(0, q - (antes.get(id) ?? 0));
  for (const [id, q] of antes) vendidos += Math.max(0, q - (depois.get(id) ?? 0)) * valorDeVenda(id);
  if (novos > r.itensPorMinuto * minutos + r.folgaItens) return { ok: false, motivo: 'itens_demais' };

  const ganhoOuro = novo.bolsa.ouro - anterior.bolsa.ouro;
  if (ganhoOuro > r.ouroPorMinuto * minutos + r.folgaOuro + vendidos) return { ok: false, motivo: 'ouro_demais' };
  return { ok: true };
}

/** Minutos de jogo que contam entre dois certificados (relógio do servidor, com teto). */
export function minutosEntre(emitidoEm: number, agora: number, balance: Balance): number {
  const minutos = Math.max(0, (agora - emitidoEm) / 60_000);
  return Math.min(balance.integridade.minutosMaxPorCertificado, minutos);
}
