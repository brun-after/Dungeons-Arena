// Leitura explicativa do balanceamento (18/10/2026): fatos, experimentos e limites separados.
import type { AmostraCombate, Intervencao } from './diagnostico';
import { compararPares, diferencaDasDiferencas, media, resumir, type ResumoCombate } from './estatisticas';
const br = (v: number) => (Math.round(v * 10) / 10).toLocaleString('pt-BR');
const valor = (v: number | null, unidade = '') => v === null ? '—' : `${br(v)}${unidade}`;
const pct = (parte: number, total: number) => total > 0 ? `${br(100 * parte / total)}%` : '—';
const rotulos: Record<Intervencao, string> = {
  base: 'Completo', sem_cura_basico: 'Sem cura do básico', sem_pocoes: 'Sem poções de vida',
  sem_barra: 'Sem habilidades da barra', sem_defesa: 'Defesa plana zerada',
};
export function grupoDoCenario(a: AmostraCombate): string {
  const c = a.configuracao;
  return `nível ${c.nivel} · ${c.dificuldade} · ${c.cenario}`;
}
function tabela(cabecalho: string[], linhas: string[][]): string[] {
  return [`| ${cabecalho.join(' | ')} |`, `|${cabecalho.map(() => '---').join('|')}|`, ...linhas.map(l => `| ${l.join(' | ')} |`), ''];
}
function explicacao(classeA: string, a: ResumoCombate, classeB: string, b: ResumoCombate): string {
  const m = a.metricasMedias, n = b.metricasMedias;
  const relacao = b.dps > 0 ? `${br(100 * a.dps / b.dps)}% do DPS efetivo de ${classeB}` : 'DPS sem referência positiva';
  return `**${classeA} × ${classeB}:** ${a.mortes}/${a.n} mortes contra ${b.mortes}/${b.n}; ` +
    `${a.limites} contra ${b.limites} limites de tempo. ${classeA} manteve ${relacao}. ` +
    `Por encontro, recebeu ${br(a.recebidoMedio)} contra ${br(b.recebidoMedio)} HP de dano; ` +
    `recuperou ${br(a.curaMedia)} contra ${br(b.curaMedia)} HP (${br(m.curaPocoes)} contra ${br(n.curaPocoes)} de poções), ` +
    `gastando ${br(a.manaMedia)} contra ${br(b.manaMedia)} mana total e ${br(a.vidaGastaMedia)} contra ${br(b.vidaGastaMedia)} HP em conjurações. ` +
    `Começou com ${br(a.hpInicialMedio)} contra ${br(b.hpInicialMedio)} HP e defesa ${br(a.defesaMedia)} contra ${br(b.defesaMedia)}. ` +
    `Escudos absorveram ${br(m.escudoAbsorvido)} contra ${br(n.escudoAbsorvido)}; invocações causaram ${br(m.danoInvocacoes)} contra ${br(n.danoInvocacoes)} de dano ` +
    `e receberam ${br(m.recebidoInvocacoes)} contra ${br(n.recebidoInvocacoes)}. ` +
    `Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.`;
}

function contrasteDosFatores(a: readonly AmostraCombate[], b: readonly AmostraCombate[], todas: readonly AmostraCombate[]): string {
  const primeira = a[0], segunda = b[0];
  if (!primeira || !segunda) return '';
  const variantes = (origem: AmostraCombate, intervencao: Intervencao) => todas.filter(x =>
    grupoDoCenario(x) === grupoDoCenario(origem) && x.configuracao.classe === origem.configuracao.classe && x.configuracao.intervencao === intervencao);
  const resultados = (Object.keys(rotulos) as Intervencao[]).flatMap(intervencao => {
    if (intervencao === 'base') return [];
    let semA = variantes(primeira, intervencao), semB = variantes(segunda, intervencao);
    // A ausência de remoção de cura do básico significa fator inexistente apenas quando a outra foi executada.
    if (intervencao === 'sem_cura_basico' && (semA.length || semB.length)) {
      if (!semA.length) semA = [...a];
      if (!semB.length) semB = [...b];
    }
    if (!semA.length || !semB.length) return [];
    return [{ intervencao, ...diferencaDasDiferencas(a, b, semA, semB) }];
  });
  const maior = resultados.sort((x, y) => Math.abs(y.contrasteVitoriaPp) - Math.abs(x.contrasteVitoriaPp) || Math.abs(y.contrasteHpPp) - Math.abs(x.contrasteHpPp))[0];
  if (!maior) return 'Sem experimentos pareados para investigar a diferença entre estas classes.';
  return `Maior mudança observada entre os fatores testados: **${rotulos[maior.intervencao]}**. ` +
    `Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de ${br(maior.vantagemBasePp)} para ${br(maior.vantagemSemPp)} p.p.; ` +
    `contraste de ${br(maior.contrasteVitoriaPp)} p.p. e alteração de ${br(maior.contrasteHpPp)} p.p. na diferença de HP final. ` +
    'Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.';
}

