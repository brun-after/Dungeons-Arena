import arteUrl from '../assets/retratos/classes-manga.png?url';
import type { AparenciaEquipada } from '../entities/entidade';
import { grauDe, modeloDaArma3d, SEM_GIRO, TOMOS, tomoFechado } from '../render/equipamento-3d';
import { ARMA_DE_CLASSE } from '../render/modelos';
import catalogo from '../assets/retratos/armas/catalogo.json';
import { equipamento3d } from '../render/adornos';
import { existeArma3d } from '../render/personagens-3d';

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
  const { celL, celA, pegaX, pegaY } = medidas;
  const escala = equipado === 'escudo' ? 1.13 : equipado === 'espada' ? 1.05 : livro ? 91 / celA : 0.81;
  ctx.save();
  ctx.translate(MARGEM + (livro ? (x < 200 ? 130 : 265) : x), livro ? 302 : 402);
  if (equipado === 'espada') ctx.rotate((x < 200 ? 1 : -1) * Math.PI * 0.72);
  else if (livro || !SEM_GIRO.has(equipado)) ctx.rotate((x < 200 ? -1 : 1) * Math.PI / 16);
  ctx.drawImage(img, grauDe(raridade, forma) * celL, 0, celL, celA, -pegaX * escala, -pegaY * escala, celL * escala, celA * escala);
  ctx.restore();
}

