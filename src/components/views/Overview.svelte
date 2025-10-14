<script lang="ts">
  import {
    Users,
    GalleryHorizontal,
    SmilePlus,
    RefreshCcw,
    CheckCircle,
  } from "@lucide/svelte";
  import { format } from "date-fns";
  import type {
    BeRealData,
    MediaMap,
    Post,
    Memory,
    Realmoji,
  } from "@lib/types";

  let { data, media } = $props<{
    data: BeRealData;
    media: MediaMap;
  }>();

  const { posts = [], memories = [], friends = [], realmojis = [] } = data;
  const allPosts: (Post | Memory)[] = [...posts, ...memories];

  const postsByMonth = allPosts.reduce(
    (acc: Record<string, number>, post: Post | Memory) => {
      const takenAt = "takenAt" in post ? post.takenAt : post.takenTime;
      const month = format(new Date(takenAt || ""), "yyyy-MM");
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  interface FrequencyChartData {
    name: string;
    posts: number;
  }

  const frequencyChartData: FrequencyChartData[] = Object.entries(postsByMonth)
    .map(([month, count]) => ({
      name: format(new Date(month), "MMM yy"),
      posts: count as number,
    }))
    .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());

  const LATE_THRESHOLD_SECONDS = 5 * 60; // 5 minutes
  const latePosts = allPosts.filter((p: Post | Memory) => {
    if ("lateInSeconds" in p) {
      return (p.lateInSeconds || 0) > LATE_THRESHOLD_SECONDS;
    } else if ("isLate" in p) {
      return p.isLate;
    }
    return false;
  }).length;
  const onTimePosts = allPosts.length - latePosts;
  const onTimePercentage =
    allPosts.length > 0 ? Math.round((onTimePosts / allPosts.length) * 100) : 0;

  const totalRetakes = posts.reduce(
    (acc: number, p: Post) => acc + p.retakeCounter,
    0
  );
  const avgRetakes =
    posts.length > 0 ? (totalRetakes / posts.length).toFixed(1) : "0";

  const realmojiCounts = realmojis.reduce(
    (acc: Record<string, number>, realmoji: Realmoji) => {
      acc[realmoji.emoji] = (acc[realmoji.emoji] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  interface TopRealmoji {
    name: string;
    value: number;
  }

  const topRealmojis: TopRealmoji[] = Object.entries(realmojiCounts)
    .map(([name, value]) => ({ name, value: value as number }))
    .sort((a, b) => b.value - a.value);

  const topRealmojiWithImages = realmojis
    .filter(
      (r: Realmoji) =>
        topRealmojis.slice(0, 5).some((tr) => tr.name === r.emoji) &&
        r.media?.path
    )
    .reduce(
      (acc: Record<string, Realmoji>, r: Realmoji) => {
        if (!acc[r.emoji]) {
          acc[r.emoji] = r;
        }
        return acc;
      },
      {} as Record<string, (typeof realmojis)[0]>
    );

  const visibilityCounts = posts.reduce(
    (acc: Record<string, number>, post: Post) => {
      const key = post.visibility.includes("friends-of-friends")
        ? "Friends of Friends"
        : "Friends";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const maxFrequencyValue = Math.max(...frequencyChartData.map((d) => d.posts));
</script>

<div class="space-y-6">
  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
    <div class="stats bg-base-100 shadow">
      <div class="stat">
        <div class="stat-figure text-secondary">
          <GalleryHorizontal class="w-8 h-8" />
        </div>
        <div class="stat-title">Total Posts</div>
        <div class="stat-value">{allPosts.length}</div>
        <div class="stat-desc">Includes posts and memories</div>
      </div>
    </div>

    <div class="stats bg-base-100 shadow">
      <div class="stat">
        <div class="stat-figure text-success">
          <CheckCircle class="w-8 h-8" />
        </div>
        <div class="stat-title">On-Time Posts</div>
        <div class="stat-value text-success">{onTimePercentage}%</div>
        <div class="stat-desc">
          Posted within {LATE_THRESHOLD_SECONDS / 60} mins
        </div>
      </div>
    </div>

    <div class="stats bg-base-100 shadow">
      <div class="stat">
        <div class="stat-figure text-warning">
          <RefreshCcw class="w-8 h-8" />
        </div>
        <div class="stat-title">Avg. Retakes</div>
        <div class="stat-value">{avgRetakes}</div>
        <div class="stat-desc">For regular posts</div>
      </div>
    </div>

    <div class="stats bg-base-100 shadow">
      <div class="stat">
        <div class="stat-figure text-info">
          <Users class="w-8 h-8" />
        </div>
        <div class="stat-title">Total Friends</div>
        <div class="stat-value">{friends.length}</div>
      </div>
    </div>

    <div class="stats bg-base-100 shadow">
      <div class="stat">
        <div class="stat-figure text-accent">
          <SmilePlus class="w-8 h-8" />
        </div>
        <div class="stat-title">Top Realmoji</div>
        <div class="stat-value text-2xl">{topRealmojis[0]?.name || "N/A"}</div>
        <div class="stat-desc">{topRealmojis[0]?.value || 0} times</div>
      </div>
    </div>
  </div>

  <div class="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
    <div class="card bg-base-100 shadow-xl lg:col-span-2">
      <div class="card-body">
        <h2 class="card-title">Posting Frequency</h2>
        <p class="text-base-content/70">
          Your total number of posts and memories per month
        </p>

        <div class="w-full">
          <div class="flex items-end justify-center h-64 space-x-2 px-4">
            {#each frequencyChartData as item}
              <div class="flex flex-col items-center space-y-2">
                <div
                  class="bg-primary rounded-t-md min-w-[30px] transition-all duration-300 hover:bg-primary-focus"
                  style="height: {(item.posts / maxFrequencyValue) * 200}px"
                  title="{item.name}: {item.posts} posts"
                ></div>
                <div
                  class="text-xs text-center transform rotate-45 origin-left whitespace-nowrap"
                >
                  {item.name}
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>

    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title">On-Time vs. Late Posts</h2>
        <p class="text-base-content/70">
          Posts made within vs after the notification timeframe
        </p>

        <div class="flex items-center justify-center">
          <div class="relative w-48 h-48">
            <div
              class="absolute inset-0 rounded-full"
              style="background: conic-gradient(
                hsl(var(--su)) 0deg {onTimePercentage * 3.6}deg,
                hsl(var(--er)) {onTimePercentage * 3.6}deg 360deg
              )"
            ></div>
            <div
              class="absolute inset-4 bg-base-100 rounded-full flex items-center justify-center"
            >
              <div class="text-center">
                <div class="text-2xl font-bold">{onTimePercentage}%</div>
                <div class="text-sm">On Time</div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-center space-x-4 mt-4">
          <div class="flex items-center space-x-2">
            <div class="w-4 h-4 bg-success rounded"></div>
            <span class="text-sm">On Time ({onTimePosts})</span>
          </div>
          <div class="flex items-center space-x-2">
            <div class="w-4 h-4 bg-error rounded"></div>
            <span class="text-sm">Late ({latePosts})</span>
          </div>
        </div>
      </div>
    </div>

    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title">Post Visibility</h2>
        <p class="text-base-content/70">
          The audience you typically share your posts with
        </p>

        <div class="space-y-4">
          {#each Object.entries(visibilityCounts) as [visibility, count]}
            {@const percentage = Math.round(
              ((count as number) / posts.length) * 100
            )}
            <div>
              <div class="flex justify-between mb-1">
                <span class="text-sm font-medium">{visibility}</span>
                <span class="text-sm">{count as number} ({percentage}%)</span>
              </div>
              <div class="w-full bg-base-300 rounded-full h-2">
                <div
                  class="bg-primary h-2 rounded-full transition-all duration-300"
                  style="width: {percentage}%"
                ></div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <div class="card bg-base-100 shadow-xl lg:col-span-2">
      <div class="card-body">
        <h2 class="card-title">Top 5 Realmojis</h2>
        <p class="text-base-content/70">Your most frequently used reactions</p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div class="space-y-3">
            {#each topRealmojis.slice(0, 5) as realmoji, index}
              {@const percentage = topRealmojis[0]
                ? Math.round((realmoji.value / topRealmojis[0].value) * 100)
                : 0}
              <div class="flex items-center space-x-3">
                <span class="text-2xl w-8">{realmoji.name}</span>
                <div class="flex-1">
                  <div class="flex justify-between mb-1">
                    <span class="text-sm font-medium"
                      >{realmoji.value} uses</span
                    >
                    <span class="text-sm">{percentage}%</span>
                  </div>
                  <div class="w-full bg-base-300 rounded-full h-2">
                    <div
                      class="h-2 rounded-full transition-all duration-300"
                      class:bg-primary={index === 0}
                      class:bg-secondary={index === 1}
                      class:bg-accent={index === 2}
                      class:bg-info={index === 3}
                      class:bg-warning={index >= 4}
                      style="width: {percentage}%"
                    ></div>
                  </div>
                </div>
              </div>
            {/each}
          </div>

          {#if Object.keys(topRealmojiWithImages).length > 0}
            <div class="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
              {#each Object.values(topRealmojiWithImages) as realmoji}
                {@const r = realmoji as Realmoji}
                {#if r.media && r.media.path && media[r.media.path]}
                  <div
                    class="relative aspect-square rounded-lg overflow-hidden border border-base-300"
                  >
                    <img
                      src={media[r.media.path]}
                      alt={r.emoji}
                      class="w-full h-full object-cover"
                    />
                    <div
                      class="absolute top-1 right-1 text-2xl"
                      style="text-shadow: 0 0 5px black"
                    >
                      {r.emoji}
                    </div>
                  </div>
                {/if}
              {/each}
            </div>
          {:else}
            <div
              class="flex items-center justify-center h-32 text-base-content/50"
            >
              <div class="text-center">
                <SmilePlus class="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No realmoji images available</p>
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .rotate-45 {
    transform: rotate(45deg);
  }
</style>
