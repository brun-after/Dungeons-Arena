import { multiplicadorDardo, registrarDardo } from './concentracao-arcana';
import { encherFuria } from './frenesi';
import { entregaRemota, extraGuerreiro, multiplicadorDireto, protecaoInicial, pulsarAura } from './ajustes-classes';
import { comboDoImpacto, confirmarImpactoTatico } from './sequencias';
import { defenderGolpe, fluxoRestaurador } from './tatica';
import { comCombo } from './combos';
import { reagirAoGolpe } from './encarnacao';
import { acumularFuria, multiplicadorFuria } from './furia';
import { ticksDe } from '../core/tempo';
// Aplicação de um impacto num alvo (§2.7, passo 10): dano com HP mínimo 0, cura limitada ao
// máximo, efeitos só quando acerta, e registro de participação para dividir XP.
// Marco 14 (14/10/2026), D-059: o elemento consulta as sinergias com os estados do alvo (dano extra, remoção e
// efeitos, só quando acerta); resistência do preset, exposto e escudo; a cura passa pelo veneno e pelo rank.

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { buscarEntidade } from '../core/estado';
import { vivo, type Entidade } from '../entities/entidade';
import { rolar } from './dados';
import { resolverGolpe, type FonteDeDano } from './dano';
import { absorverEscudo, aplicarEfeito, imuneADano, multiplicadorCuraRecebida, multiplicadorDanoRecebido, REGISTRO_EFEITOS } from './efeitos';
import { construirEfeito, type EfeitoCanonico } from './registro-efeitos';
import { chebyshev } from './geometria';
import { podeAjudar, podeFerir } from '../modos/relacao';
import { dispararGanchosDe, passivosDe } from '../progression/ganchos-do-portador';
import { dispararSinergias, resistenciaPct, sinergiasAtivas } from './elementos';
import { absorcaoPct } from './afinidade';
import { estenderNoClima, multiplicadorClima } from './clima';
import { multiplicadorArma } from '../progression/armas';
import { fatorDoGolpe } from '../modos/dificuldade';
import type { Habilidade } from './habilidades';
import { cegoErra, curaRecebidaPassivas, estadosAoAcertar, golpePelasCostas, multiplicadorMarco24, reforcarEstado, resistenciaIgnorada } from './modificadores-golpe';
import { registrarParticipacao } from './participacao';
import { cargaDaClasse, cargaPorMomento } from './carga-ultimate';
import { furiaDaGeral, gastarCostas, reforcoDaGeral } from './sintonia-guerreiro';
import { miraDaGeral } from './sintonia-arqueiro';
import { aoGolpeDoMorto, curaGeralNosMortos, mortoEsquivou } from './sintonia-necromante';

export interface Impacto {
  acaoId: number;
  fonte: FonteDeDano;
  hab: Habilidade;
  /** Ordem do alvo num impacto em área. */
  indice: number;
  secundario?: boolean;
  /** Célula mirada (teleporte e avanço usam). */
  mira?: { x: number; y: number };
  /** Bônus do ataque básico (`ab_dano`), somado à rolagem. */
  danoExtra?: number;
}

/**
 * Marco 18 (17/10/2026, D-068): a Inteligência de quem lança (`potencia`) fortalece o efeito — a duração dos status e
 * o valor de quem é número de verdade (periódico, escudo, cura e dano instantâneos). Fluxos (armadilha, invocação,
 * atrasado) e deslocamentos ficam como são; o `pct` também (lentidão e afins não passam do que o efeito descreve).
 */
export function comPotencia(ef: EfeitoCanonico, potencia: number): EfeitoCanonico {
  if (potencia === 1) return ef;
  const def = REGISTRO_EFEITOS[ef.tipo];
  if (def.fluxo !== null) return ef;
  const numerico = def.periodico !== null || def.escudo || def.instantaneo === 'cura' || def.instantaneo === 'dano' || def.instantaneo === 'campo_cura' || def.instantaneo === 'campo_veneno';
  return {
    ...ef,
    duracaoMs: ef.duracaoMs > 0 ? Math.round(ef.duracaoMs * potencia) : 0,
    valor: numerico ? Math.max(1, Math.round(ef.valor * potencia)) : ef.valor,
  };
}

