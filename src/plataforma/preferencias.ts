// Preferências locais do jogador. Marco 6B (13/10/2026): passam do localStorage para o store
// `perfil` do IndexedDB (§3.5, fecha a D-015). A leitura é síncrona, de um cache carregado no
// início por `prepararPreferencias`. Sem IndexedDB, continuam no localStorage; sem nenhum dos
// dois, valem só nesta sessão. Falha de armazenamento nunca quebra o jogo.
// Marco 12 (14/10/2026): gráficos, áudio, câmera e acessibilidade, sempre normalizados (valor fora do
// esperado volta ao padrão).
// Marco 13 (14/10/2026): visão (de cima ou isométrica) e a aparência do personagem por imagem (sentido e
// tamanho neste aparelho, D-058). A imagem em si fica no store `perfil` (plataforma/token.ts).

import { gravarNoBanco, lerDoBanco } from './banco';

export type TipoControle = 'joystick' | 'dpad';
export type ModoCamera = 'janela' | 'centralizada';
export type NivelQualidade = 'minimo' | 'baixo' | 'medio' | 'alto';
/** `auto`: começa pelo padrão do aparelho e desce sozinho se o fps cair (§4.10). */
export type EscolhaQualidade = 'auto' | NivelQualidade;
export type MovimentoReduzido = 'sistema' | 'sempre' | 'nunca';
export type VisaoJogo = 'cima' | 'iso';
/** Para onde a imagem do personagem olha no arquivo original. */
export type SentidoToken = 'direita' | 'esquerda';

export interface Preferencias {
  controle: TipoControle;
  camera: ModoCamera;
  qualidade: EscolhaQualidade;
  /** Tremor, flash, congelamento e soco de zoom (§2.4). */
  efeitosDeTela: boolean;
  /** Enquadrar atacante e alvo (§2.4, só campanha). */
  enquadrarDois: boolean;
  /** Volumes de 0 a 1 (§2.14: música 0,45 e efeitos 0,75 por padrão). */
  volumeMusica: number;
  volumeEfeitos: number;
  mudo: boolean;
  /** Escala da interface, de 0,8 a 1,5 (§5.4). */
  escalaInterface: number;
  movimentoReduzido: MovimentoReduzido;
  visao: VisaoJogo;
  sentidoToken: SentidoToken;
  /** Tamanho do personagem neste aparelho, de 0,8 a 1,3 (§2.16). */
  tamanhoToken: number;
}

export const QUALIDADES: readonly NivelQualidade[] = ['minimo', 'baixo', 'medio', 'alto'];

const CHAVE_LOCAL = 'dungeons-arena:preferencias';
const CHAVE_PERFIL = 'preferencias';
export const PREFERENCIAS_PADRAO: Preferencias = {
  controle: 'joystick',
  camera: 'janela',
  qualidade: 'auto',
  efeitosDeTela: true,
  enquadrarDois: true,
  volumeMusica: 0.45,
  volumeEfeitos: 0.75,
  mudo: false,
  escalaInterface: 1,
  movimentoReduzido: 'sistema',
  visao: 'cima',
  sentidoToken: 'direita',
  tamanhoToken: 1,
};
const PADRAO = PREFERENCIAS_PADRAO;

const numeroEntre = (v: unknown, min: number, max: number, padrao: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : padrao;
const booleano = (v: unknown, padrao: boolean): boolean => (typeof v === 'boolean' ? v : padrao);
const opcao = <T extends string>(v: unknown, validas: readonly T[], padrao: T): T =>
  typeof v === 'string' && (validas as readonly string[]).includes(v) ? (v as T) : padrao;

let cache: Preferencias = { ...PADRAO };
let usarBanco = false;

export function normalizarPreferencias(dados: unknown): Preferencias {
  const d = typeof dados === 'object' && dados !== null ? (dados as Partial<Record<keyof Preferencias, unknown>>) : {};
  return {
    controle: d.controle === 'dpad' ? 'dpad' : 'joystick',
    camera: d.camera === 'centralizada' ? 'centralizada' : 'janela',
    qualidade: opcao(d.qualidade, ['auto', ...QUALIDADES], PADRAO.qualidade),
    efeitosDeTela: booleano(d.efeitosDeTela, PADRAO.efeitosDeTela),
    enquadrarDois: booleano(d.enquadrarDois, PADRAO.enquadrarDois),
    volumeMusica: numeroEntre(d.volumeMusica, 0, 1, PADRAO.volumeMusica),
    volumeEfeitos: numeroEntre(d.volumeEfeitos, 0, 1, PADRAO.volumeEfeitos),
    mudo: booleano(d.mudo, PADRAO.mudo),
    escalaInterface: numeroEntre(d.escalaInterface, 0.8, 1.5, PADRAO.escalaInterface),
    movimentoReduzido: opcao(d.movimentoReduzido, ['sistema', 'sempre', 'nunca'] as const, PADRAO.movimentoReduzido),
    visao: opcao(d.visao, ['cima', 'iso'] as const, PADRAO.visao),
    sentidoToken: opcao(d.sentidoToken, ['direita', 'esquerda'] as const, PADRAO.sentidoToken),
    tamanhoToken: numeroEntre(d.tamanhoToken, 0.8, 1.3, PADRAO.tamanhoToken),
  };
}

function lerLocal(): Preferencias | null {
  try {
    const bruto = localStorage.getItem(CHAVE_LOCAL);
    return bruto ? normalizarPreferencias(JSON.parse(bruto)) : null;
  } catch {
    return null;
  }
}

/** Carrega o cache. Na primeira vez com IndexedDB, migra o que estava no localStorage. */
export async function prepararPreferencias(): Promise<void> {
  try {
    const registro = await lerDoBanco('perfil', CHAVE_PERFIL);
    usarBanco = true;
    if (registro !== undefined) {
      cache = normalizarPreferencias((registro as { valor?: unknown }).valor);
      return;
    }
    const antigas = lerLocal();
    if (antigas) {
      cache = antigas;
      await gravarNoBanco('perfil', { chave: CHAVE_PERFIL, valor: antigas });
      try {
        localStorage.removeItem(CHAVE_LOCAL);
      } catch {
        // Sem localStorage: nada a limpar.
      }
    }
  } catch {
    usarBanco = false;
    cache = lerLocal() ?? { ...PADRAO };
  }
}

export function lerPreferencias(): Preferencias {
  return { ...cache };
}

export function gravarPreferencias(p: Preferencias): void {
  cache = { ...p };
  if (usarBanco) {
    gravarNoBanco('perfil', { chave: CHAVE_PERFIL, valor: cache }).catch(() => {
      // Falhou: a preferência vale só nesta sessão.
    });
    return;
  }
  try {
    localStorage.setItem(CHAVE_LOCAL, JSON.stringify(p));
  } catch {
    // Armazenamento indisponível: a preferência vale só nesta sessão.
  }
}
