// 17/10/2026: extensões opt-in. A maior parte da campanha conserva salas e corredores em L.
import { BALANCE_PADRAO } from '../core/contexto';
import { criarRng, escolher, inteiro, hashTexto } from '../core/rng';
import type { Celula } from '../core/comandos';
import { armadilhaDeFase } from './armadilhas-de-fase';
import type { FaseJson } from './fase';
import type { CatalogoGeracao, ParametrosGeracao } from './gerador';
import { TIPOS_AMBIENTE_CLASSICOS } from './ambiente-tipos';
import { porPeso } from './temas';
import { aleatorio } from '../core/rng';
interface Sala { x: number; y: number; l: number; a: number }

/** Corredor de três células em espiral, com parede entre voltas e pequenas câmaras ao longo dele. */
export function salasEmEspiral(l: number, a: number, n: number, cavar: (x: number, y: number) => void, porte?: {sala:number;corredor:number}|null): Sala[] {
  const trilha: Celula[] = [];
  const margem=porte?Math.ceil(porte.sala/2)+2:3,passo=porte?porte.sala+3:6,raio=porte?Math.floor(porte.corredor/2):1;
  let x = margem, y = margem, esquerda = margem, topo = margem, direita = l - margem-1, fundo = a - margem-1;
  const ir = (tx: number, ty: number) => {
    while (x !== tx || y !== ty) {
      x += Math.sign(tx - x); y += Math.sign(ty - y);
      trilha.push({ x, y });
      for (let dy = -raio; dy <= raio; dy++) for (let dx = -raio; dx <= raio; dx++) cavar(x + dx, y + dy);
    }
  };
  trilha.push({ x, y });
  while (direita - esquerda >= 8 && fundo - topo >= 8) {
    ir(direita, topo); ir(direita, fundo); ir(esquerda, fundo);
    topo += passo; ir(esquerda, Math.min(topo,fundo)); esquerda += passo;
    direita -= passo; fundo -= passo;
  }
  const salas: Sala[] = [];
  const total = Math.min(Math.max(3, n), Math.floor(trilha.length / 8));
  for (let i = 0; i < total; i++) {
    const c = trilha[Math.floor(i * (trilha.length - 1) / Math.max(1, total - 1))];
    const lado=porte?.sala??3,metade=Math.floor(lado/2);
    if (c) salas.push({ x: c.x - metade, y: c.y - metade, l: lado, a: lado });
  }
  return salas;
}

export function enriquecerFase(f: FaseJson, p: ParametrosGeracao, catalogo: CatalogoGeracao, salas: readonly Sala[], livre: (c: Celula) => boolean, ocupar: (c: Celula) => void): void {
  const rng = criarRng(hashTexto(`${p.semente}:ambiente`));
  const rngArmadilhas = criarRng(hashTexto(`${p.semente}:armadilhas`));
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
  // Marco 23 (D-092): o tema escolhe os tipos, a frequência (uma a cada `aCada` salas) e o tamanho das áreas.
  const tema = p.tema ? catalogo.temas.get(p.tema) : undefined;
  const aCada = tema?.ambientes.aCada ?? 3;
  for (let i = 1; i < salas.length - 1; i++) {
    const s = salas[i]; if (!s) continue;
    // Uma área a cada três salas: preserva espaço de luta e rotas para contornar.
    if (i % aCada === 1 % aCada) {
      const c = ponto(s);
      if (c && tema) f.ambientes.push({ ...c, tipo: escolher(rng, tema.ambientes.tipos), raio: inteiro(rng, 1, Math.max(1, Math.min(tema.ambientes.raioMax, Math.floor(Math.min(s.l, s.a) / 3)))) });
      else if (c) f.ambientes.push({ ...c, tipo: escolher(rng, TIPOS_AMBIENTE_CLASSICOS), raio: 1 });
    }
    // 06/11/2026 (D-135): círculos elementais ou de explosão (RNG próprio: o resto da fase sai igual). Uma a cada duas
    // salas, ou `armadilhasPorSala` em cada uma (as masmorras do Mundo pedem mais).
    const quantas = p.armadilhasPorSala ?? (i % 2 === 0 ? 1 : 0);
    for (let k = 0; k < quantas; k++) {
      const c = ponto(s);
      if (c) objetos.push(armadilhaDeFase(rngArmadilhas, c, { largura: l, altura: a }, p.nivelInimigos, tema?.elemento ?? null));
    }
  }
  if (!p.eventos?.includes('enxame')) return;
  const inimigos = f.inimigos ??= [];
  // Reservas são dados inertes até o jogador se aproximar: limite real na simulação, sem sprites falsos.
  for (const s of salas.slice(1, -1)) for (let i = 0; i < b.enxamePorSala && inimigos.length < b.enxameReservaMax; i++) {
    const c = ponto(s);
    if (c && catalogo.comuns.length > 0) inimigos.push({ ...c, preset: (tema ? porPeso(tema.inimigos, aleatorio(rng)) : null) ?? escolher(rng, catalogo.comuns), nivel: p.nivelInimigos });
  }
}
