# Skills de classe, ultimates, sintonia e combos

**Versão:** 1.2 · **Data:** 24/10/2026

Gerado por `tools/grimorio/gerar-doc.mjs` a partir do Grimório das Classes (`tools/grimorio/grimorio-das-classes.html`), o
desenho aprovado do marco 24 (D-094 a D-097). Os números finais de cada skill ficam em `src/data`; aqui está a
identidade de cada uma. Para mudar o desenho, edite o Grimório e rode o script de novo.

## Regras

- **Teclas 1–2, 3–6 e a ultimate.** As teclas 1 e 2 aceitam só skills de classe. As teclas 3 a 6 aceitam só gerais. O botão grande é a ultimate, que depende do par nas teclas 1 e 2. São 7 skills ao todo. No teclado, R faz a ultimate; os consumíveis ficam nas teclas 7 a 0.
- **Livros.** Cada classe começa com 2 skills de classe e 1 geral. As outras 6 de classe vêm de livros exclusivos, que só a classe lê e que ensinam na hora. As gerais precisam achar o livro e gastar ponto, e depois passam pelo estudo de sempre.
- **Passiva de classe e passivas gerais.** Cada classe tem uma passiva inata, sempre ativa, que também enche a ultimate do seu jeito. Afinidade elemental e Olho de águia viram skills ativas de classe. Cada família tem 2 passivas gerais, uma defensiva e uma ofensiva. Você mantém até 3 ativas, além da passiva da classe, e troca à vontade fora de combate no painel de passivas. Elas são aprendidas por livro e ponto e não ocupam tecla.
- **As gerais mudam a passiva.** A família de cada geral nas teclas 3 a 6 liga uma sintonia na passiva da classe. Duas da mesma família fazem Domínio e marcam a ultimate, e certos pares 2 + 2 ligam vertentes. Detalhes na ficha de cada classe e na seção Sintonia.
- **Ataque pelas costas.** Cada personagem e inimigo olha para onde andou por último ou para quem está atacando. Um golpe é pelas costas quando sai do lado oposto a esse olhar. Em grupo, enquanto um segura o inimigo, os outros flanqueiam.
- **Rank pelo nível.** As skills de classe sobem de rank sozinhas com o nível do personagem (ranks nos níveis 1, 3, 6, 10 e 15). Nos ranks 3 e 5 você escolhe o caminho. As gerais continuam subindo por ponto ou essência.
- **Medidor de carga.** O medidor enche com dano, cura, combos e abates, e a meta é encher a cada 45 a 70 s de luta. Cheio, o botão brilha. Usar zera o medidor.
- **Alvo e Parar ataque.** Os botões 1 e 2, de classe, ficam à esquerda da roda. O toque no botão de alvo troca o alvo e liga o ataque básico. Acima dele, Parar ataque desliga o automático, para deixar o abate para um aliado. No teclado, a tecla F liga e desliga.
- **XP compartilhado.** Quem faz o abate leva 100% do XP. Cada aliado vivo a até 12 células, ou que lutou nos últimos 10 s, leva 75%. Jogando sozinho, nada muda.

## Classes

### Guerreiro

Corpo a corpo, fúria e proteção do grupo. Geral inicial (tecla 3): Investida.

**Passiva: Fúria e aura de batalha.**

- Princípio: cada skill tem um lado de ataque e um de defesa, e a fúria decide qual pesa mais. O Guerreiro se protege batendo e bate mais quando se arrisca.
- Tudo o que vale hoje continua, com as três mudanças abaixo.
- A resistência contra grupos cai de 15% para 10%. A proteção que sai volta como escudo por acerto no Redemoinho (até 10) e na Investida de escudo (até 16), ou seja, só para quem está batendo.
- Até a metade, a fúria funciona como hoje, alimentando a aura e as curas.
- Fúria cheia liga o Frenesi: por 6 s, +20% de dano e +15% de velocidade de ataque, mas a resistência contra grupos vai a zero. As curas dobradas continuam. No fim, a barra zera.
- Durante o Frenesi, cada skill de classe tem o seu efeito de fúria. Isso substitui a regra da 1.1 de gastar metade da barra a cada skill.
- Encher a fúria dá +15 de carga na ultimate. O Desafio e o Contragolpe também enchem a fúria.
- Visual: O rastro da lâmina muda de cor com a fúria: cinza, vermelho na metade e laranja com brasas no Frenesi. No Frenesi, brasas sobem do corpo e os olhos acendem.

| Skill | Id | O que faz | Visual |
|---|---|---|---|
| ★ Redemoinho | `redemoinho` | Gira e acerta tudo em volta. Cada hostil atingido dá 2 de escudo, até 10. No Frenesi: +1 de raio, e os atingidos são puxados 1 célula para dentro. | Imagens residuais da arma em volta, com um funil de faíscas metálicas. |
| ★ Investida de escudo | `investida_de_escudo` | Avança 2 células com o escudo à frente, bloqueando projéteis frontais durante o avanço. Cada hostil atingido é empurrado 1 célula e dá 4 de escudo, até 16. No Frenesi: Avança 4 células, e o primeiro atingido fica atordoado por 0,5 s. | Placas hexagonais de metal se montam na frente do corpo, e o impacto solta faíscas em leque. |
| Brado | `brado` | Os aliados próximos batem mais, e uma onda curta empurra os hostis 1 célula, com dano leve. No Frenesi: A onda empurra 2 células e tira lentidão e medo dos aliados. | Uma onda de choque visível no chão, levantando poeira em anel. |
| Corrente | `corrente` | Puxa o alvo até você, e o próximo golpe nele é crítico. No Frenesi: Puxa também os hostis a até 1 célula do alvo. | Elos que brilham em brasa durante o puxão. |
| Lâmina em brasa | `lamina_em_brasa` | Carrega 0,5 s e solta um arco de fogo em cone de 3 células. Com a fúria acima da metade, o arco é maior e deixa o chão em brasa por 2 s. No Frenesi: Sai sem tempo de carga. | A lâmina esquenta do cinza ao laranja durante a carga e corta deixando um rastro de fogo no ar. |
| Desafio | `desafio` | Os hostis a até 3 células passam a atacar você por 3 s e levam +15% de dano de você enquanto isso. Cada desafiado dá fúria. No Frenesi: Alcance de 5 células, e o bônus sobe para +25%. | Correntes de luz vermelha saem do peito e se prendem em cada desafiado, esticando quando eles se afastam. |
| Salto esmagador | `salto_esmagador` | Salta até 4 células e atordoa em volta por 0,5 s ao cair. No Frenesi: Atordoa por 1 s. | Uma sombra cresce no ponto de queda antes do impacto, e a cratera fica com rachaduras incandescentes por 2 s. |
| Contragolpe | `contragolpe` | Postura de 1,5 s: apara o próximo golpe, anula o dano, atordoa o atacante por 1 s e responde na hora com um golpe em arco de 180° à frente. Aparar enche a fúria. No Frenesi: O arco vira 360°. | Congelamento de 60 ms no aparo, um anel branco de impacto e o arco da lâmina em vermelho. |

Linguagem visual das ultimates: Pausa de 40 a 60 ms em todo golpe forte, rastro da lâmina na cor da fúria e rachaduras no chão que somem em 2 s.

| Par | Ultimate | O que faz |
|---|---|---|
| Redemoinho + Investida de escudo | Ciclone de aço | Gira andando por 3 s com o escudo girando junto, bloqueando projéteis. Cada hostil atingido dá 3 de escudo (até 15), e no fim o escudo acumulado explode em dano em volta. |
| Redemoinho + Brado | Fúria rodopiante | Um giro largo (raio 3). Cada aliado no alcance soma +10% ao giro, e o brado ecoa neles. |
| Redemoinho + Corrente | Turbilhão de correntes | Correntes em todos a até 4 células puxam todos para o centro, e o giro os esmaga. |
| Redemoinho + Lâmina em brasa | Vórtice ígneo | O giro solta arcos de fogo em todas as direções e deixa um anel de brasa que se fecha para o centro. |
| Redemoinho + Desafio | Olho do furacão | Desafia todos a até 5 células. Quem chega perto é arremessado pelo giro e leva +15%; você não sofre empurrão. |
| Redemoinho + Salto esmagador | Meteoro de aço | Salta alto e cai girando a até 6 células: cratera que atordoa por 1 s e onda de choque. |
| Redemoinho + Contragolpe | Lâminas em guarda | Gira devagar por 3 s. Cada golpe corpo a corpo recebido é aparado e respondido com um contragolpe em arco. |
| Investida de escudo + Brado | Formação de choque | Você e os aliados a até 4 células avançam juntos 3 células atrás do seu escudo. Os hostis no caminho são empurrados e atordoados por 0,5 s, e cada aliado ganha 6 de escudo. |
| Investida de escudo + Corrente | Aríete acorrentado | Investe com o escudo e acorrenta os hostis a até 3 células do caminho. Todos são arrastados junto e esmagados no ponto final. |
| Investida de escudo + Lâmina em brasa | Égide flamejante | Avança com o escudo em brasa, deixando um rastro de fogo. Por 5 s, quem golpeia você queima, e no fim o escudo explode em chamas. |
| Investida de escudo + Desafio | Carga do desafiante | Investe até o hostil mais forte e desafia todos a até 5 células, ganhando escudo por desafiado. Cada golpe que o escudo absorve aumenta o seu próximo golpe em 5% (até 50%). |
| Investida de escudo + Salto esmagador | Queda do bastião | Salta até um aliado, pousa à frente dele com escudo para os dois e empurra os hostis em volta. |
| Investida de escudo + Contragolpe | Parede de aço | Avança 3 células com o escudo, aparando tudo à frente. Cada aparo responde com um contragolpe no atacante. |
| Brado + Corrente | Chamado às armas | Puxa os aliados a até 6 células para o seu lado. Os hostis no caminho ficam atordoados. |
| Brado + Lâmina em brasa | Brado incandescente | Um brado em cone que incendeia. Os aliados atingidos soltam arcos de fogo nos golpes por 6 s. |
| Brado + Desafio | Rugido do tirano | Os hostis a até 5 células fogem aterrorizados por 2 s e, ao voltar, estão desafiados por você. |
| Brado + Salto esmagador | Estrondo de guerra | Salta no centro dos inimigos. Cada hostil atingido dá +5% de dano aos aliados próximos (até +25%). |
| Brado + Contragolpe | Brado do desafio | Por 4 s, você e os aliados a até 3 células aparam o primeiro golpe e respondem com um contragolpe. Cada contragolpe dá +10% de dano ao grupo (até +30%). |
| Corrente + Lâmina em brasa | Grilhões em brasa | Uma corrente incandescente salta entre até 4 hostis e os prende uns aos outros. Quem se afasta queima. |
| Corrente + Desafio | Laço do carrasco | Puxa o hostil de mais vida e o prende por 3 s. Seus golpes nele batem +50%, e mais com a vida baixa. |
| Corrente + Salto esmagador | Arrasto sísmico | Lança a corrente, salta até o alvo e o arrasta até você, abrindo uma fenda que atordoa no caminho. |
| Corrente + Contragolpe | Desarme | Puxa até 3 hostis. O primeiro golpe de cada um é aparado e respondido, e ele fica sem golpes físicos por 2 s. |
| Lâmina em brasa + Desafio | Pira desafiadora | Vira uma tocha viva por 5 s: desafia e queima quem está a até 2 células, e cresce a cada desafiado. |
| Lâmina em brasa + Salto esmagador | Impacto vulcânico | Salta e cai abrindo uma fenda de lava em linha, que queima por 4 s. |
| Lâmina em brasa + Contragolpe | Riposta ígnea | Por 4 s, cada aparo responde com um arco de fogo e deixa uma brasa aos pés do atacante, que explode 1 s depois. |
| Desafio + Salto esmagador | Desafio do titã | Salta sobre o mais forte, desafia todos e entra em Frenesi na hora, sem perder a resistência durante os primeiros 4 s. |
| Desafio + Contragolpe | Duelo de honra | Desafia o hostil mais forte por 5 s e apara os golpes dele em sequência. No terceiro aparo, ele fica atordoado por 2 s e leva um crítico. |
| Salto esmagador + Contragolpe | Golpe do juízo | Salta sobre um alvo e apara o próximo golpe dele. Se aparar, o golpe de queda executa abaixo de 25% de vida. |

