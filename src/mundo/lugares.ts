// Os lugares do Mundo (marco 29, 30/10/2026, D-128): cada sala do servidor é um lugar. A região é o exterior gerado
// pela semente; a masmorra (instanciada por grupo) e o covil (compartilhado) são interiores gerados como as fases da
// campanha, com o nível, o tema, os inimigos e o chefe do reino. As regras que mudam por lugar saem dos dados:
// - o PvP é o da região (`reino.perigos`), que liga o fogo amigo entre os jogadores;
// - a masmorra não deixa túmulo (morrer nela não perde itens); o covil conta como fora de dungeon.
// Puro.

import type { Conteudo } from '../core/conteudo';
import { BALANCE_PADRAO, type ContextoSimulacao } from '../core/contexto';
import { hashTexto } from '../core/rng';
import type { EstadoJogo } from '../core/estado';
import { QUALQUER_PRESET, type ModoDeJogo } from '../modos/modo';
import { contextoDaFase, estadoInicialDaFase } from '../save/fases-campanha';
import { catalogoDeGeracao, gerarFase } from '../world/gerador';
import { gerarExterior, type ExteriorGerado } from '../world/gerador-exterior';
import { FRAGMENTO_DE_PORTAL, objetosDoExterior, PORTAL_TEMPORARIO } from './objetos-mundo';
import { territorioDoLugar, vizinha } from './reino';
import { estoqueDeDungeon } from './lojas-mundo';
import type { CovilDoMundo, MasmorraDoMundo, MaterialDeInimigo, Reino, RegiaoDoMundo, RegrasDePerigo } from './reino';

/** Marco 54 (D-207): o id do lugar do Mundo contínuo. */
export const ID_LUGAR_MUNDO = 'mundo';

export type Lugar =
  | { tipo: 'regiao'; regiao: RegiaoDoMundo }
  /** Marco 54 (26/11/2026, D-207): o Mundo contínuo, o atlas inteiro numa sala (mundo/mundo-continuo.ts). */
  | { tipo: 'mundo' }
  | { tipo: 'masmorra'; masmorra: MasmorraDoMundo }
  | { tipo: 'covil'; covil: CovilDoMundo };

/** O id do lugar em texto: `regiao:<id>`, `masmorra:<id>` ou `covil:<id>`. */
export function idDoLugar(l: Lugar): string {
  if (l.tipo === 'mundo') return ID_LUGAR_MUNDO;
  return l.tipo === 'regiao' ? `regiao:${l.regiao.id}` : l.tipo === 'masmorra' ? `masmorra:${l.masmorra.id}` : `covil:${l.covil.id}`;
}

