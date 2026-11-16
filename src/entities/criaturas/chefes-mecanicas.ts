// Marco 45 (16/11/2026, D-181): as mecânicas dos chefes de Filo, uma por id (`chefe.mecanica` no preset). Cada uma
// diz o que acontece no começo da luta, a cada tick, no dano que o chefe leva ou causa, quando cai um objeto dele ou
// alguém perto, e quando uma marca no chão vence. Os números vêm de `chefe.numeros` (o padrão fica ao lado).

import type { ContextoSimulacao } from '../../core/contexto';
import type { EstadoJogo } from '../../core/estado';
import type { EventoSimulacao } from '../../core/eventos-simulacao';
import { ticksDe } from '../../core/tempo';
import { aplicarEfeito } from '../../combat/efeitos';
import { vizinhasLivres } from '../../combat/efeitos-fluxo';
import { celulaOcupada, chebyshev } from '../../combat/geometria';
import { construirEfeito, type TipoEfeito } from '../../combat/registro-efeitos';
import { emPasso, posicionar, vivo, type Entidade } from '../entidade';
import { anel, criaturaDoChefe, declararRegra, ferir, marcarZona, numero, objetosVivos, porNaArena } from './chefes-base';
import { hostis } from './tracos';
import type { EstadoCriatura, IdMecanica, MecanicaDeChefe } from './tipos';

type Zona = NonNullable<EstadoCriatura['zonas']>[number];
type Contexto = { costas: boolean; contato: boolean };

export interface Mecanica {
  inicio?: (estado: EstadoJogo, ctx: ContextoSimulacao, chefe: Entidade, m: MecanicaDeChefe, saida: EventoSimulacao[]) => void;
  tick: (estado: EstadoJogo, ctx: ContextoSimulacao, chefe: Entidade, m: MecanicaDeChefe, saida: EventoSimulacao[]) => void;
  protecao?: (estado: EstadoJogo, ctx: ContextoSimulacao, chefe: Entidade, m: MecanicaDeChefe, c: Contexto) => number;
  forca?: (estado: EstadoJogo, ctx: ContextoSimulacao, chefe: Entidade, m: MecanicaDeChefe) => number;
  objetoCaiu?: (estado: EstadoJogo, ctx: ContextoSimulacao, chefe: Entidade, m: MecanicaDeChefe, objeto: Entidade, saida: EventoSimulacao[]) => void;
  alguemCaiu?: (estado: EstadoJogo, ctx: ContextoSimulacao, chefe: Entidade, m: MecanicaDeChefe, quem: Entidade, saida: EventoSimulacao[]) => void;
  fimDaZona?: (estado: EstadoJogo, ctx: ContextoSimulacao, chefe: Entidade, m: MecanicaDeChefe, z: Zona, saida: EventoSimulacao[]) => void;
}

/** O ciclo do chefe: true de `aCadaMs` em `aCadaMs` (o primeiro, um ciclo depois do começo). */
function ciclo(estado: EstadoJogo, chefe: Entidade, ms: number): boolean {
  const c = criaturaDoChefe(chefe);
  if (c.proximoCicloTick === undefined) { c.proximoCicloTick = estado.tick + ticksDe(ms); return false; }
  if (estado.tick < c.proximoCicloTick) return false;
  c.proximoCicloTick = estado.tick + ticksDe(ms);
  return true;
}

const daArena = (estado: EstadoJogo, ctx: ContextoSimulacao, chefe: Entidade): Entidade[] => hostis(estado, ctx, chefe, 12);
const exposto = (estado: EstadoJogo, chefe: Entidade): boolean => estado.tick < (chefe.criatura?.expostoAteTick ?? -1);
const dar = (estado: EstadoJogo, ctx: ContextoSimulacao, chefe: Entidade, alvo: Entidade, tipo: TipoEfeito, duracaoMs: number, saida: EventoSimulacao[], pct = 0): void => {
  aplicarEfeito(estado, ctx, alvo, construirEfeito(tipo, { duracaoMs, pct, valor: pct }), { id: chefe.id, x: chefe.x, y: chefe.y }, null, saida, false);
};
const dentro = (z: Zona, e: Entidade): boolean => Math.max(Math.abs(Math.round(e.x) - z.x), Math.abs(Math.round(e.y) - z.y)) <= z.raio;

