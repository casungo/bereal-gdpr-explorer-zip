<script lang="ts">
  import type { Conversation, User, MediaMap, ChatMessage } from "@lib/types";
  import { format, formatDistanceToNow, isSameDay } from "date-fns";

  type Participant = { id: string; username: string };

  let {
    conversations = [],
    user,
    media,
  } = $props<{
    conversations?: Conversation[];
    user?: User;
    media: MediaMap;
  }>();

  let selectedConversationId = $state<string | null>(
    conversations[0]?.id || null
  );

  const selectedConversation = $derived(
    conversations.find((c: Conversation) => c.id === selectedConversationId)
  );

  const filteredSelectedMessages = $derived(
    selectedConversation
      ? selectedConversation.messages.filter((m: ChatMessage) =>
          isValidMessage(m.content)
        )
      : []
  );

  function selectConversation(id: string) {
    selectedConversationId = id;
  }

  function isValidMessage(content: string): boolean {
    if (!content) return true; // Allow empty content (might be media-only messages)

    const hasInvalidChars = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/.test(
      content
    );

    const specialCharCount = (content.match(/[^\w\s\p{P}\p{S}]/gu) || [])
      .length;
    const totalChars = content.length;
    const specialCharRatio = totalChars > 0 ? specialCharCount / totalChars : 0;

    const looksLikeBinary = specialCharRatio > 0.3;

    return !hasInvalidChars && !looksLikeBinary;
  }
</script>

{#if !conversations || conversations.length === 0}
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title">Conversations</h2>
      <p>No conversation data found.</p>
    </div>
  </div>
{:else}
  <div
    class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-10rem)] overflow-hidden"
  >
    <div class="lg:col-span-1 h-full overflow-hidden">
      <div class="card bg-base-100 shadow-xl h-full flex flex-col">
        <div
          class="p-4 border-b border-base-200 flex items-center justify-between"
        >
          <h2 class="text-lg font-semibold">Chats</h2>
          <div class="badge badge-outline badge-primary">
            {conversations.length} conversations
          </div>
        </div>
        <div class="flex-1 overflow-y-auto">
          {#each conversations as convo}
            {@const otherParticipant = convo.participants.find(
              (p: Participant) => p.id !== user?.id
            )}
            {@const validMessages = convo.messages.filter((m: ChatMessage) =>
              isValidMessage(m.content)
            )}
            {@const lastMessage = validMessages[validMessages.length - 1]}
            {@const isSelected = selectedConversationId === convo.id}

            <div
              class="chat-selector-item"
              class:selected={isSelected}
              role="button"
              tabindex="0"
              onclick={() => selectConversation(convo.id)}
              onkeydown={(e) =>
                e.key === "Enter" && selectConversation(convo.id)}
            >
              <div class="avatar placeholder">
                <div
                  class="bg-neutral text-neutral-content rounded-full w-12 h-12"
                >
                  <span class="text-sm">
                    {otherParticipant?.username.slice(0, 2).toUpperCase()}
                  </span>
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex justify-between items-baseline">
                  <p class="font-semibold truncate">
                    @{otherParticipant?.username || "Unknown"}
                  </p>
                  {#if lastMessage}
                    <span class="text-xs text-base-content/50">
                      {formatDistanceToNow(new Date(lastMessage.creationDate), {
                        addSuffix: true,
                      })}
                    </span>
                  {/if}
                </div>
                <p class="text-sm text-base-content/70 truncate">
                  {lastMessage?.content || "No messages"}
                </p>
              </div>
              {#if convo.unreadCount > 0}
                <div class="badge badge-primary badge-sm">
                  {convo.unreadCount}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    </div>

    <div class="lg:col-span-2 h-full overflow-hidden">
      <div class="card bg-base-100 shadow-xl h-full flex flex-col">
        {#if selectedConversation}
          <div class="p-4 border-b border-base-200">
            <div class="flex items-center gap-3">
              <div class="avatar placeholder">
                <div
                  class="bg-neutral text-neutral-content rounded-full w-10 h-10"
                >
                  <span class="text-sm">
                    {selectedConversation.participants
                      .find((p: Participant) => p.id !== user?.id)
                      ?.username.slice(0, 2)
                      .toUpperCase()}
                  </span>
                </div>
              </div>
              <div>
                <h2 class="card-title text-lg">
                  @{selectedConversation.participants.find(
                    (p: Participant) => p.id !== user?.id
                  )?.username || "Unknown"}
                </h2>
                <p class="text-sm text-base-content/70">
                  {selectedConversation.messages.length} messages
                </p>
              </div>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-4">
            <div class="space-y-4">
              {#each filteredSelectedMessages as message, index}
                {@const isMe = message.senderId === user?.id}
                {@const prevMessage = filteredSelectedMessages[index - 1]}
                {@const showDate =
                  !prevMessage ||
                  !isSameDay(
                    new Date(message.creationDate),
                    new Date(prevMessage.creationDate)
                  )}
                {@const mediaUrl = message.media
                  ? media[message.media.path]
                  : null}

                {#if message.content || mediaUrl}
                  <div>
                    {#if showDate}
                      <div
                        class="text-center text-xs text-base-content/50 my-4"
                      >
                        {format(new Date(message.creationDate), "MMMM d, yyyy")}
                      </div>
                    {/if}
                    <div
                      class="flex items-end gap-2"
                      class:justify-end={isMe}
                      class:justify-start={!isMe}
                    >
                      {#if !isMe}
                        <div class="avatar placeholder">
                          <div
                            class="bg-neutral text-neutral-content rounded-full w-6 h-6"
                          >
                            <span class="text-xs">
                              {selectedConversation.participants
                                .find(
                                  (p: Participant) => p.id === message.senderId
                                )
                                ?.username.slice(0, 1)}
                            </span>
                          </div>
                        </div>
                      {/if}
                      <div
                        class="max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl"
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
                              class="rounded-lg mb-2 max-w-full h-auto"
                            />
                          {:else}
                            <video
                              src={mediaUrl}
                              controls
                              class="rounded-lg mb-2 max-w-full"
                            >
                              <track kind="captions" />
                            </video>
                          {/if}
                        {/if}
                        {#if message.content}
                          <p>{message.content}</p>
                        {/if}
                        <p
                          class="text-xs mt-1 opacity-70"
                          class:text-right={isMe}
                          class:text-left={!isMe}
                          title={format(new Date(message.creationDate), "pp")}
                        >
                          {formatDistanceToNow(new Date(message.creationDate), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                {/if}
              {/each}
            </div>
          </div>
        {:else}
          <div class="flex-1 flex items-center justify-center p-4">
            <div class="text-center">
              <p class="text-lg text-base-content/70">
                Select a conversation to start chatting
              </p>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .chat-selector-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    border-bottom: 1px solid var(--fallback-b2, oklch(var(--b2) / 0.2));
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .chat-selector-item:hover {
    background-color: var(--fallback-b2, oklch(var(--b2) / 0.2));
  }

  .chat-selector-item.selected {
    background-color: var(--fallback-b2, oklch(var(--b2) / 0.2));
  }

  .chat-selector-item:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--fallback-p, oklch(var(--p) / 1));
  }
</style>
