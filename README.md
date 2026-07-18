# BeReal GDPR Explorer

A privacy-focused tool to explore and analyze your BeReal GDPR data export. View your posts, memories, friends, and more in an interactive web interface that runs entirely in your browser.

## Overview

BeReal GDPR Explorer is a client-side web application that allows you to explore and analyze your BeReal data export obtained through GDPR requests. The tool provides a user-friendly interface to browse through your posts, memories, friends, conversations, and other data types, offering insights into your BeReal usage patterns.

## Key Features

- **Privacy-First**: All processing happens in your browser - your data never leaves your device
- **Combined Front-back Download**: Export your photos just as you see them on Bereal!
- **Metadata-aware Media Exports**: Preserve original image formats for separate
  camera exports, generate merged JPEGs, and include timestamp/location metadata
  in ZIP downloads
- **Interactive Dashboard**: Explore your BeReal data through various organized views
- **Analytics & Insights**: Discover patterns in your posting habits, most-used reactions, and more
- **Media Support**: View all your photos and videos from the export
- **No Registration Required**: Simply upload your files and start exploring
- **Responsive Design**: Works on desktop and mobile devices

## Privacy & Security

Your privacy is our top priority. This application processes all data locally in your browser:

- No data is uploaded to any server
- No tracking or analytics collection
- Files are processed entirely client-side
- Temporary data is cleared when you refresh the page

## Installation & Usage

### Online Usage

Visit the [live site](https://berealgdprviewer.eu/)

### Offline Usage

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
1. The application will automatically detect and process the files
1. Keep the tab open while the supported archive is processed
1. Start exploring your data!

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

If you encounter any issues or have questions:

- Check the [Issues](https://github.com/casungo/bereal-gdpr-explorer-zip/issues) page
- Create a new issue with details about your problem
- Include your browser version and export size if relevant

---

**Note**: This tool is not affiliated with BeReal. It's an independent project designed to help users explore their own data.
