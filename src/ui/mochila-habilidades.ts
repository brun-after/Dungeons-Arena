import { catalogoCombos } from './combos';
// Aba "Habilidades" da mochila (D-057, D-059). Marco 14 (14/10/2026). Só lê o estado e emite comandos.
// - Pontos de habilidade (1 por nível) e as 4 teclas (pôr e tirar habilidades);
// - as conhecidas, com o rank, o que fazem (descrição gerada) e "Subir rank" — nos ranks de evolução, os
//   caminhos aparecem como cartões e a escolha é definitiva;
// - as passivas e o que a classe ainda pode aprender. Botão desabilitado diz o motivo (o mesmo da simulação).
// Marco 18 (17/10/2026, D-068): cada carta mostra o grau ("Rank B/A/S"); aprender vira estudar (com o tempo já
// encurtado pela Inteligência). D-075: mostra velocidade e tempo restante; evolução aceita pontos ou essências.
// Ajuste de 16/10/2026 (D-067): pôr na tecla ficou direto — as 4 teclas são blocos com o ícone no topo e cada
// carta de habilidade ativa tem os botões 1 2 3 4 (a tecla atual marcada; tocar nela de novo tira).

import { resolverHabilidade } from '../combat/compilar-habilidade';
import type { Habilidade } from '../combat/habilidades';
import { chaveDoAtor, perfilPara } from '../combat/perfil';
import type { Comando } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import type { MotivoHabilidade } from '../core/eventos-simulacao';
import { SLOTS_BARRA, type Entidade } from '../entities/entidade';
import { t, type ChaveTexto } from '../i18n';
import { DT_MS } from '../core/loop';
import { aprendiveisDa, caminhosDoRank, motivoParaNaoSubir, reaprendivel, nivelParaRank, ticksDeEstudo, ticksRestantesDoEstudo, velocidadeDoEstudo } from '../progression/habilidades-personagem';
import { definicaoDe } from '../combat/compilar-habilidade';
import { familiaDaHabilidade } from '../progression/itens-progressao';
import { duracaoLegivel } from './tempo';
import { descreverBonus, descreverCaminho, descreverHabilidade, linhasDeEscala } from './descrever';
import { icone } from './icones';
import { classeDaHabilidade, comRuna } from './runa-dom';
import { desenharPassivasGerais, desenharSintonia } from './painel-sintonia';
import { parDaUltimate, ultimateDe } from '../combat/carga-ultimate';
import { compreensaoDe, fundivel } from '../progression/alquimia';
import { ehFusao } from '../combat/fusao/receita';
import { seletorDeRuna } from './seletor-runa';
import { listaDeLeituras } from './leituras-skill';
import { blocoDaHistoria } from './historia-skill';
import { teclaRecusa } from '../progression/habilidades-classe';

export interface EstadoAbaHabilidades {
  /** Mantido para a mochila (D-067: a escolha agora é direta, pelos botões 1 2 3 4 da carta). */
  escolhendo: string | null;
  essenciaInvId?: string | null;
  /** Marco 53 (22/11/2026, D-203): as cartas abertas (as outras ficam compactas, e cabem mais na tela). */
  expandidas?: Set<string>;
  secoesAbertas?: Set<string>;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, classe?: string, texto?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto !== undefined) e.textContent = texto;
  return e;
}

function botao(texto: string, chave: string, aoClicar: () => void): HTMLButtonElement {
  const b = el('button', 'botao-cabecalho', texto);
  b.type = 'button';
  b.dataset.chave = chave;
  b.addEventListener('click', aoClicar);
  return b;
}

function textoDoMotivo(m: MotivoHabilidade, ctx: ContextoSimulacao, id: string, rank: number): string {
  return t(`habilidades.motivo.${m}` as ChaveTexto, { nivel: nivelParaRank(ctx, id, rank) });
}

