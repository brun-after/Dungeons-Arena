# Balanceamento

**Versão:** 1.4 · **Data:** 12/11/2026

> Gerado por `npm run balancear -- --registrar` (tools/balanceamento, D-061). As metas ficam em
> `src/data/balance.json → metas`; o teste `tests/sim/ritmo.test.ts` protege as principais. Os números que mudaram
> e o antes e depois das calibragens estão em docs/DECISOES.md (D-061, D-071, D-074, D-075, D-076 e D-078).

Sementes: 8 por cenário (1000, 8919, 16838, 24757, 32676, 40595, 48514, 56433). Balance versão 39.

## Resultado: 172/172 metas aprovadas


## Tabelas

### Inimigo comum do mesmo nível, lutas em sequência (mediana)

| Classe | Nível | Golpes | Tempo | Derrotas do jogador |
|---|---|---|---|---|
| aventureiro | 1 | 4 | 5,2 s | 0 |
| aventureiro | 5 | 4 | 5,2 s | 0 |
| aventureiro | 10 | 5 | 5,1 s | 0 |
| guerreiro | 1 | 5 | 5,5 s | 0 |
| guerreiro | 5 | 4 | 4,3 s | 0 |
| guerreiro | 10 | 4 | 4,2 s | 0 |
| mago | 1 | 4 | 5 s | 0 |
| mago | 5 | 4 | 5,2 s | 0 |
| mago | 10 | 3 | 5 s | 0 |
| arqueiro | 1 | 5 | 5,1 s | 0 |
| arqueiro | 5 | 4 | 4,4 s | 0 |
| arqueiro | 10 | 4 | 4 s | 0 |
| necromante | 1 | 4 | 4,5 s | 0 |
| necromante | 5 | 4 | 4,7 s | 0 |
| necromante | 10 | 4 | 5,1 s | 0 |

### Quanto o jogador aguenta de um comum (mediana)

| Classe | Nível | Golpes recebidos | Tempo |
|---|---|---|---|
| aventureiro | 1 | 8 | 19,2 s |
| aventureiro | 5 | 8 | 20,8 s |
| aventureiro | 10 | 8 | 19 s |
| guerreiro | 1 | 8 | 18,2 s |
| guerreiro | 5 | 8 | 16,9 s |
| guerreiro | 10 | 8 | 15,5 s |
| mago | 1 | 7 | 15,6 s |
| mago | 5 | 7 | 14,5 s |
| mago | 10 | 7 | 13,3 s |
| arqueiro | 1 | 7 | 18,2 s |
| arqueiro | 5 | 8 | 16,9 s |
| arqueiro | 10 | 8 | 15,5 s |
| necromante | 1 | 7 | 18,2 s |
| necromante | 5 | 8 | 16,9 s |
| necromante | 10 | 8 | 15,5 s |

### Chefe (nível 1, como na fase 1; jogadores no nível 2; grupo com classes misturadas)

| Classe | Grupo | Tempo | Derrotas do grupo |
|---|---|---|---|
| aventureiro | 1 | 35,7 s | 2 |
| aventureiro | 2 | 31,9 s | 0 |
| aventureiro | 4 | 25,3 s | 0 |
| aventureiro | 6 | 24,6 s | 0 |
| guerreiro | 1 | 33,5 s | 0 |
| guerreiro | 2 | 24,3 s | 0 |
| guerreiro | 4 | 28,5 s | 0 |
| guerreiro | 6 | 20,4 s | 0 |
| mago | 1 | 33,7 s | 1 |
| mago | 2 | 26 s | 0 |
| mago | 4 | 25,3 s | 0 |
| mago | 6 | 21,8 s | 0 |
| arqueiro | 1 | 26,6 s | 0 |
| arqueiro | 2 | 25,7 s | 0 |
| arqueiro | 4 | 25,4 s | 0 |
| arqueiro | 6 | 21,5 s | 0 |
| necromante | 1 | 30,3 s | 0 |
| necromante | 2 | 25,4 s | 0 |
| necromante | 4 | 26,6 s | 0 |
| necromante | 6 | 21,3 s | 0 |

