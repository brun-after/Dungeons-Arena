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
  mago: {
    fogo: [{ t: 'encarnar', elemento: 'fogo' }],
    terra: [{ t: 'encarnar', elemento: 'terra' }],
    veneno: [{ t: 'encarnar', elemento: 'veneno' }],
    sombra: [{ t: 'encarnar', elemento: 'trevas' }],
    sagrado: [{ t: 'encarnar', elemento: 'sagrado' }],
    psiquico: [{ t: 'encarnacaoEstende', familia: 'psiquico', ms: 4000, dobra: true }],
    arcana: [
      { t: 'encarnacaoRenova', habilidade: 'seta_arcana' },
      { t: 'encarnacaoRenova', habilidade: 'explosao' },
      { t: 'dardoConcentra', valor: 1, dobra: true },
    ],
    tecnica: [{ t: 'encarnacaoRenova', habilidade: 'fisico', ms: 2000, dobra: true }],
    suporte: [{ t: 'suporteHerdaEncarnacao' }],
  },
  aventureiro: {
    tecnica: [{ t: 'falcaoGolpeiaComGeral', familia: 'tecnica', pct: 40, dobra: true }],
    arcana: [
      { t: 'falcaoGolpeiaComGeral', habilidade: 'seta_arcana', pct: 30, dobra: true },
      { t: 'falcaoGolpeiaComGeral', habilidade: 'explosao', pct: 30, dobra: true },
    ],
    suporte: [{ t: 'escudoNoFalcao', pct: 25, dobra: true }],
    fogo: [{ t: 'habilidadeAplica', habilidade: 'mergulho', efeito: ef.queima(3, 3), dobra: true }],
    veneno: [
      { t: 'habilidadeAplica', habilidade: 'garras_cegantes', efeito: ef.envenena(2, 4), dobra: true },
      { t: 'habilidadeAplica', habilidade: 'presa_dupla', efeito: ef.envenena(2, 4), dobra: true },
    ],
    terra: [{ t: 'habilidadeAplica', habilidade: 'mergulho', raio: 1, efeito: ef.atordoa(0.5) }],
    sombra: [{ t: 'falcaoCritico', valor: 16, ms: 4000 }],
    sagrado: [{ t: 'habilidadeCuraAliados', habilidade: 'retorno_ao_punho', raio: 2, pct: 100 }],
    psiquico: [{ t: 'habilidadeAplica', habilidade: 'grito_do_falcao', efeito: ef.silencia(0.5) }],
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
  alquimista: [{ t: 'duplaFixa', habilidade: 'miasma_ardente' }],
  arquimago: [
    { t: 'encarnacaoDuracao', pct: 100 },
    { t: 'contaComoElemento', habilidade: 'seta_arcana' },
    { t: 'contaComoElemento', habilidade: 'agulha_mental' },
  ],
  geomante: [{ t: 'duplaDuracao', habilidade: 'lava', pct: 100 }, { t: 'magiaChao', habilidade: 'lava', efeito: ef.enraiza(0.5), ms: 3000 }],
  druida: [{ t: 'falcaoGuardiao', ms: 4000 }],
  rapina: [{ t: 'falcaoGolpeiaComGeral', familia: 'tecnica', pct: 100, ms: 4000 }],
  tempestuoso: [{ t: 'falcaoGolpeiaComGeral', habilidade: 'magico', pct: 50, efeito: ef.silencia(0.5) }],
  sentinela: [{ t: 'escudoParadoComMira', raio: 2, ms: 1000, efeito: ef.escudoAc(4, 12, 2), quando: 'parado' }],
};

