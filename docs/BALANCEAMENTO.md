# Balanceamento

**Versão:** 1.3 · **Data:** 17/10/2026

> Gerado por `npm run balancear -- --registrar` (tools/balanceamento, D-061). As metas ficam em
> `src/data/balance.json → metas`; o teste `tests/sim/ritmo.test.ts` protege as principais. Os números que mudaram
> e o antes e depois das calibragens estão em docs/DECISOES.md (D-061, D-071, D-074, D-075 e D-076).

Sementes: 8 por cenário (1000, 8919, 16838, 24757, 32676, 40595, 48514, 56433). Balance versão 22.

## Resultado: 77/77 metas aprovadas


## Tabelas

### Inimigo comum do mesmo nível, lutas em sequência (mediana)

| Classe | Nível | Golpes | Tempo | Derrotas do jogador |
|---|---|---|---|---|
| aventureiro | 1 | 5 | 4,5 s | 0 |
| aventureiro | 5 | 5 | 5,6 s | 0 |
| aventureiro | 10 | 5 | 5,9 s | 0 |
| guerreiro | 1 | 5 | 5,8 s | 0 |
| guerreiro | 5 | 3 | 4,3 s | 0 |
| guerreiro | 10 | 4 | 5 s | 0 |
| mago | 1 | 5 | 5,7 s | 0 |
| mago | 5 | 4 | 4,1 s | 0 |
| mago | 10 | 4 | 4,7 s | 0 |
| arqueiro | 1 | 4 | 5,1 s | 0 |
| arqueiro | 5 | 5 | 4,9 s | 0 |
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
| aventureiro | 2 | 22,3 s | 0 |
| aventureiro | 4 | 25,1 s | 0 |
| aventureiro | 6 | 19,7 s | 0 |
| guerreiro | 1 | 26 s | 1 |
| guerreiro | 2 | 20,3 s | 0 |
| guerreiro | 4 | 25,3 s | 0 |
| guerreiro | 6 | 17,8 s | 0 |
| mago | 1 | 38,2 s | 2 |
| mago | 2 | 27 s | 0 |
| mago | 4 | 25,1 s | 0 |
| mago | 6 | 22,1 s | 0 |
| arqueiro | 1 | 30,6 s | 0 |
| arqueiro | 2 | 19,9 s | 0 |
| arqueiro | 4 | 21,5 s | 0 |
| arqueiro | 6 | 17,3 s | 0 |

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
| guerreiro | 8,1 s |
| mago | 8,4 s |
| arqueiro | 6,8 s |

### Aviso útil das habilidades inimigas (p95 aproximado da rede)

| Habilidade | Quem usa | Conjuração | Suportado (150 ms) | Degradado (250 ms) |
|---|---|---|---|---|
| golpe | goblin, troll, lobo, sombra, sentinela | 600 ms | 323 ms | 123 ms |
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
| guerreiro | 87,5% | 81,3% |
| mago | 81,3% | 62,5% |
| arqueiro | 68,8% | 87,5% |

### Economia (nível 5, comuns em sequência)

| Classe | XP por minuto | Ouro por minuto (estimado) |
|---|---|---|
| aventureiro | 177 | 106,2 |
| guerreiro | 274,6 | 164,7 |
| mago | 277,6 | 166,5 |
| arqueiro | 196,9 | 118,1 |
| invocação | 22,5% do dano | — |

### Faixa avançada (equipamento raro, Normal, duas sementes; informativo)

