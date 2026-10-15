// Efeitos legíveis no HUD (D-057, D-059). Marco 14 (14/10/2026).
// Cada efeito ativo do jogador vira um chip com o ícone, um anel que esvazia com a duração e os segundos que
// faltam. Tocar, passar o mouse ou focar abre o cartão: o nome, o que faz (com os números) e de quem veio.
// O chip é um botão (alcançável pelo teclado); o cartão é ligado a ele por `aria-describedby`.

import { REGISTRO_EFEITOS } from '../combat/registro-efeitos';
import { DT_MS } from '../core/loop';
import type { EfeitoAtivo, Entidade } from '../entities/entidade';
import { t } from '../i18n';
import { descreverEfeito, nomeDoEfeito, segundos } from './descrever';

interface Chip {
  botao: HTMLButtonElement;
  restante: HTMLSpanElement;
  ultimo: string;
}

let proximoId = 1;

export class ChipsEfeito {
  private readonly chips = new Map<string, Chip>();
  private readonly cartao = document.createElement('div');
  private aberto: string | null = null;
  private ultimoTick = 0;
  private ultimoJogador: Entidade | null = null;

  constructor(
    private readonly lista: HTMLElement,
    /** Nome de quem aplicou (entidade no estado), para a linha "De: …". */
    private readonly nomeDe: (id: string) => string | null,
  ) {
    this.cartao.className = 'cartao-efeito';
    this.cartao.id = `cartao-efeito-${proximoId++}`;
    this.cartao.setAttribute('role', 'tooltip');
    this.cartao.hidden = true;
    lista.after(this.cartao);
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && this.aberto) this.fechar();
    });
  }

  private abrir(tipo: string): void {
    this.aberto = tipo;
    this.desenharCartao();
  }

  private fechar(): void {
    this.aberto = null;
    this.cartao.hidden = true;
    for (const c of this.chips.values()) c.botao.setAttribute('aria-expanded', 'false');
  }

  private desenharCartao(): void {
    const e = this.ultimoJogador;
    const f = e?.efeitos.find((x) => x.tipo === this.aberto && x.ateTick > this.ultimoTick);
    if (!f) {
      this.fechar();
      return;
    }
    this.cartao.textContent = '';
    const titulo = document.createElement('strong');
    titulo.textContent = `${REGISTRO_EFEITOS[f.tipo].icone} ${nomeDoEfeito(f.tipo)}`;
    const desc = document.createElement('p');
    desc.textContent = this.descricao(f);
    this.cartao.append(titulo, desc);
    const origem = this.nomeDe(f.origemId);
    if (origem) {
      const de = document.createElement('p');
      de.className = 'origem';
      de.textContent = t('cartao.origem', { nome: origem });
      this.cartao.append(de);
    }
    this.cartao.hidden = false;
    for (const [tipo, c] of this.chips) c.botao.setAttribute('aria-expanded', String(tipo === this.aberto));
  }

  /** O que o efeito faz agora: com o tempo que falta e os acúmulos. */
  private descricao(f: EfeitoAtivo): string {
    const texto = descreverEfeito({ ...f, duracaoMs: (f.ateTick - this.ultimoTick) * DT_MS });
    return f.acumulos > 1 ? t('desc.acumulos', { texto, n: f.acumulos }) : texto;
  }

  private criarChip(tipo: EfeitoAtivo['tipo']): Chip {
    const d = REGISTRO_EFEITOS[tipo];
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = d.positivo ? 'chip-efeito positivo' : 'chip-efeito negativo';
    botao.style.setProperty('--cor', d.cor);
    botao.dataset.efeito = tipo;
    botao.setAttribute('aria-describedby', this.cartao.id);
    botao.setAttribute('aria-expanded', 'false');
    const icone = document.createElement('span');
    icone.className = 'icone';
    icone.textContent = d.icone;
    const restante = document.createElement('span');
    restante.className = 'restante';
    botao.append(icone, restante);
    botao.addEventListener('click', () => {
      if (this.aberto === tipo) this.fechar();
      else this.abrir(tipo);
    });
    botao.addEventListener('mouseenter', () => {
      this.abrir(tipo);
    });
    botao.addEventListener('mouseleave', () => {
      this.fechar();
    });
    botao.addEventListener('focus', () => {
      this.abrir(tipo);
    });
    botao.addEventListener('blur', () => {
      this.fechar();
    });
    return { botao, restante, ultimo: '' };
  }

  atualizar(e: Entidade, tick: number): void {
    this.ultimoTick = tick;
    this.ultimoJogador = e;
    const ativos = e.efeitos.filter((f) => f.ateTick > tick);
    const tipos = new Set(ativos.map((f) => f.tipo));
    for (const [tipo, c] of this.chips) {
      if (tipos.has(tipo as EfeitoAtivo['tipo'])) continue;
      c.botao.remove();
      this.chips.delete(tipo);
      if (this.aberto === tipo) this.fechar();
    }
    for (const f of ativos) {
      let c = this.chips.get(f.tipo);
      if (!c) {
        c = this.criarChip(f.tipo);
        this.chips.set(f.tipo, c);
        this.lista.append(c.botao);
      }
      const total = Math.max(1, f.ateTick - f.inicioTick);
      const resta = Math.max(0, Math.min(1, (f.ateTick - tick) / total));
      const s = segundos(Math.ceil(((f.ateTick - tick) * DT_MS) / 1000) * 1000);
      const chave = `${resta.toFixed(2)}/${s}/${f.acumulos}`;
      if (chave === c.ultimo) continue;
      c.ultimo = chave;
      c.botao.style.setProperty('--resto', resta.toFixed(3));
      c.restante.textContent = f.acumulos > 1 ? `${s}·${f.acumulos}` : s;
      const rotulo = `${nomeDoEfeito(f.tipo)}, ${t('hud.restante', { s })}`;
      c.botao.setAttribute('aria-label', rotulo);
      c.botao.title = rotulo;
    }
    if (this.aberto) this.desenharCartao();
  }
}
