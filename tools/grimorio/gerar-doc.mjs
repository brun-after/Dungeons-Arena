// Marco 24 (24/10/2026, D-094): o Grimório das Classes (grimorio-das-classes.html, aprovado pelo usuário) é a fonte do
// desenho das skills de classe, ultimates, sintonia, passivas gerais, combos e ressonâncias. Este script avalia os
// dados da página e gera docs/SKILLS-DE-CLASSE.md e o catálogo (catalogo.json) que os testes usam para conferir que
// os dados do jogo seguem o desenho. Uso: node tools/grimorio/gerar-doc.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = join(aqui, '..', '..');
const html = readFileSync(join(aqui, 'grimorio-das-classes.html'), 'utf8');
const linhas = html.split('\n');
const ini = linhas.findIndex((l) => l.startsWith('  var D = '));
const fim = linhas.findIndex((l) => l.startsWith('  var S = D.skills;'));
if (ini < 0 || fim < 0) throw new Error('Grimório sem o bloco de dados esperado');
// O bloco de dados é JavaScript puro (sem DOM): monta D e aplica as versões 1.1 e 1.2.
const D = new Function(`${linhas.slice(ini, fim).join('\n')}\nreturn D;`)();
const versao = /versão (\d+\.\d+)/.exec(html)?.[1] ?? '?';

/** O id que o código usa (a v1.2 renomeou algumas skills do Guerreiro). */
const idCodigo = (id) => (id === '@ultimate' ? id : (D.skills[id]?.idNovo ?? id));
const nome = (id) => (id === '@ultimate' ? 'Ultimate' : (D.skills[id]?.nome ?? id));

const catalogo = {
  versao,
  classes: D.classes.map((c) => ({
    id: c.id,
    skills: c.skills.map(idCodigo),
    iniciais: c.skills.slice(0, 2).map(idCodigo),
    geralInicial: idCodigo(c.geral),
    ultimates: c.pares.map((p) => ({ par: [idCodigo(c.skills[p.a]), idCodigo(c.skills[p.b])], nome: p.nome })),
  })),
  familias: D.gerais.map((g) => ({ id: g.id, ativas: g.ativas.map(idCodigo), passivas: g.passivas.map(idCodigo) })),
  combos: D.combos.filter((c) => c.tipo !== 'sinergia').map((c) => ({ nome: c.nome, classe: c.classe, seq: c.seq.map(idCodigo) })),
  sinergias: D.combos.filter((c) => c.tipo === 'sinergia').map((c) => ({ nome: c.nome, seq: c.seq.map(idCodigo) })),
  ressonancias: D.ressonancias.map((r) => r.nome),
  sintonia: {
    dominios: Object.keys(D.sintonia.dominio),
    vertentes: Object.fromEntries(Object.entries(D.sintonia.vertentes).map(([k, v]) => [k, v.map((x) => ({ nome: x[0], familias: [x[1], x[2]] }))])),
    encarnacoesDuplas: D.sintonia.encarnacaoDupla.map((x) => ({ nome: x[0], elementos: [x[1], x[2]] })),
  },
};
writeFileSync(join(aqui, 'catalogo.json'), `${JSON.stringify(catalogo, null, 2)}\n`);

