# Decisões de projeto

**Versão:** 0.67 · **Data:** 31/10/2026

> **Histórico**
> - **0.67 (31/10/2026)**: D-130 (o visual sombrio: chão texturizado CC0 sem grade, escuridão com luz em volta, paredes altas que esmaecem, telhados das casas, isométrico como padrão e marcas discretas) e a nota em D-106.
> - **0.66 (30/10/2026)**: D-129 (o Mundo social: grupo, chat, banco, missões, troca, mercado, receitas por ofício, perigo, vila refúgio, passagem protegida, estrutura escondida, eventos por região, polimento visual e as metas do Mundo no simulador, com a vida dos chefes dos covis e o fim das invocações como monstros).
> - **0.65 (30/10/2026)**: D-128 (o Mundo: lugares em salas, área de interesse, IA com ativação, personagem no servidor, exterior gerado com fachadas, perigo e PvP por região, túmulo, portais, coleta e covis; o Reino Central).
> - **0.64 (30/10/2026)**: D-127 (nível 100, teto nível+20 nos pontos gastos, rendimento acima de 30, atributo de classe com marcos em 25/50/75/100, itens com % de dano e de defesa, "Escala com" nas skills e invocações iguais lado a lado) e a nota em D-061.
> - **0.63 (29/10/2026)**: D-126 (armas de classe: 8 por classe, cada uma com a sua variação do básico, familiaridade, a fração da passiva de outra classe, o 3º golpe pela mão secundária, o solo amaldiçoado, o bumerangue e os pergaminhos que acumulam) e as notas em D-069 e D-093.
> - **0.62 (29/10/2026)**: D-125 (o avanço de quem conjura sai no lançamento, e a linha da investida passa pelas paredes) e a nota em D-120.
> - **0.61 (29/10/2026)**: D-124 (assinaturas visuais: cada skill com o seu desenho, motor de efeitos com atlas rico, silhuetas, marcas no chão e deslize; galeria de efeitos) e a nota em D-066; ajuste da sexta leva em D-122 (orçamento de tempo no laço solo).
> - **0.60 (29/10/2026)**: D-122 (o jogo não pesa com o tempo no celular), D-123 (renascer fora da porta) e a nota de D-121 (a automação busca o alcance da skill pronta mais curta).
> - **0.59 (28/10/2026)**: D-116 a D-121 (marco 26, quarta leva: runas das classes e seleção em colunas, câmera solta e botão de centralizar, inimigos que reagem logo e seleção em raio menor, skill fora do alcance que troca de alvo, dash e teleporte através de paredes, seguir alvo).
> - **0.58 (26/10/2026)**: D-110 a D-115 (marco 26, terceira leva: lore das classes e Dom da classe, combos da build pela barra e Diário detalhado, portais por destino e por cor, quebráveis, clique fora das células e mouse que guia como o joystick).
> - **0.57 (26/10/2026)**: D-107 a D-109 (marco 26: sem direcional no computador e teclas EWAS, braços e pernas animados, objetos em pé no isométrico).
> - **0.56 (25/10/2026)**: D-104 a D-106 (marco 26: movimento livre em qualquer direção, controles do isométrico na inclinação do mapa e paredes do isométrico finas e baixas).
> - **0.55 (25/10/2026)**: D-094 a D-099 (marco 24: skills de classe, ultimates, sintonia, ressonâncias, orientação, falcão e portas) e D-100 a D-103 (marco 25: IA por dificuldade, população por fase, falcão protetor, arco branco, anel do Necromante e aceleração pelo total).
> - **0.54 (24/10/2026)**: D-092 (marco 23: dez slots, 20 temas de fase, clima elemental e inimigos afins) e D-093 (armas fora da classe trocam o ataque básico).
> - **0.53 (24/10/2026)**: D-091 (IA livre do falcão, alcance global e coleta; encarnação do Mago com 12 s e trilha; flecha do tiro carregado).
> - **0.52 (23/10/2026)**: D-090 (marco 22: Necromante no simulador, exército de até 10 mortos, retorno dos distantes e Dízimo que ergue).
> - **0.51 (23/10/2026)**: D-089 (marco 22: falcão do Aventureiro, encarnação elemental do Mago e Mira firme do Arqueiro).
> - **0.50 (23/10/2026)**: D-088 (marco 21: Guerreiro mais forte com fúria, chave fixa do APK e aviso de atualização no app).
> - **0.49 (22/10/2026)**: D-087 (marco 20: app Android pelo Capacitor, APK no CI, login por deep link e modo de desempenho).
> - **0.47 (18/10/2026)**: D-085 (piso absoluto de 1 XP por abate no novo antifarm, preservando a penalidade por morte).
> - **0.46 (18/10/2026)**: D-084 (XP com fadiga permanente independente, piso de 5%, reforços do Guerreiro entre 16–20 e somente Botas do vento).
> - **0.45 (18/10/2026)**: D-083 (ajustes das cinco classes, antifarm persistente por fase e velocidade ao cruzar hostis).
> - **0.44 (18/10/2026)**: D-082 (diagnóstico de balanceamento com contabilidade de combate e intervenções por fator).
> - **0.43 (17/10/2026)**: D-079 (dinamismo das fases preservando salas e corredores, retorno, ambientes, Engenho e enxames limitados).
> - **0.42 (18/10/2026)**: D-078 (Investida livre e sustentação do guerreiro pelo básico).
> - **0.41 (17/10/2026)**: D-077 (17 skills, 35 combos confirmados por resultado, visuais e correção do smoke).
> - **0.40 (17/10/2026)**: D-076 (controles afastados das skills, tomo a preço fixo e troca de equipamentos sem fechar a mochila).
> - **0.39 (17/10/2026)**: D-075 (progressão até 30 e consumíveis de aprendizagem e evolução).
> - **0.38 (17/10/2026)**: D-074 (eficiência mágica do aventureiro e do mago após a redução de mana; 77/77 metas).
> - **0.37 (17/10/2026)**: D-073 (mana reduzida em 50%, controles à direita e consumíveis legíveis).
> - **0.36 (17/10/2026)**: D-072 (HUD compacto no topo do celular; avisos e alvo sem sobreposição).
> - **0.35 (17/10/2026)**: D-071 (recuperação dos inimigos, especialização ofensiva, ritmo, descobertas públicas por pseudônimo e cobertura do estudo).
> - **0.34 (17/10/2026)**: D-068 (atributos, estudo, revide e armadilhas), D-069 (itens base com formas, ganchos, conjuntos e elementos novos) e D-070 (combos, marcos, fusões, missões, origens, forja, eventos de fase e diário).
> - **0.33 (17/10/2026)**: D-067 (ajustes depois do 11A: sem descanso, buff armado, refúgio, loja sem prazo, equipamento no token, flechas, ícones próprios, paisagem).
> - **0.32 (16/10/2026)**: D-066 (marco 11A: editor completo, aventura de várias fases, tileset, estilo por aparelho, visuais em partículas e trilhas casual ↔ dark).
> - **0.31 (15/10/2026)**: D-065 (alvo automático que acompanha e alvo travado).
> - **0.30 (15/10/2026)**: D-063 (conta, nuvem, certificado do personagem, a campanha na arena e mais peso em upar; marco 17) e D-064 (o 11A redefinido).
> - **0.29 (15/10/2026)**: D-062 com o resultado do teste na VM (10 min, por decisão do usuário).
> - **0.28 (15/10/2026)**: D-061 (dificuldade, campanha cooperativa e balanceamento por simulação, marco 15) e D-062 (endurecimento, marco 16).
> - **0.27 (15/10/2026)**: D-060 (ajustes de jogo depois do marco 14); a D-017 passa a ser por habilidade.
> - **0.26 (15/10/2026)**: D-059 (sistema de habilidades), marco 14.
> - **0.25 (14/10/2026)**: D-058 (visão isométrica, modelos de criatura, caminhada por fatias e personagem por imagem), marco 13.
> - **0.24 (14/10/2026)**: D-056 ajustada (brilho do jogador, tremor e flash pela metade).
> - **0.23 (14/10/2026)**: D-057 (sistema de habilidades, novo marco 14; rebalanceamento vira 15 e endurecimento, 16).
> - **0.22 (14/10/2026)**: D-056 (áudio sintetizado, interface, efeitos como dado, qualidade e acessibilidade), marco 12.
> - **0.21 (14/10/2026)**: D-055 (sugestões de capacidades, áudio e ordem da convergência).
> - **0.20 (14/10/2026)**: D-054 (invocações completas, avatares e dominação), marco 10A-3.
> - **0.19 (14/10/2026)**: D-053 (fases geradas, morte, descanso e regeneração por célula), marco 10A-2.
> - **0.18 (14/10/2026)**: D-052 (portas e troca de fase da campanha), marco 10A-1.
> - **0.17 (14/10/2026)**: D-051 (spawner dinâmico e armadilha de fase), marco 9A-2.
> - **0.16 (14/10/2026)**: D-050 (economia: ouro, loja, baús, atalhos e ordenação), marco 9A-1.
> - **0.15 (14/10/2026)**: D-049 (efeitos de fluxo próprio), marco 8A-2.
> - **0.14 (14/10/2026)**: D-048 (semântica dos efeitos do registro), marco 8A-1.
> - **0.13 (13/10/2026)**: D-045 a D-047, marco 7B (rede degradada sobre WSS, cena padrão, renovação do movimento).
> - **0.12 (13/10/2026)**: D-044 (relatórios anônimos do teste com pessoas), marco 7A.
> - **0.11 (13/10/2026)**: D-042 e D-043, tomadas no marco 6C (editor mínimo).
> - **0.10 (13/10/2026)**: D-041 (save da campanha no IndexedDB), tomada no marco 6B; D-015 encerrada.
> - **0.9 (13/10/2026)**: D-039 e D-040, tomadas no marco 6A (itens, equipamento e nível).
> - **0.8 (13/10/2026)**: D-038 (servidor da arena na AWS Lightsail em São Paulo); D-001 parcialmente superada.
> - **0.7 (13/10/2026)**: decisões D-035 a D-037, tomadas no marco 5A (servidor real).
> - **0.6 (13/10/2026)**: decisões D-033 e D-034, tomadas no marco 4B (loopback).
> - **0.5 (13/10/2026)**: decisões D-028 a D-032, tomadas no marco 4A (regras da arena).
> - **0.4 (13/10/2026)**: decisões D-024 a D-027, tomadas no marco 3B (IA); D-023 ampliada.
> - **0.3 (13/10/2026)**: decisões D-017 a D-023, tomadas no marco 3A (combate); D-016 superada.
> - **0.2 (13/10/2026)**: decisões D-007 a D-016, tomadas no marco 2 (fase, movimento, câmera e controles).
> - **0.1 (13/10/2026)**: decisões D-001 a D-006, tomadas na Etapa 1 (fundação).

Registro de divergências e escolhas em relação a [`PROMPT-PROJETO-v4.0.md`](PROMPT-PROJETO-v4.0.md),
como pede a Parte 0 da especificação. Cada entrada traz contexto, decisão, consequência e a versão em que entrou.

---

## D-001 · Hospedagem gratuita (v0.1, 13/10/2026)

**Contexto.** A primeira fase do projeto precisa custar zero, com uma versão local e uma na nuvem.
A §3.6 deixa TLS, endpoint e armazenamento para o deploy.

**Decisão.**
- Cliente (campanha, editor, PWA) no **GitHub Pages**, publicado pelo GitHub Actions a cada merge em `main`.
- Servidor da arena numa **VM ARM Oracle Cloud Always Free** (2 OCPU / 12 GB, região São Paulo),
  com Docker Compose: servidor Node + Colyseus, **Redis** para checkpoints (processo separado, o que
  atende a exigência de "armazenamento externo ao processo" da §3.6) e **Caddy** para TLS/WSS.
- Endereço do servidor: subdomínio gratuito **DuckDNS**. Imagem do servidor no **GHCR**.

**Consequência.** Uma única região de servidor. A arena precisa informar essa limitação aos jogadores
(§3.6, "Justiça"). A conta Oracle mantém alerta de orçamento para evitar cobranças.

> **Parcialmente superada por D-038 (v0.8).** O cliente continua no GitHub Pages. O servidor da arena foi para a AWS
> Lightsail em São Paulo, porque a Oracle não teve capacidade. A Oracle fica como alternativa.

## D-002 · Pacote único na raiz (v0.1, 13/10/2026)

**Contexto.** A §3.2 separa `src/`, `server/`, `shared/` e `tools/`, sem exigir monorepo.

**Decisão.** Um único `package.json` na raiz, sem workspaces. O isolamento entre camadas é garantido por
configuração do TypeScript (D-004) e por regra de lint (`no-restricted-imports`).

**Consequência.** Menos configuração. Se o servidor precisar de dependências muito diferentes do cliente,
reavaliar na Etapa 5.

## D-003 · Node 24 LTS e TypeScript 6.0 (v0.1, 13/10/2026)

**Contexto.** O TypeScript 7 (compilador nativo) é a versão `latest` no npm, mas o `typescript-eslint`
8.71 aceita TypeScript `< 6.1`.

**Decisão.** TypeScript **6.0.x** fixado no lockfile, até o lint suportar a versão 7. Node **24 LTS**
(`.node-version`), igual no CI e no servidor.

**Consequência.** Migrar para o TypeScript 7 é uma tarefa futura, quando o ecossistema de lint acompanhar.

## D-004 · Núcleo verificado sem DOM pelo compilador (v0.1, 13/10/2026)

**Contexto.** A §1.3 (pilar 5) e a §5.1 exigem que o núcleo rode sem DOM, sem `requestAnimationFrame`
e sem rede.

**Decisão.** `tsconfig.nucleo.json` compila `src/core` e `shared` com `lib: ["ES2023"]` e `types: []`.
Qualquer uso de `window`, `document`, `performance` ou de APIs do Node no núcleo quebra o typecheck.
O adaptador do navegador fica em `src/plataforma/`.

**Consequência.** O relógio real e o agendamento de quadros ficam fora do núcleo, injetados (§5.1).

## D-005 · Tolerância de ponto flutuante no passo fixo (v0.1, 13/10/2026)

**Contexto.** Somar `1000/60` repetidas vezes acumula erro de ponto flutuante: um segundo de quadros
rendia 59 ticks, e 24 ticks não completavam os 400 ms de um passo de movimento.

**Decisão.** O acumulador do laço e o integrador de movimento comparam com tolerância de `1e-6 ms`
e nunca deixam o resto negativo.

**Consequência.** 60 quadros de 1/60 s rendem exatamente 60 ticks, e um passo base leva exatamente 24 ticks.
O determinismo não é afetado: a mesma sequência de operações dá o mesmo resultado em qualquer máquina.

## D-006 · Movimento mínimo já no marco 1 (v0.1, 13/10/2026)

**Contexto.** O harness do marco 1 precisa exercitar invariantes, e para isso as entidades precisam mudar de estado.

**Decisão.** O marco 1 implementa só o comando `mover`, com passos cardinais e alternância X/Y da diagonal (§2.3),
respeitando apenas os limites do mapa. Terreno, colisão entre entidades, fila de waypoints e cancelamento
de passo entram no marco 2.

**Consequência.** `src/core/simulacao.ts` já segue a ordem por tick da §2.2, com as demais etapas marcadas
para os próximos marcos.

---

## D-007 · Terreno fora do estado, com contexto injetado (v0.2, 13/10/2026)

**Contexto.** A fase é conteúdo imutável durante a partida, e o estado precisa ser barato de clonar,
comparar e gravar em checkpoint (§3.6, §5.1).

**Decisão.** `EstadoJogo` guarda só o `faseId`. O terreno e o balanceamento chegam a `simular()` por um
`ContextoSimulacao` (`src/core/contexto.ts`). `src/world` e `src/entities` entram no `tsconfig.nucleo.json`
e na regra de lint do núcleo.

**Consequência.** O digest e o checkpoint não carregam a grade. Quando o editor ou a arena mudarem
o terreno durante a sessão, a revisão da fase entra no estado.

## D-008 · Células autoradas em texto (v0.2, 13/10/2026)

**Contexto.** A §2.1 define `celulas: Celula[][]` sem fixar a forma no arquivo.

**Decisão.** No JSON, o mapa é uma lista de linhas de texto: `#` parede, `.` piso, `S` saída e espaço
para vazio. `carregarFase` converte para um `Uint8Array` plano. Spawns ficam numa lista à parte.

**Consequência.** As fases ficam legíveis num diff. A peça visual por célula (§2.16) vira um campo
adicional quando o tileset entrar (11A).

## D-009 · Terreno em cores lisas até o tileset (v0.2, 13/10/2026)

**Contexto.** A §2.16 pede um sprite por célula do atlas do tileset, que só chega no 11A.

**Decisão.** Até lá, cada bloco de 16×16 células é um único `Graphics` desenhado uma vez por fase, com cores
por tipo e variação de piso por hash da posição. O descarte por bloco fora da viewport já segue a spec.

**Consequência.** Quando o tileset entrar, o desenho do bloco é trocado sem mudar a câmera nem o descarte.

## D-010 · D-pad sem repetição e sem reposicionamento por enquanto (v0.2, 13/10/2026)

**Contexto.** A §4.4 pede repetição a 180 ms e reposicionamento segurando o centro por 10 s.

**Decisão.** A direção é estado mantido (§2.3), então a repetição não teria efeito e foi omitida. O dedo pode
deslizar entre botões sem soltar. O reposicionamento fica para o marco 12 (HUD e acessibilidade).

**Consequência.** O D-pad do marco 2 é fixo na faixa de controles.

## D-011 · Regras finas de movimento (v0.2, 13/10/2026)

**Contexto.** A §2.3 deixa alguns casos implícitos.

**Decisão.**
- A fila de 2 waypoints é reabastecida pelo caminho do `irPara`; o caminho parte do destino do passo em curso.
- Entrada direcional cancela o caminho do `irPara`.
- Só a **troca** de direção com menos de 50% do passo cancela o passo, e só quando a nova direção leva a
  outra célula. Soltar a direção termina o passo em curso, para o personagem não ficar entre células.
- Waypoint ocupado por entidade bloqueante: espera, mantendo o caminho. As 3 falhas que trocam de alvo
  (§2.3, cache do perseguidor) valem para a IA no marco 3.

## D-012 · Toque no mapa: segurar para seguir, arrastar para a câmera (v0.2, 13/10/2026)

**Contexto.** A §4.8 pede "segurar recalcula o caminho conforme o dedo se move" e também "arrasto de câmera
com zona morta", gestos que competem pelo mesmo dedo.

**Decisão.** Toque curto sem arrastar vai até a célula. Segurar parado por 300 ms entra no modo seguir
(o caminho é recalculado a cada célula sob o dedo). Mover além da zona morta antes disso arrasta a câmera.

## D-013 · PWA com vite-plugin-pwa e Workbox (v0.2, 13/10/2026)

**Contexto.** A §3.8 pede nome do cache derivado do hash do build, cache-first para assets e network-first
para navegação.

**Decisão.** O precache do Workbox versiona cada arquivo pela revisão (hash) e limpa caches antigos, o que
cumpre o objetivo do nome derivado do hash. A navegação usa `NetworkFirst` com fallback para o
`index.html` do precache, para a campanha abrir offline já na segunda visita.

## D-014 · Botões de ação disparam no pointerdown (v0.2, 13/10/2026)

**Contexto.** A §3.4 manda botões comuns usarem `click`. No celular, um segundo dedo tocando enquanto o
primeiro segura o joystick nem sempre gera `click`, e mover e atacar ao mesmo tempo é requisito (§4.3, aceite 2).

**Decisão.** Os botões de ação da faixa (ataque, interagir) disparam no `pointerdown`. O teclado aciona
pelo `click` sem ponteiro (`detail === 0`), então a ação nunca dispara duas vezes. Os demais botões usam `click`.

**Consequência.** Há teste ponta a ponta com dois toques simultâneos via CDP.

## D-015 · Preferências no localStorage até o save (v0.2, 13/10/2026)

**Decisão.** O tipo de controle e o modo da câmera ficam no `localStorage`, com falha silenciosa, até o store
`perfil` do IndexedDB (§3.5) entrar no marco 6.

> **Encerrada na v0.10 (marco 6B).** As preferências estão no store `perfil` e são migradas do `localStorage` na
> primeira abertura. Sem IndexedDB, o `localStorage` continua como reserva.

## D-016 · Cor dos marcadores por equipe, provisória (v0.2, 13/10/2026) — superada na v0.3

**Decisão.** Até existir `relacao()` (marco 3/4), os marcadores das entidades usam azul para o próprio jogador,
verde para a mesma equipe e vermelho para as demais. Só a cor depende disso: nenhuma regra de jogo decide
hostilidade pela equipe fora de `relacao()`.

**v0.3:** a cor agora vem de `relacao(jogadorLocal, entidade, modo)`.

---

## D-017 · Quem conjura não começa passo novo (v0.3, 13/10/2026)

**Contexto.** A §2.7 não diz se o personagem anda durante a conjuração.

**Decisão.** Durante a conjuração, e enquanto estiver atordoado, a entidade não começa passos; o passo em
curso termina. A direção mantida volta a valer quando a ação lança.

**Consequência.** A conjuração vira um compromisso visível ("parou para conjurar"), o que reforça a
telegrafia. Esquivar continua possível para o **alvo**, que anda livremente.

> **Revista pela D-060 (15/10/2026)**: travar passa a ser escolha de cada habilidade (`mobilidade`); os ataques
> básicos do jogador andam livres.

## D-018 · Projétil reto e acerto pela célula ocupada (v0.3, 13/10/2026)

**Contexto.** A §2.7 diz que o projétil lançado continua e colide durante a viagem, mas não define a trajetória.

**Decisão.** O projétil mira a célula do alvo **no lançamento** e segue em linha reta, com sub-passos de 0,25
célula. Ele acerta o primeiro hostil (pela relação do lançador) cuja célula ocupada coincide com a dele. A célula
ocupada é a origem até 50% do passo e o destino depois. O projétil para em parede e expira meia célula depois
do ponto mirado. Bônus de atributo e Carisma do lançador ficam congelados no projétil.

**Consequência.** Sair da linha depois do lançamento esquiva; o projétil não persegue o alvo.

## D-019 · Roda de habilidades simplificada (v0.3, 13/10/2026)

**Contexto.** A §4.6 descreve uma roda com janela rotativa de 3 habilidades, botão central de definitiva,
setas e modo expandido.

**Decisão.** Com 4 habilidades, a roda mostra todas de uma vez: um quarto de círculo de botões de 44 px em volta
do botão de ataque, com cortina de recarga e indicação de mana insuficiente. No desktop é uma fila com as
teclas 1–4. A janela rotativa, a definitiva e o modo expandido entram quando houver mais habilidades que slots (10A).

## D-020 · Habilidade substitui o ataque básico em conjuração (v0.3, 13/10/2026)

**Contexto.** Com o ataque automático ligado, quase sempre há um ataque básico em conjuração, e as habilidades
eram recusadas com "já está conjurando".

**Decisão.** Pedir uma habilidade durante a conjuração do **ataque básico** cancela o básico (motivo
`substituido`, sem devolver a recarga dele) e começa a habilidade. Uma habilidade em conjuração nunca é
substituída por outra.

## D-021 · Arquétipo e classe por preset; boneco de treino (v0.3, 13/10/2026)

**Contexto.** A §2.5 sorteia 50/50 a classe corpo a corpo/conjurador por inimigo; a §2.6 pede arquétipos
legíveis, apresentados um por vez.

**Decisão.** Arquétipo, classe e ataque básico vêm do preset em `inimigos.json`, para que cada inimigo seja
reconhecível pela silhueta e pelo comportamento. Foi criado o preset `boneco` (sem IA, 160 de HP base, sem XP)
para o treino do marco 3A.

## D-022 · Atributo do dano pela classe da entidade (v0.3, 13/10/2026)

**Decisão.** Literal da §2.7: conjurador soma Inteligência; os demais, Força. Isso vale para o ataque básico e para
as habilidades, inclusive as mágicas de uma classe corpo a corpo. A cura não soma atributo nesta versão.

## D-023 · Testes ponta a ponta em série (v0.3, 13/10/2026)

**Contexto.** O WebGL do navegador headless é por software. Com dois navegadores em paralelo, os quadros passavam
de 250 ms e a simulação desacelerava de propósito (teto do laço, §2.2), estourando prazos fixos.

**Decisão.** O Playwright roda com 1 worker. Os testes esperam por condição (jogador andou, câmera parou), sem
prazos fixos curtos. **v0.4:** limite por teste de 90 s, porque andar até uma sala e lutar passa dos 30 s padrão.

---

## D-024 · Hesitação escalada pelo preset (v0.4, 13/10/2026)

**Contexto.** A §2.5 dá a cada preset uma "Hesitação (s)" (goblin 5, boss 1), e a §2.6 dá uma tabela de
2/5/7/10 s com 10 s de base. Lidas ao pé da letra, as duas competem.

**Decisão.** A tabela da §2.6 sorteia a **forma** da hesitação para uma base de 10 s, com o fator de Carisma
aplicado às chances. O preset define a **escala**: `tempo = sorteado × hesitacaoS / 10`. Um goblin hesita de 1 a 5 s;
o boss, de 0,2 a 1 s.

## D-025 · A IA age pelas funções internas, na etapa 2 do tick (v0.4, 13/10/2026)

**Contexto.** A §3.3 lista a IA como produtora de comandos.

**Decisão.** A IA roda dentro de `simular()` e chama as mesmas funções que os comandos usam (`iniciarAcao`,
`planejarCaminho`, `pararMovimento`). Na prática equivale a emitir comandos, mas permite limites próprios, como
o caminho de 150 passos da perseguição contra os 60 do toque. Clientes nunca enviam comandos para entidades de IA (§3.6).

## D-026 · Atirador e controlador não atacam de perto (v0.4, 13/10/2026)

**Decisão.** Com o alvo a menos de 3 células, o atirador e o controlador **recuam** para a vizinha que mais se
afasta e só atacam de perto se estiverem encurralados. Sem isso, o arquétipo atirava à queima-roupa e ficava
igual ao perseguidor (o teste da IA pegou isso).

## D-027 · Respawn espera a célula de origem liberar (v0.4, 13/10/2026)

**Contexto.** O harness de 10.000 ticks encontrou dois inimigos dividindo uma célula: um deles tinha renascido na
origem enquanto outro estava parado ali.

**Decisão.** O respawn só acontece com a célula de origem livre de quem bloqueia; senão, fica pendente e tenta de
novo no tick seguinte.

## D-028 · Livre: cada jogador é a própria equipe (v0.5, 13/10/2026)

**Contexto.** A §2.13 descreve o Livre como "todos hostis, exceto próprio jogador e subordinados". Lida ao pé da
letra, "todos hostis" também faria os NPCs da fase brigarem entre si.

**Decisão.** Ao entrar no Livre, cada jogador recebe a equipe `jogador:<id>`; invocações e avatares herdam a equipe
do dono. Em `todos_hostis`, a relação é **hostil entre equipes diferentes** e aliada dentro da mesma equipe (o
próprio jogador e seus subordinados). Os NPCs ficam todos na equipe `inimigos`: aliados entre si, hostis a todos
os jogadores. A entrada e a relação continuam por funções de modo (`equipeDeEntrada`, `relacao`).

## D-029 · Quem coleta orbes e quando (v0.5, 13/10/2026)

**Decisão.** Só entidades controladas por jogador coletam; a IA nunca coleta. Um orbe que não teria efeito (vida
ou mana cheia) não é consumido, para não ser desperdiçado nem "roubado" por quem não precisa. A coleta é uma
transação no tick, na ordem rotativa: com dez coletores na mesma célula, só um leva.

## D-030 · Revivescência da campanha vira respawn do modo (v0.5, 13/10/2026)

**Decisão.** O atraso (1,2 s na campanha, 5 s no Livre), o local (`base_da_equipe` na campanha, `longe_do_inimigo`
no Livre) e a proteção pós-reaparição (`protecaoS`: 5 s de invisibilidade na campanha, como na §2.12, e 2 s no Livre)
vêm do descritor de modo. Os números saíram de `balance.morte`. A proteção de 2 s no Livre é escolha nossa:
a spec não define proteção de reaparição na arena.

## D-031 · Objetos em coordenadas normalizadas; inimigos em células (v0.5, 13/10/2026)

**Decisão.** Objetos de fase seguem a §2.1: são autorados em 0–1 e convertidos por
`coluna = min(largura − 1, floor(x × largura))`. Inimigos posicionados continuam em células inteiras (a spec não fixa o
formato), o que facilita posicionar encontros à mão.

## D-032 · Orçamento de atributos e desempate da redução (v0.5, 13/10/2026)

**Contexto.** A §3.7 pede teto por atributo, teto total e orçamento, com "desempate/redução documentados em dados".

**Decisão.** Ordem de aplicação: teto por atributo → teto da soma (no modo `escalar`, reescala por maiores
restos) → orçamento, que conta **só os pontos acima de 10**. A redução tira 1 ponto do maior atributo por vez; o
empate segue `ordemReducao` do modo. HP, mana e defesa são sempre recalculados da classe; o pedido do cliente
nunca é aceito para eles.

## D-033 · O cliente roda à frente e a sala agenda por `tickCliente` (v0.6, 13/10/2026)

**Decisão.** O cliente mira `tickServidor + RTT/DT + 2` e carimba cada comando com o seu tick local. A sala aplica o
comando em `clamp(tickCliente, tickAtual, tickAtual + 30)`. Assim o comando chega antes do tick previsto, e a
predição bate com o servidor (p95 do erro medido = 0 célula com RTT de 30 a 250 ms). Atraso maior que o previsto
aplica o comando no tick atual e vira correção.

## D-034 · Comando rejeitado conta para o ack (v0.6, 13/10/2026)

**Decisão.** Um comando rejeitado (taxa, fila, malformado) avança o `ultimoSeq` da sessão e é confirmado no próximo
`ackSeq`. O cliente o descarta dos pendentes e a reconciliação corrige a predição. Isso evita reenvios infinitos.

## D-035 · Patches próprios sobre mensagens do Colyseus (v0.7, 13/10/2026)

**Contexto.** A §3.6 recomenda que um adaptador copie o estado da simulação para o Schema do Colyseus, que então
distribui os patches.

**Decisão.** O Colyseus cuida de salas, matchmaking, WSS e reconexão. O estado vai como **patches nossos**
(`src/arena/patches.ts`): snapshot completo na entrada, na reconexão e na ressincronização; depois, só as entidades
novas e removidas e, das que continuam, **só os campos alterados**. Cada patch diz de qual tick parte; o cliente com
furo de sequência pede o estado completo.

**Motivos.** Uma só fonte de verdade (a simulação), sem uma segunda cópia em Schema; a mesma sala roda em loopback,
nos testes e no servidor; o cliente continua recebendo o `EstadoJogo` que já sabe desenhar e prever.

**Consequência.** Medido com 10 bots: ~20–25 KiB/s por cliente (meta ≤ 100 KiB/s). O corpo do patch é serializado
uma vez por transmissão; por sessão muda só o `ackSeq`.

## D-036 · O código da sala é o `roomId` (v0.7, 13/10/2026)

**Decisão.** A sala nasce com um código de 6 caracteres sem ambiguidade (sem 0/O, 1/I/L; 31^6 ≈ 900 milhões de
combinações), usado como o próprio `roomId` do Colyseus: entrar pelo código é um `joinById`. A busca
`GET /salas/:codigo` tem limite de 20 tentativas por minuto por origem. A rota de matchmaking do Colyseus não tem
esse limite; adivinhar um código entre centenas de milhões, com salas que duram minutos, não é viável.

## D-037 · Passo fixo do servidor pelo Colyseus (v0.7, 13/10/2026)

**Decisão.** O servidor usa o `setFixedTimestep` do Colyseus 0.18: 60 Hz com acumulador, poucos passos de
recuperação e descarte do atraso (sem espiral), nunca `requestAnimationFrame` (§2.2). A duração de cada tick vai para
a métrica `tickP95Ms`/`tickP99Ms`, registrada a cada 10 s.

**Medição local.** Tick isolado (10 jogadores conectados, sem rede): p95 1,1 ms, p99 2,4 ms. Com o gerador de carga
na mesma máquina, o p95 variou de 8 a 30 ms por disputa de CPU; a medição oficial é na VM, com a carga vindo de fora.

## D-038 · Servidor da arena na AWS Lightsail em São Paulo (v0.8, 13/10/2026)

**Contexto.** D-001 previa uma VM Oracle *Always Free*. Na Etapa 4, a Oracle respondeu "Out of capacity" em São Paulo,
tanto com 2 OCPU / 12 GB quanto com 1 OCPU / 6 GB, e nenhuma VM foi criada. Um serviço no Render (Virgínia) funcionou.
Numa amostra de HTTPS com conexão reutilizada, a mediana foi de 176,9 ms no Render e de 15,4 ms numa VM AWS em São Paulo.
A latência pesa na justiça da arena (§3.6).

**Decisão.**
- O servidor principal é uma instância **AWS Lightsail** `arena-sao-paulo` em `sa-east-1a`, com estas características:
  - Ubuntu 24.04 **amd64**, 2 vCPU, 1 GB de RAM e 40 GB SSD;
  - plano de **US$ 7/mês**, coberto pelos créditos da conta.
- A stack não muda: Docker Compose com servidor, Redis e Caddy; HTTPS/WSS por Let's Encrypt; endereço
  `dungeons-bruno.duckdns.org`.
