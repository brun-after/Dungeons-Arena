// Marco 54 (26/11/2026, D-207): a sala do Mundo contínuo. Um canal é o atlas inteiro numa sala só
// (mundo/mundo-continuo.ts); tudo o que a sala de uma região fazia pela região dela, esta faz pela zona onde cada um
// está (mundo/zonas.ts):
// - o aviso `lugar` (nome, perigo, PvP) e a descoberta vão quando a pessoa cruza para outra zona;
// - o PvP e o loot são da zona (modo.zonas, modos/regras-por-zona.ts), e os eventos (lua sangrenta, mercador
//   errante), a noite e os focos são conferidos por zona onde há alguém;
// - a viagem para uma região (pedra de save, portal, Pedra de retorno, renascer, saída de um interior) não troca de
//   sala: só leva a pessoa (e as invocações dela) ao ponto no atlas. A ficha guarda as posições na região (como
//   antes), e a sala converte;
// - o que está longe de todo jogador hiberna (mundo/hibernacao.ts).
// Os interiores (masmorras e covis) continuam salas próprias.

import type { Celula, EntidadeId } from '../core/comandos';
import type { Conteudo } from '../core/conteudo';
import { buscarEntidade } from '../core/estado';
import { celulaDeEntrada, colocarEm } from '../coop/sala-campanha';
import type { Entidade } from '../entities/entidade';
import type { Sessao } from '../arena/sala';
import { garantirAcampamento, registrarAcampamentos } from './acampamento-sala';
import { doAtlas, paraOAtlas } from './atlas';
import { descobrir, type FichaDoMundo } from './ficha-mundo';
import { eventoDaRegiao, type EventoAtivo } from './eventos-mundo';
import { Hibernacao } from './hibernacao';
import { ID_LUGAR_MUNDO } from './lugares';
import type { MundoMontado } from './mundo-continuo';
import { conferirFocosENoite } from './noite';
import { novoObjeto } from '../world/objeto-novo';
import { passavel } from '../world/fase';
import { chaveDoDono, REF_ERRANTE } from './objetos-mundo';
import { territorioDoLugar, type Reino, type RegiaoDoMundo } from './reino';
import { SalaMundo, type OpcoesSalaMundo, type Presenca } from './sala-mundo';
import { zonaEm } from './zonas';

const PREFIXO_MERCADOR = 'evento-mercador:';

export class SalaMundoContinuo extends SalaMundo {
  private readonly mundo: MundoMontado;
  private readonly hibernacao: Hibernacao;
  /** A última zona avisada a cada sessão (por entidade). */
  private readonly zonaAvisada = new Map<EntidadeId, string | null>();
  private readonly eventos = new Map<string, EventoAtivo | null>();

  constructor(reino: Reino, conteudo: Conteudo, mundo: MundoMontado, opcoes: OpcoesSalaMundo) {
    super(reino, { tipo: 'mundo' }, conteudo, { ...opcoes, molde: mundo });
    this.mundo = mundo;
    this.hibernacao = new Hibernacao(this.ctx.balance.mundo.hibernacao);
    this.aplicarRegrasDasZonas();
    this.hibernacao.conferir(this.estado, true);
  }

  /** Quantos dormem agora (as métricas e a carga). */
  dormindo(): ReturnType<Hibernacao['dormindo']> {
    return this.hibernacao.dormindo();
  }

  /** O PvP e o loot de cada zona no modo (o loot com a lua sangrenta da zona, se houver). */
  private aplicarRegrasDasZonas(): void {
    const z = this.mundo.zonas;
    const lua = this.ctx.balance.mundo.eventos.luaLootPct;
    const regras = z.ids.map((id) => {
      const r = this.reino.regioes.find((x) => x.id === id);
      const p = r ? this.reino.perigos[r.perigo] : null;
      const comLua = this.eventos.get(id)?.evento === 'lua_sangrenta';
      return { pvp: p?.pvp ?? false, lootPct: ((p?.lootPct ?? 100) * (comLua ? lua : 100)) / 100 };
    });
    this.ctx = { ...this.ctx, modo: { ...this.ctx.modo, fogoAmigo: false, zonas: { largura: z.largura, altura: z.altura, celulas: z.celulas, pvp: regras.map((r) => r.pvp), lootPct: regras.map((r) => r.lootPct) } } };
  }

  protected override regiaoDe(p: { x: number; y: number }): RegiaoDoMundo | null {
    const id = zonaEm(this.mundo.zonas, p.x, p.y);
    return id ? (this.mundo.regioesNoAtlas.get(id) ?? null) : null;
  }

