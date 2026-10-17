// Aviso curto e não bloqueante (toast), anunciado a leitores de tela.

/** Ajuste de 17/10/2026: avisos e alvo compartilham o fluxo para nunca se sobrepor. */
export function faixaSuperior(raiz: HTMLElement): HTMLElement {
  const ui = raiz.querySelector<HTMLElement>('.camada-ui') ?? raiz;
  const existente = ui.querySelector<HTMLElement>(':scope > .mensagens-topo');
  if (existente) return existente;
  const faixa = document.createElement('div');
  faixa.className = 'mensagens-topo';
  ui.append(faixa);
  return faixa;
}

export function mostrarAviso(raiz: HTMLElement, texto: string, duracaoMs = 3000): void {
  const faixa = faixaSuperior(raiz);
  // O aviso mais recente substitui o anterior, sem acumular mensagens sobre o mapa.
  faixa.querySelector('.aviso')?.remove();
  const aviso = document.createElement('div');
  aviso.className = 'aviso';
  aviso.setAttribute('role', 'status');
  aviso.setAttribute('aria-live', 'polite');
  aviso.textContent = texto;
  faixa.append(aviso);
  setTimeout(() => {
    aviso.remove();
  }, duracaoMs);
}
