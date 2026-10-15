// Feedback de combate a partir dos eventos da simulação: números de dano, registro, último d20 e
// vibração. Só reage a eventos já publicados; nunca muda o estado (§3.3).
// Marco 6: coleta, uso e equipamento de itens, recusas da mochila e subida de nível.
// Marco 9A (14/10/2026): ouro, baú e loja.
// Marco 14 (14/10/2026): sinergias de elemento (texto no alvo e no registro), aviso ao ganhar um efeito (o que
// faz, no máximo um por tipo por segundo), habilidade aprendida ou com rank novo e recusas da aba Habilidades.

import type { Catalogo } from '../combat/habilidades';
import type { EstadoJogo } from '../core/estado';
import type { Barramento } from '../core/events';
import type { EventosDaSimulacao } from '../core/eventos-simulacao';
import { REGISTRO_EFEITOS } from '../combat/registro-efeitos';
import { DT_MS } from '../core/loop';
import { t, type ChaveTexto } from '../i18n';
import { descreverEfeito, nomeDoEfeito } from './descrever';
import { vibrar } from '../plataforma/dispositivo';
import type { Item } from '../progression/itens';
import { ESCALONAMENTO_MS, type CamadaNumeros } from '../render/numeros';
import { faixaDoDado, type DadoD20 } from './dado';
import type { Hud } from './hud';

export interface OpcoesFeedback {
  bus: Barramento<EventosDaSimulacao>;
  /** Função, porque na arena o estado é trocado a cada reconciliação. */
  estado: () => EstadoJogo;
  idLocal: string;
  numeros: CamadaNumeros;
  hud: Hud;
  agora: () => number;
  itens: Catalogo<Item>;
  /** Aviso curto e não bloqueante (toast). */
  aviso: (texto: string) => void;
  /** Marco 14: o nome de uma habilidade pelo id (catálogo ou gerada). */
  nomeDaHabilidade?: (id: string) => string;
  /** Ajuste de 15/10/2026: o d20 perto da barra. */
  dado?: DadoD20;
}

/** Intervalo mínimo entre dois avisos do mesmo efeito (marco 14). */
const AVISO_EFEITO_MS = 1000;

