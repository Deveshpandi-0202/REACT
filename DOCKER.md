# Docker Deployment Guide

This guide explains how to containerize and run the **GrocerApp** full-stack app
(Flask backend + React frontend) using Docker and Docker Compose.

---

## Architecture

```
Browser
   |
   v
Frontend container (Nginx on :80, mapped to host :8080)
   |  serves the built React app at /
   |  proxies /api -> backend:5000
   v
Backend container (Gunicorn + Flask on :5000)
   |
   v
SQLite database (persistent volume: backend-data)
```

- The **frontend** is built by a Node stage, then served by Nginx (lightweight).
  Its API base URL is `/api`, so all requests stay same-origin and Nginx
  reverse-proxies them to the backend container. This avoids CORS issues.
- The **backend** runs Gunicorn and stores its SQLite database in a named
  volume (`backend-data`) so your data survives container restarts/recreation.
- Both containers share a private Docker network created automatically by
  Compose, so they can talk via service names (`backend`, `frontend`).

---

## What Was Added

| File | Purpose |
|------|---------|
| `backend/Dockerfile` | Flask + Gunicorn container image |
| `backend/.dockerignore` | Excludes venv, `.db`, caches from the image |
| `my-react-app/Dockerfile` | Multi-stage: Node build → Nginx serve |
| `my-react-app/nginx.conf` | Serves the SPA + proxies `/api` to backend |
| `my-react-app/.dockerignore` | Excludes `node_modules`, `dist`, `.env` from the image |
| `docker-compose.yml` | Orchestrates both services + persistent DB volume |
| `docker-compose.pull.yml` | **Quick start** – pulls pre-built images from Docker Hub |
| `.env.example` | Template for environment variables |

---

## Images on Docker Hub

Both images are published to **Docker Hub** under `deveshpandi0202`:

| Image | Docker Hub URL |
|-------|----------------|
| `deveshpandi0202/grocerapp-backend:latest` | https://hub.docker.com/r/deveshpandi0202/grocerapp-backend |
| `deveshpandi0202/grocerapp-frontend:latest` | https://hub.docker.com/r/deveshpandi0202/grocerapp-frontend |

Clients do **not** need Node, Python, or the source code — they only need
Docker. See the Quick Start below.

Small code changes to support Docker:

- `vite.config.js` — `base` is now configurable via `VITE_BASE_PATH`
  (defaults to `/REACT/` for GitHub Pages, set to `/` for Docker).
- `backend/app.py` — the SQLite DB URI is now read from the
  `SQLALCHEMY_DATABASE_URI` env var (falls back to the local default).

---

## Prerequisites

- **Docker Desktop** — install from <https://www.docker.com/products/docker-desktop/>
  (this also installs the `docker compose` plugin).

---

## Quick Start for Clients (no source code needed)

A client only needs **Docker Desktop**. They don't need Node, Python, Git or the
source code. The pre-built images are pulled automatically from Docker Hub.

**Step 1 — Install Docker Desktop** from <https://www.docker.com/products/docker-desktop/>

**Step 2 — Download just these two files** from the GitHub repo
(`REACT` repo → `docker-compose.pull.yml` and `.env.example`):

- `docker-compose.pull.yml`
- `.env.example`

Or clone the whole repo (optional):

```bash
git clone https://github.com/deveshpandi-0202/REACT.git
cd REACT
```

**Step 3 — Run** (from the folder that contains `docker-compose.pull.yml`):

```bash
docker compose -f docker-compose.pull.yml up -d
```

That command downloads both images from Docker Hub and starts the app.
Then open your browser at **http://localhost:8080** 🎉

**To stop:**

```bash
docker compose -f docker-compose.pull.yml down
```

**Login credentials (seeded automatically):**

| Role  | Email              | Password   |
|-------|--------------------|------------|
| Admin | `admin@grocerapp.com` | `admin123` |
| User  | `rahul@test.com`   | `rahul123` |

---

## Run the App with Docker Compose (build from source)

If you cloned the repo and want to build the images yourself instead of pulling
them, run from the **project root** (`REACT/`):

```powershell
docker compose up --build
```

- The frontend will be available at **http://localhost:8080**
- The backend API is reachable through the frontend proxy at
  **http://localhost:8080/api** (also directly on `backend:5000` inside the network)

To run in the background (detached):

```powershell
docker compose up --build -d
```

To stop the containers:

```powershell
docker compose down
```

To stop **and delete the database volume** (fresh start):

```powershell
docker compose down -v
```

Required tools:

- Turn off the dev servers (backend on :5000 and frontend on :5173) if they are
  still running, since Docker maps its own ports.

---

## Configuration

### JWT Secret

It is read from the `JWT_SECRET_KEY` environment variable. In `docker-compose.yml`
the default is `grocerapp-jwt-secret-key-change-in-production-2024`. For real
deployments, set it via a `.env` file in the project root:

```bash
JWT_SECRET_KEY=your-strong-random-secret-here
```

`docker compose` automatically loads a `.env` file from the project root.

### Ports

- The frontend container listens on `:80` and is mapped to host `:8080`.
- The backend is not exposed to the host (only reachable within the Docker
  network via the frontend proxy). To expose it too, add `"5000:5000"`
  under the `backend` service → `ports` in `docker-compose.yml`.

---

## Useful Commands

| Command | Description |
|---------|-------------|
| `docker compose build` | Rebuild the images |
| `docker compose logs -f` | Stream logs from all services |
| `docker compose logs frontend` | Logs from the frontend only |
| `docker compose ps` | Show running services & status |
| `docker volume ls` | List Docker volumes (DB lives in `grocerapp_backend-data`) |

---

## Deploying to a Server (Docker Swarm / machine)

Once Docker is on a server:

1. Push this repo to the server (or clone it there).
2. Run:

   ```bash
   docker compose up --build -d
   ```

3. Point a domain / reverse proxy (Nginx, Caddy, Traefik) at host port `8080`.

---

## Notes & Troubleshooting

- **Ports already in use:** if port `8080` is taken, change the host mapping in
  `docker-compose.yml`, e.g. `"9090:80"`, then re-run `docker compose up -d`.
- **SQLite persistence:** data is stored in the `backend-data` volume. Do not
  use `down -v` unless you want to wipe the database.
- **Local non-Docker dev is unchanged:** the `vite.config.js` and `app.py`
  changes fall back to the original behaviour, so GitHub Pages and Render
  deployments still work exactly as before.
