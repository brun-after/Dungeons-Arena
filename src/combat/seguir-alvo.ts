// Seguir alvo (marco 26, 28/10/2026, D-121). Com a opção ligada, o alvo selecionado e o básico automático, o
// personagem do jogador anda sozinho para manter o alvo no alcance do ataque básico:
// - fora do alcance, mas dentro da folga (à distância, mais 1/3 do alcance; corpo a corpo, mais 100%), segue o alvo;
//   além da folga, para e não persegue;
// - morto o alvo seguido, escolhe o hostil mais perto (à distância, no alcance; corpo a corpo, em até 4×) e segue;
// - o direcional manual tem a vez enquanto dura; na direção contrária à do alvo (mais de 120°), ou com um `irPara`,
//   cancela a automação para aquele alvo até outro ser escolhido.
// Números em `balance.seguirAlvo`. Só a ficha do jogador (quem manda o comando `seguirAlvo`); a IA não usa.
// Marco 26 (29/10/2026, D-121): para onde anda é o alcance da skill ofensiva PRONTA de menor alcance (o básico, se
// nenhuma da barra estiver pronta): o Guerreiro com o Redemoinho pronto chega a 1 célula sem assumir o controle. A folga
// para seguir quem foge e a troca depois do abate continuam medidas pelo básico.

import type { ContextoSimulacao } from '../core/contexto';
import { buscarEntidade, type EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { vivo, type Entidade } from '../entities/entidade';
import { pararMovimento, planejarCaminho } from '../world/movimento';
import { alcanceDe, alvoAtual, autoAlvo, custoDaHabilidade, podePagar, recargaRestante } from './acao';
import { celulaOcupada } from './geometria';
import type { Habilidade } from './habilidades';
import { habilidadeDoAtor } from './perfil';

const chebyshev = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

/** O alcance do básico agora e se a arma é de ataque à distância (o básico sai em projétil: arco, cajado…). */
function alcanceDoBasico(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade): { alcance: number; distancia: boolean } | null {
  const hab = habilidadeDoAtor(ctx, e, e.ataqueBasico, estado.tick);
  if (!hab) return null;
  return { alcance: alcanceDe(ctx, e, hab, estado.tick), distancia: hab.politicaImpacto === 'projetil' };
}

/** O alcance que vale para usar a skill: o da mira, ou o raio dela quando a área é em volta de quem conjura. */
function alcanceDeUso(ctx: ContextoSimulacao, e: Entidade, hab: Habilidade, tick: number): number {
  const alcance = alcanceDe(ctx, e, hab, tick);
  return Math.max(1, hab.tipoArea === 'ao_redor' ? Math.max(alcance, hab.raioArea) : alcance);
}

/** A distância a que a automação aproxima: o menor alcance entre o básico e as skills ofensivas prontas da barra. */
export function alcanceDeAproximar(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, alcanceBasico: number): number {
  let menor = alcanceBasico;
  for (const id of e.bolsa?.barra ?? []) {
    if (!id || id === e.ataqueBasico) continue;
    const hab = habilidadeDoAtor(ctx, e, id, estado.tick);
    if (!hab || hab.passiva || hab.politicaAlvo !== 'hostil' || recargaRestante(estado, e.id, hab.id) > 0) continue;
    const { custoMana, custoVida } = custoDaHabilidade(ctx, e, hab);
    if (!podePagar(e, custoMana, custoVida)) continue;
    menor = Math.min(menor, alcanceDeUso(ctx, e, hab, estado.tick));
  }
  return menor;
}

/** Até onde segue quem saiu do alcance (o alcance mais a folga do tipo de arma). */
export function limiteDeSeguir(ctx: ContextoSimulacao, alcance: number, distancia: boolean): number {
  const r = ctx.balance.seguirAlvo;
  return alcance * (1 + (distancia ? r.folgaDistancia : r.folgaCorpoACorpo));
}

/** Até onde procura o próximo depois do abate. */
export function raioDeTroca(ctx: ContextoSimulacao, alcance: number, distancia: boolean): number {
  const r = ctx.balance.seguirAlvo;
  return alcance * (distancia ? r.trocaDistancia : r.trocaCorpoACorpo);
}

/**
 * O comando de movimento manual (`mover` com direção, `irPara`) diante da automação: o contrário cancela; o resto só
 * pausa (o `mover` já descarta o caminho). `dx`, `dy` é o rumo pedido; null no `irPara` (sempre cancela).
 */
export function aoMovimentoManual(estado: EstadoJogo, e: Entidade, rumo: { dx: number; dy: number } | null, anguloCancelaGraus: number): void {
  const s = e.seguindo;
  if (!s) return;
  s.andando = false;
  const alvo = buscarEntidade(estado, s.id);
  if (!alvo) return;
  if (rumo) {
    const vx = alvo.px - e.px;
    const vy = alvo.py - e.py;
    const n = Math.hypot(vx, vy) * Math.hypot(rumo.dx, rumo.dy);
    if (n === 0) return;
    const cos = (vx * rumo.dx + vy * rumo.dy) / n;
    if (cos > Math.cos((anguloCancelaGraus * Math.PI) / 180)) return;
  }
  e.seguirCanceladoDe = s.id;
}

export function processarSeguirAlvo(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): void {
  for (const e of estado.entidades) {
    if (!e.seguirAlvo || !vivo(e)) continue;
    const basico = alcanceDoBasico(estado, ctx, e);
    if (!basico) continue;
    const anterior = e.seguindo ? buscarEntidade(estado, e.seguindo.id) : undefined;
    let alvo = alvoAtual(estado, ctx, e);
    // Morto o seguido (e nada escolhido no lugar): o mais perto pela regra de troca.
    if (!alvo && e.seguindo && (!anterior || !vivo(anterior)) && e.autoAtaque) {
      alvo = autoAlvo(estado, ctx, e, raioDeTroca(ctx, basico.alcance, basico.distancia));
      if (alvo) {
        e.alvoSelecionado = alvo.id;
        e.alvoTravado = false;
      }
    }
    if (!alvo || !e.autoAtaque) {
      if (e.seguindo?.andando) pararMovimento(e);
      delete e.seguindo;
      continue;
    }
    const cel = celulaOcupada(alvo);
    const s = e.seguindo?.id === alvo.id ? e.seguindo : (e.seguindo = { id: alvo.id, x: cel.x, y: cel.y, andando: false });
    // O direcional manual tem a vez; e o alvo cancelado não é mais seguido.
    if (e.direcao !== 'parado' || e.seguirCanceladoDe === alvo.id) continue;
    const d = chebyshev(celulaOcupada(e), cel);
    if (d <= alcanceDeAproximar(estado, ctx, e, basico.alcance) || d > limiteDeSeguir(ctx, basico.alcance, basico.distancia)) {
      if (s.andando) pararMovimento(e);
      s.andando = false;
      continue;
    }
    // Replaneja quando ainda não anda atrás dele ou quando ele se afastou do ponto planejado.
    const moveu = Math.abs(cel.x - s.x) + Math.abs(cel.y - s.y) >= ctx.balance.ia.recalcularDistancia;
    if (s.andando && !moveu && (e.caminho.length > 0 || e.waypoints.length > 0)) continue;
    s.x = cel.x;
    s.y = cel.y;
    s.andando = planejarCaminho(e, cel, ctx, estado.tick, saida);
  }
}
