// Ponto de entrada do cliente: registra o Service Worker no bootstrap (§3.8) e escolhe a tela pela URL:
//   (nada)            menu inicial
//   ?jogo=campanha    slots da campanha (marco 6B); com &slot=N, joga no slot N (0 = sem salvar)
//   ?arena=online     lobby e arena no servidor real (marco 5)
//   ?arena=loopback   treino de arena com sala e bot na página (marco 4)
// O código da arena e do SDK de rede é carregado sob demanda (§3.8, code splitting).

import './estilos.css';
import { registerSW } from 'virtual:pwa-register';
import { iniciarJogo } from './jogo';
import { prepararPreferencias } from './plataforma/preferencias';
import { mostrarMenu } from './ui/menu';
import { mostrarSlots } from './ui/slots';

registerSW({ immediate: true });

const raiz = document.getElementById('app');
// Preferências vêm do IndexedDB (marco 6B): carregadas antes de qualquer tela.
if (raiz) void prepararPreferencias().then(() => {
  rotear(raiz);
});

function rotear(raiz: HTMLElement): void {
  const params = new URLSearchParams(location.search);
  const arena = params.get('arena');
  if (arena === 'loopback') {
    void import('./arena-tela').then((m) => m.iniciarArenaLoopback(raiz));
  } else if (arena === 'online') {
    void import('./arena-tela').then((m) => {
      m.iniciarArenaOnline(raiz);
    });
  } else if (params.get('jogo') === 'campanha') {
    const slot = Number(params.get('slot'));
    if (params.has('slot') && Number.isInteger(slot) && slot >= 0 && slot <= 3) void iniciarJogo(raiz, { slot: slot === 0 ? null : slot });
    else void mostrarSlots(raiz);
  } else {
    mostrarMenu(raiz);
  }
}
