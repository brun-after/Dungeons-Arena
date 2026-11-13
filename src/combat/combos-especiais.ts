// Marco 40 (13/11/2026, D-163): o que os combos fazem que não cabe só na skill de agora — mexer no alvo, nos aliados,
// nas invocações e em quem a skill anterior atingiu. Comum aos combos de papel e aos assinados das classes.

import type { Celula } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import type { Leitor } from '../core/validar';
import { posicionar, vivo, type Entidade } from '../entities/entidade';
import { podeAjudar, podeFerir } from '../modos/relacao';
import { aplicarEfeito } from './efeitos';
import { vizinhasLivres } from './efeitos-fluxo';
import { avancar } from './efeitos-instantaneos';
import { ESTADOS_DE_CONTROLE } from './eixos';
import { chebyshev } from './geometria';
import type { Habilidade } from './habilidades';
import { construirEfeito, REGISTRO_EFEITOS, type EfeitoCanonico } from './registro-efeitos';

export const ESPECIAIS = [
  // combos de papel
  'estender_controle', 'resistir_depois', 'controle_em_volta', 'escudo_em_dano', 'curar_mais_ferido', 'escudo_no_curado', 'renovar_escudo', 'invocar_junto', 'cerco', 'reembolso',
  // combos assinados
  'executar_em_volta', 'critico', 'prender_silenciados', 'area_dobrada', 'elemento_encarnado', 'invocar_por_atingido', 'detonar_recentes', 'puxar_para_armadilha', 'curar_companheiro', 'execucao_nos_anteriores',
] as const;
export type Especial = (typeof ESPECIAIS)[number];

export interface EspecialDeCombo {
  tipo: Especial;
  valor: number;
}

export function lerEspeciais(l: Leitor, o: Record<string, unknown>, id: string): EspecialDeCombo[] {
  return o.especiais === undefined ? [] : l.lista(o, 'especiais').map((e) => {
    const x = l.objeto(e, `${id}.especial`);
    return { tipo: l.opcao(x, 'tipo', ESPECIAIS), valor: l.numero(x, 'valor', { min: 0, max: 10_000 }) };
  });
}

/**
 * Aplica os especiais do combo. `h` é a skill de agora já copiada (pode ser mudada aqui); `extras` recebe os efeitos que
 * seguem com ela pelo golpe.
 */
