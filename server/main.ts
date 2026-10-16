// Ponto de entrada do servidor da arena. Configuração só por variáveis de ambiente (§5.3, regra 10):
//   PORT    porta HTTP/WebSocket (padrão 2567)
//   REGIAO  região mostrada no lobby antes de entrar (§3.6, "Justiça")
//   DIR_DADOS  pasta dos relatórios do teste com pessoas (padrão ./dados; /dados no Docker)
//   MAX_SALAS  salas por processo (padrão 6; marco 16, D-062)
//   CRIACOES_POR_MINUTO  salas que uma origem pode criar por minuto (padrão 6)
//   CHAVE_CERTIFICADO  chave do certificado do personagem (marco 17; segredo do GitHub, nunca no repositório)

import { iniciarServidor } from './servidor';
import { registrarLog } from './metricas';

const porta = Number(process.env.PORT ?? 2567);
const regiao = process.env.REGIAO ?? 'local';
const dirDados = process.env.DIR_DADOS ?? 'dados';

const numero = (v: string | undefined, padrao: number) => (v && Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : padrao);
const { encerrar } = await iniciarServidor({
  porta,
  regiao,
  dirDados,
  maxSalas: numero(process.env.MAX_SALAS, 6),
  criacoesPorMinuto: numero(process.env.CRIACOES_POR_MINUTO, 6),
  chaveCertificado: process.env.CHAVE_CERTIFICADO,
});

for (const sinal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sinal, () => {
    registrarLog('servidor_encerrando', { sinal });
    void encerrar().finally(() => process.exit(0));
  });
}
