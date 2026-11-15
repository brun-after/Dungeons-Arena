// D-175 (15/11/2026): a história de uma skill ou ultimate para este personagem, em três partes:
// - a narrativa: o que ela é no mundo (o núcleo com a matéria do elemento, a da classe ou a da família de ultimate);
// - o visual: o que se vê na tela agora (a assinatura, a troca pela runa, a classe, o estilo e a afinidade);
// - a receita: todos os fatores em ação sobre ela, um por linha (núcleo, classe, nível, caminhos, marcos, poder base,
//   elemento e runa, sintonia, formas e leituras dos estilos, companheiro e, na ultimate, o par, a fusão e o veículo).
// Só leitura do estado; os textos ficam em i18n (pt-BR-narrativas.ts e pt-BR-visuais.ts).

import { definicaoDe, resolverHabilidade } from '../combat/compilar-habilidade';
import { eixoDaForma } from '../combat/eixos';
import { runaPadraoDaSkill } from '../combat/encaixe-runa';
import { fiosDoAtor } from '../combat/fios-do-ator';
import type { Habilidade } from '../combat/habilidades';
import { chaveDoAtor, perfilPara } from '../combat/perfil';
import { petDe } from '../combat/pets';
import { idDaRessonancia } from '../combat/ressonancias-dados';
import { parDaUltimate } from '../combat/ultimate-do-par';
import { chaveDaFusao } from '../combat/ultimates';
import type { ContextoSimulacao } from '../core/contexto';
import type { Entidade } from '../entities/entidade';
import { t, tOu, type ChaveTexto } from '../i18n';
import { formasDosEstilos } from '../progression/estilos';
import { perfilVisualDe } from '../render/perfil-visual';
import { visualDasComuns } from '../render/visual-comum';
import { ASSINATURAS } from '../render/vfx/assinaturas';
import { assinaturaDe } from '../render/vfx/resolver';
import { trocaDe } from '../render/vfx/transmutacao';
import { classeDaHabilidade } from './runa-dom';

export interface HistoriaDaSkill {
  narrativa: string;
  visual: string;
  receita: string[];
}

const nomeDoElemento = (e: string): string => t(`elemento.${e}` as ChaveTexto);
const materia = (e: string): string => t(`narrativa.materia.${e}` as ChaveTexto);
const maiuscula = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
/** O básico de arma tem a assinatura da própria arma (`arma_*`). */
const ehIdDeArma = (assinatura: string): boolean => assinatura.startsWith('arma_');

/** A skill compilada como o personagem a tem agora (com o rank, a runa e as formas). */
function compilada(ctx: ContextoSimulacao, j: Entidade, id: string, tick: number): Habilidade | undefined {
  return resolverHabilidade(ctx, chaveDoAtor(ctx, j, id, tick)) ?? resolverHabilidade(ctx, id);
}

function narrativaDe(ctx: ContextoSimulacao, id: string, h: Habilidade): string {
  if (ctx.conteudo.ultimates.has(id)) return tOu(`narrativa.ultimate.${id}`, t('narrativa.padrao'));
  const propria = tOu(`narrativa.skill.${id}`, '');
  if (propria) return propria;
  const def = definicaoDe(ctx, id);
  if (def?.nucleo) {
    const el = def.base.elemento ?? 'fisico';
    return `${maiuscula(t(`narrativa.nucleo.${def.nucleo}` as ChaveTexto, { materia: materia(el) }))} ${t(`narrativa.elemento.${el}` as ChaveTexto)}`;
  }
  if (h.passiva) return t('narrativa.passiva');
  if (ehIdDeArma(assinaturaDe(h))) return t('narrativa.arma');
  return h.elemento ? t(`narrativa.elemento.${h.elemento}` as ChaveTexto) : t('narrativa.padrao');
}

