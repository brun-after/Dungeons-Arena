// Marco 45 (16/11/2026, D-181): as dimensões (data/dimensoes.json) e a faixa de nível das criaturas. A fenda de uma
// região só traz quem cabe no nível sorteado: acima do pico, a vez passa a outra criatura da mesma dimensão que caiba
// (ou, sem nenhuma, a qualquer uma da lista da região que caiba). Puro.

import { ehObjeto, Leitor } from '../../core/validar';
import { MECANICAS_DE_CHEFE } from './tipos';
import type { PresetInimigo } from '../presets';

export interface Fenda {
  cor: string;
  borda: string;
  jeito: string;
}

export interface Dimensao {
  id: string;
  nome: string;
  epiteto: string;
  sotaque: string;
  cor: string;
  fenda: Fenda;
  regioes: readonly string[];
}

export function lerDimensoes(json: unknown): { dimensoes: Map<string, Dimensao>; erros: string[] } {
  const l = new Leitor('dimensoes.json');
  const dimensoes = new Map<string, Dimensao>();
  if (!ehObjeto(json)) return { dimensoes, erros: ['dimensoes.json: precisa ser um objeto'] };
  for (const item of l.lista(json, 'dimensoes')) {
    const o = l.objeto(item, 'dimensao');
    const f = l.objeto(o.fenda, 'fenda');
    const d: Dimensao = {
      id: l.texto(o, 'id'),
      nome: l.texto(o, 'nome'),
      epiteto: l.texto(o, 'epiteto'),
      sotaque: l.texto(o, 'sotaque'),
      cor: l.texto(o, 'cor'),
      fenda: { cor: l.texto(f, 'cor'), borda: l.texto(f, 'borda'), jeito: l.texto(f, 'jeito') },
      regioes: l.listaDeTextos(o, 'regioes'),
    };
    if (dimensoes.has(d.id)) l.erro(`id repetido "${d.id}"`);
    dimensoes.set(d.id, d);
  }
  return { dimensoes, erros: l.erros };
}

/** Os comuns e os chefes de cada dimensão (a ordem é a do inimigos.json). */
export function criaturasDaDimensao(presets: ReadonlyMap<string, PresetInimigo>, dimensao: string): { comuns: PresetInimigo[]; chefes: PresetInimigo[] } {
  const todos = [...presets.values()].filter((p) => p.dimensao === dimensao && p.invocacao === null && p.arquetipo !== 'boneco');
  return { comuns: todos.filter((p) => p.arquetipo !== 'boss'), chefes: todos.filter((p) => p.arquetipo === 'boss') };
}

export const cabeNoNivel = (p: Pick<PresetInimigo, 'nivelMin' | 'nivelPico'>, nivel: number): boolean =>
  nivel >= p.nivelMin && (p.nivelPico === null || nivel <= p.nivelPico);

/**
 * O preset que a fenda traz no nível: o pedido, se cabe; senão o primeiro da mesma dimensão que caiba, escolhido pela
 * sorte `s` (0 a 1); senão o primeiro da lista da região que caiba; senão o pedido mesmo (a região mal configurada
 * continua povoada).
 */
export function presetNoNivel(presets: ReadonlyMap<string, PresetInimigo>, pedido: string, nivel: number, lista: readonly string[], s: number): string {
  const p = presets.get(pedido);
  if (!p || cabeNoNivel(p, nivel)) return pedido;
  const irmaos = p.dimensao ? criaturasDaDimensao(presets, p.dimensao).comuns.filter((x) => cabeNoNivel(x, nivel)) : [];
  const escolhido = irmaos[Math.min(irmaos.length - 1, Math.floor(s * irmaos.length))];
  if (escolhido) return escolhido.id;
  const daRegiao = lista.find((id) => { const x = presets.get(id); return !!x && cabeNoNivel(x, nivel); });
  return daRegiao ?? pedido;
}

/** Cada dimensão traz 4 comuns (um deles fofo, com pico) e 2 chefes; toda criatura aponta para uma dimensão que existe. */
export function conferirDimensoes(dimensoes: ReadonlyMap<string, Dimensao>, presets: ReadonlyMap<string, PresetInimigo>): string[] {
  const erros: string[] = [];
  for (const p of presets.values()) if (p.dimensao !== null && !dimensoes.has(p.dimensao)) erros.push(`preset ${p.id}: dimensão desconhecida "${p.dimensao}"`);
  // Marco 45 (D-181): a mecânica do chefe existe e o objeto de arena dela também.
  for (const p of presets.values()) {
    if (!p.chefe) continue;
    if (!(MECANICAS_DE_CHEFE as readonly string[]).includes(p.chefe.mecanica)) erros.push(`preset ${p.id}: mecânica de chefe desconhecida "${p.chefe.mecanica}"`);
    if (p.chefe.ref && !presets.has(p.chefe.ref)) erros.push(`preset ${p.id}: objeto de arena desconhecido "${p.chefe.ref}"`);
  }
  // Os conteúdos de teste sem criaturas de Filo não precisam das nove dimensões completas.
  if (dimensoes.size === 0 || ![...presets.values()].some((p) => p.dimensao !== null)) return erros;
  for (const d of dimensoes.values()) {
    const { comuns, chefes } = criaturasDaDimensao(presets, d.id);
    if (comuns.length !== 4) erros.push(`dimensão ${d.id}: são 4 comuns (há ${String(comuns.length)})`);
    if (chefes.length !== 2) erros.push(`dimensão ${d.id}: são 2 chefes (há ${String(chefes.length)})`);
    if (!comuns.some((c) => c.nivelPico !== null && c.nivelPico <= 30)) erros.push(`dimensão ${d.id}: falta o fofo (pico até 30)`);
  }
  return erros;
}
