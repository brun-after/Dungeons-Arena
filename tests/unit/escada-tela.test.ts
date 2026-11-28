// Marco 56 (27/11/2026, D-209): o que a tela mostra na troca pela escada: entrar desce (a torre sobe), trocar de andar
// segue o sentido do andar, sair volta, e o resto (regiões, o Mundo contínuo) não mostra nada.

import { describe, expect, it } from 'vitest';
import { descidaDaTroca } from '../../src/ui/escada-tela';
import { CONTEUDO } from '../apoio/fases';

const reino = CONTEUDO.reinos.get('reino_central');

describe('a escada na tela', () => {
  it('desce ao entrar, segue o andar e sobe ao sair; a torre ao contrário', () => {
    if (!reino) throw new Error('reino ausente');
    expect(descidaDaTroca(reino, 'mundo', 'masmorra:toca_dos_goblins')).toEqual({ sentido: 'descer', texto: 'Descendo para Toca dos Goblins' });
    expect(descidaDaTroca(reino, 'masmorra:toca_dos_goblins', 'masmorra:toca_dos_goblins:2')).toEqual({ sentido: 'descer', texto: 'Descendo ao andar 2 de Toca dos Goblins' });
    expect(descidaDaTroca(reino, 'masmorra:toca_dos_goblins:3', 'masmorra:toca_dos_goblins:2')).toEqual({ sentido: 'subir', texto: 'Subindo ao andar 2 de Toca dos Goblins' });
    expect(descidaDaTroca(reino, 'masmorra:toca_dos_goblins:3', 'mundo')).toEqual({ sentido: 'subir', texto: 'Saindo de Toca dos Goblins' });
    expect(descidaDaTroca(reino, 'regiao:vila_do_centro', 'masmorra:santuario_das_escamas')?.sentido).toBe('subir');
    expect(descidaDaTroca(reino, 'masmorra:santuario_das_escamas', 'masmorra:santuario_das_escamas:2')?.sentido).toBe('subir');
    expect(descidaDaTroca(reino, 'regiao:vila_do_centro', 'regiao:campos_do_oeste')).toBeNull();
    expect(descidaDaTroca(reino, 'mundo', 'mundo')).toBeNull();
  });
});
