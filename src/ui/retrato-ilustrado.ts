import arteUrl from '../assets/retratos/classes-manga.png?url';
import type { AparenciaEquipada } from '../entities/entidade';
import { grauDe, modeloDaArma3d } from '../render/equipamento-3d';
import { ARMA_DE_CLASSE } from '../render/modelos';
import { armaDeClasse34 } from '../render/modelos/armas-classe';
import { arma34, type Arma } from '../render/modelos/bipede';

const CLASSES = ['aventureiro', 'guerreiro', 'mago', 'arqueiro', 'necromante'] as const;
const MAOS = [[85, 316], [77, 327], [82, 315], [98, 295], [84, 310]] as const;
const ARMAS_BASE: ReadonlySet<string> = new Set<Arma>(['espada', 'adaga', 'machado', 'clava', 'cajado', 'foice', 'arco', 'lanca']);
const METAIS = ['#7b8790', '#77916c', '#6b93ac', '#9e82b5', '#c2a269', '#c67d88'];
const MARGEM = 75;
const LARGURA = 397;
const ALTURA = 793;

let arte: Promise<HTMLImageElement> | undefined;
function carregar(url: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.src = url;
  return img.decode().then(() => img);
}

function metal(raridade: string | null | undefined, forma?: string | null): string {
  return METAIS[grauDe(raridade, forma)] ?? '#7b8790';
}

function arma(modelo: string | null, x: number, raridade: string | null | undefined, forma?: string | null): string {
  if (!modelo) return '';
  const cor = metal(raridade, forma);
  if (modelo === 'escudo') {
    return `<g transform="translate(${x} 383)" stroke="#171219" stroke-width="5">
      <path fill="#343039" d="M-48-50 Q0-68 48-50 L45 10 Q38 47 0 70 Q-38 47-45 10Z"/>
      <path fill="${cor}" d="M-38-42 Q0-55 38-42 L34 10 Q26 41 0 58 Q-26 41-34 10Z"/>
      <path fill="#dbc6a0" d="M0-28 17 1 0 30-17 1Z"/>
    </g>`;
  }
  const id = modeloDaArma3d(modelo, nome => ARMAS_BASE.has(nome) || armaDeClasse34(nome, 0, 0) !== null);
  const desenho = id === 'espada' ? `
    <path fill="#b8c3ca" stroke="#211a1a" stroke-width=".5" d="M-1.5-2-1.5-15 0-19 1.5-15 1.5-2Z"/>
    <path fill="#edf0e8" d="M0-18.5 1.15-15 1.15-2.3H0Z"/>
    <path fill="#775233" stroke="#211a1a" stroke-width=".45" d="M-1 .5H1V4.2Q0 5.4-1 4.2Z"/>
    <path fill="#bd9358" stroke="#211a1a" stroke-width=".5" d="M-3.5-.8Q0 .1 3.5-.8L3.3 1Q0 2-3.3 1Z"/>`
    : ARMAS_BASE.has(id) ? arma34(id as Arma, 0, 0) : armaDeClasse34(id, 0, 0);
  return `<g transform="translate(${x} 402) rotate(${x < 200 ? -14 : 14}) scale(9)">
    ${desenho ?? ''}<circle cx="0" cy="0" r="1.1" fill="${cor}" stroke="#171219" stroke-width=".5"/>
  </g>`;
}

function armadura(eq: AparenciaEquipada | null): string {
  if (!eq) return '';
  const peito = eq.corpo ? `
    <path fill="${metal(eq.corpo)}" d="M117 144 159 127 198 175 239 128 282 143 301 180 267 194 261 253 200 278 139 251 132 194 100 180Z"/>
    <path fill="#302a35" opacity=".55" d="M200 175 239 128 282 143 301 180 267 194 261 253 200 278Z"/>
    <path fill="none" stroke="#e2d6bb" stroke-width="2" d="M125 155 151 140 198 192 245 143 275 155 M144 242 200 264 254 243"/>
    <path fill="#c9ad76" d="M198 193 211 211 198 229 185 211Z"/>` : '';
  const elmo = eq.cabeca ? `
    <path fill="${metal(eq.cabeca)}" d="M148 96 150 57 Q160 18 198 16 Q238 18 250 57 L252 99 231 113 225 79 173 79 165 113Z"/>
    <path fill="#37313a" d="M198 20 Q238 23 246 58 L247 92 234 102 225 79 198 68Z"/>
    <path fill="#dac4a0" d="M198 19 211 50 198 70 185 50Z"/>` : '';
  return `<g stroke="#1c161b" stroke-width="4" stroke-linejoin="round">${peito}${elmo}</g>`;
}

async function camada(ctx: CanvasRenderingContext2D, svg: string): Promise<void> {
  if (!svg) return;
  const url = URL.createObjectURL(new Blob([
    `<svg xmlns="http://www.w3.org/2000/svg" width="${LARGURA + MARGEM * 2}" height="${ALTURA}" viewBox="${-MARGEM} 0 ${LARGURA + MARGEM * 2} ${ALTURA}">${svg}</svg>`,
  ], { type: 'image/svg+xml' }));
  try {
    ctx.drawImage(await carregar(url), 0, 0);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Ilustração de menu em resolução própria, composta com o mesmo equipamento visual do jogo. */
export async function retratoIlustrado(modelo: string, eq: AparenciaEquipada | null): Promise<HTMLCanvasElement> {
  const indice = Math.max(0, CLASSES.findIndex(classe => classe === modelo));
  const classe = CLASSES[indice] ?? 'aventureiro';
  const [direita, esquerda] = MAOS[indice] ?? MAOS[0];
  const padrao = ARMA_DE_CLASSE[classe];
  const canvas = document.createElement('canvas');
  canvas.width = LARGURA + MARGEM * 2;
  canvas.height = ALTURA;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas indisponível');
  arte ??= carregar(arteUrl);
  const base = await arte;
  if (eq?.capa) {
    await camada(ctx, `<path fill="${metal(eq.capa)}" stroke="#251925" stroke-width="5" d="M121 140 Q197 114 276 140 Q320 340 335 703 Q193 660 63 706 Q82 377 121 140Z"/><path fill="#201620" opacity=".36" d="M199 133 218 682 290 686 246 134Z"/>`);
  }
  const larguraCelula = base.naturalWidth / CLASSES.length;
  ctx.drawImage(base, larguraCelula * indice, 0, larguraCelula, base.naturalHeight, MARGEM, 0, LARGURA, ALTURA);
  await camada(ctx, armadura(eq) +
    arma(eq ? eq.arma : padrao.arma, direita, eq?.raridadeArma, eq?.formaArma) +
    arma(eq ? eq.secundaria : padrao.secundaria, esquerda, eq?.raridadeSecundaria));
  return canvas;
}
