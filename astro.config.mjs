// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import svelte from "@astrojs/svelte";

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    build: {
      target: "es2020",
      minify: "esbuild",
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["svelte", "@lucide/svelte"],
            utils: ["date-fns", "jszip", "pako"],
          },
        },
      },
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
