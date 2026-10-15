// Números de dano e cura saindo do alvo (§2.7 "Rolagem de dados"): cor por resultado, marca de
// crítico, "0" na falha crítica e escalonamento de 80 ms entre alvos de uma área. Nunca bloqueia
// a ação. Com movimento reduzido, só o número final, parado.
// Marco 13 (14/10/2026): guarda a célula e projeta a cada quadro (troca de visão no meio do número).
// Ajuste de 15/10/2026 (D-060): o d20 desenhado sobre o alvo nos extremos (16+ e falha), com pulo de escala.

import { Container, Graphics, Text } from 'pixi.js';
import { CELULA_PX } from './camera-calculo';
import { centroDaCelula, type Projecao } from './projecao';

const VIDA_MS = 900;
const SUBIDA_PX = 34;
export const ESCALONAMENTO_MS = 80;

export type TipoNumero = 'dano' | 'critico' | 'falha' | 'cura' | 'recurso' | 'esquiva' | 'ouro';

const ESTILO: Readonly<Record<TipoNumero, { cor: number; tamanho: number }>> = {
  dano: { cor: 0xece8f4, tamanho: 18 },
  critico: { cor: 0xf39c12, tamanho: 24 },
  falha: { cor: 0x8e8a99, tamanho: 16 },
  cura: { cor: 0x2ecc71, tamanho: 18 },
  recurso: { cor: 0x5dade2, tamanho: 18 },
  esquiva: { cor: 0x8e8a99, tamanho: 14 },
  ouro: { cor: 0xf1c40f, tamanho: 18 },
};

/** d20 nos extremos: cor da faixa (dourado no bom, vermelho na falha). */
const COR_DADO = { bom: 0xf1c40f, falha: 0xe74c3c } as const;
const VIDA_DADO_MS = 800;

interface Numero {
  texto: Container;
  inicioMs: number;
  /** O d20 desenhado (pulo de escala e vida própria). */
  dado: boolean;
  /** Célula de origem e o desvio horizontal (px de tela) para números simultâneos. */
  celulaX: number;
  celulaY: number;
  desvio: number;
}

export class CamadaNumeros {
  private readonly vivos: Numero[] = [];

  constructor(
    private readonly camada: Container,
    private readonly movimentoReduzido: () => boolean,
    private readonly projecao: () => Projecao,
  ) {}

  /** `celulaX/Y` em células; `atrasoMs` para escalonar números de área. */
  mostrar(conteudo: string, tipo: TipoNumero, celulaX: number, celulaY: number, agoraMs: number, atrasoMs = 0): void {
    const estilo = ESTILO[tipo];
    const texto = new Text({
      text: conteudo,
      style: {
        fontFamily: 'system-ui, sans-serif',
        fontSize: estilo.tamanho,
        fontWeight: '700',
        fill: estilo.cor,
        stroke: { color: 0x000000, width: 4 },
      },
    });
    texto.anchor.set(0.5);
    texto.visible = false;
    this.camada.addChild(texto);
    // Pequeno desvio horizontal para números simultâneos não se sobreporem.
    const desvio = ((this.vivos.length % 3) - 1) * 10;
    this.vivos.push({ texto, inicioMs: agoraMs + atrasoMs, celulaX, celulaY, desvio, dado: false });
  }

  /** Ajuste de 15/10/2026: o d20 sobre o alvo, só nos extremos (quem chama decide). */
  mostrarDado(valor: number, faixa: keyof typeof COR_DADO, celulaX: number, celulaY: number, agoraMs: number): void {
    const cor = COR_DADO[faixa];
    const dado = new Container();
    const r = valor === 20 ? 17 : 14;
    const pontos: number[] = [];
    for (let i = 0; i < 6; i++) pontos.push(Math.cos((Math.PI / 3) * i - Math.PI / 2) * r, Math.sin((Math.PI / 3) * i - Math.PI / 2) * r);
    const forma = new Graphics().poly(pontos).fill({ color: 0x14121a, alpha: 0.9 }).stroke({ width: 2.5, color: cor });
    // Facetas internas, para ler como um d20 e não como um botão.
    forma.poly([0, -r, r * 0.6, r * 0.35, -r * 0.6, r * 0.35]).stroke({ width: 1, color: cor, alpha: 0.45 });
    const numero = new Text({
      text: String(valor),
      style: { fontFamily: 'system-ui, sans-serif', fontSize: valor === 20 ? 16 : 13, fontWeight: '800', fill: cor, stroke: { color: 0x000000, width: 3 } },
    });
    numero.anchor.set(0.5);
    numero.position.set(0, 2);
    dado.addChild(forma, numero);
    dado.visible = false;
    this.camada.addChild(dado);
    this.vivos.push({ texto: dado, inicioMs: agoraMs, celulaX, celulaY, desvio: 26, dado: true });
  }

  atualizar(agoraMs: number): void {
    const reduzido = this.movimentoReduzido();
    const proj = this.projecao();
    // Sai de cima da cabeça: no isométrico o token é mais alto (em pé).
    const acima = proj.visao === 'iso' ? CELULA_PX * 1.1 : CELULA_PX * 0.55;
    for (let i = this.vivos.length - 1; i >= 0; i--) {
      const n = this.vivos[i];
      if (!n) continue;
      const idade = agoraMs - n.inicioMs;
      if (idade < 0) continue;
      const vida = n.dado ? VIDA_DADO_MS : VIDA_MS;
      if (idade > vida) {
        n.texto.destroy({ children: true });
        this.vivos.splice(i, 1);
        continue;
      }
      const t = idade / vida;
      n.texto.visible = true;
      const c = centroDaCelula(n.celulaX, n.celulaY);
      const p = proj.projetar(c.x, c.y);
      const y = p.y - acima;
      n.texto.position.set(p.x + n.desvio, reduzido ? y : y - (n.dado ? SUBIDA_PX * 0.5 : SUBIDA_PX) * t);
      n.texto.alpha = reduzido ? 1 : 1 - Math.max(0, (t - 0.6) / 0.4);
      // O dado entra com um pulo: cresce até 1,3 e assenta em 1 nos primeiros 25% da vida.
      if (n.dado) n.texto.scale.set(reduzido ? 1 : t < 0.25 ? 0.6 + 2.8 * t : Math.max(1, 1.3 - (t - 0.25) * 1.2));
    }
  }

  destruir(): void {
    for (const n of this.vivos) n.texto.destroy({ children: true });
    this.vivos.length = 0;
  }
}
