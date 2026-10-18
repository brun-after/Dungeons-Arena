// CLI de diagnóstico (18/10/2026): grade explícita, validação de argumentos e exportação das amostras auditáveis.
import { writeFileSync } from 'node:fs';
import { BALANCE_PADRAO } from '../../src/core/contexto';
import { DIFICULDADES } from '../../src/modos/dificuldade';
import { CENARIOS, CLASSES_DIAGNOSTICO, INTERVENCOES, simularDiagnostico, type AmostraCombate } from './diagnostico';
import { gerarRelatorioDiagnostico } from './relatorio-diagnostico';
import { validarAmostras } from './validacao-diagnostico';

export function opcoesDiagnostico(args: readonly string[]) {
  const flags = new Set(['--diagnostico', '--registrar', '--sem-experimentos']);
  const valores = new Set(['--sementes', '--niveis', '--dificuldades', '--cenarios', '--classes', '--limite', '--json']);
  for (let i = 0; i < args.length; i++) {
    const arg = args[i] ?? '';
    if (flags.has(arg)) continue;
    if (!valores.has(arg) || !args[i + 1] || args[i + 1]?.startsWith('--')) throw new Error(`Argumento inválido ou sem valor: ${arg}`);
    i++;
  }
  const ler = (nome: string, padrao: string) => { const i = args.indexOf(`--${nome}`); return i >= 0 ? (args[i + 1] ?? padrao) : padrao; };
  const lista = <T extends string>(nome: string, padrao: string, permitidos: readonly T[]): T[] => {
    const partes = ler(nome, padrao).split(',').map(x => x.trim());
    const validados = partes.map(p => {
      const valor = permitidos.find(v => v === p);
      if (valor === undefined) throw new Error(`--${nome}: valor inválido ${p}`);
      return valor;
    });
    return [...new Set(validados)];
  };
  const n = Number(ler('sementes', '8')), limiteS = Number(ler('limite', '90'));
  const niveis = [...new Set(ler('niveis', '1,10,30').split(',').map(Number))];
  if (!Number.isInteger(n) || n < 1 || n > 256) throw new Error('--sementes deve ser inteiro entre 1 e 256');
  if (!Number.isFinite(limiteS) || limiteS < 1 || limiteS > 300) throw new Error('--limite deve estar entre 1 e 300 segundos');
  if (!niveis.length || niveis.some(nivel => !Number.isInteger(nivel) || nivel < 1 || nivel > 30)) throw new Error('--niveis deve listar inteiros entre 1 e 30');
  return {
    sementes: Array.from({ length: n }, (_, i) => 1000 + i * 7919), niveis,
    dificuldades: lista('dificuldades', 'normal,pesadelo', DIFICULDADES),
    cenarios: lista('cenarios', CENARIOS.join(','), CENARIOS),
    classes: lista('classes', CLASSES_DIAGNOSTICO.join(','), CLASSES_DIAGNOSTICO),
    limiteS, experimentos: !args.includes('--sem-experimentos'), registrar: args.includes('--registrar'), json: ler('json', ''),
  };
}
export function executarDiagnostico(args: readonly string[]): void {
  const opcoes = opcoesDiagnostico(args);
  const amostras: AmostraCombate[] = [];
  const variantesDaClasse = (classe: string) => opcoes.experimentos ? INTERVENCOES.filter(v => v !== 'sem_cura_basico' || (BALANCE_PADRAO.recursos.curaBasicoPorClassePct[classe] ?? 0) > 0) : ['base'] as const;
  const quantidadeEsperada = opcoes.niveis.length * opcoes.dificuldades.length * opcoes.cenarios.length * opcoes.sementes.length * opcoes.classes.reduce((total, classe) => total + variantesDaClasse(classe).length, 0);
  const inicio = Date.now();
  for (const nivel of opcoes.niveis) for (const dificuldade of opcoes.dificuldades) for (const cenario of opcoes.cenarios) {
    for (const classe of opcoes.classes) {
      const variantes = variantesDaClasse(classe);
      for (const intervencao of variantes) for (const semente of opcoes.sementes) {
        amostras.push(simularDiagnostico({ classe, nivel, dificuldade, cenario, semente, intervencao, limiteS: opcoes.limiteS }));
      }
    }
    console.error(`Diagnóstico: nível ${nivel}, ${dificuldade}, ${cenario} concluído (${amostras.length} encontros).`);
  }
  validarAmostras(amostras, quantidadeEsperada);
  console.error(`Integridade validada: ${amostras.length}/${quantidadeEsperada} encontros, contabilidade e controles pareados.`);
  const data = new Date().toISOString().slice(0, 10).split('-').reverse().join('/');
  const relatorio = gerarRelatorioDiagnostico(amostras, data);
  console.log(relatorio);
  if (opcoes.registrar) {
    writeFileSync('docs/BALANCEAMENTO-DIAGNOSTICO.md', relatorio);
    console.error('Gravado em docs/BALANCEAMENTO-DIAGNOSTICO.md');
  }
  if (opcoes.json) {
    writeFileSync(opcoes.json, `${JSON.stringify({ versao: 1, balanceVersao: BALANCE_PADRAO.versao, opcoes, amostras }, null, 2)}\n`);
    console.error(`Amostras gravadas em ${opcoes.json}`);
  }
  console.error(`Diagnóstico concluído: ${amostras.length} encontros, ${((Date.now() - inicio) / 1000).toFixed(1)} s. Resultados exploratórios; metas legadas são verificadas por npm run balancear sem --diagnostico.`);
}
