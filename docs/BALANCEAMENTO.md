# Balanceamento

**Versão:** 1.4 · **Data:** 21/11/2026

> Gerado por `npm run balancear -- --registrar` (tools/balanceamento, D-061). As metas ficam em
> `src/data/balance.json → metas`; o teste `tests/sim/ritmo.test.ts` protege as principais. Os números que mudaram
> e o antes e depois das calibragens estão em docs/DECISOES.md (D-061, D-071, D-074, D-075, D-076 e D-078).

Sementes: 8 por cenário (1000, 8919, 16838, 24757, 32676, 40595, 48514, 56433). Balance versão 39.

## Resultado: 202/202 metas aprovadas


## Tabelas

### Inimigo comum do mesmo nível, lutas em sequência (mediana)

| Classe | Nível | Golpes | Tempo | Derrotas do jogador |
|---|---|---|---|---|
| aventureiro | 1 | 3 | 6,1 s | 0 |
| aventureiro | 5 | 4 | 6,9 s | 0 |
| aventureiro | 10 | 3 | 6 s | 0 |
| guerreiro | 1 | 5 | 5,5 s | 0 |
| guerreiro | 5 | 5 | 6,4 s | 0 |
| guerreiro | 10 | 4 | 3,9 s | 0 |
| mago | 1 | 4 | 5,9 s | 0 |
| mago | 5 | 4 | 5,2 s | 0 |
| mago | 10 | 3 | 5,2 s | 1 |
| arqueiro | 1 | 5 | 5,2 s | 0 |
| arqueiro | 5 | 4 | 5,8 s | 0 |
| arqueiro | 10 | 3 | 4 s | 0 |
| necromante | 1 | 3 | 4,4 s | 0 |
| necromante | 5 | 4 | 4,8 s | 0 |
| necromante | 10 | 4 | 4,7 s | 0 |

### Quanto o jogador aguenta de um comum (mediana)

| Classe | Nível | Golpes recebidos | Tempo |
|---|---|---|---|
| aventureiro | 1 | 8 | 20,4 s |
| aventureiro | 5 | 8 | 19,9 s |
| aventureiro | 10 | 8 | 19 s |
| guerreiro | 1 | 7 | 19,2 s |
| guerreiro | 5 | 7 | 16,9 s |
| guerreiro | 10 | 7 | 16,3 s |
| mago | 1 | 7 | 13,8 s |
| mago | 5 | 7 | 14,8 s |
| mago | 10 | 7 | 15,5 s |
| arqueiro | 1 | 7 | 16 s |
| arqueiro | 5 | 7 | 16,9 s |
| arqueiro | 10 | 8 | 16,3 s |
| necromante | 1 | 7 | 16 s |
| necromante | 5 | 7 | 16,9 s |
| necromante | 10 | 8 | 16,3 s |

### Chefe (nível 1, como na fase 1; jogadores no nível 2; grupo com classes misturadas)

| Classe | Grupo | Tempo | Derrotas do grupo |
|---|---|---|---|
| aventureiro | 1 | 37,3 s | 0 |
| aventureiro | 2 | 26,3 s | 0 |
| aventureiro | 4 | 22,3 s | 0 |
| aventureiro | 6 | 18,7 s | 0 |
| guerreiro | 1 | 31,1 s | 0 |
| guerreiro | 2 | 23,2 s | 0 |
| guerreiro | 4 | 22,8 s | 0 |
| guerreiro | 6 | 18,5 s | 0 |
| mago | 1 | 33,5 s | 1 |
| mago | 2 | 28,8 s | 0 |
| mago | 4 | 24,5 s | 0 |
| mago | 6 | 19,2 s | 0 |
| arqueiro | 1 | 28,8 s | 0 |
| arqueiro | 2 | 23,7 s | 0 |
| arqueiro | 4 | 25,1 s | 0 |
| arqueiro | 6 | 19,4 s | 0 |
| necromante | 1 | 29,3 s | 0 |
| necromante | 2 | 25,4 s | 0 |
| necromante | 4 | 22,3 s | 0 |
| necromante | 6 | 16,8 s | 0 |

### Dificuldades (aventureiro; comum no nível 5, chefe sozinho)

