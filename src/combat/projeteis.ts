import { muralhaEm } from './tatica';
// Projéteis (§2.7, etapa 4): ação pendente da simulação. Seguem em linha reta a partir do
// lançamento; colidem durante a viagem com o primeiro hostil (pela relação do lançador),
// param em parede e expiram ao passar do ponto mirado. Continuam se o lançador morrer.
// Marco 14 (14/10/2026): resolvem a habilidade pela chave; `perfura` (modificador atravessar) e saltos no
// primeiro acerto (encadear, raio sobre eletrizado).
// Marco 27 (29/10/2026, D-126): as variações do básico das armas de classe (vários projéteis, bumerangue, ricochetes,
// tabela, teleguiada, órbita, estilhaço, cravar, rastro) entram pelos ganchos de projeteis-variacoes.ts.

import type { Celula } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import { buscarEntidade, novoId, type EstadoJogo, type Projetil } from '../core/estado';
import { ticksDe } from '../core/tempo';
import { resolverHabilidade } from './compilar-habilidade';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { vivo, type Entidade } from '../entities/entidade';
import { podeFerir } from '../modos/relacao';
import { atravessavelPorTiro } from '../world/fase';
import type { FonteDeDano } from './dano';
import { projeteisAtravessam, REGISTRO_EFEITOS } from './efeitos';
import { celulaOcupada } from './geometria';
import { aplicarImpacto } from './golpe';
import type { Habilidade } from './habilidades';
import { quantidadeDeSaltos, saltar } from './saltos';
import { aoAcertarTiroCheio, aoFimDoTiroCheio, noCaminhoDoTiroCheio } from './sintonia-arqueiro';
import { quebrar, quebraQuem, quebravelEm } from './quebraveis';
import { aindaNoAr, aoAcertarVariacao, aoChegarNaMao, guiar, iniciarVolta, naParede, orbitar, prepararVariacao } from './projeteis-variacoes';
import { aoPararOTiroCarregado, cacadaEmCadeia } from './marcos-arqueiro';

/** Sub-passo máximo da integração, em células: nenhum alvo é atravessado sem teste. */
const SUBPASSO = 0.25;
/** Quanto o projétil segue além da célula mirada antes de expirar. */
const FOLGA = 0.5;

