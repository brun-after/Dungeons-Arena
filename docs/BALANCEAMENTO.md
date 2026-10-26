# Balanceamento

**Versão:** 1.4 · **Data:** 26/10/2026

> Gerado por `npm run balancear -- --registrar` (tools/balanceamento, D-061). As metas ficam em
> `src/data/balance.json → metas`; o teste `tests/sim/ritmo.test.ts` protege as principais. Os números que mudaram
> e o antes e depois das calibragens estão em docs/DECISOES.md (D-061, D-071, D-074, D-075, D-076 e D-078).

Sementes: 8 por cenário (1000, 8919, 16838, 24757, 32676, 40595, 48514, 56433). Balance versão 36.

## Resultado: 94/94 metas aprovadas


## Tabelas

### Inimigo comum do mesmo nível, lutas em sequência (mediana)

| Classe | Nível | Golpes | Tempo | Derrotas do jogador |
|---|---|---|---|---|
| aventureiro | 1 | 4 | 4,7 s | 0 |
| aventureiro | 5 | 4 | 4,8 s | 0 |
| aventureiro | 10 | 5 | 5,8 s | 0 |
| guerreiro | 1 | 5 | 4,5 s | 0 |
| guerreiro | 5 | 4 | 3,8 s | 0 |
| guerreiro | 10 | 4 | 4,9 s | 0 |
| mago | 1 | 4 | 4,2 s | 0 |
| mago | 5 | 3 | 3,8 s | 0 |
| mago | 10 | 3 | 4 s | 0 |
| arqueiro | 1 | 4 | 5,1 s | 0 |
| arqueiro | 5 | 5 | 4,8 s | 0 |
| arqueiro | 10 | 5 | 4,6 s | 0 |
| necromante | 1 | 4 | 4,8 s | 0 |
| necromante | 5 | 4 | 4,6 s | 0 |
| necromante | 10 | 5 | 6,8 s | 0 |

### Quanto o jogador aguenta de um comum (mediana)

| Classe | Nível | Golpes recebidos | Tempo |
|---|---|---|---|
| aventureiro | 1 | 8 | 24 s |
| aventureiro | 5 | 8 | 24 s |
| aventureiro | 10 | 8 | 24 s |
| guerreiro | 1 | 8 | 21 s |
| guerreiro | 5 | 8 | 21 s |
| guerreiro | 10 | 8 | 21 s |
| mago | 1 | 7 | 18 s |
| mago | 5 | 7 | 18 s |
| mago | 10 | 7 | 18 s |
| arqueiro | 1 | 7 | 20 s |
| arqueiro | 5 | 7 | 18 s |
| arqueiro | 10 | 7 | 18 s |
| necromante | 1 | 6 | 16 s |
| necromante | 5 | 7 | 18 s |
| necromante | 10 | 7 | 18 s |

### Chefe (nível 1, como na fase 1; jogadores no nível 2; grupo com classes misturadas)

| Classe | Grupo | Tempo | Derrotas do grupo |
|---|---|---|---|
| aventureiro | 1 | 34 s | 0 |
| aventureiro | 2 | 22,5 s | 0 |
| aventureiro | 4 | 22 s | 0 |
| aventureiro | 6 | 20,2 s | 0 |
| guerreiro | 1 | 25,9 s | 0 |
| guerreiro | 2 | 21,5 s | 0 |
| guerreiro | 4 | 23,8 s | 0 |
| guerreiro | 6 | 21 s | 0 |
| mago | 1 | 33,7 s | 1 |
| mago | 2 | 26 s | 0 |
| mago | 4 | 21,9 s | 0 |
| mago | 6 | 22,3 s | 0 |
| arqueiro | 1 | 36,1 s | 0 |
| arqueiro | 2 | 24,6 s | 0 |
| arqueiro | 4 | 23,3 s | 0 |
| arqueiro | 6 | 21,8 s | 0 |
| necromante | 1 | 33,3 s | 0 |
| necromante | 2 | 25,8 s | 0 |
| necromante | 4 | 22,3 s | 0 |
| necromante | 6 | 21,6 s | 0 |

### Dificuldades (aventureiro; comum no nível 5, chefe sozinho)

