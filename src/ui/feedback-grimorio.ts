// Avisos do grimório (marco 18, 17/10/2026, D-068 a D-070): combos, regras de buff, ressonâncias, renascer, missões,
// origens raras, forja e descobertas. A primeira vez de cada entrada do diário vai, com conta logada, para a tabela
// pública de descobertas — e o aviso diz se a pessoa foi a primeira do servidor ou quem chegou antes.

import type { ContextoSimulacao } from '../core/contexto';
import type { Barramento } from '../core/events';
import type { EventosDaSimulacao } from '../core/eventos-simulacao';
import { t } from '../i18n';
import type { Nuvem } from '../plataforma/nuvem';
import type { CamadaNumeros } from '../render/numeros';
import { descreverEntrada } from './diario-detalhes';
import type { Hud } from './hud';

export interface OpcoesFeedbackGrimorio {
  bus: Barramento<EventosDaSimulacao>;
  ctx: ContextoSimulacao;
  idLocal: string;
  hud: Hud;
  numeros: CamadaNumeros;
  agora: () => number;
  posicao: (id: string) => { x: number; y: number } | null;
  aviso: (texto: string) => void;
  /** A nuvem do build (null: sem conta, sem registro da primeira descoberta). */
  nuvem: Nuvem | null;
}

export function ligarFeedbackGrimorio(o: OpcoesFeedbackGrimorio): void {
  const { bus, ctx, idLocal, hud } = o;
  const nomeItem = (id: string) => ctx.conteudo.itens.get(id)?.nome ?? id;
  const nomeHabilidade = (id: string) => ctx.conteudo.definicoes.get(id)?.base.nome ?? id;
  const flutuar = (id: string, texto: string) => {
    const p = o.posicao(id);
    if (p) o.numeros.mostrar(texto, 'critico', p.x, p.y, o.agora());
  };
  bus.on('comboFeito', (ev) => {
    const combo = ctx.conteudo.combos.get(ev.combo);
    if (!combo) return;
    flutuar(ev.alvoId ?? ev.id, t('numero.combo', { nome: combo.nome }));
    if (ev.id === idLocal) hud.registrar(t('log.combo', { nome: combo.nome }));
  });
  bus.on('buffInteragiu', (ev) => {
    const r = ctx.conteudo.regrasDeBuff.get(ev.regra);
    if (r && ev.id === idLocal) hud.registrar(t('log.buffInteragiu', { nome: r.nome }));
  });
  bus.on('ressonanciaAtiva', (ev) => {
    const r = ctx.conteudo.ressonancias.get(ev.ressonancia);
    if (!r || ev.id !== idLocal) return;
    hud.registrar(t('log.ressonancia', { nome: r.nome, texto: r.texto }));
    o.aviso(t('log.ressonancia', { nome: r.nome, texto: r.texto }));
  });
  // Marco 22 (23/10/2026, D-089): a encarnação do Mago e o tiro carregado do Arqueiro.
  bus.on('encarnou', (ev) => {
    // Marco 24 (24/10/2026, D-095): a encarnação dupla tem aviso próprio, com o nome da fusão.
    const dupla = ev.dupla ? ctx.conteudo.sintonia.encarnacoesDuplas.find((d) => d.id === ev.dupla) : undefined;
    flutuar(ev.id, dupla ? dupla.nome : t(`hud.encarnacao.${ev.elemento}`));
    if (ev.id !== idLocal) return;
    if (dupla) {
      hud.registrar(t('feedback.encarnacaoDupla', { nome: dupla.nome }));
      o.aviso(t('feedback.encarnacaoDupla', { nome: dupla.nome }));
    } else hud.registrar(t(`hud.encarnacaoDica.${ev.elemento}`));
  });
  // Marco 24 (24/10/2026, D-094 a D-096): a ultimate, as passivas gerais e as sinergias passivas.
  bus.on('ultimateCheia', (ev) => {
    if (ev.id !== idLocal) return;
    hud.registrar(t('feedback.ultimateCheia'));
    o.aviso(t('feedback.ultimateCheia'));
  });
  bus.on('ultimateUsada', (ev) => {
    flutuar(ev.id, t('numero.ultimate', { nome: nomeHabilidade(ev.ultimateId) }));
  });
  bus.on('passivaDefinida', (ev) => {
    if (ev.id !== idLocal) return;
    const nome = nomeHabilidade(ev.habilidadeId);
    hud.registrar(t(ev.ligada ? 'feedback.passivaLigada' : 'feedback.passivaDesligada', { nome }));
  });
  bus.on('sinergiaPassiva', (ev) => {
    const s = ctx.conteudo.sinergias.find((x) => x.id === ev.sinergia);
    if (!s) return;
    flutuar(ev.id, t('feedback.sinergiaPassiva', { nome: s.nome }));
    if (ev.id === idLocal) hud.registrar(t('feedback.sinergiaPassiva', { nome: s.nome }));
  });
  bus.on('invocacaoRetornou', (ev) => {
    if (ev.donoId === idLocal) hud.registrar(t('log.invocacaoRetornou'));
  });
  bus.on('tiroCarregado', (ev) => {
    if (ev.id === idLocal) flutuar(ev.id, t('numero.tiroCarregado'));
  });
  bus.on('renasceu', (ev) => {
    flutuar(ev.id, t('numero.renasceu'));
    if (ev.id === idLocal) {
      hud.registrar(t('log.renasceu'));
      o.aviso(t('log.renasceu'));
    }
  });
  bus.on('missaoConcluida', (ev) => {
    const m = ctx.conteudo.missoes.get(ev.missao);
    if (!m || ev.id !== idLocal) return;
    const texto = t('log.missao', { nome: m.nome, item: nomeItem(ev.itemId) });
    hud.registrar(texto);
    o.aviso(texto);
  });
  bus.on('origemRara', (ev) => {
    if (ev.id !== idLocal) return;
    const texto = t('log.origemRara', { item: nomeItem(ev.itemId) });
    hud.registrar(texto);
    o.aviso(texto);
  });
  bus.on('forjou', (ev) => {
    if (ev.id === idLocal) hud.registrar(t('log.forjou', { item: nomeItem(ev.itemId) }));
  });
  bus.on('descoberta', (ev) => {
    if (ev.id !== idLocal) return;
    const d = descreverEntrada(ctx, ev.entrada);
    hud.registrar(t('log.descoberta', { nome: d.nome }));
    const nuvem = o.nuvem;
    if (!nuvem) return;
    // Só quando a entrada é nova no diário (raro): uma escrita e uma leitura de uma linha. Falha de rede: nada.
    void nuvem
      .registrarDescoberta(ev.entrada)
      .then((r) => {
        if (!r) return;
        const data = new Date(r.em).toLocaleDateString('pt-BR');
        const texto = r.minha ? t('log.primeiroDoServidor', { nome: d.nome }) : t('log.descobertoAntes', { nome: d.nome, quem: r.nome, data });
        hud.registrar(texto);
        if (r.minha) o.aviso(texto);
      })
      .catch(() => undefined);
  });
}