### Dificuldades (aventureiro; comum no nível 5, chefe sozinho)

| Dificuldade | Tempo no comum | Golpes que aguenta | Chefe (vitórias) | Derrotas no chefe |
|---|---|---|---|---|
| facil | 3,7 s | 12 | 26,5 s | 0/4 |
| normal | 5,1 s | 8 | 33,3 s | 1/4 |
| dificil | 6,6 s | 7 | — | 4/4 |
| pesadelo | 8,6 s | 6 | — | 4/4 |

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

### Builds na arena (ficha inteira)

| Classe | Dirigida vence a dispersa (nível 8) | Dirigida vence a dispersa (nível 30) | Dirigida vence a dispersa (nível 60) | Equipado (raro) vence o sem equipamento (nível 8) |
|---|---|---|---|---|
| aventureiro | Mestre de Feras 48,4% · Batedor 62,5% · Implacável 43,8% · Sobrevivente 62,5% · Pergaminhista 36,7% | Mestre de Feras 26,6% · Batedor 70,3% · Implacável 29,7% · Sobrevivente 29,7% · Pergaminhista 7,8% | Mestre de Feras 0% · Batedor 48,4% · Implacável 37,5% · Sobrevivente 18,8% · Pergaminhista 0% | 85,9% |
| guerreiro | Carniceiro 67,2% · Duelista 42,2% · Rúnico 12,5% · Comandante 82,8% · Baluarte 78,1% | Carniceiro 78,1% · Duelista 79,7% · Rúnico 0% · Comandante 7,8% · Baluarte 7,8% | Carniceiro 75% · Duelista 10,9% · Rúnico 79,7% · Comandante 0% · Baluarte 0% | 98,4% |
| mago | Artilheiro arcano 50% · Ocultista 51,6% · Encantador 60,9% · Guardião arcano 70,3% · Lâmina rúnica 39,1% | Artilheiro arcano 23,4% · Ocultista 16,4% · Encantador 45,3% · Guardião arcano 41,4% · Lâmina rúnica 9,4% | Artilheiro arcano 0% · Ocultista 0% · Encantador 0% · Guardião arcano 35,9% · Lâmina rúnica 0% | 93,8% |
| arqueiro | Atirador 50% · Mira firme 36,7% · Inabalável 75,8% · Caçador 27,3% · Flecheiro arcano 30,5% | Atirador 35,9% · Mira firme 50,8% · Inabalável 68,8% · Caçador 18,8% · Flecheiro arcano 31,3% | Atirador 90,6% · Mira firme 71,9% · Inabalável 70,3% · Caçador 62,5% · Flecheiro arcano 82,8% | 98,4% |
| necromante | Senhor da Horda 57,8% · Mestre de Elite 60,9% · Pestilento 32% · Pacto de Sangue 28,1% · Ceifador 18,8% | Senhor da Horda 32% · Mestre de Elite 57% · Pestilento 0% · Pacto de Sangue 0% · Ceifador 0% | Senhor da Horda 37,5% · Mestre de Elite 98,4% · Pestilento 0% · Pacto de Sangue 1,6% · Ceifador 0% | 98,4% |

### Economia (nível 5, comuns em sequência)

| Classe | XP por minuto | Ouro por minuto (estimado) |
|---|---|---|
| aventureiro | 199,4 | 119,7 |
| guerreiro | 228,3 | 137 |
| mago | 109,2 | 65,5 |
| arqueiro | 206,7 | 124 |
| necromante | 189,1 | 113,4 |
| invocação | 25,2% do dano | — |

### Faixa avançada (equipamento raro, Normal, duas sementes; informativo)

