# Balanceamento

**Versão:** 1.4 · **Data:** 08/11/2026

> Gerado por `npm run balancear -- --registrar` (tools/balanceamento, D-061). As metas ficam em
> `src/data/balance.json → metas`; o teste `tests/sim/ritmo.test.ts` protege as principais. Os números que mudaram
> e o antes e depois das calibragens estão em docs/DECISOES.md (D-061, D-071, D-074, D-075, D-076 e D-078).

Sementes: 8 por cenário (1000, 8919, 16838, 24757, 32676, 40595, 48514, 56433). Balance versão 37.

## Resultado: 147/147 metas aprovadas


## Tabelas

### Inimigo comum do mesmo nível, lutas em sequência (mediana)

| Classe | Nível | Golpes | Tempo | Derrotas do jogador |
|---|---|---|---|---|
| aventureiro | 1 | 4 | 4,9 s | 0 |
| aventureiro | 5 | 5 | 6,2 s | 0 |
| aventureiro | 10 | 5 | 6 s | 0 |
| guerreiro | 1 | 5 | 5 s | 0 |
| guerreiro | 5 | 4 | 4,5 s | 0 |
| guerreiro | 10 | 4 | 4,9 s | 0 |
| mago | 1 | 4 | 5,2 s | 0 |
| mago | 5 | 3 | 4,1 s | 0 |
| mago | 10 | 4 | 4,7 s | 0 |
| arqueiro | 1 | 4 | 4,4 s | 0 |
| arqueiro | 5 | 5 | 5,1 s | 0 |
| arqueiro | 10 | 4 | 4,1 s | 0 |
| necromante | 1 | 4 | 4,8 s | 0 |
| necromante | 5 | 4 | 4,5 s | 0 |
| necromante | 10 | 5 | 5,8 s | 0 |

### Quanto o jogador aguenta de um comum (mediana)

| Classe | Nível | Golpes recebidos | Tempo |
|---|---|---|---|
| aventureiro | 1 | 8 | 19,2 s |
| aventureiro | 5 | 8 | 17,8 s |
| aventureiro | 10 | 8 | 16,3 s |
| guerreiro | 1 | 8 | 18,2 s |
| guerreiro | 5 | 8 | 16,9 s |
| guerreiro | 10 | 8 | 15,5 s |
| mago | 1 | 7 | 15,6 s |
| mago | 5 | 7 | 14,5 s |
| mago | 10 | 7 | 13,3 s |
| arqueiro | 1 | 7 | 16 s |
| arqueiro | 5 | 7 | 14,5 s |
| arqueiro | 10 | 7 | 13,3 s |
| necromante | 1 | 7 | 17 s |
| necromante | 5 | 7 | 14,8 s |
| necromante | 10 | 8 | 15,5 s |

### Chefe (nível 1, como na fase 1; jogadores no nível 2; grupo com classes misturadas)

| Classe | Grupo | Tempo | Derrotas do grupo |
|---|---|---|---|
| aventureiro | 1 | 27,8 s | 0 |
| aventureiro | 2 | 28,4 s | 0 |
| aventureiro | 4 | 27,5 s | 0 |
| aventureiro | 6 | 23,4 s | 0 |
| guerreiro | 1 | 33,6 s | 0 |
| guerreiro | 2 | 29,9 s | 0 |
| guerreiro | 4 | 25,7 s | 0 |
| guerreiro | 6 | 22,3 s | 0 |
| mago | 1 | 32 s | 3 |
| mago | 2 | 22,8 s | 0 |
| mago | 4 | 27,1 s | 0 |
| mago | 6 | 26,6 s | 0 |
| arqueiro | 1 | 32,9 s | 0 |
| arqueiro | 2 | 28,8 s | 0 |
| arqueiro | 4 | 25,8 s | 0 |
| arqueiro | 6 | 24 s | 0 |
| necromante | 1 | 33,5 s | 0 |
| necromante | 2 | 22,2 s | 0 |
| necromante | 4 | 28,4 s | 0 |
| necromante | 6 | 23,7 s | 0 |

### Dificuldades (aventureiro; comum no nível 5, chefe sozinho)

| Dificuldade | Tempo no comum | Golpes que aguenta | Chefe (vitórias) | Derrotas no chefe |
|---|---|---|---|---|
| facil | 4,6 s | 12 | 19,5 s | 0/4 |
| normal | 6,2 s | 8 | 27,8 s | 0/4 |
| dificil | 8,5 s | 7 | 40,3 s | 1/4 |
| pesadelo | 11,5 s | 6 | — | 4/4 |

### PvP no Livre (nível 10, com o clamp do modo)

| Classe | Tempo para cair |
|---|---|
| aventureiro | 7,5 s |
| guerreiro | 6,3 s |
| mago | 6,9 s |
| arqueiro | 6,8 s |
| necromante | 6,5 s |

