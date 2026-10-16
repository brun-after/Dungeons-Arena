// O certificado do personagem no navegador (marco 17, 15/10/2026, D-063): pedir ao servidor, guardar no slot e gravar
// de volta o personagem que a arena certificou. O jogo local nunca espera por isto: sem servidor ou sem rede, o slot
// segue como está e o certificado fica pendente.

import { aplicarRetratoNoSave, pedidoDoPersonagem, type PedidoDePersonagem } from '../coop/personagem';
import { contextoDaArena } from '../arena/contexto-arena';
import { lerCertificado, type Certificado, type MotivoCertificado } from '../integridade/certificado';
import { jogadorDoSave, type RegistroProgresso } from '../save/esquema';
import { carregarSlot, gravarRegistro } from './saves';
import { enderecoHttp } from './servidor';

const ESPERA_MS = 8000;

export type ResultadoDoCertificado = { ok: true; certificado: Certificado } | { ok: false; motivo: MotivoCertificado | 'sem_rede' | 'sem_personagem' };

/** O registro do slot com o personagem já identificado (personagens antigos ganham o `personagemId` aqui). */
export async function registroComIdentidade(slot: number): Promise<RegistroProgresso | null> {
  const r = await carregarSlot(slot).catch(() => null);
  if (!r || r === 'invalido') return null;
  const bolsa = jogadorDoSave(r.estado)?.bolsa;
  if (!bolsa) return null;
  if (!bolsa.personagemId) {
    bolsa.personagemId = crypto.randomUUID();
    await gravarRegistro(r);
  }
  return r;
}

export async function pedirCertificado(servidor: string, personagem: PedidoDePersonagem, anterior: Certificado | null): Promise<ResultadoDoCertificado> {
  try {
    const r = await fetch(`${enderecoHttp(servidor)}/certificar`, {
      method: 'POST',
      // text/plain: requisição simples, sem preflight de CORS.
      headers: { 'content-type': 'text/plain' },
      body: JSON.stringify({ personagem, anterior }),
      signal: AbortSignal.timeout(ESPERA_MS),
    });
    const corpo = (await r.json()) as { ok?: unknown; certificado?: unknown; motivo?: unknown };
    const certificado = lerCertificado(corpo.certificado);
    if (corpo.ok === true && certificado) return { ok: true, certificado };
    return { ok: false, motivo: typeof corpo.motivo === 'string' ? (corpo.motivo as MotivoCertificado) : 'ficha_invalida' };
  } catch {
    return { ok: false, motivo: 'sem_rede' };
  }
}

/** Certifica o personagem do slot como está agora e guarda o certificado no slot. */
export async function certificarSlot(servidor: string, slot: number): Promise<ResultadoDoCertificado> {
  const r = await registroComIdentidade(slot);
  const jogador = r ? jogadorDoSave(r.estado) : undefined;
  const personagem = jogador ? pedidoDoPersonagem(jogador) : null;
  if (!r || !personagem) return { ok: false, motivo: 'sem_personagem' };
  const resultado = await pedirCertificado(servidor, personagem, r.certificado);
  if (resultado.ok) await gravarRegistro({ ...r, certificado: resultado.certificado });
  return resultado;
}

/** Grava no slot o personagem que voltou da arena, com o certificado que o servidor emitiu na saída. */
export async function gravarCertificadoNoSlot(slot: number, certificado: Certificado): Promise<boolean> {
  const r = await carregarSlot(slot).catch(() => null);
  if (!r || r === 'invalido') return false;
  const novo = aplicarRetratoNoSave(r, certificado.retrato, contextoDaArena(), Date.now());
  await gravarRegistro({ ...novo, certificado });
  return true;
}
