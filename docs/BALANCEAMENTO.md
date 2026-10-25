# Balanceamento

**Versão:** 1.4 · **Data:** 25/10/2026

> Gerado por `npm run balancear -- --registrar` (tools/balanceamento, D-061). As metas ficam em
> `src/data/balance.json → metas`; o teste `tests/sim/ritmo.test.ts` protege as principais. Os números que mudaram
> e o antes e depois das calibragens estão em docs/DECISOES.md (D-061, D-071, D-074, D-075, D-076 e D-078).

Sementes: 8 por cenário (1000, 8919, 16838, 24757, 32676, 40595, 48514, 56433). Balance versão 36.

## Resultado: 93/94 metas aprovadas

- ✗ build: aventureiro focada vence a dispersa: 43,8% (meta 60–100%)

## Tabelas

### Inimigo comum do mesmo nível, lutas em sequência (mediana)

| Classe | Nível | Golpes | Tempo | Derrotas do jogador |
|---|---|---|---|---|
| aventureiro | 1 | 4 | 4,9 s | 0 |
| aventureiro | 5 | 4 | 4,8 s | 0 |
| aventureiro | 10 | 5 | 6,5 s | 0 |
| guerreiro | 1 | 4 | 5 s | 0 |
| guerreiro | 5 | 4 | 4 s | 0 |
| guerreiro | 10 | 4 | 4,9 s | 0 |
| mago | 1 | 4 | 5,2 s | 0 |
| mago | 5 | 4 | 3,9 s | 0 |
| mago | 10 | 3 | 4 s | 0 |
| arqueiro | 1 | 4 | 4,4 s | 0 |
| arqueiro | 5 | 5 | 4,9 s | 0 |
| arqueiro | 10 | 5 | 5,6 s | 0 |
| necromante | 1 | 4 | 5,1 s | 0 |
| necromante | 5 | 4 | 5,1 s | 0 |
| necromante | 10 | 5 | 6,8 s | 0 |

### Quanto o jogador aguenta de um comum (mediana)

| Classe | Nível | Golpes recebidos | Tempo |
|---|---|---|---|
| aventureiro | 1 | 8 | 20,9 s |
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
| aventureiro | 1 | 26,3 s | 0 |
| aventureiro | 2 | 23,5 s | 0 |
| aventureiro | 4 | 20,9 s | 0 |
| aventureiro | 6 | 20,8 s | 0 |
| guerreiro | 1 | 26 s | 0 |
| guerreiro | 2 | 19,5 s | 0 |
| guerreiro | 4 | 21 s | 0 |
| guerreiro | 6 | 19 s | 0 |
| mago | 1 | 33,7 s | 0 |
| mago | 2 | 24 s | 0 |
| mago | 4 | 22,9 s | 0 |
| mago | 6 | 21,8 s | 0 |
| arqueiro | 1 | 30,4 s | 0 |
| arqueiro | 2 | 19,9 s | 0 |
| arqueiro | 4 | 23,3 s | 0 |
| arqueiro | 6 | 22,3 s | 0 |
| necromante | 1 | 30,8 s | 0 |
| necromante | 2 | 19,8 s | 0 |
| necromante | 4 | 20,8 s | 0 |
| necromante | 6 | 21,7 s | 0 |

### Dificuldades (aventureiro; comum no nível 5, chefe sozinho)

| Dificuldade | Tempo no comum | Golpes que aguenta | Chefe (vitórias) | Derrotas no chefe |
|---|---|---|---|---|
| facil | 4 s | 12 | 23 s | 0/4 |
| normal | 5 s | 8 | 27,3 s | 0/4 |
| dificil | 7 s | 6 | 34,8 s | 1/4 |
| pesadelo | 10 s | 6 | 38,5 s | 1/4 |

### PvP no Livre (nível 10, com o clamp do modo)

| Classe | Tempo para cair |
|---|---|
| aventureiro | 7,5 s |
| guerreiro | 9,3 s |
| mago | 6,9 s |
| arqueiro | 6,8 s |
| necromante | 9,2 s |

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
| aventureiro | 43,8% | 87,5% |
| guerreiro | 87,5% | 81,3% |
| mago | 87,5% | 68,8% |
| arqueiro | 75% | 81,3% |
| necromante | 81,3% | 68,8% |

### Economia (nível 5, comuns em sequência)

| Classe | XP por minuto | Ouro por minuto (estimado) |
|---|---|---|
| aventureiro | 162,6 | 97,5 |
| guerreiro | 304,7 | 182,8 |
| mago | 448,9 | 269,3 |
| arqueiro | 196,9 | 118,1 |
| necromante | 175 | 105 |
| invocação | 18,9% do dano | — |

### Faixa avançada (equipamento raro, Normal, duas sementes; informativo)

