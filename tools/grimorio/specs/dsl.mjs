// Linguagem curta para escrever skills, ultimates e combos do Grimório (marco 24, 24/10/2026). Cada função devolve o
// JSON que o jogo lê (skills.json, ultimates.json, combos.json); o gerador (gerar-dados.mjs) junta tudo. Só dados.

// ---------- efeitos (o formato canônico de normalizar-efeito.ts) ----------
const e = (tipo, campos = {}) => ({ tipo, ...campos });
const ms = (s) => Math.round(s * 1000);
export const ef = {
  dano: (valor) => e('dano_direto', { valor }),
  queima: (valor = 3, s = 3) => e('queimando', { valor, duracaoMs: ms(s) }),
  resfria: (pct = 30, s = 3) => e('resfriado', { pct, duracaoMs: ms(s) }),
  congela: (s = 1.5) => e('congelado', { duracaoMs: ms(s) }),
  eletriza: (s = 2.5) => e('eletrizado', { duracaoMs: ms(s) }),
  atordoa: (s = 0.5) => e('atordoar', { duracaoMs: ms(s) }),
  enraiza: (s = 1) => e('enraizado', { duracaoMs: ms(s) }),
  prende: (s = 1) => e('sem_movimento', { duracaoMs: ms(s) }),
  silencia: (s = 1) => e('silenciar', { duracaoMs: ms(s) }),
  semAtaque: (s = 1) => e('sem_ataque', { duracaoMs: ms(s) }),
  definha: (pct = 20, s = 4) => e('definhando', { pct, duracaoMs: ms(s) }),
  envenena: (valor = 2, s = 5, pct = 50) => e('envenenado', { valor, pct, duracaoMs: ms(s) }),
  sangra: (valor = 2, s = 4) => e('sangrando', { valor, duracaoMs: ms(s) }),
  expoe: (pct = 15, s = 4) => e('exposto', { pct, duracaoMs: ms(s) }),
  marca: (pct = 25, s = 4) => e('marcado', { pct, duracaoMs: ms(s) }),
  consagra: (valor = 2, s = 4) => e('consagrado', { valor, duracaoMs: ms(s) }),
  atola: (pct = 40, s = 3) => e('atolado', { pct, duracaoMs: ms(s) }),
  molha: (s = 5) => e('molhado', { duracaoMs: ms(s) }),
  cega: (pct = 30, s = 3) => e('cego', { pct, duracaoMs: ms(s) }),
  medo: (s = 1.5) => e('aterrorizado', { duracaoMs: ms(s) }),
  confunde: (s = 2) => e('confuso', { duracaoMs: ms(s) }),
  desafia: (pct = 15, s = 3) => e('desafiado', { pct, duracaoMs: ms(s) }),
  marcaCacador: (pct = 20, s = 8) => e('marca_cacador', { pct, duracaoMs: ms(s) }),
  enfraquece: (pct = 20, s = 4) => e('modificar_dano', { pct, duracaoMs: ms(s) }),
  empurra: (valor = 1) => e('empurrao', { valor }),
  puxa: (valor = 1) => e('puxao', { valor }),
  arremessa: (valor = 3, atordoaS = 0.5) => e('arremessar', { valor, efeito: { atordoar: ms(atordoaS) } }),
  dissipa: (valor = 2) => e('dissipar', { valor }),
  consome: (estado, pct = 50) => e('consumir', { ref: estado, pct }),
  detona: (raio = 2, pct = 60) => e('detonar_invocacao', { valor: raio, pct }),
  // em quem recebe (alvo) por padrão; `eu(x)` muda para quem lança
  escudo: (valor = 10, s = 6) => e('escudo', { valor, duracaoMs: ms(s) }),
  escudoAc: (valor = 2, teto = 10, s = 5) => e('escudo_acumulado', { valor, pct: teto, duracaoMs: ms(s) }),
  cura: (valor = 8) => e('cura', { valor }),
  curaPct: (pct = 10) => e('cura', { pct }),
  regenera: (valor = 2, s = 4) => e('cura_periodica', { valor, duracaoMs: ms(s) }),
  mana: (valor = 4) => e('recuperar_recurso', { valor, duracaoMs: 0 }),
  bonus: (pct = 20, s = 6) => e('bonus_dano', { pct, duracaoMs: ms(s) }),
  acelera: (pct = 30, s = 3) => e('acelerado', { pct, duracaoMs: ms(s) }),
  pressa: (pct = 20, s = 6) => e('ab_recarga', { pct, duracaoMs: ms(s) }),
  imune: (s = 1) => e('imune_dano', { duracaoMs: ms(s) }),
  fantasma: (s = 2) => e('fantasma', { duracaoMs: ms(s) }),
  invisivel: (s = 1.5) => e('invisivel', { duracaoMs: ms(s) }),
  intercepta: (valor = 3, s = 3) => e('intercepta', { valor, duracaoMs: ms(s) }),
  aparo: (pct = 65, s = 1.5) => e('aparando', { pct, duracaoMs: ms(s) }),
  contragolpe: (ref, s = 1.5) => e('contragolpe', { ref, duracaoMs: ms(s) }),
  presagio: (s = 4) => e('presagio', { duracaoMs: ms(s) }),
  critico: (s = 5) => e('critico_garantido', { duracaoMs: ms(s) }),
  esquiva: (pct = 20, s = 4) => e('esquiva', { pct, duracaoMs: ms(s) }),
  sobrecarga: (pct = 40, s = 10) => e('sobrecarga', { pct, duracaoMs: ms(s) }),
  frenesi: (pct = 20, s = 6) => e('frenesi', { pct, duracaoMs: ms(s) }),
  libertar: () => e('libertar'),
  purifica: () => e('purificar'),
  furia: (valor = 10) => e('furia', { valor }),
  carga: (valor = 10) => e('carga_ultimate', { valor }),
  zera: (habilidade) => e('zerar_recarga', { ref: habilidade }),
  avanca: (valor = 3) => e('avanco', { valor, em: 'conjurador' }),
  teleporta: () => e('teleporte', { em: 'conjurador' }),
  troca: () => e('trocar_lugar'),
  passo: (valor = 3) => e('passo_sombrio', { valor }),
  rastroFogo: (valor = 3, s = 4) => e('rastro_dano', { valor, duracaoMs: ms(s), em: 'conjurador' }),
  campoCura: (valor = 3, s = 6) => e('campo_cura', { valor, duracaoMs: ms(s) }),
  campoVeneno: (valor = 2, s = 5) => e('campo_veneno', { valor, duracaoMs: ms(s) }),
  muralha: (s = 5) => e('muralha_pedra', { valor: 1, duracaoMs: ms(s) }),
  armadilha: (valor = 8, interno = { enraizado: 1500 }, s = 30) => e('armadilha', { valor, duracaoMs: ms(s), efeito: interno }),
  invoca: (ref, valor = 1, s = 20) => e('invocar', { ref, valor, duracaoMs: ms(s) }),
  invocaTemp: (ref, valor = 1, s = 12) => e('invocar_temporario', { ref, valor, duracaoMs: ms(s) }),
  comandar: (pct = 25, s = 6) => e('comandar_mortos', { pct, duracaoMs: ms(s) }),
  drenar: (valor = 18) => e('drenar_invocacao', { valor }),
  atrasado: (s, interno) => e('efeito_atrasado', { duracaoMs: ms(s), efeito: interno }),
  fase: (s, ref) => e('fase', { ref, duracaoMs: ms(s) }),
  reflexo: (interno, s = 5) => e('reflexo', { duracaoMs: ms(s), efeito: interno }),
  executa: (pct = 20) => e('executar', { pct }),
};
/** O efeito cai em quem lança. */
export const eu = (x) => ({ ...x, em: 'conjurador' });

