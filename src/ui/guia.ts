// Guia do jogador (§2.15). Marco 12 (14/10/2026). Seções curtas, com os textos no dicionário (§5.5).

import { t, type ChaveTexto } from '../i18n';
import { criarModal, type Modal } from './modal';

// Marco 11A: a seção do editor (aventuras, ferramentas e tileset). Marco 22 (23/10/2026): a identidade das classes.
// Marco 23 (24/10/2026): os temas, o clima e os inimigos afins.
const SECOES = ['controles', 'combate', 'atributos', 'habilidades', 'classes', 'temas', 'itens', 'descobertas', 'vida', 'portas', 'ambiente', 'invocacoes', 'arena', 'editor'] as const;

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
