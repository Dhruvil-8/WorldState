# ============================================================
# WorldState Go Backend — Multi-stage Docker Build
# ============================================================

# ── Build stage ───────────────────────────────────────────────
FROM golang:1.23-alpine AS builder

RUN apk add --no-cache git ca-certificates

WORKDIR /build

# Cache dependencies
COPY go.mod go.sum* ./
RUN go mod download 2>/dev/null || true

# Build the binary
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /worldstate-server ./cmd/server

# ── Runtime stage ─────────────────────────────────────────────
FROM alpine:3.20

RUN apk add --no-cache ca-certificates curl

WORKDIR /app

COPY --from=builder /worldstate-server .
COPY migrations/ ./migrations/

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

ENTRYPOINT ["./worldstate-server"]
