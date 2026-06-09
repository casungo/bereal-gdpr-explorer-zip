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
	import ThemeToggle from "@/components/ui/ThemeToggle.svelte";
	import { APP_VERSION } from "@/lib/version";

	// Re-define TABS here or pass them in? Passing them in is cleaner for dumb components,
	// but defining them here makes Sidebar self-contained if it's specific to this app.
	// Given the tight coupling, I'll keep the TABS definition close to where it's used or import it.
	// For now, I'll copy the TABS array to keep it simple, or better, export it from a constants file.
	// But to avoid creating extra files right now, I'll accept tabs as a prop or define them here.
	// Let's define them here since this IS the navigation sidebar.

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
					<p class="text-xs opacity-70">
						Explorer v{APP_VERSION}
					</p>
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
					onclick={() => setActiveTab(overviewTab.id as TabId)}
				>
					<overviewTab.icon class="w-5 h-5" />
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
							onclick={() => setActiveTab(tab.id as TabId)}
						>
							<tab.icon class="w-5 h-5" />
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

<style>
	.menu li button.active {
		@apply border-r-2;
		background-color: color-mix(
			in oklch,
			var(--color-primary) 16%,
			transparent
		);
		color: var(--color-primary);
		border-color: var(--color-primary);
	}

	.menu li button:hover:not(.active) {
		background-color: var(--color-base-300);
	}

	.clear-data-btn:hover {
		background-color: color-mix(in oklch, var(--color-error) 14%, transparent);
	}
</style>
