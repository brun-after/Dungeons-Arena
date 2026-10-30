// Painel de fases da aventura (§3.10). Marco 11A (16/10/2026), D-066: a lista das fases (editar, subir, descer,
// duplicar, excluir com confirmação), fases novas (em branco, gerada, ou gerada no estilo aprendido neste aparelho)
// e as propriedades da fase aberta (nome, matiz, tamanho e tileset). Mudanças de estrutura gravam a aventura e
// reabrem o editor; as de propriedade voltam para a tela (histórico).

import type { Conteudo } from '../core/conteudo';
import campanha from '../data/campanha.json';
import { t } from '../i18n';
import { regrasDoAparelho } from '../plataforma/estilo';
import { criarModal } from '../ui/modal';
import { catalogoDeGeracao, gerarFase } from '../world/gerador';
import { adicionarFase, duplicarFase, faseEmBranco, MAX_FASES_AVENTURA, moverFase, novoIdDeFase, removerFase, type Aventura } from './aventura';
import { deFaseJson, type FaseEditavel } from './grade';
import { abrirGerenciadorDeTilesets } from './tileset-ui';
import { comIcone } from '../ui/icones';

export interface OpcoesPainelFases {
  aventura: Aventura;
  indice: number;
  conteudo: Conteudo;
  /** Grava a aventura e abre a fase `indice` no editor. */
  irPara: (indice: number) => void;
  /** Muda metadados da fase aberta (histórico com retrato). */
  alterarFase: (mudar: (f: FaseEditavel) => void) => void;
  /** Redimensiona a fase aberta (a tela reconstrói o terreno); devolve quantas coisas saíram. */
  redimensionar: (largura: number, altura: number) => number;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, classe?: string, texto?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto !== undefined) e.textContent = texto;
  return e;
}

function botao(texto: string, rotulo: string, aoClicar: () => void, classe = 'botao-cabecalho'): HTMLButtonElement {
  const b = el('button', classe);
  // D-067: "seta_cima", "seta_baixo", "copiar" e "fechar" viram ícone; o resto é texto.
  if (texto === 'seta_cima' || texto === 'seta_baixo' || texto === 'fases' || texto === 'fechar') comIcone(b, texto);
  else b.textContent = texto;
  b.type = 'button';
  b.setAttribute('aria-label', rotulo);
  b.addEventListener('click', aoClicar);
  return b;
}

const sorteio = () => Math.random();

/** Uma fase gerada pelo gerador do jogo (com as regras de estilo, se pedidas), pronta para editar. */
export function faseGerada(a: Aventura, conteudo: Conteudo, nome: string, nivel: number, estilo: readonly string[]): FaseEditavel {
  const id = novoIdDeFase(a, sorteio);
  const json = gerarFase(
    {
      id,
      nome,
      semente: Math.floor(Math.random() * 2 ** 31),
      salas: 6,
      nivelInimigos: Math.max(1, Math.min(100, nivel)),
      matizGraus: Math.floor(Math.random() * 360),
      largura: 40,
      altura: 28,
      ...(estilo.length > 0 && { estilo: [...estilo] }),
    },
    catalogoDeGeracao(conteudo, campanha.geradas.estoque),
  );
  return deFaseJson(json);
}

