// Benchmarks do cliente no navegador (marco 16, 15/10/2026, D-062, §5.6):
//   ?bench=carga|padrao[&segundos=60][&qualidade=minimo|baixo|medio|alto]
//     a cena roda com simulação local e bots (sem rede) e mede os quadros depois de 2 s de aquecimento: fps, p50,
//     p95, p99, pausas acima de 100 ms, memória (quando o navegador expõe) e o pico de cada contagem da cena.
//   ?bench=trocas
//     monta e desmonta a cena padrão a cada clique em "Próxima fase" (como a troca de fase do cooperativo), para a
//     ferramenta medir o heap depois de cada uma (tools/bench).
// O resultado fica na página (painel e JSON em #resultado-bench) — no celular, basta abrir o endereço e ler.

import { completarProjeteis, contagens, montarCenaBench, PROJETEIS_BENCH, type TipoBench } from './bench/cena-bench';
import { conteudoOficial } from './core/conteudo';
import type { ComandoDoTick } from './core/comandos';
import { criarRng } from './core/rng';
import { simular, type EventoSimulacao } from './core/simulacao';
import { iniciarLaco } from './plataforma/laco-navegador';
import { gravarPreferencias, lerPreferencias, QUALIDADES } from './plataforma/preferencias';
import { Interpolador } from './render/interpolacao';
import { montarCena, type Cena } from './ui/cena';

const AQUECIMENTO_MS = 2000;
const PAUSA_MS = 100;

export interface ResultadoBench {
  cena: TipoBench;
  qualidade: string;
  segundos: number;
  quadros: number;
  fps: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  pausas: number;
  memoriaInicialMb: number | null;
  memoriaFinalMb: number | null;
  pico: ReturnType<typeof contagens>;
  largura: number;
  altura: number;
  dpr: number;
  agente: string;
}

const percentil = (v: readonly number[], p: number) => {
  const o = [...v].sort((a, b) => a - b);
  return o[Math.min(o.length - 1, Math.floor(o.length * p))] ?? 0;
};
const r2 = (v: number) => Math.round(v * 100) / 100;

/** Memória do heap em MB, quando o navegador expõe (`performance.memory`, Chromium). */
function memoriaMb(): number | null {
  const m = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
  return m ? r2(m.usedJSHeapSize / 1024 / 1024) : null;
}

interface Execucao {
  cena: Cena;
  parar: () => void;
}

/** Monta a cena e a roda; `aoQuadro` recebe a duração de cada quadro e as contagens. */
async function rodarCena(raiz: HTMLElement, tipo: TipoBench, aoQuadro?: (dtMs: number, c: ReturnType<typeof contagens>) => void): Promise<Execucao | null> {
  const c = montarCenaBench(tipo, conteudoOficial());
  const { estado, ctx } = c;
  const cena = await montarCena({
    raiz,
    ctx,
    idLocal: c.idLocal,
    estado: () => estado,
    // O jogador local também é bot: a entrada da pessoa não chega à simulação.
    emitir: () => undefined,
    pausaOJogo: false,
  });
  if (!cena) return null;
  const rng = criarRng(7);
  const interp = new Interpolador();
  const eventos: EventoSimulacao[] = [];
  let iniciais = c.iniciais;
  let ultimo = performance.now();
  const parar = iniciarLaco({
    simular: (dtMs) => {
      interp.registrarAntesDoTick(estado);
      eventos.length = 0;
      const comandos: ComandoDoTick[] = iniciais.map((x) => ({ tick: estado.tick, ...x }));
      iniciais = [];
      for (const b of c.bots) for (const cmd of b.agir(estado, ctx)) comandos.push({ tick: estado.tick, entidadeId: b.id, cmd });
      completarProjeteis(estado, ctx, PROJETEIS_BENCH[tipo], rng, eventos);
      simular(estado, ctx, comandos, eventos, dtMs);
      for (const ev of eventos) cena.bus.emitir(ev.t, ev);
    },
    renderizar: (alpha) => {
      const agora = performance.now();
      aoQuadro?.(agora - ultimo, contagens(estado));
      ultimo = agora;
      cena.quadro({ alpha, agoraMs: agora, posicao: (e) => interp.posicao(e, alpha), aoRemover: (id) => { interp.esquecer(id); } });
    },
  });
  return { cena, parar };
}

