// Modal acessível (marco 6, 13/10/2026) sobre o `<dialog>` nativo: `showModal()` prende o foco,
// deixa o resto da página inerte (canvas e controles de toque não recebem toques), fecha com Esc e
// devolve o foco a quem abriu. A simulação continua rodando (D-040); quem abre bloqueia a entrada.

import { icone } from './icones';

export interface Modal {
  dialogo: HTMLDialogElement;
  corpo: HTMLDivElement;
  abrir: () => void;
  fechar: () => void;
  aberto: () => boolean;
}

export interface OpcoesModal {
  titulo: string;
  rotuloFechar: string;
  classe?: string;
  aoAbrir?: () => void;
  aoFechar?: () => void;
}

let proximoId = 1;

export function criarModal(o: OpcoesModal): Modal {
  const dialogo = document.createElement('dialog');
  dialogo.className = `modal ${o.classe ?? ''}`.trim();
  const idTitulo = `modal-titulo-${proximoId++}`;
  dialogo.setAttribute('aria-labelledby', idTitulo);

  const topo = document.createElement('header');
  topo.className = 'modal-topo';
  const titulo = document.createElement('h2');
  titulo.id = idTitulo;
  titulo.textContent = o.titulo;
  const fechar = document.createElement('button');
  fechar.type = 'button';
  fechar.className = 'botao-cabecalho modal-fechar';
  fechar.append(icone('fechar'));
  fechar.setAttribute('aria-label', o.rotuloFechar);
  // 17/10/2026: avisa antes do próximo quadro; o evento nativo close é assíncrono e a loja
  // podia reabrir antes de registrar que a janela foi fechada pelo jogador.
  let notificado = true;
  const notificar = () => {
    if (notificado) return;
    notificado = true;
    o.aoFechar?.();
  };
  const fecharModal = () => {
    if (!dialogo.open) return;
    dialogo.close();
    notificar();
  };
  fechar.addEventListener('click', fecharModal);
  topo.append(titulo, fechar);

  const corpo = document.createElement('div');
  corpo.className = 'modal-corpo';
  dialogo.append(topo, corpo);
  // Fora da camada de interface, que não recebe ponteiro (pointer-events: none é herdado).
  document.body.append(dialogo);

  // Toque no fundo escurecido fecha.
  dialogo.addEventListener('click', (ev) => {
    if (ev.target === dialogo) fecharModal();
  });
  dialogo.addEventListener('close', () => { if (!dialogo.open) notificar(); });
  dialogo.addEventListener('cancel', (ev) => { ev.preventDefault(); fecharModal(); });

  return {
    dialogo,
    corpo,
    abrir: () => {
      if (dialogo.open) return;
      notificado = false;
      dialogo.showModal();
      o.aoAbrir?.();
    },
    fechar: fecharModal,
    aberto: () => dialogo.open,
  };
}