/** Põe os objetos da mecânica em anel em volta da arena. */
function porObjetos(estado: EstadoJogo, ctx: ContextoSimulacao, chefe: Entidade, m: MecanicaDeChefe, saida: EventoSimulacao[]): void {
  if (!m.ref) return;
  const centro = chefe.criatura?.arena ?? celulaOcupada(chefe);
  for (const c of anel(centro, numero(m, 'raio', 6), numero(m, 'qtd', 3))) porNaArena(estado, ctx, chefe, m.ref, c, saida);
}

// Rei das Fagulhas: com fagulheiros vivos por perto, leva metade do dano.
const bandoArmadura: Mecanica = {
  tick: () => undefined,
  protecao: (estado, _ctx, chefe, m) =>
    estado.entidades.some((o) => vivo(o) && o.preset === 'goblin' && chebyshev(o, chefe) <= numero(m, 'raio', 8)) ? 1 - numero(m, 'reducaoPct', 50) / 100 : 1,
};

// Dragão da Fornalha: a cada degrau de vida perdida, mais chão vira brasa.
const fornalhaFases: Mecanica = {
  tick: (estado, ctx, chefe, m, saida) => {
    const c = criaturaDoChefe(chefe);
    const degrau = Math.floor(((chefe.hpMax - chefe.hp) * 100) / Math.max(1, chefe.hpMax) / numero(m, 'passoPct', 25));
    if (degrau <= (c.fase ?? 0)) return;
    c.fase = degrau;
    const queimando = construirEfeito('queimando', { valor: 3, duracaoMs: 3000 });
    const campo = { ...construirEfeito('campo_veneno', { valor: 3, duracaoMs: numero(m, 'ms', 25000) }), interno: queimando };
    for (const p of anel(celulaOcupada(chefe), 2 + degrau, numero(m, 'campos', 4) + degrau)) {
      aplicarEfeito(estado, ctx, chefe, campo, { id: chefe.id, x: chefe.x, y: chefe.y }, p, saida);
    }
  },
};

// Dragão do Silêncio: zonas no chão em que ninguém usa skill.
const zonasSilencio: Mecanica = {
  tick: (estado, ctx, chefe, m, saida) => {
    if (ciclo(estado, chefe, numero(m, 'aCadaMs', 9000))) {
      for (const h of daArena(estado, ctx, chefe).slice(0, numero(m, 'zonas', 2))) marcarZona(estado, chefe, 'silencio', celulaOcupada(h), numero(m, 'raio', 2), numero(m, 'ms', 6000), saida);
    }
    for (const z of chefe.criatura?.zonas ?? []) for (const h of daArena(estado, ctx, chefe)) if (dentro(z, h)) dar(estado, ctx, chefe, h, 'silenciar', 600, saida);
  },
};

// Imperatriz das Estátuas: quem fica parado congela; quem cai vira estátua, e quebrá-la traz o aliado de volta.
const estatuasDeAliados: Mecanica = {
  tick: (estado, ctx, chefe, m, saida) => {
    if (!ciclo(estado, chefe, numero(m, 'paradoMs', 2000))) return;
    for (const h of daArena(estado, ctx, chefe)) if (!emPasso(h) && h.caminho.length === 0 && !h.acao) dar(estado, ctx, chefe, h, 'congelado', numero(m, 'congelaMs', 1500), saida);
  },
  alguemCaiu: (estado, ctx, chefe, m, quem, saida) => {
    if (!quem.bolsa) return;
    const est = porNaArena(estado, ctx, chefe, 'estatua_de_gelo', celulaOcupada(quem), saida);
    if (est) {
      criaturaDoChefe(est).marcados = [quem.id];
      criaturaDoChefe(est).proximoCicloTick = estado.tick + ticksDe(numero(m, 'ms', 10000));
    }
  },
  objetoCaiu: (estado, _ctx, _chefe, _m, objeto, saida) => {
    const preso = objeto.criatura?.marcados?.[0];
    const caido = preso ? estado.entidades.find((x) => x.id === preso && x.morto) : undefined;
    if (!caido || estado.tick > (objeto.criatura?.proximoCicloTick ?? 0)) return;
    caido.morto = false;
    caido.reviverEmTick = 0;
    caido.hp = Math.max(1, Math.round(caido.hpMax * 0.3));
    caido.efeitos = [];
    caido.participacao = [];
    saida.push({ t: 'reviveu', tick: estado.tick, id: caido.id });
  },
};

