// Configurações (§2.15). Marco 12 (14/10/2026). Gráficos, áudio, câmera, controles e acessibilidade, num
// modal acessível (<dialog>). Cada mudança vale na hora (`aoMudar`) e é gravada (preferencias.ts).

import { t, type ChaveTexto } from '../i18n';
import { gravarPreferencias, lerPreferencias, type Preferencias } from '../plataforma/preferencias';
import { criarModal, type Modal } from './modal';

export interface Configuracoes {
  modal: Modal;
  abrir: () => void;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, classe?: string, texto?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto !== undefined) e.textContent = texto;
  return e;
}

let proximo = 1;

export function criarConfiguracoes(o: { toque: boolean; aoMudar: (p: Preferencias) => void; aoFechar?: () => void }): Configuracoes {
  const modal = criarModal({
    titulo: t('config.titulo'),
    rotuloFechar: t('config.fechar'),
    classe: 'configuracoes',
    aoAbrir: () => {
      desenhar();
    },
    ...(o.aoFechar && { aoFechar: o.aoFechar }),
  });

  const mudar = (parcial: Partial<Preferencias>) => {
    const p = { ...lerPreferencias(), ...parcial };
    gravarPreferencias(p);
    o.aoMudar(p);
  };

  const campo = (rotulo: string, controle: HTMLElement): HTMLElement => {
    const id = `config-${proximo++}`;
    controle.id = id;
    const linha = el('div', 'linha-config');
    const l = el('label', undefined, rotulo);
    l.htmlFor = id;
    linha.append(l, controle);
    return linha;
  };

  const escolha = <T extends string>(chave: string, atual: T, opcoes: readonly T[], prefixo: string, aplicar: (v: T) => void) => {
    const s = el('select');
    s.dataset.config = chave;
    for (const v of opcoes) {
      const op = el('option', undefined, t(`${prefixo}.${v}` as ChaveTexto));
      op.value = v;
      op.selected = v === atual;
      s.append(op);
    }
    s.addEventListener('change', () => {
      aplicar(s.value as T);
    });
    return s;
  };

  const marcador = (chave: string, atual: boolean, aplicar: (v: boolean) => void) => {
    const c = el('input');
    c.type = 'checkbox';
    c.checked = atual;
    c.dataset.config = chave;
    c.addEventListener('change', () => {
      aplicar(c.checked);
    });
    return c;
  };

  const faixa = (chave: string, atual: number, min: number, max: number, passo: number, aplicar: (v: number) => void) => {
    const r = el('input');
    r.type = 'range';
    r.min = String(min);
    r.max = String(max);
    r.step = String(passo);
    r.value = String(atual);
    r.dataset.config = chave;
    r.addEventListener('input', () => {
      aplicar(Number(r.value));
    });
    return r;
  };

  const desenhar = () => {
    const p = lerPreferencias();
    const corpo = modal.corpo;
    corpo.textContent = '';
    const secao = (titulo: string, ...linhas: HTMLElement[]) => {
      const f = el('fieldset', 'secao-config');
      f.append(el('legend', undefined, titulo), ...linhas);
      corpo.append(f);
    };
    secao(
      t('config.graficos'),
      campo(t('config.qualidade'), escolha('qualidade', p.qualidade, ['auto', 'minimo', 'baixo', 'medio', 'alto'] as const, 'qualidade', (v) => { mudar({ qualidade: v }); })),
      campo(t('config.efeitosDeTela'), marcador('efeitosDeTela', p.efeitosDeTela, (v) => { mudar({ efeitosDeTela: v }); })),
    );
    secao(
      t('config.audio'),
      campo(t('config.volumeMusica'), faixa('volumeMusica', Math.round(p.volumeMusica * 100), 0, 100, 5, (v) => { mudar({ volumeMusica: v / 100 }); })),
      campo(t('config.volumeEfeitos'), faixa('volumeEfeitos', Math.round(p.volumeEfeitos * 100), 0, 100, 5, (v) => { mudar({ volumeEfeitos: v / 100 }); })),
      campo(t('config.mudo'), marcador('mudo', p.mudo, (v) => { mudar({ mudo: v }); })),
    );
    secao(
      t('config.camera'),
      campo(t('config.modoCamera'), escolha('camera', p.camera, ['janela', 'centralizada'] as const, 'modoCamera', (v) => { mudar({ camera: v }); })),
      campo(t('config.enquadrarDois'), marcador('enquadrarDois', p.enquadrarDois, (v) => { mudar({ enquadrarDois: v }); })),
    );
    if (o.toque) {
      secao(t('config.controles'), campo(t('config.controle'), escolha('controle', p.controle, ['joystick', 'dpad'] as const, 'tipoControle', (v) => { mudar({ controle: v }); })));
    }
    secao(
      t('config.acessibilidade'),
      campo(t('config.escala'), faixa('escalaInterface', Math.round(p.escalaInterface * 100), 80, 150, 10, (v) => { mudar({ escalaInterface: v / 100 }); })),
      campo(t('config.movimentoReduzido'), escolha('movimentoReduzido', p.movimentoReduzido, ['sistema', 'sempre', 'nunca'] as const, 'movimento', (v) => { mudar({ movimentoReduzido: v }); })),
    );
  };

  return { modal, abrir: modal.abrir };
}
