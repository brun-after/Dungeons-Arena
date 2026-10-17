# Plano de progressão, estudo e consumíveis

**Versão:** 1.1 · **Data:** 17/10/2026 · **Estado:** aplicado após aprovação; valores finais e diferenças registrados na D-075 e na revisão D-076.

## Objetivo

Retirar pontos de habilidade da aceleração do estudo; acrescentar aceleração consumível e cumulativa,
compra de pontos e evolução de rank por família; estender a campanha até o nível 30 com progressão
21–30 orientada à dificuldade Pesadelo. Preservar o rebalanceamento D-074 e as regras dos níveis 1–20.

As regras solicitadas estão separadas das propostas de preços, percentuais de XP e distribuição de itens.
Os valores abaixo preservam o plano aprovado. A D-075 registra a calibragem final de Pesadelo para 170%, a implementação e os limites da validação. A D-076 substitui o preço crescente do tomo por 10.000 ouro fixos de base.

## 1. Aceleração da mente

- Remover o gasto de pontos e a conclusão parcial instantânea do estudo. O comando antigo não poderá
  continuar gastando pontos por clientes antigos nem se tornar um atalho gratuito de aceleração.
- Criar três consumíveis utilizáveis diretamente na mochila:

| Grau proposto | Aumento da velocidade | Preço-base inicial proposto |
|---|---|---:|
| Comum | +25% (+1/4) | 150 ouro |
| Incomum | +33⅓% (+1/3) | 200 ouro |
| Raro | +50% (+1/2) | 300 ouro |

- Interpretação proposta de “mais rápido”: aumentar a taxa de progresso, não reduzir a duração pela
  mesma porcentagem. Um estudo com 12 minutos restantes leva 8 minutos após um único item de +50%.
- Somar os bônus, inclusive de graus diferentes, sobre a velocidade normal do estudo. Dois raros
  resultam em 2×; um item de cada grau resulta em 25/12× (aproximadamente 2,083×).
- Cada consumo modifica apenas o estudo em andamento, até sua conclusão. Não há expiração nem
  transferência do bônus para o próximo estudo. Sem estudo ativo, recusar sem consumir.
- Não estabelecer o antigo limite de três acelerações. Nenhum consumo conclui tempo instantaneamente;
  mesmo com muitos itens, o progresso depende dos próximos ticks de simulação.
- Continuar respeitando pausa e as regras dos modos sobre avanço de estudo. Salvar o bônus e a fração
  de progresso. Usar unidades inteiras compatíveis com denominador 12 para não perder frações por tick.
- Inteligência e equipamentos continuam reduzindo o trabalho inicial necessário; o consumível aumenta
  a velocidade com que esse trabalho restante é realizado.
- Interface: mostrar velocidade total e previsão de tempo restante no estudo e explicar o alcance do
  efeito na descrição do item. Não colocar esses materiais automaticamente nos atalhos de poção.

**Estoque proposto:** grau comum garantido em todas as lojas da campanha, inclusive mercador errante;
graus incomum e raro adicionais, sorteados por loja/fase com chances iniciais de 30% e 10%.
Resultado persistido e determinístico: reabrir a loja ou recarregar o save não muda o estoque.
Estoque ilimitado dos graus presentes, seguindo a loja atual. Desconto de Carisma segue as regras existentes.

## 2. Limite 30 e XP dos níveis 21–30

- Aumentar o máximo do personagem de 20 para 30. Continuar concedendo 3 pontos de atributo,
  1 ponto de habilidade e +5 de vida base por nível: totais naturais de 87, 29 e +145 desde o nível 1.
- Manter teto efetivo de atributo em 30, rank máximo em 5 e barra de quatro habilidades.
- Manter curva atual até o nível 20. Para 20→21 até 29→30, proposta inicial: continuar o fallback
  existente de XP necessário = nível atual × 100 (2.000 até 2.900 XP). Não combinar uma curva
  exponencial com penalidades severas de recompensa sem evidência de necessidade.
- A faixa nova de recompensa começa quando o personagem já está no nível 20, na subida para o 21.