// Dragão da Tempestade Engrenada: as torres o recarregam; derrubar uma o expõe.
const torresDeRecarga: Mecanica = {
  inicio: porObjetos,
  tick: () => undefined,
  protecao: (estado, _ctx, chefe, m) => (exposto(estado, chefe) ? 1.25 : objetosVivos(estado, chefe).length > 0 ? 1 - numero(m, 'reducaoPct', 60) / 100 : 1),
  objetoCaiu: (estado, _ctx, chefe, m) => { criaturaDoChefe(chefe).expostoAteTick = estado.tick + ticksDe(numero(m, 'expostoMs', 8000)); },
};

// Maquinista Voltaico: os reféns nos cabos o curam e o protegem; cortar o cabo solta o refém.
const refens: Mecanica = {
  inicio: porObjetos,
  tick: (estado, _ctx, chefe, m) => {
    const n = objetosVivos(estado, chefe).length;
    if (n === 0 || !ciclo(estado, chefe, 1000)) return;
    chefe.hp = Math.min(chefe.hpMax, chefe.hp + Math.round((chefe.hpMax * numero(m, 'curaPctPorS', 1) * n) / 100));
  },
  protecao: (estado, _ctx, chefe, m) => (objetosVivos(estado, chefe).length > 0 ? 1 - numero(m, 'reducaoPct', 50) / 100 : 1),
};

// Dragão Fermentado: a névoa cresce com a luta; os cogumelos-pulmão limpam o ar quando caem.
const nevoaCrescente: Mecanica = {
  inicio: porObjetos,
  tick: (estado, ctx, chefe, m, saida) => {
    if (!ciclo(estado, chefe, numero(m, 'aCadaMs', 8000))) return;
    const c = criaturaDoChefe(chefe);
    c.fase = (c.fase ?? 0) + 1;
    const veneno = construirEfeito('envenenado', { valor: 2, pct: 50, duracaoMs: 4000 });
    const campo = { ...construirEfeito('campo_veneno', { valor: 2, duracaoMs: 30000 }), interno: veneno };
    for (const p of anel(celulaOcupada(chefe), 1 + c.fase, 3 + c.fase)) aplicarEfeito(estado, ctx, chefe, campo, { id: chefe.id, x: chefe.x, y: chefe.y }, p, saida);
  },
  objetoCaiu: (estado, ctx, chefe, m, objeto, saida) => {
    const c = criaturaDoChefe(chefe);
    c.fase = Math.max(0, (c.fase ?? 0) - 2);
    for (const h of hostis(estado, ctx, objeto, numero(m, 'limpaRaio', 4))) dar(estado, ctx, chefe, h, 'purificar', 0, saida);
  },
};

// Mãe-Colmeia: bota casulos; o casulo que sobrevive choca um Enxame.
const casulos: Mecanica = {
  tick: (estado, _ctx, chefe, m, saida) => {
    if (ciclo(estado, chefe, numero(m, 'aCadaMs', 7000)) && m.ref) {
      const [p] = anel(celulaOcupada(chefe), numero(m, 'raio', 5), 1 + (estado.tick % 7));
      if (p) porNaArena(estado, _ctx, chefe, m.ref, p, saida);
    }
    const choca = ticksDe(numero(m, 'chocaMs', 12000));
    for (const o of objetosVivos(estado, chefe)) {
      if (o.preset !== m.ref || estado.tick - (o.criatura?.nascidoTick ?? estado.tick) < choca) continue;
      o.hp = 0;
      porNaArena(estado, _ctx, chefe, 'enxame_putrido', celulaOcupada(o), saida);
    }
  },
};

