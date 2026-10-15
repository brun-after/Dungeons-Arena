// Sala da campanha cooperativa (marco 15, 15/10/2026, D-061): até 6 jogadores, cada um no próprio aparelho, jogando
// a campanha de quem criou o grupo. Reaproveita a SalaArena inteira (sessões, agenda, taxa, patches a 20 Hz,
// reconexão e loopback) e acrescenta:
// - entrada com o personagem do slot, conferido (coop/personagem.ts);
// - canal privado: cada sessão recebe só a própria bolsa (o estado público continua sem bolsas);
// - anfitrião: o primeiro a entrar (e, se sair, o mais antigo); só ele troca a dificuldade;
// - saída pela regra do modo (`todos_vivos`): com todos os vivos sobre a saída aberta, a sala monta a fase seguinte,
//   leva os personagens com vida e mana cheias e manda `novaFase` (época nova).
// A escala pelo tamanho do grupo é a da dificuldade (modos/dificuldade.ts), pelos personagens com bolsa presentes.

import { versaoDoConteudo, type MensagemCliente, type MotivoRejeicao } from '../arena/protocolo';
import { SalaArena, type EntradaDePersonagem, type OpcoesSala, type Sessao } from '../arena/sala';
import type { Celula, Comando, EntidadeId } from '../core/comandos';
import { modoPorId, type Conteudo } from '../core/conteudo';
import type { ContextoSimulacao } from '../core/contexto';
import { buscarEntidade, type EstadoJogo } from '../core/estado';
import type { Entidade } from '../entities/entidade';
import type { Dificuldade } from '../modos/dificuldade';
import { equipeDeEntrada, faseConcluida } from '../modos/regras';
import type { RefFase } from '../save/esquema';
import { contextoDaFase, estadoInicialDaFase, faseOficialOuGerada, faseSeguinte } from '../save/fases-campanha';
import { personagemNoInicio } from '../save/transicao';
import { reservaCelula } from '../world/colisao';
import { passavel } from '../world/fase';
import { naSaidaAberta } from '../world/portas';
import { conferirPersonagem, previaDoPersonagem } from './personagem';

export const MODO_COOPERATIVO = 'cooperativo';
/** Até onde procurar uma célula livre em volta do ponto de entrada. */
const RAIO_ENTRADA = 8;

export interface OpcoesSalaCampanha {
  semente: number;
  faseRef: RefFase;
  dificuldade: Dificuldade;
  versaoConteudo?: string;
}

export type CriacaoDeSala = { ok: true; sala: SalaCampanha } | { ok: false; erro: 'aventura' | 'fase_invalida' };

/** A sala nasce na fase do anfitrião. Aventuras do editor ficam no aparelho dele: não vão para o grupo. */
export function criarSalaCampanha(conteudo: Conteudo, o: OpcoesSalaCampanha): CriacaoDeSala {
  if (o.faseRef.tipo === 'aventura') return { ok: false, erro: 'aventura' };
  const r = contextoDaFase(conteudo, faseOficialOuGerada(o.faseRef, conteudo), modoPorId(conteudo, MODO_COOPERATIVO));
  if (!r.ok) return { ok: false, erro: 'fase_invalida' };
  const estado = estadoInicialDaFase(r.ctx);
  estado.dificuldade = o.dificuldade;
  const opcoes: OpcoesSala = { semente: o.semente, versaoConteudo: o.versaoConteudo ?? versaoDoConteudo() };
  return { ok: true, sala: new SalaCampanha(r.ctx, opcoes, estado, o.faseRef) };
}

/**
 * A célula desocupada mais perto de `origem` (busca em largura pelas passáveis), para o grupo não nascer empilhado —
 * jogadores não se bloqueiam (balance.colisao), então a conta é de quem ocupa, não de quem bloqueia.
 */
function celulaDeEntrada(estado: EstadoJogo, ctx: ContextoSimulacao, e: Entidade, origem: Celula): Celula {
  const visto = new Set<string>([`${origem.x},${origem.y}`]);
  const fila: Celula[] = [origem];
  for (let i = 0; i < fila.length; i++) {
    const c = fila[i];
    if (!c) break;
    if (passavel(ctx.fase, c.x, c.y) && !estado.entidades.some((o) => o.id !== e.id && !o.morto && reservaCelula(o, c.x, c.y))) return c;
    if (Math.max(Math.abs(c.x - origem.x), Math.abs(c.y - origem.y)) >= RAIO_ENTRADA) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]] as const) {
      const v = { x: c.x + dx, y: c.y + dy };
      const chave = `${v.x},${v.y}`;
      if (visto.has(chave) || !passavel(ctx.fase, v.x, v.y)) continue;
      visto.add(chave);
      fila.push(v);
    }
  }
  return origem;
}

function posicionar(e: Entidade, c: Celula): void {
  Object.assign(e, { x: c.x, y: c.y, destinoX: c.x, destinoY: c.y, origemX: c.x, origemY: c.y });
}

export class SalaCampanha extends SalaArena {
  faseRef: RefFase;
  /** Sessão do anfitrião (null com a sala vazia). */
  private anfitriao: string | null = null;
  /** A época que cada sessão já conhece: quem voltou de uma queda depois da troca de fase recebe a `novaFase`. */
  private readonly epocaVista = new Map<string, number>();
  private fimAvisado = false;

