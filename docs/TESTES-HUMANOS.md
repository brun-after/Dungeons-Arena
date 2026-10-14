# Teste com pessoas (§5.7)

**Versão:** 0.1 · **Data:** 13/10/2026

> **Histórico**
> - **0.1 (13/10/2026)**: roteiro, coleta anônima e resumo (marco 7A). A sessão ainda não foi feita.

A §5.7 pede que gente de fora jogue sem ajuda antes de o projeto crescer. Bots não substituem isso. Este guia é para
quem conduz a sessão.

## Critérios (o que precisa dar certo)

| Critério | Meta |
|---|---|
| Pessoas externas ao projeto | ≥ 5 |
| Jogando no celular | ≥ 3 |
| Concluíram o primeiro encontro (derrotaram ao menos um inimigo) | ≥ 4 |
| Reconheceram os 3 avisos de ataque **sem ajuda verbal** | ≥ 4 |
| Ciclo lutar → recompensa → melhorar → lutar | demonstrado |

O jogo mede sozinho o tempo até a primeira luta, as mortes, o uso de habilidades, os itens pegos e equipados, os
níveis e se a pessoa voltou a lutar depois de melhorar. As respostas sobre os avisos e os itens vêm de um questionário
curto no fim.

## Antes da sessão

1. Garanta que a versão publicada é a que você quer testar: o Pages e o servidor atualizam a cada merge na `main`.
2. Separe 5 ou mais pessoas que **nunca jogaram** o jogo, 3 ou mais com celular (Android ou iPhone, navegador
   atualizado). Pode ser remoto.
3. Link para enviar: **<https://brun-after.github.io/Dungeons-Arena/?pesquisa=1>**. No menu, é o "Participar do
   teste de jogabilidade".

## Durante (por pessoa, 10 a 15 minutos)

O que dizer, só isto:

> "É um jogo de ação em desenvolvimento. Jogue como quiser, por uns 10 minutos. Quando cansar, toque em **Terminar
> teste** e responda às perguntas. Não tem resposta certa: o que importa é o que você entendeu sozinho."

O que **não** fazer:
- não explicar os controles, os avisos vermelhos nem a mochila;
- não responder "como faz?". Se a pessoa travar mais de 1 minuto, anote o momento e só então dê uma dica curta;
- não olhar a tela por cima do ombro (se for presencial, sente ao lado e anote).

O que anotar à mão (opcional, ajuda a interpretar):
- onde a pessoa travou e por quanto tempo;
- se ela leu o "?" e o "!" sobre os inimigos;
- se tentou desviar das áreas vermelhas;
- comentários em voz alta.

## Depois: baixar os relatórios

Os relatórios ficam na VM, no arquivo `/dados/relatorios.jsonl` do container do servidor. São anônimos: sem nome, sem
IP e sem identificador do aparelho (D-044).

**Opção 1, pelo console do Lightsail.** Abra a instância → **Connect using SSH** e rode:

```bash
cd /opt/dungeons-arena && docker compose exec -T servidor cat /dados/relatorios.jsonl
```

Copie a saída para um arquivo `relatorios.jsonl` no seu PC.

**Opção 2, do seu PC** (Git Bash ou PowerShell 7), com a chave SSH de deploy:

```bash
ssh -i ~/.ssh/dungeons_arena ubuntu@56.126.58.40 "cd /opt/dungeons-arena && docker compose exec -T servidor cat /dados/relatorios.jsonl" > relatorios.jsonl
```

**Resumo**, na pasta do projeto:

```bash
npm run relatorios -- relatorios.jsonl
```

Ele imprime uma tabela por pessoa, os critérios acima marcados ✓/✗ e os comentários. Cole o resultado na seção
"Resultados" abaixo, ou me passe o arquivo e eu faço a análise e os ajustes (marco 7C).

Para recomeçar do zero numa nova rodada, apague o arquivo na VM:

```bash
cd /opt/dungeons-arena && docker compose exec -T servidor rm /dados/relatorios.jsonl
```

## Resultados

*Ainda não houve sessão.*

| Rodada | Data | Pessoas (toque) | 1º encontro | 3 avisos | Observações |
|---|---|---|---|---|---|
| — | — | — | — | — | — |
