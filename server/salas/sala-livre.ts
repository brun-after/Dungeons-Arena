// Sala do Colyseus para a arena Livre (§3.6). A conexão é da base (sala-base.ts); aqui só a criação: a fase vem da
// opção `fase` ao criar (marco 7B) e precisa estar entre as permitidas pelo modo.

import { contextoDaArena, faseDeArena } from '../../src/arena/contexto-arena';
import { versaoDoConteudo } from '../../src/arena/protocolo';
import { SalaArena } from '../../src/arena/sala';
import { conteudoOficial, modoPorId } from '../../src/core/conteudo';
import { SalaColyseusBase, type MetadataDaSala } from './sala-base';

export { EXPIRACAO_SALA_VAZIA_MS } from './sala-base';

export class SalaLivreColyseus extends SalaColyseusBase {
  private fase = 'arena-01';

  protected criarSala(opcoes: unknown): SalaArena {
    const pedida = typeof opcoes === 'object' && opcoes !== null ? (opcoes as { fase?: unknown }).fase : undefined;
    this.fase = faseDeArena(modoPorId(conteudoOficial(), 'livre'), pedida);
    return new SalaArena(contextoDaArena('livre', this.fase), { semente: Math.floor(Math.random() * 2 ** 31), versaoConteudo: versaoDoConteudo() });
  }

  protected metadataPropria(): MetadataDaSala {
    return { tipo: 'arena', fase: this.fase };
  }
}
