import type { Celula } from '../core/comandos';
import type { Fase } from '../world/fase';
import { estruturaDoDestino, LADOS, portaDa, territorioDoLugar, vizinha, type Reino } from './reino';

export interface DestinoNoMapa { lugar: string; nome: string; ponto?: Celula }
export interface EtapaDoMapa { ponto: Celula | null; nome: string; lugar?: string; tipo: 'destino' | 'passagem' | 'sair' | 'portal' | 'chegou' }

/** Próxima passagem real entre regiões; nunca corta por uma lacuna no atlas. */
export function proximaEtapa(reino: Reino, lugar: string, destino: DestinoNoMapa, fase: Fase): EtapaDoMapa | null {
  if (lugar === destino.lugar) {
    return { ponto: destino.ponto ?? null, nome: destino.nome, tipo: destino.ponto ? 'destino' : 'chegou' };
  }
  if (!lugar.startsWith('regiao:')) return { ponto: fase.portaRetorno ?? null, nome: '', tipo: 'sair' };
  const atual = reino.regioes.find(r => lugar === `regiao:${r.id}`);
  const estrutura = estruturaDoDestino(reino, destino.lugar.split(':')[1] ?? '');
  const alvo = reino.regioes.find(r => destino.lugar === `regiao:${r.id}`) ?? estrutura?.regiao;
  if (!atual || !alvo) return null;
  if (alvo.id === atual.id && estrutura) return { ponto: portaDa(estrutura.estrutura).frente, nome: destino.nome, tipo: 'destino' };
  if (territorioDoLugar(reino, atual.id).id !== territorioDoLugar(reino, alvo.id).id) return { ponto: null, nome: territorioDoLugar(reino, alvo.id).nome, tipo: 'portal' };
  const fila = [{ r: atual, primeiro: atual }], vistos = new Set([atual.id]);
  for (const { r, primeiro } of fila) for (const lado of LADOS) {
    const v = vizinha(reino, r, lado);
    if (!v || vistos.has(v.id)) continue;
    const passo = r.id === atual.id ? v : primeiro;
    if (v.id === alvo.id) {
      const dx = passo.gx - atual.gx, dy = passo.gy - atual.gy;
      return { tipo: 'passagem', nome: passo.nome, lugar: `regiao:${passo.id}`, ponto: { x: dx < 0 ? 0 : dx > 0 ? fase.largura - 1 : Math.floor(fase.largura / 2), y: dy < 0 ? 0 : dy > 0 ? fase.altura - 1 : Math.floor(fase.altura / 2) } };
    }
    vistos.add(v.id); fila.push({ r: v, primeiro: passo });
  }
  return null;
}

/** Vetor do mundo em direção de tela na projeção isométrica 2:1. */
export function rumoNaTela(de: Celula, para: Celula): number {
  const dx = para.x - de.x, dy = para.y - de.y;
  return Math.atan2((dx + dy) / 2, dx - dy);
}

export function direcaoGeografica(de: Celula, para: Celula): string {
  const direcoes = ['L', 'SE', 'S', 'SO', 'O', 'NO', 'N', 'NE'];
  const i = (Math.round(Math.atan2(para.y - de.y, para.x - de.x) / (Math.PI / 4)) + 8) % 8;
  return direcoes[i] ?? 'N';
}
