<script lang="ts">
  import { Loader2 } from "@lucide/svelte";
  import type { Post, Memory, MediaMap } from "@lib/types";
  import { downloadPosts } from "@lib/download";
  import type { DownloadType } from "@lib/download";

  interface Props {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    posts: (Post | Memory)[];
    mediaMap: MediaMap;
    defaultZipName: string;
  }

  let { isOpen, onOpenChange, posts, mediaMap, defaultZipName }: Props =
    $props();

  let downloadType: DownloadType = $state("merged");
  let isDownloading = $state(false);
  let dialogRef: HTMLDialogElement;

  $effect(() => {
    if (dialogRef) {
      if (isOpen) {
        dialogRef.showModal();
      } else {
        dialogRef.close();
      }
    }
  });

  function handleClose() {
    onOpenChange(false);
  }

  async function handleDownload() {
    isDownloading = true;
    try {
      await downloadPosts(posts, mediaMap, downloadType, defaultZipName);
      onOpenChange(false);
    } catch (error) {
      alert(
        `Download failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      isDownloading = false;
    }
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === dialogRef) {
      handleClose();
    }
  }
</script>

<dialog bind:this={dialogRef} class="modal" onclick={handleBackdropClick}>
  <div class="modal-box max-w-md">
    <div class="mb-4">
      <h3 class="font-bold text-lg">Download Options</h3>
      <p class="text-sm opacity-70 mt-2">
        Choose the format for your download. You are about to download {posts.length}
        post{posts.length !== 1 ? "s" : ""}.
      </p>
    </div>

    <div class="py-4">
      <div class="space-y-3">
        <label class="label cursor-pointer">
          <div class="flex items-center">
            <input
              type="radio"
              bind:group={downloadType}
              value="primary"
              class="radio radio-primary radio-sm mr-3"
            />
            <span class="label-text">Primary camera images only</span>
          </div>
        </label>

        <label class="label cursor-pointer">
          <div class="flex items-center">
            <input
              type="radio"
              bind:group={downloadType}
              value="secondary"
              class="radio radio-primary radio-sm mr-3"
            />
            <span class="label-text">Secondary camera images only</span>
          </div>
        </label>

        <label class="label cursor-pointer">
          <div class="flex items-center">
            <input
              type="radio"
              bind:group={downloadType}
              value="both"
              class="radio radio-primary radio-sm mr-3"
            />
            <span class="label-text">Both images as separate files</span>
          </div>
        </label>

        <label class="label cursor-pointer">
          <div class="flex items-center">
            <input
              type="radio"
              bind:group={downloadType}
              value="merged"
              class="radio radio-primary radio-sm mr-3"
            />
            <span class="label-text">Merged picture-in-picture image</span>
          </div>
        </label>
      </div>
    </div>

    <div class="modal-action">
      <button
        class="btn btn-ghost"
        onclick={handleClose}
        disabled={isDownloading}
      >
        Cancel
      </button>
      <button
        class="btn btn-primary"
        onclick={handleDownload}
        disabled={isDownloading}
      >
        {#if isDownloading}
          <Loader2 class="w-4 h-4 mr-2 animate-spin" />
          Downloading...
        {:else}
          Download
        {/if}
      </button>
    </div>
  </div>
</dialog>

<style>
  .modal {
    pointer-events: none;
  }

  .modal:target,
  .modal[open] {
    pointer-events: auto;
  }
</style>
