<script
  lang="ts"
>
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
} from "@lucide/svelte";

import DashboardLayout from "@/components/DashboardLayout.svelte";
import Sidebar from "@/components/Sidebar.svelte";
import type { TabId } from "@/components/Sidebar.svelte";

import Overview from "@/components/views/Overview.svelte";
import UserInfo from "@/components/views/UserInfo.svelte";
import Friends from "@/components/views/Friends.svelte";
import Posts from "@/components/views/Posts.svelte";
import Memories from "@/components/views/Memories.svelte";
import Comments from "@/components/views/Comments.svelte";
import Realmojis from "@/components/views/Realmojis.svelte";
import Settings from "@/components/views/Settings.svelte";
import Terms from "@/components/views/Terms.svelte";
import Conversations from "@/components/views/Conversations.svelte";
import Analytics from "@/components/views/Analytics.svelte";
import type { BeRealData, MediaMap } from "@/lib/types";

let { data, media, resetData } = $props<{
	data: BeRealData;
	media: MediaMap;
	resetData: () => void;
}>();

// Duplicate TABS specifically for title lookup to avoid circular deps or complex passing
// In a real app, I'd move this to a shared constant file.
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

let activeTab: TabId = $state("overview");
let sidebarOpen: boolean = $state(false);

function setActiveTab(tab: TabId) {
	activeTab = tab;
	sidebarOpen = false;
}
</script>

<DashboardLayout
  bind:sidebarOpen
  title={TABS.find(
    (
      t,
    ) =>
      t.id ===
      activeTab,
  )
    ?.label ??
    "Dashboard"}
>
  {#snippet sidebar()}
    <Sidebar
      {activeTab}
      {setActiveTab}
      {resetData}
    />
  {/snippet}

  {#if !data || !media}
    <div
      class="flex items-center justify-center h-full"
    >
      <div
        class="text-center"
      >
        <div
          class="loading loading-spinner loading-lg"
        ></div>
        <p
          class="mt-4"
        >
          No
          data
          available
        </p>
      </div>
    </div>
  {:else if activeTab === "overview"}
    <Overview
      {data}
      {media}
    />
  {:else if activeTab === "user"}
    <UserInfo
      user={data.user}
      {media}
    />
  {:else if activeTab === "friends"}
    <Friends
      friends={data.friends}
      requests={data.friendRequests}
    />
  {:else if activeTab === "posts"}
    {#if data.posts}
      <Posts
        posts={data.posts}
        {media}
      />
    {:else}
      <div
        class="card bg-base-100 shadow-xl"
      >
        <div
          class="card-body"
        >
          <h2
            class="card-title"
          >
            Posts
          </h2>
          <p
          >
            No
            posts
            data
            found
            in
            data
            object.
          </p>
          <p
          >
            Available
            data
            keys:
            {Object.keys(
              data,
            ).join(
              ", ",
            )}
          </p>
        </div>
      </div>
    {/if}
  {:else if activeTab === "memories"}
    <Memories
      memories={data.memories}
      {media}
    />
  {:else if activeTab === "comments"}
    <Comments
      comments={data.comments}
      user={data.user}
      {media}
    />
  {:else if activeTab === "realmojis"}
    <Realmojis
      realmojis={data.realmojis}
      {media}
    />
  {:else if activeTab === "conversations"}
    <Conversations
      conversations={data.conversations}
      user={data.user}
      {media}
    />
  {:else if activeTab === "analytics"}
    <Analytics
      events={data.analytics}
    />
  {:else if activeTab === "settings"}
    <Settings
      settings={data.pushSettings}
      tokens={data.pushTokens}
    />
  {:else if activeTab === "terms"}
    <Terms
      terms={data.terms}
    />
  {/if}
</DashboardLayout>
