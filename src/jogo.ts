// Sessão de campanha no navegador: simulação local (offline) + a cena compartilhada.
// A simulação só recebe comandos pela fila; a apresentação só lê o estado e os eventos.
// Marco 6B (13/10/2026): a sessão nasce de um slot de save (ou de um jogo novo nele) e grava
// sozinha (§3.5): a cada 30 s, ao subir de nível, equipar, pegar item, derrotar inimigo, ao
// suspender ou sair da página, e pelo botão "Menu".
// Marco 6C: fases do editor. "Testar agora" (`teste`) joga a fase com uma cópia do personagem do
// último save, sem gravar nada (D-042); um jogo novo também pode começar numa fase do jogador.
// Marco 10A-1 (14/10/2026): chegar à saída aberta leva à próxima fase da campanha (data/campanha.json):
// o registro novo é montado por `avancarFase` (pura), gravado, e a sessão recarrega a partir dele (D-052).

import type { Comando } from './core/comandos';
import { criarFila, enfileirar, retirarAte } from './core/comandos';
import { conteudoOficial, type Conteudo } from './core/conteudo';
import { BALANCE_PADRAO, type ContextoSimulacao } from './core/contexto';
import { clonarEstado, criarEstado, type Entidade, type EstadoJogo } from './core/estado';
import type { EventoSimulacao } from './core/eventos-simulacao';
import { hashTexto } from './core/rng';
import { simular } from './core/simulacao';
import campanha from './data/campanha.json';
import fase01 from './data/fases/fase-01.json';
import fase02 from './data/fases/fase-02.json';
import { paraFaseJson } from './editor/grade';
import { criarJogador } from './entities/fabrica';
import { t } from './i18n';
import { iniciarLaco } from './plataforma/laco-navegador';
import { carregarAventura } from './plataforma/aventuras';
import { carregarSlot, criarAutosave, gravarRegistro, listarSlots, type Autosave } from './plataforma/saves';
import { Interpolador } from './render/interpolacao';
import { jogadorDoSave, VERSAO_SCHEMA, type Estatisticas, type RefFase, type RegistroProgresso } from './save/esquema';
import { proximaFase } from './save/sequencia';
import { avancarFase, personagemNoInicio } from './save/transicao';
import { mostrarAviso } from './ui/aviso';
import { montarCena } from './ui/cena';
import { criarPesquisa } from './ui/pesquisa';
import { carregarFase } from './world/fase';
import { catalogoDeGeracao, gerarFase } from './world/gerador';
import { povoarFase } from './world/populacao';
import { validarFase } from './world/validacao-fase';

const ID_JOGADOR = 'j1';
const AUTOSAVE_MS = 30_000;

/** Fases oficiais da campanha, por id (a referência gravada no save). */
const FASES_OFICIAIS: Readonly<Record<string, unknown>> = { 'fase-01': fase01, 'fase-02': fase02 };
const FASE_INICIAL: RefFase = { tipo: 'oficial', id: 'fase-01' };
/** Quanto a tela de transição fica antes de recarregar a sessão na fase nova. */
const TRANSICAO_MS = 900;



export interface OpcoesJogo {
  /** Slot de save (1–3); null joga sem salvar. */
  slot: number | null;
  /** Fase de um jogo novo (o padrão é a primeira fase oficial). */
  faseNova?: RefFase;
  /** "Testar agora" do editor: id da fase do jogador; nunca grava. */
  teste?: string;
  /** Teste com pessoas (marco 7A): personagem novo na fase 1, sem save, com medidas e questionário. */
  pesquisa?: boolean;
}

function montarContexto(conteudo: Conteudo, faseJson: unknown): ContextoSimulacao {
  const validacao = validarFase(faseJson, new Set(conteudo.presets.keys()), conteudo.itens);
  if (!validacao.ok) throw new Error(`fase inválida: ${validacao.erros.map((e) => e.mensagem).join('; ')}`);
  return { fase: carregarFase(validacao.fase), balance: BALANCE_PADRAO, conteudo, modo: conteudo.modoCampanha };
}

async function faseDaReferencia(ref: RefFase, conteudo: Conteudo): Promise<unknown> {
  if (ref.tipo === 'oficial') return FASES_OFICIAIS[ref.id];
  // Marco 10A-2: a fase gerada nasce de novo dos parâmetros guardados (D-053).
  if (ref.tipo === 'gerada') return gerarFase(ref.params, catalogoDeGeracao(conteudo, campanha.geradas.estoque));
  const aventura = await carregarAventura(ref.id).catch(() => null);
  return aventura ? paraFaseJson(aventura) : undefined;
}

