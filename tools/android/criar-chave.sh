#!/usr/bin/env bash
# Chave fixa de assinatura do app Android (marco 21, 23/10/2026, D-088). Rode UMA vez, no seu PC, no Git Bash:
#
#   bash tools/android/criar-chave.sh
#
# Cria um certificado de 30 anos (PKCS12, só com openssl, sem Java), guarda o arquivo FORA do repositório e manda a
# chave e a senha para os secrets do GitHub (ANDROID_CHAVE_B64 e ANDROID_CHAVE_SENHA) pelo `gh`. A senha é digitada
# aqui e vai direto para o GitHub; não fica em arquivo nem no histórico. Guarde o arquivo e a senha num lugar seguro:
# sem eles, o app instalado não aceita mais atualizações (seria preciso desinstalar e perder os saves locais).
set -euo pipefail

destino="${HOME}/dungeons-arena-chave.p12"
if [ -e "$destino" ]; then
  echo "Já existe $destino. Para não trocar a chave por engano, apague-o à mão antes de criar outra." >&2
  exit 1
fi
command -v openssl >/dev/null || { echo "Falta o openssl (vem com o Git para Windows)." >&2; exit 1; }
command -v gh >/dev/null || { echo "Falta o GitHub CLI (gh)." >&2; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "Entre no GitHub antes: gh auth login" >&2; exit 1; }

read -r -s -p "Senha da chave (mínimo 8 caracteres): " senha; echo
read -r -s -p "Repita a senha: " confirmacao; echo
[ "$senha" = "$confirmacao" ] || { echo "As senhas não conferem." >&2; exit 1; }
[ "${#senha}" -ge 8 ] || { echo "Use pelo menos 8 caracteres." >&2; exit 1; }

temp="$(mktemp -d)"
trap 'rm -rf "$temp"' EXIT
openssl req -x509 -newkey rsa:4096 -sha256 -days 10950 -nodes \
  -keyout "$temp/chave.pem" -out "$temp/cert.pem" -subj "/CN=Dungeons Arena/O=brun-after" 2>/dev/null
# A senha vai por variável de ambiente (não aparece na lista de processos).
SENHA_CHAVE="$senha" openssl pkcs12 -export -inkey "$temp/chave.pem" -in "$temp/cert.pem" \
  -name dungeons-arena -out "$destino" -passout env:SENHA_CHAVE

base64 -w0 "$destino" | gh secret set ANDROID_CHAVE_B64
printf '%s' "$senha" | gh secret set ANDROID_CHAVE_SENHA
unset senha confirmacao

echo
echo "Pronto. A chave está em: $destino"
echo "Faça uma cópia dela (e anote a senha) fora deste PC. Os secrets ANDROID_CHAVE_B64 e ANDROID_CHAVE_SENHA já estão no GitHub."
