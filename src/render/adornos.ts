// Equipamento no token (ajuste de 16/10/2026, D-067). A `aparencia` pública da entidade (a base das armas e a
// raridade de elmo, armadura e capa) vira duas texturas do tamanho do quadro do modelo, uma atrás e outra na
// frente, geradas do SVG de modelos/adornos.ts uma vez por combinação. O rig as põe no corpo, então acompanham a
// pose, o passo e o giro. Enquanto a imagem decodifica, o token aparece sem os adornos.

import armasJson from '../data/armas.json';
import { Texture } from 'pixi.js';
import type { AparenciaEquipada } from '../entities/entidade';
import { adornosDoBipede, deslocamentosDasMaos } from './modelos/adornos';
import { LADO_PX } from './modelos/atlas';
import { ARMA_DE_CLASSE, OPCOES_JOGAVEIS } from './modelos';
import { LADO_QUADRO, type Vista } from './modelos/svg';
import { COR_RARIDADE } from './objetos';
import type { Raridade } from '../modos/modo';
import { grauDe, modeloDaArma3d, nomeDaCamada, PECAS_DE_ARMADURA } from './equipamento-3d';

export interface TexturasAdorno {
  atras: Texture | null;
  frente: Texture | null;
  /** Marco 24 (25/10/2026, D-098): a arma principal à parte, e o pivô dela (a mão) em px da textura. */
  arma: Texture | null;
  /** Marco 25 (25/10/2026, D-103): a silhueta branca da arma (o arco do Arqueiro com a mira cheia). */
  armaBranca: Texture | null;
  pivo: { x: number; y: number };
  /** Marco 26 (25/10/2026, D-108): a mão secundária à parte e, por quadro de membros, quanto cada mão anda (px). */
  secundaria: Texture | null;
  maos: readonly MaosDoQuadro[];
}

export interface MaosDoQuadro {
  e: { x: number; y: number };
  d: { x: number; y: number };
}

/** Combinações guardadas (modelo, vista e equipamento); passando disso, sai a mais antiga. */
const MAXIMO = 96;
const cache = new Map<string, TexturasAdorno | 'carregando'>();
const VAZIO: TexturasAdorno = { atras: null, frente: null, arma: null, armaBranca: null, pivo: { x: 0, y: 0 }, secundaria: null, maos: [] };
/** A arma inteira pintada de branco (mantém só o alfa do desenho). */
const silhuetaBranca = (svg: string) =>
  svg ? `<defs><filter id="branco"><feFlood flood-color="#ffffff"/><feComposite in2="SourceAlpha" operator="in"/></filter></defs><g filter="url(#branco)">${svg}</g>` : '';
/** Do quadro do modelo (64) para os px da textura. */
const PX = LADO_PX / LADO_QUADRO;

const corDe = (r: string | null) => (r && Object.hasOwn(COR_RARIDADE, r) ? COR_RARIDADE[r as Raridade] : null);

function textura(conteudo: string): Promise<Texture | null> {
  if (!conteudo) return Promise.resolve(null);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${LADO_PX}" height="${LADO_PX}" viewBox="0 0 ${LADO_QUADRO} ${LADO_QUADRO}">${conteudo}</svg>`;
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  return img.decode().then(
    // Marco 26 (29/10/2026, D-122): fora do cache global do Pixi (`skipCache`). Com ele, a combinação que saía do
    // nosso cache continuava presa lá (com a imagem e a cópia na GPU) pela vida toda da página.
    () => Texture.from(img, true),
    () => null,
  );
}

/** Cor (número) de um elemento, pelo conteúdo oficial carregado na cena (injetada; null = sem cor). */
let corDoElemento: (elemento: string) => number | null = () => null;

/** A cena informa as cores dos elementos (do conteúdo), para o brilho da arma elemental. */
export function definirCoresDosElementos(f: (elemento: string) => number | null): void {
  corDoElemento = f;
}

/** Marco 27 (D-126): o modelo de cada desenho de arma (data/armas.json; sem `modelo`, o próprio desenho). */
const MODELOS_POR_DESENHO: ReadonlyMap<string, string> = new Map(Object.entries(armasJson.armas).map(([d, a]) => [d, 'modelo' in a ? a.modelo : d]));
const modeloDaArma = (desenho: string): string => MODELOS_POR_DESENHO.get(desenho) ?? desenho;