/** Lança o projétil (ou os vários, na variação `multiplos`) e devolve os criados. */
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
  // Marco 27 (D-126): o Tomo orbital solta os dardos acumulados de uma vez, em leque.
  multiplos = hab.variacao?.multiplos,
): Projetil[] {
  const dx = mira.x - origem.x;
  const dy = mira.y - origem.y;
  const distancia = Math.hypot(dx, dy);
  const dirX = distancia > 0 ? dx / distancia : 0;
  const dirY = distancia > 0 ? dy / distancia : 0;
  const quantidade = multiplos?.quantidade ?? 1;
  const criados: Projetil[] = [];
  for (let i = 0; i < quantidade; i++) {
    // O leque abre simétrico; a salva e a imagem saem em sequência, cada uma `recuo` células depois da anterior.
    const graus = quantidade > 1 && multiplos ? -multiplos.aberturaGraus / 2 + (multiplos.aberturaGraus * i) / (quantidade - 1) : 0;
    const recuo = (multiplos?.recuo ?? 0) * i;
    const esperaAte = recuo > 0 && hab.velocidadeProjetil > 0 ? estado.tick + ticksDe((recuo / hab.velocidadeProjetil) * 1000) : 0;
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
      dirX,
      dirY,
      restante: Math.max(distancia, carregado?.alcance ?? 0) + FOLGA,
      velocidade: hab.velocidadeProjetil,
      bonusAtributo: fonte.bonusAtributo,
      carisma: fonte.carisma,
      multRolagem: fonte.multRolagem,
      potencia: fonte.potencia,
      multDano: i > 0 && multiplos ? (fonte.multDano * multiplos.pctExtras) / 100 : fonte.multDano,
      multCura: fonte.multCura,
      atravessa: !!carregado || hab.perfura || projeteisAtravessam(ator, estado.tick),
      ...(fonte.d20Minimo ? { d20Minimo: fonte.d20Minimo } : {}),
      atingidos: [],
    };
    prepararVariacao(p, hab, mira, graus, esperaAte);
    estado.projeteis.push(p);
    criados.push(p);
    saida.push({ t: 'projetilLancado', tick: estado.tick, projetilId: p.id, acaoId, donoId: ator.id, habilidadeId: hab.id, chave: hab.chave });
  }
  return criados;
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
  // Os criados no meio do passo (ricochetes, o irmão do divisor, os estilhaços) entram no fim e andam no mesmo tick.
  for (const p of estado.projeteis) {
    let distancia = (p.velocidade * dtMs) / 1000;
    let fim: 'acertou' | 'parede' | 'expirou' | null = null;
    const resolvida = resolverHabilidade(ctx, p.chave);
    const base = resolvida && p.magico ? { ...resolvida, tipoAtaque: 'magico' as const } : resolvida;
    const hab = base && p.saltosExtrasCombo ? { ...base, saltos: { quantidade: (base.saltos?.quantidade ?? 0) + p.saltosExtrasCombo, raio: base.saltos?.raio ?? 3, pct: base.saltos?.pct ?? 60 } } : base;
    // Marco 27 (D-126): a variação vale só para quem nasceu com ela (o estilhaço é um projétil simples).
    const variacao = p.var ? hab?.variacao : undefined;
    // Marco 27 (D-126): a flecha da salva que ainda espera na mão fica onde está.
    if ((p.var?.esperaAte ?? 0) > estado.tick) {
      restantes.push(p);
      continue;
    }
    if (p.var?.fase === 'orbita' && orbitar(estado, ctx, p, hab, saida) === 'fim') fim = 'expirou';
    let ultimoPasso = 0;
    while (!fim && p.var?.fase !== 'orbita') {
      const cx = Math.round(p.x);
      const cy = Math.round(p.y);
      // O bumerangue volta à mão por cima de tudo; a tabela quica.
      if (p.var?.fase !== 'volta' && (!atravessavelPorTiro(ctx.fase, cx, cy) || muralhaEm(estado, cx, cy))) {
        if (variacao && naParede(estado, ctx, p, variacao, ultimoPasso, saida)) {
          ultimoPasso = 0;
          continue;
        }
        fim = 'parede';
        break;
      }
      // Marco 24 (D-095): o tiro cheio do Arqueiro deixa fogo e cura aliados no caminho, conforme a sintonia.
      if (p.carregado) noCaminhoDoTiroCheio(estado, ctx, p, cx, cy, saida);
      const noAr = !!variacao && aindaNoAr(p, variacao);
      // Marco 26 (D-113): o tiro do lado do jogador quebra o quebrável no caminho e para nele (o que atravessa segue).
      if (!noAr && quebrouNoCaminho(estado, ctx, p, cx, cy, saida) && !p.atravessa && !variacao?.retorna) {
        fim = 'acertou';
        break;
      }
      // Marco 27 (D-126): o tiro parabólico passa por cima de quem está no caminho.
      const alvo = noAr ? null : alvoNaCelula(estado, ctx, p, cx, cy);
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
        const volta = p.var?.fase === 'volta';
        const saltos = p.atingidos.length === 0 && !volta ? quantidadeDeSaltos(hab, alvo, estado.tick, dono, ctx) : 0;
        aplicarImpacto(estado, ctx, alvo, { acaoId: p.acaoId, fonte, hab, indice: p.atingidos.length, ...(volta && { secundario: true }) }, saida);
        p.atingidos.push(alvo.id);
        if (p.carregado) aoAcertarTiroCheio(estado, ctx, p, alvo, saida);
        // Marco 28 (D-127): o Instinto do Arqueiro faz o tiro carregado que abate saltar (Caçada em cadeia).
        if (p.carregado) cacadaEmCadeia(estado, ctx, p, alvo, saida);
        // Marco 14: o primeiro acerto salta (os alvos do salto entram em `atingidos`).
        if (saltos > 0) saltar(estado, ctx, { id: p.donoId, equipe: p.equipeDono }, hab, alvo, saltos, { acaoId: p.acaoId, fonte, hab }, p.atingidos, saida);
        // Marco 27 (D-126): a variação decide se o projétil segue (ricochete, órbita, volta do bumerangue).
        if (variacao && aoAcertarVariacao(estado, ctx, p, alvo, hab, saida) === 'continua') continue;
        // `atravessar` (§2.8): segue em frente e pode acertar o próximo da linha.
        if (p.atravessa) continue;
        if ((p.perfuraExtra ?? 0) > 0) {
          p.perfuraExtra = (p.perfuraExtra ?? 0) - 1;
          continue;
        }
        fim = 'acertou';
        break;
      }
      if (variacao && guiar(estado, ctx, p, variacao, SUBPASSO) === 'chegou') {
        aoChegarNaMao(estado, ctx, p, hab, saida);
        fim = 'expirou';
        break;
      }
      if (p.restante <= 1e-9) {
        // O bumerangue que chegou ao fim da ida vira e volta.
        if (variacao && iniciarVolta(estado, p, variacao, saida)) continue;
        fim = 'expirou';
        break;
      }
      if (distancia <= 1e-9) break;
      const passo = Math.min(SUBPASSO, distancia, p.restante);
      p.x += p.dirX * passo;
      p.y += p.dirY * passo;
      distancia -= passo;
      p.restante -= passo;
      ultimoPasso = passo;
    }
    if (fim) saida.push({ t: 'projetilFim', tick: estado.tick, projetilId: p.id, motivo: fim });
    else restantes.push(p);
    if (fim && p.carregado) aoFimDoTiroCheio(estado, ctx, p, saida);
    if (fim && p.carregado) aoPararOTiroCarregado(estado, ctx, p, saida);
  }
  estado.projeteis = restantes;
}