// ---------- formas de uma habilidade ----------
export const forma = {
  aoRedor: (raio = 2, alvo = 'hostil') => ({ politicaAlvo: alvo, politicaImpacto: 'area', tipoArea: 'ao_redor', raioArea: raio, alcanceCelulas: raio }),
  aliados: (raio = 3) => ({ politicaAlvo: 'aliados', politicaImpacto: 'area', tipoArea: 'ao_redor', raioArea: raio, alcanceCelulas: raio }),
  cone: (alcance = 3, raio = 3) => ({ politicaAlvo: 'hostil', politicaImpacto: 'area', tipoArea: 'cone', raioArea: raio, alcanceCelulas: alcance }),
  linha: (alcance = 5) => ({ politicaAlvo: 'hostil', politicaImpacto: 'area', tipoArea: 'linha', raioArea: 0, alcanceCelulas: alcance }),
  area: (alcance = 6, raio = 2, alvo = 'celula') => ({ politicaAlvo: alvo, politicaImpacto: 'area', tipoArea: 'quadrado', raioArea: raio, alcanceCelulas: alcance }),
  tiro: (alcance = 7, velocidade = 14) => ({ politicaAlvo: 'hostil', politicaImpacto: 'projetil', tipoArea: 'nenhuma', raioArea: 0, alcanceCelulas: alcance, velocidadeProjetil: velocidade }),
  toque: (alcance = 2) => ({ politicaAlvo: 'hostil', politicaImpacto: 'contato', tipoArea: 'nenhuma', raioArea: 0, alcanceCelulas: alcance }),
  aliado: (alcance = 5) => ({ politicaAlvo: 'aliado', politicaImpacto: 'contato', tipoArea: 'nenhuma', raioArea: 0, alcanceCelulas: alcance }),
  proprio: () => ({ politicaAlvo: 'proprio', politicaImpacto: 'proprio', tipoArea: 'nenhuma', raioArea: 0, alcanceCelulas: 0 }),
  celula: (alcance = 4) => ({ politicaAlvo: 'celula', politicaImpacto: 'proprio', tipoArea: 'nenhuma', raioArea: 0, alcanceCelulas: alcance }),
  // Para as etapas (fases): acerta o próprio alvo da etapa, ou a área em volta dele/da célula, sem limite prático de alcance.
  noAlvo: (alvo = 'hostil') => ({ politicaAlvo: alvo, politicaImpacto: 'contato', tipoArea: 'nenhuma', raioArea: 0, alcanceCelulas: 30 }),
  emVolta: (raio = 2, alvo = 'hostil') => ({ politicaAlvo: alvo, politicaImpacto: 'area', tipoArea: 'quadrado', raioArea: raio, alcanceCelulas: 30 }),
};

