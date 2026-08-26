# Revision Checklist

- [x] Audit every user-requested input and output format against the current browser processing capabilities.
- [x] Add a complete format registry with clear input/output availability, constraints, and actionable fallback states.
- [x] Implement the widest reliable local conversion paths available for standard, vector, document, HEIC, TIFF, and RAW-family formats.
- [x] Translate all interface, navigation, status messages, legal pages, and blog content into English.
- [ ] Update SEO metadata, sitemap, and robots content for the English site.
- [ ] Test conversion and compression flows, review responsive pages, and confirm the production build.

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
