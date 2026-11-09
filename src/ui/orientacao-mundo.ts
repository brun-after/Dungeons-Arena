import type { DestinoNoMapa } from '../mundo/orientacao';
import { direcaoGeografica, proximaEtapa, rumoNaTela } from '../mundo/orientacao';
import type { Reino } from '../mundo/reino';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import { t } from '../i18n';
import { icone } from './icones';

/** Um destino ativo por sessão de jogo; sobrevive à troca de sala e ao fechamento do mapa. */
export interface OrientacaoMundo {
  destino: DestinoNoMapa | null;
  definir: (destino: DestinoNoMapa | null) => void;
  /** 09/11/2026 (D-143): onde o jogador morreu (o túmulo), marcado no mapa até `ateMs` (relógio do navegador). */
  lapide: LapideNoMapa | null;
}

export interface LapideNoMapa {
  lugar: string;
  ponto: { x: number; y: number };
  ateMs: number;
}

export function criarOrientacaoMundo(): OrientacaoMundo {
  const guia: OrientacaoMundo = { destino: null, lapide: null, definir: destino => { guia.destino = destino; } };
  return guia;
}

/** A lápide ainda marcada agora (null depois do prazo). */
export function lapideAtiva(guia: OrientacaoMundo | undefined, agoraMs: number): LapideNoMapa | null {
  return guia?.lapide && guia.lapide.ateMs > agoraMs ? guia.lapide : null;
}

/** 09/11/2026 (D-143): morreu no Mundo: a lápide fica marcada por `minutos` e vira o destino da rota. */
export function marcarLapide(guia: OrientacaoMundo, lugar: string, ponto: { x: number; y: number }, minutos: number, agoraMs: number): void {
  guia.lapide = { lugar, ponto: { ...ponto }, ateMs: agoraMs + minutos * 60_000 };
  guia.definir({ lugar, nome: t('mundo.lapide.nome'), ponto: { ...ponto } });
}

export function criarGuiaMundo(guia: OrientacaoMundo, reino: Reino, lugar: string, ctx: ContextoSimulacao, idLocal: string, descobertas: () => readonly string[]) {
  const el = document.createElement('aside');
  el.className = 'guia-mundo';
  el.setAttribute('aria-label', t('mundo.guia.titulo'));
  const seta = document.createElement('span'); seta.className = 'guia-seta'; seta.append(icone('seta_direita')); seta.setAttribute('aria-hidden', 'true');
  const texto = document.createElement('span');
  const cancelar = document.createElement('button'); cancelar.type = 'button'; cancelar.textContent = '×';
  cancelar.setAttribute('aria-label', t('mundo.guia.cancelar'));
  cancelar.addEventListener('click', () => { guia.definir(null); el.hidden = true; });
  el.append(seta, texto, cancelar);
  el.hidden = true;
  let ultimo = -Infinity;
  return {
    elemento: el,
    atualizar: (estado: EstadoJogo | null, agora: number) => {
      if (agora - ultimo < 150) return;
      ultimo = agora;
      const eu = estado?.entidades.find(e => e.id === idLocal);
      const destino = guia.destino;
      el.hidden = !destino || !eu;
      if (!destino || !eu) return;
      const etapa = proximaEtapa(reino, lugar, destino, ctx.fase);
      const distancia = etapa?.ponto ? Math.hypot(etapa.ponto.x - eu.x, etapa.ponto.y - eu.y) : null;
      const chegou = etapa?.tipo === 'chegou' || (etapa?.tipo === 'destino' && distancia !== null && distancia <= 2);
      seta.hidden = !etapa?.ponto || chegou;
      if (etapa?.ponto) seta.style.transform = `rotate(${rumoNaTela(eu, etapa.ponto)}rad)`;
      const rumo = etapa?.ponto ? t('mundo.guia.rumo', { direcao: direcaoGeografica(eu, etapa.ponto), n: Math.ceil(distancia ?? 0) }) : '';
      const nomeEtapa = etapa?.lugar && !descobertas().includes(etapa.lugar) ? t('mundo.mapa.desconhecida') : etapa?.nome ?? '';
      const acao = chegou ? t('mundo.guia.chegou') : etapa?.tipo === 'passagem' ? t('mundo.guia.passagem', { nome: nomeEtapa }) : etapa?.tipo === 'sair' ? t('mundo.guia.sair') : etapa?.tipo === 'portal' ? t('mundo.guia.portal', { nome: etapa.nome }) : etapa ? rumo : t('mundo.guia.semRota');
      texto.textContent = `${destino.nome} · ${acao}${etapa?.tipo === 'passagem' || etapa?.tipo === 'sair' ? ` · ${rumo}` : ''}`;
      el.dataset.chegou = String(chegou);
    },
  };
}
