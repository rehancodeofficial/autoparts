# Multi-stage production-ready Dockerfile for AutoPart Full-Stack application

# Stage 1: Build Frontend and Server
FROM node:20-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@12.11.2 --activate

# Copy manifest files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile || pnpm install

# Copy application sources
COPY . .

# Approve builds & run build
RUN pnpm approve-builds --all || true
RUN npx vite build

# Stage 2: Runtime
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Install postgresql-client for pg_isready health checks
RUN apk add --no-cache postgresql-client

# Run as non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 autopart

# Copy package and node_modules from builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/dist ./dist

# Create entrypoint script for migrations and graceful startup
COPY <<'EOF' /app/docker-entrypoint.sh
#!/bin/sh
set -e

echo "Waiting for PostgreSQL ($DB_HOST:$DB_PORT) to be healthy..."
while ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$POSTGRES_USER"; do
  sleep 1
done

echo "PostgreSQL is ready! Running database migrations..."
npx tsx packages/db/src/server.ts &
SERVER_PID=$!

wait $SERVER_PID
EOF

RUN chmod +x /app/docker-entrypoint.sh
USER autopart

EXPOSE 4000

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/health || exit 1

ENTRYPOINT ["/app/docker-entrypoint.sh"]
