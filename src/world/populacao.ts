// Povoamento inicial da fase: cria os inimigos e os objetos posicionados pela autoria, com IDs
// estáveis derivados da ordem no arquivo (§3.6). O modo decide se a fase traz inimigos de IA e
// objetos (§2.13).

import type { ContextoSimulacao } from '../core/contexto';
import { aleatorio, criarRng, hashTexto } from '../core/rng';
import { DONO_FASE, type EstadoJogo } from '../core/estado';
import { ticksDe } from '../core/tempo';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { nomeComAfinidade } from '../combat/afinidade';
import { criarInimigo, type OpcoesInimigo } from '../entities/fabrica';
import type { PresetInimigo } from '../entities/presets';
import { passavel, type Fase, type InimigoPosicionado } from './fase';
import { largarItem, largarObjeto, largarOrbeEfeito, novoObjeto } from './objetos';

export function idDoInimigo(indice: number): string {
  return `i${String(indice).padStart(3, '0')}`;
}

/** As opções do inimigo posicionado (nível, vida, habilidades e, marco 23, a afinidade com nome e habilidade). */
export function opcoesDoPosicionado(ctx: ContextoSimulacao, preset: PresetInimigo, pos: InimigoPosicionado): OpcoesInimigo {
  const a = pos.afinidade;
  const dados = a ? ctx.conteudo.afinidades.elementos.get(a.elemento) : undefined;
  return {
    ...(pos.nivel !== undefined && { nivel: pos.nivel }),
    ...(pos.hpBase !== undefined && { hpBase: pos.hpBase }),
    ...(pos.habilidades && { habilidadesExtras: pos.habilidades }),
    ...(a && dados && { afinidade: { ...a, nome: nomeComAfinidade(preset.nome, ctx.conteudo.afinidades, a), habilidade: dados.habilidade } }),
  };
}

/**
 * Marco 25 (25/10/2026, D-101): o número da fase na campanha. As oficiais pela `ordem` (1 e 2); as geradas seguem
 * depois delas (`gerada-N` é a fase N + 2). Outras (arena, editor) contam como a primeira.
 */
export function numeroDaFase(fase: Pick<Fase, 'id' | 'ordem'>): number {
  const gerada = /^gerada-(\d+)$/.exec(fase.id);
  if (gerada) return 2 + Number(gerada[1]);
  return fase.ordem >= 1 && fase.ordem < 100 ? fase.ordem : 1;
}

function areaPassavel(fase: Fase): number {
  let n = 0;
  for (let y = 0; y < fase.altura; y++) for (let x = 0; x < fase.largura; x++) if (passavel(fase, x, y)) n++;
  return n;
}

/** Quantos reforços a fase ganha: +reforcoPorFasePct por fase depois da primeira, proporcional à área, com tetos. */
export function reforcosDaFase(ctx: ContextoSimulacao, comuns: number, total: number): number {
  const r = ctx.balance.populacao;
  const n = numeroDaFase(ctx.fase);
  const area = areaPassavel(ctx.fase) / Math.max(1, r.areaReferencia);
  const desejados = Math.round(comuns * (r.reforcoPorFasePct / 100) * (n - 1) * area);
  return Math.max(0, Math.min(desejados, comuns * (r.tetoMult - 1), r.tetoInimigos - total));
}

