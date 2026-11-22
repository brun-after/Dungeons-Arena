// O aviso de controle de grupo (marco 53, 22/11/2026, D-203). Quando um inimigo prende o jogador (atordoado, congelado,
// enraizado, petrificado, confuso, aterrorizado, adormecido, silenciado...), aparece no alto do centro da tela um selo
// grande com o ícone, o nome do estado, o que ele impede e os segundos que faltam; a borda da tela pulsa na cor dele.
// Antes, só o chip pequeno do HUD mostrava, e o jogador não entendia por que travou. Vale qualquer efeito negativo
// que bloqueie o movimento ou as ações (registro-efeitos.ts), sem lista à mão.

import { REGISTRO_EFEITOS } from '../combat/registro-efeitos';
import { DT_MS } from '../core/loop';
import type { Entidade } from '../entities/entidade';
import { t } from '../i18n';
import { nomeDoEfeito } from './descrever';
import { icone } from './icones';

export class AlertaDeControle {
  readonly elemento = document.createElement('div');
  private readonly borda = document.createElement('div');
  private readonly nome = document.createElement('strong');
  private readonly detalhe = document.createElement('span');
  private readonly simbolo = document.createElement('span');
  private ultimo = '';

  constructor(raiz: HTMLElement) {
    this.elemento.className = 'alerta-controle';
    this.elemento.setAttribute('role', 'alert');
    this.elemento.hidden = true;
    this.simbolo.className = 'alerta-controle-icone';
    const textos = document.createElement('span');
    textos.className = 'alerta-controle-textos';
    textos.append(this.nome, this.detalhe);
    this.elemento.append(this.simbolo, textos);
    this.borda.className = 'borda-controle';
    this.borda.hidden = true;
    raiz.append(this.borda, this.elemento);
  }

  atualizar(jogador: Entidade, tick: number): void {
    let pior: { tipo: Entidade['efeitos'][number]['tipo']; ateTick: number; bloqueia: 'tudo' | 'andar' | 'agir' } | null = null;
    if (!jogador.morto) {
      for (const f of jogador.efeitos) {
        if (f.ateTick <= tick) continue;
        const d = REGISTRO_EFEITOS[f.tipo];
        if (d.positivo) continue;
        const age = d.bloqueiaAcoes !== 'nenhuma';
        if (!d.bloqueiaMovimento && !age) continue;
        const bloqueia = d.bloqueiaMovimento && d.bloqueiaAcoes === 'todas' ? 'tudo' : d.bloqueiaMovimento ? 'andar' : 'agir';
        // O que trava mais vem primeiro; empatado, o que dura mais.
        const peso = (b: string) => (b === 'tudo' ? 2 : 1);
        if (!pior || peso(bloqueia) > peso(pior.bloqueia) || (peso(bloqueia) === peso(pior.bloqueia) && f.ateTick > pior.ateTick)) pior = { tipo: f.tipo, ateTick: f.ateTick, bloqueia };
      }
    }
    const s = pior ? Math.max(0.1, ((pior.ateTick - tick) * DT_MS) / 1000) : 0;
    const chave = pior ? `${pior.tipo}/${s.toFixed(1)}` : '';
    if (chave === this.ultimo) return;
    const mudouEstado = !pior || !this.ultimo.startsWith(`${pior.tipo}/`);
    this.ultimo = chave;
    this.elemento.hidden = !pior;
    this.borda.hidden = !pior;
    if (!pior) return;
    const d = REGISTRO_EFEITOS[pior.tipo];
    if (mudouEstado) {
      this.simbolo.replaceChildren(icone(d.icone, 'icone grande'));
      this.elemento.style.setProperty('--cor-controle', d.cor);
      this.borda.style.setProperty('--cor-controle', d.cor);
      this.nome.textContent = nomeDoEfeito(pior.tipo).toLocaleUpperCase('pt-BR');
    }
    this.detalhe.textContent = t(`controle.${pior.bloqueia}`, { s: s.toFixed(1).replace('.', ',') });
  }
}