/** O estado típico de cada elemento (o que a encarnação aplica). */
export const ESTADO_DO_ELEMENTO = {
  fogo: () => ef.queima(3, 3),
  gelo: () => ef.resfria(30, 3),
  raio: () => ef.eletriza(2),
  terra: () => ef.atola(30, 2),
  veneno: () => ef.envenena(2, 4),
  trevas: () => ef.definha(20, 4),
  sagrado: () => ef.consagra(2, 4),
};
const NOME_ELEMENTO = { fogo: 'fogo', gelo: 'gelo', raio: 'raio', terra: 'terra', veneno: 'veneno', trevas: 'trevas', sagrado: 'luz' };
/** Variantes `enc_*`: com o elemento encarnado, a skill troca de elemento e aplica o estado dele (+ `extra`). */
export function porElemento(extra = () => []) {
  return Object.fromEntries(Object.entries(ESTADO_DO_ELEMENTO).map(([el, estado]) => [
    `enc_${el}`, { texto: `Encarnado em ${NOME_ELEMENTO[el]}: vira ${NOME_ELEMENTO[el]} e aplica o estado dele`, elemento: el, efeitos: [estado(), ...extra(el)] },
  ]));
}

/** Remove acentos e espaços: o id de um nome do Grimório. */
export function slug(nome) {
  return nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

/** Os campos padrão de uma habilidade (o resto vem da forma e do que a entrada diz). */
export function habilidade(base) {
  return {
    formulaDano: null,
    formulaCura: null,
    custoRecurso: 0,
    recargaMs: 0,
    conjuracaoMs: 300,
    interrupcao: 'interrompivel',
    velocidadeProjetil: 0,
    efeitos: [],
    ...base,
  };
}
