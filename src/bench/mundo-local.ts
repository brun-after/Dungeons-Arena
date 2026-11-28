// A vista local do Mundo (marco 43, 15/11/2026, D-177): `?bench=mundo&regiao=<id>[&x=..&y=..][&segundos=..][&hora=..]`
// e, desde o D-202 (22/11/2026), `&troca=<id>` para medir a troca de região. Marco 56 (27/11/2026, D-209):
// `&lugar=masmorra:<id>[:<andar>]` (ou `covil:<id>`) abre um interior, para ver as escadas e o andar.
// Monta a região do Mundo na própria página, sem servidor (a mesma geração e a mesma cena do jogo), com o jogador
// local controlável no ponto pedido (ou na chegada). Serve para ver o relevo, os objetos e a luz de cada região e
// para medir os quadros no exterior (a medida sai no painel depois de `segundos`, como os outros benchmarks).

import { conteudoOficial } from '../core/conteudo';
import { modoPorId } from '../core/conteudo';
import type { Comando, ComandoDoTick } from '../core/comandos';
import { simular, type EventoSimulacao } from '../core/simulacao';
import { criarJogador } from '../entities/fabrica';
import { lerLugar, montarLugar } from '../mundo/lugares';
import { reinoDoConteudo } from '../mundo/reino';
import { iniciarLaco } from '../plataforma/laco-navegador';
import { Interpolador } from '../render/interpolacao';
import { montarCena, type Cena } from '../ui/cena';
import { passavel } from '../world/fase';

export interface MedidaMundo {
  regiao: string;
  quadros: number;
  fps: number;
  p95Ms: number;
}

export async function iniciarMundoLocal(raiz: HTMLElement, params: URLSearchParams, aoMedir: (m: MedidaMundo) => void): Promise<void> {
  const conteudo = conteudoOficial();
  const reino = reinoDoConteudo(conteudo);
  const id = params.get('regiao') ?? 'vila_do_centro';
  const regiao = reino.regioes.find((r) => r.id === id) ?? reino.regioes[0];
  if (!regiao) return;
  const pedido = lerLugar(reino, params.get('lugar'));
  const { ctx, estado } = montarLugar(conteudo, reino, pedido && pedido.tipo !== 'mundo' ? pedido : { tipo: 'regiao', regiao }, modoPorId(conteudo, 'mundo'));
  const classe = conteudo.classes.get(params.get('classe') ?? 'guerreiro') ?? [...conteudo.classes.values()][0];
  if (!classe) return;
  const chegada = ctx.fase.spawns[0] ?? { x: 2, y: 2 };
  let x = Number(params.get('x') ?? chegada.x);
  let y = Number(params.get('y') ?? chegada.y);
  // O ponto pedido pode cair na rocha ou na água: o chão andável mais perto.
  if (!passavel(ctx.fase, x, y)) {
    let melhor = chegada;
    let dist = Infinity;
    for (let j = 0; j < ctx.fase.altura; j++) for (let i = 0; i < ctx.fase.largura; i++) {
      const d = Math.hypot(i - x, j - y);
      if (d < dist && passavel(ctx.fase, i, j)) {
        dist = d;
        melhor = { x: i, y: j };
      }
    }
    ({ x, y } = melhor);
  }
  const jogador = criarJogador(classe, 'local', x, y, ctx.balance);
  // Marco 43 (D-177): `&tocha=1` acende a tocha (para ver a tocha portada e a luz dela sem o item).
  if (params.get('tocha') === '1') jogador.efeitos.push({ tipo: 'tocha', ateTick: 10_000_000, origemId: jogador.id, valor: 0, pct: 0, proximoTick: 0, interno: null, ref: null, inicioTick: 0, acumulos: 1 });
  estado.entidades.push(jogador);
  const fila: Comando[] = [];
  const cena = await montarCena({ raiz, ctx, idLocal: jogador.id, estado: () => estado, emitir: (cmd) => { fila.push(cmd); }, pausaOJogo: false });
  if (!cena) return;
  const interp = new Interpolador();
  const eventos: EventoSimulacao[] = [];
  const segundos = Number(params.get('segundos') ?? 0);
  const quadros: number[] = [];
  const inicio = performance.now();
  let ultimo = inicio;
  let medido = false;
  iniciarLaco({
    simular: (dtMs) => {
      interp.registrarAntesDoTick(estado);
      eventos.length = 0;
      const comandos: ComandoDoTick[] = fila.splice(0).map((cmd) => ({ tick: estado.tick, entidadeId: jogador.id, cmd }));
      simular(estado, ctx, comandos, eventos, dtMs);
      for (const ev of eventos) cena.bus.emitir(ev.t, ev);
    },
    renderizar: (alpha) => {
      const agora = performance.now();
      if (agora - inicio > 2000) quadros.push(agora - ultimo);
      ultimo = agora;
      cena.quadro({ alpha, agoraMs: agora, posicao: (e) => interp.posicao(e, alpha), aoRemover: (i) => { interp.esquecer(i); } });
      if (segundos > 0 && !medido && agora - inicio > 2000 + segundos * 1000) {
        medido = true;
        const ordenados = [...quadros].sort((a, b) => a - b);
        const media = quadros.reduce((s, v) => s + v, 0) / Math.max(1, quadros.length);
        aoMedir({ regiao: regiao.id, quadros: quadros.length, fps: Math.round(1000 / Math.max(1, media)), p95Ms: Math.round((ordenados[Math.floor(ordenados.length * 0.95)] ?? 0) * 100) / 100 });
      }
    },
  });
  // 22/11/2026 (D-202): `&troca=<id>[,<id>...]` mede as trocas de região, uma depois da outra (a cena de lá montada
  // por cima e a de antes tirada, como no Mundo). As medidas ficam em `window.__trocas` quando todas terminam.
  const trocas = (params.get('troca') ?? '').split(',').filter(Boolean);
  if (trocas.length > 0) setTimeout(() => { void medirTrocas(raiz, trocas, classe.id); }, 3000);
}

