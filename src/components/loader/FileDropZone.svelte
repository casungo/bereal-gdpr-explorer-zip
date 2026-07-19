<script lang="ts">
  import { FileArchive, FileJson, UploadCloud } from "@lucide/svelte";

  const { zipFile, gzFile, onFilesSelected } = $props<{
    zipFile: File | null;
    gzFile: File | null;
    onFilesSelected: (files: FileList | null) => void;
  }>();

  let isDragging: boolean = $state(false);

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
    onFilesSelected(e.dataTransfer?.files || null);
  }

  function handleFileChange(e: Event) {
    const target = e.target as HTMLInputElement;
    onFilesSelected(target.files);
    target.value = "";
  }
</script>

<div
  class="group relative overflow-hidden rounded-2xl bg-base-100 shadow-[0_0_0_1px_oklch(0_0_0/0.06),0_16px_50px_-30px_oklch(0_0_0/0.35)] transition-[box-shadow,background-color,transform] duration-200 {isDragging
    ? 'bg-primary/8 shadow-[0_0_0_3px_color-mix(in_oklch,var(--color-primary)_35%,transparent)] scale-[1.01]'
    : ''} {zipFile || gzFile
    ? 'shadow-[0_0_0_2px_color-mix(in_oklch,var(--color-primary)_28%,transparent)]'
    : ''}"
  ondragenter={handleDragEnter}
  ondragleave={handleDragLeave}
  ondragover={handleDragOver}
  ondrop={handleDrop}
>
  <input
    type="file"
    multiple
    accept=".zip,.gz,.json.gz,application/zip,application/gzip"
    class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
    onchange={handleFileChange}
    id="file-upload"
  />
  <label
    for="file-upload"
    class="flex cursor-pointer flex-col items-center justify-center p-8 text-center md:p-12"
  >
    <UploadCloud
      class="mb-5 h-14 w-14 transition-[color,transform] duration-200 group-hover:-translate-y-1 {zipFile ||
      gzFile
        ? 'text-primary/80'
        : 'opacity-50'}"
    />
    <div class="text-xl font-bold tracking-tight text-balance md:text-2xl">
      Drop your BeReal export here
    </div>
    <div class="mt-2 max-w-xl text-base-content/65 text-pretty">
      Drag and drop the ZIP file, or click to browse. The JSON.GZ analytics file
      is optional.
    </div>
    <div
      class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto mt-6 w-full"
    >
      <div
        class="flex min-h-12 items-center justify-center gap-2 rounded-xl p-3 text-sm {gzFile
          ? 'bg-success/20 text-success'
          : 'bg-base-200'}"
      >
        <FileJson class="w-5 h-5 flex-shrink-0" />
        <span class="font-medium truncate">
          {gzFile?.name || "Analytics Data (.json.gz)"}
        </span>
      </div>
      <div
        class="flex min-h-12 items-center justify-center gap-2 rounded-xl p-3 text-sm {zipFile
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
