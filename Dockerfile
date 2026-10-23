# ================================================================
# Multi-Stage Production Dockerfile for Digital Clinic
# Base: Node.js 24 Alpine | Non-Root User: nextjs (UID 1001)
# ================================================================

# --- Stage 1: Base & Corepack ---
FROM node:24-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat curl
RUN corepack enable && corepack prepare pnpm@latest --activate

# --- Stage 2: Dependencies ---
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* .npmrc ./
RUN pnpm install --frozen-lockfile

# --- Stage 3: Builder ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build time
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN pnpm build

# --- Stage 4: Production Runner ---
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Install curl for container healthcheck
RUN apk add --no-cache curl

# Create non-root system group and user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built public assets and build outputs
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Enforce non-root ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

# Container Healthcheck hitting /api/health
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["pnpm", "start"]
