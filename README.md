# Dungeons Arena: RPG de ação em tempo real

**Versão do documento:** 2.8 · **Data:** 15/10/2026
**Status:** 🚧 Em construção. Marcos 1–6 concluídos e validados em aparelho real; 8A, 9A e 10A concluídos: campanha completa, com 26 efeitos, economia, fases geradas sem fim, invocações e save com migrações. Arena online na AWS em São Paulo. Convergência concluída (12 a 16): habilidades, dificuldade, campanha em grupo, ritmo calibrado por simulação e endurecimento. Marco 17: conta Google, progresso na nuvem e o personagem da campanha na arena

> **Histórico**
> - **2.8 (15/10/2026)**: marco 17 (conta Google e progresso na nuvem, certificado do personagem, a campanha na arena com faixas e recompensas, equipamento gerado por nível e atributos com mais efeito; D-063) e o 11A redefinido (D-064).
> - **2.7 (15/10/2026)**: marco 16 fechado com o teste de 10 min na VM (10/10 metas, memória estável, sem reinício).
> - **2.6 (15/10/2026)**: marcos 15 e 16 concluídos (dificuldade, campanha em grupo até 6, simulador de balanceamento e ritmo calibrado; celular, PWA offline testado, benchmarks do cliente, limites e métricas do servidor; D-061, D-062).
> - **2.5 (15/10/2026)**: ajustes depois do marco 14 (andar conjurando por habilidade, tempo mínimo na zona de atenção, d20 visível, teclado numérico, área orgânica; D-060).
> - **2.4 (15/10/2026)**: marco 14 concluído (classes, ranks e caminhos, elementos e sinergias, orçamento de poder, livros, habilidades geradas e efeitos legíveis; D-059).
> - **2.3 (14/10/2026)**: marco 13 concluído (visão isométrica com a tecla V, modelos de criatura gerados no build, caminhada por fatias e personagem por imagem; D-058).
> - **2.2 (14/10/2026)**: novo marco 14, sistema de habilidades (composição, elementos, ranks, árvores, classes, livros, habilidades geradas e efeitos legíveis); rebalanceamento vira 15 e endurecimento, 16 (D-057).
> - **2.1 (14/10/2026)**: marco 12 concluído (áudio sintetizado, minimapa, pausa, configurações, guia, efeitos visuais como dado, qualidade e acessibilidade).
> - **2.0 (14/10/2026)**: roteiro reescrito para a convergência (12 → 15 antes de 11A e da arena), um PR por marco e as sugestões de capacidades adotadas (D-055).
> - **1.9 (14/10/2026)**: marco 10A concluído (invocações completas, avatares e dominação; pergaminhos de invocação).
> - **1.8 (14/10/2026)**: marco 10A-2 (fases geradas sem fim, penalidade de morte, descanso e regeneração por célula).
> - **1.7 (14/10/2026)**: marco 10A-1 (portas, troca de fase e a fase 2, Catacumbas).
> - **1.6 (14/10/2026)**: marco 9A concluído (spawner dinâmico e armadilhas de fase).
> - **1.5 (14/10/2026)**: marco 9A-1 (ouro, loja, baús, loot, atalhos de consumível e ordenação da mochila).
> - **1.4 (14/10/2026)**: marco 8A concluído (26 efeitos; invocação, dominação, armadilhas, rastros e efeito atrasado).
> - **1.3 (14/10/2026)**: marco 8A-1 (registro de efeitos, dispatcher único, orbes de efeito, efeitos nos inimigos e no editor).
> - **1.2 (13/10/2026)**: marco 7B (perfis de rede sobre WSS, arena-02 como cena padrão, métricas do servidor no /saude, aviso de conexão instável).
> - **1.1 (13/10/2026)**: marcos 5 e 6 validados no celular; marco 7A (teste com pessoas: medidas, questionário e envio anônimo).
> - **1.0 (13/10/2026)**: marco 6 (itens, equipamento, nível, mochila, save em slots e editor de fases); como jogar e controles atualizados.
> - **0.10 (13/10/2026)**: IP estático na VM da arena; carga contra a VM registrada.
> - **0.9 (13/10/2026)**: Etapa 4 concluída na AWS Lightsail São Paulo (D-038); hospedagem do servidor deixa de ser gratuita.
> - **0.8 (13/10/2026)**: marco 5A (servidor Colyseus, sala por código, patches, reconexão, Docker, deploy); menu inicial.
> - **0.7 (13/10/2026)**: marco 4 concluído; demonstração da arena em loopback.
> - **0.6 (13/10/2026)**: marco 4A (modo Livre, ficha justa, orbes, fase de arena).
> - **0.5 (13/10/2026)**: marco 3 concluído (IA, arquétipos, boss e encontros da fase 1).
> - **0.4 (13/10/2026)**: marco 2 concluído; marco 3A (combate) em revisão; controles de combate.
> - **0.3 (13/10/2026)**: marco 1 concluído; marco 2 em revisão; controles do jogo.
> - **0.2 (13/10/2026)**: nome do repositório, link do Pages, comandos da Etapa 1 e Etapa 0 concluída.
> - **0.1 (12/10/2026)**: README inicial, com visão, hospedagem gratuita e roteiro de construção.

