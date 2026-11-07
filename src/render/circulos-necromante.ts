// Os círculos de conjuração do Necromante (07/11/2026, D-136). Só lê o estado:
// - Lança de ossos: enquanto conjura (parado), o círculo de trevas largo sob os pés;
// - Dardo funesto: cada dardo à espera do disparo é um círculo no ar, parado onde foi conjurado (um ao lado do outro,
//   quando há vários no mesmo lugar), de frente para a tela, na camada das entidades; some quando o dardo sai dele.

import { Graphics } from 'pixi.js';
import type { Habilidade } from '../combat/habilidades';
import type { EstadoJogo } from '../core/estado';
import { circuloDeConjuracao } from './armadilhas-visual';
import { CELULA_PX } from './camera-calculo';
import type { OpcoesEmPe } from './objetos';
import { centroDaCelula } from './projecao';

/** Quanto acima da célula o círculo do dardo paira (em células) e o espaço entre dois. */
const ALTURA_NO_AR = 1.1;
const ESPACO_NO_AR = 0.55;

export function circulosDoNecromante(g: Graphics, brilho: Graphics, estado: EstadoJogo, habilidade: (chave: string) => Habilidade | undefined, tMs: number): void {
  for (const e of estado.entidades) {
    const a = e.acao;
    if (!a || estado.tick >= a.lancamentoTick || !habilidade(a.chave)?.lanca) continue;
    circuloDeConjuracao(g, brilho, { x: e.x, y: e.y, id: a.acaoId, elemento: 'trevas' }, tMs, false, false, 1.7);
  }
}

/** Os círculos no ar do Dardo funesto (acima de tudo na camada das entidades). */
export class CirculosNoAr {
  private readonly g = new Graphics();
  private readonly brilho = new Graphics();

  constructor(private readonly emPe: OpcoesEmPe | null) {
    if (!emPe) return;
    this.brilho.blendMode = 'add';
    this.g.zIndex = this.brilho.zIndex = 1e7;
    emPe.camada.addChild(this.g, this.brilho);
  }

  desenhar(estado: EstadoJogo, habilidade: (chave: string) => Habilidade | undefined, tMs: number): void {
    const g = this.g.clear();
    const brilho = this.brilho.clear();
    if (!this.emPe) return;
    const proj = this.emPe.projecao();
    const noLugar = new Map<string, number>();
    for (const f of estado.fases ?? []) {
      if (f.acaoId === undefined || f.origemX === undefined || f.origemY === undefined || !habilidade(f.chave)?.disparoMs) continue;
      const lugar = `${f.origemX},${f.origemY}`;
      const i = noLugar.get(lugar) ?? 0;
      noLugar.set(lugar, i + 1);
      const lado = i === 0 ? 0 : (i % 2 === 1 ? 1 : -1) * Math.ceil(i / 2);
      const c = centroDaCelula(f.origemX, f.origemY);
      const pt = proj.projetar(c.x, c.y);
      // O círculo desenha no centro (x + 0,5) × célula: aqui, o ponto da tela acima da célula de origem.
      const x = pt.x / CELULA_PX - 0.5 + lado * ESPACO_NO_AR;
      const y = (pt.y - ALTURA_NO_AR * CELULA_PX) / CELULA_PX - 0.5;
      circuloDeConjuracao(g, brilho, { x, y, id: f.acaoId, elemento: 'trevas' }, tMs, false, false, 0.75);
    }
  }

  destruir(): void {
    this.g.destroy();
    this.brilho.destroy();
  }
}
