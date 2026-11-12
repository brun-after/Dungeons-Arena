# Balanceamento

**Versão:** 1.4 · **Data:** 12/11/2026

> Gerado por `npm run balancear -- --registrar` (tools/balanceamento, D-061). As metas ficam em
> `src/data/balance.json → metas`; o teste `tests/sim/ritmo.test.ts` protege as principais. Os números que mudaram
> e o antes e depois das calibragens estão em docs/DECISOES.md (D-061, D-071, D-074, D-075, D-076 e D-078).

Sementes: 8 por cenário (1000, 8919, 16838, 24757, 32676, 40595, 48514, 56433). Balance versão 39.

## Resultado: 147/147 metas aprovadas


## Tabelas

### Inimigo comum do mesmo nível, lutas em sequência (mediana)

| Classe | Nível | Golpes | Tempo | Derrotas do jogador |
|---|---|---|---|---|
| aventureiro | 1 | 4 | 5,8 s | 0 |
| aventureiro | 5 | 5 | 5,1 s | 0 |
| aventureiro | 10 | 5 | 6,6 s | 0 |
| guerreiro | 1 | 5 | 5,3 s | 0 |
| guerreiro | 5 | 4 | 4,5 s | 0 |
| guerreiro | 10 | 4 | 4,5 s | 0 |
| mago | 1 | 4 | 5,1 s | 0 |
| mago | 5 | 4 | 5,2 s | 0 |
| mago | 10 | 3 | 4,5 s | 0 |
| arqueiro | 1 | 5 | 5 s | 0 |
| arqueiro | 5 | 4 | 4,4 s | 0 |
| arqueiro | 10 | 4 | 4 s | 0 |
| necromante | 1 | 4 | 5,4 s | 0 |
| necromante | 5 | 4 | 4,7 s | 0 |
| necromante | 10 | 5 | 5,4 s | 0 |

### Quanto o jogador aguenta de um comum (mediana)

| Classe | Nível | Golpes recebidos | Tempo |
|---|---|---|---|
| aventureiro | 1 | 8 | 22,4 s |
| aventureiro | 5 | 8 | 20,8 s |
| aventureiro | 10 | 8 | 19 s |
| guerreiro | 1 | 8 | 18,2 s |
| guerreiro | 5 | 8 | 16,9 s |
| guerreiro | 10 | 8 | 15,5 s |
| mago | 1 | 7 | 18,2 s |
| mago | 5 | 8 | 16,9 s |
| mago | 10 | 8 | 15,5 s |
| arqueiro | 1 | 8 | 19,2 s |
| arqueiro | 5 | 8 | 16,9 s |
| arqueiro | 10 | 8 | 15,5 s |
| necromante | 1 | 8 | 18,2 s |
| necromante | 5 | 8 | 16,9 s |
| necromante | 10 | 8 | 15,5 s |

### Chefe (nível 1, como na fase 1; jogadores no nível 2; grupo com classes misturadas)

| Classe | Grupo | Tempo | Derrotas do grupo |
|---|---|---|---|
| aventureiro | 1 | 29,7 s | 0 |
| aventureiro | 2 | 29,5 s | 0 |
| aventureiro | 4 | 26,6 s | 0 |
| aventureiro | 6 | 25,3 s | 0 |
| guerreiro | 1 | 33,5 s | 0 |
| guerreiro | 2 | 30,5 s | 0 |
| guerreiro | 4 | 24,2 s | 0 |
| guerreiro | 6 | 21,9 s | 0 |
| mago | 1 | 36,7 s | 0 |
| mago | 2 | 24,6 s | 0 |
| mago | 4 | 26 s | 0 |
| mago | 6 | 25,3 s | 0 |
| arqueiro | 1 | 31,4 s | 0 |
| arqueiro | 2 | 25,6 s | 0 |
| arqueiro | 4 | 24,5 s | 0 |
| arqueiro | 6 | 23,2 s | 0 |
| necromante | 1 | 36,3 s | 0 |
| necromante | 2 | 26,7 s | 0 |
| necromante | 4 | 25,3 s | 0 |
| necromante | 6 | 23 s | 0 |

