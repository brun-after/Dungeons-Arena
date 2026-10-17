// Tela de edição de uma fase (§3.10, §4.13). Marco 6C (13/10/2026): pincéis de terreno, spawn,
// inimigo por preset e borracha; desfazer/refazer por traço; zoom 0.1–6 com pinça, roda e
// "ajustar"; validação com erro marcado na célula; autosave do rascunho; testar e exportar.
// Usa o mesmo terreno e as mesmas silhuetas do jogo (um renderizador só).
// Marco 11A (16/10/2026, D-066): editor completo no toque — modos pincel, balde e retângulo; baú, loja, loot,
// armadilha e fonte de som; inimigo com nível; porta interna em dois toques; peças do tileset com rotação e espelho;
// "distribuir"; inspetor (ferramenta própria ou toque longo); painel de fases da aventura; testar a fase ou a
// aventura inteira. Ao salvar, as células editadas ensinam o estilo deste aparelho.

import './estilos-editor.css';
import { Container, Graphics } from 'pixi.js';
import type { Celula } from '../core/comandos';
import { REGISTRO_EFEITOS } from '../combat/registro-efeitos';
import { conteudoOficial } from '../core/conteudo';
import { t, type ChaveTexto } from '../i18n';
import { gravarAventura } from '../plataforma/aventuras';
import { detectarToque, sinaisDoNavegador } from '../plataforma/dispositivo';
import { aprenderEstilo } from '../plataforma/estilo';
import { carregarTileset, type RegistroTileset } from '../plataforma/tilesets';
import { Camera } from '../render/camera';
import { CELULA_PX } from '../render/camera-calculo';
import { criarProjecao } from '../render/projecao';
import { criarPalco } from '../render/stage';
import { criarTerreno, type Terreno } from '../render/terreno';
import { carregarTexturasTileset, type TexturasTileset } from '../render/tileset-textura';
import { mostrarAviso } from '../ui/aviso';
import { comIcone } from '../ui/icones';
import { pecasAusentes, tilesetHerdado, textoDaPeca, comporD4, type Peca } from '../world/tileset';
import { type ErroFase, type ResultadoValidacao } from '../world/validacao-fase';
import { faseJsonDaAventura, validarAventura, type Aventura } from './aventura';
import { adicionarPortaInterna, celulasDoRetangulo, distribuir, preencher, redimensionar, retangulo, substituirFase } from './ferramentas';
import { aplicarFerramenta, chavesDeOrbe, clonarFaseEditavel, comoFase, linhaDeCelulas, orbeDaChave, type Alteracao, type ConteudoCelula, type FaseEditavel, type Ferramenta, type ModeloDeObjeto } from './grade';
import { Historico, type Efeito } from './historico';
import { abrirInspetor } from './inspetor';
import { MarcadoresEditor, prepararMarcadores } from './marcadores';
import { abrirPainelDeFases } from './painel-fases';
import { abrirSeletorDePeca } from './tileset-ui';
import { ligarToqueEditor } from './toque';

const AUTOSAVE_MS = 10_000;
const LIMITES_EDITOR = { min: 0.1, max: 6 };
const MAX_PROBLEMAS = 6;
const TOQUE_LONGO_MS = 450;

type IdFerramenta = 'piso' | 'parede' | 'vazio' | 'saida' | 'spawn' | 'inimigo' | 'objeto' | 'porta' | 'peca' | 'selecionar' | 'remover';
type Modo = 'pincel' | 'balde' | 'retangulo';

