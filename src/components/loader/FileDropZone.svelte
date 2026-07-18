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
    accept=".zip,.gz,.json.gz,application/zip,application/gzip"
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
      Drag and drop your `.zip` file. The `.json.gz` analytics file is optional,
      or click to browse.
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