export function abrirPainelDeFases(o: OpcoesPainelFases): void {
  const { aventura: a, indice } = o;
  const m = criarModal({ titulo: t('fases.titulo', { nome: a.nome }), rotuloFechar: t('fases.fechar'), classe: 'modal-fases' });
  m.dialogo.addEventListener('close', () => {
    m.dialogo.remove();
  });
  const lista = el('ol', 'lista-fases');
  a.fases.forEach((f, i) => {
    const li = el('li', i === indice ? 'fase-atual' : undefined);
    li.dataset.indice = String(i);
    const nome = el('span', 'nome-fase-lista', `${i + 1}. ${f.nome}`);
    li.append(nome);
    if (i !== indice) li.append(botao(t('fases.editar'), t('fases.editarRotulo', { n: i + 1 }), () => { o.irPara(i); }));
    const mover = (sentido: -1 | 1) => {
      if (moverFase(a, i, sentido)) o.irPara(i === indice ? i + sentido : indice === i + sentido ? i : indice);
    };
    if (i > 0) li.append(botao('seta_cima', t('fases.subir', { n: i + 1 }), () => { mover(-1); }));
    if (i < a.fases.length - 1) li.append(botao('seta_baixo', t('fases.descer', { n: i + 1 }), () => { mover(1); }));
    li.append(
      botao('fases', t('fases.duplicar', { n: i + 1 }), () => {
        if (duplicarFase(a, i, t('editor.copiaDe', { nome: f.nome }), sorteio)) o.irPara(i + 1);
      }),
    );
    if (a.fases.length > 1) {
      let confirmando = false;
      const excluir = botao('fechar', t('fases.excluir', { n: i + 1 }), () => {
        if (!confirmando) {
          confirmando = true;
          excluir.textContent = t('slots.confirmarExcluir');
          excluir.classList.add('perigo');
          return;
        }
        if (removerFase(a, i)) o.irPara(Math.max(0, i <= indice ? indice - 1 : indice));
      });
      li.append(excluir);
    }
    lista.append(li);
  });

  const cheia = a.fases.length >= MAX_FASES_AVENTURA;
  const nomeNova = () => t('fases.nomeNova', { n: a.fases.length + 1 });
  const adicionar = (f: FaseEditavel) => {
    if (adicionarFase(a, f)) o.irPara(a.fases.length - 1);
  };
  const emBranco = botao(`+ ${t('fases.emBranco')}`, t('fases.emBranco'), () => {
    adicionar(faseEmBranco(a, nomeNova(), sorteio));
  });
  const gerada = botao(`+ ${t('fases.gerada')}`, t('fases.gerada'), () => {
    adicionar(faseGerada(a, o.conteudo, nomeNova(), a.fases.length, []));
  });
  const noEstilo = botao(`+ ${t('fases.noMeuEstilo')}`, t('fases.noMeuEstilo'), () => {
    void regrasDoAparelho().then((regras) => {
      adicionar(faseGerada(a, o.conteudo, nomeNova(), a.fases.length, regras));
    });
  });
  noEstilo.disabled = true;
  void regrasDoAparelho().then((regras) => {
    noEstilo.disabled = cheia || regras.length === 0;
    noEstilo.title = regras.length === 0 ? t('fases.semEstilo') : '';
  });
  for (const b of [emBranco, gerada]) b.disabled = cheia;
  const novas = el('div', 'acoes-slot');
  novas.append(emBranco, gerada, noEstilo);

  // Propriedades da fase aberta.
  const f = a.fases[indice];
  const props = el('fieldset', 'secao-config');
  props.append(el('legend', undefined, t('fases.estaFase')));
  if (f) {
    const nome = el('input', 'preset-editor');
    nome.id = 'nome-da-fase';
    nome.value = f.nome;
    nome.maxLength = 40;
    nome.addEventListener('change', () => {
      o.alterarFase((g) => {
        g.nome = nome.value.trim() || g.nome;
      });
    });
    const matiz = el('input');
    matiz.id = 'matiz-da-fase';
    matiz.type = 'range';
    matiz.min = '0';
    matiz.max = '359';
    matiz.value = String(f.matizGraus);
    matiz.addEventListener('change', () => {
      o.alterarFase((g) => {
        g.matizGraus = Math.max(0, Math.min(359, Math.round(Number(matiz.value))));
      });
    });
    const largura = el('input', 'preset-editor');
    largura.id = 'largura-da-fase';
    largura.type = 'number';
    largura.min = '8';
    largura.max = '120';
    largura.value = String(f.largura);
    const altura = el('input', 'preset-editor');
    altura.id = 'altura-da-fase';
    altura.type = 'number';
    altura.min = '8';
    altura.max = '120';
    altura.value = String(f.altura);
    const aviso = el('p', 'detalhe-slot');
    aviso.setAttribute('role', 'status');
    const redimensionar = botao(t('fases.redimensionar'), t('fases.redimensionar'), () => {
      const removidos = o.redimensionar(Number(largura.value), Number(altura.value));
      aviso.textContent = removidos > 0 ? t('fases.removidos', { n: removidos }) : t('fases.redimensionada');
    });
    const tileset = botao(f.tilesetId ? t('fases.tilesetProprio') : t('fases.tilesetHerdado'), t('fases.tileset'), () => {
      abrirGerenciadorDeTilesets({
        atual: f.tilesetId,
        aoEscolher: (id) => {
          o.alterarFase((g) => {
            g.tilesetId = id;
          });
          // O terreno troca de desenho: reabre a fase.
          o.irPara(indice);
        },
      });
    });
    const campo = (rotulo: string, entrada: HTMLInputElement) => {
      const l = el('label', 'campo-inspetor');
      l.htmlFor = entrada.id;
      l.append(el('span', undefined, rotulo), entrada);
      return l;
    };
    props.append(
      campo(t('fases.nome'), nome),
      campo(t('fases.matiz'), matiz),
      campo(t('fases.largura'), largura),
      campo(t('fases.altura'), altura),
      redimensionar,
      aviso,
      tileset,
    );
  }

  m.corpo.append(lista, el('p', 'detalhe-slot', t('fases.limite', { max: MAX_FASES_AVENTURA })), novas, props);
  m.abrir();
}
