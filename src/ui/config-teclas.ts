// 19/11/2026 (D-187): a seção das teclas nas Configurações. Cada ação tem um botão com a tecla dela; clicar espera a
// próxima tecla (Esc cancela, Backspace tira a tecla). A tecla que já era de outra ação troca com esta. Os direcionais
// e o Tab não entram. Cada mudança vale na hora e é gravada (quem chama passa `mudar`).

import { t, type ChaveTexto } from '../i18n';
import { ACOES_DO_TECLADO, ACOES_OBRIGATORIAS, definirTecla, normalizarCodigo, TECLAS_PADRAO, teclaPermitida, type AcaoTeclado, type MapaTeclas } from '../input/atalhos';
import { nomeDaTecla } from './nome-tecla';

export interface OpcoesSecaoTeclas {
  atual: () => Readonly<MapaTeclas>;
  mudar: (mapa: MapaTeclas) => void;
}

const nomeDaAcao = (acao: AcaoTeclado): string => t(`acaoTecla.${acao}` as ChaveTexto);

/** As linhas da seção (a dica, uma linha por ação, o aviso e o botão de voltar ao padrão). */
export function linhasDasTeclas(o: OpcoesSecaoTeclas): HTMLElement[] {
  const dica = document.createElement('p');
  dica.className = 'dica-config';
  dica.textContent = t('config.atalhosDica');
  const aviso = document.createElement('p');
  aviso.className = 'dica-config aviso-teclas';
  aviso.setAttribute('role', 'status');
  aviso.dataset.config = 'avisoTeclas';

  const botoes = new Map<AcaoTeclado, HTMLButtonElement>();
  /** A captura em curso (a ação e quem desliga a escuta). */
  let esperando: { acao: AcaoTeclado; parar: () => void } | null = null;

  const pintar = () => {
    const mapa = o.atual();
    for (const [acao, b] of botoes) {
      const tecla = mapa[acao];
      const nome = tecla ? nomeDaTecla(tecla) : t('config.atalhosSemTecla');
      b.textContent = esperando?.acao === acao ? t('config.atalhosAperte') : nome;
      b.dataset.tecla = tecla ?? '';
      b.dataset.esperando = String(esperando?.acao === acao);
      b.setAttribute('aria-label', t('config.atalhosBotao', { acao: nomeDaAcao(acao), tecla: nome }));
    }
  };

  const avisar = (texto: string) => { aviso.textContent = texto; };

  const aplicar = (acao: AcaoTeclado, codigo: string | null) => {
    const antes = o.atual();
    if (codigo === null && ACOES_OBRIGATORIAS.has(acao)) {
      avisar(t('config.atalhosObrigatoria', { acao: nomeDaAcao(acao) }));
      return;
    }
    const depois = definirTecla(antes, acao, codigo);
    const tecla = codigo === null ? null : normalizarCodigo(codigo);
    const outra = tecla === null ? undefined : ACOES_DO_TECLADO.find((a) => a !== acao && antes[a] === tecla);
    if (outra && depois[outra] === antes[outra]) {
      // A troca não aconteceu (a outra é obrigatória e esta não tinha tecla para dar).
      avisar(t('config.atalhosObrigatoria', { acao: nomeDaAcao(outra) }));
      return;
    }
    o.mudar(depois);
    if (outra && tecla) {
      const antiga = depois[outra];
      avisar(antiga
        ? t('config.atalhosTrocou', { tecla: nomeDaTecla(tecla), outra: nomeDaAcao(outra), antiga: nomeDaTecla(antiga) })
        : t('config.atalhosTrocouVazio', { tecla: nomeDaTecla(tecla), outra: nomeDaAcao(outra) }));
    } else if (tecla === 'ControlLeft') {
      avisar(t('config.atalhosCtrl'));
    } else {
      avisar('');
    }
  };

  const parar = () => {
    esperando?.parar();
    esperando = null;
    pintar();
  };

  const esperar = (acao: AcaoTeclado) => {
    parar();
    const aoTecla = (ev: KeyboardEvent) => {
      // As Configurações fecharam (ou foram redesenhadas) no meio da captura: a tecla segue o caminho normal.
      const botao = botoes.get(acao);
      if (!botao?.isConnected || botao.closest('dialog')?.open === false) {
        parar();
        return;
      }
      // A tecla é desta captura: não fecha o diálogo (Esc), não navega (Tab) nem chega ao jogo.
      ev.preventDefault();
      ev.stopImmediatePropagation();
      if (ev.repeat) return;
      if (ev.code === 'Escape') {
        parar();
        return;
      }
      if (ev.code === 'Backspace' || ev.code === 'Delete') {
        parar();
        aplicar(acao, null);
        pintar();
        return;
      }
      if (!teclaPermitida(ev.code)) {
        avisar(t('config.atalhosReservada'));
        return;
      }
      parar();
      aplicar(acao, ev.code);
      pintar();
    };
    // Clicar fora (ou em outro botão) também cancela.
    const aoClicar = (ev: PointerEvent) => {
      if (ev.target !== botoes.get(acao)) parar();
    };
    document.addEventListener('keydown', aoTecla, true);
    document.addEventListener('pointerdown', aoClicar, true);
    esperando = {
      acao,
      parar: () => {
        document.removeEventListener('keydown', aoTecla, true);
        document.removeEventListener('pointerdown', aoClicar, true);
      },
    };
    avisar('');
    pintar();
  };

  const linhas = ACOES_DO_TECLADO.map((acao) => {
    const linha = document.createElement('div');
    linha.className = 'linha-config linha-tecla';
    const rotulo = document.createElement('span');
    rotulo.textContent = nomeDaAcao(acao);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'botao-config botao-tecla';
    b.dataset.config = `tecla-${acao}`;
    b.addEventListener('click', () => {
      if (esperando?.acao === acao) parar();
      else esperar(acao);
    });
    botoes.set(acao, b);
    linha.append(rotulo, b);
    return linha;
  });

  const restaurar = document.createElement('button');
  restaurar.type = 'button';
  restaurar.className = 'botao-config';
  restaurar.dataset.config = 'restaurarTeclas';
  restaurar.textContent = t('config.atalhosRestaurar');
  restaurar.addEventListener('click', () => {
    parar();
    o.mudar({ ...TECLAS_PADRAO });
    avisar(t('config.atalhosRestaurado'));
    pintar();
  });

  pintar();
  return [dica, ...linhas, aviso, restaurar];
}
