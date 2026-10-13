// Contexto da arena oficial (fase arena-01, modo Livre), compartilhado pelo servidor, pela tela de
// loopback e pelos testes: os dois lados precisam simular com o mesmo conteúdo (§3.6, versão/hash).

import { conteudoOficial, modoPorId } from '../core/conteudo';
import { BALANCE_PADRAO, type ContextoSimulacao } from '../core/contexto';
import arena01 from '../data/fases/arena-01.json';
import { carregarFase } from '../world/fase';
import { validarFase } from '../world/validacao-fase';

export function contextoDaArena(modoId = 'livre'): ContextoSimulacao {
  const conteudo = conteudoOficial();
  const r = validarFase(arena01, new Set(conteudo.presets.keys()));
  if (!r.ok) throw new Error(`fase de arena inválida: ${r.erros.map((e) => e.mensagem).join('; ')}`);
  return { fase: carregarFase(r.fase), balance: BALANCE_PADRAO, conteudo, modo: modoPorId(conteudo, modoId) };
}
