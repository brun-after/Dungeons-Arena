# Marco 40: o sistema novo de skills

**Versão:** 1.0 · **Data:** 12/11/2026

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
4. **Ultimates.** As 21 famílias pelos papéis do par; os fios de estilo e de elemento, os pares e a runa no par,
   graduais; combos.
5. **Movimento da classe.** As 15 mecânicas (3 por classe, uma ativa), Shift usa, G alterna, Z volta ao alvo
   anterior, botão no celular; evolução por nível com marcos no 30, 50, 70 e 90.
6. **Companheiros e montarias.** Falcão, lobo e urso do Aventureiro (vida compartilhada com repasse por nível),
   leituras de estilo, Chamado da Matilha; montaria comprada no Mundo; Posto dos Mortos do Necromante.
7. **Visual.** As camadas por canal (núcleo, veículo, forma, matéria, estado), as formas novas, as matérias e as
   assinaturas de cada skill.
8. **Fechamento.** Balanceamento, documentação, e2e e partida real.

## Etapa 1 (12/11/2026)

- `combat/eixos.ts`: os nove eixos, a forma de cada um e as regras das cinco novas (`balance.habilidades.eixos`).
- `estilos.json`: cada estilo com `eixos` (principal e secundário); a forma de quem tem núcleo segue os eixos dele.
- `skills.json`: campos `nucleo`, `papel` e `eixos` na definição.
- Efeitos com `em: "aliados"`: caem nos aliados em volta de quem conjura (`relacao()`, nunca o tipo).
- `papeis.json`: a função secundária de cada papel por elemento, cheia na faixa 10 da sintonia.
