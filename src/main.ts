// Ponto de entrada do cliente: registra o Service Worker no bootstrap (§3.8) e escolhe a tela pela URL:
//   (nada)            menu inicial
//   ?jogo=campanha    campanha offline
//   ?arena=online     lobby e arena no servidor real (marco 5)
//   ?arena=loopback   treino de arena com sala e bot na página (marco 4)
// O código da arena e do SDK de rede é carregado sob demanda (§3.8, code splitting).

import './estilos.css';
import { registerSW } from 'virtual:pwa-register';
import { iniciarJogo } from './jogo';
import { mostrarMenu } from './ui/menu';

registerSW({ immediate: true });

const raiz = document.getElementById('app');
if (raiz) {
  const params = new URLSearchParams(location.search);
  const arena = params.get('arena');
  if (arena === 'loopback') {
    void import('./arena-tela').then((m) => m.iniciarArenaLoopback(raiz));
  } else if (arena === 'online') {
    void import('./arena-tela').then((m) => {
      m.iniciarArenaOnline(raiz);
    });
  } else if (params.get('jogo') === 'campanha') {
    void iniciarJogo(raiz);
  } else {
    mostrarMenu(raiz);
  }
}
