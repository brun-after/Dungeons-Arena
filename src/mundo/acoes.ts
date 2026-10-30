// As ações do Mundo (marco 30, 30/10/2026, D-129): o que o cliente pede à sala do Mundo fora dos comandos da
// simulação. Vão na mensagem `{ t: 'acaoMundo', acao }` e a sala responde por avisos (`{ t: 'mundo', aviso }`):
// - missões do quadro (aceitar, entregar, abandonar);
// - o banco (guardar e tirar itens e ouro, perto do banqueiro);
// - o chat (local, região, grupo) e a denúncia;
// - o grupo (convidar pelo nome, aceitar, sair, expulsar);
// - a troca direta (propor, aceitar, oferecer, confirmar, cancelar);
// - o mercado do reino (listar, anunciar, comprar, cancelar, receber as vendas).
// Aqui só a forma: as regras ficam em cada módulo. Puro.

import { ehObjeto } from '../core/validar';

export type CanalDoChat = 'local' | 'regiao' | 'grupo';
export const CANAIS_DO_CHAT: readonly CanalDoChat[] = ['local', 'regiao', 'grupo'];

export interface OfertaDeItem {
  invId: string;
  qtd: number;
}

export type AcaoDoMundo =
  | { a: 'missao'; op: 'aceitar' | 'entregar' | 'abandonar'; id: string }
  | { a: 'banco'; op: 'guardar' | 'tirar'; invId: string; qtd: number }
  | { a: 'bancoOuro'; op: 'guardar' | 'tirar'; valor: number }
  | { a: 'chat'; canal: CanalDoChat; texto: string }
  | { a: 'denunciar'; nome: string; motivo: string }
  | { a: 'grupo'; op: 'convidar' | 'expulsar'; nome: string }
  | { a: 'grupo'; op: 'aceitar'; grupo: string }
  | { a: 'grupo'; op: 'sair' }
  | { a: 'troca'; op: 'propor'; alvo: string }
  | { a: 'troca'; op: 'aceitar'; de: string }
  | { a: 'troca'; op: 'oferecer'; itens: OfertaDeItem[]; ouro: number }
  | { a: 'troca'; op: 'confirmar' | 'cancelar' }
  | { a: 'mercado'; op: 'listar'; pagina: number; busca: string }
  | { a: 'mercado'; op: 'anunciar'; invId: string; qtd: number; preco: number }
  /** Comprar leva o preço que o cliente viu: a sala reserva esse ouro e o servidor recusa se o anúncio mudou. */
  | { a: 'mercado'; op: 'comprar'; id: string; preco: number }
  | { a: 'mercado'; op: 'cancelar'; id: string }
  | { a: 'mercado'; op: 'receber' };

const MAX_ID = 64;
const MAX_TEXTO = 500;
const MAX_QTD = 9999;
const MAX_OURO = 100_000_000;
const MAX_OFERTA = 32;

const id = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= MAX_ID;
const texto = (v: unknown): v is string => typeof v === 'string' && v.length <= MAX_TEXTO;
const inteiro = (v: unknown, min: number, max: number): v is number => typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;

function lerOferta(v: unknown): OfertaDeItem[] | null {
  if (!Array.isArray(v) || v.length > MAX_OFERTA) return null;
  const itens: OfertaDeItem[] = [];
  for (const x of v) {
    if (!ehObjeto(x) || !id(x.invId) || !inteiro(x.qtd, 1, MAX_QTD)) return null;
    itens.push({ invId: x.invId, qtd: x.qtd });
  }
  return itens;
}

const OPS_MISSAO = ['aceitar', 'entregar', 'abandonar'] as const;
const OPS_GUARDAR = ['guardar', 'tirar'] as const;
const umDe = <T extends string>(lista: readonly T[], v: unknown): v is T => typeof v === 'string' && (lista as readonly string[]).includes(v);

/** A ação bem formada, ou null (a sala responde `malformada`, como os outros pedidos). */
export function lerAcaoDoMundo(v: unknown): AcaoDoMundo | null {
  if (!ehObjeto(v)) return null;
  switch (v.a) {
    case 'missao':
      return umDe(OPS_MISSAO, v.op) && id(v.id) ? { a: 'missao', op: v.op, id: v.id } : null;
    case 'banco':
      return umDe(OPS_GUARDAR, v.op) && id(v.invId) && inteiro(v.qtd, 1, MAX_QTD) ? { a: 'banco', op: v.op, invId: v.invId, qtd: v.qtd } : null;
    case 'bancoOuro':
      return umDe(OPS_GUARDAR, v.op) && inteiro(v.valor, 1, MAX_OURO) ? { a: 'bancoOuro', op: v.op, valor: v.valor } : null;
    case 'chat':
      return umDe(CANAIS_DO_CHAT, v.canal) && texto(v.texto) ? { a: 'chat', canal: v.canal, texto: v.texto } : null;
    case 'denunciar':
      return id(v.nome) && texto(v.motivo) ? { a: 'denunciar', nome: v.nome, motivo: v.motivo } : null;
    case 'grupo':
      if ((v.op === 'convidar' || v.op === 'expulsar') && id(v.nome)) return { a: 'grupo', op: v.op, nome: v.nome };
      if (v.op === 'aceitar' && id(v.grupo)) return { a: 'grupo', op: 'aceitar', grupo: v.grupo };
      return v.op === 'sair' ? { a: 'grupo', op: 'sair' } : null;
    case 'troca': {
      if (v.op === 'propor' && id(v.alvo)) return { a: 'troca', op: 'propor', alvo: v.alvo };
      if (v.op === 'aceitar' && id(v.de)) return { a: 'troca', op: 'aceitar', de: v.de };
      if (v.op === 'oferecer') {
        const itens = lerOferta(v.itens);
        return itens && inteiro(v.ouro, 0, MAX_OURO) ? { a: 'troca', op: 'oferecer', itens, ouro: v.ouro } : null;
      }
      return v.op === 'confirmar' || v.op === 'cancelar' ? { a: 'troca', op: v.op } : null;
    }
    case 'mercado':
      if (v.op === 'listar' && inteiro(v.pagina, 0, 1000) && typeof v.busca === 'string' && v.busca.length <= MAX_ID) return { a: 'mercado', op: 'listar', pagina: v.pagina, busca: v.busca };
      if (v.op === 'anunciar' && id(v.invId) && inteiro(v.qtd, 1, MAX_QTD) && inteiro(v.preco, 1, MAX_OURO)) return { a: 'mercado', op: 'anunciar', invId: v.invId, qtd: v.qtd, preco: v.preco };
      if (v.op === 'comprar' && id(v.id) && inteiro(v.preco, 1, MAX_OURO)) return { a: 'mercado', op: 'comprar', id: v.id, preco: v.preco };
      if (v.op === 'cancelar' && id(v.id)) return { a: 'mercado', op: 'cancelar', id: v.id };
      return v.op === 'receber' ? { a: 'mercado', op: 'receber' } : null;
    default:
      return null;
  }
}
