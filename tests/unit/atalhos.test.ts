// 19/11/2026 (D-187): as teclas configuráveis — normalização, troca entre ações, reservadas e o interagir no EWAS.

import { describe, expect, it } from 'vitest';
import { acaoDaTecla, acaoDoAtalho, definirTecla, indiceDoAtalhoDaAcao, nomeCurtoDaTecla, normalizarCodigo, normalizarTeclas, TECLAS_PADRAO, teclaPermitida } from '../../src/input/atalhos';
import { letraInteragir, teclaDeInteragir } from '../../src/input/teclas';
import { normalizarPreferencias } from '../../src/plataforma/preferencias';

describe('teclas das ações (D-187)', () => {
  it('as padrão seguem as de antes', () => {
    expect(acaoDaTecla(TECLAS_PADRAO, 'ShiftRight')).toBe('movimento1');
    expect(acaoDaTecla(TECLAS_PADRAO, 'KeyV')).toBe('movimento2');
    expect(acaoDaTecla(TECLAS_PADRAO, 'KeyX')).toBe('movimento3');
    expect(acaoDaTecla(TECLAS_PADRAO, 'Numpad1')).toBe('habilidade1');
    expect(acaoDaTecla(TECLAS_PADRAO, 'Digit0')).toBe('consumivel4');
    expect(acaoDaTecla(TECLAS_PADRAO, 'Escape')).toBe('pausar');
    expect(acaoDaTecla(TECLAS_PADRAO, 'Space')).toBeNull();
  });

  it('os direcionais e o Tab não entram em ação nenhuma', () => {
    for (const c of ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'Tab']) expect(teclaPermitida(c)).toBe(false);
    expect(definirTecla(TECLAS_PADRAO, 'ultimate', 'KeyW').ultimate).toBe('KeyR');
    expect(normalizarTeclas({ ultimate: 'ArrowUp' }).ultimate).toBe('KeyR');
  });

  it('a tecla de outra ação troca com a desta', () => {
    const m = definirTecla(TECLAS_PADRAO, 'ultimate', 'KeyQ');
    expect(m.ultimate).toBe('KeyQ');
    expect(m.trocarAlvo).toBe('KeyR');
    const vazio = definirTecla(TECLAS_PADRAO, 'atacar', 'Space');
    const tomou = definirTecla(vazio, 'dispensar', 'Space');
    expect(tomou.dispensar).toBe('Space');
    expect(tomou.atacar).toBeNull();
  });

  it('sem tecla, menos o pausar; e o pausar não perde a sua para quem não tem tecla', () => {
    expect(definirTecla(TECLAS_PADRAO, 'mochila', null).mochila).toBeNull();
    expect(definirTecla(TECLAS_PADRAO, 'pausar', null).pausar).toBe('Escape');
    expect(definirTecla(TECLAS_PADRAO, 'atacar', 'Escape').pausar).toBe('Escape');
    expect(definirTecla(TECLAS_PADRAO, 'atacar', 'Escape').atacar).toBeNull();
  });

  it('normaliza o que vem salvo: lados, repetidas e o pausar', () => {
    expect(normalizarCodigo('ControlRight')).toBe('ControlLeft');
    expect(normalizarCodigo('Numpad7')).toBe('Digit7');
    const m = normalizarTeclas({ ultimate: 'KeyQ', trocarAlvo: 'KeyQ', pausar: null, atacar: null, mochila: 7 });
    expect(m.ultimate).toBe('KeyQ');
    expect(m.trocarAlvo).toBeNull();
    expect(m.pausar).toBe('Escape');
    expect(m.mochila).toBe('KeyI');
    expect(normalizarPreferencias({}).atalhos).toEqual(TECLAS_PADRAO);
  });

  it('as posições dos atalhos', () => {
    expect(indiceDoAtalhoDaAcao('habilidade6')).toBe(5);
    expect(indiceDoAtalhoDaAcao('consumivel1')).toBe(6);
    expect(acaoDoAtalho(9)).toBe('consumivel4');
    expect(acaoDoAtalho(10)).toBeNull();
    expect(indiceDoAtalhoDaAcao('mochila')).toBe(-1);
  });

  it('o interagir no E vai ao D quando o E anda (EWAS isométrico); trocado, mostra a tecla nova', () => {
    expect(teclaDeInteragir(TECLAS_PADRAO, 'ewas', true)).toBe('KeyD');
    expect(teclaDeInteragir(TECLAS_PADRAO, 'ewas', false)).toBe('KeyE');
    const g = definirTecla(TECLAS_PADRAO, 'interagir', 'KeyG');
    expect(letraInteragir('ewas', true, g)).toBe('G');
    expect(letraInteragir('wasd', true, definirTecla(TECLAS_PADRAO, 'interagir', null))).toBe('');
  });

  it('nomes curtos', () => {
    expect(nomeCurtoDaTecla('ShiftRight')).toBe('Shift');
    expect(nomeCurtoDaTecla('KeyX')).toBe('X');
    expect(nomeCurtoDaTecla('Digit3')).toBe('3');
    expect(nomeCurtoDaTecla('ControlLeft')).toBe('Ctrl');
    expect(nomeCurtoDaTecla('F4')).toBe('F4');
  });
});
