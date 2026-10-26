// Portas no chão (§2.1, §2.16). Marco 10A-1 (14/10/2026). Só lê a fase e o estado:
// - porta de saída com cadeado enquanto trancada e brilho quando abre;
// - portas internas como anéis violeta com o número do par;
// - porta temporária do boss, dourada, pulsando durante a janela de 30 s.
// Marco 26 (25/10/2026, D-109): no isométrico, a porta (moldura, cadeado) e o número do par ficam em pé na camada
// das entidades, com profundidade; os anéis de espera seguem no chão.

import { Graphics, Text, type Container } from 'pixi.js';
import type { EstadoJogo } from '../core/estado';
import type { Fase } from '../world/fase';
import { CELULA_PX } from './camera-calculo';
import type { OpcoesEmPe } from './objetos';
import { centroDaCelula } from './projecao';

const P = CELULA_PX;

interface Numero {
  texto: Text;
  x: number;
  y: number;
}

export class CamadaPortas {
  private readonly g = new Graphics();
  private readonly numeros: Numero[] = [];
  /** As portas em pé (só no isométrico), uma por célula. */
  private readonly altas = new Map<string, Graphics>();

  constructor(
    private readonly camada: Container,
    private readonly fase: Fase,
    private readonly ticksJanela: number,
    private readonly emPe: OpcoesEmPe | null = null,
  ) {
    camada.addChild(this.g);
    for (const porta of fase.portasInternas) {
      for (const c of [porta.a, porta.b]) {
        const n = new Text({ text: String(porta.numero), style: { fill: 0xe8daef, fontSize: 14, fontWeight: '700', stroke: { color: 0x1a0f22, width: 3 } } });
        n.anchor.set(0.5);
        camada.addChild(n);
        this.numeros.push({ texto: n, x: c.x, y: c.y });
      }
    }
  }

  private porta(g: Graphics, cx: number, cy: number, cor: number, trancada: boolean, brilho: number): void {
    if (brilho > 0) g.circle(cx, cy, 22 + brilho * 4).fill({ color: cor, alpha: 0.25 });
    g.roundRect(cx - 12, cy - 18, 24, 34, 10).fill(0x3b2410).stroke({ width: 3, color: cor });
    g.rect(cx - 8, cy - 12, 16, 26).fill(trancada ? 0x5d4037 : 0x111111);
    if (trancada) {
      g.roundRect(cx - 6, cy - 2, 12, 10, 2).fill(0x2c3e50).stroke({ width: 1.5, color: 0xd4ac0d });
      g.circle(cx, cy + 3, 1.8).fill(0xd4ac0d);
    }
  }

  /** Uma porta: no chão (de cima) ou em pé sobre a célula (isométrico). */
  private desenharPorta(x: number, y: number, vistas: Set<string>, desenho: (g: Graphics, cx: number, cy: number) => void): void {
    const proj = this.emPe?.projecao();
    if (!this.emPe || proj?.visao !== 'iso') {
      desenho(this.g, (x + 0.5) * P, (y + 0.5) * P);
      return;
    }
    const chave = `${x},${y}`;
    vistas.add(chave);
    let alta = this.altas.get(chave);
    if (!alta) {
      alta = new Graphics();
      this.emPe.camada.addChild(alta);
      this.altas.set(chave, alta);
    }
    const c = centroDaCelula(x, y);
    const p = proj.projetar(c.x, c.y);
    alta.position.set(p.x, p.y);
    alta.zIndex = p.y;
    // A sombra no chão e a porta acima dela (a base da moldura no centro da célula).
    alta.clear().ellipse(0, 0, 16, 6).fill({ color: 0x000000, alpha: 0.3 });
    desenho(alta, 0, -16);
  }

  desenhar(estado: EstadoJogo, agoraMs: number, movimentoReduzido: boolean): void {
    const g = this.g.clear();
    const pulso = movimentoReduzido ? 1 : (Math.sin(agoraMs / 220) + 1) / 2;
    const vistas = new Set<string>();
    for (const porta of this.fase.portasInternas) {
      for (const c of [porta.a, porta.b]) {
        const cx = (c.x + 0.5) * P;
        const cy = (c.y + 0.5) * P;
        g.circle(cx, cy, 17).fill({ color: 0x8e44ad, alpha: 0.25 }).stroke({ width: 3, color: 0xbb8fce, alpha: 0.6 + 0.4 * pulso });
      }
    }
    this.posicionarNumeros();
    const volta = this.fase.portaRetorno;
    if (volta) {
      this.desenharPorta(volta.x, volta.y, vistas, (alvo, cx, cy) => {
        this.porta(alvo, cx, cy, 0x65d7ee, false, pulso * 0.5);
        alvo.moveTo(cx + 5, cy - 5).lineTo(cx - 4, cy).lineTo(cx + 5, cy + 5).stroke({ width: 3, color: 0xc8f6ff });
      });
    }
    const s = this.fase.portaSaida;
    if (s) {
      const trancada = s.tranca !== 'livre' && !estado.saidaAberta;
      this.desenharPorta(s.x, s.y, vistas, (alvo, cx, cy) => {
        this.porta(alvo, cx, cy, trancada ? 0x95a5a6 : 0x2ecc71, trancada, trancada ? 0 : pulso);
      });
    }
    for (const o of estado.objetos) {
      if (o.tipo !== 'saida') continue;
      const naJanela = estado.tick < o.abertoTick + this.ticksJanela;
      this.desenharPorta(o.x, o.y, vistas, (alvo, cx, cy) => {
        this.porta(alvo, cx, cy, 0xf1c40f, false, naJanela ? pulso : 0);
      });
    }
    for (const [chave, alta] of this.altas) {
      if (vistas.has(chave)) continue;
      alta.destroy();
      this.altas.delete(chave);
    }
  }

  /** O número do par: no chão de cima; no isométrico, de pé acima do anel (sem achatar com o piso). */
  private posicionarNumeros(): void {
    const emPe = this.emPe;
    const proj = emPe?.projecao() ?? null;
    const camada = emPe && proj?.visao === 'iso' ? emPe.camada : this.camada;
    const iso = camada !== this.camada;
    for (const n of this.numeros) {
      if (n.texto.parent !== camada) camada.addChild(n.texto);
      const c = centroDaCelula(n.x, n.y);
      const p = iso && proj ? proj.projetar(c.x, c.y) : c;
      n.texto.position.set(p.x, p.y - (iso ? 14 : 0));
      n.texto.zIndex = p.y;
    }
  }

  destruir(): void {
    this.g.destroy();
    for (const n of this.numeros) n.texto.destroy();
    for (const alta of this.altas.values()) alta.destroy();
    this.altas.clear();
  }
}
