# Dungeons Arena: RPG de ação em tempo real

**Versão do documento:** 3.26 · **Data:** 29/10/2026
**Status:** Em construção. Marcos 1–6 concluídos e validados em aparelho real; 8A, 9A e 10A concluídos: campanha completa, com 26 efeitos, economia, fases geradas sem fim, invocações e save com migrações. Arena online na AWS em São Paulo. Convergência concluída (12 a 16): habilidades, dificuldade, campanha em grupo, ritmo calibrado por simulação e endurecimento. Marco 17: conta Google, progresso na nuvem e o personagem da campanha na arena

> **Histórico**
> - **3.26 (29/10/2026)**: marco 26: a Investida e todo avanço saem no lançamento, mesmo sem acertar ninguém, e a linha passa pelas paredes (D-125).
> - **3.25 (29/10/2026)**: marco 26, sexta leva: assinaturas visuais (cada skill com o seu desenho: a Corrente de elos que puxa deslizando, o fogo em chama viva, o relâmpago ramificado, gelo, ossos, flechas e falcão; atlas rico, silhuetas, marcas no chão, círculo da runa nas ultimates e a galeria `?galeria=efeitos`, D-124); o laço solo com orçamento de tempo por quadro (D-122).
> - **3.24 (29/10/2026)**: marco 26, quinta leva: o jogo não pesa com o tempo no celular (laço com teto de ticks, qualidade automática que volta a subir, drops com prazo no chão, save mais leve, colisão por grade e patrulha num raio, menos lixo; medidor com entidades, objetos, ticks, qualidade e salvamento, D-122); renascer fora da porta (D-123); o seguir alvo busca o alcance da skill pronta mais curta (D-121).
> - **3.23 (28/10/2026)**: marco 26, quarta leva: runas das classes na seleção (agora em colunas, com retrato), nos livros e skills de classe e sobre a cabeça dos jogadores (D-116); câmera solta depois do arrasto e botão de centralizar com toque duplo (D-117); inimigos que reagem em até 2 s e seleção em raio 5 (D-118); skill fora do alcance que troca de alvo (D-119); dash e teleporte através de paredes (D-120); seguir alvo (D-121).
> - **3.22 (26/10/2026)**: marco 26, terceira leva: lore das classes na seleção e o Dom da classe na mochila (D-110); combos da build pela barra, com `????` nos não descobertos, e o Diário com "Como" e "Efeito" em cada entrada (D-111); portais com a cara da fase de destino e portais internos por cor (D-112); barris, caixotes, vasos e outros quebráveis com saque (D-113); clique fora das células anda na direção (D-114); mouse que guia como o joystick (D-115).
> - **3.21 (26/10/2026)**: marco 26, segunda leva: sem direcional na tela no computador e teclas EWAS na inclinação do isométrico (D-107); braços e pernas animados nos personagens e inimigos, com a correção do token que nunca contava como andando (D-108); ouro, orbes, portas, enfeites e pilares de pé no isométrico (D-109); a dificuldade travada com nota fixa para o convidado do grupo.
> - **3.20 (25/10/2026)**: marco 26: movimento livre em qualquer direção, com corpo redondo que desliza nas paredes e caminho em trechos retos (D-104); joystick analógico, teclado e D-pad girado na inclinação do isométrico (D-105); paredes do isométrico 80% mais finas e 70% mais baixas (D-106).
> - **3.19 (25/10/2026)**: marco 24: skills de classe, ultimates, sintonia, ressonâncias e o falcão com reflexo e pouso (D-094 a D-099); marco 25: IA dos inimigos por dificuldade, mais inimigos por fase, falcão protetor, arco branco do Arqueiro, anel do Necromante e aceleração pelo tempo total (D-100 a D-103).
> - **3.18 (24/10/2026)**: marco 23: dez slots de personagem; 20 temas de fase (paleta, enfeites, pilares, luz e partículas do ar); clima elemental (o elemento do tema bate mais, o oposto menos, e o clima pesa em quem não resiste); inimigos afins que absorvem o próprio elemento (gelo cura o inimigo de gelo) e a variante Primordial (D-092); armas de outra família trocam o ataque básico (D-093).
> - **3.17 (24/10/2026)**: falcão do Aventureiro livre: alcance global (as habilidades sempre saem dele; o uso conta o alcance do Aventureiro), passeia em combate mantendo distância, mergulha só nas habilidades corpo a corpo e, fora de combate, recolhe ouro, vida, mana e buffs para o dono; a encarnação do Mago dura 12 s e vira uma trilha sutil; o tiro carregado do Arqueiro ganha esteira de flecha (D-091).
> - **3.16 (23/10/2026)**: marco 22: identidade das classes. O Aventureiro ganha um falcão que divide a vida com ele e lança as habilidades; o Mago, a encarnação elemental (fogo, gelo, raio); o Arqueiro, a Mira firme (o tiro carregado é crítico, atravessa e vai até o alcance máximo) (D-089). O Necromante entra nas metas do simulador, com até 10 mortos de 20 s cujo dano cai com a quantidade, retorno dos que se afastam e Dízimo que ergue um morto quando não há nenhum (D-090).
> - **3.15 (23/10/2026)**: marco 21: Guerreiro mais forte (cura ao abater, aura desde o nível 1 de 3% a 15% com cura de 20% a 50%, barra de fúria que dobra as curas), APK com chave fixa (atualiza por cima sem perder saves) e aviso de versão nova no app (D-088).
> - **3.14 (22/10/2026)**: marco 20: app Android (APK pelo Capacitor, compilado no CI), campo do servidor da rede local no menu e modo de desempenho (teto de fps, resolução, medidor e degradação por travadas) (D-087).
> - **3.13 (18/10/2026)**: diagnóstico de balanceamento por classe, cura/custos, invocações, desgaste por onda e intervenções pareadas (D-082). Uso em [Como investigar o balanceamento](docs/DIAGNOSTICO-BALANCEAMENTO.md).
> - **3.12 (18/10/2026)**: Necromante, servo passivo, reanimados, ecos aliados e Dízimo vital; Sombra unificada em Trevas, novos combos e saves v18 (D-081). Detalhes em [Necromante e Trevas](docs/NECROMANTE.md).
> - **3.11 (17/10/2026)**: fases vivas: piso nativo contínuo, retorno com revisita, áreas elementais, armadilhas mais perigosas e Engenho; enxames ocasionais em levas limitadas, mapas maiores e espirais (D-079). Detalhes em [Fases vivas](docs/FASES-VIVAS.md).
> - **3.10 (18/10/2026)**: Investida em movimento, preservando o destino clicado, e cura do guerreiro por dano efetivo do ataque básico (D-078).
> - **3.9 (17/10/2026)**: marco 19: 60 skills, 35 combos (dez triplos), efeitos táticos e visuais exclusivos; correção de fechamento da loja e smoke da mochila (D-077). Detalhes em [Expansão de skills e combos](docs/EXPANSAO-SKILLS-COMBOS.md).
> - **3.8 (17/10/2026)**: interação e alvo mais à esquerda, ponto de habilidade com preço-base fixo de 10.000 ouro e mochila aberta ao trocar equipamentos (D-076).
> - **3.7 (17/10/2026)**: limite 30, XP avançado por dificuldade, Aceleração da mente cumulativa, Tomo do potencial e essências de evolução por família (D-075; saves v15).
> - **3.6 (17/10/2026)**: afinidade de custo mágico do aventureiro e do mago recalibrada para a mana reduzida; 77/77 metas de balanceamento aprovadas (D-074).
> - **3.5 (17/10/2026)**: regeneração de mana reduzida pela metade, interação e alvo em fileira à direita no toque e nomes curtos nos consumíveis dos dois dispositivos (D-073).
> - **3.4 (17/10/2026)**: avisos e alvo em faixa comum junto ao topo no celular, texto compacto e barra do alvo com a mesma medida da vida do jogador, sem sobreposição (D-072).
> - **3.3 (17/10/2026)**: NPCs inimigos recuperam 50% da vida perdida ao abater; chefes regeneram fora de combate; especialização ofensiva e ritmo recalibrados; descobertas por pseudônimo e contagem no lobby; e2e do estudo de habilidades (D-071).
> - **3.2 (17/10/2026)**: marco 18 "Grimório" (atributos novos, estudo de habilidades B/A/S, revide da IA, Sabedoria nas armadilhas, 3 elementos e 8 reações novas, 20 itens base com 4 formas e 120 variações, ganchos, conjuntos, ressonâncias, combos, marcos de nível, buff × habilidade, fusões, missões, origens raras, forja, eventos de fase e o diário de descobertas; D-068 a D-070).
> - **3.1 (17/10/2026)**: ajustes depois do 11A (sem descanso e mais orbes de vida, halo no lugar da linha, consumíveis à direita e minimapa à esquerda, equipamento no token, buff ofensivo armado, refúgio de 45 s, loja sem prazo, barra de skills maior com seletor rápido, flechas de verdade, ícones próprios no lugar dos emojis, paisagem e tela cheia no celular; D-067).
> - **3.0 (16/10/2026)**: marco 11A (editor completo no toque, aventuras de até 12 fases, tileset por imagem, estilo por aparelho, visuais das habilidades em partículas e trilhas casual ↔ dark; D-066).
> - **2.9 (15/10/2026)**: alvo que não troca sozinho, troca com `Q` ou 🎯 e trava com `T`, clique ou toque longo (D-065).
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

