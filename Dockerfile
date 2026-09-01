# ==========================================
# DOKAN MANAGER V2 — PRODUCTION DOCKERFILE
# Multi-stage optimized Node.js & TypeScript build
# ==========================================

# Stage 1: Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build configs
COPY . .

# Build backend and frontend bundles
RUN npm run lint
RUN npm run build

# Stage 2: Production Stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled assets from builder
COPY --from=builder /app/dist ./dist

# Create unprivileged user for security
RUN addgroup -S dokangroup && adduser -S dokanuser -G dokangroup
USER dokanuser

EXPOSE 5000

CMD ["node", "dist/server.js"]
