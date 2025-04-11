# A simple typescript starter project


## Getting Started

### Development Mode ohne Docker

```bash
# Install packages
npm install

# Start docker compose for database only
docker compose up -d mariadb phpmyadmin

# Start frontend & backend in dev mode
npm run dev
```

### Mit Docker Compose

Einfach folgenden Befehl ausführen:

```bash
# Run the entire application using Docker Compose
docker compose up

# The application will be available at:
# - Web App: http://localhost:4200
# - PHPMyAdmin: http://localhost:9200
```

Default login credentials:
- Username: `user`, `moderator`, or `admin`
- Password: `123456`