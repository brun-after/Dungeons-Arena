# Dungeons Arena: RPG de ação em tempo real

**Versão do documento:** 0.7 · **Data:** 13/10/2026
**Status:** 🚧 Em construção. Campanha mínima jogável (marcos 1–3) e arena em loopback (marco 4); próximo: servidor real (Etapa 4 e marco 5)

> **Histórico**
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
| **Navegador (nuvem)** | <https://brun-after.github.io/Dungeons-Arena/> | Etapa 1 (tela inicial); Etapa 2 (jogável) |
| **Local: cliente** | `npm install` e `npm run dev`, depois abrir `http://localhost:5173` | Etapa 1 |
| **Arena (demonstração)** | <https://brun-after.github.io/Dungeons-Arena/?arena=loopback&latencia=80> — você contra um bot, com sala e rede simuladas na página (`latencia`, `jitter` e `perda` na URL) | Marco 4 |
| **Local: verificação completa** | `npm run verificar` (typecheck, lint, testes e build) | Etapa 1 |
| **Local: servidor da arena** | `npm run dev:server` (sobe em `ws://localhost:2567`) | Etapa 5 |
| **Local: stack completa** | `docker compose up` (servidor, Redis e proxy) | Etapa 5 |
| **Testes** | `npm test` (unidade e simulação), `npm run test:e2e` (Playwright) | Etapa 1 |
| **Offline** | Depois da primeira visita, a campanha abre em modo avião (PWA) | Etapa 2 |

Requisitos locais: **Node.js 24 LTS**, **Git**; **Docker Desktop** só a partir da Etapa 5.

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

## Hospedagem 100% gratuita

| Peça | Serviço | Custo |
|---|---|---|
| Código, CI e revisão | GitHub (repositório público) + GitHub Actions | US$ 0 |
| Cliente (campanha, editor, PWA) | GitHub Pages | US$ 0 |
| Servidor da arena (Node.js + Colyseus) | VM ARM Oracle Cloud *Always Free* com Docker Compose | US$ 0 |
| Checkpoints da arena | Redis no mesmo Docker Compose (processo separado do servidor) | US$ 0 |
| HTTPS / WSS | Caddy (certificado Let's Encrypt automático) + subdomínio DuckDNS | US$ 0 |
| Imagem do servidor | GitHub Container Registry (GHCR) | US$ 0 |

A campanha e o editor não dependem do servidor. Só a arena precisa dele.
A conta Oracle tem alerta de orçamento configurado para avisar antes de qualquer cobrança.

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
- [ ] **Etapa 4**: VM Oracle, DuckDNS e segredos de deploy configurados

### Primeira versão jogável

| ✓ | # | Entrega | Pronto quando |
|---|---|---|---|
| [x] | 1 | Motor TS estrito, passo fixo, PRNG, comandos, harness e CI | O mesmo núcleo roda no navegador e no Node, sem DOM, com as invariantes exercitadas |
| [x] | 2 | Uma fase, movimento Dir8/cardinal, colisão, câmera e controles mobile | Dá para mover e atacar com dois dedos no celular e com o mouse em emulação |
| [x] | 3 | Ataque básico, 4 habilidades, 3 arquétipos de IA e boss | Combate legível: crítico zero, defesa, interrupção e telegrafia corretos |
| [x] | 4 | Arena Livre em loopback, orçamento de ficha, NPCs, loot e reconciliação | Dois clientes lutam e coletam sem duplicar itens |
| [ ] | 5 | Backend Colyseus/WSS, sala por código, patches e reconexão | Dois celulares em redes distintas; o criador sai e a sala continua; carga com 10 clientes |
| [ ] | 6 | Recompensa/equipamento, save básico e editor mínimo | Criar um mapa no celular e completar o ciclo lutar → melhorar → lutar |
| [ ] | 7 | Testes humanos, rede suportada/degradada e carga inicial | Critérios da §5.7 atendidos |

### Expansão da campanha e do conteúdo

| ✓ | # | Entrega | Pronto quando |
|---|---|---|---|
| [ ] | 8A | 26 tipos de efeito, normalização e dispatcher | Todos os efeitos exercitados; o registro aparece no editor e nos orbes |
| [ ] | 9A | Inventário, 10 slots, economia, baús, loja, orbes e spawner | A ordem de equipar não altera o resultado; ciclo econômico íntegro |
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