**Sintonia** (família das gerais nas teclas 3–6):

- tecnica: Gerais técnicas enchem a fúria como o ataque básico.
- arcana: A aura alcança +1 célula.
- suporte: No Frenesi, curas e escudos gerais que você lança também dobram.
- fogo: A aura queima.
- veneno: Cada hostil envenenado perto conta em dobro para a resistência contra grupos, fora do Frenesi.
- terra: No Frenesi, você não sofre empurrão nem puxão.
- sombra: Encher a fúria deixa o próximo golpe como ataque pelas costas.
- sagrado: A cura da aura também alcança aliados a até 2 células (25%).
- psiquico: No Frenesi, cada pulso da aura faz os hostis hesitarem por 0,5 s.

**Vertentes** (2 + 2):

- **Paladino** (sagrado + suporte): No Frenesi, a aura cura os aliados com a mesma força com que cura você.
- **Berserker** (fogo + tecnica): No Frenesi, a aura vira chamas, e cada hostil queimando perto prolonga o Frenesi em 0,5 s, até +3 s.
- **Carcereiro** (terra + psiquico): Os desafiados ficam enraizados por 0,5 s ao chegar a 1 célula de você.

### Mago

Elementos, afinidade e mana. Geral inicial (tecla 3): Bola de fogo.

**Passiva: Encarnação elemental.**

- Tudo o que vale hoje continua.
- A Afinidade elemental vira skill ativa de classe. O bônus passivo dela (+15% nas magias de elemento) entra na encarnação: vale enquanto o Mago está encarnado.
- Trocar de encarnação dá +5 de carga na ultimate (no máximo uma vez a cada 4 s).
- As gerais de terra, veneno, sombra e sagrado abrem encarnações novas, e trocar de elemento em até 3 s funde os dois por 6 s (ver Sintonia).
- Visual: Ao trocar de encarnação, um anel do elemento novo empurra o antigo para fora.

| Skill | Id | O que faz | Visual |
|---|---|---|---|
| ★ Lança de gelo | `lanca_de_gelo` | Projétil que resfria. | ao conjurar, estilhaços de gelo; no voo, trilha de brilho; no impacto, estilhaços de gelo. |
| ★ Raio em cadeia | `raio_em_cadeia` | Salta entre alvos. | ao conjurar, faíscas; no voo, faíscas; no impacto, faíscas em zigue-zague; tremor leve. |
| Nova glacial | `nova_glacial` | Explosão de gelo em volta. | ao conjurar, centelhas de luz; no impacto, estilhaços de gelo; tremor leve. |
| Mente partida | `mente_partida` | Dano psíquico e silêncio. | ao conjurar, runas girando; no voo, centelhas de luz; no impacto, estrelinhas girando para cima. |
| Afinidade elemental | `afinidade_elemental` | Vira ativa: por 8 s, as magias do elemento encarnado batem +20% e o estado delas dura mais. Hoje é passiva (+15% em dano elemental), e esse bônus passa para a encarnação. |  |
| Sobrecarga arcana | `sobrecarga_arcana` | A próxima magia bate +40% e custa 10% da vida em vez de mana. | Runas violetas girando nas mãos e gotas vermelhas (a vida paga) subindo e entrando nelas. |
| Piscar | `piscar` | Teleporte de até 4 células que deixa, na origem, um eco do elemento encarnado. | Implosão de centelhas na origem, onde fica um eco na cor do último elemento; reaparece num anel de luz. |
| Orbe instável | `orbe_instavel` | Orbe lento que carrega o elemento encarnado e explode em área no fim ou ao tocar um hostil. | Orbe que pulsa e muda de cor com o elemento absorvido, soltando faíscas; explode nas partículas do elemento. |

Linguagem visual das ultimates: Elemento puro: flash na cor do elemento, um círculo de runas no chão antes do efeito, cristais, relâmpagos e brasas em volume.

| Par | Ultimate | O que faz |
|---|---|---|
| Lança de gelo + Raio em cadeia | Tempestade cristalina | Seis lanças de gelo caem em sequência. Cada acerto solta um raio, e os resfriados conduzem em dobro. |
| Lança de gelo + Nova glacial | Inverno eterno | O chão congela numa área grande por 6 s. Quem entra se resfria e, com 3 acúmulos, vira estátua (1,5 s). |
| Lança de gelo + Mente partida | Estilhaço mental | Uma lança que silencia. Se o alvo tentar conjurar no silêncio, ele estilhaça e leva dano alto. |
| Lança de gelo + Afinidade elemental | Lança dos quatro ventos | Quatro lanças, de gelo, fogo, raio e terra, cada uma com o seu estado. A do elemento encarnado sai em dobro. |
| Lança de gelo + Sobrecarga arcana | Geleira arcana | Uma lança gigante e lenta, que cresce a cada alvo atravessado. Custa vida em vez de mana. |
| Lança de gelo + Piscar | Rastro de geada | Pisca três vezes. Cada ponto vira uma estaca de gelo, e todas explodem juntas. |
| Lança de gelo + Orbe instável | Cometa congelado | O orbe vira um cometa que cai na área. Os cristais que deixa explodem de novo 2 s depois. |
| Raio em cadeia + Nova glacial | Supercondutor | Uma nova que congela tudo. O próximo raio num congelado salta para todos os congelados à vista. |
| Raio em cadeia + Mente partida | Tempestade de pensamentos | Raios psíquicos saltam entre os hostis e os confundem: eles se atacam por 2 s. |
| Raio em cadeia + Afinidade elemental | Prisma elemental | Um prisma gira por 4 s e dispara, em todas as direções, raios do elemento da afinidade. |
| Raio em cadeia + Sobrecarga arcana | Sobretensão | Um raio que salta 10 vezes e ganha dano a cada salto. O último descarrega no hostil de mais vida. |
| Raio em cadeia + Piscar | Relâmpago errante | Você vira o raio: pisca de hostil em hostil (até 6), ferindo cada um, e reaparece no último. |
| Raio em cadeia + Orbe instável | Esfera de plasma | Um orbe elétrico segue o seu alvo por 5 s, disparando raios em quem estiver a até 3 células. |
| Nova glacial + Mente partida | Silêncio glacial | Congela e silencia em área. Os silenciados levam dano psíquico a cada pulso. |
| Nova glacial + Afinidade elemental | Zero absoluto | Os hostis perdem as resistências elementais por 6 s e ficam resfriados, até os que absorvem gelo. |
| Nova glacial + Sobrecarga arcana | Nova cataclísmica | Três novas seguidas, cada uma maior. Custa vida, e a última atordoa. |
| Nova glacial + Piscar | Passo do inverno | Por 4 s você pisca até 4 vezes à vontade, e cada piscada solta uma nova pequena. |
| Nova glacial + Orbe instável | Coração de gelo | O orbe vira um núcleo que puxa os hostis, resfria e explode em nova no fim. |
| Mente partida + Afinidade elemental | Mente elemental | Lê a mente do alvo: por 6 s, todas as suas magias nele são críticas e usam o elemento ao qual ele é mais fraco. |
| Mente partida + Sobrecarga arcana | Colapso psíquico | Dano psíquico alto. Se o alvo cair, o silêncio passa para quem estiver a até 3 células. |
| Mente partida + Piscar | Labirinto da mente | Três cópias ilusórias suas piscam pela área. Os hostis as atacam, e cada cópia destruída explode. |
| Mente partida + Orbe instável | Singularidade | O orbe vira um buraco negro: puxa tudo por 3 s, silencia quem está dentro e colapsa. |
| Afinidade elemental + Sobrecarga arcana | Ascensão arcana | Por 8 s, as skills de classe custam vida em vez de mana, batem +30% e trocam de elemento a cada conjuração. |
| Afinidade elemental + Piscar | Dança dos elementos | Pisca entre 4 pontos em volta do alvo, deixando uma explosão de elemento em cada um. Juntas, fecham numa sinergia. |
| Afinidade elemental + Orbe instável | Orbe da fusão | O orbe guarda as duas últimas encarnações e explode como encarnação dupla, aplicando a fusão em toda a área. |
| Sobrecarga arcana + Piscar | Ruptura dimensional | Abre um rasgo entre a origem e o destino. O que está nele vai para o vazio: dano alto, e execução abaixo de 20%. |
| Sobrecarga arcana + Orbe instável | Supernova | Canaliza 2 s, alimentando o orbe com a sua mana, e explode em toda a área visível. |
| Piscar + Orbe instável | Eco do vazio | Pisca e deixa o orbe. Dois segundos depois, troca de lugar com ele, que explode onde você estava. |

