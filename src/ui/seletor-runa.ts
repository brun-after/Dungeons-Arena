// O encaixe de runa na carta da skill (marco 39, 12/11/2026, D-151). Mostra a runa que vale agora, a parte elemental
// dela e as outras que o vínculo libera; trocar emite `escolherRuna` (a simulação confere). Textos por textContent.

import type { Comando } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import type { Entidade } from '../entities/entidade';
import { t, type ChaveTexto } from '../i18n';
import { fracaoElemental, levaRuna, runaDoAtor, runaPadraoDaSkill, runasDisponiveis } from '../combat/runas';
import { vinculoDe } from '../progression/vinculo';

const nomeDaRuna = (p: string) => (p === 'fisico' ? t('vinculo.fisico') : t(`elemento.${p}` as ChaveTexto));

export function seletorDeRuna(ctx: ContextoSimulacao, j: Entidade, id: string, tick: number, emitir: (cmd: Comando) => void, redesenhar: () => void): HTMLElement | null {
  const bolsa = j.bolsa;
  const atual = runaDoAtor(ctx, j, id, tick);
  if (!bolsa || !atual || !levaRuna(ctx, id)) return null;
  const r = ctx.balance.habilidades.runas;
  const v = vinculoDe(ctx, j, tick);
  const padrao = runaPadraoDaSkill(ctx, bolsa, id);
  const caixa = document.createElement('label');
  caixa.className = 'encaixe-runa';
  caixa.dataset.runa = atual.runa;
  const rotulo = document.createElement('span');
  rotulo.className = 'detalhe-item';
  rotulo.textContent = t('runa.encaixe');
  const select = document.createElement('select');
  select.className = 'seletor-runa';
  for (const p of runasDisponiveis(ctx, j, id, tick)) {
    const op = document.createElement('option');
    op.value = p;
    const pct = Math.round(fracaoElemental(r, Math.round(v[p] * 10)) * 100);
    op.textContent = t(p === padrao ? 'runa.opcaoPadrao' : 'runa.opcao', { nome: nomeDaRuna(p), pct: p === 'fisico' ? 0 : pct });
    op.selected = p === atual.runa;
    select.append(op);
  }
  select.addEventListener('change', () => {
    const runa = runasDisponiveis(ctx, j, id, tick).find((p) => p === select.value);
    if (!runa) return;
    emitir({ t: 'escolherRuna', habilidade: id, runa: runa === padrao ? null : runa });
    redesenhar();
  });
  const dica = document.createElement('span');
  dica.className = 'detalhe-item dica-runa';
  dica.textContent = t('runa.dica', { min: r.fracaoMinPct, max: r.fracaoMaxPct });
  caixa.append(rotulo, select, dica);
  return caixa;
}
