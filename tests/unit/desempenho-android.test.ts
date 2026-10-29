// Marco 20 (21/10/2026, D-087): app Android e modo de desempenho — teto de fps, escala da resolução, degradação por
// travadas, medidor, preferências novas e a ordem do endereço do servidor.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { ehAppNativo } from '../../src/plataforma/nativo';
import { enderecoDeServidorValido, gravarPreferencias, normalizarPreferencias, PREFERENCIAS_PADRAO } from '../../src/plataforma/preferencias';
import { enderecoDoServidor } from '../../src/plataforma/servidor';
import { escalaDaResolucao, fpsAlvo, PuladorDeQuadros, resolucaoDoPalco } from '../../src/render/desempenho';
import { MonitorDeQualidade } from '../../src/render/qualidade';
import { resumirQuadros } from '../../src/ui/medidor';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  gravarPreferencias({ ...PREFERENCIAS_PADRAO });
});

describe('resolução e teto de fps', () => {
  it('a escala segue a escolha; a automática é média no toque e alta no desktop', () => {
    expect(escalaDaResolucao('alta', true)).toBe(1);
    expect(escalaDaResolucao('media', false)).toBe(0.75);
    expect(escalaDaResolucao('baixa', false)).toBe(0.5);
    expect(escalaDaResolucao('auto', true)).toBe(0.75);
    expect(escalaDaResolucao('auto', false)).toBe(1);
  });

  it('a resolução do palco respeita o teto do DPR e nunca fica abaixo de 0,5', () => {
    expect(resolucaoDoPalco(3, 2, 1)).toBe(2);
    expect(resolucaoDoPalco(3, 2, 0.75)).toBe(1.5);
    expect(resolucaoDoPalco(1, 2, 0.5)).toBe(0.5);
    expect(resolucaoDoPalco(0, 2, 0.25)).toBe(0.5);
  });

  it('fps automático: 60, e 30 só quando a qualidade automática chegou ao mínimo', () => {
    expect(fpsAlvo('auto', 'baixo')).toBe(60);
    expect(fpsAlvo('auto', 'minimo')).toBe(30);
    expect(fpsAlvo('60', 'minimo')).toBe(60);
    expect(fpsAlvo('30', 'alto')).toBe(30);
  });

  it('a 30 fps numa tela de 60 Hz, desenha um quadro sim, um não; a 60, todos', () => {
    const p = new PuladorDeQuadros();
    const desenhos = (alvo: number) => {
      let n = 0;
      for (let i = 0; i < 60; i++) if (p.deveDesenhar(1000 + i * (1000 / 60), alvo)) n++;
      return n;
    };
    expect(desenhos(30)).toBe(30);
    expect(desenhos(60)).toBe(60);
  });

  it('depois de uma travada longa, recomeça a contagem (não desenha vários seguidos)', () => {
    const p = new PuladorDeQuadros();
    expect(p.deveDesenhar(0, 30)).toBe(true);
    expect(p.deveDesenhar(500, 30)).toBe(true);
    expect(p.deveDesenhar(516, 30)).toBe(false);
    expect(p.deveDesenhar(533, 30)).toBe(true);
  });
});

