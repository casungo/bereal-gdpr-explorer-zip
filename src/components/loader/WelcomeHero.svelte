<script lang="ts">
  import { ExternalLink } from "@lucide/svelte";
  import BrandLogo from "@/components/BrandLogo.svelte";
  import { APP_DISCLAIMER, APP_NAME } from "@/lib/brand";
  import { APP_VERSION } from "@/lib/version";
</script>

<header class="mb-10 text-center md:mb-12">
  <BrandLogo class="mx-auto size-20" alt="{APP_NAME} logo" priority={true} />
  <div class="mt-5 flex flex-wrap items-center justify-center gap-2">
    <span class="font-semibold text-base-content/80">{APP_NAME}</span>
    <span class="badge badge-primary badge-outline">v{APP_VERSION}</span>
  </div>
  <h1 class="mt-4 text-4xl font-bold tracking-tight text-balance md:text-6xl">
    Open your own BeReal<br class="hidden sm:block" /> GDPR export.
  </h1>
  <p
    class="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-base-content/70 md:text-xl"
  >
    Browse your own posts, memories and conversations from the ZIP BeReal sent
    you. The archive contains JSON records and media. Processing stays in your
    browser; download your photos to keep.
  </p>
  <p class="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-base-content/60">
    Free to use. No account, uploads or tracking. Your archive stays on this
    device.
  </p>
  <div class="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
    <a href="/how-to-export-bereal/" class="btn btn-outline gap-2">
      <ExternalLink class="w-5 h-5" />
      <span class="font-medium">How to request your export</span>
    </a>
    <a
      href="https://github.com/casungo/bereal-gdpr-explorer-zip"
      target="_blank"
      rel="noopener noreferrer"
      class="btn btn-ghost gap-2"
    >
      <ExternalLink class="w-5 h-5" />
      <span class="font-medium">View on GitHub</span>
    </a>
  </div>
  <p class="mt-3 text-xs text-base-content/55">
    This viewer does not access BeReal profiles or request your data for you.
    {APP_DISCLAIMER}
  </p>
</header>
