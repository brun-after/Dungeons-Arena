# Prompt de Projeto — RPG de ação em tempo real (campanha + arena)

**Arquivo:** `PROMPT-PROJETO-v4.0.md` · **Versão 4.0** · **Data: 12/10/2026**
**Autor:** Tech Lead / Projetista

> **Histórico de versões**
> - **v4.0 (12/10/2026)** — Arena para até 10 jogadores com servidor dedicado autoritativo,
>   sincronização de NPCs e objetos, coleta transacional, reconciliação contínua, fichas por orçamento
>   e presets, checkpoints de recuperação; versão pequena jogável e prova de rede antecipadas;
>   contradições de regras resolvidas; variedade de IA, testes humanos e critérios mensuráveis.
>   Campanha offline e editor continuam como pilares. Esta revisão atualiza a especificação;
>   não representa código implementado nem benchmarks já executados.
> - **v3.0 (19/09/2026)** — Especificação completa do jogo em 7 partes: produto, funcional, arquitetura,
>   mobile, engenharia, construção e backlog. Ordem de construção em tronco comum — motor e combate servem
>   campanha e arena desde o início. A ordem de construção desta versão foi substituída na v4.0.

---

## Contexto

Este documento especifica um **RPG de ação em tempo real para navegador**, com campanha solo e arena
multiplayer, jogável em desktop e celular, com editor de fases embutido.

O jogo é novo, mas não é um chute: os sistemas e os valores numéricos aqui vêm de um predecessor jogado e
afinado ao longo de meses. Trate-os como **padrão de referência testado** — o ponto de partida correto, com
passadas de rebalanceamento previstas (§6.1). Valores herdados do predecessor são referência testada;
valores novos de rede, carga e janela de reação na v4.0 são metas de projeto a validar.

**Decisões de produto já tomadas** (não reabrir sem conversa):

| Decisão | Consequência |
|---|---|
| Combate é **em tempo real**, sem turnos | §2.7 |
| A **arena multiplayer é pilar**, com o modo livre como coração | §2.13, §3.6 |
| O **editor de fases é feature do jogador**, dentro do jogo | §3.10 |
| Arena com **até 10 jogadores ativos por sala**, em servidor independente dos jogadores | §3.6 |
| Criador da sala é cliente comum, sem autoridade ou prioridade de gameplay | §2.13, §3.6 |
| Ficha de arena com **clamp e orçamento por modo**; Duelo usa presets simétricos | §3.7 |
| **Sem puzzles e sem NPCs de diálogo ou missão.** A identidade é o enxame: muitos inimigos, luta rápida, posicionamento | §1.3 |

---
---

# PARTE 0 — COMO USAR ESTE DOCUMENTO

Você vai construir este jogo do zero, em repositório novo.

- **Parte 1** — o jogo: visão, modos, pilares. Leia antes de qualquer decisão técnica.
- **Parte 2** — especificação funcional. É o contrato do que o jogo faz.
- **Parte 3** — arquitetura. Recomendação forte; divergências vão para `docs/DECISOES.md` com justificativa.
- **Parte 4** — mobile. Plataforma de primeira classe, não "responsividade".
- **Parte 5** — engenharia e qualidade: as regras que mantêm o projeto saudável.
- **Parte 6** — ordem de construção e critérios de aceite.
- **Parte 7** — backlog pós-v1.

**Números.** Os valores da Parte 2 são o ponto de partida normativo; alterações explícitas da v4.0 substituem as regras antigas. Eles moram em
`src/data/balance.json`, por modo de jogo, e são rebalanceados na entrega de ajuste (§6.1) — não chutados
durante a implementação.

**Ambiguidade.** Implemente a leitura mais próxima do comportamento descrito e registre a dúvida em
`docs/DECISOES.md`. Não invente sistemas fora do escopo.

---
---

# PARTE 1 — O JOGO

## 1.1 Visão

Um RPG de ação top-down e isométrico jogado no navegador. O jogador controla um personagem com ficha de RPG
completa — atributos, nível, habilidades, equipamento — e luta contra enxames de inimigos em fases conectadas
por portas. O combate é em tempo real: você se posiciona, escolhe o alvo, conjura, e a rolagem de dados do
RPG resolve o dano sem jamais parar o jogo.

Dois modos compartilham o mesmo motor, as mesmas fases e as mesmas regras:

**Campanha** — progressão por fases, exploração, loot, economia, bosses. Solo e offline.

**Arena** — jogadores na mesma fase lutando ao vivo, com modos de jogo configuráveis. O **modo livre** é o
coração: entra e sai quando quiser, sem partida e sem placar de vitória — é a dungeon, com gente dentro.

Ambos rodam em desktop e celular, com controles de toque completos.

## 1.2 Os dois modos, lado a lado

| | Campanha | Arena |
|---|---|---|
| Conexão | Offline | Servidor autoritativo; até 10 jogadores |
| Progressão | Persiste no save | Não afeta o save (padrão) |
| Ficha | Como está | Clamp/orçamento; preset no Duelo (§3.7) |
| Morte | Penalidade de XP e ouro | Respawn pelas regras do modo |
| Pausa | Sim | **Não existe** |
| Descanso | Sim | Não |
| Inimigos de IA | Sempre | Por modo |
| Objetos de fase (baú, loja, orbe) | Sempre | Por modo |
| Editor | Cria fases de campanha | Cria arenas |

## 1.3 Pilares de design

1. **O enxame.** Muitos inimigos, luta rápida, decisão de posicionamento. Não há puzzle, não há NPC de
   diálogo, não há missão narrativa. A tensão vem de quantos estão vindo e de onde.

2. **Ritmo por telegrafia, não por pausa.** Toda ação ofensiva tem tempo de conjuração visível. É isso que dá
   ao oponente — humano ou IA — a chance de reagir, e é o que substitui a deliberação que um jogo de turno
   teria. Habilidade que acerta sem aviso é bug de design.

3. **Ficha de RPG num jogo de ação.** Dados, atributos, crítico e equipamento decidem o resultado; reflexo e
   posicionamento decidem a oportunidade. O dado nunca interrompe a ação: ele aparece como feedback.

4. **Mobile é plataforma primária.** Todo sistema precisa ser operável com o polegar. Se uma mecânica só
   funciona com teclado e mouse, ela está errada.

5. **A simulação não sabe onde está.** O mesmo `simular(dt)` roda em campanha e arena, em teste e em produção.
   O que muda é quem produz os comandos e quem tem autoridade (§3.3, §3.6).

6. **Conteúdo é dado.** Fases, itens, habilidades, inimigos e modos de jogo são JSON validado. Quem joga
   também cria.

## 1.4 O que este jogo não é

Não é um VTT nem uma mesa de RPG online. Não há mestre, chat, campanha compartilhada, ficha colaborativa,
aprovação de ações, comércio entre jogadores nem conta de usuário. Não há servidor de conteúdo: o save é
local e o compartilhamento permanente é por arquivo. A arena tem backend de sessões e simulação,
sem conta obrigatória ou galeria pública. Fases e assets personalizados são enviados temporariamente
ao backend da sala para validação e distribuição. Tokens de sessão permitem reconexão, sem comprovar
identidade ou conquistas do save local.

---
---

# PARTE 2 — ESPECIFICAÇÃO FUNCIONAL

## 2.1 Mundo, fases e grid

Grid quadrado. **Célula = 48 px.** Tamanho na tela: `SZ = round(48 × camera.zoom)`.

Tipos de célula: **parede**, **piso**, **saída**, **vazio** (sólido).
Além do tipo, a célula carrega a **peça visual** do tileset (§2.16), com transform opcional.

Passável: piso, saída, e as peças funcionais `bau`, `porta`, `porta_fase`.

### Fase

```ts
Fase = {
  id, nome, ordem,                       // ordem define a progressão da campanha
  tipo: 'campanha' | 'arena' | 'ambas',
  largura, altura,
  celulas: Celula[][],
  salas: [{ x, y, w, h, cx, cy }],
  spawns: [{ x, y, equipe? }],           // equipe só em arena
  portasInternas: [{ numero, nome, a: Celula, b: Celula }],
  portaSaida?: { x, y, tranca: 'livre' | 'chave' | 'boss', chave?, bossId? },
  objetos: ObjetoDeFase[],
  inimigos: InimigoPosicionado[],
  tileset: { atlasId, config } | null,   // null herda (§2.16)
  matizGraus: number,                    // tinge a fase inteira
  nivelInimigos: number,
  balanceamento?: { dificuldadeMult, hpBase, hpAtributo, hpAtributoMult },
  modosCompativeis?: ModoId[]            // só arena
}
```

### Objetos de fase

Autoria usa coordenadas normalizadas 0–1; após validar o intervalo, converter por
`coluna = min(largura - 1, floor(x × largura))`, e equivalente para linha. Simulação usa células.
Objetos têm `objetoId` estável, geração/revisão e estado de consumo. Na arena, criação, coleta, conteúdo
de baú, disponibilidade e transferência são autoritativos no servidor (§3.6).

| Tipo | Campos | Comportamento |
|---|---|---|
| `bau` | `loot[]`, `ouro`, `trancado`, `chave`, `imagem` | Congela quem abre por **3 s**; some **5 s** depois de aberto |
| `loot` | `itemId`, `quantidade`, `icone`, `imagem` | Coletado ao pisar |
| `orbe_hp` | `valor`, `modo: 'abs' \| 'pct'` | Cura valor fixo ou % do HP máximo |
| `orbe_recurso` | idem | Restaura mana/recurso |
| `orbe_efeito` | `efeitoId`, `efeito`, `modo: 'tempo' \| 'cargas'`, `duracaoMs`, `cargas`, `cor` | Aplica efeito do registro (§2.8) |
| `loja` | `estoque[]`, `imagem` | Abre a Chebyshev ≤ 1; janela de **5 s**; recarga de **10 s** por jogador |
| `armadilha` | `formula`, `efeito`, `modo: 'unica' \| 'rearme'`, `rearmeMs` | Invisível para quem não a colocou; dispara ao pisar |
| `fonte_som` | `sfxId`, `raio`, `volume` | Áudio ambiente posicional |
| `zona` | `equipe?`, `pontosPorSegundo` | Objetivo de modos de arena (§2.13) |

### Geração procedural

Salas e corredores em L:

1. Grid preenchido de parede.
2. Até **8 salas** por padrão: largura ∈ [4, 10], altura ∈ [3, 8], até `salas × 20` tentativas, rejeitando
   sobreposição com margem de **2 células**.
3. Corredores em L ligando centros de salas consecutivas.
4. **Portas internas de teleporte**: 1 par a cada **10 salas**, extremos com distância Chebyshev ≥ **20**
   (relaxa para 15, depois 10 em mapas pequenos).

Dimensionamento automático, quando dimensões não são informadas:
`area = max(352, salas × 60)`, `largura = round(√(area × 1.4))`, `altura = round(area / largura)`.
O preset padrão informa explicitamente **60 × 40, 8 salas**, prevalecendo sobre a fórmula.

**Tudo é semeado.** `semente = hash(faseId)` alimenta o PRNG da fase: layout, nivelamento de inimigos,
variação de piso. Partículas usam PRNG visual separado, sem consumir a sequência de gameplay.
Mesma fase, versão de conteúdo e semente gera o mesmo conteúdo inicial. Na arena o servidor confirma
o estado: sementes iguais nos clientes não substituem sincronização.

### Distribuição de inimigos

Última sala recebe 1 boss (quando há mais de 2 salas). Demais salas:
`1 + floor(rand() × min(3, floor(largura × altura / 8)))`.

### Transições

- **Porta interna**: teleporte instantâneo na mesma fase, recarga de **800 ms**, com desvio para vizinho
  passável se o destino estiver ocupado. Inimigos cruzam com **50%** de chance.
- **Porta de saída**: tranca `livre`, `chave` (exige palavra coletada) ou `boss` (boss vivo bloqueia).
- **Boss morto** abre a passagem: porta temporária na posição dele por **30 s** (a janela fecha, a porta
  continua usável), ou destranca a porta existente. Sem próxima fase, o jogo gera uma:
  `salas = anterior + rand(0..3)`, `nivelInimigos + 1`, `matizGraus + 28`, herdando o tileset.
- **Troca de fase isola estado.** Ao sair: cancelar timers, destruir recursos gráficos da fase, parar sons
  ambiente, limpar destino de navegação. Ao entrar numa fase já visitada, restaurar o estado guardado
  (inimigos, objetos consumidos, respawns pendentes). A câmera volta a seguir o jogador.

### Spawner dinâmico

Roda a cada **90 s**, com **20 s de carência** no início da fase:

| Categoria | Máximo | Chance | Extra |
|---|---|---|---|
| Baú | 3 | 0.35 | |
| Loot | 4 | 0.50 | |
| Orbe | 3 | 0.30 | 40% HP / 30% recurso / 30% efeito |
| Armadilha | 2 | 0.30 | expira em 180 s |

Célula escolhida em até 40 tentativas: passável, livre de entidade e objeto, e **Chebyshev ≥ 4 de qualquer
jogador**.

## 2.2 Loop de simulação

**Passo fixo com acumulador e interpolação.**

```
loop(agora):
  acumulado += min(agora - anterior, 250)
  enquanto acumulado >= DT (1000/60):
      simular(DT)
      acumulado -= DT
  alpha = acumulado / DT
  renderizar(alpha)
```

