// O diretor das assinaturas (marco 26, 29/10/2026, D-124). Junta o pincel das silhuetas (acima das entidades), as
// marcas do chão (abaixo delas) e os deslizes, e entrega às assinaturas a cena (`CenaVfx`) com as posições vivas.
// Quem decide quando cada fase acontece é render/efeitos-habilidade.ts, pelos eventos da simulação.

import type { Container } from 'pixi.js';
import type { AssinaturaVisual, VarianteVisual } from '../../combat/assinaturas-visuais';
import type { CausaDeslocamento } from '../../core/eventos-simulacao';
import type { PontoVisual } from '../../entities/entidade';
import type { ControladorImpacto } from '../impacto';
import type { SistemaParticulas } from '../particulas';
import { ASSINATURAS, VARIANTES } from './assinaturas';
import { circuloNoChao, clarao, ondaDeChoque, sortear } from './blocos';
import type { Acerto, AreaVfx, CenaVfx, DefAssinatura, EmSi, P } from './cena';
import { Deslizes } from './deslizes';
import { formaNaArea, formaNaConjuracao, formaNoAcerto, type FormaVisual } from './manifestacao-forma';
import { COR_DA_RUNA, ehClasseComRuna, manifestarNaConjuracao, manifestarNoAcerto, type Runa } from './manifestacao-runa';
import { Marcas } from './marcas';
import { Animacoes, Pincel } from './pincel';
import type { TexturaRica } from './texturas';
import type { Gesto, Palco } from './gestos-base';
import { classeNaUltimate, estiloNaUltimate, toqueDominante, type PalcoDaUltimate } from './classe-na-ultimate';
import { cenaTrocada, emissoesTrocadas, trocaDe, type Troca } from './transmutacao';
import type { Eixo } from '../../combat/eixos';
import { gestoDoNucleo, type PalcoDoNucleo } from './nucleo-no-visual';
import { raridadeNaArea, raridadeNaConjuracao, raridadeNoAcerto, raridadeNoRastro, type NivelVisual } from './manifestacao-raridade';
import type { Emissao } from '../presets-particula';
import { misturaEmSi, misturaNaArea, misturaNaConjuracao, misturaNoAcerto, misturaNoRastro, retratoDaMistura } from './manifestacao-mistura';

export interface OpcoesDiretor {
  efeitos: Container;
  chao: Container;
  particulas: SistemaParticulas;
  impacto: ControladorImpacto;
  reduzido: () => boolean;
}

export class DiretorVfx {
  private readonly pincel: Pincel;
  private readonly anim: Animacoes;
  private readonly marcas: Marcas;
  readonly deslizes = new Deslizes();
  /** Onde cada entidade está (em células, já com o deslize), atualizado a cada quadro pelo efeitos-habilidade. */
  private ondeEsta: (id: string) => PontoVisual | null = () => null;
  private agora = 0;
  /** D-174: a troca de elemento das chamadas em curso (a skill de classe com a runa de outro elemento). */
  private troca: Troca | null = null;

  constructor(private readonly o: OpcoesDiretor) {
    const p = o.particulas;
    this.pincel = new Pincel(o.efeitos, (n) => p.textura(n));
    this.anim = new Animacoes(this.pincel);
    this.marcas = new Marcas(o.chao, (n) => p.textura(n));
  }

  definirPosicoes(f: (id: string) => PontoVisual | null): void {
    this.ondeEsta = f;
  }

  /** Sem partículas (qualidade mínima), as silhuetas também param: o desenho de reserva da telegrafia fica. */
  get ativo(): boolean {
    return this.o.particulas.limite > 0;
  }

  /**
   * D-174 (14/11/2026): o que `fn` desenhar com a assinatura `nome` sai inteiro no elemento da runa (transmutacao.ts);
   * `fn` recebe a cor a usar (a da runa, quando há troca).
   */
  naRuna<T>(nome: AssinaturaVisual, runa: Runa | undefined, cor: number, fn: (cor: number) => T): T {
    const antes = this.troca;
    this.troca = trocaDe(ASSINATURAS[nome].familia, runa);
    try {
      return fn(this.troca ? COR_DA_RUNA[this.troca.para] : cor);
    } finally {
      this.troca = antes;
    }
  }

