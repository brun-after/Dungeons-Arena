// Marco 49 (21/11/2026, D-194): a entrega na tela, lida do estado a cada quadro (nada de evento novo). A sombra no
// chão da parábola e da queda; o aviso de onde o céu cai; o círculo rúnico sob o alvo que sobe em coluna; os círculos
// atrás e à frente de quem lança; o feixe vivo do canal (três camadas na cor do elemento, que respira e engrossa com a
// exposição); o anel que gira e o que pulsa no alvo; o chão amaldiçoado e a erupção que ficam; o corpo grande (uma
// peça pesada e brilhante) e os grãos (uma nuvem de pedrinhas). A posição vem de `pontoEm`, a mesma do núcleo.

import { Container, Graphics } from 'pixi.js';
import { pontoEm } from '../combat/entrega/rota';
import type { Habilidade } from '../combat/habilidades';
import type { EstadoJogo, Projetil } from '../core/estado';
import type { Entidade } from '../entities/entidade';
import { CELULA_PX } from './camera-calculo';
import { ChaoDaEntrega } from './chao-da-entrega';
import type { SistemaParticulas } from './particulas';
import { centroDaCelula } from './projecao';
import { visualDe } from './visual-habilidade';

interface Opcoes {
  chao: Container;
  ar: Container;
  particulas: SistemaParticulas;
  habilidades: (chave: string) => Habilidade | undefined;
  reduzido: () => boolean;
}

type Ponto = { x: number; y: number };

const clarear = (c: number, k: number): number => {
  const f = (v: number) => Math.round(v + (255 - v) * k);
  return (f((c >> 16) & 0xff) << 16) | (f((c >> 8) & 0xff) << 8) | f(c & 0xff);
};

export class EntregaNaTela {
  private readonly chao = new Graphics();
  private readonly ar = new Graphics();
  private readonly ultimaFagulha = new Map<string, number>();

  private readonly chaoDaEntrega: ChaoDaEntrega;

  constructor(private readonly o: Opcoes) {
    o.chao.addChild(this.chao);
    o.ar.addChild(this.ar);
    this.chaoDaEntrega = new ChaoDaEntrega({ chao: this.chao, ar: this.ar, particulas: o.particulas });
  }

  /** O ponto na tela de uma célula, erguido `z` células acima do voo comum. */
  private noAr(x: number, y: number, z: number): Ponto {
    const p = this.o.particulas.naTela(x, y);
    return { x: p.x, y: p.y - z * CELULA_PX * 0.6 };
  }

  private cor(chave: string): { h: Habilidade; cor: number } | null {
    const h = this.o.habilidades(chave);
    return h ? { h, cor: visualDe(h).cor } : null;
  }

  quadro(estado: EstadoJogo, agoraMs: number, posicao: (e: Entidade) => Ponto): void {
    this.chao.clear();
    this.ar.clear();
    for (const p of estado.projeteis) if (p.rota) this.projetil(p, estado, agoraMs);
    for (const e of estado.entidades) if (e.canal) this.canal(e, estado, agoraMs, posicao);
    // 21/11/2026: o chão da entrega com a matéria do elemento (cristais, brasa, bolhas), não um clarão chapado.
    const vivos = new Set<number>();
    for (const s of estado.solos ?? []) {
      if (!s.entrega) continue;
      const c = this.cor(s.chave);
      if (!c) continue;
      vivos.add(s.id);
      this.chaoDaEntrega.desenhar(s, c.h.runa ?? c.h.elemento, c.cor, agoraMs);
    }
    this.chaoDaEntrega.limpar(vivos);
    if (this.ultimaFagulha.size > 64) this.ultimaFagulha.clear();
  }

