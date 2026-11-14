// Como cada habilidade funciona para quem a usa (D-057, D-059). Marco 14 (14/10/2026). Puro.
// - A chave do ator: o rank e os caminhos de `bolsa.conhecidas`, mais os modificadores do equipamento que
//   combinam com as etiquetas da habilidade. Quem não tem bolsa (inimigos, arena) usa o id puro: rank 1.
// - O perfil: as afinidades da classe e as passivas conhecidas, por etiqueta, viram bônus de dano, cura,
//   alcance, custo e recarga. São números de tempo de execução (não entram na chave).

import type { ContextoSimulacao } from '../core/contexto';
import type { Bolsa, Entidade } from '../entities/entidade';
import { formatarChave } from './chave-habilidade';
import { definicaoDe, resolverHabilidade } from './compilar-habilidade';
import type { DefinicaoHabilidade, Habilidade, Modificador, Passiva, Variante } from './habilidades';
import { furiaAtual } from './furia';
import { modificadoresDosConjuntos } from '../progression/ganchos-do-portador';
import { sintoniaDe } from '../progression/sintonia';
import { formasDosEstilos } from '../progression/estilos';
import { runaDoAtor, ultimoTickDeUso } from './runas';
import { fiosDoAtor } from './fios-do-ator';
import { formaDoEixo, type FormaId } from './eixos';
import { vinculoDe } from '../progression/vinculo';

export type ContextoPerfil = Pick<ContextoSimulacao, 'conteudo' | 'balance'>;

export interface PerfilHabilidade {
  danoPct: number;
  curaPct: number;
  alcance: number;
  custoPct: number;
  recargaPct: number;
}

export const PERFIL_NEUTRO: PerfilHabilidade = { danoPct: 0, curaPct: 0, alcance: 0, custoPct: 0, recargaPct: 0 };

/**
 * Marco 24 (24/10/2026, D-094): as variantes que o estado do ator liga nesta habilidade — o Frenesi, a fúria acima da
 * metade, o elemento encarnado e, nas ultimates, as marcas de Domínio da barra. Sem `tick`, vale o que está guardado (os efeitos vencidos saem no fim de cada tick).
 */
export function variantesDoAtor(ctx: ContextoPerfil, ator: Entidade, def: DefinicaoHabilidade | null, tick?: number): Variante[] {
  if (!def || Object.keys(def.variantes).length === 0) return [];
  const saida: Variante[] = [];
  const vale = (ate: number) => tick === undefined || ate > tick;
  if (def.variantes.frenesi && ator.efeitos.some((f) => f.tipo === 'frenesi' && vale(f.ateTick))) saida.push('frenesi');
  if (def.variantes.furia_alta && ator.furia) {
    const agora = tick ?? ator.furia.ultimoTick;
    if (furiaAtual(ctx, ator, agora) * 2 >= ctx.balance.ajustesClasses.guerreiro.furia.max) saida.push('furia_alta');
  }
  if (ator.encarnacao && vale(ator.encarnacaoAteTick ?? 0)) {
    const v = `enc_${ator.encarnacao}` as Variante;
    if (def.variantes[v]) saida.push(v);
  }
  // Marco 40 (13/11/2026, D-165): a versão da skill de classe para o companheiro ativo do Aventureiro.
  const pet = ator.bolsa?.pet;
  if (pet && pet !== 'falcao' && def.variantes[`pet_${pet}`]) saida.push(`pet_${pet}`);
  // Marco 24 (D-095): o Domínio (2 gerais da mesma família nas teclas 3–6) marca qualquer ultimate.
  if (def.base.tags.includes('ultimate')) {
    for (const f of sintoniaDe(ctx, ator).dominios) {
      const v = `dom_${f}` as Variante;
      if (def.variantes[v]) saida.push(v);
    }
  }
  return saida;
}

