<script lang="ts">
  import {
    Bell,
    Clock,
    FileCheck2,
    GalleryHorizontal,
    LayoutGrid,
    LineChart,
    LogOut,
    MessageCircle,
    MessagesSquare,
    SmilePlus,
    User as UserIcon,
    Users,
    Menu,
  } from "@lucide/svelte";
  import ThemeToggle from "@components/ui/ThemeToggle.svelte";

  import Overview from "@components/views/Overview.svelte";
  import UserInfo from "@components/views/UserInfo.svelte";
  import Friends from "@components/views/Friends.svelte";
  import Posts from "@components/views/Posts.svelte";
  import Memories from "@components/views/Memories.svelte";
  import Comments from "@components/views/Comments.svelte";
  import Realmojis from "@components/views/Realmojis.svelte";
  import Settings from "@components/views/Settings.svelte";
  import Terms from "@components/views/Terms.svelte";
  import Conversations from "@components/views/Conversations.svelte";
  import Analytics from "@components/views/Analytics.svelte";
  import type { BeRealData, MediaMap } from "@lib/types";

  let { data, media, resetData } = $props<{
    data: BeRealData;
    media: MediaMap;
    resetData: () => void;
  }>();

  type Tab =
    | "overview"
    | "user"
    | "friends"
    | "posts"
    | "memories"
    | "comments"
    | "realmojis"
    | "conversations"
    | "analytics"
    | "settings"
    | "terms";

  const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: LayoutGrid },
    { id: "user", label: "User Info", icon: UserIcon },
    { id: "friends", label: "Friends & Requests", icon: Users },
    { id: "posts", label: "Posts", icon: GalleryHorizontal },
    { id: "memories", label: "Memories", icon: Clock },
    { id: "comments", label: "Comments", icon: MessageCircle },
    { id: "realmojis", label: "Realmojis", icon: SmilePlus },
    { id: "conversations", label: "Conversations", icon: MessagesSquare },
    { id: "analytics", label: "Analytics Events", icon: LineChart },
    { id: "settings", label: "Push Notifications", icon: Bell },
    { id: "terms", label: "Terms & Consents", icon: FileCheck2 },
  ];

  let activeTab: Tab = $state("overview");
  let sidebarOpen: boolean = $state(false);

  const overviewTab = TABS.find((t) => t.id === "overview")!;
  const mainTabs = TABS.filter((t) => t.id !== "overview");

  function setActiveTab(tab: Tab) {
    activeTab = tab;
    sidebarOpen = false;
  }
</script>