`simular(dt)` **não toca DOM nem a camada gráfica** e não sabe se está em rede.

Ordem por tick:

1. Aplicar comandos do tick (§3.3)
2. IA: detecção → perseguição → invocações → dominados
3. Combate: conjurações em curso, impactos agendados, recargas, ataque automático
4. Efeitos: dano e cura periódicos, expiração, regeneração
5. Congelamentos (baú, loja) e temporizadores
6. Movimento: drenagem de waypoints de todas as entidades
7. Gatilhos por célula alcançada (§2.3)
8. Mortes, respawns e pontuação do modo
9. Periódicos de gameplay: 1 Hz (poda de rastros e armadilhas, rearme, limpeza de objetos,
   proximidade) e spawner dinâmico

Câmera, prompt de interação visual, som ambiente e passos pertencem ao adaptador de apresentação,
fora do núcleo. Áudio pode atualizar a 4 Hz. O loop acima é o do navegador; o servidor usa agendador
monotônico com o mesmo passo fixo. Atraso gera métrica e controle de carga; não alterar timers por
relógio de parede nem usar `requestAnimationFrame` no servidor.

Simulação guarda posição **lógica** (`x`, `y`, em células), origem/destino e progresso do passo.
A apresentação mantém `renderX`/`renderY` separadamente. Servidor não mantém posição visual ou
câmera; interpolação e suavização nunca alteram colisão, alcance ou estado autoritativo.

**Pausa existe só na campanha.** Na arena, abrir menu ou inventário não para o mundo — o personagem continua
vulnerável, e a interface precisa avisar isso na primeira vez.

## 2.3 Movimento, colisão e navegação

### Modelo

Grid discreto, movimento célula a célula com interpolação visual. Sem gravidade, sem pulo, sem física
contínua. Apenas direções cardinais — o movimento cardinal é o que mantém o grid legível e faz o
posicionamento importar.

**Entrada Dir8 e movimento cardinal (v4.0).** Após remapear tela → grade (§4.5), intenção diagonal
vira passos cardinais alternados. Em empate, começar por X; guardar alternância no estado previsto
e no checkpoint. Cada célula cardinal consome o mesmo orçamento de distância e tempo: não há passo
simultâneo X/Y nem bônus de velocidade diagonal. Eixo bloqueado pode ceder ao outro, se válido;
ambos bloqueados param. Testar mudança de direção e obstáculos em ambas as projeções.

Entrada mantida é estado direcional: início, mudança e parada. Repetição do D-pad e renovação de rede
não concedem passos extras. O integrador continua consumindo distância pelo tempo de simulação.

### Velocidade

```
velocidadeBase = 400 ms por célula
mult = max(0.2, 1 + (destreza - 10) × 5 / 100)
se dominado: mult × 1.3
velocidade = max(0.3, (1000 / velocidadeBase) × mult)   // células por segundo
```

Padrão: **2,5 células/s (120 px/s)**. Destreza 20 → 3,75 células/s.

Outras cadências: patrulha **1500 ms/passo**; perseguição `max(150, round(400 / mult))` ms/passo.

### Integração

Consome múltiplos waypoints por tick (`restante = dt/1000 × velocidade`), com guarda de iteração.
Fila do jogador limitada a **2 waypoints**. Mudança de direção com menos de 50% da animação concluída
cancela o passo anterior, evitando zigue-zague.

O relógio de caminhada avança **por distância percorrida**, não por tempo de parede:
`relogioAndar += 1000 × distância / velocidade`.

### Colisão

**Contra o terreno:** célula passável ou não.

**Contra entidades**, nesta ordem:

1. A própria entidade → livre
2. Entidade escondida → livre
3. Jogador com HP 0 → livre (corpo não vira parede)
4. Célula diferente após arredondar → livre
5. Avatar (§2.9) → **sempre bloqueia**
6. Fora de combate, entidade com `fantasma` → livre
7. Fora de combate, envolvendo invocação aliada → livre
8. Jogador × jogador → regra do modo (padrão: não bloqueia)
9. Jogador × inimigo → regra do modo (padrão: não bloqueia)
10. Inimigo × inimigo → **sempre bloqueia**

**Colisão é resolvida na integração.** Pares bloqueantes não podem compartilhar célula reservada;
pares liberados pelas regras acima podem se sobrepor. Resolver conflitos de movimento por prioridade
rotativa por tick e ID estável, sem privilegiar criador ou ordem de entrada. Interpolação não autoriza
atravessar bloqueios.

Escapes: `atravessar` ignora paredes (ao expirar, busca em largura de 8 direções pela célula válida mais
próxima); `fantasma` ignora entidades fora de combate.

### Navegação

- **`caminho(origem, destino, maxPassos = 60)`** — busca em largura, 4 direções, considerando só o terreno.
  Usada por toque no mapa, perseguição (150) e invocações (120). Implemente com mapa `veioDe`, nunca
  copiando o caminho a cada expansão.
- **Cache do perseguidor**: recalcula quando não há caminho, quando o alvo se moveu ≥ 2 células (Manhattan),
  ou quando a próxima célula bloqueou. Após 3 falhas, troca de alvo ou desiste.
- **Antitravamento**: memória das 3 últimas células no fallback guloso.
- **Invariantes testáveis (v4.0)**: caminho cardinal, passável e sem ciclos; destino alcançável dentro
  do orçamento resulta em caminho válido. Contornar paredes pode aumentar temporariamente distância
  Manhattan. Distinguir `alcancado`, `inacessivel` e `limite_excedido`; exceder limite não prova
  inacessibilidade. Cobrir obstáculos em U e rotas que inicialmente afastam do destino.

### Gatilhos por célula alcançada

Nesta ordem: proximidade de hostis → entrada em combate → ataque automático → salvar posição → rastro →
porta interna / porta de saída → regeneração por movimento → coletar objetos → checar armadilha →
atualizar prompt de interação → câmera.

## 2.4 Câmera

Dois modos, escolha do jogador, persistida:

**Janela morta (padrão)** — a câmera só desloca quando o jogador cruza a margem:
- Margem **20%** no desktop, **30%** no toque
- **Histerese de 25% da célula**, para absorver arredondamento
- Disparada pela mudança de **célula lógica**, não pela posição interpolada; recalcula só o eixo que mudou
- Limitada aos limites da fase

**Centralizada** — jogador sempre no centro, recalculado a cada frame pela posição de render.

**Suavização:** interpolação linear com velocidade máxima, `max(15, velocidadeJogador × 1.5) × SZ` px/s.
Guarde a posição em float; arredonde só no desenho.

Comportamentos obrigatórios:

- **Reserva para os controles**: no toque, a altura efetiva desconta a faixa de controles (**160 px**),
  para o personagem nunca ficar sob o dedo. Leia essa altura com throttle de 1 s, nunca por frame.
- **Enquadrar dois** (campanha): ao engajar, enquadra atacante e alvo no ponto médio — respeitando uma
  janela de **4 s** após o jogador mexer na câmera manualmente. Na arena, a câmera segue só o próprio
  jogador; enquadrar dois vale apenas para espectador.
- **Zoom** de **0.3 a 3.0**: pinça de dois dedos **ancorada** (o ponto do mundo sob o centro da pinça fica
  parado), roda do mouse ±0.1, botões com porcentagem e "ajustar à tela".
- **Efeitos de câmera**: tremor, congelamento de impacto, flash, soco de zoom e aberração cromática.
  Todos respeitam `prefers-reduced-motion`.

## 2.5 Entidades, equipes e hostilidade

Toda entidade:

```ts
Entidade = {
  id, nome,
  tipo: 'jogador' | 'inimigo' | 'invocacao' | 'avatar',   // o que é
  equipe: EquipeId,                                        // de que lado está
  dono?: EntidadeId,                                       // invocação/avatar herda a equipe do dono
  controlador: { tipo: 'local' | 'remoto' | 'ia', jogadorId?: JogadorId },
  x, y, origemPasso, destinoPasso, progressoPasso, waypoints[],
  hp, hpMax, recursos, efeitos[], recargas,
  aparencia, ...
}
```

**Hostilidade é por equipe, nunca por tipo.** Uma única função decide:

```ts
relacao(a, b): 'proprio' | 'aliado' | 'neutro' | 'hostil'
```

resolvida pela tabela de relações do modo de jogo. Mira, auto-alvo, IA, colisão configurável, aplicação de
efeito positivo ou negativo, dano em área e concessão de XP **todos** passam por ela.

Nada no código pode decidir hostilidade olhando `tipo`. Isso é verificável por busca e é critério de aceite
(§6.2) — sem essa regra, dois jogadores nunca se atacam e a arena não existe.

Fogo amigo é parâmetro do modo. Dominação (§2.8) troca a **equipe**, não o tipo.

### Presets de inimigo

| Preset | HP base | Hesitação (s) | Detecção | XP | Modelo |
|---|---|---|---|---|---|
| `goblin` | 40 | 5 | 3 | 10 | goblin |
| `esqueleto` | 45 | 6 | 3 | 10 | esqueleto |
| `orc` | 60 | 4 | 4 | 10 | orc |
| `troll` | 70 | 7 | 4 | 10 | troll |
| `vampiro` | 55 | 3 | 5 | 10 | vampiro |
| `cultista` | 50 | 5 | 3 | 10 | cultista |
| `lobo` | 35 | 4 | 5 | 8 | lobo |
| `aranha` | 30 | 6 | 3 | 6 | aranha |
| `slime` | 25 | 8 | 2 | 5 | slime |
| **`boss`** | **140** | **1** | **6** | **50** | demônio |

Respawn: **60 s**; boss **300 s**. Modos: `timer`, `manual`, `nunca`.

**HP (precedência resolvida, v4.0):**
`hpMax = max(1, round((hpBaseResolvido + constituicaoEfetiva × hpAtributoMult) × dificuldadeMult))`.
Inimigos: override explícito da instância → override explícito da fase → HP base do preset da tabela
→ fallback 100. Jogador: base da classe → fallback 100; override da fase não altera o jogador.
Multiplicador padrão **4**, dificuldade padrão **1**. HP máximo é derivado de bases e modificadores
validados; pode ser cacheado e replicado pelo servidor, mas nunca aceito da ficha enviada pelo cliente.
Mudança de máximo limita HP atual ao novo máximo; cura de subida de nível é política própria em dados.

**Classe:** 50/50 entre corpo a corpo e conjurador. Alcance **2** e **4** células; ataque base `1d10` e `1d8`.

**Nivelamento semeado** por `hash(faseId + índice)`, a partir do nível 2, por nível:
50% `{Con+2, For+1}` ou `{For+2, Con+1}`; nível ≥3 `Int +1..2`; ≥7 `Des +1`; ≥10 `Sab +1`.
`slotsDeHabilidade = 1 + floor(nivel / 3)`.

## 2.6 Inteligência artificial

Três estados contínuos.

**Patrulha** — avalia a cada **2 s**, passo a cada 1500 ms com desvio por id. Só age com a fila de movimento
vazia. **10%** de chance de se aproximar do jogador mais próximo, **60%** de manter a direção; senão sorteia,
excluindo a reversa e as 3 células recentes. PRNG semeado por id: reproduzível no harness. Na arena só o servidor executa IA autoritativa.

**Detecção e hesitação** — raio Manhattan do preset. Ao entrar no raio pela primeira vez, sorteia quanto
tempo hesita antes de atacar:

| Tempo | Chance |
|---|---|
| **10 s** (base) | restante |
| **7 s** | 50% |
| **5 s** | 30% |
| **2 s** | 10% |

Cada ponto de **Carisma** acima de 10 multiplica cada chance por **0.9** — carisma faz o inimigo hesitar mais.
A hesitação congela com o jogo pausado e é desarmada se o alvo ficar escondido. Zerada, começa a perseguição.

**Perseguição** — avança pela velocidade de perseguição, ataca com Chebyshev ≤ alcance respeitando o
intervalo de ataque do preset (**5000 ms** de referência; bosses e inimigos rápidos bem abaixo).
Prioriza avatares sobre jogadores.
**Desiste** após **10 s** sem interação, verificando a cada **3 s** com **10%** de chance.
Atordoamento bloqueia movimento e início de ações e cancela conjurações em curso.
Silêncio bloqueia início/continuidade de conjuração mágica, mas permite movimento e ataque físico.
Projétil já lançado continua após atordoamento, silêncio ou morte do lançador; exceções são declaradas
na habilidade e testadas, nunca inferidas da animação.

**Escolha de alvo e habilidade** (contínua): aggro de dominação → iscas → avatares → menor HP / mais próximo,
sempre filtrado por `relacao() === 'hostil'`. Respeita slots, recarga e alcance.

### Arquétipos e aprendizado (v4.0)

Preset visual e arquétipo de IA são campos independentes. A primeira versão jogável inclui:

| Arquétipo | Decisão tática | Telegrafia |
|---|---|---|
| Perseguidor | Aproxima e pressiona espaço | Preparação do golpe e alcance |
| Atirador | Mantém distância e lança projétil | Direção, preparação e trajetória |
| Controlador de área | Marca uma área antes do impacto | Geometria da área e contagem |

Silhuetas, ícones e animações distinguem ameaças sem depender só da cor. Primeiros encontros
apresentam um arquétipo por vez, depois combinações; boss reutiliza comportamentos com variação
legível. Ajustar decisões e leitura, além de HP/dano. Validar compreensão com jogadores (§5.7).

