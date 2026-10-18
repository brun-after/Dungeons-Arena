// Integridade do diagnóstico completo (18/10/2026): falha a CI quando a medição ou a grade estão incompletas.
import type { AmostraCombate } from './diagnostico';
const EPSILON = 1e-6;
const soma = (v: readonly number[]) => v.reduce((a, b) => a + b, 0);
export function validarAmostras(amostras: readonly AmostraCombate[], quantidadeEsperada: number): void {
  if (!quantidadeEsperada || amostras.length !== quantidadeEsperada) throw new Error(`Grade incompleta: ${amostras.length}/${quantidadeEsperada} encontros`);
  const chaves = new Set<string>();
  const chave = (a: AmostraCombate, variante = a.configuracao.intervencao) => {
    const c = a.configuracao;
    return `${c.classe}/${c.nivel}/${c.dificuldade}/${c.cenario}/${c.semente}/${variante ?? 'base'}`;
  };
  for (const a of amostras) {
    const id = chave(a);
    if (chaves.has(id)) throw new Error(`Amostra duplicada: ${id}`);
    chaves.add(id);
    const exigir = (condicao: boolean, motivo: string) => { if (!condicao) throw new Error(`${id}: ${motivo}`); };
    const iguais = (v: number, esperado: number, motivo: string) => { exigir(Math.abs(v - esperado) <= EPSILON, motivo); };
    const m = a.metricas;
    for (const [campo, valor] of Object.entries(m)) {
      if (typeof valor === 'number') exigir(Number.isFinite(valor) && valor >= -EPSILON, `métrica inválida: ${campo}`);
    }
    for (const [idFonte, fonte] of Object.entries(m.fontes)) {
      exigir(Object.values(fonte).every(v => Number.isFinite(v) && v >= -EPSILON), `fonte inválida: ${idFonte}`);
    }
    exigir(Object.values(m.recusas).every(v => Number.isInteger(v) && v >= 0), 'recusas inválidas');
    exigir(Number.isFinite(a.hpMax) && a.hpMax > 0 && a.hpInicial > 0 && a.hpInicial <= a.hpMax && a.hpFinal >= 0 && a.hpFinal <= a.hpMax, 'vida inválida');
    exigir(Number.isFinite(a.saldoHpSemEvento) && a.saldoHpSemEvento >= -EPSILON, 'HP perdido sem evento ou cura duplicada');
    exigir(Number.isFinite(a.saldoManaSemEvento) && a.saldoManaSemEvento >= -EPSILON, 'mana perdida sem evento ou restauração duplicada');
    exigir(a.tempoS > 0 && Number.isFinite(a.tempoS), 'duração inválida');
    exigir(a.tempoS <= (a.configuracao.limiteS ?? 90) + 1 / 60 + EPSILON, 'limite de tempo excedido');
    exigir(a.ondas.length > 0 && a.ondas.length <= a.ondasPlanejadas, 'ondas ausentes ou excedentes');
    iguais(a.ondasConcluidas, a.ondas.filter(o => o.resultado === 'vitoria').length, 'contagem de ondas incompatível');
    iguais(a.tempoS, m.tempoVivoS, 'tempo vivo incompatível');
    iguais(m.dano, m.danoDireto + m.danoEfeitos + m.danoInvocacoes, 'dano por origem incompatível');
    iguais(m.cura, m.curaHabilidade + m.curaEfeitos + m.curaPocoes + m.curaInvocacoes, 'cura por origem incompatível');
    const fontes = Object.values(m.fontes);
    iguais(m.dano, soma(fontes.map(f => f.dano)), 'dano por fonte incompatível');
    iguais(m.cura, soma(fontes.map(f => f.cura)), 'cura por fonte incompatível');
    iguais(m.manaGasta, soma(fontes.map(f => f.mana)), 'custo de mana por fonte incompatível');
    iguais(m.vidaGasta, soma(fontes.map(f => f.vida)), 'custo de vida por fonte incompatível');
    iguais(m.dano, soma(a.ondas.map(o => o.dano)), 'dano por onda incompatível');
    iguais(m.recebido, soma(a.ondas.map(o => o.recebido)), 'dano recebido por onda incompatível');
    iguais(m.cura, soma(a.ondas.map(o => o.cura)), 'cura por onda incompatível');
    iguais(m.manaGasta, soma(a.ondas.map(o => o.manaGasta)), 'mana por onda incompatível');
    iguais(a.tempoS, soma(a.ondas.map(o => o.tempoS)), 'tempo por onda incompatível');
    for (let i = 0; i < a.ondas.length; i++) {
      const onda = a.ondas[i];
      if (!onda) throw new Error('Onda ausente');
      iguais(onda.numero, i + 1, 'ordem de onda inválida');
      iguais(onda.hpEntrada, i ? (a.ondas[i - 1]?.hpSaida ?? NaN) : a.hpInicial, 'vida restaurada entre ondas');
      iguais(onda.manaEntrada, i ? (a.ondas[i - 1]?.manaSaida ?? NaN) : a.manaInicial, 'mana restaurada entre ondas');
    }
    const ultima = a.ondas.at(-1);
    exigir(ultima?.resultado === a.resultado, 'resultado final incompatível');
    iguais(ultima?.hpSaida ?? NaN, a.hpFinal, 'vida final incompatível');
    iguais(ultima?.manaSaida ?? NaN, a.manaFinal, 'mana final incompatível');
    exigir(a.resultado === 'morte' ? a.hpFinal === 0 : a.hpFinal > 0, 'morte incompatível com HP');
    if (a.resultado === 'vitoria') iguais(a.ondasConcluidas, a.ondasPlanejadas, 'vitória sem concluir o encontro');
    if (a.resultado === 'limite') exigir(a.tempoS + EPSILON >= (a.configuracao.limiteS ?? 90), 'limite prematuro');
  }
  for (const a of amostras) if (!chaves.has(chave(a, 'base'))) throw new Error(`Experimento sem controle: ${chave(a)}`);
}