async function medirTrocas(raiz: HTMLElement, ids: readonly string[], classeId: string): Promise<void> {
  const medidas: MedidaDaTroca[] = [];
  let anterior: Cena | null = null;
  for (const id of ids) {
    const r = await medirTroca(raiz, id, classeId);
    if (!r) break;
    anterior?.desmontar();
    anterior = r.cena;
    medidas.push(r.medida);
  }
  (globalThis as { __trocas?: MedidaDaTroca[] }).__trocas = medidas;
}

/** O que a medida da troca anota (em `window.__troca` e no console). */
export interface MedidaDaTroca {
  /** Gerar o mapa de lá, montar a cena e esperar o chão à vista (ms). */
  lugarMs: number;
  cenaMs: number;
  chaoMs: number;
  totalMs: number;
  /** O tempo de JavaScript de cada quadro da cena nova até o chão ficar pronto. */
  quadrosMs: number[];
  /** O maior intervalo entre dois quadros da página, da montagem até 1,5 s depois do chão pronto. */
  maiorQuadroMs: number;
  regiao: string;
}

/**
 * 22/11/2026 (D-202): monta a região `id` por cima da de agora, escondida até o chão à vista ficar pronto, como a
 * troca de sala do Mundo (mundo-tela.ts), e mede cada etapa. Sem servidor: a conexão fica de fora.
 */
async function medirTroca(raiz: HTMLElement, id: string, classeId: string): Promise<{ cena: Cena; medida: MedidaDaTroca } | null> {
  const conteudo = conteudoOficial();
  const reino = reinoDoConteudo(conteudo);
  const regiao = reino.regioes.find((r) => r.id === id);
  const classe = conteudo.classes.get(classeId);
  if (!regiao || !classe) return null;
  const t0 = performance.now();
  let maior = 0;
  let ultimo = t0;
  let vigiando = true;
  const vigiar = () => {
    const agora = performance.now();
    maior = Math.max(maior, agora - ultimo);
    ultimo = agora;
    if (vigiando) requestAnimationFrame(vigiar);
  };
  requestAnimationFrame(vigiar);
  const { ctx, estado } = montarLugar(conteudo, reino, { tipo: 'regiao', regiao }, modoPorId(conteudo, 'mundo'));
  const lugarMs = performance.now() - t0;
  const chegada = ctx.fase.spawns[0] ?? { x: 2, y: 2 };
  estado.entidades.push(criarJogador(classe, 'local', chegada.x, chegada.y, ctx.balance));
  const camada = document.createElement('div');
  camada.className = 'camada-mundo';
  camada.style.visibility = 'hidden';
  raiz.append(camada);
  const t1 = performance.now();
  const cena = await montarCena({ raiz: camada, ctx, idLocal: 'local', estado: () => estado, emitir: () => {}, pausaOJogo: false });
  const cenaMs = performance.now() - t1;
  if (!cena) return null;
  const t2 = performance.now();
  const quadrosMs: number[] = [];
  const interp = new Interpolador();
  await new Promise<void>((pronto) => {
    const passo = () => {
      const q0 = performance.now();
      cena.quadro({ alpha: 1, agoraMs: q0, posicao: (e) => interp.posicao(e, 1) });
      quadrosMs.push(Math.round(performance.now() - q0));
      if (cena.mundo.chaoPronto() || performance.now() - t2 > 8000) pronto();
      else requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  });
  const chaoMs = performance.now() - t2;
  camada.style.visibility = '';
  const totalMs = performance.now() - t0;
  await new Promise((r) => setTimeout(r, 1500));
  vigiando = false;
  const medida: MedidaDaTroca = { regiao: id, lugarMs: Math.round(lugarMs), cenaMs: Math.round(cenaMs), chaoMs: Math.round(chaoMs), totalMs: Math.round(totalMs), quadrosMs, maiorQuadroMs: Math.round(maior) };
  console.info('troca de região', JSON.stringify(medida));
  return { cena, medida };
}
