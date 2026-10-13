#!/usr/bin/env bash
# Prepara uma VM Ubuntu 24.04 (AWS Lightsail ou Oracle Cloud) para o servidor da arena. Idempotente: pode rodar de novo.
#   curl -fsSL https://raw.githubusercontent.com/brun-after/Dungeons-Arena/main/tools/deploy/preparar-vm.sh | sudo bash
# 13/10/2026: deixa de ser só Oracle (D-038); firewall interno só quando a imagem bloqueia; swap em VMs com pouca RAM.
set -euo pipefail

USUARIO="${SUDO_USER:-ubuntu}"
PASTA="/opt/dungeons-arena"

echo "==> Docker"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
usermod -aG docker "$USUARIO"
systemctl enable --now docker

# As imagens Ubuntu da Oracle trazem um REJECT no INPUT que bloqueia tudo além do SSH. Na AWS o firewall é o do
# console do Lightsail e o iptables da VM fica aberto: não mexe nele.
echo "==> Firewall da VM"
if iptables -S INPUT 2>/dev/null | grep -qE -- '-j (REJECT|DROP)|^-P INPUT DROP'; then
  for porta in 80 443; do
    if ! iptables -C INPUT -p tcp -m state --state NEW --dport "$porta" -j ACCEPT 2>/dev/null; then
      iptables -I INPUT 1 -p tcp -m state --state NEW --dport "$porta" -j ACCEPT
    fi
  done
  if ! command -v netfilter-persistent >/dev/null 2>&1; then
    DEBIAN_FRONTEND=noninteractive apt-get install -y iptables-persistent
  fi
  netfilter-persistent save
  echo "    portas 80 e 443 liberadas no iptables"
else
  echo "    iptables sem bloqueio; use o firewall do provedor (Lightsail: 80 e 443)"
fi

# Com 1 GB de RAM (Lightsail de US$ 7), um swap de 2 GB evita que o kernel mate o servidor num pico.
echo "==> Swap"
MEMORIA_MB=$(awk '/MemTotal/ { print int($2 / 1024) }' /proc/meminfo)
if [ "$MEMORIA_MB" -lt 2048 ] && [ -z "$(swapon --show --noheadings)" ]; then
  if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile >/dev/null
  fi
  swapon /swapfile
  grep -q '^/swapfile ' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo "    swap de 2 GB ativo"
else
  echo "    nada a fazer (${MEMORIA_MB} MB de RAM ou swap já ativo)"
fi

echo "==> Pasta do servidor"
mkdir -p "$PASTA"
chown "$USUARIO":"$USUARIO" "$PASTA"

echo "==> Atualizações automáticas de segurança"
DEBIAN_FRONTEND=noninteractive apt-get install -y unattended-upgrades >/dev/null

echo "OK — VM pronta. Próximo passo: segredos no GitHub (docs/IMPLANTACAO.md)."
