// Skins de personagem (06/11/2026): o visual completo de uma classe, liberado por código e escolhido por classe.
// Com uma skin ativa, o equipamento deixa de aparecer no personagem: prevalece a skin (palco-vivo.ts). Puro: sem DOM,
// Node nem rede. O código de cada skin fica no catálogo só como impressão (hash), não em texto claro; é um
// anti-curioso, não segurança: quem desmonta o pacote ainda chega ao hash. Uma liberação que valha de verdade (por
// conta, validada no servidor) vem com a nuvem; hoje a liberação vale neste aparelho (plataforma/preferencias.ts).

import dados from '../data/skins.json';

export interface Skin {
  id: string;
  /** A classe dona (a skin só vale para ela). */
  classe: string;
  /** O nome da classe, para a interface (a lista de skins não carrega o conteúdo do jogo). */
  classeNome: string;
  nome: string;
  descricao: string;
  /** A impressão do código (`hashDoCodigo`), nunca o código. */
  codigo: string;
}

export const SKINS: readonly Skin[] = dados.skins;

/** Maiúsculas e só letras e números: "necro-ceifador 9qx4" e "NECROCEIFADOR9QX4" são o mesmo código. */
export function normalizarCodigo(texto: string): string {
  return texto.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** A impressão do código (cyrb53 em base 36): rápida, sem dependência, igual no cliente e no servidor. */
export function hashDoCodigo(texto: string): string {
  const s = normalizarCodigo(texto);
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

/** A skin que o código libera, ou null. */
export function skinDoCodigo(texto: string): Skin | null {
  if (normalizarCodigo(texto).length < 4) return null;
  const h = hashDoCodigo(texto);
  return SKINS.find((s) => s.codigo === h) ?? null;
}

export const skinPorId = (id: string): Skin | null => SKINS.find((s) => s.id === id) ?? null;
export const skinsDaClasse = (classe: string): readonly Skin[] => SKINS.filter((s) => s.classe === classe);
/** O id existe e é da classe (a simulação e o servidor só aceitam isso). */
export const skinValida = (classe: string, id: string): boolean => skinPorId(id)?.classe === classe;

/** A skin que as preferências mandam vestir nesta classe (ou null: o visual do equipamento). */
export function skinEscolhida(escolhidas: Readonly<Record<string, string>>, classe: string): string | null {
  const id = Object.hasOwn(escolhidas, classe) ? escolhidas[classe] : undefined;
  return id !== undefined && skinValida(classe, id) ? id : null;
}
