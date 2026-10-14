# Sugestões de Capacidades — Arte Externa, Trilha e Efeitos de Habilidade

**Arquivo:** SUGESTOES-CAPACIDADES.md · **Versão** 1.1 · **Data:** 14/10/2026 · **Autor:** Tech Lead / Projetista

> Documento recebido do projetista e guardado aqui como referência. O que foi adotado, adaptado ou recusado está
> em [`DECISOES.md`](DECISOES.md), D-055.

> **Histórico de versões**
> - **v1.1 (14/10/2026)**: reformulado de prompt para sugestão. Removidas as exigências (seções "fixo e livre",
>   "não negociável" e "critérios de aceite"); o tom passa a ser de proposta. A tabela de precedência sobre o
>   projeto principal virou uma nota de pontos de atrito. Arquivo renomeado (antes PROMPT-CAPACIDADES.md).
> - **v1.0 (14/10/2026)**: documento criado como prompt.

## Natureza deste documento

Isto é uma coleção de sugestões, não uma lista de requisitos. São quatro ideias do projeto anterior que parecem
valer a pena levar para o jogo novo. Quem for construir pode adotar, adaptar ou descartar qualquer uma delas.

O texto é abstrato de propósito. Descreve o que se busca e por quê, e deixa o como em aberto: formatos,
bibliotecas, estrutura de dados e desenho dos fluxos ficam a critério de quem constrói. Se uma sugestão for
adaptada ou recusada, vale anotar o motivo em `docs/DECISOES.md`.

## Pontos de atrito com o projeto principal

Este documento acompanha o PROMPT-PROJETO.md (v3.0). Se as sugestões forem adotadas, três trechos dele
precisariam de ajuste:

| Projeto principal v3.0 | Sugestão aqui |
|---|---|
| §2.14: "Todos os assets de áudio são locais" | Aceitar trilha vinda da nuvem |
| §5.3, regra 11: "Nenhuma dependência de host externo em tempo de execução" | Aceitar imagens e trilhas vindas de fora |
| §3.10: o atlas do jogador "nunca vai para um servidor" | Tratar imagens externas como parte do modelo |

Uma proteção que continua sendo boa ideia: manter a campanha jogável sem rede depois que o conteúdo foi
carregado. Dá para ter arte e música externas sem abrir mão disso.

## 1. Ideia central

Tratar o jogo como um motor, em que a identidade visual e sonora vem de quem joga e de quem cria.

O mesmo motor poderia sustentar mundos bem diferentes entre si: um calabouço sombrio, uma floresta de desenho
animado, uma estação espacial. A pessoa traz a arte e a música, e o jogo cuida de torná-las jogáveis, legíveis e
leves.

Um corolário útil: o jogo funcionar bem mesmo quando o conteúdo trazido é ruim. Seria bonito com o conteúdo padrão
e continuaria jogável com qualquer entrada.

## 2. Personagens por imagem

**A sugestão.** Qualquer personagem (jogador, inimigo, invocação) poderia ser representado por uma imagem trazida
de fora, em vez de um modelo embutido.

**O que se busca**
- Trazer uma imagem e ver o personagem em jogo em poucos passos, sem conhecimento técnico.
- A imagem ganhar vida: mesmo uma ilustração única, sem quadros de animação, andar, atacar, ser atingida e morrer
  de forma convincente.
- O personagem continuar legível independentemente da arte: dar para distinguir eu, aliado e hostil, e perceber
  que ele está conjurando, atordoado ou invisível.
- Funcionar nas duas visões do jogo, de cima e isométrica.

**Pontos em aberto**
- Como imagens muito diferentes (tamanho, proporção, transparência, orientação) viram personagens de tamanho
  coerente no mundo?
- Como indicar o que é frente, pés e arma, ou o jogo descobrir sozinho?
- Como animar uma figura sem esqueleto?
- O que fazer com uma imagem ruim? Uma imagem corrompida, vazia ou gigante provavelmente não deveria quebrar o
  jogo nem fazer o personagem sumir; um substituto visível resolveria.

## 3. Fases por imagem

**A sugestão.** A aparência de uma fase poderia ser composta por imagens trazidas de fora. A pessoa define o
visual do mundo com arte, e o jogo constrói o espaço jogável por baixo.

**O que se busca**
- Poucas imagens transformarem o visual de uma fase inteira, com resultado coerente: paredes parecendo paredes,
  chão parecendo chão, a saída parecendo saída.