function visualDe(ctx: ContextoSimulacao, j: Entidade, id: string, h: Habilidade, tick: number): string {
  if (h.passiva) return '';
  const nome = assinaturaDe(h);
  const partes = [ehIdDeArma(nome) ? t('visual.arma') : tOu(`visual.${nome}`, t('visual.padrao'))];
  const troca = trocaDe(ASSINATURAS[nome].familia, h.runa);
  if (troca) partes.push(t('visualExtra.runa', { elemento: nomeDoElemento(troca.para), materia: materia(troca.para) }));
  // D-175: a skill comum leva o gesto do núcleo e, quando divide a assinatura com outra, sai na matéria do elemento.
  const comum = visualDasComuns(ctx.conteudo).get(id);
  if (comum) {
    const propria = comum.trocar ? trocaDe(ASSINATURAS[nome].familia, h.elemento ?? 'fisico') : null;
    if (propria) partes.push(t('visualExtra.materia', { materia: materia(propria.para) }));
    partes.push(t('visualExtra.nucleo', { nucleo: tOu(`nucleo.${comum.nucleo}`, comum.nucleo), gesto: tOu(`visualNucleo.${comum.nucleo}`, '') }));
  }
  if (h.runa && h.faixaRuna !== undefined) partes.push(t('visualExtra.faixa', { elemento: nomeDoElemento(h.runa), faixa: h.faixaRuna }));
  if (h.formas?.length) partes.push(t('visualExtra.forma', { formas: h.formas.map((f) => t(`eixo.${eixoDaForma(f.mod)}` as ChaveTexto)).join(', ') }));
  const perfil = h.runa ? perfilVisualDe(ctx, j, tick) : null;
  if (ctx.conteudo.ultimates.has(id)) {
    const classe = j.bolsa?.classeId ?? j.classeId ?? '';
    const daClasse = tOu(`visualExtra.classe.${classe}`, '');
    if (daClasse) partes.push(daClasse);
    if (perfil?.eixo) partes.push(t('visualExtra.estilo', { eixo: t(`eixo.${perfil.eixo}` as ChaveTexto) }));
  }
  if (perfil?.dominante && perfil.dominante.runa !== h.runa) partes.push(t('visualExtra.dominante', { elemento: nomeDoElemento(perfil.dominante.runa) }));
  return partes.join(' ');
}

function receitaDe(ctx: ContextoSimulacao, j: Entidade, id: string, h: Habilidade, tick: number): string[] {
  const linhas: string[] = [];
  const def = definicaoDe(ctx, id);
  const ultimate = ctx.conteudo.ultimates.get(id);
  const classe = classeDaHabilidade(ctx.conteudo, id);
  const nomeDaClasse = (c: string) => ctx.conteudo.classes.get(c)?.nome ?? c;
  const nomeDaSkill = (x: string) => resolverHabilidade(ctx, x)?.nome ?? x;
  const papel = h.papel ? t(`papel.${h.papel}` as ChaveTexto) : '';
  if (def?.nucleo && papel) linhas.push(t('receita.nucleo', { nucleo: tOu(`nucleo.${def.nucleo}`, def.nucleo), papel }));
  if (classe) linhas.push(t('receita.classe', { classe: nomeDaClasse(classe) }));
  else if (def?.nucleo) linhas.push(t('receita.comum'));
  if (ultimate) {
    const par = parDaUltimate(j);
    if (par) linhas.push(t('receita.ultimatePar', { a: nomeDaSkill(par[0]), b: nomeDaSkill(par[1]) }));
  }
  const conhecida = j.bolsa?.conhecidas.find((c) => c.id === id);
  if (conhecida) {
    linhas.push(t('receita.rank', { rank: conhecida.rank, max: ctx.balance.habilidades.rankMax }));
    if (conhecida.caminhos.length > 0) linhas.push(t('receita.caminhos', { lista: conhecida.caminhos.map((c) => ctx.conteudo.caminhos.get(c)?.nome ?? c).join(', ') }));
    const marcos = Object.entries(def?.marcos ?? {}).filter(([n]) => conhecida.rank >= Number(n)).map(([, m]) => m.texto);
    if (marcos.length > 0) linhas.push(t('receita.marcos', { lista: marcos.join('; ') }));
  }
  if (h.formulaDano !== null || h.formulaCura !== null) linhas.push(t('receita.poder', { pct: Math.round(perfilPara(ctx, j, h).danoPct) }));
  // O elemento e a runa.
  if (h.runa && j.bolsa) {
    const padrao = runaPadraoDaSkill(ctx, j.bolsa, id);
    linhas.push(t(h.runa === padrao ? 'receita.runaPadrao' : 'receita.runaEscolhida', { elemento: nomeDoElemento(h.runa) }));
    if (h.faixaRuna !== undefined) linhas.push(t('receita.sintonia', { elemento: nomeDoElemento(h.runa), faixa: h.faixaRuna, pct: Math.round((h.fracaoElemental ?? 0) * 100) }));
    if (papel && def?.base.papel) linhas.push(t('receita.secundario', { papel, elemento: nomeDoElemento(h.runa) }));
  } else if (h.elemento) {
    linhas.push(t('receita.elemento', { elemento: nomeDoElemento(h.elemento) }));
  }
  // Os estilos: as formas que entraram e as leituras da classe que já valem.
  for (const f of h.formas ?? []) linhas.push(t('receita.forma', { eixo: t(`eixo.${eixoDaForma(f.mod)}` as ChaveTexto), faixa: f.faixa, texto: t(`receita.forma.${f.mod}` as ChaveTexto) }));
  const ativos = formasDosEstilos(ctx, j);
  for (const [estiloId, leitura] of Object.entries(def?.leituras ?? {})) {
    const ativo = ativos.find((f) => f.estilo.id === estiloId);
    if (ativo) linhas.push(t('receita.leitura', { estilo: ativo.estilo.nome, texto: leitura.texto }));
  }
  // A ressonância que este golpe acorda (o eixo da forma com o elemento).
  const elementoDoGolpe = h.runa ?? h.elemento ?? (h.tipoAtaque === 'fisico' ? 'fisico' : null);
  for (const f of h.formas ?? []) {
    const r = elementoDoGolpe ? ctx.conteudo.ressonancias.get(idDaRessonancia(eixoDaForma(f.mod), elementoDoGolpe)) : undefined;
    if (!r) continue;
    linhas.push(j.bolsa?.diario.includes(`ressonancia:${r.id}`) ? t('receita.ressonanciaVista', { nome: r.nome, texto: r.texto }) : t('receita.ressonancia'));
  }
  if (h.tags.includes('falcao') && classe === 'aventureiro') linhas.push(t('receita.companheiro', { pet: tOu(`pet.${petDe(j)}`, petDe(j)) }));
  if (ehIdDeArma(assinaturaDe(h))) linhas.push(t('receita.arma'));
  if (ultimate) {
    const fios = fiosDoAtor(ctx, j, tick);
    if (fios) {
      const [a, b] = fios.par;
      linhas.push(t('receita.ultimateElementos', { a: nomeDoElemento(a.el), fa: a.faixa, b: nomeDoElemento(b.el), fb: b.faixa }));
      const fusao = fios.fusao ? ctx.conteudo.fusoes.get(chaveDaFusao(fios.fusao.eixos[0], fios.fusao.eixos[1])) : undefined;
      if (fios.fusao && fusao) linhas.push(t('receita.ultimateFusao', { a: t(`eixo.${fios.fusao.eixos[0]}` as ChaveTexto), b: t(`eixo.${fios.fusao.eixos[1]}` as ChaveTexto), faixa: fios.fusao.faixa, texto: fusao.texto }));
    }
    const classeDeQuem = j.bolsa?.classeId ?? j.classeId ?? '';
    const veiculo = ctx.conteudo.veiculos.get(classeDeQuem);
    const invoca = h.efeitos.some((e) => e.tipo === 'invocar_temporario');
    const etapa = veiculo?.etapas ? Object.values(veiculo.etapas) : [];
    if (invoca && veiculo?.invocacoes) linhas.push(t('receita.ultimateVeiculoInvoca', { classe: nomeDaClasse(classeDeQuem) }));
    if (h.efeitos.some((e) => e.tipo === 'fase' && e.ref !== null && etapa.includes(e.ref))) linhas.push(t('receita.ultimateVeiculoEtapa', { classe: nomeDaClasse(classeDeQuem) }));
    if (h.lanca?.junto) linhas.push(t('receita.ultimateLanca'));
  }
  return linhas.length > 0 ? linhas : [t('receita.semFatores')];
}

