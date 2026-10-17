// Lobby da arena online (§2.13, "Ciclo de uma sala"): criar sala (recebe um código para
// compartilhar) ou entrar com um código. Antes de entrar, mostra a região do servidor e o ping
// medido (§3.6, "Justiça"). Textos sempre por textContent (§3.4).
// Marco 17 (15/10/2026, D-063): escolhe o personagem (um slot da campanha, ou a ficha de treino) e mostra as salas
// da faixa de nível dele; a sala nova nasce com essa faixa.

import { conteudoOficial, modoPorId } from '../core/conteudo';
import { t, type ChaveTexto } from '../i18n';
import { faixaDoNivel } from '../modos/regras';
import { listarSlots } from '../plataforma/saves';
import { enderecoHttp } from '../plataforma/servidor';
import type { PedidoDeSala } from '../plataforma/transporte-colyseus';

export interface OpcoesLobby {
  raiz: HTMLElement;
  /** Endereço WSS do servidor; null quando o build não tem servidor configurado. */
  servidor: string | null;
  /** `slot`: o personagem da campanha que entra (null: ficha de treino, sem recompensas). */
  aoEscolher: (pedido: PedidoDeSala, slot: number | null) => Promise<void>;
}

interface SalaListada {
  codigo: string;
  jogadores: number;
  maxJogadores: number;
}

async function salasDaFaixa(servidor: string, faixa: string): Promise<SalaListada[]> {
  try {
    const r = await fetch(`${enderecoHttp(servidor)}/salas?faixa=${encodeURIComponent(faixa)}`, { cache: 'no-store' });
    const corpo = (await r.json()) as { salas?: unknown };
    return Array.isArray(corpo.salas) ? (corpo.salas as SalaListada[]).filter((s) => typeof s.codigo === 'string') : [];
  } catch {
    return [];
  }
}

/** O texto de um erro de entrada (servidor cheio, certificado recusado, fora da faixa...). */
function textoDoErro(motivo: string, criando: boolean): string {
  if (motivo.includes('servidor_cheio')) return t('lobby.servidorCheio');
  if (motivo.includes('muitas_salas')) return t('lobby.muitasSalas');
  if (motivo.includes('fora_da_faixa')) return t('lobby.foraDaFaixa');
  const certificado = /certificado:(\w+)/.exec(motivo)?.[1];
  if (certificado) return t(`lobby.certificado.${certificado}` as ChaveTexto);
  return criando ? t('lobby.erroCriar') : t('lobby.erroEntrar');
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

  // Marco 17: o personagem que entra e as salas da faixa dele.
  const modo = modoPorId(conteudoOficial(), 'livre');
  const rotuloPersonagem = el('label', 'linha-config', t('lobby.personagem'));
  const personagem = el('select', 'escolha-personagem');
  rotuloPersonagem.append(personagem);
  const treino = el('option', undefined, t('lobby.fichaTreino'));
  treino.value = '';
  personagem.append(treino);
  const niveis = new Map<string, number>();
  const blocoSalas = el('section', 'salas-da-faixa');
  const tituloSalas = el('h2');
  const listaSalas = el('ul');
  blocoSalas.append(tituloSalas, listaSalas);
  tela.append(rotuloPersonagem, arena, criar, formulario, blocoSalas, erro, voltar);
  o.raiz.append(tela);

  const slotEscolhido = (): number | null => (personagem.value ? Number(personagem.value) : null);
  const faixaEscolhida = (): string => {
    const nivel = niveis.get(personagem.value);
    return nivel === undefined ? 'aberta' : (faixaDoNivel(modo, nivel)?.id ?? 'aberta');
  };

  const servidor = o.servidor;
  void medirServidor(servidor).then((m) => {
    status.textContent = m ? t('lobby.servidor', { regiao: m.regiao, ping: m.pingMs }) : t('lobby.foraDoAr');
  });

  const escolher = async (pedido: PedidoDeSala) => {
    criar.disabled = entrar.disabled = true;
    erro.textContent = slotEscolhido() !== null ? t('lobby.conferindo') : '';
    try {
      await o.aoEscolher(pedido, slotEscolhido());
    } catch (e) {
      // Marcos 16 e 17: o servidor diz por que não deu (limite de salas, certificado, faixa).
      erro.textContent = textoDoErro(e instanceof Error ? e.message : '', 'criar' in pedido);
      criar.disabled = entrar.disabled = false;
    }
  };

  const atualizarSalas = async () => {
    const faixa = faixaEscolhida();
    tituloSalas.textContent = faixa === 'aberta' ? t('lobby.salasAbertas') : t('lobby.salasDaFaixa', { faixa });
    listaSalas.textContent = '';
    const salas = await salasDaFaixa(servidor, faixa);
    if (salas.length === 0) listaSalas.append(el('li', 'detalhe-slot', t('lobby.semSalas')));
    for (const s of salas) {
      const item = el('li');
      const botao = el('button', 'botao-cabecalho', t('lobby.entrarNaSala', { codigo: s.codigo, n: s.jogadores, max: s.maxJogadores }));
      botao.type = 'button';
      botao.addEventListener('click', () => void escolher({ codigo: s.codigo }));
      item.append(botao);
      listaSalas.append(item);
    }
  };
  personagem.addEventListener('change', () => void atualizarSalas());
  void listarSlots()
    .catch(() => [])
    .then((slots) => {
      for (const s of slots) {
        if (s.tipo !== 'ok') continue;
        const op = el('option', undefined, t('lobby.slotPersonagem', { n: s.slot, nivel: s.resumo.nivel, descobertas: s.resumo.descobertas }));
        op.value = String(s.slot);
        niveis.set(op.value, s.resumo.nivel);
        personagem.append(op);
      }
      // O primeiro slot com personagem já vem escolhido: a arena é para usar o personagem da campanha.
      const primeiro = [...niveis.keys()][0];
      if (primeiro) personagem.value = primeiro;
      void atualizarSalas();
    });
  criar.addEventListener('click', () => void escolher({ criar: true, fase: arena.value, faixa: faixaEscolhida() }));
  formulario.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const codigo = campo.value.trim().toUpperCase();
    if (codigo.length === 6) void escolher({ codigo });
    else erro.textContent = t('lobby.codigoCurto');
  });
}
