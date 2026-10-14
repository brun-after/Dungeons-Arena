// Validação das portas da fase (§2.1, §3.10). Marco 10A-1 (14/10/2026), D-052.
// Forma: porta de saída `{x, y, tranca, chave?, bossIndice?}` e portas internas
// `{numero, nome, a, b}`. Jogabilidade: a saída fica numa célula `S`, a chave é um item do tipo
// `chave`, o boss existe na lista de inimigos e os extremos das portas internas são passáveis.

import type { Celula } from '../core/comandos';
import { tipoEm, passavel, type Fase, type PortaInterna, type PortaSaida } from './fase';
import type { ErroFase, ItensConhecidos } from './validacao-fase';

const TRANCAS = ['livre', 'chave', 'boss'] as const;
const MAX_PORTAS = 20;

function ehObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

const inteiro = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);

function celula(v: unknown): Celula | null {
  return ehObjeto(v) && inteiro(v.x) && inteiro(v.y) ? { x: v.x, y: v.y } : null;
}

/** Porta de saída na forma certa (ou undefined se ausente); erros vão para a lista. */
export function lerPortaSaida(v: unknown, erros: ErroFase[], itens: ItensConhecidos | undefined): PortaSaida | undefined {
  if (v === undefined) return undefined;
  if (!ehObjeto(v) || !inteiro(v.x) || !inteiro(v.y) || typeof v.tranca !== 'string' || !(TRANCAS as readonly string[]).includes(v.tranca)) {
    erros.push({ mensagem: 'portaSaida precisa de x e y inteiros e tranca livre|chave|boss' });
    return undefined;
  }
  const porta: PortaSaida = { x: v.x, y: v.y, tranca: v.tranca as PortaSaida['tranca'] };
  if (porta.tranca === 'chave') {
    if (typeof v.chave !== 'string' || v.chave === '') {
      erros.push({ mensagem: 'portaSaida com tranca chave precisa do id da chave', x: v.x, y: v.y });
      return undefined;
    }
    if (itens && itens.get(v.chave)?.tipo !== 'chave') erros.push({ mensagem: `chave da saída precisa ser um item do tipo chave ("${v.chave}")`, x: v.x, y: v.y });
    porta.chave = v.chave;
  }
  if (porta.tranca === 'boss') {
    if (!inteiro(v.bossIndice) || v.bossIndice < 0) {
      erros.push({ mensagem: 'portaSaida com tranca boss precisa de bossIndice (índice do inimigo)', x: v.x, y: v.y });
      return undefined;
    }
    porta.bossIndice = v.bossIndice;
  }
  return porta;
}

export function lerPortasInternas(v: unknown, erros: ErroFase[]): PortaInterna[] | undefined {
  if (v === undefined) return undefined;
  if (!Array.isArray(v) || v.length > MAX_PORTAS) {
    erros.push({ mensagem: `portasInternas precisa ser uma lista de até ${MAX_PORTAS} pares` });
    return undefined;
  }
  const lista: PortaInterna[] = [];
  for (const p of v) {
    const a = ehObjeto(p) ? celula(p.a) : null;
    const b = ehObjeto(p) ? celula(p.b) : null;
    if (!ehObjeto(p) || !inteiro(p.numero) || typeof p.nome !== 'string' || !a || !b) {
      erros.push({ mensagem: 'porta interna precisa de numero, nome e extremos a e b com x e y inteiros' });
      continue;
    }
    lista.push({ numero: p.numero, nome: p.nome, a, b });
  }
  return lista;
}

/** Regras que dependem do terreno, dos inimigos e do alcance a partir do spawn. */
export function validarPortasNaFase(fase: Fase, alcance: Uint8Array, erros: ErroFase[]): void {
  const s = fase.portaSaida;
  if (s) {
    if (tipoEm(fase, s.x, s.y) !== 'saida') erros.push({ mensagem: 'a porta de saída precisa ficar numa célula S', x: s.x, y: s.y });
    if (s.tranca === 'boss' && (s.bossIndice === undefined || !fase.inimigos[s.bossIndice])) {
      erros.push({ mensagem: 'bossIndice da saída não aponta um inimigo da fase', x: s.x, y: s.y });
    }
  }
  const extremos = new Set<string>();
  for (const p of fase.portasInternas) {
    for (const c of [p.a, p.b]) {
      const chave = `${c.x},${c.y}`;
      if (!passavel(fase, c.x, c.y) || tipoEm(fase, c.x, c.y) === 'saida') erros.push({ mensagem: `porta interna ${p.numero} em célula não passável`, x: c.x, y: c.y });
      else if (alcance[c.y * fase.largura + c.x] !== 1) erros.push({ mensagem: `porta interna ${p.numero} inalcançável a partir do spawn`, x: c.x, y: c.y });
      if (extremos.has(chave)) erros.push({ mensagem: 'duas portas internas na mesma célula', x: c.x, y: c.y });
      extremos.add(chave);
    }
  }
}
