// Sintonia (marco 24, 24/10/2026, D-095): as marcas de Domínio que 2 gerais da mesma família deixam em qualquer
// ultimate. Cada marca vira a variante `dom_<família>` das 140 ultimates. As que agem nos atingidos só entram nas
// ultimates que miram hostis; as de você e dos aliados saem por uma etapa interna (`dom_<família>`), uma vez por uso.
import { ef, eu, forma, habilidade } from './dsl.mjs';

const etapa = (ref) => ({ tipo: 'fase', ref, duracaoMs: 0, em: 'conjurador' });

/** `noAlvo`: efeitos nos atingidos; `etapa`: a interna que sai de você; `alcance`/`raio`: somados. */
export const DOMINIOS = {
  tecnica: { noAlvo: [ef.sangra(3, 3)] },
  arcana: { alcance: 1, raio: 1 },
  suporte: { etapa: 'dom_suporte' },
  fogo: { noAlvo: [ef.queima(3, 3)] },
  veneno: { noAlvo: [ef.envenena(2, 5)] },
  terra: { noAlvo: [ef.atordoa(0.5)] },
  sombra: { etapa: 'dom_sombra' },
  sagrado: { etapa: 'dom_sagrado' },
  psiquico: { noAlvo: [ef.silencia(1)] },
};

/** A variante `dom_<família>` de uma ultimate (null quando a marca não cabe nela). */
export function varianteDeDominio(familia, texto, ofensiva) {
  const d = DOMINIOS[familia];
  if (d.noAlvo && !ofensiva) return null;
  return {
    texto,
    ...(d.alcance ? { alcance: d.alcance } : {}),
    ...(d.raio ? { raio: d.raio } : {}),
    ...(d.noAlvo || d.etapa ? { efeitos: [...(d.noAlvo ?? []), ...(d.etapa ? [etapa(d.etapa)] : [])] } : {}),
  };
}

const interna = (id, nome, o) =>
  habilidade({ id, nome, icone: 'coroa', grau: 'S', tipoAtaque: 'magico', interrupcao: 'ininterrupta', conjuracaoMs: 0, interna: true, ...o });

/** As etapas internas das marcas que agem em você e nos aliados. */
export const INTERNAS = [
  interna('dom_suporte', 'Domínio do suporte', { ...forma.aliados(3), efeitos: [ef.escudo(8, 6)], visual: { cor: '#7fd1ff', impacto: 'anel', camera: 'leve', som: 'cura' } }),
  interna('dom_sagrado', 'Domínio sagrado', { ...forma.aliados(3), formulaCura: '2d6+2', visual: { cor: '#f7e08a', impacto: 'sagrado', camera: 'leve', som: 'cura' } }),
  interna('dom_sombra', 'Domínio da sombra', { ...forma.proprio(), efeitos: [eu(ef.invisivel(1.5))], visual: { cor: '#5b4a7a', impacto: 'fumaca', camera: 'leve', som: 'golpe' } }),
];

// ---------- a mecânica de cada sintonia e vertente (vocabulário de progression/sintonia-efeitos.ts) ----------
// Marco 24 (24/10/2026, D-095). `dobra`: com Domínio da família, os números dobram. `quando`: frenesi, foraDoFrenesi,
// invisivel ou parado (padrão: sempre).

