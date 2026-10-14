# Decisões de projeto

**Versão:** 0.10 · **Data:** 13/10/2026

> **Histórico**
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
