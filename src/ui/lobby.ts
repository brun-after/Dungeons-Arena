// Lobby da arena online (§2.13, "Ciclo de uma sala"): criar sala (recebe um código para
// compartilhar) ou entrar com um código. Antes de entrar, mostra a região do servidor e o ping
// medido (§3.6, "Justiça"). Textos sempre por textContent (§3.4).

import { enderecoHttp } from '../plataforma/servidor';
import { t } from '../i18n';
import type { PedidoDeSala } from '../plataforma/transporte-colyseus';

export interface OpcoesLobby {
  raiz: HTMLElement;
  /** Endereço WSS do servidor; null quando o build não tem servidor configurado. */
  servidor: string | null;
  aoEscolher: (pedido: PedidoDeSala) => Promise<void>;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, classe?: string, texto?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto !== undefined) e.textContent = texto;
  return e;
}

async function medirServidor(servidor: string): Promise<{ regiao: string; pingMs: number } | null> {
  try {
    const inicio = performance.now();
    const r = await fetch(`${enderecoHttp(servidor)}/saude`, { cache: 'no-store' });
    const corpo = (await r.json()) as { regiao?: string };
    return { regiao: corpo.regiao ?? '?', pingMs: Math.round(performance.now() - inicio) };
  } catch {
    return null;
  }
}

export function mostrarLobby(o: OpcoesLobby): void {
  o.raiz.textContent = '';
  const tela = el('section', 'tela-menu');
  tela.setAttribute('aria-labelledby', 'titulo-lobby');
  const titulo = el('h1', undefined, t('lobby.titulo'));
  titulo.id = 'titulo-lobby';
  const status = el('p', 'status-servidor', t('lobby.medindo'));
  status.setAttribute('role', 'status');
  const erro = el('p', 'erro-lobby');
  erro.setAttribute('role', 'alert');
  tela.append(titulo, status);

  const voltar = el('a', 'link-menu', t('menu.voltar'));
  voltar.href = './';

  if (!o.servidor) {
    status.textContent = t('lobby.semServidor');
    const treino = el('a', 'botao-menu', t('menu.treino'));
    treino.href = './?arena=loopback';
    tela.append(treino, voltar);
    o.raiz.append(tela);
    return;
  }

  // Marco 7B: escolha da arena ao criar (quem entra por código recebe a da sala).
  const arena = el('select', 'escolha-fase');
  arena.setAttribute('aria-label', t('lobby.arena'));
  for (const [id, chave] of [
    ['arena-01', 'lobby.arena01'],
    ['arena-02', 'lobby.arena02'],
  ] as const) {
    const op = el('option', undefined, t(chave));
    op.value = id;
    arena.append(op);
  }
  const criar = el('button', 'botao-menu', t('lobby.criar'));
  criar.type = 'button';
  const formulario = el('form', 'entrar-codigo');
  const rotulo = el('label', undefined, t('lobby.codigo'));
  const campo = el('input');
  campo.id = 'campo-codigo';
  rotulo.htmlFor = campo.id;
  campo.maxLength = 6;
  campo.autocomplete = 'off';
  campo.setAttribute('autocapitalize', 'characters');
  campo.placeholder = 'K7QM2P';
  const entrar = el('button', 'botao-menu', t('lobby.entrar'));
  entrar.type = 'submit';
  formulario.append(rotulo, campo, entrar);
  tela.append(arena, criar, formulario, erro, voltar);
  o.raiz.append(tela);

  void medirServidor(o.servidor).then((m) => {
    status.textContent = m ? t('lobby.servidor', { regiao: m.regiao, ping: m.pingMs }) : t('lobby.foraDoAr');
  });

  const escolher = async (pedido: PedidoDeSala) => {
    criar.disabled = entrar.disabled = true;
    erro.textContent = '';
    try {
      await o.aoEscolher(pedido);
    } catch (e) {
      const motivo = e instanceof Error ? e.message : '';
      // Marco 16: o servidor diz por que não criou (limite de salas ou de criações por minuto).
      erro.textContent = motivo.includes('servidor_cheio')
        ? t('lobby.servidorCheio')
        : motivo.includes('muitas_salas')
          ? t('lobby.muitasSalas')
          : 'criar' in pedido
            ? t('lobby.erroCriar')
            : t('lobby.erroEntrar');
      criar.disabled = entrar.disabled = false;
    }
  };
  criar.addEventListener('click', () => void escolher({ criar: true, fase: arena.value }));
  formulario.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const codigo = campo.value.trim().toUpperCase();
    if (codigo.length === 6) void escolher({ codigo });
    else erro.textContent = t('lobby.codigoCurto');
  });
}
