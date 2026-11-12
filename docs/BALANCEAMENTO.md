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
| aventureiro | 5 | 4 | 5,1 s | 0 |
| aventureiro | 10 | 5 | 5,4 s | 0 |
| guerreiro | 1 | 5 | 5,3 s | 0 |
| guerreiro | 5 | 5 | 4,8 s | 0 |
| guerreiro | 10 | 4 | 4,3 s | 0 |
| mago | 1 | 4 | 5 s | 0 |
| mago | 5 | 4 | 5,1 s | 0 |
| mago | 10 | 3 | 4 s | 0 |
| arqueiro | 1 | 5 | 5,1 s | 0 |
| arqueiro | 5 | 4 | 4,4 s | 0 |
| arqueiro | 10 | 4 | 3,9 s | 0 |
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
| aventureiro | 2 | 26,9 s | 0 |
| aventureiro | 4 | 25,1 s | 0 |
| aventureiro | 6 | 22,4 s | 0 |
| guerreiro | 1 | 33,5 s | 0 |
| guerreiro | 2 | 26,3 s | 0 |
| guerreiro | 4 | 24,8 s | 0 |
| guerreiro | 6 | 20,4 s | 0 |
| mago | 1 | 30,2 s | 1 |
| mago | 2 | 20,1 s | 0 |
| mago | 4 | 26,2 s | 0 |
| mago | 6 | 22,3 s | 0 |
| arqueiro | 1 | 31,4 s | 0 |
| arqueiro | 2 | 25,7 s | 0 |
| arqueiro | 4 | 24,7 s | 0 |
| arqueiro | 6 | 21,6 s | 0 |
| necromante | 1 | 30,3 s | 0 |
| necromante | 2 | 22,8 s | 0 |
| necromante | 4 | 26,1 s | 0 |
| necromante | 6 | 21,7 s | 0 |

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
| aventureiro | Mestre de Feras 40,6% · Batedor 59,4% · Implacável 43% · Sobrevivente 56,3% · Pergaminhista 38,3% | Mestre de Feras 26,6% · Batedor 75% · Implacável 17,2% · Sobrevivente 29,7% · Pergaminhista 7,8% | Mestre de Feras 25% · Batedor 85,9% · Implacável 20,3% · Sobrevivente 12,5% · Pergaminhista 0% | 89,1% |
| guerreiro | Carniceiro 17,2% · Duelista 43,8% · Rúnico 17,2% · Comandante 82,8% · Baluarte 40,6% | Carniceiro 81,3% · Duelista 90,6% · Rúnico 0% · Comandante 1,6% · Baluarte 10,9% | Carniceiro 75% · Duelista 3,1% · Rúnico 79,7% · Comandante 0% · Baluarte 18,8% | 98,4% |
| mago | Artilheiro arcano 44,5% · Ocultista 55,5% · Encantador 60,9% · Guardião arcano 70,3% · Lâmina rúnica 39,1% | Artilheiro arcano 25% · Ocultista 13,3% · Encantador 16,4% · Guardião arcano 50,8% · Lâmina rúnica 9,4% | Artilheiro arcano 0% · Ocultista 0% · Encantador 0% · Guardião arcano 35,9% · Lâmina rúnica 0% | 100% |
| arqueiro | Atirador 53,1% · Mira firme 35,9% · Inabalável 75% · Caçador 27,3% · Flecheiro arcano 30,5% | Atirador 40,6% · Mira firme 59,4% · Inabalável 70,3% · Caçador 29,7% · Flecheiro arcano 39,1% | Atirador 100% · Mira firme 71,9% · Inabalável 70,3% · Caçador 68,8% · Flecheiro arcano 76,6% | 100% |
| necromante | Senhor da Horda 57,8% · Mestre de Elite 60,9% · Pestilento 32% · Pacto de Sangue 28,1% · Ceifador 25% | Senhor da Horda 27,3% · Mestre de Elite 53,1% · Pestilento 0% · Pacto de Sangue 0% · Ceifador 0% | Senhor da Horda 24,2% · Mestre de Elite 96,9% · Pestilento 0% · Pacto de Sangue 0% · Ceifador 0% | 98,4% |

### Economia (nível 5, comuns em sequência)

