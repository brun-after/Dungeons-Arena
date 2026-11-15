// D-175 (15/11/2026): os sigilos — os ícones das skills comuns e das ultimates, num estilo próprio, de magia arcana
// (os outros ícones do jogo seguem o traço simples de data/icones.ts). Caixa 48×48, colorido:
// - a skill comum é um selo: o anel duplo com as marcas dos quatro cantos, o glifo do núcleo no centro (o que a skill
//   faz) e a runa do elemento no medalhão (de que ela é feita). Cada par núcleo × elemento é um sigilo único;
// - a ultimate é um selo maior: a estrela de oito pontas dentro do anel, com o glifo da família, em ouro.
// Os ids são `sig_<nucleo>_<elemento>` e `sig_ult_<familia>`. Dado puro (sem DOM): a interface monta o SVG.

const NUCLEOS: Readonly<Record<string, string>> = {
  projetil: '<path d="M15 33 33 15"/><path d="M25 15h8v8"/><path d="M17 25l6 6"/>',
  explosao: '<circle cx="24" cy="24" r="2.6"/><path d="M24 13v6M24 29v6M13 24h6M29 24h6M16.5 16.5l4 4M27.5 27.5l4 4M31.5 16.5l-4 4M16.5 31.5l4-4"/>',
  feixe: '<path d="M14 34 34 14"/><path d="M14 27 27 14"/><path d="M21 34 34 21"/><circle cx="34" cy="14" r="1.6"/>',
  cadeia: '<path d="m24 12 4 4-4 4-4-4Z"/><path d="m16 25 4 4-4 4-4-4Z"/><path d="m32 25 4 4-4 4-4-4Z"/><path d="m21.5 19-3 3.5M26.5 19l3 3.5M20 29h8"/>',
  campo: '<path d="m14 20 10-5 10 5-10 5Z"/><path d="m14 26 10 5 10-5"/><path d="m14 31 10 5 10-5"/>',
  nova: '<circle cx="24" cy="24" r="3.4"/><path d="M24 13a11 11 0 0 1 11 11"/><path d="M24 35a11 11 0 0 1-11-11"/><path d="M15 15l3 3M33 33l-3-3"/>',
  investida: '<path d="m13 15 8 9-8 9"/><path d="m21 15 8 9-8 9"/><path d="m29 15 6 9-6 9"/>',
  recuo: '<path d="M33 31a10 10 0 1 0-17 2"/><path d="M15 26v8h8"/><circle cx="25" cy="24" r="1.6"/>',
  maldicao: '<path d="M13 21c4-6 18-6 22 0-4 6-18 6-22 0Z"/><circle cx="24" cy="21" r="2.4"/><path d="M24 28v7M21 32l3 3 3-3"/>',
  prisao: '<path d="M17 14v20M24 13v22M31 14v20"/><path d="M14 19h20M14 29h20"/>',
  muro: '<path d="M13 17h22v14H13Z"/><path d="M13 24h22M20 17v7M28 17v7M24 24v7"/>',
  escudo: '<path d="m24 12 10 4v7c0 6-4 10-10 13-6-3-10-7-10-13v-7Z"/><path d="M24 18v12M19 23h10"/>',
  cura: '<path d="M24 14v20M14 24h20"/><path d="M18 18a8.5 8.5 0 0 1 12 0"/><path d="M30 30a8.5 8.5 0 0 1-12 0"/>',
  dreno: '<path d="M24 24a3 3 0 1 1 3 3 6 6 0 1 1-6-6 9 9 0 1 1 9 9"/><path d="M24 12v4"/>',
  invocar: '<path d="m24 12 11 8-4 13H17l-4-13Z"/><path d="M24 18v8"/><circle cx="24" cy="29" r="1.6"/>',
  armadilha: '<path d="m13 29 4-8 4 6 3-9 3 9 4-6 4 8Z"/><path d="M13 33h22"/>',
  marca: '<path d="m24 12 12 12-12 12-12-12Z"/><path d="M24 18v12M18 24h12"/>',
  grito: '<path d="M14 20v8l7 5V15Z"/><path d="M25 19a6 6 0 0 1 0 10"/><path d="M29 15a11 11 0 0 1 0 18"/>',
  chuva: '<path d="m16 13-3 9M24 13l-3 9M32 13l-3 9"/><path d="m20 25-3 9M28 25l-3 9M36 25l-3 9"/>',
  postura: '<circle cx="24" cy="15" r="3"/><path d="M24 18v9"/><path d="m15 23 9-2 9 2"/><path d="m24 27-6 8M24 27l6 8"/>',
};

