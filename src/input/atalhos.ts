// 19/11/2026 (D-187): as teclas de cada ação, configuráveis nas Configurações. Só os direcionais (WASD, EWAS e as
// setas) ficam fixos. Uma tecla por ação (ou nenhuma); os lados esquerdo e direito do Shift, do Ctrl e do Alt valem
// igual, e os números do teclado lateral valem como os de cima. Funções puras.

/** As ações do teclado, na ordem em que as Configurações as mostram. */
export const ACOES_DO_TECLADO = [
  'movimento1', 'movimento2', 'movimento3',
  'habilidade1', 'habilidade2', 'habilidade3', 'habilidade4', 'habilidade5', 'habilidade6', 'ultimate',
  'atacar', 'alternarBasico',
  'trocarAlvo', 'alvoAnterior', 'travarAlvo',
  'consumivel1', 'consumivel2', 'consumivel3', 'consumivel4',
  'interagir', 'mochila', 'mapa', 'dispensar', 'centralizar', 'pausar',
] as const;

export type AcaoTeclado = (typeof ACOES_DO_TECLADO)[number];

/** A tecla (`KeyboardEvent.code`, já normalizada) de cada ação; null: sem tecla. */
export type MapaTeclas = Record<AcaoTeclado, string | null>;

export const TECLAS_PADRAO: Readonly<MapaTeclas> = {
  movimento1: 'ShiftLeft', movimento2: 'KeyV', movimento3: 'KeyX',
  habilidade1: 'Digit1', habilidade2: 'Digit2', habilidade3: 'Digit3', habilidade4: 'Digit4', habilidade5: 'Digit5', habilidade6: 'Digit6',
  ultimate: 'KeyR',
  atacar: null, alternarBasico: 'KeyF',
  trocarAlvo: 'KeyQ', alvoAnterior: 'KeyZ', travarAlvo: 'KeyT',
  consumivel1: 'Digit7', consumivel2: 'Digit8', consumivel3: 'Digit9', consumivel4: 'Digit0',
  interagir: 'KeyE', mochila: 'KeyI', mapa: 'KeyM', dispensar: null, centralizar: 'KeyC', pausar: 'Escape',
};

/** As ações que não podem ficar sem tecla (sem o Esc, não há como pausar no teclado). */
export const ACOES_OBRIGATORIAS: ReadonlySet<AcaoTeclado> = new Set<AcaoTeclado>(['pausar']);

/** Os direcionais, fixos: nenhuma ação pode usá-los. O Tab fica com a navegação da página. */
const RESERVADAS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab']);

/** O código como as ações o guardam: lado direito vira esquerdo e o teclado lateral vira o de cima. */
export function normalizarCodigo(codigo: string): string {
  const numero = /^Numpad(\d)$/.exec(codigo);
  if (numero) return `Digit${numero[1] ?? ''}`;
  if (codigo === 'NumpadEnter') return 'Enter';
  return codigo.replace(/^(Shift|Control|Alt|Meta)Right$/, '$1Left');
}

/** A tecla pode ser posta numa ação? Os direcionais e o Tab não. */
export function teclaPermitida(codigo: string): boolean {
  return codigo !== '' && !RESERVADAS.has(normalizarCodigo(codigo));
}

/** O mapa salvo, normalizado: ação faltando ou tecla inválida volta ao padrão; tecla repetida fica só na primeira. */
export function normalizarTeclas(dados: unknown): MapaTeclas {
  const d = typeof dados === 'object' && dados !== null ? (dados as Partial<Record<string, unknown>>) : {};
  const mapa = { ...TECLAS_PADRAO };
  const usadas = new Set<string>();
  for (const acao of ACOES_DO_TECLADO) {
    const v = d[acao];
    let tecla = v === null && !ACOES_OBRIGATORIAS.has(acao) ? null : typeof v === 'string' && teclaPermitida(v) ? normalizarCodigo(v) : TECLAS_PADRAO[acao];
    if (tecla !== null && usadas.has(tecla)) tecla = null;
    if (tecla !== null) usadas.add(tecla);
    mapa[acao] = tecla;
  }
  // Uma obrigatória que perdeu a tecla para uma repetida volta à sua padrão (tirada de quem a tinha).
  for (const acao of ACOES_OBRIGATORIAS) {
    if (mapa[acao] !== null) continue;
    const padrao = TECLAS_PADRAO[acao];
    for (const outra of ACOES_DO_TECLADO) if (mapa[outra] === padrao) mapa[outra] = null;
    mapa[acao] = padrao;
  }
  return mapa;
}

