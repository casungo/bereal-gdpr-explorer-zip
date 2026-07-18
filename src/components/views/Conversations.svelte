<script lang="ts">
	import EmptyState from "@/components/ui/EmptyState.svelte";
	import type { ChatMessage, Conversation, MediaMap, User } from "@/lib/types";
	import { ArrowLeft, MessageCircle, Search } from "@lucide/svelte";
	import { format, formatDistanceToNow, isSameDay, isValid } from "date-fns";

	type Participant = {
		id: string;
		username: string;
	};

	let {
		conversations = [],
		user,
		media,
	} = $props<{
		conversations?: Conversation[];
		user?: User;
		media: MediaMap;
	}>();

	let selectedConversationId = $state<string | null>(null);
	let searchQuery = $state("");

	const normalizedSearch = $derived(searchQuery.trim().toLowerCase());

	const visibleConversations = $derived(
		conversations.filter((conversation) => {
			if (!normalizedSearch) return true;

			const otherParticipant = getOtherParticipant(conversation);
			const lastMessage = conversation.messages.at(-1);
			return [
				conversation.id,
				otherParticipant?.username,
				lastMessage?.content,
				lastMessage?.creationDate,
			]
				.join(" ")
				.toLowerCase()
				.includes(normalizedSearch);
		}),
	);

	const activeConversationId = $derived(
		selectedConversationId ?? visibleConversations[0]?.id ?? null,
	);

	const selectedConversation = $derived(
		visibleConversations.find(
			(conversation) => conversation.id === activeConversationId,
		),
	);

	$effect(() => {
		if (
			selectedConversationId &&
			!visibleConversations.some(
				(conversation) => conversation.id === selectedConversationId,
			)
		) {
			selectedConversationId = null;
		}
	});

	function selectConversation(id: string) {
		selectedConversationId = id;
	}

	function showConversationList() {
		selectedConversationId = null;
	}

	function getOtherParticipant(
		conversation: Conversation,
	): Participant | undefined {
		return (
			conversation.participants.find(
				(participant) => participant.id !== user?.id,
			) ?? conversation.participants[0]
		);
	}

	function getInitials(username?: string): string {
		return (username || "?").slice(0, 2).toUpperCase();
	}

	function messageDate(date: string, fallback = ""): string {
		const parsedDate = new Date(date);
		if (!isValid(parsedDate)) return fallback;
		return format(parsedDate, "MMMM d, yyyy");
	}

	function relativeMessageDate(date: string): string {
		const parsedDate = new Date(date);
		if (!isValid(parsedDate)) return "";
		return formatDistanceToNow(parsedDate, { addSuffix: true });
	}

	function messageTime(date: string): string {
		const parsedDate = new Date(date);
		if (!isValid(parsedDate)) return "";
		return format(parsedDate, "p");
	}

</script>

