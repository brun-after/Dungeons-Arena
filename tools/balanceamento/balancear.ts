// Simulador de balanceamento (marco 15, 15/10/2026, D-061): `npm run balancear [-- --sementes 8 --registrar]`.
// Roda os cenários de simulador.ts contra as metas de `balance.metas`, imprime as tabelas com cada critério aprovado
// ou reprovado e, com `--registrar`, grava docs/BALANCEAMENTO.md. Sai com código 1 se alguma meta falhar.

import { writeFileSync } from 'node:fs';
import { BALANCE_PADRAO } from '../../src/core/contexto';
import { DIFICULDADES } from '../../src/modos/dificuldade';
import { CLASSES, aguenta, avisos, chefe, desequipar, dispersar, dueloDeFichas, equipar, fatiaDaInvocacao, mediana, economiaPorMinuto, pvpLivre, semAjuste, sequencia, xpPorMinuto } from './simulador';

const args = process.argv.slice(2);
const valor = (nome: string, padrao: number) => {
  const i = args.indexOf(`--${nome}`);
  const v = i >= 0 ? Number(args[i + 1]) : NaN;
  return Number.isFinite(v) ? v : padrao;
};
const SEMENTES = Array.from({ length: valor('sementes', 8) }, (_, i) => 1000 + i * 7919);
const NIVEIS = [1, 5, 10];
/** Os duelos de build decidem por vitória: o dobro de sementes, para o d20 não decidir sozinho. */
const SEMENTES_DUELO = Array.from({ length: SEMENTES.length * 2 }, (_, i) => 3000 + i * 7919);
const metas = BALANCE_PADRAO.metas;
const r1 = (v: number) => Math.round(v * 10) / 10;
const br = (v: number) => String(r1(v)).replace('.', ',');

interface Criterio {
  nome: string;
  valor: string;
  meta: string;
  ok: boolean;
}
const criterios: Criterio[] = [];
const conferir = (nome: string, v: number, min: number, max: number, unidade = '') => {
  criterios.push({ nome, valor: `${br(v)}${unidade}`, meta: `${br(min)}–${br(max)}${unidade}`, ok: v >= min && v <= max });
};
const linhas: string[] = [];
const tabela = (titulo: string, cabecalho: string[], corpo: string[][]) => {
  linhas.push(`### ${titulo}`, '', `| ${cabecalho.join(' | ')} |`, `|${cabecalho.map(() => '---').join('|')}|`, ...corpo.map((l) => `| ${l.join(' | ')} |`), '');
};

// 1. Inimigo comum do mesmo nível, em sequência (recargas e mana seguem de uma luta para a outra): golpes e tempo.
const corpoComum: string[][] = [];
for (const classe of CLASSES) {
  for (const nivel of NIVEIS) {
    const golpes: number[] = [];
    const tempos: number[] = [];
    let derrotas = 0;
    for (const s of SEMENTES) {
      for (const r of sequencia(classe, nivel, metas.comuns, s)) {
        if (!r.venceu) derrotas++;
        golpes.push(r.golpes);
        tempos.push(r.tempoS);
      }
    }
    const g = mediana(golpes);
    const t = mediana(tempos);
    conferir(`comum: ${classe} nível ${nivel}, golpes`, g, metas.comum.golpesMin, metas.comum.golpesMax);
    conferir(`comum: ${classe} nível ${nivel}, tempo`, t, metas.comum.tempoMinS, metas.comum.tempoMaxS, ' s');
    corpoComum.push([classe, String(nivel), br(g), `${br(t)} s`, String(derrotas)]);
  }
}
tabela('Inimigo comum do mesmo nível, lutas em sequência (mediana)', ['Classe', 'Nível', 'Golpes', 'Tempo', 'Derrotas do jogador'], corpoComum);

// 2. Quanto o jogador aguenta de um comum (parado, sem revidar).
const corpoAguenta: string[][] = [];
for (const classe of CLASSES) {
  for (const nivel of NIVEIS) {
    const golpes: number[] = [];
    const tempos: number[] = [];
    for (const preset of metas.comuns) {
      for (const s of SEMENTES.slice(0, 4)) {
        const r = aguenta(classe, nivel, preset, s);
        golpes.push(r.golpes);
        tempos.push(r.tempoS);
      }
    }
    const g = mediana(golpes);
    conferir(`aguenta: ${classe} nível ${nivel}, golpes`, g, metas.aguenta.golpesMin, metas.aguenta.golpesMax);
    corpoAguenta.push([classe, String(nivel), br(g), `${br(mediana(tempos))} s`]);
  }
}
tabela('Quanto o jogador aguenta de um comum (mediana)', ['Classe', 'Nível', 'Golpes recebidos', 'Tempo'], corpoAguenta);

