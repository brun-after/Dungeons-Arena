# Personagens pré-renderizados

**Versão:** 1.0 · **Data:** 31/10/2026

Os atlas desta pasta são renderizados por `tools/sprites/render.ts` a partir de modelos 3D e animações de pacotes sob
a licença **CC0 1.0 Universal** (domínio público). A licença está no arquivo de licença de cada pacote. Cada atlas tem
8 direções e os quadros de 5 estados (parado, andar, golpe, conjurar e morte), no ângulo do isométrico do jogo, com a
luz do clima sombrio, menos saturação e contorno escuro. As receitas ficam em `tools/sprites/receitas.ts`. Os zips
brutos ficam em `.brutos/`, ignorado pelo git. Baixados em 31/10/2026.

| Pacote | Autor | Origem | Licença |
|---|---|---|---|
| Universal Base Characters [Standard] | Quaternius | <https://quaternius.itch.io/universal-base-characters> | CC0 1.0 (`License_Standard.txt`) |
| Modular Character Outfits – Fantasy [Standard] | Quaternius | <https://quaternius.itch.io/modular-character-outfits-fantasy> | CC0 1.0 (`License_Standard.txt`) |
| Universal Animation Library [Standard] | Quaternius | <https://quaternius.itch.io/universal-animation-library> | CC0 1.0 (`License.txt`) |
| Universal Animation Library 2 [Standard] | Quaternius | <https://opengameart.org/content/universal-animation-library-2> | CC0 1.0 (`License.txt`) |
| KayKit Character Pack: Skeletons 1.1 (Free) | Kay Lousberg | <https://kaylousberg.itch.io/kaykit-skeletons> | CC0 1.0 (`License.txt`) |
| Fantasy Props MegaKit [Standard] | Quaternius | <https://opengameart.org/content/fantasy-props-megakit> | CC0 1.0 (`License_Standard.txt`) |

O crédito não é obrigatório; fica registrado aqui por cortesia: modelos de Quaternius (quaternius.com) e de Kay
Lousberg (www.kaylousberg.com).

| Atlas | Corpo e peças |
|---|---|
| `guerreiro`, `necromante`, `vampiro`, `cultista` | traje Ranger (masculino) com a cabeça do corpo base; machado e escudo, cajado ou lâmina do KayKit |
| `arqueiro`, `sombra` | traje Ranger (feminino) com a cabeça do corpo base; besta do KayKit |
| `mago`, `aventureiro`, `goblin`, `orc`, `troll`, `vendedor` | traje Peasant com a cabeça do corpo base; livro (Quaternius), lâmina e machado (KayKit) |
| `demonio` | corpo base Superhero, tingido |
| `esqueleto` | KayKit `Skeleton_Minion` (cabeça reduzida) com a lâmina |
| `generico` (boneco de treino), `espantalho` | Quaternius `Dummy` (parado) |
