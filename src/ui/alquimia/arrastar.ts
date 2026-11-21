// Marco 50 (21/11/2026, D-196): arrastar uma peça (orbe, runa, material, pedra rúnica) até um alvo com pointer events,
// o mesmo no mouse e no toque do Android. Um toque sem mover conta como clique (põe no próximo lugar livre). Enquanto
// arrasta, um fantasma segue o dedo, e o alvo debaixo dele acende (`data-alvo` + a classe `alvo-ativo`).

export interface Arrastavel {
  /** O tipo da peça; o alvo diz quais aceita em `data-aceita` (lista separada por espaço). */
  tipo: string;
  aoSoltar: (alvo: HTMLElement) => void;
  aoTocar: () => void;
}

const LIMIAR_PX = 6;

const alvoEm = (x: number, y: number, tipo: string): HTMLElement | null => {
  const debaixo = document.elementFromPoint(x, y);
  const alvo = debaixo instanceof Element ? debaixo.closest<HTMLElement>('[data-alvo]') : null;
  return alvo && (alvo.dataset.aceita ?? '').split(' ').includes(tipo) ? alvo : null;
};

/** Liga o arrastar num elemento (só o botão principal ou o dedo). */
export function tornarArrastavel(el: HTMLElement, a: Arrastavel): void {
  el.style.touchAction = 'none';
  el.addEventListener('pointerdown', (ev) => {
    if (ev.button !== 0) return;
    ev.preventDefault();
    const x0 = ev.clientX;
    const y0 = ev.clientY;
    let fantasma: HTMLElement | null = null;
    let aceso: HTMLElement | null = null;
    const acender = (alvo: HTMLElement | null) => {
      if (aceso === alvo) return;
      aceso?.classList.remove('alvo-ativo');
      aceso = alvo;
      aceso?.classList.add('alvo-ativo');
    };
    const mover = (e: PointerEvent) => {
      if (!fantasma && Math.hypot(e.clientX - x0, e.clientY - y0) < LIMIAR_PX) return;
      if (!fantasma) {
        fantasma = el.cloneNode(true) as HTMLElement;
        fantasma.classList.add('peca-fantasma');
        fantasma.removeAttribute('id');
        document.body.append(fantasma);
      }
      fantasma.style.left = `${String(e.clientX)}px`;
      fantasma.style.top = `${String(e.clientY)}px`;
      acender(alvoEm(e.clientX, e.clientY, a.tipo));
    };
    const fim = (e: PointerEvent) => {
      window.removeEventListener('pointermove', mover);
      window.removeEventListener('pointerup', fim);
      window.removeEventListener('pointercancel', fim);
      const arrastou = fantasma !== null;
      fantasma?.remove();
      acender(null);
      if (!arrastou) {
        if (e.type === 'pointerup') a.aoTocar();
        return;
      }
      const alvo = e.type === 'pointerup' ? alvoEm(e.clientX, e.clientY, a.tipo) : null;
      if (alvo) a.aoSoltar(alvo);
    };
    window.addEventListener('pointermove', mover);
    window.addEventListener('pointerup', fim);
    window.addEventListener('pointercancel', fim);
  });
}

/** Marca um elemento como alvo de soltar, para os tipos dados. */
export function tornarAlvo(el: HTMLElement, nome: string, aceita: readonly string[]): void {
  el.dataset.alvo = nome;
  el.dataset.aceita = aceita.join(' ');
}
