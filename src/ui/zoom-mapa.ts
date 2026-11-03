export function ligarZoomMapa(canvas: HTMLCanvasElement, ampliar: (fator: number) => void): void {
  let distancia = 0;
  let ultimaPinca = -Infinity;
  const medir = (e: TouchEvent) => {
    const a = e.touches[0], b = e.touches[1];
    return a && b ? Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) : 0;
  };
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    e.stopPropagation();
    ampliar(Math.exp(-Math.max(-150, Math.min(150, e.deltaY)) * .004));
  }, { passive: false });
  canvas.addEventListener('touchstart', e => {
    distancia = medir(e);
    if (distancia > 0) e.preventDefault();
  }, { passive: false });
  canvas.addEventListener('touchmove', e => {
    const nova = medir(e);
    if (nova <= 0 || distancia <= 0) return;
    e.preventDefault();
    ampliar(nova / distancia);
    distancia = nova;
    ultimaPinca = performance.now();
  }, { passive: false });
  const terminar = () => {
    if (distancia > 0) ultimaPinca = performance.now();
    distancia = 0;
  };
  canvas.addEventListener('touchend', terminar);
  canvas.addEventListener('touchcancel', terminar);
  canvas.addEventListener('click', e => {
    if (e.detail > 0 && performance.now() - ultimaPinca < 350) e.stopImmediatePropagation();
  }, true);
}
