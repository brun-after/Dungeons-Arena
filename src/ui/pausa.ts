// Pausa (§2.15). Marco 12 (14/10/2026). Diálogo modal com Continuar, Configurações, Guia e as ações da
// sessão (na campanha, "Salvar e sair"). Na campanha, a simulação para enquanto qualquer um destes
// modais estiver aberto; na arena o mesmo menu abre e o mundo segue (a interface não pausa a arena).

import { t, type ChaveTexto } from '../i18n';
import { DIFICULDADES, type Dificuldade } from '../modos/dificuldade';
import type { Preferencias } from '../plataforma/preferencias';
import { criarConfiguracoes } from './configuracoes';
import { criarGuia } from './guia';
import { criarModal } from './modal';
import { icone } from './icones';

export interface AcaoDaPausa {
  rotulo: string;
  fazer: () => void;
}

export interface Pausa {
  botao: HTMLButtonElement;
  abrir: () => void;
  /** Algum modal da pausa está aberto (pausa, configurações ou guia). */
  aberta: () => boolean;
  /** Abre as configurações direto (atalho do cabeçalho no toque). */
  abrirConfiguracoes: () => void;
}

export function criarPausa(o: {
  pausaOJogo: boolean;
  toque: boolean;
  acoes: readonly AcaoDaPausa[];
  aoMudarPreferencias: (p: Preferencias) => void;
  aoMudarEstado: (aberta: boolean) => void;
  /** Marco 15: a dificuldade, quando quem joga pode trocar (campanha solo e anfitrião do grupo). */
  dificuldade?: { atual: () => Dificuldade; definir: (d: Dificuldade) => void } | undefined;
  /** Marco 18 (D-070): a fase e a semente dela (para trocar dicas: "a semente 4F2A tem mercador errante"). */
  fase?: { nome: string; semente: string } | undefined;
}): Pausa {
  let abrirAntes = () => {
    // Sem dificuldade nesta sessão.
  };
  // `modal` é declarado adiante; estas funções só rodam depois de tudo montado.
  const algumAberto = (): boolean => modal.aberto() || config.modal.aberto() || guia.aberto();
  const avisar = () => {
    // O `close` do <dialog> chega depois; o estado é relido no próximo quadro.
    setTimeout(() => {
      o.aoMudarEstado(algumAberto());
    }, 0);
  };

  const config = criarConfiguracoes({ toque: o.toque, aoMudar: o.aoMudarPreferencias, aoFechar: avisar });
  const guia = criarGuia(avisar);
  const modal = criarModal({
    titulo: t(o.pausaOJogo ? 'pausa.titulo' : 'pausa.tituloArena'),
    rotuloFechar: t('pausa.fechar'),
    classe: 'pausa',
    aoAbrir: () => {
      o.aoMudarEstado(true);
      modal.corpo.querySelector<HTMLButtonElement>('button')?.focus();
    },
    aoFechar: avisar,
  });

  const botaoMenu = (rotulo: string, fazer: () => void, chave: string) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'botao-menu';
    b.textContent = rotulo;
    b.dataset.chave = chave;
    b.addEventListener('click', fazer);
    return b;
  };
  const lista = document.createElement('div');
  lista.className = 'lista-pausa';
  lista.append(
    botaoMenu(t('pausa.continuar'), () => { modal.fechar(); }, 'continuar'),
    botaoMenu(t('pausa.configuracoes'), () => {
      modal.fechar();
      config.abrir();
    }, 'configuracoes'),
    botaoMenu(t('pausa.guia'), () => {
      modal.fechar();
      guia.abrir();
    }, 'guia'),
    ...o.acoes.map((a, i) => botaoMenu(a.rotulo, a.fazer, `acao-${i}`)),
  );
  modal.corpo.append(lista);
  if (o.fase) {
    const linha = document.createElement('p');
    linha.className = 'semente-fase';
    linha.textContent = t('pausa.semente', { fase: o.fase.nome, semente: o.fase.semente });
    modal.corpo.append(linha);
  }
  // Marco 15: trocar a dificuldade a qualquer momento (o personagem continua o mesmo).
  const dif = o.dificuldade;
  if (dif) {
    const linha = document.createElement('label');
    linha.className = 'linha-config linha-dificuldade';
    linha.textContent = t('dificuldade.rotulo');
    const escolha = document.createElement('select');
    escolha.dataset.chave = 'dificuldade';
    for (const d of DIFICULDADES) {
      const op = document.createElement('option');
      op.value = d;
      op.textContent = t(`dificuldade.${d}` as ChaveTexto);
      escolha.append(op);
    }
    escolha.addEventListener('change', () => {
      const valor = DIFICULDADES.find((d) => d === escolha.value);
      if (valor) dif.definir(valor);
    });
    linha.append(escolha);
    modal.corpo.append(linha);
    const sincronizar = () => {
      escolha.value = dif.atual();
    };
    modal.dialogo.addEventListener('toggle', sincronizar);
    sincronizar();
    abrirAntes = sincronizar;
  }

  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'botao-cabecalho botao-pausa';
  botao.append(icone('pausa'));
  botao.setAttribute('aria-label', t(o.pausaOJogo ? 'pausa.abrir' : 'pausa.abrirArena'));
  botao.addEventListener('click', () => {
    modal.abrir();
  });

  return {
    botao,
    abrir: () => {
      abrirAntes();
      modal.abrir();
    },
    aberta: algumAberto,
    abrirConfiguracoes: () => {
      config.abrir();
      o.aoMudarEstado(true);
    },
  };
}
