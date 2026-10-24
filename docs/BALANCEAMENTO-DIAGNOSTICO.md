# Diagnóstico de balanceamento

**Versão:** 1.0 · **Data:** 24/10/2026

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
| nível 1 · normal · duelo | aventureiro | 8/8 (67,6–100%) | 0 | 0 | 17,7 | 77,5 |
| nível 1 · normal · duelo | guerreiro | 8/8 (67,6–100%) | 0 | 0 | 15,5 | 83,2 |
| nível 1 · normal · duelo | mago | 8/8 (67,6–100%) | 0 | 0 | 11,3 | 69,9 |
| nível 1 · normal · duelo | arqueiro | 8/8 (67,6–100%) | 0 | 0 | 18 | 92,8 |
| nível 1 · normal · duelo | necromante | 8/8 (67,6–100%) | 0 | 0 | 17,7 | 96,9 |
| nível 1 · normal · pressao | aventureiro | 8/8 (67,6–100%) | 0 | 0 | 16,1 | 53,9 |
| nível 1 · normal · pressao | guerreiro | 8/8 (67,6–100%) | 0 | 0 | 14,7 | 92,1 |
| nível 1 · normal · pressao | mago | 8/8 (67,6–100%) | 0 | 0 | 19,5 | 43,7 |
| nível 1 · normal · pressao | arqueiro | 8/8 (67,6–100%) | 0 | 0 | 16,9 | 57,2 |
| nível 1 · normal · pressao | necromante | 8/8 (67,6–100%) | 0 | 0 | 14,3 | 71,9 |
| nível 1 · normal · atrito | aventureiro | 8/8 (67,6–100%) | 0 | 0 | 16 | 41,3 |
| nível 1 · normal · atrito | guerreiro | 8/8 (67,6–100%) | 0 | 0 | 14,2 | 87,6 |
| nível 1 · normal · atrito | mago | 6/8 (40,9–92,9%) | 2 | 0 | 13,9 | 28 |
| nível 1 · normal · atrito | arqueiro | 8/8 (67,6–100%) | 0 | 0 | 15,5 | 49,2 |
| nível 1 · normal · atrito | necromante | 8/8 (67,6–100%) | 0 | 0 | 17,1 | 78,3 |
| nível 1 · normal · chefe | aventureiro | 1/8 (2,2–47,1%) | 7 | 0 | 14,8 | 1,6 |
| nível 1 · normal · chefe | guerreiro | 7/8 (52,9–97,8%) | 1 | 0 | 13,9 | 74,3 |
| nível 1 · normal · chefe | mago | 8/8 (67,6–100%) | 0 | 0 | 13,5 | 29,2 |
| nível 1 · normal · chefe | arqueiro | 8/8 (67,6–100%) | 0 | 0 | 15,9 | 49,2 |
| nível 1 · normal · chefe | necromante | 4/8 (21,5–78,5%) | 4 | 0 | 11,7 | 30 |
| nível 1 · pesadelo · duelo | aventureiro | 8/8 (67,6–100%) | 0 | 0 | 10,6 | 60,1 |
| nível 1 · pesadelo · duelo | guerreiro | 7/8 (52,9–97,8%) | 1 | 0 | 7,3 | 67,9 |
| nível 1 · pesadelo · duelo | mago | 8/8 (67,6–100%) | 0 | 0 | 7,5 | 44,1 |
| nível 1 · pesadelo · duelo | arqueiro | 8/8 (67,6–100%) | 0 | 0 | 9,1 | 74,3 |
| nível 1 · pesadelo · duelo | necromante | 8/8 (67,6–100%) | 0 | 0 | 9,5 | 67,5 |
| nível 1 · pesadelo · pressao | aventureiro | 0/8 (0–32,4%) | 8 | 0 | 11 | 0 |
| nível 1 · pesadelo · pressao | guerreiro | 0/8 (0–32,4%) | 8 | 0 | 9,2 | 0 |
| nível 1 · pesadelo · pressao | mago | 0/8 (0–32,4%) | 8 | 0 | 12,8 | 0 |
| nível 1 · pesadelo · pressao | arqueiro | 0/8 (0–32,4%) | 8 | 0 | 10,1 | 0 |
| nível 1 · pesadelo · pressao | necromante | 1/8 (2,2–47,1%) | 7 | 0 | 8,5 | 4,6 |
| nível 1 · pesadelo · atrito | aventureiro | 0/8 (0–32,4%) | 8 | 0 | 9,4 | 0 |
| nível 1 · pesadelo · atrito | guerreiro | 0/8 (0–32,4%) | 8 | 0 | 7,1 | 0 |
| nível 1 · pesadelo · atrito | mago | 0/8 (0–32,4%) | 8 | 0 | 8,1 | 0 |
| nível 1 · pesadelo · atrito | arqueiro | 0/8 (0–32,4%) | 8 | 0 | 9,9 | 0 |
| nível 1 · pesadelo · atrito | necromante | 8/8 (67,6–100%) | 0 | 0 | 8,2 | 55,8 |
| nível 1 · pesadelo · chefe | aventureiro | 0/8 (0–32,4%) | 8 | 0 | 8 | 0 |
| nível 1 · pesadelo · chefe | guerreiro | 0/8 (0–32,4%) | 8 | 0 | 8,5 | 0 |
| nível 1 · pesadelo · chefe | mago | 0/8 (0–32,4%) | 8 | 0 | 8,1 | 0 |
| nível 1 · pesadelo · chefe | arqueiro | 0/8 (0–32,4%) | 8 | 0 | 8,2 | 0 |
| nível 1 · pesadelo · chefe | necromante | 0/8 (0–32,4%) | 8 | 0 | 5,7 | 0 |
| nível 10 · normal · duelo | aventureiro | 8/8 (67,6–100%) | 0 | 0 | 79,8 | 85,7 |
| nível 10 · normal · duelo | guerreiro | 8/8 (67,6–100%) | 0 | 0 | 53,7 | 88 |
| nível 10 · normal · duelo | mago | 8/8 (67,6–100%) | 0 | 0 | 61,9 | 82,5 |
| nível 10 · normal · duelo | arqueiro | 8/8 (67,6–100%) | 0 | 0 | 49,7 | 88,6 |
| nível 10 · normal · duelo | necromante | 8/8 (67,6–100%) | 0 | 0 | 54,3 | 94,6 |
| nível 10 · normal · pressao | aventureiro | 8/8 (67,6–100%) | 0 | 0 | 56,5 | 61,1 |
| nível 10 · normal · pressao | guerreiro | 8/8 (67,6–100%) | 0 | 0 | 53,3 | 88,5 |
| nível 10 · normal · pressao | mago | 8/8 (67,6–100%) | 0 | 0 | 91,8 | 58,7 |
| nível 10 · normal · pressao | arqueiro | 7/8 (52,9–97,8%) | 1 | 0 | 51,2 | 46 |
| nível 10 · normal · pressao | necromante | 7/8 (52,9–97,8%) | 1 | 0 | 40,6 | 52,8 |
| nível 10 · normal · atrito | aventureiro | 8/8 (67,6–100%) | 0 | 0 | 53,4 | 49,9 |
| nível 10 · normal · atrito | guerreiro | 8/8 (67,6–100%) | 0 | 0 | 49,2 | 91,8 |
| nível 10 · normal · atrito | mago | 7/8 (52,9–97,8%) | 1 | 0 | 45,1 | 49,7 |
| nível 10 · normal · atrito | arqueiro | 8/8 (67,6–100%) | 0 | 0 | 46,8 | 43,2 |
| nível 10 · normal · atrito | necromante | 8/8 (67,6–100%) | 0 | 0 | 48,1 | 92,7 |
| nível 10 · normal · chefe | aventureiro | 8/8 (67,6–100%) | 0 | 0 | 58,4 | 63,8 |
| nível 10 · normal · chefe | guerreiro | 8/8 (67,6–100%) | 0 | 0 | 68,7 | 94,6 |
| nível 10 · normal · chefe | mago | 8/8 (67,6–100%) | 0 | 0 | 55,1 | 85,3 |
| nível 10 · normal · chefe | arqueiro | 8/8 (67,6–100%) | 0 | 0 | 53,9 | 85,1 |
| nível 10 · normal · chefe | necromante | 8/8 (67,6–100%) | 0 | 0 | 44,2 | 84,1 |
| nível 10 · pesadelo · duelo | aventureiro | 8/8 (67,6–100%) | 0 | 0 | 39 | 68,1 |
| nível 10 · pesadelo · duelo | guerreiro | 8/8 (67,6–100%) | 0 | 0 | 28,2 | 75,8 |
| nível 10 · pesadelo · duelo | mago | 8/8 (67,6–100%) | 0 | 0 | 28,8 | 60,3 |
| nível 10 · pesadelo · duelo | arqueiro | 8/8 (67,6–100%) | 0 | 0 | 25,4 | 58,4 |
| nível 10 · pesadelo · duelo | necromante | 8/8 (67,6–100%) | 0 | 0 | 30,8 | 83,2 |
| nível 10 · pesadelo · pressao | aventureiro | 1/8 (2,2–47,1%) | 7 | 0 | 36,3 | 3,2 |
| nível 10 · pesadelo · pressao | guerreiro | 4/8 (21,5–78,5%) | 4 | 0 | 33,1 | 35,3 |
| nível 10 · pesadelo · pressao | mago | 3/8 (13,7–69,4%) | 5 | 0 | 55,2 | 14,1 |
| nível 10 · pesadelo · pressao | arqueiro | 0/8 (0–32,4%) | 8 | 0 | 31,5 | 0 |
| nível 10 · pesadelo · pressao | necromante | 0/8 (0–32,4%) | 8 | 0 | 19,6 | 0 |
| nível 10 · pesadelo · atrito | aventureiro | 0/8 (0–32,4%) | 8 | 0 | 29,3 | 0 |
| nível 10 · pesadelo · atrito | guerreiro | 4/8 (21,5–78,5%) | 4 | 0 | 28,5 | 43,1 |
| nível 10 · pesadelo · atrito | mago | 0/8 (0–32,4%) | 8 | 0 | 31 | 0 |
| nível 10 · pesadelo · atrito | arqueiro | 0/8 (0–32,4%) | 8 | 0 | 29,7 | 0 |
| nível 10 · pesadelo · atrito | necromante | 7/8 (52,9–97,8%) | 1 | 0 | 25,2 | 53,6 |
| nível 10 · pesadelo · chefe | aventureiro | 6/8 (40,9–92,9%) | 2 | 0 | 27,3 | 12,9 |
| nível 10 · pesadelo · chefe | guerreiro | 8/8 (67,6–100%) | 0 | 0 | 39,1 | 81,8 |
| nível 10 · pesadelo · chefe | mago | 8/8 (67,6–100%) | 0 | 0 | 36,6 | 77,3 |
| nível 10 · pesadelo · chefe | arqueiro | 4/8 (21,5–78,5%) | 4 | 0 | 23,6 | 27,1 |
| nível 10 · pesadelo · chefe | necromante | 8/8 (67,6–100%) | 0 | 0 | 26,2 | 69,4 |
| nível 30 · normal · duelo | aventureiro | 8/8 (67,6–100%) | 0 | 0 | 111,8 | 80,2 |
| nível 30 · normal · duelo | guerreiro | 8/8 (67,6–100%) | 0 | 0 | 38,3 | 77,7 |
| nível 30 · normal · duelo | mago | 8/8 (67,6–100%) | 0 | 0 | 94,4 | 87,1 |
| nível 30 · normal · duelo | arqueiro | 8/8 (67,6–100%) | 0 | 0 | 118,8 | 100 |
| nível 30 · normal · duelo | necromante | 8/8 (67,6–100%) | 0 | 0 | 68,1 | 90,3 |
| nível 30 · normal · pressao | aventureiro | 8/8 (67,6–100%) | 0 | 0 | 111,6 | 59,5 |
| nível 30 · normal · pressao | guerreiro | 8/8 (67,6–100%) | 0 | 0 | 89,7 | 84 |
| nível 30 · normal · pressao | mago | 4/8 (21,5–78,5%) | 4 | 0 | 140,2 | 18,3 |
| nível 30 · normal · pressao | arqueiro | 1/8 (2,2–47,1%) | 7 | 0 | 127,7 | 4,2 |
| nível 30 · normal · pressao | necromante | 0/8 (0–32,4%) | 8 | 0 | 45,8 | 0 |
| nível 30 · normal · atrito | aventureiro | 8/8 (67,6–100%) | 0 | 0 | 93,8 | 53,2 |
| nível 30 · normal · atrito | guerreiro | 5/8 (30,6–86,3%) | 0 | 3 | 55 | 61,6 |
| nível 30 · normal · atrito | mago | 1/8 (2,2–47,1%) | 7 | 0 | 80,4 | 2,4 |
| nível 30 · normal · atrito | arqueiro | 7/8 (52,9–97,8%) | 1 | 0 | 114,3 | 42,2 |
| nível 30 · normal · atrito | necromante | 8/8 (67,6–100%) | 0 | 0 | 72,4 | 75 |
| nível 30 · normal · chefe | aventureiro | 8/8 (67,6–100%) | 0 | 0 | 97,4 | 65,8 |
| nível 30 · normal · chefe | guerreiro | 8/8 (67,6–100%) | 0 | 0 | 101,5 | 98,8 |
| nível 30 · normal · chefe | mago | 8/8 (67,6–100%) | 0 | 0 | 89,2 | 79,6 |
| nível 30 · normal · chefe | arqueiro | 8/8 (67,6–100%) | 0 | 0 | 112,9 | 60 |
| nível 30 · normal · chefe | necromante | 8/8 (67,6–100%) | 0 | 0 | 77,5 | 97,7 |
| nível 30 · pesadelo · duelo | aventureiro | 8/8 (67,6–100%) | 0 | 0 | 63,6 | 55,5 |
| nível 30 · pesadelo · duelo | guerreiro | 2/8 (7,1–59,1%) | 6 | 0 | 24,8 | 17 |
| nível 30 · pesadelo · duelo | mago | 7/8 (52,9–97,8%) | 1 | 0 | 54,7 | 50,2 |
| nível 30 · pesadelo · duelo | arqueiro | 8/8 (67,6–100%) | 0 | 0 | 74 | 71 |
| nível 30 · pesadelo · duelo | necromante | 8/8 (67,6–100%) | 0 | 0 | 36,2 | 59,4 |
| nível 30 · pesadelo · pressao | aventureiro | 2/8 (7,1–59,1%) | 6 | 0 | 79,4 | 13,3 |
| nível 30 · pesadelo · pressao | guerreiro | 0/8 (0–32,4%) | 8 | 0 | 60,5 | 0 |
| nível 30 · pesadelo · pressao | mago | 0/8 (0–32,4%) | 8 | 0 | 92,5 | 0 |
| nível 30 · pesadelo · pressao | arqueiro | 0/8 (0–32,4%) | 8 | 0 | 88,2 | 0 |
| nível 30 · pesadelo · pressao | necromante | 0/8 (0–32,4%) | 8 | 0 | 27,2 | 0 |
| nível 30 · pesadelo · atrito | aventureiro | 1/8 (2,2–47,1%) | 7 | 0 | 56,6 | 4,9 |
| nível 30 · pesadelo · atrito | guerreiro | 0/8 (0–32,4%) | 8 | 0 | 26,5 | 0 |
| nível 30 · pesadelo · atrito | mago | 0/8 (0–32,4%) | 8 | 0 | 44,1 | 0 |
| nível 30 · pesadelo · atrito | arqueiro | 0/8 (0–32,4%) | 8 | 0 | 66,5 | 0 |
| nível 30 · pesadelo · atrito | necromante | 0/8 (0–32,4%) | 4 | 4 | 36,5 | 27,1 |
| nível 30 · pesadelo · chefe | aventureiro | 8/8 (67,6–100%) | 0 | 0 | 55,9 | 62 |
| nível 30 · pesadelo · chefe | guerreiro | 8/8 (67,6–100%) | 0 | 0 | 63,9 | 91,5 |
| nível 30 · pesadelo · chefe | mago | 7/8 (52,9–97,8%) | 1 | 0 | 51,3 | 52,7 |
| nível 30 · pesadelo · chefe | arqueiro | 8/8 (67,6–100%) | 0 | 0 | 63,9 | 61,1 |
| nível 30 · pesadelo · chefe | necromante | 7/8 (52,9–97,8%) | 1 | 0 | 36,8 | 54,7 |

## Sinais prioritários para investigar

Até oito diferenças de mortalidade com mais vitórias e ao menos 90% do DPS da classe comparada. A seleção é exploratória; o detalhamento abaixo preserva todos os cenários, inclusive os que não mostraram diferença.

### nível 1 · pesadelo · atrito: necromante sobreviveu mais sem perder mais de 10% do DPS

**necromante × guerreiro:** 0/8 mortes contra 8/8; 0 contra 0 limites de tempo. necromante manteve 114,8% do DPS efetivo de guerreiro. Por encontro, recebeu 107,1 contra 237,8 HP de dano; recuperou 45 contra 158 HP (36 contra 74 de poções), gastando 50,6 contra 31,5 mana total e 0 contra 19,9 HP em conjurações. Começou com 90 contra 93 HP e defesa 1 contra 3. Escudos absorveram 0 contra 31,5; invocações causaram 359,5 contra 0 de dano e receberam 177,6 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 100 para 0 p.p.; contraste de 100 p.p. e alteração de 62,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### nível 1 · pesadelo · atrito: necromante sobreviveu mais sem perder mais de 10% do DPS

**necromante × mago:** 0/8 mortes contra 8/8; 0 contra 0 limites de tempo. necromante manteve 100,6% do DPS efetivo de mago. Por encontro, recebeu 107,1 contra 171 HP de dano; recuperou 45 contra 76 HP (36 contra 76 de poções), gastando 50,6 contra 22,1 mana total e 0 contra 0 HP em conjurações. Começou com 90 contra 95 HP e defesa 1 contra 1. Escudos absorveram 0 contra 3,3; invocações causaram 359,5 contra 0 de dano e receberam 177,6 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 100 para 25 p.p.; contraste de 75 p.p. e alteração de 37,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### nível 30 · normal · pressao: aventureiro sobreviveu mais sem perder mais de 10% do DPS

**aventureiro × necromante:** 0/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 243,7% do DPS efetivo de necromante. Por encontro, recebeu 315,1 contra 567 HP de dano; recuperou 178,5 contra 252 HP (97,5 contra 252 de poções), gastando 41,8 contra 8 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 315 HP e defesa 2 contra 1. Escudos absorveram 0 contra 26; invocações causaram 0 contra 423,4 de dano e receberam 0 contra 127,1. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 100 para 0 p.p.; contraste de 100 p.p. e alteração de 59,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### nível 30 · normal · pressao: guerreiro sobreviveu mais sem perder mais de 10% do DPS

**guerreiro × necromante:** 0/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 196% do DPS efetivo de necromante. Por encontro, recebeu 614,4 contra 567 HP de dano; recuperou 570,3 contra 252 HP (108,5 contra 252 de poções), gastando 31 contra 8 mana total e 14,6 contra 0 HP em conjurações. Começou com 310 contra 315 HP e defesa 3 contra 1. Escudos absorveram 84,4 contra 26; invocações causaram 0 contra 423,4 de dano e receberam 0 contra 127,1. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 100 para 87,5 p.p.; contraste de 12,5 p.p. e alteração de 11,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### nível 1 · normal · chefe: mago sobreviveu mais sem perder mais de 10% do DPS

**mago × aventureiro:** 0/8 mortes contra 7/8; 0 contra 0 limites de tempo. mago manteve 91,3% do DPS efetivo de aventureiro. Por encontro, recebeu 138,5 contra 178,4 HP de dano; recuperou 71,3 contra 80 HP (71,3 contra 80 de poções), gastando 19 contra 22 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 100 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 87,5 para 0 p.p.; contraste de 87,5 p.p. e alteração de 27,6 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### nível 1 · normal · chefe: arqueiro sobreviveu mais sem perder mais de 10% do DPS

**arqueiro × aventureiro:** 0/8 mortes contra 7/8; 0 contra 0 limites de tempo. arqueiro manteve 107,4% do DPS efetivo de aventureiro. Por encontro, recebeu 95,8 contra 178,4 HP de dano; recuperou 47,5 contra 80 HP (47,5 contra 80 de poções), gastando 20 contra 22 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 100 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 87,5 para 50 p.p.; contraste de 37,5 p.p. e alteração de 38,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### nível 30 · normal · atrito: aventureiro sobreviveu mais sem perder mais de 10% do DPS

**aventureiro × mago:** 0/8 mortes contra 7/8; 0 contra 0 limites de tempo. aventureiro manteve 116,7% do DPS efetivo de mago. Por encontro, recebeu 534,1 contra 588 HP de dano; recuperou 355,9 contra 269,8 HP (195 contra 256 de poções), gastando 76,9 contra 62,8 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 1. Escudos absorveram 0 contra 62,5; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 87,5 para 0 p.p.; contraste de 87,5 p.p. e alteração de 50,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### nível 30 · normal · atrito: necromante sobreviveu mais sem perder mais de 10% do DPS

**necromante × mago:** 0/8 mortes contra 7/8; 0 contra 0 limites de tempo. necromante manteve 90,1% do DPS efetivo de mago. Por encontro, recebeu 155,1 contra 588 HP de dano; recuperou 68,6 contra 269,8 HP (63 contra 256 de poções), gastando 73 contra 62,8 mana total e 0 contra 0 HP em conjurações. Começou com 315 contra 320 HP e defesa 1 contra 1. Escudos absorveram 52 contra 62,5; invocações causaram 2.568,6 contra 0 de dano e receberam 486 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 87,5 para 0 p.p.; contraste de 87,5 p.p. e alteração de 64,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

## nível 1 · normal · duelo

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 6,3 s | — | 1 | 120 | 22,6 | 0 | 12,3 | 0 |
| guerreiro | 8 s | — | 1 | 120 | 36,9 | 26,1 | 9,3 | 4,9 |
| mago | 11,3 s | — | 1 | 120 | 38,1 | 9,5 | 10 | 0 |
| arqueiro | 6,2 s | — | 1 | 120 | 6,9 | 0 | 10 | 0 |
| necromante | 6,5 s | — | 1 | 120 | 2,8 | 0 | 10,8 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 0 / 0 / 0 / 0 | 120 / 0 / 0 | 0 | 0 | 4,7 / 2 / 0 / 0 / 0,4 | 2 |
| guerreiro | 0 / 26,1 / 0 / 0 | 120 / 0 / 0 | 0 | 0 | 4,2 / 0,7 / 0 / 0 / 0 | 0,2 |
| mago | 0 / 0 / 9,5 / 0 | 112,1 / 7,9 / 0 | 0 | 0 | 6,2 / 1 / 0 / 0 / 0 | 2,2 |
| arqueiro | 0 / 0 / 0 / 0 | 114,8 / 5,3 / 0 | 0 | 0 | 3,8 / 1 / 0 / 0 / 2,8 | 2,5 |
| necromante | 0 / 0 / 0 / 0 | 50,6 / 0 / 69,4 | 0 | 0 | 3,1 / 1,2 / 0 / 0 / 0 | 2,7 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 8,1 / 1 | 7,1 / 1,3 / 2,6 | 0 / 0 | — | 0,1 / 3,3 |
| guerreiro | 9,3 / 0 | 5,9 / 0,8 / 2,3 | 0 / 0 | — | 0 / 3,8 |
| mago | 9,6 / 1 | 7,8 / 2,1 / 2,3 | 0,1 / 0 | — | 0 / 4,8 |
| arqueiro | 6,5 / 0 | 5,5 / 0,6 / 2,6 | 0 / 0 | — | 0 / 2,6 |
| necromante | 7,4 / 0 | 9,9 / 1,8 / 3,8 | 0,8 / 0 | — | 0 / 3,1 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 3,1 | 42,1 | 0 | 6,3 | 0 | — |
| aventureiro | explosao | 1 | 26,1 | 0 | 3 | 0 | — |
| aventureiro | golpe_atordoante | 1 | 17,9 | 0 | 3 | 0 | — |
| aventureiro | ataque_basico | 3 | 33,9 | 0 | 0 | 0 | — |
| guerreiro | investida | 1,6 | 20,3 | 0 | 4,9 | 0 | — |
| guerreiro | redemoinho | 1,6 | 0 | 0 | 0 | 4,9 | — |
| guerreiro | grito_de_guerra | 1 | 0 | 0 | 4 | 0 | — |
| guerreiro | ataque_basico | 4,9 | 99,8 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 26,1 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 0,1 | 0 | 0 | 0,4 | 0 | — |
| mago | bola_de_fogo | 1 | 24,4 | 0 | 3 | 0 | — |
| mago | dardo_arcano | 6,6 | 61,6 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 1 | 4,5 | 0 | 3 | 0 | — |
| mago | raio_em_cadeia | 1 | 21,6 | 0 | 4 | 0 | — |
| mago | efeito:queimando | 0 | 7,9 | 0 | 0 | 0 | — |
| mago | item:pocao_vida | 0,3 | 0 | 9,5 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 1 | 0 | 0 | 3 | 0 | — |
| arqueiro | chuva_de_flechas | 1 | 18,6 | 0 | 4 | 0 | — |
| arqueiro | flecha_venenosa | 1 | 17,1 | 0 | 3 | 0 | — |
| arqueiro | tiro | 3,5 | 79 | 0 | 0 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 5,3 | 0 | 0 | 0 | — |
| necromante | dardo_funesto | 1,9 | 13,4 | 0 | 3,8 | 0 | — |
| necromante | garras_do_ossuario | 1 | 9,4 | 0 | 3 | 0 | — |
| necromante | comando_sepulcral | 1 | 0 | 0 | 4 | 0 | — |
| necromante | toque_funesto | 3,5 | 27,9 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 69,4 | 0 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 114,6% do DPS efetivo de guerreiro. Por encontro, recebeu 22,6 contra 36,9 HP de dano; recuperou 0 contra 26,1 HP (0 contra 0 de poções), gastando 12,3 contra 9,3 mana total e 0 contra 4,9 HP em conjurações. Começou com 100 contra 93 HP e defesa 2 contra 3. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 0 p.p. e de HP final -5,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 21,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 157,4% do DPS efetivo de mago. Por encontro, recebeu 22,6 contra 38,1 HP de dano; recuperou 0 contra 9,5 HP (0 contra 9,5 de poções), gastando 12,3 contra 10 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 95 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 7,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 18,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 98,3% do DPS efetivo de arqueiro. Por encontro, recebeu 22,6 contra 6,9 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 12,3 contra 10 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 95 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final -15,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 3,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 100,1% do DPS efetivo de necromante. Por encontro, recebeu 22,6 contra 2,8 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 12,3 contra 10,8 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 90 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 69,4 de dano e receberam 0 contra 4,9. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -19,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Defesa plana zerada**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 2,6 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 137,4% do DPS efetivo de mago. Por encontro, recebeu 36,9 contra 38,1 HP de dano; recuperou 26,1 contra 9,5 HP (0 contra 9,5 de poções), gastando 9,3 contra 10 mana total e 4,9 contra 0 HP em conjurações. Começou com 93 contra 95 HP e defesa 3 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 13,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -10 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 85,8% do DPS efetivo de arqueiro. Por encontro, recebeu 36,9 contra 6,9 HP de dano; recuperou 26,1 contra 0 HP (0 contra 0 de poções), gastando 9,3 contra 10 mana total e 4,9 contra 0 HP em conjurações. Começou com 93 contra 95 HP e defesa 3 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final -9,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -17,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 87,3% do DPS efetivo de necromante. Por encontro, recebeu 36,9 contra 2,8 HP de dano; recuperou 26,1 contra 0 HP (0 contra 0 de poções), gastando 9,3 contra 10,8 mana total e 4,9 contra 0 HP em conjurações. Começou com 93 contra 90 HP e defesa 3 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 69,4 de dano e receberam 0 contra 4,9. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -13,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -20,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 62,5% do DPS efetivo de arqueiro. Por encontro, recebeu 38,1 contra 6,9 HP de dano; recuperou 9,5 contra 0 HP (9,5 contra 0 de poções), gastando 10 contra 10 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 95 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final -22,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -14,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 63,6% do DPS efetivo de necromante. Por encontro, recebeu 38,1 contra 2,8 HP de dano; recuperou 9,5 contra 0 HP (9,5 contra 0 de poções), gastando 10 contra 10,8 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 90 HP e defesa 1 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 69,4 de dano e receberam 0 contra 4,9. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -27,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -17,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**arqueiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. arqueiro manteve 101,8% do DPS efetivo de necromante. Por encontro, recebeu 6,9 contra 2,8 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 10 contra 10,8 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 90 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 69,4 de dano e receberam 0 contra 4,9. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -4,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -2,6 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### O que mudou ao retirar cada fator

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 17,7 (100% do completo) | 0 / 0 |
| aventureiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | 20,3 | 11,8 (66,6% do completo) | 0 / 0 |
| aventureiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 2,8 | 17,7 (100% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 8/8; 0; 0 | 0 | 4,7 | 15,2 (98,4% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 15,5 (100% do completo) | 0 / 0 |
| guerreiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | -1,2 | 12 (77,7% do completo) | 0 / 0 |
| guerreiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 3,2 | 15,2 (98,4% do completo) | 0 / 0 |
| mago | Sem poções de vida | 8/8; 0; 0 | 0 | 10 | 11,3 (100% do completo) | 0 / 0 |
| mago | Sem habilidades da barra | 8/8; 0; 0 | 0 | 1,4 | 10,8 (96,3% do completo) | 0 / 0 |
| mago | Defesa plana zerada | 8/8; 0; 0 | 0 | 2,2 | 11,3 (100% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 18 (100% do completo) | 0 / 0 |
| arqueiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | 16,3 | 13,3 (73,5% do completo) | 0 / 0 |
| arqueiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 1,1 | 18 (100% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 17,7 (100% do completo) | 0 / 0 |
| necromante | Sem habilidades da barra | 8/8; 0; 0 | 0 | 18,9 | 11,3 (63,7% do completo) | 0 / 0 |
| necromante | Defesa plana zerada | 8/8; 0; 0 | 0 | 0,1 | 17,7 (100% do completo) | 0 / 0 |

## nível 1 · normal · pressao

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 21 s | — | 1 | 318 | 95,8 | 46,5 | 20,8 | 0 |
| guerreiro | 21,4 s | — | 1 | 318 | 106,5 | 103,4 | 20 | 9,8 |
| mago | 16,8 s | — | 1 | 318 | 110,5 | 57 | 17,1 | 0 |
| arqueiro | 18,9 s | — | 1 | 318 | 97,6 | 57 | 18,1 | 0 |
| necromante | 22,8 s | — | 1 | 318 | 48 | 11,3 | 24,1 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 1,5 / 0 / 45 / 0 | 318 / 0 / 0 | 0 | 0 | 10,7 / 9 / 0 / 0 / 6,9 | 1,8 |
| guerreiro | 0 / 80,3 / 23,1 / 0 | 312,5 / 5,5 / 0 | 5,3 | 0 | 10 / 7,7 / 0 / 0 / 0,5 | 1,3 |
| mago | 0 / 0 / 57 / 0 | 308,3 / 9,8 / 0 | 0 | 0 | 10,1 / 1 / 0 / 0,2 / 1,5 | 2,8 |
| arqueiro | 0 / 0 / 57 / 0 | 318 / 0 / 0 | 0 | 0 | 9,3 / 1 / 0 / 0 / 8,3 | 2,7 |
| necromante | 0 / 6,8 / 4,5 / 0 | 118,6 / 0 / 199,4 | 0 | 6,8 | 7,8 / 7,6 / 0 / 0 / 5,4 | 3,9 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 19,8 / 2,4 | 16,5 / 2,5 / 7,4 | 0 / 0 | — | 3,1 / 11,4 |
| guerreiro | 22 / 1,3 | 14,3 / 1,6 / 6,5 | 0,5 / 0 | — | 5,5 / 13,1 |
| mago | 15,3 / 1,4 | 20,9 / 3 / 8,8 | 0,9 / 0 | — | 0 / 7,9 |
| arqueiro | 17,1 / 0 | 16,6 / 2,3 / 7,6 | 0 / 0 | — | 0 / 9 |
| necromante | 18,8 / 0,5 | 29 / 2,9 / 12,9 | 1 / 0 | — | 11,5 / 16,4 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 7,3 | 119,5 | 0 | 14,5 | 0 | — |
| aventureiro | explosao | 1 | 26,1 | 0 | 3 | 0 | — |
| aventureiro | golpe_atordoante | 1 | 17,9 | 0 | 3 | 0 | — |
| aventureiro | ataque_basico | 10,4 | 154,5 | 0 | 0 | 0 | — |
| aventureiro | item:pocao_vida | 1,1 | 0 | 45 | 0 | 0 | — |
| aventureiro | curar | 0,1 | 0 | 1,5 | 0,3 | 0 | 6 |
| guerreiro | investida | 3,5 | 55,8 | 0 | 10,5 | 0 | — |
| guerreiro | redemoinho | 3,3 | 10,5 | 0 | 0 | 9,8 | — |
| guerreiro | grito_de_guerra | 2 | 0 | 0 | 8 | 0 | — |
| guerreiro | ataque_basico | 12,8 | 246,3 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 80,3 | 0 | 0 | — |
| guerreiro | efeito:dano_direto | 0 | 5,5 | 0 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 0,5 | 0 | 0 | 1,5 | 0 | — |
| guerreiro | item:pocao_vida | 0,6 | 0 | 23,1 | 0 | 0 | — |
| mago | bola_de_fogo | 2,6 | 54,3 | 0 | 7,9 | 0 | — |
| mago | dardo_arcano | 9,9 | 151,9 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 1,8 | 44,4 | 0 | 5,3 | 0 | — |
| mago | raio_em_cadeia | 1 | 57,8 | 0 | 4 | 0 | — |
| mago | item:pocao_vida | 1,5 | 0 | 57 | 0 | 0 | — |
| mago | efeito:queimando | 0 | 9,8 | 0 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 2,6 | 37 | 0 | 7,9 | 0 | — |
| arqueiro | chuva_de_flechas | 1,3 | 25,9 | 0 | 5 | 0 | — |
| arqueiro | flecha_venenosa | 1,8 | 2,8 | 0 | 5,3 | 0 | — |
| arqueiro | tiro | 11,5 | 252,4 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 1,5 | 0 | 57 | 0 | 0 | — |
| necromante | dardo_funesto | 4,5 | 31,4 | 0 | 9 | 0 | — |
| necromante | garras_do_ossuario | 1,9 | 18 | 0 | 5,6 | 0 | — |
| necromante | comando_sepulcral | 1,6 | 0 | 0 | 6,5 | 0 | — |
| necromante | toque_funesto | 9,8 | 69,3 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 199,4 | 0 | 0 | 0 | — |
| necromante | dizimo_vital | 1 | 0 | 0 | 3 | 0 | — |
| necromante | efeito:cura | 0 | 0 | 6,8 | 0 | 0 | — |
| necromante | item:pocao_vida | 0,1 | 0 | 4,5 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 109,6% do DPS efetivo de guerreiro. Por encontro, recebeu 95,8 contra 106,5 HP de dano; recuperou 46,5 contra 103,4 HP (45 contra 23,1 de poções), gastando 20,8 contra 20 mana total e 0 contra 9,8 HP em conjurações. Começou com 100 contra 93 HP e defesa 2 contra 3. Escudos absorveram 0 contra 5,3; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 0 p.p. e de HP final -38,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -37,5 p.p.; contraste de 37,5 p.p. e alteração de 29,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 82,5% do DPS efetivo de mago. Por encontro, recebeu 95,8 contra 110,5 HP de dano; recuperou 46,5 contra 57 HP (45 contra 57 de poções), gastando 20,8 contra 17,1 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 95 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 10,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 50 p.p.; contraste de -50 p.p. e alteração de -12,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 95,4% do DPS efetivo de arqueiro. Por encontro, recebeu 95,8 contra 97,6 HP de dano; recuperou 46,5 contra 57 HP (45 contra 57 de poções), gastando 20,8 contra 18,1 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 95 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final -3,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 25 p.p.; contraste de -25 p.p. e alteração de -18,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 112,8% do DPS efetivo de necromante. Por encontro, recebeu 95,8 contra 48 HP de dano; recuperou 46,5 contra 11,3 HP (45 contra 4,5 de poções), gastando 20,8 contra 24,1 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 90 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 199,4 de dano e receberam 0 contra 59,9. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -18,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -37,5 p.p.; contraste de 37,5 p.p. e alteração de 31,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 75,3% do DPS efetivo de mago. Por encontro, recebeu 106,5 contra 110,5 HP de dano; recuperou 103,4 contra 57 HP (23,1 contra 57 de poções), gastando 20 contra 17,1 mana total e 9,8 contra 0 HP em conjurações. Começou com 93 contra 95 HP e defesa 3 contra 1. Escudos absorveram 5,3 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 48,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 62,5 p.p.; contraste de -62,5 p.p. e alteração de -37,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 87% do DPS efetivo de arqueiro. Por encontro, recebeu 106,5 contra 97,6 HP de dano; recuperou 103,4 contra 57 HP (23,1 contra 57 de poções), gastando 20 contra 18,1 mana total e 9,8 contra 0 HP em conjurações. Começou com 93 contra 95 HP e defesa 3 contra 2. Escudos absorveram 5,3 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 34,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 62,5 p.p.; contraste de -62,5 p.p. e alteração de -48,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 102,9% do DPS efetivo de necromante. Por encontro, recebeu 106,5 contra 48 HP de dano; recuperou 103,4 contra 11,3 HP (23,1 contra 4,5 de poções), gastando 20 contra 24,1 mana total e 9,8 contra 0 HP em conjurações. Começou com 93 contra 90 HP e defesa 3 contra 1. Escudos absorveram 5,3 contra 0; invocações causaram 0 contra 199,4 de dano e receberam 0 contra 59,9. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final 20,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 12,5 p.p.; contraste de -12,5 p.p. e alteração de -16,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 115,6% do DPS efetivo de arqueiro. Por encontro, recebeu 110,5 contra 97,6 HP de dano; recuperou 57 contra 57 HP (57 contra 57 de poções), gastando 17,1 contra 18,1 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 95 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final -13,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -37,5 p.p.; contraste de 37,5 p.p. e alteração de 4,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 136,7% do DPS efetivo de necromante. Por encontro, recebeu 110,5 contra 48 HP de dano; recuperou 57 contra 11,3 HP (57 contra 4,5 de poções), gastando 17,1 contra 24,1 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 90 HP e defesa 1 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 199,4 de dano e receberam 0 contra 59,9. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -28,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -62,5 p.p.; contraste de 62,5 p.p. e alteração de 39,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**arqueiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. arqueiro manteve 118,3% do DPS efetivo de necromante. Por encontro, recebeu 97,6 contra 48 HP de dano; recuperou 57 contra 11,3 HP (57 contra 4,5 de poções), gastando 18,1 contra 24,1 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 90 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 199,4 de dano e receberam 0 contra 59,9. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -14,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -62,5 p.p.; contraste de 62,5 p.p. e alteração de 50,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### O que mudou ao retirar cada fator

**aventureiro, Sem poções de vida:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 34,3 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**aventureiro, Sem habilidades da barra:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 17,4 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem poções de vida:** retirar esse fator perdeu 5 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 41,6 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem habilidades da barra:** retirar esse fator perdeu 5 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 30,1 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem poções de vida:** retirar esse fator perdeu 5 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 52,5 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem habilidades da barra:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 25,4 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem habilidades da barra:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 12,4 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 5/8; 3; 0 | 37,5 | 34,3 | 16,4 (101,9% do completo) | 3 / 0 |
| aventureiro | Sem habilidades da barra | 7/8; 1; 0 | 12,5 | 17,4 | 12,2 (75,6% do completo) | 1 / 0 |
| aventureiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 5,2 | 16,3 (101% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 8/8; 0; 0 | 0 | 6,7 | 14 (95% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 8/8; 0; 0 | 0 | 4,4 | 14,7 (100% do completo) | 0 / 0 |
| guerreiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | -4,6 | 12,2 (82,7% do completo) | 0 / 0 |
| guerreiro | Defesa plana zerada | 8/8; 0; 0 | 0 | -1,5 | 15,3 (103,9% do completo) | 0 / 0 |
| mago | Sem poções de vida | 3/8; 5; 0 | 62,5 | 41,6 | 20,5 (104,9% do completo) | 5 / 0 |
| mago | Sem habilidades da barra | 3/8; 5; 0 | 62,5 | 30,1 | 11,2 (57,5% do completo) | 5 / 0 |
| mago | Defesa plana zerada | 8/8; 0; 0 | 0 | 2 | 19,5 (100% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 3/8; 5; 0 | 62,5 | 52,5 | 16,7 (99% do completo) | 5 / 0 |
| arqueiro | Sem habilidades da barra | 6/8; 2; 0 | 25 | 25,4 | 13,7 (81,1% do completo) | 2 / 0 |
| arqueiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 2,4 | 16,9 (100% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 8/8; 0; 0 | 0 | 2,4 | 14 (98,2% do completo) | 0 / 0 |
| necromante | Sem habilidades da barra | 7/8; 1; 0 | 12,5 | 12,4 | 9,6 (67,2% do completo) | 1 / 0 |
| necromante | Defesa plana zerada | 8/8; 0; 0 | 0 | -3,7 | 14,2 (99,3% do completo) | 0 / 0 |

## nível 1 · normal · atrito

### Onde o desgaste aparece

| Classe | Onda | Chegaram/n inicial | Mortes / limites nesta onda | HP entrada → saída | Mana entrada → saída | Recebido / cura / mana gasta |
|---|---|---|---|---|---|---|
| aventureiro | 1 | 8/8 | 0 / 0 | 100 → 87 | 10 → 2 | 13 / 0 / 10,5 |
| aventureiro | 2 | 8/8 | 0 / 0 | 87 → 53,3 | 2 → 0,7 | 35,3 / 0 / 6,3 |
| aventureiro | 3 | 8/8 | 0 / 0 | 53,3 → 60,3 | 0,7 → 0,4 | 21,8 / 26,3 / 5 |
| aventureiro | 4 | 8/8 | 0 / 0 | 60,3 → 60,1 | 0,4 → 0,5 | 36,3 / 35 / 4,3 |
| aventureiro | 5 | 8/8 | 0 / 0 | 60,1 → 41,3 | 0,5 → 0,6 | 29,3 / 10 / 3 |
| guerreiro | 1 | 8/8 | 0 / 0 | 93 → 81,3 | 10 → 5,1 | 28,6 / 19,9 / 7 |
| guerreiro | 2 | 8/8 | 0 / 0 | 81,3 → 77,4 | 5,1 → 3,2 | 30,5 / 28,9 / 9,3 |
| guerreiro | 3 | 8/8 | 0 / 0 | 77,4 → 81 | 3,2 → 3,4 | 20 / 24,1 / 6,5 |
| guerreiro | 4 | 8/8 | 0 / 0 | 81 → 79,9 | 3,4 → 3,2 | 23,5 / 23,8 / 4,1 |
| guerreiro | 5 | 8/8 | 0 / 0 | 79,9 → 81,5 | 3,2 → 2,8 | 28,1 / 30,1 / 4,4 |
| mago | 1 | 8/8 | 0 / 0 | 95 → 77,3 | 12 → 5,3 | 22,5 / 4,8 / 10 |
| mago | 2 | 8/8 | 0 / 0 | 77,3 → 51,4 | 5,3 → 6,3 | 40,1 / 14,3 / 3,8 |
| mago | 3 | 8/8 | 0 / 0 | 51,4 → 46,9 | 6,3 → 2,3 | 28,3 / 23,8 / 7,9 |
| mago | 4 | 8/8 | 0 / 0 | 46,9 → 41,3 | 2,3 → 3,9 | 25,4 / 19 / 3 |
| mago | 5 | 8/8 | 2 / 0 | 41,3 → 26,6 | 3,9 → 5,4 | 28,9 / 14,3 / 1,5 |
| arqueiro | 1 | 8/8 | 0 / 0 | 95 → 89,6 | 10 → 1,9 | 5,4 / 0 / 10 |
| arqueiro | 2 | 8/8 | 0 / 0 | 89,6 → 61,9 | 1,9 → 3,3 | 32,5 / 4,8 / 3 |
| arqueiro | 3 | 8/8 | 0 / 0 | 61,9 → 55,1 | 3,3 → 1,1 | 35,3 / 28,5 / 6 |
| arqueiro | 4 | 8/8 | 0 / 0 | 55,1 → 52 | 1,1 → 3,4 | 22,8 / 19 / 2,3 |
| arqueiro | 5 | 8/8 | 0 / 0 | 52 → 46,8 | 3,4 → 3,1 | 29 / 23,8 / 2,6 |
| necromante | 1 | 8/8 | 0 / 0 | 90 → 82,3 | 12 → 4,6 | 7,8 / 0 / 9,8 |
| necromante | 2 | 8/8 | 0 / 0 | 82,3 → 79,3 | 4,6 → 4,3 | 3 / 0 / 4 |
| necromante | 3 | 8/8 | 0 / 0 | 79,3 → 81,9 | 4,3 → 1,8 | 0 / 0 / 8 |
| necromante | 4 | 8/8 | 0 / 0 | 81,9 → 70,8 | 1,8 → 2,4 | 14,3 / 0 / 4,5 |
| necromante | 5 | 8/8 | 0 / 0 | 70,8 → 70,5 | 2,4 → 2,9 | 2,5 / 2,3 / 2,5 |

Médias de cada onda incluem apenas quem chegou a ela; o denominador inicial mostra a seleção dos sobreviventes. Não compare a vida da onda 5 como se incluísse quem morreu antes.

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 34,8 s | — | 5 | 534 | 135,5 | 71,3 | 29 | 0 |
| guerreiro | 37 s | — | 5 | 534 | 130,8 | 126,8 | 31,3 | 18,4 |
| mago | 37,8 s | 42,7 s | 4,8 | 524,3 | 145,1 | 76 | 26,1 | 0 |
| arqueiro | 34,4 s | — | 5 | 534 | 124,9 | 76 | 23,9 | 0 |
| necromante | 30,3 s | — | 5 | 534 | 27,5 | 2,3 | 28,8 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 1,3 / 0 / 70 / 0 | 534 / 0 / 0 | 0 | 0 | 17,2 / 11,6 / 0 / 0,2 / 14,1 | 1,6 |
| guerreiro | 0 / 112,9 / 13,9 / 0 | 530,6 / 3,4 / 0 | 10,4 | 0 | 17,1 / 11,5 / 0 / 0 / 0,8 | 1 |
| mago | 0 / 0 / 76 / 0 | 494,4 / 29,9 / 0 | 3,1 | 0 | 21,1 / 3,7 / 0 / 3,5 / 8,2 | 2,4 |
| arqueiro | 0 / 0 / 76 / 0 | 529,4 / 4,6 / 0 | 0 | 0 | 16 / 3,4 / 0 / 0,7 / 17 | 2,5 |
| necromante | 0 / 2,3 / 0 / 0 | 177,9 / 0 / 356,1 | 0 | 2,3 | 11,8 / 6,4 / 0 / 0 / 6 | 2,9 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 32,5 / 4,4 | 27,6 / 3,8 / 9,6 | 0 / 0 | — | 5,5 / 19,6 |
| guerreiro | 39,1 / 5,6 | 22,9 / 3,5 / 10,1 | 0,1 / 0 | — | 10,9 / 24 |
| mago | 32,1 / 2,4 | 27,3 / 4,6 / 10,5 | 0,1 / 0 | — | 0,8 / 19,6 |
| arqueiro | 29,6 / 0,6 | 27 / 3,4 / 10,8 | 0 / 0 | — | 0,6 / 17 |
| necromante | 28,3 / 2,3 | 61 / 9,1 / 26 | 1,6 / 0 | — | 5,8 / 19,7 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 11 | 205,3 | 0 | 22 | 0 | — |
| aventureiro | explosao | 1 | 27,9 | 0 | 3 | 0 | — |
| aventureiro | golpe_atordoante | 1,3 | 26,8 | 0 | 3,8 | 0 | — |
| aventureiro | ataque_basico | 19,1 | 274,1 | 0 | 0 | 0 | — |
| aventureiro | item:pocao_vida | 1,8 | 0 | 70 | 0 | 0 | — |
| aventureiro | curar | 0,1 | 0 | 1,3 | 0,3 | 0 | 5 |
| guerreiro | investida | 5,8 | 82,5 | 0 | 17,3 | 0 | — |
| guerreiro | redemoinho | 6,1 | 71,6 | 0 | 0 | 18,4 | — |
| guerreiro | grito_de_guerra | 2,8 | 0 | 0 | 11 | 0 | — |
| guerreiro | ataque_basico | 23,5 | 376,5 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 112,9 | 0 | 0 | — |
| guerreiro | efeito:dano_direto | 0 | 3,4 | 0 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 1 | 0 | 0 | 3 | 0 | — |
| guerreiro | item:pocao_vida | 0,4 | 0 | 13,9 | 0 | 0 | — |
| mago | bola_de_fogo | 4,3 | 125,1 | 0 | 12,8 | 0 | — |
| mago | dardo_arcano | 23,8 | 326,5 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 2,6 | 18,9 | 0 | 7,9 | 0 | — |
| mago | raio_em_cadeia | 1 | 23,9 | 0 | 4 | 0 | — |
| mago | efeito:queimando | 0 | 29,9 | 0 | 0 | 0 | — |
| mago | barreira | 0,5 | 0 | 0 | 1,5 | 0 | — |
| mago | item:pocao_vida | 2 | 0 | 76 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 5 | 78,6 | 0 | 15 | 0 | — |
| arqueiro | chuva_de_flechas | 1 | 20,4 | 0 | 4 | 0 | — |
| arqueiro | flecha_venenosa | 1,6 | 24,3 | 0 | 4,9 | 0 | — |
| arqueiro | tiro | 22 | 406,1 | 0 | 0 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 4,6 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 2 | 0 | 76 | 0 | 0 | — |
| necromante | dardo_funesto | 6,6 | 44,3 | 0 | 13,3 | 0 | — |
| necromante | garras_do_ossuario | 2,4 | 22,3 | 0 | 7,1 | 0 | — |
| necromante | comando_sepulcral | 2 | 0 | 0 | 8 | 0 | — |
| necromante | toque_funesto | 17,1 | 111,4 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 356,1 | 0 | 0 | 0 | — |
| necromante | dizimo_vital | 0,1 | 0 | 0 | 0,4 | 0 | — |
| necromante | efeito:cura | 0 | 0 | 2,3 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 112,7% do DPS efetivo de guerreiro. Por encontro, recebeu 135,5 contra 130,8 HP de dano; recuperou 71,3 contra 126,8 HP (70 contra 13,9 de poções), gastando 29 contra 31,3 mana total e 0 contra 18,4 HP em conjurações. Começou com 100 contra 93 HP e defesa 2 contra 3. Escudos absorveram 0 contra 10,4; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 0 p.p. e de HP final -46,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -87,5 p.p.; contraste de 87,5 p.p. e alteração de 33,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × mago:** 0/8 mortes contra 2/8; 0 contra 0 limites de tempo. aventureiro manteve 115,1% do DPS efetivo de mago. Por encontro, recebeu 135,5 contra 145,1 HP de dano; recuperou 71,3 contra 76 HP (70 contra 76 de poções), gastando 29 contra 26,1 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 95 HP e defesa 2 contra 1. Escudos absorveram 0 contra 3,1; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 2 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 25 p.p. e de HP final 13,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 25 para -25 p.p.; contraste de 50 p.p. e alteração de 19,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 103,2% do DPS efetivo de arqueiro. Por encontro, recebeu 135,5 contra 124,9 HP de dano; recuperou 71,3 contra 76 HP (70 contra 76 de poções), gastando 29 contra 23,9 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 95 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final -8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -62,5 p.p.; contraste de 62,5 p.p. e alteração de 13,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 93,8% do DPS efetivo de necromante. Por encontro, recebeu 135,5 contra 27,5 HP de dano; recuperou 71,3 contra 2,3 HP (70 contra 0 de poções), gastando 29 contra 28,8 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 90 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 356,1 de dano e receberam 0 contra 76. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -37,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -87,5 p.p.; contraste de 87,5 p.p. e alteração de 36,6 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × mago:** 0/8 mortes contra 2/8; 0 contra 0 limites de tempo. guerreiro manteve 102,1% do DPS efetivo de mago. Por encontro, recebeu 130,8 contra 145,1 HP de dano; recuperou 126,8 contra 76 HP (13,9 contra 76 de poções), gastando 31,3 contra 26,1 mana total e 18,4 contra 0 HP em conjurações. Começou com 93 contra 95 HP e defesa 3 contra 1. Escudos absorveram 10,4 contra 3,1; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 2 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 25 p.p. e de HP final 59,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 25 para 100 p.p.; contraste de -75 p.p. e alteração de -24,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: guerreiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 91,6% do DPS efetivo de arqueiro. Por encontro, recebeu 130,8 contra 124,9 HP de dano; recuperou 126,8 contra 76 HP (13,9 contra 76 de poções), gastando 31,3 contra 23,9 mana total e 18,4 contra 0 HP em conjurações. Começou com 93 contra 95 HP e defesa 3 contra 2. Escudos absorveram 10,4 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 38,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 100 p.p.; contraste de -100 p.p. e alteração de -46 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 83,2% do DPS efetivo de necromante. Por encontro, recebeu 130,8 contra 27,5 HP de dano; recuperou 126,8 contra 2,3 HP (13,9 contra 0 de poções), gastando 31,3 contra 28,8 mana total e 18,4 contra 0 HP em conjurações. Começou com 93 contra 90 HP e defesa 3 contra 1. Escudos absorveram 10,4 contra 0; invocações causaram 0 contra 356,1 de dano e receberam 0 contra 76. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final 9,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Defesa plana zerada**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -4,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × arqueiro:** 2/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 89,7% do DPS efetivo de arqueiro. Por encontro, recebeu 145,1 contra 124,9 HP de dano; recuperou 76 contra 76 HP (76 contra 76 de poções), gastando 26,1 contra 23,9 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 95 HP e defesa 1 contra 2. Escudos absorveram 3,1 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 2 só arqueiro venceu; diferença de vitória -25 p.p. e de HP final -21,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -25 para 0 p.p.; contraste de -25 p.p. e alteração de -21,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: arqueiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × necromante:** 2/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 81,5% do DPS efetivo de necromante. Por encontro, recebeu 145,1 contra 27,5 HP de dano; recuperou 76 contra 2,3 HP (76 contra 0 de poções), gastando 26,1 contra 28,8 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 90 HP e defesa 1 contra 1. Escudos absorveram 3,1 contra 0; invocações causaram 0 contra 356,1 de dano e receberam 0 contra 76. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 2 só necromante venceu; diferença de vitória -25 p.p. e de HP final -50,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -25 para -100 p.p.; contraste de 75 p.p. e alteração de 28 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**arqueiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. arqueiro manteve 90,9% do DPS efetivo de necromante. Por encontro, recebeu 124,9 contra 27,5 HP de dano; recuperou 76 contra 2,3 HP (76 contra 0 de poções), gastando 23,9 contra 28,8 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 90 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 356,1 de dano e receberam 0 contra 76. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -29,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -100 p.p.; contraste de 100 p.p. e alteração de 49,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### O que mudou ao retirar cada fator

**aventureiro, Sem poções de vida:** retirar esse fator perdeu 7 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 36,6 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**aventureiro, Sem habilidades da barra:** retirar esse fator perdeu 6 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 36,8 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem poções de vida:** retirar esse fator perdeu 6 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 28 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem habilidades da barra:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 17,6 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Defesa plana zerada:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 11,3 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem poções de vida:** retirar esse fator perdeu 8 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 49,2 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem habilidades da barra:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 22,9 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Defesa plana zerada:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 14,3 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 1/8; 7; 0 | 87,5 | 36,6 | 15,8 (99,1% do completo) | 7 / 0 |
| aventureiro | Sem habilidades da barra | 2/8; 6; 0 | 75 | 36,8 | 12,2 (76,6% do completo) | 6 / 0 |
| aventureiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 11 | 16 (99,8% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 8/8; 0; 0 | 0 | -1,1 | 13,4 (94,4% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 8/8; 0; 0 | 0 | 3,2 | 14,2 (100% do completo) | 0 / 0 |
| guerreiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | -12,4 | 12,3 (86,6% do completo) | 0 / 0 |
| guerreiro | Defesa plana zerada | 8/8; 0; 0 | 0 | -2,4 | 13,3 (93,9% do completo) | 0 / 0 |
| mago | Sem poções de vida | 0/8; 8; 0 | 75 | 28 | 13,5 (96,9% do completo) | 6 / 0 |
| mago | Sem habilidades da barra | 4/8; 4; 0 | 25 | 17,6 | 11,5 (83,1% do completo) | 2 / 0 |
| mago | Defesa plana zerada | 4/8; 4; 0 | 25 | 11,3 | 13,6 (97,9% do completo) | 2 / 0 |
| arqueiro | Sem poções de vida | 0/8; 8; 0 | 100 | 49,2 | 15,4 (99,1% do completo) | 8 / 0 |
| arqueiro | Sem habilidades da barra | 7/8; 1; 0 | 12,5 | 22,9 | 13,6 (87,5% do completo) | 1 / 0 |
| arqueiro | Defesa plana zerada | 7/8; 1; 0 | 12,5 | 14,3 | 15,3 (99% do completo) | 1 / 0 |
| necromante | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 17,1 (100% do completo) | 0 / 0 |
| necromante | Sem habilidades da barra | 8/8; 0; 0 | 0 | -8,6 | 11 (64,6% do completo) | 0 / 0 |
| necromante | Defesa plana zerada | 8/8; 0; 0 | 0 | 1,8 | 17,1 (100% do completo) | 0 / 0 |

## nível 1 · normal · chefe

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 25,4 s | 25,8 s | 0,1 | 376,6 | 178,4 | 80 | 22 | 0 |
| guerreiro | 34,5 s | 35,1 s | 0,9 | 481,5 | 145,3 | 137,9 | 25,6 | 16,5 |
| mago | 36 s | — | 1 | 481 | 138,5 | 71,3 | 19 | 0 |
| arqueiro | 30,9 s | — | 1 | 481 | 95,8 | 47,5 | 20 | 0 |
| necromante | 35,4 s | 47,7 s | 0,5 | 483,6 | 112,9 | 49,5 | 24,9 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 0 / 0 / 80 / 0 | 376,6 / 0 / 0 | 0 | 0 | 12,5 / 5,1 / 2,9 / 3,6 / 8,6 | 1,1 |
| guerreiro | 0 / 68,5 / 69,4 / 0 | 477,8 / 3,8 / 0 | 15,6 | 0 | 14,6 / 4,3 / 4,1 / 2,4 / 4,7 | 0,8 |
| mago | 0 / 0 / 71,3 / 0 | 446,4 / 34,6 / 0 | 0 | 0 | 18,5 / 11,6 / 1,6 / 2,9 / 5,3 | 2 |
| arqueiro | 0 / 0 / 47,5 / 0 | 473,5 / 7,5 / 0 | 0 | 0 | 12,9 / 11,4 / 1,6 / 0 / 12,7 | 2,1 |
| necromante | 0 / 4,5 / 45 / 0 | 220,3 / 0 / 263,4 | 0 | 4,5 | 13,7 / 14,6 / 1,1 / 3,7 / 4,2 | 2 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 23,8 / 4,4 | 18,8 / 2,4 / 6,9 | 0 / 0 | bloqueado: 29,5 | 0 / 12,6 |
| guerreiro | 33,6 / 4,9 | 21,8 / 3,4 / 8,5 | 0 / 0 | bloqueado: 3,4 | 0 / 16,9 |
| mago | 28,1 / 2,4 | 24,8 / 3,8 / 9,3 | 0 / 0 | — | 0 / 18,1 |
| arqueiro | 23,8 / 0,8 | 22,3 / 2,6 / 9,8 | 0 / 0 | — | 0 / 14,5 |
| necromante | 31,9 / 0,9 | 42,3 / 6,3 / 17,5 | 1,8 / 0 | — | 0,4 / 20,8 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 8 | 168,1 | 0 | 16 | 0 | — |
| aventureiro | explosao | 1 | 25,3 | 0 | 3 | 0 | — |
| aventureiro | golpe_atordoante | 1 | 8,5 | 0 | 3 | 0 | — |
| aventureiro | ataque_basico | 13,8 | 174,8 | 0 | 0 | 0 | — |
| aventureiro | item:pocao_vida | 2 | 0 | 80 | 0 | 0 | — |
| guerreiro | investida | 4,5 | 60,3 | 0 | 13,5 | 0 | — |
| guerreiro | redemoinho | 5,5 | 73,1 | 0 | 0 | 16,5 | — |
| guerreiro | grito_de_guerra | 2 | 0 | 0 | 8 | 0 | — |
| guerreiro | ataque_basico | 20,3 | 344,4 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 68,5 | 0 | 0 | — |
| guerreiro | efeito:dano_direto | 0 | 3,8 | 0 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 1,4 | 0 | 0 | 4,1 | 0 | — |
| guerreiro | item:pocao_vida | 1,9 | 0 | 69,4 | 0 | 0 | — |
| mago | bola_de_fogo | 3 | 37,4 | 0 | 9 | 0 | — |
| mago | dardo_arcano | 22,1 | 363,4 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 2 | 25,5 | 0 | 6 | 0 | — |
| mago | raio_em_cadeia | 1 | 20,1 | 0 | 4 | 0 | — |
| mago | efeito:queimando | 0 | 34,6 | 0 | 0 | 0 | — |
| mago | item:pocao_vida | 1,9 | 0 | 71,3 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 4 | 117 | 0 | 12 | 0 | — |
| arqueiro | chuva_de_flechas | 1,3 | 11,3 | 0 | 5 | 0 | — |
| arqueiro | flecha_venenosa | 1 | 16,4 | 0 | 3 | 0 | — |
| arqueiro | tiro | 17,5 | 328,9 | 0 | 0 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 7,5 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 1,3 | 0 | 47,5 | 0 | 0 | — |
| necromante | dardo_funesto | 4,8 | 37,9 | 0 | 9,5 | 0 | — |
| necromante | garras_do_ossuario | 2 | 19,1 | 0 | 6 | 0 | — |
| necromante | comando_sepulcral | 1,5 | 0 | 0 | 6 | 0 | — |
| necromante | toque_funesto | 22,5 | 163,3 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 263,4 | 0 | 0 | 0 | — |
| necromante | dizimo_vital | 1,1 | 0 | 0 | 3,4 | 0 | — |
| necromante | efeito:cura | 0 | 0 | 4,5 | 0 | 0 | — |
| necromante | item:pocao_vida | 1,3 | 0 | 45 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 7/8 mortes contra 1/8; 0 contra 0 limites de tempo. aventureiro manteve 106,5% do DPS efetivo de guerreiro. Por encontro, recebeu 178,4 contra 145,3 HP de dano; recuperou 80 contra 137,9 HP (80 contra 69,4 de poções), gastando 22 contra 25,6 mana total e 0 contra 16,5 HP em conjurações. Começou com 100 contra 93 HP e defesa 2 contra 3. Escudos absorveram 0 contra 15,6; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 6 só guerreiro venceu; diferença de vitória -75 p.p. e de HP final -72,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -75 para -12,5 p.p.; contraste de -62,5 p.p. e alteração de -64,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: guerreiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × mago:** 7/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 109,5% do DPS efetivo de mago. Por encontro, recebeu 178,4 contra 138,5 HP de dano; recuperou 80 contra 71,3 HP (80 contra 71,3 de poções), gastando 22 contra 19 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 95 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 7 só mago venceu; diferença de vitória -87,5 p.p. e de HP final -27,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -87,5 para 0 p.p.; contraste de -87,5 p.p. e alteração de -27,6 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: mago venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × arqueiro:** 7/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 93,1% do DPS efetivo de arqueiro. Por encontro, recebeu 178,4 contra 95,8 HP de dano; recuperou 80 contra 47,5 HP (80 contra 47,5 de poções), gastando 22 contra 20 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 95 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 7 só arqueiro venceu; diferença de vitória -87,5 p.p. e de HP final -47,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -87,5 para -50 p.p.; contraste de -37,5 p.p. e alteração de -38,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: arqueiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × necromante:** 7/8 mortes contra 4/8; 0 contra 0 limites de tempo. aventureiro manteve 126,1% do DPS efetivo de necromante. Por encontro, recebeu 178,4 contra 112,9 HP de dano; recuperou 80 contra 49,5 HP (80 contra 45 de poções), gastando 22 contra 24,9 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 90 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 263,4 de dano e receberam 0 contra 76. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 3 só necromante venceu; diferença de vitória -37,5 p.p. e de HP final -28,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Defesa plana zerada**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -37,5 para -62,5 p.p.; contraste de 25 p.p. e alteração de 13,6 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × mago:** 1/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 102,8% do DPS efetivo de mago. Por encontro, recebeu 145,3 contra 138,5 HP de dano; recuperou 137,9 contra 71,3 HP (69,4 contra 71,3 de poções), gastando 25,6 contra 19 mana total e 16,5 contra 0 HP em conjurações. Começou com 93 contra 95 HP e defesa 3 contra 1. Escudos absorveram 15,6 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 1 só mago venceu; diferença de vitória -12,5 p.p. e de HP final 45,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para -50 p.p.; contraste de 37,5 p.p. e alteração de 33,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: mago venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × arqueiro:** 1/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 87,4% do DPS efetivo de arqueiro. Por encontro, recebeu 145,3 contra 95,8 HP de dano; recuperou 137,9 contra 47,5 HP (69,4 contra 47,5 de poções), gastando 25,6 contra 20 mana total e 16,5 contra 0 HP em conjurações. Começou com 93 contra 95 HP e defesa 3 contra 2. Escudos absorveram 15,6 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 1 só arqueiro venceu; diferença de vitória -12,5 p.p. e de HP final 25,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para -50 p.p.; contraste de 37,5 p.p. e alteração de 33,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: arqueiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × necromante:** 1/8 mortes contra 4/8; 0 contra 0 limites de tempo. guerreiro manteve 118,3% do DPS efetivo de necromante. Por encontro, recebeu 145,3 contra 112,9 HP de dano; recuperou 137,9 contra 49,5 HP (69,4 contra 45 de poções), gastando 25,6 contra 24,9 mana total e 16,5 contra 0 HP em conjurações. Começou com 93 contra 90 HP e defesa 3 contra 1. Escudos absorveram 15,6 contra 0; invocações causaram 0 contra 263,4 de dano e receberam 0 contra 76. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 3 sementes só guerreiro venceu, 0 só necromante venceu; diferença de vitória 37,5 p.p. e de HP final 44,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 37,5 para -12,5 p.p.; contraste de 50 p.p. e alteração de 48,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: guerreiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 85% do DPS efetivo de arqueiro. Por encontro, recebeu 138,5 contra 95,8 HP de dano; recuperou 71,3 contra 47,5 HP (71,3 contra 47,5 de poções), gastando 19 contra 20 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 95 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final -20 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -50 p.p.; contraste de 50 p.p. e alteração de -10,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × necromante:** 0/8 mortes contra 4/8; 0 contra 0 limites de tempo. mago manteve 115,1% do DPS efetivo de necromante. Por encontro, recebeu 138,5 contra 112,9 HP de dano; recuperou 71,3 contra 49,5 HP (71,3 contra 45 de poções), gastando 19 contra 24,9 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 90 HP e defesa 1 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 263,4 de dano e receberam 0 contra 76. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 4 sementes só mago venceu, 0 só necromante venceu; diferença de vitória 50 p.p. e de HP final -0,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 50 para -25 p.p.; contraste de 75 p.p. e alteração de 11,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: mago venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**arqueiro × necromante:** 0/8 mortes contra 4/8; 0 contra 0 limites de tempo. arqueiro manteve 135,4% do DPS efetivo de necromante. Por encontro, recebeu 95,8 contra 112,9 HP de dano; recuperou 47,5 contra 49,5 HP (47,5 contra 45 de poções), gastando 20 contra 24,9 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 90 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 263,4 de dano e receberam 0 contra 76. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 4 sementes só arqueiro venceu, 0 só necromante venceu; diferença de vitória 50 p.p. e de HP final 19,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 50 para 25 p.p.; contraste de 25 p.p. e alteração de 22,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: arqueiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

### O que mudou ao retirar cada fator

**aventureiro, Sem poções de vida:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 1,6 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**aventureiro, Sem habilidades da barra:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 1,6 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**aventureiro, Defesa plana zerada:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 1,6 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Sem cura do básico:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 33,1 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Sem poções de vida:** retirar esse fator perdeu 6 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 66,1 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Sem habilidades da barra:** retirar esse fator perdeu 2 vitórias e ganhou 1 nas mesmas 8 condições iniciais. O kit completo teve -0,7 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Defesa plana zerada:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 25,8 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem poções de vida:** retirar esse fator perdeu 8 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 29,2 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem habilidades da barra:** retirar esse fator perdeu 4 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 10 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Defesa plana zerada:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 2 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem poções de vida:** retirar esse fator perdeu 4 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 39,9 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem habilidades da barra:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 9,7 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem poções de vida:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 17,4 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem habilidades da barra:** retirar esse fator perdeu 2 vitórias e ganhou 1 nas mesmas 8 condições iniciais. O kit completo teve 10 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 0/8; 8; 0 | 12,5 | 1,6 | 15,2 (102,7% do completo) | 1 / 0 |
| aventureiro | Sem habilidades da barra | 0/8; 8; 0 | 12,5 | 1,6 | 12,3 (83,3% do completo) | 1 / 0 |
| aventureiro | Defesa plana zerada | 0/8; 8; 0 | 12,5 | 1,6 | 14,3 (96,5% do completo) | 1 / 0 |
| guerreiro | Sem cura do básico | 4/8; 4; 0 | 37,5 | 33,1 | 13,5 (97,1% do completo) | 3 / 0 |
| guerreiro | Sem poções de vida | 1/8; 7; 0 | 75 | 66,1 | 14,1 (101,5% do completo) | 6 / 0 |
| guerreiro | Sem habilidades da barra | 6/8; 2; 0 | 12,5 | -0,7 | 12,1 (87,1% do completo) | 2 / 1 |
| guerreiro | Defesa plana zerada | 5/8; 3; 0 | 25 | 25,8 | 13,9 (99,8% do completo) | 2 / 0 |
| mago | Sem poções de vida | 0/8; 8; 0 | 100 | 29,2 | 13,8 (102% do completo) | 8 / 0 |
| mago | Sem habilidades da barra | 4/8; 4; 0 | 50 | 10 | 12 (88,8% do completo) | 4 / 0 |
| mago | Defesa plana zerada | 7/8; 1; 0 | 12,5 | 2 | 13,5 (100% do completo) | 1 / 0 |
| arqueiro | Sem poções de vida | 4/8; 4; 0 | 50 | 39,9 | 15,9 (99,8% do completo) | 4 / 0 |
| arqueiro | Sem habilidades da barra | 7/8; 1; 0 | 12,5 | 9,7 | 13,6 (85,4% do completo) | 1 / 0 |
| arqueiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 0,3 | 15,9 (100% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 2/8; 6; 0 | 25 | 17,4 | 12 (102,5% do completo) | 2 / 0 |
| necromante | Sem habilidades da barra | 3/8; 5; 0 | 12,5 | 10 | 10,3 (87,5% do completo) | 2 / 1 |
| necromante | Defesa plana zerada | 5/8; 3; 0 | -12,5 | -11,9 | 12 (102,4% do completo) | 0 / 1 |

## nível 1 · pesadelo · duelo

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 10,8 s | — | 1 | 120 | 59,9 | 20 | 14,5 | 0 |
| guerreiro | 15,8 s | 10 s | 0,9 | 116,4 | 87,5 | 66,6 | 16 | 9 |
| mago | 15,8 s | — | 1 | 120 | 100,6 | 47,5 | 10 | 0 |
| arqueiro | 13,4 s | — | 1 | 120 | 33,9 | 9,5 | 10 | 0 |
| necromante | 12,5 s | — | 1 | 120 | 33,8 | 4,5 | 11,4 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 0 / 0 / 20 / 0 | 120 / 0 / 0 | 0 | 0 | 6,9 / 2,9 / 0 / 0 / 2,4 | 1,8 |
| guerreiro | 0 / 29,6 / 37 / 0 | 116,4 / 0 / 0 | 15,8 | 0 | 8,1 / 0,7 / 0 / 0 / 0,5 | 0,1 |
| mago | 0 / 0 / 47,5 / 0 | 114,8 / 5,3 / 0 | 0 | 0 | 8,5 / 1 / 0 / 0 / 0 | 2,1 |
| arqueiro | 0 / 0 / 9,5 / 0 | 116,3 / 3,8 / 0 | 0 | 0 | 6,1 / 1 / 0 / 0 / 3,9 | 2,3 |
| necromante | 0 / 0 / 4,5 / 0 | 47 / 0 / 73 | 0 | 0 | 4,8 / 1,4 / 0 / 0 / 0,4 | 2,4 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 12,4 / 1,3 | 11 / 1,4 / 4,4 | 0 / 0 | — | 0 / 5,5 |
| guerreiro | 18,3 / 1,9 | 9,4 / 1,3 / 4 | 0 / 0 | — | 0 / 7,3 |
| mago | 13,3 / 1 | 11,4 / 3 / 3,8 | 0,1 / 0 | — | 0 / 7,5 |
| arqueiro | 10,9 / 0 | 9,9 / 1,5 / 4,5 | 0 / 0 | — | 0 / 6 |
| necromante | 11,1 / 0 | 16,1 / 2,8 / 6,9 | 0,8 / 0 | — | 0 / 6,1 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 4,3 | 40,8 | 0 | 8,5 | 0 | — |
| aventureiro | explosao | 1 | 15,4 | 0 | 3 | 0 | — |
| aventureiro | golpe_atordoante | 1 | 10,5 | 0 | 3 | 0 | — |
| aventureiro | ataque_basico | 6,1 | 53,4 | 0 | 0 | 0 | — |
| aventureiro | item:pocao_vida | 0,5 | 0 | 20 | 0 | 0 | — |
| guerreiro | investida | 2,9 | 12,1 | 0 | 8,6 | 0 | — |
| guerreiro | redemoinho | 3 | 0 | 0 | 0 | 9 | — |
| guerreiro | grito_de_guerra | 1 | 0 | 0 | 4 | 0 | — |
| guerreiro | ataque_basico | 10,3 | 104,3 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 29,6 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 1,1 | 0 | 0 | 3,4 | 0 | — |
| guerreiro | item:pocao_vida | 1 | 0 | 37 | 0 | 0 | — |
| mago | bola_de_fogo | 1 | 14,3 | 0 | 3 | 0 | — |
| mago | dardo_arcano | 10,3 | 85,1 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 1 | 2,6 | 0 | 3 | 0 | — |
| mago | raio_em_cadeia | 1 | 12,8 | 0 | 4 | 0 | — |
| mago | efeito:queimando | 0 | 5,3 | 0 | 0 | 0 | — |
| mago | item:pocao_vida | 1,3 | 0 | 47,5 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 1 | 0 | 0 | 3 | 0 | — |
| arqueiro | chuva_de_flechas | 1 | 10,9 | 0 | 4 | 0 | — |
| arqueiro | flecha_venenosa | 1 | 10,1 | 0 | 3 | 0 | — |
| arqueiro | tiro | 7,9 | 95,3 | 0 | 0 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 3,8 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 0,3 | 0 | 9,5 | 0 | 0 | — |
| necromante | dardo_funesto | 2 | 8,5 | 0 | 4 | 0 | — |
| necromante | garras_do_ossuario | 1 | 5,5 | 0 | 3 | 0 | — |
| necromante | comando_sepulcral | 1 | 0 | 0 | 4 | 0 | — |
| necromante | toque_funesto | 7 | 33 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 73 | 0 | 0 | 0 | — |
| necromante | item:pocao_vida | 0,1 | 0 | 4,5 | 0 | 0 | — |
| necromante | dizimo_vital | 0,1 | 0 | 0 | 0,4 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 0/8 mortes contra 1/8; 0 contra 0 limites de tempo. aventureiro manteve 146,5% do DPS efetivo de guerreiro. Por encontro, recebeu 59,9 contra 87,5 HP de dano; recuperou 20 contra 66,6 HP (20 contra 37 de poções), gastando 14,5 contra 16 mana total e 0 contra 9 HP em conjurações. Começou com 100 contra 93 HP e defesa 2 contra 3. Escudos absorveram 0 contra 15,8; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 12,5 p.p. e de HP final -7,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para 0 p.p.; contraste de 12,5 p.p. e alteração de 39 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 142,6% do DPS efetivo de mago. Por encontro, recebeu 59,9 contra 100,6 HP de dano; recuperou 20 contra 47,5 HP (20 contra 47,5 de poções), gastando 14,5 contra 10 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 95 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 16 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 12,5 p.p.; contraste de -12,5 p.p. e alteração de -15,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 116,8% do DPS efetivo de arqueiro. Por encontro, recebeu 59,9 contra 33,9 HP de dano; recuperou 20 contra 9,5 HP (20 contra 9,5 de poções), gastando 14,5 contra 10 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 95 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final -14,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -25 p.p.; contraste de 25 p.p. e alteração de 5,6 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 112,4% do DPS efetivo de necromante. Por encontro, recebeu 59,9 contra 33,8 HP de dano; recuperou 20 contra 4,5 HP (20 contra 4,5 de poções), gastando 14,5 contra 11,4 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 90 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 73 de dano e receberam 0 contra 15,4. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -7,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -25 p.p.; contraste de 25 p.p. e alteração de 10,6 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × mago:** 1/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 97,3% do DPS efetivo de mago. Por encontro, recebeu 87,5 contra 100,6 HP de dano; recuperou 66,6 contra 47,5 HP (37 contra 47,5 de poções), gastando 16 contra 10 mana total e 9 contra 0 HP em conjurações. Começou com 93 contra 95 HP e defesa 3 contra 1. Escudos absorveram 15,8 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 1 só mago venceu; diferença de vitória -12,5 p.p. e de HP final 23,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Defesa plana zerada**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para 12,5 p.p.; contraste de -25 p.p. e alteração de -11,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: mago venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × arqueiro:** 1/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 79,7% do DPS efetivo de arqueiro. Por encontro, recebeu 87,5 contra 33,9 HP de dano; recuperou 66,6 contra 9,5 HP (37 contra 9,5 de poções), gastando 16 contra 10 mana total e 9 contra 0 HP em conjurações. Começou com 93 contra 95 HP e defesa 3 contra 2. Escudos absorveram 15,8 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 1 só arqueiro venceu; diferença de vitória -12,5 p.p. e de HP final -6,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para -37,5 p.p.; contraste de 25 p.p. e alteração de 21,6 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: arqueiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × necromante:** 1/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 76,8% do DPS efetivo de necromante. Por encontro, recebeu 87,5 contra 33,8 HP de dano; recuperou 66,6 contra 4,5 HP (37 contra 4,5 de poções), gastando 16 contra 11,4 mana total e 9 contra 0 HP em conjurações. Começou com 93 contra 90 HP e defesa 3 contra 1. Escudos absorveram 15,8 contra 0; invocações causaram 0 contra 73 de dano e receberam 0 contra 15,4. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 1 só necromante venceu; diferença de vitória -12,5 p.p. e de HP final 0,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para 12,5 p.p.; contraste de -25 p.p. e alteração de -41,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 81,9% do DPS efetivo de arqueiro. Por encontro, recebeu 100,6 contra 33,9 HP de dano; recuperou 47,5 contra 9,5 HP (47,5 contra 9,5 de poções), gastando 10 contra 10 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 95 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final -30,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -37,5 p.p.; contraste de 37,5 p.p. e alteração de 21,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 78,9% do DPS efetivo de necromante. Por encontro, recebeu 100,6 contra 33,8 HP de dano; recuperou 47,5 contra 4,5 HP (47,5 contra 4,5 de poções), gastando 10 contra 11,4 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 90 HP e defesa 1 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 73 de dano e receberam 0 contra 15,4. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -23,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -37,5 p.p.; contraste de 37,5 p.p. e alteração de 26,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**arqueiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. arqueiro manteve 96,3% do DPS efetivo de necromante. Por encontro, recebeu 33,9 contra 33,8 HP de dano; recuperou 9,5 contra 4,5 HP (9,5 contra 4,5 de poções), gastando 10 contra 11,4 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 90 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 73 de dano e receberam 0 contra 15,4. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final 6,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 12,5 p.p.; contraste de -12,5 p.p. e alteração de 0,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### O que mudou ao retirar cada fator

**aventureiro, Sem poções de vida:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 15,6 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Sem poções de vida:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 31,6 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem poções de vida:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 31,3 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Defesa plana zerada:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 5,3 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem habilidades da barra:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 12,6 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 6/8; 2; 0 | 25 | 15,6 | 10,8 (101,9% do completo) | 2 / 0 |
| aventureiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | 10,4 | 7 (66% do completo) | 0 / 0 |
| aventureiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 2,5 | 10,6 (100% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 8/8; 0; 0 | -12,5 | -8,2 | 7,2 (98,8% do completo) | 0 / 1 |
| guerreiro | Sem poções de vida | 5/8; 3; 0 | 25 | 31,6 | 7,3 (100,9% do completo) | 2 / 0 |
| guerreiro | Sem habilidades da barra | 8/8; 0; 0 | -12,5 | -28,6 | 7,2 (98,7% do completo) | 0 / 1 |
| guerreiro | Defesa plana zerada | 8/8; 0; 0 | -12,5 | -6 | 7,2 (99,2% do completo) | 0 / 1 |
| mago | Sem poções de vida | 5/8; 3; 0 | 37,5 | 31,3 | 7 (93,9% do completo) | 3 / 0 |
| mago | Sem habilidades da barra | 8/8; 0; 0 | 0 | -9,3 | 8,1 (108,6% do completo) | 0 / 0 |
| mago | Defesa plana zerada | 7/8; 1; 0 | 12,5 | 5,3 | 7,4 (98,9% do completo) | 1 / 0 |
| arqueiro | Sem poções de vida | 8/8; 0; 0 | 0 | 10 | 9,1 (100% do completo) | 0 / 0 |
| arqueiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | 13,3 | 7,8 (85,4% do completo) | 0 / 0 |
| arqueiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 4,7 | 9,1 (100% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 8/8; 0; 0 | 0 | 5 | 9,5 (100% do completo) | 0 / 0 |
| necromante | Sem habilidades da barra | 7/8; 1; 0 | 12,5 | 12,6 | 6,8 (71,9% do completo) | 1 / 0 |
| necromante | Defesa plana zerada | 8/8; 0; 0 | 0 | 1,9 | 9,5 (100% do completo) | 0 / 0 |

## nível 1 · pesadelo · pressao

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | — | 15,9 s | 0 | 167,1 | 180 | 80 | 16 | 0 |
| guerreiro | — | 17,3 s | 0 | 148,6 | 184,3 | 100,6 | 15,4 | 9,4 |
| mago | — | 15,1 s | 0 | 198,3 | 161,5 | 66,5 | 13,6 | 0 |
| arqueiro | — | 18,4 s | 0 | 190,1 | 171 | 76 | 14,3 | 0 |
| necromante | 26,9 s | 21,2 s | 0,1 | 179,6 | 156,4 | 69,8 | 15,1 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 0 / 0 / 80 / 0 | 167,1 / 0 / 0 | 0 | 0 | 8,3 / 2,8 / 0 / 2 / 4,9 | 1,5 |
| guerreiro | 0 / 26,6 / 74 / 0 | 145,4 / 3,3 / 0 | 14 | 0 | 8,1 / 1,2 / 0 / 2,6 / 0,8 | 0,3 |
| mago | 0 / 0 / 66,5 / 0 | 191,8 / 6,5 / 0 | 0 | 0 | 8,8 / 1,1 / 0 / 1,7 / 0,2 | 2,3 |
| arqueiro | 0 / 0 / 76 / 0 | 190,1 / 0 / 0 | 0 | 0 | 8,6 / 1,2 / 0 / 2,4 / 5,6 | 2,2 |
| necromante | 0 / 6,8 / 63 / 0 | 69,4 / 0 / 110,3 | 0 | 6,8 | 7,5 / 2,1 / 0 / 3,5 / 0,9 | 2,3 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 15,5 / 1,9 | 13,5 / 1,3 / 5,9 | 0 / 0 | — | 0 / 7,5 |
| guerreiro | 18 / 1,4 | 10,6 / 1,3 / 4,9 | 0 / 0 | — | 0 / 7,5 |
| mago | 13,8 / 1,6 | 20,9 / 2,4 / 8,9 | 1,1 / 0 | — | 0 / 7,4 |
| arqueiro | 15,6 / 0,1 | 14,9 / 1,6 / 6,9 | 0 / 0 | — | 0 / 8,9 |
| necromante | 17,5 / 0,1 | 26,8 / 4,1 / 11,4 | 0,9 / 0 | — | 0,8 / 11 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 5 | 61,4 | 0 | 10 | 0 | — |
| aventureiro | explosao | 1 | 15,4 | 0 | 3 | 0 | — |
| aventureiro | golpe_atordoante | 1 | 10,5 | 0 | 3 | 0 | — |
| aventureiro | ataque_basico | 8,5 | 79,9 | 0 | 0 | 0 | — |
| aventureiro | item:pocao_vida | 2 | 0 | 80 | 0 | 0 | — |
| guerreiro | investida | 2,6 | 20,9 | 0 | 7,9 | 0 | — |
| guerreiro | redemoinho | 3,1 | 1,8 | 0 | 0 | 9,4 | — |
| guerreiro | grito_de_guerra | 1,1 | 0 | 0 | 4,5 | 0 | — |
| guerreiro | ataque_basico | 10,1 | 122,8 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 26,6 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 1 | 0 | 0 | 3 | 0 | — |
| guerreiro | efeito:dano_direto | 0 | 3,3 | 0 | 0 | 0 | — |
| guerreiro | item:pocao_vida | 2 | 0 | 74 | 0 | 0 | — |
| mago | bola_de_fogo | 1,6 | 18,5 | 0 | 4,9 | 0 | — |
| mago | dardo_arcano | 9,6 | 115,4 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 1,3 | 17,5 | 0 | 3,8 | 0 | — |
| mago | raio_em_cadeia | 1,3 | 40,4 | 0 | 5 | 0 | — |
| mago | item:pocao_vida | 1,8 | 0 | 66,5 | 0 | 0 | — |
| mago | efeito:queimando | 0 | 6,5 | 0 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 2,3 | 21 | 0 | 6,8 | 0 | — |
| arqueiro | chuva_de_flechas | 1,1 | 12,5 | 0 | 4,5 | 0 | — |
| arqueiro | flecha_venenosa | 1 | 1 | 0 | 3 | 0 | — |
| arqueiro | tiro | 11,3 | 155,6 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 2 | 0 | 76 | 0 | 0 | — |
| necromante | dardo_funesto | 2,5 | 10,9 | 0 | 5 | 0 | — |
| necromante | garras_do_ossuario | 1,1 | 6,5 | 0 | 3,4 | 0 | — |
| necromante | comando_sepulcral | 1,1 | 0 | 0 | 4,5 | 0 | — |
| necromante | toque_funesto | 12 | 52 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 110,3 | 0 | 0 | 0 | — |
| necromante | efeito:cura | 0 | 0 | 6,8 | 0 | 0 | — |
| necromante | item:pocao_vida | 1,8 | 0 | 63 | 0 | 0 | — |
| necromante | dizimo_vital | 0,8 | 0 | 0 | 2,3 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 119,6% do DPS efetivo de guerreiro. Por encontro, recebeu 180 contra 184,3 HP de dano; recuperou 80 contra 100,6 HP (80 contra 74 de poções), gastando 16 contra 15,4 mana total e 0 contra 9,4 HP em conjurações. Começou com 100 contra 93 HP e defesa 2 contra 3. Escudos absorveram 0 contra 14; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -25 p.p.; contraste de 25 p.p. e alteração de 19,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × mago:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 86,1% do DPS efetivo de mago. Por encontro, recebeu 180 contra 161,5 HP de dano; recuperou 80 contra 66,5 HP (80 contra 66,5 de poções), gastando 16 contra 13,6 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 95 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 109,3% do DPS efetivo de arqueiro. Por encontro, recebeu 180 contra 171 HP de dano; recuperou 80 contra 76 HP (80 contra 76 de poções), gastando 16 contra 14,3 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 95 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 8/8 mortes contra 7/8; 0 contra 0 limites de tempo. aventureiro manteve 130,3% do DPS efetivo de necromante. Por encontro, recebeu 180 contra 156,4 HP de dano; recuperou 80 contra 69,8 HP (80 contra 63 de poções), gastando 16 contra 15,1 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 90 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 110,3 de dano e receberam 0 contra 52,9. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 1 só necromante venceu; diferença de vitória -12,5 p.p. e de HP final -4,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para 0 p.p.; contraste de -12,5 p.p. e alteração de -4,6 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × mago:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 72% do DPS efetivo de mago. Por encontro, recebeu 184,3 contra 161,5 HP de dano; recuperou 100,6 contra 66,5 HP (74 contra 66,5 de poções), gastando 15,4 contra 13,6 mana total e 9,4 contra 0 HP em conjurações. Começou com 93 contra 95 HP e defesa 3 contra 1. Escudos absorveram 14 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 25 p.p.; contraste de -25 p.p. e alteração de -19,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 91,4% do DPS efetivo de arqueiro. Por encontro, recebeu 184,3 contra 171 HP de dano; recuperou 100,6 contra 76 HP (74 contra 76 de poções), gastando 15,4 contra 14,3 mana total e 9,4 contra 0 HP em conjurações. Começou com 93 contra 95 HP e defesa 3 contra 2. Escudos absorveram 14 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 25 p.p.; contraste de -25 p.p. e alteração de -19,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × necromante:** 8/8 mortes contra 7/8; 0 contra 0 limites de tempo. guerreiro manteve 108,9% do DPS efetivo de necromante. Por encontro, recebeu 184,3 contra 156,4 HP de dano; recuperou 100,6 contra 69,8 HP (74 contra 63 de poções), gastando 15,4 contra 15,1 mana total e 9,4 contra 0 HP em conjurações. Começou com 93 contra 90 HP e defesa 3 contra 1. Escudos absorveram 14 contra 0; invocações causaram 0 contra 110,3 de dano e receberam 0 contra 52,9. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 1 só necromante venceu; diferença de vitória -12,5 p.p. e de HP final -4,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para 12,5 p.p.; contraste de -25 p.p. e alteração de -19,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. mago manteve 126,9% do DPS efetivo de arqueiro. Por encontro, recebeu 161,5 contra 171 HP de dano; recuperou 66,5 contra 76 HP (66,5 contra 76 de poções), gastando 13,6 contra 14,3 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 95 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × necromante:** 8/8 mortes contra 7/8; 0 contra 0 limites de tempo. mago manteve 151,2% do DPS efetivo de necromante. Por encontro, recebeu 161,5 contra 156,4 HP de dano; recuperou 66,5 contra 69,8 HP (66,5 contra 63 de poções), gastando 13,6 contra 15,1 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 90 HP e defesa 1 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 110,3 de dano e receberam 0 contra 52,9. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 1 só necromante venceu; diferença de vitória -12,5 p.p. e de HP final -4,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para 0 p.p.; contraste de -12,5 p.p. e alteração de -4,6 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**arqueiro × necromante:** 8/8 mortes contra 7/8; 0 contra 0 limites de tempo. arqueiro manteve 119,1% do DPS efetivo de necromante. Por encontro, recebeu 171 contra 156,4 HP de dano; recuperou 76 contra 69,8 HP (76 contra 63 de poções), gastando 14,3 contra 15,1 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 90 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 110,3 de dano e receberam 0 contra 52,9. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 1 só necromante venceu; diferença de vitória -12,5 p.p. e de HP final -4,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para 0 p.p.; contraste de -12,5 p.p. e alteração de -4,6 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### O que mudou ao retirar cada fator

**necromante, Sem poções de vida:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 4,6 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem habilidades da barra:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 4,6 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 12,1 (110,2% do completo) | 0 / 0 |
| aventureiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 7,8 (71,2% do completo) | 0 / 0 |
| aventureiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 11,7 (106,7% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 2/8; 6; 0 | -25 | -19,2 | 9,1 (98,4% do completo) | 0 / 2 |
| guerreiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 10,1 (110% do completo) | 0 / 0 |
| guerreiro | Sem habilidades da barra | 1/8; 7; 0 | -12,5 | -7,9 | 8,1 (87,9% do completo) | 0 / 1 |
| guerreiro | Defesa plana zerada | 1/8; 7; 0 | -12,5 | -12,5 | 9,8 (106,1% do completo) | 0 / 1 |
| mago | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 13,6 (106,7% do completo) | 0 / 0 |
| mago | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 6,8 (53,1% do completo) | 0 / 0 |
| mago | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 12,7 (99,5% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 10 (99,8% do completo) | 0 / 0 |
| arqueiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 8,5 (84,6% do completo) | 0 / 0 |
| arqueiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 10,3 (102,4% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 0/8; 8; 0 | 12,5 | 4,6 | 8,6 (101,3% do completo) | 1 / 0 |
| necromante | Sem habilidades da barra | 0/8; 8; 0 | 12,5 | 4,6 | 5,9 (70,1% do completo) | 1 / 0 |
| necromante | Defesa plana zerada | 1/8; 7; 0 | 0 | 1,2 | 8,7 (102,4% do completo) | 0 / 0 |

## nível 1 · pesadelo · atrito

### Onde o desgaste aparece

| Classe | Onda | Chegaram/n inicial | Mortes / limites nesta onda | HP entrada → saída | Mana entrada → saída | Recebido / cura / mana gasta |
|---|---|---|---|---|---|---|
| aventureiro | 1 | 8/8 | 0 / 0 | 100 → 58,4 | 10 → 1 | 46,6 / 5 / 13 |
| aventureiro | 2 | 8/8 | 2 / 0 | 58,4 → 35 | 1 → 0,7 | 87,3 / 61,3 / 8,1 |
| aventureiro | 3 | 6/8 | 2 / 0 | 46,7 → 17,5 | 0,6 → 0,7 | 54,5 / 22,2 / 6,7 |
| aventureiro | 4 | 4/8 | 4 / 0 | 26,3 → 0 | 0,4 → 0,5 | 31 / 2 / 3 |
| guerreiro | 1 | 8/8 | 0 / 0 | 93 → 69,9 | 10 → 1,6 | 76,4 / 60 / 13,4 |
| guerreiro | 2 | 8/8 | 3 / 0 | 69,9 → 43,8 | 1,6 → 1,6 | 100,9 / 78,9 / 10,9 |
| guerreiro | 3 | 5/8 | 2 / 0 | 70 → 47 | 1,6 → 1,6 | 48,4 / 26,4 / 7,2 |
| guerreiro | 4 | 3/8 | 3 / 0 | 78,3 → 0 | 1 → 1,3 | 80,7 / 7 / 7,3 |
| mago | 1 | 8/8 | 0 / 0 | 95 → 49,3 | 12 → 7,9 | 79 / 33,3 / 10 |
| mago | 2 | 8/8 | 2 / 0 | 49,3 → 10,9 | 7,9 → 8,3 | 81,1 / 42,8 / 6 |
| mago | 3 | 6/8 | 6 / 0 | 14,5 → 0 | 8,5 → 2 | 14,5 / 0 / 8,2 |
| arqueiro | 1 | 8/8 | 0 / 0 | 95 → 74,8 | 10 → 4,3 | 34,5 / 14,3 / 10 |
| arqueiro | 2 | 8/8 | 1 / 0 | 74,8 → 45,9 | 4,3 → 6,1 | 62,1 / 33,3 / 4,1 |
| arqueiro | 3 | 7/8 | 3 / 0 | 52,4 → 21,4 | 6,4 → 1 | 58,1 / 27,1 / 9,1 |
| arqueiro | 4 | 4/8 | 3 / 0 | 37,5 → 4,8 | 1 → 3,8 | 43,3 / 9,5 / 3 |
| arqueiro | 5 | 1/8 | 1 / 0 | 19 → 0 | 5,5 → 4,5 | 19 / 0 / 3 |
| necromante | 1 | 8/8 | 0 / 0 | 90 → 64,3 | 12 → 5,5 | 34,8 / 9 / 10,8 |
| necromante | 2 | 8/8 | 0 / 0 | 64,3 → 50,1 | 5,5 → 6,4 | 30,4 / 15,8 / 6,1 |
| necromante | 3 | 8/8 | 0 / 0 | 50,1 → 66 | 6,4 → 2,6 | 7,1 / 4,5 / 22,6 |
| necromante | 4 | 8/8 | 0 / 0 | 66 → 61,6 | 2,6 → 4,3 | 14,3 / 6,8 / 7,4 |
| necromante | 5 | 8/8 | 0 / 0 | 61,6 → 50,3 | 4,3 → 6,1 | 20,6 / 9 / 3,8 |

Médias de cada onda incluem apenas quem chegou a ela; o denominador inicial mostra a seleção dos sobreviventes. Não compare a vida da onda 5 como se incluísse quem morreu antes.

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | — | 33,6 s | 2,3 | 285,1 | 190,3 | 83,9 | 27,6 | 0 |
| guerreiro | — | 40,3 s | 2 | 284,9 | 237,8 | 158 | 31,5 | 19,9 |
| mago | — | 25,8 s | 1,8 | 218,1 | 171 | 76 | 22,1 | 0 |
| arqueiro | — | 35,5 s | 2,5 | 335,1 | 171,5 | 76 | 24 | 0 |
| necromante | 66,2 s | — | 5 | 534 | 107,1 | 45 | 50,6 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 3,9 / 0 / 80 / 0 | 285,1 / 0 / 0 | 0 | 0 | 15,5 / 11,8 / 0 / 4,4 / 12,6 | 1,4 |
| guerreiro | 0 / 84 / 74 / 0 | 282,9 / 2 / 0 | 31,5 | 0 | 17,6 / 8 / 0 / 6,5 / 6,7 | 0,6 |
| mago | 0 / 0 / 76 / 0 | 206,4 / 11,8 / 0 | 3,3 | 0 | 14,9 / 1 / 0 / 5,3 / 1,9 | 2,2 |
| arqueiro | 0 / 0 / 76 / 0 | 331,4 / 3,8 / 0 | 0 | 0 | 15,5 / 2,2 / 0 / 4,1 / 13,3 | 2,4 |
| necromante | 0 / 9 / 36 / 0 | 174,5 / 0 / 359,5 | 0 | 9 | 22,5 / 18,5 / 0 / 1,1 / 9,1 | 3,1 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 29,1 / 3,5 | 23,6 / 3,4 / 10 | 0 / 0 | — | 6,4 / 18,4 |
| guerreiro | 41,5 / 5,9 | 21,4 / 3,4 / 8,1 | 0,1 / 0 | recurso: 3,1 | 6,6 / 23,2 |
| mago | 23,8 / 2,5 | 18,1 / 3,6 / 6,8 | 0,1 / 0 | — | 0 / 13,5 |
| arqueiro | 28,6 / 1,4 | 25,1 / 2,8 / 13,1 | 0 / 0 | — | 0,5 / 16,6 |
| necromante | 53,3 / 2,5 | 82,5 / 15,1 / 32,6 | 1,5 / 0 | — | 22,4 / 44,7 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 9,9 | 111,1 | 0 | 19,8 | 0 | — |
| aventureiro | explosao | 1 | 16,3 | 0 | 3 | 0 | — |
| aventureiro | golpe_atordoante | 1,4 | 15,8 | 0 | 4,1 | 0 | — |
| aventureiro | ataque_basico | 16,5 | 142 | 0 | 0 | 0 | — |
| aventureiro | item:pocao_vida | 2 | 0 | 80 | 0 | 0 | — |
| aventureiro | curar | 0,4 | 0 | 3,9 | 0,8 | 0 | 5,2 |
| guerreiro | investida | 5,3 | 33,8 | 0 | 15,8 | 0 | — |
| guerreiro | redemoinho | 6,6 | 17 | 0 | 0 | 19,9 | — |
| guerreiro | grito_de_guerra | 2,3 | 0 | 0 | 9 | 0 | — |
| guerreiro | ataque_basico | 25,1 | 232,1 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 84 | 0 | 0 | — |
| guerreiro | efeito:dano_direto | 0 | 2 | 0 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 2,3 | 0 | 0 | 6,8 | 0 | — |
| guerreiro | item:pocao_vida | 2 | 0 | 74 | 0 | 0 | — |
| mago | bola_de_fogo | 2,9 | 44,1 | 0 | 8,6 | 0 | — |
| mago | dardo_arcano | 16,8 | 143,9 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 2,8 | 4,5 | 0 | 8,3 | 0 | — |
| mago | raio_em_cadeia | 1,1 | 13,9 | 0 | 4,5 | 0 | — |
| mago | item:pocao_vida | 2 | 0 | 76 | 0 | 0 | — |
| mago | efeito:queimando | 0 | 11,8 | 0 | 0 | 0 | — |
| mago | barreira | 0,3 | 0 | 0 | 0,8 | 0 | — |
| arqueiro | flecha_perfurante | 4,3 | 53,5 | 0 | 12,8 | 0 | — |
| arqueiro | chuva_de_flechas | 1,5 | 19,8 | 0 | 6 | 0 | — |
| arqueiro | flecha_venenosa | 1,8 | 11,5 | 0 | 5,3 | 0 | — |
| arqueiro | tiro | 21,1 | 246,6 | 0 | 0 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 3,8 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 2 | 0 | 76 | 0 | 0 | — |
| necromante | dardo_funesto | 11,4 | 35 | 0 | 22,8 | 0 | — |
| necromante | garras_do_ossuario | 4,3 | 18 | 0 | 12,8 | 0 | — |
| necromante | comando_sepulcral | 2,8 | 0 | 0 | 11 | 0 | — |
| necromante | toque_funesto | 33,5 | 121,5 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 359,5 | 0 | 0 | 0 | — |
| necromante | dizimo_vital | 1,4 | 0 | 0 | 4,1 | 0 | — |
| necromante | efeito:cura | 0 | 0 | 9 | 0 | 0 | — |
| necromante | item:pocao_vida | 1 | 0 | 36 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 131,7% do DPS efetivo de guerreiro. Por encontro, recebeu 190,3 contra 237,8 HP de dano; recuperou 83,9 contra 158 HP (80 contra 74 de poções), gastando 27,6 contra 31,5 mana total e 0 contra 19,9 HP em conjurações. Começou com 100 contra 93 HP e defesa 2 contra 3. Escudos absorveram 0 contra 31,5; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -25 p.p.; contraste de 25 p.p. e alteração de 25 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × mago:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 115,4% do DPS efetivo de mago. Por encontro, recebeu 190,3 contra 171 HP de dano; recuperou 83,9 contra 76 HP (80 contra 76 de poções), gastando 27,6 contra 22,1 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 95 HP e defesa 2 contra 1. Escudos absorveram 0 contra 3,3; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 94,4% do DPS efetivo de arqueiro. Por encontro, recebeu 190,3 contra 171,5 HP de dano; recuperou 83,9 contra 76 HP (80 contra 76 de poções), gastando 27,6 contra 24 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 95 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 8/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 114,7% do DPS efetivo de necromante. Por encontro, recebeu 190,3 contra 107,1 HP de dano; recuperou 83,9 contra 45 HP (80 contra 36 de poções), gastando 27,6 contra 50,6 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 90 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 359,5 de dano e receberam 0 contra 177,6. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 8 só necromante venceu; diferença de vitória -100 p.p. e de HP final -55,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -100 para -25 p.p.; contraste de -75 p.p. e alteração de -37,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × mago:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 87,6% do DPS efetivo de mago. Por encontro, recebeu 237,8 contra 171 HP de dano; recuperou 158 contra 76 HP (74 contra 76 de poções), gastando 31,5 contra 22,1 mana total e 19,9 contra 0 HP em conjurações. Começou com 93 contra 95 HP e defesa 3 contra 1. Escudos absorveram 31,5 contra 3,3; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 25 p.p.; contraste de -25 p.p. e alteração de -25 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 71,6% do DPS efetivo de arqueiro. Por encontro, recebeu 237,8 contra 171,5 HP de dano; recuperou 158 contra 76 HP (74 contra 76 de poções), gastando 31,5 contra 24 mana total e 19,9 contra 0 HP em conjurações. Começou com 93 contra 95 HP e defesa 3 contra 2. Escudos absorveram 31,5 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 25 p.p.; contraste de -25 p.p. e alteração de -25 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × necromante:** 8/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 87,1% do DPS efetivo de necromante. Por encontro, recebeu 237,8 contra 107,1 HP de dano; recuperou 158 contra 45 HP (74 contra 36 de poções), gastando 31,5 contra 50,6 mana total e 19,9 contra 0 HP em conjurações. Começou com 93 contra 90 HP e defesa 3 contra 1. Escudos absorveram 31,5 contra 0; invocações causaram 0 contra 359,5 de dano e receberam 0 contra 177,6. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 8 só necromante venceu; diferença de vitória -100 p.p. e de HP final -55,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -100 para 0 p.p.; contraste de -100 p.p. e alteração de -62,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. mago manteve 81,8% do DPS efetivo de arqueiro. Por encontro, recebeu 171 contra 171,5 HP de dano; recuperou 76 contra 76 HP (76 contra 76 de poções), gastando 22,1 contra 24 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 95 HP e defesa 1 contra 2. Escudos absorveram 3,3 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × necromante:** 8/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 99,4% do DPS efetivo de necromante. Por encontro, recebeu 171 contra 107,1 HP de dano; recuperou 76 contra 45 HP (76 contra 36 de poções), gastando 22,1 contra 50,6 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 90 HP e defesa 1 contra 1. Escudos absorveram 3,3 contra 0; invocações causaram 0 contra 359,5 de dano e receberam 0 contra 177,6. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 8 só necromante venceu; diferença de vitória -100 p.p. e de HP final -55,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -100 para -25 p.p.; contraste de -75 p.p. e alteração de -37,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**arqueiro × necromante:** 8/8 mortes contra 0/8; 0 contra 0 limites de tempo. arqueiro manteve 121,6% do DPS efetivo de necromante. Por encontro, recebeu 171,5 contra 107,1 HP de dano; recuperou 76 contra 45 HP (76 contra 36 de poções), gastando 24 contra 50,6 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 90 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 359,5 de dano e receberam 0 contra 177,6. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 8 só necromante venceu; diferença de vitória -100 p.p. e de HP final -55,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -100 para -25 p.p.; contraste de -75 p.p. e alteração de -37,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### O que mudou ao retirar cada fator

**necromante, Sem poções de vida:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 18,8 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem habilidades da barra:** retirar esse fator perdeu 6 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 37,5 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Defesa plana zerada:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve -5,4 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 10,1 (107,3% do completo) | 0 / 0 |
| aventureiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 7,5 (80,3% do completo) | 0 / 0 |
| aventureiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 9,1 (97,4% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 0/8; 8; 0 | 0 | 0 | 7 (98,2% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 7,9 (111,4% do completo) | 0 / 0 |
| guerreiro | Sem habilidades da barra | 2/8; 6; 0 | -25 | -25 | 7,2 (101,8% do completo) | 0 / 2 |
| guerreiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 6,9 (96,3% do completo) | 0 / 0 |
| mago | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 7,6 (93,4% do completo) | 0 / 0 |
| mago | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 7,1 (87,5% do completo) | 0 / 0 |
| mago | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 8 (98,2% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 10,3 (103,9% do completo) | 0 / 0 |
| arqueiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 7,9 (79,4% do completo) | 0 / 0 |
| arqueiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 10 (100,3% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 5/8; 3; 0 | 37,5 | 18,8 | 8,5 (104,2% do completo) | 3 / 0 |
| necromante | Sem habilidades da barra | 2/8; 6; 0 | 75 | 37,5 | 6,9 (83,9% do completo) | 6 / 0 |
| necromante | Defesa plana zerada | 7/8; 1; 0 | 12,5 | -5,4 | 8,5 (103,6% do completo) | 1 / 0 |

## nível 1 · pesadelo · chefe

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | — | 17,8 s | 0 | 132,9 | 160 | 60 | 17,5 | 0 |
| guerreiro | — | 24,6 s | 0 | 197,9 | 164,1 | 83,1 | 20,1 | 12 |
| mago | — | 26,2 s | 0 | 209,1 | 166,3 | 71,3 | 19 | 0 |
| arqueiro | — | 26 s | 0 | 202,6 | 142,5 | 47,5 | 17,3 | 0 |
| necromante | — | 36,8 s | 0 | 211,3 | 153,5 | 63,5 | 23,6 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 0 / 0 / 60 / 0 | 132,9 / 0 / 0 | 0 | 0 | 8,8 / 4,6 / 1,8 / 1,6 / 4,9 | 1,2 |
| guerreiro | 0 / 13,8 / 69,4 / 0 | 195,5 / 2,4 / 0 | 15,8 | 0 | 10,1 / 2,5 / 2,3 / 3 / 2,5 | 0,6 |
| mago | 0 / 0 / 71,3 / 0 | 190,3 / 18,9 / 0 | 0 | 0 | 14,4 / 11,3 / 0,6 / 1,4 / 5,1 | 1,8 |
| arqueiro | 0 / 0 / 47,5 / 0 | 197,6 / 5 / 0 | 0 | 0 | 10,5 / 10,6 / 1,2 / 1,4 / 10,8 | 1,9 |
| necromante | 0 / 0,5 / 63 / 0 | 112,3 / 0 / 99 | 0 | 0,5 | 12,1 / 14,5 / 1,6 / 2,7 / 4,9 | 1,9 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 16,6 / 3,4 | 12,1 / 2,3 / 4 | 0 / 0 | — | 0 / 7,8 |
| guerreiro | 23,5 / 3 | 14,6 / 2,5 / 6 | 0 / 0 | — | 0 / 11,4 |
| mago | 21,8 / 3,1 | 17,1 / 2,9 / 5,9 | 0 / 0 | — | 0 / 12,9 |
| arqueiro | 19,9 / 1,4 | 15,5 / 1,9 / 7,4 | 0 / 0 | — | 0 / 11,9 |
| necromante | 29,3 / 2,9 | 33,4 / 5,4 / 13,6 | 1,5 / 0 | — | 0 / 20 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 5,8 | 43,6 | 0 | 11,5 | 0 | — |
| aventureiro | explosao | 1 | 10,9 | 0 | 3 | 0 | — |
| aventureiro | golpe_atordoante | 1 | 7,4 | 0 | 3 | 0 | — |
| aventureiro | ataque_basico | 8,9 | 71 | 0 | 0 | 0 | — |
| aventureiro | item:pocao_vida | 1,5 | 0 | 60 | 0 | 0 | — |
| guerreiro | investida | 3,3 | 27,4 | 0 | 9,8 | 0 | — |
| guerreiro | redemoinho | 4 | 22,8 | 0 | 0 | 12 | — |
| guerreiro | grito_de_guerra | 1,8 | 0 | 0 | 7 | 0 | — |
| guerreiro | ataque_basico | 13,4 | 145,4 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 13,8 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 1,1 | 0 | 0 | 3,4 | 0 | — |
| guerreiro | item:pocao_vida | 1,9 | 0 | 69,4 | 0 | 0 | — |
| guerreiro | efeito:dano_direto | 0 | 2,4 | 0 | 0 | 0 | — |
| mago | bola_de_fogo | 3 | 20,4 | 0 | 9 | 0 | — |
| mago | dardo_arcano | 15,8 | 148,9 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 2 | 9,3 | 0 | 6 | 0 | — |
| mago | raio_em_cadeia | 1 | 11,8 | 0 | 4 | 0 | — |
| mago | efeito:queimando | 0 | 18,9 | 0 | 0 | 0 | — |
| mago | item:pocao_vida | 1,9 | 0 | 71,3 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 3,3 | 33,1 | 0 | 9,8 | 0 | — |
| arqueiro | chuva_de_flechas | 1,1 | 0 | 0 | 4,5 | 0 | — |
| arqueiro | flecha_venenosa | 1 | 11,5 | 0 | 3 | 0 | — |
| arqueiro | tiro | 14,5 | 153 | 0 | 0 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 5 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 1,3 | 0 | 47,5 | 0 | 0 | — |
| necromante | dardo_funesto | 4,9 | 20,4 | 0 | 9,8 | 0 | — |
| necromante | garras_do_ossuario | 2 | 11 | 0 | 6 | 0 | — |
| necromante | comando_sepulcral | 1,1 | 0 | 0 | 4,5 | 0 | — |
| necromante | dizimo_vital | 1,1 | 0 | 0 | 3,4 | 0 | — |
| necromante | toque_funesto | 20,1 | 80,9 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 99 | 0 | 0 | 0 | — |
| necromante | efeito:cura | 0 | 0 | 0,5 | 0 | 0 | — |
| necromante | item:pocao_vida | 1,8 | 0 | 63 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 94,6% do DPS efetivo de guerreiro. Por encontro, recebeu 160 contra 164,1 HP de dano; recuperou 60 contra 83,1 HP (60 contra 69,4 de poções), gastando 17,5 contra 20,1 mana total e 0 contra 12 HP em conjurações. Começou com 100 contra 93 HP e defesa 2 contra 3. Escudos absorveram 0 contra 15,8; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × mago:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 99,4% do DPS efetivo de mago. Por encontro, recebeu 160 contra 166,3 HP de dano; recuperou 60 contra 71,3 HP (60 contra 71,3 de poções), gastando 17,5 contra 19 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 95 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 98,4% do DPS efetivo de arqueiro. Por encontro, recebeu 160 contra 142,5 HP de dano; recuperou 60 contra 47,5 HP (60 contra 47,5 de poções), gastando 17,5 contra 17,3 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 95 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 140,3% do DPS efetivo de necromante. Por encontro, recebeu 160 contra 153,5 HP de dano; recuperou 60 contra 63,5 HP (60 contra 63 de poções), gastando 17,5 contra 23,6 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 90 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 99 de dano e receberam 0 contra 100,8. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × mago:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 105% do DPS efetivo de mago. Por encontro, recebeu 164,1 contra 166,3 HP de dano; recuperou 83,1 contra 71,3 HP (69,4 contra 71,3 de poções), gastando 20,1 contra 19 mana total e 12 contra 0 HP em conjurações. Começou com 93 contra 95 HP e defesa 3 contra 1. Escudos absorveram 15,8 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 103,9% do DPS efetivo de arqueiro. Por encontro, recebeu 164,1 contra 142,5 HP de dano; recuperou 83,1 contra 47,5 HP (69,4 contra 47,5 de poções), gastando 20,1 contra 17,3 mana total e 12 contra 0 HP em conjurações. Começou com 93 contra 95 HP e defesa 3 contra 2. Escudos absorveram 15,8 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × necromante:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 148,3% do DPS efetivo de necromante. Por encontro, recebeu 164,1 contra 153,5 HP de dano; recuperou 83,1 contra 63,5 HP (69,4 contra 63 de poções), gastando 20,1 contra 23,6 mana total e 12 contra 0 HP em conjurações. Começou com 93 contra 90 HP e defesa 3 contra 1. Escudos absorveram 15,8 contra 0; invocações causaram 0 contra 99 de dano e receberam 0 contra 100,8. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. mago manteve 99% do DPS efetivo de arqueiro. Por encontro, recebeu 166,3 contra 142,5 HP de dano; recuperou 71,3 contra 47,5 HP (71,3 contra 47,5 de poções), gastando 19 contra 17,3 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 95 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × necromante:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. mago manteve 141,2% do DPS efetivo de necromante. Por encontro, recebeu 166,3 contra 153,5 HP de dano; recuperou 71,3 contra 63,5 HP (71,3 contra 63 de poções), gastando 19 contra 23,6 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 90 HP e defesa 1 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 99 de dano e receberam 0 contra 100,8. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**arqueiro × necromante:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. arqueiro manteve 142,6% do DPS efetivo de necromante. Por encontro, recebeu 142,5 contra 153,5 HP de dano; recuperou 47,5 contra 63,5 HP (47,5 contra 63 de poções), gastando 17,3 contra 23,6 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 90 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 99 de dano e receberam 0 contra 100,8. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### O que mudou ao retirar cada fator

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 7,9 (98,6% do completo) | 0 / 0 |
| aventureiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 7,2 (90,1% do completo) | 0 / 0 |
| aventureiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 8,2 (102,3% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 0/8; 8; 0 | 0 | 0 | 8,6 (101,8% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 7,7 (90,6% do completo) | 0 / 0 |
| guerreiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 6,8 (79,8% do completo) | 0 / 0 |
| guerreiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 8,6 (101,6% do completo) | 0 / 0 |
| mago | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 8 (99,1% do completo) | 0 / 0 |
| mago | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 7,3 (90,1% do completo) | 0 / 0 |
| mago | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 8,1 (100% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 8,3 (101,6% do completo) | 0 / 0 |
| arqueiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 8,2 (100% do completo) | 0 / 0 |
| arqueiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 8,1 (99,6% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 5,9 (102,5% do completo) | 0 / 0 |
| necromante | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 5,1 (88,6% do completo) | 0 / 0 |
| necromante | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 5,8 (101,2% do completo) | 0 / 0 |

## nível 10 · normal · duelo

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 3,8 s | — | 1 | 341 | 26,4 | 0 | 10,5 | 0 |
| guerreiro | 8 s | — | 1 | 341 | 63,8 | 46,4 | 10 | 4,5 |
| mago | 4 s | — | 1 | 341 | 32,3 | 0 | 12 | 0 |
| arqueiro | 6,9 s | — | 1 | 341 | 20 | 0 | 10 | 0 |
| necromante | 7,1 s | — | 1 | 341 | 9,8 | 0 | 9,3 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 0 / 0 / 0 / 0 | 341 / 0 / 0 | 0 | 0 | 3,8 / 2,1 / 0 / 0 / 0 | 2,1 |
| guerreiro | 0 / 46,4 / 0 / 0 | 331,4 / 9,6 / 0 | 0 | 0 | 3,9 / 0,7 / 0 / 0 / 0 | 0,3 |
| mago | 0 / 0 / 0 / 0 | 322,6 / 18,4 / 0 | 0 | 0 | 4,3 / 0,6 / 0 / 0 / 0,2 | 2,9 |
| arqueiro | 0 / 0 / 0 / 0 | 335,8 / 5,3 / 0 | 0 | 0 | 4,5 / 0,7 / 0 / 0 / 2,3 | 2,6 |
| necromante | 0 / 0 / 0 / 0 | 201 / 0 / 140 | 0 | 0 | 3,1 / 1 / 0 / 0 / 0 | 2,7 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 5,5 / 0,3 | 5 / 0,9 / 1,6 | 0 / 0 | — | 0,5 / 2,1 |
| guerreiro | 7,9 / 0,5 | 4,4 / 0,5 / 1,8 | 0 / 0 | — | 0 / 2,9 |
| mago | 5,9 / 1 | 4 / 0,9 / 1,1 | 0,1 / 0 | — | 0 / 2,4 |
| arqueiro | 7 / 0 | 6 / 0,8 / 2,9 | 0 / 0 | — | 0 / 2,9 |
| necromante | 8,1 / 0,8 | 9,3 / 1,4 / 4 | 0,8 / 0 | — | 0 / 2,7 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 2,3 | 161,5 | 0 | 4,5 | 0 | — |
| aventureiro | explosao | 1 | 80,3 | 0 | 3 | 0 | — |
| aventureiro | golpe_atordoante | 1 | 70,9 | 0 | 3 | 0 | — |
| aventureiro | ataque_basico | 1,3 | 28,4 | 0 | 0 | 0 | — |
| guerreiro | investida | 1,5 | 114 | 0 | 6 | 0 | — |
| guerreiro | redemoinho | 1,5 | 0 | 0 | 0 | 4,5 | — |
| guerreiro | grito_de_guerra | 1 | 0 | 0 | 4 | 0 | — |
| guerreiro | ataque_basico | 3,9 | 217,4 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 46,4 | 0 | 0 | — |
| guerreiro | efeito:dano_direto | 0 | 9,6 | 0 | 0 | 0 | — |
| mago | bola_de_fogo | 1 | 131,5 | 0 | 3 | 0 | — |
| mago | dardo_arcano | 2,9 | 59,3 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 1 | 19,3 | 0 | 4 | 0 | — |
| mago | raio_em_cadeia | 1 | 112,6 | 0 | 5 | 0 | — |
| mago | efeito:queimando | 0 | 18,4 | 0 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 1 | 0 | 0 | 4 | 0 | — |
| arqueiro | chuva_de_flechas | 1 | 70,6 | 0 | 3 | 0 | — |
| arqueiro | flecha_venenosa | 1 | 55,8 | 0 | 3 | 0 | — |
| arqueiro | tiro | 4 | 209,4 | 0 | 0 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 5,3 | 0 | 0 | 0 | — |
| necromante | dardo_funesto | 2,6 | 94,1 | 0 | 5,3 | 0 | — |
| necromante | garras_do_ossuario | 1 | 38,4 | 0 | 2 | 0 | — |
| necromante | comando_sepulcral | 1 | 0 | 0 | 2 | 0 | — |
| necromante | toque_funesto | 3,5 | 68,5 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 140 | 0 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 148,4% do DPS efetivo de guerreiro. Por encontro, recebeu 26,4 contra 63,8 HP de dano; recuperou 0 contra 46,4 HP (0 contra 0 de poções), gastando 10,5 contra 10 mana total e 0 contra 4,5 HP em conjurações. Começou com 181 contra 182 HP e defesa 2 contra 3. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 0 p.p. e de HP final -2,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 28,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 128,8% do DPS efetivo de mago. Por encontro, recebeu 26,4 contra 32,3 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 10,5 contra 12 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 184 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 3,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 20,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 160,6% do DPS efetivo de arqueiro. Por encontro, recebeu 26,4 contra 20 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 10,5 contra 10 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 176 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final -2,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 11,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 147% do DPS efetivo de necromante. Por encontro, recebeu 26,4 contra 9,8 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 10,5 contra 9,3 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 179 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 140 de dano e receberam 0 contra 22. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -8,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 11,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 86,8% do DPS efetivo de mago. Por encontro, recebeu 63,8 contra 32,3 HP de dano; recuperou 46,4 contra 0 HP (0 contra 0 de poções), gastando 10 contra 12 mana total e 4,5 contra 0 HP em conjurações. Começou com 182 contra 184 HP e defesa 3 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 5,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -8,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 108,2% do DPS efetivo de arqueiro. Por encontro, recebeu 63,8 contra 20 HP de dano; recuperou 46,4 contra 0 HP (0 contra 0 de poções), gastando 10 contra 10 mana total e 4,5 contra 0 HP em conjurações. Começou com 182 contra 176 HP e defesa 3 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final -0,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -17,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 99% do DPS efetivo de necromante. Por encontro, recebeu 63,8 contra 9,8 HP de dano; recuperou 46,4 contra 0 HP (0 contra 0 de poções), gastando 10 contra 9,3 mana total e 4,5 contra 0 HP em conjurações. Começou com 182 contra 179 HP e defesa 3 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 140 de dano e receberam 0 contra 22. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -6,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -17 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 124,7% do DPS efetivo de arqueiro. Por encontro, recebeu 32,3 contra 20 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 12 contra 10 mana total e 0 contra 0 HP em conjurações. Começou com 184 contra 176 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final -6,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 114,1% do DPS efetivo de necromante. Por encontro, recebeu 32,3 contra 9,8 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 12 contra 9,3 mana total e 0 contra 0 HP em conjurações. Começou com 184 contra 179 HP e defesa 1 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 140 de dano e receberam 0 contra 22. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -12,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -8,6 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**arqueiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. arqueiro manteve 91,5% do DPS efetivo de necromante. Por encontro, recebeu 20 contra 9,8 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 10 contra 9,3 mana total e 0 contra 0 HP em conjurações. Começou com 176 contra 179 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 140 de dano e receberam 0 contra 22. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -5,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Defesa plana zerada**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### O que mudou ao retirar cada fator

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 79,8 (100% do completo) | 0 / 0 |
| aventureiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | 27,9 | 32,4 (40,6% do completo) | 0 / 0 |
| aventureiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 1 | 79,8 (100% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 8/8; 0; 0 | 0 | 6 | 53,7 (100% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 53,7 (100% do completo) | 0 / 0 |
| guerreiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | -0,6 | 40,3 (74,9% do completo) | 0 / 0 |
| guerreiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 1,9 | 53,7 (100% do completo) | 0 / 0 |
| mago | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 61,9 (100% do completo) | 0 / 0 |
| mago | Sem habilidades da barra | 8/8; 0; 0 | 0 | 7,8 | 35 (56,5% do completo) | 0 / 0 |
| mago | Defesa plana zerada | 8/8; 0; 0 | 0 | 0,5 | 61,9 (100% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 49,7 (100% do completo) | 0 / 0 |
| arqueiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | 16,8 | 39 (78,6% do completo) | 0 / 0 |
| arqueiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 0,9 | 49,7 (100% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 54,3 (100% do completo) | 0 / 0 |
| necromante | Sem habilidades da barra | 8/8; 0; 0 | 0 | 16,4 | 30,3 (55,8% do completo) | 0 / 0 |
| necromante | Defesa plana zerada | 8/8; 0; 0 | 0 | 0,1 | 54,3 (100% do completo) | 0 / 0 |

## nível 10 · normal · pressao

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 17,8 s | — | 1 | 981 | 117,8 | 39,1 | 20 | 0 |
| guerreiro | 21,3 s | — | 1 | 981 | 171 | 146,9 | 19,9 | 10,5 |
| mago | 11,3 s | — | 1 | 981 | 85,3 | 9,3 | 13,5 | 0 |
| arqueiro | 18,8 s | 19,2 s | 0,9 | 954,1 | 217,5 | 122,5 | 17,3 | 0 |
| necromante | 22 s | 22,4 s | 0,9 | 944,6 | 188,8 | 99 | 18,3 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 1,6 / 1,5 / 36 / 0 | 981 / 0 / 0 | 0 | 0 | 10 / 7,7 / 0 / 0 / 5,5 | 1,7 |
| guerreiro | 0 / 137,8 / 9,1 / 0 | 921,4 / 59,6 / 0 | 3,3 | 0 | 8,9 / 7,7 / 0 / 0 / 0 | 1,6 |
| mago | 0 / 0 / 9,3 / 0 | 933,3 / 47,8 / 0 | 0 | 0 | 6,6 / 1,3 / 0 / 0 / 1 | 2,5 |
| arqueiro | 0 / 0 / 122,5 / 0 | 942,1 / 12 / 0 | 0 | 0 | 10,7 / 0,8 / 0 / 0,4 / 7,7 | 2,8 |
| necromante | 0 / 9 / 90 / 0 | 427,8 / 0 / 516,9 | 0 | 9 | 9 / 3,1 / 0 / 0,9 / 0 | 2,7 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 17,6 / 2,8 | 15,4 / 2,8 / 5 | 0 / 0 | — | 8,3 / 10,7 |
| guerreiro | 18,4 / 2,3 | 11,4 / 2,4 / 4,4 | 0 / 0 | — | 13,8 / 12,3 |
| mago | 9,3 / 1,5 | 13,1 / 2,5 / 4,6 | 1 / 0 | — | 0 / 4,8 |
| arqueiro | 18 / 0,8 | 17,3 / 2,3 / 7,1 | 0 / 0 | — | 0 / 8,8 |
| necromante | 21,5 / 0,4 | 32,1 / 5,6 / 12,5 | 1,1 / 0 | — | 5,3 / 12 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 6,1 | 452,9 | 0 | 12,3 | 0 | — |
| aventureiro | explosao | 1,1 | 148,6 | 0 | 3,4 | 0 | — |
| aventureiro | golpe_atordoante | 1,4 | 77,5 | 0 | 4,1 | 0 | — |
| aventureiro | ataque_basico | 8,9 | 302 | 0 | 0 | 0 | — |
| aventureiro | item:pocao_vida | 0,5 | 0 | 36 | 0 | 0 | — |
| aventureiro | curar | 0,1 | 0 | 1,6 | 0,3 | 0 | 6,5 |
| aventureiro | efeito:cura_periodica | 0 | 0 | 1,5 | 0 | 0 | — |
| guerreiro | investida | 3,4 | 215,9 | 0 | 13,5 | 0 | — |
| guerreiro | redemoinho | 3,5 | 312 | 0 | 0 | 10,5 | — |
| guerreiro | efeito:dano_direto | 0 | 59,6 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 137,8 | 0 | 0 | — |
| guerreiro | grito_de_guerra | 1,5 | 0 | 0 | 6 | 0 | — |
| guerreiro | ataque_basico | 9,9 | 393,5 | 0 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 0,1 | 0 | 0 | 0,4 | 0 | — |
| guerreiro | item:pocao_vida | 0,1 | 0 | 9,1 | 0 | 0 | — |
| mago | bola_de_fogo | 1,5 | 371,9 | 0 | 4,5 | 0 | — |
| mago | dardo_arcano | 5,8 | 185,1 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 1 | 111,4 | 0 | 4 | 0 | — |
| mago | raio_em_cadeia | 1 | 264,9 | 0 | 5 | 0 | — |
| mago | efeito:queimando | 0 | 47,8 | 0 | 0 | 0 | — |
| mago | item:pocao_vida | 0,1 | 0 | 9,3 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 2,3 | 113,3 | 0 | 9 | 0 | — |
| arqueiro | chuva_de_flechas | 1,8 | 246,5 | 0 | 5,3 | 0 | — |
| arqueiro | flecha_venenosa | 1 | 5 | 0 | 3 | 0 | — |
| arqueiro | tiro | 13 | 577,4 | 0 | 0 | 0 | — |
| arqueiro | efeito:dano_direto | 0 | 12 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 1,8 | 0 | 122,5 | 0 | 0 | — |
| necromante | dardo_funesto | 4,4 | 117,1 | 0 | 8,8 | 0 | — |
| necromante | garras_do_ossuario | 2,1 | 70,6 | 0 | 4,3 | 0 | — |
| necromante | comando_sepulcral | 2 | 0 | 0 | 4 | 0 | — |
| necromante | toque_funesto | 12,4 | 240 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 516,9 | 0 | 0 | 0 | — |
| necromante | efeito:cura | 0 | 0 | 9 | 0 | 0 | — |
| necromante | item:pocao_vida | 1,3 | 0 | 90 | 0 | 0 | — |
| necromante | dizimo_vital | 0,6 | 0 | 0 | 1,3 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 105,9% do DPS efetivo de guerreiro. Por encontro, recebeu 117,8 contra 171 HP de dano; recuperou 39,1 contra 146,9 HP (36 contra 9,1 de poções), gastando 20 contra 19,9 mana total e 0 contra 10,5 HP em conjurações. Começou com 181 contra 182 HP e defesa 2 contra 3. Escudos absorveram 0 contra 3,3; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 0 p.p. e de HP final -27,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -37,5 p.p.; contraste de 37,5 p.p. e alteração de 60,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 61,5% do DPS efetivo de mago. Por encontro, recebeu 117,8 contra 85,3 HP de dano; recuperou 39,1 contra 9,3 HP (36 contra 9,3 de poções), gastando 20 contra 13,5 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 184 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 2,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 50 p.p.; contraste de -50 p.p. e alteração de -1,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × arqueiro:** 0/8 mortes contra 1/8; 0 contra 0 limites de tempo. aventureiro manteve 110,3% do DPS efetivo de arqueiro. Por encontro, recebeu 117,8 contra 217,5 HP de dano; recuperou 39,1 contra 122,5 HP (36 contra 122,5 de poções), gastando 20 contra 17,3 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 176 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 12,5 p.p. e de HP final 15,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para 62,5 p.p.; contraste de -50 p.p. e alteração de -23,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × necromante:** 0/8 mortes contra 1/8; 0 contra 0 limites de tempo. aventureiro manteve 139,2% do DPS efetivo de necromante. Por encontro, recebeu 117,8 contra 188,8 HP de dano; recuperou 39,1 contra 99 HP (36 contra 90 de poções), gastando 20 contra 18,3 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 179 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 516,9 de dano e receberam 0 contra 110,5. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 12,5 p.p. e de HP final 8,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para 25 p.p.; contraste de -12,5 p.p. e alteração de -4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 58,1% do DPS efetivo de mago. Por encontro, recebeu 171 contra 85,3 HP de dano; recuperou 146,9 contra 9,3 HP (9,1 contra 9,3 de poções), gastando 19,9 contra 13,5 mana total e 10,5 contra 0 HP em conjurações. Começou com 182 contra 184 HP e defesa 3 contra 1. Escudos absorveram 3,3 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 29,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 87,5 p.p.; contraste de -87,5 p.p. e alteração de -61,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 0/8 mortes contra 1/8; 0 contra 0 limites de tempo. guerreiro manteve 104,2% do DPS efetivo de arqueiro. Por encontro, recebeu 171 contra 217,5 HP de dano; recuperou 146,9 contra 122,5 HP (9,1 contra 122,5 de poções), gastando 19,9 contra 17,3 mana total e 10,5 contra 0 HP em conjurações. Começou com 182 contra 176 HP e defesa 3 contra 2. Escudos absorveram 3,3 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 12,5 p.p. e de HP final 42,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para 87,5 p.p.; contraste de -75 p.p. e alteração de -44,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: guerreiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × necromante:** 0/8 mortes contra 1/8; 0 contra 0 limites de tempo. guerreiro manteve 131,5% do DPS efetivo de necromante. Por encontro, recebeu 171 contra 188,8 HP de dano; recuperou 146,9 contra 99 HP (9,1 contra 90 de poções), gastando 19,9 contra 18,3 mana total e 10,5 contra 0 HP em conjurações. Começou com 182 contra 179 HP e defesa 3 contra 1. Escudos absorveram 3,3 contra 0; invocações causaram 0 contra 516,9 de dano e receberam 0 contra 110,5. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só guerreiro venceu, 0 só necromante venceu; diferença de vitória 12,5 p.p. e de HP final 35,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para 50 p.p.; contraste de -37,5 p.p. e alteração de -32,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: guerreiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × arqueiro:** 0/8 mortes contra 1/8; 0 contra 0 limites de tempo. mago manteve 179,3% do DPS efetivo de arqueiro. Por encontro, recebeu 85,3 contra 217,5 HP de dano; recuperou 9,3 contra 122,5 HP (9,3 contra 122,5 de poções), gastando 13,5 contra 17,3 mana total e 0 contra 0 HP em conjurações. Começou com 184 contra 176 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 12,5 p.p. e de HP final 12,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para -62,5 p.p.; contraste de 75 p.p. e alteração de 44,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: mago venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × necromante:** 0/8 mortes contra 1/8; 0 contra 0 limites de tempo. mago manteve 226,3% do DPS efetivo de necromante. Por encontro, recebeu 85,3 contra 188,8 HP de dano; recuperou 9,3 contra 99 HP (9,3 contra 90 de poções), gastando 13,5 contra 18,3 mana total e 0 contra 0 HP em conjurações. Começou com 184 contra 179 HP e defesa 1 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 516,9 de dano e receberam 0 contra 110,5. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só mago venceu, 0 só necromante venceu; diferença de vitória 12,5 p.p. e de HP final 5,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para -37,5 p.p.; contraste de 50 p.p. e alteração de 29,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: mago venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**arqueiro × necromante:** 1/8 mortes contra 1/8; 0 contra 0 limites de tempo. arqueiro manteve 126,2% do DPS efetivo de necromante. Por encontro, recebeu 217,5 contra 188,8 HP de dano; recuperou 122,5 contra 99 HP (122,5 contra 90 de poções), gastando 17,3 contra 18,3 mana total e 0 contra 0 HP em conjurações. Começou com 176 contra 179 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 516,9 de dano e receberam 0 contra 110,5. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só arqueiro venceu, 1 só necromante venceu; diferença de vitória 0 p.p. e de HP final -6,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -37,5 p.p.; contraste de 37,5 p.p. e alteração de 19,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### O que mudou ao retirar cada fator

**aventureiro, Sem poções de vida:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 21 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**aventureiro, Sem habilidades da barra:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 54,8 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem habilidades da barra:** retirar esse fator perdeu 7 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 56,3 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem poções de vida:** retirar esse fator perdeu 6 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 44,5 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem habilidades da barra:** retirar esse fator perdeu 2 vitórias e ganhou 1 nas mesmas 8 condições iniciais. O kit completo teve 11,9 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem poções de vida:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 25 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem habilidades da barra:** retirar esse fator perdeu 4 vitórias e ganhou 1 nas mesmas 8 condições iniciais. O kit completo teve 27,2 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 6/8; 2; 0 | 25 | 21 | 54,5 (96,6% do completo) | 2 / 0 |
| aventureiro | Sem habilidades da barra | 5/8; 3; 0 | 37,5 | 54,8 | 29,3 (51,8% do completo) | 3 / 0 |
| aventureiro | Defesa plana zerada | 8/8; 0; 0 | 0 | -0,2 | 56,7 (100,4% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 8/8; 0; 0 | 0 | 0,5 | 57,1 (107% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 8/8; 0; 0 | 0 | 0,3 | 53,3 (100% do completo) | 0 / 0 |
| guerreiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | -5,6 | 38,2 (71,7% do completo) | 0 / 0 |
| guerreiro | Defesa plana zerada | 8/8; 0; 0 | 0 | -3,6 | 57,1 (107% do completo) | 0 / 0 |
| mago | Sem poções de vida | 8/8; 0; 0 | 0 | 5 | 91,8 (100% do completo) | 0 / 0 |
| mago | Sem habilidades da barra | 1/8; 7; 0 | 87,5 | 56,3 | 32,9 (35,8% do completo) | 7 / 0 |
| mago | Defesa plana zerada | 8/8; 0; 0 | 0 | 1,4 | 91,8 (100% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 1/8; 7; 0 | 75 | 44,5 | 52,8 (103,1% do completo) | 6 / 0 |
| arqueiro | Sem habilidades da barra | 6/8; 2; 0 | 12,5 | 11,9 | 46 (89,9% do completo) | 2 / 1 |
| arqueiro | Defesa plana zerada | 7/8; 1; 0 | 0 | 2 | 51,2 (100% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 4/8; 4; 0 | 37,5 | 25 | 39,3 (96,9% do completo) | 3 / 0 |
| necromante | Sem habilidades da barra | 4/8; 4; 0 | 37,5 | 27,2 | 21,8 (53,7% do completo) | 4 / 1 |
| necromante | Defesa plana zerada | 7/8; 1; 0 | 0 | 2,7 | 40,6 (100% do completo) | 0 / 0 |

## nível 10 · normal · atrito

### Onde o desgaste aparece

| Classe | Onda | Chegaram/n inicial | Mortes / limites nesta onda | HP entrada → saída | Mana entrada → saída | Recebido / cura / mana gasta |
|---|---|---|---|---|---|---|
| aventureiro | 1 | 8/8 | 0 / 0 | 181 → 154,9 | 10 → 2,2 | 26,4 / 0 / 9,8 |
| aventureiro | 2 | 8/8 | 0 / 0 | 154,9 → 117,6 | 2,2 → 1,1 | 43 / 0 / 6,3 |
| aventureiro | 3 | 8/8 | 0 / 0 | 117,6 → 102,9 | 1,1 → 0,5 | 29,8 / 9 / 5,5 |
| aventureiro | 4 | 8/8 | 0 / 0 | 102,9 → 96,6 | 0,5 → 0,4 | 46,5 / 36 / 4,3 |
| aventureiro | 5 | 8/8 | 0 / 0 | 96,6 → 90,4 | 0,4 → 0,7 | 73,4 / 66,6 / 3,3 |
| guerreiro | 1 | 8/8 | 0 / 0 | 182 → 166,3 | 10 → 3 | 49,5 / 37,5 / 9 |
| guerreiro | 2 | 8/8 | 0 / 0 | 166,3 → 157,8 | 3 → 3 | 56,8 / 47,1 / 6,9 |
| guerreiro | 3 | 8/8 | 0 / 0 | 157,8 → 164,1 | 3 → 2,8 | 29,8 / 34,3 / 5,9 |
| guerreiro | 4 | 8/8 | 0 / 0 | 164,1 → 163,3 | 2,8 → 2,5 | 41 / 38,9 / 4 |
| guerreiro | 5 | 8/8 | 0 / 0 | 163,3 → 167,1 | 2,5 → 1,9 | 50,4 / 53,5 / 4,5 |
| mago | 1 | 8/8 | 0 / 0 | 184 → 154,6 | 12 → 2,3 | 29,4 / 0 / 12 |
| mago | 2 | 8/8 | 0 / 0 | 154,6 → 105,3 | 2,3 → 6,3 | 68,6 / 18,5 / 1,1 |
| mago | 3 | 8/8 | 0 / 0 | 105,3 → 99,5 | 6,3 → 3,1 | 33,5 / 27,8 / 7 |
| mago | 4 | 8/8 | 0 / 0 | 99,5 → 101,1 | 3,1 → 4,9 | 27,4 / 27,8 / 3,1 |
| mago | 5 | 8/8 | 1 / 0 | 101,1 → 91,4 | 4,9 → 4,1 | 28,8 / 18,5 / 4 |
| arqueiro | 1 | 8/8 | 0 / 0 | 176 → 164,3 | 10 → 2,6 | 11,8 / 0 / 10 |
| arqueiro | 2 | 8/8 | 0 / 0 | 164,3 → 120,1 | 2,6 → 5,5 | 61,6 / 17,5 / 1,6 |
| arqueiro | 3 | 8/8 | 0 / 0 | 120,1 → 103,5 | 5,5 → 1,5 | 42,9 / 26,3 / 6,9 |
| arqueiro | 4 | 8/8 | 0 / 0 | 103,5 → 106,1 | 1,5 → 2,4 | 25,6 / 26,3 / 3 |
| arqueiro | 5 | 8/8 | 0 / 0 | 106,1 → 76 | 2,4 → 5,4 | 73,9 / 43,8 / 0,8 |
| necromante | 1 | 8/8 | 0 / 0 | 179 → 176,3 | 12 → 5,3 | 2,8 / 0 / 8,5 |
| necromante | 2 | 8/8 | 0 / 0 | 176,3 → 176,3 | 5,3 → 1,5 | 0 / 0 / 7 |
| necromante | 3 | 8/8 | 0 / 0 | 176,3 → 175,9 | 1,5 → 1,9 | 3,6 / 0 / 10,5 |
| necromante | 4 | 8/8 | 0 / 0 | 175,9 → 177,6 | 1,9 → 1,9 | 0 / 0 / 4,5 |
| necromante | 5 | 8/8 | 0 / 0 | 177,6 → 165,9 | 1,9 → 2,6 | 12,8 / 0 / 3,3 |

Médias de cada onda incluem apenas quem chegou a ela; o denominador inicial mostra a seleção dos sobreviventes. Não compare a vida da onda 5 como se incluísse quem morreu antes.

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 30,8 s | — | 5 | 1.639 | 219 | 111,6 | 29 | 0 |
| guerreiro | 33,5 s | — | 5 | 1.639 | 227,4 | 211,3 | 30,3 | 17,6 |
| mago | 35,3 s | 37,4 s | 4,9 | 1.626,1 | 187,6 | 92,5 | 27,3 | 0 |
| arqueiro | 36,9 s | — | 5 | 1.639 | 215,8 | 113,8 | 22,3 | 0 |
| necromante | 32 s | — | 5 | 1.639 | 19,1 | 0 | 33,8 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 6,6 / 6 / 99 / 0 | 1.639 / 0 / 0 | 0 | 0 | 16,5 / 10,9 / 0 / 0 / 11,6 | 1,6 |
| guerreiro | 0 / 211,3 / 0 / 0 | 1.573,1 / 65,9 / 0 | 6,5 | 0 | 16 / 9,6 / 0 / 0 / 1,1 | 1 |
| mago | 0 / 0 / 92,5 / 0 | 1.561 / 65,1 / 0 | 19,8 | 0 | 21,1 / 4,5 / 0 / 1,3 / 9,9 | 2,6 |
| arqueiro | 0 / 0 / 113,8 / 0 | 1.631,3 / 7,8 / 0 | 0 | 0 | 18,8 / 2,4 / 0 / 0,3 / 14,3 | 2,5 |
| necromante | 0 / 0 / 0 / 0 | 682,6 / 0 / 956,4 | 0 | 0 | 13,2 / 9,9 / 0 / 0 / 7,7 | 3,5 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 29,4 / 3,6 | 24,9 / 3,6 / 9 | 0 / 0 | — | 16,8 / 19,7 |
| guerreiro | 33,5 / 4,8 | 19,1 / 3 / 7,1 | 0,3 / 0 | — | 18,9 / 22,2 |
| mago | 28,9 / 2,4 | 23,9 / 4,1 / 8,3 | 0 / 0 | — | 2,5 / 19,4 |
| arqueiro | 31,9 / 0,8 | 30,1 / 3,8 / 13,9 | 0 / 0 | — | 2 / 17,6 |
| necromante | 33,9 / 5 | 62,6 / 8,4 / 26,3 | 2 / 0 | — | 6 / 24,4 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 9,9 | 816,6 | 0 | 19,8 | 0 | — |
| aventureiro | explosao | 1,4 | 127 | 0 | 4,1 | 0 | — |
| aventureiro | golpe_atordoante | 1,4 | 102,1 | 0 | 4,1 | 0 | — |
| aventureiro | ataque_basico | 16,3 | 593,3 | 0 | 0 | 0 | — |
| aventureiro | item:pocao_vida | 1,4 | 0 | 99 | 0 | 0 | — |
| aventureiro | curar | 0,5 | 0 | 6,6 | 1 | 0 | 6,6 |
| aventureiro | efeito:cura_periodica | 0 | 0 | 6 | 0 | 0 | — |
| guerreiro | investida | 5 | 304,1 | 0 | 20 | 0 | — |
| guerreiro | redemoinho | 5,9 | 201,6 | 0 | 0 | 17,6 | — |
| guerreiro | grito_de_guerra | 2,4 | 0 | 0 | 9,5 | 0 | — |
| guerreiro | ataque_basico | 20 | 1.067,4 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 211,3 | 0 | 0 | — |
| guerreiro | efeito:dano_direto | 0 | 65,9 | 0 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 0,3 | 0 | 0 | 0,8 | 0 | — |
| mago | bola_de_fogo | 4,1 | 552,6 | 0 | 12,4 | 0 | — |
| mago | dardo_arcano | 21,1 | 853 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 2 | 48,6 | 0 | 8 | 0 | — |
| mago | raio_em_cadeia | 1 | 106,8 | 0 | 5 | 0 | — |
| mago | efeito:queimando | 0 | 65,1 | 0 | 0 | 0 | — |
| mago | barreira | 0,6 | 0 | 0 | 1,9 | 0 | — |
| mago | item:pocao_vida | 1,3 | 0 | 92,5 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 2 | 105,8 | 0 | 8 | 0 | — |
| arqueiro | chuva_de_flechas | 2,9 | 206,8 | 0 | 8,6 | 0 | — |
| arqueiro | flecha_venenosa | 1,9 | 96 | 0 | 5,6 | 0 | — |
| arqueiro | tiro | 25,1 | 1.222,8 | 0 | 0 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 7,8 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 1,6 | 0 | 113,8 | 0 | 0 | — |
| necromante | dardo_funesto | 10,1 | 293,8 | 0 | 20,3 | 0 | — |
| necromante | garras_do_ossuario | 4,3 | 140 | 0 | 8,5 | 0 | — |
| necromante | comando_sepulcral | 2,5 | 0 | 0 | 5 | 0 | — |
| necromante | toque_funesto | 17 | 248,9 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 956,4 | 0 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 108,7% do DPS efetivo de guerreiro. Por encontro, recebeu 219 contra 227,4 HP de dano; recuperou 111,6 contra 211,3 HP (99 contra 0 de poções), gastando 29 contra 30,3 mana total e 0 contra 17,6 HP em conjurações. Começou com 181 contra 182 HP e defesa 2 contra 3. Escudos absorveram 0 contra 6,5; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 0 p.p. e de HP final -41,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -100 p.p.; contraste de 100 p.p. e alteração de 58,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × mago:** 0/8 mortes contra 1/8; 0 contra 0 limites de tempo. aventureiro manteve 118,5% do DPS efetivo de mago. Por encontro, recebeu 219 contra 187,6 HP de dano; recuperou 111,6 contra 92,5 HP (99 contra 92,5 de poções), gastando 29 contra 27,3 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 184 HP e defesa 2 contra 1. Escudos absorveram 0 contra 19,8; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 12,5 p.p. e de HP final 0,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para -75 p.p.; contraste de 87,5 p.p. e alteração de 22 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 114,3% do DPS efetivo de arqueiro. Por encontro, recebeu 219 contra 215,8 HP de dano; recuperou 111,6 contra 113,8 HP (99 contra 113,8 de poções), gastando 29 contra 22,3 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 176 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 6,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -75 p.p.; contraste de 75 p.p. e alteração de 33,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 111,1% do DPS efetivo de necromante. Por encontro, recebeu 219 contra 19,1 HP de dano; recuperou 111,6 contra 0 HP (99 contra 0 de poções), gastando 29 contra 33,8 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 179 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 956,4 de dano e receberam 0 contra 182,4. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -42,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -100 p.p.; contraste de 100 p.p. e alteração de 44,6 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × mago:** 0/8 mortes contra 1/8; 0 contra 0 limites de tempo. guerreiro manteve 109% do DPS efetivo de mago. Por encontro, recebeu 227,4 contra 187,6 HP de dano; recuperou 211,3 contra 92,5 HP (0 contra 92,5 de poções), gastando 30,3 contra 27,3 mana total e 17,6 contra 0 HP em conjurações. Começou com 182 contra 184 HP e defesa 3 contra 1. Escudos absorveram 6,5 contra 19,8; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 12,5 p.p. e de HP final 42,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para 37,5 p.p.; contraste de -25 p.p. e alteração de -35,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: guerreiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 105,1% do DPS efetivo de arqueiro. Por encontro, recebeu 227,4 contra 215,8 HP de dano; recuperou 211,3 contra 113,8 HP (0 contra 113,8 de poções), gastando 30,3 contra 22,3 mana total e 17,6 contra 0 HP em conjurações. Começou com 182 contra 176 HP e defesa 3 contra 2. Escudos absorveram 6,5 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 48,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 100 p.p.; contraste de -100 p.p. e alteração de -43,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 102,2% do DPS efetivo de necromante. Por encontro, recebeu 227,4 contra 19,1 HP de dano; recuperou 211,3 contra 0 HP (0 contra 0 de poções), gastando 30,3 contra 33,8 mana total e 17,6 contra 0 HP em conjurações. Começou com 182 contra 179 HP e defesa 3 contra 1. Escudos absorveram 6,5 contra 0; invocações causaram 0 contra 956,4 de dano e receberam 0 contra 182,4. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -0,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -13,6 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × arqueiro:** 1/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 96,5% do DPS efetivo de arqueiro. Por encontro, recebeu 187,6 contra 215,8 HP de dano; recuperou 92,5 contra 113,8 HP (92,5 contra 113,8 de poções), gastando 27,3 contra 22,3 mana total e 0 contra 0 HP em conjurações. Começou com 184 contra 176 HP e defesa 1 contra 2. Escudos absorveram 19,8 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 1 só arqueiro venceu; diferença de vitória -12,5 p.p. e de HP final 6,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para 62,5 p.p.; contraste de -75 p.p. e alteração de -7,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: arqueiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × necromante:** 1/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 93,7% do DPS efetivo de necromante. Por encontro, recebeu 187,6 contra 19,1 HP de dano; recuperou 92,5 contra 0 HP (92,5 contra 0 de poções), gastando 27,3 contra 33,8 mana total e 0 contra 0 HP em conjurações. Começou com 184 contra 179 HP e defesa 1 contra 1. Escudos absorveram 19,8 contra 0; invocações causaram 0 contra 956,4 de dano e receberam 0 contra 182,4. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 1 só necromante venceu; diferença de vitória -12,5 p.p. e de HP final -43 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para -37,5 p.p.; contraste de 25 p.p. e alteração de 35,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**arqueiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. arqueiro manteve 97,2% do DPS efetivo de necromante. Por encontro, recebeu 215,8 contra 19,1 HP de dano; recuperou 113,8 contra 0 HP (113,8 contra 0 de poções), gastando 22,3 contra 33,8 mana total e 0 contra 0 HP em conjurações. Começou com 176 contra 179 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 956,4 de dano e receberam 0 contra 182,4. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -49,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -100 p.p.; contraste de 100 p.p. e alteração de 43,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### O que mudou ao retirar cada fator

**aventureiro, Sem poções de vida:** retirar esse fator perdeu 4 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 40,8 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**aventureiro, Sem habilidades da barra:** retirar esse fator perdeu 8 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 49,9 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem poções de vida:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 35,3 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem habilidades da barra:** retirar esse fator perdeu 2 vitórias e ganhou 1 nas mesmas 8 condições iniciais. O kit completo teve 27,9 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem poções de vida:** retirar esse fator perdeu 8 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 43,2 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem habilidades da barra:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 16,4 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 4/8; 4; 0 | 50 | 40,8 | 52,2 (97,6% do completo) | 4 / 0 |
| aventureiro | Sem habilidades da barra | 0/8; 8; 0 | 100 | 49,9 | 28,7 (53,7% do completo) | 8 / 0 |
| aventureiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 3,1 | 53,2 (99,6% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 8/8; 0; 0 | 0 | 8,4 | 45 (91,6% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 49,2 (100% do completo) | 0 / 0 |
| guerreiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | -8,2 | 39,2 (79,7% do completo) | 0 / 0 |
| guerreiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 2,1 | 47,9 (97,4% do completo) | 0 / 0 |
| mago | Sem poções de vida | 5/8; 3; 0 | 25 | 35,3 | 43,6 (96,8% do completo) | 2 / 0 |
| mago | Sem habilidades da barra | 6/8; 2; 0 | 12,5 | 27,9 | 35,7 (79,1% do completo) | 2 / 1 |
| mago | Defesa plana zerada | 7/8; 1; 0 | 0 | 2,8 | 45,3 (100,4% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 0/8; 8; 0 | 100 | 43,2 | 46,8 (100,2% do completo) | 8 / 0 |
| arqueiro | Sem habilidades da barra | 6/8; 2; 0 | 25 | 16,4 | 40,9 (87,4% do completo) | 2 / 0 |
| arqueiro | Defesa plana zerada | 8/8; 0; 0 | 0 | -6,8 | 46,8 (100% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 48,1 (100% do completo) | 0 / 0 |
| necromante | Sem habilidades da barra | 8/8; 0; 0 | 0 | 5,4 | 27,2 (56,5% do completo) | 0 / 0 |
| necromante | Defesa plana zerada | 8/8; 0; 0 | 0 | 0,3 | 48,1 (100% do completo) | 0 / 0 |

## nível 10 · normal · chefe

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 11,3 s | — | 1 | 606 | 65,5 | 0 | 14 | 0 |
| guerreiro | 8 s | — | 1 | 606 | 39,4 | 35,5 | 11,5 | 6 |
| mago | 11,8 s | — | 1 | 606 | 27,1 | 0 | 14,6 | 0 |
| arqueiro | 12,7 s | — | 1 | 606 | 26,3 | 0 | 14,5 | 0 |
| necromante | 11,6 s | — | 1 | 630 | 28,9 | 0 | 14,3 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 0 / 0 / 0 / 0 | 606 / 0 / 0 | 0 | 0 | 6,4 / 3,9 / 0,9 / 0 / 1,9 | 1,5 |
| guerreiro | 0 / 35,5 / 0 / 0 | 584,9 / 21,1 / 0 | 0 | 0 | 4,7 / 1,6 / 0,8 / 0 / 0 | 0,8 |
| mago | 0 / 0 / 0 / 0 | 597 / 9 / 0 | 0 | 0 | 7,1 / 4,6 / 0,4 / 0 / 1,4 | 2,3 |
| arqueiro | 0 / 0 / 0 / 0 | 595 / 11 / 0 | 0 | 0 | 7,2 / 4,1 / 0,4 / 0 / 3,6 | 2,3 |
| necromante | 0 / 0 / 0 / 0 | 348,5 / 0 / 281,5 | 0 | 0 | 5,7 / 3,4 / 0,2 / 0 / 0,2 | 2,5 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 11,1 / 2,6 | 8,5 / 1,6 / 2,8 | 0 / 0 | — | 0 / 5,1 |
| guerreiro | 10,1 / 1,8 | 6,4 / 0,8 / 2,3 | 0 / 0 | — | 0 / 3,9 |
| mago | 9,9 / 1,9 | 8 / 1,3 / 2,6 | 0,6 / 0 | — | 0 / 5 |
| arqueiro | 11,6 / 2 | 9,6 / 1,1 / 4,3 | 0 / 0,6 | — | 0 / 5 |
| necromante | 14,9 / 1,8 | 17,8 / 2,5 / 7 | 1,5 / 0 | — | 0,5 / 6,9 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 4 | 348 | 0 | 8 | 0 | — |
| aventureiro | explosao | 1 | 111 | 0 | 3 | 0 | — |
| aventureiro | golpe_atordoante | 1 | 36,9 | 0 | 3 | 0 | — |
| aventureiro | ataque_basico | 5,1 | 110,1 | 0 | 0 | 0 | — |
| guerreiro | investida | 1,9 | 193,5 | 0 | 7,5 | 0 | — |
| guerreiro | redemoinho | 2 | 133,9 | 0 | 0 | 6 | — |
| guerreiro | grito_de_guerra | 1 | 0 | 0 | 4 | 0 | — |
| guerreiro | ataque_basico | 5,3 | 257,5 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 35,5 | 0 | 0 | — |
| guerreiro | efeito:dano_direto | 0 | 21,1 | 0 | 0 | 0 | — |
| mago | bola_de_fogo | 1,9 | 88,9 | 0 | 5,6 | 0 | — |
| mago | dardo_arcano | 6 | 222,9 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 1 | 146,5 | 0 | 4 | 0 | — |
| mago | raio_em_cadeia | 1 | 138,8 | 0 | 5 | 0 | — |
| mago | efeito:queimando | 0 | 9 | 0 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 1 | 88 | 0 | 4 | 0 | — |
| arqueiro | chuva_de_flechas | 2 | 139,4 | 0 | 6 | 0 | — |
| arqueiro | tiro | 7,1 | 275,6 | 0 | 0 | 0 | — |
| arqueiro | flecha_venenosa | 1,5 | 92 | 0 | 4,5 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 11 | 0 | 0 | 0 | — |
| necromante | dardo_funesto | 4 | 135,9 | 0 | 8 | 0 | — |
| necromante | garras_do_ossuario | 1,8 | 73,4 | 0 | 3,5 | 0 | — |
| necromante | comando_sepulcral | 1 | 0 | 0 | 2 | 0 | — |
| necromante | toque_funesto | 7,8 | 139,3 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 281,5 | 0 | 0 | 0 | — |
| necromante | dizimo_vital | 0,4 | 0 | 0 | 0,8 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 85% do DPS efetivo de guerreiro. Por encontro, recebeu 65,5 contra 39,4 HP de dano; recuperou 0 contra 35,5 HP (0 contra 0 de poções), gastando 14 contra 11,5 mana total e 0 contra 6 HP em conjurações. Começou com 181 contra 182 HP e defesa 2 contra 3. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 0 p.p. e de HP final -30,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 22 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 106,1% do DPS efetivo de mago. Por encontro, recebeu 65,5 contra 27,1 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 14 contra 14,6 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 184 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final -21,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 31,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 108,5% do DPS efetivo de arqueiro. Por encontro, recebeu 65,5 contra 26,3 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 14 contra 14,5 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 176 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final -21,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 32,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 132,2% do DPS efetivo de necromante. Por encontro, recebeu 65,5 contra 28,9 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 14 contra 14,3 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 179 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 281,5 de dano e receberam 0 contra 54,6. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -20,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 17,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 124,8% do DPS efetivo de mago. Por encontro, recebeu 39,4 contra 27,1 HP de dano; recuperou 35,5 contra 0 HP (0 contra 0 de poções), gastando 11,5 contra 14,6 mana total e 6 contra 0 HP em conjurações. Começou com 182 contra 184 HP e defesa 3 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 9,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 9,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 127,6% do DPS efetivo de arqueiro. Por encontro, recebeu 39,4 contra 26,3 HP de dano; recuperou 35,5 contra 0 HP (0 contra 0 de poções), gastando 11,5 contra 14,5 mana total e 6 contra 0 HP em conjurações. Começou com 182 contra 176 HP e defesa 3 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 9,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 10,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 155,5% do DPS efetivo de necromante. Por encontro, recebeu 39,4 contra 28,9 HP de dano; recuperou 35,5 contra 0 HP (0 contra 0 de poções), gastando 11,5 contra 14,3 mana total e 6 contra 0 HP em conjurações. Começou com 182 contra 179 HP e defesa 3 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 281,5 de dano e receberam 0 contra 54,6. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final 10,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 5,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 102,2% do DPS efetivo de arqueiro. Por encontro, recebeu 27,1 contra 26,3 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 14,6 contra 14,5 mana total e 0 contra 0 HP em conjurações. Começou com 184 contra 176 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Defesa plana zerada**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -0,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 124,6% do DPS efetivo de necromante. Por encontro, recebeu 27,1 contra 28,9 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 14,6 contra 14,3 mana total e 0 contra 0 HP em conjurações. Começou com 184 contra 179 HP e defesa 1 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 281,5 de dano e receberam 0 contra 54,6. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final 1,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -14,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**arqueiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. arqueiro manteve 121,9% do DPS efetivo de necromante. Por encontro, recebeu 26,3 contra 28,9 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 14,5 contra 14,3 mana total e 0 contra 0 HP em conjurações. Começou com 176 contra 179 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 281,5 de dano e receberam 0 contra 54,6. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final 0,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -14,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### O que mudou ao retirar cada fator

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 58,4 (100% do completo) | 0 / 0 |
| aventureiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | 17,2 | 28,8 (49,3% do completo) | 0 / 0 |
| aventureiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 1,9 | 58,4 (100% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 8/8; 0; 0 | 0 | 5,4 | 68,7 (100% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 68,7 (100% do completo) | 0 / 0 |
| guerreiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | -4,8 | 39,1 (56,9% do completo) | 0 / 0 |
| guerreiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 0,9 | 68,7 (100% do completo) | 0 / 0 |
| mago | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 55,1 (100% do completo) | 0 / 0 |
| mago | Sem habilidades da barra | 8/8; 0; 0 | 0 | -14,7 | 43,6 (79,1% do completo) | 0 / 0 |
| mago | Defesa plana zerada | 8/8; 0; 0 | 0 | 0,3 | 55,1 (100% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 53,9 (100% do completo) | 0 / 0 |
| arqueiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | -14,9 | 42,7 (79,3% do completo) | 0 / 0 |
| arqueiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 0,9 | 53,9 (100% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 44,2 (100% do completo) | 0 / 0 |
| necromante | Sem habilidades da barra | 8/8; 0; 0 | 0 | -0,1 | 29,2 (66,1% do completo) | 0 / 0 |
| necromante | Defesa plana zerada | 8/8; 0; 0 | 0 | 0,4 | 44,2 (100% do completo) | 0 / 0 |

## nível 10 · pesadelo · duelo

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 8,7 s | — | 1 | 341 | 75,8 | 18 | 13,5 | 0 |
| guerreiro | 11,3 s | — | 1 | 341 | 147,3 | 110 | 14,6 | 6,8 |
| mago | 13 s | — | 1 | 341 | 128,6 | 55,5 | 12,4 | 0 |
| arqueiro | 14,4 s | — | 1 | 341 | 99,5 | 26,3 | 10 | 0 |
| necromante | 9,2 s | — | 1 | 341 | 39 | 9 | 13 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 0 / 0 / 18 / 0 | 341 / 0 / 0 | 0 | 0 | 6 / 2,2 / 0 / 0 / 1,1 | 1,4 |
| guerreiro | 0 / 73,5 / 36,5 / 0 | 330 / 11 / 0 | 13 | 0 | 6,5 / 0,7 / 0 / 0 / 1 | 0,1 |
| mago | 0 / 0 / 55,5 / 0 | 320 / 21 / 0 | 0 | 0 | 7,2 / 1,1 / 0 / 0 / 0,9 | 2,4 |
| arqueiro | 0 / 0 / 26,3 / 0 | 335,4 / 5,6 / 0 | 0 | 0 | 7,2 / 0,7 / 0 / 0 / 4,3 | 2,3 |
| necromante | 0 / 0 / 9 / 0 | 179,8 / 0 / 161,3 | 0 | 0 | 4,9 / 1,4 / 0 / 0 / 0,3 | 2,6 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 9,8 / 1,4 | 8,4 / 1,4 / 2,5 | 0 / 0 | — | 0 / 4,4 |
| guerreiro | 13,8 / 1,3 | 7,4 / 0,9 / 2,4 | 0 / 0 | — | 0 / 5,5 |
| mago | 10,3 / 1,1 | 8,3 / 2,1 / 2,6 | 0,1 / 0 | — | 0 / 5,6 |
| arqueiro | 12,3 / 0 | 11,1 / 1,9 / 5,1 | 0 / 0 | — | 0 / 6,3 |
| necromante | 12,6 / 0,8 | 15,1 / 2,1 / 6,6 | 1,4 / 0 | — | 0 / 5,1 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 3,8 | 177,9 | 0 | 7,5 | 0 | — |
| aventureiro | explosao | 1 | 47,3 | 0 | 3 | 0 | — |
| aventureiro | golpe_atordoante | 1 | 41,6 | 0 | 3 | 0 | — |
| aventureiro | ataque_basico | 4 | 74,3 | 0 | 0 | 0 | — |
| aventureiro | item:pocao_vida | 0,3 | 0 | 18 | 0 | 0 | — |
| guerreiro | investida | 2 | 67 | 0 | 8 | 0 | — |
| guerreiro | redemoinho | 2,3 | 0 | 0 | 0 | 6,8 | — |
| guerreiro | grito_de_guerra | 1 | 0 | 0 | 4 | 0 | — |
| guerreiro | ataque_basico | 7,6 | 263 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 73,5 | 0 | 0 | — |
| guerreiro | efeito:dano_direto | 0 | 11 | 0 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 0,9 | 0 | 0 | 2,6 | 0 | — |
| guerreiro | item:pocao_vida | 0,5 | 0 | 36,5 | 0 | 0 | — |
| mago | bola_de_fogo | 1,1 | 83,6 | 0 | 3,4 | 0 | — |
| mago | dardo_arcano | 7,1 | 156,4 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 1 | 11,3 | 0 | 4 | 0 | — |
| mago | raio_em_cadeia | 1 | 68,8 | 0 | 5 | 0 | — |
| mago | efeito:queimando | 0 | 21 | 0 | 0 | 0 | — |
| mago | item:pocao_vida | 0,8 | 0 | 55,5 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 1 | 0 | 0 | 4 | 0 | — |
| arqueiro | chuva_de_flechas | 1 | 41,5 | 0 | 3 | 0 | — |
| arqueiro | flecha_venenosa | 1 | 26,9 | 0 | 3 | 0 | — |
| arqueiro | tiro | 9,3 | 267 | 0 | 0 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 5,6 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 0,4 | 0 | 26,3 | 0 | 0 | — |
| necromante | dardo_funesto | 3,4 | 74,4 | 0 | 6,8 | 0 | — |
| necromante | garras_do_ossuario | 1,8 | 41,5 | 0 | 3,5 | 0 | — |
| necromante | comando_sepulcral | 1 | 0 | 0 | 2 | 0 | — |
| necromante | toque_funesto | 6,1 | 63,9 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 161,3 | 0 | 0 | 0 | — |
| necromante | dizimo_vital | 0,4 | 0 | 0 | 0,8 | 0 | — |
| necromante | item:pocao_vida | 0,1 | 0 | 9 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 138,4% do DPS efetivo de guerreiro. Por encontro, recebeu 75,8 contra 147,3 HP de dano; recuperou 18 contra 110 HP (18 contra 36,5 de poções), gastando 13,5 contra 14,6 mana total e 0 contra 6,8 HP em conjurações. Começou com 181 contra 182 HP e defesa 2 contra 3. Escudos absorveram 0 contra 13; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 0 p.p. e de HP final -7,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 29,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 135,4% do DPS efetivo de mago. Por encontro, recebeu 75,8 contra 128,6 HP de dano; recuperou 18 contra 55,5 HP (18 contra 55,5 de poções), gastando 13,5 contra 12,4 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 184 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 7,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 12,5 p.p.; contraste de -12,5 p.p. e alteração de -19,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 153,6% do DPS efetivo de arqueiro. Por encontro, recebeu 75,8 contra 99,5 HP de dano; recuperou 18 contra 26,3 HP (18 contra 26,3 de poções), gastando 13,5 contra 10 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 176 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 9,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 17,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 126,7% do DPS efetivo de necromante. Por encontro, recebeu 75,8 contra 39 HP de dano; recuperou 18 contra 9 HP (18 contra 9 de poções), gastando 13,5 contra 13 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 179 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 161,3 de dano e receberam 0 contra 45,8. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -15,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 12,5 p.p.; contraste de -12,5 p.p. e alteração de -7,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 97,8% do DPS efetivo de mago. Por encontro, recebeu 147,3 contra 128,6 HP de dano; recuperou 110 contra 55,5 HP (36,5 contra 55,5 de poções), gastando 14,6 contra 12,4 mana total e 6,8 contra 0 HP em conjurações. Começou com 182 contra 184 HP e defesa 3 contra 1. Escudos absorveram 13 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 15,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 12,5 p.p.; contraste de -12,5 p.p. e alteração de -21,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 111% do DPS efetivo de arqueiro. Por encontro, recebeu 147,3 contra 99,5 HP de dano; recuperou 110 contra 26,3 HP (36,5 contra 26,3 de poções), gastando 14,6 contra 10 mana total e 6,8 contra 0 HP em conjurações. Começou com 182 contra 176 HP e defesa 3 contra 2. Escudos absorveram 13 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 17,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -11,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 91,5% do DPS efetivo de necromante. Por encontro, recebeu 147,3 contra 39 HP de dano; recuperou 110 contra 9 HP (36,5 contra 9 de poções), gastando 14,6 contra 13 mana total e 6,8 contra 0 HP em conjurações. Começou com 182 contra 179 HP e defesa 3 contra 1. Escudos absorveram 13 contra 0; invocações causaram 0 contra 161,3 de dano e receberam 0 contra 45,8. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -7,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 12,5 p.p.; contraste de -12,5 p.p. e alteração de -37,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 113,5% do DPS efetivo de arqueiro. Por encontro, recebeu 128,6 contra 99,5 HP de dano; recuperou 55,5 contra 26,3 HP (55,5 contra 26,3 de poções), gastando 12,4 contra 10 mana total e 0 contra 0 HP em conjurações. Começou com 184 contra 176 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 1,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -12,5 p.p.; contraste de 12,5 p.p. e alteração de 14,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 93,6% do DPS efetivo de necromante. Por encontro, recebeu 128,6 contra 39 HP de dano; recuperou 55,5 contra 9 HP (55,5 contra 9 de poções), gastando 12,4 contra 13 mana total e 0 contra 0 HP em conjurações. Começou com 184 contra 179 HP e defesa 1 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 161,3 de dano e receberam 0 contra 45,8. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -23 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -12,5 p.p.; contraste de 12,5 p.p. e alteração de 24,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**arqueiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. arqueiro manteve 82,5% do DPS efetivo de necromante. Por encontro, recebeu 99,5 contra 39 HP de dano; recuperou 26,3 contra 9 HP (26,3 contra 9 de poções), gastando 10 contra 13 mana total e 0 contra 0 HP em conjurações. Começou com 176 contra 179 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 161,3 de dano e receberam 0 contra 45,8. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -24,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 12,5 p.p.; contraste de -12,5 p.p. e alteração de -25,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### O que mudou ao retirar cada fator

**mago, Sem poções de vida:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 29,8 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem habilidades da barra:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 31,4 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 8/8; 0; 0 | 0 | 9,9 | 39 (100% do completo) | 0 / 0 |
| aventureiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | 23,6 | 19,5 (50% do completo) | 0 / 0 |
| aventureiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 2,9 | 39 (100% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 8/8; 0; 0 | 0 | 0,4 | 28 (99,5% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 8/8; 0; 0 | 0 | 8,2 | 28,3 (100,5% do completo) | 0 / 0 |
| guerreiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | -5,6 | 24,5 (87% do completo) | 0 / 0 |
| guerreiro | Defesa plana zerada | 8/8; 0; 0 | 0 | -2,2 | 28 (99,5% do completo) | 0 / 0 |
| mago | Sem poções de vida | 7/8; 1; 0 | 12,5 | 29,8 | 28,4 (98,5% do completo) | 1 / 0 |
| mago | Sem habilidades da barra | 8/8; 0; 0 | 0 | 8,6 | 24,6 (85,3% do completo) | 0 / 0 |
| mago | Defesa plana zerada | 8/8; 0; 0 | 0 | -2,9 | 28,8 (100% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 8/8; 0; 0 | 0 | 14,9 | 25,4 (100% do completo) | 0 / 0 |
| arqueiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | 5,7 | 23,7 (93,5% do completo) | 0 / 0 |
| arqueiro | Defesa plana zerada | 8/8; 0; 0 | 0 | -1,1 | 25,4 (100% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 8/8; 0; 0 | 0 | 5 | 30,8 (100% do completo) | 0 / 0 |
| necromante | Sem habilidades da barra | 7/8; 1; 0 | 12,5 | 31,4 | 16,7 (54,1% do completo) | 1 / 0 |
| necromante | Defesa plana zerada | 8/8; 0; 0 | 0 | 0,6 | 30,8 (100% do completo) | 0 / 0 |

## nível 10 · pesadelo · pressao

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 26,7 s | 14,4 s | 0,1 | 692,5 | 339,4 | 159,8 | 19,6 | 0 |
| guerreiro | 29,5 s | 26,2 s | 0,5 | 882 | 429,9 | 318,4 | 23,9 | 14,3 |
| mago | 16,8 s | 14,8 s | 0,4 | 834,5 | 306 | 148 | 15,9 | 0 |
| arqueiro | — | 16,6 s | 0 | 553,3 | 316 | 140 | 14,4 | 0 |
| necromante | — | 18,2 s | 0 | 357,6 | 325,3 | 146,3 | 9,5 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 8,3 / 7,5 / 144 / 0 | 692,5 / 0 / 0 | 0 | 0 | 10,3 / 5,7 / 0 / 4,1 / 7,1 | 1,4 |
| guerreiro | 0 / 172,4 / 146 / 0 | 815,1 / 66,9 / 0 | 39 | 0 | 12,8 / 9,7 / 0 / 3,3 / 5,4 | 1,1 |
| mago | 0 / 0 / 148 / 0 | 784,5 / 50 / 0 | 4,1 | 0 | 9,2 / 1,6 / 0 / 1,8 / 1,9 | 2,3 |
| arqueiro | 0 / 0 / 140 / 0 | 542,6 / 10,6 / 0 | 0 | 0 | 9,2 / 0,9 / 0 / 2,4 / 6,9 | 2,1 |
| necromante | 0 / 2,3 / 144 / 0 | 193,5 / 0 / 164,1 | 0 | 2,3 | 6,2 / 1,5 / 0 / 2,6 / 0 | 2,1 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 18 / 2,1 | 15,8 / 2 / 4,5 | 0 / 0 | — | 4,5 / 10,6 |
| guerreiro | 27 / 4,4 | 15,8 / 2,8 / 6,4 | 0 / 0 | — | 8 / 14,9 |
| mago | 12,8 / 1 | 20,8 / 3,9 / 7,4 | 1 / 0 | — | 0 / 7,3 |
| arqueiro | 17 / 1,3 | 15,6 / 2,5 / 6,6 | 0 / 0 | — | 0 / 8,4 |
| necromante | 14,9 / 0,4 | 19,6 / 3,6 / 7,5 | 0,8 / 0 | — | 0 / 8,5 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 6 | 354,6 | 0 | 12 | 0 | — |
| aventureiro | explosao | 1,1 | 87,9 | 0 | 3,4 | 0 | — |
| aventureiro | golpe_atordoante | 1 | 31,8 | 0 | 3 | 0 | — |
| aventureiro | ataque_basico | 9,3 | 218,3 | 0 | 0 | 0 | — |
| aventureiro | item:pocao_vida | 2 | 0 | 144 | 0 | 0 | — |
| aventureiro | curar | 0,6 | 0 | 8,3 | 1,3 | 0 | 6,6 |
| aventureiro | efeito:cura_periodica | 0 | 0 | 7,5 | 0 | 0 | — |
| guerreiro | investida | 3 | 119,1 | 0 | 12 | 0 | — |
| guerreiro | redemoinho | 4,8 | 277,1 | 0 | 0 | 14,3 | — |
| guerreiro | efeito:dano_direto | 0 | 66,9 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 172,4 | 0 | 0 | — |
| guerreiro | grito_de_guerra | 1,8 | 0 | 0 | 7 | 0 | — |
| guerreiro | ataque_basico | 15,9 | 418,9 | 0 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 1,6 | 0 | 0 | 4,9 | 0 | — |
| guerreiro | item:pocao_vida | 2 | 0 | 146 | 0 | 0 | — |
| mago | bola_de_fogo | 1,9 | 264,1 | 0 | 5,6 | 0 | — |
| mago | dardo_arcano | 8,5 | 276,5 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 1,1 | 70,9 | 0 | 4,5 | 0 | — |
| mago | raio_em_cadeia | 1 | 173 | 0 | 5 | 0 | — |
| mago | efeito:queimando | 0 | 50 | 0 | 0 | 0 | — |
| mago | item:pocao_vida | 2 | 0 | 148 | 0 | 0 | — |
| mago | barreira | 0,3 | 0 | 0 | 0,8 | 0 | — |
| arqueiro | flecha_perfurante | 2 | 65,8 | 0 | 8 | 0 | — |
| arqueiro | chuva_de_flechas | 1,1 | 104,9 | 0 | 3,4 | 0 | — |
| arqueiro | tiro | 12,9 | 341,5 | 0 | 0 | 0 | — |
| arqueiro | flecha_venenosa | 1 | 30,5 | 0 | 3 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 6,6 | 0 | 0 | 0 | — |
| arqueiro | efeito:dano_direto | 0 | 4 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 2 | 0 | 140 | 0 | 0 | — |
| necromante | dardo_funesto | 2,4 | 40 | 0 | 4,8 | 0 | — |
| necromante | garras_do_ossuario | 1 | 22,8 | 0 | 2 | 0 | — |
| necromante | comando_sepulcral | 1 | 0 | 0 | 2 | 0 | — |
| necromante | toque_funesto | 10,1 | 130,8 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 164,1 | 0 | 0 | 0 | — |
| necromante | efeito:cura | 0 | 0 | 2,3 | 0 | 0 | — |
| necromante | item:pocao_vida | 2 | 0 | 144 | 0 | 0 | — |
| necromante | dizimo_vital | 0,4 | 0 | 0 | 0,8 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 7/8 mortes contra 4/8; 0 contra 0 limites de tempo. aventureiro manteve 109,8% do DPS efetivo de guerreiro. Por encontro, recebeu 339,4 contra 429,9 HP de dano; recuperou 159,8 contra 318,4 HP (144 contra 146 de poções), gastando 19,6 contra 23,9 mana total e 0 contra 14,3 HP em conjurações. Começou com 181 contra 182 HP e defesa 2 contra 3. Escudos absorveram 0 contra 39; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só aventureiro venceu, 4 só guerreiro venceu; diferença de vitória -37,5 p.p. e de HP final -32,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -37,5 para -25 p.p.; contraste de -12,5 p.p. e alteração de -17,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: guerreiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × mago:** 7/8 mortes contra 5/8; 0 contra 0 limites de tempo. aventureiro manteve 65,7% do DPS efetivo de mago. Por encontro, recebeu 339,4 contra 306 HP de dano; recuperou 159,8 contra 148 HP (144 contra 148 de poções), gastando 19,6 contra 15,9 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 184 HP e defesa 2 contra 1. Escudos absorveram 0 contra 4,1; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só aventureiro venceu, 3 só mago venceu; diferença de vitória -25 p.p. e de HP final -10,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -25 para 0 p.p.; contraste de -25 p.p. e alteração de -10,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: mago venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × arqueiro:** 7/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 115,3% do DPS efetivo de arqueiro. Por encontro, recebeu 339,4 contra 316 HP de dano; recuperou 159,8 contra 140 HP (144 contra 140 de poções), gastando 19,6 contra 14,4 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 176 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 12,5 p.p. e de HP final 3,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para 0 p.p.; contraste de 12,5 p.p. e alteração de 3,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × necromante:** 7/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 185,6% do DPS efetivo de necromante. Por encontro, recebeu 339,4 contra 325,3 HP de dano; recuperou 159,8 contra 146,3 HP (144 contra 144 de poções), gastando 19,6 contra 9,5 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 179 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 164,1 de dano e receberam 0 contra 74,3. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 12,5 p.p. e de HP final 3,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para 0 p.p.; contraste de 12,5 p.p. e alteração de 3,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × mago:** 4/8 mortes contra 5/8; 0 contra 0 limites de tempo. guerreiro manteve 59,9% do DPS efetivo de mago. Por encontro, recebeu 429,9 contra 306 HP de dano; recuperou 318,4 contra 148 HP (146 contra 148 de poções), gastando 23,9 contra 15,9 mana total e 14,3 contra 0 HP em conjurações. Começou com 182 contra 184 HP e defesa 3 contra 1. Escudos absorveram 39 contra 4,1; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 2 sementes só guerreiro venceu, 1 só mago venceu; diferença de vitória 12,5 p.p. e de HP final 21,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para 25 p.p.; contraste de -12,5 p.p. e alteração de 6,6 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 4/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 105% do DPS efetivo de arqueiro. Por encontro, recebeu 429,9 contra 316 HP de dano; recuperou 318,4 contra 140 HP (146 contra 140 de poções), gastando 23,9 contra 14,4 mana total e 14,3 contra 0 HP em conjurações. Começou com 182 contra 176 HP e defesa 3 contra 2. Escudos absorveram 39 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 4 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 50 p.p. e de HP final 35,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 50 para 25 p.p.; contraste de 25 p.p. e alteração de 20,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: guerreiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × necromante:** 4/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 169% do DPS efetivo de necromante. Por encontro, recebeu 429,9 contra 325,3 HP de dano; recuperou 318,4 contra 146,3 HP (146 contra 144 de poções), gastando 23,9 contra 9,5 mana total e 14,3 contra 0 HP em conjurações. Começou com 182 contra 179 HP e defesa 3 contra 1. Escudos absorveram 39 contra 0; invocações causaram 0 contra 164,1 de dano e receberam 0 contra 74,3. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 4 sementes só guerreiro venceu, 0 só necromante venceu; diferença de vitória 50 p.p. e de HP final 35,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 50 para 25 p.p.; contraste de 25 p.p. e alteração de 20,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: guerreiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × arqueiro:** 5/8 mortes contra 8/8; 0 contra 0 limites de tempo. mago manteve 175,5% do DPS efetivo de arqueiro. Por encontro, recebeu 306 contra 316 HP de dano; recuperou 148 contra 140 HP (148 contra 140 de poções), gastando 15,9 contra 14,4 mana total e 0 contra 0 HP em conjurações. Começou com 184 contra 176 HP e defesa 1 contra 2. Escudos absorveram 4,1 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 3 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 37,5 p.p. e de HP final 14,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 37,5 para 0 p.p.; contraste de 37,5 p.p. e alteração de 14,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: mago venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × necromante:** 5/8 mortes contra 8/8; 0 contra 0 limites de tempo. mago manteve 282,3% do DPS efetivo de necromante. Por encontro, recebeu 306 contra 325,3 HP de dano; recuperou 148 contra 146,3 HP (148 contra 144 de poções), gastando 15,9 contra 9,5 mana total e 0 contra 0 HP em conjurações. Começou com 184 contra 179 HP e defesa 1 contra 1. Escudos absorveram 4,1 contra 0; invocações causaram 0 contra 164,1 de dano e receberam 0 contra 74,3. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 3 sementes só mago venceu, 0 só necromante venceu; diferença de vitória 37,5 p.p. e de HP final 14,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 37,5 para 0 p.p.; contraste de 37,5 p.p. e alteração de 14,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: mago venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**arqueiro × necromante:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. arqueiro manteve 160,9% do DPS efetivo de necromante. Por encontro, recebeu 316 contra 325,3 HP de dano; recuperou 140 contra 146,3 HP (140 contra 144 de poções), gastando 14,4 contra 9,5 mana total e 0 contra 0 HP em conjurações. Começou com 176 contra 179 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 164,1 de dano e receberam 0 contra 74,3. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### O que mudou ao retirar cada fator

**aventureiro, Sem poções de vida:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 3,2 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**aventureiro, Sem habilidades da barra:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 3,2 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**aventureiro, Defesa plana zerada:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 3,2 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Sem poções de vida:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 20,7 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Sem habilidades da barra:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 10,3 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Defesa plana zerada:** retirar esse fator perdeu 2 vitórias e ganhou 1 nas mesmas 8 condições iniciais. O kit completo teve 5,7 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem poções de vida:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 14,1 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem habilidades da barra:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 14,1 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 0/8; 8; 0 | 12,5 | 3,2 | 39,3 (108,3% do completo) | 1 / 0 |
| aventureiro | Sem habilidades da barra | 0/8; 8; 0 | 12,5 | 3,2 | 21 (57,9% do completo) | 1 / 0 |
| aventureiro | Defesa plana zerada | 0/8; 8; 0 | 12,5 | 3,2 | 32,3 (89% do completo) | 1 / 0 |
| guerreiro | Sem cura do básico | 4/8; 4; 0 | 0 | -2,7 | 35,7 (107,8% do completo) | 1 / 1 |
| guerreiro | Sem poções de vida | 2/8; 6; 0 | 25 | 20,7 | 34,8 (105,2% do completo) | 2 / 0 |
| guerreiro | Sem habilidades da barra | 2/8; 6; 0 | 25 | 10,3 | 25,4 (76,7% do completo) | 2 / 0 |
| guerreiro | Defesa plana zerada | 3/8; 5; 0 | 12,5 | 5,7 | 35,1 (106,3% do completo) | 2 / 1 |
| mago | Sem poções de vida | 0/8; 8; 0 | 37,5 | 14,1 | 64,5 (116,8% do completo) | 3 / 0 |
| mago | Sem habilidades da barra | 0/8; 8; 0 | 37,5 | 14,1 | 21 (38% do completo) | 3 / 0 |
| mago | Defesa plana zerada | 3/8; 5; 0 | 0 | 1,6 | 55,9 (101,2% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 32,9 (104,4% do completo) | 0 / 0 |
| arqueiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 25,3 (80,3% do completo) | 0 / 0 |
| arqueiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 31,1 (98,8% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 23,1 (117,9% do completo) | 0 / 0 |
| necromante | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 14,9 (75,9% do completo) | 0 / 0 |
| necromante | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 19,6 (99,9% do completo) | 0 / 0 |

## nível 10 · pesadelo · atrito

### Onde o desgaste aparece

| Classe | Onda | Chegaram/n inicial | Mortes / limites nesta onda | HP entrada → saída | Mana entrada → saída | Recebido / cura / mana gasta |
|---|---|---|---|---|---|---|
| aventureiro | 1 | 8/8 | 0 / 0 | 181 → 126,9 | 10 → 0,8 | 54,1 / 0 / 13 |
| aventureiro | 2 | 8/8 | 0 / 0 | 126,9 → 101,1 | 0,8 → 0,4 | 155,6 / 122,6 / 8,6 |
| aventureiro | 3 | 8/8 | 1 / 0 | 101,1 → 57,1 | 0,4 → 0,7 | 73 / 21 / 7,6 |
| aventureiro | 4 | 7/8 | 6 / 0 | 65,3 → 2,4 | 0,8 → 0,7 | 85,1 / 18 / 4,7 |
| aventureiro | 5 | 1/8 | 1 / 0 | 17 → 0 | 0 → 0 | 21 / 0 / 2 |
| guerreiro | 1 | 8/8 | 0 / 0 | 182 → 146,5 | 10 → 1,5 | 156,3 / 127,1 / 13,5 |
| guerreiro | 2 | 8/8 | 0 / 0 | 146,5 → 127,6 | 1,5 → 2,2 | 159,9 / 139,4 / 8,5 |
| guerreiro | 3 | 8/8 | 1 / 0 | 127,6 → 134,5 | 2,2 → 1,5 | 61,1 / 68,4 / 7,4 |
| guerreiro | 4 | 7/8 | 2 / 0 | 153,7 → 110,4 | 1,3 → 1,4 | 142,3 / 101 / 6,3 |
| guerreiro | 5 | 5/8 | 1 / 0 | 154,6 → 125,6 | 1,5 → 2 | 95,6 / 71 / 4 |
| mago | 1 | 8/8 | 0 / 0 | 184 → 112,4 | 12 → 5 | 117,9 / 46,3 / 12 |
| mago | 2 | 8/8 | 1 / 0 | 112,4 → 76,3 | 5 → 7,3 | 119,4 / 83,3 / 3,4 |
| mago | 3 | 7/8 | 2 / 0 | 87,1 → 36,4 | 7,4 → 2,1 | 61,3 / 10,6 / 9,6 |
| mago | 4 | 5/8 | 5 / 0 | 51 → 0 | 1,8 → 3,1 | 51,4 / 0 / 1,2 |
| arqueiro | 1 | 8/8 | 0 / 0 | 176 → 129,8 | 10 → 5 | 63,8 / 17,5 / 10 |
| arqueiro | 2 | 8/8 | 1 / 0 | 129,8 → 64,9 | 5 → 5,5 | 117,4 / 52,5 / 4,8 |
| arqueiro | 3 | 7/8 | 2 / 0 | 74,1 → 49 | 6,3 → 1,3 | 75,1 / 50 / 8,7 |
| arqueiro | 4 | 5/8 | 5 / 0 | 68,6 → 0 | 1,2 → 3,7 | 83,8 / 14 / 2,4 |
| necromante | 1 | 8/8 | 0 / 0 | 179 → 158,6 | 12 → 4,4 | 20,4 / 0 / 12,3 |
| necromante | 2 | 8/8 | 0 / 0 | 158,6 → 104,6 | 4,4 → 5,9 | 63 / 9 / 5,5 |
| necromante | 3 | 8/8 | 0 / 0 | 104,6 → 129,4 | 5,9 → 2,1 | 16,4 / 9,4 / 20,5 |
| necromante | 4 | 8/8 | 0 / 0 | 129,4 → 106,6 | 2,1 → 4,3 | 54,8 / 27 / 5,8 |
| necromante | 5 | 8/8 | 1 / 0 | 106,6 → 96 | 4,3 → 5,1 | 30,4 / 18 / 4 |

Médias de cada onda incluem apenas quem chegou a ela; o denominador inicial mostra a seleção dos sobreviventes. Não compare a vida da onda 5 como se incluísse quem morreu antes.

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | — | 40,4 s | 3 | 1.134,6 | 359,9 | 159,4 | 33,6 | 0 |
| guerreiro | 51,3 s | 53,4 s | 4 | 1.447 | 561,5 | 467,6 | 37,4 | 26,6 |
| mago | — | 32,6 s | 2,5 | 976,4 | 323 | 138,8 | 24,5 | 0 |
| arqueiro | — | 41,4 s | 2,5 | 1.004,8 | 299,3 | 122,5 | 23,9 | 0 |
| necromante | 63,9 s | 63,2 s | 4,9 | 1.607,3 | 184,9 | 63,4 | 48 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 8,3 / 7,1 / 144 / 0 | 1.134,6 / 0 / 0 | 0 | 0 | 19,7 / 13,4 / 0 / 6,2 / 17 | 1,3 |
| guerreiro | 0 / 321,6 / 146 / 0 | 1.380,6 / 66,4 / 0 | 61,8 | 0 | 24 / 11,5 / 0 / 5,7 / 11,5 | 0,8 |
| mago | 0 / 0 / 138,8 / 0 | 919,9 / 56,5 / 0 | 24,8 | 0 | 18,4 / 2 / 0 / 5,4 / 7,1 | 2,5 |
| arqueiro | 0 / 0 / 122,5 / 0 | 997,3 / 7,5 / 0 | 0 | 0 | 18,1 / 1,8 / 0 / 4,8 / 13 | 2,4 |
| necromante | 0 / 9,4 / 54 / 0 | 678,3 / 0 / 929 | 0 | 9,4 | 23 / 15,8 / 0 / 0,4 / 12,2 | 3,1 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 36,3 / 5,1 | 29,9 / 5,8 / 11,6 | 0 / 0 | — | 19,5 / 24,3 |
| guerreiro | 50,8 / 8,3 | 28,6 / 4,8 / 10,6 | 0,1 / 0 | — | 17 / 29,3 |
| mago | 26 / 2,1 | 21,6 / 4,1 / 8,1 | 0 / 0,3 | — | 0,3 / 15,9 |
| arqueiro | 31,3 / 0,9 | 29,1 / 4,3 / 12,9 | 0 / 0,1 | — | 0,8 / 16,6 |
| necromante | 55,8 / 3,4 | 89 / 13,6 / 35,9 | 3,3 / 0 | — | 38,5 / 41,1 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 11,3 | 498,5 | 0 | 22,5 | 0 | — |
| aventureiro | explosao | 1,1 | 55,4 | 0 | 3,4 | 0 | — |
| aventureiro | golpe_atordoante | 2 | 84,6 | 0 | 6 | 0 | — |
| aventureiro | ataque_basico | 21 | 496,1 | 0 | 0 | 0 | — |
| aventureiro | item:pocao_vida | 2 | 0 | 144 | 0 | 0 | — |
| aventureiro | curar | 0,9 | 0 | 8,3 | 1,8 | 0 | 4,7 |
| aventureiro | efeito:cura_periodica | 0 | 0 | 7,1 | 0 | 0 | — |
| guerreiro | investida | 5,3 | 268,8 | 0 | 21 | 0 | — |
| guerreiro | redemoinho | 8,9 | 209,8 | 0 | 0 | 26,6 | — |
| guerreiro | grito_de_guerra | 2,1 | 0 | 0 | 8,5 | 0 | — |
| guerreiro | ataque_basico | 31,9 | 902,1 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 321,6 | 0 | 0 | — |
| guerreiro | efeito:dano_direto | 0 | 66,4 | 0 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 2,6 | 0 | 0 | 7,9 | 0 | — |
| guerreiro | item:pocao_vida | 2 | 0 | 146 | 0 | 0 | — |
| mago | bola_de_fogo | 3,8 | 300,5 | 0 | 11,3 | 0 | — |
| mago | dardo_arcano | 19 | 529,3 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 1,5 | 23,5 | 0 | 6 | 0 | — |
| mago | raio_em_cadeia | 1 | 66,6 | 0 | 5 | 0 | — |
| mago | item:pocao_vida | 1,9 | 0 | 138,8 | 0 | 0 | — |
| mago | efeito:queimando | 0 | 56,5 | 0 | 0 | 0 | — |
| mago | barreira | 0,8 | 0 | 0 | 2,3 | 0 | — |
| arqueiro | flecha_perfurante | 2,9 | 131,8 | 0 | 11,5 | 0 | — |
| arqueiro | chuva_de_flechas | 2,4 | 109,9 | 0 | 7,1 | 0 | — |
| arqueiro | flecha_venenosa | 1,8 | 52,4 | 0 | 5,3 | 0 | — |
| arqueiro | tiro | 24,3 | 703,3 | 0 | 0 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 7,5 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 1,8 | 0 | 122,5 | 0 | 0 | — |
| necromante | dardo_funesto | 14 | 218,4 | 0 | 28 | 0 | — |
| necromante | garras_do_ossuario | 5,8 | 118,4 | 0 | 11,5 | 0 | — |
| necromante | comando_sepulcral | 3,1 | 0 | 0 | 6,3 | 0 | — |
| necromante | toque_funesto | 31,8 | 341,5 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 929 | 0 | 0 | 0 | — |
| necromante | efeito:cura | 0 | 0 | 9,4 | 0 | 0 | — |
| necromante | item:pocao_vida | 0,8 | 0 | 54 | 0 | 0 | — |
| necromante | dizimo_vital | 1,1 | 0 | 0 | 2,3 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 8/8 mortes contra 4/8; 0 contra 0 limites de tempo. aventureiro manteve 102,9% do DPS efetivo de guerreiro. Por encontro, recebeu 359,9 contra 561,5 HP de dano; recuperou 159,4 contra 467,6 HP (144 contra 146 de poções), gastando 33,6 contra 37,4 mana total e 0 contra 26,6 HP em conjurações. Começou com 181 contra 182 HP e defesa 2 contra 3. Escudos absorveram 0 contra 61,8; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 4 só guerreiro venceu; diferença de vitória -50 p.p. e de HP final -43,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -50 para -87,5 p.p.; contraste de 37,5 p.p. e alteração de 41,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: guerreiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × mago:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 94,6% do DPS efetivo de mago. Por encontro, recebeu 359,9 contra 323 HP de dano; recuperou 159,4 contra 138,8 HP (144 contra 138,8 de poções), gastando 33,6 contra 24,5 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 184 HP e defesa 2 contra 1. Escudos absorveram 0 contra 24,8; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 98,7% do DPS efetivo de arqueiro. Por encontro, recebeu 359,9 contra 299,3 HP de dano; recuperou 159,4 contra 122,5 HP (144 contra 122,5 de poções), gastando 33,6 contra 23,9 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 176 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 8/8 mortes contra 1/8; 0 contra 0 limites de tempo. aventureiro manteve 116,3% do DPS efetivo de necromante. Por encontro, recebeu 359,9 contra 184,9 HP de dano; recuperou 159,4 contra 63,4 HP (144 contra 54 de poções), gastando 33,6 contra 48 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 179 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 929 de dano e receberam 0 contra 336,6. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 7 só necromante venceu; diferença de vitória -87,5 p.p. e de HP final -53,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -87,5 para 0 p.p.; contraste de -87,5 p.p. e alteração de -46,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × mago:** 4/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 91,9% do DPS efetivo de mago. Por encontro, recebeu 561,5 contra 323 HP de dano; recuperou 467,6 contra 138,8 HP (146 contra 138,8 de poções), gastando 37,4 contra 24,5 mana total e 26,6 contra 0 HP em conjurações. Começou com 182 contra 184 HP e defesa 3 contra 1. Escudos absorveram 61,8 contra 24,8; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 4 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 50 p.p. e de HP final 43,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 50 para 87,5 p.p.; contraste de -37,5 p.p. e alteração de -41,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: guerreiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × arqueiro:** 4/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 95,9% do DPS efetivo de arqueiro. Por encontro, recebeu 561,5 contra 299,3 HP de dano; recuperou 467,6 contra 122,5 HP (146 contra 122,5 de poções), gastando 37,4 contra 23,9 mana total e 26,6 contra 0 HP em conjurações. Começou com 182 contra 176 HP e defesa 3 contra 2. Escudos absorveram 61,8 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 4 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 50 p.p. e de HP final 43,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 50 para 87,5 p.p.; contraste de -37,5 p.p. e alteração de -41,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: guerreiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × necromante:** 4/8 mortes contra 1/8; 0 contra 0 limites de tempo. guerreiro manteve 113% do DPS efetivo de necromante. Por encontro, recebeu 561,5 contra 184,9 HP de dano; recuperou 467,6 contra 63,4 HP (146 contra 54 de poções), gastando 37,4 contra 48 mana total e 26,6 contra 0 HP em conjurações. Começou com 182 contra 179 HP e defesa 3 contra 1. Escudos absorveram 61,8 contra 0; invocações causaram 0 contra 929 de dano e receberam 0 contra 336,6. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 3 só necromante venceu; diferença de vitória -37,5 p.p. e de HP final -10,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -37,5 para 87,5 p.p.; contraste de -125 p.p. e alteração de -88,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. mago manteve 104,3% do DPS efetivo de arqueiro. Por encontro, recebeu 323 contra 299,3 HP de dano; recuperou 138,8 contra 122,5 HP (138,8 contra 122,5 de poções), gastando 24,5 contra 23,9 mana total e 0 contra 0 HP em conjurações. Começou com 184 contra 176 HP e defesa 1 contra 2. Escudos absorveram 24,8 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × necromante:** 8/8 mortes contra 1/8; 0 contra 0 limites de tempo. mago manteve 123% do DPS efetivo de necromante. Por encontro, recebeu 323 contra 184,9 HP de dano; recuperou 138,8 contra 63,4 HP (138,8 contra 54 de poções), gastando 24,5 contra 48 mana total e 0 contra 0 HP em conjurações. Começou com 184 contra 179 HP e defesa 1 contra 1. Escudos absorveram 24,8 contra 0; invocações causaram 0 contra 929 de dano e receberam 0 contra 336,6. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 7 só necromante venceu; diferença de vitória -87,5 p.p. e de HP final -53,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -87,5 para 0 p.p.; contraste de -87,5 p.p. e alteração de -46,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**arqueiro × necromante:** 8/8 mortes contra 1/8; 0 contra 0 limites de tempo. arqueiro manteve 117,8% do DPS efetivo de necromante. Por encontro, recebeu 299,3 contra 184,9 HP de dano; recuperou 122,5 contra 63,4 HP (122,5 contra 54 de poções), gastando 23,9 contra 48 mana total e 0 contra 0 HP em conjurações. Começou com 176 contra 179 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 929 de dano e receberam 0 contra 336,6. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 7 só necromante venceu; diferença de vitória -87,5 p.p. e de HP final -53,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -87,5 para 0 p.p.; contraste de -87,5 p.p. e alteração de -46,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### O que mudou ao retirar cada fator

**guerreiro, Sem cura do básico:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 18,1 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Sem poções de vida:** retirar esse fator perdeu 2 vitórias e ganhou 1 nas mesmas 8 condições iniciais. O kit completo teve 5,6 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Defesa plana zerada:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 5,6 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem poções de vida:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 14,9 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem habilidades da barra:** retirar esse fator perdeu 7 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 46,5 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 32,7 (111,7% do completo) | 0 / 0 |
| aventureiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 19,5 (66,4% do completo) | 0 / 0 |
| aventureiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 30,7 (104,8% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 2/8; 6; 0 | 25 | 18,1 | 27,9 (98% do completo) | 2 / 0 |
| guerreiro | Sem poções de vida | 3/8; 5; 0 | 12,5 | 5,6 | 30,7 (107,7% do completo) | 2 / 1 |
| guerreiro | Sem habilidades da barra | 7/8; 1; 0 | -37,5 | -41,8 | 24,2 (84,7% do completo) | 1 / 4 |
| guerreiro | Defesa plana zerada | 3/8; 5; 0 | 12,5 | 5,6 | 28,1 (98,7% do completo) | 1 / 0 |
| mago | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 28,8 (93% do completo) | 0 / 0 |
| mago | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 23,3 (75% do completo) | 0 / 0 |
| mago | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 30,6 (98,7% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 30,5 (102,5% do completo) | 0 / 0 |
| arqueiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 23,8 (80% do completo) | 0 / 0 |
| arqueiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 29,5 (99,2% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 6/8; 2; 0 | 12,5 | 14,9 | 25,3 (100,1% do completo) | 1 / 0 |
| necromante | Sem habilidades da barra | 0/8; 6; 2 | 87,5 | 46,5 | 14,6 (58% do completo) | 7 / 0 |
| necromante | Defesa plana zerada | 7/8; 1; 0 | 0 | 0,9 | 24,9 (98,7% do completo) | 0 / 0 |

## nível 10 · pesadelo · chefe

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 24,7 s | 19,2 s | 0,8 | 651,3 | 283,6 | 126 | 21,3 | 0 |
| guerreiro | 19,6 s | — | 1 | 678 | 133,4 | 110 | 16,1 | 9,8 |
| mago | 17,8 s | — | 1 | 700,1 | 69,5 | 27,8 | 18,8 | 0 |
| arqueiro | 24,6 s | 26,5 s | 0,5 | 630,1 | 242,1 | 113,8 | 16 | 0 |
| necromante | 27,4 s | — | 1 | 702 | 69,8 | 9 | 26,3 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 0 / 0 / 126 / 0 | 651,3 / 0 / 0 | 0 | 0 | 11,9 / 5,8 / 2,3 / 1,9 / 8,6 | 1,1 |
| guerreiro | 0 / 73,5 / 36,5 / 0 | 646,9 / 31,1 / 0 | 6,5 | 0 | 8,4 / 2,4 / 1,7 / 0 / 0,9 | 0,6 |
| mago | 0 / 0 / 27,8 / 0 | 668,5 / 31,6 / 0 | 0 | 0 | 12 / 8,9 / 0,5 / 0 / 4,6 | 2,3 |
| arqueiro | 0 / 0 / 113,8 / 0 | 608,9 / 21,3 / 0 | 0 | 0 | 13,3 / 7,5 / 1,7 / 1,8 / 9,3 | 2,1 |
| necromante | 0 / 0 / 9 / 0 | 393,6 / 0 / 308,4 | 0 | 0 | 11,5 / 12,9 / 0,3 / 0 / 4,5 | 2,3 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 21,8 / 3,4 | 17 / 3,5 / 6,4 | 0 / 0 | bloqueado: 14,4 | 0 / 11,5 |
| guerreiro | 17,8 / 2,9 | 12 / 1,8 / 3,9 | 0 / 0 | — | 0 / 8,1 |
| mago | 16 / 2 | 14,5 / 2,1 / 6,5 | 0,6 / 0 | — | 0 / 9,4 |
| arqueiro | 24,3 / 3,6 | 19,5 / 2,9 / 8,8 | 0 / 0 | — | 0 / 12,9 |
| necromante | 27,6 / 1,5 | 35 / 5,6 / 14,3 | 2 / 0 | — | 6 / 15,5 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 7,6 | 311,8 | 0 | 15,3 | 0 | — |
| aventureiro | explosao | 1 | 62,1 | 0 | 3 | 0 | — |
| aventureiro | golpe_atordoante | 1 | 30,4 | 0 | 3 | 0 | — |
| aventureiro | ataque_basico | 12,1 | 247 | 0 | 0 | 0 | — |
| aventureiro | item:pocao_vida | 1,8 | 0 | 126 | 0 | 0 | — |
| guerreiro | investida | 2,5 | 133,8 | 0 | 10 | 0 | — |
| guerreiro | redemoinho | 3,3 | 166,9 | 0 | 0 | 9,8 | — |
| guerreiro | grito_de_guerra | 1,3 | 0 | 0 | 5 | 0 | — |
| guerreiro | ataque_basico | 10,4 | 346,3 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 73,5 | 0 | 0 | — |
| guerreiro | efeito:dano_direto | 0 | 31,1 | 0 | 0 | 0 | — |
| guerreiro | item:pocao_vida | 0,5 | 0 | 36,5 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 0,4 | 0 | 0 | 1,1 | 0 | — |
| mago | bola_de_fogo | 3,1 | 190,4 | 0 | 9,4 | 0 | — |
| mago | dardo_arcano | 10,8 | 308,8 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 1 | 87,9 | 0 | 4 | 0 | — |
| mago | raio_em_cadeia | 1 | 81,5 | 0 | 5 | 0 | — |
| mago | efeito:queimando | 0 | 31,6 | 0 | 0 | 0 | — |
| mago | item:pocao_vida | 0,4 | 0 | 27,8 | 0 | 0 | — |
| mago | barreira | 0,1 | 0 | 0 | 0,4 | 0 | — |
| arqueiro | flecha_perfurante | 1 | 0 | 0 | 4 | 0 | — |
| arqueiro | chuva_de_flechas | 2 | 81,4 | 0 | 6 | 0 | — |
| arqueiro | tiro | 19,3 | 452,5 | 0 | 0 | 0 | — |
| arqueiro | flecha_venenosa | 2 | 75 | 0 | 6 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 18,3 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 1,6 | 0 | 113,8 | 0 | 0 | — |
| arqueiro | efeito:dano_direto | 0 | 3 | 0 | 0 | 0 | — |
| necromante | dardo_funesto | 7,5 | 145,8 | 0 | 15 | 0 | — |
| necromante | garras_do_ossuario | 2,9 | 75,1 | 0 | 5,8 | 0 | — |
| necromante | comando_sepulcral | 1,6 | 0 | 0 | 3,3 | 0 | — |
| necromante | toque_funesto | 14,5 | 172,8 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 308,4 | 0 | 0 | 0 | — |
| necromante | dizimo_vital | 1,1 | 0 | 0 | 2,3 | 0 | — |
| necromante | item:pocao_vida | 0,1 | 0 | 9 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 2/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 69,9% do DPS efetivo de guerreiro. Por encontro, recebeu 283,6 contra 133,4 HP de dano; recuperou 126 contra 110 HP (126 contra 36,5 de poções), gastando 21,3 contra 16,1 mana total e 0 contra 9,8 HP em conjurações. Começou com 181 contra 182 HP e defesa 2 contra 3. Escudos absorveram 0 contra 6,5; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 2 só guerreiro venceu; diferença de vitória -25 p.p. e de HP final -68,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -25 para -87,5 p.p.; contraste de 62,5 p.p. e alteração de 25,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: guerreiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × mago:** 2/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 74,7% do DPS efetivo de mago. Por encontro, recebeu 283,6 contra 69,5 HP de dano; recuperou 126 contra 27,8 HP (126 contra 27,8 de poções), gastando 21,3 contra 18,8 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 184 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 2 só mago venceu; diferença de vitória -25 p.p. e de HP final -64,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -25 para -87,5 p.p.; contraste de 62,5 p.p. e alteração de -6,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: mago venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × arqueiro:** 2/8 mortes contra 4/8; 0 contra 0 limites de tempo. aventureiro manteve 115,7% do DPS efetivo de arqueiro. Por encontro, recebeu 283,6 contra 242,1 HP de dano; recuperou 126 contra 113,8 HP (126 contra 113,8 de poções), gastando 21,3 contra 16 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 176 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 3 sementes só aventureiro venceu, 1 só arqueiro venceu; diferença de vitória 25 p.p. e de HP final -14,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 25 para -62,5 p.p.; contraste de 87,5 p.p. e alteração de 30,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × necromante:** 2/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 104,2% do DPS efetivo de necromante. Por encontro, recebeu 283,6 contra 69,8 HP de dano; recuperou 126 contra 9 HP (126 contra 9 de poções), gastando 21,3 contra 26,3 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 179 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 308,4 de dano e receberam 0 contra 116,9. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 2 só necromante venceu; diferença de vitória -25 p.p. e de HP final -56,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -25 para -75 p.p.; contraste de 50 p.p. e alteração de 0,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 106,8% do DPS efetivo de mago. Por encontro, recebeu 133,4 contra 69,5 HP de dano; recuperou 110 contra 27,8 HP (36,5 contra 27,8 de poções), gastando 16,1 contra 18,8 mana total e 9,8 contra 0 HP em conjurações. Começou com 182 contra 184 HP e defesa 3 contra 1. Escudos absorveram 6,5 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 4,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 37,5 p.p.; contraste de -37,5 p.p. e alteração de -63,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 0/8 mortes contra 4/8; 0 contra 0 limites de tempo. guerreiro manteve 165,4% do DPS efetivo de arqueiro. Por encontro, recebeu 133,4 contra 242,1 HP de dano; recuperou 110 contra 113,8 HP (36,5 contra 113,8 de poções), gastando 16,1 contra 16 mana total e 9,8 contra 0 HP em conjurações. Começou com 182 contra 176 HP e defesa 3 contra 2. Escudos absorveram 6,5 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 4 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 50 p.p. e de HP final 54,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 50 para 25 p.p.; contraste de 25 p.p. e alteração de 4,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: guerreiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 149,1% do DPS efetivo de necromante. Por encontro, recebeu 133,4 contra 69,8 HP de dano; recuperou 110 contra 9 HP (36,5 contra 9 de poções), gastando 16,1 contra 26,3 mana total e 9,8 contra 0 HP em conjurações. Começou com 182 contra 179 HP e defesa 3 contra 1. Escudos absorveram 6,5 contra 0; invocações causaram 0 contra 308,4 de dano e receberam 0 contra 116,9. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final 12,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 62,5 p.p.; contraste de -62,5 p.p. e alteração de -61,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × arqueiro:** 0/8 mortes contra 4/8; 0 contra 0 limites de tempo. mago manteve 154,9% do DPS efetivo de arqueiro. Por encontro, recebeu 69,5 contra 242,1 HP de dano; recuperou 27,8 contra 113,8 HP (27,8 contra 113,8 de poções), gastando 18,8 contra 16 mana total e 0 contra 0 HP em conjurações. Começou com 184 contra 176 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 4 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 50 p.p. e de HP final 50,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 50 para -12,5 p.p.; contraste de 62,5 p.p. e alteração de 67,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: mago venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 139,6% do DPS efetivo de necromante. Por encontro, recebeu 69,5 contra 69,8 HP de dano; recuperou 27,8 contra 9 HP (27,8 contra 9 de poções), gastando 18,8 contra 26,3 mana total e 0 contra 0 HP em conjurações. Começou com 184 contra 179 HP e defesa 1 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 308,4 de dano e receberam 0 contra 116,9. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final 7,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 25 p.p.; contraste de -25 p.p. e alteração de 1,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**arqueiro × necromante:** 4/8 mortes contra 0/8; 0 contra 0 limites de tempo. arqueiro manteve 90,1% do DPS efetivo de necromante. Por encontro, recebeu 242,1 contra 69,8 HP de dano; recuperou 113,8 contra 9 HP (113,8 contra 9 de poções), gastando 16 contra 26,3 mana total e 0 contra 0 HP em conjurações. Começou com 176 contra 179 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 308,4 de dano e receberam 0 contra 116,9. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 4 só necromante venceu; diferença de vitória -50 p.p. e de HP final -42,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -50 para 37,5 p.p.; contraste de -87,5 p.p. e alteração de -65,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

### O que mudou ao retirar cada fator

**aventureiro, Sem poções de vida:** retirar esse fator perdeu 5 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 8,4 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**aventureiro, Sem habilidades da barra:** retirar esse fator perdeu 5 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 11,9 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**aventureiro, Defesa plana zerada:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve -0,1 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Sem poções de vida:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 24,2 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem habilidades da barra:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 49,3 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem poções de vida:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 18,5 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem poções de vida:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 8 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem habilidades da barra:** retirar esse fator perdeu 5 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 47,4 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 1/8; 7; 0 | 62,5 | 8,4 | 28 (102,5% do completo) | 5 / 0 |
| aventureiro | Sem habilidades da barra | 1/8; 7; 0 | 62,5 | 11,9 | 17,8 (65,2% do completo) | 5 / 0 |
| aventureiro | Defesa plana zerada | 3/8; 5; 0 | 37,5 | -0,1 | 28,3 (103,5% do completo) | 3 / 0 |
| guerreiro | Sem cura do básico | 8/8; 0; 0 | 0 | 1,9 | 40,2 (103% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 6/8; 2; 0 | 25 | 24,2 | 39,7 (101,8% do completo) | 2 / 0 |
| guerreiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | -14 | 22,4 (57,4% do completo) | 0 / 0 |
| guerreiro | Defesa plana zerada | 8/8; 0; 0 | 0 | -0,4 | 40,8 (104,4% do completo) | 0 / 0 |
| mago | Sem poções de vida | 8/8; 0; 0 | 0 | 14,7 | 36,6 (100% do completo) | 0 / 0 |
| mago | Sem habilidades da barra | 5/8; 3; 0 | 37,5 | 49,3 | 21,6 (59,1% do completo) | 3 / 0 |
| mago | Defesa plana zerada | 8/8; 0; 0 | 0 | 1,6 | 36,6 (100% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 2/8; 6; 0 | 25 | 18,5 | 24,7 (104,6% do completo) | 2 / 0 |
| arqueiro | Sem habilidades da barra | 6/8; 2; 0 | -25 | -18,3 | 23,6 (99,9% do completo) | 1 / 3 |
| arqueiro | Defesa plana zerada | 4/8; 4; 0 | 0 | 3,2 | 23,9 (101,3% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 7/8; 1; 0 | 12,5 | 8 | 26,4 (100,7% do completo) | 1 / 0 |
| necromante | Sem habilidades da barra | 3/8; 5; 0 | 62,5 | 47,4 | 14,4 (55,1% do completo) | 5 / 0 |
| necromante | Defesa plana zerada | 8/8; 0; 0 | 0 | 1,3 | 26,2 (100% do completo) | 0 / 0 |

## nível 30 · normal · duelo

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 8,6 s | — | 1 | 917 | 82,1 | 17,8 | 15,6 | 0 |
| guerreiro | 25,8 s | — | 1 | 917 | 346 | 288,8 | 27,1 | 12 |
| mago | 10,4 s | — | 1 | 917 | 41,1 | 0 | 20,5 | 0 |
| arqueiro | 7,3 s | — | 1 | 917 | 0 | 0 | 20,8 | 0 |
| necromante | 12,4 s | — | 1 | 917 | 30,6 | 0 | 19,8 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 1,5 / 0 / 16,3 / 0 | 917 / 0 / 0 | 0 | 0 | 6,8 / 1,8 / 0 / 0 / 0 | 1,1 |
| guerreiro | 0 / 195,8 / 93 / 0 | 818,8 / 98,3 / 0 | 89,5 | 0 | 10,1 / 0,4 / 8,1 / 0 / 0 | 0 |
| mago | 0 / 0 / 0 / 0 | 844,5 / 72,5 / 0 | 0 | 0 | 7,7 / 2,9 / 0 / 0 / 0 | 2,3 |
| arqueiro | 0 / 0 / 0 / 0 | 892,6 / 24,4 / 0 | 0 | 0 | 6,7 / 2 / 0 / 0 / 0 | 2,5 |
| necromante | 0 / 0 / 0 / 0 | 497,8 / 0 / 419,3 | 9,8 | 0 | 7,7 / 2,7 / 0 / 0 / 0 | 2,5 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 9,6 / 0,3 | 9,3 / 1,9 / 3 | 0 / 0 | — | 0 / 6,1 |
| guerreiro | 22,1 / 2,9 | 9,1 / 1,5 / 3,4 | 0 / 0 | bloqueado: 136,1 | 0 / 19,6 |
| mago | 10,1 / 2 | 6,5 / 0,9 / 2,4 | 0,3 / 0,1 | — | 0 / 7,1 |
| arqueiro | 12,3 / 2,8 | 8,4 / 0,6 / 3,5 | 0 / 0 | — | 0 / 5,3 |
| necromante | 19,4 / 1,5 | 20,6 / 2,8 / 8,3 | 1,1 / 0 | — | 0 / 7,6 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 3,6 | 428 | 0 | 7,3 | 0 | — |
| aventureiro | explosao | 1,8 | 183,1 | 0 | 5,3 | 0 | — |
| aventureiro | golpe_atordoante | 1 | 123,3 | 0 | 3 | 0 | — |
| aventureiro | ataque_basico | 3,1 | 182,6 | 0 | 0 | 0 | — |
| aventureiro | item:pocao_vida | 0,1 | 0 | 16,3 | 0 | 0 | — |
| aventureiro | curar | 0,1 | 0 | 1,5 | 0,1 | 0 | 12 |
| guerreiro | investida | 3,9 | 150,8 | 0 | 15,5 | 0 | — |
| guerreiro | redemoinho | 4 | 0 | 0 | 0 | 12 | — |
| guerreiro | efeito:dano_direto | 0 | 98,3 | 0 | 0 | 0 | — |
| guerreiro | grito_de_guerra | 1,9 | 0 | 0 | 7,5 | 0 | — |
| guerreiro | ataque_basico | 11 | 668 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 195,8 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 1,4 | 0 | 0 | 4,1 | 0 | — |
| guerreiro | item:pocao_vida | 0,8 | 0 | 93 | 0 | 0 | — |
| mago | bola_de_fogo | 2 | 342 | 0 | 6 | 0 | — |
| mago | dardo_arcano | 4,9 | 219,6 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 1,8 | 52,1 | 0 | 7 | 0 | — |
| mago | raio_em_cadeia | 1,5 | 230,8 | 0 | 7,5 | 0 | — |
| mago | efeito:dano_direto | 0 | 20,9 | 0 | 0 | 0 | — |
| mago | efeito:queimando | 0 | 51,6 | 0 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 1,9 | 148,4 | 0 | 7,5 | 0 | — |
| arqueiro | chuva_de_flechas | 1,3 | 178,3 | 0 | 5 | 0 | — |
| arqueiro | flecha_venenosa | 1 | 96,6 | 0 | 3 | 0 | — |
| arqueiro | tiro_em_leque | 1,8 | 204,4 | 0 | 5,3 | 0 | — |
| arqueiro | tiro | 6,4 | 265 | 0 | 0 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 17,6 | 0 | 0 | 0 | — |
| arqueiro | efeito:dano_direto | 0 | 6,8 | 0 | 0 | 0 | — |
| necromante | dardo_funesto | 4,9 | 192,4 | 0 | 9,8 | 0 | — |
| necromante | garras_do_ossuario | 2,6 | 94,6 | 0 | 5,3 | 0 | — |
| necromante | comando_sepulcral | 1,8 | 0 | 0 | 3,5 | 0 | — |
| necromante | toque_funesto | 9,5 | 210,8 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 419,3 | 0 | 0 | 0 | — |
| necromante | dizimo_vital | 0,6 | 0 | 0 | 1,3 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 292,2% do DPS efetivo de guerreiro. Por encontro, recebeu 82,1 contra 346 HP de dano; recuperou 17,8 contra 288,8 HP (16,3 contra 93 de poções), gastando 15,6 contra 27,1 mana total e 0 contra 12 HP em conjurações. Começou com 325 contra 310 HP e defesa 2 contra 3. Escudos absorveram 0 contra 89,5; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 0 p.p. e de HP final 2,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 54,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 118,4% do DPS efetivo de mago. Por encontro, recebeu 82,1 contra 41,1 HP de dano; recuperou 17,8 contra 0 HP (16,3 contra 0 de poções), gastando 15,6 contra 20,5 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final -7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 16,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 94,1% do DPS efetivo de arqueiro. Por encontro, recebeu 82,1 contra 0 HP de dano; recuperou 17,8 contra 0 HP (16,3 contra 0 de poções), gastando 15,6 contra 20,8 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final -19,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 8,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 164,1% do DPS efetivo de necromante. Por encontro, recebeu 82,1 contra 30,6 HP de dano; recuperou 17,8 contra 0 HP (16,3 contra 0 de poções), gastando 15,6 contra 19,8 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 315 HP e defesa 2 contra 1. Escudos absorveram 0 contra 9,8; invocações causaram 0 contra 419,3 de dano e receberam 0 contra 67,4. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -10,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 40,5% do DPS efetivo de mago. Por encontro, recebeu 346 contra 41,1 HP de dano; recuperou 288,8 contra 0 HP (93 contra 0 de poções), gastando 27,1 contra 20,5 mana total e 12 contra 0 HP em conjurações. Começou com 310 contra 320 HP e defesa 3 contra 1. Escudos absorveram 89,5 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final -9,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -37,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 32,2% do DPS efetivo de arqueiro. Por encontro, recebeu 346 contra 0 HP de dano; recuperou 288,8 contra 0 HP (93 contra 0 de poções), gastando 27,1 contra 20,8 mana total e 12 contra 0 HP em conjurações. Começou com 310 contra 320 HP e defesa 3 contra 2. Escudos absorveram 89,5 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final -22,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -46 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 56,2% do DPS efetivo de necromante. Por encontro, recebeu 346 contra 30,6 HP de dano; recuperou 288,8 contra 0 HP (93 contra 0 de poções), gastando 27,1 contra 19,8 mana total e 12 contra 0 HP em conjurações. Começou com 310 contra 315 HP e defesa 3 contra 1. Escudos absorveram 89,5 contra 9,8; invocações causaram 0 contra 419,3 de dano e receberam 0 contra 67,4. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -12,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -54,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 79,4% do DPS efetivo de arqueiro. Por encontro, recebeu 41,1 contra 0 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 20,5 contra 20,8 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 320 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final -12,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -8,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 138,6% do DPS efetivo de necromante. Por encontro, recebeu 41,1 contra 30,6 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 20,5 contra 19,8 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 315 HP e defesa 1 contra 1. Escudos absorveram 0 contra 9,8; invocações causaram 0 contra 419,3 de dano e receberam 0 contra 67,4. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -3,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -16,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**arqueiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. arqueiro manteve 174,4% do DPS efetivo de necromante. Por encontro, recebeu 0 contra 30,6 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 20,8 contra 19,8 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 315 HP e defesa 2 contra 1. Escudos absorveram 0 contra 9,8; invocações causaram 0 contra 419,3 de dano e receberam 0 contra 67,4. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final 9,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -8,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### O que mudou ao retirar cada fator

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 8/8; 0; 0 | 0 | 5 | 111,8 (100% do completo) | 0 / 0 |
| aventureiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | 34,8 | 46,5 (41,6% do completo) | 0 / 0 |
| aventureiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 0,7 | 111,8 (100% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 8/8; 0; 0 | 0 | 3,8 | 38,5 (100,7% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 8/8; 0; 0 | 0 | 10,8 | 39 (102% do completo) | 0 / 0 |
| guerreiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | -19,5 | 64,1 (167,5% do completo) | 0 / 0 |
| guerreiro | Defesa plana zerada | 8/8; 0; 0 | 0 | -0,2 | 38,5 (100,7% do completo) | 0 / 0 |
| mago | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 94,4 (100% do completo) | 0 / 0 |
| mago | Sem habilidades da barra | 8/8; 0; 0 | 0 | 17,9 | 65,4 (69,3% do completo) | 0 / 0 |
| mago | Defesa plana zerada | 8/8; 0; 0 | 0 | 0,2 | 94,4 (100% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 118,8 (100% do completo) | 0 / 0 |
| arqueiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | 26,4 | 79,8 (67,2% do completo) | 0 / 0 |
| arqueiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 0 | 118,8 (100% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 68,1 (100% do completo) | 0 / 0 |
| necromante | Sem habilidades da barra | 8/8; 0; 0 | 0 | 34,8 | 36,1 (53% do completo) | 0 / 0 |
| necromante | Defesa plana zerada | 8/8; 0; 0 | 0 | 0,2 | 68,1 (100% do completo) | 0 / 0 |

## nível 30 · normal · pressao

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 26 s | — | 1 | 2.709 | 315,1 | 178,5 | 41,8 | 0 |
| guerreiro | 29,8 s | — | 1 | 2.709 | 614,4 | 570,3 | 31 | 14,6 |
| mago | 20,5 s | 13,7 s | 0,5 | 2.322,9 | 508,3 | 246,9 | 25,5 | 0 |
| arqueiro | 17,6 s | 18,9 s | 0,1 | 2.181,1 | 562,5 | 256 | 22,9 | 0 |
| necromante | — | 21 s | 0 | 958,3 | 567 | 252 | 8 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 28,5 / 52,5 / 97,5 / 0 | 2.709 / 0 / 0 | 0 | 0 | 18,7 / 9,1 / 0 / 0 / 0 | 1,8 |
| guerreiro | 0 / 461,8 / 108,5 / 0 | 2.222,6 / 486,4 / 0 | 84,4 | 0 | 12,8 / 7,4 / 9,1 / 0,2 / 0 | 0,8 |
| mago | 0 / 6,9 / 240 / 0 | 2.132,1 / 190,8 / 0 | 24,6 | 0 | 11,8 / 8,9 / 0 / 2,1 / 0 | 1,3 |
| arqueiro | 0 / 0 / 256 / 0 | 2.097,3 / 83,9 / 0 | 0 | 0 | 13,3 / 5,7 / 0 / 4,1 / 0 | 2 |
| necromante | 0 / 0 / 252 / 0 | 534,9 / 0 / 423,4 | 26 | 0 | 8,7 / 0,7 / 0 / 3,5 / 0 | 2,1 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 28 / 3,3 | 24,5 / 3,9 / 9 | 0 / 0 | — | 4,9 / 19,9 |
| guerreiro | 26,5 / 2,5 | 16,8 / 1,8 / 6,9 | 0,1 / 0 | bloqueado: 160,3 | 9,1 / 25,1 |
| mago | 16,9 / 3 | 20,8 / 2,1 / 9,1 | 0,1 / 0 | — | 0 / 9,6 |
| arqueiro | 23,4 / 0,6 | 24,8 / 3,1 / 9,6 | 0 / 0,6 | — | 0 / 8,8 |
| necromante | 20 / 0 | 25,4 / 4,4 / 9,8 | 0,8 / 0 | — | 0 / 4,5 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 9 | 1.250,6 | 0 | 18 | 0 | — |
| aventureiro | explosao | 4,6 | 741,9 | 0 | 13,9 | 0 | — |
| aventureiro | golpe_atordoante | 2,8 | 290,8 | 0 | 8,3 | 0 | — |
| aventureiro | ataque_basico | 10 | 425,8 | 0 | 0 | 0 | — |
| aventureiro | item:pocao_vida | 0,8 | 0 | 97,5 | 0 | 0 | — |
| aventureiro | curar | 1,6 | 0 | 28,5 | 1,6 | 0 | 17,5 |
| aventureiro | efeito:cura_periodica | 0 | 0 | 52,5 | 0 | 0 | — |
| guerreiro | investida | 4,9 | 377,3 | 0 | 19,5 | 0 | — |
| guerreiro | redemoinho | 4,9 | 800,9 | 0 | 0 | 14,6 | — |
| guerreiro | efeito:dano_direto | 0 | 486,4 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 461,8 | 0 | 0 | — |
| guerreiro | grito_de_guerra | 2,1 | 0 | 0 | 8,5 | 0 | — |
| guerreiro | escudo_de_ferro | 1 | 0 | 0 | 3 | 0 | — |
| guerreiro | ataque_basico | 13,6 | 1.044,5 | 0 | 0 | 0 | — |
| guerreiro | item:pocao_vida | 0,9 | 0 | 108,5 | 0 | 0 | — |
| mago | bola_de_fogo | 2,3 | 630 | 0 | 6,8 | 0 | — |
| mago | dardo_arcano | 10,3 | 859,6 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 1,9 | 47 | 0 | 7,5 | 0 | — |
| mago | efeito:dano_direto | 0 | 43,5 | 0 | 0 | 0 | — |
| mago | raio_em_cadeia | 1,9 | 595,5 | 0 | 9,4 | 0 | — |
| mago | efeito:queimando | 0 | 147,3 | 0 | 0 | 0 | — |
| mago | efeito:cura | 0 | 0 | 6,9 | 0 | 0 | — |
| mago | item:pocao_vida | 1,9 | 0 | 240 | 0 | 0 | — |
| mago | barreira | 0,6 | 0 | 0 | 1,9 | 0 | — |
| arqueiro | flecha_perfurante | 2 | 178,9 | 0 | 8 | 0 | — |
| arqueiro | chuva_de_flechas | 1,8 | 516,9 | 0 | 7 | 0 | — |
| arqueiro | flecha_venenosa | 1,6 | 134,5 | 0 | 4,9 | 0 | — |
| arqueiro | tiro_em_leque | 1 | 258,5 | 0 | 3 | 0 | — |
| arqueiro | tiro | 17 | 1.008,5 | 0 | 0 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 67 | 0 | 0 | 0 | — |
| arqueiro | efeito:dano_direto | 0 | 16,9 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 2 | 0 | 256 | 0 | 0 | — |
| necromante | dardo_funesto | 2 | 68,1 | 0 | 4 | 0 | — |
| necromante | garras_do_ossuario | 1 | 55,6 | 0 | 2 | 0 | — |
| necromante | comando_sepulcral | 1 | 0 | 0 | 2 | 0 | — |
| necromante | toque_funesto | 16 | 411,1 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 423,4 | 0 | 0 | 0 | — |
| necromante | item:pocao_vida | 2 | 0 | 252 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 124,3% do DPS efetivo de guerreiro. Por encontro, recebeu 315,1 contra 614,4 HP de dano; recuperou 178,5 contra 570,3 HP (97,5 contra 108,5 de poções), gastando 41,8 contra 31 mana total e 0 contra 14,6 HP em conjurações. Começou com 325 contra 310 HP e defesa 2 contra 3. Escudos absorveram 0 contra 84,4; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 0 p.p. e de HP final -24,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -100 p.p.; contraste de 100 p.p. e alteração de 75,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × mago:** 0/8 mortes contra 4/8; 0 contra 0 limites de tempo. aventureiro manteve 79,6% do DPS efetivo de mago. Por encontro, recebeu 315,1 contra 508,3 HP de dano; recuperou 178,5 contra 246,9 HP (97,5 contra 240 de poções), gastando 41,8 contra 25,5 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 1. Escudos absorveram 0 contra 24,6; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 4 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 50 p.p. e de HP final 41,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 50 para 0 p.p.; contraste de 50 p.p. e alteração de 41,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × arqueiro:** 0/8 mortes contra 7/8; 0 contra 0 limites de tempo. aventureiro manteve 87,4% do DPS efetivo de arqueiro. Por encontro, recebeu 315,1 contra 562,5 HP de dano; recuperou 178,5 contra 256 HP (97,5 contra 256 de poções), gastando 41,8 contra 22,9 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 7 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 87,5 p.p. e de HP final 55,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 87,5 para 0 p.p.; contraste de 87,5 p.p. e alteração de 55,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 0/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 243,7% do DPS efetivo de necromante. Por encontro, recebeu 315,1 contra 567 HP de dano; recuperou 178,5 contra 252 HP (97,5 contra 252 de poções), gastando 41,8 contra 8 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 315 HP e defesa 2 contra 1. Escudos absorveram 0 contra 26; invocações causaram 0 contra 423,4 de dano e receberam 0 contra 127,1. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 8 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 100 p.p. e de HP final 59,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 100 para 0 p.p.; contraste de 100 p.p. e alteração de 59,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × mago:** 0/8 mortes contra 4/8; 0 contra 0 limites de tempo. guerreiro manteve 64% do DPS efetivo de mago. Por encontro, recebeu 614,4 contra 508,3 HP de dano; recuperou 570,3 contra 246,9 HP (108,5 contra 240 de poções), gastando 31 contra 25,5 mana total e 14,6 contra 0 HP em conjurações. Começou com 310 contra 320 HP e defesa 3 contra 1. Escudos absorveram 84,4 contra 24,6; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 4 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 50 p.p. e de HP final 65,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 50 para 100 p.p.; contraste de -50 p.p. e alteração de -34,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 0/8 mortes contra 7/8; 0 contra 0 limites de tempo. guerreiro manteve 70,3% do DPS efetivo de arqueiro. Por encontro, recebeu 614,4 contra 562,5 HP de dano; recuperou 570,3 contra 256 HP (108,5 contra 256 de poções), gastando 31 contra 22,9 mana total e 14,6 contra 0 HP em conjurações. Começou com 310 contra 320 HP e defesa 3 contra 2. Escudos absorveram 84,4 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 7 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 87,5 p.p. e de HP final 79,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 87,5 para 100 p.p.; contraste de -12,5 p.p. e alteração de -20,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × necromante:** 0/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 196% do DPS efetivo de necromante. Por encontro, recebeu 614,4 contra 567 HP de dano; recuperou 570,3 contra 252 HP (108,5 contra 252 de poções), gastando 31 contra 8 mana total e 14,6 contra 0 HP em conjurações. Começou com 310 contra 315 HP e defesa 3 contra 1. Escudos absorveram 84,4 contra 26; invocações causaram 0 contra 423,4 de dano e receberam 0 contra 127,1. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 8 sementes só guerreiro venceu, 0 só necromante venceu; diferença de vitória 100 p.p. e de HP final 84 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 100 para 87,5 p.p.; contraste de 12,5 p.p. e alteração de 11,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: guerreiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × arqueiro:** 4/8 mortes contra 7/8; 0 contra 0 limites de tempo. mago manteve 109,8% do DPS efetivo de arqueiro. Por encontro, recebeu 508,3 contra 562,5 HP de dano; recuperou 246,9 contra 256 HP (240 contra 256 de poções), gastando 25,5 contra 22,9 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 320 HP e defesa 1 contra 2. Escudos absorveram 24,6 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 4 sementes só mago venceu, 1 só arqueiro venceu; diferença de vitória 37,5 p.p. e de HP final 14,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 37,5 para 0 p.p.; contraste de 37,5 p.p. e alteração de 14,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: mago venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × necromante:** 4/8 mortes contra 8/8; 0 contra 0 limites de tempo. mago manteve 306,2% do DPS efetivo de necromante. Por encontro, recebeu 508,3 contra 567 HP de dano; recuperou 246,9 contra 252 HP (240 contra 252 de poções), gastando 25,5 contra 8 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 315 HP e defesa 1 contra 1. Escudos absorveram 24,6 contra 26; invocações causaram 0 contra 423,4 de dano e receberam 0 contra 127,1. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 4 sementes só mago venceu, 0 só necromante venceu; diferença de vitória 50 p.p. e de HP final 18,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 50 para 0 p.p.; contraste de 50 p.p. e alteração de 18,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: mago venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**arqueiro × necromante:** 7/8 mortes contra 8/8; 0 contra 0 limites de tempo. arqueiro manteve 278,9% do DPS efetivo de necromante. Por encontro, recebeu 562,5 contra 567 HP de dano; recuperou 256 contra 252 HP (256 contra 252 de poções), gastando 22,9 contra 8 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 315 HP e defesa 2 contra 1. Escudos absorveram 0 contra 26; invocações causaram 0 contra 423,4 de dano e receberam 0 contra 127,1. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só arqueiro venceu, 0 só necromante venceu; diferença de vitória 12,5 p.p. e de HP final 4,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para 0 p.p.; contraste de 12,5 p.p. e alteração de 4,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: arqueiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

### O que mudou ao retirar cada fator

**aventureiro, Sem poções de vida:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 33,6 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**aventureiro, Sem habilidades da barra:** retirar esse fator perdeu 8 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 59,5 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Sem poções de vida:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 11,7 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem poções de vida:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 17 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem habilidades da barra:** retirar esse fator perdeu 4 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 18,3 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem poções de vida:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 4,2 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem habilidades da barra:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 4,2 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 6/8; 2; 0 | 25 | 33,6 | 109,8 (98,4% do completo) | 2 / 0 |
| aventureiro | Sem habilidades da barra | 0/8; 8; 0 | 100 | 59,5 | 50,8 (45,5% do completo) | 8 / 0 |
| aventureiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 2,5 | 110,5 (99,1% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 8/8; 0; 0 | 0 | 3,3 | 86,3 (96,2% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 7/8; 1; 0 | 12,5 | 11,7 | 89 (99,2% do completo) | 1 / 0 |
| guerreiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | -16 | 66,3 (73,9% do completo) | 0 / 0 |
| guerreiro | Defesa plana zerada | 8/8; 0; 0 | 0 | -0,9 | 89,6 (99,9% do completo) | 0 / 0 |
| mago | Sem poções de vida | 1/8; 7; 0 | 37,5 | 17 | 149 (106,3% do completo) | 3 / 0 |
| mago | Sem habilidades da barra | 0/8; 8; 0 | 50 | 18,3 | 60,5 (43,2% do completo) | 4 / 0 |
| mago | Defesa plana zerada | 4/8; 4; 0 | 0 | 1,2 | 140 (99,9% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 0/8; 8; 0 | 12,5 | 4,2 | 149,1 (116,7% do completo) | 1 / 0 |
| arqueiro | Sem habilidades da barra | 0/8; 8; 0 | 12,5 | 4,2 | 80,4 (63% do completo) | 1 / 0 |
| arqueiro | Defesa plana zerada | 1/8; 7; 0 | 0 | 0,6 | 126,7 (99,2% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 51,9 (113,4% do completo) | 0 / 0 |
| necromante | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 39,4 (86% do completo) | 0 / 0 |
| necromante | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 45,9 (100,3% do completo) | 0 / 0 |

## nível 30 · normal · atrito

### Onde o desgaste aparece

| Classe | Onda | Chegaram/n inicial | Mortes / limites nesta onda | HP entrada → saída | Mana entrada → saída | Recebido / cura / mana gasta |
|---|---|---|---|---|---|---|
| aventureiro | 1 | 8/8 | 0 / 0 | 325 → 255,4 | 30 → 23,6 | 73,5 / 3,9 / 14,6 |
| aventureiro | 2 | 8/8 | 0 / 0 | 255,4 → 234 | 23,6 → 19,9 | 37,9 / 8,3 / 14,6 |
| aventureiro | 3 | 8/8 | 0 / 0 | 234 → 230,9 | 19,9 → 14,8 | 194,8 / 180 / 20 |
| aventureiro | 4 | 8/8 | 0 / 0 | 230,9 → 225,9 | 14,8 → 12,4 | 107,6 / 97,4 / 13,3 |
| aventureiro | 5 | 8/8 | 0 / 0 | 225,9 → 173 | 12,4 → 8,7 | 120,4 / 66,4 / 14,4 |
| guerreiro | 1 | 8/8 | 0 / 0 | 310 → 245,3 | 30 → 23,4 | 301,6 / 246,6 / 20,9 |
| guerreiro | 2 | 8/8 | 0 / 0 | 245,3 → 254,5 | 23,4 → 21,9 | 287,5 / 290,8 / 21,5 |
| guerreiro | 3 | 8/8 | 0 / 0 | 254,5 → 251,8 | 21,9 → 22,3 | 160,9 / 148,8 / 14,1 |
| guerreiro | 4 | 8/8 | 0 / 0 | 251,8 → 259,1 | 22,3 → 24,3 | 151,4 / 156,9 / 7,1 |
| guerreiro | 5 | 8/8 | 0 / 3 | 259,1 → 191 | 24,3 → 20,6 | 214,5 / 149 / 16 |
| mago | 1 | 8/8 | 0 / 0 | 320 → 218,8 | 30 → 19,9 | 117,3 / 16 / 24,4 |
| mago | 2 | 8/8 | 0 / 0 | 218,8 → 178,1 | 19,9 → 25 | 174,8 / 130,8 / 9,1 |
| mago | 3 | 8/8 | 0 / 0 | 178,1 → 160,9 | 25 → 14,6 | 71,1 / 53,5 / 18,1 |
| mago | 4 | 8/8 | 3 / 0 | 160,9 → 58,9 | 14,6 → 22,6 | 152,9 / 49,4 / 2,9 |
| mago | 5 | 5/8 | 4 / 0 | 94,2 → 12,4 | 24,6 → 19,9 | 115,2 / 32,2 / 13,2 |
| arqueiro | 1 | 8/8 | 0 / 0 | 320 → 303,1 | 30 → 19,8 | 16,9 / 0 / 20,9 |
| arqueiro | 2 | 8/8 | 0 / 0 | 303,1 → 224,1 | 19,8 → 19,9 | 95,4 / 16 / 13,1 |
| arqueiro | 3 | 8/8 | 0 / 0 | 224,1 → 196,3 | 19,9 → 12,8 | 140,6 / 112 / 20,1 |
| arqueiro | 4 | 8/8 | 1 / 0 | 196,3 → 137,5 | 12,8 → 14,3 | 106,8 / 48 / 11,6 |
| arqueiro | 5 | 7/8 | 0 / 0 | 157,1 → 154,3 | 13,6 → 14,6 | 43,3 / 36,6 / 12,6 |
| necromante | 1 | 8/8 | 0 / 0 | 315 → 308,3 | 30 → 25,8 | 6,8 / 0 / 22 |
| necromante | 2 | 8/8 | 0 / 0 | 308,3 → 301 | 25,8 → 28,5 | 11,8 / 3,4 / 13,8 |
| necromante | 3 | 8/8 | 0 / 0 | 301 → 289,3 | 28,5 → 27,4 | 14,1 / 0 / 18 |
| necromante | 4 | 8/8 | 0 / 0 | 289,3 → 246,6 | 27,4 → 29,3 | 47,9 / 2,3 / 9,8 |
| necromante | 5 | 8/8 | 0 / 0 | 246,6 → 236,4 | 29,3 → 29,5 | 74,6 / 63 / 9,5 |

Médias de cada onda incluem apenas quem chegou a ela; o denominador inicial mostra a seleção dos sobreviventes. Não compare a vida da onda 5 como se incluísse quem morreu antes.

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 48,9 s | — | 5 | 4.519 | 534,1 | 355,9 | 76,9 | 0 |
| guerreiro | 70,3 s | — | 4,6 | 4.370 | 1.115,9 | 992 | 79,6 | 34,5 |
| mago | 47,8 s | 47,7 s | 3,8 | 3.810,9 | 588 | 269,8 | 62,8 | 0 |
| arqueiro | 37,4 s | 34,5 s | 4,8 | 4.399 | 397,5 | 208 | 76,8 | 0 |
| necromante | 60,4 s | — | 5 | 4.519 | 155,1 | 68,6 | 73 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 43,1 / 117,8 / 195 / 0 | 4.519 / 0 / 0 | 0 | 0 | 35,6 / 13,4 / 0 / 0,9 / 0,2 | 1,4 |
| guerreiro | 0 / 821,5 / 170,5 / 0 | 3.846,6 / 523,4 / 0 | 296,6 | 0 | 32,9 / 11,2 / 23,6 / 2 / 0 | 0,5 |
| mago | 0 / 13,8 / 256 / 0 | 3.644,6 / 166,3 / 0 | 62,5 | 0 | 32,4 / 4,8 / 0 / 6,2 / 0,2 | 1,9 |
| arqueiro | 0 / 0 / 208 / 0 | 4.323,9 / 75,1 / 0 | 0 | 0 | 31,1 / 8,1 / 0 / 1,4 / 0,6 | 2,5 |
| necromante | 0 / 5,6 / 63 / 0 | 1.950,4 / 0 / 2.568,6 | 52 | 2,3 | 32,5 / 11 / 0 / 0 / 0 | 2,6 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 55 / 8,8 | 41,8 / 6,9 / 14,6 | 0 / 0 | — | 26,3 / 43,1 |
| guerreiro | 71,5 / 7,9 | 34,4 / 4,6 / 14,4 | 0,1 / 0 | bloqueado: 697,9 | 39,4 / 70,3 |
| mago | 46,3 / 7,1 | 32,6 / 5,3 / 11,5 | 1,1 / 0,5 | — | 6 / 35,6 |
| arqueiro | 57,6 / 10,8 | 43,9 / 6,1 / 19,5 | 0,1 / 1,5 | — | 4,5 / 31 |
| necromante | 81,6 / 9,6 | 124 / 18,1 / 50,9 | 5,3 / 0 | — | 7,9 / 40,8 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 17 | 2.182,4 | 0 | 34 | 0 | — |
| aventureiro | explosao | 8 | 1.033,9 | 0 | 24 | 0 | — |
| aventureiro | golpe_atordoante | 5,5 | 508,6 | 0 | 16,5 | 0 | — |
| aventureiro | ataque_basico | 22,1 | 794,1 | 0 | 0 | 0 | — |
| aventureiro | curar | 2,4 | 0 | 43,1 | 2,4 | 0 | 18,2 |
| aventureiro | efeito:cura_periodica | 0 | 0 | 117,8 | 0 | 0 | — |
| aventureiro | item:pocao_vida | 1,5 | 0 | 195 | 0 | 0 | — |
| guerreiro | investida | 11,5 | 725,5 | 0 | 46 | 0 | — |
| guerreiro | redemoinho | 11,5 | 379,9 | 0 | 0 | 34,5 | — |
| guerreiro | efeito:dano_direto | 0 | 523,4 | 0 | 0 | 0 | — |
| guerreiro | grito_de_guerra | 5,5 | 0 | 0 | 22 | 0 | — |
| guerreiro | ataque_basico | 39,1 | 2.741,3 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 821,5 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 3,9 | 0 | 0 | 11,6 | 0 | — |
| guerreiro | item:pocao_vida | 1,4 | 0 | 170,5 | 0 | 0 | — |
| mago | bola_de_fogo | 5,6 | 678 | 0 | 16,9 | 0 | — |
| mago | dardo_arcano | 30 | 1.741,5 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 4,8 | 295,3 | 0 | 19 | 0 | — |
| mago | raio_em_cadeia | 4,6 | 929,9 | 0 | 23,1 | 0 | — |
| mago | efeito:dano_direto | 0 | 53,3 | 0 | 0 | 0 | — |
| mago | barreira | 1,3 | 0 | 0 | 3,8 | 0 | — |
| mago | efeito:cura | 0 | 0 | 13,8 | 0 | 0 | — |
| mago | item:pocao_vida | 2 | 0 | 256 | 0 | 0 | — |
| mago | efeito:queimando | 0 | 113 | 0 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 6,5 | 814,3 | 0 | 26 | 0 | — |
| arqueiro | chuva_de_flechas | 5 | 679,1 | 0 | 20 | 0 | — |
| arqueiro | flecha_venenosa | 4,6 | 381,3 | 0 | 13,9 | 0 | — |
| arqueiro | tiro_em_leque | 5,6 | 697,1 | 0 | 16,9 | 0 | — |
| arqueiro | tiro | 35,9 | 1.752,1 | 0 | 0 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 42,4 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 1,6 | 0 | 208 | 0 | 0 | — |
| arqueiro | efeito:dano_direto | 0 | 32,8 | 0 | 0 | 0 | — |
| necromante | dardo_funesto | 19 | 722,3 | 0 | 38 | 0 | — |
| necromante | garras_do_ossuario | 10 | 444,9 | 0 | 20 | 0 | — |
| necromante | comando_sepulcral | 6,1 | 0 | 0 | 12,3 | 0 | — |
| necromante | toque_funesto | 45,1 | 783,3 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 2.568,6 | 0 | 0 | 0 | — |
| necromante | dizimo_vital | 1,4 | 0 | 0 | 2,8 | 0 | — |
| necromante | efeito:cura | 0 | 0 | 5,6 | 0 | 0 | — |
| necromante | item:pocao_vida | 0,5 | 0 | 63 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 0/8 mortes contra 0/8; 0 contra 3 limites de tempo. aventureiro manteve 170,5% do DPS efetivo de guerreiro. Por encontro, recebeu 534,1 contra 1.115,9 HP de dano; recuperou 355,9 contra 992 HP (195 contra 170,5 de poções), gastando 76,9 contra 79,6 mana total e 0 contra 34,5 HP em conjurações. Começou com 325 contra 310 HP e defesa 2 contra 3. Escudos absorveram 0 contra 296,6; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 3 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 37,5 p.p. e de HP final -8,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 37,5 para -100 p.p.; contraste de 137,5 p.p. e alteração de 91,6 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × mago:** 0/8 mortes contra 7/8; 0 contra 0 limites de tempo. aventureiro manteve 116,7% do DPS efetivo de mago. Por encontro, recebeu 534,1 contra 588 HP de dano; recuperou 355,9 contra 269,8 HP (195 contra 256 de poções), gastando 76,9 contra 62,8 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 1. Escudos absorveram 0 contra 62,5; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 7 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 87,5 p.p. e de HP final 50,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 87,5 para 0 p.p.; contraste de 87,5 p.p. e alteração de 50,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × arqueiro:** 0/8 mortes contra 1/8; 0 contra 0 limites de tempo. aventureiro manteve 82% do DPS efetivo de arqueiro. Por encontro, recebeu 534,1 contra 397,5 HP de dano; recuperou 355,9 contra 208 HP (195 contra 208 de poções), gastando 76,9 contra 76,8 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 12,5 p.p. e de HP final 11 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para 37,5 p.p.; contraste de -25 p.p. e alteração de -20,6 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 129,5% do DPS efetivo de necromante. Por encontro, recebeu 534,1 contra 155,1 HP de dano; recuperou 355,9 contra 68,6 HP (195 contra 63 de poções), gastando 76,9 contra 73 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 315 HP e defesa 2 contra 1. Escudos absorveram 0 contra 52; invocações causaram 0 contra 2.568,6 de dano e receberam 0 contra 486. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -21,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -12,5 p.p.; contraste de 12,5 p.p. e alteração de 3,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × mago:** 0/8 mortes contra 7/8; 3 contra 0 limites de tempo. guerreiro manteve 68,4% do DPS efetivo de mago. Por encontro, recebeu 1.115,9 contra 588 HP de dano; recuperou 992 contra 269,8 HP (170,5 contra 256 de poções), gastando 79,6 contra 62,8 mana total e 34,5 contra 0 HP em conjurações. Começou com 310 contra 320 HP e defesa 3 contra 1. Escudos absorveram 296,6 contra 62,5; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 4 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 50 p.p. e de HP final 59,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 50 para 100 p.p.; contraste de -50 p.p. e alteração de -40,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 0/8 mortes contra 1/8; 3 contra 0 limites de tempo. guerreiro manteve 48,1% do DPS efetivo de arqueiro. Por encontro, recebeu 1.115,9 contra 397,5 HP de dano; recuperou 992 contra 208 HP (170,5 contra 208 de poções), gastando 79,6 contra 76,8 mana total e 34,5 contra 0 HP em conjurações. Começou com 310 contra 320 HP e defesa 3 contra 2. Escudos absorveram 296,6 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só guerreiro venceu, 3 só arqueiro venceu; diferença de vitória -25 p.p. e de HP final 19,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -25 para 87,5 p.p.; contraste de -112,5 p.p. e alteração de -79,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: arqueiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × necromante:** 0/8 mortes contra 0/8; 3 contra 0 limites de tempo. guerreiro manteve 75,9% do DPS efetivo de necromante. Por encontro, recebeu 1.115,9 contra 155,1 HP de dano; recuperou 992 contra 68,6 HP (170,5 contra 63 de poções), gastando 79,6 contra 73 mana total e 34,5 contra 0 HP em conjurações. Começou com 310 contra 315 HP e defesa 3 contra 1. Escudos absorveram 296,6 contra 52; invocações causaram 0 contra 2.568,6 de dano e receberam 0 contra 486. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 3 só necromante venceu; diferença de vitória -37,5 p.p. e de HP final -13,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -37,5 para 100 p.p.; contraste de -137,5 p.p. e alteração de -105,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × arqueiro:** 7/8 mortes contra 1/8; 0 contra 0 limites de tempo. mago manteve 70,3% do DPS efetivo de arqueiro. Por encontro, recebeu 588 contra 397,5 HP de dano; recuperou 269,8 contra 208 HP (256 contra 208 de poções), gastando 62,8 contra 76,8 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 320 HP e defesa 1 contra 2. Escudos absorveram 62,5 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 6 só arqueiro venceu; diferença de vitória -75 p.p. e de HP final -39,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -75 para -12,5 p.p.; contraste de -62,5 p.p. e alteração de -38,6 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: arqueiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × necromante:** 7/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 111% do DPS efetivo de necromante. Por encontro, recebeu 588 contra 155,1 HP de dano; recuperou 269,8 contra 68,6 HP (256 contra 63 de poções), gastando 62,8 contra 73 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 315 HP e defesa 1 contra 1. Escudos absorveram 62,5 contra 52; invocações causaram 0 contra 2.568,6 de dano e receberam 0 contra 486. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 7 só necromante venceu; diferença de vitória -87,5 p.p. e de HP final -72,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -87,5 para 0 p.p.; contraste de -87,5 p.p. e alteração de -64,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**arqueiro × necromante:** 1/8 mortes contra 0/8; 0 contra 0 limites de tempo. arqueiro manteve 157,8% do DPS efetivo de necromante. Por encontro, recebeu 397,5 contra 155,1 HP de dano; recuperou 208 contra 68,6 HP (208 contra 63 de poções), gastando 76,8 contra 73 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 315 HP e defesa 2 contra 1. Escudos absorveram 0 contra 52; invocações causaram 0 contra 2.568,6 de dano e receberam 0 contra 486. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 1 só necromante venceu; diferença de vitória -12,5 p.p. e de HP final -32,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para -50 p.p.; contraste de 37,5 p.p. e alteração de 24,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### O que mudou ao retirar cada fator

**aventureiro, Sem poções de vida:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 17,7 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**aventureiro, Sem habilidades da barra:** retirar esse fator perdeu 8 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 53,2 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Sem cura do básico:** retirar esse fator perdeu 3 vitórias e ganhou 2 nas mesmas 8 condições iniciais. O kit completo teve 25,2 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Sem poções de vida:** retirar esse fator perdeu 3 vitórias e ganhou 1 nas mesmas 8 condições iniciais. O kit completo teve 26,3 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Defesa plana zerada:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 17,3 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem poções de vida:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 2,4 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem habilidades da barra:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 2,4 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem poções de vida:** retirar esse fator perdeu 5 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 38,3 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem habilidades da barra:** retirar esse fator perdeu 6 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 41,1 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem poções de vida:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 14 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem habilidades da barra:** retirar esse fator perdeu 8 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 66,8 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 5/8; 3; 0 | 37,5 | 17,7 | 89 (95% do completo) | 3 / 0 |
| aventureiro | Sem habilidades da barra | 0/8; 8; 0 | 100 | 53,2 | 48,2 (51,4% do completo) | 8 / 0 |
| aventureiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 2,5 | 92,2 (98,3% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 4/8; 4; 0 | 12,5 | 25,2 | 54,5 (99,1% do completo) | 3 / 2 |
| guerreiro | Sem poções de vida | 3/8; 4; 1 | 25 | 26,3 | 52 (94,6% do completo) | 3 / 1 |
| guerreiro | Sem habilidades da barra | 8/8; 0; 0 | -37,5 | -38,4 | 63,4 (115,4% do completo) | 0 / 3 |
| guerreiro | Defesa plana zerada | 3/8; 3; 2 | 25 | 17,3 | 51,1 (93% do completo) | 2 / 0 |
| mago | Sem poções de vida | 0/8; 8; 0 | 12,5 | 2,4 | 81,8 (101,7% do completo) | 1 / 0 |
| mago | Sem habilidades da barra | 0/8; 8; 0 | 12,5 | 2,4 | 66,2 (82,4% do completo) | 1 / 0 |
| mago | Defesa plana zerada | 1/8; 7; 0 | 0 | -2,7 | 80,7 (100,4% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 2/8; 6; 0 | 62,5 | 38,3 | 111,8 (97,9% do completo) | 5 / 0 |
| arqueiro | Sem habilidades da barra | 1/8; 7; 0 | 75 | 41,1 | 84,7 (74,1% do completo) | 6 / 0 |
| arqueiro | Defesa plana zerada | 7/8; 1; 0 | 0 | 3,2 | 114,3 (100% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 6/8; 2; 0 | 25 | 14 | 72,7 (100,4% do completo) | 2 / 0 |
| necromante | Sem habilidades da barra | 0/8; 6; 2 | 100 | 66,8 | 36,9 (50,9% do completo) | 8 / 0 |
| necromante | Defesa plana zerada | 8/8; 0; 0 | 0 | 0,9 | 72,4 (100% do completo) | 0 / 0 |

## nível 30 · normal · chefe

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 13,9 s | — | 1 | 1.218 | 140,9 | 29,6 | 22,9 | 0 |
| guerreiro | 13,2 s | — | 1 | 1.230 | 61,5 | 65,3 | 12,5 | 7,5 |
| mago | 13,5 s | — | 1 | 1.218 | 65,1 | 0 | 26,5 | 0 |
| arqueiro | 10,9 s | — | 1 | 1.206 | 128,1 | 0 | 26,4 | 0 |
| necromante | 16,1 s | — | 1 | 1.232,5 | 8,6 | 0 | 26,3 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 8,1 / 5,3 / 16,3 / 0 | 1.218 / 0 / 0 | 0 | 0 | 9,5 / 5 / 0,9 / 0 / 0 | 1,4 |
| guerreiro | 0 / 65,3 / 0 / 0 | 1.101,6 / 128,4 / 0 | 18,4 | 0 | 5,4 / 1,3 / 4,6 / 0 / 0 | 0,7 |
| mago | 0 / 0 / 0 / 0 | 1.179,3 / 38,8 / 0 | 0 | 0 | 10,8 / 3,1 / 0,1 / 0 / 0 | 2,3 |
| arqueiro | 0 / 0 / 0 / 0 | 1.170,5 / 35,5 / 0 | 0 | 0 | 8,5 / 4 / 1 / 0 / 0 | 2 |
| necromante | 0 / 0 / 0 / 0 | 612,5 / 0 / 620 | 6,5 | 0 | 9,3 / 4,3 / 0 / 0 / 0 | 2,7 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 14,4 / 2,3 | 10,8 / 1,5 / 4,1 | 0 / 0 | bloqueado: 1 | 0 / 9,8 |
| guerreiro | 10,5 / 0,1 | 8,5 / 1,3 / 3,9 | 0 / 0 | — | 0 / 10,1 |
| mago | 14,4 / 3,5 | 9,8 / 1,8 / 3,6 | 1 / 0,4 | — | 0 / 10,3 |
| arqueiro | 15,3 / 4,4 | 10,6 / 1,9 / 4,3 | 0 / 0,6 | bloqueado: 1,4 | 0 / 7,9 |
| necromante | 23,9 / 2,5 | 25 / 3,4 / 10,5 | 1,8 / 0 | — | 1,5 / 11,1 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 5 | 596 | 0 | 10 | 0 | — |
| aventureiro | explosao | 2,5 | 413,4 | 0 | 7,5 | 0 | — |
| aventureiro | golpe_atordoante | 1,6 | 75,8 | 0 | 4,9 | 0 | — |
| aventureiro | ataque_basico | 4,8 | 132,9 | 0 | 0 | 0 | — |
| aventureiro | curar | 0,5 | 0 | 8,1 | 0,5 | 0 | 16,3 |
| aventureiro | efeito:cura_periodica | 0 | 0 | 5,3 | 0 | 0 | — |
| aventureiro | item:pocao_vida | 0,1 | 0 | 16,3 | 0 | 0 | — |
| guerreiro | investida | 2,1 | 336,9 | 0 | 8,5 | 0 | — |
| guerreiro | redemoinho | 2,5 | 342,9 | 0 | 0 | 7,5 | — |
| guerreiro | efeito:dano_direto | 0 | 128,4 | 0 | 0 | 0 | — |
| guerreiro | grito_de_guerra | 1 | 0 | 0 | 4 | 0 | — |
| guerreiro | ataque_basico | 4,9 | 421,9 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 65,3 | 0 | 0 | — |
| mago | bola_de_fogo | 2,5 | 198,8 | 0 | 7,5 | 0 | — |
| mago | dardo_arcano | 7,6 | 295,4 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 2,3 | 351,5 | 0 | 9 | 0 | — |
| mago | raio_em_cadeia | 2 | 333,6 | 0 | 10 | 0 | — |
| mago | efeito:dano_direto | 0 | 30,6 | 0 | 0 | 0 | — |
| mago | efeito:queimando | 0 | 8,1 | 0 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 2,4 | 302,5 | 0 | 9,5 | 0 | — |
| arqueiro | chuva_de_flechas | 1,9 | 308,1 | 0 | 7,5 | 0 | — |
| arqueiro | tiro | 7,9 | 248 | 0 | 0 | 0 | — |
| arqueiro | flecha_venenosa | 1,6 | 126,8 | 0 | 4,9 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 18 | 0 | 0 | 0 | — |
| arqueiro | tiro_em_leque | 1,5 | 185,1 | 0 | 4,5 | 0 | — |
| arqueiro | efeito:dano_direto | 0 | 17,5 | 0 | 0 | 0 | — |
| necromante | dardo_funesto | 6,9 | 272 | 0 | 13,8 | 0 | — |
| necromante | garras_do_ossuario | 3,6 | 164,1 | 0 | 7,3 | 0 | — |
| necromante | comando_sepulcral | 2,3 | 0 | 0 | 4,5 | 0 | — |
| necromante | toque_funesto | 10,8 | 176,4 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 620 | 0 | 0 | 0 | — |
| necromante | dizimo_vital | 0,4 | 0 | 0 | 0,8 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 95,9% do DPS efetivo de guerreiro. Por encontro, recebeu 140,9 contra 61,5 HP de dano; recuperou 29,6 contra 65,3 HP (16,3 contra 0 de poções), gastando 22,9 contra 12,5 mana total e 0 contra 7,5 HP em conjurações. Começou com 325 contra 310 HP e defesa 2 contra 3. Escudos absorveram 0 contra 18,4; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 0 p.p. e de HP final -33 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -25 p.p.; contraste de 25 p.p. e alteração de 45,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 109,1% do DPS efetivo de mago. Por encontro, recebeu 140,9 contra 65,1 HP de dano; recuperou 29,6 contra 0 HP (16,3 contra 0 de poções), gastando 22,9 contra 26,5 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final -13,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -25 p.p.; contraste de 25 p.p. e alteração de 18 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 86,2% do DPS efetivo de arqueiro. Por encontro, recebeu 140,9 contra 128,1 HP de dano; recuperou 29,6 contra 0 HP (16,3 contra 0 de poções), gastando 22,9 contra 26,4 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 5,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -25 p.p.; contraste de 25 p.p. e alteração de 63,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 125,6% do DPS efetivo de necromante. Por encontro, recebeu 140,9 contra 8,6 HP de dano; recuperou 29,6 contra 0 HP (16,3 contra 0 de poções), gastando 22,9 contra 26,3 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 315 HP e defesa 2 contra 1. Escudos absorveram 0 contra 6,5; invocações causaram 0 contra 620 de dano e receberam 0 contra 106,5. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -32 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -25 p.p.; contraste de 25 p.p. e alteração de -8,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 113,8% do DPS efetivo de mago. Por encontro, recebeu 61,5 contra 65,1 HP de dano; recuperou 65,3 contra 0 HP (0 contra 0 de poções), gastando 12,5 contra 26,5 mana total e 7,5 contra 0 HP em conjurações. Começou com 310 contra 320 HP e defesa 3 contra 1. Escudos absorveram 18,4 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 19,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -27,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 89,9% do DPS efetivo de arqueiro. Por encontro, recebeu 61,5 contra 128,1 HP de dano; recuperou 65,3 contra 0 HP (0 contra 0 de poções), gastando 12,5 contra 26,4 mana total e 7,5 contra 0 HP em conjurações. Começou com 310 contra 320 HP e defesa 3 contra 2. Escudos absorveram 18,4 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 38,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 18,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 130,9% do DPS efetivo de necromante. Por encontro, recebeu 61,5 contra 8,6 HP de dano; recuperou 65,3 contra 0 HP (0 contra 0 de poções), gastando 12,5 contra 26,3 mana total e 7,5 contra 0 HP em conjurações. Começou com 310 contra 315 HP e defesa 3 contra 1. Escudos absorveram 18,4 contra 6,5; invocações causaram 0 contra 620 de dano e receberam 0 contra 106,5. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final 1,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -54 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 79% do DPS efetivo de arqueiro. Por encontro, recebeu 65,1 contra 128,1 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 26,5 contra 26,4 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 320 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 19,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 45,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 115,1% do DPS efetivo de necromante. Por encontro, recebeu 65,1 contra 8,6 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 26,5 contra 26,3 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 315 HP e defesa 1 contra 1. Escudos absorveram 0 contra 6,5; invocações causaram 0 contra 620 de dano e receberam 0 contra 106,5. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -18,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -26,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**arqueiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. arqueiro manteve 145,7% do DPS efetivo de necromante. Por encontro, recebeu 128,1 contra 8,6 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 26,4 contra 26,3 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 315 HP e defesa 2 contra 1. Escudos absorveram 0 contra 6,5; invocações causaram 0 contra 620 de dano e receberam 0 contra 106,5. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -37,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -72,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### O que mudou ao retirar cada fator

**aventureiro, Sem habilidades da barra:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 44 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 8/8; 0; 0 | 0 | 5 | 97,4 (100% do completo) | 0 / 0 |
| aventureiro | Sem habilidades da barra | 6/8; 2; 0 | 25 | 44 | 41,7 (42,8% do completo) | 2 / 0 |
| aventureiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 1,4 | 97,4 (100% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 8/8; 0; 0 | 0 | 1,2 | 101,5 (100% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 101,5 (100% do completo) | 0 / 0 |
| guerreiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | -1,2 | 61,8 (60,9% do completo) | 0 / 0 |
| guerreiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 0,2 | 101,5 (100% do completo) | 0 / 0 |
| mago | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 89,2 (100% do completo) | 0 / 0 |
| mago | Sem habilidades da barra | 8/8; 0; 0 | 0 | 25,9 | 51,8 (58,1% do completo) | 0 / 0 |
| mago | Defesa plana zerada | 8/8; 0; 0 | 0 | 0,3 | 89,2 (100% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 112,9 (100% do completo) | 0 / 0 |
| arqueiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | -19,3 | 84,9 (75,2% do completo) | 0 / 0 |
| arqueiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 1 | 112,9 (100% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 77,5 (100% do completo) | 0 / 0 |
| necromante | Sem habilidades da barra | 8/8; 0; 0 | 0 | 52,8 | 34,1 (44% do completo) | 0 / 0 |
| necromante | Defesa plana zerada | 8/8; 0; 0 | 0 | 0,1 | 77,5 (100% do completo) | 0 / 0 |

## nível 30 · pesadelo · duelo

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 14 s | — | 1 | 917 | 226,4 | 81,6 | 25,6 | 0 |
| guerreiro | 37,5 s | 28,9 s | 0,3 | 760,1 | 634,5 | 391,4 | 34,5 | 14,3 |
| mago | 17,4 s | 17,8 s | 0,9 | 909,3 | 223,4 | 64 | 25,3 | 0 |
| arqueiro | 11,6 s | — | 1 | 917 | 124,9 | 32 | 30,3 | 0 |
| necromante | 24,9 s | — | 1 | 917 | 206,8 | 78,8 | 24 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 7,6 / 9 / 65 / 0 | 917 / 0 / 0 | 0 | 0 | 11,7 / 1,8 / 0 / 0,3 / 0 | 0,8 |
| guerreiro | 0 / 143,4 / 248 / 0 | 674,8 / 85,4 / 0 | 153,3 | 0 | 12,7 / 0,4 / 10 / 5,4 / 0 | 0 |
| mago | 0 / 0 / 64 / 0 | 862,9 / 46,4 / 0 | 0 | 0 | 12 / 3,5 / 0 / 0 / 0 | 1,8 |
| arqueiro | 0 / 0 / 32 / 0 | 888,4 / 28,6 / 0 | 0 | 0 | 10,6 / 3,8 / 0 / 0 / 0 | 2,2 |
| necromante | 0 / 0 / 78,8 / 0 | 463 / 0 / 454 | 22,8 | 0 | 12,6 / 3,4 / 0 / 0,5 / 0 | 2,2 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 17,4 / 1,8 | 15,1 / 3,4 / 4,8 | 0 / 0 | — | 0 / 11,1 |
| guerreiro | 28,3 / 3,9 | 11,5 / 1,6 / 4,8 | 0 / 0 | bloqueado: 238,9 | 0 / 24,6 |
| mago | 16,6 / 2,8 | 11,8 / 1,6 / 4,8 | 0,3 / 0,3 | — | 0 / 12,4 |
| arqueiro | 20,1 / 5,5 | 13,5 / 1,8 / 5,8 | 0 / 0,6 | — | 0 / 8,3 |
| necromante | 30,6 / 1,8 | 36,8 / 4,4 / 15 | 1,4 / 0 | — | 0 / 10,5 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 5,6 | 442,9 | 0 | 11,3 | 0 | — |
| aventureiro | explosao | 2,6 | 176,4 | 0 | 7,9 | 0 | — |
| aventureiro | golpe_atordoante | 2 | 120,6 | 0 | 6 | 0 | — |
| aventureiro | ataque_basico | 6,6 | 177,1 | 0 | 0 | 0 | — |
| aventureiro | curar | 0,5 | 0 | 7,6 | 0,5 | 0 | 15,3 |
| aventureiro | efeito:cura_periodica | 0 | 0 | 9 | 0 | 0 | — |
| aventureiro | item:pocao_vida | 0,5 | 0 | 65 | 0 | 0 | — |
| guerreiro | investida | 4,8 | 88,5 | 0 | 19 | 0 | — |
| guerreiro | redemoinho | 4,8 | 0 | 0 | 0 | 14,3 | — |
| guerreiro | efeito:dano_direto | 0 | 85,4 | 0 | 0 | 0 | — |
| guerreiro | grito_de_guerra | 2,4 | 0 | 0 | 9,5 | 0 | — |
| guerreiro | escudo_de_ferro | 2 | 0 | 0 | 6 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 143,4 | 0 | 0 | — |
| guerreiro | ataque_basico | 14,4 | 586,3 | 0 | 0 | 0 | — |
| guerreiro | item:pocao_vida | 2 | 0 | 248 | 0 | 0 | — |
| mago | bola_de_fogo | 2,3 | 245,3 | 0 | 6,8 | 0 | — |
| mago | dardo_arcano | 10,3 | 356,1 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 2,1 | 30,6 | 0 | 8,5 | 0 | — |
| mago | raio_em_cadeia | 2 | 230,9 | 0 | 10 | 0 | — |
| mago | efeito:dano_direto | 0 | 15,3 | 0 | 0 | 0 | — |
| mago | efeito:queimando | 0 | 31,1 | 0 | 0 | 0 | — |
| mago | item:pocao_vida | 0,5 | 0 | 64 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 2,5 | 169,6 | 0 | 10 | 0 | — |
| arqueiro | chuva_de_flechas | 1,9 | 194,4 | 0 | 7,5 | 0 | — |
| arqueiro | flecha_venenosa | 1,9 | 112,1 | 0 | 5,6 | 0 | — |
| arqueiro | tiro_em_leque | 2,4 | 190,9 | 0 | 7,1 | 0 | — |
| arqueiro | tiro | 11,5 | 221,4 | 0 | 0 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 21,8 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 0,3 | 0 | 32 | 0 | 0 | — |
| arqueiro | efeito:dano_direto | 0 | 6,9 | 0 | 0 | 0 | — |
| necromante | dardo_funesto | 5,9 | 141,8 | 0 | 11,8 | 0 | — |
| necromante | garras_do_ossuario | 3 | 80 | 0 | 6 | 0 | — |
| necromante | comando_sepulcral | 1,9 | 0 | 0 | 3,8 | 0 | — |
| necromante | toque_funesto | 18,6 | 241,3 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 454 | 0 | 0 | 0 | — |
| necromante | dizimo_vital | 1,3 | 0 | 0 | 2,5 | 0 | — |
| necromante | item:pocao_vida | 0,6 | 0 | 78,8 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 0/8 mortes contra 6/8; 0 contra 0 limites de tempo. aventureiro manteve 256,1% do DPS efetivo de guerreiro. Por encontro, recebeu 226,4 contra 634,5 HP de dano; recuperou 81,6 contra 391,4 HP (65 contra 248 de poções), gastando 25,6 contra 34,5 mana total e 0 contra 14,3 HP em conjurações. Começou com 325 contra 310 HP e defesa 2 contra 3. Escudos absorveram 0 contra 153,3; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 6 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 75 p.p. e de HP final 38,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 75 para -37,5 p.p.; contraste de 112,5 p.p. e alteração de 87,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × mago:** 0/8 mortes contra 1/8; 0 contra 0 limites de tempo. aventureiro manteve 116,2% do DPS efetivo de mago. Por encontro, recebeu 226,4 contra 223,4 HP de dano; recuperou 81,6 contra 64 HP (65 contra 64 de poções), gastando 25,6 contra 25,3 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 12,5 p.p. e de HP final 5,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para -50 p.p.; contraste de 62,5 p.p. e alteração de 32,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 86% do DPS efetivo de arqueiro. Por encontro, recebeu 226,4 contra 124,9 HP de dano; recuperou 81,6 contra 32 HP (65 contra 32 de poções), gastando 25,6 contra 30,3 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final -15,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -87,5 p.p.; contraste de 87,5 p.p. e alteração de 42,6 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 175,9% do DPS efetivo de necromante. Por encontro, recebeu 226,4 contra 206,8 HP de dano; recuperou 81,6 contra 78,8 HP (65 contra 78,8 de poções), gastando 25,6 contra 24 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 315 HP e defesa 2 contra 1. Escudos absorveram 0 contra 22,8; invocações causaram 0 contra 454 de dano e receberam 0 contra 183,9. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -3,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 37,5 p.p.; contraste de -37,5 p.p. e alteração de -3,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × mago:** 6/8 mortes contra 1/8; 0 contra 0 limites de tempo. guerreiro manteve 45,4% do DPS efetivo de mago. Por encontro, recebeu 634,5 contra 223,4 HP de dano; recuperou 391,4 contra 64 HP (248 contra 64 de poções), gastando 34,5 contra 25,3 mana total e 14,3 contra 0 HP em conjurações. Começou com 310 contra 320 HP e defesa 3 contra 1. Escudos absorveram 153,3 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só guerreiro venceu, 6 só mago venceu; diferença de vitória -62,5 p.p. e de HP final -33,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -62,5 para -12,5 p.p.; contraste de -50 p.p. e alteração de -54,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: mago venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × arqueiro:** 6/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 33,6% do DPS efetivo de arqueiro. Por encontro, recebeu 634,5 contra 124,9 HP de dano; recuperou 391,4 contra 32 HP (248 contra 32 de poções), gastando 34,5 contra 30,3 mana total e 14,3 contra 0 HP em conjurações. Começou com 310 contra 320 HP e defesa 3 contra 2. Escudos absorveram 153,3 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 6 só arqueiro venceu; diferença de vitória -75 p.p. e de HP final -54 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -75 para -50 p.p.; contraste de -25 p.p. e alteração de -45,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: arqueiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × necromante:** 6/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 68,7% do DPS efetivo de necromante. Por encontro, recebeu 634,5 contra 206,8 HP de dano; recuperou 391,4 contra 78,8 HP (248 contra 78,8 de poções), gastando 34,5 contra 24 mana total e 14,3 contra 0 HP em conjurações. Começou com 310 contra 315 HP e defesa 3 contra 1. Escudos absorveram 153,3 contra 22,8; invocações causaram 0 contra 454 de dano e receberam 0 contra 183,9. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 6 só necromante venceu; diferença de vitória -75 p.p. e de HP final -42,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -75 para 37,5 p.p.; contraste de -112,5 p.p. e alteração de -87 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × arqueiro:** 1/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 74% do DPS efetivo de arqueiro. Por encontro, recebeu 223,4 contra 124,9 HP de dano; recuperou 64 contra 32 HP (64 contra 32 de poções), gastando 25,3 contra 30,3 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 320 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 1 só arqueiro venceu; diferença de vitória -12,5 p.p. e de HP final -20,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para -37,5 p.p.; contraste de 25 p.p. e alteração de 9,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: arqueiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × necromante:** 1/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 151,3% do DPS efetivo de necromante. Por encontro, recebeu 223,4 contra 206,8 HP de dano; recuperou 64 contra 78,8 HP (64 contra 78,8 de poções), gastando 25,3 contra 24 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 315 HP e defesa 1 contra 1. Escudos absorveram 0 contra 22,8; invocações causaram 0 contra 454 de dano e receberam 0 contra 183,9. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 1 só necromante venceu; diferença de vitória -12,5 p.p. e de HP final -9,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para 50 p.p.; contraste de -62,5 p.p. e alteração de -32,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**arqueiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. arqueiro manteve 204,5% do DPS efetivo de necromante. Por encontro, recebeu 124,9 contra 206,8 HP de dano; recuperou 32 contra 78,8 HP (32 contra 78,8 de poções), gastando 30,3 contra 24 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 315 HP e defesa 2 contra 1. Escudos absorveram 0 contra 22,8; invocações causaram 0 contra 454 de dano e receberam 0 contra 183,9. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final 11,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 87,5 p.p.; contraste de -87,5 p.p. e alteração de -42 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### O que mudou ao retirar cada fator

**aventureiro, Sem habilidades da barra:** retirar esse fator perdeu 7 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 54,7 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**aventureiro, Defesa plana zerada:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 6,5 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Sem poções de vida:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 17 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem habilidades da barra:** retirar esse fator perdeu 3 vitórias e ganhou 1 nas mesmas 8 condições iniciais. O kit completo teve 21,8 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem poções de vida:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 3,7 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem poções de vida:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 11,7 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem habilidades da barra:** retirar esse fator perdeu 7 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 54 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Defesa plana zerada:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve -3,9 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 8/8; 0; 0 | 0 | 7,8 | 63,1 (99,2% do completo) | 0 / 0 |
| aventureiro | Sem habilidades da barra | 1/8; 7; 0 | 87,5 | 54,7 | 28 (44% do completo) | 7 / 0 |
| aventureiro | Defesa plana zerada | 7/8; 1; 0 | 12,5 | 6,5 | 62,9 (98,9% do completo) | 1 / 0 |
| guerreiro | Sem cura do básico | 3/8; 5; 0 | -12,5 | -4,6 | 27 (108,6% do completo) | 0 / 1 |
| guerreiro | Sem poções de vida | 0/8; 8; 0 | 25 | 17 | 26,9 (108,1% do completo) | 2 / 0 |
| guerreiro | Sem habilidades da barra | 4/8; 4; 0 | -25 | -33 | 39 (157,1% do completo) | 1 / 3 |
| guerreiro | Defesa plana zerada | 2/8; 6; 0 | 0 | 1 | 24,7 (99,4% do completo) | 0 / 0 |
| mago | Sem poções de vida | 7/8; 1; 0 | 0 | 15 | 54,7 (100% do completo) | 0 / 0 |
| mago | Sem habilidades da barra | 5/8; 3; 0 | 25 | 21,8 | 40,1 (73,2% do completo) | 3 / 1 |
| mago | Defesa plana zerada | 7/8; 1; 0 | 0 | 0,7 | 54,7 (100% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 7/8; 1; 0 | 12,5 | 3,7 | 75,2 (101,6% do completo) | 1 / 0 |
| arqueiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | 12 | 51,1 (69% do completo) | 0 / 0 |
| arqueiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 1,2 | 74 (100% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 5/8; 3; 0 | 37,5 | 11,7 | 37,3 (103,1% do completo) | 3 / 0 |
| necromante | Sem habilidades da barra | 1/8; 7; 0 | 87,5 | 54 | 20,9 (57,8% do completo) | 7 / 0 |
| necromante | Defesa plana zerada | 7/8; 1; 0 | 12,5 | -3,9 | 36,1 (99,9% do completo) | 1 / 0 |

## nível 30 · pesadelo · pressao

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 36,5 s | 16,1 s | 0,3 | 1.785,1 | 574 | 292,3 | 38,4 | 0 |
| guerreiro | — | 19,3 s | 0 | 1.086,1 | 718,5 | 417,9 | 22 | 9,4 |
| mago | — | 9,5 s | 0 | 797,3 | 512 | 192 | 12 | 0 |
| arqueiro | — | 10,5 s | 0 | 931,5 | 576 | 256 | 13,6 | 0 |
| necromante | — | 17,2 s | 0 | 449,9 | 535,5 | 220,5 | 8,8 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 22 / 42,8 / 227,5 / 0 | 1.785,1 / 0 / 0 | 0 | 0 | 17,7 / 4,5 / 0 / 2,1 / 0 | 1,3 |
| guerreiro | 0 / 169,9 / 248 / 0 | 845,1 / 241 / 0 | 89,8 | 0 | 7,8 / 0,4 / 6,1 / 3,4 / 0 | 0,1 |
| mago | 0 / 0 / 192 / 0 | 724,8 / 72,5 / 0 | 0 | 0 | 5,8 / 5,5 / 0 / 0,7 / 0 | 1,1 |
| arqueiro | 0 / 0 / 256 / 0 | 895,5 / 36 / 0 | 0 | 0 | 8,2 / 4,3 / 0 / 1,1 / 0 | 1,5 |
| necromante | 0 / 0 / 220,5 / 0 | 247,8 / 0 / 202,1 | 26 | 0 | 7,3 / 2,1 / 0 / 1,2 / 0 | 2 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 27,3 / 3,9 | 26,1 / 4,3 / 10,5 | 0 / 0 | — | 0 / 17,6 |
| guerreiro | 16,6 / 1,5 | 10,4 / 1,4 / 4,3 | 0 / 0 | bloqueado: 143,6 | 0 / 14,5 |
| mago | 8,8 / 1,4 | 13 / 2,1 / 4,8 | 0 / 0 | — | 0 / 4,8 |
| arqueiro | 15,1 / 1 | 16,8 / 2,5 / 6,8 | 0 / 0 | — | 0 / 5,1 |
| necromante | 16,8 / 0 | 20 / 3,4 / 7,8 | 0,8 / 0 | — | 0 / 3,8 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 8,5 | 747,4 | 0 | 17 | 0 | — |
| aventureiro | explosao | 4 | 525,4 | 0 | 12 | 0 | — |
| aventureiro | golpe_atordoante | 2,6 | 199,5 | 0 | 7,9 | 0 | — |
| aventureiro | ataque_basico | 10,6 | 312,9 | 0 | 0 | 0 | — |
| aventureiro | item:pocao_vida | 1,8 | 0 | 227,5 | 0 | 0 | — |
| aventureiro | curar | 1,5 | 0 | 22 | 1,5 | 0 | 14,7 |
| aventureiro | efeito:cura_periodica | 0 | 0 | 42,8 | 0 | 0 | — |
| guerreiro | investida | 3 | 88,5 | 0 | 12 | 0 | — |
| guerreiro | redemoinho | 3,1 | 398 | 0 | 0 | 9,4 | — |
| guerreiro | efeito:dano_direto | 0 | 241 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 169,9 | 0 | 0 | — |
| guerreiro | grito_de_guerra | 1,8 | 0 | 0 | 7 | 0 | — |
| guerreiro | item:pocao_vida | 2 | 0 | 248 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 1 | 0 | 0 | 3 | 0 | — |
| guerreiro | ataque_basico | 7,8 | 358,6 | 0 | 0 | 0 | — |
| mago | bola_de_fogo | 1 | 236,9 | 0 | 3 | 0 | — |
| mago | dardo_arcano | 5,8 | 286,3 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 1 | 0 | 0 | 4 | 0 | — |
| mago | efeito:dano_direto | 0 | 15,9 | 0 | 0 | 0 | — |
| mago | raio_em_cadeia | 1 | 201,6 | 0 | 5 | 0 | — |
| mago | efeito:queimando | 0 | 56,6 | 0 | 0 | 0 | — |
| mago | item:pocao_vida | 1,5 | 0 | 192 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 1 | 0 | 0 | 4 | 0 | — |
| arqueiro | chuva_de_flechas | 1 | 229,6 | 0 | 4 | 0 | — |
| arqueiro | tiro | 11,3 | 377,4 | 0 | 0 | 0 | — |
| arqueiro | flecha_venenosa | 1 | 87,1 | 0 | 3 | 0 | — |
| arqueiro | tiro_em_leque | 0,9 | 201,4 | 0 | 2,6 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 36 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 2 | 0 | 256 | 0 | 0 | — |
| necromante | dardo_funesto | 2,1 | 49,5 | 0 | 4,3 | 0 | — |
| necromante | garras_do_ossuario | 1,1 | 32,6 | 0 | 2,3 | 0 | — |
| necromante | comando_sepulcral | 1 | 0 | 0 | 2 | 0 | — |
| necromante | toque_funesto | 12,4 | 165,6 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 202,1 | 0 | 0 | 0 | — |
| necromante | item:pocao_vida | 1,8 | 0 | 220,5 | 0 | 0 | — |
| necromante | dizimo_vital | 0,1 | 0 | 0 | 0,3 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 6/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 131,3% do DPS efetivo de guerreiro. Por encontro, recebeu 574 contra 718,5 HP de dano; recuperou 292,3 contra 417,9 HP (227,5 contra 248 de poções), gastando 38,4 contra 22 mana total e 0 contra 9,4 HP em conjurações. Começou com 325 contra 310 HP e defesa 2 contra 3. Escudos absorveram 0 contra 89,8; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 2 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 25 p.p. e de HP final 13,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 25 para 0 p.p.; contraste de 25 p.p. e alteração de 13,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × mago:** 6/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 85,8% do DPS efetivo de mago. Por encontro, recebeu 574 contra 512 HP de dano; recuperou 292,3 contra 192 HP (227,5 contra 192 de poções), gastando 38,4 contra 12 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 2 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 25 p.p. e de HP final 13,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 25 para 0 p.p.; contraste de 25 p.p. e alteração de 13,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × arqueiro:** 6/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 90% do DPS efetivo de arqueiro. Por encontro, recebeu 574 contra 576 HP de dano; recuperou 292,3 contra 256 HP (227,5 contra 256 de poções), gastando 38,4 contra 13,6 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 2 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 25 p.p. e de HP final 13,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 25 para 0 p.p.; contraste de 25 p.p. e alteração de 13,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 6/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 291,8% do DPS efetivo de necromante. Por encontro, recebeu 574 contra 535,5 HP de dano; recuperou 292,3 contra 220,5 HP (227,5 contra 220,5 de poções), gastando 38,4 contra 8,8 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 315 HP e defesa 2 contra 1. Escudos absorveram 0 contra 26; invocações causaram 0 contra 202,1 de dano e receberam 0 contra 142,5. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 2 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 25 p.p. e de HP final 13,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 25 para 0 p.p.; contraste de 25 p.p. e alteração de 13,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × mago:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 65,3% do DPS efetivo de mago. Por encontro, recebeu 718,5 contra 512 HP de dano; recuperou 417,9 contra 192 HP (248 contra 192 de poções), gastando 22 contra 12 mana total e 9,4 contra 0 HP em conjurações. Começou com 310 contra 320 HP e defesa 3 contra 1. Escudos absorveram 89,8 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 68,5% do DPS efetivo de arqueiro. Por encontro, recebeu 718,5 contra 576 HP de dano; recuperou 417,9 contra 256 HP (248 contra 256 de poções), gastando 22 contra 13,6 mana total e 9,4 contra 0 HP em conjurações. Começou com 310 contra 320 HP e defesa 3 contra 2. Escudos absorveram 89,8 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × necromante:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 222,3% do DPS efetivo de necromante. Por encontro, recebeu 718,5 contra 535,5 HP de dano; recuperou 417,9 contra 220,5 HP (248 contra 220,5 de poções), gastando 22 contra 8,8 mana total e 9,4 contra 0 HP em conjurações. Começou com 310 contra 315 HP e defesa 3 contra 1. Escudos absorveram 89,8 contra 26; invocações causaram 0 contra 202,1 de dano e receberam 0 contra 142,5. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. mago manteve 104,9% do DPS efetivo de arqueiro. Por encontro, recebeu 512 contra 576 HP de dano; recuperou 192 contra 256 HP (192 contra 256 de poções), gastando 12 contra 13,6 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 320 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × necromante:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. mago manteve 340,2% do DPS efetivo de necromante. Por encontro, recebeu 512 contra 535,5 HP de dano; recuperou 192 contra 220,5 HP (192 contra 220,5 de poções), gastando 12 contra 8,8 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 315 HP e defesa 1 contra 1. Escudos absorveram 0 contra 26; invocações causaram 0 contra 202,1 de dano e receberam 0 contra 142,5. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**arqueiro × necromante:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. arqueiro manteve 324,3% do DPS efetivo de necromante. Por encontro, recebeu 576 contra 535,5 HP de dano; recuperou 256 contra 220,5 HP (256 contra 220,5 de poções), gastando 13,6 contra 8,8 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 315 HP e defesa 2 contra 1. Escudos absorveram 0 contra 26; invocações causaram 0 contra 202,1 de dano e receberam 0 contra 142,5. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### O que mudou ao retirar cada fator

**aventureiro, Sem poções de vida:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 13,3 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**aventureiro, Sem habilidades da barra:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 13,3 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**aventureiro, Defesa plana zerada:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 6,9 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 0/8; 8; 0 | 25 | 13,3 | 85,5 (107,7% do completo) | 2 / 0 |
| aventureiro | Sem habilidades da barra | 0/8; 8; 0 | 25 | 13,3 | 29,2 (36,8% do completo) | 2 / 0 |
| aventureiro | Defesa plana zerada | 1/8; 7; 0 | 12,5 | 6,9 | 78 (98,2% do completo) | 1 / 0 |
| guerreiro | Sem cura do básico | 0/8; 8; 0 | 0 | 0 | 59,7 (98,8% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 55,6 (92% do completo) | 0 / 0 |
| guerreiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 42,3 (69,9% do completo) | 0 / 0 |
| guerreiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 58 (96% do completo) | 0 / 0 |
| mago | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 98,8 (106,7% do completo) | 0 / 0 |
| mago | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 31 (33,5% do completo) | 0 / 0 |
| mago | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 92,5 (100% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 99,7 (113% do completo) | 0 / 0 |
| arqueiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 48,7 (55,2% do completo) | 0 / 0 |
| arqueiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 89,6 (101,6% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 30,3 (111,2% do completo) | 0 / 0 |
| necromante | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 20 (73,6% do completo) | 0 / 0 |
| necromante | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 27,2 (100% do completo) | 0 / 0 |

## nível 30 · pesadelo · atrito

### Onde o desgaste aparece

| Classe | Onda | Chegaram/n inicial | Mortes / limites nesta onda | HP entrada → saída | Mana entrada → saída | Recebido / cura / mana gasta |
|---|---|---|---|---|---|---|
| aventureiro | 1 | 8/8 | 1 / 0 | 325 → 182,5 | 30 → 19,7 | 204,5 / 62 / 24,1 |
| aventureiro | 2 | 7/8 | 1 / 0 | 208,6 → 182,6 | 19,6 → 14,4 | 264 / 226 / 23,3 |
| aventureiro | 3 | 6/8 | 3 / 0 | 213 → 92,2 | 14,4 → 8,5 | 235,5 / 105,2 / 22,3 |
| aventureiro | 4 | 3/8 | 1 / 0 | 184,3 → 120,7 | 9,3 → 5,2 | 281,7 / 207 / 25 |
| aventureiro | 5 | 2/8 | 1 / 0 | 181 → 63,5 | 7,8 → 3,5 | 188 / 66 / 14,5 |
| guerreiro | 1 | 8/8 | 7 / 0 | 310 → 20,4 | 30 → 18,6 | 643,1 / 367 / 31,5 |
| guerreiro | 2 | 1/8 | 1 / 0 | 163 → 0 | 23 → 18,5 | 225 / 56 / 15 |
| mago | 1 | 8/8 | 3 / 0 | 320 → 103,5 | 30 → 27,3 | 376,5 / 160 / 24,4 |
| mago | 2 | 5/8 | 4 / 0 | 165,6 → 2,6 | 29,6 → 26,9 | 219,4 / 53,4 / 14 |
| mago | 3 | 1/8 | 1 / 0 | 13 → 0 | 27,5 → 18,5 | 24 / 11 / 22 |
| arqueiro | 1 | 8/8 | 0 / 0 | 320 → 277,6 | 30 → 16,3 | 74,4 / 32 / 30,3 |
| arqueiro | 2 | 8/8 | 1 / 0 | 277,6 → 178,3 | 16,3 → 26,9 | 244,1 / 144 / 12,3 |
| arqueiro | 3 | 7/8 | 5 / 0 | 203,7 → 47,4 | 26,7 → 14,5 | 247,7 / 91,4 / 27,4 |
| arqueiro | 4 | 2/8 | 1 / 0 | 166 → 97 | 7 → 13,8 | 70,5 / 0 / 9 |
| arqueiro | 5 | 1/8 | 1 / 0 | 194 → 0 | 2 → 14,5 | 197 / 0 / 10 |
| necromante | 1 | 8/8 | 1 / 0 | 315 → 244,6 | 30 → 27,6 | 133,4 / 63 / 28 |
| necromante | 2 | 7/8 | 2 / 0 | 279,6 → 125,1 | 27,2 → 29,7 | 190,4 / 36 / 13,7 |
| necromante | 3 | 5/8 | 0 / 0 | 175,2 → 194,6 | 29,6 → 21,2 | 50,2 / 55,8 / 42,8 |
| necromante | 4 | 5/8 | 1 / 3 | 194,6 → 129,4 | 21,2 → 27,5 | 180,8 / 110,8 / 8 |
| necromante | 5 | 1/8 | 0 / 1 | 148 → 184 | 30 → 19 | 0 / 36 / 24 |

Médias de cada onda incluem apenas quem chegou a ela; o denominador inicial mostra a seleção dos sobreviventes. Não compare a vida da onda 5 como se incluísse quem morreu antes.

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 79,6 s | 39,6 s | 2,4 | 2.573,8 | 764,8 | 432,8 | 74,3 | 0 |
| guerreiro | — | 26,9 s | 0,1 | 713,4 | 671,3 | 374 | 33,4 | 13,9 |
| mago | — | 30,4 s | 0,8 | 1.205,4 | 516,6 | 194,8 | 35,9 | 0 |
| arqueiro | — | 38,5 s | 2,3 | 2.579 | 577,5 | 256 | 70 | 0 |
| necromante | — | 61,2 s | 2,3 | 2.659,6 | 444,4 | 203,1 | 74,8 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 51,5 / 153,8 / 227,5 / 0 | 2.573,8 / 0 / 0 | 0 | 0 | 34,4 / 9,7 / 0 / 3,5 / 0,5 | 1 |
| guerreiro | 0 / 126 / 248 / 0 | 626,3 / 87,1 / 0 | 133,4 | 0 | 11,4 / 0,4 / 9,2 / 6,4 / 0 | 0 |
| mago | 0 / 2,8 / 192 / 0 | 1.137,8 / 67,6 / 0 | 12,5 | 0 | 18,7 / 4,1 / 0 / 4 / 0 | 1,7 |
| arqueiro | 0 / 0 / 256 / 0 | 2.515,5 / 63,5 / 0 | 0 | 0 | 30,9 / 7 / 0 / 4,8 / 0,5 | 2,4 |
| necromante | 0 / 45,6 / 157,5 / 0 | 1.213,4 / 0 / 1.446,3 | 65 | 24,8 | 36,3 / 9,1 / 0 / 3,4 / 0 | 2,2 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 53,9 / 9,9 | 38,9 / 7,9 / 15 | 0 / 0 | — | 22,9 / 39,9 |
| guerreiro | 25,8 / 3,3 | 10 / 1,4 / 4 | 0 / 0 | bloqueado: 234,6 | 1,1 / 21,4 |
| mago | 26,8 / 4,4 | 17,9 / 3,5 / 6,5 | 0,1 / 0,1 | — | 1,9 / 19,1 |
| arqueiro | 58,3 / 10,9 | 43,1 / 6,3 / 19,1 | 0 / 1,3 | — | 1,5 / 29,9 |
| necromante | 90,3 / 8,4 | 110,9 / 17,6 / 47 | 4 / 0 | — | 11,6 / 40,1 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 16,3 | 1.312,3 | 0 | 32,5 | 0 | — |
| aventureiro | explosao | 7,6 | 545,8 | 0 | 22,9 | 0 | — |
| aventureiro | golpe_atordoante | 5,1 | 242,5 | 0 | 15,4 | 0 | — |
| aventureiro | ataque_basico | 21,4 | 473,3 | 0 | 0 | 0 | — |
| aventureiro | curar | 3,5 | 0 | 51,5 | 3,5 | 0 | 14,7 |
| aventureiro | efeito:cura_periodica | 0 | 0 | 153,8 | 0 | 0 | — |
| aventureiro | item:pocao_vida | 1,8 | 0 | 227,5 | 0 | 0 | — |
| guerreiro | investida | 4,5 | 108,9 | 0 | 18 | 0 | — |
| guerreiro | redemoinho | 4,6 | 0 | 0 | 0 | 13,9 | — |
| guerreiro | efeito:dano_direto | 0 | 87,1 | 0 | 0 | 0 | — |
| guerreiro | grito_de_guerra | 2,3 | 0 | 0 | 9 | 0 | — |
| guerreiro | escudo_de_ferro | 2,1 | 0 | 0 | 6,4 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 126 | 0 | 0 | — |
| guerreiro | ataque_basico | 12,3 | 517,4 | 0 | 0 | 0 | — |
| guerreiro | item:pocao_vida | 2 | 0 | 248 | 0 | 0 | — |
| mago | bola_de_fogo | 3,1 | 223,4 | 0 | 9,4 | 0 | — |
| mago | dardo_arcano | 17,6 | 602,3 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 3 | 11,4 | 0 | 12 | 0 | — |
| mago | raio_em_cadeia | 2,8 | 300,8 | 0 | 13,8 | 0 | — |
| mago | efeito:dano_direto | 0 | 14,9 | 0 | 0 | 0 | — |
| mago | efeito:cura | 0 | 0 | 2,8 | 0 | 0 | — |
| mago | item:pocao_vida | 1,5 | 0 | 192 | 0 | 0 | — |
| mago | efeito:queimando | 0 | 52,8 | 0 | 0 | 0 | — |
| mago | barreira | 0,3 | 0 | 0 | 0,8 | 0 | — |
| arqueiro | flecha_perfurante | 6,3 | 374,1 | 0 | 25 | 0 | — |
| arqueiro | chuva_de_flechas | 4,5 | 447,4 | 0 | 18 | 0 | — |
| arqueiro | flecha_venenosa | 4,4 | 280,6 | 0 | 13,1 | 0 | — |
| arqueiro | tiro_em_leque | 4,6 | 345,4 | 0 | 13,9 | 0 | — |
| arqueiro | tiro | 38,5 | 1.068 | 0 | 0 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 48,5 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 2 | 0 | 256 | 0 | 0 | — |
| arqueiro | efeito:dano_direto | 0 | 15 | 0 | 0 | 0 | — |
| necromante | dardo_funesto | 18 | 363,5 | 0 | 36 | 0 | — |
| necromante | garras_do_ossuario | 9,8 | 241,6 | 0 | 19,5 | 0 | — |
| necromante | comando_sepulcral | 5,8 | 0 | 0 | 11,5 | 0 | — |
| necromante | toque_funesto | 52,9 | 608,3 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 1.446,3 | 0 | 0 | 0 | — |
| necromante | dizimo_vital | 3,9 | 0 | 0 | 7,8 | 0 | — |
| necromante | efeito:cura | 0 | 0 | 45,6 | 0 | 0 | — |
| necromante | item:pocao_vida | 1,3 | 0 | 157,5 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 7/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 213,6% do DPS efetivo de guerreiro. Por encontro, recebeu 764,8 contra 671,3 HP de dano; recuperou 432,8 contra 374 HP (227,5 contra 248 de poções), gastando 74,3 contra 33,4 mana total e 0 contra 13,9 HP em conjurações. Começou com 325 contra 310 HP e defesa 2 contra 3. Escudos absorveram 0 contra 133,4; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 12,5 p.p. e de HP final 4,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para 0 p.p.; contraste de 12,5 p.p. e alteração de 4,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × mago:** 7/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 128,5% do DPS efetivo de mago. Por encontro, recebeu 764,8 contra 516,6 HP de dano; recuperou 432,8 contra 194,8 HP (227,5 contra 192 de poções), gastando 74,3 contra 35,9 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 1. Escudos absorveram 0 contra 12,5; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 12,5 p.p. e de HP final 4,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para 0 p.p.; contraste de 12,5 p.p. e alteração de 4,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × arqueiro:** 7/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 85,2% do DPS efetivo de arqueiro. Por encontro, recebeu 764,8 contra 577,5 HP de dano; recuperou 432,8 contra 256 HP (227,5 contra 256 de poções), gastando 74,3 contra 70 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 12,5 p.p. e de HP final 4,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para 0 p.p.; contraste de 12,5 p.p. e alteração de 4,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 7/8 mortes contra 4/8; 0 contra 4 limites de tempo. aventureiro manteve 155,1% do DPS efetivo de necromante. Por encontro, recebeu 764,8 contra 444,4 HP de dano; recuperou 432,8 contra 203,1 HP (227,5 contra 157,5 de poções), gastando 74,3 contra 74,8 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 315 HP e defesa 2 contra 1. Escudos absorveram 0 contra 65; invocações causaram 0 contra 1.446,3 de dano e receberam 0 contra 727,8. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 12,5 p.p. e de HP final -22,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para 0 p.p.; contraste de 12,5 p.p. e alteração de -22,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × mago:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 60,1% do DPS efetivo de mago. Por encontro, recebeu 671,3 contra 516,6 HP de dano; recuperou 374 contra 194,8 HP (248 contra 192 de poções), gastando 33,4 contra 35,9 mana total e 13,9 contra 0 HP em conjurações. Começou com 310 contra 320 HP e defesa 3 contra 1. Escudos absorveram 133,4 contra 12,5; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 39,9% do DPS efetivo de arqueiro. Por encontro, recebeu 671,3 contra 577,5 HP de dano; recuperou 374 contra 256 HP (248 contra 256 de poções), gastando 33,4 contra 70 mana total e 13,9 contra 0 HP em conjurações. Começou com 310 contra 320 HP e defesa 3 contra 2. Escudos absorveram 133,4 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × necromante:** 8/8 mortes contra 4/8; 0 contra 4 limites de tempo. guerreiro manteve 72,6% do DPS efetivo de necromante. Por encontro, recebeu 671,3 contra 444,4 HP de dano; recuperou 374 contra 203,1 HP (248 contra 157,5 de poções), gastando 33,4 contra 74,8 mana total e 13,9 contra 0 HP em conjurações. Começou com 310 contra 315 HP e defesa 3 contra 1. Escudos absorveram 133,4 contra 65; invocações causaram 0 contra 1.446,3 de dano e receberam 0 contra 727,8. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -27,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -27,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. mago manteve 66,3% do DPS efetivo de arqueiro. Por encontro, recebeu 516,6 contra 577,5 HP de dano; recuperou 194,8 contra 256 HP (192 contra 256 de poções), gastando 35,9 contra 70 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 320 HP e defesa 1 contra 2. Escudos absorveram 12,5 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × necromante:** 8/8 mortes contra 4/8; 0 contra 4 limites de tempo. mago manteve 120,7% do DPS efetivo de necromante. Por encontro, recebeu 516,6 contra 444,4 HP de dano; recuperou 194,8 contra 203,1 HP (192 contra 157,5 de poções), gastando 35,9 contra 74,8 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 315 HP e defesa 1 contra 1. Escudos absorveram 12,5 contra 65; invocações causaram 0 contra 1.446,3 de dano e receberam 0 contra 727,8. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -27,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -27,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**arqueiro × necromante:** 8/8 mortes contra 4/8; 0 contra 4 limites de tempo. arqueiro manteve 182,1% do DPS efetivo de necromante. Por encontro, recebeu 577,5 contra 444,4 HP de dano; recuperou 256 contra 203,1 HP (256 contra 157,5 de poções), gastando 70 contra 74,8 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 315 HP e defesa 2 contra 1. Escudos absorveram 0 contra 65; invocações causaram 0 contra 1.446,3 de dano e receberam 0 contra 727,8. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -27,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -27,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### O que mudou ao retirar cada fator

**aventureiro, Sem poções de vida:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 4,9 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**aventureiro, Sem habilidades da barra:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 4,9 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 0/8; 8; 0 | 12,5 | 4,9 | 59,9 (105,8% do completo) | 1 / 0 |
| aventureiro | Sem habilidades da barra | 0/8; 8; 0 | 12,5 | 4,9 | 28,4 (50,2% do completo) | 1 / 0 |
| aventureiro | Defesa plana zerada | 1/8; 7; 0 | 0 | 0,1 | 57,3 (101,1% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 0/8; 8; 0 | 0 | 0 | 26,4 (99,5% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 30,3 (114,2% do completo) | 0 / 0 |
| guerreiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 39,3 (148,1% do completo) | 0 / 0 |
| guerreiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 25,8 (97,4% do completo) | 0 / 0 |
| mago | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 42,6 (96,6% do completo) | 0 / 0 |
| mago | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 41,5 (94,1% do completo) | 0 / 0 |
| mago | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 44,1 (100% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 68,8 (103,5% do completo) | 0 / 0 |
| arqueiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 52,8 (79,4% do completo) | 0 / 0 |
| arqueiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 67,2 (101,1% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 0/8; 6; 2 | 0 | 17,2 | 37,9 (103,9% do completo) | 0 / 0 |
| necromante | Sem habilidades da barra | 0/8; 8; 0 | 0 | 27,1 | 22,2 (60,9% do completo) | 0 / 0 |
| necromante | Defesa plana zerada | 0/8; 4; 4 | 0 | 3,1 | 36,6 (100,2% do completo) | 0 / 0 |

## nível 30 · pesadelo · chefe

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 21,2 s | — | 1 | 1.194 | 323,6 | 200,3 | 35,9 | 0 |
| guerreiro | 21,9 s | — | 1 | 1.278 | 171 | 156 | 22,6 | 11,3 |
| mago | 22,5 s | 25,4 s | 0,9 | 1.272,3 | 296,8 | 145,4 | 37 | 0 |
| arqueiro | 19,8 s | — | 1 | 1.226,3 | 316,6 | 192 | 32 | 0 |
| necromante | 34,8 s | 32,5 s | 0,9 | 1.303,9 | 255,9 | 105,8 | 38,8 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 12,3 / 25,5 / 162,5 / 0 | 1.194 / 0 / 0 | 0 | 0 | 15,5 / 6,5 / 1,4 / 0,2 / 0 | 1,4 |
| guerreiro | 0 / 125 / 31 / 0 | 1.136,6 / 141,4 / 0 | 27,6 | 0 | 8,4 / 1,8 / 7,9 / 0 / 0 | 0,8 |
| mago | 0 / 1,4 / 144 / 0 | 1.238,8 / 33,5 / 0 | 5 | 0 | 17,7 / 5,2 / 0,9 / 0 / 0 | 1,8 |
| arqueiro | 0 / 0 / 192 / 0 | 1.177,3 / 49 / 0 | 0 | 0 | 14,2 / 5,2 / 1,8 / 0 / 0 | 1,8 |
| necromante | 0 / 11,3 / 94,5 / 0 | 641,8 / 0 / 662,1 | 43,1 | 2,3 | 17,8 / 8,3 / 1,2 / 0 / 0 | 2,2 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 23,8 / 4,1 | 18,3 / 3,4 / 5,6 | 0 / 0 | bloqueado: 3,6 | 0 / 16,4 |
| guerreiro | 17,4 / 1,4 | 12,9 / 1,6 / 6,6 | 0,3 / 0 | bloqueado: 95,5 | 0 / 15,8 |
| mago | 25 / 5,6 | 18,4 / 3,1 / 8,1 | 0,6 / 0 | — | 0 / 17,8 |
| arqueiro | 26,6 / 7 | 19,1 / 3,4 / 8,9 | 0,3 / 0,5 | bloqueado: 3,5 | 0 / 14,4 |
| necromante | 44,4 / 4,4 | 49,1 / 6,4 / 20,4 | 2,3 / 0 | — | 7,5 / 20,3 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 7,9 | 559,9 | 0 | 15,8 | 0 | — |
| aventureiro | explosao | 4 | 315,3 | 0 | 12 | 0 | — |
| aventureiro | golpe_atordoante | 2,5 | 138 | 0 | 7,5 | 0 | — |
| aventureiro | ataque_basico | 8,8 | 180,9 | 0 | 0 | 0 | — |
| aventureiro | item:pocao_vida | 1,3 | 0 | 162,5 | 0 | 0 | — |
| aventureiro | curar | 0,6 | 0 | 12,3 | 0,6 | 0 | 19,6 |
| aventureiro | efeito:cura_periodica | 0 | 0 | 25,5 | 0 | 0 | — |
| guerreiro | investida | 3,6 | 350,4 | 0 | 14,5 | 0 | — |
| guerreiro | redemoinho | 3,8 | 417,3 | 0 | 0 | 11,3 | — |
| guerreiro | efeito:dano_direto | 0 | 141,4 | 0 | 0 | 0 | — |
| guerreiro | grito_de_guerra | 1,8 | 0 | 0 | 7 | 0 | — |
| guerreiro | ataque_basico | 7,9 | 369 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 125 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 0,4 | 0 | 0 | 1,1 | 0 | — |
| guerreiro | item:pocao_vida | 0,3 | 0 | 31 | 0 | 0 | — |
| mago | bola_de_fogo | 3,6 | 162,5 | 0 | 10,9 | 0 | — |
| mago | dardo_arcano | 15,5 | 474,8 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 3 | 257,3 | 0 | 12 | 0 | — |
| mago | raio_em_cadeia | 2,8 | 344,3 | 0 | 13,8 | 0 | — |
| mago | efeito:queimando | 0 | 10,1 | 0 | 0 | 0 | — |
| mago | efeito:dano_direto | 0 | 23,4 | 0 | 0 | 0 | — |
| mago | efeito:cura | 0 | 0 | 1,4 | 0 | 0 | — |
| mago | item:pocao_vida | 1,1 | 0 | 144 | 0 | 0 | — |
| mago | barreira | 0,1 | 0 | 0 | 0,4 | 0 | — |
| arqueiro | flecha_perfurante | 3 | 188,5 | 0 | 12 | 0 | — |
| arqueiro | chuva_de_flechas | 2 | 216,9 | 0 | 8 | 0 | — |
| arqueiro | tiro | 17,6 | 454,4 | 0 | 0 | 0 | — |
| arqueiro | flecha_venenosa | 2 | 113,3 | 0 | 6 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 40,6 | 0 | 0 | 0 | — |
| arqueiro | tiro_em_leque | 2 | 204,3 | 0 | 6 | 0 | — |
| arqueiro | efeito:dano_direto | 0 | 8,4 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 1,5 | 0 | 192 | 0 | 0 | — |
| necromante | dardo_funesto | 9,1 | 216,1 | 0 | 18,3 | 0 | — |
| necromante | garras_do_ossuario | 5,3 | 132,3 | 0 | 10,5 | 0 | — |
| necromante | comando_sepulcral | 3,1 | 0 | 0 | 6,3 | 0 | — |
| necromante | toque_funesto | 25 | 293,4 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 662,1 | 0 | 0 | 0 | — |
| necromante | dizimo_vital | 1,9 | 0 | 0 | 3,8 | 0 | — |
| necromante | efeito:cura | 0 | 0 | 11,3 | 0 | 0 | — |
| necromante | item:pocao_vida | 0,8 | 0 | 94,5 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 87,4% do DPS efetivo de guerreiro. Por encontro, recebeu 323,6 contra 171 HP de dano; recuperou 200,3 contra 156 HP (162,5 contra 31 de poções), gastando 35,9 contra 22,6 mana total e 0 contra 11,3 HP em conjurações. Começou com 325 contra 310 HP e defesa 2 contra 3. Escudos absorveram 0 contra 27,6; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 0 p.p. e de HP final -29,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -75 p.p.; contraste de 75 p.p. e alteração de 39,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × mago:** 0/8 mortes contra 1/8; 0 contra 0 limites de tempo. aventureiro manteve 108,9% do DPS efetivo de mago. Por encontro, recebeu 323,6 contra 296,8 HP de dano; recuperou 200,3 contra 145,4 HP (162,5 contra 144 de poções), gastando 35,9 contra 37 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 1. Escudos absorveram 0 contra 5; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 12,5 p.p. e de HP final 9,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para 0 p.p.; contraste de 12,5 p.p. e alteração de 9,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 87,4% do DPS efetivo de arqueiro. Por encontro, recebeu 323,6 contra 316,6 HP de dano; recuperou 200,3 contra 192 HP (162,5 contra 192 de poções), gastando 35,9 contra 32 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -50 p.p.; contraste de 50 p.p. e alteração de 24,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 0/8 mortes contra 1/8; 0 contra 0 limites de tempo. aventureiro manteve 151,8% do DPS efetivo de necromante. Por encontro, recebeu 323,6 contra 255,9 HP de dano; recuperou 200,3 contra 105,8 HP (162,5 contra 94,5 de poções), gastando 35,9 contra 38,8 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 315 HP e defesa 2 contra 1. Escudos absorveram 0 contra 43,1; invocações causaram 0 contra 662,1 de dano e receberam 0 contra 261,8. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 12,5 p.p. e de HP final 7,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para 25 p.p.; contraste de -12,5 p.p. e alteração de 12,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × mago:** 0/8 mortes contra 1/8; 0 contra 0 limites de tempo. guerreiro manteve 124,6% do DPS efetivo de mago. Por encontro, recebeu 171 contra 296,8 HP de dano; recuperou 156 contra 145,4 HP (31 contra 144 de poções), gastando 22,6 contra 37 mana total e 11,3 contra 0 HP em conjurações. Começou com 310 contra 320 HP e defesa 3 contra 1. Escudos absorveram 27,6 contra 5; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 12,5 p.p. e de HP final 38,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para 75 p.p.; contraste de -62,5 p.p. e alteração de -30,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: guerreiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 100% do DPS efetivo de arqueiro. Por encontro, recebeu 171 contra 316,6 HP de dano; recuperou 156 contra 192 HP (31 contra 192 de poções), gastando 22,6 contra 32 mana total e 11,3 contra 0 HP em conjurações. Começou com 310 contra 320 HP e defesa 3 contra 2. Escudos absorveram 27,6 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 30,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 62,5 p.p.; contraste de -62,5 p.p. e alteração de -41,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × necromante:** 0/8 mortes contra 1/8; 0 contra 0 limites de tempo. guerreiro manteve 173,6% do DPS efetivo de necromante. Por encontro, recebeu 171 contra 255,9 HP de dano; recuperou 156 contra 105,8 HP (31 contra 94,5 de poções), gastando 22,6 contra 38,8 mana total e 11,3 contra 0 HP em conjurações. Começou com 310 contra 315 HP e defesa 3 contra 1. Escudos absorveram 27,6 contra 43,1; invocações causaram 0 contra 662,1 de dano e receberam 0 contra 261,8. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só guerreiro venceu, 0 só necromante venceu; diferença de vitória 12,5 p.p. e de HP final 36,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para 75 p.p.; contraste de -62,5 p.p. e alteração de -32,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: guerreiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × arqueiro:** 1/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 80,3% do DPS efetivo de arqueiro. Por encontro, recebeu 296,8 contra 316,6 HP de dano; recuperou 145,4 contra 192 HP (144 contra 192 de poções), gastando 37 contra 32 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 320 HP e defesa 1 contra 2. Escudos absorveram 5 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 1 só arqueiro venceu; diferença de vitória -12,5 p.p. e de HP final -8,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para -50 p.p.; contraste de 37,5 p.p. e alteração de 14,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: arqueiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × necromante:** 1/8 mortes contra 1/8; 0 contra 0 limites de tempo. mago manteve 139,3% do DPS efetivo de necromante. Por encontro, recebeu 296,8 contra 255,9 HP de dano; recuperou 145,4 contra 105,8 HP (144 contra 94,5 de poções), gastando 37 contra 38,8 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 315 HP e defesa 1 contra 1. Escudos absorveram 5 contra 43,1; invocações causaram 0 contra 662,1 de dano e receberam 0 contra 261,8. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só mago venceu, 1 só necromante venceu; diferença de vitória 0 p.p. e de HP final -2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Defesa plana zerada**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 12,5 p.p.; contraste de -12,5 p.p. e alteração de -1,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**arqueiro × necromante:** 0/8 mortes contra 1/8; 0 contra 0 limites de tempo. arqueiro manteve 173,6% do DPS efetivo de necromante. Por encontro, recebeu 316,6 contra 255,9 HP de dano; recuperou 192 contra 105,8 HP (192 contra 94,5 de poções), gastando 32 contra 38,8 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 315 HP e defesa 2 contra 1. Escudos absorveram 0 contra 43,1; invocações causaram 0 contra 662,1 de dano e receberam 0 contra 261,8. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só arqueiro venceu, 0 só necromante venceu; diferença de vitória 12,5 p.p. e de HP final 6,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para 50 p.p.; contraste de -37,5 p.p. e alteração de -16,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: arqueiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

### O que mudou ao retirar cada fator

**aventureiro, Sem poções de vida:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 31,8 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**aventureiro, Sem habilidades da barra:** retirar esse fator perdeu 8 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 62 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Sem habilidades da barra:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 22,4 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem poções de vida:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 32,1 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem habilidades da barra:** retirar esse fator perdeu 7 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 52,7 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem poções de vida:** retirar esse fator perdeu 5 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 46,1 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem habilidades da barra:** retirar esse fator perdeu 4 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 37,9 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Defesa plana zerada:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 10 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem poções de vida:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 19,4 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem habilidades da barra:** retirar esse fator perdeu 7 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 54,7 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 6/8; 2; 0 | 25 | 31,8 | 56,1 (100,4% do completo) | 2 / 0 |
| aventureiro | Sem habilidades da barra | 0/8; 8; 0 | 100 | 62 | 26 (46,5% do completo) | 8 / 0 |
| aventureiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 3,2 | 56 (100,3% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 8/8; 0; 0 | 0 | 2,7 | 63,9 (100% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 8/8; 0; 0 | 0 | 5 | 63,9 (100% do completo) | 0 / 0 |
| guerreiro | Sem habilidades da barra | 6/8; 2; 0 | 25 | 22,4 | 34,5 (54% do completo) | 2 / 0 |
| guerreiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 1 | 63,9 (100% do completo) | 0 / 0 |
| mago | Sem poções de vida | 4/8; 4; 0 | 37,5 | 32,1 | 50,4 (98,3% do completo) | 3 / 0 |
| mago | Sem habilidades da barra | 0/8; 8; 0 | 87,5 | 52,7 | 31,3 (61% do completo) | 7 / 0 |
| mago | Defesa plana zerada | 8/8; 0; 0 | -12,5 | 0,1 | 50,7 (98,9% do completo) | 0 / 1 |
| arqueiro | Sem poções de vida | 3/8; 5; 0 | 62,5 | 46,1 | 66,8 (104,6% do completo) | 5 / 0 |
| arqueiro | Sem habilidades da barra | 4/8; 4; 0 | 50 | 37,9 | 47,6 (74,5% do completo) | 4 / 0 |
| arqueiro | Defesa plana zerada | 7/8; 1; 0 | 12,5 | 10 | 64,8 (101,4% do completo) | 1 / 0 |
| necromante | Sem poções de vida | 4/8; 4; 0 | 37,5 | 19,4 | 37,3 (101,2% do completo) | 3 / 0 |
| necromante | Sem habilidades da barra | 0/8; 8; 0 | 87,5 | 54,7 | 18,3 (49,8% do completo) | 7 / 0 |
| necromante | Defesa plana zerada | 7/8; 1; 0 | 0 | 1,3 | 36,8 (100% do completo) | 0 / 0 |