| Classe | Nível | Build | Tempo no comum (s) | Vitórias |
|---|---|---|---|---|
| aventureiro | 20 | focada | 4,7 | 12/12 |
| aventureiro | 20 | dispersa | 4,4 | 12/12 |
| aventureiro | 25 | focada | 5,6 | 12/12 |
| aventureiro | 25 | dispersa | 5,1 | 12/12 |
| aventureiro | 30 | focada | 5,9 | 12/12 |
| aventureiro | 30 | dispersa | 3,1 | 12/12 |
| guerreiro | 20 | focada | 3,8 | 12/12 |
| guerreiro | 20 | dispersa | 3,8 | 12/12 |
| guerreiro | 25 | focada | 3,2 | 12/12 |
| guerreiro | 25 | dispersa | 2,4 | 12/12 |
| guerreiro | 30 | focada | 4,3 | 12/12 |
| guerreiro | 30 | dispersa | 2,6 | 12/12 |
| mago | 20 | focada | 5,6 | 12/12 |
| mago | 20 | dispersa | 4,2 | 12/12 |
| mago | 25 | focada | 5,5 | 12/12 |
| mago | 25 | dispersa | 2,4 | 12/12 |
| mago | 30 | focada | 6 | 12/12 |
| mago | 30 | dispersa | 2,4 | 12/12 |
| arqueiro | 20 | focada | 3,2 | 12/12 |
| arqueiro | 20 | dispersa | 2,8 | 12/12 |
| arqueiro | 25 | focada | 3 | 12/12 |
| arqueiro | 25 | dispersa | 2 | 12/12 |
| arqueiro | 30 | focada | 3,8 | 12/12 |
| arqueiro | 30 | dispersa | 2,1 | 12/12 |
| necromante | 20 | focada | 5,6 | 12/12 |
| necromante | 20 | dispersa | 7,2 | 12/12 |
| necromante | 25 | focada | 5,7 | 12/12 |
| necromante | 25 | dispersa | 5,6 | 12/12 |
| necromante | 30 | focada | 6,6 | 12/12 |
| necromante | 30 | dispersa | 6,1 | 12/12 |

### XP por minuto na faixa avançada (build focada, equipamento raro)

| Classe | Nível | Fácil | Normal | Difícil | Pesadelo |
|---|---|---|---|---|---|
| aventureiro | 20 | 31,6 | 46,9 | 191,1 | 589 |
| aventureiro | 25 | 45,1 | 65,7 | 226,7 | 725,7 |
| aventureiro | 30 | 52,9 | 78 | 273,8 | 888,7 |
| guerreiro | 20 | 102,9 | 66,5 | 176 | 441,9 |
| guerreiro | 25 | 141,2 | 110,5 | 213,1 | 753,1 |
| guerreiro | 30 | 197,7 | 149 | 147,1 | 381,5 |
| mago | 20 | 35 | 50,6 | 137,1 | 519,9 |
| mago | 25 | 42,6 | 68,8 | 166,4 | 554 |
| mago | 30 | 62,5 | 77,9 | 182,3 | 649,1 |
| arqueiro | 20 | 30,1 | 97,3 | 247,4 | 679,5 |
| arqueiro | 25 | 40,4 | 134,5 | 257,5 | 740,9 |
| arqueiro | 30 | 60,9 | 167,7 | 324,1 | 795 |
| necromante | 20 | 24,8 | 50,1 | 142,4 | 444 |
| necromante | 25 | 34,6 | 67,4 | 175,6 | 706,6 |
| necromante | 30 | 47 | 78,3 | 214,4 | 703,5 |

### Níveis altos (equipamento raro do nível, Normal, duas sementes)

| Classe | Nível | Vitórias | Tempo no comum (s) |
|---|---|---|---|
| aventureiro | 50 | 100% | 5,9 |
| aventureiro | 75 | 100% | 3,9 |
| aventureiro | 100 | 100% | 4,6 |
| guerreiro | 50 | 100% | 3,9 |
| guerreiro | 75 | 100% | 3,2 |
| guerreiro | 100 | 100% | 3 |
| mago | 50 | 100% | 3,9 |
| mago | 75 | 100% | 5,6 |
| mago | 100 | 100% | 4,9 |
| arqueiro | 50 | 100% | 3 |
| arqueiro | 75 | 100% | 3,1 |
| arqueiro | 100 | 100% | 2,2 |
| necromante | 50 | 100% | 5,9 |
| necromante | 75 | 100% | 6,6 |
| necromante | 100 | 100% | 5,8 |

