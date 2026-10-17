// Habilidades geradas por semente (D-057, D-059). Marco 14 (14/10/2026). Pura e determinística.
// O id `g_<semente>_<nível>` vira uma definição completa: o tema (elemento) puxa a forma (pelos pesos do
// elemento), o estado aplicado, o visual, o som e o nome; os dados sobem até onde o orçamento do nível deixa;
// 40% de chance de um efeito secundário; dois caminhos de evolução por degrau. Só alvo hostil: servem aos
// inimigos das fases geradas e aos livros raros, e a mesma semente dá sempre a mesma habilidade.

import { criarRng, escolher, inteiro, aleatorio, type EstadoRng } from '../core/rng';
import { ehGerada, lerIdGerada } from './chave-habilidade';
import { compilarHabilidade, modificadorCabe, type ContextoHabilidades } from './compilar-habilidade';
import { ELEMENTOS, FORMAS, type DefinicaoElemento, type Forma } from './elementos';
import { etiquetasDe, type DefinicaoHabilidade, type Habilidade, type Modificador } from './habilidades';
import { orcamentoNoNivel, poderDaHabilidade } from './orcamento';
import { construirEfeito, type EfeitoCanonico } from './registro-efeitos';

const memoria = new WeakMap<object, Map<string, DefinicaoHabilidade | null>>();

function sortearForma(rng: EstadoRng, el: DefinicaoElemento): Forma {
  const total = FORMAS.reduce((s, f) => s + el.formas[f], 0);
  let sorteio = aleatorio(rng) * total;
  for (const f of FORMAS) {
    sorteio -= el.formas[f];
    if (sorteio < 0 && el.formas[f] > 0) return f;
  }
  return 'projetil';
}

/** Os campos de forma da habilidade: impacto, área, raio, alcance e velocidade. */
function camposDaForma(rng: EstadoRng, forma: Forma): Pick<Habilidade, 'politicaImpacto' | 'tipoArea' | 'raioArea' | 'alcanceCelulas' | 'velocidadeProjetil' | 'tipoAtaque'> {
  switch (forma) {
    case 'contato':
      return { politicaImpacto: 'contato', tipoArea: 'nenhuma', raioArea: 0, alcanceCelulas: 2, velocidadeProjetil: 0, tipoAtaque: 'fisico' };
    case 'projetil':
      return { politicaImpacto: 'projetil', tipoArea: 'nenhuma', raioArea: 0, alcanceCelulas: inteiro(rng, 5, 7), velocidadeProjetil: inteiro(rng, 9, 13), tipoAtaque: 'magico' };
    case 'quadrado':
      return { politicaImpacto: 'area', tipoArea: 'quadrado', raioArea: 1, alcanceCelulas: inteiro(rng, 4, 6), velocidadeProjetil: 0, tipoAtaque: 'magico' };
    case 'linha':
      return { politicaImpacto: 'area', tipoArea: 'linha', raioArea: 0, alcanceCelulas: inteiro(rng, 4, 6), velocidadeProjetil: 0, tipoAtaque: 'magico' };
    case 'cone':
      return { politicaImpacto: 'area', tipoArea: 'cone', raioArea: 2, alcanceCelulas: 2, velocidadeProjetil: 0, tipoAtaque: 'magico' };
    case 'ao_redor':
      return { politicaImpacto: 'area', tipoArea: 'ao_redor', raioArea: 1, alcanceCelulas: 1, velocidadeProjetil: 0, tipoAtaque: 'magico' };
  }
}

function secundario(rng: EstadoRng, forma: Forma): EfeitoCanonico {
  const opcoes: EfeitoCanonico[] = [
    construirEfeito('sem_movimento', { duracaoMs: 1000 }),
    construirEfeito('modificar_dano', { pct: 20, duracaoMs: 3000 }),
    construirEfeito('silenciar', { duracaoMs: 1200 }),
    forma === 'contato' ? construirEfeito('empurrao', { valor: 1 }) : construirEfeito('puxao', { valor: 1 }),
  ];
  return escolher(rng, opcoes);
}

/** Caminhos que combinam com a forma (os de modificador só quando o modificador cabe). */
function caminhosPossiveis(h: Habilidade): string[] {
  const porMod: [string, Modificador][] = [
    ['perfurante', 'atravessar'],
    ['cadeia', 'encadear'],
    ['amplo', 'maior_e_mais_lenta'],
    ['eco', 'ecoar'],
  ];
  return ['brutal', 'eficiente', 'controle', 'longo_alcance', ...porMod.filter(([, m]) => modificadorCabe(h, m)).map(([c]) => c)];
}

