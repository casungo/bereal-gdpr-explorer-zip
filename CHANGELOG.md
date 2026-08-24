# Changelog

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
