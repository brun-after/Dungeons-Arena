# Balanceamento

**Versão:** 1.4 · **Data:** 24/10/2026

> Gerado por `npm run balancear -- --registrar` (tools/balanceamento, D-061). As metas ficam em
> `src/data/balance.json → metas`; o teste `tests/sim/ritmo.test.ts` protege as principais. Os números que mudaram
> e o antes e depois das calibragens estão em docs/DECISOES.md (D-061, D-071, D-074, D-075, D-076 e D-078).

Sementes: 8 por cenário (1000, 8919, 16838, 24757, 32676, 40595, 48514, 56433). Balance versão 31.

## Resultado: 77/77 metas aprovadas


## Tabelas

### Inimigo comum do mesmo nível, lutas em sequência (mediana)

| Classe | Nível | Golpes | Tempo | Derrotas do jogador |
|---|---|---|---|---|
| aventureiro | 1 | 5 | 4,5 s | 0 |
| aventureiro | 5 | 5 | 5,6 s | 0 |
| aventureiro | 10 | 5 | 5,9 s | 0 |
| guerreiro | 1 | 4 | 5 s | 0 |
| guerreiro | 5 | 3 | 3,8 s | 0 |
| guerreiro | 10 | 3 | 3,8 s | 0 |
| mago | 1 | 4 | 4,2 s | 0 |
| mago | 5 | 4 | 4,1 s | 0 |
| mago | 10 | 3 | 4,4 s | 0 |
| arqueiro | 1 | 4 | 5,1 s | 0 |
| arqueiro | 5 | 5 | 5,1 s | 0 |
| arqueiro | 10 | 5 | 5,6 s | 0 |

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

### Chefe (nível 1, como na fase 1; jogadores no nível 2; grupo com classes misturadas)

| Classe | Grupo | Tempo | Derrotas do grupo |
|---|---|---|---|
| aventureiro | 1 | 33,3 s | 1 |
| aventureiro | 2 | 21,5 s | 0 |
| aventureiro | 4 | 20,8 s | 0 |
| aventureiro | 6 | 18 s | 0 |
| guerreiro | 1 | 32,4 s | 1 |
| guerreiro | 2 | 20,2 s | 0 |
| guerreiro | 4 | 24,5 s | 0 |
| guerreiro | 6 | 19 s | 0 |
| mago | 1 | 31,4 s | 1 |
| mago | 2 | 20,7 s | 0 |
| mago | 4 | 24 s | 0 |
| mago | 6 | 22,8 s | 0 |
| arqueiro | 1 | 30,6 s | 0 |
| arqueiro | 2 | 19,9 s | 0 |
| arqueiro | 4 | 22,7 s | 0 |
| arqueiro | 6 | 20,3 s | 0 |

### Dificuldades (aventureiro; comum no nível 5, chefe sozinho)

| Dificuldade | Tempo no comum | Golpes que aguenta | Chefe (vitórias) | Derrotas no chefe |
|---|---|---|---|---|
| facil | 3,4 s | 11 | 26,3 s | 0/4 |
| normal | 6,4 s | 8 | 33,3 s | 0/4 |
| dificil | 9,2 s | 5 | 36,8 s | 3/4 |
| pesadelo | 13,4 s | 5 | — | 4/4 |

### PvP no Livre (nível 10, com o clamp do modo)

| Classe | Tempo para cair |
|---|---|
| aventureiro | 8,8 s |
| guerreiro | 9,6 s |
| mago | 9,9 s |
| arqueiro | 6,8 s |

### Aviso útil das habilidades inimigas (p95 aproximado da rede)

| Habilidade | Quem usa | Conjuração | Suportado (150 ms) | Degradado (250 ms) |
|---|---|---|---|---|
| golpe | goblin, troll, lobo, sombra, sentinela, servo_ossuario | 600 ms | 323 ms | 123 ms |
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
| aventureiro | 68,8% | 87,5% |
| guerreiro | 75% | 81,3% |
| mago | 87,5% | 75% |
| arqueiro | 68,8% | 87,5% |

### Economia (nível 5, comuns em sequência)

| Classe | XP por minuto | Ouro por minuto (estimado) |
|---|---|---|
| aventureiro | 177 | 106,2 |
| guerreiro | 282,9 | 169,8 |
| mago | 286,4 | 171,8 |
| arqueiro | 196,9 | 118,1 |
| invocação | 22,5% do dano | — |

### Faixa avançada (equipamento raro, Normal, duas sementes; informativo)