### Dificuldades (aventureiro; comum no nível 5, chefe sozinho)

| Dificuldade | Tempo no comum | Golpes que aguenta | Chefe (vitórias) | Derrotas no chefe |
|---|---|---|---|---|
| facil | 4,6 s | 12 | 26,3 s | 0/4 |
| normal | 5,6 s | 8 | 35,3 s | 0/4 |
| dificil | 6,7 s | 7 | 36,9 s | 2/4 |
| pesadelo | 9,6 s | 6 | — | 4/4 |

### PvP no Livre (nível 10, com o clamp do modo)

| Classe | Tempo para cair |
|---|---|
| aventureiro | 7,5 s |
| guerreiro | 8,4 s |
| mago | 6,9 s |
| arqueiro | 6,8 s |
| necromante | 6,5 s |

### Aviso útil das habilidades inimigas (p95 aproximado da rede)

| Habilidade | Quem usa | Conjuração | Suportado (150 ms) | Degradado (250 ms) |
|---|---|---|---|---|
| salto_do_duende | duende_saltador | 550 ms | 273 ms | 73 ms |
| golpe | goblin, troll, lobo, peregrino, sombra, sentinela, servo_ossuario, falcao_companheiro, esqueleto_profano, espectro, copia_ilusoria, falcao_espectral, duende_saltador, runista_medroso | 600 ms | 323 ms | 123 ms |
| golpe_pesado | orc, cavaleiro_da_morte, rei_goblin, cavaleiro_profano | 600 ms | 323 ms | 123 ms |
| golpe_viscoso | slime | 600 ms | 323 ms | 123 ms |
| golpe_atordoante | cavaleiro_profano | 600 ms | 323 ms | 123 ms |
| raio_vampirico | vampiro, bruxa_do_pantano, necromante_ancestral, espectro_tempestade | 504 ms | 352 ms | 152 ms |
| teia | aranha | 504 ms | 370 ms | 170 ms |
| golpe_demoniaco | boss, dragao_das_ruinas, dragao_fogo, dragao_gelo, dragao_raio, dragao_veneno | 700 ms | 423 ms | 223 ms |
| seta_arcana | piromante_profano | 600 ms | 423 ms | 223 ms |
| lanca_de_gelo | dragao_gelo, arcanista_glacial | 750 ms | 473 ms | 273 ms |
| flecha | esqueleto, flecha_ancora, esqueleto_do_ossuario, arcanista_glacial | 700 ms | 548 ms | 348 ms |
| pedra_arremessada | arremessador | 750 ms | 616 ms | 416 ms |
| raio_em_cadeia | dragao_raio, necromante_ancestral, espectro_tempestade | 875 ms | 661 ms | 461 ms |
| bola_de_fogo | dragao_fogo, piromante_profano | 1000 ms | 723 ms | 523 ms |
| marca_de_area | cultista, boss, rei_goblin, bruxa_do_pantano, dragao_das_ruinas, dragao_fogo, dragao_gelo, dragao_raio, dragao_veneno, necromante_ancestral, piromante_profano | 1200 ms | 923 ms | 723 ms |

### Builds na arena (ficha inteira, nível 8)

| Classe | Focada vence a dispersa | Equipado (raro) vence o sem equipamento |
|---|---|---|
| aventureiro | 42,2% | 90,6% |
| guerreiro | 70,3% | 100% |
| mago | 50% | 92,2% |
| arqueiro | 63,3% | 96,9% |
| necromante | 43% | 100% |

### Economia (nível 5, comuns em sequência)

| Classe | XP por minuto | Ouro por minuto (estimado) |
|---|---|---|
| aventureiro | 183,2 | 109,9 |
| guerreiro | 251,6 | 151 |
| mago | 137,1 | 82,2 |
| arqueiro | 206,7 | 124 |
| necromante | 172,5 | 103,5 |
| invocação | 27,3% do dano | — |

### Faixa avançada (equipamento raro, Normal, duas sementes; informativo)

