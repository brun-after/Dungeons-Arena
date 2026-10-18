// Inspetor do editor (§3.10). Marco 11A (16/10/2026, D-066): abre com a ferramenta "selecionar" ou com toque
// longo e edita o que há na célula — o objeto (conteúdo do baú, estoque da loja, item do loot, armadilha, fonte de
// som, tipo de orbe), o inimigo (tipo, nível, chefe da saída), a tranca da porta de saída e a porta interna. As listas
// vêm do conteúdo; os números têm limites. Cada mudança volta para a tela, que registra no histórico.

import { REGISTRO_EFEITOS, construirEfeito, ehTipoEfeito } from '../combat/registro-efeitos';
import type { Celula } from '../core/comandos';
import type { Conteudo } from '../core/conteudo';
import { t, type ChaveTexto } from '../i18n';
import { icone } from '../ui/icones';
import { criarModal } from '../ui/modal';
import { SONS_DE_FONTE, type PortaSaida } from '../world/fase';
import { marcarChefe } from './ferramentas';
import { chaveDoObjeto, chavesDeOrbe, lerCelula, orbeDaChave, type ConteudoCelula, type FaseEditavel, type ModeloDeObjeto } from './grade';

export interface AcoesInspetor {
  /** Troca o conteúdo da célula (objeto, inimigo) — vira uma entrada do histórico. */
  alterarCelula: (depois: ConteudoCelula) => void;
  /** Muda metadados da fase (tranca, chefe, portas) — retrato de antes e depois no histórico. */
  alterarFase: (mudar: (f: FaseEditavel) => void) => void;
  rotuloDoOrbe: (chave: string) => string;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, classe?: string, texto?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto !== undefined) e.textContent = texto;
  return e;
}

let proximoCampo = 1;

/** Um rótulo e um campo, ligados pelo id. */
function campo(rotulo: string, entrada: HTMLInputElement | HTMLSelectElement): HTMLLabelElement {
  entrada.id = `inspetor-${proximoCampo++}`;
  const l = el('label', 'campo-inspetor');
  l.htmlFor = entrada.id;
  l.append(el('span', undefined, rotulo), entrada);
  return l;
}

function seletor(opcoes: readonly (readonly [string, string])[], valor: string): HTMLSelectElement {
  const s = el('select', 'preset-editor');
  for (const [v, texto] of opcoes) {
    const o = el('option', undefined, texto);
    o.value = v;
    s.append(o);
  }
  s.value = valor;
  return s;
}

function numero(valor: number, min: number, max: number, passo = 1): HTMLInputElement {
  const i = el('input', 'preset-editor');
  i.type = 'number';
  i.min = String(min);
  i.max = String(max);
  i.step = String(passo);
  i.value = String(valor);
  return i;
}

const limitar = (v: string, min: number, max: number, padrao: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : padrao;
};

/** Lista de ids de item editável (baú, loja): cada linha com remover, e um seletor para acrescentar. */
function listaDeItens(itens: readonly (readonly [string, string])[], atual: readonly string[], aoMudar: (lista: string[]) => void): HTMLElement {
  const caixa = el('div', 'lista-inspetor');
  let lista = [...atual];
  const nomeDe = (id: string) => itens.find(([v]) => v === id)?.[1] ?? id;
  const desenhar = () => {
    caixa.textContent = '';
    lista.forEach((id, i) => {
      const linha = el('div', 'linha-inspetor');
      const tirar = el('button', 'botao-cabecalho');
      tirar.append(icone('fechar'));
      tirar.type = 'button';
      tirar.setAttribute('aria-label', t('inspetor.tirarItem', { item: nomeDe(id) }));
      tirar.addEventListener('click', () => {
        lista = lista.filter((_, j) => j !== i);
        aoMudar(lista);
        desenhar();
      });
      linha.append(el('span', undefined, nomeDe(id)), tirar);
      caixa.append(linha);
    });
    if (lista.length >= 20) return;
    const novo = seletor([['', t('inspetor.adicionarItem')], ...itens], '');
    novo.setAttribute('aria-label', t('inspetor.adicionarItem'));
    novo.addEventListener('change', () => {
      if (!novo.value) return;
      lista = [...lista, novo.value];
      aoMudar(lista);
      desenhar();
    });
    caixa.append(novo);
  };
  desenhar();
  return caixa;
}

