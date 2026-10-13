// Aviso curto e não bloqueante (toast), anunciado a leitores de tela.

export function mostrarAviso(raiz: HTMLElement, texto: string, duracaoMs = 3000): void {
  const aviso = document.createElement('div');
  aviso.className = 'aviso';
  aviso.setAttribute('role', 'status');
  aviso.setAttribute('aria-live', 'polite');
  aviso.textContent = texto;
  raiz.append(aviso);
  setTimeout(() => {
    aviso.remove();
  }, duracaoMs);
}
