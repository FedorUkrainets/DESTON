# syntax=docker/dockerfile:1.7
# =============================================================================
# DESTON — Production-ready Next.js 15 (App Router) Dockerfile
# Multi-stage: deps → builder → migrator → runner (Debian-slim base).
# =============================================================================

ARG NODE_VERSION=20-slim

# -----------------------------------------------------------------------------
# 1) deps — install node modules
# -----------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS deps
WORKDIR /app

RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# -----------------------------------------------------------------------------
# 2) builder — build the Next.js app and generate Prisma client
# -----------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build args — only used to silence env validation during build.
# Real values come from .env at runtime via docker-compose `environment`.
ARG DATABASE_URL=postgresql://placeholder:placeholder@placeholder:5432/placeholder
ENV DATABASE_URL=$DATABASE_URL
ENV NEXT_BUILD=1

RUN npx prisma generate
RUN npm run build

# -----------------------------------------------------------------------------
# 3) migrator — runs `prisma migrate deploy` / `db push` and exits.
#    Uses the full builder's node_modules so Prisma CLI is available offline.
#    Runs as root — fine, container is short-lived and only touches the DB.
# -----------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS migrator
WORKDIR /app

RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# Default to applying migrations if present, else syncing schema directly.
CMD ["sh", "-c", "if [ -d /app/prisma/migrations ] && [ \"$(ls -A /app/prisma/migrations 2>/dev/null)\" ]; then npx prisma migrate deploy; else npx prisma db push --accept-data-loss --skip-generate; fi"]

# -----------------------------------------------------------------------------
# 4) runner — minimal runtime image with non-root user
# -----------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Create a non-root user with a real home directory.
RUN groupadd --system --gid 1001 nodejs \
 && useradd  --system --uid 1001 --gid nodejs --create-home --home-dir /home/nextjs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
