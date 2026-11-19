// Marco 40 (14/11/2026, D-168): o movimento da classe pela interface.
// D-172 (14/11/2026): um botão por movimento, em vez de um só que o G trocava.
// - Teclado: o Shift usa o movimento principal da classe (o mais usado); o V e o X (D-186; antes, o T e o G), os outros dois, da recarga menor
//   para a maior. Os que miram (o Acelerar, a Arremetida, o Posto dos Mortos) vão para o ponteiro; os outros, no rumo
//   das teclas (ou no de agora).
// - Celular: os botões lado a lado junto do direcional, o principal primeiro. Tocar usa o movimento no rumo do joystick;
//   nos que miram, o toque arma a mira e o próximo toque no mapa escolhe o ponto (tocar de novo no botão cancela).
// - O Aventureiro tem um botão só: o do companheiro ativo (a montaria muda com o companheiro).
// Cada botão mostra o ícone e a cor do seu movimento e escurece enquanto ele recarrega.
// D-173 (14/11/2026): no computador, os mesmos botões ficam no HUD, ao lado da ultimate, com a tecla de cada um (Shift,
// T, G; D-186: V, X) e os segundos que faltam da recarga; clicar também usa.

import type { Celula, Comando } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import { DT_MS } from '../core/loop';
import { movimentosDosBotoes, type MovimentoDaClasse } from '../combat/movimento-classe';
import type { Entidade } from '../entities/entidade';
import { t, type ChaveTexto } from '../i18n';
import { comandoDoMovimento, PARADO, type Rumo } from '../input/direcao';
import { icone } from './icones';
import { teclaDaAcao } from './nome-tecla';

export interface OpcoesMovimentoToque {
  ctx: ContextoSimulacao;
  estado: () => EstadoJogo;
  jogador: () => Entidade | undefined;
  emitir: (c: Comando) => void;
  /** A célula sob o cursor (o mouse), para os que miram no teclado. */
  cursor: () => Celula | null;
  /** Um aviso curto na tela (o "toque no mapa"). */
  avisar: (texto: string) => void;
  /** D-173: no computador, mostra a tecla de cada botão. */
  teclas?: boolean;
}

export interface MovimentoToque {
  /** Os botões do celular, lado a lado (vão junto do direcional). */
  botoes: HTMLElement;
  /** Os botões 0, 1 e 2 (Shift, V e X por padrão; D-187: as teclas das Configurações). */
  doTeclado: (rumo: Rumo, botao: number) => void;
  /** O rumo do joystick (o toque nos botões usa o último). */
  rumo: (r: Rumo) => void;
  /** Toque no mapa: com uma mira armada, escolhe o ponto e devolve true (o toque não anda). */
  tocar: (c: Celula) => boolean;
  desligar: () => void;
}

const ATUALIZAR_MS = 200;
const MAX_BOTOES = 3;
/** D-187: as ações de cada botão; a tecla vem das Configurações. */
const ACOES = ['movimento1', 'movimento2', 'movimento3'] as const;

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
    return { botao, id: '', resta: null as HTMLSpanElement | null, tecla: null as HTMLSpanElement | null };
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
        b.resta = document.createElement('span');
        b.resta.className = 'resta';
        b.botao.replaceChildren(icone(m.icone), b.resta);
        if (o.teclas) {
          b.tecla = document.createElement('span');
          b.tecla.className = 'tecla';
          b.botao.append(b.tecla);
        }
        b.botao.style.setProperty('--cor-movimento', m.cor);
      }
      // D-187: a tecla pode mudar nas Configurações com o jogo aberto.
      if (b.tecla) {
        const nome = teclaDaAcao(ACOES[i] ?? null);
        if (b.tecla.textContent !== nome) b.tecla.textContent = nome;
        b.botao.setAttribute('aria-label', t('movimento.botao', { nome: t(`movimento.${m.id}` as ChaveTexto) }));
        if (mirando === i) armar(null);
      }
      const cargas = (eu.movimentoClasse?.cargas[m.id] ?? []).filter((x) => x > tick);
      const carregando = String(cargas.length > 0 && !emCurso(m));
      if (b.botao.dataset.recarga !== carregando) b.botao.dataset.recarga = carregando;
      // Os segundos até a próxima carga voltar.
      const proxima = cargas.length > 0 ? Math.min(...cargas) : 0;
      const texto = carregando === 'true' ? String(Math.ceil(((proxima - tick) * DT_MS) / 1000)) : '';
      if (b.resta && b.resta.textContent !== texto) b.resta.textContent = texto;
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
