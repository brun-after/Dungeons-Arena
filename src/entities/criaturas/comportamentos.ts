// Marco 45 (16/11/2026, D-181): os jeitos de caçar das criaturas de Filo, pelo `comportamento` do preset (os dois
// antigos, o saltador e o armadilheiro, seguem em ia-especiais.ts). Agem pelas mesmas funções dos comandos
// (iniciarAcao, planejarCaminho, aplicarEfeito), nunca por atalho (D-025):
// - fole (Fornalheiro): perto do alvo, inspira (puxa quem está em volta por 1,5 s) e sopra (empurra e queima);
//   na água, apagado, luta como um brutamontes comum;
// - rolante (Floquinho): de longe, vira bola e rola até o alvo; quanto mais rolou, mais forte bate;
// - torre (Bobinadora): no alcance, planta as pernas e não sai do lugar; derrubada (empurrada ou atordoada), anda;
// - ladrao (Breuzinho): vai atrás de quem leva tocha, bebe parte dela e foge;
// - circular (Galgo do Vendaval): com outro galgo no mesmo alvo, corre em roda e o redemoinho arrasta para o centro;
// - pousar (Velejador): pousa no alto (muro, penhasco) e atira de lá; só desce ferido;
// - fixo (Obelisco Vigia): não anda, só atira;
// - fujao (Tiçãozinho ferido, Candelinha): não deixa chegar perto;
// - plantador (Esporeiro): planta os cogumelos (o básico); na lama, os de estouro rápido.
// O Espelhante, sem comportamento, devolve a última skill que levou (antes de qualquer outra coisa).

import type { Celula } from '../../core/comandos';
import type { ContextoSimulacao } from '../../core/contexto';
import type { EstadoJogo } from '../../core/estado';
import type { EventoSimulacao } from '../../core/eventos-simulacao';
import { ticksDe } from '../../core/tempo';
import { chaveRecarga, iniciarAcao, recargaRestante } from '../../combat/acao';
import { anotarDeslocamento, aplicarEfeito } from '../../combat/efeitos';
import { celulaOcupada, chebyshev } from '../../combat/geometria';
import { tiroLivre } from '../../combat/linha-de-tiro';
import { construirEfeito } from '../../combat/registro-efeitos';
import { passavel } from '../../world/fase';
import { pararMovimento, planejarCaminho } from '../../world/movimento';
import { alturaEm } from '../../world/relevo';
import { podeFerir } from '../../modos/relacao';
import { emPasso, posicionar, vivo, type Entidade, type EstadoIa } from '../entidade';
import type { PresetInimigo } from '../presets';
import { temMarca, tracoDe } from './terreno';
import { criaturaDe, hostis } from './tracos';

type Caca = (estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, ia: EstadoIa, alvo: Entidade, saida: EventoSimulacao[]) => boolean;

/** Os comportamentos que usam as skills do jeito deles (a vez da skill da IA comum não vale para eles). */
export const COM_SKILLS_PROPRIAS = new Set(['saltador', 'armadilheiro', 'fole', 'rolante', 'ladrao', 'plantador']);

function atacar(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, ia: EstadoIa, alvo: Entidade, id: string, saida: EventoSimulacao[]): boolean {
  if (e.acao || estado.tick < ia.proximoAtaqueTick || recargaRestante(estado, e.id, id) > 0) return false;
  if (!iniciarAcao(estado, ctx, e, id, alvo.id, saida)) return false;
  ia.ataquesFeitos++;
  ia.proximoAtaqueTick = estado.tick + ticksDe(ctx.conteudo.presets.get(e.preset)?.intervaloAtaqueMs ?? 2000);
  return true;
}

/** Um passo para longe do alvo (a célula vizinha livre mais distante dele). */
export function fugirDe(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, de: Celula, saida: EventoSimulacao[]): void {
  if (emPasso(e)) return;
  const c = celulaOcupada(e);
  let melhor: Celula | null = null;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]] as const) {
    const n = { x: c.x + dx * 3, y: c.y + dy * 3 };
    if (!passavel(ctx.fase, n.x, n.y)) continue;
    if (!melhor || chebyshev(n, de) > chebyshev(melhor, de)) melhor = n;
  }
  if (melhor && chebyshev(melhor, de) > chebyshev(c, de)) planejarCaminho(e, melhor, ctx, estado.tick, saida, 6);
}

