# O Mundo: guia do modo

**Versão:** 0.1 · **Data:** 30/10/2026

> **Histórico**
> - **0.1 (30/10/2026)**: marco 29 (D-128): a fundação e o Reino Central.

O Mundo é o modo de mundo aberto: um reino igual para todos, com vilas, regiões de perigos diferentes e dungeons.
O personagem é separado da campanha e fica guardado no servidor. As decisões e as medidas estão em D-128
([DECISOES.md](DECISOES.md)); aqui fica como jogar, como rodar e onde mexer.

## Para jogar

- Menu **Mundo** (ou `?jogo=mundo`). É preciso entrar com a conta Google. Cada conta tem 3 personagens, e todo
  personagem novo começa no nível 1, na Vila do Centro.
- **Vilas:** a pedra de save (salva a vila: ao sair ou morrer, você volta para ela), a pedra de portal, o mercador, o
  ferreiro, o alquimista e o quadro de missões.
- **Regiões:**
  - **seguras**: as das vilas, com poucos monstros fora dos muros;
  - **normais**: com monstros da faixa da região;
  - **perigosas**: mais monstros e **PvP ligado**. A faixa no topo avisa ao entrar.
- **Passagens:** a borda de uma região leva à vizinha. A primeira visita a um lugar fica no mapa do reino (tecla
  **M**); o resto fica na névoa.
- **Estruturas:** de fora, um bloco alto de pedra com uma porta. A porta leva ao interior:
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
  - `sala-mundo.ts` tem as regras da sala: entrada, save, portal, borda, portas, covil, morte e checkpoint;
  - `objetos-mundo.ts` cuida dos NPCs, da coleta e do túmulo;
  - `ficha-mundo.ts` é a ficha guardada.
- **Gerador:** `src/world/gerador-exterior.ts`.
- **Rede:** `src/arena/interesse.ts` (o recorte por sessão) e `src/arena/patches.ts` (`CacheDeCampos`).
- **Servidor:**
  - `server/salas/sala-mundo.ts`: a sala Colyseus, o coordenador, os bilhetes e quem está online;
  - `server/persistencia-mundo.ts`: o Supabase ou a memória.
- **Cliente:**
  - `src/mundo-tela.ts`: a lista, a criação e a troca de sala;
  - `src/ui/mundo-paineis.ts`: o portal, o quadro, a faixa e o mapa;
  - `src/render/terreno-exterior.ts`, `estruturas-iso.ts` e `objetos-mundo.ts`;
  - textos em `src/i18n/pt-BR-mundo.ts`.

## Próximo marco (30)

- as missões do quadro;
- o banco, o chat, o grupo, a troca e o mercado;
- as receitas do ferreiro e do alquimista;
- a elite e o loot por perigo;
- o polimento visual.