/** Os campos de um objeto; cada mudança chama `aplicar` com o modelo novo. */
function camposDoObjeto(o: ModeloDeObjeto, conteudo: Conteudo, acoes: AcoesInspetor, aplicar: (m: ModeloDeObjeto) => void): HTMLElement[] {
  const itens = [...conteudo.itens.values()].map((i) => [i.id, i.nome] as const);
  const chaves = [...conteudo.itens.values()].filter((i) => i.tipo === 'chave').map((i) => [i.id, i.nome] as const);
  const efeitos = Object.values(REGISTRO_EFEITOS)
    .filter((d) => d.elegivelParaOrbe)
    .map((d) => [d.id, t(`efeito.${d.id}` as ChaveTexto)] as const);
  switch (o.tipo) {
    case 'santuario': return [];
    case 'orbe_hp':
    case 'orbe_recurso':
    case 'orbe_efeito': {
      const s = seletor(
        chavesDeOrbe().map((k) => [k, acoes.rotuloDoOrbe(k)] as const),
        chaveDoObjeto(o),
      );
      s.addEventListener('change', () => {
        const m = orbeDaChave(s.value);
        if (m) aplicar(m);
      });
      return [campo(t('inspetor.orbe'), s)];
    }
    case 'bau': {
      const ouro = numero(o.ouro, 0, 9999);
      ouro.addEventListener('change', () => {
        aplicar({ ...o, ouro: Math.round(limitar(ouro.value, 0, 9999, o.ouro)) });
      });
      const chave = seletor([['', t('inspetor.semChave')], ...chaves], o.chave ?? '');
      chave.addEventListener('change', () => {
        const resto = { tipo: o.tipo, loot: o.loot, ouro: o.ouro };
        aplicar(chave.value ? { ...resto, chave: chave.value } : resto);
      });
      return [
        el('h3', undefined, t('inspetor.conteudo')),
        listaDeItens(itens, o.loot, (loot) => {
          aplicar({ ...o, loot });
        }),
        campo(t('inspetor.ouro'), ouro),
        campo(t('inspetor.trancaDoBau'), chave),
      ];
    }
    case 'loja':
      return [
        el('h3', undefined, t('inspetor.estoque')),
        listaDeItens(itens, o.estoque, (estoque) => {
          aplicar({ ...o, estoque });
        }),
      ];
    case 'loot': {
      const item = seletor(itens, o.itemId);
      const qtd = numero(o.quantidade, 1, 99);
      const mudar = () => {
        aplicar({ ...o, itemId: item.value, quantidade: Math.round(limitar(qtd.value, 1, 99, 1)) });
      };
      item.addEventListener('change', mudar);
      qtd.addEventListener('change', mudar);
      return [campo(t('inspetor.item'), item), campo(t('inspetor.quantidade'), qtd)];
    }
    case 'armadilha': {
      const valor = numero(o.valor, 0, 200);
      const modo = seletor(
        [
          ['unica', t('inspetor.armadilhaUnica')],
          ['rearme', t('inspetor.armadilhaRearme')],
        ],
        o.modo,
      );
      const efeito = seletor([['', t('inspetor.semEfeito')], ...efeitos], o.efeito?.tipo ?? '');
      const mudar = () => {
        const tipo = efeito.value;
        aplicar({
          tipo: 'armadilha',
          valor: Math.round(limitar(valor.value, 0, 200, 6)),
          modo: modo.value === 'rearme' ? 'rearme' : 'unica',
          ...(modo.value === 'rearme' && { rearmeMs: o.rearmeMs ?? 8000 }),
          ...(ehTipoEfeito(tipo) && { efeito: construirEfeito(tipo) }),
        });
      };
      for (const c of [valor, modo, efeito]) c.addEventListener('change', mudar);
      return [campo(t('inspetor.dano'), valor), campo(t('inspetor.modo'), modo), campo(t('inspetor.efeito'), efeito)];
    }
    case 'fonte_som': {
      const som = seletor(
        SONS_DE_FONTE.map((s) => [s, t(`inspetor.som.${s}` as ChaveTexto)] as const),
        o.sfxId,
      );
      const raio = numero(o.raio, 1, 20);
      const volume = numero(Math.round(o.volume * 100), 0, 100, 5);
      const mudar = () => {
        aplicar({ tipo: 'fonte_som', sfxId: SONS_DE_FONTE.find((s) => s === som.value) ?? o.sfxId, raio: Math.round(limitar(raio.value, 1, 20, 6)), volume: limitar(volume.value, 0, 100, 50) / 100 });
      };
      for (const c of [som, raio, volume]) c.addEventListener('change', mudar);
      return [campo(t('inspetor.som'), som), campo(t('inspetor.raio'), raio), campo(t('inspetor.volume'), volume)];
    }
  }
}

