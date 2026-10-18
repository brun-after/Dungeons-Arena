// Aprendizado de estilo (§3.10). Marco 11A (16/10/2026), D-066. Puro: as escolhas do jogador no editor viram regras
// por assinatura de vizinhança — 8 caracteres na ordem N, NE, E, SE, S, SO, O, NO, com `P` = piso, `F` = fechado
// (parede ou vazio) e `D` = porta (saída ou porta interna) — acumuladas num perfil por média móvel (alpha 0,4).
// As assinaturas totalmente cercadas (os 8 vizinhos iguais à célula do meio) são ruído e ficam de fora.
// As regras fortes do perfil (≥ 0,75 ou ≤ 0,25, com 4 amostras ou mais) entram nos parâmetros da fase gerada
// (determinismo: o save guarda as regras) e `aplicarEstilo` as reaplica depois do gerador, sem nunca quebrar o alcance.

import type { Celula } from '../core/comandos';
import { aleatorio, criarRng, hashTexto } from '../core/rng';
import { carregarFase, tipoEm, type Fase, type FaseJson } from './fase';
import { alcancaveisComPortas } from './navegacao';

export const ALPHA_ESTILO = 0.4;
export const MAX_ASSINATURAS = 512;
export const MAX_REGRAS = 64;
const MIN_AMOSTRAS = 4;
const FORTE_PISO = 0.75;
const FORTE_FECHADO = 0.25;

export interface EntradaEstilo {
  /** Média móvel de "a célula do meio é piso" (0 a 1). */
  piso: number;
  n: number;
}

export type PerfilEstilo = Record<string, EntradaEstilo>;

/** Uma regra compacta: a assinatura (8 letras) e `1` (piso) ou `0` (fechado). */
export const RE_REGRA_ESTILO = /^[PFD]{8}[01]$/;

const VIZINHOS: readonly (readonly [number, number])[] = [
  [0, -1],
  [1, -1],
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
];

type Classe = 'P' | 'F' | 'D';

function classeEm(fase: Fase, portas: ReadonlySet<string>, x: number, y: number): Classe {
  const t = tipoEm(fase, x, y);
  if (t === 'saida' || portas.has(`${x},${y}`)) return 'D';
  return t === 'piso' ? 'P' : 'F';
}

const conjuntoDePortas = (fase: Fase) => new Set(fase.portasInternas.flatMap((p) => [`${p.a.x},${p.a.y}`, `${p.b.x},${p.b.y}`]));

export function assinatura(fase: Fase, x: number, y: number, portas: ReadonlySet<string> = conjuntoDePortas(fase)): string {
  return VIZINHOS.map(([dx, dy]) => classeEm(fase, portas, x + dx, y + dy)).join('');
}

/**
 * Soma amostras ao perfil (devolve um perfil novo): cada célula editada (piso ou fechada, fora da borda) conta para
 * a sua assinatura. Passando do teto, saem as assinaturas com menos amostras.
 */
export function registrarAmostras(perfil: PerfilEstilo, fase: Fase, celulas: readonly Celula[]): PerfilEstilo {
  const novo: PerfilEstilo = Object.fromEntries(Object.entries(perfil).map(([k, v]) => [k, { ...v }]));
  const portas = conjuntoDePortas(fase);
  for (const c of celulas) {
    if (c.x <= 0 || c.y <= 0 || c.x >= fase.largura - 1 || c.y >= fase.altura - 1) continue;
    const meio = classeEm(fase, portas, c.x, c.y);
    if (meio === 'D') continue;
    const sig = assinatura(fase, c.x, c.y, portas);
    if (sig === meio.repeat(8)) continue;
    const valor = meio === 'P' ? 1 : 0;
    const e = novo[sig];
    novo[sig] = e ? { piso: e.piso * (1 - ALPHA_ESTILO) + valor * ALPHA_ESTILO, n: e.n + 1 } : { piso: valor, n: 1 };
  }
  const chaves = Object.keys(novo);
  if (chaves.length <= MAX_ASSINATURAS) return novo;
  const ficam = chaves.sort((a, b) => (novo[b]?.n ?? 0) - (novo[a]?.n ?? 0) || (a < b ? -1 : 1)).slice(0, MAX_ASSINATURAS);
  return Object.fromEntries(ficam.map((k) => [k, novo[k] as EntradaEstilo]));
}

