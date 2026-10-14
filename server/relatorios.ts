// Relatórios do teste com pessoas (§5.7). Marco 7A (13/10/2026), D-044.
//   POST /relatorios  (corpo text/plain com o JSON, para o navegador não precisar de preflight)
// Valida antes de gravar (`lerRelatorio`), limita tamanho e frequência por origem e acrescenta uma
// linha em `<dir>/relatorios.jsonl`. Não grava IP nem cabeçalho algum: só o relatório e a data.

import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { lerRelatorio, MAX_BYTES_RELATORIO } from '../src/pesquisa/relatorio';
import type { LimiteDeTentativas } from './codigo-sala';

/** Origens que podem enviar pelo navegador: o Pages e o desenvolvimento local. */
export function origemPermitida(origem: string | null): boolean {
  if (origem === null) return true; // ferramentas e testes (sem navegador)
  return origem === 'https://brun-after.github.io' || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origem);
}

export type ResultadoEnvio = { status: 201 } | { status: 400 | 403 | 413 | 429; motivo: string };

export interface OpcoesRelatorios {
  dir: string;
  limite: LimiteDeTentativas;
}

export async function receberRelatorio(
  o: OpcoesRelatorios,
  pedido: { origem: string | null; chaveLimite: string; tamanho: number | null; texto: () => Promise<string> },
  agoraMs: number,
): Promise<ResultadoEnvio> {
  if (!origemPermitida(pedido.origem)) return { status: 403, motivo: 'origem' };
  if (pedido.tamanho !== null && pedido.tamanho > MAX_BYTES_RELATORIO) return { status: 413, motivo: 'grande_demais' };
  if (!o.limite.permitir(pedido.chaveLimite, agoraMs)) return { status: 429, motivo: 'muitos_envios' };
  const texto = await pedido.texto();
  if (texto.length > MAX_BYTES_RELATORIO) return { status: 413, motivo: 'grande_demais' };
  let bruto: unknown;
  try {
    bruto = JSON.parse(texto);
  } catch {
    return { status: 400, motivo: 'json_invalido' };
  }
  const relatorio = lerRelatorio(bruto);
  if (!relatorio) return { status: 400, motivo: 'malformado' };
  await mkdir(o.dir, { recursive: true });
  await appendFile(path.join(o.dir, 'relatorios.jsonl'), `${JSON.stringify({ recebidoEm: new Date(agoraMs).toISOString(), ...relatorio })}\n`);
  return { status: 201 };
}
