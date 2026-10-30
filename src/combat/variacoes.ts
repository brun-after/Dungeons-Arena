// Variações do ataque básico (marco 27, 29/10/2026, D-126). Cada arma de classe tem uma variação fixa que muda a
// mecânica do básico (trajetória, forma, gatilho), não só os números. O vocabulário é fechado e lido do skills.json
// (`variacao`); quem executa são funções pequenas no núcleo: projeteis-variacoes.ts (os projéteis), solos.ts (o solo
// amaldiçoado e a runa) e acao.ts (o giro, os vários projéteis e a riposta). Puro.

import { Leitor, type Objeto } from '../core/validar';

/** Vários projéteis de uma vez: abertos em leque, em fila (salva) ou atrás (a imagem). */
export interface Multiplos {
  quantidade: number;
  /** Abertura total do leque, em graus (0 = todos na mesma direção). */
  aberturaGraus: number;
  /** Quanto cada um nasce atrás do anterior, em células (a salva chega em sequência). */
  recuo: number;
  /** Dano dos que vêm além do primeiro, em % do golpe. */
  pctExtras: number;
}

/** O solo amaldiçoado (Necromante) e a runa (Mago): uma área que pulsa sob o alvo. */
export interface SoloDaVariacao {
  pulsos: number;
  intervaloMs: number;
  /** Espera antes do primeiro pulso (a runa detona depois). */
  atrasoMs: number;
  raio: number;
  /** Dano de cada pulso, em % do golpe. */
  pctPulso: number;
  forma: 'quadrado' | 'cone';
  /** O raio cresce 1 a cada pulso (Expansão). */
  cresce: boolean;
  /** Ao acabar, salta para o hostil mais perto, com um pulso a menos (Praga). */
  salta: number;
  /** O primeiro pulso enraíza por tanto tempo (Mãos da cova). */
  enraizaMs: number;
  /** Ao acabar, solta uma alma que persegue um hostil, com tanto % do golpe (Lamento). */
  almaPct: number;
  /** Os pulsos curam quem lançou e os mortos dele em tanto % do dano (Dreno). */
  drenoPct: number;
  /** O solo segue o alvo por tanto tempo (Perseguição). */
  persegueMs: number;
  /** Quem morre no solo tem tanta chance de se erguer como morto de quem lançou (Colheita). */
  colheitaPct: number;
}

export interface VariacaoBasico {
  multiplos?: Multiplos;
  /** O tiro parabólico: passa por cima de quem está no caminho e só acerta na célula mirada. */
  porCima?: boolean;
  /** Quanto o projétil vira por célula na direção do alvo, em graus (teleguiada, curva). */
  guiado?: number;
  /** Desvio da direção inicial, em graus (a curva da machadinha). */
  desvioGraus?: number;
  /** Quantas vezes quica nas paredes (Tabela). */
  ricocheteParede?: number;
  /** Quantas vezes salta entre inimigos (Chakram), com `ricochetePct` do golpe. */
  ricochetes?: number;
  ricochetePct?: number;
  /** Ao acertar, solta fragmentos para trás do alvo (Estilhaço). */
  estilhacos?: { quantidade: number; alcance: number; pct: number };
  /** O alvo encostado numa parede fica preso por tanto tempo (Cravar). */
  cravarMs?: number;
  /** O bumerangue volta para quem lançou, acertando de novo na volta com `voltaPct` do golpe. */
  retorna?: boolean;
  voltaPct?: number;
  /** Gira em volta do primeiro alvo antes de voltar (Shuriken). */
  orbita?: { duracaoMs: number; intervaloMs: number; pct: number };
  /** No ápice, vira dois que voltam por caminhos diferentes (Bumerangue duplo). */
  divisor?: boolean;
  /** Na volta, puxa quem acerta tantas células na direção de quem lançou (Arpéu). */
  puxaNaVolta?: number;
  /** Volta ao falcão, que golpeia o último alvo com tanto % do golpe (Bumerangue do falcoeiro). */
  voltaAoFalcao?: number;
  /** Deixa um rastro que fere quem cruza a trajetória (Bumerangue serrilhado). */
  rastro?: { valor: number; duracaoMs: number };
  /** A cada n básicos, o golpe gira em volta de quem ataca (Montante). */
  giroACada?: number;
  /** A cada n básicos, saem os projéteis acumulados de uma vez (Tomo orbital). */
  multiplosACada?: { n: number; quantidade: number; aberturaGraus: number };
  /** Levar um golpe deixa o próximo básico crítico por tanto tempo (Rapieira). */
  ripostaMs?: number;
  /** Ao acertar, puxa os hostis a até tantas células do alvo para perto dele (Grimório do vazio). */
  implosao?: number;
  solo?: SoloDaVariacao;
}

const CAMPOS = ['multiplos', 'porCima', 'guiado', 'desvioGraus', 'ricocheteParede', 'ricochetes', 'ricochetePct', 'estilhacos', 'cravarMs', 'retorna', 'voltaPct',
  'orbita', 'divisor', 'puxaNaVolta', 'voltaAoFalcao', 'rastro', 'giroACada', 'multiplosACada', 'ripostaMs', 'implosao', 'solo'];

