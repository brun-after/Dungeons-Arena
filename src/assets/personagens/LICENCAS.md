# Personagens pré-renderizados

**Versão:** 1.4 · **Data:** 02/11/2026 (1.1: as camadas de equipamento; 1.2: armas por desenho e grau, armadura por grau e as feras)

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
| `guerreiro`, `necromante`, `vampiro`, `cultista` | traje Ranger (masculino) com a cabeça do corpo base; as classes sem armas (vêm nas camadas), o cultista com a lâmina do KayKit |
| `arqueiro`, `sombra` | traje Ranger (feminino) com a cabeça do corpo base; besta do KayKit |
| `mago`, `aventureiro`, `goblin`, `orc`, `troll`, `vendedor` | traje Peasant com a cabeça do corpo base; livro (Quaternius), lâmina e machado (KayKit) |
| `demonio` | corpo base Superhero, tingido |
| `esqueleto` | KayKit `Skeleton_Minion` (cabeça reduzida) com a lâmina |
| `generico` (boneco de treino), `espantalho` | Quaternius `Dummy` (parado) |
| `sentinela` | traje Ranger com elmo, peitoral e ombreiras feitos na ferramenta; lâmina e escudo do KayKit |
| `fada` | traje de camponesa (feminino) com a cabeça do corpo base; asas feitas na ferramenta |
| `lobo`, `aranha`, `falcao`, `slime` | geometria simples feita na ferramenta (`tools/sprites/feras3d.ts`, `criaturas3d.ts`) |
| `armas/*` | geometria simples feita na ferramenta (`tools/sprites/armas3d.ts`), com as formas e cores dos desenhos do jogo |
| `<classe>~cabeca-*`, `<classe>~corpo-*`, `<classe>~capa-*` | o capuz e o pano do traje (Quaternius) na cor da raridade; elmo, peitoral, ombreiras e capa feitos na ferramenta (`tools/sprites/armaduras3d.ts`) |

## Dragões sombrios (02/11/2026, revisão 2)

Os atlas `dragao_fogo`, `dragao_gelo`, `dragao_raio` e `dragao_veneno` agora derivam de
**Cethiel's Dragon 3D**, substituindo o modelo anterior de Quaternius. Autores: **Drummyfish**
(modelo, rig e animações 3D) e **Cethiel** (arte original e textura). Licença: **CC0 1.0**,
confirmada na publicação do próprio autor e na ficha de sua animação no Wikimedia Commons:
- https://opengameart.org/content/cethiels-dragon-3d
- https://commons.wikimedia.org/wiki/File:3D_dragon_animation.gif

Download: https://opengameart.org/sites/default/files/dragon_oga.zip
SHA-256 do pacote: f6a8c25dd3b2abdb1e7830b0b88f9083052c0750e710e6439eceb320783a57c1.
Arquivos usados: `dragon.dae`, `dragon_black.png`, `dragon_idle.dae`, `dragon_walk.dae`,
`dragon_attack.dae` e `dragon_die.dae`. O pacote contém também os arquivos Blender de origem.
O download não inclui um arquivo de licença separado; a declaração CC0 está na publicação do autor.
Atribuição não é exigida; os créditos acima ficam registrados por cortesia.

Porte variável de 1,1 a 2,2 células por nível (atlas de referência: 3,3), escamas negras, energia elemental discreta adicionada em tempo real no
renderizador do jogo. As quatro variantes compartilham a aparência do corpo; o elemento aparece
nas brasas, névoa fria, arcos elétricos ou energia venenosa. Atlas de 3969×2416 pixels, revisado em 03/11/2026:
origem centralizada, apoio no plano do chão e margem para todas as poses, incluindo a morte.
Repouso, caminhada, ataque/conjuração e morte vêm dos respectivos arquivos Collada.
A conversão preserva a textura e retargeteia as animações pelos nomes dos ossos, não pelos UUIDs.
Geração: `npx tsx tools/sprites/render.ts --so dragao_fogo,dragao_gelo,dragao_raio,dragao_veneno --so-corpo`.
O Necromante Ancestral reutiliza o atlas CC0 `necromante` já documentado acima.

As invocações do necromante jogador recebem tonalidade avermelhada nas duas projeções;
as do boss usam o preset exclusivo `esqueleto_do_ossuario`, negro mesmo sem o dono no recorte de rede.

## Classes com visual de mangá

Os corpos jogáveis usam os mesmos rigs e clipes CC0 listados acima, com paletas inspiradas nos retratos e peças de cabelo, barba e capuz dos pacotes originais. O acabamento em faixas de luz e contorno é aplicado na geração do WebP.

- Para reproduzir os corpos, com os pacotes Standard extraídos em `.brutos`: `npx tsx tools/sprites/render.ts --so-corpo --reusar-maos --so aventureiro,guerreiro,mago,arqueiro,necromante`.
- Para exportar os cinco rigs montados e seus clipes de origem: `npx tsx tools/sprites/render.ts --modelos <diretório>`. O GLB contém a malha e as texturas. A iluminação do atlas é definida pelo gerador.
- `--gpu` usa a aceleração gráfica local para a geração. A opção `--reusar-maos` é destinada a alterações que preservam os encaixes e a geometria do tronco. Quando só a origem de um golpe muda, o corpo é alinhado ao atlas de armadura. Se a pose divergir, o gerador pede a regeneração das camadas.
