FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY backend/src ./src

# Expose port
EXPOSE 3000

# Create uploads directory
RUN mkdir -p uploads

# Start the application
CMD ["node", "src/index.js"]
