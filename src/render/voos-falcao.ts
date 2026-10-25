// As trajetórias do falcão nas habilidades (marco 24, 25/10/2026, D-098). Dado e funções puras: cada skill do falcão
// tem a sua forma de voo, a cor do rastro e se troca a cor do falcão. As ultimates do Aventureiro voam a forma da
// primeira skill do par que tiver voo, na cor delas, com o falcão tingido. Só apresentação: o golpe já saiu na regra.
// O tempo t vai de 0 (o falcão sai de onde está) a 1 (chega ao alvo, no impacto previsto); a volta é a mola do voo
// livre (render/voo-falcao.ts).

export type FormaVoo = 'mergulho' | 'rasante' | 'zigue' | 'espiral' | 'grito' | 'circulo' | 'retorno' | 'dupla' | 'reto';

export interface VooDeSkill {
  forma: FormaVoo;
  /** Cor do rastro (e do falcão, quando `tinge`). */
  cor: number;
  tinge: boolean;
}

/** As skills do falcão (pelo id da habilidade). */
export const VOOS_SKILL: Readonly<Record<string, VooDeSkill>> = {
  mergulho: { forma: 'mergulho', cor: 0xd6ecff, tinge: false },
  rasante: { forma: 'rasante', cor: 0xeef6f8, tinge: false },
  garras_cegantes: { forma: 'zigue', cor: 0xe74c3c, tinge: false },
  tempestade_de_penas: { forma: 'espiral', cor: 0xf5f0e1, tinge: false },
  grito_do_falcao: { forma: 'grito', cor: 0xaed6f1, tinge: false },
  vigia: { forma: 'circulo', cor: 0xf4d03f, tinge: false },
  retorno_ao_punho: { forma: 'retorno', cor: 0xf4d03f, tinge: false },
  presa_dupla: { forma: 'dupla', cor: 0xffffff, tinge: false },
  presa_dupla_falcao: { forma: 'dupla', cor: 0xffffff, tinge: false },
};

/** As cores das ultimates mais marcantes; as outras usam a cor da ultimate ou a da skill. */
const COR_ULTIMATE: Readonly<Record<string, number>> = {
  ult_mergulho_do_trovao: 0x5dade2,
  ult_furacao_alado: 0xf8f9f9,
  ult_voo_rasante_mortal: 0xe74c3c,
  ult_tempestade_estridente: 0x85c1e9,
  ult_ataque_cego: 0x922b21,
  ult_laco_inquebravel: 0x9fe3a8,
  ult_sentinela_em_queda: 0xf5b041,
};

/** O voo de uma ultimate: a forma da skill do par, na cor dela, com o falcão tingido. */
export function vooDaUltimate(id: string, par: readonly string[], corDoVisual: number | null): VooDeSkill | null {
  const base = par.map((s) => VOOS_SKILL[s]).find((v) => v !== undefined);
  if (!base) return null;
  // Cor quase branca não troca a cor do falcão: aí vale o dourado da ultimate.
  const clara = corDoVisual !== null && ((corDoVisual >> 16) & 0xff) > 0xe0 && ((corDoVisual >> 8) & 0xff) > 0xe0 && (corDoVisual & 0xff) > 0xe0;
  const cor = COR_ULTIMATE[id] ?? (corDoVisual !== null && !clara ? corDoVisual : 0xf5b041);
  return { forma: base.forma, cor, tinge: true };
}

export interface PontoDeVoo {
  x: number;
  y: number;
  /** Altura extra do falcão acima do voo normal, em fração da célula (negativa: mais baixo). */
  altura: number;
}

const suave = (t: number) => t * t * (3 - 2 * t);
const entre01 = (t: number) => Math.min(1, Math.max(0, t));

/**
 * O ponto do voo em t (0 a 1), de `de` até `alvo` (o círculo da Vigia gira em volta do `dono`). O zigue-zague e a presa
 * dupla saem para os lados pela perpendicular da linha.
 */
