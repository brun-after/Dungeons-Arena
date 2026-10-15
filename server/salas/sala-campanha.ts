// Sala do Colyseus para a campanha cooperativa (marco 15, 15/10/2026, D-061). A conexão é da base (sala-base.ts);
// a sala do núcleo é a SalaCampanha, criada na fase e na dificuldade do anfitrião. Opções vêm do cliente e não são
// confiáveis: a referência da fase é lida como a do save (oficial ou gerada, com parâmetros nos limites) e a
// aventura do editor é recusada.

import { versaoDoConteudo } from '../../src/arena/protocolo';
import { criarSalaCampanha, type SalaCampanha } from '../../src/coop/sala-campanha';
import { conteudoOficial } from '../../src/core/conteudo';
import { ehObjeto } from '../../src/core/validar';
import { ehDificuldade } from '../../src/modos/dificuldade';
import { chaveDaFase, lerRefFase } from '../../src/save/esquema';
import { FASE_INICIAL } from '../../src/save/fases-campanha';
import { registrarLog } from '../metricas';
import { SalaColyseusBase, type MetadataDaSala } from './sala-base';

export class SalaCampanhaColyseus extends SalaColyseusBase {
  private campanha!: SalaCampanha;
  private faseNaMetadata = '';

  protected criarSala(opcoes: unknown): SalaCampanha {
    const o = ehObjeto(opcoes) ? opcoes : {};
    const faseRef = lerRefFase(o.faseRef) ?? FASE_INICIAL;
    const r = criarSalaCampanha(conteudoOficial(), {
      semente: Math.floor(Math.random() * 2 ** 31),
      faseRef,
      dificuldade: ehDificuldade(o.dificuldade) ? o.dificuldade : 'normal',
      versaoConteudo: versaoDoConteudo(),
    });
    if (!r.ok) throw new Error(r.erro);
    this.campanha = r.sala;
    this.faseNaMetadata = chaveDaFase(faseRef);
    // A fase muda quando o grupo sai: a metadata (e o `/salas/:codigo`) acompanha.
    this.clock.setInterval(() => {
      const atual = chaveDaFase(this.campanha.faseRef);
      if (atual === this.faseNaMetadata) return;
      this.faseNaMetadata = atual;
      registrarLog('fase_nova', { sala: this.roomId, fase: atual });
      void this.atualizarMetadata();
    }, 1000);
    return r.sala;
  }

  protected metadataPropria(): MetadataDaSala {
    return { tipo: 'campanha', fase: chaveDaFase(this.campanha.faseRef), faseRef: this.campanha.faseRef };
  }
}
