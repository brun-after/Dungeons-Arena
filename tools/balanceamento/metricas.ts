// Diagnóstico de combate (18/10/2026): contabilidade de eventos e exposição por tick, sem alterar a simulação.
import { alcanceDe, recargaRestante } from '../../src/combat/acao';
import { acaoBloqueada, movimentoBloqueado } from '../../src/combat/efeitos';
import { chebyshev } from '../../src/combat/geometria';
import { habilidadeDoAtor, perfilPara } from '../../src/combat/perfil';
import type { ContextoSimulacao } from '../../src/core/contexto';
import type { EstadoJogo } from '../../src/core/estado';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { emPasso, vivo, type Entidade } from '../../src/entities/entidade';
import { TICKS_POR_S } from './cenarios';

export interface FonteMedida {
  usos: number; dano: number; cura: number; mana: number; vida: number;
}
export interface MetricasCombate {
  dano: number; danoDireto: number; danoEfeitos: number; danoInvocacoes: number;
  recebido: number; recebidoInvocacoes: number; vidaSacrificadaInvocacoes: number;
  cura: number; curaHabilidade: number; curaEfeitos: number; curaPocoes: number; curaInvocacoes: number;
  manaGasta: number; vidaGasta: number; manaRestauradaEventos: number;
  escudoAbsorvido: number; esquivas: number; impactos: number; falhas: number; criticos: number;
  acoes: number; cancelamentos: number; recusas: Record<string, number>; combos: number; sinergias: number;
  tempoVivoS: number; tempoVidaBaixaS: number; tempoSemManaS: number;
  tempoControladoS: number; tempoConjurandoS: number; tempoMovendoS: number;
  distanciaMedia: number | null; fontes: Record<string, FonteMedida>;
}
export function metricasVazias(): MetricasCombate {
  return {
    dano: 0, danoDireto: 0, danoEfeitos: 0, danoInvocacoes: 0, recebido: 0, recebidoInvocacoes: 0,
    vidaSacrificadaInvocacoes: 0, cura: 0, curaHabilidade: 0, curaEfeitos: 0, curaPocoes: 0, curaInvocacoes: 0,
    manaGasta: 0, vidaGasta: 0, manaRestauradaEventos: 0, escudoAbsorvido: 0, esquivas: 0,
    impactos: 0, falhas: 0, criticos: 0, acoes: 0, cancelamentos: 0, recusas: {}, combos: 0, sinergias: 0,
    tempoVivoS: 0, tempoVidaBaixaS: 0, tempoSemManaS: 0, tempoControladoS: 0, tempoConjurandoS: 0,
    tempoMovendoS: 0, distanciaMedia: null, fontes: {},
  };
}