/** As regras fortes do perfil, as de mais amostras primeiro (até `MAX_REGRAS`), na forma compacta. */
export function regrasDoPerfil(perfil: PerfilEstilo, max = MAX_REGRAS): string[] {
  return Object.entries(perfil)
    .filter(([, e]) => e.n >= MIN_AMOSTRAS && (e.piso >= FORTE_PISO || e.piso <= FORTE_FECHADO))
    .sort(([a, x], [b, y]) => y.n - x.n || (a < b ? -1 : 1))
    .slice(0, max)
    .map(([sig, e]) => `${sig}${e.piso >= FORTE_PISO ? 1 : 0}`);
}

/** Lê o perfil gravado (store `perfil`), descartando o que não tiver a forma certa. */
export function lerPerfilEstilo(v: unknown): PerfilEstilo {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return {};
  const perfil: PerfilEstilo = {};
  for (const [k, e] of Object.entries(v)) {
    if (!/^[PFD]{8}$/.test(k) || typeof e !== 'object' || e === null) continue;
    const { piso, n } = e as Partial<EntradaEstilo>;
    if (typeof piso === 'number' && piso >= 0 && piso <= 1 && typeof n === 'number' && Number.isInteger(n) && n > 0) perfil[k] = { piso, n };
  }
  return perfil;
}

/**
 * Reaplica as regras numa fase gerada: uma passada em ordem sorteada (fluxo de PRNG próprio, `semente:estilo`), que
 * vira a célula quando a regra da assinatura dela pede. Nunca mexe na borda, no spawn, na saída, nas portas nem onde
 * há inimigo ou objeto. Se o spawn deixar de alcançar a saída, um inimigo, um objeto ou uma porta, a passada é
 * desfeita inteira (a fase volta como o gerador fez).
 */
export function aplicarEstilo(json: FaseJson, regras: readonly string[], semente: number): FaseJson {
  const mapa = new Map<string, '0' | '1'>();
  for (const r of regras) if (RE_REGRA_ESTILO.test(r)) mapa.set(r.slice(0, 8), r[8] === '1' ? '1' : '0');
  if (mapa.size === 0) return json;
  const fase = carregarFase(json);
  const { largura, altura } = fase;
  const intocaveis = new Set<string>();
  const marcar = (c: Celula) => intocaveis.add(`${c.x},${c.y}`);
  fase.spawns.forEach(marcar);
  fase.inimigos.forEach(marcar);
  fase.objetos.forEach(marcar);
  fase.ambientes?.forEach(marcar);
  fase.portasInternas.forEach((p) => {
    marcar(p.a);
    marcar(p.b);
  });
  const linhas = json.mapa.map((l) => l.split(''));
  const celulas: Celula[] = [];
  for (let y = 1; y < altura - 1; y++) for (let x = 1; x < largura - 1; x++) if (!intocaveis.has(`${x},${y}`)) celulas.push({ x, y });
  const rng = criarRng(hashTexto(`${semente}:estilo`));
  for (let i = celulas.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio(rng) * (i + 1));
    [celulas[i], celulas[j]] = [celulas[j] as Celula, celulas[i] as Celula];
  }
  let mudou = false;
  const atual = () => carregarFase({ ...json, mapa: linhas.map((l) => l.join('')) });
  let vista = atual();
  for (const c of celulas) {
    const ch = linhas[c.y]?.[c.x];
    if (ch !== '#' && ch !== '.') continue;
    const regra = mapa.get(assinatura(vista, c.x, c.y));
    const quer = regra === '1' ? '.' : regra === '0' ? '#' : null;
    if (!quer || quer === ch) continue;
    const linha = linhas[c.y];
    if (!linha) continue;
    linha[c.x] = quer;
    mudou = true;
    vista = atual();
  }
  if (!mudou) return json;
  const candidata: FaseJson = { ...json, mapa: linhas.map((l) => l.join('')) };
  return alcanceInteiro(carregarFase(candidata)) ? candidata : json;
}

function alcanceInteiro(fase: Fase): boolean {
  const inicio = fase.spawns[0];
  if (!inicio) return false;
  const alcance = alcancaveisComPortas(fase, inicio);
  const ok = (c: Celula) => alcance[c.y * fase.largura + c.x] === 1;
  for (let i = 0; i < fase.celulas.length; i++) {
    if (tipoEm(fase, i % fase.largura, Math.floor(i / fase.largura)) === 'saida' && alcance[i] !== 1) return false;
  }
  return fase.inimigos.every(ok) && fase.objetos.every(ok) && (fase.ambientes ?? []).every(ok) && fase.portasInternas.every((p) => ok(p.a) && ok(p.b));
}
