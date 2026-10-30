// Os grupos do Mundo (marco 30, 30/10/2026, D-129), guardados pelo coordenador do servidor (valem em todas as salas
// do processo e somem quando ele reinicia). Até `mundo.grupo.max` personagens:
// - o convite vai pelo nome, tem validade e um id opaco (a identidade da conta nunca vai para os outros clientes);
// - quem aceita entra no grupo de quem convidou (que nasce no aceite, com o convidante de líder);
// - o líder expulsa; quem sai passa a liderança ao próximo; o grupo de um só se desfaz.
// No jogo, o grupo partilha a XP (a regra do modo), não se fere no PvP e entra junto na mesma masmorra. Puro.

import type { MotivoDoMundo } from './avisos';

export interface GrupoDoMundo {
  id: string;
  lider: string;
  /** Identidades, na ordem de entrada. */
  membros: string[];
}

interface Convite {
  id: string;
  de: string;
  para: string;
  expira: number;
}

export class GruposDoMundo {
  private readonly grupos = new Map<string, GrupoDoMundo>();
  private readonly deQuem = new Map<string, string>();
  private convites: Convite[] = [];
  private proximo = 1;

  constructor(
    private readonly max: number,
    private readonly validadeMs: number,
  ) {}

  grupoDe(identidade: string): GrupoDoMundo | undefined {
    const id = this.deQuem.get(identidade);
    return id ? this.grupos.get(id) : undefined;
  }

  /** O convite (devolve o id dele) ou o motivo da recusa. */
  convidar(de: string, para: string, agora: number): { convite: string } | MotivoDoMundo {
    this.convites = this.convites.filter((c) => c.expira > agora && !(c.de === de && c.para === para));
    if (de === para) return 'nao_encontrado';
    if (this.grupoDe(para)) return 'ja_em_grupo';
    const meu = this.grupoDe(de);
    if (meu && meu.lider !== de) return 'nao_lider';
    if (meu && meu.membros.length >= this.max) return 'grupo_cheio';
    const id = `c${String(this.proximo++)}`;
    this.convites.push({ id, de, para, expira: agora + this.validadeMs });
    return { convite: id };
  }

  /** Aceita o convite; devolve o grupo (novo ou o de quem convidou). */
  aceitar(quem: string, conviteId: string, agora: number): GrupoDoMundo | MotivoDoMundo {
    const c = this.convites.find((x) => x.id === conviteId && x.para === quem && x.expira > agora);
    if (!c) return 'convite_expirado';
    this.convites = this.convites.filter((x) => x !== c);
    if (this.grupoDe(quem)) return 'ja_em_grupo';
    let g = this.grupoDe(c.de);
    if (g && g.membros.length >= this.max) return 'grupo_cheio';
    if (!g) {
      g = { id: `g${String(this.proximo++)}`, lider: c.de, membros: [c.de] };
      this.grupos.set(g.id, g);
      this.deQuem.set(c.de, g.id);
    }
    g.membros.push(quem);
    this.deQuem.set(quem, g.id);
    return g;
  }

  /** Tira do grupo (saiu, foi expulso ou deixou o jogo de vez); devolve o grupo como ficou (ou desfeito). */
  sair(quem: string): { grupo: GrupoDoMundo; desfeito: boolean } | null {
    const g = this.grupoDe(quem);
    if (!g) return null;
    g.membros = g.membros.filter((m) => m !== quem);
    this.deQuem.delete(quem);
    if (g.lider === quem) g.lider = g.membros[0] ?? '';
    if (g.membros.length <= 1) {
      for (const m of g.membros) this.deQuem.delete(m);
      this.grupos.delete(g.id);
      return { grupo: g, desfeito: true };
    }
    return { grupo: g, desfeito: false };
  }

  expulsar(lider: string, alvo: string): { grupo: GrupoDoMundo; desfeito: boolean } | MotivoDoMundo {
    const g = this.grupoDe(lider);
    if (!g) return 'sem_grupo';
    if (g.lider !== lider) return 'nao_lider';
    if (!g.membros.includes(alvo) || alvo === lider) return 'nao_encontrado';
    return this.sair(alvo) ?? 'nao_encontrado';
  }
}
