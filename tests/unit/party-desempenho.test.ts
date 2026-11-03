import { afterEach, describe, expect, it, vi } from 'vitest';
import { Container, Graphics } from 'pixi.js';
import { criarTerreno } from '../../src/render/terreno';
import { carregarFase } from '../../src/world/fase';
import { ConsultaParty } from '../../src/plataforma/consulta-party';
import { iniciarLaco } from '../../src/plataforma/laco-navegador';
import { criarPaineisParty } from '../../src/ui/party-paineis';
import type { Palco } from '../../src/render/stage';
import type { Camera } from '../../src/render/camera';

afterEach(() => { vi.unstubAllGlobals(); });

describe('custo da visão party', () => {
  it('usa o WebGL local diretamente e não aloca canvases de cópia para regiões remotas', () => {
    const criarCanvas = () => ({ style: {}, width: 800, height: 600, classList: { add: vi.fn(), remove: vi.fn() },
      setAttribute: vi.fn(), getContext: vi.fn() });
    const criar = vi.fn(criarCanvas);
    vi.stubGlobal('document', { createElement: criar, body: { dataset: {}, style: { setProperty: vi.fn() } } });
    const canvas = criarCanvas();
    const palco = { canvas, largura: () => 400, altura: () => 600, app: { renderer: { resize: vi.fn() } } } as unknown as Palco;
    const camera = { definirVista: vi.fn() } as unknown as Camera;
    const host = { clientWidth: 800, clientHeight: 600, append: vi.fn() } as unknown as HTMLElement;
    const paineis = criarPaineisParty(host, palco, camera);
    paineis.ajustar(2, 1);
    for (let i = 0; i < 60; i++) paineis.copiar(0, 'Local');
    expect(criar).not.toHaveBeenCalled();
    expect(canvas.getContext).not.toHaveBeenCalled();
    expect(canvas.classList.add).toHaveBeenCalledWith('camera-party');
    paineis.limpar();
  });

  it('mantém os blocos das câmeras distantes sem reconstruí-los a cada alternância', () => {
    const camada = new Container();
    const fase = carregarFase({ id: 'party', nome: 'Party', ordem: 0, tipo: 'campanha',
      mapa: Array<string>(128).fill('.'.repeat(128)), spawns: [] });
    const terreno = criarTerreno(camada, fase);
    const oeste = [0, 0, 768, 768] as const;
    const leste = [5376, 5376, 6144, 6144] as const;
    try {
      terreno.prepararVistas([oeste, leste]);
      terreno.atualizarVisibilidade(...oeste);
      const primeiro = camada.children[0]?.children[0];
      expect(primeiro).toBeInstanceOf(Graphics);
      if (!(primeiro instanceof Graphics)) throw new Error('bloco ausente');
      const limpar = vi.spyOn(primeiro, 'clear');
      for (let i = 0; i < 60; i++) {
        terreno.prepararVistas([oeste, leste]);
        terreno.atualizarVisibilidade(...leste);
        terreno.atualizarVisibilidade(...oeste);
      }
      expect(limpar).not.toHaveBeenCalled();
      // Ao sair da party, os blocos distantes voltam a ser descartados.
      terreno.prepararVistas([leste]);
      terreno.atualizarVisibilidade(...leste);
      expect(limpar).toHaveBeenCalledTimes(1);
    } finally { terreno.destruir(); camada.destroy(); }
  });

  it('aguarda a resposta e permite recuperar uma consulta sem resposta', () => {
    const consulta = new ConsultaParty();
    expect(consulta.podeConsultar(0)).toBe(true);
    for (let t = 250; t < 2000; t += 250) expect(consulta.podeConsultar(t)).toBe(false);
    consulta.concluir();
    expect(consulta.podeConsultar(1750)).toBe(true);
    expect(consulta.podeConsultar(2000)).toBe(false);
    expect(consulta.podeConsultar(3750)).toBe(true);
  });
});

it('uma falha de desenho não mata os passos de rede e o próximo quadro', () => {
  const fila: FrameRequestCallback[] = [];
  vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => { fila.push(fn); return fila.length; });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  let agora = 0;
  const simular = vi.fn();
  const renderizar = vi.fn().mockImplementationOnce(() => { throw new Error('falha visual'); });
  const parar = iniciarLaco({ simular, renderizar, relogio: { agoraMs: () => agora } });
  expect(() => fila.shift()?.(agora)).toThrow('falha visual');
  expect(fila).toHaveLength(1);
  agora = 100;
  fila.shift()?.(agora);
  expect(simular).toHaveBeenCalled();
  expect(renderizar).toHaveBeenCalledTimes(2);
  parar();
});

it('parar dentro do desenho continua sem agendar outro quadro', () => {
  const fila: FrameRequestCallback[] = [];
  vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => { fila.push(fn); return fila.length; });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  const parar = iniciarLaco({ simular: () => {}, renderizar: () => { parar(); } });
  fila.shift()?.(0);
  expect(fila).toHaveLength(0);
});
