# Servidor da arena (marco 5). Imagem multi-arquitetura: arm64 na VM Oracle, amd64 no seu PC.
# Estágio 1 empacota o servidor num único .mjs; estágio 2 leva só as dependências de execução.

FROM node:24-slim AS construcao
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build:server

FROM node:24-slim
WORKDIR /app
# Marco 16 (D-062): heap do Node em 512 MB, abaixo do limite de 700 MB do contêiner (docker-compose.yml).
ENV NODE_ENV=production \
    PORT=2567 \
    NODE_OPTIONS=--max-old-space-size=512
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY --from=construcao /app/dist-server ./dist-server
# Relatórios do teste com pessoas (marco 7A): o volume nomeado herda o dono desta pasta.
RUN mkdir -p /dados && chown node:node /dados
ENV DIR_DADOS=/dados
USER node
EXPOSE 2567
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s \
  CMD node -e "fetch('http://localhost:2567/saude').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "--enable-source-maps", "dist-server/main.mjs"]
