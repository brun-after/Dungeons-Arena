# Balanceamento

**Versão:** 1.4 · **Data:** 24/10/2026

> Gerado por `npm run balancear -- --registrar` (tools/balanceamento, D-061). As metas ficam em
> `src/data/balance.json → metas`; o teste `tests/sim/ritmo.test.ts` protege as principais. Os números que mudaram
> e o antes e depois das calibragens estão em docs/DECISOES.md (D-061, D-071, D-074, D-075, D-076 e D-078).

Sementes: 8 por cenário (1000, 8919, 16838, 24757, 32676, 40595, 48514, 56433). Balance versão 33.

## Resultado: 94/94 metas aprovadas


## Tabelas

### Inimigo comum do mesmo nível, lutas em sequência (mediana)

| Classe | Nível | Golpes | Tempo | Derrotas do jogador |
|---|---|---|---|---|
| aventureiro | 1 | 5 | 5,2 s | 0 |
| aventureiro | 5 | 5 | 5,7 s | 0 |
| aventureiro | 10 | 4 | 4,2 s | 0 |
| guerreiro | 1 | 4 | 5 s | 0 |
| guerreiro | 5 | 3 | 3,8 s | 0 |
| guerreiro | 10 | 3 | 3,8 s | 0 |
| mago | 1 | 4 | 4,1 s | 0 |
| mago | 5 | 3 | 3,6 s | 0 |
| mago | 10 | 3 | 3,8 s | 0 |
| arqueiro | 1 | 4 | 4,2 s | 0 |
| arqueiro | 5 | 5 | 4,8 s | 0 |
| arqueiro | 10 | 5 | 5,6 s | 0 |
| necromante | 1 | 3 | 4 s | 0 |
| necromante | 5 | 4 | 4,1 s | 0 |
| necromante | 10 | 5 | 4,5 s | 0 |

### Quanto o jogador aguenta de um comum (mediana)

| Classe | Nível | Golpes recebidos | Tempo |
|---|---|---|---|
| aventureiro | 1 | 8 | 21 s |
| aventureiro | 5 | 8 | 21 s |
| aventureiro | 10 | 7 | 21 s |
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
| aventureiro | 1 | 27,5 s | 4 |
| aventureiro | 2 | 21,5 s | 0 |
| aventureiro | 4 | 20,8 s | 0 |
| aventureiro | 6 | 15,6 s | 0 |
| guerreiro | 1 | 32,4 s | 1 |
| guerreiro | 2 | 21,3 s | 0 |
| guerreiro | 4 | 21 s | 0 |
| guerreiro | 6 | 16,7 s | 0 |
| mago | 1 | 30,2 s | 1 |
| mago | 2 | 20,5 s | 0 |
| mago | 4 | 22,3 s | 0 |
| mago | 6 | 16,8 s | 0 |
| arqueiro | 1 | 27,1 s | 0 |
| arqueiro | 2 | 20,9 s | 0 |
| arqueiro | 4 | 21,2 s | 0 |
| arqueiro | 6 | 19,5 s | 0 |
| necromante | 1 | 28,8 s | 0 |
| necromante | 2 | 18,1 s | 0 |
| necromante | 4 | 19,4 s | 0 |
| necromante | 6 | 16,5 s | 0 |

### Dificuldades (aventureiro; comum no nível 5, chefe sozinho)

| Dificuldade | Tempo no comum | Golpes que aguenta | Chefe (vitórias) | Derrotas no chefe |
|---|---|---|---|---|
| facil | 3,2 s | 11 | 20,7 s | 0/4 |
| normal | 5,8 s | 8 | 27,5 s | 3/4 |
| dificil | 9 s | 5 | — | 4/4 |
| pesadelo | 10,8 s | 5 | — | 4/4 |

### PvP no Livre (nível 10, com o clamp do modo)

| Classe | Tempo para cair |
|---|---|
| aventureiro | 8 s |
| guerreiro | 9,6 s |
| mago | 9,9 s |
| arqueiro | 6,8 s |
| necromante | 7,3 s |

### Aviso útil das habilidades inimigas (p95 aproximado da rede)

| Habilidade | Quem usa | Conjuração | Suportado (150 ms) | Degradado (250 ms) |
|---|---|---|---|---|
| golpe | goblin, troll, lobo, sombra, sentinela, servo_ossuario, falcao_companheiro | 600 ms | 323 ms | 123 ms |
| golpe_pesado | orc | 600 ms | 323 ms | 123 ms |
| golpe_viscoso | slime | 600 ms | 323 ms | 123 ms |
| raio_vampirico | vampiro | 504 ms | 352 ms | 152 ms |
| teia | aranha | 504 ms | 370 ms | 170 ms |
| golpe_demoniaco | boss | 700 ms | 423 ms | 223 ms |
| flecha | esqueleto | 700 ms | 548 ms | 348 ms |
| marca_de_area | cultista, boss | 1200 ms | 923 ms | 723 ms |

### Builds na arena (ficha inteira, nível 8)

| Classe | Focada vence a dispersa | Equipado (raro) vence o sem equipamento |
|---|---|---|
| aventureiro | 81,3% | 93,8% |
| guerreiro | 75% | 81,3% |
| mago | 87,5% | 75% |
| arqueiro | 68,8% | 87,5% |
| necromante | 68,8% | 93,8% |

### Economia (nível 5, comuns em sequência)

| Classe | XP por minuto | Ouro por minuto (estimado) |
|---|---|---|
| aventureiro | 166,6 | 99,9 |
| guerreiro | 282,9 | 169,8 |
| mago | 302,6 | 181,5 |
| arqueiro | 196,9 | 118,1 |
| necromante | 249,2 | 149,5 |
| invocação | 22,5% do dano | — |

