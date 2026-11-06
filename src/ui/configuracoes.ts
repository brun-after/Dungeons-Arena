// Configurações (§2.15). Marco 12 (14/10/2026). Gráficos, áudio, câmera, controles e acessibilidade, num
// modal acessível (<dialog>). Cada mudança vale na hora (`aoMudar`) e é gravada (preferencias.ts).
// Marco 13 (14/10/2026): a visão (de cima ou isométrica) e a aparência (imagem própria, sentido e tamanho).

import { SKINS, skinDoCodigo } from '../entities/skins';
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

export function criarConfiguracoes(o: { toque: boolean; direcional?: boolean; aoMudar: (p: Preferencias) => void; aoFechar?: () => void }): Configuracoes {
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
      campo(t('config.fps'), escolha('fps', p.fps, ['auto', '60', '30'] as const, 'fps', (v) => { mudar({ fps: v }); })),
      campo(t('config.resolucao'), escolha('resolucao', p.resolucao, ['auto', 'alta', 'media', 'baixa'] as const, 'resolucao', (v) => { mudar({ resolucao: v }); })),
      campo(t('config.medidor'), marcador('medidor', p.medidor, (v) => { mudar({ medidor: v }); })),
      campo(t('config.efeitosDeTela'), marcador('efeitosDeTela', p.efeitosDeTela, (v) => { mudar({ efeitosDeTela: v }); })),
      campo(t('config.areaExata'), marcador('areaExata', p.areaExata, (v) => { mudar({ areaExata: v }); })),
      campo(t('config.runaDaClasse'), marcador('runaDaClasse', p.runaDaClasse, (v) => { mudar({ runaDaClasse: v }); })),
      campo(t('config.estiloNasGeradas'), marcador('estiloNasGeradas', p.estiloNasGeradas, (v) => { mudar({ estiloNasGeradas: v }); })),
    );
    secao(t('config.aparencia'), ...aparencia(p));
    secao(t('config.skins'), ...skins(p));
    const creditosAudio = el('a', undefined, t('config.creditosAudio'));
    creditosAudio.href = `${import.meta.env.BASE_URL}audio/index.html`;
    creditosAudio.target = '_blank';
    creditosAudio.rel = 'noopener';
    secao(
      t('config.audio'),
      campo(t('config.volumeMusica'), faixa('volumeMusica', Math.round(p.volumeMusica * 100), 0, 100, 5, (v) => { mudar({ volumeMusica: v / 100 }); })),
      campo(t('config.volumeEfeitos'), faixa('volumeEfeitos', Math.round(p.volumeEfeitos * 100), 0, 100, 5, (v) => { mudar({ volumeEfeitos: v / 100 }); })),
      campo(t('config.mudo'), marcador('mudo', p.mudo, (v) => { mudar({ mudo: v }); })),
      creditosAudio,
    );
    secao(
      t('config.camera'),
      campo(t('mundo.party.visao'), marcador('visaoParty', p.visaoParty, v => { mudar({ visaoParty: v }); })),
      campo(t('config.modoCamera'), escolha('camera', p.camera, ['janela', 'centralizada'] as const, 'modoCamera', (v) => { mudar({ camera: v }); })),
      campo(t('config.enquadrarDois'), marcador('enquadrarDois', p.enquadrarDois, (v) => { mudar({ enquadrarDois: v }); })),
    );
    // Marco 26 (D-107): as teclas valem em qualquer aparelho; o tipo do direcional, só onde ele aparece.
    const teclas = campo(t('config.teclas'), escolha('teclasMovimento', p.teclasMovimento, ['wasd', 'ewas'] as const, 'teclasMovimento', (v) => { mudar({ teclasMovimento: v }); }));
    // Marco 26 (D-121): seguir alvo, em qualquer aparelho.
    const seguir = campo(t('config.seguirAlvo'), marcador('seguirAlvo', p.seguirAlvo, (v) => { mudar({ seguirAlvo: v }); }));
    if (o.direcional ?? o.toque) {
      secao(t('config.controles'), campo(t('config.controle'), escolha('controle', p.controle, ['joystick', 'dpad'] as const, 'tipoControle', (v) => { mudar({ controle: v }); })), teclas, seguir);
    } else {
      secao(t('config.controles'), teclas, seguir);
    }
    secao(
      t('config.acessibilidade'),
      campo(t('config.escala'), faixa('escalaInterface', Math.round(p.escalaInterface * 100), 80, 150, 10, (v) => { mudar({ escalaInterface: v / 100 }); })),
      campo(t('config.movimentoReduzido'), escolha('movimentoReduzido', p.movimentoReduzido, ['sistema', 'sempre', 'nunca'] as const, 'movimento', (v) => { mudar({ movimentoReduzido: v }); })),
    );
  };

  // 06/11/2026: skins. O código libera a skin neste aparelho; a escolha é por classe e vale na hora (cena.ts manda o comando).
  const skins = (p: Preferencias): HTMLElement[] => {
    const campoCodigo = el('input');
    campoCodigo.type = 'text';
    campoCodigo.autocomplete = 'off';
    campoCodigo.spellcheck = false;
    campoCodigo.maxLength = 40;
    campoCodigo.dataset.config = 'codigoSkin';
    const situacao = el('p', 'dica-config');
    situacao.setAttribute('role', 'status');
    situacao.dataset.config = 'situacaoSkin';
    const ativar = el('button', 'botao-config', t('config.skinsAtivar'));
    ativar.type = 'button';
    ativar.dataset.config = 'ativarSkin';
    const resgatar = () => {
      const s = skinDoCodigo(campoCodigo.value);
      if (!s) {
        situacao.dataset.resultado = 'invalido';
        situacao.textContent = t('config.skinsInvalido');
        return;
      }
      const atual = lerPreferencias();
      const jaTinha = atual.skinsLiberadas.includes(s.id);
      if (!jaTinha) mudar({ skinsLiberadas: [...atual.skinsLiberadas, s.id] });
      desenhar();
      const nova = corpoSituacao();
      nova.dataset.resultado = jaTinha ? 'repetido' : 'ok';
      nova.textContent = jaTinha ? t('config.skinsJaTem', { nome: s.nome }) : t('config.skinsOk', { nome: s.nome, classe: s.classeNome });
    };
    // O desenho refaz o corpo do modal: a mensagem vai na linha nova.
    const corpoSituacao = (): HTMLElement => modal.corpo.querySelector<HTMLElement>('[data-config="situacaoSkin"]') ?? situacao;
    ativar.addEventListener('click', resgatar);
    campoCodigo.addEventListener('keydown', (ev) => {
      if (ev.key !== 'Enter') return;
      ev.preventDefault();
      resgatar();
    });
    const linhas: HTMLElement[] = [el('p', 'dica-config', t('config.skinsDica')), campo(t('config.skinsCodigo'), campoCodigo), ativar, situacao];
    const liberadas = SKINS.filter((s) => p.skinsLiberadas.includes(s.id));
    if (liberadas.length === 0) linhas.push(el('p', 'dica-config', t('config.skinsNenhuma')));
    for (const classe of new Set(liberadas.map((s) => s.classe))) {
      const doClasse = liberadas.filter((s) => s.classe === classe);
      const seletor = el('select');
      seletor.dataset.config = `skin-${classe}`;
      const padrao = el('option', undefined, t('config.skinsPadrao'));
      padrao.value = '';
      seletor.append(padrao);
      for (const s of doClasse) {
        const op = el('option', undefined, s.nome);
        op.value = s.id;
        op.selected = p.skinsEscolhidas[classe] === s.id;
        seletor.append(op);
      }
      seletor.addEventListener('change', () => {
        // sem a entrada da classe quando volta ao equipamento
        const resto = Object.fromEntries(Object.entries(lerPreferencias().skinsEscolhidas).filter(([c]) => c !== classe));
        if (seletor.value) resto[classe] = seletor.value;
        mudar({ skinsEscolhidas: resto });
      });
      linhas.push(campo(t('config.skinsDe', { classe: doClasse[0]?.classeNome ?? classe }), seletor));
    }
    return linhas;
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
