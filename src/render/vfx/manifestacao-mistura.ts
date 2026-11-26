// A mescla dos elementos na skill de fusão (D-206, 26/11/2026). A assinatura do núcleo continua desenhando a magia; por
// cima dela, a fusão mostra sempre:
// - a matéria de cada elemento da mistura (veneno, trevas e fogo: bolhas, almas e brasas), o do núcleo mais discreto,
//   porque a assinatura já é feita dele;
// - a liga de cada par (ligas.ts): a lava do fogo com a terra, o vapor ou o cristal ígneo do fogo com o gelo, o
//   fulgurito do raio com a terra… Na mão e no rastro, o fio da liga; no acerto e na área, o estouro e a silhueta dela;
// - com três elementos ou mais, a trança: a matéria de cada um gira em volta do acerto, entrelaçada.
// Com movimento reduzido, ficam as partículas e a primeira silhueta (sem a trança nem a segunda liga). Só desenho.

import type { Emissao } from '../presets-particula';
import { orbitar, sortear } from './blocos';
import type { Acerto, AreaVfx, CenaVfx, EmSi, P } from './cena';
import { ligaDe, ligaNaArea, type Liga } from './ligas';
import { COR_DA_RUNA, conjuracaoDaRuna, materiaDaRuna, type Runa } from './manifestacao-runa';
import type { NomeTextura } from './pincel';

/** A peça de cada elemento na trança. */
const FIO_DO_ELEMENTO: Readonly<Record<Runa, NomeTextura>> = {
  fisico: 'estilhaco', fogo: 'brasa', gelo: 'cristal', raio: 'faisca', veneno: 'bolha', psiquico: 'runa1', terra: 'rocha', trevas: 'alma', sagrado: 'estrela', vento: 'folha',
};

/** O que a mistura desenha, montado uma vez por skill (as ligas são fixas para os mesmos elementos). */
interface Retrato {
  elementos: readonly Runa[];
  ligas: readonly Liga[];
}

const MEMORIA = new Map<string, Retrato>();

/** As ligas da mistura: primeiro os pares com o núcleo (o dominante), depois os outros; até 3. */
function retratoDe(elementos: readonly Runa[]): Retrato {
  const chave = elementos.join(',');
  const pronto = MEMORIA.get(chave);
  if (pronto) return pronto;
  const dominante = elementos[0] ?? 'fisico';
  const ligas: Liga[] = [];
  for (let i = 0; i < elementos.length; i++) {
    for (let j = i + 1; j < elementos.length; j++) {
      const a = elementos[i];
      const b = elementos[j];
      if (!a || !b) continue;
      const l = ligaDe(a, b, a === dominante || b === dominante ? dominante : a);
      if (l) ligas.push(l);
    }
  }
  const r = { elementos, ligas: ligas.slice(0, 3) };
  if (MEMORIA.size > 128) MEMORIA.clear();
  MEMORIA.set(chave, r);
  return r;
}

/** Só as misturas de verdade (dois elementos ou mais) desenham. */
export function retratoDaMistura(elementos: readonly Runa[] | undefined): Retrato | null {
  return elementos && elementos.length >= 2 ? retratoDe(elementos) : null;
}

/** A matéria de cada elemento: o do núcleo, discreto; os outros, por inteiro. */
function materias(c: CenaVfx, r: Retrato, em: P, forca: number): void {
  r.elementos.forEach((el, i) => { c.particulas.emitirLista(materiaDaRuna(el, (i === 0 ? 0.35 : 0.7) * forca), em.x, em.y, COR_DA_RUNA[el]); });
}

