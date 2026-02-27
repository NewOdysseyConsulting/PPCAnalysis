# Stage 1: Build the React client
FROM node:22-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY client/ ./client/
COPY index.html vite.config.js tsconfig.json ./
RUN npx vite build

# Stage 2: Production server
FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server/ ./server/
COPY tsconfig.server.json ./

# Copy the built React app from stage 1
COPY --from=build /app/dist ./dist

EXPOSE 3001

CMD ["node", "--import", "tsx", "server/index.ts"]
