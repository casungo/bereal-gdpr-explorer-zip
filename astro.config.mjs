// @ts-check

import svelte from "@astrojs/svelte";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    build: {
      target: "es2020",
      minify: "esbuild",
      sourcemap: false,
    },
    optimizeDeps: {
      exclude: ["@types/pako"],
    },
  },

  integrations: [svelte()],

  build: {
    format: "directory",
    assets: "_assets",
  },

  output: "static",
});
