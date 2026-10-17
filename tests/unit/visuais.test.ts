// Marco 11A (16/10/2026, D-066): a aparência das habilidades — todo preset que uma habilidade (oficial ou de elemento)
// pede existe no sistema de partículas, toda emissão usa uma textura do atlas, e os golpes, arcanas, gelo, veneno,
// sombra, sangue, cura, vento e raio têm cada um a sua fantasia (não mais tudo faísca).

import { describe, expect, it } from 'vitest';
import { PRESETS_VISUAIS } from '../../src/combat/habilidades';
import { OPCOES_JOGAVEIS } from '../../src/render/modelos';
import { adornosDoBipede } from '../../src/render/modelos/adornos';
import { PRESETS_PARTICULA, TEXTURAS_PARTICULA } from '../../src/render/presets-particula';
import { visualDe } from '../../src/render/visual-habilidade';
import { CONTEUDO } from '../apoio/fases';

describe('presets visuais', () => {
  it('todo preset das habilidades existe e toda emissão usa textura do atlas', () => {
    for (const nome of PRESETS_VISUAIS) expect(PRESETS_PARTICULA[nome].length).toBeGreaterThan(0);
    for (const emissoes of Object.values(PRESETS_PARTICULA)) {
      for (const e of emissoes) {
        expect(TEXTURAS_PARTICULA).toContain(e.textura);
        expect(e.vidaMs[0]).toBeLessThanOrEqual(e.vidaMs[1]);
        expect(e.quantidade).toBeGreaterThan(0);
      }
    }
  });

  it('cada fantasia tem o seu visual', () => {
    const impacto = (id: string) => {
      const h = CONTEUDO.habilidades.get(id);
      return h ? visualDe(h).impacto : undefined;
    };
    expect(impacto('golpe')).toBe('corte');
    expect(impacto('seta_arcana')).toBe('runas');
    expect(impacto('lanca_de_gelo')).toBe('cristais');
    expect(impacto('flecha_venenosa')).toBe('bolhas');
    expect(impacto('troca_sombria')).toBe('sombra');
    expect(impacto('raio_vampirico')).toBe('sangue');
    expect(impacto('curar')).toBe('sagrado');
    expect(impacto('redemoinho')).toBe('vento');
    expect(impacto('raio')).toBe('relampago');
    const usados = new Set([...CONTEUDO.habilidades.values()].map((h) => visualDe(h).impacto));
    expect(usados.size).toBeGreaterThanOrEqual(10);
  });
});

// Ajuste de 16/10/2026 (D-067): flecha parece flecha — o corpo do projétil pela forma, a esteira fina e orientada no
// lugar das bolinhas de brilho, a chuva caindo do alto e o leque em cone; e o equipamento desenhado no token.
describe('flechas e equipamento no token', () => {
  const visual = (id: string) => {
    const h = CONTEUDO.habilidades.get(id);
    if (!h) throw new Error(id);
    return visualDe(h);
  };

  it('projétil físico é flecha com esteira; mágico segue orbe; a teia tem corpo próprio', () => {
    for (const id of ['flecha', 'tiro', 'flecha_perfurante', 'flecha_venenosa']) {
      expect(visual(id).projetil).toBe('flecha');
      expect(visual(id).viagem).toBe('esteira');
    }
    expect(visual('seta_arcana').projetil).toBe('orbe');
    expect(visual('teia').projetil).toBe('teia');
    expect(visual('chuva_de_flechas').impacto).toBe('chuva');
    expect(visual('tiro_em_leque').impacto).toBe('leque');
  });

  it('a esteira e o corpo da flecha são orientados; a chuva nasce no alto e cai; o leque sai em cone', () => {
    expect(PRESETS_PARTICULA.esteira.every((e) => e.direcao === 'orientada' && e.textura !== 'brilho')).toBe(true);
    expect(PRESETS_PARTICULA.projetil_flecha[0]?.textura).toBe('flecha');
    const chuva = PRESETS_PARTICULA.chuva.find((e) => e.textura === 'flecha');
    expect(chuva?.direcao).toBe('baixo');
    expect(chuva?.alturaInicial).toBeGreaterThan(0);
    expect(PRESETS_PARTICULA.leque.every((e) => e.forma === 'cone')).toBe(true);
    // Sem brilhinhos na chuva nem no acerto da flecha.
    for (const nome of ['chuva', 'farpas'] as const) expect(PRESETS_PARTICULA[nome].some((e) => e.textura === 'brilho' || e.textura === 'faisca')).toBe(false);
  });

  it('os adornos desenham a arma, o escudo, o elmo e a capa pedidos, e nada sem equipamento', () => {
    const o = OPCOES_JOGAVEIS.guerreiro;
    const nada = { arma: null, secundaria: null, cabeca: null, corpo: null, capa: null };
    expect(adornosDoBipede(o, '34', nada)).toEqual({ atras: '', frente: '' });
    const cheio = adornosDoBipede(o, '34', { arma: 'arco', secundaria: 'escudo', cabeca: 0x3498db, corpo: 0x9b59b6, capa: 0xf39c12 });
    expect(cheio.atras).toContain('#'); // a capa
    expect(cheio.frente).toContain('<path'); // o arco (e o elmo)
    expect(cheio.frente).toContain('<ellipse'); // o escudo
    expect(adornosDoBipede(o, 'cima', { ...nada, arma: 'espada' }).frente).toContain('scale(1.35)');
    // Os modelos das classes vêm sem arma: quem desenha a arma é o equipamento.
    for (const opcoes of Object.values(OPCOES_JOGAVEIS)) expect('arma' in opcoes || 'escudo' in opcoes).toBe(false);
  });
});
