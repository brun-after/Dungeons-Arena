// Marco 55 (26/11/2026, D-208): o Mundo contínuo na página. Um só por página (sobrevive à ida a uma masmorra e à
// volta): o atlas do cliente (mundo/atlas-cliente.ts), o trabalhador que gera as regiões (plataforma/gerador-remoto.ts),
// a primeira a de onde o jogador está, e o desenho delas na cena (ui/atlas-na-cena.ts). O mapa, o guia, a lápide e o
// Portal temporário falam em coordenadas da área da região (as da fase dela); aqui ficam as conversões.

import type { Conteudo } from '../core/conteudo';
import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import { criarAtlasDoCliente, type AtlasDoCliente } from '../mundo/atlas-cliente';
import type { Reino } from '../mundo/reino';
import { zonaEm } from '../mundo/zonas';
import type { ModoDeJogo } from '../modos/modo';
import { criarGeradorDeRegioes, type GeradorDeRegioes } from '../plataforma/gerador-remoto';
import { desenhoDoAtlas, type DesenhoDoAtlas } from './atlas-na-cena';

export interface MundoContinuoNaTela {
  readonly atlas: AtlasDoCliente;
  readonly desenho: DesenhoDoAtlas;
  /** Espera chegar a região do ponto (do atlas); false se não chegou no prazo. */
  esperarRegiao: (x: number, y: number, prazoMs: number) => Promise<boolean>;
  /** O jogador andou: quando muda de área, as regiões são pedidas de novo na ordem de onde ele está. */
  seguir: (x: number, y: number) => void;
  /** O lugar da zona do ponto (`regiao:<id>`), ou null fora de toda zona. */
  zonaDe: (x: number, y: number) => string | null;
  /** O ponto do atlas nas coordenadas da área da zona dele. */
  naRegiao: (x: number, y: number) => { lugar: string; x: number; y: number } | null;
  /** O contexto da região (`regiao:<id>`) já chegada, com a fase em coordenadas da área. */
  ctxDaRegiao: (lugar: string) => ContextoSimulacao | null;
  /** O canto da área da região no atlas (a área sem o deslocamento do reino, `dx`/`dy`). */
  areaDe: (lugar: string) => { x: number; y: number; dx: number; dy: number } | null;
  /** O estado com as posições na área da região (para o mapa dela). */
  estadoNaRegiao: (estado: EstadoJogo | null, lugar: string) => EstadoJogo | null;
}

let unico: MundoContinuoNaTela | null = null;

export function mundoContinuoNaTela(conteudo: Conteudo, reino: Reino, modo: ModoDeJogo): MundoContinuoNaTela {
  if (unico) return unico;
  const atlas = criarAtlasDoCliente(conteudo, reino, modo);
  const esperando: { id: string; feito: () => void }[] = [];
  const chegadas = new Set<string>();
  const gerador: GeradorDeRegioes = criarGeradorDeRegioes(reino, atlas.atlas, (regiaoId, ex) => {
    if (ex) atlas.receber(regiaoId, ex);
    chegadas.add(regiaoId);
    for (let i = esperando.length - 1; i >= 0; i--) {
      const w = esperando[i];
      if (w?.id !== regiaoId) continue;
      esperando.splice(i, 1);
      w.feito();
    }
  });
  let areaAtual: string | null = null;
  const seguir = (x: number, y: number) => {
    const a = atlas.areaEm(x, y);
    if (a === areaAtual && areaAtual !== null) return;
    areaAtual = a;
    gerador.pedir(atlas.ordemDePedido(x, y));
  };
  const idDe = (lugar: string) => (lugar.startsWith('regiao:') ? lugar.slice('regiao:'.length) : null);
  const areaDe = (lugar: string) => {
    const id = idDe(lugar);
    return id ? (atlas.atlas.areas.get(id) ?? null) : null;
  };
  const mover = <T extends { x: number; y: number }>(o: T, dx: number, dy: number): T => ({ ...o, x: o.x - dx, y: o.y - dy });
  let ultimoEstado: { de: EstadoJogo; lugar: string; para: EstadoJogo } | null = null;
  unico = {
    atlas,
    desenho: desenhoDoAtlas(atlas),
    esperarRegiao: (x, y, prazoMs) => {
      seguir(x, y);
      const id = atlas.areaEm(x, y);
      if (!id || chegadas.has(id)) return Promise.resolve(id !== null);
      return new Promise<boolean>((resolver) => {
        const prazo = setTimeout(() => {
          const i = esperando.indexOf(w);
          if (i >= 0) esperando.splice(i, 1);
          resolver(false);
        }, prazoMs);
        const w = { id, feito: () => { clearTimeout(prazo); resolver(true); } };
        esperando.push(w);
      });
    },
    seguir,
    zonaDe: (x, y) => {
      const z = zonaEm(atlas.zonas, x, y);
      return z ? `regiao:${z}` : null;
    },
    naRegiao: (x, y) => {
      const z = zonaEm(atlas.zonas, x, y);
      const a = z ? atlas.atlas.areas.get(z) : undefined;
      return z && a ? { lugar: `regiao:${z}`, x: x - a.x, y: y - a.y } : null;
    },
    ctxDaRegiao: (lugar) => {
      const id = idDe(lugar);
      return id ? (atlas.regioes.get(id)?.ctx ?? null) : null;
    },
    areaDe,
    estadoNaRegiao: (estado, lugar) => {
      const a = areaDe(lugar);
      if (!estado || !a) return estado;
      if (ultimoEstado?.de === estado && ultimoEstado.lugar === lugar) return ultimoEstado.para;
      const para: EstadoJogo = {
        ...estado,
        entidades: estado.entidades.map((e) => mover(e, a.x, a.y)),
        objetos: estado.objetos.map((o) => mover(o, a.x, a.y)),
      };
      ultimoEstado = { de: estado, lugar, para };
      return para;
    },
  };
  return unico;
}