describe('degradação automática por travadas', () => {
  const rodar = (m: MonitorDeQualidade, s: number, quadro: (i: number) => number, alvo = 60) => {
    const mudancas: string[] = [];
    let t = 0;
    for (let i = 0; t < s * 1000; i++) {
      const d = quadro(i);
      t += d;
      const r = m.registrar(d, t, alvo);
      if (r) mudancas.push(r);
    }
    return mudancas;
  };

  it('média boa, mas 10% dos quadros a 80 ms: desce um nível', () => {
    const m = new MonitorDeQualidade('alto');
    expect(rodar(m, 12, (i) => (i % 10 === 0 ? 80 : 16))).toEqual(['medio']);
  });

  it('a 30 fps estáveis com teto de 30, não desce', () => {
    const m = new MonitorDeQualidade('baixo');
    expect(rodar(m, 30, () => 1000 / 30, 30)).toEqual([]);
    expect(m.p95Ms()).toBeCloseTo(33.3, 0);
  });

  // Marco 26 (29/10/2026, D-122): a qualidade volta a subir quando o aparelho folga, até o nível do começo.
  /** Como `rodar`, mas com o relógio contínuo entre as chamadas. */
  const continuo = (m: MonitorDeQualidade) => {
    let t = 0;
    return (s: number, quadro: () => number, alvo = 60) => {
      const mudancas: string[] = [];
      const fim = t + s * 1000;
      while (t < fim) {
        const d = quadro();
        t += d;
        const r = m.registrar(d, t, alvo);
        if (r) mudancas.push(r);
      }
      return mudancas;
    };
  };

  it('depois de cair, 30 s bons sobem um nível, nunca acima do nível do começo', () => {
    const m = new MonitorDeQualidade('baixo');
    const rodar = continuo(m);
    expect(rodar(12, () => 40)).toEqual(['minimo']);
    // No mínimo o teto é 30 fps: quadros firmes de 33 ms contam como bons.
    expect(rodar(40, () => 1000 / 30, 30)).toEqual(['baixo']);
    expect(rodar(60, () => 16)).toEqual([]);
    expect(m.nivel).toBe('baixo');
  });

  it('cair logo depois de subir dobra a espera da próxima subida', () => {
    const m = new MonitorDeQualidade('baixo');
    const rodar = continuo(m);
    rodar(12, () => 40);
    expect(rodar(40, () => 1000 / 30, 30)).toEqual(['baixo']);
    expect(rodar(12, () => 40)).toEqual(['minimo']);
    // A espera agora é de 60 s: 40 s bons não bastam.
    expect(rodar(40, () => 1000 / 30, 30)).toEqual([]);
    expect(rodar(30, () => 1000 / 30, 30)).toEqual(['baixo']);
  });

  it('o quadro marcado (o salvamento) não conta', () => {
    const m = new MonitorDeQualidade('alto');
    let t = 0;
    const mudancas: string[] = [];
    for (let i = 0; i < 60 * 12; i++) {
      const d = i % 30 === 0 ? 400 : 16;
      t += d;
      if (d > 16) m.ignorarProximo();
      const r = m.registrar(d, t);
      if (r) mudancas.push(r);
    }
    expect(mudancas).toEqual([]);
  });
});

describe('medidor', () => {
  it('resume fps, p95 e pausas longas', () => {
    expect(resumirQuadros([])).toEqual({ fps: 0, p95Ms: 0, pausas: 0 });
    const r = resumirQuadros([...Array<number>(19).fill(16), 120]);
    expect(r.pausas).toBe(1);
    expect(r.p95Ms).toBe(120);
    expect(r.fps).toBe(47);
  });
});

describe('preferências do marco 20', () => {
  it('fps, resolução, medidor e servidor normalizados; lixo volta ao padrão', () => {
    expect(normalizarPreferencias({ fps: '30', resolucao: 'baixa', medidor: true, servidor: ' ws://192.168.3.51:2567 ' })).toMatchObject({
      fps: '30',
      resolucao: 'baixa',
      medidor: true,
      servidor: 'ws://192.168.3.51:2567',
    });
    expect(normalizarPreferencias({ fps: 144, resolucao: 'ultra', medidor: 'sim', servidor: 'http://x.com/caminho' })).toMatchObject({
      fps: 'auto',
      resolucao: 'auto',
      medidor: false,
      servidor: '',
    });
  });

  it('o endereço do servidor é só ws(s)://host[:porta]', () => {
    expect(enderecoDeServidorValido('wss://dungeons-bruno.duckdns.org')).toBe(true);
    expect(enderecoDeServidorValido('ws://192.168.3.51:2567')).toBe(true);
    expect(enderecoDeServidorValido('ws://192.168.3.51:2567/sala')).toBe(false);
    expect(enderecoDeServidorValido('javascript:alert(1)')).toBe(false);
  });
});

describe('endereço do servidor', () => {
  const pagina = (search: string, hostname = 'brun-after.github.io') => vi.stubGlobal('location', { search, hostname });

  it('ordem: ?servidor= da URL, depois o escolhido no aparelho, depois o do build', () => {
    vi.stubEnv('VITE_ARENA_URL', 'wss://oficial.exemplo');
    pagina('');
    expect(enderecoDoServidor()).toBe('wss://oficial.exemplo');
    gravarPreferencias({ ...PREFERENCIAS_PADRAO, servidor: 'ws://192.168.3.51:2567' });
    expect(enderecoDoServidor()).toBe('ws://192.168.3.51:2567');
    pagina('?servidor=ws://10.0.0.2:2567');
    expect(enderecoDoServidor()).toBe('ws://10.0.0.2:2567');
  });

  it('em localhost sem nada configurado: o servidor local; no app (também localhost), nenhum', () => {
    vi.stubEnv('VITE_ARENA_URL', '');
    pagina('', 'localhost');
    expect(enderecoDoServidor()).toBe('ws://localhost:2567');
    vi.stubGlobal('Capacitor', { isNativePlatform: () => true });
    expect(ehAppNativo()).toBe(true);
    expect(enderecoDoServidor()).toBeNull();
  });

  it('fora do app, não é nativo', () => {
    expect(ehAppNativo()).toBe(false);
  });
});
