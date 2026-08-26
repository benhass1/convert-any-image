# Cloudflare Deployment Credentials

This repository contains no deployment tokens, API keys or private endpoint credentials. The frontend and transcript API both deploy through Cloudflare. Add the two values below in **GitHub repository settings → Secrets and variables → Actions** before triggering the deployment workflows on `main`.

| Secret | Used by | Value and purpose |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | Both deployment workflows | A newly created, scoped Cloudflare API token. It replaces the Global API Key and grants only the deployment permissions needed by Wrangler. |
| `CLOUDFLARE_ACCOUNT_ID` | Both deployment workflows | `e1160d5046d96aefb9bd8b35df4e5047`, the identifier of the account owning the Pages project and Worker. |

## Create the scoped API token

In Cloudflare, open **My Profile** → **API Tokens** → **Create Token** → **Create Custom Token**. Give it a clear name such as `github-convert-any-image-deploy`. Under **Account Resources**, select the account that owns `convert-any-image`. Add the following **Account** permissions with **Edit** access: **Cloudflare Pages** and **Workers Scripts**. Save the token, copy it once, then immediately add it to GitHub as `CLOUDFLARE_API_TOKEN`. Do not place it in a repository file, a `VITE_*` variable or ordinary GitHub Actions variable.

After the new token has been saved in GitHub and one successful deployment has completed, revoke the previously exposed Global API Key in **My Profile** → **API Keys**. The workflows no longer require `CLOUDFLARE_API_KEY` or `CLOUDFLARE_EMAIL`.

## Public Build Configuration

The production frontend defaults to the deployed transcript Worker URL. Optional `VITE_*` build variables may override this in a controlled build environment, but they are browser-visible and must never contain credentials.

| Variable | Default | Purpose |
|---|---|---|
| `VITE_WORKER_URL` | `https://convert-any-image-transcript.benmhamed-hassan.workers.dev` | Base URL used by the frontend transcript client. |
| `VITE_LOCAL_BACKEND_URL` | `http://localhost:8000` | URL for a converter run by the user on a trusted local network. Do not point this at a public Docker host without separate authentication and network controls. |

## Cloudflare Worker and Pages Origin

The Worker CORS policy accepts a comma-separated `ALLOWED_ORIGINS` list. It currently permits the reserved `https://convert-any-image.pages.dev` hostname plus `https://convertanyimage.com` and `https://www.convertanyimage.com`. Remove unused origins after final routing decisions if you want a narrower policy. `CACHE_TTL_SECONDS` controls the Cache API response lifetime; the default is one day.

## Local Docker Configuration

The heavy converter remains independent of both Cloudflare deployments. Set `ALLOWED_ORIGINS` and `MAX_UPLOAD_MB` when launching the local container if the safe defaults need changing; do not give the container Cloudflare or GitHub credentials.

> `VITE_*` variables are embedded in the browser bundle. Never put a Cloudflare token, GitHub token, YouTube credential, or any other secret in a `VITE_*` variable.

## Initial Setup Sequence

The Cloudflare Pages project named `convert-any-image` and its custom domains are already active. Add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`, then trigger the two path-filtered workflows independently after a push to `main`.
