// Buffs pendentes no HUD (ajuste de 16/10/2026, D-067): os ofensivos armados (ícone do efeito, relógio e os
// segundos que faltam para entrar em combate) e a carga de refúgio (escudo prateado). Ficam ao lado dos chips de
// efeito; só reescreve o DOM quando algo muda.

import { REGISTRO_EFEITOS } from '../combat/registro-efeitos';
import { DT_MS } from '../core/loop';
import type { Entidade } from '../entities/entidade';
import { t } from '../i18n';
import { icone } from './icones';
import { relogio } from './tempo';

export class BuffsPendentes {
  readonly elemento = document.createElement('span');
  private ultimo = '';

  constructor(
    /** Marco 18: nome e ícone de uma habilidade (para o chip do estudo). */
    private readonly nomeDe: (id: string) => string = (id) => id,
    private readonly iconeDe: (id: string) => string = () => 'livro',
  ) {
    this.elemento.className = 'buffs-pendentes';
  }

  atualizar(e: Entidade | undefined, tick: number): void {
    if (!e) return;
    const armados = e.buffsArmados.map((b) => ({ tipo: b.efeito.tipo, s: Math.max(0, Math.ceil(((b.ateTick - tick) * DT_MS) / 1000)) }));
    const estudo = e.bolsa?.estudo ?? null;
    const restante = estudo ? relogio(estudo.restanteTicks * DT_MS) : '';
    const chave = `${armados.map((a) => `${a.tipo}:${a.s}`).join(',')}|${e.refugio}|${estudo?.id ?? ''}:${restante}`;
    if (chave === this.ultimo) return;
    this.ultimo = chave;
    this.elemento.textContent = '';
    for (const a of armados) {
      const d = REGISTRO_EFEITOS[a.tipo];
      const chip = document.createElement('span');
      chip.className = 'chip-pendente armado';
      chip.style.setProperty('--cor', d.cor);
      chip.dataset.armado = a.tipo;
      chip.title = t('hud.buffArmado', { s: a.s });
      chip.setAttribute('role', 'img');
      chip.setAttribute('aria-label', t('hud.buffArmado', { s: a.s }));
      const s = document.createElement('span');
      s.className = 'restante';
      s.textContent = String(a.s);
      chip.append(icone(d.icone), icone('armado', 'icone mini'), s);
      this.elemento.append(chip);
    }
    // Marco 18 (D-068): o estudo em andamento, com o relógio.
    if (estudo) {
      const chip = document.createElement('span');
      chip.className = 'chip-pendente estudo';
      chip.dataset.estudo = estudo.id;
      const nome = this.nomeDe(estudo.id);
      chip.title = t('habilidades.estudoNoHud', { nome, tempo: restante });
      chip.setAttribute('role', 'img');
      chip.setAttribute('aria-label', chip.title);
      const s = document.createElement('span');
      s.className = 'restante';
      s.textContent = restante;
      chip.append(icone(this.iconeDe(estudo.id)), icone('livro', 'icone mini'), s);
      this.elemento.append(chip);
    }
    if (e.refugio) {
      const chip = document.createElement('span');
      chip.className = 'chip-pendente refugio';
      chip.dataset.refugio = 'sim';
      chip.title = t('hud.refugio');
      chip.setAttribute('role', 'img');
      chip.setAttribute('aria-label', t('hud.refugio'));
      chip.append(icone('refugio'));
      this.elemento.append(chip);
    }
  }
}