function lerSolo(l: Leitor, v: unknown): SoloDaVariacao {
  const o = l.objeto(v, 'variacao.solo');
  const n = (campo: string, min: number, max: number, padrao: number) => (o[campo] === undefined ? padrao : l.numero(o, campo, { min, max }));
  return {
    pulsos: n('pulsos', 1, 8, 3),
    intervaloMs: n('intervaloMs', 100, 3000, 500),
    atrasoMs: n('atrasoMs', 0, 3000, 0),
    raio: n('raio', 0, 3, 1),
    pctPulso: n('pctPulso', 5, 200, 40),
    forma: o.forma === undefined ? 'quadrado' : l.opcao(o, 'forma', ['quadrado', 'cone'] as const),
    cresce: o.cresce === undefined ? false : l.booleano(o, 'cresce'),
    salta: n('salta', 0, 3, 0),
    enraizaMs: n('enraizaMs', 0, 3000, 0),
    almaPct: n('almaPct', 0, 200, 0),
    drenoPct: n('drenoPct', 0, 100, 0),
    persegueMs: n('persegueMs', 0, 3000, 0),
    colheitaPct: n('colheitaPct', 0, 100, 0),
  };
}

/** Lê o campo `variacao` de uma habilidade (ausente = nenhuma). */
export function lerVariacao(l: Leitor, v: unknown): VariacaoBasico | undefined {
  if (v === undefined) return undefined;
  const o: Objeto = l.objeto(v, 'variacao');
  for (const k of Object.keys(o)) if (!CAMPOS.includes(k)) l.erro(`variacao: campo desconhecido "${k}"`);
  const n = (campo: string, min: number, max: number) => l.numero(o, campo, { min, max });
  const sub = (campo: string) => l.objeto(o[campo], `variacao.${campo}`);
  const x: VariacaoBasico = {};
  if (o.multiplos !== undefined) {
    const m = sub('multiplos');
    x.multiplos = { quantidade: l.numero(m, 'quantidade', { min: 2, max: 5, inteiro: true }), aberturaGraus: l.numero(m, 'aberturaGraus', { min: 0, max: 90 }), recuo: m.recuo === undefined ? 0 : l.numero(m, 'recuo', { min: 0, max: 2 }), pctExtras: l.numero(m, 'pctExtras', { min: 10, max: 100 }) };
  }
  if (o.porCima !== undefined) x.porCima = l.booleano(o, 'porCima');
  if (o.guiado !== undefined) x.guiado = n('guiado', 1, 90);
  if (o.desvioGraus !== undefined) x.desvioGraus = n('desvioGraus', -80, 80);
  if (o.ricocheteParede !== undefined) x.ricocheteParede = l.numero(o, 'ricocheteParede', { min: 1, max: 4, inteiro: true });
  if (o.ricochetes !== undefined) x.ricochetes = l.numero(o, 'ricochetes', { min: 1, max: 4, inteiro: true });
  if (o.ricochetePct !== undefined) x.ricochetePct = n('ricochetePct', 10, 100);
  if (o.estilhacos !== undefined) {
    const e = sub('estilhacos');
    x.estilhacos = { quantidade: l.numero(e, 'quantidade', { min: 1, max: 5, inteiro: true }), alcance: l.numero(e, 'alcance', { min: 1, max: 4 }), pct: l.numero(e, 'pct', { min: 10, max: 100 }) };
  }
  if (o.cravarMs !== undefined) x.cravarMs = n('cravarMs', 100, 3000);
  if (o.retorna !== undefined) x.retorna = l.booleano(o, 'retorna');
  if (o.voltaPct !== undefined) x.voltaPct = n('voltaPct', 10, 100);
  if (o.orbita !== undefined) {
    const b = sub('orbita');
    x.orbita = { duracaoMs: l.numero(b, 'duracaoMs', { min: 200, max: 3000 }), intervaloMs: l.numero(b, 'intervaloMs', { min: 100, max: 1000 }), pct: l.numero(b, 'pct', { min: 10, max: 100 }) };
  }
  if (o.divisor !== undefined) x.divisor = l.booleano(o, 'divisor');
  if (o.puxaNaVolta !== undefined) x.puxaNaVolta = l.numero(o, 'puxaNaVolta', { min: 1, max: 3, inteiro: true });
  if (o.voltaAoFalcao !== undefined) x.voltaAoFalcao = n('voltaAoFalcao', 10, 200);
  if (o.rastro !== undefined) {
    const r = sub('rastro');
    x.rastro = { valor: l.numero(r, 'valor', { min: 1, max: 30, inteiro: true }), duracaoMs: l.numero(r, 'duracaoMs', { min: 200, max: 6000 }) };
  }
  if (o.giroACada !== undefined) x.giroACada = l.numero(o, 'giroACada', { min: 2, max: 6, inteiro: true });
  if (o.multiplosACada !== undefined) {
    const m = sub('multiplosACada');
    x.multiplosACada = { n: l.numero(m, 'n', { min: 2, max: 6, inteiro: true }), quantidade: l.numero(m, 'quantidade', { min: 2, max: 5, inteiro: true }), aberturaGraus: l.numero(m, 'aberturaGraus', { min: 0, max: 90 }) };
  }
  if (o.ripostaMs !== undefined) x.ripostaMs = n('ripostaMs', 200, 3000);
  if (o.implosao !== undefined) x.implosao = l.numero(o, 'implosao', { min: 1, max: 3, inteiro: true });
  if (o.solo !== undefined) x.solo = lerSolo(l, o.solo);
  return x;
}

/** Gira (dx, dy) por `graus` (sentido horário na tela, y para baixo). */
export function girar(dx: number, dy: number, graus: number): { x: number; y: number } {
  const r = (graus * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return { x: dx * c - dy * s, y: dx * s + dy * c };
}
