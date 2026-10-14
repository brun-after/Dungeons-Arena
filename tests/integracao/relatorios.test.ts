// POST /relatorios no servidor real (marco 7A): grava uma linha por relatório válido, sem IP, e
// recusa o resto com motivo.

import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { criarColetor } from '../../src/pesquisa/coletor';
import { VERSAO_RELATORIO, type RelatorioPesquisa } from '../../src/pesquisa/relatorio';
import { iniciarServidor } from '../../server/servidor';

const dir = mkdtempSync(path.join(tmpdir(), 'relatorios-'));
let base = '';
let encerrar: () => Promise<void> = () => Promise.resolve();

beforeAll(async () => {
  const s = await iniciarServidor({ porta: 0, regiao: 'teste', dirDados: dir });
  base = `http://localhost:${s.porta}`;
  encerrar = s.encerrar;
});

afterAll(async () => {
  await encerrar();
});

const relatorio: RelatorioPesquisa = {
  versao: VERSAO_RELATORIO,
  conteudo: 'abc',
  plataforma: { toque: true, largura: 800, altura: 400, dpr: 2 },
  medidas: criarColetor('j', 0, () => 'comum').medidas(30, 1),
  respostas: { avisos: { area: 'reconheci', linha: 'nao_vi', projetil: 'reconheci' }, entendeuEquipamento: 'sim', comentario: 'legal' },
};

const enviar = (corpo: string, cabecalhos: Record<string, string> = {}) =>
  fetch(`${base}/relatorios`, { method: 'POST', headers: { 'content-type': 'text/plain', ...cabecalhos }, body: corpo });

describe('POST /relatorios', () => {
  it('grava o relatório válido numa linha, com data e sem IP', async () => {
    const r = await enviar(JSON.stringify(relatorio), { origin: 'http://localhost:5173', 'x-forwarded-for': '9.9.9.9' });
    expect(r.status).toBe(201);
    const linhas = readFileSync(path.join(dir, 'relatorios.jsonl'), 'utf8').trim().split('\n');
    expect(linhas).toHaveLength(1);
    const gravado = JSON.parse(linhas[0] ?? '{}') as Record<string, unknown>;
    expect(gravado).toMatchObject({ ...relatorio });
    expect(typeof gravado.recebidoEm).toBe('string');
    expect(linhas[0]).not.toContain('9.9.9.9');
  });

  it('recusa malformado, grande demais e origem desconhecida', async () => {
    expect((await enviar('{nao json', { 'x-forwarded-for': 'a' })).status).toBe(400);
    expect((await enviar(JSON.stringify({ ...relatorio, versao: 0 }), { 'x-forwarded-for': 'a' })).status).toBe(400);
    expect((await enviar('x'.repeat(9000), { 'x-forwarded-for': 'a' })).status).toBe(413);
    expect((await enviar(JSON.stringify(relatorio), { origin: 'https://site-estranho.example', 'x-forwarded-for': 'a' })).status).toBe(403);
  });

  it('limita a 10 envios por minuto por origem', async () => {
    const status: number[] = [];
    for (let i = 0; i < 11; i++) status.push((await enviar(JSON.stringify(relatorio), { 'x-forwarded-for': 'b' })).status);
    expect(status.slice(0, 10).every((s) => s === 201)).toBe(true);
    expect(status[10]).toBe(429);
  });
});