- A imagem do servidor passa a ser publicada para **amd64 e arm64** (QEMU + Buildx), para servir à AWS e à Oracle.
- A região mostrada no lobby é `sa-east-1`.
- A porta 2567 fica presa a `127.0.0.1`; só 80/443 (Caddy) são públicas.
- **Oracle** continua como alternativa sem custo, documentada em `docs/IMPLANTACAO.md`. O **Render** fica como reserva
  manual, **sem failover automático**: trocar exige mudar `ARENA_URL` e republicar o Pages.

**Consequência.**
- A arena **deixa de ser hospedagem gratuita permanente**: custa US$ 7/mês, hoje pagos com créditos. O controle de
  custo é pelos créditos e pelos alertas do AWS Budgets. O alerta da Oracle não vale aqui, e os limites do *Always Free*
  (tráfego, disco, OCPU) não se aplicam.
- Enquanto não houver IP estático, parar e iniciar a VM muda o IP. Nesse caso é preciso atualizar o DuckDNS e o segredo
  `VM_HOST`.
- Com 1 GB de RAM, o script de preparação cria swap de 2 GB. A medição de carga oficial (marco 5B) é feita nesta VM.

## D-039 · Itens e nível no marco 6, só na campanha (v0.9, 13/10/2026)

**Contexto.** O marco 6 pede o ciclo lutar → recompensa → melhorar → lutar. A §2.10 completa (ouro, loja, baús,
atalhos de consumível) é do 9A e a progressão 1–20 com penalidade de morte é do 10A.

**Decisão.**
- Catálogo `src/data/itens.json` com 15 equipamentos (cobrindo os 10 slots) e 2 poções. Bônus de atributo absoluto ou
  percentual, como na §2.10, mais o campo próprio `bonusDefesa`: a spec não diz como o equipamento dá defesa.
- O jogador da campanha tem `bolsa`: atributos-base, equipamento, mochila e pontos. `atributos`, `defesa`, `hpMax` e
  `manaMax` continuam na entidade como valores **efetivos**, sempre recalculados da base por `recalcularFicha`. Assim
  dano, movimento e IA não mudaram.
- XP por nível em tabela (`balance.xp.tabela`), com fallback `nível × 100`. Cada nível dá 3 pontos e +5 de HP base.
  Os primeiros níveis são curtos (30, 60, 100 XP) para a fase 1 mostrar o ciclo.
- Drop de item num sorteio independente do orbe (10%; boss 100%, raridade mínima "raro"), por peso de raridade.
- A arena não ganha itens nem nível neste marco. O modo diz se solta itens (`loot.itens`), e o jogador da arena nasce
  da ficha de sessão sem `bolsa`, então os comandos de item são recusados. A `bolsa` também nunca vai no estado
  público: o inventário é privado (§3.6).
- Ouro, loja, baús e atalhos 1–9/0 de consumível ficam para o 9A, porque as teclas 1–4 são hoje das habilidades. A
  classe começa com uma espada (na mochila, para o jogador aprender a equipar) e duas poções.

**Consequência.** `versaoDoConteudo` muda (o catálogo de itens entra nas fontes oficiais), então servidor e Pages
precisam ser publicados juntos. Isso já acontece no merge.

## D-040 · A mochila não pausa a simulação (v0.9, 13/10/2026)

**Decisão.** A mochila é um `<dialog>` modal nativo. O jogador para ao abrir e a entrada de jogo fica bloqueada
(teclado ignorado, canvas e controles inertes), mas a simulação segue em tempo real: inimigos continuam agindo. É o
comportamento esperado num jogo de ação e o mesmo que valerá na arena, onde não há pausa. O menu de pausa da campanha
(§2.15) é outra tela e entra depois.

## D-041 · Save da campanha: estado inteiro, IndexedDB sem biblioteca (v0.10, 13/10/2026)

**Contexto.** A §3.5 pede vários slots, autosave, versão de schema com migrações, exportação/importação e gravação
fora do tick, sem conta e sem nuvem.

**Decisão.**
- Cada slot (1–3) guarda o `EstadoJogo` **inteiro** da campanha (ficha, mochila, posição, inimigos, respawns, PRNG e
  recargas), mais a referência da fase, o nome, as datas e estatísticas. O estado já é só dados e tem clone explícito,
  então não há um segundo formato para manter em sincronia, e continuar dá exatamente o mesmo jogo (mesmo digest).
- `src/save/esquema.ts` é puro: lê, migra degrau a degrau (`MIGRACOES[i]` leva da versão `i` para `i + 1`) e confere a
  forma de tudo que vem do banco ou de arquivo antes de gravar. Versão futura, slot fora, fase desconhecida, estado sem
  jogador ou número não finito são recusados com motivo.
- IndexedDB por um wrapper de ~80 linhas (`plataforma/banco.ts`), sem biblioteca. O banco nasce com os cinco stores da
  §3.5, para não precisar de migração de banco quando o editor (`aventuras`) e a arena chegarem.
- Autosave fora do tick (`setTimeout` depois do quadro, com cópia por `clonarEstado`) e serializado (uma gravação por
  vez; pedidos no mesmo instante viram um). Grava a cada 30 s, ao subir de nível, equipar, pegar item, derrotar
  inimigo, reviver, ao suspender (`visibilitychange`), em `pagehide` e no botão "Menu".
- Save ilegível nunca é sobrescrito: o slot aparece como inválido e o jogador decide excluir. Importação só em slot
  vazio.
- Sem IndexedDB (armazenamento bloqueado), a campanha roda sem salvar (`&slot=0`), com aviso.

**Consequência.** Mudanças futuras no `EstadoJogo` ou na entidade precisam de um degrau em `MIGRACOES` e de um teste,
senão saves antigos passam a ser recusados (e não corrompidos).

## D-042 · "Testar agora" navega por URL e não grava (v0.11, 13/10/2026)

**Contexto.** A §3.10 pede "Testar agora" com o personagem atual e atalho de volta ao editor. As telas do jogo
ainda não têm desmontagem completa (cena, laço, ouvintes); trocar de tela é navegação de página, como no menu.

**Decisão.**
- "Testar" grava o rascunho, valida e abre `?jogo=teste&fase=<id>`. "✎ Editor" no cabeçalho volta para a edição.
- O teste usa uma **cópia** do personagem do save jogado por último (mesma ficha, nível e mochila; vida e mana
  cheias), ou um personagem novo se não houver save, e **não grava nada**. Para jogar a fase "valendo", o jogador
  escolhe a fase ao abrir um jogo novo num slot (Campanha → slot vazio → Fase).
- O histórico de desfazer fica na memória da tela e se perde ao sair. O rascunho em si é salvo (a cada 10 s, ao
  suspender, ao testar e ao voltar).

**Consequência.** Quando a desmontagem de cena existir (marco 11A, editor completo), o teste pode virar uma camada
sobre o editor, mantendo o histórico.

## D-043 · Escopo do editor mínimo (v0.11, 13/10/2026)

**Decisão.** O marco 6 entrega, do editor da §3.10:
- pincéis de piso, parede, vazio e saída;
- início do jogador (único) e inimigos por preset;
- borracha de spawn e inimigo;
- desfazer/refazer por traço (pilha de 120);
- zoom de 0.1 a 6 com pinça, roda e "ajustar";
- modo navegação explícito;
- validação com erro (vermelho) e aviso (amarelo) marcados na célula;
- autosave do rascunho;
- testar, exportar e importar `.json` e Minhas fases (criar, editar, testar, duplicar e excluir).

Ficam para o 11A:
- balde, retângulo, portas, objetos e tileset;
- redimensionar, distribuir e aprendizado de estilo;
- inspetor por toque longo e aventura com várias fases.

O arquivo exportado é o mesmo schema das fases oficiais (`FaseJson`), validado por `validarFase` ao importar. Um
rascunho é guardado como está no store `aventuras`, inclusive inválido, para nunca perder trabalho. Testar e exportar
exigem a fase sem erros.

Avisos novos de `validarFase`: "fase sem inimigos" e "inimigo inalcançável a partir do spawn". Não bloqueiam.

## D-044 · Relatórios do teste com pessoas: anônimos, com consentimento, na VM (v0.12, 13/10/2026)

**Contexto.** A §5.7 pede medir tempo até a primeira luta, mortes, uso de habilidades, entendimento de drop e
equipamento e retorno ao combate, com pelo menos 5 pessoas. Os testadores podem estar longe, e pedir que copiem e
mandem arquivos perde dados.

**Decisão.**
- Só quem entra por `?pesquisa=1` é medido. É a campanha da fase 1, com personagem novo e sem save.
- O coletor (`src/pesquisa/coletor.ts`) só lê eventos que a simulação já publica; nada muda no jogo.
- "Terminar teste" abre um questionário: os 3 avisos desenhados como a telegrafia os mostra, entendimento dos itens e
  comentário. O envio exige consentimento marcado.
- `POST /relatorios` no servidor da arena:
  - corpo `text/plain`, para evitar o *preflight* de CORS;
  - validação pelo mesmo `lerRelatorio` do cliente, até 8 KiB e 10 envios/min por origem;
  - origens do navegador restritas ao Pages e a `localhost`;
  - cada envio vira uma linha em `/dados/relatorios.jsonl`, num volume Docker próprio.
- **Anonimato por construção**: o relatório não tem nome, IP, user agent nem identificador. O servidor grava só o
  relatório validado e a data. O comentário livre avisa para não escrever nome nem contato.
- O resumo (`npm run relatorios`) confere os critérios da §5.7.

**Consequência.** Os relatórios ficam só na VM, e baixá-los é um comando (docs/TESTES-HUMANOS.md). O teste em si fica
para quando houver pessoas disponíveis. O marco 7 só fecha depois dele.

## D-045 · Perfis de rede sobre o WSS real por proxy TCP local (v0.13, 13/10/2026)

**Contexto.** A §5.6 pede medir os perfis suportado (RTT 150 ms, jitter ±30, perda 1%) e degradado (250 ms, ±80, 3%)
no transporte WSS real, incluindo o bloqueio por retransmissão do TCP. Até aqui só o loopback (`RedeLocal`)
simulava isso.

**Decisão.**
- `tools/rede/proxy.ts`: proxy TCP em Node entre o cliente e um servidor `ws://`. Em cada sentido:
  - atraso de metade do RTT ± metade do jitter, com saída sempre na ordem de chegada (fila FIFO com um único
    temporizador; vários `setTimeout` com o mesmo vencimento podem trocar a ordem e corromper o WebSocket);
  - "perda" vira retransmissão (RTO de 350 ms no suportado e 450 ms no degradado), que segura tudo o que vem atrás.
- Perfis em dados: `tools/rede/perfis.json`.
- `npm run carga -- --perfil suportado|degradado` põe o proxy na frente de um servidor local. O teste de integração
  (`tests/integracao/rede-degradada.test.ts`) roda o mesmo caminho no CI.
- Sobre o `wss://` remoto (VM), a rede é a real: lá vale a medição dos celulares (marco 5) e a carga de 30 min.

**Consequência.** O RTT medido fica acima do nominal (por exemplo, 213 ms de p50 no suportado), porque inclui as
paradas de retransmissão e o passo de 60 Hz. As metas de qualidade valem no suportado; no degradado conferimos
integridade: sem rejeição, coleta única, estados iguais e reconexão.

## D-046 · Cena padrão da §5.6: arena-02 (v0.13, 13/10/2026)

**Decisão.**
- `arena-02` ("Cripta grande") tem 60×40, 20 NPCs (sete presets), 6 spawns e 4 orbes. É a cena padrão de benchmark
  da §5.6 e também uma arena jogável.
- Quem cria a sala escolhe a arena no lobby (`fase` ao criar, validada contra `fasesPermitidas` do Livre).
- Quem entra por código recebe a fase por `/salas/:codigo` e monta o mesmo contexto do servidor.
- As métricas da sala (tick p95/p99, jogadores) vão para a metadata do Colyseus a cada 10 s, e o `/saude` devolve o
  pior tick entre as salas. Como `setMetadata` substitui em vez de mesclar, o objeto vai sempre inteiro, com a fase.

A cena de carga máxima da §5.6 (120×120, invocações, avatares e armadilhas) depende de sistemas dos marcos 8–10 e fica
para o 11B.

## D-047 · Renovação do movimento mantido a cada 100 ms (v0.13, 13/10/2026)

**Contexto.** No perfil degradado, a carga mostrou rejeições por `taxa`. O cliente renovava a direção mantida a cada 3
ticks (20 comandos/s). Uma parada de retransmissão TCP entregava tudo de uma vez, e o ajuste de relógio do cliente
(até 2 ticks por quadro) dobrava a renovação, estourando o balde de 20 fichas.

**Decisão.** A renovação passa a cada 6 ticks (100 ms), cinco vezes dentro da expiração de 500 ms da sala. O balde
(60/s, rajada de 20) não muda: continua barrando inundação.

**Consequência.**
- Zero rejeições no degradado.
- A banda enviada por cliente caiu de 2,9 para 1,7 KiB/s.
- A correção no suportado continuou dentro da meta.

## D-048 · Semântica dos efeitos do registro (v0.14, 14/10/2026)

**Contexto.** A §2.8 lista os 26 tipos pelo nome e exige registro único, normalização e dispatcher único. Ela não diz o
que alguns tipos fazem exatamente, nem como acumulam.

**Decisão.** O 8A-1 liga 20 tipos. Os 6 de fluxo próprio entram no 8A-2.

*Forma e regras gerais*
- **Forma canônica**: `{ tipo, duracaoMs, valor, pct, em }`.
  - Campos que o tipo não usa ficam em 0, para que digest, clone e patch não tenham campo ausente.
  - `em: 'conjurador'` faz o efeito de uma habilidade cair sobre quem lançou (ex.: o raio vampírico cura o vampiro).
- **Acumulação**: reaplicar o mesmo tipo estende a duração e fica com o maior `valor`/`pct`. Nunca encurta e não soma
  pilhas.
- **Periódicos** (dano, cura, recurso): aplicam `valor` a cada 1000 ms (`balance.efeitos`), inclusive no último tick
  da duração. O dano periódico respeita `imune_dano` e conta participação para o XP.

*Semântica de cada tipo*

| Tipo | O que faz |
|---|---|
| `sem_movimento` | não anda, mas age |
| `sem_ataque` | bloqueia ações **físicas** (par do `silenciar`, que bloqueia as mágicas) |
| `modificar_dano` | −pct no dano **causado** |
| `bonus_dano` | +pct no dano causado. Bônus e reduções somam entre si e se multiplicam: `(1 + Σ+) × (1 − Σ−)` |
| `ab_dano` | soma ao bônus de atributo do ataque básico |
| `ab_recarga` | encurta a recarga do ataque básico, até 75% |
| `ab_alcance` | células a mais de alcance no ataque básico |
| `ab_multi_alvo` | N alvos extras no alcance, os mais próximos primeiro |
| `imune_dano` | zera todo dano, mas não a cura |
| `fantasma` | não colide com entidades |
| `atravessar` | os projéteis próprios perfuram, sem repetir alvo |
| `cura` | instantâneo: `valor` fixo + `pct` do máximo |
| `recuperar_recurso` | com duração, mana por intervalo; com duração 0, instantâneo, como a `cura` |
| `teleporte` | para a célula mirada, se livre e passável |
| `avanco` | até `valor` células em direção à mira, sem passar dela |
| `empurrao` | até `valor` células para longe da origem, parando no primeiro obstáculo |

*Autoria e uso*
- **Normalização**: aceita a forma canônica ou o objeto combinado (`{ "atordoar": 1500, "dano_periodico": 3 }`). Campo
  omitido usa o padrão do registro só quando nenhum campo do tipo foi dado (`{ "tipo": "cura", "pct": 40 }` cura 40%,
  sem somar o valor padrão).
- **Consumíveis**: passam pelo mesmo dispatcher (`curar` → `cura`, `restaurarMana` → `recuperar_recurso`).
- **Orbe de efeito**: drop de 8%, num sorteio próprio. O sorteio e a lista do editor só leem o registro.
- **Conteúdo**: aranha (teia → `sem_movimento`), cultista e boss (marca → `dano_periodico`), slime (golpe viscoso →
  `modificar_dano`), orc (golpe pesado → `empurrao`) e vampiro (raio vampírico → `cura` em si).
  - `teleporte`, `avanco` e o restante são exercitados nos testes e nos orbes.
  - Ganham habilidades de jogador com as classes do 10A.

**Consequência.**
- O save passa à versão 2, com o primeiro degrau real de migração (D-041).
- A `versaoDoConteudo` muda, então servidor e Pages sobem juntos no merge.

## D-049 · Efeitos de fluxo próprio no 8A (v0.15, 14/10/2026)

**Contexto.** Os 6 tipos restantes da §2.8 precisam de estado próprio e tocam as §2.9 (invocações e dominação) e
§2.11 (armadilhas), que o roteiro detalha no 10A.

**Decisão.**
- **Forma**: o efeito canônico ganhou `interno`, com um nível de aninhamento (o efeito carregado por atrasado, rastro
  de efeito e armadilha), e `ref` (o preset do `invocar`). Os dois ficam em `null` quando não usados.
- **Normalização idempotente**: normalizar a forma canônica de novo devolve o mesmo efeito, porque a fase é validada
  mais de uma vez. Há teste para os 26 tipos.
- **`efeito_atrasado`**: dispara o efeito carregado na entidade-alvo depois do prazo, se ela estiver viva.
- **Rastros**:
  - enquanto o status está ativo, cada célula em que a entidade fica vira rastro por 3 s (`balance.efeitos`);
  - o hostil que entra leva o dano, ou o efeito carregado, uma vez por célula;
  - os rastros vencidos saem a cada tick;
  - `rastro_dano` é elegível ao orbe, com peso 2.
- **Armadilha de habilidade**:
  - armada uma vez no lançamento (`aoLancar`), na célula mirada;
  - o primeiro hostil por `relacao()` que pisa leva o dano e o efeito carregado, e a armadilha some;
  - expira pelo prazo;
  - **fica fora do estado público**: a §2.11 diz que é invisível para quem não a colocou, e o estado público é igual
    para todos até o canal privado do 8B. Na campanha, só o jogador que armou a vê. As armadilhas de fase entram no
    9A/10A.
- **`invocar`** (mínimo):
  - cria aliados de um preset, na equipe do dono, vizinhos dele, com prazo;
  - a IA normal faz a invocação caçar hostis por `relacao()`; sem alvo, ela segue o dono a 2 células;
  - morre pelo prazo ou com a morte do dono;
  - sem XP para quem a mata, sem drops e sem respawn.
  - Os comportamentos (agressivo, assassino, protetor, curador, isca), os avatares e a rampa ficam no 10A.
- **Dominação**:
  - o efeito fica **no alvo** (§2.9);
  - quem morre marcado volta com 50% do HP, na equipe de quem o marcou, como invocação dominada (velocidade ×1,3),
    por 60 s;
  - sobrevive à morte do dono;
  - dominados não dominam (cascata limitada a 1).
- **Limites do modo** (`invocacoesPorJogador`, `armadilhasPorJogador`): a ação é recusada antes de cobrar recurso e
  recarga (motivo `limite`, §5.6). O harness confere os limites a cada tick.
- **IA com habilidades**: inimigos com habilidades revezam golpe e habilidades em rodízio, e caem no golpe quando a da
  vez está em recarga ou no limite.
- **Conteúdo**:
  - o boss invoca 2 goblins e o golpe dele atordoa com 1,5 s de atraso;
  - o slime deixa gosma que prende;
  - a aranha arma teia invisível.

**Consequência.**
- Save na versão 3 (degrau v2 → v3).
- Rastros e efeitos atrasados entram nos patches da arena. A banda com 10 bots seguiu em 38 KiB/s.

## D-050 · Economia do 9A: ouro, loja, baús, atalhos e ordenação (v0.16, 14/10/2026)

**Contexto.** A §2.10 pede ouro como moeda única, loja, baús com chave, atalhos de consumível e ordenação manual da
mochila. Algumas regras não estão fechadas na spec ou colidem com decisões anteriores.

**Decisão.**
- **Ouro**:
  - fica na bolsa (`Bolsa.ouro`), inteiro e nunca negativo;
  - quem começa a campanha tem `economia.ouroInicial` (15);
  - inimigos derrubam ouro na primeira morte, `round(xp × ouroPorXp × [0,5; 1,5))`, como objeto coletado ao pisar;
  - só cai ouro onde o modo solta itens (`loot.itens`); a arena continua sem economia (a ficha de sessão não tem
    bolsa).
- **Interação** (`interagir`, tecla `E` ou o botão ✋ no toque): o baú ou a loja mais próximos a Chebyshev ≤ 1;
  empate pelo `objetoId`. Baú e loja são passáveis (ninguém precisa contorná-los) e não são coletados ao pisar.
- **Congelamento**: enquanto a interação durar, o jogador não começa passo nem ação (as consultas de bloqueio
  perguntam `congelada()`); o passo em curso termina, como no atordoamento (D-017). A simulação segue (D-040): dá
  para apanhar com a loja aberta.
- **Loja**:
  - janela de 5 s; compra pelo `valorBase`, venda por `floor(valorBase × 50%)`, uma unidade por vez;
  - o estoque é **ilimitado** na v1: a loja é o dreno de ouro, não um recurso disputado (a §3.6 permite declarar o
    estoque em dados; fica para quando houver um caso);
  - item com `valorBase` 0 (a chave) não é vendável; o equipado não está na mochila, então não se vende;
  - fechar, acabar a janela ou morrer arma a recarga de 10 s por jogador e loja, no mesmo mapa monotônico das
    recargas de habilidade (`loja:<objeto>:<entidade>`);
  - o modal abre sozinho quando a simulação abre a janela e fecha quando ela acaba.
- **Baú**:
  - um abridor por vez (§3.6): `interagir` reserva o baú e congela por 3 s; a entrega acontece no fim, como
    transação no tick (confere a reserva e a chave, consome a chave, guarda os itens e soma o ouro);
  - o que não couber na mochila cai ao lado do jogador;
  - morrer durante a abertura libera a reserva sem entregar; a chave só é gasta na entrega;
  - aberto, fica vazio no mundo por 5 s e some;
  - o conteúdo fica fora do estado público da arena; o que veio aparece no evento `bauAberto`.
- **Loot posicionado**: o objeto `loot {itemId, quantidade}` da fase vira o mesmo objeto `item` dos drops, com a
  quantidade no `valor`; só é coletado se a quantidade inteira couber.
- **Item `chave`**: tipo novo, sem slot nem efeito e fora dos drops. A validação da fase exige que a chave do baú
  seja um item desse tipo e que todo item de baú, loja e loot exista no catálogo.
- **Atalhos de consumível**: a §2.10 pede 1–9 e 0, mas 1–4 já são das habilidades (D-039). Ficam **5, 6, 7, 8, 9 e
  0** para os 6 primeiros consumíveis na ordem da mochila; a mochila mostra a tecla de cada um.
- **Ordenação manual**: o comando `moverItem` leva a entrada a uma posição; a interface tem ▲▼ em cada linha (no
  toque também, sem fechar o modal). A ordem é a do array da mochila, então já vai no save.
- **Editor**: continua posicionando só orbes. Ao importar uma fase com baú, loja ou loot, esses objetos ficam fora
  da edição; a ferramenta deles entra no 9A-2 ou no 11A.

**Consequência.**
- Save na versão 4 (degrau v3 → v4) e balance v9.
- Os objetos ganharam campos uniformes (`itens`, `ouro`, `chave`, `abertoTick`, `abridorId`), neutros nos tipos que não
  os usam.

## D-051 · Spawner dinâmico e armadilha de fase (v0.17, 14/10/2026)

**Contexto.** A §2.1 define o spawner (categorias, máximos, chances, carência, intervalo e regra da célula) e a §2.11
a armadilha de fase (invisível, única ou com rearme). Faltava dizer como contar, quem é o dono e o que cada objeto traz.

**Decisão.**
- **Spawner** (`world/spawner.ts`, etapa 9 do tick, só com `modo.spawnerDinamico`):
  - não guarda estado: roda no fim da carência (20 s) e a cada intervalo (90 s), pelo tick;
  - para cada categoria (baú, loot, orbe, armadilha, nessa ordem), se o que **ele mesmo** criou estiver abaixo do
    máximo, sorteia a chance. Conta os objetos de id `s:` e as armadilhas de `origem: 'spawner'`; o conteúdo autorado
    e os drops não ocupam vaga;
  - a célula sai de até 40 sorteios: passável, sem entidade (posição ou destino), sem objeto ou armadilha, e a
    Chebyshev ≥ 4 de todo jogador; se nenhuma servir, a categoria espera a próxima rodada;
  - **baú** sempre destrancado, com 1 a 2 itens pelo mesmo sorteio de raridade dos drops (`progression/sorteio.ts`) e
    10 a 30 de ouro; **loot** é um item desse sorteio; **orbe** é 40% vida, 30% mana (valores dos drops) e 30% efeito
    (`sortearEfeitoDeOrbe`); **armadilha** dá 8 de dano, dispara uma vez e expira em 180 s;
  - baú e loot só onde o modo solta itens (`loot.itens`): na arena (Livre), só orbes e armadilhas;
  - números em `balance.spawner`; tudo pelo PRNG do estado.
- **Armadilha de fase**:
  - objeto `armadilha {valor, efeito?, modo: 'unica' | 'rearme', rearmeMs}` na fase; o efeito tem um componente;
  - dono e equipe `fase` (`DONO_FASE`): o disparo segue `relacao()`, então pega jogadores **e inimigos** na campanha
    e todo mundo na arena; não dá XP a ninguém;
  - é permanente; com rearme, fica inerte pelo prazo depois de disparar e volta;
  - a armadilha ganhou `origem`, `permanente`, `rearmeTicks` e `inerteAteTick`; só as de **habilidade** contam no
    limite do jogador (`armadilhasPorJogador`);
  - segue invisível: fora do estado público e sem desenho (a camada só mostra as do jogador local).
- **Conteúdo**: na fase 1, uma armadilha única no corredor para a sala B e uma com rearme de 8 s e atordoamento curto
  no corredor da sala de baixo.

**Consequência.**
- Save na versão 5 (degrau v4 → v5) e balance v10.
- O harness confere a cada tick os máximos do spawner; o teste de 10 mil ticks passa por duas rodadas dele.

## D-052 · Portas e troca de fase da campanha (v0.18, 14/10/2026)

**Contexto.** A §2.1 define portas internas de teleporte, porta de saída com tranca (`livre`, `chave`, `boss`), boss
que abre a passagem e troca de fase que isola o estado. A campanha tinha uma fase só e a saída `S` não fazia nada.

**Decisão.**
- **Fase**: `portaSaida {x, y, tranca, chave?, bossIndice?}` (numa célula `S`; o boss é o índice na lista de
  inimigos) e `portasInternas [{numero, nome, a, b}]`. Sem `portaSaida`, toda `S` é saída livre (as fases do editor
  continuam funcionando sem nada novo).
- **Gatilho por célula alcançada** (§2.3): porta só reage a quem **completou um passo** naquele tick (evento `moveu`);
  ficar parado em cima não teleporta de volta nem repete o aviso. As portas vêm antes da coleta e das armadilhas.
- **Porta interna**: leva ao outro extremo ou ao primeiro vizinho livre; recarga de 800 ms por entidade no mapa de
  recargas (`porta:<id>`); NPCs cruzam com a chance do modo (`modo.portas.inimigosCruzamChance`, 0,5), sorteada pelo
  PRNG da IA.
- **Porta de saída**: só jogadores. A chave é consumida e a porta fica aberta (`estado.saidaAberta`); a de boss abre
  quando o boss indicado morre e não fecha mais, mesmo que ele reapareça. Boss morto numa fase sem saída nenhuma deixa
  uma porta temporária (objeto `saida`) onde caiu; ela pisca por 30 s e continua usável.
- **Troca de fase**: a sequência da campanha está em `data/campanha.json`. Ao chegar à saída aberta, `jogo.ts` monta o
  registro novo com `avancarFase` (pura, em `save/transicao.ts`), grava no slot e **recarrega a sessão**. Recarregar
  isola tudo o que a §2.1 pede (timers, recursos gráficos, destino de navegação) sem uma segunda cena em memória.
  - A fase deixada vai para `fasesVisitadas`, sem o jogador e as invocações dele; voltar a ela restaura o estado.
  - O personagem leva ficha, mochila e ouro, com vida e mana cheias.
  - No teste do editor, a saída conclui a fase e volta ao editor; no fim da lista, aparece "Fim da campanha (por
    enquanto)" até o 10A-2 gerar fases.
- **Conteúdo**: a fase 1 fecha a saída com o boss; a fase 2, "Catacumbas", tem loja, um atalho (porta interna), uma
  armadilha com rearme e a saída trancada pela chave da cripta, guardada num baú. A `arena-02` passou para a ordem 101,
  junto da `arena-01` (a ordem 2 é da campanha).

**Consequência.**
- Save na versão 6 (degrau v5 → v6: `saidaAberta` e `fasesVisitadas`) e balance v11.
- O autosave é suspenso na troca, para a gravação da fase antiga não chegar depois da nova.

## D-053 · Fases geradas, morte, descanso e regeneração por célula (v0.19, 14/10/2026)

**Contexto.** Depois das Catacumbas a campanha acabava. A §2.1 manda gerar a próxima fase quando não há uma, e a §2.12
define a penalidade de morte, o descanso e a regeneração por célula, sem fechar todos os detalhes.

**Decisão.**
- **Gerador** (`world/gerador.ts`, puro e semeado), como na §2.1: salas de 4–10 × 3–8 em até `salas × 20`
  tentativas com margem de 2, corredores em L, um par de portas internas a cada 10 salas (Chebyshev ≥ 20, relaxando
  para 15 e 10), boss na última sala (com mais de 2 salas) e `1 + floor(rand × min(3, floor(l × a / 8)))` inimigos
  comuns nas demais. Além disso:
  - a primeira sala tem o início e uma **loja** (o estoque das geradas está em `data/campanha.json`);
  - a saída fica na última sala, trancada pelo boss (livre quando não há boss);
  - a sala do início não recebe inimigos;
  - a saída passa pela mesma `validarFase` do conteúdo oficial (o teste confere 200 sementes).
- **Sequência**: depois da última fase oficial vem "Profundezas 1", depois a 2, e assim por diante. Cada uma tem
  `salas = anterior + rand(0..3)` (6 + rand na primeira, até 20), `nivelInimigos + 1` (4 na primeira, até 20) e
  `matizGraus + 28`, sorteados pelo hash do id da fase atual. O tamanho é o preset padrão de 60 × 40.
- **Save**: a referência `gerada` guarda só os parâmetros (`{id, numero, params}`); a fase é gerada de novo ao abrir.
- **Matiz**: o terreno gira a paleta de cores uma vez por fase, em vez de um filtro por quadro (mais barato no
  celular).
- **Morte** (regra no modo, `sobrevivencia.penalidadeMorte`): na campanha, −50 XP e de 10% a 50% do ouro, sorteado
  pelo PRNG do estado. O ouro perdido **some**. `perdeNivel` existe e está testado, mas fica desligado: o XP para em 0.
  Com ele ligado, cada nível perdido revoga os pontos, primeiro os não distribuídos, depois os dos atributos-base
  acima de 10. No Livre não há penalidade.
- **Descanso** (comando `descansar`, tecla R ou Shift+R, botões na ficha), só onde o modo permite e sem hostil
  perseguindo:
  - congela como o baú;
  - o curto leva 3 s e devolve 50% da vida e 30% da mana (a "estamina" da §2.12 é a mana até existir outro
    recurso);
  - o longo leva 10 s, enche tudo e antecipa o fim das recargas do jogador;
  - se um hostil passa a perseguir, o descanso é interrompido sem recompensa.
- **Regeneração por célula**: +1 de vida e +1 de mana por passo completo do jogador, bloqueada com hostil em
  perseguição, só onde o modo liga (campanha).

**Consequência.**
- Save na versão 7 (degrau sem conversão: a forma nova da referência e da interação só acrescenta) e balance v12.
- O modo ganhou `sobrevivencia` (regeneração por célula, descanso e penalidade de morte).

## D-054 · Invocações completas, avatares e dominação (v0.20, 14/10/2026)

**Contexto.** O 8A-2 deixou o mínimo da §2.9 (D-049). Faltavam os comportamentos, a IA própria, a rampa, a dispensa,
os avatares e a cascata configurável. A barra de habilidades da classe já ocupa as 4 teclas.

**Decisão.**
- **Dados**: o preset ganha um bloco `invocacao {comportamento, avatar?, golpes?, cura?, explosao?}`; a entidade
  guarda comportamento, avatar, golpes restantes, abates, tick de criação e nível de dominação. Quem não vem de um
  preset de invocação (lacaios do boss, dominados) é `agressivo`.
- **IA própria** (`entities/ia-invocacao.ts`), no lugar da IA comum:
  - raio de engajamento de 5 e ataque adjacente (Chebyshev ≤ 1) no ritmo do preset;
  - sem alvo, segue o dono a 2 células;
  - passo a cada 380 ms (dominados mantêm a velocidade ×1,3 sobre a da ficha);
  - alvos sempre por `relacao()`: `agressivo` o mais próximo, `assassino` o de menor HP, `protetor` só quem ameaça
    o dono (persegue ou feriu na janela de participação) a até 3 células dele, sem se afastar mais que isso;
  - `curador` não ataca e cura o dono pelo dispatcher, com recarga própria;
  - `isca` é imóvel;
  - ao engajar, fica em `perseguindo`, e o descanso e a regeneração enxergam o perigo.
