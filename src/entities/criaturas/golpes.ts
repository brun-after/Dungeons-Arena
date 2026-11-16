// Marco 45 (16/11/2026, D-182): o que os traços das criaturas de Filo mudam no golpe — quanto entra (o casco do
// Pedrico, as placas do Quebra-gelo, o escudo frontal do Guardião, a nuvem do Enxame, a sombra roubada fora da luz, a
// estase do Obelisco, as costas do Colosso), quanto sai (o bando, a penitência, a fome, o terreno) e o que acontece
// depois (a placa que cai, a fuga do Tiçãozinho, a divisão do Gosminho, a cópia do Espelhante, a sangria do Bebedor).

import type { ContextoSimulacao } from '../../core/contexto';
import type { EstadoJogo } from '../../core/estado';
import type { EventoSimulacao } from '../../core/eventos-simulacao';
import { aplicarEfeito } from '../../combat/efeitos';
import { invocar } from '../../combat/efeitos-fluxo';
import { celulaOcupada, chebyshev } from '../../combat/geometria';
import type { Habilidade } from '../../combat/habilidades';
import { construirEfeito } from '../../combat/registro-efeitos';
import { podeAjudar, podeFerir } from '../../modos/relacao';
import { vivo, type Entidade } from '../entidade';
import { iluminado } from '../ia-mundo';
import { protecaoDoChefe } from './chefes';
import { devolucaoDaMascara } from './chefes-mecanicas';
import { presetDe, reacaoAgora, terrenoSob, tracoDe } from './terreno';
import { bloqueiaPelaFrente, criaturaDe, enrolado, flutuando, largarPedra, protecaoDaEstase } from './tracos';

const emArea = (hab: Habilidade): boolean => hab.tipoArea !== 'nenhuma' || hab.raioArea > 0;

/** O fator do dano que a criatura leva deste golpe (1 = sem mudança; 0 = não entra). */
export function fatorRecebidoDaCriatura(estado: EstadoJogo, ctx: ContextoSimulacao, alvo: Entidade, atacante: Entidade | undefined, hab: Habilidade, costas: boolean): number {
  if (alvo.controlador !== 'ia') return 1;
  const p = presetDe(ctx, alvo);
  if (!p) return 1;
  let f = 1;
  for (const t of p.tracos) {
    if (t.tipo === 'enrolar' && enrolado(estado, alvo)) f *= 1 - t.reducaoPct / 100;
    if (t.tipo === 'placas') f *= 1 - ((alvo.criatura?.placas ?? t.qtd) * t.reducaoPct) / 100;
    if (t.tipo === 'frontal' && atacante && bloqueiaPelaFrente(ctx, alvo, celulaOcupada(atacante))) f = 0;
    if (t.tipo === 'flutuar' && hab.politicaImpacto === 'contato' && flutuando(estado, alvo)) f = 0;
    if (t.tipo === 'nuvem') f *= (emArea(hab) || hab.elemento === 'fogo' ? t.areaPct : t.alvoUnicoPct) / 100;
    if (t.tipo === 'soNaLuz' && !iluminado(estado, ctx, alvo) && terrenoSob(estado, ctx, alvo) !== 'luz_sagrada') f *= t.foraPct / 100;
    if (t.tipo === 'costas' && costas) f *= 1 + t.multPct / 100;
  }
  // O Velejador pousado no alto: o golpe de perto, de baixo, não chega.
  if (alvo.criatura?.plantada && p.comportamento === 'pousar' && hab.politicaImpacto === 'contato') f = 0;
  const estase = protecaoDaEstase(estado, ctx, alvo);
  if (estase > 0) f *= 1 - estase / 100;
  return f * protecaoDoChefe(estado, ctx, alvo, { costas, contato: hab.politicaImpacto === 'contato' });
}

/** O fator do dano que a criatura causa (o bando, a penitência, a fome, o terreno, o Enxame no alvo parado). */
export function fatorCausadoDaCriatura(estado: EstadoJogo, ctx: ContextoSimulacao, atacante: Entidade, alvo: Entidade): number {
  if (atacante.controlador !== 'ia') return 1;
  const p = presetDe(ctx, atacante);
  if (!p) return 1;
  let f = 1 + reacaoAgora(estado, ctx, atacante).danoPct / 100;
  for (const t of p.tracos) {
    if (t.tipo === 'bando') {
      const n = estado.entidades.filter((o) => o !== atacante && vivo(o) && o.preset === atacante.preset && chebyshev(o, atacante) <= t.raio).length;
      f *= 1 + Math.min(t.maxPct, n * t.porAliadoPct) / 100;
    }
    if (t.tipo === 'penitencia') f *= 1 + (((atacante.hpMax - atacante.hp) * 100) / Math.max(1, atacante.hpMax) * t.porPct) / 100;
    if (t.tipo === 'faminto') f *= 1 + ((atacante.criatura?.comidos ?? 0) * t.porMortePct) / 100;
    if (t.tipo === 'nuvem' && alvo.caminho.length === 0) f *= 1 + t.paradoPct / 100;
  }
  return f;
}

