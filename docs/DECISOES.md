# Decisões de projeto

**Versão:** 0.2 · **Data:** 13/10/2026

> **Histórico**
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

## D-016 · Cor dos marcadores por equipe, provisória (v0.2, 13/10/2026)

**Decisão.** Até existir `relacao()` (marco 3/4), os marcadores das entidades usam azul para o próprio jogador,
verde para a mesma equipe e vermelho para as demais. Só a cor depende disso: nenhuma regra de jogo decide
hostilidade pela equipe fora de `relacao()`.
