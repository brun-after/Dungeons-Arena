// Marco 21 (23/10/2026, D-088): aviso de versão nova do app Android a partir da Release do GitHub.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { atualizacaoDisponivel, lerRelease, procurarAtualizacao, versaoDoApp } from '../../src/plataforma/atualizacao';

const URL_APK = 'https://github.com/brun-after/Dungeons-Arena/releases/download/android-v42/dungeons-arena.apk';
const release = (tag: string, url = URL_APK) => ({ tag_name: tag, assets: [{ name: 'notas.txt', browser_download_url: 'x' }, { name: 'dungeons-arena.apk', browser_download_url: url }] });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('Release do app', () => {
  it('lê a versão da tag e o APK do próprio repositório', () => {
    expect(lerRelease(release('android-v42'))).toEqual({ versao: 42, urlApk: URL_APK });
  });

  it('recusa tag de outro formato, APK de fora e resposta malformada', () => {
    expect(lerRelease(release('v42'))).toBeNull();
    expect(lerRelease(release('android-v42', 'https://exemplo.com/app.apk'))).toBeNull();
    expect(lerRelease({ tag_name: 'android-v1' })).toBeNull();
    expect(lerRelease(null)).toBeNull();
    expect(lerRelease('android-v1')).toBeNull();
  });

  it('só avisa quando a publicada é maior que a instalada (e o app tem versão)', () => {
    const p = { versao: 42, urlApk: URL_APK };
    expect(atualizacaoDisponivel(41, p)).toBe(p);
    expect(atualizacaoDisponivel(42, p)).toBeNull();
    expect(atualizacaoDisponivel(50, p)).toBeNull();
    expect(atualizacaoDisponivel(0, p)).toBeNull();
    expect(atualizacaoDisponivel(41, null)).toBeNull();
  });

  it('a versão do app vem do build; sem ela, 0', () => {
    vi.stubEnv('VITE_VERSAO_APP', '17');
    expect(versaoDoApp()).toBe(17);
    vi.stubEnv('VITE_VERSAO_APP', '');
    expect(versaoDoApp()).toBe(0);
  });

  it('fora do app não consulta o GitHub', async () => {
    const buscar = vi.fn();
    vi.stubGlobal('fetch', buscar);
    vi.stubEnv('VITE_VERSAO_APP', '1');
    expect(await procurarAtualizacao()).toBeNull();
    expect(buscar).not.toHaveBeenCalled();
  });

  it('no app, consulta uma vez por sessão e avisa da versão maior', async () => {
    const guardado = new Map<string, string>();
    vi.stubGlobal('sessionStorage', { getItem: (k: string) => guardado.get(k) ?? null, setItem: (k: string, v: string) => guardado.set(k, v) });
    vi.stubGlobal('Capacitor', { isNativePlatform: () => true });
    vi.stubEnv('VITE_VERSAO_APP', '41');
    const buscar = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(release('android-v42')) }));
    vi.stubGlobal('fetch', buscar);
    expect(await procurarAtualizacao()).toEqual({ versao: 42, urlApk: URL_APK });
    expect(await procurarAtualizacao()).toEqual({ versao: 42, urlApk: URL_APK });
    expect(buscar).toHaveBeenCalledTimes(1);
  });
});
