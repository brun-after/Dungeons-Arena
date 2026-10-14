// Tela de edição de uma fase (§3.10, §4.13). Marco 6C (13/10/2026): pincéis de terreno, spawn,
// inimigo por preset e borracha; desfazer/refazer por traço; zoom 0.1–6 com pinça, roda e
// "ajustar"; validação com erro marcado na célula; autosave do rascunho; testar e exportar.
// Usa o mesmo terreno e as mesmas silhuetas do jogo (um renderizador só).

import { Container, Graphics } from 'pixi.js';
import type { Celula } from '../core/comandos';
import { REGISTRO_EFEITOS } from '../combat/registro-efeitos';
import { conteudoOficial } from '../core/conteudo';
import { t, type ChaveTexto } from '../i18n';
import { gravarAventura } from '../plataforma/aventuras';
import { detectarToque, sinaisDoNavegador } from '../plataforma/dispositivo';
import { Camera } from '../render/camera';
import { CELULA_PX } from '../render/camera-calculo';
import { desenharSilhueta } from '../render/sprites';
import { criarPalco } from '../render/stage';
import { criarTerreno } from '../render/terreno';
import { mostrarAviso } from '../ui/aviso';
import { validarFase, type ErroFase, type ResultadoValidacao } from '../world/validacao-fase';
import {
  aplicarFerramenta,
  chaveDoObjeto,
  chavesDeOrbe,
  comoFase,
  linhaDeCelulas,
  paraFaseJson,
  type Alteracao,
  type FaseEditavel,
  type Ferramenta,
} from './grade';
import { Historico } from './historico';
import { ligarToqueEditor } from './toque';

const AUTOSAVE_MS = 10_000;
const LIMITES_EDITOR = { min: 0.1, max: 6 };
const MAX_PROBLEMAS = 6;

type IdFerramenta = 'piso' | 'parede' | 'vazio' | 'saida' | 'spawn' | 'inimigo' | 'objeto' | 'remover';

const FERRAMENTAS: readonly { id: IdFerramenta; icone: string }[] = [
  { id: 'piso', icone: '▢' },
  { id: 'parede', icone: '■' },
  { id: 'vazio', icone: '░' },
  { id: 'saida', icone: '⇲' },
  { id: 'spawn', icone: '★' },
  { id: 'inimigo', icone: '▲' },
  { id: 'objeto', icone: '◉' },
  { id: 'remover', icone: '✕' },
];

function el<K extends keyof HTMLElementTagNameMap>(tag: K, classe?: string, texto?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto !== undefined) e.textContent = texto;
  return e;
}

function botao(texto: string, rotulo: string, aoClicar: () => void): HTMLButtonElement {
  const b = el('button', 'botao-editor', texto);
  b.type = 'button';
  b.setAttribute('aria-label', rotulo);
  b.title = rotulo;
  b.addEventListener('click', aoClicar);
  return b;
}

const COR_ORBE: Readonly<Record<string, number>> = { orbe_hp: 0x2ecc71, orbe_recurso: 0x5dade2 };

function tipoDoEfeito(chave: string): keyof typeof REGISTRO_EFEITOS | null {
  const tipo = chave.startsWith('efeito:') ? chave.slice('efeito:'.length) : '';
  return tipo in REGISTRO_EFEITOS ? (tipo as keyof typeof REGISTRO_EFEITOS) : null;
}

function corDoOrbe(chave: string): number {
  const tipo = tipoDoEfeito(chave);
  return tipo ? Number.parseInt(REGISTRO_EFEITOS[tipo].cor.slice(1), 16) : (COR_ORBE[chave] ?? 0xffffff);
}

