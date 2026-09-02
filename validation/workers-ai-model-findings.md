# Workers AI integration findings

- Cloudflare documents `@cf/microsoft/resnet-50` as image classification using a 50-layer CNN trained on ImageNet.
- The model’s documented task is object/category classification, not AI-generated-image provenance or synthetic-image detection.
- The user-provided example that converts the top ImageNet score into `ai_probability` would be misleading: model confidence for a label is not a probability that an image was AI-generated.
- The requested implementation should therefore present the result as an edge image-classification signal and metadata artifact flag, not as a reliable forensic AI-authenticity verdict.
- Cloudflare’s current Workers AI navigation places binding setup under `/workers-ai/get-started/workers-wrangler/` and the model page provides the model ID and raw input/output schemas.

## Sources

1. https://developers.cloudflare.com/workers-ai/models/resnet-50/ — Cloudflare resnet-50 model documentation.
2. https://developers.cloudflare.com/workers-ai/get-started/workers-wrangler/ — Cloudflare Workers AI binding setup documentation (URL identified from current docs navigation; retrieve before deployment if needed).

## Production validation

- Frontend deployment workflow succeeded for commit `02dba59`.
- Transcript Worker deployment workflow succeeded for commit `02dba59`.
- `OPTIONS /api/detect-ai` from `https://convertanyimage.com` returned HTTP 204 with the expected allow-origin and methods.
- An empty POST returned HTTP 400 with the expected validation message.
- A disallowed origin returned HTTP 403.
- A live PNG inference returned HTTP 200 with `success: true`, model `@cf/microsoft/resnet-50`, classification tags, and a confidence value. `ai_probability` remained `null` by design because this model is not an AI-authorship detector.
