// Interações entre efeitos (D-057, D-059). Marco 14 (14/10/2026). Tudo vem de src/data/interacoes.json:
// - acúmulo por tipo: `mais_forte` (o padrão da D-048: maior duração e maior valor), `renova` (recomeça com o
//   novo), `soma` (conta acúmulos e soma o valor) e `ignora` (quem já tem fica como está);
// - transformações: N acúmulos viram outro efeito (resfriado ×3 → congelado);
// - oposições: aplicar um efeito tira os opostos (queimando tira o frio, e o frio tira o fogo);
// - teto de efeitos por entidade: passando dele, sai o que acaba primeiro;
// - imunidades por preset: o efeito nem entra.
// O dispatcher único (efeitos.ts) chama `registrarEfeitoAtivo` para todo efeito com duração.

import type { ContextoSimulacao } from '../core/contexto';
import { ticksDe } from '../core/tempo';
import { Leitor } from '../core/validar';
import type { EfeitoAtivo, Entidade } from '../entities/entidade';
import { ehElemento, type Sinergia } from './elementos';
import { normalizarEfeito, normalizarEfeitos } from './normalizar-efeito';
import { ehTipoEfeito, REGISTRO_EFEITOS, TIPOS_EFEITO, type EfeitoCanonico, type TipoEfeito } from './registro-efeitos';

export const REGRAS_ACUMULO = ['mais_forte', 'renova', 'soma', 'ignora'] as const;
export type RegraAcumulo = (typeof REGRAS_ACUMULO)[number];

export interface Transformacao {
  de: TipoEfeito;
  acumulos: number;
  vira: EfeitoCanonico;
}

export interface Interacoes {
  tetoEfeitos: number;
  acumulo: Readonly<Partial<Record<TipoEfeito, RegraAcumulo>>>;
  transformacoes: readonly Transformacao[];
  oposicoes: readonly { efeito: TipoEfeito; remove: readonly TipoEfeito[] }[];
  sinergias: readonly Sinergia[];
}

export const INTERACOES_VAZIAS: Interacoes = { tetoEfeitos: 99, acumulo: {}, transformacoes: [], oposicoes: [], sinergias: [] };

function tiposDe(l: Leitor, o: Record<string, unknown>, campo: string): TipoEfeito[] {
  return l.listaDeTextos(o, campo).filter((t): t is TipoEfeito => {
    if (ehTipoEfeito(t)) return true;
    l.erro(`${campo}: tipo de efeito desconhecido "${t}"`);
    return false;
  });
}

export function lerInteracoes(json: unknown): { interacoes: Interacoes; erros: string[] } {
  const l = new Leitor('interacoes.json');
  const o = l.objeto(json, 'raiz');
  const acumuloObj = l.objeto(o.acumulo, 'acumulo');
  const acumulo: Partial<Record<TipoEfeito, RegraAcumulo>> = {};
  for (const tipo of Object.keys(acumuloObj)) {
    if (!ehTipoEfeito(tipo)) l.erro(`acumulo: tipo desconhecido "${tipo}"`);
    else acumulo[tipo] = l.opcao(acumuloObj, tipo, REGRAS_ACUMULO);
  }
  const transformacoes = l.lista(o, 'transformacoes').flatMap((t): Transformacao[] => {
    const tt = l.objeto(t, 'transformacao');
    const de = l.texto(tt, 'de');
    const [vira] = normalizarEfeito(tt.vira, l);
    if (!ehTipoEfeito(de) || !vira) {
      l.erro(`transformação inválida ("${de}")`);
      return [];
    }
    return [{ de, acumulos: l.numero(tt, 'acumulos', { min: 2, max: 20, inteiro: true }), vira }];
  });
  const oposicoes = l.lista(o, 'oposicoes').flatMap((x) => {
    const oo = l.objeto(x, 'oposicao');
    const efeito = l.texto(oo, 'efeito');
    if (!ehTipoEfeito(efeito)) {
      l.erro(`oposição: tipo desconhecido "${efeito}"`);
      return [];
    }
    return [{ efeito, remove: tiposDe(l, oo, 'remove') }];
  });
  const sinergias = l.lista(o, 'sinergias').flatMap((x): Sinergia[] => {
    const so = l.objeto(x, 'sinergia');
    const elemento = so.elemento;
    if (!ehElemento(elemento)) {
      l.erro(`sinergia: elemento desconhecido "${String(elemento)}"`);
      return [];
    }
    return [
      {
        id: l.texto(so, 'id'),
        elemento,
        sobre: tiposDe(l, so, 'sobre'),
        remove: tiposDe(l, so, 'remove'),
        danoExtraPct: l.numero(so, 'danoExtraPct', { min: 0, max: 500 }),
        aplicar: normalizarEfeitos(l.lista(so, 'aplicar'), l),
      },
    ];
  });
  const interacoes: Interacoes = { tetoEfeitos: l.numero(o, 'tetoEfeitos', { min: 1, max: 40, inteiro: true }), acumulo, transformacoes, oposicoes, sinergias };
  return { interacoes, erros: l.erros };
}