/** A runa de cada elemento, numa caixa de 12×12 centrada na origem (vai no medalhão). */
const ELEMENTOS: Readonly<Record<string, { cor: string; runa: string }>> = {
  fogo: { cor: '#ff7b39', runa: '<path d="M0-5c3 3 4 5 3 8a3.4 3.4 0 0 1-6 0c-1-2 0-3 1-4 0 1 1 2 2 1 0-2-1-3 0-5Z"/>' },
  gelo: { cor: '#9fd8ff', runa: '<path d="M0-5v10M-4.3-2.5 4.3 2.5M-4.3 2.5 4.3-2.5"/>' },
  raio: { cor: '#f7dc6f', runa: '<path d="M1-5-3 1h3l-1 4 4-6H1Z"/>' },
  veneno: { cor: '#8fd14f', runa: '<path d="M0-5c2 3 3.5 4.5 3.5 6.5a3.5 3.5 0 0 1-7 0C-3.5-.5-2-2 0-5Z"/>' },
  terra: { cor: '#c39a63', runa: '<path d="M-5 4 0-4l5 8Z"/><path d="M-2 4 0 1l2 3"/>' },
  trevas: { cor: '#a77be0', runa: '<path d="M2-5a5 5 0 1 0 3 8A4 4 0 0 1 2-5Z"/>' },
  sagrado: { cor: '#ffe9a0', runa: '<path d="M0-5 1.3-1.3 5 0 1.3 1.3 0 5-1.3 1.3-5 0-1.3-1.3Z"/>' },
  psiquico: { cor: '#e88be6', runa: '<path d="M-5 0c2-3 8-3 10 0-2 3-8 3-10 0Z"/><circle cx="0" cy="0" r="1"/>' },
  fisico: { cor: '#d8dde4', runa: '<path d="M-4-4 4 4M4-4-4 4"/>' },
};

const ULTIMATES: Readonly<Record<string, string>> = {
  ult_aniquilacao: '<circle cx="20.5" cy="24" r="5.5"/><circle cx="27.5" cy="24" r="5.5"/><path d="M24 13v4M24 31v4M12 24h3M33 24h3"/>',
  ult_execucao_presa: '<path d="M24 12v19"/><path d="m20 27 4 7 4-7"/><path d="M16 21a8 8 0 0 1 16 0"/><path d="M16 21v3M32 21v3"/>',
  ult_sangria: '<path d="M24 12c3 4 5 6 5 9a5 5 0 0 1-10 0c0-3 2-5 5-9Z"/><path d="M17 27c1.6 2 2.6 3 2.6 4.6a2.6 2.6 0 0 1-5.2 0c0-1.6 1-2.6 2.6-4.6ZM31 27c1.6 2 2.6 3 2.6 4.6a2.6 2.6 0 0 1-5.2 0c0-1.6 1-2.6 2.6-4.6Z"/>',
  ult_contragolpe: '<path d="m24 13 9 3v6c0 5-3.5 9-9 12-5.5-3-9-7-9-12v-6Z"/><path d="M28 21h-7l3-3M20 26h7l-3 3"/>',
  ult_cometa: '<circle cx="28" cy="28" r="5"/><path d="M24 24 13 13M21 28l-8-4M28 21l-4-8"/>',
  ult_exercito_em_furia: '<path d="M16 35V15l6 3-6 3M24 35V12l6 3-6 3M32 35V15l-6 3 6 3"/>',
  ult_carcere: '<path d="M15 34V21a9 9 0 0 1 18 0v13"/><path d="M21 34V16M27 34V16M15 27h18"/>',
  ult_santuario: '<path d="M13 32a11 11 0 0 1 22 0Z"/><path d="M24 15v9M20 19h8"/><path d="M13 35h22"/>',
  ult_fortaleza: '<path d="M14 35V17h4v3h4v-3h4v3h4v-3h4v18Z"/><path d="M22 35v-6a2 2 0 0 1 4 0v6"/>',
  ult_armadilha_viva: '<path d="m13 30 5-10 4 7 4-7 4 7 5-10"/><path d="M13 34h22"/><path d="m31 14 4 3-4 3"/>',
  ult_carcereiros: '<path d="M18 13v13a4 4 0 0 0 8 0v-2"/><path d="M30 13v13a4 4 0 0 1-8 0"/><path d="M15 13h6M27 13h6"/>',
  ult_renascer: '<path d="M24 34V15"/><path d="m19 20 5-6 5 6"/><path d="M24 26c-5-1-9-4-11-8 5 0 9 2 11 6M24 26c5-1 9-4 11-8-5 0-9 2-11 6"/>',
  ult_bastiao: '<path d="M15 20a13 13 0 0 1 18 0"/><path d="M13 26a16 16 0 0 1 22 0"/><path d="M17 33a10 10 0 0 1 14 0"/>',
  ult_peregrino: '<circle cx="15" cy="32" r="1.6"/><circle cx="20" cy="26" r="1.6"/><circle cx="26" cy="22" r="1.6"/><path d="m28 16 6-3-1 7"/><path d="M34 13 29 19"/>',
  ult_guardioes: '<circle cx="24" cy="14" r="3"/><circle cx="15" cy="30" r="3"/><circle cx="33" cy="30" r="3"/><path d="M24 17v5M17.5 28l4-3M30.5 28l-4-3"/><circle cx="24" cy="24.5" r="2"/>',
  ult_inabalavel: '<path d="m12 34 12-21 12 21Z"/><path d="M18 28c2-3 10-3 12 0-2 3-10 3-12 0Z"/><circle cx="24" cy="28" r="1.2"/>',
  ult_avanco_blindado: '<path d="m14 13 12 11-12 11"/><path d="m22 13 12 11-12 11"/><path d="M12 24h8"/>',
  ult_muralha_viva: '<path d="m15 15 4 2v7c0 3-1.6 5-4 6-2.4-1-4-3-4-6v-7ZM24 18l4 2v7c0 3-1.6 5-4 6-2.4-1-4-3-4-6v-7ZM33 15l4 2v7c0 3-1.6 5-4 6-2.4-1-4-3-4-6v-7Z"/>',
  ult_tempestade_de_passos: '<path d="m13 33 7-9-5-2 9-9"/><path d="m22 34 6-8-4-2 8-8"/><circle cx="34" cy="14" r="1.6"/>',
  ult_matilha: '<path d="M14 13c3 7 3 14 0 21M24 12c4 8 4 16 0 24M34 13c3 7 3 14 0 21"/>',
  ult_legiao: '<circle cx="24" cy="14" r="2"/><circle cx="19" cy="21" r="2"/><circle cx="29" cy="21" r="2"/><circle cx="14" cy="28" r="2"/><circle cx="24" cy="28" r="2"/><circle cx="34" cy="28" r="2"/><path d="M12 34h24"/>',
};

