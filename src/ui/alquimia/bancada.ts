// Marco 50 (21/11/2026, D-196): a aba Alquimia, a bancada de transmutação. As skills que podem entrar numa fórmula
// aparecem como orbes na cor do elemento, com a compreensão em volta. Arrastar um orbe até um vértice (núcleo,
// forma, eco) o põe ali; tocar põe no próximo livre. As runas e o material vêm da mochila e vão para os encaixes do
// anel. O círculo reage à mistura, a prévia compara a magia nova com as partes, e "Transmutar" emite `fundir` (a
// simulação confere tudo de novo). Só lê o estado e emite comandos.

import { resolverHabilidade } from '../../combat/compilar-habilidade';
import { ehFusao } from '../../combat/fusao/receita';
import type { Comando } from '../../core/comandos';
import type { ContextoSimulacao } from '../../core/contexto';
import type { Entidade, ItemNaMochila } from '../../entities/entidade';
import { t, type ChaveTexto } from '../../i18n';
import { compreensaoDe, elementoDaRuna, encaixesDeRuna, fundivel, ID_RUNA_CURINGA, montarFusao } from '../../progression/alquimia';
import { icone, iconeDoItem } from '../icones';
import { tornarAlvo, tornarArrastavel } from './arrastar';
import { conferirBancada, misturaProvisoria, partesDa, type EstadoBancada } from './bancada-estado';
import { desenharCaderno } from './caderno';
import { ANGULOS_DOS_VERTICES, criarCirculo, type TomDoCirculo } from './circulo';
import { desenharPrevia } from './previa';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, classe?: string, texto?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto !== undefined) e.textContent = texto;
  return e;
}

function botao(texto: string, chave: string, aoClicar: () => void, classe = 'botao-cabecalho'): HTMLButtonElement {
  const b = el('button', classe, texto);
  b.type = 'button';
  b.dataset.chave = chave;
  b.addEventListener('click', aoClicar);
  return b;
}

const TAMANHO_CIRCULO = 280;

/** Põe a skill num vértice (ou no próximo livre); se ela já estava noutro, sai de lá. */
function colocar(b: EstadoBancada, id: string, vertice?: number): void {
  b.vertices = b.vertices.map((v) => (v === id ? null : v));
  const alvo = vertice ?? b.vertices.findIndex((v) => v === null);
  b.vertices[alvo >= 0 ? alvo : b.vertices.length - 1] = id;
}

