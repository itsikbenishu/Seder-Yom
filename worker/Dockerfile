# Build context is the monorepo root: docker build -f worker/Dockerfile .
FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/
COPY client/package.json ./client/
COPY worker/package.json ./worker/
RUN npm ci --include-workspace-root --workspace=shared --workspace=worker

COPY shared/ ./shared/
COPY worker/ ./worker/

WORKDIR /app/worker
CMD ["npm", "start"]
