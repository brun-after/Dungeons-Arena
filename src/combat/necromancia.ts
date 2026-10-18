import type { ContextoSimulacao } from '../core/contexto';
import { buscarEntidade, type EstadoJogo } from '../core/estado';
import type { EventoSimulacao } from '../core/eventos-simulacao';
import { ticksDe } from '../core/tempo';
import { vivo, type Entidade } from '../entities/entidade';
import { podeAjudar, podeFerir } from '../modos/relacao';
import { contarInvocacoes, invocar, limiteDeInvocacoes } from './efeitos-fluxo';
import { chebyshev } from './geometria';
import { construirEfeito, type EfeitoCanonico } from './registro-efeitos';
import { fato, muralhaEm } from './tatica';
import { passavel } from '../world/fase';
import { reservaCelula } from '../world/colisao';

const necromante = (e: Entidade) => vivo(e) && (e.classeId ?? e.bolsa?.classeId) === 'necromante';
export const chaveServo = (id: string) => `necromante:servo:${id}`;

/** Todos os mortos têm o mesmo orçamento de atributos. Chefes só emprestam a aparência. */
function erguer(estado: EstadoJogo, ctx: ContextoSimulacao, dono: Entidade, tipo: 'servo' | 'reanimado' | 'eco', fonte: Entidade | null, saida: EventoSimulacao[]): boolean {
  const r = ctx.balance.necromancia;
  const meus = estado.entidades.filter((e) => vivo(e) && e.invocacao?.donoId === dono.id);
  const temServo = meus.some((e) => e.invocacao?.necromancia === 'servo');
  // Reserva um espaço para o servo, inclusive durante os oito segundos de retorno.
  if (contarInvocacoes(estado, dono.id) >= limiteDeInvocacoes(ctx, dono) - (tipo !== 'servo' && !temServo ? 1 : 0)) return false;
  if (estado.entidades.filter((e) => vivo(e) && e.controlador === 'ia').length >= ctx.modo.limites.npcs) return false;
  let lugar: { x: number; y: number } | null = null;
  for (let raio = 1; raio <= 2 && !lugar; raio++) for (let dy = -raio; dy <= raio && !lugar; dy++) for (let dx = -raio; dx <= raio; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== raio) continue;
    const x = dono.x + dx, y = dono.y + dy;
    if (passavel(ctx.fase, x, y) && !muralhaEm(estado, x, y) && !estado.entidades.some((e) => vivo(e) && reservaCelula(e, x, y))) { lugar = { x, y }; break; }
  }
  if (!lugar) return false;
  const antes = estado.entidades.length;
  invocar(estado, ctx, dono, construirEfeito('invocar', { ref: 'servo_ossuario', valor: 1, duracaoMs: tipo === 'servo' ? 86_400_000 : r.duracaoMortoMs }), saida);
  const morto = estado.entidades[antes];
  if (!morto?.invocacao) return false;
  morto.x = morto.destinoX = morto.origemX = lugar.x;
  morto.y = morto.destinoY = morto.origemY = lugar.y;
  morto.invocacao.necromancia = tipo;
  if (tipo === 'servo') morto.invocacao.expiraTick = Number.MAX_SAFE_INTEGER;
  const classe = fonte ? ctx.conteudo.classes.get(fonte.classeId ?? fonte.bolsa?.classeId ?? '') : undefined;
  const modelo = fonte ? ctx.conteudo.presets.get(fonte.preset)?.modelo ?? classe?.modelo : undefined;
  if (modelo) morto.invocacao.modeloOriginal = modelo;
  morto.nome = tipo === 'servo' ? 'Servo do ossuário' : `${tipo === 'eco' ? 'Eco' : 'Reanimado'} de ${fonte?.nome ?? 'morto'}`;
  morto.nivel = dono.nivel;
  morto.atributos = { ...morto.atributos, forca: 8 + Math.floor(dono.nivel / 2), inteligencia: 8 + Math.floor(dono.nivel / 2) };
  morto.hpMax = Math.round((r.vidaBase + dono.nivel * r.vidaPorNivel) * (tipo === 'servo' ? r.vidaServoPct / 100 : 1));
  morto.hp = morto.hpMax;
  morto.aparencia = fonte?.aparencia ? { ...fonte.aparencia } : null;
  return true;
}

