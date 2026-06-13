# ============================================================
# WorldState Frontend — Next.js Multi-stage Dockerfile
# ============================================================

# ── Build stage ───────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Enable standard caching for npm install
COPY package.json package-lock.json ./
RUN npm ci

# Copy full code and build standard production output
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── Runtime stage ─────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => { if (r.statusCode === 200) process.exit(0); else process.exit(1); })" || exit 1

CMD ["npm", "run", "start"]
