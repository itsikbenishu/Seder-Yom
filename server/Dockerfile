# Build context is the monorepo root: docker build -f server/Dockerfile .
FROM node:22-alpine
WORKDIR /app

# Manifests first so `npm ci` is cached until a dependency actually changes.
# All four workspace manifests are needed for npm to validate the lockfile.
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/
COPY client/package.json ./client/
COPY worker/package.json ./worker/
RUN npm ci --include-workspace-root --workspace=shared --workspace=worker --workspace=server

COPY shared/ ./shared/
COPY worker/ ./worker/
COPY server/ ./server/

WORKDIR /app/server
EXPOSE 3000
# `npm start` -> tsx src/index.ts (the repo has no separate build step)
CMD ["npm", "start"]
