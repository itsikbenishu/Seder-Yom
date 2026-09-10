# Build context is the monorepo root: docker build -f client/Dockerfile .
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/
COPY client/package.json ./client/
COPY worker/package.json ./worker/
RUN npm ci --include-workspace-root --workspace=shared --workspace=client

COPY shared/ ./shared/
COPY client/ ./client/

# Same-origin API: the SPA calls /api/v1/* and nginx proxies it to the server.
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build --workspace=client

FROM nginx:1.27-alpine
COPY client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/client/dist /usr/share/nginx/html
EXPOSE 80
