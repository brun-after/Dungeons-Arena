// Sala do Colyseus para a arena Livre (§3.6). A conexão é da base (sala-base.ts); aqui só a criação: a fase vem da
// opção `fase` ao criar (marco 7B) e precisa estar entre as permitidas pelo modo. Marco 17 (D-063): a faixa de nível
// vem da opção `faixa` (sem ela, sala aberta), e a sala confere e emite os certificados do personagem.

import { contextoDaArena, faseDeArena } from '../../src/arena/contexto-arena';
import { versaoDoConteudo } from '../../src/arena/protocolo';
import { SalaArena } from '../../src/arena/sala';
import { conteudoOficial, modoPorId } from '../../src/core/conteudo';
import { faixaPorId } from '../../src/modos/regras';
import { SalaColyseusBase, type MetadataDaSala } from './sala-base';

/** Sala sem faixa: entra qualquer nível. */
export const FAIXA_ABERTA = 'aberta';

export { EXPIRACAO_SALA_VAZIA_MS } from './sala-base';

export class SalaLivreColyseus extends SalaColyseusBase {
  private fase = 'arena-01';
  private faixa: string = FAIXA_ABERTA;

  protected criarSala(opcoes: unknown): SalaArena {
    const o = typeof opcoes === 'object' && opcoes !== null ? (opcoes as { fase?: unknown; faixa?: unknown }) : {};
    const modo = modoPorId(conteudoOficial(), 'livre');
    this.fase = faseDeArena(modo, o.fase);
    const faixa = faixaPorId(modo, o.faixa);
    this.faixa = faixa?.id ?? FAIXA_ABERTA;
    return new SalaArena(contextoDaArena('livre', this.fase), {
      semente: Math.floor(Math.random() * 2 ** 31),
      versaoConteudo: versaoDoConteudo(),
      faixa,
      certificacao: SalaColyseusBase.limites?.certificador?.paraSala(),
    });
  }

  protected metadataPropria(): MetadataDaSala {
    return { tipo: 'arena', fase: this.fase, faixa: this.faixa };
  }
}
