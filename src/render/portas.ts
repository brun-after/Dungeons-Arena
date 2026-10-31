// Portas no chão (§2.1, §2.16). Marco 10A-1 (14/10/2026). Só lê a fase e o estado:
// - porta de saída com cadeado enquanto trancada e brilho quando abre;
// - portas internas como anéis violeta com o número do par;
// - porta temporária do boss, dourada, pulsando durante a janela de 30 s.
// Marco 26 (25/10/2026, D-109): no isométrico, a porta (moldura, cadeado) e o número do par ficam em pé na camada
// das entidades, com profundidade; os anéis de espera seguem no chão.
// Marco 26 (26/10/2026, D-112): as portas viraram portais. A saída e o retorno mostram a fase para onde levam (a
// moldura no estilo do tema de destino, render/molduras-portal.ts, e o ar em partículas); a saída trancada fica com o
// vórtice apagado, correntes e cadeado; a porta temporária do chefe é dourada. Os portais internos são vórtices sem
// número: o par se reconhece só pela cor, e o anel de espera no chão usa a mesma cor.
// Ajuste de 31/10/2026 (D-130): no isométrico, a saída, o retorno e a porta do chefe ficam num arco de pedra
// pré-renderizado de modelos 3D CC0 (render/objetos-3d.ts, `portal`), tingido de leve na cor do tema de destino, com o
// vórtice no vão; sem a imagem, a moldura desenhada de antes.

import { Graphics, Sprite, type Container } from 'pixi.js';
import type { EstadoJogo } from '../core/estado';
import type { Fase } from '../world/fase';
import type { EstiloPortal, Tema } from '../world/temas';
import { CELULA_PX } from './camera-calculo';
import { ALTURA, corDoPar, portalDeCima, portalEmPe, trancas, vortice, type DesenhoPortal } from './molduras-portal';
import type { OpcoesEmPe } from './objetos';
import type { ObjetosPreRenderizados } from './objetos-3d';
import type { SistemaParticulas } from './particulas';
import { centroDaCelula } from './projecao';
import { paletaDe } from './terreno';

const P = CELULA_PX;
/** De quanto em quanto tempo cada portal solta o ar em partículas. */
const AR_MS = 260;
/** O dourado da porta temporária do chefe. */
const COR_CHEFE = 0xf1c40f;
/**
 * O vão do arco pré-renderizado (tools/objetos/receitas.ts, `portal`): pilares a ±0,6 célula com 0,31 de largura e o
 * lintel a 1,36 de altura; na tela, 48 px por célula na horizontal e 48·cos 30° na vertical.
 */
const VAO = { meiaLargura: 19, altura: 54 };
/** Quanto da cor do tema tinge a pedra do arco. */
const TINTA_ARCO = 0.3;

function tingir(cor: number, k: number): number {
  const canal = (d: number) => Math.round(255 + (((cor >> d) & 0xff) - 255) * k);
  return (canal(16) << 16) | (canal(8) << 8) | canal(0);
}

export interface OpcoesPortas {
  emPe?: OpcoesEmPe | null;
  /** O tema de destino da saída e do retorno, e o desta fase (o portal neutro usa a paleta dela). */
  destinos?: { saida: Tema | null; retorno: Tema | null; aqui: Tema | null };
  particulas?: SistemaParticulas | null;
  modelos?: ObjetosPreRenderizados | null;
}

interface Portal {
  x: number;
  y: number;
  desenho: DesenhoPortal;
  /** Portal interno: o vórtice oval sem moldura. */
  par: boolean;
  trancado: boolean;
}

export class CamadaPortas {
  private readonly g = new Graphics();
  /** Os portais em pé (só no isométrico), um por célula. */
  private readonly altas = new Map<string, Graphics>();
  /** Os arcos de pedra dos portais em pé, por célula. */
  private readonly arcos = new Map<string, Sprite>();
  private ultimoArMs = 0;

  constructor(
    private readonly camada: Container,
    private readonly fase: Fase,
    private readonly ticksJanela: number,
    private readonly o: OpcoesPortas = {},
  ) {
    camada.addChild(this.g);
  }

  /** O estilo e a cor do portal que leva a uma fase do tema (sem tema: pedra na cor da parede desta fase). */
  private estiloDe(tema: Tema | null): { estilo: EstiloPortal; cor: number } {
    if (tema) return tema.portal;
    const aqui = this.o.destinos?.aqui;
    return { estilo: 'pedra', cor: aqui ? aqui.portal.cor : paletaDe(this.fase.matizGraus).paredeTopo };
  }

  private portaisDoQuadro(estado: EstadoJogo, tMs: number): Portal[] {
    const lista: Portal[] = [];
    const d = this.o.destinos;
    for (const porta of this.fase.portasInternas) {
      const cor = corDoPar(porta.numero);
      for (const c of [porta.a, porta.b]) lista.push({ x: c.x, y: c.y, par: true, trancado: false, desenho: { estilo: 'pedra', cor, tMs, aceso: true } });
    }
    const volta = this.fase.portaRetorno;
    if (volta) lista.push({ x: volta.x, y: volta.y, par: false, trancado: false, desenho: { ...this.estiloDe(d?.retorno ?? null), tMs, aceso: true } });
    const s = this.fase.portaSaida;
    if (s) {
      const trancada = s.tranca !== 'livre' && !estado.saidaAberta;
      lista.push({ x: s.x, y: s.y, par: false, trancado: trancada, desenho: { ...this.estiloDe(d?.saida ?? null), tMs, aceso: !trancada } });
    }
    for (const o of estado.objetos) {
      if (o.tipo !== 'saida') continue;
      const naJanela = estado.tick < o.abertoTick + this.ticksJanela;
      lista.push({ x: o.x, y: o.y, par: false, trancado: false, desenho: { estilo: this.estiloDe(d?.saida ?? null).estilo, cor: COR_CHEFE, tMs: naJanela ? tMs : 0, aceso: true } });
    }
    return lista;
  }