| Classe | Nível | Build | Tempo no comum (s) | Vitórias |
|---|---|---|---|---|
| aventureiro | 20 | focada | 11,3 | 11/12 |
| aventureiro | 20 | dispersa | 5,9 | 12/12 |
| aventureiro | 25 | focada | 10 | 12/12 |
| aventureiro | 25 | dispersa | 8 | 12/12 |
| aventureiro | 30 | focada | 15,3 | 10/12 |
| aventureiro | 30 | dispersa | 8,8 | 12/12 |
| guerreiro | 20 | focada | 9,7 | 12/12 |
| guerreiro | 20 | dispersa | 7,5 | 12/12 |
| guerreiro | 25 | focada | 10,9 | 12/12 |
| guerreiro | 25 | dispersa | 10,5 | 12/12 |
| guerreiro | 30 | focada | 13,6 | 11/12 |
| guerreiro | 30 | dispersa | 8,5 | 12/12 |
| mago | 20 | focada | 5,8 | 12/12 |
| mago | 20 | dispersa | 5,5 | 12/12 |
| mago | 25 | focada | 9 | 12/12 |
| mago | 25 | dispersa | 3,5 | 12/12 |
| mago | 30 | focada | 7,5 | 12/12 |
| mago | 30 | dispersa | 5 | 12/12 |
| arqueiro | 20 | focada | 5,6 | 12/12 |
| arqueiro | 20 | dispersa | 3,6 | 12/12 |
| arqueiro | 25 | focada | 6,7 | 12/12 |
| arqueiro | 25 | dispersa | 3,8 | 12/12 |
| arqueiro | 30 | focada | 7,1 | 12/12 |
| arqueiro | 30 | dispersa | 3,8 | 12/12 |

### XP por minuto na faixa avançada (build focada, equipamento raro; nível 30 é o teto)

| Classe | Nível | Fácil | Normal | Difícil | Pesadelo |
|---|---|---|---|---|---|
| aventureiro | 20 | 20,1 | 38,2 | 106,5 | 364,3 |
| aventureiro | 25 | 26,5 | 36 | 102,8 | 393,9 |
| aventureiro | 30 | 26,2 | 42,2 | 111,9 | 434,2 |
| guerreiro | 20 | 12,1 | 23 | 56,8 | 172,9 |
| guerreiro | 25 | 14 | 25 | 63,8 | 261,7 |
| guerreiro | 30 | 17,2 | 21,6 | 59,8 | 183 |
| mago | 20 | 29,6 | 42,9 | 119,4 | 435,8 |
| mago | 25 | 33,8 | 46,9 | 111,8 | 456,3 |
| mago | 30 | 34,9 | 40,6 | 114 | 438,3 |
| arqueiro | 20 | 26,8 | 48 | 136,5 | 490,9 |
| arqueiro | 25 | 30,2 | 49,9 | 131,6 | 478,7 |
| arqueiro | 30 | 38,3 | 52,5 | 137 | 513,2 |

### Ouro por minuto e custo do primeiro tomo (sem desconto; só ouro direto, sem venda de loot)

| Classe | Nível | Fácil | Normal | Difícil | Pesadelo | Tomo no Normal (min) | Tomo no Pesadelo (min) |
|---|---|---|---|---|---|---|---|
| aventureiro | 20 | 235,7 | 235,9 | 240,1 | 183,7 | 42,4 | 54,4 |
| aventureiro | 25 | 259,2 | 233,2 | 235,4 | 230,1 | 42,9 | 43,5 |
| aventureiro | 30 | 261,9 | 250,8 | 198,4 | 209,8 | 39,9 | 47,7 |
| guerreiro | 20 | 124,4 | 151,2 | 129,2 | 126 | 66,1 | 79,3 |
| guerreiro | 25 | 146,5 | 165,9 | 141,7 | 149,3 | 60,3 | 67 |
| guerreiro | 30 | 134,1 | 136,2 | 114,9 | 107,9 | 73,4 | 92,7 |
| mago | 20 | 369,5 | 271,7 | 236,4 | 187 | 36,8 | 53,5 |
| mago | 25 | 374,5 | 213,4 | 241,7 | 239,1 | 46,9 | 41,8 |
| mago | 30 | 282,9 | 232,3 | 219,1 | 251,3 | 43 | 39,8 |
| arqueiro | 20 | 361,6 | 376 | 293,8 | 317 | 26,6 | 31,5 |
| arqueiro | 25 | 351,8 | 322,2 | 288 | 278 | 31 | 36 |
| arqueiro | 30 | 440,9 | 336,4 | 323,6 | 265,2 | 29,7 | 37,7 |

