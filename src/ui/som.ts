// Ligação do som com o jogo (§2.14). Marco 12 (14/10/2026). Eventos da simulação viram efeitos sonoros
// (com volume pela distância e pan pela posição em relação ao jogador); passos saem do `moveu`; a música
// segue o clima (exploração, combate, chefe); as fontes sonoras da fase tocam em laço pelo alcance.

import type { BuscaHabilidade } from '../combat/habilidades';
import type { ContextoSimulacao } from '../core/contexto';
import type { Entidade } from '../entities/entidade';
import { armaNaMao } from '../render/golpe-visual';
import { timbreDoGolpe, type AtacanteSonoro } from '../audio/timbres';
import type { EstadoJogo } from '../core/estado';
import type { Barramento } from '../core/events';
import type { EventosDaSimulacao } from '../core/eventos-simulacao';
import { climaDoEstado, ContextoMusical, profundidadeDaFase, sombraDaCena, SombraMusical } from '../audio/contexto-musical';
import { distancia, panPorPosicao, volumePorDistancia } from '../audio/espacial';
import { sonsDoEvento, type TimbreDoGolpe } from '../audio/mapeamento';
import type { MotorAudio } from '../audio/motor';
import type { PontoVisual } from '../entities/entidade';
import type { Fase } from '../world/fase';
import { hashTexto } from '../core/rng';

/** Marco 24 (25/10/2026, D-099): a música da fase troca de variante a cada 3 a 4 min (o período sai da fase). */
const TROCA_MIN_MS = 180_000;
const TROCA_FAIXA_MS = 60_000;
const VARIANTES = 3;

/** A variante da música da fase no instante (0 nos primeiros minutos; depois gira entre as variantes). */
export function varianteDaMusica(faseId: string, agoraMs: number): number {
  const periodo = TROCA_MIN_MS + (hashTexto(faseId) % TROCA_FAIXA_MS);
  return Math.floor(Math.max(0, agoraMs) / periodo) % VARIANTES;
}

/**
 * 08/11/2026 (D-138): quem bate, no que importa ao som. Morto do Necromante: o marcado pela necromancia, o invocado por
 * quem tem a passiva dos servos (a do cajado) e o exército do Necromante do Mundo.
 */
export function atacanteSonoro(ctx: Pick<ContextoSimulacao, 'conteudo' | 'balance'>, e: Entidade, dono: Entidade | undefined): AtacanteSonoro {
  const classeId = e.bolsa?.classeId ?? e.classeId ?? '';
  const familiaDoDono = dono ? ctx.conteudo.armas.naturalDaClasse.get(dono.bolsa?.classeId ?? dono.classeId ?? '') : undefined;
  const servos = !!familiaDoDono && ctx.conteudo.armas.porFamilia[familiaDoDono].passiva === 'servos';
  return {
    preset: e.preset,
    modelo: ctx.conteudo.classes.get(classeId)?.modelo ?? ctx.conteudo.presets.get(e.preset)?.modelo ?? null,
    arma: e.invocacao ? null : armaNaMao(e, classeId),
    ataqueBasico: e.ataqueBasico,
    mortoDoNecromante: !!e.invocacao && (!!e.invocacao.necromancia || servos || ctx.balance.mundo.exercitoNecromante.presets.includes(e.preset)),
  };
}

/** O timbre do golpe de quem está no estado (o resolvedor que `ligarSom` recebe). */
export function timbrePeloEstado(ctx: Pick<ContextoSimulacao, 'conteudo' | 'balance'>, estado: () => EstadoJogo, basico: (id: string) => boolean): TimbreDoGolpe {
  return (fonteId, h) => {
    const entidades = estado().entidades;
    const e = entidades.find((x) => x.id === fonteId);
    if (!e) return null;
    const dono = e.invocacao ? entidades.find((x) => x.id === e.invocacao?.donoId) : undefined;
    return timbreDoGolpe(ctx.conteudo.armas, h, atacanteSonoro(ctx, e, dono), basico(h.id));
  };
}