// ---------- O documento ----------
const out = [];
const p = (s = '') => out.push(s);
const celula = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
p('# Skills de classe, ultimates, sintonia e combos');
p();
p(`**Versão:** ${versao} · **Data:** 24/10/2026`);
p();
p('Gerado por `tools/grimorio/gerar-doc.mjs` a partir do Grimório das Classes (`tools/grimorio/grimorio-das-classes.html`), o');
p('desenho aprovado do marco 24 (D-094 a D-097). Os números finais de cada skill ficam em `src/data`; aqui está a');
p('identidade de cada uma. Para mudar o desenho, edite o Grimório e rode o script de novo.');
p();
p('## Regras');
p();
for (const m of html.matchAll(/<div class="regra"><span class="rotulo">([^<]+)<\/span><h3>([^<]+)<\/h3><p>([\s\S]*?)<\/p><\/div>/g)) {
  p(`- **${m[2]}.** ${m[3].replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').replace(/ v1\.2$/, '').trim()}`);
}
p();
p('## Classes');
for (const c of D.classes) {
  p();
  p(`### ${c.nome}`);
  p();
  p(`${c.tema}. Geral inicial (tecla 3): ${nome(c.geral)}.`);
  p();
  p(`**Passiva: ${c.passiva.nome}.**`);
  p();
  for (const t of c.passiva.proposta) p(`- ${t}`);
  p(`- Visual: ${c.passiva.visualSugestao}`);
  p();
  p('| Skill | Id | O que faz | Visual |');
  p('|---|---|---|---|');
  c.skills.forEach((id, i) => {
    const s = D.skills[id];
    const extra = s.furia ? ` No Frenesi: ${s.furia}` : '';
    const vis = (s.sugestao && s.sugestao.texto) || (s.visual && s.visual.texto) || '';
    p(`| ${i < 2 ? '★ ' : ''}${celula(s.nome)} | \`${idCodigo(id)}\` | ${celula((s.texto ?? '') + extra)} | ${celula(vis)} |`);
  });
  p();
  p(`Linguagem visual das ultimates: ${c.linguagem}`);
  p();
  p('| Par | Ultimate | O que faz |');
  p('|---|---|---|');
  for (const u of c.pares) p(`| ${nome(c.skills[u.a])} + ${nome(c.skills[u.b])} | ${celula(u.nome)} | ${celula(u.texto)} |`);
  p();
  p('**Sintonia** (família das gerais nas teclas 3–6):');
  p();
  for (const [f, t] of Object.entries(D.sintonia.classes[c.id])) p(`- ${f}: ${t}`);
  p();
  p('**Vertentes** (2 + 2):');
  p();
  for (const v of D.sintonia.vertentes[c.id]) p(`- **${v[0]}** (${v[1]} + ${v[2]}): ${v[3]}`);
}
p();
p('### Encarnação dupla do Mago');
p();
p('| Fusão | Elementos | Efeito |');
p('|---|---|---|');
for (const x of D.sintonia.encarnacaoDupla) p(`| ${x[0]} | ${x[1]} + ${x[2]} | ${celula(x[3])} |`);
p();
p('## Domínio (2 gerais da mesma família)');
p();
for (const [f, t] of Object.entries(D.sintonia.dominio)) p(`- ${f}: ${t}`);
p();
p('## Skills gerais');
for (const g of D.gerais) {
  p();
  p(`### ${g.familia}`);
  p();
  p('| Skill | Id | Tipo | O que faz |');
  p('|---|---|---|---|');
  for (const id of g.ativas) { const s = D.skills[id]; p(`| ${s.nome} | \`${idCodigo(id)}\` | ${celula(s.papel ?? 'ativa')} | ${celula(s.texto ?? '')} |`); }
  for (const id of g.passivas) { const s = D.skills[id]; p(`| ${s.nome} | \`${idCodigo(id)}\` | passiva ${s.tipo ?? ''} | ${celula(s.texto ?? '')} |`); }
}
p();
p('### Fusões');
p();
for (const f of D.fusoes) p(`- **${f[0]}**: ${f[1].map(nome).join(' + ')}. ${f[2]}`);
p();
p(`## Combos (${catalogo.combos.length}) e sinergias passivas (${catalogo.sinergias.length})`);
p();
p('| Combo | Quem | Sequência | Efeito |');
p('|---|---|---|---|');
for (const c of D.combos) {
  const seq = c.tipo === 'sinergia' ? `${nome(c.seq[0])} (passiva) + ${c.seq.slice(1).map(nome).join(' › ')}` : c.seq.map(nome).join(' › ');
  p(`| ${celula(c.nome)} | ${c.classe} | ${celula(seq)} | ${celula(c.texto)} |`);
}
p();
p(`## Ressonâncias (${D.ressonancias.length})`);
p();
for (const r of D.ressonancias) p(`- **${r.nome}** (${r.exige}): ${r.texto}`);
p();
writeFileSync(join(raiz, 'docs', 'SKILLS-DE-CLASSE.md'), out.join('\n'));
console.log(`Grimório ${versao}: ${catalogo.classes.length} classes, ${catalogo.combos.length} combos, ${catalogo.sinergias.length} sinergias, ${catalogo.ressonancias.length} ressonâncias.`);
