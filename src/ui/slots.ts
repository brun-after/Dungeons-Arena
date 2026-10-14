// Tela de slots da campanha (§3.5). Marco 6B (13/10/2026): três slots com continuar, jogo novo,
// exportar, importar e excluir (com confirmação). Importar só em slot vazio, para nunca
// sobrescrever um save sem querer. Textos sempre por textContent.

import { t } from '../i18n';
import { listarAventuras, type RegistroAventura } from '../plataforma/aventuras';
import { apagarSlot, carregarSlot, gravarRegistro, listarSlots, type EstadoSlot } from '../plataforma/saves';
import { exportarRegistro, importarRegistro } from '../save/esquema';

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

function baixar(nome: string, texto: string): void {
  const url = URL.createObjectURL(new Blob([texto], { type: 'application/json' }));
  const a = el('a');
  a.href = url;
  a.download = nome;
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

export async function mostrarSlots(raiz: HTMLElement): Promise<void> {
  raiz.textContent = '';
  const tela = el('section', 'tela-menu tela-slots');
  tela.setAttribute('aria-labelledby', 'titulo-slots');
  const titulo = el('h1', undefined, t('slots.titulo'));
  titulo.id = 'titulo-slots';
  const status = el('p', 'erro-lobby');
  status.setAttribute('role', 'alert');
  tela.append(titulo);
  raiz.append(tela);

  let slots: EstadoSlot[];
  try {
    slots = await listarSlots();
  } catch {
    // Sem IndexedDB: dá para jogar, só não salva.
    tela.append(el('p', 'subtitulo-menu', t('slots.semArmazenamento')), link('./?jogo=campanha&slot=0', t('slots.jogarSemSalvar')));
    tela.append(link('./', t('menu.voltar'), 'link-menu'));
    return;
  }

  const recarregar = () => {
    void mostrarSlots(raiz);
  };
  // Marco 6C: um jogo novo pode começar numa fase criada no editor.
  const aventuras: RegistroAventura[] = await listarAventuras().catch(() => []);

  for (const s of slots) {
    const cartao = el('article', 'cartao-slot');
    cartao.dataset.slot = String(s.slot);
    cartao.append(el('h2', undefined, t('slots.slot', { n: s.slot })));
    const acoes = el('div', 'acoes-slot');
    if (s.tipo === 'ok') {
      cartao.append(
        el(
          'p',
          'resumo-slot',
          t('slots.resumo', { nivel: s.resumo.nivel, fase: s.resumo.nomeFase, data: dataHora.format(s.resumo.atualizadoEm) }),
        ),
      );
      acoes.append(link(`./?jogo=campanha&slot=${s.slot}`, t('slots.continuar')));
      acoes.append(
        botao(t('slots.exportar'), () => {
          void carregarSlot(s.slot).then((r) => {
            if (r && r !== 'invalido') baixar(`dungeons-arena-slot${s.slot}.json`, exportarRegistro(r));
          });
        }),
      );
    } else if (s.tipo === 'vazio') {
      cartao.append(el('p', 'resumo-slot', t('slots.vazio')));
      const novo = link(`./?jogo=campanha&slot=${s.slot}`, t('slots.novo'));
      acoes.append(novo);
      if (aventuras.length > 0) {
        const escolha = el('select', 'escolha-fase');
        escolha.setAttribute('aria-label', t('slots.faseDoJogo', { n: s.slot }));
        const oficial = el('option', undefined, t('slots.faseOficial'));
        oficial.value = '';
        escolha.append(oficial);
        for (const a of aventuras) {
          const op = el('option', undefined, a.nome);
          op.value = `aventura:${a.id}`;
          escolha.append(op);
        }
        escolha.addEventListener('change', () => {
          novo.href = `./?jogo=campanha&slot=${s.slot}${escolha.value ? `&fase=${encodeURIComponent(escolha.value)}` : ''}`;
        });
        acoes.append(escolha);
      }
      const arquivo = el('input');
      arquivo.type = 'file';
      arquivo.accept = 'application/json,.json';
      arquivo.hidden = true;
      arquivo.setAttribute('aria-label', t('slots.importarEm', { n: s.slot }));
      arquivo.addEventListener('change', () => {
        const f = arquivo.files?.[0];
        if (!f) return;
        void f.text().then(async (texto) => {
          const leitura = importarRegistro(texto, s.slot);
          if (!leitura.ok) {
            status.textContent = t(`slots.erroImportar.${leitura.erro}` as const);
            return;
          }
          await gravarRegistro(leitura.registro);
          recarregar();
        });
      });
      acoes.append(
        arquivo,
        botao(t('slots.importar'), () => {
          arquivo.click();
        }),
      );
    } else {
      cartao.append(el('p', 'resumo-slot', t('slots.invalido')));
    }
    if (s.tipo !== 'vazio') {
      // Excluir pede um segundo toque para confirmar.
      let confirmando = false;
      const excluir = botao(t('slots.excluir'), () => {
        if (!confirmando) {
          confirmando = true;
          excluir.textContent = t('slots.confirmarExcluir');
          excluir.classList.add('perigo');
          return;
        }
        void apagarSlot(s.slot).then(recarregar);
      });
      acoes.append(excluir);
    }
    cartao.append(acoes);
    tela.append(cartao);
  }
  tela.append(status, link('./', t('menu.voltar'), 'link-menu'));
}