/** Passiva de classe, sem depender das quatro habilidades equipadas. */
export function processarServosNecromantes(estado: EstadoJogo, ctx: ContextoSimulacao, saida: EventoSimulacao[]): void {
  for (const dono of [...estado.entidades]) {
    if (!necromante(dono) || estado.entidades.some((e) => vivo(e) && e.invocacao?.donoId === dono.id && e.invocacao.necromancia === 'servo')) continue;
    if ((estado.recargas[chaveServo(dono.id)] ?? 0) > estado.tick) continue;
    if (!erguer(estado, ctx, dono, 'servo', null, saida)) estado.recargas[chaveServo(dono.id)] = estado.tick + ticksDe(1000);
  }
}

/** Uma morte confirmada cria no máximo um eco aliado; nunca consome o personagem original. */
export function colherMorto(estado: EstadoJogo, ctx: ContextoSimulacao, morto: Entidade, matador: Entidade | undefined, saida: EventoSimulacao[]): void {
  if (morto.invocacao) {
    if (morto.invocacao.necromancia === 'servo') estado.recargas[chaveServo(morto.invocacao.donoId)] = estado.tick + ticksDe(ctx.balance.necromancia.retornoServoMs);
    return;
  }
  const r = ctx.balance.necromancia;
  if (morto.controlador === 'ia') {
    const dono = matador?.invocacao ? buscarEntidade(estado, matador.invocacao.donoId) : matador;
    if (dono && necromante(dono) && podeFerir(dono, morto, ctx.modo) && chebyshev(dono, morto) <= r.raioColheita) erguer(estado, ctx, dono, 'reanimado', morto, saida);
    return;
  }
  const chave = `necromante:eco:${morto.id}`;
  if ((estado.recargas[chave] ?? 0) > estado.tick) return;
  const candidatos = estado.entidades.filter((e) => e.id !== morto.id && necromante(e) && podeAjudar(e, morto, ctx.modo) && chebyshev(e, morto) <= r.raioColheita)
    .sort((a, b) => chebyshev(a, morto) - chebyshev(b, morto) || a.id.localeCompare(b.id));
  for (const dono of candidatos) if (erguer(estado, ctx, dono, 'eco', morto, saida)) {
    estado.recargas[chave] = estado.tick + ticksDe(r.ecoRecargaMs);
    break;
  }
}

/** O alvo nunca é um jogador, um avatar ou uma invocação de outro dono. */
export function invocacaoParaDrenar(estado: EstadoJogo, ctx: ContextoSimulacao, dono: Entidade): Entidade | undefined {
  return estado.entidades.filter((e) => vivo(e) && e.invocacao?.donoId === dono.id && !e.invocacao.avatar && chebyshev(dono, e) <= ctx.balance.necromancia.alcanceRitual)
    .sort((a, b) => chebyshev(a, dono) - chebyshev(b, dono) || a.id.localeCompare(b.id))[0];
}

export function executarRitual(estado: EstadoJogo, ctx: ContextoSimulacao, dono: Entidade, ef: EfeitoCanonico, acaoId: number | undefined, fatorCura: number, aplicar: (alvo: Entidade, efeito: EfeitoCanonico) => void, saida: EventoSimulacao[]): void {
  if (ef.tipo === 'drenar_invocacao') {
    const alvo = invocacaoParaDrenar(estado, ctx, dono);
    if (!alvo || dono.hp >= dono.hpMax || fatorCura <= 0) return;
    const gasto = Math.max(0, Math.min(alvo.hp, ef.valor, Math.ceil((dono.hpMax - dono.hp) / fatorCura)));
    if (gasto <= 0) return;
    alvo.hp -= gasto;
    aplicar(dono, construirEfeito('cura', { valor: gasto }));
    fato(dono, 'drenou', alvo.id, acaoId);
    saida.push({ t: 'efeitoResultado', tick: estado.tick, alvoId: alvo.id, origemId: dono.id, tipo: ef.tipo, dano: gasto, cura: 0, mana: 0 });
  } else if (ef.tipo === 'comandar_mortos') {
    for (const alvo of estado.entidades) {
      if (!vivo(alvo) || alvo.invocacao?.donoId !== dono.id || chebyshev(dono, alvo) > ctx.balance.necromancia.alcanceRitual) continue;
      aplicar(alvo, construirEfeito('bonus_dano', { pct: ef.pct, duracaoMs: ef.duracaoMs }));
      aplicar(alvo, construirEfeito('ab_recarga', { pct: 20, duracaoMs: ef.duracaoMs }));
      fato(dono, 'comandou', alvo.id, acaoId);
    }
  }
}