- **Campanha**: solo e offline, com progressão por fases, loot, economia e bosses; portas de retorno, áreas elementais e variações ocasionais de enxame, tamanho e formato ([Fases vivas](docs/FASES-VIVAS.md)).
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
| **Diagnóstico de balanceamento** | `npm run balancear:diagnostico -- --registrar` (cinco classes, fontes, custos, desgaste e experimentos; executado também na CI); [guia e opções](docs/DIAGNOSTICO-BALANCEAMENTO.md) | D-082 |
| **Balanceamento** | `npm run balancear` (tabela das metas do ritmo); `-- --registrar` grava [`docs/BALANCEAMENTO.md`](docs/BALANCEAMENTO.md) | Marco 15 |
| **Benchmarks do cliente** | `?bench=carga` ou `?bench=padrao` no navegador (o resultado aparece na tela; `&qualidade=baixo` e `&segundos=60` opcionais); `npm run bench` roda tudo e grava em `docs/BENCHMARKS.md` | Marco 16 |
| **Teste com pessoas** | Link <https://brun-after.github.io/Dungeons-Arena/?pesquisa=1>; roteiro e resumo em [`docs/TESTES-HUMANOS.md`](docs/TESTES-HUMANOS.md) | Marco 7 |
| **Editor de aventuras** | Menu → **Editor de fases** (ou `?editor`): aventuras de até 12 fases; pincel, balde e retângulo; baú, loja, item, armadilha, som, inimigo com nível, porta interna e saída com tranca; toque longo abre o inspetor; **Fases** troca, gera (também "no meu estilo") e escolhe o tileset (imagem 4×4 ou 5×5); **Testar** testa a fase e **Testar a aventura**, a aventura inteira; **Exportar** baixa a fase. Para jogar valendo: Campanha → slot vazio → escolha a aventura | Marcos 6 e 11A |
| **Local: verificação completa** | `npm run verificar` (typecheck, lint, testes, build e balanceamento completo) | Etapa 1 |
| **Testes** | `npm test` (unidade, simulação, rede e integração com o servidor), `npm run test:e2e` (Playwright) | Etapa 1 |
| **Offline** | Depois da primeira visita, a campanha abre em modo avião (PWA) | Etapa 2 |
| **App Android** | No celular: <https://github.com/brun-after/Dungeons-Arena/releases/latest> → `dungeons-arena.apk` → instalar (permita "instalar apps desconhecidos"). Abre deitado, em tela cheia e sem depender do site; o jogo inteiro está no APK. Quando sai versão nova, o menu do app avisa; instale por cima e os saves continuam. Com Android Studio no PC: `npm run android:apk` | Marcos 20 e 21 |
| **Servidor da rede local** | Menu → **Servidor** → digite `ws://IP-DO-PC:2567` → **Usar este servidor** (fica salvo no aparelho; **Voltar ao oficial** limpa). Serve no app e no navegador | Marco 20 |
| **Desempenho** | Pausa → **Configurações** → **Gráficos**: *Quadros por segundo* (30 economiza bateria), *Resolução* (baixa é mais leve) e o *medidor de desempenho* (fps, p95 e travadas) | Marco 20 |

