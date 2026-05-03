<script lang="ts">
  import {
    Archive,
    Check,
    Info,
    Loader2,
    SlidersHorizontal,
    X,
  } from "@lucide/svelte";
  import type { Post, Memory, MediaMap } from "@/lib/types";
  import { downloadableVideoCount, downloadPosts } from "@/lib/download";
  import type { DownloadSelection } from "@/lib/download";

  type DownloadPreset = "complete" | "custom";
  type SelectionKey = keyof DownloadSelection;

  interface Props {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    posts: (Post | Memory)[];
    mediaMap: MediaMap;
    defaultZipName: string;
  }

  let { isOpen, onOpenChange, posts, mediaMap, defaultZipName }: Props =
    $props();

  let preset: DownloadPreset = $state("complete");
  let customSelection = $state<DownloadSelection>({
    primary: false,
    secondary: false,
    merged: false,
    video: false,
  });
  let isDownloading = $state(false);
  let downloadStarted = $state(false);
  let validationError = $state("");
  let dialogRef: HTMLDialogElement;

  const videoCount = $derived(downloadableVideoCount(posts, mediaMap));
  const hasVideoDownloads = $derived(videoCount > 0);
  const completeSelection = $derived<DownloadSelection>({
    primary: true,
    secondary: true,
    merged: true,
    video: true,
  });
  const activeSelection = $derived(
    preset === "complete" ? completeSelection : customSelection,
  );
  const canDownload = $derived(hasSelectedMedia(activeSelection));

  $effect(() => {
    if (!dialogRef) return;

    if (isOpen) {
      isDownloading = false;
      downloadStarted = false;
      validationError = "";
      dialogRef.showModal();
    } else {
      dialogRef.close();
    }
  });

  function handleClose() {
    onOpenChange(false);
  }

  function hasSelectedMedia(selection: DownloadSelection): boolean {
    return (
      selection.primary ||
      selection.secondary ||
      selection.merged ||
      selection.video
    );
  }

  function selectComplete() {
    preset = "complete";
    validationError = "";
  }

  function selectCustom() {
    preset = "custom";
  }

  function updateCustomSelection(key: SelectionKey, checked: boolean) {
    preset = "custom";
    customSelection = {
      ...customSelection,
      [key]: checked,
    };

    if (hasSelectedMedia({ ...customSelection, [key]: checked })) {
      validationError = "";
    }
  }

  async function handleDownload() {
    if (!canDownload) {
      validationError = "Choose at least one export item.";
      return;
    }

    if (
      activeSelection.video &&
      !hasVideoDownloads &&
      !activeSelection.primary &&
      !activeSelection.secondary &&
      !activeSelection.merged
    ) {
      validationError = "No videos are available for this selection.";
      return;
    }

    isDownloading = true;
    validationError = "";
    try {
      await downloadPosts(posts, mediaMap, activeSelection, defaultZipName);
      downloadStarted = true;
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
    if (e.target === dialogRef && !isDownloading) {
      handleClose();
    }
  }
</script>

<dialog bind:this={dialogRef} class="modal" onclick={handleBackdropClick}>
  <div class="modal-box max-w-[430px] rounded-xl p-6 shadow-2xl">
    {#if downloadStarted}
      <div class="flex items-start justify-between gap-4">
        <h3 class="text-xl font-bold">Download</h3>
        <button class="btn btn-ghost btn-sm btn-circle" onclick={handleClose}>
          <X class="h-4 w-4" />
        </button>
      </div>

      <div
        class="flex min-h-72 flex-col items-center justify-center text-center"
      >
        <div
          class="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-success/15 text-success"
        >
          <Check class="h-10 w-10" />
        </div>
        <h4 class="text-xl font-bold">Download started</h4>
        <p class="mt-2 max-w-64 text-sm opacity-70">
          Your export is being prepared by the browser.
        </p>
      </div>

      <div class="modal-action">
        <button class="btn btn-primary min-w-28" onclick={handleClose}>
          Done
        </button>
      </div>
    {:else}
      <div class="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 class="text-xl font-bold">Download</h3>
          <p class="mt-1 text-sm opacity-70">
            {posts.length}
            post{posts.length !== 1 ? "s" : ""} selected ·
            <span class:text-primary={hasVideoDownloads}>
              {videoCount}
              video{videoCount !== 1 ? "s" : ""} available
            </span>
          </p>
        </div>
        <button
          class="btn btn-ghost btn-sm btn-circle"
          disabled={isDownloading}
          onclick={handleClose}
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <div class="space-y-3">
        <button
          class="w-full rounded-lg border p-4 text-left transition-all {preset ===
          'complete'
            ? 'border-primary bg-primary/10 shadow-sm'
            : 'border-base-300 bg-base-100 opacity-50 saturate-50 hover:opacity-85 hover:saturate-100'}"
          disabled={isDownloading}
          onclick={selectComplete}
        >
          <div class="flex items-start gap-3">
            <input
              type="radio"
              checked={preset === "complete"}
              class="radio radio-primary radio-sm mt-1"
              aria-label="Complete archive"
              readonly
            />
            <Archive class="mt-0.5 h-6 w-6 text-primary" />
            <div>
              <div class="font-semibold">Complete archive</div>
              <p class="text-xs leading-relaxed opacity-70">
                Primary, secondary, merged JPEG, metadata, and videos when
                available.
              </p>
            </div>
          </div>
        </button>

        <section
          class="rounded-lg border p-4 transition-all {preset === 'custom'
            ? 'border-primary bg-primary/10 shadow-sm'
            : 'border-base-300 bg-base-100 opacity-50 saturate-50'}"
        >
          <button
            class="mb-4 flex w-full items-start gap-3 text-left"
            disabled={isDownloading}
            onclick={selectCustom}
          >
            <input
              type="radio"
              checked={preset === "custom"}
              class="radio radio-primary radio-sm mt-1"
              aria-label="Custom export"
              readonly
            />
            <SlidersHorizontal class="mt-0.5 h-6 w-6" />
            <div>
              <div class="font-semibold">Custom export</div>
              <p class="text-xs leading-relaxed opacity-70">
                Choose exactly what goes in the ZIP.
              </p>
            </div>
          </button>

          <div class="grid grid-cols-2 gap-x-8 gap-y-3">
            <label class="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                class="checkbox checkbox-primary checkbox-sm"
                checked={customSelection.primary}
                disabled={isDownloading}
                onchange={(e) =>
                  updateCustomSelection("primary", e.currentTarget.checked)}
              />
              Primary
            </label>
            <label class="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                class="checkbox checkbox-primary checkbox-sm"
                checked={customSelection.secondary}
                disabled={isDownloading}
                onchange={(e) =>
                  updateCustomSelection("secondary", e.currentTarget.checked)}
              />
              Secondary
            </label>
            <label class="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                class="checkbox checkbox-primary checkbox-sm"
                checked={customSelection.merged}
                disabled={isDownloading}
                onchange={(e) =>
                  updateCustomSelection("merged", e.currentTarget.checked)}
              />
              Merged JPEG
            </label>
            <label
              class="flex items-center gap-2 text-sm {hasVideoDownloads
                ? 'cursor-pointer'
                : 'cursor-not-allowed opacity-50'}"
            >
              <input
                type="checkbox"
                class="checkbox checkbox-primary checkbox-sm"
                checked={customSelection.video && hasVideoDownloads}
                disabled={isDownloading || !hasVideoDownloads}
                onchange={(e) =>
                  updateCustomSelection("video", e.currentTarget.checked)}
              />
              BTS video
              {#if !hasVideoDownloads}
                <Info class="h-3.5 w-3.5 opacity-60" />
              {/if}
            </label>
          </div>

          {#if !hasVideoDownloads}
            <p class="mt-3 pl-7 text-xs opacity-60">No videos available.</p>
          {/if}

          {#if validationError}
            <p class="mt-4 flex items-center gap-2 text-xs text-error">
              <Info class="h-3.5 w-3.5" />
              {validationError}
            </p>
          {/if}
        </section>
      </div>

      <div class="modal-action mt-7">
        <button
          class="btn btn-ghost"
          disabled={isDownloading}
          onclick={handleClose}
        >
          Cancel
        </button>
        <button
          class="btn btn-primary min-w-32"
          disabled={isDownloading || !canDownload}
          onclick={handleDownload}
        >
          {#if isDownloading}
            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
            Preparing ZIP...
          {:else}
            Download
          {/if}
        </button>
      </div>
    {/if}
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
