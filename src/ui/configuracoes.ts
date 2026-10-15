// Configurações (§2.15). Marco 12 (14/10/2026). Gráficos, áudio, câmera, controles e acessibilidade, num
// modal acessível (<dialog>). Cada mudança vale na hora (`aoMudar`) e é gravada (preferencias.ts).
// Marco 13 (14/10/2026): a visão (de cima ou isométrica) e a aparência (imagem própria, sentido e tamanho).

import { t, type ChaveTexto } from '../i18n';
import { gravarPreferencias, lerPreferencias, type Preferencias } from '../plataforma/preferencias';
import { apagarImagemToken, gravarImagemToken } from '../plataforma/token';
import { prepararToken } from '../render/token-imagem';
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
      campo(t('config.visao'), escolha('visao', p.visao, ['cima', 'iso'] as const, 'visao', (v) => { mudar({ visao: v }); })),
    );
    secao(t('config.aparencia'), ...aparencia(p));
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

  // Imagem do personagem: validada e recortada antes de gravar; recusada, o jogo segue com o modelo padrão.
  const aparencia = (p: Preferencias): HTMLElement[] => {
    const arquivo = el('input');
    arquivo.type = 'file';
    arquivo.accept = 'image/png,image/webp,image/jpeg,image/gif';
    arquivo.dataset.config = 'imagem';
    const situacao = el('p', 'dica-config');
    situacao.setAttribute('role', 'status');
    situacao.dataset.config = 'situacaoImagem';
    const dica = el('p', 'dica-config', t('config.imagemDica'));
    arquivo.addEventListener('change', () => {
      const f = arquivo.files?.[0];
      if (!f) return;
      void prepararToken(f).then(async (r) => {
        situacao.dataset.resultado = r.ok ? 'ok' : r.motivo;
        situacao.textContent = r.ok ? t('token.ok') : t(`token.${r.motivo}`);
        if (r.ok) await gravarImagemToken(f);
      });
    });
    const remover = el('button', 'botao-config', t('config.removerImagem'));
    remover.type = 'button';
    remover.dataset.config = 'removerImagem';
    remover.addEventListener('click', () => {
      void apagarImagemToken().then(() => {
        situacao.dataset.resultado = 'removida';
        situacao.textContent = t('token.removida');
      });
    });
    return [
      campo(t('config.imagem'), arquivo),
      dica,
      remover,
      situacao,
      campo(t('config.sentidoToken'), escolha('sentidoToken', p.sentidoToken, ['direita', 'esquerda'] as const, 'sentido', (v) => { mudar({ sentidoToken: v }); })),
      campo(t('config.tamanhoToken'), faixa('tamanhoToken', Math.round(p.tamanhoToken * 100), 80, 130, 5, (v) => { mudar({ tamanhoToken: v / 100 }); })),
    ];
  };

  return { modal, abrir: modal.abrir };
}
