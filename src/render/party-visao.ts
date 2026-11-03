// 02/11/2026: agrupamento por diâmetro; evita juntar uma corrente de jogadores que não cabe na tela.
import type { Entidade, PontoVisual } from '../entities/entidade';
import type { Camera } from './camera';
import { centroDaCelula } from './projecao';

export function enquadrarGrupoParty(camera: Camera, grupo: readonly Entidade[], largura: number, altura: number, zoom: number, posicao: (e: Entidade) => PontoVisual): void {
    const visuais = grupo.map(posicao);
    const pontos = visuais.map(p => { const c = centroDaCelula(p.x, p.y); return camera.projecaoAtual.projetar(c.x, c.y); });
    const lx = Math.max(...pontos.map(p => p.x)) - Math.min(...pontos.map(p => p.x)) + 160;
    const ly = Math.max(...pontos.map(p => p.y)) - Math.min(...pontos.map(p => p.y)) + 200;
    camera.zoom = Math.min(zoom, largura / lx, altura / ly);
    camera.centralizar({ x: visuais.reduce((v, p) => v + p.x, 0) / grupo.length, y: visuais.reduce((v, p) => v + p.y, 0) / grupo.length });
}
export function agruparParty(membros: readonly Entidade[], local: string, raio = 10): Entidade[][] {
    const grupos: Entidade[][] = [];
    for (const e of [...membros].sort((a, b) => Number(b.id === local) - Number(a.id === local) || a.id.localeCompare(b.id))) {
        const grupo = grupos.find(g => g.every(x => Math.max(Math.abs(x.x - e.x), Math.abs(x.y - e.y)) <= raio));
        if (grupo)
            grupo.push(e);
        else if (grupos.length < 6)
            grupos.push([e]);
    }
    return grupos;
}