**Sintonia** (família das gerais nas teclas 3–6):

- fogo: Encarnação de fogo (como hoje).
- terra: Encarnação de terra: você não sofre empurrão, e magias de área ganham +1 de raio.
- veneno: Encarnação de veneno: as magias deixam veneno leve, e quem chega perto é envenenado.
- sombra: Encarnação de trevas: cada magia devolve 5% do dano em vida.
- sagrado: Encarnação de luz: as magias consagram, e aliados perto recuperam um pouco de vida.
- psiquico: Não encarna: usar uma geral psíquica estende a encarnação atual em 4 s.
- arcana: Seta e Explosão renovam a encarnação atual, e o Dardo arcano concentra no dobro da velocidade.
- tecnica: Golpes físicos renovam a encarnação em 2 s.
- suporte: Curas e escudos herdam a encarnação (escudo de gelo resfria quem bate, cura de fogo queima em volta).

**Vertentes** (2 + 2):

- **Alquimista** (fogo + veneno): Toda encarnação dupla vira Miasma ardente, e a explosão final do miasma espalha os dois estados.
- **Arquimago** (arcana + psiquico): A encarnação dura o dobro, e Seta e Agulha contam como magias do elemento encarnado.
- **Geomante** (terra + fogo): A Lava dura o dobro, e quem entra no chão de lava fica enraizado por 0,5 s.

### Arqueiro

Distância, Mira firme e marcação. Geral inicial (tecla 3): Flecha venenosa.

**Passiva: Mira firme.**

- Tudo o que vale hoje continua.
- O Olho de águia vira skill ativa de classe (a Mira enche no dobro da velocidade por um tempo). O bônus passivo dele (+1 de alcance e +5% em projéteis) entra na Mira firme e vale sempre.
- O tiro da Mira firme cheia dá +8 de carga na ultimate.
- O Rolamento (novo) enche a Mira na hora.
- Visual: A barra enche como um arco de pontos dourados em volta do Arqueiro, e fecha num estalo de luz quando está cheia.

| Skill | Id | O que faz | Visual |
|---|---|---|---|
| ★ Flecha perfurante | `flecha_perfurante` | Atravessa a linha. | no voo, fagulhas atrás da flecha; no impacto, lascas espalhadas. |
| ★ Chuva de flechas | `chuva_de_flechas` | Área mirada. | no impacto, flechas caindo do alto; tremor leve. |
| Tiro em leque | `tiro_em_leque` | Várias flechas em cone. | no impacto, rajada em cone. |
| Armadilha de caça | `armadilha_de_caca` | Arma uma armadilha a até 4 células. Quem pisa fica enraizado por 1,5 s e marcado. Suas flechas no enraizado contam como Mira firme cheia. | Ao armar, uma estrela de cordas se fecha no chão; ao disparar, um laço que se aperta em volta das pernas e lascas de madeira. |
| Olho de águia | `olho_de_aguia` | Vira ativa: por 6 s, a Mira firme enche no dobro da velocidade e o tiro cheio não a esvazia na primeira vez. Hoje é passiva (+1 de alcance e +5% em projéteis), e esse bônus passa para a Mira firme. |  |
| Flecha explosiva | `flecha_explosiva` | Explode no impacto (raio 1) e empurra 1 célula. | Flecha com esteira de brasas; no impacto, estouro de fagulhas e fumaça. |
| Rolamento | `rolamento` | Recua 3 células. A próxima flecha conta como Mira firme cheia. | Rastro de poeira baixa; ao terminar, o brilho dourado da Mira firme cheia. |
| Marca do caçador | `marca_do_cacador` | Marca o alvo por 8 s: seus projéteis batem +20% nele, e ele não fica invisível. | Retícula de pontos dourados girando sobre o alvo enquanto a marca dura. |

Linguagem visual das ultimates: Precisão: uma linha de mira dourada antes do disparo, o tempo desacelera por 0,2 s e as flechas deixam rastros longos.

| Par | Ultimate | O que faz |
|---|---|---|
| Flecha perfurante + Chuva de flechas | Lança dos céus | Uma flecha sobe e cai como lança gigante, perfurando o chão em linha. |
| Flecha perfurante + Tiro em leque | Leque perfurante | Sete flechas em leque que atravessam tudo. Quem leva duas ou mais sangra. |
| Flecha perfurante + Armadilha de caça | Fio de disparo | Estica um fio entre você e a armadilha. Quem cruza é enraizado e leva uma flecha perfurante automática. |
| Flecha perfurante + Olho de águia | Tiro do falcão-rei | Mira por 1,5 s, com a linha de mira à vista. A flecha alcança a tela toda e é crítico garantido. |
| Flecha perfurante + Flecha explosiva | Flecha do cataclismo | Perfura em linha e explode em cada hostil atravessado, em cadeia. |
| Flecha perfurante + Rolamento | Tiro de retirada | Rola 4 células para trás e atira 3 perfurantes durante o rolamento. |
| Flecha perfurante + Marca do caçador | Sentença do caçador | Uma flecha que persegue o marcado pela tela, atravessando o resto. Executa o marcado abaixo de 25%. |
| Chuva de flechas + Tiro em leque | Céu de aço | Uma chuva enorme que avança devagar, por 4 s, na direção apontada. |
| Chuva de flechas + Armadilha de caça | Campo minado | A chuva planta 6 armadilhas pela área, e quem fica preso nelas leva a chuva de novo. |
| Chuva de flechas + Olho de águia | Olhar da tempestade | Por 6 s, cada tiro com a Mira firme cheia faz cair uma chuva de flechas sobre o alvo. |
| Chuva de flechas + Flecha explosiva | Bombardeio | Dez flechas explosivas caem pela área e empurram os hostis para fora do centro. |
| Chuva de flechas + Rolamento | Chuva em fuga | Você rola 3 vezes, e a chuva cai onde você estava. |
| Chuva de flechas + Marca do caçador | Cerco do caçador | Um anel de flechas cai em volta do marcado, e quem cruza o anel fica enraizado. |
| Tiro em leque + Armadilha de caça | Rede de caça | Um leque de redes: os atingidos ficam lentos, e dois atingidos que se tocam ficam presos juntos por 2 s. |
| Tiro em leque + Olho de águia | Salva certeira | Cinco leques em 2 s, cada um mais fechado e com mais chance de crítico. |
| Tiro em leque + Flecha explosiva | Leque incendiário | Um leque de flechas explosivas que deixam o chão em chamas. |
| Tiro em leque + Rolamento | Pirueta mortal | Um salto mortal que atira flechas em 360°. |
| Tiro em leque + Marca do caçador | Matilha de flechas | Oito flechas sobem e caçam até 8 hostis diferentes, primeiro os marcados. |
| Armadilha de caça + Olho de águia | Tocaia | Arma 3 armadilhas em volta de você. Cada uma disparada enche a Mira firme na hora. |
| Armadilha de caça + Flecha explosiva | Mina de estilhaços | A armadilha puxa todos a até 2 células para o centro e explode em seguida. |
| Armadilha de caça + Rolamento | Rota de fuga | Rola 3 vezes, deixando uma armadilha em cada parada. |
| Armadilha de caça + Marca do caçador | Caçada guiada | Armadilhas surgem no caminho do marcado, e cada uma que ele pisa dobra o bônus da marca. |
| Olho de águia + Flecha explosiva | Ponto de impacto | Mira um ponto por 1 s. A flecha explode em raio 3, com o dobro do dano no centro. |
| Olho de águia + Rolamento | Mira inabalável | Por 6 s, levar dano não zera a Mira firme, e o Rolamento fica sem recarga. |
| Olho de águia + Marca do caçador | Olho do predador | Marca todos os hostis à vista. Por 6 s, cada crítico num marcado reduz as recargas. |
| Flecha explosiva + Rolamento | Rastro explosivo | Rola deixando 3 flechas explosivas, que detonam quando um hostil passa. |
| Flecha explosiva + Marca do caçador | Presa marcada | O marcado vira uma bomba: 2 s depois explode e fere os hostis em volta dele. |
| Rolamento + Marca do caçador | Dança do caçador | Por 5 s, rola em volta do marcado atirando. Cada tiro estende a marca. |

**Sintonia** (família das gerais nas teclas 3–6):

- tecnica: Acertar uma geral técnica enche 25% da Mira.
- arcana: O tiro cheio vira mágico e ricocheteia uma vez.
- suporte: Levar dano com escudo ativo não zera a Mira.
- fogo: O tiro cheio deixa fogo na linha que atravessou.
- veneno: O tiro cheio espalha o veneno do alvo para todos os atravessados.
- terra: O tiro cheio empurra 1 célula e enraíza por 0,5 s o último atingido.
- sombra: Invisível, a Mira enche no dobro da velocidade.
- sagrado: O tiro cheio cura os aliados que atravessa.
- psiquico: O tiro cheio silencia por 1 s.

**Vertentes** (2 + 2):

- **Caçador noturno** (sombra + veneno): O tiro cheio feito invisível não revela você e dobra o veneno no alvo.
- **Atirador de elite** (arcana + tecnica): O tiro cheio ricocheteia em até 2 alvos, e cada ricochete enche 15% da próxima Mira.
- **Sentinela** (terra + sagrado): Parado com a Mira cheia, você e os aliados a até 2 células ganham 4 de escudo por segundo (até 12).

### Necromante

Invocações, definhar e dreno. Geral inicial (tecla 3): Barreira.

**Passiva: Exército dos mortos.**

- Tudo o que vale hoje continua.
- Cada morto seu que cai lutando contra hostis dá +3 de carga na ultimate, no máximo uma vez a cada 2 s.
- Os erguidos pelas ultimates e pelo Levante profano são temporários e não contam no limite de 10.
- Visual: Um fio roxo fino liga o Necromante a cada morto enquanto drena. Olhos verdes acendem quando um morto se ergue.