- **Colisão**: invocação não bloqueia aliado da mesma equipe; o avatar continua bloqueando sempre.
- **Avatar**:
  - nasce com `tipo: 'avatar'` e arquétipo `boneco` (imóvel, fora da IA);
  - os golpes vêm da fórmula do preset (`1d4`), pelo PRNG do estado;
  - **todo dano maior que zero passa por `registrarParticipacao`**, então o golpe é contado ali, num ponto só;
  - hostis o preferem como alvo (`prioridadeDeAlvo`, usada pela IA, pelo auto-alvo e pelas invocações): é regra de
    escolha de alvo, não de hostilidade;
  - conta no limite próprio `avataresPorJogador`.
- **Isca explosiva**: ao cair, fere os hostis no raio com dano fixo.
- **Rampa**: `1 + min(50%, 10% por minuto + 5% por abate)`, multiplicando o dano causado (`fonteDe`).
- **Dispensa**: comando `dispensar` (tecla X e botão na ficha), sem XP para ninguém; dominados não são dispensados.
- **Dominação**: a cascata é `balance.invocacoes.cascataDominacao`; com 1 (padrão), dominados não dominam.
- **"Funil único de dano com redução plana"** (§2.9): as invocações recebem dano pelo mesmo funil de todo mundo, e a
  redução plana é a defesa do preset. Não há um segundo funil.
- **Conteúdo**: como a barra está cheia, o jogador invoca por **pergaminhos** (consumíveis com `invocar`): lobo
  espiritual (agressivo), sombra (assassino), sentinela (protetor), fada (curadora) e espantalho (avatar explosivo).
  - Vendidos na fase 2 e nas geradas, e também caem como drop.
  - Pergaminho acima do limite é recusado antes de gastar (`limite`).
  - Os presets de invocação ficam fora dos inimigos comuns do gerador.

**Consequência.**
- Save na versão 8 (degrau v7 → v8, inclusive nas fases visitadas) e balance v13.
- Com o 10A-3, o marco 10A está concluído.

## D-055 · Sugestões de capacidades, áudio e ordem da convergência (v0.21, 14/10/2026)

**Contexto.** O projetista enviou [`SUGESTOES-CAPACIDADES.md`](SUGESTOES-CAPACIDADES.md) (v1.1): personagens e fases
por imagem, trilha na nuvem e efeitos de habilidade em duas faces (visual e mecânica). O documento cita a spec v3.0;
a v4.0, que seguimos, já incorpora parte das ideias (token próprio do jogador, caminhada por fatias, tileset com
herança, cópia temporária do atlas na sala da arena). Ao mesmo tempo, decidimos fazer os marcos de convergência
(12 a 15) antes de 11A e da trilha da arena.

**Decisão.**
- **Adotado como princípio**: o jogo é um motor; conteúdo trazido de fora (imagem, áudio, descrição de efeito) é
  **dado, nunca programa**. Ele é validado, limitado e, se falhar, substituído por um padrão visível ou audível, com
  aviso em linguagem simples. Nada vindo de fora quebra o jogo.
- **Personagens por imagem** (adotado, marco 13): imagem única para jogador, inimigo ou invocação, animada pela
  caminhada por fatias da §2.16. O jogo recorta a transparência, normaliza o tamanho (altura de 1,12 célula, origem
  nos pés), limita dimensão e peso, troca imagem inválida por um marcador e mantém por cima os marcadores de equipe,
  conjuração e estado. O envio pelo jogador entra no 11A; o compartilhamento na arena, no 8B.
- **Fases por imagem** (adotado como tileset da §2.16, marco 11A): blocos com encaixe automático, herança entre fases
  e prévia no editor, sem nunca esconder a diferença entre chão, parede e interativo. "Fundo único" e "colagem" ficam
  fora da v1.
- **Trilha sonora**:
  - adotados: trilha por contexto (exploração, combate, chefe) com transição suave, **trilha padrão que nunca deixa o
    jogo mudo**, música por fase escolhida por quem cria, com prévia, e créditos;
  - **recusado: buscar áudio em endereços remotos**. Revela o jogador (IP) ao dono do endereço, quebra a campanha
    offline (critério de aceite 5), esbarra em bloqueio de origem (CORS) dos hosts e complica direitos. A §2.14 e a
    regra 11 da §5.3 continuam como estão;
  - no lugar disso, **o jogador importa arquivos de áudio**: guardados no IndexedDB, exportados junto com a
    aventura, com limite de tamanho e crédito (marco 11A);
  - a **trilha padrão é sintetizada pelo próprio jogo** (Web Audio): sem arquivos, sem licença de terceiros e quase
    sem peso (marco 12).
- **Efeitos de habilidade**:
  - a face mecânica já existe (D-048, D-049, D-054);
  - a ligação entre as faces já é regra (a simulação não conhece a tela; a telegrafia usa os ticks da ação). O marco
    12 ganha o teste "o mesmo digest com e sem efeitos visuais";
  - **adotado no marco 12**: cada habilidade descreve o visual como dado (bloco `visual` com conjuração, viagem,
    impacto e efeito persistente, montados de presets de partícula). Sem o bloco, o visual é deduzido dos efeitos do
    registro, então todo efeito mecânico tem expressão visual. O editor de efeitos com prévia entra no 11A.
- **Ordem e tamanho das entregas**: um PR por marco, sem subdivisões, na ordem **12 → 13 → 14 → 15**, depois **11A**
  e a trilha da arena (**8B → 9B → 10B → 11B**), com o 7C quando houver pessoas.
  - **14** e **15** entram agora no que é campanha, modo Livre, celular, PWA e desempenho.
  - O que depende da arena (fichas justas por modo após o 10B, recuperação após o 9B, sessão real de 10 pessoas no
    11B) fica registrado e é fechado quando a trilha da arena voltar.

**Consequência.** O roteiro do README foi reescrito com esse escopo. Os "sinais de que está funcionando" da §7 das
sugestões viram itens de verificação dos marcos 12, 13, 11A e 8B.

## D-056 · Marco 12: áudio sintetizado, interface, efeitos como dado, qualidade e acessibilidade (v0.22, 14/10/2026)

**Contexto.** O jogo não tinha som, minimapa, pausa, configurações, guia nem efeitos além dos marcadores. A D-055
fixou a trilha sintetizada e os efeitos visuais descritos como dado.

**Decisão.**
- **Fronteira**: tudo o que é novo vive em `src/audio`, `src/render` e `src/ui`, só lê estado e eventos. Um teste
  varre os imports do núcleo (nenhum `render`, `audio` ou `ui`) e outro confere que o digest é o mesmo com e sem o
  bloco `visual` das habilidades.
- **Áudio** (`src/audio`):
  - todos os sons nascem de osciladores, ruído e envelopes (Web Audio); nenhum arquivo;
  - o contexto só existe depois do primeiro gesto; sem Web Audio, o jogo segue mudo;
  - limites da §2.14 (80 ms entre o mesmo som, 4 vozes por som, passos de 450 ms por entidade e 140 ms no total);
  - som posicional linear até o silêncio a 20 células, com multiplicador 0,75;
  - som por habilidade: o `visual.som` do conteúdo, depois o prefixo do id, depois o tipo de ataque;
  - **música procedural**: um laço de 4 compassos por fase e clima, gerado de `hash(faseId)`, então a mesma fase
    toca sempre a mesma música. A tônica é a mesma nos três climas, e trocar de clima é um fade de 800 ms;
  - **clima**: combate quando um hostil persegue o jogador; chefe quando esse hostil é um boss. Só "desce" depois
    de 4 s sem o sinal;
  - **fontes sonoras da fase** (`fonte_som`: fogo, água, vento, goteira) são só apresentação e não entram no estado.
- **Interface**:
  - **minimapa** com as cores da §2.15;
  - **prompt de interação**: a mesma escolha de `interagir`;
  - **pausa**:
    - `Esc` contextual: cancela a mira antes de pausar. O `Esc` que vai ao jogo chama `preventDefault`; senão, a ação
      padrão do navegador fecharia na hora o diálogo que ele mesmo abriu;
    - só a campanha pausa, e o laço descarta o tempo acumulado. Na arena, o menu abre e o mundo segue;
  - **configurações persistidas**: qualidade, tremor e flash, volumes, mudo, modo de câmera, enquadrar dois,
    controle, escala da interface e movimento reduzido. Os botões de câmera e controle saíram do cabeçalho;
  - **guia**;
  - **menu com fundo procedural**.
- **Efeitos visuais**:
  - `Habilidade.visual` é dado puro, com presets de partícula por momento (conjuração, viagem, impacto), cor,
    câmera e som. Sem o bloco, `visualDe` deduz o visual da habilidade e do registro;
  - partículas em sprites reaproveitados, com o PRNG visual (`Math.random`), nunca o da simulação;
  - auras para os status ativos;
  - presets de impacto (tremor, flash, soco de zoom e congelamento) até 3 por vez, com fila. O congelamento segura
    só o desenho por ~60 ms;
  - **floração** substituída por brilho aditivo, para não trazer `pixi-filters` como dependência;
  - **luz** radial aditiva com a cintilação da §2.16, no jogador, nas portas, na loja, nos baús e no fogo;
  - **enquadrar dois** (só campanha) com o alvo selecionado a até 8 células, respeitando 4 s depois de mexer na
    câmera.
- **Qualidade**:
  - presets mínimo, baixo, médio e alto: partículas 0, 120, 300 e 600; luz a partir do médio; poeira só no alto;
  - padrão: baixo no toque, alto no desktop;
  - com "automática", desce um nível com média abaixo de 45 fps em duas verificações seguidas de 5 s e avisa;
    nunca sobe sozinha. No painel de navegador do app em segundo plano (~30 fps) ela desce até o mínimo, como a
    regra manda.
- **Ajuste depois de jogar** (v0.24): o brilho em volta do jogador caiu pela metade (`intensidade` 0,5 só nessa luz),
  e o tremor e o flash também (leve 2 px; forte 4,5 px e flash 0,11; dano 2,5 px e flash 0,09). Duração,
  congelamento e soco de zoom ficaram iguais.
- **Acessibilidade**:
  - `--escala-ui` aplicada aos blocos da interface;
  - movimento reduzido (sistema, sempre ou nunca) desliga tremor, flash, congelamento, soco de zoom e as animações
    de CSS. As qualidades mínimo e baixo também desligam as animações de CSS.

**Consequência.**
- O `skills.json` ganhou o bloco `visual` nas 16 habilidades, o que muda a versão do conteúdo da arena: cliente e
  servidor são publicados juntos.
- Os números de fps e p95 por qualidade em aparelhos reais ficam para o marco 15 (benchmarks).

## D-057 · Sistema de habilidades e a nova ordem da convergência (v0.23, 14/10/2026)

**Contexto.** Jogando, o usuário sentiu duas faltas:
- **Clareza dos efeitos**: o HUD mostra só o ícone, o nome aparece apenas ao passar o mouse e não há duração nem
  descrição.
- **Poucas habilidades**: uma classe com 4 habilidades fixas.

Ele também trouxe o modelo do jogo anterior e ideias de composição
([`SUGESTOES-HABILIDADES.md`](SUGESTOES-HABILIDADES.md)). Os 26 efeitos de lá são, na prática, o registro que já
fizemos no 8A.

**Decisão.**
- **Novo marco 14, "Sistema de habilidades"**, num PR só (D-055). O rebalanceamento passa a ser o **15** e o
  endurecimento, o **16**. A ordem fica **13 → 14 → 15 → 16**, depois 11A e a arena.
- **Adotado no 14**:
  - **Habilidade por composição**: camadas independentes de efeito, forma, tempo, custo, tema e apresentação, todas
    em dados. O catálogo escrito à mão vira uma coleção de boas combinações.
  - **Formas novas**: linha, cone e ao redor de si.
  - **Alvos novos**: um aliado, todos os aliados e área livre.
  - **Custos novos**: vida.
  - **Efeitos pequenos que faltavam**: escudo (vida temporária), puxão e trocar de lugar.
  - **5 elementos**, cada um com um estado e uma sinergia, em tabela de dados. Escolha inicial:
    - fogo: queimando;
    - gelo: resfriado, que acumula até congelar;
    - raio: eletrizado, que salta entre alvos;
    - veneno: envenenado, com menos cura recebida;
    - psíquico: exposto, que recebe mais dano.

    Os números e as sinergias exatas saem do plano do marco. O psíquico vem do modelo anterior, no lugar de
    "sagrado".
  - **Interações em tabela de dados**: regra de acúmulo por tipo, sinergias, oposições, resistências e imunidades por
    preset, e teto de efeitos por entidade.
  - **Orçamento de poder**: custo por peça e orçamento por habilidade, que depende do nível do personagem e do modo.
    Vale para o catálogo, as evoluções, os livros e as habilidades geradas. Estende os orçamentos da ficha da arena
    (§3.7).
  - **Ranks e liberação por nível** (`nivelMinimo`, §2.8). O rank escala dano, efeitos adicionais e visual.
  - **Árvores de evolução** (escolha entre 2 ou 3 caminhos) e **modificadores** (atravessar, ecoar, encadear, maior e
    mais lenta), inclusive vindos de equipamento.
  - **Classes novas** (guerreiro, mago e arqueiro, além do aventureiro), com afinidades por etiqueta que mudam como
    cada habilidade funciona para o personagem.
  - **Livros de habilidade** (item novo).
  - **Habilidades geradas por semente**: o tema puxa forma, efeitos, visual e som, e o resultado passa pelo
    orçamento. Dão repertório próprio aos inimigos das fases geradas e aos livros raros. O código curto da semente
    serve para compartilhar (e, no 8B, para a arena).
  - **Barra escolhida pelo jogador** (4 habilidades nas teclas 1–4) e a **roda de habilidades** no toque (§4.6).
  - **Efeitos legíveis**:
    - chips com anel de duração e segundos restantes;
    - cartão com nome, o que faz (com os números) e a origem;
    - aviso ao ganhar um efeito;
    - **descrição gerada automaticamente** a partir das peças, para habilidades, efeitos, itens e livros;
    - **gramática visual**: a cor diz o elemento, a forma diz a área.
- **Habilidades reativas**: só **passivas** neste ciclo. Reação, interrupção, ação bônus, ação livre e os gatilhos
  ficam fora: pesam na legibilidade em tempo real.
- **Adaptado**: os conceitos de turno do modelo anterior viram tempo ("por turno" passa a "por segundo"; "N turnos"
  passa a segundos).
- **Recusado**:
  - **crítico com texto livre**: já há a tabela do d20;
  - **atravessar paredes**: conflita com a grade, a navegação e a colisão. Fica o "atravessar" atual, de projétil
    através de alvos.
- **Fora do 14, por depender da arena**: limites de rank, evolução e orçamento por modo de arena ("fichas justas") no
  10B; a habilidade gerada trafegando por semente, no 8B.

**Consequência.** O README ganhou o marco 14 novo e renumerou os seguintes. A criação de habilidades pelo jogador
continua no editor (11A), sobre as mesmas peças e o mesmo orçamento.

## D-058 · Marco 13: visão isométrica, modelos de criatura, caminhada por fatias e personagem por imagem (v0.25, 14/10/2026)

**Contexto.** A cena era só de cima, com silhuetas geométricas por arquétipo. A §2.16 pede a visão isométrica, os
modelos de criatura gerados no build e a caminhada por fatias; a §4.5, a direção certa no isométrico; a D-055
adotou o personagem por imagem.

**Decisão.**
- **A visão é só do cliente.** A simulação não sabe dela: a câmera, as camadas e a entrada mudam; os comandos, não.
  Um teste joga a mesma semente pela entrada isométrica (remapeamento do teclado e projeção do toque) e confere o
  mesmo digest.
- **Projeção** (`render/projecao.ts`, pura): tudo é desenhado em "px de plano" (1 célula = 48 px).
  - De cima, a projeção é a identidade.
  - No isométrico, 2:1 clássica: `x = (px − py)/√2 + desloc`, `y = (px + py)/(2√2)`, com o deslocamento que leva
    o mundo projetado a começar em 0.
  - A câmera opera no mundo projetado, com a mesma janela morta, zoom e limites. O toque vira célula por
    `desprojetar`, e o descarte do terreno usa a caixa dos cantos da vista desprojetados.
  - Trocar a visão mantém no centro o mesmo ponto da fase.
- **Duas camadas** (§2.16, "transform de container"):
  - o **chão** (terreno, telegrafia de área, objetos planos, portas, rastros e luz) fica num container `plano` com
    a matriz da projeção, e entra de graça no isométrico;
  - o que fica **em pé** (entidades, projéteis, partículas, números, baú e loja) é posicionado por `projetar`,
    alinhado à tela, e ordenado por `zIndex` igual ao Y projetado.
- **Paredes em prisma** (`render/paredes-iso.ts`):
  - só a parede que encosta num piso ou numa saída vira prisma, com 0,6 célula de altura;
  - a rocha de dentro continua plana e escura, como na visão de cima: senão a fase vira um mar de topos que se
    confunde com o piso (visto ao jogar);
  - as faces da frente ficam no tom do topo da fase e o topo, escuro;
  - um `Graphics` por diagonal (x + y), na camada das entidades, com o `zIndex` da diagonal: quem passa atrás da
    parede fica atrás dela. Uma fase 60×40 dá cerca de 100 objetos.
- **Modelos de criatura** (`render/modelos/`):
  - funções puras que devolvem SVG a partir de uma cor, com o sombreamento por escurecimento paramétrico;
  - um gerador de bípedes (proporções e acessórios) e três feras (lobo, aranha, slime);
  - 15 modelos: os 11 da spec, os 4 das invocações (sombra, sentinela, fada, espantalho) e o do jogador
    (aventureiro, com 2 quadros por vista);
  - **vistas**: a 3/4 em pé tem origem nos pés e é usada no isométrico; a de cima tem origem no centro, olha para
    +x, gira para o olhar e é usada na visão de cima.
- **Atlas no build**:
  - um plugin do Vite (`virtual:atlas-criaturas`) roda os modelos no Node e entrega um SVG único como data URL,
    mais o JSON dos quadros;
  - cada quadro tem 144 px (18 × 8), para as tiras caírem em pixels inteiros;
  - o navegador só decodifica a imagem; nada é rasterizado pelo código do jogo;
  - o atlas soma cerca de 18 kB (gzip) ao pacote e funciona offline;
  - os imports dessa pasta levam a extensão `.ts`, porque o `vite.config.ts` os carrega no Node
    (`allowImportingTsExtensions`).
- **Caminhada por fatias** (`render/caminhada.ts`, pura; `render/rig-token.ts`):
  - **18 tiras**, com os parâmetros da tabela da §2.16;
  - **motor bípede** (passada e marcha): abaixo do corte, duas colunas em fase oposta; acima, contrabalanço, com a
    faixa da arma amortecida;
  - **outros estilos**: quique, flutuar (que paira mesmo parado) e deslizar (a bainha como pêndulo);
  - **parado e ataque** usam o motor genérico: respiração; no ataque, empurrão de 0,20 × largura e esticamento de
    1,06 em 400 ms, a partir do lançamento;
  - **atalho de qualidade**: nas qualidades mínimo e baixo, um desenho só (`tiras: false` no preset);
  - movimento reduzido deixa a pose parada.
- **Personagem por imagem** (`render/token-imagem.ts`; `plataforma/token.ts`):
  - **limites**: PNG, WebP, JPEG ou GIF; até 2 MB e 1024 × 1024 px;
  - **preparo**: decodifica com `createImageBitmap` dentro de `try`; recorta a transparência pela caixa dos pixels
    visíveis (alfa ≥ 8); a altura vira 1,12 célula, com origem nos pés;
  - **recusa**: cada motivo tem uma frase simples, e o jogo segue com o modelo padrão;
  - **armazenamento**: a imagem fica no store `perfil` do IndexedDB, só neste aparelho e só para o seu
    personagem;
  - **ajustes em Configurações → Aparência**: o sentido (para onde a imagem olha) e o tamanho neste aparelho
    (80–130%);
  - **na visão de cima**, a imagem fica em pé, pelo centro, e espelha pelo sentido do movimento;
  - **fora deste marco**: inimigos, aventuras e o compartilhamento na arena (11A e 8B).
- **Legibilidade sobre qualquer desenho**:
  - o anel de equipe, pela `relacao()`, fica sob os pés; vira elipse no isométrico;
  - a barra de vida, a de conjuração, o status, os anéis de alvo e de invocação e o "?"/"!" acompanham o topo do
    desenho;
  - a silhueta por arquétipo continua como substituto quando o modelo não existe ou o atlas não carrega.
- **Escolha da visão**:
  - em Configurações → Gráficos → "Visão", ou pela tecla `V`, que grava a mesma preferência;
  - a troca é instantânea: câmera, matriz do chão, paredes e tokens se refazem;
  - as teclas mantidas são remapeadas na hora.
- **O editor continua só de cima.**

**Consequência.** Novos testes de unidade (21):
- projeção: ida e volta em 60×40, limites e matriz;
- câmera: clique e troca de visão;
- profundidade e paredes de borda;
- motores de caminhada;
- recorte e recusas do token;
- completude do atlas;
- o mesmo digest nas duas visões.

Novos e2e:
- alternar pela tecla `V` e andar e clicar no isométrico;
- a visão persiste;
- imagem própria e imagem inválida;
- joystick no isométrico.

## D-059 · Marco 14: sistema de habilidades (v0.26, 15/10/2026)

**Contexto.** A D-057 abriu o marco 14 com dois pedidos de quem jogou:
- **efeitos legíveis**: o HUD só mostrava o ícone;
- **mais habilidades**: havia uma classe com 4 habilidades fixas.

As escolhas do usuário ao planejar:
- **Classe**: escolhida ao criar o personagem, e fixa.
- **Rank**: sobe com 1 ponto de habilidade por nível.
- **Evolução**: escolha definitiva nos ranks 3 e 5.
- **Habilidades geradas**: só nas fases geradas, crescendo com a profundidade, e em livros raros.

**Decisão.**
- **Habilidade compilada.**
  - `Habilidade` continua sendo o que todo o pipeline lê (ação, projétil, golpe, IA, render e som).
  - O skills.json (v2) traz a definição: as camadas, o elemento, as etiquetas, o nível mínimo, a passiva, os
    modificadores de nascença e as evoluções.
  - Uma **chave** autodescritiva — `id@rank/caminhos+mods` — vira a habilidade compilada por um compilador puro e
    memoizado (`combat/compilar-habilidade.ts`). Como compilar é puro, a memória não muda o digest.
  - A ação e o projétil guardam a chave: o projétil se resolve mesmo com o conjurador morto.
  - Na chave só entram os modificadores de fora (equipamento); os da definição e dos caminhos estão implícitos.
  - Quem não tem bolsa (inimigos e arena) usa o id puro: rank 1, sem caminhos nem afinidades.
- **Formas e alvos** (`combat/formas.ts`), usados pela simulação e pela telegrafia:
  - **linha**: Bresenham até o alcance, parando na parede;
  - **cone**: 90°, por teste inteiro;
  - **ao redor**: em volta de quem conjura, sem precisar de alvo;
  - **suporte**: um aliado (ou o próprio, com o mais ferido como auto-alvo) e todos os aliados no raio, pela nova
    `podeAjudar` (a partir da `relacao()`, nunca pelo tipo);
  - custo em vida (nunca mata quem conjura) e saltos (encadear; raio sobre eletrizado ganha +1).
- **Efeitos novos e interações em dados.**
  - **10 tipos novos** no registro (26 → 36): queimando, resfriado, congelado, eletrizado, envenenado, exposto,
    escudo, puxão, troca de lugar e dano direto.
  - **Ganchos novos**: lentidão, cura recebida, dano recebido e escudo.
  - **interacoes.json**: acúmulo por tipo (mais forte, renova, soma, ignora); resfriado ×3 → congelado; o fogo tira
    o frio e o frio tira o fogo; teto de 8 efeitos.
  - **5 sinergias**:

    | Elemento sobre o estado | Sinergia |
    |---|---|
    | fogo sobre o frio | derreter, +50% |
    | fogo sobre o veneno | combustão, +30% |
    | raio sobre congelado | estilhaçar, +75% |
    | psíquico sobre eletrizado | sobrecarga, atordoa 0,8 s |
    | veneno sobre exposto | corrosão, +25% e enfraquece |

  - A sinergia só consome o estado quando o golpe acerta.
  - **elementos.json**: estado, cor, ícone, visual, som, pesos de forma e nomes.
  - **Presets**: resistências por elemento (100 = imune) e imunidades a efeitos (o esqueleto não é envenenado).
  - O rótulo de `dano_periodico` virou "Sangrando".
- **Orçamento de poder** (`combat/orcamento.ts`).
  - **Poder** = dano médio × forma × saltos, mais cura e o peso de cada efeito, descontados pela recarga, pela
    conjuração e pelo custo.
  - **Orçamento** = `(6 + 0,7 × (nível − 1)) × pct do modo`.
  - **Na carga**, todo o alcançável pelo jogador (classes e livros) é conferido em todo rank e combinação de
    caminhos, contra o nível mínimo do rank. Ao calibrar, quatro opções de caminho que passavam foram trocadas.
  - **As geradas** usam 85% do orçamento.
  - Os pesos ficam no balance.json (v14).
- **Classes** (classes.json v2): aventureiro (o primeiro, padrão da arena), guerreiro, mago e arqueiro.

  | Classe | Atributo | Afinidades |
  |---|---|---|
  | guerreiro | Força | +15% em corpo a corpo; −30% no custo de vida |
  | mago | Inteligência | +15% em mágicas; +10% em elementais |
  | arqueiro | Destreza (`ClasseCombate` nova, `atirador`) | +10% e +2 de alcance com projéteis |

  - A **escolha de classe** aparece no jogo novo de um slot; sem slot e no teste do editor, aventureiro.
  - **Modelos** das classes no atlas, com 2 quadros por vista.
- **Progressão** (`progression/habilidades-personagem.ts`).
  - `subirRank` gasta 1 ponto; do rank 0 para o 1, só o que a classe aprende.
  - Ranks 1–5 nos níveis 1/3/6/10/15, com +0/15/30/50/75% de dano e +0/10/20/35/50% nos efeitos.
  - Nos ranks 3 e 5, o caminho é obrigatório e definitivo.
  - `equiparHabilidade` põe uma ativa numa das 4 teclas; `Entidade.habilidades` deriva da barra.
  - **Passivas** (só passivas, D-057) somam vida, mana e defesa na ficha e bônus por etiqueta.
  - Morrer devolve só os pontos não gastos.
  - **Livros** (tipo de item novo) ensinam no rank 1 sem ponto e sem restrição de classe. O livro raro guarda a
    habilidade gerada no `ref` da entrada da mochila e do objeto no chão.
  - **Equipamento** pode dar modificadores por etiqueta (anel do eco, aljava perfurante).
- **Habilidades geradas por semente** (`combat/gerar-habilidade.ts`).
  - O id `g_<semente>_<nível>` vira a definição: o elemento puxa a forma, o estado, o visual, o som e o nome; os
    dados sobem até o orçamento; há 40% de chance de um efeito secundário e 2 caminhos por degrau.
  - Nas fases geradas, o chefe ganha 2 e os inimigos comuns ganham 1, com chance `min(75%, 30% + 3% × nível)`.
  - Usam um **PRNG separado** (`semente:habilidades`), então o mapa das fases já salvas não muda (um teste guarda o
    hash de antes).
  - O respawn guarda as habilidades da instância.
  - O código curto de compartilhar é a semente em base 36 com o nível.
- **Efeitos legíveis e descrições geradas.**
  - **Chips do HUD** (`ui/chips-efeito.ts`): anel que esvazia com a duração, os segundos e os acúmulos.
  - **Cartão** ao tocar, focar ou passar o mouse: nome, o que faz com os números e de quem veio.
  - **Aviso ao ganhar um efeito**, no máximo um por tipo por segundo.
  - **Sinergias**: o nome sobe do alvo e entra no registro.
  - **Descrições** (`ui/descrever.ts`): habilidades, efeitos, caminhos, passivas e livros se descrevem pelas peças.
    Os textos ficam num dicionário à parte (`i18n/pt-BR-habilidades.ts`).
- **Aba Habilidades da mochila**: os pontos; as teclas 1–4 (pôr e tirar); as conhecidas com o rank, a descrição e
  "Subir rank" (desabilitado com o motivo, o mesmo da simulação); os caminhos como cartões; as passivas; o que
  falta aprender.
- **Barra e roda.**
  - A barra é a escolhida pelo jogador, refeita quando muda, com a cor do elemento e os pontos do rank.
  - **A janela rotativa de 3 da §4.6 ficou desnecessária**: com a barra escolhida, a roda nunca tem mais que 4
    botões, e a lista completa está na aba Habilidades. Fecha a D-019 de outro jeito.
- **Apresentação pela chave**: partículas, sons e telegrafia acham a habilidade pela chave do evento. Do rank 4 em
  diante, o impacto solta o dobro de partículas.
- **Save v9** (`MIGRACOES[8]`, também nas fases visitadas): o personagem vira aventureiro, com as habilidades
  atuais no rank 1, a barra e os pontos dos níveis já ganhos; ação e projétil ganham a chave; efeitos, início e
  acúmulos; itens e objetos, o `ref`; respawns, as habilidades.
- **Arena: sem mudança de protocolo.** Os comandos novos ficam fora do `protocolo.ts` e são recusados. O
  `hashPolitica` muda com as classes novas: cliente e servidor são publicados juntos. Os limites por modo ficam
  para o 10B e a semente trafegando, para o 8B.

**Consequência.**
- **Testes de unidade** (36 novos):
  - chave e compilador (as 16 habilidades de antes iguais no rank 1);
  - orçamento;
  - 300 sementes geradas cabendo no orçamento e cobrindo os 5 elementos e as 6 formas;
  - formas, interações, efeitos novos e sinergias na simulação;
  - progressão e livros;
  - save v8 → v9;
  - o hash das fases geradas de antes;
  - descrições sem lacunas;
  - digest determinístico.
- **e2e**: escolher o mago, pôr a barreira na tecla 1, lançar e ler o cartão.
- **Números**: os de agora são ponto de partida; o rebalanceamento por simulação é o marco 15.

## D-060 · Ajustes de jogo depois do marco 14 (v0.27, 15/10/2026)

**Contexto.** Jogando o marco 14, o usuário apontou cinco pontos:
1. conjurar travava o personagem sempre, inclusive no ataque básico;
2. o inimigo perseguia mesmo quando o jogador já tinha saído da zona durante o "?";
3. o d20 ficava escondido num chip pequeno, sem passar recompensa ou perda;
4. o teclado numérico lateral não usava as habilidades;
5. a área aparecia como quadrados pintados: a hitbox, não um efeito.

**Decisão.**
- **Mobilidade por habilidade** (revê a D-017).
  - Cada habilidade diz `mobilidade`:
    - `trava` (padrão): não começa passo novo;
    - `lenta`: anda a 50% (`balance.habilidades.velocidadeConjurandoLenta`);
    - `livre`: anda normalmente.
  - Andar conjurando custa no orçamento: +7% (lenta) e +15% (livre) de poder (`balance.orcamento.mobilidade`).
  - **Escolhas**:
    - livres: os ataques básicos do jogador;
    - lentas: as leves (seta arcana, flechas perfurante e venenosa, barreira, escudo de ferro, curar);
    - travam: as demais, inclusive os ataques dos inimigos e as geradas, que são a janela de esquiva do jogador
      que o marco 15 vai medir.
  - A descrição gerada diz se a habilidade para, anda devagar ou anda.
- **Tempo mínimo na zona de atenção** (desvio da §2.6).
  - Durante o "?", a contagem da hesitação só anda com o alvo dentro do raio de detecção. Fora, ela pausa.
  - Passados `balance.ia.gracaForaDaZonaMs` (1,2 s) fora, o inimigo desiste e volta a patrulhar.
  - Quem golpeia o inimigo durante o "?" é perseguido na hora.
  - `detectados` só guarda quem chegou a ser perseguido: sair durante o "?" e voltar leva a uma hesitação nova.
  - O "?" ganha força com o progresso e fica apagado enquanto o alvo está fora.
  - No estado público da arena, esses dados ficam neutros, e o "?" aparece inteiro.
  - Save v10 (`ia.foraDaZonaTicks`).
- **d20 visível, nos dois lugares**:
  - **perto da barra** de habilidades: a cada rolagem sua, o dado gira (300 ms; parado com movimento reduzido)
    na cor da faixa — falha vermelha, 13–19 dourada, 20 maior com "Crítico!" — e esmaece depois de 1,5 s sem
    rolagem;
  - **sobre o alvo, só nos extremos** (16+ e falha), quando a rolagem envolve você: um d20 desenhado sobe com um
    pulo de escala por 0,8 s;
  - o chip do canto saiu.
- **Teclado numérico**: `Numpad1`–`Numpad0` valem como os números de cima (`indiceDoAtalho`).
- **Área orgânica: o desenho não é a hitbox** (`render/formas-visuais.ts`).
  - A simulação continua acertando por células. A telegrafia desenha uma forma que cobre o centro de toda célula
    atingida (testado em todas as formas e raios):
    - círculo nas áreas redondas (quadrado, ao redor);
    - cápsula na linha;
    - leque que sai de quem conjura no cone.
  - A borda ondula de leve, por fases sorteadas pela ação.
  - O preenchimento é suave, na cor do **elemento**; a borda, na cor da **equipe** (a leitura de ameaça não se
    perde); o miolo cresce até o impacto.
  - **No lançamento**, a área explode pela forma — a onda e o impacto no centro, faíscas em até 6 células —,
    mesmo sem ninguém atingido. Cancelada, não explode.
  - Configurações → Gráficos → "**Mostrar a área exata (células)**" (desligado por padrão) desenha as células
    por cima.
  - Primeira tentativa recusada: o contorno pela distância de suporte em cada direção virava um "8" na linha.
    Usar o fecho convexo arredondado deixava as áreas quadradas com cara de quadrado.

