import { beforeEach, describe, expect, it, vi } from 'vitest';
import { criarNuvemSupabase } from '../../src/plataforma/nuvem';

const mocks = vi.hoisted(() => ({ getSession: vi.fn(), rpc: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({ auth: { getSession: mocks.getSession }, rpc: mocks.rpc }) }));

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getSession.mockResolvedValue({ data: { session: { user: { id: 'conta', user_metadata: { full_name: 'Nome Pessoal' } } } } });
});

describe('descobertas públicas por pseudônimo', () => {
  it('envia somente a entrada e usa a autoria calculada pelo servidor', async () => {
    mocks.rpc.mockResolvedValue({ data: [{ nome: 'Explorador abc12345', criado_em: '2026-10-17T18:00:00Z', minha: false }], error: null });
    const nuvem = criarNuvemSupabase('https://teste.invalid', 'chave-publica');
    expect(await nuvem.registrarDescoberta('combo:moedor')).toEqual({ nome: 'Explorador abc12345', em: Date.parse('2026-10-17T18:00:00Z'), minha: false });
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith('registrar_descoberta', { p_entrada: 'combo:moedor' });
  });

  it('sem login não registra nada', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: null } });
    expect(await criarNuvemSupabase('https://teste.invalid', 'chave').registrarDescoberta('combo:moedor')).toBeNull();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('falha da migração ou da rede não publica dados nem quebra o jogo', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: 'função ausente' } });
    expect(await criarNuvemSupabase('https://teste.invalid', 'chave').registrarDescoberta('combo:moedor')).toBeNull();
  });
});
