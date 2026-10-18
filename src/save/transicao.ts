import { novaMemoria } from '../combat/estado-tatico';
// Troca de fase da campanha (§2.1 "Transições", §3.5). Marco 10A-1 (14/10/2026), D-052.
// Pura: recebe o registro atual e devolve o da fase nova. A fase que fica para trás é guardada sem
// o jogador (e sem as invocações dele) em `fasesVisitadas`; a de destino volta de lá, se já foi
// visitada, ou nasce de `novoEstado`. O personagem leva ficha, mochila e ouro, com vida e mana cheias.

import type { Celula } from '../core/comandos';
import { clonarEntidade, clonarEstado, type Entidade, type EstadoJogo } from '../core/estado';
import { chaveDaFase, jogadorDoSave, type RefFase, type RegistroProgresso } from './esquema';

/** Leva um personagem para o início de outra fase: mesma ficha e mochila, vida e mana cheias. */
export function personagemNoInicio(e: Entidade, c: Celula, id = e.id): Entidade {
  const p = clonarEntidade(e);
  Object.assign(p, {
    id,
    x: c.x,
    y: c.y,
    destinoX: c.x,
    destinoY: c.y,
    origemX: c.x,
    origemY: c.y,
    progressoPasso: 0,
    direcao: 'parado',
    waypoints: [],
    caminho: [],
    hp: p.hpMax,
    mana: p.manaMax,
    morto: false,
    reviverEmTick: 0,
    invisivelAteTick: 0,
    efeitos: [],
    acao: null,
    alvoSelecionado: null,
    alvoTravado: false,
    participacao: [],
    interacao: null,
  });
  delete p.encontro;
  delete p.concentracaoArcana;
  delete p.auraFracoes;
  delete p.auraCuraFracao;
  if (p.tatica) p.tatica = novaMemoria();
  p.ultimaHabilidade = null;
  return p;
}

export interface DestinoDaTransicao {
  ref: RefFase;
  nome: string;
  spawn: Celula;
  /** Estado inicial da fase (inimigos e objetos), sem jogador; só é chamado se ela não foi visitada. */
  novoEstado: () => EstadoJogo;
  preservarRecursos?: boolean;
}

export function avancarFase(r: RegistroProgresso, destino: DestinoDaTransicao, agora: number): RegistroProgresso {
  const jogador = jogadorDoSave(r.estado);
  if (!jogador) throw new Error('save sem jogador');
  const deixada = clonarEstado(r.estado);
  deixada.entidades = deixada.entidades.filter((e) => e.id !== jogador.id && e.invocacao?.donoId !== jogador.id);
  deixada.projeteis = [];
  if (deixada.camposTaticos) deixada.camposTaticos = deixada.camposTaticos.filter((c) => c.donoId !== jogador.id);
  const chaveDestino = chaveDaFase(destino.ref);
  const guardada = r.fasesVisitadas[chaveDestino];
  const visitadas: Record<string, EstadoJogo> = Object.fromEntries(Object.entries(r.fasesVisitadas).filter(([k]) => k !== chaveDestino));
  visitadas[chaveDaFase(r.faseRef)] = deixada;
  const estado = guardada ? clonarEstado(guardada) : destino.novoEstado();
  // Marco 15: a dificuldade escolhida vale na fase nova (e na revisitada).
  estado.dificuldade = r.estado.dificuldade;
  const personagem = personagemNoInicio(jogador, destino.spawn);
  // 17/10/2026: só a primeira passagem mantém a recuperação antiga; ir e voltar não cura.
  if (guardada || destino.preservarRecursos) {
    personagem.hp = Math.min(personagem.hpMax, jogador.hp);
    personagem.mana = Math.min(personagem.manaMax, jogador.mana);
  }
  estado.entidades.push(personagem);
  return { ...r, faseRef: destino.ref, nomeFase: destino.nome, estado, fasesVisitadas: visitadas, referenciasFases: { ...r.referenciasFases, [chaveDaFase(r.faseRef)]: r.faseRef, [chaveDestino]: destino.ref }, atualizadoEm: agora };
}