Requisitos locais: **Node.js 24 LTS**, **Git**; **Docker Desktop** é opcional (só para `docker compose`).
Implantação do servidor na nuvem, passo a passo: [`docs/IMPLANTACAO.md`](docs/IMPLANTACAO.md).

### Controles

| Ação | Teclado e mouse | Toque |
|---|---|---|
| Mover | WASD ou setas (diagonal = duas teclas) | Joystick ou direcional (troca no cabeçalho) |
| Ir até um ponto | Clique no mapa | Toque no mapa; segure para seguir o dedo |
| Selecionar e travar alvo | Clique no inimigo (de novo no travado, destrava; `Esc` limpa) | Toque no inimigo |
| Trocar de alvo | `Q` (`Shift+Q` volta); `T` trava ou destrava | Botão de alvo: tocar troca, segurar trava ou destrava |
| Ataque básico | Espaço; ataca sozinho o alvo selecionado (travado, só ele) ou quem estiver te perseguindo | Botão de ataque (funciona junto com o joystick) |
| Habilidades | Teclas 1–4 (também no teclado numérico) | Roda de botões em volta do ataque |
| Pôr uma habilidade na tecla | Clique direito no botão da barra (ou `+` na tecla livre); na mochila, os botões 1–4 de cada carta | Segure o botão da roda |
| Consumíveis (poções e pergaminhos) | Coluna à direita: clique, ou as teclas 5–9 e 0 | Lista à direita, no alto: toque |
| Aprender uma habilidade (estudo) | Mochila → **Habilidades** → **Estudar**; **Acelerar** gasta 1 ponto e tira 1/3 do tempo | Idem |
| O que cada atributo faz | Mochila → **Ficha** → o **?** ao lado do atributo | Idem (toque) |
| Desarmar armadilha revelada | `E` ao lado dela (a Sabedoria decide) | Botão de interagir |
| Diário de descobertas e missões | Mochila → **Diário** | Idem |
| Forja | Na loja, seção **Forja** | Idem |
| Mover a câmera | Arrastar o mapa | Arrastar o mapa |
| Zoom | Roda do mouse | Pinça com dois dedos |
| Visão (de cima ou isométrica) | `V`, ou Pausa → Configurações → Gráficos | Pausa → Configurações → Gráficos |
| Seu personagem por imagem | Pausa → Configurações → Aparência | Idem |
| Ranks, caminhos e teclas das habilidades | Mochila (`I`) → aba **Habilidades** | Idem |
| O que um efeito faz | Passe o mouse (ou o foco) no ícone do efeito, ao lado da vida | Toque no ícone |
| Ver as células exatas das áreas | Pausa → Configurações → Gráficos → Mostrar a área exata | Idem |
| Mochila e ficha | `I` (Esc fecha); equipar, usar e tirar por botão | Botão da mochila no cabeçalho; tocar a linha equipa ou usa |
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