## 2.7 Combate

Combate é um laço contínuo. Não existe estado de batalha com início e fim: "estar em combate" é **derivado**
(há hostil em perseguição por perto) e serve só para música, interface e bloqueio de regeneração.

### O ciclo de uma ação

| Etapa | O que acontece | Duração |
|---|---|---|
| **1. Intenção** | Jogador escolhe habilidade e alvo, ou o auto-alvo escolhe; a IA decide | instantâneo |
| **2. Validação** | Alcance, recurso, recarga, silêncio, restrições de tipo de ataque | instantâneo |
| **3. Conjuração** | Custo e recarga descontados **aqui**; animação roda e a ação fica **telegrafada** | `conjuracaoMs` |
| **4. Viagem** | Projétil ou onda percorre a distância; efeitos instantâneos pulam | por animação |
| **5. Impacto** | Rolagem, crítico, dano, efeitos, feedback | instantâneo |

**Interrupção (v4.0):** durante conjuração, atordoamento, silêncio em ação mágica, morte ou perda
de validade do alvo cancelam a ação. Custo e recarga pagos não retornam, salvo configuração explícita.
Após lançamento, projétil/onda continua como ação pendente do servidor; colisão, expiração, alvo
removido e imunidade definem impacto. Alvo afastar-se não cancela automaticamente um projétil lançado.
Contato/área consultam geometria no tick de impacto. Habilidade declara `politicaAlvo`, `interrupcao`
e `politicaImpacto`; a lógica não depende do tempo de uma animação do cliente.

**`conjuracaoMs` é propriedade da habilidade.** Referência para o ataque básico: **504 ms**.

### Rolagem de dados

O d20 e as fórmulas ficam — são a identidade de RPG do jogo. A apresentação **nunca bloqueia**:

- Número de dano saindo do alvo, cor por resultado, marca de crítico.
- Sorteio animado como elemento do HUD, ignorável.
- Em área, um número por alvo, **escalonados a 80 ms** entre si.
- Em qualidade baixa ou com `prefers-reduced-motion`, só o número final.

### Ataque básico

Automático: verifica a cada **250 ms** por entidades hostis em perseguição dentro do alcance. Preferência
configurável — mais próximo (padrão) ou menor HP. Recarga própria, modificável por efeitos.
**Na arena é opcional por modo**, com padrão ligado (o toque depende dele).

### Cálculo de dano

1. **Bloqueios**: silêncio; restrição por tipo de dano (`todos`, `fisico`, `magico`); ação já em conjuração
2. **Alvo**: selecionado → auto-alvo → mira manual, filtrado por `relacao()` e fogo amigo
3. **Área**: `quadrado`, `linha` ou `todos_hostis`
4. **Rolagem**: fórmula multigrupo (`"2d6+1d8+3"`, aceita dados negativos)
5. **Atributo**: `dano += floor(atributo × multiplicadorDaHabilidade)`.
   Fórmula **aditiva e única** para ataque básico e habilidades — multiplicador padrão 0.5, ajustável por
   habilidade. Atributo padrão: conjurador → Inteligência; senão Força
6. **Buffs de ataque básico** quando aplicável
7. **Crítico** pela tabela do d20. Resultado ×0 encerra componente de dano com **zero** e não aplica
   efeitos dependentes de acerto; custo e recarga permanecem pagos
8. **Defesa**: redução plana do dano acertado
9. **Buffs de saída**: aplicar multiplicadores, arredondar uma vez e limitar dano acertado a **≥ 1**.
   **Imunidade** tem precedência e zera; falha crítica/imunidade nunca viram dano 1
10. **Aplicação**, com HP mínimo 0. Cura e efeitos independentes seguem seu próprio componente

### Tabela de crítico (d20)

| Rolagem | Multiplicador |
|---|---|
| 1–3 | **×0** (falha crítica) |
| 4–12 | ×1 |
| 13–15 | ×1.2 |
| 16–19 | ×1.5 |
| 20 | **×2** |

**Carisma** dá chance de converter qualquer rolagem em 20: cada ponto acima de 10 acumula **1%** + `i × 0,5%`.

### Defesa

Atributo derivado: base por classe + bônus de equipamento, aplicado como **redução plana** no dano final,
com clamp ≥ 1 apenas para acerto não imune. É o que dá função real aos slots de armadura e o que permite build defensiva existir —
sem ela, o combate vira corrida de dano e os 10 slots viram aritmética de ataque.

### Recargas

Um regime só: `recargas: Map<'entidadeId_habilidadeId', tickDeExpiracao>`, aplicação monotônica.

**Guarde a expiração em tick da simulação, não em relógio de parede.** Relógio de parede diverge entre
máquinas e quebra quando o celular suspende a aba.

### Morte

HP 0 é morte direta.

- **Inimigo**: XP a quem abateu e a quem participou (dano nos últimos segundos), drop, respawn agendado.
- **Jogador na campanha**: penalidade de §2.12.
- **Jogador na arena**: regras do modo (§2.13) — sem perda de XP nem ouro.

## 2.8 Habilidades e efeitos

```ts
Habilidade = {
  id, nome, icone, tipo,
  formulaDano,              // construtor de dados NdX + bônus
  alcanceCelulas, area, tipoArea,
  custoRecurso,
  recargaMs, conjuracaoMs, duracaoMs,
  elemento, efeitos[], animacao, sfx,
  nivelMinimo,
  politicaAlvo, interrupcao, politicaImpacto,
  compensacaoAtraso: 'nenhuma' | 'historico_limitado'
}
```

### Registro de efeitos — 26 tipos

Fonte única de verdade. Cada tipo declara `id`, `rotulo`, `icone`, `cor`, `ehStatus`, `positivo`,
`elegivelParaOrbe` (+ peso), `detectar(ef)`, `duracaoDe(ef)`, `campos[]` e, quando elegível, `construir()`
com padrões.

**Negativos:** `dano_periodico` · `atordoar` · `silenciar` · `sem_movimento` · `sem_ataque` · `modificar_dano`

**Positivos (elegíveis a orbe, com peso):** `cura_periodica` (20) · `bonus_dano` (18) ·
`ab_dano` (14) · `ab_recarga` (10) · `recuperar_recurso` (8) · `ab_alcance` (8) · `ab_multi_alvo` (6) ·
`imune_dano` (4) · `fantasma` (2) · `atravessar` (2)

**Instantâneos e de fluxo próprio:** `cura` · `teleporte` · `avanco` · `empurrao` · `efeito_atrasado` ·
`dominar_ao_matar` · `rastro_dano` · `rastro_efeito` · `invocar` · `armadilha`

Os quatro `ab_*` modificam o ataque básico: recarga, dano extra, alvos adicionais e alcance.

**Normalização é a peça-chave.** Um efeito autorado no editor pode combinar vários componentes num objeto só.
A normalização **divide em uma entrada canônica por componente detectado**, resolvendo tipo e duração e
removendo os campos dos outros tipos — sem isso, um mesmo efeito é detectado duas vezes adiante.

**Propriedade a preservar:** registrar um tipo novo com `elegivelParaOrbe: true` o coloca automaticamente no
sorteio do orbe de efeito e no editor. Extensibilidade sem tocar em dez lugares.

**Um dispatcher único por tipo.** Aplicar efeito acontece em **um** lugar do código. Habilidade nova é
registro novo, não cirurgia.

### Durações

Tudo em milissegundos. Tick de efeitos periódicos: **250–500 ms** (precisão importa em tempo real).
Dano e cura periódicos aplicam a cada **1000 ms**.

### Rastros

Células marcadas ao caminhar (traçado de Bresenham) que aplicam efeito a quem entra. Podadas periodicamente
e incluídas no save. Em arena, são ferramenta de área forte — atenção no balanceamento.

## 2.9 Invocações e avatares

### Invocações

Comportamentos: **`agressivo`** (mais próximo), **`assassino`** (menor HP), **`protetor`** (só ameaças ao
dono, nunca a mais de 3 células dele), **`curador`** (cura o dono, com recarga própria), **`isca`** (imóvel,
opcionalmente explosiva).

IA: passo a cada **380 ms**, raio de engajamento **5 células**, ataca adjacente (Chebyshev ≤ 1), senão segue
o dono a 2 células. Não bloqueiam aliados. Herdam a equipe do dono.

Ciclo de vida: `duracaoMs`, ordem, modo, rampa por tempo e por abates. Funil único de dano com redução plana.
Morrem por HP, expiração, dispensa ou morte do dono (salvo configuração e dominados).

### Avatares

Isca conjurada: HP altíssimo, `golpesRestantes = rolar('1d4')`, `duracaoMs`.
**Sempre bloqueia colisão**, inclusive contra jogadores hostis — o que o torna uma ferramenta de bloqueio de
rota em arena. Entidades hostis o priorizam como alvo.

### Dominação

Inimigo com `dominar_ao_matar` ativo, ao morrer, muda de **equipe** e passa a lutar ao lado de quem o
dominou, com velocidade ×1.3 e cascata limitada.

## 2.10 Itens, inventário e economia

### Equipamento — 10 slots

`arma_principal` ⚔ · `arma_secundaria` 🗡 · `cabeca` 🪖 · `corpo` 🥋 · `maos` 🧤 ·
`pernas` 👖 · `pes` 👢 · `anel` 💍 · `amuleto` 📿 · `capa` 🧣

### Raridades

`comum` `#888` · `incomum` `#2ecc71` · `raro` `#3498db` · `epico` `#9b59b6` · `lendario` `#f39c12`

### Item

`nome`, `tipo`, `descricao`, `icone` ou `imagem`, `raridade`, `valorBase`, `efeitos`, `alvo`, `alcance`,
`slotPadrao`, `bonusAtributos` (absoluto ou `{ modo: 'pct', valor }`), `nivel`, `nivelMinimo`, `peso`,
`compensacoes`, `visual`, `dropavel`, `chanceDrop`.

### Regras

- **Equipamento derivado (v4.0):** separar atributo-base e modificadores. Para cada atributo:
  `efetivo = clamp(round((base + somaBonusFixos) × (1 + somaPercentuais / 100)), minimo, maximo)`.
  Percentuais somam entre si, sem compor sobre valor atual; arredondar uma vez no final. Limites vêm
  de catálogo/modo. Equipar, desequipar, trocar, subir nível e aplicar clamp recalculam a ficha da base.
  Ordem de equipar não muda resultado; não usar deltas guardados como fonte de verdade. Efeitos
  temporários têm camada derivada posterior explícita, respeitando limites de modo.
- Consumíveis com efeitos e empilhamento; **atalhos 1–9 e 0**.
- Ordenação manual da mochila, persistida.
- **No toque, tocar a linha inteira usa ou equipa** e fecha o modal; no desktop há botões separados.
- **Ouro** é a moeda única.
- **Loja**: abre a Chebyshev ≤ 1, jogador congelado durante a janela de **5 s**; compra pelo `valorBase`,
  venda a **50%**. Fechar arma recarga de **10 s** por jogador e loja, e **morrer não escapa da recarga**.
  É o principal dreno de ouro do jogo.
- **Baús** congelam por 3 s, somem 5 s depois de abertos, podem exigir chave.
- **Drops**: item **10%**; orbe de HP **10%**; de recurso **8%**; de efeito **8%**. Só na primeira morte.

## 2.11 Armadilhas

Duas formas, ambas obrigatórias:

**Armadilha de habilidade** — o jogador arma numa célula com mira própria, pagando custo e recarga.
Quem pisa recebe dano por fórmula, mais dano periódico ou atordoamento opcionais. Limite simultâneo por
conjurador e expiração por tempo. Dispara conforme `relacao()` — em arena, funciona contra jogadores.

**Armadilha de fase** — objeto do conteúdo, invisível para quem não a colocou, disparo único ou com rearme
após N segundos.

## 2.12 Progressão e morte

- **XP por nível**: tabela configurável, com fallback `nivel × 100`. Nível máximo **20**.
- **XP por abate** com decaimento antifarm: `max(1, round(xpBase × 0.8^vezesMorto))`, ligável.
  Dividido entre participantes: `max(1, round(total / n))`.
- **Subida de nível** em laço (vários níveis de uma vez), **preservando o XP excedente**:
  `+3 pontos de atributo`, aumentos automáticos configurados, HP recalculado.
- **Atributos customizáveis** mapeados a 4 grupos-base:
  💪 força · 🏃 destreza · 🛡️ constituição · 🧠 inteligência.
  A ficha não tem atributos fixos: o jogo define nomes próprios e os associa a um grupo.
- **Recursos**: mana derivada — `max(1, round(10 × (1 + (sabedoria - 10) × 10 / 100)))`.
  Regeneração: **1 HP e 1 mana por célula caminhada** (bloqueada com hostil em perseguição) e regeneração
  contínua de recurso por segundo.
- **Descanso** (só campanha): `longo` restaura tudo e zera recargas; `curto` devolve **50%** do HP e
  **30%** da estamina.
- **Morte do jogador na campanha**:
  - perde **50** de XP
  - opcionalmente perde nível (padrão desligado), revogando pontos de atributo
  - perde entre **10%** e **50%** do ouro
  - revive com **100%** do HP após até **1,2 s**
  - fica **invisível para inimigos por 5 s**, podendo se reposicionar
  - invocações são destruídas (salvo configuração e dominados)
  - baú ou loja abertos se fecham, liberando o congelamento e **armando** a recarga da loja