| Dificuldade | Tempo no comum | Golpes que aguenta | Chefe (vitórias) | Derrotas no chefe |
|---|---|---|---|---|
| facil | 4 s | 12 | 24,5 s | 0/4 |
| normal | 5 s | 8 | 36,8 s | 0/4 |
| dificil | 7,8 s | 7 | 40,8 s | 2/4 |
| pesadelo | 10,8 s | 6 | — | 4/4 |

### PvP no Livre (nível 10, com o clamp do modo)

| Classe | Tempo para cair |
|---|---|
| aventureiro | 7 s |
| guerreiro | 8,1 s |
| mago | 6,9 s |
| arqueiro | 6,8 s |
| necromante | 8,7 s |

### Aviso útil das habilidades inimigas (p95 aproximado da rede)

| Habilidade | Quem usa | Conjuração | Suportado (150 ms) | Degradado (250 ms) |
|---|---|---|---|---|
| golpe | goblin, troll, lobo, sombra, sentinela, servo_ossuario, falcao_companheiro, esqueleto_profano, espectro, copia_ilusoria, falcao_espectral | 600 ms | 323 ms | 123 ms |
| golpe_pesado | orc, cavaleiro_da_morte | 600 ms | 323 ms | 123 ms |
| golpe_viscoso | slime | 600 ms | 323 ms | 123 ms |
| raio_vampirico | vampiro | 504 ms | 352 ms | 152 ms |
| teia | aranha | 504 ms | 370 ms | 170 ms |
| golpe_demoniaco | boss | 700 ms | 423 ms | 223 ms |
| flecha | esqueleto | 700 ms | 548 ms | 348 ms |
| marca_de_area | cultista, boss | 1200 ms | 923 ms | 723 ms |

### Builds na arena (ficha inteira, nível 8)

| Classe | Focada vence a dispersa | Equipado (raro) vence o sem equipamento |
|---|---|---|
| aventureiro | 75% | 98,4% |
| guerreiro | 96,9% | 70,3% |
| mago | 88,3% | 67,2% |
| arqueiro | 74,2% | 89,1% |
| necromante | 64,1% | 68,8% |

### Economia (nível 5, comuns em sequência)

| Classe | XP por minuto | Ouro por minuto (estimado) |
|---|---|---|
| aventureiro | 173,8 | 104,3 |
| guerreiro | 347,9 | 208,8 |
| mago | 447,1 | 268,3 |
| arqueiro | 195,3 | 117,2 |
| necromante | 172,7 | 103,6 |
| invocação | 20,6% do dano | — |

### Faixa avançada (equipamento raro, Normal, duas sementes; informativo)

| Classe | Nível | Build | Tempo no comum (s) | Vitórias |
|---|---|---|---|---|
| aventureiro | 20 | focada | 8,8 | 12/12 |
| aventureiro | 20 | dispersa | 6 | 12/12 |
| aventureiro | 25 | focada | 8,2 | 12/12 |
| aventureiro | 25 | dispersa | 3,7 | 12/12 |
| aventureiro | 30 | focada | 11,8 | 12/12 |
| aventureiro | 30 | dispersa | 4 | 12/12 |
| guerreiro | 20 | focada | 13,3 | 12/12 |
| guerreiro | 20 | dispersa | 6,3 | 12/12 |
| guerreiro | 25 | focada | 9,5 | 12/12 |
| guerreiro | 25 | dispersa | 5,8 | 12/12 |
| guerreiro | 30 | focada | 9 | 12/12 |
| guerreiro | 30 | dispersa | 5,8 | 12/12 |
| mago | 20 | focada | 4 | 12/12 |
| mago | 20 | dispersa | 6,3 | 12/12 |
| mago | 25 | focada | 4,9 | 12/12 |
| mago | 25 | dispersa | 5,7 | 12/12 |
| mago | 30 | focada | 9,2 | 12/12 |
| mago | 30 | dispersa | 5,7 | 12/12 |
| arqueiro | 20 | focada | 5,8 | 12/12 |
| arqueiro | 20 | dispersa | 4,6 | 12/12 |
| arqueiro | 25 | focada | 7,2 | 12/12 |
| arqueiro | 25 | dispersa | 4,6 | 12/12 |
| arqueiro | 30 | focada | 8,1 | 12/12 |
| arqueiro | 30 | dispersa | 4,4 | 12/12 |
| necromante | 20 | focada | 13,7 | 12/12 |
| necromante | 20 | dispersa | 10,2 | 12/12 |
| necromante | 25 | focada | 14,7 | 12/12 |
| necromante | 25 | dispersa | 10,2 | 12/12 |
| necromante | 30 | focada | 14,3 | 12/12 |
| necromante | 30 | dispersa | 11,1 | 12/12 |

