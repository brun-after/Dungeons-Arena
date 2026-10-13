#!/usr/bin/env bash
# Prepara a VM Ubuntu (Oracle Always Free) para o servidor da arena. Idempotente: pode rodar de novo.
#   curl -fsSL https://raw.githubusercontent.com/brun-after/Dungeons-Arena/main/tools/deploy/preparar-vm.sh | sudo bash
set -euo pipefail

USUARIO="${SUDO_USER:-ubuntu}"
PASTA="/opt/dungeons-arena"

echo "==> Docker"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
usermod -aG docker "$USUARIO"
systemctl enable --now docker

echo "==> Firewall da VM (as imagens Ubuntu da Oracle bloqueiam tudo além do SSH)"
for porta in 80 443; do
  if ! iptables -C INPUT -p tcp -m state --state NEW --dport "$porta" -j ACCEPT 2>/dev/null; then
    iptables -I INPUT 1 -p tcp -m state --state NEW --dport "$porta" -j ACCEPT
  fi
done
if ! command -v netfilter-persistent >/dev/null 2>&1; then
  DEBIAN_FRONTEND=noninteractive apt-get install -y iptables-persistent
fi
netfilter-persistent save

echo "==> Pasta do servidor"
mkdir -p "$PASTA"
chown "$USUARIO":"$USUARIO" "$PASTA"

echo "==> Atualizações automáticas de segurança"
DEBIAN_FRONTEND=noninteractive apt-get install -y unattended-upgrades >/dev/null

echo "OK — VM pronta. Próximo passo: segredos no GitHub (docs/IMPLANTACAO.md, passo 6)."
