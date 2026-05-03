<script lang="ts">
import { ExternalLink } from "@lucide/svelte";
import { APP_VERSION } from "@/lib/version";
</script>

<header class="text-center mb-12">
  <div class="w-16 h-16 mb-4 mx-auto bg-primary rounded-lg"></div>
  <h1 class="text-4xl md:text-5xl font-bold tracking-tight">
    BeReal GDPR Files Explorer
  </h1>
  <div class="mt-3">
    <span class="badge badge-primary badge-outline">v{APP_VERSION}</span>
  </div>
  <p class="max-w-2xl mt-4 text-lg opacity-70 mx-auto">
    A privacy-focused tool to explore and analyze your BeReal GDPR data export.
    View your posts, memories, friends, and more.
  </p>
  <div class="mt-5 text-sm opacity-75 max-w-2xl mx-auto">
    Request your export from BeReal support in the app, or use the official
    request form and ask for a downloadable copy of your account data.
  </div>
  <div class="mt-6 flex justify-center">
    <a
      href="https://github.com/casungo/bereal-gdpr-explorer-zip"
      target="_blank"
      rel="noopener noreferrer"
      class="inline-flex items-center gap-2 px-4 py-2 bg-base-200 hover:bg-base-300 rounded-lg transition-colors"
    >
      <ExternalLink class="w-5 h-5" />
      <span class="font-medium">View on GitHub</span>
    </a>
  </div>
</header>
