// Leitura do Grimório das Classes (marco 24, 24/10/2026): avalia o bloco de dados da página (JavaScript puro, sem DOM),
// que monta D e aplica as versões 1.1 e 1.2. Usado por gerar-doc.mjs e gerar-dados.mjs.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const aqui = dirname(fileURLToPath(import.meta.url));
export const raiz = join(aqui, '..', '..');
export const html = readFileSync(join(aqui, 'grimorio-das-classes.html'), 'utf8');

const linhas = html.split('\n');
const ini = linhas.findIndex((l) => l.startsWith('  var D = '));
const fim = linhas.findIndex((l) => l.startsWith('  var S = D.skills;'));
if (ini < 0 || fim < 0) throw new Error('Grimório sem o bloco de dados esperado');
export const D = new Function(`${linhas.slice(ini, fim).join('\n')}\nreturn D;`)();
export const versao = /versão (\d+\.\d+)/.exec(html)?.[1] ?? '?';

/** O id que o código usa (a v1.2 renomeou algumas skills do Guerreiro). */
export const idCodigo = (id) => (id === '@ultimate' ? id : (D.skills[id]?.idNovo ?? id));
export const nome = (id) => (id === '@ultimate' ? 'Ultimate' : (D.skills[id]?.nome ?? id));
