import { muralhaEm } from './tatica';
// Projéteis (§2.7, etapa 4): ação pendente da simulação. Seguem em linha reta a partir do
// lançamento; colidem durante a viagem com o primeiro hostil (pela relação do lançador),
// param em parede e expiram ao passar do ponto mirado. Continuam se o lançador morrer.
// Marco 14 (14/10/2026): resolvem a habilidade pela chave; `perfura` (modificador atravessar) e saltos no
// primeiro acerto (encadear, raio sobre eletrizado).

import type { Celula } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import { buscarEntidade, novoId, type EstadoJogo, type Projetil } from '../core/estado';
import { resolverHabilidade } from './compilar-habilidade';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { vivo, type Entidade } from '../entities/entidade';
import { podeFerir } from '../modos/relacao';
import { passavel } from '../world/fase';
import type { FonteDeDano } from './dano';
import { projeteisAtravessam, REGISTRO_EFEITOS } from './efeitos';
import { celulaOcupada } from './geometria';
import { aplicarImpacto } from './golpe';
import type { Habilidade } from './habilidades';
import { quantidadeDeSaltos, saltar } from './saltos';
import { aoAcertarTiroCheio, aoFimDoTiroCheio, noCaminhoDoTiroCheio } from './sintonia-arqueiro';
import { quebrar, quebraQuem, quebravelEm } from './quebraveis';

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
  // Marco 22 (D-089): as habilidades do Aventureiro partem do falcão.
  origem: Celula = celulaOcupada(ator),
  // Marco 22 (D-089): o tiro carregado do Arqueiro atravessa todos e vai até o alcance máximo (em células).
  carregado: { alcance: number } | null = null,
): void {
  const dx = mira.x - origem.x;
  const dy = mira.y - origem.y;
  const distancia = Math.hypot(dx, dy);
  const p: Projetil = {
    ...(hab.saltosExtrasCombo ? { saltosExtrasCombo: hab.saltosExtrasCombo } : {}),
    id: novoId(estado),
    acaoId,
    donoId: ator.id,
    equipeDono: ator.equipe,
    habilidadeId: hab.id,
    chave: hab.chave,
    x: origem.x,
    y: origem.y,
    dirX: distancia > 0 ? dx / distancia : 0,
    dirY: distancia > 0 ? dy / distancia : 0,
    restante: Math.max(distancia, carregado?.alcance ?? 0) + FOLGA,
    velocidade: hab.velocidadeProjetil,
    bonusAtributo: fonte.bonusAtributo,
    carisma: fonte.carisma,
    multRolagem: fonte.multRolagem,
    potencia: fonte.potencia,
    multDano: fonte.multDano,
    multCura: fonte.multCura,
    atravessa: !!carregado || hab.perfura || projeteisAtravessam(ator, estado.tick),
    ...(fonte.d20Minimo ? { d20Minimo: fonte.d20Minimo } : {}),
    atingidos: [],
  };
  estado.projeteis.push(p);
  saida.push({ t: 'projetilLancado', tick: estado.tick, projetilId: p.id, acaoId, donoId: ator.id, habilidadeId: hab.id, chave: hab.chave });
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

/** O quebrável na célula do projétil, fora da célula de quem atirou (quem atira de cima de um barril). */
function quebrouNoCaminho(estado: EstadoJogo, ctx: ContextoSimulacao, p: Projetil, cx: number, cy: number, saida: EventoSimulacao[]): boolean {
  const o = quebravelEm(estado, cx, cy);
  if (!o) return false;
  const dono = buscarEntidade(estado, p.donoId);
  if (!dono || !quebraQuem(estado, dono)) return false;
  const daqui = celulaOcupada(dono);
  if (daqui.x === cx && daqui.y === cy) return false;
  quebrar(estado, ctx, o, dono.id, saida);
  return true;
}

export function moverProjeteis(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[], dtMs: number): void {
  const restantes: Projetil[] = [];
  for (const p of estado.projeteis) {
    let distancia = (p.velocidade * dtMs) / 1000;
    let fim: 'acertou' | 'parede' | 'expirou' | null = null;
    for (;;) {
      const cx = Math.round(p.x);
      const cy = Math.round(p.y);
      if (!passavel(ctx.fase, cx, cy) || muralhaEm(estado, cx, cy)) {
        fim = 'parede';
        break;
      }
      // Marco 24 (D-095): o tiro cheio do Arqueiro deixa fogo e cura aliados no caminho, conforme a sintonia.
      if (p.carregado) noCaminhoDoTiroCheio(estado, ctx, p, cx, cy, saida);
      // Marco 26 (D-113): o tiro do lado do jogador quebra o quebrável no caminho e para nele (o que atravessa segue).
      if (quebrouNoCaminho(estado, ctx, p, cx, cy, saida) && !p.atravessa) {
        fim = 'acertou';
        break;
      }
      const alvo = alvoNaCelula(estado, ctx, p, cx, cy);
      const resolvida = resolverHabilidade(ctx, p.chave);
      const base = resolvida && p.magico ? { ...resolvida, tipoAtaque: 'magico' as const } : resolvida;
      const hab = base && p.saltosExtrasCombo ? { ...base, saltos: { quantidade: (base.saltos?.quantidade ?? 0) + p.saltosExtrasCombo, raio: base.saltos?.raio ?? 3, pct: base.saltos?.pct ?? 60 } } : base;
      // Marco 24 (D-094): quem intercepta (Vigia, Investida de escudo) gasta uma carga e o projétil para nele.
      const escudo = alvo?.efeitos.find((f) => f.ateTick > estado.tick && f.valor > 0 && REGISTRO_EFEITOS[f.tipo].intercepta);
      if (alvo && escudo) {
        escudo.valor -= 1;
        if (escudo.valor <= 0) alvo.efeitos = alvo.efeitos.filter((f) => f !== escudo);
        fim = 'parede';
        break;
      }
      if (alvo && hab) {
        const dono = buscarEntidade(estado, p.donoId);
        const fonte: FonteDeDano = {
          id: p.donoId,
          equipe: dono?.equipe ?? p.equipeDono,
          bonusAtributo: p.bonusAtributo,
          carisma: p.carisma,
          multRolagem: p.multRolagem,
          potencia: p.potencia,
          multDano: p.multDano,
          multCura: p.multCura,
          ...(p.d20Minimo ? { d20Minimo: p.d20Minimo } : {}),
        };
        const primeiro = p.atingidos.length === 0;
        const saltos = primeiro ? quantidadeDeSaltos(hab, alvo, estado.tick, dono, ctx) : 0;
        aplicarImpacto(estado, ctx, alvo, { acaoId: p.acaoId, fonte, hab, indice: p.atingidos.length }, saida);
        p.atingidos.push(alvo.id);
        if (p.carregado) aoAcertarTiroCheio(estado, ctx, p, alvo, saida);
        // Marco 14: o primeiro acerto salta (os alvos do salto entram em `atingidos`).
        if (saltos > 0) saltar(estado, ctx, { id: p.donoId, equipe: p.equipeDono }, hab, alvo, saltos, { acaoId: p.acaoId, fonte, hab }, p.atingidos, saida);
        // `atravessar` (§2.8): segue em frente e pode acertar o próximo da linha.
        if (p.atravessa) continue;
        if ((p.perfuraExtra ?? 0) > 0) {
          p.perfuraExtra = (p.perfuraExtra ?? 0) - 1;
          continue;
        }
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
    if (fim && p.carregado) aoFimDoTiroCheio(estado, ctx, p, saida);
  }
  estado.projeteis = restantes;
}
