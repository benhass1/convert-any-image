# Convert Any Image Monorepo

Convert Any Image is organised as a Cloudflare-first hybrid deployment: the public Vite frontend runs on Cloudflare Pages, the lightweight YouTube transcript endpoint runs at the Cloudflare edge, and heavy conversions remain in a Docker container controlled by the operator. The split keeps large or sensitive files out of the public cloud workflow while allowing the UI and transcript cache to stay fast.

| Directory | Runtime | Responsibility |
|---|---|---|
| `frontend/` | Vite + React | Public UI deployed to Cloudflare Pages. It reads only public endpoint configuration from `VITE_*` variables. |
| `worker/` | Cloudflare Workers | Transcript API with request validation, strict CORS and Cache API reuse. |
| `local-backend/` | Docker + FastAPI | Operator-controlled heavy conversion service using ImageMagick and local OS codecs. |
| `shared/` | TypeScript source | Framework-neutral request and response contracts. |
| `.github/workflows/` | GitHub Actions | Path-filtered production workflows for Cloudflare Pages and Workers. |

## Prerequisites

Use Node.js 22 and pnpm 10 for the JavaScript workspaces. Run Docker on the machine that will perform heavy local conversions. A Cloudflare account is required when you are ready to deploy the public frontend and edge worker.

## Local Frontend

Install workspace packages once from the repository root, then run the frontend.

```bash
pnpm install
pnpm dev:frontend
```

The frontend reads `VITE_WORKER_URL` and `VITE_LOCAL_BACKEND_URL` as public build-time configuration. Set them in your local shell or deployment environment; do not commit deployment values or secrets.

## Cloudflare Transcript Worker

The worker accepts `POST /v1/transcript` with `{ "videoId": "11-character-id", "language": "en" }`. It validates the request, only grants CORS to `ALLOWED_ORIGIN`, and looks in the Cloudflare Cache API before contacting the upstream timed-text endpoint. Repeated video and language requests therefore avoid unnecessary upstream requests.

```bash
pnpm --dir worker install
pnpm dev:worker
```

Set the final Cloudflare Pages origin in `worker/wrangler.toml` before deploying. For production, publish through the GitHub workflow after completing [SECRETS_SETUP.md](./SECRETS_SETUP.md).

## Local Docker Converter

The local backend does not deploy to Vercel or Cloudflare. It is for a trusted computer or private network where ImageMagick, Ghostscript and RAW tooling are available inside the container.

```bash
cp local-backend/.env.template local-backend/.env
# Edit ALLOWED_ORIGINS before starting the container.
pnpm backend:up
```

The health endpoint is available at `http://localhost:8000/health`. The conversion endpoint accepts `multipart/form-data` at `POST /api/convert`, with `file` and `output_format` fields. The container runs as an unprivileged user, uses a read-only filesystem and receives a temporary in-memory working directory.

## CI/CD

`deploy-frontend.yml` runs only when `frontend/`, `shared/` or its workflow changes on `main`. It installs the root workspace, validates and builds `frontend`, then publishes `frontend/dist` to the `convert-any-image` Cloudflare Pages project. `deploy-worker.yml` runs only when `worker/` or its workflow changes and uses Cloudflare’s Wrangler action to publish the Worker.

The Docker converter intentionally has no cloud deployment workflow. Keep it local, connect it to the frontend with `VITE_LOCAL_BACKEND_URL`, and expose it only through a trusted network path if remote access is needed.

## Security Model

The repository ignores environment files, package dependencies, Python caches and Docker runtime directories. Deployment credentials are supplied as GitHub repository secrets; frontend endpoint URLs are public Vite build configuration; Cloudflare origin and cache settings are ordinary worker configuration. Read [SECRETS_SETUP.md](./SECRETS_SETUP.md) before enabling the workflows.
