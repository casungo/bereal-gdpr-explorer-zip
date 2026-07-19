<script lang="ts">
  import { Lock, Sparkles, TrendingUp } from "@lucide/svelte";
  import { appStore } from "@/lib/stores/app";
  import WelcomeHero from "@/components/loader/WelcomeHero.svelte";
  import LoadingState from "@/components/loader/LoadingState.svelte";
  import FileDropZone from "@/components/loader/FileDropZone.svelte";

  const { isLoading, progress, error, loadFiles, loadDemoData } = appStore;

  let zipFile: File | null = $state(null);
  let gzFile: File | null = $state(null);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const filesArray = Array.from(files);
    const newZip = filesArray.find((f) =>
      f.name.toLowerCase().endsWith(".zip"),
    );
    const newGz = filesArray.find((f) => f.name.toLowerCase().endsWith(".gz"));

    if (newZip) {
      zipFile = newZip;
      gzFile = newGz ?? null;
    } else if (newGz) {
      gzFile = newGz;
    }
  }

  async function handleAnalyze() {
    if (zipFile && !$isLoading) {
      await loadFiles(zipFile, gzFile);
    }
  }
</script>

<div
  class="flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:px-8 sm:py-16"
>
  <div class="w-full max-w-5xl mx-auto">
    <WelcomeHero />

    <main>
      {#if $isLoading}
        <LoadingState progress={$progress} />
      {:else}
        {#if $error}
          <div class="alert alert-error mb-6">
            <div>
              <h3 class="font-bold">Error Processing Files</h3>
              <div class="text-xs">
                {$error}
              </div>
            </div>
          </div>
        {/if}

        <FileDropZone {zipFile} {gzFile} onFilesSelected={handleFiles} />
        <div
          class="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
        >
          <button
            class="btn btn-primary w-full sm:w-auto"
            onclick={handleAnalyze}
            disabled={!zipFile || $isLoading}
          >
            Analyze selected files
          </button>
          <button
            class="btn btn-outline w-full sm:w-auto"
            onclick={loadDemoData}
          >
            Explore demo data
          </button>
          {#if zipFile && !gzFile}
            <p class="text-center text-sm opacity-70">
              Analytics is optional. Analyze this ZIP now, or add the analytics
              file first.
            </p>
          {/if}
        </div>
      {/if}

      <div class="mt-10 grid gap-4 text-center md:grid-cols-3">
        <div
          class="flex flex-col items-center rounded-2xl bg-base-100/65 p-6 shadow-[0_0_0_1px_oklch(0_0_0/0.04)]"
        >
          <Lock class="mb-4 size-9 text-primary" />
          <h3 class="text-lg font-semibold">Your Data is Private</h3>
          <p class="mt-2 max-w-xs text-sm leading-relaxed text-base-content/65">
            Everything happens in your browser. Your files are never uploaded to
            a server, ensuring your data remains yours.
          </p>
        </div>
        <div
          class="flex flex-col items-center rounded-2xl bg-base-100/65 p-6 shadow-[0_0_0_1px_oklch(0_0_0/0.04)]"
        >
          <Sparkles class="mb-4 size-9 text-primary" />
          <h3 class="text-lg font-semibold">Instant Insights</h3>
          <p class="mt-2 max-w-xs text-sm leading-relaxed text-base-content/65">
            No waiting, no sign-ups. Just drop your files and instantly explore
            interactive charts and timelines of your BeReal history.
          </p>
        </div>
        <div
          class="flex flex-col items-center rounded-2xl bg-base-100/65 p-6 shadow-[0_0_0_1px_oklch(0_0_0/0.04)]"
        >
          <TrendingUp class="mb-4 size-9 text-primary" />
          <h3 class="text-lg font-semibold">Discover Your Habits</h3>
          <p class="mt-2 max-w-xs text-sm leading-relaxed text-base-content/65">
            Uncover trends in your posting times, see your most-used Realmojis,
            and get a new perspective on your digital life.
          </p>
        </div>
      </div>
    </main>
  </div>
</div>
