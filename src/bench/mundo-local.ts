// A vista local do Mundo (marco 43, 15/11/2026, D-177): `?bench=mundo&regiao=<id>[&x=..&y=..][&segundos=..][&hora=..]`.
// Monta a região do Mundo na própria página, sem servidor (a mesma geração e a mesma cena do jogo), com o jogador
// local controlável no ponto pedido (ou na chegada). Serve para ver o relevo, os objetos e a luz de cada região e
// para medir os quadros no exterior (a medida sai no painel depois de `segundos`, como os outros benchmarks).

import { conteudoOficial } from '../core/conteudo';
import { modoPorId } from '../core/conteudo';
import type { Comando, ComandoDoTick } from '../core/comandos';
import { simular, type EventoSimulacao } from '../core/simulacao';
import { criarJogador } from '../entities/fabrica';
import { montarLugar } from '../mundo/lugares';
import { reinoDoConteudo } from '../mundo/reino';
import { iniciarLaco } from '../plataforma/laco-navegador';
import { Interpolador } from '../render/interpolacao';
import { montarCena } from '../ui/cena';
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
  const { ctx, estado } = montarLugar(conteudo, reino, { tipo: 'regiao', regiao }, modoPorId(conteudo, 'mundo'));
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
}