### Faixa avançada (equipamento raro, Normal, duas sementes; informativo)

| Classe | Nível | Build | Tempo no comum (s) | Vitórias |
|---|---|---|---|---|
| aventureiro | 20 | focada | 9,9 | 12/12 |
| aventureiro | 20 | dispersa | 9,3 | 12/12 |
| aventureiro | 25 | focada | 8 | 12/12 |
| aventureiro | 25 | dispersa | 5,9 | 12/12 |
| aventureiro | 30 | focada | 16,7 | 11/12 |
| aventureiro | 30 | dispersa | 8,2 | 12/12 |
| guerreiro | 20 | focada | 9,7 | 12/12 |
| guerreiro | 20 | dispersa | 7,5 | 12/12 |
| guerreiro | 25 | focada | 10,9 | 12/12 |
| guerreiro | 25 | dispersa | 10,5 | 12/12 |
| guerreiro | 30 | focada | 13,6 | 11/12 |
| guerreiro | 30 | dispersa | 8,5 | 12/12 |
| mago | 20 | focada | 5,8 | 12/12 |
| mago | 20 | dispersa | 3,6 | 12/12 |
| mago | 25 | focada | 9,5 | 12/12 |
| mago | 25 | dispersa | 3,5 | 12/12 |
| mago | 30 | focada | 10,8 | 12/12 |
| mago | 30 | dispersa | 3,9 | 12/12 |
| arqueiro | 20 | focada | 5,4 | 12/12 |
| arqueiro | 20 | dispersa | 3,6 | 12/12 |
| arqueiro | 25 | focada | 6,7 | 12/12 |
| arqueiro | 25 | dispersa | 3,6 | 12/12 |
| arqueiro | 30 | focada | 6,8 | 12/12 |
| arqueiro | 30 | dispersa | 3,8 | 12/12 |
| necromante | 20 | focada | 8,1 | 12/12 |
| necromante | 20 | dispersa | 10,2 | 11/12 |
| necromante | 25 | focada | 11,3 | 12/12 |
| necromante | 25 | dispersa | 11,1 | 12/12 |
| necromante | 30 | focada | 13,1 | 12/12 |
| necromante | 30 | dispersa | 8,7 | 11/12 |

### XP por minuto na faixa avançada (build focada, equipamento raro; nível 30 é o teto)

| Classe | Nível | Fácil | Normal | Difícil | Pesadelo |
|---|---|---|---|---|---|
| aventureiro | 20 | 21,8 | 43,9 | 115,7 | 398,6 |
| aventureiro | 25 | 25,2 | 37,1 | 102,9 | 390,2 |
| aventureiro | 30 | 31 | 50,1 | 142,2 | 503,3 |
| guerreiro | 20 | 12,1 | 23 | 56,8 | 172,9 |
| guerreiro | 25 | 14 | 25 | 63,8 | 261,7 |
| guerreiro | 30 | 17,2 | 21,6 | 59,8 | 183 |
| mago | 20 | 29,6 | 44,8 | 131,7 | 395,6 |
| mago | 25 | 34,7 | 47 | 104,2 | 411,5 |
| mago | 30 | 34,8 | 39,3 | 112,6 | 445,2 |
| arqueiro | 20 | 26,8 | 48 | 138,9 | 490,9 |
| arqueiro | 25 | 31,1 | 49,9 | 131,6 | 478,7 |
| arqueiro | 30 | 38,3 | 53,4 | 137 | 523 |
| necromante | 20 | 19,1 | 34,6 | 107,6 | 404,8 |
| necromante | 25 | 19,4 | 37,3 | 91,1 | 338,4 |
| necromante | 30 | 25 | 40,1 | 102,1 | 329 |

### Ouro por minuto e custo do primeiro tomo (sem desconto; só ouro direto, sem venda de loot)

| Classe | Nível | Fácil | Normal | Difícil | Pesadelo | Tomo no Normal (min) | Tomo no Pesadelo (min) |
|---|---|---|---|---|---|---|---|
| aventureiro | 20 | 254,5 | 236,2 | 236,2 | 223,4 | 42,3 | 44,8 |
| aventureiro | 25 | 244,6 | 223,9 | 253,2 | 270,2 | 44,7 | 37 |
| aventureiro | 30 | 348,6 | 333,8 | 259,2 | 268,8 | 30 | 37,2 |
| guerreiro | 20 | 124,4 | 151,2 | 129,2 | 126 | 66,1 | 79,3 |
| guerreiro | 25 | 146,5 | 165,9 | 141,7 | 149,3 | 60,3 | 67 |
| guerreiro | 30 | 134,1 | 136,2 | 114,9 | 107,9 | 73,4 | 92,7 |
| mago | 20 | 369,5 | 270,7 | 244,6 | 201,9 | 36,9 | 49,5 |
| mago | 25 | 383,8 | 213,4 | 224,4 | 198,7 | 46,9 | 50,3 |
| mago | 30 | 282,3 | 231,5 | 221,2 | 257,1 | 43,2 | 38,9 |
| arqueiro | 20 | 361,6 | 376 | 314,6 | 317 | 26,6 | 31,5 |
| arqueiro | 25 | 352,7 | 322,2 | 288 | 278 | 31 | 36 |
| arqueiro | 30 | 440,9 | 349 | 323,6 | 286,9 | 28,6 | 34,9 |
| necromante | 20 | 200,7 | 259,5 | 239,4 | 220,1 | 38,5 | 45,4 |
| necromante | 25 | 217,7 | 228,2 | 224,3 | 161,1 | 43,8 | 62,1 |
| necromante | 30 | 300,5 | 226,3 | 240,5 | 186,7 | 44,2 | 53,6 |