RPG de ação top-down e isométrico para navegador. O jogador controla um personagem com ficha de RPG
completa (atributos, nível, habilidades, equipamento) e enfrenta enxames de inimigos em fases conectadas
por portas. O combate acontece em tempo real: você se posiciona, escolhe o alvo e conjura, e a rolagem de
dados resolve o dano sem parar o jogo.

- **Campanha**: solo e offline, com progressão por fases, loot, economia e bosses.
- **Arena**: até 10 jogadores por sala num servidor autoritativo. O **modo Livre** é o coração do jogo:
  você entra e sai quando quiser.
- **Editor de fases**: dentro do jogo, para criar, testar e compartilhar fases e aventuras.
- **Mobile é plataforma primária**: controles de toque completos e multi-touch.

A especificação completa fica em [`docs/PROMPT-PROJETO-v4.0.md`](docs/PROMPT-PROJETO-v4.0.md).
Divergências em relação a ela são registradas em [`docs/DECISOES.md`](docs/DECISOES.md).

---

## Como jogar e rodar

| Onde | Como | Disponível a partir de |
|---|---|---|
| **Navegador (nuvem)** | <https://brun-after.github.io/Dungeons-Arena/> — menu: campanha, arena online e treino | Etapa 1 (tela inicial); Etapa 2 (jogável) |
| **Arena de treino** | <https://brun-after.github.io/Dungeons-Arena/?arena=loopback&latencia=80> — você contra um bot, com sala e rede simuladas na página (`latencia`, `jitter` e `perda` na URL) | Marco 4 |
| **Arena online** | Menu → **Arena online** → *Criar sala* (mostra um código) ou *Entrar com código* | Marco 5 (no ar em `wss://dungeons-bruno.duckdns.org`) |
| **Local: cliente** | `npm install` e `npm run dev`, depois abrir `http://localhost:5173` | Etapa 1 |
| **Local: servidor da arena** | `npm run dev:server` (sobe em `ws://localhost:2567`); com ele rodando, a arena online de `localhost` já funciona | Marco 5 |
| **Local: celular no mesmo Wi-Fi** | `npm run dev -- --host` e abrir no celular `http://IP-DO-PC:5173/?arena=online&servidor=ws://IP-DO-PC:2567` | Marco 5 |
| **Local: stack completa** | `docker compose up --build` (servidor e Redis; o Caddy só na VM) | Marco 5 |
| **Teste de carga** | `npm run carga -- --url ws://localhost:2567 --clientes 10 --segundos 60`; com `--perfil suportado` ou `--perfil degradado` (rede simulada sobre o WSS real), `--fase arena-02` (cena padrão 60×40) e `--modo grupo` (campanha em grupo, até 6) | Marcos 5, 7 e 16 |
| **Campanha e save** | Menu → **Campanha** → escolha um slot (1–3). Salva sozinho; **Menu** no cabeçalho salva e sai; **Exportar/Importar** levam o save para outro aparelho | Marco 6 |
| **Dificuldade** | Na tela de slots, o seletor de cada slot (Fácil, Normal, Difícil, Pesadelo); na pausa, troca a qualquer momento. O personagem é o mesmo em qualquer uma | Marco 15 |
| **Campanha em grupo** | Tela de slots → **Jogar em grupo** (no slot com personagem) mostra um código; os outros (até 6) digitam o código no próprio slot e **Entrar no grupo**. Cada um joga com o seu personagem, que volta para o slot dele; a fase avança quando todos os vivos estão na saída | Marco 15 |
| **Conta e nuvem** | Tela de slots → **Entrar com Google**; em cada slot, **Enviar para a nuvem** e **Baixar da nuvem**. Jogar sem conta continua igual; salvar pelo menu e sair do grupo ou da arena enviam sozinhos quando há conta | Marco 17 |
| **Arena com o seu personagem** | Menu → **Arena online** → escolha o slot (o primeiro já vem escolhido) → criar sala ou entrar numa sala da sua faixa. O servidor confere o personagem; ele entra inteiro, ganha XP, ouro e itens, e **Salvar e sair** grava no slot | Marco 17 |
| **Balanceamento** | `npm run balancear` (tabela das metas do ritmo); `-- --registrar` grava [`docs/BALANCEAMENTO.md`](docs/BALANCEAMENTO.md) | Marco 15 |
| **Benchmarks do cliente** | `?bench=carga` ou `?bench=padrao` no navegador (o resultado aparece na tela; `&qualidade=baixo` e `&segundos=60` opcionais); `npm run bench` roda tudo e grava em `docs/BENCHMARKS.md` | Marco 16 |
| **Teste com pessoas** | Link <https://brun-after.github.io/Dungeons-Arena/?pesquisa=1>; roteiro e resumo em [`docs/TESTES-HUMANOS.md`](docs/TESTES-HUMANOS.md) | Marco 7 |
| **Editor de fases** | Menu → **Editor de fases** (ou `?editor`): crie, pinte, ponha inimigos, **Testar** com o seu personagem, **Exportar** o `.json`. Para jogar valendo: Campanha → slot vazio → escolha a fase | Marco 6 |
| **Local: verificação completa** | `npm run verificar` (typecheck, lint, testes e build) | Etapa 1 |
| **Testes** | `npm test` (unidade, simulação, rede e integração com o servidor), `npm run test:e2e` (Playwright) | Etapa 1 |
| **Offline** | Depois da primeira visita, a campanha abre em modo avião (PWA) | Etapa 2 |

