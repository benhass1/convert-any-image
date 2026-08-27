# Revision Checklist

- [x] Audit every user-requested input and output format against the current browser processing capabilities.
- [x] Add a complete format registry with clear input/output availability, constraints, and actionable fallback states.
- [x] Implement the widest reliable local conversion paths available for standard, vector, document, HEIC, TIFF, and RAW-family formats.
- [x] Translate all interface, navigation, status messages, legal pages, and blog content into English.
- [x] Update SEO metadata, sitemap, and robots content for the English site.
- [x] Test conversion and compression flows, review responsive pages, and confirm the production build.
- [x] Fix the standard PNG-to-PDF browser conversion route so it uses the native canvas decoder and client-side PDF encoder instead of the unstable WASM decoder.
- [ ] Diagnose why the live site still shows the prior PNG-to-PDF WASM failure, then verify the deployed conversion request reprocesses correctly.
- [x] Expand the conversion selector’s reliable batch-output behavior while keeping unsupported browser-only conversions explicit and routed to the local Docker fallback.
- [x] Repair the conversion interface and key pages for mobile viewport usability.
- [x] Replace the public standard-image-to-PSD Docker dependency with a browser-only PSD encoder so PSD output works on mobile and desktop without a local service.
- [x] Show each uploaded image as a thumbnail preview in the conversion queue so users can identify the selected file before converting it.
- [x] Replace failing standard-image public outputs (SVG, ICO, CUR, TIFF, BMP, GIF and TGA) with browser-safe encoders, and hide JXL, HDR and EXR until a reliable public path exists.
- [x] Add truthful homepage SEO metadata, keyword-led headings, conversion guidance, FAQ markup and structured data without claiming unverified usage, offline mode or unlimited file sizes.
- [x] Add truthful compression-page SEO metadata, keyword-led content, use cases, FAQ markup and structured data without guaranteeing 90% savings, lossless results or offline operation.
- [x] Add a visible Convert Any Image favicon based on the existing navy-and-lime brand mark.
- [x] Build the supplied how-to, compression, privacy and emerging-format article cluster with factual capability disclosures, internal links, article metadata and BlogPosting schema.
- [ ] Generate and integrate a distinct article visual for each guide, with descriptive alt text and responsive lazy-loaded presentation. First 10 covers are live; the remaining 10 require image-generation quota availability.
- [x] Make all article links to the converter and compressor open directly at their upload areas using reliable in-page anchors.
- [x] Reset scroll to the top for every guide-route transition while retaining sticky-header-safe upload targets for converter and compressor links.
- [x] Reduce first-load work for modern Safari and Firefox, serve generated article covers from public image URLs, and provide graceful visual fallbacks and upload-area landing behavior.
- [x] Add the supplied Google Search Console verification meta tag to the homepage head and confirm it on the live domain.
- [x] Move the converter and compressor workbenches into the normal top-of-page entry experience and repair the clipped guide layout reported in the supplied screenshot.
- [x] Condense the Guides-page entry header so the first article cards are visible immediately on page load.
- [x] Replace generic generated-image captions with concise, article-specific visual titles across the guide hub.
- [x] Remove the browser focus outline around the converter workbench when blog links open the upload anchor.
- [x] Add a dedicated local EXIF removal page after Compress that creates cleaned image copies and clearly explains supported formats and limits.
- [x] Add a truthful EXIF metadata preview, keyword-focused removal-page copy, and related privacy guides without making unverified claims about file limits or universal metadata removal.
- [x] Resolve the reported SEO and AI-crawler readiness gaps: missing alt text, static readable content and metadata, entity/author/date/Open Graph signals, source citations, and optional llms.txt guidance.
- [x] Verify and strengthen the homepage static content, citations and author/date schema before requesting a fresh audit crawl.
- [x] Apply the same static readable content, citations, author/date schema and social metadata treatment to Compress, Remove EXIF and Guides.
- [x] Increase Compress crawler-visible static content depth and verify the non-JavaScript response is substantive for AI and search crawlers.
- [x] Strengthen Remove EXIF crawler-visible static depth, answer-first guidance, entity markup, same-identity About reference and visible About/contact signals.
- [x] Add semantic H3 subsections to the crawler-visible Remove EXIF page and verify they are present in the deployed HTML.
- [x] Add verified SoftwareApplication capabilities and three non-duplicative high-intent conversion guides without hidden text, keyword stuffing or unsupported file-limit claims.
- [x] Add accurate tool-page structured data, descriptive headings and related-tool navigation without creating unsupported format routes or keyword-stuffed copy.
- [x] Review the newly requested exact schema and heading wording, preserving only capability-safe copy without file-limit, transparency or lossless-compression guarantees.
- [x] Compare the repeated requested JSON-LD snippet with the deployed capability-safe SoftwareApplication schema and document any excluded claims.
- [x] Refine visible homepage format and compression links with accurate destination labels and title attributes, without transparency-creation or lossless-compression promises.
- [x] Confirm the requested WebP and Discord headings, retaining accurate wording where compression quality depends on the selected settings.
- [x] Review the requested aggressive SEO patch and strengthen only accurate schema, visible link labels and the existing Discord guide without duplicate content or unsupported file-limit, transparency or lossless claims.
- [x] Review the attached homepage SEO-copy request and implement only concise, visible, capability-safe wording and navigation improvements.
- [x] Make direct visits to the converter and compressor open at their respective upload workbenches with a sticky-header-safe offset.
- [x] Ensure the compressor direct-entry scroll also matches the production trailing-slash canonical route.
- [x] Generate and attach distinct editorial cover images for all guide articles that currently use the styled fallback.
- [x] Diagnose why mapped guide cover images are not visible on live article pages and correct their placement or availability if needed.
- [x] Publish the generated guide covers to production-accessible storage and replace the failing local storage paths.
- [x] Add an isolated EXIF report page that reads available local metadata from an uploaded image and links to the existing EXIF-removal tool.

