// Questionário do fim do teste com pessoas (§5.7). Marco 7A (13/10/2026). Mostra os três avisos de
// ataque como a telegrafia os desenha e pergunta se a pessoa os reconheceu, sem explicar antes.
// Nada é enviado sem o consentimento marcado (D-044). Textos sempre por textContent.

import { t, type ChaveTexto } from '../i18n';
import {
  AVISOS,
  MAX_COMENTARIO,
  RESPOSTAS_AVISO,
  RESPOSTAS_ENTENDIMENTO,
  type Aviso,
  type RespostaAviso,
  type RespostaEntendimento,
  type RespostasDaPessoa,
} from '../pesquisa/relatorio';
import { criarModal } from './modal';

const SVG = 'http://www.w3.org/2000/svg';

/** Desenho do aviso, nas cores da telegrafia hostil (render/telegrafia.ts). */
function desenhoDoAviso(aviso: Aviso): SVGSVGElement {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 120 60');
  svg.setAttribute('width', '120');
  svg.setAttribute('height', '60');
  svg.setAttribute('aria-hidden', 'true');
  const forma = (tag: string, attrs: Record<string, string>) => {
    const e = document.createElementNS(SVG, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    svg.append(e);
  };
  forma('rect', { x: '0', y: '0', width: '120', height: '60', fill: '#3a3546' });
  const vermelho = '#ff5a3c';
  if (aviso === 'area') {
    forma('rect', { x: '30', y: '3', width: '54', height: '54', fill: vermelho, 'fill-opacity': '0.12', stroke: vermelho, 'stroke-width': '2' });
    forma('rect', { x: '43', y: '16', width: '28', height: '28', fill: vermelho, 'fill-opacity': '0.35' });
  } else if (aviso === 'linha') {
    forma('line', { x1: '18', y1: '30', x2: '100', y2: '30', stroke: vermelho, 'stroke-width': '4', 'stroke-opacity': '0.7' });
    forma('circle', { cx: '18', cy: '30', r: '10', fill: '#e74c3c', stroke: '#0d0b12', 'stroke-width': '2' });
    forma('circle', { cx: '100', cy: '30', r: '10', fill: '#3498db', stroke: '#0d0b12', 'stroke-width': '2' });
  } else {
    forma('line', { x1: '30', y1: '30', x2: '62', y2: '30', stroke: vermelho, 'stroke-width': '3', 'stroke-opacity': '0.5' });
    forma('circle', { cx: '66', cy: '30', r: '6', fill: vermelho, stroke: '#ffffff', 'stroke-width': '2' });
  }
  return svg;
}

function grupo<T extends string>(nome: string, legenda: string, opcoes: readonly T[], rotulo: (o: T) => string, extra?: Element): HTMLFieldSetElement {
  const fs = document.createElement('fieldset');
  fs.className = 'pergunta';
  const lg = document.createElement('legend');
  lg.textContent = legenda;
  fs.append(lg);
  if (extra) fs.append(extra);
  const linha = document.createElement('div');
  linha.className = 'opcoes-pergunta';
  for (const o of opcoes) {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = nome;
    input.value = o;
    label.append(input, document.createTextNode(` ${rotulo(o)}`));
    linha.append(label);
  }
  fs.append(linha);
  return fs;
}

export interface OpcoesQuestionario {
  /** Envia; devolve true se o servidor aceitou. */
  aoEnviar: (respostas: RespostasDaPessoa) => Promise<boolean>;
  aoConcluir: () => void;
}

export function abrirQuestionario(o: OpcoesQuestionario): void {
  const modal = criarModal({ titulo: t('pesquisa.titulo'), rotuloFechar: t('pesquisa.fechar'), classe: 'questionario' });
  const form = document.createElement('form');
  form.className = 'form-questionario';
  const intro = document.createElement('p');
  intro.textContent = t('pesquisa.intro');
  form.append(intro);

  for (const aviso of AVISOS) {
    form.append(
      grupo<RespostaAviso>(`aviso-${aviso}`, t(`pesquisa.aviso.${aviso}` as ChaveTexto), RESPOSTAS_AVISO, (r) => t(`pesquisa.resposta.${r}` as ChaveTexto), desenhoDoAviso(aviso)),
    );
  }
  form.append(
    grupo<RespostaEntendimento>('entendeu', t('pesquisa.entendeu'), RESPOSTAS_ENTENDIMENTO, (r) => t(`pesquisa.entendimento.${r}` as ChaveTexto)),
  );

  const comentario = document.createElement('textarea');
  comentario.id = 'comentario-pesquisa';
  comentario.maxLength = MAX_COMENTARIO;
  comentario.rows = 3;
  const rotuloComentario = document.createElement('label');
  rotuloComentario.htmlFor = comentario.id;
  rotuloComentario.textContent = t('pesquisa.comentario');
  form.append(rotuloComentario, comentario);

  const consentimento = document.createElement('input');
  consentimento.type = 'checkbox';
  consentimento.id = 'consentimento-pesquisa';
  const rotuloConsentimento = document.createElement('label');
  rotuloConsentimento.className = 'consentimento';
  rotuloConsentimento.append(consentimento, document.createTextNode(` ${t('pesquisa.consentimento')}`));
  form.append(rotuloConsentimento);

  const status = document.createElement('p');
  status.className = 'erro-lobby';
  status.setAttribute('role', 'alert');
  const enviar = document.createElement('button');
  enviar.type = 'submit';
  enviar.className = 'botao-menu';
  enviar.textContent = t('pesquisa.enviar');
  form.append(status, enviar);

  const marcada = (nome: string): string | null => form.querySelector<HTMLInputElement>(`input[name="${nome}"]:checked`)?.value ?? null;
  const escolha = <T extends string>(nome: string, opcoes: readonly T[]): T | null => opcoes.find((x) => x === marcada(nome)) ?? null;

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const avisos = Object.fromEntries(AVISOS.map((a) => [a, escolha(`aviso-${a}`, RESPOSTAS_AVISO)])) as Record<Aviso, RespostaAviso | null>;
    const entendeu = escolha('entendeu', RESPOSTAS_ENTENDIMENTO);
    if (AVISOS.some((a) => avisos[a] === null) || entendeu === null) {
      status.textContent = t('pesquisa.faltaResposta');
      return;
    }
    if (!consentimento.checked) {
      status.textContent = t('pesquisa.faltaConsentimento');
      return;
    }
    enviar.disabled = true;
    status.textContent = '';
    void o
      .aoEnviar({ avisos: avisos as Record<Aviso, RespostaAviso>, entendeuEquipamento: entendeu, comentario: comentario.value.slice(0, MAX_COMENTARIO) })
      .then((ok) => {
        if (!ok) {
          enviar.disabled = false;
          status.textContent = t('pesquisa.falhaEnvio');
          return;
        }
        form.textContent = '';
        const obrigado = document.createElement('p');
        obrigado.setAttribute('role', 'status');
        obrigado.textContent = t('pesquisa.obrigado');
        const voltar = document.createElement('button');
        voltar.type = 'button';
        voltar.className = 'botao-menu';
        voltar.textContent = t('menu.voltar');
        voltar.addEventListener('click', o.aoConcluir);
        form.append(obrigado, voltar);
      });
  });

  modal.corpo.append(form);
  modal.abrir();
}
