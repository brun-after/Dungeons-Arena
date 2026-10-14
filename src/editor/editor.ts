// Editor de fases (§3.10), carregado sob demanda (`?editor`). Marco 6C (13/10/2026):
//   ?editor        Minhas fases: criar, importar, editar, testar, duplicar e excluir
//   ?editor=<id>   edição da fase
// Abrir o editor não pesa no boot do jogo: este módulo e a tela de edição são um chunk à parte.

import { conteudoOficial } from '../core/conteudo';
import { t } from '../i18n';
import {
  apagarAventura,
  carregarAventura,
  gravarAventura,
  listarAventuras,
  novoIdDeAventura,
  type RegistroAventura,
} from '../plataforma/aventuras';
import { validarFase } from '../world/validacao-fase';
import { deFaseJson, novaFaseEditavel } from './grade';
import { abrirTelaDeEdicao } from './tela';

const TAMANHOS = [
  { id: 'pequena', largura: 16, altura: 12 },
  { id: 'media', largura: 24, altura: 16 },
  { id: 'grande', largura: 40, altura: 28 },
] as const;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, classe?: string, texto?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto !== undefined) e.textContent = texto;
  return e;
}

function link(href: string, texto: string, classe = 'botao-menu'): HTMLAnchorElement {
  const a = el('a', classe, texto);
  a.href = href;
  return a;
}

function botao(texto: string, aoClicar: () => void, classe = 'botao-cabecalho'): HTMLButtonElement {
  const b = el('button', classe, texto);
  b.type = 'button';
  b.addEventListener('click', aoClicar);
  return b;
}

const dataHora = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

export async function iniciarEditor(raiz: HTMLElement, id: string | null): Promise<void> {
  if (id) {
    const registro = await carregarAventura(id).catch(() => null);
    if (registro) {
      await abrirTelaDeEdicao(raiz, registro);
      return;
    }
  }
  await mostrarMinhasFases(raiz, id ? t('editor.naoEncontrada') : '');
}

async function mostrarMinhasFases(raiz: HTMLElement, mensagem: string): Promise<void> {
  raiz.textContent = '';
  const tela = el('section', 'tela-menu tela-slots');
  tela.setAttribute('aria-labelledby', 'titulo-editor');
  const titulo = el('h1', undefined, t('editor.minhasFases'));
  titulo.id = 'titulo-editor';
  const status = el('p', 'erro-lobby', mensagem);
  status.setAttribute('role', 'alert');
  tela.append(titulo, el('p', 'subtitulo-menu', t('editor.explicacao')));
  raiz.append(tela);

  // Nova fase: nome e tamanho.
  const nova = el('form', 'cartao-slot form-nova-fase');
  const campoNome = el('input');
  campoNome.id = 'nome-nova-fase';
  campoNome.value = t('editor.nomePadrao');
  campoNome.maxLength = 40;
  const rotuloNome = el('label', undefined, t('editor.nome'));
  rotuloNome.htmlFor = campoNome.id;
  const tamanho = el('select');
  tamanho.id = 'tamanho-nova-fase';
  for (const tam of TAMANHOS) {
    const op = el('option', undefined, t(`editor.tamanho.${tam.id}` as const, { largura: tam.largura, altura: tam.altura }));
    op.value = tam.id;
    tamanho.append(op);
  }
  tamanho.value = 'media';
  const rotuloTamanho = el('label', undefined, t('editor.tamanho'));
  rotuloTamanho.htmlFor = tamanho.id;
  const criar = el('button', 'botao-menu', t('editor.criar'));
  criar.type = 'submit';
  nova.append(el('h2', undefined, t('editor.novaFase')), rotuloNome, campoNome, rotuloTamanho, tamanho, criar);
  nova.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const tam = TAMANHOS.find((x) => x.id === tamanho.value) ?? TAMANHOS[1];
    const f = novaFaseEditavel(novoIdDeAventura(), campoNome.value.trim() || t('editor.semNome'), tam.largura, tam.altura);
    criar.disabled = true;
    void gravarAventura(f)
      .then(() => {
        location.href = `./?editor=${encodeURIComponent(f.id)}`;
      })
      .catch(() => {
        criar.disabled = false;
        status.textContent = t('editor.semArmazenamento');
      });
  });
  tela.append(nova);

  // Importar uma fase exportada (o mesmo schema do conteúdo oficial; validada antes de gravar).
  const arquivo = el('input');
  arquivo.type = 'file';
  arquivo.accept = 'application/json,.json';
  arquivo.hidden = true;
  arquivo.setAttribute('aria-label', t('editor.importar'));
  arquivo.addEventListener('change', () => {
    const f = arquivo.files?.[0];
    if (!f) return;
    void f.text().then(async (texto) => {
      let json: unknown;
      try {
        json = JSON.parse(texto);
      } catch {
        status.textContent = t('editor.importarInvalido');
        return;
      }
      const r = validarFase(json, new Set(conteudoOficial().presets.keys()), conteudoOficial().itens);
      if (!r.ok) {
        status.textContent = t('editor.importarComErro', { erro: r.erros[0]?.mensagem ?? '?' });
        return;
      }
      // Id novo: importar nunca sobrescreve uma fase existente.
      await gravarAventura({ ...deFaseJson(r.fase), id: novoIdDeAventura() });
      await mostrarMinhasFases(raiz, '');
    });
  });
  tela.append(arquivo, botao(t('editor.importar'), () => {
    arquivo.click();
  }, 'botao-menu'));

  const aventuras: RegistroAventura[] = await listarAventuras().catch(() => {
    status.textContent = t('editor.semArmazenamento');
    return [];
  });
  for (const a of aventuras) {
    const cartao = el('article', 'cartao-slot');
    cartao.dataset.fase = a.id;
    cartao.append(
      el('h2', undefined, a.nome),
      el('p', 'resumo-slot', t('editor.resumo', { largura: a.largura, altura: a.altura, inimigos: a.inimigos.length, data: dataHora.format(a.atualizadoEm) })),
    );
    const acoes = el('div', 'acoes-slot');
    acoes.append(link(`./?editor=${encodeURIComponent(a.id)}`, t('editor.editar')));
    acoes.append(link(`./?jogo=teste&fase=${encodeURIComponent(a.id)}`, t('editor.testar'), 'botao-cabecalho'));
    acoes.append(
      botao(t('editor.duplicar'), () => {
        void gravarAventura({ ...a, id: novoIdDeAventura(), nome: t('editor.copiaDe', { nome: a.nome }) }).then(() => mostrarMinhasFases(raiz, ''));
      }),
    );
    let confirmando = false;
    const excluir = botao(t('slots.excluir'), () => {
      if (!confirmando) {
        confirmando = true;
        excluir.textContent = t('slots.confirmarExcluir');
        excluir.classList.add('perigo');
        return;
      }
      void apagarAventura(a.id).then(() => mostrarMinhasFases(raiz, ''));
    });
    acoes.append(excluir);
    cartao.append(acoes);
    tela.append(cartao);
  }
  tela.append(status, link('./', t('menu.voltar'), 'link-menu'));
}
