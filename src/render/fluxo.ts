// Camada dos efeitos de fluxo próprio (§2.8, §2.11). Marco 8A-2 (14/10/2026). Só lê o estado:
// células de rastro na cor do efeito, armadilhas só do jogador local (invisíveis para os outros)
// e um anel de contagem sobre quem tem efeito atrasado a caminho.

import { Graphics, type Container } from 'pixi.js';
import { REGISTRO_EFEITOS } from '../combat/registro-efeitos';
import type { EstadoJogo } from '../core/estado';
import { CELULA_PX } from './camera-calculo';
import { anelDoDesarme, armadilhaExposta, circuloDeConjuracao, graficosDoChao, RunasDePe } from './armadilhas-visual';
import type { OpcoesEmPe } from './objetos';
import type { Habilidade } from '../combat/habilidades';
import { CirculosNoAr, circulosDoNecromante } from './circulos-necromante';

const cor = (hex: string) => Number.parseInt(hex.slice(1), 16);
/** Marco 24 (D-099): o anel da espera na porta de fase. */
const COR_PORTA = 0x9cf0b0;

export class CamadaFluxo {
  private readonly g = new Graphics();
  /** 06/11/2026 (D-135): os círculos de conjuração das armadilhas (o traço e o brilho aditivo) e as runas de pé. */
  private readonly armadilhas: { g: Graphics; brilho: Graphics };
  private readonly runas: RunasDePe;
  private readonly noAr: CirculosNoAr;
  private readonly disparos: { x: number; y: number; tick: number }[] = [];

  disparou(x: number, y: number, tick: number): void {
    if (this.disparos.length >= 24) this.disparos.shift();
    this.disparos.push({ x, y, tick });
  }

  /** Marco 11A (D-066): com partículas, os rastros são partícula (efeitos-habilidade.ts) e não quadrados. */
  constructor(
    camada: Container,
    private readonly comParticulas: () => boolean = () => false,
    /** Marco 18: duração do desarme em ticks (para o anel de progresso). */
    private readonly ticksDesarme: () => number = () => 90,
    /** Marco 24 (D-099): a espera na porta de fase, em ticks. */
    private readonly ticksPorta: () => number = () => 180,
    /** 06/11/2026 (D-135): onde a runa de pé do armadilheiro fica (a camada das entidades, no isométrico). */
    emPe: OpcoesEmPe | null = null,
    /** 07/11/2026 (D-136): a skill de uma chave (os círculos da Lanças da escuridão e do Dardo funesto). */
    private readonly habilidade: (chave: string) => Habilidade | undefined = () => undefined,
  ) {
    camada.addChild(this.g);
    this.armadilhas = graficosDoChao(camada);
    this.runas = new RunasDePe(emPe);
    this.noAr = new CirculosNoAr(emPe);
  }