// 3. Chefe: solo no nível esperado e em grupo (a escala do grupo).
const corpoChefe: string[][] = [];
const solo: Record<string, number> = {};
for (const classe of CLASSES) {
  for (const n of [1, 2, 4, 6]) {
    const tempos: number[] = [];
    let derrotas = 0;
    const rodadas = SEMENTES;
    for (const s of rodadas) {
      const r = chefe(classe, metas.chefe.nivelJogador, s, n, 'normal', metas.chefe.nivelChefe);
      // O tempo do chefe só conta nas vitórias (na derrota, mede-se a morte do grupo).
      if (r.venceu) tempos.push(r.tempoS);
      else derrotas++;
    }
    const t = mediana(tempos);
    if (n === 1) {
      solo[classe] = t;
      conferir(`chefe: ${classe} sozinho, tempo (vitórias)`, t, metas.chefe.tempoMinS, metas.chefe.tempoMaxS, ' s');
      conferir(`chefe: ${classe} sozinho, % de vitórias`, (100 * (rodadas.length - derrotas)) / rodadas.length, 50, 100, '%');
    } else {
      const pct = solo[classe] ? (100 * t) / (solo[classe] ?? t) : 0;
      conferir(`chefe: ${classe} em grupo de ${n}, % do solo`, pct, metas.grupo.tempoMinPctDoSolo, metas.grupo.tempoMaxPctDoSolo, '%');
    }
    corpoChefe.push([classe, String(n), `${br(t)} s`, String(derrotas)]);
  }
}
tabela(`Chefe (nível ${metas.chefe.nivelChefe}, como na fase 1; jogadores no nível ${metas.chefe.nivelJogador}; grupo com classes misturadas)`, ['Classe', 'Grupo', 'Tempo', 'Derrotas do grupo'], corpoChefe);

// 4. Dificuldades: o degrau (o aventureiro no nível 5 contra os comuns; o chefe sozinho).
const corpoDif: string[][] = [];
for (const d of DIFICULDADES) {
  const tempos: number[] = [];
  const aguentou: number[] = [];
  for (const s of SEMENTES.slice(0, 4)) {
    for (const r of sequencia('aventureiro', 5, metas.comuns, s, d)) tempos.push(r.tempoS);
    for (const preset of metas.comuns) aguentou.push(aguenta('aventureiro', 5, preset, s, d).golpes);
  }
  const chefes = SEMENTES.slice(0, 4).map((s) => chefe('aventureiro', metas.chefe.nivelJogador, s, 1, d, metas.chefe.nivelChefe));
  const vitorias = chefes.filter((c) => c.venceu);
  corpoDif.push([
    d,
    `${br(mediana(tempos))} s`,
    br(mediana(aguentou)),
    vitorias.length > 0 ? `${br(mediana(vitorias.map((c) => c.tempoS)))} s` : '—',
    `${chefes.length - vitorias.length}/${chefes.length}`,
  ]);
}
tabela('Dificuldades (aventureiro; comum no nível 5, chefe sozinho)', ['Dificuldade', 'Tempo no comum', 'Golpes que aguenta', 'Chefe (vitórias)', 'Derrotas no chefe'], corpoDif);

// 5. PvP no Livre.
const corpoPvp: string[][] = [];
for (const classe of CLASSES) {
  const t = mediana(SEMENTES.map((s) => pvpLivre(classe, s, metas.pvpLivre.nivel).tempoS));
  conferir(`PvP Livre: ${classe} contra ${classe}, tempo`, t, metas.pvpLivre.tempoMinS, metas.pvpLivre.tempoMaxS, ' s');
  corpoPvp.push([classe, `${br(t)} s`]);
}
tabela(`PvP no Livre (nível ${metas.pvpLivre.nivel}, com o clamp do modo)`, ['Classe', 'Tempo para cair'], corpoPvp);

// 6. Aviso útil de cada habilidade inimiga.
const corpoAviso = avisos().map((a) => {
  criterios.push({ nome: `aviso útil: ${a.habilidade} (suportado)`, valor: `${a.suportadoMs} ms`, meta: `≥ ${metas.avisoUtilMinMs} ms`, ok: a.suportadoMs >= metas.avisoUtilMinMs });
  return [a.habilidade, a.presets.join(', '), `${a.conjuracaoMs} ms`, `${a.suportadoMs} ms`, `${a.degradadoMs} ms`];
});
tabela('Aviso útil das habilidades inimigas (p95 aproximado da rede)', ['Habilidade', 'Quem usa', 'Conjuração', 'Suportado (150 ms)', 'Degradado (250 ms)'], corpoAviso);

// 7. Marco 17: quem upou bem chega forte (arena com a ficha inteira, mesma classe e nível).
const corpoBuild: string[][] = [];
for (const classe of CLASSES) {
  const pct = (montarA: Parameters<typeof dueloDeFichas>[3], montarB: Parameters<typeof dueloDeFichas>[4]) =>
    (100 * SEMENTES_DUELO.filter((s) => dueloDeFichas(classe, metas.build.nivel, s, montarA, montarB)).length) / SEMENTES_DUELO.length;
  const focada = pct(semAjuste, dispersar);
  const equipado = pct(equipar('raro'), desequipar);
  conferir(`build: ${classe} focada vence a dispersa`, focada, metas.build.vitoriasMinPct, 100, '%');
  conferir(`build: ${classe} equipado vence o sem equipamento`, equipado, metas.build.vitoriasMinPct, 100, '%');
  corpoBuild.push([classe, `${br(focada)}%`, `${br(equipado)}%`]);
}
tabela(`Builds na arena (ficha inteira, nível ${metas.build.nivel})`, ['Classe', 'Focada vence a dispersa', 'Equipado (raro) vence o sem equipamento'], corpoBuild);

