# Custom Domain and Automation Setup

## Current Cloudflare State

The Cloudflare zone for `convertanyimage.com` is active and uses Cloudflare nameservers. The public site is already deployed at [convert-any-image.pages.dev](https://convert-any-image.pages.dev).

The following Pages domains and DNS records have now been created:

| Hostname | DNS record | Target | Proxy | Current state |
|---|---|---|---|---|
| `convertanyimage.com` | CNAME | `convert-any-image.pages.dev` | Proxied | Active and serving HTTPS |
| `www.convertanyimage.com` | CNAME | `convert-any-image.pages.dev` | Proxied | Active and serving HTTPS |

Cloudflare Pages has recognised both CNAME records, completed certificate validation and activated the root and `www` hostnames. Both URLs now return HTTP 200 over HTTPS. Keep the two CNAME records in place while using Cloudflare Pages.

## GitHub Actions Secrets

The workflow files are committed in the private repository at [benhass1/convert-any-image](https://github.com/benhass1/convert-any-image). The connected GitHub integration cannot write Actions secrets, so they were added once through the GitHub web interface. Both workflow reruns now complete successfully.

1. Sign in to GitHub as an owner of `benhass1/convert-any-image`.
2. Open **Settings** → **Secrets and variables** → **Actions**.
3. Select **New repository secret** and create the two secrets below. Never commit their values in a file.

| Secret name | Value to enter | Used by |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | A newly created scoped Cloudflare token with **Cloudflare Pages — Edit** and **Workers Scripts — Edit** permissions | Cloudflare Pages and Worker deploy workflows |
| `CLOUDFLARE_ACCOUNT_ID` | `e1160d5046d96aefb9bd8b35df4e5047` | Cloudflare Pages and Worker deploy workflows |

4. Open the **Actions** tab and rerun the most recent workflows to verify the deployment credentials work.
5. Once both deployments pass, revoke any previous exposed Global API Key. The workflows use `CLOUDFLARE_API_TOKEN` and do not require `CLOUDFLARE_API_KEY` or `CLOUDFLARE_EMAIL`.

## DNS and HTTPS Checks

Within Cloudflare, go to **Workers & Pages** → **convert-any-image** → **Custom domains**. Both hostnames now display **Active**. For future DNS changes, verify:

```text
https://convertanyimage.com
https://www.convertanyimage.com
```

The transcript Worker is configured to accept browser requests from both custom-domain origins as well as the Pages fallback hostname. The apex hostname is canonical: Cloudflare Redirect Rules now send `www.convertanyimage.com/*` to `https://convertanyimage.com/${1}` with HTTP 301 and query-string preservation. This behavior was independently verified with a redirected request that ended at the canonical home page with HTTP 200.
