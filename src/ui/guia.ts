// Guia do jogador (§2.15). Marco 12 (14/10/2026). Seções curtas, com os textos no dicionário (§5.5).

import { t, type ChaveTexto } from '../i18n';
import { criarModal, type Modal } from './modal';

const SECOES = ['controles', 'combate', 'itens', 'descanso', 'portas', 'invocacoes', 'arena'] as const;

export function criarGuia(aoFechar?: () => void): Modal {
  const modal = criarModal({ titulo: t('guia.titulo'), rotuloFechar: t('guia.fechar'), classe: 'guia', ...(aoFechar && { aoFechar }) });
  for (const s of SECOES) {
    const h = document.createElement('h3');
    h.className = 'subtitulo-modal';
    h.textContent = t(`guia.${s}.titulo` as ChaveTexto);
    const p = document.createElement('p');
    p.className = 'texto-guia';
    p.textContent = t(`guia.${s}.texto` as ChaveTexto);
    modal.corpo.append(h, p);
  }
  return modal;
}
