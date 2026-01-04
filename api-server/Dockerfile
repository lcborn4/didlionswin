# Dockerfile for AWS App Runner
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY api-server/package.json ./api-server/

# Install dependencies for API server
WORKDIR /app/api-server
RUN npm install --production

# Copy application code
COPY api-server/server.js ./
COPY api/ ../api/

# Expose port
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "server.js"]