| Skill | Id | O que faz | Visual |
|---|---|---|---|
| ★ Dardo funesto | `dardo_funesto` | Definha o alvo. | ao conjurar, fumaça roxa; no impacto, fumaça roxa. |
| ★ Dízimo vital | `dizimo_vital` | Drena uma invocação; sem invocação, ergue uma. | ao conjurar, fumaça roxa; no impacto, luz dourada subindo. |
| Garras do ossuário | `garras_do_ossuario` | Enraíza. | ao conjurar, fumaça roxa; no impacto, lascas de pedra. |
| Comando sepulcral | `comando_sepulcral` | Seus mortos atacam o seu alvo e ganham +30% de velocidade por 4 s. Os que estão longe voltam para o seu lado. | ao conjurar, fumaça roxa; no impacto, fumaça roxa. |
| Ceifa de almas | `ceifa_de_almas` | Puxa o alvo. | ao conjurar, fumaça roxa; no impacto, fumaça roxa. |
| Mortalha fúnebre | `mortalha_funebre` | Escudo, e você fica fantasma. | ao conjurar, fumaça roxa; no impacto, fumaça roxa. |
| Explosão cadavérica | `explosao_cadaverica` | Detona uma invocação sua: dano de trevas em área, proporcional à vida dela. | A invocação incha em luz roxa e estoura em lascas de osso e fumaça escura. |
| Levante profano | `levante_profano` | Ergue 2 esqueletos temporários (12 s), além do limite normal. | Mãos de sombra rompem o chão, poeira de osso sobe e olhos verdes acendem. |

Linguagem visual das ultimates: Trevas e vida: névoa roxa rente ao chão, fluxos verdes de energia (o dreno) correndo até o Necromante, ossos e olhos que acendem.

| Par | Ultimate | O que faz |
|---|---|---|
| Dardo funesto + Dízimo vital | Banquete funesto | Um dardo cinematográfico atravessa a fila de hostis. Depois, uma energia flui de cada atingido e de cada invocação sua até você, tirando vida de todos e curando você. |
| Dardo funesto + Garras do ossuário | Ossário faminto | O dardo crava no chão e abre um poço de ossos. Mãos esqueléticas enraízam e definham quem está ali. |
| Dardo funesto + Comando sepulcral | Ordem da praga | Todas as suas invocações lançam dardos funestos no seu alvo ao mesmo tempo. |
| Dardo funesto + Ceifa de almas | Colheita sombria | Definha tudo em área. Três segundos depois, a foice passa, e bate mais em quem está definhando. |
| Dardo funesto + Mortalha fúnebre | Véu da peste | Você e as invocações viram névoa intangível por 3 s. Quem atravessa a névoa definha. |
| Dardo funesto + Explosão cadavérica | Pestilência explosiva | O dardo infecta. Quem morrer em 6 s explode como cadáver e infecta os vizinhos, em cadeia. |
| Dardo funesto + Levante profano | Praga dos mortos | Se o atingido morrer em 5 s, ele se ergue como um zumbi seu que espalha definhar. |
| Dízimo vital + Garras do ossuário | Raízes do tributo | Raízes ligam os hostis da área a você e drenam, a cada segundo, vida para você e as invocações. |
| Dízimo vital + Comando sepulcral | Pacto da legião | Tira metade da vida de cada invocação. Em troca, todas ganham +50% de dano e velocidade por 8 s. |
| Dízimo vital + Ceifa de almas | Dízimo das almas | A foice ceifa em cone. De cada hostil atingido volta uma alma, que cura você ou uma invocação. |
| Dízimo vital + Mortalha fúnebre | Sudário vampírico | Por 6 s a mortalha drena: cada hostil a até 2 células perde vida, que vira escudo para você e para os mortos perto. |
| Dízimo vital + Explosão cadavérica | Oferenda ardente | Drena todas as invocações de uma vez e explode essa vida em chamas negras à sua volta. |
| Dízimo vital + Levante profano | Ciclo eterno | Ergue 3 esqueletos. Quando um cai, você recupera vida, e outro nasce no lugar (uma vez cada). |
| Garras do ossuário + Comando sepulcral | Mãos da cripta | Mãos saem do chão em volta de cada invocação e enraízam quem está perto delas. |
| Garras do ossuário + Ceifa de almas | Abraço do ossuário | Enraíza a área, e a foice puxa os enraizados para o centro, arrancando as raízes com dano. |
| Garras do ossuário + Mortalha fúnebre | Cemitério vivo | O chão vira cemitério por 8 s: você e os aliados nele ganham escudo a cada 2 s, e os hostis ficam lentos. |
| Garras do ossuário + Explosão cadavérica | Campo de ossos | Cada invocação explode em estilhaços de osso que enraízam quem atingem. |
| Garras do ossuário + Levante profano | Exército sepulto | Quatro esqueletos sobem do chão sob os hostis, enraizando-os ao sair. |
| Comando sepulcral + Ceifa de almas | Marcha dos ceifadores | As invocações ganham foices e avançam em linha por 6 s, ceifando. |
| Comando sepulcral + Mortalha fúnebre | Marcha fantasma | As invocações viram fantasmas por 4 s e atravessam os hostis. Cada hostil atravessado fica lento e definhando. |
| Comando sepulcral + Explosão cadavérica | Sacrifício em massa | As invocações correm até os hostis e explodem uma atrás da outra. |
| Comando sepulcral + Levante profano | Rei dos mortos | Ergue um Cavaleiro da morte (invocação grande, 15 s) que comanda as outras e lhes dá +20%. |
| Ceifa de almas + Mortalha fúnebre | Foice do além | Vira fantasma com uma foice grande por 4 s. Cada golpe atravessa e marca, e os marcados levam um dano final. |
| Ceifa de almas + Explosão cadavérica | Ceifa explosiva | A foice puxa os hostis até uma invocação sua e a detona com eles grudados. |
| Ceifa de almas + Levante profano | Colheita da legião | Por 8 s, cada hostil que morre se ergue como esqueleto seu (até 4 a mais). |
| Mortalha fúnebre + Explosão cadavérica | Mortalha em chamas | Explode a própria mortalha: dano em volta proporcional ao escudo que sobrou, e 2 s como fantasma. |
| Mortalha fúnebre + Levante profano | Hoste espectral | Ergue 4 espectros que atravessam paredes e recebem golpes por você e pelos aliados. |
| Explosão cadavérica + Levante profano | Ressurreição detonante | Detona todas as invocações, e cada explosão ergue um esqueleto novo no mesmo lugar. |

**Sintonia** (família das gerais nas teclas 3–6):

- tecnica: Os golpes dos mortos fazem sangrar.
- arcana: Cada morto que cai solta uma seta no hostil mais perto.
- suporte: Curas e escudos gerais saltam também para 2 mortos perto do alvo.
- fogo: Os mortos explodem em chamas ao cair.
- veneno: Os golpes dos mortos envenenam.
- terra: Os mortos têm +20% de vida e não sofrem empurrão.
- sombra: Os mortos ficam translúcidos e esquivam 20% dos golpes.
- sagrado: Cada morto que cai cura os aliados a até 2 células.
- psiquico: Um hostil golpeado por 3 ou mais mortos fica aterrorizado por 1 s.

**Vertentes** (2 + 2):

- **Lich** (arcana + sombra): Os mortos lançam setas arcanas em vez de golpear, à distância.
- **Senhor da praga** (veneno + psiquico): Os golpes dos mortos espalham veneno, e o veneno dobra em hostis aterrorizados.
- **Pastor das almas** (sagrado + suporte): Cada morto que cai vira luz que cura os aliados, e o servo volta em 4 s em vez de 8.

### Aventureiro

O falcão: todas as skills de classe saem dele. Geral inicial (tecla 3): Curar.

**Passiva: Falcão companheiro.**

- O falcão continua igual e passa a lançar só as 8 skills de classe, todas dele. As gerais saem do Aventureiro.
- "Aprende de qualquer escola" sai, porque agora toda classe aprende as gerais por livro.
- A redução de 5% na Seta arcana e na Explosão também sai, porque elas viram gerais para todos.
- Cada acerto de skill do falcão dá +2 de carga na ultimate, no máximo uma vez por segundo.
- Visual: A sombra do falcão cruza o chão quando ele troca de alvo. Quando a ultimate está cheia, as penas brilham.

| Skill | Id | O que faz | Visual |
|---|---|---|---|
| ★ Mergulho | `mergulho` | O falcão mergulha no alvo, causa dano e o atordoa por 0,3 s. | O falcão sobe soltando penas e desce num rasante com esteira branca; impacto em penas e estrelas. |
| ★ Grito do falcão | `grito_do_falcao` | O alvo fica exposto (+15% de dano recebido) por 5 s. | Anéis sonoros em cone e penas soltas; o alvo ganha uma marca de garra luminosa. |
| Garras cegantes | `garras_cegantes` | O alvo erra 50% dos golpes por 3 s. | Três riscos de garra brancos sobre o alvo e fumaça cinza na altura dos olhos. |
| Vigia | `vigia` | Por 5 s, o falcão circula você e intercepta 1 projétil por segundo. | O falcão orbita você deixando um anel de penas; projéteis interceptados estouram em faíscas. |
| Rasante | `rasante` | Dano em linha entre você e o falcão. | Uma linha de vento e penas entre você e o falcão. |
| Tempestade de penas | `tempestade_de_penas` | Área em volta do falcão que deixa lento e corta. | Espiral de penas cortantes em volta do falcão. |
| Retorno ao punho | `retorno_ao_punho` | O falcão volta, cura você ou um aliado e zera a recarga do Mergulho. | Trilha verde-dourada do falcão até você, com brilho de cura no braço. |
| Presa dupla | `presa_dupla` | Você e o falcão golpeiam o mesmo alvo. Se os dois acertarem, +50%. | Dois cortes cruzados ao mesmo tempo (o seu e o do falcão); estrelas se os dois acertarem. |

Linguagem visual das ultimates: Céu aberto: a sombra do falcão cruza a tela, espirais de penas, vento e riscos brancos de voo.

