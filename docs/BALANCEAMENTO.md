# Balanceamento

**Versão:** 1.4 · **Data:** 30/10/2026

> Gerado por `npm run balancear -- --registrar` (tools/balanceamento, D-061). As metas ficam em
> `src/data/balance.json → metas`; o teste `tests/sim/ritmo.test.ts` protege as principais. Os números que mudaram
> e o antes e depois das calibragens estão em docs/DECISOES.md (D-061, D-071, D-074, D-075, D-076 e D-078).

Sementes: 8 por cenário (1000, 8919, 16838, 24757, 32676, 40595, 48514, 56433). Balance versão 36.

## Resultado: 125/125 metas aprovadas


## Tabelas

### Inimigo comum do mesmo nível, lutas em sequência (mediana)

| Classe | Nível | Golpes | Tempo | Derrotas do jogador |
|---|---|---|---|---|
| aventureiro | 1 | 4 | 4,7 s | 0 |
| aventureiro | 5 | 5 | 5,8 s | 0 |
| aventureiro | 10 | 5 | 6 s | 0 |
| guerreiro | 1 | 5 | 6 s | 0 |
| guerreiro | 5 | 4 | 4,1 s | 0 |
| guerreiro | 10 | 4 | 5 s | 0 |
| mago | 1 | 4 | 5,6 s | 0 |
| mago | 5 | 4 | 5,2 s | 0 |
| mago | 10 | 3 | 4,3 s | 0 |
| arqueiro | 1 | 4 | 4,8 s | 0 |
| arqueiro | 5 | 5 | 4,6 s | 0 |
| arqueiro | 10 | 4 | 4,2 s | 0 |
| necromante | 1 | 4 | 5,4 s | 0 |
| necromante | 5 | 4 | 5,1 s | 0 |
| necromante | 10 | 5 | 6,7 s | 0 |

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
| aventureiro | 1 | 28,1 s | 0 |
| aventureiro | 2 | 26,7 s | 0 |
| aventureiro | 4 | 28 s | 0 |
| aventureiro | 6 | 21,3 s | 0 |
| guerreiro | 1 | 32,8 s | 0 |
| guerreiro | 2 | 26,2 s | 0 |
| guerreiro | 4 | 28,9 s | 0 |
| guerreiro | 6 | 22,1 s | 0 |
| mago | 1 | 33,7 s | 1 |
| mago | 2 | 21,6 s | 0 |
| mago | 4 | 25 s | 0 |
| mago | 6 | 23,2 s | 0 |
| arqueiro | 1 | 36,1 s | 0 |
| arqueiro | 2 | 24,9 s | 0 |
| arqueiro | 4 | 25,4 s | 0 |
| arqueiro | 6 | 22,4 s | 0 |
| necromante | 1 | 33 s | 0 |
| necromante | 2 | 25,6 s | 0 |
| necromante | 4 | 23,6 s | 0 |
| necromante | 6 | 21,1 s | 0 |

### Dificuldades (aventureiro; comum no nível 5, chefe sozinho)

| Dificuldade | Tempo no comum | Golpes que aguenta | Chefe (vitórias) | Derrotas no chefe |
|---|---|---|---|---|
| facil | 4,3 s | 12 | 16,1 s | 0/4 |
| normal | 5,9 s | 8 | 29,8 s | 0/4 |
| dificil | 7,7 s | 7 | 33,3 s | 3/4 |
| pesadelo | 10,2 s | 6 | — | 4/4 |

### PvP no Livre (nível 10, com o clamp do modo)

| Classe | Tempo para cair |
|---|---|
| aventureiro | 7 s |
| guerreiro | 6,9 s |
| mago | 6,9 s |
| arqueiro | 6,8 s |
| necromante | 7,5 s |

### Aviso útil das habilidades inimigas (p95 aproximado da rede)

