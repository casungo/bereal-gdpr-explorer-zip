<script lang="ts">
  import { Images, Video } from "@lucide/svelte";
  import InteractiveImage from "@/components/ui/InteractiveImage.svelte";

  type MediaMode = "photos" | "videos";

  interface Props {
    primarySrc?: string;
    secondarySrc?: string;
    videoSrc?: string | null;
    altPrimary: string;
    altSecondary: string;
    imageAspectRatio: number;
    videoAspectRatio?: number;
  }

  let {
    primarySrc = undefined,
    secondarySrc = undefined,
    videoSrc = null,
    altPrimary,
    altSecondary,
    imageAspectRatio,
    videoAspectRatio = 16 / 9,
  }: Props = $props();

  let mediaMode = $state<MediaMode>("photos");

  function setMediaMode(e: MouseEvent, mode: MediaMode) {
    e.stopPropagation();
    mediaMode = mode;
  }
</script>

<div class="relative">
  {#if mediaMode === "videos" && videoSrc}
    <div
      class="relative w-full bg-black"
      style="aspect-ratio: {videoAspectRatio};"
    >
      <video
        src={videoSrc}
        controls
        preload="metadata"
        class="w-full h-full object-contain"
        poster={primarySrc}
      >
        <track kind="captions" src="" srclang="en" label="English captions" />
      </video>
    </div>
  {:else}
    <InteractiveImage
      {primarySrc}
      {secondarySrc}
      {altPrimary}
      {altSecondary}
      aspectRatio={imageAspectRatio}
    />
  {/if}
</div>

{#if videoSrc}
  <div class="px-4 pt-3">
    <div
      class="inline-flex h-8 items-center rounded-md border border-base-300 bg-base-200 p-0.5"
      role="group"
      aria-label="Media view"
    >
      <button
        class="flex h-7 items-center gap-1.5 rounded px-2.5 text-xs font-medium transition-colors {mediaMode ===
        'photos'
          ? 'bg-base-100 text-base-content shadow-sm'
          : 'text-base-content/70 hover:text-base-content'}"
        aria-pressed={mediaMode === "photos"}
        onclick={(e) => setMediaMode(e, "photos")}
      >
        <Images class="h-3.5 w-3.5" />
        Photos
      </button>
      <button
        class="flex h-7 items-center gap-1.5 rounded px-2.5 text-xs font-medium transition-colors {mediaMode ===
        'videos'
          ? 'bg-base-100 text-base-content shadow-sm'
          : 'text-base-content/70 hover:text-base-content'}"
        aria-pressed={mediaMode === "videos"}
        onclick={(e) => setMediaMode(e, "videos")}
      >
        <Video class="h-3.5 w-3.5" />
        Videos
      </button>
    </div>
  </div>
{/if}