// Necromante Ancestral: rouba a sombra do alvo, que vira um clone que só sente a luz.
const roubarSombra: Mecanica = {
  tick: (estado, ctx, chefe, m, saida) => {
    if (!ciclo(estado, chefe, numero(m, 'aCadaMs', 15000)) || !m.ref || objetosVivos(estado, chefe).some((o) => o.preset === m.ref)) return;
    const alvo = chefe.ia?.alvoId ? estado.entidades.find((x) => x.id === chefe.ia?.alvoId) : daArena(estado, ctx, chefe)[0];
    const sombra = alvo ? porNaArena(estado, ctx, chefe, m.ref, celulaOcupada(alvo), saida) : null;
    if (sombra && alvo) sombra.nome = `Sombra de ${alvo.nome}`;
  },
};

// O Apagador: apaga as luzes e caça no escuro; cada braseiro aceso o enfraquece.
const braseiros: Mecanica = {
  inicio: porObjetos,
  tick: (estado, ctx, chefe, _m, saida) => {
    if (!ciclo(estado, chefe, 9000)) return;
    for (const h of daArena(estado, ctx, chefe)) aplicarEfeito(estado, ctx, h, construirEfeito('apagar_luz', {}), { id: chefe.id, x: chefe.x, y: chefe.y }, null, saida);
  },
  objetoCaiu: (_estado, _ctx, chefe) => { const c = criaturaDoChefe(chefe); c.fase = (c.fase ?? 0) + 1; },
  protecao: (_estado, _ctx, chefe, m) => 1 + ((chefe.criatura?.fase ?? 0) * numero(m, 'porBraseiroPct', 20)) / 100,
  forca: (_estado, _ctx, chefe, m) => Math.max(0.2, 1 - ((chefe.criatura?.fase ?? 0) * numero(m, 'porBraseiroPct', 20)) / 100),
};

// Bruxa dos Sonhos: adormece um jogador e o puxa para um sonho longe, onde luta contra o próprio reflexo.
const sonho: Mecanica = {
  tick: (estado, ctx, chefe, m, saida) => {
    if (!ciclo(estado, chefe, numero(m, 'aCadaMs', 18000)) || !m.ref) return;
    const alvo = daArena(estado, ctx, chefe).find((h) => h.bolsa);
    if (!alvo) return;
    const d = numero(m, 'distancia', 9);
    const longe = anel(celulaOcupada(chefe), d, 8).flatMap((c) => vizinhasLivres(estado, ctx, alvo, c).slice(0, 1))[0];
    if (!longe) return;
    posicionar(alvo, longe.x, longe.y);
    alvo.caminho = [];
    dar(estado, ctx, chefe, alvo, 'atordoar', 800, saida);
    marcarZona(estado, chefe, 'sonho', longe, 3, numero(m, 'ms', 8000), saida);
    const reflexo = porNaArena(estado, ctx, chefe, m.ref, longe, saida);
    if (reflexo) { reflexo.nome = `Reflexo de ${alvo.nome}`; criaturaDoChefe(reflexo).proximoCicloTick = estado.tick + ticksDe(numero(m, 'ms', 8000)); }
  },
  fimDaZona: (estado, _ctx, chefe, m) => { for (const o of objetosVivos(estado, chefe)) if (o.preset === m.ref) o.hp = 0; },
};

// Rei das Máscaras: a cada fase, uma máscara e uma regra (pelas costas, devolve, confunde).
const MASCARAS = ['costas', 'devolve', 'confunde'] as const;
const mascaras: Mecanica = {
  tick: (estado, ctx, chefe, m, saida) => {
    const c = criaturaDoChefe(chefe);
    const fase = Math.floor(((chefe.hpMax - chefe.hp) * 100) / Math.max(1, chefe.hpMax) / numero(m, 'passoPct', 33));
    if (c.regra === undefined || fase !== c.fase) {
      c.fase = fase;
      declararRegra(estado, chefe, MASCARAS[fase % MASCARAS.length] ?? 'costas', 3_600_000, saida);
    }
    if (c.regra === 'confunde' && ciclo(estado, chefe, 3000)) for (const h of hostis(estado, ctx, chefe, 4)) dar(estado, ctx, chefe, h, 'confuso', 1500, saida);
  },
  protecao: (_estado, _ctx, chefe, _m, x) => (chefe.criatura?.regra === 'costas' && !x.costas ? 0 : 1),
};

