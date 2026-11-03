// 02/11/2026: agrupamento por diâmetro; evita juntar uma corrente de jogadores que não cabe na tela.
import type { Entidade } from '../entities/entidade';
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
