// Marco 45 (16/11/2026, D-182): o monstruário de Filo, a última parte do diário. Agrupa as 54 criaturas pelas nove
// dimensões (cada grupo com a cor da fenda e a contagem "x/6"). A criatura que ainda não foi vista é sombra; vista,
// mostra o nome e o desenho pré-renderizado; derrotada, a lore, a faixa de nível, a dica de luta, o que faz no terreno
// e, nos chefes, quantas vezes você venceu. Só lê o estado; todo texto entra por textContent.
// Marco 47 (20/11/2026, D-190): vista, a criatura já mostra a ficha (vida, XP, elemento, resistências) e o loot: a
// chance de item e de peça de armadura, o elemento que a peça puxa, as peças do chefe e os materiais do lugar.

import type { ContextoSimulacao } from '../core/contexto';
import type { Entidade } from '../entities/entidade';
import type { PresetInimigo } from '../entities/presets';
import { t, tOu, type ChaveTexto } from '../i18n';
import { retrato3d } from '../render/retrato';
import { lootDaCriatura } from '../progression/loot-pecas';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, classe?: string, texto?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto !== undefined) e.textContent = texto;
  return e;
}

/**
 * O desenho da criatura (o quadro parado, de frente). A que ainda não foi vista é só a sombra de uma silhueta: o atlas
 * não é carregado (os dos dragões passam de 7000 px; abrir todos de uma vez travava a página).
 */
function desenho(preset: PresetInimigo, vista: boolean): HTMLElement {
  const caixa = el('div', vista ? 'desenho-monstro' : 'desenho-monstro sombra');
  if (!vista) {
    caixa.append(el('span', 'silhueta-monstro'));
    return caixa;
  }
  const r = retrato3d(preset.modelo);
  if (r) caixa.append(r.canvas);
  return caixa;
}

const nomeDoElemento = (el: string) => tOu(`elemento.${el}`, el);

/** A ficha e o loot da criatura vista (números do conteúdo e do modo do lugar). */
function fichaDaCriatura(preset: PresetInimigo, ctx: ContextoSimulacao): HTMLElement[] {
  const linha = (texto: string) => el('span', 'linha-diario ficha-monstro', texto);
  const chefe = preset.arquetipo === 'boss';
  const loot = lootDaCriatura(ctx, preset);
  const linhas = [linha(t('monstro.ficha', { hp: preset.hpBase, xp: preset.xp }))];
  if (loot.elemento) linhas.push(linha(t('monstro.elemento', { elemento: nomeDoElemento(loot.elemento) })));
  const resistencias = Object.entries(preset.resistencias).filter(([, v]) => v !== 0).map(([k, v]) => `${nomeDoElemento(k)} ${String(v)}%`);
  if (resistencias.length > 0) linhas.push(linha(t('monstro.resistencias', { lista: resistencias.join(', ') })));
  const itemPct = Math.round(Math.min(100, (chefe ? ctx.balance.drops.chanceItemBoss : ctx.balance.drops.chanceItem) * (ctx.modo.lootPct ?? 100)));
  linhas.push(linha(t('monstro.lootItem', { pct: itemPct })));
  linhas.push(linha(chefe ? t('monstro.lootPecasChefe', { n: loot.pecasDoChefe }) : t('monstro.lootPeca', { pct: Math.round(loot.pecaPct * 10) / 10 })));
  if (loot.elemento) linhas.push(linha(t('monstro.lootElemento', { pct: loot.elementoPct, elemento: nomeDoElemento(loot.elemento) })));
  if (loot.primeiraVitoria && loot.elemento) linhas.push(linha(t('monstro.lootPrimeira', { elemento: nomeDoElemento(loot.elemento) })));
  const materiais = ctx.modo.materiaisDeInimigos?.[preset.id] ?? [];
  if (materiais.length > 0) linhas.push(linha(t('monstro.lootMateriais', { lista: materiais.map((m) => `${ctx.conteudo.itens.get(m.itemId)?.nome ?? m.itemId} ${m.chancePct}%`).join(', ') })));
  return linhas;
}