  /** As emissões da assinatura, já no elemento da troca em curso. */
  private emitir(lista: readonly Emissao[], x: number, y: number, cor: number, ate?: P, dir?: P): void {
    this.o.particulas.emitirLista(this.troca ? emissoesTrocadas(lista, this.troca) : lista, x, y, cor, ate, dir);
  }

  cena(): CenaVfx {
    const crua = this.cenaCrua();
    return this.troca ? cenaTrocada(crua, this.troca) : crua;
  }

  /** D-174: a classe, o estilo mais forte e a afinidade dominante de quem lança, na ultimate. */
  ultimateDeQuem(classe: string | undefined, g: PalcoDaUltimate, estilo: { eixo: Eixo; faixa: number } | null, dominante: { runa: Runa; faixa: number } | null): void {
    if (!this.ativo) return;
    const c = this.cenaCrua();
    if (ehClasseComRuna(classe)) classeNaUltimate(c, classe, g);
    if (estilo && !this.o.reduzido()) estiloNaUltimate(c, estilo.eixo, estilo.faixa, g);
    if (dominante) toqueDominante(c, dominante.runa, dominante.faixa, g.centro, true);
  }

  /** D-175 (15/11/2026): o gesto do núcleo da skill comum, por cima da assinatura. */
  nucleo(nucleo: string, g: PalcoDoNucleo): void {
    if (this.ativo && !this.o.reduzido()) gestoDoNucleo(this.cenaCrua(), nucleo, g);
  }

  /** D-174: o toque da afinidade dominante no acerto de uma skill de classe. */
  toqueNoAcerto(runa: Runa, faixa: number, em: P): void {
    if (this.ativo) toqueDominante(this.cenaCrua(), runa, faixa, em, false);
  }

  private cenaCrua(): CenaVfx {
    const p = this.o.particulas;
    return {
      particulas: p,
      agora: this.agora,
      reduzido: this.o.reduzido(),
      iso: p.iso,
      tocar: (a) => { this.anim.tocar(a, this.agora); },
      marca: (nome: TexturaRica, x, y, cor, escala, ms, aditivo) => { this.marcas.deixar(nome, x, y, cor, escala, ms, this.agora, aditivo); },
      ondeEsta: (id) => this.ondeEsta(id),
      tela: (q: P) => p.naTela(q.x, q.y),
      chao: (q: P) => p.noChao(q.x, q.y),
      tremor: (forca) => { this.o.impacto.pedir(forca, this.agora); },
    };
  }

  def(nome: AssinaturaVisual): DefAssinatura {
    return ASSINATURAS[nome];
  }

  /** A conjuração na mão (a cada 120 ms). */
  conjurar(nome: AssinaturaVisual, pos: P, cor: number): boolean {
    const lista = ASSINATURAS[nome].conjuracao;
    if (!lista || !this.ativo) return false;
    this.emitir(lista, pos.x, pos.y, cor);
    return true;
  }

  /** D-124: a ultimate conjura no círculo com a runa da classe (no lugar das runas genéricas). */
  circuloDaUltimate(atorId: string, classe: string, cor: number, ms: number): void {
    if (!this.ativo) return;
    const c = this.cena();
    const onde = () => this.ondeEsta(atorId);
    circuloNoChao(c, onde, 'circulo_runico', cor, 3.4, Math.max(600, ms), 0.5);
    circuloNoChao(c, onde, `runa_${classe}` as TexturaRica, cor, 1.6, Math.max(600, ms), 0);
  }

  /** O lançamento da ultimate: o círculo estoura num clarão e numa onda. */
  lancouUltimate(pos: P, cor: number): void {
    if (!this.ativo) return;
    const c = this.cena();
    clarao(c, pos, cor, 2.2);
    ondaDeChoque(c, pos, cor, 1.6, 380);
  }

  rastro(nome: AssinaturaVisual, x: number, y: number, cor: number, dir: P): boolean {
    const lista = ASSINATURAS[nome].rastro;
    if (!lista || !this.ativo) return false;
    this.emitir(lista, x, y, cor, undefined, dir);
    return true;
  }

