// Projéteis (§2.7, etapa 4): ação pendente da simulação. Seguem em linha reta a partir do
// lançamento; colidem durante a viagem com o primeiro hostil (pela relação do lançador),
// param em parede e expiram ao passar do ponto mirado. Continuam se o lançador morrer.

import type { Celula } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import { buscarEntidade, novoId, type EstadoJogo, type Projetil } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { vivo, type Entidade } from '../entities/entidade';
import { podeFerir } from '../modos/relacao';
import { passavel } from '../world/fase';
import type { FonteDeDano } from './dano';
import { projeteisAtravessam } from './efeitos';
import { celulaOcupada } from './geometria';
import { aplicarImpacto } from './golpe';
import type { Habilidade } from './habilidades';

/** Sub-passo máximo da integração, em células: nenhum alvo é atravessado sem teste. */
const SUBPASSO = 0.25;
/** Quanto o projétil segue além da célula mirada antes de expirar. */
const FOLGA = 0.5;

export function lancarProjetil(
  estado: EstadoJogo,
  ator: Entidade,
  hab: Habilidade,
  acaoId: number,
  fonte: FonteDeDano,
  mira: Celula,
  saida: EventoSimulacao[],
): void {
  const origem = celulaOcupada(ator);
  const dx = mira.x - origem.x;
  const dy = mira.y - origem.y;
  const distancia = Math.hypot(dx, dy);
  const p: Projetil = {
    id: novoId(estado),
    acaoId,
    donoId: ator.id,
    equipeDono: ator.equipe,
    habilidadeId: hab.id,
    x: origem.x,
    y: origem.y,
    dirX: distancia > 0 ? dx / distancia : 0,
    dirY: distancia > 0 ? dy / distancia : 0,
    restante: distancia + FOLGA,
    velocidade: hab.velocidadeProjetil,
    bonusAtributo: fonte.bonusAtributo,
    carisma: fonte.carisma,
    multDano: fonte.multDano,
    atravessa: projeteisAtravessam(ator, estado.tick),
    atingidos: [],
  };
  estado.projeteis.push(p);
  saida.push({ t: 'projetilLancado', tick: estado.tick, projetilId: p.id, acaoId, donoId: ator.id, habilidadeId: hab.id });
}

function alvoNaCelula(estado: EstadoJogo, ctx: ContextoSimulacao, p: Projetil, cx: number, cy: number): Entidade | null {
  const dono = { id: p.donoId, equipe: p.equipeDono };
  let escolhido: Entidade | null = null;
  for (const e of estado.entidades) {
    if (e.id === p.donoId || !vivo(e) || !podeFerir(dono, e, ctx.modo) || p.atingidos.includes(e.id)) continue;
    const c = celulaOcupada(e);
    if (c.x !== cx || c.y !== cy) continue;
    if (!escolhido || e.id < escolhido.id) escolhido = e;
  }
  return escolhido;
}

export function moverProjeteis(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[], dtMs: number): void {
  const restantes: Projetil[] = [];
  for (const p of estado.projeteis) {
    let distancia = (p.velocidade * dtMs) / 1000;
    let fim: 'acertou' | 'parede' | 'expirou' | null = null;
    for (;;) {
      const cx = Math.round(p.x);
      const cy = Math.round(p.y);
      if (!passavel(ctx.fase, cx, cy)) {
        fim = 'parede';
        break;
      }
      const alvo = alvoNaCelula(estado, ctx, p, cx, cy);
      const hab = ctx.conteudo.habilidades.get(p.habilidadeId);
      if (alvo && hab) {
        const dono = buscarEntidade(estado, p.donoId);
        const fonte: FonteDeDano = {
          id: p.donoId,
          equipe: dono?.equipe ?? p.equipeDono,
          bonusAtributo: p.bonusAtributo,
          carisma: p.carisma,
          multDano: p.multDano,
        };
        aplicarImpacto(estado, ctx, alvo, { acaoId: p.acaoId, fonte, hab, indice: p.atingidos.length }, saida);
        p.atingidos.push(alvo.id);
        // `atravessar` (§2.8): segue em frente e pode acertar o próximo da linha.
        if (p.atravessa) continue;
        fim = 'acertou';
        break;
      }
      if (p.restante <= 1e-9) {
        fim = 'expirou';
        break;
      }
      if (distancia <= 1e-9) break;
      const passo = Math.min(SUBPASSO, distancia, p.restante);
      p.x += p.dirX * passo;
      p.y += p.dirY * passo;
      distancia -= passo;
      p.restante -= passo;
    }
    if (fim) saida.push({ t: 'projetilFim', tick: estado.tick, projetilId: p.id, motivo: fim });
    else restantes.push(p);
  }
  estado.projeteis = restantes;
}
