// Cabeçalho (§2.15): nome da fase e atalhos de configuração. O menu de pausa, o inventário
// e as barras de HP entram com os sistemas correspondentes.

import { t } from '../i18n';
import type { ModoCamera, TipoControle } from '../plataforma/preferencias';

export interface OpcoesCabecalho {
  nomeFase: string;
  controle: TipoControle;
  camera: ModoCamera;
  aoTrocarControle: () => TipoControle;
  aoTrocarCamera: () => ModoCamera;
}

function botao(rotulo: string, aria: string, aoClicar: () => string): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'botao-cabecalho';
  b.textContent = rotulo;
  b.setAttribute('aria-label', aria);
  b.addEventListener('click', () => {
    b.textContent = aoClicar();
  });
  return b;
}

const rotuloControle = (c: TipoControle) => t(c === 'dpad' ? 'cabecalho.controleDpad' : 'cabecalho.controleJoystick');
const rotuloCamera = (m: ModoCamera) => t(m === 'centralizada' ? 'cabecalho.cameraCentralizada' : 'cabecalho.cameraJanela');

export function criarCabecalho(opcoes: OpcoesCabecalho): HTMLElement {
  const cabecalho = document.createElement('header');
  cabecalho.className = 'cabecalho';
  const titulo = document.createElement('h1');
  titulo.textContent = opcoes.nomeFase;

  const acoes = document.createElement('div');
  acoes.className = 'acoes-cabecalho';
  const trocarControle = botao(rotuloControle(opcoes.controle), t('cabecalho.trocarControle'), () =>
    rotuloControle(opcoes.aoTrocarControle()),
  );
  trocarControle.classList.add('so-toque');
  acoes.append(
    trocarControle,
    botao(rotuloCamera(opcoes.camera), t('cabecalho.trocarCamera'), () => rotuloCamera(opcoes.aoTrocarCamera())),
  );
  cabecalho.append(titulo, acoes);
  return cabecalho;
}
