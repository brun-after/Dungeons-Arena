// Marco 19 (17/10/2026): memória limitada de ações confirmadas; só dados, clonável e autoritativa.
import type { EfeitoCanonico } from './registro-efeitos';

export interface EtapaTatica {
  id: string;
  acaoId: number;
  tick: number;
  x: number;
  y: number;
  miraX: number;
  miraY: number;
  alvos: string[];
  fatos: string[];
  preparado: string | null;
  concluidos: string[];
}
export interface MemoriaTatica {
  etapas: EtapaTatica[];
  aparou: { tick: number; atacante: string } | null;
  esquivou: number;
  fluxoAte: number;
  respostaConsumida?: boolean;
}
export interface CampoTatico {
  id: number;
  pantano?: boolean;
  tipo: 'muralha' | 'cura' | 'veneno';
  donoId: string;
  equipe: string;
  x: number;
  y: number;
  raio: number;
  ateTick: number;
  proximoPulso: number;
  intervaloTicks: number;
  efeito: EfeitoCanonico | null;
}
export function novaMemoria(): MemoriaTatica {
  return { etapas: [], aparou: null, esquivou: -99999, fluxoAte: 0 };
}