export function regraDe(interacoes: Interacoes, tipo: TipoEfeito): RegraAcumulo {
  return interacoes.acumulo[tipo] ?? 'mais_forte';
}

/** O preset da entidade é imune a este tipo de efeito? */
export function imuneAoEfeito(ctx: ContextoSimulacao, alvo: Entidade, tipo: TipoEfeito): boolean {
  return ctx.conteudo.presets.get(alvo.preset)?.imunidades.includes(tipo) ?? false;
}

/**
 * Guarda um efeito com duração na entidade, pelas regras de interação. Devolve o efeito que ficou ativo (ou
 * null quando foi ignorado). `transformar` recebe o efeito em que N acúmulos viram (aplicado pelo dispatcher).
 */
export function registrarEfeitoAtivo(
  ctx: ContextoSimulacao,
  alvo: Entidade,
  ef: EfeitoCanonico,
  origemId: string,
  tick: number,
  transformar: (vira: EfeitoCanonico) => void,
): EfeitoAtivo | null {
  if (imuneAoEfeito(ctx, alvo, ef.tipo)) return null;
  const interacoes = ctx.conteudo.interacoes;
  const def = REGISTRO_EFEITOS[ef.tipo];
  const ateTick = tick + ticksDe(ef.duracaoMs);
  // Oposições: o novo efeito tira os opostos antes de entrar.
  for (const op of interacoes.oposicoes) {
    if (op.efeito === ef.tipo) alvo.efeitos = alvo.efeitos.filter((f) => !op.remove.includes(f.tipo));
  }
  let ativo = alvo.efeitos.find((f) => f.tipo === ef.tipo && f.ateTick > tick) ?? null;
  if (ativo) {
    switch (regraDe(interacoes, ef.tipo)) {
      case 'ignora':
        return null;
      case 'renova':
        ativo.ateTick = ateTick;
        ativo.valor = ef.valor;
        ativo.pct = ef.pct;
        ativo.inicioTick = tick;
        break;
      case 'soma':
        ativo.acumulos += 1;
        ativo.valor += ef.valor;
        ativo.pct = Math.max(ativo.pct, ef.pct);
        if (ateTick > ativo.ateTick) {
          ativo.ateTick = ateTick;
          ativo.inicioTick = tick;
        }
        break;
      case 'mais_forte':
        if (ateTick > ativo.ateTick) {
          ativo.ateTick = ateTick;
          ativo.inicioTick = tick;
        }
        ativo.valor = Math.max(ativo.valor, ef.valor);
        ativo.pct = Math.max(ativo.pct, ef.pct);
        break;
    }
    ativo.origemId = origemId;
    if (ef.interno) ativo.interno = { ...ef.interno };
  } else {
    // Expirado e ainda não limpo: sai antes de entrar o novo (uma entrada por tipo).
    alvo.efeitos = alvo.efeitos.filter((f) => f.tipo !== ef.tipo);
    const intervalo = ticksDe(ctx.balance.efeitos.intervaloPeriodicoMs);
    ativo = {
      tipo: ef.tipo,
      ateTick,
      origemId,
      valor: ef.valor,
      pct: ef.pct,
      proximoTick: def.periodico ? tick + intervalo : 0,
      interno: ef.interno ? { ...ef.interno } : null,
      ref: ef.ref,
      inicioTick: tick,
      acumulos: 1,
    };
    alvo.efeitos.push(ativo);
    // Teto: passando dele, sai o que acaba primeiro (empate: a ordem do registro, depois o mais antigo).
    const vivos = alvo.efeitos.filter((f) => f.ateTick > tick);
    if (vivos.length > interacoes.tetoEfeitos) {
      const ordem = (t: TipoEfeito) => TIPOS_EFEITO.indexOf(t);
      const sai = vivos
        .filter((f) => f !== ativo)
        .sort((a, b) => a.ateTick - b.ateTick || ordem(a.tipo) - ordem(b.tipo))[0];
      if (sai) alvo.efeitos = alvo.efeitos.filter((f) => f !== sai);
    }
  }
  // Transformações: N acúmulos viram outro efeito (o acumulado sai).
  for (const t of interacoes.transformacoes) {
    if (t.de === ef.tipo && ativo.acumulos >= t.acumulos) {
      alvo.efeitos = alvo.efeitos.filter((f) => f !== ativo);
      transformar(t.vira);
      return null;
    }
  }
  return ativo;
}
