# ==========================================
# Multi-stage Dockerfile for Voltly
# ==========================================

# 1. Build Client
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# 2. Build Server
FROM node:20-alpine AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

# 3. Production Runtime
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5001

# Copy server production dependencies and compiled code
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --only=production
COPY --from=server-builder /app/server/dist ./dist
COPY --from=server-builder /app/server/src/database/seed.ts ./src/database/seed.ts

# Copy static frontend assets into client/dist
WORKDIR /app/client
COPY --from=client-builder /app/client/dist ./dist

WORKDIR /app/server

EXPOSE 5001

CMD ["node", "dist/index.js"]