/**
 * Põe `tecla` em `acao`. Se outra ação já a usava, as duas trocam (a outra fica com a tecla antiga desta, ou sem
 * nenhuma). `null` tira a tecla (não vale para as obrigatórias). Devolve o mapa novo (o de entrada não muda).
 */
export function definirTecla(mapa: Readonly<MapaTeclas>, acao: AcaoTeclado, tecla: string | null): MapaTeclas {
  const novo = { ...mapa };
  if (tecla === null) {
    if (!ACOES_OBRIGATORIAS.has(acao)) novo[acao] = null;
    return novo;
  }
  if (!teclaPermitida(tecla)) return novo;
  const codigo = normalizarCodigo(tecla);
  const antiga = mapa[acao];
  const dona = ACOES_DO_TECLADO.find((a) => a !== acao && mapa[a] === codigo);
  if (dona) {
    // A obrigatória nunca fica sem tecla: sem a antiga para trocar, a troca não acontece.
    if (antiga === null && ACOES_OBRIGATORIAS.has(dona)) return novo;
    novo[dona] = antiga;
  }
  novo[acao] = codigo;
  return novo;
}

/** A ação de uma tecla apertada, ou null. */
export function acaoDaTecla(mapa: Readonly<MapaTeclas>, codigo: string): AcaoTeclado | null {
  const c = normalizarCodigo(codigo);
  return ACOES_DO_TECLADO.find((a) => mapa[a] === c) ?? null;
}

/** Quantas habilidades têm tecla (as posições seguintes, até 9, são dos consumíveis). */
export const HABILIDADES_NO_TECLADO = 6;

/** A posição (0 a 5) da habilidade ou (6 a 9) do consumível de uma ação de atalho; −1 nas outras. */
export function indiceDoAtalhoDaAcao(acao: AcaoTeclado): number {
  const m = /^(habilidade|consumivel)(\d)$/.exec(acao);
  if (!m) return -1;
  const n = Number(m[2]) - 1;
  return m[1] === 'habilidade' ? n : HABILIDADES_NO_TECLADO + n;
}

/** A ação de atalho da posição (0 a 9: as 6 habilidades e os 4 consumíveis). */
export function acaoDoAtalho(indice: number): AcaoTeclado | null {
  const acao = indice < HABILIDADES_NO_TECLADO ? `habilidade${String(indice + 1)}` : `consumivel${String(indice - HABILIDADES_NO_TECLADO + 1)}`;
  return indice >= 0 && (ACOES_DO_TECLADO as readonly string[]).includes(acao) ? (acao as AcaoTeclado) : null;
}

/** Os nomes curtos de teclas que não são letra nem número (o Espaço e o Enter vêm do dicionário, na interface). */
const NOMES: Readonly<Record<string, string>> = {
  ShiftLeft: 'Shift', ControlLeft: 'Ctrl', AltLeft: 'Alt', MetaLeft: 'Meta', Escape: 'Esc', Backspace: 'Backspace',
  CapsLock: 'Caps', Backquote: '`', Minus: '-', Equal: '=', BracketLeft: '[', BracketRight: ']', Backslash: '\\',
  Semicolon: ';', Quote: "'", Comma: ',', Period: '.', Slash: '/', IntlBackslash: '\\', IntlRo: '/',
  NumpadAdd: 'Num +', NumpadSubtract: 'Num -', NumpadMultiply: 'Num *', NumpadDivide: 'Num /', NumpadDecimal: 'Num ,',
  Insert: 'Ins', Delete: 'Del', Home: 'Home', End: 'End', PageUp: 'PgUp', PageDown: 'PgDn',
};

/** O nome curto da tecla para mostrar (KeyX vira X, Digit1 vira 1, ShiftLeft vira Shift); o Espaço e o Enter ficam com quem chama. */
export function nomeCurtoDaTecla(codigo: string): string {
  const c = normalizarCodigo(codigo);
  const letra = /^Key([A-Z])$/.exec(c);
  if (letra?.[1]) return letra[1];
  const numero = /^Digit(\d)$/.exec(c);
  if (numero?.[1]) return numero[1];
  if (/^F\d{1,2}$/.test(c)) return c;
  return NOMES[c] ?? c;
}
