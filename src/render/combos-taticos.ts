import type { SistemaParticulas } from './particulas';
import type { NomePreset } from './presets-particula';
// Marco 19 (17/10/2026): 35 composições exclusivas e campos reais; lê apenas eventos e estado.
import { Graphics, type Container } from 'pixi.js';
import dados from '../data/combos.json';
import type { EstadoJogo } from '../core/estado';
import type { Barramento } from '../core/events';
import type { EventosDaSimulacao } from '../core/eventos-simulacao';
import { centroDaCelula, type Projecao } from './projecao';
import { desenharFormaCombo } from './desenhos-combo';

export const VISUAIS_COMBO = new Map(dados.combos.map((c) => [c.id, c.visual]));
interface Ativo { id: string; x: number; y: number; ox: number; oy: number; ax: number; ay: number; mx: number; my: number; inicio: number }
export class CamadaCombosTaticos {
  private readonly g = new Graphics();
  private ativos: Ativo[] = [];
  constructor(camada: Container, private readonly projecao: () => Projecao, private readonly reduzido: () => boolean, private readonly simples: () => boolean, private readonly limite = 24, private readonly particulas?: SistemaParticulas) { camada.addChild(this.g); }
  ligar(bus: Barramento<EventosDaSimulacao>, estado: () => EstadoJogo, agora: () => number): void {
    bus.on('comboFeito', (ev) => {
      const ator = estado().entidades.find((e) => e.id === ev.id);
      const alvo = estado().entidades.find((e) => e.id === ev.alvoId);
      this.ativos.push({ id: ev.combo, x: ev.x ?? alvo?.x ?? ator?.x ?? 0, y: ev.y ?? alvo?.y ?? ator?.y ?? 0, ox: ev.origemX ?? ator?.x ?? 0, oy: ev.origemY ?? ator?.y ?? 0, ax: ev.atorX ?? ator?.x ?? 0, ay: ev.atorY ?? ator?.y ?? 0, mx: ev.miraX ?? ev.x ?? alvo?.x ?? 0, my: ev.miraY ?? ev.y ?? alvo?.y ?? 0, inicio: agora() });
      this.ativos = this.ativos.slice(-this.limite);
      const visual = VISUAIS_COMBO.get(ev.combo);
      const emissao: Record<string, NomePreset> = { espiral: 'vento', estandarte: 'runas', flechas: 'chuva', cristais: 'cristais', silhuetas: 'sombra', hexagonos: 'cristais', orbita: 'runas', leque: 'leque', lascas: 'pedra', chifres: 'chamas', elos: 'faiscas', fissuras: 'pedra', casulo: 'cristais', escudo: 'sagrado', runas: 'runas', constelacao: 'estrelas', raizes: 'pedra', muralha: 'pedra', fumaca: 'sombra', faiscas: 'sangue', gotas: 'sagrado', selo: 'sagrado', gota: 'bolhas', jaula: 'bolhas', eclipse: 'sombra', triangulo: 'corte', filamentos: 'bolhas', proa: 'cristais', tres_aneis: 'runas', fio: 'sombra' };
      const desenho = visual?.formas[0];
      if (visual && desenho && !this.reduzido()) this.particulas?.emitir(emissao[desenho] ?? 'faiscas', ev.x ?? alvo?.x ?? ator?.x ?? 0, ev.y ?? alvo?.y ?? ator?.y ?? 0, Number.parseInt(visual.cor.slice(1), 16));
    });
  }
  desenhar(estado: EstadoJogo, agora: number): void {
    const g = this.g.clear();
    const projetar = (x: number, y: number) => { const p = centroDaCelula(x, y); return this.projecao().projetar(p.x, p.y); };
    for (const c of estado.camposTaticos ?? []) {
      if (c.ateTick <= estado.tick) continue;
      const p = projetar(c.x, c.y);
      if (c.tipo === 'muralha') {
        g.poly([p.x - 19, p.y + 6, p.x - 19, p.y - 19, p.x + 17, p.y - 23, p.x + 19, p.y + 6]).fill({ color: 0x786657, alpha: .9 }).stroke({ color: 0xc2a78b, width: 2 });
        g.moveTo(p.x - 17, p.y - 5).lineTo(p.x + 17, p.y - 7).stroke({ color: 0xc2a78b, alpha: .7, width: 1 });
      } else {
        // Contorno celular mostra o alcance de gameplay, inclusive em qualidade mínima.
        for (let y = -c.raio; y <= c.raio; y++) for (let x = -c.raio; x <= c.raio; x++) {
          const a = this.projecao().projetar((c.x + x) * 48, (c.y + y) * 48);
          const b = this.projecao().projetar((c.x + x + 1) * 48, (c.y + y) * 48);
          const z = this.projecao().projetar((c.x + x + 1) * 48, (c.y + y + 1) * 48);
          const d = this.projecao().projetar((c.x + x) * 48, (c.y + y + 1) * 48);
          g.poly([a.x,a.y,b.x,b.y,z.x,z.y,d.x,d.y]).fill({ color: c.tipo === 'cura' ? 0x70cfa8 : 0x73ad66, alpha: .07 }).stroke({ color: c.tipo === 'cura' ? 0x70cfa8 : 0x73ad66, alpha: .3, width: 1 });
        }
        desenharFormaCombo(g, c.tipo === 'cura' ? 'selo' : 'bolhas', p.x, p.y, 18, 0, c.tipo === 'cura' ? 0x70cfa8 : 0x73ad66, .65);
      }
    }
    this.ativos = this.ativos.filter((a) => agora - a.inicio < (VISUAIS_COMBO.get(a.id)?.duracaoMs ?? 800));
    for (const a of this.ativos) {
      const v = VISUAIS_COMBO.get(a.id);
      if (!v) continue;
      const t = this.reduzido() || this.simples() ? .5 : (agora - a.inicio) / v.duracaoMs;
      const origem = projetar(a.ox, a.oy);
      const cor = Number.parseInt(v.cor.slice(1), 16);
      const escala = v.movimento === 'expandir' ? .55 + t * .6 : v.movimento === 'contrair' || v.movimento === 'convergir' ? 1.2 - t * .55 : v.movimento === 'pulsar' ? .9 + Math.sin(t * Math.PI * 4) * .15 : 1;
      const giro = v.movimento === 'girar' ? t * Math.PI : 0;
      for (const [i, forma] of v.formas.entries()) {
        const destino = v.destinos[i];
        const fim = destino === 'ator' ? projetar(a.ax, a.ay) : destino === 'mira' ? projetar(a.mx, a.my) : destino === 'origem' ? origem : projetar(a.x, a.y);
        const yBase = v.movimento === 'avancar' ? origem.y + (fim.y - origem.y) * Math.min(1, t * 2) : fim.y;
        const y = yBase + (v.movimento === 'subir' ? -t * 20 : v.movimento === 'cair' ? (t - 1) * 20 : 0);
        const x = v.movimento === 'avancar' ? origem.x + (fim.x - origem.x) * Math.min(1, t * 2) : fim.x;
        desenharFormaCombo(g, forma, x, y, (i === 0 ? 26 : 19) * escala, giro, i === 0 ? cor : 0xe9e3d9, this.reduzido() ? .7 : Math.min(.85, 1 - t * .7));
      }
    }
  }
  destruir(): void { this.g.destroy(); this.ativos = []; }
}