// ---------- as encarnações do Mago e as duplas ----------
// Marco 24 (24/10/2026, D-095). Fogo, gelo e raio seguem com a regra de antes (combat/encarnacao.ts, balance); aqui ficam
// as 4 novas (abertas pela sintonia) e, nas 7, o que as curas e os escudos gerais herdam com a sintonia do suporte.
// `herancaSuporte`: raio 0 = no curado; raio > 0 = nos hostis em volta dele.
const heranca = (efeito, raio = 1) => ({ t: 'herancaSuporte', efeito, raio });
export const ENCARNACOES = {
  fogo: [heranca(ef.queima(2, 2))],
  gelo: [heranca(ef.resfria(30, 2))],
  raio: [heranca(ef.eletriza(2))],
  terra: [{ t: 'inamovivel' }, { t: 'raioArea', valor: 1 }, heranca(ef.escudo(4, 4), 0)],
  veneno: [{ t: 'magiaAplica', efeito: ef.envenena(1, 3) }, { t: 'auraAplica', raio: 1, efeito: ef.envenena(1, 2) }, heranca(ef.envenena(1, 3))],
  trevas: [{ t: 'rouboDeVida', pct: 5 }, heranca(ef.definha(20, 3))],
  sagrado: [{ t: 'magiaAplica', efeito: ef.consagra(2, 4) }, { t: 'auraAliados', raio: 2, efeito: ef.cura(1) }, heranca(ef.regenera(2, 4), 0)],
};

/** O efeito de cada encarnação dupla (id da fusão). */
export const DUPLAS = {
  vapor: [{ t: 'magiaAplica', efeito: ef.cega(30, 3) }],
  plasma: [{ t: 'saltoExtra', n: 1 }, { t: 'magiaAplica', efeito: ef.queima(2, 3) }],
  superconducao: [{ t: 'danoContraEstado', estado: 'resfriado', elemento: 'raio', pct: 50 }],
  lava: [{ t: 'magiaChao', valor: 3, ms: 3000 }],
  miasma_ardente: [
    { t: 'magiaAplica', efeito: ef.queima(2, 3) },
    { t: 'magiaAplica', efeito: ef.envenena(2, 4) },
    { t: 'aoAbaterAplica', estado: 'queimando', raio: 2 },
    { t: 'aoAbaterAplica', estado: 'envenenado', raio: 2 },
  ],
  eclipse: [{ t: 'magiaAplica', efeito: ef.consagra(2, 4) }],
  permafrost: [{ t: 'magiaChao', efeito: ef.enraiza(1), ms: 3000 }],
  nevoa_gelida: [{ t: 'magiaAplica', estado: 'envenenado', efeito: ef.resfria(30, 3) }, { t: 'magiaAplica', estado: 'resfriado', efeito: ef.envenena(1, 3, 100) }],
  inverno_sombrio: [
    { t: 'magiaAplica', efeito: ef.resfria(30, 3) },
    { t: 'magiaAplica', efeito: ef.definha(20, 4) },
    { t: 'aoAbaterAplica', estado: 'congelado', raio: 1, efeito: ef.congela(1) },
  ],
  aurora: [{ t: 'magiaAplica', efeito: ef.resfria(30, 3) }, { t: 'magiaAliados', raio: 2, efeito: ef.escudo(3, 4) }],
  magnetita: [{ t: 'magiaPuxa', estado: 'eletrizado', raio: 2, valor: 1 }],
  neurotoxina: [{ t: 'magiaAplica', estado: 'envenenado', efeito: ef.eletriza(2) }, { t: 'magiaAplica', estado: 'eletrizado', efeito: ef.atordoa(0.3), ms: 2000 }],
  relampago_negro: [{ t: 'rouboDeVida', pct: 5, elemento: 'raio' }, { t: 'saltoExtra', n: 1 }],
  fulgor: [{ t: 'magiaAplica', elemento: 'raio', efeito: ef.cega(30, 3) }, { t: 'magiaAliados', raio: 2, elemento: 'raio', efeito: ef.cura(4) }],
  chama_negra: [{ t: 'magiaAplica', estado: 'queimando', efeito: ef.envenena(1, 3, 100) }],
  chama_sagrada: [{ t: 'magiaAplica', estado: 'queimando', efeito: ef.consagra(2, 4) }],
  lodo_toxico: [{ t: 'magiaChao', efeito: ef.atola(40, 2), ms: 3000 }, { t: 'magiaAplica', efeito: ef.envenena(1, 3) }],
  tumulo: [{ t: 'aoAbaterAplica', raio: 1, efeito: ef.enraiza(1) }],
  santuario_de_pedra: [{ t: 'magiaAliados', raio: 2, efeito: ef.escudoAc(2, 10, 5) }],
  pestilencia: [{ t: 'aoAbaterAplica', estado: 'envenenado', raio: 2 }],
  purgacao: [{ t: 'magiaAplica', efeito: ef.envenena(2, 4) }, { t: 'magiaAliados', raio: 2, efeito: ef.purifica() }],
};
