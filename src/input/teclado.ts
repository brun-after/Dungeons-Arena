// Teclado (§2.3): teclas mantidas viram estado direcional. Emite só início, mudança e parada;
// a repetição automática do sistema operacional não gera comandos. Marco 26 (D-105): as 8 direções de tela vão à
// fase pela inversa da projeção (no isométrico, a seta para a direita anda para a direita na tela). D-107: com EWAS
// nas Configurações, as teclas seguem a inclinação do isométrico e interagir vai para o D (input/teclas.ts).
// 19/11/2026 (D-187): as outras teclas vêm do mapa das Configurações (input/atalhos.ts); só os direcionais são fixos.

import { PARADO, type Rumo } from './direcao';
import { acaoDaTecla, indiceDoAtalhoDaAcao, normalizarCodigo, TECLAS_PADRAO, type AcaoTeclado, type MapaTeclas } from './atalhos';
import { ehTeclaDeMovimento, rumoDasTeclas, teclaDeInteragir, type TeclasMovimento } from './teclas';

export interface OpcoesTeclado {
  aoMudarDirecao: (rumo: Rumo) => void;
  /** Os atalhos das habilidades (índice 0 a 5) e dos consumíveis (6 a 9) (§2.10). */
  aoAtalho: (indice: number) => void;
  /** A tecla de pausar (o `Esc`, por padrão) é contextual (§2.15): cancela a mira antes de pausar. */
  aoCancelar: () => void;
  isometrico: () => boolean;
  /** Marco 26 (D-107): WASD (tela) ou EWAS (inclinação do isométrico). */
  teclas?: () => TeclasMovimento;
  /** 19/11/2026 (D-187): a tecla de cada ação, das Configurações (sem isto, as padrão). */
  atalhos?: () => Readonly<MapaTeclas>;
  /** Abre a mochila (marco 6). */
  aoMochila?: () => void;
  /** Interage com baú ou loja (marco 9A). */
  aoInteragir?: () => void;
  /** Marco 26 (D-117): recentraliza a câmera (quem a usa decide o toque duplo). */
  aoCentralizar?: () => void;
  /** Ajuste de 15/10/2026 (D-065): o próximo alvo (1) ou o anterior (−1). */
  aoTrocarAlvo?: (sentido: 1 | -1) => void;
  /** Ajuste de 15/10/2026 (D-065): trava ou destrava o alvo. */
  aoTravarAlvo?: () => void;
  /** Marco 24 (24/10/2026, D-094): a ultimate; e liga ou desliga o ataque básico automático (D-097). */
  aoUltimate?: () => void;
  aoAlternarBasico?: () => void;
  /** D-187: um ataque básico (sem tecla por padrão desde a D-185). */
  aoAtacar?: () => void;
  /** D-187: dispensa as invocações (sem tecla por padrão desde a D-186). */
  aoDispensar?: () => void;
  /** D-172: o movimento do botão (0 o principal; 1 e 2 os outros), no rumo das teclas. */
  aoMovimento?: (rumo: Rumo, botao: number) => void;
  /** Com um modal aberto, as teclas não chegam ao jogo (marco 6). */
  bloqueado?: () => boolean;
  /**
   * Marco 41 (14/11/2026, D-169): as teclas de movimento já mantidas ao ligar (a cena da região de antes as passa na
   * troca de sala; sem isto, o personagem parava na passagem até a tecla ser solta e apertada de novo).
   */
  iniciais?: readonly string[];
}

export interface Teclado {
  desligar: () => void;
  /** Solta as teclas mantidas (ao abrir um modal, por exemplo). */
  soltarTudo: () => void;
  /** Marco 26: a visão ou o modo das teclas mudou; as teclas mantidas passam a valer no novo. */
  atualizar: () => void;
  /** Marco 41 (D-169): as teclas de movimento mantidas agora. */
  mantidas: () => string[];
}

const ORDEM_ATALHOS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

/**
 * Índice do atalho (0–9) de uma tecla nas teclas padrão: os números de cima e, desde o ajuste de 15/10/2026, os do
 * teclado numérico lateral (`Numpad1`–`Numpad0`). Outras teclas: −1.
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

  /** A função de cada ação; as que o chamador não passou ficam de fora (a tecla segue para a página). */
  const mover = (botao: number) => opcoes.aoMovimento && (() => { opcoes.aoMovimento?.(atual, botao); });
  const trocar = (sentido: 1 | -1) => opcoes.aoTrocarAlvo && (() => { opcoes.aoTrocarAlvo?.(sentido); });
  const funcoes: Partial<Record<AcaoTeclado, (() => void) | undefined>> = {
    movimento1: mover(0),
    movimento2: mover(1),
    movimento3: mover(2),
    ultimate: opcoes.aoUltimate,
    atacar: opcoes.aoAtacar,
    alternarBasico: opcoes.aoAlternarBasico,
    trocarAlvo: trocar(1),
    alvoAnterior: trocar(-1),
    travarAlvo: opcoes.aoTravarAlvo,
    interagir: opcoes.aoInteragir,
    mochila: opcoes.aoMochila,
    dispensar: opcoes.aoDispensar,
    centralizar: opcoes.aoCentralizar,
    pausar: opcoes.aoCancelar,
  };

  const aoBaixar = (ev: KeyboardEvent) => {
    if (ev.target instanceof HTMLInputElement || ev.target instanceof HTMLTextAreaElement) return;
    if (opcoes.bloqueado?.()) return;
    const iso = opcoes.isometrico();
    // Os direcionais vêm primeiro e são fixos (D-187: nenhuma ação os usa).
    if (ehTeclaDeMovimento(ev.code, modo(), iso)) {
      ev.preventDefault();
      // Marco 41 (D-169): a repetição do sistema também traz a tecla que já vinha mantida de outra cena.
      if (!pressionadas.has(ev.code)) {
        pressionadas.add(ev.code);
        recalcular();
      }
      return;
    }
    // 19/11/2026 (D-187): a ação da tecla vem do mapa das Configurações. No EWAS, o interagir que caiu num
    // direcional passa ao D (como antes).
    const mapa = opcoes.atalhos?.() ?? TECLAS_PADRAO;
    const acao = normalizarCodigo(ev.code) === teclaDeInteragir(mapa, modo(), iso) ? 'interagir' : acaoDaTecla(mapa, ev.code);
    if (!acao) return;
    const atalho = indiceDoAtalhoDaAcao(acao);
    const funcao = atalho >= 0 ? () => { opcoes.aoAtalho(atalho); } : funcoes[acao];
    if (!funcao) return;
    // Marco 12: sem isto, a ação padrão deste mesmo Esc fecharia na hora a pausa que ele abre. D-187: vale para
    // qualquer tecla com ação (o Espaço não rola a página, o Alt não abre o menu).
    ev.preventDefault();
    if (ev.repeat) return;
    funcao();
  };
  const aoSoltar = (ev: KeyboardEvent) => {
    if (pressionadas.delete(ev.code)) recalcular();
  };
  // Perder o foco solta tudo (§3.6: parar em perda de foco e suspensão).
  const soltarTudo = () => {
    pressionadas.clear();
    recalcular();
  };

  for (const codigo of opcoes.iniciais ?? []) if (ehTeclaDeMovimento(codigo, modo(), opcoes.isometrico())) pressionadas.add(codigo);
  if (pressionadas.size > 0) recalcular();
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
    mantidas: () => [...pressionadas],
  };
}
