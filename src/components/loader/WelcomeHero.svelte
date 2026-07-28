<script lang="ts">
  import { ExternalLink } from "@lucide/svelte";
  import BrandLogo from "@/components/BrandLogo.svelte";
  import { APP_NAME } from "@/lib/brand";
  import { APP_VERSION } from "@/lib/version";
</script>

<header class="mb-10 text-center md:mb-12">
  <BrandLogo class="mx-auto size-20" alt="{APP_NAME} logo" priority={true} />
  <div class="mt-5 flex flex-wrap items-center justify-center gap-2">
    <span class="font-semibold text-base-content/80">{APP_NAME}</span>
    <span class="badge badge-primary badge-outline">v{APP_VERSION}</span>
  </div>
  <h1 class="mt-4 text-4xl font-bold tracking-tight text-balance md:text-6xl">
    Your BeReal archive,<br class="hidden sm:block" /> made clear.
  </h1>
  <p
    class="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-base-content/70 md:text-xl"
  >
    Explore posts, memories, friends, and habits from your GDPR
    export—privately, right in your browser.
  </p>
  <p class="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-base-content/60">
    Request your export from BeReal support in the app, or use the official
    request form and ask for a downloadable copy of your account data.
  </p>
  <div class="mt-6 flex justify-center">
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
</header>
