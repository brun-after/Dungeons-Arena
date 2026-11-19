// 19/11/2026 (D-187): o nome da tecla de cada ação, como as Configurações a deixaram, para os rótulos do HUD.

import { t } from '../i18n';
import { nomeCurtoDaTecla, type AcaoTeclado } from '../input/atalhos';
import { lerPreferencias } from '../plataforma/preferencias';

/** O nome para mostrar de uma tecla (o Espaço e o Enter pelo dicionário); vazio sem tecla. */
export function nomeDaTecla(codigo: string | null): string {
  if (codigo === null) return '';
  if (codigo === 'Space') return t('tecla.espaco');
  if (codigo === 'Enter') return t('tecla.enter');
  return nomeCurtoDaTecla(codigo);
}

/** O nome da tecla da ação agora (vazio quando ela ficou sem tecla). */
export function teclaDaAcao(acao: AcaoTeclado | null): string {
  return acao ? nomeDaTecla(lerPreferencias().atalhos[acao]) : '';
}
