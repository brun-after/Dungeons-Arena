// Quadro do alvo (ajuste de 15/10/2026, D-065): nome, nível, vida e o cadeado quando travado, no alto da tela.
// Some sem alvo. Só reescreve o DOM quando algo muda; o leitor de tela ouve a troca de alvo e a trava, não cada dano.

import type { Entidade } from '../entities/entidade';
import { t } from '../i18n';
import { classeDoHp } from './hud';

export class QuadroAlvo {
  readonly elemento = document.createElement('div');
  private readonly nome = document.createElement('span');
  private readonly cadeado = document.createElement('span');
  private readonly vida = document.createElement('div');
  private readonly preenchimento = document.createElement('div');
  /** Texto anunciado (alvo e trava); muda só quando um dos dois muda. */
  private readonly anuncio = document.createElement('span');
  private ultimo = '';

  constructor() {
    this.elemento.className = 'quadro-alvo';
    this.elemento.hidden = true;
    this.nome.className = 'nome-alvo';
    this.cadeado.className = 'cadeado-alvo';
    this.cadeado.textContent = '🔒';
    this.cadeado.setAttribute('aria-hidden', 'true');
    this.vida.className = 'barra vida';
    this.vida.setAttribute('aria-hidden', 'true');
    this.preenchimento.className = 'preenchimento';
    this.vida.append(this.preenchimento);
    this.anuncio.className = 'so-leitor';
    this.anuncio.setAttribute('aria-live', 'polite');
    this.elemento.append(this.cadeado, this.nome, this.vida, this.anuncio);
  }

  atualizar(jogador: Entidade | undefined, alvo: Entidade | undefined): void {
    const visivel = !!jogador && !!alvo && !alvo.morto;
    const travado = visivel && jogador.alvoTravado;
    const chave = visivel ? `${alvo.id}/${alvo.hp}/${alvo.hpMax}/${alvo.nivel}/${travado}` : '';
    if (chave === this.ultimo) return;
    const anterior = this.ultimo.split('/');
    this.ultimo = chave;
    this.elemento.hidden = !visivel;
    this.elemento.dataset.travado = String(travado);
    if (!visivel) return;
    const texto = t('hud.alvo', { nome: alvo.nome, nivel: alvo.nivel });
    this.nome.textContent = texto;
    this.cadeado.hidden = !travado;
    const fracao = alvo.hp / Math.max(1, alvo.hpMax);
    this.preenchimento.style.width = `${fracao * 100}%`;
    this.vida.dataset.faixa = classeDoHp(fracao);
    if (anterior[0] !== alvo.id || anterior[4] !== String(travado)) {
      this.anuncio.textContent = travado ? t('hud.alvoTravado', { nome: alvo.nome }) : texto;
    }
  }
}