  /** O acerto num alvo: as partículas do impacto, a silhueta, a marca, o toque da variante e a câmera. */
  acertar(nome: AssinaturaVisual, a: Acerto, variante: VarianteVisual | undefined, comParticulas: boolean): void {
    if (!this.ativo) return;
    const def = ASSINATURAS[nome];
    const c = this.cena();
    if (comParticulas && def.impacto?.length) this.emitir(def.impacto, a.ate.x, a.ate.y, a.cor);
    def.aoAcertar?.(c, a);
    if (def.marca && a.indice < 3) c.marca(def.marca, a.ate.x, a.ate.y, MARCAS_COR[def.marca] ?? a.cor, 1, 2400, def.marca === 'geada');
    if (variante && a.indice < 3) this.o.particulas.emitirLista(VARIANTES[variante], a.ate.x, a.ate.y, a.cor);
  }

  /** Marco 39 (12/11/2026, D-151): a runa da skill no acerto, por cima da assinatura (manifestacao-runa.ts). */
  runaNoAcerto(classe: string | undefined, runa: Runa, faixa: number, a: Acerto, comParticulas: boolean): void {
    if (!this.ativo || !ehClasseComRuna(classe)) return;
    manifestarNoAcerto(this.cena(), classe, runa, faixa, a, comParticulas);
  }

  /** Marco 39 (12/11/2026, D-156): a forma do estilo no acerto, na intensidade da faixa (manifestacao-forma.ts). */
  formaNoAcerto(formas: readonly FormaVisual[], a: Acerto): void {
    if (this.ativo) formaNoAcerto(this.cena(), formas, a);
  }

  /** D-156: a forma na mão de quem conjura. */
  formaNaConjuracao(formas: readonly FormaVisual[], pos: P, cor: number): void {
    if (this.ativo) formaNaConjuracao(this.cena(), formas, pos, cor);
  }

  /** D-156: a forma no estouro da área. */
  formaNaArea(formas: readonly FormaVisual[], a: AreaVfx): void {
    if (this.ativo) formaNaArea(this.cena(), formas, a);
  }

  /** Marco 52 (21/11/2026, D-198): o nível de raridade da fusão, em camadas por cima da assinatura. */
  raridadeNaConjuracao(n: NivelVisual, pos: P, cor: number): void {
    if (this.ativo) raridadeNaConjuracao(this.cena(), n, pos, cor);
  }

  raridadeNoAcerto(n: NivelVisual, a: Acerto): void {
    if (this.ativo) raridadeNoAcerto(this.cena(), n, a);
  }

  raridadeNaArea(n: NivelVisual, a: AreaVfx): void {
    if (this.ativo) raridadeNaArea(this.cena(), n, a);
  }

  raridadeNoRastro(n: NivelVisual, x: number, y: number, cor: number): void {
    if (this.ativo) raridadeNoRastro(this.cena(), n, x, y, cor);
  }

  /** D-206 (26/11/2026): a mescla dos elementos da fusão — a matéria de cada um, as ligas e a trança. */
  misturaNaConjuracao(els: readonly Runa[] | undefined, pos: P): void {
    const r = retratoDaMistura(els);
    if (r && this.ativo) misturaNaConjuracao(this.cena(), r, pos);
  }

  misturaNoRastro(els: readonly Runa[] | undefined, x: number, y: number): void {
    const r = retratoDaMistura(els);
    if (r && this.ativo) misturaNoRastro(this.cena(), r, x, y);
  }

  misturaNoAcerto(els: readonly Runa[] | undefined, a: Acerto): void {
    const r = retratoDaMistura(els);
    if (r && this.ativo) misturaNoAcerto(this.cena(), r, a);
  }

  misturaNaArea(els: readonly Runa[] | undefined, a: AreaVfx): void {
    const r = retratoDaMistura(els);
    if (r && this.ativo) misturaNaArea(this.cena(), r, a);
  }

  misturaEmSi(els: readonly Runa[] | undefined, a: EmSi): void {
    const r = retratoDaMistura(els);
    if (r && this.ativo) misturaEmSi(this.cena(), r, a);
  }

  /** D-151: a runa na mão de quem conjura. */
  runaNaConjuracao(runa: Runa, faixa: number, pos: P): void {
    if (this.ativo) manifestarNaConjuracao(this.cena(), runa, faixa, pos);
  }

