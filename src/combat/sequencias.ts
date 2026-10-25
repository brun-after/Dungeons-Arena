// Marco 19 (17/10/2026): sequências de duas/três skills. Preparar não confirma: a finalização exige resultado real.
import { cargaPorMomento } from './carga-ultimate';
import recompensasJson from '../data/combos.json';
import type { ContextoSimulacao } from '../core/contexto';
import { buscarEntidade, type EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import { vivo, type Entidade } from '../entities/entidade';
import { podeAjudar, podeFerir } from '../modos/relacao';
import type { Combo } from './combos';
import { aplicarEfeito } from './efeitos';
import { novaMemoria, type EtapaTatica } from './estado-tatico';
import { chebyshev } from './geometria';
import type { Habilidade } from './habilidades';
import { construirEfeito, ehTipoEfeito, type TipoEfeito } from './registro-efeitos';

const r = recompensasJson.recompensas;
const ativo = (e: Entidade, tipo: TipoEfeito, tick: number) => e.efeitos.find((f) => f.tipo === tipo && f.ateTick > tick);
const contemFato = (etapas: EtapaTatica[], nome: string, alvo?: string) => etapas.some((e) => e.fatos.includes(alvo ? `${nome}:${alvo}` : nome));
/** Marco 24 (24/10/2026): o passo `@ultimate` de uma sequência casa com qualquer ultimate (etiqueta `ultimate`). */
const ehUltimate = (ctx: ContextoSimulacao, id: string) => ctx.conteudo.habilidades.get(id)?.tags.includes('ultimate') ?? false;
const casa = (ctx: ContextoSimulacao, passo: string | undefined, id: string) => passo === id || (passo === '@ultimate' && ehUltimate(ctx, id));

function anteriores(ator: Entidade, etapa: EtapaTatica, combo: Combo): EtapaTatica[] {
  const etapas = ator.tatica?.etapas ?? [];
  const i = etapas.indexOf(etapa);
  return etapas.slice(Math.max(0, i - combo.sequencia.length + 1), i);
}
function alvoPreparado(estado: EstadoJogo, etapas: EtapaTatica[]): Entidade | undefined {
  for (const e of etapas) for (const id of e.alvos) {
    const alvo = buscarEntidade(estado, id);
    if (alvo && alvo.id !== e.fatos.find((f) => f.startsWith('ator:'))?.slice(5)) return alvo;
  }
  return undefined;
}
function condicoes(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade, alvo: Entidade | null, etapa: EtapaTatica, c: Combo, final: boolean, sinergias: string[] = []): boolean {
  const prev = anteriores(ator, etapa, c);
  const todas = [...prev, etapa];
  const tick = estado.tick;
  const campos = estado.camposTaticos?.filter((x) => x.donoId === ator.id && x.ateTick > tick) ?? [];
  const circulo = alvo ? campos.find((x) => x.tipo === 'cura' && chebyshev(x, alvo) <= x.raio) : undefined;
  const mesmo = () => !alvo || prev.every((p) => {
    const h = ctx.conteudo.habilidades.get(p.id);
    return h?.formulaDano === null && c.id !== 'refugio_restaurador' ? true : p.alvos.includes(alvo.id);
  });
  if (c.mesmoAlvo && !mesmo()) return false;
  for (const cond of c.condicoes) {
    switch (cond) {
      case 'mesmo_alvo': if (!mesmo()) return false; break;
      case 'deslocou': if (!contemFato(final ? todas : prev, 'deslocou')) return false; break;
      case 'escudo': if (!ativo(c.id === 'refugio_restaurador' && alvo ? alvo : ator, 'escudo', tick)) return false; break;
      case 'puxou': if (!alvo || !contemFato(prev, 'puxou', alvo.id)) return false; break;
      case 'atordoado': if (!alvo || !ativo(alvo, 'atordoar', tick)) return false; break;
      case 'consagrado': if (!alvo || !ativo(alvo, 'consagrado', tick)) return false; break;
      case 'envenenado': if (!alvo || !ativo(alvo, 'envenenado', tick)) return false; break;
      case 'sangrando': if (!alvo || !ativo(alvo, 'sangrando', tick)) return false; break;
      case 'definhando': if (!alvo || (!ativo(alvo, 'definhando', tick) && !(final && sinergias.includes('absolvicao')))) return false; break;
      case 'enraizado': if (!alvo || !ativo(alvo, 'enraizado', tick)) return false; break;
      case 'comandou': if (!prev.some((p) => p.fatos.some((f) => f.startsWith('comandou:')))) return false; break;
      case 'drenou': if (final && !etapa.fatos.some((f) => f.startsWith('drenou:'))) return false; break;
      case 'envenenou': if (!prev.some((p) => p.alvos.some((id) => { const e = buscarEntidade(estado, id); return e && ativo(e, 'envenenado', tick); }))) return false; break;
      case 'enraizou': if (!contemFato(prev, 'enraizou')) return false; break;
      case 'muralha': if (!campos.some((x) => x.tipo === 'muralha')) return false; break;
      case 'colidiu_anterior': if (!alvo || !contemFato(prev, 'colidiu', alvo.id)) return false; break;
      case 'esquivou': if (!ator.tatica || ator.tatica.esquivou < (prev[0]?.tick ?? tick) || tick - ator.tatica.esquivou > ticksDe(ctx.balance.tatica.janelaTotalMs)) return false; break;
      case 'aparou': {
        const a = ator.tatica?.aparou;
        if (!a || a.tick < (prev[0]?.tick ?? tick) || !alvo || a.atacante !== alvo.id) return false;
        break;
      }
      case 'nevoa_alvo': case 'alvo_na_nevoa': {
        const preparado = alvoPreparado(estado, prev);
        if (!preparado) return false;
        if (cond === 'nevoa_alvo' && !final) { if (chebyshev(preparado, { x: etapa.miraX, y: etapa.miraY }) > 1 || !ativo(preparado, 'enraizado', tick)) return false; }
        else if (!campos.some((x) => x.tipo === 'veneno' && chebyshev(x, preparado) <= x.raio) || (cond === 'alvo_na_nevoa' && final && alvo?.id !== preparado.id)) return false;
        break;
      }
      case 'trocou': if (final && !contemFato([etapa], 'trocou')) return false; break;
      case 'purificou': if (final && (!alvo || !contemFato([etapa], 'purificou', alvo.id))) return false; break;
      case 'colidiu': if (final && (!alvo || !contemFato([etapa], 'colidiu', alvo.id))) return false; break;
      case 'no_circulo': if (final && !circulo) return false; break;
      case 'circulo_muralha': if (final && (!circulo || !campos.some((x) => x.tipo === 'muralha' && chebyshev(x, circulo) <= 2))) return false; break;
      case 'eclipse': if (final && !sinergias.includes('eclipse_luz')) return false; break;
      case 'outro_aliado': if (alvo && (alvo === ator || !podeAjudar(ator, alvo, ctx.modo))) return false; break;
      case 'curou': if (final && (!alvo || !contemFato([etapa], 'curou', alvo.id))) return false; break;
      // Marco 24 (24/10/2026): `alvo:<estado>` — o alvo está com o estado (desafiado, cego, marca do caçador…).
      default: if (cond.startsWith('alvo:')) { const tipo = cond.slice(5); if (!alvo || !ehTipoEfeito(tipo) || !ativo(alvo, tipo, tick)) return false; }
    }
  }
  return true;
}

/** Só mantém histórico quando o repertório permite concluir alguma sequência desta skill. */
export function participaDeCombo(ctx: ContextoSimulacao, ator: Entidade, id: string): boolean {
  const repertorio = new Set([...(ator.bolsa?.conhecidas.map((c) => c.id) ?? []), ...ator.habilidades]);
  const temUltimate = [...repertorio].some((r) => ehUltimate(ctx, r));
  return [...ctx.conteudo.combos.values()].some((c) => c.sequencia.some((s) => casa(ctx, s, id)) && c.sequencia.every((s) => repertorio.has(s) || (s === '@ultimate' && temUltimate)));
}

export function prepararSequencia(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade, hab: Habilidade, acaoId: number, alvo: Entidade | null, mira: { x: number; y: number }): Habilidade {
  if (hab.id === ator.ataqueBasico) return hab;
  // Só atores com uma habilidade de combo mantêm histórico; os demais não pagam por esta camada.
  if (!participaDeCombo(ctx, ator, hab.id)) { if (ator.tatica) ator.tatica.etapas = []; return hab; }
  const mem = ator.tatica ??= novaMemoria();
  mem.etapas = mem.etapas.filter((e) => estado.tick - e.tick <= ticksDe(ctx.balance.tatica.janelaTotalMs)).slice(-2);
  const etapa: EtapaTatica = { id: hab.id, acaoId, tick: estado.tick, x: ator.x, y: ator.y, miraX: mira.x, miraY: mira.y, alvos: [], fatos: [`ator:${ator.id}`], preparado: null, concluidos: [] };
  mem.etapas.push(etapa);
  const candidatos = [...ctx.conteudo.combos.values()].filter((c) => {
    if (!casa(ctx, c.sequencia.at(-1), hab.id)) return false;
    const prev = anteriores(ator, etapa, c);
    if (prev.length !== c.sequencia.length - 1 || prev.some((p, i) => !casa(ctx, c.sequencia[i], p.id) || (!p.alvos.length && !p.fatos.some((f) => !f.startsWith('ator:'))))) return false;
    const primeiro = prev[0], ultimo = prev.at(-1);
    if (!primeiro || !ultimo || estado.tick - primeiro.tick > ticksDe(ctx.balance.tatica.janelaTotalMs)) return false;
    if (!todasJanelas([...prev, etapa], ticksDe(c.janelaMs))) return false;
    return condicoes(estado, ctx, ator, alvo ?? alvoPreparado(estado, prev) ?? null, etapa, c, false);
  }).sort((a, b) => b.sequencia.length - a.sequencia.length);
  etapa.preparado = candidatos[0]?.id ?? null;
  const c = etapa.preparado ? ctx.conteudo.combos.get(etapa.preparado) : undefined;
  if (c?.recompensa === 'area_maior') {
    const preparado = alvoPreparado(estado, anteriores(ator, etapa, c));
    if (c.condicoes.includes('mesmo_alvo') && (!preparado || chebyshev(preparado, mira) > hab.raioArea)) { etapa.preparado = null; return hab; }
    return { ...hab, raioArea: Math.min(5, hab.raioArea + r.raioArea) };
  }
  if (c?.recompensa === 'salto_extra') return { ...hab, saltosExtrasCombo: 1, saltos: { quantidade: (hab.saltos?.quantidade ?? 0) + 1, raio: hab.saltos?.raio ?? 3, pct: hab.saltos?.pct ?? 60 } };
  return hab;
}
function todasJanelas(etapas: EtapaTatica[], janela: number): boolean {
  return etapas.every((e, i) => i === 0 || e.tick - (etapas[i - 1]?.tick ?? e.tick) <= janela);
}

function opcoesDoImpacto(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade, etapa: EtapaTatica): Combo[] {
  if (!etapa.preparado) return [];
  const concluido = etapa.concluidos[0];
  if (concluido) { const c = ctx.conteudo.combos.get(concluido); return c ? [c] : []; }
  return [...ctx.conteudo.combos.values()].filter((c) => {
    if (!casa(ctx, c.sequencia.at(-1), etapa.id)) return false;
    const prev = anteriores(ator, etapa, c);
    const primeiro = prev[0];
    return !!primeiro && prev.length === c.sequencia.length - 1
      && prev.every((e, i) => casa(ctx, c.sequencia[i], e.id) && e.alvos.length > 0)
      && etapa.tick - primeiro.tick <= ticksDe(ctx.balance.tatica.janelaTotalMs)
      && todasJanelas([...prev, etapa], ticksDe(c.janelaMs));
  }).sort((a, b) => b.sequencia.length - a.sequencia.length);
}

export function comboDoImpacto(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade, hab: Habilidade, acaoId: number, alvo: Entidade): Combo | null {
  const etapa = ator.tatica?.etapas.find((e) => e.acaoId === acaoId && e.id === hab.id);
  if (!etapa) return null;
  return opcoesDoImpacto(estado, ctx, ator, etapa).find((c) => condicoes(estado, ctx, ator, alvo, etapa, c, false)) ?? null;
}

export function confirmarImpactoTatico(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade, alvo: Entidade, hab: Habilidade, acaoId: number, cura: number, sinergias: string[], saida: EventoSimulacao[]): void {
  const etapa = ator.tatica?.etapas.find((e) => e.acaoId === acaoId && e.id === hab.id);
  if (!etapa) return;
  if (!etapa.alvos.includes(alvo.id)) etapa.alvos.push(alvo.id);
  const anotar = (s: string) => { if (!etapa.fatos.includes(s)) etapa.fatos.push(s); };
  if (cura > 0) anotar(`curou:${alvo.id}`);
  if (ativo(alvo, 'enraizado', estado.tick)) anotar('enraizou');
  const c = opcoesDoImpacto(estado, ctx, ator, etapa).find((c) => condicoes(estado, ctx, ator, alvo, etapa, c, true, sinergias));
  if (!c) return;
  if (c.recompensa === 'veneno_curto' && !ativo(alvo, 'envenenado', estado.tick)) aplicarEfeito(estado, ctx, alvo, construirEfeito('envenenado', { valor: r.venenoValor, duracaoMs: r.venenoDuracaoMs, pct: 20 }), ator, alvo, saida);
  if (etapa.concluidos.includes(c.id)) return;
  etapa.concluidos.push(c.id);
  const aplicar = (e: Entidade, tipo: TipoEfeito, valor = 0, duracaoMs = r.escudoDuracaoMs, pct = 0) => { aplicarEfeito(estado, ctx, e, construirEfeito(tipo, { valor: valor + (tipo === 'escudo' ? ativo(e, 'escudo', estado.tick)?.valor ?? 0 : 0), duracaoMs, pct }), ator, e, saida); };
  const hostis = (centro: { x: number; y: number }, raio: number) => estado.entidades.filter((e) => vivo(e) && podeFerir(ator, e, ctx.modo) && chebyshev(e, centro) <= raio);
  // Recompensas declarativas antigas continuam usando o dispatcher de efeitos.
  for (const ef of c.noAlvo) aplicarEfeito(estado, ctx, alvo, ef, ator, alvo, saida);
  for (const ef of c.noProprio) aplicarEfeito(estado, ctx, ator, ef, ator, ator, saida);
  if (c.emVolta) for (const e of hostis(ator, c.emVolta.raio)) for (const ef of c.emVolta.efeitos) aplicarEfeito(estado, ctx, e, ef, ator, e, saida);
  if (c.naMira) for (const e of hostis({ x: etapa.miraX, y: etapa.miraY }, c.naMira.raio)) for (const ef of c.naMira.efeitos) aplicarEfeito(estado, ctx, e, ef, ator, e, saida);
  const prolongar = (tipo: TipoEfeito) => { const f = ativo(alvo, tipo, estado.tick); if (f) f.ateTick += ticksDe(r.prolongarMs); };
  const queimar = () => { for (const e of hostis(alvo, 1)) aplicar(e, 'queimando', r.queimaValor, r.queimaDuracaoMs); };
  switch (c.recompensa) {
    case 'reforcar_escudo': aplicar(ator, 'escudo', r.reforcarEscudo); break;
    case 'escudo_curto': aplicar(ator, 'escudo', r.escudoCurto); break;
    case 'escudo_alvo': aplicar(alvo, 'escudo', r.escudoAlvo); break;
    case 'queima_longa': prolongar('queimando'); break;
    case 'queima_area': queimar(); break;
    case 'forja': aplicar(ator, 'escudo', r.reforcarEscudo); queimar(); break;
    case 'marca_longa': prolongar('marcado'); break;
    case 'consagracao_longa': prolongar('consagrado'); break;
    case 'exposicao': prolongar('exposto'); break;
    case 'sangramento_longo': prolongar('sangrando'); break;
    case 'sangramento_forte': { const f = ativo(alvo, 'sangrando', estado.tick); if (f) f.valor = Math.max(f.valor, (hab.efeitos.find((e) => e.tipo === 'sangrando')?.valor ?? f.valor) + r.sangramentoExtra); break; }
    case 'veneno_curto':
      for (const id of etapa.alvos) { const e = buscarEntidade(estado, id); if (e && !ativo(e, 'envenenado', estado.tick)) aplicar(e, 'envenenado', r.venenoValor, r.venenoDuracaoMs, 20); }
      break;
    case 'pantano': { const campo = estado.camposTaticos?.find((x) => x.donoId === ator.id && x.tipo === 'veneno' && x.x === etapa.miraX && x.y === etapa.miraY && x.ateTick > estado.tick); if (campo) campo.pantano = true; break; }
    case 'peste': {
      const preparado = alvoPreparado(estado, anteriores(ator, etapa, c));
      if (preparado) for (const e of hostis(preparado, 1)) { if (!ativo(e, 'envenenado', estado.tick)) aplicar(e, 'envenenado', r.venenoValor, r.venenoDuracaoMs, 20); aplicar(e, 'atolado', 0, r.prolongarMs, r.lentidaoPct); }
      break;
    }
    case 'colisao': aplicar(alvo, 'dano_direto', ctx.balance.tatica.colisaoDano, 0); aplicar(alvo, 'atordoar', 0, ctx.balance.tatica.colisaoAtordoarMs); break;
    case 'consumir_sangramento': case 'consumir_veneno': {
      const f = ativo(alvo, c.recompensa === 'consumir_veneno' ? 'envenenado' : 'sangrando', estado.tick);
      if (f && f.origemId === ator.id) {
        const restante = f.valor * Math.ceil((f.ateTick - estado.tick) / ticksDe(1000));
        alvo.efeitos = alvo.efeitos.filter((x) => x !== f);
        aplicar(alvo, 'dano_direto', Math.min(ctx.balance.tatica.consumoTeto, Math.round(restante * ctx.balance.tatica.consumoPct / 100)), 0);
      }
      break;
    }
    case 'escudo_grupo': {
      const campo = estado.camposTaticos?.find((x) => x.donoId === ator.id && x.tipo === 'cura' && x.ateTick > estado.tick && chebyshev(x, alvo) <= x.raio);
      if (campo) for (const e of estado.entidades) if (vivo(e) && podeAjudar(ator, e, ctx.modo) && chebyshev(e, campo) <= campo.raio) aplicar(e, 'escudo', r.escudoGrupo);
      break;
    }
    case 'rastro_gelo': {
      // O avanço já ocorreu: cobre o percurso confirmado, sem dano e respeitando o limite espacial.
      const dx = Math.sign(ator.x - etapa.x), dy = Math.sign(ator.y - etapa.y);
      const n = Math.max(Math.abs(ator.x - etapa.x), Math.abs(ator.y - etapa.y));
      for (let i = 0; i <= n; i++) estado.rastros.push({ x: etapa.x + dx * i, y: etapa.y + dy * i, donoId: ator.id, equipeDono: ator.equipe, tipo: 'rastro_efeito', valor: 0, interno: construirEfeito('atolado', { duracaoMs: r.prolongarMs, pct: r.lentidaoPct }), ateTick: estado.tick + ticksDe(r.rastroMs), atingidos: [] });
      break;
    }
  }
  saida.push({ t: 'comboFeito', tick: estado.tick, id: ator.id, combo: c.id, alvoId: alvo.id, x: alvo.x, y: alvo.y, origemX: etapa.x, origemY: etapa.y, atorX: ator.x, atorY: ator.y, miraX: etapa.miraX, miraY: etapa.miraY });
  // Marco 24 (D-094): concluir um combo enche a ultimate.
  cargaPorMomento(ctx, ator, 'combo', estado.tick, saida);
}

/** A névoa preparada renova lentidão curta só em quem continua dentro dela. */
export function processarPantanos(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): void {
  for (const campo of estado.camposTaticos ?? []) {
    if (!campo.pantano || campo.ateTick <= estado.tick) continue;
    const ator = buscarEntidade(estado, campo.donoId);
    if (!ator || !vivo(ator)) continue;
    for (const e of estado.entidades) {
      if (!vivo(e) || !podeFerir(ator, e, ctx.modo) || chebyshev(campo, e) > campo.raio) continue;
      aplicarEfeito(estado, ctx, e, construirEfeito('atolado', { duracaoMs: r.lentidaoMs, pct: r.lentidaoPct }), ator, e, saida, !ativo(e, 'atolado', estado.tick));
    }
  }
}

export function progressoDeCombo(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade): { combo: Combo; etapa: number; proxima: string } | null {
  const etapas = ator.tatica?.etapas ?? [];
  const barra = ator.bolsa?.barra ?? ator.habilidades;
  const candidatos: { combo: Combo; etapa: number; proxima: string }[] = [];
  for (const c of ctx.conteudo.combos.values()) {
    if (!c.sequencia.every((id) => id === '@ultimate' || barra.includes(id))) continue;
    for (let n = c.sequencia.length - 1; n > 0; n--) {
      const prev = etapas.slice(-n);
      const ultimo = prev.at(-1), primeiro = prev[0];
      if (!ultimo || !primeiro || prev.length !== n || estado.tick - ultimo.tick > ticksDe(c.janelaMs) || estado.tick - primeiro.tick > ticksDe(ctx.balance.tatica.janelaTotalMs)) continue;
      if (!todasJanelas(prev, ticksDe(c.janelaMs)) || !prev.every((e, i) => casa(ctx, c.sequencia[i], e.id) && e.alvos.length > 0)) continue;
      const proxima = c.sequencia[n];
      if (proxima) candidatos.push({ combo: c, etapa: n, proxima });
      break;
    }
  }
  return candidatos.sort((a, b) => b.etapa - a.etapa || b.combo.sequencia.length - a.combo.sequencia.length)[0] ?? null;
}
