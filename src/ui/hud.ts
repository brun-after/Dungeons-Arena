// HUD do jogador (§2.15): barras de vida e mana com cor por faixa, último d20 (ignorável),
// registro de combate com aria-live e aviso de morte. Só reescreve o DOM quando o valor muda.

import { t } from '../i18n';
import type { Entidade } from '../entities/entidade';

const MAX_LINHAS_LOG = 6;

export function classeDoHp(fracao: number): 'alto' | 'medio' | 'baixo' {
  if (fracao > 0.5) return 'alto';
  if (fracao > 0.25) return 'medio';
  return 'baixo';
}

function barra(classe: string): { raiz: HTMLDivElement; preenchimento: HTMLDivElement } {
  const raiz = document.createElement('div');
  raiz.className = `barra ${classe}`;
  raiz.setAttribute('role', 'meter');
  raiz.setAttribute('aria-valuemin', '0');
  const preenchimento = document.createElement('div');
  preenchimento.className = 'preenchimento';
  raiz.append(preenchimento);
  return { raiz, preenchimento };
}

export class Hud {
  readonly status: HTMLElement;
  readonly log: HTMLElement;
  readonly botaoLog: HTMLButtonElement;
  private readonly morte: HTMLElement;
  private readonly vida = barra('vida');
  private readonly mana = barra('mana');
  private readonly numeros = document.createElement('span');
  private readonly d20 = document.createElement('span');
  private ultimo = '';

  constructor(raiz: HTMLElement) {
    this.status = document.createElement('div');
    this.status.className = 'status-jogador';
    this.numeros.className = 'numeros-vida';
    this.d20.className = 'chip-d20';
    this.d20.hidden = true;
    const barras = document.createElement('div');
    barras.className = 'barras';
    barras.append(this.vida.raiz, this.mana.raiz);
    this.status.append(barras, this.numeros, this.d20);

    this.log = document.createElement('ol');
    this.log.className = 'log-combate';
    this.log.setAttribute('aria-live', 'polite');
    this.log.setAttribute('aria-label', t('hud.log'));

    this.botaoLog = document.createElement('button');
    this.botaoLog.type = 'button';
    this.botaoLog.className = 'botao-cabecalho so-toque';
    this.botaoLog.textContent = '📜';
    this.botaoLog.setAttribute('aria-label', t('hud.abrirLog'));
    this.botaoLog.setAttribute('aria-expanded', 'false');
    this.botaoLog.addEventListener('click', () => {
      const aberto = this.log.classList.toggle('aberto');
      this.botaoLog.setAttribute('aria-expanded', String(aberto));
    });

    this.morte = document.createElement('div');
    this.morte.className = 'aviso-morte';
    this.morte.setAttribute('role', 'alert');
    this.morte.hidden = true;
    const titulo = document.createElement('strong');
    titulo.textContent = t('morte.titulo');
    const detalhe = document.createElement('span');
    detalhe.textContent = t('morte.reviver');
    this.morte.append(titulo, detalhe);

    raiz.append(this.log, this.morte);
  }

  atualizar(jogador: Entidade | undefined): void {
    if (!jogador) return;
    const chave = `${jogador.hp}/${jogador.hpMax}/${jogador.mana}/${jogador.manaMax}/${jogador.morto}`;
    if (chave === this.ultimo) return;
    this.ultimo = chave;
    const fracaoVida = jogador.hp / Math.max(1, jogador.hpMax);
    this.vida.preenchimento.style.width = `${fracaoVida * 100}%`;
    this.vida.raiz.dataset.faixa = classeDoHp(fracaoVida);
    this.vida.raiz.setAttribute('aria-valuemax', String(jogador.hpMax));
    this.vida.raiz.setAttribute('aria-valuenow', String(jogador.hp));
    this.vida.raiz.setAttribute('aria-label', t('hud.vida', { atual: jogador.hp, maximo: jogador.hpMax }));
    this.mana.preenchimento.style.width = `${(jogador.mana / Math.max(1, jogador.manaMax)) * 100}%`;
    this.mana.raiz.setAttribute('aria-valuemax', String(jogador.manaMax));
    this.mana.raiz.setAttribute('aria-valuenow', String(jogador.mana));
    this.mana.raiz.setAttribute('aria-label', t('hud.mana', { atual: jogador.mana, maximo: jogador.manaMax }));
    this.numeros.textContent = `${jogador.hp}/${jogador.hpMax}`;
    this.morte.hidden = !jogador.morto;
  }

  mostrarD20(valor: number): void {
    this.d20.hidden = false;
    this.d20.textContent = `d20 ${valor}`;
    this.d20.setAttribute('aria-label', t('hud.d20', { valor }));
    this.d20.dataset.faixa = valor <= 3 ? 'falha' : valor >= 16 ? 'critico' : 'normal';
  }

  registrar(texto: string): void {
    const linha = document.createElement('li');
    linha.textContent = texto;
    this.log.append(linha);
    while (this.log.children.length > MAX_LINHAS_LOG) this.log.firstElementChild?.remove();
  }
}
