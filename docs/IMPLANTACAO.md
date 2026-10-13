# Implantação do servidor da arena

**Versão:** 0.3 · **Data:** 13/10/2026

> **Histórico**
> - **0.3 (13/10/2026)**: IP estático `56.126.58.40` (`arena-sao-paulo-ip`) anexado; deploy tolera falha passageira de SSH.
> - **0.2 (13/10/2026)**: a implantação atual passa a ser a **AWS Lightsail em São Paulo** (D-038). A Oracle não teve
>   capacidade e fica como alternativa; o Render fica como reserva manual.
> - **0.1 (13/10/2026)**: guia inicial da Etapa 4 (VM Oracle, DuckDNS, segredos) e do primeiro deploy.

O servidor da arena roda numa VM com Docker Compose (servidor, Redis e Caddy). O endereço vem do DuckDNS e o
certificado HTTPS é automático (Caddy + Let's Encrypt). Depois de configurado, cada merge na `main` atualiza o servidor
sozinho pelo workflow **Implantar servidor**.

> **Segurança.** Senhas, chaves e tokens você digita **só** nos sites oficiais (AWS, Oracle, DuckDNS, GitHub). Nunca os
> cole no chat nem em arquivos do repositório.

---

## Implantação atual: AWS Lightsail (São Paulo)

| Item | Valor |
|---|---|
| Instância | `arena-sao-paulo`, Ubuntu 24.04, **amd64** (x86_64) |
| Plano | 2 vCPU, **1 GB** de RAM, 40 GB SSD, **US$ 7/mês** |
| Região / zona | `sa-east-1` / `sa-east-1a` |
| Endereço | `wss://dungeons-bruno.duckdns.org` (HTTPS/WSS com Let's Encrypt) |
| Pasta na VM | `/opt/dungeons-arena` |
| Portas públicas | 22 (SSH), 80 e 443. A porta 2567 do servidor fica presa a `127.0.0.1`: só o Caddy a alcança |
| IP | **estático** `56.126.58.40` (recurso `arena-sao-paulo-ip`), sem custo enquanto anexado à instância ([AWS](https://docs.aws.amazon.com/lightsail/latest/userguide/understanding-static-ip-addresses-in-amazon-lightsail.html)) |

> **Custo.** O plano é **pago** (US$ 7/mês) e hoje é coberto pelos créditos da conta AWS. **Não** é hospedagem
> gratuita permanente: quando os créditos acabarem, a cobrança vai para o cartão. Os limites gratuitos da Oracle (VM A1,
> 10 TB de tráfego etc.) **não** valem aqui.

### Validação feita em 13/10/2026

- `https://dungeons-bruno.duckdns.org/saude` responde `ok: true` e `regiao: sa-east-1`.
- Dois clientes WSS por 10 s: RTT de cerca de 20 ms, zero rejeições e zero ressincronizações.
- O criador saiu e a sala continuou ativa.
- No navegador, o lobby mostrou ping de 22 ms; o jogo funcionou.
- Os workflows **Implantar servidor** e **Publicar no GitHub Pages** concluíram com sucesso.

Os números são amostras de uma conexão; não são garantia de latência.

### Pendências

1. **Teste com dois celulares em redes diferentes** (Wi-Fi e 4G): veja "Como testar a arena online".
2. **Custos e créditos.** Os créditos ficam em **Billing and Cost Management** → **Credits**. Lá dá para conferir o saldo e
   a data de validade.
   Crie um alerta em **Budgets** → **Create budget** → **Cost budget**, com limite mensal de US$ 1 e avisos por e-mail
   em 80% e 100% do custo **real**. Inclua os créditos no cálculo se quiser ser avisado pelo gasto bruto. O alerta da
   Oracle não cobre a AWS.
3. **Script de preparação.** A VM foi preparada com comandos manuais equivalentes. O script
   [`tools/deploy/preparar-vm.sh`](../tools/deploy/preparar-vm.sh) agora serve para AWS e Oracle e é idempotente. Rodá-lo
   na VM atual é opcional: ele confere o Docker, a pasta, o swap (útil com 1 GB de RAM) e as atualizações automáticas.

### Se o IP mudar

Com o IP estático anexado, isso só acontece se ele for desanexado ou se a instância for recriada.
Um IP estático solto (sem instância) passa a ser cobrado: desanexe só para anexar a outra instância.

1. Lightsail → instância → anote o novo **Public IPv4**.
2. DuckDNS → no subdomínio `dungeons-bruno`, coloque o novo IP em **current ip** → **update ip**.
3. GitHub → **Settings** → **Secrets and variables** → **Actions** → edite `VM_HOST` com o novo IP.
4. Espere alguns minutos e abra `https://dungeons-bruno.duckdns.org/saude`. Se o certificado reclamar, rode o workflow
   **Implantar servidor** de novo (o Caddy renova sozinho quando o domínio volta a apontar para a VM).

`ARENA_URL` não muda: o jogo usa o domínio, nunca o IP.

### Como recriar do zero (outra instância Lightsail)

1. **Chave SSH de deploy** no seu Windows (PowerShell). Deixe a senha vazia, porque o GitHub Actions usa essa chave:

   ```bash
   ssh-keygen -t ed25519 -f "$HOME\.ssh\dungeons_arena" -C "deploy-dungeons-arena"
   ```

   - `dungeons_arena.pub` é a chave **pública**, que vai para a VM.
   - `dungeons_arena` é a chave **privada**, que vai só para o segredo `VM_SSH_KEY`.
   - Use uma chave exclusiva para o deploy e revogue a anterior quando trocar.
2. **Instância**: Lightsail → **Create instance**.
   - Região **São Paulo** (`sa-east-1`), plataforma **Linux/Unix**, blueprint **OS Only → Ubuntu 24.04 LTS**.
   - Use a chave do passo 1.
   - Escolha o plano e dê o nome `arena-sao-paulo`.
3. **Firewall**: na instância, abra **Networking** → **IPv4 Firewall** e adicione **HTTPS (TCP 443)**. O SSH (22) e o
   HTTP (80) já vêm abertos, e o HTTP é necessário para o Let's Encrypt.
   **Não** abra a 2567.
4. **IP estático e DuckDNS**:
   - crie e anexe um IP estático (Lightsail → **Networking** → **Create static IP**), ou reanexe o atual;
   - no <https://www.duckdns.org>, aponte o subdomínio para esse IP.
5. **Preparar a VM**: entre por SSH e rode o script.

   ```bash
   ssh -i "$HOME\.ssh\dungeons_arena" ubuntu@IP_DA_VM
   ```

   ```bash
   curl -fsSL https://raw.githubusercontent.com/brun-after/Dungeons-Arena/main/tools/deploy/preparar-vm.sh | sudo bash
   ```

6. **GitHub**: configure os segredos e a variável da seção "Segredos e variável no GitHub" abaixo.
7. **Deploy**: na aba **Actions**, abra **Implantar servidor** e clique em **Run workflow**. Depois rode **Publicar no
   GitHub Pages**.

---

## Segredos e variável no GitHub

No repositório: **Settings** → **Secrets and variables** → **Actions**.

| Tipo | Nome | Valor |
|---|---|---|
| Secret | `VM_HOST` | IP público da VM |
| Secret | `VM_USER` | `ubuntu` |
| Secret | `VM_SSH_KEY` | conteúdo **inteiro** da chave **privada** de deploy |
| Secret | `DOMINIO` | `dungeons-bruno.duckdns.org` |
| Variable | `ARENA_URL` | `wss://dungeons-bruno.duckdns.org` |

Sem `ARENA_URL`, o workflow de deploy fica desligado e o Pages publica o jogo sem arena online.

## O que o deploy faz

O workflow [`deploy-servidor.yml`](../.github/workflows/deploy-servidor.yml) roda a cada merge na `main` ou
manualmente:

1. gera a imagem do servidor para **amd64 e arm64** (QEMU + Buildx) e publica no GitHub Container Registry. Assim a
   mesma imagem serve à AWS (amd64) e à Oracle (arm64);
2. entra na VM por SSH, grava o `.env` (`IMAGEM_SERVIDOR`, `DOMINIO`, `REGIAO=sa-east-1`) e sobe `servidor`, `redis` e
   `caddy` com `docker compose --profile producao`;
3. confere `https://DOMINIO/saude`.

> Se a VM mudar de região, ajuste `REGIAO` no workflow: é o texto que o lobby mostra antes de entrar.

## Como testar a arena online

1. No celular, abra o jogo pelo Pages e escolha **Arena online** → **Criar sala**. Aparece um código de 6 letras.
2. Em outro celular, **em outra rede** (um no Wi-Fi e outro no 4G), escolha **Entrar com código**.
3. Joguem juntos; depois, quem criou a sala sai: o outro continua jogando.
4. Opcional, do seu PC: rode o comando abaixo para registrar os números em `docs/BENCHMARKS.md`.

   ```bash
   npm run carga -- --url wss://dungeons-bruno.duckdns.org --clientes 10 --segundos 60 --registrar
   ```

---

## Alternativas

### Oracle Cloud Always Free (plano original)

Em 13/10/2026 a Oracle respondeu **"Out of capacity"** em São Paulo, com 2 OCPU / 12 GB e com 1 OCPU / 6 GB, e nenhuma VM
foi criada. Se um dia houver capacidade, ela continua sendo a opção sem custo: a imagem já é publicada para arm64 e o
script de preparação trata o firewall da Oracle.

1. **Conta**: em <https://www.oracle.com/cloud/free/>, escolha a home region **Brazil East (São Paulo)**. Ela não pode ser
   trocada depois. O cartão é só para verificação; não aceite "upgrade" para conta paga.
2. **Alerta de orçamento**: **Billing & Cost Management** → **Budgets** → **Create Budget**, com valor 1 (USD) e alerta em
   1%.
3. **VM**: **Compute** → **Instances** → **Create instance**, com estas opções:
   - imagem **Canonical Ubuntu 24.04**;
   - shape `VM.Standard.A1.Flex` (**Ampere**, arm64) com 2 OCPU / 12 GB;
   - IPv4 público;
   - a chave pública de deploy.

   Se aparecer "Out of capacity", tente outro horário ou 1 OCPU / 6 GB.
4. **Portas**: **Subnet** → **Security List** → **Add Ingress Rules**, com TCP `80` e `443` e origem `0.0.0.0/0`. O
   firewall interno da imagem Oracle é aberto pelo script.
5. **DuckDNS, script, segredos e deploy**: siga os passos 4 a 7 de "Como recriar do zero". O usuário SSH também é `ubuntu`.
   Ajuste `REGIAO` no workflow para `sa-saopaulo-1`.
6. **Limites do Always Free** (valem só para a Oracle): VM A1 com até 4 OCPU / 24 GB somados na conta, 200 GB de disco e
   10 TB/mês de tráfego.

### Render (reserva manual)

Há um serviço do servidor no Render, em Virgínia (EUA). Ele continua disponível, mas **não há failover automático**.
Numa amostra de HTTPS com conexão reutilizada, a mediana foi de **176,9 ms** no Render contra **15,4 ms** na AWS em São
Paulo, e por isso ele não é o principal.

Para usá-lo numa emergência:

1. troque a variável `ARENA_URL` para o endereço `wss://` do serviço no Render;
2. rode **Publicar no GitHub Pages**.

Para voltar, restaure `wss://dungeons-bruno.duckdns.org` e publique de novo.