| Classe | XP por minuto | Ouro por minuto (estimado) |
|---|---|---|
| aventureiro | 199,4 | 119,7 |
| guerreiro | 269,5 | 161,7 |
| mago | 150,8 | 90,5 |
| arqueiro | 206,7 | 124 |
| necromante | 189,1 | 113,4 |
| invocação | 24,5% do dano | — |

### Faixa avançada (equipamento raro, Normal, duas sementes; informativo)

| Classe | Nível | Build | Tempo no comum (s) | Vitórias |
|---|---|---|---|---|
| aventureiro | 20 | focada | 8,4 | 12/12 |
| aventureiro | 20 | dispersa | 5,9 | 12/12 |
| aventureiro | 25 | focada | 7,1 | 12/12 |
| aventureiro | 25 | dispersa | 5,1 | 12/12 |
| aventureiro | 30 | focada | 6,1 | 12/12 |
| aventureiro | 30 | dispersa | 4,8 | 12/12 |
| guerreiro | 20 | focada | 3,6 | 12/12 |
| guerreiro | 20 | dispersa | 3,8 | 12/12 |
| guerreiro | 25 | focada | 3,9 | 12/12 |
| guerreiro | 25 | dispersa | 2,6 | 12/12 |
| guerreiro | 30 | focada | 3,2 | 12/12 |
| guerreiro | 30 | dispersa | 2,7 | 12/12 |
| mago | 20 | focada | 5,1 | 12/12 |
| mago | 20 | dispersa | 3,5 | 12/12 |
| mago | 25 | focada | 5,2 | 12/12 |
| mago | 25 | dispersa | 3,3 | 12/12 |
| mago | 30 | focada | 5,1 | 12/12 |
| mago | 30 | dispersa | 2,3 | 12/12 |
| arqueiro | 20 | focada | 3,2 | 12/12 |
| arqueiro | 20 | dispersa | 2,8 | 12/12 |
| arqueiro | 25 | focada | 3 | 12/12 |
| arqueiro | 25 | dispersa | 2,8 | 12/12 |
| arqueiro | 30 | focada | 3,8 | 12/12 |
| arqueiro | 30 | dispersa | 2,5 | 12/12 |
| necromante | 20 | focada | 5,6 | 12/12 |
| necromante | 20 | dispersa | 6,8 | 12/12 |
| necromante | 25 | focada | 5,7 | 12/12 |
| necromante | 25 | dispersa | 5,5 | 12/12 |
| necromante | 30 | focada | 6,6 | 12/12 |
| necromante | 30 | dispersa | 6 | 12/12 |

### XP por minuto na faixa avançada (build focada, equipamento raro)

| Classe | Nível | Fácil | Normal | Difícil | Pesadelo |
|---|---|---|---|---|---|
| aventureiro | 20 | 23,8 | 46,1 | 157,1 | 480,9 |
| aventureiro | 25 | 32,2 | 63,4 | 177,9 | 609,4 |
| aventureiro | 30 | 41,6 | 75,3 | 214,4 | 731,5 |
| guerreiro | 20 | 97 | 81,5 | 142,1 | 460,1 |
| guerreiro | 25 | 135,8 | 116,5 | 225,1 | 466,9 |
| guerreiro | 30 | 184,4 | 152,9 | 140 | 479,6 |
| mago | 20 | 31,4 | 49,8 | 130 | 437,1 |
| mago | 25 | 42,8 | 61,9 | 147,8 | 552,5 |
| mago | 30 | 60,2 | 77,6 | 176,7 | 630,5 |
| arqueiro | 20 | 30,1 | 94 | 217 | 632,7 |
| arqueiro | 25 | 40,4 | 134,5 | 244 | 699,6 |
| arqueiro | 30 | 60,9 | 167,7 | 304 | 774,9 |
| necromante | 20 | 24,8 | 50,1 | 142,4 | 444 |
| necromante | 25 | 34,6 | 67,4 | 175,6 | 706,6 |
| necromante | 30 | 47 | 78,3 | 214,4 | 703,5 |

### Níveis altos (equipamento raro do nível, Normal, duas sementes)

