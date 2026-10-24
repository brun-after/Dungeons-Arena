// HUD do jogador (§2.15): barras de vida e mana com cor por faixa, último d20 (ignorável),
// registro de combate com aria-live e aviso de morte. Só reescreve o DOM quando o valor muda.
// Marco 14 (14/10/2026): os efeitos ativos viram chips com anel de duração e cartão (chips-efeito.ts).

import { t } from '../i18n';
import type { Entidade } from '../entities/entidade';
import { ChipsEfeito } from './chips-efeito';
import { BuffsPendentes } from './buffs-pendentes';
import { icone } from './icones';
import type { DadosRede } from './diagnostico';
import type { IdentidadeClasse } from './barra-classe';

const MAX_LINHAS_LOG = 6;

export function classeDoHp(fracao: number): 'alto' | 'medio' | 'baixo' {
  if (fracao > 0.5) return 'alto';
  if (fracao > 0.25) return 'medio';
  return 'baixo';
}

function barra(classe: string): { raiz: HTMLDivElement; preenchimento: HTMLDivElement } {
  const raiz = document.createElement('div');
  raiz.className = `barra ${classe}`;
  raiz.setAttribute('role', 'meter');
  raiz.setAttribute('aria-valuemin', '0');
  const preenchimento = document.createElement('div');
  preenchimento.className = 'preenchimento';
  raiz.append(preenchimento);
  return { raiz, preenchimento };
}

export class Hud {
  readonly status: HTMLElement;
  readonly log: HTMLElement;
  readonly botaoLog: HTMLButtonElement;
  private readonly morte: HTMLElement;
  private readonly vida = barra('vida');
  private readonly mana = barra('mana');
  /** Marco 21 (D-088): a fúria do Guerreiro; marco 22 (D-089): também a Mira firme do Arqueiro. Escondida nas outras. */
  private readonly classe = barra('classe');
  /** Marco 22 (D-089): o elemento encarnado do Mago. */
  private readonly encarnacao = document.createElement('span');
  private readonly tema = document.createElement('span');
  private readonly numeros = document.createElement('span');
  private readonly rede = document.createElement('span');
  /** Marco 8A: ícones dos efeitos ativos, na cor do registro; marco 14: com duração e cartão. */
  private readonly efeitos = document.createElement('span');
  private readonly chips: ChipsEfeito;
  /** D-067: buffs ofensivos armados e a carga de refúgio. */
  private readonly pendentes: BuffsPendentes;
  private ultimo = '';

  constructor(
    raiz: HTMLElement,
    nomeDe: (id: string) => string | null = () => null,
    /** Marco 18: nome e ícone de uma habilidade (o chip do estudo). */
    habilidade: (id: string) => { nome: string; icone: string } | null = () => null,
  ) {
    this.pendentes = new BuffsPendentes((id) => habilidade(id)?.nome ?? id, (id) => habilidade(id)?.icone ?? 'livro');
    this.status = document.createElement('div');
    this.status.className = 'status-jogador';
    this.numeros.className = 'numeros-vida';
    this.rede.className = 'chip-rede';
    this.rede.hidden = true;
    this.rede.setAttribute('role', 'status');
    const barras = document.createElement('div');
    barras.className = 'barras';
    this.classe.raiz.hidden = true;
    this.classe.raiz.setAttribute('aria-valuemax', '100');
    barras.append(this.vida.raiz, this.mana.raiz, this.classe.raiz);
    this.encarnacao.className = 'chip-encarnacao';
    this.encarnacao.hidden = true;
    this.efeitos.className = 'chips-efeito';
    this.efeitos.setAttribute('aria-label', t('hud.efeitos'));
    this.tema.className = 'chip-tema';
    this.tema.hidden = true;
    this.status.append(barras, this.numeros, this.tema, this.encarnacao, this.efeitos, this.pendentes.elemento, this.rede);
    this.chips = new ChipsEfeito(this.efeitos, nomeDe);

    this.log = document.createElement('ol');
    this.log.className = 'log-combate';
    this.log.setAttribute('aria-live', 'polite');
    this.log.setAttribute('aria-label', t('hud.log'));

    this.botaoLog = document.createElement('button');
    this.botaoLog.type = 'button';
    this.botaoLog.className = 'botao-cabecalho so-toque';
    this.botaoLog.append(icone('registro'));
    this.botaoLog.setAttribute('aria-label', t('hud.abrirLog'));
    this.botaoLog.setAttribute('aria-expanded', 'false');
    this.botaoLog.addEventListener('click', () => {
      const aberto = this.log.classList.toggle('aberto');
      this.botaoLog.setAttribute('aria-expanded', String(aberto));
    });

    this.morte = document.createElement('div');
    this.morte.className = 'aviso-morte';
    this.morte.setAttribute('role', 'alert');
    this.morte.hidden = true;
    const titulo = document.createElement('strong');
    titulo.textContent = t('morte.titulo');
    const detalhe = document.createElement('span');
    detalhe.textContent = t('morte.reviver');
    this.morte.append(titulo, detalhe);

    raiz.append(this.log, this.morte);
  }
  /** Marco 16: desmonta o que prende a página (o ouvinte de teclado dos chips de efeito). */
  destruir(): void {
    this.chips.destruir();
  }


