import { afterEach, expect, it, vi } from 'vitest';
import { iniciarLaco } from '../../src/plataforma/laco-navegador';

afterEach(() => vi.unstubAllGlobals());

it('uma falha no passo de rede não encerra o agendamento dos quadros', () => {
  const fila: FrameRequestCallback[] = [];
  vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => { fila.push(fn); return fila.length; });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  let agora = 0;
  const simular = vi.fn().mockImplementationOnce(() => { throw new Error('falha transitória no passo'); });
  const renderizar = vi.fn();
  const parar = iniciarLaco({ simular, renderizar, relogio: { agoraMs: () => agora } });
  fila.shift()?.(agora);
  agora = 100;
  expect(() => fila.shift()?.(agora)).toThrow('falha transitória no passo');
  expect(fila).toHaveLength(1);
  agora = 200;
  fila.shift()?.(agora);
  agora = 300;
  fila.shift()?.(agora);
  expect(simular.mock.calls.length).toBeGreaterThan(1);
  expect(renderizar.mock.calls.length).toBeGreaterThan(1);
  parar();
});