export function ligarFeedback(o: OpcoesFeedback): { impactos: () => number } {
  const { bus, estado, idLocal, numeros, hud } = o;
  // Nomes guardados ao ver a entidade, para o registro não perder quem já saiu do mundo.
  const nomes = new Map<string, string>();
  const nome = (id: string | null) => {
    if (!id) return '?';
    const e = estado().entidades.find((x) => x.id === id);
    if (e) nomes.set(id, e.id === idLocal ? 'Você' : e.nome);
    return nomes.get(id) ?? id;
  };
  const posicao = (id: string) => estado().entidades.find((x) => x.id === id) ?? null;
  let impactos = 0;

  bus.on('impacto', (ev) => {
    impactos++;
    const alvo = posicao(ev.alvoId);
    const envolveLocal = ev.fonteId === idLocal || ev.alvoId === idLocal;
    const atraso = ev.indice * ESCALONAMENTO_MS;
    if (ev.cura > 0) {
      if (alvo) numeros.mostrar(`+${ev.cura}`, 'cura', alvo.x, alvo.y, o.agora(), atraso);
      if (envolveLocal) hud.registrar(t('log.curou', { alvo: nome(ev.alvoId), cura: ev.cura }));
    }
    if (ev.d20 > 0) {
      const tipo = ev.falha ? 'falha' : ev.critico ? 'critico' : 'dano';
      const texto = ev.critico ? `${ev.dano}!` : String(ev.dano);
      if (alvo) numeros.mostrar(texto, tipo, alvo.x, alvo.y, o.agora(), atraso);
      // Ajuste de 15/10/2026 (D-060): o d20 perto da barra a cada rolagem sua; nos extremos que envolvem você, o
      // d20 também aparece sobre o alvo.
      if (ev.fonteId === idLocal) o.dado?.mostrar(ev.d20, o.agora());
      const faixa = faixaDoDado(ev.d20);
      const extremo = ev.d20 >= 16 ? 'bom' : faixa === 'falha' ? 'falha' : null;
      if (extremo && envolveLocal && alvo) numeros.mostrarDado(ev.d20, extremo, alvo.x, alvo.y, o.agora());
      if (ev.alvoId === idLocal && ev.dano > 0) vibrar(30);
      if (envolveLocal) {
        const chave: ChaveTexto = ev.falha ? 'log.falha' : ev.critico ? 'log.critico' : 'log.acertou';
        hud.registrar(t(chave, { fonte: nome(ev.fonteId), alvo: nome(ev.alvoId), dano: ev.dano }));
      }
    }
  });
  // Marco 14: sinergia de elemento disparada — o nome sobe do alvo e entra no registro.
  bus.on('impacto', (ev) => {
    if (ev.sinergias.length === 0) return;
    const alvo = posicao(ev.alvoId);
    for (const s of ev.sinergias) {
      const texto = t(`sinergia.${s}` as ChaveTexto);
      if (alvo) numeros.mostrar(texto, 'critico', alvo.x, alvo.y, o.agora(), ESCALONAMENTO_MS);
      if (ev.fonteId === idLocal || ev.alvoId === idLocal) hud.registrar(t('log.sinergia', { nome: texto, alvo: nome(ev.alvoId) }));
    }
  });
  bus.on('esquivou', (ev) => {
    const alvo = posicao(ev.alvoId);
    if (alvo) numeros.mostrar(t('numero.esquiva'), 'esquiva', alvo.x, alvo.y, o.agora());
    if (ev.atorId === idLocal || ev.alvoId === idLocal) {
      hud.registrar(t('log.esquivou', { alvo: nome(ev.alvoId), fonte: nome(ev.atorId) }));
    }
  });
  bus.on('acaoRecusada', (ev) => {
    if (ev.atorId !== idLocal) return;
    vibrar([50, 30, 50]);
    hud.registrar(t(`recusa.${ev.motivo}` as const));
  });
  bus.on('acaoCancelada', (ev) => {
    if (ev.motivo === 'interrompido') hud.registrar(t('log.interrompido', { ator: nome(ev.atorId) }));
  });
  // Marco 8A: todo status aplicado em você ou por você entra no registro; números vêm do resultado.
  const ultimoAviso = new Map<string, number>();
  bus.on('efeitoAplicado', (ev) => {
    const d = REGISTRO_EFEITOS[ev.tipo];
    if (!d.ehStatus || (ev.alvoId !== idLocal && ev.origemId !== idLocal)) return;
    hud.registrar(t('log.efeito', { alvo: nome(ev.alvoId), efeito: t(`efeito.${ev.tipo}` as ChaveTexto) }));
    // Marco 14: em você, o aviso diz o que o efeito faz (com os números e o tempo que falta).
    if (ev.alvoId !== idLocal) return;
    const agora = o.agora();
    if (agora - (ultimoAviso.get(ev.tipo) ?? -Infinity) < AVISO_EFEITO_MS) return;
    ultimoAviso.set(ev.tipo, agora);
    const f = estado().entidades.find((x) => x.id === idLocal)?.efeitos.find((x) => x.tipo === ev.tipo);
    if (!f) return;
    o.aviso(t('aviso.efeitoGanho', { nome: nomeDoEfeito(ev.tipo), desc: descreverEfeito({ ...f, duracaoMs: (f.ateTick - ev.tick) * DT_MS }) }));
  });
  // Marco 15: a dificuldade mudou.
  bus.on('dificuldadeMudou', (ev) => {
    const texto = t('log.dificuldade', { nome: t(`dificuldade.${ev.nivel}` as ChaveTexto) });
    hud.registrar(texto);
    o.aviso(texto);
  });
  // Marco 14: habilidades aprendidas e ranks novos.
  bus.on('habilidadeMudou', (ev) => {
    if (ev.id !== idLocal) return;
    const nomeHab = o.nomeDaHabilidade?.(ev.habilidadeId) ?? ev.habilidadeId;
    const texto = ev.rank === 1 ? t('log.habilidadeAprendida', { nome: nomeHab }) : t('log.habilidadeMudou', { nome: nomeHab, rank: ev.rank });
    hud.registrar(texto);
    o.aviso(texto);
  });
  bus.on('habilidadeRecusada', (ev) => {
    if (ev.id !== idLocal) return;
    hud.registrar(t(`habilidades.motivo.${ev.motivo}` as ChaveTexto, { nivel: '?' }));
  });
  // Marco 8A-2: invocação, dominação e armadilha.
  bus.on('invocou', (ev) => {
    hud.registrar(t('log.invocou', { dono: nome(ev.donoId), alvo: nome(ev.id) }));
  });
  bus.on('dominou', (ev) => {
    hud.registrar(t('log.dominou', { alvo: nome(ev.id), dono: nome(ev.donoId) }));
  });
  bus.on('armadilhaDisparou', (ev) => {
    if (ev.alvoId === idLocal || ev.donoId === idLocal) hud.registrar(t('log.armadilha', { alvo: nome(ev.alvoId) }));
  });
  bus.on('efeitoResultado', (ev) => {
    const alvo = posicao(ev.alvoId);
    if (!alvo) return;
    if (ev.dano > 0) numeros.mostrar(String(ev.dano), 'dano', alvo.x, alvo.y, o.agora());
    if (ev.cura > 0) numeros.mostrar(`+${ev.cura}`, 'cura', alvo.x, alvo.y, o.agora());
    if (ev.mana > 0) numeros.mostrar(`+${ev.mana}`, 'recurso', alvo.x, alvo.y, o.agora(), ESCALONAMENTO_MS);
  });
  bus.on('morreu', (ev) => {
    hud.registrar(t('log.morreu', { alvo: nome(ev.id) }));
    if (ev.id === idLocal) vibrar([100, 50, 100, 50, 100]);
  });
  bus.on('xpGanho', (ev) => {
    if (ev.id === idLocal) hud.registrar(t('log.xp', { xp: ev.xp }));
  });
  bus.on('surgiu', (ev) => {
    hud.registrar(t('log.surgiu', { alvo: nome(ev.id) }));
  });
  const nomeItem = (id: string | null) => (id ? (o.itens.get(id)?.nome ?? id) : '?');
  bus.on('coletou', (ev) => {
    if (ev.tipo === 'orbe_efeito') {
      if (ev.id === idLocal) hud.registrar(t('log.orbeEfeito'));
      return;
    }
    if (ev.tipo === 'item') {
      if (ev.id !== idLocal) return;
      const texto = t('log.pegouItem', { item: ev.ganho > 1 ? `${nomeItem(ev.itemId)} ×${ev.ganho}` : nomeItem(ev.itemId) });
      hud.registrar(texto);
      o.aviso(texto);
      return;
    }
    if (ev.tipo === 'ouro') {
      const quem = posicao(ev.id);
      if (quem) numeros.mostrar(`+${ev.ganho}`, 'ouro', quem.x, quem.y, o.agora());
      if (ev.id === idLocal) hud.registrar(t('log.ouro', { ouro: ev.ganho }));
      return;
    }
    const quem = posicao(ev.id);
    if (quem) numeros.mostrar(`+${ev.ganho}`, ev.tipo === 'orbe_hp' ? 'cura' : 'recurso', quem.x, quem.y, o.agora());
    if (ev.id === idLocal) hud.registrar(t(ev.tipo === 'orbe_hp' ? 'log.orbeHp' : 'log.orbeRecurso', { ganho: ev.ganho }));
  });
  bus.on('equipou', (ev) => {
    if (ev.id === idLocal) hud.registrar(t('log.equipou', { item: nomeItem(ev.itemId) }));
  });
  // Os números da poção vêm do `efeitoResultado` (mesmo dispatcher, marco 8A).
  bus.on('usouItem', (ev) => {
    if (ev.id === idLocal) hud.registrar(t('log.usou', { item: nomeItem(ev.itemId) }));
  });
  bus.on('itemRecusado', (ev) => {
    if (ev.id !== idLocal) return;
    vibrar([50, 30, 50]);
    const texto = t(`item.${ev.motivo}` as const);
    hud.registrar(texto);
    o.aviso(texto);
  });
  bus.on('interacaoIniciada', (ev) => {
    if (ev.id === idLocal && ev.tipo === 'bau') hud.registrar(t('log.bauAbrindo'));
  });
  bus.on('bauAberto', (ev) => {
    if (ev.id !== idLocal) return;
    const partes = ev.itens.map(nomeItem);
    if (ev.ouro > 0) partes.push(t('log.ouro', { ouro: ev.ouro }));
    const texto = partes.length > 0 ? t('log.bauAberto', { itens: partes.join(', ') }) : t('log.bauVazio');
    hud.registrar(texto);
    o.aviso(texto);
  });
  bus.on('comprou', (ev) => {
    if (ev.id === idLocal) hud.registrar(t('log.comprou', { item: nomeItem(ev.itemId), preco: ev.preco }));
  });
  bus.on('vendeu', (ev) => {
    if (ev.id === idLocal) hud.registrar(t('log.vendeu', { item: nomeItem(ev.itemId), preco: ev.preco }));
  });
  bus.on('lojaFechada', (ev) => {
    if (ev.id === idLocal) hud.registrar(t('log.lojaFechada'));
  });
  // Marco 10A-3: invocações.
  bus.on('invocacaoCurou', (ev) => {
    if (ev.donoId !== idLocal || ev.cura <= 0) return;
    hud.registrar(t('log.invocacaoCurou', { alvo: nome(ev.id), cura: ev.cura }));
  });
  bus.on('explodiu', (ev) => {
    hud.registrar(t('log.explodiu', { alvo: nome(ev.id) }));
  });
  bus.on('dispensou', (ev) => {
    if (ev.id === idLocal) hud.registrar(t('log.dispensou', { n: ev.quantidade }));
  });
  // Marco 10A-2: descanso e penalidade de morte.
  bus.on('interacaoIniciada', (ev) => {
    if (ev.id === idLocal && ev.tipo === 'descanso') hud.registrar(t('log.descansando'));
  });
  bus.on('descansou', (ev) => {
    if (ev.id !== idLocal) return;
    const quem = posicao(ev.id);
    if (quem && ev.hp > 0) numeros.mostrar(`+${ev.hp}`, 'cura', quem.x, quem.y, o.agora());
    const texto = t('log.descansou', { hp: ev.hp, mana: ev.mana });
    hud.registrar(texto);
    o.aviso(texto);
  });
  bus.on('descansoInterrompido', (ev) => {
    if (ev.id !== idLocal) return;
    vibrar([50, 30, 50]);
    const texto = t('log.descansoInterrompido');
    hud.registrar(texto);
    o.aviso(texto);
  });
  bus.on('penalidadeMorte', (ev) => {
    if (ev.id !== idLocal) return;
    const texto = ev.niveis > 0 ? t('log.penalidadeNivel', { xp: ev.xp, niveis: ev.niveis, ouro: ev.ouro }) : t('log.penalidade', { xp: ev.xp, ouro: ev.ouro });
    hud.registrar(texto);
    o.aviso(texto);
  });
  // Marco 10A-1: portas.
  bus.on('saidaTrancada', (ev) => {
    if (ev.id !== idLocal) return;
    const texto = t(ev.motivo === 'chave' ? 'log.saidaChave' : 'log.saidaBoss');
    hud.registrar(texto);
    o.aviso(texto);
  });
  bus.on('saidaDestrancada', () => {
    const texto = t('log.saidaAberta');
    hud.registrar(texto);
    o.aviso(texto);
  });
  bus.on('teleportou', (ev) => {
    if (ev.id === idLocal) hud.registrar(t('log.teleportou', { numero: ev.numero }));
  });
  bus.on('subiuNivel', (ev) => {
    if (ev.id !== idLocal) return;
    vibrar([60, 40, 120]);
    const texto = t('aviso.nivel', { nivel: ev.nivel });
    hud.registrar(texto);
    o.aviso(texto);
  });
  bus.on('iaNotou', (ev) => {
    if (ev.alvoId === idLocal) hud.registrar(t('log.notou', { inimigo: nome(ev.id) }));
  });
  bus.on('caminhoFalhou', (ev) => {
    if (ev.id === idLocal) vibrar([50, 30, 50]);
  });

  // Registra os nomes iniciais.
  for (const e of estado().entidades) nome(e.id);
  return { impactos: () => impactos };
}
