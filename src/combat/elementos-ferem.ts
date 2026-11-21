// Marco 48 (20/11/2026, D-193): os elementos passam a ferir. Antes só o fogo e o veneno tinham dano por tempo, e em
// valores fixos (3 e 2 por tique): perto de 2% da vida de um inimigo do nível 30. Agora:
// - o estado guarda uma fração do golpe que o aplicou (estilos, arma, nível e crítico já dentro), e cada tique passa
//   pela resistência do alvo àquele elemento (`fatorDoTique`);
// - cada elemento fere do seu jeito, no golpe que acerta um alvo com o estado dele:
//   raio: o eletrizado descarrega em cadeia; gelo: o golpe de outro elemento no congelado estilhaça em volta; terra:
//   o enraizado é esmagado (e atordoa se já estava lento); trevas: o golpe no marcado cura quem marcou; psíquico: o
//   golpe no exposto ecoa meio segundo depois; Físico: o crítico sem elemento abre um sangramento; fogo: quem morre
//   queimando passa a queimadura aos vizinhos;
// - a natureza da criatura reage ao estado que a pega (combat/naturezas.ts).
// Números em `balance.elementosFerem`. Puro.

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { msDe, ticksDe } from '../core/tempo';
import { buscarEntidade } from '../core/estado';
import { vivo, type Entidade } from '../entities/entidade';
import { podeFerir } from '../modos/relacao';
import { aplicarEfeito } from './efeitos';
import { escalarEstado } from './estado-do-golpe';
import { chebyshev } from './geometria';
import type { Habilidade } from './habilidades';
import { naturezaDe } from './naturezas';
import { construirEfeito, type TipoEfeito } from './registro-efeitos';

type Origem = Parameters<typeof aplicarEfeito>[4];

/** O efeito de elemento ainda espera no alvo? Marca a espera quando livre. */
function livre(estado: EstadoJogo, alvo: Entidade, chave: string, ms: number): boolean {
  const ate = alvo.reacoesAte?.[chave] ?? 0;
  if (ate > estado.tick) return false;
  (alvo.reacoesAte ??= {})[chave] = estado.tick + ticksDe(ms);
  return true;
}

const ativo = (e: Entidade, tipo: TipoEfeito, tick: number) => e.efeitos.some((f) => f.tipo === tipo && f.ateTick > tick);

function hostisEmVolta(estado: EstadoJogo, ctx: ContextoSimulacao, quem: Entidade | null, centro: Entidade, raio: number, max: number): Entidade[] {
  if (!quem) return [];
  const perto = estado.entidades
    .filter((o) => o !== centro && vivo(o) && chebyshev(o, centro) <= raio && podeFerir(quem, o, ctx.modo))
    .sort((a, b) => chebyshev(a, centro) - chebyshev(b, centro) || (a.id < b.id ? -1 : 1));
  return max > 0 ? perto.slice(0, max) : perto;
}

export interface GolpeElemental {
  alvo: Entidade;
  conjurador: Entidade | null;
  hab: Habilidade;
  /** O golpe antes da resistência do alvo (o que o estado guarda); entre personagens, já reduzido. */
  golpe: number;
  /** O dano que chegou de fato. */
  dano: number;
  /** Entre dois personagens: sem o atordoar do esmagar (o duelo não trava). */
  entrePersonagens: boolean;
  critico: boolean;
  estadosAntes: readonly TipoEfeito[];
  /** Quem tinha marcado o alvo (o marcado sai no golpe; o dreno vai para ele). */
  marcadorId: string | null;
  origem: Origem;
}