const GRUPOS: readonly { grupo: 'terreno' | 'coisas' | 'tileset'; itens: readonly { id: IdFerramenta; icone: string }[] }[] = [
  {
    grupo: 'terreno',
    itens: [
      { id: 'piso', icone: 'quadrado_vazio' },
      { id: 'parede', icone: 'quadrado_cheio' },
      { id: 'vazio', icone: 'pontilhado' },
      { id: 'saida', icone: 'porta' },
    ],
  },
  {
    grupo: 'coisas',
    itens: [
      { id: 'spawn', icone: 'estrela' },
      { id: 'inimigo', icone: 'inimigo' },
      { id: 'objeto', icone: 'objeto' },
      { id: 'porta', icone: 'portal' },
      { id: 'selecionar', icone: 'lupa' },
      { id: 'remover', icone: 'fechar' },
    ],
  },
  { grupo: 'tileset', itens: [{ id: 'peca', icone: 'peca' }] },
];

const MODOS: readonly { id: Modo; icone: string }[] = [
  { id: 'pincel', icone: 'pincel' },
  { id: 'balde', icone: 'balde' },
  { id: 'retangulo', icone: 'retangulo' },
];

/** Objetos além dos orbes que a ferramenta coloca, com o conteúdo padrão (o inspetor ajusta depois). */
const MODELOS: Readonly<Record<string, ModeloDeObjeto>> = {
  bau: { tipo: 'bau', loot: ['pocao_vida'], ouro: 20 },
  loja: { tipo: 'loja', estoque: ['pocao_vida', 'pocao_mana'] },
  loot: { tipo: 'loot', itemId: 'pocao_vida', quantidade: 1 },
  armadilha: { tipo: 'armadilha', valor: 6, modo: 'unica' },
  fonte_som: { tipo: 'fonte_som', sfxId: 'fogo', raio: 6, volume: 0.5 },
};

function el<K extends keyof HTMLElementTagNameMap>(tag: K, classe?: string, texto?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto !== undefined) e.textContent = texto;
  return e;
}

/** Ajuste de 16/10/2026 (D-067): botão com ícone do conjunto (`idIcone`) e, opcionalmente, um texto ao lado. */
function botao(idIcone: string, rotulo: string, aoClicar: () => void, texto?: string): HTMLButtonElement {
  const b = el('button', 'botao-editor');
  comIcone(b, idIcone, texto);
  b.type = 'button';
  b.setAttribute('aria-label', rotulo);
  b.title = rotulo;
  b.addEventListener('click', aoClicar);
  return b;
}

function rotuloDoOrbe(chave: string): string {
  const tipo = chave.startsWith('efeito:') ? chave.slice('efeito:'.length) : '';
  if (tipo in REGISTRO_EFEITOS) {
    const d = REGISTRO_EFEITOS[tipo as keyof typeof REGISTRO_EFEITOS];
    return t('editor.orbeDeEfeito', { efeito: t(`efeito.${d.id}` as ChaveTexto) });
  }
  return t(chave === 'orbe_hp' ? 'editor.orbeVida' : 'editor.orbeMana');
}

