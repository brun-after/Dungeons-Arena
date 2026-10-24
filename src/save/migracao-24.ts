// Migração 23 para 24 (marco 24, 24/10/2026, D-094): skills de classe, barra de 6 e livros. Puro, sobre o JSON do save.
// - renomeia as skills do Guerreiro v1.2 (conhecidas, barra, estudo, recargas) e os livros delas na mochila;
// - skill de classe deixa de gastar ponto: os pontos postos nelas voltam (as da própria classe ficam, no rank do nível;
//   as de outra classe saem — agora são exclusivas);
// - as gerais conhecidas ficam liberadas, e a classe ganha as 2 iniciais e a geral inicial que faltarem;
// - a barra vira 6 teclas (1–2 de classe, 3–6 gerais, na ordem de antes) e as passivas gerais conhecidas ligam até 3.

import { definicaoDe } from '../combat/compilar-habilidade';
import { conteudoOficial } from '../core/conteudo';
import { BALANCE_PADRAO } from '../core/contexto';
import { ehObjeto, type Objeto } from '../core/validar';
import { SLOTS_BARRA, SLOTS_CLASSE } from '../entities/entidade';
import { ehDaClasse, ehDeAlgumaClasse, rankDeClassePeloNivel } from '../progression/habilidades-classe';

export const RENOMEADAS_24: Readonly<Record<string, string>> = {
  escudo_de_ferro: 'investida_de_escudo',
  grito_de_guerra: 'brado',
  golpe_flamejante: 'lamina_em_brasa',
};

/** O kit de cada classe na versão 23 (vinha de graça) e o que ela aprendia com ponto. */
const KIT_23: Readonly<Record<string, readonly string[]>> = {
  aventureiro: ['seta_arcana', 'explosao', 'curar', 'golpe_atordoante'],
  guerreiro: ['investida', 'redemoinho', 'brado', 'investida_de_escudo'],
  mago: ['bola_de_fogo', 'lanca_de_gelo', 'raio_em_cadeia', 'barreira'],
  arqueiro: ['flecha_perfurante', 'chuva_de_flechas', 'flecha_venenosa', 'tiro_em_leque'],
  necromante: ['dardo_funesto', 'dizimo_vital', 'garras_do_ossuario', 'comando_sepulcral'],
};
const COM_PONTO_23: Readonly<Record<string, readonly string[]>> = {
  aventureiro: ['investida', 'bola_de_fogo', 'flecha_venenosa', 'barreira', 'pele_de_pedra'],
  guerreiro: ['corrente', 'lamina_em_brasa', 'pele_de_pedra', 'golpe_atordoante'],
  mago: ['nova_glacial', 'mente_partida', 'afinidade_elemental', 'curar', 'seta_arcana', 'explosao'],
  arqueiro: ['troca_sombria', 'olho_de_aguia', 'golpe_atordoante'],
  necromante: ['ceifa_de_almas', 'mortalha_funebre', 'flecha_venenosa', 'bola_de_fogo', 'lanca_radiante', 'barreira'],
};

const renomear = (id: unknown): unknown => (typeof id === 'string' ? (RENOMEADAS_24[id] ?? id) : id);
const renomearLivro = (itemId: unknown): unknown => {
  if (typeof itemId !== 'string' || !itemId.startsWith('livro_')) return itemId;
  const novo = RENOMEADAS_24[itemId.slice(6)];
  return novo ? `livro_${novo}` : itemId;
};

interface Conhecida { id: string; rank: number; caminhos: string[] }