export function desenharAlquimia(corpo: HTMLElement, j: Entidade, ctx: ContextoSimulacao, emitir: (cmd: Comando) => void, b: EstadoBancada, redesenhar: () => void): void {
  const bolsa = j.bolsa;
  if (!bolsa) return;
  conferirBancada(bolsa, b);
  corpo.append(el('h3', 'subtitulo-modal', t('alquimia.titulo')));
  corpo.append(el('p', 'detalhe-item', t('alquimia.intro')));
  if (bolsa.estudo) corpo.append(el('p', 'detalhe-item aviso-alquimia', t('alquimia.estudoEmCurso')));

  const provisoria = misturaProvisoria(ctx, bolsa, b);
  const pedido = { partes: partesDa(b), runas: b.runas, material: b.material };
  const montagem = provisoria ? montarFusao(ctx, bolsa, pedido) : null;
  const motivo = typeof montagem === 'string' ? montagem : bolsa.estudo && montagem ? 'estudando' : null;
  const m = provisoria?.mistura;
  const tom: TomDoCirculo = !m ? (partesDa(b).length ? 'neutro' : 'vazio') : m.ressonante ? 'ressonante' : m.instaveis > 0 ? 'instavel' : 'neutro';
  const corDe = (id: string | null) => {
    const el2 = id ? resolverHabilidade(ctx, id)?.elemento : null;
    return el2 ? ctx.conteudo.elementos.get(el2)?.cor ?? '#d8d0e8' : id ? '#d8d0e8' : null;
  };

  const mesa = el('div', 'bancada-alquimia');
  mesa.dataset.tom = tom;

  // O grimório: os orbes das skills que podem entrar numa fórmula.
  const grimorio = el('section', 'grimorio-alquimia');
  grimorio.append(el('h4', 'subtitulo-modal', t('alquimia.grimorio')));
  const orbes = el('div', 'orbes-alquimia');
  const fundiveis = bolsa.conhecidas.filter((c) => fundivel(ctx, c.id));
  for (const c of fundiveis) {
    const h = resolverHabilidade(ctx, c.id);
    if (!h) continue;
    const pct = compreensaoDe(bolsa, c.id);
    const orbe = el('button', `orbe-skill${pct < 100 ? ' bloqueado' : ''}${b.vertices.includes(c.id) ? ' na-bancada' : ''}${ehFusao(c.id) ? ' orbe-fusao' : ''}`);
    orbe.type = 'button';
    orbe.dataset.chave = `orbe-${c.id}`;
    orbe.dataset.habilidade = c.id;
    orbe.style.setProperty('--cor-elemento', corDe(c.id) ?? '#d8d0e8');
    orbe.style.setProperty('--compreensao', `${String(pct)}%`);
    orbe.title = t(pct < 100 ? 'alquimia.orbeBloqueado' : 'alquimia.orbe', { nome: h.nome, pct });
    orbe.append(icone(h.icone), el('span', 'nome-orbe', h.nome));
    tornarArrastavel(orbe, {
      tipo: 'skill',
      aoTocar: () => { colocar(b, c.id); redesenhar(); },
      aoSoltar: (alvo) => { colocar(b, c.id, Number(alvo.dataset.vertice)); redesenhar(); },
    });
    orbes.append(orbe);
  }
  if (fundiveis.length === 0) orbes.append(el('p', 'detalhe-item', t('alquimia.semSkills')));
  grimorio.append(orbes);

  // O círculo: o canvas vivo e, por cima, os três vértices e os encaixes do anel.
  const roda = el('section', 'roda-alquimia');
  const palco = el('div', 'palco-circulo');
  palco.style.setProperty('--tamanho', `${String(TAMANHO_CIRCULO)}px`);
  const circulo = criarCirculo(TAMANHO_CIRCULO, () => ({ vertices: b.vertices.map(corDe), tom, runas: b.runas, material: b.material }));
  palco.append(circulo.elemento);
  b.vertices.forEach((id, i) => {
    const ang = ANGULOS_DOS_VERTICES[i] ?? 0;
    const v = el('button', `vertice-alquimia${id ? ' ocupado' : ''}`);
    v.type = 'button';
    v.dataset.chave = `vertice-${String(i)}`;
    v.dataset.vertice = String(i);
    v.style.left = `${String(50 + Math.cos(ang) * 36)}%`;
    v.style.top = `${String(50 + Math.sin(ang) * 36)}%`;
    tornarAlvo(v, `vertice-${String(i)}`, ['skill']);
    const nomeVertice = t(`alquimia.vertice.${String(i)}` as ChaveTexto);
    const h = id ? resolverHabilidade(ctx, id) : undefined;
    v.title = `${nomeVertice}: ${t(`alquimia.vertice.dica.${String(i)}` as ChaveTexto)}`;
    v.setAttribute('aria-label', h ? t('alquimia.tirar', { nome: h.nome }) : t('alquimia.verticeVazio', { vertice: nomeVertice }));
    if (h) {
      v.style.setProperty('--cor-elemento', corDe(id) ?? '#d8d0e8');
      v.append(icone(h.icone));
    }
    v.append(el('span', 'rotulo-vertice', nomeVertice));
    v.addEventListener('click', () => {
      if (!id) return;
      b.vertices[i] = null;
      redesenhar();
    });
    palco.append(v);
  });
  roda.append(palco);

  // Os encaixes do anel: o material (1) e as runas (1 no par, 2 no trio).
  const encaixes = el('div', 'encaixes-alquimia');
  const nPartes = Math.max(2, provisoria?.receita.partes.length ?? partesDa(b).length);
  const nRunas = encaixesDeRuna(ctx, nPartes);
  const encaixe = (nome: string, aceita: string, invId: string | null, aoTirar: () => void) => {
    const e = el('button', `encaixe-alquimia${invId ? ' ocupado' : ''}`);
    e.type = 'button';
    e.dataset.chave = nome;
    tornarAlvo(e, nome, [aceita]);
    const item = invId ? bolsa.mochila.find((i) => i.invId === invId) : undefined;
    const def = item ? ctx.conteudo.itens.get(item.itemId) : undefined;
    if (def) {
      e.append(iconeDoItem(def.id), el('span', 'detalhe-item', def.nome));
      e.title = t('alquimia.tirar', { nome: def.nome });
      e.addEventListener('click', () => { aoTirar(); redesenhar(); });
    } else e.append(el('span', 'detalhe-item', t('alquimia.encaixeVazio')));
    return e;
  };
  const caixaMaterial = el('div', 'grupo-encaixe');
  caixaMaterial.append(el('span', 'rotulo-encaixe', t('alquimia.material')), encaixe('encaixe-material', 'material', b.material, () => { b.material = null; }));
  const caixaRunas = el('div', 'grupo-encaixe');
  caixaRunas.append(el('span', 'rotulo-encaixe', t('alquimia.runas', { n: nRunas, s: nRunas > 1 ? 's' : '' })));
  for (let i = 0; i < nRunas; i++) caixaRunas.append(encaixe(`encaixe-runa-${String(i)}`, 'runa', b.runas[i] ?? null, () => { b.runas.splice(i, 1); }));
  encaixes.append(caixaMaterial, caixaRunas);
  roda.append(encaixes);

  // Os botões.
  const acoes = el('div', 'acoes-alquimia');
  acoes.append(botao(t('alquimia.esvaziar'), 'esvaziar-circulo', () => {
    b.vertices = [null, null, null];
    b.runas = [];
    b.material = null;
    redesenhar();
  }));
  const pode = !!provisoria && montagem !== null && typeof montagem !== 'string' && !bolsa.estudo;
  const transmutar = botao(t('alquimia.transmutar'), 'transmutar', () => {
    if (!pode) return;
    circulo.transmutar();
    transmutar.disabled = true;
    transmutar.textContent = t('alquimia.transmutando');
    const cmd: Comando = { t: 'fundir', partes: [...pedido.partes], runas: [...pedido.runas], material: pedido.material };
    // O clarão corre antes; a bancada esvazia quando a ficha mudar (as partes saem da bolsa).
    setTimeout(() => { emitir(cmd); }, 700);
  }, 'botao-cabecalho botao-transmutar');
  transmutar.disabled = !pode;
  if (motivo) transmutar.title = t(`habilidades.motivo.${motivo}` as ChaveTexto);
  acoes.append(transmutar);
  roda.append(acoes);

  mesa.append(grimorio, roda, desenharPrevia(ctx, j, provisoria, motivo));
  corpo.append(mesa);

  // A bandeja: as runas elementais e os materiais alquímicos da mochila.
  const bandeja = el('section', 'bandeja-alquimia');
  const ehRuna = (i: ItemNaMochila) => i.itemId === ID_RUNA_CURINGA || elementoDaRuna(i.itemId) !== null;
  const runas = bolsa.mochila.filter(ehRuna);
  const materiais = bolsa.mochila.filter((i) => ctx.conteudo.alquimia.materiais.has(i.itemId));
  const peca = (i: ItemNaMochila, tipo: 'runa' | 'material') => {
    const def = ctx.conteudo.itens.get(i.itemId);
    const usadas = tipo === 'runa' ? b.runas.filter((x) => x === i.invId).length : b.material === i.invId ? 1 : 0;
    const p = el('button', `peca-alquimia peca-${tipo}${usadas >= i.qtd ? ' usada' : ''}`);
    p.type = 'button';
    p.dataset.chave = `peca-${i.invId}`;
    const elemento = elementoDaRuna(i.itemId);
    const cor = elemento ? ctx.conteudo.elementos.get(elemento)?.cor : undefined;
    if (cor) p.style.setProperty('--cor-elemento', cor);
    p.append(iconeDoItem(i.itemId), el('span', 'detalhe-item', `${def?.nome ?? i.itemId}${i.qtd > 1 ? ` ×${String(i.qtd)}` : ''}`));
    const texto = tipo === 'material' ? ctx.conteudo.alquimia.materiais.get(i.itemId)?.texto : def?.descricao;
    if (texto) p.title = texto;
    const por = () => {
      if (usadas >= i.qtd) return;
      if (tipo === 'material') b.material = i.invId;
      else if (b.runas.length < nRunas) b.runas.push(i.invId);
      else b.runas[nRunas - 1] = i.invId;
      redesenhar();
    };
    tornarArrastavel(p, { tipo, aoTocar: por, aoSoltar: por });
    return p;
  };
  const linhaRunas = el('div', 'linha-bandeja');
  linhaRunas.append(el('h4', 'subtitulo-modal', t('runa.bandeja')));
  if (runas.length) for (const i of runas) linhaRunas.append(peca(i, 'runa'));
  else linhaRunas.append(el('p', 'detalhe-item', t('alquimia.semRunas')));
  const linhaMateriais = el('div', 'linha-bandeja');
  linhaMateriais.append(el('h4', 'subtitulo-modal', t('alquimia.material')));
  if (materiais.length) for (const i of materiais) linhaMateriais.append(peca(i, 'material'));
  else linhaMateriais.append(el('p', 'detalhe-item', t('alquimia.semMateriais')));
  bandeja.append(linhaRunas, linhaMateriais);
  corpo.append(bandeja);
  corpo.append(desenharCaderno(ctx, j));
}
