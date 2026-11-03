import { criarEstado } from '../../src/core/estado';
import { recortarPorInteresse } from '../../src/arena/interesse';
import { describe, expect, it } from 'vitest';
import { criarEntidade } from '../../src/entities/entidade';
import { GruposDoMundo } from '../../src/mundo/grupos';
import { agruparParty } from '../../src/render/party-visao';
import { lerAcaoDoMundo } from '../../src/mundo/acoes';
import { normalizarPreferencias } from '../../src/plataforma/preferencias';
describe('party por código', () => {
    it('permite criar, entrar até seis e recusa códigos inválidos e duplicação', () => {
        const grupos = new GruposDoMundo(6, 60000);
        grupos.criarPorCodigo('ana', 'ABCDEF123456');
        expect(grupos.entrarPorCodigo('bia', 'NAOEXISTENTE')).toBe('nao_encontrado');
        for (let i = 0; i < 5; i++)
            expect(typeof grupos.entrarPorCodigo(`p${i}`, 'ABCDEF123456')).toBe('object');
        expect(grupos.entrarPorCodigo('p0', 'ABCDEF123456')).toBe('ja_em_grupo');
        expect(grupos.entrarPorCodigo('extra', 'ABCDEF123456')).toBe('grupo_cheio');
    });
    it('valida o protocolo e mantém a visão desligada por padrão', () => {
        expect(lerAcaoDoMundo({ a: 'grupo', op: 'entrar_codigo', codigo: 'ABCDEF123456' })).not.toBeNull();
        expect(lerAcaoDoMundo({ a: 'grupo', op: 'entrar_codigo', codigo: 'x' })).toBeNull();
        expect(normalizarPreferencias({}).visaoParty).toBe(false);
    });
});
it('divide progressivamente em uma até seis câmeras e prioriza o jogador local', () => {
    for (let n = 1; n <= 6; n++) {
        const membros = Array.from({ length: 6 }, (_, i) => criarEntidade({ id: `p${i}`, tipo: 'jogador', x: i < n ? i * 30 : 0, y: 0 }));
        const grupos = agruparParty(membros, 'p0');
        expect(grupos).toHaveLength(n);
        expect(grupos[0]?.[0]?.id).toBe('p0');
    }
});
it('não agrupa por uma corrente que ultrapassa o diâmetro da câmera', () => {
    const membros = [0, 9, 18].map((x, i) => criarEntidade({ id: `p${i}`, tipo: 'jogador', x, y: 0 }));
    expect(agruparParty(membros, 'p0')).toHaveLength(2);
});


it('a party vê aliados distantes e suas vizinhanças sem receber áreas alheias', () => {
  const estado=criarEstado({semente:0,faseId:'teste'});
  const eu=criarEntidade({id:'eu',tipo:'jogador',x:0,y:0});eu.grupo='g';
  const aliado=criarEntidade({id:'aliado',tipo:'jogador',x:100,y:100});aliado.grupo='g';
  const monstro=criarEntidade({id:'monstro',tipo:'inimigo',x:101,y:100});
  const outro=criarEntidade({id:'outro',tipo:'jogador',x:200,y:200});outro.grupo='outro';
  estado.entidades.push(eu,aliado,monstro,outro);
  expect(recortarPorInteresse(estado,'eu',12).entidades.map(e=>e.id)).toEqual(['eu','aliado','monstro']);
});
