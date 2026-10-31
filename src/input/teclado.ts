// Teclado (§2.3): teclas mantidas viram estado direcional. Emite só início, mudança e parada;
// a repetição automática do sistema operacional não gera comandos. Marco 26 (D-105): as 8 direções de tela vão à
// fase pela inversa da projeção (no isométrico, a seta para a direita anda para a direita na tela). D-107: com EWAS
// nas Configurações, as teclas seguem a inclinação do isométrico e interagir vai para o D (input/teclas.ts).

import { PARADO, type Rumo } from './direcao';
import { ehTeclaDeMovimento, rumoDasTeclas, teclaInteragir, type TeclasMovimento } from './teclas';

export interface OpcoesTeclado {
  aoMudarDirecao: (rumo: Rumo) => void;
  aoAtacar: () => void;
  /** Teclas 1–9 e 0 (§2.10): índice 0 a 9. */
  aoAtalho: (indice: number) => void;
  /** `Esc` é contextual (§2.15): cancela a mira antes de pausar. */
  aoCancelar: () => void;
  isometrico: () => boolean;
  /** Marco 26 (D-107): WASD (tela) ou EWAS (inclinação do isométrico). */
  teclas?: () => TeclasMovimento;
  /** Tecla `I`: abre a mochila (marco 6). */
  aoMochila?: () => void;
  /** Tecla `E`: interage com baú ou loja (marco 9A). */
  aoInteragir?: () => void;
  /** Tecla `X`: dispensa as invocações (marco 10A-3). */
  aoDispensar?: () => void;
  /** Marco 26 (D-117): a tecla C (quem a usa decide o toque duplo). */
  aoCentralizar?: () => void;
  /** Ajuste de 15/10/2026 (D-065): `Q` troca para o próximo alvo; com Shift, o anterior. */
  aoTrocarAlvo?: (sentido: 1 | -1) => void;
  /** Ajuste de 15/10/2026 (D-065): `T` trava ou destrava o alvo. */
  aoTravarAlvo?: () => void;
  /** Marco 24 (24/10/2026, D-094): `R` usa a ultimate; `F` liga ou desliga o ataque básico automático (D-097). */
  aoUltimate?: () => void;
  aoAlternarBasico?: () => void;
  /** Com um modal aberto, as teclas não chegam ao jogo (marco 6). */
  bloqueado?: () => boolean;
}

export interface Teclado {
  desligar: () => void;
  /** Solta as teclas mantidas (ao abrir um modal, por exemplo). */
  soltarTudo: () => void;
  /** Marco 26: a visão ou o modo das teclas mudou; as teclas mantidas passam a valer no novo. */
  atualizar: () => void;
}

const ORDEM_ATALHOS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

/**
 * Índice do atalho (0–9) de uma tecla: os números de cima e, desde o ajuste de 15/10/2026, os do teclado numérico
 * lateral (`Numpad1`–`Numpad0`). Outras teclas: −1.
 */
export function indiceDoAtalho(codigo: string): number {
  const m = /^(?:Digit|Numpad)(\d)$/.exec(codigo);
  return m?.[1] ? ORDEM_ATALHOS.indexOf(m[1]) : -1;
}

/** Liga o teclado. */
export function ligarTeclado(opcoes: OpcoesTeclado): Teclado {
  const pressionadas = new Set<string>();
  let atual: Rumo = PARADO;

  const modo = (): TeclasMovimento => opcoes.teclas?.() ?? 'wasd';
  const recalcular = () => {
    const rumo = rumoDasTeclas(pressionadas, modo(), opcoes.isometrico());
    if (rumo.dx !== atual.dx || rumo.dy !== atual.dy || rumo.dir !== atual.dir) {
      atual = rumo;
      opcoes.aoMudarDirecao(rumo);
    }
  };

  const aoBaixar = (ev: KeyboardEvent) => {
    if (ev.target instanceof HTMLInputElement || ev.target instanceof HTMLTextAreaElement) return;
    if (opcoes.bloqueado?.()) return;
    const iso = opcoes.isometrico();
    if (ev.code === 'KeyI' && !ev.repeat && opcoes.aoMochila) {
      opcoes.aoMochila();
    } else if (ev.code === teclaInteragir(modo(), iso)) {
      if (!ev.repeat) opcoes.aoInteragir?.();
    } else if (ev.code === 'KeyX' && !ev.repeat && opcoes.aoDispensar) {
      opcoes.aoDispensar();
    } else if (ev.code === 'KeyQ' && !ev.repeat && opcoes.aoTrocarAlvo) {
      opcoes.aoTrocarAlvo(ev.shiftKey ? -1 : 1);
    } else if (ev.code === 'KeyR' && !ev.repeat && opcoes.aoUltimate) {
      opcoes.aoUltimate();
    } else if (ev.code === 'KeyF' && !ev.repeat && opcoes.aoAlternarBasico) {
      opcoes.aoAlternarBasico();
    } else if (ev.code === 'KeyT' && !ev.repeat && opcoes.aoTravarAlvo) {
      opcoes.aoTravarAlvo();
    } else if (ev.code === 'KeyC' && !ev.repeat && opcoes.aoCentralizar) {
      opcoes.aoCentralizar();
    } else if (ehTeclaDeMovimento(ev.code, modo(), iso)) {
      ev.preventDefault();
      if (!ev.repeat) {
        pressionadas.add(ev.code);
        recalcular();
      }
    } else if (ev.code === 'Space' && !ev.repeat) {
      ev.preventDefault();
      opcoes.aoAtacar();
    } else if (indiceDoAtalho(ev.code) >= 0 && !ev.repeat) {
      opcoes.aoAtalho(indiceDoAtalho(ev.code));
    } else if (ev.code === 'Escape') {
      // Marco 12: sem isto, a ação padrão deste mesmo Esc fecharia na hora a pausa que ele abre.
      ev.preventDefault();
      opcoes.aoCancelar();
    }
  };
  const aoSoltar = (ev: KeyboardEvent) => {
    if (pressionadas.delete(ev.code)) recalcular();
  };
  // Perder o foco solta tudo (§3.6: parar em perda de foco e suspensão).
  const soltarTudo = () => {
    pressionadas.clear();
    recalcular();
  };

  window.addEventListener('keydown', aoBaixar);
  window.addEventListener('keyup', aoSoltar);
  window.addEventListener('blur', soltarTudo);
  document.addEventListener('visibilitychange', soltarTudo);
  return {
    desligar: () => {
      window.removeEventListener('keydown', aoBaixar);
      window.removeEventListener('keyup', aoSoltar);
      window.removeEventListener('blur', soltarTudo);
      document.removeEventListener('visibilitychange', soltarTudo);
    },
    soltarTudo,
    atualizar: recalcular,
  };
}