  /** O círculo de conjuração no chão (runas que giram) ou o chão tomado pelo elemento (manchas que respiram). */
  private circuloNoChao(x: number, y: number, raioCelulas: number, cor: number, agoraMs: number, estilo: 'runas' | 'chao', forca = 1): void {
    // A camada do chão tem a matriz da projeção: desenha no plano (o círculo vira a elipse do isométrico).
    const c = centroDaCelula(x, y);
    const r = raioCelulas * CELULA_PX;
    const g = this.chao;
    if (estilo === 'chao') {
      const respira = 0.75 + 0.25 * Math.sin(agoraMs / 260);
      g.circle(c.x, c.y, r).fill({ color: cor, alpha: 0.16 * forca * respira });
      g.circle(c.x, c.y, r * 0.65).fill({ color: clarear(cor, 0.3), alpha: 0.14 * forca });
      return;
    }
    const giro = (agoraMs / 900) % (Math.PI * 2);
    g.circle(c.x, c.y, r).stroke({ width: 2, color: clarear(cor, 0.4), alpha: 0.85 * forca });
    g.circle(c.x, c.y, r * 0.72).stroke({ width: 1, color: cor, alpha: 0.6 * forca });
    // Os traços das runas no anel, girando.
    for (let i = 0; i < 6; i++) {
      const a = giro + (i * Math.PI) / 3;
      const px = c.x + Math.cos(a) * r * 0.86;
      const py = c.y + Math.sin(a) * r * 0.86;
      g.moveTo(px - Math.sin(a) * 4, py + Math.cos(a) * 4).lineTo(px + Math.sin(a) * 4, py - Math.cos(a) * 4).stroke({ width: 2, color: clarear(cor, 0.6), alpha: 0.9 * forca });
    }
  }

  private projetil(p: Projetil, estado: EstadoJogo, agoraMs: number): void {
    const r = p.rota;
    const c = this.cor(p.chave);
    if (!r || !c) return;
    const e = c.h.entrega;
    const z = pontoEm(r, p.t ?? 0).z;
    const esperando = (p.saiEm ?? 0) > estado.tick;
    // Os círculos atrás e à frente aparecem antes do tiro sair e logo depois.
    if ((e?.origem === 'circulos_atras' || e?.origem === 'circulos_frente') && (esperando || (p.t ?? 0) < 0.25)) {
      const a = this.noAr(r.ox, r.oy, 0.15);
      this.ar.circle(a.x, a.y, CELULA_PX * 0.38).stroke({ width: 2, color: clarear(c.cor, 0.5), alpha: 0.9 });
      this.ar.circle(a.x, a.y, CELULA_PX * 0.24).stroke({ width: 1, color: c.cor, alpha: 0.7 });
      this.ar.circle(a.x, a.y, CELULA_PX * 0.12).fill({ color: clarear(c.cor, 0.7), alpha: 0.5 + 0.3 * Math.sin(agoraMs / 80) });
    }
    if (esperando) return;
    // A sombra no chão do que voa alto e o aviso de onde o céu cai.
    if (r.tipo === 'queda' || (r.tipo === 'parabola' && z > 0.05)) {
      const chao = centroDaCelula(p.x, p.y);
      const k = r.tipo === 'queda' ? 1 - (p.t ?? 0) : z / Math.max(0.1, r.altura);
      this.chao.circle(chao.x, chao.y, CELULA_PX * (0.4 - 0.22 * k)).fill({ color: 0x000000, alpha: 0.35 - 0.2 * k });
    }
    if (r.tipo === 'queda') {
      this.circuloNoChao(r.dx, r.dy, 0.55 + (p.t ?? 0) * 0.5, c.cor, agoraMs, 'runas', 0.4 + 0.6 * (p.t ?? 0));
      const topo = this.noAr(p.x, p.y, z);
      const fim = this.noAr(p.x, p.y, Math.max(0, z - 1.2));
      this.ar.moveTo(topo.x, topo.y).lineTo(fim.x, fim.y).stroke({ width: 4, color: clarear(c.cor, 0.5), alpha: 0.8 });
    }
    if (r.tipo === 'coluna') {
      this.circuloNoChao(r.dx, r.dy, 0.6, c.cor, agoraMs, 'runas', 0.5 + 0.5 * (p.t ?? 0));
      if ((p.t ?? 0) > 0.6) {
        const base = this.o.particulas.noChao(r.dx, r.dy);
        const alto = this.noAr(r.dx, r.dy, 1.2 * ((p.t ?? 0) - 0.6) / 0.4);
        this.ar.moveTo(base.x, base.y).lineTo(alto.x, alto.y).stroke({ width: 10, color: c.cor, alpha: 0.35 }).moveTo(base.x, base.y).lineTo(alto.x, alto.y).stroke({ width: 3, color: clarear(c.cor, 0.7), alpha: 0.9 });
      }
    }
    // O que fica no alvo: o anel que gira e a onda que pulsa.
    if (p.perm) {
      const alvo = estado.entidades.find((x) => x.id === p.perm?.alvoId);
      if (alvo) {
        const centro = this.noAr(alvo.x, alvo.y, 0);
        if (e?.permanencia === 'gira') this.ar.ellipse(centro.x, centro.y, CELULA_PX * 0.8, CELULA_PX * 0.4).stroke({ width: 1.5, color: c.cor, alpha: 0.45 });
        else {
          const fase = (agoraMs % 650) / 650;
          this.ar.circle(centro.x, centro.y, CELULA_PX * (0.2 + 0.6 * fase)).stroke({ width: 3 * (1 - fase) + 0.5, color: clarear(c.cor, 0.4), alpha: 0.8 * (1 - fase) });
        }
      }
    }
    // O corpo: a peça grande e pesada; a nuvem de grãos; o retorno que traz vida.
    const aqui = this.noAr(p.x, p.y, z);
    if (e?.corpo === 'grande') {
      this.ar.circle(aqui.x, aqui.y, CELULA_PX * 0.42).fill({ color: c.cor, alpha: 0.35 });
      this.ar.circle(aqui.x, aqui.y, CELULA_PX * 0.28).fill({ color: clarear(c.cor, 0.35), alpha: 0.85 });
      this.ar.circle(aqui.x - 4, aqui.y - 4, CELULA_PX * 0.1).fill({ color: 0xffffff, alpha: 0.6 });
    } else if (e?.corpo === 'graos') {
      this.ar.circle(aqui.x, aqui.y, 2.4).fill({ color: clarear(c.cor, 0.5), alpha: 0.95 });
    } else if (p.traz) {
      this.ar.circle(aqui.x, aqui.y, 5 + Math.sin(agoraMs / 90) * 1.5).fill({ color: p.traz.tipo === 'vida' ? 0x7dffa0 : 0x9fd8ff, alpha: 0.75 });
    }
  }