// 7. Invocação e economia (informativos e a fatia da invocação).
const fatia = mediana(SEMENTES.map((s) => fatiaDaInvocacao(5, s)));
conferir('invocação: fatia do dano (lobo, nível 5)', fatia, metas.invocacao.fatiaMinPct, metas.invocacao.fatiaMaxPct, '%');
const corpoXp = CLASSES.map((c) => {
  const xp = xpPorMinuto(c, 5, SEMENTES[0] ?? 1, metas.comuns);
  return [c, br(xp), br(xp * BALANCE_PADRAO.drops.ouroPorXp)];
});
tabela('Economia (nível 5, comuns em sequência)', ['Classe', 'XP por minuto', 'Ouro por minuto (estimado)'], [...corpoXp, ['invocação', `${br(fatia)}% do dano`, '—']]);

// D-075 (17/10/2026): faixa avançada informativa; compara builds e mede XP/min com combate real.
const corpoAvancado: string[][] = [];
const corpoXpAvancado: string[][] = [];
const corpoOuroAvancado: string[][] = [];
for (const classe of CLASSES) for (const nivel of [20, 25, 30]) {
  const focada: Parameters<typeof sequencia>[5] = (e, ctx) => { equipar('raro')(e, ctx); };
  const dispersa: Parameters<typeof sequencia>[5] = (e, ctx) => { dispersar(e, ctx); equipar('raro')(e, ctx); };
  for (const [nome, montar] of [['focada', focada], ['dispersa', dispersa]] as const) {
    const r = SEMENTES.slice(0, 2).flatMap((s) => sequencia(classe, nivel, metas.comuns, s, 'normal', montar));
    corpoAvancado.push([classe, String(nivel), nome, br(mediana(r.map((x) => x.tempoS))), `${r.filter((x) => x.venceu).length}/${r.length}`]);
  }
  const economia = DIFICULDADES.map((d) => economiaPorMinuto(classe, nivel, SEMENTES[0] ?? 1000, metas.comuns, d, focada));
  corpoXpAvancado.push([classe, String(nivel), ...economia.map((e) => br(e.xp))]);
  corpoOuroAvancado.push([classe, String(nivel), ...economia.map((e) => br(e.ouro)), ...[economia[1], economia[3]].map((e) => e && e.ouro > 0 ? br(BALANCE_PADRAO.progressaoItens.tomoPrecoBase / e.ouro) : '—')]);
}
tabela('Faixa avançada (equipamento raro, Normal, duas sementes; informativo)', ['Classe', 'Nível', 'Build', 'Tempo no comum (s)', 'Vitórias'], corpoAvancado);
tabela('XP por minuto na faixa avançada (build focada, equipamento raro; nível 30 é o teto)', ['Classe', 'Nível', 'Fácil', 'Normal', 'Difícil', 'Pesadelo'], corpoXpAvancado);

tabela('Ouro por minuto e custo do primeiro tomo (sem desconto; só ouro direto, sem venda de loot)', ['Classe', 'Nível', 'Fácil', 'Normal', 'Difícil', 'Pesadelo', 'Tomo no Normal (min)', 'Tomo no Pesadelo (min)'], corpoOuroAvancado);

// Saída.
const aprovados = criterios.filter((c) => c.ok).length;
for (const l of linhas) console.log(l);
console.log(`\nMetas: ${aprovados}/${criterios.length} aprovadas`);
for (const c of criterios.filter((x) => !x.ok)) console.log(`  ✗ ${c.nome}: ${c.valor} (meta ${c.meta})`);

if (args.includes('--registrar')) {
  const data = new Date().toISOString().slice(0, 10).split('-').reverse().join('/');
  const doc = [
    '# Balanceamento',
    '',
    `**Versão:** 1.4 · **Data:** ${data}`,
    '',
    '> Gerado por `npm run balancear -- --registrar` (tools/balanceamento, D-061). As metas ficam em',
    '> `src/data/balance.json → metas`; o teste `tests/sim/ritmo.test.ts` protege as principais. Os números que mudaram',
    '> e o antes e depois das calibragens estão em docs/DECISOES.md (D-061, D-071, D-074, D-075, D-076 e D-078).',
    '',
    `Sementes: ${SEMENTES.length} por cenário (${SEMENTES.join(', ')}). Balance versão ${BALANCE_PADRAO.versao}.`,
    '',
    `## Resultado: ${aprovados}/${criterios.length} metas aprovadas`,
    '',
    ...criterios.filter((c) => !c.ok).map((c) => `- ✗ ${c.nome}: ${c.valor} (meta ${c.meta})`),
    '',
    '## Tabelas',
    '',
    ...linhas,
  ].join('\n');
  writeFileSync('docs/BALANCEAMENTO.md', `${doc}\n`);
  console.log('Gravado em docs/BALANCEAMENTO.md');
}
if (aprovados < criterios.length) process.exitCode = 1;
