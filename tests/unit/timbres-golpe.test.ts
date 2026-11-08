// Os sons dos golpes corpo a corpo pelo atacante e a aura do Guerreiro pelo que é público (08/11/2026, D-138).
import { describe, expect, it } from 'vitest';
import { sonsDoEvento, type SomId } from '../../src/audio/mapeamento';
import { timbreDoGolpe, type AtacanteSonoro } from '../../src/audio/timbres';
import { EFEITOS } from '../../src/audio/gravacoes';
import { criarInimigo, criarJogador } from '../../src/entities/fabrica';
import { marcoAMostra, marcoDe } from '../../src/progression/dominio';
import { atacanteSonoro } from '../../src/ui/som';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';

const ctx = contexto(faseDeTexto(SALA_ABERTA));
function obter<T>(v: T | null | undefined): T {
  if (v === null || v === undefined) throw Error('ausente');
  return v;
}
const hab = (id: string) => obter(CONTEUDO.habilidades.get(id));
const criatura = (preset: string) => criarInimigo(obter(CONTEUDO.presets.get(preset)), 'm', 2, 2, ctx.balance);
const somDe = (h: string, a: AtacanteSonoro, basico = false) => timbreDoGolpe(CONTEUDO.armas, hab(h), a, basico)?.som ?? null;
const jogadorCom = (arma: string): AtacanteSonoro => ({ preset: 'jogador', modelo: 'guerreiro', arma, ataqueBasico: 'basico_machado', mortoDoNecromante: false });
const impacto = (habilidadeId: string) => ({ t: 'impacto', tick: 0, acaoId: 1, fonteId: 'f', alvoId: 'a', habilidadeId, chave: habilidadeId, dano: 5, cura: 0, d20: 15, mult: 1, falha: false, critico: false, imune: false, indice: 0, sinergias: [] as string[] }) as const;

describe('som do golpe corpo a corpo', () => {
  it('cada arma corpo a corpo soa pelo próprio básico, com o machado distinto da espada', () => {
    const esperado: Record<string, SomId> = {
      basico_espada: 'golpe_espada', ataque_basico: 'golpe_espada', basico_sabre: 'golpe_sabre', basico_machado: 'golpe_machado',
      basico_montante: 'golpe_montante', basico_lanca: 'golpe_lanca', basico_rapieira: 'golpe_rapieira', basico_maca: 'golpe_maca',
      basico_mangual: 'golpe_mangual',
    };
    for (const [basico, som] of Object.entries(esperado)) expect(somDe(basico, jogadorCom('espada'), true), basico).toBe(som);
    // A flecha crava com o baque um pouco mais agudo; o bumerangue segue com o som de antes.
    expect(somDe('tiro', jogadorCom('arco'), true)).toBe('golpe_flecha');
    expect(somDe('basico_composto', jogadorCom('composto'), true)).toBe('golpe_flecha');
    expect(somDe('flecha', jogadorCom('machado'))).toBe('golpe_flecha');
    expect(somDe('bumerangue', jogadorCom('bumerangue'), true)).toBeNull();
  });
  it('a skill física de perto soa pela arma na mão; a de longe não', () => {
    expect(somDe('golpe_atordoante', jogadorCom('machado'))).toBe('golpe_machado');
    expect(somDe('golpe_atordoante', jogadorCom('clava'))).toBe('golpe_maca');
  });
  it('cada criatura de golpe corpo a corpo soa pelo próprio corpo', () => {
    const esperado: Record<string, SomId> = {
      goblin: 'golpe_faca', orc: 'golpe_machado', troll: 'golpe_maca', lobo: 'golpe_mordida', slime: 'golpe_gosma',
      boss: 'golpe_garra_pesada', dragao_gelo: 'golpe_garra_pesada', sombra: 'golpe_sombra', falcao_companheiro: 'golpe_garra',
    };
    for (const [preset, som] of Object.entries(esperado)) {
      const e = criatura(preset);
      expect(somDe(e.ataqueBasico, atacanteSonoro(ctx, e, undefined)), preset).toBe(som);
    }
    // Todo preset com básico corpo a corpo tem um timbre de golpe gravado.
    for (const p of CONTEUDO.presets.values()) {
      const e = criatura(p.id);
      const som = somDe(e.ataqueBasico, atacanteSonoro(ctx, e, undefined));
      if (som) expect(EFEITOS[som].length, p.id).toBeGreaterThan(0);
    }
  });
  it('os mortos do Necromante dão o baque surdo', () => {
    const necro = criarJogador(obter(CONTEUDO.classes.get('necromante')), 'n', 1, 1, ctx.balance);
    const servo = criatura('esqueleto_profano');
    servo.invocacao = { donoId: 'n', expiraTick: 0, dominado: false, comportamento: 'agressivo', avatar: false, golpesRestantes: 0, abates: 0, criadoTick: 0, nivelDominacao: 0 };
    expect(somDe(servo.ataqueBasico, atacanteSonoro(ctx, servo, necro))).toBe('golpe_baque');
    // O mesmo esqueleto, inimigo sem dono, soa pela foice.
    expect(somDe('golpe', atacanteSonoro(ctx, criatura('esqueleto_profano'), undefined))).toBe('golpe_foice');
  });
  it('o impacto toca o timbre do atacante; a skill com elemento fica com o dela', () => {
    const timbre = (_: string, h: ReturnType<typeof hab>) => timbreDoGolpe(CONTEUDO.armas, h, jogadorCom('machado'), false);
    expect(sonsDoEvento({ ...impacto('basico_machado'), critico: true }, 'j', hab, () => true, timbre)).toEqual([
      { som: 'golpe_machado', origemId: 'a' }, { som: 'critico', origemId: 'a' },
    ]);
    const comElemento = (id: string) => ({ ...hab(id), elemento: 'fogo' as const });
    expect(sonsDoEvento(impacto('golpe_atordoante'), 'j', comElemento, () => false, timbre)[0]?.som).toBe('fogo');
  });
});

