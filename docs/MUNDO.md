# O Mundo: guia do modo

**Versão:** 0.2 · **Data:** 30/10/2026

> **Histórico**
> - **0.2 (30/10/2026)**: marco 30 (D-129): o social, a economia, as missões, os eventos por região e o polimento.
> - **0.1 (30/10/2026)**: marco 29 (D-128): a fundação e o Reino Central.

O Mundo é o modo de mundo aberto: um reino igual para todos, com vilas, regiões de perigos diferentes e dungeons.
O personagem é separado da campanha e fica guardado no servidor. As decisões e as medidas estão em D-128 e
D-129 ([DECISOES.md](DECISOES.md)); aqui fica como jogar, como rodar e onde mexer.

## Para jogar

- Menu **Mundo** (ou `?jogo=mundo`). É preciso entrar com a conta Google. Cada conta tem 3 personagens, e todo
  personagem novo começa no nível 1, na Vila do Centro.
- **Vilas:** a pedra de save (salva a vila: ao sair ou morrer, você volta para ela), a pedra de portal, o mercador, o
  ferreiro, o alquimista, o banco, o mercado e o quadro de missões. Os monstros não passam dos muros nem acertam
  quem está dentro deles.
- **Quadro de missões:** cada vila oferece 6 missões do dia (viram às 21h, horário de Brasília); aceite até 5 ao mesmo
  tempo. Sempre com combate: caçar na região, trazer o material que um monstro deixa, concluir uma masmorra ou
  derrubar o chefe de um covil (com a sua parte do dano). A recompensa sai ao entregar no quadro.
- **Ferreiro e alquimista:** cada um forja as próprias receitas, com os materiais da coleta e dos monstros.
- **Banco:** um baú de 40 espaços e o ouro guardado, o mesmo em qualquer vila. Não se perde na morte.
- **Mercado:** anuncie um item com preço para todo o reino (taxa de 2% ao anunciar e de 8% na venda; vale 72 h). O
  ouro das vendas fica para receber no mercado de qualquer vila.
- **Social** (o painel do lado direito, recolhido no celular):
  - chat **local** (quem está perto), **região** (a sala) e **grupo**; silenciar fica no seu aparelho e denunciar
    vai para o servidor;
  - **grupo** de até 6, por convite pelo nome: a XP de quem abate é dividida com quem está perto, os do grupo
    aparecem em azul no minimapa, nunca se ferem (nem no PvP) e entram juntos nas masmorras;
  - **troca** com quem está a até 4 células: cada um põe itens e ouro, os dois confirmam e o servidor troca tudo de
    uma vez.
- **Eventos por região** (sorteados a cada hora, valem 20 min): a **lua sangrenta** dobra o loot das regiões normais
  e perigosas; o **mercador errante** aparece perto da entrada da região com um estoque próprio. O começo vai para o
  chat.
- **Regiões:**
  - **seguras**: as das vilas, com poucos monstros fora dos muros;
  - **normais**: com monstros da faixa da região, alguns de elite (mais fortes e com mais loot);
  - **perigosas**: mais monstros, mais elites, loot 80% maior e **PvP ligado**. A faixa no topo avisa ao entrar.
  - Ao chegar numa região, você fica 3 s sem levar dano.
- **Passagens:** a borda de uma região leva à vizinha. A primeira visita a um lugar fica no mapa do reino (tecla
  **M**); o resto fica na névoa.
- **Estruturas:** de fora, a fachada pelo tipo (castelo com ameias, torre de telhado pontudo, caverna e mina em
  rochedo, cripta com frontão) e uma porta. Algumas são escondidas: só aparecem quando você chega perto. A porta leva ao interior:
  - **masmorras**: uma instância só sua, com recompensa ao concluir e recarga por personagem; a morte lá não perde
    nada;
  - **covis**: compartilhados, com um chefe especial que renasce. Quem deu ao menos 10% do dano tem o próprio
    sorteio do drop exclusivo.
- **Morte fora de dungeon:**
  - a mochila e o equipado ficam num túmulo onde você caiu, e você renasce na vila salva;
  - por 10 minutos só você abre o túmulo; na região perigosa, qualquer um abre na hora;
  - o túmulo some em 30 minutos.
- **Portais:** a pedra leva a uma vila já visitada, por ouro (mais caro quanto mais longe) e com recarga. O
  **pergaminho de retorno** (alquimista) leva à vila salva de qualquer lugar.
- **Coleta:** veios e ervas pedem alguns segundos parado; um golpe interrompe. O nó volta depois de um tempo.
- **Sair:** a progressão (itens, XP, ouro) fica gravada; a posição volta à vila salva. Recarregar a página não trava
  o personagem: a entrada nova assume o lugar da sessão que caiu.

## O Reino Central

