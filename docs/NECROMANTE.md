# Necromante e Trevas

## Classe

Nova classe selecionável ao criar um personagem, com modelo nativo próprio nas duas vistas. Usa Inteligência, cajado e magia de Trevas. A afinidade concede +10% de dano e −20% de custo às habilidades desse elemento.

A passiva funciona independentemente da barra equipada, inclusive nas fichas de treino da arena:

- **Servo do ossuário:** acompanha o personagem desde o primeiro tick. Se morrer, retorna após 8 segundos, desde que o dono esteja vivo e exista espaço.
- **Reanimados:** abates do Necromante ou de suas invocações erguem um morto por 25 segundos se a vítima estiver a até 6 células. Abates dos mortos dão XP ao dono, sem duplicar sua participação.
- **Eco aliado:** a morte de um jogador aliado a até 6 células pode criar uma cópia temporária de seu modelo de classe e equipamento. O original morre e revive pelas regras normais do modo. O eco não tem bolsa, itens, XP ou acesso às habilidades do aliado. Há intervalo de 30 segundos por aliado; dois Necromantes próximos não duplicam o eco da mesma morte.
- **Limites:** quatro invocações comuns por Necromante nos modos atuais, com um espaço reservado para o servo durante seu retorno. Chefes reanimados emprestam apenas a aparência. Todos os mortos usam um orçamento próprio de vida e dano, causam 50% do dano de uma invocação normal e seguem o teto de NPCs do modo. Não geram loot, XP ou novas reanimações quando morrem.

## Habilidades

| Habilidade | Função |
|---|---|
| Toque funesto | Ataque básico mágico de Trevas à distância. |
| Dardo funesto | Projétil que aplica Definhando: menos dano causado e menos cura recebida. |
| Dízimo vital | Drena até 18 de vida da invocação própria mais próxima, a até 6 células, para curar o dono. Pode consumir o servo. Não atinge jogadores nem invocações alheias; vida cheia ou ausência de invocação recusa antes de gastar mana/recarga. A cura respeita veneno e outras reduções. |
| Garras do ossuário | Dano de Trevas em área e enraizamento, preparando ataques dos mortos e combos. |
| Comando sepulcral | Fortalece as próprias invocações próximas por 6 segundos: +25% de dano e 20% de redução na recarga do básico. |
| Mortalha fúnebre | Aprendível a partir do nível 3: escudo e breve passagem sem colisão. |
| Ceifa de almas | Aprendível a partir do nível 5: cone de Trevas que puxa inimigos. |

As seis habilidades ativas têm livros, ranks, caminhos de evolução e descrições. Os números acima são os valores de base, antes de rank e potência.

## Combos

- **Sepultura aberta:** Dardo funesto → Garras do ossuário no mesmo alvo definhando, +25% de dano nas garras.
- **Tributo da legião:** Comando sepulcral → Dízimo vital, com invocação realmente comandada e vida drenada, concede escudo de 8 por 3 segundos.
- **Crematório:** Garras do ossuário → Bola de fogo no mesmo alvo ainda enraizado, +20% de dano.
- **Absolvição funesta:** Dardo funesto → Lança radiante no mesmo alvo definhando, +15% de dano além das reações elementais.

As janelas entre etapas são de 3 segundos. Os dois primeiros estão disponíveis com o kit inicial, sem exigir outra habilidade. Os efeitos só são confirmados pelo impacto ou pelo dreno efetivo. Cada combo tem composição visual própria.

## Um único elemento Trevas

Trevas substitui a antiga identidade elemental `sombra`, mantendo Marca, Eclipse e as interações anteriores. Acrescenta Putrefação (Trevas sobre veneno), Pira fúnebre (fogo sobre Definhando) e Absolvição (sagrado sobre Definhando).

O elemento participa das etiquetas de afinidade, caminhos, resistências, armas e equipamentos gerados, cores, descrições e reações. Cinco bases recebem afinidade de Trevas: cajado, adaga, tomo, manto e anel. IDs de habilidades, essências e caminhos antigos permanecem estáveis. Um nome de habilidade como Punhal das sombras continua sendo apenas o nome temático da habilidade, cujo elemento é Trevas.

O schema 19 migra referências elementais nos saves atuais e nas fases visitadas. Itens antigos com `sombra` em seu ID continuam resolvendo como o mesmo item, agora de Trevas. A lista histórica dos cinco elementos do gerador de skills por semente permanece estável para não alterar os livros raros já salvos. Trevas tem skills autoradas e livros próprios, como os elementos mais recentes já tinham.

## Validação

Testes de passiva, limite, retorno, XP, morte simultânea, eco/renascimento, dreno real, custo recusado, combos, clone, patches e migração. Navegador em desktop e celular: escolha da classe, conjuração, mortos com modelos originais, consulta dos combos e exportação/reabertura do save. O servidor cooperativo testa o Necromante e a replicação de seu servo para outro cliente.

As 77 metas anteriores do balanceamento continuam passando. Uma sondagem adicional de 120 lutas do Necromante no Normal (8 sementes, goblin/orc/troll em sequência, níveis 1/5/10/20/30) teve 120 vitórias e tempos medianos de 6,1/4,1/4,2/5,6/12,1 segundos. O bot usa a barra e o servo automático; é uma amostra, sem cobrir todas as builds, dificuldades ou PvP.
