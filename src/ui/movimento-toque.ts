// Marco 40 (14/11/2026, D-168): o movimento da classe pela interface.
// - Teclado: o Shift usa a mecânica ativa; as que miram (o Piscar, a Arremetida, o Posto dos Mortos) vão para o ponteiro,
//   as outras no rumo das teclas (ou no de agora).
// - Celular: o botão de movimento. Tocar usa a mecânica no rumo do joystick; nas que miram, o toque arma a mira e o
//   próximo toque no mapa escolhe o ponto (tocar de novo no botão cancela). Segurar troca a mecânica (o G).
// O botão mostra o ícone e a cor da mecânica ativa e escurece enquanto ela recarrega.

import type { Celula, Comando } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import { movimentoAtivo } from '../combat/movimento-classe';
import type { Entidade } from '../entities/entidade';
import { t } from '../i18n';
import { comandoDoMovimento, PARADO, type Rumo } from '../input/direcao';
import { icone } from './icones';

export interface OpcoesMovimentoToque {
  ctx: ContextoSimulacao;
  estado: () => EstadoJogo;
  jogador: () => Entidade | undefined;
  emitir: (c: Comando) => void;
  /** A célula sob o cursor (o mouse), para as que miram no teclado. */
  cursor: () => Celula | null;
  /** Um aviso curto na tela (o "toque no mapa"). */
  avisar: (texto: string) => void;
}

export interface MovimentoToque {
  /** O botão do celular (vai na coluna do meio dos controles). */
  botao: HTMLButtonElement;
  /** Shift. */
  doTeclado: (rumo: Rumo) => void;
  /** O rumo do joystick (o toque no botão usa o último). */
  rumo: (r: Rumo) => void;
  /** Toque no mapa: com a mira armada, escolhe o ponto e devolve true (o toque não anda). */
  tocar: (c: Celula) => boolean;
  desligar: () => void;
}

const SEGURAR_MS = 450;
const ATUALIZAR_MS = 200;

export function criarMovimentoToque(o: OpcoesMovimentoToque): MovimentoToque {
  let rumo: Rumo = PARADO;
  let mirando = false;
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'botao-acao movimento-classe';
  botao.dataset.testid = 'movimento-classe';
  botao.setAttribute('aria-label', t('movimento.botao'));
  let iconeAtual = '';

  const ativo = () => {
    const eu = o.jogador();
    return eu ? movimentoAtivo(o.ctx, eu) : null;
  };
  const armar = (sim: boolean) => {
    mirando = sim;
    botao.dataset.mirando = String(sim);
  };
  const usar = (alvo?: Celula) => {
    const base = comandoDoMovimento(rumo);
    o.emitir(base.t === 'movimentoClasse' && alvo ? { ...base, alvo } : base);
  };

  let timer: ReturnType<typeof setTimeout> | null = null;
  botao.addEventListener('pointerdown', (ev) => {
    ev.preventDefault();
    botao.classList.add('pressionado');
    timer = setTimeout(() => {
      timer = null;
      armar(false);
      o.emitir({ t: 'trocarMovimento' });
    }, SEGURAR_MS);
  });
  const soltar = (tocou: boolean) => {
    botao.classList.remove('pressionado');
    if (timer === null) return;
    clearTimeout(timer);
    timer = null;
    if (!tocou) return;
    if (mirando) {
      armar(false);
      o.avisar(t('movimento.mirarCancelado'));
    } else if (ativo()?.mira && !emCurso()) {
      armar(true);
      o.avisar(t('movimento.mirar'));
    } else usar();
  };
  /** O modo em curso desliga no mesmo botão (sem mira). */
  const emCurso = () => {
    const eu = o.jogador();
    return !!eu?.movimentoClasse?.modo && eu.movimentoClasse.modo.id === ativo()?.id;
  };
  botao.addEventListener('pointerup', () => { soltar(true); });
  botao.addEventListener('pointercancel', () => { soltar(false); });
  botao.addEventListener('pointerleave', () => { soltar(false); });

  // O ícone e a recarga da mecânica ativa.
  const intervalo = setInterval(() => {
    const m = ativo();
    const eu = o.jogador();
    botao.hidden = !m;
    if (!m || !eu) return;
    if (iconeAtual !== m.icone) {
      iconeAtual = m.icone;
      botao.replaceChildren(icone(m.icone));
      botao.style.setProperty('--cor-movimento', m.cor);
    }
    const tick = o.estado().tick;
    const recarga = (eu.movimentoClasse?.cargas[m.id] ?? []).filter((x) => x > tick).length;
    const carregando = String(recarga > 0 && !emCurso());
    if (botao.dataset.recarga !== carregando) botao.dataset.recarga = carregando;
  }, ATUALIZAR_MS);

  return {
    botao,
    doTeclado: (r) => {
      rumo = r;
      const m = ativo();
      const c = m?.mira ? o.cursor() : null;
      usar(c ?? undefined);
    },
    rumo: (r) => { rumo = r; },
    tocar: (c) => {
      if (!mirando) return false;
      armar(false);
      usar(c);
      return true;
    },
    desligar: () => {
      clearInterval(intervalo);
      if (timer !== null) clearTimeout(timer);
      botao.remove();
    },
  };
}