function rotuloDoOrbe(chave: string): string {
  const tipo = tipoDoEfeito(chave);
  if (tipo) return t('editor.orbeDeEfeito', { efeito: t(`efeito.${tipo}` as ChaveTexto), icone: REGISTRO_EFEITOS[tipo].icone });
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

export async function abrirTelaDeEdicao(raiz: HTMLElement, f: FaseEditavel): Promise<void> {
  const conteudo = conteudoOficial();
  const presets = [...conteudo.presets.values()];
  const toque = detectarToque(sinaisDoNavegador());
  document.body.classList.toggle('toque', toque);
  const fase = comoFase(f);
  const historico = new Historico();
  let sujo = false;
  let ferramenta: IdFerramenta = 'parede';
  let navegando = false;
  let validacao: ResultadoValidacao = validarFase(paraFaseJson(f), new Set(conteudo.presets.keys()));

  raiz.textContent = '';
  const tela = el('div', 'editor');
  const host = el('div', 'palco');
  const topo = el('header', 'barra-editor topo-editor');
  const problemas = el('ol', 'problemas-editor');
  problemas.setAttribute('aria-live', 'polite');
  const base = el('nav', 'barra-editor base-editor');
  base.setAttribute('aria-label', t('editor.ferramentas'));
  tela.append(host, topo, problemas, base);
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
  const camera = new Camera(f.largura * CELULA_PX, f.altura * CELULA_PX, 'janela', toque, LIMITES_EDITOR);
  const terreno = criarTerreno(palco.terreno, fase);
  const marcadores = new Container();
  palco.entidades.addChild(marcadores);
  const sobreposicao = new Graphics();
  palco.efeitos.addChild(sobreposicao);

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

  const desenharMarcadores = () => {
    for (const filho of marcadores.removeChildren()) filho.destroy();
    const colocar = (c: Celula, g: Graphics) => {
      g.position.set((c.x + 0.5) * CELULA_PX, (c.y + 0.5) * CELULA_PX);
      marcadores.addChild(g);
    };
    if (f.spawn) colocar(f.spawn, desenharSilhueta(new Graphics(), 'jogador', 0x3498db));
    for (const i of f.inimigos) {
      const p = conteudo.presets.get(i.preset);
      colocar(i, desenharSilhueta(new Graphics(), p?.arquetipo ?? 'perseguidor', 0xe74c3c));
    }
    // Marco 8A: orbes, na cor do jogo (vida, mana ou a cor do efeito no registro).
    for (const o of f.objetos) {
      colocar(o, new Graphics().circle(0, 0, 10).fill(corDoOrbe(chaveDoObjeto(o))).stroke({ width: 3, color: 0xffffff }));
    }
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
    validacao = validarFase(paraFaseJson(f), new Set(conteudo.presets.keys()));
    sobreposicao.clear();
    // Contorno da fase, para enxergar o limite ao pintar "vazio".
    sobreposicao.rect(0, 0, f.largura * CELULA_PX, f.altura * CELULA_PX).stroke({ width: 2, color: 0x6c6480, alpha: 0.8 });
    const erros = validacao.ok ? [] : validacao.erros;
    marcar(validacao.avisos, 0xf1c40f);
    marcar(erros, 0xe74c3c);
    status.textContent = erros.length > 0 ? t('editor.erros', { n: erros.length }) : validacao.avisos.length > 0 ? t('editor.avisos', { n: validacao.avisos.length }) : t('editor.valida');
    status.dataset.estado = erros.length > 0 ? 'erro' : validacao.avisos.length > 0 ? 'aviso' : 'ok';
    problemas.textContent = '';
    for (const [lista, classe] of [
      [erros, 'problema-erro'],
      [validacao.avisos, 'problema-aviso'],
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

  const redesenhar = (alteracoes: readonly Alteracao[]) => {
    if (alteracoes.length === 0) return;
    sujo = true;
    for (const a of alteracoes) {
      if (a.antes.tipo !== a.depois.tipo) terreno.redesenharCelula(a.x, a.y);
    }
    if (alteracoes.some((a) => a.antes.spawn !== a.depois.spawn || a.antes.inimigo !== a.depois.inimigo || a.antes.objeto !== a.depois.objeto)) {
      desenharMarcadores();
    }
    pedirQuadro();
  };

  // --- Barra superior: voltar, nome, estado da validação, testar, exportar.
  const salvar = async () => {
    await gravarAventura(f);
    sujo = false;
  };
  const voltar = el('a', 'botao-editor', '←');
  voltar.href = './?editor';
  voltar.setAttribute('aria-label', t('editor.voltar'));
  voltar.addEventListener('click', (ev) => {
    ev.preventDefault();
    void salvar().finally(() => {
      location.href = './?editor';
    });
  });
  const nome = el('input', 'nome-editor');
  nome.value = f.nome;
  nome.maxLength = 40;
  nome.setAttribute('aria-label', t('editor.nome'));
  nome.addEventListener('input', () => {
    f.nome = nome.value.trim() || t('editor.semNome');
    sujo = true;
  });
  const testar = botao(`▶ ${t('editor.testar')}`, t('editor.testar'), () => {
    validar();
    if (!validacao.ok) {
      mostrarAviso(tela, t('editor.corrijaAntes'));
      return;
    }
    void salvar().then(() => {
      location.href = `./?jogo=teste&fase=${encodeURIComponent(f.id)}`;
    });
  });
  const exportar = botao('⇩', t('editor.exportar'), () => {
    validar();
    if (!validacao.ok) {
      mostrarAviso(tela, t('editor.corrijaAntes'));
      return;
    }
    const url = URL.createObjectURL(new Blob([JSON.stringify(validacao.fase, null, 2)], { type: 'application/json' }));
    const a = el('a');
    a.href = url;
    a.download = nomeDeArquivo(f.nome);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  });
  topo.append(voltar, nome, status, testar, exportar);

  // --- Barra inferior: ferramentas, preset, desfazer/refazer, ajustar e modo navegação.
  const botoesFerramenta = new Map<IdFerramenta, HTMLButtonElement>();
  const seletorPreset = el('select', 'preset-editor');
  seletorPreset.setAttribute('aria-label', t('editor.preset'));
  for (const p of presets) {
    const op = el('option', undefined, p.nome);
    op.value = p.id;
    seletorPreset.append(op);
  }
  seletorPreset.value = conteudo.presets.has('goblin') ? 'goblin' : (presets[0]?.id ?? '');
  // Orbes: vida, mana e um por efeito elegível do registro (§2.8: o editor lê o registro).
  const seletorOrbe = el('select', 'preset-editor');
  seletorOrbe.setAttribute('aria-label', t('editor.orbe'));
  for (const chave of chavesDeOrbe()) {
    const op = el('option', undefined, rotuloDoOrbe(chave));
    op.value = chave;
    seletorOrbe.append(op);
  }
  const atualizarFerramentas = () => {
    for (const [id, b] of botoesFerramenta) b.setAttribute('aria-pressed', String(!navegando && id === ferramenta));
    seletorPreset.hidden = ferramenta !== 'inimigo';
    seletorOrbe.hidden = ferramenta !== 'objeto';
  };
  for (const { id, icone } of FERRAMENTAS) {
    const b = botao(icone, t(`editor.ferramenta.${id}` as const), () => {
      ferramenta = id;
      navegando = false;
      atualizarFerramentas();
      atualizarNavegar();
    });
    b.dataset.ferramenta = id;
    botoesFerramenta.set(id, b);
    base.append(b);
  }
  base.append(seletorPreset, seletorOrbe, el('span', 'separador-editor'));
  const desfazer = botao('↶', t('editor.desfazer'), () => {
    redesenhar(historico.desfazerUm(f));
    validar();
    atualizarHistorico();
  });
  const refazer = botao('↷', t('editor.refazer'), () => {
    redesenhar(historico.refazerUm(f));
    validar();
    atualizarHistorico();
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
  const navegar = botao('✋', t('editor.navegar'), () => {
    navegando = !navegando;
    atualizarNavegar();
    atualizarFerramentas();
  });
  const atualizarNavegar = () => {
    navegar.setAttribute('aria-pressed', String(navegando));
  };
  base.append(desfazer, refazer, botao('⤢', t('editor.ajustar'), ajustar), navegar);
  atualizarFerramentas();
  atualizarNavegar();
  atualizarHistorico();

  const ferramentaAtual = (): Ferramenta => {
    switch (ferramenta) {
      case 'spawn':
        return { t: 'spawn' };
      case 'inimigo':
        return { t: 'inimigo', preset: seletorPreset.value };
      case 'objeto':
        return { t: 'objeto', chave: seletorOrbe.value };
      case 'remover':
        return { t: 'remover' };
      default:
        return { t: 'terreno', tipo: ferramenta };
    }
  };

  // --- Gestos: um dedo pinta, dois navegam (§4.13).
  let ultima: Celula | null = null;
  const pintar = (c: Celula) => {
    const caminho = ultima ? linhaDeCelulas(ultima, c).slice(1) : [c];
    ultima = c;
    const alteracoes = caminho.flatMap((p) => aplicarFerramenta(f, ferramentaAtual(), p.x, p.y));
    historico.registrar(alteracoes);
    redesenhar(alteracoes);
  };
  ligarToqueEditor(palco.canvas, {
    camera,
    navegando: () => navegando,
    aoIniciarTraco: (c) => {
      historico.iniciarTraco();
      ultima = null;
      pintar(c);
    },
    aoContinuarTraco: (c) => {
      if (ultima && ultima.x === c.x && ultima.y === c.y) return;
      pintar(c);
    },
    aoConcluirTraco: () => {
      historico.concluirTraco();
      ultima = null;
      atualizarHistorico();
      validar();
    },
    aoCancelarTraco: () => {
      redesenhar(historico.cancelarTraco(f).map((a) => ({ ...a, antes: a.depois, depois: a.antes })));
      ultima = null;
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
  desenharMarcadores();
  validar();
  ajustar();
}
