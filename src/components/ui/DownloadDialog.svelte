<script lang="ts">
  import { Loader2 } from "@lucide/svelte";
  import type { Post, Memory, MediaMap } from "@/lib/types";
  import { downloadableVideoCount, downloadPosts } from "@/lib/download";
  import type { DownloadType } from "@/lib/download";

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
  const videoCount = $derived(downloadableVideoCount(posts, mediaMap));
  const hasVideoDownloads = $derived(videoCount > 0);

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
    if (downloadType === "video" && !hasVideoDownloads) {
      alert("No videos are available for this selection.");
      return;
    }

    isDownloading = true;
    try {
      await downloadPosts(posts, mediaMap, downloadType, defaultZipName);
      onOpenChange(false);
    } catch (error) {
      alert(
        `Download failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
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
        Choose the format for your download. Separate camera exports keep
        BeReal's original media format. Merged picture-in-picture images are
        exported as JPEG. ZIP downloads include timestamps plus embedded or
        fallback sidecar metadata when BeReal provided them. Video downloads
        export BeReal's behind-the-scenes clip when available. You are about to
        download
        {posts.length}
        post{posts.length !== 1 ? "s" : ""}.
      </p>
    </div>

    <div class="py-4">
      <div class="space-y-3">
        <label class="label cursor-pointer items-start justify-start">
          <input
            type="radio"
            bind:group={downloadType}
            value="primary"
            class="radio radio-primary radio-sm mr-3 mt-1"
          />
          <div>
            <span class="label-text">Primary camera images only</span>
            <p class="text-xs opacity-60">Downloads one original image file.</p>
          </div>
        </label>

        <label class="label cursor-pointer items-start justify-start">
          <input
            type="radio"
            bind:group={downloadType}
            value="secondary"
            class="radio radio-primary radio-sm mr-3 mt-1"
          />
          <div>
            <span class="label-text">Secondary camera images only</span>
            <p class="text-xs opacity-60">Downloads the selfie image file.</p>
          </div>
        </label>

        <label class="label cursor-pointer items-start justify-start">
          <input
            type="radio"
            bind:group={downloadType}
            value="both"
            class="radio radio-primary radio-sm mr-3 mt-1"
          />
          <div>
            <span class="label-text">Both images as original-format files</span>
            <p class="text-xs opacity-60">
              ZIP downloads contain primary and secondary images.
            </p>
          </div>
        </label>

        <label class="label cursor-pointer items-start justify-start">
          <input
            type="radio"
            bind:group={downloadType}
            value="merged"
            class="radio radio-primary radio-sm mr-3 mt-1"
          />
          <div>
            <span class="label-text">Merged picture-in-picture JPEG image</span>
            <p class="text-xs opacity-60">
              Generates a new JPEG from both photos.
            </p>
          </div>
        </label>

        <label
          class="label items-start justify-start {hasVideoDownloads
            ? 'cursor-pointer'
            : 'cursor-not-allowed opacity-60'}"
        >
          <input
            type="radio"
            bind:group={downloadType}
            value="video"
            class="radio radio-primary radio-sm mr-3 mt-1"
            disabled={!hasVideoDownloads}
          />
          <div>
            <span class="label-text">Behind-the-scenes video file</span>
            <p class="text-xs opacity-60">
              {#if hasVideoDownloads}
                Available for {videoCount} of {posts.length} selected post{posts.length !==
                1
                  ? "s"
                  : ""}.
              {:else}
                No videos in this selection.
              {/if}
            </p>
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
