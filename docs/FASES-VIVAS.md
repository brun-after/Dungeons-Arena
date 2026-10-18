# Fases vivas

**Versão:** 1.0 · **Data:** 17/10/2026 · **Decisão:** D-079

As salas e os corredores em L continuam sendo a base da campanha. O terreno nativo perde as juntas de cada célula e recebe marcas esparsas de pedra, pequenas fissuras e sombras junto às paredes. A grade lógica de colisão e a navegação permanecem iguais. Atlas personalizados continuam usando suas próprias peças.

## Portas de retorno

A partir da segunda fase, uma porta azul no ponto de entrada leva à anterior. O minimapa também a mostra. A chegada fica ao lado da porta de destino para evitar uma nova transição automática. Nas aventuras, segue a ordem das fases; no grupo, todos os jogadores vivos precisam estar na mesma porta.

O save conserva as referências exatas das fases visitadas, incluindo semente, dimensões, formato e regras de estilo. Baús consumidos, inimigos, recargas e reservas de enxame são restaurados. A primeira passagem mantém a recuperação de recursos já existente; retornar ou revisitar não recupera vida nem mana. Personagens mortos do grupo continuam sendo revividos ao trocar de fase, como antes.

Saves antigos continuam abrindo, com migração sem alteração do estado para o schema 17. A versão nova impede clientes antigos de descartarem parâmetros de uma espiral salva. A geometria de geradas antigas permanece a mesma, pois os novos parâmetros só entram nas próximas referências criadas. Sem histórico de referências, o retorno às geradas anteriores recompõe a sequência determinística antiga usando o estilo disponível na referência atual; um estilo diferente usado naquela fase antiga não pode ser recuperado de saves que nunca o registraram. Estados já salvos conservam seus objetos e valores de armadilha; o novo conteúdo aparece ao iniciar uma fase ainda não visitada.

## Terreno e armadilhas

- Água aplica **Molhado**, usando as reações existentes com raios e terra.
- Brasas aplicam **Queimando**; miasma aplica **Envenenado**. Afetam os dois lados e podem preparar emboscadas.
- As áreas são pequenas, espaçadas e passáveis; não substituem as salas comuns. Não alteram o terreno dinamicamente ao receber um feitiço.
- Armadilhas das fases oficiais novas passam a causar pelo menos 18 de dano. Nas novas geradas, o dano cresce com o nível até o teto definido em `balance.json`, com sangramento e rearme.
- O disparo tem onda, clarão local e espinhos. A versão simples continua aparecendo sem partículas e com movimento reduzido; partículas e impacto de tela respeitam os controles existentes.
- **Engenho de armadilhas** é um buff de 20 segundos, disponível por santuário ou orbe. Interagir com uma armadilha **já revelada** a converte para a equipe do jogador, preservando dano e rearme. Sem o buff, a interação continua sendo o desarme por Sabedoria.
- Na campanha em grupo, o canal privado inclui somente armadilhas descobertas pelo jogador ou de sua equipe; o estado público continua ocultando todas elas.

## Variações ocasionais

Nas novas profundezas, o evento **Enxame** tem chance de 12% por fase. Os inimigos adicionais ficam numa reserva de índices, sem entidade, IA ou sprite até entrarem em jogo. A cada segundo, entram até seis, longe da posição imediata dos jogadores; a entrada e os respawns param quando há 40 entidades de IA vivas. Invocações continuam respeitando seus próprios limites. A reserva persiste nas revisitas e nos saves.

A cada sete profundezas, o mapa pode ter 84×56 células. A cada onze, aparece uma espiral com corredor de três células e paredes entre voltas, também em 84×56. As demais geradas continuam em 60×40, com salas e corredores em L. Enxame, tamanho e formato são independentes.

## Verificação

`npm run verificar` confere tipos, lint, testes e build. `npm run balancear` mantém as 77 metas existentes. `npx playwright test tests/e2e/fases-vivas.spec.ts --project=desktop --project=celular` testa ida/volta real por IndexedDB e renderiza uma galeria nativa sem partículas.

`npm run bench:fases` mede somente a simulação: 6.000 ticks, mapa 84×56 e 120 inimigos entre ativos e reserva. Na execução local desta alteração: máximo de 40 ativos, média de 0,24 ms por tick, p95 de 0,69 ms e p99 de 1,59 ms, descartando os 300 ticks iniciais. Esses números não medem a GPU nem garantem FPS em celulares reais; a emulação de celular valida a interface e o fluxo.

## Ideias para próximas expansões

Alavancas que abrem atalhos, braseiros que podem ser apagados e salas com objetivos opcionais são extensões naturais. Cada uma deve criar uma escolha clara e aparecer ocasionalmente, preservando o ritmo das salas atuais.