| Classe | Nível | Build | Tempo no comum (s) | Vitórias |
|---|---|---|---|---|
| aventureiro | 20 | focada | 10 | 12/12 |
| aventureiro | 20 | dispersa | 5,3 | 12/12 |
| aventureiro | 25 | focada | 9,4 | 12/12 |
| aventureiro | 25 | dispersa | 5,5 | 12/12 |
| aventureiro | 30 | focada | 10,9 | 12/12 |
| aventureiro | 30 | dispersa | 4,2 | 12/12 |
| guerreiro | 20 | focada | 11,6 | 12/12 |
| guerreiro | 20 | dispersa | 6,3 | 12/12 |
| guerreiro | 25 | focada | 8,4 | 12/12 |
| guerreiro | 25 | dispersa | 5,8 | 12/12 |
| guerreiro | 30 | focada | 12,8 | 12/12 |
| guerreiro | 30 | dispersa | 5,8 | 12/12 |
| mago | 20 | focada | 4 | 12/12 |
| mago | 20 | dispersa | 5,2 | 12/12 |
| mago | 25 | focada | 7,5 | 12/12 |
| mago | 25 | dispersa | 5,7 | 12/12 |
| mago | 30 | focada | 9,2 | 12/12 |
| mago | 30 | dispersa | 5,7 | 12/12 |
| arqueiro | 20 | focada | 5,8 | 12/12 |
| arqueiro | 20 | dispersa | 4,7 | 12/12 |
| arqueiro | 25 | focada | 7,2 | 12/12 |
| arqueiro | 25 | dispersa | 4,1 | 12/12 |
| arqueiro | 30 | focada | 7,3 | 12/12 |
| arqueiro | 30 | dispersa | 4,4 | 12/12 |
| necromante | 20 | focada | 13,8 | 12/12 |
| necromante | 20 | dispersa | 10,1 | 12/12 |
| necromante | 25 | focada | 13 | 12/12 |
| necromante | 25 | dispersa | 10,2 | 12/12 |
| necromante | 30 | focada | 14,2 | 12/12 |
| necromante | 30 | dispersa | 11,7 | 12/12 |

### XP por minuto na faixa avançada (build focada, equipamento raro; nível 30 é o teto)

| Classe | Nível | Fácil | Normal | Difícil | Pesadelo |
|---|---|---|---|---|---|
| aventureiro | 20 | 20,4 | 33,4 | 103,2 | 362,5 |
| aventureiro | 25 | 22,5 | 38,4 | 105 | 418,7 |
| aventureiro | 30 | 25,3 | 37,7 | 111,4 | 450,1 |
| guerreiro | 20 | 37,1 | 44,7 | 47,9 | 139,3 |
| guerreiro | 25 | 35,3 | 35,4 | 82,8 | 246,4 |
| guerreiro | 30 | 50 | 42,8 | 78,6 | 216,5 |
| mago | 20 | 47,6 | 102,5 | 239,5 | 693,7 |
| mago | 25 | 60,6 | 93,2 | 238 | 562,6 |
| mago | 30 | 82,3 | 89,7 | 186,6 | 468,2 |
| arqueiro | 20 | 23,1 | 41,8 | 120,1 | 426,1 |
| arqueiro | 25 | 26,3 | 43,9 | 105,9 | 412,9 |
| arqueiro | 30 | 31,3 | 44,4 | 115,7 | 439,1 |
| necromante | 20 | 7,1 | 14,7 | 40,4 | 161,5 |
| necromante | 25 | 13,2 | 22,5 | 51,8 | 192,7 |
| necromante | 30 | 18,5 | 26,6 | 74,6 | 259,6 |

### Ouro por minuto e custo do primeiro tomo (sem desconto; só ouro direto, sem venda de loot)

| Classe | Nível | Fácil | Normal | Difícil | Pesadelo | Tomo no Normal (min) | Tomo no Pesadelo (min) |
|---|---|---|---|---|---|---|---|
| aventureiro | 20 | 236,6 | 240,7 | 209,5 | 163,1 | 41,5 | 61,3 |
| aventureiro | 25 | 242,4 | 250,3 | 216,3 | 237,4 | 39,9 | 42,1 |
| aventureiro | 30 | 275,4 | 194,3 | 204,7 | 252,8 | 51,5 | 39,6 |
| guerreiro | 20 | 463,4 | 247,8 | 85,1 | 64,2 | 40,4 | 155,8 |
| guerreiro | 25 | 388 | 228,6 | 138,7 | 135,5 | 43,7 | 73,8 |
| guerreiro | 30 | 520,7 | 231,6 | 149,9 | 144,2 | 43,2 | 69,3 |
| mago | 20 | 675,3 | 743,1 | 486,4 | 351,2 | 13,5 | 28,5 |
| mago | 25 | 723,5 | 508,6 | 512,5 | 317,1 | 19,7 | 31,5 |
| mago | 30 | 857,8 | 492 | 444,7 | 231,7 | 20,3 | 43,2 |
| arqueiro | 20 | 353,1 | 326 | 221,9 | 264,6 | 30,7 | 37,8 |
| arqueiro | 25 | 341,8 | 280,8 | 257,9 | 197,2 | 35,6 | 50,7 |
| arqueiro | 30 | 327,4 | 314,4 | 257,7 | 261,9 | 31,8 | 38,2 |
| necromante | 20 | 105,5 | 128,4 | 69,7 | 97,2 | 77,9 | 102,9 |
| necromante | 25 | 146,8 | 119,8 | 106,8 | 112,6 | 83,4 | 88,8 |
| necromante | 30 | 201,8 | 150,9 | 130,2 | 173,3 | 66,3 | 57,7 |

