import arteUrl from '../assets/retratos/classes-manga.png?url';
import type { AparenciaEquipada } from '../entities/entidade';
import { grauDe, modeloDaArma3d, SEM_GIRO, TOMOS, tomoFechado } from '../render/equipamento-3d';
import { ARMA_DE_CLASSE } from '../render/modelos';
import catalogo from '../assets/retratos/armas/catalogo.json';

const CLASSES = ['aventureiro', 'guerreiro', 'mago', 'arqueiro', 'necromante'] as const;
const MAOS = [[85, 316], [77, 327], [82, 315], [98, 295], [84, 310]] as const;
const armas = import.meta.glob<string>('../assets/retratos/armas/*.webp', { query: '?url', import: 'default' });
const imagens = new Map<string, Promise<HTMLImageElement>>();
const METAIS = ['#686561', '#686e58', '#626a70', '#6c6171', '#817151', '#74575f'];
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

async function arma(ctx: CanvasRenderingContext2D, modelo: string | null, x: number, raridade: string | null | undefined, forma?: string | null): Promise<void> {
  if (!modelo) return;
  const equipado = modeloDaArma3d(modelo, nome => Object.hasOwn(catalogo, nome));
  const livro = TOMOS.has(equipado);
  const id = livro ? tomoFechado(equipado) : equipado;
  const medidas = catalogo[id as keyof typeof catalogo];
  const url = armas[`../assets/retratos/armas/${id}.webp`];
  if (!url) return;
  const imagem = imagens.get(id) ?? url().then(carregar);
  imagens.set(id, imagem);
  const img = await imagem;
  const escala = 0.81;
  const { celL, celA, pegaX, pegaY } = medidas;
  ctx.save();
  ctx.translate(MARGEM + (livro ? (x < 200 ? 138 : 257) : x), livro ? 304 : 402);
  if (livro || !SEM_GIRO.has(equipado)) ctx.rotate((x < 200 ? -1 : 1) * Math.PI / 16);
  ctx.drawImage(img, grauDe(raridade, forma) * celL, 0, celL, celA, -pegaX * escala, -pegaY * escala, celL * escala, celA * escala);
  ctx.restore();
}

