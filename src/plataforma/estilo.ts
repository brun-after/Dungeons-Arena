// Perfil de estilo do editor (§3.10), só neste aparelho. Marco 11A (16/10/2026), D-066: guardado no store `perfil`
// (chave `estilo`). Somar amostras acontece ao salvar no editor; ler as regras, ao criar a próxima fase gerada (se
// o jogador ligou "Fases geradas no meu estilo") e no botão "Gerar no meu estilo" do editor.

import { lerPerfilEstilo, regrasDoPerfil, registrarAmostras, type PerfilEstilo } from '../world/estilo';
import type { Celula } from '../core/comandos';
import type { Fase } from '../world/fase';
import { gravarNoBanco, lerDoBanco } from './banco';

const CHAVE = 'estilo';

export async function lerPerfil(): Promise<PerfilEstilo> {
  try {
    const r = (await lerDoBanco('perfil', CHAVE)) as { valor?: unknown } | undefined;
    return lerPerfilEstilo(r?.valor);
  } catch {
    return {};
  }
}

/** Soma as células editadas ao perfil; falhar não atrapalha o editor. */
export async function aprenderEstilo(fase: Fase, celulas: readonly Celula[]): Promise<void> {
  if (celulas.length === 0) return;
  try {
    const perfil = registrarAmostras(await lerPerfil(), fase, celulas);
    await gravarNoBanco('perfil', { chave: CHAVE, valor: perfil });
  } catch {
    // Sem armazenamento: o estilo só não aprende.
  }
}

/** As regras atuais do aparelho (vazio se não há perfil ou se ainda não há regra forte). */
export async function regrasDoAparelho(): Promise<string[]> {
  return regrasDoPerfil(await lerPerfil());
}
