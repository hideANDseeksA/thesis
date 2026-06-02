# # =========================
# # 1️⃣ Build stage
# # =========================
# FROM node:20-bookworm-slim AS builder

# WORKDIR /app

# # Install OS deps needed for Prisma + ONNX
# RUN apt-get update && apt-get install -y \
#     openssl \
#     ca-certificates \
#     && rm -rf /var/lib/apt/lists/*

# # Copy package files first (better caching)
# COPY package*.json ./

# # Install dependencies
# RUN npm install

# # Copy Prisma schema
# COPY prisma ./prisma

# # Generate Prisma Client
# RUN npx prisma generate

# # Copy source code
# COPY tsconfig.json ./
# COPY src ./src

# # Build TypeScript
# RUN npm run build


# # =========================
# # 2️⃣ Production stage
# # =========================
# FROM node:20-bookworm-slim

# WORKDIR /app

# # Install runtime OS deps (required)
# RUN apt-get update && apt-get install -y \
#     openssl \
#     ca-certificates \
#     && rm -rf /var/lib/apt/lists/*

# # Copy only what we need from builder
# COPY --from=builder /app/node_modules ./node_modules
# COPY --from=builder /app/package*.json ./
# COPY --from=builder /app/prisma ./prisma
# COPY --from=builder /app/dist ./dist

# # Environment
# ENV NODE_ENV=production

# # Expose API port
# EXPOSE 3000

# # Start server
# CMD ["node", "dist/server.js"]


# =========================
# 1️⃣ Build stage
# =========================
FROM node:20-bookworm-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src

RUN npm run build





# =========================
# 2️⃣ Production stage
# =========================
FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist


ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/server.js"]