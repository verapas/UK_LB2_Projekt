FROM node:20-alpine

WORKDIR /app

# Copy all files to container
COPY . .

# Expose port for the application
EXPOSE 4200

# Start the application in development mode
CMD ["npm", "run", "dev:server"]