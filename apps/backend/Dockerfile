# Contexto de build: la raíz del repo (docker build -f apps/backend/Dockerfile .)
FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/
COPY apps/mcp/package.json apps/mcp/
RUN pnpm install --frozen-lockfile --filter backend...
COPY apps/backend apps/backend
RUN pnpm --filter backend build
# Dependencias de producción autocontenidas (sin devDependencies).
RUN pnpm --filter backend --prod deploy --legacy /out

FROM node:22-slim AS runtime
ENV NODE_ENV=production PORT=2077
WORKDIR /app
COPY --from=build /out/node_modules ./node_modules
COPY --from=build /repo/apps/backend/package.json ./
COPY --from=build /repo/apps/backend/dist ./dist
COPY --from=build /repo/apps/backend/migrations ./migrations
COPY --from=build /repo/apps/backend/scripts ./scripts
COPY --from=build /repo/apps/backend/seed ./seed
RUN mkdir -p uploads/portadas && chown -R node:node /app
USER node
EXPOSE 2077
# Aplica migraciones pendientes (o línea base si la base viene del volcado) y arranca la API.
CMD ["sh", "-c", "node scripts/migrar.mjs iniciar && node dist/main"]
