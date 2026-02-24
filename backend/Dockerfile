# =========================
# Stage 1: Build
# =========================
FROM node:22.18.0 AS builder

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source code
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm run build

# =========================
# Stage 2: Production
# =========================
FROM node:22.18.0

WORKDIR /usr/src/app

# Copy built files and production dependencies from builder
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Copy .env if needed (optional, but often better to provide at runtime)
# COPY .env .env

# Expose port (replace with your actual port from config/env.ts)
EXPOSE 5000

# Set environment to production
ENV NODE_ENV=production

# Start the server
CMD ["node", "dist/server.js"]