/** A fase como o jogo a encontra pela primeira vez: inimigos e objetos, sem o jogador. */
function estadoInicialDaFase(ctx: ContextoSimulacao): EstadoJogo {
  const estado = criarEstado({ semente: hashTexto(ctx.fase.id), faseId: ctx.fase.id });
  povoarFase(estado, ctx);
  return estado;
}

function novoEstado(ctx: ContextoSimulacao, personagem: Entidade | null = null): EstadoJogo {
  const { fase, conteudo } = ctx;
  const estado = estadoInicialDaFase(ctx);
  const spawn = fase.spawns[0] ?? { x: 1, y: 1 };
  const classe = conteudo.classes.get('aventureiro');
  if (!classe) throw new Error('classe inicial ausente');
  // O jogador entra antes dos inimigos (a ordem das entidades é a do save desde o 6B).
  estado.entidades.unshift(personagem ? personagemNoInicio(personagem, spawn, ID_JOGADOR) : criarJogador(classe, ID_JOGADOR, spawn.x, spawn.y, ctx.balance));
  return estado;
}

/** O personagem do save jogado por último, para o teste do editor (ou null: personagem novo). */
async function personagemAtual(): Promise<Entidade | null> {
  try {
    const slots = await listarSlots();
    const recente = slots
      .flatMap((s) => (s.tipo === 'ok' ? [s.resumo] : []))
      .sort((a, b) => b.atualizadoEm - a.atualizadoEm)[0];
    if (!recente) return null;
    const r = await carregarSlot(recente.slot);
    return r && r !== 'invalido' ? (jogadorDoSave(r.estado) ?? null) : null;
  } catch {
    return null;
  }
}

function mostrarErro(raiz: HTMLElement, texto: string, voltarPara = './?jogo=campanha'): void {
  raiz.textContent = '';
  const tela = document.createElement('section');
  tela.className = 'tela-menu';
  const p = document.createElement('p');
  p.setAttribute('role', 'alert');
  p.textContent = texto;
  const voltar = document.createElement('a');
  voltar.className = 'botao-menu';
  voltar.href = voltarPara;
  voltar.textContent = t(voltarPara.includes('editor') ? 'editor.voltar' : 'slots.voltar');
  tela.append(p, voltar);
  raiz.append(tela);
}

