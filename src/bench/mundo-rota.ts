// Marco 55 (26/11/2026, D-208): `?bench=mundo&rota=<id>,<id>,...[&vel=8]` anda pelo Mundo contínuo cruzando as
// costuras, sem servidor: o atlas do cliente, o trabalhador que gera as regiões e a cena do jogo, como no Mundo
// (ui/mundo-continuo-tela.ts). O jogador vai da vila da primeira região ao cruzamento com a próxima, à vila dela, e
// assim por diante, a `vel` células por segundo (sem colisão: mede o desenho, não o caminho). A medida sai no painel e
// em `window.__rota`: o p95 e o pior quadro da rota e o pior quadro em volta de cada costura (de 1 s antes a 2 s
// depois de mudar de zona). Meta do D-208: nenhum quadro acima de 100 ms numa costura num aparelho de verdade.

import { conteudoOficial, modoPorId } from '../core/conteudo';
import type { Celula } from '../core/comandos';
import { criarEstado } from '../core/estado';
import { simular, type EventoSimulacao } from '../core/simulacao';
import { criarJogador } from '../entities/fabrica';
import { costuraDoLado, paraOAtlas, type Atlas } from '../mundo/atlas';
import { cruzamento } from '../mundo/orientacao-atlas';
import { LADOS, reinoDoConteudo, type LadoDaRegiao, type Reino } from '../mundo/reino';
import { iniciarLaco } from '../plataforma/laco-navegador';
import { Interpolador } from '../render/interpolacao';
import { montarCena } from '../ui/cena';
import { mundoContinuoNaTela } from '../ui/mundo-continuo-tela';

export interface MedidaDaRota {
  rota: string[];
  quadros: number;
  p95Ms: number;
  piorMs: number;
  /** Quadros acima de 100 ms na rota inteira. */
  acimaDe100: number;
  costuras: { de: string; para: string; piorMs: number }[];
  segundos: number;
}

/** O ponto de chegada numa região: a vila (no atlas), ou o meio da área. */
function chegadaNa(reino: Reino, atlas: Atlas, id: string): Celula | null {
  const a = atlas.areas.get(id);
  const r = reino.regioes.find((x) => x.id === id);
  if (!a || !r) return null;
  return r.vila ? paraOAtlas(a, r.vila.x, r.vila.y + 2) : { x: a.x + (a.largura >> 1), y: a.y + (a.altura >> 1) };
}

/** O lado de `de` que dá em `para` por uma costura aberta. */
function ladoEntre(atlas: Atlas, de: string, para: string): LadoDaRegiao | null {
  for (const l of LADOS) {
    const c = costuraDoLado(atlas, de, l);
    if (c && (c.a === para || c.b === para)) return l;
  }
  return null;
}

export async function iniciarRotaNoAtlas(raiz: HTMLElement, params: URLSearchParams, aoMedir: (m: MedidaDaRota) => void): Promise<void> {
  const conteudo = conteudoOficial();
  const reino = reinoDoConteudo(conteudo);
  const mundo = mundoContinuoNaTela(conteudo, reino, modoPorId(conteudo, 'mundo'));
  const atlas = mundo.atlas.atlas;
  const rota = (params.get('rota') ?? '').split(',').filter((id) => atlas.areas.has(id));
  const vel = Math.max(1, Number(params.get('vel')) || 8);
  // Os pontos da rota: a vila da primeira, e para cada próxima o cruzamento (se a costura é aberta) e a vila dela.
  const pontos: Celula[] = [];
  for (let i = 0; i < rota.length; i++) {
    const id = rota[i] ?? '';
    const antes = rota[i - 1];
    const lado = antes ? ladoEntre(atlas, antes, id) : null;
    const c = antes && lado ? cruzamento(atlas, antes, lado) : null;
    if (c) pontos.push(c, { x: c.x + (lado === 'leste' ? 2 : lado === 'oeste' ? -2 : 0), y: c.y + (lado === 'sul' ? 2 : lado === 'norte' ? -2 : 0) });
    const v = chegadaNa(reino, atlas, id);
    if (v) pontos.push(v);
  }
  const inicio = pontos[0];
  const classe = conteudo.classes.get(params.get('classe') ?? 'guerreiro') ?? [...conteudo.classes.values()][0];
  if (!inicio || !classe) return;
  await mundo.esperarRegiao(inicio.x, inicio.y, 60_000);
  const ctx = mundo.atlas.ctx;
  const estado = criarEstado({ semente: 1, faseId: ctx.fase.id });
  const jogador = criarJogador(classe, 'local', inicio.x, inicio.y, ctx.balance);
  estado.entidades.push(jogador);
  const cena = await montarCena({ raiz, ctx, idLocal: jogador.id, estado: () => estado, emitir: () => {}, pausaOJogo: false, atlas: mundo.desenho });
  if (!cena) return;
  const interp = new Interpolador();
  const eventos: EventoSimulacao[] = [];
  const quadros: { t: number; dt: number }[] = [];
  const mudancas: { t: number; de: string; para: string }[] = [];
  let zona = mundo.zonaDe(jogador.x, jogador.y);
  let alvo = 1;
  const t0 = performance.now();
  let ultimo = t0;
  let medido = false;
  iniciarLaco({
    simular: (dtMs) => {
      interp.registrarAntesDoTick(estado);
      eventos.length = 0;
      simular(estado, ctx, [], eventos, dtMs);
      // O jogador anda em linha reta até o próximo ponto da rota.
      const p = pontos[alvo];
      if (!p) return;
      const dx = p.x - jogador.x;
      const dy = p.y - jogador.y;
      const d = Math.hypot(dx, dy);
      const passo = (vel * dtMs) / 1000;
      if (d <= passo) {
        jogador.x = p.x;
        jogador.y = p.y;
        alvo++;
      } else {
        jogador.x += (dx / d) * passo;
        jogador.y += (dy / d) * passo;
      }
      mundo.seguir(jogador.x, jogador.y);
      const agora = mundo.zonaDe(jogador.x, jogador.y);
      if (agora && agora !== zona) {
        mudancas.push({ t: performance.now(), de: zona ?? '', para: agora });
        zona = agora;
      }
    },
    renderizar: (alpha) => {
      const agora = performance.now();
      if (agora - t0 > 2000) quadros.push({ t: agora, dt: agora - ultimo });
      ultimo = agora;
      cena.quadro({ alpha, agoraMs: agora, posicao: (e) => interp.posicao(e, alpha), aoRemover: (i) => { interp.esquecer(i); } });
      if (!medido && alvo >= pontos.length) {
        medido = true;
        const dts = quadros.map((q) => q.dt).sort((a, b) => a - b);
        const medida: MedidaDaRota = {
          rota,
          quadros: dts.length,
          p95Ms: Math.round(dts[Math.floor(dts.length * 0.95)] ?? 0),
          piorMs: Math.round(dts.at(-1) ?? 0),
          acimaDe100: dts.filter((v) => v > 100).length,
          costuras: mudancas.map((m) => ({ de: m.de, para: m.para, piorMs: Math.round(Math.max(0, ...quadros.filter((q) => q.t > m.t - 1000 && q.t < m.t + 2000).map((q) => q.dt))) })),
          segundos: Math.round((agora - t0) / 1000),
        };
        (globalThis as { __rota?: MedidaDaRota }).__rota = medida;
        console.info('rota no atlas', JSON.stringify(medida));
        aoMedir(medida);
      }
    },
  });
}
