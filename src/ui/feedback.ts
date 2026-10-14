// Feedback de combate a partir dos eventos da simulação: números de dano, registro, último d20 e
// vibração. Só reage a eventos já publicados; nunca muda o estado (§3.3).
// Marco 6: coleta, uso e equipamento de itens, recusas da mochila e subida de nível.

import type { Catalogo } from '../combat/habilidades';
import type { EstadoJogo } from '../core/estado';
import type { Barramento } from '../core/events';
import type { EventosDaSimulacao } from '../core/eventos-simulacao';
import { t, type ChaveTexto } from '../i18n';
import { vibrar } from '../plataforma/dispositivo';
import type { Item } from '../progression/itens';
import { ESCALONAMENTO_MS, type CamadaNumeros } from '../render/numeros';
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
}

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
      if (ev.fonteId === idLocal) hud.mostrarD20(ev.d20);
      if (ev.alvoId === idLocal && ev.dano > 0) vibrar(30);
      if (envolveLocal) {
        const chave: ChaveTexto = ev.falha ? 'log.falha' : ev.critico ? 'log.critico' : 'log.acertou';
        hud.registrar(t(chave, { fonte: nome(ev.fonteId), alvo: nome(ev.alvoId), dano: ev.dano }));
      }
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
  bus.on('efeitoAplicado', (ev) => {
    if (ev.tipo === 'atordoar') hud.registrar(t('log.atordoado', { alvo: nome(ev.alvoId) }));
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
    if (ev.tipo === 'item') {
      if (ev.id !== idLocal) return;
      const texto = t('log.pegouItem', { item: nomeItem(ev.itemId) });
      hud.registrar(texto);
      o.aviso(texto);
      return;
    }
    const quem = posicao(ev.id);
    if (quem) numeros.mostrar(`+${ev.ganho}`, ev.tipo === 'orbe_hp' ? 'cura' : 'recurso', quem.x, quem.y, o.agora());
    if (ev.id === idLocal) hud.registrar(t(ev.tipo === 'orbe_hp' ? 'log.orbeHp' : 'log.orbeRecurso', { ganho: ev.ganho }));
  });
  bus.on('equipou', (ev) => {
    if (ev.id === idLocal) hud.registrar(t('log.equipou', { item: nomeItem(ev.itemId) }));
  });
  bus.on('usouItem', (ev) => {
    const quem = posicao(ev.id);
    if (quem && ev.hp > 0) numeros.mostrar(`+${ev.hp}`, 'cura', quem.x, quem.y, o.agora());
    if (quem && ev.mana > 0) numeros.mostrar(`+${ev.mana}`, 'recurso', quem.x, quem.y, o.agora(), ESCALONAMENTO_MS);
    if (ev.id === idLocal) hud.registrar(t('log.usou', { item: nomeItem(ev.itemId) }));
  });
  bus.on('itemRecusado', (ev) => {
    if (ev.id !== idLocal) return;
    vibrar([50, 30, 50]);
    const texto = t(`item.${ev.motivo}` as const);
    hud.registrar(texto);
    o.aviso(texto);
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
