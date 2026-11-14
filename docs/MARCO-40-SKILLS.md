# Marco 40: o sistema novo de skills

**Versão:** 1.3 · **Data:** 13/11/2026

O desenho completo está no catálogo "Grimório das Skills" (artefato, versão 1.6), revisado com o usuário em
12/11/2026. Este documento guarda as etapas da implementação e o que cada uma entrega. As skills atuais são
substituídas; o motor também muda onde ele não servir ao desenho (pedido do usuário, 12/11/2026).

## O modelo

Toda skill tem um **núcleo** (verbo, papel, eixos e orçamento) e três **conexões**:

- **classe**: o veículo entrega a skill e cobra o recurso (inteiro nas skills de classe, sotaque nas comuns);
- **estilo**: a forma do estilo empurra um eixo do núcleo, de 10% a 100% da ponta (D-156), com o eixo secundário
  do estilo valendo na metade quando a skill não tem o principal;
- **elemento**: o estado do elemento e uma função secundária pelo papel (tabela papel × elemento), na faixa da
  sintonia; nas skills de classe e nas ultimates o elemento vem da runa (D-151).

Os pesos das conexões têm faixa por tipo de skill (classe 40/30/15/15, comum 60/10/15/15, ultimate 40/15/20/25).

## Etapas

1. **Núcleo, papel e eixos.** Os nove eixos (área, alvos, perfuração, eco, controle, sustento, marca, grupo,
   invocação) com forma gradual; estilos com eixo principal e secundário; o destino `aliados` dos efeitos; a
   marca que acumula; a tabela papel × elemento (`papeis.json`) e a sintonia na chave das skills comuns.
2. **Skills comuns.** Os 20 núcleos e as 89 variantes elementais no lugar das skills comuns e gerais; migração do
   save (ids antigos para o núcleo mais próximo, estudo devolvido).
3. **Skills de classe.** As 30 skills (6 por classe) com veículo, recurso e a leitura de cada estilo; runa padrão.
4. **Ultimates, combos, reações, ressonâncias e visual** (ampliada em 13/11/2026, pedido do usuário). O desenho
   está no catálogo "Códex do Combate" (artefato, versão 1.0), publicado para revisão sem pausar o código:
   - as 21 famílias de ultimate pelos papéis do par, com os fios de estilo e de elemento, as 36 fusões de eixos,
     o par de elementos e a runa no par, tudo gradual; as 140 ultimates antigas saem;
   - combos em quatro camadas (regras de papel, cena, grupo e 30 assinados pelas skills de classe), todos lendo
     elemento, sintonia e estilo; os 167 combos por id saem;
   - as reações elementais em matriz completa (36 pares dos 9 elementos);
   - as ressonâncias de volta, entre um eixo do estilo e um elemento da sintonia (30), ocultas até disparar e
     registradas no diário;
   - o rework visual completo, que era a etapa 7: as skills comuns e de classe, as famílias, os combos, as reações
     e as ressonâncias, desenhados junto com a mecânica.
5. **Movimento da classe.** As 15 mecânicas (3 por classe, uma ativa), Shift usa, G alterna, Z volta ao alvo
   anterior, botão no celular; evolução por nível com marcos no 30, 50, 70 e 90.
6. **Companheiros e montarias.** Falcão, lobo e urso do Aventureiro (vida compartilhada com repasse por nível),
   leituras de estilo, Chamado da Matilha; montaria comprada no Mundo; Posto dos Mortos do Necromante.
7. **Visual.** Entrou na etapa 4 (13/11/2026); aqui fica só o que sobrar do movimento e dos companheiros.
8. **Fechamento.** Balanceamento, documentação, e2e e partida real.

## Etapa 1 (12/11/2026)

- `combat/eixos.ts`: os nove eixos, a forma de cada um e as regras das cinco novas (`balance.habilidades.eixos`).
- `estilos.json`: cada estilo com `eixos` (principal e secundário); a forma de quem tem núcleo segue os eixos dele.
- `skills.json`: campos `nucleo`, `papel` e `eixos` na definição.
- Efeitos com `em: "aliados"`: caem nos aliados em volta de quem conjura (`relacao()`, nunca o tipo).
- `papeis.json`: a função secundária de cada papel por elemento, cheia na faixa 10 da sintonia.

## Etapa 2 (12/11/2026)

- `nucleos.json`: os 20 núcleos (papel, eixos e molde) e as 89 variantes; a expansão em `combat/nucleos.ts` gera
  `<núcleo>_<elemento>` no catálogo das skills.
- O campo tático hostil leva o estado do elemento (`efeito`); a função secundária só cai em quem ela serve.
- 89 livros novos no lugar dos 54 das gerais; a geral inicial de cada classe é uma variante.
- `save/migracao-40.ts` (save 31 e as fichas do servidor): gerais antigas para a variante do `legado`, no rank 1 e com
  os pontos de volta.
- As gerais antigas seguem no skills.json só para inimigos, ultimates e combos (etapas 3 e 4).

## Etapa 3 (13/11/2026)

- 30 skills de classe (6 por classe) nos ids das antigas, com nome, papel e a leitura de cada estilo
  (`combat/leituras.ts`). Na chave compilada, as leituras com efeito entram como `&estiloN`.
- `classes.json → saidas`: as 10 que saem do kit e perdem o livro; o save 31 e as fichas tiram essas skills.
- A mochila lista as leituras e marca as ativas.
- O balanceamento completo fica para o fechamento (D-159).

> **Histórico**
> - **1.3 (13/11/2026)**: a etapa 4 ampliada (combos, reações, ressonâncias e o visual da etapa 7), pelo Códex do Combate.
> - **1.2 (13/11/2026)**: etapa 3, as skills de classe.
> - **1.1 (12/11/2026)**: etapa 2, as skills comuns.
> - **1.0 (12/11/2026)**: as etapas e a etapa 1.
