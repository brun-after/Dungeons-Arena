// D-188 (19/11/2026): o cansaço das feras do Aventureiro. Cada fera (falcão, lobo, urso) tem um fôlego de 0 a 100,
// desenhado como um anel preto em volta dela (render/sprites.ts). Gastam o fôlego:
// - levar o dono montado (o falcão, pelo tempo de andar o alcance do voo; o lobo, 1 min; o urso, 1 min 30 no nível 1);
// - os golpes na caça marcada (cada golpe do básico da fera) e as skills de classe que saem dela (o Mergulho, ~3 por
//   fôlego cheio no nível 1);
// - o dano que ela segura: o golpe no bicho passa ao dono só a fração do repasse (30%, 20%, 10% no nível 1), na vida
//   atual, e o resto vira cansaço.
// Sem fôlego, a fera cansa: desce o dono, não luta e descansa (15 s, 30 s, 1 min 30 no nível 1); a da vez passa
// sozinha à próxima descansada. Com as três cansadas, o Aventureiro fica sem skills de classe e o básico e as skills
// comuns saem dele. Fora de campo (e ao lado do dono, fora de combate e sem levar ninguém), a fera recupera o fôlego
// aos poucos (cheio no dobro do descanso; no nível 70, no descanso). Tudo cresce aos poucos com o nível (os pares
// [nível 1, nível 100] de `ajustesClasses.aventureiro.feras`) e com os estilos (`estilosDosPets`, pets-estilos.ts).
// Puro.

