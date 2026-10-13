// Marcadores provisórios das entidades: círculo + seta de direção (os modelos de criatura e a
// caminhada por fatias entram nos marcos 12 e 13). Cor por equipe em relação ao jogador local.

import { Container, Graphics } from 'pixi.js';
import type { EstadoJogo } from '../core/estado';
import type { Entidade } from '../entities/entidade';
import { CELULA_PX } from './camera-calculo';
import type { Interpolador } from './interpolacao';

const COR_PROPRIO = 0x3498db;
const COR_ALIADO = 0x27ae60;
const COR_OUTRO = 0xe74c3c;
const RAIO = CELULA_PX * 0.32;
const PULSO_MS = 160;

interface Marcador {
  raiz: Container;
  seta: Graphics;
  /** Ângulo da última direção de movimento, para a seta continuar apontando parada. */
  angulo: number;
  ultimoX: number;
  ultimoY: number;
  pulsoAteMs: number;
}

export class CamadaEntidades {
  private readonly marcadores = new Map<string, Marcador>();

  constructor(
    private readonly camada: Container,
    private readonly idLocal: string,
  ) {}

  private criar(e: Entidade, equipeLocal: string): Marcador {
    const raiz = new Container({ label: e.id });
    const cor = e.id === this.idLocal ? COR_PROPRIO : e.equipe === equipeLocal ? COR_ALIADO : COR_OUTRO;
    const sombra = new Graphics().ellipse(0, RAIO * 0.9, RAIO * 0.9, RAIO * 0.35).fill({ color: 0x000000, alpha: 0.35 });
    const corpo = new Graphics().circle(0, 0, RAIO).fill(cor).stroke({ width: 2, color: 0x0d0b12 });
    const seta = new Graphics()
      .poly([RAIO * 0.35, -RAIO * 0.45, RAIO * 1.05, 0, RAIO * 0.35, RAIO * 0.45])
      .fill(0xece8f4);
    raiz.addChild(sombra, corpo, seta);
    this.camada.addChild(raiz);
    return { raiz, seta, angulo: 0, ultimoX: e.x, ultimoY: e.y, pulsoAteMs: 0 };
  }

  /** Feedback do botão de ataque enquanto o combate não existe (marco 3). */
  pulsar(id: string, agoraMs: number): void {
    const m = this.marcadores.get(id);
    if (m) m.pulsoAteMs = agoraMs + PULSO_MS;
  }

  desenhar(estado: EstadoJogo, interp: Interpolador, alpha: number, agoraMs: number): void {
    const local = estado.entidades.find((e) => e.id === this.idLocal);
    const equipeLocal = local?.equipe ?? '';
    const vistos = new Set<string>();

    for (const e of estado.entidades) {
      vistos.add(e.id);
      let m = this.marcadores.get(e.id);
      if (!m) {
        m = this.criar(e, equipeLocal);
        this.marcadores.set(e.id, m);
      }
      const dx = e.destinoX - e.x || e.x - m.ultimoX;
      const dy = e.destinoY - e.y || e.y - m.ultimoY;
      if (dx !== 0 || dy !== 0) m.angulo = Math.atan2(dy, dx);
      m.ultimoX = e.x;
      m.ultimoY = e.y;

      const p = interp.posicao(e, alpha);
      m.raiz.position.set((p.x + 0.5) * CELULA_PX, (p.y + 0.5) * CELULA_PX);
      m.seta.rotation = m.angulo;
      const pulso = Math.max(0, m.pulsoAteMs - agoraMs) / PULSO_MS;
      m.raiz.scale.set(1 + pulso * 0.25);
      m.raiz.alpha = e.hp > 0 ? 1 : 0.4;
    }

    for (const [id, m] of this.marcadores) {
      if (vistos.has(id)) continue;
      m.raiz.destroy({ children: true });
      this.marcadores.delete(id);
      interp.esquecer(id);
    }
    // Ordenação por Y, para quem está mais abaixo ficar na frente.
    this.camada.children.sort((a, b) => a.position.y - b.position.y);
  }

  destruir(): void {
    for (const m of this.marcadores.values()) m.raiz.destroy({ children: true });
    this.marcadores.clear();
  }
}