export function aplicarEspeciais(estado: EstadoJogo, ctx: ContextoSimulacao, ator: Entidade, hab: Habilidade, h: Habilidade, especiais: readonly EspecialDeCombo[], extras: EfeitoCanonico[], alvo: Entidade | null, mira: Celula, saida: EventoSimulacao[]): void {
  const tick = estado.tick;
  const origem = { id: ator.id, x: ator.x, y: ator.y };
  const aplicar = (e: Entidade, ef: EfeitoCanonico) => { aplicarEfeito(estado, ctx, e, ef, origem, { x: e.x, y: e.y }, saida); };
  const hostis = () => estado.entidades.filter((e) => e !== ator && vivo(e) && podeFerir(ator, e, ctx.modo));
  const anterior = ator.ultimaDePapel;
  for (const s of especiais) {
    switch (s.tipo) {
      case 'estender_controle':
        for (const f of alvo?.efeitos ?? []) if (f.ateTick > tick && ESTADOS_DE_CONTROLE.includes(f.tipo)) f.ateTick += ticksDe(s.valor);
        break;
      case 'resistir_depois': {
        // A segunda prisão dura o que dura; depois dela, o alvo fica firme.
        const prisao = Math.max(0, ...h.efeitos.filter((e) => e.em !== 'conjurador' && ESTADOS_DE_CONTROLE.includes(e.tipo)).map((e) => e.duracaoMs));
        extras.push({ ...construirEfeito('efeito_atrasado', { duracaoMs: Math.max(100, prisao) }), interno: construirEfeito('firme', { duracaoMs: s.valor, pct: 100 }) });
        break;
      }
      case 'controle_em_volta': {
        const controles = h.efeitos.filter((e) => e.em === 'alvo' && ESTADOS_DE_CONTROLE.includes(e.tipo));
        for (const e of hostis()) if (e !== alvo && chebyshev(e, ator) <= s.valor) for (const ef of controles) aplicar(e, ef);
        break;
      }
      case 'escudo_em_dano': {
        const escudos = ator.efeitos.filter((f) => f.ateTick > tick && REGISTRO_EFEITOS[f.tipo].escudo);
        const soma = escudos.reduce((t, f) => t + f.valor, 0);
        if (soma > 0) {
          ator.efeitos = ator.efeitos.filter((f) => !escudos.includes(f));
          extras.push(construirEfeito('dano_direto', { valor: Math.round((soma * s.valor) / 100) }));
        }
        break;
      }
      case 'curar_mais_ferido': {
        const aliados = estado.entidades.filter((e) => vivo(e) && (e === ator || podeAjudar(ator, e, ctx.modo)) && chebyshev(e, ator) <= ctx.balance.habilidades.eixos.grupo.raio);
        const ferido = aliados.sort((a, b) => a.hp / a.hpMax - b.hp / b.hpMax || (a.id < b.id ? -1 : 1))[0];
        if (ferido) aplicar(ferido, construirEfeito('cura', { valor: s.valor }));
        break;
      }
      case 'escudo_no_curado': {
        const curado = estado.entidades.find((e) => e.id === (anterior?.alvoId ?? ator.id) && vivo(e)) ?? ator;
        const escudo = h.efeitos.filter((e) => REGISTRO_EFEITOS[e.tipo].escudo).reduce((t, e) => t + e.valor, 0);
        if (escudo > 0) aplicar(curado, construirEfeito('escudo', { valor: Math.round((escudo * s.valor) / 100), duracaoMs: 4000 }));
        break;
      }
      case 'renovar_escudo':
        for (const e of estado.entidades) {
          if (!vivo(e) || !(e === ator || podeAjudar(ator, e, ctx.modo))) continue;
          for (const f of e.efeitos) if (f.origemId === ator.id && f.ateTick > tick && REGISTRO_EFEITOS[f.tipo].escudo) f.ateTick = Math.max(f.ateTick, tick + ticksDe(s.valor));
        }
        break;
      case 'invocar_junto': {
        // As criaturas desta skill nascem agora, junto do alvo (ou do alvo da skill anterior, ou da mira).
        const antes = anterior?.alvoId ? estado.entidades.find((e) => e.id === anterior.alvoId && vivo(e)) : undefined;
        const perto = alvo ?? antes ?? mira;
        const invocacoes = h.efeitos.filter((e) => e.tipo === 'invocar' || e.tipo === 'invocar_temporario');
        for (const ef of invocacoes) {
          const n = estado.entidades.length;
          aplicar(ator, ef);
          for (const e of estado.entidades.slice(n)) {
            const lugar = vizinhasLivres(estado, ctx, e, { x: perto.x, y: perto.y })[0];
            if (lugar) { posicionar(e, lugar.x, lugar.y); e.origemX = lugar.x; e.origemY = lugar.y; }
          }
        }
        h.efeitos = h.efeitos.filter((e) => !invocacoes.includes(e));
        break;
      }
      case 'cerco':
        for (const e of estado.entidades) {
          if (vivo(e) && e.invocacao?.donoId === ator.id) aplicar(e, { ...construirEfeito('acerto_carregado', { duracaoMs: s.valor }), interno: construirEfeito('enraizado', { duracaoMs: 500 }) });
        }
        break;
      case 'reembolso':
        ator.mana = Math.min(ator.manaMax, ator.mana + Math.round((hab.custoRecurso * s.valor) / 100));
        break;
      case 'executar_em_volta':
        for (const e of hostis()) if (chebyshev(e, ator) <= 1) aplicar(e, construirEfeito('executar', { pct: s.valor }));
        break;
      case 'execucao_nos_anteriores':
        // A execução vale mais alto em quem a skill anterior atingiu.
        if (alvo && anterior?.alvos.includes(alvo.id)) h.efeitos = h.efeitos.map((e) => (e.tipo === 'executar' ? { ...e, pct: Math.max(e.pct, s.valor) } : e));
        if (alvo && anterior?.alvos.includes(alvo.id) && !h.efeitos.some((e) => e.tipo === 'executar')) extras.push(construirEfeito('executar', { pct: s.valor }));
        break;
      case 'critico':
        // O golpe desta skill sai crítico (o lançamento consome o estado).
        aplicar(ator, construirEfeito('critico_garantido', { duracaoMs: 2000 }));
        break;
      case 'prender_silenciados':
        for (const e of hostis()) {
          if (chebyshev(e, mira) <= Math.max(1, h.raioArea) && e.efeitos.some((f) => f.tipo === 'silenciar' && f.ateTick > tick)) aplicar(e, construirEfeito('enraizado', { duracaoMs: s.valor }));
        }
        break;
      case 'area_dobrada':
        h.raioArea = Math.min(5, Math.max(h.raioArea + 1, h.raioArea * 2));
        break;
      case 'elemento_encarnado':
        if (ator.encarnacao) h.elemento = ator.encarnacao;
        break;
      case 'invocar_por_atingido': {
        const mais = Math.min(s.valor, anterior?.atingidos ?? 0);
        if (mais > 0) h.efeitos = h.efeitos.map((e) => (e.tipo === 'invocar' || e.tipo === 'invocar_temporario' ? { ...e, valor: e.valor + mais } : e));
        break;
      }
      case 'detonar_recentes':
        // Os mortos que a skill anterior ergueu explodem juntos.
        for (const m of estado.entidades.filter((e) => vivo(e) && e.invocacao?.donoId === ator.id && anterior && e.invocacao.criadoTick >= anterior.tick)) {
          for (const e of hostis()) if (chebyshev(e, m) <= 1) aplicar(e, construirEfeito('dano_direto', { valor: s.valor }));
          m.hp = 0;
        }
        break;
      case 'puxar_para_armadilha': {
        const armadilha = [...estado.armadilhas].reverse().find((a) => a.donoId === ator.id);
        if (armadilha) for (const e of hostis()) if (chebyshev(e, armadilha) <= s.valor) avancar(estado, ctx, e, { x: armadilha.x, y: armadilha.y }, s.valor);
        break;
      }
      case 'curar_companheiro': {
        const companheiro = estado.entidades.find((e) => vivo(e) && e.invocacao?.companheiro && e.invocacao.donoId === ator.id);
        if (companheiro) aplicar(companheiro, construirEfeito('cura', { valor: s.valor }));
        break;
      }
    }
  }
}
