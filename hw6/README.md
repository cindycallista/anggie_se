# HW6 — ParcelDock

ParcelDock is a container-ready parcel receiving service for a dormitory front desk. It records incoming parcels, tracks shelf locations, and marks collections.

Live interface: https://anggie0707.github.io/_se/hw6/

## Stack

- Nginx serves the interface and proxies `/api`
- Node.js and Express provide the REST API
- PostgreSQL stores parcel records
- Docker Compose starts the complete system

## Run

```bash
docker compose up --build
```

Open http://localhost:8080. GitHub Pages uses a local browser data fallback, so the interface remains easy to review without Docker.

## API

```text
GET    /api/health
GET    /api/parcels
POST   /api/parcels
PATCH  /api/parcels/:id/pickup
```