| Classe | Nível | Build | Tempo no comum (s) | Vitórias |
|---|---|---|---|---|
| aventureiro | 20 | focada | 8,4 | 12/12 |
| aventureiro | 20 | dispersa | 5,8 | 12/12 |
| aventureiro | 25 | focada | 8,1 | 12/12 |
| aventureiro | 25 | dispersa | 5,9 | 12/12 |
| aventureiro | 30 | focada | 8,4 | 12/12 |
| aventureiro | 30 | dispersa | 4,4 | 12/12 |
| guerreiro | 20 | focada | 4,2 | 12/12 |
| guerreiro | 20 | dispersa | 3,3 | 12/12 |
| guerreiro | 25 | focada | 3,1 | 12/12 |
| guerreiro | 25 | dispersa | 3 | 12/12 |
| guerreiro | 30 | focada | 3,5 | 12/12 |
| guerreiro | 30 | dispersa | 1,9 | 12/12 |
| mago | 20 | focada | 4,6 | 12/12 |
| mago | 20 | dispersa | 3,7 | 12/12 |
| mago | 25 | focada | 5,4 | 12/12 |
| mago | 25 | dispersa | 4,7 | 12/12 |
| mago | 30 | focada | 6 | 12/12 |
| mago | 30 | dispersa | 4 | 12/12 |
| arqueiro | 20 | focada | 3,9 | 12/12 |
| arqueiro | 20 | dispersa | 3,1 | 12/12 |
| arqueiro | 25 | focada | 5,2 | 12/12 |
| arqueiro | 25 | dispersa | 2,8 | 12/12 |
| arqueiro | 30 | focada | 4 | 12/12 |
| arqueiro | 30 | dispersa | 2 | 12/12 |
| necromante | 20 | focada | 6,9 | 12/12 |
| necromante | 20 | dispersa | 6,1 | 12/12 |
| necromante | 25 | focada | 7,3 | 12/12 |
| necromante | 25 | dispersa | 6,5 | 12/12 |
| necromante | 30 | focada | 6,8 | 12/12 |
| necromante | 30 | dispersa | 5,7 | 12/12 |

### XP por minuto na faixa avançada (build focada, equipamento raro)

| Classe | Nível | Fácil | Normal | Difícil | Pesadelo |
|---|---|---|---|---|---|
| aventureiro | 20 | 22,8 | 46,8 | 138,9 | 462,2 |
| aventureiro | 25 | 30,3 | 64,7 | 147,8 | 517,8 |
| aventureiro | 30 | 38,4 | 76,8 | 181,5 | 632,1 |
| guerreiro | 20 | 101,7 | 71,5 | 177 | 507,8 |
| guerreiro | 25 | 142,4 | 111,8 | 215,4 | 468,5 |
| guerreiro | 30 | 200 | 157,4 | 208 | 607,5 |
| mago | 20 | 24,5 | 42,2 | 134,7 | 442,1 |
| mago | 25 | 34,4 | 53,6 | 164,6 | 550,6 |
| mago | 30 | 48,6 | 59,4 | 209,3 | 694,6 |
| arqueiro | 20 | 30,1 | 83,6 | 188,8 | 613,6 |
| arqueiro | 25 | 36,8 | 111,1 | 201,9 | 630,5 |
| arqueiro | 30 | 55 | 135,9 | 303 | 766,3 |
| necromante | 20 | 23,6 | 42,5 | 116,7 | 391,8 |
| necromante | 25 | 29 | 55,9 | 139,4 | 473,3 |
| necromante | 30 | 38,4 | 68 | 148,4 | 466,5 |

### Níveis altos (equipamento raro do nível, Normal, duas sementes)

| Classe | Nível | Vitórias | Tempo no comum (s) |
|---|---|---|---|
| aventureiro | 50 | 100% | 9,3 |
| aventureiro | 75 | 100% | 5,1 |
| aventureiro | 100 | 100% | 4,9 |
| guerreiro | 50 | 100% | 2,3 |
| guerreiro | 75 | 100% | 3 |
| guerreiro | 100 | 100% | 2,4 |
| mago | 50 | 100% | 4,3 |
| mago | 75 | 100% | 5,7 |
| mago | 100 | 100% | 3,2 |
| arqueiro | 50 | 100% | 3,4 |
| arqueiro | 75 | 100% | 2,4 |
| arqueiro | 100 | 100% | 2,2 |
| necromante | 50 | 100% | 6,4 |
| necromante | 75 | 100% | 6,8 |
| necromante | 100 | 100% | 7,4 |

