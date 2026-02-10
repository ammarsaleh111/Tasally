# SEO Implementation (2026-02-10)

This document tracks what was implemented in the codebase for SEO and what must be configured in Netlify/Search Console after deployment.

## Implemented in Code

### Phase 1: Technical Foundation

- Added centralized SEO helpers and site config in `src/lib/seo.js`.
- Upgraded global metadata in `src/app/layout.js`:
  - `metadataBase`
  - title template
  - canonical
  - Open Graph/Twitter defaults
  - robots behavior for production vs non-production
  - WebSite JSON-LD
- Added crawl directives:
  - `src/app/robots.ts`
  - `src/app/sitemap.ts`
- Added noindex utilities and route-level noindex layouts:
  - `src/lib/noindex.js`
  - `src/app/admin/layout.jsx`
  - `src/app/login/layout.jsx`
  - `src/app/profile/layout.jsx`
  - `src/app/groups/layout.jsx`
  - `src/app/badges/layout.jsx`
- Added canonical-host redirect middleware:
  - `middleware.ts`

### Phase 2: Crawlability + Information Architecture

- Refactored home and games routes into server wrappers + client components:
  - `src/app/page.js` (server wrapper with metadata + JSON-LD + static crawlable text)
  - `src/app/HomePageClient.jsx`
  - `src/app/games/page.js` (server wrapper with metadata + JSON-LD + crawlable links)
  - `src/app/games/GamesPageClient.jsx`
- Added route-level metadata for indexable sections:
  - `src/app/games/layout.js`
  - `src/app/leaderboard/layout.tsx`
  - `src/app/themes/layout.tsx`
  - `src/app/games/*/layout.jsx` for all game routes

### Phase 3: Index Quality + Deployment Safety

- Prevented non-production indexing with context-aware robots behavior:
  - global metadata robots defaults in `src/app/layout.js`
  - `robots.txt` behavior in `src/app/robots.ts`
  - response headers in `next.config.mjs`
- Added production-only canonical host redirect behavior via middleware env configuration.
- Added context-aware `X-Robots-Tag` response header logic in `next.config.mjs`.
- Set `/leaderboard` to noindex due auth-gated/low crawl value.
- Added dynamic social preview images:
  - `src/app/opengraph-image.tsx`
  - `src/app/twitter-image.tsx`

### Phase 4: Content Expansion

- Added SEO landing pages:
  - `src/app/how-to-play/page.tsx`
  - `src/app/word-games/page.tsx`
  - `src/app/puzzle-games/page.tsx`
  - `src/app/daily-puzzle-archive/page.tsx`
- Added these new pages to sitemap generation.

## Validation Completed

- `npm run build`: success.
- `npm run lint`: success.

## Required Netlify Environment Variables

Set in Netlify for production site:

- `NEXT_PUBLIC_SITE_URL=https://ammartimes.tech`
- `NEXT_PUBLIC_CANONICAL_HOST=ammartimes.tech`
- `NEXT_PUBLIC_CANONICAL_PROTOCOL=https`

If your final canonical is different (for example `www.ammartimes.tech`), use that exact host in `NEXT_PUBLIC_CANONICAL_HOST`.

## Post-Deploy Checklist

1. Deploy production branch to Netlify.
2. Verify:
   - `https://<your-domain>/robots.txt`
   - `https://<your-domain>/sitemap.xml`
3. Verify canonical redirect behavior:
   - `netlify.app` URL should 308 redirect to your canonical host.
   - non-canonical host should redirect to canonical host.
4. Add domain property in Google Search Console.
5. Submit sitemap in Google Search Console.
6. Monitor indexing status and coverage reports for excluded/duplicate pages.

## Sources

- Google SEO Starter Guide:
  https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- JavaScript SEO basics:
  https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- Robots meta and X-Robots-Tag:
  https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag
- Sitemaps:
  https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- Search Console sitemap submission:
  https://support.google.com/webmasters/answer/7451001
- Search Console domain properties:
  https://support.google.com/webmasters/answer/34592
- Next.js metadata API:
  https://nextjs.org/docs/app/building-your-application/optimizing/metadata
- Next.js robots convention:
  https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
- Next.js sitemap convention:
  https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
- Next.js middleware:
  https://nextjs.org/docs/app/building-your-application/routing/middleware
- Netlify custom domains:
  https://docs.netlify.com/manage/domains/add-or-register-domain/
- Netlify redirects:
  https://docs.netlify.com/manage/routing/redirects/
- Netlify deploy contexts:
  https://docs.netlify.com/configure-builds/file-based-configuration/#deploy-contexts