  /** O feixe vivo (de quem canaliza até o alvo) e a boca da rajada. */
  private canal(e: Entidade, estado: EstadoJogo, agoraMs: number, posicao: (e: Entidade) => Ponto): void {
    const c = e.canal;
    const k = c ? this.cor(c.chave) : null;
    if (!c || !k) return;
    const de = posicao(e);
    const a = this.noAr(de.x, de.y, 0.1);
    if (c.tipo === 'rajada') {
      this.ar.circle(a.x, a.y, CELULA_PX * (0.28 + 0.05 * Math.sin(agoraMs / 60))).stroke({ width: 2, color: clarear(k.cor, 0.5), alpha: 0.8 });
      return;
    }
    const alvo = c.alvoId ? estado.entidades.find((x) => x.id === c.alvoId) : undefined;
    const ate = alvo ? posicao(alvo) : { x: c.miraX, y: c.miraY };
    const b = this.noAr(ate.x, ate.y, 0.1);
    const exposicao = alvo ? (c.exposicao[alvo.id] ?? 0) / 60 : 0;
    const respira = 1 + 0.18 * Math.sin(agoraMs / 70);
    const largura = (6 + 6 * exposicao) * respira;
    this.ar.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ width: largura * 2.2, color: k.cor, alpha: 0.18 });
    this.ar.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ width: largura, color: k.cor, alpha: 0.55 });
    this.ar.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ width: Math.max(1.5, largura * 0.3), color: clarear(k.cor, 0.8), alpha: 0.95 });
    this.ar.circle(b.x, b.y, largura * 0.9).fill({ color: clarear(k.cor, 0.5), alpha: 0.5 });
    // As fagulhas do elemento correm pelo feixe (a matéria da viagem da skill), sem passar do teto de partículas.
    const v = visualDe(k.h);
    const ultima = this.ultimaFagulha.get(e.id) ?? 0;
    if (!this.o.reduzido() && v.viagem && agoraMs - ultima > 90) {
      this.ultimaFagulha.set(e.id, agoraMs);
      this.o.particulas.emitir(v.viagem, de.x, de.y, k.cor, ate);
    }
  }
}
