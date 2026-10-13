// Ponto de entrada do cliente. Marco 1: tela inicial que demonstra o núcleo rodando no navegador.
// A camada gráfica (PixiJS) entra no marco 2.

import './estilos.css';
import type { ComandoDoTick, Dir8 } from './core/comandos';
import { digest } from './core/digest';
import { criarEntidade, criarEstado } from './core/estado';
import { simular, type EventoSimulacao } from './core/simulacao';
import { t } from './i18n';
import { iniciarLaco } from './plataforma/laco-navegador';

const ROTA: readonly Dir8[] = ['E', 'S', 'O', 'N'];

function elemento<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  texto?: string,
  classe?: string,
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  // Sempre textContent: nada de HTML cru (§3.4).
  if (texto !== undefined) el.textContent = texto;
  if (classe !== undefined) el.className = classe;
  return el;
}

function montarTela(raiz: HTMLElement) {
  const titulo = elemento('h1', t('app.titulo'));
  const subtitulo = elemento('p', t('app.subtitulo'), 'subtitulo');
  const status = elemento('p', t('app.status'), 'status');

  const painel = elemento('section', undefined, 'painel');
  painel.setAttribute('aria-label', t('nucleo.rotulo'));
  const rotulo = elemento('h2', t('nucleo.rotulo'));
  const explicacao = elemento('p', t('nucleo.explicacao'), 'explicacao');

  const lista = elemento('dl');
  const linha = (chave: 'nucleo.tick' | 'nucleo.digest' | 'nucleo.entidades', id: string) => {
    const valor = elemento('dd', '0');
    valor.dataset.testid = id;
    lista.append(elemento('dt', t(chave)), valor);
    return valor;
  };
  const tick = linha('nucleo.tick', 'tick');
  const dig = linha('nucleo.digest', 'digest');
  const entidades = linha('nucleo.entidades', 'entidades');

  painel.append(rotulo, explicacao, lista);
  raiz.append(titulo, subtitulo, status, painel);
  return { tick, dig, entidades };
}

function iniciar(): void {
  const raiz = document.getElementById('app');
  if (!raiz) return;
  const saida = montarTela(raiz);

  const estado = criarEstado({ semente: 2026, largura: 20, altura: 20 });
  estado.entidades.push(criarEntidade('demo', 2, 2));
  const eventos: EventoSimulacao[] = [];
  let tickDoUltimoDigest = -Infinity;

  iniciarLaco({
    simular: (dtMs) => {
      // Bot de demonstração: troca de direção a cada 2 s, percorrendo um quadrado.
      const comandos: ComandoDoTick[] = [];
      if (estado.tick % 120 === 0) {
        const dir = ROTA[(estado.tick / 120) % ROTA.length] ?? 'E';
        comandos.push({ tick: estado.tick, entidadeId: 'demo', cmd: { t: 'mover', dir } });
      }
      eventos.length = 0;
      simular(estado, comandos, eventos, dtMs);
    },
    renderizar: () => {
      saida.tick.textContent = String(estado.tick);
      saida.entidades.textContent = String(estado.entidades.length);
      // O digest só é recalculado a cada 30 ticks, para não pesar no quadro.
      if (estado.tick - tickDoUltimoDigest >= 30) {
        saida.dig.textContent = digest(estado);
        tickDoUltimoDigest = estado.tick;
      }
    },
  });
}

iniciar();
