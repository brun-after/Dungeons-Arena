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

/**
 * 09/11/2026 (D-143): a janela rolável do mapa com os botões de zoom (o mapa do terreno e o do Portal temporário).
 * Ampliado, o diálogo ganha `data-zoom="1"`: no celular, o CSS esconde o resto e o mapa ocupa a tela.
 */
export function janelaComZoom(canvas: HTMLCanvasElement, dialogo: HTMLElement, rotulos: { reduzir: string; ampliar: string }): { janela: HTMLDivElement; zoom: HTMLDivElement } {
  const janela = document.createElement('div');
  janela.className = 'janela-cartografia';
  janela.append(canvas);
  const zoom = document.createElement('div');
  zoom.className = 'acoes-slot zoom-cartografia';
  let escala = 1;
  const aplicarZoom = (nova: number) => {
    const anterior = canvas.offsetWidth || 1;
    const centroX = janela.scrollLeft + janela.clientWidth / 2;
    const centroY = janela.scrollTop + janela.clientHeight / 2;
    escala = Math.max(1, Math.min(4, nova));
    dialogo.dataset.zoom = escala > 1 ? '1' : '0';
    canvas.style.setProperty('--zoom-mapa', String(escala));
    const fator = canvas.offsetWidth / anterior;
    janela.scrollLeft = centroX * fator - janela.clientWidth / 2;
    janela.scrollTop = centroY * fator - janela.clientHeight / 2;
  };
  ligarZoomMapa(canvas, (fator) => { aplicarZoom(escala * fator); });
  for (const [rotulo, delta] of [[rotulos.reduzir, -0.5], [rotulos.ampliar, 0.5]] as const) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'botao-cabecalho';
    b.textContent = rotulo;
    b.addEventListener('click', () => { aplicarZoom(escala + delta); });
    zoom.append(b);
  }
  return { janela, zoom };
}