export function desenharHabilidades(
  corpo: HTMLElement,
  j: Entidade,
  ctx: ContextoSimulacao,
  emitir: (cmd: Comando) => void,
  ui: EstadoAbaHabilidades,
  redesenhar: () => void,
  /** Marco 24: o tick, para a encarnação e a dupla no painel da Sintonia. */
  tick = 0,
): void {
  const bolsa = j.bolsa;
  if (!bolsa) return;
  const rankMax = ctx.balance.habilidades.rankMax;
  const compilada = (id: string): Habilidade | undefined => resolverHabilidade(ctx, chaveDoAtor(ctx, j, id));
  const pontos = el('p', 'linha-pontos', t('habilidades.pontos', { n: bolsa.pontosHabilidade }));
  pontos.dataset.pontosHabilidade = String(bolsa.pontosHabilidade);
  corpo.append(pontos);
  const essenciaSelecionada = ui.essenciaInvId ? bolsa.mochila.find((i) => i.invId === ui.essenciaInvId) : undefined;
  const familiaSelecionada = essenciaSelecionada ? ctx.conteudo.itens.get(essenciaSelecionada.itemId)?.progressao : undefined;
  if (ui.essenciaInvId) {
    corpo.append(el('p', 'detalhe-item', t('progressao.selecionarHabilidade')));
    corpo.append(botao(t('progressao.cancelar'), 'cancelar-essencia', () => { ui.essenciaInvId = null; redesenhar(); }));
  }

  // As 4 teclas: blocos com o ícone e o nome; "tirar" esvazia a tecla.
  // D-205 (25/11/2026): a barra do grimório aceita arrastar (entre teclas e dos cartões), com os botões ainda valendo;
  // a ultimate, a sintonia e os combos ficam recolhidos abaixo dos cartões.
  const barra = el('section', 'grimorio-barra');
  barra.append(el('h3', 'subtitulo-modal', t('habilidades.barra')));
  barra.append(el('p', 'grimorio-dica', t('habilidades.dicaArrastar')));
  const status = el('p', 'grimorio-status');
  status.setAttribute('role', 'status');
  let arrastando: string | null = null;
  const arrastar = (elemento: HTMLElement, id: string) => {
    elemento.draggable = true;
    elemento.addEventListener('dragstart', (ev) => {
      if (!ev.dataTransfer) return;
      arrastando = id;
      ev.dataTransfer.effectAllowed = 'move';
      ev.dataTransfer.setData('text/plain', id);
      barra.classList.add('arrastando');
    });
    elemento.addEventListener('dragend', () => {
      arrastando = null;
      barra.classList.remove('arrastando');
      barra.querySelectorAll('.destino-skill').forEach((destino) => { destino.classList.remove('destino-skill'); });
    });
  };
  const teclas = el('ul', 'teclas-habilidade');
  for (let slot = 0; slot < SLOTS_BARRA; slot++) {
    const id = bolsa.barra[slot] ?? null;
    const h = id ? compilada(id) : undefined;
    const li = el('li', h ? 'bloco-tecla' : 'bloco-tecla vazio');
    li.dataset.tecla = String(slot + 1);
    li.addEventListener('dragover', (ev) => {
      if (!arrastando) return;
      ev.preventDefault();
      const valido = !teclaRecusa(ctx, bolsa, slot, arrastando);
      if (ev.dataTransfer) ev.dataTransfer.dropEffect = valido ? 'move' : 'none';
      li.classList.toggle('destino-skill', valido);
    });
    li.addEventListener('dragleave', (ev) => {
      if (!(ev.relatedTarget instanceof Node) || !li.contains(ev.relatedTarget)) li.classList.remove('destino-skill');
    });
    li.addEventListener('drop', (ev) => {
      if (!arrastando) return;
      ev.preventDefault();
      li.classList.remove('destino-skill');
      if (teclaRecusa(ctx, bolsa, slot, arrastando)) {
        status.textContent = t('habilidades.teclaRecusada');
        return;
      }
      if (id !== arrastando) emitir({ t: 'equiparHabilidade', id: arrastando, slot });
    });
    li.append(el('span', 'numero-tecla', String(slot + 1)), h ? icone(h.icone) : el('span', 'icone-vazio'), el('span', 'nome-tecla', h ? h.nome : t('habilidades.livre')));
    li.setAttribute('aria-label', h ? t('habilidades.tecla', { n: slot + 1 }) + `: ${h.nome}` : t('habilidades.teclaVazia', { n: slot + 1 }));
    if (id) {
      arrastar(li, id);
      const tirar = botao('', `limpar-${slot}`, () => { emitir({ t: 'equiparHabilidade', id: null, slot }); });
      tirar.append(icone('fechar'));
      tirar.setAttribute('aria-label', t('habilidades.tirarDaTecla', { n: slot + 1 }));
      li.append(tirar);
    }
    teclas.append(li);
  }
  barra.append(teclas, status);
  corpo.append(barra);
  const avancado = el('details', 'grimorio-secao');
  avancado.append(el('summary', undefined, t('habilidades.avancado')));
  if (!ui.essenciaInvId) desenharUltimate(avancado, j, ctx, tick, emitir, redesenhar);
  // Marco 24 (D-095): a Sintonia das gerais de tecla e as passivas gerais ligadas.
  desenharSintonia(avancado, j, ctx, tick);
  desenharPassivasGerais(avancado, j, ctx, emitir, redesenhar);
  avancado.append(catalogoCombos(ctx, j));
  // Marco 26 (26/10/2026, D-110): os números da classe (que saíram da escolha) e as afinidades, num bloco dobrável.
  const classe = ctx.conteudo.classes.get(j.classeId ?? bolsa.classeId);
  if (classe) {
    const dom = el('details', 'dom-classe');
    dom.append(el('summary', undefined, t('classe.domTitulo')), el('p', 'detalhe-item', t(`classe.${classe.id}.dom` as ChaveTexto)));
    const afinidades = classe.afinidades.flatMap((a) => descreverBonus(a));
    if (afinidades.length > 0) dom.append(el('p', 'detalhe-item', t('escolhaClasse.afinidades', { lista: afinidades.join('; ') })));
    avancado.append(dom);
  }
  /** Os botões 1 2 3 4 de uma habilidade ativa conhecida: põe na tecla; na tecla em que já está, tira. */
  const botoesDeTecla = (id: string, nome: string): HTMLElement => {
    const grupo = el('div', 'teclas-da-carta');
    grupo.setAttribute('role', 'group');
    grupo.setAttribute('aria-label', t('habilidades.porNaTeclaDe', { nome }));
    grupo.append(el('span', 'detalhe-item', t('habilidades.porNaTecla')));
    for (let slot = 0; slot < SLOTS_BARRA; slot++) {
      const ja = bolsa.barra[slot] === id;
      const b = botao(String(slot + 1), `tecla-${id}-${slot}`, () => {
        emitir({ t: 'equiparHabilidade', id: ja ? null : id, slot });
        redesenhar();
      });
      b.classList.add('botao-tecla');
      b.disabled = !ja && teclaRecusa(ctx, bolsa, slot, id) !== null;
      b.setAttribute('aria-pressed', String(ja));
      b.setAttribute('aria-label', ja ? t('habilidades.tirarDaTecla', { n: slot + 1 }) : t('habilidades.porEmTecla', { n: slot + 1, nome }));
      grupo.append(b);
    }
    return grupo;
  };

  const cartao = (id: string, conhecida: { rank: number; caminhos: string[] } | null): HTMLLIElement | null => {
    const h = conhecida ? compilada(id) : resolverHabilidade(ctx, id);
    if (!h) return null;
    // Marco 53 (D-203): a carta compacta mostra o nome, o grau, a 1ª linha e as teclas; o clique no nome a abre.
    const aberta = ui.expandidas?.has(id) ?? false;
    const li = el('li', `linha-item cartao-habilidade${aberta ? ' aberta' : ' compacta'}`);
    li.dataset.habilidade = id;
    const textos = el('div', 'textos-item');
    const cor = h.elemento ? ctx.conteudo.elementos.get(h.elemento)?.cor : undefined;
    const titulo = el('strong', 'nome-item');
    titulo.append(icone(h.icone), ` ${h.nome}`);
    if (conhecida && !h.passiva && !ui.essenciaInvId) arrastar(titulo, id);
    if (conhecida) titulo.append(el('span', 'grimorio-rank', t('habilidades.rank', { n: conhecida.rank })));
    if (cor) titulo.style.color = cor;
    // Marco 26 (28/10/2026, D-116): a skill de classe leva a runa no nome e no começo da descrição.
    const classeDona = classeDaHabilidade(ctx.conteudo, id);
    comRuna(titulo, classeDona);
    const grau = el('span', `grau-habilidade grau-${h.grau}`, t('habilidades.grau', { grau: h.grau }));
    grau.title = t('habilidades.grauDica', { grau: h.grau, min: Math.round((ticksDeEstudo(ctx, j, id) * DT_MS) / 60000) });
    titulo.append(' ', grau);
    const abrir = el('button', 'abrir-carta', aberta ? '−' : '+');
    abrir.type = 'button';
    abrir.dataset.chave = `abrir-${id}`;
    abrir.setAttribute('aria-expanded', String(aberta));
    abrir.setAttribute('aria-label', t(aberta ? 'habilidades.fecharCarta' : 'habilidades.abrirCarta', { nome: h.nome }));
    const alternar = () => {
      const abertas = (ui.expandidas ??= new Set());
      if (abertas.has(id)) abertas.delete(id);
      else abertas.add(id);
      redesenhar();
    };
    abrir.addEventListener('click', alternar);
    titulo.addEventListener('click', (ev) => { if (ev.target === titulo) alternar(); });
    titulo.append(abrir);
    textos.append(titulo);
    // D-175 (15/11/2026): a história, o que se vê e a receita (o botão +) de toda skill.
    const historia = blocoDaHistoria(ctx, j, id, tick);
    if (historia) textos.append(historia);
    const perfil = perfilPara(ctx, j, h);
    const linhas = descreverHabilidade(h, { rankMax, perfilDanoPct: perfil.danoPct });
    // Marco 28 (D-127): com o que a skill escala e o efeito atual na ficha.
    if (!h.passiva && (h.formulaDano !== null || h.formulaCura !== null)) linhas.push(...linhasDeEscala(ctx, j, h));
    const desc = el('ul', 'descricao-habilidade');
    for (const linha of linhas) desc.append(el('li', undefined, linha));
    const primeira = desc.firstElementChild;
    if (primeira instanceof HTMLElement) comRuna(primeira, classeDona, 12);
    textos.append(desc);
    // Marco 50 (21/11/2026, D-196): a fusão mostra as partes de que nasceu; a skill que pode entrar numa fórmula, a
    // compreensão (o sigilo que se completa com os acertos).
    const partes = definicaoDe(ctx, id)?.fusao;
    if (partes) textos.append(el('p', 'detalhe-item receita-fusao', receitaDaFusao(ctx, partes)));
    if (conhecida && fundivel(ctx, id)) textos.append(sigiloDeCompreensao(compreensaoDe(bolsa, id)));
    // Marco 18 (D-068): os marcos de nível (o do 2 e o do 4); os já alcançados aparecem acesos.
    const marcos = definicaoDe(ctx, id)?.marcos ?? {};
    const listaMarcos = Object.entries(marcos);
    if (listaMarcos.length > 0) {
      const ul = el('ul', 'marcos-habilidade');
      for (const [n, m] of listaMarcos) {
        const li = el('li', (conhecida?.rank ?? 0) >= Number(n) ? 'marco alcancado' : 'marco', t('habilidades.marco', { n, texto: m.texto }));
        ul.append(li);
      }
      textos.append(ul);
    }
    // Marco 40 (D-159): o que cada estilo da classe faz nesta skill.
    const leituras = listaDeLeituras(ctx, j, id);
    if (leituras) textos.append(leituras);
    if (conhecida && conhecida.caminhos.length > 0) {
      const nomes = conhecida.caminhos.map((c) => ctx.conteudo.caminhos.get(c)?.nome ?? c).join(', ');
      textos.append(el('p', 'detalhe-item', t('habilidades.caminhosEscolhidos', { lista: nomes })));
    }
    // Marco 39 (D-151): o encaixe de runa das skills de classe conhecidas.
    const runa = conhecida ? seletorDeRuna(ctx, j, id, tick, emitir, redesenhar) : null;
    if (runa) textos.append(runa);
    li.append(textos);

    const acoes = el('div', 'acoes-habilidade');
    const proximo = (conhecida?.rank ?? 0) + 1;
    const opcoes = caminhosDoRank(ctx, id, proximo);
    if (!conhecida && bolsa.estudo?.id === id) {
      const falta = el('span', 'detalhe-item estudo-restante');
      falta.dataset.estudoRestante = id;
      falta.textContent = t('habilidades.estudando', { tempo: duracaoLegivel(ticksRestantesDoEstudo(bolsa.estudo) * DT_MS) });
      // Marco 25 (D-103): a aceleração corta o tempo; a velocidade só aparece em saves antigos acelerados.
      const velocidade = velocidadeDoEstudo(bolsa.estudo);
      acoes.append(falta, el('span', 'detalhe-item', velocidade > 1 ? t('progressao.velocidadeEstudo', { n: Math.round(velocidade * 100) / 100 }) : t('progressao.acelerarEstudo')));
    } else if (proximo <= rankMax) {
      const essencias = conhecida ? bolsa.mochila.filter((i) => {
        const p = ctx.conteudo.itens.get(i.itemId)?.progressao;
        return i.qtd > 0 && p?.tipo === 'rank' && p.familia === familiaDaHabilidade(ctx, id) && (!ui.essenciaInvId || ui.essenciaInvId === i.invId);
      }) : [];
      const pagamentos: (string | undefined)[] = ui.essenciaInvId ? essencias.map((i) => i.invId) : [undefined, ...essencias.map((i) => i.invId)];
      for (const invId of pagamentos) {
        const entrada = invId ? bolsa.mochila.find((i) => i.invId === invId) : undefined;
        const rotulo = entrada ? t('progressao.usarEssencia', { nome: ctx.conteudo.itens.get(entrada.itemId)?.nome ?? '', rank: proximo })
          : conhecida ? t('progressao.usarPonto', { rank: proximo }) : reaprendivel(bolsa, id) ? t('habilidades.reaprender') : t('habilidades.estudar', { tempo: duracaoLegivel(ticksDeEstudo(ctx, j, id) * DT_MS) });
        const emitirSubida = (caminho?: string) => {
          emitir({ t: 'subirRank', id, rankEsperado: proximo, ...(caminho ? { caminho } : {}), ...(invId ? { invId } : {}) });
          ui.essenciaInvId = null;
        };
        const motivo = motivoParaNaoSubir(ctx, j, id, undefined, invId);
        if (motivo === 'caminho_invalido' && opcoes.length > 0) {
          acoes.append(el('p', 'detalhe-item', rotulo), el('p', 'detalhe-item', t('habilidades.caminhos', { rank: proximo })));
          const grade = el('div', 'caminhos');
          for (const cid of opcoes) {
            const c = ctx.conteudo.caminhos.get(cid);
            if (!c) continue;
            const cartaoCaminho = el('div', 'cartao-caminho');
            const nomeCaminho = el('strong');
            nomeCaminho.append(icone(c.icone), ` ${c.nome}`);
            cartaoCaminho.append(nomeCaminho);
            const lista = el('ul');
            for (const linha of descreverCaminho(c)) lista.append(el('li', undefined, linha));
            cartaoCaminho.append(lista, botao(t('habilidades.escolherCaminho', { nome: c.nome }), `caminho-${id}-${cid}${invId ? '-' + invId : ''}`, () => { emitirSubida(cid); }));
            grade.append(cartaoCaminho);
          }
          acoes.append(grade);
        } else {
          const b = botao(rotulo, `subir-${id}${invId ? '-' + invId : ''}`, () => { emitirSubida(); });
          b.disabled = motivo !== null;
          if (motivo) { b.title = textoDoMotivo(motivo, ctx, id, proximo); acoes.append(el('span', 'detalhe-item motivo', b.title)); }
          acoes.append(b);
        }
      }
    }
    if (conhecida && !h.passiva) acoes.append(botoesDeTecla(id, h.nome));
    li.append(acoes);
    return li;
  };

  const conhecidasVisiveis = bolsa.conhecidas.filter((c) => !ui.essenciaInvId || (familiaSelecionada?.tipo === 'rank' && familiaDaHabilidade(ctx, c.id) === familiaSelecionada.familia));
  if (ui.essenciaInvId && conhecidasVisiveis.length === 0) corpo.append(el('p', 'detalhe-item', t('progressao.semCompativeis')));
  const ativas = conhecidasVisiveis.filter((c) => !resolverHabilidade(ctx, c.id)?.passiva);
  const passivas = conhecidasVisiveis.filter((c) => resolverHabilidade(ctx, c.id)?.passiva);
  const secao = (titulo: string, itens: (HTMLLIElement | null)[], recolher = false) => {
    const presentes = itens.filter((x): x is HTMLLIElement => x !== null);
    if (presentes.length === 0) return;
    const ul = el('ul', 'lista-itens');
    ul.append(...presentes);
    if (!recolher) {
      corpo.append(el('h3', 'subtitulo-modal', titulo), ul);
      return;
    }
    const grupos = (ui.secoesAbertas ??= new Set());
    const bloco = el('details', 'grimorio-secao');
    bloco.open = grupos.has(titulo);
    bloco.addEventListener('toggle', () => { if (bloco.open) grupos.add(titulo); else grupos.delete(titulo); });
    bloco.append(el('summary', undefined, `${titulo} (${presentes.length})`), ul);
    corpo.append(bloco);
  };
  secao(t('habilidades.conhecidas'), ativas.map((c) => cartao(c.id, c)));
  secao(t('habilidades.passivas'), passivas.map((c) => cartao(c.id, c)), !ui.essenciaInvId);
  const novas = (ui.essenciaInvId ? [] : aprendiveisDa(ctx, bolsa)).filter((id) => !bolsa.conhecidas.some((c) => c.id === id));
  secao(t('habilidades.aprendiveis'), novas.map((id) => cartao(id, null)), !bolsa.estudo);
  // Marco 50 (D-196): a fusão em estudo aparece aqui; as novas se fazem na aba Alquimia.
  const estudo = bolsa.estudo;
  if (estudo && ehFusao(estudo.id) && !ui.essenciaInvId) secao(t('habilidades.fusoes'), [cartao(estudo.id, null)]);
  if (!ui.essenciaInvId) corpo.append(avancado);
}

