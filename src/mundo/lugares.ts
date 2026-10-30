// Os lugares do Mundo (marco 29, 30/10/2026, D-128): cada sala do servidor é um lugar. A região é o exterior gerado
// pela semente; a masmorra (instanciada por grupo) e o covil (compartilhado) são interiores gerados como as fases da
// campanha, com o nível, o tema, os inimigos e o chefe do reino. As regras que mudam por lugar saem dos dados:
// - o PvP é o da região (`reino.perigos`), que liga o fogo amigo entre os jogadores;
// - a masmorra não deixa túmulo (morrer nela não perde itens); o covil conta como fora de dungeon.
// Puro.

import type { Conteudo } from '../core/conteudo';
import type { ContextoSimulacao } from '../core/contexto';
import { hashTexto } from '../core/rng';
import type { EstadoJogo } from '../core/estado';
import type { ModoDeJogo } from '../modos/modo';
import { contextoDaFase, estadoInicialDaFase } from '../save/fases-campanha';
import { catalogoDeGeracao, gerarFase } from '../world/gerador';
import { gerarExterior, type ExteriorGerado } from '../world/gerador-exterior';
import { objetosDoExterior } from './objetos-mundo';
import type { CovilDoMundo, MasmorraDoMundo, Reino, RegiaoDoMundo, RegrasDePerigo } from './reino';

export type Lugar =
  | { tipo: 'regiao'; regiao: RegiaoDoMundo }
  | { tipo: 'masmorra'; masmorra: MasmorraDoMundo }
  | { tipo: 'covil'; covil: CovilDoMundo };

/** O id do lugar em texto: `regiao:<id>`, `masmorra:<id>` ou `covil:<id>`. */
export function idDoLugar(l: Lugar): string {
  return l.tipo === 'regiao' ? `regiao:${l.regiao.id}` : l.tipo === 'masmorra' ? `masmorra:${l.masmorra.id}` : `covil:${l.covil.id}`;
}

export function lerLugar(reino: Reino, texto: unknown): Lugar | null {
  if (typeof texto !== 'string') return null;
  const [tipo, id] = texto.split(':');
  if (tipo === 'regiao') {
    const regiao = reino.regioes.find((r) => r.id === id);
    return regiao ? { tipo, regiao } : null;
  }
  if (tipo === 'masmorra') {
    const masmorra = reino.masmorras.find((m) => m.id === id);
    return masmorra ? { tipo, masmorra } : null;
  }
  if (tipo === 'covil') {
    const covil = reino.covis.find((c) => c.id === id);
    return covil ? { tipo, covil } : null;
  }
  return null;
}

/** O modo com as regras da região: PvP pelo perigo (fogo amigo entre jogadores). */
export function modoDaRegiao(modo: ModoDeJogo, perigo: RegrasDePerigo): ModoDeJogo {
  return { ...modo, fogoAmigo: perigo.pvp, lootPct: perigo.lootPct };
}

/** Marco 30 (D-129): o modo em todo lugar do reino leva os materiais que os monstros deixam. */
const comMateriais = (modo: ModoDeJogo, reino: Reino): ModoDeJogo => ({ ...modo, materiaisDeInimigos: reino.materiais });

export interface LugarMontado {
  ctx: ContextoSimulacao;
  estado: EstadoJogo;
  /** Só nas regiões: o exterior gerado (passagens, vila, pontos). */
  exterior: ExteriorGerado | null;
}

/** O interior de uma masmorra ou covil: fase gerada com os inimigos e o chefe do reino. */
function interior(conteudo: Conteudo, reino: Reino, d: MasmorraDoMundo | CovilDoMundo, prefixo: string) {
  const catalogo = { ...catalogoDeGeracao(conteudo, reino.lojas.mercador ?? []), comuns: [...d.inimigos], boss: d.boss };
  return gerarFase(
    { id: `mundo_${prefixo}_${d.id}`, nome: d.nome, semente: hashTexto(`${prefixo}:${d.id}`), salas: d.salas, nivelInimigos: d.nivel, matizGraus: 0, ...(d.tema && { tema: d.tema }) },
    catalogo,
  );
}

/** Monta o contexto e o estado inicial do lugar (com os objetos do exterior, nas regiões). */
export function montarLugar(conteudo: Conteudo, reino: Reino, lugar: Lugar, modoBase: ModoDeJogo): LugarMontado {
  if (lugar.tipo === 'regiao') {
    const exterior = gerarExterior(reino, lugar.regiao);
    const r = contextoDaFase(conteudo, exterior.fase, comMateriais(modoDaRegiao(modoBase, reino.perigos[lugar.regiao.perigo]), reino));
    if (!r.ok) throw new Error(`região ${lugar.regiao.id} inválida: ${r.erro}`);
    // Marco 30 (30/10/2026, D-129): os muros da vila são refúgio (os monstros não entram nem atacam quem está dentro).
    const v = exterior.vila;
    const ctx = v ? { ...r.ctx, fase: { ...r.ctx.fase, refugios: [{ x: v.x, y: v.y, raio: v.raio + 0.5 }] } } : r.ctx;
    const estado = estadoInicialDaFase(ctx);
    estado.objetos.push(...objetosDoExterior(reino, exterior));
    return { ctx, estado, exterior };
  }
  const masmorra = lugar.tipo === 'masmorra';
  const dados = masmorra ? lugar.masmorra : lugar.covil;
  // A masmorra não deixa túmulo; o covil segue a regra do Mundo (conta como fora).
  const modo = comMateriais(masmorra ? { ...modoBase, tumuloNaMorte: false } : modoBase, reino);
  const r = contextoDaFase(conteudo, interior(conteudo, reino, dados, lugar.tipo), modo);
  if (!r.ok) throw new Error(`${lugar.tipo} ${dados.id} inválida: ${r.erro}`);
  return { ctx: r.ctx, estado: estadoInicialDaFase(r.ctx), exterior: null };
}