  desenhar(estado: EstadoJogo, idLocal: string, reduzido = false): void {
    const g = this.g.clear();
    while (this.disparos[0] && estado.tick - this.disparos[0].tick > 54) this.disparos.shift();
    for (const d of this.disparos) {
      const idade = Math.max(0, estado.tick - d.tick) / 54;
      const cx = (d.x + 0.5) * CELULA_PX, cy = (d.y + 0.5) * CELULA_PX;
      const raio = CELULA_PX * (reduzido ? 0.56 : 0.32 + idade * 0.5);
      g.circle(cx, cy, raio).fill({ color: 0xff5c2c, alpha: (1 - idade) * 0.3 });
      g.circle(cx, cy, raio).stroke({ width: 4, color: 0xffc86b, alpha: 1 - idade });
      for (let i = 0; i < 6; i++) {
        const angulo = Math.PI * i / 3;
        const x = cx + Math.cos(angulo) * 12, y = cy + Math.sin(angulo) * 12;
        g.poly([x - 4, y + 5, x, y - 10, x + 4, y + 5]).fill({ color: 0xffe4b8, alpha: 1 - idade });
      }
    }
    for (const r of this.comParticulas() ? [] : estado.rastros) {
      g.rect(r.x * CELULA_PX + 4, r.y * CELULA_PX + 4, CELULA_PX - 8, CELULA_PX - 8).fill({ color: cor(REGISTRO_EFEITOS[r.tipo].cor), alpha: 0.28 });
    }
    // 06/11/2026 (D-135): a armadilha exposta (sua, da equipe, revelada pela Sabedoria ou a runa de pé) é um círculo
    // de conjuração no chão, na cor do elemento (ou de brasa, a de explosão). O desarme em curso mostra o progresso.
    const p = CELULA_PX;
    const local = estado.entidades.find((e) => e.id === idLocal);
    const tMs = reduzido ? 0 : performance.now();
    const traco = this.armadilhas.g.clear();
    const brilho = this.armadilhas.brilho.clear();
    for (const a of estado.armadilhas) {
      const exposta = armadilhaExposta(a, idLocal, local);
      if (!exposta) continue;
      circuloDeConjuracao(traco, brilho, a, tMs, exposta === 'propria', a.inerteAteTick > estado.tick);
      const i = local?.interacao;
      if (exposta === 'hostil' && i?.tipo === 'desarme' && i.objetoId === String(a.id)) {
        anelDoDesarme(traco, a, Math.max(0, Math.min(1, 1 - (i.ateTick - estado.tick) / Math.max(1, this.ticksDesarme()))));
      }
    }
    this.runas.desenhar(estado, tMs);
    circulosDoNecromante(traco, brilho, estado, this.habilidade, tMs);
    this.noAr.desenhar(estado, this.habilidade, tMs);
    // Marco 24 (25/10/2026, D-099): parado na porta de fase, o anel enche até sair.
    if (local?.naPortaDesdeTick !== undefined) {
      const fracao = Math.max(0, Math.min(1, (estado.tick - local.naPortaDesdeTick) / Math.max(1, this.ticksPorta())));
      const cx = (local.x + 0.5) * p;
      const cy = (local.y + 0.5) * p;
      const inicio = -Math.PI / 2;
      g.circle(cx, cy, p * 0.5).stroke({ width: 3, color: COR_PORTA, alpha: 0.3 });
      g.moveTo(cx + Math.cos(inicio) * p * 0.5, cy + Math.sin(inicio) * p * 0.5);
      g.arc(cx, cy, p * 0.5, inicio, inicio + Math.PI * 2 * fracao).stroke({ width: 5, color: COR_PORTA, alpha: 0.95 });
    }
    for (const a of estado.atrasados) {
      const alvo = estado.entidades.find((e) => e.id === a.alvoId);
      if (!alvo) continue;
      const fracao = Math.max(0, Math.min(1, (a.disparaTick - estado.tick) / 90));
      const cx = (alvo.x + 0.5) * p;
      const cy = (alvo.y + 0.5) * p;
      g.circle(cx, cy, p * 0.45).stroke({ width: 2, color: cor(REGISTRO_EFEITOS.efeito_atrasado.cor), alpha: 0.4 });
      // Ajuste de 16/10/2026: moveTo antes do arco (sem ele, o Pixi liga o ponto anterior ao arco com uma linha).
      const inicio = -Math.PI / 2;
      g.moveTo(cx + Math.cos(inicio) * p * 0.45, cy + Math.sin(inicio) * p * 0.45);
      g.arc(cx, cy, p * 0.45, inicio, inicio + Math.PI * 2 * fracao).stroke({ width: 4, color: cor(REGISTRO_EFEITOS.efeito_atrasado.cor) });
    }
  }

  destruir(): void {
    this.g.destroy();
    this.armadilhas.g.destroy();
    this.armadilhas.brilho.destroy();
    this.runas.destruir();
    this.noAr.destruir();
  }
}