<div class="drawer lg:drawer-open">
  <input
    id="drawer-toggle"
    type="checkbox"
    class="drawer-toggle"
    bind:checked={sidebarOpen}
  />

  <div class="drawer-content flex flex-col">
    <header class="navbar bg-base-100 w-full border-b lg:hidden">
      <div class="flex-none">
        <label for="drawer-toggle" class="btn btn-square btn-ghost">
          <Menu class="w-6 h-6" />
        </label>
      </div>
      <div class="flex-1">
        <h1 class="text-xl font-semibold">
          {TABS.find((t) => t.id === activeTab)?.label}
        </h1>
      </div>
    </header>

    <header class="hidden lg:flex items-center h-14 px-6 border-b bg-base-100">
      <h2 class="text-xl font-semibold">
        {TABS.find((t) => t.id === activeTab)?.label}
      </h2>
    </header>

    <main class="flex-1 p-4 md:p-6 bg-base-50">
      {#if !data || !media}
        <div class="flex items-center justify-center h-full">
          <div class="text-center">
            <div class="loading loading-spinner loading-lg"></div>
            <p class="mt-4">No data available</p>
          </div>
        </div>
      {:else if activeTab === "overview"}
        <Overview {data} {media} />
      {:else if activeTab === "user"}
        <UserInfo user={data.user} {media} />
      {:else if activeTab === "friends"}
        <Friends friends={data.friends} requests={data.friendRequests} />
      {:else if activeTab === "posts"}
        {#if data.posts}
          <Posts posts={data.posts} {media} />
        {:else}
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <h2 class="card-title">Posts</h2>
              <p>No posts data found in data object.</p>
              <p>Available data keys: {Object.keys(data).join(", ")}</p>
            </div>
          </div>
        {/if}
      {:else if activeTab === "memories"}
        <Memories memories={data.memories} {media} />
      {:else if activeTab === "comments"}
        <Comments comments={data.comments} user={data.user} {media} />
      {:else if activeTab === "realmojis"}
        <Realmojis realmojis={data.realmojis} {media} />
      {:else if activeTab === "conversations"}
        <Conversations
          conversations={data.conversations}
          user={data.user}
          {media}
        />
      {:else if activeTab === "analytics"}
        <Analytics events={data.analytics} />
      {:else if activeTab === "settings"}
        <Settings settings={data.pushSettings} tokens={data.pushTokens} />
      {:else if activeTab === "terms"}
        <Terms terms={data.terms} />
      {/if}
    </main>
  </div>

  <div class="drawer-side">
    <label for="drawer-toggle" aria-label="close sidebar" class="drawer-overlay"
    ></label>
    <aside class="min-h-full w-64 bg-base-200 text-base-content flex flex-col">
      <div class="p-4 border-b border-base-300">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div
              class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center"
            >
              <span class="text-primary-content font-bold text-sm">BR</span>
            </div>
            <div>
              <h1 class="font-bold text-lg">BeReal GDPR</h1>
              <p class="text-xs opacity-70">Explorer</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <nav class="flex-1 p-4">
          <div class="mb-4">
            <button
              class="btn btn-primary w-full justify-start gap-3 {activeTab ===
              overviewTab.id
                ? 'btn-primary'
                : 'btn-ghost'}"
              onclick={() => setActiveTab(overviewTab.id)}
            >
              {@render overviewTab.icon({ class: "w-5 h-5" })}
              {overviewTab.label}
            </button>
          </div>

          <div class="divider my-2"></div>

          <ul class="menu menu-vertical w-full space-y-1">
            {#each mainTabs as tab}
              <li>
                <button
                  class="w-full justify-start gap-3 {activeTab === tab.id
                    ? 'active'
                    : ''}"
                  onclick={() => setActiveTab(tab.id)}
                >
                  {@render tab.icon({ class: "w-5 h-5" })}
                  {tab.label}
                </button>
              </li>
            {/each}
          </ul>
        </nav>

        <div class="p-4 border-t border-base-300 space-y-2">
          <a
            href="https://ko-fi.com/G2G11QJ91M"
            target="_blank"
            class="flex justify-center hover:opacity-80 transition-opacity"
          >
            <img
              height="36"
              style="border:0px;height:36px;"
              src="https://storage.ko-fi.com/cdn/kofi4.png?v=6"
              alt="Buy Me a Coffee at ko-fi.com"
            />
          </a>
          <button
            class="btn btn-ghost w-full justify-start gap-3 text-error clear-data-btn"
            onclick={resetData}
          >
            <LogOut class="w-5 h-5" />
            Clear Data
          </button>
        </div>
      </div>
    </aside>
  </div>
</div>

<style>
  .menu li button.active {
    @apply border-r-2;
    background-color: hsl(var(--p) / 0.1);
    color: hsl(var(--p));
    border-color: hsl(var(--p));
  }

  .menu li button:hover:not(.active) {
    background-color: hsl(var(--b3));
  }

  .clear-data-btn:hover {
    background-color: hsl(var(--er) / 0.1);
  }

  main {
    min-height: calc(100vh - 3.5rem);
  }

  @media (min-width: 1024px) {
    main {
      min-height: calc(100vh - 3.5rem);
    }
  }
</style>
