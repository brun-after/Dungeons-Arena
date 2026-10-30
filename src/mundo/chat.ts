// O chat do Mundo (marco 30, 30/10/2026, D-129). Canais:
// - `local`: quem está a até `mundo.chat.raioLocal` células, na mesma sala;
// - `regiao`: todos da sala (a região, ou o canal dela);
// - `grupo`: os do grupo, em qualquer sala (o servidor entrega).
// O texto chega limpo (sem caracteres de controle, espaços juntos, no tamanho máximo); o cliente o mostra sempre
// como texto (nunca HTML). Cada sessão tem um limite de mensagens por janela. Silenciar é do cliente; a denúncia
// vai para o log do servidor. Puro.

/** Tira os caracteres de controle e as quebras, junta os espaços e corta no tamanho. Vazio = nada a mandar. */
export function limparTexto(texto: string, max: number): string {
  let limpo = '';
  for (const ch of texto) {
    const c = ch.codePointAt(0) ?? 0;
    // C0, DEL, C1, o espaço de largura zero e as marcas de direção (bidi), que bagunçam a linha de quem lê. O ZWJ e o
    // ZWNJ (200C/200D) ficam: compõem emojis e algumas escritas.
    const controle = c < 0x20 || (c >= 0x7f && c <= 0x9f) || c === 0x200b || c === 0x200e || c === 0x200f || (c >= 0x202a && c <= 0x202e) || (c >= 0x2066 && c <= 0x2069);
    limpo += controle ? ' ' : ch;
  }
  // Corta por grafema (o emoji composto não se parte ao meio).
  const grafemas = Array.from(new Intl.Segmenter().segment(limpo.replace(/\s+/g, ' ').trim()), (g) => g.segment);
  return grafemas.slice(0, max).join('');
}

/** Limite de mensagens por janela, por sessão (o relógio em ms vem de quem chama). */
export class LimiteDoChat {
  private readonly envios = new Map<string, number[]>();

  constructor(
    private readonly porJanela: number,
    private readonly janelaMs: number,
  ) {}

  permitir(chave: string, agora: number): boolean {
    const recentes = (this.envios.get(chave) ?? []).filter((t) => agora - t < this.janelaMs);
    if (recentes.length >= this.porJanela) {
      this.envios.set(chave, recentes);
      return false;
    }
    recentes.push(agora);
    this.envios.set(chave, recentes);
    return true;
  }

  esquecer(chave: string): void {
    this.envios.delete(chave);
  }
}