| Par | Ultimate | O que faz |
|---|---|---|
| Mergulho + Grito do falcão | Mergulho do trovão | O falcão sobe, grita (expondo a área) e mergulha como um raio, atordoando em volta. |
| Mergulho + Garras cegantes | Ataque cego | O falcão mergulha em até 4 alvos seguidos e cega cada um. |
| Mergulho + Vigia | Sentinela em queda | O falcão mergulha num aliado e o guarda por 3 s, interceptando tudo e ferindo quem o ataca. |
| Mergulho + Rasante | Voo rasante mortal | Três rasantes cruzados pela área, em estrela. |
| Mergulho + Tempestade de penas | Furacão alado | O falcão desce em espiral sobre a área, puxando e cortando. |
| Mergulho + Retorno ao punho | Bumerangue vivo | O falcão mergulha em linha, atravessa e volta: acerta duas vezes e cura você na volta. |
| Mergulho + Presa dupla | Caçada em dupla | Você e o falcão alternam 5 golpes sincronizados, e o último é crítico. |
| Grito do falcão + Garras cegantes | Pânico na revoada | O grito chama uma revoada: os hostis da área fogem e erram golpes. |
| Grito do falcão + Vigia | Alarme da vigília | Por 8 s o falcão revela invisíveis. Quando um hostil chega a 3 células, os aliados ganham escudo. |
| Grito do falcão + Rasante | Clamor dos céus | O grito vira uma onda sônica em linha que empurra e expõe. |
| Grito do falcão + Tempestade de penas | Tempestade estridente | Penas vibrando com o grito: área que silencia e corta. |
| Grito do falcão + Retorno ao punho | Chamado ao lar | O falcão grita e volta. Você voa até ele, deixando expostos e lentos os hostis no caminho, e ao pousar cura você e os aliados a até 2 células. |
| Grito do falcão + Presa dupla | Marca da presa | O alvo fica exposto até morrer. Quando morre, a marca salta para o hostil mais perto, e você e o falcão batem +30% no marcado. |
| Garras cegantes + Vigia | Guardião das garras | O falcão guarda você: quem ataca corpo a corpo fica cego e arranhado. |
| Garras cegantes + Rasante | Riscos de garra | Três rasantes paralelos com garras, cegando quem é atingido. |
| Garras cegantes + Tempestade de penas | Nuvem de penas cortantes | Uma nuvem segue o falcão e cega quem está dentro dela. |
| Garras cegantes + Retorno ao punho | Pilhagem | O falcão arranca até 3 efeitos positivos dos hostis na área e os traz para você e os aliados a até 3 células. |
| Garras cegantes + Presa dupla | Dilacerar em par | Você e o falcão aplicam juntos um sangramento forte e a cegueira. |
| Vigia + Rasante | Patrulha aérea | Por 8 s, o falcão patrulha em círculos amplos e dá rasantes em quem entra. |
| Vigia + Tempestade de penas | Redemoinho de asas | O falcão gira em volta de você: o redemoinho bloqueia projéteis e empurra quem se aproxima. |
| Vigia + Retorno ao punho | Asas protetoras | O falcão cobre você e um aliado: os dois se curam e ganham escudo por 5 s. |
| Vigia + Presa dupla | Vigília da matilha | Dois falcões espectrais extras por 10 s, copiando as ações do seu. |
| Rasante + Tempestade de penas | Ventania de penas | O rasante deixa um corredor de vento: aliados correm mais nele, e os hostis ficam lentos. |
| Rasante + Retorno ao punho | Voo de ida e volta | O falcão vai e volta 4 vezes entre você e o alvo, ferindo na ida e curando na volta. |
| Rasante + Presa dupla | Ataque em pinça | Você avança por um lado e o falcão pelo outro. Quem fica no meio é atordoado. |
| Tempestade de penas + Retorno ao punho | Refúgio de penas | Uma esfera de penas em volta de você e dos aliados próximos absorve dano por 4 s. |
| Tempestade de penas + Presa dupla | Tempestade da caçada | Você e o falcão giram em volta do alvo cortando. Cada golpe reduz a recarga do Mergulho. |
| Retorno ao punho + Presa dupla | Laço inquebrável | Por 8 s, cada acerto seu cura o falcão e cada acerto dele cura você, e as skills do falcão ficam sem recarga. |

**Sintonia** (família das gerais nas teclas 3–6):

- tecnica: Uma geral técnica no alvo do falcão faz ele golpear junto.
- arcana: O falcão repete a Seta ou a Explosão com 30% do dano.
- suporte: Os escudos que você recebe também protegem o falcão.
- fogo: O Mergulho queima.
- veneno: As garras envenenam.
- terra: O Mergulho atordoa também quem está a 1 célula do alvo.
- sombra: O falcão fica invisível entre ataques, e o primeiro golpe dele é crítico.
- sagrado: O Retorno ao punho também cura os aliados a até 2 células.
- psiquico: O Grito do falcão também silencia por 0,5 s.

**Vertentes** (2 + 2):

- **Druida** (terra + suporte): O falcão ganha a postura de guardião: fica ao seu lado e absorve um golpe a cada 4 s.
- **Rapina** (tecnica + sombra): Toda vez que você acerta uma geral técnica, o falcão ataca o alvo pelas costas, com crítico garantido uma vez a cada 4 s.
- **Tempestuoso** (arcana + psiquico): O falcão repete as suas magias gerais com 50% do dano e silencia por 0,5 s quem acerta.

### Encarnação dupla do Mago

| Fusão | Elementos | Efeito |
|---|---|---|
| Vapor | fogo + gelo | Os atingidos erram 30% dos golpes. |
| Plasma | fogo + raio | As magias saltam e queimam. |
| Supercondução | gelo + raio | Os resfriados conduzem raios em dobro. |
| Lava | fogo + terra | As magias deixam chão em chamas. |
| Miasma ardente | fogo + veneno | Queimadura e veneno juntos, que se espalham ao acabar. |
| Eclipse | luz + trevas | Liga a reação Trevas e luz em toda magia. |
| Permafrost | gelo + terra | O chão congelado enraíza quem fica 2 s nele. |
| Névoa gélida | gelo + veneno | O veneno também resfria, e o envenenado resfriado não recebe cura. |
| Inverno sombrio | gelo + trevas | As magias resfriam e definham; quem morre congelado congela os vizinhos. |
| Aurora | gelo + luz | As magias resfriam os hostis e dão 3 de escudo aos aliados a até 2 células. |
| Magnetita | raio + terra | As magias puxam 1 célula, em direção ao alvo, os eletrizados próximos. |
| Neurotoxina | raio + veneno | O envenenado eletrizado fica atordoado por 0,3 s a cada pulso, no máximo uma vez a cada 2 s. |
| Relâmpago negro | raio + trevas | Os raios saltam entre os que estão definhando e drenam 5% do dano em vida. |
| Fulgor | raio + luz | Os raios cegam (30% de erro) e curam os aliados que atravessam. |
| Chama negra | fogo + trevas | A queimadura impede a cura do alvo. |
| Chama sagrada | fogo + luz | A queimadura consagra: quem acerta o alvo se cura. |
| Lodo tóxico | terra + veneno | As magias deixam lama envenenada que atola. |
| Túmulo | terra + trevas | O hostil abatido vira estacas de osso que enraízam os vizinhos. |
| Santuário de pedra | terra + luz | Cada magia dá 2 de escudo aos aliados perto (até 10). |
| Pestilência | veneno + trevas | Quando o alvo morre, o veneno pula para quem estiver a até 2 células. |
| Purgação | veneno + luz | As magias envenenam os hostis e tiram 1 efeito negativo dos aliados atingidos. |

## Domínio (2 gerais da mesma família)

- tecnica: Os atingidos sangram por 3 s.
- arcana: +1 célula de raio ou alcance.
- suporte: Escudo de 8 em você e nos aliados a até 3 células.
- fogo: Os atingidos queimam.
- veneno: Os atingidos ficam envenenados.
- terra: Os atingidos ficam atordoados por 0,5 s.
- sombra: Você fica invisível por 1,5 s depois de usar.
- sagrado: Aliados a até 3 células recuperam vida.
- psiquico: Os atingidos ficam silenciados por 1 s.

## Skills gerais

### Técnica

| Skill | Id | Tipo | O que faz |
|---|---|---|---|
| Investida | `investida` | mobilidade |  |
| Golpe atordoante | `golpe_atordoante` | controle |  |
| Corte dilacerante | `corte_dilacerante` | dano contínuo |  |
| Postura de aparo | `postura_de_aparo` | defesa |  |
| Couraça treinada | `couraca_treinada` | passiva defensiva | Leva 10% menos dano físico. |
| Disciplina marcial | `disciplina_marcial` | passiva ofensiva | Habilidades físicas custam 10% menos. |

### Arcana

| Skill | Id | Tipo | O que faz |
|---|---|---|---|
| Seta arcana | `seta_arcana` | dano direto |  |
| Explosão | `explosao` | área |  |
| Dissipar | `dissipar` | anti-defesa | Retira os escudos e até 2 efeitos positivos dos hostis na área. É o espelho da Purificação. |
| Runa amplificadora | `runa_amplificadora` | zona de apoio | Grava uma runa de raio 2 no chão por 6 s. Você e os aliados dentro têm +20% de dano de magia e recargas 20% mais rápidas. |
| Manto rúnico | `manto_runico` | passiva defensiva | Leva 15% menos dano de magia. |
| Foco arcano | `foco_arcano` | passiva ofensiva | +10% de dano de magia, e as magias gerais recarregam 5% mais rápido. |

### Suporte

| Skill | Id | Tipo | O que faz |
|---|---|---|---|
| Curar | `curar` | cura |  |
| Barreira | `barreira` | escudo |  |
| Purificação | `purificacao` | limpeza |  |
| Impulso | `impulso` | mobilidade de grupo | Você e os aliados a até 3 células ganham +30% de velocidade por 3 s e perdem lentidão e enraizamento. |
| Tenacidade | `tenacidade` | passiva defensiva | Reduz em 15% a duração dos controles (limite de 40%). |
| Fluxo restaurador | `fluxo_restaurador` | passiva ofensiva | Cura efetiva dá 25% em escudo, até 8, uma vez a cada 2 s. |

### Fogo

| Skill | Id | Tipo | O que faz |
|---|---|---|---|
| Bola de fogo | `bola_de_fogo` | área à distância |  |
| Rastro ígneo | `rastro_igneo` | mobilidade | Corre 4 células em linha reta, deixando um rastro de fogo que queima por 3 s. |
| Anel de chamas | `anel_de_chamas` | controle de terreno | Um anel de fogo de raio 2 em volta de você por 4 s. Quem cruza queima e é empurrado 1 célula para fora. |
| Incinerar | `incinerar` | finalização | Consome a queimadura do alvo e causa de uma vez o dano que ela ainda faria, +50%. Sem queimadura, aplica uma curta. |
| Sangue quente | `sangue_quente` | passiva defensiva | Leva 25% menos dano de fogo, e lentidão e resfriamento duram 20% menos. |
| Brasa interior | `brasa_interior` | passiva ofensiva | Seus golpes e magias têm 10% de chance de queimar. |

### Veneno

