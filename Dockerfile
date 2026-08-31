# ===================================================
# Stage 1: Build the React + Vite Frontend Client
# ===================================================
FROM node:20-alpine AS client-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build

# ===================================================
# Stage 2: Build the Express + TypeScript Server
# ===================================================
FROM node:20-alpine AS server-builder
WORKDIR /app/server

COPY server/package*.json ./
RUN npm ci

COPY server/ ./
RUN npm run build

# ===================================================
# Stage 3: Lean Production Runtime for Google Cloud Run
# ===================================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Install production dependencies only
COPY server/package*.json ./server/
RUN cd server && npm ci --only=production

# Copy compiled server and compiled client SPA
COPY --from=server-builder /app/server/dist ./server/dist
COPY --from=client-builder /app/client/dist ./client/dist

# Expose standard Google Cloud Run port
EXPOSE 8080

# Run the unified full-stack server
CMD ["node", "server/dist/index.js"]