| Habilidade | Quem usa | Conjuração | Suportado (150 ms) | Degradado (250 ms) |
|---|---|---|---|---|
| golpe | goblin, troll, lobo, sombra, sentinela, servo_ossuario, falcao_companheiro, esqueleto_profano, espectro, copia_ilusoria, falcao_espectral | 600 ms | 323 ms | 123 ms |
| golpe_pesado | orc, cavaleiro_da_morte | 600 ms | 323 ms | 123 ms |
| golpe_viscoso | slime | 600 ms | 323 ms | 123 ms |
| raio_vampirico | vampiro | 504 ms | 352 ms | 152 ms |
| teia | aranha | 504 ms | 370 ms | 170 ms |
| golpe_demoniaco | boss | 700 ms | 423 ms | 223 ms |
| flecha | esqueleto, flecha_ancora | 700 ms | 548 ms | 348 ms |
| marca_de_area | cultista, boss | 1200 ms | 923 ms | 723 ms |

### Builds na arena (ficha inteira, nível 8)

| Classe | Focada vence a dispersa | Equipado (raro) vence o sem equipamento |
|---|---|---|
| aventureiro | 70,3% | 98,4% |
| guerreiro | 100% | 89,1% |
| mago | 84,4% | 87,5% |
| arqueiro | 82% | 90,6% |
| necromante | 79,7% | 96,9% |

### Economia (nível 5, comuns em sequência)

| Classe | XP por minuto | Ouro por minuto (estimado) |
|---|---|---|
| aventureiro | 191,2 | 114,7 |
| guerreiro | 246,9 | 148,1 |
| mago | 236,8 | 142,1 |
| arqueiro | 180,9 | 108,6 |
| necromante | 172,3 | 103,4 |
| invocação | 21,5% do dano | — |

### Faixa avançada (equipamento raro, Normal, duas sementes; informativo)

| Classe | Nível | Build | Tempo no comum (s) | Vitórias |
|---|---|---|---|---|
| aventureiro | 20 | focada | 4,9 | 12/12 |
| aventureiro | 20 | dispersa | 5,1 | 12/12 |
| aventureiro | 25 | focada | 7,4 | 12/12 |
| aventureiro | 25 | dispersa | 4,4 | 12/12 |
| aventureiro | 30 | focada | 7,4 | 12/12 |
| aventureiro | 30 | dispersa | 3,9 | 12/12 |
| guerreiro | 20 | focada | 5,1 | 12/12 |
| guerreiro | 20 | dispersa | 4,2 | 12/12 |
| guerreiro | 25 | focada | 5 | 12/12 |
| guerreiro | 25 | dispersa | 4,5 | 12/12 |
| guerreiro | 30 | focada | 5 | 12/12 |
| guerreiro | 30 | dispersa | 3,7 | 12/12 |
| mago | 20 | focada | 5,8 | 12/12 |
| mago | 20 | dispersa | 5,5 | 12/12 |
| mago | 25 | focada | 6,4 | 12/12 |
| mago | 25 | dispersa | 6 | 12/12 |
| mago | 30 | focada | 6,4 | 12/12 |
| mago | 30 | dispersa | 3,6 | 12/12 |
| arqueiro | 20 | focada | 6,4 | 12/12 |
| arqueiro | 20 | dispersa | 3,5 | 12/12 |
| arqueiro | 25 | focada | 4,5 | 12/12 |
| arqueiro | 25 | dispersa | 5 | 12/12 |
| arqueiro | 30 | focada | 8,9 | 12/12 |
| arqueiro | 30 | dispersa | 3,4 | 12/12 |
| necromante | 20 | focada | 8,8 | 12/12 |
| necromante | 20 | dispersa | 7,9 | 12/12 |
| necromante | 25 | focada | 11,3 | 12/12 |
| necromante | 25 | dispersa | 7,8 | 12/12 |
| necromante | 30 | focada | 11,7 | 12/12 |
| necromante | 30 | dispersa | 7,8 | 12/12 |

### XP por minuto na faixa avançada (build focada, equipamento raro)