  constructor(ctx: ContextoSimulacao, opcoes: OpcoesSala, estado: EstadoJogo, faseRef: RefFase) {
    super(ctx, opcoes, estado);
    this.faseRef = faseRef;
  }

  get nomeFase(): string {
    return this.ctx.fase.nome;
  }

  /** A sessão do anfitrião, por id (para os testes e o servidor). */
  ehAnfitriao(sessaoId: string): boolean {
    return this.anfitriao === sessaoId;
  }

  protected override criarPersonagem(msg: Extract<MensagemCliente, { t: 'entrar' }>, jogadorId: string, entidadeId: EntidadeId): EntradaDePersonagem {
    const r = conferirPersonagem(msg.pedidoFicha, this.ctx, entidadeId, jogadorId);
    if (!r) return { ok: false, motivo: 'personagem_invalido' };
    const e = r.entidade;
    e.controlador = 'remoto';
    e.equipe = equipeDeEntrada(this.ctx.modo, jogadorId, this.estado);
    posicionar(e, celulaDeEntrada(this.estado, this.ctx, e, this.ctx.fase.spawns[0] ?? { x: 1, y: 1 }));
    this.estado.entidades.push(e);
    return { ok: true, previa: previaDoPersonagem(e, r.alteracoes, this.ctx.modo.id, this.ctx.balance.versao) };
  }

  protected override aoEntrar(s: Sessao): void {
    this.anfitriao ??= s.sessaoId;
    this.epocaVista.set(s.sessaoId, this.epoca);
  }

  protected override aoRemoverSessao(s: Sessao): void {
    this.epocaVista.delete(s.sessaoId);
    if (this.anfitriao !== s.sessaoId) return;
    // O mais antigo que ficou vira o anfitrião (a ordem do Map é a de entrada).
    this.anfitriao = this.sessoes.keys().next().value ?? null;
  }

  protected override motivoParaRecusar(s: Sessao, cmd: Comando): MotivoRejeicao | null {
    const base = super.motivoParaRecusar(s, cmd);
    if (base) return base;
    // A dificuldade é do grupo: só o anfitrião troca.
    return cmd.t === 'definirDificuldade' && s.sessaoId !== this.anfitriao ? 'nao_permitido' : null;
  }

  protected override depoisDoTick(): void {
    this.conferirSaida();
    for (const s of this.sessoes.values()) {
      if (s.conectada && this.epocaVista.get(s.sessaoId) !== this.epoca) this.mandarNovaFase(s);
    }
  }

  protected override dadosDoAnfitriao(s: Sessao): { anfitriao: boolean; anfitriaoId: string | null } {
    const anfitriaoId = (this.anfitriao && this.sessoes.get(this.anfitriao)?.entidadeId) ?? null;
    return { anfitriao: this.anfitriao === s.sessaoId, anfitriaoId };
  }

  private mandarNovaFase(s: Sessao, publico?: EstadoJogo): void {
    this.epocaVista.set(s.sessaoId, this.epoca);
    this.esquecerPrivado(s);
    this.enviarPara(s, {
      t: 'novaFase',
      faseRef: this.faseRef,
      nome: this.ctx.fase.nome,
      epocaSala: this.epoca,
      tick: this.estado.tick,
      ackSeq: s.ultimoSeq,
      estado: publico ?? this.estadoPublicoAtual(),
    });
  }

  /** Os personagens das sessões conectadas: quem caiu não segura o grupo na porta. */
  private jogadoresPresentes(): Entidade[] {
    const lista: Entidade[] = [];
    for (const s of this.sessoes.values()) {
      const e = s.conectada ? buscarEntidade(this.estado, s.entidadeId) : undefined;
      if (e) lista.push(e);
    }
    return lista;
  }

  private conferirSaida(): void {
    const jogadores = this.jogadoresPresentes();
    if (!faseConcluida(this.ctx.modo, jogadores, (e) => naSaidaAberta(this.estado, this.ctx, e))) return;
    this.avancar();
  }

  /** Monta a fase seguinte e leva todos (inclusive quem está na reserva de reconexão). */
  avancar(): boolean {
    const proxima = faseSeguinte(this.faseRef);
    const r = proxima ? contextoDaFase(this.ctx.conteudo, faseOficialOuGerada(proxima, this.ctx.conteudo), this.ctx.modo) : null;
    if (!proxima || !r?.ok) {
      if (!this.fimAvisado) {
        this.fimAvisado = true;
        for (const s of this.sessoes.values()) this.enviarPara(s, { t: 'fimDaCampanha' });
      }
      return false;
    }
    const estado = estadoInicialDaFase(r.ctx);
    estado.dificuldade = this.estado.dificuldade;
    const spawn = r.ctx.fase.spawns[0] ?? { x: 1, y: 1 };
    for (const s of this.sessoes.values()) {
      const e = buscarEntidade(this.estado, s.entidadeId);
      if (!e) continue;
      const novo = personagemNoInicio(e, spawn);
      posicionar(novo, celulaDeEntrada(estado, r.ctx, novo, spawn));
      estado.entidades.push(novo);
    }
    this.faseRef = proxima;
    this.fimAvisado = false;
    const publico = this.trocarMundo(r.ctx, estado);
    for (const s of this.sessoes.values()) if (s.conectada) this.mandarNovaFase(s, publico);
    return true;
  }
}
