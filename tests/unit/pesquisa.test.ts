import { describe, expect, it } from 'vitest';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { comPontosDistribuidos, criarColetor, type ClasseDeAlvo } from '../../src/pesquisa/coletor';
import { lerRelatorio, MAX_COMENTARIO, VERSAO_RELATORIO, type RelatorioPesquisa } from '../../src/pesquisa/relatorio';
import { criterios, lerArquivo, tabela } from '../../tools/relatorios/resumo';

const classes: Record<string, ClasseDeAlvo> = { b: 'boneco', g: 'comum', boss: 'boss' };
const classificar = (id: string) => classes[id] ?? 'comum';

const impacto = (fonteId: string, alvoId: string): EventoSimulacao => ({
  t: 'impacto',
  tick: 0,
  acaoId: 1,
  fonteId,
  alvoId,
  habilidadeId: 'ataque_basico',
  dano: 3,
  cura: 0,
  d20: 10,
  mult: 1,
  falha: false,
  critico: false,
  imune: false,
  indice: 0,
});
const acao = (atorId: string, habilidadeId: string): EventoSimulacao => ({
  t: 'acaoIniciada',
  tick: 0,
  acaoId: 1,
  atorId,
  habilidadeId,
  alvoId: null,
  alvoX: 0,
  alvoY: 0,
  inicioTick: 0,
  lancamentoTick: 0,
  impactoPrevistoTick: 0,
});

function relatorio(
  parcial: Partial<RelatorioPesquisa['medidas']> = {},
  toque = true,
  avisos: RelatorioPesquisa['respostas']['avisos'] = { area: 'reconheci', linha: 'reconheci', projetil: 'reconheci' },
): RelatorioPesquisa {
  const c = criarColetor('j', 0, classificar);
  return {
    versao: VERSAO_RELATORIO,
    conteudo: 'abc',
    plataforma: { toque, largura: 800, altura: 400, dpr: 2 },
    medidas: { ...c.medidas(60, 1), ...parcial },
    respostas: { avisos: { ...avisos }, entendeuEquipamento: 'sim', comentario: '' },
  };
}

describe('coletor de medidas', () => {
  it('mede primeira luta (sem contar o boneco), ataques, abates, boss e a volta ao combate depois de melhorar', () => {
    const c = criarColetor('j', 100, classificar);
    c.registrar(acao('j', 'ataque_basico'), 101);
    c.registrar(impacto('j', 'b'), 102); // boneco: não é luta
    c.registrar(acao('j', 'seta_arcana'), 110);
    c.registrar(impacto('g', 'j'), 112.4);
    c.registrar({ t: 'morreu', tick: 0, id: 'g', porId: 'j' }, 113);
    c.registrar({ t: 'morreu', tick: 0, id: 'b', porId: 'j' }, 114);
    c.registrar({ t: 'coletou', tick: 0, id: 'j', objetoId: 'd:1', tipo: 'item', ganho: 1, itemId: 'adaga' }, 115);
    c.registrar({ t: 'equipou', tick: 0, id: 'j', itemId: 'adaga', slot: 'arma_secundaria' }, 120);
    c.registrar({ t: 'iaNotou', tick: 0, id: 'boss', alvoId: 'j', hesitacaoAteTick: 0 }, 130);
    c.registrar(impacto('j', 'boss'), 131);
    c.registrar({ t: 'morreu', tick: 0, id: 'boss', porId: 'j' }, 140);
    c.registrar({ t: 'morreu', tick: 0, id: 'j', porId: 'boss' }, 141);
    const m = comPontosDistribuidos(c.medidas(160, 3), true);
    expect(m).toMatchObject({
      duracaoS: 60,
      tempoAtePrimeiraLutaS: 12.4,
      ataquesBasicos: 1,
      habilidades: { seta_arcana: 1 },
      abates: 2,
      mortes: 1,
      itensColetados: 1,
      equipouEmS: 20,
      nivelFinal: 3,
      distribuiuPontos: true,
      voltouALutarDepoisDeMelhorar: true,
      viuBoss: true,
      bossDerrotado: true,
    });
  });

  it('sem luta depois de melhorar, não conta a volta ao combate', () => {
    const c = criarColetor('j', 0, classificar);
    c.registrar(impacto('g', 'j'), 5);
    c.registrar({ t: 'subiuNivel', tick: 0, id: 'j', nivel: 2 }, 10);
    expect(c.medidas(20, 2).voltouALutarDepoisDeMelhorar).toBe(false);
  });
});

describe('relatório (validação compartilhada com o servidor)', () => {
  it('aceita o relatório completo e devolve só os campos conhecidos', () => {
    const r = relatorio();
    expect(lerRelatorio({ ...r, ip: '1.2.3.4' })).toEqual(r);
  });

  it('recusa versão errada, resposta fora da lista, comentário longo e número inválido', () => {
    const r = relatorio();
    expect(lerRelatorio({ ...r, versao: 99 })).toBeNull();
    expect(lerRelatorio({ ...r, respostas: { ...r.respostas, avisos: { ...r.respostas.avisos, area: 'talvez' } } })).toBeNull();
    expect(lerRelatorio({ ...r, respostas: { ...r.respostas, comentario: 'x'.repeat(MAX_COMENTARIO + 1) } })).toBeNull();
    expect(lerRelatorio({ ...r, medidas: { ...r.medidas, mortes: -1 } })).toBeNull();
    expect(lerRelatorio('não é objeto')).toBeNull();
  });
});

describe('resumo dos relatórios (§5.7)', () => {
  it('confere os critérios e ignora linhas inválidas', () => {
    const passou = relatorio({ abates: 2 });
    const linhas = [
      ...[true, true, true, false, false].map((toque) => JSON.stringify({ recebidoEm: 'x', ...relatorio({ abates: 1 }, toque) })),
      JSON.stringify(relatorio({ abates: 0 }, true, { area: 'nao_vi', linha: 'reconheci', projetil: 'reconheci' })),
      'lixo',
    ].join('\n');
    const { relatorios, invalidas } = lerArquivo(linhas);
    expect(invalidas).toBe(1);
    expect(criterios(relatorios).map((c) => [c.nome, c.valor, c.ok])).toEqual([
      ['pessoas', 6, true],
      ['no celular (toque)', 4, true],
      ['concluíram o primeiro encontro', 5, true],
      ['reconheceram os 3 avisos', 5, true],
    ]);
    expect(tabela([passou])).toContain('| 1 | toque 800×400 |');
  });
});
