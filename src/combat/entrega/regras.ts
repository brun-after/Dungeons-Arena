// Marco 49 (21/11/2026, D-194): os números da entrega (balance.json, bloco entrega), com o custo e a compensação de
// cada escolha do Grimório da Alquimia (capítulo I). Fora do contexto.ts para ele caber nas 800 linhas.

export interface RegrasEntrega {
  /** O teto de projéteis num lançamento (os grãos encolhem para caber). */
  maxTiros: number;
  /** Parábola: % do golpe, altura (mínima e por célula de distância) e a partir de que fração da rota acerta. */
  parabola: { danoPct: number; alturaMin: number; alturaPorCelula: number; acertaDe: number };
  /** Espiral: % da velocidade, raio de toque, voltas e raio do giro. */
  espiral: { velocidadePct: number; toque: number; voltas: number; raio: number };
  /** Par convergente: % de cada metade, bônus do encontro (as duas no mesmo alvo) e a largura da curva. */
  convergente: { pctCada: number; encontroPct: number; largura: number };
  /** Caótica: % do golpe, dobras e largura. */
  caotica: { danoPct: number; dobrasMin: number; dobrasMax: number; largura: number };
  /** Órbita: % do golpe, raio da volta e a fração da rota que ela gasta girando. */
  orbita: { danoPct: number; raio: number; giro: number };
  /** Círculos atrás e à frente: N × (100/N + extraPct)%; a distância e a abertura dos círculos. */
  circulos: { extraPct: number; distancia: number; abertura: number };
  /** Céu: a queda, o raio a mais da área e a altura de onde cai. */
  ceu: { quedaMs: number; raioExtra: number; altura: number };
  /** Círculo sob o alvo: o aviso antes de subir. */
  sobAlvo: { avisoMs: number };
  /** Brota do chão: % da velocidade (a onda atravessa a linha). */
  chao: { velocidadePct: number; danoPct: number };
  /** Salva: o intervalo entre os tiros e o extra: N × (100/N + extraPct)%. */
  salva: { intervaloMs: number; extraPct: number };
  /** Rajada: um projétil por pulso, com % do golpe e % do custo por pulso. */
  rajada: { intervaloMs: number; pulsoPct: number; custoPorPulsoPct: number };
  /** Feixe: % do golpe por pulso, a exposição por pulso e o teto, o custo por pulso e o andar de quem canaliza. */
  feixe: { intervaloMs: number; pulsoPct: number; exposicaoPorPulsoPct: number; exposicaoMaxPct: number; custoPorPulsoPct: number; andarPct: number };
  /** Chão amaldiçoado: % do golpe que fica no impacto e % de cada pulso, o intervalo e quantos pulsos. */
  marca: { golpePct: number; pulsoPct: number; intervaloMs: number; pulsos: number; raio: number };
  /** Trilha: o caminho fica marcado (dano por célula, em % do golpe médio) por um tempo. */
  trilha: { pctDoGolpe: number; duracaoMs: number };
  /** Gira no alvo: % do golpe que fica no acerto, % de cada volta, o intervalo e o raio de toque em volta do alvo. */
  gira: { golpePct: number; voltaPct: number; intervaloMs: number; raioToque: number };
  /** Pulsa no alvo: % do golpe, % de cada pulso e o intervalo. */
  pulsa: { golpePct: number; pulsoPct: number; intervaloMs: number };
  /** Erupção periódica: % do golpe, % de cada pulso, o intervalo e quantos pulsos (o círculo fica parado). */
  erupcao: { golpePct: number; pulsoPct: number; intervaloMs: number; pulsos: number };
  /** Quanto dura o giro e o pulso no alvo. */
  permanenciaMs: number;
  /** Alvo para usuário: % do dano e quanto do dano volta como vida. */
  volta: { danoPct: number; trazPct: number; velocidade: number };
  /** Invocação para usuário: o escudo que o servo manda, em % da vida máxima de quem lançou. */
  invocacao: { escudoPctVida: number; escudoMs: number };
  /** Grãos: quantos, % de cada, o espalhamento, o intervalo e o toque. */
  graos: { quantidade: number; pctCada: number; espalhamento: number; intervaloMs: number; toque: number };
  /** Grande: % da velocidade, % do golpe, o toque, o raio do impacto, o respingo em volta e o empurrão. */
  grande: { velocidadePct: number; danoPct: number; toque: number; raioImpacto: number; respingoPct: number; empurra: number };
}
