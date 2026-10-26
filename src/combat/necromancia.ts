import type { ContextoSimulacao } from '../core/contexto';
import { buscarEntidade, type EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import { posicionar, vivo, type Entidade } from '../entities/entidade';
import { podeAjudar, podeFerir } from '../modos/relacao';
import { contarInvocacoes, invocar, limiteDeInvocacoes } from './efeitos-fluxo';
import { chebyshev } from './geometria';
import { construirEfeito, type EfeitoCanonico } from './registro-efeitos';
import { fato, muralhaEm } from './tatica';
import { passavel } from '../world/fase';
import { reservaCelula } from '../world/colisao';
import { aoCairOMorto, retornoDoServo, vidaDoMorto } from './sintonia-necromante';

const necromante = (e: Entidade) => vivo(e) && (e.classeId ?? e.bolsa?.classeId) === 'necromante';
export const chaveServo = (id: string) => `necromante:servo:${id}`;

/** Uma célula livre a 1 ou 2 células do dono (para erguer um morto ou trazê-lo de volta). */
function lugarPerto(estado: EstadoJogo, ctx: ContextoSimulacao, dono: Entidade): { x: number; y: number } | null {
  for (let raio = 1; raio <= 2; raio++) for (let dy = -raio; dy <= raio; dy++) for (let dx = -raio; dx <= raio; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== raio) continue;
    const x = dono.x + dx, y = dono.y + dy;
    if (passavel(ctx.fase, x, y) && !muralhaEm(estado, x, y) && !estado.entidades.some((e) => vivo(e) && reservaCelula(e, x, y))) return { x, y };
  }
  return null;
}

/** Todos os mortos têm o mesmo orçamento de atributos. Chefes só emprestam a aparência. */
function erguer(estado: EstadoJogo, ctx: ContextoSimulacao, dono: Entidade, tipo: 'servo' | 'reanimado' | 'eco', fonte: Entidade | null, saida: EventoSimulacao[]): boolean {
  const r = ctx.balance.necromancia;
  const meus = estado.entidades.filter((e) => vivo(e) && e.invocacao?.donoId === dono.id);
  const temServo = meus.some((e) => e.invocacao?.necromancia === 'servo');
  // Reserva um espaço para o servo, inclusive durante os oito segundos de retorno.
  if (contarInvocacoes(estado, dono.id) >= limiteDeInvocacoes(ctx, dono) - (tipo !== 'servo' && !temServo ? 1 : 0)) return false;
  if (estado.entidades.filter((e) => vivo(e) && e.controlador === 'ia').length >= ctx.modo.limites.npcs) return false;
  const lugar = lugarPerto(estado, ctx, dono);
  if (!lugar) return false;
  const antes = estado.entidades.length;
  invocar(estado, ctx, dono, construirEfeito('invocar', { ref: 'servo_ossuario', valor: 1, duracaoMs: tipo === 'servo' ? 86_400_000 : r.duracaoMortoMs }), saida);
  const morto = estado.entidades[antes];
  if (!morto?.invocacao) return false;
  posicionar(morto, lugar.x, lugar.y);
  morto.origemX = lugar.x;
  morto.origemY = lugar.y;
  morto.invocacao.necromancia = tipo;
  if (tipo === 'servo') morto.invocacao.expiraTick = Number.MAX_SAFE_INTEGER;
  const classe = fonte ? ctx.conteudo.classes.get(fonte.classeId ?? fonte.bolsa?.classeId ?? '') : undefined;
  const modelo = fonte ? ctx.conteudo.presets.get(fonte.preset)?.modelo ?? classe?.modelo : undefined;
  if (modelo) morto.invocacao.modeloOriginal = modelo;
  morto.nome = tipo === 'servo' ? 'Servo do ossuário' : `${tipo === 'eco' ? 'Eco' : 'Reanimado'} de ${fonte?.nome ?? 'morto'}`;
  morto.nivel = dono.nivel;
  // Marco 22 (D-090): a Inteligência do Necromante acima de 10 fortalece os mortos (a build focada rende).
  const poder = 8 + Math.floor(dono.nivel / 2) + Math.floor(Math.max(0, dono.atributos.inteligencia - 10) * r.atributoPorInt);
  morto.atributos = { ...morto.atributos, forca: poder, inteligencia: poder };
  // Marco 24 (D-095): a sintonia da terra dá mais vida aos mortos.
  morto.hpMax = vidaDoMorto(ctx, dono, Math.round((r.vidaBase + dono.nivel * r.vidaPorNivel) * (tipo === 'servo' ? r.vidaServoPct / 100 : 1)), estado.tick);
  morto.hp = morto.hpMax;
  morto.aparencia = fonte?.aparencia ? { ...fonte.aparencia } : null;
  contarExercito(estado, dono);
  return true;
}