| Dificuldade | XP proposto na faixa 20→30, relativo à referência Normal atual |
|---|---:|
| Fácil | 5% |
| Normal | 10% |
| Difícil | 35% |
| Pesadelo | 100% |

- A referência é a recompensa de um inimigo equivalente na dificuldade Normal atual, antes de grupo
  e antifarm. Esta tabela substitui somente o fator de dificuldade do XP nessa faixa; não se multiplica
  novamente pelo atual 160% de Pesadelo, por exemplo. Grupo e antifarm continuam aplicados.
- Calcular por destinatário: um jogador nível 12 e outro nível 24 no mesmo grupo recebem as regras
  das respectivas faixas. Conservar frações de XP para que o mínimo de 1 XP por abate não anule a
  redução e o antifarm. Aplicar a mesma política às demais fontes de XP de progressão, revisando missões.
- Não aplicar a penalidade a ouro, loot ou recompensas sem XP. Atualmente XP e ouro consultam o mesmo
  fator de recompensa do mundo; criar uma política específica de XP sem alterar esse fator compartilhado.
- Medir XP por minuto e minutos por nível com tempo de combate real. 100% de XP por abate em Pesadelo
  não garante ritmo natural: os inimigos duram mais e causam mais dano. Ajustar a tabela se necessário
  para que o ritmo pretendido exista em XP/minuto, mantendo Normal muito abaixo e Difícil intermediário.
- Estender inimigos, equipamento gerado e fases ao nível 30; revisar validadores de conteúdo, saves,
  editor, geração de eventos, limites de integridade e importação. Evitar substituir todo literal 20:
  frequência de rede e limites de modo têm outros significados.
- Manter limites próprios dos modos de arena; aceitar e persistir personagem nível 30 sem eliminar
  o clamp intencional do modo. Não estender o bônus de XP de campanha automaticamente ao PvP.

## 3. Consumível de ponto de habilidade

- Nome proposto: **Tomo do potencial**. Consumir na mochila concede exatamente 1 ponto livre, uma vez
  por unidade, com atualização imediata da ficha. Não altera nível, XP, atributos nem rank diretamente.
- Disponível nas lojas da campanha. Preço inicial proposto: 15.000 ouro, crescendo em +15.000 por
  unidade adquirida pelo personagem (15.000, 30.000, 45.000...). Crescimento é proposta de equilíbrio,
  não limite de compras. Contador persistido e compartilhado entre lojas desse personagem.
- Para impedir compra antecipada em lote pelo preço inicial, atualizar o contador na compra, não
  apenas no consumo. Não haver transferência de tomos entre personagens na primeira versão.
- Validar o preço com o maior desconto de Carisma e a renda de ouro nos níveis 20, 25 e 30.
  “Caro” deve ser medido em tempo de jogo e escolhas de compra; preço alto isoladamente não garante equilíbrio.
- Exibir o preço vigente e a regra de encarecimento antes da compra. Não incluir no drop comum inicial.
- Estoque e preço por personagem exigem regra de oferta comum à UI e à transação autoritativa;
  não confiar no preço enviado pelo cliente. Verificar também limite de ouro e valores representáveis.

## 4. Consumíveis de evolução por família

- Cada unidade substitui o custo de 1 ponto para subir um único rank de uma habilidade conhecida.
  Pontos continuam funcionando como alternativa. O item não ensina, não acelera estudo e não sobe
  vários ranks de uma vez.
- Registrar uma família explícita por habilidade na definição original. Não decidir pela aparência,
  último elemento aplicado ou evolução escolhida. Uma evolução elemental não troca a família.
- Famílias iniciais propostas: oito elementos (fogo, gelo, raio, veneno, terra, sombra, sagrado e
  psíquico), técnicas marciais, magia arcana, suporte e fusão. Mapear todo o catálogo, inclusive
  habilidades geradas e passivas, com regra determinística e sem habilidades órfãs.
- Exemplo: **Essência de fogo** evolui Bola de fogo e Golpe flamejante; não evolui uma Explosão
  originalmente arcana que recebeu um elemento por evolução. Fusão usa essência de fusão.
