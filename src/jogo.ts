// Sessão de campanha no navegador: simulação local (offline) + a cena compartilhada.
// A simulação só recebe comandos pela fila; a apresentação só lê o estado e os eventos.
// Marco 6B (13/10/2026): a sessão nasce de um slot de save (ou de um jogo novo nele) e grava
// sozinha (§3.5): a cada 30 s, ao subir de nível, equipar, pegar item, derrotar inimigo, ao
// suspender ou sair da página, e pelo botão "Menu".

import type { Habilidade } from './combat/habilidades';
import type { Comando } from './core/comandos';
import { criarFila, enfileirar, retirarAte } from './core/comandos';
import { conteudoOficial, type Conteudo } from './core/conteudo';
import { BALANCE_PADRAO, type ContextoSimulacao } from './core/contexto';
import { criarEstado, type EstadoJogo } from './core/estado';
import type { EventoSimulacao } from './core/eventos-simulacao';
import { hashTexto } from './core/rng';
import { simular } from './core/simulacao';
import fase01 from './data/fases/fase-01.json';
import { criarJogador } from './entities/fabrica';
import { t } from './i18n';
import { iniciarLaco } from './plataforma/laco-navegador';
import { carregarSlot, criarAutosave, type Autosave } from './plataforma/saves';
import { Interpolador } from './render/interpolacao';
import { jogadorDoSave, type Estatisticas, type RefFase } from './save/esquema';
import { mostrarAviso } from './ui/aviso';
import { montarCena } from './ui/cena';
import { carregarFase } from './world/fase';
import { povoarFase } from './world/populacao';
import { validarFase } from './world/validacao-fase';

const ID_JOGADOR = 'j1';
const AUTOSAVE_MS = 30_000;

/** Fases oficiais da campanha, por id (a referência gravada no save). */
const FASES_OFICIAIS: Readonly<Record<string, unknown>> = { 'fase-01': fase01 };
const FASE_INICIAL: RefFase = { tipo: 'oficial', id: 'fase-01' };

export interface OpcoesJogo {
  /** Slot de save (1–3); null joga sem salvar. */
  slot: number | null;
}

function montarContexto(conteudo: Conteudo, faseJson: unknown): ContextoSimulacao {
  const validacao = validarFase(faseJson, new Set(conteudo.presets.keys()));
  if (!validacao.ok) throw new Error(`fase inválida: ${validacao.erros.map((e) => e.mensagem).join('; ')}`);
  return { fase: carregarFase(validacao.fase), balance: BALANCE_PADRAO, conteudo, modo: conteudo.modoCampanha };
}

function faseDaReferencia(ref: RefFase): unknown {
  // Aventuras do editor entram no 6C.
  return ref.tipo === 'oficial' ? FASES_OFICIAIS[ref.id] : undefined;
}

function novoEstado(ctx: ContextoSimulacao): EstadoJogo {
  const { fase, conteudo } = ctx;
  const estado = criarEstado({ semente: hashTexto(fase.id), faseId: fase.id });
  const spawn = fase.spawns[0] ?? { x: 1, y: 1 };
  const classe = conteudo.classes.get('aventureiro');
  if (!classe) throw new Error('classe inicial ausente');
  estado.entidades.push(criarJogador(classe, ID_JOGADOR, spawn.x, spawn.y, ctx.balance));
  povoarFase(estado, ctx);
  return estado;
}

function mostrarErro(raiz: HTMLElement, texto: string): void {
  raiz.textContent = '';
  const tela = document.createElement('section');
  tela.className = 'tela-menu';
  const p = document.createElement('p');
  p.setAttribute('role', 'alert');
  p.textContent = texto;
  const voltar = document.createElement('a');
  voltar.className = 'botao-menu';
  voltar.href = './?jogo=campanha';
  voltar.textContent = t('slots.voltar');
  tela.append(p, voltar);
  raiz.append(tela);
}

export async function iniciarJogo(raiz: HTMLElement, opcoes: OpcoesJogo): Promise<void> {
  const conteudo = conteudoOficial();
  const { slot } = opcoes;
  const leitura = slot === null ? null : await carregarSlot(slot).catch(() => null);
  if (leitura === 'invalido') {
    // Nunca sobrescreve um save que não conseguiu ler: o jogador decide na tela de slots.
    mostrarErro(raiz, t('slots.erroLeitura'));
    return;
  }
  const faseRef = leitura?.faseRef ?? FASE_INICIAL;
  const faseJson = faseDaReferencia(faseRef);
  if (faseJson === undefined) {
    mostrarErro(raiz, t('slots.faseAusente'));
    return;
  }
  const ctx = montarContexto(conteudo, faseJson);
  const estado = leitura?.estado ?? novoEstado(ctx);
  const idJogador = jogadorDoSave(estado)?.id ?? ID_JOGADOR;
  const jogador = estado.entidades.find((e) => e.id === idJogador);
  const habilidades = (jogador?.habilidades ?? [])
    .map((id) => conteudo.habilidades.get(id))
    .filter((h): h is Habilidade => h !== undefined);
  const estatisticas: Estatisticas = { ...(leitura?.estatisticas ?? { inimigosDerrotados: 0, mortes: 0 }) };

  let autosave: Autosave | null = null;
  const acoesExtras: HTMLElement[] = [];
  if (slot !== null) {
    let avisouFalha = false;
    autosave = criarAutosave({
      slot,
      faseRef,
      nomeFase: ctx.fase.nome,
      criadoEm: leitura?.criadoEm ?? Date.now(),
      estado: () => estado,
      estatisticas: () => estatisticas,
      aoFalhar: () => {
        if (avisouFalha) return;
        avisouFalha = true;
        mostrarAviso(raiz, t('slots.falhaGravar'), 5000);
      },
    });
    const sair = document.createElement('button');
    sair.type = 'button';
    sair.className = 'botao-cabecalho';
    sair.textContent = t('slots.menu');
    sair.setAttribute('aria-label', t('slots.salvarESair'));
    const salvar = autosave;
    sair.addEventListener('click', () => {
      sair.disabled = true;
      void salvar.agora().finally(() => {
        location.href = './?jogo=campanha';
      });
    });
    acoesExtras.push(sair);
  }

  const fila = criarFila();
  const cena = await montarCena({
    raiz,
    ctx,
    idLocal: idJogador,
    habilidades,
    estado: () => estado,
    emitir: (cmd: Comando) => enfileirar(fila, { tick: estado.tick, entidadeId: idJogador, cmd }),
    acoesExtras,
  });
  if (!cena) return;

  if (autosave) {
    const a = autosave;
    // Jogo novo: o slot passa a existir já.
    if (!leitura) a.pedir();
    setInterval(a.pedir, AUTOSAVE_MS);
    for (const ev of ['subiuNivel', 'equipou', 'reviveu'] as const) cena.bus.on(ev, a.pedir);
    cena.bus.on('coletou', (ev) => {
      if (ev.tipo === 'item') a.pedir();
    });
    cena.bus.on('morreu', (ev) => {
      if (ev.id === idJogador) estatisticas.mortes++;
      else if (ev.porId === idJogador) estatisticas.inimigosDerrotados++;
      a.pedir();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') void a.agora();
    });
    addEventListener('pagehide', () => {
      void a.agora();
    });
  }

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

