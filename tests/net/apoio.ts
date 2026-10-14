import { digestPublico } from '../../src/arena/estado-publico';
import { versaoDoConteudo, type MensagemServidor } from '../../src/arena/protocolo';
import { SalaArena } from '../../src/arena/sala';
import { BALANCE_PADRAO, type ContextoSimulacao } from '../../src/core/contexto';
import { DT_MS } from '../../src/core/loop';
import arena01 from '../../src/data/fases/arena-01.json';
import { BotDeArena } from '../../src/net/bot';
import { ClienteArena } from '../../src/net/cliente';
import { ligarSala } from '../../src/net/ligacao';
import { RedeLocal, type CondicaoDeRede } from '../../src/net/rede-local';
import { carregarFase } from '../../src/world/fase';
import { validarFase } from '../../src/world/validacao-fase';
import { CONTEUDO, contexto } from '../apoio/fases';

export function ctxArena(): ContextoSimulacao {
  const r = validarFase(arena01, new Set(CONTEUDO.presets.keys()), CONTEUDO.itens);
  if (!r.ok) throw new Error(`arena-01 inválida: ${JSON.stringify(r.erros)}`);
  return contexto(carregarFase(r.fase), BALANCE_PADRAO, 'livre');
}

export function novaSala(semente = 1): SalaArena {
  return new SalaArena(ctxArena(), { semente, versaoConteudo: versaoDoConteudo() });
}

/** Conexão direta com a sala (sem rede), guardando as respostas já interpretadas. */
export function conexaoDireta(sala: SalaArena) {
  const recebidas: MensagemServidor[] = [];
  const conexao = sala.conectar((texto) => recebidas.push(JSON.parse(texto) as MensagemServidor));
  const enviar = (msg: unknown) => {
    conexao.receber(typeof msg === 'string' ? msg : JSON.stringify(msg));
  };
  const de = <T extends MensagemServidor['t']>(t: T) => recebidas.filter((m): m is Extract<MensagemServidor, { t: T }> => m.t === t);
  return { recebidas, enviar, de, conexao };
}

export interface Ambiente {
  sala: SalaArena;
  rede: RedeLocal;
  clientes: ClienteArena[];
  bots: BotDeArena[];
  /** Digest público do servidor em cada tick em que mandou estado. */
  digests: Map<number, string>;
  agoraMs: () => number;
  rodar: (ticks: number, aCadaTick?: () => void) => void;
}

/** Sala + rede simulada + N clientes (opcionalmente com bots), dirigidos por um relógio virtual. */
export function ambiente(condicao: CondicaoDeRede, n: number, opcoes: { semente?: number; bots?: boolean } = {}): Ambiente {
  const semente = opcoes.semente ?? 7;
  const sala = novaSala(semente);
  const rede = new RedeLocal(condicao, semente);
  let agora = 0;
  const agoraMs = () => agora;
  const clientes: ClienteArena[] = [];
  const bots: BotDeArena[] = [];
  for (let i = 0; i < n; i++) {
    const { cliente, servidor } = rede.conectar();
    ligarSala(sala, servidor);
    const c = new ClienteArena({ ctx: sala.ctx, transporte: cliente, nome: `C${i}`, pedidoFicha: { classeId: 'aventureiro' }, agoraMs });
    c.entrar();
    clientes.push(c);
    if (opcoes.bots) bots.push(new BotDeArena(c, semente * 100 + i));
  }
  const digests = new Map<number, string>();
  const rodar = (ticks: number, aCadaTick?: () => void) => {
    for (let i = 0; i < ticks; i++) {
      agora += DT_MS;
      rede.bombear(agora);
      sala.tick(DT_MS);
      if (sala.estado.tick % 3 === 0) digests.set(sala.estado.tick, digestPublico(sala.estado));
      for (const b of bots) b.agir();
      for (const c of clientes) c.passo();
      aCadaTick?.();
    }
  };
  return { sala, rede, clientes, bots, digests, agoraMs, rodar };
}

export function p95(valores: readonly number[]): number {
  if (valores.length === 0) return 0;
  const ordenados = [...valores].sort((a, b) => a - b);
  return ordenados[Math.min(ordenados.length - 1, Math.floor(ordenados.length * 0.95))] ?? 0;
}