Requisitos locais: **Node.js 24 LTS**, **Git**; **Docker Desktop** é opcional (só para `docker compose`).
Implantação do servidor na nuvem, passo a passo: [`docs/IMPLANTACAO.md`](docs/IMPLANTACAO.md).

### Controles

| Ação | Teclado e mouse | Toque |
|---|---|---|
| Mover | WASD ou setas (diagonal = duas teclas) | Joystick ou direcional (troca no cabeçalho) |
| Ir até um ponto | Clique no mapa | Toque no mapa; segure para seguir o dedo |
| Selecionar alvo | Clique no inimigo (`Esc` limpa) | Toque no inimigo |
| Ataque básico | Espaço; ataca sozinho o alvo selecionado ou quem estiver te perseguindo | Botão ⚔ (funciona junto com o joystick) |
| Habilidades | Teclas 1–4 (também no teclado numérico) | Roda de botões em volta do ⚔ |
| Mover a câmera | Arrastar o mapa | Arrastar o mapa |
| Zoom | Roda do mouse | Pinça com dois dedos |
| Visão (de cima ou isométrica) | `V`, ou Pausa → Configurações → Gráficos | Pausa → Configurações → Gráficos |
| Seu personagem por imagem | Pausa → Configurações → Aparência | Idem |
| Ranks, caminhos e teclas das habilidades | Mochila (`I`) → aba **Habilidades** | Idem |
| O que um efeito faz | Passe o mouse (ou o foco) no ícone do efeito, ao lado da vida | Toque no ícone |
| Ver as células exatas das áreas | Pausa → Configurações → Gráficos → Mostrar a área exata | Idem |
| Mochila e ficha | `I` (Esc fecha); equipar, usar e tirar por botão | 🎒 no cabeçalho; tocar a linha equipa ou usa |
| Pontos de atributo | Mochila → aba **Ficha** → `+` | Idem |
| Diagnóstico (fps, célula) | Abrir com `?diag=1` no fim do endereço | Idem |

### Os inimigos da fase 1

Cada inimigo tem o seu modelo (desde o marco 13); o anel sob os pés mostra a equipe. Se um modelo faltar, aparece a
forma do arquétipo.

| Modelo (forma substituta) | Arquétipo | Como luta |
|---|---|---|
| Goblin, orc (▲ triângulo) | Perseguidor | Corre até você e golpeia de perto |
| Esqueleto (◆ losango) | Atirador | Mantém distância e atira flechas; recua se você encostar |
| Cultista (⬢ hexágono) | Controlador | Marca uma área 3×3 no chão; saia antes de encher |
| Demônio (● com coroa) | Boss | Alterna golpe forte e área |

"?" sobre o inimigo: ele notou você e está hesitando. "!": começou a perseguir.

---

## Hospedagem

