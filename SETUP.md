# TwinForce — Backend Setup Guide

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Bun | ≥ 1.2 | `curl -fsSL https://bun.sh/install \| bash` |
| Docker Desktop | ≥ 4.30 | https://docker.com/products/docker-desktop |
| Python | 3.11+ | https://python.org |
| Node.js | ≥ 20 | https://nodejs.org |

---

## Step 1 — Environment Variables

```bash
cp .env.example .env
```

Fill in these required values in `.env`:

| Variable | Where to get it |
|----------|----------------|
| `OPENAI_API_KEY` | https://platform.openai.com |
| `ANTHROPIC_API_KEY` | https://console.anthropic.com |
| `SUPABASE_URL` | Your Supabase project settings |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase project settings |
| `STRIPE_SECRET_KEY` | https://stripe.com/dashboard |
| `JWT_SECRET` | Run: `openssl rand -hex 32` |
| `ENCRYPTION_KEY` | Run: `openssl rand -hex 32` |

---

## Step 2 — Start Infrastructure (Docker)

```bash
cd infrastructure/docker
docker compose up -d postgres redis qdrant minio nats

# Wait for postgres to be healthy
docker compose ps
```

---

## Step 3 — Run Database Schema

```bash
# Option A: Apply schema directly via psql
docker compose exec postgres psql -U postgres -d twinforce -f /docker-entrypoint-initdb.d/01-schema.sql

# Option B: The schema runs automatically on first postgres startup
# Check with:
docker compose logs postgres | tail -20
```

---

## Step 4 — Start the API (Hono / Bun)

```bash
cd apps/api
bun install
bun run dev
# API running at http://localhost:3001
```

---

## Step 5 — Start the AI Service (FastAPI)

```bash
cd apps/ai
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# AI Service running at http://localhost:8000
```

---

## Step 6 — Start the Frontend

```bash
# From project root
bun install
bun run dev
# Frontend running at http://localhost:5173
```

---

## Step 7 — Health Checks

```bash
curl http://localhost:3001/health
# {"status":"ok","service":"twinforce-api"}

curl http://localhost:8000/health
# {"status":"ok","service":"twinforce-ai"}
```

---

## Monitoring

| Service | URL |
|---------|-----|
| API | http://localhost:3001 |
| AI Service | http://localhost:8000 |
| AI Docs (Swagger) | http://localhost:8000/docs |
| MinIO Console | http://localhost:9001 (minioadmin/minioadmin) |
| Qdrant Dashboard | http://localhost:6333/dashboard |
| NATS Monitor | http://localhost:8222 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3002 (admin/admin) |

---

## Production Deployment

```bash
# Build Docker images
docker compose -f infrastructure/docker/docker-compose.yml build

# Deploy to Kubernetes (EKS)
kubectl apply -f infrastructure/kubernetes/

# Or use Terraform for full AWS infra
cd infrastructure/terraform
terraform init
terraform plan -var="db_password=YOURPASSWORD"
terraform apply
```
