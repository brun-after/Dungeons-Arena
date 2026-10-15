// Protocolo da arena (§3.3, §3.6): mensagens tipadas entre cliente e sala, e a validação de tudo
// o que chega do cliente. Estado recebido de cliente nunca é confiado: o servidor deriva o jogador
// da sessão e rejeita, com motivo, mensagens grandes, malformadas ou com números não finitos.

import type { Celula, Comando, ComandoEmpacotado, Dir8 } from '../core/comandos';
import { FONTES_OFICIAIS } from '../core/conteudo';
import { hash53, serializarCanonico } from '../core/digest';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import type { Bolsa } from '../entities/entidade';
import { ehDificuldade } from '../modos/dificuldade';
import type { RefFase } from '../save/esquema';
import { ehObjeto, type Objeto } from '../core/validar';
import { SLOTS_DE_EQUIPAMENTO, type Slot } from '../modos/modo';
import { NOMES_ATRIBUTOS, type NomeAtributo } from '../progression/itens';
import type { PreviaDeFicha } from './ficha-sessao';
import type { PatchDeEstado } from './patches';

/** Teto de uma mensagem de comando (§3.6). Medido em unidades de texto, o que é conservador. */
export const MAX_BYTES_MENSAGEM = 16 * 1024;
const MAX_ID = 64;
const MAX_COORDENADA = 10_000;

export type MensagemCliente =
  | { t: 'entrar'; nome: string; pedidoFicha: unknown; versaoConteudo: string }
  | { t: 'cmd'; pacote: ComandoEmpacotado }
  | { t: 'ping'; id: number; enviadoMs: number }
  /** O cliente perdeu a sequência de patches: pede o estado completo. */
  | { t: 'ressincronizar' };

export type MotivoRejeicao =
  | 'grande_demais'
  | 'json_invalido'
  | 'malformada'
  | 'sessao'
  | 'epoca'
  | 'taxa'
  | 'fila'
  | 'nao_entrou'
  /** Marco 15: o modo não aceita este comando pela rede (ou só o anfitrião pode). */
  | 'nao_permitido';

export type MotivoErro = 'sala_cheia' | 'versao_conteudo' | 'ja_entrou' | 'personagem_invalido';

export type MensagemServidor =
  | {
      t: 'bemVindo';
      sessaoId: string;
      entidadeId: string;
      epocaSala: number;
      tick: number;
      faseId: string;
      modoId: string;
      previa: PreviaDeFicha;
      estado: EstadoJogo;
    }
  | { t: 'estado'; tick: number; epocaSala: number; ackSeq: number; estado: EstadoJogo }
  | { t: 'patch'; tick: number; epocaSala: number; ackSeq: number; patch: PatchDeEstado }
  | { t: 'eventos'; tick: number; eventos: EventoSimulacao[] }
  | { t: 'pong'; id: number; enviadoMs: number; tickServidor: number }
  | { t: 'rejeitado'; seq: number | null; motivo: MotivoRejeicao }
  /** Marco 15 (cooperativo): só para a própria sessão — a bolsa (mochila, equipamento, ouro, pontos, habilidades). */
  | { t: 'privado'; bolsa: Bolsa | null; anfitriao: boolean }
  /** Marco 15 (cooperativo): o grupo chegou à saída; a sala montou a fase seguinte (época nova). */
  | { t: 'novaFase'; faseRef: RefFase; nome: string; epocaSala: number; tick: number; ackSeq: number; estado: EstadoJogo }
  /** Marco 15 (cooperativo): a saída da última fase não leva a lugar nenhum (só depois de uma aventura). */
  | { t: 'fimDaCampanha' }
  | { t: 'erro'; motivo: MotivoErro };

/** Versão do conteúdo oficial: cliente e sala precisam concordar (§3.6, "versão/hash"). */
export function versaoDoConteudo(): string {
  return hash53(serializarCanonico(FONTES_OFICIAIS));
}

const DIRECOES: readonly (Dir8 | 'parado')[] = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO', 'parado'];

const finito = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const inteiro = (v: unknown): v is number => finito(v) && Number.isInteger(v);
const coordenada = (v: unknown): v is number => inteiro(v) && Math.abs(v) <= MAX_COORDENADA;
const id = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= MAX_ID;

const ehSlot = (v: unknown): v is Slot => typeof v === 'string' && (SLOTS_DE_EQUIPAMENTO as readonly string[]).includes(v);
const ehAtributo = (v: unknown): v is NomeAtributo => typeof v === 'string' && (NOMES_ATRIBUTOS as readonly string[]).includes(v);

function lerCelula(v: unknown): Celula | null {
  if (!ehObjeto(v) || !coordenada(v.x) || !coordenada(v.y)) return null;
  return { x: v.x, y: v.y };
}

