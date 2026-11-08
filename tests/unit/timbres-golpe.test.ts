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
    const voos: { x: number; y: number; angulo: number; textura: string }[] = [];
    const particulas = {
      noChao: (x: number, y: number) => ({ x, y }),
      naTela: (x: number, y: number) => ({ x, y }),
      emitirNaTela: (lista: readonly { textura: string }[], x: number, y: number, _cor: number, _ate: unknown, angulo = 0) => {
        voos.push({ x, y, angulo, textura: lista[0]?.textura ?? '' });
      },
      emitir: () => undefined,
    };
    const g = criarJogador(obter(CONTEUDO.classes.get('guerreiro')), 'g', 5, 5, ctx.balance);
    const inimigo = criatura('goblin');
    inimigo.x = 7; inimigo.y = 5;
    const estado = { tick: 0, entidades: [g, inimigo] } as unknown as Parameters<InstanceType<typeof EfeitosDeDominio>['quadro']>[0];
    // Só o Guerreiro tem a aura.
    const ef = new EfeitosDeDominio({ particulas: particulas as never, auraDe: (e) => (e.id === 'g' ? aura : null), orbesDe: () => null });
    const bus = new Barramento() as never;
    ef.ligar(bus, () => estado);
    const posicao = (e: { x: number; y: number }) => ({ x: e.x, y: e.y });
    return { ef, bus: bus as { emitir: (t: string, ev: unknown) => void }, estado, voos, posicao };
  };

  it('fora de ação (sem combate), nada aparece', async () => {
    const m = await montar(null);
    for (let ms = 0; ms < 2000; ms += 16) m.ef.quadro(m.estado, ms, m.posicao);
    expect(m.voos).toHaveLength(0);
  });

  it('em ação, a área pulsa em ondas que convergem para o Guerreiro, mais densas com a força', async () => {
    const contar = async (forca: number) => {
      const m = await montar({ raio: 2, cor: 0xffffff, forca });
      m.ef.quadro(m.estado, 0, m.posicao);
      return m.voos;
    };
    const fraca = await contar(1);
    expect(fraca.length).toBeGreaterThan(0);
    for (const v of fraca) {
      // Saem dentro da área e apontam para o centro (5, 5).
      expect(Math.hypot(v.x - 5, v.y - 5)).toBeLessThanOrEqual(2.5 + 1e-9);
      const paraOCentro = Math.atan2(5 - v.y, 5 - v.x);
      expect(Math.abs(Math.atan2(Math.sin(v.angulo - paraOCentro), Math.cos(v.angulo - paraOCentro)))).toBeLessThan(1e-6);
    }
    expect((await contar(4)).length).toBeGreaterThan(fraca.length);
  });

  it('a cada pulso, filetes saem do inimigo atingido para o Guerreiro', async () => {
    const m = await montar({ raio: 2, cor: 0xffffff, forca: 2 });
    m.ef.quadro(m.estado, 0, m.posicao);
    m.voos.length = 0;
    const doGoblin = m.voos;
    m.bus.emitir('auraPulsou', { t: 'auraPulsou', tick: 0, id: 'g', x: 5, y: 5, raio: 2, atingidos: ['m'] });
    // Os filetes saem primeiro (3 + a força), um pouco espalhados em volta do goblin, e apontam para o Guerreiro;
    // depois vem a onda reforçada da área.
    const filetes = doGoblin.slice(0, 5);
    expect(doGoblin.length).toBeGreaterThan(5);
    for (const v of filetes) {
      const paraOGuerreiro = Math.atan2(5 - v.y, 5 - v.x);
      expect(Math.abs(Math.atan2(Math.sin(v.angulo - paraOGuerreiro), Math.cos(v.angulo - paraOGuerreiro)))).toBeLessThan(1e-6);
    }
    expect(filetes.some((v) => v.textura === 'faisca')).toBe(true);
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
