import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const projectRoot = new URL("../", import.meta.url);
const publicDirectory = new URL("public/", projectRoot);
const iconBytes = await readFile(new URL("icon-512.png", publicDirectory));
const iconDataUrl = `data:image/png;base64,${iconBytes.toString("base64")}`;
const interBytes = await readFile(
  new URL(
    import.meta
      .resolve("@fontsource-variable/inter/files/inter-latin-wght-normal.woff2"),
  ),
);
const interDataUrl = `data:font/woff2;base64,${interBytes.toString("base64")}`;

const browser = await chromium.launch();

try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });

  await page.setContent(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <style>
          @font-face {
            font-family: "Brand Inter";
            src: url("${interDataUrl}") format("woff2");
            font-style: normal;
            font-weight: 100 900;
          }
          * { box-sizing: border-box; }
          html, body { margin: 0; width: 100%; height: 100%; }
          body {
            font-family: "Brand Inter", sans-serif;
          }
          #card {
            display: flex;
            width: 1200px;
            height: 630px;
            overflow: hidden;
            background: #f3f6fb;
            color: #111827;
          }
          .mark-panel {
            display: flex;
            width: 390px;
            align-items: center;
            justify-content: center;
            background: #074ea2;
          }
          .mark-panel img {
            width: 224px;
            height: 224px;
            border-radius: 42px;
            box-shadow: 0 18px 40px rgb(0 25 67 / 28%);
          }
          .content {
            display: flex;
            min-width: 0;
            flex: 1;
            flex-direction: column;
            padding: 76px 76px 64px;
          }
          .name {
            margin: 0;
            color: #074ea2;
            font-size: 28px;
            font-weight: 750;
            letter-spacing: -0.02em;
          }
          h1 {
            max-width: 650px;
            margin: 40px 0 26px;
            font-size: 66px;
            line-height: 0.98;
            letter-spacing: -0.04em;
          }
          .description {
            max-width: 620px;
            margin: 0;
            color: #4b5563;
            font-size: 24px;
            line-height: 1.4;
          }
          .url {
            margin: auto 0 0;
            color: #374151;
            font-size: 20px;
            font-weight: 650;
          }
        </style>
      </head>
      <body>
        <main id="card">
          <div class="mark-panel">
            <img src="${iconDataUrl}" alt="" />
          </div>
          <div class="content">
            <p class="name">BeReal GDPR Explorer</p>
            <h1>Your BeReal archive,<br />made clear.</h1>
            <p class="description">
              Explore posts, memories, friends, and habits privately—entirely in your browser.
            </p>
            <p class="url">berealgdprviewer.eu</p>
          </div>
        </main>
      </body>
    </html>
  `);
  await page.evaluate(() => document.fonts.ready);
  await page.locator("#card").screenshot({
    path: fileURLToPath(new URL("og-image.png", publicDirectory)),
  });

  await page.setViewportSize({ width: 512, height: 512 });
  await page.setContent(`
    <!doctype html>
    <html>
      <head>
        <style>
          * { box-sizing: border-box; }
          html, body { margin: 0; width: 100%; height: 100%; }
          #maskable {
            display: flex;
            width: 512px;
            height: 512px;
            align-items: center;
            justify-content: center;
            background: #074ea2;
          }
          #maskable img {
            width: 360px;
            height: 360px;
          }
        </style>
      </head>
      <body>
        <div id="maskable"><img src="${iconDataUrl}" alt="" /></div>
      </body>
    </html>
  `);
  await page.locator("#maskable").screenshot({
    path: fileURLToPath(new URL("icon-maskable-512.png", publicDirectory)),
  });
} finally {
  await browser.close();
}
