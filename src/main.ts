// Ponto de entrada do cliente: registra o Service Worker no bootstrap (§3.8) e inicia o jogo.
// `?arena=loopback` abre a arena com sala, você e um bot na mesma página (marco 4); sem o
// parâmetro, a campanha. O código da arena é carregado sob demanda (§3.8, code splitting).

import './estilos.css';
import { registerSW } from 'virtual:pwa-register';
import { iniciarJogo } from './jogo';

registerSW({ immediate: true });

const raiz = document.getElementById('app');
if (raiz) {
  if (new URLSearchParams(location.search).get('arena') === 'loopback') {
    void import('./arena-tela').then((m) => m.iniciarArenaLoopback(raiz));
  } else {
    void iniciarJogo(raiz);
  }
}
