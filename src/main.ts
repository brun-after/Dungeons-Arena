// Ponto de entrada do cliente: registra o Service Worker no bootstrap (§3.8) e escolhe a tela pela URL:
//   (nada)            menu inicial
//   ?jogo=campanha    slots da campanha (marco 6B); com &slot=N, joga no slot N (0 = sem salvar)
//   ?jogo=grupo&slot=N&criar=1 | &codigo=XXXXXX   campanha cooperativa (marco 15)
//   ?arena=online     lobby e arena no servidor real (marco 5)
//   ?arena=loopback   treino de arena com sala e bot na página (marco 4)
//   ?editor[=id]      editor de fases (marco 6C), sob demanda
//   ?jogo=teste&fase=id   "Testar agora" do editor
//   ?pesquisa=1       teste com pessoas (marco 7A): campanha medida, questionário e envio anônimo
// O código da arena e do SDK de rede é carregado sob demanda (§3.8, code splitting).

import { ehDificuldade } from './modos/dificuldade';
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
  } else if (params.has('editor')) {
    void import('./editor/editor').then((m) => m.iniciarEditor(raiz, params.get('editor') || null));
  } else if (params.get('pesquisa') === '1') {
    void iniciarJogo(raiz, { slot: null, pesquisa: true });
  } else if (params.get('jogo') === 'teste' && params.get('fase')) {
    void iniciarJogo(raiz, { slot: null, teste: params.get('fase') ?? '' });
  } else if (params.get('jogo') === 'grupo') {
    // Marco 15: campanha cooperativa (o código de rede vem sob demanda, como o da arena).
    const slot = Number(params.get('slot'));
    const codigo = params.get('codigo');
    const dificuldade = params.get('dificuldade');
    void import('./grupo-tela').then((m) =>
      m.iniciarGrupo(raiz, {
        slot: Number.isInteger(slot) && slot >= 1 && slot <= 3 ? slot : 1,
        ...(codigo && { codigo: codigo.trim().toUpperCase() }),
        ...(ehDificuldade(dificuldade) && { dificuldade }),
      }),
    );
  } else if (params.get('jogo') === 'campanha') {
    const slot = Number(params.get('slot'));
    const fase = params.get('fase');
    const faseNova = fase?.startsWith('aventura:') ? { tipo: 'aventura' as const, id: fase.slice('aventura:'.length) } : undefined;
    if (params.has('slot') && Number.isInteger(slot) && slot >= 0 && slot <= 3) {
      const classe = params.get('classe');
      const dificuldade = params.get('dificuldade');
      void iniciarJogo(raiz, {
        slot: slot === 0 ? null : slot,
        ...(faseNova && { faseNova }),
        ...(classe && { classe }),
        ...(ehDificuldade(dificuldade) && { dificuldade }),
      });
    } else void mostrarSlots(raiz);
  } else {
    mostrarMenu(raiz);
  }
}