const fole: Caca = (estado, ctx, e, ia, alvo, saida) => {
  if (temMarca(estado, ctx, e, 'apagado')) return false;
  const c = criaturaDe(e);
  const d = chebyshev(celulaOcupada(e), celulaOcupada(alvo));
  if (c.inspiraAteTick !== undefined && estado.tick < c.inspiraAteTick) {
    if (!emPasso(e)) pararMovimento(e);
    if (!e.acao && estado.tick % ticksDe(500) === 0) iniciarAcao(estado, ctx, e, 'inspirar_fornalha', undefined, saida);
    return true;
  }
  if (c.inspiraAteTick !== undefined) {
    delete c.inspiraAteTick;
    c.proximoFoleTick = estado.tick + ticksDe(6000);
    if (!e.acao) iniciarAcao(estado, ctx, e, 'soprar_fornalha', undefined, saida);
    return true;
  }
  if (d <= 3 && !e.acao && estado.tick >= (c.proximoFoleTick ?? 0)) {
    c.inspiraAteTick = estado.tick + ticksDe(1500);
    return true;
  }
  return false;
};

const rolante: Caca = (estado, ctx, e, _ia, alvo, saida) => {
  const c = criaturaDe(e);
  const d = chebyshev(celulaOcupada(e), celulaOcupada(alvo));
  if (!c.rolando) {
    if (d < 3 || estado.tick < (c.proximoFoleTick ?? 0)) return false;
    c.rolando = true;
    c.rolouCelulas = 0;
  }
  if (estado.tick % ticksDe(250) === 0) {
    c.rolouCelulas = (c.rolouCelulas ?? 0) + 1;
    aplicarEfeito(estado, ctx, e, construirEfeito('acelerado', { pct: Math.min(150, 20 + c.rolouCelulas * 8), duracaoMs: 400 }), { id: e.id, x: e.x, y: e.y }, null, saida, false);
  }
  if (d <= 1) {
    const forca = Math.min(24, 3 + (c.rolouCelulas ?? 0) * 2);
    const origem = { id: e.id, x: e.x, y: e.y };
    aplicarEfeito(estado, ctx, alvo, construirEfeito('dano_direto', { valor: forca }), origem, null, saida);
    if (forca >= 10) aplicarEfeito(estado, ctx, alvo, construirEfeito('atordoar', { duracaoMs: 500 }), origem, null, saida);
    c.rolando = false;
    c.proximoFoleTick = estado.tick + ticksDe(4000);
    return true;
  }
  if (!emPasso(e) && e.caminho.length === 0) planejarCaminho(e, celulaOcupada(alvo), ctx, estado.tick, saida, 24);
  return true;
};

const torre: Caca = (estado, ctx, e, ia, alvo, saida) => {
  const c = criaturaDe(e);
  const aqui = celulaOcupada(e);
  // Empurrada ou atordoada, a torre cai e anda de novo (e só replanta 2 s depois).
  if (c.plantada && (e.efeitos.some((f) => f.tipo === 'atordoar' && f.ateTick > estado.tick) || (c.arena && (c.arena.x !== aqui.x || c.arena.y !== aqui.y)))) {
    c.plantada = false;
    c.proximoFoleTick = estado.tick + ticksDe(2000);
  }
  const d = chebyshev(aqui, celulaOcupada(alvo));
  if (!c.plantada && d <= 6 && estado.tick >= (c.proximoFoleTick ?? 0) && tiroLivre(estado, ctx, aqui, celulaOcupada(alvo))) {
    c.plantada = true;
    c.arena = aqui;
  }
  if (!c.plantada) return false;
  if (!emPasso(e)) pararMovimento(e);
  const hab = e.habilidades.find((h) => recargaRestante(estado, e.id, h) === 0) ?? e.ataqueBasico;
  if (d <= 7 && !atacar(estado, ctx, e, ia, alvo, hab, saida)) atacar(estado, ctx, e, ia, alvo, e.ataqueBasico, saida);
  return true;
};

