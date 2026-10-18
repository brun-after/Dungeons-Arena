// Estatística descritiva (18/10/2026): denominadores explícitos, censura e comparação pareada por semente.
import type { AmostraCombate } from './diagnostico';
import type { FonteMedida, MetricasCombate } from './metricas';
import { mediana } from './simulador';
export const media = (v: readonly number[]): number => v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
export function wilson(sucessos: number, n: number): [number, number] | null {
  if (!n) return null;
  const z = 1.96, p = sucessos / n, divisor = 1 + z * z / n;
  const centro = (p + z * z / (2 * n)) / divisor;
  const margem = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / divisor;
  return [Math.max(0, centro - margem), Math.min(1, centro + margem)];
}
export interface ResumoCombate {
  n: number; vitorias: number; mortes: number; limites: number; vitoriasPct: number;
  intervaloVitorias: [number, number] | null;
  tempoVitoriaMediano: number | null; tempoMorteMediano: number | null;
  dps: number; danoMedio: number; recebidoMedio: number; curaMedia: number; manaMedia: number; vidaGastaMedia: number;
  hpFinalPct: number; hpInicialMedio: number; defesaMedia: number; ondasMedia: number;
  metricasMedias: MetricasCombate; fontes: Record<string, FonteMedida>;
}
export function resumir(amostras: readonly AmostraCombate[]): ResumoCombate {
  const n = amostras.length;
  const soma = (f: (a: AmostraCombate) => number) => amostras.reduce((t, a) => t + f(a), 0);
  const medias = mediaMetricas(amostras);
  const vitorias = amostras.filter(a => a.resultado === 'vitoria'), mortes = amostras.filter(a => a.resultado === 'morte');
  const tempoVivo = soma(a => a.metricas.tempoVivoS);
  return {
    n, vitorias: vitorias.length, mortes: mortes.length, limites: n - vitorias.length - mortes.length,
    vitoriasPct: n ? 100 * vitorias.length / n : 0, intervaloVitorias: wilson(vitorias.length, n),
    tempoVitoriaMediano: vitorias.length ? mediana(vitorias.map(a => a.tempoS)) : null,
    tempoMorteMediano: mortes.length ? mediana(mortes.map(a => a.tempoS)) : null,
    dps: tempoVivo ? soma(a => a.metricas.dano) / tempoVivo : 0,
    danoMedio: medias.dano, recebidoMedio: medias.recebido, curaMedia: medias.cura, manaMedia: medias.manaGasta,
    vidaGastaMedia: medias.vidaGasta, hpFinalPct: media(amostras.map(a => 100 * a.hpFinal / a.hpMax)),
    hpInicialMedio: media(amostras.map(a => a.hpInicial)), defesaMedia: media(amostras.map(a => a.defesa)),
    ondasMedia: media(amostras.map(a => a.ondasConcluidas)), metricasMedias: medias, fontes: medias.fontes,
  };
}
function mediaMetricas(amostras: readonly AmostraCombate[]): MetricasCombate {
  const primeira = amostras[0];
  if (!primeira) throw new Error('Resumo exige ao menos uma amostra');
  const m = structuredClone(primeira.metricas);
  for (const chave of Object.keys(m) as (keyof MetricasCombate)[]) {
    if (chave === 'fontes' || chave === 'recusas' || chave === 'distanciaMedia') continue;
    m[chave] = media(amostras.map(a => a.metricas[chave]));
  }
  const distancias = amostras.flatMap(a => a.metricas.distanciaMedia === null ? [] : [a.metricas.distanciaMedia]);
  m.distanciaMedia = distancias.length ? media(distancias) : null;
  m.fontes = {}; m.recusas = {};
  for (const a of amostras) {
    for (const [id, f] of Object.entries(a.metricas.fontes)) {
      const total = m.fontes[id] ??= { usos: 0, dano: 0, cura: 0, mana: 0, vida: 0 };
      for (const k of Object.keys(total) as (keyof FonteMedida)[]) total[k] += f[k] / amostras.length;
    }
    for (const [motivo, qtd] of Object.entries(a.metricas.recusas)) m.recusas[motivo] = (m.recusas[motivo] ?? 0) + qtd / amostras.length;
  }
  return m;
}
const chavePar = (a: AmostraCombate) => {
  const c = a.configuracao;
  return `${c.nivel}/${c.dificuldade}/${c.cenario}/${c.semente}`;
};
/** Aceita classes diferentes; exige o mesmo cenário e conjunto de sementes, sem pares perdidos ou duplicados. */
export function compararPares(a: readonly AmostraCombate[], b: readonly AmostraCombate[]) {
  const index = new Map(b.map(x => [chavePar(x), x]));
  if (!a.length || index.size !== b.length || new Set(a.map(chavePar)).size !== a.length || a.length !== b.length) throw new Error('Amostras não pareadas');
  let favoreceA = 0, favoreceB = 0;
  const diferencasHp: number[] = [], diferencasDps: number[] = [];
  for (const x of a) {
    const y = index.get(chavePar(x));
    if (!y) throw new Error('Semente/cenário sem par');
    const vx = x.resultado === 'vitoria', vy = y.resultado === 'vitoria';
    if (vx && !vy) favoreceA++;
    if (vy && !vx) favoreceB++;
    diferencasHp.push(100 * (x.hpFinal / x.hpMax - y.hpFinal / y.hpMax));
    diferencasDps.push(x.metricas.dano / x.metricas.tempoVivoS - y.metricas.dano / y.metricas.tempoVivoS);
  }
  return { n: a.length, favoreceA, favoreceB, deltaVitoriaPp: 100 * (favoreceA - favoreceB) / a.length,
    deltaHpPp: media(diferencasHp), deltaDps: media(diferencasDps) };
}

/** Mudança da vantagem entre classes ao retirar o mesmo fator das duas; efeitos não são aditivos. */
export function diferencaDasDiferencas(baseA: readonly AmostraCombate[], baseB: readonly AmostraCombate[], semA: readonly AmostraCombate[], semB: readonly AmostraCombate[]) {
  compararPares(baseA, semA); compararPares(baseB, semB);
  const base = compararPares(baseA, baseB), sem = compararPares(semA, semB);
  return { vantagemBasePp: base.deltaVitoriaPp, vantagemSemPp: sem.deltaVitoriaPp,
    contrasteVitoriaPp: base.deltaVitoriaPp - sem.deltaVitoriaPp, contrasteHpPp: base.deltaHpPp - sem.deltaHpPp };
}