import type { ContextoSimulacao } from '../core/contexto';
import { buscarEntidade, type EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import { vivo, type Entidade, type EstadoFera } from '../entities/entidade';
import { emCombate } from '../progression/buffs';
import { leituraDoPet } from './pets-estilos';
import { classeDoAventureiro, feraDisponivel, PETS, petDe, type Pet } from './pets';

const feras = (ctx: ContextoSimulacao) => ctx.balance.ajustesClasses.aventureiro.feras;

/** O valor do par [nível 1, nível 100] no nível (linear entre os dois). */
export const noNivel = ([a, b]: readonly [number, number], nivel: number): number => a + (b - a) * ((Math.min(100, Math.max(1, nivel)) - 1) / 99);

/** O fôlego da fera (criado cheio na primeira vez). */
export function feraDe(e: Entidade, pet: Pet): EstadoFera {
  const f = (e.feras ??= {});
  return (f[pet] ??= { energia: 100, cansado: false, descansoAteTick: 0 });
}

/** A fração do fôlego (0 a 1) da fera, sem criar o estado. */
export const folegoDe = (e: Entidade, pet: Pet): number => (e.feras?.[pet]?.energia ?? 100) / 100;

const menos = (ctx: ContextoSimulacao, dono: Entidade, pet: Pet, campo: Parameters<typeof leituraDoPet>[3]) => Math.min(80, Math.max(0, leituraDoPet(ctx, dono, pet, campo))) / 100;

/** A fração do dano no bicho que chega à vida atual do dono (o Sobrevivente segura mais). */
export function repasseDoPet(ctx: ContextoSimulacao, dono: Entidade, pet: Pet): number {
  return (noNivel(feras(ctx)[pet].repassePct, dono.nivel) / 100) * (1 - menos(ctx, dono, pet, 'reflexoMenosPct'));
}

/** O descanso da fera cansada, em ms (o Mestre de Feras descansa menos). */
export function descansoDoPet(ctx: ContextoSimulacao, dono: Entidade, pet: Pet): number {
  return noNivel(feras(ctx)[pet].descansoMs, dono.nivel) * (1 - menos(ctx, dono, pet, 'descansoMenosPct'));
}

/** O fôlego que a montaria gasta por tick: cheio dura `sustentaMs` (o Batedor vai mais longe). */
export function drenoDaMontaria(ctx: ContextoSimulacao, dono: Entidade, pet: Pet, msDoVoo: number): number {
  const f = feras(ctx);
  const ms = pet === 'falcao' ? msDoVoo : noNivel(f[pet].sustentaMs, dono.nivel);
  return (100 / Math.max(1, ticksDe(ms))) * (1 - menos(ctx, dono, pet, 'drenoMenosPct'));
}

/** O quanto a Disparada do lobo multiplica o gasto (o dobro; o Batedor corta parte do extra). */
export function gastoDaDisparada(ctx: ContextoSimulacao, dono: Entidade): number {
  return 1 + (feras(ctx).lobo.disparadaGasto - 1) * (1 - menos(ctx, dono, 'lobo', 'disparadaMenosPct'));
}

/** A velocidade a mais montado (a Disparada do lobo, e o auge do nível 90). */
export function viagemDaMontaria(ctx: ContextoSimulacao, dono: Entidade, pet: Pet, disparada: boolean): number {
  const f = feras(ctx);
  if (pet !== 'lobo' || !disparada) return f[pet].viagemPct;
  return dono.nivel >= f.marcos.auge ? f.auge.disparadaPct : f.lobo.disparadaPct;
}

/** O gasto de um golpe da fera na caça marcada (o Mestre de Feras gasta menos). */
export const gastoDoGolpe = (ctx: ContextoSimulacao, dono: Entidade, pet: Pet): number => noNivel(feras(ctx)[pet].golpe, dono.nivel) * (1 - menos(ctx, dono, pet, 'golpeMenosPct'));

/** O gasto de uma skill de classe que sai da fera (o Mergulho é o mais pesado). */
export function gastoDaSkill(ctx: ContextoSimulacao, dono: Entidade, pet: Pet, habilidadeId: string): number {
  const s = feras(ctx).skill;
  return noNivel(s[habilidadeId] ?? s.padrao, dono.nivel) * (1 - menos(ctx, dono, pet, 'skillMenosPct'));
}

/** O cansaço do dano que a fera segurou (em % do fôlego, pela fração da vida do dono; o Sobrevivente cansa menos). */
export function cansacoDoDano(ctx: ContextoSimulacao, dono: Entidade, pet: Pet, retido: number): number {
  return ((retido / Math.max(1, dono.hpMax)) * 100 * feras(ctx)[pet].cansacoPorDano) * (1 - menos(ctx, dono, pet, 'cansacoMenosPct'));
}

/**
 * D-188, adendo (20/11/2026): a fera que leva o dono agora (montado no lobo ou no urso, levado pelo falcão), ou null.
 * Montados, os dois têm uma vida só: o golpe em qualquer um cai inteiro na vida do dono, sem cansar a fera, e menor
 * (`montadoReducaoPct`: 10% no falcão e no lobo, 20% no urso no nível 1).
 */
export function montadoEm(dono: Entidade): Pet | null {
  const m = dono.movimentoClasse?.modo;
  return m && (m.tipo === 'montado' || m.tipo === 'voo') && m.viagemPct !== undefined ? petDe(dono) : null;
}

/** A fração do dano que sobra montado (1 = nada muda). */
export function fatorMontado(ctx: ContextoSimulacao, dono: Entidade): number {
  const pet = montadoEm(dono);
  return pet ? 1 - noNivel(feras(ctx)[pet].montadoReducaoPct, dono.nivel) / 100 : 1;
}

/** O id da montaria da fera (o botão que mostra o descanso como recarga). */
export function montariaDaFera(ctx: ContextoSimulacao, dono: Entidade, pet: Pet): string | null {
  return (ctx.conteudo.movimentos.get(classeDoAventureiro(dono)) ?? []).find((m) => m.pet === pet && (m.tipo === 'voo' || m.tipo === 'montaria'))?.id ?? null;
}

/** Gasta fôlego da fera; no zero, ela cansa. */
export function gastarFolego(estado: EstadoJogo, ctx: ContextoSimulacao, dono: Entidade, pet: Pet, quanto: number, saida: EventoSimulacao[]): void {
  if (!(quanto > 0)) return;
  const f = feraDe(dono, pet);
  if (f.cansado) return;
  f.energia = Math.max(0, f.energia - quanto);
  if (f.energia <= 1e-6) cansar(estado, ctx, dono, pet, saida);
}

/**
 * A fera cansa: fôlego zero, descanso pelo `fator` (o Arremesso do falcão dobra; o urso que barrou muito volta antes),
 * e a da vez passa à próxima descansada. O botão da montaria mostra o descanso. No marco do Revezamento, quem estava
 * montado já monta a próxima.
 */
export function cansar(estado: EstadoJogo, ctx: ContextoSimulacao, dono: Entidade, pet: Pet, saida: EventoSimulacao[], fator = 1): void {
  const f = feraDe(dono, pet);
  const tick = estado.tick;
  f.energia = 0;
  f.cansado = true;
  f.descansoAteTick = tick + Math.max(1, ticksDe(descansoDoPet(ctx, dono, pet) * fator));
  const mov = montariaDaFera(ctx, dono, pet);
  const mc = (dono.movimentoClasse ??= { ativo: mov ?? '', cargas: {} });
  if (mov) mc.cargas[mov] = [f.descansoAteTick];
  saida.push({ t: 'feraCansou', tick, id: dono.id, pet });
  if (petDe(dono) !== pet) return;
  const montado = mc.modo?.tipo === 'montado' || mc.modo?.tipo === 'voo';
  const proxima = proximaDisponivel(dono, pet);
  if (!proxima) return;
  if (montado && dono.nivel >= feras(ctx).marcos.revezamento) mc.revezarAteTick = tick + ticksDe(1500);
  trocarPara(estado, dono, proxima, saida);
}

/** A próxima fera descansada depois de `de`, na ordem falcão, lobo, urso (null: nenhuma). */
export function proximaDisponivel(e: Entidade, de: Pet): Pet | null {
  const i = PETS.indexOf(de);
  for (let k = 1; k <= PETS.length; k++) {
    const p = PETS[(i + k) % PETS.length];
    if (p && p !== de && feraDisponivel(e, p)) return p;
  }
  return null;
}

/** Põe `pet` como a fera da vez: a que estava em campo sai e a nova chega no tick seguinte. */
export function trocarPara(estado: EstadoJogo, e: Entidade, pet: Pet, saida: EventoSimulacao[]): void {
  if (e.bolsa) e.bolsa.pet = pet;
  e.petAtivo = pet;
  for (const c of estado.entidades) {
    if (!vivo(c) || c.invocacao?.donoId !== e.id || !c.invocacao.companheiro) continue;
    c.invocacao.companheiro = false;
    c.hp = 0;
    c.participacao = [];
  }
  saida.push({ t: 'companheiroTrocado', tick: estado.tick, id: e.id, pet });
}

/** A Troca de companheiro (o Shift): a próxima fera descansada. False: nenhuma outra descansada. */
export function trocarPet(estado: EstadoJogo, e: Entidade, saida: EventoSimulacao[]): boolean {
  if (classeDoAventureiro(e) !== 'aventureiro' || e.invocacao) return false;
  const proxima = proximaDisponivel(e, petDe(e));
  if (!proxima) return false;
  trocarPara(estado, e, proxima, saida);
  return true;
}

/**
 * A cada tick: a fera que acabou de descansar volta cheia (e, se a da vez está cansada, assume); as descansadas que
 * não levam ninguém recuperam o fôlego aos poucos (a da vez, só fora de combate).
 */
export function processarFeras(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): void {
  const tick = estado.tick;
  const f = feras(ctx);
  for (const dono of estado.entidades) {
    if (!dono.feras || dono.invocacao || !vivo(dono)) continue;
    const da = petDe(dono);
    const mc = dono.movimentoClasse;
    const levando = mc?.modo?.tipo === 'montado' || mc?.modo?.tipo === 'voo';
    for (const pet of PETS) {
      const s = dono.feras[pet];
      if (!s) continue;
      if (s.cansado) {
        if (tick < s.descansoAteTick) continue;
        s.cansado = false;
        s.energia = 100;
        saida.push({ t: 'feraDescansou', tick, id: dono.id, pet });
        if (!feraDisponivel(dono, da)) trocarPara(estado, dono, pet, saida);
        continue;
      }
      if (s.energia >= 100) continue;
      const contendo = pet === 'urso' && !!mc?.contencao;
      if (contendo || (pet === da && (levando || emCombate(estado, ctx, dono)))) continue;
      const fator = dono.nivel >= f.marcos.folego ? 1 : f.foraDeCampo;
      s.energia = Math.min(100, s.energia + 100 / Math.max(1, ticksDe(descansoDoPet(ctx, dono, pet) * fator)));
    }
  }
}

/** O dono da fera (para quem só tem a fera à mão). */
export const donoDaFera = (estado: EstadoJogo, fera: Entidade): Entidade | undefined => (fera.invocacao?.companheiro ? buscarEntidade(estado, fera.invocacao.donoId) : undefined);
