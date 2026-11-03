import { expect, test } from 'vitest';
import { equipamento3d } from '../../src/render/adornos';

test('slots vazios não restauram arma e escudo padrão da classe', () => {
  const vazio = equipamento3d('guerreiro', {
    arma: null, secundaria: null, cabeca: null, corpo: null, capa: null,
    formaArma: null, elementoArma: null, formaMaxima: null,
    raridadeArma: null, raridadeSecundaria: null,
  }, () => true);
  expect(vazio?.arma.modelo).toBe('');
  expect(vazio?.secundaria).toBeNull();
  expect(equipamento3d('guerreiro', null, () => true)?.arma.modelo).not.toBe('');
});