/** A trança: a peça de cada elemento girando em volta, cada uma num raio e numa fase. */
function tranca(c: CenaVfx, r: Retrato, em: P, e: number): void {
  if (c.reduzido || r.elementos.length < 3) return;
  r.elementos.forEach((el, i) => {
    orbitar(c, () => em, FIO_DO_ELEMENTO[el], COR_DA_RUNA[el], { n: 2, raio: (0.55 + 0.18 * i) * e, ms: 560, voltas: i % 2 === 0 ? 1.1 : -1.1, tamanho: 0.4, aditivo: el !== 'trevas' && el !== 'terra', rastro: 1 });
  });
}

const umDe = <T>(l: readonly T[]): T | undefined => l[Math.floor(Math.random() * l.length)];

/** Uma emissão de cada lista, com a quantidade reduzida (o fio na mão e no rastro é leve). */
const leve = (l: readonly Emissao[], n: number): Emissao[] => l.slice(0, 1).map((e) => ({ ...e, quantidade: Math.max(1, Math.min(n, e.quantidade)) }));

/** Na mão de quem conjura (a cada pulso da conjuração). */
export function misturaNaConjuracao(c: CenaVfx, r: Retrato, pos: P): void {
  for (const l of r.ligas) c.particulas.emitirLista(l.fio, pos.x, pos.y, l.cor);
  r.elementos.slice(1).forEach((el) => { c.particulas.emitirLista(conjuracaoDaRuna(el, 0.6), pos.x, pos.y, COR_DA_RUNA[el]); });
}

/** No rastro do projétil (a cada 30 ms): o fio de uma liga e um grão de um elemento, alternando. */
export function misturaNoRastro(c: CenaVfx, r: Retrato, x: number, y: number): void {
  const l = umDe(r.ligas);
  if (l) c.particulas.emitirLista(l.fio, x, y, l.cor);
  const el = umDe(r.elementos);
  if (el && Math.random() < 0.5) c.particulas.emitirLista(leve(materiaDaRuna(el, 0.3), 2), x, y, COR_DA_RUNA[el]);
}

/** No acerto: a matéria de cada elemento, o estouro e a silhueta das ligas e a trança. */
export function misturaNoAcerto(c: CenaVfx, r: Retrato, a: Acerto): void {
  const e = Math.max(1, a.escala);
  materias(c, r, a.ate, a.indice < 3 ? 1 : 0.4);
  if (a.indice >= 3) return;
  r.ligas.forEach((l, i) => {
    c.particulas.emitirLista(l.estouro, a.ate.x, a.ate.y, l.cor);
    if (i === 0 || (i === 1 && !c.reduzido)) l.gesto(c, a.ate, a.de, (i === 0 ? 1 : 0.75) * e);
  });
  if (a.indice === 0) tranca(c, r, a.ate, e);
}

/** No estouro da área: as ligas pelas células, a matéria de cada elemento espalhada e a trança no centro. */
export function misturaNaArea(c: CenaVfx, r: Retrato, a: AreaVfx): void {
  r.ligas.forEach((l, i) => { if (i === 0 || !c.reduzido) ligaNaArea(c, l, a, i === 0 ? 3 : 2); });
  const celulas = sortear(a.celulas, Math.min(4, a.celulas.length));
  r.elementos.forEach((el, i) => {
    const q = celulas[i % Math.max(1, celulas.length)] ?? a.centro;
    c.particulas.emitirLista(materiaDaRuna(el, i === 0 ? 0.35 : 0.7), q.x, q.y, COR_DA_RUNA[el]);
  });
  tranca(c, r, a.centro, Math.max(1, Math.min(1.6, a.raio * 0.6)));
}

/** Em si mesmo (o buff, a postura): a matéria de cada um e a liga, menores, no corpo de quem lança. */
export function misturaEmSi(c: CenaVfx, r: Retrato, a: EmSi): void {
  materias(c, r, a.pos, 0.7);
  const l = r.ligas[0];
  if (l) {
    c.particulas.emitirLista(l.estouro, a.pos.x, a.pos.y, l.cor);
    l.gesto(c, a.pos, null, 0.7 * a.escala);
  }
  tranca(c, r, a.pos, 0.9);
}