### XP por minuto na faixa avançada (build focada, equipamento raro; nível 30 é o teto)

| Classe | Nível | Fácil | Normal | Difícil | Pesadelo |
|---|---|---|---|---|---|
| aventureiro | 20 | 21,3 | 38,6 | 115,6 | 410,6 |
| aventureiro | 25 | 25,9 | 41,8 | 110,5 | 484,6 |
| aventureiro | 30 | 25,5 | 41,5 | 112,1 | 462 |
| guerreiro | 20 | 23,8 | 34,4 | 79,1 | 249,6 |
| guerreiro | 25 | 44,1 | 38,1 | 82,3 | 273,5 |
| guerreiro | 30 | 50 | 35,3 | 85,1 | 263,4 |
| mago | 20 | 32,2 | 102,5 | 239,5 | 597,3 |
| mago | 25 | 42,3 | 93 | 246,7 | 557,2 |
| mago | 30 | 57,6 | 94 | 164,6 | 467,7 |
| arqueiro | 20 | 24,6 | 42,3 | 123,5 | 478 |
| arqueiro | 25 | 26 | 43,6 | 114,1 | 427,3 |
| arqueiro | 30 | 34,4 | 44,2 | 129,2 | 472,1 |
| necromante | 20 | 7,5 | 15,4 | 44,9 | 169 |
| necromante | 25 | 13,1 | 24,3 | 57,5 | 185,8 |
| necromante | 30 | 17,5 | 28 | 67,6 | 186,3 |

### Ouro por minuto e custo do primeiro tomo (sem desconto; só ouro direto, sem venda de loot)

| Classe | Nível | Fácil | Normal | Difícil | Pesadelo | Tomo no Normal (min) | Tomo no Pesadelo (min) |
|---|---|---|---|---|---|---|---|
| aventureiro | 20 | 253,5 | 233,5 | 305,4 | 220,7 | 42,8 | 45,3 |
| aventureiro | 25 | 292,3 | 265,8 | 215,3 | 221,5 | 37,6 | 45,2 |
| aventureiro | 30 | 251,9 | 264 | 211,5 | 262,2 | 37,9 | 38,1 |
| guerreiro | 20 | 290,9 | 179,4 | 161,4 | 130 | 55,7 | 76,9 |
| guerreiro | 25 | 481,5 | 221,9 | 161,8 | 173,9 | 45,1 | 57,5 |
| guerreiro | 30 | 520,7 | 233,4 | 190,2 | 152,2 | 42,9 | 65,7 |
| mago | 20 | 441,5 | 743,1 | 486,4 | 312,3 | 13,5 | 32 |
| mago | 25 | 507,8 | 507 | 571,5 | 286,3 | 19,7 | 34,9 |
| mago | 30 | 600 | 527,7 | 392,2 | 258 | 18,9 | 38,8 |
| arqueiro | 20 | 312,9 | 313,8 | 248,2 | 250 | 31,9 | 40 |
| arqueiro | 25 | 338,3 | 278,5 | 262,3 | 217,3 | 35,9 | 46 |
| arqueiro | 30 | 320,8 | 312,6 | 251,1 | 291,9 | 32 | 34,3 |
| necromante | 20 | 96,7 | 93,9 | 91,5 | 101,1 | 106,5 | 98,9 |
| necromante | 25 | 141,7 | 122,4 | 142,5 | 112,2 | 81,7 | 89,1 |
| necromante | 30 | 215 | 221,5 | 155,9 | 125,6 | 45,1 | 79,6 |