- Mesma geometria, artes diferentes, mundos diferentes.
- Fases consecutivas poderem compartilhar visual sem reconfigurar nada, mantendo a continuidade de uma aventura.
- A arte não esconder o que importa: o jogador sempre saber onde pode andar, onde não pode e o que é interativo.
- Quem cria uma fase ver o resultado enquanto edita.

**Pontos em aberto**
- A abordagem seria blocos repetíveis, fundo único, camadas, colagem, outra coisa, ou várias?
- Como o jogo "entende" a arte: mapeamento manual, convenção, ajuda automática?
- Quanto trabalho a pessoa teria para associar arte a funções (chão, parede, porta), e como reduzi-lo?
- Quanto oferecer de variação visual, ajuste de cor e atmosfera?

## 4. Trilha sonora na nuvem

**A sugestão.** A música do jogo poderia vir de fontes remotas, escolhida por quem monta a aventura, e ser tocada
de forma adaptada ao momento.

**O que se busca**
- A trilha acompanhar a situação: calma ao explorar, tensão ao lutar, peso diante de um chefe, com transições que
  não sejam cortes secos.
- Quem cria escolher a música por fase e por situação com facilidade, e ouvir antes de decidir.
- Existir uma trilha padrão, para o jogo nunca ficar mudo só porque ninguém configurou.
- A música ser do jogo, não da rede: se a fonte cair, sumir ou demorar, o jogo segue normalmente e a música volta
  quando puder.

**Pontos em aberto**
- Que tipos de fonte aceitar, e como a pessoa as informa?
- Cache, pré-carga e consumo de dados, principalmente no celular.
- Normalizar o volume entre faixas diferentes?
- Na arena, o que seria "a música da sala"? Cada um ouve a sua, ou todos a mesma?

**Vale ter em mente**
- **Direitos.** Música de terceiros costuma exigir licença ou crédito. Facilitar a exibição de créditos e usar uma
  biblioteca padrão com licença que permita o uso evita problemas.
- **Celular.** O áudio só inicia depois de um gesto do jogador, e precisa se comportar bem quando o app vai para
  segundo plano.

## 5. Efeitos de habilidade

Cada habilidade tem duas faces: o que ela parece e o que ela faz. Faz sentido tratá-las separadamente e ligá-las
por uma regra simples (5.3).

### 5.1 Face visual: partículas e efeitos gráficos

**A sugestão.** Cada habilidade ter presença visual própria, rica, construída com partículas e outros efeitos
gráficos, comunicando o que vai fazer antes de fazer.

**O que se busca**
- Impactos com peso cinematográfico, de modo que dê vontade de usar a habilidade.
- Telegrafia: o efeito de conjuração anuncia, inclusive para quem vai ser atingido, e o de impacto confirma.
  Legível de longe e em tela pequena.
- Variedade que escala: muitos efeitos distintos sem custo de implementação por efeito. Descrever um efeito como
  dado, e não como código, ajudaria; quem cria uma habilidade monta ou ajusta o efeito, idealmente vendo o
  resultado na hora.
- O efeito pertencer ao mundo: se a câmera se move ou dá zoom, ele fica no lugar.
- Estados prolongados (queimando, protegido, atordoado) terem expressão visual enquanto durarem.
- Custo controlado: enxame mais efeitos é o jeito mais fácil de travar um celular. O jogo poderia se adaptar,
  reduzindo ou simplificando efeitos sem perder legibilidade.
- Existir uma versão calma para quem tem sensibilidade a movimento e a flashes.

**Pontos em aberto**
- Tecnologia de partículas, formato de descrição, composição (camadas, encadeamento, atrasos).
- Editor de efeitos, biblioteca de modelos prontos, pré-visualização.
- Acoplamento com som e com câmera (tremor, congelamento de impacto).

### 5.2 Face mecânica: efeitos de jogabilidade

**A sugestão.** O que uma habilidade faz iria além de tirar vida. Um repertório de efeitos mecânicos combináveis
mudaria o rumo da luta.

**Famílias que o repertório poderia cobrir**
- Dano e cura distribuídos no tempo.
- Controle: impedir de se mover, de atacar ou de usar habilidades.
- Reforço e enfraquecimento de dano e de defesa.
- Imunidade e intangibilidade.
- Deslocamento: empurrar, puxar, avanço, teleporte.
- Efeito atrasado.
- Invocar aliados e dominar inimigos.
- Marcar o terreno: rastros e armadilhas.
- Modificar o ataque básico.
- Recuperar recursos.