function painel(raiz: HTMLElement, linhas: string[], json: unknown): void {
  const p = document.createElement('section');
  p.className = 'resultado-bench';
  p.setAttribute('role', 'status');
  const pre = document.createElement('pre');
  pre.textContent = linhas.join('\n');
  const dados = document.createElement('script');
  dados.type = 'application/json';
  dados.id = 'resultado-bench';
  dados.textContent = JSON.stringify(json);
  p.append(pre, dados);
  (raiz.querySelector('.camada-ui') ?? raiz).append(p);
}

export async function iniciarBench(raiz: HTMLElement, params: URLSearchParams): Promise<void> {
  const qualidade = params.get('qualidade');
  const nivel = QUALIDADES.find((q) => q === qualidade);
  if (nivel) gravarPreferencias({ ...lerPreferencias(), qualidade: nivel });
  const pedido = params.get('bench');

  if (pedido === 'trocas') {
    await iniciarTrocas(raiz);
    return;
  }
  const tipo: TipoBench = pedido === 'carga' ? 'carga' : 'padrao';
  const segundos = Math.min(600, Math.max(5, Number(params.get('segundos')) || 60));
  const quadros: number[] = [];
  const pico = { npcs: 0, invocacoes: 0, avatares: 0, armadilhas: 0, projeteis: 0 };
  const inicio = performance.now();
  let memoriaInicial: number | null = null;
  let terminado = false;
  const exec = await rodarCena(raiz, tipo, (dtMs, c) => {
    const decorrido = performance.now() - inicio;
    if (terminado || decorrido < AQUECIMENTO_MS) return;
    memoriaInicial ??= memoriaMb();
    quadros.push(dtMs);
    for (const k of Object.keys(pico) as (keyof typeof pico)[]) pico[k] = Math.max(pico[k], c[k]);
    if (decorrido < AQUECIMENTO_MS + segundos * 1000) return;
    terminado = true;
    terminar();
  });
  const terminar = () => {
    exec?.parar();
    const media = quadros.reduce((s, v) => s + v, 0) / Math.max(1, quadros.length);
    const r: ResultadoBench = {
      cena: tipo,
      qualidade: lerPreferencias().qualidade,
      segundos,
      quadros: quadros.length,
      fps: r2(1000 / Math.max(1, media)),
      p50Ms: r2(percentil(quadros, 0.5)),
      p95Ms: r2(percentil(quadros, 0.95)),
      p99Ms: r2(percentil(quadros, 0.99)),
      pausas: quadros.filter((q) => q > PAUSA_MS).length,
      memoriaInicialMb: memoriaInicial,
      memoriaFinalMb: memoriaMb(),
      pico,
      largura: innerWidth,
      altura: innerHeight,
      dpr: devicePixelRatio,
      agente: navigator.userAgent,
    };
    painel(
      raiz,
      [
        `Benchmark ${r.cena} · qualidade ${r.qualidade} · ${String(r.segundos)} s · ${String(r.largura)}×${String(r.altura)} @${String(r.dpr)}`,
        `fps ${String(r.fps)} · p50 ${String(r.p50Ms)} ms · p95 ${String(r.p95Ms)} ms · p99 ${String(r.p99Ms)} ms · pausas > 100 ms: ${String(r.pausas)}`,
        `memória ${String(r.memoriaInicialMb ?? '—')} → ${String(r.memoriaFinalMb ?? '—')} MB`,
        `pico: ${String(pico.npcs)} NPCs, ${String(pico.invocacoes)} invocações, ${String(pico.avatares)} avatares, ${String(pico.armadilhas)} armadilhas, ${String(pico.projeteis)} projéteis`,
      ],
      r,
    );
    document.body.dataset.bench = 'pronto';
  };
}

/** Troca de fase repetida, no mesmo documento: a ferramenta mede o heap depois de cada uma. */
async function iniciarTrocas(raiz: HTMLElement): Promise<void> {
  const host = document.createElement('div');
  host.className = 'host-bench';
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.id = 'bench-trocar';
  botao.textContent = 'Próxima fase';
  raiz.textContent = '';
  raiz.append(host, botao);
  let exec: Execucao | null = null;
  let trocas = 0;
  const trocar = async () => {
    botao.disabled = true;
    exec?.parar();
    exec?.cena.desmontar();
    exec = await rodarCena(host, 'padrao');
    // Deixa a cena rodar um pouco antes de liberar a próxima medida.
    await new Promise((r) => setTimeout(r, 1500));
    trocas++;
    document.body.dataset.trocas = String(trocas);
    botao.disabled = false;
  };
  botao.addEventListener('click', () => void trocar());
  await trocar();
}
