// 17/10/2026: extensões opt-in. A maior parte da campanha conserva salas e corredores em L.
import { BALANCE_PADRAO } from '../core/contexto';
import { criarRng, escolher, inteiro, hashTexto } from '../core/rng';
import type { Celula } from '../core/comandos';
import { construirEfeito } from '../combat/registro-efeitos';
import type { FaseJson } from './fase';
import type { CatalogoGeracao, ParametrosGeracao } from './gerador';
import { TIPOS_AMBIENTE } from './ambiente-tipos';
interface Sala { x: number; y: number; l: number; a: number }

/** Corredor de três células em espiral, com parede entre voltas e pequenas câmaras ao longo dele. */
export function salasEmEspiral(l: number, a: number, n: number, cavar: (x: number, y: number) => void): Sala[] {
  const trilha: Celula[] = [];
  let x = 3, y = 3, esquerda = 3, topo = 3, direita = l - 4, fundo = a - 4;
  const ir = (tx: number, ty: number) => {
    while (x !== tx || y !== ty) {
      x += Math.sign(tx - x); y += Math.sign(ty - y);
      trilha.push({ x, y });
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) cavar(x + dx, y + dy);
    }
  };
  trilha.push({ x, y });
  while (direita - esquerda >= 8 && fundo - topo >= 8) {
    ir(direita, topo); ir(direita, fundo); ir(esquerda, fundo);
    topo += 6; ir(esquerda, topo); esquerda += 6;
    direita -= 6; fundo -= 6;
  }
  const salas: Sala[] = [];
  const total = Math.min(Math.max(3, n), Math.floor(trilha.length / 8));
  for (let i = 0; i < total; i++) {
    const c = trilha[Math.floor(i * (trilha.length - 1) / Math.max(1, total - 1))];
    if (c) salas.push({ x: c.x - 1, y: c.y - 1, l: 3, a: 3 });
  }
  return salas;
}

export function enriquecerFase(f: FaseJson, p: ParametrosGeracao, catalogo: CatalogoGeracao, salas: readonly Sala[], livre: (c: Celula) => boolean, ocupar: (c: Celula) => void): void {
  const rng = criarRng(hashTexto(`${p.semente}:ambiente`));
  const l = f.mapa[0]?.length ?? 1, a = f.mapa.length;
  const objetos = f.objetos ??= [];
  const b = BALANCE_PADRAO.ambiente;
  const ponto = (s: Sala): Celula | null => {
    for (let t = 0; t < 40; t++) {
      const c = { x: inteiro(rng, s.x, s.x + s.l - 1), y: inteiro(rng, s.y, s.y + s.a - 1) };
      if (livre(c)) { ocupar(c); return c; }
    }
    return null;
  };
  const primeira = salas[0];
  const santuario = primeira ? ponto(primeira) : null;
  if (santuario) objetos.push({ tipo: 'santuario', x: (santuario.x + 0.5) / l, y: (santuario.y + 0.5) / a });
  f.ambientes = [];
  for (let i = 1; i < salas.length - 1; i++) {
    const s = salas[i]; if (!s) continue;
    // Uma área a cada três salas: preserva espaço de luta e rotas para contornar.
    if (i % 3 === 1) {
      const c = ponto(s);
      if (c) f.ambientes.push({ ...c, tipo: escolher(rng, TIPOS_AMBIENTE), raio: 1 });
    }
    if (i % 2 === 0) {
      const c = ponto(s);
      if (c) objetos.push({ tipo: 'armadilha', x: (c.x + 0.5) / l, y: (c.y + 0.5) / a,
        valor: Math.min(b.danoArmadilhaMax, b.danoArmadilhaBase + p.nivelInimigos * b.danoArmadilhaPorNivel),
        efeito: construirEfeito('sangrando', { duracaoMs: b.sangramentoMs, valor: b.sangramento }), modo: 'rearme', rearmeMs: b.rearmeMs });
    }
  }
  if (!p.eventos?.includes('enxame')) return;
  const inimigos = f.inimigos ??= [];
  // Reservas são dados inertes até o jogador se aproximar: limite real na simulação, sem sprites falsos.
  for (const s of salas.slice(1, -1)) for (let i = 0; i < b.enxamePorSala && inimigos.length < b.enxameReservaMax; i++) {
    const c = ponto(s);
    if (c && catalogo.comuns.length > 0) inimigos.push({ ...c, preset: escolher(rng, catalogo.comuns), nivel: p.nivelInimigos });
  }
}
