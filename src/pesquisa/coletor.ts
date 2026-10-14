// Coletor de medidas do teste com pessoas (§5.7). Marco 7A (13/10/2026). Puro: recebe os eventos
// que a simulação já publica e o relógio da sessão, sem tocar no estado nem na simulação.

import type { EventoSimulacao } from '../core/eventos-simulacao';
import type { MedidasDaSessao } from './relatorio';

export type ClasseDeAlvo = 'boss' | 'boneco' | 'comum';

export interface Coletor {
  registrar: (ev: EventoSimulacao, agoraS: number) => void;
  medidas: (agoraS: number, nivelFinal: number) => MedidasDaSessao;
}

/**
 * `classificar` diz o que é cada entidade (pelo id, antes de ela sair do mundo). O boneco de treino
 * não conta como luta nem como abate: ele não ataca e serve só para aprender os comandos.
 */
export function criarColetor(idJogador: string, inicioS: number, classificar: (id: string) => ClasseDeAlvo): Coletor {
  let primeiraLuta: number | null = null;
  let equipouEm: number | null = null;
  let melhorouEm: number | null = null;
  let mortes = 0;
  let abates = 0;
  let ataquesBasicos = 0;
  let itensColetados = 0;
  let voltouALutar = false;
  let viuBoss = false;
  let bossDerrotado = false;
  const habilidades: Record<string, number> = {};
  const relativo = (agoraS: number) => Math.round((agoraS - inicioS) * 10) / 10;

  return {
    registrar: (ev, agoraS) => {
      switch (ev.t) {
        case 'acaoIniciada':
          if (ev.atorId !== idJogador) {
            if (classificar(ev.atorId) === 'boss') viuBoss = true;
            break;
          }
          if (ev.habilidadeId === 'ataque_basico') ataquesBasicos++;
          else habilidades[ev.habilidadeId] = (habilidades[ev.habilidadeId] ?? 0) + 1;
          break;
        case 'impacto': {
          const outro = ev.fonteId === idJogador ? ev.alvoId : ev.alvoId === idJogador ? ev.fonteId : null;
          if (outro === null || outro === idJogador || classificar(outro) === 'boneco') break;
          primeiraLuta ??= relativo(agoraS);
          if (melhorouEm !== null && agoraS > melhorouEm) voltouALutar = true;
          if (classificar(outro) === 'boss') viuBoss = true;
          break;
        }
        case 'iaNotou':
          if (ev.alvoId === idJogador && classificar(ev.id) === 'boss') viuBoss = true;
          break;
        case 'morreu':
          if (ev.id === idJogador) mortes++;
          else if (ev.porId === idJogador && classificar(ev.id) !== 'boneco') {
            abates++;
            if (classificar(ev.id) === 'boss') bossDerrotado = true;
          }
          break;
        case 'coletou':
          if (ev.id === idJogador && ev.tipo === 'item') itensColetados++;
          break;
        case 'equipou':
          if (ev.id !== idJogador) break;
          equipouEm ??= relativo(agoraS);
          melhorouEm ??= agoraS;
          break;
        case 'subiuNivel':
          if (ev.id === idJogador) melhorouEm ??= agoraS;
          break;
        default:
          break;
      }
    },
    medidas: (agoraS, nivelFinal) => ({
      duracaoS: relativo(agoraS),
      tempoAtePrimeiraLutaS: primeiraLuta,
      mortes,
      abates,
      ataquesBasicos,
      habilidades: { ...habilidades },
      itensColetados,
      equipouEmS: equipouEm,
      nivelFinal,
      // Sem evento próprio: quem chama informa com `comPontosDistribuidos`.
      distribuiuPontos: false,
      voltouALutarDepoisDeMelhorar: voltouALutar,
      viuBoss,
      bossDerrotado,
    }),
  };
}

/** Distribuir pontos não gera evento próprio: quem chama informa ao fim da sessão. */
export function comPontosDistribuidos(m: MedidasDaSessao, distribuiu: boolean): MedidasDaSessao {
  return { ...m, distribuiuPontos: distribuiu };
}