  desenhar(estado: EstadoJogo, agoraMs: number, movimentoReduzido: boolean): void {
    const g = this.g.clear();
    const tMs = movimentoReduzido ? 0 : agoraMs;
    const emPe = this.o.emPe ?? null;
    const proj = emPe?.projecao() ?? null;
    const vistas = new Set<string>();
    const pulso = movimentoReduzido ? 1 : (Math.sin(agoraMs / 220) + 1) / 2;
    const portais = this.portaisDoQuadro(estado, tMs);
    for (const p of portais) {
      const cx = (p.x + 0.5) * P;
      const cy = (p.y + 0.5) * P;
      // O anel de espera do portal interno fica no chão, na cor do par.
      if (p.par) g.circle(cx, cy, 17).fill({ color: p.desenho.cor, alpha: 0.18 }).stroke({ width: 2.5, color: p.desenho.cor, alpha: 0.5 + 0.4 * pulso });
      if (!emPe || proj?.visao !== 'iso') {
        if (p.par) vortice(g, cx, cy, 12, 12, p.desenho.cor, tMs, true);
        else portalDeCima(g, cx, cy, p.desenho);
        if (p.trancado) trancas(g, cx, cy, false);
        continue;
      }
      const chave = `${p.x},${p.y}`;
      vistas.add(chave);
      let alta = this.altas.get(chave);
      if (!alta) {
        alta = new Graphics();
        emPe.camada.addChild(alta);
        this.altas.set(chave, alta);
      }
      const c = centroDaCelula(p.x, p.y);
      const pt = proj.projetar(c.x, c.y);
      alta.position.set(pt.x, pt.y);
      alta.zIndex = pt.y;
      alta.clear();
      if (p.par) {
        // O portal interno de pé: um vórtice oval flutuando sobre o anel, sem moldura.
        alta.ellipse(0, 0, 14, 5).fill({ color: 0x000000, alpha: 0.25 });
        vortice(alta, 0, -ALTURA * 0.45, 11, ALTURA * 0.38, p.desenho.cor, tMs, true);
      } else if (this.arco(chave, pt.x, pt.y, p.desenho.cor, emPe.camada)) {
        alta.ellipse(0, 0, 30, 11).fill({ color: 0x000000, alpha: 0.3 });
        const cy = -VAO.altura / 2;
        if (p.desenho.aceso) vortice(alta, 0, cy, VAO.meiaLargura, VAO.altura / 2 - 2, p.desenho.cor, tMs, true);
        else alta.ellipse(0, cy, VAO.meiaLargura, VAO.altura / 2 - 2).fill({ color: 0x07060a, alpha: 0.85 });
        if (p.trancado) trancas(alta, 0, 0, true);
      } else {
        portalEmPe(alta, 0, 0, p.desenho);
        if (p.trancado) trancas(alta, 0, 0, true);
      }
    }
    for (const [chave, alta] of this.altas) {
      if (vistas.has(chave)) continue;
      alta.destroy();
      this.altas.delete(chave);
    }
    for (const [chave, arco] of this.arcos) {
      if (vistas.has(chave)) continue;
      arco.destroy();
      this.arcos.delete(chave);
    }
    this.soltarAr(portais, agoraMs, movimentoReduzido);
  }

  /** O arco de pedra atrás do vórtice (os pés no centro da célula); false sem a imagem. */
  private arco(chave: string, x: number, y: number, cor: number, camada: Container): boolean {
    const modelos = this.o.modelos;
    if (!modelos?.tem('portal')) return false;
    let s = this.arcos.get(chave);
    if (!s) {
      s = modelos.sprite('portal') ?? undefined;
      if (!s) return false;
      this.arcos.set(chave, s);
      camada.addChild(s);
    }
    s.position.set(x, y);
    // Logo atrás do vórtice (o Graphics do portal fica em y).
    s.zIndex = y - 0.001;
    s.tint = tingir(cor, TINTA_ARCO);
    return true;
  }

  /** O ar de cada portal aceso, em partículas, de tempos em tempos (nada com movimento reduzido). */
  private soltarAr(portais: readonly Portal[], agoraMs: number, reduzido: boolean): void {
    const particulas = this.o.particulas;
    if (!particulas || reduzido || particulas.limite <= 0 || agoraMs - this.ultimoArMs < AR_MS) return;
    this.ultimoArMs = agoraMs;
    for (const p of portais) {
      if (!p.desenho.aceso) continue;
      particulas.emitir(p.par ? 'portal_par' : `portal_${p.desenho.estilo}`, p.x, p.y, p.desenho.cor);
    }
  }

  destruir(): void {
    this.g.destroy();
    for (const alta of this.altas.values()) alta.destroy();
    this.altas.clear();
    for (const arco of this.arcos.values()) arco.destroy();
    this.arcos.clear();
  }
}