**Consequência.**
- **12 testes de unidade novos**:
  - mobilidade e o custo no orçamento;
  - a atenção: ficar, sair, voltar e o golpe durante o "?";
  - o teclado numérico;
  - as faixas do dado;
  - a cobertura e o determinismo da área;
  - a preferência;
  - save v9 → v10.
- **1 e2e novo**: o teclado numérico lança a barreira e o d20 aparece perto da barra.

## D-061 · Dificuldade, campanha cooperativa e balanceamento por simulação (v0.28, 15/10/2026)

> **Revista pela D-127 (30/10/2026)**: o teto de nível sobe de 30 para 100. Até o 30, o ritmo medido aqui não muda
> (curva de XP, pontos e fórmulas idênticos); do 30 ao 100, a curva longa (`xp.curvaLonga`) é calibrada para levar
> cerca de 10× o tempo de combate do 1 ao 30, e o simulador ganhou as metas `metas.nivelAlto` (níveis 50, 75 e 100).

**Contexto.** O marco 15 pedia uma ferramenta de balanceamento por simulação e o ajuste dos números. Ao revisar o
plano, o usuário acrescentou dois pedidos:
1. níveis de dificuldade, com o mesmo personagem jogando em qualquer um;
2. a campanha jogável em grupo, até 6, com o balanceamento ajustado ao tamanho do grupo.

O ritmo escolhido foi o **médio**:
- um inimigo comum do mesmo nível cai em 3–5 golpes (4–7 s);
- o jogador aguenta 6–8 golpes de um comum;
- o chefe dura 25–40 s.

**Decisão.**

- **Dificuldade** (`balance.dificuldades`): Fácil, Normal, Difícil e Pesadelo. Cada nível mexe em seis alavancas:

  | Nível | Vida dos inimigos | Dano dos inimigos | Hesitação | Aviso extra | Recompensa |
  |---|---|---|---|---|---|
  | Fácil | 75% | 70% | 130% | +150 ms | 80% |
  | Normal | 100% | 100% | 100% | 0 | 100% |
  | Difícil | 130% | 125% | 80% | 0 | 125% |
  | Pesadelo | 170% | 150% | 60% | 0 | 160% |

  - Valem pelo **lado do jogador**: a equipe de quem tem bolsa. Nada olha o `tipo` (§2.5), e a arena, sem bolsas,
    fica neutra.
  - "Vida" é aplicada como fator no dano recebido: o efeito vale na hora, sem reescalar ninguém.
  - O nível entra no estado (`EstadoJogo.dificuldade`) e no digest. Muda pelo comando `definirDificuldade`, que não
    toca no personagem.
  - Na interface: escolha na tela de slots e troca na pausa. O slot lembra a última.
  - Save v11.
- **Campanha cooperativa** (modo `cooperativo` em dados: até 6, `saida: 'todos_vivos'`).
  - **Online, por código**: a `SalaCampanha` estende a `SalaArena` por ganchos (entrada, recusa, depois do tick,
    troca de mundo).
  - **Personagem**: cada um traz o do próprio slot. A sala **confere a ficha** contra o nível e corta o que não
    cabe, mostrando o que mudou:
    - atributos-base e pontos (o excesso sai de onde passou da classe);
    - ranks e caminhos;
    - pontos de habilidade;
    - itens, equipamento e ouro.
  - O estado público continua sem bolsas; cada sessão recebe a **própria** pelo canal `privado`.
  - Os comandos aceitos pela rede vêm do modo (`comandosDeRede`): a arena continua recusando os de personagem.
  - Só o **anfitrião** troca a dificuldade.
  - **Saída**: a fase avança quando todos os vivos e conectados estão na saída aberta. A sala monta a fase seguinte
    (época nova) e leva os personagens com vida e mana cheias. O cliente desmonta e monta a cena sem derrubar a
    conexão.
  - **Progresso**: o personagem volta para o slot de cada um (`atualizarPersonagemNoSave`), a cada 30 s, ao subir de
    nível, ao pegar item, ao trocar de fase e ao sair. O anfitrião também leva o avanço de fase.
  - **Fases do editor** não vão para o grupo: elas ficam só no aparelho de quem as criou.
- **Escala do grupo** (`balance.grupo`), pela mesma conta da dificuldade, com N = personagens presentes:
  - vida dos inimigos +70% por jogador a mais;
  - dano +8%;
  - spawner +25%;
  - recompensa +10%.
- **Simulador** (`tools/balanceamento`, `npm run balancear`): roda o `simular()` de verdade, com um bot que joga como
  uma pessoa razoável. Ele mira o mais próximo, usa a barra, sai das áreas telegrafadas, toma poção com a vida baixa
  e se afasta do corpo a corpo quando ataca de longe. Cenários:
  - comuns **em sequência**, em que recargas e mana seguem de uma luta para a outra (a abertura com tudo pronto não
    decide a média);
  - quanto o jogador aguenta;
  - o chefe da fase 1 (nível 1, contra jogadores no nível 2, como na fase real), sozinho e em grupos de 2, 4 e 6;
  - o degrau das dificuldades;
  - o PvP do Livre;
  - o aviso útil de toda habilidade inimiga;
  - a fatia da invocação;
  - XP por minuto.

  As metas ficam em `balance.metas`. `--registrar` grava `docs/BALANCEAMENTO.md`, e `tests/sim/ritmo.test.ts`
  protege as principais.
- **Crescimento do inimigo por nível** (§2.5, `balance.inimigos`):
  - Constituição +3 e Força +1 por nível desde o 2; Inteligência a partir do 3, Destreza do 7, Sabedoria do 10;
  - vida pela fórmula, a 120%;
  - XP +25% por nível.
- **Números que mudaram** (de 31/65 para **69/69 metas**):
  - bônus de atributo ×0,5 → ×1, os dois lados (o atributo passa a pesar como a rolagem);
  - ataques básicos a cada 1,0 s → 1,5 s;
  - corpo a corpo inimigo (`golpe`, `golpe_pesado`, `golpe_viscoso`): conjuração 504 → 600 ms;
  - chefe:
    - vida-base 140 → 290;
    - ataque a cada 1,8 → 3,4 s;
    - um lacaio por invocação (eram dois);
  - guerreiro: vida-base 75 → 45 (a defesa continua a dele);
  - arqueiro: `tiro` 1d6 → 1d8; `chuva_de_flechas` 2d4 → 2d6;
  - Livre:
    - orçamento de atributos 12 → 6;
    - vida a 120% (`clamp.vidaPct`, campo novo do modo).

  | Medida (mediana) | Antes | Depois | Meta |
  |---|---|---|---|
  | Comum do mesmo nível, nível 1 (golpes) | 6–8 | 4–5 | 3–5 |
  | Comum do mesmo nível (tempo) | 1,8–4,5 s | 4,2–7 s | 4–7 s |
  | Golpes que o jogador aguenta | 10–26 | 6–8 | 6–8 |
  | Chefe sozinho | 14–16 s (mais forte que o jogador do nível) | 30–36 s | 25–40 s |
  | PvP no Livre | 8–15 s | 6,5–9,8 s | 6–10 s |
  | Aviso útil do corpo a corpo, perfil suportado | 227 ms | 323 ms | ≥ 250 ms |

**Consequência.**
- **O degrau das dificuldades é íngreme no chefe**: no Difícil e no Pesadelo, o bot sozinho no nível 2 perde para o
  chefe da fase 1 (4 de 4). Isso é a intenção (pede mais nível ou um grupo), mas fica anotado para o teste com
  pessoas.
- **Ritmo**: cada classe cabe nas metas nos níveis 1, 5 e 10. O crescimento por nível mantém o ritmo estável (o
  inimigo do mesmo nível cresce junto).
- **Testes**:
  - 11 de dificuldade;
  - 10 de rede (loopback) e 2 de integração do cooperativo;
  - 9 de ritmo e 2 de crescimento;
  - e2e: dificuldade e grupo com dois navegadores.
- **Carga do cooperativo**: 6 bots no perfil suportado, 9/9 metas (`npm run carga -- --modo grupo`).

## D-062 · Endurecimento: celular, PWA offline, benchmarks do cliente e operação do servidor (v0.28, 15/10/2026)

**Contexto.** O marco 16 fecha a convergência pela robustez:
- celular (área segura, orientação, redimensionamento);
- offline testado;
- desempenho e memória medidos;
- o servidor com limites e métricas para rodar 30 minutos na VM de 1 GB.

**Decisão.**
- **Celular**:
  - o aviso de girar aparece em toda troca para retrato;
  - o DPR é relido no redimensionamento (zoom, troca de monitor);
  - a faixa de controles é relida 300 ms depois;
  - sair do jogo solta a orientação e a tela cheia;
  - corrigido `--seguro-direita` → `--seguro-dir` (a roda do d20 no toque ignorava a área segura).
- **PWA offline**: projeto `offline` do Playwright, com o Service Worker liberado. Depois da primeira visita, sem
  rede, a campanha abre, anda e salva; uma navegação desconhecida cai no `index.html` do precache.
- **Benchmarks do cliente**:
  - `?bench=carga`: 120×120, 60 NPCs, 10 avatares, 20 invocações, 30 armadilhas e 100 projéteis;
  - `?bench=padrao`: 60×40;
  - `?bench=trocas`: monta e desmonta a cena no mesmo documento.

  O resultado aparece na página (no celular, basta abrir o endereço). `npm run bench` roda tudo no Chromium sem tela
  e grava em `BENCHMARKS.md`. O `?diag=1` ganha p99, pausas e memória.
- **Vazamento achado pelo benchmark**: cada troca de cena deixava 2,7 MB (crescimento monotônico). Havia três
  causas:
  - **ouvintes que prendiam a cena**: a preferência de movimento reduzido, os chips de efeito e o token da visão;
  - **modais que ficavam no `<body>`**;
  - **o atlas de criaturas** decodificado de novo a cada cena, no cache global do Pixi.

  Agora o atlas é um só por página; a luz e o token usam fontes fora do cache; a cena solta tudo ao desmontar; e o
  laço não reagenda quando para de dentro do quadro. O heap estabiliza: o último terço de 30 trocas fica +2,3% sobre
  o do meio, e as primeiras trocas só enchem caches limitados.
- **Servidor**:
  - **limites**: salas por processo (`MAX_SALAS`, padrão 6) e criações por origem (`CRIACOES_POR_MINUTO`, padrão 6),
    com recusa clara no lobby;
  - **`GET /metricas`** (sem dado pessoal): RSS, heap, uptime e atraso do agendador do processo; por sala, tick
    p95/p99, jogadores, banda, fila, entidades, rejeições e reconexões. O log de 10 s também traz esses dados;
  - **compose**: `mem_limit` 700 MB e rotação de log (10 MB × 3); o Node com `--max-old-space-size=512`.
- **Carga**: amostra o `/metricas` a cada 10 s (série do tick e da memória, com tendência em MB/min), mede o grupo
  (`--modo grupo`) e grava o marco por `--marco`.

**Consequência.**
- O WebGL sem tela é por software: os quadros de `npm run bench` medem o pior caso de CPU, não um aparelho. Os
  números de aparelho real entram quando alguém abrir `?bench=carga` no celular.
- O teste na VM roda depois do merge e do deploy, e vai num PR curto de documentação.

> **Resultado (v0.29, 15/10/2026)**: o usuário reduziu o teste de 30 para **10 min**. Com 10 bots na arena-02 sobre o
> `wss://` da VM: 10/10 metas; RTT 22/32 ms; tick p95/p99 1,4/1,7 ms (p95 máximo na série 2,8 ms); memória do
> processo de 105 para 129 MB, com tendência de 0,66 MB/min; nenhum reinício; atraso do agendador p95 de 10,7 ms.

## D-063 · Conta, nuvem, certificado do personagem e a campanha na arena (v0.30, 15/10/2026)

**Contexto.** Ao planejar o 11A, o usuário pediu:
- conta (só Google) para manter o progresso entre máquinas;
- o personagem da campanha jogando na arena, e a arena ajudando na evolução, com ênfase em upar atributos,
  habilidades e itens: quem upou bem chega forte, e vice-versa.

**Restrições do usuário**:
- **Supabase econômico** (plano grátis):
  - uma leitura e escrita só nos pontos de saída;
  - sem realtime nem recaptcha.
- **Jogar local não depende da nuvem**: a arena usa o save local.
- **Nuvem ↔ local** por enviar e baixar.
- **Editar o arquivo não pode upar o personagem.**

**Decisão.**
- **Certificado do personagem** (`integridade/certificado.ts`, `server/certificacao.ts`):
  - **Assinatura**: o servidor da AWS assina com HMAC-SHA256 o retrato do personagem (nível, XP e bolsa) com a
    hora. A chave (`CHAVE_CERTIFICADO`) só existe no GitHub e no `.env` da VM.
  - **`POST /certificar`**:
    - confere a ficha pelo nível, sem cortes;
    - com o certificado anterior, confere o crescimento contra o tempo real (XP, ouro e itens por minuto, com folga;
      `balance.integridade`; teto de 8 h entre dois);
    - sem anterior, aceita até o nível 5.
  - **Identidade**: o personagem ganha um `personagemId`. Save v12 (identidade na bolsa e certificado no registro).
  - **Arquivo editado**: muda o retrato. O personagem segue jogável local e no grupo, mas a arena o recebe como
    ficha de treino.
  - **Limite reconhecido**: alguém que espere horas e edite dentro do teto por minuto passa. O certificado impede o
    "editar o arquivo e virar nível 20", não um bot jogando por horas.
- **Arena com o personagem**:
  - **Entrada**: com o certificado válido, o personagem entra inteiro pelo caminho do cooperativo (conferência,
    bolsa e canal privado, que subiu para a `SalaArena`). Sem ele, a ficha de treino recortada de sempre.
  - **Faixas de nível** em dados (`livre.json`: 1–5, 6–10, 11–15, 16–20; sem faixa, sala aberta):
    - a sala nasce na faixa de quem cria;
    - entrar fora dela é recusado;
    - `GET /salas?faixa=` sugere as salas com vaga.
  - **Recompensa** (`recompensaJogador`):
    - abater um jogador dá XP pelo nível dele, com o decaimento por abates (antifarm por vítima);
    - na primeira queda, ouro e item; o item gerado é do nível da vítima (mais forte, melhor);
    - teto de XP por hora por sessão;
    - a arena solta itens dos abates; baú e loot do spawner continuam fora dela (`economiaDoSpawner`).
  - **Saída**: "Salvar e sair" e a gravação a cada 2 minutos pedem à sala o personagem certificado e o gravam no slot.
- **Nuvem** (`plataforma/nuvem.ts`, Supabase só no cliente, carregado sob demanda):
  - login Google, sem realtime;
  - a lista (slot e resumo) é lida uma vez por aba, e o registro inteiro só ao baixar, conferido como um arquivo
    importado;
  - escrita em "Enviar para a nuvem" e nos pontos combinados: salvar pelo menu, sair do grupo, sair da arena;
  - tabela `saves` com RLS por conta e teto de tamanho (`supabase/migrations`);
  - a chave anônima é pública (o RLS protege);
  - a arena nunca confia no que está na nuvem, só no certificado.
- **Upar pesa mais**:
  - **Equipamento gerado por semente** (`gi_<base>_<nível>_<raridade>_<semente>`, `data/itens-base.json`,
    `balance.itensGerados`): 70% do equipamento que cai é gerado no nível de quem morreu, com raridades altas mais
    prováveis por nível. O catálogo resolve esses ids sob demanda.
  - **Atributos com efeito novo** (`balance.atributos.efeitos`):

    | Atributo | Efeito novo |
    |---|---|
    | Sabedoria | Regeneração de mana (3% por ponto acima de 10) |
    | Destreza | Recarga do básico (1,5% por ponto, até 30%) |
    | Constituição | Vida por passo |
    | Carisma | Desconto na loja (2% por ponto, até 30%) |

  - **Ficha**: mostra o dano do golpe, a recarga, a mana por segundo, a vida por passo e o desconto.

**Consequência.**
- **Simulador**: a build focada vence a dispersa e o personagem equipado vence o sem equipamento, na arena com a
  ficha inteira, em toda classe (62–100%; 77/77 metas). As metas do 15 continuam valendo.
- **Carga** com fichas certificadas (10 bots, perfil suportado): 9/9 metas.
- **Testes**:
  - 7 do certificado e 6 da arena com o personagem (loopback);
  - 2 de integração com o servidor real;
  - 2 da nuvem e do retrato no slot;
  - 6 dos itens gerados e dos atributos;
  - e2e: a arena com o personagem do slot e a nuvem falsa.
- **Passos do usuário** (nos sites oficiais):
  - projeto Supabase com o Google ligado e o cliente OAuth do Google;
  - as variáveis `SUPABASE_URL` e `SUPABASE_ANON_KEY` e o segredo `CHAVE_CERTIFICADO` no GitHub;
  - a migração da tabela.

## D-064 · O 11A redefinido (v0.30, 15/10/2026)

**Decisão do usuário.**
- **Fica para depois**:
  - editor de habilidades;
  - importação de música pelo jogador;
  - exportação da aventura.
- **O 11A passa a ser**:
  - editor completo no toque;
  - aventura de 2 fases ou mais;
  - tileset por imagem;
  - aprendizado de estilo **por aparelho e opcional**;
  - a aparência das habilidades que já existem, refinada pela fantasia de cada uma;
  - trilhas sintetizadas mais variadas, transitando entre um polo casual e um dark fantasy.

**Ordem.** O 11A vem depois do 17. O aceite "exportar e importar a aventura" sai do 11A.

## D-065 · Alvo automático que acompanha e alvo travado (v0.31, 15/10/2026)

**Contexto.** O usuário relatou que a seleção de alvo parecia aleatória e trocava sozinha no combate. As causas eram
quatro:
- **Quase nunca havia seleção.** Só o clique ou o toque num inimigo selecionava; no teclado, nunca.
- **Sem seleção, cada golpe recalculava o alvo.** O auto-ataque (a cada 250 ms) e as habilidades sem alvo chamavam
  o auto-alvo de novo, e o "mais próximo" mudava enquanto os inimigos se mexiam.
- **Com seleção, o golpe ia para outro em silêncio.** Com o selecionado fora do alcance, o golpe acertava outro e o
  anel continuava no primeiro.
- **O alvo morto continuava selecionado.**

**Decisão.**
- **Automático (destravado).**
  - O primeiro golpe sem seleção escolhe pelo auto-alvo (§4.7), e esse alvo **fica selecionado**.
  - Os golpes seguintes continuam nele enquanto estiver no alcance.
  - Se ele sair do alcance, o golpe vai para outro e a seleção acompanha. O anel mostra sempre quem você acerta.
- **Travado.** É o padrão da escolha manual: clique ou toque num inimigo, ou a tecla de troca.
  - O alvo nunca muda sozinho.
  - **Fora do alcance**: o auto-ataque espera; a habilidade sem alvo explícito mira nele e é recusada por alcance.
  - **Invisível**: espera.
- **Morte ou sumiço do alvo**: desfaz a seleção e a trava; o próximo golpe escolhe de novo.
- **Estado**:
  - `Entidade.alvoTravado` (ausente em saves antigos = destravado; o save não muda de versão);
  - o comando `selecionarAlvo` ganha `travar?` (padrão `true` com alvo; `false` destrava sem perder o alvo).
- **Troca manual** (`proximoHostil`, puro):
  - percorre os hostis válidos por `relacao()` até `balance.combate.raioTrocaAlvo` (10 células);
  - ordem: avatar primeiro, depois distância Chebyshev e id; dá a volta na lista.
- **Controles**:

  | Ação | Teclado e mouse | Toque |
  |---|---|---|
  | Trocar de alvo | `Q` (`Shift+Q` volta) | Tocar no 🎯 |
  | Travar ou destravar | `T`, ou clicar de novo no alvo travado | Segurar o 🎯 (~450 ms) |
  | Limpar o alvo | `Esc`, antes de pausar | — |

- **Divergência da §4.7**: "setas alternam alvo" virou `Q` / `Shift+Q`, porque as setas movem o personagem. `Tab`
  ficou de fora para não quebrar a navegação por foco.
- **Interface**:
  - anel amarelo fino no automático;
  - anel laranja grosso com as quatro marcas da mira no travado;
  - quadro do alvo no alto da tela, com nome, nível, vida e 🔒, anunciado ao leitor de tela só na troca e na trava.

**Consequência.**
- A regra vale igual na campanha, no cooperativo e na arena: é do núcleo, por comandos, com a mesma predição.
- O `BotDeDuelo` do simulador passa a travar quando seleciona, que é o que ele já queria; as metas seguem 100%.

## D-066 · Marco 11A: editor completo, aventuras, tileset, estilo, visuais e trilhas (v0.32, 16/10/2026)

**Contexto.** O 11A redefinido (D-064) pede:
- editor completo no toque;
- aventura de 2 fases ou mais;
- tileset por imagem;
- aprendizado de estilo por aparelho, opcional;
- a aparência das habilidades pela fantasia de cada uma;
- trilhas variadas entre casual e dark fantasy.

O aceite: uma aventura de 2 fases criada e testada no celular.

**Decisões.**
- **Editor.**
  - A fase editável cobre tudo o que o `FaseJson` tem, e a ida e volta não perde nada (testada com as duas fases
    oficiais).
  - O chefe da saída é marcado pela célula (o índice muda quando a lista de inimigos muda) e vira `bossIndice` ao
    exportar.
  - Ferramentas puras: balde (4-conexo, teto de 20.000 células, recusa inteiro), retângulo, redimensionar (8 a 120,
    ancorado no canto superior esquerdo, conta o que saiu), portas em par, distribuir.
  - O histórico ganhou retratos de fase (redimensionar, portas, tranca, matiz, tileset) além das células.
  - O inspetor abre com a ferramenta própria ou com **toque longo de 450 ms** com qualquer ferramenta.
- **Aventura.**
  - Registro v2 com até 12 fases. O rascunho antigo (uma fase solta, orbes do 8A) é lido como aventura de uma fase.
  - A referência no save ganhou `indice` opcional (ausente = 0). **O save não mudou de versão**: a chave `aventura:<id>`
    da primeira fase é a mesma de antes.
  - Testar a fase, ou a aventura inteira em sequência (`seguir`).
- **Tileset.**
  - Layout canônico 4×4/5×5 da §2.16, D4 por multiplicação de matrizes, autotiling e variação do piso pelos limiares.
  - Fatiamento com cada borda arredondada à parte e herança entre as fases da aventura.
  - Texturas NEAREST materializadas por transformação.
  - Divergência: parede cercada de piso usa `parede_int` (a §2.16 diz `piso_1`, o que esconderia uma célula sólida).
  - A parede funda (sem piso em volta) fica no escuro.
  - A matiz da fase não tinge o tileset; no isométrico, os prismas usam a cor média da peça de parede.
  - A arena não recebe atlas.
- **Estilo.**
  - Assinatura de 8 letras: `P` (piso), `F` (fechado: parede ou vazio) e `D` (porta: saída ou porta interna), na ordem
    N, NE, E, SE, S, SO, O, NO.
  - Média móvel com alpha 0,4; as totalmente cercadas ficam de fora.
  - Regras fortes: ≥ 0,75 ou ≤ 0,25, com 4 amostras ou mais, até 64.
  - As regras entram nos `ParametrosGeracao` (o save as guarda: a mesma fase sai igual ao reabrir).
  - `aplicarEstilo` usa um PRNG próprio e desfaz a passada se o alcance quebrar.
  - Desligado por padrão; liga-se nas Configurações ou com "Gerada no meu estilo" no editor.
- **Visuais.** A pedido do usuário, mais partículas e nenhuma forma plana.
  - Sistema de partículas no `ParticleContainer` do Pixi 8, com um atlas de texturas.
  - Presets por fantasia: corte, runas, cristais, bolhas, sombra, sangue, sagrado, pedra, vento, chamas e relâmpago.
  - A própria forma do ataque também virou partícula: miolo e borda da área, mira, projétil, feixe em linha, rajada
    pela área e rastros no chão.
  - As formas desenhadas só aparecem na qualidade sem partículas (o aviso do ataque nunca some).
  - Movimento reduzido: metade das partículas e sem giro.
- **Trilhas.**
  - A sombra (0 a 1) vem da profundidade, da dificuldade (fácil −0,1, difícil +0,15, pesadelo +0,25) e do clima
    (combate +0,2, chefe +0,35), e desliza com constante de 3 s.
  - Ela é quantizada em 5 faixas: modos, andamento e timbres, com pad, arpejo e seções A/B.
  - A troca de laço espera o fim do compasso e cruza em 1,5 s; dentro da faixa, filtro e eco seguem a sombra ao vivo.

**Consequência.**
- O editor é um chunk à parte (~39 KB); as fases oficiais e o save não mudaram de formato.
- A exportação da aventura inteira continua fora (D-064); exporta-se uma fase.

## D-067 · Ajustes depois do 11A: sem descanso, buffs armados, refúgio, loja sem prazo e ícones próprios (v0.33, 17/10/2026)

**Contexto.** Jogando a versão com o 11A, o usuário pediu uma lista de ajustes, entregues num PR só e com checklist.

**Decisão.**
- **Sem descanso.** O comando `descansar`, a interação, a tecla `R`, os botões e o `balance.descanso` saíram
  (divergência da §2.10 e da tabela de modos da spec, a pedido). Para compensar, mais orbes de vida: o spawner sorteia
  orbe com chance 0,4 (era 0,3), o peso do de vida é 55 (era 40) e o drop de orbe de vida é 0,15 (era 0,10). O
  `npm run balancear` confere as metas.
- **Halo no lugar da linha.** A "linha amarela" ao interagir era o anel de progresso do baú desenhado com `arc()` sem
  `moveTo()`: o Pixi ligava o fim do desenho anterior ao início do arco. O anel saiu; no lugar, um halo (sprite com
  gradiente radial, aditivo) pulsa no objeto enquanto a interação dura. O mesmo defeito em `render/fluxo.ts` foi
  corrigido.
- **Buff ofensivo armado.** Orbes de efeito ofensivo (`bonus_dano`, `ab_dano`, `ab_recarga`, `ab_alcance`,
  `ab_multi_alvo`, `atravessar`, `rastro_dano`) não começam na hora: ficam em `Entidade.buffsArmados` por
  `efeitos.prazoArmadoMs` (20 s). **Em combate** é ser perseguido por um hostil ou ter causado ou levado dano nos
  últimos 3 s; nesse momento o efeito entra e a duração conta dali. Sem combate no prazo, some (`buffExpirou`). O HUD
  mostra o chip tracejado com os segundos.
- **Refúgio.** Objeto `orbe_refugio`, categoria própria no spawner: no máximo um por vez, contando o do mapa e a carga
  de qualquer jogador; não ocupa vaga dos outros orbes. Pegar guarda a carga (`Entidade.refugio`, ícone no HUD). Abrir
  a mochila (comando novo `abrirMenu`) ou a loja gasta a carga e dá `imune_dano` por `efeitos.refugioMs` (45 s).
- **Loja sem prazo.** A janela não tem `ateTick` (fica aberta o tempo que o jogador quiser), mas só abre sem
  perseguição (`em_perigo`) e fecha se a perseguição começar com ela aberta (`lojaFechada` com `perigo`).
- **Equipamento no token.** `Entidade.aparencia` (pública; a arena a vê mesmo sem a bolsa) guarda a base da arma de
  cada mão e a raridade do elmo, da armadura e da capa. Os modelos das classes jogáveis saíram do atlas sem arma nem
  escudo; `render/adornos.ts` desenha o equipamento em duas camadas (capa atrás; armadura, elmo e armas na frente),
  geradas do SVG com o mesmo contorno e os mesmos traços dos modelos, dentro do corpo do rig (seguem pose, passo e
  giro). Com a mão vazia, aparece a arma da classe (as habilidades da classe não pedem item).
- **Consumíveis à mão.** Barra à direita: no PC, uma coluna com as teclas 5–9 e 0; no toque, uma lista rolável e
  translúcida no alto. O minimapa foi para a esquerda, abaixo do status.
- **Barra de habilidades.** Botões 15% maiores (60 px; 51 px no toque, com a roda em 97 px). Para pôr uma habilidade
  na tecla: os botões 1–4 em cada carta da aba Habilidades, e o seletor rápido na própria barra (clique direito, toque
  longo ou o `+` da tecla livre).
- **Flechas de verdade.** `visual.projetil` (`orbe`, `flecha` ou `teia`; o físico deduz flecha, o mágico orbe). O
  corpo do projétil é uma partícula orientada pelo voo (texturas novas `flecha` e `teia`); a esteira fina e orientada
  substitui as bolinhas de brilho; `farpas` (lascas e pó) é o acerto da flecha; a `chuva` cai do alto nas células da
  área, sem onda nem faíscas; o `leque` sai em cone de quem atira. Os traços de reserva e das texturas ficaram em 2 px.
- **Ícones próprios.** Nenhum emoji no sistema: um conjunto de ícones SVG (24 × 24, traço de 2 px, pontas
  arredondadas, cor herdada) em `data/icones.ts`. Os campos `icone` dos dados são ids validados contra o conjunto; o
  canvas usa texturas geradas do mesmo SVG. Um teste varre `src/` e o `index.html`.
- **Celular.** O manifesto pede paisagem; a tela cheia e a trava de orientação são pedidas a cada toque enquanto não
  pegarem; em retrato, um aviso cobre o jogo pedindo para girar (o iOS não permite travar).
- **Save v13.** A migração `v12ParaV13` limpa uma interação de descanso e inicia `buffsArmados`, `refugio` e
  `aparencia`.

**Consequência.** A campanha perde a cura garantida do descanso e passa a depender de orbes e da regeneração ao
andar. A spec (§2.10 e a tabela de modos) continua citando o descanso; esta decisão prevalece.

## D-068 · Marco 18: atributos, estudo de habilidades, revide da IA e armadilhas (v0.34, 17/10/2026)

**Contexto.** O grimório de interações mostrou que o atributo de dano vinha da classe (a Seta arcana do aventureiro
escalava com Força) e que rank, atributo e IA eram lineares. O usuário ajustou a proposta e pediu tudo num PR.

**Decisão.**
- **Dano.** A rolagem bruta é multiplicada por `1 + ((FOR−10) + (INT−10)) / 2 × 7%` (piso 0,5), para todo mundo. O
  bônus fixo somado segue o atributo da habilidade (`escalaCom`; físico usa Força, mágico usa Inteligência), não a
  classe. Divergência da §2.7 (passo 5), a pedido.
- **Inteligência** também dá a **potência** (`1 + (INT−10) × 3%`, entre 0,7 e 1,6): duração dos status e valor dos
  efeitos numéricos das habilidades, o dano extra das reações e o bônus dos combos. O `pct` (lentidão etc.) e os fluxos
  (armadilha, invocação) não mudam.
- **Destreza** não dá dano. Dá velocidade (como antes) e recarga do ataque básico: 1,5% por ponto até 30% nas
  classes, 2,5% por ponto até 50% no arqueiro (`classes.json → destreza`).
- **Sabedoria** revela armadilhas alheias: um teste por segundo em cada armadilha no raio `2 + (SAB−10)/3`, com chance
  `5% + 3%/ponto` (teto 60%). A revelada pode ser desarmada com `interagir` (1,5 s parado; `40% + 5%/ponto`, teto
  95%); falhar dispara a armadilha; acertar dá 5 de XP. Regra de modo (`sobrevivencia.revelarArmadilhas`).
- **Estudo.** Aprender (por ponto ou por livro) começa um estudo: Rank **B** 15 min, **A** 30 min, **S** 1 h,
  menos 2% por ponto de INT acima de 10 (até 40%). Só anda com a simulação rodando (pausa e jogo fechado não
  contam; regra `sobrevivencia.estudoAvanca`, desligada na arena). Um por vez. `acelerarEstudo` gasta 1 ponto e tira
  1/3 do total (3 = instantâneo). Subir de nível continua instantâneo. Na interface, o grau aparece como
  **"Rank B/A/S"** e a progressão 1–5 passou a se chamar **"Nível"**.
- **Revide.** Todo inimigo atacado persegue o agressor no mesmo tick, saindo da patrulha ou do "?", e troca para o
  último que bateu (`balance.ia.revide`).
- **Ressonâncias** (data/ressonancias.json): 6 com um atributo em 16+ e 6 com um par em 14+; viram ganchos (D-069).
- **Calibração**: arqueiro FOR 14/DES 13, aventureiro FOR 13/INT 13, chefe com 12% menos vida (o revide o deixou mais
  perigoso). O simulador usa as builds típicas novas (aventureiro FOR+INT, arqueiro FOR+DES).

**Consequência.** Builds híbridos fazem sentido; o mago continua o mais forte em efeitos; o arqueiro troca dano por
ritmo. Saves vão para a v14.

## D-069 · Marco 18: itens base com formas, ganchos, conjuntos e elementos novos (v0.34, 17/10/2026)

**Decisão.**
- **Itens base** (`data/itens-formas.json`, ids `ib_<base>_<forma>_<elemento|n>_<nível>_<semente>`): 20 bases ×
  4 formas (Comum, Épica, Lendária, Última — raridades comum, épico, lendário e a nova `ultima`), cada forma com nome,
  poder e aparência próprios; 10 afinidades elementais desiguais (cajado 3; espada e arco 2; adaga, maça e escudo 1;
  as outras nenhuma), cada uma nas 4 formas: **120 variações**. Os drops gerados passam a sair daqui; os `gi_` do
  marco 17 continuam resolvendo. A Última não cai: vem da forja, de missões e de origens raras. Arquivo separado do
  `itens-base.json` (que segue para os `gi_`), em vez de uma versão 2 dele.