/**
 * Marco 22 (23/10/2026, D-090): o morto que se afasta além de `distanciaRetorno` células do Necromante (perseguindo,
 * preso atrás de uma porta, esquecido numa sala) volta para o lado dele.
 */
function trazerDeVolta(estado: EstadoJogo, ctx: ContextoSimulacao, dono: Entidade, saida: EventoSimulacao[]): void {
  for (const morto of estado.entidades) {
    if (!vivo(morto) || morto.invocacao?.donoId !== dono.id || !morto.invocacao.necromancia) continue;
    if (chebyshev(dono, morto) <= ctx.balance.necromancia.distanciaRetorno) continue;
    const lugar = lugarPerto(estado, ctx, dono);
    if (!lugar) return;
    const de = { x: morto.x, y: morto.y };
    Object.assign(morto, { x: lugar.x, y: lugar.y, px: lugar.x, py: lugar.y, origemX: lugar.x, origemY: lugar.y, caminho: [], waypoints: [] });
    saida.push({ t: 'invocacaoRetornou', tick: estado.tick, id: morto.id, donoId: dono.id, deX: de.x, deY: de.y, x: lugar.x, y: lugar.y });
  }
}

/** Marco 22 (D-090): cada morto sabe quantos do mesmo dono estão de pé (o dano de cada um cai com a quantidade). */
function contarExercito(estado: EstadoJogo, dono: Entidade): void {
  const mortos = estado.entidades.filter((e) => vivo(e) && e.invocacao?.donoId === dono.id && !!e.invocacao.necromancia);
  for (const m of mortos) if (m.invocacao) m.invocacao.exercito = mortos.length;
}

/** Passiva de classe, sem depender das quatro habilidades equipadas. */
export function processarServosNecromantes(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): void {
  for (const dono of [...estado.entidades]) {
    if (necromante(dono)) {
      trazerDeVolta(estado, ctx, dono, saida);
      contarExercito(estado, dono);
    }
    if (!necromante(dono) || estado.entidades.some((e) => vivo(e) && e.invocacao?.donoId === dono.id && e.invocacao.necromancia === 'servo')) continue;
    if ((estado.recargas[chaveServo(dono.id)] ?? 0) > estado.tick) continue;
    if (!erguer(estado, ctx, dono, 'servo', null, saida)) estado.recargas[chaveServo(dono.id)] = estado.tick + ticksDe(1000);
  }
}

/** Uma morte confirmada cria no máximo um eco aliado; nunca consome o personagem original. */
export function colherMorto(estado: EstadoJogo, ctx: ContextoSimulacao, morto: Entidade, matador: Entidade | undefined, saida: EventoSimulacao[]): void {
  if (morto.invocacao) {
    // Marco 24 (D-095): o que a sintonia faz quando um morto cai; o Pastor das almas traz o servo mais cedo.
    aoCairOMorto(estado, ctx, morto, saida);
    const dono = buscarEntidade(estado, morto.invocacao.donoId);
    const retorno = retornoDoServo(ctx, dono, estado.tick) ?? ctx.balance.necromancia.retornoServoMs;
    if (morto.invocacao.necromancia === 'servo') estado.recargas[chaveServo(morto.invocacao.donoId)] = estado.tick + ticksDe(retorno);
    return;
  }
  const r = ctx.balance.necromancia;
  if (morto.controlador === 'ia') {
    const dono = matador?.invocacao ? buscarEntidade(estado, matador.invocacao.donoId) : matador;
    if (dono && necromante(dono) && podeFerir(dono, morto, ctx.modo) && chebyshev(dono, morto) <= r.raioColheita) erguer(estado, ctx, dono, 'reanimado', morto, saida);
    return;
  }
  const chave = `necromante:eco:${morto.id}`;
  if ((estado.recargas[chave] ?? 0) > estado.tick) return;
  const candidatos = estado.entidades.filter((e) => e.id !== morto.id && necromante(e) && podeAjudar(e, morto, ctx.modo) && chebyshev(e, morto) <= r.raioColheita)
    .sort((a, b) => chebyshev(a, morto) - chebyshev(b, morto) || a.id.localeCompare(b.id));
  for (const dono of candidatos) if (erguer(estado, ctx, dono, 'eco', morto, saida)) {
    estado.recargas[chave] = estado.tick + ticksDe(r.ecoRecargaMs);
    break;
  }
}

