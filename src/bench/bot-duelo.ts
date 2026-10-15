// Bot de duelo (marco 15/16, 15/10/2026): joga como uma pessoa razoável — mira o hostil mais próximo, usa a barra
// quando pronta, deixa o ataque básico automático, anda até o alcance, sai das áreas telegrafadas, toma poção com a
// vida baixa e, atacando de longe, se afasta de quem só bate de perto. Usado pelo simulador de balanceamento
// (tools/balanceamento) e pelas cenas de benchmark (?bench=). Puro: devolve comandos.

import { alcanceDe, recargaRestante } from '../combat/acao';
import { celulasDaForma } from '../combat/formas';
import { celulaOcupada, chebyshev } from '../combat/geometria';
import { habilidadeDoAtor } from '../combat/perfil';
import type { Comando, Dir8 } from '../core/comandos';
import type { ContextoSimulacao } from '../core/contexto';
import { buscarEntidade, type EstadoJogo } from '../core/estado';
import { vivo, type Entidade } from '../entities/entidade';
import { podeFerir } from '../modos/relacao';

/** Quanto tempo o bot espera antes de reavaliar o caminho (para não mandar `irPara` a cada tick). */
const REAVALIAR_CAMINHO_TICKS = 15;
/** Distância em que o atirador se afasta de um inimigo de corpo a corpo. */
const DISTANCIA_DE_KITE = 2;
/** Abaixo desta fração da vida, o bot toma uma poção (quando tem). */
const VIDA_PARA_POCAO = 0.35;

const DIRECOES: Record<string, Dir8> = { '0,-1': 'N', '1,-1': 'NE', '1,0': 'E', '1,1': 'SE', '0,1': 'S', '-1,1': 'SO', '-1,0': 'O', '-1,-1': 'NO' };

/**
 * A célula do bot está na área de uma conjuração hostil em curso? Devolve para onde sair (a direção que afasta do
 * centro da mira), como uma pessoa faz ao ver a telegrafia.
 */
function fugaDaArea(estado: EstadoJogo, ctx: ContextoSimulacao, eu: Entidade): Dir8 | null {
  const minha = celulaOcupada(eu);
  for (const outro of estado.entidades) {
    const acao = outro.acao;
    if (!acao || !vivo(outro) || !podeFerir(eu, outro, ctx.modo)) continue;
    const h = habilidadeDoAtor(ctx, outro, acao.habilidadeId);
    if (h?.politicaImpacto !== 'area') continue;
    const mira = { x: acao.alvoX, y: acao.alvoY };
    if (!celulasDaForma(h, celulaOcupada(outro), mira, ctx.fase).some((c) => c.x === minha.x && c.y === minha.y)) continue;
    const dx = Math.sign(minha.x - mira.x) || 1;
    const dy = Math.sign(minha.y - mira.y);
    return DIRECOES[`${dx},${dy}`] ?? 'E';
  }
  return null;
}

export class BotDeDuelo {
  private ultimoCaminho = -Infinity;

  constructor(
    readonly id: string,
    /** Usa as habilidades da barra (o ataque básico é sempre automático). */
    private readonly usaHabilidades = true,
    /** Parado e sem atacar: para medir quanto o personagem aguenta. */
    private readonly passivo = false,
    /** Sai das áreas telegrafadas e toma poção com a vida baixa (o que o aviso existe para permitir). */
    private readonly defendeSe = true,
  ) {}

  agir(estado: EstadoJogo, ctx: ContextoSimulacao): Comando[] {
    const eu = buscarEntidade(estado, this.id);
    if (!eu || !vivo(eu)) return [];
    if (this.passivo) {
      eu.autoAtaque = false;
      return [];
    }
    const alvo = estado.entidades
      .filter((e) => vivo(e) && podeFerir(eu, e, ctx.modo))
      .sort((a, b) => chebyshev(celulaOcupada(eu), celulaOcupada(a)) - chebyshev(celulaOcupada(eu), celulaOcupada(b)) || (a.id < b.id ? -1 : 1))[0];
    if (!alvo) return [];
    const cmds: Comando[] = [];
    if (this.defendeSe) {
      const pocao = eu.hp < eu.hpMax * VIDA_PARA_POCAO ? eu.bolsa?.mochila.find((i) => i.itemId === 'pocao_vida') : undefined;
      if (pocao) cmds.push({ t: 'usarItem', invId: pocao.invId });
      const fuga = fugaDaArea(estado, ctx, eu);
      if (fuga) {
        cmds.push({ t: 'mover', dir: fuga });
        this.ultimoCaminho = estado.tick;
        return cmds;
      }
    }
    if (eu.alvoSelecionado !== alvo.id) cmds.push({ t: 'selecionarAlvo', alvo: alvo.id });
    const distancia = chebyshev(celulaOcupada(eu), celulaOcupada(alvo));
    const basico = habilidadeDoAtor(ctx, eu, eu.ataqueBasico);
    const alcanceBasico = basico ? alcanceDe(ctx, eu, basico, estado.tick) : 1;
    // Quem ataca de longe se afasta de quem só bate de perto (como faz uma pessoa com arco ou cajado).
    const basicoDoAlvo = habilidadeDoAtor(ctx, alvo, alvo.ataqueBasico);
    const alcanceDoAlvo = basicoDoAlvo ? alcanceDe(ctx, alvo, basicoDoAlvo, estado.tick) : 1;
    if (this.defendeSe && alcanceBasico >= DISTANCIA_DE_KITE + 2 && alcanceDoAlvo <= DISTANCIA_DE_KITE && distancia <= DISTANCIA_DE_KITE) {
      const dx = Math.sign(eu.x - alvo.x) || 1;
      const dy = Math.sign(eu.y - alvo.y);
      cmds.push({ t: 'mover', dir: DIRECOES[`${dx},${dy}`] ?? 'E' });
      this.ultimoCaminho = estado.tick;
      return cmds;
    }
    // Habilidades: a primeira pronta da barra que alcança (só quando não está no meio de outra que não seja o básico).
    if (this.usaHabilidades && (!eu.acao || eu.acao.habilidadeId === eu.ataqueBasico)) {
      for (const id of eu.habilidades) {
        const h = habilidadeDoAtor(ctx, eu, id);
        if (!h || h.passiva || recargaRestante(estado, eu.id, h.id) > 0 || eu.mana < h.custoRecurso) continue;
        const ofensiva = h.politicaAlvo === 'hostil' || h.politicaAlvo === 'celula' || h.tipoArea === 'ao_redor';
        const alcance = alcanceDe(ctx, eu, h, estado.tick);
        if (ofensiva && distancia > Math.max(1, h.tipoArea === 'ao_redor' ? h.raioArea : alcance)) continue;
        // Suporte (cura, escudo) só com a vida pela metade.
        if (!ofensiva && eu.hp > eu.hpMax / 2) continue;
        cmds.push(h.politicaAlvo === 'celula' ? { t: 'usarHabilidade', id: h.id, alvo: celulaOcupada(alvo) } : { t: 'usarHabilidade', id: h.id, alvo: ofensiva ? alvo.id : eu.id });
        break;
      }
    }
    if (distancia > alcanceBasico) {
      if (estado.tick - this.ultimoCaminho >= REAVALIAR_CAMINHO_TICKS) {
        this.ultimoCaminho = estado.tick;
        const c = celulaOcupada(alvo);
        cmds.push({ t: 'irPara', x: c.x, y: c.y });
      }
    } else if (eu.direcao !== 'parado' || eu.caminho.length > 0) {
      cmds.push({ t: 'mover', dir: 'parado' });
    }
    return cmds;
  }
}
