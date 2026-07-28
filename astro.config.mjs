// @ts-check

import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://berealgdprviewer.eu",

  vite: {
    plugins: [tailwindcss()],
    build: {
      target: "es2020",
      minify: "esbuild",
      sourcemap: false,
    },
  },

  integrations: [svelte(), sitemap()],

  build: {
    format: "directory",
    assets: "_assets",
  },

  output: "static",
});
