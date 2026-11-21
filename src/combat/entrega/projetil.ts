// Marco 49 (21/11/2026, D-194): monta os projéteis da entrega — a rota de cada um (pela trajetória e pela origem), a
// força (o custo e a compensação de cada eixo) e o tempo de saída (a salva e os grãos). Puro e determinístico: a
// semente das rotas sai do id do projétil, sem gastar o RNG do estado.

import type { Celula } from '../../core/comandos';
import type { ContextoSimulacao } from '../../core/contexto';
import { novoId, type EstadoJogo, type Projetil } from '../../core/estado';
import type { EventoSimulacao } from '../../core/eventos-simulacao';
import { ticksDe } from '../../core/tempo';
import type { Entidade } from '../../entities/entidade';
import type { FonteDeDano } from '../dano';
import { projeteisAtravessam } from '../efeitos';
import type { Habilidade } from '../habilidades';
import type { RegrasEntrega } from './regras';
import { comprimento, direcaoEm, hash01, type Rota, type TipoRota } from './rota';
import type { Entrega } from './tipos';

/** Um projétil a lançar: de onde sai, o tipo da rota, o lado, o desvio, a força e quando sai. */
export interface TiroPlanejado {
  de: { x: number; y: number };
  para: Celula;
  tipo: TipoRota;
  lado: 1 | -1;
  desvio: number;
  mult: number;
  saiEmMs: number;
  /** O par convergente: o índice do irmão neste plano. */
  par?: number;
}

/** O fator de força do golpe pela escolha de cada eixo que não divide em partes (o grimório, "custo no orçamento"). */
export function fatorDaEntrega(e: Entrega, r: RegrasEntrega): number {
  let f = 1;
  if (e.trajetoria === 'parabola') f *= r.parabola.danoPct / 100;
  if (e.trajetoria === 'caotica') f *= r.caotica.danoPct / 100;
  if (e.trajetoria === 'orbita') f *= r.orbita.danoPct / 100;
  if (e.origem === 'chao') f *= r.chao.danoPct / 100;
  if (e.corpo === 'grande') f *= r.grande.danoPct / 100;
  if (e.marca === 'chao') f *= r.marca.golpePct / 100;
  if (e.permanencia === 'gira') f *= r.gira.golpePct / 100;
  if (e.permanencia === 'pulsa') f *= r.pulsa.golpePct / 100;
  if (e.permanencia === 'erupcao') f *= r.erupcao.golpePct / 100;
  if (e.sentido === 'volta') f *= r.volta.danoPct / 100;
  return f;
}

/** A parte de cada um quando o golpe se divide em N (círculos, salva): N × (100/N + extra)%. */
const parte = (n: number, extraPct: number): number => (n <= 1 ? 1 : (100 / n + extraPct) / 100);

/** Os pontos de onde a magia nasce (a mão, ou os círculos atrás ou à frente de quem lança). */
export function pontosDeOrigem(e: Entrega, r: RegrasEntrega, partida: Celula, destino: Celula): { x: number; y: number }[] {
  if (e.origem !== 'circulos_atras' && e.origem !== 'circulos_frente') return [{ x: partida.x, y: partida.y }];
  const vx = destino.x - partida.x;
  const vy = destino.y - partida.y;
  const d = Math.hypot(vx, vy) || 1;
  const ux = vx / d;
  const uy = vy / d;
  const sinal = e.origem === 'circulos_atras' ? -1 : 1;
  const cx = partida.x + ux * r.circulos.distancia * sinal;
  const cy = partida.y + uy * r.circulos.distancia * sinal;
  const pontos: { x: number; y: number }[] = [];
  for (let i = 0; i < e.circulos; i++) {
    const off = (i - (e.circulos - 1) / 2) * r.circulos.abertura;
    pontos.push({ x: cx - uy * off, y: cy + ux * off });
  }
  return pontos;
}

/** O plano dos projéteis de um lançamento (origens × par convergente × salva × grãos), com o teto do balance. */
export function planejarTiros(e: Entrega, r: RegrasEntrega, partida: Celula, destino: Celula, semente: number, raioArea = 0): TiroPlanejado[] {
  const tipo: TipoRota = e.origem === 'ceu' ? 'queda' : e.origem === 'sob_alvo' ? 'coluna' : e.trajetoria;
  const origens = e.origem === 'ceu' || e.origem === 'sob_alvo' ? [{ x: destino.x, y: destino.y }] : pontosDeOrigem(e, r, partida, destino);
  const lados: (1 | -1)[] = e.trajetoria === 'convergente' ? [1, -1] : [1];
  const salva = e.cadencia === 'salva' ? e.quantidade : 1;
  // Os grãos cabem no teto de tiros por lançamento (a nuvem fica menor quando já há muitos círculos e uma salva).
  const outros = origens.length * lados.length * salva;
  const graos = e.corpo === 'graos' ? Math.max(3, Math.min(r.graos.quantidade, Math.floor(r.maxTiros / Math.max(1, outros)))) : 1;
  const multBase = parte(origens.length, r.circulos.extraPct) * parte(salva, r.salva.extraPct) * (lados.length > 1 ? r.convergente.pctCada / 100 : 1) * (graos > 1 ? r.graos.pctCada / 100 : 1);
  const plano: TiroPlanejado[] = [];
  for (let k = 0; k < salva; k++) {
    for (const de of origens) {
      for (let g = 0; g < graos; g++) {
        const desvio = graos > 1 ? (hash01(semente, plano.length + 7) * 2 - 1) * r.graos.espalhamento : 0;
        const saiEmMs = k * r.salva.intervaloMs + g * (graos > 1 ? r.graos.intervaloMs : 0);
        const inicio = plano.length;
        // Os grãos que caem do céu ou sobem do círculo se espalham pela área (cada um cai numa célula).
        const espalha = graos > 1 && (tipo === 'queda' || tipo === 'coluna') ? Math.max(1, raioArea) : 0;
        const para = espalha > 0
          ? { x: destino.x + Math.round((hash01(semente, plano.length + 31) * 2 - 1) * espalha), y: destino.y + Math.round((hash01(semente, plano.length + 53) * 2 - 1) * espalha) }
          : destino;
        for (const lado of lados) {
          plano.push({ de: espalha > 0 ? para : de, para, tipo, lado, desvio, mult: multBase, saiEmMs, ...(lados.length > 1 && { par: lado === 1 ? inicio + 1 : inicio }) });
        }
      }
    }
  }
  return plano;
}

