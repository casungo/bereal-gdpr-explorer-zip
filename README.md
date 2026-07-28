<p align="center">
  <img src="public/icon-192.png" width="96" height="96" alt="BeReal GDPR Explorer logo">
</p>

# BeReal GDPR Explorer

A local, browser-based viewer for BeReal GDPR exports. It reads the archive on
your device and displays the posts, memories, relationships, conversations, and
analytics inside it.

## Overview

Drop in the ZIP supplied by BeReal. The app validates its contents, reports
unsupported or malformed sections, and organizes recognized records into
browsable views. An optional `.json.gz` file adds app analytics.

## Key Features

- **Local processing**: no uploads, accounts, or tracking
- **Front-and-back downloads**: save the two BeReal camera images together
- **Metadata-aware exports**: preserve original image formats for separate
  camera exports, generate merged JPEGs, and include timestamp/location metadata
  in ZIP downloads
- **Archive report**: see which sections were imported, skipped, or missing
- **Focused views**: browse posts, memories, friends, conversations, terms, and
  account settings
- **Usage summaries**: inspect posting times, reactions, platforms, devices, and
  locations found in the export
- **Offline shell**: reopen the installed app without a network connection

## Privacy & Security

The application processes selected files locally in the browser:

- It does not upload archive contents.
- It does not collect product analytics.
- Imported records stay in memory and are cleared on refresh.
- The offline cache stores the application shell, not imported files or exports.

## Installation & Usage

### Online Usage

Visit the [live site](https://berealgdprviewer.eu/)

### Install and Use Offline

Open the live site once while online. In a supported browser, use **Install app**
from the browser menu to add it to your device. After the first successful load,
the application shell can open without a network connection.

Imported archives, analytics records, generated media, and downloads are never
stored in the offline cache. Select the export again after refreshing or
reopening the app.

### Local Development

#### Prerequisites

- node
- git
- pnpm

#### Setup

1. Clone the repository

   ```bash
   git clone https://github.com/casungo/bereal-gdpr-explorer-zip.git
   ```

1. Go into the cloned folder

   ```bash
   cd bereal-gdpr-explorer-zip
   ```

1. Install dependencies

   ```bash
   pnpm i
   ```

1. Start the dev server

   ```bash
   pnpm dev
   ```

1. Navigate to `http://localhost:4321`

## File Upload

### Getting Your BeReal Export

BeReal does not provide a regular "export all" button in every account. To get
your GDPR export, request a downloadable copy of your account data from BeReal:

1. Open BeReal and go to your profile/settings help area, then contact support
   with a request for a copy of your personal data.
1. If you cannot use the in-app flow, submit a request through the official
   [BeReal Help Center request form](https://help.bereal.com/hc/en-us/requests/new).
1. When BeReal sends the export, download the `.zip` archive. If the export also
   includes a `.json.gz` analytics file, you can add it too, but it is optional.

### Supported Files

The application supports these files from your BeReal export:

1. **Main Archive** (.zip) - Contains all your data
1. **App Analytics Data** (.json.gz) - Optional file that contains only app
   analytics

For safe in-browser processing, compressed ZIP files are limited to 500 MiB
and optional analytics GZ files to 100 MiB. ZIP archives may contain at most
20,000 entries; each entry may declare up to 512 MiB expanded, with a 2 GiB
aggregate expanded limit. Expanded analytics data is limited to 512 MiB.
Unusually large exports may need to be inspected with another local tool.

### Upload Process

1. Drag and drop the `.zip` file onto the upload area, or click to browse
1. Optionally add the `.json.gz` file if you want analytics events
1. Select **Analyze selected files**
1. Keep the tab open while the supported archive is processed
1. Review the import report, then browse the available sections

## Media Exports

When downloading posts or memories, separate camera files keep BeReal's original
media format, such as `.webp` when that is what the export contains. Generated
picture-in-picture merged images are saved as `.jpg` for broad gallery and EXIF
compatibility.

ZIP downloads also include `metadata.json` with the BeReal timestamp and
location when BeReal provided that data. JPEG outputs receive embedded EXIF
date/location metadata where the browser can safely add it. Non-JPEG originals
and videos use `.xmp` sidecars as a fallback so the original media bytes do not
need to be converted or rewritten.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Astro](https://astro.build/) and [Svelte](https://svelte.dev/)
- UI components from [DaisyUI](https://daisyui.com/)
- Icons from [Lucide](https://lucide.dev/)
- Data parsing with [JSZip](https://stuk.github.io/jszip/) and [Pako](https://github.com/nodeca/pako)

## Support

For bugs or import problems:

- Check the [Issues](https://github.com/casungo/bereal-gdpr-explorer-zip/issues) page
- Create a new issue with details about your problem
- Include your browser version and export size if relevant

---

**Note**: This independent project is not affiliated with BeReal.