## 2.13 Arena e modos de jogo

A arena roda o mesmo motor, as mesmas fases e as mesmas regras. O que muda é quem controla as entidades,
quem tem autoridade (§3.6) e quais regras de modo estão ativas.

### Descritor de modo

Modo de jogo é **dado**, em `src/data/modos/*.json`:

```ts
ModoDeJogo = {
  id, nome, descricao, icone,

  equipes: number,                  // quantidade de grupos, não define sozinha a relação
  politicaRelacao: 'todos_hostis' | 'todos_aliados' | 'por_equipe',
  autoBalancear: boolean,
  fogoAmigo: boolean,
  relacoes?: MatrizDeRelacao,       // quando não for o trivial

  fim: { tipo: 'nenhum' | 'abates' | 'pontos' | 'tempo' | 'ultimo_de_pe' | 'objetivo',
         alvo?: number, tempoLimiteS?: number },

  respawn: { ativo, atrasoS, atrasoCrescenteS?,
             local: 'base_da_equipe' | 'aleatorio' | 'longe_do_inimigo' },

  entradaEmAndamento: boolean,
  maxJogadores: number,             // de 2 a 10; Duelo fixa 2
  espectadores: boolean,

  clamp: ClampDeFicha,                    // §3.7
  loot: { politica: 'compartilhado' | 'individual', janelaParticipacaoS },
  limites: { npcs, invocacoesPorJogador, avataresPorJogador, armadilhasPorJogador, projeteis },
  progressaoContaParaCampanha: boolean,   // padrão: false

  fasesPermitidas: FaseId[] | 'qualquer',
  inimigosDeIA: 'nenhum' | 'da_fase' | 'ondas',
  objetosDeFase: boolean,
  spawnerDinamico: boolean
}
```

**Regra dura:** nenhuma regra de modo pode aparecer como `if (modo === 'x')` espalhado pelo código. O modo é
consultado por funções pequenas — `relacao()`, `podeRespawnar()`, `fimDePartida()`, `clampDaFicha()`.

### Modos iniciais

| Modo | Equipes | Fim | Respawn | Observação |
|---|---|---|---|---|
| **Livre** ⭐ | 1 (todos contra todos) | nenhum | sempre, ~5 s | **O coração.** Entra e sai quando quiser, sem partida. Inimigos de IA e objetos de fase ligados |
| **Duelo** | 2 (1×1) | último de pé, melhor de N | entre rodadas | Sala pequena, clamp forte |
| **Equipes** | 2 | abates ou tempo | na base | Fogo amigo desligado por padrão |
| **Horda** | 1 (todos aliados) | ondas sobrevividas | com atraso crescente | PvE cooperativo |
| **Rei da colina** | 2+ | pontos por tempo em zona | sim | Usa o objeto `zona` |

**Livre é o padrão e precisa estar impecável.** Os outros são variações de parâmetro sobre ele. Entregue
Livre primeiro e sozinho.

### Relações e recompensas (v4.0)

`politicaRelacao` distingue Livre (todos hostis, exceto próprio jogador e subordinados) de Horda (todos
aliados). `equipes: 1` não basta. Livre, Equipes, Horda e Rei da colina aceitam até 10 jogadores;
Duelo aceita 2. Espectador fica no pós-v1.

Loot comum do Livre é compartilhado, coletado por transação. Recompensa de boss/ondas da Horda é
individual por participante elegível: dano, cura efetiva ou contribuição ao objetivo nos últimos
**15 s**, parâmetro em dados. Servidor fixa elegíveis e gera IDs únicos; coleta no máximo uma vez por
elegível. Dados privados de recompensa vão somente ao dono. Essa regra evita corrida de ping pelo
drop cooperativo. Ganhos da arena não voltam à campanha na v1.

### Ciclo de uma sala

1. **Criar** — cliente solicita modo, fase e limite; backend valida e cria sala. Criador administra
   convite/configuração antes da sessão, sem autoridade sobre gameplay.
2. **Convidar** — código curto resolvido pelo backend, com limite de tentativas.
3. **Entrar** — recebe versão/hash de conteúdo, ficha validada, tick e snapshot coerente. Servidor
   fornece prévia da ficha efetiva antes da confirmação de entrada.
4. **Jogar** — servidor autoritativo; criador e convidados seguem o mesmo caminho de comandos.
5. **Sair** — criador pode sair sem encerrar ou transferir autoridade.
6. **Reconectar** — token reassocia jogador e devolve estado atualizado/ack de comandos.
7. **Servidor falha** — recuperar checkpoint ou encerrar com mensagem explícita (§3.6).

Sala sem clientes conectados expira em **120 s**, removendo conteúdo temporário. Reconexão reserva
o slot por **30 s**, sem exceder 10. Personagem desconectado permanece vulnerável; movimento/entrada
mantida expira em **500 ms** sem renovação. Efeitos e projéteis já iniciados continuam. Não existe
migração da autoridade para jogador.

### O que a arena muda nos outros sistemas

| Sistema | Diferença |
|---|---|
| Hostilidade | Pela tabela do modo |
| Morte | Regras do modo; sem penalidade de campanha |
| XP, ouro, loot | Por padrão não contam para o save |
| Loja e baús | Ligáveis por modo |
| Invocações e avatares | Herdam equipe; contam no limite por jogador |
| Armadilhas e rastros | Disparam conforme `relacao()` |
| Câmera | Segue só o próprio jogador |
| Auto-alvo | Respeita `relacao()` e fogo amigo |
| Minimapa e HUD | Cor por equipe; placar do modo |
| Pausa e descanso | Não existem |

## 2.14 Áudio

- **Música por contexto**: exploração, combate e boss, com transição em fade de **800 ms** e pausa
  retomável do ponto. A faixa sorteada por fase é cacheada na sessão — a mesma fase toca a mesma música.
- **Efeitos sonoros**: limite de **80 ms entre disparos do mesmo som**, teto de **4 vozes** simultâneas por
  som, variação de tom, e pan estéreo.
- **Som posicional**: volume cai com a distância; **20 células = silêncio**. Multiplicador global **0.75**.
- **Passos**: **450 ms por entidade** e **140 ms global** (~7 passos/s no grupo inteiro).
- **Mapeamento automático de som por habilidade**, com fallback por prefixo e teste no editor.
- **Fontes sonoras posicionadas no mapa**, em loop, com volume por distância.
- Volumes padrão: música **0.45**, efeitos **0.75**.
- Loops pausam com o jogo; a música para ao sair para o menu.

**Todos os assets de áudio são locais.** Nenhuma dependência de host externo.

## 2.15 Interface

- **Cabeçalho**: nome da fase, barras de HP (toque), botões de inventário, personagem, pausa e sair.
- **Barra de HP**: 60 px (40 px abaixo de 480 px de largura), cor por faixa —
  **>50% `#27ae60`, >25% `#f39c12`, senão `#e74c3c`** — sub-barra de recurso, marcadores de efeito ativo, e
  sub-barras roxas `#b07ef0` para invocações.
- **HUD** em três colunas; na arena, o placar do modo.
- **Barra de conjuração** sobre quem conjura, própria e dos alvos. É a telegrafia — sem ela o combate fica
  ilegível.
- **Feedback de dados não-bloqueante** e números de dano saindo das entidades.
- **Minimapa**: **120×120** no desktop, **90×90** no toque, opacidade 0.35 / 0.55, sem captura de ponteiro,
  pixel art. Terreno desenhado uma vez por fase; entidades por frame: eu branco r=3 · boss `#f1c40f` r=4 ·
  hostil ativo `#e74c3c` r=2.5 · inativo r=1.5 · aliado `#27ae60` · invocação `#b07ef0`.
  Na arena, cor por equipe. Atualização a **333 ms no toque, 100 ms no desktop**.
- **Painel de log**: combate, abates e, na arena, entradas e saídas.
- **Prompt de interação** contextual (baú, loja, porta).
- **Modal de inventário**: mochila e slots. Na arena não pausa.
- **Menu** com plano de fundo e botões.
- **Pausa** (campanha): `role="dialog" aria-modal="true"`, fundo clicável, foco no primeiro botão,
  com Configurações e Guia. **`Esc` é contextual**: cancela mira ou posicionamento antes de pausar.
- **Configurações**: gráficos (visão, qualidade, filtros), áudio, câmera, controles (analógico, auto-alvo e
  preferência), acessibilidade (escala de interface, movimento reduzido).
- **Guia** do jogador.
- **Indicador de rede** (arena): latência ao servidor, região, qualidade e aviso de reconexão.

## 2.16 Renderização, tilesets e sprites

### Camada gráfica

**Tudo em WebGL, nativo** — mundo, entidades e efeitos no mesmo grafo de cena. A isometria é transform de
container, não transform de DOM: isso elimina billboards manuais, correção de sentido por eixo de tela e
redução de resolução de fundo.

Ordem de camadas:

```
fundo → piso → rastros e armadilhas → portais e portas → realces de alcance e mira →
atmosfera (poços de luz) → entidades (ordenadas por Y no isométrico) → objetos →
efeitos de habilidade → interface → minimapa
```

Sub-camadas por entidade: sombra → aura de silêncio → brilho de cura → anel de detecção → sprite →
coroa de boss → barra de HP → barra de recurso → ícone de arma → **barra de conjuração** → anel de alvo →
nome → **marcador de equipe** → filtro cinza (invisível) → anel de atordoamento → tinta de contaminação →
faíscas de atravessar → aura de invocação.

### Terreno

- **Desenho em blocos** de 16×16 células, um sprite por célula criado uma vez por fase, **descarte por bloco
  fora da viewport**.
- Assinatura de invalidação barata: dimensões, fase, tileset carregado, grade, revisão.
- **Matiz por fase** aplicada ao container de terreno.
- **Luz**: textura radial de 256 px, mistura aditiva, cintilação
  `0.55 + sin(t/190)×0.07 + sin(t/47)×0.03`, raio `célula × 3.2`. Partículas de poeira só na qualidade alta.

### Tileset

Atlas único quadrado, grade **4×4 ou 5×5**. Layout canônico:

```
        col0          col1        col2          col3        col4 (opcional)
row0  canto_NO     parede_N     canto_NE     piso_1       canto_int_NO
row1  parede_O     piso_2       parede_L     objeto_1     canto_int_NE
row2  canto_SO     parede_S     canto_SE     bau          canto_int_SO
row3  porta        piso_3       parede_int   porta_fase   canto_int_SE
row4  piso_4       piso_5       objeto_2     objeto_3
```

**Transform D4 por peça**, sufixo `@1..@7`: `1/2/3` = rotação 90/180/270° horária; `4..7` = espelho
horizontal mais rotação `(t-4)×90°`. Uma parede desenhada uma vez serve aos quatro lados. O mesmo encoding
vale para células do grid.

**Autotiling**, ordem de decisão: cercado por piso → `piso_1`; cantos externos (dois cardinais piso, diagonal
parede); cantos internos (dois cardinais piso, diagonal piso) com fallback; corredores (`N e S` → `parede_N`,
`E e O` → `parede_O`); faces simples; vértices.

**Variação de piso** por PRNG determinístico por posição, com avalanche (sem padrão diagonal):
`objeto_1` se < **0.03**; `piso_2` se < **0.15**; `piso_3` se < **0.225**; senão `piso_1`.
Posições de baú têm prioridade.

**Herança:** fase sem tileset usa o da fase de ordem menor mais próxima que tenha um; depois o da primeira
fase. Isso mantém padrão visual contínuo dentro de uma dungeon.

**Fatiamento:** arredonde **cada borda independentemente** (`largura = (imgW - sep×(cols+1)) / cols`) para
evitar deriva de float, materialize rotações em textura, e use amostragem `NEAREST`.

### Sprites de personagem

**Caminhada procedural por fatias.** O token é uma imagem única de corpo inteiro, sem esqueleto. A caminhada
é emulada fatiando a imagem em **18 tiras horizontais** e deslocando cada uma. Origem `(0,0)` no centro dos
pés; altura `célula × 1.12`, largura proporcional.

Cinco estilos:

| Estilo | Motor | Parâmetros |
|---|---|---|
| `quique` | balanço global + oscilação por altura + respiração parada | — |
| `passada` | bípede | cadência 380 ms, amplitude 0.10, balanço 0.05, corte de perna 0.42, inclinação 0.018 |
| `marcha` | bípede + compressão 0.05 | cadência 540 ms, amplitude 0.13, balanço 0.08, corte 0.40 |
| `flutuar` | pairar + pulso de asas | cadências 1400 e 760 ms, amplitude 0.05 |
| `deslizar` | bainha como pêndulo | cadência 520 ms, corte 0.45, amplitude 0.09 |

Motor bípede: abaixo do corte, a tira é dividida em duas colunas, cada uma com elevação e deslocamento em
**fase oposta (π)**; acima, contrabalanço e inclinação, com a faixa da arma amortecida.
Parado e ataque usam sempre o motor genérico, por consistência entre estilos; ataque tem empurrão de
`0.20 × largura` e esticamento de `1.06` em 400 ms.

**Atalho de qualidade:** um único desenho em vez das 18 tiras nas qualidades baixas. É o maior custo por
token no isométrico.

### Modelos de criatura

Onze modelos gerados por função a partir de uma cor — `goblin, esqueleto, orc, troll, vampiro, demonio,
generico, lobo, aranha, slime, cultista` — cada um com duas vistas: **de cima** e **3/4 em pé**, com
sombreamento por escurecimento paramétrico.