| Dificuldade | Tempo no comum | Golpes que aguenta | Chefe (vitórias) | Derrotas no chefe |
|---|---|---|---|---|
| facil | 5,3 s | 12 | 26,1 s | 0/4 |
| normal | 6,9 s | 8 | 44,9 s | 0/4 |
| dificil | 10,3 s | 7 | 51,7 s | 2/4 |
| pesadelo | 14,1 s | 6 | — | 4/4 |

### PvP no Livre (nível 10, com o clamp do modo)

| Classe | Tempo para cair |
|---|---|
| aventureiro | 5,5 s |
| guerreiro | 8,4 s |
| mago | 6,6 s |
| arqueiro | 7,3 s |
| necromante | 7 s |

### Aviso útil das habilidades inimigas (p95 aproximado da rede)

| Habilidade | Quem usa | Conjuração | Suportado (150 ms) | Degradado (250 ms) |
|---|---|---|---|---|
| salto_do_duende | duende_saltador | 550 ms | 273 ms | 73 ms |
| golpe | goblin, troll, lobo, peregrino, sombra, sentinela, guerreiro_espectral, eco_arcano, servo_ossuario, falcao_companheiro, lobo_companheiro, urso_companheiro, esqueleto_profano, espectro, coruja_ancia, javali_espiritual, copia_ilusoria, falcao_espectral, duende_saltador, runista_medroso, ticaozinho, floquinho, zunzum, breuzinho, sonequinha, pedrico, estatua_de_gelo, torre_engrenada, cabo_voltaico, cogumelo_pulmao, casulo, braseiro, coluna_antiga, pilar_de_cristal, pedregulho, reflexo_do_sonho | 600 ms | 323 ms | 123 ms |
| golpe_pesado | orc, cavaleiro_da_morte, rei_goblin, cavaleiro_profano, fornalheiro, para_raios, guardiao_de_marmore, monarca_de_geodo | 600 ms | 323 ms | 123 ms |
| golpe_viscoso | slime, mae_colmeia | 600 ms | 323 ms | 123 ms |
| golpe_atordoante | cavaleiro_profano | 600 ms | 323 ms | 123 ms |
| soprar_fornalha | fornalheiro | 600 ms | 323 ms | 123 ms |
| toque_silente | silente | 600 ms | 323 ms | 123 ms |
| cogumelo_bomba | esporeiro | 600 ms | 323 ms | 123 ms |
| cogumelo_bomba_rapido | esporeiro | 600 ms | 323 ms | 123 ms |
| picadas | enxame_putrido | 600 ms | 323 ms | 123 ms |
| mordida_faminta | faminto, sombra_roubada | 600 ms | 323 ms | 123 ms |
| flagelo | penitente | 600 ms | 323 ms | 123 ms |
| sopro_de_pluma | pluminha | 600 ms | 323 ms | 123 ms |
| toque_glacial | imperatriz_das_estatuas | 600 ms | 323 ms | 123 ms |
| toque_do_vazio | o_apagador | 600 ms | 323 ms | 123 ms |
| chuva_fisico | almirante_dos_ventos | 600 ms | 323 ms | 123 ms |
| garra_de_harpia | harpia_soberana | 600 ms | 323 ms | 123 ms |
| raio_vampirico | bruxa_do_pantano, necromante_ancestral, espectro_tempestade | 504 ms | 352 ms | 152 ms |
| teia | aranha | 504 ms | 370 ms | 170 ms |
| faisca_da_bobina | bobinadora, maquinista_voltaico | 600 ms | 386 ms | 186 ms |
| fio_cortante | marionetista | 600 ms | 395 ms | 195 ms |
| flecha_de_vento | velejador, almirante_dos_ventos | 600 ms | 395 ms | 195 ms |
| raio_do_juizo | hierofante | 600 ms | 395 ms | 195 ms |
| estilhaco_gelido | escultor_de_geada | 600 ms | 407 ms | 207 ms |
| lasca_de_espelho | espelhante, rei_das_mascaras | 600 ms | 407 ms | 207 ms |
| lufada | ciclonista | 600 ms | 407 ms | 207 ms |
| golpe_demoniaco | boss, dragao_das_ruinas, dragao_fogo, dragao_gelo, dragao_raio, dragao_veneno | 700 ms | 423 ms | 223 ms |
| seta_arcana | piromante_profano | 600 ms | 423 ms | 223 ms |
| caco_de_vidro | vidraceiro | 600 ms | 423 ms | 223 ms |
| faisca_de_vela | candelinha | 600 ms | 423 ms | 223 ms |
| rajada | ciclonista, o_apagador, almirante_dos_ventos, harpia_soberana | 700 ms | 423 ms | 223 ms |
| olho_do_obelisco | obelisco_vigia | 600 ms | 434 ms | 234 ms |
| sorver_seiva | vampiro | 600 ms | 448 ms | 248 ms |
| lanca_de_gelo | dragao_gelo, arcanista_glacial | 750 ms | 473 ms | 273 ms |
| flecha | esqueleto, flecha_ancora, esqueleto_do_ossuario, arcanista_glacial | 700 ms | 548 ms | 348 ms |
| cadeia_raio | bobinadora, maquinista_voltaico | 800 ms | 586 ms | 386 ms |
| pedra_arremessada | arremessador, monarca_de_geodo | 750 ms | 616 ms | 416 ms |
| explosao_psiquico | rei_das_mascaras | 900 ms | 623 ms | 423 ms |
| explosao_sagrado | hierofante | 900 ms | 623 ms | 423 ms |
| raio_em_cadeia | dragao_raio, necromante_ancestral, espectro_tempestade | 875 ms | 661 ms | 461 ms |
| bola_de_fogo | dragao_fogo, piromante_profano | 1000 ms | 723 ms | 523 ms |
| chuva_gelo | imperatriz_das_estatuas | 1000 ms | 723 ms | 523 ms |
| chuva_raio | maquinista_voltaico | 1000 ms | 723 ms | 523 ms |
| chuva_veneno | mae_colmeia | 1000 ms | 723 ms | 523 ms |
| marca_de_area | cultista, boss, rei_goblin, bruxa_do_pantano, dragao_das_ruinas, dragao_fogo, dragao_gelo, dragao_raio, dragao_veneno, necromante_ancestral, piromante_profano, o_apagador, hierofante | 1200 ms | 923 ms | 723 ms |

