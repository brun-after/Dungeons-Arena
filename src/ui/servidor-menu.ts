// Servidor escolhido neste aparelho (marco 20, 21/10/2026, D-087): no menu, um campo dobrável para jogar na rede local
// (ws://IP:2567). Faz falta no app Android, que não tem barra de endereço para o `?servidor=`; no navegador também
// serve, e o endereço fica guardado nas preferências.

import { t } from '../i18n';
import { enderecoDeServidorValido, gravarPreferencias, lerPreferencias } from '../plataforma/preferencias';
import { enderecoDoServidor } from '../plataforma/servidor';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, classe?: string, texto?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto !== undefined) e.textContent = texto;
  return e;
}

export function criarCampoServidor(): HTMLElement {
  const caixa = el('details', 'servidor-menu');
  caixa.append(el('summary', undefined, t('servidor.titulo')));
  const dica = el('p', 'dica-servidor', t('servidor.dica'));
  const rotulo = el('label', undefined, t('servidor.rotulo'));
  const campo = el('input');
  campo.id = 'campo-servidor';
  campo.type = 'url';
  campo.inputMode = 'url';
  campo.autocomplete = 'off';
  campo.spellcheck = false;
  campo.placeholder = 'ws://192.168.0.10:2567';
  campo.value = lerPreferencias().servidor;
  rotulo.htmlFor = campo.id;
  const estado = el('p', 'estado-servidor');
  estado.setAttribute('aria-live', 'polite');
  const atual = () => t('servidor.atual', { endereco: enderecoDoServidor() ?? t('servidor.nenhum') });
  estado.textContent = atual();

  const gravar = (servidor: string) => {
    gravarPreferencias({ ...lerPreferencias(), servidor });
    campo.value = servidor;
    estado.textContent = `${t('servidor.salvo')} ${atual()}`;
  };
  const salvar = el('button', 'botao-servidor', t('servidor.salvar'));
  salvar.type = 'button';
  salvar.addEventListener('click', () => {
    const v = campo.value.trim();
    if (v && !enderecoDeServidorValido(v)) {
      estado.textContent = t('servidor.invalido');
      return;
    }
    gravar(v);
  });
  const limpar = el('button', 'botao-servidor', t('servidor.limpar'));
  limpar.type = 'button';
  limpar.addEventListener('click', () => {
    gravar('');
  });
  const botoes = el('div', 'botoes-servidor');
  botoes.append(salvar, limpar);
  caixa.append(dica, rotulo, campo, botoes, estado);
  return caixa;
}
