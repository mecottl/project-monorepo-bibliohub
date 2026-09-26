# Contexto de build: la raíz del repo (docker build -f apps/frontend/Dockerfile .)
FROM node:22-slim AS build
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/
COPY apps/mcp/package.json apps/mcp/
RUN pnpm install --frozen-lockfile --filter frontend...
COPY apps/frontend apps/frontend
# Se resuelven en tiempo de build (el frontend es estático). Por defecto la API cuelga del mismo origen (/api).
ARG NG_APP_API_BASE_URL=/api
ARG NG_APP_STRIPE_PUBLISHABLE_KEY=
ENV NG_APP_API_BASE_URL=$NG_APP_API_BASE_URL NG_APP_STRIPE_PUBLISHABLE_KEY=$NG_APP_STRIPE_PUBLISHABLE_KEY
RUN pnpm --filter frontend build

FROM nginx:1.27-alpine AS runtime
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY apps/frontend/nginx-seguridad.conf /etc/nginx/snippets/seguridad.conf
COPY --from=build /repo/apps/frontend/dist/frontend/browser /usr/share/nginx/html
EXPOSE 80
