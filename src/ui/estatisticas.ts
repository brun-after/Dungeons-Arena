// Estatísticas do personagem (15/11/2026): o dano do ataque básico, a velocidade de ataque e a de movimento, como o
// painel do canto de um MOBA. Só para quem joga no computador (no toque a tela é pequena demais). A conta espelha a
// do motor (combat/acao.ts) para o número da tela ser o do jogo, e o painel só mexe no DOM quando um valor muda.

import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { Bolsa, Entidade } from '../entities/entidade';
import { t } from '../i18n';
import { ehBasico, fatorDaVelocidade, recargaDoBasicoPct } from '../combat/basico';
import { faixaDaFormula } from '../combat/dados';
import { bonusAtaqueBasico } from '../combat/efeitos';
import { velocidadeFrenesiPct } from '../combat/furia';
import { habilidadeDoAtor, perfilPara } from '../combat/perfil';
import { multiplicadorDosEstilos, poderBase } from '../combat/poder-base';
import { derivarFicha, type FichaDerivada } from '../progression/derivados';
import { perfilDestreza, reducaoRecargaBasicoPct } from '../progression/efeitos-atributo';
import { efeitosDeEstiloDe, EFEITOS_NEUTROS, radarDe } from '../progression/estilos';
import { fatorDoImpulso, velocidadeAgora } from '../world/movimento';
import { icone } from './icones';

export interface EstatisticasJogador {
  /** O dano do ataque básico (null sem ficha, como na arena). */
  dano: { min: number; max: number } | null;
  /** Ataques por segundo, com a recarga que o motor usa agora (Destreza, estilos, buffs e arma). */
  ataquesPorSegundo: number;
  /** Células por segundo andando agora, sem o arranque (o que o personagem alcança no pico). */
  velocidade: number;
}

/** Marco 39 (D-148): o dano do básico pelo poder base e pelos estilos, com os itens por cima (a faixa que a ficha mostra). */
export function danoDoBasico(ctx: ContextoSimulacao, j: Entidade, bolsa: Bolsa, efetiva: FichaDerivada): { min: number; max: number } | null {
  const basico = habilidadeDoAtor(ctx, j, j.ataqueBasico);
  if (!basico?.formulaDano) return null;
  const faixa = faixaDaFormula(basico.formulaDano);
  const poder = poderBase(j.nivel, ctx.balance, ctx.conteudo.classes.get(bolsa.classeId)?.poderPct);
  const extra = (1 + efetiva.danoPct / 100) * multiplicadorDosEstilos(radarDe(ctx, bolsa, efetiva.atributos, j.nivel)?.efeitos ?? EFEITOS_NEUTROS, basico);
  const bonus = Math.round(poder.bonus * extra);
  return { min: Math.round(faixa.min * poder.multRolagem * extra) + bonus, max: Math.round(faixa.max * poder.multRolagem * extra) + bonus };
}

/** A recarga do básico em ms, como em `usarHabilidade` (acao.ts): o mesmo teto de 75% e a cadência dos estilos. */
function recargaDoBasicoMs(ctx: ContextoSimulacao, j: Entidade, tick: number): number {
  const basico = habilidadeDoAtor(ctx, j, j.ataqueBasico);
  if (!basico || basico.recargaMs <= 0) return 0;
  const reducao = Math.min(
    75,
    bonusAtaqueBasico(j, tick).recargaPct + reducaoRecargaBasicoPct(j.atributos, ctx.balance, perfilDestreza(ctx, j)) * fatorDaVelocidade(ctx, j) + velocidadeFrenesiPct(ctx, j, tick),
  );
  const cadencia = ehBasico(j, basico.id) ? 1 + efeitosDeEstiloDe(ctx, j).cadencia : 1;
  return (basico.recargaMs * (1 - reducao / 100) * (1 + perfilPara(ctx, j, basico).recargaPct / 100) * (1 + recargaDoBasicoPct(ctx, j, basico) / 100)) / cadencia;
}

export function estatisticasDoJogador(ctx: ContextoSimulacao, j: Entidade, estado: EstadoJogo): EstatisticasJogador {
  const ms = recargaDoBasicoMs(ctx, j, estado.tick);
  return {
    dano: j.bolsa ? danoDoBasico(ctx, j, j.bolsa, derivarFicha(j.bolsa, j.nivel, ctx)) : null,
    ataquesPorSegundo: ms > 0 ? 1000 / ms : 0,
    velocidade: velocidadeAgora(j, estado, ctx) / Math.max(0.01, fatorDoImpulso(j, ctx)),
  };
}

const virgula = (n: number, casas: number): string => n.toFixed(casas).replace('.', ',');

/** O painel (um `<ul>` de três linhas); `atualizar` reescreve só o que mudou. */
export function criarPainelEstatisticas(classe = 'painel-estatisticas'): { elemento: HTMLUListElement; atualizar: (s: EstatisticasJogador | null) => void } {
  const raiz = document.createElement('ul');
  raiz.className = classe;
  raiz.setAttribute('aria-label', t('estatisticas.titulo'));
  const linha = (iconeId: string, chave: 'dano' | 'ataque' | 'movimento', dica: string) => {
    const li = document.createElement('li');
    li.dataset.estatistica = chave;
    li.title = dica;
    const valor = document.createElement('span');
    valor.className = 'valor-estatistica';
    li.append(icone(iconeId), valor);
    raiz.append(li);
    return valor;
  };
  const dano = linha('espada', 'dano', t('estatisticas.danoDica'));
  const ataque = linha('investida', 'ataque', t('estatisticas.ataqueDica'));
  const movimento = linha('botas', 'movimento', t('estatisticas.movimentoDica'));
  const definir = (e: HTMLElement, texto: string) => {
    if (e.textContent !== texto) e.textContent = texto;
  };
  return {
    elemento: raiz,
    atualizar: (s) => {
      raiz.hidden = !s;
      if (!s) return;
      definir(dano, s.dano ? (s.dano.min === s.dano.max ? String(s.dano.max) : `${s.dano.min}–${s.dano.max}`) : '—');
      definir(ataque, t('estatisticas.ataque', { v: virgula(s.ataquesPorSegundo, 2) }));
      definir(movimento, t('estatisticas.movimento', { v: virgula(s.velocidade, 1) }));
    },
  };
}