const ladrao: Caca = (estado, ctx, e, _ia, _alvo, saida) => {
  const t = tracoDe(ctx, e, 'ladraoDeLuz');
  const c = criaturaDe(e);
  if (estado.tick < (c.proximoFoleTick ?? 0)) {
    const perto = hostis(estado, ctx, e, 6)[0];
    if (perto) fugirDe(estado, ctx, e, celulaOcupada(perto), saida);
    return true;
  }
  const comTocha = hostis(estado, ctx, e, 10).find((h) => h.efeitos.some((f) => f.tipo === 'tocha' && f.ateTick > estado.tick));
  if (!t || !comTocha) return false;
  if (chebyshev(celulaOcupada(e), celulaOcupada(comTocha)) <= 1) {
    for (const f of comTocha.efeitos) if (f.tipo === 'tocha') f.ateTick = Math.max(estado.tick + 1, f.ateTick - ticksDe(t.roubaMs));
    saida.push({ t: 'efeitoResultado', tick: estado.tick, alvoId: comTocha.id, origemId: e.id, tipo: 'apagar_luz', dano: 0, cura: 0, mana: 0 });
    c.proximoFoleTick = estado.tick + ticksDe(4000);
    return true;
  }
  if (!emPasso(e) && e.caminho.length === 0) planejarCaminho(e, celulaOcupada(comTocha), ctx, estado.tick, saida, 20);
  return true;
};

const circular: Caca = (estado, ctx, e, ia, alvo, saida) => {
  const irmaos = estado.entidades.filter((o) => o !== e && vivo(o) && o.preset === e.preset && o.ia?.alvoId === alvo.id && chebyshev(o, e) <= 6);
  const c = criaturaDe(e);
  if (irmaos.length === 0 || estado.tick < (c.proximoFoleTick ?? 0)) return false;
  // A roda dura 6 s; depois os galgos descansam 4 s (atacam como lobos comuns).
  c.rolandoDesde ??= estado.tick;
  if (estado.tick - c.rolandoDesde > ticksDe(6000)) {
    delete c.rolandoDesde;
    c.proximoFoleTick = estado.tick + ticksDe(4000);
    return false;
  }
  const centro = celulaOcupada(alvo);
  const ordem = [e, ...irmaos].sort((a, b) => (a.id < b.id ? -1 : 1)).indexOf(e);
  const ang = (ordem / (irmaos.length + 1)) * Math.PI * 2 + (estado.tick / ticksDe(1500)) * Math.PI * 0.5;
  const ponto = { x: Math.round(centro.x + Math.cos(ang) * 2), y: Math.round(centro.y + Math.sin(ang) * 2) };
  if (!emPasso(e) && passavel(ctx.fase, ponto.x, ponto.y)) planejarCaminho(e, ponto, ctx, estado.tick, saida, 6);
  // O mais velho da roda puxa o redemoinho (a cada segundo; na água, a tromba puxa mais).
  if (ordem === 0 && estado.tick % ticksDe(1000) === 0) {
    const forca = temMarca(estado, ctx, e, 'tromba') ? 2 : 1;
    for (const h of hostis(estado, ctx, e, 4)) aplicarEfeito(estado, ctx, h, construirEfeito('puxao', { valor: forca }), { id: e.id, x: centro.x, y: centro.y }, null, saida, false);
  }
  if (chebyshev(celulaOcupada(e), centro) <= 2) atacar(estado, ctx, e, ia, alvo, e.ataqueBasico, saida);
  return true;
};

/** A célula alta (3 ou mais acima do alvo) a até 5 dele, de onde o Velejador atira. */
function poleiro(ctx: ContextoSimulacao, e: Entidade, alvo: Entidade): Celula | null {
  if (!ctx.fase.alturas) return null;
  const a = celulaOcupada(alvo);
  const base = alturaEm(ctx.fase, a.x, a.y);
  let melhor: Celula | null = null;
  for (let dy = -5; dy <= 5; dy++) for (let dx = -5; dx <= 5; dx++) {
    const c = { x: a.x + dx, y: a.y + dy };
    if (chebyshev(c, a) < 3 || !passavel(ctx.fase, c.x, c.y) || alturaEm(ctx.fase, c.x, c.y) < base + 3) continue;
    if (!melhor || chebyshev(c, celulaOcupada(e)) < chebyshev(melhor, celulaOcupada(e))) melhor = c;
  }
  return melhor;
}

