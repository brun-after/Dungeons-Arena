# Diagnóstico de balanceamento

**Versão:** 1.0 · **Data:** 18/10/2026

Amostras: 960 encontros completos e 3072 repetições com intervenção; 24 cenários estratificados.

Sementes: 1000, 8919, 16838, 24757, 32676, 40595, 48514, 56433. Limite por encontro: 90 s.

## Como interpretar

Cada classe usa as mesmas sementes, nível, dificuldade, alvos e bot. A ficha distribui atributos e ranks como jogadorTipico; usa equipamento inicial e poções iniciais. Inclui todas as classes oficiais, inclusive Necromante. Não há XP, subida de nível, drops ou spawner. O limite é por encontro inteiro. O resultado distingue vitória, morte e limite de tempo; limite nunca conta como morte ou vitória.

Duelo: orc; pressão: orc, goblin e esqueleto simultâneos; atrito: goblin → orc → esqueleto → orc → goblin, sem restaurar HP, mana, recargas ou consumíveis; chefe: boss do mesmo nível. A troca de onda é imediata, preservando posição e invocações. Esses cenários isolam combate, não reproduzem exploração de fases.

Dano efetivo exclui excesso letal, soma o jogador e suas invocações e é separado por fonte. DPS = soma do dano / soma do tempo vivo, incluindo aproximação e conjuração, em todas as tentativas (também derrotas e limites). Cura é HP efetivamente recuperado; escudo é absorção em impactos diretos, não inclui dano periódico. Os custos são os realmente cobrados após afinidades, inclusive ações posteriormente canceladas. Cura por efeito não é atribuída artificialmente à última habilidade.

As taxas exibem intervalo de Wilson de 95% sobre as sementes selecionadas. É incerteza amostral descritiva, não prova de equilíbrio nem garantia sobre jogadores humanos. Sementes iguais pareiam as condições iniciais; mudanças de ações alteram o consumo do RNG, portanto não garantem rolagens idênticas. Comparações múltiplas são exploratórias, sem significância estatística certificada.

As intervenções retiram um fator por vez: cura proporcional do básico (somente classes com esse fator), poções iniciais, ações da barra (passivas/invocações automáticas continuam), ou defesa plana inicial. Os efeitos são condicionais à build e ao bot; não são parcelas aditivas da vantagem. “Sem cura do básico” não desliga todas as curas. Não há ajuste automático dos números do jogo.

## Visão geral por cenário

| Cenário | Classe | Vitórias / n (IC 95%) | Mortes | Limites | DPS | HP final médio % |
|---|---|---|---|---|---|---|
| nível 1 · normal · duelo | aventureiro | 8/8 (67,6–100%) | 0 | 0 | 17,6 | 78,1 |
| nível 1 · normal · duelo | guerreiro | 8/8 (67,6–100%) | 0 | 0 | 15,1 | 63,8 |
| nível 1 · normal · duelo | mago | 8/8 (67,6–100%) | 0 | 0 | 10 | 63,6 |
| nível 1 · normal · duelo | arqueiro | 8/8 (67,6–100%) | 0 | 0 | 16,3 | 91,6 |
| nível 1 · normal · duelo | necromante | 8/8 (67,6–100%) | 0 | 0 | 24,1 | 98,8 |
| nível 1 · normal · pressao | aventureiro | 8/8 (67,6–100%) | 0 | 0 | 16,8 | 55,6 |
| nível 1 · normal · pressao | guerreiro | 8/8 (67,6–100%) | 0 | 0 | 12,6 | 52,2 |
| nível 1 · normal · pressao | mago | 6/8 (40,9–92,9%) | 2 | 0 | 15,6 | 34,2 |
| nível 1 · normal · pressao | arqueiro | 7/8 (52,9–97,8%) | 1 | 0 | 14,7 | 37,2 |
| nível 1 · normal · pressao | necromante | 8/8 (67,6–100%) | 0 | 0 | 20,7 | 61,9 |
| nível 1 · normal · atrito | aventureiro | 8/8 (67,6–100%) | 0 | 0 | 15,1 | 50,5 |
| nível 1 · normal · atrito | guerreiro | 7/8 (52,9–97,8%) | 1 | 0 | 13,9 | 43,7 |
| nível 1 · normal · atrito | mago | 3/8 (13,7–69,4%) | 5 | 0 | 11,6 | 11,7 |
| nível 1 · normal · atrito | arqueiro | 8/8 (67,6–100%) | 0 | 0 | 15,4 | 49,5 |
| nível 1 · normal · atrito | necromante | 8/8 (67,6–100%) | 0 | 0 | 21,9 | 98,3 |
| nível 1 · normal · chefe | aventureiro | 4/8 (21,5–78,5%) | 4 | 0 | 14,8 | 9,8 |
| nível 1 · normal · chefe | guerreiro | 6/8 (40,9–92,9%) | 2 | 0 | 13,3 | 28,5 |
| nível 1 · normal · chefe | mago | 0/8 (0–32,4%) | 8 | 0 | 10,1 | 0 |
| nível 1 · normal · chefe | arqueiro | 8/8 (67,6–100%) | 0 | 0 | 14,2 | 54,1 |
| nível 1 · normal · chefe | necromante | 7/8 (52,9–97,8%) | 1 | 0 | 22,8 | 74,7 |
| nível 1 · pesadelo · duelo | aventureiro | 8/8 (67,6–100%) | 0 | 0 | 11,2 | 61,8 |
| nível 1 · pesadelo · duelo | guerreiro | 7/8 (52,9–97,8%) | 1 | 0 | 7 | 48 |
| nível 1 · pesadelo · duelo | mago | 7/8 (52,9–97,8%) | 1 | 0 | 5,8 | 31,2 |
| nível 1 · pesadelo · duelo | arqueiro | 8/8 (67,6–100%) | 0 | 0 | 8,4 | 66,1 |
| nível 1 · pesadelo · duelo | necromante | 7/8 (52,9–97,8%) | 1 | 0 | 11,6 | 69,1 |
| nível 1 · pesadelo · pressao | aventureiro | 0/8 (0–32,4%) | 8 | 0 | 11,1 | 0 |
| nível 1 · pesadelo · pressao | guerreiro | 0/8 (0–32,4%) | 8 | 0 | 8,6 | 0 |
| nível 1 · pesadelo · pressao | mago | 0/8 (0–32,4%) | 8 | 0 | 9 | 0 |
| nível 1 · pesadelo · pressao | arqueiro | 0/8 (0–32,4%) | 8 | 0 | 9,2 | 0 |
| nível 1 · pesadelo · pressao | necromante | 2/8 (7,1–59,1%) | 6 | 0 | 12,4 | 12,3 |
| nível 1 · pesadelo · atrito | aventureiro | 0/8 (0–32,4%) | 8 | 0 | 8,7 | 0 |
| nível 1 · pesadelo · atrito | guerreiro | 0/8 (0–32,4%) | 8 | 0 | 6,7 | 0 |
| nível 1 · pesadelo · atrito | mago | 0/8 (0–32,4%) | 8 | 0 | 6,5 | 0 |
| nível 1 · pesadelo · atrito | arqueiro | 0/8 (0–32,4%) | 8 | 0 | 9,6 | 0 |
| nível 1 · pesadelo · atrito | necromante | 7/8 (52,9–97,8%) | 1 | 0 | 13,3 | 78,2 |
| nível 1 · pesadelo · chefe | aventureiro | 0/8 (0–32,4%) | 8 | 0 | 8,4 | 0 |
| nível 1 · pesadelo · chefe | guerreiro | 0/8 (0–32,4%) | 8 | 0 | 8,1 | 0 |
| nível 1 · pesadelo · chefe | mago | 0/8 (0–32,4%) | 8 | 0 | 6,7 | 0 |
| nível 1 · pesadelo · chefe | arqueiro | 0/8 (0–32,4%) | 8 | 0 | 7,4 | 0 |
| nível 1 · pesadelo · chefe | necromante | 2/8 (7,1–59,1%) | 6 | 0 | 12,7 | 16 |
| nível 10 · normal · duelo | aventureiro | 8/8 (67,6–100%) | 0 | 0 | 89,8 | 85,7 |
| nível 10 · normal · duelo | guerreiro | 8/8 (67,6–100%) | 0 | 0 | 40,4 | 64,9 |
| nível 10 · normal · duelo | mago | 8/8 (67,6–100%) | 0 | 0 | 50,1 | 76 |
| nível 10 · normal · duelo | arqueiro | 8/8 (67,6–100%) | 0 | 0 | 42,5 | 85,1 |
| nível 10 · normal · duelo | necromante | 8/8 (67,6–100%) | 0 | 0 | 114,7 | 100 |
| nível 10 · normal · pressao | aventureiro | 8/8 (67,6–100%) | 0 | 0 | 50,8 | 58,5 |
| nível 10 · normal · pressao | guerreiro | 8/8 (67,6–100%) | 0 | 0 | 53,3 | 66,4 |
| nível 10 · normal · pressao | mago | 8/8 (67,6–100%) | 0 | 0 | 61 | 48,2 |
| nível 10 · normal · pressao | arqueiro | 8/8 (67,6–100%) | 0 | 0 | 50,1 | 53,1 |
| nível 10 · normal · pressao | necromante | 8/8 (67,6–100%) | 0 | 0 | 77,4 | 61,9 |
| nível 10 · normal · atrito | aventureiro | 8/8 (67,6–100%) | 0 | 0 | 49,8 | 55,9 |
| nível 10 · normal · atrito | guerreiro | 8/8 (67,6–100%) | 0 | 0 | 41,7 | 57,9 |
| nível 10 · normal · atrito | mago | 7/8 (52,9–97,8%) | 1 | 0 | 43,4 | 40,1 |
| nível 10 · normal · atrito | arqueiro | 8/8 (67,6–100%) | 0 | 0 | 44,8 | 35,4 |
| nível 10 · normal · atrito | necromante | 8/8 (67,6–100%) | 0 | 0 | 59,6 | 94,1 |
| nível 10 · normal · chefe | aventureiro | 8/8 (67,6–100%) | 0 | 0 | 59 | 71,8 |
| nível 10 · normal · chefe | guerreiro | 8/8 (67,6–100%) | 0 | 0 | 57,6 | 72,7 |
| nível 10 · normal · chefe | mago | 8/8 (67,6–100%) | 0 | 0 | 46,3 | 89,1 |
| nível 10 · normal · chefe | arqueiro | 8/8 (67,6–100%) | 0 | 0 | 50,4 | 80,3 |
| nível 10 · normal · chefe | necromante | 8/8 (67,6–100%) | 0 | 0 | 81,2 | 99,1 |
| nível 10 · pesadelo · duelo | aventureiro | 8/8 (67,6–100%) | 0 | 0 | 41,6 | 68,8 |
| nível 10 · pesadelo · duelo | guerreiro | 8/8 (67,6–100%) | 0 | 0 | 22 | 61,4 |
| nível 10 · pesadelo · duelo | mago | 8/8 (67,6–100%) | 0 | 0 | 25 | 60,8 |
| nível 10 · pesadelo · duelo | arqueiro | 8/8 (67,6–100%) | 0 | 0 | 23,2 | 48 |
| nível 10 · pesadelo · duelo | necromante | 8/8 (67,6–100%) | 0 | 0 | 45,7 | 78,4 |
| nível 10 · pesadelo · pressao | aventureiro | 0/8 (0–32,4%) | 8 | 0 | 36,7 | 0 |
| nível 10 · pesadelo · pressao | guerreiro | 0/8 (0–32,4%) | 8 | 0 | 34,6 | 0 |
| nível 10 · pesadelo · pressao | mago | 0/8 (0–32,4%) | 8 | 0 | 41,9 | 0 |
| nível 10 · pesadelo · pressao | arqueiro | 0/8 (0–32,4%) | 8 | 0 | 29,7 | 0 |
| nível 10 · pesadelo · pressao | necromante | 2/8 (7,1–59,1%) | 6 | 0 | 40,2 | 7,8 |
| nível 10 · pesadelo · atrito | aventureiro | 0/8 (0–32,4%) | 8 | 0 | 30,6 | 0 |
| nível 10 · pesadelo · atrito | guerreiro | 0/8 (0–32,4%) | 8 | 0 | 20,1 | 0 |
| nível 10 · pesadelo · atrito | mago | 0/8 (0–32,4%) | 8 | 0 | 27,6 | 0 |
| nível 10 · pesadelo · atrito | arqueiro | 0/8 (0–32,4%) | 8 | 0 | 28,4 | 0 |
| nível 10 · pesadelo · atrito | necromante | 6/8 (40,9–92,9%) | 2 | 0 | 39,8 | 54,5 |
| nível 10 · pesadelo · chefe | aventureiro | 8/8 (67,6–100%) | 0 | 0 | 29,2 | 41 |
| nível 10 · pesadelo · chefe | guerreiro | 7/8 (52,9–97,8%) | 1 | 0 | 32,3 | 46,8 |
| nível 10 · pesadelo · chefe | mago | 8/8 (67,6–100%) | 0 | 0 | 30,4 | 67,6 |
| nível 10 · pesadelo · chefe | arqueiro | 4/8 (21,5–78,5%) | 4 | 0 | 22,4 | 26,1 |
| nível 10 · pesadelo · chefe | necromante | 8/8 (67,6–100%) | 0 | 0 | 44,7 | 88,6 |
| nível 30 · normal · duelo | aventureiro | 8/8 (67,6–100%) | 0 | 0 | 120,7 | 79,7 |
| nível 30 · normal · duelo | guerreiro | 7/8 (52,9–97,8%) | 1 | 0 | 28,5 | 41,7 |
| nível 30 · normal · duelo | mago | 8/8 (67,6–100%) | 0 | 0 | 76,7 | 73,7 |
| nível 30 · normal · duelo | arqueiro | 8/8 (67,6–100%) | 0 | 0 | 109,6 | 98 |
| nível 30 · normal · duelo | necromante | 8/8 (67,6–100%) | 0 | 0 | 112,6 | 99,2 |
| nível 30 · normal · pressao | aventureiro | 8/8 (67,6–100%) | 0 | 0 | 107,9 | 61,1 |
| nível 30 · normal · pressao | guerreiro | 0/8 (0–32,4%) | 8 | 0 | 57,5 | 0 |
| nível 30 · normal · pressao | mago | 0/8 (0–32,4%) | 8 | 0 | 85,5 | 0 |
| nível 30 · normal · pressao | arqueiro | 1/8 (2,2–47,1%) | 7 | 0 | 125 | 4,2 |
| nível 30 · normal · pressao | necromante | 4/8 (21,5–78,5%) | 4 | 0 | 96,6 | 22,8 |
| nível 30 · normal · atrito | aventureiro | 7/8 (52,9–97,8%) | 1 | 0 | 92,1 | 47,2 |
| nível 30 · normal · atrito | guerreiro | 0/8 (0–32,4%) | 8 | 0 | 31,7 | 0 |
| nível 30 · normal · atrito | mago | 0/8 (0–32,4%) | 8 | 0 | 58,6 | 0 |
| nível 30 · normal · atrito | arqueiro | 7/8 (52,9–97,8%) | 1 | 0 | 110 | 43,9 |
| nível 30 · normal · atrito | necromante | 8/8 (67,6–100%) | 0 | 0 | 115,4 | 89,9 |
| nível 30 · normal · chefe | aventureiro | 8/8 (67,6–100%) | 0 | 0 | 100,3 | 70,7 |
| nível 30 · normal · chefe | guerreiro | 8/8 (67,6–100%) | 0 | 0 | 88 | 87,1 |
| nível 30 · normal · chefe | mago | 8/8 (67,6–100%) | 0 | 0 | 51,4 | 71,8 |
| nível 30 · normal · chefe | arqueiro | 8/8 (67,6–100%) | 0 | 0 | 112 | 60 |
| nível 30 · normal · chefe | necromante | 8/8 (67,6–100%) | 0 | 0 | 119,2 | 98 |
| nível 30 · pesadelo · duelo | aventureiro | 8/8 (67,6–100%) | 0 | 0 | 67,4 | 58,3 |
| nível 30 · pesadelo · duelo | guerreiro | 0/8 (0–32,4%) | 8 | 0 | 18,7 | 0 |
| nível 30 · pesadelo · duelo | mago | 4/8 (21,5–78,5%) | 4 | 0 | 38,7 | 21,9 |
| nível 30 · pesadelo · duelo | arqueiro | 8/8 (67,6–100%) | 0 | 0 | 70,7 | 71 |
| nível 30 · pesadelo · duelo | necromante | 8/8 (67,6–100%) | 0 | 0 | 59,2 | 70 |
| nível 30 · pesadelo · pressao | aventureiro | 3/8 (13,7–69,4%) | 5 | 0 | 79,1 | 20,5 |
| nível 30 · pesadelo · pressao | guerreiro | 0/8 (0–32,4%) | 8 | 0 | 42,3 | 0 |
| nível 30 · pesadelo · pressao | mago | 0/8 (0–32,4%) | 8 | 0 | 58,8 | 0 |
| nível 30 · pesadelo · pressao | arqueiro | 0/8 (0–32,4%) | 8 | 0 | 84,9 | 0 |
| nível 30 · pesadelo · pressao | necromante | 0/8 (0–32,4%) | 8 | 0 | 46,5 | 0 |
| nível 30 · pesadelo · atrito | aventureiro | 1/8 (2,2–47,1%) | 7 | 0 | 55,8 | 5 |
| nível 30 · pesadelo · atrito | guerreiro | 0/8 (0–32,4%) | 8 | 0 | 20,5 | 0 |
| nível 30 · pesadelo · atrito | mago | 0/8 (0–32,4%) | 8 | 0 | 28,9 | 0 |
| nível 30 · pesadelo · atrito | arqueiro | 0/8 (0–32,4%) | 8 | 0 | 62,5 | 0 |
| nível 30 · pesadelo · atrito | necromante | 1/8 (2,2–47,1%) | 4 | 3 | 65,5 | 30,6 |
| nível 30 · pesadelo · chefe | aventureiro | 8/8 (67,6–100%) | 0 | 0 | 56,8 | 71,7 |
| nível 30 · pesadelo · chefe | guerreiro | 7/8 (52,9–97,8%) | 1 | 0 | 45,8 | 58,7 |
| nível 30 · pesadelo · chefe | mago | 0/8 (0–32,4%) | 8 | 0 | 30,6 | 0 |
| nível 30 · pesadelo · chefe | arqueiro | 8/8 (67,6–100%) | 0 | 0 | 59,9 | 49,7 |
| nível 30 · pesadelo · chefe | necromante | 7/8 (52,9–97,8%) | 1 | 0 | 61 | 69,1 |

## Sinais prioritários para investigar

Até oito diferenças de mortalidade com mais vitórias e ao menos 90% do DPS da classe comparada. A seleção é exploratória; o detalhamento abaixo preserva todos os cenários, inclusive os que não mostraram diferença.

### nível 1 · normal · chefe: arqueiro sobreviveu mais sem perder mais de 10% do DPS

**arqueiro × mago:** 0/8 mortes contra 8/8; 0 contra 0 limites de tempo. arqueiro manteve 140,6% do DPS efetivo de mago. Por encontro, recebeu 110,1 contra 171 HP de dano; recuperou 66,5 contra 76 HP (66,5 contra 76 de poções), gastando 20 contra 19 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 95 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 100 para 25 p.p.; contraste de 75 p.p. e alteração de 49,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### nível 30 · normal · pressao: aventureiro sobreviveu mais sem perder mais de 10% do DPS

**aventureiro × guerreiro:** 0/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 187,7% do DPS efetivo de guerreiro. Por encontro, recebeu 294,8 contra 618,1 HP de dano; recuperou 166 contra 318,6 HP (113,8 contra 248 de poções), gastando 42,3 contra 23,4 mana total e 0 contra 10,5 HP em conjurações. Começou com 325 contra 310 HP e defesa 2 contra 3. Escudos absorveram 0 contra 99; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 100 para 0 p.p.; contraste de 100 p.p. e alteração de 61,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### nível 30 · normal · pressao: aventureiro sobreviveu mais sem perder mais de 10% do DPS

**aventureiro × mago:** 0/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 126,2% do DPS efetivo de mago. Por encontro, recebeu 294,8 contra 576 HP de dano; recuperou 166 contra 256 HP (113,8 contra 256 de poções), gastando 42,3 contra 13,9 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 100 para 0 p.p.; contraste de 100 p.p. e alteração de 61,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### nível 30 · normal · atrito: necromante sobreviveu mais sem perder mais de 10% do DPS

**necromante × guerreiro:** 0/8 mortes contra 8/8; 0 contra 0 limites de tempo. necromante manteve 363,7% do DPS efetivo de guerreiro. Por encontro, recebeu 42,6 contra 704,4 HP de dano; recuperou 0 contra 400,8 HP (0 contra 248 de poções), gastando 47 contra 51,6 mana total e 0 contra 21,4 HP em conjurações. Começou com 307 contra 310 HP e defesa 1 contra 3. Escudos absorveram 32,5 contra 225; invocações causaram 900 contra 0 de dano e receberam 356 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 100 para 50 p.p.; contraste de 50 p.p. e alteração de 62,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### nível 30 · normal · atrito: necromante sobreviveu mais sem perder mais de 10% do DPS

**necromante × mago:** 0/8 mortes contra 8/8; 0 contra 0 limites de tempo. necromante manteve 197,1% do DPS efetivo de mago. Por encontro, recebeu 42,6 contra 595,1 HP de dano; recuperou 0 contra 272,5 HP (0 contra 256 de poções), gastando 47 contra 54,8 mana total e 0 contra 0 HP em conjurações. Começou com 307 contra 320 HP e defesa 1 contra 1. Escudos absorveram 32,5 contra 75; invocações causaram 900 contra 0 de dano e receberam 356 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 100 para 50 p.p.; contraste de 50 p.p. e alteração de 62,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### nível 30 · pesadelo · duelo: aventureiro sobreviveu mais sem perder mais de 10% do DPS

**aventureiro × guerreiro:** 0/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 359,6% do DPS efetivo de guerreiro. Por encontro, recebeu 208,6 contra 604,3 HP de dano; recuperou 73 contra 308,1 HP (65 contra 248 de poções), gastando 24,5 contra 33,6 mana total e 0 contra 13,9 HP em conjurações. Começou com 325 contra 310 HP e defesa 2 contra 3. Escudos absorveram 0 contra 149,3; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 100 para 12,5 p.p.; contraste de 87,5 p.p. e alteração de 57,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### nível 30 · pesadelo · duelo: arqueiro sobreviveu mais sem perder mais de 10% do DPS

**arqueiro × guerreiro:** 0/8 mortes contra 8/8; 0 contra 0 limites de tempo. arqueiro manteve 377,5% do DPS efetivo de guerreiro. Por encontro, recebeu 124,9 contra 604,3 HP de dano; recuperou 32 contra 308,1 HP (32 contra 248 de poções), gastando 30,8 contra 33,6 mana total e 0 contra 13,9 HP em conjurações. Começou com 320 contra 310 HP e defesa 2 contra 3. Escudos absorveram 0 contra 149,3; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 100 para 87,5 p.p.; contraste de 12,5 p.p. e alteração de 3,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### nível 30 · pesadelo · duelo: necromante sobreviveu mais sem perder mais de 10% do DPS

**necromante × guerreiro:** 0/8 mortes contra 8/8; 0 contra 0 limites de tempo. necromante manteve 315,9% do DPS efetivo de guerreiro. Por encontro, recebeu 138,4 contra 604,3 HP de dano; recuperou 46,1 contra 308,1 HP (46,1 contra 248 de poções), gastando 15,3 contra 33,6 mana total e 0 contra 13,9 HP em conjurações. Começou com 307 contra 310 HP e defesa 1 contra 3. Escudos absorveram 16,3 contra 149,3; invocações causaram 64,4 contra 0 de dano e receberam 79,3 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 100 para 37,5 p.p.; contraste de 62,5 p.p. e alteração de 57,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

