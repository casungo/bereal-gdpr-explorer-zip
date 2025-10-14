<script lang="ts">
  import InteractiveImage from "@components/ui/InteractiveImage.svelte";
  import FilterBar from "@components/ui/FilterBar.svelte";
  import DownloadDialog from "@components/ui/DownloadDialog.svelte";
  import { format, formatDistanceToNow, startOfMonth } from "date-fns";
  import { Camera, Download, RefreshCcw, Eye } from "@lucide/svelte";
  import type { Post, MediaMap } from "@lib/types";
  import type { SortOption } from "@components/ui/FilterBar.svelte";

  interface Props {
    posts: Post[];
    media: MediaMap;
  }

  let { posts, media }: Props = $props();

  let sort = $state("takenAt-desc");
  let dateRange = $state<{ from: Date; to?: Date } | undefined>(undefined);
  let visibility = $state("all");
  let downloadDialogState = $state({
    open: false,
    posts: [] as Post[],
    defaultName: "",
  });

  const sortOptions: SortOption[] = [
    { value: "takenAt-desc", label: "Newest First" },
    { value: "takenAt-asc", label: "Oldest First" },
    { value: "lateInSeconds-asc", label: "On Time First" },
    { value: "lateInSeconds-desc", label: "Latest First" },
  ];

  const filteredPosts = $derived(() => {
    let filtered = [...posts];

    if (dateRange?.from) {
      const { from, to } = dateRange;
      filtered = filtered.filter((post) => {
        const postDate = new Date(post.takenAt);
        const isAfterFrom = postDate >= from;
        const isBeforeTo = !to || postDate <= to;
        return isAfterFrom && isBeforeTo;
      });
    }

    if (visibility !== "all") {
      filtered = filtered.filter((post) => {
        if (visibility === "friends") {
          return !post.visibility.includes("friends-of-friends");
        } else if (visibility === "friends-of-friends") {
          return post.visibility.includes("friends-of-friends");
        }
        return true;
      });
    }

    filtered.sort((a, b) => {
      switch (sort) {
        case "takenAt-desc":
          return new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime();
        case "takenAt-asc":
          return new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime();
        case "lateInSeconds-asc":
          return (a.lateInSeconds || 0) - (b.lateInSeconds || 0);
        case "lateInSeconds-desc":
          return (b.lateInSeconds || 0) - (a.lateInSeconds || 0);
        default:
          return 0;
      }
    });

    return filtered;
  });

  const postsByMonth = $derived(() => {
    return filteredPosts().reduce(
      (acc, post) => {
        const monthKey = format(
          startOfMonth(new Date(post.takenAt)),
          "yyyy-MM"
        );
        if (!acc[monthKey]) {
          acc[monthKey] = [];
        }
        acc[monthKey].push(post);
        return acc;
      },
      {} as Record<string, Post[]>
    );
  });

  const allMonthKeys = $derived(() => Object.keys(postsByMonth()));
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

  function handleVisibilityChange(newVisibility: string) {
    visibility = newVisibility;
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
      posts: filteredPosts(),
      defaultName: "bereal-posts-all",
    };
  }

  function handleDownloadPost(e: MouseEvent, post: Post) {
    e.stopPropagation();
    downloadDialogState = {
      open: true,
      posts: [post],
      defaultName: `bereal-post-${format(
        new Date(post.takenAt),
        "yyyy-MM-dd"
      )}`,
    };
  }

  function handleDownloadMonth(e: MouseEvent, monthKey: string) {
    e.stopPropagation();
    downloadDialogState = {
      open: true,
      posts: postsByMonth()[monthKey],
      defaultName: `bereal-posts-${monthKey}`,
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

{#if posts.length === 0}
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title">Posts</h2>
      <p>No post data found.</p>
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
      {visibility}
      onVisibilityChange={handleVisibilityChange}
      onCollapseAll={handleCollapseAll}
      onExpandAll={handleExpandAll}
      onDownloadAll={handleDownloadAll}
      showVisibilityFilter={true}
    />

    <div class="space-y-4">
      {#each allMonthKeys() as monthKey (monthKey)}
        {@const monthPosts = postsByMonth()[monthKey]}
        <div class="card bg-base-100 shadow-xl overflow-hidden">
          <div
            class="flex items-center justify-between p-4 hover:bg-base-200 cursor-pointer"
            role="button"
            tabindex="0"
            onclick={() => toggleMonth(monthKey)}
            onkeydown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleMonth(monthKey);
              }
            }}
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
                  ({monthPosts.length} posts)
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
                {#each monthPosts as post (post.id)}
                  <div
                    class="card bg-base-100 shadow-lg overflow-hidden flex flex-col"
                  >
                    <div class="relative">
                      <InteractiveImage
                        primarySrc={post.primary?.path
                          ? media[post.primary.path]
                          : undefined}
                        secondarySrc={post.secondary?.path
                          ? media[post.secondary.path]
                          : undefined}
                        altPrimary="Primary post image"
                        altSecondary="Secondary post image"
                        aspectRatio={post.primary?.width && post.primary?.height
                          ? post.primary.width / post.primary.height
                          : 3 / 4}
                      />
                    </div>

                    <div class="card-body p-4 flex flex-col flex-1">
                      <div class="flex justify-between items-start mb-2">
                        <div>
                          <h4 class="card-title text-sm">
                            {format(new Date(post.takenAt), "MMMM d, yyyy")}
                          </h4>
                          <p class="text-xs text-base-content/70">
                            {formatDistanceToNow(new Date(post.takenAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                        <button
                          class="btn btn-ghost btn-sm btn-circle"
                          onclick={(e) => handleDownloadPost(e, post)}
                        >
                          <Download class="w-4 h-4" />
                        </button>
                      </div>

                      {#if post.caption}
                        <p class="text-sm mb-2">{post.caption}</p>
                      {/if}

                      <div class="flex justify-between items-center mt-auto">
                        <div
                          class="flex items-center gap-2 text-xs text-base-content/70"
                        >
                          <RefreshCcw class="w-4 h-4" />
                          <span
                            >{post.retakeCounter} retake{post.retakeCounter !==
                            1
                              ? "s"
                              : ""}</span
                          >
                        </div>
                        <div
                          class="flex items-center gap-2 text-xs text-base-content/70"
                        >
                          <Eye class="w-4 h-4" />
                          <span class="capitalize"
                            >{post.visibility.join(", ")}</span
                          >
                        </div>
                      </div>

                      <div class="flex justify-between items-center mt-2">
                        <div class="text-xs text-base-content/50">
                          {#if (post.lateInSeconds || 0) > 300}
                            <span class="badge badge-warning badge-xs">
                              Late ({Math.round(
                                (post.lateInSeconds || 0) / 60
                              )}m)
                            </span>
                          {:else}
                            <span class="badge badge-success badge-xs"
                              >On time</span
                            >
                          {/if}
                        </div>

                        {#if post.isMemory}
                          <span class="badge badge-secondary badge-xs"
                            >Memory</span
                          >
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

    {#if filteredPosts().length === 0}
      <div class="text-center py-12">
        <div class="text-base-content/50">
          <Camera class="w-16 h-16 mx-auto mb-4" />
          <p>No posts match your current filters</p>
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
