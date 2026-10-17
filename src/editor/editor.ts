// Editor de fases (§3.10), carregado sob demanda (`?editor`). Marco 6C (13/10/2026):
//   ?editor        Minhas fases: criar, importar, editar, testar, duplicar e excluir
//   ?editor=<id>   edição da fase
// Abrir o editor não pesa no boot do jogo: este módulo e a tela de edição são um chunk à parte.
// Marco 11A (16/10/2026, D-066): "Minhas aventuras" — cada aventura tem várias fases (?editor=<id>&fase=<n>); testar
// joga a aventura inteira em sequência; importar uma fase cria uma aventura de uma fase.

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

export async function iniciarEditor(raiz: HTMLElement, id: string | null, indice = 0): Promise<void> {
  if (id) {
    const registro = await carregarAventura(id).catch(() => null);
    if (registro) {
      await abrirTelaDeEdicao(raiz, registro, Math.max(0, Math.min(registro.fases.length - 1, indice)));
      return;
    }
  }
  await mostrarMinhasFases(raiz, id ? t('editor.naoEncontrada') : '');
}

async function mostrarMinhasFases(raiz: HTMLElement, mensagem: string): Promise<void> {
  raiz.textContent = '';
  const tela = el('section', 'tela-menu tela-slots');
  tela.setAttribute('aria-labelledby', 'titulo-editor');
  const titulo = el('h1', undefined, t('editor.minhasAventuras'));
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
  const rotuloNome = el('label', undefined, t('editor.nomeAventura'));
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
  nova.append(el('h2', undefined, t('editor.novaAventura')), rotuloNome, campoNome, rotuloTamanho, tamanho, criar);
  nova.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const tam = TAMANHOS.find((x) => x.id === tamanho.value) ?? TAMANHOS[1];
    const nome = campoNome.value.trim() || t('editor.semNome');
    const id = novoIdDeAventura();
    // A primeira fase tem o id da aventura (como antes do 11A).
    const aventura = { id, nome, fases: [novaFaseEditavel(id, t('fases.nomeNova', { n: 1 }), tam.largura, tam.altura)] };
    criar.disabled = true;
    void gravarAventura(aventura)
      .then(() => {
        location.href = `./?editor=${encodeURIComponent(id)}`;
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
      // Id novo: importar nunca sobrescreve uma aventura existente.
      const id = novoIdDeAventura();
      await gravarAventura({ id, nome: r.fase.nome, fases: [{ ...deFaseJson(r.fase), id }] });
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
      el(
        'p',
        'resumo-slot',
        t('editor.resumoAventura', { fases: a.fases.length, inimigos: a.fases.reduce((s, f) => s + f.inimigos.length, 0), data: dataHora.format(a.atualizadoEm) }),
      ),
    );
    const acoes = el('div', 'acoes-slot');
    acoes.append(link(`./?editor=${encodeURIComponent(a.id)}`, t('editor.editar')));
    acoes.append(link(`./?jogo=teste&fase=${encodeURIComponent(a.id)}&indice=0&seguir=1`, t('editor.testar'), 'botao-cabecalho'));
    acoes.append(
      botao(t('editor.duplicar'), () => {
        const id = novoIdDeAventura();
        // A cópia ganha ids de fase novos (a primeira com o id da aventura nova).
        const fases = a.fases.map((f, i) => ({ ...f, id: i === 0 ? id : `${id}-f${i}` }));
        void gravarAventura({ id, nome: t('editor.copiaDe', { nome: a.nome }), fases }).then(() => mostrarMinhasFases(raiz, ''));
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