function migrarJogador(x: Objeto): Objeto {
  const b = x.bolsa;
  if (!ehObjeto(b) || typeof b.classeId !== 'string' || !Array.isArray(b.conhecidas)) return x;
  const ctx = { conteudo: conteudoOficial(), balance: BALANCE_PADRAO };
  const classe = ctx.conteudo.classes.get(b.classeId);
  if (!classe) return x;
  const nivel = typeof x.nivel === 'number' ? x.nivel : 1;
  const kit = KIT_23[classe.id] ?? [];
  const comPonto = COM_PONTO_23[classe.id] ?? [];
  let devolvidos = 0;
  const conhecidas: Conhecida[] = [];
  for (const v of b.conhecidas) {
    if (!ehObjeto(v) || typeof v.id !== 'string' || typeof v.rank !== 'number') continue;
    const c: Conhecida = { id: String(renomear(v.id)), rank: v.rank, caminhos: Array.isArray(v.caminhos) ? v.caminhos.filter((s): s is string => typeof s === 'string') : [] };
    if (!definicaoDe(ctx, c.id) || conhecidas.some((k) => k.id === c.id)) continue;
    if (ehDeAlgumaClasse(ctx, c.id)) {
      // Os ranks acima do 1 custaram ponto; o 1, só quando não era do kit nem veio de livro (o que se aprendia com ponto).
      devolvidos += Math.max(0, c.rank - 1) + (!kit.includes(c.id) && comPonto.includes(c.id) ? 1 : 0);
      if (!ehDaClasse(ctx, { classeId: classe.id }, c.id)) continue;
    }
    conhecidas.push(c);
  }
  for (const id of [...classe.iniciais, ...(classe.geralInicial ? [classe.geralInicial] : [])]) {
    if (!conhecidas.some((c) => c.id === id)) conhecidas.push({ id, rank: 1, caminhos: [] });
  }
  for (const c of conhecidas) if (ehDaClasse(ctx, { classeId: classe.id }, c.id)) c.rank = Math.max(1, c.rank, rankDeClassePeloNivel(ctx, c.id, nivel, c.caminhos));

  const ativa = (id: string) => conhecidas.some((c) => c.id === id) && !definicaoDe(ctx, id)?.base.passiva;
  const antiga = (Array.isArray(b.barra) ? b.barra : []).map(renomear).filter((id): id is string => typeof id === 'string' && ativa(id));
  const deClasse = [...antiga, ...classe.iniciais, ...conhecidas.map((c) => c.id)].filter((id) => ehDaClasse(ctx, { classeId: classe.id }, id) && ativa(id));
  const gerais = [...antiga, ...(classe.geralInicial ? [classe.geralInicial] : [])].filter((id) => !ehDeAlgumaClasse(ctx, id) && ativa(id));
  const unicas = (l: string[]) => [...new Set(l)];
  const teclas = Array.from({ length: SLOTS_BARRA }, (_, i) => {
    if (i < SLOTS_CLASSE) return unicas(deClasse)[i] ?? null;
    return unicas(gerais)[i - SLOTS_CLASSE] ?? null;
  });
  const passivas = conhecidas.filter((c) => definicaoDe(ctx, c.id)?.familiaGeral && definicaoDe(ctx, c.id)?.base.passiva).map((c) => c.id).slice(0, 3);
  const liberadas = conhecidas.filter((c) => !ehDeAlgumaClasse(ctx, c.id)).map((c) => c.id);
  const estudo = ehObjeto(b.estudo) ? { ...b.estudo, id: renomear(b.estudo.id) } : b.estudo;
  // Um estudo de skill de classe (de qualquer uma) acaba: a da própria classe entra conhecida, a de outra sai.
  const estudoDeClasse = ehObjeto(estudo) && typeof estudo.id === 'string' && ehDeAlgumaClasse(ctx, estudo.id);
  if (estudoDeClasse && typeof estudo.id === 'string') {
    devolvidos += 1;
    if (ehDaClasse(ctx, { classeId: classe.id }, estudo.id) && !conhecidas.some((c) => c.id === estudo.id)) conhecidas.push({ id: estudo.id, rank: 1, caminhos: [] });
  }
  const mochila = Array.isArray(b.mochila) ? b.mochila.map((i: unknown) => (ehObjeto(i) ? { ...i, itemId: renomearLivro(i.itemId) } : i)) : b.mochila;
  const pontos = typeof b.pontosHabilidade === 'number' ? b.pontosHabilidade : 0;
  return {
    ...x,
    habilidades: teclas.filter((id): id is string => id !== null),
    tatica: undefined,
    bolsa: {
      ...b,
      conhecidas,
      barra: teclas,
      liberadas,
      passivasAtivas: passivas,
      estudo: estudoDeClasse ? null : estudo,
      mochila,
      pontosHabilidade: pontos + devolvidos,
    },
  };
}

function migrarEstado(v: unknown): unknown {
  if (!ehObjeto(v) || !Array.isArray(v.entidades)) return v;
  const recargas = ehObjeto(v.recargas)
    ? Object.fromEntries(Object.entries(v.recargas).map(([k, t]) => {
      const antigo = Object.keys(RENOMEADAS_24).find((id) => k.endsWith(`_${id}`));
      return antigo ? [`${k.slice(0, -antigo.length)}${RENOMEADAS_24[antigo] ?? antigo}`, t] : [k, t];
    }))
    : v.recargas;
  return { ...v, recargas, entidades: v.entidades.map((x: unknown) => (ehObjeto(x) ? migrarJogador(x) : x)) };
}

export function migrarSkillsDeClasse(r: Objeto): Objeto {
  const fasesVisitadas = ehObjeto(r.fasesVisitadas)
    ? Object.fromEntries(Object.entries(r.fasesVisitadas).map(([id, fase]) => [id, migrarEstado(fase)])) : r.fasesVisitadas;
  return { ...r, estado: migrarEstado(r.estado), fasesVisitadas };
}
