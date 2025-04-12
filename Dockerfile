# Use alpine as builder
FROM node:20-alpine as builder

WORKDIR /app

# Copy package files first for better caching
COPY . .

# Install dependencies including the specific Rollup binary for Alpine
RUN npm install --omit=optional && \
    npm install @rollup/rollup-linux-x64-musl

RUN npm run build

# Set up the runner
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client ./client
COPY --from=builder /app/package*.json ./

# Install dependencies for production including the specific Rollup binary for Alpine
RUN npm install --omit=dev && \
    npm install @rollup/rollup-linux-x64-musl

# Expose port for the application
EXPOSE 3000

# Start the application in development mode
CMD npm start