function embaralharParcial(rng: EstadoRng, lista: string[], n: number): string[] {
  const copia = [...lista];
  const saida: string[] = [];
  while (saida.length < n && copia.length > 0) saida.push(...copia.splice(inteiro(rng, 0, copia.length - 1), 1));
  return saida;
}

export function gerarDefinicao(id: string, ctx: ContextoHabilidades): DefinicaoHabilidade | null {
  if (!ehGerada(id)) return null;
  let porId = memoria.get(ctx.conteudo);
  if (!porId) memoria.set(ctx.conteudo, (porId = new Map<string, DefinicaoHabilidade | null>()));
  const pronto = porId.get(id);
  if (pronto !== undefined) return pronto;
  const def = gerar(id, ctx);
  porId.set(id, def);
  return def;
}

function gerar(id: string, ctx: ContextoHabilidades): DefinicaoHabilidade | null {
  const g = lerIdGerada(id);
  if (!g) return null;
  const rng = criarRng(g.semente);
  const el = ctx.conteudo.elementos.get(escolher(rng, ELEMENTOS));
  if (!el) return null;
  const forma = sortearForma(rng, el);
  const campos = camposDaForma(rng, forma);
  const faces = escolher(rng, [4, 6, 8]);
  const efeitos = aleatorio(rng) < ctx.balance.geracao.chanceSecundario ? [secundario(rng, forma)] : [];
  const base: Habilidade = {
    id,
    nome: `${escolher(rng, el.nomes.nucleos)} ${escolher(rng, el.nomes.qualidades)}`,
    icone: el.icone,
    ...campos,
    formulaDano: `1d${faces}`,
    formulaCura: null,
    custoRecurso: inteiro(rng, 2, 6),
    recargaMs: inteiro(rng, 8, 18) * 500,
    conjuracaoMs: inteiro(rng, 5, 9) * 100,
    politicaAlvo: 'hostil',
    interrupcao: 'interrompivel',
    efeitos,
    visual: { cor: el.cor, conjuracao: el.visual.conjuracao, viagem: forma === 'projetil' ? el.visual.viagem : null, impacto: el.visual.impacto, camera: 'leve', projetil: null, som: el.visual.som },
    elemento: el.id,
    custoVida: 0,
    tags: [],
    nivelMinimo: 1,
    passiva: null,
    mobilidade: 'trava',
    rank: 1,
    chave: id,
    multDano: 1,
    multCura: 1,
    perfura: false,
    saltos: null,
    escalaVisual: 1,
  };
  base.tags = etiquetasDe(base, ['gerada']);
  // Os dados sobem enquanto o rank 1 couber no orçamento das geradas no nível; se nem 1 dado couber, cai o
  // efeito secundário e depois os dados diminuem.
  const limite = orcamentoNoNivel(g.nivel, ctx.balance.orcamento, ctx.balance.orcamento.geradaPct);
  const poder = (h: Habilidade) => poderDaHabilidade(compilarHabilidade({ base: h, basico: false, evolucoes: {}, mods: [] }, { rank: 1, caminhos: [], mods: [] }, ctx.conteudo, ctx.balance.habilidades), ctx.balance.orcamento);
  let quantos = 1;
  const comDados = (n: number, f: number): Habilidade => ({ ...base, formulaDano: `${n}d${f}` });
  while (quantos < 12 && poder(comDados(quantos + 1, faces)) <= limite) quantos++;
  let h = comDados(quantos, faces);
  for (let tentativa = 0; tentativa < 8 && poder(h) > limite; tentativa++) {
    if (h.efeitos.length > 0) h = { ...h, efeitos: [] };
    else if (h.custoRecurso < 8) h = { ...h, custoRecurso: h.custoRecurso + 1 };
    else h = { ...h, formulaDano: '1d3' };
  }
  const caminhos = caminhosPossiveis(h);
  const tres = embaralharParcial(rng, caminhos, 2);
  const cinco = embaralharParcial(rng, caminhos.filter((c) => !tres.includes(c)), 2);
  return { base: h, basico: false, evolucoes: { 3: tres, 5: cinco }, mods: [] };
}
