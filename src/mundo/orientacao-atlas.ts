// Marco 55 (26/11/2026, D-208): a rota do guia no Mundo contínuo. O destino guarda o ponto nas coordenadas da área da
// região dele (as da fase da região, a que o mapa desenha); a etapa devolve o ponto no atlas, onde o jogador anda. Entre
// regiões, a etapa é o cruzamento da costura da próxima região do caminho (onde as estradas se encontram), pelos lados
// abertos do reino: nunca corta por uma serra que fecha a borda. Sem caminho a pé, a etapa é o portal. Puro.

import type { Celula } from '../core/comandos';
import { costuraDoLado, paraOAtlas, type AreaNoAtlas, type Atlas } from './atlas';
import type { DestinoNoMapa, EtapaDoMapa } from './orientacao';
import { estruturaDoDestino, LADOS, portaDa, territorioDoLugar, vizinha, type LadoDaRegiao, type Reino, type RegiaoDoMundo } from './reino';

/** A região de um destino (`regiao:x`, ou a estrutura de `masmorra:y`/`covil:y`, que fica numa região). */
function regiaoDoDestino(reino: Reino, lugar: string): { regiao: RegiaoDoMundo; frente: Celula | null } | null {
  const id = lugar.split(':')[1] ?? '';
  const regiao = lugar.startsWith('regiao:') ? reino.regioes.find((r) => r.id === id) : undefined;
  if (regiao) return { regiao, frente: null };
  const e = estruturaDoDestino(reino, id);
  return e ? { regiao: e.regiao, frente: portaDa(e.estrutura).frente } : null;
}

/** O ponto do destino no atlas: o marcado (na área), a frente da porta da estrutura, ou a vila da região. */
function pontoNoAtlas(area: AreaNoAtlas, regiao: RegiaoDoMundo, destino: DestinoNoMapa, frente: Celula | null): Celula | null {
  if (destino.ponto) return { x: area.x + destino.ponto.x, y: area.y + destino.ponto.y };
  if (frente) return paraOAtlas(area, frente.x, frente.y);
  return regiao.vila ? paraOAtlas(area, regiao.vila.x, regiao.vila.y) : null;
}

/** O cruzamento da costura do lado da região (o meio do trecho comum), no atlas. */
export function cruzamento(atlas: Atlas, regiaoId: string, lado: LadoDaRegiao): Celula | null {
  const c = costuraDoLado(atlas, regiaoId, lado);
  if (!c) return null;
  const meio = Math.floor((c.inicio + c.fim) / 2);
  // A linha é a primeira célula de quem está a leste (ou ao sul): o cruzamento fica na célula antes dela, do lado de cá.
  const deCa = lado === 'leste' || lado === 'sul' ? c.linha - 1 : c.linha;
  return c.vertical ? { x: deCa, y: meio } : { x: meio, y: deCa };
}

/** A próxima etapa de quem está na zona `zona` (`regiao:x`) até o destino, com o ponto no atlas. */
export function etapaNoAtlas(reino: Reino, atlas: Atlas, zona: string | null, destino: DestinoNoMapa): EtapaDoMapa | null {
  const alvo = regiaoDoDestino(reino, destino.lugar);
  const areaAlvo = alvo ? atlas.areas.get(alvo.regiao.id) : undefined;
  if (!alvo || !areaAlvo) return null;
  const ponto = pontoNoAtlas(areaAlvo, alvo.regiao, destino, alvo.frente);
  const atual = zona?.startsWith('regiao:') ? reino.regioes.find((r) => `regiao:${r.id}` === zona) : undefined;
  if (!atual) return { ponto, nome: destino.nome, tipo: 'destino' };
  if (atual.id === alvo.regiao.id) {
    if (!ponto || (destino.lugar === zona && !destino.ponto)) return { ponto: null, nome: destino.nome, tipo: 'chegou' };
    return { ponto, nome: destino.nome, tipo: 'destino' };
  }
  // A busca pelos lados abertos: o primeiro passo (e o lado dele) até a região do destino.
  const fila: { r: RegiaoDoMundo; lado: LadoDaRegiao | null; primeiro: RegiaoDoMundo | null }[] = [{ r: atual, lado: null, primeiro: null }];
  const vistos = new Set([atual.id]);
  for (const { r, lado, primeiro } of fila) {
    for (const l of LADOS) {
      const v = vizinha(reino, r, l);
      if (!v || vistos.has(v.id) || !atlas.areas.has(v.id)) continue;
      const passo = primeiro ?? v;
      const ladoDoPasso = lado ?? l;
      if (v.id === alvo.regiao.id) {
        return { tipo: 'passagem', nome: passo.nome, lugar: `regiao:${passo.id}`, ponto: cruzamento(atlas, atual.id, ladoDoPasso) };
      }
      vistos.add(v.id);
      fila.push({ r: v, lado: ladoDoPasso, primeiro: passo });
    }
  }
  return { ponto: null, nome: territorioDoLugar(reino, alvo.regiao.id).nome, tipo: 'portal' };
}