const TINTA = '#f6f0e0';
const OURO = '#e8c06a';

export const PREFIXO_SIGILO = 'sig_';
export const idDoSigilo = (nucleo: string, elemento: string | null | undefined): string => `${PREFIXO_SIGILO}${nucleo}_${elemento ?? 'fisico'}`;
export const idDoSigiloDaUltimate = (familia: string): string => `${PREFIXO_SIGILO}${familia}`;

/** As partes de um id de sigilo (null: não é sigilo válido). */
function partes(id: string): { ultimate: string } | { nucleo: string; elemento: string } | null {
  if (!id.startsWith(PREFIXO_SIGILO)) return null;
  const resto = id.slice(PREFIXO_SIGILO.length);
  if (resto in ULTIMATES) return { ultimate: resto };
  const corte = resto.lastIndexOf('_');
  const nucleo = resto.slice(0, corte);
  const elemento = resto.slice(corte + 1);
  return corte > 0 && nucleo in NUCLEOS && elemento in ELEMENTOS ? { nucleo, elemento } : null;
}

export function ehSigilo(v: unknown): v is string {
  return typeof v === 'string' && partes(v) !== null;
}

/** Todos os sigilos possíveis (para os testes e para a galeria). */
export const IDS_SIGILO: readonly string[] = [
  ...Object.keys(NUCLEOS).flatMap((n) => Object.keys(ELEMENTOS).map((e) => idDoSigilo(n, e))),
  ...Object.keys(ULTIMATES).map(idDoSigiloDaUltimate),
];

const TRACO = 'fill="none" stroke-linecap="round" stroke-linejoin="round"';

/** O miolo do sigilo (dentro de `<svg viewBox="0 0 48 48">`); id inválido devolve vazio. */
export function mioloDoSigilo(id: string): string {
  const p = partes(id);
  if (!p) return '';
  if ('ultimate' in p) {
    return [
      `<circle cx="24" cy="24" r="22" fill="${OURO}" fill-opacity=".1" stroke="${OURO}" stroke-width="1.4"/>`,
      `<g ${TRACO} stroke="${OURO}" stroke-width="1" stroke-opacity=".75"><path d="M24 3 45 24 24 45 3 24Z"/><path d="M9 9h30v30H9Z"/></g>`,
      `<circle cx="24" cy="24" r="14.5" fill="#15110c" fill-opacity=".78" stroke="${OURO}" stroke-width="1"/>`,
      `<g ${TRACO} stroke="${TINTA}" stroke-width="1.9">${ULTIMATES[p.ultimate] ?? ''}</g>`,
    ].join('');
  }
  const el = ELEMENTOS[p.elemento];
  if (!el) return '';
  return [
    `<circle cx="24" cy="24" r="21.5" fill="${el.cor}" fill-opacity=".12" stroke="${el.cor}" stroke-width="1.5"/>`,
    `<circle cx="24" cy="24" r="17.5" fill="none" stroke="${el.cor}" stroke-width=".9" stroke-opacity=".7" stroke-dasharray="2.2 2.6"/>`,
    `<g ${TRACO} stroke="${el.cor}" stroke-width="1.3"><path d="M24 1v4M24 43v4M1 24h4M43 24h4"/></g>`,
    `<g ${TRACO} stroke="${TINTA}" stroke-width="2">${NUCLEOS[p.nucleo] ?? ''}</g>`,
    `<circle cx="38" cy="38" r="8" fill="#15110c" stroke="${el.cor}" stroke-width="1.4"/>`,
    `<g transform="translate(38 38)" ${TRACO} stroke="${el.cor}" stroke-width="1.5">${el.runa}</g>`,
  ].join('');
}

/** O SVG completo do sigilo (texto), para virar imagem ou textura no canvas. */
export function svgDoSigilo(id: string, tamanho = 48): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="${String(tamanho)}" height="${String(tamanho)}">${mioloDoSigilo(id)}</svg>`;
}
