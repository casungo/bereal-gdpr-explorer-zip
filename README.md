# BeReal GDPR Explorer

A privacy-focused tool to explore and analyze your BeReal GDPR data export. View your posts, memories, friends, and more in an interactive web interface that runs entirely in your browser.

## Overview

BeReal GDPR Explorer is a client-side web application that allows you to explore and analyze your BeReal data export obtained through GDPR requests. The tool provides a user-friendly interface to browse through your posts, memories, friends, conversations, and other data types, offering insights into your BeReal usage patterns.

## Key Features

- **Privacy-First**: All processing happens in your browser - your data never leaves your device
- **Combined Front-back Download**: Export your photos just as you see them on Bereal!
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

### Supported Files

The application requires two files from your BeReal export:

1. **Main Archive** (.zip) - Contains all your data
1. **App Analytics Data** (.json.gz) - Contains only app analytics

### Upload Process

1. Drag and drop both files onto the upload area, or click to browse
1. The application will automatically detect and process the files
1. Wait for the parsing to complete (may take some time for large archives)
1. Start exploring your data!

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
