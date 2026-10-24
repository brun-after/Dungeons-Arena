// Aviso de versão nova do app Android (marco 21, 23/10/2026, D-088). O APK leva o número da execução do workflow
// (VITE_VERSAO_APP); a Release mais recente do GitHub se chama `android-vN` e traz o APK. Ao abrir o menu, o app
// pergunta uma vez à API pública do GitHub (sem conta, sem dado do jogador) e, se houver versão maior, mostra o
// aviso com o link do APK. O Android não deixa um app de fora da loja se atualizar sozinho: a pessoa toca em instalar.

import { ehAppNativo } from './nativo';

const API_ULTIMA = 'https://api.github.com/repos/brun-after/Dungeons-Arena/releases/latest';
const CHAVE_SESSAO = 'dungeons-arena:atualizacao';

export interface VersaoPublicada {
  versao: number;
  urlApk: string;
}

/** A versão deste APK (0 fora do app ou num build local sem número). */
export function versaoDoApp(): number {
  const v = Number(import.meta.env.VITE_VERSAO_APP);
  return Number.isInteger(v) && v > 0 ? v : 0;
}

/** Lê a resposta da API (dado de fora: confere cada campo). Só aceita APK hospedado no próprio GitHub. */
export function lerRelease(json: unknown): VersaoPublicada | null {
  if (typeof json !== 'object' || json === null) return null;
  const r = json as { tag_name?: unknown; assets?: unknown };
  const m = typeof r.tag_name === 'string' ? /^android-v(\d+)$/.exec(r.tag_name) : null;
  if (!m || !Array.isArray(r.assets)) return null;
  for (const a of r.assets as unknown[]) {
    if (typeof a !== 'object' || a === null) continue;
    const { name, browser_download_url: url } = a as { name?: unknown; browser_download_url?: unknown };
    if (typeof name === 'string' && name.endsWith('.apk') && typeof url === 'string' && url.startsWith('https://github.com/brun-after/Dungeons-Arena/releases/download/')) {
      return { versao: Number(m[1]), urlApk: url };
    }
  }
  return null;
}

/** Há versão maior que a instalada? (null: não há, não é o app, ou não deu para saber.) */
export function atualizacaoDisponivel(atual: number, publicada: VersaoPublicada | null): VersaoPublicada | null {
  return atual > 0 && publicada && publicada.versao > atual ? publicada : null;
}

/** Pergunta ao GitHub uma vez por sessão do app. Falha de rede: sem aviso. */
export async function procurarAtualizacao(): Promise<VersaoPublicada | null> {
  if (!ehAppNativo() || versaoDoApp() === 0) return null;
  let publicada: VersaoPublicada | null;
  try {
    const guardada = sessionStorage.getItem(CHAVE_SESSAO);
    if (guardada !== null) publicada = lerRelease(JSON.parse(guardada));
    else {
      const resposta = await fetch(API_ULTIMA, { headers: { Accept: 'application/vnd.github+json' } });
      if (!resposta.ok) return null;
      publicada = lerRelease(await resposta.json());
      // Guarda só o necessário, no mesmo formato da API (para ler de volta com a mesma conferência).
      const minimo = publicada ? { tag_name: `android-v${publicada.versao}`, assets: [{ name: 'dungeons-arena.apk', browser_download_url: publicada.urlApk }] } : {};
      sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(minimo));
    }
  } catch {
    return null;
  }
  return atualizacaoDisponivel(versaoDoApp(), publicada);
}

/** Abre o download do APK no navegador do sistema (o Android cuida da instalação). */
export async function baixarAtualizacao(url: string): Promise<void> {
  const { Browser } = await import('@capacitor/browser');
  await Browser.open({ url });
}
