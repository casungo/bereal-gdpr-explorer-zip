# Changelog

## 2.2.0 - 2026-10-04

### Added

- A public guide to requesting a BeReal data export, with official sources and a sample request.
- Archive formats, processing limits, download instructions, and privacy FAQs on the viewer page.
- A dedicated 404 page and checks for generated SEO metadata, sitemap contents, and offline navigation.

### Changed

- Clarified that BeReal GDPR Explorer opens your own exported ZIP with JSON records and media.
- Kept the public product name consistent across the page title, interface, structured data, and app manifest.
- Documented the verified Search Console baseline and the remaining publishing and measurement steps.

### Fixed

- Prevented the posting-frequency chart from widening the mobile dashboard.
- Handled missing optional visibility and retake fields without crashing the dashboard or inventing values.
- Preserved missing-page errors instead of serving the cached homepage for unrelated offline routes.
- Added visible keyboard focus to the archive file selector.

## 2.1.1 - 2026-08-25

### Changed

- Completed the archive import flow for wrapped exports and uppercase ZIP/GZ filenames.
- Updated Astro and Wrangler dependencies and made generated brand assets reproducible in CI.

### Security

- Hardened ZIP parsing with input, entry-count, expanded-size, and export-root limits.

## 2.1.0 - 2026-07-28

### Added

- Canonical app logo across the welcome screen, navigation, PWA metadata, social previews, and repository documentation.
- Dedicated maskable PWA icon and 1200 × 630 social sharing card.
- Sitemap, crawler instructions, structured application metadata, and canonical social URLs.
- Browser-native merged-image pixel coverage with Vitest Browser Mode and Playwright.
- Production security headers for the Cloudflare static deployment.
- Visible independent-project and non-affiliation disclosure in the application.

### Changed

- Updated the product palette to use the logo's Archive Blue.
- Updated Astro, Svelte, Pako, TypeScript, Wrangler, and the remaining project dependencies.
- Bumped the offline shell cache and application version to 2.1.0.

### Security

- Added a restrictive Content Security Policy, framing protection, permissions restrictions, MIME sniffing protection, referrer isolation, and HSTS.