/** Classe → família → entradas. */
export const MECANICAS = {
  guerreiro: {
    tecnica: [{ t: 'furiaPorGeral', familia: 'tecnica', valor: 12, dobra: true }],
    arcana: [{ t: 'auraRaio', valor: 1, dobra: true }],
    suporte: [{ t: 'curaGeralNoFrenesi', pct: 100, quando: 'frenesi', dobra: true }],
    fogo: [{ t: 'auraAplica', efeito: ef.queima(2, 2), dobra: true }],
    veneno: [{ t: 'grupoContaEstado', estado: 'envenenado', n: 2, quando: 'foraDoFrenesi' }],
    terra: [{ t: 'inamovivel', quando: 'frenesi' }],
    sombra: [{ t: 'costasAoEncherFuria' }],
    sagrado: [{ t: 'auraCuraAliados', raio: 2, pct: 25, dobra: true }],
    psiquico: [{ t: 'auraAplica', efeito: ef.semAtaque(0.5), quando: 'frenesi' }],
  },
  arqueiro: {
    tecnica: [{ t: 'miraPorGeral', familia: 'tecnica', pct: 25, dobra: true }],
    arcana: [{ t: 'tiroCheioMagico' }, { t: 'tiroCheioRicochete', n: 1, raio: 4, dobra: true }],
    suporte: [{ t: 'miraEscudoProtege' }],
    fogo: [{ t: 'tiroCheioRastro', valor: 3, ms: 3000, dobra: true }],
    veneno: [{ t: 'tiroCheioEspalhaEstado', estado: 'envenenado' }],
    terra: [{ t: 'tiroCheioUltimo', efeito: ef.empurra(1) }, { t: 'tiroCheioUltimo', efeito: ef.enraiza(0.5) }],
    sombra: [{ t: 'miraAcelera', pct: 100, quando: 'invisivel', dobra: true }],
    sagrado: [{ t: 'tiroCheioCuraAliados', valor: 8, dobra: true }],
    psiquico: [{ t: 'tiroCheioAplica', efeito: ef.silencia(1) }],
  },
  necromante: {
    tecnica: [{ t: 'mortoAplica', efeito: ef.sangra(2, 3), dobra: true }],
    arcana: [{ t: 'mortoCaiSeta', valor: 8, raio: 5, dobra: true }],
    suporte: [{ t: 'curaGeralNosMortos', n: 2, dobra: true }],
    fogo: [{ t: 'mortoCaiExplode', valor: 6, raio: 1, efeito: ef.queima(2, 3), dobra: true }],
    veneno: [{ t: 'mortoAplica', efeito: ef.envenena(2, 4), dobra: true }],
    terra: [{ t: 'mortoVida', pct: 20, dobra: true }, { t: 'mortoInamovivel' }],
    sombra: [{ t: 'mortoEsquiva', pct: 20, dobra: true }],
    sagrado: [{ t: 'mortoCaiCura', valor: 6, raio: 2, dobra: true }],
    psiquico: [{ t: 'mortoAterroriza', n: 3, ms: 3000, efeito: ef.medo(1) }],
  },
};

/** Vertente (id) → entradas. */
export const MECANICAS_VERTENTES = {
  paladino: [{ t: 'auraCuraAliados', raio: 2, pct: 100, quando: 'frenesi' }],
  berserker: [
    { t: 'auraAplica', efeito: ef.queima(3, 2), quando: 'frenesi' },
    { t: 'frenesiPorEstadoPerto', estado: 'queimando', ms: 500, valor: 3000, quando: 'frenesi' },
  ],
  carcereiro: [{ t: 'desafiadoEnraiza', raio: 1, efeito: ef.enraiza(0.5) }],
  cacador_noturno: [{ t: 'tiroCheioInvisivel', estado: 'envenenado', pct: 100 }],
  atirador_de_elite: [{ t: 'tiroCheioRicochete', n: 2, raio: 4, pct: 15 }],
  lich: [{ t: 'mortoAtira', habilidade: 'dardo_arcano', raio: 4 }],
  senhor_da_praga: [
    { t: 'mortoAplica', efeito: ef.envenena(1, 3), raio: 1 },
    { t: 'estadoDobraEm', estado: 'envenenado', habilidade: 'aterrorizado' },
  ],
  pastor_das_almas: [{ t: 'mortoCaiCura', valor: 10, raio: 3 }, { t: 'retornoDoServo', ms: 4000 }],
  sentinela: [{ t: 'escudoParadoComMira', raio: 2, ms: 1000, efeito: ef.escudoAc(4, 12, 2), quando: 'parado' }],
};
