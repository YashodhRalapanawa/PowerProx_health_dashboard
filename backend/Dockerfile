FROM node:20-alpine

WORKDIR /app

# Copy dependency definitions first for optimal layer caching
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy application source code with non-root ownership
COPY --chown=node:node . .

# Run as non-root user
USER node

# Expose backend application port
EXPOSE 5000

# Start production server
CMD ["node", "server.js"]
