// O que a sala do Mundo usa para levar alguém a outro lugar (marco 38, 08/11/2026, D-142):
// - marco 41 (14/11/2026, D-169): a troca no meio da passagem, a vizinha a aquecer e a pendência com a bagagem;
// - a chegada pela borda na vizinha (antes do marco 41), a célula do mercador do evento e as estruturas escondidas que quem passa perto
//   descobre (09/11/2026: vieram da sala do Mundo);
// - a chegada na pedra de save das regiões sem vila (ao lado da pedra, no centro);
// - o lugar ao acaso do reino da Pedra de retorno desviada: uma região do mesmo reino e uma célula onde o gerador pôs
//   um monstro ou um ponto de coleta (sempre alcançável a pé), sorteadas pela semente da sala.
// - a fonte das missões perto de quem pede: o andarilho ou a balconista da taverna da vila.
// Puro.

import type { Celula } from '../core/comandos';
import type { EstadoJogo } from '../core/estado';
import { passavel } from '../world/fase';
import type { Balance, ContextoSimulacao } from '../core/contexto';
import { raioDeRevelar } from '../progression/efeitos-atributo';
import { descobrir, type FichaDoMundo } from './ficha-mundo';
import { aleatorio, criarRng, hashTexto } from '../core/rng';
import type { Entidade } from '../entities/entidade';
import type { ExteriorGerado } from '../world/gerador-exterior';
import { gerarExterior } from '../world/gerador-exterior';
import { PREFIXO_ANDARILHO } from './objetos-mundo';
import { fonteDoAndarilho, portaDa, territorioDoLugar, vizinha, type Reino, type RegiaoDoMundo } from './reino';
import { chegadaPelaPassagem, passagemEm, TROCA_NA_PASSAGEM } from '../world/passagens-exterior';
import { vivo } from '../entities/entidade';
import { recolherBagagem } from './bagagem';
import { recolherComitiva } from './comitiva';
import type { PendenciaDoMundo } from './pendencias';

/** Onde chega quem não veio por uma passagem: ao lado da pedra de save do centro (null: o spawn da região). */
export function chegadaNaPedra(exterior: ExteriorGerado | null): Celula | null {
  return exterior?.abrigo ? { x: exterior.abrigo.x, y: exterior.abrigo.y + 1 } : null;
}

/** Uma região do reino de `aqui` e uma célula alcançável dela, sorteadas por `chave`. */
export function lugarAoAcaso(reino: Reino, aqui: string, chave: string): { regiao: RegiaoDoMundo; chegada: Celula } | null {
  const territorio = territorioDoLugar(reino, aqui);
  const candidatas = reino.regioes.filter((r) => territorio.regioes.some((t) => t.id === r.id));
  if (candidatas.length === 0) return null;
  const rng = criarRng(hashTexto(`retorno-desviado:${chave}`));
  const regiao = candidatas[Math.floor(aleatorio(rng) * candidatas.length)] ?? candidatas[0];
  if (!regiao) return null;
  const ex = gerarExterior(reino, regiao);
  const pontos: Celula[] = [...ex.pontos.flatMap((p) => (p.tipo === 'coleta' ? [{ x: p.x, y: p.y }] : [])), ...(ex.fase.inimigos ?? []).map((i) => ({ x: i.x, y: i.y }))];
  const c = pontos[Math.floor(aleatorio(rng) * pontos.length)] ?? ex.fase.spawns[0];
  return c ? { regiao, chegada: { x: c.x, y: c.y } } : null;
}

/** A fonte das missões perto de `e` (alcance em células): `npc:<andarilho>`, a vila da balconista, ou null. */
export function fonteDeMissoesPerto(estado: EstadoJogo, e: Entidade, alcance: number, vila: string | null): { fonte: string; andarilho: string | null } | null {
  for (const o of estado.objetos) {
    if (o.tipo !== 'npc' || !o.ref || Math.max(Math.abs(o.x - e.x), Math.abs(o.y - e.y)) > alcance) continue;
    if (o.ref.startsWith(PREFIXO_ANDARILHO)) {
      const id = o.ref.slice(PREFIXO_ANDARILHO.length);
      return { fonte: fonteDoAndarilho(id), andarilho: id };
    }
    if (o.ref === 'missoes' && vila) return { fonte: vila, andarilho: null };
  }
  return null;
}

/**
 * Marco 41 (14/11/2026, D-169): quem passou do meio da passagem vai à vizinha, no mesmo ponto físico da faixa (a
 * passagem é igual nos dois mapas). Null fora das passagens ou antes do meio.
 */
