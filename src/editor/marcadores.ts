// Marcadores do editor (§3.10). Marco 11A (16/10/2026, D-066): spawn, inimigos (silhueta do jogo, nível e coroa do
// chefe da saída), objetos (orbes na cor do jogo; baú, loja, loot, armadilha e fonte de som por ícone), portas
// internas (anel violeta com o número do par) e a tranca da porta de saída. Redesenha tudo de uma vez: o editor só
// chama quando algo muda.

import { Container, Graphics, Text } from 'pixi.js';
import { REGISTRO_EFEITOS } from '../combat/registro-efeitos';
import type { Conteudo } from '../core/conteudo';
import type { Celula } from '../core/comandos';
import { CELULA_PX } from '../render/camera-calculo';
import { desenharSilhueta } from '../render/sprites';
import { chaveDoObjeto, type FaseEditavel } from './grade';

const COR_ORBE: Readonly<Record<string, number>> = { orbe_hp: 0x2ecc71, orbe_recurso: 0x5dade2 };

const ICONE: Readonly<Record<string, string>> = {
  bau: '🧰',
  loja: '🛒',
  loot: '🎁',
  armadilha: '⚠️',
  fonte_som: '🔊',
};

export function corDoOrbe(chave: string): number {
  const tipo = chave.startsWith('efeito:') ? chave.slice('efeito:'.length) : '';
  const def = tipo in REGISTRO_EFEITOS ? REGISTRO_EFEITOS[tipo as keyof typeof REGISTRO_EFEITOS] : undefined;
  return def ? Number.parseInt(def.cor.slice(1), 16) : (COR_ORBE[chave] ?? 0xffffff);
}

function texto(conteudo: string, tamanho: number, cor = 0xffffff): Text {
  const t = new Text({ text: conteudo, style: { fill: cor, fontSize: tamanho, fontWeight: '700', stroke: { color: 0x0d0b12, width: 3 } } });
  t.anchor.set(0.5);
  return t;
}

export class MarcadoresEditor {
  readonly raiz = new Container();

  constructor(private readonly conteudo: Conteudo) {}

  desenhar(f: FaseEditavel, previa: readonly Celula[] = []): void {
    for (const filho of this.raiz.removeChildren()) filho.destroy({ children: true });
    const colocar = (c: Celula, obj: Container) => {
      obj.position.set((c.x + 0.5) * CELULA_PX, (c.y + 0.5) * CELULA_PX);
      this.raiz.addChild(obj);
    };
    // Prévia do retângulo enquanto arrasta.
    if (previa.length > 0) {
      const g = new Graphics();
      for (const c of previa) g.rect(c.x * CELULA_PX, c.y * CELULA_PX, CELULA_PX, CELULA_PX).fill({ color: 0xf39c12, alpha: 0.25 });
      this.raiz.addChild(g);
    }
    for (const p of f.portasInternas) {
      for (const c of [p.a, p.b]) {
        const anel = new Container();
        anel.addChild(new Graphics().circle(0, 0, 18).stroke({ width: 4, color: 0x9b59b6 }), texto(String(p.numero), 14, 0xe8daef));
        colocar(c, anel);
      }
    }
    const s = f.portaSaida;
    if (s && s.tranca !== 'livre') colocar(s, texto(s.tranca === 'chave' ? '🔒' : '👑', 20));
    if (f.spawn) colocar(f.spawn, desenharSilhueta(new Graphics(), 'jogador', 0x3498db));
    const chefe = s?.tranca === 'boss' ? s.chefe : undefined;
    for (const i of f.inimigos) {
      const p = this.conteudo.presets.get(i.preset);
      const marcador = new Container();
      marcador.addChild(desenharSilhueta(new Graphics(), p?.arquetipo ?? 'perseguidor', 0xe74c3c));
      if (i.nivel && i.nivel > 1) {
        const n = texto(String(i.nivel), 12, 0xf1c40f);
        n.position.set(14, 12);
        marcador.addChild(n);
      }
      if (chefe?.x === i.x && chefe.y === i.y) {
        const coroa = texto('👑', 14);
        coroa.position.set(0, -24);
        marcador.addChild(coroa);
      }
      colocar(i, marcador);
    }
    for (const o of f.objetos) {
      const icone = ICONE[o.tipo];
      if (icone) colocar(o, texto(icone, 22));
      else colocar(o, new Graphics().circle(0, 0, 10).fill(corDoOrbe(chaveDoObjeto(o))).stroke({ width: 3, color: 0xffffff }));
    }
  }
}
