# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm ci

# Copy source code
COPY tsconfig.json ./
COPY src ./src
COPY dataset.json ./

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built files and data
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dataset.json ./

# Expose port
EXPOSE 3001

# Run the application
CMD ["node", "dist/index.js"]
