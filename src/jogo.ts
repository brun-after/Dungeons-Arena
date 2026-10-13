// Sessão de campanha no navegador: simulação local (offline) + a cena compartilhada.
// A simulação só recebe comandos pela fila; a apresentação só lê o estado e os eventos.

import type { Habilidade } from './combat/habilidades';
import type { Comando } from './core/comandos';
import { criarFila, enfileirar, retirarAte } from './core/comandos';
import { conteudoOficial } from './core/conteudo';
import { BALANCE_PADRAO, type ContextoSimulacao } from './core/contexto';
import { criarEstado } from './core/estado';
import type { EventoSimulacao } from './core/eventos-simulacao';
import { hashTexto } from './core/rng';
import { simular } from './core/simulacao';
import fase01 from './data/fases/fase-01.json';
import { criarJogador } from './entities/fabrica';
import { iniciarLaco } from './plataforma/laco-navegador';
import { Interpolador } from './render/interpolacao';
import { montarCena } from './ui/cena';
import { carregarFase } from './world/fase';
import { povoarFase } from './world/populacao';
import { validarFase } from './world/validacao-fase';

const ID_JOGADOR = 'j1';

function montarContexto(): ContextoSimulacao {
  const conteudo = conteudoOficial();
  const validacao = validarFase(fase01, new Set(conteudo.presets.keys()));
  if (!validacao.ok) throw new Error(`fase oficial inválida: ${validacao.erros.map((e) => e.mensagem).join('; ')}`);
  return { fase: carregarFase(validacao.fase), balance: BALANCE_PADRAO, conteudo, modo: conteudo.modoCampanha };
}

export async function iniciarJogo(raiz: HTMLElement): Promise<void> {
  const ctx = montarContexto();
  const { fase, conteudo } = ctx;
  const estado = criarEstado({ semente: hashTexto(fase.id), faseId: fase.id });
  const spawn = fase.spawns[0] ?? { x: 1, y: 1 };
  const classe = conteudo.classes.get('aventureiro');
  if (!classe) throw new Error('classe inicial ausente');
  estado.entidades.push(criarJogador(classe, ID_JOGADOR, spawn.x, spawn.y, ctx.balance));
  povoarFase(estado, ctx);
  const habilidades = classe.habilidades.map((id) => conteudo.habilidades.get(id)).filter((h): h is Habilidade => h !== undefined);

  const fila = criarFila();
  const cena = await montarCena({
    raiz,
    ctx,
    idLocal: ID_JOGADOR,
    habilidades,
    estado: () => estado,
    emitir: (cmd: Comando) => enfileirar(fila, { tick: estado.tick, entidadeId: ID_JOGADOR, cmd }),
  });
  if (!cena) return;

  const interp = new Interpolador();
  const eventos: EventoSimulacao[] = [];
  iniciarLaco({
    simular: (dtMs) => {
      interp.registrarAntesDoTick(estado);
      eventos.length = 0;
      simular(estado, ctx, retirarAte(fila, estado.tick), eventos, dtMs);
      for (const ev of eventos) cena.bus.emitir(ev.t, ev);
    },
    renderizar: (alpha) => {
      cena.quadro({
        alpha,
        agoraMs: performance.now(),
        posicao: (e) => interp.posicao(e, alpha),
        aoRemover: (id) => {
          interp.esquecer(id);
        },
      });
    },
  });
}
