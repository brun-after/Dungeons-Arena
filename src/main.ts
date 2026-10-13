// Ponto de entrada do cliente: registra o Service Worker no bootstrap (§3.8) e inicia o jogo.
// Marco 2: entra direto na fase 1; o menu vem depois.

import './estilos.css';
import { registerSW } from 'virtual:pwa-register';
import { iniciarJogo } from './jogo';

registerSW({ immediate: true });

const raiz = document.getElementById('app');
if (raiz) void iniciarJogo(raiz);