/** O Rei das Máscaras com a máscara que devolve: a fração do dano de skill que volta para quem bateu. */
export function devolucaoDaMascara(ctx: ContextoSimulacao, chefe: Entidade): number {
  const m = ctx.conteudo.presets.get(chefe.preset)?.chefe;
  return m?.mecanica === 'mascaras' && chefe.criatura?.regra === 'devolve' ? numero(m, 'devolvePct', 40) / 100 : 0;
}

// Dragão das Ruínas: ergue colunas que servem de cobertura e depois desabam.
const colunas: Mecanica = {
  tick: (estado, ctx, chefe, m, saida) => {
    if (!ciclo(estado, chefe, numero(m, 'aCadaMs', 12000)) || !m.ref) return;
    for (const h of daArena(estado, ctx, chefe).slice(0, numero(m, 'qtd', 2))) {
      const col = porNaArena(estado, ctx, chefe, m.ref, { x: Math.round(h.x) + 2, y: Math.round(h.y) }, saida);
      if (col) marcarZona(estado, chefe, 'coluna', celulaOcupada(col), numero(m, 'raio', 2), numero(m, 'desabaMs', 6000), saida);
    }
  },
  fimDaZona: (estado, ctx, chefe, _m, z, saida) => {
    const col = objetosVivos(estado, chefe).find((o) => Math.round(o.x) === z.x && Math.round(o.y) === z.y);
    if (!col) return;
    col.hp = 0;
    for (const h of daArena(estado, ctx, chefe)) if (dentro(z, h)) ferir(estado, ctx, chefe, h, h.hpMax * 0.2, saida);
  },
};

// Monarca de Geodo: fechado no geodo enquanto houver pilar; sem pilares, abre por um tempo e os pilares voltam.
const geodo: Mecanica = {
  inicio: porObjetos,
  tick: (estado, ctx, chefe, m, saida) => {
    const c = criaturaDoChefe(chefe);
    if (objetosVivos(estado, chefe).length === 0 && !exposto(estado, chefe)) {
      if (c.expostoAteTick === undefined || estado.tick >= c.expostoAteTick + 1) {
        if (c.fase === 1) { c.fase = 0; porObjetos(estado, ctx, chefe, m, saida); return; }
        c.fase = 1;
        c.expostoAteTick = estado.tick + ticksDe(numero(m, 'abertoMs', 15000));
      }
    }
  },
  protecao: (estado, _ctx, chefe) => (exposto(estado, chefe) ? 1.25 : objetosVivos(estado, chefe).length > 0 ? 0 : 1),
};

// Hierofante: declara um pecado e pune quem o comete na janela.
const PECADOS = ['skill', 'parado', 'cura'] as const;
const pecados: Mecanica = {
  tick: (estado, ctx, chefe, m, saida) => {
    const c = criaturaDoChefe(chefe);
    if (ciclo(estado, chefe, numero(m, 'aCadaMs', 20000))) {
      c.fase = ((c.fase ?? -1) + 1) % PECADOS.length;
      c.marcados = [];
      declararRegra(estado, chefe, PECADOS[c.fase] ?? 'skill', numero(m, 'janelaMs', 6000), saida);
      c.inspiraAteTick = estado.tick;
    }
    if (c.regra === undefined || estado.tick >= (c.regraAteTick ?? 0)) return;
    const desde = c.inspiraAteTick ?? estado.tick;
    for (const h of daArena(estado, ctx, chefe)) {
      if (!h.bolsa || c.marcados?.includes(h.id)) continue;
      const pecou = c.regra === 'skill' ? !!h.ultimaHabilidade && h.ultimaHabilidade.tick > desde && h.ultimaHabilidade.id !== h.ataqueBasico
        : c.regra === 'parado' ? !emPasso(h) && h.caminho.length === 0 && estado.tick - desde > ticksDe(1500)
          : saida.some((ev) => ev.t === 'efeitoResultado' && ev.alvoId === h.id && ev.cura > 0);
      if (!pecou) continue;
      (c.marcados ??= []).push(h.id);
      ferir(estado, ctx, chefe, h, (h.hpMax * numero(m, 'danoPct', 20)) / 100, saida);
    }
  },
};