### Builds na arena (ficha inteira)

| Classe | Dirigida vence a dispersa (nível 8) | Dirigida vence a dispersa (nível 30) | Dirigida vence a dispersa (nível 60) | Equipado (raro) vence o sem equipamento (nível 8) |
|---|---|---|---|---|
| aventureiro | Mestre de Feras 78,1% · Batedor 71,9% · Implacável 64,1% · Sobrevivente 67,2% · Pergaminhista 54,7% | Mestre de Feras 28,1% · Batedor 68,8% · Implacável 23,4% · Sobrevivente 43,8% · Pergaminhista 18,8% | Mestre de Feras 0% · Batedor 65,6% · Implacável 20,3% · Sobrevivente 21,9% · Pergaminhista 0% | 100% |
| guerreiro | Carniceiro 59,4% · Duelista 26,6% · Rúnico 34,4% · Comandante 84,4% · Baluarte 73,4% | Carniceiro 79,7% · Duelista 79,7% · Rúnico 0% · Comandante 4,7% · Baluarte 53,1% | Carniceiro 71,9% · Duelista 0% · Rúnico 81,3% · Comandante 3,1% · Baluarte 65,6% | 78,1% |
| mago | Artilheiro arcano 43% · Ocultista 36,7% · Encantador 58,6% · Guardião arcano 67,2% · Lâmina rúnica 28,9% | Artilheiro arcano 27,3% · Ocultista 17,2% · Encantador 39,1% · Guardião arcano 43,8% · Lâmina rúnica 14,1% | Artilheiro arcano 0% · Ocultista 0% · Encantador 3,1% · Guardião arcano 77,3% · Lâmina rúnica 0% | 92,2% |
| arqueiro | Atirador 70,3% · Mira firme 35,9% · Inabalável 83,6% · Caçador 33,6% · Flecheiro arcano 33,6% | Atirador 32% · Mira firme 25,8% · Inabalável 81,3% · Caçador 7,8% · Flecheiro arcano 28,9% | Atirador 3,1% · Mira firme 11,7% · Inabalável 90,6% · Caçador 0,8% · Flecheiro arcano 14,1% | 98,4% |
| necromante | Senhor da Horda 42,2% · Mestre de Elite 71,9% · Pestilento 35,2% · Pacto de Sangue 6,3% · Ceifador 4,7% | Senhor da Horda 26,6% · Mestre de Elite 67,2% · Pestilento 4,7% · Pacto de Sangue 0% · Ceifador 0% | Senhor da Horda 40,6% · Mestre de Elite 90,6% · Pestilento 10,9% · Pacto de Sangue 0% · Ceifador 0% | 100% |

