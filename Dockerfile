# Stage 1: Base
FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
# Pin pnpm to the packageManager field so builds don't drift to a newer release
WORKDIR /app
COPY package.json ./
RUN corepack enable && corepack install

# Stage 2: Build
FROM base AS build
WORKDIR /app

# pnpm fetch for cache optimization
COPY pnpm-lock.yaml ./
RUN pnpm fetch

# Copy source code
COPY . .

# Install dependencies offline (using fetched cache)
RUN pnpm install --frozen-lockfile --offline

# Build (includes orval generation and tsdown)
RUN pnpm run build

# Stage 3: Production dependencies
FROM base AS prod-deps
WORKDIR /app

# Fetch production dependencies only
COPY pnpm-lock.yaml ./
RUN pnpm fetch --prod

COPY package.json ./
RUN pnpm install --prod --frozen-lockfile --offline

# Stage 4: Runtime
FROM base AS runtime
WORKDIR /app

# Copy production dependencies
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/package.json ./package.json

# Copy build output
COPY --from=build /app/dist ./dist

ENV NODE_ENV=production
USER node

ENTRYPOINT ["node", "dist/server.mjs"]
