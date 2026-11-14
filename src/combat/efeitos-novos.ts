// Instantâneos do marco 24 (24/10/2026, D-094/D-095): ficar invisível, dissipar defesas, consumir um estado de uma vez,
// detonar uma invocação, arremessar (Telecinese), zerar uma recarga, libertar de lentidão e prisão, encher a fúria e o
// medidor da ultimate. Chamados pelo dispatcher único (efeitos.ts), nunca direto.

import type { ContextoSimulacao } from '../core/contexto';
import { buscarEntidade, type EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import { vivo, type Entidade } from '../entities/entidade';
import { podeAjudar, podeFerir } from '../modos/relacao';
import { passivosDe } from '../progression/ganchos-do-portador';
import { somarCarga } from './carga-ultimate';
import { encherFuria } from './frenesi';
import { anotarDeslocamento, aplicarEfeito, imuneADano, sofrerDano, type OrigemDoEfeito } from './efeitos';
import { arremessar, avancar, teleportar } from './efeitos-instantaneos';
import { agendarFase } from './fases';
import { duracaoDoGrito, trocarPet } from './pets';
import { acumularFuria } from './furia';
import { chebyshev } from './geometria';
import { registrarParticipacao } from './participacao';
import { construirEfeito, REGISTRO_EFEITOS, type EfeitoCanonico, type Instantaneo } from './registro-efeitos';

function anunciar(saida: EventoSimulacao[], tick: number, alvo: Entidade, origemId: string, tipo: EfeitoCanonico['tipo'], dano: number): void {
  saida.push({ t: 'efeitoResultado', tick, alvoId: alvo.id, origemId, tipo, dano, cura: 0, mana: 0 });
}

/** Dano sem rolagem de quem originou (consumir, detonar), respeitando imunidade e contando participação. */
function ferir(estado: EstadoJogo, ctx: ContextoSimulacao, alvo: Entidade, valor: number, origemId: string, tipo: EfeitoCanonico['tipo'], saida: EventoSimulacao[]): void {
  if (valor <= 0 || imuneADano(alvo, estado.tick)) return;
  const dano = sofrerDano(alvo, valor, estado.tick);
  if (dano > 0) registrarParticipacao(alvo, origemId, estado.tick, ctx);
  anunciar(saida, estado.tick, alvo, origemId, tipo, dano);
}

export function aplicarInstantaneoNovo(
  estado: EstadoJogo,
  ctx: ContextoSimulacao,
  alvo: Entidade,
  ef: EfeitoCanonico,
  tipo: Instantaneo,
  origem: OrigemDoEfeito,
  saida: EventoSimulacao[],
): void {
  const tick = estado.tick;
  switch (tipo) {
    case 'devolver_absorvido': {
      // Marco 40 (13/11/2026, D-161): o Contragolpe devolve o que a casca absorveu.
      const dono = buscarEntidade(estado, origem.id);
      const guardado = dono?.efeitos.filter((f) => f.tipo === 'guardar_absorvido').reduce((s, f) => s + f.valor, 0) ?? 0;
      ferir(estado, ctx, alvo, Math.round((guardado * ef.pct) / 100), origem.id, ef.tipo, saida);
      break;
    }
    case 'retornar': {
      // D-161: volta à célula de onde o atrasado saiu (a Investida do Duelista volta ao ponto de partida).
      const { x, y } = alvo;
      if (teleportar(estado, ctx, alvo, { x: origem.x, y: origem.y })) anotarDeslocamento(saida, tick, alvo, x, y, origem, 'teleporte');
      break;
    }
    case 'saltar_ao_alvo': {
      // D-161: o Ceifador salta junto dos mortos até o alvo e golpeia (a etapa `ref`).
      const ok = (e: Entidade | undefined): e is Entidade => !!e && vivo(e) && podeFerir(alvo, e, ctx.modo) && chebyshev(e, alvo) <= ef.valor;
      const selecionado = alvo.alvoSelecionado ? buscarEntidade(estado, alvo.alvoSelecionado) : undefined;
      const presa = ok(selecionado) ? selecionado : estado.entidades.filter(ok).sort((a, b) => chebyshev(a, alvo) - chebyshev(b, alvo) || (a.id < b.id ? -1 : 1))[0];
      if (!presa) break;
      const { x, y } = alvo;
      if (avancar(estado, ctx, alvo, { x: presa.x, y: presa.y }, ef.valor)) anotarDeslocamento(saida, tick, alvo, x, y, origem, 'avanco');
      if (ef.ref) agendarFase(estado, alvo, ef.ref, { x: presa.x, y: presa.y }, 0);
      break;
    }
    case 'apavorar':
      // Marco 40 (13/11/2026, D-161): só os feridos (abaixo de `pct`% da vida) fogem.
      if (alvo.hp * 100 < alvo.hpMax * ef.pct) aplicarEfeito(estado, ctx, alvo, construirEfeito('aterrorizado', { duracaoMs: ef.duracaoMs }), origem, null, saida);
      break;
    case 'levantar': {
      // Marco 40 (13/11/2026, D-161): o aliado caído mais perto (com ficha, esperando renascer) volta onde caiu.
      const caido = estado.entidades
        .filter((e) => e.morto && e.bolsa && e.id !== alvo.id && chebyshev(e, alvo) <= ef.valor && podeAjudar(alvo, e, ctx.modo))
        .sort((a, b) => chebyshev(a, alvo) - chebyshev(b, alvo) || (a.id < b.id ? -1 : 1))[0];
      if (!caido) break;
      caido.morto = false;
      caido.reviverEmTick = 0;
      caido.hp = Math.max(1, Math.round((caido.hpMax * ef.pct) / 100));
      caido.efeitos = [];
      caido.participacao = [];
      saida.push({ t: 'reviveu', tick, id: caido.id });
      break;
    }
    case 'trocar_companheiro':
      // Marco 40 (13/11/2026, D-165): a skill fixa da tecla 1 do Aventureiro.
      trocarPet(estado, alvo, saida);
      break;
    case 'grito_de_fera':
      // D-165: o Rosnar (atordoa) e o Rugido (apavora): 0,5 s em quem tem nível igual ou maior, +0,1 s por nível a menos.
      if (ef.interno) aplicarEfeito(estado, ctx, alvo, { ...ef.interno, duracaoMs: duracaoDoGrito(ctx, buscarEntidade(estado, origem.id), alvo) }, origem, null, saida);
      break;
    case 'invisivel':
      alvo.invisivelAteTick = Math.max(alvo.invisivelAteTick, tick + ticksDe(ef.duracaoMs));
      break;
    case 'dissipar': {
      // Tira os escudos e até `valor` efeitos positivos (o espelho da Purificação).
      let n = ef.valor;
      alvo.efeitos = alvo.efeitos.filter((f) => {
        const d = REGISTRO_EFEITOS[f.tipo];
        if (f.ateTick <= tick || !d.positivo) return true;
        if (d.escudo) return false;
        if (n > 0) {
          n--;
          return false;
        }
        return true;
      });
      break;
    }
    case 'consumir': {
      // O estado (ref) sai e o dano que ainda faria vem de uma vez, com `pct` a mais.
      const f = alvo.efeitos.find((x) => x.tipo === ef.ref && x.ateTick > tick);
      if (!f) break;
      alvo.efeitos = alvo.efeitos.filter((x) => x !== f);
      const pulsos = Math.max(1, Math.ceil((f.ateTick - tick) / Math.max(1, ticksDe(ctx.balance.efeitos.intervaloPeriodicoMs))));
      ferir(estado, ctx, alvo, Math.round(f.valor * pulsos * (1 + ef.pct / 100)), origem.id, ef.tipo, saida);
      break;
    }
    case 'detonar': {
      // A invocação de quem lança mais perto do alvo explode: `pct` da vida dela em dano a até `valor` células.
      const dono = buscarEntidade(estado, origem.id);
      if (!dono) break;
      const morto = estado.entidades
        .filter((e) => vivo(e) && e.invocacao?.donoId === dono.id && !e.invocacao.companheiro && chebyshev(e, alvo) <= 6)
        .sort((a, b) => chebyshev(a, alvo) - chebyshev(b, alvo) || (a.id < b.id ? -1 : 1))[0];
      if (!morto) break;
      const dano = Math.round((morto.hp * ef.pct) / 100);
      for (const e of estado.entidades) {
        if (e === morto || !vivo(e) || chebyshev(e, morto) > ef.valor || !podeFerir(dono, e, ctx.modo)) continue;
        ferir(estado, ctx, e, dano, dono.id, ef.tipo, saida);
      }
      morto.hp = 0;
      break;
    }
    case 'arremessar': {
      const { x, y } = alvo;
      const bateu = !passivosDe(ctx, alvo).inamovivel && arremessar(estado, ctx, alvo, origem, ef.valor);
      anotarDeslocamento(saida, tick, alvo, x, y, origem, 'arremesso');
      if (bateu) {
        aplicarEfeito(estado, ctx, alvo, ef.interno ?? construirEfeito('atordoar', { duracaoMs: 500 }), origem, null, saida);
      }
      break;
    }
    case 'zerar_recarga':
      // A mesma chave de acao.ts (`chaveRecarga`).
      if (ef.ref) estado.recargas[`${alvo.id}_${ef.ref}`] = estado.tick;
      break;
    case 'libertar':
      alvo.efeitos = alvo.efeitos.filter((f) => {
        const d = REGISTRO_EFEITOS[f.tipo];
        return d.positivo || !(d.lentidao || d.ia === 'foge' || (d.bloqueiaMovimento && d.bloqueiaAcoes === 'nenhuma'));
      });
      break;
    case 'furia':
      if (acumularFuria(ctx, alvo, tick, ef.valor)) encherFuria(estado, ctx, alvo, origem, saida);
      break;
    case 'executar':
      // Abaixo de `pct` da vida, o alvo cai (sem imunidade).
      if (!imuneADano(alvo, tick) && alvo.hp * 100 <= alvo.hpMax * ef.pct) ferir(estado, ctx, alvo, alvo.hp, origem.id, ef.tipo, saida);
      break;
    case 'carga_ultimate':
      somarCarga(ctx, alvo, ef.valor, tick, saida);
      break;
    default:
      break;
  }
}
