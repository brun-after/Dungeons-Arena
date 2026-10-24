// Ponto de entrada do cliente: registra o Service Worker no bootstrap (§3.8; no app Android, não há) e escolhe a tela pela URL:
//   (nada)            menu inicial
//   ?jogo=campanha    slots da campanha (marco 6B); com &slot=N, joga no slot N (0 = sem salvar)
//   ?jogo=grupo&slot=N&criar=1 | &codigo=XXXXXX   campanha cooperativa (marco 15)
//   ?arena=online     lobby e arena no servidor real (marco 5)
//   ?arena=loopback   treino de arena com sala e bot na página (marco 4)
//   ?editor[=id]      editor de fases (marco 6C), sob demanda
//   ?jogo=teste&fase=id   "Testar agora" do editor
//   ?bench=carga|padrao|trocas   benchmarks do cliente (marco 16)
//   ?pesquisa=1       teste com pessoas (marco 7A): campanha medida, questionário e envio anônimo
// O código da arena e do SDK de rede é carregado sob demanda (§3.8, code splitting).

import { ehDificuldade } from './modos/dificuldade';
import { MAX_SLOTS, type RefFase } from './save/esquema';
import { faseSeguinte } from './save/fases-campanha';
import './estilos.css';
import { registerSW } from 'virtual:pwa-register';
import { iniciarJogo } from './jogo';
import { ligarAppNativo } from './plataforma/nativo';
import { prepararPreferencias } from './plataforma/preferencias';
import { mostrarMenu } from './ui/menu';
import { mostrarSlots } from './ui/slots';

registerSW({ immediate: true });
// Marco 20: no app Android, o botão voltar e o segundo plano (fora do app, não faz nada).
void ligarAppNativo();

const raiz = document.getElementById('app');
// Preferências vêm do IndexedDB (marco 6B): carregadas antes de qualquer tela.
if (raiz) void prepararPreferencias().then(() => {
  rotear(raiz);
});

/** A primeira fase gerada, com o tema pedido (o id inválido some na leitura dos parâmetros). */
function geradaComTema(tema: string): RefFase | undefined {
  const ref = faseSeguinte({ tipo: 'oficial', id: 'fase-02' });
  return ref?.tipo === 'gerada' && /^[a-z_]{1,30}$/.test(tema) ? { ...ref, params: { ...ref.params, tema } } : undefined;
}

function rotear(raiz: HTMLElement): void {
  const params = new URLSearchParams(location.search);
  const arena = params.get('arena');
  if (arena === 'loopback') {
    void import('./arena-tela').then((m) => m.iniciarArenaLoopback(raiz));
  } else if (arena === 'online') {
    void import('./arena-tela').then((m) => {
      m.iniciarArenaOnline(raiz);
    });
  } else if (params.has('bench')) {
    // Marco 16: benchmarks do cliente (sob demanda, fora do pacote principal).
    void import('./bench-tela').then((m) => m.iniciarBench(raiz, params));
  } else if (params.has('editor')) {
    const indice = Number(params.get('fase') ?? 0);
    void import('./editor/editor').then((m) => m.iniciarEditor(raiz, params.get('editor') || null, Number.isInteger(indice) ? indice : 0));
  } else if (params.get('pesquisa') === '1') {
    void iniciarJogo(raiz, { slot: null, pesquisa: true });
  } else if (params.get('jogo') === 'teste' && params.get('fase')) {
    // Marco 11A: `indice` (a fase da aventura) e `seguir` (testar a aventura inteira).
    const indice = Number(params.get('indice') ?? 0);
    void iniciarJogo(raiz, {
      slot: null,
      teste: params.get('fase') ?? '',
      testeIndice: Number.isInteger(indice) && indice >= 0 && indice < 12 ? indice : 0,
      testeSeguir: params.get('seguir') === '1',
    });
  } else if (params.get('jogo') === 'grupo') {
    // Marco 15: campanha cooperativa (o código de rede vem sob demanda, como o da arena).
    const slot = Number(params.get('slot'));
    const codigo = params.get('codigo');
    const dificuldade = params.get('dificuldade');
    void import('./grupo-tela').then((m) =>
      m.iniciarGrupo(raiz, {
        slot: Number.isInteger(slot) && slot >= 1 && slot <= MAX_SLOTS ? slot : 1,
        ...(codigo && { codigo: codigo.trim().toUpperCase() }),
        ...(ehDificuldade(dificuldade) && { dificuldade }),
      }),
    );
  } else if (params.get('jogo') === 'campanha') {
    const slot = Number(params.get('slot'));
    const fase = params.get('fase');
    // Marco 23 (D-092): `fase=tema:<id>` começa o jogo novo na primeira fase gerada, com aquele tema (testes e e2e).
    const faseNova = fase?.startsWith('aventura:') ? { tipo: 'aventura' as const, id: fase.slice('aventura:'.length) } : fase?.startsWith('tema:') ? geradaComTema(fase.slice('tema:'.length)) : undefined;
    if (params.has('slot') && Number.isInteger(slot) && slot >= 0 && slot <= MAX_SLOTS) {
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
