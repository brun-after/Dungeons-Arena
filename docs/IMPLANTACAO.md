# Implantação do servidor da arena (Oracle Cloud Always Free)

**Versão:** 0.1 · **Data:** 13/10/2026

> **Histórico**
> - **0.1 (13/10/2026)**: guia inicial da Etapa 4 (VM, DuckDNS, segredos) e do primeiro deploy.

Este guia leva o servidor da arena para a nuvem **sem custo**: uma VM ARM no plano *Always Free* da Oracle, um
endereço grátis no DuckDNS e certificado HTTPS automático (Caddy + Let's Encrypt). Depois de pronto, cada merge na
`main` atualiza o servidor sozinho.

Tempo estimado: 1 a 2 horas, a maior parte esperando telas da Oracle.

> **Segurança.** Senhas, chaves e tokens você digita **só** nos sites oficiais (Oracle, DuckDNS, GitHub). Nunca os
> cole no chat nem em arquivos do repositório.

---

## Passo 1 — Conta Oracle Cloud

1. Acesse <https://www.oracle.com/cloud/free/> e clique em **Start for free**.
2. **Home region**: escolha **Brazil East (São Paulo)**. Ela **não pode ser trocada depois** e é onde ficam os recursos grátis.
3. O cartão é só para verificação: a Oracle faz uma retenção temporária de cerca de US$ 1 e devolve. Não aceite
   nenhum "upgrade" para conta paga.
4. Depois de entrar, crie o **alerta de orçamento**: menu ☰ → **Billing & Cost Management** → **Budgets** →
   **Create Budget**. Use valor **1** (USD) e alerta em **1%**, com o seu e-mail. Assim, se algo sair do grátis, você
   fica sabendo na hora.

## Passo 2 — Chave SSH no seu Windows

No PowerShell (fora do jogo, numa janela comum):

```bash
ssh-keygen -t ed25519 -f "$HOME\.ssh\dungeons_arena" -C "deploy-dungeons-arena"
```

Aperte Enter nas perguntas de senha (deixe vazia: o GitHub Actions vai usar essa chave).
Isso cria dois arquivos em `C:\Users\<você>\.ssh\`:
- `dungeons_arena.pub` → **pública**, vai para a Oracle;
- `dungeons_arena` → **privada**, vai só para o segredo do GitHub (Passo 6). Não compartilhe.

## Passo 3 — Criar a VM

Menu ☰ → **Compute** → **Instances** → **Create instance**:

| Campo | Valor |
|---|---|
| Name | `dungeons-arena` |
| Image | **Canonical Ubuntu 24.04** |
| Shape | **Ampere** → `VM.Standard.A1.Flex` com **2 OCPU** e **12 GB** de memória |
| Networking | deixe criar a VCN padrão, com **Assign a public IPv4 address** marcado |
| Add SSH keys | **Paste public keys** → cole o conteúdo de `dungeons_arena.pub` |
| Boot volume | padrão (até 200 GB é grátis) |

Clique em **Create**. Quando ficar **Running**, anote o **Public IP address**.

> **"Out of capacity"?** É comum na região. Tente de novo em outro horário (cedo de manhã costuma funcionar) ou
> com 1 OCPU / 6 GB. Se não der de jeito nenhum, me avise: o plano B grátis é o Render (o servidor dorme sem uso).

## Passo 4 — Abrir as portas 80 e 443

1. Na página da instância, clique na **Subnet** → na **Security List** padrão → **Add Ingress Rules**.
2. Adicione duas regras com **Source CIDR** `0.0.0.0/0`, **IP Protocol** TCP e **Destination Port** `80` e `443`.

(O firewall de dentro da VM é aberto pelo script do Passo 5.)

## Passo 5 — Endereço grátis (DuckDNS) e preparação da VM

1. Acesse <https://www.duckdns.org>, entre com GitHub ou Google, crie um subdomínio (ex.: `dungeons-bruno`) e, em
   **current ip**, coloque o IP público da VM. Clique em **update ip**.
   O endereço fica `dungeons-bruno.duckdns.org`.
2. Entre na VM pelo PowerShell:

   ```bash
   ssh -i "$HOME\.ssh\dungeons_arena" ubuntu@IP_DA_VM
   ```

3. Dentro da VM, rode o script de preparação do repositório (instala Docker, abre as portas, cria a pasta do servidor):

   ```bash
   curl -fsSL https://raw.githubusercontent.com/brun-after/Dungeons-Arena/main/tools/deploy/preparar-vm.sh | sudo bash
   ```

   No fim ele mostra **OK**. Pode sair com `exit`.

## Passo 6 — Segredos e variável no GitHub

No repositório: **Settings** → **Secrets and variables** → **Actions**.

**Secrets** (aba *Secrets*, botão *New repository secret*):

| Nome | Valor |
|---|---|
| `VM_HOST` | o IP público da VM |
| `VM_USER` | `ubuntu` |
| `VM_SSH_KEY` | o conteúdo **inteiro** do arquivo `dungeons_arena` (a chave **privada**) |
| `DOMINIO` | o seu subdomínio, ex.: `dungeons-bruno.duckdns.org` |

**Variables** (aba *Variables*, botão *New repository variable*):

| Nome | Valor |
|---|---|
| `ARENA_URL` | `wss://dungeons-bruno.duckdns.org` (com o seu subdomínio) |

## Passo 7 — Primeiro deploy

Aba **Actions** → workflow **Implantar servidor** → **Run workflow**. Ele:
1. gera a imagem ARM do servidor e publica no GitHub Container Registry;
2. entra na VM por SSH e sobe `servidor`, `redis` e `caddy` com Docker Compose;
3. confere `https://SEU-DOMINIO/saude`.

Quando ficar verde, abra `https://SEU-DOMINIO/saude` no navegador: deve aparecer `{"ok":true,...}`.
Depois, rode o workflow **Publicar no GitHub Pages** (ou faça qualquer merge) para o jogo apontar para o servidor.

## Como testar a arena online

1. No celular, abra o jogo pelo Pages e escolha **Arena online** → **Criar sala**. Aparece um código de 6 letras.
2. Em outro celular, **em outra rede** (um no Wi-Fi e outro no 4G), escolha **Entrar com código**.
3. Joguem juntos; depois, quem criou a sala sai: o outro continua jogando.

## Custos e limites

- VM A1 (até 4 OCPU / 24 GB no total da conta), 200 GB de disco e 10 TB/mês de tráfego: grátis no *Always Free*.
- DuckDNS, Let's Encrypt, GitHub (repositório público, Actions e Container Registry): grátis.
- O alerta de orçamento do Passo 1 avisa se algo sair do grátis.