function armadura(eq: AparenciaEquipada | null, classe: (typeof CLASSES)[number]): string {
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
    <linearGradient id="viseira" x2="1" y2=".38"><stop stop-color="#1d2025"/><stop offset=".26" stop-color="#7d7b76"/><stop offset=".49" stop-color="#d7cfc0"/><stop offset=".51" stop-color="#66636a"/><stop offset=".79" stop-color="#42434b"/><stop offset="1" stop-color="#202027"/></linearGradient>
    <linearGradient id="capuz" x2="1" y2=".6"><stop stop-color="#303323"/><stop offset=".23" stop-color="#7b7954"/><stop offset=".44" stop-color="#555b3d"/><stop offset=".67" stop-color="#393e2a"/><stop offset="1" stop-color="#25291e"/></linearGradient>
    <mask id="abertura-capuz" maskUnits="userSpaceOnUse" x="130" y="0" width="140" height="155">
      <path fill="white" d="M130 0h140v155H130Z"/><path fill="black" d="M169 105Q165 85 176 64Q185 48 196 44Q213 54 221 74Q230 94 225 109Q213 130 198 132Q181 127 169 105Z"/>
    </mask>
    <pattern id="trama" width="7" height="7" patternUnits="userSpaceOnUse"><path d="M0 7 7 0M4 10 10 4" stroke="#121019" stroke-opacity=".45" stroke-width="1.15"/></pattern>
    <pattern id="marcas" width="51" height="37" patternUnits="userSpaceOnUse">
      <path d="m3 27 8-5m5-16 3-2m12 14 10-5m-13 18 4-3m14-22 2-1" fill="none" stroke="#e5cdb0" stroke-opacity=".42" stroke-width=".9"/>
      <path d="m7 25 2-1m5-12 3 1m12 11 3-1m12 10 3-1" fill="none" stroke="#201915" stroke-opacity=".8" stroke-width="1.4"/>
    </pattern>
  </defs>`;
  const torso = 'M126 155 Q149 133 167 136 L198 163 231 136 Q254 136 273 155 L259 230 Q245 258 198 272 Q158 261 141 231Z';
  const peito = !eq.corpo ? '' : couraca ? `
    <path fill="#362820" d="M126 150 157 136 177 149 198 174 218 150 242 138 268 151 253 194 260 259 237 281 198 268 161 281 139 261 144 195Z"/>
    <path fill="url(#metal)" d="M138 151 155 145 176 160 194 190 194 262 162 273 147 254 151 192ZM258 151 240 146 221 161 202 190 202 263 235 273 251 255 245 192Z"/>
    <path fill="none" stroke="#ba946a" stroke-width="1.7" d="M143 153 154 150 171 163 188 192v66l-26 9-9-14m101-100-13-2-16 14-17 28v65l26 9 11-14"/>
    <path fill="#735036" d="M180 197h37v9h-37Zm0 21h37v9h-37Zm0 22h37v9h-37Z"/>
    <path fill="url(#latao)" d="M193 195h11v13h-11Zm0 21h11v13h-11Zm0 22h11v13h-11Z"/>
  ` : `
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
    <path fill="none" stroke="#e1d9c8" stroke-width="1" opacity=".75" d="m151 184 14-9m-10 14 7-5m62 56 10-5m-92-76 8-5"/>
    ${grauDe(eq.corpo) >= 4 ? '<path fill="url(#metal)" d="M107 163 119 135 139 130 157 145 151 163 126 179 103 178ZM243 145l17-15 21 6 13 29 4 14-25 1-24-18Z"/><path fill="none" stroke="#c9ad7d" stroke-width="2" d="m109 169 15-7 24-15m102 0 25 15 16 8"/>' : ''}`;
  const elmo = !eq.cabeca ? '' : classe === 'arqueiro' && capuz ? `
    <g mask="url(#abertura-capuz)">
    <path fill="#292c20" d="M135 135 145 101Q141 69 160 39Q174 15 195 10Q221 15 239 39Q255 62 251 96L263 129 238 148 196 147 159 150Z"/>
    <path fill="url(#capuz)" d="M136 134 152 105Q148 70 165 41Q177 21 196 15Q217 21 232 41Q247 67 245 100L261 130 237 142 196 145 160 145Z"/>
    <path fill="#25271b" d="M153 109Q150 73 170 45Q185 26 196 25Q216 32 231 52Q242 74 239 106L228 124Q226 99 219 79Q209 52 195 45Q175 55 166 85L165 119Z"/>
    <path fill="#373a28" d="M140 133 159 114Q176 134 196 133Q221 134 242 111L260 130 237 142 196 145 158 144Z"/>
    <path fill="none" stroke="#a29b6f" stroke-width="1.7" d="M152 101Q153 57 182 26M240 102Q239 62 212 33M148 134q21-5 35 3m53-7 12-8"/>
    <path fill="url(#trama)" stroke="none" d="M140 133 159 114Q176 134 196 133Q221 134 242 111L260 130 237 142 196 145 158 144Z"/>
    <circle cx="225" cy="135" r="5" fill="url(#latao)"/>
    </g>
  ` : capuz ? `
    <path fill="${metal(eq.cabeca)}" d="M141 116Q143 61 164 31Q183 6 204 17Q241 26 258 119L233 127 226 97Q225 55 199 39Q175 56 170 98L166 126Z"/>
    <path fill="url(#trama)" stroke="none" d="M203 18Q244 35 258 119L233 127 226 97Q225 55 199 39Z"/>
    <path fill="none" stroke="#c8b38a" stroke-width="1.5" d="M148 112Q155 59 181 34M233 65Q247 86 251 117"/>
  ` : classe === 'aventureiro' ? `
    <path fill="#30251f" d="M164 61 171 82 177 102 172 108 163 94 157 68ZM236 61 229 82 223 102 228 108 237 94 243 68Z"/>
    <path fill="url(#elmo)" d="M163 60 165 43Q175 20 195 18Q218 20 232 44L234 60 223 65 176 65Z"/>
    <path fill="url(#viseira)" d="M153 60 169 54Q197 50 230 54L245 61 242 68 228 70Q196 66 171 70L156 68Z"/>
    <path fill="none" stroke="#c7b393" stroke-width="1.6" d="M168 49Q177 27 193 24M197 21l1 30m-39 13q30-9 62-5"/>
    <path fill="#a5906d" stroke-width="1" d="M171 60a2 2 0 1 0 4 0a2 2 0 1 0-4 0m52 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0"/>
  ` : classe === 'necromante' ? `
    <path fill="#251d2a" d="M158 85 154 61 158 46 152 25 171 42 184 27 198 23 213 27 226 42 245 25 239 46 243 61 237 86 224 99 216 120 199 133 181 119 173 99Z"/>
    <path fill="url(#elmo)" d="M163 67 173 48 190 39 198 29 207 39 226 48 234 68 229 85 218 91 214 111 199 125 183 111 179 91 168 85Z"/>
    <path fill="#151119" d="m165 68 12-4 16 10-9 12-14-6zm67 0-12-4-16 10 9 12 14-6zm-34 11 7 16-7-3-6 3z"/>
    <path fill="none" stroke="#ae9cac" stroke-width="1.7" d="m163 62 11-13 16-7m43 20-10-13-16-7m-26 53 6 16 12 10 12-11 4-15m-24 4 3 15m6-17v20m6-19-2 16"/>
  ` : classe === 'mago' ? `
    <path fill="url(#elmo)" d="M148 87 147 62Q146 31 166 18Q180 6 199 5Q219 7 234 22Q249 38 249 66L247 88Z"/>
    <path fill="#262a36" d="M148 87 151 48 164 29 177 40 195 17 209 39 229 27 244 49 247 88 237 112 210 137 198 132 185 137 159 112Z"/>
    <path fill="url(#elmo)" d="M152 65 165 42 178 51 195 31 211 51 228 42 243 65 238 83 217 76 198 86 178 76 157 83Z"/>
    <path fill="url(#viseira)" d="M157 91 178 85 198 96 217 85 239 91 233 108 210 129 198 121 185 129 163 108Z"/>
    <path fill="#171825" d="m165 88 13-4 16 8 4 21 4-21 15-8 14 4-10 10-13 3-10 20-10-20-13-3z"/>
    <path fill="#756398" d="m195 47 8 12-8 12-8-12z"/>
    <path fill="none" stroke="#a396af" stroke-width="1.6" d="m156 65 10-15 11 9 19-20 16 20 15-8 11 14m-75 38 23 21m45-21-21 21"/>
  ` : classe === 'guerreiro' ? `
    <path fill="#211b22" d="M149 70 148 54Q151 22 191 11Q219 11 242 37L249 63 250 99 238 126 209 144 184 142 159 122 150 98Z"/>
    <path fill="url(#elmo)" d="M151 64 155 42Q166 18 195 10Q226 15 240 39L247 66 222 58 199 53 176 57Z"/>
    <path fill="url(#trama)" stroke="none" d="M204 16q23 7 36 24l7 26-25-8-23-5z"/>
    <path fill="url(#viseira)" d="M151 67 173 57 198 51 222 57 247 67 244 82 224 76 198 72 172 76 154 83Z"/>
    <path fill="url(#viseira)" d="M154 86 174 80 198 78 222 80 244 86 240 107 227 124 200 142 175 126 160 108Z"/>
    <path fill="none" stroke="#b3a594" stroke-width="1.6" d="M158 56q8-29 35-37m-36 51 18-8 23-6 24 6 20 8m-82 22 18-7 20-3 22 3 19 7m-39-8v52m-32-26 9 11 20 16"/>
    <path fill="none" stroke="#19171b" stroke-width="2.6" d="m171 92 2 9m5-11 2 10m5-12 2 11m25-11-2 11m8-9-2 10m8-8-2 9"/>
    <path fill="none" stroke="#d6c7af" stroke-width="1" d="m162 46 7-7m7-7 6-3m-13 88 7 5m47-7 8-6m-16-9 5-3"/>
    <path fill="url(#latao)" stroke-width="1.3" d="M154 77a4 4 0 1 0 8 0a4 4 0 1 0-8 0m81 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0"/>
  ` : `
    <path fill="url(#elmo)" d="M146 90 150 55Q159 24 191 17Q229 16 245 51L251 88 236 112 229 101 224 79 173 79 169 100 160 114Z"/>
    <path fill="url(#marcas)" stroke="none" d="M146 90 150 55Q159 24 191 17Q229 16 245 51L251 88 236 112 229 101 224 79 173 79 169 100 160 114Z"/>
    <path fill="url(#trama)" stroke="none" d="M220 29Q241 41 248 72L250 88 236 111 229 96 225 72Z"/>
    <path fill="url(#latao)" d="M150 69Q180 52 198 63Q218 55 248 72L248 79Q217 65 198 72Q175 63 149 79Z"/>
    <path fill="url(#elmo)" d="M194 61 202 61 204 88 198 96 192 88Z"/>
    <path fill="none" stroke="#ece0c6" stroke-width="2" d="M155 59Q163 31 189 24M155 84 162 102M235 88 240 97"/>
    <path fill="#c5a771" stroke-width="1.5" d="M157 76a3 3 0 1 0 6 0a3 3 0 1 0-6 0M234 76a3 3 0 1 0 6 0a3 3 0 1 0-6 0"/>`;
  const ajuste = !capuz && classe === 'mago' ? 'translate(22 7) scale(.89 .9)'
    : !capuz && classe === 'guerreiro' ? 'translate(18 5) scale(.91 .91)' : '';
  return defs + `<g stroke="#1c161b" stroke-width="3.2" stroke-linejoin="round">${peito}<g transform="${ajuste}">${elmo}</g></g>`;
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

function membros(eq: AparenciaEquipada | null, direita: number, esquerda: number): string {
  if (!eq) return '';
  const peca = (raridade: string, path: string, reforco: string) => {
    const grau = grauDe(raridade);
    const material = grau < 2 ? 'couro-membro' : grau < 4 ? 'aco-membro' : 'escuro-membro';
    return `<path fill="url(#${material})" stroke="#211a1c" stroke-width="3" d="${path}"/>
      <path fill="none" stroke="${grau < 4 ? '#a79273' : '#b99b67'}" stroke-width="2.5" d="${reforco}"/>`;
  };
  const luvas = eq.maos ? [direita, esquerda].map((x, i) =>
    `<g transform="translate(${x} 371) scale(${i === 0 ? 1 : -1} 1)">${peca(eq.maos ?? '', 'M-13-12 12-16 16 9 13 31 4 35-6 31-11 14Z', 'm-11-4 24-4m-21 13 21-4m-14 20 10-2')}</g>`,
  ).join('') : '';
  const calcas = eq.pernas ? peca(eq.pernas,
    'M132 439 184 454 176 541 163 580 127 570 132 523ZM213 454 266 439 268 521 273 572 237 582 222 541Z',
    'm137 461 41 11m-43 16 39 8m-42 42 36 9m51-74 41-12m-37 36 38-9m-30 61 37-9') : '';
  const botas = eq.pes ? peca(eq.pes,
    'M120 629Q137 637 153 629L152 652 147 695 148 722 135 728 115 720 117 683 120 652ZM244 630Q262 637 278 629L279 652 283 690 283 722 270 728 249 721 248 685 245 652Z',
    'M121 644q13 7 30 0m-33 19q13 7 30 0m-31 19q12 8 30 1m99-40q14 7 31-1m-30 21q15 7 32 0m-30 20q15 7 31-1') : '';
  return `<defs>
    <linearGradient id="couro-membro"><stop stop-color="#352821"/><stop offset=".42" stop-color="#79563b"/><stop offset="1" stop-color="#38271e"/></linearGradient>
    <linearGradient id="aco-membro"><stop stop-color="#35343b"/><stop offset=".38" stop-color="#737982"/><stop offset="1" stop-color="#2b2d36"/></linearGradient>
    <linearGradient id="escuro-membro"><stop stop-color="#1e1a20"/><stop offset=".45" stop-color="#514855"/><stop offset="1" stop-color="#211d27"/></linearGradient>
  </defs>` + calcas + botas + luvas;
}

// 04/11/2026 (marco 37): o retrato dos menus é o personagem 3D do jogo (palco-vivo.ts), com as peças no detalhe
// cheio, em perspectiva e na resolução da tela. Um palco só para os retratos, criado na primeira vez; a ilustração
// antiga (desenho com as camadas em SVG) fica como reserva quando não há WebGL ou o modelo falha.
let palcoDosRetratos: Promise<import('../render/vivos/palco-vivo').PalcoVivo | null> | undefined;
function palco(): Promise<import('../render/vivos/palco-vivo').PalcoVivo | null> {
  palcoDosRetratos ??= import('../render/vivos/palco-vivo').then((m) => new m.PalcoVivo(1, 1)).catch(() => null);
  return palcoDosRetratos;
}

async function retrato3d(modelo: string, eq: AparenciaEquipada | null): Promise<HTMLCanvasElement | null> {
  const p = await palco();
  if (!p?.suporta(modelo)) return null;
  const { pedidoVivo } = await import('../render/vivos/palco-vivo');
  const pedido = pedidoVivo(`retrato:${modelo}`, modelo, eq, equipamento3d(modelo, eq, existeArma3d), 'parado', 0, 0, Math.PI / 2);
  const escala = Math.min(2, Math.max(1, globalThis.devicePixelRatio || 1));
  const canvas = await p.retrato(pedido, Math.round((LARGURA + MARGEM * 2) * escala), Math.round(ALTURA * escala));
  return canvas;
}

/** O retrato de menu: o modelo 3D do jogo; sem ele, a ilustração composta com o mesmo equipamento visual. */
export async function retratoIlustrado(modelo: string, eq: AparenciaEquipada | null): Promise<HTMLCanvasElement> {
  return (await retrato3d(modelo, eq).catch(() => null)) ?? retratoDesenhado(modelo, eq);
}

/** Ilustração de menu em resolução própria, composta com o mesmo equipamento visual do jogo. */
async function retratoDesenhado(modelo: string, eq: AparenciaEquipada | null): Promise<HTMLCanvasElement> {
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
  await camada(ctx, membros(eq, direita, esquerda));
  await camada(ctx, armadura(eq, classe));
  await arma(ctx, eq ? eq.arma : padrao.arma, direita, eq?.raridadeArma, eq?.formaArma);
  await arma(ctx, eq ? eq.secundaria : padrao.secundaria, esquerda, eq?.raridadeSecundaria);
  return canvas;
}