### Economia (nível 5, comuns em sequência)

| Classe | XP por minuto | Ouro por minuto (estimado) |
|---|---|---|
| aventureiro | 176 | 105,6 |
| guerreiro | 187,9 | 112,7 |
| mago | 156,5 | 93,9 |
| arqueiro | 152,6 | 91,6 |
| necromante | 168,7 | 101,2 |
| invocação | 24,4% do dano | — |

### Faixa avançada (equipamento raro, Normal, duas sementes; informativo)

| Classe | Nível | Build | Tempo no comum (s) | Vitórias |
|---|---|---|---|---|
| aventureiro | 20 | focada | 8,3 | 12/12 |
| aventureiro | 20 | dispersa | 4,9 | 12/12 |
| aventureiro | 25 | focada | 6,4 | 12/12 |
| aventureiro | 25 | dispersa | 4,3 | 12/12 |
| aventureiro | 30 | focada | 8,9 | 12/12 |
| aventureiro | 30 | dispersa | 2,5 | 12/12 |
| guerreiro | 20 | focada | 4,9 | 12/12 |
| guerreiro | 20 | dispersa | 2,6 | 12/12 |
| guerreiro | 25 | focada | 3,1 | 12/12 |
| guerreiro | 25 | dispersa | 2,6 | 12/12 |
| guerreiro | 30 | focada | 3,6 | 12/12 |
| guerreiro | 30 | dispersa | 1,6 | 12/12 |
| mago | 20 | focada | 2,7 | 12/12 |
| mago | 20 | dispersa | 4,8 | 12/12 |
| mago | 25 | focada | 4 | 12/12 |
| mago | 25 | dispersa | 5,3 | 12/12 |
| mago | 30 | focada | 4 | 12/12 |
| mago | 30 | dispersa | 4 | 12/12 |
| arqueiro | 20 | focada | 6 | 12/12 |
| arqueiro | 20 | dispersa | 3,6 | 12/12 |
| arqueiro | 25 | focada | 3,9 | 12/12 |
| arqueiro | 25 | dispersa | 4,1 | 12/12 |
| arqueiro | 30 | focada | 4,6 | 12/12 |
| arqueiro | 30 | dispersa | 3,7 | 12/12 |
| necromante | 20 | focada | 5,1 | 12/12 |
| necromante | 20 | dispersa | 6,7 | 12/12 |
| necromante | 25 | focada | 4,9 | 12/12 |
| necromante | 25 | dispersa | 5,7 | 12/12 |
| necromante | 30 | focada | 5,1 | 12/12 |
| necromante | 30 | dispersa | 6 | 12/12 |

### XP por minuto na faixa avançada (build focada, equipamento raro)

| Classe | Nível | Fácil | Normal | Difícil | Pesadelo |
|---|---|---|---|---|---|
| aventureiro | 20 | 21,9 | 44,7 | 142,2 | 484,4 |
| aventureiro | 25 | 30,3 | 70,9 | 174,5 | 664,7 |
| aventureiro | 30 | 42,2 | 65,3 | 189,3 | 762,5 |
| guerreiro | 20 | 102,9 | 65 | 175,8 | 383,6 |
| guerreiro | 25 | 141,2 | 93,5 | 180,1 | 822,9 |
| guerreiro | 30 | 191,6 | 123,2 | 243,8 | 681,2 |
| mago | 20 | 26,4 | 53,6 | 187,7 | 865,3 |
| mago | 25 | 38,4 | 82,4 | 220,5 | 1183,1 |
| mago | 30 | 76,5 | 82,6 | 245,6 | 1519,9 |
| arqueiro | 20 | 46,5 | 71,1 | 146,3 | 591 |
| arqueiro | 25 | 65,1 | 99,7 | 211,8 | 641,5 |
| arqueiro | 30 | 60,1 | 131 | 256,6 | 885,2 |
| necromante | 20 | 23,5 | 45,2 | 130,8 | 430,2 |
| necromante | 25 | 31,5 | 67,2 | 160,2 | 747,5 |
| necromante | 30 | 45,7 | 78,9 | 197,7 | 881,1 |

### Níveis altos (equipamento raro do nível, Normal, duas sementes)

