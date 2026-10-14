// Sessão de campanha no navegador: simulação local (offline) + a cena compartilhada.
// A simulação só recebe comandos pela fila; a apresentação só lê o estado e os eventos.
// Marco 6B (13/10/2026): a sessão nasce de um slot de save (ou de um jogo novo nele) e grava
// sozinha (§3.5): a cada 30 s, ao subir de nível, equipar, pegar item, derrotar inimigo, ao
// suspender ou sair da página, e pelo botão "Menu".
// Marco 6C: fases do editor. "Testar agora" (`teste`) joga a fase com uma cópia do personagem do
// último save, sem gravar nada (D-042); um jogo novo também pode começar numa fase do jogador.

import type { Habilidade } from './combat/habilidades';
import type { Comando } from './core/comandos';
import { criarFila, enfileirar, retirarAte } from './core/comandos';
import { conteudoOficial, type Conteudo } from './core/conteudo';
import { BALANCE_PADRAO, type ContextoSimulacao } from './core/contexto';
import { clonarEntidade, criarEstado, type Entidade, type EstadoJogo } from './core/estado';
import type { EventoSimulacao } from './core/eventos-simulacao';
import { hashTexto } from './core/rng';
import { simular } from './core/simulacao';
import fase01 from './data/fases/fase-01.json';
import { paraFaseJson } from './editor/grade';
import { criarJogador } from './entities/fabrica';
import { t } from './i18n';
import { iniciarLaco } from './plataforma/laco-navegador';
import { carregarAventura } from './plataforma/aventuras';
import { carregarSlot, criarAutosave, listarSlots, type Autosave } from './plataforma/saves';
import { Interpolador } from './render/interpolacao';
import { jogadorDoSave, type Estatisticas, type RefFase } from './save/esquema';
import { mostrarAviso } from './ui/aviso';
import { montarCena } from './ui/cena';
import { criarPesquisa } from './ui/pesquisa';
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
  /** Fase de um jogo novo (o padrão é a primeira fase oficial). */
  faseNova?: RefFase;
  /** "Testar agora" do editor: id da fase do jogador; nunca grava. */
  teste?: string;
  /** Teste com pessoas (marco 7A): personagem novo na fase 1, sem save, com medidas e questionário. */
  pesquisa?: boolean;
}

function montarContexto(conteudo: Conteudo, faseJson: unknown): ContextoSimulacao {
  const validacao = validarFase(faseJson, new Set(conteudo.presets.keys()));
  if (!validacao.ok) throw new Error(`fase inválida: ${validacao.erros.map((e) => e.mensagem).join('; ')}`);
  return { fase: carregarFase(validacao.fase), balance: BALANCE_PADRAO, conteudo, modo: conteudo.modoCampanha };
}

async function faseDaReferencia(ref: RefFase): Promise<unknown> {
  if (ref.tipo === 'oficial') return FASES_OFICIAIS[ref.id];
  const aventura = await carregarAventura(ref.id).catch(() => null);
  return aventura ? paraFaseJson(aventura) : undefined;
}

/** Leva um personagem para o início de outra fase: mesma ficha e mochila, vida e mana cheias. */
function personagemNoInicio(e: Entidade, x: number, y: number): Entidade {
  const c = clonarEntidade(e);
  Object.assign(c, {
    id: ID_JOGADOR,
    x,
    y,
    destinoX: x,
    destinoY: y,
    origemX: x,
    origemY: y,
    progressoPasso: 0,
    direcao: 'parado',
    waypoints: [],
    caminho: [],
    hp: c.hpMax,
    mana: c.manaMax,
    morto: false,
    reviverEmTick: 0,
    invisivelAteTick: 0,
    efeitos: [],
    acao: null,
    alvoSelecionado: null,
    participacao: [],
  });
  return c;
}

function novoEstado(ctx: ContextoSimulacao, personagem: Entidade | null = null): EstadoJogo {
  const { fase, conteudo } = ctx;
  const estado = criarEstado({ semente: hashTexto(fase.id), faseId: fase.id });
  const spawn = fase.spawns[0] ?? { x: 1, y: 1 };
  const classe = conteudo.classes.get('aventureiro');
  if (!classe) throw new Error('classe inicial ausente');
  estado.entidades.push(
    personagem ? personagemNoInicio(personagem, spawn.x, spawn.y) : criarJogador(classe, ID_JOGADOR, spawn.x, spawn.y, ctx.balance),
  );
  povoarFase(estado, ctx);
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
  const faseJson = await faseDaReferencia(faseRef);
  if (faseJson === undefined) {
    mostrarErro(raiz, t('slots.faseAusente'), voltarPara);
    return;
  }
  const validacao = validarFase(faseJson, new Set(conteudo.presets.keys()));
  if (!validacao.ok) {
    mostrarErro(raiz, t('editor.faseInvalida', { erro: validacao.erros[0]?.mensagem ?? '?' }), voltarPara);
    return;
  }
  const ctx = montarContexto(conteudo, validacao.fase);
  const estado = leitura?.estado ?? novoEstado(ctx, teste ? await personagemAtual() : null);
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
    habilidades,
    estado: () => estado,
    emitir: (cmd: Comando) => enfileirar(fila, { tick: estado.tick, entidadeId: idJogador, cmd }),
    acoesExtras,
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

