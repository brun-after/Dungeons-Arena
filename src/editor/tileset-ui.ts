// Painel de tileset do editor (§3.10). Marco 11A (16/10/2026), D-066:
// - gerenciar: os atlas guardados neste aparelho (usar nesta fase, excluir) e enviar um novo;
// - novo atlas: imagem (PNG/JPEG/WebP até 2 MB, quadrada), grade 4 ou 5, separação, prévia fatiada e o vínculo
//   peça <-> função tocando a célula (seletor agrupado: Funções / Pisos / Paredes e cantos / Personalizadas, com aviso
//   de chave repetida). Tudo em rascunho até "Salvar tileset";
// - seletor de peça para o pincel;
// - "Copiar prompt para IA": o texto para gerar um atlas fora do jogo (nenhuma IA roda aqui).

import { t, type ChaveTexto } from '../i18n';
import {
  conferirArquivoDeImagem,
  dimensoesDeAtlasOk,
  gravarTileset,
  listarTilesets,
  apagarTileset,
  novoIdDeTileset,
  type RegistroTileset,
} from '../plataforma/tilesets';
import { icone } from '../ui/icones';
import { criarModal } from '../ui/modal';
import { fatiar, GRUPOS_DE_FUNCAO, RE_CHAVE_PECA, vinculosCanonicos, type CelulaAtlas, type GradeAtlas, type RecorteAtlas, type Vinculos } from '../world/tileset';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, classe?: string, texto?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto !== undefined) e.textContent = texto;
  return e;
}

function botao(texto: string, aoClicar: () => void, classe = 'botao-cabecalho'): HTMLButtonElement {
  const b = el('button', classe, texto);
  b.type = 'button';
  b.addEventListener('click', aoClicar);
  return b;
}

/** Modal descartável: some do DOM ao fechar. */
function modalTemporario(titulo: string, classe = 'modal-tileset') {
  const m = criarModal({ titulo, rotuloFechar: t('tileset.fechar'), classe });
  m.dialogo.addEventListener('close', () => {
    m.dialogo.remove();
  });
  return m;
}

async function decodificar(imagem: Blob): Promise<HTMLCanvasElement | null> {
  try {
    const bmp = await createImageBitmap(imagem);
    const c = document.createElement('canvas');
    c.width = bmp.width;
    c.height = bmp.height;
    c.getContext('2d')?.drawImage(bmp, 0, 0);
    bmp.close();
    return c;
  } catch {
    return null;
  }
}

/** O recorte de uma célula como um canvas pequeno (prévia e botões). */
function miniatura(origem: HTMLCanvasElement, r: RecorteAtlas, lado = 44): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = lado;
  c.height = lado;
  c.className = 'miniatura-peca';
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(origem, r.x, r.y, r.largura, r.altura, 0, 0, lado, lado);
  }
  return c;
}

function corMediaDe(origem: HTMLCanvasElement, r: RecorteAtlas | undefined): number {
  const ctx = origem.getContext('2d');
  if (!ctx || !r) return 0x4a4458;
  try {
    const d = ctx.getImageData(r.x, r.y, r.largura, r.altura).data;
    let rs = 0;
    let gs = 0;
    let bs = 0;
    let n = 0;
    for (let i = 0; i < d.length; i += 16) {
      if ((d[i + 3] ?? 0) < 128) continue;
      rs += d[i] ?? 0;
      gs += d[i + 1] ?? 0;
      bs += d[i + 2] ?? 0;
      n++;
    }
    return n === 0 ? 0x4a4458 : (Math.round(rs / n) << 16) | (Math.round(gs / n) << 8) | Math.round(bs / n);
  } catch {
    return 0x4a4458;
  }
}