/** Depois do golpe que acertou: o que cada elemento faz com o estado que já estava no alvo. */
export function ferirPeloElemento(estado: EstadoJogo, ctx: ContextoSimulacao, g: GolpeElemental, saida: EventoSimulacao[]): void {
  const r = ctx.balance.elementosFerem;
  const tick = estado.tick;
  const { alvo, conjurador, origem } = g;
  const tinha = (t: TipoEfeito) => g.estadosAntes.includes(t);
  const direto = (quem: Entidade, valor: number) => {
    if (valor >= 1) aplicarEfeito(estado, ctx, quem, construirEfeito('dano_direto', { valor: Math.round(valor) }), origem, null, saida);
  };
  if (g.dano > 0 && g.golpe > 0) {
    // Raio: a descarga salta do eletrizado para os vizinhos.
    if (tinha('eletrizado') && livre(estado, alvo, 'el:descarga', r.intervaloMs)) {
      alvo.efeitos = alvo.efeitos.filter((f) => f.tipo !== 'eletrizado');
      for (const o of hostisEmVolta(estado, ctx, conjurador, alvo, r.descarga.raio, r.descarga.alvos)) direto(o, (g.golpe * r.descarga.pct) / 100);
    }
    // Gelo: o congelado estilhaça com o golpe de outro elemento (o Físico já estilhaça pela reação).
    if (tinha('congelado') && g.hab.elemento !== null && g.hab.elemento !== 'gelo' && livre(estado, alvo, 'el:estilhaco', r.intervaloMs)) {
      alvo.efeitos = alvo.efeitos.filter((f) => f.tipo !== 'congelado');
      for (const o of [alvo, ...hostisEmVolta(estado, ctx, conjurador, alvo, r.estilhaco.raio, 0)]) direto(o, (g.golpe * r.estilhaco.pct) / 100);
    }
    // Terra: o preso é esmagado; o que já estava lento, atordoado.
    if (tinha('enraizado') && livre(estado, alvo, 'el:esmagar', r.intervaloMs)) {
      direto(alvo, (g.golpe * r.esmagar.pct) / 100);
      if (!g.entrePersonagens && ['resfriado', 'arrastado', 'atolado'].some((t) => ativo(alvo, t as TipoEfeito, tick))) {
        aplicarEfeito(estado, ctx, alvo, construirEfeito('atordoar', { duracaoMs: r.esmagar.atordoaMs }), origem, null, saida);
      }
    }
    // Trevas: o golpe no marcado cura quem marcou.
    const marcador = g.marcadorId ? buscarEntidade(estado, g.marcadorId) : undefined;
    if (tinha('marcado') && marcador && vivo(marcador)) {
      const cura = Math.round((Math.min(g.dano, g.golpe) * r.drenoDoMarcadoPct) / 100);
      if (cura >= 1) aplicarEfeito(estado, ctx, marcador, construirEfeito('cura', { valor: cura }), { id: marcador.id, x: alvo.x, y: alvo.y }, null, saida);
    }
    // Psíquico: o golpe no exposto ecoa meio segundo depois.
    if (tinha('exposto') && livre(estado, alvo, 'el:eco', r.intervaloMs)) {
      const valor = Math.round((Math.min(g.dano, g.golpe) * r.ecoDoExpostoPct) / 100);
      if (valor >= 1) aplicarEfeito(estado, ctx, alvo, construirEfeito('efeito_atrasado', { duracaoMs: 500, interno: construirEfeito('dano_direto', { valor }) }), origem, null, saida);
    }
    // Físico: o crítico sem elemento abre um sangramento.
    // Sem piso fixo: o sangramento é todo do golpe (entre jogadores, pouco).
    const sangra = g.critico && g.hab.elemento === null && g.hab.tipoAtaque === 'fisico'
      ? escalarEstado(ctx, construirEfeito('sangrando', { duracaoMs: r.sangramentoNoCritico.duracaoMs, valor: 0 }), g.golpe) : null;
    if (sangra && sangra.valor >= 1) aplicarEfeito(estado, ctx, alvo, sangra, origem, null, saida);
  }
  reagirPelaNatureza(estado, ctx, g, saida);
}

/** A natureza da criatura reage ao estado novo que a pegou (a besta foge do fogo, o voador cai com o vento…). */
function reagirPelaNatureza(estado: EstadoJogo, ctx: ContextoSimulacao, g: GolpeElemental, saida: EventoSimulacao[]): void {
  const natureza = naturezaDe(ctx, g.alvo);
  if (!natureza) return;
  for (const reacao of natureza.reacoes) {
    if (g.estadosAntes.includes(reacao.estado) || !ativo(g.alvo, reacao.estado, estado.tick)) continue;
    if (!livre(estado, g.alvo, `nat:${reacao.estado}:${reacao.aplica.tipo}`, reacao.intervaloMs)) continue;
    const a = reacao.aplica;
    const valor = reacao.pctDoGolpe > 0 ? Math.max(1, Math.round((g.golpe * reacao.pctDoGolpe) / 100)) : a.valor;
    aplicarEfeito(estado, ctx, g.alvo, construirEfeito(a.tipo, { duracaoMs: a.duracaoMs, pct: a.pct, valor }), g.origem, null, saida);
  }
}

/** Fogo: quem morre queimando passa a queimadura aos vizinhos de quem o queimou. */
export function espalharAoMorrer(estado: EstadoJogo, ctx: ContextoSimulacao, morto: Entidade, saida: EventoSimulacao[]): void {
  const tick = estado.tick;
  const f = morto.efeitos.find((x) => x.tipo === 'queimando' && x.ateTick > tick);
  if (!f) return;
  const quem = buscarEntidade(estado, f.origemId) ?? null;
  const r = ctx.balance.elementosFerem.espalharQueimando;
  const duracaoMs = Math.max(1000, Math.round((Math.max(msDe(f.ateTick - tick), 1000) * r.duracaoPct) / 100));
  for (const o of hostisEmVolta(estado, ctx, quem, morto, r.raio, 0)) {
    aplicarEfeito(estado, ctx, o, construirEfeito('queimando', { duracaoMs, valor: f.valor }), { id: f.origemId, x: morto.x, y: morto.y }, null, saida);
  }
}

/** A natureza deixa a criatura se reerguer? (o morto-vivo consagrado cai de vez) */
export function naturezaImpedeRemontar(ctx: Pick<ContextoSimulacao, 'conteudo'>, e: Entidade, tick: number): boolean {
  const n = naturezaDe(ctx, e);
  return !!n && n.semRemontarCom.some((t) => ativo(e, t, tick));
}
