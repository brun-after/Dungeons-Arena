// 15/11/2026 (D-179): a escolha da skin nas telas de seleção de personagem (slots, escolha de classe e personagens do
// Mundo), no lugar da seção do menu de pausa. A escolha continua por classe e neste aparelho (plataforma/preferencias.ts);
// o código libera a skin aqui mesmo. Quem mostra o retrato redesenha ao mudar (`aoMudar`).

import { skinDoCodigo, skinsDaClasse } from '../entities/skins';
import { t } from '../i18n';
import { gravarPreferencias, lerPreferencias, type Preferencias } from '../plataforma/preferencias';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, classe?: string, texto?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto !== undefined) e.textContent = texto;
  return e;
}

/** A resposta do último código, para o seletor redesenhado (a troca redesenha o painel inteiro) mostrá-la. */
let ultimaResposta: { classe: string; texto: string; resultado: string } | null = null;

/** Grava a skin vestida na classe (null: o visual do equipamento). */
function vestir(classe: string, id: string | null): void {
  const p = lerPreferencias();
  const resto: Preferencias['skinsEscolhidas'] = Object.fromEntries(Object.entries(p.skinsEscolhidas).filter(([c]) => c !== classe));
  if (id) resto[classe] = id;
  gravarPreferencias({ ...p, skinsEscolhidas: resto });
}

/** Os botões das skins liberadas da classe e o campo do código. `aoMudar` roda depois de cada troca ou liberação. */
export function seletorDeSkin(classe: string, aoMudar: () => void): HTMLElement {
  const bloco = el('div', 'seletor-skin');
  bloco.dataset.classe = classe;
  const desenhar = () => {
    bloco.replaceChildren();
    const mensagem = ultimaResposta?.classe === classe ? ultimaResposta : null;
    ultimaResposta = null;
    const p = lerPreferencias();
    const liberadas = skinsDaClasse(classe).filter((s) => p.skinsLiberadas.includes(s.id));
    const vestida = p.skinsEscolhidas[classe] ?? null;
    bloco.append(el('h4', undefined, t('skins.titulo')));
    const opcoes = el('div', 'opcoes-skin');
    opcoes.setAttribute('role', 'radiogroup');
    opcoes.setAttribute('aria-label', t('skins.titulo'));
    const opcao = (id: string | null, nome: string, descricao?: string) => {
      const b = el('button', 'opcao-skin', nome);
      b.type = 'button';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', String(vestida === id));
      if (descricao) b.title = descricao;
      b.dataset.skin = id ?? '';
      b.addEventListener('click', () => {
        if (vestida === id) return;
        vestir(classe, id);
        desenhar();
        aoMudar();
      });
      opcoes.append(b);
    };
    opcao(null, t('skins.padrao'));
    for (const s of liberadas) opcao(s.id, s.nome, s.descricao);
    bloco.append(opcoes);
    if (liberadas.length === 0) bloco.append(el('p', 'dica-skin', t('skins.nenhuma')));

    const codigo = el('details', 'codigo-skin');
    if (mensagem) codigo.open = true;
    codigo.append(el('summary', undefined, t('skins.tenhoCodigo')));
    const campo = el('input');
    campo.type = 'text';
    campo.autocomplete = 'off';
    campo.spellcheck = false;
    campo.maxLength = 40;
    campo.setAttribute('aria-label', t('skins.codigo'));
    campo.placeholder = t('skins.codigo');
    const ativar = el('button', 'botao-cabecalho', t('skins.ativar'));
    ativar.type = 'button';
    const situacao = el('p', 'dica-skin');
    situacao.setAttribute('role', 'status');
    if (mensagem) {
      situacao.textContent = mensagem.texto;
      situacao.dataset.resultado = mensagem.resultado;
    }
    const resgatar = () => {
      const s = skinDoCodigo(campo.value);
      if (!s) {
        situacao.dataset.resultado = 'invalido';
        situacao.textContent = t('skins.invalido');
        return;
      }
      const atual = lerPreferencias();
      const jaTinha = atual.skinsLiberadas.includes(s.id);
      if (!jaTinha) gravarPreferencias({ ...atual, skinsLiberadas: [...atual.skinsLiberadas, s.id] });
      // A skin de outra classe fica liberada, mas só aparece nos personagens dela.
      const texto = jaTinha ? t('skins.jaTem', { nome: s.nome }) : s.classe === classe ? t('skins.ok', { nome: s.nome }) : t('skins.okOutra', { nome: s.nome, classe: s.classeNome });
      ultimaResposta = { classe, texto, resultado: jaTinha ? 'repetido' : 'ok' };
      desenhar();
      if (!jaTinha) {
        ultimaResposta = { classe, texto, resultado: 'ok' };
        aoMudar();
      }
    };
    ativar.addEventListener('click', resgatar);
    campo.addEventListener('keydown', (ev) => {
      if (ev.key !== 'Enter') return;
      ev.preventDefault();
      resgatar();
    });
    const linha = el('div', 'linha-codigo-skin');
    linha.append(campo, ativar);
    codigo.append(linha, situacao);
    bloco.append(codigo);
  };
  desenhar();
  return bloco;
}
