# Benchmarks

**Versão:** 0.5 · **Data:** 15/10/2026

> **Histórico**
> - **0.5 (15/10/2026)**: marco 16 (D-062): benchmarks do cliente (`?bench=carga`, `?bench=padrao` e as trocas de fase, `npm run bench`), carga com a série do `/metricas` e a carga do grupo (campanha cooperativa, 6 bots). Ressalva: o WebGL do Chromium sem tela é por software (pior caso de CPU, não um aparelho).
> - **0.4 (14/10/2026)**: marco 7B, cena padrão arena-02 nos perfis suportado e degradado sobre WSS (proxy local, D-045).
> - **0.3 (13/10/2026)**: carga com 10 clientes contra a VM AWS (marco 5).
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
| 2026-10-13 | 5 | Arena Livre, 10 bots, 60 s, wss://dungeons-bruno.duckdns.org (AWS Lightsail São Paulo, 2 vCPU / 1 GB); carga gerada de um PC doméstico | RTT p50/p95 · correção p95/p99 · banda média/máx | — / — · ≤ 0,25 · ≤ 100 KiB/s | 15/18 ms · 0/0,125 · 21,4/21,5 KiB/s | rejeições 0, ressinc. 0; tick p95 do servidor ainda não coletado (log `metricas` da VM) |
| 2026-10-14 | 7 | arena-02, 10 bots, 300 s, ws://localhost:2567, perfil suportado | RTT p50/p95 · correção p95/p99 · teleportes · banda rec./env. máx · tick p95/p99 · reconexão | — · ≤ 0,25/≤ 1 · — · ≤ 100/≤ 10 KiB/s · ≤ 8/≤ 16,7 ms · ≤ 5 s | 187/251 ms · 0/0,125 · 15 · 30,7/1,4 KiB/s · 3,632/4,357 ms · 0,4 s | metas 8/8; rejeições 0; ressinc. 0; aviso útil p5 (ms): golpe 240, raio 653, marca_de_area 929, flecha 857 |
| 2026-10-14 | 7 | arena-02, 10 bots, 300 s, ws://localhost:2567, perfil degradado | RTT p50/p95 · correção p95/p99 · teleportes · banda rec./env. máx · tick p95/p99 · reconexão | — · ≤ 0,25/≤ 1 · — · ≤ 100/≤ 10 KiB/s · ≤ 8/≤ 16,7 ms · ≤ 5 s | 432/540 ms · 0/0,292 · 12 · 31,5/1,4 KiB/s · 2,073/3,006 ms · 0,5 s | metas 5/5; rejeições 0; ressinc. 0; aviso útil p5 (ms): golpe -45, marca_de_area 616, raio 382, flecha 583 |
| 2026-10-15 | 16 | arena-02, 10 bots, 300 s, ws://localhost:2567, perfil suportado | RTT p50/p95 · correção p95/p99 · teleportes · banda rec./env. máx · tick p95/p99 · reconexão | — · ≤ 0,25/≤ 1 · — · ≤ 100/≤ 10 KiB/s · ≤ 8/≤ 16,7 ms · ≤ 5 s | 213/275 ms · 0/0,168 · 16 · 33,8/1,4 KiB/s · 1,501/2,015 ms · 0,4 s | metas 10/10; rejeições 0; ressinc. 0; aviso útil p5 (ms): golpe 329, teia 736, armar_teia 530, marca_de_area 943, flecha 852, golpe_viscoso 334, golpe_pesado 333; memória 153,7→185,5 MB (máx. 198,8, tendência 0,82 MB/min), tick p95 máx. na série 1,972 ms, agendador p95 máx. 17,84 ms |
| 2026-10-15 | 16 | campanha em grupo (fase-01), 6 bots, 300 s, ws://localhost:2567, perfil suportado | RTT p50/p95 · correção p95/p99 · teleportes · banda rec./env. máx · tick p95/p99 · reconexão | — · ≤ 0,25/≤ 1 · — · ≤ 100/≤ 10 KiB/s · ≤ 8/≤ 16,7 ms · ≤ 5 s | 232/324 ms · 0/0,125 · 15 · 21,2/1,4 KiB/s · 1,068/1,304 ms · 0,4 s | metas 10/10; rejeições 0; ressinc. 0; aviso útil p5 (ms): golpe 335, marca_de_area 943, golpe_pesado 370, golpe_demoniaco 442, flecha 892; memória 185,5→189,3 MB (máx. 189,6, tendência 0,08 MB/min), tick p95 máx. na série 1,686 ms, agendador p95 máx. 17,3 ms |
| 2026-10-15 | 16 | `?bench=carga`, qualidade baixo, 30 s, Chromium sem tela 1280×720 @1 (WebGL por software) | fps · p50/p95/p99 · pausas > 100 ms · heap | 60 fps · p95 ≤ 16,7 ms · 0 | 19,32 · 51,5/65,2/74,1 ms · 0 · 48,07→48,07 MB | pico: 60 NPCs, 20 invocações, 10 avatares, 32 armadilhas, 96 projéteis; mede o pior caso de CPU, não o aparelho |
| 2026-10-15 | 16 | `?bench=carga`, qualidade alto, 30 s, Chromium sem tela 1280×720 @1 (WebGL por software) | fps · p50/p95/p99 · pausas > 100 ms · heap | 60 fps · p95 ≤ 16,7 ms · 0 | 17,08 · 57,6/69/76,1 ms · 0 · 64,85→64,85 MB | pico: 60 NPCs, 20 invocações, 10 avatares, 32 armadilhas, 98 projéteis; mede o pior caso de CPU, não o aparelho |
| 2026-10-15 | 16 | `?bench=padrao`, qualidade baixo, 30 s, Chromium sem tela 1280×720 @1 (WebGL por software) | fps · p50/p95/p99 · pausas > 100 ms · heap | 60 fps · p95 ≤ 16,7 ms · 0 | 20,52 · 50,4/57,7/62,8 ms · 0 · 18,41→18,41 MB | pico: 20 NPCs, 11 invocações, 5 avatares, 1 armadilhas, 12 projéteis; mede o pior caso de CPU, não o aparelho |
| 2026-10-15 | 16 | `?bench=padrao`, qualidade alto, 30 s, Chromium sem tela 1280×720 @1 (WebGL por software) | fps · p50/p95/p99 · pausas > 100 ms · heap | 60 fps · p95 ≤ 16,7 ms · 0 | 18,34 · 56/63,9/70,1 ms · 0 · 20,69→20,69 MB | pico: 20 NPCs, 11 invocações, 5 avatares, 1 armadilhas, 12 projéteis; mede o pior caso de CPU, não o aparelho |
| 2026-10-15 | 16 | `?bench=trocas`: 30 trocas de fase no mesmo documento (desmontar e montar a cena) | heap depois do GC | estabiliza: sem crescimento monotônico, último terço ≤ terço do meio +5% | base 13,01 MB, meio 16,97 MB, último terço 17,45 MB, final 16,93 MB | aprovado (2,8%); as primeiras trocas enchem caches limitados |
