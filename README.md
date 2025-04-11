# A Simple TypeScript Starter Project

Dieses Projekt dient als Starter für TypeScript-Anwendungen und enthält eine einfache Konfiguration für die Entwicklung sowohl ohne Docker als auch mit Docker Compose.

## Getting Started

### Development Mode (Webserver und backend nicht Containerisiert)

Folge diesen Schritten, um das Projekt lokal zu starten:

```bash
# Installiere alle Pakete
npm install

# Starte Docker Compose für die Datenbank (MariaDB) und PHPMyAdmin
docker compose up -d mariadb phpmyadmin

# Starte Frontend & Backend im Development Mode
npm run dev
```

### Mit Docker Compose

Um die gesamte Anwendung (inklusive Datenbank und Frontend/Backend) per Docker Compose zu starten, führe einfach folgenden Befehl aus:

```bash
# Starte die komplette Anwendung via Docker Compose
docker compose up
```

Die Anwendung ist danach verfügbar unter:
- **Application:** [http://localhost:4200](http://localhost:4200)
- **PHPMyAdmin:** [http://localhost:9200](http://localhost:9200)

**Default Login Credentials:**
- **Username:** `user`, `moderator` oder `admin`
- **Password:** `123456`

### Hinweis zur Installation von Dependencies im Docker-Setup

Im Dockerfile wird beim Start der Anwendung der Befehl `npm install --no-optional` verwendet.  
Das Flag `--no-optional` bewirkt, dass optionale Abhängigkeiten, die plattformabhängig sind (wie z.B. **@rollup/rollup-win32-x64-msvc**), in Linux-Umgebungen übersprungen werden.  
Dies stellt sicher, dass npm keine fehlerhaften oder nicht benötigten Pakete installiert, wenn das Projekt unter Linux (z.B. in einem Container) läuft.
