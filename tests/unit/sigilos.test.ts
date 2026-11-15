// D-175 (15/11/2026): cada skill comum e cada família de ultimate tem um sigilo só dela.
import { describe, expect, it } from 'vitest';
import { ehSigilo, IDS_SIGILO, idDoSigilo, idDoSigiloDaUltimate, mioloDoSigilo, svgDoSigilo } from '../../src/data/sigilos';
import { svgDoIcone } from '../../src/data/icones';
import { CONTEUDO } from '../apoio/fases';

describe('os sigilos (D-175)', () => {
  it('as 89 skills comuns têm, cada uma, o sigilo do seu núcleo e do seu elemento', () => {
    const vistos = new Set<string>();
    const desenhos = new Set<string>();
    for (const def of CONTEUDO.definicoes.values()) {
      if (!def.nucleo || def.interna) continue;
      const icone = def.base.icone;
      expect(icone, def.base.id).toBe(idDoSigilo(def.nucleo, def.base.elemento));
      expect(ehSigilo(icone), def.base.id).toBe(true);
      vistos.add(icone);
      desenhos.add(mioloDoSigilo(icone));
    }
    expect(vistos.size).toBe(89);
    expect(desenhos.size).toBe(89);
  });

  it('as 21 famílias de ultimate têm, cada uma, o seu', () => {
    const desenhos = new Set<string>();
    for (const u of CONTEUDO.ultimates.values()) {
      const h = CONTEUDO.habilidades.get(u.id);
      expect(h?.icone, u.id).toBe(idDoSigiloDaUltimate(u.id));
      desenhos.add(mioloDoSigilo(h?.icone ?? ''));
    }
    expect(desenhos.size).toBe(21);
  });

  it('todo sigilo possível desenha algo, e o id inválido não é sigilo', () => {
    for (const id of IDS_SIGILO) expect(mioloDoSigilo(id).length, id).toBeGreaterThan(100);
    expect(new Set(IDS_SIGILO.map(mioloDoSigilo)).size).toBe(IDS_SIGILO.length);
    expect(ehSigilo('sig_nada_fogo')).toBe(false);
    expect(ehSigilo('coroa')).toBe(false);
    expect(mioloDoSigilo('sig_projetil_nada')).toBe('');
  });

  it('o SVG do ícone serve o sigilo com as cores dele', () => {
    expect(svgDoIcone('sig_projetil_fogo', '#000000', 32)).toBe(svgDoSigilo('sig_projetil_fogo', 32));
    expect(svgDoSigilo('sig_ult_legiao')).toContain('viewBox="0 0 48 48"');
  });
});
