// Sessão de teste com pessoas (§5.7). Marco 7A (13/10/2026): mede a partida pelos eventos já
// publicados e, em "Terminar teste", abre o questionário e envia o relatório anônimo (D-044).

import { versaoDoConteudo } from '../arena/protocolo';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { Barramento } from '../core/events';
import type { EventoSimulacao, EventosDaSimulacao } from '../core/eventos-simulacao';
import { t } from '../i18n';
import { comPontosDistribuidos, criarColetor, type ClasseDeAlvo } from '../pesquisa/coletor';
import { VERSAO_RELATORIO, type RelatorioPesquisa } from '../pesquisa/relatorio';
import { enderecoDoServidor, enderecoHttp } from '../plataforma/servidor';
import { abrirQuestionario } from './questionario';
import { pontosAteONivel } from '../progression/nivel';

/** Eventos que o coletor usa. */
const EVENTOS = ['acaoIniciada', 'impacto', 'iaNotou', 'morreu', 'coletou', 'equipou', 'subiuNivel'] as const;

export interface Pesquisa {
  botao: HTMLButtonElement;
  ligar: (bus: Barramento<EventosDaSimulacao>) => void;
}

export function criarPesquisa(o: { ctx: ContextoSimulacao; estado: () => EstadoJogo; idJogador: string }): Pesquisa {
  const agoraS = () => performance.now() / 1000;
  // Classe de cada entidade pelo id, guardada antes de ela sair do mundo (ids são estáveis no respawn).
  const classes = new Map<string, ClasseDeAlvo>();
  const classificar = (id: string): ClasseDeAlvo => {
    const e = o.estado().entidades.find((x) => x.id === id);
    if (e) classes.set(id, e.arquetipo === 'boss' ? 'boss' : e.arquetipo === 'boneco' ? 'boneco' : 'comum');
    return classes.get(id) ?? 'comum';
  };
  for (const e of o.estado().entidades) classificar(e.id);
  const coletor = criarColetor(o.idJogador, agoraS(), classificar);

  const enviar = async (relatorio: RelatorioPesquisa): Promise<boolean> => {
    const servidor = enderecoDoServidor();
    if (!servidor) return false;
    try {
      // text/plain: requisição simples, sem preflight de CORS.
      const r = await fetch(`${enderecoHttp(servidor)}/relatorios`, {
        method: 'POST',
        headers: { 'content-type': 'text/plain' },
        body: JSON.stringify(relatorio),
      });
      return r.status === 201;
    } catch {
      return false;
    }
  };

  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'botao-cabecalho botao-pesquisa';
  botao.textContent = t('pesquisa.terminar');
  botao.addEventListener('click', () => {
    const j = o.estado().entidades.find((e) => e.id === o.idJogador);
    const nivel = j?.nivel ?? 1;
    const distribuiu = !!j?.bolsa && j.bolsa.pontosAtributo < pontosAteONivel(nivel, o.ctx.balance.xp);
    const medidas = comPontosDistribuidos(coletor.medidas(agoraS(), nivel), distribuiu);
    abrirQuestionario({
      aoEnviar: (respostas) =>
        enviar({
          versao: VERSAO_RELATORIO,
          conteudo: versaoDoConteudo(),
          plataforma: {
            toque: document.body.classList.contains('toque'),
            largura: Math.round(innerWidth),
            altura: Math.round(innerHeight),
            dpr: Math.round(devicePixelRatio * 100) / 100,
          },
          medidas,
          respostas,
        }),
      aoConcluir: () => {
        location.href = './';
      },
    });
  });

  return {
    botao,
    ligar: (bus) => {
      const registrar = (ev: EventoSimulacao) => {
        coletor.registrar(ev, agoraS());
      };
      for (const nome of EVENTOS) bus.on(nome, registrar);
    },
  };
}