export class MedidorCombate {
  readonly metricas = metricasVazias();
  private readonly aliados = new Set<string>();
  private distanciaTotal = 0;
  private amostrasDistancia = 0;
  constructor(readonly jogadorId: string, readonly inimigos: Set<string>) {
    this.aliados.add(jogadorId);
  }
  private fonte(id: string): FonteMedida {
    return this.metricas.fontes[id] ??= { usos: 0, dano: 0, cura: 0, mana: 0, vida: 0 };
  }
  /** Eventos emitidos no tick; IDs de invocações permanecem conhecidos mesmo após sua remoção. */
  registrar(eventos: readonly EventoSimulacao[]): void {
    const m = this.metricas;
    for (const e of eventos) {
      if (e.t === 'invocou' || e.t === 'dominou') {
        if (this.aliados.has(e.donoId)) { this.aliados.add(e.id); this.inimigos.delete(e.id); }
        else if (this.inimigos.has(e.donoId)) { this.inimigos.add(e.id); this.aliados.delete(e.id); }
      }
      if (e.t === 'acaoIniciada' && e.atorId === this.jogadorId) {
        m.acoes++;
        const f = this.fonte(e.habilidadeId);
        f.usos++; f.mana += e.custoMana ?? 0; f.vida += e.custoVida ?? 0;
        m.manaGasta += e.custoMana ?? 0; m.vidaGasta += e.custoVida ?? 0;
      }
      if (e.t === 'acaoCancelada' && e.atorId === this.jogadorId) m.cancelamentos++;
      if (e.t === 'acaoRecusada' && e.atorId === this.jogadorId) m.recusas[e.motivo] = (m.recusas[e.motivo] ?? 0) + 1;
      if (e.t === 'comboFeito' && e.id === this.jogadorId) m.combos++;
      if (e.t === 'esquivou' && e.alvoId === this.jogadorId) m.esquivas++;
      if (e.t === 'usouItem' && e.id === this.jogadorId) {
        // As poções iniciais emitem efeitoResultado antes deste resumo: reclassifica, sem somar duas vezes.
        m.curaPocoes += e.hp; m.curaEfeitos -= e.hp;
        this.fonte('efeito:cura').cura -= e.hp;
        const f = this.fonte(`item:${e.itemId}`); f.usos++; f.cura += e.hp;
      }
      // invocacaoCurou também resume um efeitoResultado; a cura é contada apenas no efeito.
      if (e.t !== 'impacto' && e.t !== 'efeitoResultado') continue;
      const origem = e.t === 'impacto' ? e.fonteId : e.origemId;
      const dano = e.t === 'impacto' ? (e.danoEfetivo ?? e.dano) : e.dano;
      const fonte = e.t === 'impacto' ? e.habilidadeId : `efeito:${e.tipo}`;
      if (this.aliados.has(origem) && this.inimigos.has(e.alvoId)) {
        m.dano += dano;
        this.fonte(origem === this.jogadorId ? fonte : `invocacao:${fonte}`).dano += dano;
        if (origem !== this.jogadorId) m.danoInvocacoes += dano;
        else if (e.t === 'impacto') m.danoDireto += dano;
        else m.danoEfeitos += dano;
        if (e.t === 'impacto') {
          m.impactos++; m.falhas += Number(e.falha); m.criticos += Number(e.critico); m.sinergias += e.sinergias.length;
        }
      }
      if (this.inimigos.has(origem)) {
        if (e.alvoId === this.jogadorId) {
          m.recebido += dano;
          if (e.t === 'impacto') m.escudoAbsorvido += e.absorvidoEscudo ?? 0;
        } else if (this.aliados.has(e.alvoId)) m.recebidoInvocacoes += dano;
      }
      if (e.t === 'efeitoResultado' && e.tipo === 'drenar_invocacao' && origem === this.jogadorId) m.vidaSacrificadaInvocacoes += dano;
      if (e.alvoId === this.jogadorId) {
        m.cura += e.cura;
        const daInvocacao = origem !== this.jogadorId && this.aliados.has(origem);
        this.fonte(daInvocacao ? `invocacao:${fonte}` : fonte).cura += e.cura;
        if (daInvocacao) m.curaInvocacoes += e.cura;
        else if (e.t === 'impacto') m.curaHabilidade += e.cura;
        else { m.curaEfeitos += e.cura; m.manaRestauradaEventos += e.mana; }
      }
    }
  }
  /** Amostra antes do tick: inclui o tick letal e exclui todo tempo morto ou fora do encontro. */
  amostrar(j: Entidade, estado: EstadoJogo, ctx: ContextoSimulacao): void {
    if (!vivo(j)) return;
    const m = this.metricas, dt = 1 / TICKS_POR_S;
    m.tempoVivoS += dt;
    if (j.hp / j.hpMax < 0.35) m.tempoVidaBaixaS += dt;
    if (j.acao) m.tempoConjurandoS += dt;
    if (emPasso(j) || j.direcao !== 'parado') m.tempoMovendoS += dt;
    if (movimentoBloqueado(j, estado.tick) || acaoBloqueada(j, estado.tick, 'fisico') || acaoBloqueada(j, estado.tick, 'magico')) m.tempoControladoS += dt;
    const hostis = estado.entidades.filter(e => this.inimigos.has(e.id) && vivo(e));
    const distancia = hostis.length ? Math.min(...hostis.map(e => chebyshev(j, e))) : null;
    if (distancia !== null) { this.distanciaTotal += distancia; this.amostrasDistancia++; m.distanciaMedia = this.distanciaTotal / this.amostrasDistancia; }
    // O bot filtra falta de mana antes de enviar comandos: contar só recusas ocultaria a restrição.
    const semMana = !j.acao && j.habilidades.some(id => {
      const h = habilidadeDoAtor(ctx, j, id);
      if (!h || h.passiva || recargaRestante(estado, j.id, id) > 0 || acaoBloqueada(j, estado.tick, h.tipoAtaque)) return false;
      const suporte = h.politicaAlvo === 'proprio' || h.politicaAlvo === 'aliado' || h.politicaAlvo === 'aliados';
      if (suporte ? j.hp > j.hpMax / 2 : distancia === null || distancia > alcanceDe(ctx, j, h, estado.tick)) return false;
      const custo = Math.max(0, Math.round(h.custoRecurso * (1 + perfilPara(ctx, j, h).custoPct / 100)));
      return custo > j.mana;
    });
    if (semMana) m.tempoSemManaS += dt;
  }
}