Mais: classes jogáveis com dois quadros de animação e as duas vistas; envio de token próprio pelo jogador,
com controle de sentido e origem; aparência customizável; e **ajuste de tamanho de token por dispositivo**,
guardado localmente.

**Gere os atlas em build** (vetor → textura + JSON). Nada de rasterizar em tempo de execução.

### Efeitos visuais

- **Filtros** (todos desligáveis): desfoque, ruído, alfa, matriz de cor, brilho, floração, onda de choque,
  raios de luz, separação RGB, contorno, CRT, deslocamento e shader próprio.
- **Partículas** com texturas geradas e cacheadas: faísca, brilho, fumaça, anel, rastro, estrela, brasa, ruído.
- **Presets cinematográficos** de impacto, cada um com tremor e congelamento de câmera, floração,
  escurecimento de fundo e áudio de conjuração e impacto.
- **Efeitos vivem em coordenadas de mundo**: guarde a célula e reconverta por frame, para o efeito acompanhar
  deslocamento e zoom.
- **Tipos de animação** com atraso de viagem até o impacto: projétil, onda, explosão, raio e aura, com
  posição em alvo, atacante, meio, trajetória, retorno ou área; mais partículas e efeitos **persistentes**
  ligados à duração do status.
- **Higiene obrigatória**: temporizadores rastreados e cancelados ao trocar de fase; filtros destruídos
  explicitamente; recursos gráficos liberados por fase.

---
---

# PARTE 3 — ARQUITETURA

## 3.1 Stack

| Camada | Escolha |
|---|---|
| Linguagem | **TypeScript estrito** (`strict: true`, sem `any`) |
| Build | **Vite** |
| Render | **PixiJS v8** (WebGL/WebGPU) |
| Animação | **GSAP** |
| Áudio | **Howler** |
| Interface | **DOM + CSS** sobre o canvas |
| Estado | Módulo próprio, sem framework |
| Save | **IndexedDB** + exportação JSON |
| Backend da arena | **Node.js + TypeScript**, núcleo de simulação compartilhado |
| Salas e sincronização | **Colyseus**, versão fixada no lockfile |
| Rede | **WebSocket seguro (WSS)** cliente-servidor, atrás de interface (§3.6) |
| Testes | **Vitest** (unidade e simulação) + **Playwright** (ponta a ponta) |

Campanha/editor local não precisam de backend. Arena usa backend de salas e simulação, sem conta
obrigatória ou banco de progressão. Tokens opacos de sessão/reconexão vêm do servidor; checkpoints
temporários precisam sobreviver à queda do processo. Endpoint público é configuração; segredos ficam
somente no backend. Um processo pode atender várias salas conforme benchmark.

## 3.2 Estrutura

```
src/
  main.ts
  core/
    loop.ts        # passo fixo, acumulador, interpolação
    rng.ts         # PRNG com semente, injetável
    clock.ts       # relógio injetável
    comandos.ts    # fila de comandos (§3.3)
    events.ts      # barramento tipado
    save.ts        # serialização e migração
    storage.ts     # IndexedDB
  world/
    fase.ts  tileset.ts  colisao.ts  navegacao.ts
    objetos.ts  spawner.ts  gerador.ts
  entities/
    entidade.ts  jogador.ts  inimigo.ts  invocacao.ts  avatar.ts
    ia.ts
  combat/
    acao.ts        # ciclo intenção → conjuração → viagem → impacto
    dados.ts  critico.ts  defesa.ts  efeitos.ts
  progression/
    ficha.ts  xp.ts  morte.ts  descanso.ts
  items/
    catalogo.ts  inventario.ts  equipamento.ts  loja.ts
  render/
    stage.ts  terreno.ts  sprites.ts  caminhada.ts  iso.ts
    vfx.ts  camera.ts  minimapa.ts  hud/
  input/
    teclado.ts  ponteiro.ts  gamepad.ts
    touch/ joystick.ts  dpad.ts  roda-habilidades.ts  auto-alvo.ts
  audio/ audio.ts
  ui/ menu.ts  pausa.ts  config.ts  guia.ts  modais.ts
  net/                     # chunk sob demanda
    protocolo.ts  transporte.ts  transporte-local.ts  transporte-colyseus.ts
    sala.ts  cliente.ts  predicao.ts  reconciliacao.ts  clamp.ts
  modos/
    modo.ts  relacao.ts  placar.ts  respawn.ts
  editor/                  # chunk sob demanda
    editor.ts  ferramentas.ts  historico.ts  objetos-ui.ts
    tileset-ui.ts  validacao.ts  exportar.ts  touch.ts
  data/
    fases/  itens.json  skills.json  inimigos.json  modos/
    balance.json  tilesets/  sfx/  bgm/  schemas/
server/
  main.ts  salas/  validacao/  checkpoint/  observabilidade/
  # importa core/world/entities/combat, nunca render/input/UI
shared/
  protocolo/  schemas/
tools/
  gerador-cli/  carga/  rede-simulada/
tests/
  unit/  sim/  e2e/
```

**Teto de 800 linhas por arquivo.** `update(dt)` e `render(alpha)` nunca no mesmo arquivo.

## 3.3 Estado e comandos

- **Um** estado raiz tipado, com sub-estados por domínio. Sem campos dinâmicos, sem `any`.
- Mutação de gameplay só dentro de `simular()`. A interface lê e emite **intenções**.
- Na arena, autoridade pertence ao servidor. Cliente separa cópia recebida, estado previsto e
  apresentação. Adaptador de replicação lê o resultado após tick; não cria segunda lógica de jogo.
- Barramento de eventos tipado, para desacoplar HUD, áudio e efeitos da simulação.
- **Sem globais.**

### A fila de comandos

`simular(dt)` **nunca** lê entrada diretamente. Ela consome comandos:

```ts
type Comando =
  | { t: 'mover',        dir: Dir8 | 'parado' }
  | { t: 'irPara',       x, y }
  | { t: 'usarHabilidade', id, alvo?: EntidadeId | Celula }
  | { t: 'ataqueBasico', alvo?: EntidadeId }
  | { t: 'usarItem',     invId }
  | { t: 'equipar',      invId, slot }
  | { t: 'interagir' }
  | ...

type ComandoEmpacotado = { sessaoId, epocaSala, seq, tickCliente, cmd }
// Servidor deriva jogadorId da sessão, atribui tickAplicacao e retorna ackSeq.
// ID/tempo recebido nunca define autoridade ou resultado.
```

| Produtor | Campanha | Arena |
|---|---|---|
| Entrada local | sim | sim |
| IA | sim | sim (somente no servidor) |
| Rede | — | sim |
| Testes e bot de simulação | sim | sim |

Essa fronteira entrega de uma vez: a arena (comandos vêm da rede), a reconciliação (cada comando tem `seq`),
o bot determinístico dos testes, e replay (gravando a fila e a semente). É barata no dia 1 e cara depois.

## 3.4 Interface

DOM e CSS sobre o canvas. Duas regras:

- **Escape por padrão**: um template marcado que escapa tudo. Nada de concatenar HTML cru.
- Botões comuns usam `click` para teclado/mouse/toque e `touch-action: manipulation`.
  Controles mantidos usam Pointer Events e captura por `pointerId`. Não disparar ação em `touchend`
  e novamente no `click` sintético. ID do comando também previne duplicação na rede.

## 3.5 Save

IndexedDB, sem conta e sem nuvem:

- **Vários slots** e **autosave** (troca de fase, fim de combate, intervalo fixo)
- **Versão de schema** com migrações explícitas
- **Exportação e importação** em arquivo `.json`
- Gravação **não bloqueante**, nunca dentro do tick

Domínios separados:

| Store | Conteúdo |
|---|---|
| `progresso` | Um save por aventura: ficha, inventário, fase e posição, estado das fases visitadas (objetos consumidos, inimigos mortos com contagem, respawns pendentes, rastros), recargas, efeitos, invocações, semente, estatísticas |
| `aventuras` | Aventuras criadas pelo jogador (§3.10) |
| `tilesets` | Atlas enviados pelo jogador, como Blob |
| `perfil` | Apelido, id local estável, preferências, configurações |
| `arena` | Preferências e estatísticas de arena, **separadas do progresso** |

**Nada da arena escreve no progresso** enquanto `progressaoContaParaCampanha` for `false`. Essa separação é o
que impede uma sessão de PvP de corromper uma campanha longa.

Migração vale para todos os domínios: conteúdo criado pelo jogador numa versão antiga precisa continuar
abrindo.

## 3.6 Rede e autoridade — até 10 jogadores (v4.0)

Arena executa o núcleo puro em servidor dedicado autoritativo, independente de qualquer jogador.
Campanha executa esse mesmo núcleo offline. Todos os clientes, inclusive criador, conectam por WSS;
limite duro de **10 jogadores ativos**, sem privilégio de execução local no servidor para o criador.
Servidor dedicado significa autoridade independente, não uma máquina exclusiva para cada sala.

### Responsabilidades

**Somente o servidor decide:** movimento válido, colisão, IA/aggro/caminho, conjuração, projéteis,
dados, dano, cura, morte, equipes, efeitos, recargas, inventário de sessão, compra/venda, loot,
baús, orbes, portas, armadilhas, rastros, spawns/respawns e pontuação. Cliente envia intenções;
nunca resultado de dano, HP final ou posição oficial. Estado recebido de cliente é validado.

**Cliente prevê:** movimento próprio e preparação visual de ações. Confirmação do servidor é
necessária para dano, morte, consumo definitivo e aquisição de item. VFX/som usam `acaoId` para não
duplicar ao confirmar. NPCs e outros jogadores são interpolados, sem IA autoritativa nos celulares.

### Predição e reconciliação contínua

1. Cliente guarda e envia comando com `seq`, contexto e tick estimado e prevê seu movimento.
2. Servidor valida sessão/recursos/limites, processa ou rejeita, e confirma `ackSeq` com o estado.
3. Cliente adota base autoritativa, descarta confirmados e reaplica pendentes em ordem.
4. Correção lógica é imediata; apresentação converge suavemente. Teleporte/erro grande pode exigir
   reposicionamento explícito; suavização nunca deve animar travessia de parede.
5. Comandos em voo não suspendem reconciliação, inclusive durante movimento contínuo.

Movimento mantido é renovado a **20 Hz**, com mudança/parada imediata. Cada renovação atualiza direção,
não acrescenta passo ou distância. Parar em `pointercancel`, perda de foco e suspensão; servidor aplica
timeout de 500 ms. `seq` é monotônico na sessão, preservado na reconexão; só reinicia em sessão nova.
Limite inicial de **60 comandos/s por cliente**, burst de 20 e fila limitada. Rejeitar excesso com motivo;
nenhum jogador acelera simulação enviando mais mensagens. IA não recebe comandos de clientes.

### Cadências e transporte

| Fluxo | Ponto de partida a validar |
|---|---|
| Tick de simulação | 60 Hz, passo fixo |
| Patch incremental do estado | 20 Hz |
| Input mantido | 20 Hz, mudanças/ações imediatas |
| Snapshot completo | Entrada, reconexão e ressincronização |
| Medição RTT/offset do relógio | A cada 2 s |
| Checkpoint externo ao processo | A cada 2 s, fora do tick |
| Buffer visual remoto | 100 ms inicial; ajuste entre 50 e 150 ms |

Frequência visual/render é independente do tick e da transmissão. Relógio oficial é `serverTick`;
estimar offset por RTT, nunca confiar em relógio de parede ou timestamp arbitrário do cliente.

WSS é confiável e ordenado: perda de pacote pode bloquear mensagens posteriores durante retransmissão.
Não tratar WebSocket como canal não confiável. Limitar filas/bytes e snapshots redundantes; cliente
atrasado recebe estado atual por ressincronização ou desconexão com motivo. Avaliar mudança de
transporte apenas com evidência do benchmark. Não há STUN, TURN ou sinalização peer-to-peer nesta stack.

### Estado e eventos

Simulação é fonte de verdade; adaptador copia mudanças ao Schema do Colyseus após o tick. Colyseus
distribui estado completo na entrada e patches; predição, justiça e validação pertencem ao projeto.

- **Público:** jogadores/NPCs/invocações/avatares, posição e progresso do passo, HP, equipe, ações,
  ticks de início/fim, efeitos visíveis, projéteis, objetos disponíveis, portas e placar.
- **Privado:** inventário, transações e loot individual enviados somente ao dono.
- **Só servidor:** PRNG, decisões de IA, filas, conteúdo oculto de baús/armadilhas e segredos de sessão.
  Não revelar armadilha invisível no payload de quem não pode detectá-la.
- **Eventos transitórios:** início/cancelamento/impacto, com `eventoId`, `acaoId`, tick e alvos.
  Estado atual deve bastar para reconstruir a tela; evento visual não é autoridade sobre HP/loot.

Cada atualização identifica sala, fase, época e revisão/cursor. Entrada recebe snapshot coerente e
patches subsequentes; remoções integram protocolo. Divergência solicita estado completo. Comparar
estado público no mesmo tick/revisão, não posições visuais em momentos diferentes. Para carga inicial,
replicar todas as entidades públicas; proximidade é otimização futura, sem ocultar ataque relevante.

### Sincronização de NPCs e itens