describe('aura do Guerreiro à mostra', () => {
  it('sem a bolsa (online e Mundo), o marco vem da classe, do atributo e da arma à mostra', () => {
    const g = criarJogador(obter(CONTEUDO.classes.get('guerreiro')), 'g', 1, 1, ctx.balance);
    g.atributos.dominio = 30;
    expect(marcoDe(ctx, g, 'auraVisivel')).toBe(1);
    const publico = { ...g, bolsa: null, classeId: 'guerreiro', aparencia: { arma: 'machado', secundaria: null, cabeca: null, corpo: null, capa: null, formaArma: null, elementoArma: null, formaMaxima: null } };
    expect(marcoDe(ctx, publico, 'auraVisivel')).toBe(0);
    expect(marcoAMostra(ctx, publico, 'auraVisivel')).toBe(1);
    expect(marcoAMostra(ctx, { ...publico, aparencia: { ...publico.aparencia, arma: 'arco' } }, 'auraVisivel')).toBe(0);
    expect(marcoAMostra(ctx, { ...publico, atributos: { ...publico.atributos, dominio: 20 } }, 'auraVisivel')).toBe(0);
  });
});

describe('anel da aura', () => {
  it('desenha um anel no chão, no raio + meia célula, mais denso com a força', async () => {
    const { EfeitosDeDominio } = await import('../../src/render/efeitos-dominio');
    const pontos: { x: number; y: number }[] = [];
    let faiscas = 0;
    const particulas = {
      noChao: (x: number, y: number) => ({ x, y }),
      emitirNaTela: (lista: readonly unknown[], x: number, y: number) => {
        if (lista.length && (lista[0] as { textura: string }).textura === 'faisca') faiscas++;
        else pontos.push({ x, y });
      },
      emitir: () => undefined,
    };
    const g = criarJogador(obter(CONTEUDO.classes.get('guerreiro')), 'g', 5, 5, ctx.balance);
    const estado = { tick: 0, entidades: [g] } as unknown as Parameters<InstanceType<typeof EfeitosDeDominio>['quadro']>[0];
    const contar = (forca: number) => {
      pontos.length = 0; faiscas = 0;
      const ef = new EfeitosDeDominio({ particulas: particulas as never, auraDe: () => ({ raio: 2, cor: 0xffffff, forca }), orbesDe: () => null });
      for (let ms = 0; ms < 1000; ms += 16) ef.quadro(estado, ms, () => ({ x: 5, y: 5 }));
      return pontos.length;
    };
    const fraca = contar(1);
    for (const p of pontos) expect(Math.hypot(p.x - 5, p.y - 5)).toBeCloseTo(2.5, 5);
    // Os pontos cobrem o anel inteiro (os quatro quadrantes).
    expect(new Set(pontos.map((p) => `${Math.sign(p.x - 5)}${Math.sign(p.y - 5)}`)).size).toBe(4);
    expect(faiscas).toBe(0);
    expect(contar(4)).toBeGreaterThan(fraca);
    expect(faiscas).toBeGreaterThan(0);
  });
});

describe('prêmio do chefe da masmorra repetida (D-138)', () => {
  it('metade a cada vez, até 1 XP, e pela diferença de nível', async () => {
    const { xpDoChefeDaDungeon } = await import('../../src/progression/xp-antifarm');
    const j = criarJogador(obter(CONTEUDO.classes.get('guerreiro')), 'j', 1, 1, ctx.balance);
    const chefe = criatura('rei_goblin');
    j.nivel = 10;
    chefe.nivel = 10;
    const bolsa = obter(j.bolsa);
    expect(xpDoChefeDaDungeon(ctx, j, chefe, 400)).toBe(400);
    bolsa.dungeonChefe = { preset: 'rei_goblin', vezes: 0 };
    expect(xpDoChefeDaDungeon(ctx, j, chefe, 400)).toBe(400);
    bolsa.dungeonChefe.vezes = 2;
    expect(xpDoChefeDaDungeon(ctx, j, chefe, 400)).toBe(100);
    bolsa.dungeonChefe.vezes = 20;
    expect(xpDoChefeDaDungeon(ctx, j, chefe, 400)).toBe(1);
    bolsa.dungeonChefe.vezes = 0;
    chefe.nivel = 15;
    expect(xpDoChefeDaDungeon(ctx, j, chefe, 400)).toBeGreaterThan(400);
    chefe.nivel = 2;
    expect(xpDoChefeDaDungeon(ctx, j, chefe, 400)).toBe(100);
    // Outro monstro da masmorra não muda.
    expect(xpDoChefeDaDungeon(ctx, j, criatura('goblin'), 40)).toBe(40);
  });
});