- **Ganchos** (`progression/ganchos.ts`): um formato só — quando (ao acertar, no crítico, ao abater, ao levar golpe, ao
  gastar o refúgio, ao usar habilidade, passivo), se (etiqueta, habilidade, elemento, tipo de ataque, estado do alvo
  antes do golpe, chance) e o quê (aplicar efeito, em volta, no próximo hostil, purificar, herdar o elemento da última
  magia, curar %, mana, ou passivos como inamovível, resistências, renascer). Lendárias e Últimas trazem os seus; o
  elemento do item vira gancho (arma: o golpe físico aplica o estado; outras peças: quem acerta o portador leva o
  estado).
- **Conjuntos** (`data/conjuntos.json`): Vigília do caçador e Juramento de ferro, com bônus de 2 e 3 peças (ganchos e
  modificadores de habilidade).
- **Elementos novos**: terra (enraizado), sombra (marcado: o próximo golpe causa mais e o estado sai), sagrado
  (consagrado: quem acerta se cura); estados novos molhado e atolado. O Derreter deixa o alvo molhado. 8 reações
  novas: vapor, eletrocutar (salta entre molhados), lama, fossilizar, eclipse (nos dois sentidos), peste, purgar (cura
  quem lança) e pânico. O gerador de habilidades segue nos 5 elementos de antes (as habilidades geradas dos saves não
  mudam).
- **Aparência**: brilho do elemento na ponta da arma, gema por forma, halo da Última no token e aura de partículas
  para Lendária e Última; molduras na interface.

> **Revista pela D-126 (29/10/2026)**: as 20 bases viram 52: as 40 armas de classe (8 por classe) e as 12 bases
> fora das armas. As afinidades passam a 44, no máximo 2 por base.

## D-070 · Marco 18: combos, marcos, buff × habilidade, fusões, missões, origens, forja, eventos e diário (v0.34, 17/10/2026)

**Decisão.**
- **Combos** (`data/combos.json`, 8): a habilidade B até `janelaMs` depois da A ganha dano (escalado pela potência),
  d20 mínimo e efeitos (no alvo, em volta ou na mira).
- **Marcos de nível** (`marcos` em skills.json): o nível 2 dá um toque e o 4 uma assinatura, aplicados como caminhos
  fixos e dentro do orçamento de poder (os que passavam foram trocados por alcance ou efeitos menores).
- **Buff × habilidade** (`data/interacoes-buff.json`, 5): com o buff ativo, a habilidade ganha o bônus (mesmo
  mecanismo dos combos).
- **Fusões** (4): habilidades de grau S com `fusao: [a, b]`; pedem a Runa de fusão (missão), as duas no nível máximo e
  são uma por personagem (a runa sai ao começar o estudo).
- **Missões** (`data/missoes.json`, 4) contadas pelos eventos do tick, com recompensa única; **origens raras**
  (`data/origens.json`, 4) sorteadas na queda, com condição e chance própria (2% a 20%); **forja**
  (`data/forja.json`) na loja aberta; **eventos de fase** (lua sangrenta 3%, mercador errante 10%, sala secreta 8%)
  sorteados pela semente depois dos campos de antes, com sorteio de posição à parte (a fase sem evento sai igual).
- **Diário**: cada entrada (reação, combo, ressonância, marco, fusão, variação de item, conjunto, regra de buff,
  missão, origem, evento) entra na ficha na primeira vez (`descoberta`); a aba mostra silhuetas para o resto. A
  **primeira descoberta do servidor** vai para a tabela `descobertas` do Supabase (só inserção, RLS, chave primária
  por entrada; guarda **só o primeiro nome** da conta) e só é chamada quando o diário ganha uma entrada nova.
  Registro comunitário, não autoritativo. A pausa mostra a semente da fase.
- **Mudanças do grimório na implementação**: o Resíduo expõe os atingidos em vez de deixar o estado no chão; a Mente
  dupla dá +15% de potência em vez de ecoar efeitos; o Ricochete aplica dano no hostil mais perto em vez de um
  projétil novo; o Estandarte e outros combos usam efeitos de área em vez de mudar o alcance da habilidade. Mais simples
  de manter em dados, com o mesmo sentido.

**Consequência.** O conteúdo cresce por JSON validado pelo `Leitor`; a próxima leva (60 bases, ~400 itens) não exige
código novo. Saves v14.

## D-071 · Recuperação dos inimigos, especialização e descobertas públicas (v0.35, 17/10/2026)

**Contexto.** O simulador completo deixava sete metas fora do alvo: mago rápido demais, arqueiro de nível 5 lento e
pouco retorno para builds focadas. O usuário pediu também recuperação dos inimigos e o fechamento das pendências
de descobertas, estudo e lobby.

**Decisão.**
- **Abate:** NPC inimigo vivo recupera imediatamente 50% da vida que falta, arredondada para vida inteira e limitada
  ao máximo. Vale também para chefes e invocações hostis; aliados do jogador não recebem essa vantagem. A cura só
  acontece na morte confirmada (renascer por item não conta), uma vez, com evento visual de cura. A ordem real dos
  golpes desempata o autor do abate no mesmo tick; mortes simultâneas não ressuscitam quem matou.
- **Retirada do chefe:** após cinco segundos fora de combate, regenera 5% da vida máxima por segundo. Perseguição,
  investigação, conjuração, dano recebido ou causado recentemente impedem a recuperação. O relógio é o tick da
  simulação, respeitando pausa. Números em balance.json; sem estado novo nos saves.
- **Especialização ofensiva:** a rolagem continua dividida entre FOR e INT, a 7% por ponto. Personagens com ficha
  somam +2 de dano por ponto de FOR ou INT acima de 16, até +20 no total, nas habilidades que escalam com esses
  atributos. Isso recompensa foco e permite o híbrido FOR+INT do aventureiro; DES não passa a causar dano.
  O crescimento automático de NPCs não recebe esse bônus. Ficha e dicas mostram a mesma fórmula do combate.
- **Ritmo:** arqueiro inicia com FOR 15; mago com vida-base 55 e afinidades de dano mágico/elemental em 0%; guerreiro
  com afinidade de contato em −5%. Dardo arcano e três magias elementais ganham 25% de conjuração. Comuns ganham
  mais Constituição por nível, e o chefe passa a 281 de vida-base. São ajustes conjuntos, mantendo as metas anteriores.
- **Evidência:** 77/77 metas no simulador completo. Mago leva 4,1 s no nível 5 e 5,2 s no 10; arqueiro no nível 5 leva
  cinco golpes. Foco vence dispersão em 68,8% no aventureiro, 75% no guerreiro, 100% no mago e 68,8% no arqueiro
  (16 sementes por classe, nível 8). A conversão de ticks para segundos usa 60 inteiro, evitando que 10 s sejam
  comparados como 10,000000000000002 s. O CI passa a executar também o simulador completo.
- **Descobertas:** substituímos o primeiro nome Google por um pseudônimo estável, gerado no banco. Uma migração
  posterior limpa nomes existentes e força o pseudônimo inclusive em clientes antigos. Leitura pública pela view
  descobertas_publicas expõe apenas entrada, pseudônimo e data; a tabela restringe leitura à própria conta.
  A RPC registrar_descoberta obtém a conta da sessão, registra a primeira descoberta e retorna autoria sem divulgar
  UUID de outra conta. O cliente envia somente a entrada. A migração precisa ser aplicada antes do novo cliente;
  nenhuma alteração manual no banco de produção foi feita nesta tarefa.
- **Cobertura e interface:** e2e de estudo cria um save pelo fluxo público, importa um personagem com pontos e
  verifica início, persistência, aceleração, aprendizado e equipamento. A contagem de descobertas aparece também
  no seletor de personagem do lobby da arena. Testes de unidade cobrem recuperação e o contrato da RPC.

**Consequência.** Retiradas dão tempo ao chefe para se recuperar e mortes recuperam inimigos imediatamente.
A distribuição de atributos passa a ter retorno ofensivo próprio, sem acelerar globalmente a rolagem. Os créditos
públicos deixam de publicar o nome da conta Google. As porcentagens de builds descrevem as sementes do relatório,
não uma garantia para toda combinação de equipamento ou habilidade.

## D-072 · Avisos e alvo compactos no topo do celular (v0.36, 17/10/2026)

**Contexto.** Os avisos cobriam a área de combate no celular e podiam se sobrepor ao quadro do inimigo selecionado.
O usuário pediu ambos junto à borda superior, avisos com a fonte do nome do alvo e a vida do alvo menor.

**Decisão.** Avisos e alvo compartilham uma faixa em fluxo vertical: aviso primeiro, alvo depois, com espaço entre
eles mesmo quando o texto quebra em mais linhas. No toque, a faixa fica a 4 px da borda superior segura. Os dois
usam fonte de 0,75 rem. Só o aviso mais recente permanece visível, mantendo seu prazo normal e o anúncio acessível.
A barra do alvo usa a mesma largura e altura visíveis da vida do jogador, inclusive com a escala da interface.
Chamadas de aviso vindas da campanha e da arena encontram a mesma faixa; ela não captura toques.

**Validação.** E2e com aviso real da campanha e alvo selecionado, em 915×412 e 568×320, além de área segura de 40 px
e escala de interface de 150%, verificando posição, ausência de sobreposição e igualdade das barras.


## D-073 · Mana, controles e nomes dos consumíveis (v0.37, 17/10/2026)

**Pedido.** Reduzir a regeneração de mana em 50%, mover interação e alvo para uma fileira à direita
no celular e identificar poções e pergaminhos pelos nomes curtos também no computador.

**Decisão.** A base passa de 1 para 0,5 mana/s e de 1 para 0,5 por célula. O bônus de Sabedoria,
proporcional à base, também cai pela metade. A regeneração por tempo distribui pontos inteiros
pelos segundos; por passo, admite meia mana, sem arredondar cada passo. Vida, potência das poções,
custos e atributos das classes são preservados. Os controles ficam à esquerda da roda de habilidades
em paisagem e acima dela à direita em telas estreitas de retrato.

Os atalhos mostram “Espantalho”, “Lobo”, “Sombra”, “Sentinela” ou “Fada”; as poções mostram
“Vida +N” ou “Mana +N”. N é a recuperação nominal arredondada conforme o máximo do personagem,
antes de modificadores de cura ou do limite de recurso faltante. O estoque aparece separado como ×N;
o nome completo e a tecla continuam acessíveis no botão.

**Impacto conhecido.** Com a redução solicitada, o simulador completo aprova 74/77 metas:
aventureiro nível 5 leva 8,5 s contra comum (meta 4–7 s); mago nível 5 leva 3,7 s (meta 4–7 s);
mago solo vence o chefe em 25% dos cenários (meta 50–100%). O teste de ritmo do aventureiro
nível 5 também falha no teto de 8 s. Essas metas e testes permanecem ativos, sem recalibrar
classes fora do pedido. Uma eventual recalibração exige uma decisão de balanceamento separada.

## D-074 · Eficiência mágica após a redução de mana (v0.38, 17/10/2026)

**Contexto.** A D-073 reduziu a regeneração de mana pela metade. O simulador completo confirmou 74/77 metas:
o aventureiro nível 5 levava 8,5 s contra comuns, o mago nível 5 levava 3,7 s e o mago solo vencia o chefe em
apenas 2/8 sementes. O usuário pediu o rebalanceamento após esse commit.

**Decisão.** Aventureiro e mago recebem afinidade de −20% no custo das habilidades com a etiqueta `magico`,
em classes.json. A afinidade usa o mecanismo existente, com arredondamento inteiro do custo final: não
significa que todo feitiço ficará exatamente 20% mais barato. Vale para habilidades iniciais e aprendidas com
essa etiqueta, incluindo suporte. A regeneração segue em 0,5 mana/s e 0,5 por célula, com o mesmo bônus de
Sabedoria da D-073. Atributos, vida, dano, tempos de conjuração, metas e cenários do simulador são preservados.
Balance passa à versão 20, e o catálogo de classes à versão 3.

**Evidência.** Nas mesmas oito sementes do relatório completo:

| Critério | Após D-073 | Após D-074 | Meta |
|---|---|---|---|
| Comum: aventureiro nível 5 | 8,5 s | 5,6 s | 4–7 s |
| Comum: mago nível 5 | 3,7 s | 4,1 s | 4–7 s |
| Chefe: vitórias do mago solo | 25% (2/8) | 75% (6/8) | 50–100% |

O mago leva 38,2 s nas vitórias contra o chefe (meta 25–40 s). O menor custo muda a sequência de conjurações,
recargas e rolagens, por isso mais eficiência de mana não implica uma luta mais curta em toda amostra.
O conjunto completo aprova 77/77 metas, incluindo PvP Livre, grupos, builds, resistência e avisos inimigos.
As porcentagens descrevem as sementes fixas, sem garantir toda combinação possível de ficha e habilidade.

**Consequência.** A recuperação de mana continua menor, com eficiência mágica própria das duas classes que
regrediram. O relatório docs/BALANCEAMENTO.md passa a registrar os resultados da versão 20.


## D-075 · Nível 30 e consumíveis de aprendizagem e evolução (v0.39, 17/10/2026)

**Pedido.** Aplicar docs/PLANO-PROGRESSAO.md, aprovado pelo usuário: retirar o gasto de pontos para
acelerar estudo, criar aceleração cumulativa por item, aumentar o limite para 30, orientar a progressão
21–30 a Pesadelo e acrescentar compra de pontos e evolução de habilidades por família.

**Decisão.**
- Aceleração da mente comum/incomum/rara soma +25%, +33⅓% e +50% à velocidade do estudo atual,
  até ele terminar. Preços-base 150/200/300 ouro. Dois raros dão 2×; um de cada dá 25/12×.
  Não corta trabalho instantaneamente nem gasta pontos. Avanço em ticks, com fração em doze avos,
  respeitando pausa e os modos. Consumir sem estudo é recusado. Inteligência e equipamentos continuam
  definindo a quantidade inicial de trabalho. A próxima habilidade começa em 1×.
- Todas as lojas de modos com estudo oferecem o comum e o Tomo do potencial; incomum/raro aparecem
  adicionalmente com chances de 30%/10%. A oferta deriva da identidade e posição da loja/fase, sem
  alterar o RNG de combate, e permanece igual ao reabrir e carregar. Inclui lojas antigas e mercadores.
- Tomo do potencial dá +1 ponto livre. Custa 15.000 ouro inicialmente e +15.000 por compra anterior
  daquele personagem, antes do desconto normal de Carisma. O contador cresce na compra, inclusive
  se a unidade for guardada. Saldo e espaço são conferidos antes de cobrar.
- Essências sobem um rank de habilidade conhecida substituindo um ponto, mantendo requisitos,
  máximo 5 e escolha de caminho nos ranks 3/5. A família original é explícita no catálogo;
  habilidades geradas usam a base imutável. Evoluções elementais não mudam a família. Oito elementos,
  técnica marcial, magia arcana, suporte e fusão cobrem o conteúdo e as passivas. Na mochila, usar
  abre a seleção de habilidades; na aba Habilidades, ponto e essência são pagamentos distintos.
  Consumo só acontece após uma evolução válida. A confirmação leva o rank esperado para evitar
  que um clique repetido confirme uma segunda evolução sem revisão.
- Essências têm drops temáticos independentes do RNG principal: 2% no primeiro abate de comuns e
  20% no primeiro abate de chefes; o chefe fornece essência de fusão. A forja permite converter
  duas essências em uma arcana, e duas arcanas mais 500 ouro em outra família (técnica→arcana
  também custa 500). As probabilidades não entram no pool normal de poções/equipamentos.
- Nível máximo 30, mantendo +3 atributos/+1 habilidade/+5 vida base por nível. Atributos efetivos
  continuam limitados a 30; habilidades a rank 5; barra a quatro. Equipamento gerado, fases,
  editor, validações e importação passam a aceitar 30; limites próprios da arena são preservados.
- A partir do nível 20 (subida para 21), XP por dificuldade corresponde a 5%/10%/35%/170% da
  referência Normal anterior, para Fácil/Normal/Difícil/Pesadelo. Substitui somente o fator de XP,
  mantendo grupo e antifarm; não reduz ouro nem loot. A fração é acumulada por personagem e não
  vira um mínimo artificial de 1 XP. Grupos mistos aplicam a faixa por destinatário. A curva
  necessária segue o fallback nível × 100; a progressão até 20 fica preservada.
- O plano começava Pesadelo em 100%. A medição de XP/min com equipamento raro mostrou que isso
  ficava abaixo da referência Normal sem penalidade, devido ao combate mais demorado. A calibragem
  para 170% compensa aproximadamente essa duração. Não é garantia de tempo idêntico para toda build.
- Saves v15: reembolso dos pontos comprovados nas acelerações do estudo ativo, preservando o trabalho
  restante; velocidade nova neutra. Estudos concluídos não têm histórico para reembolso retroativo.
  Todo XP acumulado por quem estava no antigo teto 20 fica em `xpLegado`, visível na ficha, sem
  desaparecer nem provocar níveis automáticos. Contadores de itens e frações persistem no save.
- A conferência cooperativa conserva progressão financiada por itens; a certificação verifica seus
  incrementos junto dos limites de aquisição e do custo mínimo dos tomos. Passivas sem caminhos
  de evolução não são mais indevidamente cortadas ao rank 2 na conferência.

**Validação e alcance.** O relatório completo conserva as 77 metas históricas e acrescenta cenários
informativos nos níveis 20, 25 e 30, builds focadas/dispersas com equipamento raro, XP e ouro por minuto.
O simulador passa a redistribuir pontos que excediam 30 no atributo principal, sem desperdiçá-los.
Os cenários avançados usam bots e poucas sementes; não validam toda combinação de habilidades e
itens nem garantem que toda build focada supere toda build híbrida. Renda de venda de loot é adicional
à tabela de ouro direto e pode encurtar o tempo de compra dos tomos.

**Consequência.** Pontos deixam de comprar espera menor. Aprender novas habilidades, desenvolver ranks
por família e comprar pontos adicionais passam a competir com loot, ouro e equipamento. Valores e
probabilidades permanecem nos dados para novas passadas de calibragem.


## D-076 · Espaço dos controles, preço fixo e organização da mochila (v0.40, 17/10/2026)

**Pedido.** Antes de commitar, mover interação e alvo para a esquerda em mais 100% da distância
atual até a skill, cobrar 10.000 ouro fixos pelo ponto de habilidade e manter o menu aberto ao equipar.

**Decisão.**
- A folga horizontal entre o alvo e a primeira skill em paisagem passa de 7,5 para 15 px: a fileira
  inteira se desloca 7,5 px para a esquerda, sem alterar altura ou distância entre os dois botões.
  Em retrato estreito, a fileira recebe o mesmo deslocamento horizontal e conserva a posição acima da roda.
- O Tomo do potencial passa a custar 10.000 ouro de base em todas as compras. O desconto normal de
  Carisma continua aplicável. Retirada a regra e a configuração de encarecimento; o contador de compras
  permanece apenas para registrar a origem dos ganhos e conferir a progressão, não para calcular preço.
  Preço, descrição, certificação econômica e projeções de custo no relatório seguem a regra nova.
- Equipar e desequipar não fecham a mochila no toque, permitindo organizar vários slots em sequência.
  O desktop já mantinha a janela aberta. Os consumíveis conservam o comportamento de uso existente.

**Validação.** Testes de compra repetida e certificação; e2e de preço e troca de dois equipamentos,
incluindo desequipar, em desktop e celular. O e2e de controles verifica o deslocamento e a ausência de
sobreposição em paisagem e retrato.


## D-077 — Skills táticas, combos duplos/triplos e fechamento de modais (17/10/2026)

**Contexto.** A expansão aprovada exige 17 novas skills, 17 combos duplos adicionais e dez triplos, mais apresentação própria para os oito existentes. O reconhecedor anterior só olhava a skill anterior no lançamento, sem saber se acertou, aparou ou purificou. O smoke enviado também exigia que equipar fechasse a mochila e engolia falhas ao fechar a loja.

**Decisão.** Catálogo de 60 skills e 35 combos. Memória limitada a três ações por personagem, com acertos e fatos correlacionados pelo ID da ação. O triplo válido tem prioridade na finalização, sem remover recompensas anteriores. Reações elementais existentes são preservadas. Conteúdo, limites e números ficam em dados. Livros e essências integram a progressão; Curar e Barreira aceitam aliado e uso próprio. Detalhes, lista completa e limites em [EXPANSAO-SKILLS-COMBOS.md](EXPANSAO-SKILLS-COMBOS.md).

Campos de cura, veneno e muralha pertencem à simulação, com clone explícito e replicação por patches. O save passa a v16, aceitando estados antigos sem os campos opcionais. Morte e mudança de fase limpam preparação. A apresentação usa composições vetoriais identificáveis por forma e movimento, inclusive em qualidade mínima, sem alterar o estado de gameplay. O histórico só é mantido quando o repertório permite um combo, reduzindo custo em enxames.

O modal informa o fechamento sincronamente, pois o evento nativo close chega depois e permitia à loja reabrir no quadro seguinte. Esc e fundo usam o mesmo caminho. O smoke de equipamento passa a exigir mochila aberta; o da loja exige clique efetivo, sem capturar e ignorar erro.

**Validação.** Sequências completas dos 35 combos, recusas condicionais, campos, limites, passivas, clone e patches; galeria Pixi em navegador; fluxo de combo e descoberta persistida. Relatório exploratório de quatro builds em cinco níveis e quatro dificuldades, além das metas históricas. O CI completo continua obrigatório antes de merge.

## D-078 · Investida em movimento e sustentação do guerreiro (v0.42, 18/10/2026)

**Pedido.** Usar Investida sem parar o personagem e melhorar a sobrevivência do guerreiro,
recuperando um pouco de vida com base no dano do ataque básico.

**Decisão.** Investida usa mobilidade `livre`, mantendo a preparação visível de 350 ms (antes, 400 ms),
o custo, a recarga e a interrupção. O avanço voluntário conserva a direção de movimento;
se havia destino por clique/toque, recalcula o caminho a partir da nova posição. Parede,
colisão e muralha continuam impedindo avanço, e deslocamentos forçados mantêm suas regras.

O guerreiro recupera 10% do HP efetivamente retirado pelo ataque básico, após defesa,
mitigação e escudo, limitado ao HP que o alvo tinha. O valor passa pelo dispatcher de cura,
com arredondamento normal, redução por veneno e limite de vida máxima. Não há cura mínima
garantida: golpes pequenos podem arredondar para zero. Falha, imunidade, absorção completa,
aliados, skills, dano periódico e excesso letal não geram recuperação. Vale também no básico
automático e na arena com personagem de campanha; fichas de sessão sem bolsa continuam
sem os benefícios de classe da progressão. Cada alvo extra só conta o HP realmente retirado dele.

A porcentagem fica em `balance.recursos.curaBasicoPorClassePct`, sem estado novo nem migração
de save. Balance passa à versão 24, skills à versão 5. A descrição da classe informa o benefício.
Os testes protegem cálculo efetivo, limites, veneno, exclusividade e continuidade de movimento.

**Calibragem.** Com movimento livre e os 400 ms anteriores, o duelo espelhado do guerreiro
passou a mediana de 14,3 s nas oito sementes; desligar a cura nesse cenário não mudou o
resultado (a ficha de sessão não tem bolsa). A preparação de 350 ms levou a 9,6 s, mantendo
as metas existentes de PvP (6–10 s), o custo e a recarga. As 77/77 metas passam sem alterar
seus limites; o relatório BALANCEAMENTO.md v1.4 registra os resultados de balance v24.

Uma sondagem adicional comparou cura desligada/10% com a mesma Investida de 350 ms: 80 lutas,
níveis 5/10/20/25/30, quatro dificuldades e sementes 1000/8919, guerreiro típico contra orc
do mesmo nível. O bot usava o básico e sua defesa normal (incluindo poções), sem skills da
barra. No nível 5, a vida média restante passou de 62% para 70%; no 30, vitórias de 5/8 para
6/8. Nos outros níveis, as vitórias ficaram iguais e a vida média restante aumentou.
É uma amostra exploratória de uma configuração, não uma certificação de todas as builds.

## D-079 — Fases vivas e retorno sem substituir o ritmo atual (17/10/2026)

Por pedido do usuário, as salas e os corredores em L permanecem predominantes. O piso nativo não desenha juntas entre células. A campanha ganha retorno à fase anterior, com estado preservado e referências exatas no save; revisitar não cura. Na cooperação, todos os vivos precisam chegar à mesma porta.

Água, brasas e miasma usam o dispatcher e as reações existentes. As armadilhas ficam mais perigosas nas fases novas e seu disparo permanece visível até na qualidade mínima. Engenho permite converter armadilhas já percebidas, mantendo o valor da Sabedoria e do desarme normal. O canal privado da campanha leva apenas as armadilhas reveladas ou aliadas.

Enxame é um evento de 12%, com reservas sem IA, levas de até seis e teto de 40 ativos, também nos respawns. Mapas 84×56 surgem a cada sete profundezas; espirais, a cada onze. Parâmetros novos são guardados na referência e não alteram a geração das fases antigas. Compatibilidade, controles e medições estão em [Fases vivas](FASES-VIVAS.md).

## D-080 — Reabrir lojas e compartilhar itens pelo chão (17/10/2026)

A interface libera uma nova abertura quando o estado confirma o fechamento da loja. O prazo sem limite é constante e não pode identificar sessões diferentes: compará-lo sem limpar a marca escondia as próximas janelas e deixava o jogador preso na interação.

A mochila oferece Soltar 1 e Soltar pilha nos modos com objetos de fase. O comando é validado pelo servidor; só retira itens depois de encontrar chão passável sem outro objeto. Mantém quantidade, itemId e ref de livros. Equipamentos precisam ser desequipados primeiro. O dono não recolhe enquanto permanecer sobre o drop; sair da célula libera sua coleta, e aliados podem pegar imediatamente. Itens no chão persistem pelo mesmo estado das fases e saves.

Os drops usam os SVGs dos itens da mochila, convertidos em texturas compartilhadas. Há halo de raridade e contador para pilhas; no isométrico o desenho fica em pé, com profundidade. Sprites são removidos na coleta e na troca de visão, sem destruir as texturas compartilhadas.

## D-081 — Necromante e unificação de Sombra em Trevas (18/10/2026)

O Necromante tem um servo passivo que retorna após cair, reanima seus abates e os de suas invocações, e pode criar um eco temporário de um aliado que morreu perto. O eco é independente do jogador, que revive normalmente. Reanimados usam atributos e dano próprios em vez de copiar poderes de chefes; todos respeitam os limites do dono e do modo. Dízimo vital consome vida efetiva de uma invocação própria para curar o dono.

Por orientação do usuário, Sombra e Trevas são um único elemento: Trevas substitui a identidade elemental anterior sem invalidar itens ou caminhos salvos. O schema 19 migra os campos elementais antigos, incluindo saves v18 dos enxames; IDs legados permanecem estáveis. As regras, habilidades, combos e a compatibilidade estão em [Necromante e Trevas](NECROMANTE.md).

## D-082 — Diagnóstico explicativo de balanceamento (18/10/2026)

O pedido é investigar os fatores da vantagem entre classes, além de aprovar metas de tempo e golpes. O comando histórico e suas metas permanecem; `--diagnostico` mede as cinco classes oficiais em duelos, pressão simultânea, atrito sem recuperação artificial e chefe, separados por nível e dificuldade. O relatório mostra dano efetivo, cura por fonte, custos reais, escudos, invocações, exposição e desgaste por onda.

Os eventos de início de ação passam a informar os custos já cobrados; impactos informam dano efetivo e absorção de escudo. São campos adicionais de observação: não mudam resolução de combate, custos, rolagens ou balance.json. Resumos de poções e curadores não duplicam os efeitos que os originaram. Descendentes hostis invocados pelo chefe contam no dano recebido.

Experimentos retiram um fator de cada vez nas mesmas condições iniciais: cura do básico quando presente, poções, barra ou defesa plana. O relatório distingue observação de contribuição experimental, mortes de limites de tempo e tempo de vitória de tempo até morrer. Não há atribuição causal aditiva nem ajuste automático; oito sementes e uma build típica não certificam equilíbrio geral. Fontes, condições, intervalos e amostras JSON permitem auditoria. Uso e limitações em [Como investigar o balanceamento](DIAGNOSTICO-BALANCEAMENTO.md).

O diagnóstico completo integra `npm run verificar`, o comando `balancear:completo` e a CI de PRs/main. A validação de integridade rejeita amostras incompletas, custos/curas inconsistentes e intervenções sem controle; o resultado entre classes permanece exploratório. O artefato da CI contém somente dados produzidos pela execução corrente. Mortes simultâneas não concluem a onda de diagnóstico.


## D-083 — Ajustes de classes, antifarm por fase e botas (18/10/2026)

Aplicar o pacote de classes solicitado no anexo, com curvas e passivas no motor comum e textos no dicionário. A afinidade geral aceita `tag: null` explícita. A janela inicial do Necromante começa na primeira agressão hostil de cada visita à fase, sem renovar por onda, morte ou respawn. Fórmulas e semântica de encontro em [AJUSTES-CLASSES-XP.md](AJUSTES-CLASSES-XP.md).

A primeira rodada do balance 26 teve 73/77 metas legadas aprovadas com oito sementes: quatro tempos de combate menores que a faixa mínima, consequência dos buffs pedidos. Os resultados exploratórios daquela rodada estão identificados como históricos na documentação.

## D-084 — Correções de XP, reforços do Guerreiro e bota específica (18/10/2026)

O pedido corrigido define `XP_final = XP_base × max(0,05; 0,5^(d/10) × 0,5^(A_fase/H))` para diferença positiva; sem diferença, o ganho é integral e A não aumenta. A conta somente XP base obtido com diferença positiva, aumenta depois do ganho e nunca é reduzido por morte, transição ou retorno de retrato antigo. Cada fase tem seu contador independente. H é o XP de um nível da fase, fixado no primeiro ganho penalizado. Remover o antigo decaimento por respawn da campanha para respeitar o piso. Balance 27 e save 21 registram os novos parâmetros e migram os valores existentes sem apagá-los; o histórico legado não permite reconstruir XP base exato.

Somente movimento adicional e aura remota do Guerreiro escalam do nível 16 ao 20: +3% a +15% de velocidade e 20% a 100% da potência do pulso remoto. As demais curvas permanecem. Antes do 16 não há esses dois benefícios; a aura local continua existindo.

Alterar somente Botas do vento, forma lendária, para +30% de velocidade por três segundos ao cruzar hostis. Preservar integralmente as demais botas, inclusive Fantasma e cura por abate de Passo do vendaval. Regras e validação em [AJUSTES-CLASSES-XP.md](AJUSTES-CLASSES-XP.md).


## D-085 — Piso absoluto de 1 XP no antifarm (18/10/2026)

Substituir o piso percentual de D-084 por `XP_final = max(1; XP_base × 0,5^(d/10) × 0,5^(A_fase/H))` quando `d > 0`. O acumulado continua recebendo XP base após cada recompensa, inclusive no piso. Recompensas base zero não criam XP; com `d ≤ 0`, o ganho continua integral e não altera A. H, permanência por fase e as demais curvas não mudam. Balance 28 registra `xpMinimo: 1`.

O piso vale somente para XP ganho ao abater inimigos. A penalidade de morte do jogador continua subtraindo até 50 XP acumulados e de 10% a 50% do ouro na campanha e no cooperativo, sem apagar o desgaste da fase. A redução antiga pela repetição da mesma criatura continua substituída pelo novo contador da fase.

## D-086 — Progressão do Guerreiro e concentração do Mago (18/10/2026)

Preservar as metas originais e ajustar a progressão dos personagens. O contato do Guerreiro cresce quadraticamente até +15% no nível 10, compensado por resistência progressiva contra grupos próximos. O Dardo Arcano tem abertura reduzida nos primeiros níveis, recuperada entre 10 e 20, e concentração por acertos efetivos no mesmo alvo, com potência adicional somente após quatro acertos. Parâmetros no balance 29; regras em [AJUSTES-CLASSES-XP.md](AJUSTES-CLASSES-XP.md). As 77 metas originais passaram com oito sementes.

## D-087 — App Android e modo de desempenho (marco 20, 22/10/2026)

**Contexto.** No navegador do celular o jogo às vezes trava, e o usuário quis uma versão instalável que não fosse a
PWA, para ganhar desempenho.

**Decisão.**
- **Capacitor, não reescrita.** O app é o mesmo cliente web dentro de um APK (Capacitor 8). Uma reescrita nativa
  (Godot/Unity) refaria simulação, render, rede e interface e criaria dois clientes para um servidor só. O motor
  continua sendo o Chromium do Android: o ganho vem do que o navegador não deixa fazer e do modo de desempenho, não do
  empacotamento.
- **Nativo no app:** modo imersivo (as barras do sistema voltam com um deslize), tela sempre acesa e paisagem fixa no
  `AndroidManifest`, na `MainActivity` (sem plugins para isso). Vibração pelo Haptics. O voltar do Android fecha o
  modal aberto, abre a pausa na partida ou volta uma página; ir para o segundo plano abre a pausa. Os arquivos ficam no
  APK: `--mode android` tira a PWA, o service worker e os sourcemaps. Os plugins são importados sob demanda, só no app;
  a detecção (`window.Capacitor`) é síncrona.
- **Rede local:** a página do app é `http://localhost` (contexto seguro, com IndexedDB e o crypto da conta), o que
  deixa falar por `ws://` com um servidor da rede local. O servidor público segue por `wss://`. Como o app não tem barra
  de endereço, o menu ganha o campo **Servidor**. A ordem passa a ser `?servidor=`, depois o escolhido no aparelho,
  depois o do build; dentro do app, o "localhost" não vira `ws://localhost:2567`.