  protected override descreverLugar(e: Entidade | undefined): ReturnType<SalaMundo['descreverLugar']> {
    const r = e ? this.regiaoDe(e) : null;
    if (!r) return { lugar: ID_LUGAR_MUNDO, nome: this.reino.nome, perigo: 'normal', pvp: false };
    return { lugar: `regiao:${r.id}`, nome: r.nome, perigo: r.perigo, pvp: this.reino.perigos[r.perigo].pvp };
  }

  /** O acampamento fica na ficha em coordenadas da região; aqui, a fogueira vai ao atlas. */
  protected override garantirAcampamentoDe(ficha: FichaDoMundo, e: Entidade): void {
    const a = ficha.acampamento;
    const area = a ? this.mundo.atlas.areas.get(a.regiao) : undefined;
    if (!a || !area) return;
    garantirAcampamento(this.estado, this.ctx, { ...ficha, acampamento: { ...a, ...paraOAtlas(area, a.x, a.y) } }, a.regiao, chaveDoDono(e), this.opcoesMundo.agora());
  }

  protected override registrarAcampamentosDoTick(): void {
    for (const ev of this.eventosDoTick) {
      if (ev.t !== 'acampamentoAceso') continue;
      const zona = zonaEm(this.mundo.zonas, ev.x, ev.y);
      const area = zona ? this.mundo.atlas.areas.get(zona) : undefined;
      if (!zona || !area) continue;
      registrarAcampamentos([{ ...ev, ...doAtlas(area, ev.x, ev.y) }], zona, (d) => this.fichaDoDono(d), this.opcoesMundo.agora(), this.estado.tick, this.ctx);
    }
  }

  /**
   * Para uma região do atlas, a pessoa só é levada ao ponto (a chegada vem em coordenadas da região; sem ela, a pedra de
   * save dela). Para um interior, a troca de sala de sempre.
   */
  protected override trocar(s: Sessao, p: Presenca, destino: string, chegada: Celula | null, instancia: string | null): void {
    const id = destino.startsWith('regiao:') ? destino.slice('regiao:'.length) : null;
    const area = id ? this.mundo.atlas.areas.get(id) : undefined;
    const e = buscarEntidade(this.estado, s.entidadeId);
    if (!id || !area || !e) {
      super.trocar(s, p, destino, chegada, instancia);
      return;
    }
    const alvo = chegada ? paraOAtlas(area, chegada.x, chegada.y) : (this.pedraDe(id) ?? { x: area.x + (area.largura >> 1), y: area.y + (area.altura >> 1) });
    this.levar(e, alvo);
  }

  /** Onde chega quem vem de fora da sala para a região (a chegada dela, ou a pedra de save), no atlas. */
  chegadaNoAtlas(regiaoId: string, local: Celula | null): Celula | null {
    const area = this.mundo.atlas.areas.get(regiaoId);
    if (!area) return null;
    return local ? paraOAtlas(area, local.x, local.y) : (this.pedraDe(regiaoId) ?? { x: area.x + (area.largura >> 1), y: area.y + (area.altura >> 1) });
  }

  /** A célula ao lado da pedra de save da região (a vila, ou o abrigo do centro). */
  private pedraDe(regiaoId: string): Celula | null {
    for (const ponto of this.mundo.exterior?.pontos ?? []) {
      if (ponto.tipo === 'npc' && ponto.papel === 'save' && zonaEm(this.mundo.zonas, ponto.x, ponto.y) === regiaoId) return { x: ponto.x, y: ponto.y + 1 };
    }
    return null;
  }

  /** Leva a entidade e as invocações dela ao ponto, e acorda o que está lá antes do próximo tique. */
  private levar(e: Entidade, alvo: Celula): void {
    colocarEm(e, celulaDeEntrada(this.estado, this.ctx, e, alvo));
    for (const x of this.estado.entidades) if (x.invocacao?.donoId === e.id) colocarEm(x, celulaDeEntrada(this.estado, this.ctx, x, { x: e.x, y: e.y + 1 }));
    this.hibernacao.conferir(this.estado, true);
  }

  /** Quem entra acorda o que está em volta antes do primeiro estado (a vila, a pedra, as lojas). */
  protected override aoEntrar(s: Sessao): void {
    this.hibernacao.conferir(this.estado, true);
    super.aoEntrar(s);
  }