## nível 1 · normal · duelo

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 6,3 s | — | 1 | 120 | 22 | 0 | 12,3 | 0 |
| guerreiro | 8 s | — | 1 | 120 | 38,9 | 10,5 | 9,6 | 5,3 |
| mago | 11,3 s | — | 1 | 120 | 44,1 | 9,5 | 10 | 0 |
| arqueiro | 7,4 s | — | 1 | 120 | 8 | 0 | 10 | 0 |
| necromante | 5 s | — | 1 | 120 | 1 | 0 | 6 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 0 / 0 / 0 / 0 | 120 / 0 / 0 | 0 | 0 | 4,7 / 2 / 0 / 0 / 0,4 | 2 |
| guerreiro | 0 / 10,5 / 0 / 0 | 120 / 0 / 0 | 0 | 0 | 4,4 / 0,7 / 0 / 0 / 0 | 0,2 |
| mago | 0 / 0 / 9,5 / 0 | 112,1 / 7,9 / 0 | 0 | 0 | 6,8 / 1,2 / 0 / 0 / 0 | 2,2 |
| arqueiro | 0 / 0 / 0 / 0 | 113,5 / 6,5 / 0 | 0 | 0 | 4,1 / 1 / 0 / 0 / 3,2 | 2,5 |
| necromante | 0 / 0 / 0 / 0 | 111,4 / 0 / 8,6 | 0 | 0 | 2,3 / 0,7 / 0 / 0 / 0 | 2,8 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 8,1 / 1 | 7,1 / 1,3 / 2,6 | 0 / 0 | — | 0,1 / 3,3 |
| guerreiro | 9,6 / 0 | 6 / 0,8 / 2,3 | 0 / 0 | — | 0 / 3,9 |
| mago | 10,5 / 1 | 8,6 / 2,3 / 2,6 | 0,1 / 0 | — | 0 / 5,5 |
| arqueiro | 7 / 0 | 6 / 0,8 / 2,5 | 0 / 0 | — | 0 / 3 |
| necromante | 5,4 / 0,1 | 7,3 / 1,6 / 1,9 | 0,8 / 0 | — | 0 / 2,3 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 3,1 | 42,5 | 0 | 6,3 | 0 | — |
| aventureiro | explosao | 1 | 26,1 | 0 | 3 | 0 | — |
| aventureiro | golpe_atordoante | 1 | 17,9 | 0 | 3 | 0 | — |
| aventureiro | ataque_basico | 3 | 33,5 | 0 | 0 | 0 | — |
| guerreiro | investida | 1,8 | 20,3 | 0 | 5,3 | 0 | — |
| guerreiro | redemoinho | 1,8 | 0 | 0 | 0 | 5,3 | — |
| guerreiro | grito_de_guerra | 1 | 0 | 0 | 4 | 0 | — |
| guerreiro | ataque_basico | 5 | 99,8 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 10,5 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 0,1 | 0 | 0 | 0,4 | 0 | — |
| mago | bola_de_fogo | 1 | 17 | 0 | 3 | 0 | — |
| mago | dardo_arcano | 7,5 | 76 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 1 | 3,3 | 0 | 3 | 0 | — |
| mago | raio_em_cadeia | 1 | 15,9 | 0 | 4 | 0 | — |
| mago | efeito:queimando | 0 | 7,9 | 0 | 0 | 0 | — |
| mago | item:pocao_vida | 0,3 | 0 | 9,5 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 1 | 0 | 0 | 3 | 0 | — |
| arqueiro | chuva_de_flechas | 1 | 18,6 | 0 | 4 | 0 | — |
| arqueiro | flecha_venenosa | 1 | 17,1 | 0 | 3 | 0 | — |
| arqueiro | tiro | 4 | 77,8 | 0 | 0 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 6,5 | 0 | 0 | 0 | — |
| necromante | dardo_funesto | 1,5 | 34,5 | 0 | 3 | 0 | — |
| necromante | garras_do_ossuario | 1 | 29,3 | 0 | 3 | 0 | — |
| necromante | toque_funesto | 2,9 | 47,6 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 8,6 | 0 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 117,2% do DPS efetivo de guerreiro. Por encontro, recebeu 22 contra 38,9 HP de dano; recuperou 0 contra 10,5 HP (0 contra 0 de poções), gastando 12,3 contra 9,6 mana total e 0 contra 5,3 HP em conjurações. Começou com 100 contra 93 HP e defesa 2 contra 3. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 0 p.p. e de HP final 14,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 22,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 175,8% do DPS efetivo de mago. Por encontro, recebeu 22 contra 44,1 HP de dano; recuperou 0 contra 9,5 HP (0 contra 9,5 de poções), gastando 12,3 contra 10 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 95 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 14,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 20,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 108,3% do DPS efetivo de arqueiro. Por encontro, recebeu 22 contra 8 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 12,3 contra 10 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 95 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final -13,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 5,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 73,2% do DPS efetivo de necromante. Por encontro, recebeu 22 contra 1 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 12,3 contra 6 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 82 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 8,6 de dano e receberam 0 contra 6,1. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -20,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 7,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 150,1% do DPS efetivo de mago. Por encontro, recebeu 38,9 contra 44,1 HP de dano; recuperou 10,5 contra 9,5 HP (0 contra 9,5 de poções), gastando 9,6 contra 10 mana total e 5,3 contra 0 HP em conjurações. Começou com 93 contra 95 HP e defesa 3 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 0,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -10 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 92,4% do DPS efetivo de arqueiro. Por encontro, recebeu 38,9 contra 8 HP de dano; recuperou 10,5 contra 0 HP (0 contra 0 de poções), gastando 9,6 contra 10 mana total e 5,3 contra 0 HP em conjurações. Começou com 93 contra 95 HP e defesa 3 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final -27,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -16,6 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 62,4% do DPS efetivo de necromante. Por encontro, recebeu 38,9 contra 1 HP de dano; recuperou 10,5 contra 0 HP (0 contra 0 de poções), gastando 9,6 contra 6 mana total e 5,3 contra 0 HP em conjurações. Começou com 93 contra 82 HP e defesa 3 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 8,6 de dano e receberam 0 contra 6,1. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -34,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -14,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 61,6% do DPS efetivo de arqueiro. Por encontro, recebeu 44,1 contra 8 HP de dano; recuperou 9,5 contra 0 HP (9,5 contra 0 de poções), gastando 10 contra 10 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 95 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final -28 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -15 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 41,6% do DPS efetivo de necromante. Por encontro, recebeu 44,1 contra 1 HP de dano; recuperou 9,5 contra 0 HP (9,5 contra 0 de poções), gastando 10 contra 6 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 82 HP e defesa 1 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 8,6 de dano e receberam 0 contra 6,1. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -35,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -13,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**arqueiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. arqueiro manteve 67,6% do DPS efetivo de necromante. Por encontro, recebeu 8 contra 1 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 10 contra 6 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 82 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 8,6 de dano e receberam 0 contra 6,1. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -7,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 1,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### O que mudou ao retirar cada fator

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 17,6 (100% do completo) | 0 / 0 |
| aventureiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | 20,9 | 11,8 (67% do completo) | 0 / 0 |
| aventureiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 2,8 | 17,6 (100% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 8/8; 0; 0 | 0 | 9,9 | 14,8 (98,1% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 15,1 (100% do completo) | 0 / 0 |
| guerreiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | -1,5 | 11,4 (75,7% do completo) | 0 / 0 |
| guerreiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 7,1 | 14,8 (98,1% do completo) | 0 / 0 |
| mago | Sem poções de vida | 8/8; 0; 0 | 0 | 10 | 10 (100% do completo) | 0 / 0 |
| mago | Sem habilidades da barra | 8/8; 0; 0 | 0 | 0,1 | 9,4 (93,8% do completo) | 0 / 0 |
| mago | Defesa plana zerada | 8/8; 0; 0 | 0 | 2,6 | 10 (100% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 16,3 (100% do completo) | 0 / 0 |
| arqueiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | 15,1 | 13,3 (81,4% do completo) | 0 / 0 |
| arqueiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 1,3 | 16,3 (100% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 24,1 (100% do completo) | 0 / 0 |
| necromante | Sem habilidades da barra | 8/8; 0; 0 | 0 | 13,4 | 15,4 (63,9% do completo) | 0 / 0 |
| necromante | Defesa plana zerada | 8/8; 0; 0 | 0 | 0,2 | 24,1 (100% do completo) | 0 / 0 |

## nível 1 · normal · pressao

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 20 s | — | 1 | 318 | 83,3 | 35,8 | 20 | 0 |
| guerreiro | 26,3 s | — | 1 | 318 | 111,8 | 75,4 | 22,4 | 12 |
| mago | 19,2 s | 22,2 s | 0,8 | 308,3 | 129 | 66,5 | 19,3 | 0 |
| arqueiro | 20,9 s | 22 s | 0,9 | 314 | 126,1 | 66,5 | 19,6 | 0 |
| necromante | 15,9 s | — | 1 | 371,6 | 59,5 | 21,8 | 20 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 0,8 / 0 / 35 / 0 | 318 / 0 / 0 | 0 | 0 | 10,4 / 9,7 / 0 / 0 / 6,5 | 1,9 |
| guerreiro | 0 / 24,5 / 50,9 / 0 | 318 / 0 / 0 | 18,9 | 0 | 11,7 / 8,3 / 0 / 1,2 / 3,3 | 1,2 |
| mago | 0 / 0 / 66,5 / 0 | 292,5 / 15,8 / 0 | 1,6 | 0 | 12,1 / 1,2 / 0 / 1,7 / 1,4 | 2,7 |
| arqueiro | 0 / 0 / 66,5 / 0 | 314 / 0 / 0 | 0 | 0 | 10,4 / 1 / 0 / 0,7 / 7,7 | 2,6 |
| necromante | 0 / 13,5 / 8,3 / 0 | 315,6 / 0 / 56 | 0 | 13,5 | 7,2 / 6,6 / 0 / 0 / 1,7 | 3,5 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 19,3 / 2,1 | 16 / 1,6 / 6,9 | 0 / 0 | — | 3,1 / 11,1 |
| guerreiro | 26,6 / 3,1 | 15,4 / 2 / 6,6 | 0,3 / 0 | — | 3,9 / 14,2 |
| mago | 18,4 / 1,6 | 18,8 / 2,6 / 7,8 | 0,9 / 0 | — | 0 / 9,9 |
| arqueiro | 19,3 / 0 | 17,6 / 2,8 / 8 | 0 / 0 | — | 0 / 10,3 |
| necromante | 17,3 / 0,4 | 22,6 / 3,6 / 8,6 | 1,1 / 0 | — | 6,5 / 11,5 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 6,9 | 122,6 | 0 | 13,8 | 0 | — |
| aventureiro | explosao | 1 | 26,1 | 0 | 3 | 0 | — |
| aventureiro | golpe_atordoante | 1 | 18,1 | 0 | 3 | 0 | — |
| aventureiro | ataque_basico | 10,3 | 151,1 | 0 | 0 | 0 | — |
| aventureiro | item:pocao_vida | 0,9 | 0 | 35 | 0 | 0 | — |
| aventureiro | curar | 0,1 | 0 | 0,8 | 0,3 | 0 | 3 |
| guerreiro | investida | 3,8 | 60,6 | 0 | 11,3 | 0 | — |
| guerreiro | redemoinho | 4 | 21,4 | 0 | 0 | 12 | — |
| guerreiro | grito_de_guerra | 1,8 | 0 | 0 | 7 | 0 | — |
| guerreiro | ataque_basico | 15,8 | 236 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 24,5 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 1,4 | 0 | 0 | 4,1 | 0 | — |
| guerreiro | item:pocao_vida | 1,4 | 0 | 50,9 | 0 | 0 | — |
| mago | bola_de_fogo | 2,6 | 53 | 0 | 7,9 | 0 | — |
| mago | dardo_arcano | 12,4 | 156,6 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 2 | 36,1 | 0 | 6 | 0 | — |
| mago | raio_em_cadeia | 1,3 | 46,8 | 0 | 5 | 0 | — |
| mago | item:pocao_vida | 1,8 | 0 | 66,5 | 0 | 0 | — |
| mago | efeito:queimando | 0 | 15,8 | 0 | 0 | 0 | — |
| mago | barreira | 0,1 | 0 | 0 | 0,4 | 0 | — |
| arqueiro | flecha_perfurante | 3,1 | 40,8 | 0 | 9,4 | 0 | — |
| arqueiro | chuva_de_flechas | 1,3 | 21,4 | 0 | 5 | 0 | — |
| arqueiro | flecha_venenosa | 1,8 | 3,1 | 0 | 5,3 | 0 | — |
| arqueiro | tiro | 13,1 | 248,8 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 1,8 | 0 | 66,5 | 0 | 0 | — |
| necromante | dardo_funesto | 4,8 | 95 | 0 | 9,5 | 0 | — |
| necromante | garras_do_ossuario | 2,3 | 65,9 | 0 | 6,8 | 0 | — |
| necromante | toque_funesto | 9,1 | 154,8 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 56 | 0 | 0 | 0 | — |
| necromante | dizimo_vital | 0,8 | 0 | 0 | 2,3 | 0 | — |
| necromante | efeito:cura | 0 | 0 | 13,5 | 0 | 0 | — |
| necromante | comando_sepulcral | 0,4 | 0 | 0 | 1,5 | 0 | — |
| necromante | item:pocao_vida | 0,3 | 0 | 8,3 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 133,4% do DPS efetivo de guerreiro. Por encontro, recebeu 83,3 contra 111,8 HP de dano; recuperou 35,8 contra 75,4 HP (35 contra 50,9 de poções), gastando 20 contra 22,4 mana total e 0 contra 12 HP em conjurações. Começou com 100 contra 93 HP e defesa 2 contra 3. Escudos absorveram 0 contra 18,9; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 0 p.p. e de HP final 3,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 12,5 p.p.; contraste de -12,5 p.p. e alteração de -12,6 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × mago:** 0/8 mortes contra 2/8; 0 contra 0 limites de tempo. aventureiro manteve 108,2% do DPS efetivo de mago. Por encontro, recebeu 83,3 contra 129 HP de dano; recuperou 35,8 contra 66,5 HP (35 contra 66,5 de poções), gastando 20 contra 19,3 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 95 HP e defesa 2 contra 1. Escudos absorveram 0 contra 1,6; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 2 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 25 p.p. e de HP final 21,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 25 para 75 p.p.; contraste de -50 p.p. e alteração de -20,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × arqueiro:** 0/8 mortes contra 1/8; 0 contra 0 limites de tempo. aventureiro manteve 114,2% do DPS efetivo de arqueiro. Por encontro, recebeu 83,3 contra 126,1 HP de dano; recuperou 35,8 contra 66,5 HP (35 contra 66,5 de poções), gastando 20 contra 19,6 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 95 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 12,5 p.p. e de HP final 18,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para 37,5 p.p.; contraste de -25 p.p. e alteração de -1,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 81,5% do DPS efetivo de necromante. Por encontro, recebeu 83,3 contra 59,5 HP de dano; recuperou 35,8 contra 21,8 HP (35 contra 8,3 de poções), gastando 20 contra 20 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 82 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 56 de dano e receberam 0 contra 38,9. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -6,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -25 p.p.; contraste de 25 p.p. e alteração de 26,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × mago:** 0/8 mortes contra 2/8; 0 contra 0 limites de tempo. guerreiro manteve 81,1% do DPS efetivo de mago. Por encontro, recebeu 111,8 contra 129 HP de dano; recuperou 75,4 contra 66,5 HP (50,9 contra 66,5 de poções), gastando 22,4 contra 19,3 mana total e 12 contra 0 HP em conjurações. Começou com 93 contra 95 HP e defesa 3 contra 1. Escudos absorveram 18,9 contra 1,6; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 2 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 25 p.p. e de HP final 17,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 25 para 62,5 p.p.; contraste de -37,5 p.p. e alteração de -30,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 0/8 mortes contra 1/8; 0 contra 0 limites de tempo. guerreiro manteve 85,6% do DPS efetivo de arqueiro. Por encontro, recebeu 111,8 contra 126,1 HP de dano; recuperou 75,4 contra 66,5 HP (50,9 contra 66,5 de poções), gastando 22,4 contra 19,6 mana total e 12 contra 0 HP em conjurações. Começou com 93 contra 95 HP e defesa 3 contra 2. Escudos absorveram 18,9 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 12,5 p.p. e de HP final 14,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para 37,5 p.p.; contraste de -25 p.p. e alteração de 5,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 61,1% do DPS efetivo de necromante. Por encontro, recebeu 111,8 contra 59,5 HP de dano; recuperou 75,4 contra 21,8 HP (50,9 contra 8,3 de poções), gastando 22,4 contra 20 mana total e 12 contra 0 HP em conjurações. Começou com 93 contra 82 HP e defesa 3 contra 1. Escudos absorveram 18,9 contra 0; invocações causaram 0 contra 56 de dano e receberam 0 contra 38,9. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -9,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -25 p.p.; contraste de 25 p.p. e alteração de 32,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × arqueiro:** 2/8 mortes contra 1/8; 0 contra 0 limites de tempo. mago manteve 105,6% do DPS efetivo de arqueiro. Por encontro, recebeu 129 contra 126,1 HP de dano; recuperou 66,5 contra 66,5 HP (66,5 contra 66,5 de poções), gastando 19,3 contra 19,6 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 95 HP e defesa 1 contra 2. Escudos absorveram 1,6 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só mago venceu, 2 só arqueiro venceu; diferença de vitória -12,5 p.p. e de HP final -3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para -50 p.p.; contraste de 37,5 p.p. e alteração de 15,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: arqueiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × necromante:** 2/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 75,3% do DPS efetivo de necromante. Por encontro, recebeu 129 contra 59,5 HP de dano; recuperou 66,5 contra 21,8 HP (66,5 contra 8,3 de poções), gastando 19,3 contra 20 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 82 HP e defesa 1 contra 1. Escudos absorveram 1,6 contra 0; invocações causaram 0 contra 56 de dano e receberam 0 contra 38,9. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 2 só necromante venceu; diferença de vitória -25 p.p. e de HP final -27,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -25 para -62,5 p.p.; contraste de 37,5 p.p. e alteração de 25,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**arqueiro × necromante:** 1/8 mortes contra 0/8; 0 contra 0 limites de tempo. arqueiro manteve 71,3% do DPS efetivo de necromante. Por encontro, recebeu 126,1 contra 59,5 HP de dano; recuperou 66,5 contra 21,8 HP (66,5 contra 8,3 de poções), gastando 19,6 contra 20 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 82 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 56 de dano e receberam 0 contra 38,9. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 1 só necromante venceu; diferença de vitória -12,5 p.p. e de HP final -24,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para -62,5 p.p.; contraste de 50 p.p. e alteração de 27,6 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

### O que mudou ao retirar cada fator

**aventureiro, Sem poções de vida:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 32,6 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Sem cura do básico:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 12,6 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Sem poções de vida:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 39 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Sem habilidades da barra:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve -1,1 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem poções de vida:** retirar esse fator perdeu 4 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 31,4 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem habilidades da barra:** retirar esse fator perdeu 4 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 29,7 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Defesa plana zerada:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 5,1 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem poções de vida:** retirar esse fator perdeu 5 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 33,8 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem habilidades da barra:** retirar esse fator perdeu 2 vitórias e ganhou 1 nas mesmas 8 condições iniciais. O kit completo teve 14,2 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem poções de vida:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 6,3 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem habilidades da barra:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 4,9 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 5/8; 3; 0 | 37,5 | 32,6 | 16,7 (99,4% do completo) | 3 / 0 |
| aventureiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | 9,3 | 12,2 (72,5% do completo) | 0 / 0 |
| aventureiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 0,1 | 16,2 (96,4% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 7/8; 1; 0 | 12,5 | 12,6 | 12,2 (96,6% do completo) | 1 / 0 |
| guerreiro | Sem poções de vida | 5/8; 3; 0 | 37,5 | 39 | 13,1 (103,5% do completo) | 3 / 0 |
| guerreiro | Sem habilidades da barra | 7/8; 1; 0 | 12,5 | -1,1 | 11,2 (88,6% do completo) | 1 / 0 |
| guerreiro | Defesa plana zerada | 8/8; 0; 0 | 0 | -0 | 13,3 (105,6% do completo) | 0 / 0 |
| mago | Sem poções de vida | 2/8; 6; 0 | 50 | 31,4 | 16,1 (103,3% do completo) | 4 / 0 |
| mago | Sem habilidades da barra | 2/8; 6; 0 | 50 | 29,7 | 10,5 (67,3% do completo) | 4 / 0 |
| mago | Defesa plana zerada | 5/8; 3; 0 | 12,5 | 5,1 | 15,8 (101,3% do completo) | 1 / 0 |
| arqueiro | Sem poções de vida | 2/8; 6; 0 | 62,5 | 33,8 | 13,9 (94,5% do completo) | 5 / 0 |
| arqueiro | Sem habilidades da barra | 6/8; 2; 0 | 12,5 | 14,2 | 13,1 (89,2% do completo) | 2 / 1 |
| arqueiro | Defesa plana zerada | 7/8; 1; 0 | 0 | 8,9 | 14,7 (100% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 7/8; 1; 0 | 12,5 | 6,3 | 20,6 (99,9% do completo) | 1 / 0 |
| necromante | Sem habilidades da barra | 6/8; 2; 0 | 25 | 4,9 | 12,6 (61,2% do completo) | 2 / 0 |
| necromante | Defesa plana zerada | 8/8; 0; 0 | 0 | -2,9 | 22,6 (109,6% do completo) | 0 / 0 |

## nível 1 · normal · atrito

### Onde o desgaste aparece

| Classe | Onda | Chegaram/n inicial | Mortes / limites nesta onda | HP entrada → saída | Mana entrada → saída | Recebido / cura / mana gasta |
|---|---|---|---|---|---|---|
| aventureiro | 1 | 8/8 | 0 / 0 | 100 → 87 | 10 → 1,2 | 13 / 0 / 11,5 |
| aventureiro | 2 | 8/8 | 0 / 0 | 87 → 59 | 1,2 → 0,4 | 30,8 / 1,1 / 6,8 |
| aventureiro | 3 | 8/8 | 0 / 0 | 59 → 59,9 | 0,4 → 0,7 | 19,9 / 17 / 5,6 |
| aventureiro | 4 | 8/8 | 0 / 0 | 59,9 → 50,8 | 0,7 → 0,9 | 31,3 / 20 / 4,6 |
| aventureiro | 5 | 8/8 | 0 / 0 | 50,8 → 50,5 | 0,9 → 1 | 26 / 25 / 3,3 |
| guerreiro | 1 | 8/8 | 0 / 0 | 93 → 60,5 | 10 → 5,6 | 37,1 / 7,6 / 7 |
| guerreiro | 2 | 8/8 | 0 / 0 | 60,5 → 51,9 | 5,6 → 3,4 | 24,9 / 18,4 / 8,3 |
| guerreiro | 3 | 8/8 | 0 / 0 | 51,9 → 54,4 | 3,4 → 2,2 | 22,4 / 24,6 / 7,4 |
| guerreiro | 4 | 8/8 | 0 / 0 | 54,4 → 53,8 | 2,2 → 2,4 | 26,3 / 27,9 / 5,1 |
| guerreiro | 5 | 8/8 | 1 / 0 | 53,8 → 40,6 | 2,4 → 1,3 | 21,6 / 10,5 / 4 |
| mago | 1 | 8/8 | 0 / 0 | 95 → 64,1 | 12 → 6,3 | 40,4 / 9,5 / 10 |
| mago | 2 | 8/8 | 0 / 0 | 64,1 → 44,1 | 6,3 → 7 | 48,5 / 28,5 / 4,9 |
| mago | 3 | 8/8 | 0 / 0 | 44,1 → 43,4 | 7 → 2,1 | 29,3 / 28,5 / 9,4 |
| mago | 4 | 8/8 | 4 / 0 | 43,4 → 22,8 | 2,1 → 4 | 21,1 / 0 / 2,3 |
| mago | 5 | 4/8 | 1 / 0 | 45,5 → 22,3 | 4,5 → 5 | 42,3 / 19 / 2,3 |
| arqueiro | 1 | 8/8 | 0 / 0 | 95 → 89,6 | 10 → 1,9 | 5,4 / 0 / 10 |
| arqueiro | 2 | 8/8 | 0 / 0 | 89,6 → 60 | 1,9 → 3,8 | 34,4 / 4,8 / 3 |
| arqueiro | 3 | 8/8 | 0 / 0 | 60 → 57,9 | 3,8 → 0,8 | 25,9 / 23,8 / 6,4 |
| arqueiro | 4 | 8/8 | 0 / 0 | 57,9 → 49 | 0,8 → 3,2 | 23,9 / 14,3 / 2,3 |
| arqueiro | 5 | 8/8 | 0 / 0 | 49 → 47 | 3,2 → 3,3 | 21 / 19 / 2,3 |
| necromante | 1 | 8/8 | 0 / 0 | 82 → 81 | 12 → 7,9 | 1 / 0 / 5,3 |
| necromante | 2 | 8/8 | 0 / 0 | 81 → 81 | 7,9 → 4,9 | 0 / 0 / 6 |
| necromante | 3 | 8/8 | 0 / 0 | 81 → 81,1 | 4,9 → 6,4 | 2,1 / 0 / 7,6 |
| necromante | 4 | 8/8 | 0 / 0 | 81,1 → 81,8 | 6,4 → 6,7 | 0 / 0 / 3 |
| necromante | 5 | 8/8 | 0 / 0 | 81,8 → 80,6 | 6,7 → 5,9 | 1,3 / 0 / 2,6 |

Médias de cada onda incluem apenas quem chegou a ela; o denominador inicial mostra a seleção dos sobreviventes. Não compare a vida da onda 5 como se incluísse quem morreu antes.

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 37,3 s | — | 5 | 534 | 120,9 | 63,1 | 31,8 | 0 |
| guerreiro | 37 s | 45,9 s | 4,9 | 530 | 132,3 | 89 | 31,8 | 18,4 |
| mago | 42,8 s | 35,9 s | 3,9 | 449,4 | 160,4 | 76 | 27,6 | 0 |
| arqueiro | 35,9 s | — | 5 | 534 | 110,5 | 61,8 | 23,9 | 0 |
| necromante | 26,9 s | — | 5 | 569,4 | 4,4 | 0 | 24,5 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 3,1 / 0 / 60 / 0 | 534 / 0 / 0 | 0 | 0 | 18 / 12,4 / 0 / 0,4 / 14,3 | 1,4 |
| guerreiro | 0 / 38,1 / 50,9 / 0 | 530 / 0 / 0 | 22,6 | 0 | 17,5 / 9,8 / 0 / 0,3 / 2,7 | 0,9 |
| mago | 0 / 0 / 76 / 0 | 422,8 / 26,6 / 0 | 6,5 | 0 | 21,4 / 3,5 / 0 / 5,7 / 8,5 | 2,4 |
| arqueiro | 0 / 0 / 61,8 / 0 | 529,4 / 4,6 / 0 | 0 | 0 | 16 / 3,5 / 0 / 0,7 / 17 | 2,5 |
| necromante | 0 / 0 / 0 / 0 | 377,4 / 0 / 192 | 0 | 0 | 9,9 / 8,2 / 0 / 0 / 0,1 | 3,6 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 33,6 / 4,1 | 27,5 / 4,1 / 10,8 | 0 / 0 | — | 8,3 / 22,8 |
| guerreiro | 39,3 / 3,8 | 24,8 / 3 / 10,4 | 0 / 0 | — | 9,3 / 23 |
| mago | 33,4 / 2,6 | 27,3 / 5,1 / 11,1 | 0,1 / 0 | — | 0,5 / 19,9 |
| arqueiro | 29,8 / 0,6 | 27,3 / 3,3 / 10,8 | 0 / 0 | — | 0,8 / 17,2 |
| necromante | 23,5 / 0,4 | 48,8 / 7,9 / 18,5 | 1,4 / 0 | — | 3 / 18,4 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 11,4 | 179,9 | 0 | 22,8 | 0 | — |
| aventureiro | explosao | 1,3 | 24,3 | 0 | 3,8 | 0 | — |
| aventureiro | golpe_atordoante | 1,5 | 26,9 | 0 | 4,5 | 0 | — |
| aventureiro | ataque_basico | 19,1 | 303 | 0 | 0 | 0 | — |
| aventureiro | item:pocao_vida | 1,5 | 0 | 60 | 0 | 0 | — |
| aventureiro | curar | 0,4 | 0 | 3,1 | 0,8 | 0 | 4,2 |
| guerreiro | investida | 5,5 | 93 | 0 | 16,5 | 0 | — |
| guerreiro | redemoinho | 6,1 | 58,1 | 0 | 0 | 18,4 | — |
| guerreiro | grito_de_guerra | 2,5 | 0 | 0 | 10 | 0 | — |
| guerreiro | ataque_basico | 23,4 | 378,9 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 38,1 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 1,8 | 0 | 0 | 5,3 | 0 | — |
| guerreiro | item:pocao_vida | 1,4 | 0 | 50,9 | 0 | 0 | — |
| mago | bola_de_fogo | 4,4 | 81 | 0 | 13,1 | 0 | — |
| mago | dardo_arcano | 24,5 | 318,4 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 2,9 | 5,9 | 0 | 8,6 | 0 | — |
| mago | raio_em_cadeia | 1 | 17,5 | 0 | 4 | 0 | — |
| mago | efeito:queimando | 0 | 26,6 | 0 | 0 | 0 | — |
| mago | barreira | 0,6 | 0 | 0 | 1,9 | 0 | — |
| mago | item:pocao_vida | 2 | 0 | 76 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 4,8 | 81,1 | 0 | 14,3 | 0 | — |
| arqueiro | chuva_de_flechas | 1 | 20,4 | 0 | 4 | 0 | — |
| arqueiro | flecha_venenosa | 1,9 | 22,5 | 0 | 5,6 | 0 | — |
| arqueiro | tiro | 22,1 | 405,4 | 0 | 0 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 4,6 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 1,6 | 0 | 61,8 | 0 | 0 | — |
| necromante | dardo_funesto | 7 | 111,3 | 0 | 14 | 0 | — |
| necromante | garras_do_ossuario | 3,5 | 75,5 | 0 | 10,5 | 0 | — |
| necromante | toque_funesto | 13 | 190,6 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 192 | 0 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 0/8 mortes contra 1/8; 0 contra 0 limites de tempo. aventureiro manteve 108,3% do DPS efetivo de guerreiro. Por encontro, recebeu 120,9 contra 132,3 HP de dano; recuperou 63,1 contra 89 HP (60 contra 50,9 de poções), gastando 31,8 contra 31,8 mana total e 0 contra 18,4 HP em conjurações. Começou com 100 contra 93 HP e defesa 2 contra 3. Escudos absorveram 0 contra 22,6; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 12,5 p.p. e de HP final 6,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para -75 p.p.; contraste de 87,5 p.p. e alteração de 52,6 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × mago:** 0/8 mortes contra 5/8; 0 contra 0 limites de tempo. aventureiro manteve 130,8% do DPS efetivo de mago. Por encontro, recebeu 120,9 contra 160,4 HP de dano; recuperou 63,1 contra 76 HP (60 contra 76 de poções), gastando 31,8 contra 27,6 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 95 HP e defesa 2 contra 1. Escudos absorveram 0 contra 6,5; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 5 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 62,5 p.p. e de HP final 38,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 62,5 para 25 p.p.; contraste de 37,5 p.p. e alteração de 34,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 98% do DPS efetivo de arqueiro. Por encontro, recebeu 120,9 contra 110,5 HP de dano; recuperou 63,1 contra 61,8 HP (60 contra 61,8 de poções), gastando 31,8 contra 23,9 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 95 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -62,5 p.p.; contraste de 62,5 p.p. e alteração de 22,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 68,9% do DPS efetivo de necromante. Por encontro, recebeu 120,9 contra 4,4 HP de dano; recuperou 63,1 contra 0 HP (60 contra 0 de poções), gastando 31,8 contra 24,5 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 82 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 192 de dano e receberam 0 contra 68,1. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -47,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -75 p.p.; contraste de 75 p.p. e alteração de 31,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × mago:** 1/8 mortes contra 5/8; 0 contra 0 limites de tempo. guerreiro manteve 120,7% do DPS efetivo de mago. Por encontro, recebeu 132,3 contra 160,4 HP de dano; recuperou 89 contra 76 HP (50,9 contra 76 de poções), gastando 31,8 contra 27,6 mana total e 18,4 contra 0 HP em conjurações. Começou com 93 contra 95 HP e defesa 3 contra 1. Escudos absorveram 22,6 contra 6,5; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 4 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 50 p.p. e de HP final 32 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 50 para 100 p.p.; contraste de -50 p.p. e alteração de -18,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: guerreiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × arqueiro:** 1/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 90,5% do DPS efetivo de arqueiro. Por encontro, recebeu 132,3 contra 110,5 HP de dano; recuperou 89 contra 61,8 HP (50,9 contra 61,8 de poções), gastando 31,8 contra 23,9 mana total e 18,4 contra 0 HP em conjurações. Começou com 93 contra 95 HP e defesa 3 contra 2. Escudos absorveram 22,6 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 1 só arqueiro venceu; diferença de vitória -12,5 p.p. e de HP final -5,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para -50 p.p.; contraste de 37,5 p.p. e alteração de 29,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: arqueiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × necromante:** 1/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 63,6% do DPS efetivo de necromante. Por encontro, recebeu 132,3 contra 4,4 HP de dano; recuperou 89 contra 0 HP (50,9 contra 0 de poções), gastando 31,8 contra 24,5 mana total e 18,4 contra 0 HP em conjurações. Começou com 93 contra 82 HP e defesa 3 contra 1. Escudos absorveram 22,6 contra 0; invocações causaram 0 contra 192 de dano e receberam 0 contra 68,1. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 1 só necromante venceu; diferença de vitória -12,5 p.p. e de HP final -54,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para -50 p.p.; contraste de 37,5 p.p. e alteração de 34,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × arqueiro:** 5/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 75% do DPS efetivo de arqueiro. Por encontro, recebeu 160,4 contra 110,5 HP de dano; recuperou 76 contra 61,8 HP (76 contra 61,8 de poções), gastando 27,6 contra 23,9 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 95 HP e defesa 1 contra 2. Escudos absorveram 6,5 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 5 só arqueiro venceu; diferença de vitória -62,5 p.p. e de HP final -37,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -62,5 para -25 p.p.; contraste de -37,5 p.p. e alteração de -26,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: arqueiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × necromante:** 5/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 52,7% do DPS efetivo de necromante. Por encontro, recebeu 160,4 contra 4,4 HP de dano; recuperou 76 contra 0 HP (76 contra 0 de poções), gastando 27,6 contra 24,5 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 82 HP e defesa 1 contra 1. Escudos absorveram 6,5 contra 0; invocações causaram 0 contra 192 de dano e receberam 0 contra 68,1. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 5 só necromante venceu; diferença de vitória -62,5 p.p. e de HP final -86,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -62,5 para -100 p.p.; contraste de 37,5 p.p. e alteração de 11,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**arqueiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. arqueiro manteve 70,2% do DPS efetivo de necromante. Por encontro, recebeu 110,5 contra 4,4 HP de dano; recuperou 61,8 contra 0 HP (61,8 contra 0 de poções), gastando 23,9 contra 24,5 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 82 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 192 de dano e receberam 0 contra 68,1. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -48,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -75 p.p.; contraste de 75 p.p. e alteração de 38,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### O que mudou ao retirar cada fator

**aventureiro, Sem poções de vida:** retirar esse fator perdeu 5 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 42,5 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**aventureiro, Sem habilidades da barra:** retirar esse fator perdeu 6 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 46 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**aventureiro, Defesa plana zerada:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 11,2 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Sem cura do básico:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 29,7 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Sem poções de vida:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 34,5 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Defesa plana zerada:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 16,3 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem poções de vida:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 11,7 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem habilidades da barra:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 11,7 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem poções de vida:** retirar esse fator perdeu 6 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 38,4 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem habilidades da barra:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 23,9 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Defesa plana zerada:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 13,3 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 3/8; 5; 0 | 62,5 | 42,5 | 14,9 (98,7% do completo) | 5 / 0 |
| aventureiro | Sem habilidades da barra | 2/8; 6; 0 | 75 | 46 | 12,2 (80,5% do completo) | 6 / 0 |
| aventureiro | Defesa plana zerada | 6/8; 2; 0 | 25 | 11,2 | 15,1 (99,9% do completo) | 2 / 0 |
| guerreiro | Sem cura do básico | 4/8; 4; 0 | 37,5 | 29,7 | 11,3 (80,9% do completo) | 3 / 0 |
| guerreiro | Sem poções de vida | 4/8; 4; 0 | 37,5 | 34,5 | 13 (92,9% do completo) | 3 / 0 |
| guerreiro | Sem habilidades da barra | 8/8; 0; 0 | -12,5 | -6,6 | 12,1 (86,5% do completo) | 0 / 1 |
| guerreiro | Defesa plana zerada | 5/8; 3; 0 | 25 | 16,3 | 12,3 (88,3% do completo) | 2 / 0 |
| mago | Sem poções de vida | 0/8; 8; 0 | 37,5 | 11,7 | 11,5 (99,9% do completo) | 3 / 0 |
| mago | Sem habilidades da barra | 0/8; 8; 0 | 37,5 | 11,7 | 10,1 (87,5% do completo) | 3 / 0 |
| mago | Defesa plana zerada | 3/8; 5; 0 | 0 | 7,4 | 11,4 (99,1% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 2/8; 6; 0 | 75 | 38,4 | 15,3 (99,1% do completo) | 6 / 0 |
| arqueiro | Sem habilidades da barra | 7/8; 1; 0 | 12,5 | 23,9 | 13,4 (86,8% do completo) | 1 / 0 |
| arqueiro | Defesa plana zerada | 7/8; 1; 0 | 12,5 | 13,3 | 15,3 (99,1% do completo) | 1 / 0 |
| necromante | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 21,9 (100% do completo) | 0 / 0 |
| necromante | Sem habilidades da barra | 8/8; 0; 0 | 0 | 14,2 | 13,9 (63,5% do completo) | 0 / 0 |
| necromante | Defesa plana zerada | 8/8; 0; 0 | 0 | 0,3 | 21,9 (100% do completo) | 0 / 0 |

## nível 1 · normal · chefe

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 33,3 s | 29,2 s | 0,5 | 447,3 | 170,3 | 80 | 24,3 | 0 |
| guerreiro | 34,5 s | 41,8 s | 0,8 | 474 | 151,8 | 102,1 | 26,4 | 16,9 |
| mago | — | 41,7 s | 0 | 389,1 | 171 | 76 | 19 | 0 |
| arqueiro | 34,1 s | — | 1 | 481 | 110,1 | 66,5 | 20 | 0 |
| necromante | 26,2 s | 24,7 s | 0,9 | 560,6 | 38 | 16,5 | 18,4 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 0 / 0 / 80 / 0 | 447,3 / 0 / 0 | 0 | 0 | 14,6 / 5,8 / 3,4 / 4,9 / 10,9 | 1 |
| guerreiro | 0 / 32,8 / 69,4 / 0 | 474 / 0 / 0 | 19,1 | 0 | 14,9 / 4,9 / 4,1 / 3,4 / 5,8 | 0,8 |
| mago | 0 / 0 / 76 / 0 | 365,1 / 24 / 0 | 0 | 0 | 19,3 / 11,9 / 2,3 / 6 / 5,5 | 1,8 |
| arqueiro | 0 / 0 / 66,5 / 0 | 473,5 / 7,5 / 0 | 0 | 0 | 14,1 / 11,4 / 2,3 / 0,1 / 13 | 2 |
| necromante | 0 / 0 / 16,5 / 0 | 509,5 / 0 / 51,1 | 0 | 0 | 9,3 / 10,4 / 0,3 / 0 / 0,2 | 2,2 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 28,1 / 4,9 | 22,6 / 3,3 / 8,8 | 0 / 0 | bloqueado: 25,9 | 0 / 15,3 |
| guerreiro | 34,5 / 5 | 22 / 3,5 / 9,1 | 0 / 0 | bloqueado: 2,9 | 0 / 17,4 |
| mago | 29,4 / 3,1 | 25,3 / 4,3 / 9 | 0 / 0 | — | 0 / 18,5 |
| arqueiro | 26,1 / 1 | 24,4 / 3,4 / 8,6 | 0 / 0 | — | 0 / 16,6 |
| necromante | 21,8 / 0,4 | 30,5 / 5,1 / 10,5 | 2 / 0 | — | 0,8 / 12,4 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 9,1 | 169,8 | 0 | 18,3 | 0 | — |
| aventureiro | explosao | 1 | 25,3 | 0 | 3 | 0 | — |
| aventureiro | golpe_atordoante | 1 | 8,5 | 0 | 3 | 0 | — |
| aventureiro | ataque_basico | 17 | 243,8 | 0 | 0 | 0 | — |
| aventureiro | item:pocao_vida | 2 | 0 | 80 | 0 | 0 | — |
| guerreiro | investida | 4,5 | 58,4 | 0 | 13,5 | 0 | — |
| guerreiro | redemoinho | 5,6 | 77,3 | 0 | 0 | 16,9 | — |
| guerreiro | grito_de_guerra | 2 | 0 | 0 | 8 | 0 | — |
| guerreiro | ataque_basico | 20,8 | 338,4 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 32,8 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 1,6 | 0 | 0 | 4,9 | 0 | — |
| guerreiro | item:pocao_vida | 1,9 | 0 | 69,4 | 0 | 0 | — |
| mago | bola_de_fogo | 3 | 30,8 | 0 | 9 | 0 | — |
| mago | dardo_arcano | 23,4 | 308,1 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 2 | 11,5 | 0 | 6 | 0 | — |
| mago | raio_em_cadeia | 1 | 14,8 | 0 | 4 | 0 | — |
| mago | efeito:queimando | 0 | 24 | 0 | 0 | 0 | — |
| mago | item:pocao_vida | 2 | 0 | 76 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 4 | 97 | 0 | 12 | 0 | — |
| arqueiro | chuva_de_flechas | 1,3 | 11,3 | 0 | 5 | 0 | — |
| arqueiro | flecha_venenosa | 1 | 16,4 | 0 | 3 | 0 | — |
| arqueiro | tiro | 19,9 | 348,9 | 0 | 0 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 7,5 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 1,8 | 0 | 66,5 | 0 | 0 | — |
| necromante | dardo_funesto | 5,3 | 133,1 | 0 | 10,5 | 0 | — |
| necromante | garras_do_ossuario | 2,6 | 77,5 | 0 | 7,9 | 0 | — |
| necromante | toque_funesto | 13,9 | 298,9 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 51,1 | 0 | 0 | 0 | — |
| necromante | item:pocao_vida | 0,5 | 0 | 16,5 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 4/8 mortes contra 2/8; 0 contra 0 limites de tempo. aventureiro manteve 111% do DPS efetivo de guerreiro. Por encontro, recebeu 170,3 contra 151,8 HP de dano; recuperou 80 contra 102,1 HP (80 contra 69,4 de poções), gastando 24,3 contra 26,4 mana total e 0 contra 16,9 HP em conjurações. Começou com 100 contra 93 HP e defesa 2 contra 3. Escudos absorveram 0 contra 19,1; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só aventureiro venceu, 3 só guerreiro venceu; diferença de vitória -25 p.p. e de HP final -18,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -25 para 12,5 p.p.; contraste de -37,5 p.p. e alteração de -17,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: guerreiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × mago:** 4/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 146,3% do DPS efetivo de mago. Por encontro, recebeu 170,3 contra 171 HP de dano; recuperou 80 contra 76 HP (80 contra 76 de poções), gastando 24,3 contra 19 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 95 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 4 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 50 p.p. e de HP final 9,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 50 para 0 p.p.; contraste de 50 p.p. e alteração de 9,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × arqueiro:** 4/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 104,1% do DPS efetivo de arqueiro. Por encontro, recebeu 170,3 contra 110,1 HP de dano; recuperou 80 contra 66,5 HP (80 contra 66,5 de poções), gastando 24,3 contra 20 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 95 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 4 só arqueiro venceu; diferença de vitória -50 p.p. e de HP final -44,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Defesa plana zerada**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -50 para -87,5 p.p.; contraste de 37,5 p.p. e alteração de -5,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: arqueiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × necromante:** 4/8 mortes contra 1/8; 0 contra 0 limites de tempo. aventureiro manteve 64,6% do DPS efetivo de necromante. Por encontro, recebeu 170,3 contra 38 HP de dano; recuperou 80 contra 16,5 HP (80 contra 16,5 de poções), gastando 24,3 contra 18,4 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 82 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 51,1 de dano e receberam 0 contra 34,1. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 3 só necromante venceu; diferença de vitória -37,5 p.p. e de HP final -64,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -37,5 para -75 p.p.; contraste de 37,5 p.p. e alteração de -35,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × mago:** 2/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 131,8% do DPS efetivo de mago. Por encontro, recebeu 151,8 contra 171 HP de dano; recuperou 102,1 contra 76 HP (69,4 contra 76 de poções), gastando 26,4 contra 19 mana total e 16,9 contra 0 HP em conjurações. Começou com 93 contra 95 HP e defesa 3 contra 1. Escudos absorveram 19,1 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 6 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 75 p.p. e de HP final 28,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 75 para 12,5 p.p.; contraste de 62,5 p.p. e alteração de 24,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: guerreiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × arqueiro:** 2/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 93,7% do DPS efetivo de arqueiro. Por encontro, recebeu 151,8 contra 110,1 HP de dano; recuperou 102,1 contra 66,5 HP (69,4 contra 66,5 de poções), gastando 26,4 contra 20 mana total e 16,9 contra 0 HP em conjurações. Começou com 93 contra 95 HP e defesa 3 contra 2. Escudos absorveram 19,1 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 2 só arqueiro venceu; diferença de vitória -25 p.p. e de HP final -25,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -25 para -62,5 p.p.; contraste de 37,5 p.p. e alteração de 17,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: arqueiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × necromante:** 2/8 mortes contra 1/8; 0 contra 0 limites de tempo. guerreiro manteve 58,2% do DPS efetivo de necromante. Por encontro, recebeu 151,8 contra 38 HP de dano; recuperou 102,1 contra 16,5 HP (69,4 contra 16,5 de poções), gastando 26,4 contra 18,4 mana total e 16,9 contra 0 HP em conjurações. Começou com 93 contra 82 HP e defesa 3 contra 1. Escudos absorveram 19,1 contra 0; invocações causaram 0 contra 51,1 de dano e receberam 0 contra 34,1. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só guerreiro venceu, 2 só necromante venceu; diferença de vitória -12,5 p.p. e de HP final -46,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para -50 p.p.; contraste de 37,5 p.p. e alteração de 17,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × arqueiro:** 8/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 71,1% do DPS efetivo de arqueiro. Por encontro, recebeu 171 contra 110,1 HP de dano; recuperou 76 contra 66,5 HP (76 contra 66,5 de poções), gastando 19 contra 20 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 95 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 8 só arqueiro venceu; diferença de vitória -100 p.p. e de HP final -54,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -100 para -25 p.p.; contraste de -75 p.p. e alteração de -49,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: arqueiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × necromante:** 8/8 mortes contra 1/8; 0 contra 0 limites de tempo. mago manteve 44,2% do DPS efetivo de necromante. Por encontro, recebeu 171 contra 38 HP de dano; recuperou 76 contra 16,5 HP (76 contra 16,5 de poções), gastando 19 contra 18,4 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 82 HP e defesa 1 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 51,1 de dano e receberam 0 contra 34,1. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 7 só necromante venceu; diferença de vitória -87,5 p.p. e de HP final -74,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -87,5 para -62,5 p.p.; contraste de -25 p.p. e alteração de -15,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**arqueiro × necromante:** 0/8 mortes contra 1/8; 0 contra 0 limites de tempo. arqueiro manteve 62,1% do DPS efetivo de necromante. Por encontro, recebeu 110,1 contra 38 HP de dano; recuperou 66,5 contra 16,5 HP (66,5 contra 16,5 de poções), gastando 20 contra 18,4 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 82 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 51,1 de dano e receberam 0 contra 34,1. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só arqueiro venceu, 0 só necromante venceu; diferença de vitória 12,5 p.p. e de HP final -20,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para -37,5 p.p.; contraste de 50 p.p. e alteração de 33,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### O que mudou ao retirar cada fator

**aventureiro, Sem poções de vida:** retirar esse fator perdeu 4 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 9,8 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**aventureiro, Sem habilidades da barra:** retirar esse fator perdeu 4 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 9,8 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**aventureiro, Defesa plana zerada:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 6,4 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Sem cura do básico:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 17,9 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Sem poções de vida:** retirar esse fator perdeu 5 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 24,5 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Sem habilidades da barra:** retirar esse fator perdeu 4 vitórias e ganhou 1 nas mesmas 8 condições iniciais. O kit completo teve 8,7 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Defesa plana zerada:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 14,9 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem poções de vida:** retirar esse fator perdeu 6 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 49,1 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem habilidades da barra:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 30,4 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem poções de vida:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 15,5 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem habilidades da barra:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 45,1 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 0/8; 8; 0 | 50 | 9,8 | 15 (101,9% do completo) | 4 / 0 |
| aventureiro | Sem habilidades da barra | 0/8; 8; 0 | 50 | 9,8 | 11,9 (80,8% do completo) | 4 / 0 |
| aventureiro | Defesa plana zerada | 1/8; 7; 0 | 37,5 | 6,4 | 14,6 (98,8% do completo) | 3 / 0 |
| guerreiro | Sem cura do básico | 3/8; 5; 0 | 37,5 | 17,9 | 12,7 (95,7% do completo) | 3 / 0 |
| guerreiro | Sem poções de vida | 1/8; 7; 0 | 62,5 | 24,5 | 13,6 (102% do completo) | 5 / 0 |
| guerreiro | Sem habilidades da barra | 3/8; 5; 0 | 37,5 | 8,7 | 11,4 (85,5% do completo) | 4 / 1 |
| guerreiro | Defesa plana zerada | 3/8; 5; 0 | 37,5 | 14,9 | 13,2 (99,2% do completo) | 3 / 0 |
| mago | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 10,3 (102% do completo) | 0 / 0 |
| mago | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 9,6 (94,8% do completo) | 0 / 0 |
| mago | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 10 (99,5% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 2/8; 6; 0 | 75 | 49,1 | 14,4 (101,3% do completo) | 6 / 0 |
| arqueiro | Sem habilidades da barra | 6/8; 2; 0 | 25 | 30,4 | 12,4 (87,3% do completo) | 2 / 0 |
| arqueiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 11,8 | 14,2 (100% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 5/8; 3; 0 | 25 | 15,5 | 22 (96,5% do completo) | 2 / 0 |
| necromante | Sem habilidades da barra | 6/8; 2; 0 | 12,5 | 45,1 | 15,3 (66,8% do completo) | 1 / 0 |
| necromante | Defesa plana zerada | 7/8; 1; 0 | 0 | 1,5 | 22,8 (100% do completo) | 0 / 0 |

## nível 1 · pesadelo · duelo

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 10,8 s | — | 1 | 120 | 53,3 | 15 | 14,3 | 0 |
| guerreiro | 17 s | 10 s | 0,9 | 115,8 | 91,4 | 52 | 16 | 9 |
| mago | 20,3 s | 17,2 s | 0,9 | 118,8 | 131,9 | 66,5 | 10 | 0 |
| arqueiro | 14,9 s | — | 1 | 120 | 46,5 | 14,3 | 10 | 0 |
| necromante | 11 s | 20,3 s | 0,9 | 137,4 | 33,6 | 8,3 | 6,8 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 0 / 0 / 15 / 0 | 120 / 0 / 0 | 0 | 0 | 6,6 / 2,7 / 0 / 0 / 2 | 1,8 |
| guerreiro | 0 / 10,4 / 41,6 / 0 | 115,8 / 0 / 0 | 15,8 | 0 | 8,3 / 0,7 / 0 / 0 / 0,7 | 0,1 |
| mago | 0 / 0 / 66,5 / 0 | 113,5 / 5,3 / 0 | 0 | 0 | 10,3 / 1,2 / 0 / 1,2 / 0 | 2,1 |
| arqueiro | 0 / 0 / 14,3 / 0 | 116,3 / 3,8 / 0 | 0 | 0 | 6,5 / 1 / 0 / 0 / 3,9 | 2,3 |
| necromante | 0 / 0 / 8,3 / 0 | 122,4 / 0 / 15 | 0 | 0 | 4,2 / 1,5 / 0 / 0 / 0 | 2,4 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 11,9 / 1,1 | 10,8 / 1,3 / 4,4 | 0 / 0 | — | 0 / 5,3 |
| guerreiro | 18,6 / 1,9 | 9,8 / 1,3 / 4,1 | 0 / 0 | — | 0 / 7,6 |
| mago | 16,1 / 1 | 14,1 / 3,6 / 4,9 | 0,1 / 0 | — | 0 / 9,8 |
| arqueiro | 11,6 / 0 | 10,6 / 1,8 / 4,1 | 0 / 0 | — | 0 / 6,8 |
| necromante | 9,8 / 0,1 | 13,6 / 2,9 / 5,1 | 0,8 / 0 | — | 0 / 5,4 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 4,1 | 41 | 0 | 8,3 | 0 | — |
| aventureiro | explosao | 1 | 15,4 | 0 | 3 | 0 | — |
| aventureiro | golpe_atordoante | 1 | 10,5 | 0 | 3 | 0 | — |
| aventureiro | ataque_basico | 5,8 | 53,1 | 0 | 0 | 0 | — |
| aventureiro | item:pocao_vida | 0,4 | 0 | 15 | 0 | 0 | — |
| guerreiro | investida | 2,9 | 12,1 | 0 | 8,6 | 0 | — |
| guerreiro | redemoinho | 3 | 0 | 0 | 0 | 9 | — |
| guerreiro | grito_de_guerra | 1 | 0 | 0 | 4 | 0 | — |
| guerreiro | ataque_basico | 10,6 | 103,6 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 10,4 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 1,1 | 0 | 0 | 3,4 | 0 | — |
| guerreiro | item:pocao_vida | 1,1 | 0 | 41,6 | 0 | 0 | — |
| mago | bola_de_fogo | 1 | 10 | 0 | 3 | 0 | — |
| mago | dardo_arcano | 13,1 | 92,1 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 1 | 2 | 0 | 3 | 0 | — |
| mago | raio_em_cadeia | 1 | 9,4 | 0 | 4 | 0 | — |
| mago | item:pocao_vida | 1,8 | 0 | 66,5 | 0 | 0 | — |
| mago | efeito:queimando | 0 | 5,3 | 0 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 1 | 0 | 0 | 3 | 0 | — |
| arqueiro | chuva_de_flechas | 1 | 10,9 | 0 | 4 | 0 | — |
| arqueiro | flecha_venenosa | 1 | 10,1 | 0 | 3 | 0 | — |
| arqueiro | tiro | 8,6 | 95,3 | 0 | 0 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 3,8 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 0,4 | 0 | 14,3 | 0 | 0 | — |
| necromante | dardo_funesto | 1,9 | 25 | 0 | 3,8 | 0 | — |
| necromante | garras_do_ossuario | 1 | 17,1 | 0 | 3 | 0 | — |
| necromante | toque_funesto | 6,9 | 80,3 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 15 | 0 | 0 | 0 | — |
| necromante | item:pocao_vida | 0,3 | 0 | 8,3 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 0/8 mortes contra 1/8; 0 contra 0 limites de tempo. aventureiro manteve 160,4% do DPS efetivo de guerreiro. Por encontro, recebeu 53,3 contra 91,4 HP de dano; recuperou 15 contra 52 HP (15 contra 41,6 de poções), gastando 14,3 contra 16 mana total e 0 contra 9 HP em conjurações. Começou com 100 contra 93 HP e defesa 2 contra 3. Escudos absorveram 0 contra 15,8; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 12,5 p.p. e de HP final 13,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para 25 p.p.; contraste de -12,5 p.p. e alteração de -29,6 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × mago:** 0/8 mortes contra 1/8; 0 contra 0 limites de tempo. aventureiro manteve 192,2% do DPS efetivo de mago. Por encontro, recebeu 53,3 contra 131,9 HP de dano; recuperou 15 contra 66,5 HP (15 contra 66,5 de poções), gastando 14,3 contra 10 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 95 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 12,5 p.p. e de HP final 30,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para 62,5 p.p.; contraste de -50 p.p. e alteração de -17,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 133,4% do DPS efetivo de arqueiro. Por encontro, recebeu 53,3 contra 46,5 HP de dano; recuperou 15 contra 14,3 HP (15 contra 14,3 de poções), gastando 14,3 contra 10 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 95 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final -4,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -12,5 p.p.; contraste de 12,5 p.p. e alteração de -3,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 0/8 mortes contra 1/8; 0 contra 0 limites de tempo. aventureiro manteve 96,4% do DPS efetivo de necromante. Por encontro, recebeu 53,3 contra 33,6 HP de dano; recuperou 15 contra 8,3 HP (15 contra 8,3 de poções), gastando 14,3 contra 6,8 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 82 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 15 de dano e receberam 0 contra 11. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 12,5 p.p. e de HP final -7,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para 25 p.p.; contraste de -12,5 p.p. e alteração de -12,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × mago:** 1/8 mortes contra 1/8; 0 contra 0 limites de tempo. guerreiro manteve 119,8% do DPS efetivo de mago. Por encontro, recebeu 91,4 contra 131,9 HP de dano; recuperou 52 contra 66,5 HP (41,6 contra 66,5 de poções), gastando 16 contra 10 mana total e 9 contra 0 HP em conjurações. Começou com 93 contra 95 HP e defesa 3 contra 1. Escudos absorveram 15,8 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 16,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 37,5 p.p.; contraste de -37,5 p.p. e alteração de 12,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 1/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 83,2% do DPS efetivo de arqueiro. Por encontro, recebeu 91,4 contra 46,5 HP de dano; recuperou 52 contra 14,3 HP (41,6 contra 14,3 de poções), gastando 16 contra 10 mana total e 9 contra 0 HP em conjurações. Começou com 93 contra 95 HP e defesa 3 contra 2. Escudos absorveram 15,8 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 1 só arqueiro venceu; diferença de vitória -12,5 p.p. e de HP final -18,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para -37,5 p.p.; contraste de 25 p.p. e alteração de 25,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: arqueiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × necromante:** 1/8 mortes contra 1/8; 0 contra 0 limites de tempo. guerreiro manteve 60,1% do DPS efetivo de necromante. Por encontro, recebeu 91,4 contra 33,6 HP de dano; recuperou 52 contra 8,3 HP (41,6 contra 8,3 de poções), gastando 16 contra 6,8 mana total e 9 contra 0 HP em conjurações. Começou com 93 contra 82 HP e defesa 3 contra 1. Escudos absorveram 15,8 contra 0; invocações causaram 0 contra 15 de dano e receberam 0 contra 11. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só guerreiro venceu, 1 só necromante venceu; diferença de vitória 0 p.p. e de HP final -21,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 25 p.p.; contraste de -25 p.p. e alteração de -36,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × arqueiro:** 1/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 69,4% do DPS efetivo de arqueiro. Por encontro, recebeu 131,9 contra 46,5 HP de dano; recuperou 66,5 contra 14,3 HP (66,5 contra 14,3 de poções), gastando 10 contra 10 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 95 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 1 só arqueiro venceu; diferença de vitória -12,5 p.p. e de HP final -34,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para -75 p.p.; contraste de 62,5 p.p. e alteração de 13,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: arqueiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × necromante:** 1/8 mortes contra 1/8; 0 contra 0 limites de tempo. mago manteve 50,2% do DPS efetivo de necromante. Por encontro, recebeu 131,9 contra 33,6 HP de dano; recuperou 66,5 contra 8,3 HP (66,5 contra 8,3 de poções), gastando 10 contra 6,8 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 82 HP e defesa 1 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 15 de dano e receberam 0 contra 11. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só mago venceu, 1 só necromante venceu; diferença de vitória 0 p.p. e de HP final -37,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -62,5 p.p.; contraste de 62,5 p.p. e alteração de 23,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**arqueiro × necromante:** 0/8 mortes contra 1/8; 0 contra 0 limites de tempo. arqueiro manteve 72,3% do DPS efetivo de necromante. Por encontro, recebeu 46,5 contra 33,6 HP de dano; recuperou 14,3 contra 8,3 HP (14,3 contra 8,3 de poções), gastando 10 contra 6,8 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 82 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 15 de dano e receberam 0 contra 11. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só arqueiro venceu, 0 só necromante venceu; diferença de vitória 12,5 p.p. e de HP final -3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para 25 p.p.; contraste de -12,5 p.p. e alteração de -21,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### O que mudou ao retirar cada fator

**aventureiro, Sem poções de vida:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 11,1 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Sem poções de vida:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 40,7 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem poções de vida:** retirar esse fator perdeu 5 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 28,3 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Defesa plana zerada:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 6,3 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem habilidades da barra:** retirar esse fator perdeu 2 vitórias e ganhou 1 nas mesmas 8 condições iniciais. O kit completo teve 24,8 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 7/8; 1; 0 | 12,5 | 11,1 | 11,4 (102,2% do completo) | 1 / 0 |
| aventureiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | 12 | 7 (62,7% do completo) | 0 / 0 |
| aventureiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 6,8 | 11,2 (100% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 8/8; 0; 0 | -12,5 | -3,9 | 6,9 (99,5% do completo) | 0 / 1 |
| guerreiro | Sem poções de vida | 5/8; 3; 0 | 25 | 40,7 | 7 (100,6% do completo) | 2 / 0 |
| guerreiro | Sem habilidades da barra | 8/8; 0; 0 | -12,5 | -11,8 | 7 (100,4% do completo) | 0 / 1 |
| guerreiro | Defesa plana zerada | 8/8; 0; 0 | -12,5 | 0 | 7 (99,9% do completo) | 0 / 1 |
| mago | Sem poções de vida | 2/8; 6; 0 | 62,5 | 28,3 | 5,6 (96,7% do completo) | 5 / 0 |
| mago | Sem habilidades da barra | 7/8; 1; 0 | 0 | -15,8 | 6 (102,2% do completo) | 1 / 1 |
| mago | Defesa plana zerada | 6/8; 2; 0 | 12,5 | 6,3 | 5,8 (98,8% do completo) | 1 / 0 |
| arqueiro | Sem poções de vida | 8/8; 0; 0 | 0 | 15 | 8,4 (100% do completo) | 0 / 0 |
| arqueiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | 3,4 | 7,6 (90,5% do completo) | 0 / 0 |
| arqueiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 6,3 | 8,4 (100% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 7/8; 1; 0 | 0 | 5 | 11,6 (100% do completo) | 0 / 0 |
| necromante | Sem habilidades da barra | 6/8; 2; 0 | 12,5 | 24,8 | 9,6 (82,6% do completo) | 2 / 1 |
| necromante | Defesa plana zerada | 7/8; 1; 0 | 0 | 1,7 | 11,6 (100% do completo) | 0 / 0 |

## nível 1 · pesadelo · pressao

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | — | 14,8 s | 0 | 166,8 | 180 | 80 | 16,5 | 0 |
| guerreiro | — | 13 s | 0 | 125,8 | 169,6 | 85,3 | 14,5 | 8,6 |
| mago | — | 13,4 s | 0 | 118,5 | 156,8 | 61,8 | 10,4 | 0 |
| arqueiro | — | 15,4 s | 0 | 153,9 | 161,5 | 66,5 | 12,6 | 0 |
| necromante | 35,7 s | 18,1 s | 0,3 | 269,3 | 143,8 | 68,6 | 15 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 0 / 0 / 80 / 0 | 166,8 / 0 / 0 | 0 | 0 | 8,5 / 3 / 0 / 3 / 4,6 | 1,4 |
| guerreiro | 0 / 11,3 / 74 / 0 | 125,8 / 0 / 0 | 15,8 | 0 | 7,4 / 0,7 / 0 / 2,4 / 0,5 | 0,3 |
| mago | 0 / 0 / 61,8 / 0 | 113,3 / 5,3 / 0 | 0 | 0 | 7,2 / 1,2 / 0 / 1,3 / 0 | 2,2 |
| arqueiro | 0 / 0 / 66,5 / 0 | 153,9 / 0 / 0 | 0 | 0 | 7,6 / 1,2 / 0 / 1,8 / 4,7 | 2,1 |
| necromante | 0 / 6,8 / 61,9 / 0 | 234,4 / 0 / 34,9 | 0 | 6,8 | 7,8 / 4,6 / 0 / 2,4 / 0,4 | 2,5 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 15,8 / 2 | 13,4 / 1,3 / 5,5 | 0 / 0 | — | 0 / 7,4 |
| guerreiro | 16,5 / 0,9 | 9,3 / 0,9 / 4,1 | 0 / 0 | — | 0 / 6,9 |
| mago | 11,4 / 1,1 | 11,8 / 1,9 / 4,4 | 0,9 / 0 | — | 0 / 6,3 |
| arqueiro | 13,8 / 0 | 12,6 / 1,8 / 5,3 | 0 / 0 | — | 0 / 7,9 |
| necromante | 18,5 / 0,4 | 25,4 / 4,3 / 11,1 | 0,9 / 0 | sem_invocacao: 1,5 | 3,3 / 11,8 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 5,3 | 63,6 | 0 | 10,5 | 0 | — |
| aventureiro | explosao | 1 | 15,4 | 0 | 3 | 0 | — |
| aventureiro | golpe_atordoante | 1 | 10,6 | 0 | 3 | 0 | — |
| aventureiro | ataque_basico | 8,5 | 77,1 | 0 | 0 | 0 | — |
| aventureiro | item:pocao_vida | 2 | 0 | 80 | 0 | 0 | — |
| guerreiro | investida | 2,4 | 18,4 | 0 | 7,1 | 0 | — |
| guerreiro | redemoinho | 2,9 | 0 | 0 | 0 | 8,6 | — |
| guerreiro | grito_de_guerra | 1 | 0 | 0 | 4 | 0 | — |
| guerreiro | ataque_basico | 9,1 | 107,4 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 11,3 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 1,1 | 0 | 0 | 3,4 | 0 | — |
| guerreiro | item:pocao_vida | 2 | 0 | 74 | 0 | 0 | — |
| mago | bola_de_fogo | 1,1 | 10 | 0 | 3,4 | 0 | — |
| mago | dardo_arcano | 8,3 | 67,4 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 1 | 10,5 | 0 | 3 | 0 | — |
| mago | raio_em_cadeia | 1 | 25,4 | 0 | 4 | 0 | — |
| mago | item:pocao_vida | 1,6 | 0 | 61,8 | 0 | 0 | — |
| mago | efeito:queimando | 0 | 5,3 | 0 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 1,9 | 15,3 | 0 | 5,6 | 0 | — |
| arqueiro | chuva_de_flechas | 1 | 10,9 | 0 | 4 | 0 | — |
| arqueiro | flecha_venenosa | 1 | 1 | 0 | 3 | 0 | — |
| arqueiro | tiro | 9,9 | 126,8 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 1,8 | 0 | 66,5 | 0 | 0 | — |
| necromante | dardo_funesto | 4,1 | 50,1 | 0 | 8,3 | 0 | — |
| necromante | garras_do_ossuario | 1,9 | 33,6 | 0 | 5,6 | 0 | — |
| necromante | toque_funesto | 12,1 | 150,6 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 34,9 | 0 | 0 | 0 | — |
| necromante | efeito:cura | 0 | 0 | 6,8 | 0 | 0 | — |
| necromante | item:pocao_vida | 1,9 | 0 | 61,9 | 0 | 0 | — |
| necromante | dizimo_vital | 0,4 | 0 | 0 | 1,1 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 128,6% do DPS efetivo de guerreiro. Por encontro, recebeu 180 contra 169,6 HP de dano; recuperou 80 contra 85,3 HP (80 contra 74 de poções), gastando 16,5 contra 14,5 mana total e 0 contra 8,6 HP em conjurações. Começou com 100 contra 93 HP e defesa 2 contra 3. Escudos absorveram 0 contra 15,8; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × mago:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 123,7% do DPS efetivo de mago. Por encontro, recebeu 180 contra 156,8 HP de dano; recuperou 80 contra 61,8 HP (80 contra 61,8 de poções), gastando 16,5 contra 10,4 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 95 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 120,5% do DPS efetivo de arqueiro. Por encontro, recebeu 180 contra 161,5 HP de dano; recuperou 80 contra 66,5 HP (80 contra 66,5 de poções), gastando 16,5 contra 12,6 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 95 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 8/8 mortes contra 6/8; 0 contra 0 limites de tempo. aventureiro manteve 89,5% do DPS efetivo de necromante. Por encontro, recebeu 180 contra 143,8 HP de dano; recuperou 80 contra 68,6 HP (80 contra 61,9 de poções), gastando 16,5 contra 15 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 82 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 34,9 de dano e receberam 0 contra 52,4. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 2 só necromante venceu; diferença de vitória -25 p.p. e de HP final -12,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -25 para -12,5 p.p.; contraste de -12,5 p.p. e alteração de -11,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × mago:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 96,2% do DPS efetivo de mago. Por encontro, recebeu 169,6 contra 156,8 HP de dano; recuperou 85,3 contra 61,8 HP (74 contra 61,8 de poções), gastando 14,5 contra 10,4 mana total e 8,6 contra 0 HP em conjurações. Começou com 93 contra 95 HP e defesa 3 contra 1. Escudos absorveram 15,8 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 93,7% do DPS efetivo de arqueiro. Por encontro, recebeu 169,6 contra 161,5 HP de dano; recuperou 85,3 contra 66,5 HP (74 contra 66,5 de poções), gastando 14,5 contra 12,6 mana total e 8,6 contra 0 HP em conjurações. Começou com 93 contra 95 HP e defesa 3 contra 2. Escudos absorveram 15,8 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × necromante:** 8/8 mortes contra 6/8; 0 contra 0 limites de tempo. guerreiro manteve 69,6% do DPS efetivo de necromante. Por encontro, recebeu 169,6 contra 143,8 HP de dano; recuperou 85,3 contra 68,6 HP (74 contra 61,9 de poções), gastando 14,5 contra 15 mana total e 8,6 contra 0 HP em conjurações. Começou com 93 contra 82 HP e defesa 3 contra 1. Escudos absorveram 15,8 contra 0; invocações causaram 0 contra 34,9 de dano e receberam 0 contra 52,4. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 2 só necromante venceu; diferença de vitória -25 p.p. e de HP final -12,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -25 para -12,5 p.p.; contraste de -12,5 p.p. e alteração de -11,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. mago manteve 97,4% do DPS efetivo de arqueiro. Por encontro, recebeu 156,8 contra 161,5 HP de dano; recuperou 61,8 contra 66,5 HP (61,8 contra 66,5 de poções), gastando 10,4 contra 12,6 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 95 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × necromante:** 8/8 mortes contra 6/8; 0 contra 0 limites de tempo. mago manteve 72,3% do DPS efetivo de necromante. Por encontro, recebeu 156,8 contra 143,8 HP de dano; recuperou 61,8 contra 68,6 HP (61,8 contra 61,9 de poções), gastando 10,4 contra 15 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 82 HP e defesa 1 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 34,9 de dano e receberam 0 contra 52,4. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 2 só necromante venceu; diferença de vitória -25 p.p. e de HP final -12,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -25 para -12,5 p.p.; contraste de -12,5 p.p. e alteração de -11,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**arqueiro × necromante:** 8/8 mortes contra 6/8; 0 contra 0 limites de tempo. arqueiro manteve 74,3% do DPS efetivo de necromante. Por encontro, recebeu 161,5 contra 143,8 HP de dano; recuperou 66,5 contra 68,6 HP (66,5 contra 61,9 de poções), gastando 12,6 contra 15 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 82 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 34,9 de dano e receberam 0 contra 52,4. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 2 só necromante venceu; diferença de vitória -25 p.p. e de HP final -12,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -25 para -12,5 p.p.; contraste de -12,5 p.p. e alteração de -11,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

### O que mudou ao retirar cada fator

**necromante, Sem poções de vida:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 11,1 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem habilidades da barra:** retirar esse fator perdeu 2 vitórias e ganhou 1 nas mesmas 8 condições iniciais. O kit completo teve 4,6 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 12 (108% do completo) | 0 / 0 |
| aventureiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 7,8 (70,7% do completo) | 0 / 0 |
| aventureiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 11,5 (103,8% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 0/8; 8; 0 | 0 | 0 | 8,8 (101,9% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 9,7 (112% do completo) | 0 / 0 |
| guerreiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 7,6 (88,2% do completo) | 0 / 0 |
| guerreiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 9,3 (107,9% do completo) | 0 / 0 |
| mago | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 9,6 (107% do completo) | 0 / 0 |
| mago | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 5,8 (64,2% do completo) | 0 / 0 |
| mago | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 9,1 (101,3% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 8,6 (93,5% do completo) | 0 / 0 |
| arqueiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 8,5 (92,5% do completo) | 0 / 0 |
| arqueiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 9,2 (99,6% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 1/8; 7; 0 | 12,5 | 11,1 | 13 (104,8% do completo) | 1 / 0 |
| necromante | Sem habilidades da barra | 1/8; 7; 0 | 12,5 | 4,6 | 9,3 (75,2% do completo) | 2 / 1 |
| necromante | Defesa plana zerada | 2/8; 6; 0 | 0 | 0,5 | 12,5 (100,8% do completo) | 0 / 0 |

## nível 1 · pesadelo · atrito

### Onde o desgaste aparece

| Classe | Onda | Chegaram/n inicial | Mortes / limites nesta onda | HP entrada → saída | Mana entrada → saída | Recebido / cura / mana gasta |
|---|---|---|---|---|---|---|
| aventureiro | 1 | 8/8 | 0 / 0 | 100 → 68,3 | 10 → 0,8 | 51,8 / 20 / 14,3 |
| aventureiro | 2 | 8/8 | 4 / 0 | 68,3 → 21,1 | 0,8 → 0,5 | 84,9 / 35 / 8,3 |
| aventureiro | 3 | 4/8 | 2 / 0 | 42,3 → 9,3 | 0,8 → 0,4 | 63,5 / 26,3 / 7,5 |
| aventureiro | 4 | 2/8 | 2 / 0 | 18,5 → 0 | 0,5 → 1,3 | 20 / 0 / 2 |
| guerreiro | 1 | 8/8 | 0 / 0 | 93 → 51,6 | 10 → 1,5 | 88,4 / 54,5 / 14,1 |
| guerreiro | 2 | 8/8 | 5 / 0 | 51,6 → 10,3 | 1,5 → 1,8 | 73,5 / 34,5 / 8,9 |
| guerreiro | 3 | 3/8 | 2 / 0 | 27,3 → 5 | 1,5 → 0,7 | 24,7 / 2,3 / 6,3 |
| guerreiro | 4 | 1/8 | 1 / 0 | 15 → 0 | 0 → 0 | 16 / 1 / 0 |
| mago | 1 | 8/8 | 1 / 0 | 95 → 47,4 | 12 → 8,8 | 95,1 / 47,5 / 10 |
| mago | 2 | 7/8 | 7 / 0 | 54,1 → 0 | 8,3 → 7,7 | 81,3 / 27,1 / 6 |
| arqueiro | 1 | 8/8 | 0 / 0 | 95 → 74,8 | 10 → 4,5 | 34,5 / 14,3 / 10 |
| arqueiro | 2 | 8/8 | 1 / 0 | 74,8 → 46 | 4,5 → 6,3 | 66,8 / 38 / 4,5 |
| arqueiro | 3 | 7/8 | 4 / 0 | 52,6 → 18,1 | 6,6 → 1,4 | 56,1 / 21,7 / 9,1 |
| arqueiro | 4 | 3/8 | 1 / 0 | 42,3 → 11,7 | 1,7 → 5,5 | 44,3 / 12,7 / 3 |
| arqueiro | 5 | 2/8 | 2 / 0 | 17,5 → 0 | 6,5 → 1,5 | 17,5 / 0 / 6 |
| necromante | 1 | 8/8 | 0 / 0 | 82 → 71,3 | 12 → 8,8 | 19 / 8,3 / 6,8 |
| necromante | 2 | 8/8 | 0 / 0 | 71,3 → 54,4 | 8,8 → 7,9 | 27,4 / 10,5 / 6,9 |
| necromante | 3 | 8/8 | 0 / 0 | 54,4 → 69,1 | 7,9 → 5,8 | 1,5 / 6,8 / 15,3 |
| necromante | 4 | 8/8 | 0 / 0 | 69,1 → 71,1 | 5,8 → 3,3 | 0 / 0 / 8,9 |
| necromante | 5 | 8/8 | 1 / 0 | 71,1 → 64,1 | 3,3 → 3,1 | 7,5 / 0 / 4,6 |

Médias de cada onda incluem apenas quem chegou a ela; o denominador inicial mostra a seleção dos sobreviventes. Não compare a vida da onda 5 como se incluísse quem morreu antes.

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | — | 26,4 s | 1,8 | 247,4 | 173,4 | 68,1 | 26,8 | 0 |
| guerreiro | — | 29,3 s | 1,5 | 196,6 | 173,1 | 90 | 25,4 | 15,4 |
| mago | — | 24 s | 0,9 | 151,5 | 166,3 | 71,3 | 15,3 | 0 |
| arqueiro | — | 35 s | 2,5 | 333,5 | 171,4 | 76 | 25,1 | 0 |
| necromante | 45,1 s | 72,6 s | 4,9 | 647,9 | 55,4 | 25,5 | 42,4 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 3,1 / 0 / 65 / 0 | 247,4 / 0 / 0 | 0 | 0 | 14,5 / 8,6 / 0 / 3,4 / 11,8 | 1,3 |
| guerreiro | 0 / 16 / 74 / 0 | 196,6 / 0 / 0 | 26,3 | 0 | 13,4 / 4,9 / 0 / 6,1 / 5,2 | 0,5 |
| mago | 0 / 0 / 71,3 / 0 | 141,8 / 9,8 / 0 | 0 | 0 | 12,3 / 1,2 / 0 / 3 / 0,6 | 2,2 |
| arqueiro | 0 / 0 / 76 / 0 | 329,4 / 4,1 / 0 | 0 | 0 | 16 / 1,9 / 0 / 4,2 / 13,2 | 2,4 |
| necromante | 0 / 9 / 16,5 / 0 | 515,5 / 0 / 132,4 | 0 | 9 | 17,9 / 13,9 / 0 / 1,7 / 1,6 | 3,1 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 28 / 4,4 | 21 / 2,9 / 8,9 | 0 / 0 | — | 5,3 / 17,3 |
| guerreiro | 31,6 / 4,5 | 15,9 / 2,1 / 6,1 | 0,1 / 0 | — | 5,5 / 16,9 |
| mago | 19,4 / 1,8 | 15,6 / 3,8 / 5,3 | 0,1 / 0 | — | 0 / 11,5 |
| arqueiro | 29,8 / 1,4 | 26 / 2,8 / 12 | 0 / 0 | — | 0,4 / 17,1 |
| necromante | 43,4 / 1,9 | 70,6 / 11,8 / 26,8 | 2,9 / 0 | — | 12 / 33,4 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 9,6 | 86,5 | 0 | 19,3 | 0 | — |
| aventureiro | explosao | 1 | 12,5 | 0 | 3 | 0 | — |
| aventureiro | golpe_atordoante | 1,3 | 11 | 0 | 3,8 | 0 | — |
| aventureiro | ataque_basico | 15,8 | 137,4 | 0 | 0 | 0 | — |
| aventureiro | item:pocao_vida | 1,6 | 0 | 65 | 0 | 0 | — |
| aventureiro | curar | 0,4 | 0 | 3,1 | 0,8 | 0 | 4,2 |
| guerreiro | investida | 4,3 | 23,1 | 0 | 12,8 | 0 | — |
| guerreiro | redemoinho | 5,1 | 11 | 0 | 0 | 15,4 | — |
| guerreiro | grito_de_guerra | 1,8 | 0 | 0 | 7 | 0 | — |
| guerreiro | ataque_basico | 18,6 | 162,5 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 16 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 1,9 | 0 | 0 | 5,6 | 0 | — |
| guerreiro | item:pocao_vida | 2 | 0 | 74 | 0 | 0 | — |
| mago | bola_de_fogo | 1,9 | 22 | 0 | 5,6 | 0 | — |
| mago | dardo_arcano | 14,6 | 107,3 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 1,9 | 2,1 | 0 | 5,6 | 0 | — |
| mago | raio_em_cadeia | 1 | 10,4 | 0 | 4 | 0 | — |
| mago | item:pocao_vida | 1,9 | 0 | 71,3 | 0 | 0 | — |
| mago | efeito:queimando | 0 | 9,8 | 0 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 4,1 | 46,6 | 0 | 12,4 | 0 | — |
| arqueiro | chuva_de_flechas | 1,5 | 19 | 0 | 6 | 0 | — |
| arqueiro | flecha_venenosa | 2,3 | 15,3 | 0 | 6,8 | 0 | — |
| arqueiro | tiro | 21,9 | 248,5 | 0 | 0 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 4,1 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 2 | 0 | 76 | 0 | 0 | — |
| necromante | dardo_funesto | 11,5 | 132,4 | 0 | 23 | 0 | — |
| necromante | garras_do_ossuario | 5,6 | 91,5 | 0 | 16,9 | 0 | — |
| necromante | toque_funesto | 25,5 | 291,6 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 132,4 | 0 | 0 | 0 | — |
| necromante | efeito:cura | 0 | 0 | 9 | 0 | 0 | — |
| necromante | item:pocao_vida | 0,5 | 0 | 16,5 | 0 | 0 | — |
| necromante | dizimo_vital | 0,5 | 0 | 0 | 1,5 | 0 | — |
| necromante | comando_sepulcral | 0,3 | 0 | 0 | 1 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 129,9% do DPS efetivo de guerreiro. Por encontro, recebeu 173,4 contra 173,1 HP de dano; recuperou 68,1 contra 90 HP (65 contra 74 de poções), gastando 26,8 contra 25,4 mana total e 0 contra 15,4 HP em conjurações. Começou com 100 contra 93 HP e defesa 2 contra 3. Escudos absorveram 0 contra 26,3; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × mago:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 133,1% do DPS efetivo de mago. Por encontro, recebeu 173,4 contra 166,3 HP de dano; recuperou 68,1 contra 71,3 HP (65 contra 71,3 de poções), gastando 26,8 contra 15,3 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 95 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 90,7% do DPS efetivo de arqueiro. Por encontro, recebeu 173,4 contra 171,4 HP de dano; recuperou 68,1 contra 76 HP (65 contra 76 de poções), gastando 26,8 contra 25,1 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 95 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 8/8 mortes contra 1/8; 0 contra 0 limites de tempo. aventureiro manteve 65,6% do DPS efetivo de necromante. Por encontro, recebeu 173,4 contra 55,4 HP de dano; recuperou 68,1 contra 25,5 HP (65 contra 16,5 de poções), gastando 26,8 contra 42,4 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 82 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 132,4 de dano e receberam 0 contra 127,5. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 7 só necromante venceu; diferença de vitória -87,5 p.p. e de HP final -78,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -87,5 para -12,5 p.p.; contraste de -75 p.p. e alteração de -76,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × mago:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 102,4% do DPS efetivo de mago. Por encontro, recebeu 173,1 contra 166,3 HP de dano; recuperou 90 contra 71,3 HP (74 contra 71,3 de poções), gastando 25,4 contra 15,3 mana total e 15,4 contra 0 HP em conjurações. Começou com 93 contra 95 HP e defesa 3 contra 1. Escudos absorveram 26,3 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 69,8% do DPS efetivo de arqueiro. Por encontro, recebeu 173,1 contra 171,4 HP de dano; recuperou 90 contra 76 HP (74 contra 76 de poções), gastando 25,4 contra 25,1 mana total e 15,4 contra 0 HP em conjurações. Começou com 93 contra 95 HP e defesa 3 contra 2. Escudos absorveram 26,3 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × necromante:** 8/8 mortes contra 1/8; 0 contra 0 limites de tempo. guerreiro manteve 50,5% do DPS efetivo de necromante. Por encontro, recebeu 173,1 contra 55,4 HP de dano; recuperou 90 contra 25,5 HP (74 contra 16,5 de poções), gastando 25,4 contra 42,4 mana total e 15,4 contra 0 HP em conjurações. Começou com 93 contra 82 HP e defesa 3 contra 1. Escudos absorveram 26,3 contra 0; invocações causaram 0 contra 132,4 de dano e receberam 0 contra 127,5. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 7 só necromante venceu; diferença de vitória -87,5 p.p. e de HP final -78,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -87,5 para -12,5 p.p.; contraste de -75 p.p. e alteração de -76,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. mago manteve 68,2% do DPS efetivo de arqueiro. Por encontro, recebeu 166,3 contra 171,4 HP de dano; recuperou 71,3 contra 76 HP (71,3 contra 76 de poções), gastando 15,3 contra 25,1 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 95 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × necromante:** 8/8 mortes contra 1/8; 0 contra 0 limites de tempo. mago manteve 49,3% do DPS efetivo de necromante. Por encontro, recebeu 166,3 contra 55,4 HP de dano; recuperou 71,3 contra 25,5 HP (71,3 contra 16,5 de poções), gastando 15,3 contra 42,4 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 82 HP e defesa 1 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 132,4 de dano e receberam 0 contra 127,5. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 7 só necromante venceu; diferença de vitória -87,5 p.p. e de HP final -78,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -87,5 para -12,5 p.p.; contraste de -75 p.p. e alteração de -76,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**arqueiro × necromante:** 8/8 mortes contra 1/8; 0 contra 0 limites de tempo. arqueiro manteve 72,3% do DPS efetivo de necromante. Por encontro, recebeu 171,4 contra 55,4 HP de dano; recuperou 76 contra 25,5 HP (76 contra 16,5 de poções), gastando 25,1 contra 42,4 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 82 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 132,4 de dano e receberam 0 contra 127,5. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 7 só necromante venceu; diferença de vitória -87,5 p.p. e de HP final -78,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -87,5 para -12,5 p.p.; contraste de -75 p.p. e alteração de -76,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

### O que mudou ao retirar cada fator

**necromante, Sem poções de vida:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 11,4 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem habilidades da barra:** retirar esse fator perdeu 6 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 76,4 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 9,5 (108,6% do completo) | 0 / 0 |
| aventureiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 7,6 (87,5% do completo) | 0 / 0 |
| aventureiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 8,5 (97,4% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 0/8; 8; 0 | 0 | 0 | 6,9 (103,5% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 7,6 (113,7% do completo) | 0 / 0 |
| guerreiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 7,1 (105,6% do completo) | 0 / 0 |
| guerreiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 7 (104,3% do completo) | 0 / 0 |
| mago | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 6,4 (97,8% do completo) | 0 / 0 |
| mago | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 5,9 (90,8% do completo) | 0 / 0 |
| mago | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 6,5 (99,4% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 9,7 (101,4% do completo) | 0 / 0 |
| arqueiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 7,9 (82,2% do completo) | 0 / 0 |
| arqueiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 9,6 (99,9% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 6/8; 2; 0 | 12,5 | 11,4 | 13,7 (103% do completo) | 1 / 0 |
| necromante | Sem habilidades da barra | 1/8; 7; 0 | 75 | 76,4 | 8,9 (67,3% do completo) | 6 / 0 |
| necromante | Defesa plana zerada | 7/8; 1; 0 | 0 | 2 | 13,2 (99,4% do completo) | 1 / 1 |

## nível 1 · pesadelo · chefe

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | — | 22,2 s | 0 | 183 | 180 | 80 | 20 | 0 |
| guerreiro | — | 24,6 s | 0 | 187,9 | 163,5 | 82,5 | 20,1 | 12 |
| mago | — | 26,1 s | 0 | 171,4 | 166,3 | 71,3 | 19 | 0 |
| arqueiro | — | 26 s | 0 | 183,6 | 142,5 | 47,5 | 17,3 | 0 |
| necromante | 38,6 s | 30,3 s | 0,3 | 389,3 | 114,3 | 45,4 | 21 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 0 / 0 / 80 / 0 | 183 / 0 / 0 | 0 | 0 | 11,1 / 5 / 2,1 / 2,6 / 7,1 | 1,1 |
| guerreiro | 0 / 13,1 / 69,4 / 0 | 187,9 / 0 / 0 | 15,8 | 0 | 10,1 / 2,5 / 2,3 / 3,2 / 2,5 | 0,6 |
| mago | 0 / 0 / 71,3 / 0 | 155,6 / 15,8 / 0 | 0 | 0 | 14,6 / 11,9 / 0,4 / 1,4 / 5,2 | 1,9 |
| arqueiro | 0 / 0 / 47,5 / 0 | 178,6 / 5 / 0 | 0 | 0 | 10,5 / 10,6 / 1,2 / 1,4 / 10,8 | 1,9 |
| necromante | 0 / 0 / 45,4 / 0 | 369,6 / 0 / 19,6 | 0 | 0 | 11,1 / 14,1 / 0,8 / 0,5 / 1,3 | 2,2 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 21 / 3 | 16,5 / 2,5 / 6 | 0 / 0 | bloqueado: 3,4 | 0 / 10,5 |
| guerreiro | 23,5 / 3 | 14,6 / 2,5 / 6 | 0 / 0 | — | 0 / 11,4 |
| mago | 21,6 / 2 | 18,6 / 3,9 / 6,8 | 0 / 0 | — | 0 / 12,6 |
| arqueiro | 19,9 / 1,4 | 15,5 / 2,5 / 5,9 | 0 / 0 | — | 0 / 11,9 |
| necromante | 26,1 / 0,8 | 29,4 / 4,4 / 12,1 | 2 / 0 | — | 0 / 16 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 7 | 63,8 | 0 | 14 | 0 | — |
| aventureiro | explosao | 1 | 10,9 | 0 | 3 | 0 | — |
| aventureiro | golpe_atordoante | 1 | 7,4 | 0 | 3 | 0 | — |
| aventureiro | ataque_basico | 12 | 101 | 0 | 0 | 0 | — |
| aventureiro | item:pocao_vida | 2 | 0 | 80 | 0 | 0 | — |
| guerreiro | investida | 3,3 | 27,4 | 0 | 9,8 | 0 | — |
| guerreiro | redemoinho | 4 | 22,8 | 0 | 0 | 12 | — |
| guerreiro | grito_de_guerra | 1,8 | 0 | 0 | 7 | 0 | — |
| guerreiro | ataque_basico | 13,4 | 137,8 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 13,1 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 1,1 | 0 | 0 | 3,4 | 0 | — |
| guerreiro | item:pocao_vida | 1,9 | 0 | 69,4 | 0 | 0 | — |
| mago | bola_de_fogo | 3 | 15,3 | 0 | 9 | 0 | — |
| mago | dardo_arcano | 15,6 | 120,6 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 2 | 11,1 | 0 | 6 | 0 | — |
| mago | raio_em_cadeia | 1 | 8,6 | 0 | 4 | 0 | — |
| mago | efeito:queimando | 0 | 15,8 | 0 | 0 | 0 | — |
| mago | item:pocao_vida | 1,9 | 0 | 71,3 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 3,3 | 23,1 | 0 | 9,8 | 0 | — |
| arqueiro | chuva_de_flechas | 1,1 | 0 | 0 | 4,5 | 0 | — |
| arqueiro | flecha_venenosa | 1 | 11,5 | 0 | 3 | 0 | — |
| arqueiro | tiro | 14,5 | 144 | 0 | 0 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 5 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 1,3 | 0 | 47,5 | 0 | 0 | — |
| necromante | dardo_funesto | 6 | 80,6 | 0 | 12 | 0 | — |
| necromante | garras_do_ossuario | 3 | 58,9 | 0 | 9 | 0 | — |
| necromante | toque_funesto | 17,1 | 230,1 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 19,6 | 0 | 0 | 0 | — |
| necromante | item:pocao_vida | 1,4 | 0 | 45,4 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 104,6% do DPS efetivo de guerreiro. Por encontro, recebeu 180 contra 163,5 HP de dano; recuperou 80 contra 82,5 HP (80 contra 69,4 de poções), gastando 20 contra 20,1 mana total e 0 contra 12 HP em conjurações. Começou com 100 contra 93 HP e defesa 2 contra 3. Escudos absorveram 0 contra 15,8; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × mago:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 125,8% do DPS efetivo de mago. Por encontro, recebeu 180 contra 166,3 HP de dano; recuperou 80 contra 71,3 HP (80 contra 71,3 de poções), gastando 20 contra 19 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 95 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 113,9% do DPS efetivo de arqueiro. Por encontro, recebeu 180 contra 142,5 HP de dano; recuperou 80 contra 47,5 HP (80 contra 47,5 de poções), gastando 20 contra 17,3 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 95 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 8/8 mortes contra 6/8; 0 contra 0 limites de tempo. aventureiro manteve 66,5% do DPS efetivo de necromante. Por encontro, recebeu 180 contra 114,3 HP de dano; recuperou 80 contra 45,4 HP (80 contra 45,4 de poções), gastando 20 contra 21 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 82 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 19,6 de dano e receberam 0 contra 63,3. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 2 só necromante venceu; diferença de vitória -25 p.p. e de HP final -16 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -25 para 0 p.p.; contraste de -25 p.p. e alteração de -16 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × mago:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 120,3% do DPS efetivo de mago. Por encontro, recebeu 163,5 contra 166,3 HP de dano; recuperou 82,5 contra 71,3 HP (69,4 contra 71,3 de poções), gastando 20,1 contra 19 mana total e 12 contra 0 HP em conjurações. Começou com 93 contra 95 HP e defesa 3 contra 1. Escudos absorveram 15,8 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 108,9% do DPS efetivo de arqueiro. Por encontro, recebeu 163,5 contra 142,5 HP de dano; recuperou 82,5 contra 47,5 HP (69,4 contra 47,5 de poções), gastando 20,1 contra 17,3 mana total e 12 contra 0 HP em conjurações. Começou com 93 contra 95 HP e defesa 3 contra 2. Escudos absorveram 15,8 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × necromante:** 8/8 mortes contra 6/8; 0 contra 0 limites de tempo. guerreiro manteve 63,6% do DPS efetivo de necromante. Por encontro, recebeu 163,5 contra 114,3 HP de dano; recuperou 82,5 contra 45,4 HP (69,4 contra 45,4 de poções), gastando 20,1 contra 21 mana total e 12 contra 0 HP em conjurações. Começou com 93 contra 82 HP e defesa 3 contra 1. Escudos absorveram 15,8 contra 0; invocações causaram 0 contra 19,6 de dano e receberam 0 contra 63,3. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 2 só necromante venceu; diferença de vitória -25 p.p. e de HP final -16 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -25 para 0 p.p.; contraste de -25 p.p. e alteração de -16 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. mago manteve 90,5% do DPS efetivo de arqueiro. Por encontro, recebeu 166,3 contra 142,5 HP de dano; recuperou 71,3 contra 47,5 HP (71,3 contra 47,5 de poções), gastando 19 contra 17,3 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 95 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × necromante:** 8/8 mortes contra 6/8; 0 contra 0 limites de tempo. mago manteve 52,8% do DPS efetivo de necromante. Por encontro, recebeu 166,3 contra 114,3 HP de dano; recuperou 71,3 contra 45,4 HP (71,3 contra 45,4 de poções), gastando 19 contra 21 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 82 HP e defesa 1 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 19,6 de dano e receberam 0 contra 63,3. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 2 só necromante venceu; diferença de vitória -25 p.p. e de HP final -16 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -25 para 0 p.p.; contraste de -25 p.p. e alteração de -16 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**arqueiro × necromante:** 8/8 mortes contra 6/8; 0 contra 0 limites de tempo. arqueiro manteve 58,4% do DPS efetivo de necromante. Por encontro, recebeu 142,5 contra 114,3 HP de dano; recuperou 47,5 contra 45,4 HP (47,5 contra 45,4 de poções), gastando 17,3 contra 21 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 82 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 19,6 de dano e receberam 0 contra 63,3. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 2 só necromante venceu; diferença de vitória -25 p.p. e de HP final -16 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -25 para 0 p.p.; contraste de -25 p.p. e alteração de -16 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

### O que mudou ao retirar cada fator

**necromante, Sem poções de vida:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 12 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem habilidades da barra:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 16 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 8,3 (98,4% do completo) | 0 / 0 |
| aventureiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 6,5 (77,3% do completo) | 0 / 0 |
| aventureiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 8,3 (98,5% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 0/8; 8; 0 | 0 | 0 | 8,2 (101,2% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 7,4 (92,1% do completo) | 0 / 0 |
| guerreiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 6,6 (81,2% do completo) | 0 / 0 |
| guerreiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 8,2 (101,9% do completo) | 0 / 0 |
| mago | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 6,8 (101% do completo) | 0 / 0 |
| mago | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 5,6 (84,1% do completo) | 0 / 0 |
| mago | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 6,6 (99% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 7,4 (100,5% do completo) | 0 / 0 |
| arqueiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 7,2 (97% do completo) | 0 / 0 |
| arqueiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 7,4 (99,7% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 1/8; 7; 0 | 12,5 | 12 | 13,4 (105,7% do completo) | 1 / 0 |
| necromante | Sem habilidades da barra | 0/8; 8; 0 | 25 | 16 | 8,1 (63,8% do completo) | 2 / 0 |
| necromante | Defesa plana zerada | 2/8; 6; 0 | 0 | 0,8 | 12,5 (98,4% do completo) | 0 / 0 |

## nível 10 · normal · duelo

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 3,3 s | — | 1 | 341 | 25,9 | 0 | 10 | 0 |
| guerreiro | 8 s | — | 1 | 341 | 81 | 22,8 | 11,9 | 5,6 |
| mago | 7 s | — | 1 | 341 | 44,3 | 0 | 12 | 0 |
| arqueiro | 8,1 s | — | 1 | 341 | 26,3 | 0 | 10 | 0 |
| necromante | 3 s | — | 1 | 341 | 0 | 0 | 5,3 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 0 / 0 / 0 / 0 | 341 / 0 / 0 | 0 | 0 | 3,5 / 1,8 / 0 / 0 / 0 | 2,2 |
| guerreiro | 0 / 22,8 / 0 / 0 | 341 / 0 / 0 | 0 | 0 | 5 / 0,7 / 0 / 0 / 0 | 0,2 |
| mago | 0 / 0 / 0 / 0 | 315,3 / 25,8 / 0 | 0 | 0 | 5 / 0,9 / 0 / 0 / 0,3 | 2,7 |
| arqueiro | 0 / 0 / 0 / 0 | 334,6 / 6,4 / 0 | 0 | 0 | 5 / 0,7 / 0 / 0 / 2,9 | 2,5 |
| necromante | 0 / 0 / 0 / 0 | 334,9 / 0 / 6,1 | 0 | 0 | 1,7 / 0,4 / 0 / 0 / 0 | 2,9 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 4,6 / 0,1 | 4,5 / 0,6 / 1,8 | 0 / 0 | — | 0 / 1,9 |
| guerreiro | 10,1 / 0,9 | 5,4 / 0,8 / 1,9 | 0 / 0 | — | 0 / 3,9 |
| mago | 6,9 / 1 | 5 / 1,1 / 1,6 | 0,1 / 0 | — | 0 / 3 |
| arqueiro | 7,9 / 0 | 6,9 / 1,4 / 2,4 | 0 / 0 | — | 0 / 3,5 |
| necromante | 4,1 / 0 | 5 / 1,1 / 1,4 | 0,8 / 0 | — | 0 / 0,8 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 2 | 155,5 | 0 | 4 | 0 | — |
| aventureiro | explosao | 1 | 106,8 | 0 | 3 | 0 | — |
| aventureiro | golpe_atordoante | 1 | 70,4 | 0 | 3 | 0 | — |
| aventureiro | ataque_basico | 0,6 | 8,4 | 0 | 0 | 0 | — |
| guerreiro | investida | 1,9 | 114 | 0 | 7,5 | 0 | — |
| guerreiro | redemoinho | 1,9 | 0 | 0 | 0 | 5,6 | — |
| guerreiro | grito_de_guerra | 1 | 0 | 0 | 4 | 0 | — |
| guerreiro | ataque_basico | 5,3 | 227 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 22,8 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 0,1 | 0 | 0 | 0,4 | 0 | — |
| mago | bola_de_fogo | 1 | 100,1 | 0 | 3 | 0 | — |
| mago | dardo_arcano | 3,9 | 106,4 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 1 | 15,4 | 0 | 4 | 0 | — |
| mago | raio_em_cadeia | 1 | 93,4 | 0 | 5 | 0 | — |
| mago | efeito:queimando | 0 | 25,8 | 0 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 1 | 0 | 0 | 4 | 0 | — |
| arqueiro | chuva_de_flechas | 1 | 70,6 | 0 | 3 | 0 | — |
| arqueiro | flecha_venenosa | 1 | 55,8 | 0 | 3 | 0 | — |
| arqueiro | tiro | 4,9 | 208,3 | 0 | 0 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 6,4 | 0 | 0 | 0 | — |
| necromante | dardo_funesto | 1,6 | 150,6 | 0 | 3,3 | 0 | — |
| necromante | garras_do_ossuario | 1 | 120,8 | 0 | 2 | 0 | — |
| necromante | toque_funesto | 1,5 | 63,5 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 6,1 | 0 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 222,2% do DPS efetivo de guerreiro. Por encontro, recebeu 25,9 contra 81 HP de dano; recuperou 0 contra 22,8 HP (0 contra 0 de poções), gastando 10 contra 11,9 mana total e 0 contra 5,6 HP em conjurações. Começou com 181 contra 182 HP e defesa 2 contra 3. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 0 p.p. e de HP final 20,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 33,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 179,4% do DPS efetivo de mago. Por encontro, recebeu 25,9 contra 44,3 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 10 contra 12 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 184 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 9,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 23,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 211,2% do DPS efetivo de arqueiro. Por encontro, recebeu 25,9 contra 26,3 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 10 contra 10 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 176 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 13,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 78,3% do DPS efetivo de necromante. Por encontro, recebeu 25,9 contra 0 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 10 contra 5,3 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 171 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 6,1 de dano e receberam 0 contra 4,6. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -14,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 11,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 80,7% do DPS efetivo de mago. Por encontro, recebeu 81 contra 44,3 HP de dano; recuperou 22,8 contra 0 HP (0 contra 0 de poções), gastando 11,9 contra 12 mana total e 5,6 contra 0 HP em conjurações. Começou com 182 contra 184 HP e defesa 3 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final -11 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 11,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 95% do DPS efetivo de arqueiro. Por encontro, recebeu 81 contra 26,3 HP de dano; recuperou 22,8 contra 0 HP (0 contra 0 de poções), gastando 11,9 contra 10 mana total e 5,6 contra 0 HP em conjurações. Começou com 182 contra 176 HP e defesa 3 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final -20,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -19,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 35,2% do DPS efetivo de necromante. Por encontro, recebeu 81 contra 0 HP de dano; recuperou 22,8 contra 0 HP (0 contra 0 de poções), gastando 11,9 contra 5,3 mana total e 5,6 contra 0 HP em conjurações. Começou com 182 contra 171 HP e defesa 3 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 6,1 de dano e receberam 0 contra 4,6. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -35,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -21,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 117,7% do DPS efetivo de arqueiro. Por encontro, recebeu 44,3 contra 26,3 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 12 contra 10 mana total e 0 contra 0 HP em conjurações. Começou com 184 contra 176 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final -9,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -10,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 43,6% do DPS efetivo de necromante. Por encontro, recebeu 44,3 contra 0 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 12 contra 5,3 mana total e 0 contra 0 HP em conjurações. Começou com 184 contra 171 HP e defesa 1 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 6,1 de dano e receberam 0 contra 4,6. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -24 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -11,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**arqueiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. arqueiro manteve 37,1% do DPS efetivo de necromante. Por encontro, recebeu 26,3 contra 0 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 10 contra 5,3 mana total e 0 contra 0 HP em conjurações. Começou com 176 contra 171 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 6,1 de dano e receberam 0 contra 4,6. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -14,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -1,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### O que mudou ao retirar cada fator

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 89,8 (100% do completo) | 0 / 0 |
| aventureiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | 27,9 | 32,4 (36,1% do completo) | 0 / 0 |
| aventureiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 1 | 89,8 (100% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 8/8; 0; 0 | 0 | 11,3 | 40,6 (100,4% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 40,4 (100% do completo) | 0 / 0 |
| guerreiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | -5,3 | 32,4 (80,1% do completo) | 0 / 0 |
| guerreiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 4,7 | 40,4 (100% do completo) | 0 / 0 |
| mago | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 50,1 (100% do completo) | 0 / 0 |
| mago | Sem habilidades da barra | 8/8; 0; 0 | 0 | 4,6 | 32,5 (64,9% do completo) | 0 / 0 |
| mago | Defesa plana zerada | 8/8; 0; 0 | 0 | 0,7 | 50,1 (100% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 42,5 (100% do completo) | 0 / 0 |
| arqueiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | 14,6 | 38,3 (90,1% do completo) | 0 / 0 |
| arqueiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 1,1 | 42,5 (100% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 114,7 (100% do completo) | 0 / 0 |
| necromante | Sem habilidades da barra | 8/8; 0; 0 | 0 | 16,4 | 40,2 (35% do completo) | 0 / 0 |
| necromante | Defesa plana zerada | 8/8; 0; 0 | 0 | 0 | 114,7 (100% do completo) | 0 / 0 |

## nível 10 · normal · pressao

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 20,8 s | — | 1 | 981 | 161,6 | 77,8 | 21,3 | 0 |
| guerreiro | 19,1 s | — | 1 | 981 | 167,5 | 103,4 | 19,6 | 10,5 |
| mago | 16,3 s | — | 1 | 981 | 169,3 | 74 | 16,9 | 0 |
| arqueiro | 18,8 s | — | 1 | 981 | 205,1 | 122,5 | 17,9 | 0 |
| necromante | 13,2 s | — | 1 | 1.066,4 | 112,4 | 47 | 11,5 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 2,8 / 3 / 72 / 0 | 981 / 0 / 0 | 0 | 0 | 10,8 / 10,8 / 0 / 0 / 6,8 | 2 |
| guerreiro | 0 / 39,5 / 63,9 / 0 | 981 / 0 / 0 | 16,3 | 0 | 8,8 / 6,3 / 0 / 0 / 1,8 | 1,4 |
| mago | 0 / 0 / 74 / 0 | 917,1 / 63,9 / 0 | 4 | 0 | 9,9 / 1,9 / 0 / 0 / 2,5 | 2,7 |
| arqueiro | 0 / 0 / 122,5 / 0 | 969 / 12 / 0 | 0 | 0 | 11,3 / 0,8 / 0 / 0 / 8,2 | 2,9 |
| necromante | 0 / 4,5 / 42,5 / 0 | 996,8 / 0 / 69,6 | 0 | 4,5 | 5,6 / 1,5 / 0 / 0,3 / 0 | 2,5 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 19,1 / 2,5 | 14,6 / 2,6 / 5 | 0 / 0 | — | 8,8 / 11,9 |
| guerreiro | 18,6 / 2,5 | 12,1 / 1,9 / 4,5 | 0 / 0 | — | 13,5 / 12 |
| mago | 13,8 / 1,3 | 14,9 / 3,5 / 5,3 | 1 / 0 | — | 0 / 7,8 |
| arqueiro | 18,9 / 0,9 | 18 / 2,1 / 7,5 | 0 / 0 | — | 0 / 9,3 |
| necromante | 13,1 / 0,1 | 20 / 3,4 / 7,4 | 1,5 / 0 | — | 0,3 / 6,4 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 6,6 | 455,6 | 0 | 13,3 | 0 | — |
| aventureiro | explosao | 1 | 222,5 | 0 | 3 | 0 | — |
| aventureiro | golpe_atordoante | 1,5 | 73,4 | 0 | 4,5 | 0 | — |
| aventureiro | ataque_basico | 9,8 | 229,5 | 0 | 0 | 0 | — |
| aventureiro | curar | 0,3 | 0 | 2,8 | 0,5 | 0 | 5,5 |
| aventureiro | efeito:cura_periodica | 0 | 0 | 3 | 0 | 0 | — |
| aventureiro | item:pocao_vida | 1 | 0 | 72 | 0 | 0 | — |
| guerreiro | investida | 2,8 | 229,4 | 0 | 11 | 0 | — |
| guerreiro | redemoinho | 3,5 | 354 | 0 | 0 | 10,5 | — |
| guerreiro | grito_de_guerra | 1,5 | 0 | 0 | 6 | 0 | — |
| guerreiro | ataque_basico | 10 | 397,6 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 39,5 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 0,9 | 0 | 0 | 2,6 | 0 | — |
| guerreiro | item:pocao_vida | 0,9 | 0 | 63,9 | 0 | 0 | — |
| mago | bola_de_fogo | 2 | 296,9 | 0 | 6 | 0 | — |
| mago | dardo_arcano | 9,1 | 295,6 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 1 | 89,3 | 0 | 4 | 0 | — |
| mago | raio_em_cadeia | 1 | 235,4 | 0 | 5 | 0 | — |
| mago | efeito:queimando | 0 | 63,9 | 0 | 0 | 0 | — |
| mago | item:pocao_vida | 1 | 0 | 74 | 0 | 0 | — |
| mago | barreira | 0,6 | 0 | 0 | 1,9 | 0 | — |
| arqueiro | flecha_perfurante | 2,1 | 132,5 | 0 | 8,5 | 0 | — |
| arqueiro | chuva_de_flechas | 1,9 | 232 | 0 | 5,6 | 0 | — |
| arqueiro | flecha_venenosa | 1,3 | 7,3 | 0 | 3,8 | 0 | — |
| arqueiro | tiro | 13,6 | 597,3 | 0 | 0 | 0 | — |
| arqueiro | efeito:dano_direto | 0 | 12 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 1,8 | 0 | 122,5 | 0 | 0 | — |
| necromante | dardo_funesto | 3,5 | 328,1 | 0 | 7 | 0 | — |
| necromante | garras_do_ossuario | 2 | 229 | 0 | 4 | 0 | — |
| necromante | toque_funesto | 7,4 | 439,6 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 69,6 | 0 | 0 | 0 | — |
| necromante | efeito:cura | 0 | 0 | 4,5 | 0 | 0 | — |
| necromante | item:pocao_vida | 0,6 | 0 | 42,5 | 0 | 0 | — |
| necromante | dizimo_vital | 0,3 | 0 | 0 | 0,5 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 95,2% do DPS efetivo de guerreiro. Por encontro, recebeu 161,6 contra 167,5 HP de dano; recuperou 77,8 contra 103,4 HP (72 contra 63,9 de poções), gastando 21,3 contra 19,6 mana total e 0 contra 10,5 HP em conjurações. Começou com 181 contra 182 HP e defesa 2 contra 3. Escudos absorveram 0 contra 16,3; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 0 p.p. e de HP final -7,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -25 p.p.; contraste de 25 p.p. e alteração de 37,6 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 83,2% do DPS efetivo de mago. Por encontro, recebeu 161,6 contra 169,3 HP de dano; recuperou 77,8 contra 74 HP (72 contra 74 de poções), gastando 21,3 contra 16,9 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 184 HP e defesa 2 contra 1. Escudos absorveram 0 contra 4; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 10,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 25 p.p.; contraste de -25 p.p. e alteração de 5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 101,2% do DPS efetivo de arqueiro. Por encontro, recebeu 161,6 contra 205,1 HP de dano; recuperou 77,8 contra 122,5 HP (72 contra 122,5 de poções), gastando 21,3 contra 17,9 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 176 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 5,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 75 p.p.; contraste de -75 p.p. e alteração de -14,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 65,6% do DPS efetivo de necromante. Por encontro, recebeu 161,6 contra 112,4 HP de dano; recuperou 77,8 contra 47 HP (72 contra 42,5 de poções), gastando 21,3 contra 11,5 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 171 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 69,6 de dano e receberam 0 contra 57,3. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -3,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -37,5 p.p.; contraste de 37,5 p.p. e alteração de 65,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 87,4% do DPS efetivo de mago. Por encontro, recebeu 167,5 contra 169,3 HP de dano; recuperou 103,4 contra 74 HP (63,9 contra 74 de poções), gastando 19,6 contra 16,9 mana total e 10,5 contra 0 HP em conjurações. Começou com 182 contra 184 HP e defesa 3 contra 1. Escudos absorveram 16,3 contra 4; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 18,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 50 p.p.; contraste de -50 p.p. e alteração de -32,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 106,4% do DPS efetivo de arqueiro. Por encontro, recebeu 167,5 contra 205,1 HP de dano; recuperou 103,4 contra 122,5 HP (63,9 contra 122,5 de poções), gastando 19,6 contra 17,9 mana total e 10,5 contra 0 HP em conjurações. Começou com 182 contra 176 HP e defesa 3 contra 2. Escudos absorveram 16,3 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 13,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 75 p.p.; contraste de -75 p.p. e alteração de -18,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 68,9% do DPS efetivo de necromante. Por encontro, recebeu 167,5 contra 112,4 HP de dano; recuperou 103,4 contra 47 HP (63,9 contra 42,5 de poções), gastando 19,6 contra 11,5 mana total e 10,5 contra 0 HP em conjurações. Começou com 182 contra 171 HP e defesa 3 contra 1. Escudos absorveram 16,3 contra 0; invocações causaram 0 contra 69,6 de dano e receberam 0 contra 57,3. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final 4,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -12,5 p.p.; contraste de 12,5 p.p. e alteração de 27,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 121,7% do DPS efetivo de arqueiro. Por encontro, recebeu 169,3 contra 205,1 HP de dano; recuperou 74 contra 122,5 HP (74 contra 122,5 de poções), gastando 16,9 contra 17,9 mana total e 0 contra 0 HP em conjurações. Começou com 184 contra 176 HP e defesa 1 contra 2. Escudos absorveram 4 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final -4,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 50 p.p.; contraste de -50 p.p. e alteração de -18 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 78,8% do DPS efetivo de necromante. Por encontro, recebeu 169,3 contra 112,4 HP de dano; recuperou 74 contra 47 HP (74 contra 42,5 de poções), gastando 16,9 contra 11,5 mana total e 0 contra 0 HP em conjurações. Começou com 184 contra 171 HP e defesa 1 contra 1. Escudos absorveram 4 contra 0; invocações causaram 0 contra 69,6 de dano e receberam 0 contra 57,3. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -13,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -62,5 p.p.; contraste de 62,5 p.p. e alteração de 60,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**arqueiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. arqueiro manteve 64,8% do DPS efetivo de necromante. Por encontro, recebeu 205,1 contra 112,4 HP de dano; recuperou 122,5 contra 47 HP (122,5 contra 42,5 de poções), gastando 17,9 contra 11,5 mana total e 0 contra 0 HP em conjurações. Começou com 176 contra 171 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 69,6 de dano e receberam 0 contra 57,3. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -8,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -75 p.p.; contraste de 75 p.p. e alteração de 37,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### O que mudou ao retirar cada fator

**aventureiro, Sem poções de vida:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 37,4 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**aventureiro, Sem habilidades da barra:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 50,1 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Sem poções de vida:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 32,8 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Sem habilidades da barra:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 12,4 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem poções de vida:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 33,6 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem habilidades da barra:** retirar esse fator perdeu 5 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 45,1 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem poções de vida:** retirar esse fator perdeu 7 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 51,6 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem habilidades da barra:** retirar esse fator perdeu 4 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 35,9 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem poções de vida:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 14,4 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 7/8; 1; 0 | 12,5 | 37,4 | 50,2 (98,9% do completo) | 1 / 0 |
| aventureiro | Sem habilidades da barra | 5/8; 3; 0 | 37,5 | 50,1 | 29,8 (58,6% do completo) | 3 / 0 |
| aventureiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 1 | 50,8 (100% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 8/8; 0; 0 | 0 | 12,3 | 55,4 (104% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 7/8; 1; 0 | 12,5 | 32,8 | 50,6 (94,8% do completo) | 1 / 0 |
| guerreiro | Sem habilidades da barra | 7/8; 1; 0 | 12,5 | 12,4 | 30,3 (56,8% do completo) | 1 / 0 |
| guerreiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 5,4 | 55,4 (104% do completo) | 0 / 0 |
| mago | Sem poções de vida | 5/8; 3; 0 | 37,5 | 33,6 | 61,4 (100,7% do completo) | 3 / 0 |
| mago | Sem habilidades da barra | 3/8; 5; 0 | 62,5 | 45,1 | 33,7 (55,3% do completo) | 5 / 0 |
| mago | Defesa plana zerada | 8/8; 0; 0 | 0 | 2,9 | 61 (100% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 1/8; 7; 0 | 87,5 | 51,6 | 51,7 (103,2% do completo) | 7 / 0 |
| arqueiro | Sem habilidades da barra | 4/8; 4; 0 | 50 | 35,9 | 37,1 (74% do completo) | 4 / 0 |
| arqueiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 3,3 | 50,1 (100% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 7/8; 1; 0 | 12,5 | 14,4 | 76,7 (99% do completo) | 1 / 0 |
| necromante | Sem habilidades da barra | 8/8; 0; 0 | 0 | -15 | 30,6 (39,5% do completo) | 0 / 0 |
| necromante | Defesa plana zerada | 8/8; 0; 0 | 0 | 2,1 | 77,4 (100% do completo) | 0 / 0 |

## nível 10 · normal · atrito

### Onde o desgaste aparece

| Classe | Onda | Chegaram/n inicial | Mortes / limites nesta onda | HP entrada → saída | Mana entrada → saída | Recebido / cura / mana gasta |
|---|---|---|---|---|---|---|
| aventureiro | 1 | 8/8 | 0 / 0 | 181 → 154,3 | 10 → 1,4 | 26,8 / 0 / 11 |
| aventureiro | 2 | 8/8 | 0 / 0 | 154,3 → 115,1 | 1,4 → 1,1 | 52,9 / 9 / 5,6 |
| aventureiro | 3 | 8/8 | 0 / 0 | 115,1 → 118,1 | 1,1 → 0,8 | 27,8 / 23,3 / 5,8 |
| aventureiro | 4 | 8/8 | 0 / 0 | 118,1 → 109,8 | 0,8 → 0,7 | 44,6 / 31,8 / 4,8 |
| aventureiro | 5 | 8/8 | 0 / 0 | 109,8 → 101,1 | 0,7 → 0,5 | 63,6 / 50,8 / 4,6 |
| guerreiro | 1 | 8/8 | 0 / 0 | 182 → 124,6 | 10 → 2,8 | 72,4 / 19,9 / 10,5 |
| guerreiro | 2 | 8/8 | 0 / 0 | 124,6 → 120 | 2,8 → 3,1 | 70,5 / 64,1 / 7,6 |
| guerreiro | 3 | 8/8 | 0 / 0 | 120 → 118,5 | 3,1 → 2,3 | 34 / 28,9 / 6,9 |
| guerreiro | 4 | 8/8 | 0 / 0 | 118,5 → 102,1 | 2,3 → 1,5 | 33,8 / 17,6 / 4,4 |
| guerreiro | 5 | 8/8 | 0 / 0 | 102,1 → 105,4 | 1,5 → 1,8 | 46,9 / 53,3 / 2,9 |
| mago | 1 | 8/8 | 0 / 0 | 184 → 142,1 | 12 → 2,8 | 41,9 / 0 / 12 |
| mago | 2 | 8/8 | 0 / 0 | 142,1 → 101,3 | 2,8 → 6,3 | 78,4 / 37 / 1,9 |
| mago | 3 | 8/8 | 0 / 0 | 101,3 → 98,1 | 6,3 → 2,4 | 30,9 / 27,8 / 7 |
| mago | 4 | 8/8 | 0 / 0 | 98,1 → 90,5 | 2,4 → 4,8 | 18,6 / 9,3 / 2,5 |
| mago | 5 | 8/8 | 1 / 0 | 90,5 → 73,9 | 4,8 → 5,6 | 44,4 / 27,8 / 3 |
| arqueiro | 1 | 8/8 | 0 / 0 | 176 → 164,3 | 10 → 3 | 11,8 / 0 / 10 |
| arqueiro | 2 | 8/8 | 0 / 0 | 164,3 → 114,3 | 3 → 4,8 | 67,5 / 17,5 / 2,5 |
| arqueiro | 3 | 8/8 | 0 / 0 | 114,3 → 93,1 | 4,8 → 1,8 | 38,6 / 17,5 / 6,3 |
| arqueiro | 4 | 8/8 | 0 / 0 | 93,1 → 103,6 | 1,8 → 2,9 | 34,5 / 43,8 / 3 |
| arqueiro | 5 | 8/8 | 0 / 0 | 103,6 → 62,3 | 2,9 → 3,9 | 67,6 / 26,3 / 2,5 |
| necromante | 1 | 8/8 | 0 / 0 | 171 → 171 | 12 → 7,4 | 0 / 0 / 5,3 |
| necromante | 2 | 8/8 | 0 / 0 | 171 → 171 | 7,4 → 4,7 | 0 / 0 / 5,3 |
| necromante | 3 | 8/8 | 0 / 0 | 171 → 168,8 | 4,7 → 6,1 | 2,3 / 0 / 10,3 |
| necromante | 4 | 8/8 | 0 / 0 | 168,8 → 168,8 | 6,1 → 6,6 | 0 / 0 / 2,5 |
| necromante | 5 | 8/8 | 0 / 0 | 168,8 → 160,9 | 6,6 → 6,5 | 7,9 / 0 / 1,5 |

Médias de cada onda incluem apenas quem chegou a ela; o denominador inicial mostra a seleção dos sobreviventes. Não compare a vida da onda 5 como se incluísse quem morreu antes.

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 32,8 s | — | 5 | 1.639 | 215,6 | 114,8 | 31,8 | 0 |
| guerreiro | 39,5 s | — | 5 | 1.639 | 257,5 | 183,8 | 32,3 | 21,4 |
| mago | 36,3 s | 37,4 s | 4,9 | 1.635,8 | 214,1 | 101,8 | 26,4 | 0 |
| arqueiro | 38,4 s | — | 5 | 1.639 | 220 | 105 | 24,3 | 0 |
| necromante | 34,4 s | — | 5 | 1.839,5 | 10,1 | 0 | 24,8 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 7,1 / 8,6 / 99 / 0 | 1.639 / 0 / 0 | 0 | 0 | 17,4 / 12,5 / 0 / 0 / 12,9 | 1,4 |
| guerreiro | 0 / 101,6 / 82,1 / 0 | 1.639 / 0 / 0 | 31,9 | 0 | 19,2 / 9,8 / 0 / 0,6 / 4,3 | 1,1 |
| mago | 0 / 0 / 101,8 / 0 | 1.566,9 / 68,9 / 0 | 23,9 | 0 | 21,4 / 3,8 / 0 / 0,9 / 10,7 | 2,5 |
| arqueiro | 0 / 0 / 105 / 0 | 1.629,8 / 9,3 / 0 | 0 | 0 | 19,9 / 2,4 / 0 / 1,1 / 15,4 | 2,5 |
| necromante | 0 / 0 / 0 / 0 | 1.513 / 0 / 326,5 | 0 | 0 | 10,8 / 10,2 / 0 / 0 / 0,6 | 3,8 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 31,6 / 4,4 | 24,8 / 3,8 / 9,4 | 0 / 0 | — | 21 / 22,3 |
| guerreiro | 39,9 / 6,1 | 23 / 3,1 / 9,4 | 0,1 / 0 | — | 18,5 / 24,1 |
| mago | 30 / 2,6 | 25,3 / 4 / 10 | 0 / 0,1 | — | 2,3 / 20 |
| arqueiro | 33,8 / 1,3 | 31,5 / 4,3 / 13 | 0 / 0 | — | 1,3 / 18,2 |
| necromante | 27 / 2,8 | 51,6 / 7,8 / 20,4 | 1,6 / 0 | — | 0 / 19,3 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 10,6 | 753,6 | 0 | 21,3 | 0 | — |
| aventureiro | explosao | 1,3 | 114,4 | 0 | 3,8 | 0 | — |
| aventureiro | golpe_atordoante | 1,8 | 126,6 | 0 | 5,3 | 0 | — |
| aventureiro | ataque_basico | 17,3 | 644,4 | 0 | 0 | 0 | — |
| aventureiro | curar | 0,8 | 0 | 7,1 | 1,5 | 0 | 4,8 |
| aventureiro | efeito:cura_periodica | 0 | 0 | 8,6 | 0 | 0 | — |
| aventureiro | item:pocao_vida | 1,4 | 0 | 99 | 0 | 0 | — |
| guerreiro | investida | 5,1 | 287,6 | 0 | 20,5 | 0 | — |
| guerreiro | redemoinho | 7,1 | 313 | 0 | 0 | 21,4 | — |
| guerreiro | grito_de_guerra | 2 | 0 | 0 | 8 | 0 | — |
| guerreiro | ataque_basico | 24,4 | 1.038,4 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 101,6 | 0 | 0 | — |
| guerreiro | item:pocao_vida | 1,1 | 0 | 82,1 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 1,3 | 0 | 0 | 3,8 | 0 | — |
| mago | bola_de_fogo | 4 | 444,5 | 0 | 12 | 0 | — |
| mago | dardo_arcano | 22,5 | 975 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 1,6 | 46,1 | 0 | 6,5 | 0 | — |
| mago | raio_em_cadeia | 1,1 | 101,3 | 0 | 5,6 | 0 | — |
| mago | item:pocao_vida | 1,4 | 0 | 101,8 | 0 | 0 | — |
| mago | barreira | 0,8 | 0 | 0 | 2,3 | 0 | — |
| mago | efeito:queimando | 0 | 68,9 | 0 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 2,1 | 111,3 | 0 | 8,5 | 0 | — |
| arqueiro | chuva_de_flechas | 3,1 | 245,5 | 0 | 9,4 | 0 | — |
| arqueiro | flecha_venenosa | 2,1 | 97,8 | 0 | 6,4 | 0 | — |
| arqueiro | tiro | 26,4 | 1.175,3 | 0 | 0 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 9,3 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 1,5 | 0 | 105 | 0 | 0 | — |
| necromante | dardo_funesto | 8,5 | 590,9 | 0 | 17 | 0 | — |
| necromante | garras_do_ossuario | 3,9 | 345,6 | 0 | 7,8 | 0 | — |
| necromante | toque_funesto | 14,6 | 576,5 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 326,5 | 0 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 119,5% do DPS efetivo de guerreiro. Por encontro, recebeu 215,6 contra 257,5 HP de dano; recuperou 114,8 contra 183,8 HP (99 contra 82,1 de poções), gastando 31,8 contra 32,3 mana total e 0 contra 21,4 HP em conjurações. Começou com 181 contra 182 HP e defesa 2 contra 3. Escudos absorveram 0 contra 31,9; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 0 p.p. e de HP final -2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -100 p.p.; contraste de 100 p.p. e alteração de 45,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × mago:** 0/8 mortes contra 1/8; 0 contra 0 limites de tempo. aventureiro manteve 114,6% do DPS efetivo de mago. Por encontro, recebeu 215,6 contra 214,1 HP de dano; recuperou 114,8 contra 101,8 HP (99 contra 101,8 de poções), gastando 31,8 contra 26,4 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 184 HP e defesa 2 contra 1. Escudos absorveram 0 contra 23,9; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 12,5 p.p. e de HP final 15,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para -37,5 p.p.; contraste de 50 p.p. e alteração de 25,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 111,1% do DPS efetivo de arqueiro. Por encontro, recebeu 215,6 contra 220 HP de dano; recuperou 114,8 contra 105 HP (99 contra 105 de poções), gastando 31,8 contra 24,3 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 176 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 20,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 50 p.p.; contraste de -50 p.p. e alteração de 13,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 83,6% do DPS efetivo de necromante. Por encontro, recebeu 215,6 contra 10,1 HP de dano; recuperou 114,8 contra 0 HP (99 contra 0 de poções), gastando 31,8 contra 24,8 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 171 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 326,5 de dano e receberam 0 contra 175,5. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -38,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -100 p.p.; contraste de 100 p.p. e alteração de 34,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × mago:** 0/8 mortes contra 1/8; 0 contra 0 limites de tempo. guerreiro manteve 95,9% do DPS efetivo de mago. Por encontro, recebeu 257,5 contra 214,1 HP de dano; recuperou 183,8 contra 101,8 HP (82,1 contra 101,8 de poções), gastando 32,3 contra 26,4 mana total e 21,4 contra 0 HP em conjurações. Começou com 182 contra 184 HP e defesa 3 contra 1. Escudos absorveram 31,9 contra 23,9; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 12,5 p.p. e de HP final 17,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para 62,5 p.p.; contraste de -50 p.p. e alteração de -20 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: guerreiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 92,9% do DPS efetivo de arqueiro. Por encontro, recebeu 257,5 contra 220 HP de dano; recuperou 183,8 contra 105 HP (82,1 contra 105 de poções), gastando 32,3 contra 24,3 mana total e 21,4 contra 0 HP em conjurações. Começou com 182 contra 176 HP e defesa 3 contra 2. Escudos absorveram 31,9 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 22,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 62,5 p.p.; contraste de -62,5 p.p. e alteração de -10,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 69,9% do DPS efetivo de necromante. Por encontro, recebeu 257,5 contra 10,1 HP de dano; recuperou 183,8 contra 0 HP (82,1 contra 0 de poções), gastando 32,3 contra 24,8 mana total e 21,4 contra 0 HP em conjurações. Começou com 182 contra 171 HP e defesa 3 contra 1. Escudos absorveram 31,9 contra 0; invocações causaram 0 contra 326,5 de dano e receberam 0 contra 175,5. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -36,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -50 p.p.; contraste de 50 p.p. e alteração de 36,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × arqueiro:** 1/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 96,9% do DPS efetivo de arqueiro. Por encontro, recebeu 214,1 contra 220 HP de dano; recuperou 101,8 contra 105 HP (101,8 contra 105 de poções), gastando 26,4 contra 24,3 mana total e 0 contra 0 HP em conjurações. Começou com 184 contra 176 HP e defesa 1 contra 2. Escudos absorveram 23,9 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 1 só arqueiro venceu; diferença de vitória -12,5 p.p. e de HP final 4,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para 12,5 p.p.; contraste de -25 p.p. e alteração de -0,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: arqueiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × necromante:** 1/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 73% do DPS efetivo de necromante. Por encontro, recebeu 214,1 contra 10,1 HP de dano; recuperou 101,8 contra 0 HP (101,8 contra 0 de poções), gastando 26,4 contra 24,8 mana total e 0 contra 0 HP em conjurações. Começou com 184 contra 171 HP e defesa 1 contra 1. Escudos absorveram 23,9 contra 0; invocações causaram 0 contra 326,5 de dano e receberam 0 contra 175,5. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 1 só necromante venceu; diferença de vitória -12,5 p.p. e de HP final -53,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para -75 p.p.; contraste de 62,5 p.p. e alteração de 33,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**arqueiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. arqueiro manteve 75,3% do DPS efetivo de necromante. Por encontro, recebeu 220 contra 10,1 HP de dano; recuperou 105 contra 0 HP (105 contra 0 de poções), gastando 24,3 contra 24,8 mana total e 0 contra 0 HP em conjurações. Começou com 176 contra 171 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 326,5 de dano e receberam 0 contra 175,5. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -58,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -87,5 p.p.; contraste de 87,5 p.p. e alteração de 34 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### O que mudou ao retirar cada fator

**aventureiro, Sem poções de vida:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 47,2 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**aventureiro, Sem habilidades da barra:** retirar esse fator perdeu 8 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 55,9 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Sem cura do básico:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 36,7 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Sem poções de vida:** retirar esse fator perdeu 4 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 36,7 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Defesa plana zerada:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 14,9 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem poções de vida:** retirar esse fator perdeu 5 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 33,8 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem habilidades da barra:** retirar esse fator perdeu 4 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 30,6 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem poções de vida:** retirar esse fator perdeu 7 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 34 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem habilidades da barra:** retirar esse fator perdeu 5 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 21,2 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Defesa plana zerada:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve -7,2 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 5/8; 3; 0 | 37,5 | 47,2 | 50,4 (101,2% do completo) | 3 / 0 |
| aventureiro | Sem habilidades da barra | 0/8; 8; 0 | 100 | 55,9 | 29,7 (59,6% do completo) | 8 / 0 |
| aventureiro | Defesa plana zerada | 8/8; 0; 0 | 0 | -0,4 | 51,1 (102,7% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 6/8; 2; 0 | 25 | 36,7 | 36,8 (88,3% do completo) | 2 / 0 |
| guerreiro | Sem poções de vida | 4/8; 4; 0 | 50 | 36,7 | 38,2 (91,8% do completo) | 4 / 0 |
| guerreiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | 10,6 | 32,4 (77,8% do completo) | 0 / 0 |
| guerreiro | Defesa plana zerada | 6/8; 2; 0 | 25 | 14,9 | 38,7 (93% do completo) | 2 / 0 |
| mago | Sem poções de vida | 2/8; 6; 0 | 62,5 | 33,8 | 42,1 (96,8% do completo) | 5 / 0 |
| mago | Sem habilidades da barra | 3/8; 5; 0 | 50 | 30,6 | 34,1 (78,5% do completo) | 4 / 0 |
| mago | Defesa plana zerada | 7/8; 1; 0 | 0 | 3,1 | 43,8 (100,8% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 1/8; 7; 0 | 87,5 | 34 | 45,3 (101,1% do completo) | 7 / 0 |
| arqueiro | Sem habilidades da barra | 3/8; 5; 0 | 62,5 | 21,2 | 38,7 (86,3% do completo) | 5 / 0 |
| arqueiro | Defesa plana zerada | 7/8; 1; 0 | 12,5 | -7,2 | 44,7 (99,7% do completo) | 1 / 0 |
| necromante | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 59,6 (100% do completo) | 0 / 0 |
| necromante | Sem habilidades da barra | 8/8; 0; 0 | 0 | 21,8 | 33,9 (56,9% do completo) | 0 / 0 |
| necromante | Defesa plana zerada | 8/8; 0; 0 | 0 | 0,2 | 59,6 (100% do completo) | 0 / 0 |

## nível 10 · normal · chefe

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 11,3 s | — | 1 | 606 | 51 | 0 | 14,3 | 0 |
| guerreiro | 11,5 s | — | 1 | 642 | 64,3 | 21,6 | 13,4 | 7,1 |
| mago | 13,7 s | — | 1 | 630 | 20 | 0 | 15,8 | 0 |
| arqueiro | 12,7 s | — | 1 | 606 | 34,8 | 0 | 14,9 | 0 |
| necromante | 7,1 s | — | 1 | 723,3 | 1,5 | 0 | 9,5 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 0 / 0 / 0 / 0 | 606 / 0 / 0 | 0 | 0 | 6,4 / 3,9 / 0,9 / 0 / 1,9 | 1,5 |
| guerreiro | 0 / 21,6 / 0 / 0 | 642 / 0 / 0 | 0 | 0 | 5,8 / 1,6 / 0,9 / 0 / 0,1 | 0,7 |
| mago | 0 / 0 / 0 / 0 | 622,3 / 7,8 / 0 | 0 | 0 | 8,7 / 6,6 / 0,4 / 0 / 2,5 | 2,1 |
| arqueiro | 0 / 0 / 0 / 0 | 593,5 / 12,5 / 0 | 0 | 0 | 7,6 / 4,4 / 0,5 / 0 / 3,9 | 2,4 |
| necromante | 0 / 0 / 0 / 0 | 695,1 / 0 / 28,1 | 0 | 0 | 3,8 / 2,3 / 0 / 0 / 0 | 2,6 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 11 / 2,6 | 8,4 / 1,6 / 2,9 | 0 / 0 | — | 0 / 5,1 |
| guerreiro | 12,5 / 2,1 | 8,3 / 1,4 / 2,5 | 0 / 0 | — | 0 / 4,9 |
| mago | 11,9 / 2,3 | 9,1 / 1,1 / 3,4 | 0,6 / 0 | — | 0 / 6,3 |
| arqueiro | 12,4 / 2,3 | 10,1 / 1,5 / 3,9 | 0 / 0,6 | — | 0 / 5,4 |
| necromante | 9,6 / 1 | 11,9 / 2,3 / 3,9 | 0,9 / 0 | — | 0 / 4,2 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 4,1 | 349,6 | 0 | 8,3 | 0 | — |
| aventureiro | explosao | 1 | 111 | 0 | 3 | 0 | — |
| aventureiro | golpe_atordoante | 1 | 36,9 | 0 | 3 | 0 | — |
| aventureiro | ataque_basico | 4,9 | 108,5 | 0 | 0 | 0 | — |
| guerreiro | investida | 2,3 | 209,4 | 0 | 9 | 0 | — |
| guerreiro | redemoinho | 2,4 | 172,9 | 0 | 0 | 7,1 | — |
| guerreiro | grito_de_guerra | 1 | 0 | 0 | 4 | 0 | — |
| guerreiro | ataque_basico | 6,8 | 259,8 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 21,6 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 0,1 | 0 | 0 | 0,4 | 0 | — |
| mago | bola_de_fogo | 2,3 | 93,5 | 0 | 6,8 | 0 | — |
| mago | dardo_arcano | 7,6 | 300,8 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 1 | 117,1 | 0 | 4 | 0 | — |
| mago | raio_em_cadeia | 1 | 110,9 | 0 | 5 | 0 | — |
| mago | efeito:queimando | 0 | 7,8 | 0 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 1 | 88 | 0 | 4 | 0 | — |
| arqueiro | chuva_de_flechas | 2 | 147,3 | 0 | 6 | 0 | — |
| arqueiro | tiro | 7,8 | 262,9 | 0 | 0 | 0 | — |
| arqueiro | flecha_venenosa | 1,6 | 95,4 | 0 | 4,9 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 12,5 | 0 | 0 | 0 | — |
| necromante | dardo_funesto | 3,3 | 295,1 | 0 | 6,5 | 0 | — |
| necromante | garras_do_ossuario | 1,5 | 186,1 | 0 | 3 | 0 | — |
| necromante | toque_funesto | 4,9 | 213,9 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 28,1 | 0 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 102,4% do DPS efetivo de guerreiro. Por encontro, recebeu 51 contra 64,3 HP de dano; recuperou 0 contra 21,6 HP (0 contra 0 de poções), gastando 14,3 contra 13,4 mana total e 0 contra 7,1 HP em conjurações. Começou com 181 contra 182 HP e defesa 2 contra 3. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 0 p.p. e de HP final -0,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -11,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 127,4% do DPS efetivo de mago. Por encontro, recebeu 51 contra 20 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 14,3 contra 15,8 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 184 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final -17,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 3,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 117% do DPS efetivo de arqueiro. Por encontro, recebeu 51 contra 34,8 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 14,3 contra 14,9 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 176 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final -8,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 26,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 72,6% do DPS efetivo de necromante. Por encontro, recebeu 51 contra 1,5 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 14,3 contra 9,5 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 171 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 28,1 de dano e receberam 0 contra 34,3. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -27,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 3,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 124,4% do DPS efetivo de mago. Por encontro, recebeu 64,3 contra 20 HP de dano; recuperou 21,6 contra 0 HP (0 contra 0 de poções), gastando 13,4 contra 15,8 mana total e 7,1 contra 0 HP em conjurações. Começou com 182 contra 184 HP e defesa 3 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final -16,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 11,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 114,3% do DPS efetivo de arqueiro. Por encontro, recebeu 64,3 contra 34,8 HP de dano; recuperou 21,6 contra 0 HP (0 contra 0 de poções), gastando 13,4 contra 14,9 mana total e 7,1 contra 0 HP em conjurações. Começou com 182 contra 176 HP e defesa 3 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final -7,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 22,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 70,9% do DPS efetivo de necromante. Por encontro, recebeu 64,3 contra 1,5 HP de dano; recuperou 21,6 contra 0 HP (0 contra 0 de poções), gastando 13,4 contra 9,5 mana total e 7,1 contra 0 HP em conjurações. Começou com 182 contra 171 HP e defesa 3 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 28,1 de dano e receberam 0 contra 34,3. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -26,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 11,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 91,9% do DPS efetivo de arqueiro. Por encontro, recebeu 20 contra 34,8 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 15,8 contra 14,9 mana total e 0 contra 0 HP em conjurações. Começou com 184 contra 176 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 8,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 22,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 57% do DPS efetivo de necromante. Por encontro, recebeu 20 contra 1,5 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 15,8 contra 9,5 mana total e 0 contra 0 HP em conjurações. Começou com 184 contra 171 HP e defesa 1 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 28,1 de dano e receberam 0 contra 34,3. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -10 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -0,6 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**arqueiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. arqueiro manteve 62,1% do DPS efetivo de necromante. Por encontro, recebeu 34,8 contra 1,5 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 14,9 contra 9,5 mana total e 0 contra 0 HP em conjurações. Começou com 176 contra 171 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 28,1 de dano e receberam 0 contra 34,3. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -18,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -23,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### O que mudou ao retirar cada fator

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 59 (100% do completo) | 0 / 0 |
| aventureiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | 9,3 | 29,2 (49,6% do completo) | 0 / 0 |
| aventureiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 1,4 | 59 (100% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 8/8; 0; 0 | 0 | 11,9 | 57,6 (100% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 57,6 (100% do completo) | 0 / 0 |
| guerreiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | 5,1 | 29,6 (51,4% do completo) | 0 / 0 |
| guerreiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 3,3 | 57,6 (100% do completo) | 0 / 0 |
| mago | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 46,3 (100% do completo) | 0 / 0 |
| mago | Sem habilidades da barra | 8/8; 0; 0 | 0 | 5,4 | 35,1 (75,8% do completo) | 0 / 0 |
| mago | Defesa plana zerada | 8/8; 0; 0 | 0 | 0,3 | 46,3 (100% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 50,4 (100% do completo) | 0 / 0 |
| arqueiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | -17,4 | 38,3 (76,1% do completo) | 0 / 0 |
| arqueiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 1,1 | 50,4 (100% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 81,2 (100% do completo) | 0 / 0 |
| necromante | Sem habilidades da barra | 8/8; 0; 0 | 0 | 6 | 39,7 (48,8% do completo) | 0 / 0 |
| necromante | Defesa plana zerada | 8/8; 0; 0 | 0 | 0,1 | 81,2 (100% do completo) | 0 / 0 |

## nível 10 · pesadelo · duelo

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 8,7 s | — | 1 | 341 | 65,5 | 9 | 13,3 | 0 |
| guerreiro | 15,5 s | — | 1 | 341 | 179,9 | 119 | 15,4 | 9,4 |
| mago | 14,5 s | — | 1 | 341 | 146,4 | 74 | 12,4 | 0 |
| arqueiro | 15,6 s | — | 1 | 341 | 126,5 | 35 | 10 | 0 |
| necromante | 8,9 s | — | 1 | 408,5 | 45,4 | 8,5 | 7,8 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 0 / 0 / 9 / 0 | 341 / 0 / 0 | 0 | 0 | 5,8 / 2,2 / 0 / 0 / 0,9 | 1,3 |
| guerreiro | 0 / 27,8 / 91,3 / 0 | 341 / 0 / 0 | 22,8 | 0 | 8,1 / 0,7 / 0 / 0 / 1,5 | 0,1 |
| mago | 0 / 0 / 74 / 0 | 320 / 21 / 0 | 0 | 0 | 8 / 1,3 / 0 / 0,1 / 1 | 2,3 |
| arqueiro | 0 / 0 / 35 / 0 | 335,1 / 5,9 / 0 | 0 | 0 | 7,7 / 0,7 / 0 / 0 / 4,3 | 2,3 |
| necromante | 0 / 0 / 8,5 / 0 | 389,3 / 0 / 19,3 | 0 | 0 | 3,5 / 1 / 0 / 0 / 0 | 2,6 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 9,3 / 1,3 | 8 / 1,4 / 2,8 | 0 / 0 | — | 0 / 4 |
| guerreiro | 17,1 / 2,1 | 8,8 / 1,1 / 3,1 | 0 / 0 | — | 0 / 7,4 |
| mago | 11,5 / 1,1 | 9,5 / 2,4 / 3,3 | 0,1 / 0 | — | 0,3 / 6,8 |
| arqueiro | 13,3 / 0 | 12,1 / 2,6 / 4,6 | 0 / 0 | — | 0 / 6,8 |
| necromante | 8,9 / 0,6 | 11,5 / 2,3 / 4 | 0,9 / 0 | — | 0 / 3,4 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 3,6 | 169,5 | 0 | 7,3 | 0 | — |
| aventureiro | explosao | 1 | 62,6 | 0 | 3 | 0 | — |
| aventureiro | golpe_atordoante | 1 | 42 | 0 | 3 | 0 | — |
| aventureiro | ataque_basico | 3,6 | 66,9 | 0 | 0 | 0 | — |
| aventureiro | item:pocao_vida | 0,1 | 0 | 9 | 0 | 0 | — |
| guerreiro | investida | 2 | 67 | 0 | 8 | 0 | — |
| guerreiro | redemoinho | 3,1 | 0 | 0 | 0 | 9,4 | — |
| guerreiro | grito_de_guerra | 1 | 0 | 0 | 4 | 0 | — |
| guerreiro | ataque_basico | 9,9 | 274 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 27,8 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 1,1 | 0 | 0 | 3,4 | 0 | — |
| guerreiro | item:pocao_vida | 1,3 | 0 | 91,3 | 0 | 0 | — |
| mago | bola_de_fogo | 1,1 | 66,4 | 0 | 3,4 | 0 | — |
| mago | dardo_arcano | 8,4 | 189,6 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 1 | 9 | 0 | 4 | 0 | — |
| mago | raio_em_cadeia | 1 | 55 | 0 | 5 | 0 | — |
| mago | efeito:queimando | 0 | 21 | 0 | 0 | 0 | — |
| mago | item:pocao_vida | 1 | 0 | 74 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 1 | 0 | 0 | 4 | 0 | — |
| arqueiro | chuva_de_flechas | 1 | 41,5 | 0 | 3 | 0 | — |
| arqueiro | flecha_venenosa | 1 | 26,9 | 0 | 3 | 0 | — |
| arqueiro | tiro | 10,3 | 266,8 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 0,5 | 0 | 35 | 0 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 5,9 | 0 | 0 | 0 | — |
| necromante | dardo_funesto | 2,8 | 160,4 | 0 | 5,5 | 0 | — |
| necromante | garras_do_ossuario | 1,1 | 80,8 | 0 | 2,3 | 0 | — |
| necromante | toque_funesto | 5 | 148,1 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 19,3 | 0 | 0 | 0 | — |
| necromante | item:pocao_vida | 0,1 | 0 | 8,5 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 189,7% do DPS efetivo de guerreiro. Por encontro, recebeu 65,5 contra 179,9 HP de dano; recuperou 9 contra 119 HP (9 contra 91,3 de poções), gastando 13,3 contra 15,4 mana total e 0 contra 9,4 HP em conjurações. Começou com 181 contra 182 HP e defesa 2 contra 3. Escudos absorveram 0 contra 22,8; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 0 p.p. e de HP final 7,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 37,5 p.p.; contraste de -37,5 p.p. e alteração de -39,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 166,4% do DPS efetivo de mago. Por encontro, recebeu 65,5 contra 146,4 HP de dano; recuperou 9 contra 74 HP (9 contra 74 de poções), gastando 13,3 contra 12,4 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 184 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 25 p.p.; contraste de -25 p.p. e alteração de -25,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 179,3% do DPS efetivo de arqueiro. Por encontro, recebeu 65,5 contra 126,5 HP de dano; recuperou 9 contra 35 HP (9 contra 35 de poções), gastando 13,3 contra 10 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 176 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 20,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 25 p.p.; contraste de -25 p.p. e alteração de -11,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 91,2% do DPS efetivo de necromante. Por encontro, recebeu 65,5 contra 45,4 HP de dano; recuperou 9 contra 8,5 HP (9 contra 8,5 de poções), gastando 13,3 contra 7,8 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 171 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 19,3 de dano e receberam 0 contra 25,5. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -9,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 12,5 p.p.; contraste de -12,5 p.p. e alteração de 0,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 87,7% do DPS efetivo de mago. Por encontro, recebeu 179,9 contra 146,4 HP de dano; recuperou 119 contra 74 HP (91,3 contra 74 de poções), gastando 15,4 contra 12,4 mana total e 9,4 contra 0 HP em conjurações. Começou com 182 contra 184 HP e defesa 3 contra 1. Escudos absorveram 22,8 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 0,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -12,5 p.p.; contraste de 12,5 p.p. e alteração de 14 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 94,5% do DPS efetivo de arqueiro. Por encontro, recebeu 179,9 contra 126,5 HP de dano; recuperou 119 contra 35 HP (91,3 contra 35 de poções), gastando 15,4 contra 10 mana total e 9,4 contra 0 HP em conjurações. Começou com 182 contra 176 HP e defesa 3 contra 2. Escudos absorveram 22,8 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 13,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -12,5 p.p.; contraste de 12,5 p.p. e alteração de 28,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 48,1% do DPS efetivo de necromante. Por encontro, recebeu 179,9 contra 45,4 HP de dano; recuperou 119 contra 8,5 HP (91,3 contra 8,5 de poções), gastando 15,4 contra 7,8 mana total e 9,4 contra 0 HP em conjurações. Começou com 182 contra 171 HP e defesa 3 contra 1. Escudos absorveram 22,8 contra 0; invocações causaram 0 contra 19,3 de dano e receberam 0 contra 25,5. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -17 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -25 p.p.; contraste de 25 p.p. e alteração de 40,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 107,7% do DPS efetivo de arqueiro. Por encontro, recebeu 146,4 contra 126,5 HP de dano; recuperou 74 contra 35 HP (74 contra 35 de poções), gastando 12,4 contra 10 mana total e 0 contra 0 HP em conjurações. Começou com 184 contra 176 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 12,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 14,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 54,8% do DPS efetivo de necromante. Por encontro, recebeu 146,4 contra 45,4 HP de dano; recuperou 74 contra 8,5 HP (74 contra 8,5 de poções), gastando 12,4 contra 7,8 mana total e 0 contra 0 HP em conjurações. Começou com 184 contra 171 HP e defesa 1 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 19,3 de dano e receberam 0 contra 25,5. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -17,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -12,5 p.p.; contraste de 12,5 p.p. e alteração de 26,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**arqueiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. arqueiro manteve 50,9% do DPS efetivo de necromante. Por encontro, recebeu 126,5 contra 45,4 HP de dano; recuperou 35 contra 8,5 HP (35 contra 8,5 de poções), gastando 10 contra 7,8 mana total e 0 contra 0 HP em conjurações. Começou com 176 contra 171 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 19,3 de dano e receberam 0 contra 25,5. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -30,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -12,5 p.p.; contraste de 12,5 p.p. e alteração de 11,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### O que mudou ao retirar cada fator

**guerreiro, Sem poções de vida:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 44,8 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem poções de vida:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 30,8 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem poções de vida:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 16,3 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem poções de vida:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 4,5 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 8/8; 0; 0 | 0 | 5 | 41,6 (100% do completo) | 0 / 0 |
| aventureiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | 24,3 | 19,5 (46,9% do completo) | 0 / 0 |
| aventureiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 2,5 | 41,6 (100% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 8/8; 0; 0 | 0 | 5,2 | 22 (100,2% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 5/8; 3; 0 | 37,5 | 44,8 | 22 (100% do completo) | 3 / 0 |
| guerreiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | 1,6 | 20,2 (91,9% do completo) | 0 / 0 |
| guerreiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 11,2 | 22 (100,2% do completo) | 0 / 0 |
| mago | Sem poções de vida | 6/8; 2; 0 | 25 | 30,8 | 25,4 (101,5% do completo) | 2 / 0 |
| mago | Sem habilidades da barra | 8/8; 0; 0 | 0 | 1,6 | 20,2 (80,7% do completo) | 0 / 0 |
| mago | Defesa plana zerada | 8/8; 0; 0 | 0 | 2,4 | 25 (100% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 6/8; 2; 0 | 25 | 16,3 | 23,4 (100,7% do completo) | 2 / 0 |
| arqueiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | -4,4 | 23 (98,9% do completo) | 0 / 0 |
| arqueiro | Defesa plana zerada | 8/8; 0; 0 | 0 | -5 | 23,2 (100% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 7/8; 1; 0 | 12,5 | 4,5 | 46,1 (100,9% do completo) | 1 / 0 |
| necromante | Sem habilidades da barra | 8/8; 0; 0 | 0 | 22,9 | 24,6 (53,8% do completo) | 0 / 0 |
| necromante | Defesa plana zerada | 8/8; 0; 0 | 0 | -4,1 | 45,7 (100% do completo) | 0 / 0 |

## nível 10 · pesadelo · pressao

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | — | 15,1 s | 0 | 604,6 | 328,8 | 147,8 | 17,3 | 0 |
| guerreiro | — | 13,5 s | 0 | 507 | 342 | 168,3 | 16,3 | 8,3 |
| mago | — | 16,1 s | 0 | 661,1 | 332 | 148 | 15 | 0 |
| arqueiro | — | 16,6 s | 0 | 521,3 | 316 | 140 | 13,5 | 0 |
| necromante | 27,8 s | 14,8 s | 0,3 | 676,8 | 298,6 | 140,5 | 9,8 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 2,3 / 1,5 / 144 / 0 | 604,6 / 0 / 0 | 0 | 0 | 9,2 / 4,2 / 0 / 3,9 / 5,8 | 1,4 |
| guerreiro | 0 / 22,3 / 146 / 0 | 507 / 0 / 0 | 32,5 | 0 | 7,6 / 0,8 / 0 / 3,7 / 2,8 | 0,2 |
| mago | 0 / 0 / 148 / 0 | 607,1 / 54 / 0 | 4,1 | 0 | 9,3 / 1,2 / 0 / 2,6 / 2,1 | 2,2 |
| arqueiro | 0 / 0 / 140 / 0 | 510,9 / 10,4 / 0 | 0 | 0 | 9,1 / 0,9 / 0 / 2,1 / 6,5 | 2,1 |
| necromante | 0 / 4,5 / 136 / 0 | 650,4 / 0 / 26,4 | 0 | 4,5 | 6 / 1,9 / 0 / 2,3 / 0 | 2,3 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 16,4 / 2,4 | 14,3 / 2,6 / 5,3 | 0 / 0 | — | 0 / 8,3 |
| guerreiro | 16,1 / 2,6 | 10,4 / 1,9 / 4 | 0 / 0 | — | 0 / 6,8 |
| mago | 13,3 / 1 | 14,9 / 3,4 / 5,6 | 1 / 0 | — | 0 / 7,8 |
| arqueiro | 16,9 / 1,4 | 15,4 / 2,8 / 5,9 | 0 / 0 | — | 0 / 8,4 |
| necromante | 14 / 0,1 | 18,1 / 3,1 / 6,4 | 0,8 / 0 | — | 0,5 / 7,1 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 5,5 | 264,4 | 0 | 11 | 0 | — |
| aventureiro | explosao | 1 | 130,8 | 0 | 3 | 0 | — |
| aventureiro | golpe_atordoante | 1 | 37,6 | 0 | 3 | 0 | — |
| aventureiro | ataque_basico | 8,8 | 171,9 | 0 | 0 | 0 | — |
| aventureiro | item:pocao_vida | 2 | 0 | 144 | 0 | 0 | — |
| aventureiro | curar | 0,1 | 0 | 2,3 | 0,3 | 0 | 9 |
| aventureiro | efeito:cura_periodica | 0 | 0 | 1,5 | 0 | 0 | — |
| guerreiro | investida | 2,1 | 74,3 | 0 | 8,5 | 0 | — |
| guerreiro | redemoinho | 2,8 | 211,5 | 0 | 0 | 8,3 | — |
| guerreiro | grito_de_guerra | 1 | 0 | 0 | 4 | 0 | — |
| guerreiro | ataque_basico | 9 | 221,3 | 0 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 1,3 | 0 | 0 | 3,8 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 22,3 | 0 | 0 | — |
| guerreiro | item:pocao_vida | 2 | 0 | 146 | 0 | 0 | — |
| mago | bola_de_fogo | 1,9 | 199,9 | 0 | 5,6 | 0 | — |
| mago | dardo_arcano | 9,3 | 216,4 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 1 | 52,4 | 0 | 4 | 0 | — |
| mago | raio_em_cadeia | 1 | 138,5 | 0 | 5 | 0 | — |
| mago | efeito:queimando | 0 | 54 | 0 | 0 | 0 | — |
| mago | item:pocao_vida | 2 | 0 | 148 | 0 | 0 | — |
| mago | barreira | 0,1 | 0 | 0 | 0,4 | 0 | — |
| arqueiro | flecha_perfurante | 1,9 | 58,4 | 0 | 7,5 | 0 | — |
| arqueiro | chuva_de_flechas | 1 | 96,8 | 0 | 3 | 0 | — |
| arqueiro | tiro | 13 | 325,3 | 0 | 0 | 0 | — |
| arqueiro | flecha_venenosa | 1 | 30,5 | 0 | 3 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 6,9 | 0 | 0 | 0 | — |
| arqueiro | efeito:dano_direto | 0 | 3,5 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 2 | 0 | 140 | 0 | 0 | — |
| necromante | dardo_funesto | 3,1 | 173 | 0 | 6,3 | 0 | — |
| necromante | garras_do_ossuario | 1,4 | 107,8 | 0 | 2,8 | 0 | — |
| necromante | toque_funesto | 9,1 | 369,6 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 26,4 | 0 | 0 | 0 | — |
| necromante | efeito:cura | 0 | 0 | 4,5 | 0 | 0 | — |
| necromante | item:pocao_vida | 2 | 0 | 136 | 0 | 0 | — |
| necromante | dizimo_vital | 0,3 | 0 | 0 | 0,5 | 0 | — |
| necromante | comando_sepulcral | 0,1 | 0 | 0 | 0,3 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 106,1% do DPS efetivo de guerreiro. Por encontro, recebeu 328,8 contra 342 HP de dano; recuperou 147,8 contra 168,3 HP (144 contra 146 de poções), gastando 17,3 contra 16,3 mana total e 0 contra 8,3 HP em conjurações. Começou com 181 contra 182 HP e defesa 2 contra 3. Escudos absorveram 0 contra 32,5; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × mago:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 87,6% do DPS efetivo de mago. Por encontro, recebeu 328,8 contra 332 HP de dano; recuperou 147,8 contra 148 HP (144 contra 148 de poções), gastando 17,3 contra 15 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 184 HP e defesa 2 contra 1. Escudos absorveram 0 contra 4,1; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 123,6% do DPS efetivo de arqueiro. Por encontro, recebeu 328,8 contra 316 HP de dano; recuperou 147,8 contra 140 HP (144 contra 140 de poções), gastando 17,3 contra 13,5 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 176 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 8/8 mortes contra 6/8; 0 contra 0 limites de tempo. aventureiro manteve 91,2% do DPS efetivo de necromante. Por encontro, recebeu 328,8 contra 298,6 HP de dano; recuperou 147,8 contra 140,5 HP (144 contra 136 de poções), gastando 17,3 contra 9,8 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 171 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 26,4 de dano e receberam 0 contra 65. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 2 só necromante venceu; diferença de vitória -25 p.p. e de HP final -7,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -25 para 0 p.p.; contraste de -25 p.p. e alteração de -7,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × mago:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 82,6% do DPS efetivo de mago. Por encontro, recebeu 342 contra 332 HP de dano; recuperou 168,3 contra 148 HP (146 contra 148 de poções), gastando 16,3 contra 15 mana total e 8,3 contra 0 HP em conjurações. Começou com 182 contra 184 HP e defesa 3 contra 1. Escudos absorveram 32,5 contra 4,1; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 116,5% do DPS efetivo de arqueiro. Por encontro, recebeu 342 contra 316 HP de dano; recuperou 168,3 contra 140 HP (146 contra 140 de poções), gastando 16,3 contra 13,5 mana total e 8,3 contra 0 HP em conjurações. Começou com 182 contra 176 HP e defesa 3 contra 2. Escudos absorveram 32,5 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × necromante:** 8/8 mortes contra 6/8; 0 contra 0 limites de tempo. guerreiro manteve 86% do DPS efetivo de necromante. Por encontro, recebeu 342 contra 298,6 HP de dano; recuperou 168,3 contra 140,5 HP (146 contra 136 de poções), gastando 16,3 contra 9,8 mana total e 8,3 contra 0 HP em conjurações. Começou com 182 contra 171 HP e defesa 3 contra 1. Escudos absorveram 32,5 contra 0; invocações causaram 0 contra 26,4 de dano e receberam 0 contra 65. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 2 só necromante venceu; diferença de vitória -25 p.p. e de HP final -7,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -25 para 0 p.p.; contraste de -25 p.p. e alteração de -7,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. mago manteve 141,1% do DPS efetivo de arqueiro. Por encontro, recebeu 332 contra 316 HP de dano; recuperou 148 contra 140 HP (148 contra 140 de poções), gastando 15 contra 13,5 mana total e 0 contra 0 HP em conjurações. Começou com 184 contra 176 HP e defesa 1 contra 2. Escudos absorveram 4,1 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × necromante:** 8/8 mortes contra 6/8; 0 contra 0 limites de tempo. mago manteve 104,1% do DPS efetivo de necromante. Por encontro, recebeu 332 contra 298,6 HP de dano; recuperou 148 contra 140,5 HP (148 contra 136 de poções), gastando 15 contra 9,8 mana total e 0 contra 0 HP em conjurações. Começou com 184 contra 171 HP e defesa 1 contra 1. Escudos absorveram 4,1 contra 0; invocações causaram 0 contra 26,4 de dano e receberam 0 contra 65. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 2 só necromante venceu; diferença de vitória -25 p.p. e de HP final -7,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -25 para 0 p.p.; contraste de -25 p.p. e alteração de -7,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**arqueiro × necromante:** 8/8 mortes contra 6/8; 0 contra 0 limites de tempo. arqueiro manteve 73,8% do DPS efetivo de necromante. Por encontro, recebeu 316 contra 298,6 HP de dano; recuperou 140 contra 140,5 HP (140 contra 136 de poções), gastando 13,5 contra 9,8 mana total e 0 contra 0 HP em conjurações. Começou com 176 contra 171 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 26,4 de dano e receberam 0 contra 65. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 2 só necromante venceu; diferença de vitória -25 p.p. e de HP final -7,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -25 para 0 p.p.; contraste de -25 p.p. e alteração de -7,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

### O que mudou ao retirar cada fator

**necromante, Sem poções de vida:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 7,8 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 42,8 (116,6% do completo) | 0 / 0 |
| aventureiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 21 (57,2% do completo) | 0 / 0 |
| aventureiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 35,9 (97,8% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 0/8; 8; 0 | 0 | 0 | 34 (98,2% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 33,8 (97,7% do completo) | 0 / 0 |
| guerreiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 21,3 (61,5% do completo) | 0 / 0 |
| guerreiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 34,7 (100,3% do completo) | 0 / 0 |
| mago | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 45,9 (109,6% do completo) | 0 / 0 |
| mago | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 18,9 (45,1% do completo) | 0 / 0 |
| mago | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 41,9 (100% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 31,5 (106% do completo) | 0 / 0 |
| arqueiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 24,6 (83% do completo) | 0 / 0 |
| arqueiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 29,1 (98,1% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 0/8; 8; 0 | 25 | 7,8 | 37,3 (92,7% do completo) | 2 / 0 |
| necromante | Sem habilidades da barra | 2/8; 6; 0 | 0 | -8,5 | 22,8 (56,5% do completo) | 1 / 1 |
| necromante | Defesa plana zerada | 2/8; 6; 0 | 0 | 1,2 | 40,9 (101,7% do completo) | 0 / 0 |

## nível 10 · pesadelo · atrito

### Onde o desgaste aparece

| Classe | Onda | Chegaram/n inicial | Mortes / limites nesta onda | HP entrada → saída | Mana entrada → saída | Recebido / cura / mana gasta |
|---|---|---|---|---|---|---|
| aventureiro | 1 | 8/8 | 0 / 0 | 181 → 114,4 | 10 → 0,7 | 84,6 / 18 / 13,5 |
| aventureiro | 2 | 8/8 | 1 / 0 | 114,4 → 90,3 | 0,7 → 0,3 | 123,6 / 91,3 / 7,8 |
| aventureiro | 3 | 7/8 | 2 / 0 | 103,1 → 54 | 0,2 → 0,3 | 100,6 / 44,3 / 7,6 |
| aventureiro | 4 | 5/8 | 2 / 0 | 75,6 → 17,6 | 0,2 → 0,6 | 80 / 18,8 / 5,4 |
| aventureiro | 5 | 3/8 | 3 / 0 | 29,3 → 0 | 0,3 → 0,3 | 30,7 / 0 / 1,3 |
| guerreiro | 1 | 8/8 | 0 / 0 | 182 → 90,1 | 10 → 1,4 | 208,3 / 125 / 15,5 |
| guerreiro | 2 | 8/8 | 5 / 0 | 90,1 → 26,6 | 1,4 → 1 | 132,5 / 66,4 / 9 |
| guerreiro | 3 | 3/8 | 3 / 0 | 71 → 0 | 1,2 → 2,2 | 81 / 9,3 / 6 |
| mago | 1 | 8/8 | 0 / 0 | 184 → 87 | 12 → 6,1 | 143,3 / 46,3 / 12 |
| mago | 2 | 8/8 | 2 / 0 | 87 → 46,5 | 6,1 → 6,8 | 133 / 92,5 / 4,9 |
| mago | 3 | 6/8 | 3 / 0 | 62 → 5,7 | 7,2 → 2,2 | 68,7 / 12,3 / 8,8 |
| mago | 4 | 3/8 | 3 / 0 | 11,3 → 0 | 2,3 → 4,2 | 12 / 0 / 1 |
| arqueiro | 1 | 8/8 | 0 / 0 | 176 → 113,1 | 10 → 5,4 | 80,4 / 17,5 / 10 |
| arqueiro | 2 | 8/8 | 2 / 0 | 113,1 → 40,6 | 5,4 → 5 | 142,5 / 70 / 5,9 |
| arqueiro | 3 | 6/8 | 4 / 0 | 54,2 → 19,2 | 6 → 1 | 46,7 / 11,7 / 8 |
| arqueiro | 4 | 2/8 | 2 / 0 | 57,5 → 0 | 1 → 3 | 92,5 / 35 / 1,5 |
| necromante | 1 | 8/8 | 0 / 0 | 171 → 150,4 | 12 → 7,9 | 29,1 / 8,5 / 7,3 |
| necromante | 2 | 8/8 | 0 / 0 | 150,4 → 131,6 | 7,9 → 5,8 | 35,8 / 17 / 6,8 |
| necromante | 3 | 8/8 | 0 / 0 | 131,6 → 131,3 | 5,8 → 3,6 | 15,1 / 0 / 11,8 |
| necromante | 4 | 8/8 | 0 / 0 | 131,3 → 117 | 3,6 → 2,9 | 36,3 / 19,3 / 6,8 |
| necromante | 5 | 8/8 | 2 / 0 | 117 → 93,1 | 2,9 → 5,4 | 61,1 / 36,3 / 3,3 |

Médias de cada onda incluem apenas quem chegou a ela; o denominador inicial mostra a seleção dos sobreviventes. Não compare a vida da onda 5 como se incluísse quem morreu antes.

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | — | 39,6 s | 2,9 | 1.107,3 | 357,8 | 159,8 | 31,8 | 0 |
| guerreiro | — | 32,3 s | 1,4 | 636,4 | 371,1 | 194,9 | 26,8 | 17,3 |
| mago | — | 31,4 s | 2,1 | 847,3 | 332,3 | 148 | 23,9 | 0 |
| arqueiro | — | 31,3 s | 2 | 828 | 281 | 105 | 22,3 | 0 |
| necromante | 41,4 s | 70 s | 4,8 | 2.009,5 | 177,4 | 81 | 35,8 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 8,3 / 7,5 / 144 / 0 | 1.107,3 / 0 / 0 | 0 | 0 | 18,5 / 13,4 / 0 / 6,5 / 15,5 | 1,4 |
| guerreiro | 0 / 48,9 / 146 / 0 | 636,4 / 0 / 0 | 42,3 | 0 | 15,1 / 5,4 / 0 / 6,6 / 8 | 0,5 |
| mago | 0 / 0 / 148 / 0 | 801,3 / 46 / 0 | 16,5 | 0 | 17,4 / 1,8 / 0 / 7 / 6,9 | 2,5 |
| arqueiro | 0 / 0 / 105 / 0 | 820,3 / 7,8 / 0 | 0 | 0 | 15,9 / 0,9 / 0 / 4,1 / 10,5 | 2,3 |
| necromante | 0 / 4,5 / 76,5 / 0 | 1.747,5 / 0 / 262 | 0 | 4,5 | 18,1 / 9,7 / 0 / 1,7 / 5,7 | 3 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 34,3 / 5,4 | 26,3 / 3,4 / 11,5 | 0 / 0 | — | 17 / 22,3 |
| guerreiro | 32,4 / 5,4 | 15,6 / 2,4 / 7 | 0 / 0 | — | 11,5 / 18,1 |
| mago | 25,3 / 2,8 | 20,4 / 2,8 / 8,1 | 0 / 0 | — | 0,3 / 15,6 |
| arqueiro | 27,1 / 0,8 | 25 / 4,3 / 9,9 | 0 / 0 | — | 0 / 14 |
| necromante | 44,6 / 3,6 | 78 / 13 / 31,1 | 2 / 0 | sem_invocacao: 9 | 18,5 / 29,1 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 11,1 | 555,4 | 0 | 22,3 | 0 | — |
| aventureiro | explosao | 1,1 | 50 | 0 | 3,4 | 0 | — |
| aventureiro | golpe_atordoante | 1,6 | 70,6 | 0 | 4,9 | 0 | — |
| aventureiro | ataque_basico | 19,8 | 431,3 | 0 | 0 | 0 | — |
| aventureiro | item:pocao_vida | 2 | 0 | 144 | 0 | 0 | — |
| aventureiro | curar | 0,6 | 0 | 8,3 | 1,3 | 0 | 6,6 |
| aventureiro | efeito:cura_periodica | 0 | 0 | 7,5 | 0 | 0 | — |
| guerreiro | investida | 3,6 | 111,5 | 0 | 14,5 | 0 | — |
| guerreiro | redemoinho | 5,8 | 33,8 | 0 | 0 | 17,3 | — |
| guerreiro | grito_de_guerra | 1,8 | 0 | 0 | 7 | 0 | — |
| guerreiro | ataque_basico | 19,5 | 491,1 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 48,9 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 1,8 | 0 | 0 | 5,3 | 0 | — |
| guerreiro | item:pocao_vida | 2 | 0 | 146 | 0 | 0 | — |
| mago | bola_de_fogo | 3,1 | 213,5 | 0 | 9,4 | 0 | — |
| mago | dardo_arcano | 18,6 | 495,3 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 2 | 39,4 | 0 | 8 | 0 | — |
| mago | raio_em_cadeia | 1 | 53,1 | 0 | 5 | 0 | — |
| mago | item:pocao_vida | 2 | 0 | 148 | 0 | 0 | — |
| mago | efeito:queimando | 0 | 46 | 0 | 0 | 0 | — |
| mago | barreira | 0,5 | 0 | 0 | 1,5 | 0 | — |
| arqueiro | flecha_perfurante | 2,8 | 120,8 | 0 | 11 | 0 | — |
| arqueiro | chuva_de_flechas | 2,3 | 109,1 | 0 | 6,8 | 0 | — |
| arqueiro | flecha_venenosa | 1,5 | 40,9 | 0 | 4,5 | 0 | — |
| arqueiro | tiro | 20,6 | 549,5 | 0 | 0 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 7,8 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 1,5 | 0 | 105 | 0 | 0 | — |
| necromante | dardo_funesto | 12 | 583,9 | 0 | 24 | 0 | — |
| necromante | garras_do_ossuario | 5,6 | 295,5 | 0 | 11,3 | 0 | — |
| necromante | toque_funesto | 26,8 | 868,1 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 262 | 0 | 0 | 0 | — |
| necromante | efeito:cura | 0 | 0 | 4,5 | 0 | 0 | — |
| necromante | item:pocao_vida | 1,1 | 0 | 76,5 | 0 | 0 | — |
| necromante | dizimo_vital | 0,3 | 0 | 0 | 0,5 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 152% do DPS efetivo de guerreiro. Por encontro, recebeu 357,8 contra 371,1 HP de dano; recuperou 159,8 contra 194,9 HP (144 contra 146 de poções), gastando 31,8 contra 26,8 mana total e 0 contra 17,3 HP em conjurações. Começou com 181 contra 182 HP e defesa 2 contra 3. Escudos absorveram 0 contra 42,3; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × mago:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 110,8% do DPS efetivo de mago. Por encontro, recebeu 357,8 contra 332,3 HP de dano; recuperou 159,8 contra 148 HP (144 contra 148 de poções), gastando 31,8 contra 23,9 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 184 HP e defesa 2 contra 1. Escudos absorveram 0 contra 16,5; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 107,7% do DPS efetivo de arqueiro. Por encontro, recebeu 357,8 contra 281 HP de dano; recuperou 159,8 contra 105 HP (144 contra 105 de poções), gastando 31,8 contra 22,3 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 176 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 8/8 mortes contra 2/8; 0 contra 0 limites de tempo. aventureiro manteve 76,8% do DPS efetivo de necromante. Por encontro, recebeu 357,8 contra 177,4 HP de dano; recuperou 159,8 contra 81 HP (144 contra 76,5 de poções), gastando 31,8 contra 35,8 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 171 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 262 de dano e receberam 0 contra 268,1. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 6 só necromante venceu; diferença de vitória -75 p.p. e de HP final -54,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -75 para -12,5 p.p.; contraste de -62,5 p.p. e alteração de -49,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × mago:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 72,9% do DPS efetivo de mago. Por encontro, recebeu 371,1 contra 332,3 HP de dano; recuperou 194,9 contra 148 HP (146 contra 148 de poções), gastando 26,8 contra 23,9 mana total e 17,3 contra 0 HP em conjurações. Começou com 182 contra 184 HP e defesa 3 contra 1. Escudos absorveram 42,3 contra 16,5; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 70,9% do DPS efetivo de arqueiro. Por encontro, recebeu 371,1 contra 281 HP de dano; recuperou 194,9 contra 105 HP (146 contra 105 de poções), gastando 26,8 contra 22,3 mana total e 17,3 contra 0 HP em conjurações. Começou com 182 contra 176 HP e defesa 3 contra 2. Escudos absorveram 42,3 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × necromante:** 8/8 mortes contra 2/8; 0 contra 0 limites de tempo. guerreiro manteve 50,5% do DPS efetivo de necromante. Por encontro, recebeu 371,1 contra 177,4 HP de dano; recuperou 194,9 contra 81 HP (146 contra 76,5 de poções), gastando 26,8 contra 35,8 mana total e 17,3 contra 0 HP em conjurações. Começou com 182 contra 171 HP e defesa 3 contra 1. Escudos absorveram 42,3 contra 0; invocações causaram 0 contra 262 de dano e receberam 0 contra 268,1. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 6 só necromante venceu; diferença de vitória -75 p.p. e de HP final -54,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -75 para -12,5 p.p.; contraste de -62,5 p.p. e alteração de -49,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. mago manteve 97,2% do DPS efetivo de arqueiro. Por encontro, recebeu 332,3 contra 281 HP de dano; recuperou 148 contra 105 HP (148 contra 105 de poções), gastando 23,9 contra 22,3 mana total e 0 contra 0 HP em conjurações. Começou com 184 contra 176 HP e defesa 1 contra 2. Escudos absorveram 16,5 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × necromante:** 8/8 mortes contra 2/8; 0 contra 0 limites de tempo. mago manteve 69,3% do DPS efetivo de necromante. Por encontro, recebeu 332,3 contra 177,4 HP de dano; recuperou 148 contra 81 HP (148 contra 76,5 de poções), gastando 23,9 contra 35,8 mana total e 0 contra 0 HP em conjurações. Começou com 184 contra 171 HP e defesa 1 contra 1. Escudos absorveram 16,5 contra 0; invocações causaram 0 contra 262 de dano e receberam 0 contra 268,1. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 6 só necromante venceu; diferença de vitória -75 p.p. e de HP final -54,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -75 para -12,5 p.p.; contraste de -62,5 p.p. e alteração de -49,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**arqueiro × necromante:** 8/8 mortes contra 2/8; 0 contra 0 limites de tempo. arqueiro manteve 71,3% do DPS efetivo de necromante. Por encontro, recebeu 281 contra 177,4 HP de dano; recuperou 105 contra 81 HP (105 contra 76,5 de poções), gastando 22,3 contra 35,8 mana total e 0 contra 0 HP em conjurações. Começou com 176 contra 171 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 262 de dano e receberam 0 contra 268,1. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 6 só necromante venceu; diferença de vitória -75 p.p. e de HP final -54,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -75 para -12,5 p.p.; contraste de -62,5 p.p. e alteração de -49,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

### O que mudou ao retirar cada fator

**necromante, Sem habilidades da barra:** retirar esse fator perdeu 5 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 49,9 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 30,5 (99,9% do completo) | 0 / 0 |
| aventureiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 19,2 (62,8% do completo) | 0 / 0 |
| aventureiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 29,3 (95,9% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 0/8; 8; 0 | 0 | 0 | 20,9 (103,8% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 21,5 (106,7% do completo) | 0 / 0 |
| guerreiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 20 (99,2% do completo) | 0 / 0 |
| guerreiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 22,1 (110% do completo) | 0 / 0 |
| mago | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 27 (97,7% do completo) | 0 / 0 |
| mago | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 19,3 (70% do completo) | 0 / 0 |
| mago | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 27,9 (101,2% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 28,2 (99,4% do completo) | 0 / 0 |
| arqueiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 22,6 (79,6% do completo) | 0 / 0 |
| arqueiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 28,3 (99,6% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 6/8; 2; 0 | 0 | 20,5 | 39,6 (99,5% do completo) | 1 / 1 |
| necromante | Sem habilidades da barra | 1/8; 5; 2 | 62,5 | 49,9 | 22,7 (56,9% do completo) | 5 / 0 |
| necromante | Defesa plana zerada | 6/8; 2; 0 | 0 | 1,7 | 40,3 (101,3% do completo) | 0 / 0 |

## nível 10 · pesadelo · chefe

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 23 s | — | 1 | 690 | 196,9 | 90 | 21 | 0 |
| guerreiro | 22,8 s | 15,5 s | 0,9 | 678,4 | 216,4 | 131,1 | 18,5 | 11,6 |
| mago | 22,6 s | — | 1 | 702 | 96,6 | 37 | 19,5 | 0 |
| arqueiro | 27,4 s | 26,5 s | 0,5 | 615,8 | 261,3 | 131,3 | 16 | 0 |
| necromante | 14,9 s | — | 1 | 777,9 | 20 | 0 | 17,8 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 0 / 0 / 90 / 0 | 690 / 0 / 0 | 0 | 0 | 12,1 / 5,8 / 2,2 / 0,5 / 8,3 | 1,2 |
| guerreiro | 0 / 30,8 / 100,4 / 0 | 678,4 / 0 / 0 | 13 | 0 | 10,1 / 2,6 / 2 / 0,4 / 2,1 | 0,6 |
| mago | 0 / 0 / 37 / 0 | 653,8 / 48,3 / 0 | 0 | 0 | 14 / 10,5 / 0,6 / 0,4 / 6,4 | 2,2 |
| arqueiro | 0 / 0 / 131,3 / 0 | 595,5 / 20,3 / 0 | 0 | 0 | 13,6 / 7,5 / 1,9 / 1,8 / 9,3 | 2,1 |
| necromante | 0 / 0 / 0 / 0 | 755,1 / 0 / 22,8 | 0 | 0 | 7,4 / 8,1 / 0 / 0 / 0 | 2,4 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 21,8 / 3 | 17,5 / 2,4 / 6,3 | 0 / 0 | bloqueado: 14,4 | 0 / 11,4 |
| guerreiro | 21,3 / 3,8 | 14,4 / 2,4 / 5,1 | 0 / 0 | — | 0 / 9,9 |
| mago | 18,6 / 2,5 | 17 / 2,4 / 7,1 | 0,6 / 0 | — | 0 / 11,8 |
| arqueiro | 24,9 / 3,6 | 19,9 / 3,3 / 8 | 0 / 0 | — | 0 / 13,3 |
| necromante | 18,4 / 1,3 | 19,5 / 4 / 7,5 | 1,4 / 0 | — | 0,5 / 8,6 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 7,5 | 319,4 | 0 | 15 | 0 | — |
| aventureiro | explosao | 1 | 62,1 | 0 | 3 | 0 | — |
| aventureiro | golpe_atordoante | 1 | 30,4 | 0 | 3 | 0 | — |
| aventureiro | ataque_basico | 12,3 | 278,1 | 0 | 0 | 0 | — |
| aventureiro | item:pocao_vida | 1,3 | 0 | 90 | 0 | 0 | — |
| guerreiro | investida | 2,9 | 133,8 | 0 | 11,5 | 0 | — |
| guerreiro | redemoinho | 3,9 | 216,1 | 0 | 0 | 11,6 | — |
| guerreiro | grito_de_guerra | 1,4 | 0 | 0 | 5,5 | 0 | — |
| guerreiro | ataque_basico | 12,6 | 328,5 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 30,8 | 0 | 0 | — |
| guerreiro | item:pocao_vida | 1,4 | 0 | 100,4 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 0,5 | 0 | 0 | 1,5 | 0 | — |
| mago | bola_de_fogo | 3,5 | 167,9 | 0 | 10,5 | 0 | — |
| mago | dardo_arcano | 13,1 | 350,5 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 1 | 70,3 | 0 | 4 | 0 | — |
| mago | raio_em_cadeia | 1 | 65,1 | 0 | 5 | 0 | — |
| mago | efeito:queimando | 0 | 48,3 | 0 | 0 | 0 | — |
| mago | item:pocao_vida | 0,5 | 0 | 37 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 1 | 0 | 0 | 4 | 0 | — |
| arqueiro | chuva_de_flechas | 2 | 81,4 | 0 | 6 | 0 | — |
| arqueiro | tiro | 19,9 | 447,1 | 0 | 0 | 0 | — |
| arqueiro | flecha_venenosa | 2 | 67 | 0 | 6 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 17,3 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 1,9 | 0 | 131,3 | 0 | 0 | — |
| arqueiro | efeito:dano_direto | 0 | 3 | 0 | 0 | 0 | — |
| necromante | dardo_funesto | 6 | 331 | 0 | 12 | 0 | — |
| necromante | garras_do_ossuario | 2,9 | 156 | 0 | 5,8 | 0 | — |
| necromante | toque_funesto | 9,5 | 268,1 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 22,8 | 0 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 0/8 mortes contra 1/8; 0 contra 0 limites de tempo. aventureiro manteve 90,4% do DPS efetivo de guerreiro. Por encontro, recebeu 196,9 contra 216,4 HP de dano; recuperou 90 contra 131,1 HP (90 contra 100,4 de poções), gastando 21 contra 18,5 mana total e 0 contra 11,6 HP em conjurações. Começou com 181 contra 182 HP e defesa 2 contra 3. Escudos absorveram 0 contra 13; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 12,5 p.p. e de HP final -5,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para -25 p.p.; contraste de 37,5 p.p. e alteração de 8,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 96,2% do DPS efetivo de mago. Por encontro, recebeu 196,9 contra 96,6 HP de dano; recuperou 90 contra 37 HP (90 contra 37 de poções), gastando 21 contra 19,5 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 184 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final -26,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -37,5 p.p.; contraste de 37,5 p.p. e alteração de 13,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × arqueiro:** 0/8 mortes contra 4/8; 0 contra 0 limites de tempo. aventureiro manteve 130,7% do DPS efetivo de arqueiro. Por encontro, recebeu 196,9 contra 261,3 HP de dano; recuperou 90 contra 131,3 HP (90 contra 131,3 de poções), gastando 21 contra 16 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 176 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 4 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 50 p.p. e de HP final 14,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 50 para -75 p.p.; contraste de 125 p.p. e alteração de 45,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 65,5% do DPS efetivo de necromante. Por encontro, recebeu 196,9 contra 20 HP de dano; recuperou 90 contra 0 HP (90 contra 0 de poções), gastando 21 contra 17,8 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 171 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 22,8 de dano e receberam 0 contra 67,4. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -47,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -62,5 p.p.; contraste de 62,5 p.p. e alteração de -7,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × mago:** 1/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 106,4% do DPS efetivo de mago. Por encontro, recebeu 216,4 contra 96,6 HP de dano; recuperou 131,1 contra 37 HP (100,4 contra 37 de poções), gastando 18,5 contra 19,5 mana total e 11,6 contra 0 HP em conjurações. Começou com 182 contra 184 HP e defesa 3 contra 1. Escudos absorveram 13 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 1 só mago venceu; diferença de vitória -12,5 p.p. e de HP final -20,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Defesa plana zerada**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para -37,5 p.p.; contraste de 25 p.p. e alteração de 6,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: mago venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × arqueiro:** 1/8 mortes contra 4/8; 0 contra 0 limites de tempo. guerreiro manteve 144,6% do DPS efetivo de arqueiro. Por encontro, recebeu 216,4 contra 261,3 HP de dano; recuperou 131,1 contra 131,3 HP (100,4 contra 131,3 de poções), gastando 18,5 contra 16 mana total e 11,6 contra 0 HP em conjurações. Começou com 182 contra 176 HP e defesa 3 contra 2. Escudos absorveram 13 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 3 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 37,5 p.p. e de HP final 20,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 37,5 para -50 p.p.; contraste de 87,5 p.p. e alteração de 37,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: guerreiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × necromante:** 1/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 72,4% do DPS efetivo de necromante. Por encontro, recebeu 216,4 contra 20 HP de dano; recuperou 131,1 contra 0 HP (100,4 contra 0 de poções), gastando 18,5 contra 17,8 mana total e 11,6 contra 0 HP em conjurações. Começou com 182 contra 171 HP e defesa 3 contra 1. Escudos absorveram 13 contra 0; invocações causaram 0 contra 22,8 de dano e receberam 0 contra 67,4. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 1 só necromante venceu; diferença de vitória -12,5 p.p. e de HP final -41,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para -37,5 p.p.; contraste de 25 p.p. e alteração de 25,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × arqueiro:** 0/8 mortes contra 4/8; 0 contra 0 limites de tempo. mago manteve 135,9% do DPS efetivo de arqueiro. Por encontro, recebeu 96,6 contra 261,3 HP de dano; recuperou 37 contra 131,3 HP (37 contra 131,3 de poções), gastando 19,5 contra 16 mana total e 0 contra 0 HP em conjurações. Começou com 184 contra 176 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 4 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 50 p.p. e de HP final 41,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 50 para -37,5 p.p.; contraste de 87,5 p.p. e alteração de 58,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: mago venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 68,1% do DPS efetivo de necromante. Por encontro, recebeu 96,6 contra 20 HP de dano; recuperou 37 contra 0 HP (37 contra 0 de poções), gastando 19,5 contra 17,8 mana total e 0 contra 0 HP em conjurações. Começou com 184 contra 171 HP e defesa 1 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 22,8 de dano e receberam 0 contra 67,4. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -21 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -25 p.p.; contraste de 25 p.p. e alteração de 6,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**arqueiro × necromante:** 4/8 mortes contra 0/8; 0 contra 0 limites de tempo. arqueiro manteve 50,1% do DPS efetivo de necromante. Por encontro, recebeu 261,3 contra 20 HP de dano; recuperou 131,3 contra 0 HP (131,3 contra 0 de poções), gastando 16 contra 17,8 mana total e 0 contra 0 HP em conjurações. Começou com 176 contra 171 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 22,8 de dano e receberam 0 contra 67,4. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 4 só necromante venceu; diferença de vitória -50 p.p. e de HP final -62,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -50 para 12,5 p.p.; contraste de -62,5 p.p. e alteração de -52,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

### O que mudou ao retirar cada fator

**aventureiro, Sem poções de vida:** retirar esse fator perdeu 4 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 28 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**aventureiro, Sem habilidades da barra:** retirar esse fator perdeu 7 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 40,1 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Sem cura do básico:** retirar esse fator perdeu 2 vitórias e ganhou 1 nas mesmas 8 condições iniciais. O kit completo teve 9,9 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Sem poções de vida:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 25,4 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Sem habilidades da barra:** retirar esse fator perdeu 4 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 32 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Defesa plana zerada:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 8,4 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem poções de vida:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 14,1 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem habilidades da barra:** retirar esse fator perdeu 4 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 53,6 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem poções de vida:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 24,4 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem habilidades da barra:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 47,3 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 4/8; 4; 0 | 50 | 28 | 29 (99% do completo) | 4 / 0 |
| aventureiro | Sem habilidades da barra | 1/8; 7; 0 | 87,5 | 40,1 | 17,1 (58,6% do completo) | 7 / 0 |
| aventureiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 3,1 | 29,2 (100% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 6/8; 2; 0 | 12,5 | 9,9 | 34,4 (106,4% do completo) | 2 / 1 |
| guerreiro | Sem poções de vida | 5/8; 3; 0 | 25 | 25,4 | 34,9 (107,8% do completo) | 2 / 0 |
| guerreiro | Sem habilidades da barra | 3/8; 5; 0 | 50 | 32 | 17,5 (54,2% do completo) | 4 / 0 |
| guerreiro | Defesa plana zerada | 5/8; 3; 0 | 25 | 8,4 | 33,6 (103,8% do completo) | 2 / 0 |
| mago | Sem poções de vida | 7/8; 1; 0 | 12,5 | 14,1 | 30,8 (101,3% do completo) | 1 / 0 |
| mago | Sem habilidades da barra | 4/8; 4; 0 | 50 | 53,6 | 19 (62,4% do completo) | 4 / 0 |
| mago | Defesa plana zerada | 8/8; 0; 0 | 0 | 2,1 | 30,4 (100% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 1/8; 7; 0 | 37,5 | 24,4 | 23,1 (103,1% do completo) | 3 / 0 |
| arqueiro | Sem habilidades da barra | 7/8; 1; 0 | -37,5 | -5,1 | 21,1 (94,5% do completo) | 0 / 3 |
| arqueiro | Defesa plana zerada | 4/8; 4; 0 | 0 | 3,8 | 22,6 (101,2% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 44,7 (100% do completo) | 0 / 0 |
| necromante | Sem habilidades da barra | 6/8; 2; 0 | 25 | 47,3 | 22,7 (50,8% do completo) | 2 / 0 |
| necromante | Defesa plana zerada | 8/8; 0; 0 | 0 | 0,6 | 44,7 (100% do completo) | 0 / 0 |

## nível 30 · normal · duelo

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 8 s | — | 1 | 917 | 65,9 | 0 | 14,6 | 0 |
| guerreiro | 28,3 s | 34,9 s | 0,9 | 916,5 | 423,4 | 257,8 | 35,9 | 15 |
| mago | 11,3 s | — | 1 | 917 | 84,3 | 0 | 23,4 | 0 |
| arqueiro | 9 s | — | 1 | 917 | 6,5 | 0 | 22,1 | 0 |
| necromante | 8,5 s | — | 1 | 1.015,1 | 2,4 | 0 | 12,8 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 0 / 0 / 0 / 0 | 917 / 0 / 0 | 0 | 0 | 6,4 / 1,8 / 0 / 0 / 0 | 1,2 |
| guerreiro | 0 / 87,3 / 170,5 / 0 | 911,5 / 5 / 0 | 155,1 | 0 | 13,3 / 0,7 / 10,6 / 1,7 / 0 | 0,1 |
| mago | 0 / 0 / 0 / 0 | 808,6 / 108,4 / 0 | 0 | 0 | 9,2 / 3,3 / 0 / 0 / 0 | 2,1 |
| arqueiro | 0 / 0 / 0 / 0 | 891,3 / 25,8 / 0 | 0 | 0 | 7,3 / 2,2 / 0 / 0 / 0 | 2,4 |
| necromante | 0 / 0 / 0 / 0 | 966 / 0 / 49,1 | 3,3 | 0 | 4,7 / 1,5 / 0 / 0 / 0 | 2,6 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 9 / 0,1 | 8,9 / 1,9 / 2,8 | 0 / 0 | — | 0 / 6,1 |
| guerreiro | 29,5 / 3,8 | 13,3 / 3,3 / 3,9 | 0 / 0 | bloqueado: 226,6 | 0 / 25,5 |
| mago | 12,6 / 2,4 | 8,3 / 1,1 / 3,3 | 0,3 / 0,1 | — | 0 / 9 |
| arqueiro | 13,1 / 3,1 | 8,9 / 1,1 / 2,9 | 0 / 0,1 | — | 0 / 5,8 |
| necromante | 12,8 / 1,9 | 12,6 / 2,4 / 4,5 | 0,9 / 0 | — | 0 / 5,4 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 3,4 | 435 | 0 | 6,8 | 0 | — |
| aventureiro | explosao | 1,6 | 185,3 | 0 | 4,9 | 0 | — |
| aventureiro | golpe_atordoante | 1 | 123,3 | 0 | 3 | 0 | — |
| aventureiro | ataque_basico | 3 | 173,5 | 0 | 0 | 0 | — |
| guerreiro | investida | 4,9 | 136,8 | 0 | 19,5 | 0 | — |
| guerreiro | redemoinho | 5 | 121,3 | 0 | 0 | 15 | — |
| guerreiro | efeito:dano_direto | 0 | 5 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 87,3 | 0 | 0 | — |
| guerreiro | grito_de_guerra | 2,5 | 0 | 0 | 10 | 0 | — |
| guerreiro | ataque_basico | 15 | 653,5 | 0 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 2,1 | 0 | 0 | 6,4 | 0 | — |
| guerreiro | item:pocao_vida | 1,4 | 0 | 170,5 | 0 | 0 | — |
| mago | bola_de_fogo | 2 | 272,3 | 0 | 6 | 0 | — |
| mago | dardo_arcano | 6,8 | 237,3 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 2 | 38,5 | 0 | 8 | 0 | — |
| mago | raio_em_cadeia | 1,9 | 260,6 | 0 | 9,4 | 0 | — |
| mago | efeito:dano_direto | 0 | 25 | 0 | 0 | 0 | — |
| mago | efeito:queimando | 0 | 83,4 | 0 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 1,9 | 151,3 | 0 | 7,5 | 0 | — |
| arqueiro | chuva_de_flechas | 1,5 | 183,5 | 0 | 6 | 0 | — |
| arqueiro | flecha_venenosa | 1,1 | 102,9 | 0 | 3,4 | 0 | — |
| arqueiro | tiro_em_leque | 1,8 | 245,8 | 0 | 5,3 | 0 | — |
| arqueiro | tiro | 6,9 | 207,9 | 0 | 0 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 19 | 0 | 0 | 0 | — |
| arqueiro | efeito:dano_direto | 0 | 6,8 | 0 | 0 | 0 | — |
| necromante | dardo_funesto | 4,1 | 360,6 | 0 | 8,3 | 0 | — |
| necromante | garras_do_ossuario | 2,3 | 290,8 | 0 | 4,5 | 0 | — |
| necromante | toque_funesto | 6,4 | 314,6 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 49,1 | 0 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 0/8 mortes contra 1/8; 0 contra 0 limites de tempo. aventureiro manteve 423,8% do DPS efetivo de guerreiro. Por encontro, recebeu 65,9 contra 423,4 HP de dano; recuperou 0 contra 257,8 HP (0 contra 170,5 de poções), gastando 14,6 contra 35,9 mana total e 0 contra 15 HP em conjurações. Começou com 325 contra 310 HP e defesa 2 contra 3. Escudos absorveram 0 contra 155,1; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 12,5 p.p. e de HP final 38 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para 50 p.p.; contraste de -37,5 p.p. e alteração de -28,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 157,4% do DPS efetivo de mago. Por encontro, recebeu 65,9 contra 84,3 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 14,6 contra 23,4 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 6,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 11,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 110,2% do DPS efetivo de arqueiro. Por encontro, recebeu 65,9 contra 6,5 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 14,6 contra 22,1 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final -18,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 9,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 107,2% do DPS efetivo de necromante. Por encontro, recebeu 65,9 contra 2,4 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 14,6 contra 12,8 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 307 HP e defesa 2 contra 1. Escudos absorveram 0 contra 3,3; invocações causaram 0 contra 49,1 de dano e receberam 0 contra 53,8. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -19,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 10,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × mago:** 1/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 37,1% do DPS efetivo de mago. Por encontro, recebeu 423,4 contra 84,3 HP de dano; recuperou 257,8 contra 0 HP (170,5 contra 0 de poções), gastando 35,9 contra 23,4 mana total e 15 contra 0 HP em conjurações. Começou com 310 contra 320 HP e defesa 3 contra 1. Escudos absorveram 155,1 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 1 só mago venceu; diferença de vitória -12,5 p.p. e de HP final -31,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para -50 p.p.; contraste de 37,5 p.p. e alteração de 28,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: mago venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × arqueiro:** 1/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 26% do DPS efetivo de arqueiro. Por encontro, recebeu 423,4 contra 6,5 HP de dano; recuperou 257,8 contra 0 HP (170,5 contra 0 de poções), gastando 35,9 contra 22,1 mana total e 15 contra 0 HP em conjurações. Começou com 310 contra 320 HP e defesa 3 contra 2. Escudos absorveram 155,1 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 1 só arqueiro venceu; diferença de vitória -12,5 p.p. e de HP final -56,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para -50 p.p.; contraste de 37,5 p.p. e alteração de 28,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: arqueiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × necromante:** 1/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 25,3% do DPS efetivo de necromante. Por encontro, recebeu 423,4 contra 2,4 HP de dano; recuperou 257,8 contra 0 HP (170,5 contra 0 de poções), gastando 35,9 contra 12,8 mana total e 15 contra 0 HP em conjurações. Começou com 310 contra 307 HP e defesa 3 contra 1. Escudos absorveram 155,1 contra 3,3; invocações causaram 0 contra 49,1 de dano e receberam 0 contra 53,8. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 1 só necromante venceu; diferença de vitória -12,5 p.p. e de HP final -57,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para -50 p.p.; contraste de 37,5 p.p. e alteração de 28,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 70% do DPS efetivo de arqueiro. Por encontro, recebeu 84,3 contra 6,5 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 23,4 contra 22,1 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 320 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final -24,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -1,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 68,1% do DPS efetivo de necromante. Por encontro, recebeu 84,3 contra 2,4 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 23,4 contra 12,8 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 307 HP e defesa 1 contra 1. Escudos absorveram 0 contra 3,3; invocações causaram 0 contra 49,1 de dano e receberam 0 contra 53,8. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -25,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**arqueiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. arqueiro manteve 97,3% do DPS efetivo de necromante. Por encontro, recebeu 6,5 contra 2,4 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 22,1 contra 12,8 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 307 HP e defesa 2 contra 1. Escudos absorveram 0 contra 3,3; invocações causaram 0 contra 49,1 de dano e receberam 0 contra 53,8. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -1,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### O que mudou ao retirar cada fator

**guerreiro, Sem cura do básico:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 5,5 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Sem poções de vida:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 28,1 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Defesa plana zerada:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve -3,6 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 120,7 (100% do completo) | 0 / 0 |
| aventureiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | 34,3 | 46,5 (38,5% do completo) | 0 / 0 |
| aventureiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 0,6 | 120,7 (100% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 6/8; 2; 0 | 12,5 | 5,5 | 28,2 (99,1% do completo) | 1 / 0 |
| guerreiro | Sem poções de vida | 4/8; 4; 0 | 37,5 | 28,1 | 31,7 (111,3% do completo) | 3 / 0 |
| guerreiro | Sem habilidades da barra | 8/8; 0; 0 | -12,5 | -5,9 | 43,7 (153,5% do completo) | 0 / 1 |
| guerreiro | Defesa plana zerada | 6/8; 2; 0 | 12,5 | -3,6 | 29,4 (103,3% do completo) | 1 / 0 |
| mago | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 76,7 (100% do completo) | 0 / 0 |
| mago | Sem habilidades da barra | 8/8; 0; 0 | 0 | 23,2 | 43,5 (56,8% do completo) | 0 / 0 |
| mago | Defesa plana zerada | 8/8; 0; 0 | 0 | 0,4 | 76,7 (100% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 109,6 (100% do completo) | 0 / 0 |
| arqueiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | 24,4 | 78,5 (71,7% do completo) | 0 / 0 |
| arqueiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 0,1 | 109,6 (100% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 112,6 (100% do completo) | 0 / 0 |
| necromante | Sem habilidades da barra | 8/8; 0; 0 | 0 | 24,2 | 61,1 (54,2% do completo) | 0 / 0 |
| necromante | Defesa plana zerada | 8/8; 0; 0 | 0 | 0 | 112,6 (100% do completo) | 0 / 0 |

## nível 30 · normal · pressao

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 26,8 s | — | 1 | 2.709 | 294,8 | 166 | 42,3 | 0 |
| guerreiro | — | 21 s | 0 | 1.144,3 | 618,1 | 318,6 | 23,4 | 10,5 |
| mago | — | 14,9 s | 0 | 1.231,3 | 576 | 256 | 13,9 | 0 |
| arqueiro | 17,6 s | 18,9 s | 0,1 | 2.107,4 | 562,5 | 256 | 22,9 | 0 |
| necromante | 32,3 s | 18,2 s | 0,5 | 2.224,8 | 504,4 | 262,9 | 16,3 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 16,3 / 36 / 113,8 / 0 | 2.709 / 0 / 0 | 0 | 0 | 18,8 / 10,5 / 0 / 0 / 0 | 1,8 |
| guerreiro | 0 / 70,6 / 248 / 0 | 1.139,3 / 5 / 0 | 99 | 0 | 8,2 / 0,7 / 7,4 / 2,8 / 0 | 0,1 |
| mago | 0 / 0 / 256 / 0 | 1.061,1 / 170,1 / 0 | 0 | 0 | 9,2 / 8,7 / 0 / 2,4 / 0 | 1 |
| arqueiro | 0 / 0 / 256 / 0 | 2.024,9 / 82,5 / 0 | 0 | 0 | 13,1 / 6 / 0 / 4 / 0 | 1,9 |
| necromante | 0 / 16,9 / 246 / 0 | 1.988,4 / 0 / 236,4 | 35,8 | 11,3 | 10,3 / 1,8 / 0 / 3,2 / 0 | 2,3 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 28,8 / 3,4 | 24,1 / 4,1 / 8,9 | 0 / 0 | — | 2,3 / 20,8 |
| guerreiro | 17,9 / 2 | 10,4 / 1,8 / 4,1 | 0 / 0 | bloqueado: 117,1 | 0 / 15,6 |
| mago | 13,5 / 1,6 | 13,6 / 2 / 5,3 | 0 / 0 | — | 0 / 7,6 |
| arqueiro | 23 / 0,6 | 24,4 / 3 / 9,3 | 0 / 0,5 | — | 0 / 8,8 |
| necromante | 25,5 / 2,3 | 33 / 5,1 / 12,1 | 1,5 / 0 | — | 4,5 / 8,9 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 9,5 | 1.169,4 | 0 | 19 | 0 | — |
| aventureiro | explosao | 4,5 | 759,4 | 0 | 13,5 | 0 | — |
| aventureiro | golpe_atordoante | 2,9 | 259,8 | 0 | 8,6 | 0 | — |
| aventureiro | ataque_basico | 10,8 | 520,5 | 0 | 0 | 0 | — |
| aventureiro | item:pocao_vida | 0,9 | 0 | 113,8 | 0 | 0 | — |
| aventureiro | curar | 1,1 | 0 | 16,3 | 1,1 | 0 | 14,4 |
| aventureiro | efeito:cura_periodica | 0 | 0 | 36 | 0 | 0 | — |
| guerreiro | investida | 3,1 | 136,8 | 0 | 12,5 | 0 | — |
| guerreiro | redemoinho | 3,5 | 560,8 | 0 | 0 | 10,5 | — |
| guerreiro | efeito:dano_direto | 0 | 5 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 70,6 | 0 | 0 | — |
| guerreiro | grito_de_guerra | 1,9 | 0 | 0 | 7,5 | 0 | — |
| guerreiro | escudo_de_ferro | 1,1 | 0 | 0 | 3,4 | 0 | — |
| guerreiro | ataque_basico | 8,3 | 441,8 | 0 | 0 | 0 | — |
| guerreiro | item:pocao_vida | 2 | 0 | 248 | 0 | 0 | — |
| mago | bola_de_fogo | 1,3 | 300,1 | 0 | 3,8 | 0 | — |
| mago | dardo_arcano | 10 | 475,8 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 1,1 | 0 | 0 | 4,5 | 0 | — |
| mago | efeito:dano_direto | 0 | 31,4 | 0 | 0 | 0 | — |
| mago | raio_em_cadeia | 1,1 | 285,3 | 0 | 5,6 | 0 | — |
| mago | efeito:queimando | 0 | 138,8 | 0 | 0 | 0 | — |
| mago | item:pocao_vida | 2 | 0 | 256 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 2 | 155,8 | 0 | 8 | 0 | — |
| arqueiro | chuva_de_flechas | 1,8 | 485,3 | 0 | 7 | 0 | — |
| arqueiro | flecha_venenosa | 1,6 | 131,4 | 0 | 4,9 | 0 | — |
| arqueiro | tiro_em_leque | 1 | 239,3 | 0 | 3 | 0 | — |
| arqueiro | tiro | 16,6 | 1.013,3 | 0 | 0 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 66,4 | 0 | 0 | 0 | — |
| arqueiro | efeito:dano_direto | 0 | 16,1 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 2 | 0 | 256 | 0 | 0 | — |
| necromante | dardo_funesto | 4,8 | 471,6 | 0 | 9,5 | 0 | — |
| necromante | garras_do_ossuario | 2,3 | 390,4 | 0 | 4,5 | 0 | — |
| necromante | toque_funesto | 17,4 | 1.126,4 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 236,4 | 0 | 0 | 0 | — |
| necromante | efeito:cura | 0 | 0 | 16,9 | 0 | 0 | — |
| necromante | item:pocao_vida | 2 | 0 | 246 | 0 | 0 | — |
| necromante | dizimo_vital | 0,6 | 0 | 0 | 1,3 | 0 | — |
| necromante | comando_sepulcral | 0,5 | 0 | 0 | 1 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 0/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 187,7% do DPS efetivo de guerreiro. Por encontro, recebeu 294,8 contra 618,1 HP de dano; recuperou 166 contra 318,6 HP (113,8 contra 248 de poções), gastando 42,3 contra 23,4 mana total e 0 contra 10,5 HP em conjurações. Começou com 325 contra 310 HP e defesa 2 contra 3. Escudos absorveram 0 contra 99; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 8 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 100 p.p. e de HP final 61,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 100 para 0 p.p.; contraste de 100 p.p. e alteração de 61,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × mago:** 0/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 126,2% do DPS efetivo de mago. Por encontro, recebeu 294,8 contra 576 HP de dano; recuperou 166 contra 256 HP (113,8 contra 256 de poções), gastando 42,3 contra 13,9 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 8 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 100 p.p. e de HP final 61,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 100 para 0 p.p.; contraste de 100 p.p. e alteração de 61,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × arqueiro:** 0/8 mortes contra 7/8; 0 contra 0 limites de tempo. aventureiro manteve 86,3% do DPS efetivo de arqueiro. Por encontro, recebeu 294,8 contra 562,5 HP de dano; recuperou 166 contra 256 HP (113,8 contra 256 de poções), gastando 42,3 contra 22,9 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 7 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 87,5 p.p. e de HP final 56,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 87,5 para 0 p.p.; contraste de 87,5 p.p. e alteração de 56,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 0/8 mortes contra 4/8; 0 contra 0 limites de tempo. aventureiro manteve 111,6% do DPS efetivo de necromante. Por encontro, recebeu 294,8 contra 504,4 HP de dano; recuperou 166 contra 262,9 HP (113,8 contra 246 de poções), gastando 42,3 contra 16,3 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 307 HP e defesa 2 contra 1. Escudos absorveram 0 contra 35,8; invocações causaram 0 contra 236,4 de dano e receberam 0 contra 163,9. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 4 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 50 p.p. e de HP final 38,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 50 para -12,5 p.p.; contraste de 62,5 p.p. e alteração de 46,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × mago:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 67,2% do DPS efetivo de mago. Por encontro, recebeu 618,1 contra 576 HP de dano; recuperou 318,6 contra 256 HP (248 contra 256 de poções), gastando 23,4 contra 13,9 mana total e 10,5 contra 0 HP em conjurações. Começou com 310 contra 320 HP e defesa 3 contra 1. Escudos absorveram 99 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 8/8 mortes contra 7/8; 0 contra 0 limites de tempo. guerreiro manteve 46% do DPS efetivo de arqueiro. Por encontro, recebeu 618,1 contra 562,5 HP de dano; recuperou 318,6 contra 256 HP (248 contra 256 de poções), gastando 23,4 contra 22,9 mana total e 10,5 contra 0 HP em conjurações. Começou com 310 contra 320 HP e defesa 3 contra 2. Escudos absorveram 99 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 1 só arqueiro venceu; diferença de vitória -12,5 p.p. e de HP final -4,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para 0 p.p.; contraste de -12,5 p.p. e alteração de -4,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: arqueiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × necromante:** 8/8 mortes contra 4/8; 0 contra 0 limites de tempo. guerreiro manteve 59,5% do DPS efetivo de necromante. Por encontro, recebeu 618,1 contra 504,4 HP de dano; recuperou 318,6 contra 262,9 HP (248 contra 246 de poções), gastando 23,4 contra 16,3 mana total e 10,5 contra 0 HP em conjurações. Começou com 310 contra 307 HP e defesa 3 contra 1. Escudos absorveram 99 contra 35,8; invocações causaram 0 contra 236,4 de dano e receberam 0 contra 163,9. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 4 só necromante venceu; diferença de vitória -50 p.p. e de HP final -22,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -50 para 0 p.p.; contraste de -50 p.p. e alteração de -22,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × arqueiro:** 8/8 mortes contra 7/8; 0 contra 0 limites de tempo. mago manteve 68,4% do DPS efetivo de arqueiro. Por encontro, recebeu 576 contra 562,5 HP de dano; recuperou 256 contra 256 HP (256 contra 256 de poções), gastando 13,9 contra 22,9 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 320 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 1 só arqueiro venceu; diferença de vitória -12,5 p.p. e de HP final -4,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para 0 p.p.; contraste de -12,5 p.p. e alteração de -4,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: arqueiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × necromante:** 8/8 mortes contra 4/8; 0 contra 0 limites de tempo. mago manteve 88,5% do DPS efetivo de necromante. Por encontro, recebeu 576 contra 504,4 HP de dano; recuperou 256 contra 262,9 HP (256 contra 246 de poções), gastando 13,9 contra 16,3 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 307 HP e defesa 1 contra 1. Escudos absorveram 0 contra 35,8; invocações causaram 0 contra 236,4 de dano e receberam 0 contra 163,9. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 4 só necromante venceu; diferença de vitória -50 p.p. e de HP final -22,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -50 para 0 p.p.; contraste de -50 p.p. e alteração de -22,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**arqueiro × necromante:** 7/8 mortes contra 4/8; 0 contra 0 limites de tempo. arqueiro manteve 129,4% do DPS efetivo de necromante. Por encontro, recebeu 562,5 contra 504,4 HP de dano; recuperou 256 contra 262,9 HP (256 contra 246 de poções), gastando 22,9 contra 16,3 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 307 HP e defesa 2 contra 1. Escudos absorveram 0 contra 35,8; invocações causaram 0 contra 236,4 de dano e receberam 0 contra 163,9. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só arqueiro venceu, 4 só necromante venceu; diferença de vitória -37,5 p.p. e de HP final -18,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -37,5 para 0 p.p.; contraste de -37,5 p.p. e alteração de -18,6 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### O que mudou ao retirar cada fator

**aventureiro, Sem habilidades da barra:** retirar esse fator perdeu 8 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 61,1 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem poções de vida:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 4,2 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem habilidades da barra:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 4,2 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem poções de vida:** retirar esse fator perdeu 4 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 22,8 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem habilidades da barra:** retirar esse fator perdeu 4 vitórias e ganhou 1 nas mesmas 8 condições iniciais. O kit completo teve 14,4 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 8/8; 0; 0 | 0 | 26,9 | 102,9 (95,4% do completo) | 0 / 0 |
| aventureiro | Sem habilidades da barra | 0/8; 8; 0 | 100 | 61,1 | 50,8 (47,1% do completo) | 8 / 0 |
| aventureiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 4,5 | 107,8 (100% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 0/8; 8; 0 | 0 | 0 | 57,5 (100% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 68,2 (118,7% do completo) | 0 / 0 |
| guerreiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 45,2 (78,6% do completo) | 0 / 0 |
| guerreiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 57,1 (99,3% do completo) | 0 / 0 |
| mago | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 106,8 (124,9% do completo) | 0 / 0 |
| mago | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 42,7 (49,9% do completo) | 0 / 0 |
| mago | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 87,3 (102,1% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 0/8; 8; 0 | 12,5 | 4,2 | 142,8 (114,2% do completo) | 1 / 0 |
| arqueiro | Sem habilidades da barra | 0/8; 8; 0 | 12,5 | 4,2 | 80,4 (64,3% do completo) | 1 / 0 |
| arqueiro | Defesa plana zerada | 1/8; 7; 0 | 0 | 0,6 | 125 (100% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 0/8; 8; 0 | 50 | 22,8 | 86,3 (89,3% do completo) | 4 / 0 |
| necromante | Sem habilidades da barra | 1/8; 7; 0 | 37,5 | 14,4 | 61,6 (63,7% do completo) | 4 / 1 |
| necromante | Defesa plana zerada | 4/8; 4; 0 | 0 | 1,6 | 96,6 (99,9% do completo) | 0 / 0 |

## nível 30 · normal · atrito

### Onde o desgaste aparece

| Classe | Onda | Chegaram/n inicial | Mortes / limites nesta onda | HP entrada → saída | Mana entrada → saída | Recebido / cura / mana gasta |
|---|---|---|---|---|---|---|
| aventureiro | 1 | 8/8 | 0 / 0 | 325 → 265,9 | 30 → 22,4 | 75,4 / 16,3 / 16,5 |
| aventureiro | 2 | 8/8 | 0 / 0 | 265,9 → 185,6 | 22,4 → 20,1 | 118,9 / 29,6 / 15,3 |
| aventureiro | 3 | 8/8 | 0 / 0 | 185,6 → 188,9 | 20,1 → 15,4 | 149,8 / 142,5 / 19,4 |
| aventureiro | 4 | 8/8 | 1 / 0 | 188,9 → 150 | 15,4 → 14 | 103,6 / 55,4 / 12,5 |
| aventureiro | 5 | 7/8 | 0 / 0 | 171,4 → 175,1 | 14,1 → 7,4 | 129,7 / 132,6 / 15,7 |
| guerreiro | 1 | 8/8 | 0 / 0 | 310 → 175,1 | 30 → 21,4 | 433,5 / 311,8 / 29,4 |
| guerreiro | 2 | 8/8 | 8 / 0 | 175,1 → 0 | 21,4 → 18,8 | 270,9 / 89 / 22,3 |
| mago | 1 | 8/8 | 0 / 0 | 320 → 184,8 | 30 → 25,8 | 231,3 / 96 / 24,9 |
| mago | 2 | 8/8 | 2 / 0 | 184,8 → 127,1 | 25,8 → 28,6 | 180,5 / 120,3 / 14,3 |
| mago | 3 | 6/8 | 0 / 0 | 169,5 → 98,5 | 28,2 → 16,5 | 103,3 / 32,3 / 20,8 |
| mago | 4 | 6/8 | 6 / 0 | 98,5 → 0 | 16,5 → 24,7 | 141,2 / 42,7 / 0 |
| arqueiro | 1 | 8/8 | 0 / 0 | 320 → 303,1 | 30 → 16,3 | 16,9 / 0 / 22,5 |
| arqueiro | 2 | 8/8 | 0 / 0 | 303,1 → 264 | 16,3 → 17,8 | 55,1 / 16 / 12,6 |
| arqueiro | 3 | 8/8 | 0 / 0 | 264 → 196,5 | 17,8 → 10,9 | 116,3 / 48 / 18,6 |
| arqueiro | 4 | 8/8 | 1 / 0 | 196,5 → 139,5 | 10,9 → 14,6 | 89,8 / 32 / 9,8 |
| arqueiro | 5 | 7/8 | 0 / 0 | 159,4 → 160,4 | 14 → 12,8 | 74,3 / 73,1 / 15,3 |
| necromante | 1 | 8/8 | 0 / 0 | 307 → 304 | 30 → 27,9 | 3 / 0 / 10,8 |
| necromante | 2 | 8/8 | 0 / 0 | 304 → 294,4 | 27,9 → 29,8 | 10 / 0 / 8 |
| necromante | 3 | 8/8 | 0 / 0 | 294,4 → 302,5 | 29,8 → 28,9 | 0 / 0 / 12,8 |
| necromante | 4 | 8/8 | 0 / 0 | 302,5 → 293,9 | 28,9 → 29,8 | 11,6 / 0 / 7,8 |
| necromante | 5 | 8/8 | 0 / 0 | 293,9 → 275,9 | 29,8 → 28,4 | 18 / 0 / 7,8 |

Médias de cada onda incluem apenas quem chegou a ela; o denominador inicial mostra a seleção dos sobreviventes. Não compare a vida da onda 5 como se incluísse quem morreu antes.

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 50,6 s | 33,5 s | 4,8 | 4.325,5 | 561,1 | 359,8 | 77,4 | 0 |
| guerreiro | — | 50,4 s | 1 | 1.511,9 | 704,4 | 400,8 | 51,6 | 21,4 |
| mago | — | 45,4 s | 2,5 | 2.688,8 | 595,1 | 272,5 | 54,8 | 0 |
| arqueiro | 37,7 s | 34,5 s | 4,8 | 4.399 | 343 | 160 | 76,9 | 0 |
| necromante | 42,6 s | — | 5 | 5.045,1 | 42,6 | 0 | 47 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 55 / 126 / 178,8 / 0 | 4.325,5 / 0 / 0 | 0 | 0 | 35,6 / 11,3 / 0 / 3 / 0 | 1,2 |
| guerreiro | 0 / 152,8 / 248 / 0 | 1.506,9 / 5 / 0 | 225 | 0 | 19,7 / 1,6 / 15 / 10,8 / 0 | 0,1 |
| mago | 0 / 16,5 / 256 / 0 | 2.490,4 / 198,4 / 0 | 75 | 0 | 30,6 / 5,2 / 0 / 7,4 / 0 | 1,9 |
| arqueiro | 0 / 0 / 160 / 0 | 4.310,5 / 88,5 / 0 | 0 | 0 | 32,2 / 8,4 / 0 / 0,8 / 1,2 | 2,5 |
| necromante | 0 / 0 / 0 / 0 | 4.145,1 / 0 / 900 | 32,5 | 0 | 21,5 / 8,9 / 0 / 0 / 0 | 2,7 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 55,4 / 10,1 | 39 / 7,3 / 14 | 0 / 0 | — | 29,6 / 43,3 |
| guerreiro | 43,3 / 4,5 | 20,3 / 3,4 / 7 | 0 / 0 | bloqueado: 410; recurso: 0,3 | 15 / 40,4 |
| mago | 43,6 / 4,9 | 32,9 / 6,3 / 11,8 | 0,6 / 0,5 | — | 2,6 / 33,6 |
| arqueiro | 59,8 / 10,6 | 45,6 / 7,4 / 17,6 | 0,1 / 1,3 | — | 3,4 / 32,3 |
| necromante | 56 / 8,8 | 88,1 / 13,4 / 37 | 2,9 / 0 | — | 11,5 / 25,3 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 16,6 | 2.203,4 | 0 | 33,3 | 0 | — |
| aventureiro | explosao | 8,3 | 1.018,1 | 0 | 24,8 | 0 | — |
| aventureiro | golpe_atordoante | 5,4 | 383,9 | 0 | 16,1 | 0 | — |
| aventureiro | ataque_basico | 21,9 | 720,1 | 0 | 0 | 0 | — |
| aventureiro | curar | 3,3 | 0 | 55 | 3,3 | 0 | 16,9 |
| aventureiro | efeito:cura_periodica | 0 | 0 | 126 | 0 | 0 | — |
| aventureiro | item:pocao_vida | 1,4 | 0 | 178,8 | 0 | 0 | — |
| guerreiro | investida | 7,1 | 141,1 | 0 | 28,5 | 0 | — |
| guerreiro | redemoinho | 7,1 | 124,5 | 0 | 0 | 21,4 | — |
| guerreiro | efeito:dano_direto | 0 | 5 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 152,8 | 0 | 0 | — |
| guerreiro | grito_de_guerra | 3,6 | 0 | 0 | 14,5 | 0 | — |
| guerreiro | ataque_basico | 22,5 | 1.241,3 | 0 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 2,9 | 0 | 0 | 8,6 | 0 | — |
| guerreiro | item:pocao_vida | 2 | 0 | 248 | 0 | 0 | — |
| mago | bola_de_fogo | 4,6 | 558,3 | 0 | 13,9 | 0 | — |
| mago | dardo_arcano | 29,4 | 1.211,4 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 4,3 | 143,4 | 0 | 17 | 0 | — |
| mago | raio_em_cadeia | 3,9 | 577,4 | 0 | 19,4 | 0 | — |
| mago | efeito:dano_direto | 0 | 51,5 | 0 | 0 | 0 | — |
| mago | efeito:queimando | 0 | 146,9 | 0 | 0 | 0 | — |
| mago | barreira | 1,5 | 0 | 0 | 4,5 | 0 | — |
| mago | efeito:cura | 0 | 0 | 16,5 | 0 | 0 | — |
| mago | item:pocao_vida | 2 | 0 | 256 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 6,4 | 787,8 | 0 | 25,5 | 0 | — |
| arqueiro | chuva_de_flechas | 4,9 | 667,8 | 0 | 19,5 | 0 | — |
| arqueiro | flecha_venenosa | 4,8 | 390,9 | 0 | 14,3 | 0 | — |
| arqueiro | tiro_em_leque | 5,9 | 702,5 | 0 | 17,6 | 0 | — |
| arqueiro | tiro | 37,9 | 1.761,6 | 0 | 0 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 54,6 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 1,3 | 0 | 160 | 0 | 0 | — |
| arqueiro | efeito:dano_direto | 0 | 33,9 | 0 | 0 | 0 | — |
| necromante | dardo_funesto | 15,3 | 1.775,9 | 0 | 30,5 | 0 | — |
| necromante | garras_do_ossuario | 8,3 | 830 | 0 | 16,5 | 0 | — |
| necromante | toque_funesto | 32,5 | 1.539,3 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 900 | 0 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 1/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 290,3% do DPS efetivo de guerreiro. Por encontro, recebeu 561,1 contra 704,4 HP de dano; recuperou 359,8 contra 400,8 HP (178,8 contra 248 de poções), gastando 77,4 contra 51,6 mana total e 0 contra 21,4 HP em conjurações. Começou com 325 contra 310 HP e defesa 2 contra 3. Escudos absorveram 0 contra 225; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 7 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 87,5 p.p. e de HP final 47,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 87,5 para 0 p.p.; contraste de 87,5 p.p. e alteração de 47,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × mago:** 1/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 157,3% do DPS efetivo de mago. Por encontro, recebeu 561,1 contra 595,1 HP de dano; recuperou 359,8 contra 272,5 HP (178,8 contra 256 de poções), gastando 77,4 contra 54,8 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 1. Escudos absorveram 0 contra 75; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 7 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 87,5 p.p. e de HP final 47,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 87,5 para 0 p.p.; contraste de 87,5 p.p. e alteração de 47,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × arqueiro:** 1/8 mortes contra 1/8; 0 contra 0 limites de tempo. aventureiro manteve 83,8% do DPS efetivo de arqueiro. Por encontro, recebeu 561,1 contra 343 HP de dano; recuperou 359,8 contra 160 HP (178,8 contra 160 de poções), gastando 77,4 contra 76,9 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só aventureiro venceu, 1 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 3,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Defesa plana zerada**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 12,5 p.p.; contraste de -12,5 p.p. e alteração de -2,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 1/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 79,8% do DPS efetivo de necromante. Por encontro, recebeu 561,1 contra 42,6 HP de dano; recuperou 359,8 contra 0 HP (178,8 contra 0 de poções), gastando 77,4 contra 47 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 307 HP e defesa 2 contra 1. Escudos absorveram 0 contra 32,5; invocações causaram 0 contra 900 de dano e receberam 0 contra 356. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 1 só necromante venceu; diferença de vitória -12,5 p.p. e de HP final -42,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para -62,5 p.p.; contraste de 50 p.p. e alteração de 31 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × mago:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 54,2% do DPS efetivo de mago. Por encontro, recebeu 704,4 contra 595,1 HP de dano; recuperou 400,8 contra 272,5 HP (248 contra 256 de poções), gastando 51,6 contra 54,8 mana total e 21,4 contra 0 HP em conjurações. Começou com 310 contra 320 HP e defesa 3 contra 1. Escudos absorveram 225 contra 75; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 8/8 mortes contra 1/8; 0 contra 0 limites de tempo. guerreiro manteve 28,9% do DPS efetivo de arqueiro. Por encontro, recebeu 704,4 contra 343 HP de dano; recuperou 400,8 contra 160 HP (248 contra 160 de poções), gastando 51,6 contra 76,9 mana total e 21,4 contra 0 HP em conjurações. Começou com 310 contra 320 HP e defesa 3 contra 2. Escudos absorveram 225 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 7 só arqueiro venceu; diferença de vitória -87,5 p.p. e de HP final -43,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -87,5 para 0 p.p.; contraste de -87,5 p.p. e alteração de -43,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: arqueiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × necromante:** 8/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 27,5% do DPS efetivo de necromante. Por encontro, recebeu 704,4 contra 42,6 HP de dano; recuperou 400,8 contra 0 HP (248 contra 0 de poções), gastando 51,6 contra 47 mana total e 21,4 contra 0 HP em conjurações. Começou com 310 contra 307 HP e defesa 3 contra 1. Escudos absorveram 225 contra 32,5; invocações causaram 0 contra 900 de dano e receberam 0 contra 356. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 8 só necromante venceu; diferença de vitória -100 p.p. e de HP final -89,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -100 para -50 p.p.; contraste de -50 p.p. e alteração de -62,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × arqueiro:** 8/8 mortes contra 1/8; 0 contra 0 limites de tempo. mago manteve 53,3% do DPS efetivo de arqueiro. Por encontro, recebeu 595,1 contra 343 HP de dano; recuperou 272,5 contra 160 HP (256 contra 160 de poções), gastando 54,8 contra 76,9 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 320 HP e defesa 1 contra 2. Escudos absorveram 75 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 7 só arqueiro venceu; diferença de vitória -87,5 p.p. e de HP final -43,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -87,5 para 0 p.p.; contraste de -87,5 p.p. e alteração de -43,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: arqueiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × necromante:** 8/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 50,7% do DPS efetivo de necromante. Por encontro, recebeu 595,1 contra 42,6 HP de dano; recuperou 272,5 contra 0 HP (256 contra 0 de poções), gastando 54,8 contra 47 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 307 HP e defesa 1 contra 1. Escudos absorveram 75 contra 32,5; invocações causaram 0 contra 900 de dano e receberam 0 contra 356. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 8 só necromante venceu; diferença de vitória -100 p.p. e de HP final -89,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -100 para -50 p.p.; contraste de -50 p.p. e alteração de -62,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**arqueiro × necromante:** 1/8 mortes contra 0/8; 0 contra 0 limites de tempo. arqueiro manteve 95,3% do DPS efetivo de necromante. Por encontro, recebeu 343 contra 42,6 HP de dano; recuperou 160 contra 0 HP (160 contra 0 de poções), gastando 76,9 contra 47 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 307 HP e defesa 2 contra 1. Escudos absorveram 0 contra 32,5; invocações causaram 0 contra 900 de dano e receberam 0 contra 356. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 1 só necromante venceu; diferença de vitória -12,5 p.p. e de HP final -46 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para -62,5 p.p.; contraste de 50 p.p. e alteração de 30,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

### O que mudou ao retirar cada fator

**aventureiro, Sem poções de vida:** retirar esse fator perdeu 4 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 31 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**aventureiro, Sem habilidades da barra:** retirar esse fator perdeu 7 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 47,2 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem poções de vida:** retirar esse fator perdeu 4 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 30,3 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem habilidades da barra:** retirar esse fator perdeu 7 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 43,9 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem habilidades da barra:** retirar esse fator perdeu 4 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 62,1 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 3/8; 5; 0 | 50 | 31 | 94,3 (102,3% do completo) | 4 / 0 |
| aventureiro | Sem habilidades da barra | 0/8; 8; 0 | 87,5 | 47,2 | 48,1 (52,2% do completo) | 7 / 0 |
| aventureiro | Defesa plana zerada | 8/8; 0; 0 | -12,5 | -5,1 | 90,5 (98,3% do completo) | 0 / 1 |
| guerreiro | Sem cura do básico | 0/8; 8; 0 | 0 | 0 | 32,2 (101,5% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 37,5 (118,2% do completo) | 0 / 0 |
| guerreiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 43,7 (137,6% do completo) | 0 / 0 |
| guerreiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 33 (103,9% do completo) | 0 / 0 |
| mago | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 55,6 (94,8% do completo) | 0 / 0 |
| mago | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 43,6 (74,4% do completo) | 0 / 0 |
| mago | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 58,9 (100,5% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 3/8; 5; 0 | 50 | 30,3 | 110,2 (100,2% do completo) | 4 / 0 |
| arqueiro | Sem habilidades da barra | 0/8; 8; 0 | 87,5 | 43,9 | 81,1 (73,8% do completo) | 7 / 0 |
| arqueiro | Defesa plana zerada | 7/8; 1; 0 | 0 | -2,3 | 110 (100% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 115,4 (100% do completo) | 0 / 0 |
| necromante | Sem habilidades da barra | 4/8; 1; 3 | 50 | 62,1 | 61,3 (53,1% do completo) | 4 / 0 |
| necromante | Defesa plana zerada | 8/8; 0; 0 | 0 | 0,2 | 115,4 (100% do completo) | 0 / 0 |

## nível 30 · normal · chefe

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 14 s | — | 1 | 1.213 | 98 | 2,6 | 21,9 | 0 |
| guerreiro | 14,5 s | — | 1 | 1.242 | 83,9 | 52,4 | 14,5 | 8,6 |
| mago | 25,8 s | — | 1 | 1.266 | 138,3 | 48 | 36 | 0 |
| arqueiro | 10,9 s | — | 1 | 1.206 | 128,1 | 0 | 26,4 | 0 |
| necromante | 11,6 s | — | 1 | 1.413,1 | 6,1 | 0 | 15,5 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 2,6 / 0 / 0 / 0 | 1.213 / 0 / 0 | 0 | 0 | 9,2 / 4,9 / 0,8 / 0 / 0 | 1,4 |
| guerreiro | 0 / 52,4 / 0 / 0 | 1.231,8 / 10,3 / 0 | 21 | 0 | 6,3 / 1,8 / 5,2 / 0 / 0 | 1 |
| mago | 0 / 0 / 48 / 0 | 1.208,5 / 57,5 / 0 | 0 | 0 | 17,9 / 5,6 / 0,6 / 0 / 0 | 1,9 |
| arqueiro | 0 / 0 / 0 / 0 | 1.170 / 36 / 0 | 0 | 0 | 8,6 / 4 / 1 / 0 / 0 | 2,1 |
| necromante | 0 / 0 / 0 / 0 | 1.338,9 / 0 / 74,3 | 6,5 | 0 | 6,1 / 3,4 / 0 / 0 / 0 | 2,7 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 13 / 1,4 | 10,6 / 1,8 / 3 | 0 / 0 | bloqueado: 1 | 0 / 9,1 |
| guerreiro | 12,1 / 0,1 | 11,1 / 1,5 / 4,8 | 0 / 0 | bloqueado: 15,5 | 0 / 11,3 |
| mago | 25,4 / 6,6 | 16,3 / 3,5 / 5,6 | 0,6 / 0,1 | — | 0 / 18,9 |
| arqueiro | 15,4 / 4,4 | 10,8 / 1,9 / 3,6 | 0 / 0,6 | bloqueado: 1,4 | 0 / 8 |
| necromante | 16,4 / 2 | 17,9 / 3,6 / 5,9 | 1,5 / 0 | — | 0 / 7,9 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 4,9 | 585,9 | 0 | 9,8 | 0 | — |
| aventureiro | explosao | 2,5 | 410,9 | 0 | 7,5 | 0 | — |
| aventureiro | golpe_atordoante | 1,5 | 68,8 | 0 | 4,5 | 0 | — |
| aventureiro | ataque_basico | 4 | 147,5 | 0 | 0 | 0 | — |
| aventureiro | curar | 0,1 | 0 | 2,6 | 0,1 | 0 | 21 |
| guerreiro | investida | 2,5 | 408,8 | 0 | 10 | 0 | — |
| guerreiro | redemoinho | 2,9 | 432,9 | 0 | 0 | 8,6 | — |
| guerreiro | efeito:dano_direto | 0 | 10,3 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 52,4 | 0 | 0 | — |
| guerreiro | grito_de_guerra | 1,1 | 0 | 0 | 4,5 | 0 | — |
| guerreiro | ataque_basico | 5,6 | 390,1 | 0 | 0 | 0 | — |
| mago | bola_de_fogo | 3,6 | 175,3 | 0 | 10,9 | 0 | — |
| mago | dardo_arcano | 16,1 | 492,3 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 3 | 272,6 | 0 | 12 | 0 | — |
| mago | raio_em_cadeia | 2,6 | 268,4 | 0 | 13,1 | 0 | — |
| mago | efeito:dano_direto | 0 | 31,9 | 0 | 0 | 0 | — |
| mago | efeito:queimando | 0 | 25,6 | 0 | 0 | 0 | — |
| mago | item:pocao_vida | 0,4 | 0 | 48 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 2,4 | 302,5 | 0 | 9,5 | 0 | — |
| arqueiro | chuva_de_flechas | 1,9 | 312,9 | 0 | 7,5 | 0 | — |
| arqueiro | tiro | 8 | 240,4 | 0 | 0 | 0 | — |
| arqueiro | flecha_venenosa | 1,6 | 126,8 | 0 | 4,9 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 18 | 0 | 0 | 0 | — |
| arqueiro | tiro_em_leque | 1,5 | 187,5 | 0 | 4,5 | 0 | — |
| arqueiro | efeito:dano_direto | 0 | 18 | 0 | 0 | 0 | — |
| necromante | dardo_funesto | 5,1 | 526,9 | 0 | 10,3 | 0 | — |
| necromante | garras_do_ossuario | 2,6 | 390,5 | 0 | 5,3 | 0 | — |
| necromante | toque_funesto | 8,6 | 421,5 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 74,3 | 0 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 114% do DPS efetivo de guerreiro. Por encontro, recebeu 98 contra 83,9 HP de dano; recuperou 2,6 contra 52,4 HP (0 contra 0 de poções), gastando 21,9 contra 14,5 mana total e 0 contra 8,6 HP em conjurações. Começou com 325 contra 310 HP e defesa 2 contra 3. Escudos absorveram 0 contra 21; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 0 p.p. e de HP final -16,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -25,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 195,3% do DPS efetivo de mago. Por encontro, recebeu 98 contra 138,3 HP de dano; recuperou 2,6 contra 48 HP (0 contra 48 de poções), gastando 21,9 contra 36 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final -1,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 12,5 p.p.; contraste de -12,5 p.p. e alteração de -26,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 89,5% do DPS efetivo de arqueiro. Por encontro, recebeu 98 contra 128,1 HP de dano; recuperou 2,6 contra 0 HP (0 contra 0 de poções), gastando 21,9 contra 26,4 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 10,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -25 p.p.; contraste de 25 p.p. e alteração de 43,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 84,1% do DPS efetivo de necromante. Por encontro, recebeu 98 contra 6,1 HP de dano; recuperou 2,6 contra 0 HP (0 contra 0 de poções), gastando 21,9 contra 15,5 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 307 HP e defesa 2 contra 1. Escudos absorveram 0 contra 6,5; invocações causaram 0 contra 74,3 de dano e receberam 0 contra 69,5. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -27,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -25 p.p.; contraste de 25 p.p. e alteração de -11,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 171,3% do DPS efetivo de mago. Por encontro, recebeu 83,9 contra 138,3 HP de dano; recuperou 52,4 contra 48 HP (0 contra 48 de poções), gastando 14,5 contra 36 mana total e 8,6 contra 0 HP em conjurações. Começou com 310 contra 320 HP e defesa 3 contra 1. Escudos absorveram 21 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 15,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 12,5 p.p.; contraste de -12,5 p.p. e alteração de -9,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 78,6% do DPS efetivo de arqueiro. Por encontro, recebeu 83,9 contra 128,1 HP de dano; recuperou 52,4 contra 0 HP (0 contra 0 de poções), gastando 14,5 contra 26,4 mana total e 8,6 contra 0 HP em conjurações. Começou com 310 contra 320 HP e defesa 3 contra 2. Escudos absorveram 21 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 27,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -25 p.p.; contraste de 25 p.p. e alteração de 69,6 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 73,8% do DPS efetivo de necromante. Por encontro, recebeu 83,9 contra 6,1 HP de dano; recuperou 52,4 contra 0 HP (0 contra 0 de poções), gastando 14,5 contra 15,5 mana total e 8,6 contra 0 HP em conjurações. Começou com 310 contra 307 HP e defesa 3 contra 1. Escudos absorveram 21 contra 6,5; invocações causaram 0 contra 74,3 de dano e receberam 0 contra 69,5. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -10,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -25 p.p.; contraste de 25 p.p. e alteração de 13,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 45,9% do DPS efetivo de arqueiro. Por encontro, recebeu 138,3 contra 128,1 HP de dano; recuperou 48 contra 0 HP (48 contra 0 de poções), gastando 36 contra 26,4 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 320 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 11,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -37,5 p.p.; contraste de 37,5 p.p. e alteração de 70,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 43,1% do DPS efetivo de necromante. Por encontro, recebeu 138,3 contra 6,1 HP de dano; recuperou 48 contra 0 HP (48 contra 0 de poções), gastando 36 contra 15,5 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 307 HP e defesa 1 contra 1. Escudos absorveram 0 contra 6,5; invocações causaram 0 contra 74,3 de dano e receberam 0 contra 69,5. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -26,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -37,5 p.p.; contraste de 37,5 p.p. e alteração de 15 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**arqueiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. arqueiro manteve 94% do DPS efetivo de necromante. Por encontro, recebeu 128,1 contra 6,1 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 26,4 contra 15,5 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 307 HP e defesa 2 contra 1. Escudos absorveram 0 contra 6,5; invocações causaram 0 contra 74,3 de dano e receberam 0 contra 69,5. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -38 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -55,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### O que mudou ao retirar cada fator

**aventureiro, Sem habilidades da barra:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 29,5 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Sem habilidades da barra:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 55,2 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem poções de vida:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 9,9 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem habilidades da barra:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 56,3 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 100,3 (100% do completo) | 0 / 0 |
| aventureiro | Sem habilidades da barra | 6/8; 2; 0 | 25 | 29,5 | 41,7 (41,6% do completo) | 2 / 0 |
| aventureiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 0,9 | 100,3 (100% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 8/8; 0; 0 | 0 | 11,4 | 88 (100% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 88 (100% do completo) | 0 / 0 |
| guerreiro | Sem habilidades da barra | 6/8; 2; 0 | 25 | 55,2 | 37,8 (42,9% do completo) | 2 / 0 |
| guerreiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 1,3 | 88 (100% do completo) | 0 / 0 |
| mago | Sem poções de vida | 7/8; 1; 0 | 12,5 | 9,9 | 51,3 (99,9% do completo) | 1 / 0 |
| mago | Sem habilidades da barra | 5/8; 3; 0 | 37,5 | 56,3 | 35 (68,2% do completo) | 3 / 0 |
| mago | Defesa plana zerada | 8/8; 0; 0 | 0 | 0,7 | 51,4 (100% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 112 (100% do completo) | 0 / 0 |
| arqueiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | -14,4 | 77,7 (69,4% do completo) | 0 / 0 |
| arqueiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 1 | 112 (100% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 119,2 (100% do completo) | 0 / 0 |
| necromante | Sem habilidades da barra | 8/8; 0; 0 | 0 | 41,3 | 52,5 (44% do completo) | 0 / 0 |
| necromante | Defesa plana zerada | 8/8; 0; 0 | 0 | 0 | 119,2 (100% do completo) | 0 / 0 |

## nível 30 · pesadelo · duelo

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 14 s | — | 1 | 917 | 208,6 | 73 | 24,5 | 0 |
| guerreiro | — | 28,9 s | 0 | 555,5 | 604,3 | 308,1 | 33,6 | 13,9 |
| mago | 23,8 s | 17,8 s | 0,5 | 813,6 | 362 | 112 | 25,8 | 0 |
| arqueiro | 13,8 s | — | 1 | 917 | 124,9 | 32 | 30,8 | 0 |
| necromante | 16,7 s | — | 1 | 1.037,5 | 138,4 | 46,1 | 15,3 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 5 / 3 / 65 / 0 | 917 / 0 / 0 | 0 | 0 | 11 / 1,8 / 0 / 0 / 0 | 0,8 |
| guerreiro | 0 / 60,1 / 248 / 0 | 552,5 / 3 / 0 | 149,3 | 0 | 12,3 / 0,7 / 9,9 / 6 / 0 | 0,1 |
| mago | 0 / 0 / 112 / 0 | 728,9 / 84,8 / 0 | 0 | 0 | 14,2 / 3,8 / 0 / 0,4 / 0 | 1,9 |
| arqueiro | 0 / 0 / 32 / 0 | 886,1 / 30,9 / 0 | 0 | 0 | 11 / 4,1 / 0 / 0 / 0 | 2,2 |
| necromante | 0 / 0 / 46,1 / 0 | 973,1 / 0 / 64,4 | 16,3 | 0 | 8,2 / 2,1 / 0 / 0,1 / 0 | 2,2 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 16,1 / 1,5 | 14,4 / 3,3 / 4,5 | 0 / 0 | — | 0 / 10,8 |
| guerreiro | 27,3 / 3,5 | 12,1 / 2,5 / 4,5 | 0 / 0 | bloqueado: 221,6 | 0 / 23,3 |
| mago | 20,4 / 3,1 | 15 / 2,3 / 6,1 | 0,3 / 0,3 | — | 0 / 14 |
| arqueiro | 21,1 / 5,6 | 14,3 / 2,4 / 4,8 | 0 / 0,5 | — | 0 / 8,8 |
| necromante | 20,9 / 2,1 | 23,9 / 4,1 / 8 | 1,1 / 0 | — | 0 / 7,3 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 5,4 | 450,6 | 0 | 10,8 | 0 | — |
| aventureiro | explosao | 2,6 | 182,5 | 0 | 7,9 | 0 | — |
| aventureiro | golpe_atordoante | 1,9 | 120,6 | 0 | 5,6 | 0 | — |
| aventureiro | ataque_basico | 6 | 163,3 | 0 | 0 | 0 | — |
| aventureiro | curar | 0,3 | 0 | 5 | 0,3 | 0 | 20 |
| aventureiro | efeito:cura_periodica | 0 | 0 | 3 | 0 | 0 | — |
| aventureiro | item:pocao_vida | 0,5 | 0 | 65 | 0 | 0 | — |
| guerreiro | investida | 4,6 | 80,3 | 0 | 18,5 | 0 | — |
| guerreiro | redemoinho | 4,6 | 71,4 | 0 | 0 | 13,9 | — |
| guerreiro | efeito:dano_direto | 0 | 3 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 60,1 | 0 | 0 | — |
| guerreiro | grito_de_guerra | 2,4 | 0 | 0 | 9,5 | 0 | — |
| guerreiro | escudo_de_ferro | 1,9 | 0 | 0 | 5,6 | 0 | — |
| guerreiro | ataque_basico | 13,8 | 400,9 | 0 | 0 | 0 | — |
| guerreiro | item:pocao_vida | 2 | 0 | 248 | 0 | 0 | — |
| mago | bola_de_fogo | 2,3 | 182,3 | 0 | 6,8 | 0 | — |
| mago | dardo_arcano | 13,9 | 352,9 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 2,3 | 22,8 | 0 | 9 | 0 | — |
| mago | raio_em_cadeia | 2 | 171 | 0 | 10 | 0 | — |
| mago | efeito:dano_direto | 0 | 15,9 | 0 | 0 | 0 | — |
| mago | efeito:queimando | 0 | 68,9 | 0 | 0 | 0 | — |
| mago | item:pocao_vida | 0,9 | 0 | 112 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 2,6 | 176,5 | 0 | 10,5 | 0 | — |
| arqueiro | chuva_de_flechas | 1,9 | 194,4 | 0 | 7,5 | 0 | — |
| arqueiro | flecha_venenosa | 1,9 | 110,5 | 0 | 5,6 | 0 | — |
| arqueiro | tiro_em_leque | 2,4 | 192,8 | 0 | 7,1 | 0 | — |
| arqueiro | tiro | 12,4 | 212 | 0 | 0 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 24 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 0,3 | 0 | 32 | 0 | 0 | — |
| arqueiro | efeito:dano_direto | 0 | 6,9 | 0 | 0 | 0 | — |
| necromante | dardo_funesto | 4,9 | 320,6 | 0 | 9,8 | 0 | — |
| necromante | garras_do_ossuario | 2,8 | 221,3 | 0 | 5,5 | 0 | — |
| necromante | toque_funesto | 13,3 | 431,3 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 64,4 | 0 | 0 | 0 | — |
| necromante | item:pocao_vida | 0,4 | 0 | 46,1 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 0/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 359,6% do DPS efetivo de guerreiro. Por encontro, recebeu 208,6 contra 604,3 HP de dano; recuperou 73 contra 308,1 HP (65 contra 248 de poções), gastando 24,5 contra 33,6 mana total e 0 contra 13,9 HP em conjurações. Começou com 325 contra 310 HP e defesa 2 contra 3. Escudos absorveram 0 contra 149,3; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 8 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 100 p.p. e de HP final 58,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 100 para 12,5 p.p.; contraste de 87,5 p.p. e alteração de 57,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × mago:** 0/8 mortes contra 4/8; 0 contra 0 limites de tempo. aventureiro manteve 174,2% do DPS efetivo de mago. Por encontro, recebeu 208,6 contra 362 HP de dano; recuperou 73 contra 112 HP (65 contra 112 de poções), gastando 24,5 contra 25,8 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 4 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 50 p.p. e de HP final 36,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 50 para -12,5 p.p.; contraste de 62,5 p.p. e alteração de 43 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 95,3% do DPS efetivo de arqueiro. Por encontro, recebeu 208,6 contra 124,9 HP de dano; recuperou 73 contra 32 HP (65 contra 32 de poções), gastando 24,5 contra 30,8 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final -12,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -87,5 p.p.; contraste de 87,5 p.p. e alteração de 36,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 113,8% do DPS efetivo de necromante. Por encontro, recebeu 208,6 contra 138,4 HP de dano; recuperou 73 contra 46,1 HP (65 contra 46,1 de poções), gastando 24,5 contra 15,3 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 307 HP e defesa 2 contra 1. Escudos absorveram 0 contra 16,3; invocações causaram 0 contra 64,4 de dano e receberam 0 contra 79,3. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -11,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -25 p.p.; contraste de 25 p.p. e alteração de 0,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × mago:** 8/8 mortes contra 4/8; 0 contra 0 limites de tempo. guerreiro manteve 48,4% do DPS efetivo de mago. Por encontro, recebeu 604,3 contra 362 HP de dano; recuperou 308,1 contra 112 HP (248 contra 112 de poções), gastando 33,6 contra 25,8 mana total e 13,9 contra 0 HP em conjurações. Começou com 310 contra 320 HP e defesa 3 contra 1. Escudos absorveram 149,3 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 4 só mago venceu; diferença de vitória -50 p.p. e de HP final -21,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -50 para -25 p.p.; contraste de -25 p.p. e alteração de -14,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: mago venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × arqueiro:** 8/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 26,5% do DPS efetivo de arqueiro. Por encontro, recebeu 604,3 contra 124,9 HP de dano; recuperou 308,1 contra 32 HP (248 contra 32 de poções), gastando 33,6 contra 30,8 mana total e 13,9 contra 0 HP em conjurações. Começou com 310 contra 320 HP e defesa 3 contra 2. Escudos absorveram 149,3 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 8 só arqueiro venceu; diferença de vitória -100 p.p. e de HP final -71 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -100 para -87,5 p.p.; contraste de -12,5 p.p. e alteração de -3,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: arqueiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × necromante:** 8/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 31,7% do DPS efetivo de necromante. Por encontro, recebeu 604,3 contra 138,4 HP de dano; recuperou 308,1 contra 46,1 HP (248 contra 46,1 de poções), gastando 33,6 contra 15,3 mana total e 13,9 contra 0 HP em conjurações. Começou com 310 contra 307 HP e defesa 3 contra 1. Escudos absorveram 149,3 contra 16,3; invocações causaram 0 contra 64,4 de dano e receberam 0 contra 79,3. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 8 só necromante venceu; diferença de vitória -100 p.p. e de HP final -70 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -100 para -37,5 p.p.; contraste de -62,5 p.p. e alteração de -57,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × arqueiro:** 4/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 54,7% do DPS efetivo de arqueiro. Por encontro, recebeu 362 contra 124,9 HP de dano; recuperou 112 contra 32 HP (112 contra 32 de poções), gastando 25,8 contra 30,8 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 320 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 4 só arqueiro venceu; diferença de vitória -50 p.p. e de HP final -49,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -50 para -75 p.p.; contraste de 25 p.p. e alteração de -6,6 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: arqueiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × necromante:** 4/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 65,4% do DPS efetivo de necromante. Por encontro, recebeu 362 contra 138,4 HP de dano; recuperou 112 contra 46,1 HP (112 contra 46,1 de poções), gastando 25,8 contra 15,3 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 307 HP e defesa 1 contra 1. Escudos absorveram 0 contra 16,3; invocações causaram 0 contra 64,4 de dano e receberam 0 contra 79,3. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 4 só necromante venceu; diferença de vitória -50 p.p. e de HP final -48,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -50 para -12,5 p.p.; contraste de -37,5 p.p. e alteração de -42,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**arqueiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. arqueiro manteve 119,5% do DPS efetivo de necromante. Por encontro, recebeu 124,9 contra 138,4 HP de dano; recuperou 32 contra 46,1 HP (32 contra 46,1 de poções), gastando 30,8 contra 15,3 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 307 HP e defesa 2 contra 1. Escudos absorveram 0 contra 16,3; invocações causaram 0 contra 64,4 de dano e receberam 0 contra 79,3. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final 1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 62,5 p.p.; contraste de -62,5 p.p. e alteração de -36,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### O que mudou ao retirar cada fator

**aventureiro, Sem habilidades da barra:** retirar esse fator perdeu 7 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 57,5 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**aventureiro, Defesa plana zerada:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 6,1 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem poções de vida:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 13,5 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem habilidades da barra:** retirar esse fator perdeu 3 vitórias e ganhou 1 nas mesmas 8 condições iniciais. O kit completo teve 14,4 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem poções de vida:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 3,7 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem poções de vida:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 6,1 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem habilidades da barra:** retirar esse fator perdeu 5 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 57,1 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Defesa plana zerada:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 1,5 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 8/8; 0; 0 | 0 | 12,5 | 66,9 (99,3% do completo) | 0 / 0 |
| aventureiro | Sem habilidades da barra | 1/8; 7; 0 | 87,5 | 57,5 | 28 (41,6% do completo) | 7 / 0 |
| aventureiro | Defesa plana zerada | 7/8; 1; 0 | 12,5 | 6,1 | 66,1 (98,1% do completo) | 1 / 0 |
| guerreiro | Sem cura do básico | 0/8; 8; 0 | 0 | 0 | 19,3 (102,9% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 22,7 (121,3% do completo) | 0 / 0 |
| guerreiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 26,5 (141,5% do completo) | 0 / 0 |
| guerreiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 18,4 (98,5% do completo) | 0 / 0 |
| mago | Sem poções de vida | 2/8; 6; 0 | 25 | 13,5 | 40 (103,5% do completo) | 2 / 0 |
| mago | Sem habilidades da barra | 2/8; 6; 0 | 25 | 14,4 | 25,8 (66,8% do completo) | 3 / 1 |
| mago | Defesa plana zerada | 4/8; 4; 0 | 0 | 0,9 | 38,7 (100% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 7/8; 1; 0 | 12,5 | 3,7 | 71,6 (101,2% do completo) | 1 / 0 |
| arqueiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | 21 | 49,3 (69,7% do completo) | 0 / 0 |
| arqueiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 1,2 | 70,7 (100% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 7/8; 1; 0 | 12,5 | 6,1 | 60,1 (101,6% do completo) | 1 / 0 |
| necromante | Sem habilidades da barra | 3/8; 5; 0 | 62,5 | 57,1 | 38,6 (65,2% do completo) | 5 / 0 |
| necromante | Defesa plana zerada | 7/8; 1; 0 | 12,5 | 1,5 | 59,5 (100,6% do completo) | 1 / 0 |

## nível 30 · pesadelo · pressao

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 29,2 s | 21,6 s | 0,4 | 2.014,9 | 535,5 | 277,1 | 43,5 | 0 |
| guerreiro | — | 13,9 s | 0 | 566,1 | 594,4 | 292,6 | 16,5 | 8,3 |
| mago | — | 9,5 s | 0 | 557,9 | 560 | 240 | 12 | 0 |
| arqueiro | — | 10,5 s | 0 | 897 | 576 | 256 | 13,6 | 0 |
| necromante | — | 14,7 s | 0 | 663,3 | 522,3 | 215,3 | 4 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 27,4 / 54,8 / 195 / 0 | 2.014,9 / 0 / 0 | 0 | 0 | 20 / 6 / 0 / 1,8 / 0 | 1,3 |
| guerreiro | 0 / 44,6 / 248 / 0 | 563,1 / 3 / 0 | 76,6 | 0 | 6 / 0,7 / 4,4 / 2,7 / 0 | 0,2 |
| mago | 0 / 0 / 240 / 0 | 477,9 / 80 / 0 | 0 | 0 | 6,3 / 5,9 / 0 / 0,4 / 0 | 1 |
| arqueiro | 0 / 0 / 256 / 0 | 861 / 36 / 0 | 0 | 0 | 8,2 / 4,3 / 0 / 1,1 / 0 | 1,5 |
| necromante | 0 / 0 / 215,3 / 0 | 622,6 / 0 / 40,6 | 26 | 0 | 5,7 / 0,8 / 0 / 1,5 / 0 | 2,1 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 30,4 / 4,1 | 27,9 / 4 / 11,1 | 0 / 0 | — | 0 / 20,5 |
| guerreiro | 12,8 / 1,1 | 8,1 / 0,8 / 3,5 | 0 / 0 | bloqueado: 83 | 0 / 10,3 |
| mago | 9,4 / 1,3 | 9,8 / 1,5 / 3,5 | 0 / 0 | — | 0 / 6,1 |
| arqueiro | 15,1 / 1 | 16,8 / 2,5 / 6,8 | 0 / 0 | — | 0 / 5,1 |
| necromante | 12,9 / 0 | 16,4 / 2,9 / 5 | 0,8 / 0 | — | 0 / 2,5 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 9,4 | 861 | 0 | 18,8 | 0 | — |
| aventureiro | explosao | 4,6 | 556,9 | 0 | 13,9 | 0 | — |
| aventureiro | golpe_atordoante | 3 | 239,4 | 0 | 9 | 0 | — |
| aventureiro | ataque_basico | 11,5 | 357,6 | 0 | 0 | 0 | — |
| aventureiro | item:pocao_vida | 1,5 | 0 | 195 | 0 | 0 | — |
| aventureiro | curar | 1,9 | 0 | 27,4 | 1,9 | 0 | 14,6 |
| aventureiro | efeito:cura_periodica | 0 | 0 | 54,8 | 0 | 0 | — |
| guerreiro | investida | 2,3 | 80,3 | 0 | 9 | 0 | — |
| guerreiro | redemoinho | 2,8 | 268,1 | 0 | 0 | 8,3 | — |
| guerreiro | efeito:dano_direto | 0 | 3 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 44,6 | 0 | 0 | — |
| guerreiro | grito_de_guerra | 1,1 | 0 | 0 | 4,5 | 0 | — |
| guerreiro | item:pocao_vida | 2 | 0 | 248 | 0 | 0 | — |
| guerreiro | ataque_basico | 5,6 | 214,8 | 0 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 1 | 0 | 0 | 3 | 0 | — |
| mago | bola_de_fogo | 1 | 167,5 | 0 | 3 | 0 | — |
| mago | dardo_arcano | 6,4 | 160,6 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 1 | 0 | 0 | 4 | 0 | — |
| mago | efeito:dano_direto | 0 | 15,9 | 0 | 0 | 0 | — |
| mago | raio_em_cadeia | 1 | 149,8 | 0 | 5 | 0 | — |
| mago | efeito:queimando | 0 | 64,1 | 0 | 0 | 0 | — |
| mago | item:pocao_vida | 1,9 | 0 | 240 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 1 | 0 | 0 | 4 | 0 | — |
| arqueiro | chuva_de_flechas | 1 | 211,6 | 0 | 4 | 0 | — |
| arqueiro | tiro | 11,3 | 377,4 | 0 | 0 | 0 | — |
| arqueiro | flecha_venenosa | 1 | 87,1 | 0 | 3 | 0 | — |
| arqueiro | tiro_em_leque | 0,9 | 184,9 | 0 | 2,6 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 36 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 2 | 0 | 256 | 0 | 0 | — |
| necromante | dardo_funesto | 1 | 70,8 | 0 | 2 | 0 | — |
| necromante | garras_do_ossuario | 1 | 102,9 | 0 | 2 | 0 | — |
| necromante | toque_funesto | 10,9 | 449 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 40,6 | 0 | 0 | 0 | — |
| necromante | item:pocao_vida | 1,8 | 0 | 215,3 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 5/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 186,8% do DPS efetivo de guerreiro. Por encontro, recebeu 535,5 contra 594,4 HP de dano; recuperou 277,1 contra 292,6 HP (195 contra 248 de poções), gastando 43,5 contra 16,5 mana total e 0 contra 8,3 HP em conjurações. Começou com 325 contra 310 HP e defesa 2 contra 3. Escudos absorveram 0 contra 76,6; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 3 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 37,5 p.p. e de HP final 20,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 37,5 para 0 p.p.; contraste de 37,5 p.p. e alteração de 20,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × mago:** 5/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 134,4% do DPS efetivo de mago. Por encontro, recebeu 535,5 contra 560 HP de dano; recuperou 277,1 contra 240 HP (195 contra 240 de poções), gastando 43,5 contra 12 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 3 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 37,5 p.p. e de HP final 20,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 37,5 para 0 p.p.; contraste de 37,5 p.p. e alteração de 20,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × arqueiro:** 5/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 93,1% do DPS efetivo de arqueiro. Por encontro, recebeu 535,5 contra 576 HP de dano; recuperou 277,1 contra 256 HP (195 contra 256 de poções), gastando 43,5 contra 13,6 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 3 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 37,5 p.p. e de HP final 20,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 37,5 para 0 p.p.; contraste de 37,5 p.p. e alteração de 20,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × necromante:** 5/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 170% do DPS efetivo de necromante. Por encontro, recebeu 535,5 contra 522,3 HP de dano; recuperou 277,1 contra 215,3 HP (195 contra 215,3 de poções), gastando 43,5 contra 4 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 307 HP e defesa 2 contra 1. Escudos absorveram 0 contra 26; invocações causaram 0 contra 40,6 de dano e receberam 0 contra 91. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 3 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 37,5 p.p. e de HP final 20,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 37,5 para 0 p.p.; contraste de 37,5 p.p. e alteração de 20,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × mago:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 71,9% do DPS efetivo de mago. Por encontro, recebeu 594,4 contra 560 HP de dano; recuperou 292,6 contra 240 HP (248 contra 240 de poções), gastando 16,5 contra 12 mana total e 8,3 contra 0 HP em conjurações. Começou com 310 contra 320 HP e defesa 3 contra 1. Escudos absorveram 76,6 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 49,8% do DPS efetivo de arqueiro. Por encontro, recebeu 594,4 contra 576 HP de dano; recuperou 292,6 contra 256 HP (248 contra 256 de poções), gastando 16,5 contra 13,6 mana total e 8,3 contra 0 HP em conjurações. Começou com 310 contra 320 HP e defesa 3 contra 2. Escudos absorveram 76,6 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × necromante:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 91% do DPS efetivo de necromante. Por encontro, recebeu 594,4 contra 522,3 HP de dano; recuperou 292,6 contra 215,3 HP (248 contra 215,3 de poções), gastando 16,5 contra 4 mana total e 8,3 contra 0 HP em conjurações. Começou com 310 contra 307 HP e defesa 3 contra 1. Escudos absorveram 76,6 contra 26; invocações causaram 0 contra 40,6 de dano e receberam 0 contra 91. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. mago manteve 69,3% do DPS efetivo de arqueiro. Por encontro, recebeu 560 contra 576 HP de dano; recuperou 240 contra 256 HP (240 contra 256 de poções), gastando 12 contra 13,6 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 320 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × necromante:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. mago manteve 126,5% do DPS efetivo de necromante. Por encontro, recebeu 560 contra 522,3 HP de dano; recuperou 240 contra 215,3 HP (240 contra 215,3 de poções), gastando 12 contra 4 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 307 HP e defesa 1 contra 1. Escudos absorveram 0 contra 26; invocações causaram 0 contra 40,6 de dano e receberam 0 contra 91. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**arqueiro × necromante:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. arqueiro manteve 182,7% do DPS efetivo de necromante. Por encontro, recebeu 576 contra 522,3 HP de dano; recuperou 256 contra 215,3 HP (256 contra 215,3 de poções), gastando 13,6 contra 4 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 307 HP e defesa 2 contra 1. Escudos absorveram 0 contra 26; invocações causaram 0 contra 40,6 de dano e receberam 0 contra 91. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### O que mudou ao retirar cada fator

**aventureiro, Sem poções de vida:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 13,1 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**aventureiro, Sem habilidades da barra:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 20,5 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 2/8; 6; 0 | 12,5 | 13,1 | 85,5 (108,1% do completo) | 1 / 0 |
| aventureiro | Sem habilidades da barra | 0/8; 8; 0 | 37,5 | 20,5 | 29,2 (37% do completo) | 3 / 0 |
| aventureiro | Defesa plana zerada | 3/8; 5; 0 | 0 | 4,9 | 76,9 (97,3% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 0/8; 8; 0 | 0 | 0 | 42,1 (99,5% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 33,1 (78,3% do completo) | 0 / 0 |
| guerreiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 27,1 (64,1% do completo) | 0 / 0 |
| guerreiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 40,2 (95% do completo) | 0 / 0 |
| mago | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 65,4 (111,2% do completo) | 0 / 0 |
| mago | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 23 (39% do completo) | 0 / 0 |
| mago | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 59 (100,3% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 95,2 (112,1% do completo) | 0 / 0 |
| arqueiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 48,7 (57,3% do completo) | 0 / 0 |
| arqueiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 86,2 (101,5% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 49,2 (105,9% do completo) | 0 / 0 |
| necromante | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 37,8 (81,3% do completo) | 0 / 0 |
| necromante | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 46,5 (100% do completo) | 0 / 0 |

## nível 30 · pesadelo · atrito

### Onde o desgaste aparece

| Classe | Onda | Chegaram/n inicial | Mortes / limites nesta onda | HP entrada → saída | Mana entrada → saída | Recebido / cura / mana gasta |
|---|---|---|---|---|---|---|
| aventureiro | 1 | 8/8 | 1 / 0 | 325 → 178,4 | 30 → 20,1 | 168,3 / 21,6 / 23,8 |
| aventureiro | 2 | 7/8 | 0 / 0 | 203,9 → 200,6 | 20,1 → 13,4 | 218,9 / 205,7 / 25,3 |
| aventureiro | 3 | 7/8 | 3 / 0 | 200,6 → 82 | 13,4 → 7,3 | 316,7 / 190 / 23 |
| aventureiro | 4 | 4/8 | 2 / 0 | 143,5 → 93,8 | 10,8 → 6,3 | 97,3 / 43 / 16,3 |
| aventureiro | 5 | 2/8 | 1 / 0 | 187,5 → 65 | 5,8 → 1,3 | 147,5 / 25 / 11,5 |
| guerreiro | 1 | 8/8 | 8 / 0 | 310 → 0 | 30 → 19,5 | 590,9 / 292,5 / 28,5 |
| mago | 1 | 8/8 | 6 / 0 | 320 → 27,3 | 30 → 28 | 516,8 / 224 / 24,9 |
| mago | 2 | 2/8 | 2 / 0 | 109 → 0 | 30 → 24 | 117,5 / 5,5 / 13,5 |
| arqueiro | 1 | 8/8 | 0 / 0 | 320 → 268,5 | 30 → 15,5 | 83,5 / 32 / 30,3 |
| arqueiro | 2 | 8/8 | 2 / 0 | 268,5 → 97,9 | 15,5 → 27,1 | 299,8 / 128 / 12,8 |
| arqueiro | 3 | 6/8 | 4 / 0 | 130,5 → 31,2 | 27,8 → 17,5 | 206 / 106,7 / 25,3 |
| arqueiro | 4 | 2/8 | 2 / 0 | 93,5 → 0 | 15,5 → 19,8 | 95 / 0 / 5 |
| necromante | 1 | 8/8 | 0 / 0 | 307 → 261,5 | 30 → 28,4 | 76,3 / 30,8 / 16,8 |
| necromante | 2 | 8/8 | 2 / 0 | 261,5 → 179,6 | 28,4 → 29,8 | 161,4 / 76,9 / 12,5 |
| necromante | 3 | 6/8 | 0 / 0 | 239,5 → 251,3 | 29,7 → 27,1 | 47,2 / 34 / 25,7 |
| necromante | 4 | 6/8 | 0 / 0 | 251,3 → 183,5 | 27,1 → 30 | 121,8 / 41 / 12,3 |
| necromante | 5 | 6/8 | 2 / 3 | 183,5 → 125,3 | 30 → 29,2 | 115,7 / 54,5 / 9,3 |

Médias de cada onda incluem apenas quem chegou a ela; o denominador inicial mostra a seleção dos sobreviventes. Não compare a vida da onda 5 como se incluísse quem morreu antes.

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 68,6 s | 52,5 s | 2,6 | 2.681,6 | 722,4 | 395,6 | 77 | 0 |
| guerreiro | — | 21,9 s | 0 | 475,1 | 590,9 | 292,5 | 28,5 | 11,6 |
| mago | — | 25,3 s | 0,3 | 738,4 | 546,1 | 225,4 | 28,3 | 0 |
| arqueiro | — | 39,8 s | 2 | 2.281,6 | 561,5 | 240 | 63,3 | 0 |
| necromante | 68,9 s | 78,1 s | 3,4 | 4.707,1 | 451,1 | 204,8 | 64,8 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 58,6 / 158,3 / 178,8 / 0 | 2.681,6 / 0 / 0 | 0 | 0 | 36,5 / 11,3 / 0 / 3 / 0,4 | 1,3 |
| guerreiro | 0 / 44,5 / 248 / 0 | 472,1 / 3 / 0 | 101,6 | 0 | 9,8 / 0,7 / 8,2 / 4,7 / 0 | 0,1 |
| mago | 0 / 1,4 / 224 / 0 | 679,5 / 58,9 / 0 | 6,3 | 0 | 16,7 / 4 / 0 / 3,7 / 0 | 1,9 |
| arqueiro | 0 / 0 / 240 / 0 | 2.228,8 / 52,9 / 0 | 0 | 0 | 29,1 / 6,2 / 0 / 3,7 / 0 | 2,2 |
| necromante | 0 / 20,3 / 184,5 / 0 | 4.179,4 / 0 / 527,8 | 58,5 | 13,5 | 34,4 / 12,5 / 0 / 1,8 / 0 | 2,3 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 57,6 / 10,8 | 39,6 / 7,1 / 14 | 0 / 0 | — | 18 / 41,6 |
| guerreiro | 21,6 / 2,4 | 9,8 / 1,8 / 3,3 | 0 / 0 | bloqueado: 171,9 | 0 / 18 |
| mago | 24,8 / 4,5 | 16,8 / 3,5 / 5,5 | 0 / 0 | — | 0,8 / 16 |
| arqueiro | 54,5 / 9,8 | 41,1 / 6,8 / 16,4 | 0 / 1,3 | — | 1,5 / 28,1 |
| necromante | 86,6 / 11,1 | 113 / 17,1 / 46,8 | 4,6 / 0 | — | 33,4 / 36,9 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 17,1 | 1.359,9 | 0 | 34,3 | 0 | — |
| aventureiro | explosao | 8 | 548,1 | 0 | 24 | 0 | — |
| aventureiro | golpe_atordoante | 5 | 262,4 | 0 | 15 | 0 | — |
| aventureiro | ataque_basico | 23,8 | 511,3 | 0 | 0 | 0 | — |
| aventureiro | curar | 3,8 | 0 | 58,6 | 3,8 | 0 | 15,6 |
| aventureiro | efeito:cura_periodica | 0 | 0 | 158,3 | 0 | 0 | — |
| aventureiro | item:pocao_vida | 1,4 | 0 | 178,8 | 0 | 0 | — |
| guerreiro | investida | 3,9 | 83,1 | 0 | 15,5 | 0 | — |
| guerreiro | redemoinho | 3,9 | 73,4 | 0 | 0 | 11,6 | — |
| guerreiro | efeito:dano_direto | 0 | 3 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 44,5 | 0 | 0 | — |
| guerreiro | grito_de_guerra | 2,1 | 0 | 0 | 8,5 | 0 | — |
| guerreiro | escudo_de_ferro | 1,5 | 0 | 0 | 4,5 | 0 | — |
| guerreiro | ataque_basico | 10,3 | 315,6 | 0 | 0 | 0 | — |
| guerreiro | item:pocao_vida | 2 | 0 | 248 | 0 | 0 | — |
| mago | bola_de_fogo | 2,4 | 104,6 | 0 | 7,1 | 0 | — |
| mago | dardo_arcano | 17,6 | 408,9 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 2,4 | 0 | 0 | 9,5 | 0 | — |
| mago | raio_em_cadeia | 2,3 | 166 | 0 | 11,3 | 0 | — |
| mago | efeito:dano_direto | 0 | 11,5 | 0 | 0 | 0 | — |
| mago | efeito:queimando | 0 | 47,4 | 0 | 0 | 0 | — |
| mago | efeito:cura | 0 | 0 | 1,4 | 0 | 0 | — |
| mago | item:pocao_vida | 1,8 | 0 | 224 | 0 | 0 | — |
| mago | barreira | 0,1 | 0 | 0 | 0,4 | 0 | — |
| arqueiro | flecha_perfurante | 5,3 | 344,1 | 0 | 21 | 0 | — |
| arqueiro | chuva_de_flechas | 4,4 | 386,8 | 0 | 17,5 | 0 | — |
| arqueiro | flecha_venenosa | 3,9 | 194,3 | 0 | 11,6 | 0 | — |
| arqueiro | tiro_em_leque | 4,4 | 308,9 | 0 | 13,1 | 0 | — |
| arqueiro | tiro | 36,6 | 994,8 | 0 | 0 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 39,8 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 1,9 | 0 | 240 | 0 | 0 | — |
| arqueiro | efeito:dano_direto | 0 | 13,1 | 0 | 0 | 0 | — |
| necromante | dardo_funesto | 20,8 | 1.536 | 0 | 41,5 | 0 | — |
| necromante | garras_do_ossuario | 10,8 | 846,8 | 0 | 21,5 | 0 | — |
| necromante | toque_funesto | 54,3 | 1.796,6 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 527,8 | 0 | 0 | 0 | — |
| necromante | efeito:cura | 0 | 0 | 20,3 | 0 | 0 | — |
| necromante | item:pocao_vida | 1,5 | 0 | 184,5 | 0 | 0 | — |
| necromante | dizimo_vital | 0,8 | 0 | 0 | 1,5 | 0 | — |
| necromante | comando_sepulcral | 0,1 | 0 | 0 | 0,3 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 7/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 271,8% do DPS efetivo de guerreiro. Por encontro, recebeu 722,4 contra 590,9 HP de dano; recuperou 395,6 contra 292,5 HP (178,8 contra 248 de poções), gastando 77 contra 28,5 mana total e 0 contra 11,6 HP em conjurações. Começou com 325 contra 310 HP e defesa 2 contra 3. Escudos absorveram 0 contra 101,6; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 12,5 p.p. e de HP final 5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para 0 p.p.; contraste de 12,5 p.p. e alteração de 5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × mago:** 7/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 192,9% do DPS efetivo de mago. Por encontro, recebeu 722,4 contra 546,1 HP de dano; recuperou 395,6 contra 225,4 HP (178,8 contra 224 de poções), gastando 77 contra 28,3 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 1. Escudos absorveram 0 contra 6,3; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 12,5 p.p. e de HP final 5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para 0 p.p.; contraste de 12,5 p.p. e alteração de 5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × arqueiro:** 7/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 89,3% do DPS efetivo de arqueiro. Por encontro, recebeu 722,4 contra 561,5 HP de dano; recuperou 395,6 contra 240 HP (178,8 contra 240 de poções), gastando 77 contra 63,3 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 12,5 p.p. e de HP final 5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para 0 p.p.; contraste de 12,5 p.p. e alteração de 5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 7/8 mortes contra 4/8; 0 contra 3 limites de tempo. aventureiro manteve 85,2% do DPS efetivo de necromante. Por encontro, recebeu 722,4 contra 451,1 HP de dano; recuperou 395,6 contra 204,8 HP (178,8 contra 184,5 de poções), gastando 77 contra 64,8 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 307 HP e defesa 2 contra 1. Escudos absorveram 0 contra 58,5; invocações causaram 0 contra 527,8 de dano e receberam 0 contra 575,9. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só aventureiro venceu, 1 só necromante venceu; diferença de vitória 0 p.p. e de HP final -25,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -25 p.p.; contraste de 25 p.p. e alteração de -12,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × mago:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 71% do DPS efetivo de mago. Por encontro, recebeu 590,9 contra 546,1 HP de dano; recuperou 292,5 contra 225,4 HP (248 contra 224 de poções), gastando 28,5 contra 28,3 mana total e 11,6 contra 0 HP em conjurações. Começou com 310 contra 320 HP e defesa 3 contra 1. Escudos absorveram 101,6 contra 6,3; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 32,8% do DPS efetivo de arqueiro. Por encontro, recebeu 590,9 contra 561,5 HP de dano; recuperou 292,5 contra 240 HP (248 contra 240 de poções), gastando 28,5 contra 63,3 mana total e 11,6 contra 0 HP em conjurações. Começou com 310 contra 320 HP e defesa 3 contra 2. Escudos absorveram 101,6 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × necromante:** 8/8 mortes contra 4/8; 0 contra 3 limites de tempo. guerreiro manteve 31,4% do DPS efetivo de necromante. Por encontro, recebeu 590,9 contra 451,1 HP de dano; recuperou 292,5 contra 204,8 HP (248 contra 184,5 de poções), gastando 28,5 contra 64,8 mana total e 11,6 contra 0 HP em conjurações. Começou com 310 contra 307 HP e defesa 3 contra 1. Escudos absorveram 101,6 contra 58,5; invocações causaram 0 contra 527,8 de dano e receberam 0 contra 575,9. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 1 só necromante venceu; diferença de vitória -12,5 p.p. e de HP final -30,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para 0 p.p.; contraste de -12,5 p.p. e alteração de -30,6 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. mago manteve 46,3% do DPS efetivo de arqueiro. Por encontro, recebeu 546,1 contra 561,5 HP de dano; recuperou 225,4 contra 240 HP (224 contra 240 de poções), gastando 28,3 contra 63,3 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 320 HP e defesa 1 contra 2. Escudos absorveram 6,3 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × necromante:** 8/8 mortes contra 4/8; 0 contra 3 limites de tempo. mago manteve 44,2% do DPS efetivo de necromante. Por encontro, recebeu 546,1 contra 451,1 HP de dano; recuperou 225,4 contra 204,8 HP (224 contra 184,5 de poções), gastando 28,3 contra 64,8 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 307 HP e defesa 1 contra 1. Escudos absorveram 6,3 contra 58,5; invocações causaram 0 contra 527,8 de dano e receberam 0 contra 575,9. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 1 só necromante venceu; diferença de vitória -12,5 p.p. e de HP final -30,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para 0 p.p.; contraste de -12,5 p.p. e alteração de -30,6 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**arqueiro × necromante:** 8/8 mortes contra 4/8; 0 contra 3 limites de tempo. arqueiro manteve 95,4% do DPS efetivo de necromante. Por encontro, recebeu 561,5 contra 451,1 HP de dano; recuperou 240 contra 204,8 HP (240 contra 184,5 de poções), gastando 63,3 contra 64,8 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 307 HP e defesa 2 contra 1. Escudos absorveram 0 contra 58,5; invocações causaram 0 contra 527,8 de dano e receberam 0 contra 575,9. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 1 só necromante venceu; diferença de vitória -12,5 p.p. e de HP final -30,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para 0 p.p.; contraste de -12,5 p.p. e alteração de -30,6 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

### O que mudou ao retirar cada fator

**aventureiro, Sem poções de vida:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 5 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**aventureiro, Sem habilidades da barra:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 5 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem habilidades da barra:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 30,6 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 0/8; 8; 0 | 12,5 | 5 | 56,1 (100,6% do completo) | 1 / 0 |
| aventureiro | Sem habilidades da barra | 0/8; 8; 0 | 12,5 | 5 | 28,4 (51% do completo) | 1 / 0 |
| aventureiro | Defesa plana zerada | 1/8; 7; 0 | 0 | -5,7 | 53,6 (96,2% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 0/8; 8; 0 | 0 | 0 | 20,6 (100,5% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 24,7 (120,2% do completo) | 0 / 0 |
| guerreiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 26,5 (129,3% do completo) | 0 / 0 |
| guerreiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 21,2 (103,1% do completo) | 0 / 0 |
| mago | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 30 (103,6% do completo) | 0 / 0 |
| mago | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 25,8 (89,3% do completo) | 0 / 0 |
| mago | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 28,9 (100% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 65,1 (104,2% do completo) | 0 / 0 |
| arqueiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 50,9 (81,5% do completo) | 0 / 0 |
| arqueiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 62,5 (100,1% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 2/8; 6; 0 | -12,5 | 17,3 | 67,5 (103,1% do completo) | 0 / 1 |
| necromante | Sem habilidades da barra | 0/8; 8; 0 | 12,5 | 30,6 | 37,9 (57,9% do completo) | 1 / 0 |
| necromante | Defesa plana zerada | 1/8; 5; 2 | 0 | 9,9 | 65,2 (99,6% do completo) | 0 / 0 |

## nível 30 · pesadelo · chefe

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 23,8 s | — | 1 | 1.206 | 217 | 124,9 | 35,4 | 0 |
| guerreiro | 26,5 s | 26,9 s | 0,9 | 1.252,8 | 324,9 | 210,6 | 28,6 | 13,9 |
| mago | — | 28,8 s | 0 | 844,1 | 480 | 160 | 31,1 | 0 |
| arqueiro | 20,5 s | — | 1 | 1.222,1 | 369 | 208 | 32 | 0 |
| necromante | 25,1 s | 21,7 s | 0,9 | 1.562,8 | 104,5 | 0 | 25,5 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 9,4 / 18 / 97,5 / 0 | 1.206 / 0 / 0 | 0 | 0 | 15,4 / 6,5 / 1,3 / 0 / 0 | 1,3 |
| guerreiro | 0 / 71,1 / 139,5 / 0 | 1.243,4 / 9,4 / 0 | 72,6 | 0 | 11,3 / 2,5 / 10,4 / 0 / 0 | 0,8 |
| mago | 0 / 0 / 160 / 0 | 815,6 / 28,5 / 0 | 0 | 0 | 17,9 / 5,6 / 1,8 / 1,2 / 0 | 1,6 |
| arqueiro | 0 / 0 / 208 / 0 | 1.169,5 / 52,6 / 0 | 0 | 0 | 14,9 / 5,2 / 2 / 0,3 / 0 | 1,7 |
| necromante | 0 / 0 / 0 / 0 | 1.466 / 0 / 96,8 | 33,9 | 0 | 12,5 / 7,8 / 0,5 / 0 / 0 | 2,3 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 23,8 / 4,5 | 17,9 / 3,3 / 6,1 | 0 / 0 | bloqueado: 6,9 | 0 / 16 |
| guerreiro | 24 / 2,3 | 18,1 / 2,6 / 7,3 | 0,4 / 0 | bloqueado: 152,6 | 0 / 21,5 |
| mago | 25,4 / 4,6 | 18,3 / 3,1 / 6,3 | 0,6 / 0,1 | — | 0 / 20 |
| arqueiro | 28 / 7,1 | 20,4 / 4,1 / 8,3 | 0,3 / 0,5 | bloqueado: 3,5 | 0 / 15,5 |
| necromante | 31,8 / 4 | 33,3 / 4,8 / 13,1 | 1,5 / 0 | — | 9,8 / 14,1 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 7,9 | 512,9 | 0 | 15,8 | 0 | — |
| aventureiro | explosao | 3,9 | 362,6 | 0 | 11,6 | 0 | — |
| aventureiro | golpe_atordoante | 2,5 | 121,4 | 0 | 7,5 | 0 | — |
| aventureiro | ataque_basico | 9 | 209,1 | 0 | 0 | 0 | — |
| aventureiro | item:pocao_vida | 0,8 | 0 | 97,5 | 0 | 0 | — |
| aventureiro | curar | 0,5 | 0 | 9,4 | 0,5 | 0 | 18,8 |
| aventureiro | efeito:cura_periodica | 0 | 0 | 18 | 0 | 0 | — |
| guerreiro | investida | 4,4 | 437,8 | 0 | 17,5 | 0 | — |
| guerreiro | redemoinho | 4,6 | 409,6 | 0 | 0 | 13,9 | — |
| guerreiro | efeito:dano_direto | 0 | 9,4 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 71,1 | 0 | 0 | — |
| guerreiro | grito_de_guerra | 2,1 | 0 | 0 | 8,5 | 0 | — |
| guerreiro | ataque_basico | 12 | 396 | 0 | 0 | 0 | — |
| guerreiro | item:pocao_vida | 1,1 | 0 | 139,5 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 0,9 | 0 | 0 | 2,6 | 0 | — |
| mago | bola_de_fogo | 3,1 | 118,3 | 0 | 9,4 | 0 | — |
| mago | dardo_arcano | 17,4 | 381,8 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 2,6 | 118 | 0 | 10,5 | 0 | — |
| mago | raio_em_cadeia | 2,3 | 197,6 | 0 | 11,3 | 0 | — |
| mago | efeito:dano_direto | 0 | 17,9 | 0 | 0 | 0 | — |
| mago | efeito:queimando | 0 | 10,6 | 0 | 0 | 0 | — |
| mago | item:pocao_vida | 1,3 | 0 | 160 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 3 | 188,5 | 0 | 12 | 0 | — |
| arqueiro | chuva_de_flechas | 2 | 216,9 | 0 | 8 | 0 | — |
| arqueiro | tiro | 19 | 450,8 | 0 | 0 | 0 | — |
| arqueiro | flecha_venenosa | 2 | 113,3 | 0 | 6 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 44,3 | 0 | 0 | 0 | — |
| arqueiro | tiro_em_leque | 2 | 200,1 | 0 | 6 | 0 | — |
| arqueiro | efeito:dano_direto | 0 | 8,4 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 1,6 | 0 | 208 | 0 | 0 | — |
| necromante | dardo_funesto | 8,3 | 608,8 | 0 | 16,5 | 0 | — |
| necromante | garras_do_ossuario | 4,5 | 283,9 | 0 | 9 | 0 | — |
| necromante | toque_funesto | 19 | 573,4 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 96,8 | 0 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 0/8 mortes contra 1/8; 0 contra 0 limites de tempo. aventureiro manteve 124,2% do DPS efetivo de guerreiro. Por encontro, recebeu 217 contra 324,9 HP de dano; recuperou 124,9 contra 210,6 HP (97,5 contra 139,5 de poções), gastando 35,4 contra 28,6 mana total e 0 contra 13,9 HP em conjurações. Começou com 325 contra 310 HP e defesa 2 contra 3. Escudos absorveram 0 contra 72,6; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 12,5 p.p. e de HP final 13 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para 37,5 p.p.; contraste de -25 p.p. e alteração de -11,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × mago:** 0/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 186% do DPS efetivo de mago. Por encontro, recebeu 217 contra 480 HP de dano; recuperou 124,9 contra 160 HP (97,5 contra 160 de poções), gastando 35,4 contra 31,1 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 8 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 100 p.p. e de HP final 71,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 100 para 0 p.p.; contraste de 100 p.p. e alteração de 71,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 94,9% do DPS efetivo de arqueiro. Por encontro, recebeu 217 contra 369 HP de dano; recuperou 124,9 contra 208 HP (97,5 contra 208 de poções), gastando 35,4 contra 32 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 22 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 62,5 p.p.; contraste de -62,5 p.p. e alteração de -17,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 0/8 mortes contra 1/8; 0 contra 0 limites de tempo. aventureiro manteve 93,2% do DPS efetivo de necromante. Por encontro, recebeu 217 contra 104,5 HP de dano; recuperou 124,9 contra 0 HP (97,5 contra 0 de poções), gastando 35,4 contra 25,5 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 307 HP e defesa 2 contra 1. Escudos absorveram 0 contra 33,9; invocações causaram 0 contra 96,8 de dano e receberam 0 contra 158,6. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 12,5 p.p. e de HP final 2,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para 0 p.p.; contraste de 12,5 p.p. e alteração de 23,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × mago:** 1/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 149,8% do DPS efetivo de mago. Por encontro, recebeu 324,9 contra 480 HP de dano; recuperou 210,6 contra 160 HP (139,5 contra 160 de poções), gastando 28,6 contra 31,1 mana total e 13,9 contra 0 HP em conjurações. Começou com 310 contra 320 HP e defesa 3 contra 1. Escudos absorveram 72,6 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 7 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 87,5 p.p. e de HP final 58,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 87,5 para 0 p.p.; contraste de 87,5 p.p. e alteração de 58,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: guerreiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × arqueiro:** 1/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 76,4% do DPS efetivo de arqueiro. Por encontro, recebeu 324,9 contra 369 HP de dano; recuperou 210,6 contra 208 HP (139,5 contra 208 de poções), gastando 28,6 contra 32 mana total e 13,9 contra 0 HP em conjurações. Começou com 310 contra 320 HP e defesa 3 contra 2. Escudos absorveram 72,6 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 1 só arqueiro venceu; diferença de vitória -12,5 p.p. e de HP final 9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para 25 p.p.; contraste de -37,5 p.p. e alteração de -6,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: arqueiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × necromante:** 1/8 mortes contra 1/8; 0 contra 0 limites de tempo. guerreiro manteve 75% do DPS efetivo de necromante. Por encontro, recebeu 324,9 contra 104,5 HP de dano; recuperou 210,6 contra 0 HP (139,5 contra 0 de poções), gastando 28,6 contra 25,5 mana total e 13,9 contra 0 HP em conjurações. Começou com 310 contra 307 HP e defesa 3 contra 1. Escudos absorveram 72,6 contra 33,9; invocações causaram 0 contra 96,8 de dano e receberam 0 contra 158,6. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só guerreiro venceu, 1 só necromante venceu; diferença de vitória 0 p.p. e de HP final -10,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -37,5 p.p.; contraste de 37,5 p.p. e alteração de 34,6 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × arqueiro:** 8/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 51% do DPS efetivo de arqueiro. Por encontro, recebeu 480 contra 369 HP de dano; recuperou 160 contra 208 HP (160 contra 208 de poções), gastando 31,1 contra 32 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 320 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 8 só arqueiro venceu; diferença de vitória -100 p.p. e de HP final -49,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -100 para -25 p.p.; contraste de -75 p.p. e alteração de -40,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: arqueiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × necromante:** 8/8 mortes contra 1/8; 0 contra 0 limites de tempo. mago manteve 50,1% do DPS efetivo de necromante. Por encontro, recebeu 480 contra 104,5 HP de dano; recuperou 160 contra 0 HP (160 contra 0 de poções), gastando 31,1 contra 25,5 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 307 HP e defesa 1 contra 1. Escudos absorveram 0 contra 33,9; invocações causaram 0 contra 96,8 de dano e receberam 0 contra 158,6. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 7 só necromante venceu; diferença de vitória -87,5 p.p. e de HP final -69,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -87,5 para 0 p.p.; contraste de -87,5 p.p. e alteração de -69,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**arqueiro × necromante:** 0/8 mortes contra 1/8; 0 contra 0 limites de tempo. arqueiro manteve 98,2% do DPS efetivo de necromante. Por encontro, recebeu 369 contra 104,5 HP de dano; recuperou 208 contra 0 HP (208 contra 0 de poções), gastando 32 contra 25,5 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 307 HP e defesa 2 contra 1. Escudos absorveram 0 contra 33,9; invocações causaram 0 contra 96,8 de dano e receberam 0 contra 158,6. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só arqueiro venceu, 0 só necromante venceu; diferença de vitória 12,5 p.p. e de HP final -19,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para -62,5 p.p.; contraste de 75 p.p. e alteração de 40,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: arqueiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

### O que mudou ao retirar cada fator

**aventureiro, Sem poções de vida:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 23,4 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**aventureiro, Sem habilidades da barra:** retirar esse fator perdeu 8 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 71,7 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Sem poções de vida:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 34,6 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Sem habilidades da barra:** retirar esse fator perdeu 7 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 58,7 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem poções de vida:** retirar esse fator perdeu 6 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 40,8 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem habilidades da barra:** retirar esse fator perdeu 5 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 42,1 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Defesa plana zerada:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 10,5 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem habilidades da barra:** retirar esse fator perdeu 7 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 69,1 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 7/8; 1; 0 | 12,5 | 23,4 | 55,4 (97,5% do completo) | 1 / 0 |
| aventureiro | Sem habilidades da barra | 0/8; 8; 0 | 100 | 71,7 | 25,2 (44,3% do completo) | 8 / 0 |
| aventureiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 1,8 | 56,8 (100% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 7/8; 1; 0 | 0 | 11,8 | 44,7 (97,7% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 4/8; 4; 0 | 37,5 | 34,6 | 47,8 (104,5% do completo) | 3 / 0 |
| guerreiro | Sem habilidades da barra | 0/8; 8; 0 | 87,5 | 58,7 | 23,3 (50,9% do completo) | 7 / 0 |
| guerreiro | Defesa plana zerada | 7/8; 1; 0 | 0 | 6,6 | 44,9 (98,2% do completo) | 0 / 0 |
| mago | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 32,6 (106,6% do completo) | 0 / 0 |
| mago | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 21,3 (69,8% do completo) | 0 / 0 |
| mago | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 31 (101,3% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 2/8; 6; 0 | 75 | 40,8 | 62,9 (105,1% do completo) | 6 / 0 |
| arqueiro | Sem habilidades da barra | 3/8; 5; 0 | 62,5 | 42,1 | 42 (70,2% do completo) | 5 / 0 |
| arqueiro | Defesa plana zerada | 7/8; 1; 0 | 12,5 | 10,5 | 60,8 (101,5% do completo) | 1 / 0 |
| necromante | Sem poções de vida | 7/8; 1; 0 | 0 | 0 | 61 (100% do completo) | 0 / 0 |
| necromante | Sem habilidades da barra | 0/8; 8; 0 | 87,5 | 69,1 | 34,6 (56,7% do completo) | 7 / 0 |
| necromante | Defesa plana zerada | 7/8; 1; 0 | 0 | 0,4 | 60,5 (99,1% do completo) | 0 / 0 |
