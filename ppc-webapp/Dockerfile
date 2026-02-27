FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY server/ ./server/
COPY tsconfig.server.json ./

EXPOSE 3001

CMD ["npx", "tsx", "server/index.ts"]