- Preservar nível mínimo do rank, máximo 5 e escolhas dos ranks 3 e 5. Um único fluxo de evolução
  aceita pagamento por ponto ou item e aplica as mesmas validações.
- Na mochila, “Usar” abre a seleção de habilidades compatíveis. Mostrar rank atual, próximo rank,
  requisito e escolha de caminho. Cancelar, requisito inválido ou falta de item não consome nada.
  Na tela de habilidade, apresentar separadamente “Usar ponto” e “Usar essência”.
- Distribuição proposta inicial: drops de inimigos temáticos/chefes e receitas de troca na forja
  para reduzir dependência de sorte. Não garantir todas as famílias em toda loja nem misturar essas
  essências ao pool geral de poções. Chances, receitas e conversões devem ser calibradas pelo número
  de ranks obtidos por hora, em comparação ao tomo de ponto livre.

## 5. Saves, compatibilidade e progressão existente

- Nova versão do save: velocidade/fração de estudo, contadores de compra e demais campos necessários.
  Migrar estudos ativos preservando o trabalho restante; bônus de velocidade inicial neutro.
- Reembolsar acelerações antigas que estejam comprovadas no estudo ativo, sem reverter o tempo
  já economizado. Estudos concluídos não guardam esse histórico: não inferir um reembolso global
  apenas pelo nível, pois livros, missões e pontos já usados tornam essa conta ambígua.
- XP excedente acumulado no antigo limite 20 exige decisão antes da migração. Proposta: preservar
  o excedente como registro legado, sem convertê-lo automaticamente em dez níveis na primeira carga.
  Definir a política de aproveitamento antes de implementar; não descartar silenciosamente XP existente.
- Atualizar clonagem, digest, patches, servidor, certificação, nuvem e importação/exportação.
  Compras e consumos precisam registrar a origem dos novos ganhos onde a integridade exigir.

## 6. Ordem de implementação e aceitação

1. Fechar interpretações de velocidade/duração, política de XP legado e valores de partida.
2. Estudo e consumível de aceleração: retirar gasto antigo, consumo, persistência e interface.
3. Evolução por família e tomo: catálogo, comandos, escolhas, transações e estoque.
4. Progressão até 30: políticas de XP por destinatário, conteúdo, geração e compatibilidade de modos.
5. Migração e testes completos; recalibrar economia e combate antes de registrar números finais.

Verificações necessárias:

- Acelerações isoladas e mistas, repetição, frações de tick, pausa, save e conclusão; nenhum ponto
  é gasto e nenhum item some sem efeito válido.
- Rank por ponto e por item com resultados equivalentes, famílias incompatíveis, rank máximo,
  nível insuficiente, cancelamento e escolhas dos ranks 3 e 5.
- Loja garante aceleração comum, conserva sorteio, calcula preço correto e não cobra com mochila cheia.
  Comandos duplicados não concedem pontos ou ranks adicionais; cenário cooperativo validado no servidor.
- Transições 19→20, 20→21, 29→30, máximo 30, fontes de XP, grupo de níveis mistos, antifarm,
  frações e dificuldade. Ouro não recebe a penalidade nova de XP.
- Saves antigos, nuvem, arena com clamp e personagens de nível 30; nenhuma alteração silenciosa de
  escolhas existentes. Preservar as 77 metas atuais e acrescentar cenários de nível 20, 25 e 30.
- Medir em cada dificuldade tempo para subir, ouro/minuto, custo real dos novos itens, ranks obtidos
  e builds focadas/híbridas/com passivas. Rodar typecheck, lint, testes, build e e2e dos fluxos alterados.

## Decisões a confirmar na revisão do plano

1. Bônus aditivo de velocidade somente até terminar o estudo atual, sem limite de três consumos.
2. Tabela inicial de XP e referência Normal atual para o ritmo natural de Pesadelo.
3. Preços e encarecimento progressivo do tomo; disponibilidade temática das essências.
4. Destino do XP legado no nível 20 e alcance possível dos reembolsos antigos.
