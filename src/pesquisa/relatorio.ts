// Relatório do teste com pessoas (§5.7). Marco 7A (13/10/2026). Puro e compartilhado: o cliente
// monta, o servidor valida antes de gravar e a ferramenta de resumo lê. Anônimo por construção:
// nenhum campo identifica a pessoa, o aparelho ou a rede (D-044).

import { ehObjeto } from '../core/validar';

export const VERSAO_RELATORIO = 1;
export const MAX_BYTES_RELATORIO = 8 * 1024;
export const MAX_COMENTARIO = 500;

export type RespostaAviso = 'reconheci' | 'nao_reconheci' | 'nao_vi';
export type RespostaEntendimento = 'sim' | 'mais_ou_menos' | 'nao';

export const RESPOSTAS_AVISO: readonly RespostaAviso[] = ['reconheci', 'nao_reconheci', 'nao_vi'];
export const RESPOSTAS_ENTENDIMENTO: readonly RespostaEntendimento[] = ['sim', 'mais_ou_menos', 'nao'];

/**
 * Os três avisos de ataque (§5.7), como a telegrafia os desenha: área no chão que enche até o impacto,
 * linha de mira que engrossa (golpes e disparos) e projétil em voo com rastro.
 */
export const AVISOS = ['area', 'linha', 'projetil'] as const;
export type Aviso = (typeof AVISOS)[number];

export interface MedidasDaSessao {
  duracaoS: number;
  /** Primeiro dano dado ou recebido; null se não lutou. */
  tempoAtePrimeiraLutaS: number | null;
  mortes: number;
  /** Inimigos derrotados pelo jogador (sem contar o boneco de treino). */
  abates: number;
  ataquesBasicos: number;
  habilidades: Record<string, number>;
  itensColetados: number;
  /** Segundos até equipar o primeiro item; null se não equipou. */
  equipouEmS: number | null;
  nivelFinal: number;
  distribuiuPontos: boolean;
  /** Lutou de novo depois de equipar ou subir de nível (o ciclo da §5.7). */
  voltouALutarDepoisDeMelhorar: boolean;
  viuBoss: boolean;
  bossDerrotado: boolean;
}

export interface RespostasDaPessoa {
  avisos: Record<Aviso, RespostaAviso>;
  entendeuEquipamento: RespostaEntendimento;
  comentario: string;
}

export interface RelatorioPesquisa {
  versao: number;
  /** Versão do conteúdo do jogo (hash), para comparar rodadas. */
  conteudo: string;
  plataforma: { toque: boolean; largura: number; altura: number; dpr: number };
  medidas: MedidasDaSessao;
  respostas: RespostasDaPessoa;
}

const numero = (v: unknown, min = 0, max = 1e7): v is number => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const inteiro = (v: unknown, max = 1e6): v is number => numero(v, 0, max) && Number.isInteger(v);
const opcao = <T extends string>(v: unknown, lista: readonly T[]): v is T => typeof v === 'string' && (lista as readonly string[]).includes(v);

/** Confere um relatório vindo de fora (servidor ou arquivo). Devolve null se algo não bater. */
export function lerRelatorio(bruto: unknown): RelatorioPesquisa | null {
  if (!ehObjeto(bruto) || bruto.versao !== VERSAO_RELATORIO || typeof bruto.conteudo !== 'string' || bruto.conteudo.length > 64) return null;
  const p = bruto.plataforma;
  if (!ehObjeto(p) || typeof p.toque !== 'boolean' || !inteiro(p.largura, 20_000) || !inteiro(p.altura, 20_000) || !numero(p.dpr, 0, 10)) return null;
  const m = bruto.medidas;
  if (!ehObjeto(m)) return null;
  const opcional = (v: unknown) => v === null || numero(v);
  const habilidades = m.habilidades;
  if (
    !numero(m.duracaoS) ||
    !opcional(m.tempoAtePrimeiraLutaS) ||
    !opcional(m.equipouEmS) ||
    ![m.mortes, m.abates, m.ataquesBasicos, m.itensColetados].every((v) => inteiro(v)) ||
    !inteiro(m.nivelFinal, 30) ||
    ![m.distribuiuPontos, m.voltouALutarDepoisDeMelhorar, m.viuBoss, m.bossDerrotado].every((v) => typeof v === 'boolean') ||
    !ehObjeto(habilidades) ||
    Object.keys(habilidades).length > 32 ||
    !Object.entries(habilidades).every(([k, v]) => k.length <= 64 && inteiro(v))
  ) {
    return null;
  }
  const r = bruto.respostas;
  if (!ehObjeto(r) || !ehObjeto(r.avisos) || !opcao(r.entendeuEquipamento, RESPOSTAS_ENTENDIMENTO)) return null;
  const avisos = r.avisos;
  if (!AVISOS.every((a) => opcao(avisos[a], RESPOSTAS_AVISO))) return null;
  if (typeof r.comentario !== 'string' || r.comentario.length > MAX_COMENTARIO) return null;
  // Cópia limpa, só com os campos conhecidos.
  return {
    versao: VERSAO_RELATORIO,
    conteudo: bruto.conteudo,
    plataforma: { toque: p.toque, largura: p.largura, altura: p.altura, dpr: p.dpr },
    medidas: {
      duracaoS: m.duracaoS,
      tempoAtePrimeiraLutaS: m.tempoAtePrimeiraLutaS,
      mortes: m.mortes as number,
      abates: m.abates as number,
      ataquesBasicos: m.ataquesBasicos as number,
      habilidades: { ...(habilidades as Record<string, number>) },
      itensColetados: m.itensColetados as number,
      equipouEmS: m.equipouEmS,
      nivelFinal: m.nivelFinal,
      distribuiuPontos: m.distribuiuPontos as boolean,
      voltouALutarDepoisDeMelhorar: m.voltouALutarDepoisDeMelhorar as boolean,
      viuBoss: m.viuBoss as boolean,
      bossDerrotado: m.bossDerrotado as boolean,
    },
    respostas: {
      avisos: { area: avisos.area as RespostaAviso, linha: avisos.linha as RespostaAviso, projetil: avisos.projetil as RespostaAviso },
      entendeuEquipamento: r.entendeuEquipamento,
      comentario: r.comentario,
    },
  };
}

/** "Concluiu o primeiro encontro" (§5.7): derrotou ao menos um inimigo de verdade. */
export function concluiuPrimeiroEncontro(r: RelatorioPesquisa): boolean {
  return r.medidas.abates >= 1;
}

export function reconheceuOsTresAvisos(r: RelatorioPesquisa): boolean {
  return AVISOS.every((a) => r.respostas.avisos[a] === 'reconheci');
}
