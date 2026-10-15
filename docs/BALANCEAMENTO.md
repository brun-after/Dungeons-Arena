# Balanceamento

**Versão:** 1.0 · **Data:** 15/10/2026

> Gerado por `npm run balancear -- --registrar` (tools/balanceamento, D-061). As metas ficam em
> `src/data/balance.json → metas`; o teste `tests/sim/ritmo.test.ts` protege as principais. Os números que mudaram
> e o antes e depois da calibragem estão na D-061 (docs/DECISOES.md).

Sementes: 8 por cenário (1000, 8919, 16838, 24757, 32676, 40595, 48514, 56433). Balance versão 16.

## Resultado: 69/69 metas aprovadas


## Tabelas

### Inimigo comum do mesmo nível, lutas em sequência (mediana)

| Classe | Nível | Golpes | Tempo | Derrotas do jogador |
|---|---|---|---|---|
| aventureiro | 1 | 5 | 5,7 s | 0 |
| aventureiro | 5 | 5 | 5,8 s | 0 |
| aventureiro | 10 | 4 | 4,2 s | 0 |
| guerreiro | 1 | 4 | 5,5 s | 0 |
| guerreiro | 5 | 4 | 6,3 s | 0 |
| guerreiro | 10 | 4 | 7 s | 0 |
| mago | 1 | 4 | 5,1 s | 0 |
| mago | 5 | 5 | 5,3 s | 0 |
| mago | 10 | 4 | 4,2 s | 0 |
| arqueiro | 1 | 5 | 5,1 s | 0 |
| arqueiro | 5 | 5 | 5,2 s | 0 |
| arqueiro | 10 | 5 | 4,8 s | 0 |

### Quanto o jogador aguenta de um comum (mediana)

| Classe | Nível | Golpes recebidos | Tempo |
|---|---|---|---|
| aventureiro | 1 | 8 | 21 s |
| aventureiro | 5 | 8 | 21 s |
| aventureiro | 10 | 8 | 21 s |
| guerreiro | 1 | 8 | 21 s |
| guerreiro | 5 | 8 | 21 s |
| guerreiro | 10 | 8 | 21 s |
| mago | 1 | 6 | 16 s |
| mago | 5 | 7 | 18 s |
| mago | 10 | 8 | 21 s |
| arqueiro | 1 | 7 | 20 s |
| arqueiro | 5 | 8 | 21 s |
| arqueiro | 10 | 8 | 21 s |

### Chefe (nível 1, como na fase 1; jogadores no nível 2; grupo com classes misturadas)

| Classe | Grupo | Tempo | Derrotas do grupo |
|---|---|---|---|
| aventureiro | 1 | 33,9 s | 3 |
| aventureiro | 2 | 21,5 s | 0 |
| aventureiro | 4 | 25,5 s | 0 |
| aventureiro | 6 | 18 s | 0 |
| guerreiro | 1 | 29,8 s | 1 |
| guerreiro | 2 | 21,3 s | 0 |
| guerreiro | 4 | 21,6 s | 0 |
| guerreiro | 6 | 23 s | 0 |
| mago | 1 | 36,3 s | 3 |
| mago | 2 | 23,3 s | 0 |
| mago | 4 | 17,3 s | 0 |
| mago | 6 | 16,1 s | 0 |
| arqueiro | 1 | 31,4 s | 0 |
| arqueiro | 2 | 20,9 s | 0 |
| arqueiro | 4 | 16,7 s | 0 |
| arqueiro | 6 | 16,5 s | 0 |

### Dificuldades (aventureiro; comum no nível 5, chefe sozinho)

| Dificuldade | Tempo no comum | Golpes que aguenta | Chefe (vitórias) | Derrotas no chefe |
|---|---|---|---|---|
| facil | 3,3 s | 11 | 26,7 s | 0/4 |
| normal | 5,8 s | 8 | 36,3 s | 2/4 |
| dificil | 9,5 s | 5 | — | 4/4 |
| pesadelo | 12,3 s | 5 | — | 4/4 |

### PvP no Livre (nível 10, com o clamp do modo)

| Classe | Tempo para cair |
|---|---|
| aventureiro | 9,8 s |
| guerreiro | 9,6 s |
| mago | 9,8 s |
| arqueiro | 6,5 s |

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

### Economia (nível 5, comuns em sequência)

| Classe | XP por minuto | Ouro por minuto (estimado) |
|---|---|---|
| aventureiro | 138,9 | 83,3 |
| guerreiro | 148,1 | 88,9 |
| mago | 182,4 | 109,5 |
| arqueiro | 188,1 | 112,8 |
| invocação | 20% do dano | — |

