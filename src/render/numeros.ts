// Números de dano e cura saindo do alvo (§2.7 "Rolagem de dados"): cor por resultado, marca de
// crítico, "0" na falha crítica e escalonamento de 80 ms entre alvos de uma área. Nunca bloqueia
// a ação. Com movimento reduzido, só o número final, parado.

import { Container, Text } from 'pixi.js';
import { CELULA_PX } from './camera-calculo';

const VIDA_MS = 900;
const SUBIDA_PX = 34;
export const ESCALONAMENTO_MS = 80;

export type TipoNumero = 'dano' | 'critico' | 'falha' | 'cura' | 'recurso' | 'esquiva';

const ESTILO: Readonly<Record<TipoNumero, { cor: number; tamanho: number }>> = {
  dano: { cor: 0xece8f4, tamanho: 18 },
  critico: { cor: 0xf39c12, tamanho: 24 },
  falha: { cor: 0x8e8a99, tamanho: 16 },
  cura: { cor: 0x2ecc71, tamanho: 18 },
  recurso: { cor: 0x5dade2, tamanho: 18 },
  esquiva: { cor: 0x8e8a99, tamanho: 14 },
};

interface Numero {
  texto: Text;
  inicioMs: number;
  x: number;
  y: number;
}

export class CamadaNumeros {
  private readonly vivos: Numero[] = [];

  constructor(
    private readonly camada: Container,
    private readonly movimentoReduzido: () => boolean,
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
    this.vivos.push({
      texto,
      inicioMs: agoraMs + atrasoMs,
      x: (celulaX + 0.5) * CELULA_PX + desvio,
      y: (celulaY + 0.5) * CELULA_PX - CELULA_PX * 0.55,
    });
  }

  atualizar(agoraMs: number): void {
    const reduzido = this.movimentoReduzido();
    for (let i = this.vivos.length - 1; i >= 0; i--) {
      const n = this.vivos[i];
      if (!n) continue;
      const idade = agoraMs - n.inicioMs;
      if (idade < 0) continue;
      if (idade > VIDA_MS) {
        n.texto.destroy();
        this.vivos.splice(i, 1);
        continue;
      }
      const t = idade / VIDA_MS;
      n.texto.visible = true;
      n.texto.position.set(n.x, reduzido ? n.y : n.y - SUBIDA_PX * t);
      n.texto.alpha = reduzido ? 1 : 1 - Math.max(0, (t - 0.6) / 0.4);
    }
  }

  destruir(): void {
    for (const n of this.vivos) n.texto.destroy();
    this.vivos.length = 0;
  }
}