/** Abre o inspetor da célula; null se não há nada para inspecionar ali. */
export function abrirInspetor(f: FaseEditavel, c: Celula, conteudo: Conteudo, acoes: AcoesInspetor): boolean {
  const atual = lerCelula(f, c.x, c.y);
  const porta = f.portasInternas.find((p) => (p.a.x === c.x && p.a.y === c.y) || (p.b.x === c.x && p.b.y === c.y));
  const saida = atual.tipo === 'saida';
  if (!atual.objeto && !atual.inimigo && !porta && !saida) return false;
  const modal = criarModal({ titulo: t('inspetor.titulo', { x: c.x, y: c.y }), rotuloFechar: t('inspetor.fechar'), classe: 'modal-inspetor' });
  const corpo = modal.corpo;
  let celula = atual;
  const trocar = (depois: ConteudoCelula) => {
    celula = depois;
    acoes.alterarCelula(depois);
  };

  if (celula.objeto) {
    const objeto = celula.objeto;
    corpo.append(el('h3', undefined, t(`inspetor.tipo.${objeto.tipo}` as ChaveTexto)));
    corpo.append(
      ...camposDoObjeto(objeto, conteudo, acoes, (m) => {
        trocar({ ...celula, objeto: m });
      }),
    );
    const tirar = el('button', 'botao-cabecalho perigo', t('inspetor.removerObjeto'));
    tirar.type = 'button';
    tirar.addEventListener('click', () => {
      trocar({ ...celula, objeto: null });
      modal.fechar();
    });
    corpo.append(tirar);
  }

  if (celula.inimigo) {
    const inimigo = celula.inimigo;
    const presets = [...conteudo.presets.values()].filter((p) => p.invocacao === null).map((p) => [p.id, p.nome] as const);
    const preset = seletor(presets, inimigo.preset);
    const nivel = numero(inimigo.nivel ?? 1, 1, 30);
    const mudar = () => {
      const n = Math.round(limitar(nivel.value, 1, 30, 1));
      const resto = { preset: preset.value, x: inimigo.x, y: inimigo.y, ...(inimigo.hpBase !== undefined && { hpBase: inimigo.hpBase }), ...(inimigo.habilidades && { habilidades: [...inimigo.habilidades] }) };
      trocar({ ...celula, inimigo: n > 1 ? { ...resto, nivel: n } : resto });
    };
    preset.addEventListener('change', mudar);
    nivel.addEventListener('change', mudar);
    const s = f.portaSaida;
    const ehChefe = el('input');
    ehChefe.type = 'checkbox';
    ehChefe.checked = s?.tranca === 'boss' && s.chefe?.x === c.x && s.chefe.y === c.y;
    ehChefe.addEventListener('change', () => {
      acoes.alterarFase((g) => {
        marcarChefe(g, c, ehChefe.checked);
      });
    });
    corpo.append(el('h3', undefined, t('inspetor.inimigo')), campo(t('inspetor.tipoInimigo'), preset), campo(t('inspetor.nivel'), nivel), campo(t('inspetor.chefe'), ehChefe));
  }

  if (saida) {
    const s = f.portaSaida && f.portaSaida.x === c.x && f.portaSaida.y === c.y ? f.portaSaida : null;
    const chaves = [...conteudo.itens.values()].filter((i) => i.tipo === 'chave').map((i) => [i.id, i.nome] as const);
    const tranca = seletor(
      (['livre', 'chave', 'boss'] as const).map((v) => [v, t(`inspetor.tranca.${v}`)] as const),
      s?.tranca ?? 'livre',
    );
    const chave = seletor(chaves, s?.chave ?? chaves[0]?.[0] ?? '');
    const atualizar = () => {
      chave.disabled = tranca.value !== 'chave';
    };
    const mudar = () => {
      atualizar();
      const valor = tranca.value as PortaSaida['tranca'];
      acoes.alterarFase((g) => {
        const anterior = g.portaSaida;
        g.portaSaida =
          valor === 'chave'
            ? { x: c.x, y: c.y, tranca: 'chave', chave: chave.value }
            : valor === 'boss'
              ? { x: c.x, y: c.y, tranca: 'boss', ...(anterior?.chefe && { chefe: { ...anterior.chefe } }) }
              : { x: c.x, y: c.y, tranca: 'livre' };
      });
    };
    tranca.addEventListener('change', mudar);
    chave.addEventListener('change', mudar);
    atualizar();
    corpo.append(el('h3', undefined, t('inspetor.saida')), campo(t('inspetor.tranca'), tranca), campo(t('inspetor.chaveDaSaida'), chave), el('p', 'detalhe-slot', t('inspetor.dicaChefe')));
  }

  if (porta) {
    const nome = el('input', 'preset-editor');
    nome.value = porta.nome;
    nome.maxLength = 30;
    nome.addEventListener('change', () => {
      acoes.alterarFase((g) => {
        const p = g.portasInternas.find((x) => x.numero === porta.numero);
        if (p) p.nome = nome.value.trim() || p.nome;
      });
    });
    const tirar = el('button', 'botao-cabecalho perigo', t('inspetor.removerPorta'));
    tirar.type = 'button';
    tirar.addEventListener('click', () => {
      acoes.alterarFase((g) => {
        g.portasInternas = g.portasInternas.filter((x) => x.numero !== porta.numero);
      });
      modal.fechar();
    });
    corpo.append(el('h3', undefined, t('inspetor.porta', { n: porta.numero })), campo(t('inspetor.nomeDaPorta'), nome), tirar);
  }

  modal.dialogo.addEventListener('close', () => {
    modal.dialogo.remove();
  });
  modal.abrir();
  return true;
}