| Skill | Id | Tipo | O que faz |
|---|---|---|---|
| Flecha venenosa | `flecha_venenosa` | dano à distância (longo) | Alcance longo (8). Veneno lento e fraco por 6 s, que não acumula. |
| Dardo tóxico | `dardo_toxico` | dano à distância (curto) | Alcance curto (4). Veneno rápido por 3 s, que acumula até 3 vezes. |
| Névoa venenosa | `nevoa_venenosa` | área |  |
| Seiva corrosiva | `seiva_corrosiva` | defesa reativa | Por 5 s, quem golpeia você corpo a corpo é envenenado e perde 5 de escudo por golpe. |
| Imunidade adquirida | `imunidade_adquirida` | passiva defensiva | Leva 50% menos dano de veneno, e definhar dura 20% menos. |
| Toxinas potentes | `toxinas_potentes` | passiva ofensiva | Seus venenos causam +20% e duram +1 s. |

### Terra

| Skill | Id | Tipo | O que faz |
|---|---|---|---|
| Estaca de pedra | `estaca_de_pedra` | controle |  |
| Abalo sísmico | `abalo_sismico` | área |  |
| Muralha de pedra | `muralha_de_pedra` | terreno |  |
| Pedregulho | `pedregulho` | dano em linha | Arremessa uma rocha que rola 5 células em linha, ferindo e empurrando 1 célula cada hostil no caminho. |
| Pele de pedra | `pele_de_pedra` | passiva defensiva | +10% de vida máxima e +2 de defesa. |
| Peso da rocha | `peso_da_rocha` | passiva ofensiva | +15% de dano contra alvos enraizados ou atordoados. |

### Sombra

| Skill | Id | Tipo | O que faz |
|---|---|---|---|
| Passo sombrio | `passo_sombrio` | mobilidade |  |
| Punhal das sombras | `punhal_das_sombras` | dano e marca |  |
| Véu da noite | `veu_da_noite` | defesa |  |
| Troca sombria | `troca_sombria` | posicionamento | Troca de lugar com o alvo e o prende. |
| Silhueta esquiva | `silhueta_esquiva` | passiva defensiva | +8% de esquiva, e +15% enquanto você está invisível. |
| Golpe traiçoeiro | `golpe_traicoeiro` | passiva ofensiva | Ataques pelas costas causam +20%. |

### Sagrado

| Skill | Id | Tipo | O que faz |
|---|---|---|---|
| Lança radiante | `lanca_radiante` | dano direto |  |
| Círculo de amparo | `circulo_de_amparo` | cura em área |  |
| Chuva de estrelas | `chuva_de_estrelas` | dano em área |  |
| Asas da aurora | `asas_da_aurora` | mobilidade de resgate | Salta até um aliado a até 5 células e o consagra: ele recupera vida por 4 s. Sem aliado, salta até o ponto escolhido. |
| Graça | `graca` | passiva defensiva | Leva 25% menos dano de trevas, e as curas que você recebe rendem +10%. |
| Zelo | `zelo` | passiva ofensiva | +15% de dano sagrado, e ele ignora 10% da resistência. |

### Psíquico

| Skill | Id | Tipo | O que faz |
|---|---|---|---|
| Onda de repulsão | `onda_de_repulsao` | controle em área |  |
| Agulha mental | `agulha_mental` | dano direto | Projétil rápido de dano psíquico que ignora escudos e defesa. |
| Telecinese | `telecinese` | posicionamento | Move o hostil selecionado até 3 células na direção escolhida. Se bater em algo, fica atordoado por 0,5 s. |
| Presságio | `pressagio` | defesa | Por 4 s, você esquiva o primeiro golpe que receberia, e o seu próximo ataque contra quem o tentou é crítico. |
| Mente blindada | `mente_blindada` | passiva defensiva | Imune a medo e confusão, e o silêncio dura 30% menos em você. |
| Pressão mental | `pressao_mental` | passiva ofensiva | Hostis sob efeito de controle levam +15% de dano de você. |

### Fusões

- **Flecha arcana**: Seta arcana + Flecha perfurante. Arqueiro (com o livro da Seta arcana).
- **Lança tempestuosa**: Lança de gelo + Raio em cadeia. Mago.
- **Ciclone flamejante**: Redemoinho + Lâmina em brasa. Guerreiro. v1.2: passa a soltar arcos de fogo durante o giro.
- **Cadeia sombria**: Corrente + Passo sombrio. Guerreiro. Antes era Corrente + Troca sombria, que misturava Guerreiro e Arqueiro.

## Combos (167) e sinergias passivas (4)

