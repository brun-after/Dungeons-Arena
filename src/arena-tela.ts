// Telas da arena no navegador. As duas variantes usam o mesmo `rodarArena`:
// - loopback (`?arena=loopback&latencia=80&jitter=20&perda=0.01`): sala, você e um bot na mesma
//   página, ligados por rede simulada (marco 4);
// - online (`?arena=online`): lobby → servidor real por WSS (marco 5).

import { contextoDaArena } from './arena/contexto-arena';
import { versaoDoConteudo } from './arena/protocolo';
import { SalaArena } from './arena/sala';
import type { Habilidade } from './combat/habilidades';
import type { ContextoSimulacao } from './core/contexto';
import { buscarEntidade, criarEstado } from './core/estado';
import { t } from './i18n';
import { BotDeArena } from './net/bot';
import { ClienteArena } from './net/cliente';
import { ligarSala } from './net/ligacao';
import { RedeLocal, REDE_PERFEITA } from './net/rede-local';
import { iniciarLaco, relogioDoNavegador } from './plataforma/laco-navegador';
import { conectarArena, type PedidoDeSala } from './plataforma/transporte-colyseus';
import { mostrarAviso } from './ui/aviso';
import { montarCena } from './ui/cena';
import { mostrarLobby, type OpcoesLobby } from './ui/lobby';

const JANELA_ERROS = 120;
const agoraMs = () => relogioDoNavegador.agoraMs();

function p95(valores: readonly number[]): number {
  if (valores.length === 0) return 0;
  const o = [...valores].sort((a, b) => a - b);
  return o[Math.min(o.length - 1, Math.floor(o.length * 0.95))] ?? 0;
}

interface OpcoesArena {
  raiz: HTMLElement;
  ctx: ContextoSimulacao;
  eu: ClienteArena;
  /** Chamado a cada tick, antes do seu cliente (sala e bot do loopback). */
  antesDoTick?: (dtMs: number) => void;
  latenciaSimuladaMs: number;
  /** Código da sala, mostrado para compartilhar (só online). */
  codigo?: string;
}

/** Laço da arena: cena compartilhada + seu cliente (predição, reconciliação, interpolação). */
async function rodarArena(o: OpcoesArena): Promise<{ avisar: (texto: string) => void } | null> {
  const { ctx, eu } = o;
  // Antes do bemVindo, a cena desenha um estado vazio da fase.
  const vazio = criarEstado({ semente: 0, faseId: ctx.fase.id });
  const classe = ctx.conteudo.classes.get('aventureiro');
  const habilidades = (classe?.habilidades ?? []).map((id) => ctx.conteudo.habilidades.get(id)).filter((h): h is Habilidade => h !== undefined);
  const idLocal = eu.entidadeId ?? 'p1';

  const cena = await montarCena({
    raiz: o.raiz,
    ctx,
    idLocal,
    habilidades,
    estado: () => eu.previsto ?? vazio,
    emitir: (cmd) => {
      eu.enviarComando(cmd);
    },
  });
  if (!cena) return null;
  // Os eventos da sala (dano, coleta, mortes) alimentam o mesmo feedback da campanha.
  eu.aoEventos = (eventos) => {
    for (const ev of eventos) cena.bus.emitir(ev.t, ev);
  };
  const avisar = (texto: string) => {
    mostrarAviso(o.raiz.querySelector<HTMLElement>('.camada-ui') ?? o.raiz, texto);
  };
  if (o.codigo) avisar(t('lobby.codigoDaSala', { codigo: o.codigo }));

  iniciarLaco({
    simular: (dtMs) => {
      o.antesDoTick?.(dtMs);
      eu.passo();
    },
    renderizar: (alpha) => {
      const id = eu.entidadeId ?? idLocal;
      cena.quadro({
        alpha,
        agoraMs: agoraMs(),
        posicao: (e) => (e.id === id ? eu.posicaoVisualPropria() : eu.posicaoRemota(e.id)) ?? { x: e.x, y: e.y },
        rede: {
          rttMs: eu.rttMs,
          latenciaSimuladaMs: o.latenciaSimuladaMs,
          erroP95: p95(eu.erros.slice(-JANELA_ERROS)),
          conectado: eu.conectado && !!(eu.previsto && buscarEntidade(eu.previsto, id)),
        },
      });
    },
  });
  return { avisar };
}

