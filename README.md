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

### Image-provenance verification alternatives

Convert Any Image intentionally does **not** label an image as AI-generated from appearance alone. A reliable next step is to verify evidence that is actually present in the file, rather than to infer origin from pixels.

| Approach | What it can establish | Main limitation | Setup complexity |
| --- | --- | --- | --- |
| **C2PA / Content Credentials verification** | Whether a present Content Credential has a valid, tamper-evident manifest and which signed creation or edit assertions it carries. | The absence of a credential does not mean the image is human-made or AI-made; credentials can be missing or stripped. | Moderate: add the browser-oriented `c2pa-web` library and present a manifest/validation result. |
| **Provider-specific provenance verification** | Whether a supported provider’s own provenance signal is found in a compatible file. | It only covers that provider and its supported files or export paths; a missing signal is inconclusive. | Low for a link-out workflow; provider APIs may require separate access and terms. |
| **Specialist forensic detection service** | A provider-specific probabilistic score from a model trained for synthetic-media detection. | Scores can shift with new models, editing, compression and domain; use only after testing a representative evaluation set and with clear error reporting. | Higher: vendor review, privacy agreement, API integration, monitoring and regression testing. |

For this site, the recommended first enhancement is **C2PA / Content Credentials verification**. C2PA uses signed manifests and asset bindings that are tamper-evident, and the official JavaScript ecosystem includes `c2pa-web` for browser-side metadata work. It can report “valid credential,” “invalid credential,” or “no credential found” without claiming that an uncredentialed image has a particular origin. [1] [2]

Provider-specific checks are useful only as a secondary, clearly scoped option. For example, OpenAI Verify is designed to identify supported OpenAI provenance signals; it does not determine whether content came from other AI tools and a missing signal remains inconclusive. [3]

#### References

[1] [C2PA FAQs — Content Credentials and tamper-evident provenance](https://c2pa.org/faqs/)

[2] [Content Authenticity Initiative open-source SDK — browser validation and manifest handling](https://opensource.contentauthenticity.org/docs/getting-started/)

[3] [OpenAI — Provenance signals, supported coverage and limitations](https://help.openai.com/en/articles/8912793-provenance-signals-content-credentials-synthid-in-openai-generated-content)

### View EXIF: vérification C2PA locale

La page `/view-exif` charge `@contentauth/c2pa-web` uniquement après la sélection d’un fichier compatible. La bibliothèque lit le manifeste C2PA et ses informations de validation dans le navigateur ; le fichier sélectionné n’est pas envoyé à Convert Any Image ni au Worker Cloudflare.

L’interface rend l’un des quatre résultats suivants : **credential validated** lorsqu’un succès de validation est explicitement fourni, **credential found** lorsqu’un manifeste est lisible mais sans statut de succès explicite, **validation issue** lorsqu’un échec est signalé, ou **no credential found / unreadable** lorsque le fichier ne contient pas de manifeste exploitable. L’absence de Content Credentials est toujours présentée comme **non concluante**.

Le package apporte un binaire WebAssembly chargé à la demande. Cela ajoute un téléchargement initial lorsque l’utilisateur lance pour la première fois le contrôle C2PA, mais évite ce coût sur les parcours de conversion et de compression. La validation C2PA ne remplace pas une analyse judiciaire, ne certifie pas le contexte d’une image et ne permet pas d’inférer l’origine d’un fichier sans manifeste.

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

## Custom Domain

See [CUSTOM_DOMAIN_SETUP.md](./CUSTOM_DOMAIN_SETUP.md) for the current `convertanyimage.com` Pages-domain configuration, the DNS records in use and the GitHub Actions-secret handoff.
