<script lang="ts">
  import InteractiveImage from "@components/ui/InteractiveImage.svelte";
  import FilterBar from "@components/ui/FilterBar.svelte";
  import DownloadDialog from "@components/ui/DownloadDialog.svelte";
  import { format, formatDistanceToNow, startOfMonth } from "date-fns";
  import { Video, Clock, Download } from "@lucide/svelte";
  import type { Memory, MediaMap } from "@lib/types";
  import type { SortOption } from "@components/ui/FilterBar.svelte";

  interface Props {
    memories: Memory[];
    media: MediaMap;
  }

  let { memories, media }: Props = $props();

  let sort = $state("takenAt-desc");
  let dateRange = $state<{ from: Date; to?: Date } | undefined>(undefined);
  let downloadDialogState = $state({
    open: false,
    posts: [] as Memory[],
    defaultName: "",
  });

  const sortOptions: SortOption[] = [
    { value: "takenAt-desc", label: "Date: Newest First" },
    { value: "takenAt-asc", label: "Date: Oldest First" },
  ];

  const filteredMemories = $derived(() => {
    let filtered = [...memories];

    if (dateRange?.from) {
      const { from, to } = dateRange;
      filtered = filtered.filter((memory) => {
        const memoryDate = new Date(memory.takenTime);
        const isAfterFrom = memoryDate >= from;
        const isBeforeTo = !to || memoryDate <= to;
        return isAfterFrom && isBeforeTo;
      });
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.takenTime).getTime();
      const dateB = new Date(b.takenTime).getTime();
      switch (sort) {
        case "takenAt-asc":
          return dateA - dateB;
        case "takenAt-desc":
        default:
          return dateB - dateA;
      }
    });

    return filtered;
  });

  const memoriesByMonth = $derived(() => {
    return filteredMemories().reduce(
      (acc, memory) => {
        const monthKey = format(
          startOfMonth(new Date(memory.takenTime)),
          "yyyy-MM"
        );
        if (!acc[monthKey]) {
          acc[monthKey] = [];
        }
        acc[monthKey].push(memory);
        return acc;
      },
      {} as Record<string, Memory[]>
    );
  });

  const allMonthKeys = $derived(() => Object.keys(memoriesByMonth()));
  let openMonths = $state<string[]>([]);

  $effect(() => {
    if (openMonths.length === 0) {
      openMonths = allMonthKeys();
    }
  });

  function handleSortChange(newSort: string) {
    sort = newSort;
  }

  function handleDateRangeChange(range?: { from: Date; to?: Date }) {
    dateRange = range;
  }

  function handleCollapseAll() {
    openMonths = [];
  }

  function handleExpandAll() {
    openMonths = allMonthKeys();
  }

  function handleDownloadAll() {
    downloadDialogState = {
      open: true,
      posts: filteredMemories(),
      defaultName: "bereal-memories-all",
    };
  }

  function handleDownloadMemory(e: MouseEvent, memory: Memory) {
    e.stopPropagation();
    downloadDialogState = {
      open: true,
      posts: [memory],
      defaultName: `bereal-memory-${format(
        new Date(memory.takenTime),
        "yyyy-MM-dd"
      )}`,
    };
  }

  function handleDownloadMonth(e: MouseEvent, monthKey: string) {
    e.stopPropagation();
    downloadDialogState = {
      open: true,
      posts: memoriesByMonth()[monthKey],
      defaultName: `bereal-memories-${monthKey}`,
    };
  }

  function toggleMonth(monthKey: string) {
    if (openMonths.includes(monthKey)) {
      openMonths = openMonths.filter((key) => key !== monthKey);
    } else {
      openMonths = [...openMonths, monthKey];
    }
  }
</script>

