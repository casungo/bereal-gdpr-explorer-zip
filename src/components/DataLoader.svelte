<script lang="ts">
  import {
    FileArchive,
    FileJson,
    Loader2,
    UploadCloud,
    Lock,
    Sparkles,
    TrendingUp,
  } from "@lucide/svelte";
  import { appStore } from "@lib/stores/app";

  const { isLoading, progress, error, loadFiles } = appStore;

  let zipFile: File | null = $state(null);
  let gzFile: File | null = $state(null);
  let isDragging: boolean = $state(false);
  let analysisCalled: boolean = $state(false);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const filesArray = Array.from(files);
    const newZip = filesArray.find((f) => f.name.endsWith(".zip")) || null;
    const newGz = filesArray.find((f) => f.name.endsWith(".gz")) || null;

    if (newZip) zipFile = newZip;
    if (newGz) gzFile = newGz;
  }

  function handleAnalyze() {
    if (zipFile && gzFile && !$isLoading && !analysisCalled) {
      analysisCalled = true;
      loadFiles(zipFile, gzFile);
    }
  }

  $effect(() => {
    if (zipFile && gzFile) {
      handleAnalyze();
    }
  });

  function handleDragEnter(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    isDragging = true;
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    isDragging = false;
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    isDragging = false;
    handleFiles(e.dataTransfer?.files || null);
  }

  function handleFileChange(e: Event) {
    const target = e.target as HTMLInputElement;
    handleFiles(target.files);
  }
</script>

<div class="flex flex-col items-center justify-center min-h-screen p-4 sm:p-8">
  <div class="w-full max-w-5xl mx-auto">
    <header class="text-center mb-12">
      <div class="w-16 h-16 mb-4 mx-auto bg-primary rounded-lg"></div>
      <h1 class="text-4xl md:text-5xl font-bold tracking-tight">
        BeReal GDPR Files Explorer
      </h1>
      <p class="max-w-2xl mt-4 text-lg opacity-70 mx-auto">
        A privacy-focused tool to explore and analyze your BeReal GDPR data
        export. View your posts, memories, friends, and more.
      </p>
    </header>

    <main>
      {#if $isLoading}
        <div class="flex flex-col items-center space-y-4">
          <Loader2 class="w-12 h-12 animate-spin text-primary" />
          <div class="w-full max-w-md text-center">
            <p class="font-medium">{$progress.message}</p>
            <progress
              class="progress progress-primary w-full mt-2"
              value={($progress.loaded / $progress.total) * 100}
              max="100"
            ></progress>
            <p class="text-sm opacity-70 mt-1">
              Please keep this tab open. Large archives may take a minute.
            </p>
          </div>
        </div>
      {:else}
        {#if $error}
          <div class="alert alert-error mb-6">
            <div>
              <h3 class="font-bold">Error Processing Files</h3>
              <div class="text-xs">{$error}</div>
            </div>
          </div>
        {/if}

        <div
          class="relative border-2 border-dashed transition-colors rounded-xl {isDragging
            ? 'border-primary bg-base-200'
            : ''} {zipFile || gzFile ? 'border-primary/50' : 'border-base-300'}"
          ondragenter={handleDragEnter}
          ondragleave={handleDragLeave}
          ondragover={handleDragOver}
          ondrop={handleDrop}
          role="button"
          tabindex="0"
        >
          <input
            type="file"
            multiple
            class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onchange={handleFileChange}
            id="file-upload"
          />
          <label
            for="file-upload"
            class="flex flex-col items-center justify-center text-center p-8 md:p-12 cursor-pointer"
          >
            <UploadCloud
              class="w-16 h-16 mb-4 {zipFile || gzFile
                ? 'text-primary/80'
                : 'opacity-50'}"
            />
            <div class="text-xl md:text-2xl font-bold">
              Drop Your BeReal Export Files Here
            </div>
            <div class="mt-2 opacity-70">
              Drag and drop the `.zip` and `.json.gz` files, or click to browse.
            </div>
            <div
              class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto mt-6 w-full"
            >
              <div
                class="flex items-center justify-center gap-2 p-3 rounded-lg text-sm {gzFile
                  ? 'bg-success/20 text-success'
                  : 'bg-base-200'}"
              >
                <FileJson class="w-5 h-5 flex-shrink-0" />
                <span class="font-medium truncate">
                  {gzFile?.name || "Analytics Data (.json.gz)"}
                </span>
              </div>
              <div
                class="flex items-center justify-center gap-2 p-3 rounded-lg text-sm {zipFile
                  ? 'bg-success/20 text-success'
                  : 'bg-base-200'}"
              >
                <FileArchive class="w-5 h-5 flex-shrink-0" />
                <span class="font-medium truncate">
                  {zipFile?.name || "Media Archive (.zip)"}
                </span>
              </div>
            </div>
          </label>
        </div>
      {/if}

      <div class="grid md:grid-cols-3 gap-8 mt-12 text-center">
        <div class="flex flex-col items-center">
          <Lock class="w-10 h-10 mb-3 text-primary" />
          <h3 class="text-lg font-semibold">Your Data is Private</h3>
          <p class="opacity-70 text-sm">
            Everything happens in your browser. Your files are never uploaded to
            a server, ensuring your data remains yours.
          </p>
        </div>
        <div class="flex flex-col items-center">
          <Sparkles class="w-10 h-10 mb-3 text-primary" />
          <h3 class="text-lg font-semibold">Instant Insights</h3>
          <p class="opacity-70 text-sm">
            No waiting, no sign-ups. Just drop your files and instantly explore
            interactive charts and timelines of your BeReal history.
          </p>
        </div>
        <div class="flex flex-col items-center">
          <TrendingUp class="w-10 h-10 mb-3 text-primary" />
          <h3 class="text-lg font-semibold">Discover Your Habits</h3>
          <p class="opacity-70 text-sm">
            Uncover trends in your posting times, see your most-used Realmojis,
            and get a new perspective on your digital life.
          </p>
        </div>
      </div>
    </main>
  </div>
</div>