| Combo | Quem | Sequência | Efeito |
|---|---|---|---|
| Moedor | guerreiro | Corrente › Redemoinho | Corrente e depois Redemoinho: +40% de dano e atordoa quem está perto por 0,5 s. |
| Carga do estandarte | guerreiro | Investida › Brado | Após deslocar com Investida, Brado suprime ataques físicos próximos e dá +30% de dano por 4 s. |
| Chuva ácida | arqueiro | Flecha venenosa › Chuva de flechas | Flecha venenosa e depois Chuva de flechas: a área mirada fica envenenada. |
| Condutor congelado | mago | Lança de gelo › Raio em cadeia | Lança de gelo e depois Raio em cadeia: +30% de dano e o alvo fica eletrizado (o raio salta mais). |
| Emboscada | geral | Troca sombria › Golpe atordoante | Troca sombria e depois Golpe atordoante: o d20 vira 20 (crítico garantido). |
| Escudo de geada | mago | Barreira › Nova glacial | Barreira e depois Nova glacial: +25% de dano e os hostis a até 2 células ficam resfriados. |
| Colapso | mago | Mente partida › Explosão | Mente partida e depois Explosão: +35% de dano e a área mirada fica exposta. |
| Saraivada | arqueiro | Tiro em leque › Flecha perfurante | Tiro em leque e depois Flecha perfurante: +40% de dano e o alvo fica exposto. |
| Contra-ataque de ferro | guerreiro | Investida de escudo › Golpe atordoante | O alvo empurrado contra uma parede ou outro hostil fica atordoado o dobro. |
| Aríete flamejante | guerreiro | Investida › Lâmina em brasa | Depois de avançar, a lâmina sai sem tempo de carga. |
| Fornalha | guerreiro | Corrente › Bola de fogo | Acertar o inimigo puxado espalha queimadura curta a até 1 célula. |
| Ruptura | arqueiro | Golpe atordoante › Flecha perfurante | A flecha fortalece o acerto no mesmo alvo ainda atordoado. |
| Retirada glacial | mago | Nova glacial › Piscar | Após a nova atingir inimigos, concluir a troca concede escudo de 8 por 3 s. |
| Refúgio restaurador | geral | Barreira › Curar | Curar efetivamente o mesmo destinatário protegido concede escudo de 6 por 3 s. |
| Disparo encantado | arqueiro | Seta arcana › Flecha perfurante | Acertar as duas habilidades no mesmo alvo fortalece a flecha. |
| Convergência astral | mago | Mente partida › Chuva de estrelas | Acertar o mesmo alvo prolonga sua exposição em 2 s, sem ampliar silêncio. |
| Pântano aprisionante | geral | Estaca de pedra › Névoa venenosa | A névoa sobre o alvo enraizado aplica lentidão apenas enquanto ocupada. |
| Cerco de pedra | geral | Muralha de pedra › Onda de repulsão | Colidir contra a muralha causa dano de colisão e atordoa brevemente. |
| Epicentro | geral | Investida › Abalo sísmico | Após deslocar com Investida, o abalo ganha 1 célula de raio. |
| Emboscada noturna | geral | Passo sombrio › Punhal das sombras | Acertar após o passo prolonga a Marca em 2 s e fortalece o punhal. |
| Retorno das sombras | geral | Véu da noite › Corte dilacerante | Após esquivar durante o véu, o corte prolonga seu sangramento em 2 s. |
| Resposta dilacerante | geral | Postura de aparo › Corte dilacerante | Aparar o atacante prepara sangramento +1 por pulso, substituindo a resposta normal do aparo. |
| Santuário purificado | geral | Círculo de amparo › Purificação | Remover um efeito no próprio círculo concede escudo de 5 aos aliados nele. |
| Veredito radiante | arqueiro | Lança radiante › Flecha perfurante | Acertar o mesmo alvo ainda consagrado prolonga o estado em 2 s. |
| Disseminação tóxica | arqueiro | Dardo tóxico › Tiro em leque | O leque espalha veneno fraco por 2 s sem substituir um veneno mais forte. |
| Prisão pestilenta | geral | Estaca de pedra › Névoa venenosa › Abalo sísmico | O abalo espalha veneno curto e prolonga lentidão a partir do alvo preparado ainda na névoa. |
| Execução do eclipse | geral | Passo sombrio › Punhal das sombras › Lança radiante | Confirmar Eclipse após o passo e o punhal concede escudo de 8, sem multiplicar a reação. |
| Fortaleza viva | geral | Muralha de pedra › Círculo de amparo › Purificação | Purificar dentro do círculo junto da muralha concede escudo coletivo uma vez. |
| Dança do duelista | geral | Postura de aparo › Corte dilacerante › Investida | Após aparar e cortar o atacante, a investida consome o sangramento para dano limitado. |
| Forja de guerra | guerreiro | Investida de escudo › Corrente › Lâmina em brasa | A corrente puxa de volta o alvo empurrado, e a lâmina sai sem carga nele. |
| Tempestade confinada | mago | Muralha de pedra › Onda de repulsão › Raio em cadeia | Acertar o alvo que colidiu permite um salto elétrico adicional sem repetir alvos. |
| Caçada implacável | arqueiro | Dardo tóxico › Tiro em leque › Flecha perfurante | Três acertos no mesmo alvo consomem seu veneno para dano adicional limitado. |
| Inverno em marcha | mago | Barreira › Nova glacial › Investida | Com a barreira ativa e a nova confirmada, a investida deixa rastro de lentidão sem dano periódico. |
| Convergência arcana | mago | Seta arcana › Mente partida › Explosão | Dois acertos no mesmo alvo preparam uma explosão com 1 célula adicional de raio. |
| Resgate entre sombras | geral | Véu da noite › Passo sombrio › Curar | Após esquivar e deslocar, curar efetivamente outro aliado concede escudo de 6. |
| Sepultura aberta | necromante | Dardo funesto › Garras do ossuário | Dardo funesto e Garras do ossuário no mesmo alvo definhando: +25% de dano nas garras. |
| Tributo da legião | necromante | Comando sepulcral › Dízimo vital | Comande uma invocação e drene vida efetivamente: ganha escudo de 8 por 3 s. |
| Crematório | necromante | Garras do ossuário › Bola de fogo | Bola de fogo no mesmo alvo ainda enraizado pelas garras causa +20% de dano. |
| Absolvição funesta | necromante | Dardo funesto › Lança radiante | Lança radiante no mesmo alvo definhando pelo dardo causa +15% de dano além das reações de Trevas e luz. |
| Grito imperioso | guerreiro | Desafio › Brado | Aliados perto ganham escudo de 6 enquanto os hostis estão desafiados. |
| Terremoto de aço | guerreiro | Salto esmagador › Redemoinho | +35% de dano e atordoa por 0,5 s. |
| Âncora | guerreiro | Corrente › Salto esmagador | Salta direto no alvo puxado, com +30%. |
| Desforra flamejante | guerreiro | Contragolpe › Lâmina em brasa | O contragolpe sai em chamas, e a lâmina seguinte ganha +1 célula de alcance. |
| Muralha desafiadora | guerreiro | Investida de escudo › Desafio | Os empurrados já ficam desafiados, e cada um dá 4 de escudo a mais. |
| Quebra-guarda | guerreiro | Contragolpe › Golpe atordoante | Atordoamento +0,5 s. |
| Investida brutal | guerreiro | Investida › Salto esmagador | O impacto do salto ganha +1 de raio. |
| Forja viva | guerreiro | Desafio › Redemoinho › Lâmina em brasa | O giro queima todos os atingidos, e a lâmina é crítica nos desafiados. |
| Hino de batalha | guerreiro | Brado › Ultimate | A ultimate dá +20% de dano aos aliados por 5 s. |
| Curto-circuito | mago | Sobrecarga arcana › Raio em cadeia | +1 salto. |
| Piscar glacial | mago | Piscar › Nova glacial | A nova sai da origem e do destino. |
| Orbe congelante | mago | Lança de gelo › Orbe instável | O orbe vira gelo e resfria. |
| Orbe tempestuoso | mago | Raio em cadeia › Orbe instável | O orbe eletriza. |
| Mente sobrecarregada | mago | Mente partida › Sobrecarga arcana | Silêncio +1 s e +25%. |
| Espelho elemental | mago | Afinidade elemental › Piscar | O eco do Piscar dura o dobro. |
| Estilhaço em fuga | mago | Lança de gelo › Piscar | O alvo resfriado fica enraizado por 1 s. |
| Cataclismo arcano | mago | Sobrecarga arcana › Orbe instável › Explosão | O orbe explode com +1 de raio. |
| Convergência elemental | mago | Afinidade elemental › Ultimate | A ultimate aplica o estado do elemento a todos os atingidos. |
| Bombardeio marcado | arqueiro | Marca do caçador › Flecha explosiva | +40% no marcado e expõe quem está em volta. |
| Retirada certeira | arqueiro | Rolamento › Flecha perfurante | Crítico garantido. |
| Chuva incendiária | arqueiro | Flecha explosiva › Chuva de flechas | A área queima. |
| Leque marcado | arqueiro | Marca do caçador › Tiro em leque | As flechas do leque buscam o marcado. |
| Olhar do predador | arqueiro | Olho de águia › Marca do caçador | A marca dura +3 s. |
| Detonação tóxica | arqueiro | Flecha venenosa › Flecha explosiva | A explosão espalha veneno. |
| Caça perfeita | arqueiro | Marca do caçador › Rolamento › Flecha perfurante | +60% de dano, com limite. |
| Olhar absoluto | arqueiro | Olho de águia › Ultimate | Todos os projéteis da ultimate são críticos. |
| Cadáver-bomba | necromante | Comando sepulcral › Explosão cadavérica | +1 de raio. |
| Levante funesto | necromante | Dardo funesto › Levante profano | Os erguidos definham quem tocam. |
| Ceifa detonante | necromante | Ceifa de almas › Explosão cadavérica | Puxa para dentro da explosão, com +30%. |
| Mortalha da legião | necromante | Mortalha fúnebre › Comando sepulcral | As invocações ganham escudo de 6. |
| Túmulo aberto | necromante | Garras do ossuário › Levante profano | Os erguidos surgem em volta do enraizado. |
| Dízimo explosivo | necromante | Dízimo vital › Explosão cadavérica | A explosão cura você em 20% do dano. |
| Colheita eterna | necromante | Ceifa de almas › Dízimo vital | O dreno rende +50%. |
| Marcha fúnebre | necromante | Levante profano › Comando sepulcral › Ceifa de almas | As invocações batem +25% por 5 s. |
| Coro dos mortos | necromante | Comando sepulcral › Ultimate | As invocações repetem o último golpe da ultimate (50%). |
| Mergulho cegante | aventureiro | Garras cegantes › Mergulho | Atordoa por 1 s. |
| Presa anunciada | aventureiro | Grito do falcão › Presa dupla | +40%. |
| Rasante duplo | aventureiro | Rasante › Presa dupla | O rasante repete na volta do falcão. |
| Vigília restauradora | aventureiro | Vigia › Retorno ao punho | Escudo de 8 além da cura. |
| Tufão | aventureiro | Tempestade de penas › Rasante | Puxa os atingidos para a linha. |
| Mergulho estrondoso | aventureiro | Grito do falcão › Mergulho | Expõe quem está em volta do alvo. |
| Olhos vendados | aventureiro | Garras cegantes › Tempestade de penas | A cegueira se espalha na área, por +2 s. |
| Ciclo do falcão | aventureiro | Mergulho › Retorno ao punho › Presa dupla | A próxima skill do falcão sai sem recarga. |
| Asa do destino | aventureiro | Vigia › Ultimate | Escudo de 10 em você e nos aliados a até 3 células. |
| Gás inflamável | geral | Dardo tóxico › Bola de fogo | Envenenados levam +30% e queimam. |
| Pedra em brasa | geral | Estaca de pedra › Bola de fogo | +25% e queimadura +2 s. |
| Lâmina sombria | geral | Passo sombrio › Corte dilacerante | Sangramento +1 por pulso. |
| Escudo consagrado | geral | Barreira › Lança radiante | Escudo +5 ao consagrar. |
| Estrela cadente | geral | Chuva de estrelas › Explosão | +1 de raio. |
| Tremor tóxico | geral | Abalo sísmico › Névoa venenosa | A névoa cresce 1 célula. |
| Investida sombria | geral | Véu da noite › Investida | Crítico garantido. |
| Bastião de pedra | geral | Pele de pedra (passiva) + Muralha de pedra | Com Pele de pedra ativa, atrás da sua Muralha de pedra você recupera 2 de vida por segundo. |
| Seta purificadora | geral | Purificação › Seta arcana | A seta ignora escudos. |
| Repulsão ardente | geral | Onda de repulsão › Bola de fogo | Os empurrados queimam. |
| Disciplina férrea | geral | Disciplina marcial (passiva) + Golpe atordoante | Com Disciplina marcial ativa, o Golpe atordoante atordoa +0,5 s. |
| Fluxo de cura | geral | Fluxo restaurador (passiva) + Curar | Com Fluxo restaurador ativo, o escudo gerado pelo Curar vale o dobro. |
| Aparo preciso | geral | Postura de aparo › Punhal das sombras | Crítico garantido. |
| Avalanche humana | geral | Tenacidade (passiva) + Investida › Golpe atordoante | Com Tenacidade ativa, Investida e depois Golpe atordoante atordoa todos em volta do alvo. |
| Postura inabalável | guerreiro | Desafio › Postura de aparo | Cada desafiado que ataca você é aparado automaticamente, uma vez por desafiado. |
| Moenda de sangue | guerreiro | Corte dilacerante › Redemoinho | O giro espalha o sangramento do alvo para todos os atingidos. |
| Fratura | mago | Estaca de pedra › Lança de gelo | O alvo enraizado e resfriado estilhaça: leva dano alto e o enraizamento acaba. |
| Eco repulsor | mago | Piscar › Onda de repulsão | A onda sai do destino e também do eco deixado na origem. |
| Chama sintonizada | mago | Afinidade elemental › Bola de fogo | Com fogo encarnado, a bola deixa o chão em chamas por 3 s. |
| Tiro do véu | arqueiro | Véu da noite › Marca do caçador | Enquanto você está invisível, os tiros no marcado não revelam você. |
| Cortina tóxica | arqueiro | Rolamento › Névoa venenosa | A névoa sai no ponto de onde você rolou e cobre a retirada. |
| Visão profunda | arqueiro | Olho de águia › Seta arcana | A seta ricocheteia entre os marcados. |
| Armadilha pestilenta | arqueiro | Armadilha de caça › Névoa venenosa | A névoa nasce sobre a armadilha, e quem fica preso nela é envenenado em dobro. |
| Fosso de estacas | arqueiro | Armadilha de caça › Estaca de pedra | A estaca brota sob o preso, e o enraizamento dura +1 s. |
| Recuo armado | arqueiro | Rolamento › Armadilha de caça | A armadilha surge sozinha no ponto de onde você rolou. |
| Égide da legião | necromante | Barreira › Comando sepulcral | A barreira se divide entre os mortos comandados. |
| Nuvem pestilenta | necromante | Explosão cadavérica › Névoa venenosa | A explosão vira uma névoa que definha em vez de envenenar. |
| Prensa | necromante | Ceifa de almas › Muralha de pedra | A foice puxa o alvo contra a muralha: dano de colisão e atordoamento. |
| Assombração | necromante | Mortalha fúnebre › Passo sombrio | Como fantasma, o passo atravessa os hostis e definha quem atravessa. |
| Transbordo | necromante | Dízimo vital › Curar | A cura que passar da sua vida máxima vai para os mortos próximos. |
| Mortos consagrados | necromante | Levante profano › Lança radiante | Os erguidos explodem em luz ao expirar, disparando a reação Trevas e luz. |
| Bote | aventureiro | Mergulho › Investida | Você avança até o alvo atordoado, e o golpe é crítico. |
| Golpe às cegas | aventureiro | Garras cegantes › Punhal das sombras | O alvo cego leva o punhal como se fosse pelas costas. |
| Penas em brasa | aventureiro | Tempestade de penas › Bola de fogo | A área de penas em volta do falcão passa a queimar. |
| Rastro tóxico | aventureiro | Rasante › Névoa venenosa | O falcão arrasta a névoa pela linha do rasante. |
| Presa revelada | aventureiro | Grito do falcão › Lança radiante | O alvo exposto também fica consagrado. |
| Sentinela curativa | aventureiro | Vigia › Curar | Cada projétil interceptado pelo falcão aumenta a próxima cura em 10%. |
| Mão que recebe | aventureiro | Retorno ao punho › Curar | A cura dobra se lançada até 2 s depois do retorno. |
| Dentes e garras | aventureiro | Presa dupla › Corte dilacerante | Se você e o falcão acertam, o sangramento dobra. |
| Veneno fundido | geral | Flecha venenosa › Dardo tóxico | Os dois venenos viram um só, mais forte, que pula para o hostil mais perto quando acaba. |
| Veneno silencioso | geral | Véu da noite › Flecha venenosa | Atirar invisível não quebra o véu, e o veneno dura +2 s. |
| Combustão de miasma | geral | Névoa venenosa › Explosão | A névoa detona: cada hostil dentro leva de uma vez todo o veneno que restava. |
| Runa sísmica | geral | Seta arcana › Estaca de pedra | A estaca brota onde a seta acertou, em qualquer distância. |
| Alvo fixo | geral | Golpe atordoante › Seta arcana | A seta no atordoado volta e acerta uma segunda vez. |
| Isca explosiva | geral | Troca sombria › Explosão | A explosão sai no ponto onde você estava antes da troca, sem precisar mirar. |
| Encurralado | geral | Troca sombria › Muralha de pedra | A muralha sobe entre você e o alvo trocado, e ele fica preso contra ela por 1 s. |
| Duplo passo | geral | Passo sombrio › Troca sombria | A troca alcança o dobro da distância e não entra em recarga. |
| Desequilíbrio | geral | Onda de repulsão › Punhal das sombras | Os empurrados ficam de costas por 1 s, e o punhal conta como ataque pelas costas. |
| Fogo-fátuo | geral | Véu da noite › Bola de fogo | A bola sai invisível e não pode ser esquivada nem aparada. |
| Ferida em brasa | geral | Corte dilacerante › Bola de fogo | Enquanto o alvo queima e sangra ao mesmo tempo, o sangramento pulsa em dobro. |
| Sol nascente | geral | Bola de fogo › Lança radiante | O alvo queimado e consagrado vira farol: aliados que o golpeiam recuperam um pouco de vida. |
| Chama purificadora | geral | Purificação › Bola de fogo | A bola tira 1 efeito positivo de cada hostil atingido. |
| Espaço para respirar | geral | Onda de repulsão › Curar | A cura também empurra 1 célula os hostis colados no aliado curado. |
| Dispersão | geral | Névoa venenosa › Onda de repulsão | A onda leva a névoa junto, e ela segue os empurrados. |
| Contragolpe repulsor | geral | Postura de aparo › Onda de repulsão | Aparar solta a onda sozinha, sem custo e sem recarga. |
| Toxina consagrada | geral | Lança radiante › Dardo tóxico | O alvo consagrado e envenenado não pode ser curado por 3 s. |
| Atropelo tóxico | geral | Dardo tóxico › Investida | Investir num envenenado espirra o veneno nos hostis a até 1 célula. |
| Estrela guia | geral | Golpe atordoante › Chuva de estrelas | Três estrelas da chuva são atraídas para o alvo atordoado. |
| Contágio reverso | geral | Purificação › Névoa venenosa | O efeito negativo tirado do aliado passa para os hostis dentro da névoa. |
| Passo no tremor | geral | Abalo sísmico › Passo sombrio | O passo leva você até um hostil atordoado pelo abalo, e o próximo golpe é crítico. |
| Golpe perfeito | geral | Véu da noite › Troca sombria › Punhal das sombras | Invisível, troca e apunhala: crítico triplo, com limite de dano. |
| Leito de pedras | geral | Estaca de pedra › Onda de repulsão › Abalo sísmico | Os empurrados contra as estacas ficam atordoados, e o abalo nasce do ponto da colisão. |
| Inferno químico | geral | Dardo tóxico › Névoa venenosa › Bola de fogo | A névoa pega fogo e espalha queimadura em todos dentro, sem tirar o veneno. |
| Juízo das estrelas | geral | Lança radiante › Golpe atordoante › Chuva de estrelas | Toda a chuva converge no alvo consagrado e atordoado. |
| Fornalha de pedra | geral | Rastro ígneo › Muralha de pedra | A muralha erguida sobre o rastro vira pedra em brasa: quem encosta queima. |
| Fuga em cinzas | geral | Véu da noite › Rastro ígneo | Correr invisível não quebra o véu, e o rastro só acende 1 s depois. |
| Arena de fogo | geral | Anel de chamas › Onda de repulsão | A onda joga os hostis contra o anel, que os devolve para dentro: queimam duas vezes. |
| Santuário ardente | geral | Círculo de amparo › Anel de chamas | O anel nasce na borda do círculo, e cada hostil que queima nele cura um pouco os aliados dentro. |
| Combustão total | geral | Bola de fogo › Incinerar | Incinera também os queimados a até 2 células do alvo. |
| Fervura | geral | Dardo tóxico › Incinerar | Incinerar um envenenado consome também o veneno e soma os dois danos. |
| Mente exposta | geral | Dissipar › Agulha mental | No alvo que perdeu o escudo, a agulha silencia por 1 s. |
| Dor fantasma | geral | Punhal das sombras › Agulha mental | A agulha no alvo marcado pelo punhal repete metade do dano do punhal. |
| Empalar | geral | Telecinese › Estaca de pedra | Jogar o hostil sobre a estaca causa dano de colisão e enraíza por +1 s. |
| Afogar | geral | Telecinese › Névoa venenosa | O hostil arremessado para dentro da névoa fica lento, e o veneno conta em dobro enquanto ele estiver nela. |
| Antevisão | geral | Presságio › Postura de aparo | Os dois primeiros golpes são anulados, e o atacante fica atordoado por 1 s. |
| Passo previsto | geral | Presságio › Passo sombrio | Ao esquivar com o Presságio, você aparece atrás do atacante sozinho. |
| Ruptura de defesas | geral | Dissipar › Explosão | Os hostis que perderam o escudo levam a explosão como crítico. |
| Golpe sem guarda | geral | Dissipar › Golpe atordoante | Em alvo que perdeu o escudo, o atordoamento dura o dobro. |
| Seta canalizada | geral | Runa amplificadora › Seta arcana | Dentro da runa, a seta sai 3 vezes seguidas. |
| Constelação | geral | Runa amplificadora › Chuva de estrelas | A chuva cai centrada na runa e dura +2 s. |
| Carga coletiva | geral | Impulso › Investida | Os aliados acelerados avançam junto com você até o alvo. |
| Escolta | geral | Barreira › Impulso | Os aliados que recebem o impulso também ganham metade da barreira. |
| Lâmina de seiva | geral | Seiva corrosiva › Postura de aparo | Cada aparo envenena o atacante em dobro e tira todo o escudo dele. |
| Muralha corrosiva | geral | Seiva corrosiva › Muralha de pedra | A muralha pinga seiva: quem a golpeia fica envenenado. |
| Avalanche | geral | Pedregulho › Abalo sísmico | O abalo nasce onde o pedregulho parou e lança lascas de volta pela linha. |
| Ricochete de pedra | geral | Muralha de pedra › Pedregulho | O pedregulho bate na muralha e volta pelo mesmo caminho, acertando de novo. |
| Pouso sagrado | geral | Asas da aurora › Círculo de amparo | O círculo nasce onde você pousou e dura +2 s. |
| Lança do resgate | geral | Asas da aurora › Lança radiante | Ao pousar, a lança sai do aliado na direção do hostil mais perto dele. |

