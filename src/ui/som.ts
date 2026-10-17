// Ligação do som com o jogo (§2.14). Marco 12 (14/10/2026). Eventos da simulação viram efeitos sonoros
// (com volume pela distância e pan pela posição em relação ao jogador); passos saem do `moveu`; a música
// segue o clima (exploração, combate, chefe); as fontes sonoras da fase tocam em laço pelo alcance.

import type { BuscaHabilidade } from '../combat/habilidades';
import type { EstadoJogo } from '../core/estado';
import type { Barramento } from '../core/events';
import type { EventosDaSimulacao } from '../core/eventos-simulacao';
import { climaDoEstado, ContextoMusical, profundidadeDaFase, sombraDaCena, SombraMusical } from '../audio/contexto-musical';
import { distancia, panPorPosicao, volumePorDistancia } from '../audio/espacial';
import { sonsDoEvento } from '../audio/mapeamento';
import type { MotorAudio } from '../audio/motor';
import type { PontoVisual } from '../entities/entidade';
import type { Fase } from '../world/fase';

export interface OpcoesSom {
  motor: MotorAudio;
  bus: Barramento<EventosDaSimulacao>;
  estado: () => EstadoJogo;
  idLocal: string;
  habilidades: BuscaHabilidade;
  fase: Fase;
}

export function ligarSom(o: OpcoesSom): { quadro: (ouvinte: PontoVisual | null, agoraMs: number) => void } {
  const { motor, idLocal } = o;
  let ouvinte: PontoVisual | null = null;
  const contexto = new ContextoMusical();
  const sombraMusical = new SombraMusical();
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
    for (const p of sonsDoEvento(ev, idLocal, o.habilidades)) tocarEm(p.som, p.origemId);
  };
  for (const t of [
    'acaoIniciada',
    'projetilLancado',
    'impacto',
    'esquivou',
    'morreu',
    'coletou',
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
      // Marco 11A (D-066): a sombra (casual ↔ dark) pela profundidade, a dificuldade e o clima, deslizando.
      const sombra = sombraMusical.atualizar(sombraDaCena(clima, profundidade, o.estado().dificuldade), agoraMs);
      motor.definirMusica(o.fase.id, clima, sombra);
      for (const f of fontes) {
        motor.definirFonte(f.id, f.som);
        const d = pos ? distancia(f.obj.x, f.obj.y, pos.x, pos.y) : Infinity;
        const volume = f.obj.valor * Math.max(0, 1 - d / Math.max(1, f.obj.raio));
        motor.atualizarFonte(f.id, volume, pos ? panPorPosicao(f.obj.x, pos.x) : 0);
      }
    },
  };
}
