// Marco 54 (26/11/2026, D-207): o recorte do exterior gerado no quadrado para o retângulo da região no atlas (o Mundo
// contínuo). Tudo que tem posição desce para as coordenadas do recorte; os vetores por célula são cortados. Puro.

import type { Celula } from '../core/comandos';
import type { Recorte } from './costura';
import type { ExteriorGerado, PontoDoExterior } from './gerador-exterior';

function mover<T extends { x: number; y: number }>(o: T, dx: number, dy: number): T {
  return { ...o, x: o.x + dx, y: o.y + dy };
}

function moverPonto(p: PontoDoExterior, dx: number, dy: number): PontoDoExterior {
  return p.tipo === 'estrutura' ? { ...p, porta: mover(p.porta, dx, dy), frente: mover(p.frente, dx, dy) } : mover(p, dx, dy);
}

function cortar(v: Uint8Array, n: number, r: Recorte): Uint8Array {
  const saida = new Uint8Array(r.largura * r.altura);
  for (let y = 0; y < r.altura; y++) saida.set(v.subarray((r.y + y) * n + r.x, (r.y + y) * n + r.x + r.largura), y * r.largura);
  return saida;
}

/** O exterior gerado no quadrado `n`, só com o recorte, em coordenadas dele. */
export function recortarExterior(ex: ExteriorGerado, n: number, r: Recorte): ExteriorGerado {
  const dx = -r.x;
  const dy = -r.y;
  const dentro = (c: { x: number; y: number }) => c.x >= r.x && c.y >= r.y && c.x < r.x + r.largura && c.y < r.y + r.altura;
  const f = ex.fase;
  return {
    ...ex,
    fase: {
      ...f,
      mapa: f.mapa.slice(r.y, r.y + r.altura).map((linha) => linha.slice(r.x, r.x + r.largura)),
      spawns: f.spawns.filter(dentro).map((s) => mover(s, dx, dy)),
      ...(f.inimigos && { inimigos: f.inimigos.filter(dentro).map((i) => mover(i, dx, dy)) }),
      ...(f.objetos && { objetos: f.objetos.filter(dentro).map((o) => mover(o, dx, dy)) }),
      ...(f.ambientes && { ambientes: f.ambientes.filter(dentro).map((a) => mover(a, dx, dy)) }),
      ...(f.telhados && { telhados: f.telhados.filter(dentro).map((t) => mover(t, dx, dy)) }),
    },
    pontos: ex.pontos.filter((p) => dentro(p.tipo === 'estrutura' ? p.porta : p)).map((p) => moverPonto(p, dx, dy)),
    passagens: { norte: [], sul: [], leste: [], oeste: [] },
    faixas: [],
    enfeites: [],
    vila: ex.vila && mover(ex.vila, dx, dy),
    abrigo: ex.abrigo && mover(ex.abrigo, dx, dy),
    rotas: ex.rotas.map((rota) => rota.filter(dentro).map((c): Celula => mover(c, dx, dy))).filter((rota) => rota.length > 1),
    alturas: cortar(ex.alturas, n, r),
    obstaculos: cortar(ex.obstaculos, n, r),
    pecas: ex.pecas.filter(dentro).map((p) => mover(p, dx, dy)),
    ninhos: ex.ninhos.filter(dentro).map((p) => mover(p, dx, dy)),
  };
}
