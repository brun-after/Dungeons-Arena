// Marco 40 (14/11/2026, D-168): o movimento da classe pela interface.
// D-172 (14/11/2026): um botão por movimento, em vez de um só que o G trocava.
// - Teclado: o Shift usa o movimento principal da classe (o mais usado); o T e o G, os outros dois, da recarga menor
//   para a maior. Os que miram (o Acelerar, a Arremetida, o Posto dos Mortos) vão para o ponteiro; os outros, no rumo
//   das teclas (ou no de agora).
// - Celular: os botões lado a lado junto do direcional, o principal primeiro. Tocar usa o movimento no rumo do joystick;
//   nos que miram, o toque arma a mira e o próximo toque no mapa escolhe o ponto (tocar de novo no botão cancela).
// - O Aventureiro tem um botão só: o do companheiro ativo (a montaria muda com o companheiro).
// Cada botão mostra o ícone e a cor do seu movimento e escurece enquanto ele recarrega.

import type { Celula, Comando } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import { movimentosDosBotoes, type MovimentoDaClasse } from '../combat/movimento-classe';
import type { Entidade } from '../entities/entidade';
import { t, type ChaveTexto } from '../i18n';
import { comandoDoMovimento, PARADO, type Rumo } from '../input/direcao';
import { icone } from './icones';

export interface OpcoesMovimentoToque {
  ctx: ContextoSimulacao;
  estado: () => EstadoJogo;
  jogador: () => Entidade | undefined;
  emitir: (c: Comando) => void;
  /** A célula sob o cursor (o mouse), para os que miram no teclado. */
  cursor: () => Celula | null;
  /** Um aviso curto na tela (o "toque no mapa"). */
  avisar: (texto: string) => void;
}

export interface MovimentoToque {
  /** Os botões do celular, lado a lado (vão junto do direcional). */
  botoes: HTMLElement;
  /** Shift (0), T (1) e G (2). */
  doTeclado: (rumo: Rumo, botao: number) => void;
  /** O rumo do joystick (o toque nos botões usa o último). */
  rumo: (r: Rumo) => void;
  /** Toque no mapa: com uma mira armada, escolhe o ponto e devolve true (o toque não anda). */
  tocar: (c: Celula) => boolean;
  desligar: () => void;
}

const ATUALIZAR_MS = 200;
const MAX_BOTOES = 3;

export function criarMovimentoToque(o: OpcoesMovimentoToque): MovimentoToque {
  let rumo: Rumo = PARADO;
  /** O botão com a mira armada (null: nenhum). */
  let mirando: number | null = null;
  const caixa = document.createElement('div');
  caixa.className = 'movimentos-classe';

  const doBotao = (i: number): MovimentoDaClasse | null => {
    const eu = o.jogador();
    return eu ? (movimentosDosBotoes(o.ctx, eu)[i] ?? null) : null;
  };
  const usar = (i: number, alvo?: Celula) => {
    const base = comandoDoMovimento(rumo);
    if (base.t === 'movimentoClasse') o.emitir({ ...base, botao: i, ...(alvo && { alvo }) });
  };
  /** O modo em curso desliga no mesmo botão (sem mira). */
  const emCurso = (m: MovimentoDaClasse | null) => {
    const eu = o.jogador();
    return !!m && eu?.movimentoClasse?.modo?.id === m.id;
  };

  const botoes = Array.from({ length: MAX_BOTOES }, (_, i) => {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'botao-acao movimento-classe';
    botao.dataset.testid = `movimento-classe-${i}`;
    botao.hidden = true;
    botao.addEventListener('pointerdown', (ev) => {
      ev.preventDefault();
      botao.classList.add('pressionado');
    });
    botao.addEventListener('pointerup', () => {
      botao.classList.remove('pressionado');
      const m = doBotao(i);
      if (!m) return;
      if (mirando === i) {
        armar(null);
        o.avisar(t('movimento.mirarCancelado'));
      } else if (m.mira && !emCurso(m)) {
        armar(i);
        o.avisar(t('movimento.mirar'));
      } else {
        armar(null);
        usar(i);
      }
    });
    const soltar = () => { botao.classList.remove('pressionado'); };
    botao.addEventListener('pointercancel', soltar);
    botao.addEventListener('pointerleave', soltar);
    caixa.append(botao);
    return { botao, id: '' };
  });
  function armar(i: number | null): void {
    mirando = i;
    botoes.forEach((b, k) => { b.botao.dataset.mirando = String(k === i); });
  }

  // O ícone, o nome e a recarga de cada botão (mudam com o nível e, no Aventureiro, com o companheiro).
  const intervalo = setInterval(() => {
    const eu = o.jogador();
    const lista = eu ? movimentosDosBotoes(o.ctx, eu) : [];
    const tick = o.estado().tick;
    botoes.forEach((b, i) => {
      const m = lista[i];
      b.botao.hidden = !m;
      if (!m || !eu) return;
      if (b.id !== m.id) {
        b.id = m.id;
        b.botao.replaceChildren(icone(m.icone));
        b.botao.style.setProperty('--cor-movimento', m.cor);
        b.botao.setAttribute('aria-label', t('movimento.botao', { nome: t(`movimento.${m.id}` as ChaveTexto) }));
        if (mirando === i) armar(null);
      }
      const recarga = (eu.movimentoClasse?.cargas[m.id] ?? []).filter((x) => x > tick).length;
      const carregando = String(recarga > 0 && !emCurso(m));
      if (b.botao.dataset.recarga !== carregando) b.botao.dataset.recarga = carregando;
    });
  }, ATUALIZAR_MS);

  return {
    botoes: caixa,
    doTeclado: (r, i) => {
      rumo = r;
      const m = doBotao(i);
      if (!m) return;
      const c = m.mira ? o.cursor() : null;
      usar(i, c ?? undefined);
    },
    rumo: (r) => { rumo = r; },
    tocar: (c) => {
      if (mirando === null) return false;
      const i = mirando;
      armar(null);
      usar(i, c);
      return true;
    },
    desligar: () => {
      clearInterval(intervalo);
      caixa.remove();
    },
  };
}