- **Login Google:** o OAuth abre no navegador do sistema e volta pelo esquema `io.github.brunafter.dungeonsarena://login`
  com o código do PKCE, trocado pela sessão no app. Essa URL precisa estar nas Redirect URLs do Supabase (ação do
  dono do projeto no painel).
- **Modo de desempenho** (vale também no navegador):
  - teto de fps: automático, 60 ou 30. O automático cai para 30 quando a qualidade automática chega ao mínimo. O laço
    pula o quadro inteiro e a simulação continua em ticks;
  - escala da resolução sobre o DPR: automática (0,75 no toque, 1 no desktop), alta, média ou baixa;
  - medidor opcional com fps, p95 e travadas acima de 100 ms;
  - a degradação automática de qualidade passa a descer também com travadas (p95 dos quadros acima de 50 ms), não só
    com média abaixo de 45 fps; com teto de 30, o limite da média acompanha o teto.
- **Distribuição:** o workflow `android.yml` compila o APK de depuração (Java 21, `assembleDebug`) em PRs que mexem
  no cliente e quando pedido à mão, e o deixa como artefato. Assinatura de loja (keystore nos secrets) e Play Store
  ficam para depois. Android Studio no PC é opcional (`npm run android:apk`, instalação por USB, profiler).

**Pendente:** medir num Android real com o medidor e registrar em `BENCHMARKS.md`; com os números, atacar os
gargalos que aparecerem.

## D-088 — Guerreiro com fúria e atualização do app Android (marco 21, 23/10/2026)

**Contexto.** O usuário achou o Guerreiro muito fraco. Também perguntou se atualizar o código atualiza o app
instalado: não atualiza. Pior, cada APK do CI saía assinado com uma chave de depuração nova, e o Android recusava
instalar por cima, obrigando a desinstalar e perder os saves locais.

**Decisão: Guerreiro.**
- **Cura ao abater:** ao derrubar um hostil, recupera metade da vida que falta, como os inimigos (D-071). Vale contra
  jogadores na arena. Derrubar invocações não cura, a mesma regra do PR #54.
- **Aura desde o nível 1:** o dano passa a ir de 3% a 15% do dano efetivo do golpe, e a cura de 20% a 50% do que a
  aura causou, ambos lineares do nível 1 ao 30. Antes eram de 1% a 5% e 20% fixos. A aura desconta metade da defesa
  do alvo, porque com a defesa inteira o pulso zerava nos níveis baixos. O pulso dos golpes à distância (projétil e
  área quadrada) vale com potência total desde o nível 1; a escada do 16 ao 20 fica só no movimento.
- **Fúria:** barra de 0 a 100. Cada ataque básico que fere soma 12, então nove golpes enchem a barra. Cheia, dobra as
  curas do próprio Guerreiro: aura, básico e abate. Depois de 3 s sem um básico que fira, perde 20 por segundo. O
  esvaziamento é calculado na leitura, a partir do valor e do tick guardados, sem um sistema rodando por tick. A barra
  vai no estado público (o HUD a mostra na arena e no grupo) e zera na troca de fase. Números em
  `balance.ajustesClasses.guerreiro` (balance 31).
- **Meta do simulador:** com os reforços, o Guerreiro derruba um inimigo comum do mesmo nível em 3,8 s nos níveis 5 e
  10 (na main já estava no piso, 4,0 s). O usuário escolheu manter os reforços e baixar o piso da meta `comum` de 4 s
  para 3,5 s; nenhuma outra classe fica abaixo de 4,1 s.

**Decisão: atualização do app.**
- **Chave fixa:** o dono do projeto cria uma vez um PKCS12 de 30 anos com `tools/android/criar-chave.sh` (só openssl
  e gh, sem Java). O arquivo fica fora do repositório. A chave e a senha vão para os secrets `ANDROID_CHAVE_B64` e
  `ANDROID_CHAVE_SENHA`, digitadas pelo dono e nunca vistas pelo assistente. O CI assina o `assembleRelease` com ela.
  `versionCode` é o número da execução do workflow, sempre crescente. Assim o APK novo instala por cima e mantém os
  saves. Sem os secrets, o CI cai no APK de depuração e avisa.
- **Release e aviso:** cada push na main que mexe no cliente publica a Release `android-vN` com
  `dungeons-arena.apk`, marcada como a mais recente. No menu, o app pergunta uma vez por sessão à API pública do
  GitHub (sem conta e sem dado do jogador), aceita só APK hospedado no próprio repositório e, se houver versão maior,
  mostra "Nova versão disponível" com o botão de download. O Android não deixa um app de fora da loja se atualizar
  sozinho: a pessoa toca em instalar. A Play Store fica como opção futura.
- **Transição:** o APK de depuração já instalado não aceita o primeiro APK com a chave fixa. É preciso desinstalá-lo
  uma vez; antes, convém enviar o slot para a nuvem.

## D-089 — Identidade do Aventureiro, do Mago e do Arqueiro (marco 22, 23/10/2026)

**Contexto.** O Guerreiro (fúria, aura, cura ao abater) e o Necromante (servos) têm mecânicas marcantes. As outras três
classes só tinham ajustes numéricos. O usuário escolheu uma mecânica para cada uma.

**Decisão: Aventureiro, falcão companheiro.**
- Um falcão permanente (preset `falcao_companheiro`, comportamento `companheiro`) nasce ao lado do dono em cada fase e
  quando ele volta. Tem vaga própria: não conta no limite de invocações e não é dispensado.
- **Mesma vida:** o falcão pode ser atingido, e o golpe nele cai no Aventureiro, com as defesas, os escudos e as
  proteções do dono (senão bater no pássaro contornaria tudo isso). Uma área que pegue os dois atinge o dono uma vez
  só. O dano periódico que o falcão leva sai da vida do dono, com a autoria. A cada tick, antes das mortes, o falcão
  volta a mostrar a vida do dono; dono caído, o falcão cai junto.
- **Não ataca:** sem ataque básico, voa até o alvo selecionado do dono e o segue. O básico sai do Aventureiro.
- **As habilidades saem do falcão:** projéteis e áreas partem da célula dele (`origemDaHabilidade`). O alcance continua
  medido a partir do Aventureiro, para a habilidade não ser recusada só porque o falcão voou para o outro lado. Usar
  uma habilidade ofensiva marca o alvo do dono, e o falcão persegue o mesmo. Na IA inimiga, o falcão é o último alvo
  da fila.
- **Explorador:** revela armadilhas com a Sabedoria do dono e recolhe o ouro em que pousa (só ouro). O minimapa passa a
  mostrar o falcão, os baús fechados e as armadilhas reveladas.

**Decisão: Mago, encarnação elemental.** O Mago assume o elemento da última magia ofensiva de fogo, gelo ou raio. As de
outros elementos não trocam, e a encarnação zera na troca de fase.
- **Fogo:** +5% no dano mágico, e a cada 1 s queima (fraco, 2 s) os hostis a 1 célula.
- **Gelo:** recebe 10% menos dano, e quem o golpeia corpo a corpo fica resfriado por 2 s.
- **Raio:** +15% de velocidade, e as magias com projétil ou que já saltam ganham um salto.

**Decisão: Arqueiro, Mira firme.** Uma barra enche em 6 s sem levar dano; cada ponto de Destreza acima de 10 encurta
2%, até 25%. Cheia, o próximo disparo de projétil (o `tiro` ou uma habilidade) sai carregado: crítico garantido
(d20 mínimo 16, x1,5, ou x2 quando sai 20; o `d20Minimo` agora viaja no projétil), atravessa todos na linha e vai até
o alcance máximo. Levar dano ou
disparar o tiro carregado zera a barra. Como a fúria, o valor é calculado na leitura a partir de um tick guardado.

**Apresentação.** A barra da fúria passa a ser a barra da classe e serve também à Mira firme. A encarnação aparece como
chip ao lado da vida. Tudo é feito com partículas: penas no falcão quando lança, a aura do elemento no Mago, o brilho
do Arqueiro com a barra cheia e o rastro dourado do tiro carregado. Os textos ficam no dicionário, com uma seção nova
no guia ("O jeito de cada classe").

**Regras.** Os números ficam em `balance.ajustesClasses` (balance 32: `aventureiro.falcaoPassoMs`,
`mago.encarnacao`, `arqueiro.mira`). A classe é lida pela bolsa ou, na rede, pelo `classeId`, então tudo vale na arena
e no grupo. Nada novo vai para o save: `encarnacao` e `mira` zeram na fase.

**Calibragem.** Com os números da proposta (fogo +15%, Mira em 4 s com d20 20), o simulador ficou em 72/77: o Mago
caiu para 3,4 s no comum dos níveis 1 e 5 (piso 3,5 s), o Arqueiro para 3,4 s no comum do 10 e 18,8 s no chefe (piso
25 s), e o Aventureiro focado venceu só 56% dos duelos contra o disperso (meta 60%). No duelo, o bot batia no falcão,
que é o hostil mais perto, e o golpe usava as defesas do pássaro; o redirecionamento ao dono resolveu (87,5%). O
Arqueiro já estava perto do piso do chefe (27,6 s sem a Mira), e todo combate começa com a barra cheia, por isso os
números baixaram: fogo +5%, Mira em 6 s com d20 mínimo 16. As metas não mudaram: 77/77.

## D-090 — Necromante no simulador, exército de mortos e Dízimo que ergue (marco 22, 23/10/2026)

**Contexto.** Ao conferir se o simulador levava em conta as invocações do Necromante, apareceram três falhas. Os mortos
eram simulados e o dano deles contabilizado, mas o Necromante não estava nas metas (só no diagnóstico). O bot nunca usava
o Comando sepulcral nem o Dízimo vital. E várias medidas terminavam na primeira morte, que podia ser a de um servo.

**Decisão: o simulador.**
- O Necromante entra na lista de classes das metas (94 critérios).
- **Medidas atentas às invocações:** o PvP, o duelo de builds e a economia acabam na queda de um personagem, não de uma
  invocação. A luta começa na primeira ação do time (o servo costuma abrir antes do dono). O "aguenta" mede o corpo do
  personagem, sem o servo.
- **Bot:** usa o Comando quando há mortos perto e um hostil ao alcance deles. Usa o Dízimo para erguer quando não há
  morto ao alcance e para drenar com a vida pela metade (antes das outras habilidades). Como uma pessoa, foca o jogador
  que invoca, não as invocações dele. Os adds de um chefe continuam valendo como qualquer hostil.

**Decisão: o Necromante.** Medido de verdade, ele matava um comum em 2,1 s (piso 3,5 s), vencia o chefe em 18,8 s (piso
25 s), aguentava 5 golpes sem o servo (meta 6 a 8), e a build focada vencia só 25% dos duelos (a Inteligência quase não
servia à classe). O usuário pediu que os mortos durem pelo menos 20 s, que o limite passe de 4 para 10 e que o dano de
cada um caia com a quantidade. Ficou assim (balance 33):
- reanimados e ecos duram 20 s (eram 25 s); limite de 10 invocações (2 do modo + 8 da classe);
- o dano dos mortos vai de 180% para 75%, multiplicado por `quantidade ^ -0,8` (com 10 de pé, cada um bate 16% do que bateria sozinho, e o exército inteiro, 1,6 vez);
- cada ponto de Inteligência acima de 10 dá +1 de Força e de Inteligência aos mortos erguidos (a build focada rende);
- vida base de 32 para 50 (save 22 migra os personagens com 32).

Resultado: comum em 4 a 4,5 s, chefe em 28,8 s, aguenta 6 a 7 golpes, PvP em 7,3 s, focada vence 68,8%. As 94 metas
passam. As metas não mudaram.

**Decisão: duas mecânicas pedidas.**
- **Retorno:** o morto a mais de 10 células (`necromancia.distanciaRetorno`) do Necromante volta para uma célula livre
  ao lado dele, com fumaça na saída e sombra na chegada.
- **Dízimo que ergue:** sem um morto ao alcance do ritual, o Dízimo vital ergue um: o servo, se ele caiu (e o retorno de
  8 s é liberado), ou um reanimado. Nesse modo não pede vida faltando; sem vaga, é recusado. O botão troca o ícone para o
  de invocar e ganha uma dica.

## D-091 — Falcão livre, encarnação com duração e flecha carregada (24/10/2026)

**Contexto.** O usuário achou a IA do falcão travada: ele voava até o alvo e ficava grudado nele. Depois de morrer e
renascer, o falcão novo saía do lado do Aventureiro e voltava sozinho ao combate antigo.

**Decisão.**
- **Alcance global:** as habilidades do Aventureiro (exceto o ataque básico) sempre saem do falcão, esteja onde estiver.
  O que decide se a habilidade pode ser usada é o alcance contado da posição do Aventureiro. O projétil voa do falcão
  até o alvo e só para em parede.
- **IA própria** (`entities/ia-falcao.ts`), números em `balance.ajustesClasses.aventureiro.falcao`:
  - o dono conjurando uma habilidade corpo a corpo: o falcão mergulha no alvo (só avança nesse caso);
  - em combate, com o alvo do dono a até 8 células dele: passeia em volta do alvo a 3 células, em arcos de até 90
    graus (contorna, não cruza por cima);
  - fora de combate: busca para o dono o ouro, os orbes de vida e de mana (quando faltam) e os de buff a até 7 células
    dele; sem nada para pegar, passeia a até 3 células do dono;
  - o ponto do passeio é sorteado pelo PRNG da IA e trocado a cada 1,2 s ou ao chegar.
- **Coleta:** o falcão entrega ao dono o ouro, a vida, a mana e os buffs (o ofensivo chega armado). Itens e o orbe de
  refúgio continuam para o jogador.
- **Voo:** o falcão não usa portas internas e passa por cima de rastros e armadilhas.
- **Renascer:** como o falcão só luta perto do dono, o alvo antigo, longe, não o puxa de volta.

**Simulador.** Na sequência de comuns, o próximo inimigo nascia 2 células à direita do jogador sem checar a parede.
Com o jogador na borda, nascia dentro dela, e os projéteis do falcão batiam ali. Agora ele nasce numa célula passável.
Metas: 94/94.

**Mago.** O usuário achou irritantes os efeitos piscando sobre o Mago encarnado. Agora:
- **visual:** parado, só um respiro discreto a cada 1,4 s; andando, uma trilha de partículas longas e lentas na cor do
  elemento, deixada onde ele passou. A rajada fica só no instante da troca de elemento;
- **duração:** a encarnação dura 12 s (`mago.encarnacao.duracaoMs`) desde a última magia do elemento. Lançar outra
  magia do mesmo elemento renova o tempo. O chip do HUD mostra quanto falta.

**Arqueiro.** O tiro carregado parecia uma bola de energia sem forma, porque soltava bolhas de brilho sobre a flecha.
Agora deixa uma esteira dourada longa e fina, alinhada com o voo, com algumas fagulhas soltas.

Metas: 94/94 (balance 34).

## D-092 — Dez slots, temas de fase, clima elemental e inimigos afins (24/10/2026)

**Contexto.** O usuário pediu:
- até 10 personagens por jogador;
- fases com decoração própria (floresta, gelo, castelo...), em 20 temas;
- elementos que pesem na fase a ponto de valer trocar a build;
- inimigos muito resistentes ou afins a um elemento, com aparência que mostre isso, e que em alguns casos se curem com
  o próprio elemento.

**Decisão.**
- **Slots:** `SLOTS` vai de 1 a 10 (`MAX_SLOTS`). A tela vira uma grade de duas colunas, e o slot vazio fica compacto,
  com a dificuldade e a fase do jogo novo num `details`.
  - Na nuvem, a migração `20261024120000_dez_slots.sql` troca o `check` do slot para 1–10. **Ela precisa ser aplicada
    no Supabase de produção** antes de alguém enviar o slot 4 em diante.
  - O schema do save sobe para 23 (migração identidade para os temas; D-093 usa o mesmo passo).
- **Temas** (`data/temas.json`, lidos em `world/temas.ts` e conferidos com o conteúdo). Cada tema traz:
  - paleta, luz e partículas do ar;
  - enfeites com pesos e densidade, e o pilar das salas grandes;
  - tipos e frequência das áreas de terreno;
  - inimigos com pesos e a chance de afinidade.
- **Os 20 temas:**
  - 7 neutros: masmorra, castelo, catacumbas, ruínas, biblioteca, mina e esgotos;
  - 13 elementais: vulcão, forja e deserto (fogo); caverna de gelo e tundra (gelo); pico da tempestade e laboratório
    (raio); pântano e floresta fúngica (veneno); floresta antiga e cânion de cristal (terra); cripta profana (trevas);
    templo celestial (sagrado).
- **Escolha do tema:**
  - cada fase gerada nova ganha um tema (`save/sequencia.ts`): elemental a cada 3 fases e neutro nas outras, sem
    repetir o anterior;
  - o sorteio usa PRNGs próprios (`id:tema`, `semente:tema`, `semente:pilares`), então **a fase sem tema sai igual à
    de antes**;
  - `fase-01` e `fase-02` usam masmorra e catacumbas;
  - a arena fica como está.
- **Mapa:**
  - nas salas de ao menos 7 × 6, o gerador ergue pilares: paredes soltas com as 8 vizinhas livres, que nunca fecham
    passagem;
  - os enfeites são só aparência: um hash da célula decide onde ficam (nada no estado nem no save), e o desenho é
    procedural e cozido no bloco do terreno;
  - a face das paredes ganha blocos na cor do tema;
  - tochas, velas e fendas de lava acendem a luz perto do jogador.
- **Áreas novas:**
  - gelo fino resfria;
  - campo elétrico eletriza;
  - lama atola;
  - névoa sombria definha;
  - luz sagrada cura e limpa o veneno.

  Os temas elementais têm uma área do elemento por sala, de raio 1 a 2. As fases sem tema sorteiam só as três
  clássicas, na ordem de antes.
- **Clima** (`combat/clima.ts`, `balance.clima`). No tema elemental:
  - as habilidades do elemento batem +25%, e o estado delas dura +50%;
  - as do oposto batem −25%;
  - a cada 6 s, o clima pesa nos personagens: queima, resfria, eletriza, envenena, atola ou definha. Quem tem 20% de
    resistência ao elemento pelo equipamento fica de fora;
  - o HUD mostra o chip do tema, e o log anuncia o clima ao entrar.
- **Afinidade** (`combat/afinidade.ts`, `data/afinidades.json`, `balance.afinidade`). É um afixo por instância, sem
  presets novos:
  - o afim absorve o próprio elemento (resistência 150): o golpe rola igual, mas **cura** metade do dano, e o estado
    do elemento não pega nele;
  - é fraco ao oposto (−50);
  - ganha uma habilidade do elemento e o nome dele ("Goblin de Gelo");
  - vale +25% de XP;
  - a variante extrema ("Primordial") tem 30% mais vida e vale +60% de XP. É imune a todo outro elemento e leva o
    dobro do oposto, então só cai pelo oposto ou pelo golpe sem elemento. É 1 em 8 dos afins, e sempre o chefe de um
    tema elemental.
- **Aparência e leitura:**
  - o afim fica tingido da cor do elemento e solta uma aura de partículas dela;
  - o quadro do alvo diz "Absorve Gelo · Fraco a Fogo";
  - a primeira absorção de cada elemento avisa qual é o oposto.
- **Bots:** não lançam o elemento que o alvo absorve e começam pela fraqueza dele.

**Simulador.** Os cenários das metas continuam neutros. Metas: 94/94 (balance 35). Medir builds certas e erradas numa
fase elemental fica para depois, sem meta nova, até o usuário aprovar números.

## D-093 — Armas fora da classe trocam o ataque básico (24/10/2026)

**Contexto.** O usuário quer que a arma na mão mude o jeito de atacar mesmo quando não é a da classe: o Mago de espada
golpeia corpo a corpo, o Guerreiro de cajado ataca de longe e o Mago de arco atira flechas.

**Decisão** (`progression/armas.ts`, `data/armas.json`):
- **Famílias:**
  - toda arma principal é de uma família: lâmina (espada, machado, adaga, maça, lança), cajado ou arco;
  - cada classe tem a sua família natural: lâmina para Aventureiro e Guerreiro, cajado para Mago e Necromante, arco
    para o Arqueiro.
- **Básico:**
  - com uma arma de outra família, o ataque básico vira o da arma: Golpe (corpo a corpo), Dardo arcano (projétil
    mágico) ou Tiro (flecha);
  - sem arma, ou com a natural, fica o básico da classe;
  - a troca é feita em `recalcularFicha`, ao equipar e ao desequipar;
  - a migração 22 → 23 a aplica nos saves de antes.
- **Custo:**
  - o básico emprestado bate 15% menos (`balance.armas.danoForaDaClassePct`);
  - o resto vem dos atributos e das afinidades da classe: o Guerreiro tem pouca Inteligência para o dardo, e o Mago
    perde o bônus mágico na espada;
  - as identidades seguem com a classe: a Mira firme só vale para o Arqueiro, e as habilidades do falcão não incluem
    o básico.
- **Interface:** ao trocar, o log e um aviso dizem qual é o ataque básico agora; a arma já aparece desenhada na mão.

> **Revista pela D-126 (29/10/2026)**: cada classe tem a sua família (lâmina, arco, tomo, cajado, arremessável) e
> cada arma o seu básico. O corte de 15% fora da família sai: no lugar, a classe perde parte da passiva sem a arma
> natural, e a arma de outra classe dá uma fração da passiva dela.

## D-094 — Skills de classe, ultimates e estados de controle (marco 24, 24/10/2026)

**Contexto.** O Grimório das Classes (aprovado antes do código) dá a cada classe skills próprias, uma ultimate por par
de skills e estados novos de controle.

**Decisão:**
- **Teclas:** 1 e 2 são as skills de classe; 3 a 6, as gerais. R usa a ultimate e F liga o ataque automático.
- **Ultimate:**
  - sai do par nas teclas 1 e 2, com um medidor que enche com o combate;
  - não fica na barra e é recusada sem par ou com o medidor abaixo do cheio;
  - trocar de encarnação enche o medidor, no máximo uma vez a cada 4 s.
- **Fases agendadas:** as etapas das ultimates ficam em `estado.fases` e vencem antes das conjurações do tick. Usam o
  alvo guardado ou a célula.
- **Estados:** cego, aterrorizado, confuso, desafiado, marca do caçador e Frenesi. No Frenesi, a resistência contra
  grupos vai a zero. Quem tem a marca do caçador de quem ataca não some para ele.

## D-095 — Sintonia, encarnações do Mago e tiro cheio do Arqueiro (marco 24, 24/10/2026)

**Decisão:**
- **Sintonia:** as famílias das skills gerais mudam as de classe (`data/sintonia.json`). As vertentes de cada classe
  dão a variação maior: Druida, Rapina, Tempestuoso, Alquimista, Arquimago, Geomante e as demais.
- **Mago:**
  - as gerais de terra, veneno, sombra e sagrado abrem encarnações (a de terra dá +1 de raio nas áreas);
  - trocar de elemento até 3 s depois da última magia funde os dois por 6 s: são as 21 encarnações duplas;
  - a sintonia arcana concentra mais rápido.
- **Arqueiro:** a sintonia marca o tiro cheio, que pode sair mágico, com ricochetes ou invisível.
- **Golpe:** o crítico garantido (Presságio) sai no próximo golpe; a sobrecarga sai na magia que ela fortaleceu.

## D-096 — Ressonâncias e sinergias passivas (marco 24, 24/10/2026)

**Decisão:**
- **Ressonâncias:** `ressonancias.json` v2 traz 24. Entre as novas:
  - Eco ancestral deixa a próxima skill de classe sem mana;
  - Engenhoso faz o projétil mágico atravessar;
  - Resiliente encurta os estados;
  - Oráculo enche o medidor mais rápido.
- **Sinergias:** Bastião de pedra, Disciplina férrea, Fluxo de cura e Avalanche humana valem com a passiva geral
  ligada. Os ganchos `aoUsarUltimate`, `aoEncherUltimate` e `aoConcluirCombo` são disparados pelos eventos do tick.
- **Ritmo:** o Ímpeto fica em 0,5 s e só nas skills de classe que ferem, porque o ritmo do Aventureiro no nível 10
  saía da meta.

## D-097 — Orientação, pelas costas e estados na IA (marco 24, 24/10/2026)

**Decisão:**
- **Orientação:** cada entidade olha para onde deu o último passo ou para quem atacou. "Pelas costas" é decidido pelo
  olhar do alvo, e a marca vai no evento para o número na tela.
- **Parar ataque:** um comando próprio, no teclado e no toque.
- **IA:** os estados mandam nela. O aterrorizado foge de quem aplicou, o confuso vaga sem atacar e o desafiado
  persegue só quem o desafiou.

## D-098 — Falcão com reflexo, pouso e voo livre (marco 24, 25/10/2026)

**Decisão:**
- **Reflexo:** do dano no falcão, chega ao dono 80% no nível 1 e 60% no máximo. Cura e estados seguem inteiros.
- **Alvo:** o falcão não atrai inimigos; só é alvo de quem já está perseguindo.
- **Pouso:** com o dono parado, sem hostil e sem nada para pegar por 6 s, o falcão pousa no ombro.
- **Render:** voo solto com mola e deriva, três quadros de asas e uma trajetória por skill. As ultimates são tingidas
  da cor delas.

## D-099 — Porta com espera, kit de engenho e música que alterna (marco 24, 25/10/2026)

**Decisão:**
- **Portas:** sair pela porta de fase pede ficar parado nela 3 s (`portas.esperaMs`); andar zera a espera. No grupo,
  cada um precisa ter cumprido a espera.
- **Santuário de Engenho:** entrega o kit de engenho, que converte uma armadilha revelada.
- **Música:** a variante troca a música dentro da mesma fase a cada 3 a 4 min.
- **Ultimate:** a cinemática fica só com a vinheta na cor dela, sem o nome.

## D-100 — IA dos inimigos por dificuldade (marco 25, 25/10/2026)

**Contexto.** O usuário pediu inimigos mais espertos quanto mais difícil, com o Normal já acima do de antes. Eles
pisavam em áreas de dano mesmo fora de perseguição. Devem cair nas armadilhas do jogador, e nas dificuldades altas
aprender a evitá-las. Quem absorve um elemento pode usar a área dele para se curar.

**Decisão:**
- **Perfil em dados** (`balance.dificuldades.<d>.ia`, lido por `perfilDaIa`):

  | | Fácil | Normal | Difícil | Pesadelo |
  |---|---|---|---|---|
  | Evita perigo | 30% | 70% | 90% | 100% |
  | Esquiva da telegrafia | 0 | 35% | 65% | 90% |
  | Cerca | não | sim | sim | sim |
  | Recua ferido (atirador) | — | — | 40% de vida | 50% de vida |
  | Cura na área afim | — | 40% abaixo de 35% | 70% abaixo de 45% | 90% abaixo de 55% |
  | Aprende armadilhas | 0 | 0 | 50% | 85% |
  | Foca o mais ferido | 0 | 0 | 30% | 60% |

- **Perigo** (`world/perigos.ts`):
  - entram as áreas que ferem (menos a do próprio elemento), os rastros e campos de veneno hostis pela `relacao()` e
    as armadilhas dos donos já vistos;
  - a patrulha nunca pisa no perigo; só passa por ele quando não há outra saída;
  - na perseguição, quem evita usa `caminhoComCusto` (Dijkstra por baldes, `custoPerigo` = 8 passos), que atravessa o
    perigo quando não há outro caminho.
- **Armadilhas:**
  - as do jogador são invisíveis para a IA: ela pisa, e o jogador pode atrair os inimigos andando em volta delas;
  - as de habilidade somem ao disparar, então o que se aprende é o dono: quem vê uma disparar a até 6 células passa,
    com a chance do perfil, a contornar as próximas dele (até 8 donos lembrados).
- **Cura afim:**
  - a área do próprio elemento cura o afim (`ambiente.curaAfim`, 6 por pulso), em vez de aplicar o efeito;
  - abaixo do limiar, ele pode ir até ela (a até 6 células) e fica até 90% da vida.
- **Esquiva:** sai da área telegrafada para a célula livre mais perto fora dela, até 2 passos. Quem já conjura não
  esquiva, e o chefe segura a posição (`balance.ia.arquetiposFirmes`).
- **Sorteios:** são por chave (hash), sem gastar o PRNG da IA, para o resto da partida seguir reproduzível.

**Balanceamento.**
- O recuo do atirador ferido no Normal alongava a luta do Necromante além da meta; ficou só no Difícil e no Pesadelo.
- A esquiva do chefe encurtava a luta do Guerreiro abaixo da meta, então o chefe não esquiva.

## D-101 — Mais inimigos conforme se avança (marco 25, 25/10/2026)

**Decisão** (`world/populacao.ts`, `balance.populacao`):
- Cada fase depois da primeira soma 10% dos inimigos comuns, proporcional à área passável da fase (a referência é a
  área média das oficiais).
- Tetos: 3x os comuns e 60 inimigos.
- Os reforços nascem perto de comuns sorteados, com o mesmo preset e nível, pelo PRNG da fase.
- Fica fora das fases de enxame.
- Só vale na criação da fase: saves em curso não mudam.

## D-102 — Falcão protetor (marco 25, 25/10/2026)

**Decisão:**
- **Golpe com voo:**
  - os golpes de contato do Aventureiro que ferem saem do falcão: ele voa até o alvo, e o impacto vem na chegada;
  - a fase agendada leva a ação, e o lançamento é o completo;
  - o dono fica livre durante o voo;
  - a velocidade é 1x, 5x e 7x a patrulha nos níveis 1, 20 e 30, e a Sabedoria soma até +30%.
- **Dash de defesa:**
  - um projétil hostil que acertaria o dono (passa a até 0,6 célula dele, nas próximas 8) faz o falcão cortar a
    linha a tempo;
  - o projétil acerta o falcão, e só o reflexo chega ao dono;
  - a velocidade é 2x, 6x e 9x nos níveis 1, 20 e 30, e o Carisma soma até +30%. No nível 30, quase nada passa.
- **Render:** no dash e no mergulho, a mola fica bem mais dura, sem deriva, com rastro branco curto. A diferença para a
  patrulha fica clara.
- **Rede:** as fases agendadas entram nos patches da arena.

**Balanceamento.**
- A meta "build focada vence a dispersa" do Aventureiro falhou com o voo, e o motivo era outro:
  - o Mergulho tirava cerca de 60% da vida no duelo, então dois matavam qualquer build;
  - vencia quem acertava o segundo primeiro, o que dependia de onde cada falcão patrulhava;
  - em 64 sementes, a taxa já era de 53 a 55% antes do voo, e a amostra de 16 passava por sorte.
- **Correções, aprovadas pelo usuário:**
  - a skill que escala com Destreza (as do falcão e a Flecha explosiva) rola com Força e Destreza, em vez de Força e
    Inteligência; a build que investe no atributo da skill rende mais;
  - na arena (`modos/livre.json`, `pvp.danoClassePct`: 60), as skills de classe batem 60% entre personagens. O duelo
    dura alguns golpes, e os atributos decidem. A campanha e o cooperativo não mudam;
  - o golpe em voo não confere de novo o alcance a partir do dono, que pode ter andado: o alcance já valeu na
    conjuração.
- **Amostra:** os duelos de build passam a 64 sementes, porque com 16 a taxa do Arqueiro oscilava cerca de 20 pontos.
  O simulador inteiro leva cerca de 1 min.
- **Resultado:** focada contra dispersa dá Aventureiro 65,6%, Guerreiro 92,2%, Mago 90,6%, Arqueiro 74,2% e
  Necromante 92,2%. Metas: 94/94.

## D-103 — Arco branco, anel do Necromante e aceleração pelo total (marco 25, 25/10/2026)

**Decisão:**
- **Arqueiro:** com o tiro especial pronto, o arco fica branco, num pulso suave de 2000 ms (alfa entre 0,55 e 0,8,
  fixo em 0,65 com movimento reduzido). Sai a emissão de partículas.
- **Necromante:**
  - as invocações temporárias ganham um anel roxo que se esvazia com a duração;
  - no último terço, o anel mistura para branco e o alfa cai até 0,25;
  - a permanente fica roxa e inteira.
- **Aceleração da mente:**
  - corta 25%, 33% ou 50% do tempo total do estudo;
  - se o corte passa do que falta, o estudo conclui na hora. Exemplo: 18 min, restam 6, e a incomum conclui.

## D-104 — Movimento livre em qualquer direção (marco 26, 25/10/2026)

**Contexto.** O personagem andava célula a célula, só em passos cardinais. Uma diagonal virava passos alternados, e
clicar num ponto diagonal fazia uma escadinha. O usuário pediu o máximo de fluidez em todas as direções, não só a
diagonal. Armadilhas, áreas, rastros e alcance continuam por célula (escolha do usuário).

**Decisão:**
- **Posição:** a entidade ganha `px`, `py`, a posição contínua em células (o centro da célula é o inteiro). `x`, `y`
  continuam como a célula ocupada, o arredondamento da posição, mantido pelo integrador e por `posicionar()`. Por isso
  as regras por célula, a IA e o alcance seguem iguais. Saem `destinoX`, `destinoY`, `progressoPasso` e
  `proximoEixoX`. Quem escreve só a célula (teletransporte antigo, testes) leva a posição junto no tick seguinte.
- **Corpo redondo** (`world/corpo.ts`, raio `balance.movimento.raioCorpo` = 0,32):
  - o círculo contra as células intransitáveis e as muralhas táticas, em subpassos de 0,2, um eixo de cada vez: o eixo
    que bate fica, o outro segue, e o corpo desliza na parede;
  - quando não cabe inteiro, encosta por bissecção (rente à parede, a menos de 0,0002 célula);
  - entre quem se bloqueia (as regras de `bloqueia`), dois raios de distância; travado de frente contra um corpo, tira
    a componente que aproxima e escorrega em volta. Quem já encosta (nasceu junto) pode se afastar, não se aproximar.