export interface OpcoesSom {
  motor: MotorAudio;
  bus: Barramento<EventosDaSimulacao>;
  estado: () => EstadoJogo;
  idLocal: string;
  habilidades: BuscaHabilidade;
  /** 05/11/2026: se a habilidade é um ataque básico (o básico não toca o som longo do elemento). */
  basico?: (id: string) => boolean;
  /** 08/11/2026 (D-138): o timbre do golpe corpo a corpo pelo atacante (a arma ou a criatura). */
  timbre?: TimbreDoGolpe;
  fase: Fase;
}

export function ligarSom(o: OpcoesSom): { quadro: (ouvinte: PontoVisual | null, agoraMs: number) => void } {
  const { motor, idLocal } = o;
  let ouvinte: PontoVisual | null = null;
  const contexto = new ContextoMusical();
  const sombraMusical = new SombraMusical();
  // Marco 24 (D-099): a troca de variante conta da entrada na fase.
  const inicioMs = performance.now();
  const profundidade = profundidadeDaFase(o.fase);

  const tocarEm = (som: Parameters<MotorAudio['tocar']>[0], origemId: string | null) => {
    if (origemId === null || origemId === idLocal || !ouvinte) {
      motor.tocar(som, 1, 0);
      return;
    }
    const e = o.estado().entidades.find((x) => x.id === origemId);
    if (!e) return;
    motor.tocar(som, volumePorDistancia(distancia(e.x, e.y, ouvinte.x, ouvinte.y)), panPorPosicao(e.x, ouvinte.x));
  };

  // Um ouvinte genérico para todos os eventos: só traduz e toca.
  const aoEvento = (ev: Parameters<typeof sonsDoEvento>[0]) => {
    for (const p of sonsDoEvento(ev, idLocal, o.habilidades, o.basico, o.timbre)) tocarEm(p.som, p.origemId);
  };
  for (const t of [
    'acaoIniciada',
    'projetilLancado',
    'impacto',
    'esquivou',
    'morreu',
    'coletou',
    'quebrou',
    'comprou',
    'vendeu',
    'bauAberto',
    'subiuNivel',
    'itemRecusado',
    'acaoRecusada',
    'teleportou',
    'saidaAlcancada',
    'saidaDestrancada',
    'armadilhaDisparou',
    'invocou',
    'dominou',
    'explodiu',
    'invocacaoCurou',
  ] as const) {
    o.bus.on(t, aoEvento);
  }
  o.bus.on('moveu', (ev) => {
    if (!ouvinte) return;
    const d = distancia(ev.x, ev.y, ouvinte.x, ouvinte.y);
    motor.passo(ev.id, ev.id === idLocal ? 0.5 : volumePorDistancia(d) * 0.6, ev.id === idLocal ? 0 : panPorPosicao(ev.x, ouvinte.x));
  });

  const fontes = o.fase.objetos.flatMap((obj, i) => (obj.tipo === 'fonte_som' && obj.som ? [{ id: `f:${i}`, obj, som: obj.som }] : []));

  return {
    quadro: (pos, agoraMs) => {
      ouvinte = pos;
      const clima = contexto.atualizar(climaDoEstado(o.estado(), idLocal), agoraMs);
      // Marco 11A (D-066): a sombra (casual <-> dark) pela profundidade, a dificuldade e o clima, deslizando.
      const sombra = sombraMusical.atualizar(sombraDaCena(clima, profundidade, o.estado().dificuldade), agoraMs);
      motor.definirMusica(o.fase.id, clima, sombra, varianteDaMusica(o.fase.id, agoraMs - inicioMs));
      for (const f of fontes) {
        motor.definirFonte(f.id, f.som);
        const d = pos ? distancia(f.obj.x, f.obj.y, pos.x, pos.y) : Infinity;
        const volume = f.obj.valor * Math.max(0, 1 - d / Math.max(1, f.obj.raio));
        motor.atualizarFonte(f.id, volume, pos ? panPorPosicao(f.obj.x, pos.x) : 0);
      }
    },
  };
}