## Ressonâncias (24)

- **Impacto** (Força 16): Golpe corpo a corpo crítico empurra 1 célula.
- **Ricochete** (Destreza 16): Projétil físico que abate salta para o hostil mais perto (6 de dano).
- **Muralha** (Constituição 16): Escudos recebidos duram e absorvem 50% mais.
- **Resíduo** (Inteligência 16): Magias de área deixam os atingidos expostos (+10% de dano recebido) por 3 s.
- **Purificar** (Sabedoria 16): Usar uma cura tira 1 efeito negativo de você.
- **Presença** (Carisma 16): No crítico, os hostis a até 2 células hesitam (sem golpes físicos) por 1 s.
- **Lâmina rúnica** (Força 14 + Inteligência 14): Golpes físicos de contato aplicam o elemento da sua última magia (até 5 s depois).
- **Olhar sereno** (Destreza 14 + Sabedoria 14): Crítico de projétil devolve 2 de mana.
- **Bastião** (Constituição 14 + Carisma 14): Aliados a até 3 células levam 10% menos dano.
- **Inamovível** (Força 14 + Constituição 14): Imune a empurrão e puxão.
- **Mente dupla** (Inteligência 14 + Sabedoria 14): Seus efeitos ficam 15% mais fortes (soma à potência da Inteligência).
- **Trapaceiro** (Destreza 14 + Carisma 14): A Troca sombria deixa um espantalho como isca por 6 s.
- **Ímpeto** (Força 14 + Destreza 14): Crítico corpo a corpo reduz em 1 s a recarga das skills de classe.
- **Disciplina interior** (Força 14 + Sabedoria 14): Golpe corpo a corpo devolve 1 de mana.
- **Comandante** (Força 14 + Carisma 14): Seu abate dá +10 de carga de ultimate aos aliados a até 6 células.
- **Engenhoso** (Destreza 14 + Inteligência 14): Projéteis mágicos atravessam 1 alvo.
- **Resiliente** (Constituição 14 + Sabedoria 14): Estados negativos duram 25% menos em você.
- **Maestro** (Inteligência 14 + Carisma 14): Cada combo concluído dá +8 de carga de ultimate.
- **Gladiador** (Força 13 + Destreza 13 + Constituição 13): Ao usar a ultimate, ganha escudo de 10.
- **Oráculo** (Inteligência 13 + Sabedoria 13 + Carisma 13): A ultimate enche 15% mais rápido.
- **Senhor da guerra** (Força 13 + Constituição 13 + Carisma 13): Ao usar a ultimate, os aliados a até 3 células batem +15% por 4 s.
- **Arcano preciso** (Destreza 13 + Inteligência 13 + Sabedoria 13): Crítico de magia deixa o alvo exposto por 2 s.
- **Sobrevivente** (Destreza 13 + Constituição 13 + Carisma 13): Abaixo de 30% de vida, a ultimate enche o dobro.
- **Eco ancestral** (Constituição 13 + Inteligência 13 + Sabedoria 13): Ao encher a ultimate, a próxima skill de classe não gasta mana.