  protected override depoisDoTick(): void {
    super.depoisDoTick();
    this.hibernacao.conferir(this.estado);
    for (const s of this.sessoes.values()) {
      const e = buscarEntidade(this.estado, s.entidadeId);
      const p = this.presencas.get(s.entidadeId);
      if (!e || !p) continue;
      const zona = zonaEm(this.mundo.zonas, e.x, e.y);
      if (this.zonaAvisada.get(e.id) === zona) continue;
      const primeira = !this.zonaAvisada.has(e.id);
      this.zonaAvisada.set(e.id, zona);
      if (primeira || !zona) continue; // o aviso da entrada já foi pelo `aoEntrar`
      this.avisarZona(s, e, p, zona);
    }
  }

  /** Cruzou para outra zona: o aviso do lugar, a descoberta e o evento dela. */
  private avisarZona(s: Sessao, e: Entidade, p: Presenca, zona: string): void {
    const aqui = this.descreverLugar(e);
    if (descobrir(p.ficha, aqui.lugar)) this.avisar(s, { tipo: 'descoberta', lugar: aqui.lugar, nome: aqui.nome });
    this.avisar(s, { tipo: 'lugar', ...aqui, canal: this.canal, vilaSalva: p.ficha.vilaSalva, descobertas: [...p.ficha.descobertas] });
    const ev = this.eventos.get(zona);
    this.avisar(s, { tipo: 'evento', evento: ev?.evento ?? null, fim: ev?.fim ?? 0 });
  }

  /** As zonas onde há alguém agora. */
  private zonasComGente(): Map<string, Entidade[]> {
    const m = new Map<string, Entidade[]>();
    for (const s of this.sessoes.values()) {
      const e = buscarEntidade(this.estado, s.entidadeId);
      const z = e ? zonaEm(this.mundo.zonas, e.x, e.y) : null;
      if (e && z) m.set(z, [...(m.get(z) ?? []), e]);
    }
    return m;
  }

  /** Os eventos por zona (a lua muda o loot dela; o mercador aparece ao lado da pedra de save dela). */
  protected override conferirEvento(): void {
    let mudou = false;
    for (const r of this.reino.regioes) {
      const agora = eventoDaRegiao(r.id, r.perigo, this.opcoesMundo.agora(), this.ctx.balance.mundo.eventos);
      const antes = this.eventos.get(r.id) ?? null;
      if (agora?.evento === antes?.evento && agora?.fim === antes?.fim) continue;
      mudou = true;
      this.eventos.set(r.id, agora);
      const idMercador = `${PREFIXO_MERCADOR}${r.id}`;
      this.estado.objetos = this.estado.objetos.filter((o) => o.objetoId !== idMercador);
      const pedra = agora?.evento === 'mercador_errante' ? this.pedraDe(r.id) : null;
      const c = pedra && this.celulaLivrePerto(pedra);
      if (c) this.estado.objetos.push(novoObjeto(idMercador, 'loja', c.x, c.y, { ref: REF_ERRANTE, itens: [...territorioDoLugar(this.reino, r.id).mercadorErrante] }));
      for (const s of this.sessoes.values()) {
        const e = buscarEntidade(this.estado, s.entidadeId);
        if (e && zonaEm(this.mundo.zonas, e.x, e.y) === r.id) this.avisar(s, { tipo: 'evento', evento: agora?.evento ?? null, fim: agora?.fim ?? 0 });
      }
    }
    if (mudou) this.aplicarRegrasDasZonas();
  }

  private celulaLivrePerto(c: Celula): Celula | null {
    for (let d = 3; d <= 8; d++) {
      for (const [dx, dy] of [[d, 0], [-d, 0], [0, d], [0, -d], [d, d], [-d, -d]] as const) {
        const x = c.x + dx;
        const y = c.y + dy;
        if (passavel(this.ctx.fase, x, y) && !this.estado.objetos.some((o) => o.x === x && o.y === y)) return { x, y };
      }
    }
    return null;
  }

  /** A noite e os focos, por zona onde há alguém (o acampamento, uma vez só). */
  protected override conferirFocos(): void {
    let primeira = true;
    for (const zona of this.zonasComGente().keys()) {
      const r = this.mundo.regioesNoAtlas.get(zona);
      if (!r) continue;
      const naZona = (c: { x: number; y: number }) => zonaEm(this.mundo.zonas, c.x, c.y) === zona;
      this.ctx = conferirFocosENoite(this.estado, this.ctx, r, this.opcoesMundo.agora(), { naZona, semAcampamentos: !primeira });
      primeira = false;
    }
  }
}
