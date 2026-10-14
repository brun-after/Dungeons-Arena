// Resumo dos relatórios do teste com pessoas (§5.7). Marco 7A (13/10/2026).
//   npm run relatorios -- relatorios.jsonl
// Lê o arquivo baixado da VM (docs/TESTES-HUMANOS.md), descarta linhas inválidas e imprime, em
// Markdown, uma linha por pessoa, o agregado e os critérios da §5.7 marcados ✓/✗.

import { readFileSync } from 'node:fs';
import { concluiuPrimeiroEncontro, lerRelatorio, reconheceuOsTresAvisos, type RelatorioPesquisa } from '../../src/pesquisa/relatorio';

export interface Criterio {
  nome: string;
  valor: number;
  meta: number;
  ok: boolean;
}

export function lerArquivo(texto: string): { relatorios: RelatorioPesquisa[]; invalidas: number } {
  const relatorios: RelatorioPesquisa[] = [];
  let invalidas = 0;
  for (const linha of texto.split('\n')) {
    if (linha.trim() === '') continue;
    try {
      const r = lerRelatorio(JSON.parse(linha));
      if (r) relatorios.push(r);
      else invalidas++;
    } catch {
      invalidas++;
    }
  }
  return { relatorios, invalidas };
}

/** Critérios da §5.7: ≥ 5 pessoas, ≥ 3 no toque, ≥ 4 concluíram o 1º encontro e ≥ 4 reconheceram os 3 avisos. */
export function criterios(rs: readonly RelatorioPesquisa[]): Criterio[] {
  const c = (nome: string, valor: number, meta: number): Criterio => ({ nome, valor, meta, ok: valor >= meta });
  return [
    c('pessoas', rs.length, 5),
    c('no celular (toque)', rs.filter((r) => r.plataforma.toque).length, 3),
    c('concluíram o primeiro encontro', rs.filter(concluiuPrimeiroEncontro).length, 4),
    c('reconheceram os 3 avisos', rs.filter(reconheceuOsTresAvisos).length, 4),
  ];
}

const sn = (b: boolean) => (b ? 'sim' : 'não');
const seg = (v: number | null) => (v === null ? '—' : `${Math.round(v)} s`);

export function tabela(rs: readonly RelatorioPesquisa[]): string {
  const linhas = [
    '| # | Aparelho | Duração | 1ª luta | Mortes | Abates | Habilidades | Equipou | Nível | Voltou a lutar | Boss | Avisos (área/linha/projétil) | Itens? |',
    '|---|---|---|---|---|---|---|---|---|---|---|---|---|',
  ];
  rs.forEach((r, i) => {
    const m = r.medidas;
    const habilidades = Object.values(m.habilidades).reduce((s, v) => s + v, 0);
    const a = r.respostas.avisos;
    linhas.push(
      `| ${i + 1} | ${r.plataforma.toque ? 'toque' : 'desktop'} ${r.plataforma.largura}×${r.plataforma.altura} | ${seg(m.duracaoS)} | ${seg(m.tempoAtePrimeiraLutaS)} | ${m.mortes} | ${m.abates} | ${habilidades} | ${seg(m.equipouEmS)} | ${m.nivelFinal} | ${sn(m.voltouALutarDepoisDeMelhorar)} | ${m.bossDerrotado ? 'derrotado' : m.viuBoss ? 'viu' : 'não'} | ${a.area}/${a.linha}/${a.projetil} | ${r.respostas.entendeuEquipamento} |`,
    );
  });
  return linhas.join('\n');
}

function principal(): void {
  const arquivo = process.argv[2];
  if (!arquivo) {
    console.error('uso: npm run relatorios -- relatorios.jsonl');
    process.exit(2);
  }
  const { relatorios, invalidas } = lerArquivo(readFileSync(arquivo, 'utf8'));
  console.log(`## Relatórios (${relatorios.length} válidos${invalidas > 0 ? `, ${invalidas} linha(s) inválida(s) ignorada(s)` : ''})\n`);
  console.log(tabela(relatorios));
  console.log('\n### Critérios da §5.7\n');
  for (const c of criterios(relatorios)) console.log(`- ${c.ok ? '✓' : '✗'} ${c.nome}: ${c.valor} (meta ≥ ${c.meta})`);
  const comentarios = relatorios.map((r) => r.respostas.comentario.trim()).filter((x) => x !== '');
  if (comentarios.length > 0) {
    console.log('\n### Comentários\n');
    for (const c of comentarios) console.log(`- ${c.replace(/\s+/g, ' ')}`);
  }
}

if (process.argv[1]?.includes('resumo')) principal();
