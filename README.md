# PowerProx Health Dashboard

PowerProx Health Dashboard is a monitoring system for PowerProx infrastructure services. It provides real-time service health checks, latency tracking, Docker container stats, system resource utilization, and GitHub deployment synchronization.

---

## Architecture & Compose Modes

The project provides two Docker Compose configurations tailored for different deployment targets:

### 1. Local Development (`compose.yaml`)
Designed for developer workstations running Docker Desktop.
- **Backend**: Runs on `http://127.0.0.1:5000`, using `backend/.env`.
- **Frontend**: Serves the development/client build on `http://127.0.0.1:8080` with `VITE_API_URL=http://localhost:5000/api`.
- **Image tags**: `powerprox-backend:local` and `powerprox-frontend:local`.

### 2. Server Deployment (`compose.server.yaml`)
Designed for production/staging company servers.
- **Backend**: Runs internally inside the private Compose network on port 5000. It does **not** expose ports directly to the host, ensuring backend isolation.
- **Frontend**: Multi-stage production build using `frontend/Dockerfile.server` and Nginx (`frontend/nginx.server.conf`). Nginx handles SPA client routing and reverse-proxies `/api/` requests internally to `http://backend:5000/api/`.
- **Host Binding**: Binds exclusively to `127.0.0.1:8095:80`.
- **Image tags**: `powerprox-backend:server` and `powerprox-frontend:server`.

---

## Environment Setup & Secrets Management

The server Compose configuration strictly requires `backend/.env.server`. It does not fall back to `backend/.env`.

### Creating the Server Environment File
On the target server, initialize the environment file from the provided example template:

```bash
cp backend/.env.server.example backend/.env.server
```

Edit `backend/.env.server` on the host to set your actual configuration and credentials:

```bash
# Set application port (internal to container network)
PORT=5000

# Set your GitHub Personal Access Token (for deployment sync badge and commit tracking)
GITHUB_TOKEN=your_private_token_here
```

> **Security Note:** Enter real secrets privately on the target host. Never commit `backend/.env.server` to Git. Both `.gitignore` and `backend/.dockerignore` exclude `.env.*` to prevent secrets from entering version control or Docker build contexts.

---

## Network Exposure (Port 8095)

In `compose.server.yaml`, the frontend service is configured with:

```yaml
ports:
  - "127.0.0.1:8095:80"
```

This binds Nginx strictly to the loopback interface (`127.0.0.1`) on port `8095`.
- **Server-Local Only**: The dashboard is accessible only from within the host machine itself (or via an SSH tunnel: `ssh -L 8095:127.0.0.1:8095 user@server`).
- **Production Public Access**: To expose the dashboard externally, route traffic through the company's designated edge reverse proxy (e.g., host-level Nginx, Caddy, or Traefik) with appropriate SSL/TLS termination and access control.

---

## Server Deployment Commands

Use the following commands from the repository root when managing the server containers:

### Start / Build
Start all containers in detached mode and rebuild images if source files changed:
```bash
docker compose -f compose.server.yaml up -d --build
```

### Check Status & Health
View container status and health states:
```bash
docker compose -f compose.server.yaml ps
```

View live aggregated container logs:
```bash
docker compose -f compose.server.yaml logs -f
```

View logs for a specific service:
```bash
docker compose -f compose.server.yaml logs -f backend
docker compose -f compose.server.yaml logs -f frontend
```

### Stop Containers
Stop and remove containers and network:
```bash
docker compose -f compose.server.yaml down
```

---

## Health Metrics Verification Status

> **Important Notice:**
> - System health metrics (CPU utilization, memory usage, disk storage, and host load) displayed on the dashboard are **provisional** until verified directly against the physical company server environment.
> - When running locally under macOS with Docker Desktop, system metrics collected inside containers reflect Docker Desktop's underlying **Linux VM**, not the physical host Mac hardware.
> - Final host-metric verification and end-to-end production deployment verification are pending execution on the actual company server hardware.