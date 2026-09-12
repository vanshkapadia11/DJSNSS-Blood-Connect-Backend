FROM node:18-alpine

WORKDIR /usr/src/app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

# Copy source
COPY . .

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 5000

CMD ["node", "src/server.js"]