/** Multiplicador do dano recebido: exposto, resistência ao elemento e as sinergias. 0 = imune ao elemento. */
function multiplicadorRecebido(estado: EstadoJogo, ctx: ContextoSimulacao, alvo: Entidade, hab: Habilidade, tick: number, sinergiaPct: number, ignorarPct = 0): number {
  // Marco 24 (D-095): o Zelo ignora parte da resistência (só a positiva).
  const bruta = resistenciaPct(ctx, alvo, hab.elemento);
  const resistencia = bruta > 0 && bruta < 100 ? bruta * (1 - ignorarPct / 100) : bruta;
  if (resistencia >= 100) return 0;
  return multiplicadorDanoRecebido(alvo, tick) * (1 - resistencia / 100) * (1 + sinergiaPct / 100) * (1 - auraDeDefesaPct(estado, ctx, alvo) / 100);
}

/** Marco 18 (ressonância Bastião): o maior "aliados perto levam menos dano" entre os aliados a até 3 células. */
function auraDeDefesaPct(estado: EstadoJogo, ctx: ContextoSimulacao, alvo: Entidade): number {
  let melhor = 0;
  for (const outro of estado.entidades) {
    if (outro === alvo || !outro.bolsa || !vivo(outro) || chebyshev(outro, alvo) > 3 || !podeAjudar(outro, alvo, ctx.modo)) continue;
    melhor = Math.max(melhor, passivosDe(ctx, outro).auraDefesaPct);
  }
  return Math.min(50, melhor);
}

