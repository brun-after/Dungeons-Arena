// Arena em loopback no navegador (marco 4): a sala autoritativa, o seu cliente e um cliente bot
// rodam na mesma página, ligados por uma rede simulada com latência, jitter e perda configuráveis
// pela URL (`?arena=loopback&latencia=80&jitter=20&perda=0.01`). É o jogo da arena de verdade,
// só sem rede real: no marco 5 a mesma sala vai para o servidor e o transporte vira WSS.

import { versaoDoConteudo } from './arena/protocolo';
import { SalaArena } from './arena/sala';
import type { Habilidade } from './combat/habilidades';
import { conteudoOficial, modoPorId } from './core/conteudo';
import { BALANCE_PADRAO, type ContextoSimulacao } from './core/contexto';
import { buscarEntidade, criarEstado } from './core/estado';
import arena01 from './data/fases/arena-01.json';
import { BotDeArena } from './net/bot';
import { ClienteArena } from './net/cliente';
import { ligarSala } from './net/ligacao';
import { RedeLocal, REDE_PERFEITA } from './net/rede-local';
import { relogioDoNavegador, iniciarLaco } from './plataforma/laco-navegador';
import { montarCena } from './ui/cena';
import { carregarFase } from './world/fase';
import { validarFase } from './world/validacao-fase';

const JANELA_ERROS = 120;

function numeroDaUrl(params: URLSearchParams, nome: string, padrao: number, max: number): number {
  const v = Number(params.get(nome));
  return Number.isFinite(v) && params.has(nome) ? Math.min(max, Math.max(0, v)) : padrao;
}

function contextoDaArena(): ContextoSimulacao {
  const conteudo = conteudoOficial();
  const r = validarFase(arena01, new Set(conteudo.presets.keys()));
  if (!r.ok) throw new Error(`fase de arena inválida: ${r.erros.map((e) => e.mensagem).join('; ')}`);
  return { fase: carregarFase(r.fase), balance: BALANCE_PADRAO, conteudo, modo: modoPorId(conteudo, 'livre') };
}

function p95(valores: readonly number[]): number {
  if (valores.length === 0) return 0;
  const o = [...valores].sort((a, b) => a - b);
  return o[Math.min(o.length - 1, Math.floor(o.length * 0.95))] ?? 0;
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
  const agoraMs = () => relogioDoNavegador.agoraMs();
  const sala = new SalaArena(ctx, { semente: Date.now() % 100_000, versaoConteudo: versaoDoConteudo() });
  const rede = new RedeLocal(condicao, 2026);

  const conectarCliente = (nome: string) => {
    const { cliente, servidor } = rede.conectar();
    ligarSala(sala, servidor);
    return new ClienteArena({ ctx, transporte: cliente, nome, pedidoFicha: { classeId: 'aventureiro' }, agoraMs });
  };
  const eu = conectarCliente('Você');
  const outro = conectarCliente('Bot');
  const bot = new BotDeArena(outro, 7, 0.6);

  // Antes do bemVindo, a cena desenha um estado vazio da fase.
  const vazio = criarEstado({ semente: 0, faseId: ctx.fase.id });
  const classe = ctx.conteudo.classes.get('aventureiro');
  const habilidades = (classe?.habilidades ?? []).map((id) => ctx.conteudo.habilidades.get(id)).filter((h): h is Habilidade => h !== undefined);

  const cena = await montarCena({
    raiz,
    ctx,
    idLocal: 'p1',
    habilidades,
    estado: () => eu.previsto ?? vazio,
    emitir: (cmd) => {
      eu.enviarComando(cmd);
    },
  });
  if (!cena) return;
  // Os eventos da sala (dano, coleta, mortes) alimentam o mesmo feedback da campanha.
  eu.aoEventos = (eventos) => {
    for (const ev of eventos) cena.bus.emitir(ev.t, ev);
  };

  // O bot só entra depois de você: assim você é sempre o jogador p1 da sala.
  eu.entrar();
  let botEntrou = false;
  iniciarLaco({
    simular: (dtMs) => {
      rede.bombear(agoraMs());
      sala.tick(dtMs);
      if (!botEntrou && eu.conectado) {
        outro.entrar();
        botEntrou = true;
      }
      bot.agir();
      outro.passo();
      eu.passo();
    },
    renderizar: (alpha) => {
      const id = eu.entidadeId ?? 'p1';
      cena.quadro({
        alpha,
        agoraMs: agoraMs(),
        posicao: (e) => (e.id === id ? eu.posicaoVisualPropria() : eu.posicaoRemota(e.id)) ?? { x: e.x, y: e.y },
        rede: {
          rttMs: eu.rttMs,
          latenciaSimuladaMs: condicao.latenciaMs,
          erroP95: p95(eu.erros.slice(-JANELA_ERROS)),
          conectado: eu.conectado && !!(eu.previsto && buscarEntidade(eu.previsto, id)),
        },
      });
    },
  });
}