### Ritmo até o 100 (só combate, mediana das classes)

| Trecho | Minutos de combate |
|---|---|
| 1 › 30 | 515,7 |
| 30 › 100 | 6244,7 |

### Mundo: regiões (meio da faixa, equipamento incomum; informativo além das vitórias)

| Região | Nível | Vitórias | XP por hora de combate | Min de combate por nível |
|---|---|---|---|---|
| vila_do_centro | 3 | 100% | 10615 | 0,6 |
| campos_do_oeste | 4 | 100% | 11561 | 0,8 |
| encosta_do_leste | 7 | 100% | 18079 | 1,3 |
| floresta_antiga | 7 | 100% | 14809 | 1,6 |
| ruinas_do_norte | 23 | 98,3% | 3661 | 37,7 |
| pico_gelado | 13 | 100% | 30288 | 2,6 |
| pantano_sombrio | 15 | 100% | 22876 | 3,9 |
| bosque_do_sul | 8 | 100% | 13401 | 2,3 |
| colinas_do_sudeste | 11 | 100% | 20240 | 3,3 |

### Mundo: covis de boss (no nível do covil; grupo de 3 com classes misturadas)

| Covil | Boss | Nível | Sozinho | Em grupo | Vitórias do grupo |
|---|---|---|---|---|---|
| minas_do_rei_goblin | rei_goblin | 12 | 42,5 s | 35,6 s | 100% |
| cabana_da_bruxa | bruxa_do_pantano | 18 | 36,1 s | 30,4 s | 100% |
| ninho_do_dragao | dragao_das_ruinas | 28 | 38,8 s | 36 s | 100% |

### Ouro por minuto e custo do primeiro tomo (sem desconto; só ouro direto, sem venda de loot)

| Classe | Nível | Fácil | Normal | Difícil | Pesadelo | Tomo no Normal (min) | Tomo no Pesadelo (min) |
|---|---|---|---|---|---|---|---|
| aventureiro | 20 | 236,7 | 322 | 239,5 | 264,8 | 31,1 | 37,8 |
| aventureiro | 25 | 322,9 | 374,5 | 358,7 | 315 | 26,7 | 31,7 |
| aventureiro | 30 | 352,1 | 423,2 | 411,9 | 353,2 | 23,6 | 28,3 |
| guerreiro | 20 | 1454,2 | 447 | 368,5 | 210,5 | 22,4 | 47,5 |
| guerreiro | 25 | 1759,3 | 643,5 | 510,1 | 214,9 | 15,5 | 46,5 |
| guerreiro | 30 | 2189,5 | 996,9 | 444,1 | 274,2 | 10 | 36,5 |
| mago | 20 | 289,6 | 300,9 | 305,2 | 245 | 33,2 | 40,8 |
| mago | 25 | 350,9 | 331,1 | 406,6 | 277,2 | 30,2 | 36,1 |
| mago | 30 | 437,5 | 432,5 | 481 | 395,2 | 23,1 | 25,3 |
| arqueiro | 20 | 348,6 | 501,4 | 412,2 | 358 | 19,9 | 27,9 |
| arqueiro | 25 | 373,4 | 653,3 | 441,8 | 351 | 15,3 | 28,5 |
| arqueiro | 30 | 521,3 | 721,4 | 657,7 | 462,7 | 13,9 | 21,6 |
| necromante | 20 | 342,3 | 307,8 | 245,4 | 258,8 | 32,5 | 38,6 |
| necromante | 25 | 294,3 | 375,9 | 324,1 | 331 | 26,6 | 30,2 |
| necromante | 30 | 381,8 | 451,3 | 322,1 | 277,6 | 22,2 | 36 |

