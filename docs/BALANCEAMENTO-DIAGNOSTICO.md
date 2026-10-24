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
| nível 1 · normal · duelo | aventureiro | 8/8 (67,6–100%) | 0 | 0 | 17,6 | 78,1 |
| nível 1 · normal · duelo | guerreiro | 8/8 (67,6–100%) | 0 | 0 | 15,5 | 83,2 |
| nível 1 · normal · duelo | mago | 8/8 (67,6–100%) | 0 | 0 | 11,3 | 69,9 |
| nível 1 · normal · duelo | arqueiro | 8/8 (67,6–100%) | 0 | 0 | 16,3 | 91,6 |
| nível 1 · normal · duelo | necromante | 8/8 (67,6–100%) | 0 | 0 | 17,2 | 92 |
| nível 1 · normal · pressao | aventureiro | 8/8 (67,6–100%) | 0 | 0 | 16,8 | 55,6 |
| nível 1 · normal · pressao | guerreiro | 8/8 (67,6–100%) | 0 | 0 | 14,7 | 92,1 |
| nível 1 · normal · pressao | mago | 8/8 (67,6–100%) | 0 | 0 | 18,9 | 55,3 |
| nível 1 · normal · pressao | arqueiro | 7/8 (52,9–97,8%) | 1 | 0 | 14,7 | 37,2 |
| nível 1 · normal · pressao | necromante | 8/8 (67,6–100%) | 0 | 0 | 20,1 | 65,3 |
| nível 1 · normal · atrito | aventureiro | 8/8 (67,6–100%) | 0 | 0 | 15,1 | 50,5 |
| nível 1 · normal · atrito | guerreiro | 8/8 (67,6–100%) | 0 | 0 | 14,2 | 87,6 |
| nível 1 · normal · atrito | mago | 4/8 (21,5–78,5%) | 4 | 0 | 13,4 | 12,9 |
| nível 1 · normal · atrito | arqueiro | 8/8 (67,6–100%) | 0 | 0 | 15,4 | 49,5 |
| nível 1 · normal · atrito | necromante | 8/8 (67,6–100%) | 0 | 0 | 27,3 | 92,4 |
| nível 1 · normal · chefe | aventureiro | 4/8 (21,5–78,5%) | 4 | 0 | 14,8 | 9,8 |
| nível 1 · normal · chefe | guerreiro | 7/8 (52,9–97,8%) | 1 | 0 | 13,9 | 74,3 |
| nível 1 · normal · chefe | mago | 2/8 (7,1–59,1%) | 6 | 0 | 11,8 | 8,2 |
| nível 1 · normal · chefe | arqueiro | 8/8 (67,6–100%) | 0 | 0 | 14,2 | 54,1 |
| nível 1 · normal · chefe | necromante | 6/8 (40,9–92,9%) | 2 | 0 | 14,5 | 54,3 |
| nível 1 · pesadelo · duelo | aventureiro | 8/8 (67,6–100%) | 0 | 0 | 11,2 | 61,8 |
| nível 1 · pesadelo · duelo | guerreiro | 7/8 (52,9–97,8%) | 1 | 0 | 7,3 | 67,9 |
| nível 1 · pesadelo · duelo | mago | 8/8 (67,6–100%) | 0 | 0 | 7,5 | 44,1 |
| nível 1 · pesadelo · duelo | arqueiro | 8/8 (67,6–100%) | 0 | 0 | 8,4 | 66,1 |
| nível 1 · pesadelo · duelo | necromante | 7/8 (52,9–97,8%) | 1 | 0 | 7,9 | 56,8 |
| nível 1 · pesadelo · pressao | aventureiro | 0/8 (0–32,4%) | 8 | 0 | 11,1 | 0 |
| nível 1 · pesadelo · pressao | guerreiro | 0/8 (0–32,4%) | 8 | 0 | 9,2 | 0 |
| nível 1 · pesadelo · pressao | mago | 0/8 (0–32,4%) | 8 | 0 | 10,9 | 0 |
| nível 1 · pesadelo · pressao | arqueiro | 0/8 (0–32,4%) | 8 | 0 | 9,2 | 0 |
| nível 1 · pesadelo · pressao | necromante | 1/8 (2,2–47,1%) | 7 | 0 | 7,7 | 8,5 |
| nível 1 · pesadelo · atrito | aventureiro | 0/8 (0–32,4%) | 8 | 0 | 8,7 | 0 |
| nível 1 · pesadelo · atrito | guerreiro | 0/8 (0–32,4%) | 8 | 0 | 7,1 | 0 |
| nível 1 · pesadelo · atrito | mago | 0/8 (0–32,4%) | 8 | 0 | 8 | 0 |
| nível 1 · pesadelo · atrito | arqueiro | 0/8 (0–32,4%) | 8 | 0 | 9,6 | 0 |
| nível 1 · pesadelo · atrito | necromante | 8/8 (67,6–100%) | 0 | 0 | 15,6 | 75,2 |
| nível 1 · pesadelo · chefe | aventureiro | 0/8 (0–32,4%) | 8 | 0 | 8,4 | 0 |
| nível 1 · pesadelo · chefe | guerreiro | 0/8 (0–32,4%) | 8 | 0 | 8,5 | 0 |
| nível 1 · pesadelo · chefe | mago | 0/8 (0–32,4%) | 8 | 0 | 8,1 | 0 |
| nível 1 · pesadelo · chefe | arqueiro | 0/8 (0–32,4%) | 8 | 0 | 7,4 | 0 |
| nível 1 · pesadelo · chefe | necromante | 0/8 (0–32,4%) | 8 | 0 | 7,4 | 0 |
| nível 10 · normal · duelo | aventureiro | 8/8 (67,6–100%) | 0 | 0 | 89,8 | 85,7 |
| nível 10 · normal · duelo | guerreiro | 8/8 (67,6–100%) | 0 | 0 | 53,7 | 88 |
| nível 10 · normal · duelo | mago | 8/8 (67,6–100%) | 0 | 0 | 60,6 | 80,5 |
| nível 10 · normal · duelo | arqueiro | 8/8 (67,6–100%) | 0 | 0 | 42,5 | 85,1 |
| nível 10 · normal · duelo | necromante | 8/8 (67,6–100%) | 0 | 0 | 39,1 | 88,3 |
| nível 10 · normal · pressao | aventureiro | 8/8 (67,6–100%) | 0 | 0 | 50,8 | 58,5 |
| nível 10 · normal · pressao | guerreiro | 8/8 (67,6–100%) | 0 | 0 | 53,3 | 88,5 |
| nível 10 · normal · pressao | mago | 8/8 (67,6–100%) | 0 | 0 | 80,4 | 67,3 |
| nível 10 · normal · pressao | arqueiro | 7/8 (52,9–97,8%) | 1 | 0 | 49,9 | 45,6 |
| nível 10 · normal · pressao | necromante | 3/8 (13,7–69,4%) | 5 | 0 | 33,9 | 16,4 |
| nível 10 · normal · atrito | aventureiro | 8/8 (67,6–100%) | 0 | 0 | 49,8 | 55,9 |
| nível 10 · normal · atrito | guerreiro | 8/8 (67,6–100%) | 0 | 0 | 49,2 | 91,8 |
| nível 10 · normal · atrito | mago | 7/8 (52,9–97,8%) | 1 | 0 | 44,4 | 44,2 |
| nível 10 · normal · atrito | arqueiro | 8/8 (67,6–100%) | 0 | 0 | 44,8 | 35,4 |
| nível 10 · normal · atrito | necromante | 8/8 (67,6–100%) | 0 | 0 | 63,1 | 90,1 |
| nível 10 · normal · chefe | aventureiro | 8/8 (67,6–100%) | 0 | 0 | 59 | 71,8 |
| nível 10 · normal · chefe | guerreiro | 8/8 (67,6–100%) | 0 | 0 | 68,7 | 94,6 |
| nível 10 · normal · chefe | mago | 8/8 (67,6–100%) | 0 | 0 | 52,6 | 89,8 |
| nível 10 · normal · chefe | arqueiro | 8/8 (67,6–100%) | 0 | 0 | 50,4 | 80,3 |
| nível 10 · normal · chefe | necromante | 8/8 (67,6–100%) | 0 | 0 | 39,3 | 86,3 |
| nível 10 · pesadelo · duelo | aventureiro | 8/8 (67,6–100%) | 0 | 0 | 41,6 | 68,8 |
| nível 10 · pesadelo · duelo | guerreiro | 8/8 (67,6–100%) | 0 | 0 | 28,2 | 75,8 |
| nível 10 · pesadelo · duelo | mago | 8/8 (67,6–100%) | 0 | 0 | 28,4 | 60,3 |
| nível 10 · pesadelo · duelo | arqueiro | 8/8 (67,6–100%) | 0 | 0 | 23,2 | 48 |
| nível 10 · pesadelo · duelo | necromante | 8/8 (67,6–100%) | 0 | 0 | 20,7 | 68,9 |
| nível 10 · pesadelo · pressao | aventureiro | 0/8 (0–32,4%) | 8 | 0 | 36,7 | 0 |
| nível 10 · pesadelo · pressao | guerreiro | 4/8 (21,5–78,5%) | 4 | 0 | 33,1 | 35,3 |
| nível 10 · pesadelo · pressao | mago | 3/8 (13,7–69,4%) | 5 | 0 | 45 | 8,4 |
| nível 10 · pesadelo · pressao | arqueiro | 0/8 (0–32,4%) | 8 | 0 | 30,2 | 0 |
| nível 10 · pesadelo · pressao | necromante | 0/8 (0–32,4%) | 8 | 0 | 16,9 | 0 |
| nível 10 · pesadelo · atrito | aventureiro | 0/8 (0–32,4%) | 8 | 0 | 30,6 | 0 |
| nível 10 · pesadelo · atrito | guerreiro | 4/8 (21,5–78,5%) | 4 | 0 | 28,5 | 43,1 |
| nível 10 · pesadelo · atrito | mago | 0/8 (0–32,4%) | 8 | 0 | 30,3 | 0 |
| nível 10 · pesadelo · atrito | arqueiro | 0/8 (0–32,4%) | 8 | 0 | 28,4 | 0 |
| nível 10 · pesadelo · atrito | necromante | 8/8 (67,6–100%) | 0 | 0 | 30,1 | 61,1 |
| nível 10 · pesadelo · chefe | aventureiro | 8/8 (67,6–100%) | 0 | 0 | 29,2 | 41 |
| nível 10 · pesadelo · chefe | guerreiro | 8/8 (67,6–100%) | 0 | 0 | 39,1 | 81,8 |
| nível 10 · pesadelo · chefe | mago | 8/8 (67,6–100%) | 0 | 0 | 36 | 81,7 |
| nível 10 · pesadelo · chefe | arqueiro | 4/8 (21,5–78,5%) | 4 | 0 | 22,4 | 26,1 |
| nível 10 · pesadelo · chefe | necromante | 8/8 (67,6–100%) | 0 | 0 | 22,5 | 59,3 |
| nível 30 · normal · duelo | aventureiro | 8/8 (67,6–100%) | 0 | 0 | 112,9 | 79,7 |
| nível 30 · normal · duelo | guerreiro | 8/8 (67,6–100%) | 0 | 0 | 38,3 | 77,7 |
| nível 30 · normal · duelo | mago | 8/8 (67,6–100%) | 0 | 0 | 94,3 | 86 |
| nível 30 · normal · duelo | arqueiro | 8/8 (67,6–100%) | 0 | 0 | 109,6 | 98 |
| nível 30 · normal · duelo | necromante | 8/8 (67,6–100%) | 0 | 0 | 54,9 | 79,7 |
| nível 30 · normal · pressao | aventureiro | 8/8 (67,6–100%) | 0 | 0 | 106,9 | 57,8 |
| nível 30 · normal · pressao | guerreiro | 8/8 (67,6–100%) | 0 | 0 | 89,7 | 84 |
| nível 30 · normal · pressao | mago | 3/8 (13,7–69,4%) | 5 | 0 | 122,5 | 15,6 |
| nível 30 · normal · pressao | arqueiro | 1/8 (2,2–47,1%) | 7 | 0 | 126,8 | 4,2 |
| nível 30 · normal · pressao | necromante | 0/8 (0–32,4%) | 8 | 0 | 45,9 | 0 |
| nível 30 · normal · atrito | aventureiro | 7/8 (52,9–97,8%) | 1 | 0 | 88,9 | 50 |
| nível 30 · normal · atrito | guerreiro | 5/8 (30,6–86,3%) | 0 | 3 | 55 | 61,6 |
| nível 30 · normal · atrito | mago | 4/8 (21,5–78,5%) | 4 | 0 | 82,7 | 13,6 |
| nível 30 · normal · atrito | arqueiro | 7/8 (52,9–97,8%) | 1 | 0 | 110 | 43,9 |
| nível 30 · normal · atrito | necromante | 8/8 (67,6–100%) | 0 | 0 | 97,1 | 80,6 |
| nível 30 · normal · chefe | aventureiro | 8/8 (67,6–100%) | 0 | 0 | 98,1 | 70,7 |
| nível 30 · normal · chefe | guerreiro | 8/8 (67,6–100%) | 0 | 0 | 101,5 | 98,8 |
| nível 30 · normal · chefe | mago | 8/8 (67,6–100%) | 0 | 0 | 74,1 | 94,4 |
| nível 30 · normal · chefe | arqueiro | 8/8 (67,6–100%) | 0 | 0 | 112 | 60 |
| nível 30 · normal · chefe | necromante | 8/8 (67,6–100%) | 0 | 0 | 57,3 | 86,7 |
| nível 30 · pesadelo · duelo | aventureiro | 8/8 (67,6–100%) | 0 | 0 | 65,9 | 58,5 |
| nível 30 · pesadelo · duelo | guerreiro | 2/8 (7,1–59,1%) | 6 | 0 | 24,8 | 17 |
| nível 30 · pesadelo · duelo | mago | 6/8 (40,9–92,9%) | 2 | 0 | 56,9 | 47,1 |
| nível 30 · pesadelo · duelo | arqueiro | 8/8 (67,6–100%) | 0 | 0 | 70,7 | 71 |
| nível 30 · pesadelo · duelo | necromante | 7/8 (52,9–97,8%) | 1 | 0 | 31,1 | 46,2 |
| nível 30 · pesadelo · pressao | aventureiro | 2/8 (7,1–59,1%) | 6 | 0 | 76,7 | 14,2 |
| nível 30 · pesadelo · pressao | guerreiro | 0/8 (0–32,4%) | 8 | 0 | 60,5 | 0 |
| nível 30 · pesadelo · pressao | mago | 0/8 (0–32,4%) | 8 | 0 | 76,4 | 0 |
| nível 30 · pesadelo · pressao | arqueiro | 0/8 (0–32,4%) | 8 | 0 | 88,2 | 0 |
| nível 30 · pesadelo · pressao | necromante | 1/8 (2,2–47,1%) | 7 | 0 | 32,1 | 3,7 |
| nível 30 · pesadelo · atrito | aventureiro | 0/8 (0–32,4%) | 8 | 0 | 54,1 | 0 |
| nível 30 · pesadelo · atrito | guerreiro | 0/8 (0–32,4%) | 8 | 0 | 26,5 | 0 |
| nível 30 · pesadelo · atrito | mago | 0/8 (0–32,4%) | 8 | 0 | 43 | 0 |
| nível 30 · pesadelo · atrito | arqueiro | 0/8 (0–32,4%) | 8 | 0 | 62,5 | 0 |
| nível 30 · pesadelo · atrito | necromante | 1/8 (2,2–47,1%) | 4 | 3 | 43,1 | 22,3 |
| nível 30 · pesadelo · chefe | aventureiro | 8/8 (67,6–100%) | 0 | 0 | 54,7 | 71,7 |
| nível 30 · pesadelo · chefe | guerreiro | 8/8 (67,6–100%) | 0 | 0 | 63,9 | 91,5 |
| nível 30 · pesadelo · chefe | mago | 4/8 (21,5–78,5%) | 4 | 0 | 42,4 | 31,4 |
| nível 30 · pesadelo · chefe | arqueiro | 8/8 (67,6–100%) | 0 | 0 | 60,1 | 49,7 |
| nível 30 · pesadelo · chefe | necromante | 6/8 (40,9–92,9%) | 2 | 0 | 29,3 | 44,6 |

## Sinais prioritários para investigar

Até oito diferenças de mortalidade com mais vitórias e ao menos 90% do DPS da classe comparada. A seleção é exploratória; o detalhamento abaixo preserva todos os cenários, inclusive os que não mostraram diferença.

### nível 1 · pesadelo · atrito: necromante sobreviveu mais sem perder mais de 10% do DPS

**necromante × aventureiro:** 0/8 mortes contra 8/8; 0 contra 0 limites de tempo. necromante manteve 178,8% do DPS efetivo de aventureiro. Por encontro, recebeu 46,6 contra 173,4 HP de dano; recuperou 23,5 contra 68,1 HP (14,5 contra 65 de poções), gastando 29,4 contra 26,8 mana total e 0 contra 0 HP em conjurações. Começou com 72 contra 100 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 417,3 contra 0 de dano e receberam 99,8 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 100 para 62,5 p.p.; contraste de 37,5 p.p. e alteração de 45,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### nível 1 · pesadelo · atrito: necromante sobreviveu mais sem perder mais de 10% do DPS

**necromante × guerreiro:** 0/8 mortes contra 8/8; 0 contra 0 limites de tempo. necromante manteve 218,6% do DPS efetivo de guerreiro. Por encontro, recebeu 46,6 contra 237,8 HP de dano; recuperou 23,5 contra 158 HP (14,5 contra 74 de poções), gastando 29,4 contra 31,5 mana total e 0 contra 19,9 HP em conjurações. Começou com 72 contra 93 HP e defesa 1 contra 3. Escudos absorveram 0 contra 31,5; invocações causaram 417,3 contra 0 de dano e receberam 99,8 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 100 para 37,5 p.p.; contraste de 62,5 p.p. e alteração de 70,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### nível 1 · pesadelo · atrito: necromante sobreviveu mais sem perder mais de 10% do DPS

**necromante × mago:** 0/8 mortes contra 8/8; 0 contra 0 limites de tempo. necromante manteve 195,8% do DPS efetivo de mago. Por encontro, recebeu 46,6 contra 166,3 HP de dano; recuperou 23,5 contra 71,3 HP (14,5 contra 71,3 de poções), gastando 29,4 contra 19 mana total e 0 contra 0 HP em conjurações. Começou com 72 contra 95 HP e defesa 1 contra 1. Escudos absorveram 0 contra 3,3; invocações causaram 417,3 contra 0 de dano e receberam 99,8 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 100 para 62,5 p.p.; contraste de 37,5 p.p. e alteração de 45,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### nível 1 · pesadelo · atrito: necromante sobreviveu mais sem perder mais de 10% do DPS

**necromante × arqueiro:** 0/8 mortes contra 8/8; 0 contra 0 limites de tempo. necromante manteve 162,2% do DPS efetivo de arqueiro. Por encontro, recebeu 46,6 contra 171,4 HP de dano; recuperou 23,5 contra 76 HP (14,5 contra 76 de poções), gastando 29,4 contra 25,1 mana total e 0 contra 0 HP em conjurações. Começou com 72 contra 95 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 417,3 contra 0 de dano e receberam 99,8 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 100 para 62,5 p.p.; contraste de 37,5 p.p. e alteração de 45,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### nível 10 · pesadelo · atrito: necromante sobreviveu mais sem perder mais de 10% do DPS

**necromante × aventureiro:** 0/8 mortes contra 8/8; 0 contra 0 limites de tempo. necromante manteve 98,5% do DPS efetivo de aventureiro. Por encontro, recebeu 170,4 contra 357,8 HP de dano; recuperou 88,8 contra 159,8 HP (64 contra 144 de poções), gastando 42,3 contra 31,8 mana total e 0 contra 0 HP em conjurações. Começou com 161 contra 181 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 955,6 contra 0 de dano e receberam 274,4 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 100 para 12,5 p.p.; contraste de 87,5 p.p. e alteração de 56 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### nível 10 · pesadelo · atrito: necromante sobreviveu mais sem perder mais de 10% do DPS

**necromante × mago:** 0/8 mortes contra 8/8; 0 contra 0 limites de tempo. necromante manteve 99,4% do DPS efetivo de mago. Por encontro, recebeu 170,4 contra 332,5 HP de dano; recuperou 88,8 contra 148 HP (64 contra 148 de poções), gastando 42,3 contra 26,9 mana total e 0 contra 0 HP em conjurações. Começou com 161 contra 184 HP e defesa 1 contra 1. Escudos absorveram 0 contra 33; invocações causaram 955,6 contra 0 de dano e receberam 274,4 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 100 para 12,5 p.p.; contraste de 87,5 p.p. e alteração de 56 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### nível 10 · pesadelo · atrito: necromante sobreviveu mais sem perder mais de 10% do DPS

**necromante × arqueiro:** 0/8 mortes contra 8/8; 0 contra 0 limites de tempo. necromante manteve 106,1% do DPS efetivo de arqueiro. Por encontro, recebeu 170,4 contra 281 HP de dano; recuperou 88,8 contra 105 HP (64 contra 105 de poções), gastando 42,3 contra 22,3 mana total e 0 contra 0 HP em conjurações. Começou com 161 contra 176 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 955,6 contra 0 de dano e receberam 274,4 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 100 para 12,5 p.p.; contraste de 87,5 p.p. e alteração de 56 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### nível 30 · normal · pressao: aventureiro sobreviveu mais sem perder mais de 10% do DPS

**aventureiro × necromante:** 0/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 233% do DPS efetivo de necromante. Por encontro, recebeu 310,1 contra 535 HP de dano; recuperou 170,9 contra 238 HP (113,8 contra 238 de poções), gastando 42,5 contra 6 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 297 HP e defesa 2 contra 1. Escudos absorveram 0 contra 26; invocações causaram 0 contra 420,6 de dano e receberam 0 contra 142,1. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 100 para 0 p.p.; contraste de 100 p.p. e alteração de 57,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

## nível 1 · normal · duelo

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 6,3 s | — | 1 | 120 | 22 | 0 | 12,3 | 0 |
| guerreiro | 8 s | — | 1 | 120 | 36,9 | 26,1 | 9,3 | 4,9 |
| mago | 11,3 s | — | 1 | 120 | 38,1 | 9,5 | 10 | 0 |
| arqueiro | 7,4 s | — | 1 | 120 | 8 | 0 | 10 | 0 |
| necromante | 8 s | — | 1 | 120 | 5,8 | 0 | 6,8 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 0 / 0 / 0 / 0 | 120 / 0 / 0 | 0 | 0 | 4,7 / 2 / 0 / 0 / 0,4 | 2 |
| guerreiro | 0 / 26,1 / 0 / 0 | 120 / 0 / 0 | 0 | 0 | 4,2 / 0,7 / 0 / 0 / 0 | 0,2 |
| mago | 0 / 0 / 9,5 / 0 | 112,1 / 7,9 / 0 | 0 | 0 | 6,2 / 1,2 / 0 / 0 / 0 | 2,2 |
| arqueiro | 0 / 0 / 0 / 0 | 113,5 / 6,5 / 0 | 0 | 0 | 4,1 / 1 / 0 / 0 / 3,2 | 2,5 |
| necromante | 0 / 0 / 0 / 0 | 47,5 / 0 / 72,5 | 0 | 0 | 2,8 / 1 / 0 / 0 / 0 | 2,7 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 8,1 / 1 | 7,1 / 1,3 / 2,6 | 0 / 0 | — | 0,1 / 3,3 |
| guerreiro | 9,3 / 0 | 5,9 / 0,8 / 2,3 | 0 / 0 | — | 0 / 3,8 |
| mago | 9,6 / 1 | 7,8 / 2,1 / 2,3 | 0,1 / 0 | — | 0 / 4,8 |
| arqueiro | 7 / 0 | 6 / 0,8 / 2,5 | 0 / 0 | — | 0 / 3 |
| necromante | 6,6 / 0,1 | 10,3 / 2,1 / 3,3 | 0,8 / 0 | — | 0 / 3,4 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 3,1 | 42,5 | 0 | 6,3 | 0 | — |
| aventureiro | explosao | 1 | 26,1 | 0 | 3 | 0 | — |
| aventureiro | golpe_atordoante | 1 | 17,9 | 0 | 3 | 0 | — |
| aventureiro | ataque_basico | 3 | 33,5 | 0 | 0 | 0 | — |
| guerreiro | investida | 1,6 | 20,3 | 0 | 4,9 | 0 | — |
| guerreiro | redemoinho | 1,6 | 0 | 0 | 0 | 4,9 | — |
| guerreiro | grito_de_guerra | 1 | 0 | 0 | 4 | 0 | — |
| guerreiro | ataque_basico | 4,9 | 99,8 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 26,1 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 0,1 | 0 | 0 | 0,4 | 0 | — |
| mago | bola_de_fogo | 1 | 23 | 0 | 3 | 0 | — |
| mago | dardo_arcano | 6,6 | 63 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 1 | 4,5 | 0 | 3 | 0 | — |
| mago | raio_em_cadeia | 1 | 21,6 | 0 | 4 | 0 | — |
| mago | efeito:queimando | 0 | 7,9 | 0 | 0 | 0 | — |
| mago | item:pocao_vida | 0,3 | 0 | 9,5 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 1 | 0 | 0 | 3 | 0 | — |
| arqueiro | chuva_de_flechas | 1 | 18,6 | 0 | 4 | 0 | — |
| arqueiro | flecha_venenosa | 1 | 17,1 | 0 | 3 | 0 | — |
| arqueiro | tiro | 4 | 77,8 | 0 | 0 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 6,5 | 0 | 0 | 0 | — |
| necromante | dardo_funesto | 1,9 | 13,4 | 0 | 3,8 | 0 | — |
| necromante | garras_do_ossuario | 1 | 9,4 | 0 | 3 | 0 | — |
| necromante | toque_funesto | 3,8 | 24,8 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 72,5 | 0 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 114% do DPS efetivo de guerreiro. Por encontro, recebeu 22 contra 36,9 HP de dano; recuperou 0 contra 26,1 HP (0 contra 0 de poções), gastando 12,3 contra 9,3 mana total e 0 contra 4,9 HP em conjurações. Começou com 100 contra 93 HP e defesa 2 contra 3. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 0 p.p. e de HP final -5,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 22,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 156,5% do DPS efetivo de mago. Por encontro, recebeu 22 contra 38,1 HP de dano; recuperou 0 contra 9,5 HP (0 contra 9,5 de poções), gastando 12,3 contra 10 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 95 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 8,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 19,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 108,3% do DPS efetivo de arqueiro. Por encontro, recebeu 22 contra 8 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 12,3 contra 10 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 95 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final -13,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 5,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 102,5% do DPS efetivo de necromante. Por encontro, recebeu 22 contra 5,8 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 12,3 contra 6,8 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 72 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 72,5 de dano e receberam 0 contra 7,6. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -13,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 12,5 p.p.; contraste de -12,5 p.p. e alteração de -0,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 137,4% do DPS efetivo de mago. Por encontro, recebeu 36,9 contra 38,1 HP de dano; recuperou 26,1 contra 9,5 HP (0 contra 9,5 de poções), gastando 9,3 contra 10 mana total e 4,9 contra 0 HP em conjurações. Começou com 93 contra 95 HP e defesa 3 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 13,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -10 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 95% do DPS efetivo de arqueiro. Por encontro, recebeu 36,9 contra 8 HP de dano; recuperou 26,1 contra 0 HP (0 contra 0 de poções), gastando 9,3 contra 10 mana total e 4,9 contra 0 HP em conjurações. Começou com 93 contra 95 HP e defesa 3 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final -8,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -16,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 89,9% do DPS efetivo de necromante. Por encontro, recebeu 36,9 contra 5,8 HP de dano; recuperou 26,1 contra 0 HP (0 contra 0 de poções), gastando 9,3 contra 6,8 mana total e 4,9 contra 0 HP em conjurações. Começou com 93 contra 72 HP e defesa 3 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 72,5 de dano e receberam 0 contra 7,6. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -8,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 12,5 p.p.; contraste de -12,5 p.p. e alteração de -22,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 69,2% do DPS efetivo de arqueiro. Por encontro, recebeu 38,1 contra 8 HP de dano; recuperou 9,5 contra 0 HP (9,5 contra 0 de poções), gastando 10 contra 10 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 95 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final -21,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -13,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 65,5% do DPS efetivo de necromante. Por encontro, recebeu 38,1 contra 5,8 HP de dano; recuperou 9,5 contra 0 HP (9,5 contra 0 de poções), gastando 10 contra 6,8 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 72 HP e defesa 1 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 72,5 de dano e receberam 0 contra 7,6. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -22,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 12,5 p.p.; contraste de -12,5 p.p. e alteração de -19,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**arqueiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. arqueiro manteve 94,7% do DPS efetivo de necromante. Por encontro, recebeu 8 contra 5,8 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 10 contra 6,8 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 72 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 72,5 de dano e receberam 0 contra 7,6. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -0,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 12,5 p.p.; contraste de -12,5 p.p. e alteração de -6 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### O que mudou ao retirar cada fator

**necromante, Sem habilidades da barra:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 21,2 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 17,6 (100% do completo) | 0 / 0 |
| aventureiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | 20,9 | 11,8 (67% do completo) | 0 / 0 |
| aventureiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 2,8 | 17,6 (100% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 8/8; 0; 0 | 0 | 4,7 | 15,2 (98,4% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 15,5 (100% do completo) | 0 / 0 |
| guerreiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | -1,2 | 12 (77,7% do completo) | 0 / 0 |
| guerreiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 3,2 | 15,2 (98,4% do completo) | 0 / 0 |
| mago | Sem poções de vida | 8/8; 0; 0 | 0 | 10 | 11,3 (100% do completo) | 0 / 0 |
| mago | Sem habilidades da barra | 8/8; 0; 0 | 0 | 1,4 | 10,8 (96,3% do completo) | 0 / 0 |
| mago | Defesa plana zerada | 8/8; 0; 0 | 0 | 2,2 | 11,3 (100% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 16,3 (100% do completo) | 0 / 0 |
| arqueiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | 15,1 | 13,3 (81,4% do completo) | 0 / 0 |
| arqueiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 1,3 | 16,3 (100% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 17,2 (100% do completo) | 0 / 0 |
| necromante | Sem habilidades da barra | 7/8; 1; 0 | 12,5 | 21,2 | 12,6 (73,1% do completo) | 1 / 0 |
| necromante | Defesa plana zerada | 8/8; 0; 0 | 0 | 0,7 | 17,2 (100% do completo) | 0 / 0 |

## nível 1 · normal · pressao

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 20 s | — | 1 | 318 | 83,3 | 35,8 | 20 | 0 |
| guerreiro | 21,4 s | — | 1 | 318 | 106,5 | 103,4 | 20 | 9,8 |
| mago | 17,3 s | — | 1 | 318 | 94,8 | 52,3 | 17,6 | 0 |
| arqueiro | 20,9 s | 22 s | 0,9 | 314 | 126,1 | 66,5 | 19,6 | 0 |
| necromante | 16,9 s | — | 1 | 318 | 62,1 | 36,4 | 17,5 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 0,8 / 0 / 35 / 0 | 318 / 0 / 0 | 0 | 0 | 10,4 / 9,7 / 0 / 0 / 6,5 | 1,9 |
| guerreiro | 0 / 80,3 / 23,1 / 0 | 312,5 / 5,5 / 0 | 5,3 | 0 | 10 / 7,7 / 0 / 0 / 0,5 | 1,3 |
| mago | 0 / 0 / 52,3 / 0 | 301,8 / 16,3 / 0 | 0 | 0 | 10,7 / 1,2 / 0 / 0,6 / 0,9 | 2,7 |
| arqueiro | 0 / 0 / 66,5 / 0 | 314 / 0 / 0 | 0 | 0 | 10,4 / 1 / 0 / 0,7 / 7,7 | 2,6 |
| necromante | 0 / 11 / 25,4 / 0 | 116,1 / 0 / 201,9 | 0 | 11 | 6,5 / 2,3 / 0 / 0 / 0,6 | 3,1 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 19,3 / 2,1 | 16 / 1,6 / 6,9 | 0 / 0 | — | 3,1 / 11,1 |
| guerreiro | 22 / 1,3 | 14,3 / 1,6 / 6,5 | 0,5 / 0 | — | 5,5 / 13,1 |
| mago | 16 / 1,3 | 16,6 / 2,4 / 6,3 | 1 / 0 | — | 0 / 8,4 |
| arqueiro | 19,3 / 0 | 17,6 / 2,8 / 8 | 0 / 0 | — | 0 / 10,3 |
| necromante | 15,8 / 0,6 | 23,5 / 3,5 / 9,4 | 1,5 / 0 | sem_invocacao: 24,3 | 0,8 / 7,9 |

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
| guerreiro | investida | 3,5 | 55,8 | 0 | 10,5 | 0 | — |
| guerreiro | redemoinho | 3,3 | 10,5 | 0 | 0 | 9,8 | — |
| guerreiro | grito_de_guerra | 2 | 0 | 0 | 8 | 0 | — |
| guerreiro | ataque_basico | 12,8 | 246,3 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 80,3 | 0 | 0 | — |
| guerreiro | efeito:dano_direto | 0 | 5,5 | 0 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 0,5 | 0 | 0 | 1,5 | 0 | — |
| guerreiro | item:pocao_vida | 0,6 | 0 | 23,1 | 0 | 0 | — |
| mago | bola_de_fogo | 2,5 | 67,5 | 0 | 7,5 | 0 | — |
| mago | dardo_arcano | 10,5 | 134,4 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 1,9 | 39,1 | 0 | 5,6 | 0 | — |
| mago | raio_em_cadeia | 1,1 | 60,8 | 0 | 4,5 | 0 | — |
| mago | efeito:queimando | 0 | 16,3 | 0 | 0 | 0 | — |
| mago | item:pocao_vida | 1,4 | 0 | 52,3 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 3,1 | 40,8 | 0 | 9,4 | 0 | — |
| arqueiro | chuva_de_flechas | 1,3 | 21,4 | 0 | 5 | 0 | — |
| arqueiro | flecha_venenosa | 1,8 | 3,1 | 0 | 5,3 | 0 | — |
| arqueiro | tiro | 13,1 | 248,8 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 1,8 | 0 | 66,5 | 0 | 0 | — |
| necromante | dardo_funesto | 4,3 | 38,5 | 0 | 8,5 | 0 | — |
| necromante | garras_do_ossuario | 2,4 | 22,9 | 0 | 7,1 | 0 | — |
| necromante | toque_funesto | 8,5 | 54,8 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 201,9 | 0 | 0 | 0 | — |
| necromante | dizimo_vital | 0,6 | 0 | 0 | 1,9 | 0 | — |
| necromante | efeito:cura | 0 | 0 | 11 | 0 | 0 | — |
| necromante | item:pocao_vida | 0,9 | 0 | 25,4 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 114,4% do DPS efetivo de guerreiro. Por encontro, recebeu 83,3 contra 106,5 HP de dano; recuperou 35,8 contra 103,4 HP (35 contra 23,1 de poções), gastando 20 contra 20 mana total e 0 contra 9,8 HP em conjurações. Começou com 100 contra 93 HP e defesa 2 contra 3. Escudos absorveram 0 contra 5,3; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 0 p.p. e de HP final -36,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -37,5 p.p.; contraste de 37,5 p.p. e alteração de 28,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 89,2% do DPS efetivo de mago. Por encontro, recebeu 83,3 contra 94,8 HP de dano; recuperou 35,8 contra 52,3 HP (35 contra 52,3 de poções), gastando 20 contra 17,6 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 95 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 0,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 62,5 p.p.; contraste de -62,5 p.p. e alteração de -32,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × arqueiro:** 0/8 mortes contra 1/8; 0 contra 0 limites de tempo. aventureiro manteve 114,2% do DPS efetivo de arqueiro. Por encontro, recebeu 83,3 contra 126,1 HP de dano; recuperou 35,8 contra 66,5 HP (35 contra 66,5 de poções), gastando 20 contra 19,6 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 95 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 12,5 p.p. e de HP final 18,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para 37,5 p.p.; contraste de -25 p.p. e alteração de -1,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 83,6% do DPS efetivo de necromante. Por encontro, recebeu 83,3 contra 62,1 HP de dano; recuperou 35,8 contra 36,4 HP (35 contra 25,4 de poções), gastando 20 contra 17,5 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 72 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 201,9 de dano e receberam 0 contra 31,9. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -9,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 12,5 p.p.; contraste de -12,5 p.p. e alteração de -19,6 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 77,9% do DPS efetivo de mago. Por encontro, recebeu 106,5 contra 94,8 HP de dano; recuperou 103,4 contra 52,3 HP (23,1 contra 52,3 de poções), gastando 20 contra 17,6 mana total e 9,8 contra 0 HP em conjurações. Começou com 93 contra 95 HP e defesa 3 contra 1. Escudos absorveram 5,3 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 36,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 62,5 p.p.; contraste de -62,5 p.p. e alteração de -46,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 0/8 mortes contra 1/8; 0 contra 0 limites de tempo. guerreiro manteve 99,8% do DPS efetivo de arqueiro. Por encontro, recebeu 106,5 contra 126,1 HP de dano; recuperou 103,4 contra 66,5 HP (23,1 contra 66,5 de poções), gastando 20 contra 19,6 mana total e 9,8 contra 0 HP em conjurações. Começou com 93 contra 95 HP e defesa 3 contra 2. Escudos absorveram 5,3 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 12,5 p.p. e de HP final 54,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para 75 p.p.; contraste de -62,5 p.p. e alteração de -29,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: guerreiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 73,1% do DPS efetivo de necromante. Por encontro, recebeu 106,5 contra 62,1 HP de dano; recuperou 103,4 contra 36,4 HP (23,1 contra 25,4 de poções), gastando 20 contra 17,5 mana total e 9,8 contra 0 HP em conjurações. Começou com 93 contra 72 HP e defesa 3 contra 1. Escudos absorveram 5,3 contra 0; invocações causaram 0 contra 201,9 de dano e receberam 0 contra 31,9. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final 26,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 25 p.p.; contraste de -25 p.p. e alteração de -28,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × arqueiro:** 0/8 mortes contra 1/8; 0 contra 0 limites de tempo. mago manteve 128,1% do DPS efetivo de arqueiro. Por encontro, recebeu 94,8 contra 126,1 HP de dano; recuperou 52,3 contra 66,5 HP (52,3 contra 66,5 de poções), gastando 17,6 contra 19,6 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 95 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 12,5 p.p. e de HP final 18 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para -37,5 p.p.; contraste de 50 p.p. e alteração de 27,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: mago venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 93,8% do DPS efetivo de necromante. Por encontro, recebeu 94,8 contra 62,1 HP de dano; recuperou 52,3 contra 36,4 HP (52,3 contra 25,4 de poções), gastando 17,6 contra 17,5 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 72 HP e defesa 1 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 201,9 de dano e receberam 0 contra 31,9. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -10 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -50 p.p.; contraste de 50 p.p. e alteração de 12,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**arqueiro × necromante:** 1/8 mortes contra 0/8; 0 contra 0 limites de tempo. arqueiro manteve 73,2% do DPS efetivo de necromante. Por encontro, recebeu 126,1 contra 62,1 HP de dano; recuperou 66,5 contra 36,4 HP (66,5 contra 25,4 de poções), gastando 19,6 contra 17,5 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 72 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 201,9 de dano e receberam 0 contra 31,9. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 1 só necromante venceu; diferença de vitória -12,5 p.p. e de HP final -28 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para -50 p.p.; contraste de 37,5 p.p. e alteração de 1,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

### O que mudou ao retirar cada fator

**aventureiro, Sem poções de vida:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 32,6 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem poções de vida:** retirar esse fator perdeu 5 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 39,3 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem habilidades da barra:** retirar esse fator perdeu 5 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 41,7 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem poções de vida:** retirar esse fator perdeu 5 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 33,8 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem habilidades da barra:** retirar esse fator perdeu 2 vitórias e ganhou 1 nas mesmas 8 condições iniciais. O kit completo teve 14,2 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem poções de vida:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 32,6 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem habilidades da barra:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 28,8 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 5/8; 3; 0 | 37,5 | 32,6 | 16,7 (99,4% do completo) | 3 / 0 |
| aventureiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | 9,3 | 12,2 (72,5% do completo) | 0 / 0 |
| aventureiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 0,1 | 16,2 (96,4% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 8/8; 0; 0 | 0 | 6,7 | 14 (95% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 8/8; 0; 0 | 0 | 4,4 | 14,7 (100% do completo) | 0 / 0 |
| guerreiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | -4,6 | 12,2 (82,7% do completo) | 0 / 0 |
| guerreiro | Defesa plana zerada | 8/8; 0; 0 | 0 | -1,5 | 15,3 (103,9% do completo) | 0 / 0 |
| mago | Sem poções de vida | 3/8; 5; 0 | 62,5 | 39,3 | 19,1 (101,1% do completo) | 5 / 0 |
| mago | Sem habilidades da barra | 3/8; 5; 0 | 62,5 | 41,7 | 11,2 (59,5% do completo) | 5 / 0 |
| mago | Defesa plana zerada | 8/8; 0; 0 | 0 | 6,3 | 18,9 (100% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 2/8; 6; 0 | 62,5 | 33,8 | 13,9 (94,5% do completo) | 5 / 0 |
| arqueiro | Sem habilidades da barra | 6/8; 2; 0 | 12,5 | 14,2 | 13,1 (89,2% do completo) | 2 / 1 |
| arqueiro | Defesa plana zerada | 7/8; 1; 0 | 0 | 8,9 | 14,7 (100% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 6/8; 2; 0 | 25 | 32,6 | 18,9 (93,8% do completo) | 2 / 0 |
| necromante | Sem habilidades da barra | 7/8; 1; 0 | 12,5 | 28,8 | 14,3 (71% do completo) | 1 / 0 |
| necromante | Defesa plana zerada | 8/8; 0; 0 | 0 | -3,8 | 18,5 (92% do completo) | 0 / 0 |

## nível 1 · normal · atrito

### Onde o desgaste aparece

| Classe | Onda | Chegaram/n inicial | Mortes / limites nesta onda | HP entrada → saída | Mana entrada → saída | Recebido / cura / mana gasta |
|---|---|---|---|---|---|---|
| aventureiro | 1 | 8/8 | 0 / 0 | 100 → 87 | 10 → 1,2 | 13 / 0 / 11,5 |
| aventureiro | 2 | 8/8 | 0 / 0 | 87 → 59 | 1,2 → 0,4 | 30,8 / 1,1 / 6,8 |
| aventureiro | 3 | 8/8 | 0 / 0 | 59 → 59,9 | 0,4 → 0,7 | 19,9 / 17 / 5,6 |
| aventureiro | 4 | 8/8 | 0 / 0 | 59,9 → 50,8 | 0,7 → 0,9 | 31,3 / 20 / 4,6 |
| aventureiro | 5 | 8/8 | 0 / 0 | 50,8 → 50,5 | 0,9 → 1 | 26 / 25 / 3,3 |
| guerreiro | 1 | 8/8 | 0 / 0 | 93 → 81,3 | 10 → 5,1 | 28,6 / 19,9 / 7 |
| guerreiro | 2 | 8/8 | 0 / 0 | 81,3 → 77,4 | 5,1 → 3,2 | 30,5 / 28,9 / 9,3 |
| guerreiro | 3 | 8/8 | 0 / 0 | 77,4 → 81 | 3,2 → 3,4 | 20 / 24,1 / 6,5 |
| guerreiro | 4 | 8/8 | 0 / 0 | 81 → 79,9 | 3,4 → 3,2 | 23,5 / 23,8 / 4,1 |
| guerreiro | 5 | 8/8 | 0 / 0 | 79,9 → 81,5 | 3,2 → 2,8 | 28,1 / 30,1 / 4,4 |
| mago | 1 | 8/8 | 0 / 0 | 95 → 77,3 | 12 → 5,4 | 22,5 / 4,8 / 10 |
| mago | 2 | 8/8 | 0 / 0 | 77,3 → 52,5 | 5,4 → 6,4 | 39 / 14,3 / 3,8 |
| mago | 3 | 8/8 | 0 / 0 | 52,5 → 50,9 | 6,4 → 2,4 | 30,1 / 28,5 / 7,9 |
| mago | 4 | 8/8 | 0 / 0 | 50,9 → 44,4 | 2,4 → 4,3 | 30,9 / 23,8 / 3 |
| mago | 5 | 8/8 | 4 / 0 | 44,4 → 12,3 | 4,3 → 5,4 | 36,9 / 4,8 / 1,9 |
| arqueiro | 1 | 8/8 | 0 / 0 | 95 → 89,6 | 10 → 1,9 | 5,4 / 0 / 10 |
| arqueiro | 2 | 8/8 | 0 / 0 | 89,6 → 60 | 1,9 → 3,8 | 34,4 / 4,8 / 3 |
| arqueiro | 3 | 8/8 | 0 / 0 | 60 → 57,9 | 3,8 → 0,8 | 25,9 / 23,8 / 6,4 |
| arqueiro | 4 | 8/8 | 0 / 0 | 57,9 → 49 | 0,8 → 3,2 | 23,9 / 14,3 / 2,3 |
| arqueiro | 5 | 8/8 | 0 / 0 | 49 → 47 | 3,2 → 3,3 | 21 / 19 / 2,3 |
| necromante | 1 | 8/8 | 0 / 0 | 72 → 67,4 | 12 → 8,6 | 4,6 / 0 / 6,3 |
| necromante | 2 | 8/8 | 0 / 0 | 67,4 → 67,4 | 8,6 → 5,2 | 0 / 0 / 5,9 |
| necromante | 3 | 8/8 | 0 / 0 | 67,4 → 65,4 | 5,2 → 4,1 | 2,1 / 0 / 3,5 |
| necromante | 4 | 8/8 | 0 / 0 | 65,4 → 66,1 | 4,1 → 3,9 | 0 / 0 / 2,8 |
| necromante | 5 | 8/8 | 0 / 0 | 66,1 → 66,5 | 3,9 → 3,3 | 0 / 0 / 2,1 |

Médias de cada onda incluem apenas quem chegou a ela; o denominador inicial mostra a seleção dos sobreviventes. Não compare a vida da onda 5 como se incluísse quem morreu antes.

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 37,3 s | — | 5 | 534 | 120,9 | 63,1 | 31,8 | 0 |
| guerreiro | 37 s | — | 5 | 534 | 130,8 | 126,8 | 31,3 | 18,4 |
| mago | 39,1 s | 36,7 s | 4,5 | 516,1 | 159,4 | 76 | 26,5 | 0 |
| arqueiro | 35,9 s | — | 5 | 534 | 110,5 | 61,8 | 23,9 | 0 |
| necromante | 18,3 s | — | 5 | 534 | 6,8 | 0 | 20,5 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 3,1 / 0 / 60 / 0 | 534 / 0 / 0 | 0 | 0 | 18 / 12,4 / 0 / 0,4 / 14,3 | 1,4 |
| guerreiro | 0 / 112,9 / 13,9 / 0 | 530,6 / 3,4 / 0 | 10,4 | 0 | 17,1 / 11,5 / 0 / 0 / 0,8 | 1 |
| mago | 0 / 0 / 76 / 0 | 486,5 / 29,6 / 0 | 4,9 | 0 | 21,6 / 3,8 / 0 / 3,5 / 7,8 | 2,4 |
| arqueiro | 0 / 0 / 61,8 / 0 | 529,4 / 4,6 / 0 | 0 | 0 | 16 / 3,5 / 0 / 0,7 / 17 | 2,5 |
| necromante | 0 / 0 / 0 / 0 | 115,3 / 0 / 418,8 | 0 | 0 | 7,9 / 3,5 / 0 / 0 / 0 | 3 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 33,6 / 4,1 | 27,5 / 4,1 / 10,8 | 0 / 0 | — | 8,3 / 22,8 |
| guerreiro | 39,1 / 5,6 | 22,9 / 3,5 / 10,1 | 0,1 / 0 | — | 10,9 / 24 |
| mago | 32,8 / 2,4 | 28 / 5,1 / 10,6 | 0,1 / 0 | — | 0,6 / 19,9 |
| arqueiro | 29,8 / 0,6 | 27,3 / 3,3 / 10,8 | 0 / 0 | — | 0,8 / 17,2 |
| necromante | 19,5 / 1,6 | 35,3 / 6,3 / 13,1 | 1,3 / 0 | — | 1,3 / 11,8 |

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
| guerreiro | investida | 5,8 | 82,5 | 0 | 17,3 | 0 | — |
| guerreiro | redemoinho | 6,1 | 71,6 | 0 | 0 | 18,4 | — |
| guerreiro | grito_de_guerra | 2,8 | 0 | 0 | 11 | 0 | — |
| guerreiro | ataque_basico | 23,5 | 376,5 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 112,9 | 0 | 0 | — |
| guerreiro | efeito:dano_direto | 0 | 3,4 | 0 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 1 | 0 | 0 | 3 | 0 | — |
| guerreiro | item:pocao_vida | 0,4 | 0 | 13,9 | 0 | 0 | — |
| mago | bola_de_fogo | 4,5 | 121,8 | 0 | 13,5 | 0 | — |
| mago | dardo_arcano | 24,3 | 322 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 2,6 | 18,9 | 0 | 7,9 | 0 | — |
| mago | raio_em_cadeia | 1 | 23,9 | 0 | 4 | 0 | — |
| mago | efeito:queimando | 0 | 29,6 | 0 | 0 | 0 | — |
| mago | item:pocao_vida | 2 | 0 | 76 | 0 | 0 | — |
| mago | barreira | 0,4 | 0 | 0 | 1,1 | 0 | — |
| arqueiro | flecha_perfurante | 4,8 | 81,1 | 0 | 14,3 | 0 | — |
| arqueiro | chuva_de_flechas | 1 | 20,4 | 0 | 4 | 0 | — |
| arqueiro | flecha_venenosa | 1,9 | 22,5 | 0 | 5,6 | 0 | — |
| arqueiro | tiro | 22,1 | 405,4 | 0 | 0 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 4,6 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 1,6 | 0 | 61,8 | 0 | 0 | — |
| necromante | dardo_funesto | 5,8 | 30,9 | 0 | 11,5 | 0 | — |
| necromante | garras_do_ossuario | 3 | 24,8 | 0 | 9 | 0 | — |
| necromante | toque_funesto | 10,8 | 59,6 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 418,8 | 0 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 106,5% do DPS efetivo de guerreiro. Por encontro, recebeu 120,9 contra 130,8 HP de dano; recuperou 63,1 contra 126,8 HP (60 contra 13,9 de poções), gastando 31,8 contra 31,3 mana total e 0 contra 18,4 HP em conjurações. Começou com 100 contra 93 HP e defesa 2 contra 3. Escudos absorveram 0 contra 10,4; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 0 p.p. e de HP final -37,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -75 p.p.; contraste de 75 p.p. e alteração de 58,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × mago:** 0/8 mortes contra 4/8; 0 contra 0 limites de tempo. aventureiro manteve 112,5% do DPS efetivo de mago. Por encontro, recebeu 120,9 contra 159,4 HP de dano; recuperou 63,1 contra 76 HP (60 contra 76 de poções), gastando 31,8 contra 26,5 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 95 HP e defesa 2 contra 1. Escudos absorveram 0 contra 4,9; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 4 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 50 p.p. e de HP final 37,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 50 para -25 p.p.; contraste de 75 p.p. e alteração de 43,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 98% do DPS efetivo de arqueiro. Por encontro, recebeu 120,9 contra 110,5 HP de dano; recuperou 63,1 contra 61,8 HP (60 contra 61,8 de poções), gastando 31,8 contra 23,9 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 95 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -62,5 p.p.; contraste de 62,5 p.p. e alteração de 22,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 55,3% do DPS efetivo de necromante. Por encontro, recebeu 120,9 contra 6,8 HP de dano; recuperou 63,1 contra 0 HP (60 contra 0 de poções), gastando 31,8 contra 20,5 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 72 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 418,8 de dano e receberam 0 contra 47,8. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -41,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -75 p.p.; contraste de 75 p.p. e alteração de 48,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × mago:** 0/8 mortes contra 4/8; 0 contra 0 limites de tempo. guerreiro manteve 105,6% do DPS efetivo de mago. Por encontro, recebeu 130,8 contra 159,4 HP de dano; recuperou 126,8 contra 76 HP (13,9 contra 76 de poções), gastando 31,3 contra 26,5 mana total e 18,4 contra 0 HP em conjurações. Começou com 93 contra 95 HP e defesa 3 contra 1. Escudos absorveram 10,4 contra 4,9; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 4 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 50 p.p. e de HP final 74,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 50 para 100 p.p.; contraste de -50 p.p. e alteração de -9,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: guerreiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 92,1% do DPS efetivo de arqueiro. Por encontro, recebeu 130,8 contra 110,5 HP de dano; recuperou 126,8 contra 61,8 HP (13,9 contra 61,8 de poções), gastando 31,3 contra 23,9 mana total e 18,4 contra 0 HP em conjurações. Começou com 93 contra 95 HP e defesa 3 contra 2. Escudos absorveram 10,4 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 38,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 75 p.p.; contraste de -75 p.p. e alteração de -35,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 51,9% do DPS efetivo de necromante. Por encontro, recebeu 130,8 contra 6,8 HP de dano; recuperou 126,8 contra 0 HP (13,9 contra 0 de poções), gastando 31,3 contra 20,5 mana total e 18,4 contra 0 HP em conjurações. Começou com 93 contra 72 HP e defesa 3 contra 1. Escudos absorveram 10,4 contra 0; invocações causaram 0 contra 418,8 de dano e receberam 0 contra 47,8. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -4,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -10,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × arqueiro:** 4/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 87,2% do DPS efetivo de arqueiro. Por encontro, recebeu 159,4 contra 110,5 HP de dano; recuperou 76 contra 61,8 HP (76 contra 61,8 de poções), gastando 26,5 contra 23,9 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 95 HP e defesa 1 contra 2. Escudos absorveram 4,9 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 4 só arqueiro venceu; diferença de vitória -50 p.p. e de HP final -36,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -50 para -25 p.p.; contraste de -25 p.p. e alteração de -25,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: arqueiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × necromante:** 4/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 49,1% do DPS efetivo de necromante. Por encontro, recebeu 159,4 contra 6,8 HP de dano; recuperou 76 contra 0 HP (76 contra 0 de poções), gastando 26,5 contra 20,5 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 72 HP e defesa 1 contra 1. Escudos absorveram 4,9 contra 0; invocações causaram 0 contra 418,8 de dano e receberam 0 contra 47,8. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 4 só necromante venceu; diferença de vitória -50 p.p. e de HP final -79,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -50 para -100 p.p.; contraste de 50 p.p. e alteração de 12,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**arqueiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. arqueiro manteve 56,4% do DPS efetivo de necromante. Por encontro, recebeu 110,5 contra 6,8 HP de dano; recuperou 61,8 contra 0 HP (61,8 contra 0 de poções), gastando 23,9 contra 20,5 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 72 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 418,8 de dano e receberam 0 contra 47,8. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -42,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -75 p.p.; contraste de 75 p.p. e alteração de 38,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### O que mudou ao retirar cada fator

**aventureiro, Sem poções de vida:** retirar esse fator perdeu 5 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 42,5 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**aventureiro, Sem habilidades da barra:** retirar esse fator perdeu 6 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 46 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**aventureiro, Defesa plana zerada:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 11,2 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem poções de vida:** retirar esse fator perdeu 4 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 12,9 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Defesa plana zerada:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 5 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem poções de vida:** retirar esse fator perdeu 6 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 38,4 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem habilidades da barra:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 23,9 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Defesa plana zerada:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 13,3 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 3/8; 5; 0 | 62,5 | 42,5 | 14,9 (98,7% do completo) | 5 / 0 |
| aventureiro | Sem habilidades da barra | 2/8; 6; 0 | 75 | 46 | 12,2 (80,5% do completo) | 6 / 0 |
| aventureiro | Defesa plana zerada | 6/8; 2; 0 | 25 | 11,2 | 15,1 (99,9% do completo) | 2 / 0 |
| guerreiro | Sem cura do básico | 8/8; 0; 0 | 0 | -1,1 | 13,4 (94,4% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 8/8; 0; 0 | 0 | 3,2 | 14,2 (100% do completo) | 0 / 0 |
| guerreiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | -12,4 | 12,3 (86,6% do completo) | 0 / 0 |
| guerreiro | Defesa plana zerada | 8/8; 0; 0 | 0 | -2,4 | 13,3 (93,9% do completo) | 0 / 0 |
| mago | Sem poções de vida | 0/8; 8; 0 | 50 | 12,9 | 13 (96,7% do completo) | 4 / 0 |
| mago | Sem habilidades da barra | 4/8; 4; 0 | 0 | 2,5 | 11,5 (85,9% do completo) | 3 / 3 |
| mago | Defesa plana zerada | 3/8; 5; 0 | 12,5 | 5 | 13,4 (99,7% do completo) | 1 / 0 |
| arqueiro | Sem poções de vida | 2/8; 6; 0 | 75 | 38,4 | 15,3 (99,1% do completo) | 6 / 0 |
| arqueiro | Sem habilidades da barra | 7/8; 1; 0 | 12,5 | 23,9 | 13,4 (86,8% do completo) | 1 / 0 |
| arqueiro | Defesa plana zerada | 7/8; 1; 0 | 12,5 | 13,3 | 15,3 (99,1% do completo) | 1 / 0 |
| necromante | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 27,3 (100% do completo) | 0 / 0 |
| necromante | Sem habilidades da barra | 8/8; 0; 0 | 0 | -2,1 | 22,2 (81,2% do completo) | 0 / 0 |
| necromante | Defesa plana zerada | 8/8; 0; 0 | 0 | 0,5 | 27,3 (100% do completo) | 0 / 0 |

## nível 1 · normal · chefe

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 33,3 s | 29,2 s | 0,5 | 447,3 | 170,3 | 80 | 24,3 | 0 |
| guerreiro | 34,5 s | 35,1 s | 0,9 | 481,5 | 145,3 | 137,9 | 25,6 | 16,5 |
| mago | 37 s | 36,5 s | 0,3 | 435,9 | 163,3 | 76 | 19 | 0 |
| arqueiro | 34,1 s | — | 1 | 481 | 110,1 | 66,5 | 20 | 0 |
| necromante | 30,5 s | 36,7 s | 0,8 | 454,9 | 52,3 | 18,1 | 21,6 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 0 / 0 / 80 / 0 | 447,3 / 0 / 0 | 0 | 0 | 14,6 / 5,8 / 3,4 / 4,9 / 10,9 | 1 |
| guerreiro | 0 / 68,5 / 69,4 / 0 | 477,8 / 3,8 / 0 | 15,6 | 0 | 14,6 / 4,3 / 4,1 / 2,4 / 4,7 | 0,8 |
| mago | 0 / 0 / 76 / 0 | 411,9 / 24 / 0 | 0 | 0 | 18,7 / 11,9 / 2,2 / 4,5 / 5,5 | 1,8 |
| arqueiro | 0 / 0 / 66,5 / 0 | 473,5 / 7,5 / 0 | 0 | 0 | 14,1 / 11,4 / 2,3 / 0,1 / 13 | 2 |
| necromante | 0 / 0 / 18,1 / 0 | 206 / 0 / 248,9 | 0 | 0 | 11,5 / 13 / 0,3 / 0,6 / 0,5 | 2,2 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 28,1 / 4,9 | 22,6 / 3,3 / 8,8 | 0 / 0 | bloqueado: 25,9 | 0 / 15,3 |
| guerreiro | 33,6 / 4,9 | 21,8 / 3,4 / 8,5 | 0 / 0 | bloqueado: 3,4 | 0 / 16,9 |
| mago | 28,5 / 3,1 | 24,4 / 4,1 / 8,5 | 0 / 0 | — | 0 / 18,5 |
| arqueiro | 26,1 / 1 | 24,4 / 3,4 / 8,6 | 0 / 0 | — | 0 / 16,6 |
| necromante | 27,1 / 0,6 | 37,9 / 6,6 / 13,8 | 2 / 0 | — | 1,3 / 16,3 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 9,1 | 169,8 | 0 | 18,3 | 0 | — |
| aventureiro | explosao | 1 | 25,3 | 0 | 3 | 0 | — |
| aventureiro | golpe_atordoante | 1 | 8,5 | 0 | 3 | 0 | — |
| aventureiro | ataque_basico | 17 | 243,8 | 0 | 0 | 0 | — |
| aventureiro | item:pocao_vida | 2 | 0 | 80 | 0 | 0 | — |
| guerreiro | investida | 4,5 | 60,3 | 0 | 13,5 | 0 | — |
| guerreiro | redemoinho | 5,5 | 73,1 | 0 | 0 | 16,5 | — |
| guerreiro | grito_de_guerra | 2 | 0 | 0 | 8 | 0 | — |
| guerreiro | ataque_basico | 20,3 | 344,4 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 68,5 | 0 | 0 | — |
| guerreiro | efeito:dano_direto | 0 | 3,8 | 0 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 1,4 | 0 | 0 | 4,1 | 0 | — |
| guerreiro | item:pocao_vida | 1,9 | 0 | 69,4 | 0 | 0 | — |
| mago | bola_de_fogo | 3 | 41,6 | 0 | 9 | 0 | — |
| mago | dardo_arcano | 22,5 | 334,3 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 2 | 15,9 | 0 | 6 | 0 | — |
| mago | raio_em_cadeia | 1 | 20,1 | 0 | 4 | 0 | — |
| mago | efeito:queimando | 0 | 24 | 0 | 0 | 0 | — |
| mago | item:pocao_vida | 2 | 0 | 76 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 4 | 97 | 0 | 12 | 0 | — |
| arqueiro | chuva_de_flechas | 1,3 | 11,3 | 0 | 5 | 0 | — |
| arqueiro | flecha_venenosa | 1 | 16,4 | 0 | 3 | 0 | — |
| arqueiro | tiro | 19,9 | 348,9 | 0 | 0 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 7,5 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 1,8 | 0 | 66,5 | 0 | 0 | — |
| necromante | dardo_funesto | 6,5 | 55,5 | 0 | 13 | 0 | — |
| necromante | garras_do_ossuario | 2,9 | 25,1 | 0 | 8,6 | 0 | — |
| necromante | toque_funesto | 17,8 | 125,4 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 248,9 | 0 | 0 | 0 | — |
| necromante | item:pocao_vida | 0,6 | 0 | 18,1 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 4/8 mortes contra 1/8; 0 contra 0 limites de tempo. aventureiro manteve 106,1% do DPS efetivo de guerreiro. Por encontro, recebeu 170,3 contra 145,3 HP de dano; recuperou 80 contra 137,9 HP (80 contra 69,4 de poções), gastando 24,3 contra 25,6 mana total e 0 contra 16,5 HP em conjurações. Começou com 100 contra 93 HP e defesa 2 contra 3. Escudos absorveram 0 contra 15,6; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só aventureiro venceu, 4 só guerreiro venceu; diferença de vitória -37,5 p.p. e de HP final -64,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -37,5 para 0 p.p.; contraste de -37,5 p.p. e alteração de -33,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: guerreiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × mago:** 4/8 mortes contra 6/8; 0 contra 0 limites de tempo. aventureiro manteve 125,5% do DPS efetivo de mago. Por encontro, recebeu 170,3 contra 163,3 HP de dano; recuperou 80 contra 76 HP (80 contra 76 de poções), gastando 24,3 contra 19 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 95 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 2 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 25 p.p. e de HP final 1,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 25 para -50 p.p.; contraste de 75 p.p. e alteração de 20,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × arqueiro:** 4/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 104,1% do DPS efetivo de arqueiro. Por encontro, recebeu 170,3 contra 110,1 HP de dano; recuperou 80 contra 66,5 HP (80 contra 66,5 de poções), gastando 24,3 contra 20 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 95 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 4 só arqueiro venceu; diferença de vitória -50 p.p. e de HP final -44,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Defesa plana zerada**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -50 para -87,5 p.p.; contraste de 37,5 p.p. e alteração de -5,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: arqueiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × necromante:** 4/8 mortes contra 2/8; 0 contra 0 limites de tempo. aventureiro manteve 101,4% do DPS efetivo de necromante. Por encontro, recebeu 170,3 contra 52,3 HP de dano; recuperou 80 contra 18,1 HP (80 contra 18,1 de poções), gastando 24,3 contra 21,6 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 72 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 248,9 de dano e receberam 0 contra 52. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 2 só necromante venceu; diferença de vitória -25 p.p. e de HP final -44,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -25 para -75 p.p.; contraste de 50 p.p. e alteração de 4,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × mago:** 1/8 mortes contra 6/8; 0 contra 0 limites de tempo. guerreiro manteve 118,3% do DPS efetivo de mago. Por encontro, recebeu 145,3 contra 163,3 HP de dano; recuperou 137,9 contra 76 HP (69,4 contra 76 de poções), gastando 25,6 contra 19 mana total e 16,5 contra 0 HP em conjurações. Começou com 93 contra 95 HP e defesa 3 contra 1. Escudos absorveram 15,6 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 6 sementes só guerreiro venceu, 1 só mago venceu; diferença de vitória 62,5 p.p. e de HP final 66,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 62,5 para 12,5 p.p.; contraste de 50 p.p. e alteração de 58 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: guerreiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × arqueiro:** 1/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 98,1% do DPS efetivo de arqueiro. Por encontro, recebeu 145,3 contra 110,1 HP de dano; recuperou 137,9 contra 66,5 HP (69,4 contra 66,5 de poções), gastando 25,6 contra 20 mana total e 16,5 contra 0 HP em conjurações. Começou com 93 contra 95 HP e defesa 3 contra 2. Escudos absorveram 15,6 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 1 só arqueiro venceu; diferença de vitória -12,5 p.p. e de HP final 20,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para -50 p.p.; contraste de 37,5 p.p. e alteração de 33,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: arqueiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × necromante:** 1/8 mortes contra 2/8; 0 contra 0 limites de tempo. guerreiro manteve 95,6% do DPS efetivo de necromante. Por encontro, recebeu 145,3 contra 52,3 HP de dano; recuperou 137,9 contra 18,1 HP (69,4 contra 18,1 de poções), gastando 25,6 contra 21,6 mana total e 16,5 contra 0 HP em conjurações. Começou com 93 contra 72 HP e defesa 3 contra 1. Escudos absorveram 15,6 contra 0; invocações causaram 0 contra 248,9 de dano e receberam 0 contra 52. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 2 sementes só guerreiro venceu, 1 só necromante venceu; diferença de vitória 12,5 p.p. e de HP final 20 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para -62,5 p.p.; contraste de 75 p.p. e alteração de 61,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: guerreiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × arqueiro:** 6/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 82,9% do DPS efetivo de arqueiro. Por encontro, recebeu 163,3 contra 110,1 HP de dano; recuperou 76 contra 66,5 HP (76 contra 66,5 de poções), gastando 19 contra 20 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 95 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 6 só arqueiro venceu; diferença de vitória -75 p.p. e de HP final -45,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -75 para -25 p.p.; contraste de -50 p.p. e alteração de -41,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: arqueiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × necromante:** 6/8 mortes contra 2/8; 0 contra 0 limites de tempo. mago manteve 80,8% do DPS efetivo de necromante. Por encontro, recebeu 163,3 contra 52,3 HP de dano; recuperou 76 contra 18,1 HP (76 contra 18,1 de poções), gastando 19 contra 21,6 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 72 HP e defesa 1 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 248,9 de dano e receberam 0 contra 52. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 4 só necromante venceu; diferença de vitória -50 p.p. e de HP final -46,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -50 para -12,5 p.p.; contraste de -37,5 p.p. e alteração de -26,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**arqueiro × necromante:** 0/8 mortes contra 2/8; 0 contra 0 limites de tempo. arqueiro manteve 97,5% do DPS efetivo de necromante. Por encontro, recebeu 110,1 contra 52,3 HP de dano; recuperou 66,5 contra 18,1 HP (66,5 contra 18,1 de poções), gastando 20 contra 21,6 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 72 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 248,9 de dano e receberam 0 contra 52. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 2 sementes só arqueiro venceu, 0 só necromante venceu; diferença de vitória 25 p.p. e de HP final -0,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 25 para -50 p.p.; contraste de 75 p.p. e alteração de 44 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: arqueiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

### O que mudou ao retirar cada fator

**aventureiro, Sem poções de vida:** retirar esse fator perdeu 4 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 9,8 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**aventureiro, Sem habilidades da barra:** retirar esse fator perdeu 4 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 9,8 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**aventureiro, Defesa plana zerada:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 6,4 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Sem cura do básico:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 33,1 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Sem poções de vida:** retirar esse fator perdeu 6 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 66,1 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Sem habilidades da barra:** retirar esse fator perdeu 2 vitórias e ganhou 1 nas mesmas 8 condições iniciais. O kit completo teve -0,7 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Defesa plana zerada:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 25,8 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem poções de vida:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 8,2 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem poções de vida:** retirar esse fator perdeu 6 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 49,1 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem habilidades da barra:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 30,4 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem habilidades da barra:** retirar esse fator perdeu 2 vitórias e ganhou 1 nas mesmas 8 condições iniciais. O kit completo teve 15,6 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 0/8; 8; 0 | 50 | 9,8 | 15 (101,9% do completo) | 4 / 0 |
| aventureiro | Sem habilidades da barra | 0/8; 8; 0 | 50 | 9,8 | 11,9 (80,8% do completo) | 4 / 0 |
| aventureiro | Defesa plana zerada | 1/8; 7; 0 | 37,5 | 6,4 | 14,6 (98,8% do completo) | 3 / 0 |
| guerreiro | Sem cura do básico | 4/8; 4; 0 | 37,5 | 33,1 | 13,5 (97,1% do completo) | 3 / 0 |
| guerreiro | Sem poções de vida | 1/8; 7; 0 | 75 | 66,1 | 14,1 (101,5% do completo) | 6 / 0 |
| guerreiro | Sem habilidades da barra | 6/8; 2; 0 | 12,5 | -0,7 | 12,1 (87,1% do completo) | 2 / 1 |
| guerreiro | Defesa plana zerada | 5/8; 3; 0 | 25 | 25,8 | 13,9 (99,8% do completo) | 2 / 0 |
| mago | Sem poções de vida | 0/8; 8; 0 | 25 | 8,2 | 11,9 (101,3% do completo) | 2 / 0 |
| mago | Sem habilidades da barra | 4/8; 4; 0 | -25 | -11,1 | 12 (102,2% do completo) | 1 / 3 |
| mago | Defesa plana zerada | 2/8; 6; 0 | 0 | 2 | 11,7 (99,2% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 2/8; 6; 0 | 75 | 49,1 | 14,4 (101,3% do completo) | 6 / 0 |
| arqueiro | Sem habilidades da barra | 6/8; 2; 0 | 25 | 30,4 | 12,4 (87,3% do completo) | 2 / 0 |
| arqueiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 11,8 | 14,2 (100% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 6/8; 2; 0 | 0 | 5 | 14,7 (101,3% do completo) | 0 / 0 |
| necromante | Sem habilidades da barra | 5/8; 3; 0 | 12,5 | 15,6 | 12,9 (89% do completo) | 2 / 1 |
| necromante | Defesa plana zerada | 6/8; 2; 0 | 0 | 1,4 | 14,5 (100% do completo) | 0 / 0 |

## nível 1 · pesadelo · duelo

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 10,8 s | — | 1 | 120 | 53,3 | 15 | 14,3 | 0 |
| guerreiro | 15,8 s | 10 s | 0,9 | 116,4 | 87,5 | 66,6 | 16 | 9 |
| mago | 15,8 s | — | 1 | 120 | 100,6 | 47,5 | 10 | 0 |
| arqueiro | 14,9 s | — | 1 | 120 | 46,5 | 14,3 | 10 | 0 |
| necromante | 15,6 s | 15,9 s | 0,9 | 118,9 | 52,9 | 21,8 | 6,8 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 0 / 0 / 15 / 0 | 120 / 0 / 0 | 0 | 0 | 6,6 / 2,7 / 0 / 0 / 2 | 1,8 |
| guerreiro | 0 / 29,6 / 37 / 0 | 116,4 / 0 / 0 | 15,8 | 0 | 8,1 / 0,7 / 0 / 0 / 0,5 | 0,1 |
| mago | 0 / 0 / 47,5 / 0 | 114,8 / 5,3 / 0 | 0 | 0 | 8,5 / 1,2 / 0 / 0 / 0 | 2,1 |
| arqueiro | 0 / 0 / 14,3 / 0 | 116,3 / 3,8 / 0 | 0 | 0 | 6,5 / 1 / 0 / 0 / 3,9 | 2,3 |
| necromante | 0 / 0 / 21,8 / 0 | 47,3 / 0 / 71,6 | 0 | 0 | 4,9 / 1,5 / 0 / 0 / 0 | 2,3 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 11,9 / 1,1 | 10,8 / 1,3 / 4,4 | 0 / 0 | — | 0 / 5,3 |
| guerreiro | 18,3 / 1,9 | 9,4 / 1,3 / 4 | 0 / 0 | — | 0 / 7,3 |
| mago | 13,3 / 1 | 11,4 / 3 / 3,8 | 0,1 / 0 | — | 0 / 7,5 |
| arqueiro | 11,6 / 0 | 10,6 / 1,8 / 4,1 | 0 / 0 | — | 0 / 6,8 |
| necromante | 11,4 / 0,1 | 17 / 3,6 / 6,5 | 0,8 / 0 | — | 0 / 6,3 |

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
| guerreiro | ataque_basico | 10,3 | 104,3 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 29,6 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 1,1 | 0 | 0 | 3,4 | 0 | — |
| guerreiro | item:pocao_vida | 1 | 0 | 37 | 0 | 0 | — |
| mago | bola_de_fogo | 1 | 13,5 | 0 | 3 | 0 | — |
| mago | dardo_arcano | 10,3 | 85,9 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 1 | 2,6 | 0 | 3 | 0 | — |
| mago | raio_em_cadeia | 1 | 12,8 | 0 | 4 | 0 | — |
| mago | efeito:queimando | 0 | 5,3 | 0 | 0 | 0 | — |
| mago | item:pocao_vida | 1,3 | 0 | 47,5 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 1 | 0 | 0 | 3 | 0 | — |
| arqueiro | chuva_de_flechas | 1 | 10,9 | 0 | 4 | 0 | — |
| arqueiro | flecha_venenosa | 1 | 10,1 | 0 | 3 | 0 | — |
| arqueiro | tiro | 8,6 | 95,3 | 0 | 0 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 3,8 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 0,4 | 0 | 14,3 | 0 | 0 | — |
| necromante | dardo_funesto | 1,9 | 7,9 | 0 | 3,8 | 0 | — |
| necromante | garras_do_ossuario | 1 | 5,5 | 0 | 3 | 0 | — |
| necromante | toque_funesto | 8,5 | 33,9 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 71,6 | 0 | 0 | 0 | — |
| necromante | item:pocao_vida | 0,8 | 0 | 21,8 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 0/8 mortes contra 1/8; 0 contra 0 limites de tempo. aventureiro manteve 154,2% do DPS efetivo de guerreiro. Por encontro, recebeu 53,3 contra 87,5 HP de dano; recuperou 15 contra 66,6 HP (15 contra 37 de poções), gastando 14,3 contra 16 mana total e 0 contra 9 HP em conjurações. Começou com 100 contra 93 HP e defesa 2 contra 3. Escudos absorveram 0 contra 15,8; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 12,5 p.p. e de HP final -6,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para 0 p.p.; contraste de 12,5 p.p. e alteração de 40,6 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 150% do DPS efetivo de mago. Por encontro, recebeu 53,3 contra 100,6 HP de dano; recuperou 15 contra 47,5 HP (15 contra 47,5 de poções), gastando 14,3 contra 10 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 95 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 17,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 25 p.p.; contraste de -25 p.p. e alteração de -20,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 133,4% do DPS efetivo de arqueiro. Por encontro, recebeu 53,3 contra 46,5 HP de dano; recuperou 15 contra 14,3 HP (15 contra 14,3 de poções), gastando 14,3 contra 10 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 95 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final -4,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -12,5 p.p.; contraste de 12,5 p.p. e alteração de -3,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 0/8 mortes contra 1/8; 0 contra 0 limites de tempo. aventureiro manteve 141,7% do DPS efetivo de necromante. Por encontro, recebeu 53,3 contra 52,9 HP de dano; recuperou 15 contra 21,8 HP (15 contra 21,8 de poções), gastando 14,3 contra 6,8 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 72 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 71,6 de dano e receberam 0 contra 20,1. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 12,5 p.p. e de HP final 5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para 25 p.p.; contraste de -12,5 p.p. e alteração de -16,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × mago:** 1/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 97,3% do DPS efetivo de mago. Por encontro, recebeu 87,5 contra 100,6 HP de dano; recuperou 66,6 contra 47,5 HP (37 contra 47,5 de poções), gastando 16 contra 10 mana total e 9 contra 0 HP em conjurações. Começou com 93 contra 95 HP e defesa 3 contra 1. Escudos absorveram 15,8 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 1 só mago venceu; diferença de vitória -12,5 p.p. e de HP final 23,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Defesa plana zerada**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para 12,5 p.p.; contraste de -25 p.p. e alteração de -11,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: mago venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × arqueiro:** 1/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 86,6% do DPS efetivo de arqueiro. Por encontro, recebeu 87,5 contra 46,5 HP de dano; recuperou 66,6 contra 14,3 HP (37 contra 14,3 de poções), gastando 16 contra 10 mana total e 9 contra 0 HP em conjurações. Começou com 93 contra 95 HP e defesa 3 contra 2. Escudos absorveram 15,8 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 1 só arqueiro venceu; diferença de vitória -12,5 p.p. e de HP final 1,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para -37,5 p.p.; contraste de 25 p.p. e alteração de 16,6 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: arqueiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × necromante:** 1/8 mortes contra 1/8; 0 contra 0 limites de tempo. guerreiro manteve 91,9% do DPS efetivo de necromante. Por encontro, recebeu 87,5 contra 52,9 HP de dano; recuperou 66,6 contra 21,8 HP (37 contra 21,8 de poções), gastando 16 contra 6,8 mana total e 9 contra 0 HP em conjurações. Começou com 93 contra 72 HP e defesa 3 contra 1. Escudos absorveram 15,8 contra 0; invocações causaram 0 contra 71,6 de dano e receberam 0 contra 20,1. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só guerreiro venceu, 1 só necromante venceu; diferença de vitória 0 p.p. e de HP final 11,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 12,5 p.p.; contraste de -12,5 p.p. e alteração de -35,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 88,9% do DPS efetivo de arqueiro. Por encontro, recebeu 100,6 contra 46,5 HP de dano; recuperou 47,5 contra 14,3 HP (47,5 contra 14,3 de poções), gastando 10 contra 10 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 95 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final -22 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -37,5 p.p.; contraste de 37,5 p.p. e alteração de 16,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × necromante:** 0/8 mortes contra 1/8; 0 contra 0 limites de tempo. mago manteve 94,4% do DPS efetivo de necromante. Por encontro, recebeu 100,6 contra 52,9 HP de dano; recuperou 47,5 contra 21,8 HP (47,5 contra 21,8 de poções), gastando 10 contra 6,8 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 72 HP e defesa 1 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 71,6 de dano e receberam 0 contra 20,1. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só mago venceu, 0 só necromante venceu; diferença de vitória 12,5 p.p. e de HP final -12,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para 0 p.p.; contraste de 12,5 p.p. e alteração de 3,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: mago venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**arqueiro × necromante:** 0/8 mortes contra 1/8; 0 contra 0 limites de tempo. arqueiro manteve 106,2% do DPS efetivo de necromante. Por encontro, recebeu 46,5 contra 52,9 HP de dano; recuperou 14,3 contra 21,8 HP (14,3 contra 21,8 de poções), gastando 10 contra 6,8 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 72 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 71,6 de dano e receberam 0 contra 20,1. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só arqueiro venceu, 0 só necromante venceu; diferença de vitória 12,5 p.p. e de HP final 9,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para 37,5 p.p.; contraste de -25 p.p. e alteração de -12,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: arqueiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

### O que mudou ao retirar cada fator

**aventureiro, Sem poções de vida:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 11,1 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Sem poções de vida:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 31,6 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem poções de vida:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 31,3 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Defesa plana zerada:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 5,3 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem poções de vida:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 27,4 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 7/8; 1; 0 | 12,5 | 11,1 | 11,4 (102,2% do completo) | 1 / 0 |
| aventureiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | 12 | 7 (62,7% do completo) | 0 / 0 |
| aventureiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 6,8 | 11,2 (100% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 8/8; 0; 0 | -12,5 | -8,2 | 7,2 (98,8% do completo) | 0 / 1 |
| guerreiro | Sem poções de vida | 5/8; 3; 0 | 25 | 31,6 | 7,3 (100,9% do completo) | 2 / 0 |
| guerreiro | Sem habilidades da barra | 8/8; 0; 0 | -12,5 | -28,6 | 7,2 (98,7% do completo) | 0 / 1 |
| guerreiro | Defesa plana zerada | 8/8; 0; 0 | -12,5 | -6 | 7,2 (99,2% do completo) | 0 / 1 |
| mago | Sem poções de vida | 5/8; 3; 0 | 37,5 | 31,3 | 7 (93,6% do completo) | 3 / 0 |
| mago | Sem habilidades da barra | 8/8; 0; 0 | 0 | -9,3 | 8,1 (108,6% do completo) | 0 / 0 |
| mago | Defesa plana zerada | 7/8; 1; 0 | 12,5 | 5,3 | 7,4 (98,8% do completo) | 1 / 0 |
| arqueiro | Sem poções de vida | 8/8; 0; 0 | 0 | 15 | 8,4 (100% do completo) | 0 / 0 |
| arqueiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | 3,4 | 7,6 (90,5% do completo) | 0 / 0 |
| arqueiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 6,3 | 8,4 (100% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 5/8; 3; 0 | 25 | 27,4 | 8,1 (102,5% do completo) | 2 / 0 |
| necromante | Sem habilidades da barra | 7/8; 1; 0 | 0 | 7,3 | 8,7 (110% do completo) | 1 / 1 |
| necromante | Defesa plana zerada | 7/8; 1; 0 | 0 | 3,5 | 7,9 (100% do completo) | 0 / 0 |

## nível 1 · pesadelo · pressao

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | — | 14,8 s | 0 | 166,8 | 180 | 80 | 16,5 | 0 |
| guerreiro | — | 17,3 s | 0 | 148,6 | 184,3 | 100,6 | 15,4 | 9,4 |
| mago | — | 13,6 s | 0 | 146,5 | 156,8 | 61,8 | 11,9 | 0 |
| arqueiro | — | 15,4 s | 0 | 153,9 | 161,5 | 66,5 | 12,6 | 0 |
| necromante | 37,3 s | 14,8 s | 0,1 | 134,5 | 121,8 | 53,9 | 11,3 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 0 / 0 / 80 / 0 | 166,8 / 0 / 0 | 0 | 0 | 8,5 / 3 / 0 / 3 / 4,6 | 1,4 |
| guerreiro | 0 / 26,6 / 74 / 0 | 145,4 / 3,3 / 0 | 14 | 0 | 8,1 / 1,2 / 0 / 2,6 / 0,8 | 0,3 |
| mago | 0 / 0 / 61,8 / 0 | 140,8 / 5,8 / 0 | 0 | 0 | 7,6 / 1,2 / 0 / 1,5 / 0 | 2,2 |
| arqueiro | 0 / 0 / 66,5 / 0 | 153,9 / 0 / 0 | 0 | 0 | 7,6 / 1,2 / 0 / 1,8 / 4,7 | 2,1 |
| necromante | 0 / 6,8 / 47,1 / 0 | 56,8 / 0 / 77,8 | 0 | 6,8 | 6 / 3,1 / 0 / 0,9 / 0,4 | 2,4 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 15,8 / 2 | 13,4 / 1,3 / 5,5 | 0 / 0 | — | 0 / 7,4 |
| guerreiro | 18 / 1,4 | 10,6 / 1,3 / 4,9 | 0 / 0 | — | 0 / 7,5 |
| mago | 11,6 / 1,3 | 12,1 / 2,1 / 4,4 | 0,9 / 0 | — | 0 / 6,3 |
| arqueiro | 13,8 / 0 | 12,6 / 1,8 / 5,3 | 0 / 0 | — | 0 / 7,9 |
| necromante | 14,1 / 0,4 | 18,5 / 3,5 / 7,1 | 0,8 / 0 | sem_invocacao: 6,8 | 2 / 9 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 5,3 | 63,6 | 0 | 10,5 | 0 | — |
| aventureiro | explosao | 1 | 15,4 | 0 | 3 | 0 | — |
| aventureiro | golpe_atordoante | 1 | 10,6 | 0 | 3 | 0 | — |
| aventureiro | ataque_basico | 8,5 | 77,1 | 0 | 0 | 0 | — |
| aventureiro | item:pocao_vida | 2 | 0 | 80 | 0 | 0 | — |
| guerreiro | investida | 2,6 | 20,9 | 0 | 7,9 | 0 | — |
| guerreiro | redemoinho | 3,1 | 1,8 | 0 | 0 | 9,4 | — |
| guerreiro | grito_de_guerra | 1,1 | 0 | 0 | 4,5 | 0 | — |
| guerreiro | ataque_basico | 10,1 | 122,8 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 26,6 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 1 | 0 | 0 | 3 | 0 | — |
| guerreiro | efeito:dano_direto | 0 | 3,3 | 0 | 0 | 0 | — |
| guerreiro | item:pocao_vida | 2 | 0 | 74 | 0 | 0 | — |
| mago | bola_de_fogo | 1,6 | 15,5 | 0 | 4,9 | 0 | — |
| mago | dardo_arcano | 8 | 77 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 1 | 14,3 | 0 | 3 | 0 | — |
| mago | raio_em_cadeia | 1 | 34 | 0 | 4 | 0 | — |
| mago | item:pocao_vida | 1,6 | 0 | 61,8 | 0 | 0 | — |
| mago | efeito:queimando | 0 | 5,8 | 0 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 1,9 | 15,3 | 0 | 5,6 | 0 | — |
| arqueiro | chuva_de_flechas | 1 | 10,9 | 0 | 4 | 0 | — |
| arqueiro | flecha_venenosa | 1 | 1 | 0 | 3 | 0 | — |
| arqueiro | tiro | 9,9 | 126,8 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 1,8 | 0 | 66,5 | 0 | 0 | — |
| necromante | dardo_funesto | 2,8 | 11,3 | 0 | 5,5 | 0 | — |
| necromante | garras_do_ossuario | 1,3 | 7,4 | 0 | 3,8 | 0 | — |
| necromante | toque_funesto | 9,5 | 38,1 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 77,8 | 0 | 0 | 0 | — |
| necromante | dizimo_vital | 0,5 | 0 | 0 | 1,5 | 0 | — |
| necromante | efeito:cura | 0 | 0 | 6,8 | 0 | 0 | — |
| necromante | item:pocao_vida | 1,6 | 0 | 47,1 | 0 | 0 | — |
| necromante | comando_sepulcral | 0,1 | 0 | 0 | 0,5 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 120,5% do DPS efetivo de guerreiro. Por encontro, recebeu 180 contra 184,3 HP de dano; recuperou 80 contra 100,6 HP (80 contra 74 de poções), gastando 16,5 contra 15,4 mana total e 0 contra 9,4 HP em conjurações. Começou com 100 contra 93 HP e defesa 2 contra 3. Escudos absorveram 0 contra 14; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -25 p.p.; contraste de 25 p.p. e alteração de 19,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × mago:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 101,5% do DPS efetivo de mago. Por encontro, recebeu 180 contra 156,8 HP de dano; recuperou 80 contra 61,8 HP (80 contra 61,8 de poções), gastando 16,5 contra 11,9 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 95 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 120,5% do DPS efetivo de arqueiro. Por encontro, recebeu 180 contra 161,5 HP de dano; recuperou 80 contra 66,5 HP (80 contra 66,5 de poções), gastando 16,5 contra 12,6 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 95 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 8/8 mortes contra 7/8; 0 contra 0 limites de tempo. aventureiro manteve 144,7% do DPS efetivo de necromante. Por encontro, recebeu 180 contra 121,8 HP de dano; recuperou 80 contra 53,9 HP (80 contra 47,1 de poções), gastando 16,5 contra 11,3 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 72 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 77,8 de dano e receberam 0 contra 36. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 1 só necromante venceu; diferença de vitória -12,5 p.p. e de HP final -8,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Defesa plana zerada**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para -12,5 p.p.; contraste de 0 p.p. e alteração de -3,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × mago:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 84,3% do DPS efetivo de mago. Por encontro, recebeu 184,3 contra 156,8 HP de dano; recuperou 100,6 contra 61,8 HP (74 contra 61,8 de poções), gastando 15,4 contra 11,9 mana total e 9,4 contra 0 HP em conjurações. Começou com 93 contra 95 HP e defesa 3 contra 1. Escudos absorveram 14 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 25 p.p.; contraste de -25 p.p. e alteração de -19,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 100% do DPS efetivo de arqueiro. Por encontro, recebeu 184,3 contra 161,5 HP de dano; recuperou 100,6 contra 66,5 HP (74 contra 66,5 de poções), gastando 15,4 contra 12,6 mana total e 9,4 contra 0 HP em conjurações. Começou com 93 contra 95 HP e defesa 3 contra 2. Escudos absorveram 14 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 25 p.p.; contraste de -25 p.p. e alteração de -19,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × necromante:** 8/8 mortes contra 7/8; 0 contra 0 limites de tempo. guerreiro manteve 120,1% do DPS efetivo de necromante. Por encontro, recebeu 184,3 contra 121,8 HP de dano; recuperou 100,6 contra 53,9 HP (74 contra 47,1 de poções), gastando 15,4 contra 11,3 mana total e 9,4 contra 0 HP em conjurações. Começou com 93 contra 72 HP e defesa 3 contra 1. Escudos absorveram 14 contra 0; invocações causaram 0 contra 77,8 de dano e receberam 0 contra 36. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 1 só necromante venceu; diferença de vitória -12,5 p.p. e de HP final -8,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para 12,5 p.p.; contraste de -25 p.p. e alteração de -19,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. mago manteve 118,7% do DPS efetivo de arqueiro. Por encontro, recebeu 156,8 contra 161,5 HP de dano; recuperou 61,8 contra 66,5 HP (61,8 contra 66,5 de poções), gastando 11,9 contra 12,6 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 95 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × necromante:** 8/8 mortes contra 7/8; 0 contra 0 limites de tempo. mago manteve 142,5% do DPS efetivo de necromante. Por encontro, recebeu 156,8 contra 121,8 HP de dano; recuperou 61,8 contra 53,9 HP (61,8 contra 47,1 de poções), gastando 11,9 contra 11,3 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 72 HP e defesa 1 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 77,8 de dano e receberam 0 contra 36. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 1 só necromante venceu; diferença de vitória -12,5 p.p. e de HP final -8,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Defesa plana zerada**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para -12,5 p.p.; contraste de 0 p.p. e alteração de -3,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**arqueiro × necromante:** 8/8 mortes contra 7/8; 0 contra 0 limites de tempo. arqueiro manteve 120,1% do DPS efetivo de necromante. Por encontro, recebeu 161,5 contra 121,8 HP de dano; recuperou 66,5 contra 53,9 HP (66,5 contra 47,1 de poções), gastando 12,6 contra 11,3 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 72 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 77,8 de dano e receberam 0 contra 36. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 1 só necromante venceu; diferença de vitória -12,5 p.p. e de HP final -8,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Defesa plana zerada**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para -12,5 p.p.; contraste de 0 p.p. e alteração de -3,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### O que mudou ao retirar cada fator

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 12 (108% do completo) | 0 / 0 |
| aventureiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 7,8 (70,7% do completo) | 0 / 0 |
| aventureiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 11,5 (103,8% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 2/8; 6; 0 | -25 | -19,2 | 9,1 (98,4% do completo) | 0 / 2 |
| guerreiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 10,1 (110% do completo) | 0 / 0 |
| guerreiro | Sem habilidades da barra | 1/8; 7; 0 | -12,5 | -7,9 | 8,1 (87,9% do completo) | 0 / 1 |
| guerreiro | Defesa plana zerada | 1/8; 7; 0 | -12,5 | -12,5 | 9,8 (106,1% do completo) | 0 / 1 |
| mago | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 11,5 (104,8% do completo) | 0 / 0 |
| mago | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 6,8 (62,1% do completo) | 0 / 0 |
| mago | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 11,1 (101,7% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 8,6 (93,5% do completo) | 0 / 0 |
| arqueiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 8,5 (92,5% do completo) | 0 / 0 |
| arqueiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 9,2 (99,6% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 1/8; 7; 0 | 0 | 3,1 | 7,8 (102,1% do completo) | 0 / 0 |
| necromante | Sem habilidades da barra | 1/8; 7; 0 | 0 | 0,5 | 7,2 (94,5% do completo) | 1 / 1 |
| necromante | Defesa plana zerada | 1/8; 7; 0 | 0 | 3,5 | 7,5 (98% do completo) | 0 / 0 |

## nível 1 · pesadelo · atrito

### Onde o desgaste aparece

| Classe | Onda | Chegaram/n inicial | Mortes / limites nesta onda | HP entrada → saída | Mana entrada → saída | Recebido / cura / mana gasta |
|---|---|---|---|---|---|---|
| aventureiro | 1 | 8/8 | 0 / 0 | 100 → 68,3 | 10 → 0,8 | 51,8 / 20 / 14,3 |
| aventureiro | 2 | 8/8 | 4 / 0 | 68,3 → 21,1 | 0,8 → 0,5 | 84,9 / 35 / 8,3 |
| aventureiro | 3 | 4/8 | 2 / 0 | 42,3 → 9,3 | 0,8 → 0,4 | 63,5 / 26,3 / 7,5 |
| aventureiro | 4 | 2/8 | 2 / 0 | 18,5 → 0 | 0,5 → 1,3 | 20 / 0 / 2 |
| guerreiro | 1 | 8/8 | 0 / 0 | 93 → 69,9 | 10 → 1,6 | 76,4 / 60 / 13,4 |
| guerreiro | 2 | 8/8 | 3 / 0 | 69,9 → 43,8 | 1,6 → 1,6 | 100,9 / 78,9 / 10,9 |
| guerreiro | 3 | 5/8 | 2 / 0 | 70 → 47 | 1,6 → 1,6 | 48,4 / 26,4 / 7,2 |
| guerreiro | 4 | 3/8 | 3 / 0 | 78,3 → 0 | 1 → 1,3 | 80,7 / 7 / 7,3 |
| mago | 1 | 8/8 | 0 / 0 | 95 → 49,3 | 12 → 7,9 | 79 / 33,3 / 10 |
| mago | 2 | 8/8 | 5 / 0 | 49,3 → 3 | 7,9 → 7,6 | 84,3 / 38 / 6 |
| mago | 3 | 3/8 | 3 / 0 | 8 → 0 | 8,7 → 2 | 8 / 0 / 8 |
| arqueiro | 1 | 8/8 | 0 / 0 | 95 → 74,8 | 10 → 4,5 | 34,5 / 14,3 / 10 |
| arqueiro | 2 | 8/8 | 1 / 0 | 74,8 → 46 | 4,5 → 6,3 | 66,8 / 38 / 4,5 |
| arqueiro | 3 | 7/8 | 4 / 0 | 52,6 → 18,1 | 6,6 → 1,4 | 56,1 / 21,7 / 9,1 |
| arqueiro | 4 | 3/8 | 1 / 0 | 42,3 → 11,7 | 1,7 → 5,5 | 44,3 / 12,7 / 3 |
| arqueiro | 5 | 2/8 | 2 / 0 | 17,5 → 0 | 6,5 → 1,5 | 17,5 / 0 / 6 |
| necromante | 1 | 8/8 | 0 / 0 | 72 → 56,1 | 12 → 8,2 | 23,1 / 7,3 / 7,9 |
| necromante | 2 | 8/8 | 0 / 0 | 56,1 → 50,8 | 8,2 → 5,9 | 14,9 / 9,5 / 6,8 |
| necromante | 3 | 8/8 | 0 / 0 | 50,8 → 56,5 | 5,9 → 4,1 | 0 / 2,3 / 7,1 |
| necromante | 4 | 8/8 | 0 / 0 | 56,5 → 49,5 | 4,1 → 5,1 | 8,6 / 0 / 3,4 |
| necromante | 5 | 8/8 | 0 / 0 | 49,5 → 54,1 | 5,1 → 2,7 | 0 / 4,5 / 4,3 |

Médias de cada onda incluem apenas quem chegou a ela; o denominador inicial mostra a seleção dos sobreviventes. Não compare a vida da onda 5 como se incluísse quem morreu antes.

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | — | 26,4 s | 1,8 | 247,4 | 173,4 | 68,1 | 26,8 | 0 |
| guerreiro | — | 40,3 s | 2 | 284,9 | 237,8 | 158 | 31,5 | 19,9 |
| mago | — | 25,8 s | 1,4 | 194,4 | 166,3 | 71,3 | 19 | 0 |
| arqueiro | — | 35 s | 2,5 | 333,5 | 171,4 | 76 | 25,1 | 0 |
| necromante | 32,3 s | — | 5 | 534 | 46,6 | 23,5 | 29,4 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 3,1 / 0 / 65 / 0 | 247,4 / 0 / 0 | 0 | 0 | 14,5 / 8,6 / 0 / 3,4 / 11,8 | 1,3 |
| guerreiro | 0 / 84 / 74 / 0 | 282,9 / 2 / 0 | 31,5 | 0 | 17,6 / 8 / 0 / 6,5 / 6,7 | 0,6 |
| mago | 0 / 0 / 71,3 / 0 | 183,1 / 11,3 / 0 | 3,3 | 0 | 13,4 / 1,2 / 0 / 4,1 / 1,5 | 2,2 |
| arqueiro | 0 / 0 / 76 / 0 | 329,4 / 4,1 / 0 | 0 | 0 | 16 / 1,9 / 0 / 4,2 / 13,2 | 2,4 |
| necromante | 0 / 9 / 14,5 / 0 | 116,8 / 0 / 417,3 | 0 | 9 | 13 / 5,7 / 0 / 2,6 / 1,5 | 2,9 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 28 / 4,4 | 21 / 2,9 / 8,9 | 0 / 0 | — | 5,3 / 17,3 |
| guerreiro | 41,5 / 5,9 | 21,4 / 3,4 / 8,1 | 0,1 / 0 | recurso: 3,1 | 6,6 / 23,2 |
| mago | 21,3 / 2,3 | 16,5 / 3,5 / 6,1 | 0,1 / 0 | — | 0 / 12,1 |
| arqueiro | 29,8 / 1,4 | 26 / 2,8 / 12 | 0 / 0 | — | 0,4 / 17,1 |
| necromante | 30,8 / 1,3 | 56,6 / 10,3 / 22,3 | 2,1 / 0 | — | 5,3 / 20,1 |

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
| guerreiro | investida | 5,3 | 33,8 | 0 | 15,8 | 0 | — |
| guerreiro | redemoinho | 6,6 | 17 | 0 | 0 | 19,9 | — |
| guerreiro | grito_de_guerra | 2,3 | 0 | 0 | 9 | 0 | — |
| guerreiro | ataque_basico | 25,1 | 232,1 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 84 | 0 | 0 | — |
| guerreiro | efeito:dano_direto | 0 | 2 | 0 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 2,3 | 0 | 0 | 6,8 | 0 | — |
| guerreiro | item:pocao_vida | 2 | 0 | 74 | 0 | 0 | — |
| mago | bola_de_fogo | 2,4 | 37,4 | 0 | 7,1 | 0 | — |
| mago | dardo_arcano | 15,3 | 129 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 2,4 | 2,9 | 0 | 7,1 | 0 | — |
| mago | raio_em_cadeia | 1 | 13,9 | 0 | 4 | 0 | — |
| mago | item:pocao_vida | 1,9 | 0 | 71,3 | 0 | 0 | — |
| mago | efeito:queimando | 0 | 11,3 | 0 | 0 | 0 | — |
| mago | barreira | 0,3 | 0 | 0 | 0,8 | 0 | — |
| arqueiro | flecha_perfurante | 4,1 | 46,6 | 0 | 12,4 | 0 | — |
| arqueiro | chuva_de_flechas | 1,5 | 19 | 0 | 6 | 0 | — |
| arqueiro | flecha_venenosa | 2,3 | 15,3 | 0 | 6,8 | 0 | — |
| arqueiro | tiro | 21,9 | 248,5 | 0 | 0 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 4,1 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 2 | 0 | 76 | 0 | 0 | — |
| necromante | dardo_funesto | 7,9 | 24,6 | 0 | 15,8 | 0 | — |
| necromante | garras_do_ossuario | 3,9 | 21,6 | 0 | 11,6 | 0 | — |
| necromante | toque_funesto | 18,4 | 70,5 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 417,3 | 0 | 0 | 0 | — |
| necromante | dizimo_vital | 0,5 | 0 | 0 | 1,5 | 0 | — |
| necromante | efeito:cura | 0 | 0 | 9 | 0 | 0 | — |
| necromante | item:pocao_vida | 0,5 | 0 | 14,5 | 0 | 0 | — |
| necromante | comando_sepulcral | 0,1 | 0 | 0 | 0,5 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 122,3% do DPS efetivo de guerreiro. Por encontro, recebeu 173,4 contra 237,8 HP de dano; recuperou 68,1 contra 158 HP (65 contra 74 de poções), gastando 26,8 contra 31,5 mana total e 0 contra 19,9 HP em conjurações. Começou com 100 contra 93 HP e defesa 2 contra 3. Escudos absorveram 0 contra 31,5; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -25 p.p.; contraste de 25 p.p. e alteração de 25 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × mago:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 109,5% do DPS efetivo de mago. Por encontro, recebeu 173,4 contra 166,3 HP de dano; recuperou 68,1 contra 71,3 HP (65 contra 71,3 de poções), gastando 26,8 contra 19 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 95 HP e defesa 2 contra 1. Escudos absorveram 0 contra 3,3; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 90,7% do DPS efetivo de arqueiro. Por encontro, recebeu 173,4 contra 171,4 HP de dano; recuperou 68,1 contra 76 HP (65 contra 76 de poções), gastando 26,8 contra 25,1 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 95 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 8/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 55,9% do DPS efetivo de necromante. Por encontro, recebeu 173,4 contra 46,6 HP de dano; recuperou 68,1 contra 23,5 HP (65 contra 14,5 de poções), gastando 26,8 contra 29,4 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 72 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 417,3 de dano e receberam 0 contra 99,8. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 8 só necromante venceu; diferença de vitória -100 p.p. e de HP final -75,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -100 para -62,5 p.p.; contraste de -37,5 p.p. e alteração de -45,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × mago:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 89,6% do DPS efetivo de mago. Por encontro, recebeu 237,8 contra 166,3 HP de dano; recuperou 158 contra 71,3 HP (74 contra 71,3 de poções), gastando 31,5 contra 19 mana total e 19,9 contra 0 HP em conjurações. Começou com 93 contra 95 HP e defesa 3 contra 1. Escudos absorveram 31,5 contra 3,3; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 25 p.p.; contraste de -25 p.p. e alteração de -25 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 74,2% do DPS efetivo de arqueiro. Por encontro, recebeu 237,8 contra 171,4 HP de dano; recuperou 158 contra 76 HP (74 contra 76 de poções), gastando 31,5 contra 25,1 mana total e 19,9 contra 0 HP em conjurações. Começou com 93 contra 95 HP e defesa 3 contra 2. Escudos absorveram 31,5 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 25 p.p.; contraste de -25 p.p. e alteração de -25 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × necromante:** 8/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 45,8% do DPS efetivo de necromante. Por encontro, recebeu 237,8 contra 46,6 HP de dano; recuperou 158 contra 23,5 HP (74 contra 14,5 de poções), gastando 31,5 contra 29,4 mana total e 19,9 contra 0 HP em conjurações. Começou com 93 contra 72 HP e defesa 3 contra 1. Escudos absorveram 31,5 contra 0; invocações causaram 0 contra 417,3 de dano e receberam 0 contra 99,8. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 8 só necromante venceu; diferença de vitória -100 p.p. e de HP final -75,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -100 para -37,5 p.p.; contraste de -62,5 p.p. e alteração de -70,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. mago manteve 82,8% do DPS efetivo de arqueiro. Por encontro, recebeu 166,3 contra 171,4 HP de dano; recuperou 71,3 contra 76 HP (71,3 contra 76 de poções), gastando 19 contra 25,1 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 95 HP e defesa 1 contra 2. Escudos absorveram 3,3 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × necromante:** 8/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 51,1% do DPS efetivo de necromante. Por encontro, recebeu 166,3 contra 46,6 HP de dano; recuperou 71,3 contra 23,5 HP (71,3 contra 14,5 de poções), gastando 19 contra 29,4 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 72 HP e defesa 1 contra 1. Escudos absorveram 3,3 contra 0; invocações causaram 0 contra 417,3 de dano e receberam 0 contra 99,8. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 8 só necromante venceu; diferença de vitória -100 p.p. e de HP final -75,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -100 para -62,5 p.p.; contraste de -37,5 p.p. e alteração de -45,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**arqueiro × necromante:** 8/8 mortes contra 0/8; 0 contra 0 limites de tempo. arqueiro manteve 61,7% do DPS efetivo de necromante. Por encontro, recebeu 171,4 contra 46,6 HP de dano; recuperou 76 contra 23,5 HP (76 contra 14,5 de poções), gastando 25,1 contra 29,4 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 72 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 417,3 de dano e receberam 0 contra 99,8. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 8 só necromante venceu; diferença de vitória -100 p.p. e de HP final -75,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -100 para -62,5 p.p.; contraste de -37,5 p.p. e alteração de -45,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

### O que mudou ao retirar cada fator

**necromante, Sem poções de vida:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 13,4 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem habilidades da barra:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 45,1 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Defesa plana zerada:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 6,4 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 9,5 (108,6% do completo) | 0 / 0 |
| aventureiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 7,6 (87,5% do completo) | 0 / 0 |
| aventureiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 8,5 (97,4% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 0/8; 8; 0 | 0 | 0 | 7 (98,2% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 7,9 (111,4% do completo) | 0 / 0 |
| guerreiro | Sem habilidades da barra | 2/8; 6; 0 | -25 | -25 | 7,2 (101,8% do completo) | 0 / 2 |
| guerreiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 6,9 (96,3% do completo) | 0 / 0 |
| mago | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 7,5 (94,8% do completo) | 0 / 0 |
| mago | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 7,1 (89,5% do completo) | 0 / 0 |
| mago | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 7,8 (98,2% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 9,7 (101,4% do completo) | 0 / 0 |
| arqueiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 7,9 (82,2% do completo) | 0 / 0 |
| arqueiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 9,6 (99,9% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 6/8; 2; 0 | 25 | 13,4 | 14,8 (94,9% do completo) | 2 / 0 |
| necromante | Sem habilidades da barra | 5/8; 3; 0 | 37,5 | 45,1 | 11 (70,8% do completo) | 3 / 0 |
| necromante | Defesa plana zerada | 7/8; 1; 0 | 12,5 | 6,4 | 15,6 (100,4% do completo) | 1 / 0 |

## nível 1 · pesadelo · chefe

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | — | 22,2 s | 0 | 183 | 180 | 80 | 20 | 0 |
| guerreiro | — | 24,6 s | 0 | 197,9 | 164,1 | 83,1 | 20,1 | 12 |
| mago | — | 26,1 s | 0 | 210,5 | 166,3 | 71,3 | 19 | 0 |
| arqueiro | — | 26 s | 0 | 183,6 | 142,5 | 47,5 | 17,3 | 0 |
| necromante | — | 30,2 s | 0 | 220,8 | 111,9 | 39,9 | 22,1 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 0 / 0 / 80 / 0 | 183 / 0 / 0 | 0 | 0 | 11,1 / 5 / 2,1 / 2,6 / 7,1 | 1,1 |
| guerreiro | 0 / 13,8 / 69,4 / 0 | 195,5 / 2,4 / 0 | 15,8 | 0 | 10,1 / 2,5 / 2,3 / 3 / 2,5 | 0,6 |
| mago | 0 / 0 / 71,3 / 0 | 194,8 / 15,8 / 0 | 0 | 0 | 14,8 / 11,9 / 0,5 / 1,9 / 5,2 | 1,9 |
| arqueiro | 0 / 0 / 47,5 / 0 | 178,6 / 5 / 0 | 0 | 0 | 10,5 / 10,6 / 1,2 / 1,4 / 10,8 | 1,9 |
| necromante | 0 / 0 / 39,9 / 0 | 116,5 / 0 / 104,3 | 0 | 0 | 11,1 / 13,9 / 0,6 / 0,6 / 1,3 | 2,1 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 21 / 3 | 16,5 / 2,5 / 6 | 0 / 0 | bloqueado: 3,4 | 0 / 10,5 |
| guerreiro | 23,5 / 3 | 14,6 / 2,5 / 6 | 0 / 0 | — | 0 / 11,4 |
| mago | 21,9 / 2 | 18,9 / 3,9 / 6,9 | 0 / 0 | — | 0 / 12,9 |
| arqueiro | 19,9 / 1,4 | 15,5 / 2,5 / 5,9 | 0 / 0 | — | 0 / 11,9 |
| necromante | 26,1 / 0,3 | 31,8 / 4,9 / 11,9 | 2,3 / 0 | bloqueado: 2,9 | 0 / 16,1 |

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
| guerreiro | ataque_basico | 13,4 | 145,4 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 13,8 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 1,1 | 0 | 0 | 3,4 | 0 | — |
| guerreiro | item:pocao_vida | 1,9 | 0 | 69,4 | 0 | 0 | — |
| guerreiro | efeito:dano_direto | 0 | 2,4 | 0 | 0 | 0 | — |
| mago | bola_de_fogo | 3 | 21,1 | 0 | 9 | 0 | — |
| mago | dardo_arcano | 15,9 | 147 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 2 | 14,9 | 0 | 6 | 0 | — |
| mago | raio_em_cadeia | 1 | 11,8 | 0 | 4 | 0 | — |
| mago | efeito:queimando | 0 | 15,8 | 0 | 0 | 0 | — |
| mago | item:pocao_vida | 1,9 | 0 | 71,3 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 3,3 | 23,1 | 0 | 9,8 | 0 | — |
| arqueiro | chuva_de_flechas | 1,1 | 0 | 0 | 4,5 | 0 | — |
| arqueiro | flecha_venenosa | 1 | 11,5 | 0 | 3 | 0 | — |
| arqueiro | tiro | 14,5 | 144 | 0 | 0 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 5 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 1,3 | 0 | 47,5 | 0 | 0 | — |
| necromante | dardo_funesto | 6,4 | 26,9 | 0 | 12,8 | 0 | — |
| necromante | garras_do_ossuario | 3,1 | 16,8 | 0 | 9,4 | 0 | — |
| necromante | toque_funesto | 16,6 | 72,9 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 104,3 | 0 | 0 | 0 | — |
| necromante | item:pocao_vida | 1,4 | 0 | 39,9 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 99,3% do DPS efetivo de guerreiro. Por encontro, recebeu 180 contra 164,1 HP de dano; recuperou 80 contra 83,1 HP (80 contra 69,4 de poções), gastando 20 contra 20,1 mana total e 0 contra 12 HP em conjurações. Começou com 100 contra 93 HP e defesa 2 contra 3. Escudos absorveram 0 contra 15,8; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × mago:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 104,3% do DPS efetivo de mago. Por encontro, recebeu 180 contra 166,3 HP de dano; recuperou 80 contra 71,3 HP (80 contra 71,3 de poções), gastando 20 contra 19 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 95 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 113,9% do DPS efetivo de arqueiro. Por encontro, recebeu 180 contra 142,5 HP de dano; recuperou 80 contra 47,5 HP (80 contra 47,5 de poções), gastando 20 contra 17,3 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 95 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 113,5% do DPS efetivo de necromante. Por encontro, recebeu 180 contra 111,9 HP de dano; recuperou 80 contra 39,9 HP (80 contra 39,9 de poções), gastando 20 contra 22,1 mana total e 0 contra 0 HP em conjurações. Começou com 100 contra 72 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 104,3 de dano e receberam 0 contra 60,8. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × mago:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 105,1% do DPS efetivo de mago. Por encontro, recebeu 164,1 contra 166,3 HP de dano; recuperou 83,1 contra 71,3 HP (69,4 contra 71,3 de poções), gastando 20,1 contra 19 mana total e 12 contra 0 HP em conjurações. Começou com 93 contra 95 HP e defesa 3 contra 1. Escudos absorveram 15,8 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 114,7% do DPS efetivo de arqueiro. Por encontro, recebeu 164,1 contra 142,5 HP de dano; recuperou 83,1 contra 47,5 HP (69,4 contra 47,5 de poções), gastando 20,1 contra 17,3 mana total e 12 contra 0 HP em conjurações. Começou com 93 contra 95 HP e defesa 3 contra 2. Escudos absorveram 15,8 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × necromante:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 114,3% do DPS efetivo de necromante. Por encontro, recebeu 164,1 contra 111,9 HP de dano; recuperou 83,1 contra 39,9 HP (69,4 contra 39,9 de poções), gastando 20,1 contra 22,1 mana total e 12 contra 0 HP em conjurações. Começou com 93 contra 72 HP e defesa 3 contra 1. Escudos absorveram 15,8 contra 0; invocações causaram 0 contra 104,3 de dano e receberam 0 contra 60,8. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. mago manteve 109,2% do DPS efetivo de arqueiro. Por encontro, recebeu 166,3 contra 142,5 HP de dano; recuperou 71,3 contra 47,5 HP (71,3 contra 47,5 de poções), gastando 19 contra 17,3 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 95 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × necromante:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. mago manteve 108,8% do DPS efetivo de necromante. Por encontro, recebeu 166,3 contra 111,9 HP de dano; recuperou 71,3 contra 39,9 HP (71,3 contra 39,9 de poções), gastando 19 contra 22,1 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 72 HP e defesa 1 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 104,3 de dano e receberam 0 contra 60,8. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**arqueiro × necromante:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. arqueiro manteve 99,7% do DPS efetivo de necromante. Por encontro, recebeu 142,5 contra 111,9 HP de dano; recuperou 47,5 contra 39,9 HP (47,5 contra 39,9 de poções), gastando 17,3 contra 22,1 mana total e 0 contra 0 HP em conjurações. Começou com 95 contra 72 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 104,3 de dano e receberam 0 contra 60,8. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### O que mudou ao retirar cada fator

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 8,3 (98,4% do completo) | 0 / 0 |
| aventureiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 6,5 (77,3% do completo) | 0 / 0 |
| aventureiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 8,3 (98,5% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 0/8; 8; 0 | 0 | 0 | 8,6 (101,8% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 7,7 (90,6% do completo) | 0 / 0 |
| guerreiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 6,8 (79,8% do completo) | 0 / 0 |
| guerreiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 8,6 (101,6% do completo) | 0 / 0 |
| mago | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 8,3 (102,9% do completo) | 0 / 0 |
| mago | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 7,3 (90,1% do completo) | 0 / 0 |
| mago | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 8 (98,9% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 7,4 (100,5% do completo) | 0 / 0 |
| arqueiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 7,2 (97% do completo) | 0 / 0 |
| arqueiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 7,4 (99,7% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 7,6 (102,1% do completo) | 0 / 0 |
| necromante | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 5,9 (79% do completo) | 0 / 0 |
| necromante | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 7,3 (97,9% do completo) | 0 / 0 |

## nível 10 · normal · duelo

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 3,3 s | — | 1 | 341 | 25,9 | 0 | 10 | 0 |
| guerreiro | 8 s | — | 1 | 341 | 63,8 | 46,4 | 10 | 4,5 |
| mago | 4 s | — | 1 | 341 | 35,9 | 0 | 12 | 0 |
| arqueiro | 8,1 s | — | 1 | 341 | 26,3 | 0 | 10 | 0 |
| necromante | 8,9 s | — | 1 | 341 | 18,9 | 0 | 8,5 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 0 / 0 / 0 / 0 | 341 / 0 / 0 | 0 | 0 | 3,5 / 1,8 / 0 / 0 / 0 | 2,2 |
| guerreiro | 0 / 46,4 / 0 / 0 | 331,4 / 9,6 / 0 | 0 | 0 | 3,9 / 0,7 / 0 / 0 / 0 | 0,3 |
| mago | 0 / 0 / 0 / 0 | 321,8 / 19,3 / 0 | 0 | 0 | 4,4 / 0,6 / 0 / 0 / 0,2 | 2,9 |
| arqueiro | 0 / 0 / 0 / 0 | 334,6 / 6,4 / 0 | 0 | 0 | 5 / 0,7 / 0 / 0 / 2,9 | 2,5 |
| necromante | 0 / 0 / 0 / 0 | 193 / 0 / 148 | 0 | 0 | 3,5 / 1 / 0 / 0 / 0 | 2,7 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 4,6 / 0,1 | 4,5 / 0,6 / 1,8 | 0 / 0 | — | 0 / 1,9 |
| guerreiro | 7,9 / 0,5 | 4,4 / 0,5 / 1,8 | 0 / 0 | — | 0 / 2,9 |
| mago | 6 / 1 | 4 / 0,9 / 1,1 | 0,1 / 0 | — | 0 / 2,5 |
| arqueiro | 7,9 / 0 | 6,9 / 1,4 / 2,4 | 0 / 0 | — | 0 / 3,5 |
| necromante | 9 / 0,8 | 12,1 / 2,6 / 4,9 | 0,9 / 0 | — | 0 / 4 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 2 | 155,5 | 0 | 4 | 0 | — |
| aventureiro | explosao | 1 | 106,8 | 0 | 3 | 0 | — |
| aventureiro | golpe_atordoante | 1 | 70,4 | 0 | 3 | 0 | — |
| aventureiro | ataque_basico | 0,6 | 8,4 | 0 | 0 | 0 | — |
| guerreiro | investida | 1,5 | 114 | 0 | 6 | 0 | — |
| guerreiro | redemoinho | 1,5 | 0 | 0 | 0 | 4,5 | — |
| guerreiro | grito_de_guerra | 1 | 0 | 0 | 4 | 0 | — |
| guerreiro | ataque_basico | 3,9 | 217,4 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 46,4 | 0 | 0 | — |
| guerreiro | efeito:dano_direto | 0 | 9,6 | 0 | 0 | 0 | — |
| mago | bola_de_fogo | 1 | 125,1 | 0 | 3 | 0 | — |
| mago | dardo_arcano | 3 | 63,8 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 1 | 19,3 | 0 | 4 | 0 | — |
| mago | raio_em_cadeia | 1 | 113,6 | 0 | 5 | 0 | — |
| mago | efeito:queimando | 0 | 19,3 | 0 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 1 | 0 | 0 | 4 | 0 | — |
| arqueiro | chuva_de_flechas | 1 | 70,6 | 0 | 3 | 0 | — |
| arqueiro | flecha_venenosa | 1 | 55,8 | 0 | 3 | 0 | — |
| arqueiro | tiro | 4,9 | 208,3 | 0 | 0 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 6,4 | 0 | 0 | 0 | — |
| necromante | dardo_funesto | 2,9 | 84,9 | 0 | 5,8 | 0 | — |
| necromante | garras_do_ossuario | 1,4 | 40,6 | 0 | 2,8 | 0 | — |
| necromante | toque_funesto | 4,8 | 67,5 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 148 | 0 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 167,1% do DPS efetivo de guerreiro. Por encontro, recebeu 25,9 contra 63,8 HP de dano; recuperou 0 contra 46,4 HP (0 contra 0 de poções), gastando 10 contra 10 mana total e 0 contra 4,5 HP em conjurações. Começou com 181 contra 182 HP e defesa 2 contra 3. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 0 p.p. e de HP final -2,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 28,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 148,3% do DPS efetivo de mago. Por encontro, recebeu 25,9 contra 35,9 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 10 contra 12 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 184 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 5,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 22,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 211,2% do DPS efetivo de arqueiro. Por encontro, recebeu 25,9 contra 26,3 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 10 contra 10 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 176 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 13,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 229,8% do DPS efetivo de necromante. Por encontro, recebeu 25,9 contra 18,9 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 10 contra 8,5 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 161 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 148 de dano e receberam 0 contra 28,8. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -2,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 15,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 88,7% do DPS efetivo de mago. Por encontro, recebeu 63,8 contra 35,9 HP de dano; recuperou 46,4 contra 0 HP (0 contra 0 de poções), gastando 10 contra 12 mana total e 4,5 contra 0 HP em conjurações. Começou com 182 contra 184 HP e defesa 3 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 7,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -6,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 126,4% do DPS efetivo de arqueiro. Por encontro, recebeu 63,8 contra 26,3 HP de dano; recuperou 46,4 contra 0 HP (0 contra 0 de poções), gastando 10 contra 10 mana total e 4,5 contra 0 HP em conjurações. Começou com 182 contra 176 HP e defesa 3 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 2,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -15,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 137,6% do DPS efetivo de necromante. Por encontro, recebeu 63,8 contra 18,9 HP de dano; recuperou 46,4 contra 0 HP (0 contra 0 de poções), gastando 10 contra 8,5 mana total e 4,5 contra 0 HP em conjurações. Começou com 182 contra 161 HP e defesa 3 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 148 de dano e receberam 0 contra 28,8. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -0,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -13,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 142,4% do DPS efetivo de arqueiro. Por encontro, recebeu 35,9 contra 26,3 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 12 contra 10 mana total e 0 contra 0 HP em conjurações. Começou com 184 contra 176 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final -4,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -8,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 155% do DPS efetivo de necromante. Por encontro, recebeu 35,9 contra 18,9 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 12 contra 8,5 mana total e 0 contra 0 HP em conjurações. Começou com 184 contra 161 HP e defesa 1 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 148 de dano e receberam 0 contra 28,8. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -7,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -6,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**arqueiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. arqueiro manteve 108,8% do DPS efetivo de necromante. Por encontro, recebeu 26,3 contra 18,9 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 10 contra 8,5 mana total e 0 contra 0 HP em conjurações. Começou com 176 contra 161 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 148 de dano e receberam 0 contra 28,8. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -3,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 2,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### O que mudou ao retirar cada fator

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 89,8 (100% do completo) | 0 / 0 |
| aventureiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | 27,9 | 32,4 (36,1% do completo) | 0 / 0 |
| aventureiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 1 | 89,8 (100% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 8/8; 0; 0 | 0 | 6 | 53,7 (100% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 53,7 (100% do completo) | 0 / 0 |
| guerreiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | -0,6 | 40,3 (74,9% do completo) | 0 / 0 |
| guerreiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 1,9 | 53,7 (100% do completo) | 0 / 0 |
| mago | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 60,6 (100% do completo) | 0 / 0 |
| mago | Sem habilidades da barra | 8/8; 0; 0 | 0 | 5,8 | 35 (57,8% do completo) | 0 / 0 |
| mago | Defesa plana zerada | 8/8; 0; 0 | 0 | 0,6 | 60,6 (100% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 42,5 (100% do completo) | 0 / 0 |
| arqueiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | 14,6 | 38,3 (90,1% do completo) | 0 / 0 |
| arqueiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 1,1 | 42,5 (100% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 39,1 (100% do completo) | 0 / 0 |
| necromante | Sem habilidades da barra | 8/8; 0; 0 | 0 | 12,6 | 29,8 (76,3% do completo) | 0 / 0 |
| necromante | Defesa plana zerada | 8/8; 0; 0 | 0 | 0,3 | 39,1 (100% do completo) | 0 / 0 |

## nível 10 · normal · pressao

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 20,8 s | — | 1 | 981 | 161,6 | 77,8 | 21,3 | 0 |
| guerreiro | 21,3 s | — | 1 | 981 | 171 | 146,9 | 19,9 | 10,5 |
| mago | 12,3 s | — | 1 | 981 | 106,4 | 46,3 | 14,8 | 0 |
| arqueiro | 18,8 s | 19,2 s | 0,9 | 954,1 | 218,3 | 122,5 | 17,6 | 0 |
| necromante | 22,6 s | 19,4 s | 0,4 | 758,9 | 265,4 | 126,8 | 11,8 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 2,8 / 3 / 72 / 0 | 981 / 0 / 0 | 0 | 0 | 10,8 / 10,8 / 0 / 0 / 6,8 | 2 |
| guerreiro | 0 / 137,8 / 9,1 / 0 | 921,4 / 59,6 / 0 | 3,3 | 0 | 8,9 / 7,7 / 0 / 0 / 0 | 1,6 |
| mago | 0 / 0 / 46,3 / 0 | 925,9 / 55,1 / 0 | 0 | 0 | 7,6 / 1,8 / 0 / 0 / 1,7 | 2,6 |
| arqueiro | 0 / 0 / 122,5 / 0 | 942,1 / 12 / 0 | 0 | 0 | 11 / 0,8 / 0 / 0,4 / 7,9 | 2,8 |
| necromante | 0 / 6,8 / 120 / 0 | 390,1 / 0 / 368,8 | 0 | 6,8 | 7,5 / 2,4 / 0 / 3,2 / 0 | 2,3 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 19,1 / 2,5 | 14,6 / 2,6 / 5 | 0 / 0 | — | 8,8 / 11,9 |
| guerreiro | 18,4 / 2,3 | 11,4 / 2,4 / 4,4 | 0 / 0 | — | 13,8 / 12,3 |
| mago | 10,5 / 1,5 | 11,9 / 2,6 / 3,9 | 1 / 0 | — | 0 / 5,8 |
| arqueiro | 18,5 / 0,8 | 17,6 / 2,4 / 7,1 | 0 / 0 | — | 0 / 9 |
| necromante | 17,9 / 0,8 | 25,3 / 4,3 / 9,9 | 0,9 / 0 | — | 4 / 8,6 |

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
| guerreiro | investida | 3,4 | 215,9 | 0 | 13,5 | 0 | — |
| guerreiro | redemoinho | 3,5 | 312 | 0 | 0 | 10,5 | — |
| guerreiro | efeito:dano_direto | 0 | 59,6 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 137,8 | 0 | 0 | — |
| guerreiro | grito_de_guerra | 1,5 | 0 | 0 | 6 | 0 | — |
| guerreiro | ataque_basico | 9,9 | 393,5 | 0 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 0,1 | 0 | 0 | 0,4 | 0 | — |
| guerreiro | item:pocao_vida | 0,1 | 0 | 9,1 | 0 | 0 | — |
| mago | bola_de_fogo | 1,8 | 373,9 | 0 | 5,3 | 0 | — |
| mago | dardo_arcano | 6,6 | 160,5 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 1,1 | 122,9 | 0 | 4,5 | 0 | — |
| mago | raio_em_cadeia | 1 | 268,6 | 0 | 5 | 0 | — |
| mago | efeito:queimando | 0 | 55,1 | 0 | 0 | 0 | — |
| mago | item:pocao_vida | 0,6 | 0 | 46,3 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 2,3 | 116,6 | 0 | 9 | 0 | — |
| arqueiro | chuva_de_flechas | 1,8 | 236,5 | 0 | 5,3 | 0 | — |
| arqueiro | flecha_venenosa | 1,1 | 6,5 | 0 | 3,4 | 0 | — |
| arqueiro | tiro | 13,4 | 582,5 | 0 | 0 | 0 | — |
| arqueiro | efeito:dano_direto | 0 | 12 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 1,8 | 0 | 122,5 | 0 | 0 | — |
| necromante | dardo_funesto | 3,8 | 99,1 | 0 | 7,5 | 0 | — |
| necromante | garras_do_ossuario | 1,5 | 49,5 | 0 | 3 | 0 | — |
| necromante | toque_funesto | 12 | 241,5 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 368,8 | 0 | 0 | 0 | — |
| necromante | efeito:cura | 0 | 0 | 6,8 | 0 | 0 | — |
| necromante | item:pocao_vida | 1,9 | 0 | 120 | 0 | 0 | — |
| necromante | dizimo_vital | 0,4 | 0 | 0 | 0,8 | 0 | — |
| necromante | comando_sepulcral | 0,3 | 0 | 0 | 0,5 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 95,2% do DPS efetivo de guerreiro. Por encontro, recebeu 161,6 contra 171 HP de dano; recuperou 77,8 contra 146,9 HP (72 contra 9,1 de poções), gastando 21,3 contra 19,9 mana total e 0 contra 10,5 HP em conjurações. Começou com 181 contra 182 HP e defesa 2 contra 3. Escudos absorveram 0 contra 3,3; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 0 p.p. e de HP final -30 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -37,5 p.p.; contraste de 37,5 p.p. e alteração de 55,6 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 63,1% do DPS efetivo de mago. Por encontro, recebeu 161,6 contra 106,4 HP de dano; recuperou 77,8 contra 46,3 HP (72 contra 46,3 de poções), gastando 21,3 contra 14,8 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 184 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final -8,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 50 p.p.; contraste de -50 p.p. e alteração de -14,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × arqueiro:** 0/8 mortes contra 1/8; 0 contra 0 limites de tempo. aventureiro manteve 101,6% do DPS efetivo de arqueiro. Por encontro, recebeu 161,6 contra 218,3 HP de dano; recuperou 77,8 contra 122,5 HP (72 contra 122,5 de poções), gastando 21,3 contra 17,6 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 176 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 12,5 p.p. e de HP final 12,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para 75 p.p.; contraste de -62,5 p.p. e alteração de -6,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × necromante:** 0/8 mortes contra 5/8; 0 contra 0 limites de tempo. aventureiro manteve 149,5% do DPS efetivo de necromante. Por encontro, recebeu 161,6 contra 265,4 HP de dano; recuperou 77,8 contra 126,8 HP (72 contra 120 de poções), gastando 21,3 contra 11,8 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 161 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 368,8 de dano e receberam 0 contra 74,4. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 5 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 62,5 p.p. e de HP final 42,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 62,5 para 37,5 p.p.; contraste de 25 p.p. e alteração de 46,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 66,4% do DPS efetivo de mago. Por encontro, recebeu 171 contra 106,4 HP de dano; recuperou 146,9 contra 46,3 HP (9,1 contra 46,3 de poções), gastando 19,9 contra 14,8 mana total e 10,5 contra 0 HP em conjurações. Começou com 182 contra 184 HP e defesa 3 contra 1. Escudos absorveram 3,3 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 21,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 87,5 p.p.; contraste de -87,5 p.p. e alteração de -70,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 0/8 mortes contra 1/8; 0 contra 0 limites de tempo. guerreiro manteve 106,8% do DPS efetivo de arqueiro. Por encontro, recebeu 171 contra 218,3 HP de dano; recuperou 146,9 contra 122,5 HP (9,1 contra 122,5 de poções), gastando 19,9 contra 17,6 mana total e 10,5 contra 0 HP em conjurações. Começou com 182 contra 176 HP e defesa 3 contra 2. Escudos absorveram 3,3 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 12,5 p.p. e de HP final 42,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para 87,5 p.p.; contraste de -75 p.p. e alteração de -43,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: guerreiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × necromante:** 0/8 mortes contra 5/8; 0 contra 0 limites de tempo. guerreiro manteve 157,2% do DPS efetivo de necromante. Por encontro, recebeu 171 contra 265,4 HP de dano; recuperou 146,9 contra 126,8 HP (9,1 contra 120 de poções), gastando 19,9 contra 11,8 mana total e 10,5 contra 0 HP em conjurações. Começou com 182 contra 161 HP e defesa 3 contra 1. Escudos absorveram 3,3 contra 0; invocações causaram 0 contra 368,8 de dano e receberam 0 contra 74,4. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 5 sementes só guerreiro venceu, 0 só necromante venceu; diferença de vitória 62,5 p.p. e de HP final 72,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 62,5 para 87,5 p.p.; contraste de -25 p.p. e alteração de -13 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: guerreiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × arqueiro:** 0/8 mortes contra 1/8; 0 contra 0 limites de tempo. mago manteve 160,9% do DPS efetivo de arqueiro. Por encontro, recebeu 106,4 contra 218,3 HP de dano; recuperou 46,3 contra 122,5 HP (46,3 contra 122,5 de poções), gastando 14,8 contra 17,6 mana total e 0 contra 0 HP em conjurações. Começou com 184 contra 176 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 12,5 p.p. e de HP final 21,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para 87,5 p.p.; contraste de -75 p.p. e alteração de -19 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: mago venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × necromante:** 0/8 mortes contra 5/8; 0 contra 0 limites de tempo. mago manteve 236,8% do DPS efetivo de necromante. Por encontro, recebeu 106,4 contra 265,4 HP de dano; recuperou 46,3 contra 126,8 HP (46,3 contra 120 de poções), gastando 14,8 contra 11,8 mana total e 0 contra 0 HP em conjurações. Começou com 184 contra 161 HP e defesa 1 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 368,8 de dano e receberam 0 contra 74,4. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 5 sementes só mago venceu, 0 só necromante venceu; diferença de vitória 62,5 p.p. e de HP final 50,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 62,5 para -12,5 p.p.; contraste de 75 p.p. e alteração de 61,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: mago venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**arqueiro × necromante:** 1/8 mortes contra 5/8; 0 contra 0 limites de tempo. arqueiro manteve 147,2% do DPS efetivo de necromante. Por encontro, recebeu 218,3 contra 265,4 HP de dano; recuperou 122,5 contra 126,8 HP (122,5 contra 120 de poções), gastando 17,6 contra 11,8 mana total e 0 contra 0 HP em conjurações. Começou com 176 contra 161 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 368,8 de dano e receberam 0 contra 74,4. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 5 sementes só arqueiro venceu, 1 só necromante venceu; diferença de vitória 50 p.p. e de HP final 29,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 50 para 0 p.p.; contraste de 50 p.p. e alteração de 30,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: arqueiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

### O que mudou ao retirar cada fator

**aventureiro, Sem poções de vida:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 37,4 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**aventureiro, Sem habilidades da barra:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 50,1 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem habilidades da barra:** retirar esse fator perdeu 7 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 64,9 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem poções de vida:** retirar esse fator perdeu 6 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 44,1 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem habilidades da barra:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 28,5 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem poções de vida:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 13,4 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem habilidades da barra:** retirar esse fator perdeu 3 vitórias e ganhou 2 nas mesmas 8 condições iniciais. O kit completo teve 3,6 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 7/8; 1; 0 | 12,5 | 37,4 | 50,2 (98,9% do completo) | 1 / 0 |
| aventureiro | Sem habilidades da barra | 5/8; 3; 0 | 37,5 | 50,1 | 29,8 (58,6% do completo) | 3 / 0 |
| aventureiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 1 | 50,8 (100% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 8/8; 0; 0 | 0 | 0,5 | 57,1 (107% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 8/8; 0; 0 | 0 | 0,3 | 53,3 (100% do completo) | 0 / 0 |
| guerreiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | -5,6 | 38,2 (71,7% do completo) | 0 / 0 |
| guerreiro | Defesa plana zerada | 8/8; 0; 0 | 0 | -3,6 | 57,1 (107% do completo) | 0 / 0 |
| mago | Sem poções de vida | 8/8; 0; 0 | 0 | 25,1 | 79,2 (98,5% do completo) | 0 / 0 |
| mago | Sem habilidades da barra | 1/8; 7; 0 | 87,5 | 64,9 | 32,9 (40,9% do completo) | 7 / 0 |
| mago | Defesa plana zerada | 8/8; 0; 0 | 0 | 1,8 | 80,4 (100% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 1/8; 7; 0 | 75 | 44,1 | 51,4 (102,8% do completo) | 6 / 0 |
| arqueiro | Sem habilidades da barra | 4/8; 4; 0 | 37,5 | 28,5 | 37,1 (74,3% do completo) | 3 / 0 |
| arqueiro | Defesa plana zerada | 7/8; 1; 0 | 0 | 2 | 49,9 (100% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 1/8; 7; 0 | 25 | 13,4 | 33,6 (99,1% do completo) | 2 / 0 |
| necromante | Sem habilidades da barra | 2/8; 6; 0 | 12,5 | 3,6 | 27,1 (79,9% do completo) | 3 / 2 |
| necromante | Defesa plana zerada | 3/8; 5; 0 | 0 | -2,2 | 32,3 (95,1% do completo) | 0 / 0 |

## nível 10 · normal · atrito

### Onde o desgaste aparece

| Classe | Onda | Chegaram/n inicial | Mortes / limites nesta onda | HP entrada → saída | Mana entrada → saída | Recebido / cura / mana gasta |
|---|---|---|---|---|---|---|
| aventureiro | 1 | 8/8 | 0 / 0 | 181 → 154,3 | 10 → 1,4 | 26,8 / 0 / 11 |
| aventureiro | 2 | 8/8 | 0 / 0 | 154,3 → 115,1 | 1,4 → 1,1 | 52,9 / 9 / 5,6 |
| aventureiro | 3 | 8/8 | 0 / 0 | 115,1 → 118,1 | 1,1 → 0,8 | 27,8 / 23,3 / 5,8 |
| aventureiro | 4 | 8/8 | 0 / 0 | 118,1 → 109,8 | 0,8 → 0,7 | 44,6 / 31,8 / 4,8 |
| aventureiro | 5 | 8/8 | 0 / 0 | 109,8 → 101,1 | 0,7 → 0,5 | 63,6 / 50,8 / 4,6 |
| guerreiro | 1 | 8/8 | 0 / 0 | 182 → 166,3 | 10 → 3 | 49,5 / 37,5 / 9 |
| guerreiro | 2 | 8/8 | 0 / 0 | 166,3 → 157,8 | 3 → 3 | 56,8 / 47,1 / 6,9 |
| guerreiro | 3 | 8/8 | 0 / 0 | 157,8 → 164,1 | 3 → 2,8 | 29,8 / 34,3 / 5,9 |
| guerreiro | 4 | 8/8 | 0 / 0 | 164,1 → 163,3 | 2,8 → 2,5 | 41 / 38,9 / 4 |
| guerreiro | 5 | 8/8 | 0 / 0 | 163,3 → 167,1 | 2,5 → 1,9 | 50,4 / 53,5 / 4,5 |
| mago | 1 | 8/8 | 0 / 0 | 184 → 151,1 | 12 → 2,4 | 32,9 / 0 / 12 |
| mago | 2 | 8/8 | 0 / 0 | 151,1 → 102,8 | 2,4 → 6,1 | 67,6 / 18,5 / 1,5 |
| mago | 3 | 8/8 | 0 / 0 | 102,8 → 104,6 | 6,1 → 2,7 | 35,1 / 37 / 7,1 |
| mago | 4 | 8/8 | 0 / 0 | 104,6 → 87,5 | 2,7 → 4,7 | 27,9 / 9,3 / 2,6 |
| mago | 5 | 8/8 | 1 / 0 | 87,5 → 81,3 | 4,7 → 4,8 | 43,5 / 37 / 3,6 |
| arqueiro | 1 | 8/8 | 0 / 0 | 176 → 164,3 | 10 → 3 | 11,8 / 0 / 10 |
| arqueiro | 2 | 8/8 | 0 / 0 | 164,3 → 114,3 | 3 → 4,8 | 67,5 / 17,5 / 2,5 |
| arqueiro | 3 | 8/8 | 0 / 0 | 114,3 → 93,1 | 4,8 → 1,8 | 38,6 / 17,5 / 6,3 |
| arqueiro | 4 | 8/8 | 0 / 0 | 93,1 → 103,6 | 1,8 → 2,9 | 34,5 / 43,8 / 3 |
| arqueiro | 5 | 8/8 | 0 / 0 | 103,6 → 62,3 | 2,9 → 3,9 | 67,6 / 26,3 / 2,5 |
| necromante | 1 | 8/8 | 0 / 0 | 161 → 151,8 | 12 → 7,6 | 9,3 / 0 / 7,8 |
| necromante | 2 | 8/8 | 0 / 0 | 151,8 → 151,8 | 7,6 → 4,3 | 0 / 0 / 6,3 |
| necromante | 3 | 8/8 | 0 / 0 | 151,8 → 152,8 | 4,3 → 1,9 | 0 / 0 / 5,5 |
| necromante | 4 | 8/8 | 0 / 0 | 152,8 → 148,3 | 1,9 → 2,1 | 6,3 / 0 / 3 |
| necromante | 5 | 8/8 | 0 / 0 | 148,3 → 145 | 2,1 → 1,2 | 3,3 / 0 / 3 |

Médias de cada onda incluem apenas quem chegou a ela; o denominador inicial mostra a seleção dos sobreviventes. Não compare a vida da onda 5 como se incluísse quem morreu antes.

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 32,8 s | — | 5 | 1.639 | 215,6 | 114,8 | 31,8 | 0 |
| guerreiro | 33,5 s | — | 5 | 1.639 | 227,4 | 211,3 | 30,3 | 17,6 |
| mago | 35,8 s | 37,4 s | 4,9 | 1.625,3 | 207 | 101,8 | 26,9 | 0 |
| arqueiro | 38,4 s | — | 5 | 1.639 | 220 | 105 | 24,3 | 0 |
| necromante | 25,6 s | — | 5 | 1.639 | 18,8 | 0 | 25,5 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 7,1 / 8,6 / 99 / 0 | 1.639 / 0 / 0 | 0 | 0 | 17,4 / 12,5 / 0 / 0 / 12,9 | 1,4 |
| guerreiro | 0 / 211,3 / 0 / 0 | 1.573,1 / 65,9 / 0 | 6,5 | 0 | 16 / 9,6 / 0 / 0 / 1,1 | 1 |
| mago | 0 / 0 / 101,8 / 0 | 1.554,4 / 70,9 / 0 | 16,5 | 0 | 21,3 / 3,8 / 0 / 1,3 / 10 | 2,6 |
| arqueiro | 0 / 0 / 105 / 0 | 1.629,8 / 9,3 / 0 | 0 | 0 | 19,9 / 2,4 / 0 / 1,1 / 15,4 | 2,5 |
| necromante | 0 / 0 / 0 / 0 | 562,1 / 0 / 1.076,9 | 0 | 0 | 10,5 / 3 / 0 / 0 / 2,7 | 3 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 31,6 / 4,4 | 24,8 / 3,8 / 9,4 | 0 / 0 | — | 21 / 22,3 |
| guerreiro | 33,5 / 4,8 | 19,1 / 3 / 7,1 | 0,3 / 0 | — | 18,9 / 22,2 |
| mago | 29,4 / 3 | 24,3 / 4 / 8,5 | 0 / 0 | — | 2,5 / 19,6 |
| arqueiro | 33,8 / 1,3 | 31,5 / 4,3 / 13 | 0 / 0 | — | 1,3 / 18,2 |
| necromante | 26,9 / 2,6 | 53,1 / 11 / 19,3 | 1,3 / 0 | — | 2,8 / 14,7 |

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
| guerreiro | investida | 5 | 304,1 | 0 | 20 | 0 | — |
| guerreiro | redemoinho | 5,9 | 201,6 | 0 | 0 | 17,6 | — |
| guerreiro | grito_de_guerra | 2,4 | 0 | 0 | 9,5 | 0 | — |
| guerreiro | ataque_basico | 20 | 1.067,4 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 211,3 | 0 | 0 | — |
| guerreiro | efeito:dano_direto | 0 | 65,9 | 0 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 0,3 | 0 | 0 | 0,8 | 0 | — |
| mago | bola_de_fogo | 4,1 | 568,3 | 0 | 12,4 | 0 | — |
| mago | dardo_arcano | 21,8 | 836,3 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 2 | 42,1 | 0 | 8 | 0 | — |
| mago | raio_em_cadeia | 1 | 107,8 | 0 | 5 | 0 | — |
| mago | efeito:queimando | 0 | 70,9 | 0 | 0 | 0 | — |
| mago | item:pocao_vida | 1,4 | 0 | 101,8 | 0 | 0 | — |
| mago | barreira | 0,5 | 0 | 0 | 1,5 | 0 | — |
| arqueiro | flecha_perfurante | 2,1 | 111,3 | 0 | 8,5 | 0 | — |
| arqueiro | chuva_de_flechas | 3,1 | 245,5 | 0 | 9,4 | 0 | — |
| arqueiro | flecha_venenosa | 2,1 | 97,8 | 0 | 6,4 | 0 | — |
| arqueiro | tiro | 26,4 | 1.175,3 | 0 | 0 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 9,3 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 1,5 | 0 | 105 | 0 | 0 | — |
| necromante | dardo_funesto | 9 | 236,5 | 0 | 18 | 0 | — |
| necromante | garras_do_ossuario | 3,8 | 126,6 | 0 | 7,5 | 0 | — |
| necromante | toque_funesto | 14,1 | 199 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 1.076,9 | 0 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 101,3% do DPS efetivo de guerreiro. Por encontro, recebeu 215,6 contra 227,4 HP de dano; recuperou 114,8 contra 211,3 HP (99 contra 0 de poções), gastando 31,8 contra 30,3 mana total e 0 contra 17,6 HP em conjurações. Começou com 181 contra 182 HP e defesa 2 contra 3. Escudos absorveram 0 contra 6,5; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 0 p.p. e de HP final -36 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -100 p.p.; contraste de 100 p.p. e alteração de 64 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × mago:** 0/8 mortes contra 1/8; 0 contra 0 limites de tempo. aventureiro manteve 112,2% do DPS efetivo de mago. Por encontro, recebeu 215,6 contra 207 HP de dano; recuperou 114,8 contra 101,8 HP (99 contra 101,8 de poções), gastando 31,8 contra 26,9 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 184 HP e defesa 2 contra 1. Escudos absorveram 0 contra 16,5; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 12,5 p.p. e de HP final 11,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para -75 p.p.; contraste de 87,5 p.p. e alteração de 33,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 111,1% do DPS efetivo de arqueiro. Por encontro, recebeu 215,6 contra 220 HP de dano; recuperou 114,8 contra 105 HP (99 contra 105 de poções), gastando 31,8 contra 24,3 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 176 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 20,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 50 p.p.; contraste de -50 p.p. e alteração de 13,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 79% do DPS efetivo de necromante. Por encontro, recebeu 215,6 contra 18,8 HP de dano; recuperou 114,8 contra 0 HP (99 contra 0 de poções), gastando 31,8 contra 25,5 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 161 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 1.076,9 de dano e receberam 0 contra 118,8. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -34,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -100 p.p.; contraste de 100 p.p. e alteração de 44,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × mago:** 0/8 mortes contra 1/8; 0 contra 0 limites de tempo. guerreiro manteve 110,8% do DPS efetivo de mago. Por encontro, recebeu 227,4 contra 207 HP de dano; recuperou 211,3 contra 101,8 HP (0 contra 101,8 de poções), gastando 30,3 contra 26,9 mana total e 17,6 contra 0 HP em conjurações. Começou com 182 contra 184 HP e defesa 3 contra 1. Escudos absorveram 6,5 contra 16,5; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 12,5 p.p. e de HP final 47,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para 50 p.p.; contraste de -37,5 p.p. e alteração de -36,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: guerreiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 109,6% do DPS efetivo de arqueiro. Por encontro, recebeu 227,4 contra 220 HP de dano; recuperou 211,3 contra 105 HP (0 contra 105 de poções), gastando 30,3 contra 24,3 mana total e 17,6 contra 0 HP em conjurações. Começou com 182 contra 176 HP e defesa 3 contra 2. Escudos absorveram 6,5 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 56,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 87,5 p.p.; contraste de -87,5 p.p. e alteração de -34 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 77,9% do DPS efetivo de necromante. Por encontro, recebeu 227,4 contra 18,8 HP de dano; recuperou 211,3 contra 0 HP (0 contra 0 de poções), gastando 30,3 contra 25,5 mana total e 17,6 contra 0 HP em conjurações. Começou com 182 contra 161 HP e defesa 3 contra 1. Escudos absorveram 6,5 contra 0; invocações causaram 0 contra 1.076,9 de dano e receberam 0 contra 118,8. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final 1,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -19,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × arqueiro:** 1/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 99% do DPS efetivo de arqueiro. Por encontro, recebeu 207 contra 220 HP de dano; recuperou 101,8 contra 105 HP (101,8 contra 105 de poções), gastando 26,9 contra 24,3 mana total e 0 contra 0 HP em conjurações. Começou com 184 contra 176 HP e defesa 1 contra 2. Escudos absorveram 16,5 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 1 só arqueiro venceu; diferença de vitória -12,5 p.p. e de HP final 8,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para 37,5 p.p.; contraste de -50 p.p. e alteração de 2,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: arqueiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × necromante:** 1/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 70,4% do DPS efetivo de necromante. Por encontro, recebeu 207 contra 18,8 HP de dano; recuperou 101,8 contra 0 HP (101,8 contra 0 de poções), gastando 26,9 contra 25,5 mana total e 0 contra 0 HP em conjurações. Começou com 184 contra 161 HP e defesa 1 contra 1. Escudos absorveram 16,5 contra 0; invocações causaram 0 contra 1.076,9 de dano e receberam 0 contra 118,8. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 1 só necromante venceu; diferença de vitória -12,5 p.p. e de HP final -45,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para -50 p.p.; contraste de 37,5 p.p. e alteração de 36,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**arqueiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. arqueiro manteve 71,1% do DPS efetivo de necromante. Por encontro, recebeu 220 contra 18,8 HP de dano; recuperou 105 contra 0 HP (105 contra 0 de poções), gastando 24,3 contra 25,5 mana total e 0 contra 0 HP em conjurações. Começou com 176 contra 161 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 1.076,9 de dano e receberam 0 contra 118,8. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -54,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -87,5 p.p.; contraste de 87,5 p.p. e alteração de 34 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### O que mudou ao retirar cada fator

**aventureiro, Sem poções de vida:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 47,2 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**aventureiro, Sem habilidades da barra:** retirar esse fator perdeu 8 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 55,9 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem poções de vida:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 36,8 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem habilidades da barra:** retirar esse fator perdeu 2 vitórias e ganhou 1 nas mesmas 8 condições iniciais. O kit completo teve 22,4 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem poções de vida:** retirar esse fator perdeu 7 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 34 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem habilidades da barra:** retirar esse fator perdeu 5 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 21,2 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Defesa plana zerada:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve -7,2 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 5/8; 3; 0 | 37,5 | 47,2 | 50,4 (101,2% do completo) | 3 / 0 |
| aventureiro | Sem habilidades da barra | 0/8; 8; 0 | 100 | 55,9 | 29,7 (59,6% do completo) | 8 / 0 |
| aventureiro | Defesa plana zerada | 8/8; 0; 0 | 0 | -0,4 | 51,1 (102,7% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 8/8; 0; 0 | 0 | 8,4 | 45 (91,6% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 49,2 (100% do completo) | 0 / 0 |
| guerreiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | -8,2 | 39,2 (79,7% do completo) | 0 / 0 |
| guerreiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 2,1 | 47,9 (97,4% do completo) | 0 / 0 |
| mago | Sem poções de vida | 4/8; 4; 0 | 37,5 | 36,8 | 43,5 (98% do completo) | 3 / 0 |
| mago | Sem habilidades da barra | 6/8; 2; 0 | 12,5 | 22,4 | 35,7 (80,4% do completo) | 2 / 1 |
| mago | Defesa plana zerada | 7/8; 1; 0 | 0 | -5,6 | 44,3 (99,7% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 1/8; 7; 0 | 87,5 | 34 | 45,3 (101,1% do completo) | 7 / 0 |
| arqueiro | Sem habilidades da barra | 3/8; 5; 0 | 62,5 | 21,2 | 38,7 (86,3% do completo) | 5 / 0 |
| arqueiro | Defesa plana zerada | 7/8; 1; 0 | 12,5 | -7,2 | 44,7 (99,7% do completo) | 1 / 0 |
| necromante | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 63,1 (100% do completo) | 0 / 0 |
| necromante | Sem habilidades da barra | 8/8; 0; 0 | 0 | 11,2 | 36,4 (57,7% do completo) | 0 / 0 |
| necromante | Defesa plana zerada | 8/8; 0; 0 | 0 | 0,4 | 63,1 (100% do completo) | 0 / 0 |

## nível 10 · normal · chefe

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 11,3 s | — | 1 | 606 | 51 | 0 | 14,3 | 0 |
| guerreiro | 8 s | — | 1 | 606 | 39,4 | 35,5 | 11,5 | 6 |
| mago | 12,1 s | — | 1 | 606 | 18,8 | 0 | 14,6 | 0 |
| arqueiro | 12,7 s | — | 1 | 606 | 34,8 | 0 | 14,9 | 0 |
| necromante | 14,8 s | — | 1 | 630 | 22,3 | 0 | 13,8 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 0 / 0 / 0 / 0 | 606 / 0 / 0 | 0 | 0 | 6,4 / 3,9 / 0,9 / 0 / 1,9 | 1,5 |
| guerreiro | 0 / 35,5 / 0 / 0 | 584,9 / 21,1 / 0 | 0 | 0 | 4,7 / 1,6 / 0,8 / 0 / 0 | 0,8 |
| mago | 0 / 0 / 0 / 0 | 599,5 / 6,5 / 0 | 0 | 0 | 7,5 / 5,5 / 0,4 / 0 / 1,6 | 2,1 |
| arqueiro | 0 / 0 / 0 / 0 | 593,5 / 12,5 / 0 | 0 | 0 | 7,6 / 4,4 / 0,5 / 0 / 3,9 | 2,4 |
| necromante | 0 / 0 / 0 / 0 | 384,4 / 0 / 245,6 | 0 | 0 | 6,3 / 5 / 0,2 / 0 / 0 | 2,4 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 11 / 2,6 | 8,4 / 1,6 / 2,9 | 0 / 0 | — | 0 / 5,1 |
| guerreiro | 10,1 / 1,8 | 6,4 / 0,8 / 2,3 | 0 / 0 | — | 0 / 3,9 |
| mago | 10,4 / 2 | 7,8 / 1 / 2,9 | 0,6 / 0 | — | 0 / 5,6 |
| arqueiro | 12,4 / 2,3 | 10,1 / 1,5 / 3,9 | 0 / 0,6 | — | 0 / 5,4 |
| necromante | 15,8 / 1,8 | 21,6 / 3,8 / 7 | 1,5 / 0 | — | 0,3 / 8,4 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 4,1 | 349,6 | 0 | 8,3 | 0 | — |
| aventureiro | explosao | 1 | 111 | 0 | 3 | 0 | — |
| aventureiro | golpe_atordoante | 1 | 36,9 | 0 | 3 | 0 | — |
| aventureiro | ataque_basico | 4,9 | 108,5 | 0 | 0 | 0 | — |
| guerreiro | investida | 1,9 | 193,5 | 0 | 7,5 | 0 | — |
| guerreiro | redemoinho | 2 | 133,9 | 0 | 0 | 6 | — |
| guerreiro | grito_de_guerra | 1 | 0 | 0 | 4 | 0 | — |
| guerreiro | ataque_basico | 5,3 | 257,5 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 35,5 | 0 | 0 | — |
| guerreiro | efeito:dano_direto | 0 | 21,1 | 0 | 0 | 0 | — |
| mago | bola_de_fogo | 1,9 | 69,3 | 0 | 5,6 | 0 | — |
| mago | dardo_arcano | 6,5 | 245 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 1 | 146,5 | 0 | 4 | 0 | — |
| mago | raio_em_cadeia | 1 | 138,8 | 0 | 5 | 0 | — |
| mago | efeito:queimando | 0 | 6,5 | 0 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 1 | 88 | 0 | 4 | 0 | — |
| arqueiro | chuva_de_flechas | 2 | 147,3 | 0 | 6 | 0 | — |
| arqueiro | tiro | 7,8 | 262,9 | 0 | 0 | 0 | — |
| arqueiro | flecha_venenosa | 1,6 | 95,4 | 0 | 4,9 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 12,5 | 0 | 0 | 0 | — |
| necromante | dardo_funesto | 4,8 | 144,4 | 0 | 9,5 | 0 | — |
| necromante | garras_do_ossuario | 2,1 | 91 | 0 | 4,3 | 0 | — |
| necromante | toque_funesto | 8,9 | 149 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 245,6 | 0 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 85,8% do DPS efetivo de guerreiro. Por encontro, recebeu 51 contra 39,4 HP de dano; recuperou 0 contra 35,5 HP (0 contra 0 de poções), gastando 14,3 contra 11,5 mana total e 0 contra 6 HP em conjurações. Começou com 181 contra 182 HP e defesa 2 contra 3. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 0 p.p. e de HP final -22,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 14,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 112,1% do DPS efetivo de mago. Por encontro, recebeu 51 contra 18,8 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 14,3 contra 14,6 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 184 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final -18 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 19,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 117% do DPS efetivo de arqueiro. Por encontro, recebeu 51 contra 34,8 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 14,3 contra 14,9 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 176 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final -8,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 26,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 150% do DPS efetivo de necromante. Por encontro, recebeu 51 contra 22,3 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 14,3 contra 13,8 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 161 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 245,6 de dano e receberam 0 contra 49,5. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -14,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 1,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 130,7% do DPS efetivo de mago. Por encontro, recebeu 39,4 contra 18,8 HP de dano; recuperou 35,5 contra 0 HP (0 contra 0 de poções), gastando 11,5 contra 14,6 mana total e 6 contra 0 HP em conjurações. Começou com 182 contra 184 HP e defesa 3 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 4,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 5,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 136,4% do DPS efetivo de arqueiro. Por encontro, recebeu 39,4 contra 34,8 HP de dano; recuperou 35,5 contra 0 HP (0 contra 0 de poções), gastando 11,5 contra 14,9 mana total e 6 contra 0 HP em conjurações. Começou com 182 contra 176 HP e defesa 3 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 14,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 12,6 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 174,8% do DPS efetivo de necromante. Por encontro, recebeu 39,4 contra 22,3 HP de dano; recuperou 35,5 contra 0 HP (0 contra 0 de poções), gastando 11,5 contra 13,8 mana total e 6 contra 0 HP em conjurações. Começou com 182 contra 161 HP e defesa 3 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 245,6 de dano e receberam 0 contra 49,5. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final 8,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -12,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 104,4% do DPS efetivo de arqueiro. Por encontro, recebeu 18,8 contra 34,8 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 14,6 contra 14,9 mana total e 0 contra 0 HP em conjurações. Começou com 184 contra 176 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 9,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 7,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 133,8% do DPS efetivo de necromante. Por encontro, recebeu 18,8 contra 22,3 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 14,6 contra 13,8 mana total e 0 contra 0 HP em conjurações. Começou com 184 contra 161 HP e defesa 1 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 245,6 de dano e receberam 0 contra 49,5. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final 3,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -18,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**arqueiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. arqueiro manteve 128,2% do DPS efetivo de necromante. Por encontro, recebeu 34,8 contra 22,3 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 14,9 contra 13,8 mana total e 0 contra 0 HP em conjurações. Começou com 176 contra 161 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 245,6 de dano e receberam 0 contra 49,5. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -6,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -25,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### O que mudou ao retirar cada fator

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 59 (100% do completo) | 0 / 0 |
| aventureiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | 9,3 | 29,2 (49,6% do completo) | 0 / 0 |
| aventureiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 1,4 | 59 (100% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 8/8; 0; 0 | 0 | 5,4 | 68,7 (100% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 68,7 (100% do completo) | 0 / 0 |
| guerreiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | -4,8 | 39,1 (56,9% do completo) | 0 / 0 |
| guerreiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 0,9 | 68,7 (100% do completo) | 0 / 0 |
| mago | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 52,6 (100% do completo) | 0 / 0 |
| mago | Sem habilidades da barra | 8/8; 0; 0 | 0 | -10,2 | 43,6 (82,9% do completo) | 0 / 0 |
| mago | Defesa plana zerada | 8/8; 0; 0 | 0 | 0,3 | 52,6 (100% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 50,4 (100% do completo) | 0 / 0 |
| arqueiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | -17,4 | 38,3 (76,1% do completo) | 0 / 0 |
| arqueiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 1,1 | 50,4 (100% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 39,3 (100% do completo) | 0 / 0 |
| necromante | Sem habilidades da barra | 8/8; 0; 0 | 0 | 8 | 27,6 (70,2% do completo) | 0 / 0 |
| necromante | Defesa plana zerada | 8/8; 0; 0 | 0 | 0,5 | 39,3 (100% do completo) | 0 / 0 |

## nível 10 · pesadelo · duelo

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 8,7 s | — | 1 | 341 | 65,5 | 9 | 13,3 | 0 |
| guerreiro | 11,3 s | — | 1 | 341 | 147,3 | 110 | 14,6 | 6,8 |
| mago | 13 s | — | 1 | 341 | 128,6 | 55,5 | 12,4 | 0 |
| arqueiro | 15,6 s | — | 1 | 341 | 126,5 | 35 | 10 | 0 |
| necromante | 17,6 s | — | 1 | 341 | 74 | 24 | 10,3 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 0 / 0 / 9 / 0 | 341 / 0 / 0 | 0 | 0 | 5,8 / 2,2 / 0 / 0 / 0,9 | 1,3 |
| guerreiro | 0 / 73,5 / 36,5 / 0 | 330 / 11 / 0 | 13 | 0 | 6,5 / 0,7 / 0 / 0 / 1 | 0,1 |
| mago | 0 / 0 / 55,5 / 0 | 320 / 21 / 0 | 0 | 0 | 7,3 / 1,2 / 0 / 0 / 0,9 | 2,4 |
| arqueiro | 0 / 0 / 35 / 0 | 335,1 / 5,9 / 0 | 0 | 0 | 7,7 / 0,7 / 0 / 0 / 4,3 | 2,3 |
| necromante | 0 / 0 / 24 / 0 | 198,3 / 0 / 142,8 | 0 | 0 | 5,9 / 1,5 / 0 / 0 / 0 | 2,4 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 9,3 / 1,3 | 8 / 1,4 / 2,8 | 0 / 0 | — | 0 / 4 |
| guerreiro | 13,8 / 1,3 | 7,4 / 0,9 / 2,4 | 0 / 0 | — | 0 / 5,5 |
| mago | 10,4 / 1,1 | 8,4 / 2,1 / 2,8 | 0,1 / 0 | — | 0 / 5,6 |
| arqueiro | 13,3 / 0 | 12,1 / 2,6 / 4,6 | 0 / 0 | — | 0 / 6,8 |
| necromante | 14,5 / 0,8 | 20,1 / 3,6 / 6,9 | 1 / 0 | — | 0 / 7,2 |

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
| guerreiro | redemoinho | 2,3 | 0 | 0 | 0 | 6,8 | — |
| guerreiro | grito_de_guerra | 1 | 0 | 0 | 4 | 0 | — |
| guerreiro | ataque_basico | 7,6 | 263 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 73,5 | 0 | 0 | — |
| guerreiro | efeito:dano_direto | 0 | 11 | 0 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 0,9 | 0 | 0 | 2,6 | 0 | — |
| guerreiro | item:pocao_vida | 0,5 | 0 | 36,5 | 0 | 0 | — |
| mago | bola_de_fogo | 1,1 | 79,9 | 0 | 3,4 | 0 | — |
| mago | dardo_arcano | 7,3 | 160,1 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 1 | 11,3 | 0 | 4 | 0 | — |
| mago | raio_em_cadeia | 1 | 68,8 | 0 | 5 | 0 | — |
| mago | efeito:queimando | 0 | 21 | 0 | 0 | 0 | — |
| mago | item:pocao_vida | 0,8 | 0 | 55,5 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 1 | 0 | 0 | 4 | 0 | — |
| arqueiro | chuva_de_flechas | 1 | 41,5 | 0 | 3 | 0 | — |
| arqueiro | flecha_venenosa | 1 | 26,9 | 0 | 3 | 0 | — |
| arqueiro | tiro | 10,3 | 266,8 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 0,5 | 0 | 35 | 0 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 5,9 | 0 | 0 | 0 | — |
| necromante | dardo_funesto | 3,6 | 64 | 0 | 7,3 | 0 | — |
| necromante | garras_do_ossuario | 1,5 | 33,4 | 0 | 3 | 0 | — |
| necromante | toque_funesto | 9,4 | 100,9 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 142,8 | 0 | 0 | 0 | — |
| necromante | item:pocao_vida | 0,4 | 0 | 24 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 147,7% do DPS efetivo de guerreiro. Por encontro, recebeu 65,5 contra 147,3 HP de dano; recuperou 9 contra 110 HP (9 contra 36,5 de poções), gastando 13,3 contra 14,6 mana total e 0 contra 6,8 HP em conjurações. Começou com 181 contra 182 HP e defesa 2 contra 3. Escudos absorveram 0 contra 13; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 0 p.p. e de HP final -7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 29,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 146,9% do DPS efetivo de mago. Por encontro, recebeu 65,5 contra 128,6 HP de dano; recuperou 9 contra 55,5 HP (9 contra 55,5 de poções), gastando 13,3 contra 12,4 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 184 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 8,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 12,5 p.p.; contraste de -12,5 p.p. e alteração de -24,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 179,3% do DPS efetivo de arqueiro. Por encontro, recebeu 65,5 contra 126,5 HP de dano; recuperou 9 contra 35 HP (9 contra 35 de poções), gastando 13,3 contra 10 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 176 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 20,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 25 p.p.; contraste de -25 p.p. e alteração de -11,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 201,4% do DPS efetivo de necromante. Por encontro, recebeu 65,5 contra 74 HP de dano; recuperou 9 contra 24 HP (9 contra 24 de poções), gastando 13,3 contra 10,3 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 161 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 142,8 de dano e receberam 0 contra 56. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -0,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 12,5 p.p.; contraste de -12,5 p.p. e alteração de -8,6 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 99,4% do DPS efetivo de mago. Por encontro, recebeu 147,3 contra 128,6 HP de dano; recuperou 110 contra 55,5 HP (36,5 contra 55,5 de poções), gastando 14,6 contra 12,4 mana total e 6,8 contra 0 HP em conjurações. Começou com 182 contra 184 HP e defesa 3 contra 1. Escudos absorveram 13 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 15,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 12,5 p.p.; contraste de -12,5 p.p. e alteração de -21,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 121,4% do DPS efetivo de arqueiro. Por encontro, recebeu 147,3 contra 126,5 HP de dano; recuperou 110 contra 35 HP (36,5 contra 35 de poções), gastando 14,6 contra 10 mana total e 6,8 contra 0 HP em conjurações. Começou com 182 contra 176 HP e defesa 3 contra 2. Escudos absorveram 13 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 27,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 25 p.p.; contraste de -25 p.p. e alteração de -8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 136,3% do DPS efetivo de necromante. Por encontro, recebeu 147,3 contra 74 HP de dano; recuperou 110 contra 24 HP (36,5 contra 24 de poções), gastando 14,6 contra 10,3 mana total e 6,8 contra 0 HP em conjurações. Começou com 182 contra 161 HP e defesa 3 contra 1. Escudos absorveram 13 contra 0; invocações causaram 0 contra 142,8 de dano e receberam 0 contra 56. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final 6,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 12,5 p.p.; contraste de -12,5 p.p. e alteração de -5,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 122,1% do DPS efetivo de arqueiro. Por encontro, recebeu 128,6 contra 126,5 HP de dano; recuperou 55,5 contra 35 HP (55,5 contra 35 de poções), gastando 12,4 contra 10 mana total e 0 contra 0 HP em conjurações. Começou com 184 contra 176 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 12,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 12,5 p.p.; contraste de -12,5 p.p. e alteração de 13,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 137,1% do DPS efetivo de necromante. Por encontro, recebeu 128,6 contra 74 HP de dano; recuperou 55,5 contra 24 HP (55,5 contra 24 de poções), gastando 12,4 contra 10,3 mana total e 0 contra 0 HP em conjurações. Começou com 184 contra 161 HP e defesa 1 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 142,8 de dano e receberam 0 contra 56. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -8,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 16,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**arqueiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. arqueiro manteve 112,3% do DPS efetivo de necromante. Por encontro, recebeu 126,5 contra 74 HP de dano; recuperou 35 contra 24 HP (35 contra 24 de poções), gastando 10 contra 10,3 mana total e 0 contra 0 HP em conjurações. Começou com 176 contra 161 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 142,8 de dano e receberam 0 contra 56. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -20,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -12,5 p.p.; contraste de 12,5 p.p. e alteração de 2,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### O que mudou ao retirar cada fator

**mago, Sem poções de vida:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 29,8 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem poções de vida:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 16,3 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem poções de vida:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 13,6 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 8/8; 0; 0 | 0 | 5 | 41,6 (100% do completo) | 0 / 0 |
| aventureiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | 24,3 | 19,5 (46,9% do completo) | 0 / 0 |
| aventureiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 2,5 | 41,6 (100% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 8/8; 0; 0 | 0 | 0,4 | 28 (99,5% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 8/8; 0; 0 | 0 | 8,2 | 28,3 (100,5% do completo) | 0 / 0 |
| guerreiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | -5,6 | 24,5 (87% do completo) | 0 / 0 |
| guerreiro | Defesa plana zerada | 8/8; 0; 0 | 0 | -2,2 | 28 (99,5% do completo) | 0 / 0 |
| mago | Sem poções de vida | 7/8; 1; 0 | 12,5 | 29,8 | 27,9 (98,2% do completo) | 1 / 0 |
| mago | Sem habilidades da barra | 8/8; 0; 0 | 0 | 8,6 | 24,6 (86,7% do completo) | 0 / 0 |
| mago | Defesa plana zerada | 8/8; 0; 0 | 0 | -2,9 | 28,4 (100% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 6/8; 2; 0 | 25 | 16,3 | 23,4 (100,7% do completo) | 2 / 0 |
| arqueiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | -4,4 | 23 (98,9% do completo) | 0 / 0 |
| arqueiro | Defesa plana zerada | 8/8; 0; 0 | 0 | -5 | 23,2 (100% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 7/8; 1; 0 | 12,5 | 13,6 | 20,6 (99,5% do completo) | 1 / 0 |
| necromante | Sem habilidades da barra | 8/8; 0; 0 | 0 | 15,4 | 16,6 (80,5% do completo) | 0 / 0 |
| necromante | Defesa plana zerada | 8/8; 0; 0 | 0 | 1,3 | 20,7 (100% do completo) | 0 / 0 |

## nível 10 · pesadelo · pressao

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | — | 15,1 s | 0 | 604,6 | 328,8 | 147,8 | 17,3 | 0 |
| guerreiro | 29,5 s | 26,2 s | 0,5 | 882 | 429,9 | 318,4 | 23,9 | 14,3 |
| mago | 20 s | 14,1 s | 0,4 | 752,5 | 316,6 | 148 | 16,1 | 0 |
| arqueiro | — | 16,6 s | 0 | 519,6 | 316 | 140 | 13,5 | 0 |
| necromante | — | 14,8 s | 0 | 251,5 | 265 | 104 | 6,5 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 2,3 / 1,5 / 144 / 0 | 604,6 / 0 / 0 | 0 | 0 | 9,2 / 4,2 / 0 / 3,9 / 5,8 | 1,4 |
| guerreiro | 0 / 172,4 / 146 / 0 | 815,1 / 66,9 / 0 | 39 | 0 | 12,8 / 9,7 / 0 / 3,3 / 5,4 | 1,1 |
| mago | 0 / 0 / 148 / 0 | 695,8 / 56,8 / 0 | 4,1 | 0 | 10,1 / 1,5 / 0 / 2,5 / 2,5 | 2,3 |
| arqueiro | 0 / 0 / 140 / 0 | 509,5 / 10,1 / 0 | 0 | 0 | 9 / 0,9 / 0 / 2,1 / 6,7 | 2,1 |
| necromante | 0 / 0 / 104 / 0 | 176,8 / 0 / 74,8 | 0 | 0 | 4,9 / 1,5 / 0 / 2,2 / 0 | 2,2 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 16,4 / 2,4 | 14,3 / 2,6 / 5,3 | 0 / 0 | — | 0 / 8,3 |
| guerreiro | 27 / 4,4 | 15,8 / 2,8 / 6,4 | 0 / 0 | — | 8 / 14,9 |
| mago | 13,9 / 1,1 | 15,3 / 3,3 / 5,4 | 1 / 0 | — | 0 / 8,1 |
| arqueiro | 16,6 / 1,3 | 15,1 / 2,8 / 6,1 | 0 / 0 | — | 0 / 8,1 |
| necromante | 11,5 / 0,3 | 15,4 / 2,5 / 5,9 | 0,8 / 0 | — | 0 / 5,9 |

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
| guerreiro | investida | 3 | 119,1 | 0 | 12 | 0 | — |
| guerreiro | redemoinho | 4,8 | 277,1 | 0 | 0 | 14,3 | — |
| guerreiro | efeito:dano_direto | 0 | 66,9 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 172,4 | 0 | 0 | — |
| guerreiro | grito_de_guerra | 1,8 | 0 | 0 | 7 | 0 | — |
| guerreiro | ataque_basico | 15,9 | 418,9 | 0 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 1,6 | 0 | 0 | 4,9 | 0 | — |
| guerreiro | item:pocao_vida | 2 | 0 | 146 | 0 | 0 | — |
| mago | bola_de_fogo | 2,1 | 241,6 | 0 | 6,4 | 0 | — |
| mago | dardo_arcano | 9,5 | 215,6 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 1 | 65,5 | 0 | 4 | 0 | — |
| mago | raio_em_cadeia | 1 | 173 | 0 | 5 | 0 | — |
| mago | efeito:queimando | 0 | 56,8 | 0 | 0 | 0 | — |
| mago | item:pocao_vida | 2 | 0 | 148 | 0 | 0 | — |
| mago | barreira | 0,3 | 0 | 0 | 0,8 | 0 | — |
| arqueiro | flecha_perfurante | 1,9 | 58,4 | 0 | 7,5 | 0 | — |
| arqueiro | chuva_de_flechas | 1 | 104,9 | 0 | 3 | 0 | — |
| arqueiro | tiro | 12,8 | 315,8 | 0 | 0 | 0 | — |
| arqueiro | flecha_venenosa | 1 | 30,5 | 0 | 3 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 6,6 | 0 | 0 | 0 | — |
| arqueiro | efeito:dano_direto | 0 | 3,5 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 2 | 0 | 140 | 0 | 0 | — |
| necromante | dardo_funesto | 2,3 | 39,6 | 0 | 4,5 | 0 | — |
| necromante | garras_do_ossuario | 1 | 22,8 | 0 | 2 | 0 | — |
| necromante | toque_funesto | 8,3 | 114,4 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 74,8 | 0 | 0 | 0 | — |
| necromante | item:pocao_vida | 1,6 | 0 | 104 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 8/8 mortes contra 4/8; 0 contra 0 limites de tempo. aventureiro manteve 111% do DPS efetivo de guerreiro. Por encontro, recebeu 328,8 contra 429,9 HP de dano; recuperou 147,8 contra 318,4 HP (144 contra 146 de poções), gastando 17,3 contra 23,9 mana total e 0 contra 14,3 HP em conjurações. Começou com 181 contra 182 HP e defesa 2 contra 3. Escudos absorveram 0 contra 39; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 4 só guerreiro venceu; diferença de vitória -50 p.p. e de HP final -35,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -50 para -25 p.p.; contraste de -25 p.p. e alteração de -20,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: guerreiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × mago:** 8/8 mortes contra 5/8; 0 contra 0 limites de tempo. aventureiro manteve 81,6% do DPS efetivo de mago. Por encontro, recebeu 328,8 contra 316,6 HP de dano; recuperou 147,8 contra 148 HP (144 contra 148 de poções), gastando 17,3 contra 16,1 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 184 HP e defesa 2 contra 1. Escudos absorveram 0 contra 4,1; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 3 só mago venceu; diferença de vitória -37,5 p.p. e de HP final -8,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -37,5 para 0 p.p.; contraste de -37,5 p.p. e alteração de -8,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: mago venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 121,5% do DPS efetivo de arqueiro. Por encontro, recebeu 328,8 contra 316 HP de dano; recuperou 147,8 contra 140 HP (144 contra 140 de poções), gastando 17,3 contra 13,5 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 176 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 217,4% do DPS efetivo de necromante. Por encontro, recebeu 328,8 contra 265 HP de dano; recuperou 147,8 contra 104 HP (144 contra 104 de poções), gastando 17,3 contra 6,5 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 161 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 74,8 de dano e receberam 0 contra 65,8. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × mago:** 4/8 mortes contra 5/8; 0 contra 0 limites de tempo. guerreiro manteve 73,5% do DPS efetivo de mago. Por encontro, recebeu 429,9 contra 316,6 HP de dano; recuperou 318,4 contra 148 HP (146 contra 148 de poções), gastando 23,9 contra 16,1 mana total e 14,3 contra 0 HP em conjurações. Começou com 182 contra 184 HP e defesa 3 contra 1. Escudos absorveram 39 contra 4,1; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 2 sementes só guerreiro venceu, 1 só mago venceu; diferença de vitória 12,5 p.p. e de HP final 26,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para 25 p.p.; contraste de -12,5 p.p. e alteração de 12,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 4/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 109,4% do DPS efetivo de arqueiro. Por encontro, recebeu 429,9 contra 316 HP de dano; recuperou 318,4 contra 140 HP (146 contra 140 de poções), gastando 23,9 contra 13,5 mana total e 14,3 contra 0 HP em conjurações. Começou com 182 contra 176 HP e defesa 3 contra 2. Escudos absorveram 39 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 4 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 50 p.p. e de HP final 35,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 50 para 25 p.p.; contraste de 25 p.p. e alteração de 20,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: guerreiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × necromante:** 4/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 195,8% do DPS efetivo de necromante. Por encontro, recebeu 429,9 contra 265 HP de dano; recuperou 318,4 contra 104 HP (146 contra 104 de poções), gastando 23,9 contra 6,5 mana total e 14,3 contra 0 HP em conjurações. Começou com 182 contra 161 HP e defesa 3 contra 1. Escudos absorveram 39 contra 0; invocações causaram 0 contra 74,8 de dano e receberam 0 contra 65,8. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 4 sementes só guerreiro venceu, 0 só necromante venceu; diferença de vitória 50 p.p. e de HP final 35,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 50 para 25 p.p.; contraste de 25 p.p. e alteração de 20,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: guerreiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × arqueiro:** 5/8 mortes contra 8/8; 0 contra 0 limites de tempo. mago manteve 148,9% do DPS efetivo de arqueiro. Por encontro, recebeu 316,6 contra 316 HP de dano; recuperou 148 contra 140 HP (148 contra 140 de poções), gastando 16,1 contra 13,5 mana total e 0 contra 0 HP em conjurações. Começou com 184 contra 176 HP e defesa 1 contra 2. Escudos absorveram 4,1 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 3 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 37,5 p.p. e de HP final 8,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 37,5 para 0 p.p.; contraste de 37,5 p.p. e alteração de 8,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: mago venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × necromante:** 5/8 mortes contra 8/8; 0 contra 0 limites de tempo. mago manteve 266,5% do DPS efetivo de necromante. Por encontro, recebeu 316,6 contra 265 HP de dano; recuperou 148 contra 104 HP (148 contra 104 de poções), gastando 16,1 contra 6,5 mana total e 0 contra 0 HP em conjurações. Começou com 184 contra 161 HP e defesa 1 contra 1. Escudos absorveram 4,1 contra 0; invocações causaram 0 contra 74,8 de dano e receberam 0 contra 65,8. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 3 sementes só mago venceu, 0 só necromante venceu; diferença de vitória 37,5 p.p. e de HP final 8,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 37,5 para 0 p.p.; contraste de 37,5 p.p. e alteração de 8,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: mago venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**arqueiro × necromante:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. arqueiro manteve 178,9% do DPS efetivo de necromante. Por encontro, recebeu 316 contra 265 HP de dano; recuperou 140 contra 104 HP (140 contra 104 de poções), gastando 13,5 contra 6,5 mana total e 0 contra 0 HP em conjurações. Começou com 176 contra 161 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 74,8 de dano e receberam 0 contra 65,8. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### O que mudou ao retirar cada fator

**guerreiro, Sem poções de vida:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 20,7 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Sem habilidades da barra:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 10,3 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Defesa plana zerada:** retirar esse fator perdeu 2 vitórias e ganhou 1 nas mesmas 8 condições iniciais. O kit completo teve 5,7 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem poções de vida:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 8,4 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem habilidades da barra:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 8,4 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 42,8 (116,6% do completo) | 0 / 0 |
| aventureiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 21 (57,2% do completo) | 0 / 0 |
| aventureiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 35,9 (97,8% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 4/8; 4; 0 | 0 | -2,7 | 35,7 (107,8% do completo) | 1 / 1 |
| guerreiro | Sem poções de vida | 2/8; 6; 0 | 25 | 20,7 | 34,8 (105,2% do completo) | 2 / 0 |
| guerreiro | Sem habilidades da barra | 2/8; 6; 0 | 25 | 10,3 | 25,4 (76,7% do completo) | 2 / 0 |
| guerreiro | Defesa plana zerada | 3/8; 5; 0 | 12,5 | 5,7 | 35,1 (106,3% do completo) | 2 / 1 |
| mago | Sem poções de vida | 0/8; 8; 0 | 37,5 | 8,4 | 54,8 (121,7% do completo) | 3 / 0 |
| mago | Sem habilidades da barra | 0/8; 8; 0 | 37,5 | 8,4 | 21 (46,6% do completo) | 3 / 0 |
| mago | Defesa plana zerada | 3/8; 5; 0 | 0 | 1,8 | 45 (100% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 32,2 (106,5% do completo) | 0 / 0 |
| arqueiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 24,6 (81,6% do completo) | 0 / 0 |
| arqueiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 29,6 (98,1% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 18,8 (111,6% do completo) | 0 / 0 |
| necromante | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 14,6 (86,3% do completo) | 0 / 0 |
| necromante | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 16,9 (100,1% do completo) | 0 / 0 |

## nível 10 · pesadelo · atrito

### Onde o desgaste aparece

| Classe | Onda | Chegaram/n inicial | Mortes / limites nesta onda | HP entrada → saída | Mana entrada → saída | Recebido / cura / mana gasta |
|---|---|---|---|---|---|---|
| aventureiro | 1 | 8/8 | 0 / 0 | 181 → 114,4 | 10 → 0,7 | 84,6 / 18 / 13,5 |
| aventureiro | 2 | 8/8 | 1 / 0 | 114,4 → 90,3 | 0,7 → 0,3 | 123,6 / 91,3 / 7,8 |
| aventureiro | 3 | 7/8 | 2 / 0 | 103,1 → 54 | 0,2 → 0,3 | 100,6 / 44,3 / 7,6 |
| aventureiro | 4 | 5/8 | 2 / 0 | 75,6 → 17,6 | 0,2 → 0,6 | 80 / 18,8 / 5,4 |
| aventureiro | 5 | 3/8 | 3 / 0 | 29,3 → 0 | 0,3 → 0,3 | 30,7 / 0 / 1,3 |
| guerreiro | 1 | 8/8 | 0 / 0 | 182 → 146,5 | 10 → 1,5 | 156,3 / 127,1 / 13,5 |
| guerreiro | 2 | 8/8 | 0 / 0 | 146,5 → 127,6 | 1,5 → 2,2 | 159,9 / 139,4 / 8,5 |
| guerreiro | 3 | 8/8 | 1 / 0 | 127,6 → 134,5 | 2,2 → 1,5 | 61,1 / 68,4 / 7,4 |
| guerreiro | 4 | 7/8 | 2 / 0 | 153,7 → 110,4 | 1,3 → 1,4 | 142,3 / 101 / 6,3 |
| guerreiro | 5 | 5/8 | 1 / 0 | 154,6 → 125,6 | 1,5 → 2 | 95,6 / 71 / 4 |
| mago | 1 | 8/8 | 0 / 0 | 184 → 112,4 | 12 → 5,1 | 117,9 / 46,3 / 12 |
| mago | 2 | 8/8 | 0 / 0 | 112,4 → 91,3 | 5,1 → 7,3 | 104,4 / 83,3 / 3,4 |
| mago | 3 | 8/8 | 2 / 0 | 91,3 → 31,8 | 7,3 → 1,9 | 68,8 / 9,3 / 9,9 |
| mago | 4 | 6/8 | 5 / 0 | 42,3 → 8,7 | 1,5 → 3,7 | 46,7 / 12,3 / 1 |
| mago | 5 | 1/8 | 1 / 0 | 52 → 0 | 9 → 4 | 52 / 0 / 7 |
| arqueiro | 1 | 8/8 | 0 / 0 | 176 → 113,1 | 10 → 5,4 | 80,4 / 17,5 / 10 |
| arqueiro | 2 | 8/8 | 2 / 0 | 113,1 → 40,6 | 5,4 → 5 | 142,5 / 70 / 5,9 |
| arqueiro | 3 | 6/8 | 4 / 0 | 54,2 → 19,2 | 6 → 1 | 46,7 / 11,7 / 8 |
| arqueiro | 4 | 2/8 | 2 / 0 | 57,5 → 0 | 1 → 3 | 92,5 / 35 / 1,5 |
| necromante | 1 | 8/8 | 0 / 0 | 161 → 121,9 | 12 → 8,5 | 47,1 / 8 / 9,3 |
| necromante | 2 | 8/8 | 0 / 0 | 121,9 → 65,6 | 8,5 → 10,1 | 90,5 / 34,3 / 5,8 |
| necromante | 3 | 8/8 | 0 / 0 | 65,6 → 96,6 | 10,1 → 2,6 | 10 / 28,3 / 16,5 |
| necromante | 4 | 8/8 | 0 / 0 | 96,6 → 100 | 2,6 → 3,1 | 9,9 / 8 / 5,5 |
| necromante | 5 | 8/8 | 0 / 0 | 100 → 98,4 | 3,1 → 1,9 | 12,9 / 10,3 / 5,3 |

Médias de cada onda incluem apenas quem chegou a ela; o denominador inicial mostra a seleção dos sobreviventes. Não compare a vida da onda 5 como se incluísse quem morreu antes.

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | — | 39,6 s | 2,9 | 1.107,3 | 357,8 | 159,8 | 31,8 | 0 |
| guerreiro | 51,3 s | 53,4 s | 4 | 1.447 | 561,5 | 467,6 | 37,4 | 26,6 |
| mago | — | 36,1 s | 2,9 | 1.054,8 | 332,5 | 148 | 26,9 | 0 |
| arqueiro | — | 31,3 s | 2 | 828 | 281 | 105 | 22,3 | 0 |
| necromante | 53,1 s | — | 5 | 1.639 | 170,4 | 88,8 | 42,3 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 8,3 / 7,5 / 144 / 0 | 1.107,3 / 0 / 0 | 0 | 0 | 18,5 / 13,4 / 0 / 6,5 / 15,5 | 1,4 |
| guerreiro | 0 / 321,6 / 146 / 0 | 1.380,6 / 66,4 / 0 | 61,8 | 0 | 24 / 11,5 / 0 / 5,7 / 11,5 | 0,8 |
| mago | 0 / 0 / 148 / 0 | 997,3 / 57,5 / 0 | 33 | 0 | 20,4 / 2,5 / 0 / 7,8 / 7,9 | 2,5 |
| arqueiro | 0 / 0 / 105 / 0 | 820,3 / 7,8 / 0 | 0 | 0 | 15,9 / 0,9 / 0 / 4,1 / 10,5 | 2,3 |
| necromante | 0 / 24,8 / 64 / 0 | 683,4 / 0 / 955,6 | 0 | 24,8 | 20,4 / 8,6 / 0 / 0 / 5,3 | 2,8 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 34,3 / 5,4 | 26,3 / 3,4 / 11,5 | 0 / 0 | — | 17 / 22,3 |
| guerreiro | 50,8 / 8,3 | 28,6 / 4,8 / 10,6 | 0,1 / 0 | — | 17 / 29,3 |
| mago | 28,5 / 2 | 23,9 / 4,3 / 9,6 | 0 / 0,3 | — | 0,5 / 17,8 |
| arqueiro | 27,1 / 0,8 | 25 / 4,3 / 9,9 | 0 / 0 | — | 0 / 14 |
| necromante | 49,5 / 3 | 83,6 / 13,1 / 34,4 | 2,9 / 0 | — | 19 / 32,1 |

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
| guerreiro | investida | 5,3 | 268,8 | 0 | 21 | 0 | — |
| guerreiro | redemoinho | 8,9 | 209,8 | 0 | 0 | 26,6 | — |
| guerreiro | grito_de_guerra | 2,1 | 0 | 0 | 8,5 | 0 | — |
| guerreiro | ataque_basico | 31,9 | 902,1 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 321,6 | 0 | 0 | — |
| guerreiro | efeito:dano_direto | 0 | 66,4 | 0 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 2,6 | 0 | 0 | 7,9 | 0 | — |
| guerreiro | item:pocao_vida | 2 | 0 | 146 | 0 | 0 | — |
| mago | bola_de_fogo | 4,1 | 307,4 | 0 | 12,4 | 0 | — |
| mago | dardo_arcano | 20,8 | 599,8 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 1,6 | 23,5 | 0 | 6,5 | 0 | — |
| mago | raio_em_cadeia | 1 | 66,6 | 0 | 5 | 0 | — |
| mago | item:pocao_vida | 2 | 0 | 148 | 0 | 0 | — |
| mago | efeito:queimando | 0 | 57,5 | 0 | 0 | 0 | — |
| mago | barreira | 1 | 0 | 0 | 3 | 0 | — |
| arqueiro | flecha_perfurante | 2,8 | 120,8 | 0 | 11 | 0 | — |
| arqueiro | chuva_de_flechas | 2,3 | 109,1 | 0 | 6,8 | 0 | — |
| arqueiro | flecha_venenosa | 1,5 | 40,9 | 0 | 4,5 | 0 | — |
| arqueiro | tiro | 20,6 | 549,5 | 0 | 0 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 7,8 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 1,5 | 0 | 105 | 0 | 0 | — |
| necromante | dardo_funesto | 13,6 | 238,8 | 0 | 27,3 | 0 | — |
| necromante | garras_do_ossuario | 5,9 | 118,6 | 0 | 11,8 | 0 | — |
| necromante | toque_funesto | 28,4 | 326 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 955,6 | 0 | 0 | 0 | — |
| necromante | dizimo_vital | 1,4 | 0 | 0 | 2,8 | 0 | — |
| necromante | efeito:cura | 0 | 0 | 24,8 | 0 | 0 | — |
| necromante | item:pocao_vida | 1 | 0 | 64 | 0 | 0 | — |
| necromante | comando_sepulcral | 0,3 | 0 | 0 | 0,5 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 8/8 mortes contra 4/8; 0 contra 0 limites de tempo. aventureiro manteve 107,3% do DPS efetivo de guerreiro. Por encontro, recebeu 357,8 contra 561,5 HP de dano; recuperou 159,8 contra 467,6 HP (144 contra 146 de poções), gastando 31,8 contra 37,4 mana total e 0 contra 26,6 HP em conjurações. Começou com 181 contra 182 HP e defesa 2 contra 3. Escudos absorveram 0 contra 61,8; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 4 só guerreiro venceu; diferença de vitória -50 p.p. e de HP final -43,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -50 para -87,5 p.p.; contraste de 37,5 p.p. e alteração de 41,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: guerreiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × mago:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 100,9% do DPS efetivo de mago. Por encontro, recebeu 357,8 contra 332,5 HP de dano; recuperou 159,8 contra 148 HP (144 contra 148 de poções), gastando 31,8 contra 26,9 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 184 HP e defesa 2 contra 1. Escudos absorveram 0 contra 33; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 107,7% do DPS efetivo de arqueiro. Por encontro, recebeu 357,8 contra 281 HP de dano; recuperou 159,8 contra 105 HP (144 contra 105 de poções), gastando 31,8 contra 22,3 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 176 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 8/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 101,5% do DPS efetivo de necromante. Por encontro, recebeu 357,8 contra 170,4 HP de dano; recuperou 159,8 contra 88,8 HP (144 contra 64 de poções), gastando 31,8 contra 42,3 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 161 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 955,6 de dano e receberam 0 contra 274,4. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 8 só necromante venceu; diferença de vitória -100 p.p. e de HP final -61,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -100 para -12,5 p.p.; contraste de -87,5 p.p. e alteração de -56 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × mago:** 4/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 94,1% do DPS efetivo de mago. Por encontro, recebeu 561,5 contra 332,5 HP de dano; recuperou 467,6 contra 148 HP (146 contra 148 de poções), gastando 37,4 contra 26,9 mana total e 26,6 contra 0 HP em conjurações. Começou com 182 contra 184 HP e defesa 3 contra 1. Escudos absorveram 61,8 contra 33; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 4 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 50 p.p. e de HP final 43,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 50 para 87,5 p.p.; contraste de -37,5 p.p. e alteração de -41,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: guerreiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × arqueiro:** 4/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 100,4% do DPS efetivo de arqueiro. Por encontro, recebeu 561,5 contra 281 HP de dano; recuperou 467,6 contra 105 HP (146 contra 105 de poções), gastando 37,4 contra 22,3 mana total e 26,6 contra 0 HP em conjurações. Começou com 182 contra 176 HP e defesa 3 contra 2. Escudos absorveram 61,8 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 4 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 50 p.p. e de HP final 43,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 50 para 87,5 p.p.; contraste de -37,5 p.p. e alteração de -41,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: guerreiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × necromante:** 4/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 94,6% do DPS efetivo de necromante. Por encontro, recebeu 561,5 contra 170,4 HP de dano; recuperou 467,6 contra 88,8 HP (146 contra 64 de poções), gastando 37,4 contra 42,3 mana total e 26,6 contra 0 HP em conjurações. Começou com 182 contra 161 HP e defesa 3 contra 1. Escudos absorveram 61,8 contra 0; invocações causaram 0 contra 955,6 de dano e receberam 0 contra 274,4. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 4 só necromante venceu; diferença de vitória -50 p.p. e de HP final -18 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -50 para 75 p.p.; contraste de -125 p.p. e alteração de -97,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. mago manteve 106,7% do DPS efetivo de arqueiro. Por encontro, recebeu 332,5 contra 281 HP de dano; recuperou 148 contra 105 HP (148 contra 105 de poções), gastando 26,9 contra 22,3 mana total e 0 contra 0 HP em conjurações. Começou com 184 contra 176 HP e defesa 1 contra 2. Escudos absorveram 33 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × necromante:** 8/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 100,6% do DPS efetivo de necromante. Por encontro, recebeu 332,5 contra 170,4 HP de dano; recuperou 148 contra 88,8 HP (148 contra 64 de poções), gastando 26,9 contra 42,3 mana total e 0 contra 0 HP em conjurações. Começou com 184 contra 161 HP e defesa 1 contra 1. Escudos absorveram 33 contra 0; invocações causaram 0 contra 955,6 de dano e receberam 0 contra 274,4. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 8 só necromante venceu; diferença de vitória -100 p.p. e de HP final -61,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -100 para -12,5 p.p.; contraste de -87,5 p.p. e alteração de -56 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**arqueiro × necromante:** 8/8 mortes contra 0/8; 0 contra 0 limites de tempo. arqueiro manteve 94,3% do DPS efetivo de necromante. Por encontro, recebeu 281 contra 170,4 HP de dano; recuperou 105 contra 88,8 HP (105 contra 64 de poções), gastando 22,3 contra 42,3 mana total e 0 contra 0 HP em conjurações. Começou com 176 contra 161 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 955,6 de dano e receberam 0 contra 274,4. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 8 só necromante venceu; diferença de vitória -100 p.p. e de HP final -61,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -100 para -12,5 p.p.; contraste de -87,5 p.p. e alteração de -56 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

### O que mudou ao retirar cada fator

**guerreiro, Sem cura do básico:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 18,1 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Sem poções de vida:** retirar esse fator perdeu 2 vitórias e ganhou 1 nas mesmas 8 condições iniciais. O kit completo teve 5,6 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Defesa plana zerada:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 5,6 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem poções de vida:** retirar esse fator perdeu 5 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 36,3 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem habilidades da barra:** retirar esse fator perdeu 7 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 56 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 30,5 (99,9% do completo) | 0 / 0 |
| aventureiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 19,2 (62,8% do completo) | 0 / 0 |
| aventureiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 29,3 (95,9% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 2/8; 6; 0 | 25 | 18,1 | 27,9 (98% do completo) | 2 / 0 |
| guerreiro | Sem poções de vida | 3/8; 5; 0 | 12,5 | 5,6 | 30,7 (107,7% do completo) | 2 / 1 |
| guerreiro | Sem habilidades da barra | 7/8; 1; 0 | -37,5 | -41,8 | 24,2 (84,7% do completo) | 1 / 4 |
| guerreiro | Defesa plana zerada | 3/8; 5; 0 | 12,5 | 5,6 | 28,1 (98,7% do completo) | 1 / 0 |
| mago | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 28,9 (95,3% do completo) | 0 / 0 |
| mago | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 23,3 (76,8% do completo) | 0 / 0 |
| mago | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 30,4 (100,5% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 28,2 (99,4% do completo) | 0 / 0 |
| arqueiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 22,6 (79,6% do completo) | 0 / 0 |
| arqueiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 28,3 (99,6% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 3/8; 5; 0 | 62,5 | 36,3 | 26,9 (89,4% do completo) | 5 / 0 |
| necromante | Sem habilidades da barra | 1/8; 7; 0 | 87,5 | 56 | 16,5 (54,7% do completo) | 7 / 0 |
| necromante | Defesa plana zerada | 8/8; 0; 0 | 0 | 2,3 | 29,2 (97,1% do completo) | 0 / 0 |

## nível 10 · pesadelo · chefe

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 23 s | — | 1 | 690 | 196,9 | 90 | 21 | 0 |
| guerreiro | 19,6 s | — | 1 | 678 | 133,4 | 110 | 16,1 | 9,8 |
| mago | 18 s | — | 1 | 698,5 | 70,8 | 37 | 18,8 | 0 |
| arqueiro | 27,4 s | 26,5 s | 0,5 | 615,8 | 261,3 | 131,3 | 16 | 0 |
| necromante | 29,4 s | — | 1 | 716 | 87,8 | 20,5 | 24,8 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 0 / 0 / 90 / 0 | 690 / 0 / 0 | 0 | 0 | 12,1 / 5,8 / 2,2 / 0,5 / 8,3 | 1,2 |
| guerreiro | 0 / 73,5 / 36,5 / 0 | 646,9 / 31,1 / 0 | 6,5 | 0 | 8,4 / 2,4 / 1,7 / 0 / 0,9 | 0,6 |
| mago | 0 / 0 / 37 / 0 | 665,3 / 33,3 / 0 | 0 | 0 | 12,3 / 9,6 / 0,5 / 0 / 4,7 | 2,2 |
| arqueiro | 0 / 0 / 131,3 / 0 | 595,5 / 20,3 / 0 | 0 | 0 | 13,6 / 7,5 / 1,9 / 1,8 / 9,3 | 2,1 |
| necromante | 0 / 4,5 / 16 / 0 | 471,1 / 0 / 244,9 | 0 | 4,5 | 12 / 12,9 / 0,3 / 2 / 1,7 | 2,3 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 21,8 / 3 | 17,5 / 2,4 / 6,3 | 0 / 0 | bloqueado: 14,4 | 0 / 11,4 |
| guerreiro | 17,8 / 2,9 | 12 / 1,8 / 3,9 | 0 / 0 | — | 0 / 8,1 |
| mago | 16,3 / 2,5 | 14,5 / 2,3 / 6,1 | 0,6 / 0 | — | 0 / 9,6 |
| arqueiro | 24,9 / 3,6 | 19,9 / 3,3 / 8 | 0 / 0 | — | 0 / 13,3 |
| necromante | 29,5 / 2,3 | 37,8 / 5,6 / 16,1 | 2,1 / 0 | sem_invocacao: 9,3 | 1,8 / 16,7 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 7,5 | 319,4 | 0 | 15 | 0 | — |
| aventureiro | explosao | 1 | 62,1 | 0 | 3 | 0 | — |
| aventureiro | golpe_atordoante | 1 | 30,4 | 0 | 3 | 0 | — |
| aventureiro | ataque_basico | 12,3 | 278,1 | 0 | 0 | 0 | — |
| aventureiro | item:pocao_vida | 1,3 | 0 | 90 | 0 | 0 | — |
| guerreiro | investida | 2,5 | 133,8 | 0 | 10 | 0 | — |
| guerreiro | redemoinho | 3,3 | 166,9 | 0 | 0 | 9,8 | — |
| guerreiro | grito_de_guerra | 1,3 | 0 | 0 | 5 | 0 | — |
| guerreiro | ataque_basico | 10,4 | 346,3 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 73,5 | 0 | 0 | — |
| guerreiro | efeito:dano_direto | 0 | 31,1 | 0 | 0 | 0 | — |
| guerreiro | item:pocao_vida | 0,5 | 0 | 36,5 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 0,4 | 0 | 0 | 1,1 | 0 | — |
| mago | bola_de_fogo | 3,3 | 196,1 | 0 | 9,8 | 0 | — |
| mago | dardo_arcano | 11 | 299,8 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 1 | 87,9 | 0 | 4 | 0 | — |
| mago | raio_em_cadeia | 1 | 81,5 | 0 | 5 | 0 | — |
| mago | efeito:queimando | 0 | 33,3 | 0 | 0 | 0 | — |
| mago | item:pocao_vida | 0,5 | 0 | 37 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 1 | 0 | 0 | 4 | 0 | — |
| arqueiro | chuva_de_flechas | 2 | 81,4 | 0 | 6 | 0 | — |
| arqueiro | tiro | 19,9 | 447,1 | 0 | 0 | 0 | — |
| arqueiro | flecha_venenosa | 2 | 67 | 0 | 6 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 17,3 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 1,9 | 0 | 131,3 | 0 | 0 | — |
| arqueiro | efeito:dano_direto | 0 | 3 | 0 | 0 | 0 | — |
| necromante | dardo_funesto | 8,8 | 189,1 | 0 | 17,5 | 0 | — |
| necromante | garras_do_ossuario | 3,4 | 88,5 | 0 | 6,8 | 0 | — |
| necromante | toque_funesto | 17,1 | 193,5 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 244,9 | 0 | 0 | 0 | — |
| necromante | dizimo_vital | 0,3 | 0 | 0 | 0,5 | 0 | — |
| necromante | efeito:cura | 0 | 0 | 4,5 | 0 | 0 | — |
| necromante | item:pocao_vida | 0,3 | 0 | 16 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 74,8% do DPS efetivo de guerreiro. Por encontro, recebeu 196,9 contra 133,4 HP de dano; recuperou 90 contra 110 HP (90 contra 36,5 de poções), gastando 21 contra 16,1 mana total e 0 contra 9,8 HP em conjurações. Começou com 181 contra 182 HP e defesa 2 contra 3. Escudos absorveram 0 contra 6,5; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 0 p.p. e de HP final -40,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -87,5 p.p.; contraste de 87,5 p.p. e alteração de 54,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 81,3% do DPS efetivo de mago. Por encontro, recebeu 196,9 contra 70,8 HP de dano; recuperou 90 contra 37 HP (90 contra 37 de poções), gastando 21 contra 18,8 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 184 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final -40,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -50 p.p.; contraste de 50 p.p. e alteração de -13,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × arqueiro:** 0/8 mortes contra 4/8; 0 contra 0 limites de tempo. aventureiro manteve 130,7% do DPS efetivo de arqueiro. Por encontro, recebeu 196,9 contra 261,3 HP de dano; recuperou 90 contra 131,3 HP (90 contra 131,3 de poções), gastando 21 contra 16 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 176 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 4 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 50 p.p. e de HP final 14,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 50 para -75 p.p.; contraste de 125 p.p. e alteração de 45,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 129,7% do DPS efetivo de necromante. Por encontro, recebeu 196,9 contra 87,8 HP de dano; recuperou 90 contra 20,5 HP (90 contra 16 de poções), gastando 21 contra 24,8 mana total e 0 contra 0 HP em conjurações. Começou com 181 contra 161 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 244,9 de dano e receberam 0 contra 100,6. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -18,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -37,5 p.p.; contraste de 37,5 p.p. e alteração de 27,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 108,6% do DPS efetivo de mago. Por encontro, recebeu 133,4 contra 70,8 HP de dano; recuperou 110 contra 37 HP (36,5 contra 37 de poções), gastando 16,1 contra 18,8 mana total e 9,8 contra 0 HP em conjurações. Começou com 182 contra 184 HP e defesa 3 contra 1. Escudos absorveram 6,5 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 0,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 37,5 p.p.; contraste de -37,5 p.p. e alteração de -67,6 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 0/8 mortes contra 4/8; 0 contra 0 limites de tempo. guerreiro manteve 174,6% do DPS efetivo de arqueiro. Por encontro, recebeu 133,4 contra 261,3 HP de dano; recuperou 110 contra 131,3 HP (36,5 contra 131,3 de poções), gastando 16,1 contra 16 mana total e 9,8 contra 0 HP em conjurações. Começou com 182 contra 176 HP e defesa 3 contra 2. Escudos absorveram 6,5 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 4 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 50 p.p. e de HP final 55,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 50 para 12,5 p.p.; contraste de 37,5 p.p. e alteração de -8,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: guerreiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 173,3% do DPS efetivo de necromante. Por encontro, recebeu 133,4 contra 87,8 HP de dano; recuperou 110 contra 20,5 HP (36,5 contra 16 de poções), gastando 16,1 contra 24,8 mana total e 9,8 contra 0 HP em conjurações. Começou com 182 contra 161 HP e defesa 3 contra 1. Escudos absorveram 6,5 contra 0; invocações causaram 0 contra 244,9 de dano e receberam 0 contra 100,6. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final 22,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 75 p.p.; contraste de -75 p.p. e alteração de -59,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × arqueiro:** 0/8 mortes contra 4/8; 0 contra 0 limites de tempo. mago manteve 160,8% do DPS efetivo de arqueiro. Por encontro, recebeu 70,8 contra 261,3 HP de dano; recuperou 37 contra 131,3 HP (37 contra 131,3 de poções), gastando 18,8 contra 16 mana total e 0 contra 0 HP em conjurações. Começou com 184 contra 176 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 4 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 50 p.p. e de HP final 55,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 50 para -25 p.p.; contraste de 75 p.p. e alteração de 58,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: mago venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 159,6% do DPS efetivo de necromante. Por encontro, recebeu 70,8 contra 87,8 HP de dano; recuperou 37 contra 20,5 HP (37 contra 16 de poções), gastando 18,8 contra 24,8 mana total e 0 contra 0 HP em conjurações. Começou com 184 contra 161 HP e defesa 1 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 244,9 de dano e receberam 0 contra 100,6. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final 22,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 37,5 p.p.; contraste de -37,5 p.p. e alteração de 8,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**arqueiro × necromante:** 4/8 mortes contra 0/8; 0 contra 0 limites de tempo. arqueiro manteve 99,2% do DPS efetivo de necromante. Por encontro, recebeu 261,3 contra 87,8 HP de dano; recuperou 131,3 contra 20,5 HP (131,3 contra 16 de poções), gastando 16 contra 24,8 mana total e 0 contra 0 HP em conjurações. Começou com 176 contra 161 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 244,9 de dano e receberam 0 contra 100,6. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 4 só necromante venceu; diferença de vitória -50 p.p. e de HP final -33,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -50 para 62,5 p.p.; contraste de -112,5 p.p. e alteração de -50,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

### O que mudou ao retirar cada fator

**aventureiro, Sem poções de vida:** retirar esse fator perdeu 4 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 28 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**aventureiro, Sem habilidades da barra:** retirar esse fator perdeu 7 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 40,1 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Sem poções de vida:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 24,2 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem poções de vida:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 17,5 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem habilidades da barra:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 53,6 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem poções de vida:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 24,4 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem poções de vida:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 0,2 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem habilidades da barra:** retirar esse fator perdeu 6 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 45,4 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Defesa plana zerada:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 1,9 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 4/8; 4; 0 | 50 | 28 | 29 (99% do completo) | 4 / 0 |
| aventureiro | Sem habilidades da barra | 1/8; 7; 0 | 87,5 | 40,1 | 17,1 (58,6% do completo) | 7 / 0 |
| aventureiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 3,1 | 29,2 (100% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 8/8; 0; 0 | 0 | 1,9 | 40,2 (103% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 6/8; 2; 0 | 25 | 24,2 | 39,7 (101,8% do completo) | 2 / 0 |
| guerreiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | -14 | 22,4 (57,4% do completo) | 0 / 0 |
| guerreiro | Defesa plana zerada | 8/8; 0; 0 | 0 | -0,4 | 40,8 (104,4% do completo) | 0 / 0 |
| mago | Sem poções de vida | 7/8; 1; 0 | 12,5 | 17,5 | 36,3 (101% do completo) | 1 / 0 |
| mago | Sem habilidades da barra | 5/8; 3; 0 | 37,5 | 53,6 | 21,6 (60,1% do completo) | 3 / 0 |
| mago | Defesa plana zerada | 8/8; 0; 0 | 0 | 1,7 | 36 (100% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 1/8; 7; 0 | 37,5 | 24,4 | 23,1 (103,1% do completo) | 3 / 0 |
| arqueiro | Sem habilidades da barra | 7/8; 1; 0 | -37,5 | -5,1 | 21,1 (94,5% do completo) | 0 / 3 |
| arqueiro | Defesa plana zerada | 4/8; 4; 0 | 0 | 3,8 | 22,6 (101,2% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 7/8; 1; 0 | 12,5 | 0,2 | 23,3 (103,3% do completo) | 1 / 0 |
| necromante | Sem habilidades da barra | 2/8; 6; 0 | 75 | 45,4 | 13,4 (59,3% do completo) | 6 / 0 |
| necromante | Defesa plana zerada | 7/8; 1; 0 | 12,5 | 1,9 | 22,5 (99,8% do completo) | 1 / 0 |

## nível 30 · normal · duelo

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 8,6 s | — | 1 | 917 | 82,1 | 16,3 | 15,9 | 0 |
| guerreiro | 25,8 s | — | 1 | 917 | 346 | 288,8 | 27,1 | 12 |
| mago | 10,4 s | — | 1 | 917 | 44,9 | 0 | 20,5 | 0 |
| arqueiro | 9 s | — | 1 | 917 | 6,5 | 0 | 22,1 | 0 |
| necromante | 18,4 s | — | 1 | 917 | 60,4 | 0 | 14,5 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 0 / 0 / 16,3 / 0 | 917 / 0 / 0 | 0 | 0 | 6,7 / 1,8 / 0 / 0 / 0 | 1,1 |
| guerreiro | 0 / 195,8 / 93 / 0 | 818,8 / 98,3 / 0 | 89,5 | 0 | 10,1 / 0,4 / 8,1 / 0 / 0 | 0 |
| mago | 0 / 0 / 0 / 0 | 834,3 / 82,8 / 0 | 0 | 0 | 7,7 / 2,9 / 0 / 0 / 0 | 2,2 |
| arqueiro | 0 / 0 / 0 / 0 | 891,3 / 25,8 / 0 | 0 | 0 | 7,3 / 2,2 / 0 / 0 / 0 | 2,4 |
| necromante | 0 / 0 / 0 / 0 | 496,9 / 0 / 420,1 | 19,5 | 0 | 7,9 / 2,1 / 0 / 0 / 0 | 2,2 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 9,6 / 0,3 | 9,3 / 1,9 / 3 | 0 / 0 | — | 0 / 6,5 |
| guerreiro | 22,1 / 2,9 | 9,1 / 1,5 / 3,4 | 0 / 0 | bloqueado: 136,1 | 0 / 19,6 |
| mago | 10,1 / 2 | 6,5 / 0,9 / 2,4 | 0,3 / 0,1 | — | 0 / 7,1 |
| arqueiro | 13,1 / 3,1 | 8,9 / 1,1 / 2,9 | 0 / 0,1 | — | 0 / 5,8 |
| necromante | 19,8 / 1,9 | 23,5 / 4,5 / 8,8 | 0,9 / 0 | — | 0 / 7 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 3,6 | 428 | 0 | 7,3 | 0 | — |
| aventureiro | explosao | 1,8 | 183,1 | 0 | 5,3 | 0 | — |
| aventureiro | golpe_atordoante | 1,1 | 123,3 | 0 | 3,4 | 0 | — |
| aventureiro | ataque_basico | 3,1 | 182,6 | 0 | 0 | 0 | — |
| aventureiro | item:pocao_vida | 0,1 | 0 | 16,3 | 0 | 0 | — |
| guerreiro | investida | 3,9 | 150,8 | 0 | 15,5 | 0 | — |
| guerreiro | redemoinho | 4 | 0 | 0 | 0 | 12 | — |
| guerreiro | efeito:dano_direto | 0 | 98,3 | 0 | 0 | 0 | — |
| guerreiro | grito_de_guerra | 1,9 | 0 | 0 | 7,5 | 0 | — |
| guerreiro | ataque_basico | 11 | 668 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 195,8 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 1,4 | 0 | 0 | 4,1 | 0 | — |
| guerreiro | item:pocao_vida | 0,8 | 0 | 93 | 0 | 0 | — |
| mago | bola_de_fogo | 2 | 329,1 | 0 | 6 | 0 | — |
| mago | dardo_arcano | 4,9 | 220,9 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 1,8 | 52,1 | 0 | 7 | 0 | — |
| mago | raio_em_cadeia | 1,5 | 232,1 | 0 | 7,5 | 0 | — |
| mago | efeito:dano_direto | 0 | 20,9 | 0 | 0 | 0 | — |
| mago | efeito:queimando | 0 | 61,9 | 0 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 1,9 | 151,3 | 0 | 7,5 | 0 | — |
| arqueiro | chuva_de_flechas | 1,5 | 183,5 | 0 | 6 | 0 | — |
| arqueiro | flecha_venenosa | 1,1 | 102,9 | 0 | 3,4 | 0 | — |
| arqueiro | tiro_em_leque | 1,8 | 245,8 | 0 | 5,3 | 0 | — |
| arqueiro | tiro | 6,9 | 207,9 | 0 | 0 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 19 | 0 | 0 | 0 | — |
| arqueiro | efeito:dano_direto | 0 | 6,8 | 0 | 0 | 0 | — |
| necromante | dardo_funesto | 4,6 | 156 | 0 | 9,3 | 0 | — |
| necromante | garras_do_ossuario | 2,6 | 107,6 | 0 | 5,3 | 0 | — |
| necromante | toque_funesto | 12,5 | 233,3 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 420,1 | 0 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 295,2% do DPS efetivo de guerreiro. Por encontro, recebeu 82,1 contra 346 HP de dano; recuperou 16,3 contra 288,8 HP (16,3 contra 93 de poções), gastando 15,9 contra 27,1 mana total e 0 contra 12 HP em conjurações. Começou com 325 contra 310 HP e defesa 2 contra 3. Escudos absorveram 0 contra 89,5; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 0 p.p. e de HP final 2,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 53,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 119,8% do DPS efetivo de mago. Por encontro, recebeu 82,1 contra 44,9 HP de dano; recuperou 16,3 contra 0 HP (16,3 contra 0 de poções), gastando 15,9 contra 20,5 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final -6,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 17,6 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 103,1% do DPS efetivo de arqueiro. Por encontro, recebeu 82,1 contra 6,5 HP de dano; recuperou 16,3 contra 0 HP (16,3 contra 0 de poções), gastando 15,9 contra 22,1 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final -18,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 9,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 205,8% do DPS efetivo de necromante. Por encontro, recebeu 82,1 contra 60,4 HP de dano; recuperou 16,3 contra 0 HP (16,3 contra 0 de poções), gastando 15,9 contra 14,5 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 297 HP e defesa 2 contra 1. Escudos absorveram 0 contra 19,5; invocações causaram 0 contra 420,1 de dano e receberam 0 contra 83. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final 0,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 17 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 40,6% do DPS efetivo de mago. Por encontro, recebeu 346 contra 44,9 HP de dano; recuperou 288,8 contra 0 HP (93 contra 0 de poções), gastando 27,1 contra 20,5 mana total e 12 contra 0 HP em conjurações. Começou com 310 contra 320 HP e defesa 3 contra 1. Escudos absorveram 89,5 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final -8,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -36,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 34,9% do DPS efetivo de arqueiro. Por encontro, recebeu 346 contra 6,5 HP de dano; recuperou 288,8 contra 0 HP (93 contra 0 de poções), gastando 27,1 contra 22,1 mana total e 12 contra 0 HP em conjurações. Começou com 310 contra 320 HP e defesa 3 contra 2. Escudos absorveram 89,5 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final -20,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -43,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 69,7% do DPS efetivo de necromante. Por encontro, recebeu 346 contra 60,4 HP de dano; recuperou 288,8 contra 0 HP (93 contra 0 de poções), gastando 27,1 contra 14,5 mana total e 12 contra 0 HP em conjurações. Começou com 310 contra 297 HP e defesa 3 contra 1. Escudos absorveram 89,5 contra 19,5; invocações causaram 0 contra 420,1 de dano e receberam 0 contra 83. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -36,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 86,1% do DPS efetivo de arqueiro. Por encontro, recebeu 44,9 contra 6,5 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 20,5 contra 22,1 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 320 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final -12 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -7,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 171,9% do DPS efetivo de necromante. Por encontro, recebeu 44,9 contra 60,4 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 20,5 contra 14,5 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 297 HP e defesa 1 contra 1. Escudos absorveram 0 contra 19,5; invocações causaram 0 contra 420,1 de dano e receberam 0 contra 83. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final 6,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -0,6 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**arqueiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. arqueiro manteve 199,8% do DPS efetivo de necromante. Por encontro, recebeu 6,5 contra 60,4 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 22,1 contra 14,5 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 297 HP e defesa 2 contra 1. Escudos absorveram 0 contra 19,5; invocações causaram 0 contra 420,1 de dano e receberam 0 contra 83. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final 18,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 7,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### O que mudou ao retirar cada fator

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 8/8; 0; 0 | 0 | 5 | 112,9 (100% do completo) | 0 / 0 |
| aventureiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | 34,3 | 46,5 (41,2% do completo) | 0 / 0 |
| aventureiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 0,7 | 112,9 (100% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 8/8; 0; 0 | 0 | 3,8 | 38,5 (100,7% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 8/8; 0; 0 | 0 | 10,8 | 39 (102% do completo) | 0 / 0 |
| guerreiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | -19,5 | 64,1 (167,5% do completo) | 0 / 0 |
| guerreiro | Defesa plana zerada | 8/8; 0; 0 | 0 | -0,2 | 38,5 (100,7% do completo) | 0 / 0 |
| mago | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 94,3 (100% do completo) | 0 / 0 |
| mago | Sem habilidades da barra | 8/8; 0; 0 | 0 | 16,8 | 65,4 (69,3% do completo) | 0 / 0 |
| mago | Defesa plana zerada | 8/8; 0; 0 | 0 | 0,2 | 94,3 (100% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 109,6 (100% do completo) | 0 / 0 |
| arqueiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | 24,4 | 78,5 (71,7% do completo) | 0 / 0 |
| arqueiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 0,1 | 109,6 (100% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 54,9 (100% do completo) | 0 / 0 |
| necromante | Sem habilidades da barra | 8/8; 0; 0 | 0 | 17,3 | 41,4 (75,5% do completo) | 0 / 0 |
| necromante | Defesa plana zerada | 8/8; 0; 0 | 0 | 0,4 | 54,9 (100% do completo) | 0 / 0 |

## nível 30 · normal · pressao

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 26,8 s | — | 1 | 2.709 | 310,1 | 170,9 | 42,5 | 0 |
| guerreiro | 29,8 s | — | 1 | 2.709 | 614,4 | 570,3 | 31 | 14,6 |
| mago | 17,7 s | 15,5 s | 0,4 | 2.040,9 | 530,1 | 260,1 | 23,5 | 0 |
| arqueiro | 17,6 s | 18,9 s | 0,1 | 2.166,1 | 562,5 | 256 | 22,9 | 0 |
| necromante | — | 19,4 s | 0 | 875,3 | 535 | 238 | 6 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 20,4 / 36,8 / 113,8 / 0 | 2.709 / 0 / 0 | 0 | 0 | 19,2 / 10,6 / 0 / 0 / 0 | 1,8 |
| guerreiro | 0 / 461,8 / 108,5 / 0 | 2.222,6 / 486,4 / 0 | 84,4 | 0 | 12,8 / 7,4 / 9,1 / 0,2 / 0 | 0,8 |
| mago | 0 / 4,1 / 256 / 0 | 1.855,5 / 185,4 / 0 | 11,4 | 0 | 11,8 / 8,1 / 0 / 2 / 0 | 1,2 |
| arqueiro | 0 / 0 / 256 / 0 | 2.082,3 / 83,9 / 0 | 0 | 0 | 13,3 / 5,7 / 0 / 4,1 / 0 | 2 |
| necromante | 0 / 0 / 238 / 0 | 454,6 / 0 / 420,6 | 26 | 0 | 7,5 / 0,9 / 0 / 2,9 / 0 | 2,1 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 29,1 / 3,8 | 24,5 / 4,1 / 8,8 | 0 / 0 | — | 2,3 / 20,9 |
| guerreiro | 26,5 / 2,5 | 16,8 / 1,8 / 6,9 | 0,1 / 0 | bloqueado: 160,3 | 9,1 / 25,1 |
| mago | 16,5 / 2,6 | 15,8 / 2,1 / 6 | 0,3 / 0,3 | — | 0 / 10,9 |
| arqueiro | 23,4 / 0,6 | 24,8 / 3,1 / 9,3 | 0 / 0,6 | — | 0 / 8,9 |
| necromante | 17,8 / 1 | 23 / 4 / 8,5 | 0,8 / 0 | — | 0 / 3,9 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 9,4 | 1.229,5 | 0 | 18,8 | 0 | — |
| aventureiro | explosao | 4,5 | 717,4 | 0 | 13,5 | 0 | — |
| aventureiro | golpe_atordoante | 3 | 271,5 | 0 | 9 | 0 | — |
| aventureiro | ataque_basico | 11 | 490,6 | 0 | 0 | 0 | — |
| aventureiro | item:pocao_vida | 0,9 | 0 | 113,8 | 0 | 0 | — |
| aventureiro | curar | 1,3 | 0 | 20,4 | 1,3 | 0 | 16,3 |
| aventureiro | efeito:cura_periodica | 0 | 0 | 36,8 | 0 | 0 | — |
| guerreiro | investida | 4,9 | 377,3 | 0 | 19,5 | 0 | — |
| guerreiro | redemoinho | 4,9 | 800,9 | 0 | 0 | 14,6 | — |
| guerreiro | efeito:dano_direto | 0 | 486,4 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 461,8 | 0 | 0 | — |
| guerreiro | grito_de_guerra | 2,1 | 0 | 0 | 8,5 | 0 | — |
| guerreiro | escudo_de_ferro | 1 | 0 | 0 | 3 | 0 | — |
| guerreiro | ataque_basico | 13,6 | 1.044,5 | 0 | 0 | 0 | — |
| guerreiro | item:pocao_vida | 0,9 | 0 | 108,5 | 0 | 0 | — |
| mago | bola_de_fogo | 2,3 | 610,3 | 0 | 6,8 | 0 | — |
| mago | dardo_arcano | 10,4 | 569,6 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 1,9 | 165,5 | 0 | 7,5 | 0 | — |
| mago | efeito:dano_direto | 0 | 46,1 | 0 | 0 | 0 | — |
| mago | raio_em_cadeia | 1,6 | 510,1 | 0 | 8,1 | 0 | — |
| mago | efeito:queimando | 0 | 139,3 | 0 | 0 | 0 | — |
| mago | efeito:cura | 0 | 0 | 4,1 | 0 | 0 | — |
| mago | item:pocao_vida | 2 | 0 | 256 | 0 | 0 | — |
| mago | barreira | 0,4 | 0 | 0 | 1,1 | 0 | — |
| arqueiro | flecha_perfurante | 2 | 169,6 | 0 | 8 | 0 | — |
| arqueiro | chuva_de_flechas | 1,8 | 516,9 | 0 | 7 | 0 | — |
| arqueiro | flecha_venenosa | 1,6 | 133,4 | 0 | 4,9 | 0 | — |
| arqueiro | tiro_em_leque | 1 | 258,5 | 0 | 3 | 0 | — |
| arqueiro | tiro | 17 | 1.003,9 | 0 | 0 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 67 | 0 | 0 | 0 | — |
| arqueiro | efeito:dano_direto | 0 | 16,9 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 2 | 0 | 256 | 0 | 0 | — |
| necromante | dardo_funesto | 2 | 68,1 | 0 | 4 | 0 | — |
| necromante | garras_do_ossuario | 1 | 55,6 | 0 | 2 | 0 | — |
| necromante | toque_funesto | 14,8 | 330,9 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 420,6 | 0 | 0 | 0 | — |
| necromante | item:pocao_vida | 2 | 0 | 238 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 119,1% do DPS efetivo de guerreiro. Por encontro, recebeu 310,1 contra 614,4 HP de dano; recuperou 170,9 contra 570,3 HP (113,8 contra 108,5 de poções), gastando 42,5 contra 31 mana total e 0 contra 14,6 HP em conjurações. Começou com 325 contra 310 HP e defesa 2 contra 3. Escudos absorveram 0 contra 84,4; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 0 p.p. e de HP final -26,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -100 p.p.; contraste de 100 p.p. e alteração de 73,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × mago:** 0/8 mortes contra 5/8; 0 contra 0 limites de tempo. aventureiro manteve 87,2% do DPS efetivo de mago. Por encontro, recebeu 310,1 contra 530,1 HP de dano; recuperou 170,9 contra 260,1 HP (113,8 contra 256 de poções), gastando 42,5 contra 23,5 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 1. Escudos absorveram 0 contra 11,4; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 5 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 62,5 p.p. e de HP final 42,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 62,5 para 0 p.p.; contraste de 62,5 p.p. e alteração de 42,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × arqueiro:** 0/8 mortes contra 7/8; 0 contra 0 limites de tempo. aventureiro manteve 84,3% do DPS efetivo de arqueiro. Por encontro, recebeu 310,1 contra 562,5 HP de dano; recuperou 170,9 contra 256 HP (113,8 contra 256 de poções), gastando 42,5 contra 22,9 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 7 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 87,5 p.p. e de HP final 53,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 87,5 para 0 p.p.; contraste de 87,5 p.p. e alteração de 53,6 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 0/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 233% do DPS efetivo de necromante. Por encontro, recebeu 310,1 contra 535 HP de dano; recuperou 170,9 contra 238 HP (113,8 contra 238 de poções), gastando 42,5 contra 6 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 297 HP e defesa 2 contra 1. Escudos absorveram 0 contra 26; invocações causaram 0 contra 420,6 de dano e receberam 0 contra 142,1. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 8 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 100 p.p. e de HP final 57,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 100 para 0 p.p.; contraste de 100 p.p. e alteração de 57,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × mago:** 0/8 mortes contra 5/8; 0 contra 0 limites de tempo. guerreiro manteve 73,2% do DPS efetivo de mago. Por encontro, recebeu 614,4 contra 530,1 HP de dano; recuperou 570,3 contra 260,1 HP (108,5 contra 256 de poções), gastando 31 contra 23,5 mana total e 14,6 contra 0 HP em conjurações. Começou com 310 contra 320 HP e defesa 3 contra 1. Escudos absorveram 84,4 contra 11,4; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 5 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 62,5 p.p. e de HP final 68,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 62,5 para 100 p.p.; contraste de -37,5 p.p. e alteração de -31,6 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 0/8 mortes contra 7/8; 0 contra 0 limites de tempo. guerreiro manteve 70,8% do DPS efetivo de arqueiro. Por encontro, recebeu 614,4 contra 562,5 HP de dano; recuperou 570,3 contra 256 HP (108,5 contra 256 de poções), gastando 31 contra 22,9 mana total e 14,6 contra 0 HP em conjurações. Começou com 310 contra 320 HP e defesa 3 contra 2. Escudos absorveram 84,4 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 7 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 87,5 p.p. e de HP final 79,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 87,5 para 100 p.p.; contraste de -12,5 p.p. e alteração de -20,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × necromante:** 0/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 195,6% do DPS efetivo de necromante. Por encontro, recebeu 614,4 contra 535 HP de dano; recuperou 570,3 contra 238 HP (108,5 contra 238 de poções), gastando 31 contra 6 mana total e 14,6 contra 0 HP em conjurações. Começou com 310 contra 297 HP e defesa 3 contra 1. Escudos absorveram 84,4 contra 26; invocações causaram 0 contra 420,6 de dano e receberam 0 contra 142,1. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 8 sementes só guerreiro venceu, 0 só necromante venceu; diferença de vitória 100 p.p. e de HP final 84 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 100 para 87,5 p.p.; contraste de 12,5 p.p. e alteração de 11,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: guerreiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × arqueiro:** 5/8 mortes contra 7/8; 0 contra 0 limites de tempo. mago manteve 96,6% do DPS efetivo de arqueiro. Por encontro, recebeu 530,1 contra 562,5 HP de dano; recuperou 260,1 contra 256 HP (256 contra 256 de poções), gastando 23,5 contra 22,9 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 320 HP e defesa 1 contra 2. Escudos absorveram 11,4 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 3 sementes só mago venceu, 1 só arqueiro venceu; diferença de vitória 25 p.p. e de HP final 11,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 25 para 0 p.p.; contraste de 25 p.p. e alteração de 11,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: mago venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × necromante:** 5/8 mortes contra 8/8; 0 contra 0 limites de tempo. mago manteve 267,2% do DPS efetivo de necromante. Por encontro, recebeu 530,1 contra 535 HP de dano; recuperou 260,1 contra 238 HP (256 contra 238 de poções), gastando 23,5 contra 6 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 297 HP e defesa 1 contra 1. Escudos absorveram 11,4 contra 26; invocações causaram 0 contra 420,6 de dano e receberam 0 contra 142,1. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 3 sementes só mago venceu, 0 só necromante venceu; diferença de vitória 37,5 p.p. e de HP final 15,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 37,5 para 0 p.p.; contraste de 37,5 p.p. e alteração de 15,6 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: mago venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**arqueiro × necromante:** 7/8 mortes contra 8/8; 0 contra 0 limites de tempo. arqueiro manteve 276,5% do DPS efetivo de necromante. Por encontro, recebeu 562,5 contra 535 HP de dano; recuperou 256 contra 238 HP (256 contra 238 de poções), gastando 22,9 contra 6 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 297 HP e defesa 2 contra 1. Escudos absorveram 0 contra 26; invocações causaram 0 contra 420,6 de dano e receberam 0 contra 142,1. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só arqueiro venceu, 0 só necromante venceu; diferença de vitória 12,5 p.p. e de HP final 4,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para 0 p.p.; contraste de 12,5 p.p. e alteração de 4,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: arqueiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

### O que mudou ao retirar cada fator

**aventureiro, Sem habilidades da barra:** retirar esse fator perdeu 8 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 57,8 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Sem poções de vida:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 11,7 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem poções de vida:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 15,6 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem habilidades da barra:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 15,6 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem poções de vida:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 4,2 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem habilidades da barra:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 4,2 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 8/8; 0; 0 | 0 | 26,5 | 101,4 (94,8% do completo) | 0 / 0 |
| aventureiro | Sem habilidades da barra | 0/8; 8; 0 | 100 | 57,8 | 50,8 (47,5% do completo) | 8 / 0 |
| aventureiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 2,8 | 107,3 (100,4% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 8/8; 0; 0 | 0 | 3,3 | 86,3 (96,2% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 7/8; 1; 0 | 12,5 | 11,7 | 89 (99,2% do completo) | 1 / 0 |
| guerreiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | -16 | 66,3 (73,9% do completo) | 0 / 0 |
| guerreiro | Defesa plana zerada | 8/8; 0; 0 | 0 | -0,9 | 89,6 (99,9% do completo) | 0 / 0 |
| mago | Sem poções de vida | 0/8; 8; 0 | 37,5 | 15,6 | 127,4 (104% do completo) | 3 / 0 |
| mago | Sem habilidades da barra | 0/8; 8; 0 | 37,5 | 15,6 | 60,5 (49,4% do completo) | 3 / 0 |
| mago | Defesa plana zerada | 3/8; 5; 0 | 0 | 0,9 | 123,6 (100,9% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 0/8; 8; 0 | 12,5 | 4,2 | 147,6 (116,4% do completo) | 1 / 0 |
| arqueiro | Sem habilidades da barra | 0/8; 8; 0 | 12,5 | 4,2 | 80,4 (63,4% do completo) | 1 / 0 |
| arqueiro | Defesa plana zerada | 1/8; 7; 0 | 0 | 0,6 | 125,8 (99,2% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 51,2 (111,6% do completo) | 0 / 0 |
| necromante | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 42,3 (92,2% do completo) | 0 / 0 |
| necromante | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 45,9 (100% do completo) | 0 / 0 |

## nível 30 · normal · atrito

### Onde o desgaste aparece

| Classe | Onda | Chegaram/n inicial | Mortes / limites nesta onda | HP entrada → saída | Mana entrada → saída | Recebido / cura / mana gasta |
|---|---|---|---|---|---|---|
| aventureiro | 1 | 8/8 | 0 / 0 | 325 → 258,3 | 30 → 22,2 | 83 / 16,3 / 17,1 |
| aventureiro | 2 | 8/8 | 0 / 0 | 258,3 → 221,8 | 22,2 → 20,6 | 73,1 / 26,5 / 14 |
| aventureiro | 3 | 8/8 | 0 / 0 | 221,8 → 177,9 | 20,6 → 15,2 | 157 / 102,3 / 20,9 |
| aventureiro | 4 | 8/8 | 1 / 0 | 177,9 → 148,6 | 15,2 → 13,1 | 135,6 / 99,3 / 13,9 |
| aventureiro | 5 | 7/8 | 0 / 0 | 169,9 → 185,6 | 13,1 → 7,6 | 116,3 / 129,4 / 15,6 |
| guerreiro | 1 | 8/8 | 0 / 0 | 310 → 245,3 | 30 → 23,4 | 301,6 / 246,6 / 20,9 |
| guerreiro | 2 | 8/8 | 0 / 0 | 245,3 → 254,5 | 23,4 → 21,9 | 287,5 / 290,8 / 21,5 |
| guerreiro | 3 | 8/8 | 0 / 0 | 254,5 → 251,8 | 21,9 → 22,3 | 160,9 / 148,8 / 14,1 |
| guerreiro | 4 | 8/8 | 0 / 0 | 251,8 → 259,1 | 22,3 → 24,3 | 151,4 / 156,9 / 7,1 |
| guerreiro | 5 | 8/8 | 0 / 3 | 259,1 → 191 | 24,3 → 20,6 | 214,5 / 149 / 16 |
| mago | 1 | 8/8 | 0 / 0 | 320 → 215,6 | 30 → 19,9 | 120,4 / 16 / 24,9 |
| mago | 2 | 8/8 | 1 / 0 | 215,6 → 147,5 | 19,9 → 22,8 | 138,3 / 66,8 / 9,8 |
| mago | 3 | 7/8 | 0 / 0 | 168,6 → 134,9 | 23,7 → 13,7 | 58,3 / 24,6 / 17,7 |
| mago | 4 | 7/8 | 1 / 0 | 134,9 → 113,7 | 13,7 → 23,1 | 117,4 / 94,6 / 4,3 |
| mago | 5 | 6/8 | 2 / 0 | 132,7 → 58,2 | 25,2 → 23,1 | 142,7 / 67,7 / 12,5 |
| arqueiro | 1 | 8/8 | 0 / 0 | 320 → 303,1 | 30 → 16,3 | 16,9 / 0 / 22,5 |
| arqueiro | 2 | 8/8 | 0 / 0 | 303,1 → 264 | 16,3 → 17,8 | 55,1 / 16 / 12,6 |
| arqueiro | 3 | 8/8 | 0 / 0 | 264 → 196,5 | 17,8 → 10,9 | 116,3 / 48 / 18,6 |
| arqueiro | 4 | 8/8 | 1 / 0 | 196,5 → 139,5 | 10,9 → 14,6 | 89,8 / 32 / 9,8 |
| arqueiro | 5 | 7/8 | 0 / 0 | 159,4 → 160,4 | 14 → 12,8 | 74,3 / 73,1 / 15,3 |
| necromante | 1 | 8/8 | 0 / 0 | 297 → 243,8 | 30 → 28,9 | 53,3 / 0 / 15,5 |
| necromante | 2 | 8/8 | 0 / 0 | 243,8 → 234,3 | 28,9 → 29 | 14,5 / 0 / 10,5 |
| necromante | 3 | 8/8 | 0 / 0 | 234,3 → 241,6 | 29 → 27,9 | 7,6 / 3 / 14 |
| necromante | 4 | 8/8 | 0 / 0 | 241,6 → 235,1 | 27,9 → 29,2 | 11,8 / 0 / 6 |
| necromante | 5 | 8/8 | 0 / 0 | 235,1 → 239,3 | 29,2 → 28,9 | 0 / 0 / 5,3 |

Médias de cada onda incluem apenas quem chegou a ela; o denominador inicial mostra a seleção dos sobreviventes. Não compare a vida da onda 5 como se incluísse quem morreu antes.

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 50,7 s | 33,5 s | 4,8 | 4.324,3 | 550,5 | 357,5 | 79,5 | 0 |
| guerreiro | 70,3 s | — | 4,6 | 4.370 | 1.115,9 | 992 | 79,6 | 34,5 |
| mago | 52 s | 45,3 s | 4 | 3.765,4 | 519,4 | 237,8 | 63,3 | 0 |
| arqueiro | 37,7 s | 34,5 s | 4,8 | 4.399 | 343 | 160 | 76,9 | 0 |
| necromante | 49 s | — | 5 | 4.519 | 87,1 | 3 | 51,3 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 51,3 / 127,5 / 178,8 / 0 | 4.324,3 / 0 / 0 | 0 | 0 | 36,7 / 12,7 / 0 / 1,7 / 0 | 1,5 |
| guerreiro | 0 / 821,5 / 170,5 / 0 | 3.846,6 / 523,4 / 0 | 296,6 | 0 | 32,9 / 11,2 / 23,6 / 2 / 0 | 0,5 |
| mago | 0 / 13,8 / 224 / 0 | 3.580,6 / 184,8 / 0 | 62,5 | 0 | 31,6 / 5 / 0 / 2,8 / 0,4 | 2 |
| arqueiro | 0 / 0 / 160 / 0 | 4.310,5 / 88,5 / 0 | 0 | 0 | 32,2 / 8,4 / 0 / 0,8 / 1,2 | 2,5 |
| necromante | 0 / 3 / 0 / 0 | 1.505 / 0 / 3.014 | 39 | 1,9 | 22,8 / 8,5 / 0 / 0 / 0 | 2,8 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 57 / 10,9 | 39,8 / 7,1 / 14,8 | 0 / 0 | — | 30,4 / 44,9 |
| guerreiro | 71,5 / 7,9 | 34,4 / 4,6 / 14,4 | 0,1 / 0 | bloqueado: 697,9 | 39,4 / 70,3 |
| mago | 45 / 7 | 31,4 / 4 / 11,9 | 0,6 / 0,5 | — | 5,3 / 35,2 |
| arqueiro | 59,8 / 10,6 | 45,6 / 7,4 / 17,6 | 0,1 / 1,3 | — | 3,4 / 32,3 |
| necromante | 59,9 / 9,5 | 87 / 12,8 / 36,4 | 3,9 / 0 | — | 26,4 / 29 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 17,3 | 2.180,6 | 0 | 34,5 | 0 | — |
| aventureiro | explosao | 8,5 | 1.087,3 | 0 | 25,5 | 0 | — |
| aventureiro | golpe_atordoante | 5,5 | 382,8 | 0 | 16,5 | 0 | — |
| aventureiro | ataque_basico | 22,8 | 673,6 | 0 | 0 | 0 | — |
| aventureiro | curar | 3 | 0 | 51,3 | 3 | 0 | 17,1 |
| aventureiro | efeito:cura_periodica | 0 | 0 | 127,5 | 0 | 0 | — |
| aventureiro | item:pocao_vida | 1,4 | 0 | 178,8 | 0 | 0 | — |
| guerreiro | investida | 11,5 | 725,5 | 0 | 46 | 0 | — |
| guerreiro | redemoinho | 11,5 | 379,9 | 0 | 0 | 34,5 | — |
| guerreiro | efeito:dano_direto | 0 | 523,4 | 0 | 0 | 0 | — |
| guerreiro | grito_de_guerra | 5,5 | 0 | 0 | 22 | 0 | — |
| guerreiro | ataque_basico | 39,1 | 2.741,3 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 821,5 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 3,9 | 0 | 0 | 11,6 | 0 | — |
| guerreiro | item:pocao_vida | 1,4 | 0 | 170,5 | 0 | 0 | — |
| mago | bola_de_fogo | 5,6 | 755,8 | 0 | 16,9 | 0 | — |
| mago | dardo_arcano | 28,6 | 1.734,1 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 4,9 | 253,3 | 0 | 19,5 | 0 | — |
| mago | raio_em_cadeia | 4,6 | 837,5 | 0 | 23,1 | 0 | — |
| mago | efeito:dano_direto | 0 | 57,8 | 0 | 0 | 0 | — |
| mago | efeito:queimando | 0 | 127 | 0 | 0 | 0 | — |
| mago | efeito:cura | 0 | 0 | 13,8 | 0 | 0 | — |
| mago | item:pocao_vida | 1,8 | 0 | 224 | 0 | 0 | — |
| mago | barreira | 1,3 | 0 | 0 | 3,8 | 0 | — |
| arqueiro | flecha_perfurante | 6,4 | 787,8 | 0 | 25,5 | 0 | — |
| arqueiro | chuva_de_flechas | 4,9 | 667,8 | 0 | 19,5 | 0 | — |
| arqueiro | flecha_venenosa | 4,8 | 390,9 | 0 | 14,3 | 0 | — |
| arqueiro | tiro_em_leque | 5,9 | 702,5 | 0 | 17,6 | 0 | — |
| arqueiro | tiro | 37,9 | 1.761,6 | 0 | 0 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 54,6 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 1,3 | 0 | 160 | 0 | 0 | — |
| arqueiro | efeito:dano_direto | 0 | 33,9 | 0 | 0 | 0 | — |
| necromante | dardo_funesto | 16,8 | 592,3 | 0 | 33,5 | 0 | — |
| necromante | garras_do_ossuario | 8,8 | 359,5 | 0 | 17,5 | 0 | — |
| necromante | toque_funesto | 34,3 | 553,3 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 3.014 | 0 | 0 | 0 | — |
| necromante | dizimo_vital | 0,1 | 0 | 0 | 0,3 | 0 | — |
| necromante | efeito:cura | 0 | 0 | 3 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 1/8 mortes contra 0/8; 0 contra 3 limites de tempo. aventureiro manteve 161,8% do DPS efetivo de guerreiro. Por encontro, recebeu 550,5 contra 1.115,9 HP de dano; recuperou 357,5 contra 992 HP (178,8 contra 170,5 de poções), gastando 79,5 contra 79,6 mana total e 0 contra 34,5 HP em conjurações. Começou com 325 contra 310 HP e defesa 2 contra 3. Escudos absorveram 0 contra 296,6; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 3 sementes só aventureiro venceu, 1 só guerreiro venceu; diferença de vitória 25 p.p. e de HP final -11,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 25 para -100 p.p.; contraste de 125 p.p. e alteração de 88,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × mago:** 1/8 mortes contra 4/8; 0 contra 0 limites de tempo. aventureiro manteve 107,6% do DPS efetivo de mago. Por encontro, recebeu 550,5 contra 519,4 HP de dano; recuperou 357,5 contra 237,8 HP (178,8 contra 224 de poções), gastando 79,5 contra 63,3 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 1. Escudos absorveram 0 contra 62,5; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 3 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 37,5 p.p. e de HP final 36,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 37,5 para 0 p.p.; contraste de 37,5 p.p. e alteração de 36,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × arqueiro:** 1/8 mortes contra 1/8; 0 contra 0 limites de tempo. aventureiro manteve 80,9% do DPS efetivo de arqueiro. Por encontro, recebeu 550,5 contra 343 HP de dano; recuperou 357,5 contra 160 HP (178,8 contra 160 de poções), gastando 79,5 contra 76,9 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só aventureiro venceu, 1 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 6,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 25 p.p.; contraste de -25 p.p. e alteração de -6,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 1/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 91,6% do DPS efetivo de necromante. Por encontro, recebeu 550,5 contra 87,1 HP de dano; recuperou 357,5 contra 3 HP (178,8 contra 0 de poções), gastando 79,5 contra 51,3 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 297 HP e defesa 2 contra 1. Escudos absorveram 0 contra 39; invocações causaram 0 contra 3.014 de dano e receberam 0 contra 406,1. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 1 só necromante venceu; diferença de vitória -12,5 p.p. e de HP final -30,6 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para -87,5 p.p.; contraste de 75 p.p. e alteração de 5,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × mago:** 0/8 mortes contra 4/8; 3 contra 0 limites de tempo. guerreiro manteve 66,5% do DPS efetivo de mago. Por encontro, recebeu 1.115,9 contra 519,4 HP de dano; recuperou 992 contra 237,8 HP (170,5 contra 224 de poções), gastando 79,6 contra 63,3 mana total e 34,5 contra 0 HP em conjurações. Começou com 310 contra 320 HP e defesa 3 contra 1. Escudos absorveram 296,6 contra 62,5; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 3 sementes só guerreiro venceu, 2 só mago venceu; diferença de vitória 12,5 p.p. e de HP final 48 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para 100 p.p.; contraste de -87,5 p.p. e alteração de -52 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 0/8 mortes contra 1/8; 3 contra 0 limites de tempo. guerreiro manteve 50% do DPS efetivo de arqueiro. Por encontro, recebeu 1.115,9 contra 343 HP de dano; recuperou 992 contra 160 HP (170,5 contra 160 de poções), gastando 79,6 contra 76,9 mana total e 34,5 contra 0 HP em conjurações. Começou com 310 contra 320 HP e defesa 3 contra 2. Escudos absorveram 296,6 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só guerreiro venceu, 3 só arqueiro venceu; diferença de vitória -25 p.p. e de HP final 17,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -25 para 100 p.p.; contraste de -125 p.p. e alteração de -82,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: arqueiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × necromante:** 0/8 mortes contra 0/8; 3 contra 0 limites de tempo. guerreiro manteve 56,6% do DPS efetivo de necromante. Por encontro, recebeu 1.115,9 contra 87,1 HP de dano; recuperou 992 contra 3 HP (170,5 contra 0 de poções), gastando 79,6 contra 51,3 mana total e 34,5 contra 0 HP em conjurações. Começou com 310 contra 297 HP e defesa 3 contra 1. Escudos absorveram 296,6 contra 39; invocações causaram 0 contra 3.014 de dano e receberam 0 contra 406,1. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 3 só necromante venceu; diferença de vitória -37,5 p.p. e de HP final -18,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -37,5 para 12,5 p.p.; contraste de -50 p.p. e alteração de -83 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × arqueiro:** 4/8 mortes contra 1/8; 0 contra 0 limites de tempo. mago manteve 75,2% do DPS efetivo de arqueiro. Por encontro, recebeu 519,4 contra 343 HP de dano; recuperou 237,8 contra 160 HP (224 contra 160 de poções), gastando 63,3 contra 76,9 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 320 HP e defesa 1 contra 2. Escudos absorveram 62,5 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 3 só arqueiro venceu; diferença de vitória -37,5 p.p. e de HP final -30,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -37,5 para 0 p.p.; contraste de -37,5 p.p. e alteração de -30,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: arqueiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × necromante:** 4/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 85,2% do DPS efetivo de necromante. Por encontro, recebeu 519,4 contra 87,1 HP de dano; recuperou 237,8 contra 3 HP (224 contra 0 de poções), gastando 63,3 contra 51,3 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 297 HP e defesa 1 contra 1. Escudos absorveram 62,5 contra 39; invocações causaram 0 contra 3.014 de dano e receberam 0 contra 406,1. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 4 só necromante venceu; diferença de vitória -50 p.p. e de HP final -66,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -50 para -100 p.p.; contraste de 50 p.p. e alteração de 13,6 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**arqueiro × necromante:** 1/8 mortes contra 0/8; 0 contra 0 limites de tempo. arqueiro manteve 113,3% do DPS efetivo de necromante. Por encontro, recebeu 343 contra 87,1 HP de dano; recuperou 160 contra 3 HP (160 contra 0 de poções), gastando 76,9 contra 51,3 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 297 HP e defesa 2 contra 1. Escudos absorveram 0 contra 39; invocações causaram 0 contra 3.014 de dano e receberam 0 contra 406,1. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 1 só necromante venceu; diferença de vitória -12,5 p.p. e de HP final -36,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para -87,5 p.p.; contraste de 75 p.p. e alteração de -0,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### O que mudou ao retirar cada fator

**aventureiro, Sem poções de vida:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 23,5 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**aventureiro, Sem habilidades da barra:** retirar esse fator perdeu 7 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 50 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Sem cura do básico:** retirar esse fator perdeu 3 vitórias e ganhou 2 nas mesmas 8 condições iniciais. O kit completo teve 25,2 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Sem poções de vida:** retirar esse fator perdeu 3 vitórias e ganhou 1 nas mesmas 8 condições iniciais. O kit completo teve 26,3 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Defesa plana zerada:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 17,3 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem poções de vida:** retirar esse fator perdeu 4 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 13,6 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem habilidades da barra:** retirar esse fator perdeu 4 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 13,6 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem poções de vida:** retirar esse fator perdeu 4 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 30,3 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem habilidades da barra:** retirar esse fator perdeu 7 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 43,9 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem habilidades da barra:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 44,6 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 5/8; 3; 0 | 25 | 23,5 | 89,7 (100,8% do completo) | 2 / 0 |
| aventureiro | Sem habilidades da barra | 0/8; 8; 0 | 87,5 | 50 | 48,1 (54,1% do completo) | 7 / 0 |
| aventureiro | Defesa plana zerada | 8/8; 0; 0 | -12,5 | -3 | 88,7 (99,7% do completo) | 0 / 1 |
| guerreiro | Sem cura do básico | 4/8; 4; 0 | 12,5 | 25,2 | 54,5 (99,1% do completo) | 3 / 2 |
| guerreiro | Sem poções de vida | 3/8; 4; 1 | 25 | 26,3 | 52 (94,6% do completo) | 3 / 1 |
| guerreiro | Sem habilidades da barra | 8/8; 0; 0 | -37,5 | -38,4 | 63,4 (115,4% do completo) | 0 / 3 |
| guerreiro | Defesa plana zerada | 3/8; 3; 2 | 25 | 17,3 | 51,1 (93% do completo) | 2 / 0 |
| mago | Sem poções de vida | 0/8; 8; 0 | 50 | 13,6 | 79,8 (96,6% do completo) | 4 / 0 |
| mago | Sem habilidades da barra | 0/8; 8; 0 | 50 | 13,6 | 66,2 (80,1% do completo) | 4 / 0 |
| mago | Defesa plana zerada | 4/8; 4; 0 | 0 | 1,4 | 84,1 (101,8% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 3/8; 5; 0 | 50 | 30,3 | 110,2 (100,2% do completo) | 4 / 0 |
| arqueiro | Sem habilidades da barra | 0/8; 8; 0 | 87,5 | 43,9 | 81,1 (73,8% do completo) | 7 / 0 |
| arqueiro | Defesa plana zerada | 7/8; 1; 0 | 0 | -2,3 | 110 (100% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 97,1 (100% do completo) | 0 / 0 |
| necromante | Sem habilidades da barra | 7/8; 1; 0 | 12,5 | 44,6 | 59,3 (61,1% do completo) | 1 / 0 |
| necromante | Defesa plana zerada | 8/8; 0; 0 | 0 | 2,8 | 97,9 (100,8% do completo) | 0 / 0 |

## nível 30 · normal · chefe

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 14 s | — | 1 | 1.213 | 98 | 2,6 | 22,3 | 0 |
| guerreiro | 13,2 s | — | 1 | 1.230 | 61,5 | 65,3 | 12,5 | 7,5 |
| mago | 17,5 s | — | 1 | 1.254 | 18 | 0 | 32 | 0 |
| arqueiro | 10,9 s | — | 1 | 1.206 | 128,1 | 0 | 26,4 | 0 |
| necromante | 22,4 s | — | 1 | 1.269,6 | 39,5 | 0 | 23,5 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 2,6 / 0 / 0 / 0 | 1.213 / 0 / 0 | 0 | 0 | 9,4 / 4,9 / 0,8 / 0 / 0 | 1,4 |
| guerreiro | 0 / 65,3 / 0 / 0 | 1.101,6 / 128,4 / 0 | 18,4 | 0 | 5,4 / 1,3 / 4,6 / 0 / 0 | 0,7 |
| mago | 0 / 0 / 0 / 0 | 1.202,6 / 51,4 / 0 | 0 | 0 | 13,2 / 4,5 / 0,1 / 0 / 0 | 2,1 |
| arqueiro | 0 / 0 / 0 / 0 | 1.170 / 36 / 0 | 0 | 0 | 8,6 / 4 / 1 / 0 / 0 | 2,1 |
| necromante | 0 / 0 / 0 / 0 | 782,1 / 0 / 487,5 | 19,5 | 0 | 10,9 / 7 / 0,3 / 0 / 0 | 2,5 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 13,5 / 1,5 | 11 / 1,8 / 3,4 | 0 / 0 | bloqueado: 1 | 0 / 9,5 |
| guerreiro | 10,5 / 0,1 | 8,5 / 1,3 / 3,9 | 0 / 0 | — | 0 / 10,1 |
| mago | 18,8 / 5,6 | 11,3 / 2,6 / 3,6 | 0,6 / 0,1 | — | 0 / 12,6 |
| arqueiro | 15,4 / 4,4 | 10,8 / 1,9 / 3,6 | 0 / 0,6 | bloqueado: 1,4 | 0 / 8 |
| necromante | 27,9 / 3,1 | 31,5 / 5,4 / 11,9 | 1,9 / 0 | — | 0 / 12,6 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 4,9 | 576,9 | 0 | 9,8 | 0 | — |
| aventureiro | explosao | 2,5 | 409,3 | 0 | 7,5 | 0 | — |
| aventureiro | golpe_atordoante | 1,6 | 72,8 | 0 | 4,9 | 0 | — |
| aventureiro | ataque_basico | 4,4 | 154,1 | 0 | 0 | 0 | — |
| aventureiro | curar | 0,1 | 0 | 2,6 | 0,1 | 0 | 21 |
| guerreiro | investida | 2,1 | 336,9 | 0 | 8,5 | 0 | — |
| guerreiro | redemoinho | 2,5 | 342,9 | 0 | 0 | 7,5 | — |
| guerreiro | efeito:dano_direto | 0 | 128,4 | 0 | 0 | 0 | — |
| guerreiro | grito_de_guerra | 1 | 0 | 0 | 4 | 0 | — |
| guerreiro | ataque_basico | 4,9 | 421,9 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 65,3 | 0 | 0 | — |
| mago | bola_de_fogo | 2,9 | 195,4 | 0 | 8,6 | 0 | — |
| mago | dardo_arcano | 10,6 | 344,4 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 2,9 | 368,4 | 0 | 11,5 | 0 | — |
| mago | raio_em_cadeia | 2,4 | 294,5 | 0 | 11,9 | 0 | — |
| mago | efeito:dano_direto | 0 | 29,4 | 0 | 0 | 0 | — |
| mago | efeito:queimando | 0 | 22 | 0 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 2,4 | 302,5 | 0 | 9,5 | 0 | — |
| arqueiro | chuva_de_flechas | 1,9 | 312,9 | 0 | 7,5 | 0 | — |
| arqueiro | tiro | 8 | 240,4 | 0 | 0 | 0 | — |
| arqueiro | flecha_venenosa | 1,6 | 126,8 | 0 | 4,9 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 18 | 0 | 0 | 0 | — |
| arqueiro | tiro_em_leque | 1,5 | 187,5 | 0 | 4,5 | 0 | — |
| arqueiro | efeito:dano_direto | 0 | 18 | 0 | 0 | 0 | — |
| necromante | dardo_funesto | 7,8 | 309 | 0 | 15,5 | 0 | — |
| necromante | garras_do_ossuario | 4 | 174,3 | 0 | 8 | 0 | — |
| necromante | toque_funesto | 16,1 | 298,9 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 487,5 | 0 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 96,6% do DPS efetivo de guerreiro. Por encontro, recebeu 98 contra 61,5 HP de dano; recuperou 2,6 contra 65,3 HP (0 contra 0 de poções), gastando 22,3 contra 12,5 mana total e 0 contra 7,5 HP em conjurações. Começou com 325 contra 310 HP e defesa 2 contra 3. Escudos absorveram 0 contra 18,4; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 0 p.p. e de HP final -28,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -25 p.p.; contraste de 25 p.p. e alteração de 30,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 132,3% do DPS efetivo de mago. Por encontro, recebeu 98 contra 18 HP de dano; recuperou 2,6 contra 0 HP (0 contra 0 de poções), gastando 22,3 contra 32 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final -23,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -25 p.p.; contraste de 25 p.p. e alteração de -11,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 87,6% do DPS efetivo de arqueiro. Por encontro, recebeu 98 contra 128,1 HP de dano; recuperou 2,6 contra 0 HP (0 contra 0 de poções), gastando 22,3 contra 26,4 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 10,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -25 p.p.; contraste de 25 p.p. e alteração de 43,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 171% do DPS efetivo de necromante. Por encontro, recebeu 98 contra 39,5 HP de dano; recuperou 2,6 contra 0 HP (0 contra 0 de poções), gastando 22,3 contra 23,5 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 297 HP e defesa 2 contra 1. Escudos absorveram 0 contra 19,5; invocações causaram 0 contra 487,5 de dano e receberam 0 contra 97,9. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -16 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -25 p.p.; contraste de 25 p.p. e alteração de -4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × mago:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 136,9% do DPS efetivo de mago. Por encontro, recebeu 61,5 contra 18 HP de dano; recuperou 65,3 contra 0 HP (0 contra 0 de poções), gastando 12,5 contra 32 mana total e 7,5 contra 0 HP em conjurações. Começou com 310 contra 320 HP e defesa 3 contra 1. Escudos absorveram 18,4 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 4,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -41,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 90,6% do DPS efetivo de arqueiro. Por encontro, recebeu 61,5 contra 128,1 HP de dano; recuperou 65,3 contra 0 HP (0 contra 0 de poções), gastando 12,5 contra 26,4 mana total e 7,5 contra 0 HP em conjurações. Começou com 310 contra 320 HP e defesa 3 contra 2. Escudos absorveram 18,4 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 38,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 13,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 177% do DPS efetivo de necromante. Por encontro, recebeu 61,5 contra 39,5 HP de dano; recuperou 65,3 contra 0 HP (0 contra 0 de poções), gastando 12,5 contra 23,5 mana total e 7,5 contra 0 HP em conjurações. Começou com 310 contra 297 HP e defesa 3 contra 1. Escudos absorveram 18,4 contra 19,5; invocações causaram 0 contra 487,5 de dano e receberam 0 contra 97,9. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final 12,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -34,6 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 66,2% do DPS efetivo de arqueiro. Por encontro, recebeu 18 contra 128,1 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 32 contra 26,4 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 320 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 34,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 55,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 129,3% do DPS efetivo de necromante. Por encontro, recebeu 18 contra 39,5 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 32 contra 23,5 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 297 HP e defesa 1 contra 1. Escudos absorveram 0 contra 19,5; invocações causaram 0 contra 487,5 de dano e receberam 0 contra 97,9. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final 7,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 7,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**arqueiro × necromante:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. arqueiro manteve 195,3% do DPS efetivo de necromante. Por encontro, recebeu 128,1 contra 39,5 HP de dano; recuperou 0 contra 0 HP (0 contra 0 de poções), gastando 26,4 contra 23,5 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 297 HP e defesa 2 contra 1. Escudos absorveram 0 contra 19,5; invocações causaram 0 contra 487,5 de dano e receberam 0 contra 97,9. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 0 só necromante venceu; diferença de vitória 0 p.p. e de HP final -26,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de -47,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### O que mudou ao retirar cada fator

**aventureiro, Sem habilidades da barra:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 29,5 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 98,1 (100% do completo) | 0 / 0 |
| aventureiro | Sem habilidades da barra | 6/8; 2; 0 | 25 | 29,5 | 41,7 (42,5% do completo) | 2 / 0 |
| aventureiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 0,9 | 98,1 (100% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 8/8; 0; 0 | 0 | 1,2 | 101,5 (100% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 101,5 (100% do completo) | 0 / 0 |
| guerreiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | -1,2 | 61,8 (60,9% do completo) | 0 / 0 |
| guerreiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 0,2 | 101,5 (100% do completo) | 0 / 0 |
| mago | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 74,1 (100% do completo) | 0 / 0 |
| mago | Sem habilidades da barra | 8/8; 0; 0 | 0 | 40,7 | 51,8 (69,9% do completo) | 0 / 0 |
| mago | Defesa plana zerada | 8/8; 0; 0 | 0 | 0,1 | 74,1 (100% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 112 (100% do completo) | 0 / 0 |
| arqueiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | -14,4 | 77,7 (69,4% do completo) | 0 / 0 |
| arqueiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 1 | 112 (100% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 8/8; 0; 0 | 0 | 0 | 57,3 (100% do completo) | 0 / 0 |
| necromante | Sem habilidades da barra | 8/8; 0; 0 | 0 | 33,4 | 39,3 (68,6% do completo) | 0 / 0 |
| necromante | Defesa plana zerada | 8/8; 0; 0 | 0 | 0,2 | 57,3 (100% do completo) | 0 / 0 |

## nível 30 · pesadelo · duelo

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 14 s | — | 1 | 917 | 208,6 | 73,8 | 25,1 | 0 |
| guerreiro | 37,5 s | 28,9 s | 0,3 | 760,1 | 634,5 | 391,4 | 34,5 | 14,3 |
| mago | 16,3 s | 17,8 s | 0,8 | 899,1 | 217,4 | 48 | 25,3 | 0 |
| arqueiro | 13,8 s | — | 1 | 917 | 124,9 | 32 | 30,8 | 0 |
| necromante | 27,7 s | 31,1 s | 0,9 | 903,9 | 308,6 | 148,8 | 19,8 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 5 / 3,8 / 65 / 0 | 917 / 0 / 0 | 0 | 0 | 11,3 / 1,8 / 0 / 0 / 0 | 0,8 |
| guerreiro | 0 / 143,4 / 248 / 0 | 674,8 / 85,4 / 0 | 153,3 | 0 | 12,7 / 0,4 / 10 / 5,4 / 0 | 0 |
| mago | 0 / 0 / 48 / 0 | 821 / 78,1 / 0 | 0 | 0 | 11,6 / 3,7 / 0 / 0 / 0 | 2,1 |
| arqueiro | 0 / 0 / 32 / 0 | 886,1 / 30,9 / 0 | 0 | 0 | 11 / 4,1 / 0 / 0 / 0 | 2,2 |
| necromante | 0 / 0 / 148,8 / 0 | 474,5 / 0 / 429,4 | 22,8 | 0 | 12,9 / 3 / 0 / 0,8 / 0 | 1,8 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 16,6 / 1,5 | 14,9 / 3,4 / 4,9 | 0 / 0 | — | 0 / 11,1 |
| guerreiro | 28,3 / 3,9 | 11,5 / 1,6 / 4,8 | 0 / 0 | bloqueado: 238,9 | 0 / 24,6 |
| mago | 16 / 2,9 | 10,9 / 1,6 / 4,4 | 0,3 / 0,3 | — | 0 / 11,8 |
| arqueiro | 21,1 / 5,6 | 14,3 / 2,4 / 4,8 | 0 / 0,5 | — | 0 / 8,8 |
| necromante | 32,1 / 3,1 | 38,8 / 6,8 / 13,9 | 1,3 / 0 | — | 0 / 9,8 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 5,5 | 435,1 | 0 | 11 | 0 | — |
| aventureiro | explosao | 2,6 | 182,3 | 0 | 7,9 | 0 | — |
| aventureiro | golpe_atordoante | 2 | 127,1 | 0 | 6 | 0 | — |
| aventureiro | ataque_basico | 6,3 | 172,5 | 0 | 0 | 0 | — |
| aventureiro | curar | 0,3 | 0 | 5 | 0,3 | 0 | 20 |
| aventureiro | efeito:cura_periodica | 0 | 0 | 3,8 | 0 | 0 | — |
| aventureiro | item:pocao_vida | 0,5 | 0 | 65 | 0 | 0 | — |
| guerreiro | investida | 4,8 | 88,5 | 0 | 19 | 0 | — |
| guerreiro | redemoinho | 4,8 | 0 | 0 | 0 | 14,3 | — |
| guerreiro | efeito:dano_direto | 0 | 85,4 | 0 | 0 | 0 | — |
| guerreiro | grito_de_guerra | 2,4 | 0 | 0 | 9,5 | 0 | — |
| guerreiro | escudo_de_ferro | 2 | 0 | 0 | 6 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 143,4 | 0 | 0 | — |
| guerreiro | ataque_basico | 14,4 | 586,3 | 0 | 0 | 0 | — |
| guerreiro | item:pocao_vida | 2 | 0 | 248 | 0 | 0 | — |
| mago | bola_de_fogo | 2,3 | 235,4 | 0 | 6,8 | 0 | — |
| mago | dardo_arcano | 9,6 | 324,1 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 2,1 | 30,6 | 0 | 8,5 | 0 | — |
| mago | raio_em_cadeia | 2 | 230,9 | 0 | 10 | 0 | — |
| mago | efeito:dano_direto | 0 | 15,3 | 0 | 0 | 0 | — |
| mago | efeito:queimando | 0 | 62,9 | 0 | 0 | 0 | — |
| mago | item:pocao_vida | 0,4 | 0 | 48 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 2,6 | 176,5 | 0 | 10,5 | 0 | — |
| arqueiro | chuva_de_flechas | 1,9 | 194,4 | 0 | 7,5 | 0 | — |
| arqueiro | flecha_venenosa | 1,9 | 110,5 | 0 | 5,6 | 0 | — |
| arqueiro | tiro_em_leque | 2,4 | 192,8 | 0 | 7,1 | 0 | — |
| arqueiro | tiro | 12,4 | 212 | 0 | 0 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 24 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 0,3 | 0 | 32 | 0 | 0 | — |
| arqueiro | efeito:dano_direto | 0 | 6,9 | 0 | 0 | 0 | — |
| necromante | dardo_funesto | 6,4 | 131,5 | 0 | 12,8 | 0 | — |
| necromante | garras_do_ossuario | 3,5 | 85,8 | 0 | 7 | 0 | — |
| necromante | toque_funesto | 22,3 | 257,3 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 429,4 | 0 | 0 | 0 | — |
| necromante | item:pocao_vida | 1,3 | 0 | 148,8 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 0/8 mortes contra 6/8; 0 contra 0 limites de tempo. aventureiro manteve 265% do DPS efetivo de guerreiro. Por encontro, recebeu 208,6 contra 634,5 HP de dano; recuperou 73,8 contra 391,4 HP (65 contra 248 de poções), gastando 25,1 contra 34,5 mana total e 0 contra 14,3 HP em conjurações. Começou com 325 contra 310 HP e defesa 2 contra 3. Escudos absorveram 0 contra 153,3; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 6 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 75 p.p. e de HP final 41,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 75 para -37,5 p.p.; contraste de 112,5 p.p. e alteração de 90,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × mago:** 0/8 mortes contra 2/8; 0 contra 0 limites de tempo. aventureiro manteve 115,8% do DPS efetivo de mago. Por encontro, recebeu 208,6 contra 217,4 HP de dano; recuperou 73,8 contra 48 HP (65 contra 48 de poções), gastando 25,1 contra 25,3 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 2 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 25 p.p. e de HP final 11,4 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 25 para -50 p.p.; contraste de 75 p.p. e alteração de 39 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 93,1% do DPS efetivo de arqueiro. Por encontro, recebeu 208,6 contra 124,9 HP de dano; recuperou 73,8 contra 32 HP (65 contra 32 de poções), gastando 25,1 contra 30,8 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final -12,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -87,5 p.p.; contraste de 87,5 p.p. e alteração de 36,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 0/8 mortes contra 1/8; 0 contra 0 limites de tempo. aventureiro manteve 211,5% do DPS efetivo de necromante. Por encontro, recebeu 208,6 contra 308,6 HP de dano; recuperou 73,8 contra 148,8 HP (65 contra 148,8 de poções), gastando 25,1 contra 19,8 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 297 HP e defesa 2 contra 1. Escudos absorveram 0 contra 22,8; invocações causaram 0 contra 429,4 de dano e receberam 0 contra 125,4. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 12,5 p.p. e de HP final 12,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para 50 p.p.; contraste de -37,5 p.p. e alteração de -10,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × mago:** 6/8 mortes contra 2/8; 0 contra 0 limites de tempo. guerreiro manteve 43,7% do DPS efetivo de mago. Por encontro, recebeu 634,5 contra 217,4 HP de dano; recuperou 391,4 contra 48 HP (248 contra 48 de poções), gastando 34,5 contra 25,3 mana total e 14,3 contra 0 HP em conjurações. Começou com 310 contra 320 HP e defesa 3 contra 1. Escudos absorveram 153,3 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só guerreiro venceu, 5 só mago venceu; diferença de vitória -50 p.p. e de HP final -30,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -50 para -12,5 p.p.; contraste de -37,5 p.p. e alteração de -51,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: mago venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × arqueiro:** 6/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 35,1% do DPS efetivo de arqueiro. Por encontro, recebeu 634,5 contra 124,9 HP de dano; recuperou 391,4 contra 32 HP (248 contra 32 de poções), gastando 34,5 contra 30,8 mana total e 14,3 contra 0 HP em conjurações. Começou com 310 contra 320 HP e defesa 3 contra 2. Escudos absorveram 153,3 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 6 só arqueiro venceu; diferença de vitória -75 p.p. e de HP final -54 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -75 para -50 p.p.; contraste de -25 p.p. e alteração de -54 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: arqueiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × necromante:** 6/8 mortes contra 1/8; 0 contra 0 limites de tempo. guerreiro manteve 79,8% do DPS efetivo de necromante. Por encontro, recebeu 634,5 contra 308,6 HP de dano; recuperou 391,4 contra 148,8 HP (248 contra 148,8 de poções), gastando 34,5 contra 19,8 mana total e 14,3 contra 0 HP em conjurações. Começou com 310 contra 297 HP e defesa 3 contra 1. Escudos absorveram 153,3 contra 22,8; invocações causaram 0 contra 429,4 de dano e receberam 0 contra 125,4. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 5 só necromante venceu; diferença de vitória -62,5 p.p. e de HP final -29,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -62,5 para 25 p.p.; contraste de -87,5 p.p. e alteração de -71,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × arqueiro:** 2/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 80,4% do DPS efetivo de arqueiro. Por encontro, recebeu 217,4 contra 124,9 HP de dano; recuperou 48 contra 32 HP (48 contra 32 de poções), gastando 25,3 contra 30,8 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 320 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 2 só arqueiro venceu; diferença de vitória -25 p.p. e de HP final -23,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -25 para -37,5 p.p.; contraste de 12,5 p.p. e alteração de -2,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: arqueiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × necromante:** 2/8 mortes contra 1/8; 0 contra 0 limites de tempo. mago manteve 182,6% do DPS efetivo de necromante. Por encontro, recebeu 217,4 contra 308,6 HP de dano; recuperou 48 contra 148,8 HP (48 contra 148,8 de poções), gastando 25,3 contra 19,8 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 297 HP e defesa 1 contra 1. Escudos absorveram 0 contra 22,8; invocações causaram 0 contra 429,4 de dano e receberam 0 contra 125,4. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só mago venceu, 2 só necromante venceu; diferença de vitória -12,5 p.p. e de HP final 0,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para 37,5 p.p.; contraste de -50 p.p. e alteração de -19,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**arqueiro × necromante:** 0/8 mortes contra 1/8; 0 contra 0 limites de tempo. arqueiro manteve 227% do DPS efetivo de necromante. Por encontro, recebeu 124,9 contra 308,6 HP de dano; recuperou 32 contra 148,8 HP (32 contra 148,8 de poções), gastando 30,8 contra 19,8 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 297 HP e defesa 2 contra 1. Escudos absorveram 0 contra 22,8; invocações causaram 0 contra 429,4 de dano e receberam 0 contra 125,4. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só arqueiro venceu, 0 só necromante venceu; diferença de vitória 12,5 p.p. e de HP final 24,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para 75 p.p.; contraste de -62,5 p.p. e alteração de -17,4 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: arqueiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

### O que mudou ao retirar cada fator

**aventureiro, Sem habilidades da barra:** retirar esse fator perdeu 7 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 57,7 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**aventureiro, Defesa plana zerada:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 6,3 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Sem poções de vida:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 17 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem poções de vida:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 9,8 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem habilidades da barra:** retirar esse fator perdeu 2 vitórias e ganhou 1 nas mesmas 8 condições iniciais. O kit completo teve 18,7 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem poções de vida:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 3,7 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem poções de vida:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 21,4 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem habilidades da barra:** retirar esse fator perdeu 6 vitórias e ganhou 1 nas mesmas 8 condições iniciais. O kit completo teve 38,3 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 8/8; 0; 0 | 0 | 10,9 | 63,1 (95,8% do completo) | 0 / 0 |
| aventureiro | Sem habilidades da barra | 1/8; 7; 0 | 87,5 | 57,7 | 28 (42,5% do completo) | 7 / 0 |
| aventureiro | Defesa plana zerada | 7/8; 1; 0 | 12,5 | 6,3 | 65,1 (98,9% do completo) | 1 / 0 |
| guerreiro | Sem cura do básico | 3/8; 5; 0 | -12,5 | -4,6 | 27 (108,6% do completo) | 0 / 1 |
| guerreiro | Sem poções de vida | 0/8; 8; 0 | 25 | 17 | 26,9 (108,1% do completo) | 2 / 0 |
| guerreiro | Sem habilidades da barra | 4/8; 4; 0 | -25 | -33 | 39 (157,1% do completo) | 1 / 3 |
| guerreiro | Defesa plana zerada | 2/8; 6; 0 | 0 | 1 | 24,7 (99,4% do completo) | 0 / 0 |
| mago | Sem poções de vida | 5/8; 3; 0 | 12,5 | 9,8 | 56,4 (99,1% do completo) | 1 / 0 |
| mago | Sem habilidades da barra | 5/8; 3; 0 | 12,5 | 18,7 | 40,1 (70,5% do completo) | 2 / 1 |
| mago | Defesa plana zerada | 6/8; 2; 0 | 0 | 0,6 | 56,9 (100% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 7/8; 1; 0 | 12,5 | 3,7 | 71,6 (101,2% do completo) | 1 / 0 |
| arqueiro | Sem habilidades da barra | 8/8; 0; 0 | 0 | 21 | 49,3 (69,7% do completo) | 0 / 0 |
| arqueiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 1,2 | 70,7 (100% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 4/8; 4; 0 | 37,5 | 21,4 | 31,3 (100,5% do completo) | 3 / 0 |
| necromante | Sem habilidades da barra | 2/8; 6; 0 | 62,5 | 38,3 | 23,8 (76,5% do completo) | 6 / 1 |
| necromante | Defesa plana zerada | 7/8; 1; 0 | 0 | 1,2 | 31,1 (100% do completo) | 0 / 0 |

## nível 30 · pesadelo · pressao

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 35,5 s | 23,6 s | 0,3 | 1.916,8 | 556,9 | 278 | 42,8 | 0 |
| guerreiro | — | 19,3 s | 0 | 1.086,1 | 718,5 | 417,9 | 22 | 9,4 |
| mago | — | 9,5 s | 0 | 724,1 | 560 | 240 | 12 | 0 |
| arqueiro | — | 10,5 s | 0 | 931,5 | 576 | 256 | 13,6 | 0 |
| necromante | 62,2 s | 14,7 s | 0,1 | 684 | 550,6 | 254,9 | 13,3 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 23,3 / 43,5 / 211,3 / 0 | 1.916,8 / 0 / 0 | 0 | 0 | 19,5 / 5,7 / 0 / 2,3 / 0 | 1,2 |
| guerreiro | 0 / 169,9 / 248 / 0 | 845,1 / 241 / 0 | 89,8 | 0 | 7,8 / 0,4 / 6,1 / 3,4 / 0 | 0,1 |
| mago | 0 / 0 / 240 / 0 | 644,1 / 80 / 0 | 0 | 0 | 6,3 / 5,9 / 0 / 0,4 / 0 | 1 |
| arqueiro | 0 / 0 / 256 / 0 | 895,5 / 36 / 0 | 0 | 0 | 8,2 / 4,3 / 0 / 1,1 / 0 | 1,5 |
| necromante | 0 / 16,9 / 238 / 0 | 344 / 0 / 340 | 52 | 11,3 | 9,2 / 2,8 / 0 / 4,1 / 0 | 2,2 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 29,9 / 4,1 | 27,6 / 4,1 / 11 | 0 / 0 | — | 0 / 20,1 |
| guerreiro | 16,6 / 1,5 | 10,4 / 1,4 / 4,3 | 0 / 0 | bloqueado: 143,6 | 0 / 14,5 |
| mago | 9,4 / 1,3 | 9,8 / 1,5 / 3,5 | 0 / 0 | — | 0 / 6,1 |
| arqueiro | 15,1 / 1 | 16,8 / 2,5 / 6,8 | 0 / 0 | — | 0 / 5,1 |
| necromante | 22,3 / 1,6 | 25,9 / 3 / 9,8 | 1,1 / 0 | sem_invocacao: 56,1 | 9,8 / 7,1 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 9,1 | 793,6 | 0 | 18,3 | 0 | — |
| aventureiro | explosao | 4,5 | 542,3 | 0 | 13,5 | 0 | — |
| aventureiro | golpe_atordoante | 3,1 | 231,9 | 0 | 9,4 | 0 | — |
| aventureiro | ataque_basico | 11,5 | 349 | 0 | 0 | 0 | — |
| aventureiro | item:pocao_vida | 1,6 | 0 | 211,3 | 0 | 0 | — |
| aventureiro | curar | 1,6 | 0 | 23,3 | 1,6 | 0 | 14,3 |
| aventureiro | efeito:cura_periodica | 0 | 0 | 43,5 | 0 | 0 | — |
| guerreiro | investida | 3 | 88,5 | 0 | 12 | 0 | — |
| guerreiro | redemoinho | 3,1 | 398 | 0 | 0 | 9,4 | — |
| guerreiro | efeito:dano_direto | 0 | 241 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 169,9 | 0 | 0 | — |
| guerreiro | grito_de_guerra | 1,8 | 0 | 0 | 7 | 0 | — |
| guerreiro | item:pocao_vida | 2 | 0 | 248 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 1 | 0 | 0 | 3 | 0 | — |
| guerreiro | ataque_basico | 7,8 | 358,6 | 0 | 0 | 0 | — |
| mago | bola_de_fogo | 1 | 225,5 | 0 | 3 | 0 | — |
| mago | dardo_arcano | 6,4 | 217 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 1 | 0 | 0 | 4 | 0 | — |
| mago | efeito:dano_direto | 0 | 15,9 | 0 | 0 | 0 | — |
| mago | raio_em_cadeia | 1 | 201,6 | 0 | 5 | 0 | — |
| mago | efeito:queimando | 0 | 64,1 | 0 | 0 | 0 | — |
| mago | item:pocao_vida | 1,9 | 0 | 240 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 1 | 0 | 0 | 4 | 0 | — |
| arqueiro | chuva_de_flechas | 1 | 229,6 | 0 | 4 | 0 | — |
| arqueiro | tiro | 11,3 | 377,4 | 0 | 0 | 0 | — |
| arqueiro | flecha_venenosa | 1 | 87,1 | 0 | 3 | 0 | — |
| arqueiro | tiro_em_leque | 0,9 | 201,4 | 0 | 2,6 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 36 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 2 | 0 | 256 | 0 | 0 | — |
| necromante | dardo_funesto | 3,6 | 80,5 | 0 | 7,3 | 0 | — |
| necromante | garras_do_ossuario | 2 | 55 | 0 | 4 | 0 | — |
| necromante | toque_funesto | 15,6 | 208,5 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 340 | 0 | 0 | 0 | — |
| necromante | efeito:cura | 0 | 0 | 16,9 | 0 | 0 | — |
| necromante | item:pocao_vida | 2 | 0 | 238 | 0 | 0 | — |
| necromante | dizimo_vital | 0,6 | 0 | 0 | 1,3 | 0 | — |
| necromante | comando_sepulcral | 0,4 | 0 | 0 | 0,8 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 6/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 126,8% do DPS efetivo de guerreiro. Por encontro, recebeu 556,9 contra 718,5 HP de dano; recuperou 278 contra 417,9 HP (211,3 contra 248 de poções), gastando 42,8 contra 22 mana total e 0 contra 9,4 HP em conjurações. Começou com 325 contra 310 HP e defesa 2 contra 3. Escudos absorveram 0 contra 89,8; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 2 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 25 p.p. e de HP final 14,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 25 para 0 p.p.; contraste de 25 p.p. e alteração de 14,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × mago:** 6/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 100,4% do DPS efetivo de mago. Por encontro, recebeu 556,9 contra 560 HP de dano; recuperou 278 contra 240 HP (211,3 contra 240 de poções), gastando 42,8 contra 12 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 2 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 25 p.p. e de HP final 14,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 25 para 0 p.p.; contraste de 25 p.p. e alteração de 14,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × arqueiro:** 6/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 86,9% do DPS efetivo de arqueiro. Por encontro, recebeu 556,9 contra 576 HP de dano; recuperou 278 contra 256 HP (211,3 contra 256 de poções), gastando 42,8 contra 13,6 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 2 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 25 p.p. e de HP final 14,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 25 para 0 p.p.; contraste de 25 p.p. e alteração de 14,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 6/8 mortes contra 7/8; 0 contra 0 limites de tempo. aventureiro manteve 238,7% do DPS efetivo de necromante. Por encontro, recebeu 556,9 contra 550,6 HP de dano; recuperou 278 contra 254,9 HP (211,3 contra 238 de poções), gastando 42,8 contra 13,3 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 297 HP e defesa 2 contra 1. Escudos absorveram 0 contra 52; invocações causaram 0 contra 340 de dano e receberam 0 contra 159. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 2 sementes só aventureiro venceu, 1 só necromante venceu; diferença de vitória 12,5 p.p. e de HP final 10,5 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 12,5 para 0 p.p.; contraste de 12,5 p.p. e alteração de 10,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × mago:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 79,2% do DPS efetivo de mago. Por encontro, recebeu 718,5 contra 560 HP de dano; recuperou 417,9 contra 240 HP (248 contra 240 de poções), gastando 22 contra 12 mana total e 9,4 contra 0 HP em conjurações. Começou com 310 contra 320 HP e defesa 3 contra 1. Escudos absorveram 89,8 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 68,5% do DPS efetivo de arqueiro. Por encontro, recebeu 718,5 contra 576 HP de dano; recuperou 417,9 contra 256 HP (248 contra 256 de poções), gastando 22 contra 13,6 mana total e 9,4 contra 0 HP em conjurações. Começou com 310 contra 320 HP e defesa 3 contra 2. Escudos absorveram 89,8 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × necromante:** 8/8 mortes contra 7/8; 0 contra 0 limites de tempo. guerreiro manteve 188,2% do DPS efetivo de necromante. Por encontro, recebeu 718,5 contra 550,6 HP de dano; recuperou 417,9 contra 254,9 HP (248 contra 238 de poções), gastando 22 contra 13,3 mana total e 9,4 contra 0 HP em conjurações. Começou com 310 contra 297 HP e defesa 3 contra 1. Escudos absorveram 89,8 contra 52; invocações causaram 0 contra 340 de dano e receberam 0 contra 159. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 1 só necromante venceu; diferença de vitória -12,5 p.p. e de HP final -3,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para 0 p.p.; contraste de -12,5 p.p. e alteração de -3,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. mago manteve 86,6% do DPS efetivo de arqueiro. Por encontro, recebeu 560 contra 576 HP de dano; recuperou 240 contra 256 HP (240 contra 256 de poções), gastando 12 contra 13,6 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 320 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × necromante:** 8/8 mortes contra 7/8; 0 contra 0 limites de tempo. mago manteve 237,7% do DPS efetivo de necromante. Por encontro, recebeu 560 contra 550,6 HP de dano; recuperou 240 contra 254,9 HP (240 contra 238 de poções), gastando 12 contra 13,3 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 297 HP e defesa 1 contra 1. Escudos absorveram 0 contra 52; invocações causaram 0 contra 340 de dano e receberam 0 contra 159. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 1 só necromante venceu; diferença de vitória -12,5 p.p. e de HP final -3,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para 0 p.p.; contraste de -12,5 p.p. e alteração de -3,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**arqueiro × necromante:** 8/8 mortes contra 7/8; 0 contra 0 limites de tempo. arqueiro manteve 274,5% do DPS efetivo de necromante. Por encontro, recebeu 576 contra 550,6 HP de dano; recuperou 256 contra 254,9 HP (256 contra 238 de poções), gastando 13,6 contra 13,3 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 297 HP e defesa 2 contra 1. Escudos absorveram 0 contra 52; invocações causaram 0 contra 340 de dano e receberam 0 contra 159. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 1 só necromante venceu; diferença de vitória -12,5 p.p. e de HP final -3,7 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para 0 p.p.; contraste de -12,5 p.p. e alteração de -3,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### O que mudou ao retirar cada fator

**aventureiro, Sem habilidades da barra:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 14,2 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem poções de vida:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 3,7 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem habilidades da barra:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 3,7 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 2/8; 6; 0 | 0 | 8 | 84,2 (109,8% do completo) | 1 / 1 |
| aventureiro | Sem habilidades da barra | 0/8; 8; 0 | 25 | 14,2 | 29,2 (38,1% do completo) | 2 / 0 |
| aventureiro | Defesa plana zerada | 2/8; 6; 0 | 0 | 5,2 | 74,9 (97,6% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 0/8; 8; 0 | 0 | 0 | 59,7 (98,8% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 55,6 (92% do completo) | 0 / 0 |
| guerreiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 42,3 (69,9% do completo) | 0 / 0 |
| guerreiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 58 (96% do completo) | 0 / 0 |
| mago | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 85,3 (111,7% do completo) | 0 / 0 |
| mago | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 31 (40,6% do completo) | 0 / 0 |
| mago | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 76,6 (100,4% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 99,7 (113% do completo) | 0 / 0 |
| arqueiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 48,7 (55,2% do completo) | 0 / 0 |
| arqueiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 89,6 (101,6% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 0/8; 8; 0 | 12,5 | 3,7 | 32,7 (101,7% do completo) | 1 / 0 |
| necromante | Sem habilidades da barra | 0/8; 8; 0 | 12,5 | 3,7 | 22,8 (71% do completo) | 1 / 0 |
| necromante | Defesa plana zerada | 1/8; 7; 0 | 0 | -7,2 | 35 (109% do completo) | 0 / 0 |

## nível 30 · pesadelo · atrito

### Onde o desgaste aparece

| Classe | Onda | Chegaram/n inicial | Mortes / limites nesta onda | HP entrada → saída | Mana entrada → saída | Recebido / cura / mana gasta |
|---|---|---|---|---|---|---|
| aventureiro | 1 | 8/8 | 1 / 0 | 325 → 185 | 30 → 19,9 | 178,6 / 38,6 / 24 |
| aventureiro | 2 | 7/8 | 0 / 0 | 211,4 → 199,1 | 19,9 → 13,6 | 204,9 / 182,3 / 24,9 |
| aventureiro | 3 | 7/8 | 2 / 0 | 199,1 → 110,4 | 13,6 → 6,1 | 286,9 / 190 / 24,1 |
| aventureiro | 4 | 5/8 | 3 / 0 | 154,6 → 51,6 | 7,2 → 4 | 203,8 / 97,2 / 15,8 |
| aventureiro | 5 | 2/8 | 2 / 0 | 129 → 0 | 3,5 → 1,8 | 190 / 50,5 / 10 |
| guerreiro | 1 | 8/8 | 7 / 0 | 310 → 20,4 | 30 → 18,6 | 643,1 / 367 / 31,5 |
| guerreiro | 2 | 1/8 | 1 / 0 | 163 → 0 | 23 → 18,5 | 225 / 56 / 15 |
| mago | 1 | 8/8 | 3 / 0 | 320 → 104,4 | 30 → 27,4 | 407,6 / 192 / 24,9 |
| mago | 2 | 5/8 | 5 / 0 | 167 → 0 | 29 → 24,9 | 223,4 / 53,4 / 14 |
| arqueiro | 1 | 8/8 | 0 / 0 | 320 → 268,5 | 30 → 15,5 | 83,5 / 32 / 30,3 |
| arqueiro | 2 | 8/8 | 2 / 0 | 268,5 → 97,9 | 15,5 → 27,1 | 299,8 / 128 / 12,8 |
| arqueiro | 3 | 6/8 | 4 / 0 | 130,5 → 31,2 | 27,8 → 17,5 | 206 / 106,7 / 25,3 |
| arqueiro | 4 | 2/8 | 2 / 0 | 93,5 → 0 | 15,5 → 19,8 | 95 / 0 / 5 |
| necromante | 1 | 8/8 | 2 / 0 | 297 → 182 | 30 → 29,9 | 219,1 / 104,1 / 22,5 |
| necromante | 2 | 6/8 | 0 / 0 | 242,7 → 193,5 | 29,8 → 29,1 | 109,7 / 59,5 / 14,7 |
| necromante | 3 | 6/8 | 0 / 0 | 193,5 → 183,5 | 29,1 → 29,3 | 47 / 18 / 26,7 |
| necromante | 4 | 6/8 | 2 / 1 | 183,5 → 108,7 | 29,3 → 29,3 | 124,5 / 44,2 / 7 |
| necromante | 5 | 3/8 | 0 / 2 | 169 → 128,7 | 28,7 → 30 | 87 / 39,7 / 4 |

Médias de cada onda incluem apenas quem chegou a ela; o denominador inicial mostra a seleção dos sobreviventes. Não compare a vida da onda 5 como se incluísse quem morreu antes.

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | — | 54,5 s | 2,6 | 2.686,1 | 783,8 | 437,8 | 79,3 | 0 |
| guerreiro | — | 26,9 s | 0,1 | 713,4 | 671,3 | 374 | 33,4 | 13,9 |
| mago | — | 30,2 s | 0,6 | 1.147,8 | 547,3 | 225,4 | 33,6 | 0 |
| arqueiro | — | 39,8 s | 2 | 2.281,6 | 561,5 | 240 | 63,3 | 0 |
| necromante | 83,9 s | 73,6 s | 2,8 | 3.043,1 | 462,6 | 210,3 | 60,3 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 66,5 / 176,3 / 195 / 0 | 2.686,1 / 0 / 0 | 0 | 0 | 37,4 / 11,5 / 0 / 5,8 / 0,9 | 1,3 |
| guerreiro | 0 / 126 / 248 / 0 | 626,3 / 87,1 / 0 | 133,4 | 0 | 11,4 / 0,4 / 9,2 / 6,4 / 0 | 0 |
| mago | 0 / 1,4 / 224 / 0 | 1.072,6 / 75,1 / 0 | 6,3 | 0 | 18 / 4,4 / 0 / 3,5 / 0 | 1,9 |
| arqueiro | 0 / 0 / 240 / 0 | 2.228,8 / 52,9 / 0 | 0 | 0 | 29,1 / 6,2 / 0 / 3,7 / 0 | 2,2 |
| necromante | 0 / 16,9 / 193,4 / 0 | 1.271,3 / 0 / 1.771,9 | 61,8 | 11,3 | 32,9 / 8 / 0 / 2 / 0 | 2,4 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 59,6 / 11,4 | 40,8 / 7,8 / 13,9 | 0 / 0 | — | 21 / 43,4 |
| guerreiro | 25,8 / 3,3 | 10 / 1,4 / 4 | 0 / 0 | bloqueado: 234,6 | 1,1 / 21,4 |
| mago | 26,1 / 4,6 | 17,4 / 3,8 / 5,6 | 0,1 / 0,1 | — | 1,9 / 18,7 |
| arqueiro | 54,5 / 9,8 | 41,1 / 6,8 / 16,4 | 0 / 1,3 | — | 1,5 / 28,1 |
| necromante | 82,9 / 10 | 107,3 / 15,6 / 41,1 | 5 / 0 | sem_invocacao: 18 | 21,8 / 34,7 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 17,5 | 1.349,8 | 0 | 35 | 0 | — |
| aventureiro | explosao | 8 | 598 | 0 | 24 | 0 | — |
| aventureiro | golpe_atordoante | 5,4 | 253,9 | 0 | 16,1 | 0 | — |
| aventureiro | ataque_basico | 24,6 | 484,5 | 0 | 0 | 0 | — |
| aventureiro | curar | 4,1 | 0 | 66,5 | 4,1 | 0 | 16,1 |
| aventureiro | item:pocao_vida | 1,5 | 0 | 195 | 0 | 0 | — |
| aventureiro | efeito:cura_periodica | 0 | 0 | 176,3 | 0 | 0 | — |
| guerreiro | investida | 4,5 | 108,9 | 0 | 18 | 0 | — |
| guerreiro | redemoinho | 4,6 | 0 | 0 | 0 | 13,9 | — |
| guerreiro | efeito:dano_direto | 0 | 87,1 | 0 | 0 | 0 | — |
| guerreiro | grito_de_guerra | 2,3 | 0 | 0 | 9 | 0 | — |
| guerreiro | escudo_de_ferro | 2,1 | 0 | 0 | 6,4 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 126 | 0 | 0 | — |
| guerreiro | ataque_basico | 12,3 | 517,4 | 0 | 0 | 0 | — |
| guerreiro | item:pocao_vida | 2 | 0 | 248 | 0 | 0 | — |
| mago | bola_de_fogo | 2,9 | 207,6 | 0 | 8,6 | 0 | — |
| mago | dardo_arcano | 17,6 | 569,1 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 2,9 | 11,4 | 0 | 11,5 | 0 | — |
| mago | raio_em_cadeia | 2,6 | 284,5 | 0 | 13,1 | 0 | — |
| mago | efeito:dano_direto | 0 | 15,1 | 0 | 0 | 0 | — |
| mago | efeito:queimando | 0 | 60 | 0 | 0 | 0 | — |
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
| necromante | dardo_funesto | 19,3 | 422 | 0 | 38,5 | 0 | — |
| necromante | garras_do_ossuario | 10 | 266,1 | 0 | 20 | 0 | — |
| necromante | toque_funesto | 52,8 | 583,1 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 1.771,9 | 0 | 0 | 0 | — |
| necromante | efeito:cura | 0 | 0 | 16,9 | 0 | 0 | — |
| necromante | item:pocao_vida | 1,6 | 0 | 193,4 | 0 | 0 | — |
| necromante | dizimo_vital | 0,6 | 0 | 0 | 1,3 | 0 | — |
| necromante | comando_sepulcral | 0,3 | 0 | 0 | 0,5 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 203,9% do DPS efetivo de guerreiro. Por encontro, recebeu 783,8 contra 671,3 HP de dano; recuperou 437,8 contra 374 HP (195 contra 248 de poções), gastando 79,3 contra 33,4 mana total e 0 contra 13,9 HP em conjurações. Começou com 325 contra 310 HP e defesa 2 contra 3. Escudos absorveram 0 contra 133,4; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Defesa plana zerada**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 12,5 p.p.; contraste de -12,5 p.p. e alteração de -8,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × mago:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 125,9% do DPS efetivo de mago. Por encontro, recebeu 783,8 contra 547,3 HP de dano; recuperou 437,8 contra 225,4 HP (195 contra 224 de poções), gastando 79,3 contra 33,6 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 1. Escudos absorveram 0 contra 6,3; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Defesa plana zerada**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 12,5 p.p.; contraste de -12,5 p.p. e alteração de -8,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. aventureiro manteve 86,6% do DPS efetivo de arqueiro. Por encontro, recebeu 783,8 contra 561,5 HP de dano; recuperou 437,8 contra 240 HP (195 contra 240 de poções), gastando 79,3 contra 63,3 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Defesa plana zerada**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 12,5 p.p.; contraste de -12,5 p.p. e alteração de -8,9 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 8/8 mortes contra 4/8; 0 contra 3 limites de tempo. aventureiro manteve 125,3% do DPS efetivo de necromante. Por encontro, recebeu 783,8 contra 462,6 HP de dano; recuperou 437,8 contra 210,3 HP (195 contra 193,4 de poções), gastando 79,3 contra 60,3 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 297 HP e defesa 2 contra 1. Escudos absorveram 0 contra 61,8; invocações causaram 0 contra 1.771,9 de dano e receberam 0 contra 665,3. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 1 só necromante venceu; diferença de vitória -12,5 p.p. e de HP final -22,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para 0 p.p.; contraste de -12,5 p.p. e alteração de -22,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × mago:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 61,7% do DPS efetivo de mago. Por encontro, recebeu 671,3 contra 547,3 HP de dano; recuperou 374 contra 225,4 HP (248 contra 224 de poções), gastando 33,4 contra 33,6 mana total e 13,9 contra 0 HP em conjurações. Começou com 310 contra 320 HP e defesa 3 contra 1. Escudos absorveram 133,4 contra 6,3; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. guerreiro manteve 42,4% do DPS efetivo de arqueiro. Por encontro, recebeu 671,3 contra 561,5 HP de dano; recuperou 374 contra 240 HP (248 contra 240 de poções), gastando 33,4 contra 63,3 mana total e 13,9 contra 0 HP em conjurações. Começou com 310 contra 320 HP e defesa 3 contra 2. Escudos absorveram 133,4 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem cura do básico**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × necromante:** 8/8 mortes contra 4/8; 0 contra 3 limites de tempo. guerreiro manteve 61,5% do DPS efetivo de necromante. Por encontro, recebeu 671,3 contra 462,6 HP de dano; recuperou 374 contra 210,3 HP (248 contra 193,4 de poções), gastando 33,4 contra 60,3 mana total e 13,9 contra 0 HP em conjurações. Começou com 310 contra 297 HP e defesa 3 contra 1. Escudos absorveram 133,4 contra 61,8; invocações causaram 0 contra 1.771,9 de dano e receberam 0 contra 665,3. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 1 só necromante venceu; diferença de vitória -12,5 p.p. e de HP final -22,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para 0 p.p.; contraste de -12,5 p.p. e alteração de -22,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × arqueiro:** 8/8 mortes contra 8/8; 0 contra 0 limites de tempo. mago manteve 68,7% do DPS efetivo de arqueiro. Por encontro, recebeu 547,3 contra 561,5 HP de dano; recuperou 225,4 contra 240 HP (224 contra 240 de poções), gastando 33,6 contra 63,3 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 320 HP e defesa 1 contra 2. Escudos absorveram 6,3 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 0 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 0 p.p.; contraste de 0 p.p. e alteração de 0 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**mago × necromante:** 8/8 mortes contra 4/8; 0 contra 3 limites de tempo. mago manteve 99,5% do DPS efetivo de necromante. Por encontro, recebeu 547,3 contra 462,6 HP de dano; recuperou 225,4 contra 210,3 HP (224 contra 193,4 de poções), gastando 33,6 contra 60,3 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 297 HP e defesa 1 contra 1. Escudos absorveram 6,3 contra 61,8; invocações causaram 0 contra 1.771,9 de dano e receberam 0 contra 665,3. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 1 só necromante venceu; diferença de vitória -12,5 p.p. e de HP final -22,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para 0 p.p.; contraste de -12,5 p.p. e alteração de -22,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: necromante venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**arqueiro × necromante:** 8/8 mortes contra 4/8; 0 contra 3 limites de tempo. arqueiro manteve 144,8% do DPS efetivo de necromante. Por encontro, recebeu 561,5 contra 462,6 HP de dano; recuperou 240 contra 210,3 HP (240 contra 193,4 de poções), gastando 63,3 contra 60,3 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 297 HP e defesa 2 contra 1. Escudos absorveram 0 contra 61,8; invocações causaram 0 contra 1.771,9 de dano e receberam 0 contra 665,3. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só arqueiro venceu, 1 só necromante venceu; diferença de vitória -12,5 p.p. e de HP final -22,3 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -12,5 para 0 p.p.; contraste de -12,5 p.p. e alteração de -22,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

### O que mudou ao retirar cada fator

**necromante, Sem habilidades da barra:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 22,3 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 55 (101,6% do completo) | 0 / 0 |
| aventureiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 28,4 (52,6% do completo) | 0 / 0 |
| aventureiro | Defesa plana zerada | 1/8; 7; 0 | -12,5 | -8,9 | 55,2 (102,1% do completo) | 0 / 1 |
| guerreiro | Sem cura do básico | 0/8; 8; 0 | 0 | 0 | 26,4 (99,5% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 30,3 (114,2% do completo) | 0 / 0 |
| guerreiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 39,3 (148,1% do completo) | 0 / 0 |
| guerreiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 25,8 (97,4% do completo) | 0 / 0 |
| mago | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 42,5 (99% do completo) | 0 / 0 |
| mago | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 41,5 (96,6% do completo) | 0 / 0 |
| mago | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 43 (100% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 0/8; 8; 0 | 0 | 0 | 65,1 (104,2% do completo) | 0 / 0 |
| arqueiro | Sem habilidades da barra | 0/8; 8; 0 | 0 | 0 | 50,9 (81,5% do completo) | 0 / 0 |
| arqueiro | Defesa plana zerada | 0/8; 8; 0 | 0 | 0 | 62,5 (100,1% do completo) | 0 / 0 |
| necromante | Sem poções de vida | 2/8; 5; 1 | -12,5 | 11,8 | 45,8 (106,1% do completo) | 0 / 1 |
| necromante | Sem habilidades da barra | 0/8; 8; 0 | 12,5 | 22,3 | 26,9 (62,4% do completo) | 1 / 0 |
| necromante | Defesa plana zerada | 1/8; 4; 3 | 0 | 1,1 | 43,9 (101,8% do completo) | 0 / 0 |

## nível 30 · pesadelo · chefe

| Classe | TTK mediano (só vitórias) | Morte mediana | Ondas completas | Dano/encontro | Recebido/encontro | Cura/encontro | Mana gasta | HP gasto |
|---|---|---|---|---|---|---|---|---|
| aventureiro | 26 s | — | 1 | 1.206 | 217 | 124,9 | 36,5 | 0 |
| guerreiro | 21,9 s | — | 1 | 1.278 | 171 | 156 | 22,6 | 11,3 |
| mago | 28,5 s | 25,4 s | 0,5 | 1.081,9 | 379,4 | 160 | 30,1 | 0 |
| arqueiro | 20,5 s | — | 1 | 1.226,3 | 369 | 208 | 32 | 0 |
| necromante | 41,6 s | 35,3 s | 0,8 | 1.184,5 | 278,9 | 104,1 | 28,8 | 0 |

### Mecanismos observados (médias por encontro)

| Classe | Cura direta / efeitos / poções / invocação | Dano direto / efeitos / invocação | Escudo (impactos) | HP sacrificado de invocações | Conjuração / movimento / controle / baixa vida / restrição de mana (s) | Distância média |
|---|---|---|---|---|---|---|
| aventureiro | 9,4 / 18 / 97,5 / 0 | 1.206 / 0 / 0 | 0 | 0 | 16 / 6,5 / 1,3 / 0 / 0 | 1,3 |
| guerreiro | 0 / 125 / 31 / 0 | 1.136,6 / 141,4 / 0 | 27,6 | 0 | 8,4 / 1,8 / 7,9 / 0 / 0 | 0,8 |
| mago | 0 / 0 / 160 / 0 | 1.059,9 / 22 / 0 | 0 | 0 | 16,9 / 5,5 / 1,5 / 0,4 / 0 | 1,7 |
| arqueiro | 0 / 0 / 208 / 0 | 1.173,6 / 52,6 / 0 | 0 | 0 | 14,9 / 5,2 / 2 / 0,3 / 0 | 1,7 |
| necromante | 0 / 0 / 104,1 / 0 | 669,6 / 0 / 514,9 | 45,5 | 0 | 18,1 / 9,4 / 1,4 / 0,4 / 0 | 1,8 |

Tempos podem se sobrepor; baixa vida = menos de 35% do HP. Restrição de mana = ao menos uma skill pronta e aparentemente utilizável sem mana suficiente, antes da decisão do bot; não significa incapacidade total de atacar.

| Classe | Ações / cancelamentos | Impactos / falhas / críticos | Combos / sinergias | Recusas por motivo | Saldo HP / mana sem evento |
|---|---|---|---|---|---|
| aventureiro | 24,5 / 4,8 | 18,4 / 3,4 / 6,3 | 0 / 0 | bloqueado: 6,9 | 0 / 16,9 |
| guerreiro | 17,4 / 1,4 | 12,9 / 1,6 / 6,6 | 0,3 / 0 | bloqueado: 95,5 | 0 / 15,8 |
| mago | 23,6 / 4,1 | 17,4 / 3 / 5,9 | 0,6 / 0,1 | — | 0 / 18,4 |
| arqueiro | 28 / 7,1 | 20,4 / 4,1 / 8,3 | 0,3 / 0,5 | bloqueado: 3,5 | 0 / 15,5 |
| necromante | 44,6 / 4,5 | 51 / 8,4 / 19,6 | 1,9 / 0 | — | 10,1 / 17,1 |

Saldo sem evento fecha a contabilidade entre início e fim, custos e eventos; inclui regeneração por caminhada/tempo e fontes ainda sem telemetria. Não é automaticamente chamado de cura nem atribuído a uma habilidade. Impactos incluem falhas, imunidades e todas as fontes aliadas.

### Fontes e custos (médias por encontro)

| Classe | Fonte | Usos | Dano efetivo | Cura efetiva | Mana cobrada | HP cobrado | Cura/mana da própria fonte |
|---|---|---|---|---|---|---|---|
| aventureiro | seta_arcana | 7,9 | 496 | 0 | 15,8 | 0 | — |
| aventureiro | explosao | 4,3 | 373,5 | 0 | 12,8 | 0 | — |
| aventureiro | golpe_atordoante | 2,5 | 121,4 | 0 | 7,5 | 0 | — |
| aventureiro | ataque_basico | 9,4 | 215,1 | 0 | 0 | 0 | — |
| aventureiro | item:pocao_vida | 0,8 | 0 | 97,5 | 0 | 0 | — |
| aventureiro | curar | 0,5 | 0 | 9,4 | 0,5 | 0 | 18,8 |
| aventureiro | efeito:cura_periodica | 0 | 0 | 18 | 0 | 0 | — |
| guerreiro | investida | 3,6 | 350,4 | 0 | 14,5 | 0 | — |
| guerreiro | redemoinho | 3,8 | 417,3 | 0 | 0 | 11,3 | — |
| guerreiro | efeito:dano_direto | 0 | 141,4 | 0 | 0 | 0 | — |
| guerreiro | grito_de_guerra | 1,8 | 0 | 0 | 7 | 0 | — |
| guerreiro | ataque_basico | 7,9 | 369 | 0 | 0 | 0 | — |
| guerreiro | efeito:cura | 0 | 0 | 125 | 0 | 0 | — |
| guerreiro | escudo_de_ferro | 0,4 | 0 | 0 | 1,1 | 0 | — |
| guerreiro | item:pocao_vida | 0,3 | 0 | 31 | 0 | 0 | — |
| mago | bola_de_fogo | 3 | 133,1 | 0 | 9 | 0 | — |
| mago | dardo_arcano | 15,9 | 535,1 | 0 | 0 | 0 | — |
| mago | lanca_de_gelo | 2,6 | 146,3 | 0 | 10,5 | 0 | — |
| mago | raio_em_cadeia | 2,1 | 245,4 | 0 | 10,6 | 0 | — |
| mago | efeito:dano_direto | 0 | 15,9 | 0 | 0 | 0 | — |
| mago | item:pocao_vida | 1,3 | 0 | 160 | 0 | 0 | — |
| mago | efeito:queimando | 0 | 6,1 | 0 | 0 | 0 | — |
| arqueiro | flecha_perfurante | 3 | 188,5 | 0 | 12 | 0 | — |
| arqueiro | chuva_de_flechas | 2 | 216,9 | 0 | 8 | 0 | — |
| arqueiro | tiro | 19 | 450,8 | 0 | 0 | 0 | — |
| arqueiro | flecha_venenosa | 2 | 113,3 | 0 | 6 | 0 | — |
| arqueiro | efeito:envenenado | 0 | 44,3 | 0 | 0 | 0 | — |
| arqueiro | tiro_em_leque | 2 | 204,3 | 0 | 6 | 0 | — |
| arqueiro | efeito:dano_direto | 0 | 8,4 | 0 | 0 | 0 | — |
| arqueiro | item:pocao_vida | 1,6 | 0 | 208 | 0 | 0 | — |
| necromante | dardo_funesto | 9,4 | 225,3 | 0 | 18,8 | 0 | — |
| necromante | garras_do_ossuario | 5 | 114,6 | 0 | 10 | 0 | — |
| necromante | toque_funesto | 30,3 | 329,8 | 0 | 0 | 0 | — |
| necromante | invocacao:golpe | 0 | 514,9 | 0 | 0 | 0 | — |
| necromante | item:pocao_vida | 0,9 | 0 | 104,1 | 0 | 0 | — |

“—” em cura/mana significa custo não atribuível ou mana zero; não significa eficiência infinita. Fontes efeito: e invocacao: não recebem um custo inventado. Custos de invocações automáticas e efeitos indiretos devem ser lidos com o conjunto do kit.

### Comparações entre classes

**aventureiro × guerreiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 85,6% do DPS efetivo de guerreiro. Por encontro, recebeu 217 contra 171 HP de dano; recuperou 124,9 contra 156 HP (97,5 contra 31 de poções), gastando 36,5 contra 22,6 mana total e 0 contra 11,3 HP em conjurações. Começou com 325 contra 310 HP e defesa 2 contra 3. Escudos absorveram 0 contra 27,6; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só guerreiro venceu; diferença de vitória 0 p.p. e de HP final -19,9 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para -75 p.p.; contraste de 75 p.p. e alteração de 49,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × mago:** 0/8 mortes contra 4/8; 0 contra 0 limites de tempo. aventureiro manteve 129,2% do DPS efetivo de mago. Por encontro, recebeu 217 contra 379,4 HP de dano; recuperou 124,9 contra 160 HP (97,5 contra 160 de poções), gastando 36,5 contra 30,1 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 1. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 4 sementes só aventureiro venceu, 0 só mago venceu; diferença de vitória 50 p.p. e de HP final 40,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 50 para 0 p.p.; contraste de 50 p.p. e alteração de 40,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**aventureiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. aventureiro manteve 91% do DPS efetivo de arqueiro. Por encontro, recebeu 217 contra 369 HP de dano; recuperou 124,9 contra 208 HP (97,5 contra 208 de poções), gastando 36,5 contra 32 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 320 HP e defesa 2 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só aventureiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 22 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 62,5 p.p.; contraste de -62,5 p.p. e alteração de -17,7 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**aventureiro × necromante:** 0/8 mortes contra 2/8; 0 contra 0 limites de tempo. aventureiro manteve 187% do DPS efetivo de necromante. Por encontro, recebeu 217 contra 278,9 HP de dano; recuperou 124,9 contra 104,1 HP (97,5 contra 104,1 de poções), gastando 36,5 contra 28,8 mana total e 0 contra 0 HP em conjurações. Começou com 325 contra 297 HP e defesa 2 contra 1. Escudos absorveram 0 contra 45,5; invocações causaram 0 contra 514,9 de dano e receberam 0 contra 263,8. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 2 sementes só aventureiro venceu, 0 só necromante venceu; diferença de vitória 25 p.p. e de HP final 27,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 25 para 0 p.p.; contraste de 25 p.p. e alteração de 27,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: aventureiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × mago:** 0/8 mortes contra 4/8; 0 contra 0 limites de tempo. guerreiro manteve 150,9% do DPS efetivo de mago. Por encontro, recebeu 171 contra 379,4 HP de dano; recuperou 156 contra 160 HP (31 contra 160 de poções), gastando 22,6 contra 30,1 mana total e 11,3 contra 0 HP em conjurações. Começou com 310 contra 320 HP e defesa 3 contra 1. Escudos absorveram 27,6 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 4 sementes só guerreiro venceu, 0 só mago venceu; diferença de vitória 50 p.p. e de HP final 60,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 50 para 87,5 p.p.; contraste de -37,5 p.p. e alteração de -14,5 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: guerreiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**guerreiro × arqueiro:** 0/8 mortes contra 0/8; 0 contra 0 limites de tempo. guerreiro manteve 106,3% do DPS efetivo de arqueiro. Por encontro, recebeu 171 contra 369 HP de dano; recuperou 156 contra 208 HP (31 contra 208 de poções), gastando 22,6 contra 32 mana total e 11,3 contra 0 HP em conjurações. Começou com 310 contra 320 HP e defesa 3 contra 2. Escudos absorveram 27,6 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só guerreiro venceu, 0 só arqueiro venceu; diferença de vitória 0 p.p. e de HP final 41,8 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 0 para 75 p.p.; contraste de -75 p.p. e alteração de -35,8 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**guerreiro × necromante:** 0/8 mortes contra 2/8; 0 contra 0 limites de tempo. guerreiro manteve 218,5% do DPS efetivo de necromante. Por encontro, recebeu 171 contra 278,9 HP de dano; recuperou 156 contra 104,1 HP (31 contra 104,1 de poções), gastando 22,6 contra 28,8 mana total e 11,3 contra 0 HP em conjurações. Começou com 310 contra 297 HP e defesa 3 contra 1. Escudos absorveram 27,6 contra 45,5; invocações causaram 0 contra 514,9 de dano e receberam 0 contra 263,8. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 2 sementes só guerreiro venceu, 0 só necromante venceu; diferença de vitória 25 p.p. e de HP final 47 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 25 para 75 p.p.; contraste de -50 p.p. e alteração de -22,2 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: guerreiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × arqueiro:** 4/8 mortes contra 0/8; 0 contra 0 limites de tempo. mago manteve 70,5% do DPS efetivo de arqueiro. Por encontro, recebeu 379,4 contra 369 HP de dano; recuperou 160 contra 208 HP (160 contra 208 de poções), gastando 30,1 contra 32 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 320 HP e defesa 1 contra 2. Escudos absorveram 0 contra 0; invocações causaram 0 contra 0 de dano e receberam 0 contra 0. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 0 sementes só mago venceu, 4 só arqueiro venceu; diferença de vitória -50 p.p. e de HP final -18,2 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -50 para -12,5 p.p.; contraste de -37,5 p.p. e alteração de -21,3 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: arqueiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

**mago × necromante:** 4/8 mortes contra 2/8; 0 contra 0 limites de tempo. mago manteve 144,8% do DPS efetivo de necromante. Por encontro, recebeu 379,4 contra 278,9 HP de dano; recuperou 160 contra 104,1 HP (160 contra 104,1 de poções), gastando 30,1 contra 28,8 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 297 HP e defesa 1 contra 1. Escudos absorveram 0 contra 45,5; invocações causaram 0 contra 514,9 de dano e receberam 0 contra 263,8. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 1 sementes só mago venceu, 3 só necromante venceu; diferença de vitória -25 p.p. e de HP final -13,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem habilidades da barra**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de -25 para 0 p.p.; contraste de -25 p.p. e alteração de -13,1 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

**arqueiro × necromante:** 0/8 mortes contra 2/8; 0 contra 0 limites de tempo. arqueiro manteve 205,4% do DPS efetivo de necromante. Por encontro, recebeu 369 contra 278,9 HP de dano; recuperou 208 contra 104,1 HP (208 contra 104,1 de poções), gastando 32 contra 28,8 mana total e 0 contra 0 HP em conjurações. Começou com 320 contra 297 HP e defesa 2 contra 1. Escudos absorveram 0 contra 45,5; invocações causaram 0 contra 514,9 de dano e receberam 0 contra 263,8. Esses valores descrevem mecanismos observados; a mana total não é o custo exclusivo da cura.

Pares: 2 sementes só arqueiro venceu, 0 só necromante venceu; diferença de vitória 25 p.p. e de HP final 5,1 p.p. Amostra exploratória: confirme com mais sementes e outras builds.

Maior mudança observada entre os fatores testados: **Sem poções de vida**. Ao retirar o fator das duas classes, a vantagem de vitória da primeira sobre a segunda passou de 25 para -25 p.p.; contraste de 50 p.p. e alteração de 21 p.p. na diferença de HP final. Uma classe que já não tinha cura do básico usa seu resultado completo como controle dessa remoção. O contraste mede mudança da diferença, não uma porcentagem causal exclusiva; fatores empatados ou sem mudança de vitória não explicam por si uma vantagem.

Sinal para investigar: arqueiro venceu mais mantendo ao menos 90% do DPS da outra classe. Isso é um sinal descritivo, não uma meta reprovada. Consulte as intervenções abaixo.

### O que mudou ao retirar cada fator

**aventureiro, Sem poções de vida:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 23,2 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**aventureiro, Sem habilidades da barra:** retirar esse fator perdeu 8 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 71,7 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**guerreiro, Sem habilidades da barra:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 22,4 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem poções de vida:** retirar esse fator perdeu 3 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 19,5 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**mago, Sem habilidades da barra:** retirar esse fator perdeu 4 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 31,4 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem poções de vida:** retirar esse fator perdeu 6 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 40,8 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Sem habilidades da barra:** retirar esse fator perdeu 5 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 42,1 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**arqueiro, Defesa plana zerada:** retirar esse fator perdeu 1 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 10,5 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem poções de vida:** retirar esse fator perdeu 2 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 19,9 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

**necromante, Sem habilidades da barra:** retirar esse fator perdeu 6 vitórias e ganhou 0 nas mesmas 8 condições iniciais. O kit completo teve 44,6 p.p. a mais de HP final médio. O experimento sustenta uma contribuição do fator neste cenário; não explica sozinho a diferença entre classes.

| Classe | Intervenção | Vitórias/n; mortes; limites | Completo − sem fator: vitória (p.p.) | HP final (p.p.) | DPS sem fator | Só completo / só intervenção venceu |
|---|---|---|---|---|---|---|
| aventureiro | Sem poções de vida | 7/8; 1; 0 | 12,5 | 23,2 | 54,3 (99,2% do completo) | 1 / 0 |
| aventureiro | Sem habilidades da barra | 0/8; 8; 0 | 100 | 71,7 | 25,2 (46% do completo) | 8 / 0 |
| aventureiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 1,8 | 54,7 (100% do completo) | 0 / 0 |
| guerreiro | Sem cura do básico | 8/8; 0; 0 | 0 | 2,7 | 63,9 (100% do completo) | 0 / 0 |
| guerreiro | Sem poções de vida | 8/8; 0; 0 | 0 | 5 | 63,9 (100% do completo) | 0 / 0 |
| guerreiro | Sem habilidades da barra | 6/8; 2; 0 | 25 | 22,4 | 34,5 (54% do completo) | 2 / 0 |
| guerreiro | Defesa plana zerada | 8/8; 0; 0 | 0 | 1 | 63,9 (100% do completo) | 0 / 0 |
| mago | Sem poções de vida | 1/8; 7; 0 | 37,5 | 19,5 | 43,8 (103,5% do completo) | 3 / 0 |
| mago | Sem habilidades da barra | 0/8; 8; 0 | 50 | 31,4 | 31,3 (73,9% do completo) | 4 / 0 |
| mago | Defesa plana zerada | 4/8; 4; 0 | 0 | 0,7 | 43 (101,6% do completo) | 0 / 0 |
| arqueiro | Sem poções de vida | 2/8; 6; 0 | 75 | 40,8 | 63,2 (105,1% do completo) | 6 / 0 |
| arqueiro | Sem habilidades da barra | 3/8; 5; 0 | 62,5 | 42,1 | 42 (70% do completo) | 5 / 0 |
| arqueiro | Defesa plana zerada | 7/8; 1; 0 | 12,5 | 10,5 | 61 (101,5% do completo) | 1 / 0 |
| necromante | Sem poções de vida | 4/8; 4; 0 | 25 | 19,9 | 29,1 (99,6% do completo) | 2 / 0 |
| necromante | Sem habilidades da barra | 0/8; 8; 0 | 75 | 44,6 | 22,1 (75,5% do completo) | 6 / 0 |
| necromante | Defesa plana zerada | 6/8; 2; 0 | 0 | 1,3 | 29 (99,2% do completo) | 0 / 0 |