/** Valida um comando campo a campo e devolve uma cópia limpa, sem campos extras. */
export function lerComando(v: unknown): Comando | null {
  if (!ehObjeto(v) || typeof v.t !== 'string') return null;
  switch (v.t) {
    case 'mover':
      return typeof v.dir === 'string' && (DIRECOES as readonly string[]).includes(v.dir) ? { t: 'mover', dir: v.dir as Dir8 | 'parado' } : null;
    case 'irPara':
      return coordenada(v.x) && coordenada(v.y) ? { t: 'irPara', x: v.x, y: v.y } : null;
    case 'usarHabilidade': {
      if (!id(v.id)) return null;
      if (v.alvo === undefined) return { t: 'usarHabilidade', id: v.id };
      const alvo = id(v.alvo) ? v.alvo : lerCelula(v.alvo);
      return alvo ? { t: 'usarHabilidade', id: v.id, alvo } : null;
    }
    case 'ataqueBasico':
      if (v.alvo === undefined) return { t: 'ataqueBasico' };
      return id(v.alvo) ? { t: 'ataqueBasico', alvo: v.alvo } : null;
    case 'selecionarAlvo':
      return v.alvo === null || id(v.alvo) ? { t: 'selecionarAlvo', alvo: v.alvo } : null;
    case 'usarItem':
      return id(v.invId) ? { t: 'usarItem', invId: v.invId } : null;
    case 'equipar':
      return id(v.invId) && ehSlot(v.slot) ? { t: 'equipar', invId: v.invId, slot: v.slot } : null;
    case 'desequipar':
      return ehSlot(v.slot) ? { t: 'desequipar', slot: v.slot } : null;
    case 'distribuirPonto':
      return ehAtributo(v.atributo) ? { t: 'distribuirPonto', atributo: v.atributo } : null;
    case 'interagir':
      return { t: 'interagir' };
    // Marco 9A: a arena não tem economia (sem bolsa), mas o protocolo aceita a forma e a simulação recusa.
    case 'comprar':
      return id(v.itemId) ? { t: 'comprar', itemId: v.itemId } : null;
    case 'vender':
      return id(v.invId) ? { t: 'vender', invId: v.invId } : null;
    case 'fecharLoja':
      return { t: 'fecharLoja' };
    case 'dispensar':
      return { t: 'dispensar' };
    case 'descansar':
      return v.tipo === 'curto' || v.tipo === 'longo' ? { t: 'descansar', tipo: v.tipo } : null;
    case 'moverItem':
      return id(v.invId) && inteiro(v.posicao) && v.posicao >= 0 && v.posicao < 1000 ? { t: 'moverItem', invId: v.invId, posicao: v.posicao } : null;
    // Marco 15: os comandos de personagem; quem decide se valem é o modo da sala (`comandosDeRede`).
    case 'subirRank':
      if (!id(v.id)) return null;
      if (v.caminho === undefined) return { t: 'subirRank', id: v.id };
      return id(v.caminho) ? { t: 'subirRank', id: v.id, caminho: v.caminho } : null;
    case 'equiparHabilidade':
      return (v.id === null || id(v.id)) && inteiro(v.slot) && v.slot >= 0 && v.slot < 16 ? { t: 'equiparHabilidade', id: v.id, slot: v.slot } : null;
    case 'definirDificuldade':
      return ehDificuldade(v.nivel) ? { t: 'definirDificuldade', nivel: v.nivel } : null;
    default:
      return null;
  }
}

function lerPacote(o: Objeto): ComandoEmpacotado | null {
  const cmd = lerComando(o.cmd);
  if (!cmd || !id(o.sessaoId) || !inteiro(o.epocaSala) || !inteiro(o.seq) || o.seq < 1 || !inteiro(o.tickCliente) || o.tickCliente < 0) {
    return null;
  }
  return { sessaoId: o.sessaoId, epocaSala: o.epocaSala, seq: o.seq, tickCliente: o.tickCliente, cmd };
}

export type LeituraCliente = { ok: true; msg: MensagemCliente } | { ok: false; motivo: MotivoRejeicao; seq: number | null };

export function lerMensagemCliente(texto: string): LeituraCliente {
  if (texto.length > MAX_BYTES_MENSAGEM) return { ok: false, motivo: 'grande_demais', seq: null };
  let bruto: unknown;
  try {
    bruto = JSON.parse(texto);
  } catch {
    return { ok: false, motivo: 'json_invalido', seq: null };
  }
  const malformada = (seq: number | null = null): LeituraCliente => ({ ok: false, motivo: 'malformada', seq });
  if (!ehObjeto(bruto)) return malformada();
  switch (bruto.t) {
    case 'entrar':
      if (typeof bruto.nome !== 'string' || typeof bruto.versaoConteudo !== 'string') return malformada();
      return {
        ok: true,
        msg: { t: 'entrar', nome: bruto.nome.slice(0, 24), pedidoFicha: bruto.pedidoFicha, versaoConteudo: bruto.versaoConteudo },
      };
    case 'cmd': {
      const pacote = ehObjeto(bruto.pacote) ? lerPacote(bruto.pacote) : null;
      if (!pacote) {
        const seq = ehObjeto(bruto.pacote) && inteiro(bruto.pacote.seq) ? bruto.pacote.seq : null;
        return malformada(seq);
      }
      return { ok: true, msg: { t: 'cmd', pacote } };
    }
    case 'ping':
      return inteiro(bruto.id) && finito(bruto.enviadoMs) ? { ok: true, msg: { t: 'ping', id: bruto.id, enviadoMs: bruto.enviadoMs } } : malformada();
    case 'ressincronizar':
      return { ok: true, msg: { t: 'ressincronizar' } };
    default:
      return malformada();
  }
}