Servidor executa IA e spawner uma vez. IDs de instância são estáveis; respawn incrementa geração.
HP, aggro, estado de objetos e timers não têm versões oficiais independentes em cada cliente.
Todos veem o mesmo mundo público, sujeito ao atraso de apresentação da rede.

**Coleta, compra e abertura são transações dentro do tick:** verificar disponibilidade, geração,
distância, elegibilidade, saldo e espaço; reservar/consumir; transferir; registrar resultado; publicar.
Sem `await` entre validar e consumir. Reenvio do mesmo `comandoId` retorna o resultado registrado.
Baú compartilhado tem um abridor por vez; morte/cancelamento libera reserva conforme regra. Loja
declara estoque global ou por jogador em dados. Saldo/estoque jamais ficam negativos.

Conflitos no mesmo tick usam prioridade rotativa e ID, sem preferência do criador. Entre ticks vence
primeira operação válida processada: ping pode afetar disputa compartilhada. Loot individual de
recompensas cooperativas (§2.13) remove essa corrida. Reconectar não duplica coleta, venda ou recompensa.

### Justiça e telegrafia

Não há vantagem estrutural do criador, mas distância de rede continua afetando RTT. Criar sala na
região disponível que minimize o maior RTT do grupo; convidados veem região/ping antes de entrar.
Em implantação com uma região, informar essa limitação. Não mudar região durante combate na v1.

Ações ofensivas publicam `inicioTick`, `lancamentoTick`, `impactoPrevistoTick`, geometria e trajetória
quando aplicáveis. Default da v1: impacto no estado atual autoritativo; projéteis colidem durante
viagem. Não retroceder indiscriminadamente áreas, itens ou mundo. Compensação histórica fica desligada
por padrão; habilitar por habilidade exige histórico limitado a **100 ms**, timestamp validado e testes
de esquiva, sem retroagir inventário, loot ou ressuscitar NPC morto.

No perfil suportado (§5.6), cada ataque deve oferecer **ao menos 200 ms de aviso útil observado**
antes do impacto relevante. Manter conjuração básica 504 ms como referência e ajustar por modo se
teste revelar janela insuficiente. Evento tardio deve alinhar visual ao tick, sem inventar uma falsa
janela para esquivar; mostrar rede degradada. Não atrasar dano apenas numa tela ou garantir resultado
por previsão local. Fora da faixa de rede suportada não prometer a mesma justiça competitiva.

### Conteúdo da sala e limites

Fase personalizada é validada no backend: schema, referências, conectividade, spawns e limites de
entidades. Versão/hash identifica regras, catálogo, fase e manifesto de assets. Upload de mapa não
autoriza habilidade/item fora do catálogo permitido no PvP. Assets personalizados são distribuídos
temporariamente pelo backend; não há galeria permanente.

Limites iniciais: pacote **20 MB**, JSON **2 MB**, imagem até **2048×2048**, fase até **120×120**.
Validar tipo real, caminhos e referências de ZIP; rejeitar scripts/URLs externas e arquivos fora do
pacote. Remover pacote ao expirar sala/recuperação. Campanha continua usando recursos locais.

### Reconexão e recuperação do servidor

Token opaco temporário, rotacionado ao reassociar sessão. Dentro de 30 s, restaurar jogador, snapshot,
`ackSeq` e resultados relevantes. Pendentes reenviam o mesmo ID; deduplicação impede aplicar duas vezes.
Suspensão do cliente não pausa sala nem avança simulação oficial localmente.

**Checkpoint não é snapshot visual.** Inclui PRNG, tick, ações e impactos pendentes, recargas,
efeitos, caminhos, reservas, aggro, inventários, timers, rastros, respawns, pontuação, sessões e registros
de deduplicação. Versionar schema/conteúdo e checksum. Clonar consistentemente e gravar fora do tick
em armazenamento externo ao processo. Validar integralmente antes de restaurar e aceitar comandos.

Queda recuperável da v1 pode voltar até **2 s** de gameplay, quando checkpoints estão saudáveis.
Mostrar recuperação e rollback, incrementar `epocaSala`, rejeitar mensagens antigas e ressincronizar.
Não prometer recuperação invisível. Checkpoint incompatível/inválido ou falha irrecuperável encerra sala
com motivo. Recuperação sem perda exige journal futuro. Não existe migração para computador de jogador.

### Operação e validação

- Derivar jogador da sessão, rejeitar contexto/versão inválidos, NaN/infinito, spoofing de IDs e
  comandos acima de **16 KiB**. Conteúdo usa rota separada com limite próprio.
- Preservar IDs/resultados de transação no checkpoint; limitar filas e taxa por sessão.
- Métricas: tick p95/p99, atraso do agendador, RTT/jitter, bytes, filas, entidades, rejeições,
  divergências, reconexões, memória e falhas de checkpoint.
- TLS, endpoint e armazenamento definidos no deploy. Segredos só no backend.
- Múltiplas salas por processo somente após medir CPU/memória/banda com margem; não inferir capacidade
  apenas do número de jogadores. Estimar custo mensal pelo uso esperado antes do lançamento.
- Diagnóstico/replay inclui versão de conteúdo, comandos, eventos de entrada/saída e checkpoints.

## 3.7 Integridade da ficha no PvP (v4.0)

Save local editável não comprova posse legítima de equipamento, habilidade ou nível. Não investir em
ofuscação. Servidor constrói ficha de sessão a partir de escolhas validadas; ganhos não voltam ao save.

```ts
ClampDeFicha = {
  nivelMax, atributoMax, atributoTotalMax,
  raridadeMax, slotsPermitidos, habilidadesPermitidas,
  hpMaxAbsoluto?, orcamentoEquipamento, orcamentoAtributos,
  modo: 'clamp' | 'escalar' | 'preset'
}
```

- **Livre:** preservar aparência e escolhas da campanha dentro de orçamento comum. Itens têm custo
  de poder no catálogo do servidor; qualquer jogador pode montar combinação legal até o orçamento.
  Alegada posse no save não dá acesso exclusivo a opção mais forte.
- **Duelo:** presets/builds oficiais com acesso simétrico aos dois jogadores.
- **Equipes/Horda:** política em dados, com orçamento e limites obrigatórios.
- Clamp corta tetos; escalar reescala com arredondamento determinístico; preset usa ficha oficial.
  Aplicar orçamento total após tetos individuais, com desempate/redução documentados em dados.

Servidor recalcula atributos, HP, defesa, recursos e equipamento (§2.10); valida catálogo, slots,
combinações, custos e limites. Não confiar em HP, bônus embutidos ou habilidades autodeclaradas como
conquistadas. Habilidades legais são disponibilizadas pelo modo, não por prova impossível do save.

Prévia autoritativa mostra valores e alterações antes de entrar, com hash da política/catálogo.
Entrada revalida; mudança de versão exige nova prévia. Replicar ficha efetiva protegendo dados privados.
`progressaoContaParaCampanha` é **false em todos os modos da v1**; schema rejeita true.
Cliente adulterado não determina rolagem, inventa item ou excede orçamento. Automação de inputs não
é eliminada por essa arquitetura, mas autoridade privilegiada e resultados inventados são rejeitados.

## 3.8 Build e PWA

- `base: './'` se publicar em subdiretório.
- **Code splitting** por rota de funcionalidade: editor e rede são chunks sob demanda e não pesam no boot.
- **Camada gráfica e filtros por `import()` dinâmico**; falha ao carregar um filtro não pode bloquear a
  animação.
- **PWA**: manifest com ícones 192/512, `standalone`, orientação livre. Service Worker com precache do bundle
  e dos assets → **campanha jogável offline**. Cache-first para assets, network-first para navegação, nome do
  cache derivado do hash do build. **Registre o Service Worker no bootstrap.**
- Convite de instalação em momento não intrusivo.

## 3.9 Conteúdo como dado

Duas origens, mesmo formato e mesmo schema:

1. **Oficial** — `src/data/**.json`, versionado, validado em build e CI. Inválido quebra o build.
2. **Do jogador** — criado no editor, guardado no IndexedDB, validado **em tempo de execução**.
   Inválido **nunca** quebra o jogo: é recusado com mensagem clara no editor.

O jogador pode duplicar qualquer fase oficial como ponto de partida. A cópia é dele.

## 3.10 Editor de fases

O editor é **feature do jogador**: criar, salvar, jogar e compartilhar fases e aventuras próprias, de
campanha e de arena.

### Fluxos

- **Criar aventura**: nome, número de fases, semente, estilo. Começa em branco, de uma fase gerada
  proceduralmente, ou da cópia de uma existente.
- **Minhas aventuras**: listar, renomear, duplicar, excluir com confirmação, jogar e editar.
- **Testar agora**: entra na fase em edição com o personagem atual, com atalho de volta ao editor.
  É o laço de iteração — sem ele, editar é às cegas.
- **Exportar e importar**: uma aventura vira arquivo (`.json`, ou `.zip` com o atlas). Importar valida antes
  de gravar. É assim que o jogador compartilha, já que não há servidor.

### Ferramentas

Pincéis de terreno (piso, parede, vazio, saída) · borracha (remove porta, spawn e converte em parede) ·
balde (preenchimento 4-conexo, teto de 20.000 células) · retângulo · porta (interna em par, ou de saída com
tranca) · spawn (com equipe, em arenas) · pincel de peça do tileset com **rotação** e **espelho** ·
**distribuir** (reaplica o autotiling preservando portas, saídas e spawns) · **redimensionar** (8 a 120
células) · objetos (baú, loja, armadilha, fonte de som, zona) · inimigos por preset, com nível e marca de
boss · propriedades da fase · **desfazer e refazer por traço** (pilha de 120) ·
zoom 0.1–6 com pinça, roda ancorada, botões e ajustar à tela.

### Painel de tileset

Envio de atlas pelo jogador, grade 4–5, pré-visualização, e o **modal de vínculo peça ↔ função**: seletor
agrupado (Funções / Pisos / Paredes e cantos / Personalizadas), recorte da célula, aviso quando a chave já
aponta para outra peça, e opção de chave livre. O atlas vai para o store local. Na arena, uma cópia temporária pode ser enviada ao backend da sala
sob limites/validação de §3.6; não há publicação permanente.
No fluxo de criação, o tileset é fatiado e usado **em rascunho**, sem tocar o estado do jogo, até confirmar.

### Validação

Ao salvar e ao importar, duas camadas, com o erro mostrado **na célula**:

1. **Schema** — o mesmo do conteúdo oficial.
2. **Jogabilidade**:
   - existe spawn, em célula passável;
   - o spawn **alcança** a saída, a porta e todo objeto obrigatório;
   - toda porta interna tem dois extremos passáveis;
   - tranca por boss referencia um boss existente; tranca por chave, uma chave obtenível;
   - objetos e inimigos dentro dos limites e em célula passável;
   - `ordem` das fases única, sem ciclo não intencional;
   - toda peça referenciada existe no atlas;
   - em arena: cada equipe tem spawn, os spawns não são adjacentes, e todos alcançam o resto da fase.

Erro bloqueia o salvamento; aviso (fase sem inimigos) apenas alerta.

### Aprendizado de estilo

Ao editar, as escolhas viram regras por **assinatura de vizinhança** — 8 caracteres `P|F|D` na ordem
N, NE, E, SE, S, SO, O, NO — acumuladas num perfil e reaplicadas na geração procedural seguinte.
Estatísticas por média móvel com `alpha = 0.4`; assinaturas totalmente cercadas são descartadas como ruído.
Para o jogador, isso significa: **quanto mais você edita, mais as fases geradas se parecem com as suas.**

### Consequências técnicas

- **Chunk sob demanda.** Abrir o editor não pode pesar no boot nem na memória da sessão de jogo.
- **Precisa rodar no celular** (§4.10).
- **Reuso, não duplicação**: o editor usa o mesmo autotiling, o mesmo fatiador, o mesmo gerador e o mesmo
  renderizador do jogo. Um editor só.
- **Núcleo puro**: preenchimento, retângulo, escrita de célula, derivação de salas por componentes conexos,
  cálculo de zoom e vínculo peça↔função são funções puras com teste unitário.

### Geração por IA fica fora do runtime

Os prompts para gerar atlas de tileset, sprite de cima, sprite isométrico e dungeon completa são material de
autoria: **texto que o jogador copia** e cola na ferramenta de IA que usar, trazendo a imagem ou o JSON de
volta pela importação. Nenhuma chave de API no cliente, nenhuma chamada de IA em tempo de execução.

---
---

# PARTE 4 — MOBILE

## 4.1 Postura

O jogo entra direto no modo de toque em qualquer aparelho com toque, com os controles ativos, e permite
desligá-los na configuração (tablet com teclado). Não pergunte ao jogador como ele está jogando.

## 4.2 Detecção

Uma função só, combinando sinais:

```ts
const temToque       = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
const ponteiroGrosso = matchMedia('(pointer: coarse)').matches;
const semHover       = matchMedia('(hover: none)').matches;
const uaMobile       = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
const telaPequena    = innerWidth <= 900;

const ehToque = temToque && (uaMobile || ponteiroGrosso || semHover || telaPequena);
```

A condição "UA móvel **ou** tela pequena" exclui laptops com touchscreen.
Não condicione nada a `navigator.platform` nem a `window.orientation`.

**Requisito de aceite: o jogo é 100% jogável no modo de emulação de dispositivo do navegador, só com o mouse.**

## 4.3 Joystick analógico

