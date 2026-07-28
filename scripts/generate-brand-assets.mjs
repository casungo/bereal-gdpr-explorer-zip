import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const projectRoot = new URL("../", import.meta.url);
const publicDirectory = new URL("public/", projectRoot);
const iconBytes = await readFile(new URL("icon-512.png", publicDirectory));
const iconDataUrl = `data:image/png;base64,${iconBytes.toString("base64")}`;
const brandFontPaths = ["Regular", "Bold"].map((weight) =>
  fileURLToPath(
    new URL(`assets/LiberationSansNarrow-${weight}.ttf`, import.meta.url),
  ),
);

const ogImage = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <clipPath id="icon-clip">
        <rect x="83" y="203" width="224" height="224" rx="42" />
      </clipPath>
      <filter id="icon-shadow" x="-30%" y="-30%" width="160%" height="180%">
        <feDropShadow dx="0" dy="18" stdDeviation="20" flood-color="#001943" flood-opacity="0.28" />
      </filter>
    </defs>

    <rect width="1200" height="630" fill="#f3f6fb" />
    <rect width="390" height="630" fill="#074ea2" />
    <image
      href="${iconDataUrl}"
      x="83"
      y="203"
      width="224"
      height="224"
      clip-path="url(#icon-clip)"
      filter="url(#icon-shadow)"
    />

    <g font-family="Liberation Sans Narrow">
      <text x="466" y="103" fill="#074ea2" font-size="28" font-weight="700">
        BeReal GDPR Explorer
      </text>
      <text x="466" y="205" fill="#111827" font-size="66" font-weight="700">
        <tspan x="466" dy="0">Your BeReal archive,</tspan>
        <tspan x="466" dy="65">made clear.</tspan>
      </text>
      <text x="466" y="330" fill="#4b5563" font-size="24" font-weight="400">
        <tspan x="466" dy="0">Explore posts, memories, friends, and habits privately</tspan>
        <tspan x="466" dy="34">—entirely in your browser.</tspan>
      </text>
      <text x="466" y="562" fill="#374151" font-size="20" font-weight="600">
        berealgdprviewer.eu
      </text>
    </g>
  </svg>
`;

const maskableIcon = `
  <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    <rect width="512" height="512" fill="#074ea2" />
    <image href="${iconDataUrl}" x="76" y="76" width="360" height="360" />
  </svg>
`;

function renderPng(svg, options = {}) {
  return new Resvg(svg, {
    ...options,
    font: {
      fontFiles: brandFontPaths,
      loadSystemFonts: false,
      defaultFontFamily: "Liberation Sans Narrow",
    },
  })
    .render()
    .asPng();
}

await Promise.all([
  writeFile(new URL("og-image.png", publicDirectory), renderPng(ogImage)),
  writeFile(
    new URL("icon-maskable-512.png", publicDirectory),
    renderPng(maskableIcon),
  ),
]);
