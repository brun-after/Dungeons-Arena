// O condutor do Mundo (marco 53, 22/11/2026, D-203): anda sozinho até um ponto escolhido no mapa ou atrás de um
// companheiro do grupo. O `irPara` da simulação vai no máximo uns 60 passos; o condutor acha o caminho inteiro na fase
// (navegacao.ts, no cliente) e manda um `irPara` para um trecho à frente de cada vez, de novo quando o personagem
// chega perto do fim do trecho ou para. Qualquer movimento do jogador (teclas, clique, joystick) o desliga.
// Fica no cliente: o servidor só vê `irPara` comuns, que já confere.

import type { Comando } from '../core/comandos';
import type { EstadoJogo } from '../core/estado';
import type { Entidade } from '../entities/entidade';
import { caminho } from '../world/navegacao';
import { passavel, type Fase } from '../world/fase';
import { temTronco } from '../world/troncos';

/** Até onde o condutor procura o caminho inteiro (passos). */
const PASSOS_MAX = 4000;
/** O trecho que vai em cada `irPara` (menos que o limite de 60 da simulação, para sobrar folga). */
const TRECHO = 40;
/** Seguindo alguém: a distância em que o personagem para atrás dele (células). */
const PERTO_DO_COMPANHEIRO = 2.5;
/** Indo a um ponto: chegou. */
const CHEGOU = 1.2;
/** Reavalia a cada tanto (ms). */
const INTERVALO_MS = 250;

export type Conducao = { tipo: 'ponto'; x: number; y: number } | { tipo: 'seguir'; nome: string };

export interface Condutor {
  /** Começa a conduzir (null para). */
  conduzir: (c: Conducao | null) => void;
  atual: () => Conducao | null;
  /** O comando do jogador passou por aqui: o que é movimento desliga o condutor. */
  comandoDoJogador: (cmd: Comando) => void;
  /** A cada quadro. */
  atualizar: (estado: EstadoJogo | null, eu: Entidade | undefined, agoraMs: number) => void;
}

/** O ponto marcado na água, no muro ou numa árvore: a célula livre mais perto dele (até 6 células). */
export function celulaLivrePerto(fase: Fase, x: number, y: number): { x: number; y: number } | null {
  for (let r = 0; r <= 6; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        if (passavel(fase, x + dx, y + dy) && !temTronco(fase, x + dx, y + dy)) return { x: x + dx, y: y + dy };
      }
    }
  }
  return null;
}

/** O que, vindo do jogador, desliga o condutor: andar, clicar para andar, o movimento da classe. */
export function comandoMoveOJogador(cmd: Comando): boolean {
  return (cmd.t === 'mover' && cmd.dir !== 'parado') || cmd.t === 'irPara' || cmd.t === 'movimentoClasse';
}

export function criarCondutor(fase: () => Fase, emitir: (cmd: Comando) => void, aoMudar: (c: Conducao | null) => void = () => undefined): Condutor {
  let atual: Conducao | null = null;
  let proximoMs = 0;
  /** O fim do trecho mandado, e para onde (o companheiro anda; o caminho é refeito quando ele se afasta). */
  let trecho: { x: number; y: number; alvoX: number; alvoY: number } | null = null;

  const parar = () => {
    if (!atual) return;
    atual = null;
    trecho = null;
    aoMudar(null);
  };

  return {
    conduzir: (c) => {
      atual = c;
      trecho = null;
      proximoMs = 0;
      aoMudar(c);
    },
    atual: () => atual,
    comandoDoJogador: (cmd) => {
      if (comandoMoveOJogador(cmd)) parar();
    },
    atualizar: (estado, eu, agoraMs) => {
      if (!atual || !estado || !eu || agoraMs < proximoMs) return;
      proximoMs = agoraMs + INTERVALO_MS;
      if (eu.morto) {
        parar();
        return;
      }
      let alvo: { x: number; y: number };
      let perto: number;
      if (atual.tipo === 'seguir') {
        const nome = atual.nome;
        const outro = estado.entidades.find((e) => e.controlador !== 'ia' && e.nome === nome && e.id !== eu.id && !e.morto);
        // Ele saiu da região (ou caiu): espera parado, sem desligar (volta a seguir se ele reaparecer aqui).
        if (!outro) return;
        alvo = { x: outro.x, y: outro.y };
        perto = PERTO_DO_COMPANHEIRO;
      } else {
        alvo = { x: atual.x, y: atual.y };
        perto = CHEGOU;
      }
      const distancia = Math.hypot(alvo.x - eu.x, alvo.y - eu.y);
      if (distancia <= perto) {
        if (atual.tipo === 'ponto') parar();
        trecho = null;
        return;
      }
      const parado = eu.caminho.length === 0 && eu.direcao === 'parado';
      const pertoDoFim = trecho ? Math.hypot(trecho.x - eu.x, trecho.y - eu.y) <= 4 : true;
      const alvoAndou = trecho ? Math.hypot(trecho.alvoX - alvo.x, trecho.alvoY - alvo.y) > 3 : true;
      if (!parado && !pertoDoFim && !alvoAndou) return;
      const origem = { x: Math.round(eu.x), y: Math.round(eu.y) };
      const destino = celulaLivrePerto(fase(), Math.round(alvo.x), Math.round(alvo.y));
      const r = destino ? caminho(fase(), origem, destino, PASSOS_MAX) : { passos: [] };
      if (r.passos.length === 0) {
        // Sem caminho (fechado, outra margem do rio): o ponto escolhido no mapa desiste; seguir espera.
        if (atual.tipo === 'ponto') parar();
        return;
      }
      // Seguindo, o último passo é a célula do companheiro: para um pouco antes dele.
      const passos = atual.tipo === 'seguir' ? r.passos.slice(0, Math.max(1, r.passos.length - 2)) : r.passos;
      const fim = passos[Math.min(passos.length, TRECHO) - 1];
      if (!fim) return;
      trecho = { x: fim.x, y: fim.y, alvoX: alvo.x, alvoY: alvo.y };
      emitir({ t: 'irPara', x: fim.x, y: fim.y });
    },
  };
}
