# Dungeons Arena: RPG de ação em tempo real

**Versão do documento:** 1.6 · **Data:** 14/10/2026
**Status:** 🚧 Em construção. Marcos 1–6 concluídos e validados em aparelho real: campanha com itens, nível e save, arena online na AWS em São Paulo e editor de fases mínimo. Marco 7 em andamento: o ecossistema do teste com pessoas está pronto; a sessão fica para depois

> **Histórico**
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
| **Teste de carga** | `npm run carga -- --url ws://localhost:2567 --clientes 10 --segundos 60`; com `--perfil suportado` ou `--perfil degradado` (rede simulada sobre o WSS real) e `--fase arena-02` (cena padrão 60×40) | Marcos 5 e 7 |
| **Campanha e save** | Menu → **Campanha** → escolha um slot (1–3). Salva sozinho; **Menu** no cabeçalho salva e sai; **Exportar/Importar** levam o save para outro aparelho | Marco 6 |
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
| Habilidades | Teclas 1–4 | Roda de botões em volta do ⚔ |
| Mover a câmera | Arrastar o mapa | Arrastar o mapa |
| Zoom | Roda do mouse | Pinça com dois dedos |
| Mochila e ficha | `I` (Esc fecha); equipar, usar e tirar por botão | 🎒 no cabeçalho; tocar a linha equipa ou usa |
| Pontos de atributo | Mochila → aba **Ficha** → `+` | Idem |
| Diagnóstico (fps, célula) | Abrir com `?diag=1` no fim do endereço | Idem |

### Os inimigos da fase 1

| Forma | Arquétipo | Como luta |
|---|---|---|
| ▲ triângulo | Perseguidor (goblin, orc) | Corre até você e golpeia de perto |
| ◆ losango | Atirador (esqueleto) | Mantém distância e atira flechas; recua se você encostar |
| ⬢ hexágono | Controlador (cultista) | Marca uma área 3×3 no chão; saia antes de encher |
| ● com coroa | Boss (demônio) | Alterna golpe forte e área |

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

Cada marco vira um Pull Request. O CI (typecheck, lint, testes, build e smoke) precisa passar antes do merge
em `main`, e o merge publica automaticamente.

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
| [ ] | 10A | Progressão 1–20, morte, geração procedural, portas, invocações e avatares | Campanha completa, com save, migrações e modo offline |
| [ ] | 11A | Editor completo no toque, tileset, validação e aprendizado de estilo | Aventura de 2 fases criada, testada, exportada e importada no celular |

### Expansão e operação da arena

| ✓ | # | Entrega | Pronto quando |
|---|---|---|---|
| [ ] | 8B | Livre para 10 jogadores, replicação completa, limites e métricas | Estado público e privado correto; NPCs e objetos convergentes |
| [ ] | 9B | Checkpoints externos, restauração e deduplicação | Queda do servidor recuperada ou encerrada com aviso, sem duplicação |
| [ ] | 10B | Duelo, Equipes, Horda e Rei da colina | Regras em dados e testadas, sem condicionais espalhados |
| [ ] | 11B | Justiça de telegrafia, perfis de rede e operação | Critérios da §5.6 cumpridos; sessão real com 10 pessoas |

### Convergência

| ✓ | # | Entrega | Pronto quando |
|---|---|---|---|
| [ ] | 12 | Áudio, HUD, minimapa, guia, efeitos e acessibilidade | Ameaças legíveis; efeitos visuais não mudam o gameplay |
| [ ] | 13 | Isométrico e caminhada por fatias | Alternar a visão preserva velocidade, alcance e regras |
| [ ] | 14 | Rebalanceamento final por modo | Ritmo e janelas de reação validados |
| [ ] | 15 | Endurecimento de mobile, PWA e backend | Offline, 30 minutos com 10 jogadores, benchmarks e recuperação verificados |

---

## Convenções

- Código, commits e documentação em **pt-BR**.
- TypeScript com `strict: true` e **sem `any`**; nenhum arquivo acima de **800 linhas**; sem variáveis globais.
- Todo documento leva **versão e data**; alterações significativas no código levam comentário com a data.
- Números de balanceamento ficam em `src/data/balance.json`, nunca espalhados pelo código.
- Nenhum segredo no código nem no bundle do cliente.
- Toda divergência em relação à especificação vai para `docs/DECISOES.md`, com justificativa.
