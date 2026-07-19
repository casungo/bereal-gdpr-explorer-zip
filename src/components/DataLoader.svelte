<script lang="ts">
  import { FileArchive, Lock, Search } from "@lucide/svelte";
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

      <section class="mx-auto mt-10 max-w-3xl" aria-labelledby="how-it-works">
        <h2
          id="how-it-works"
          class="text-center text-sm font-semibold uppercase tracking-wider text-base-content/55"
        >
          What happens to your files
        </h2>
        <ol class="mt-5 grid gap-5 sm:grid-cols-3">
          <li class="flex gap-3 sm:block">
            <FileArchive class="mt-0.5 size-5 shrink-0 text-primary sm:mb-2" />
            <div>
              <h3 class="font-semibold">Open the export</h3>
              <p class="mt-1 text-sm leading-relaxed text-base-content/65">
                Select the ZIP from BeReal. Add the analytics file only if you
                have one.
              </p>
            </div>
          </li>
          <li class="flex gap-3 sm:block">
            <Search class="mt-0.5 size-5 shrink-0 text-primary sm:mb-2" />
            <div>
              <h3 class="font-semibold">Browse its contents</h3>
              <p class="mt-1 text-sm leading-relaxed text-base-content/65">
                Find posts, memories, friends, conversations, and account
                details.
              </p>
            </div>
          </li>
          <li class="flex gap-3 sm:block">
            <Lock class="mt-0.5 size-5 shrink-0 text-primary sm:mb-2" />
            <div>
              <h3 class="font-semibold">Keep it on this device</h3>
              <p class="mt-1 text-sm leading-relaxed text-base-content/65">
                The browser reads your files locally. Nothing is uploaded or
                tracked.
              </p>
            </div>
          </li>
        </ol>
      </section>
    </main>
  </div>
</div>