/** A rota de um tiro planejado. */
export function rotaDe(t: TiroPlanejado, r: RegrasEntrega, semente: number): Rota {
  const dist = Math.hypot(t.para.x - t.de.x, t.para.y - t.de.y);
  const base: Rota = { tipo: t.tipo, ox: t.de.x, oy: t.de.y, dx: t.para.x, dy: t.para.y, semente, lado: t.lado, altura: 0, largura: 0, voltas: 0, giro: 0, desvio: t.desvio, comp: 0 };
  switch (t.tipo) {
    case 'parabola':
      base.altura = Math.max(r.parabola.alturaMin, dist * r.parabola.alturaPorCelula);
      break;
    case 'espiral':
      base.altura = r.espiral.raio;
      base.voltas = r.espiral.voltas;
      break;
    case 'convergente':
      base.largura = Math.min(r.convergente.largura, Math.max(0.6, dist * 0.35));
      break;
    case 'caotica':
      base.largura = r.caotica.largura;
      base.voltas = r.caotica.dobrasMin + Math.floor(hash01(semente, 99) * (r.caotica.dobrasMax - r.caotica.dobrasMin + 1));
      break;
    case 'orbita':
      base.altura = r.orbita.raio;
      base.giro = r.orbita.giro;
      break;
    case 'queda':
      base.altura = r.ceu.altura;
      break;
    default:
      break;
  }
  base.comp = comprimento(base);
  return base;
}

/** Um projétil da entrega, com a fonte congelada (como `lancarProjetil`) e já na rota. */
export function criarProjetil(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade, hab: Habilidade, acaoId: number, fonte: FonteDeDano, t: TiroPlanejado, saida: EventoSimulacao[]): Projetil {
  const r = ctx.balance.entrega;
  const e = hab.entrega;
  const id = novoId(estado);
  const semente = (id * 7919 + acaoId * 104729) | 0;
  const rota = rotaDe(t, r, semente);
  const d = direcaoEm(rota, 0);
  const fator = e ? fatorDaEntrega(e, r) : 1;
  const p: Projetil = {
    id,
    acaoId,
    donoId: ator.id,
    equipeDono: ator.equipe,
    habilidadeId: hab.id,
    chave: hab.chave,
    x: rota.ox,
    y: rota.oy,
    dirX: d.x,
    dirY: d.y,
    restante: rota.comp,
    velocidade: velocidadeDaEntrega(hab, r),
    bonusAtributo: fonte.bonusAtributo,
    carisma: fonte.carisma,
    multRolagem: fonte.multRolagem,
    potencia: fonte.potencia,
    multDano: fonte.multDano * t.mult * fator,
    multCura: fonte.multCura,
    atravessa: hab.perfura || e?.origem === 'chao' || projeteisAtravessam(ator, estado.tick),
    ...(fonte.d20Minimo ? { d20Minimo: fonte.d20Minimo } : {}),
    ...(hab.perfuraAlvos ? { perfuraExtra: hab.perfuraAlvos } : {}),
    atingidos: [],
    rota,
    t: 0,
    ...(t.saiEmMs > 0 && { saiEm: estado.tick + ticksDe(t.saiEmMs) }),
  };
  estado.projeteis.push(p);
  saida.push({ t: 'projetilLancado', tick: estado.tick, projetilId: p.id, acaoId, donoId: ator.id, habilidadeId: hab.id, chave: hab.chave });
  return p;
}

/** A velocidade pela entrega: a espiral e o grande são mais lentos, o chão mais rápido; a queda e a coluna duram o aviso. */
export function velocidadeDaEntrega(hab: Habilidade, r: RegrasEntrega): number {
  const e = hab.entrega;
  const base = hab.velocidadeProjetil > 0 ? hab.velocidadeProjetil : 12;
  if (!e) return base;
  if (e.origem === 'ceu') return 1000 / Math.max(50, r.ceu.quedaMs);
  if (e.origem === 'sob_alvo') return 1000 / Math.max(50, r.sobAlvo.avisoMs);
  let v = base;
  if (e.trajetoria === 'espiral') v *= r.espiral.velocidadePct / 100;
  if (e.corpo === 'grande') v *= r.grande.velocidadePct / 100;
  if (e.origem === 'chao') v *= r.chao.velocidadePct / 100;
  return v;
}

/** Liga os irmãos do par convergente (cada um sabe o id do outro). */
export function ligarPares(criados: readonly Projetil[], plano: readonly TiroPlanejado[]): void {
  plano.forEach((t, i) => {
    const p = criados[i];
    const irmao = t.par !== undefined ? criados[t.par] : undefined;
    if (p && irmao) p.parId = irmao.id;
  });
}
