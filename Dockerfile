# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install dependencies including sharp for image processing
RUN apk add --no-cache vips-dev

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.env.example ./.env.example

# Create data and uploads directories
RUN mkdir -p data uploads

EXPOSE 3000

ENV NODE_ENV=production
ENV DB_PATH=./data/fashion_shop.db

CMD ["node", "dist/server.js"]