/**
 * Marco 22 (D-090): sem um morto ao alcance do ritual, o Dízimo vital ergue um (o servo, se ele caiu; senão, um
 * reanimado), desde que haja vaga. A barra troca o ícone quando o Dízimo está nesse modo.
 */
export function dizimoErgue(estado: EstadoJogo, ctx: ContextoSimulacao, dono: Entidade): boolean {
  return !invocacaoParaDrenar(estado, ctx, dono);
}

export function podeErguerNoDizimo(estado: EstadoJogo, ctx: ContextoSimulacao, dono: Entidade): boolean {
  return contarInvocacoes(estado, dono.id) < limiteDeInvocacoes(ctx, dono);
}

/** O alvo nunca é um jogador, um avatar ou uma invocação de outro dono. */
export function invocacaoParaDrenar(estado: EstadoJogo, ctx: ContextoSimulacao, dono: Entidade): Entidade | undefined {
  return estado.entidades.filter((e) => vivo(e) && e.invocacao?.donoId === dono.id && !e.invocacao.avatar && chebyshev(dono, e) <= ctx.balance.necromancia.alcanceRitual)
    .sort((a, b) => chebyshev(a, dono) - chebyshev(b, dono) || a.id.localeCompare(b.id))[0];
}

export function executarRitual(estado: EstadoJogo, ctx: ContextoSimulacao, dono: Entidade, ef: EfeitoCanonico, acaoId: number | undefined, fatorCura: number, aplicar: (alvo: Entidade, efeito: EfeitoCanonico) => void, saida: EventoSimulacao[]): void {
  if (ef.tipo === 'drenar_invocacao') {
    const alvo = invocacaoParaDrenar(estado, ctx, dono);
    if (!alvo) {
      const temServo = estado.entidades.some((e) => vivo(e) && e.invocacao?.donoId === dono.id && e.invocacao.necromancia === 'servo');
      if (erguer(estado, ctx, dono, temServo ? 'reanimado' : 'servo', null, saida) && !temServo) estado.recargas[chaveServo(dono.id)] = estado.tick;
      return;
    }
    if (dono.hp >= dono.hpMax || fatorCura <= 0) return;
    const gasto = Math.max(0, Math.min(alvo.hp, ef.valor, Math.ceil((dono.hpMax - dono.hp) / fatorCura)));
    if (gasto <= 0) return;
    alvo.hp -= gasto;
    aplicar(dono, construirEfeito('cura', { valor: gasto }));
    fato(dono, 'drenou', alvo.id, acaoId);
    saida.push({ t: 'efeitoResultado', tick: estado.tick, alvoId: alvo.id, origemId: dono.id, tipo: ef.tipo, dano: gasto, cura: 0, mana: 0 });
  } else if (ef.tipo === 'comandar_mortos') {
    for (const alvo of estado.entidades) {
      if (!vivo(alvo) || alvo.invocacao?.donoId !== dono.id || chebyshev(dono, alvo) > ctx.balance.necromancia.alcanceRitual) continue;
      aplicar(alvo, construirEfeito('bonus_dano', { pct: ef.pct, duracaoMs: ef.duracaoMs }));
      aplicar(alvo, construirEfeito('ab_recarga', { pct: 20, duracaoMs: ef.duracaoMs }));
      fato(dono, 'comandou', alvo.id, acaoId);
    }
  }
}
