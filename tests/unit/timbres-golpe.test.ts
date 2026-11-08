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

describe('aura em ação', () => {
  /** Partículas falsas: a tela é a própria grade; guarda de onde cada brilho sai e para onde aponta. */
  const montar = async (aura: { raio: number; cor: number; forca: number } | null) => {
    const { EfeitosDeDominio } = await import('../../src/render/efeitos-dominio');
    const { Barramento } = await import('../../src/core/events');
    const voos: { x: number; y: number; angulo: number; textura: string; esticar: number }[] = [];
    const particulas = {
      noChao: (x: number, y: number) => ({ x, y }),
      naTela: (x: number, y: number) => ({ x, y }),
      emitirNaTela: (lista: readonly { textura: string; esticar?: number }[], x: number, y: number, _cor: number, _ate: unknown, angulo = 0) => {
        voos.push({ x, y, angulo, textura: lista[0]?.textura ?? '', esticar: lista[0]?.esticar ?? 0 });
      },
      emitir: (nome: string) => { emitidos.push(nome); },
    };
    const emitidos: string[] = [];
    // A área falsa: guarda cada pulso e onde ele está (segue o Guerreiro).
    const pulsos: { onde: () => { x: number; y: number } | null; raio: number }[] = [];
    const area = { pulsar: (onde: () => { x: number; y: number } | null, a: { raio: number }) => { pulsos.push({ onde, raio: a.raio }); }, quadro: () => undefined };
    const g = criarJogador(obter(CONTEUDO.classes.get('guerreiro')), 'g', 5, 5, ctx.balance);
    const inimigo = criatura('goblin');
    inimigo.x = 7; inimigo.y = 5;
    const estado = { tick: 0, entidades: [g, inimigo] } as unknown as Parameters<InstanceType<typeof EfeitosDeDominio>['quadro']>[0];
    // Só o Guerreiro tem a aura.
    const ef = new EfeitosDeDominio({ particulas: particulas as never, auraDe: (e) => (e.id === 'g' ? aura : null), orbesDe: () => null, area });
    const bus = new Barramento() as never;
    ef.ligar(bus, () => estado, () => 0);
    const posicao = (e: { x: number; y: number }) => ({ x: e.x, y: e.y });
    return { ef, bus: bus as { emitir: (t: string, ev: unknown) => void }, estado, voos, pulsos, posicao, g, inimigo, emitidos };
  };

  it('sem pulso (perseguindo, em combate, sem ninguém atingido), nada aparece', async () => {
    const m = await montar({ raio: 2, cor: 0xffffff, forca: 4 });
    for (let ms = 0; ms < 2000; ms += 16) m.ef.quadro(m.estado, ms, m.posicao);
    expect(m.voos).toHaveLength(0);
    expect(m.pulsos).toHaveLength(0);
  });

  it('o pulso acende a área no chão, que segue o Guerreiro, e filetes esticados saem do atingido para ele', async () => {
    const m = await montar({ raio: 2, cor: 0xffffff, forca: 2 });
    m.ef.quadro(m.estado, 0, m.posicao);
    m.bus.emitir('auraPulsou', { t: 'auraPulsou', tick: 0, id: 'g', x: 5, y: 5, raio: 2, atingidos: ['m'] });
    expect(m.pulsos).toHaveLength(1);
    expect(m.pulsos[0]?.raio).toBe(2);
    expect(m.pulsos[0]?.onde()).toEqual({ x: 5, y: 5 });
    m.g.x = 6;
    expect(m.pulsos[0]?.onde()).toEqual({ x: 6, y: 5 });
    // Só os filetes (3 + a força) são partículas, todos riscos esticados, saindo do goblin e apontando para (5, 5).
    expect(m.voos).toHaveLength(5);
    for (const v of m.voos) {
      expect(Math.hypot(v.x - 7, v.y - 5)).toBeLessThan(0.5 + 6);
      expect(v.esticar).toBeGreaterThan(0);
      const paraOGuerreiro = Math.atan2(5 - v.y, 5 - v.x);
      expect(Math.abs(Math.atan2(Math.sin(v.angulo - paraOGuerreiro), Math.cos(v.angulo - paraOGuerreiro)))).toBeLessThan(1e-6);
    }
  });

  it('sem a aura à mostra (Bravura abaixo de 25), o pulso não acende nada', async () => {
    const m = await montar(null);
    m.bus.emitir('auraPulsou', { t: 'auraPulsou', tick: 0, id: 'g', x: 5, y: 5, raio: 2, atingidos: ['m'] });
    m.ef.quadro(m.estado, 0, m.posicao);
    expect(m.pulsos).toHaveLength(0);
    expect(m.voos).toHaveLength(0);
  });

  describe('a aura pela Bravura (D-138)', () => {
    it('a cor vai do amarelo (25) ao vermelho (75+), passando pelo laranja', async () => {
      const { corDaAura } = await import('../../src/render/area-aura');
      const vermelho = (c: number) => (c >> 16) & 0xff;
      const verde = (c: number) => (c >> 8) & 0xff;
      expect(corDaAura(25)).toBe(0xffd86b);
      expect(corDaAura(50)).toBe(0xff9a3c);
      expect(corDaAura(75)).toBe(0xe8402a);
      // O verde cai sem voltar: o amarelo vira vermelho.
      let antes = verde(corDaAura(25));
      for (let b = 26; b <= 100; b++) {
        expect(verde(corDaAura(b))).toBeLessThanOrEqual(antes);
        antes = verde(corDaAura(b));
      }
      expect(vermelho(corDaAura(100))).toBeGreaterThan(verde(corDaAura(100)) * 3);
    });

    it('o fogo é maior quanto menor a diferença de nível', async () => {
      const { fogoNaAura } = await import('../../src/render/area-aura');
      expect(fogoNaAura(40, 40)).toBe(1);
      expect(fogoNaAura(40, 35)).toBeGreaterThan(fogoNaAura(40, 30));
      expect(fogoNaAura(40, 45)).toBe(fogoNaAura(40, 35));
      expect(fogoNaAura(40, 1)).toBe(0.15);
    });

    it('da Bravura 75 (força 3), o atingido arde; antes, não', async () => {
      const contar = async (forca: number, nivelAlvo: number) => {
        const m = await montar({ raio: 2, cor: 0xe8402a, forca });
        m.g.nivel = 40;
        m.inimigo.nivel = nivelAlvo;
        m.ef.quadro(m.estado, 0, m.posicao);
        m.bus.emitir('auraPulsou', { t: 'auraPulsou', tick: 0, id: 'g', x: 5, y: 5, raio: 2, atingidos: ['m'] });
        // Segue ardendo pelos quadros seguintes.
        for (let ms = 16; ms < 1000; ms += 16) m.ef.quadro(m.estado, ms, m.posicao);
        return m.emitidos.filter((n) => n === 'aura_queimando').length;
      };
      expect(await contar(2, 40)).toBe(0);
      const perto = await contar(3, 40);
      const longe = await contar(3, 10);
      expect(longe).toBeGreaterThan(0);
      expect(perto).toBeGreaterThan(longe);
    });
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
