# Cloudflare Deployment Credentials

This repository contains no deployment tokens, API keys or private endpoint credentials. The frontend and transcript API both deploy through Cloudflare. Add the values below in **GitHub repository settings → Secrets and variables → Actions** before enabling the deployment workflows on `main`.

| Secret | Used by | Source and purpose |
|---|---|---|
| `CLOUDFLARE_API_KEY` | Both deployment workflows | A Cloudflare Global API Key used by Wrangler with the account email. Prefer replacing it with a least-privilege API token when account permissions allow. |
| `CLOUDFLARE_EMAIL` | Both deployment workflows | The Cloudflare account email paired with the Global API Key. |
| `CLOUDFLARE_ACCOUNT_ID` | Both deployment workflows | The identifier of the Cloudflare account owning the Pages project and Worker. |

## Public Build Configuration

The production frontend defaults to the deployed transcript Worker URL. Optional `VITE_*` build variables may override this in a controlled build environment, but they are browser-visible and must never contain credentials.

| Variable | Default | Purpose |
|---|---|---|
| `VITE_WORKER_URL` | `https://convert-any-image-transcript.benmhamed-hassan.workers.dev` | Base URL used by the frontend transcript client. |
| `VITE_LOCAL_BACKEND_URL` | `http://localhost:8000` | URL for a converter run by the user on a trusted local network. Do not point this at a public Docker host without separate authentication and network controls. |

## Cloudflare Worker and Pages Origin

The Worker CORS policy accepts a comma-separated `ALLOWED_ORIGINS` list. It currently permits the reserved `https://convert-any-image.pages.dev` hostname and the intended `https://convertanyimage.com` custom domain. Remove the Pages fallback after custom-domain cutover if you want a single-origin policy. `CACHE_TTL_SECONDS` controls the Cache API response lifetime; the default is one day.

## Local Docker Configuration

The heavy converter remains independent of both Cloudflare deployments. Set `ALLOWED_ORIGINS` and `MAX_UPLOAD_MB` when launching the local container if the safe defaults need changing; do not give the container Cloudflare or GitHub credentials.

> `VITE_*` variables are embedded in the browser bundle. Never put a Cloudflare token, GitHub token, YouTube credential, or any other secret in a `VITE_*` variable.

## Initial Setup Sequence

Create the Cloudflare Pages project named `convert-any-image`, build the Vite app from `frontend`, and publish `frontend/dist`. Confirm the Pages hostname, update the Worker CORS origin, then add the two Cloudflare GitHub secrets. The path-filtered workflows deploy the frontend and Worker independently after a push to `main`.