### Aviso útil das habilidades inimigas (p95 aproximado da rede)

| Habilidade | Quem usa | Conjuração | Suportado (150 ms) | Degradado (250 ms) |
|---|---|---|---|---|
| salto_do_duende | duende_saltador | 550 ms | 273 ms | 73 ms |
| golpe | goblin, troll, lobo, sombra, sentinela, servo_ossuario, falcao_companheiro, esqueleto_profano, espectro, copia_ilusoria, falcao_espectral, duende_saltador, runista_medroso | 600 ms | 323 ms | 123 ms |
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
| aventureiro | 68,8% | 98,4% |
| guerreiro | 100% | 89,1% |
| mago | 75% | 84,4% |
| arqueiro | 82% | 98,4% |
| necromante | 87,5% | 100% |

### Economia (nível 5, comuns em sequência)

| Classe | XP por minuto | Ouro por minuto (estimado) |
|---|---|---|
| aventureiro | 180,9 | 108,6 |
| guerreiro | 244,8 | 146,9 |
| mago | 258,3 | 155 |
| arqueiro | 160,9 | 96,5 |
| necromante | 193,7 | 116,2 |
| invocação | 20,4% do dano | — |

### Faixa avançada (equipamento raro, Normal, duas sementes; informativo)

| Classe | Nível | Build | Tempo no comum (s) | Vitórias |
|---|---|---|---|---|
| aventureiro | 20 | focada | 5,6 | 12/12 |
| aventureiro | 20 | dispersa | 5,4 | 12/12 |
| aventureiro | 25 | focada | 6 | 12/12 |
| aventureiro | 25 | dispersa | 5,4 | 12/12 |
| aventureiro | 30 | focada | 6,6 | 12/12 |
| aventureiro | 30 | dispersa | 4,4 | 12/12 |
| guerreiro | 20 | focada | 5,1 | 12/12 |
| guerreiro | 20 | dispersa | 4 | 12/12 |
| guerreiro | 25 | focada | 4,3 | 12/12 |
| guerreiro | 25 | dispersa | 4,4 | 12/12 |
| guerreiro | 30 | focada | 5,5 | 12/12 |
| guerreiro | 30 | dispersa | 3,6 | 12/12 |
| mago | 20 | focada | 4,5 | 12/12 |
| mago | 20 | dispersa | 5,1 | 12/12 |
| mago | 25 | focada | 5,2 | 12/12 |
| mago | 25 | dispersa | 4,8 | 12/12 |
| mago | 30 | focada | 4,9 | 12/12 |
| mago | 30 | dispersa | 4,7 | 12/12 |
| arqueiro | 20 | focada | 5,4 | 12/12 |
| arqueiro | 20 | dispersa | 4,4 | 12/12 |
| arqueiro | 25 | focada | 7,3 | 12/12 |
| arqueiro | 25 | dispersa | 5,4 | 12/12 |
| arqueiro | 30 | focada | 7,9 | 12/12 |
| arqueiro | 30 | dispersa | 4,7 | 12/12 |
| necromante | 20 | focada | 7,2 | 12/12 |
| necromante | 20 | dispersa | 6,6 | 12/12 |
| necromante | 25 | focada | 8,8 | 12/12 |
| necromante | 25 | dispersa | 7,2 | 12/12 |
| necromante | 30 | focada | 9,5 | 12/12 |
| necromante | 30 | dispersa | 6,6 | 12/12 |

### XP por minuto na faixa avançada (build focada, equipamento raro)

| Classe | Nível | Fácil | Normal | Difícil | Pesadelo |
|---|---|---|---|---|---|
| aventureiro | 20 | 29,9 | 45 | 142,6 | 438,7 |
| aventureiro | 25 | 38,1 | 62,8 | 143,6 | 516,4 |
| aventureiro | 30 | 45,3 | 64,7 | 177,5 | 626,7 |
| guerreiro | 20 | 78,3 | 52,9 | 96 | 304,2 |
| guerreiro | 25 | 109,6 | 69,2 | 145,9 | 427,9 |
| guerreiro | 30 | 148,7 | 81,7 | 176,1 | 310,5 |
| mago | 20 | 49,7 | 45,4 | 156 | 533,7 |
| mago | 25 | 66,3 | 59,6 | 186,6 | 632,8 |
| mago | 30 | 78,4 | 64,8 | 198,3 | 652,4 |
| arqueiro | 20 | 22,6 | 51,5 | 120,7 | 416,8 |
| arqueiro | 25 | 25,5 | 62 | 123,8 | 410,7 |
| arqueiro | 30 | 36 | 56,2 | 131,4 | 464,3 |
| necromante | 20 | 22,5 | 37,8 | 92,8 | 383,9 |
| necromante | 25 | 27,8 | 46,1 | 112,9 | 436,5 |
| necromante | 30 | 34,9 | 52,1 | 104,9 | 403,6 |