**Ordem atual** (D-055, D-057, D-064): 15, 16, 17 e 11A concluídos; agora a arena (**8B → 9B → 10B → 11B**). A sessão com
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
| [x] | 11A | Editor completo no toque (baú, loja, armadilha, portas e loot), aventura de 2+ fases, tileset por imagem, aprendizado de estilo por aparelho, a aparência das habilidades refinada e trilhas variadas entre casual e dark fantasy (D-064) | Aventura de 2 fases criada e testada no celular |

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
| [x] | 18 | **Grimório**: Força e Inteligência dividem o dano bruto e a Inteligência fortalece efeitos, reações e combos; Destreza é ritmo (arqueiro até 50% no básico); Sabedoria revela e desarma armadilhas; **estudo** para aprender (Rank B/A/S, acelerável); **revide** imediato da IA; **terra, sombra e sagrado** com 8 reações novas; **20 itens base × 4 formas** (Comum, Épica, Lendária, Última) com 10 afinidades elementais = 120 variações; **ganchos**, **conjuntos**, **ressonâncias** de atributo, **combos**, **marcos de nível**, **buff × habilidade** e **fusões**; **missões**, **origens raras**, **forja**, **eventos de fase** e **diário de descobertas** (primeira descoberta do servidor na nuvem) (D-068, D-069, D-070) | Tudo em dados e testado; metas do simulador aprovadas; guia e dica rápida dos atributos |
| [x] | 21 | **Guerreiro** com cura ao abater, aura desde o nível 1 e **fúria**; **APK com chave fixa** e **aviso de atualização** no app (D-088) | Atualizar por cima mantém os saves; o aviso aparece com uma Release nova; metas do simulador revisadas |
| [x] | 22 | **Identidade das classes**: **falcão** do Aventureiro (mesma vida, origem das habilidades, segue o alvo, recolhe ouro, revela armadilhas), **encarnação elemental** do Mago e **Mira firme** do Arqueiro (D-089); **Necromante** no simulador, exército de até 10 mortos, retorno dos distantes e Dízimo que ergue (D-090) | Testes das mecânicas; 94/94 metas (com o Necromante); as classes vistas em jogo |
| [x] | 23 | **Temas e elementos**: **10 slots**; **20 temas** de fase com paleta, enfeites, pilares, luz e partículas; **clima elemental** e áreas por elemento; **inimigos afins** (absorvem o elemento, fracos ao oposto, variante Primordial) (D-092); **armas fora da classe** trocam o ataque básico (D-093) | Testes dos temas, do clima, das afinidades e das armas; 94/94 metas; os temas vistos em jogo |
| [x] | 24 | **Skills de classe**: teclas 1–2 de classe e ultimate do par; sintonia, encarnações e vertentes; 24 ressonâncias e sinergias; pelas costas e estados na IA; falcão com reflexo e pouso; porta com espera (D-094 a D-099) | Testes das classes, das ultimates e do falcão; e2e da barra de 6 |
| [x] | 25 | **IA e falcão**: inimigos mais espertos por dificuldade (perigo, esquiva, cerco, armadilhas, cura afim) (D-100); +10% de inimigos por fase (D-101); falcão que bloqueia projéteis e voa ao golpe (D-102); arco branco, anel do Necromante, aceleração pelo total (D-103) | Testes da IA, do falcão e da população; skills de classe a 60% entre personagens na arena; 94/94 metas |
| [x] | 26 | **Movimento livre**: posição contínua, corpo redondo que desliza nas paredes, irPara em reta (D-104); controles do isométrico pela inversa da projeção, joystick analógico, D-pad girado (D-105); paredes finas e baixas (D-106); sem direcional no computador e teclas EWAS (D-107); braços e pernas animados (D-108); objetos, enfeites, portas e pilares de pé no isométrico (D-109); lore das classes (D-110); combos da build e Diário detalhado (D-111); portais por destino e por cor (D-112); quebráveis (D-113); clique fora das células (D-114); mouse que guia (D-115); runas das classes (D-116); câmera solta e centralizar (D-117); reação rápida e seleção em raio 5 (D-118); troca de alvo fora do alcance (D-119); dash e teleporte através de paredes (D-120); seguir alvo (D-121); desempenho em sessão longa (D-122); renascer fora da porta (D-123); assinaturas visuais e galeria de efeitos (D-124); avanço no lançamento (D-125) | Testes do integrador, do corpo, da migração, da entrada, das teclas, dos quadros de membros, dos objetos em pé, do Diário, dos portais, dos quebráveis, das runas, da câmera solta, do dash através da parede e do seguir alvo; e2e do clique em reta, do EWAS, do mouse segurado, dos quebráveis, da seleção com runas, do centralizar e do grupo; carga da arena em 33 KiB/s e do grupo em 18,4 KiB/s; 94/94 metas |
| [ ] | 20 | **App Android** (Capacitor, APK compilado no CI, modo imersivo, tela acesa, voltar do Android, login Google por deep link), **servidor da rede local** no menu e **modo de desempenho** (teto de fps, escala da resolução, medidor, degradação por travadas) (D-087) | APK instalado num Android real; arena na rede local e login funcionando; números do medidor em `BENCHMARKS.md` |
| [x] | 16 | Celular (área segura, orientação, redimensionamento), **PWA offline** testado, desempenho e memória (trocas de fase, cena de carga, `BENCHMARKS.md`) e servidor (limites, métricas, teste de 10 min na VM) | Offline e benchmarks verificados; teste de 10 min na VM com 10 bots: 10/10 metas, memória estável e sem reinício. *Recuperação de queda: depois do 9B; sessão real de 10 pessoas: no 11B* |

---

## Convenções

- Código, commits e documentação em **pt-BR**.
- TypeScript com `strict: true` e **sem `any`**; nenhum arquivo acima de **800 linhas**; sem variáveis globais.
- Todo documento leva **versão e data**; alterações significativas no código levam comentário com a data.
- Números de balanceamento ficam em `src/data/balance.json`, nunca espalhados pelo código.
- Nenhum segredo no código nem no bundle do cliente.
- Toda divergência em relação à especificação vai para `docs/DECISOES.md`, com justificativa.
