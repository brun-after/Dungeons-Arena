import { ehRetorno } from './buffs-de-leitura';
import { retirarVida } from './reserva-necromante';
import { multiplicadorDardo, registrarDardo } from './concentracao-arcana';
import { encherFuria } from './frenesi';
import { entregaRemota, extraGuerreiro, multiplicadorDireto, protecaoInicial, pulsarAura, reflexoDoFalcao } from './ajustes-classes';
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
import { resistenciaPct, sinergiasAtivas } from './elementos';
import { reagir } from './reacoes';
import { absorcaoPct } from './afinidade';
import { estenderNoClima, multiplicadorClima } from './clima';
import { aoLevarGolpe, ehBasico, fatorDeCura, multiplicadorArma } from './basico';
import { habilidadeDoAtor } from './perfil';
import { ehDeAlgumaClasse } from '../progression/habilidades-classe';
import { fatorDeClasseEntrePersonagens } from '../modos/regras';
import { fatorDoGolpe } from '../modos/dificuldade';
import type { Habilidade } from './habilidades';
import { cegoErra, curaRecebidaPassivas, estadosAoAcertar, golpePelasCostas, multiplicadorMarco24, reforcarEstado, resistenciaIgnorada } from './modificadores-golpe';
import { registrarParticipacao } from './participacao';
import { cargaDaClasse, cargaPorMomento } from './carga-ultimate';
import { furiaDaGeral, gastarCostas, reforcoDaGeral } from './sintonia-guerreiro';
import { miraDaGeral } from './sintonia-arqueiro';
import { aoGolpeDoMorto, curaGeralNosMortos, mortoEsquivou } from './sintonia-necromante';
import { aoAcertarComFalcao, criticoDoFalcao, falcaoGuardiaoAbsorve } from './sintonia-aventureiro';
import { aoAcertarMagia, multiplicadorDaEncarnacao } from './encarnacao-efeitos';
import { aoFecharSequencia, efeitoDaSinergia } from './sinergias-passivas';
import { vinculoDosMortos } from './necromancia';
import { penetracaoPct } from '../progression/vinculo';
import { ESTADOS_DE_CONTROLE } from './eixos';

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
/**
 * Marco 39 (12/11/2026, D-150): a penetração do especialista fura a resistência do alvo ao próprio elemento e, além de
 * 100%, a absorção: o multiplicador `1 − r` anda `pen` do caminho até 1 (a absorção de 50% com penetração de 60% vira
 * 40% de dano).
 */
export function comPenetracao(resistencia: number, penPct: number): number {
  // A imunidade exata (os Primordiais, 100%) não é furada: só cai pelo oposto.
  if (penPct <= 0 || resistencia <= 0 || resistencia === 100) return resistencia;
  const m = 1 - resistencia / 100;
  return (1 - (m + (penPct / 100) * (1 - m))) * 100;
}

function multiplicadorRecebido(estado: EstadoJogo, ctx: ContextoSimulacao, alvo: Entidade, hab: Habilidade, tick: number, sinergiaPct: number, ignorarPct = 0, penPct = 0): number {
  // Marco 24 (D-095): o Zelo ignora parte da resistência (só a positiva).
  const passa = (bruta: number): number => {
    const resistencia = bruta > 0 && bruta < 100 ? bruta * (1 - ignorarPct / 100) : bruta;
    return Math.max(0, 1 - resistencia / 100);
  };
  const elemental = passa(comPenetracao(resistenciaPct(ctx, alvo, hab.elemento, tick), penPct));
  const m = partesDoGolpe(ctx, alvo, hab, tick, elemental, passa);
  if (m <= 0) return 0;
  return multiplicadorDanoRecebido(alvo, tick) * m * (1 + sinergiaPct / 100) * (1 - auraDeDefesaPct(estado, ctx, alvo) / 100);
}

/**
 * Marco 39 (12/11/2026, D-151): a skill com runa tem duas partes. A neutra sente só a resistência física; a elemental,
 * a do elemento (com a penetração) e a absorção do afim, que a anula (a parte neutra ainda fere). Sem runa, tudo é do
 * elemento, como antes.
 */