| Peça | Serviço | Custo |
|---|---|---|
| Código, CI e revisão | GitHub (repositório público) + GitHub Actions | US$ 0 |
| Cliente (campanha, editor, PWA) | GitHub Pages | US$ 0 |
| Servidor da arena (Node.js + Colyseus) | VM **AWS Lightsail** em São Paulo (2 vCPU / 1 GB) com Docker Compose | **US$ 7/mês**, pagos com créditos da AWS (D-038) |
| Checkpoints da arena | Redis no mesmo Docker Compose (processo separado do servidor) | US$ 0 |
| HTTPS / WSS | Caddy (certificado Let's Encrypt automático) + subdomínio DuckDNS | US$ 0 |
| Imagem do servidor | GitHub Container Registry (GHCR) | US$ 0 |

A campanha e o editor não dependem do servidor. Só a arena precisa dele.
Só o servidor da arena tem custo; o resto é gratuito. O controle de gastos é pelos créditos e pelos alertas do AWS
Budgets. A Oracle *Always Free* (sem custo, mas sem capacidade em São Paulo em 13/10/2026) e o Render (Virgínia,
reserva manual) ficam como alternativas em [`docs/IMPLANTACAO.md`](docs/IMPLANTACAO.md).

---

## Stack

TypeScript estrito · Vite · PixiJS v8 · GSAP · Howler · DOM + CSS para a interface · IndexedDB para o save ·
Node.js + Colyseus no backend da arena · WSS · Vitest + Playwright.

---

## Roteiro

Cada marco vira **um** Pull Request (a partir do 12, sem subdivisões). O CI (typecheck, lint, testes, build e
smoke) precisa passar antes do merge em `main`, e o merge publica automaticamente.

**Ordem atual** (D-055, D-057): **15 → 16**, depois **11A**, depois a arena (**8B → 9B → 10B → 11B**). A sessão com
pessoas (7C) entra quando houver testadores.

### Etapas de infraestrutura

- [x] **Etapa 0**: conta no GitHub, ferramentas instaladas, repositório criado com este README
- [x] **Etapa 1**: fundação do projeto, CI e deploy no GitHub Pages
- [x] **Etapa 4**: VM (AWS Lightsail São Paulo), DuckDNS e segredos de deploy configurados ([guia](docs/IMPLANTACAO.md))

### Primeira versão jogável

| ✓ | # | Entrega | Pronto quando |
|---|---|---|---|
| [x] | 1 | Motor TS estrito, passo fixo, PRNG, comandos, harness e CI | O mesmo núcleo roda no navegador e no Node, sem DOM, com as invariantes exercitadas |
| [x] | 2 | Uma fase, movimento Dir8/cardinal, colisão, câmera e controles mobile | Dá para mover e atacar com dois dedos no celular e com o mouse em emulação |
| [x] | 3 | Ataque básico, 4 habilidades, 3 arquétipos de IA e boss | Combate legível: crítico zero, defesa, interrupção e telegrafia corretos |
| [x] | 4 | Arena Livre em loopback, orçamento de ficha, NPCs, loot e reconciliação | Dois clientes lutam e coletam sem duplicar itens |
| [x] | 5 | Backend Colyseus/WSS, sala por código, patches e reconexão | Dois celulares em redes distintas; o criador sai e a sala continua; carga com 10 clientes |
| [x] | 6 | Recompensa/equipamento, save básico e editor mínimo | Criar um mapa no celular e completar o ciclo lutar → melhorar → lutar |
| [ ] | 7 | Testes humanos, rede suportada/degradada e carga inicial (7A ecossistema do teste ✓ · 7B rede e carga ✓ · 7C sessão com pessoas, adiada) | Critérios da §5.7 atendidos |

### Expansão da campanha e do conteúdo

| ✓ | # | Entrega | Pronto quando |
|---|---|---|---|
| [x] | 8A | 26 tipos de efeito, normalização e dispatcher | Todos os efeitos exercitados; o registro aparece no editor e nos orbes |
| [x] | 9A | Inventário, 10 slots, economia, baús, loja, orbes e spawner | A ordem de equipar não altera o resultado; ciclo econômico íntegro |
| [x] | 10A | Progressão 1–20, morte, geração procedural, portas, invocações e avatares | Campanha completa, com save, migrações e modo offline |
| [ ] | 11A | Editor completo no toque (baú, loja, armadilha, portas e loot), aventura de 2+ fases, tileset por imagem, aprendizado de estilo por aparelho, a aparência das habilidades refinada e trilhas variadas entre casual e dark fantasy (D-064) | Aventura de 2 fases criada e testada no celular |

### Expansão e operação da arena

| ✓ | # | Entrega | Pronto quando |
|---|---|---|---|
| [ ] | 8B | Livre para 10 jogadores, replicação completa (estado privado), conteúdo temporário (personagens e tilesets próprios na sala), limites e métricas | Estado público e privado correto; NPCs e objetos convergentes; quatro jogadores com personagens diferentes se veem corretamente |
| [ ] | 9B | Checkpoints externos, restauração e deduplicação | Queda do servidor recuperada ou encerrada com aviso, sem duplicação |
| [ ] | 10B | Duelo, Equipes, Horda e Rei da colina | Regras em dados e testadas, sem condicionais espalhados |
| [ ] | 11B | Justiça de telegrafia, perfis de rede e operação | Critérios da §5.6 cumpridos; sessão real com 10 pessoas |

### Convergência

| ✓ | # | Entrega | Pronto quando |
|---|---|---|---|
| [x] | 12 | **Áudio** sintetizado (música por contexto, efeitos, som posicional, passos); **interface** (minimapa, prompt de interação, pausa, configurações, guia, menu com fundo); **efeitos visuais** como dado por habilidade (partículas, presets de impacto, efeitos persistentes, luz, enquadrar dois); **qualidade** (presets, degradação automática, teto de DPR) e **acessibilidade** (escala de interface, teclado, contraste) | Ameaças legíveis; o mesmo digest com e sem efeitos; nunca mudo; movimento reduzido respeitado |
| [x] | 13 | Visão **isométrica**; **modelos de criatura** gerados no build; **caminhada por fatias**; **personagem por imagem** (recorte, escala, substituto, legibilidade) | Alternar a visão preserva velocidade, alcance e regras; imagem inválida não quebra o jogo |
| [x] | 14 | **Sistema de habilidades**: composição em camadas (efeito, forma, tempo, custo, tema, apresentação); formas linha, cone e ao redor; alvos aliado, todos os aliados e área livre; escudo, puxão e troca de lugar; **5 elementos** com estados e sinergias; interações em tabela (acúmulo, sinergia, resistência, teto); **orçamento de poder**; **ranks** por nível; **árvores de evolução** e modificadores; **classes** (guerreiro, mago, arqueiro) com afinidades; **livros de habilidade**; **habilidades geradas por semente** (inimigos e livros); **passivas**; barra escolhida e roda de habilidades; **efeitos legíveis** (duração, cartão e descrição gerada) | Uma habilidade nova nasce de dados e cabe no orçamento; o jogador entende o que está ativo e o que faz; inimigos das fases geradas com repertório próprio; mesmo digest com as mesmas sementes |
| [x] | 15 | Ferramenta de **balanceamento por simulação** (tempo para matar por classe, rank e evolução, curva das fases, fluxo de ouro, invocações, margem de aviso do corpo a corpo) e ajuste dos números da campanha e do Livre; **dificuldade** em 4 níveis com o mesmo personagem; **campanha em grupo** online até 6, com escala pelo tamanho do grupo; inimigo cresce com o nível | Ritmo e janelas de reação validados na campanha e no Livre (69/69 metas). *Fichas justas por modo de arena: depois do 10B* |
| [x] | 17 | **Conta Google** e **progresso na nuvem** (Supabase econômico), **certificado do personagem** (editar o arquivo não upa), **o personagem da campanha na arena** com faixas de nível e recompensas (XP, ouro e itens, com antifarm), **equipamento gerado por nível** e **atributos com mais efeito** | Quem upou bem vence na arena (simulador); arquivo editado entra como ficha de treino; jogar local não depende da nuvem |
| [x] | 16 | Celular (área segura, orientação, redimensionamento), **PWA offline** testado, desempenho e memória (trocas de fase, cena de carga, `BENCHMARKS.md`) e servidor (limites, métricas, teste de 10 min na VM) | Offline e benchmarks verificados; teste de 10 min na VM com 10 bots: 10/10 metas, memória estável e sem reinício. *Recuperação de queda: depois do 9B; sessão real de 10 pessoas: no 11B* |

---

## Convenções

- Código, commits e documentação em **pt-BR**.
- TypeScript com `strict: true` e **sem `any`**; nenhum arquivo acima de **800 linhas**; sem variáveis globais.
- Todo documento leva **versão e data**; alterações significativas no código levam comentário com a data.
- Números de balanceamento ficam em `src/data/balance.json`, nunca espalhados pelo código.
- Nenhum segredo no código nem no bundle do cliente.
- Toda divergência em relação à especificação vai para `docs/DECISOES.md`, com justificativa.
