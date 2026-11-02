import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import manifesto from '../../public/audio/manifesto.json';
import { AMBIENTES, BancoDeGravacoes, EFEITOS, GRAVACOES, musicaDaCena, urlDaGravacao } from '../../src/audio/gravacoes';
import { SONS, sonsDoEvento } from '../../src/audio/mapeamento';
import { CONTEUDO } from '../apoio/fases';

const raiz = new URL('../../public/audio/', import.meta.url);

describe('biblioteca de áudio importada', () => {
  it('todos os eventos e ambientes resolvem para gravações locais com licença e hash válidos', () => {
    for (const som of SONS) expect(EFEITOS[som].length).toBeGreaterThan(0);
    const ids = [...Object.values(EFEITOS).flat(), ...Object.values(AMBIENTES), ...Object.values(manifesto.musicas).flat()];
    for (const id of ids) expect(GRAVACOES[id]).toBeDefined();
    for (const [id, gravacao] of Object.entries(manifesto.arquivos)) {
      const caminho = new URL(gravacao.arquivo, raiz);
      expect(existsSync(caminho)).toBe(true);
      expect(createHash('sha256').update(readFileSync(caminho)).digest('hex')).toBe(gravacao.sha256);
      expect(gravacao.duracao).toBeGreaterThan(0);
      const fonte = manifesto.fontes[gravacao.fonte as keyof typeof manifesto.fontes];
      expect(fonte.autor.length).toBeGreaterThan(0);
      expect(fonte.licencaUrl).toMatch(/^https:\/\/creativecommons.org\//);
      expect(urlDaGravacao(id)).not.toMatch(/^https?:/);
    }
  });
  it('as músicas escolhidas são gravações completas e variam por clima/profundidade', () => {
    for (const clima of ['exploracao', 'combate', 'chefe'] as const) {
      for (let v = 0; v < 3; v++) {
        const id = musicaDaCena('fase-01', clima, 0.2, v);
        expect(manifesto.musicas[clima]).toContain(id);
        expect(GRAVACOES[id]?.duracao).toBeGreaterThan(30);
      }
    }
    expect(musicaDaCena('fase-01', 'exploracao', 0.9, 0)).toBe('musica-caverna');
  });
  it('o arco soa no lançamento; o contato usa uma gravação de impacto diferente', () => {
    const h = CONTEUDO.habilidades.get('flecha');
    if (!h) throw new Error('flecha ausente');
    const buscar = () => ({ ...h, elemento: null, tipoAtaque: 'fisico' as const });
    expect(sonsDoEvento({ t: 'projetilLancado', tick: 1, projetilId: 1, acaoId: 1, donoId: 'j', habilidadeId: 'flecha', chave: 'flecha' }, 'j', buscar)[0]?.som).toBe('arco');
    expect(sonsDoEvento({ t: 'impacto', tick: 2, acaoId: 1, fonteId: 'j', alvoId: 'a', habilidadeId: 'flecha', chave: 'flecha', dano: 3, cura: 0, d20: 12, mult: 1, falha: false, critico: false, imune: false, indice: 0, sinergias: [] }, 'j', buscar)[0]?.som).toBe('acerto_projetil');
  });
});

describe('carregamento de gravações', () => {
  it('compartilha downloads concorrentes e permite tentar de novo após falha', async () => {
    const buffer = {} as AudioBuffer;
    const decode = vi.fn().mockResolvedValue(buffer);
    const fetcher = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) });
    vi.stubGlobal('fetch', fetcher);
    const banco = new BancoDeGravacoes({ decodeAudioData: decode } as unknown as BaseAudioContext);
    try {
      const primeiro = banco.carregar('clique-1');
      expect(banco.carregar('clique-1')).toBe(primeiro);
      await expect(primeiro).rejects.toThrow('offline');
      await expect(banco.carregar('clique-1')).resolves.toBe(buffer);
      await banco.carregar('clique-1');
      expect(fetcher).toHaveBeenCalledTimes(2);
      expect(decode).toHaveBeenCalledTimes(1);
    } finally { banco.destruir(); vi.unstubAllGlobals(); }
  });
  it('não repovoa o cache se for destruído enquanto decodifica', async () => {
    let concluir: ((buffer: AudioBuffer) => void) | undefined;
    const decode = vi.fn(() => new Promise<AudioBuffer>((resolve) => { concluir = resolve; }));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) }));
    const banco = new BancoDeGravacoes({ decodeAudioData: decode } as unknown as BaseAudioContext);
    try {
      const tarefa = banco.carregar('clique-1');
      await vi.waitFor(() => { expect(concluir).toBeDefined(); });
      banco.destruir(); concluir?.({} as AudioBuffer);
      await expect(tarefa).rejects.toThrow('encerrado');
      expect(banco.pronto('clique-1')).toBeUndefined();
    } finally { banco.destruir(); vi.unstubAllGlobals(); }
  });
});
