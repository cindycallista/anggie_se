# Week 6 / ParcelDock

[Review the browser version](https://anggie0707.github.io/_se/hw6/)

ParcelDock records packages received at a dormitory desk. Each entry keeps a recipient, carrier, tracking code, shelf position, and pickup state.

## Two review modes

The GitHub Pages version uses browser storage so the interface can be checked immediately. The container version connects the same workflow to a Node.js API and PostgreSQL through Nginx.

```bash
docker compose up --build
```

After startup, open `http://localhost:8080`. The API provides health, list, create, and pickup endpoints under `/api`.