### Ritmo até o 100 (só combate, mediana das classes)

| Trecho | Minutos de combate |
|---|---|
| 1 › 30 | 490,8 |
| 30 › 100 | 4893,3 |

### Mundo: regiões (meio da faixa, equipamento incomum; informativo além das vitórias)

| Região | Nível | Vitórias | XP por hora de combate | Min de combate por nível |
|---|---|---|---|---|
| vila_do_centro | 3 | 100% | 9996 | 0,6 |
| campos_do_oeste | 4 | 100% | 13252 | 0,7 |
| encosta_do_leste | 7 | 100% | 19142 | 1,3 |
| floresta_antiga | 7 | 100% | 15501 | 1,5 |
| ruinas_do_norte | 23 | 100% | 4027 | 34,3 |
| pico_gelado | 13 | 100% | 32315 | 2,4 |
| pantano_sombrio | 15 | 100% | 27940 | 3,2 |
| bosque_do_sul | 8 | 100% | 15879 | 2 |
| colinas_do_sudeste | 11 | 100% | 24637 | 2,7 |

### Mundo: covis de boss (no nível do covil; grupo de 3 com classes misturadas)

| Covil | Boss | Nível | Sozinho | Em grupo | Vitórias do grupo |
|---|---|---|---|---|---|
| minas_do_rei_goblin | rei_goblin | 12 | 43,5 s | 36,2 s | 100% |
| cabana_da_bruxa | bruxa_do_pantano | 18 | 54,6 s | 32,5 s | 100% |
| ninho_do_dragao | dragao_das_ruinas | 28 | 47,9 s | 30,6 s | 100% |

### Ouro por minuto e custo do primeiro tomo (sem desconto; só ouro direto, sem venda de loot)

| Classe | Nível | Fácil | Normal | Difícil | Pesadelo | Tomo no Normal (min) | Tomo no Pesadelo (min) |
|---|---|---|---|---|---|---|---|
| aventureiro | 20 | 363,5 | 298,7 | 403,7 | 311,7 | 33,5 | 32,1 |
| aventureiro | 25 | 460,5 | 304,5 | 437,9 | 411,5 | 32,8 | 24,3 |
| aventureiro | 30 | 475,7 | 436,2 | 557,3 | 557,2 | 22,9 | 17,9 |
| guerreiro | 20 | 1501,7 | 410,2 | 364,7 | 220,1 | 24,4 | 45,4 |
| guerreiro | 25 | 1774,8 | 619,5 | 498,9 | 385,6 | 16,1 | 25,9 |
| guerreiro | 30 | 2060,1 | 913,4 | 280,7 | 234,2 | 10,9 | 42,7 |
| mago | 20 | 500,8 | 393,9 | 279,7 | 230,7 | 25,4 | 43,3 |
| mago | 25 | 459,9 | 364,8 | 389,7 | 288,4 | 27,4 | 34,7 |
| mago | 30 | 588,5 | 459,5 | 448,5 | 423 | 21,8 | 23,6 |
| arqueiro | 20 | 348,6 | 709,5 | 499,9 | 378 | 14,1 | 26,5 |
| arqueiro | 25 | 423,7 | 864,3 | 539,1 | 384,4 | 11,6 | 26 |
| arqueiro | 30 | 605,9 | 1019,4 | 733,3 | 373,8 | 9,8 | 26,7 |
| necromante | 20 | 309,7 | 367,1 | 348,8 | 278,4 | 27,2 | 35,9 |
| necromante | 25 | 402,7 | 457,4 | 397,8 | 435,9 | 21,9 | 22,9 |
| necromante | 30 | 477,2 | 586,3 | 495,6 | 431,9 | 17,1 | 23,2 |

