// Normalização de efeitos (§2.8, "a peça-chave"). Marco 8A (13/10/2026). Um efeito autorado pode
// combinar vários componentes num objeto só; a normalização devolve uma entrada canônica por
// componente detectado, com tipo e duração resolvidos e sem os campos dos outros tipos — senão o
// mesmo efeito seria detectado duas vezes adiante. Formatos aceitos:
//   canônico:   { "tipo": "dano_periodico", "valor": 3, "duracaoMs": 4000, "em": "alvo" }
//   combinado:  { "atordoar": 1500, "dano_periodico": 3, "duracaoMs": 4000 }
//               { "bonus_dano": { "pct": 40, "duracaoMs": 8000 } }
// No combinado, um número vale como duração (tipos sem campos) ou como o primeiro campo do tipo;
// `duracaoMs` e `em` no nível de fora valem para os componentes que não trouxerem os seus. Campo
// omitido usa o padrão do registro só quando nenhum campo do tipo foi dado.

import { ehObjeto, type Leitor, type Objeto } from '../core/validar';
import { construirEfeito, ehTipoEfeito, REGISTRO_EFEITOS, type DestinoEfeito, type EfeitoCanonico, type TipoEfeito } from './registro-efeitos';

const CHAVES_COMUNS = new Set(['duracaoMs', 'em']);
const DESTINOS: readonly DestinoEfeito[] = ['alvo', 'conjurador'];

function numeroOpcional(l: Leitor, o: Objeto, campo: string, min: number, max: number): number | undefined {
  if (o[campo] === undefined) return undefined;
  return l.numero(o, campo, { min, max });
}

function destino(l: Leitor, o: Objeto): DestinoEfeito | undefined {
  return o.em === undefined ? undefined : l.opcao(o, 'em', DESTINOS);
}

function componente(
  l: Leitor,
  tipo: TipoEfeito,
  bruto: unknown,
  duracaoComum: number | undefined,
  emComum: DestinoEfeito | undefined,
  profundidade: number,
): EfeitoCanonico {
  const def = REGISTRO_EFEITOS[tipo];
  const parcial: Partial<Omit<EfeitoCanonico, 'tipo'>> = {};
  if (typeof bruto === 'number') {
    const campo = def.campos[0];
    if (campo) parcial[campo] = bruto;
    else parcial.duracaoMs = bruto;
  } else if (ehObjeto(bruto)) {
    const valor = numeroOpcional(l, bruto, 'valor', -1000, 1000);
    const pct = numeroOpcional(l, bruto, 'pct', -100, 1000);
    const duracao = numeroOpcional(l, bruto, 'duracaoMs', 0, 600_000);
    const em = destino(l, bruto);
    // Marco 8A-2: efeito carregado (um nível só) e referência a conteúdo (preset do `invocar`).
    // A forma canônica (`interno`, `ref: null`) também é aceita: normalizar de novo não muda nada.
    const carregado = bruto.efeito ?? bruto.interno;
    if (carregado !== undefined && carregado !== null) {
      if (profundidade > 0) l.erro(`efeito ${tipo}: efeito dentro de efeito dentro de efeito não é permitido`);
      const internos = normalizarEfeito(carregado, l, profundidade + 1);
      if (internos.length !== 1) l.erro(`efeito ${tipo}: "efeito" precisa ter exatamente um componente`);
      const interno = internos[0];
      if (interno) parcial.interno = interno;
    }
    if (bruto.ref !== undefined && bruto.ref !== null) {
      if (typeof bruto.ref === 'string' && bruto.ref !== '') parcial.ref = bruto.ref;
      else l.erro(`efeito ${tipo}: "ref" precisa ser texto`);
    }
    if (valor !== undefined) parcial.valor = valor;
    if (pct !== undefined) parcial.pct = pct;
    if (duracao !== undefined) parcial.duracaoMs = duracao;
    if (em) parcial.em = em;
    for (const k of Object.keys(bruto)) {
      if (!['valor', 'pct', 'duracaoMs', 'em', 'efeito', 'interno', 'ref'].includes(k)) l.erro(`efeito ${tipo}: campo desconhecido "${k}"`);
    }
  } else if (bruto !== true) {
    l.erro(`efeito ${tipo}: use número, objeto ou true`);
  }
  // Se a autoria deu algum campo do tipo, os outros campos dele valem 0 (não herdam o padrão):
  // `{ "tipo": "cura", "pct": 40 }` cura 40%, sem somar o valor fixo padrão.
  if (def.campos.some((c) => parcial[c] !== undefined)) for (const c of def.campos) parcial[c] ??= 0;
  if (parcial.duracaoMs === undefined && duracaoComum !== undefined) parcial.duracaoMs = duracaoComum;
  if (parcial.em === undefined && emComum !== undefined) parcial.em = emComum;
  for (const campo of def.exige) {
    if (campo === 'interno' && !parcial.interno) l.erro(`efeito ${tipo}: precisa de "efeito"`);
    if (campo === 'ref' && !parcial.ref) l.erro(`efeito ${tipo}: precisa de "ref"`);
  }
  return construirEfeito(tipo, parcial);
}

/** Devolve as entradas canônicas de um efeito autorado; erros vão para o `Leitor`. */
export function normalizarEfeito(bruto: unknown, l: Leitor, profundidade = 0): EfeitoCanonico[] {
  if (!ehObjeto(bruto)) {
    l.erro('efeito precisa ser um objeto');
    return [];
  }
  if (bruto.tipo !== undefined) {
    if (!ehTipoEfeito(bruto.tipo)) {
      l.erro(`tipo de efeito desconhecido "${typeof bruto.tipo === "string" ? bruto.tipo : JSON.stringify(bruto.tipo)}"`);
      return [];
    }
    const { tipo, ...resto } = bruto;
    return [componente(l, tipo, resto, undefined, undefined, profundidade)];
  }
  const duracaoComum = numeroOpcional(l, bruto, 'duracaoMs', 0, 600_000);
  const emComum = destino(l, bruto);
  const saida: EfeitoCanonico[] = [];
  for (const [chave, valor] of Object.entries(bruto)) {
    if (CHAVES_COMUNS.has(chave)) continue;
    if (!ehTipoEfeito(chave)) {
      l.erro(`tipo de efeito desconhecido "${chave}"`);
      continue;
    }
    saida.push(componente(l, chave, valor, duracaoComum, emComum, profundidade));
  }
  if (saida.length === 0) l.erro('efeito sem componente reconhecido');
  return saida;
}

export function normalizarEfeitos(lista: readonly unknown[], l: Leitor): EfeitoCanonico[] {
  return lista.flatMap((e) => normalizarEfeito(e, l));
}