// Almirante dos Ventos: as pipas de guerra bombardeiam pontos marcados.
const bombardeio: Mecanica = {
  tick: (estado, ctx, chefe, m, saida) => {
    if (!ciclo(estado, chefe, numero(m, 'aCadaMs', 6000))) return;
    for (const h of daArena(estado, ctx, chefe).slice(0, numero(m, 'pontos', 3))) marcarZona(estado, chefe, 'bombardeio', celulaOcupada(h), numero(m, 'raio', 1), numero(m, 'atrasoMs', 1500), saida);
  },
  fimDaZona: (estado, ctx, chefe, m, z, saida) => {
    if (z.tipo !== 'bombardeio') return;
    for (const h of daArena(estado, ctx, chefe)) if (dentro(z, h)) ferir(estado, ctx, chefe, h, numero(m, 'dano', 14) + chefe.nivel, saida);
  },
};

// Harpia Soberana: fica no ar, fora do alcance, e mergulha; o controle a derruba, e no chão ela fica exposta.
const CONTROLES: readonly TipoEfeito[] = ['atordoar', 'sem_movimento', 'congelado', 'enraizado', 'petrificado'];
const voo: Mecanica = {
  tick: (estado, ctx, chefe, m, saida) => {
    const c = criaturaDoChefe(chefe);
    const noAr = estado.tick < (c.noArAteTick ?? -1);
    if (noAr && chefe.efeitos.some((f) => CONTROLES.includes(f.tipo) && f.ateTick > estado.tick)) {
      c.noArAteTick = estado.tick;
      c.expostoAteTick = estado.tick + ticksDe(numero(m, 'chaoMs', 10000));
      return;
    }
    if (!noAr && !exposto(estado, chefe) && estado.tick >= (c.chaoAteTick ?? 0)) {
      c.noArAteTick = estado.tick + ticksDe(numero(m, 'noArMs', 8000));
      c.chaoAteTick = c.noArAteTick + ticksDe(numero(m, 'chaoMs', 10000));
    }
    if (noAr && ciclo(estado, chefe, numero(m, 'mergulhoMs', 4000))) {
      const alvo = daArena(estado, ctx, chefe)[0];
      if (alvo) marcarZona(estado, chefe, 'mergulho', celulaOcupada(alvo), 1, 1000, saida);
    }
  },
  fimDaZona: (estado, ctx, chefe, m, z, saida) => {
    if (z.tipo !== 'mergulho') return;
    const livre = vizinhasLivres(estado, ctx, chefe, { x: z.x, y: z.y })[0];
    if (livre) posicionar(chefe, livre.x, livre.y);
    for (const h of daArena(estado, ctx, chefe)) if (dentro(z, h)) ferir(estado, ctx, chefe, h, numero(m, 'dano', 18) + chefe.nivel, saida);
  },
  protecao: (estado, _ctx, chefe, _m, x) => (estado.tick < (chefe.criatura?.noArAteTick ?? -1) ? (x.contato ? 0 : 0.5) : exposto(estado, chefe) ? 1.25 : 1),
};

export const MECANICAS: Readonly<Record<IdMecanica, Mecanica>> & Readonly<Record<string, Mecanica | undefined>> = {
  bandoArmadura, fornalhaFases, zonasSilencio, estatuasDeAliados, torresDeRecarga, refens, nevoaCrescente, casulos,
  roubarSombra, braseiros, sonho, mascaras, colunas, geodo, pecados, bombardeio, voo,
};

/** A Harpia no ar (para a tela e para quem mira nela). */
export const harpiaNoAr = (estado: EstadoJogo, e: Entidade): boolean => estado.tick < (e.criatura?.noArAteTick ?? -1) && e.arquetipo === 'boss';
