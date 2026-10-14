// Proxy TCP de rede degradada (§5.6). Marco 7B (13/10/2026), D-045.
// Fica entre o cliente e um servidor `ws://` e aplica, em cada sentido, metade do RTT ± metade do
// jitter. A ordem dos bytes é preservada, como no TCP: nada ultrapassa o que veio antes. Uma
// "perda" vira retransmissão (atraso de RTO) que segura também tudo o que vem atrás
// (head-of-line blocking), que é o efeito real de perder um pacote num WebSocket.
//
//   npx tsx tools/rede/proxy.ts --destino localhost:2567 --porta 2600 --perfil degradado

import net from 'node:net';
import { parseArgs } from 'node:util';
import { aleatorio, criarRng, type EstadoRng } from '../../src/core/rng';
import perfis from './perfis.json';

export interface PerfilDeRede {
  rttMs: number;
  jitterMs: number;
  /** Fração de segmentos "perdidos" (0–1), cada um atrasado pela retransmissão. */
  perda: number;
  retransmissaoMs: number;
}

export const PERFIS: Readonly<Record<string, PerfilDeRede>> = perfis;

/**
 * Quando um bloco que chegou em `agoraMs` pode sair, dado quando saiu o anterior no mesmo sentido.
 * Puro e testável: a ordem é garantida por `max(anterior, ...)`.
 */
export function proximaLiberacao(anteriorMs: number, agoraMs: number, p: PerfilDeRede, rng: EstadoRng): number {
  let atraso = p.rttMs / 2 + (aleatorio(rng) * 2 - 1) * (p.jitterMs / 2);
  if (aleatorio(rng) < p.perda) atraso += p.retransmissaoMs;
  return Math.max(anteriorMs, agoraMs + Math.max(0, atraso));
}

export interface Proxy {
  porta: number;
  encerrar: () => Promise<void>;
}

export interface OpcoesProxy {
  /** 0 = porta livre qualquer. */
  porta: number;
  destinoHost: string;
  destinoPorta: number;
  perfil: PerfilDeRede;
  semente?: number;
}

/**
 * Um sentido da conexão: fila FIFO com horário de saída e um único temporizador. Vários
 * `setTimeout` com o mesmo vencimento não têm ordem garantida no Node, e trocar a ordem dos bytes
 * corrompe o WebSocket; com a fila, a saída é sempre na ordem de chegada.
 */
function canal(saida: net.Socket, perfil: PerfilDeRede, rng: EstadoRng): (bloco: Buffer) => void {
  let ultima = 0;
  const fila: { quando: number; bloco: Buffer }[] = [];
  let temporizador: ReturnType<typeof setTimeout> | null = null;
  const drenar = () => {
    temporizador = null;
    const agora = performance.now();
    while (fila[0] && fila[0].quando <= agora) {
      const item = fila.shift();
      if (item && !saida.destroyed) saida.write(item.bloco);
    }
    agendar();
  };
  const agendar = () => {
    const proximo = fila[0];
    if (!proximo || temporizador) return;
    temporizador = setTimeout(drenar, Math.max(0, proximo.quando - performance.now()));
  };
  return (bloco) => {
    const quando = proximaLiberacao(ultima, performance.now(), perfil, rng);
    ultima = quando;
    fila.push({ quando, bloco });
    agendar();
  };
}

export function iniciarProxy(o: OpcoesProxy): Promise<Proxy> {
  const rng = criarRng(o.semente ?? 7);
  const conexoes = new Set<net.Socket>();
  const servidor = net.createServer((cliente) => {
    const destino = net.connect(o.destinoPorta, o.destinoHost);
    conexoes.add(cliente);
    conexoes.add(destino);
    const ida = canal(destino, o.perfil, rng);
    const volta = canal(cliente, o.perfil, rng);
    cliente.on('data', ida);
    destino.on('data', volta);
    const fechar = () => {
      // Fecha depois de entregar o que ainda está na fila (até um RTO).
      setTimeout(() => {
        cliente.destroy();
        destino.destroy();
        conexoes.delete(cliente);
        conexoes.delete(destino);
      }, o.perfil.rttMs + o.perfil.retransmissaoMs);
    };
    cliente.on('close', fechar);
    destino.on('close', fechar);
    cliente.on('error', fechar);
    destino.on('error', fechar);
  });
  return new Promise((resolver, rejeitar) => {
    servidor.once('error', rejeitar);
    servidor.listen(o.porta, '127.0.0.1', () => {
      const endereco = servidor.address();
      resolver({
        porta: typeof endereco === 'object' && endereco ? endereco.port : o.porta,
        encerrar: () =>
          new Promise<void>((pronto) => {
            for (const c of conexoes) c.destroy();
            servidor.close(() => {
              pronto();
            });
          }),
      });
    });
  });
}

if (process.argv[1]?.includes('proxy')) {
  const { values } = parseArgs({
    options: {
      destino: { type: 'string', default: 'localhost:2567' },
      porta: { type: 'string', default: '2600' },
      perfil: { type: 'string', default: 'suportado' },
    },
  });
  const perfil = PERFIS[values.perfil];
  const [host = 'localhost', porta = '2567'] = values.destino.split(':');
  if (!perfil) {
    console.error(`perfil desconhecido: ${values.perfil} (use ${Object.keys(PERFIS).join(' ou ')})`);
    process.exit(2);
  }
  const p = await iniciarProxy({ porta: Number(values.porta), destinoHost: host, destinoPorta: Number(porta), perfil });
  console.log(`Proxy ${values.perfil} em ws://127.0.0.1:${p.porta} → ${host}:${porta}`);
}