/** Seletor da função de uma célula do atlas: grupos fixos e uma chave livre. */
function escolherFuncao(vinculos: Vinculos, celula: CelulaAtlas, aoEscolher: (chave: string | null) => void): void {
  const m = modalTemporario(t('tileset.funcaoDaCelula', { celula }));
  const atual = Object.entries(vinculos).find(([, c]) => c === celula)?.[0] ?? '';
  const s = el('select', 'preset-editor');
  s.id = 'funcao-tileset';
  const vazio = el('option', undefined, t('tileset.semFuncao'));
  vazio.value = '';
  s.append(vazio);
  for (const [grupo, chaves] of Object.entries(GRUPOS_DE_FUNCAO)) {
    const og = el('optgroup');
    og.label = t(`tileset.grupo.${grupo}` as ChaveTexto);
    for (const k of chaves) {
      const o = el('option', undefined, k);
      o.value = k;
      og.append(o);
    }
    s.append(og);
  }
  const livres = Object.keys(vinculos).filter((k) => !Object.values(GRUPOS_DE_FUNCAO).some((g) => (g as readonly string[]).includes(k)));
  if (livres.length > 0) {
    const og = el('optgroup');
    og.label = t('tileset.grupo.personalizadas');
    for (const k of livres) {
      const o = el('option', undefined, k);
      o.value = k;
      og.append(o);
    }
    s.append(og);
  }
  s.value = atual;
  const aviso = el('p', 'detalhe-slot');
  aviso.setAttribute('role', 'status');
  const avisar = () => {
    const outra = s.value ? vinculos[s.value] : undefined;
    aviso.textContent = outra && outra !== celula ? t('tileset.chaveRepetida', { chave: s.value, celula: outra }) : '';
  };
  s.addEventListener('change', avisar);
  const livre = el('input', 'preset-editor');
  livre.id = 'chave-livre-tileset';
  livre.placeholder = t('tileset.chaveLivre');
  livre.maxLength = 24;
  const rotulo = el('label', 'campo-inspetor');
  rotulo.htmlFor = s.id;
  rotulo.append(el('span', undefined, t('tileset.funcao')), s);
  const rotuloLivre = el('label', 'campo-inspetor');
  rotuloLivre.htmlFor = livre.id;
  rotuloLivre.append(el('span', undefined, t('tileset.ouChaveLivre')), livre);
  m.corpo.append(
    rotulo,
    rotuloLivre,
    aviso,
    botao(t('tileset.aplicar'), () => {
      const chave = livre.value.trim() || s.value;
      if (livre.value.trim() && !RE_CHAVE_PECA.test(livre.value.trim())) {
        aviso.textContent = t('tileset.chaveInvalida');
        return;
      }
      aoEscolher(chave || null);
      m.fechar();
    }),
  );
  avisar();
  m.abrir();
}

/** Fluxo de atlas novo: tudo em rascunho até salvar. */
function novoTileset(arquivo: File, aoSalvar: (id: string) => void): void {
  const m = modalTemporario(t('tileset.novo'));
  const status = el('p', 'erro-lobby');
  status.setAttribute('role', 'alert');
  m.corpo.append(status);
  m.abrir();
  const erro = conferirArquivoDeImagem(arquivo);
  if (erro) {
    status.textContent = t(`tileset.erro.${erro}` as ChaveTexto);
    return;
  }
  void decodificar(arquivo).then((imagem) => {
    if (!imagem || !dimensoesDeAtlasOk(imagem.width, imagem.height)) {
      status.textContent = t(imagem ? 'tileset.erro.dimensoes' : 'tileset.erro.leitura');
      return;
    }
    let grade: GradeAtlas = 4;
    let separacao = 0;
    let vinculos = vinculosCanonicos(grade);
    const nome = el('input', 'preset-editor');
    nome.id = 'nome-tileset';
    nome.value = arquivo.name.replace(/\.[a-z]+$/i, '').slice(0, 30) || t('tileset.semNome');
    nome.maxLength = 30;
    const seletorGrade = el('select', 'preset-editor');
    seletorGrade.id = 'grade-tileset';
    for (const g of [4, 5]) {
      const o = el('option', undefined, `${g}×${g}`);
      o.value = String(g);
      seletorGrade.append(o);
    }
    const sep = el('input', 'preset-editor');
    sep.id = 'separacao-tileset';
    sep.type = 'number';
    sep.min = '0';
    sep.max = '16';
    sep.value = '0';
    const previa = el('div', 'previa-tileset');
    const desenhar = () => {
      previa.textContent = '';
      const recortes = fatiar(imagem.width, imagem.height, grade, separacao);
      if (!recortes) {
        status.textContent = t('tileset.erro.separacao');
        return;
      }
      status.textContent = '';
      previa.style.gridTemplateColumns = `repeat(${grade}, 1fr)`;
      for (const r of recortes) {
        const celula: CelulaAtlas = `${r.coluna},${r.linha}`;
        const chave = Object.entries(vinculos).find(([, c]) => c === celula)?.[0];
        const b = botao('', () => {
          escolherFuncao(vinculos, celula, (nova) => {
            const semEsta: Vinculos = Object.fromEntries(Object.entries(vinculos).filter(([k, c]) => c !== celula && k !== nova));
            vinculos = nova ? { ...semEsta, [nova]: celula } : semEsta;
            desenhar();
          });
        }, 'celula-tileset');
        b.setAttribute('aria-label', t('tileset.celula', { celula, funcao: chave ?? t('tileset.semFuncao') }));
        b.append(miniatura(imagem, r), el('span', undefined, chave ?? '—'));
        previa.append(b);
      }
    };
    seletorGrade.addEventListener('change', () => {
      grade = seletorGrade.value === '5' ? 5 : 4;
      vinculos = vinculosCanonicos(grade);
      desenhar();
    });
    sep.addEventListener('change', () => {
      separacao = Math.max(0, Math.min(16, Math.round(Number(sep.value) || 0)));
      desenhar();
    });
    const campo = (rotulo: string, entrada: HTMLElement & { id: string }) => {
      const l = el('label', 'campo-inspetor');
      l.htmlFor = entrada.id;
      l.append(el('span', undefined, rotulo), entrada);
      return l;
    };
    m.corpo.append(
      campo(t('tileset.nome'), nome),
      campo(t('tileset.grade'), seletorGrade),
      campo(t('tileset.separacao'), sep),
      el('p', 'detalhe-slot', t('tileset.dicaVinculo')),
      previa,
      botao(
        t('tileset.salvar'),
        () => {
          const recortes = fatiar(imagem.width, imagem.height, grade, separacao);
          const parede = vinculos.parede_N ?? vinculos.parede_int;
          const r = parede ? recortes?.find((x) => `${x.coluna},${x.linha}` === parede) : undefined;
          const registro: RegistroTileset = {
            id: novoIdDeTileset(),
            nome: nome.value.trim() || t('tileset.semNome'),
            grade,
            separacao,
            imagem: arquivo,
            vinculos,
            corParede: corMediaDe(imagem, r),
            atualizadoEm: Date.now(),
          };
          void gravarTileset(registro)
            .then(() => {
              m.fechar();
              aoSalvar(registro.id);
            })
            .catch(() => {
              status.textContent = t('tileset.erro.gravar');
            });
        },
        'botao-menu',
      ),
    );
    desenhar();
  });
}

