# Benchmarks

**Versão:** 0.2 · **Data:** 13/10/2026

> **Histórico**
> - **0.2 (13/10/2026)**: servidor de referência passa a ser a AWS Lightsail (D-038); amostras da primeira implantação.
> - **0.1 (13/10/2026)**: modelo do registro; nenhum benchmark executado ainda.

Registro exigido pela §5.6. Cada medição registra hardware, versões, cena, histogramas e resultado.
As metas da §5.6 são critérios a validar; nada aqui foi medido até o marco 7.

## Matriz de hardware

| Plataforma | Aparelho de referência | Aparelho real usado | SO / navegador | Resolução / DPR |
|---|---|---|---|---|
| Android | Galaxy A54, 8 GB, Chrome estável | — | — | — |
| iOS | iPhone 12, 4 GB, Safari estável | — | — | — |
| Desktop | 4 núcleos, 8 GB, GPU integrada, 1920×1080 | — | — | — |
| Servidor | 2 vCPU, 4 GB, uma sala | AWS Lightsail `arena-sao-paulo`, sa-east-1a (2 vCPU / 1 GB, amd64) | Ubuntu 24.04 / Node 24 (Docker) | — |

## Medições

| Data | Marco | Cena | Medida | Meta | Resultado | Observações |
|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — |
| 2026-10-13 | 5A | Arena Livre, 10 bots, 60 s, servidor local (Windows, mesmo PC do gerador de carga) | RTT p50/p95 · correção p95/p99 · banda média/máx | — · ≤ 0,25 · ≤ 100 KiB/s | 11/66 ms · 0/0,083 · 20,6/20,6 KiB/s | tick isolado p95 1,1 ms, p99 2,4 ms; com carga no mesmo PC, 8–30 ms (disputa de CPU) |
| 2026-10-13 | 5B (amostra) | Arena Livre, 2 clientes WSS, 10 s, AWS Lightsail São Paulo | RTT · rejeições · ressincronizações | — · 0 · 0 | ~20 ms · 0 · 0 | Amostra de validação do deploy, não é o teste de carga; lobby no navegador mostrou ping de 22 ms |
| 2026-10-13 | 5B (amostra) | `GET /saude` por HTTPS com conexão reutilizada | Mediana | — | AWS São Paulo 15,4 ms · Render Virgínia 176,9 ms | Uma conexão de origem; justificou D-038 |
