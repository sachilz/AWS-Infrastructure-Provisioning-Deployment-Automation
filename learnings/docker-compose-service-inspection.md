# Docker Compose Service Inspection — `config --format json` + Python Parser

## Purpose

Quickly inspect the **resolved, fully merged configuration** of every service in a
`docker-compose.yml` file — including build context, ports, volumes, `depends_on`,
healthcheck, and environment variable keys — without starting any containers.

---

## Command

```bash
docker compose -f app/docker-compose.yml config --format json | \
python3 -c '
import json, sys
d = json.load(sys.stdin)
for name, s in d["services"].items():
    print(f"\n--- {name} ---")
    print("image:", s.get("image"))
    print("build:", s.get("build"))
    print("ports:", s.get("ports"))
    print("depends_on:", s.get("depends_on"))
    print("volumes:", s.get("volumes"))
    print("healthcheck:", s.get("healthcheck"))
    env = s.get("environment", {})
    print("environment keys:", list(env.keys()) if isinstance(env, dict) else env)
'
```

### How it works

| Part | What it does |
|---|---|
| `docker compose config --format json` | Resolves all env-var substitutions and merges overrides, then dumps the canonical config as JSON |
| `python3 -c '...'` | Parses the JSON and pretty-prints selected fields for each service |
| `s.get("environment", {})` | Safely extracts env keys without exposing secret values |

---

## Output (Kubernetes-Migration-Deployment-to-Amazon-EKS)

```
--- backend ---
image: None
build: {'context': '/mnt/c/.../app/backend', 'dockerfile': 'Dockerfile'}
ports: [{'mode': 'ingress', 'target': 5000, 'published': '5001', 'protocol': 'tcp'}]
depends_on: {'postgres': {'condition': 'service_started', 'required': True}}
volumes: None
healthcheck: None
environment keys: ['DB_HOST', 'DB_NAME', 'DB_PASSWORD', 'DB_PORT', 'DB_USER']

--- frontend ---
image: None
build: {'context': '/mnt/c/.../app/frontend', 'dockerfile': 'Dockerfile'}
ports: [
  {'mode': 'ingress', 'target': 80, 'published': '3000', 'protocol': 'tcp'},
  {'mode': 'ingress', 'target': 80, 'published': '80',   'protocol': 'tcp'}
]
depends_on: {'backend': {'condition': 'service_started', 'required': True}}
volumes: None
healthcheck: None
environment keys: []

--- postgres ---
image: postgres:16-alpine
build: None
ports: [{'mode': 'ingress', 'target': 5432, 'published': '5432', 'protocol': 'tcp'}]
depends_on: None
volumes:
  - type: volume  | source: postgres_data        | target: /var/lib/postgresql/data
  - type: bind    | source: .../001_init.sql      | target: /docker-entrypoint-initdb.d/01_init.sql
  - type: bind    | source: .../001_seed.sql      | target: /docker-entrypoint-initdb.d/02_seed.sql
healthcheck: None
environment keys: ['POSTGRES_DB', 'POSTGRES_PASSWORD', 'POSTGRES_USER']
```

---

## Key Observations from this Output

| Service | Internal Port | Published Port | Notes |
|---|---|---|---|
| `backend` | 5000 | **5001** | Built from `app/backend/Dockerfile`; needs 5 DB env vars |
| `frontend` | 80 | **3000** and **80** | Dual-published; depends on backend being started |
| `postgres` | 5432 | 5432 | Uses official `postgres:16-alpine`; init SQL auto-runs via `docker-entrypoint-initdb.d/` |

- **`postgres` has no healthcheck** — `depends_on: service_healthy` won't work until one is added (critical for Kubernetes migration).
- The **frontend has no env vars** — Nginx serves pre-built static assets.
- **`backend` depends on `service_started`** (not `service_healthy`) — potential race condition with DB readiness.
- Init SQL files are **bind-mounted** into `docker-entrypoint-initdb.d/` — in Kubernetes this requires a **ConfigMap** or **init container**.

---

## When to Use This Technique

- Before migrating a Compose project to Kubernetes — understand exact ports, volumes, and env vars per service.
- To audit which services expose secrets vs. only key names.
- To confirm that `.env` variable substitution resolved correctly.

---

## Related Commands

```bash
# Show only service names
docker compose -f app/docker-compose.yml config --services

# Show only volume definitions
docker compose -f app/docker-compose.yml config --volumes

# Validate compose file syntax (no output = valid)
docker compose -f app/docker-compose.yml config --quiet
```

---

*Recorded: 2026-10-23 | Project: Kubernetes-Migration-Deployment-to-Amazon-EKS*