function numeroDaUrl(params: URLSearchParams, nome: string, padrao: number, max: number): number {
  const v = Number(params.get(nome));
  return Number.isFinite(v) && params.has(nome) ? Math.min(max, Math.max(0, v)) : padrao;
}

export async function iniciarArenaLoopback(raiz: HTMLElement): Promise<void> {
  const params = new URLSearchParams(location.search);
  const condicao = {
    ...REDE_PERFEITA,
    latenciaMs: numeroDaUrl(params, 'latencia', 40, 500),
    jitterMs: numeroDaUrl(params, 'jitter', 10, 200),
    perda: numeroDaUrl(params, 'perda', 0, 0.2),
  };
  const ctx = contextoDaArena();
  const sala = new SalaArena(ctx, { semente: Date.now() % 100_000, versaoConteudo: versaoDoConteudo() });
  const rede = new RedeLocal(condicao, 2026);
  const conectar = (nome: string) => {
    const { cliente, servidor } = rede.conectar();
    ligarSala(sala, servidor);
    return new ClienteArena({ ctx, transporte: cliente, nome, pedidoFicha: { classeId: 'aventureiro' }, agoraMs });
  };
  const eu = conectar('Você');
  const outro = conectar('Bot');
  const bot = new BotDeArena(outro, 7, 0.6);

  // O bot só entra depois de você: assim você é sempre o jogador p1 da sala.
  eu.entrar();
  let botEntrou = false;
  await rodarArena({
    raiz,
    ctx,
    eu,
    latenciaSimuladaMs: condicao.latenciaMs,
    antesDoTick: (dtMs) => {
      rede.bombear(agoraMs());
      sala.tick(dtMs);
      if (!botEntrou && eu.conectado) {
        outro.entrar();
        botEntrou = true;
      }
      bot.agir();
      outro.passo();
    },
  });
}

/** Endereço do servidor: `?servidor=` (teste na rede local) → build (`VITE_ARENA_URL`) → localhost. */
export function enderecoDoServidor(): string | null {
  const daUrl = new URLSearchParams(location.search).get('servidor');
  if (daUrl && /^wss?:\/\/[\w.-]+(:\d+)?$/.test(daUrl)) return daUrl;
  const doBuild = import.meta.env.VITE_ARENA_URL as string | undefined;
  if (doBuild) return doBuild;
  return location.hostname === 'localhost' || location.hostname === '127.0.0.1' ? 'ws://localhost:2567' : null;
}

export function iniciarArenaOnline(raiz: HTMLElement): void {
  const servidor = enderecoDoServidor();
  const ctx = contextoDaArena();
  const opcoes: OpcoesLobby = {
    raiz,
    servidor,
    aoEscolher: async (pedido: PedidoDeSala) => {
      if (!servidor) return;
      const conexao = await conectarArena(servidor, pedido);
      const eu = new ClienteArena({ ctx, transporte: conexao.transporte, nome: 'Você', pedidoFicha: { classeId: 'aventureiro' }, agoraMs });
      eu.entrar();
      // Espera o bemVindo, para saber qual entidade é você antes de montar a cena.
      await new Promise<void>((resolver) => {
        const espera = setInterval(() => {
          if (eu.conectado) {
            clearInterval(espera);
            resolver();
          }
        }, 20);
      });
      const tela = await rodarArena({ raiz, ctx, eu, latenciaSimuladaMs: 0, codigo: conexao.codigo });
      // §4.12: reconexão amigável — mostra o estado em vez de cair para o menu.
      conexao.aoMudar((estado) => {
        tela?.avisar(t(`conexao.${estado}`));
      });
    },
  };
  mostrarLobby(opcoes);
}
