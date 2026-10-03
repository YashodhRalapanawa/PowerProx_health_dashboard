# PowerProx Health Dashboard

PowerProx Health Dashboard is a monitoring system for PowerProx infrastructure services. It provides real-time service health checks, latency tracking, Docker container stats, system resource utilization, and GitHub deployment synchronization.

---

## Architecture & Compose Modes

The project provides three Docker Compose configurations tailored for different workflows:

### 1. Local Development (`compose.yaml`)
Designed for developer workstations running Docker Desktop.
- **Backend**: Runs on `http://127.0.0.1:5000`, using `backend/.env`.
- **Frontend**: Serves the development/client build on `http://127.0.0.1:8080` with `VITE_API_URL=http://localhost:5000/api`.
- **Image tags**: `powerprox-backend:local` and `powerprox-frontend:local`.

### 2. Image-Only Server Deployment (`compose.deploy.yaml`) - *Recommended for Production*
Designed for staging and production servers using prebuilt, verified `linux/amd64` images exported by GitHub Actions.
- **Target URL**: `https://powerprox.sltidc.lk/monitoring/`
- **Reverse Proxy Routing**: Upstream Apache forwards `/monitoring/` to `http://127.0.0.1:8095/`, stripping the `/monitoring/` prefix.
- **API Isolation**: Uses `VITE_API_URL=/monitoring/api` so dashboard API calls never collide with the company's existing `/api/` application on the host domain.
- **No On-Host Builds**: Contains no `build` directives.
- **No Registry Pulls**: Configured with `pull_policy: never` to guarantee only verified, loaded images run.
- **Immutable Tags**: Uses `${IMAGE_TAG}` matching the full Git commit SHA.
- **Backend**: Runs internally inside the private Compose network on port 5000 (no published host port). Requires `backend/.env.server`.
- **Frontend**: Serves the production bundle via Nginx built with `VITE_BASE_PATH=/monitoring/`, binding strictly to loopback `127.0.0.1:8095:80`.
- **Resource Limits**: Configured with initial CPU and memory limits.

### 3. Server Build & Run (`compose.server.yaml`) - *Legacy / On-Host Build*
Designed for environments where images must be built directly on the server host from source code rather than loaded from CI artifacts.
- Builds images locally on the target host using `backend/Dockerfile` and `frontend/Dockerfile.server`.
- Uses image tags `powerprox-backend:server` and `powerprox-frontend:server`.

---

## Production Image-Only Deployment Workflow (`compose.deploy.yaml`)

This is the standard deployment process using downloadable GitHub Actions image artifacts.

### 1. Download Artifacts
On a successful push to `main` (or a manual workflow dispatch on `main`), GitHub Actions packages the `linux/amd64` images into a downloadable artifact named `powerprox-deployment-images`.

Download the artifact archive and unpack it into a working directory on the server:
- `powerprox-backend.tar` (Docker image archive for backend)
- `powerprox-frontend.tar` (Docker image archive for frontend server)
- `manifest.json` (Source commit SHA, timestamp, and image metadata)
- `SHA256SUMS` (Cryptographic checksums)

### 2. Verify Cryptographic Checksums
Before loading images into Docker, verify archive integrity against `SHA256SUMS`:

```bash
sha256sum -c SHA256SUMS
```

All archives and the manifest must report `OK`.

### 3. Load Images into Docker
Load the prebuilt image archives directly into the server's Docker daemon:

```bash
docker load -i powerprox-backend.tar
docker load -i powerprox-frontend.tar
```

Docker will load the images tagged with the full Git commit SHA:
- `powerprox-backend:<COMMIT_SHA>`
- `powerprox-frontend:<COMMIT_SHA>`

### 4. Inspect Manifest and Set Image Tag
Read `manifest.json` to identify the immutable commit SHA:

```bash
cat manifest.json
```

Export the `IMAGE_TAG` environment variable on the server:

```bash
export IMAGE_TAG="<COMMIT_SHA>"
```

*(Alternatively, prepend `IMAGE_TAG=<COMMIT_SHA>` to your `docker compose` commands).*

### 5. Create Server Environment File
The server Compose configuration strictly requires `backend/.env.server` and does not fall back to `backend/.env`.

If not already present, create it from the example template:

