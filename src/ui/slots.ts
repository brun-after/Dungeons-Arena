// Tela de slots da campanha (§3.5). Marco 6B (13/10/2026): três slots com continuar, jogo novo,
// exportar, importar e excluir (com confirmação). Importar só em slot vazio, para nunca
// sobrescrever um save sem querer. Textos sempre por textContent.

import { t, type ChaveTexto } from '../i18n';
import { DIFICULDADES, type Dificuldade } from '../modos/dificuldade';
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

/** Marco 15: o seletor de dificuldade do slot; muda o endereço do link (continuar ou jogo novo). */
function seletorDeDificuldade(n: number, inicial: Dificuldade, aoMudar: (d: Dificuldade) => void): HTMLLabelElement {
  const rotulo = el('label', 'linha-dificuldade', t('dificuldade.rotulo'));
  const escolha = el('select', 'escolha-dificuldade');
  escolha.setAttribute('aria-label', t('dificuldade.doSlot', { n }));
  for (const d of DIFICULDADES) {
    const op = el('option', undefined, t(`dificuldade.${d}` as ChaveTexto));
    op.value = d;
    op.selected = d === inicial;
    escolha.append(op);
  }
  escolha.addEventListener('change', () => {
    const valor = DIFICULDADES.find((d) => d === escolha.value);
    if (valor) aoMudar(valor);
  });
  rotulo.append(escolha);
  return rotulo;
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
      const continuar = link(`./?jogo=campanha&slot=${s.slot}&dificuldade=${s.resumo.dificuldade}`, t('slots.continuar'));
      acoes.append(continuar);
      cartao.append(
        el('p', 'detalhe-slot', t('dificuldade.atual', { nome: t(`dificuldade.${s.resumo.dificuldade}` as ChaveTexto) })),
        seletorDeDificuldade(s.slot, s.resumo.dificuldade, (d) => {
          continuar.href = `./?jogo=campanha&slot=${s.slot}&dificuldade=${d}`;
        }),
      );
      acoes.append(
        botao(t('slots.exportar'), () => {
          void carregarSlot(s.slot).then((r) => {
            if (r && r !== 'invalido') baixar(`dungeons-arena-slot${s.slot}.json`, exportarRegistro(r));
          });
        }),
      );
    } else if (s.tipo === 'vazio') {
      cartao.append(el('p', 'resumo-slot', t('slots.vazio')));
      let dificuldadeNova: Dificuldade = 'normal';
      let faseNova = '';
      const novo = link(`./?jogo=campanha&slot=${s.slot}&dificuldade=normal`, t('slots.novo'));
      const atualizarNovo = () => {
        novo.href = `./?jogo=campanha&slot=${s.slot}&dificuldade=${dificuldadeNova}${faseNova ? `&fase=${encodeURIComponent(faseNova)}` : ''}`;
      };
      acoes.append(novo);
      cartao.append(
        seletorDeDificuldade(s.slot, 'normal', (d) => {
          dificuldadeNova = d;
          atualizarNovo();
        }),
      );
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
          faseNova = escolha.value;
          atualizarNovo();
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
