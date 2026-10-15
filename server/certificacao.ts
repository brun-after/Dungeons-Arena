// Certificação do personagem no servidor (marco 17, 15/10/2026, D-063). Só aqui existe a chave (`CHAVE_CERTIFICADO`,
// segredo do GitHub levado ao `.env` da VM pelo deploy): o cliente guarda e reapresenta o certificado, mas não
// consegue fabricar um. Sem a variável (desenvolvimento local e testes), a chave é sorteada na partida do processo:
// os certificados valem até o servidor reiniciar.

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { conferirPersonagem, pedidoDoPersonagem, type PedidoDePersonagem } from '../src/coop/personagem';
import type { ContextoSimulacao } from '../src/core/contexto';
import { ehObjeto } from '../src/core/validar';
import { avaliarCrescimento, conteudoAssinado, lerCertificado, mesmoPersonagem, minutosEntre, type Certificado, type MotivoCertificado } from '../src/integridade/certificado';
import { precoDeVenda } from '../src/progression/itens';

export type ResultadoCertificacao = { ok: true; certificado: Certificado } | { ok: false; motivo: MotivoCertificado };

export class Certificador {
  private readonly chave: Buffer;

  constructor(chave: string | undefined) {
    this.chave = chave && chave.length >= 16 ? Buffer.from(chave, 'utf8') : randomBytes(32);
  }

  /** A chave veio da configuração (e não sorteada na partida)? */
  static configurada(chave: string | undefined): boolean {
    return !!chave && chave.length >= 16;
  }

  private hmac(texto: string): string {
    return createHmac('sha256', this.chave).update(texto).digest('hex');
  }

  assinar(retrato: PedidoDePersonagem, agora: number): Certificado {
    return { retrato, emitidoEm: agora, assinatura: this.hmac(conteudoAssinado(retrato, agora)) };
  }

  /** O certificado foi assinado por esta chave? (comparação em tempo constante) */
  valido(c: Certificado | null): c is Certificado {
    if (!c) return false;
    const esperado = Buffer.from(this.hmac(conteudoAssinado(c.retrato, c.emitidoEm)), 'hex');
    const recebido = Buffer.from(c.assinatura, 'hex');
    return esperado.length === recebido.length && timingSafeEqual(esperado, recebido);
  }

  /** O personagem enviado é exatamente o do certificado válido? (a arena só aceita a ficha inteira assim) */
  confere(personagem: unknown, certificadoBruto: unknown): boolean {
    const c = lerCertificado(certificadoBruto);
    return this.valido(c) && mesmoPersonagem(personagem, c.retrato);
  }

  /**
   * Certifica o personagem: a ficha precisa fechar (sem cortes); com um certificado anterior válido do mesmo
   * personagem, o crescimento cabe no tempo desde ele; sem anterior, só até `nivelSemHistorico`.
   */
  certificar(personagemBruto: unknown, anteriorBruto: unknown, ctx: ContextoSimulacao, agora: number): ResultadoCertificacao {
    const conferido = conferirPersonagem(personagemBruto, ctx, 'certificacao', 'certificacao');
    if (!conferido || conferido.alteracoes.length > 0) return { ok: false, motivo: 'ficha_invalida' };
    const retrato = ehObjeto(personagemBruto) ? pedidoDoPersonagem(conferido.entidade) : null;
    if (!retrato) return { ok: false, motivo: 'ficha_invalida' };
    if (!retrato.bolsa.personagemId) return { ok: false, motivo: 'sem_id' };
    // O retrato assinado é o do pedido (com os invIds do cliente): é o que ele guarda e reapresenta.
    const doCliente = personagemBruto as PedidoDePersonagem;
    const anterior = lerCertificado(anteriorBruto);
    if (this.valido(anterior)) {
      const valorDeVenda = (itemId: string) => {
        const item = ctx.conteudo.itens.get(itemId);
        return item ? precoDeVenda(item, ctx.balance.economia.vendaPct) : 0;
      };
      const r = avaliarCrescimento(anterior.retrato, retrato, minutosEntre(anterior.emitidoEm, agora, ctx.balance), ctx.balance, valorDeVenda);
      if (!r.ok) return r;
    } else if (retrato.nivel > ctx.balance.integridade.nivelSemHistorico) {
      return { ok: false, motivo: 'sem_historico' };
    }
    return { ok: true, certificado: this.assinar(doCliente, agora) };
  }
}
