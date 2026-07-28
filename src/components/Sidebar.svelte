<script lang="ts">
  import {
    LayoutGrid,
    User as UserIcon,
    Users,
    GalleryHorizontal,
    Clock,
    MessageCircle,
    SmilePlus,
    MessagesSquare,
    LineChart,
    Bell,
    FileCheck2,
    LogOut,
  } from "@lucide/svelte";
  import BrandLogo from "@/components/BrandLogo.svelte";
  import ThemeToggle from "@/components/ui/ThemeToggle.svelte";
  import { APP_NAME } from "@/lib/brand";
  import { APP_VERSION } from "@/lib/version";

  export type TabId =
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

  const TABS = [
    {
      id: "overview",
      label: "Overview",
      icon: LayoutGrid,
    },
    {
      id: "user",
      label: "User Info",
      icon: UserIcon,
    },
    {
      id: "friends",
      label: "Friends & Requests",
      icon: Users,
    },
    {
      id: "posts",
      label: "Posts",
      icon: GalleryHorizontal,
    },
    {
      id: "memories",
      label: "Memories",
      icon: Clock,
    },
    {
      id: "comments",
      label: "Comments",
      icon: MessageCircle,
    },
    {
      id: "realmojis",
      label: "Realmojis",
      icon: SmilePlus,
    },
    {
      id: "conversations",
      label: "Conversations",
      icon: MessagesSquare,
    },
    {
      id: "analytics",
      label: "Analytics Events",
      icon: LineChart,
    },
    {
      id: "settings",
      label: "Push Notifications",
      icon: Bell,
    },
    {
      id: "terms",
      label: "Terms & Consents",
      icon: FileCheck2,
    },
  ] as const;

  let { activeTab, setActiveTab, resetData } = $props<{
    activeTab: string;
    setActiveTab: (id: TabId) => void;
    resetData: () => void;
  }>();

  const overviewTab = TABS.find((t) => t.id === "overview")!;
  const mainTabs = TABS.filter((t) => t.id !== "overview");
</script>

<aside
  class="flex min-h-full w-72 flex-col bg-base-100 text-base-content shadow-[1px_0_0_oklch(0_0_0/0.06)]"
>
  <div class="p-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <BrandLogo class="size-10" />
        <div class="min-w-0">
          <h1 class="truncate text-base font-bold tracking-tight">
            {APP_NAME}
          </h1>
          <p class="text-xs text-base-content/60 tabular-nums">
            Private archive · v{APP_VERSION}
          </p>
        </div>
      </div>
      <ThemeToggle />
    </div>
  </div>

  <nav class="flex-1 overflow-y-auto px-4 py-2">
    <div class="mb-4">
      <button
        class="btn btn-primary w-full justify-start gap-3 {activeTab ===
        overviewTab.id
          ? 'btn-primary'
          : 'btn-ghost'}"
        onclick={() => setActiveTab(overviewTab.id as TabId)}
      >
        <overviewTab.icon class="w-5 h-5" />
        {overviewTab.label}
      </button>
    </div>

    <div class="divider my-3 opacity-60"></div>

    <ul class="menu menu-vertical w-full gap-1 p-0">
      {#each mainTabs as tab}
        <li>
          <button
            class="w-full justify-start gap-3 {activeTab === tab.id
              ? 'active'
              : ''}"
            onclick={() => setActiveTab(tab.id as TabId)}
          >
            <tab.icon class="w-5 h-5" />
            {tab.label}
          </button>
        </li>
      {/each}
    </ul>
  </nav>

  <div class="space-y-2 p-4 shadow-[0_-1px_0_oklch(0_0_0/0.06)]">
    <a
      href="https://ko-fi.com/G2G11QJ91M"
      target="_blank"
      rel="noopener noreferrer"
      class="btn btn-outline btn-sm w-full"
    >
      Support on Ko-fi
    </a>
    <button
      class="btn btn-ghost w-full justify-start gap-3 text-error clear-data-btn"
      onclick={resetData}
    >
      <LogOut class="w-5 h-5" />
      Clear Data
    </button>
  </div>
</aside>

<style>
  .menu li button.active {
    background-color: color-mix(
      in oklch,
      var(--color-primary) 16%,
      transparent
    );
    color: var(--color-primary);
  }

  .menu li button:hover:not(.active) {
    background-color: var(--color-base-300);
  }

  .clear-data-btn:hover {
    background-color: color-mix(in oklch, var(--color-error) 14%, transparent);
  }
</style>