/** Os reforços nascem perto de inimigos comuns sorteados, com o mesmo preset e nível (PRNG próprio da fase). */
function reforcar(estado: EstadoJogo, ctx: ContextoSimulacao): void {
  const comuns = ctx.fase.inimigos.filter((p) => ctx.conteudo.presets.get(p.preset)?.arquetipo !== 'boss');
  const quantos = reforcosDaFase(ctx, comuns.length, ctx.fase.inimigos.length);
  if (quantos <= 0) return;
  const rng = criarRng(hashTexto(`${ctx.fase.id}:reforco`));
  const ocupadas = new Set(estado.entidades.map((e) => `${e.x},${e.y}`));
  for (const s of ctx.fase.spawns) ocupadas.add(`${s.x},${s.y}`);
  if (ctx.fase.portaSaida) ocupadas.add(`${ctx.fase.portaSaida.x},${ctx.fase.portaSaida.y}`);
  for (let i = 0; i < quantos; i++) {
    const base = comuns[Math.floor(aleatorio(rng) * comuns.length)];
    const preset = base ? ctx.conteudo.presets.get(base.preset) : undefined;
    if (!base || !preset) continue;
    for (let tentativa = 0; tentativa < 12; tentativa++) {
      const x = base.x + Math.round((aleatorio(rng) - 0.5) * 6);
      const y = base.y + Math.round((aleatorio(rng) - 0.5) * 6);
      if (!passavel(ctx.fase, x, y) || ocupadas.has(`${x},${y}`)) continue;
      ocupadas.add(`${x},${y}`);
      estado.entidades.push(criarInimigo(preset, `r${String(i).padStart(3, '0')}`, x, y, ctx.balance, opcoesDoPosicionado(ctx, preset, { ...base, x, y })));
      break;
    }
  }
}

export function povoarFase(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[] = []): void {
  if (ctx.modo.inimigosDeIA === 'da_fase') {
    ctx.fase.inimigos.forEach((pos, indice) => {
      const preset = ctx.conteudo.presets.get(pos.preset);
      if (!preset) return;
      if (ctx.fase.eventos.includes('enxame') && indice >= ctx.balance.ambiente.enxameInicio && preset.arquetipo !== 'boss') {
        (estado.reservaEnxame ??= []).push(indice);
        return;
      }
      estado.entidades.push(criarInimigo(preset, idDoInimigo(indice), pos.x, pos.y, ctx.balance, opcoesDoPosicionado(ctx, preset, pos)));
    });
    // Marco 25 (D-101): mais inimigos conforme se avança (fora do enxame, que já tem a sua leva).
    if (!ctx.fase.eventos.includes('enxame')) reforcar(estado, ctx);
  }
  if (ctx.modo.objetosDeFase) {
    ctx.fase.objetos.forEach((o, indice) => {
      const objetoId = `f:${indice}`;
      switch (o.tipo) {
        case 'orbe_efeito':
          if (o.efeito) largarOrbeEfeito(estado, o.efeito, o.x, o.y, saida, objetoId);
          break;
        case 'orbe_hp':
        case 'orbe_recurso':
          largarObjeto(estado, o.tipo, o.x, o.y, o.valor, o.modo, saida, objetoId);
          break;
        case 'loot':
          if (o.itemId) largarItem(estado, o.itemId, o.x, o.y, saida, o.valor, objetoId);
          break;
        // Marco 12: a fonte sonora é só apresentação (ui/som.ts lê da fase); não entra no estado.
        case 'fonte_som':
          break;
        // Marco 9A: baú e loja. A validação garante uma célula por objeto.
        case 'santuario':
        case 'bau':
        case 'loja':
          estado.objetos.push(novoObjeto(objetoId, o.tipo, o.x, o.y, { itens: [...o.itens], ouro: o.ouro, chave: o.chave }));
          saida.push({ t: 'objetoSurgiu', tick: estado.tick, objetoId, tipo: o.tipo, x: o.x, y: o.y });
          break;
        // Marco 9A-2: armadilha de fase, invisível, permanente, de dono e equipe `fase` (D-051).
        case 'armadilha':
          estado.armadilhas.push({
            id: estado.proximoId++,
            donoId: DONO_FASE,
            equipeDono: DONO_FASE,
            x: o.x,
            y: o.y,
            valor: o.valor,
            interno: o.efeito ? { ...o.efeito, interno: null } : null,
            ateTick: 0,
            origem: 'fase',
            permanente: true,
            rearmeTicks: ticksDe(o.rearmeMs),
            inerteAteTick: 0,
            reveladaPara: [],
          });
          break;
      }
    });
  }
}
