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
ENV NODE_ENV=production \
    PORT=2567
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY --from=construcao /app/dist-server ./dist-server
USER node
EXPOSE 2567
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s \
  CMD node -e "fetch('http://localhost:2567/saude').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "--enable-source-maps", "dist-server/main.mjs"]