export async function iniciarJogo(raiz: HTMLElement, opcoes: OpcoesJogo): Promise<void> {
  const conteudo = conteudoOficial();
  const { teste } = opcoes;
  // O teste do editor nunca grava (D-042).
  const slot = teste ? null : opcoes.slot;
  const leitura = slot === null ? null : await carregarSlot(slot).catch(() => null);
  if (leitura === 'invalido') {
    // Nunca sobrescreve um save que não conseguiu ler: o jogador decide na tela de slots.
    mostrarErro(raiz, t('slots.erroLeitura'));
    return;
  }
  const faseRef: RefFase = teste ? { tipo: 'aventura', id: teste } : (leitura?.faseRef ?? opcoes.faseNova ?? FASE_INICIAL);
  const voltarPara = teste ? `./?editor=${encodeURIComponent(teste)}` : './?jogo=campanha';
  const faseJson = await faseDaReferencia(faseRef, conteudo);
  if (faseJson === undefined) {
    mostrarErro(raiz, t('slots.faseAusente'), voltarPara);
    return;
  }
  const validacao = validarFase(faseJson, new Set(conteudo.presets.keys()), conteudo.itens);
  if (!validacao.ok) {
    mostrarErro(raiz, t('editor.faseInvalida', { erro: validacao.erros[0]?.mensagem ?? '?' }), voltarPara);
    return;
  }
  const ctx = montarContexto(conteudo, validacao.fase);
  const estado = leitura?.estado ?? novoEstado(ctx, teste ? await personagemAtual() : null);
  const idJogador = jogadorDoSave(estado)?.id ?? ID_JOGADOR;
  const estatisticas: Estatisticas = { ...(leitura?.estatisticas ?? { inimigosDerrotados: 0, mortes: 0 }) };

  let autosave: Autosave | null = null;
  const acoesExtras: HTMLElement[] = [];
  const criadoEm = leitura?.criadoEm ?? Date.now();
  const fasesVisitadas = leitura?.fasesVisitadas ?? {};
  if (slot !== null) {
    let avisouFalha = false;
    autosave = criarAutosave({
      slot,
      faseRef,
      nomeFase: ctx.fase.nome,
      criadoEm,
      fasesVisitadas,
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
    sair.dataset.pausa = 'sim';
    const salvar = autosave;
    sair.addEventListener('click', () => {
      sair.disabled = true;
      void salvar.agora().finally(() => {
        location.href = './?jogo=campanha';
      });
    });
    acoesExtras.push(sair);
  }
  const pesquisa = opcoes.pesquisa ? criarPesquisa({ ctx, estado: () => estado, idJogador }) : null;
  if (pesquisa) acoesExtras.push(pesquisa.botao);
  if (teste) {
    const voltar = document.createElement('a');
    voltar.className = 'botao-cabecalho';
    voltar.href = voltarPara;
    voltar.textContent = t('editor.voltarCurto');
    voltar.setAttribute('aria-label', t('editor.voltarAoEditor'));
    acoesExtras.push(voltar);
  }

  const fila = criarFila();
  const cena = await montarCena({
    raiz,
    ctx,
    idLocal: idJogador,
    estado: () => estado,
    emitir: (cmd: Comando) => enfileirar(fila, { tick: estado.tick, entidadeId: idJogador, cmd }),
    acoesExtras,
    // Marco 12: a campanha pausa (§2.15); o menu de pausa também salva e sai.
    pausaOJogo: true,
    acoesDaPausa: acoesExtras
      .filter((b): b is HTMLButtonElement => b instanceof HTMLButtonElement && b.dataset.pausa === 'sim')
      .map((b) => ({ rotulo: t('pausa.salvarESair'), fazer: () => { b.click(); } })),
  });
  if (!cena) return;
  if (teste) mostrarAviso(raiz, t('editor.testeSemSave'), 4000);
  if (pesquisa) {
    pesquisa.ligar(cena.bus);
    mostrarAviso(raiz, t('pesquisa.boasVindas'), 6000);
  }

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

  // Marco 10A-1: saída aberta → próxima fase (D-052). Uma vez só por sessão.
  const sairDaFase = async (): Promise<void> => {
    if (teste) {
      mostrarAviso(raiz, t('fase.concluidaTeste'), 3000);
      setTimeout(() => {
        location.href = voltarPara;
      }, 1500);
      return;
    }
    const proxima = proximaFase(faseRef, campanha.fases, campanha.geradas, BALANCE_PADRAO.xp.nivelMax);
    if (!proxima) {
      mostrarAviso(raiz, t('fase.fimDaCampanha'), 6000);
      return;
    }
    if (slot === null || !autosave) {
      mostrarAviso(raiz, t('fase.concluida'), 4000);
      return;
    }
    const validacaoNova = validarFase(await faseDaReferencia(proxima, conteudo), new Set(conteudo.presets.keys()), conteudo.itens);
    if (!validacaoNova.ok) {
      mostrarAviso(raiz, t('slots.faseAusente'), 5000);
      return;
    }
    const ctxNovo = montarContexto(conteudo, validacaoNova.fase);
    const atual: RegistroProgresso = {
      versaoSchema: VERSAO_SCHEMA,
      slot,
      criadoEm,
      atualizadoEm: Date.now(),
      faseRef,
      nomeFase: ctx.fase.nome,
      estado: clonarEstado(estado),
      estatisticas: { ...estatisticas },
      fasesVisitadas,
    };
    const novo = avancarFase(
      atual,
      { ref: proxima, nome: ctxNovo.fase.nome, spawn: ctxNovo.fase.spawns[0] ?? { x: 1, y: 1 }, novoEstado: () => estadoInicialDaFase(ctxNovo) },
      Date.now(),
    );
    await autosave.suspender();
    await gravarRegistro(novo);
    mostrarAviso(raiz, t('fase.entrando', { nome: ctxNovo.fase.nome }), TRANSICAO_MS + 2000);
    // A mesma URL (preserva `diag` e afins): a sessão reabre o slot já na fase nova.
    setTimeout(() => {
      location.reload();
    }, TRANSICAO_MS);
  };
  let saindo = false;
  cena.bus.on('saidaAlcancada', (ev) => {
    if (ev.id !== idJogador || saindo) return;
    saindo = true;
    sairDaFase().catch(() => {
      mostrarAviso(raiz, t('slots.falhaGravar'), 5000);
    });
  });

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
    pausado: cena.pausado,
  });
}