export function travessia(reino: Reino, regiao: RegiaoDoMundo, exterior: ExteriorGerado, e: Pick<Entidade, 'x' | 'y'>): { destino: RegiaoDoMundo; chegada: Celula } | null {
  const n = regiao.tamanho ?? reino.tamanhoRegiao;
  const aqui = passagemEm(exterior.faixas, n, e.x, e.y);
  if (!aqui || aqui.d > TROCA_NA_PASSAGEM) return null;
  const destino = vizinha(reino, regiao, aqui.passagem.lado);
  if (!destino) return null;
  return { destino, chegada: chegadaPelaPassagem(n, destino.tamanho ?? reino.tamanhoRegiao, aqui.passagem.lado, e.x, e.y) };
}

/** A vizinha do outro lado da passagem onde `e` está (a sala dela é aquecida antes da troca), ou null. */
export function vizinhaDaPassagem(reino: Reino, regiao: RegiaoDoMundo, exterior: ExteriorGerado, e: Pick<Entidade, 'x' | 'y'>): RegiaoDoMundo | null {
  const aqui = passagemEm(exterior.faixas, regiao.tamanho ?? reino.tamanhoRegiao, e.x, e.y);
  return aqui ? (vizinha(reino, regiao, aqui.passagem.lado) ?? null) : null;
}

/**
 * A pendência de troca de sala com o que segue junto: as invocações e o estado de quem viaja (mundo/bagagem.ts).
 * Depois de morrer, só as recargas e a mecânica de movimento seguem (renasce com a vida cheia e sem os efeitos).
 */
export function pendenciaDeTroca(estado: EstadoJogo, e: Entidade | undefined, base: { identidade: string; sessaoId: string; ficha: FichaDoMundo; destino: string; chegada: Celula | null; instancia: string | null }): Extract<PendenciaDoMundo, { tipo: 'trocar' }> {
  const comitiva = e ? recolherComitiva(estado, e.id) : [];
  if (!e) return { tipo: 'trocar', ...base, comitiva };
  const ids = new Set(comitiva.flatMap((v) => (v.idAntes ? [v.idAntes] : [])));
  const b = recolherBagagem(estado, e, ids);
  const viagem = vivo(e) ? b : { hp: Number.MAX_SAFE_INTEGER, mana: Number.MAX_SAFE_INTEGER, recargas: b.recargas, efeitos: [], buffsArmados: [], movimento: b.movimento, refugio: false, ...(b.petAtivo !== undefined && { petAtivo: b.petAtivo }) };
  return { tipo: 'trocar', ...base, comitiva: vivo(e) ? comitiva : [], viagem };
}

/** Uma célula andável e sem objeto, a poucos passos da entrada da região (o mercador errante do evento). */
export function celulaDoMercador(estado: EstadoJogo, ctx: ContextoSimulacao): Celula | null {
  const origem = ctx.fase.spawns[0];
  if (!origem) return null;
  for (let d = 3; d <= 8; d++) {
    for (const [dx, dy] of [[d, 0], [-d, 0], [0, d], [0, -d], [d, d], [-d, -d]] as const) {
      const x = origem.x + dx;
      const y = origem.y + dy;
      if (passavel(ctx.fase, x, y) && !estado.objetos.some((o) => o.x === x && o.y === y)) return { x, y };
    }
  }
  return null;
}

/**
 * Marco 30 (30/10/2026, D-129): as estruturas escondidas que `e` descobre agora (a porta a até o raio de revelar da
 * Sabedoria, o mesmo das armadilhas). Já anota na ficha; devolve o lugar e o nome de cada uma, para o aviso.
 */
export function escondidasReveladas(regiao: RegiaoDoMundo, e: Entidade, ficha: FichaDoMundo, balance: Balance): { lugar: string; nome: string }[] {
  const raio = raioDeRevelar(e.atributos, balance);
  const novas: { lugar: string; nome: string }[] = [];
  for (const estrutura of regiao.estruturas) {
    if (!estrutura.escondida) continue;
    const { porta } = portaDa(estrutura);
    if (Math.max(Math.abs(porta.x - e.x), Math.abs(porta.y - e.y)) > raio) continue;
    const lugar = `${estrutura.destino.tipo}:${estrutura.destino.id}`;
    if (descobrir(ficha, lugar)) novas.push({ lugar, nome: estrutura.nome });
  }
  return novas;
}
