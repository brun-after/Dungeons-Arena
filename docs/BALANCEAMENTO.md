# Balanceamento

**Versão:** 1.0 · **Data:** 17/10/2026

> Gerado por `npm run balancear -- --registrar` (tools/balanceamento, D-061). As metas ficam em
> `src/data/balance.json → metas`; o teste `tests/sim/ritmo.test.ts` protege as principais. Os números que mudaram
> e o antes e depois da calibragem estão na D-061 (docs/DECISOES.md).

Sementes: 8 por cenário (1000, 8919, 16838, 24757, 32676, 40595, 48514, 56433). Balance versão 18.

## Resultado: 70/77 metas aprovadas

- ✗ comum: mago nível 1, tempo: 3,9 s (meta 4–7 s)
- ✗ comum: mago nível 5, tempo: 3,9 s (meta 4–7 s)
- ✗ comum: mago nível 10, tempo: 3,5 s (meta 4–7 s)
- ✗ comum: arqueiro nível 5, golpes: 6 (meta 3–5)
- ✗ build: aventureiro focada vence a dispersa: 25% (meta 60–100%)
- ✗ build: mago focada vence a dispersa: 43,8% (meta 60–100%)
- ✗ build: arqueiro focada vence a dispersa: 56,3% (meta 60–100%)

## Tabelas

### Inimigo comum do mesmo nível, lutas em sequência (mediana)

| Classe | Nível | Golpes | Tempo | Derrotas do jogador |
|---|---|---|---|---|
| aventureiro | 1 | 5 | 5,5 s | 0 |
| aventureiro | 5 | 5 | 6,3 s | 0 |
| aventureiro | 10 | 4 | 5,1 s | 0 |
| guerreiro | 1 | 4 | 5,3 s | 0 |
| guerreiro | 5 | 4 | 5 s | 0 |
| guerreiro | 10 | 4 | 5 s | 0 |
| mago | 1 | 4 | 3,9 s | 0 |
| mago | 5 | 4 | 3,9 s | 0 |
| mago | 10 | 4 | 3,5 s | 0 |
| arqueiro | 1 | 4 | 4,1 s | 0 |
| arqueiro | 5 | 6 | 5,6 s | 0 |
| arqueiro | 10 | 5 | 5,2 s | 0 |

### Quanto o jogador aguenta de um comum (mediana)

| Classe | Nível | Golpes recebidos | Tempo |
|---|---|---|---|
| aventureiro | 1 | 8 | 21 s |
| aventureiro | 5 | 8 | 21 s |
| aventureiro | 10 | 7 | 21 s |
| guerreiro | 1 | 8 | 21 s |
| guerreiro | 5 | 8 | 21 s |
| guerreiro | 10 | 7 | 18 s |
| mago | 1 | 6 | 16 s |
| mago | 5 | 7 | 18 s |
| mago | 10 | 7 | 18 s |
| arqueiro | 1 | 7 | 20 s |
| arqueiro | 5 | 7 | 18 s |
| arqueiro | 10 | 7 | 18 s |

### Chefe (nível 1, como na fase 1; jogadores no nível 2; grupo com classes misturadas)

| Classe | Grupo | Tempo | Derrotas do grupo |
|---|---|---|---|
| aventureiro | 1 | 27,8 s | 0 |
| aventureiro | 2 | 20,5 s | 0 |
| aventureiro | 4 | 23,8 s | 0 |
| aventureiro | 6 | 15,6 s | 0 |
| guerreiro | 1 | 26 s | 2 |
| guerreiro | 2 | 16,3 s | 0 |
| guerreiro | 4 | 15,9 s | 0 |
| guerreiro | 6 | 14,7 s | 0 |
| mago | 1 | 26,9 s | 0 |
| mago | 2 | 15,6 s | 0 |
| mago | 4 | 19,3 s | 0 |
| mago | 6 | 18,6 s | 0 |
| arqueiro | 1 | 30,4 s | 1 |
| arqueiro | 2 | 15,7 s | 0 |
| arqueiro | 4 | 16,1 s | 0 |
| arqueiro | 6 | 15,7 s | 0 |

### Dificuldades (aventureiro; comum no nível 5, chefe sozinho)

| Dificuldade | Tempo no comum | Golpes que aguenta | Chefe (vitórias) | Derrotas no chefe |
|---|---|---|---|---|
| facil | 3,6 s | 11 | 23,3 s | 0/4 |
| normal | 7,7 s | 8 | 27,8 s | 0/4 |
| dificil | 12 s | 5 | 40,6 s | 3/4 |
| pesadelo | 11,3 s | 5 | — | 4/4 |

### PvP no Livre (nível 10, com o clamp do modo)

| Classe | Tempo para cair |
|---|---|
| aventureiro | 8,8 s |
| guerreiro | 8,1 s |
| mago | 7,8 s |
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

### Builds na arena (ficha inteira, nível 8)

| Classe | Focada vence a dispersa | Equipado (raro) vence o sem equipamento |
|---|---|---|
| aventureiro | 25% | 75% |
| guerreiro | 68,8% | 100% |
| mago | 43,8% | 87,5% |
| arqueiro | 56,3% | 87,5% |

### Economia (nível 5, comuns em sequência)

| Classe | XP por minuto | Ouro por minuto (estimado) |
|---|---|---|
| aventureiro | 164 | 98,4 |
| guerreiro | 201,6 | 121 |
| mago | 262,3 | 157,4 |
| arqueiro | 212,5 | 127,5 |
| invocação | 23,7% do dano | — |

