<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { Camera, Maximize2, Repeat2, X } from "@lucide/svelte";

  type Position = "top-left" | "top-right" | "bottom-left" | "bottom-right";

  interface Props {
    primarySrc?: string;
    secondarySrc?: string;
    altPrimary: string;
    altSecondary: string;
    aspectRatio: number;
  }

  let {
    primarySrc = undefined,
    secondarySrc = undefined,
    altPrimary,
    altSecondary,
    aspectRatio,
  }: Props = $props();

  let isPrimaryMain = $state(true);
  let position: Position = $state("top-left");
  let isDragging = $state(false);
  let isFullscreen = $state(false);
  let containerRef: HTMLDivElement;

  const mainSrc = $derived(isPrimaryMain ? primarySrc : secondarySrc);
  const secondarySrcToDisplay = $derived(
    isPrimaryMain ? secondarySrc : primarySrc,
  );

  function handleSwap(e: MouseEvent | KeyboardEvent) {
    if ("key" in e && e.key !== "Enter" && e.key !== " ") return;

    if (primarySrc && secondarySrc) {
      e.preventDefault();
      e.stopPropagation();
      isPrimaryMain = !isPrimaryMain;
    }
  }

  function openFullscreen(e: MouseEvent) {
    e.stopPropagation();
    isFullscreen = true;
  }

  function closeFullscreen() {
    isFullscreen = false;
  }

  function closeFullscreenFromBackdrop(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      closeFullscreen();
    }
  }

  function getCoordinates(e: { clientX: number; clientY: number }) {
    return { x: e.clientX, y: e.clientY };
  }

  function handleDragStart(e: MouseEvent | TouchEvent) {
    e.preventDefault();
    e.stopPropagation();
    isDragging = true;
  }

  function handleDragEnd(e: MouseEvent | TouchEvent) {
    if (!isDragging) return;
    isDragging = false;

    if (!containerRef) return;

    const coords =
      "changedTouches" in e && e.changedTouches?.length
        ? getCoordinates(e.changedTouches[0])
        : getCoordinates(e as MouseEvent);

    const { left, top, width, height } = containerRef.getBoundingClientRect();
    const relativeX = coords.x - left;
    const relativeY = coords.y - top;

    const isLeft = relativeX < width / 2;
    const isTop = relativeY < height / 2;

    if (isTop && isLeft) position = "top-left";
    else if (isTop && !isLeft) position = "top-right";
    else if (!isTop && isLeft) position = "bottom-left";
    else position = "bottom-right";
  }

  function handleMouseUpGlobal(e: MouseEvent) {
    if (isDragging) {
      handleDragEnd(e);
    }
  }

  function handleTouchEndGlobal(e: TouchEvent) {
    if (isDragging) {
      handleDragEnd(e);
    }
  }

  onMount(() => {
    window.addEventListener("mouseup", handleMouseUpGlobal);
    window.addEventListener("touchend", handleTouchEndGlobal);
  });

  onDestroy(() => {
    window.removeEventListener("mouseup", handleMouseUpGlobal);
    window.removeEventListener("touchend", handleTouchEndGlobal);
  });

  function getPositionClasses(pos: Position) {
    switch (pos) {
      case "top-left":
        return "top-4 left-4";
      case "top-right":
        return "top-4 right-4";
      case "bottom-left":
        return "bottom-4 left-4";
      case "bottom-right":
        return "bottom-4 right-4";
      default:
        return "top-4 left-4";
    }
  }
</script>

<div
  bind:this={containerRef}
  class="relative w-full select-none"
  style="aspect-ratio: {aspectRatio || 1};"
>
  {#if mainSrc}
    <img
      src={mainSrc}
      alt={isPrimaryMain ? altPrimary : altSecondary}
      class="absolute inset-0 w-full h-full object-contain"
      loading="lazy"
      decoding="async"
      draggable="false"
    />
  {:else}
    <div class="bg-base-300 w-full h-full flex items-center justify-center">
      <Camera class="w-12 h-12 text-base-content/50" />
    </div>
  {/if}

  {#if secondarySrcToDisplay}
    <div
      class="absolute w-1/3 aspect-[3/4] border-2 border-black rounded-lg overflow-hidden transition-all duration-200 ease-in-out cursor-pointer {getPositionClasses(
        position,
      )} {isDragging ? 'scale-110 shadow-2xl z-10' : ''}"
      onmousedown={handleDragStart}
      ontouchstart={handleDragStart}
      onclick={handleSwap}
      role="button"
      tabindex="0"
      onkeydown={handleSwap}
    >
      <img
        src={secondarySrcToDisplay}
        alt={isPrimaryMain ? altSecondary : altPrimary}
        class="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
        decoding="async"
        draggable="false"
      />
    </div>
  {/if}

  <div class="absolute bottom-3 right-3 flex gap-2">
    {#if primarySrc && secondarySrc}
      <button
        class="btn btn-circle btn-sm bg-base-100/90"
        aria-label="Swap cameras"
        onclick={handleSwap}
      >
        <Repeat2 class="w-4 h-4" />
      </button>
    {/if}
    {#if mainSrc}
      <button
        class="btn btn-circle btn-sm bg-base-100/90"
        aria-label="Open media"
        onclick={openFullscreen}
      >
        <Maximize2 class="w-4 h-4" />
      </button>
    {/if}
  </div>
</div>

{#if isFullscreen}
  <div
    class="fixed inset-0 z-[100] bg-black/95 p-3 sm:p-6"
    role="dialog"
    aria-modal="true"
    onclick={closeFullscreenFromBackdrop}
    onkeydown={(e) => e.key === "Escape" && closeFullscreen()}
    tabindex="-1"
  >
    <button
      class="btn btn-circle btn-sm absolute right-4 top-4 z-10"
      aria-label="Close media"
      onclick={closeFullscreen}
    >
      <X class="w-4 h-4" />
    </button>
    <div class="h-full w-full flex items-center justify-center">
      {#if mainSrc}
        <img
          src={mainSrc}
          alt={isPrimaryMain ? altPrimary : altSecondary}
          class="max-h-full max-w-full object-contain"
        />
      {/if}
    </div>
  </div>
{/if}

<style>
  .select-none {
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
  }

  [role="button"]:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  @media (max-width: 768px) {
    .aspect-\[3\/4\] {
      aspect-ratio: 3/4;
    }

    :global(.btn-circle.btn-sm) {
      min-height: 2.25rem;
      width: 2.25rem;
    }
  }
</style>