```bash
cp backend/.env.server.example backend/.env.server
```

Edit `backend/.env.server` to specify production credentials:

```bash
PORT=5000
GITHUB_TOKEN=your_private_github_token_here
```

> **Security Note:** Enter real secrets privately on the target host. Never commit `backend/.env.server` to Git. Both `.gitignore` and `backend/.dockerignore` exclude `.env.*` to prevent secrets from entering version control or Docker build contexts.

### 6. Start Containers (No Building, No Pulling)
Start the containers using `compose.deploy.yaml`:

```bash
IMAGE_TAG=<COMMIT_SHA> docker compose -f compose.deploy.yaml up -d
```

Because `compose.deploy.yaml` has no `build` definitions and specifies `pull_policy: never`, Docker Compose starts containers solely from the locally loaded images.

---

## Deployment Container Management Commands (`compose.deploy.yaml`)

All deployment commands require `IMAGE_TAG` to reference the loaded commit SHA:

### Start
```bash
IMAGE_TAG=<COMMIT_SHA> docker compose -f compose.deploy.yaml up -d
```

### Check Status & Health
```bash
IMAGE_TAG=<COMMIT_SHA> docker compose -f compose.deploy.yaml ps
```

### View Logs
```bash
# Aggregated logs
IMAGE_TAG=<COMMIT_SHA> docker compose -f compose.deploy.yaml logs -f

# Service-specific logs
IMAGE_TAG=<COMMIT_SHA> docker compose -f compose.deploy.yaml logs -f backend
IMAGE_TAG=<COMMIT_SHA> docker compose -f compose.deploy.yaml logs -f frontend
```

### Stop
```bash
IMAGE_TAG=<COMMIT_SHA> docker compose -f compose.deploy.yaml down
```

---

## Resource Limits & Runtime Verification

`compose.deploy.yaml` establishes initial container resource limits:

| Service | CPU Limit | Memory Limit |
| :--- | :---: | :---: |
| **backend** | `0.50` CPU | `512 MB` |
| **frontend** | `0.25` CPU | `128 MB` |

> **Operational Notice:**
> - These resource limits are **initial baselines** designed to protect host stability and prevent runaway consumption.
> - Actual resource utilization must be verified and adjusted against real-world traffic on the physical company server using `docker stats` and server monitoring tools.

---

## Network Exposure (Port 8095)

In both server Compose files, the frontend service binds to:

```yaml
ports:
  - "127.0.0.1:8095:80"
```

This binds Nginx strictly to the loopback interface (`127.0.0.1`) on port `8095`:
- **Server-Local Only**: The dashboard is accessible directly on the server via `http://127.0.0.1:8095/` (or via an SSH tunnel: `ssh -L 8095:127.0.0.1:8095 user@server`).
- **Production Public Access (`https://powerprox.sltidc.lk/monitoring/`)**: Apache on the host terminates SSL and forwards requests to the container, stripping `/monitoring/`:
  ```apache
  ProxyPass /monitoring/ http://127.0.0.1:8095/
  ProxyPassReverse /monitoring/ http://127.0.0.1:8095/
  ```
  - Incoming requests to `/monitoring/` reach the container as `/`.
  - Static asset requests (`/monitoring/assets/...`) reach the container as `/assets/...`.
  - API requests (`/monitoring/api/...`) reach the container as `/api/...`, allowing the container's Nginx to proxy them to `backend:5000/api/` without interfering with the host's primary `/api/` application.

---

## Legacy On-Host Server Build (`compose.server.yaml`)

For developer testing on server-like environments where source code is compiled directly on the host:

```bash
# Start and build images locally
docker compose -f compose.server.yaml up -d --build

# Status and logs
docker compose -f compose.server.yaml ps
docker compose -f compose.server.yaml logs -f

# Stop
docker compose -f compose.server.yaml down
```

---

## Health Metrics Verification Status

> **Important Notice:**
> - System health metrics (CPU utilization, memory usage, disk storage, and host load) displayed on the dashboard are **provisional** until verified directly against the physical company server environment.
> - When running locally under macOS with Docker Desktop, system metrics collected inside containers reflect Docker Desktop's underlying **Linux VM**, not the physical host Mac hardware.
> - Final host-metric verification and end-to-end production deployment verification are pending execution on the actual company server hardware.