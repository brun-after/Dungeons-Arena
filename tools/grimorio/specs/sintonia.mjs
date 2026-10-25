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
};

/** Vertente (id) → entradas. */
export const MECANICAS_VERTENTES = {
  paladino: [{ t: 'auraCuraAliados', raio: 2, pct: 100, quando: 'frenesi' }],
  berserker: [
    { t: 'auraAplica', efeito: ef.queima(3, 2), quando: 'frenesi' },
    { t: 'frenesiPorEstadoPerto', estado: 'queimando', ms: 500, valor: 3000, quando: 'frenesi' },
  ],
  carcereiro: [{ t: 'desafiadoEnraiza', raio: 1, efeito: ef.enraiza(0.5) }],
};