- **Comando:** `mover` leva o vetor exato (`dx`, `dy`, inteiros em ±1000) além do octante `dir`, que os bots e a IA
  ainda usam. `irPara` aceita o ponto com fração, validado na rede (finito e dentro de ±10.000).
- **Caminho sem escadinha:** a busca continua nas 4 direções; o caminho é suavizado puxando a corda
  (`suavizarCaminho`): de cada ponto, o nó mais distante que o corpo alcança em linha reta (a faixa do raio,
  amostrada a cada 0,2, até 24 nós à frente). Com o mapa de perigo da IA, o perigo conta como parede na suavização. O
  último ponto é o ponto tocado, se o corpo cabe nele. O avanço (Investida) replaneja o resto do trajeto do mesmo jeito.
- **Determinismo:** só soma, produto, divisão e `Math.sqrt` no núcleo; nada de trigonometria.
- **Parado:** a direção mantida conta como movimento para o pouso do falcão e para a espera na porta de fase (antes,
  quem segurava a seta contra a parede não dava passo e contava como parado).
- **Rede:** o estado público leva `px`, `py` em milésimos de célula, arredondados na direção do centro da célula (quem
  encosta na parede se afasta dela, nunca entra, e a célula não muda). O relógio de caminhada, que nada na tela lê,
  fica só no servidor. O falcão marca o fim da atividade do dono só nas transições: reescrever `modoDesdeTick` a cada
  tick mandava a IA inteira em todo patch. Com isso, a carga da arena-02 (10 bots, perfil suportado) fica em 33 a
  37 KiB/s, abaixo dos 43,8 da `main` medidos na mesma máquina; sem esses ajustes eram 96 KiB/s.
- **Save:** schema 25. A migração põe cada entidade no centro da célula onde estava (a de destino, se já tinha passado
  da metade do passo), parada e sem caminho.

**Balanceamento.**
- Com o movimento livre, o Guerreiro sozinho matava o chefe da fase 1 em 21,4 s (meta 25 a 40 s): fica colado nele,
  sem perder golpes reposicionando. O chefe (`boss`) passa de 310 para 350 de vida. As outras classes ficam entre 33 e
  36 s sozinhas. Metas: 94/94.
- O diagnóstico que mantinha a morte simultânea do Arqueiro no Pesadelo usava uma semente que deixou de morrer; o
  teste passa à semente 30801 no nível 1.

## D-105 — Controles do isométrico na inclinação do mapa (marco 26, 25/10/2026)

**Contexto.** No isométrico, o joystick usava 8 setores de 45° e um remapeamento a 45°, mas a projeção é 2:1: os eixos
da fase aparecem a cerca de 26,6°. Empurrar ao longo do corredor caía no setor errado. O usuário pediu que as direções
do joystick acompanhem a inclinação do mapa, e que o D-pad gire com ele.

**Decisão:**
- **`vetorDaTela(sx, sy, iso)`** (`input/direcao.ts`) leva o vetor da tela à fase pela inversa linear da projeção:
  `x = sx + 2·sy`, `y = 2·sy − sx`, normalizado e quantizado em ±1000 (sem −0). De cima é a identidade. O personagem
  anda na tela exatamente para onde o dedo aponta, e empurrar ao longo da inclinação anda no eixo da fase.
  Substitui `remapearParaGrade`.
- **Joystick:** analógico, em qualquer ângulo, fora da zona morta de 14 px. Só reemite quando o ângulo muda mais de
  cerca de 3°, o que poupa rede.
- **D-pad:** no isométrico, o anel recebe a mesma projeção em CSS (`scale(0.9) scaleY(0.5) rotate(45deg)`). Cada botão
  fica na inclinação do eixo da fase que manda, e manda esse eixo exato. A visão nova vale na hora (tecla V ou
  Configurações).
- **Teclado:** as 8 direções de tela (setas e WASD) passam pela mesma inversa.
- **Clique e toque no chão:** mandam o ponto contínuo tocado (`Camera.pontoSob`, em centésimos de célula), não o centro
  da célula. Tocar num hostil continua selecionando pela célula.

## D-106 — Paredes do isométrico finas e baixas (marco 26, 25/10/2026)

**Contexto.** As paredes do isométrico eram prismas de uma célula inteira com 0,6 célula de altura. O usuário pediu
paredes 80% mais finas e 70% mais baixas.

**Decisão:**
- **Placa** (`render/paredes-iso.ts`, `placasDaParede`): uma por aresta entre parede e chão (cardinal), dentro da
  célula de parede, com 0,2 célula de espessura (`ESPESSURA_PAREDE`) e 0,18 de altura (`ALTURA_PAREDE_PX`). A face fica
  na aresta, onde o corpo do personagem encosta: o desenho bate com a colisão.
- **Quinas:** um bloquinho de 0,2 × 0,2 onde a parede só toca o chão na diagonal. A face da frente some quando a
  célula vizinha daquele lado é parede (ali a placa continua ou vira a quina).
- **O resto da célula de parede** é a rocha plana e escura do terreno, como na visão de cima.
- **Ordem de desenho:** um Graphics por diagonal, com o `zIndex` de antes.

> **Nota (31/10/2026, D-130):** revista a pedido do usuário. As placas ficam com 0,3 de espessura e 1,15 célula de
> altura (`visual.paredeIso`), com a pedra do tema e sumindo perto do jogador; o muro de uma célula com chão dos dois
> lados vira um bloco só.

## D-107 — Sem direcional no computador e teclas EWAS (marco 26, 25/10/2026)

**Contexto.** No computador com tela de toque (ou janela pequena), o jogo mostrava o joystick ou o D-pad. Lá o
isométrico se joga com o mouse. O usuário pediu também uma opção de teclas que acompanhe a inclinação do mapa.

**Decisão:**
- **`mostrarDirecional(s)`** (`plataforma/dispositivo.ts`) = toque e **sem mouse** (`any-hover: hover` e
  `any-pointer: fine`). No computador, o direcional some; a faixa de ações fica.
- **Preferência `teclasMovimento`** (`wasd` padrão, ou `ewas`), nas Configurações, mesmo sem toque.
- **EWAS no isométrico** (`input/teclas.ts`, `rumoDasTeclas`): E anda para o norte da fase (cima-direita na tela), W
  para o oeste, A para o sul e S para o leste. Duas teclas juntas dão a diagonal da fase. As setas seguem como
  direções de tela. De cima, EWAS vale como WASD.
- **Interagir** passa para o **D** no modo EWAS do isométrico. O prompt e o guia mostram a tecla atual.

## D-108 — Braços e pernas animados nos quadros do atlas (marco 26, 25/10/2026)

**Contexto.** O usuário pediu braços e pernas que se mexem nos personagens jogáveis e nos inimigos, nas duas visões.
O "quadro 1" antigo só trocava um pouco o comprimento dos membros. Ao testar, viu-se que o token **nunca contava como
andando**: a posição visual começava em `NaN`, e a comparação com `NaN` dá sempre falso (falha desde o marco 13). Por
isso nem a passada por fatias aparecia.

**Decisão:**
- **Seis quadros por vista** (`render/modelos/membros.ts`): 0 parado, 1–2 a perna esquerda à frente, 3–4 a direita,
  5 o golpe com o braço da arma estendido. Pernas giram no quadril (até 34°) e braços no ombro (até 30°), em
  oposição. Os modelos de veste ondulam a bainha. De cima, os pés alternam à frente e atrás.
- **Feras:** o lobo trota em pares diagonais, a aranha alterna as patas em dois grupos e o slime achata e estica. O
  falcão segue com os três quadros de asa (`membros: false`).
- **Escolha do quadro** (`render/quadro-membros.ts`, puro): andando, pela fase da passada (o mesmo relógio de
  `caminhada.ts`); no golpe, o quadro 5; parado, o 0; com movimento reduzido, sempre o 0.
- **Fatias:** nesses modelos, as tiras de baixo não se dividem mais em duas colunas (as pernas não andam duas vezes).
  Ficam o balanço vertical, a respiração e o empurrão.
- **Equipamento:** a arma e a mão secundária (agora numa camada própria) seguem a mão em cada quadro. O rig as desloca
  pela diferença da mão em relação ao quadro 0.
- **A imagem própria do jogador** não tem membros. Segue com a passada por fatias.
- **Atlas:** cerca de 250 quadros numa grade de 16 colunas (2368 × 2368 px, dentro do limite de 4096).

## D-109 — Objetos em pé no isométrico (marco 26, 25/10/2026)

**Contexto.** No isométrico, ouro, orbes, portas, enfeites e pilares ficavam no contêiner do chão, com a matriz do
piso. Pareciam pintados no chão em vez de acompanhar a ilusão 3D. O usuário escolheu pilares como **colunas altas**.

**Decisão:**
- **Objetos** (`render/objetos.ts`): ouro (moedas de pé), orbes (flutuando sobre uma sombra que encolhe quando sobem)
  e santuário (cristal sobre a base) ficam na camada das entidades, com o `zIndex` da profundidade. Os halos seguem
  no chão.
- **Portas** (`render/portas.ts`): a moldura e o cadeado ficam de pé na célula da porta; o número do par fica de pé
  acima do anel. O anel de espera segue no chão.
- **Enfeites e pilares** (`render/decoracao-iso.ts`): um Graphics por diagonal, como as paredes.
  - **Em pé:** tocha, barril, estandarte, lápide, vela, arbusto, árvore, estante, livros, carrinho, cristal, cacto,
    cogumelo, junco, vitral, corrente e estalactite, com o desenho de sempre, sem a matriz. Os de parede ficam com a
    base na aresta norte.
  - **Chão:** os demais (pedras, tapete, poça, runa, lava, teia…) seguem no terreno.
  - **Pilar:** o desenho do tema esticado 1,5 vez (cerca de 1 célula de altura), sobre uma sombra no losango da
    célula. `placasDaParede` não gera placa para o pilar, e o terreno pinta o piso por baixo.
- **Troca de visão:** o terreno redesenha os blocos (`definirVisao`). De cima, nada muda.

## D-110 — Lore das classes e Dom da classe (marco 26, 26/10/2026)

**Contexto.** A tela de seleção descrevia as classes por números (fúria, porcentagens, nível 20). O usuário pediu uma
lore curta em dark fantasy, no estilo de Brandon Sanderson (magia com regra e custo), com o estilo de jogo e as
mecânicas que importam, sem status.

**Decisão:**
- **Seleção** (`ui/escolha-classe.ts`): `classe.<id>.descricao` é a lore (2 a 3 frases, sem dígitos) e
  `classe.<id>.estilo` é uma linha "Estilo:", com o jeito de jogar e as mecânicas (o falcão, as técnicas de sangue,
  a encarnação, a Mira firme, o exército). As 5 classes foram reescritas do zero.
- **Os números** foram para `classe.<id>.dom`: um bloco dobrável "Dom da classe" na aba Habilidades da mochila, com
  as afinidades.
- **Teste:** os textos de lore e estilo não têm dígitos.

## D-111 — Combos da build pela barra e Diário detalhado (marco 26, 26/10/2026)

**Contexto.** "Combos da sua build" listava combos ainda não descobertos, tirados das skills conhecidas. O Diário
mostrava só nomes.

**Decisão:**
- **Combos da build** (`ui/combos.ts`): os candidatos são os combos cuja sequência está toda na barra (as skills
  equipadas).
  - **Descoberto** (`combo:<id>` no diário): nome, como se faz (as skills em ordem, a janela, "no mesmo alvo" e as
    condições) e o efeito.
  - **Não descoberto:** `????`, só com a quantidade de skills.
  - **O indicador de combo em preparo** também não revela o nome de um combo não descoberto.
- **Diário** (`ui/diario-detalhes.ts`, `descreverEntrada`): cada entrada descoberta vira um cartão com "Como" e
  "Efeito", montados dos dados.
  - **Cobre todos os tipos:** reação, combo (com a marca "na sua barra"), ressonância, marco de nível, fusão,
    variação de item, conjunto, regra de buff, origem rara e evento.
  - **Tipo novo:** `sinergia` (as passivas de `sinergias.json`), anotado no evento `sinergiaPassiva`.
  - **O que falta** continua `???`, com o tipo à vista.

## D-112 — Portais por destino e portais internos por cor (marco 26, 26/10/2026)

**Contexto.** As portas de entrada e saída eram molduras iguais em toda fase, e os portais internos eram círculos
com um número. O usuário pediu portais de verdade, com a cara da fase de destino (gelo com borda congelada e
estalactites, por exemplo). Os internos deveriam ser identificados só pela cor.

**Decisão:**
- **Em dados:** cada tema de `temas.json` tem `portal: { estilo, cor }`.
  - **Estilos** (`ESTILOS_PORTAL`): pedra, gelo, fogo, veneno, raio, trevas, sagrado, terra e psíquico.
  - **Validação:** o leitor de `world/temas.ts` confere o campo.
- **Destino:** `save/destinos.ts` (`temasDosPortais`) acha o tema da fase seguinte e da anterior por `faseSeguinte`
  e `faseAnterior`.
  - **Na cena:** o jogo solo e o grupo passam esses temas para ela.
  - **Fase oficial sem tema:** vira o portal de pedra, na cor da fase.
- **Desenho** (`render/molduras-portal.ts`, `render/portas.ts`):
  - um vórtice animado no miolo e a moldura no estilo do destino;
  - em pé no isométrico (com profundidade) e visto do alto de cima;
  - a saída trancada tem o vórtice apagado, correntes e cadeado;
  - a porta temporária do chefe é dourada.
- **Ar em partículas** (`render/presets-mundo.ts`): um preset por estilo, emitido a cada 260 ms. Respeita o limite
  de partículas e o movimento reduzido.
- **Portais internos:** vórtices ovais sem número. A cor sai de uma paleta de 6 matizes por par (`corDoPar`), e o
  anel de espera usa a mesma cor.

## D-113 — Quebráveis (marco 26, 26/10/2026)

**Contexto.** Barris, caixotes e afins eram só enfeite. O usuário pediu que os elementos que fazem sentido quebrar
quebrem com ataques e soltem nada, 1 a 3 de ouro, um buff ou cura. Escolheu que **não bloqueiam a passagem** e que
entram **caixote** e **vaso**.

**Decisão:**
- **Tipos** (`balance.quebraveis.tipos`): barril, caixote, vaso, carrinho, livros, cristal, cogumelo e arbusto.
  - **Caixote:** novo, com pesos em masmorra, castelo, mina, esgotos e forja.
  - **Vaso:** novo, com pesos em catacumbas, ruínas, templo, deserto e cripta.
  - **A vela ficou de fora:** a luz dela seguiria acesa depois de quebrada.
- **Estado:** um objeto `quebravel` (a forma em `ref`, o id `q:x,y`) para cada enfeite desses de `decoracoesDaFase`.
  - **Onde nascem:** são postos em `povoarFase`, só nos modos com `objetosDeFase` (campanha e grupo).
  - **Não bloqueiam e não são coletados:** o que cai no chão pode ficar na mesma célula.
- **Quem quebra** (`combat/quebraveis.ts`): só o lado do jogador (`ladoDoJogador`); os monstros passam sem quebrar.
  - **Básico:** o `ataqueBasico` aceita uma célula. Clicar no quebrável golpeia na hora, se estiver no alcance;
    senão, o personagem anda até ele e golpeia ao chegar (`ui/golpe-quebravel.ts`).
  - **Área:** as células da forma quebram o que pegam.
  - **Projétil:** quebra o primeiro no caminho e para nele; o que atravessa segue.
- **Saque** (`balance.quebraveis.saque`): nada 40, ouro (1 a 3) 34, orbe de vida 12, de recurso 9, de efeito 5.
  - **Sorteio próprio:** semeado pela fase e pelo objeto, sem gastar o RNG do estado. As metas seguiram em 94/94.
  - **Os orbes** usam as porcentagens de `drops`.
- **Render:** o terreno e os enfeites em pé pulam esses tipos. `render/objetos.ts` desenha cada quebrável uma vez,
  em pé no isométrico e no chão de cima. Ao quebrar, saem lascas em partículas (madeira, barro, cristal ou folhas)
  e o som de acerto.
- **Save v26:** a fase gravada antes ganha os quebráveis uma vez, ao abrir (o marcador `quebraveis` no estado). A
  versão impede um cliente antigo de tomá-los por orbes.

## D-114 — Clique fora das células anda na direção (marco 26, 26/10/2026)

**Contexto.** Clicar numa parede, no vazio fora do mapa ou num lugar sem caminho fazia o `irPara` falhar, e o
clique se perdia.

**Decisão:**
- **Novo `planejarIrPara`** (`world/movimento.ts`), usado pela simulação e pela previsão do cliente. Tenta, nesta
  ordem:
  1. limitar o ponto às bordas da fase;
  2. achar o caminho até o ponto;
  3. sem caminho, ir à célula alcançável mais próxima do ponto (`alcancavelMaisPerto`, uma busca em largura com
     desempate fixo);
  4. se essa célula for a própria, andar reto na direção do clique até o corpo não caber mais.
- **A IA não muda:** segue com `planejarCaminho`.

## D-115 — Mouse que guia como o joystick (marco 26, 26/10/2026)

**Contexto.** No computador, o clique só valia ao soltar, arrastar movia a câmera e seguir o cursor esperava
300 ms. O usuário pediu agilidade parecida com o joystick do celular.

**Decisão** (`input/ponteiro.ts`, só `pointerType === 'mouse'`; o toque não muda):
- **Botão esquerdo:** age já no `pointerdown`. No chão, `irPara`; num hostil, seleciona; num quebrável, o golpe.
- **Segurar** (120 ms ou 6 px de movimento): guia como o joystick.
  - **Direção:** a cada quadro, o vetor do personagem até o cursor passa por `vetorDaTela` e vira `mover`.
  - **Rede:** só reemite quando o rumo muda.
  - **Parar:** a até 14 px do personagem, ele para.
- **Soltar:** depois de guiar, manda parado.
- **Câmera:** o arrasto passou para o botão do meio ou o direito. A roda segue com o zoom.


## D-116 — Runas das classes (marco 26, 28/10/2026)

**Contexto.** O usuário enviou um desenho com uma runa por classe e pediu: a seleção de classe sem aparência de
cartão, com o retrato, o estilo, uma linha de lore, "Ver mais" e a runa no topo; a runa nos livros e nas skills de
classe; e a runa sobre a cabeça dos personagens, desligável, com cores diferentes para jogadores da mesma classe.

**Decisão:**
- **Uma fonte, dois desenhos** (`render/runas.ts`): os traços (linha, curva quadrática, círculo) num quadro de 100,
  com a cor da classe. `ui/runa-dom.ts` monta o `<svg>` por `createElementNS`; `desenharRuna` desenha no Pixi com um
  contorno escuro por baixo.
- **Seleção em colunas** (`ui/escolha-classe.ts`): sem borda nem fundo, separadas por um fio. A runa (48 px), o
  nome, o retrato (o modelo do jogo em 3/4 com a arma da classe, `render/retrato.ts`, num `<img>` de SVG), o estilo,
  a primeira frase da lore e um `<details>` "Ver mais" com a lore inteira e as skills iniciais. No celular, uma faixa
  com `scroll-snap` na horizontal.
- **Livros e skills:** a runa pequena antes do nome do livro que ensina uma skill exclusiva (mochila e loja), no nome
  e no começo da descrição das cartas de skill de classe e no seletor da barra. É `aria-hidden`: o texto não muda.
- **Sobre a cabeça:** de todos os jogadores, acima das barras. A do jogador local é 1,25× maior e tem um halo. Some
  com o morto. Só redesenha quando a classe, a cor ou o dono mudam.
- **Cores:** `coresDasRunas` agrupa os jogadores (sem IA nem invocações) por classe e ordena por id. O primeiro
  fica com a cor da classe; os seguintes com a matiz girada (180°, 90°, 270°…). É pura: todos os clientes veem igual.
- **Opção:** `Preferencias.runaDaClasse` (ligada por padrão), em Gráficos.

## D-117 — Câmera solta e o botão de centralizar (marco 26, 28/10/2026)

**Contexto.** Com a câmera em janela, depois de arrastar para ver outro lugar, andar recentralizava. O usuário pediu
que não recentralize, um botão ao lado do direcional que centraliza com toque duplo, e que, andando, a câmera só
reenquadre o personagem quando ele sair 100% da tela, pondo-o na borda mais próxima.

**Decisão** (`render/camera.ts`, `render/camera-calculo.ts`, `ui/botao-centralizar.ts`):
- **Câmera solta:** o arrasto e o zoom manual, no modo janela, ligam `solta`. Solta, a câmera não usa a janela morta
  nem o "enquadrar dois".
- **`acomodarNaBorda`** (pura): com algum pedaço do personagem na vista, nada muda; fora dela, a câmera move só o
  necessário, por eixo, para pô-lo na borda mais próxima, por dentro, com margem de 1 célula. Uma borda "presa" por
  eixo evita o tranco de soltar e voltar a prender a cada quadro.
- **Botão:** ao lado do direcional no toque; no computador, no mesmo canto. Dois toques em até 350 ms chamam
  `recentralizar()`; um toque mostra a dica. Acende enquanto a câmera está solta. A tecla C, duas vezes, faz o mesmo.

## D-118 — Inimigos reagem logo e seleção em raio menor (marco 26, 28/10/2026)

**Contexto.** Inimigos demoravam até 10 s para reagir (o "?" da hesitação). O usuário pediu também a área de
seleção de alvo 50% menor.

**Decisão:**
- **Hesitação:** a tabela passa a 0,5 s (35%), 1 s (35%) e 1,5 s (20%), com `hesitacaoBaseS` 10 (a escala dos
  presets fica), e um teto novo `ia.hesitacaoMaxS` de 2 s, aplicado depois do fator de dificuldade
  (`hesitacaoComTeto`).
- **Seleção:** `combate.raioTrocaAlvo` de 10 para 5 (o Q, o botão de alvo e o toque que procura o próximo hostil). O
  alvo automático no alcance da skill não muda.

## D-119 — Skill fora do alcance troca de alvo (marco 26, 28/10/2026)

**Contexto.** Uma skill com o alvo selecionado fora do alcance era recusada. O usuário pediu que mude para o alvo
mais próximo no alcance, se houver.

**Decisão** (`combat/acao.ts`, `iniciarAcao`, só para quem não é IA e quando o comando não mira uma célula):
- **Ofensiva:** `autoAlvo` no alcance da skill; o achado vira o alvo da ação e o `alvoSelecionado`, mantendo a trava.
- **De suporte:** `aliadoMaisFerido` no alcance.
- **Ninguém no alcance:** recusa com `fora_de_alcance`, como antes. A mira em célula não muda.

## D-120 — Dash e teleporte atravessam paredes (marco 26, 28/10/2026)

**Contexto.** O usuário pediu que dash e teleporte atravessem paredes dentro do alcance, para trocar de corredor.

**Decisão** (`combat/efeitos-instantaneos.ts`; regra em dados, `movimento.dashAtravessaParedes`):
- **Dash (`avancar`):** percorre a reta até a mira (Bresenham, `linhaAte`) e para na última célula livre. Paredes no
  meio não interrompem; a parede no fim recua até a célula livre anterior. O fim do mapa encerra a reta.
- **Muralhas táticas** (as erguidas por skill) continuam barrando o dash: são parte da luta, não do mapa.
- **Teleporte:** com a mira numa parede ou célula ocupada, cai na primeira célula livre da reta de volta até quem
  conjura.
- **Empurrão, puxão e arremesso** seguem parando na parede.
- **Nota (29/10/2026):** o avanço das skills só saía no acerto e a linha parava na parede; ver D-125.

## D-121 — Seguir alvo (marco 26, 28/10/2026)

**Contexto.** O usuário pediu que, por padrão, o personagem siga o alvo para mantê-lo no alcance, com folgas
diferentes para quem ataca à distância e corpo a corpo, troca de alvo depois do abate e cancelamento pelo direcional.

**Decisão** (`combat/seguir-alvo.ts`, depois do básico automático em `simular`; números em `balance.seguirAlvo`):
- **Comando** `seguirAlvo { ligado }`, como o `autoAtaque`, emitido pela cena conforme a preferência
  `seguirAlvo` (ligada por padrão). Vale igual no solo e no grupo (`comandosDeRede`) e é determinístico.
- **À distância** é o básico que sai em projétil (`politicaImpacto === 'projetil'`); não o alcance (a lança do
  Guerreiro tem alcance 2 e é corpo a corpo).
- **Segue** quem saiu do alcance até `alcance × (1 + folga)`: 1/3 à distância, 100% corpo a corpo. Além disso, para
  e não persegue. No alcance, para e deixa o básico golpear. Replaneja quando o alvo se afasta
  `ia.recalcularDistancia` do ponto planejado.
- **Clicar em outro alvo** troca a seleção; a automação passa a segui-lo pela mesma regra.
- **Depois do abate:** o hostil mais próximo no alcance (à distância) ou em até 4× o alcance (corpo a corpo), sem
  travar.
- **Direcional:** o `mover` manual tem a vez enquanto dura. Mais de 120° contra o rumo do alvo, ou um `irPara`,
  cancela a automação daquele alvo até outro ser escolhido (`seguirCanceladoDe`, limpo por `selecionarAlvo`).

- **Marco 26 (29/10/2026), a distância que a automação busca:** é o menor alcance entre o básico e as skills
  ofensivas **prontas** da barra (sem recarga, com o custo de mana e vida pagável; a área em volta conta pelo raio).
  Com o alvo no alcance do básico, mas fora do da skill pronta mais curta, o personagem ainda se aproxima. Por
  exemplo, o Guerreiro com o Redemoinho pronto chega a 1 célula sem assumir o controle. A folga para seguir quem foge
  e a troca depois do abate seguem medidas pelo básico. O custo saiu de `iniciarAcao` para `custoDaHabilidade`.

## D-122 — O jogo não pesa com o tempo no celular (marco 26, 29/10/2026)

**Contexto.** No celular, o jogo começava fluido e ficava pesado depois de um tempo jogando. A investigação achou
várias causas que se somam; nenhuma é um vazamento que cresce sem parar:
- **Qualidade automática que só descia.** Alguns picos levavam ao mínimo, com teto de 30 fps até o fim da cena.
- **Laço que tentava alcançar o atraso.** Até 15 ticks num quadro lento deixavam o seguinte ainda mais lento.
- **Drops que se acumulavam no chão.** Eram redesenhados todos, a cada quadro, mesmo fora da tela.
- **Um salvamento inteiro por abate.** O save ainda crescia com as fases visitadas e com as recargas, que nunca
  eram apagadas.
- **O mapa inteiro convergindo sobre o jogador.** A colisão varria todas as entidades a cada subpasso e a cada
  bissecção.
- **Lixo para o coletor.** Um texto novo por número de dano, texturas de equipamento presas no cache global do
  Pixi e mapas por id que nunca eram limpos.

**Decisão:**
- **Medidor:** uma segunda linha com entidades vivas, objetos no chão, máximo de ticks por quadro, nível de
  qualidade e o tempo do último salvamento.
- **Laço:** a campanha solo recupera o atraso enquanto os ticks do quadro somam até 10 ms
  (`ORCAMENTO_SIM_SOLO_MS`); passado isso, descarta o resto. O grupo e a arena seguem sem orçamento, porque
  acompanham o servidor.
  - *Ajuste da sexta leva:* a primeira versão tinha um teto fixo de 4 ticks por quadro e deixava o jogo em câmera
    lenta quando o desenho era o lento (o CI sem GPU falhou no e2e da sala B). O orçamento de tempo só corta quando o
    tick é caro, que é o caso da bola de neve.
- **Qualidade que sobe:**
  - Com 30 s de quadros bons (média ≥ 92% do alvo e p95 ≤ 1,25 quadro), sobe um nível, até o nível com que a
    cena começou.
  - Se cair logo depois de subir, a espera da próxima subida dobra, até 4 min.
  - O quadro do salvamento não conta.
  - Só a descida avisa.
- **Drops com prazo no chão** (`economia.prazoNoChao`, em ticks e determinístico):
  - orbes somem em 60 s;
  - ouro e itens comuns e incomuns, em 180 s;
  - livros, essências e itens raros ou melhores ficam.
  - O desenho dos objetos pula o que está fora da vista da câmera.
- **Save:**
  - **Abate:** não grava na hora; o salvamento por tempo, de 30 s, leva a contagem.
  - **`fasesVisitadas`:** guarda as 8 últimas fases. A mais antiga sai e é gerada de novo se revisitada.
  - **`recargas`:** as vencidas saem a cada 600 ticks. Toda leitura trata a chave ausente como pronta, e o
    invariante do harness aceita a saída da chave já vencida.
- **Multidão:**
  - **Colisão:** a grade de corpos por célula (`world/grade-corpos.ts`) devolve só os vizinhos, na ordem do vetor.
    O resultado é idêntico ao da varredura completa, conferido por um teste de equivalência.
  - **Patrulha:** só se aproxima de quem está a até `ia.raioAproximar`, 18 células.
- **Lixo:**
  - os números de dano reaproveitam os textos, com teto de 40 vivos;
  - as texturas de equipamento ficam fora do cache global (`skipCache`);
  - as marcas por id das auras, dos efeitos de classe e dos nomes do registro deixam de crescer.
- **Aquecimento do aparelho:** rodar a 60 fps por muito tempo aquece o celular, que baixa o clock. Isso não se
  corrige no código; trabalhar menos por quadro adia o efeito, e a qualidade que sobe e desce o acompanha.

## D-123 — Renascer fora da porta (marco 26, 29/10/2026)

**Contexto.** Nas fases com volta, a porta de retorno fica no primeiro spawn, que também é onde o jogador renasce.
Quem demorava para voltar a jogar ficava parado na porta, completava a espera e voltava para a fase anterior.

**Decisão** (`progression/morte.ts`, `world/portas.ts`): a célula de renascer pula as portas de fase (a de retorno e
qualquer saída, `ehCelulaDePorta`) e fica na livre mais próxima. Vale no solo e no grupo, porque é o núcleo.

## D-124 — Assinaturas visuais: cada skill com o seu desenho (marco 26, 29/10/2026)

**Contexto.** O pedido foi direto: a Corrente não parecia corrente e o fogo parecia uma explosão de brilho. Revendo
todas as skills, o problema era geral:
- **Presets:** o `visual` das 419 skills escolhia entre 24 nomes, cada um uma rajada de carimbos brancos tingidos.
- **Brilho genérico:** metade dos nomes era o mesmo ponto brilhante em outra cor.
- **Corpos e conjuração:** todo projétil mágico era o mesmo orbe, e as 140 ultimates conjuravam as mesmas runas.
- **Corrente:** nada desenhava a Corrente; o puxão teletransportava o alvo.

O jogador não reconhecia o golpe que levou sem ler o nome.

**Decisão.**
- **Motor** (`render/particulas.ts` e `render/vfx/`):
  - um segundo atlas pintado em canvas, com gradiente e sombreado, e contêineres próprios. Traz a chama em 8
    quadros, brasa, fumaça macia, elo e gancho, osso, crânio, alma, pena, gelo translúcido, gota, rocha, lâmina,
    garra, espinho, mão de osso, onda de choque, clarão, feixe, runas, hexágono, círculo rúnico, olho, mira, onda de
    som, asa, as runas das classes e as marcas no chão;
  - partículas com flipbook, `esticar`, curvas de escala e de transparência, cores em paradas, turbulência e
    `aoMorrer` (a brasa vira fumaça);
  - **pincel de silhuetas** (`vfx/pincel.ts`): sprites grandes em modo imediato que seguem um roteiro no tempo. A
    corrente de elos com catenária, o relâmpago ramificado refeito a cada 50 ms, o feixe, a bola de fogo em
    cogumelo, a onda de choque, o que brota do chão, o que cai do céu, o que gira em volta, o círculo no chão e a
    cúpula;
  - **marcas no chão** (`vfx/marcas.ts`) abaixo das entidades, com teto de 24 e desbotando: queimado, geada,
    rachadura, sangue e veneno;
  - **deslize** (`vfx/deslizes.ts`): o evento novo `deslocado` faz o puxão, o empurrão, o arremesso, o avanço e a
    troca deslizarem o corpo em cerca de 200 ms. O puxão da Corrente espera o gancho chegar.
- **Assinaturas** (`render/vfx/familias/`, uma família por arquivo): 140 nomes numa lista fechada
  (`combat/assinaturas-visuais.ts`). Cada assinatura pode ter:
  - conjuração, corpo do projétil, rastro e impacto;
  - a silhueta do acerto, da área ou em si mesmo;
  - a marca no chão e a câmera.

  O tipo do registro exige uma entrada por nome. As 14 **variantes** são toques que se somam ao acerto e à área
  (brasas, penas, ossos, gelo…).
- **Dados:**
  - **campo novo:** `visual.assinatura` e `visual.variante`, conferidos pelo parser; toda skill ativa diz a sua;
  - **dedução:** as geradas e as criadas no editor deduzem a assinatura pelo tema do id, pelo elemento com a forma
    (fogo em cone é o lança-chamas) ou pelo tipo de ataque com a forma;
  - **ultimates:**
    - conjuram no círculo com a runa da classe (D-116), sem as runas genéricas;
    - dentro de cada classe, nenhuma repete a assinatura com a mesma variante;
    - as etapas de outro elemento mostram o elemento delas;
  - **correções de tema:**
    - a Marca sombria é sombra, não fogo;
    - a Lança tempestuosa sai na cor do raio;
    - a Investida de escudo não conjura gelo;
    - a Chuva de estrelas cai como estrelas;
    - o Ciclone flamejante, o Contragolpe em giro, o Olho do furacão e o Turbilhão de correntes giram.