### Níveis altos (equipamento raro do nível, Normal, duas sementes)

| Classe | Nível | Vitórias | Tempo no comum (s) |
|---|---|---|---|
| aventureiro | 50 | 100% | 5,4 |
| aventureiro | 75 | 100% | 2,1 |
| aventureiro | 100 | 83,3% | 4,4 |
| guerreiro | 50 | 100% | 4,5 |
| guerreiro | 75 | 100% | 4,6 |
| guerreiro | 100 | 91,7% | 9,4 |
| mago | 50 | 100% | 4 |
| mago | 75 | 100% | 4,6 |
| mago | 100 | 100% | 4 |
| arqueiro | 50 | 100% | 5,9 |
| arqueiro | 75 | 100% | 4 |
| arqueiro | 100 | 83,3% | 7 |
| necromante | 50 | 100% | 7,5 |
| necromante | 75 | 100% | 5,8 |
| necromante | 100 | 100% | 8,1 |

### Ritmo até o 100 (só combate, mediana das classes)

| Trecho | Minutos de combate |
|---|---|
| 1 › 30 | 531,8 |
| 30 › 100 | 5373,3 |

### Mundo: regiões (meio da faixa, equipamento incomum; informativo além das vitórias)

| Região | Nível | Vitórias | XP por hora de combate | Min de combate por nível |
|---|---|---|---|---|
| vila_do_centro | 3 | 100% | 11800 | 0,5 |
| campos_do_oeste | 4 | 100% | 13514 | 0,7 |
| encosta_do_leste | 7 | 100% | 21646 | 1,1 |
| floresta_antiga | 7 | 100% | 23387 | 1 |
| ruinas_do_norte | 23 | 100% | 2520 | 54,8 |
| pico_gelado | 13 | 100% | 29158 | 2,7 |
| pantano_sombrio | 15 | 100% | 27445 | 3,3 |
| bosque_do_sul | 8 | 100% | 19782 | 1,6 |
| colinas_do_sudeste | 11 | 100% | 26423 | 2,5 |

### Mundo: covis de boss (no nível do covil; grupo de 3 com classes misturadas)

| Covil | Boss | Nível | Sozinho | Em grupo | Vitórias do grupo |
|---|---|---|---|---|---|
| minas_do_rei_goblin | rei_goblin | 12 | 37,4 s | 45,3 s | 100% |
| cabana_da_bruxa | bruxa_do_pantano | 18 | 49,5 s | 32,5 s | 100% |
| ninho_do_dragao | dragao_das_ruinas | 28 | 67,6 s | 43,1 s | 100% |

### Ouro por minuto e custo do primeiro tomo (sem desconto; só ouro direto, sem venda de loot)

| Classe | Nível | Fácil | Normal | Difícil | Pesadelo | Tomo no Normal (min) | Tomo no Pesadelo (min) |
|---|---|---|---|---|---|---|---|
| aventureiro | 20 | 262,9 | 255,1 | 302,7 | 227,6 | 39,2 | 43,9 |
| aventureiro | 25 | 410,6 | 355,8 | 332,6 | 220,1 | 28,1 | 45,4 |
| aventureiro | 30 | 469,4 | 438,2 | 394,1 | 281,1 | 22,8 | 35,6 |
| guerreiro | 20 | 868,7 | 295,4 | 204,8 | 165,4 | 33,9 | 60,5 |
| guerreiro | 25 | 1048,7 | 356,2 | 331,8 | 269,1 | 28,1 | 37,2 |
| guerreiro | 30 | 1228,7 | 419,1 | 443,3 | 198,6 | 23,9 | 50,4 |
| mago | 20 | 641,4 | 287,8 | 353,3 | 294,6 | 34,7 | 33,9 |
| mago | 25 | 710,5 | 350,6 | 370 | 353,4 | 28,5 | 28,3 |
| mago | 30 | 874,2 | 269,3 | 367 | 374 | 37,1 | 26,7 |
| arqueiro | 20 | 316,8 | 274,8 | 269,6 | 219,7 | 36,4 | 45,5 |
| arqueiro | 25 | 282,8 | 328,6 | 209,6 | 209,6 | 30,4 | 47,7 |
| arqueiro | 30 | 361,7 | 428 | 294,4 | 189,4 | 23,4 | 52,8 |
| necromante | 20 | 339,3 | 295,9 | 209,3 | 204,8 | 33,8 | 48,8 |
| necromante | 25 | 302 | 318,6 | 210,4 | 306,8 | 31,4 | 32,6 |
| necromante | 30 | 381,7 | 288,7 | 225,5 | 241,9 | 34,6 | 41,3 |