export function lerLugar(reino: Reino, texto: unknown): Lugar | null {
  if (typeof texto !== 'string') return null;
  if (texto === ID_LUGAR_MUNDO) return { tipo: 'mundo' };
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

/**
 * Marco 30 (D-129): o modo em todo lugar do reino leva os materiais que os monstros deixam. Marco 38 (08/11/2026,
 * D-142): os do atlas (os troféus dos chefes valem em todo reino) somados aos do reino do lugar.
 */
export function comMateriais(modo: ModoDeJogo, reino: Reino, lugarId: string): ModoDeJogo {
  const proprio = territorioDoLugar(reino, lugarId).materiais;
  const materiais: Record<string, MaterialDeInimigo[]> = {};
  for (const fonte of proprio === reino.materiais ? [reino.materiais] : [reino.materiais, proprio]) {
    for (const [preset, lista] of Object.entries(fonte)) {
      const atual = materiais[preset] ?? [];
      materiais[preset] = [...atual, ...lista.filter((m) => !atual.some((a) => a.itemId === m.itemId))];
    }
  }
  // 09/11/2026 (D-143): qualquer monstro do Mundo pode deixar o fragmento de portal e, bem raro, o portal inteiro.
  const pt = BALANCE_PADRAO.mundo.portalTemporario;
  materiais[QUALQUER_PRESET] = [{ itemId: FRAGMENTO_DE_PORTAL, chancePct: pt.fragmentoChancePct }, { itemId: PORTAL_TEMPORARIO, chancePct: pt.inteiroChancePct }];
  return { ...modo, materiaisDeInimigos: materiais };
}

export interface LugarMontado {
  ctx: ContextoSimulacao;
  estado: EstadoJogo;
  /** Só nas regiões: o exterior gerado (passagens, vila, pontos). */
  exterior: ExteriorGerado | null;
  /** Marco 54 (D-207): no Mundo contínuo, as estruturas de todas as regiões em coordenadas do atlas. */
  regiaoDoAtlas?: RegiaoDoMundo;
}

/** O interior de uma masmorra ou covil: fase gerada com os inimigos e o chefe do reino. */
function interior(conteudo: Conteudo, reino: Reino, d: MasmorraDoMundo | CovilDoMundo, prefixo: string) {
  const catalogo = { ...catalogoDeGeracao(conteudo, estoqueDeDungeon(conteudo, territorioDoLugar(reino,d.id), d.nivel)), comuns: [...d.inimigos], boss: d.boss };
  // 07/11/2026 (D-135): no Mundo, nenhuma masmorra em espiral (o corredor sem fim era só andar); todas são de salas,
  // no tamanho que as salas pedem.
  return gerarFase(
    { id: `mundo_${prefixo}_${d.id}`, nome: d.nome, semente: hashTexto(`${prefixo}:${d.id}`), salas: d.salas, nivelInimigos: d.nivel, matizGraus: 0, ...(d.tema && { tema: d.tema }),
      // 06/11/2026 (D-135): no Mundo, as armadilhas são parte do perigo de cada sala.
      armadilhasPorSala: BALANCE_PADRAO.armadilhas.mundoPorSala },
    catalogo,
  );
}

/** Monta o contexto e o estado inicial do lugar (com os objetos do exterior, nas regiões). */
export function montarLugar(conteudo: Conteudo, reino: Reino, lugar: Lugar, modoBase: ModoDeJogo): LugarMontado {
  // Marco 54 (D-207): o atlas inteiro leva ~20 s; quem o monta é o servidor, em etapas (mundo/mundo-continuo.ts).
  if (lugar.tipo === 'mundo') throw new Error('o Mundo contínuo é montado por etapasDoMundoContinuo');
  if (lugar.tipo === 'regiao') {
    const exterior = gerarExterior(reino, lugar.regiao);
    const r = contextoDaFase(conteudo, exterior.fase, comMateriais(modoDaRegiao(modoBase, reino.perigos[lugar.regiao.perigo]), reino, lugar.regiao.id));
    if (!r.ok) throw new Error(`região ${lugar.regiao.id} inválida: ${r.erro}`);
    // Marco 30 (30/10/2026, D-129): os muros da vila são refúgio (os monstros não entram nem atacam quem está dentro).
    const v = exterior.vila;
    // E o tipo de cada estrutura (o render desenha a fachada pelo tipo).
    const estruturas = lugar.regiao.estruturas.map((e) => ({ x: e.x, y: e.y, tipo: e.tipo }));
    // Marco 31 (D-130): os telhados das casas (gerados aqui, fora da validação das fases à mão).
    const telhados = exterior.fase.telhados ?? [];
    // Marco 38 (D-142): a clareira da pedra de save das regiões sem vila também é refúgio.
    const refugios = [...(v ? [{ x: v.x, y: v.y, raio: v.raio + 0.5 }] : []), ...(exterior.abrigo ? [{ x: exterior.abrigo.x, y: exterior.abrigo.y, raio: exterior.abrigo.raio + 0.5 }] : [])];
    // Marco 41 (14/11/2026, D-169): as passagens para as vizinhas (sem monstros e sem dano) e os enfeites delas.
    const passagens = exterior.faixas.map((f) => {
      const la = vizinha(reino, lugar.regiao, f.lado);
      return { ...f.area, lado: f.lado, ...(la && { destino: `regiao:${la.id}` }) };
    });
    const fase = { ...r.ctx.fase, estruturas, exterior: true, alturas: exterior.alturas, obstaculos: exterior.obstaculos, cenario: exterior.pecas, bioma: lugar.regiao.bioma, escuroBase: lugar.regiao.escuroBase ?? 0, ...(lugar.regiao.matas && { matas: lugar.regiao.matas }), ...(exterior.ninhos.length > 0 && { ninhos: exterior.ninhos }), telhados, ...(refugios.length > 0 && { refugios }), ...(passagens.length > 0 && { passagens, enfeites: exterior.enfeites }) };
    const ctx = { ...r.ctx, fase };
    const estado = estadoInicialDaFase(ctx);
    estado.objetos.push(...objetosDoExterior(territorioDoLugar(reino,lugar.regiao.id), exterior));
    return { ctx, estado, exterior };
  }
  const masmorra = lugar.tipo === 'masmorra';
  const dados = masmorra ? lugar.masmorra : lugar.covil;
  // A masmorra não deixa túmulo; o covil segue a regra do Mundo (conta como fora).
  // Marco 47 (D-190): o chefe da masmorra e do covil é maior (mais peças de armadura).
  const modo = comMateriais(masmorra ? { ...modoBase, tumuloNaMorte: false, chefeMaior: true } : { ...modoBase, chefeMaior: true }, reino, dados.id);
  const r = contextoDaFase(conteudo, interior(conteudo, reino, dados, lugar.tipo), modo);
  if (!r.ok) throw new Error(`${lugar.tipo} ${dados.id} inválida: ${r.erro}`);
  return { ctx: r.ctx, estado: estadoInicialDaFase(r.ctx), exterior: null };
}