| Classe | Nível | Build | Tempo no comum (s) | Vitórias |
|---|---|---|---|---|
| aventureiro | 20 | focada | 11,4 | 12/12 |
| aventureiro | 20 | dispersa | 5,9 | 12/12 |
| aventureiro | 25 | focada | 12,2 | 11/12 |
| aventureiro | 25 | dispersa | 8 | 12/12 |
| aventureiro | 30 | focada | 15,1 | 10/12 |
| aventureiro | 30 | dispersa | 8,8 | 12/12 |
| guerreiro | 20 | focada | 12,2 | 12/12 |
| guerreiro | 20 | dispersa | 10,5 | 12/12 |
| guerreiro | 25 | focada | 12,3 | 11/12 |
| guerreiro | 25 | dispersa | 8,7 | 12/12 |
| guerreiro | 30 | focada | 22,5 | 9/12 |
| guerreiro | 30 | dispersa | 10,6 | 12/12 |
| mago | 20 | focada | 8,6 | 12/12 |
| mago | 20 | dispersa | 4,8 | 12/12 |
| mago | 25 | focada | 13,1 | 12/12 |
| mago | 25 | dispersa | 4,3 | 12/12 |
| mago | 30 | focada | 10,4 | 12/12 |
| mago | 30 | dispersa | 7,2 | 12/12 |
| arqueiro | 20 | focada | 5,6 | 12/12 |
| arqueiro | 20 | dispersa | 3,6 | 12/12 |
| arqueiro | 25 | focada | 6,7 | 12/12 |
| arqueiro | 25 | dispersa | 3,8 | 12/12 |
| arqueiro | 30 | focada | 7,1 | 12/12 |
| arqueiro | 30 | dispersa | 3,8 | 12/12 |

### XP por minuto na faixa avançada (build focada, equipamento raro; nível 30 é o teto)

| Classe | Nível | Fácil | Normal | Difícil | Pesadelo |
|---|---|---|---|---|---|
| aventureiro | 20 | 20,1 | 38,2 | 108,5 | 396 |
| aventureiro | 25 | 28,3 | 36 | 105,6 | 412 |
| aventureiro | 30 | 26,2 | 44,1 | 115,2 | 478,6 |
| guerreiro | 20 | 10,5 | 14,5 | 33,6 | 131,1 |
| guerreiro | 25 | 10,2 | 18,9 | 44,1 | 127,5 |
| guerreiro | 30 | 11 | 16,9 | 38,4 | 118,4 |
| mago | 20 | 20,2 | 29,5 | 98,7 | 313,5 |
| mago | 25 | 21,4 | 30,9 | 96,4 | 350,3 |
| mago | 30 | 23 | 31,7 | 90,1 | 255,8 |
| arqueiro | 20 | 26,8 | 48 | 136,5 | 490,9 |
| arqueiro | 25 | 30,2 | 49,9 | 131,6 | 478,7 |
| arqueiro | 30 | 38,3 | 52,5 | 137 | 513,2 |

### Ouro por minuto e custo do primeiro tomo (sem desconto; só ouro direto, sem venda de loot)

| Classe | Nível | Fácil | Normal | Difícil | Pesadelo | Tomo no Normal (min) | Tomo no Pesadelo (min) |
|---|---|---|---|---|---|---|---|
| aventureiro | 20 | 235,7 | 235,9 | 258 | 237,6 | 42,4 | 42,1 |
| aventureiro | 25 | 321,8 | 233,2 | 258 | 278,2 | 42,9 | 35,9 |
| aventureiro | 30 | 261,9 | 271,1 | 195,3 | 263,9 | 36,9 | 37,9 |
| guerreiro | 20 | 132,4 | 100,6 | 72,2 | 76,6 | 99,4 | 130,5 |
| guerreiro | 25 | 113,4 | 124 | 99,6 | 79 | 80,6 | 126,6 |
| guerreiro | 30 | 125,8 | 107,2 | 79,1 | 63 | 93,3 | 158,7 |
| mago | 20 | 252,2 | 190,4 | 191,3 | 175,7 | 52,5 | 56,9 |
| mago | 25 | 207,6 | 194,8 | 184,6 | 221,5 | 51,3 | 45,1 |
| mago | 30 | 208,6 | 181,8 | 193 | 160,5 | 55 | 62,3 |
| arqueiro | 20 | 361,6 | 376 | 293,8 | 317 | 26,6 | 31,5 |
| arqueiro | 25 | 351,8 | 322,2 | 288 | 278 | 31 | 36 |
| arqueiro | 30 | 440,9 | 336,4 | 323,6 | 265,2 | 29,7 | 37,7 |