  /** A área no lançamento. Devolve false quando a assinatura não desenha área (quem chama faz a rajada padrão). */
  area(nome: AssinaturaVisual, a: AreaVfx, variante: VarianteVisual | undefined): boolean {
    if (!this.ativo) return true;
    const def = ASSINATURAS[nome];
    if (variante) this.o.particulas.emitirLista(VARIANTES[variante], a.centro.x, a.centro.y, a.cor);
    if (!def.naArea) return false;
    def.naArea(this.cena(), a);
    return true;
  }

  /**
   * A área de uma assinatura que não desenha área (a explosão cadavérica em volta, o golpe em cone): a onda na cor e o
   * impacto da assinatura em células espalhadas (na linha, ao longo dela).
   */
  rajada(nome: AssinaturaVisual, a: AreaVfx): void {
    if (!this.ativo) return;
    const lista = ASSINATURAS[nome].impacto ?? [];
    const c = this.cena();
    if (a.tipoArea === 'linha') {
      const ponta = a.celulas.reduce((m, q) => (Math.hypot(q.x - a.origem.x, q.y - a.origem.y) > Math.hypot(m.x - a.origem.x, m.y - a.origem.y) ? q : m), a.mira);
      if (lista.length) this.emitir(lista, a.origem.x, a.origem.y, a.cor, ponta);
      return;
    }
    if (a.tipoArea !== 'cone') ondaDeChoque(c, a.centro, a.cor, Math.max(1, a.raio) + 0.4, 380);
    for (const q of sortear(a.celulas, 5)) if (lista.length) this.emitir(lista, q.x + (Math.random() - 0.5) * 0.5, q.y + (Math.random() - 0.5) * 0.5, a.cor);
  }

  emSi(nome: AssinaturaVisual, a: EmSi, variante: VarianteVisual | undefined): void {
    if (!this.ativo) return;
    const def = ASSINATURAS[nome];
    if (variante) this.o.particulas.emitirLista(VARIANTES[variante], a.pos.x, a.pos.y, a.cor);
    if (def.emSi) def.emSi(this.cena(), a);
    else if (def.impacto?.length) this.emitir(def.impacto, a.pos.x, a.pos.y, a.cor);
  }

  /** D-173 (14/11/2026): o gesto de uma reação, ressonância ou combo (vfx/gestos.ts). */
  gesto(g: Gesto | undefined, palco: Palco): void {
    if (g && this.ativo) g(this.cena(), palco);
  }

  /** O corpo desliza em vez de pular; o puxão da corrente espera ela chegar. */
  deslocado(id: string, de: P, para: P, causa: CausaDeslocamento, assinatura: AssinaturaVisual | null, ms?: number): void {
    const atraso = assinatura && causa === 'puxao' ? (ASSINATURAS[assinatura].atrasoDeslize ?? 0) : 0;
    this.deslizes.anotar(id, de, para, causa, this.agora, atraso, ms);
  }

  ponto(id: string, base: PontoVisual): PontoVisual {
    return this.deslizes.ponto(id, base, this.agora);
  }

  /** Por quadro: o relógio das animações, as silhuetas e as marcas. */
  quadro(agoraMs: number): void {
    this.agora = agoraMs;
    this.anim.quadro(agoraMs);
    this.marcas.quadro(agoraMs);
  }

  /** Só o relógio (o deslize precisa dele antes das posições do quadro). */
  relogio(agoraMs: number): void {
    this.agora = agoraMs;
  }

  get animacoes(): number {
    return this.anim.quantidade;
  }

  limpar(): void {
    this.anim.limpar();
    this.marcas.limpar();
    this.deslizes.limpar();
  }

  destruir(): void {
    this.pincel.destruir();
    this.marcas.destruir();
  }
}

/** A cor de cada marca no chão (o queimado é escuro; a geada, clara; o sangue, vermelho). */
const MARCAS_COR: Partial<Record<TexturaRica, number>> = {
  queimado: 0x1a1210,
  geada: 0xd8f0ff,
  rachadura: 0x2a2018,
  poca_sangue: 0x7a1020,
  poca_veneno: 0x4a9a3a,
};