{#if memories.length === 0}
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title">Memories</h2>
      <p>No memory data found.</p>
    </div>
  </div>
{:else}
  <div class="space-y-4">
    <FilterBar
      {sortOptions}
      {sort}
      onSortChange={handleSortChange}
      {dateRange}
      onDateRangeChange={handleDateRangeChange}
      onCollapseAll={handleCollapseAll}
      onExpandAll={handleExpandAll}
      onDownloadAll={handleDownloadAll}
      showVisibilityFilter={false}
    />

    <div class="space-y-4">
      {#each allMonthKeys() as monthKey (monthKey)}
        {@const monthMemories = memoriesByMonth()[monthKey]}
        <div class="card bg-base-100 shadow-xl overflow-hidden">
          <div
            class="flex items-center justify-between p-4 hover:bg-base-200 cursor-pointer"
            role="button"
            tabindex="0"
            onclick={() => toggleMonth(monthKey)}
            onkeydown={(e) => e.key === "Enter" && toggleMonth(monthKey)}
          >
            <div class="flex items-center gap-2">
              <div
                class="collapse-arrow {openMonths.includes(monthKey)
                  ? 'rotate-180'
                  : ''} transition-transform"
              ></div>
              <h3 class="text-lg font-semibold">
                {format(new Date(monthKey), "MMMM yyyy")}
                <span class="ml-2 text-sm font-normal text-base-content/70">
                  ({monthMemories.length} memories)
                </span>
              </h3>
            </div>
            <button
              class="btn btn-ghost btn-sm"
              onclick={(e) => handleDownloadMonth(e, monthKey)}
            >
              <Download class="w-4 h-4 mr-2" />
              Download Month
            </button>
          </div>

          {#if openMonths.includes(monthKey)}
            <div class="p-4 pt-0">
              <div
                class="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              >
                {#each monthMemories as memory (memory.id)}
                  {@const primaryUrl = media[memory.frontImage.path]}
                  {@const secondaryUrl = media[memory.backImage.path]}
                  {@const videoUrl = memory.btsMedia
                    ? media[memory.btsMedia.path]
                    : null}
                  {@const imageAspectRatio =
                    memory.frontImage.width / memory.frontImage.height}
                  {@const videoAspectRatio = memory.btsMedia
                    ? memory.btsMedia.width / memory.btsMedia.height
                    : 16 / 9}

                  <div
                    class="card bg-base-100 shadow-lg overflow-hidden flex flex-col"
                  >
                    <div class="relative">
                      {#if videoUrl && memory.btsMedia}
                        <div
                          class="relative w-full bg-black"
                          style="aspect-ratio: {videoAspectRatio};"
                        >
                          <video
                            src={videoUrl}
                            controls
                            class="w-full h-full object-contain"
                            poster={primaryUrl}
                          >
                            <track
                              kind="captions"
                              src=""
                              srclang="en"
                              label="English captions"
                            />
                          </video>
                        </div>
                      {:else}
                        <InteractiveImage
                          primarySrc={primaryUrl}
                          secondarySrc={secondaryUrl}
                          altPrimary="Primary memory"
                          altSecondary="Secondary memory"
                          aspectRatio={imageAspectRatio}
                        />
                      {/if}
                    </div>

                    <div class="card-body p-4 flex flex-col flex-1">
                      <div class="flex justify-between items-start mb-2">
                        <div>
                          <h4 class="card-title text-sm">
                            {format(new Date(memory.takenTime), "MMMM d, yyyy")}
                          </h4>
                          <p class="text-xs text-base-content/70">
                            {formatDistanceToNow(new Date(memory.takenTime), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                        <button
                          class="btn btn-ghost btn-sm btn-circle"
                          onclick={(e) => handleDownloadMemory(e, memory)}
                        >
                          <Download class="w-4 h-4" />
                        </button>
                      </div>

                      {#if memory.caption}
                        <p class="text-sm mb-2">{memory.caption}</p>
                      {/if}

                      <div class="flex justify-between items-center mt-auto">
                        <div
                          class="flex items-center gap-2 text-xs text-base-content/70"
                        >
                          <Clock class="w-4 h-4" />
                          <span>{memory.isLate ? "Late" : "On time"}</span>
                        </div>

                        {#if videoUrl}
                          <span class="badge badge-secondary badge-xs">
                            <Video class="w-4 h-4 mr-1" />
                            Video
                          </span>
                        {/if}
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>

    {#if filteredMemories().length === 0}
      <div class="text-center py-12">
        <div class="text-base-content/50">
          <Clock class="w-16 h-16 mx-auto mb-4" />
          <p>No memories match your current filters</p>
        </div>
      </div>
    {/if}
  </div>
{/if}

<DownloadDialog
  isOpen={downloadDialogState.open}
  onOpenChange={(open) => (downloadDialogState.open = open)}
  posts={downloadDialogState.posts}
  mediaMap={media}
  defaultZipName={downloadDialogState.defaultName}
/>
