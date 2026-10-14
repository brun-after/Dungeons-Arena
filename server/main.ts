// Ponto de entrada do servidor da arena. Configuração só por variáveis de ambiente (§5.3, regra 10):
//   PORT    porta HTTP/WebSocket (padrão 2567)
//   REGIAO  região mostrada no lobby antes de entrar (§3.6, "Justiça")
//   DIR_DADOS  pasta dos relatórios do teste com pessoas (padrão ./dados; /dados no Docker)

import { iniciarServidor } from './servidor';
import { registrarLog } from './metricas';

const porta = Number(process.env.PORT ?? 2567);
const regiao = process.env.REGIAO ?? 'local';
const dirDados = process.env.DIR_DADOS ?? 'dados';

const { encerrar } = await iniciarServidor({ porta, regiao, dirDados });

for (const sinal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sinal, () => {
    registrarLog('servidor_encerrando', { sinal });
    void encerrar().finally(() => process.exit(0));
  });
}