/** A chave compilada da habilidade para este ator. */
export function chaveDoAtor(ctx: ContextoPerfil, ator: Entidade, id: string, tick?: number): string {
  const bolsa = ator.bolsa;
  if (!bolsa) return formatarChave({ id, rank: 1, caminhos: caminhoAfim(ctx, ator, id), mods: [], variantes: variantesDoAtor(ctx, ator, definicaoDe(ctx, id), tick) });
  const conhecida = bolsa.conhecidas.find((c) => c.id === id);
  const def = definicaoDe(ctx, id);
  const tags = def?.base.tags ?? [];
  const mods: Modificador[] = [];
  for (const entrada of Object.values(bolsa.equipamento)) {
    const item = entrada ? ctx.conteudo.itens.get(entrada.itemId) : undefined;
    for (const m of item?.modificadores ?? []) if (m.tag === null || tags.includes(m.tag)) mods.push(m.mod);
  }
  // Marco 18 (D-069): os conjuntos completos também dão modificadores (a Vigília do caçador faz as flechas ecoarem).
  for (const m of modificadoresDosConjuntos(ctx, bolsa)) if ((m.tag === null || tags.includes(m.tag)) && !mods.includes(m.mod)) mods.push(m.mod);
  // Marco 39 (D-156): as formas dos estilos, cada uma na sua faixa (o que já vem do equipamento não se repete; com duas
  // pontas na mesma forma, vale a faixa maior). Marco 40 (12/11/2026, D-157): a skill com núcleo recebe a forma do eixo
  // principal de cada estilo que ela tem, ou a do secundário, na metade da faixa; as antigas seguem a etiqueta.
  const formas: { mod: FormaId; faixa: number }[] = [];
  const juntar = (mod: FormaId, faixa: number) => {
    if (faixa <= 0 || (mods as readonly string[]).includes(mod)) return;
    const ja = formas.find((x) => x.mod === mod);
    if (ja) ja.faixa = Math.max(ja.faixa, faixa);
    else formas.push({ mod, faixa });
  };
  const leituras: { estilo: string; faixa: number }[] = [];
  const ehUltimate = tags.includes('ultimate');
  for (const f of formasDosEstilos(ctx, ator)) {
    const [principal, secundario] = f.estilo.eixos;
    // Marco 40 (13/11/2026, D-160): na ultimate, todo estilo com ponta é um fio: empurra o eixo principal, na faixa dele.
    if (ehUltimate) {
      juntar(formaDoEixo(principal), f.faixa);
      continue;
    }
    // Marco 40 (D-159): na skill de classe, cada estilo empurra o eixo da leitura dele, na faixa inteira.
    const leitura = def?.leituras?.[f.estilo.id];
    if (def?.leituras) {
      if (leitura) {
        juntar(formaDoEixo(leitura.eixo), f.faixa);
        if (leitura.efeitos.length > 0) leituras.push({ estilo: f.estilo.id, faixa: f.faixa });
      }
    } else if (def?.eixos) {
      if (def.eixos.includes(principal)) juntar(formaDoEixo(principal), f.faixa);
      else if (def.eixos.includes(secundario)) juntar(formaDoEixo(secundario), Math.ceil(f.faixa / 2));
    } else if (f.estilo.forma && (f.estilo.forma.tag === null || tags.includes(f.estilo.forma.tag))) juntar(f.estilo.forma.mod, f.faixa);
  }
  // Marco 39 (D-151): a runa do encaixe (sem tick, vale o último uso registrado, como na ficha).
  const quando = tick ?? ultimoTickDeUso(bolsa);
  const runa = runaDoAtor(ctx, ator, id, quando);
  // Marco 40 (D-157): a skill comum com papel leva a faixa da sintonia com o elemento dela.
  const sintonia = !runa && def?.base.papel ? Math.max(0, Math.min(10, Math.round(vinculoDe(ctx, ator, quando)[def.base.elemento ?? 'fisico'] * 10))) : undefined;
  // D-160: os fios de elemento (o par) e a fusão dos dois estilos mais fortes.
  const fios = ehUltimate ? fiosDoAtor(ctx, ator, quando) : null;
  return formatarChave({ id, rank: conhecida?.rank ?? 1, caminhos: conhecida?.caminhos ?? [], mods, variantes: variantesDoAtor(ctx, ator, def, tick), ...(formas.length > 0 && { formas }), ...(leituras.length > 0 && { leituras }), ...(fios && { fios }), ...(sintonia !== undefined && { sintonia }), ...(runa && { runa }) });
}


/**
 * 06/11/2026 (D-135): a habilidade `encantavel` do inimigo afim (a pedra do Arremessador) sai com o elemento dele, pelo
 * caminho elemental do catálogo (o que muda o elemento para o dele).
 */
function caminhoAfim(ctx: ContextoPerfil, ator: Entidade, id: string): string[] {
  const el = ator.afinidade?.elemento;
  if (!el || !definicaoDe(ctx, id)?.base.tags.includes('encantavel')) return [];
  for (const c of ctx.conteudo.caminhos.values()) if (c.elemento === el && c.id.startsWith('elemental_')) return [c.id];
  return [];
}

