// Marco 45 (16/11/2026, D-181): o monstruário de Filo, a última parte do diário. Agrupa as 54 criaturas pelas nove
// dimensões (cada grupo com a cor da fenda e a contagem "x/6"). A criatura que ainda não foi vista é sombra; vista,
// mostra o nome e o desenho pré-renderizado; derrotada, a lore, a faixa de nível, a dica de luta, o que faz no terreno
// e, nos chefes, quantas vezes você venceu. Só lê o estado; todo texto entra por textContent.

import type { ContextoSimulacao } from '../core/contexto';
import type { Entidade } from '../entities/entidade';
import type { PresetInimigo } from '../entities/presets';
import { t, type ChaveTexto } from '../i18n';
import { retrato3d } from '../render/retrato';

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

function pagina(preset: PresetInimigo, bolsa: NonNullable<Entidade['bolsa']>, vistas: ReadonlySet<string>): HTMLElement {
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
  textos.append(titulo);
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
      for (const p of lista) ul.append(pagina(p, bolsa, vistas));
    });
    grupo.append(ul);
    corpo.append(grupo);
  }
}