/** As texturas do equipamento para o modelo e a vista (null: o modelo não é de classe ou nada a mostrar ainda). */
export function texturasDoAdorno(modelo: string, vista: Vista, aparencia: AparenciaEquipada | null): TexturasAdorno | null {
  if (!Object.hasOwn(OPCOES_JOGAVEIS, modelo)) return null;
  const classe = modelo as keyof typeof OPCOES_JOGAVEIS;
  const vazio: AparenciaEquipada = { arma: null, secundaria: null, cabeca: null, corpo: null, capa: null, formaArma: null, elementoArma: null, formaMaxima: null };
  const eq = aparencia ?? vazio;
  // Mãos vazias: a arma da classe (e o escudo dela, se a mão secundária também estiver livre).
  const padrao = ARMA_DE_CLASSE[classe];
  const ap = eq.arma ? eq : { ...eq, arma: padrao.arma, secundaria: eq.secundaria ?? padrao.secundaria };
  const chave = `${modelo}|${vista}|${ap.arma}|${ap.secundaria}|${ap.cabeca}|${ap.corpo}|${ap.capa}|${ap.formaArma}|${ap.elementoArma}|${ap.formaMaxima}`;
  const pronto = cache.get(chave);
  if (pronto === 'carregando') return VAZIO;
  if (pronto) return pronto;
  if (cache.size >= MAXIMO) {
    const velho = cache.keys().next().value;
    if (velho !== undefined) cache.delete(velho);
  }
  cache.set(chave, 'carregando');
  const opcoes = OPCOES_JOGAVEIS[classe];
  const camadas = adornosDoBipede(opcoes, vista, {
    arma: ap.arma ? modeloDaArma(ap.arma) : null,
    secundaria: ap.secundaria ? modeloDaArma(ap.secundaria) : null,
    cabeca: corDe(ap.cabeca),
    corpo: corDe(ap.corpo),
    capa: corDe(ap.capa),
    corElemento: ap.elementoArma ? (corDoElemento(ap.elementoArma) ?? null) : null,
    forma: eq.arma ? ap.formaArma : null,
    formaMaxima: ap.formaMaxima,
  });
  const pivo = { x: camadas.pivo.x * PX, y: camadas.pivo.y * PX };
  const px = (p: { x: number; y: number }) => ({ x: p.x * PX, y: p.y * PX });
  const maos = deslocamentosDasMaos(opcoes, vista).map((m) => ({ e: px(m.e), d: px(m.d) }));
  const texturas = [camadas.atras, camadas.frente, camadas.arma, silhuetaBranca(camadas.arma), camadas.secundaria].map(textura);
  void Promise.all(texturas).then(([atras = null, frente = null, arma = null, armaBranca = null, secundaria = null]) => {
    // A combinação pode ter saído do cache enquanto carregava: não volta (o cache passaria do teto).
    if (cache.get(chave) === 'carregando') cache.set(chave, { atras, frente, arma, armaBranca, pivo, secundaria, maos });
  });
  return VAZIO;
}

/** Marco 32 (31/10/2026, D-131): uma peça de armadura do personagem pré-renderizado (o atlas da camada). */
export interface Camada3d {
  nome: string;
}

/** Uma arma na mão: o modelo 3D (armas/<modelo>.webp) e o grau (0 a 5). */
export interface Arma3d {
  modelo: string;
  grau: number;
}

export interface Equipamento3d {
  camadas: readonly Camada3d[];
  arma: Arma3d;
  secundaria: Arma3d | null;
  /** A cor do elemento da arma (o brilho por cima dela), ou null. */
  corElemento: number | null;
}

const cache3d = new Map<string, Equipamento3d>();

/**
 * O equipamento do personagem pré-renderizado (null: o modelo não é de classe): a capa, o peito e a cabeça pelo grau
 * da raridade (só as peças vestidas) e as armas de cada mão pelo desenho e pelo grau (a raridade ou a forma). Mãos
 * vazias: a arma da classe, no grau comum.
 */
export function equipamento3d(modelo: string, aparencia: AparenciaEquipada | null, existeArma: (m: string) => boolean): Equipamento3d | null {
  if (!Object.hasOwn(OPCOES_JOGAVEIS, modelo)) return null;
  const padrao = ARMA_DE_CLASSE[modelo as keyof typeof OPCOES_JOGAVEIS];
  const eq = aparencia;
  const desenho = eq?.arma ?? padrao.arma;
  const secundaria = eq?.arma ? eq.secundaria : (eq?.secundaria ?? padrao.secundaria);
  const elemento = eq?.arma ? eq.elementoArma : null;
  const chave = `${modelo}|${desenho}|${secundaria}|${eq?.cabeca}|${eq?.corpo}|${eq?.capa}|${elemento}|${eq?.raridadeArma}|${eq?.raridadeSecundaria}|${eq?.formaArma}`;
  const pronto = cache3d.get(chave);
  if (pronto) return pronto;
  const camadas: Camada3d[] = [];
  for (const peca of PECAS_DE_ARMADURA) {
    const raridade = eq?.[peca] ?? null;
    if (raridade) camadas.push({ nome: nomeDaCamada(modelo, `${peca}-${grauDe(raridade)}`) });
  }
  const saida: Equipamento3d = {
    camadas,
    arma: { modelo: modeloDaArma3d(desenho, existeArma), grau: eq?.arma ? grauDe(eq.raridadeArma, eq.formaArma) : 0 },
    secundaria: secundaria ? { modelo: modeloDaArma3d(secundaria, existeArma), grau: grauDe(eq?.raridadeSecundaria) } : null,
    corElemento: elemento ? corDoElemento(elemento) : null,
  };
  if (cache3d.size >= MAXIMO) cache3d.clear();
  cache3d.set(chave, saida);
  return saida;
}