/** Marco 50 (D-196): as partes de que a fusão nasceu, na ordem núcleo, forma e eco. */
function receitaDaFusao(ctx: ContextoSimulacao, partes: readonly string[]): string {
  return t('alquimia.receita', { partes: partes.map((p) => resolverHabilidade(ctx, p)?.nome ?? p).join(' + ') });
}

/** Marco 50 (D-196): o sigilo da compreensão, um anel que se completa (com o número ao lado). */
function sigiloDeCompreensao(pct: number): HTMLElement {
  const caixa = el('div', `sigilo-compreensao${pct >= 100 ? ' completo' : ''}`);
  caixa.style.setProperty('--compreensao', `${String(pct)}%`);
  caixa.append(el('span', 'anel-compreensao'), el('span', 'detalhe-item', t(pct >= 100 ? 'alquimia.compreendida' : 'alquimia.compreensao', { pct })));
  return caixa;
}

/** 08/11/2026: a ultimate de agora no topo da aba, como a carta de uma skill (o texto, o que faz e o par). */
function desenharUltimate(corpo: HTMLElement, j: Entidade, ctx: ContextoSimulacao, tick: number, emitir: (cmd: Comando) => void, redesenhar: () => void): void {
  corpo.append(el('h3', 'subtitulo-modal', t('habilidades.ultimate')));
  const u = ultimateDe(ctx, j);
  const h = u ? resolverHabilidade(ctx, chaveDoAtor(ctx, j, u.id, tick)) : undefined;
  if (!u || !h) {
    corpo.append(el('p', 'detalhe-item', t('habilidades.semUltimate')));
    return;
  }
  const ul = el('ul', 'lista-itens');
  const li = el('li', 'linha-item cartao-habilidade cartao-ultimate');
  li.dataset.habilidade = u.id;
  li.dataset.testid = 'cartao-ultimate';
  const textos = el('div', 'textos-item');
  const titulo = el('strong', 'nome-item');
  titulo.append(icone(h.icone), ` ${h.nome}`);
  const cor = h.elemento ? ctx.conteudo.elementos.get(h.elemento)?.cor : undefined;
  if (cor) titulo.style.color = cor;
  textos.append(titulo, el('p', 'detalhe-item', u.texto));
  const historia = blocoDaHistoria(ctx, j, u.id, tick);
  if (historia) textos.append(historia);
  const desc = el('ul', 'descricao-habilidade');
  const nome = (id: string) => resolverHabilidade(ctx, id)?.nome ?? id;
  // Marco 40 (D-160): a família vem das duas skills das teclas 1 e 2.
  const par = parDaUltimate(j);
  for (const linha of [...descreverHabilidade(h, {}), ...(par ? [t('habilidades.ultimatePar', { a: nome(par[0]), b: nome(par[1]) })] : []), t('habilidades.ultimateCarga')]) desc.append(el('li', undefined, linha));
  textos.append(desc);
  const runa = seletorDeRuna(ctx, j, u.id, tick, emitir, redesenhar);
  if (runa) textos.append(runa);
  li.append(textos);
  ul.append(li);
  corpo.append(ul);
}