- Anel externo **130×130 px**, botão **52×52 px**, circulares, `touch-action: none`, sem realce de toque,
  botão sem captura de ponteiro, transição de 50 ms.
- **Raio máximo do botão: 50 px** (limite radial).
- **Zona morta: 14 px** — abaixo disso, para.
- **8 setores de 45°**: `setor = round(((atan2(y,x)×180/π)+360)%360 / 45) % 8`, mapeando E, SE, S, SO, O,
  NO, N, NE. **Só reemite quando o setor muda.**
- Pointer Events com captura por ponteiro.
- **Rastreado por `pointerId`** — mover com um polegar e conjurar com o outro é requisito, não extra.
- **Vetor rotacionado no isométrico** (§4.5).

## 4.4 D-pad de 8 direções

- Grade 3×3, botões **48 px**, espaçamento 2–4 px, largura total ~152 px.
- `touch-action: none`, sem seleção, sem menu de contexto.
- Cantos arredondados **para fora**; diagonais com opacidade e fonte menores que as cardinais.
- Pressionado: `scale(0.88)` com cor cheia, transição de 80 ms.
- **Repetição a 180 ms**; **vibração de 18 ms** ao pressionar.
- **Reposicionável**: segurar o centro por 10 s (com barra de progresso na própria cor de fundo e vibração
  `[40,60,40]` ao entrar no modo) permite arrastar o D-pad. Posição guardada por personagem.

## 4.5 Direção no isométrico

Todo input direcional — teclado, joystick, D-pad — passa por um **remapeamento tela → grade**:

```
(0,-1) → (-1,-1)     (0,1) → (1,1)
(1,0)  → (1,-1)      (-1,0) → (-1,1)
   ... e as diagonais viram cardeais
```

Fora do isométrico é identidade. Sem isso, "para cima" no joystick não é "para cima na tela".
O sentido do sprite usa o **X de tela**: no isométrico, `movTelaX = dx - dy`.

**Cubra isso com teste unitário.**

## 4.6 Roda de habilidades

- **Recolhida (padrão)**: container **160×160 px**, botões **44×44 px** circulares num quarto de círculo,
  botão central **54×54 px** para a habilidade definitiva, **janela de 3 habilidades** com rotação circular.
- Setas **avançar** e **retroceder** o anel (a de avançar também aceita roda do mouse), e **expandir** para
  lista vertical.
- **Expandida**: lista rolável com contenção de overscroll.
- Botões com ícone e nome, indicação de **recarga** e de **recurso insuficiente**.
- Estado recolhido persistido.

## 4.7 Auto-alvo

Obrigatório no toque. Sem ele, mirar num alvo que se mexe é inviável com o dedo.

- Alternável e persistido, com **preferência**: mais próximo (padrão) ou menor HP.
- Ao escolher uma habilidade, seleciona o alvo dentro do alcance por distância **Chebyshev**.
- **Respeita `relacao()` e fogo amigo** — com fogo amigo ligado, nunca escolhe aliado.
- Com habilidade e alvo no alcance, **dispara sem passo intermediário**.
- Setas alternam alvo manualmente.

## 4.8 Demais controles e gestos

- **Botão de interação** contextual e **botão de ataque básico**.
- **Toque no mapa move até**, e **segurar** recalcula o caminho conforme o dedo se move.
- **Arrasto de câmera** com zona morta de **3 px** no toque (6 px no mouse); acima de 4 px, suprime o clique.
- **Pinça de zoom** ancorada, 0.3–3.0.
- **Faixa de controles** em três colunas: **38% / 24% / 38%** em paisagem, **35% / 30% / 35%** em retrato,
  readaptada em `resize` e `orientationchange` (+300 ms).
- **Botões flutuantes** no topo: HP e recurso (esquerda, sem captura de ponteiro), log, inventário,
  personagem (direita).
- **Vibração**: D-pad 18 ms · zoom e log 10 ms · ficha 12 ms · ação inválida `[50,30,50]` ·
  movimento esgotado `[100,50,100,50,100]`.
- Bloqueie: zoom por duplo toque, puxar-para-recarregar, seleção de texto, menu de contexto no toque longo,
  e o efeito elástico do iOS.
- Listener de `wheel` com `{ passive: false }`.

## 4.9 Viewport, área segura e energia

```html
<meta name="viewport"
      content="width=device-width, initial-scale=1, viewport-fit=cover,
               user-scalable=no, maximum-scale=1">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
```

- **`env(safe-area-inset-*)`** em todos os controles, cabeçalho e faixa inferior.
- A faixa de controles reserva **~160 px**; a câmera desconta essa altura (§2.4).
- **Paisagem e retrato** funcionam; paisagem é a preferida. Não trave a orientação no manifest; trave em
  tempo de execução ao entrar no jogo, destravando ao sair, e sugira girar com um aviso de 3 s.
- **Tela cheia** ao entrar, com falha silenciosa.
- **Wake Lock** ativo durante o jogo, com falha silenciosa. Sessão de arena é longa e a tela não pode apagar.
- Redimensionamento por `ResizeObserver` e `resize`, com **debounce de 150 ms**.

## 4.10 Desempenho

| Medida | Valor |
|---|---|
| **Teto de DPR** | 2 |
| **Presets de qualidade** | `mínimo` (sem atmosfera, profundidade, fatias de perna, polimento, luz) → `baixo` → `médio` → `alto` |
| **Padrão no toque, primeira execução** | `baixo` |
| **Degradação automática** | buffer circular de 240 frames; verificação a cada **5 s**; desce um nível com média **< 45 fps em duas verificações seguidas**; nunca sobe sozinho; avisa o jogador |
| **Atalho de sprite** | um desenho em vez das 18 fatias nas qualidades baixas |
| **Minimapa** | 333 ms no toque, 100 ms no desktop |
| **Aplicações gráficas simultâneas** | teto de 3, com fila |
| **Cache de retângulo do canvas** | 100 ms |
| **Leitura da altura da faixa de controles** | 1000 ms |
| **Animações decorativas de CSS** | desligadas nas qualidades baixas |
| **`prefers-reduced-motion`** | desliga tremor, flash, congelamento e soco de zoom |
| **Diagnóstico** | overlay com fps médio e p95, entidades e fase, atrás de flag, a 2 Hz |

Metas verificáveis por cena e hardware estão em §5.6: alvo 60 fps padrão e p95 ≤ 33,3 ms sob carga.
Não prometer mínimo absoluto em qualquer aparelho ou condição térmica.

## 4.11 Áudio no toque

- **Desbloqueio por gesto**: retry em `click`, `touchstart` e `keydown`; guarde a faixa pendente e tente ao
  primeiro gesto, com fade de 400 ms. Não ressuscite faixa se o jogo estiver pausado ou se ela foi parada.
- `html5: true` para faixas longas; Web Audio para efeitos locais (habilita pan). Pool HTML5 de 20.
- Pausar em `visibilitychange`, retomar ao voltar.

## 4.12 Arena no celular

A arena é o teste mais duro dos controles. O que a campanha perdoa, o PvP não.

- **Auto-alvo e multi-touch são obrigatórios** (§4.3, §4.7).
- **Telegrafia legível em tela pequena**: a barra de conjuração do oponente precisa ser visível no zoom
  padrão do celular.
- **Nunca espere o servidor para mover o personagem na tela** — a predição local é o que mantém o jogo
  respondendo sobre o atraso já inerente ao toque.
- **Não pausa** (§2.2): abrir inventário numa luta é decisão com risco, e precisa estar óbvio.
- **Reconexão amigável**: o celular suspende a aba o tempo todo. Ao voltar, tente reconectar e mostre o
  estado — reconectando, voltou, sala encerrada — em vez de cair para o menu.
- **Bateria e calor**: a degradação automática e o teto de DPR valem em dobro aqui.

## 4.13 Editor no toque

- **Um dedo pinta, dois dedos navegam.** Dois ponteiros sempre viram arrasto e pinça, **cancelando o traço
  em andamento** e removendo-o do histórico — nada de meio-traço.
- **Modo navegação explícito** para quem preferir separar.
- **Alvo de toque mínimo de 44 px** em toda a barra de ferramentas.
- **Zoom mínimo utilizável**: célula de edição com ao menos ~28–32 px por padrão no celular, com
  "ajustar à tela" a um toque.
- **Desfazer e refazer como botões de tela**; **rotação e espelho do pincel como botões**.
- **Paleta de peças** em gaveta rolável, com célula grande e seleção clara.
- **Toque longo na célula** abre o inspetor daquela célula.
- **`env(safe-area-inset-*)`** nas barras do editor.
- **Autosave do rascunho** por intervalo e em `visibilitychange`. O app é suspenso a qualquer momento, e
  perder uma fase por isso é inaceitável.
- **Confirmação** em redimensionar para menor, distribuir e excluir — e tudo continua desfazível.

---
---

# PARTE 5 — ENGENHARIA E QUALIDADE

## 5.1 Determinismo e testabilidade

O núcleo de simulação roda **sem DOM, sem requestAnimationFrame e sem rede**, com PRNG, relógio e entrada
injetáveis. Isso não é conveniência de teste: é o que torna a arena possível e o que permite reproduzir bugs.

**Harness de simulação iniciado na entrega 1 e ampliado em cada entrega:**

- Inicia o jogo com estado fixo, sem rede.
- Chama o tick real com `dt` fixo e PRNG semeado.
- **Valida invariantes a cada tick**: nada não finito em posição, HP ou recursos; entidade dentro do mapa;
  `hp <= hpMax`; fila de movimento dentro do limite; zero NaN em qualquer campo.
- Fornece `digest(entidades)` — estado canônico ordenado — para comparar duas execuções.
- Suporta clonar o estado e rodar dois "clientes" no mesmo processo.

Cobre: movimento e navegação, IA por centenas de ticks, combate, efeitos e expiração, armadilhas, loja,
invocações, morte, spawn e despawn, e determinismo por semente.

**O bot de jogabilidade vale mais que qualquer teste escrito depois.**

## 5.2 Testes

| Camada | Ferramenta | Cobre |
|---|---|---|
| Simulação | Vitest | Tick real com invariantes e digest (§5.1) |
| Unidade | Vitest | Funções puras: autotiling, transform D4, navegação, fórmulas, registro de efeitos, ferramentas do editor, remapeamento isométrico, clamp de ficha |
| Rede | Vitest + `TransporteLocal` + integração WSS | Servidor e até 10 clientes: predição, reconciliação, coleta concorrente, reconexão e restauração |
| Ponta a ponta | Playwright | Boot, fase real, combate, editor, e uma sessão de arena em loopback |

CI bloqueia PR em: typecheck, testes, build e smoke de ponta a ponta.

## 5.3 Regras de engenharia

1. **Passo fixo** sempre. `dt` limitado. Simulação separada de render.
2. **Colisão resolvida na integração**, não só ao enfileirar movimento.
3. **Navegação com mapa `veioDe`**, sem copiar caminho por expansão.
4. **Clone consciente do modelo** — nada de ida e volta por JSON em estado vivo.
5. **Uma fonte de verdade por dado.** Vale para rede e para estado local.
6. **Um dispatcher por tipo de efeito** (§2.8).
7. **Ciclo de vida explícito**: temporizadores rastreados e cancelados ao trocar de fase; recursos gráficos
   destruídos; filtros liberados.
8. **Teto de 800 linhas por arquivo**; sem globais; sem `any`.
9. **Escape de HTML por padrão** (§3.4).
10. **Nenhum segredo no código ou bundle.** Endpoint público por configuração; credenciais só no backend.
11. **Assets oficiais no build/origem do jogo.** Campanha offline sem serviço externo; arena usa backend
    e conteúdo temporário validado, sem hotlink arbitrário.
12. **Save gravado fora do tick**, nunca bloqueando o frame.

## 5.4 Acessibilidade

- Foco visível e navegação completa por teclado em todos os modais e painéis.
- `aria-live` no log de combate; `aria-label` em todos os controles.
- **`prefers-reduced-motion`** respeitado em todo o pipeline de efeitos — o jogo tem onda de choque, floração
  e flashes.
- **Escala de fonte e de interface** ajustável, que também serve ao celular.
- Contraste suficiente nas barras de HP e marcadores de equipe.

## 5.5 Internacionalização

Strings fora do código, num dicionário, desde o começo. pt-BR é o idioma padrão. Extrair depois custa caro.

## 5.6 Matriz mensurável de qualidade, rede e justiça (v4.0)

Metas abaixo são critérios a validar no protótipo, não resultados medidos.

### Hardware e cenas

- Android: **Galaxy A54, 8 GB**, Chrome estável; iOS: **iPhone 12, 4 GB**, Safari estável. Registrar
  versão exata de SO/navegador, resolução, DPR e temperatura. Se indisponíveis, documentar substituto
  de capacidade semelhante antes dos benchmarks e congelar matriz até lançamento.
- Desktop: CPU de quatro núcleos, 8 GB, GPU integrada, 1920×1080; registrar modelo real.
- Backend inicial de benchmark: **2 vCPU, 4 GB RAM**, uma sala; medir antes de aumentar salas por processo.
- Cena padrão: mapa 60×40, 10 jogadores, 20 NPCs ativos, 10 projéteis e 10 invocações.
- Cena de carga: mapa 120×120, 10 jogadores, 60 NPCs, 20 invocações, 10 avatares, 30 armadilhas e
  100 projéteis; pelo menos 20 NPCs visíveis por cliente. Estes são limites iniciais globais de sala;
  por jogador: 2 invocações, 1 avatar, 3 armadilhas. Rejeitar criação excedente antes de cobrar recurso,
  ou executar substituição explicitamente configurada em dados.