export function nomeDeArquivo(nome: string): string {
  const base = nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${base || 'fase'}.json`;
}

export async function abrirTelaDeEdicao(raiz: HTMLElement, aventura: Aventura, indice: number): Promise<void> {
  const conteudo = conteudoOficial();
  const presetsConhecidos = new Set(conteudo.presets.keys());
  const toque = detectarToque(sinaisDoNavegador());
  document.body.classList.toggle('toque', toque);
  const f = aventura.fases[indice] as FaseEditavel;
  const historico = new Historico();
  let sujo = false;
  const editadas = new Map<string, Celula>();
  let ferramenta: IdFerramenta = 'parede';
  let modo: Modo = 'pincel';
  let navegando = false;
  let peca: Peca | null = null;
  let portaPendente: Celula | null = null;
  const validarTudo = (): ResultadoValidacao => validarAventura(aventura, presetsConhecidos, conteudo.itens).fases[indice] ?? { ok: false, erros: [], avisos: [] };
  let validacao = validarTudo();

  // O tileset desta fase (com a herança da aventura), se houver.
  const atlasId = tilesetHerdado(
    aventura.fases.map((x) => x.tilesetId),
    indice,
  );
  const registroAtlas: RegistroTileset | null = atlasId ? await carregarTileset(atlasId) : null;
  const texturas: TexturasTileset | null = registroAtlas ? await carregarTexturasTileset(registroAtlas) : null;

  raiz.textContent = '';
  const tela = el('div', 'editor');
  const host = el('div', 'palco');
  const topo = el('header', 'barra-editor topo-editor');
  const problemas = el('ol', 'problemas-editor');
  problemas.setAttribute('aria-live', 'polite');
  const base = el('nav', 'barra-editor base-editor');
  base.setAttribute('aria-label', t('editor.ferramentas'));
  const opcoes = el('div', 'opcoes-editor');
  tela.append(host, topo, problemas, opcoes, base);
  raiz.append(tela);

  let palco;
  try {
    palco = await criarPalco(host);
  } catch {
    const erro = el('div', 'erro', t('erro.graficos'));
    erro.setAttribute('role', 'alert');
    tela.append(erro);
    return;
  }
  // O editor fica só de cima (D-058).
  const camera = new Camera(criarProjecao('cima', f.largura, f.altura), 'janela', toque, LIMITES_EDITOR);
  let terreno: Terreno = criarTerreno(palco.terreno, comoFase(f), texturas);
  await prepararMarcadores();
  const marcadores = new MarcadoresEditor(conteudo);
  palco.entidades.addChild(marcadores.raiz);
  const sobreposicao = new Graphics();
  const pendente = new Container();
  palco.efeitos.addChild(sobreposicao, pendente);

  // Desenho sob demanda: só quando algo muda.
  let quadroPedido = false;
  const pedirQuadro = () => {
    if (quadroPedido) return;
    quadroPedido = true;
    requestAnimationFrame(() => {
      quadroPedido = false;
      camera.aplicar(palco.mundo);
      terreno.atualizarVisibilidade(...camera.retanguloVisivel(palco.altura()));
      palco.renderizar();
    });
  };
  const reconstruirTerreno = () => {
    terreno.destruir();
    terreno = criarTerreno(palco.terreno, comoFase(f), texturas);
  };

  const marcar = (lista: readonly ErroFase[], cor: number) => {
    for (const e of lista) {
      if (e.x === undefined || e.y === undefined) continue;
      sobreposicao.rect(e.x * CELULA_PX, e.y * CELULA_PX, CELULA_PX, CELULA_PX).fill({ color: cor, alpha: 0.35 }).stroke({ width: 3, color: cor });
    }
  };

  const status = el('span', 'status-editor');
  status.setAttribute('role', 'status');
  const validar = () => {
    validacao = validarTudo();
    sobreposicao.clear();
    // Contorno da fase, para enxergar o limite ao pintar "vazio".
    sobreposicao.rect(0, 0, f.largura * CELULA_PX, f.altura * CELULA_PX).stroke({ width: 2, color: 0x6c6480, alpha: 0.8 });
    const erros = validacao.ok ? [] : validacao.erros;
    // Peças que o atlas não tem (§3.10): aviso na célula.
    const avisos = [...validacao.avisos, ...(registroAtlas ? pecasAusentes(comoFase(f), registroAtlas.vinculos).map((c) => ({ mensagem: t('editor.pecaAusente'), ...c })) : [])];
    marcar(avisos, 0xf1c40f);
    marcar(erros, 0xe74c3c);
    comIcone(status, erros.length > 0 ? 'fechar' : avisos.length > 0 ? 'aviso' : 'ok', erros.length > 0 ? t('editor.erros', { n: erros.length }) : avisos.length > 0 ? t('editor.avisos', { n: avisos.length }) : t('editor.valida'));
    status.dataset.estado = erros.length > 0 ? 'erro' : avisos.length > 0 ? 'aviso' : 'ok';
    problemas.textContent = '';
    for (const [lista, classe] of [
      [erros, 'problema-erro'],
      [avisos, 'problema-aviso'],
    ] as const) {
      for (const e of lista.slice(0, MAX_PROBLEMAS)) {
        const li = el('li', classe);
        const texto = e.x !== undefined && e.y !== undefined ? `${e.mensagem} (${e.x}, ${e.y})` : e.mensagem;
        const b = el('button', undefined, texto);
        b.type = 'button';
        b.addEventListener('click', () => {
          if (e.x !== undefined && e.y !== undefined) camera.centralizar({ x: e.x, y: e.y });
          pedirQuadro();
        });
        li.append(b);
        problemas.append(li);
      }
    }
    pedirQuadro();
  };

  const desenharPendente = () => {
    for (const filho of pendente.removeChildren()) filho.destroy();
    if (portaPendente) {
      pendente.addChild(new Graphics().circle((portaPendente.x + 0.5) * CELULA_PX, (portaPendente.y + 0.5) * CELULA_PX, 18).stroke({ width: 4, color: 0xd980fa, alpha: 0.9 }));
    }
  };

  const redesenhar = (alteracoes: readonly Alteracao[]) => {
    if (alteracoes.length === 0) return;
    sujo = true;
    for (const a of alteracoes) {
      if (a.antes.tipo !== a.depois.tipo || a.antes.peca !== a.depois.peca) terreno.redesenharCelula(a.x, a.y);
      if (a.antes.tipo !== a.depois.tipo) editadas.set(`${a.x},${a.y}`, { x: a.x, y: a.y });
    }
    marcadores.desenhar(f);
    pedirQuadro();
  };
  const aplicarEfeito = (e: Efeito) => {
    if (e.t === 'celulas') redesenhar(e.alteracoes);
    else if (e.t === 'fase') {
      sujo = true;
      camera.definirProjecao(criarProjecao('cima', f.largura, f.altura));
      reconstruirTerreno();
      marcadores.desenhar(f);
    }
    validar();
    atualizarHistorico();
  };

  /** Uma mudança de metadados (tranca, chefe, portas, matiz, tileset) com retrato no histórico. */
  const alterarFase = (mudar: (g: FaseEditavel) => void) => {
    const antes = clonarFaseEditavel(f);
    mudar(f);
    historico.registrarFase(antes, f);
    sujo = true;
    if (antes.matizGraus !== f.matizGraus) reconstruirTerreno();
    marcadores.desenhar(f);
    validar();
    atualizarHistorico();
  };
  /** Troca o conteúdo de uma célula (inspetor) como um traço de uma alteração. */
  const alterarCelula = (c: Celula, depois: ConteudoCelula) => {
    historico.iniciarTraco();
    const alteracoes = depois.objeto
      ? aplicarFerramenta(f, { t: 'objeto', modelo: depois.objeto }, c.x, c.y)
      : depois.inimigo
        ? aplicarFerramenta(f, { t: 'inimigo', preset: depois.inimigo.preset, ...(depois.inimigo.nivel && { nivel: depois.inimigo.nivel }) }, c.x, c.y)
        : [];
    // Tirar o objeto (sem trocar por outro): a borracha só daquilo.
    const tirou = !depois.objeto && !depois.inimigo ? aplicarFerramenta(f, { t: 'remover' }, c.x, c.y) : [];
    historico.registrar([...alteracoes, ...tirou]);
    historico.concluirTraco();
    redesenhar([...alteracoes, ...tirou]);
    validar();
    atualizarHistorico();
  };

  // --- Salvar: grava a aventura e ensina o estilo com as células editadas desde o último salvar.
  const salvar = async () => {
    const celulas = [...editadas.values()];
    editadas.clear();
    await aprenderEstilo(comoFase(f), celulas);
    await gravarAventura(aventura);
    sujo = false;
  };
  const irPara = (i: number) => {
    void salvar().finally(() => {
      location.href = `./?editor=${encodeURIComponent(aventura.id)}&fase=${i}`;
    });
  };

  // --- Barra superior: voltar, nome da aventura, fases, estado, testar, testar aventura, exportar.
  const voltar = el('a', 'botao-editor');
  comIcone(voltar, 'voltar');
  voltar.href = './?editor';
  voltar.setAttribute('aria-label', t('editor.voltar'));
  voltar.addEventListener('click', (ev) => {
    ev.preventDefault();
    void salvar().finally(() => {
      location.href = './?editor';
    });
  });
  const nome = el('input', 'nome-editor');
  nome.value = aventura.nome;
  nome.maxLength = 40;
  nome.setAttribute('aria-label', t('editor.nomeAventura'));
  nome.addEventListener('input', () => {
    aventura.nome = nome.value.trim() || t('editor.semNome');
    sujo = true;
  });
  const fases = botao('fases', t('editor.fasesRotulo', { atual: indice + 1, total: aventura.fases.length, nome: f.nome }), () => {
    abrirPainelDeFases({
      aventura,
      indice,
      conteudo,
      irPara,
      alterarFase,
      redimensionar: (l, a) => {
        const antes = clonarFaseEditavel(f);
        const r = redimensionar(f, l, a);
        substituirFase(f, r.fase);
        historico.registrarFase(antes, f);
        camera.definirProjecao(criarProjecao('cima', f.largura, f.altura));
        aplicarEfeito({ t: 'fase' });
        return r.removidos;
      },
    });
  }, `${indice + 1}/${aventura.fases.length}`);
  fases.dataset.testid = 'fases-editor';
  const testarEm = (seguir: boolean) => {
    validar();
    const todas = validarAventura(aventura, presetsConhecidos, conteudo.itens);
    if (!validacao.ok || (seguir && !todas.ok)) {
      mostrarAviso(tela, seguir && validacao.ok ? t('editor.corrijaFase', { n: (todas.primeiraComErro ?? 0) + 1 }) : t('editor.corrijaAntes'));
      return;
    }
    void salvar().then(() => {
      const de = seguir ? 0 : indice;
      location.href = `./?jogo=teste&fase=${encodeURIComponent(aventura.id)}&indice=${de}${seguir ? '&seguir=1' : ''}`;
    });
  };
  const testar = botao('tocar', t('editor.testarFase'), () => {
    testarEm(false);
  }, t('editor.testar'));
  const testarAventura = botao('tocar_dois', t('editor.testarAventura'), () => {
    testarEm(true);
  });
  const exportar = botao('baixar', t('editor.exportar'), () => {
    validar();
    const json = faseJsonDaAventura(aventura, indice);
    if (!validacao.ok || !json) {
      mostrarAviso(tela, t('editor.corrijaAntes'));
      return;
    }
    const url = URL.createObjectURL(new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' }));
    const a = el('a');
    a.href = url;
    a.download = nomeDeArquivo(f.nome);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  });
  topo.append(voltar, nome, fases, status, testar, testarAventura, exportar);

  // --- Barra inferior: modos, ferramentas em grupos, opções da ferramenta, desfazer/refazer, ajustar e navegar.
  const botoesFerramenta = new Map<IdFerramenta, HTMLButtonElement>();
  const botoesModo = new Map<Modo, HTMLButtonElement>();
  const presets = [...conteudo.presets.values()].filter((p) => p.invocacao === null);
  const seletorPreset = el('select', 'preset-editor');
  seletorPreset.setAttribute('aria-label', t('editor.preset'));
  for (const p of presets) {
    const op = el('option', undefined, p.nome);
    op.value = p.id;
    seletorPreset.append(op);
  }
  seletorPreset.value = conteudo.presets.has('goblin') ? 'goblin' : (presets[0]?.id ?? '');
  const nivel = el('input', 'preset-editor nivel-editor');
  nivel.type = 'number';
  nivel.min = '1';
  nivel.max = '20';
  nivel.value = '1';
  nivel.setAttribute('aria-label', t('editor.nivelInimigo'));
  const seletorObjeto = el('select', 'preset-editor');
  seletorObjeto.setAttribute('aria-label', t('editor.objeto'));
  for (const chave of Object.keys(MODELOS)) {
    const op = el('option', undefined, t(`inspetor.tipo.${chave}` as ChaveTexto));
    op.value = chave;
    seletorObjeto.append(op);
  }
  const grupoOrbes = el('optgroup');
  grupoOrbes.label = t('editor.orbes');
  for (const chave of chavesDeOrbe()) {
    const op = el('option', undefined, rotuloDoOrbe(chave));
    op.value = chave;
    grupoOrbes.append(op);
  }
  seletorObjeto.append(grupoOrbes);
  const escolherPeca = botao('peca', t('editor.escolherPeca'), () => {
    if (!registroAtlas) {
      mostrarAviso(tela, t('editor.semTileset'));
      return;
    }
    abrirSeletorDePeca(registroAtlas, (chave) => {
      peca = chave ? { chave, t: 0 } : null;
      atualizarFerramentas();
    });
  });
  const girar = botao('girar', t('editor.girarPeca'), () => {
    if (peca) peca = { ...peca, t: comporD4(peca.t, 1) };
    atualizarFerramentas();
  });
  const espelhar = botao('espelhar', t('editor.espelharPeca'), () => {
    if (peca) peca = { ...peca, t: comporD4(peca.t, 4) };
    atualizarFerramentas();
  });
  const distribuirB = botao('faisca', t('editor.distribuir'), () => {
    historico.iniciarTraco();
    const alteracoes = distribuir(f);
    historico.registrar(alteracoes);
    historico.concluirTraco();
    aplicarEfeito({ t: 'celulas', alteracoes });
  });
  opcoes.append(seletorPreset, nivel, seletorObjeto, escolherPeca, girar, espelhar, distribuirB);

  const atualizarFerramentas = () => {
    for (const [id, b] of botoesFerramenta) b.setAttribute('aria-pressed', String(!navegando && id === ferramenta));
    for (const [id, b] of botoesModo) b.setAttribute('aria-pressed', String(id === modo));
    seletorPreset.hidden = ferramenta !== 'inimigo';
    nivel.hidden = ferramenta !== 'inimigo';
    seletorObjeto.hidden = ferramenta !== 'objeto';
    const comPeca = ferramenta === 'peca';
    for (const b of [escolherPeca, girar, espelhar, distribuirB]) b.hidden = !comPeca;
    comIcone(escolherPeca, 'peca', peca ? textoDaPeca(peca) : t('editor.pecaAutomatica'));
    opcoes.hidden = !['inimigo', 'objeto', 'peca'].includes(ferramenta);
    if (ferramenta !== 'porta' && portaPendente) {
      portaPendente = null;
      desenharPendente();
    }
  };
  for (const { id, icone } of MODOS) {
    const b = botao(icone, t(`editor.modo.${id}`), () => {
      modo = id;
      atualizarFerramentas();
    });
    b.dataset.modo = id;
    botoesModo.set(id, b);
    base.append(b);
  }
  for (const { grupo, itens } of GRUPOS) {
    base.append(el('span', 'separador-editor'));
    const g = el('span', 'grupo-editor');
    g.setAttribute('role', 'group');
    g.setAttribute('aria-label', t(`editor.grupo.${grupo}`));
    for (const { id, icone } of itens) {
      const b = botao(icone, t(`editor.ferramenta.${id}`), () => {
        ferramenta = id;
        navegando = false;
        atualizarFerramentas();
        atualizarNavegar();
      });
      b.dataset.ferramenta = id;
      botoesFerramenta.set(id, b);
      g.append(b);
    }
    base.append(g);
  }
  base.append(el('span', 'separador-editor'));
  const desfazer = botao('desfazer', t('editor.desfazer'), () => {
    aplicarEfeito(historico.desfazerUm(f));
  });
  const refazer = botao('refazer', t('editor.refazer'), () => {
    aplicarEfeito(historico.refazerUm(f));
  });
  const atualizarHistorico = () => {
    desfazer.disabled = !historico.podeDesfazer();
    refazer.disabled = !historico.podeRefazer();
  };
  const ajustar = () => {
    const vista = camera.vistaAtual;
    const zoom = Math.min(vista.largura / (f.largura * CELULA_PX), (vista.altura - 120) / (f.altura * CELULA_PX)) * 0.95;
    camera.zoomEm(zoom, 0, 0);
    camera.centralizar({ x: Math.floor(f.largura / 2), y: Math.floor(f.altura / 2) });
    pedirQuadro();
  };
  const navegar = botao('mao', t('editor.navegar'), () => {
    navegando = !navegando;
    atualizarNavegar();
    atualizarFerramentas();
  });
  const atualizarNavegar = () => {
    navegar.setAttribute('aria-pressed', String(navegando));
  };
  base.append(desfazer, refazer, botao('ajustar', t('editor.ajustar'), ajustar), navegar);
  atualizarFerramentas();
  atualizarNavegar();
  atualizarHistorico();

  const ferramentaAtual = (): Ferramenta | null => {
    switch (ferramenta) {
      case 'spawn':
        return { t: 'spawn' };
      case 'inimigo': {
        const n = Math.max(1, Math.min(20, Math.round(Number(nivel.value) || 1)));
        return { t: 'inimigo', preset: seletorPreset.value, ...(n > 1 && { nivel: n }) };
      }
      case 'objeto': {
        const modelo = MODELOS[seletorObjeto.value] ?? orbeDaChave(seletorObjeto.value);
        return modelo ? { t: 'objeto', modelo } : null;
      }
      case 'peca':
        return { t: 'peca', peca: peca ? textoDaPeca(peca) : null };
      case 'remover':
        return { t: 'remover' };
      case 'porta':
      case 'selecionar':
        return null;
      default:
        return { t: 'terreno', tipo: ferramenta };
    }
  };
  /** Balde e retângulo valem para terreno, peça, objeto e borracha; o resto só no pincel. */
  const modoEfetivo = (): Modo => (['spawn', 'inimigo', 'porta', 'selecionar'].includes(ferramenta) ? 'pincel' : modo);

  const inspecionar = (c: Celula) => {
    const abriu = abrirInspetor(f, c, conteudo, {
      alterarCelula: (depois) => {
        alterarCelula(c, depois);
      },
      alterarFase,
      rotuloDoOrbe,
    });
    if (!abriu) mostrarAviso(tela, t('editor.nadaAqui'), 1500);
  };

  const tocarPorta = (c: Celula) => {
    if (!portaPendente) {
      portaPendente = c;
      desenharPendente();
      pedirQuadro();
      return;
    }
    const a = portaPendente;
    portaPendente = null;
    desenharPendente();
    const antes = clonarFaseEditavel(f);
    if (adicionarPortaInterna(f, a, c, (n) => t('editor.nomePorta', { n }))) {
      historico.registrarFase(antes, f);
      aplicarEfeito({ t: 'fase' });
    } else {
      mostrarAviso(tela, t('editor.portaInvalida'), 2500);
      pedirQuadro();
    }
  };

  // --- Gestos: um dedo pinta, dois navegam (§4.13); toque longo inspeciona.
  let ultima: Celula | null = null;
  let inicio: Celula | null = null;
  let longo: ReturnType<typeof setTimeout> | null = null;
  const pararLongo = () => {
    if (longo !== null) clearTimeout(longo);
    longo = null;
  };
  const pintar = (c: Celula) => {
    const fer = ferramentaAtual();
    if (!fer) return;
    const caminho = ultima ? linhaDeCelulas(ultima, c).slice(1) : [c];
    ultima = c;
    const alteracoes = caminho.flatMap((p) => aplicarFerramenta(f, fer, p.x, p.y));
    historico.registrar(alteracoes);
    redesenhar(alteracoes);
  };
  ligarToqueEditor(palco.canvas, {
    camera,
    navegando: () => navegando,
    aoIniciarTraco: (c) => {
      historico.iniciarTraco();
      ultima = null;
      inicio = c;
      pararLongo();
      longo = setTimeout(() => {
        longo = null;
        // Toque longo: desfaz o que o traço já pintou e abre o inspetor.
        redesenhar(historico.cancelarTraco(f).map((a) => ({ ...a, antes: a.depois, depois: a.antes })));
        inicio = null;
        inspecionar(c);
      }, TOQUE_LONGO_MS);
      if (ferramenta === 'selecionar') {
        pararLongo();
        inspecionar(c);
        return;
      }
      if (ferramenta === 'porta') {
        pararLongo();
        tocarPorta(c);
        return;
      }
      const m = modoEfetivo();
      if (m === 'pincel') pintar(c);
      else if (m === 'balde') {
        pararLongo();
        const fer = ferramentaAtual();
        if (!fer) return;
        const r = preencher(f, c, fer);
        if (r.excedeu) mostrarAviso(tela, t('editor.baldeGrande'), 2500);
        historico.registrar(r.alteracoes);
        redesenhar(r.alteracoes);
      } else {
        marcadores.desenhar(f, [c]);
        pedirQuadro();
      }
    },
    aoContinuarTraco: (c) => {
      if (inicio && (inicio.x !== c.x || inicio.y !== c.y)) pararLongo();
      if (!inicio || ferramenta === 'selecionar' || ferramenta === 'porta') return;
      const m = modoEfetivo();
      if (m === 'pincel') {
        if (ultima && ultima.x === c.x && ultima.y === c.y) return;
        pintar(c);
      } else if (m === 'retangulo') {
        marcadores.desenhar(f, celulasDoRetangulo(f, inicio, c));
        ultima = c;
        pedirQuadro();
      }
    },
    aoConcluirTraco: () => {
      pararLongo();
      if (inicio && modoEfetivo() === 'retangulo' && ferramenta !== 'selecionar' && ferramenta !== 'porta') {
        const fer = ferramentaAtual();
        if (fer) {
          const alteracoes = retangulo(f, inicio, ultima ?? inicio, fer);
          historico.registrar(alteracoes);
          redesenhar(alteracoes);
        }
        marcadores.desenhar(f);
      }
      historico.concluirTraco();
      ultima = null;
      inicio = null;
      atualizarHistorico();
      validar();
    },
    aoCancelarTraco: () => {
      pararLongo();
      redesenhar(historico.cancelarTraco(f).map((a) => ({ ...a, antes: a.depois, depois: a.antes })));
      ultima = null;
      inicio = null;
      marcadores.desenhar(f);
      validar();
    },
    aoMover: pedirQuadro,
  });

  // Ctrl+Z / Ctrl+Y no desktop.
  addEventListener('keydown', (ev) => {
    if (ev.target instanceof HTMLInputElement || !(ev.ctrlKey || ev.metaKey)) return;
    if (ev.code === 'KeyZ') {
      ev.preventDefault();
      (ev.shiftKey ? refazer : desfazer).click();
    } else if (ev.code === 'KeyY') {
      ev.preventDefault();
      refazer.click();
    }
  });

  // Autosave do rascunho (§4.13): por intervalo e ao suspender o app.
  setInterval(() => {
    if (sujo) void salvar();
  }, AUTOSAVE_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && sujo) void salvar();
  });

  const reenquadrar = () => {
    camera.definirVista({ largura: palco.largura(), altura: palco.altura() });
    pedirQuadro();
  };
  palco.aoRedimensionar(reenquadrar);
  camera.definirVista({ largura: palco.largura(), altura: palco.altura() });
  marcadores.desenhar(f);
  validar();
  ajustar();
}