function pagina(preset: PresetInimigo, bolsa: NonNullable<Entidade['bolsa']>, vistas: ReadonlySet<string>, ctx: ContextoSimulacao): HTMLElement {
  const id = `criatura:${preset.id}`;
  const vista = vistas.has(id);
  const caiu = vistas.has(`${id}:caiu`);
  const chefe = preset.arquetipo === 'boss';
  const li = el('li', vista ? 'pagina-monstro vista' : 'pagina-monstro silhueta');
  li.dataset.entrada = id;
  li.append(desenho(preset, vista));
  const textos = el('div', 'textos-monstro');
  li.append(textos);
  if (!vista) {
    textos.append(el('strong', undefined, t('monstro.silhueta')));
    return li;
  }
  const titulo = el('strong', undefined, preset.nome);
  if (chefe) titulo.append(' ', el('span', 'marca-chefe', t('monstro.chefe')));
  textos.append(titulo, ...fichaDaCriatura(preset, ctx));
  if (!caiu) {
    textos.append(el('span', 'linha-diario', t('monstro.derrote')));
    return li;
  }
  const chave = (k: string) => `monstro.${preset.id}.${k}` as ChaveTexto;
  textos.append(el('span', 'lore-monstro', t(chave('lore'))));
  if (!chefe) {
    const nivel = preset.nivelPico === null ? t('monstro.nivelSemPico', { min: preset.nivelMin }) : t('monstro.nivel', { min: preset.nivelMin, max: preset.nivelPico });
    textos.append(el('span', 'linha-diario', nivel));
  }
  textos.append(el('span', 'linha-diario', `${t('monstro.dica')}: ${t(chave('dica'))}`));
  if (!chefe) textos.append(el('span', 'linha-diario', `${t('monstro.fenda')}: ${t(chave('fenda'))}`));
  const vitorias = bolsa.vitorias?.[preset.id] ?? 0;
  if (chefe && vitorias > 0) textos.append(el('span', 'linha-diario vitorias', t('monstro.vitorias', { n: vitorias })));
  return li;
}

export function desenharMonstruario(corpo: HTMLElement, j: Entidade, ctx: ContextoSimulacao): void {
  const bolsa = j.bolsa;
  if (!bolsa) return;
  const vistas = new Set(bolsa.diario);
  corpo.append(el('h3', 'subtitulo-modal', t('monstro.titulo')));
  // Marco 47 (D-190): a garantia contra azar do loot de armadura, com o contador de quem lê.
  const g = ctx.conteudo.sorteio.loot.garantia;
  const azar = bolsa.azarDePeca ?? { semPeca: 0, semRara: 0 };
  corpo.append(el('p', 'linha-diario garantia-loot', t('monstro.garantia', { semPeca: Math.floor(azar.semPeca), tetoPeca: g.abatesSemPeca, semRara: Math.floor(azar.semRara), tetoRara: g.abatesSemRara })));
  for (const d of ctx.conteudo.dimensoes.values()) {
    const lista = [...ctx.conteudo.presets.values()].filter((p) => p.dimensao === d.id).sort((a, b) => Number(a.arquetipo === 'boss') - Number(b.arquetipo === 'boss') || a.nivelMin - b.nivelMin);
    if (lista.length === 0) continue;
    const grupo = el('details', 'grupo-diario grupo-monstruario');
    grupo.dataset.dimensao = d.id;
    grupo.style.setProperty('--cor-fenda', d.fenda.cor);
    const n = lista.filter((p) => vistas.has(`criatura:${p.id}`)).length;
    grupo.append(el('summary', undefined, t('monstro.grupo', { dimensao: t(`dimensao.${d.id}.nome` as ChaveTexto), n, total: lista.length })));
    grupo.append(el('p', 'sotaque-dimensao', t(`dimensao.${d.id}.sotaque` as ChaveTexto)));
    const ul = el('ul', 'paginas-monstro');
    // O desenho só é pedido ao abrir o grupo (são até seis atlas por dimensão).
    let aberto = false;
    grupo.addEventListener('toggle', () => {
      if (aberto || !grupo.open) return;
      aberto = true;
      for (const p of lista) ul.append(pagina(p, bolsa, vistas, ctx));
    });
    grupo.append(ul);
    corpo.append(grupo);
  }
}