## Hybrid Deployment Monorepo

- [x] Assess the existing frontend and map it into the requested monorepo layout.
- [x] Create frontend, worker, local-backend and shared package foundations with root workspace configuration.
- [x] Add secure ignore rules, root documentation and local Docker instructions.
- [x] Implement the Cloudflare transcript worker with origin-restricted CORS and edge caching.
- [x] Add Vercel configuration, frontend environment integration and both GitHub Actions deployment workflows.
- [x] Create a complete GitHub and Vercel secret-setup guide without committing credentials.
- [x] Validate the frontend and worker build paths; validate Docker Compose on the target Docker host before first local launch (Docker is unavailable in this development environment).

## Live Integration Setup

- [ ] Confirm GitHub, Vercel and Cloudflare account access without exposing credentials in files or messages.
- [ ] Create the GitHub remote repository, set the production default branch and push the validated monorepo.
- [ ] Configure the documented GitHub Actions secrets and Vercel public environment variables.
- [ ] Confirm the Cloudflare Worker deployment scope and CORS origin.
- [ ] Build the local Docker converter and validate representative RAW, PDF and PSD conversion fixtures.
- [ ] Report verified live endpoints, deployment status and any environment-specific limitation.

## Cloudflare Frontend Migration

- [ ] Inspect the existing Cloudflare Pages and Worker deployment state and select the non-conflicting frontend project name.
- [ ] Replace Vercel configuration and Vercel CI with Cloudflare Pages build and deployment configuration.
- [ ] Set the production frontend to use the deployed Cloudflare transcript Worker endpoint.
- [ ] Create and publish the static frontend to Cloudflare Pages from the production build output.
- [ ] Update Worker CORS to permit the verified Cloudflare Pages production origin.
- [ ] Validate the public Pages site and transcript API integration, then update deployment documentation.

## Cloudflare Browser Blocker

- [ ] Resolve the blocked Cloudflare dashboard session and repair or reinstall the Cloudflare Pages GitHub integration for `benhass1/convert-any-image`.
- [ ] Recreate the Pages project with GitHub source configuration once the Cloudflare Git installation is healthy.
- [ ] Confirm the automatic production build completes from the `main` branch before enabling the GitHub Actions fallback workflow.

## Authorized Cloudflare Deployment

- [x] Validate the supplied Cloudflare credential without printing or committing it.
- [x] Publish the validated `frontend/dist` artifact to the reserved Cloudflare Pages project.
- [x] Update the live transcript Worker to permit the Cloudflare Pages production origin.
- [ ] Store the Cloudflare deployment token and account identifier in GitHub Actions secrets, then verify workflow access. Blocked: the installed GitHub integration has no Actions-secret permission (HTTP 403).
- [ ] Test the public Pages site and its allowed-origin transcript API request.

## Custom Domain and Automation Handoff

- [x] Inspect the Cloudflare zone, Pages domain attachment and existing DNS records for `convertanyimage.com`.
- [x] Provide the exact GitHub Actions-secret creation steps and permission requirement.
- [x] Attach `convertanyimage.com` and `www.convertanyimage.com` to the Cloudflare Pages project using the safe DNS records.
- [x] Update and verify Worker CORS for the custom domain after HTTPS issuance.
- [x] Validate root-domain, `www` and Pages fallback behavior after DNS propagation. All three hostnames return HTTP 200 and both Pages custom domains are active.
- [x] Create the scoped Cloudflare API token, save `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in GitHub Actions secrets, verify both deployment workflows, and revoke the exposed Global API Key.
- [x] Remove the duplicate pnpm-version declaration that blocked the GitHub Actions frontend deployment before Cloudflare authentication ran.
- [x] Replace the malformed `CLOUDFLARE_ACCOUNT_ID` GitHub secret with the exact single-line account ID, then rerun both deployment workflows successfully.
- [x] Redirect `www.convertanyimage.com` to `convertanyimage.com` with a 301 rule that preserves the path and query string.