| Classe | Nível | Vitórias | Tempo no comum (s) |
|---|---|---|---|
| aventureiro | 50 | 100% | 5,2 |
| aventureiro | 75 | 100% | 4,3 |
| aventureiro | 100 | 100% | 5 |
| guerreiro | 50 | 100% | 3,6 |
| guerreiro | 75 | 100% | 4,6 |
| guerreiro | 100 | 100% | 4,5 |
| mago | 50 | 100% | 2,8 |
| mago | 75 | 100% | 3,8 |
| mago | 100 | 100% | 3,4 |
| arqueiro | 50 | 100% | 2,9 |
| arqueiro | 75 | 100% | 3,2 |
| arqueiro | 100 | 100% | 2,9 |
| necromante | 50 | 100% | 4,6 |
| necromante | 75 | 100% | 5,4 |
| necromante | 100 | 100% | 5,7 |

### Ritmo até o 100 (só combate, mediana das classes)

| Trecho | Minutos de combate |
|---|---|
| 1 › 30 | 467,8 |
| 30 › 100 | 5810,4 |

### Mundo: regiões (meio da faixa, equipamento incomum; informativo além das vitórias)

| Região | Nível | Vitórias | XP por hora de combate | Min de combate por nível |
|---|---|---|---|---|
| vila_do_centro | 3 | 100% | 8474 | 0,7 |
| campos_do_oeste | 4 | 100% | 9663 | 0,9 |
| encosta_do_leste | 7 | 100% | 10067 | 2,4 |
| floresta_antiga | 7 | 100% | 15185 | 1,6 |
| ruinas_do_norte | 23 | 97,8% | 4570 | 30,2 |
| pico_gelado | 13 | 98% | 19008 | 4,1 |
| pantano_sombrio | 15 | 98,8% | 30924 | 2,9 |
| bosque_do_sul | 8 | 100% | 17008 | 1,8 |
| colinas_do_sudeste | 11 | 97,5% | 15050 | 4,4 |

### Mundo: covis de boss (no nível do covil; grupo de 3 com classes misturadas)

| Covil | Boss | Nível | Sozinho | Em grupo | Vitórias do grupo |
|---|---|---|---|---|---|
| minas_do_rei_goblin | rei_goblin | 12 | 40,5 s | 32 s | 100% |
| cabana_da_bruxa | bruxa_do_pantano | 18 | 65,5 s | 32,7 s | 100% |
| ninho_do_dragao | dragao_das_ruinas | 28 | 41,3 s | 52,3 s | 100% |

### Ouro por minuto e custo do primeiro tomo (sem desconto; só ouro direto, sem venda de loot)

| Classe | Nível | Fácil | Normal | Difícil | Pesadelo | Tomo no Normal (min) | Tomo no Pesadelo (min) |
|---|---|---|---|---|---|---|---|
| aventureiro | 20 | 339,6 | 273,6 | 253,9 | 232,1 | 36,5 | 43,1 |
| aventureiro | 25 | 370,2 | 507,2 | 393,7 | 389,5 | 19,7 | 25,7 |
| aventureiro | 30 | 410,6 | 383,3 | 409,4 | 401,7 | 26,1 | 24,9 |
| guerreiro | 20 | 1347,4 | 378,9 | 339 | 213,4 | 26,4 | 46,9 |
| guerreiro | 25 | 1593,3 | 504,6 | 340,1 | 287 | 19,8 | 34,8 |
| guerreiro | 30 | 1936,1 | 637,9 | 563,7 | 399,5 | 15,7 | 25 |
| mago | 20 | 377,1 | 359,3 | 402,1 | 497,5 | 27,8 | 20,1 |
| mago | 25 | 515,5 | 496,8 | 446,7 | 630,2 | 20,1 | 15,9 |
| mago | 30 | 761,1 | 516,7 | 433,7 | 964 | 19,4 | 10,4 |
| arqueiro | 20 | 562,8 | 450 | 310,6 | 283,2 | 22,2 | 35,3 |
| arqueiro | 25 | 693 | 537,6 | 472,4 | 323 | 18,6 | 31 |
| arqueiro | 30 | 527,8 | 722 | 575,1 | 427,8 | 13,9 | 23,4 |
| necromante | 20 | 260,5 | 267,6 | 296,2 | 277,8 | 37,4 | 36 |
| necromante | 25 | 403,3 | 388,9 | 353,2 | 381,4 | 25,7 | 26,2 |
| necromante | 30 | 408,5 | 414,6 | 409,3 | 505,2 | 24,1 | 19,8 |

