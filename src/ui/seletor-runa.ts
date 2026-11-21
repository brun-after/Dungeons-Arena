// O encaixe de runa na carta da skill (marco 39, 12/11/2026, D-151). Mostra a runa que vale agora e a parte elemental
// dela; trocar emite `escolherRuna` (a simulação confere). Textos por textContent.
// Marco 50 (21/11/2026, D-196): sai o <select>. Entra a bandeja de pedras rúnicas: as que o vínculo libera, acesas na
// cor do elemento; as outras, apagadas. Arrastar uma pedra acesa até o encaixe (ou tocar nela) transmuta a skill.
// Não se gastam; a troca é livre fora de combate.

import type { Comando } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import type { Entidade } from '../entities/entidade';
import { t, type ChaveTexto } from '../i18n';
import { fracaoElemental, levaRuna, runaDoAtor, runaPadraoDaSkill, runasDisponiveis } from '../combat/runas';
import { PONTAS_ELEMENTAIS, vinculoDe, type PontaElemental } from '../progression/vinculo';
import { icone } from './icones';
import { tornarAlvo, tornarArrastavel } from './alquimia/arrastar';

const nomeDaRuna = (p: string) => (p === 'fisico' ? t('vinculo.fisico') : t(`elemento.${p}` as ChaveTexto));

export function seletorDeRuna(ctx: ContextoSimulacao, j: Entidade, id: string, tick: number, emitir: (cmd: Comando) => void, redesenhar: () => void): HTMLElement | null {
  const bolsa = j.bolsa;
  const atual = runaDoAtor(ctx, j, id, tick);
  if (!bolsa || !atual || !levaRuna(ctx, id)) return null;
  const r = ctx.balance.habilidades.runas;
  const v = vinculoDe(ctx, j, tick);
  const padrao = runaPadraoDaSkill(ctx, bolsa, id);
  const livres = runasDisponiveis(ctx, j, id, tick);
  const cor = (p: PontaElemental) => (p === 'fisico' ? '#c9c2b6' : ctx.conteudo.elementos.get(p)?.cor ?? '#c9c2b6');
  const iconeDe = (p: PontaElemental) => (p === 'fisico' ? 'espada' : ctx.conteudo.elementos.get(p)?.icone ?? 'runa');
  const caixa = document.createElement('div');
  caixa.className = 'encaixe-runa';
  caixa.dataset.runa = atual.runa;
  // O encaixe: a pedra que vale agora, alvo das outras.
  const encaixe = document.createElement('div');
  encaixe.className = 'encaixe-pedra';
  encaixe.dataset.testid = `encaixe-runa-${id}`;
  encaixe.style.setProperty('--cor-elemento', cor(atual.runa));
  tornarAlvo(encaixe, `runa-${id}`, ['pedra']);
  encaixe.append(icone(iconeDe(atual.runa)));
  const rotulo = document.createElement('span');
  rotulo.className = 'detalhe-item';
  rotulo.textContent = t('runa.atual', { nome: nomeDaRuna(atual.runa) });
  const trocar = (p: (typeof PONTAS_ELEMENTAIS)[number]) => {
    if (!livres.includes(p) || p === atual.runa) return;
    emitir({ t: 'escolherRuna', habilidade: id, runa: p === padrao ? null : p });
    redesenhar();
  };
  // A bandeja: as nove pedras.
  const bandeja = document.createElement('div');
  bandeja.className = 'bandeja-pedras';
  bandeja.setAttribute('role', 'group');
  bandeja.setAttribute('aria-label', t('runa.bandeja'));
  for (const p of PONTAS_ELEMENTAIS) {
    const livre = livres.includes(p);
    const pedra = document.createElement('button');
    pedra.type = 'button';
    pedra.className = `pedra-runica${livre ? ' acesa' : ' apagada'}${p === atual.runa ? ' no-encaixe' : ''}`;
    pedra.dataset.chave = `pedra-${id}-${p}`;
    pedra.dataset.runa = p;
    pedra.style.setProperty('--cor-elemento', cor(p));
    const pct = Math.round(fracaoElemental(r, Math.round(v[p] * 10)) * 100);
    pedra.title = livre ? (p === padrao ? t('runa.pedraPadrao', { nome: nomeDaRuna(p) }) : t('runa.pedra', { nome: nomeDaRuna(p), pct: p === 'fisico' ? 0 : pct })) : t('runa.pedraBloqueada', { nome: nomeDaRuna(p) });
    pedra.setAttribute('aria-label', pedra.title);
    pedra.disabled = !livre;
    pedra.append(icone(iconeDe(p)));
    if (livre) tornarArrastavel(pedra, { tipo: 'pedra', aoTocar: () => { trocar(p); }, aoSoltar: () => { trocar(p); } });
    bandeja.append(pedra);
  }
  const dica = document.createElement('span');
  dica.className = 'detalhe-item dica-runa';
  dica.textContent = `${t('runa.arraste')} ${t('runa.dica', { min: r.fracaoMinPct, max: r.fracaoMaxPct })}`;
  caixa.append(encaixe, rotulo, bandeja, dica);
  return caixa;
}
