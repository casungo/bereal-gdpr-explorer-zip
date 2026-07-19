<script lang="ts">
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
  let dragPosition = $state({ x: 0, y: 0 });
  let dragOffset = { x: 0, y: 0 };
  let dragOrigin = { x: 0, y: 0 };
  let didDrag = false;
  let isFullscreen = $state(false);
  let containerRef: HTMLDivElement;
  let secondaryRef: HTMLDivElement;

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

  function handleDragStart(e: PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    const previewRect = secondaryRef.getBoundingClientRect();
    const containerRect = containerRef.getBoundingClientRect();

    dragOffset = {
      x: e.clientX - previewRect.left,
      y: e.clientY - previewRect.top,
    };
    dragOrigin = { x: e.clientX, y: e.clientY };
    dragPosition = {
      x: previewRect.left - containerRect.left,
      y: previewRect.top - containerRect.top,
    };
    didDrag = false;
    isDragging = true;
    secondaryRef.setPointerCapture(e.pointerId);
  }

  function handleDragMove(e: PointerEvent) {
    if (!isDragging) return;
    const containerRect = containerRef.getBoundingClientRect();
    const previewRect = secondaryRef.getBoundingClientRect();

    dragPosition = {
      x: Math.max(
        0,
        Math.min(
          e.clientX - containerRect.left - dragOffset.x,
          containerRect.width - previewRect.width,
        ),
      ),
      y: Math.max(
        0,
        Math.min(
          e.clientY - containerRect.top - dragOffset.y,
          containerRect.height - previewRect.height,
        ),
      ),
    };
    didDrag ||=
      Math.hypot(e.clientX - dragOrigin.x, e.clientY - dragOrigin.y) > 4;
  }

  function handleDragEnd(e: PointerEvent) {
    if (!isDragging) return;
    const { width, height } = containerRef.getBoundingClientRect();
    const previewRect = secondaryRef.getBoundingClientRect();
    const relativeX = dragPosition.x + previewRect.width / 2;
    const relativeY = dragPosition.y + previewRect.height / 2;

    const isLeft = relativeX < width / 2;
    const isTop = relativeY < height / 2;

    if (isTop && isLeft) position = "top-left";
    else if (isTop && !isLeft) position = "top-right";
    else if (!isTop && isLeft) position = "bottom-left";
    else position = "bottom-right";
    isDragging = false;
    if (secondaryRef.hasPointerCapture(e.pointerId)) {
      secondaryRef.releasePointerCapture(e.pointerId);
    }
  }

  function handlePreviewClick(e: MouseEvent) {
    if (didDrag) {
      e.preventDefault();
      e.stopPropagation();
      didDrag = false;
      return;
    }
    handleSwap(e);
  }

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
      bind:this={secondaryRef}
      class="camera-preview absolute w-1/3 aspect-[3/4] border-2 border-black rounded-lg overflow-hidden cursor-grab {isDragging
        ? 'is-dragging shadow-2xl z-10'
        : `transition-all duration-200 ease-out ${getPositionClasses(position)}`}"
      style={isDragging
        ? `left: ${dragPosition.x}px; top: ${dragPosition.y}px;`
        : undefined}
      onpointerdown={handleDragStart}
      onpointermove={handleDragMove}
      onpointerup={handleDragEnd}
      onpointercancel={handleDragEnd}
      onclick={handlePreviewClick}
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

  .camera-preview {
    touch-action: none;
  }

  .camera-preview.is-dragging {
    cursor: grabbing;
    scale: 1.06;
  }

  @media (prefers-reduced-motion: reduce) {
    .camera-preview {
      transition-duration: 0ms;
    }
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