- **Galeria** (`?galeria=efeitos[&visao=iso][&lento=N]`): a lista por classe, as gerais e uma gerada por elemento e
  forma. Toca no boneco, tem "tocar todas" e expõe um relógio que pausa e avança, para o e2e e para a revisão.
- **Orçamento:**
  - as silhuetas são poucas peças grandes; as partículas de enfeite seguem o teto da qualidade;
  - acima de 48 animações vivas, os enfeites mais antigos saem;
  - na qualidade mínima, nada de silhueta (a telegrafia de reserva fica).
- **D-066 revista:** a regra de "nada de forma plana" continua. As fitas e silhuetas são texturas com gradiente e
  brilho, não formas desenhadas.
- **Determinismo:** o `deslocado` só é emitido; o estado não muda e o digest continua igual.

## D-125 — O avanço sai no lançamento, e a investida passa pelas paredes (marco 26, 29/10/2026)

**Contexto.** O usuário relatou que a Investida não pulava paredes e às vezes não avançava. A D-120 já fazia o dash
atravessar paredes, mas o avanço das skills nunca chegava lá:
- **Só no acerto:** o `avanco` de quem conjura era aplicado a cada alvo atingido. Sem ninguém na linha, nada de
  avanço; com dois alvos, avançava duas vezes.
- **A linha parava na parede:** o inimigo atrás dela ficava fora da área, ninguém era atingido e o avanço não saía.

**Decisão** (regra em dados: `deslocaConjurador` no registro de efeitos):
- **No lançamento:** o `avanco` e o `teleporte` com `em: conjurador` saem uma vez, quando a habilidade é lançada,
  antes do impacto (`combat/acao.ts`). O golpe não os repete por alvo (`combat/golpe.ts`). Vale para as 20 skills e
  ultimates que deslocam quem conjura.
- **A linha de quem avança** parte da célula de onde saiu e, com `movimento.dashAtravessaParedes`, só para no fim do
  mapa ou numa muralha tática (`celulasDaForma` com `barreira`). A telegrafia desenha a mesma trajetória. As outras
  linhas (magias, flechas) continuam parando na parede.
- **Para no primeiro inimigo:** a investida é uma carga. O avanço para antes do primeiro hostil do caminho (pela
  `relacao`), e a linha ainda acerta quem estiver além. Com um alvo, vai até onde ele está agora. Sem isso, dois
  Guerreiros que investiam juntos se cruzavam, e o PvP passava da meta (mediana de 11,3 s, contra 7,3 s agora).
- **Pouso ao lado do alvo:** sem célula livre na reta antes do hostil ou da mira, o avanço pousa na vizinha livre mais
  perto de quem avança, dentro do alcance. A muralha tática na reta impede.
- **Determinismo:** a ordem muda (avança, depois acerta), mas continua só a partir de comandos.


## D-126 — Armas de classe (marco 27, 29/10/2026)

**Contexto.** A arma quase não mudava o jogo na forma base:
- as cinco lâminas davam o mesmo golpe;
- fora da família, a arma só cortava 15% do dano (D-093);
- a mão secundária só aceitava escudo, tomo e aljava.

O usuário pediu que cada classe tivesse as suas armas, cada uma com um básico próprio que fica mais bonito a cada
raridade. Também pediu que a arma natural alimentasse a passiva da classe.

**Decisão** (`data/armas.json` v3, `progression/armas.ts`, `combat/basico.ts`):
- **Famílias e classes:**
  - lâmina para o Guerreiro, arco para o Arqueiro, tomo para o Mago (o tomo deixa de ser foco de mão secundária),
    cajado para o Necromante e arremessável para o Aventureiro;
  - o escudo e a aljava continuam focos de mão secundária.
- **8 armas por classe, 40 ao todo:**
  - cada arma tem uma variação fixa do básico, uma mecânica de verdade (trajetória, forma, gatilho);
  - a raridade só aumenta a força, os ganchos e o visual;
  - os ids antigos (`espada`, `machado`, `clava`, `lanca`, `adaga`, `arco`, `tomo`, `cajado`) continuam resolvendo;
  - a `adaga` vira a adaga de arremesso do Aventureiro.
- **Variações** (`hab.variacao`, lidas por funções pequenas em `combat/projeteis-variacoes.ts`, `combat/solos.ts` e
  `combat/basico.ts`):
  - **Guerreiro:** arco amplo, estocada, giro a cada 3º golpe, onda de corte, tremor, passo de investida, arrasto e
    riposta;
  - **Arqueiro:** perfurante, leque, salva, tiro parabólico, teleguiada, tabela, estilhaço e cravar;
  - **Mago:** encadear, runa, onda, orbe pulsante, feixe, imagem, órbita arcana e implosão;
  - **Necromante:** expansão, praga, meia-lua, mãos da cova, lamento, dreno, perseguição e colheita;
  - **Aventureiro:** ricochete, tabela, curva, órbita, divisor, gancho de volta, pouso no falcão e rastro cortante.
- **Básicos novos:**
  - o do Necromante é o **solo amaldiçoado**: uma área sob o alvo que fere em pulsos (`estado.solos`);
  - o do Aventureiro é o **bumerangue**, que acerta na ida e na volta. Na volta, atravessa paredes até a mão.
- **Armas de partida** (`classe.armaInicial`, equipadas ao criar o personagem): espada curta, arco simples, tomo do
  aprendiz, cajado do aprendiz e bumerangue de madeira. Têm o básico de base, sem variação e sem bônus.
- **Scaling do item:** o dano do básico usa a rolagem da arma que golpeia (`escalaRolagem`), não o perfil da classe.
- **Familiaridade:** sem a arma natural, a classe perde parte da passiva (`balance.armas.semFamiliaridade`):
  - **Guerreiro:** cura menor. A lâmina vale também na mão secundária;
  - **Arqueiro:** alcance e velocidade menores;
  - **Mago:** a parte elemental do dano rende menos;
  - **Necromante:** servos mais fracos;
  - **Aventureiro:** perde a passiva nova inteira. Ela só vale com o arremessável na mão principal.
- **Arma de outra classe** (`balance.armas.emprestimo`, por família, sem `if` de classe):
  - **lâmina:** chance de cura ao abater;
  - **arco:** atira, mas com recarga maior;
  - **tomo:** depois de uma skill elemental, chance de o próximo básico sair com esse elemento;
  - **cajado:** chance de o abatido se erguer como aliado por pouco tempo;
  - **arremessável:** mais duração nas invocações de pergaminho.
- **Mão secundária:** qualquer arma vale ali. A cada 3º básico, o golpe sai pela secundária (`basicoDaVez`):
  - com o básico, a variação e o scaling dela, sem penalidade;
  - só se o alvo estiver no alcance dela; senão, o golpe fica pendente;
  - a passiva da classe continua valendo. O tiro carregado do Arqueiro, saindo pela espada, ganha alcance e
    atravessa.
- **Aventureiro e pergaminhos:**
  - a passiva nova (`progression/passiva-aventureiro.ts`) dá desconto e sorte nos pergaminhos, mais duração das
    invocações e bônus no dano do básico;
  - as invocações de pergaminho acumulam, do mesmo tipo ou não, até `limites.invocacoesDePergaminho` (4), separado
    das invocações de classe. Isso diverge da §5.6 da especificação.
- **Visual:**
  - cada arma tem modelo próprio na mão (`render/modelos/armas-classe.ts`);
  - cada básico tem a sua assinatura (`arma_*`, `render/vfx/familias/armas.ts`), com camadas por raridade: a
    silhueta limpa, rastro e brilho, partículas e marca no chão, aura e clarão;
  - golpes novos: arremesso e leitura;
  - a galeria (`?galeria=efeitos`) ganha o grupo Armas, com as 4 formas.
- **Saves:** versão 27. A migração 26 → 27 dá a arma de partida a quem estava de mãos vazias e refaz os básicos.
- **Ritmo:** o simulador conta golpe por ação, não por impacto. O bumerangue que acerta na ida e na volta e os pulsos
  do solo são um golpe só. `npm run balancear` em 94/94.
- **Determinismo:** o estado das variações (`Projetil.var`, `estado.solos`, `Entidade.armas`) só tem dados
  primitivos, é clonado e muda só a partir de comandos.

## D-127 — Nível 100, atributo de classe e itens com % de dano (marco 28, 30/10/2026)

**Contexto.** O usuário pediu quatro coisas:
- poder invocar várias criaturas iguais: três lobos de pergaminho pareciam um só, porque nasciam e andavam na mesma
  célula;
- nível e atributos até 100, com um atributo que não passe de nível + 20 pelos pontos gastos;
- um atributo de classe que fortaleça a passiva e as skills de classe;
- itens que acompanhem o nível alto sem precisar de itens novos.

Na revisão do plano, o usuário também pediu:
- marcos criativos e de força parecida entre as classes (os primeiros do Arqueiro foram trocados);
- mais pontos por nível depois do 30, para o atributo de classe caber sem largar os outros;
- os cartões das skills dizendo com o que elas escalam.

**Decisão:**
- **Invocações iguais** (`combat/efeitos-fluxo.ts`, `entities/ia-invocacao.ts`):
  - a invocação nasce na vizinha livre que nenhuma outra reserva;
  - seguindo o dono, cada uma ocupa o seu lugar num anel em volta dele (pela ordem do id entre as irmãs);
  - no combate, cada uma ataca de uma célula vizinha diferente do alvo, e a que fica empilhada dá um passo para o
    lado;
  - o pergaminho que não consegue invocar nada não é gasto e mostra o motivo (`sem_espaco`).
- **Nível 100** (`progression/nivel.ts`, `balance.xp`):
  - `nivelMax` 100;
  - até o 30, a curva é a de antes; depois, cada nível custa `× (1 + (nível − 30) × curvaLonga.crescimentoPct%)`;
  - com 4%, o simulador mede cerca de 10× o tempo de combate do 1 ao 30 (515 min contra 5.142 min);
  - os pontos por nível crescem por faixa (`xp.pontosPorFaixa`): 3 até o 30, 4 até o 50, 5 até o 70 e 6 até o 100,
    447 no total;
  - as curvas de classe (aura, falcão, extra do Guerreiro) chegam ao máximo no `nivelPlenoDasClasses` (30), como
    antes. Depois do 30, quem cresce é o atributo de classe.
- **Teto nível + 20** (`tetoDoAtributo`):
  - o ponto gasto para em `min(100, nível + 20)` e é recusado com `atributo_acima_do_nivel`. A ficha trava o "+" e
    diz o teto;
  - os itens levam o valor além, até 100;
  - a mesma regra vale na conferência do personagem da campanha em grupo;
  - a ficha da arena (`livre.json`) sobe o total de 72 para 82, pelo sétimo atributo.
- **Rendimento acima de 30** (`pontosUteis`, `atributos.rendimentoAcima`):
  - o ponto acima de 30 rende 50% na rolagem, no bônus fixo, na vida, na mana, na regeneração, no raio de revelar e
    no poder dos servos;
  - vale só para jogadores. Os inimigos crescem pelo nível útil, com o mesmo rendimento acima do 30;
  - a velocidade tem teto (`movimento.velocidadeMaxMult` 2,5);
  - até 30 tudo fica idêntico, então as metas antigas seguem em 94/94.
- **Atributo de classe** (`progression/dominio.ts`, `balance.dominio`):
  - o atributo `dominio` leva o nome da classe: Bravura, Instinto, Arcano, Ritual, Engenho;
  - cada ponto acima de 10 (pelo rendimento) dá +1,5% nas skills de classe e nas ultimates da própria classe;
  - também reforça a passiva por chave (`porPonto`): fúria e aura, carga e alcance da Mira, encarnação e parte
    elemental, servos e retorno do servo, falcão e pergaminhos;
  - sem a arma natural, rende 50% e os marcos ficam travados;
  - os inimigos ficam neutros (10).
- **Marcos em 25, 50, 75 e 100** (`balance.dominio.classes.<classe>.marcos`, lidos por chave, sem `if` de classe):

  | Classe | 25 | 50 | 75 | 100 |
  |---|---|---|---|---|
  | Guerreiro | aura visível | raio +1 | aura elemental (estado da arma) | raio +2 e Estandarte (cura os aliados) |
  | Necromante | servo da passiva 30% mais rápido | até 2 servos | até 3 servos | Legião: o servo que cai abre um solo amaldiçoado |
  | Arqueiro | Caçada em cadeia | Flecha-âncora (torre que atira 4 s) | Disparo explosivo | Tempestade de aço |
  | Mago | Rastro elemental | Ressonância | 1 orbe | Arquimago: 2 orbes e a dupla dura o dobro |
  | Aventureiro | +1 pergaminho | Matilha (+10% por igual viva) | Faro do falcão (8%) | +2 pergaminhos e chance de 25% da versão primordial |

  O visual dos marcos é feito de partículas (`render/efeitos-dominio.ts`): a borda da aura, os orbes que giram e a
  explosão, a chuva, a fumaça da Legião e as estrelas do Faro, a partir do evento `marcoDeClasse`.
- **Itens: valor base + % de dano** (`multiplicadoresDoItem` em `progression/derivados.ts`):
  - os pontos e a defesa dos itens gerados param de crescer no nível 30 (`itensGerados.nivelPontosMax`);
  - todo equipamento ganha um % de dano: `danoPorNivelPct` (0,4) × nível × multiplicador da raridade × peso do slot
    (arma 100%, secundária 50%, anel e amuleto 40%, o resto 25%);
  - as peças de armadura ganham também um % de defesa (`defesaPorNivelPct` 0,3);
  - o % é derivado na hora, então itens e saves antigos ganham o multiplicador sem item novo;
  - o % de dano entra no `multDano` da fonte e vale para básico, skill e ultimate. A mochila e a loja mostram
    "+X% de dano" e "+Y% de defesa";
  - o `dominio` entra em cinco armas de classe (mangual, arco de caça, estelar, vazio, shuriken) e como terceiro par
    do amuleto. Um amuleto gerado antes pode trocar de par, porque o sorteio passa a ter três opções.
- **"Escala com"** (`progression/escala-habilidade.ts`, `linhasDeEscala` em `ui/descrever.ts`):
  - o cartão da skill mostra os atributos da rolagem com o peso, o do bônus fixo e o atributo de classe, quando é
    skill de classe;
  - também mostra o efeito atual: o % pela rolagem, pelo atributo de classe e pelos itens;
  - a fonte é a mesma do combate, sem texto escrito à mão por skill.
- **Saves:** versão 28. A migração 27 → 28 dá `dominio: 10` aos atributos e à base de toda entidade.
- **Simulação:**
  - acima do 30, o jogador típico põe um terço dos pontos novos no atributo de classe;
  - `npm run balancear` em 125/125: as 94 de antes, mais vitórias e tempo nos níveis 50, 75 e 100 e o ritmo do 30 ao
    100 (`metas.nivelAlto`).

## D-128 — Mundo: fundação e o Reino Central (marco 29, 30/10/2026)

**Contexto.** O usuário pediu um modo MMO de mundo aberto, separado da campanha:
- as fases de hoje viram os interiores (as dungeons);
- fora delas, um mundo isométrico igual para todos, em reinos com vilas, regiões de perigos diferentes, estruturas
  com exterior, portais regulados e chefes especiais nos covis.

As escolhas dele:
- dungeons mistas: as masmorras com objetivo são instanciadas, os covis são compartilhados;
- PvP só nas regiões perigosas;
- a morte fora de dungeon perde a mochila e o equipado;
- dois marcos: o 29 (a fundação e o Reino Central jogável) e o 30 (o social, a economia e o polimento).

O plano aprovado está no histórico da conversa; aqui fica o que o marco 29 entrega e o que muda em relação a ele.

**Decisão:**
- **Lugares e salas** (`src/mundo/`, `server/salas/sala-mundo.ts`):
  - cada lugar é uma sala Colyseus: uma região (`regiao:id`), uma masmorra (`masmorra:id`, instanciada por entrada) ou
    um covil (`covil:id`, compartilhado);
  - o `joinOrCreate` filtra por `lugar` e `instancia`. A região cheia (40, `maxJogadores` do modo) abre o canal 2, 3…;
  - `SalaMundo` estende `SalaArena`, como a `SalaCampanha`. As regras ficam no núcleo; o servidor só atende as
    pendências (gravar a ficha, trocar de sala).
- **Área de interesse** (`arena/interesse.ts`, `modo.areaDeInteresse`):
  - cada sessão recebe o seu recorte (raio 24, Chebyshev) e o seu patch. A própria entidade sempre vai;
  - o trabalho comum de uma transmissão é feito uma vez (`CacheDeCampos`): os campos serializados de cada entidade e
    a diferença pelo mapa anterior, que as sessões que viram a mesma versão dividem;
  - sem a regra no modo, a sala manda um patch só, como antes.
- **IA com ativação** (`modo.iaRaioAtivacao` 32): só pensa o inimigo a até 32 células de algum jogador vivo.
- **Personagem no servidor** (`server/persistencia-mundo.ts`):
  - tabela `personagens_mundo` (3 slots por conta); o RLS deixa o dono ler e só o servidor grava, pela chave de serviço
    (`SUPABASE_SERVICE_KEY`, segredo do GitHub);
  - o cliente nunca manda a ficha. O servidor a carrega ao entrar e confere com `conferirPersonagem`;
  - grava ao salvar na pedra, a cada 60 s (`mundo.checkpointS`), ao sair e em cada troca de sala;
  - sem a chave, o servidor guarda em memória (log `mundo_sem_nuvem`) e aceita só as contas `local:` dos testes;
  - os personagens do Mundo não se cruzam com os slots nem com o certificado da campanha.
- **Entrada e troca de sala:**
  - a primeira entrada é sempre na vila salva (`fora_da_vila_salva` fora dela);
  - a troca (borda da região, porta de estrutura, portal, saída da dungeon, morte) leva a ficha num bilhete de uso
    único e 60 s; o cliente desmonta a cena e entra na sala nova sem recarregar a página;
  - um personagem fica em uma sala por vez (`ja_jogando`). A página recarregada não espera os 30 s da reserva de
    reconexão: a entrada nova assume o personagem da sessão caída, com a ficha atual dela.
- **Exterior** (`world/gerador-exterior.ts`):
  - região de 128×128 gerada pela semente (o servidor e o cliente geram igual): ruído em grade grossa para a água e
    as rochas por bioma, a vila murada com quatro portões e os NPCs, as fachadas, as passagens de 6 células para as
    regiões vizinhas e as estradas;
  - o rochedo fica só com a borda (o miolo, sem acesso, vira chão): no isométrico, o miolo de parede é a base escura
    das masmorras, que fora parecia um buraco;
  - células novas: `agua`, `mato`, `estrada` e `fachada`;
  - a fachada é um prisma alto de pedra com ameias e a porta em arco (`render/estruturas-iso.ts`), mais alta conforme o
    tamanho.
- **Interiores:** o gerador de fases de sempre, com o nível, o tema, os inimigos e o chefe da dungeon. A saída aberta
  devolve à porta. A masmorra dá a recompensa ao concluir, com recarga por personagem (`recargaH`).
- **Covis:** o chefe especial renasce no tempo do dado (`renascerMin`); quem deu ≥ 10% do dano
  (`mundo.covil.contribuicaoMinPct`) tem o próprio sorteio do drop exclusivo. Os três do Reino Central: o Rei Goblin
  nas Minas, a Bruxa do Pântano e o Dragão das Ruínas.
- **Perigo por região** (`reino.perigos`): `seguro` (densidade 2), `normal` (5) e `perigoso` (8, PvP). O PvP liga o
  `fogoAmigo` do modo da região (`modoDaRegiao`), sem `if` de modo; a faixa do lugar avisa na entrada.
- **Morte** (`modo.tumuloNaMorte`): fora de dungeon, a mochila e o equipado vão para um túmulo no lugar. Só o dono
  abre por 10 min (na região perigosa, qualquer um, na hora); some em 30 min. O personagem renasce na vila salva. Na
  masmorra, nada se perde.
- **Portais:** a pedra da vila leva às vilas descobertas, por ouro (20 + 30 por região de distância) e com recarga de
  60 s; o pergaminho de retorno (alquimista) vale em qualquer lugar.
- **Coleta:** veios e ervas com canal de 2,5 s, interrompido por dano; o nó renasce em 5 min.
- **Cliente:** `?jogo=mundo` (menu "Mundo"):
  - login, três slots e a criação;
  - a vista começa no isométrico;
  - a faixa do lugar, o mapa do reino com névoa (tecla M), o portal e o quadro.
- **Infraestrutura:**
  - o deploy grava `SUPABASE_URL` e `SUPABASE_SERVICE_KEY` no `.env` da VM;
  - as salas do Mundo não ocupam a cota `MAX_SALAS` das salas de arena e de grupo.

**O que fica para o marco 30** (do plano):
- as missões do quadro (hoje o quadro só explica);
- o banco, o chat, o grupo, a troca e o mercado;
- as receitas novas do ferreiro e do alquimista (hoje as lojas vendem o estoque de sempre e os materiais de coleta
  servem para vender);
- a elite e o multiplicador de loot por perigo (`elitePct`, `lootPct`), a proteção na passagem
  (`mundo.passagemProtecaoS`) e a estrutura escondida também fora do mapa (hoje ela só some do mapa do reino);
- o terreno montado por bloco sob demanda.

**Medidas** (`npm run carga -- --modo mundo --clientes 40`, servidor local, com os 40 bots na mesma máquina e todos
dentro da Vila do Centro, o pior caso da área de interesse):
- antes do cache da transmissão: tick p95 30 ms e p99 39 ms;
- depois do cache: tick p95 7 a 9 ms e p99 10 a 14 ms; banda recebida de 64 a 109 KiB/s por bot, enviada 1,5 KiB/s;
  zero rejeições, reconexão em 0,2 s, RTT p95 26 ms;
- sem os bots na mesma máquina (a sala sozinha, 40 sessões): tick médio 1,5 ms e p95 3,8 ms;
- a medida na VM fica para depois do deploy com a chave. Se o tick ou a memória não couberem, o próximo passo é a VM
  de 2 GB, decidida com o número medido.

## D-129 — Mundo: social, economia e polimento (marco 30, 30/10/2026)

**Contexto.** O segundo marco do Mundo (D-128): o social, a economia, as missões, os eventos por região e o polimento,
mais o que o marco 29 deixou para depois. O usuário pediu tudo junto, num PR só.

**Decisão:**
- **Ações do Mundo** (`src/mundo/acoes.ts`, `avisos.ts`): a mensagem `acaoMundo`, validada no núcleo, e as respostas
  como avisos do Mundo. O que cruza as salas (o grupo, o chat do grupo, a denúncia, o mercado) vai como pendência ao
  coordenador do servidor (`server/mundo-servicos.ts`), que entrega pela sala onde a pessoa está.
- **Grupo** (`grupos.ts`, até 6, convite pelo nome em 60 s): `Entidade.grupo` (`null` ao sair, porque o patch não
  leva chave apagada); o mesmo grupo nunca se fere, nem com o PvP da região (`podeFerir`); a XP de quem abate vai a
  quem está perto só se for do grupo (`partilhaXp.exigeGrupo`, dado do modo); o minimapa mostra o grupo em azul; a
  masmorra do grupo é uma instância só (`grupo:<id>:<masmorra>`).
- **Chat** (`chat.ts`): `local` (raio 20), `regiao` (a sala) e `grupo`; 160 caracteres, 5 mensagens por 10 s,
  sem caracteres de controle, HTML sempre escapado. Silenciar fica no aparelho; denunciar vira log no servidor.
- **Banco** (`banco.ts`): 40 espaços e o ouro guardado na ficha, abertos em qualquer vila; não vão para o túmulo.
- **Missões** (`missoes-mundo.ts`, 23 no reino): 6 ofertas por quadro, sorteadas pela semente do dia (vira às 0h
  UTC, 21h de Brasília); até 5 ativas. Caçar um preset numa região, entregar um material, concluir uma masmorra ou
  derrubar o chefe de um covil com a parte do dano. O progresso fica na ficha.
- **Troca direta** (`troca.ts`): a até 4 células, até 8 itens e ouro de cada lado; duas confirmações, e qualquer
  mudança desfaz as confirmações; a sala troca tudo de uma vez.
- **Mercado** (`mercado.ts`, `server/mercado-mundo.ts`): anúncios para o reino, com taxa de 2% ao anunciar e 8% na
  venda (o ouro sai da economia), 10 por personagem, 72 h. O item fica reservado no anúncio; a compra é atômica no
  servidor; o ouro vendido se recebe no mercado de qualquer vila (se o vendedor estiver offline, vai ao banco). A
  tabela `mercado_mundo` (migração `20261031120000_mercado_mundo.sql`) ou a memória, sem a chave.
- **Receitas por ofício** (`forja.ts` `oficio`): o ferreiro e o alquimista forjam só as suas (13 novas com os
  materiais do Mundo). Os materiais caem de presets (`reino.materiais`), no chão, como o loot.
- **Perigo:** elites por região (`elitePct`, `eliteNiveis`) e o loot por perigo (`lootPct`, via `modo.lootPct`).
- **A vila é refúgio** (`world/refugio.ts`, `Fase.refugios`): a IA que não é invocação não entra no círculo dos muros
  (`movimento.cabe`) nem mira quem está dentro (`alvoOfensivoValido`).
- **Proteção na passagem:** 3 s de `imune_dano` ao chegar numa sala do Mundo (`mundo.passagemProtecaoS`).
- **Estrutura escondida:** fora, é rocha comum, sem estrada até ela; a porta (`escondido`) aparece quando um jogador
  chega a até o raio de revelar.
- **Eventos por região** (`eventos-mundo.ts`): por janela de 60 min, 35% de chance de um evento de 20 min,
  determinístico pelo id da região e pela janela. A lua sangrenta (só em regiões normais e perigosas) dobra o
  `lootPct` do modo da sala; o mercador errante é uma loja perto da entrada, com o estoque `reino.mercadorErrante`. O
  começo e o fim vão a todos da sala e ao chat.
- **Checkpoint:** o coordenador só grava quando a ficha mudou desde a última gravação.
- **Polimento visual:**
  - a fachada pelo tipo da estrutura (`fase.estruturas`): castelo com ameias, torre alta de telhado pontudo, caverna e
    mina em rochedo (a mina com a boca escorada), cripta com frontão;
  - a água ondula numa camada própria por bloco (parada com movimento reduzido);
  - o terreno por bloco sob demanda nas fases com mais de 16 blocos: desenhado perto da vista, descartado além de três
    margens. As fases menores continuam inteiras (os harnesses de teste e a campanha não mudam).
- **Cliente:** painéis do quadro, do banco, do mercado, do chat, do grupo e da troca (`ui/mundo-economia.ts`,
  `mundo-social.ts`, `mundo-dialogos.ts`); um diálogo aberto bloqueia o teclado do jogo; no toque, o painel social
  começa recolhido, com o contador de mensagens novas.
- **Metas do Mundo no simulador** (`tools/balanceamento/mundo.ts`, `balance.metas.mundo`):
  - cada região com o jogador no meio da faixa (equipamento incomum) precisa vencer ≥ 75%; a XP por hora de combate
    e os minutos por nível ficam na tabela, informativos;
  - os covis, no nível do covil: o grupo de 3 em 30 a 60 s, sozinho até 90 s.
- **Calibragem pelos números:**
  - os chefes dos covis morriam em 8 a 21 s em grupo de 3 e 11 a 31 s sozinhos. A vida subiu: Rei Goblin 600 › 2200,
    Bruxa 520 › 2800, Dragão 1400 › 3600 (agora 31 a 46 s em grupo e 43 a 66 s sozinhos);
  - o reino usava invocações do Necromante (o esqueleto profano, o espectro e o cavaleiro da morte, com xp 0) como
    monstros, e o cavaleiro como chefe das Catacumbas. Saíram (Ruínas e Ninho com vampiro e troll; Catacumbas com o
    `boss`), e a conferência do reino recusa preset de invocação. A escama de dragão, que caía do cavaleiro, cai do
    vampiro (6%).

**Fica de fora:** o dia e a noite (opcional no plano).

**Ponto aberto para o usuário:** a faixa avançada da campanha (D-075: a partir do nível 20, o Normal dá 10% da XP,
porque o estudo carrega a progressão) vale também no Mundo, que roda no Normal. Por isso a XP por hora nas Ruínas do
Norte (18 a 28) cai para cerca de 1/7 da do Pântano (12 a 18). Se o Mundo deve ter ritmo próprio a partir do 20, é
uma regra de modo nova (por exemplo, a dificuldade por perigo da região), a decidir.

**Medidas:**
- `npm run balancear`: 140/140 metas (as 125 de antes e as 15 do Mundo);
- `npm run carga -- --modo mundo --clientes 40 --segundos 60`, servidor local com os bots na mesma máquina: zero
  rejeições, banda recebida de 34 KiB/s por bot (menos que no marco 29, porque os monstros não entram na vila), mas o
  tick p95 ficou entre 43 e 64 ms. A main, medida em seguida na mesma máquina, deu de 24 a 60 ms: a máquina estava
  mais carregada que no dia do marco 29 (7 a 9 ms). O perfil de CPU das duas é o mesmo (a escrita no socket, `writev`,
  é ~20 s de 95; `clonarEntidade`, a geração do patch e `simular` empatam), então o marco 30 não pesa no tick. A meta
  segue para a medida na VM, depois do deploy.

## D-130 — O visual sombrio (marco 31, 31/10/2026)

**Contexto.** O usuário pediu que o mundo e os personagens lembrassem o Diablo, e não o Minecraft ou o Roblox: sem o
chão de quadrados e sem o ar de desenho infantil. As regras seguem em células; o visual não precisa mostrá-las. O
pedido foi dividido em dois marcos: este (o mundo) e o 32 (os personagens pré-renderizados de modelos 3D CC0).

**Decisão:**
- **Arte só CC0.** As 10 texturas do chão vêm do ambientCG (lajes, rocha, blocos, terra, grama, lama, neve, areia,
  estrada e basalto), processadas por `tools/texturas/processar.ts` (512 px, 30% menos saturação, webp) e listadas
  em `LICENCAS.md`. Os arquivos brutos ficam fora do git. Nada CC-BY nem QAL.
- **Chão sem grade** (`src/render/solo/`): cada bloco do terreno é pintado num canvas (um bloco por quadro, os
  visíveis primeiro; a cor lisa de antes enquanto isso). As máscaras de cada camada têm a borda borrada e deslocada
  por ruído, em coordenadas de mundo (sem emenda entre blocos). Por cima, uma segunda passada da base maior e girada
  (esconde a repetição), a oclusão junto às paredes, uma sombra de escala grande e a tinta do tema. O tema diz a base,
  a variação, a pedra das paredes, a tinta e a escala (`temas.json`, `solo`). Fora do exterior do Mundo, o que fica
  além da borda andável continua transparente, como antes (pedido do usuário).
- **Escuridão** (`render/escuridao.ts`): no médio e no alto, um mapa de luz em meia resolução (as luzes do jogador,
  de outros jogadores, das tochas, da lava, dos objetos e dos projéteis, somadas) aplicado em `multiply`; no baixo e
  no mínimo, só uma vinheta em volta do jogador. O tema diz a cor e o nível do escuro; o exterior do Mundo é menos
  escuro (`escuridaoExterior`). As marcas, as barras, a telegrafia e os efeitos ficam acima do escuro (camadas
  `marcas` e `rotulos`), para a leitura do combate.
- **Paredes altas** (`render/paredes-iso.ts`, revê o D-106): 1,15 célula, placas de 0,3, a pedra do tema nas faces
  (a textura segue a aresta, `pedraDaFace`) e sem contorno. Os Graphics são por diagonal e por faixa de 4 células da
  tela; a faixa à frente do jogador e perto dele some de todo (alfa 0, pedido do usuário; `alfaDaFaixa`). O muro de
  uma célula com chão dos dois lados (o da vila, as casas, a parede fina entre salas) é um bloco só, não duas placas
  com um vão. As fachadas do Mundo usam a
  mesma pedra.
- **Telhados** (`Fase.telhados`, `render/telhados-iso.ts`): só visual. `perto` some quando o jogador chega a 3
  células; `dentro` só quando ele entra, e quem está fora não vê quem está dentro. O Mundo gera casas de pedra com
  telhado: até 4 na vila (`perto`) e, nas regiões normais e perigosas, as abandonadas (`perigos.*.casas`, com um
  monstro no topo da faixa lá dentro, `dentro`). As casas usam um gerador de números à parte, para não mexer no
  sorteio do resto. De cima, o telhado é chato.
- **Isométrico como padrão** (`preferencias.ts`): a preferência ganha `versaoVisual`; a gravada antes dela vira
  isométrica uma vez, e depois vale a escolha. O editor continua de cima. Os e2e escritos de cima começam com a
  preferência `cima` gravada (`playwright.config.ts`).
- **Marcas e barras** (`render/sprites.ts`): a marca de equipe vira um decalque fino e translúcido em tons sóbrios
  (dourado, cinza-azulado, vermelho escuro), a sombra fica macia e as barras ganham moldura e brilho. O vermelho do
  hostil continua sempre (mais legível que mostrar só em combate).
- **Números** no bloco `visual` de `balance.json` (luz, chão e paredes).

**Consequências.** No Chromium sem tela (WebGL por software) o quadro pesa mais com o mapa de luz e as faces
texturizadas; o monitor de qualidade cai para a vinheta quando preciso. As medidas ficam em `BENCHMARKS.md`. A
Pedravale (raio 12) é pequena demais para as casas e fica sem. Os telhados dos castelos ficaram de fora: as fachadas
já são blocos fechados.