| Classe | Nível | Fácil | Normal | Difícil | Pesadelo |
|---|---|---|---|---|---|
| aventureiro | 20 | 29,9 | 53,2 | 198,8 | 596,5 |
| aventureiro | 25 | 38,6 | 67,5 | 190,2 | 557,8 |
| aventureiro | 30 | 49,2 | 76,5 | 212,6 | 641,4 |
| guerreiro | 20 | 78,3 | 56 | 109,9 | 315,4 |
| guerreiro | 25 | 109,6 | 77 | 91,6 | 372,8 |
| guerreiro | 30 | 148,7 | 91 | 93,8 | 368,8 |
| mago | 20 | 37,2 | 43,2 | 132,4 | 452,7 |
| mago | 25 | 50,5 | 56 | 150,5 | 502,4 |
| mago | 30 | 61,4 | 56,5 | 209,4 | 549,7 |
| arqueiro | 20 | 22,8 | 53,6 | 135,5 | 408,1 |
| arqueiro | 25 | 26,5 | 62,1 | 112,3 | 420,8 |
| arqueiro | 30 | 40,3 | 61 | 125,8 | 424,1 |
| necromante | 20 | 15 | 25 | 73,6 | 260,4 |
| necromante | 25 | 20 | 33 | 75,5 | 280,3 |
| necromante | 30 | 24,4 | 38 | 85,6 | 302,6 |

### Níveis altos (equipamento raro do nível, Normal, duas sementes)

| Classe | Nível | Vitórias | Tempo no comum (s) |
|---|---|---|---|
| aventureiro | 50 | 100% | 4,8 |
| aventureiro | 75 | 100% | 3,7 |
| aventureiro | 100 | 100% | 5,6 |
| guerreiro | 50 | 100% | 4,8 |
| guerreiro | 75 | 100% | 4 |
| guerreiro | 100 | 100% | 7,8 |
| mago | 50 | 100% | 5,8 |
| mago | 75 | 100% | 5,5 |
| mago | 100 | 100% | 3,4 |
| arqueiro | 50 | 100% | 4,5 |
| arqueiro | 75 | 100% | 4,9 |
| arqueiro | 100 | 100% | 5,8 |
| necromante | 50 | 100% | 9,3 |
| necromante | 75 | 100% | 7 |
| necromante | 100 | 100% | 7,5 |

### Ritmo até o 100 (só combate, mediana das classes)

| Trecho | Minutos de combate |
|---|---|
| 1 › 30 | 515,3 |
| 30 › 100 | 5141,9 |

### Ouro por minuto e custo do primeiro tomo (sem desconto; só ouro direto, sem venda de loot)

| Classe | Nível | Fácil | Normal | Difícil | Pesadelo | Tomo no Normal (min) | Tomo no Pesadelo (min) |
|---|---|---|---|---|---|---|---|
| aventureiro | 20 | 292,8 | 392,6 | 448,2 | 302 | 25,5 | 33,1 |
| aventureiro | 25 | 391,4 | 435,4 | 329,9 | 226,2 | 23 | 44,2 |
| aventureiro | 30 | 451 | 500 | 337,7 | 302,6 | 20 | 33,1 |
| guerreiro | 20 | 868,7 | 301 | 229,9 | 134 | 33,2 | 74,6 |
| guerreiro | 25 | 1048,7 | 389,6 | 198,1 | 166,5 | 25,7 | 60 |
| guerreiro | 30 | 1228,7 | 459,6 | 188,4 | 203,9 | 21,8 | 49 |
| mago | 20 | 565,3 | 315,3 | 298,6 | 305,6 | 31,7 | 32,7 |
| mago | 25 | 645,7 | 380,2 | 274 | 303 | 26,3 | 33 |
| mago | 30 | 662,5 | 374,9 | 509,4 | 300,8 | 26,7 | 33,2 |
| arqueiro | 20 | 316,5 | 390,8 | 201,8 | 175,2 | 25,6 | 57,1 |
| arqueiro | 25 | 268,3 | 352,1 | 276,5 | 274,8 | 28,4 | 36,4 |
| arqueiro | 30 | 424 | 365,8 | 300,7 | 225,9 | 27,3 | 44,3 |
| necromante | 20 | 223,2 | 160,5 | 175,8 | 144,3 | 62,3 | 69,3 |
| necromante | 25 | 210,2 | 219,8 | 172,9 | 174,3 | 45,5 | 57,4 |
| necromante | 30 | 286,2 | 216,6 | 180,4 | 184 | 46,2 | 54,3 |