| | Oeste | Centro | Leste |
|---|---|---|---|
| **Norte** | Floresta Antiga (4–9) | Ruínas do Norte (18–28, **PvP**), covil Ninho do Dragão | Pico Gelado (10–15), masmorra escondida Caverna de Gelo |
| **Meio** | Campos do Oeste (2–6), masmorra Toca dos Goblins | **Vila do Centro** (1–4) | **Pedravale**, Encosta do Leste (5–9), masmorra Catacumbas |
| **Sul** | Pântano Sombrio (12–18), covil Cabana da Bruxa | Bosque do Sul (5–10), masmorra Mina Abandonada e covil Minas do Rei Goblin | Colinas do Sudeste (8–14) |

Os dados ficam em `src/data/mundo/reino-central.json`: as regiões (bioma, perigo, faixa de nível, tema, semente,
inimigos, coleta e estruturas), as vilas, as lojas, as masmorras, os covis e as regras de perigo. Os números gerais
ficam no bloco `mundo` de `balance.json`.

## Para rodar

```bash
npm run dev:server
```

```bash
npm run dev
```

- Abra `http://localhost:5173/?jogo=mundo&nuvem=falsa`: a nuvem falsa entra com a conta `local:pessoa-de-teste`.
- Sem `SUPABASE_URL` e `SUPABASE_SERVICE_KEY`, o servidor guarda os personagens em memória (reiniciar apaga) e aceita
  só as contas `local:`.
- Carga: `npm run carga -- --modo mundo --clientes 40 --segundos 300` (até 40 bots na Vila do Centro, cada um com uma
  conta `local:`; precisa do servidor sem a chave de serviço).

## Em produção

1. **GitHub** (Settings › Secrets and variables › Actions):
   - o segredo `SUPABASE_SERVICE_KEY`: a chave **service_role** do projeto (Supabase › Project Settings › API). Cole
     direto no GitHub, nunca no chat nem em arquivo;
   - a variável `SUPABASE_URL` já existe desde o marco 17.
2. **Tabela:** a migração `supabase/migrations/20261030120000_personagens_mundo.sql` sobe pela integração do
   Supabase com o GitHub, como a tabela `saves` ([IMPLANTACAO.md](IMPLANTACAO.md)).
3. **Deploy:** o próximo deploy grava as duas no `.env` da VM. O log `mundo_sem_nuvem` na partida diz que a chave não
   chegou.

## Onde mexer no código

- **Núcleo** (`src/mundo/`):
  - `reino.ts` lê e confere o reino;
  - `lugares.ts` monta o contexto de cada lugar (exterior ou interior) e o modo da região;
  - `sala-mundo.ts` tem as regras da sala: entrada, save, portal, borda, portas, covil, morte, checkpoint, estrutura
    escondida e evento da região; `sala-social.ts` atende as ações do Mundo (banco, quadro, chat, troca, mercado);
  - `acoes.ts` e `avisos.ts` são as mensagens; `banco.ts`, `missoes-mundo.ts`, `chat.ts`, `troca.ts`, `grupos.ts`,
    `mercado.ts`, `balcao.ts` e `eventos-mundo.ts` são as regras puras de cada um;
  - `objetos-mundo.ts` cuida dos NPCs, da coleta e do túmulo;
  - `ficha-mundo.ts` é a ficha guardada.
- **Gerador:** `src/world/gerador-exterior.ts`.
- **Rede:** `src/arena/interesse.ts` (o recorte por sessão) e `src/arena/patches.ts` (`CacheDeCampos`).
- **Servidor:**
  - `server/salas/sala-mundo.ts`: a sala Colyseus, o coordenador, os bilhetes e quem está online;
  - `server/persistencia-mundo.ts`: o Supabase ou a memória;
  - `server/mundo-servicos.ts`: o que cruza as salas (grupo, chat do grupo, denúncia, mercado);
    `server/mercado-mundo.ts`: os anúncios (tabela `mercado_mundo` ou memória).
- **Cliente:**
  - `src/mundo-tela.ts`: a lista, a criação e a troca de sala;
  - `src/ui/mundo-paineis.ts`: o portal, a faixa e o mapa; `mundo-economia.ts`: o quadro, o banco e o mercado;
    `mundo-social.ts`: o chat, o grupo e a troca; `mundo-dialogos.ts`: as peças dos diálogos;
  - `src/render/terreno-exterior.ts`, `estruturas-iso.ts` e `objetos-mundo.ts`;
  - textos em `src/i18n/pt-BR-mundo.ts`.

## Em produção (marco 30)

A migração `supabase/migrations/20261031120000_mercado_mundo.sql` (a tabela dos anúncios) sobe pela integração, como
a do marco 29. Sem a chave de serviço, o servidor guarda o mercado em memória, como os personagens (log
`mundo_sem_nuvem`).

## Depois

- o dia e a noite (opcional no plano, ficou fora);
- reinos novos para o 30 ao 100.