export function pontoDoVoo(forma: FormaVoo, t: number, de: { x: number; y: number }, alvo: { x: number; y: number }, dono: { x: number; y: number }): PontoDeVoo {
  const dx = alvo.x - de.x;
  const dy = alvo.y - de.y;
  const d = Math.hypot(dx, dy) || 1;
  const px = -dy / d;
  const py = dx / d;
  const em = (f: number) => ({ x: de.x + dx * f, y: de.y + dy * f });
  switch (forma) {
    case 'mergulho': {
      // Sobe recuando um pouco, para lá no alto e cai em linha reta, acelerando.
      if (t < 0.45) {
        const s = suave(t / 0.45);
        const p = em(-0.15 * s);
        return { ...p, altura: 1.1 * s };
      }
      if (t < 0.55) return { ...em(-0.15), altura: 1.1 };
      const s = ((t - 0.55) / 0.45) ** 2;
      const p = em(-0.15 + 1.15 * s);
      return { ...p, altura: 1.1 * (1 - s) };
    }
    case 'rasante': {
      // Passagem baixa, rente ao chão, passando do alvo.
      const p = em(1.4 * suave(t));
      return { ...p, altura: -0.25 * Math.sin(Math.PI * Math.min(1, t * 1.2)) };
    }
    case 'zigue': {
      const lado = Math.sin(t * Math.PI * 3) * 0.55 * (1 - t);
      const p = em(suave(t));
      return { x: p.x + px * lado, y: p.y + py * lado, altura: 0.15 * Math.sin(Math.PI * t) };
    }
    case 'espiral': {
      // Vai até o alvo e circula sobre ele, fechando.
      if (t < 0.35) return { ...em(suave(t / 0.35)), altura: 0.4 * (t / 0.35) };
      const u = (t - 0.35) / 0.65;
      const raio = 1.3 * (1 - u) + 0.3;
      const a = u * Math.PI * 4;
      return { x: alvo.x + Math.cos(a) * raio, y: alvo.y + Math.sin(a) * raio * 0.8, altura: 0.4 };
    }
    case 'grito': {
      // Para a uma célula e meia do alvo e paira alto.
      const f = Math.max(0, 1 - 1.5 / d);
      const p = em(f * suave(entre01(t / 0.6)));
      return { ...p, altura: 0.7 * suave(entre01(t / 0.6)) };
    }
    case 'circulo': {
      const a = t * Math.PI * 2;
      return { x: dono.x + Math.cos(a) * 0.9, y: dono.y + Math.sin(a) * 0.7, altura: 0.6 };
    }
    case 'retorno':
      return { ...em(suave(t)), altura: 0.3 * Math.sin(Math.PI * t) };
    case 'dupla': {
      // Dois golpes: entra, sai pelo lado e entra de novo cruzando.
      const ida = t < 0.5 ? suave(t / 0.5) : 1 - 0.6 * Math.sin(Math.PI * ((t - 0.5) / 0.5));
      const lado = Math.sin(Math.PI * entre01((t - 0.45) / 0.55)) * 0.8;
      const p = em(ida);
      return { x: p.x + px * lado, y: p.y + py * lado, altura: 0.2 * Math.sin(Math.PI * t * 2) };
    }
    case 'reto':
      return { ...em(suave(t)), altura: 0.35 * Math.sin(Math.PI * t) };
  }
}

/** Batida das asas em rajadas: 3 ou 4 batidas a cada 1,5 a 3 s (sorteadas pelo ciclo); entre elas, plana aberto. */
export function quadroDasAsas(agoraMs: number, semente: number, pousado: boolean, rapido: boolean): number {
  if (pousado) return 2;
  const batidaMs = rapido ? 110 : 150;
  if (rapido) return Math.floor(agoraMs / batidaMs) % 2;
  const cicloMs = 2600;
  const ciclo = Math.floor((agoraMs + semente * 997) / cicloMs);
  const h = Math.abs(Math.sin(ciclo * 12.9898 + semente * 78.233)) % 1;
  const batidas = h < 0.5 ? 3 : 4;
  const noCiclo = (agoraMs + semente * 997) % cicloMs;
  // A rajada começa num ponto sorteado do ciclo (de 0 a 1,1 s): o intervalo entre rajadas fica entre 1,5 e 3 s.
  const inicio = h * 1100;
  const dentro = noCiclo - inicio;
  if (dentro < 0 || dentro >= batidas * 2 * batidaMs) return 0;
  return Math.floor(dentro / batidaMs) % 2;
}