const pousar: Caca = (estado, ctx, e, ia, alvo, saida) => {
  const c = criaturaDe(e);
  if (e.hp * 2 < e.hpMax || temMarca(estado, ctx, e, 'naoPousa')) { c.plantada = false; return false; }
  if (!c.plantada && estado.tick >= (c.proximoFoleTick ?? 0)) {
    c.proximoFoleTick = estado.tick + ticksDe(8000);
    const p = poleiro(ctx, e, alvo);
    if (p) {
      const de = { x: e.x, y: e.y };
      posicionar(e, p.x, p.y);
      e.caminho = [];
      anotarDeslocamento(saida, estado.tick, e, de.x, de.y, { id: e.id, x: de.x, y: de.y }, 'avanco', ctx);
      c.plantada = true;
    }
  }
  if (!c.plantada) return false;
  if (!emPasso(e)) pararMovimento(e);
  if (chebyshev(celulaOcupada(e), celulaOcupada(alvo)) > 7) { c.plantada = false; return false; }
  atacar(estado, ctx, e, ia, alvo, e.ataqueBasico, saida);
  return true;
};

const fixo: Caca = (estado, ctx, e, ia, alvo, saida) => {
  if (!emPasso(e)) pararMovimento(e);
  e.caminho = [];
  const hab = e.habilidades.find((h) => recargaRestante(estado, e.id, h) === 0) ?? e.ataqueBasico;
  if (chebyshev(celulaOcupada(e), celulaOcupada(alvo)) <= 6) atacar(estado, ctx, e, ia, alvo, hab, saida);
  return true;
};

const fujao: Caca = (estado, ctx, e, _ia, alvo, saida) => {
  const assustado = !!e.criatura?.fugiu || !!tracoDe(ctx, e, 'denuncia');
  if (!assustado || chebyshev(celulaOcupada(e), celulaOcupada(alvo)) >= 4) return false;
  fugirDe(estado, ctx, e, celulaOcupada(alvo), saida);
  return true;
};

const plantador: Caca = (estado, ctx, e, ia, alvo, saida) => {
  if (!temMarca(estado, ctx, e, 'cogumeloRapido') || chebyshev(celulaOcupada(e), celulaOcupada(alvo)) > 4) return false;
  return atacar(estado, ctx, e, ia, alvo, 'cogumelo_bomba_rapido', saida);
};

const CACAS: Readonly<Record<string, Caca>> = { fole, rolante, torre, ladrao, circular, pousar, fixo, fujao, plantador };

/** O Espelhante devolve a última skill que levou (uma vez por cópia; sobre a água, duas). */
function espelhar(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, ia: EstadoIa, alvo: Entidade, saida: EventoSimulacao[]): boolean {
  const c = e.criatura;
  if (!c?.copia || !tracoDe(ctx, e, 'espelho') || e.acao || estado.tick < ia.proximoAtaqueTick) return false;
  const id = c.copia;
  e.habilidades.push(id);
  const foi = iniciarAcao(estado, ctx, e, id, alvo.id, saida);
  e.habilidades = e.habilidades.filter((h, i) => h !== id || i !== e.habilidades.length - 1);
  estado.recargas[chaveRecarga(e.id, id)] = estado.tick;
  if (!foi) { delete c.copia; return false; }
  c.absorvidos = (c.absorvidos ?? 0) + 1;
  if (!temMarca(estado, ctx, e, 'duplaCopia') || c.absorvidos >= 2) { delete c.copia; c.absorvidos = 0; }
  ia.proximoAtaqueTick = estado.tick + ticksDe(ctx.conteudo.presets.get(e.preset)?.intervaloAtaqueMs ?? 2000);
  return true;
}

/** O Saltafaísca no campo elétrico salta de novo logo depois (uma vez a cada 6 s). */
function saltoDuplo(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade): void {
  const salto = e.habilidades[0];
  const c = criaturaDe(e);
  if (!salto || !temMarca(estado, ctx, e, 'saltoDuplo') || estado.tick < (c.proximoFoleTick ?? 0) || recargaRestante(estado, e.id, salto) === 0) return;
  estado.recargas[chaveRecarga(e.id, salto)] = estado.tick;
  c.proximoFoleTick = estado.tick + ticksDe(6000);
}

/** O tick da caça das criaturas: true quando ela tomou o tick (a IA do arquétipo não roda). */
export function cacarComoCriatura(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, ia: EstadoIa, preset: PresetInimigo, alvo: Entidade, saida: EventoSimulacao[]): boolean {
  if (!podeFerir(e, alvo, ctx.modo)) return false;
  if (espelhar(estado, ctx, e, ia, alvo, saida)) return true;
  if (preset.comportamento === 'saltador') saltoDuplo(estado, ctx, e);
  const caca = preset.comportamento ? CACAS[preset.comportamento] : undefined;
  return caca ? caca(estado, ctx, e, ia, alvo, saida) : false;
}