{#if !conversations || conversations.length === 0}
	<EmptyState
		icon={MessageCircle}
		title="No conversations found"
		description="This export does not include conversation data."
	/>
{:else}
	<div
		class="grid min-h-[32rem] gap-4 lg:h-[calc(100vh-8.5rem)] lg:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)] lg:overflow-hidden"
	>
		<section
			class="{selectedConversationId
				? 'hidden lg:flex'
				: 'flex'} min-h-0 flex-col overflow-hidden rounded-lg border border-base-300 bg-base-100 shadow-sm"
		>
			<div class="space-y-3 border-b border-base-300 p-4">
				<div class="flex items-center justify-between gap-3">
					<h2 class="text-lg font-semibold">Chats</h2>
					<span class="badge badge-outline badge-primary">
						{visibleConversations.length} / {conversations.length}
					</span>
				</div>
				<label class="input input-bordered input-sm flex items-center gap-2">
					<Search class="h-4 w-4 shrink-0 opacity-60" />
					<input
						class="min-w-0 grow"
						type="search"
						placeholder="Search"
						bind:value={searchQuery}
					/>
				</label>
			</div>

			{#if visibleConversations.length === 0}
				<div class="p-4">
					<EmptyState
						icon={Search}
						title="No chats match this search"
						description="Try a different username, message, or date."
					/>
				</div>
			{:else}
				<div class="min-h-0 flex-1 overflow-y-auto">
					{#each visibleConversations as conversation (conversation.id)}
						{@const otherParticipant = getOtherParticipant(conversation)}
						{@const lastMessage = conversation.messages.at(-1)}
						{@const isSelected = activeConversationId === conversation.id}
						<button
							class="flex w-full items-center gap-3 border-b border-base-300 p-3 text-left transition hover:bg-base-200 focus:bg-base-200 focus:outline-none {isSelected
								? 'bg-base-200'
								: ''}"
							onclick={() => selectConversation(conversation.id)}
						>
							<div class="avatar placeholder shrink-0">
								<div
									class="h-11 w-11 rounded-full bg-neutral text-neutral-content"
								>
									<span class="text-sm">
										{getInitials(otherParticipant?.username)}
									</span>
								</div>
							</div>
							<div class="min-w-0 flex-1">
								<div class="flex items-baseline justify-between gap-3">
									<p class="truncate font-semibold">
										@{otherParticipant?.username || "Unknown"}
									</p>
									{#if lastMessage}
										<span class="shrink-0 text-xs text-base-content/50">
											{relativeMessageDate(lastMessage.creationDate)}
										</span>
									{/if}
								</div>
								<p class="truncate text-sm text-base-content/70">
									{lastMessage?.content ||
										(lastMessage?.media ? "Shared media" : "No messages")}
								</p>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</section>

		<section
			class="{selectedConversationId
				? 'flex'
				: 'hidden lg:flex'} min-h-[32rem] flex-col overflow-hidden rounded-lg border border-base-300 bg-base-100 shadow-sm lg:min-h-0"
		>
			{#if selectedConversation}
				{@const selectedParticipant = getOtherParticipant(selectedConversation)}
				<header class="flex items-center gap-3 border-b border-base-300 p-4">
					<button
						class="btn btn-ghost btn-sm btn-circle lg:hidden"
						onclick={showConversationList}
						aria-label="Back to conversations"
					>
						<ArrowLeft class="h-4 w-4" />
					</button>
					<div class="avatar placeholder shrink-0">
						<div class="h-10 w-10 rounded-full bg-neutral text-neutral-content">
							<span class="text-sm">
								{getInitials(selectedParticipant?.username)}
							</span>
						</div>
					</div>
					<div class="min-w-0">
						<h2 class="truncate text-base font-semibold">
							@{selectedParticipant?.username || "Unknown"}
						</h2>
						<p class="text-sm text-base-content/60">
							{selectedConversation.messages.length} messages
						</p>
					</div>
				</header>

				<div class="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
					<div class="space-y-4">
						{#each selectedConversation.messages as message, index (message.id)}
							{@const isMe = message.senderId === user?.id}
							{@const prevMessage = selectedConversation.messages[index - 1]}
							{@const currentDate = new Date(message.creationDate)}
							{@const previousDate = prevMessage
								? new Date(prevMessage.creationDate)
								: null}
							{@const showDate =
								!prevMessage ||
								!previousDate ||
								!isValid(currentDate) ||
								!isValid(previousDate) ||
								!isSameDay(currentDate, previousDate)}
							{@const mediaUrl = message.media
								? media[message.media.path]
								: null}

							{#if message.content || mediaUrl}
								<div>
									{#if showDate}
										<div class="my-4 text-center text-xs text-base-content/50">
											{messageDate(message.creationDate)}
										</div>
									{/if}
									<div
										class="flex items-end gap-2"
										class:justify-end={isMe}
										class:justify-start={!isMe}
									>
										{#if !isMe}
											<div class="avatar placeholder hidden shrink-0 sm:block">
												<div
													class="h-7 w-7 rounded-full bg-neutral text-neutral-content"
												>
													<span class="text-xs">
														{getInitials(
															selectedConversation.participants.find(
																(participant) =>
																	participant.id === message.senderId,
															)?.username,
														).slice(0, 1)}
													</span>
												</div>
											</div>
										{/if}
										<div
											class="max-w-[min(82vw,34rem)] rounded-2xl p-3 text-sm shadow-sm"
											class:bg-primary={isMe}
											class:text-primary-content={isMe}
											class:rounded-br-none={isMe}
											class:bg-base-200={!isMe}
											class:rounded-bl-none={!isMe}
										>
											{#if mediaUrl}
												{#if message.media?.type === "image"}
													<img
														src={mediaUrl}
														width={message.media.width}
														height={message.media.height}
														alt="Shared media"
														class="mb-2 max-h-[22rem] max-w-full rounded-lg object-contain"
														loading="lazy"
													/>
												{:else}
													<video
														src={mediaUrl}
														controls
														class="mb-2 max-h-[22rem] max-w-full rounded-lg"
													>
														<track kind="captions" />
													</video>
												{/if}
											{/if}
											{#if message.content}
												<p class="whitespace-pre-wrap break-words">
													{message.content}
												</p>
											{/if}
											<p
												class="mt-1 text-xs opacity-70"
												class:text-right={isMe}
												class:text-left={!isMe}
												title={messageTime(message.creationDate)}
											>
												{relativeMessageDate(message.creationDate)}
											</p>
										</div>
									</div>
								</div>
							{/if}
						{/each}
					</div>
				</div>
			{:else}
				<div class="flex flex-1 items-center justify-center p-4">
					<EmptyState
						icon={MessageCircle}
						title="Select a conversation"
						description="Choose a chat from the list to view its messages."
					/>
				</div>
			{/if}
		</section>
	</div>
{/if}