/** A habilidade compilada que este ator usa (com `tick`, as variantes conferem o prazo dos estados). */
export function habilidadeDoAtor(ctx: ContextoPerfil, ator: Entidade, id: string, tick?: number): Habilidade | undefined {
  return resolverHabilidade(ctx, chaveDoAtor(ctx, ator, id, tick));
}

/** As passivas que o personagem conhece, escaladas pelo rank. Marco 24 (D-095): as gerais, só as ligadas. */
export function passivasDaBolsa(ctx: ContextoPerfil, bolsa: Bolsa): Passiva[] {
  const saida: Passiva[] = [];
  for (const c of bolsa.conhecidas) {
    const def = definicaoDe(ctx, c.id);
    const p = def?.base.passiva;
    if (def?.familiaGeral && !bolsa.passivasAtivas?.includes(c.id)) continue;
    if (p) saida.push(escalarPassiva(p, c.rank, ctx));
  }
  return saida;
}

/** O rank escala a passiva pelo mesmo `efeitoPct` dos efeitos. */
function escalarPassiva(p: Passiva, rank: number, ctx: ContextoPerfil): Passiva {
  const r = ctx.balance.habilidades.ranks[rank - 1] ?? ctx.balance.habilidades.ranks.at(-1);
  const k = 1 + (r?.efeitoPct ?? 0) / 100;
  return {
    ...p,
    tenacidadePct: (p.tenacidadePct ?? 0) * k,
    fluxoEscudoPct: (p.fluxoEscudoPct ?? 0) * k,
    tag: p.tag,
    danoPct: p.danoPct * k,
    curaPct: p.curaPct * k,
    alcance: p.alcance,
    custoPct: p.custoPct * k,
    recargaPct: p.recargaPct * k,
    hpMaxPct: p.hpMaxPct * k,
    manaMaxPct: p.manaMaxPct * k,
    defesa: Math.round(p.defesa * k),
  };
}

/** Afinidades da classe e passivas conhecidas que valem para esta habilidade (pela etiqueta). */
export function perfilPara(ctx: ContextoPerfil, ator: Entidade, hab: Habilidade): PerfilHabilidade {
  const bolsa = ator.bolsa;
  if (!bolsa) return PERFIL_NEUTRO;
  const regras = ctx.balance.ajustesClasses;
  const nivel = Math.min(ctx.balance.xp.nivelMax, Math.max(1, ator.nivel));
  const afinidades = (ctx.conteudo.classes.get(bolsa.classeId)?.afinidades ?? []).map((f) => {
    if (bolsa.classeId === 'guerreiro' && f.tag === 'contato') return { ...f, danoPct: regras.guerreiro.contatoMaxPct * Math.min(1, (nivel - 1) / (regras.guerreiro.contatoNivel - 1)) ** regras.guerreiro.contatoExpoente };
    if (bolsa.classeId === 'mago' && f.tag === 'magico') {
      const m = regras.mago;
      const danoPct = nivel < m.nivelIntermediario ? m.inicialPct + (m.intermediarioPct - m.inicialPct) * (nivel - 1) / (m.nivelIntermediario - 1)
        : nivel <= m.fimIntermediario ? m.intermediarioPct : m.intermediarioPct + (m.inicialPct - m.intermediarioPct) * Math.min(1, (nivel - m.fimIntermediario) / (m.nivelFinal - m.fimIntermediario));
      return { ...f, danoPct };
    }
    return f;
  });
  const fontes = [...afinidades, ...passivasDaBolsa(ctx, bolsa)];
  const p = { ...PERFIL_NEUTRO };
  for (const f of fontes) {
    if (f.tag !== null && !hab.tags.includes(f.tag)) continue;
    p.danoPct += f.danoPct;
    p.curaPct += f.curaPct;
    p.alcance += f.alcance;
    p.custoPct += f.custoPct;
    p.recargaPct += f.recargaPct;
  }
  // Marco 39 (D-156): a forma cobra dano por alvo na fração da faixa, quando entrou de fato na skill (a chave compilada
  // só leva as que couberam). Marco 40 (D-157): o custo é da forma (`balance.habilidades.eixos.custoPct`).
  for (const naChave of hab.formas ?? []) p.danoPct += (ctx.balance.habilidades.eixos.custoPct[naChave.mod] * naChave.faixa) / 10;
  // Marco 40 (13/11/2026, D-160): o par de elementos da ultimate (e a runa no par), que vem compilado nos fios.
  p.danoPct += hab.bonusFiosPct ?? 0;
  p.custoPct = Math.max(-90, p.custoPct);
  p.recargaPct = Math.max(-75, p.recargaPct);
  return p;
}
