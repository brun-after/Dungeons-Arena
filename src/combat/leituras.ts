// Marco 40 (12/11/2026, D-159): as leituras de estilo das skills de classe. Cada skill de classe diz, para cada um dos
// cinco estilos da classe, que eixo aquele estilo empurra nela (a forma, gradual de 10% a 100% da ponta) e o que muda
// além da forma (efeitos graduais pela faixa, como os da função secundária). O texto é o que a carta mostra.

import type { Leitor } from '../core/validar';
import { ehObjeto } from '../core/validar';
import { EIXOS, type Eixo } from './eixos';
import type { Habilidade } from './habilidades';
import { cabeNaSkill, lerEfeitosGraduais, naFaixa, type EfeitoSecundario } from './papeis';

export interface Leitura {
  eixo: Eixo;
  texto: string;
  efeitos: readonly EfeitoSecundario[];
}

/** estilo -> leitura. */
export type Leituras = Readonly<Record<string, Leitura>>;

export function lerLeituras(l: Leitor, v: unknown): Leituras {
  const saida: Record<string, Leitura> = {};
  const o = l.objeto(v, 'leituras');
  for (const [estilo, bruto] of Object.entries(o)) {
    if (!/^[a-z_]+$/.test(estilo)) l.erro(`leituras: estilo "${estilo}" só aceita a–z e _`);
    const x = l.objeto(bruto, `leituras.${estilo}`);
    const eixo = l.texto(x, 'eixo');
    if (!(EIXOS as readonly string[]).includes(eixo)) l.erro(`leituras.${estilo}: eixo desconhecido "${eixo}"`);
    for (const k of Object.keys(x)) if (!['eixo', 'texto', 'efeitos'].includes(k)) l.erro(`leituras.${estilo}: campo desconhecido "${k}"`);
    const efeitos = x.efeitos === undefined ? [] : lerEfeitosGraduais(l, Array.isArray(x.efeitos) ? x.efeitos : [], `leituras.${estilo}`);
    if (x.efeitos !== undefined && !Array.isArray(x.efeitos)) l.erro(`leituras.${estilo}: efeitos precisa ser lista`);
    saida[estilo] = { eixo: eixo as Eixo, texto: ehObjeto(x) && typeof x.texto === 'string' ? x.texto : '', efeitos };
  }
  return saida;
}

/** A skill com os efeitos das leituras ativas, cada uma na faixa do seu estilo. Não repete um efeito que ela já tem. */
export function aplicarLeituras(h: Habilidade, leituras: Leituras | undefined, ativas: readonly { estilo: string; faixa: number }[]): Habilidade {
  if (!leituras || ativas.length === 0) return h;
  const efeitos = [...h.efeitos];
  for (const a of ativas) {
    for (const s of leituras[a.estilo]?.efeitos ?? []) {
      const e = naFaixa(s, a.faixa);
      if (e && cabeNaSkill(h, e) && !efeitos.some((x) => x.tipo === e.tipo && x.em === e.em)) efeitos.push(e);
    }
  }
  return { ...h, efeitos };
}