| Classe | Nível | Vitórias | Tempo no comum (s) |
|---|---|---|---|
| aventureiro | 50 | 100% | 6 |
| aventureiro | 75 | 100% | 5,4 |
| aventureiro | 100 | 100% | 6,8 |
| guerreiro | 50 | 100% | 4 |
| guerreiro | 75 | 100% | 2,5 |
| guerreiro | 100 | 100% | 2,5 |
| mago | 50 | 100% | 4 |
| mago | 75 | 100% | 5,9 |
| mago | 100 | 100% | 5,6 |
| arqueiro | 50 | 100% | 5,4 |
| arqueiro | 75 | 100% | 3,4 |
| arqueiro | 100 | 100% | 3 |
| necromante | 50 | 100% | 5,9 |
| necromante | 75 | 100% | 6,6 |
| necromante | 100 | 100% | 5,8 |

### Ritmo até o 100 (só combate, mediana das classes)

| Trecho | Minutos de combate |
|---|---|
| 1 › 30 | 488,8 |
| 30 › 100 | 6219,1 |

### Mundo: regiões (meio da faixa, equipamento incomum; informativo além das vitórias)

| Região | Nível | Vitórias | XP por hora de combate | Min de combate por nível |
|---|---|---|---|---|
| vila_do_centro | 3 | 100% | 11368 | 0,5 |
| campos_do_oeste | 4 | 100% | 13252 | 0,7 |
| encosta_do_leste | 7 | 100% | 19196 | 1,3 |
| floresta_antiga | 7 | 100% | 15501 | 1,5 |
| ruinas_do_norte | 23 | 100% | 3949 | 34,9 |
| pico_gelado | 13 | 100% | 27269 | 2,9 |
| pantano_sombrio | 15 | 100% | 27785 | 3,2 |
| bosque_do_sul | 8 | 100% | 14950 | 2,1 |
| colinas_do_sudeste | 11 | 100% | 24637 | 2,7 |

### Mundo: covis de boss (no nível do covil; grupo de 3 com classes misturadas)

| Covil | Boss | Nível | Sozinho | Em grupo | Vitórias do grupo |
|---|---|---|---|---|---|
| minas_do_rei_goblin | rei_goblin | 12 | 43,5 s | 32,5 s | 100% |
| cabana_da_bruxa | bruxa_do_pantano | 18 | 53,3 s | 32,5 s | 100% |
| ninho_do_dragao | dragao_das_ruinas | 28 | 49,3 s | 33,8 s | 100% |

### Ouro por minuto e custo do primeiro tomo (sem desconto; só ouro direto, sem venda de loot)

| Classe | Nível | Fácil | Normal | Difícil | Pesadelo | Tomo no Normal (min) | Tomo no Pesadelo (min) |
|---|---|---|---|---|---|---|---|
| aventureiro | 20 | 268,5 | 288,2 | 261,4 | 245,5 | 34,7 | 40,7 |
| aventureiro | 25 | 337,9 | 288 | 364,9 | 345,5 | 34,7 | 28,9 |
| aventureiro | 30 | 293,6 | 415,2 | 413,7 | 403,4 | 24,1 | 24,8 |
| guerreiro | 20 | 1416,7 | 495,8 | 253,8 | 276 | 20,2 | 36,2 |
| guerreiro | 25 | 1707,8 | 652,9 | 496,4 | 212,6 | 15,3 | 47 |
| guerreiro | 30 | 2018,3 | 937,3 | 250,2 | 236 | 10,7 | 42,4 |
| mago | 20 | 374,1 | 305,2 | 329 | 229,5 | 32,8 | 43,6 |
| mago | 25 | 443,5 | 341,3 | 375,3 | 346,5 | 29,3 | 28,9 |
| mago | 30 | 576,3 | 515,4 | 468,8 | 424,6 | 19,4 | 23,6 |
| arqueiro | 20 | 348,6 | 732,5 | 451,7 | 378,3 | 13,7 | 26,4 |
| arqueiro | 25 | 423,7 | 864,3 | 500,6 | 385,8 | 11,6 | 25,9 |
| arqueiro | 30 | 605,9 | 1019,4 | 668,3 | 394,8 | 9,8 | 25,3 |
| necromante | 20 | 309,7 | 367,1 | 348,8 | 278,4 | 27,2 | 35,9 |
| necromante | 25 | 402,7 | 457,4 | 397,8 | 435,9 | 21,9 | 22,9 |
| necromante | 30 | 477,2 | 586,3 | 495,6 | 431,9 | 17,1 | 23,2 |