function armadura(eq: AparenciaEquipada | null): string {
  if (!eq) return '';
  const couraca = grauDe(eq.corpo) < 2;
  const capuz = grauDe(eq.cabeca) < 2;
  const defs = `<defs>
    <linearGradient id="metal" x2="1" y2=".72">
      <stop stop-color="${couraca ? '#aa7d58' : '#e5dac0'}"/><stop offset=".23" stop-color="${couraca ? '#805c46' : metal(eq.corpo)}"/>
      <stop offset=".52" stop-color="${couraca ? '#544033' : '#48505a'}"/><stop offset=".64" stop-color="#272a34"/><stop offset="1" stop-color="#17171e"/>
    </linearGradient>
    <linearGradient id="elmo" x2="1" y2=".65">
      <stop stop-color="#c7c4bb"/><stop offset=".34" stop-color="${metal(eq.cabeca)}"/>
      <stop offset=".52" stop-color="#444654"/><stop offset="1" stop-color="#191923"/>
    </linearGradient>
    <linearGradient id="latao" x2=".3" y2="1"><stop stop-color="#e5c893"/><stop offset=".5" stop-color="#987342"/><stop offset="1" stop-color="#49301d"/></linearGradient>
    <pattern id="trama" width="7" height="7" patternUnits="userSpaceOnUse"><path d="M0 7 7 0M4 10 10 4" stroke="#121019" stroke-opacity=".45" stroke-width="1.15"/></pattern>
    <pattern id="marcas" width="51" height="37" patternUnits="userSpaceOnUse">
      <path d="m3 27 8-5m5-16 3-2m12 14 10-5m-13 18 4-3m14-22 2-1" fill="none" stroke="#e5cdb0" stroke-opacity=".42" stroke-width=".9"/>
      <path d="m7 25 2-1m5-12 3 1m12 11 3-1m12 10 3-1" fill="none" stroke="#201915" stroke-opacity=".8" stroke-width="1.4"/>
    </pattern>
  </defs>`;
  const torso = 'M126 155 Q149 133 167 136 L198 163 231 136 Q254 136 273 155 L259 230 Q245 258 198 272 Q158 261 141 231Z';
  const peito = eq.corpo ? `
    <path fill="#30281f" d="M118 154Q151 129 169 133L198 151 232 132Q254 134 278 155L273 218Q260 262 198 283Q139 262 126 222Z"/>
    <path fill="url(#metal)" d="${torso}"/>
    <path fill="url(#trama)" stroke="none" d="${torso}" opacity=".55"/>
    <path fill="url(#marcas)" stroke="none" d="${torso}"/>
    <path fill="url(#metal)" d="M107 159Q122 136 145 142L155 159 141 181Q118 173 104 181ZM245 158 255 143Q277 137 291 163L295 182Q274 175 260 184Z"/>
    <path fill="#513429" d="M119 192 145 198 147 209 121 204ZM125 215 151 220 154 232 128 227ZM252 199 277 191 275 204 249 212ZM246 222 272 214 269 227 243 235Z"/>
    <path fill="none" stroke="#aa8461" stroke-width="2" d="m130 194 11 2 3 13-11-2Zm7 23 10 2 3 13-11-2Zm118-19 11-3-3 13-11 3Zm-7 23 11-3-3 13-11 3Z"/>
    <path fill="#14131a" d="M146 205Q172 228 198 228Q227 222 250 201L246 217Q221 239 198 242Q165 236 150 222Z"/>
    <path fill="none" stroke="#cfc5ae" stroke-width="2" d="M145 161Q169 144 198 174L231 147M148 211Q169 229 198 233Q225 226 248 207M160 242 197 260 238 240"/>
    <path fill="url(#latao)" d="M198 176 213 195 198 216 183 195Z"/>
    <path fill="#f7dba4" stroke="none" d="M198 182 203 194 198 199 192 193Z"/>
    <path fill="#c5a771" stroke-width="1.5" d="M118 164a3 3 0 1 0 6 0a3 3 0 1 0-6 0M273 165a3 3 0 1 0 6 0a3 3 0 1 0-6 0"/>
    <path fill="none" stroke="#e1d9c8" stroke-width="1" opacity=".75" d="m151 184 14-9m-10 14 7-5m62 56 10-5m-92-76 8-5"/>` : '';
  const elmo = !eq.cabeca ? '' : capuz ? `
    <path fill="${metal(eq.cabeca)}" d="M141 116Q143 61 164 31Q183 6 204 17Q241 26 258 119L233 127 226 97Q225 55 199 39Q175 56 170 98L166 126Z"/>
    <path fill="url(#trama)" stroke="none" d="M203 18Q244 35 258 119L233 127 226 97Q225 55 199 39Z"/>
    <path fill="none" stroke="#c8b38a" stroke-width="1.5" d="M148 112Q155 59 181 34M233 65Q247 86 251 117"/>
  ` : `
    <path fill="url(#elmo)" d="M146 90 150 55Q159 24 191 17Q229 16 245 51L251 88 236 112 229 101 224 79 173 79 169 100 160 114Z"/>
    <path fill="url(#marcas)" stroke="none" d="M146 90 150 55Q159 24 191 17Q229 16 245 51L251 88 236 112 229 101 224 79 173 79 169 100 160 114Z"/>
    <path fill="url(#trama)" stroke="none" d="M220 29Q241 41 248 72L250 88 236 111 229 96 225 72Z"/>
    <path fill="url(#latao)" d="M150 69Q180 52 198 63Q218 55 248 72L248 79Q217 65 198 72Q175 63 149 79Z"/>
    <path fill="url(#elmo)" d="M194 61 202 61 204 88 198 96 192 88Z"/>
    <path fill="none" stroke="#ece0c6" stroke-width="2" d="M155 59Q163 31 189 24M155 84 162 102M235 88 240 97"/>
    <path fill="#c5a771" stroke-width="1.5" d="M157 76a3 3 0 1 0 6 0a3 3 0 1 0-6 0M234 76a3 3 0 1 0 6 0a3 3 0 1 0-6 0"/>`;
  return defs + `<g stroke="#1c161b" stroke-width="3.2" stroke-linejoin="round">${peito}${elmo}</g>`;
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
    await camada(ctx, `<defs><linearGradient id="tecido"><stop stop-color="#18121b"/><stop offset=".27" stop-color="${metal(eq.capa)}"/><stop offset=".53" stop-color="#30202e"/><stop offset=".78" stop-color="${metal(eq.capa)}"/><stop offset="1" stop-color="#18121b"/></linearGradient></defs><path fill="url(#tecido)" stroke="#251925" stroke-width="5" d="M121 140 Q197 114 276 140 Q320 340 335 703 Q193 660 63 706 Q82 377 121 140Z"/><path fill="#201620" opacity=".36" d="M199 133 218 682 290 686 246 134Z"/>`);
  }
  const larguraCelula = base.naturalWidth / CLASSES.length;
  ctx.drawImage(base, larguraCelula * indice, 0, larguraCelula, base.naturalHeight, MARGEM, 0, LARGURA, ALTURA);
  await camada(ctx, armadura(eq));
  await arma(ctx, eq ? eq.arma : padrao.arma, direita, eq?.raridadeArma, eq?.formaArma);
  await arma(ctx, eq ? eq.secundaria : padrao.secundaria, esquerda, eq?.raridadeSecundaria);
  return canvas;
}
