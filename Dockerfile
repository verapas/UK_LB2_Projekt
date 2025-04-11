FROM node:20-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies including the specific Rollup binary for Alpine
RUN npm install --omit=optional && \
    npm install @rollup/rollup-linux-x64-musl

# Copy the rest of the application
COPY . .

# Expose port for the application
EXPOSE 4200

# Start the application in development mode
CMD npm run start