**O que se busca**
- Combinar: uma habilidade carregar vários efeitos, com o jogo aplicando cada um corretamente.
- Estender: criar um efeito novo sem precisar mexer em muitos lugares do código.
- Ler: o jogador saber quando está sob efeito, qual e por quanto tempo.
- Equilibrar por modo: o que é divertido na campanha pode ser forte demais na arena, então o modo ajusta.
- Valer para todos: na arena, o resultado de um efeito ser o mesmo em todas as telas.

**Pontos em aberto**
- Modelo de dados, forma de composição, quais efeitos concretos existem, balanceamento.
- Como quem cria uma habilidade escolhe e combina efeitos.

### 5.3 A ligação entre as duas faces

Três ideias que ajudam a manter as duas coerentes:
- **A mecânica manda; o visual representa.** Nenhuma regra dependeria de um efeito visual ter sido exibido, e o
  jogo funcionaria igual com todos os efeitos visuais desligados.
- **Todo efeito mecânico relevante teria alguma expressão visual identificável,** mesmo que simples.
- **O tempo é compartilhado.** A mecânica tem momentos (conjuração, viagem, impacto), e o visual se alinha a eles: o
  impacto que se vê é o impacto que acontece.

## 6. Pontos de atenção

Riscos que costumam aparecer com conteúdo vindo de fora. Não são exigências, são coisas que vale ter no radar.

- **Conteúdo externo falha.** Toda imagem, música ou descrição de efeito vinda de fora pode ser inválida, enorme,
  lenta, inexistente ou indisponível. Validar, limitar, substituir e seguir em frente, avisando a pessoa em
  linguagem simples, mantém o jogo de pé.
- **Rede.** Quem já tem o conteúdo e está jogando poderia continuar offline. O mecanismo (cache, empacotamento na
  exportação, outro) fica em aberto.
- **Privacidade e segurança.** Buscar algo num endereço remoto revela o jogador ao dono do endereço, e o conteúdo
  pode ser malicioso. Tratar conteúdo importado de outra pessoa como dado, nunca como programa (uma descrição de
  efeito não executar código arbitrário) é uma boa linha de segurança.
- **Direitos autorais.** Facilitar atribuição e deixar claro que a responsabilidade pelo conteúdo trazido é de quem
  o trouxe evita que o jogo induza à violação.
- **Compartilhamento.** Uma aventura exportada e importada levaria (ou referenciaria) suas imagens, trilhas e
  efeitos. Na arena, a forma como o conteúdo chega a quem não o tem fica em aberto. O ideal é que ninguém veja um
  quadrado vazio nem ouça um silêncio inexplicado, e que um recurso lento não trave a sala.
- **Desempenho no celular.** Imagens grandes e muitas partículas são as formas mais fáceis de travar um aparelho
  médio. Orçamentos, redução automática de qualidade e atenção à memória ao longo de várias trocas de fase ajudam.
- **Legibilidade.** Arte, efeito e música nunca deveriam tornar o jogo ilegível. Equipe, alvo, perigo e a diferença
  entre chão e parede precisam continuar distinguíveis.
- **Acessibilidade.** Respeitar movimento reduzido, e não deixar informação importante depender só de um efeito
  visual ou só de um som.

## 7. Sinais de que está funcionando

Uma forma informal de conferir, se for útil:
- Uma pessoa sem conhecimento técnico leva uma ilustração e, em poucos minutos, tem um personagem jogando nas duas
  visões.
- A mesma geometria de fase, com duas artes diferentes, vira dois mundos reconhecivelmente diferentes, ambos
  legíveis.
- É possível escolher a música de exploração e a de combate de uma fase, ouvir antes, e ver a troca acontecer de
  forma suave em jogo. Com a fonte indisponível, o jogo segue sem erro visível e sem silêncio.
- Uma habilidade nova, com efeito visual e mecânico, surge sem alterar o código do motor e pode ser
  pré-visualizada.
- Entradas hostis (imagem corrompida, arquivo gigante, endereço inexistente, efeito malformado) não derrubam nem
  travam o jogo.
- Num celular médio, com 20+ inimigos e várias habilidades ao mesmo tempo, o jogo se mantém fluido, nem que seja
  reduzindo qualidade automaticamente.
- Na arena, quatro jogadores com personagens visualmente diferentes se veem corretamente.
