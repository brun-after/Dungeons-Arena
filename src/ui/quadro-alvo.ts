// Quadro do alvo (ajuste de 15/10/2026, D-065): nome, nível, vida e o cadeado quando travado, no alto da tela.
// Marco 23 (24/10/2026, D-092): o alvo afim mostra o que absorve e a que é fraco.
// Some sem alvo. Só reescreve o DOM quando algo muda; o leitor de tela ouve a troca de alvo e a trava, não cada dano.

import type { Entidade } from '../entities/entidade';
import { t } from '../i18n';
import { classeDoHp } from './hud';
import { icone } from './icones';

export class QuadroAlvo {
  readonly elemento = document.createElement('div');
  private readonly nome = document.createElement('span');
  private readonly cadeado = document.createElement('span');
  private readonly vida = document.createElement('div');
  private readonly preenchimento = document.createElement('div');
  /** Texto anunciado (alvo e trava); muda só quando um dos dois muda. */
  private readonly anuncio = document.createElement('span');
  private ultimo = '';
  private readonly afinidade = document.createElement('span');

  constructor(private readonly descreverAfinidade: (alvo: Entidade) => string | null = () => null) {
    this.elemento.className = 'quadro-alvo';
    this.elemento.hidden = true;
    this.nome.className = 'nome-alvo';
    this.cadeado.className = 'cadeado-alvo';
    this.cadeado.append(icone('cadeado'));
    this.cadeado.setAttribute('aria-hidden', 'true');
    this.vida.className = 'barra vida';
    this.vida.setAttribute('aria-hidden', 'true');
    this.preenchimento.className = 'preenchimento';
    this.vida.append(this.preenchimento);
    this.anuncio.className = 'so-leitor';
    this.anuncio.setAttribute('aria-live', 'polite');
    this.afinidade.className = 'afinidade-alvo';
    this.elemento.append(this.cadeado, this.nome, this.vida, this.afinidade, this.anuncio);
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
    const afinidade = this.descreverAfinidade(alvo);
    this.afinidade.hidden = !afinidade;
    this.afinidade.textContent = afinidade ?? '';
    if (alvo.afinidade) this.afinidade.dataset.elemento = alvo.afinidade.elemento;
    this.cadeado.hidden = !travado;
    const fracao = alvo.hp / Math.max(1, alvo.hpMax);
    this.preenchimento.style.width = `${fracao * 100}%`;
    this.vida.dataset.faixa = classeDoHp(fracao);
    if (anterior[0] !== alvo.id || anterior[4] !== String(travado)) {
      this.anuncio.textContent = travado ? t('hud.alvoTravado', { nome: alvo.nome }) : texto;
    }
  }
}