/** A história da skill para este personagem (null: a skill não existe). */
export function historiaDaSkill(ctx: ContextoSimulacao, j: Entidade, id: string, tick: number): HistoriaDaSkill | null {
  const h = compilada(ctx, j, id, tick);
  if (!h) return null;
  return { narrativa: narrativaDe(ctx, id, h), visual: visualDe(ctx, j, id, h, tick), receita: receitaDe(ctx, j, id, h, tick) };
}

/** A história no cartão do menu: a narrativa, o visual e a receita atrás do botão "+". */
export function blocoDaHistoria(ctx: ContextoSimulacao, j: Entidade, id: string, tick: number): HTMLElement | null {
  const historia = historiaDaSkill(ctx, j, id, tick);
  if (!historia) return null;
  const bloco = document.createElement('div');
  bloco.className = 'historia-habilidade';
  const paragrafo = (classe: string, rotulo: string, texto: string) => {
    if (!texto) return;
    const p = document.createElement('p');
    p.className = classe;
    const forte = document.createElement('strong');
    forte.textContent = `${rotulo}: `;
    p.append(forte, texto);
    bloco.append(p);
  };
  paragrafo('narrativa-habilidade', t('historia.narrativa'), historia.narrativa);
  paragrafo('visual-habilidade', t('historia.visual'), historia.visual);
  const receita = document.createElement('details');
  receita.className = 'receita-habilidade';
  receita.dataset.receita = id;
  const resumo = document.createElement('summary');
  resumo.title = t('historia.abrirReceita');
  resumo.setAttribute('aria-label', t('historia.abrirReceita'));
  const mais = document.createElement('span');
  mais.className = 'mais-receita';
  mais.setAttribute('aria-hidden', 'true');
  mais.textContent = '+';
  resumo.append(mais, ` ${t('historia.receita')}`);
  const lista = document.createElement('ul');
  for (const linha of historia.receita) {
    const li = document.createElement('li');
    li.textContent = linha;
    lista.append(li);
  }
  receita.append(resumo, lista);
  bloco.append(receita);
  return bloco;
}
