# Sugestões de Habilidades — Variedade por Composição

**Versão:** 1.0 · **Data:** 14/10/2026

> Material enviado pelo usuário a partir do jogo anterior e guardado aqui como referência. O que foi adotado,
> adaptado ou recusado está em [`DECISOES.md`](DECISOES.md), D-057.

> **Histórico**
> - **1.0 (14/10/2026)**: texto recebido (ideias de composição e o modelo de skill do jogo anterior).

Este texto continua uma ideia que já aparece nos outros documentos: o repertório de efeitos ser combinável e
extensível. Aqui vai um passo além: como transformar esse repertório em variedade de verdade.

## Parte 1 — Ideias

### 1. Variedade por composição, não por catálogo

Há duas maneiras de ter cem habilidades diferentes.

- **Por catálogo**: alguém projeta, escreve e balanceia cem habilidades, uma a uma. Funciona, mas o custo cresce
  junto com a quantidade, e a variedade para quando o autor cansa.
- **Por composição**: o jogo tem poucas peças pequenas e regras de como elas se combinam. Dez peças de cada tipo já
  dão milhares de habilidades, e acrescentar uma peça nova multiplica as combinações em vez de somar uma.

A sugestão é apostar na segunda, e tratar o catálogo escrito à mão como uma coleção de combinações particularmente
boas, não como a única fonte.

### 2. Habilidade como conjunto de peças

| Camada | Pergunta que responde | Exemplos de variação |
|---|---|---|
| Efeito | O que acontece com quem é atingido? | dano, cura, controle, deslocamento, invocação |
| Forma | Como ela chega ao alvo? | direta, projétil, área, linha, cone, ao redor de si |
| Tempo | Quando e quanto dura? | conjuração rápida ou lenta, instantânea ou prolongada, recarga |
| Custo | O que ela exige? | recurso, vida, nada |
| Tema | De que natureza é? | elemento, escola, temática |
| Apresentação | Como parece e soa? | partículas, cor, som, câmera |

A vantagem de separar assim: cada camada varia sem tocar nas outras. Duas observações:
- A apresentação conversa com o tema: se o tema muda, o visual e o som poderiam acompanhar automaticamente, com
  ajuste fino opcional.
- Quanto mais as peças forem dado e não código, mais fácil é combinar, gerar e compartilhar.

### 3. Habilidades geradas a partir de uma semente

Uma semente produz, de forma determinística, uma habilidade completa, com mecânica, visual e som coerentes entre si.
Isso abre: inimigos com repertório próprio; recompensas surpreendentes; compartilhamento barato (um código curto);
arena leve (basta trafegar a semente). A coerência pede que o tema sorteado puxe as demais escolhas e que existam
combinações que o gerador não produz.

### 4. Equilíbrio por orçamento de poder

Cada peça tem um custo de poder; cada habilidade tem um orçamento máximo, que depende da evolução do personagem e do
modo de jogo; qualquer combinação (escrita à mão, sorteada ou criada por jogador) só é válida se couber nele. Dá
equilíbrio por construção, deixa o modo ajustar o jogo mudando um número e explica "por que não posso fazer isso?".
Ressalva: o orçamento mede poder bruto; sinergias podem passar dele, então o custo das peças precisa ser ajustável.

### 5. Interação entre efeitos

Acúmulo (soma, renova, vale o mais forte ou é ignorado), sinergia (um estado prepara outro), oposição, resistência e
imunidade por entidade, e teto de efeitos simultâneos. Método sugerido: expressar as interações como tabela de dados,
não como condicionais espalhadas.

### 6. Evolução e personalização

Modificadores (atravessar, ecoar, encadear, ficar maior e mais lenta), escolhas de evolução entre dois ou três
caminhos, equipamento que muda habilidades e build como expressão. Na arena, modificadores passam pelo mesmo
orçamento e pela ficha normalizada do modo.

### 7. Legibilidade sob variedade

Uma gramática visual consistente (a cor diz o tema ou a equipe, a forma diz o tipo de área, o ritmo diz o tempo) e a
descrição gerada automaticamente a partir das peças.

## Parte 2 — O modelo de skill do jogo anterior

### O que uma skill podia ser

| Campo | Opções |
|---|---|
| Tipo de dano (11) | físico, mágico, fogo, gelo, veneno, cura, psíquico, invocação, buff/reforço, escudo (HP temporário), outro |
| Alvo (6) | inimigo, só o próprio, um aliado, todos os aliados, todos os inimigos, área livre posicionável |
| Área | alvo único, quadrada (AoE), linha |
| Demais campos | fórmula de dados, alcance em células, custo de recurso, cooldown, atributo base com % de escala, crítico positivo e negativo (texto livre) |
| Tipo de habilidade | ação normal ou reativa: passiva, reação, ação bônus, ação livre, interrupção |
| Gatilhos das reativas | ao ser atacado, ao sofrer dano (de qualquer tipo ou de um tipo), quando aliado é atacado ou ferido, quando inimigo chega adjacente, sai do alcance ou conjura, início e fim de turno, ao cair a 0 HP, ao acertar crítico |

As reativas também tinham "antes ou depois do evento" e execução automática. O ataque básico era uma skill editável
com os mesmos recursos.

### Os 26 efeitos

- **Debuffs**: dano por turno; atordoar; silenciar; sem movimento; sem ataque (todos, só físico, só mágico); debuff de
  dano causado.
- **Buffs**: cura por turno; bônus de dano; recuperar recurso (imediato ou por turno); imunidade a dano; fantasma;
  atravessar paredes; quatro modificadores do ataque básico (recarga menor e ataques extras, dano extra, alvos extras,
  alcance maior).
- **Instantâneos e de posição**: cura imediata; teleporte; dash (clique livre, adjacente ao alvo, trocar de lugar);
  empurrão ou puxão com distância configurável.
- **Complexos**: efeito atrasado (depois de N turnos: dano em área, cura em área, buff ou debuff nomeado em área,
  movimento bônus ou atributo modificado; o dano em área aceita atordoamento); necromante (domina ao matar); rastros;
  invocação (todas as entidades selecionadas ou sorteio entre elas, com quantidade, duração e os comportamentos
  agressivo, assassino, protetor, curador e isca); armadilha (numa célula, com fórmula e efeito próprios).
