// Instantâneos do marco 24 (24/10/2026, D-094/D-095): ficar invisível, dissipar defesas, consumir um estado de uma vez,
// detonar uma invocação, arremessar (Telecinese), zerar uma recarga, libertar de lentidão e prisão, encher a fúria e o
// medidor da ultimate. Chamados pelo dispatcher único (efeitos.ts), nunca direto.

import type { ContextoSimulacao } from '../core/contexto';
import { buscarEntidade, type EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import { vivo, type Entidade } from '../entities/entidade';
import { podeFerir } from '../modos/relacao';
import { passivosDe } from '../progression/ganchos-do-portador';
import { somarCarga } from './carga-ultimate';
import { aplicarEfeito, imuneADano, sofrerDano, type OrigemDoEfeito } from './efeitos';
import { arremessar } from './efeitos-instantaneos';
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
    case 'arremessar':
      if (!passivosDe(ctx, alvo).inamovivel && arremessar(estado, ctx, alvo, origem, ef.valor)) {
        aplicarEfeito(estado, ctx, alvo, ef.interno ?? construirEfeito('atordoar', { duracaoMs: 500 }), origem, null, saida);
      }
      break;
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
      acumularFuria(ctx, alvo, tick, ef.valor);
      break;
    case 'carga_ultimate':
      somarCarga(ctx, alvo, ef.valor, tick, saida);
      break;
    default:
      break;
  }
}