export interface OpcoesGerenciador {
  /** O atlas desta fase (null = herda). */
  atual: string | null;
  aoEscolher: (id: string | null) => void;
}

/** Os atlas do aparelho: usar nesta fase, voltar a herdar, excluir e enviar um novo. */
export function abrirGerenciadorDeTilesets(o: OpcoesGerenciador): void {
  const m = modalTemporario(t('tileset.titulo'));
  const lista = el('div', 'lista-tilesets');
  const arquivo = el('input');
  arquivo.type = 'file';
  arquivo.accept = 'image/png,image/jpeg,image/webp';
  arquivo.hidden = true;
  arquivo.setAttribute('aria-label', t('tileset.enviar'));
  arquivo.addEventListener('change', () => {
    const f = arquivo.files?.[0];
    if (!f) return;
    m.fechar();
    novoTileset(f, o.aoEscolher);
  });
  const copiar = botao(t('tileset.copiarPrompt'), () => {
    void navigator.clipboard
      .writeText(t('tileset.prompt'))
      .then(() => {
        copiar.textContent = t('tileset.promptCopiado');
      })
      .catch(() => {
        copiar.textContent = t('tileset.promptFalhou');
      });
  });
  m.corpo.append(
    el('p', 'detalhe-slot', t('tileset.explicacao')),
    lista,
    arquivo,
    botao(t('tileset.enviar'), () => {
      arquivo.click();
    }, 'botao-menu'),
    botao(t('tileset.herdar'), () => {
      o.aoEscolher(null);
      m.fechar();
    }),
    copiar,
  );
  m.abrir();
  void listarTilesets()
    .catch(() => [])
    .then((tilesets) => {
      if (tilesets.length === 0) lista.append(el('p', 'detalhe-slot', t('tileset.nenhum')));
      for (const ts of tilesets) {
        const linha = el('div', 'linha-inspetor');
        linha.dataset.tileset = ts.id;
        const usar = botao(ts.id === o.atual ? `${ts.nome} (em uso)` : ts.nome, () => {
          o.aoEscolher(ts.id);
          m.fechar();
        });
        usar.setAttribute('aria-pressed', String(ts.id === o.atual));
        let confirmando = false;
        const excluir = botao('', () => {
          if (!confirmando) {
            confirmando = true;
            excluir.textContent = t('tileset.confirmarExcluir');
            return;
          }
          void apagarTileset(ts.id).then(() => {
            linha.remove();
          });
        });
        excluir.append(icone('fechar'));
        excluir.setAttribute('aria-label', t('tileset.excluir', { nome: ts.nome }));
        linha.append(usar, el('span', 'detalhe-slot', `${ts.grade}×${ts.grade}`), excluir);
        lista.append(linha);
      }
    });
}

/** Seletor de peça para o pincel: as células do atlas com função, e "automático" (sem peça à mão). */
export function abrirSeletorDePeca(registro: RegistroTileset, aoEscolher: (chave: string | null) => void): void {
  const m = modalTemporario(t('tileset.escolherPeca'));
  const grade = el('div', 'previa-tileset');
  grade.style.gridTemplateColumns = `repeat(${registro.grade}, 1fr)`;
  m.corpo.append(
    botao(t('tileset.automatico'), () => {
      aoEscolher(null);
      m.fechar();
    }),
    grade,
  );
  m.abrir();
  void decodificar(registro.imagem).then((imagem) => {
    const recortes = imagem ? fatiar(imagem.width, imagem.height, registro.grade, registro.separacao) : null;
    if (!imagem || !recortes) return;
    for (const [chave, celula] of Object.entries(registro.vinculos).sort(([, a], [, b]) => (a < b ? -1 : 1))) {
      const r = recortes.find((x) => `${x.coluna},${x.linha}` === celula);
      if (!r) continue;
      const b = botao('', () => {
        aoEscolher(chave);
        m.fechar();
      }, 'celula-tileset');
      b.setAttribute('aria-label', chave);
      b.append(miniatura(imagem, r), el('span', undefined, chave));
      grade.append(b);
    }
  });
}