export function gerarRelatorioDiagnostico(amostras: readonly AmostraCombate[], data: string): string {
  if (!amostras.length) throw new Error('Diagnóstico sem amostras');
  const base = amostras.filter(a => a.configuracao.intervencao === 'base');
  const grupos = new Map<string, AmostraCombate[]>();
  for (const a of base) {
    const chave = grupoDoCenario(a);
    const grupo = grupos.get(chave) ?? []; grupo.push(a); grupos.set(chave, grupo);
  }
  const linhas = [
    '# Diagnóstico de balanceamento', '', `**Versão:** 1.0 · **Data:** ${data}`, '',
    `Amostras: ${base.length} encontros completos e ${amostras.length - base.length} repetições com intervenção; ${grupos.size} cenários estratificados.`, '',
    `Sementes: ${[...new Set(base.map(a => a.configuracao.semente))].join(', ')}. Limite por encontro: ${[...new Set(base.map(a => a.configuracao.limiteS))].join(', ')} s.`, '',
    '## Como interpretar', '',
    'Cada classe usa as mesmas sementes, nível, dificuldade, alvos e bot. A ficha distribui atributos e ranks como jogadorTipico; usa equipamento inicial e poções iniciais. Inclui todas as classes oficiais, inclusive Necromante. Não há XP, subida de nível, drops ou spawner. O limite é por encontro inteiro. O resultado distingue vitória, morte e limite de tempo; limite nunca conta como morte ou vitória.', '',
    'Duelo: orc; pressão: orc, goblin e esqueleto simultâneos; atrito: goblin → orc → esqueleto → orc → goblin, sem restaurar HP, mana, recargas ou consumíveis; chefe: boss do mesmo nível. A troca de onda é imediata, preservando posição e invocações. Esses cenários isolam combate, não reproduzem exploração de fases.', '',
    'Dano efetivo exclui excesso letal, soma o jogador e suas invocações e é separado por fonte. DPS = soma do dano / soma do tempo vivo, incluindo aproximação e conjuração, em todas as tentativas (também derrotas e limites). Cura é HP efetivamente recuperado; escudo é absorção em impactos diretos, não inclui dano periódico. Os custos são os realmente cobrados após afinidades, inclusive ações posteriormente canceladas. Cura por efeito não é atribuída artificialmente à última habilidade.', '',
    'As taxas exibem intervalo de Wilson de 95% sobre as sementes selecionadas. É incerteza amostral descritiva, não prova de equilíbrio nem garantia sobre jogadores humanos. Sementes iguais pareiam as condições iniciais; mudanças de ações alteram o consumo do RNG, portanto não garantem rolagens idênticas. Comparações múltiplas são exploratórias, sem significância estatística certificada.', '',
    'As intervenções retiram um fator por vez: cura proporcional do básico (somente classes com esse fator), poções iniciais, ações da barra (passivas/invocações automáticas continuam), ou defesa plana inicial. Os efeitos são condicionais à build e ao bot; não são parcelas aditivas da vantagem. “Sem cura do básico” não desliga todas as curas. Não há ajuste automático dos números do jogo.', '',
    '## Visão geral por cenário', '',
    ...tabela(['Cenário', 'Classe', 'Vitórias / n (IC 95%)', 'Mortes', 'Limites', 'DPS', 'HP final médio %'], [...grupos].flatMap(([cenario, grupo]) =>
      [...new Set(grupo.map(a => a.configuracao.classe))].map(classe => {
        const r = resumir(grupo.filter(a => a.configuracao.classe === classe));
        const ic = r.intervaloVitorias;
        return [cenario, classe, `${r.vitorias}/${r.n} (${ic ? `${br(ic[0] * 100)}–${br(ic[1] * 100)}%` : '—'})`, String(r.mortes), String(r.limites), br(r.dps), br(r.hpFinalPct)];
      }))),
  ];
  const sinais: { titulo: string; texto: string; diferenca: number }[] = [];
  for (const [cenario, grupo] of grupos) {
    const classes = [...new Set(grupo.map(a => a.configuracao.classe))];
    for (const ca of classes) for (const cb of classes) {
      if (ca === cb) continue;
      const a = resumir(grupo.filter(x => x.configuracao.classe === ca));
      const b = resumir(grupo.filter(x => x.configuracao.classe === cb));
      if (a.mortes < b.mortes && a.vitoriasPct > b.vitoriasPct && a.dps >= b.dps * 0.9) {
        sinais.push({ titulo: `${cenario}: ${ca} sobreviveu mais sem perder mais de 10% do DPS`,
          texto: `${explicacao(ca, a, cb, b)}\n\n${contrasteDosFatores(grupo.filter(x => x.configuracao.classe === ca), grupo.filter(x => x.configuracao.classe === cb), amostras)}`, diferenca: b.mortes / b.n - a.mortes / a.n });
      }
    }
  }
  linhas.push('## Sinais prioritários para investigar', '', 'Até oito diferenças de mortalidade com mais vitórias e ao menos 90% do DPS da classe comparada. A seleção é exploratória; o detalhamento abaixo preserva todos os cenários, inclusive os que não mostraram diferença.', '');
  for (const sinal of sinais.sort((a, b) => b.diferenca - a.diferenca).slice(0, 8)) linhas.push(`### ${sinal.titulo}`, '', sinal.texto, '');
  if (!sinais.length) linhas.push('Nenhum par satisfez esse filtro nesta amostra. Isso não prova equilíbrio; veja também desgaste, custos e limites de tempo.', '');
  for (const [cenario, grupo] of grupos) {
    linhas.push(`## ${cenario}`, '');
    const classes = [...new Set(grupo.map(a => a.configuracao.classe))];
    const porClasse = new Map(classes.map(c => [c, grupo.filter(a => a.configuracao.classe === c)]));
    if (grupo[0]?.configuracao.cenario === 'atrito') {
      linhas.push('### Onde o desgaste aparece', '', ...tabela(['Classe', 'Onda', 'Chegaram/n inicial', 'Mortes / limites nesta onda', 'HP entrada → saída', 'Mana entrada → saída', 'Recebido / cura / mana gasta'], classes.flatMap(c => {
        const am = porClasse.get(c) ?? [];
        const numeros = [...new Set(am.flatMap(a => a.ondas.map(o => o.numero)))];
        return numeros.map(numero => {
          const etapas = am.flatMap(a => a.ondas.filter(o => o.numero === numero));
          return [c, String(numero), `${etapas.length}/${am.length}`,
            `${etapas.filter(o => o.resultado === 'morte').length} / ${etapas.filter(o => o.resultado === 'limite').length}`,
            `${br(media(etapas.map(o => o.hpEntrada)))} → ${br(media(etapas.map(o => o.hpSaida)))}`,
            `${br(media(etapas.map(o => o.manaEntrada)))} → ${br(media(etapas.map(o => o.manaSaida)))}`,
            [media(etapas.map(o => o.recebido)), media(etapas.map(o => o.cura)), media(etapas.map(o => o.manaGasta))].map(br).join(' / ')];
        });
      })), 'Médias de cada onda incluem apenas quem chegou a ela; o denominador inicial mostra a seleção dos sobreviventes. Não compare a vida da onda 5 como se incluísse quem morreu antes.', '');
    }
    linhas.push(...tabela(['Classe', 'TTK mediano (só vitórias)', 'Morte mediana', 'Ondas completas', 'Dano/encontro', 'Recebido/encontro', 'Cura/encontro', 'Mana gasta', 'HP gasto'], classes.map(c => {
      const r = resumir(porClasse.get(c) ?? []);
      return [c, valor(r.tempoVitoriaMediano, ' s'), valor(r.tempoMorteMediano, ' s'), br(r.ondasMedia), br(r.danoMedio), br(r.recebidoMedio), br(r.curaMedia), br(r.manaMedia), br(r.vidaGastaMedia)];
    })));
    linhas.push('### Mecanismos observados (médias por encontro)', '');
    linhas.push(...tabela(['Classe', 'Cura direta / efeitos / poções / invocação', 'Dano direto / efeitos / invocação', 'Escudo (impactos)', 'HP sacrificado de invocações', 'Conjuração / movimento / controle / baixa vida / restrição de mana (s)', 'Distância média'], classes.map(c => {
      const r = resumir(porClasse.get(c) ?? []), m = r.metricasMedias;
      return [c, [m.curaHabilidade, m.curaEfeitos, m.curaPocoes, m.curaInvocacoes].map(br).join(' / '),
        [m.danoDireto, m.danoEfeitos, m.danoInvocacoes].map(br).join(' / '), br(m.escudoAbsorvido), br(m.vidaSacrificadaInvocacoes),
        [m.tempoConjurandoS, m.tempoMovendoS, m.tempoControladoS, m.tempoVidaBaixaS, m.tempoSemManaS].map(br).join(' / '), valor(m.distanciaMedia)];
    })));
    linhas.push('Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.', '');
    linhas.push(...tabela(['Classe', 'Ações / cancelamentos', 'Impactos / falhas / críticos', 'Combos / sinergias', 'Recusas por motivo', 'Saldo HP / mana sem evento'], classes.map(c => {
      const am = porClasse.get(c) ?? [], r = resumir(am), m = r.metricasMedias;
      return [c, `${br(m.acoes)} / ${br(m.cancelamentos)}`, `${br(m.impactos)} / ${br(m.falhas)} / ${br(m.criticos)}`,
        `${br(m.combos)} / ${br(m.sinergias)}`, Object.entries(m.recusas).map(([k, v]) => `${k}: ${br(v)}`).join('; ') || '—',
        `${br(am.reduce((s, a) => s + a.saldoHpSemEvento, 0) / am.length)} / ${br(am.reduce((s, a) => s + a.saldoManaSemEvento, 0) / am.length)}`];
    })));
    linhas.push('Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.', '');
    linhas.push('### Fontes e custos (médias por encontro)', '');
    linhas.push(...tabela(['Classe', 'Fonte', 'Usos', 'Dano efetivo', 'Cura efetiva', 'Mana cobrada', 'HP cobrado', 'Cura/mana da própria fonte'], classes.flatMap(c => {
      const r = resumir(porClasse.get(c) ?? []);
      return Object.entries(r.fontes).filter(([, f]) => f.usos || f.dano || f.cura).map(([id, f]) =>
        [c, id, br(f.usos), br(f.dano), br(f.cura), br(f.mana), br(f.vida), f.mana > 0 && f.cura > 0 ? br(f.cura / f.mana) : '—']);
    })));
    linhas.push('“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.', '');
    linhas.push('### Comparações entre classes', '');
    for (let i = 0; i < classes.length; i++) for (let j = i + 1; j < classes.length; j++) {
      const ca = classes[i], cb = classes[j];
      if (!ca || !cb) continue;
      const a = porClasse.get(ca) ?? [], b = porClasse.get(cb) ?? [];
      const par = compararPares(a, b), ra = resumir(a), rb = resumir(b);
      linhas.push(explicacao(ca, ra, cb, rb), '',
        `Pares: ${par.favoreceA} sementes só ${ca} venceu, ${par.favoreceB} só ${cb} venceu; diferença de vitória ${br(par.deltaVitoriaPp)} p.p. e de HP final ${br(par.deltaHpPp)} p.p. ` +
        `Amostra ${par.n < 8 ? 'pequena: aumente --sementes antes de concluir' : 'exploratória: confirme com mais sementes e outras builds'}.`, '');
      linhas.push(contrasteDosFatores(a, b, amostras), '');
      const domina = (x: ResumoCombate, y: ResumoCombate) => x.vitoriasPct > y.vitoriasPct && x.dps >= y.dps * 0.9;
      if (domina(ra, rb) || domina(rb, ra)) linhas.push(`Sinal para investigar: ${domina(ra, rb) ? ca : cb} venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.`, '');
    }
    linhas.push('### O que mudou ao retirar cada fator', '');
    const experimentos: string[][] = [];
    for (const c of classes) {
      const a = porClasse.get(c) ?? [];
      const intervencoes = [...new Set(amostras.filter(x => grupoDoCenario(x) === cenario && x.configuracao.classe === c).map(x => x.configuracao.intervencao))];
      for (const intervencao of intervencoes) {
        if (!intervencao || intervencao === 'base') continue;
        const b = amostras.filter(x => grupoDoCenario(x) === cenario && x.configuracao.classe === c && x.configuracao.intervencao === intervencao);
        const par = compararPares(a, b), r = resumir(b), rb = resumir(a);
        experimentos.push([c, rotulos[intervencao], `${r.vitorias}/${r.n}; ${r.mortes}; ${r.limites}`,
          br(par.deltaVitoriaPp), br(par.deltaHpPp), `${br(r.dps)} (${pct(r.dps, rb.dps)} do completo)`, `${par.favoreceA} / ${par.favoreceB}`]);
        if (par.favoreceA > par.favoreceB) linhas.push(`**${c}, ${rotulos[intervencao]}:** retirar esse fator perdeu ${par.favoreceA} vitórias e ganhou ${par.favoreceB} nas mesmas ${par.n} condições iniciais. O kit completo teve ${br(par.deltaHpPp)} p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.`, '');
      }
    }
    if (experimentos.length) linhas.push(...tabela(['Classe', 'Intervenção', 'Vitórias/n; mortes; limites', 'Completo − sem fator: vitória (p.p.)', 'HP final (p.p.)', 'DPS sem fator', 'Só completo / só intervenção venceu'], experimentos));
    else linhas.push('Experimentos não executados neste cenário.', '');
  }
  return `${linhas.join('\n').trimEnd()}\n`;
}
