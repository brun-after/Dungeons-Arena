// Liga uma sala autoritativa à ponta de servidor de um transporte (loopback ou, no marco 5, rede).

import type { SalaArena } from '../arena/sala';
import type { Transporte } from './transporte';

export function ligarSala(sala: SalaArena, transporte: Transporte): () => void {
  const conexao = sala.conectar((texto) => {
    transporte.enviar(texto);
  });
  transporte.aoReceber((texto) => {
    conexao.receber(texto);
  });
  return () => {
    conexao.fechar();
    transporte.fechar();
  };
}
