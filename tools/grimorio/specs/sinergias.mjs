// As 4 sinergias passivas do Grimório v1.1 (marco 24, 24/10/2026, D-096): com uma passiva geral ligada, uma skill ganha
// um efeito. O `tipo` é um vocabulário fechado lido em combat/sinergias-passivas.ts; os números ficam aqui.
export const SINERGIAS = {
  'Bastião de pedra': { tipo: 'curaJuntoDaMuralha', valor: 2, raio: 1, ms: 1000 },
  'Disciplina férrea': { tipo: 'estadoMaisLongo', estado: 'atordoar', ms: 500 },
  'Fluxo de cura': { tipo: 'escudoDoFluxo', pct: 100 },
  'Avalanche humana': { tipo: 'atordoaEmVolta', raio: 1, ms: 1000, janelaMs: 3000 },
};