function partesDoGolpe(ctx: ContextoSimulacao, alvo: Entidade, hab: Habilidade, tick: number, elemental: number, passa: (r: number) => number): number {
  const f = hab.fracaoElemental;
  if (f === undefined || hab.elemento === null) return elemental;
  const absorvido = absorcaoPct(ctx, alvo, hab.elemento);
  const doElemento = absorvido > 0 ? 0 : elemental;
  return (1 - f) * passa(resistenciaPct(ctx, alvo, null, tick)) + f * doElemento;
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
  // Marco 24 (25/10/2026, D-098): só parte do dano chega ao dono (o reflexo cai com o nível); cura e estados seguem inteiros.
  if (dono && vivo(dono)) {
    const fonte = { ...impacto.fonte, multDano: impacto.fonte.multDano * reflexoDoFalcao(ctx, dono.nivel) };
    aplicarImpacto(estado, ctx, dono, { ...impacto, fonte }, saida);
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
  // Marco 24 (D-095): a sintonia da sombra do Aventureiro deixa crítico o primeiro golpe do falcão.
  fonte = criticoDoFalcao(ctx, atacante, hab, fonte, tick);
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
  // Marco 40 (13/11/2026, D-162): o golpe físico sem elemento reage como Físico (o mágico sem elemento não reage).
  const ponta = hab.elemento ?? (hab.tipoAtaque === 'fisico' ? 'fisico' : null);
  const sinergias = hab.formulaDano !== null && ponta ? sinergiasAtivas(alvo, ponta, ctx.conteudo.interacoes.sinergias, tick) : [];
  const piso = Math.max(0, ...sinergias.map((s) => s.d20Minimo));
  if (piso > (fonte.d20Minimo ?? 0)) fonte = { ...fonte, d20Minimo: piso };
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
    // Marco 39 (D-150): a penetração do especialista no próprio elemento fura parte da absorção.
    const pen = penetracaoPct(ctx, atacante, hab.elemento, tick);
    const absorvido = absorcaoPct(ctx, alvo, hab.elemento);
    // Marco 39 (D-151): na skill com runa, a absorção só anula a parte elemental (multiplicadorRecebido).
    const absorve = absorvido > 0 && hab.fracaoElemental === undefined ? Math.max(0, comPenetracao(100 + absorvido, pen) - 100) : 0;
    // Marco 25 (25/10/2026, D-102): entre personagens, as skills de classe batem menos no modo que pede (arena).
    const pvp = atacante?.bolsa && alvo.bolsa && ehDeAlgumaClasse(ctx, hab.id) ? fatorDeClasseEntrePersonagens(ctx.modo) : 1;
    const recebido = (absorve > 0 ? absorve / 100 : multiplicadorRecebido(estado, ctx, alvo, hab, tick, extraPct, resistenciaIgnorada(ctx, atacante), pen) * multiplicadorMarco24(ctx, atacante, alvo, hab, costas, tick)) * fatorDoGolpe(estado, ctx, fonte, alvo) * protecaoInicial(estado, ctx, alvo, atacante) * pvp;
    const r = resolverGolpe(
      estado.rng,
      hab.formulaDano,
      { ...fonte, bonusAtributo: fonte.bonusAtributo + (impacto.danoExtra ?? 0) },
      { defesa: alvo.defesa, imune: absorve === 0 && (imuneADano(alvo, tick) || recebido === 0), multRecebido: recebido },
      ctx.balance.combate,
      fonte.multDano * multiplicadorClima(ctx, hab.elemento) * (atacante ? multiplicadorArma(ctx, atacante, hab) * extraGuerreiro(ctx, atacante, alvo) * multiplicadorDireto(ctx, atacante, hab, impacto.secundario ?? false) * multiplicadorDardo(ctx, atacante, alvo, hab, tick) * multiplicadorDaEncarnacao(ctx, atacante, alvo, hab, tick) : 1),
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
    const cegou = absorve === 0 && !r.falha && !r.imune && (cegoErra(estado, ctx, atacante) || mortoEsquivou(estado, ctx, alvo) || falcaoGuardiaoAbsorve(ctx, alvo, atacante, hab, tick));
    const defesa = cegou ? { esquivou: true, fator: 1 } : absorve === 0 && !r.falha && !r.imune && atacante ? defenderGolpe(estado, ctx, alvo, atacante, hab.tipoAtaque === 'fisico', saida) : { esquivou: false, fator: 1 };
    if (defesa.esquivou) { falha = true; saida.push({ t: 'esquivou', tick, acaoId: impacto.acaoId, atorId: fonte.id, alvoId: alvo.id }); }
    const antesDoEscudo = defesa.esquivou || absorve > 0 ? 0 : Math.round(r.dano * defesa.fator);
    dano = absorverEscudo(alvo, antesDoEscudo, tick);
    absorvidoEscudo = antesDoEscudo - dano;
    const efetivo = retirarVida(alvo, dano);
    if (alvo.invocacao?.resistenciaRestante !== undefined) dano = efetivo;
    // 06/11/2026 (D-135): o Necromante se cura com o que os mortos dele causam e levam.
    vinculoDosMortos(estado, ctx, atacante, alvo, efetivo, saida);
    if (dano > 0) {
      registrarParticipacao(alvo, fonte.id, tick, ctx);
      alvo.ultimoGolpe = { fonteId: fonte.id, chave: hab.chave };
      if (atacante) registrarDardo(ctx, atacante, alvo, hab, tick, Math.min(hpAntes, dano));
      // Marco 22 (D-089): o Mago encarnado em gelo resfria quem o golpeia de perto.
      if (hab.politicaImpacto === 'contato') reagirAoGolpe(estado, ctx, alvo, atacante, saida);
      // Marco 27 (D-126): a Rapieira deixa a riposta pronta em quem levou o golpe.
      if (atacante && atacante !== alvo) aoLevarGolpe(estado, alvo, (id) => habilidadeDoAtor(ctx, alvo, id, tick));
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
  const basicoQueFere = !!conjurador && vivo(conjurador) && conjurador !== alvo && ehBasico(conjurador, hab.id) && dano > 0 && podeFerir(conjurador, alvo, ctx.modo);
  // Marco 21 (D-088): o básico que fere enche a fúria do Guerreiro (antes da cura, que já dobra no golpe que a enche).
  if (conjurador && basicoQueFere && acumularFuria(ctx, conjurador, estado.tick)) encherFuria(estado, ctx, conjurador, origem, saida);
  // Marco 24 (D-095): com a sintonia técnica, as gerais técnicas que ferem também enchem.
  const furiaGeral = conjurador && !basicoQueFere && dano > 0 && conjurador !== alvo && podeFerir(conjurador, alvo, ctx.modo) ? furiaDaGeral(ctx, conjurador, hab, estado.tick) : 0;
  if (conjurador && furiaGeral > 0 && acumularFuria(ctx, conjurador, estado.tick, furiaGeral)) encherFuria(estado, ctx, conjurador, origem, saida);
  // A do Arqueiro: as gerais técnicas que ferem enchem parte da Mira.
  if (conjurador && !basicoQueFere && dano > 0 && conjurador !== alvo && podeFerir(conjurador, alvo, ctx.modo)) miraDaGeral(ctx, conjurador, hab, estado.tick);
  if (conjurador && basicoQueFere && curaBasicoPct > 0) {
    // Marco 27 (D-126): sem a lâmina, o Guerreiro perde parte da cura.
    const valor = Math.min(hpAntes, dano) * curaBasicoPct / 100 * multiplicadorFuria(ctx, conjurador, estado.tick) * fatorDeCura(ctx, conjurador);
    aplicarEfeito(estado, ctx, conjurador, construirEfeito('cura', { valor }), origem, null, saida);
  }
  if (conjurador) pulsarAura(estado, ctx, conjurador, alvo, Math.min(hpAntes, dano), saida, entregaRemota(hab));
  // Marco 24 (D-094): o primeiro alvo de cada ação enche o medidor da ultimate (a própria ultimate não enche).
  // Marco 24 (D-095): a sintonia do Aventureiro (o falcão golpeia junto, aplica estados, cura em volta).
  if (conjurador) aoAcertarComFalcao(estado, ctx, conjurador, alvo, hab, Math.min(hpAntes, dano), cura, saida);
  // Marco 24 (D-096): a sinergia de sequência no primeiro atingido (Avalanche humana).
  if (conjurador && impacto.indice === 0 && dano > 0 && conjurador.habilidadeAnterior) aoFecharSequencia(estado, ctx, conjurador, alvo, hab, conjurador.habilidadeAnterior.id, conjurador.habilidadeAnterior.tick, saida);
  // A do Mago: as encarnações novas e as duplas nas magias que acertam.
  if (conjurador) aoAcertarMagia(estado, ctx, conjurador, alvo, hab, Math.min(hpAntes, dano), cura, impacto.indice === 0, saida);
  // Marco 24 (D-095): a sintonia do suporte do Necromante leva as curas e os escudos gerais aos mortos.
  if (conjurador && impacto.indice === 0 && conjurador.bolsa) curaGeralNosMortos(estado, ctx, conjurador, alvo, hab, cura, saida);
  if (conjurador && impacto.indice === 0 && !hab.tags.includes('ultimate')) {
    if (dano > 0 && conjurador !== alvo) cargaPorMomento(ctx, conjurador, basicoQueFere ? 'basico' : 'habilidade', estado.tick, saida);
    // O acerto das skills do falcão enche do jeito do Aventureiro (no máximo uma vez por intervalo).
    if (dano > 0 && conjurador !== alvo && hab.tags.includes('falcao')) cargaDaClasse(ctx, conjurador, 'falcao', estado.tick, saida);
    if (cura > 0) cargaPorMomento(ctx, conjurador, 'cura', estado.tick, saida);
  }
  // Marco 40 (13/11/2026, D-163): o que a skill atingiu conta para os combos de papel; o golpe carregado (o Cerco) pega.
  const dePapel = conjurador?.ultimaDePapel;
  if (dePapel && dePapel.id === hab.id && dano > 0 && conjurador !== alvo && !dePapel.alvos.includes(alvo.id)) {
    dePapel.atingidos += 1;
    if (dePapel.alvos.length < 10) dePapel.alvos.push(alvo.id);
  }
  for (const f of conjurador?.efeitos ?? []) {
    if (f.tipo === 'acerto_carregado' && f.ateTick > tick && f.interno && dano > 0) aplicarEfeito(estado, ctx, alvo, f.interno, origem, null, saida);
  }
  // Sinergias (marco 14): as reações do golpe (combat/reacoes.ts), antes dos efeitos da habilidade.
  reagir(estado, ctx, { alvo, conjurador, fonte, origem, danoEfetivo: Math.min(hpAntes, dano), comPotencia }, sinergias, saida);
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
    // Marco 26 (D-125): nem o avanço e o teleporte de quem conjura (saem uma vez, no lançamento).
    if (REGISTRO_EFEITOS[efeito.tipo].aoLancar || (efeito.em === 'conjurador' && REGISTRO_EFEITOS[efeito.tipo].deslocaConjurador) || ehRetorno(efeito)) continue;
    // Marco 23 (D-092): no clima do elemento, o estado dele dura mais.
    const reforco = efeito.tipo === 'escudo' || efeito.tipo === 'escudo_acumulado' ? reforcoDaGeral(ctx, conjurador, hab, tick) : 1;
    // Marco 24 (D-096): a sinergia passiva alonga o estado (Disciplina férrea).
    const final = efeitoDaSinergia(ctx, conjurador, hab, reforco > 1 ? { ...efeito, valor: Math.round(efeito.valor * reforco) } : efeito);
    const pronto = estenderNoClima(ctx, hab, reforcarEstado(ctx, conjurador, comPotencia(final, fonte.potencia)));
    // Marco 40 (12/11/2026, D-157): `aliados` cai em cada aliado em volta de quem conjurou (pela relação, nunca pelo tipo).
    if (efeito.em === 'aliados') {
      for (const a of aliadosEmVolta(estado, ctx, conjurador ?? null)) aplicarEfeito(estado, ctx, a, { ...pronto, em: 'alvo' }, origem, mira, saida);
      continue;
    }
    const sobre = efeito.em === 'conjurador' ? conjurador : alvo;
    if (sobre) aplicarEfeito(estado, ctx, sobre, pronto, origem, mira, saida);
  }
  // Marco 40 (D-157): a forma de controle passa os estados de controle ao vizinho hostil mais perto do alvo.
  if (hab.controleVizinho && conjurador && conjurador !== alvo) controleNoVizinho(estado, ctx, conjurador, alvo, hab, origem, mira, saida);
  if (conjurador) {
    if (resposta && conjurador.tatica) { conjurador.tatica.respostaConsumida = true; conjurador.efeitos = conjurador.efeitos.filter((f) => f.tipo !== 'resposta_aparo'); }
    fluxoRestaurador(estado, ctx, conjurador, alvo, cura, saida, hab);
    confirmarImpactoTatico(estado, ctx, conjurador, alvo, hab, impacto.acaoId, cura, disparadas, saida);
  }
  // Marco 18 (D-069): ganchos de quem acerta (no acerto e no crítico) e de quem leva o golpe.
  if (hab.formulaDano !== null && conjurador && conjurador !== alvo) {
    dispararGanchosDe(estado, ctx, conjurador, 'aoAcertar', { outro: alvo, hab, estadosDoOutro: estadosAntes }, saida);
    if (critico) dispararGanchosDe(estado, ctx, conjurador, 'aoCritico', { outro: alvo, hab, estadosDoOutro: estadosAntes }, saida);
    if (dano > 0) dispararGanchosDe(estado, ctx, alvo, 'aoReceberGolpe', { outro: conjurador, hab }, saida);
  }
}

/** Marco 40 (12/11/2026, D-157): os aliados vivos em volta de quem conjurou (sem ele), no raio da forma de grupo. */
function aliadosEmVolta(estado: EstadoJogo, ctx: ContextoSimulacao, conjurador: Entidade | null): Entidade[] {
  if (!conjurador) return [];
  const raio = ctx.balance.habilidades.eixos.grupo.raio;
  return estado.entidades.filter((e) => e !== conjurador && vivo(e) && chebyshev(e, conjurador) <= raio && podeAjudar(conjurador, e, ctx.modo));
}

/** D-157: os estados de controle da skill pegam também no vizinho hostil mais perto do alvo, com parte da duração. */
function controleNoVizinho(estado: EstadoJogo, ctx: ContextoSimulacao, conjurador: Entidade, alvo: Entidade, hab: Habilidade, origem: Parameters<typeof aplicarEfeito>[4], mira: Parameters<typeof aplicarEfeito>[5], saida: EventoSimulacao[]): void {
  const v = hab.controleVizinho;
  if (!v) return;
  let melhor: Entidade | null = null;
  for (const e of estado.entidades) {
    if (e === alvo || e === conjurador || !vivo(e) || chebyshev(e, alvo) > v.raio || !podeFerir(conjurador, e, ctx.modo)) continue;
    if (!melhor || chebyshev(e, alvo) < chebyshev(melhor, alvo) || (chebyshev(e, alvo) === chebyshev(melhor, alvo) && e.id < melhor.id)) melhor = e;
  }
  if (!melhor) return;
  for (const ef of hab.efeitos) {
    if (ef.em !== 'alvo' || !ESTADOS_DE_CONTROLE.includes(ef.tipo)) continue;
    aplicarEfeito(estado, ctx, melhor, { ...ef, duracaoMs: Math.round((ef.duracaoMs * v.duracaoPct) / 100) }, origem, mira, saida);
  }
}