  /** `identidade`: a barra (fúria, mira) e a encarnação da classe (marcos 21 e 22). */
  atualizar(jogador: Entidade | undefined, tick = 0, identidade: IdentidadeClasse = { barra: null, encarnacao: null }): void {
    if (!jogador) return;
    this.chips.atualizar(jogador, tick);
    this.pendentes.atualizar(jogador, tick);
    const { barra: bc, encarnacao, encarnacaoS = 0 } = identidade;
    const pct = bc ? Math.round(bc.fracao * 100) : -1;
    const chave = `${jogador.hp}/${jogador.hpMax}/${jogador.mana}/${jogador.manaMax}/${jogador.morto}/${bc?.tipo ?? ''}${pct}/${encarnacao ?? ''}${encarnacaoS}`;
    if (chave === this.ultimo) return;
    this.ultimo = chave;
    const fracaoVida = jogador.hp / Math.max(1, jogador.hpMax);
    this.vida.preenchimento.style.width = `${fracaoVida * 100}%`;
    this.vida.raiz.dataset.faixa = classeDoHp(fracaoVida);
    this.vida.raiz.setAttribute('aria-valuemax', String(jogador.hpMax));
    this.vida.raiz.setAttribute('aria-valuenow', String(jogador.hp));
    this.vida.raiz.setAttribute('aria-label', t('hud.vida', { atual: jogador.hp, maximo: jogador.hpMax }));
    this.mana.preenchimento.style.width = `${(jogador.mana / Math.max(1, jogador.manaMax)) * 100}%`;
    this.mana.raiz.setAttribute('aria-valuemax', String(jogador.manaMax));
    this.mana.raiz.setAttribute('aria-valuenow', String(jogador.mana));
    this.mana.raiz.setAttribute('aria-label', t('hud.mana', { atual: jogador.mana, maximo: jogador.manaMax }));
    this.classe.raiz.hidden = !bc;
    if (bc) {
      const cheia = pct >= 100;
      this.classe.raiz.dataset.tipo = bc.tipo;
      this.classe.preenchimento.style.width = `${pct}%`;
      this.classe.raiz.dataset.cheia = String(cheia);
      this.classe.raiz.setAttribute('aria-valuenow', String(pct));
      const rotulo = bc.tipo === 'furia' ? (cheia ? 'hud.furiaCheia' : 'hud.furia') : cheia ? 'hud.miraCheia' : 'hud.mira';
      this.classe.raiz.setAttribute('aria-label', t(rotulo, { pct }));
    }
    this.encarnacao.hidden = !encarnacao;
    if (encarnacao) {
      this.encarnacao.dataset.elemento = encarnacao;
      this.encarnacao.textContent = t('hud.encarnacaoTempo', { nome: t(`hud.encarnacao.${encarnacao}`), s: encarnacaoS });
      this.encarnacao.title = t(`hud.encarnacaoDica.${encarnacao}`);
    }
    this.numeros.textContent = `${jogador.hp}/${jogador.hpMax}`;
    this.morte.hidden = !jogador.morto;
  }

  /** Indicador de rede (§2.15): ping e qualidade, só na arena. */
  /** Marco 23 (D-092): o chip do tema da fase (com o clima no tema elemental). */
  mostrarTema(nome: string, dica: string, elemento: string | null): void {
    this.tema.hidden = false;
    this.tema.textContent = nome;
    this.tema.title = dica;
    this.tema.setAttribute('aria-label', dica ? `${nome}: ${dica}` : nome);
    if (elemento) this.tema.dataset.elemento = elemento;
  }

  mostrarRede(r: DadosRede): void {
    const texto = r.conectado ? t('rede.ping', { ms: Math.round(r.rttMs) }) : t('rede.conectando');
    if (this.rede.textContent === texto) return;
    this.rede.hidden = false;
    this.rede.textContent = texto;
    this.rede.dataset.qualidade = !r.conectado ? 'ruim' : r.rttMs <= 150 ? 'boa' : r.rttMs <= 250 ? 'media' : 'ruim';
  }

  registrar(texto: string): void {
    const linha = document.createElement('li');
    linha.textContent = texto;
    this.log.append(linha);
    while (this.log.children.length > MAX_LINHAS_LOG) this.log.firstElementChild?.remove();
  }
}