- Cada cena roda **30 minutos**, com semente/roteiro fixos, combate, coleta, entrada e reconexão.

### Metas

| Medida | Critério inicial |
|---|---|
| Frame padrão, qualidade baixa mobile | Alvo 60 fps; p95 ≤ 20 ms, p99 ≤ 33,3 ms |
| Frame na cena de carga | p95 ≤ 33,3 ms; reportar p99 e pausas acima de 100 ms |
| Tick do servidor | p95 ≤ 8 ms, p99 ≤ 16,7 ms; sem backlog crescente |
| Memória após 10 trocas de fase | Sem crescimento monotônico de recursos retidos; baseline estabilizado em até +10%, GC comparável quando disponível |
| Banda média por cliente sob carga | Recebida ≤ 100 KiB/s; enviada ≤ 10 KiB/s; excluir pacote inicial de conteúdo |
| Correção lógica, perfil suportado | p95 ≤ 0,25 célula; p99 ≤ 1 célula; teleporte contado separadamente |
| Reconexão após rede disponível | Estado/controle em ≤ 5 s, dentro da janela reservada |
| Coleta/economia | Zero duplicação, saldo negativo, recompensa repetida ou ressurgimento indevido |
| Aviso ofensivo | ≥ 200 ms úteis no perfil suportado, por habilidade |

Perfil **suportado**: RTT até **150 ms**, jitter até **±30 ms**, perda de pacotes **1%**.
Perfil **degradado**: RTT **250 ms**, jitter **±80 ms**, perda **3%**; preservar integridade,
autoridade e reconexão, com aviso, sem exigir mesma qualidade competitiva. Simular condições no
transporte WSS real, incluindo bloqueio por retransmissão TCP, além do TransporteLocal.

### Cenários de aceite

- Dez clientes automatizados para carga; dois celulares físicos em redes distintas para rede/multi-touch;
  sessão de dez jogadores humanos para experiência. Mouse em emulação não comprova dois dedos reais.
- Mesmo comando/condição recebe mesma validação sem prioridade por criador ou ordem de entrada.
  Inverter criador, slot/equipe e repetir ataques simultâneos com RTT igual; investigar assimetria.
- Esquiva e interrupção sob RTT 30, 80 e 150 ms; registrar janela efetiva de aviso.
- Digest público comparado no mesmo tick/revisão; excluir render e campos privados. Ressincronização
  converge sem fazer objeto consumido ressurgir.
- Dez coletas simultâneas do mesmo objeto dão uma transferência. Repetir com reenvios, morte,
  reconexão e queda do processo. Loot individual entregue uma vez por elegível.
- Checkpoint restaura PRNG, timers, ações, inventários e deduplicação; rejeita época anterior.
- Registrar `docs/BENCHMARKS.md` com hardware, versões, histogramas, cena e resultado. Otimizar ou
  reduzir efeitos/carga antes de declarar aceite; não trocar meta silenciosamente.

## 5.7 Experiência da primeira versão jogável (v4.0)

Testar com ao menos cinco pessoas externas à implementação, três no celular. Pelo menos quatro
devem concluir o primeiro encontro e reconhecer os três avisos de ataque sem ajuda verbal. Registrar
tempo até primeira luta, mortes, uso de habilidades, compreensão de drop/equipamento e retorno ao
combate. Demonstrar o ciclo lutar → recompensa → melhorar personagem → lutar novamente. Ajustar
câmera, tamanho de controles, telegrafia e ritmo pelos resultados; bots não substituem entendimento humano.

---
---

# PARTE 6 — CONSTRUÇÃO

## 6.1 Ordem (v4.0)

Começar com versão pequena que represente campanha, arena e editor; validar rede antes de expandir
todo catálogo. É marco intermediário, não corte de escopo da v1. Harness, mobile, diagnóstico e
rebalanceamento em dados começam cedo, com passada final após integrar os modos.

### Primeira versão jogável

| # | Entrega | Pronto quando |
|---|---|---|
| 1 | Motor TS estrito, passo fixo, PRNG, comandos, harness e CI | Mesmo núcleo no navegador/Node sem DOM; invariantes exercitadas |
| 2 | Uma fase, movimento Dir8/cardinal, colisão, câmera e controles mobile | Mover/atacar com dois dedos em aparelho físico e com mouse em emulação |
| 3 | Básico, quatro habilidades (projétil, área, cura, controle), três arquétipos e boss | Combate legível; crítico zero, defesa, interrupção e telegráficos corretos |
| 4 | Livre loopback, orçamento de ficha, NPCs, loot e reconciliação | Dois clientes lutam/coletam sem duplicar; movimento contínuo permite correção |
| 5 | Backend Colyseus/WSS, sala por código, patches e reconexão | Dois celulares em redes distintas; criador sai sem encerrar; carga com 10 clientes |
| 6 | Recompensa/equipamento, save básico, editor mínimo (piso, parede, spawn, inimigo, testar/exportar) | Criar mapa no celular e completar lutar → melhorar → lutar |
| 7 | Testes humanos, rede suportada/degradada, carga inicial | §5.7 atendido; riscos de conectividade/combate resolvidos antes da expansão |

Loopback antecede rede real, mas rede real antecede todos os efeitos/filtros/modos. Qualidade mínima,
PWA e medição mobile entram já na primeira versão, não apenas ao finalizar o projeto.

### Expansão da campanha/conteúdo

| # | Entrega | Pronto quando |
|---|---|---|
| 8A | 26 tipos, normalização/dispatcher, durações/recargas | Todos efeitos exercitados; registro aparece em editor/orbes |
| 9A | Inventário, 10 slots, consumíveis, economia, baús, loja, orbes e spawner | Equipar independente da ordem; ciclo econômico íntegro |
| 10A | Progressão 1–20, descanso/morte, procedural, portas, invocações, avatares/dominação | Campanha completa com save/migrações e offline |
| 11A | Editor completo e toque, tileset, validação, histórico e aprendizado de estilo | Criar/testar/exportar/importar aventura de 2 fases no celular |

### Expansão/operação da arena

| # | Entrega | Pronto quando |
|---|---|---|
| 8B | Livre para 10, replicação completa, conteúdo temporário, limites e métricas | Estado público/privado correto, NPCs/objetos convergentes |
| 9B | Checkpoints externos, restauração, sessão e deduplicação | Queda recuperada ou encerrada claramente; sem duplicação |
| 10B | Duelo presets, Equipes, Horda básica com ondas/loot individual e Rei da colina | Regras em dados, testadas sem condicionais espalhados |
| 11B | Justiça de telegrafia, perfis de rede, região e operação | Critérios §5.6 cumpridos, sessão real de 10 humanos validada |

### Convergência

| # | Entrega | Pronto quando |
|---|---|---|
| 12 | Áudio, HUD, minimapa, guia, efeitos e acessibilidade | Ameaças legíveis; efeitos visuais não mudam gameplay |
| 13 | Isométrico e caminhada por fatias | Alternar visão preserva velocidade, alcance e regras |
| 14 | Rebalanceamento final por modo e revisão da experiência | Ritmo/janelas de reação validados; fichas legais com acesso simétrico |
| 15 | Endurecimento mobile/PWA/backend e aceite | Offline, 30 minutos com 10 jogadores, benchmarks e recuperação verificados |

Ramos podem evoluir simultaneamente após marco 7, com contratos versionados. Servidor dedicado integra
v1; números das metas devem ser medidos antes de inferir capacidade/custo de produção.

## 6.2 Critérios de aceite

1. **Funcional**: cada sistema da Parte 2 existe e se comporta com os valores especificados.
2. **Mobile**: jogável do início ao fim no celular, em retrato e paisagem, com **multi-touch** (mover e
   atacar ao mesmo tempo), sem zoom acidental, sem controle sob a área segura, sem a tela apagando.
3. **Emulação**: 100% jogável no modo de dispositivo do navegador, só com o mouse.
4. **Desempenho**: matriz de §5.6 cumprida e registrada, incluindo p95/p99, memória após 10 trocas,
   hardware, versões, tick e banda. Não declarar aceite só com fps médio.
5. **Offline**: depois da primeira visita, a campanha abre e roda em modo avião.
6. **Determinismo**: a suíte de simulação roda o tick real com semente fixa e produz o mesmo digest.
7. **Hostilidade**: nenhuma decisão de hostilidade, mira, IA, efeito ou XP consulta `tipo` de entidade.
   Verificável por busca e por teste: dois jogadores em equipes opostas se atacam sem mudar código.
8. **Combate legível**: preparação visível e conjuração interrompível; projétil lançado segue §2.7.
   Aviso útil ≥ 200 ms no perfil suportado; interface não pausa arena.
9. **Arena em loopback**: modos, equipes, placar, respawn, fim e clamp rodam e são testados sem rede.
10. **Arena em rede**: Livre com **10 jogadores humanos**, dois celulares em redes distintas, **30 minutos**;
    carga adicional de 10 clientes automatizados. Entrada, saída, reconexão/suspensão e correções cumprem
    §5.6. Criador sai sem encerrar ou transferir autoridade.
11. **Ficha justa**: servidor fornece prévia antes da entrada; save adulterado não excede orçamento;
    opções legais com acesso simétrico; Duelo presets. HP/bônus do cliente não são confiados.
12. **Isolamento**: uma sessão de arena não escreve nada no save de campanha.
13. **Editor**: um jogador cria uma aventura de 2 fases **inteiramente no celular**, testa, salva, exporta e
    importa num dispositivo limpo. Conteúdo inválido é recusado com mensagem na célula, nunca quebra o jogo.
    Abrir o editor não pesa no boot e o rascunho sobrevive ao app ser suspenso.
14. **Conteúdo**: fases e catálogos oficiais validam contra os schemas em CI.
15. **Qualidade**: typecheck estrito sem erro, sem `any`, lint limpo, CI verde, nenhum arquivo acima de
    800 linhas.
16. **Acessibilidade**: navegação por teclado em todos os modais, `aria-live` no log,
    `prefers-reduced-motion` respeitado, escala de interface funcionando.

17. **NPCs/objetos**: uma autoridade, IDs/revisões convergentes; dez coletas simultâneas resultam em uma
    transferência, incluindo reenvios, reconexão e morte. Loot individual entregue uma vez por elegível.
18. **Recuperação**: checkpoint completo, nova época e rejeição de mensagens antigas; aviso de rollback
    limitado conforme §3.6 ou encerramento claro quando não recuperável.
19. **Experiência inicial**: três ameaças reconhecíveis, multi-touch físico e ciclo de recompensa validado
    conforme §5.7; primeira versão pequena concluída antes de expandir sistemas.
20. **Operação**: limites de mensagens/conteúdo/carga, métricas, custo estimado por benchmark,
    expiração de assets temporários e nenhum segredo no cliente.

## 6.3 Convenções

- Código, commits e documentação em **pt-BR**.
- Todo arquivo de documentação carrega **versão e data**, e cada alteração registra a versão em que foi feita.
- Alterações significativas em código levam comentário com a **data** no ponto alterado.
- `docs/DECISOES.md` registra toda divergência em relação a este documento, com justificativa.

---
---

# PARTE 7 — BACKLOG PÓS-V1

Nada aqui entra na v1. São extensões que o motor já suporta e que valem a pena quando a base estiver de pé.

| Item | Descrição | Custo |
|---|---|---|
| **Variedade de bosses** | `boss_bruto` (lento, empurrão em área), `boss_invocador`, `boss_veloz` (avanço). Só presets e habilidades, sem sistema novo | baixo |
| **Ondas avançadas de campanha** | Horda básica já integra v1; adicionar gatilhos de sala, modificadores e recompensas especiais na campanha | médio |
| **Loja itinerante** | Loja que aparece em fases diferentes a cada N minutos, incentivando revisitar | baixo |
| **Espectador** | A fila de comandos e o snapshot já permitem; falta interface e câmera livre | médio |
| **Replay do jogador** | Comandos, versão de conteúdo, eventos de sessão e checkpoints de diagnóstico, com interface de reprodução | médio |
| **Remapeamento de teclas e gamepad** | O modelo de entrada (vetor analógico + botões) já está pronto para isso | baixo |
| **Ranking/progressão de arena** | Servidor já existe; adicionar contas, persistência confiável, journal e temporadas, sem confiar em save local | alto |
| **Recuperação sem perda** | Journal durável, replay até último tick confirmado e infraestrutura de failover | alto |

---

## Referências técnicas da revisão

- [Colyseus: estado](https://docs.colyseus.io/state) — autoridade, snapshot na entrada e patches.
- [Colyseus: reconexão](https://docs.colyseus.io/room/reconnection) — recuperação de conexão; checkpoint
  durável do processo continua sendo responsabilidade do projeto.
- [Gambetta: predição/reconciliação](https://www.gabrielgambetta.com/client-side-prediction-server-reconciliation.html)
  — confirmação por sequência e reaplicação de comandos pendentes.
- [Photon: comparação de topologias](https://doc.photonengine.com/fusion/v2/fusion-choose)
  — referência conceitual de host e autoridade; Photon não é dependência da stack escolhida.

Metas, limites e políticas novos são decisões desta revisão a validar na construção.

*Fim do documento — v4.0, 12/10/2026.*
