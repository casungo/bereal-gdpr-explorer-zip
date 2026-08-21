# Product PRD — BeReal GDPR Explorer

Audit date: 2026-08-12
Status: public browser tool; live demo flow verified, real archive use not measured.

## Intent

- Target users: BeReal users who have requested a GDPR archive and want to understand, browse, and save its contents without uploading personal data.
- Core job: turn an unfamiliar BeReal ZIP or `json.gz` export into understandable posts, memories, relationships, conversations, analytics, and media.
- Non-goals: a BeReal replacement, an account-connected service, server-side archive processing, tracking, or a claim of official BeReal affiliation.

## Current maturity

### Shipped or verified in the repository

The browser app validates supported archives, enforces size/entry/expansion limits, parses metadata and media, and exposes archive reports plus views for posts, memories, friends, conversations, analytics, and related data. Local processing, in-memory state, offline shell behavior, and download/export paths are documented. Automated test, check, and build scripts are present.

### Real-use evidence

`https://berealgdprviewer.eu/` returned 200. A live read-only browser session opened the in-memory demo and rendered the overview, navigation, counts, posting frequency, visibility, realmojis, conversations, and analytics sections. No user archive was uploaded, so compatibility across real GDPR export variants and retention are unverified by design.

## Work state

- Completed: privacy-preserving archive flow, media-aware browsing, demo data, responsive dashboard, and documented limits.
- Active: compatibility and maintenance based on real export reports.
- Blocked: no implementation blocker found; real-user evidence is intentionally absent from the privacy-preserving product.
- Frozen/undecided: no server upload or account feature is planned.

## Next action / owner decision

Collect privacy-preserving compatibility reports from several real export shapes and use them to prioritize parser fixes without adding telemetry or uploads.

## Anti-slop audit

### Text

No confirmed text defect at 75% confidence or higher. The live copy is specific about local processing, archive limits, and what the user can explore.

### Code

No confirmed anti-slop code defect at the threshold. The parser and limit handling have dedicated checks; no speculative cleanup was justified.

### Design

No confirmed design defect at the threshold. The live dashboard has clear hierarchy, task-specific navigation, restrained cards, and readable status messaging.

## Evidence sources

- [README.md](README.md)
- [package.json](package.json)
- `src/`
- Live read-only check: [berealgdprviewer.eu](https://berealgdprviewer.eu/), 200 on 2026-08-12; demo flow only.
- Existing product register was updated in this file rather than duplicated.