export function aplicarImpacto(
  estado: EstadoJogo,
  ctx: ContextoSimulacao,
  alvo: Entidade,
  impacto: Impacto,
  saida: EventoSimulacao[],
): void {
  if (!vivo(alvo)) return;
  // Marco 22 (D-089): o golpe no falcão do Aventureiro cai no dono, com as defesas, os escudos e as proteções dele.
  const dono = alvo.invocacao?.companheiro ? buscarEntidade(estado, alvo.invocacao.donoId) : undefined;
  if (dono && vivo(dono)) {
    aplicarImpacto(estado, ctx, dono, impacto, saida);
    return;
  }
  const { hab } = impacto;
  const atacante = buscarEntidade(estado, impacto.fonte.id);
  const combo = atacante ? comboDoImpacto(estado, ctx, atacante, hab, impacto.acaoId, alvo) : null;
  let fonte = comCombo(impacto.fonte, combo ? { danoPct: combo.danoPct, d20Minimo: combo.d20Minimo } : null);
  const aparo = atacante?.tatica?.aparou;
  const resposta = !atacante?.tatica?.respostaConsumida && !!aparo && estado.tick - aparo.tick <= ticksDe(ctx.balance.tatica.respostaMs) && hab.tipoAtaque === 'fisico' && hab.politicaImpacto === 'contato';
  if (resposta && combo?.recompensa !== 'sangramento_forte' && combo?.recompensa !== 'consumir_sangramento') {
    fonte = { ...fonte, multDano: fonte.multDano * (1 + ctx.balance.tatica.respostaPct / 100) };
  }
  const tick = estado.tick;
  const hpAntes = alvo.hp;
  let dano = 0;
  let absorvidoEscudo = 0;
  let cura = 0;
  let d20 = 0;
  let mult = 1;
  let falha = false;
  let critico = false;
  let imune = false;
  const conjurador = buscarEntidade(estado, fonte.id);
  const origem = { acaoId: impacto.acaoId, id: fonte.id, x: conjurador?.x ?? alvo.x, y: conjurador?.y ?? alvo.y };
  const mira = impacto.mira ?? { x: alvo.x, y: alvo.y };
  const sinergias = hab.formulaDano !== null ? sinergiasAtivas(alvo, hab.elemento, ctx.conteudo.interacoes.sinergias, tick) : [];
  // Marco 18: os estados do alvo antes do golpe (os ganchos "se o alvo estava…" olham estes).
  const estadosAntes = alvo.efeitos.filter((f) => f.ateTick > tick).map((f) => f.tipo);

  let absorveu = false;
  // Marco 24 (D-097): pelas costas pelo olhar do alvo; a marca vai no evento para o número na tela.
  // Marco 24 (D-095): ou a sintonia da sombra do Guerreiro armou o golpe.
  const costas = gastarCostas(atacante, alvo, hab, ctx) || golpePelasCostas(ctx, atacante, alvo, hab);
  if (hab.formulaDano !== null) {
    // Marco 15: a dificuldade e o tamanho do grupo pesam pelo lado de quem bate e de quem apanha.
    // Marco 18: o dano extra das sinergias cresce com a potência (Inteligência) de quem lança.
    const extraPct = sinergias.reduce((s, x) => s + x.danoExtraPct, 0) * fonte.potencia;
    // Marco 23 (D-092): o inimigo afim absorve o próprio elemento — o golpe rola igual, mas cura em vez de ferir.
    const absorve = absorcaoPct(ctx, alvo, hab.elemento);
    const recebido = (absorve > 0 ? absorve / 100 : multiplicadorRecebido(estado, ctx, alvo, hab, tick, extraPct, resistenciaIgnorada(ctx, atacante)) * multiplicadorMarco24(ctx, atacante, alvo, hab, costas, tick)) * fatorDoGolpe(estado, ctx, fonte, alvo) * protecaoInicial(estado, ctx, alvo, atacante);
    const r = resolverGolpe(
      estado.rng,
      hab.formulaDano,
      { ...fonte, bonusAtributo: fonte.bonusAtributo + (impacto.danoExtra ?? 0) },
      { defesa: alvo.defesa, imune: absorve === 0 && (imuneADano(alvo, tick) || recebido === 0), multRecebido: recebido },
      ctx.balance.combate,
      fonte.multDano * multiplicadorClima(ctx, hab.elemento) * (atacante ? multiplicadorArma(ctx, atacante, hab.id) * extraGuerreiro(ctx, atacante, alvo) * multiplicadorDireto(ctx, atacante, hab, impacto.secundario ?? false) * multiplicadorDardo(ctx, atacante, alvo, hab, tick) : 1),
    );
    ({ d20, mult, falha, critico, imune } = r);
    absorveu = absorve > 0 && !r.falha;
    if (absorveu) {
      const antes = alvo.hp;
      alvo.hp = Math.min(alvo.hpMax, alvo.hp + r.dano);
      cura += alvo.hp - antes;
    }
    // Marco 14: o escudo absorve antes da vida.
    // Marco 24: o cego erra como quem esquiva (antes das defesas do alvo).
    // Marco 24 (D-095): o morto do Necromante com a sintonia da sombra também esquiva.
    const cegou = absorve === 0 && !r.falha && !r.imune && (cegoErra(estado, ctx, atacante) || mortoEsquivou(estado, ctx, alvo));
    const defesa = cegou ? { esquivou: true, fator: 1 } : absorve === 0 && !r.falha && !r.imune && atacante ? defenderGolpe(estado, ctx, alvo, atacante, hab.tipoAtaque === 'fisico', saida) : { esquivou: false, fator: 1 };
    if (defesa.esquivou) { falha = true; saida.push({ t: 'esquivou', tick, acaoId: impacto.acaoId, atorId: fonte.id, alvoId: alvo.id }); }
    const antesDoEscudo = defesa.esquivou || absorve > 0 ? 0 : Math.round(r.dano * defesa.fator);
    dano = absorverEscudo(alvo, antesDoEscudo, tick);
    absorvidoEscudo = antesDoEscudo - dano;
    alvo.hp = Math.max(0, alvo.hp - dano);
    if (dano > 0) {
      registrarParticipacao(alvo, fonte.id, tick, ctx);
      alvo.ultimoGolpe = { fonteId: fonte.id, chave: hab.chave };
      if (atacante) registrarDardo(ctx, atacante, alvo, hab, tick, Math.min(hpAntes, dano));
      // Marco 22 (D-089): o Mago encarnado em gelo resfria quem o golpeia de perto.
      if (hab.politicaImpacto === 'contato') reagirAoGolpe(estado, ctx, alvo, atacante, saida);
    }
  }
  if (hab.formulaCura !== null) {
    const bruta = rolar(estado.rng, hab.formulaCura).total;
    // Marco 24 (D-095): a sintonia do suporte do Guerreiro reforça as curas gerais no Frenesi.
    const pedida = Math.max(0, Math.round(bruta * fonte.multCura * reforcoDaGeral(ctx, conjurador, hab, tick) * multiplicadorCuraRecebida(alvo, tick) * curaRecebidaPassivas(ctx, alvo)));
    const antes = alvo.hp;
    alvo.hp = Math.min(alvo.hpMax, alvo.hp + pedida);
    cura += alvo.hp - antes;
  }

  const disparadas = falha || imune || absorveu ? [] : sinergias.map((s) => s.id);
  if (disparadas.length > 0) alvo.ultimaSinergia = disparadas[0] ?? null;
  saida.push({
    t: 'impacto',
    tick,
    acaoId: impacto.acaoId,
    fonteId: fonte.id,
    alvoId: alvo.id,
    habilidadeId: hab.id,
    chave: hab.chave,
    dano,
    // Diagnóstico (18/10/2026): não altera dano nem RNG; separa excesso letal e escudo.
    danoEfetivo: Math.min(hpAntes, dano),
    absorvidoEscudo,
    cura,
    d20,
    mult,
    falha,
    critico,
    imune,
    indice: impacto.indice,
    sinergias: disparadas,
    ...(absorveu && { absorveu: true }),
    ...(costas && dano > 0 && { costas: true }),
  });

  // Efeitos dependentes de acerto não se aplicam na falha crítica nem com imunidade (§2.7, passo 7). Marco 23: nem
  // no golpe absorvido (o estado do elemento não pega no afim).
  if (falha || imune || absorveu) return;
  // D-078 (17/10/2026): só o básico recupera vida, sobre dano efetivo após defesa/escudo e sem excesso letal.
  const curaBasicoPct = conjurador?.bolsa ? (ctx.balance.recursos.curaBasicoPorClassePct[conjurador.bolsa.classeId] ?? 0) : 0;
  const basicoQueFere = !!conjurador && vivo(conjurador) && conjurador !== alvo && hab.id === conjurador.ataqueBasico && dano > 0 && podeFerir(conjurador, alvo, ctx.modo);
  // Marco 21 (D-088): o básico que fere enche a fúria do Guerreiro (antes da cura, que já dobra no golpe que a enche).
  if (conjurador && basicoQueFere && acumularFuria(ctx, conjurador, estado.tick)) encherFuria(estado, ctx, conjurador, origem, saida);
  // Marco 24 (D-095): com a sintonia técnica, as gerais técnicas que ferem também enchem.
  const furiaGeral = conjurador && !basicoQueFere && dano > 0 && conjurador !== alvo && podeFerir(conjurador, alvo, ctx.modo) ? furiaDaGeral(ctx, conjurador, hab, estado.tick) : 0;
  if (conjurador && furiaGeral > 0 && acumularFuria(ctx, conjurador, estado.tick, furiaGeral)) encherFuria(estado, ctx, conjurador, origem, saida);
  // A do Arqueiro: as gerais técnicas que ferem enchem parte da Mira.
  if (conjurador && !basicoQueFere && dano > 0 && conjurador !== alvo && podeFerir(conjurador, alvo, ctx.modo)) miraDaGeral(ctx, conjurador, hab, estado.tick);
  if (conjurador && basicoQueFere && curaBasicoPct > 0) {
    const valor = Math.min(hpAntes, dano) * curaBasicoPct / 100 * multiplicadorFuria(ctx, conjurador, estado.tick);
    aplicarEfeito(estado, ctx, conjurador, construirEfeito('cura', { valor }), origem, null, saida);
  }
  if (conjurador) pulsarAura(estado, ctx, conjurador, alvo, Math.min(hpAntes, dano), saida, entregaRemota(hab));
  // Marco 24 (D-094): o primeiro alvo de cada ação enche o medidor da ultimate (a própria ultimate não enche).
  // Marco 24 (D-095): a sintonia do suporte do Necromante leva as curas e os escudos gerais aos mortos.
  if (conjurador && impacto.indice === 0 && conjurador.bolsa) curaGeralNosMortos(estado, ctx, conjurador, alvo, hab, cura, saida);
  if (conjurador && impacto.indice === 0 && !hab.tags.includes('ultimate')) {
    if (dano > 0 && conjurador !== alvo) cargaPorMomento(ctx, conjurador, basicoQueFere ? 'basico' : 'habilidade', estado.tick, saida);
    // O acerto das skills do falcão enche do jeito do Aventureiro (no máximo uma vez por intervalo).
    if (dano > 0 && conjurador !== alvo && hab.tags.includes('falcao')) cargaDaClasse(ctx, conjurador, 'falcao', estado.tick, saida);
    if (cura > 0) cargaPorMomento(ctx, conjurador, 'cura', estado.tick, saida);
  }
  // Sinergias (marco 14): o estado consumido sai e os efeitos da sinergia entram, antes dos da habilidade.
  dispararSinergias(alvo, sinergias, (ef) => {
    aplicarEfeito(estado, ctx, alvo, comPotencia(ef, fonte.potencia), origem, mira, saida);
  });
  // Marco 18 (D-068): reações em área (vapor, lama, peste; o eletrocutar só nos molhados) e a cura de quem lançou.
  for (const s of sinergias) {
    if (s.raio > 0) {
      for (const outro of estado.entidades) {
        if (outro === alvo || !vivo(outro) || chebyshev(outro, alvo) > s.raio || !podeFerir(fonte, outro, ctx.modo)) continue;
        if (s.soComEstado && !outro.efeitos.some((f) => f.tipo === s.soComEstado && f.ateTick > tick)) continue;
        if (s.soComEstado) outro.efeitos = outro.efeitos.filter((f) => !s.remove.includes(f.tipo));
        for (const ef of s.aplicar) aplicarEfeito(estado, ctx, outro, comPotencia(ef, fonte.potencia), origem, { x: outro.x, y: outro.y }, saida);
      }
    }
    if (s.curarFonte > 0 && conjurador && vivo(conjurador)) {
      aplicarEfeito(estado, ctx, conjurador, construirEfeito('cura', { valor: Math.round(s.curarFonte * fonte.potencia) }), origem, null, saida);
    }
  }
  // Marco 18: o marcado sai no golpe; o consagrado cura quem acerta.
  if (dano > 0) {
    const consagrado = alvo.efeitos.find((f) => f.ateTick > tick && REGISTRO_EFEITOS[f.tipo].curaQuemAcerta);
    if (consagrado && conjurador && vivo(conjurador) && conjurador !== alvo) {
      aplicarEfeito(estado, ctx, conjurador, construirEfeito('cura', { valor: consagrado.valor }), origem, null, saida);
    }
    alvo.efeitos = alvo.efeitos.filter((f) => !REGISTRO_EFEITOS[f.tipo].someAoLevarGolpe);
    // Marco 24: o reflexo do alvo cai em quem golpeou de perto.
    if (conjurador && conjurador !== alvo && hab.politicaImpacto === 'contato') {
      for (const f of alvo.efeitos) if (f.ateTick > tick && f.interno && REGISTRO_EFEITOS[f.tipo].reflexo) aplicarEfeito(estado, ctx, conjurador, f.interno, { id: alvo.id, x: alvo.x, y: alvo.y }, null, saida);
    }
    // Marco 24 (D-095): as passivas de quem bate que aplicam estado por chance.
    if (conjurador && conjurador !== alvo) for (const ef of estadosAoAcertar(estado, ctx, conjurador)) aplicarEfeito(estado, ctx, alvo, ef, origem, mira, saida);
    // A sintonia do Necromante nos golpes dos mortos.
    if (conjurador && conjurador !== alvo) aoGolpeDoMorto(estado, ctx, conjurador, alvo, saida);
  }
  // Dispatcher único (§2.8); `em: 'conjurador'` cai sobre quem lançou (ex.: avanço, roubo de vida).
  for (const efeito of hab.efeitos) {
    // Armadilha e invocação saem uma vez no lançamento (acao.ts), não por alvo atingido.
    if (REGISTRO_EFEITOS[efeito.tipo].aoLancar) continue;
    const sobre = efeito.em === 'conjurador' ? conjurador : alvo;
    // Marco 23 (D-092): no clima do elemento, o estado dele dura mais.
    const reforco = efeito.tipo === 'escudo' || efeito.tipo === 'escudo_acumulado' ? reforcoDaGeral(ctx, conjurador, hab, tick) : 1;
    const final = reforco > 1 ? { ...efeito, valor: Math.round(efeito.valor * reforco) } : efeito;
    if (sobre) aplicarEfeito(estado, ctx, sobre, estenderNoClima(ctx, hab, reforcarEstado(ctx, conjurador, comPotencia(final, fonte.potencia))), origem, mira, saida);
  }
  if (conjurador) {
    if (resposta && conjurador.tatica) { conjurador.tatica.respostaConsumida = true; conjurador.efeitos = conjurador.efeitos.filter((f) => f.tipo !== 'resposta_aparo'); }
    fluxoRestaurador(estado, ctx, conjurador, alvo, cura, saida);
    confirmarImpactoTatico(estado, ctx, conjurador, alvo, hab, impacto.acaoId, cura, disparadas, saida);
  }
  // Marco 18 (D-069): ganchos de quem acerta (no acerto e no crítico) e de quem leva o golpe.
  if (hab.formulaDano !== null && conjurador && conjurador !== alvo) {
    dispararGanchosDe(estado, ctx, conjurador, 'aoAcertar', { outro: alvo, hab, estadosDoOutro: estadosAntes }, saida);
    if (critico) dispararGanchosDe(estado, ctx, conjurador, 'aoCritico', { outro: alvo, hab, estadosDoOutro: estadosAntes }, saida);
    if (dano > 0) dispararGanchosDe(estado, ctx, alvo, 'aoReceberGolpe', { outro: conjurador, hab }, saida);
  }
}