/** Depois do golpe que tirou `dano` da criatura (ou que a criatura deu). */
export function aposGolpeDaCriatura(estado: EstadoJogo, ctx: ContextoSimulacao, alvo: Entidade, atacante: Entidade | undefined, hab: Habilidade, dano: number, saida: EventoSimulacao[]): void {
  if (atacante && atacante.controlador === 'ia' && atacante !== alvo) aposGolpeDado(estado, ctx, atacante, alvo, hab, dano, saida);
  if (alvo.controlador !== 'ia' || dano <= 0) return;
  // O Rei das Máscaras na máscara do riso devolve parte do golpe a quem bateu.
  const devolve = atacante && atacante !== alvo && podeFerir(alvo, atacante, ctx.modo) ? devolucaoDaMascara(ctx, alvo) : 0;
  if (atacante && devolve > 0) aplicarEfeito(estado, ctx, atacante, construirEfeito('dano_direto', { valor: Math.max(1, Math.round(dano * devolve)) }), { id: alvo.id, x: alvo.x, y: alvo.y }, null, saida);
  const p = presetDe(ctx, alvo);
  if (!p) return;
  const c = criaturaDe(alvo);
  c.golpeFinal = { area: emArea(hab), sagrado: hab.elemento === 'sagrado' };
  for (const t of p.tracos) {
    if (t.tipo === 'placas' && (c.placas ?? t.qtd) > 0 && dano * 100 >= alvo.hpMax * t.golpeMinPct) c.placas = (c.placas ?? t.qtd) - 1;
    if (t.tipo === 'fugaFerida' && !c.fugiu && alvo.hp * 100 < alvo.hpMax * t.hpPct) {
      c.fugiu = true;
      for (const tipo of ['imune_dano', 'petrificado'] as const) aplicarEfeito(estado, ctx, alvo, construirEfeito(tipo, { duracaoMs: t.imuneMs }), { id: alvo.id, x: alvo.x, y: alvo.y }, null, saida);
    }
    if (t.tipo === 'dividir' && !c.dividiu && vivo(alvo) && alvo.hp * 100 <= alvo.hpMax * t.hpPct) dividir(estado, ctx, alvo, t.partes, t.vidaPct, saida);
    if (t.tipo === 'espelho' && atacante && atacante.controlador !== 'ia' && hab.id !== atacante.ataqueBasico && ctx.conteudo.habilidades.has(hab.id)) c.copia = hab.id;
  }
}

function aposGolpeDado(estado: EstadoJogo, ctx: ContextoSimulacao, atacante: Entidade, alvo: Entidade, _hab: Habilidade, dano: number, saida: EventoSimulacao[]): void {
  const r = reacaoAgora(estado, ctx, atacante);
  const origem = { id: atacante.id, x: atacante.x, y: atacante.y };
  if (dano > 0) for (const ef of r.golpe) aplicarEfeito(estado, ctx, alvo, ef, origem, null, saida);
  if (dano > 0) largarPedra(estado, ctx, atacante, alvo, saida);
  // O Bebedor só bebe de quem ele marcou (a sangria); no miasma, bebe em dobro.
  const bebe = tracoDe(ctx, atacante, 'bebe');
  if (bebe && dano > 0 && alvo.efeitos.some((f) => f.tipo === 'marcado' && f.origemId === atacante.id && f.ateTick > estado.tick)) {
    const cura = Math.round((dano * bebe.curaPct * (r.marcas.includes('dobra') ? 2 : 1)) / 100);
    atacante.hp = Math.min(atacante.hpMax, atacante.hp + cura);
    if (cura > 0) saida.push({ t: 'efeitoResultado', tick: estado.tick, alvoId: atacante.id, origemId: atacante.id, tipo: 'cura', dano: 0, cura, mana: 0 });
  }
}

/** O Gosminho vira dois menores: ele mesmo encolhe e nasce um irmão (os dois não se dividem de novo). */
function dividir(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, partes: number, vidaPct: number, saida: EventoSimulacao[]): void {
  criaturaDe(e).dividiu = true;
  const antes = estado.entidades.length;
  invocar(estado, ctx, e, construirEfeito('invocar', { valor: Math.max(1, partes - 1), duracaoMs: 600000, ref: e.preset }), saida);
  const vida = Math.max(1, Math.round((e.hpMax * vidaPct) / 100));
  for (const f of [e, ...estado.entidades.slice(antes)]) {
    criaturaDe(f).dividiu = true;
    f.hp = Math.min(f.hp, vida);
    if (f !== e) f.nivel = e.nivel;
  }
}

/** Os aliados da criatura que somem com ela (as obras: a estátua, o pedregulho) não contam como hostis. */
export const mesmoLado = (ctx: ContextoSimulacao, a: Entidade, b: Entidade): boolean => podeAjudar(a, b, ctx.modo) && !podeFerir(a, b, ctx.modo);

/** Depois dos efeitos da skill: a Tecelã na névoa prende o dobro do tempo com a teia. */
export function aposEfeitosDaCriatura(estado: EstadoJogo, ctx: ContextoSimulacao, alvo: Entidade, atacante: Entidade | undefined, hab: Habilidade): void {
  if (!atacante || atacante.controlador !== 'ia' || hab.id !== 'teia' || !reacaoAgora(estado, ctx, atacante).marcas.includes('teiasDobro')) return;
  for (const f of alvo.efeitos) if (f.origemId === atacante.id && f.ateTick > estado.tick && (f.tipo === 'atolado' || f.tipo === 'sem_movimento')) f.ateTick += f.ateTick - estado.tick;
}
