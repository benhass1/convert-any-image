# CI/CD Secret Setup

This repository intentionally contains no deployment tokens, API keys or private endpoint credentials. Add the values below in **GitHub repository settings → Secrets and variables → Actions** before merging the first production deployment to `main`.

| Secret | Used by | Source and purpose |
|---|---|---|
| `VERCEL_TOKEN` | `deploy-frontend.yml` | A Vercel personal or team token that can create production deployments for the selected project. |
| `VERCEL_ORG_ID` | `deploy-frontend.yml` | The Vercel team or personal account ID connected to the project. |
| `VERCEL_PROJECT_ID` | `deploy-frontend.yml` | The Vercel project ID for the `frontend` application. |
| `CLOUDFLARE_API_TOKEN` | `deploy-worker.yml` | A scoped Cloudflare token with Workers deployment permission for the target account. |
| `CLOUDFLARE_ACCOUNT_ID` | `deploy-worker.yml` | The Cloudflare account identifier that owns the Worker. |

## Vercel Environment Variables

Set the following as **Production** environment variables in the Vercel project, not as GitHub secrets. They are browser-visible configuration values and must contain no credentials.

| Variable | Example | Purpose |
|---|---|---|
| `VITE_WORKER_URL` | `https://transcript-api.example.workers.dev` | Base URL used by the frontend transcript client. |
| `VITE_LOCAL_BACKEND_URL` | `http://localhost:8000` | URL for a converter run by the user on a trusted local network. Do not point this at a public Docker host without separate authentication and network controls. |

## Cloudflare Worker Variables

`worker/wrangler.toml` includes non-secret worker variables. Before production deployment, set `ALLOWED_ORIGIN` to the exact Vercel custom domain, for example `https://convertanyimage.com`. This prevents browsers from other origins from calling the transcript endpoint. `CACHE_TTL_SECONDS` controls the Cache API response lifetime; the default is one day.

## Local Docker Configuration

Copy `local-backend/.env.template` to `local-backend/.env` only on the machine that will run the converter. Restrict `ALLOWED_ORIGINS` to the browser origin that can reach that machine. The local backend is deliberately excluded from both cloud deployment workflows and should not receive cloud secrets.

> `VITE_*` variables are embedded in the browser bundle by Vite. Never put a Vercel token, Cloudflare token, YouTube credential, or any other secret in a `VITE_*` variable.

## Initial Setup Sequence

First create the Vercel project and set its root directory to `frontend`, where `vercel.json` installs the root workspace and builds the Vite package. Next create the Cloudflare Worker, then update `ALLOWED_ORIGIN` to the final frontend origin. Add the GitHub secrets, set the two Vercel environment variables, and only then push the workflows to `main`.
