<script lang="ts">
  import type { Friend, FriendRequest } from "@/lib/types";
  import { createSortableData } from "@/lib/sortable.svelte.ts";
  import { exportToCsv } from "@/lib/export";
  import { format, isValid } from "date-fns";
  import {
    ArrowUpDown,
    Download,
    Search,
    UserRound,
    UserRoundPlus,
  } from "@lucide/svelte";
  import EmptyState from "@/components/ui/EmptyState.svelte";

  let { friends = [], requests = [] } = $props<{
    friends?: Friend[];
    requests?: FriendRequest[];
  }>();

  let activeTab = $state("friends");
  let searchQuery = $state("");

  const normalizedSearch = $derived(searchQuery.trim().toLowerCase());
  const filteredFriends = $derived(
    friends.filter((friend) => {
      if (!normalizedSearch) return true;
      return [friend.username, friend.fullname, friend.friendshipDate]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    }),
  );
  const filteredRequests = $derived(
    requests.filter((request) => {
      if (!normalizedSearch) return true;
      return [
        request.fromUserId,
        request.status,
        request.createdAt,
        request.updatedAt,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    }),
  );

  const friendsSortable = createSortableData<Friend>(() => filteredFriends);
  const friendsSortConfig = $derived(friendsSortable.sortConfig);

  const requestsSortable = createSortableData<FriendRequest>(
    () => filteredRequests,
  );
  const requestsSortConfig = $derived(requestsSortable.sortConfig);

  function handleFriendsExport() {
    const dataToExport = friendsSortable.sortedItems.map((friend) => ({
      username: friend.username,
      fullname: friend.fullname,
      friendshipDate: isValid(new Date(friend.friendshipDate))
        ? format(new Date(friend.friendshipDate), "PP")
        : "Invalid Date",
    }));
    exportToCsv(dataToExport, "friends.csv");
  }

  function handleRequestsExport() {
    const dataToExport = requestsSortable.sortedItems.map((req) => ({
      fromUserId: req.fromUserId,
      status: req.status,
      createdAt: isValid(new Date(req.createdAt))
        ? format(new Date(req.createdAt), "PPpp")
        : "Invalid Date",
      updatedAt: isValid(new Date(req.updatedAt))
        ? format(new Date(req.updatedAt), "PPpp")
        : "Invalid Date",
    }));
    exportToCsv(dataToExport, "friend_requests.csv");
  }

  function getSortIndicator(
    key: string,
    currentConfig: {
      key: string;
      direction: string;
    } | null,
  ) {
    if (!currentConfig || currentConfig.key !== key) {
      return "opacity-50";
    }
    return currentConfig.direction === "ascending" ? "" : "rotate-180";
  }
</script>

<div class="space-y-4">
  <div
    class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-3 shadow-sm md:flex-row md:items-center md:justify-between"
  >
    <div class="tabs tabs-boxed">
      <button
        class="tab {activeTab === 'friends' ? 'tab-active' : ''}"
        role="tab"
        aria-selected={activeTab === "friends"}
        onclick={() => (activeTab = "friends")}
      >
        Friends ({friends.length})
      </button>
      <button
        class="tab {activeTab === 'requests' ? 'tab-active' : ''}"
        role="tab"
        aria-selected={activeTab === "requests"}
        onclick={() => (activeTab = "requests")}
      >
        Requests ({requests.length})
      </button>
    </div>
    <label
      class="input input-bordered input-sm flex w-full items-center gap-2 md:w-80"
    >
      <Search class="h-4 w-4 shrink-0 opacity-60" />
      <input
        class="min-w-0 grow"
        type="search"
        placeholder="Search"
        bind:value={searchQuery}
      />
    </label>
  </div>

  {#if activeTab === "friends"}
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <div class="flex justify-between items-center mb-4">
          <h2 class="card-title">Your Friends</h2>
          <button
            class="btn btn-outline btn-sm"
            onclick={handleFriendsExport}
            disabled={filteredFriends.length === 0}
          >
            <Download class="w-4 h-4 mr-2" />
            Export CSV
          </button>
        </div>

        {#if filteredFriends.length > 0}
          <div class="hidden overflow-x-auto md:block">
            <table class="table table-zebra w-full">
              <thead>
                <tr>
                  <th>
                    <button
                      class="btn btn-ghost btn-sm p-0 font-bold"
                      onclick={() => friendsSortable.requestSort("username")}
                    >
                      Username
                      <ArrowUpDown
                        class="w-4 h-4 {getSortIndicator(
                          'username',
                          friendsSortConfig,
                        )}"
                      />
                    </button>
                  </th>
                  <th>
                    <button
                      class="btn btn-ghost btn-sm p-0 font-bold"
                      onclick={() => friendsSortable.requestSort("fullname")}
                    >
                      Full Name
                      <ArrowUpDown
                        class="w-4 h-4 {getSortIndicator(
                          'fullname',
                          friendsSortConfig,
                        )}"
                      />
                    </button>
                  </th>
                  <th>
                    <button
                      class="btn btn-ghost btn-sm p-0 font-bold"
                      onclick={() =>
                        friendsSortable.requestSort("friendshipDate")}
                    >
                      Friends Since
                      <ArrowUpDown
                        class="w-4 h-4 {getSortIndicator(
                          'friendshipDate',
                          friendsSortConfig,
                        )}"
                      />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {#each friendsSortable.sortedItems as friend}
                  {@const friendshipDateObj = new Date(friend.friendshipDate)}
                  {@const formattedFriendshipDate = isValid(friendshipDateObj)
                    ? format(friendshipDateObj, "PP")
                    : "Invalid Date"}
                  <tr>
                    <td class="font-medium">@{friend.username}</td>
                    <td>{friend.fullname}</td>
                    <td>{formattedFriendshipDate}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
          <div class="grid gap-3 md:hidden">
            {#each friendsSortable.sortedItems as friend}
              {@const friendshipDateObj = new Date(friend.friendshipDate)}
              {@const formattedFriendshipDate = isValid(friendshipDateObj)
                ? format(friendshipDateObj, "PP")
                : "Invalid Date"}
              <div class="rounded-lg border border-base-300 p-4">
                <div class="flex items-start gap-3">
                  <div class="avatar placeholder">
                    <div
                      class="h-10 w-10 rounded-full bg-primary text-primary-content"
                    >
                      <span class="text-sm"
                        >{friend.username.slice(0, 2).toUpperCase()}</span
                      >
                    </div>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="truncate font-semibold">@{friend.username}</p>
                    <p class="truncate text-sm text-base-content/70">
                      {friend.fullname}
                    </p>
                    <p class="mt-2 text-xs text-base-content/60">
                      Friends since {formattedFriendshipDate}
                    </p>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <EmptyState
            icon={UserRound}
            title={friends.length === 0
              ? "No friends found"
              : "No friends match this search"}
            description={friends.length === 0
              ? "This export does not include friend data."
              : "Try a different username, name, or date."}
          />
        {/if}
      </div>
    </div>
  {/if}

  {#if activeTab === "requests"}
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <div class="flex justify-between items-center mb-4">
          <h2 class="card-title">Friend Requests</h2>
          <button
            class="btn btn-outline btn-sm"
            onclick={handleRequestsExport}
            disabled={filteredRequests.length === 0}
          >
            <Download class="w-4 h-4 mr-2" />
            Export CSV
          </button>
        </div>

        {#if filteredRequests.length > 0}
          <div class="hidden overflow-x-auto md:block">
            <table class="table table-zebra w-full">
              <thead>
                <tr>
                  <th>
                    <button
                      class="btn btn-ghost btn-sm p-0 font-bold"
                      onclick={() => requestsSortable.requestSort("fromUserId")}
                    >
                      ID
                      <ArrowUpDown
                        class="w-4 h-4 {getSortIndicator(
                          'fromUserId',
                          requestsSortConfig,
                        )}"
                      />
                    </button>
                  </th>
                  <th>
                    <button
                      class="btn btn-ghost btn-sm p-0 font-bold"
                      onclick={() => requestsSortable.requestSort("status")}
                    >
                      Status
                      <ArrowUpDown
                        class="w-4 h-4 {getSortIndicator(
                          'status',
                          requestsSortConfig,
                        )}"
                      />
                    </button>
                  </th>
                  <th>
                    <button
                      class="btn btn-ghost btn-sm p-0 font-bold"
                      onclick={() => requestsSortable.requestSort("createdAt")}
                    >
                      Created At
                      <ArrowUpDown
                        class="w-4 h-4 {getSortIndicator(
                          'createdAt',
                          requestsSortConfig,
                        )}"
                      />
                    </button>
                  </th>
                  <th>
                    <button
                      class="btn btn-ghost btn-sm p-0 font-bold"
                      onclick={() => requestsSortable.requestSort("updatedAt")}
                    >
                      Updated At
                      <ArrowUpDown
                        class="w-4 h-4 {getSortIndicator(
                          'updatedAt',
                          requestsSortConfig,
                        )}"
                      />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {#each requestsSortable.sortedItems as req}
                  {@const createdAtObj = new Date(req.createdAt)}
                  {@const formattedCreatedAt = isValid(createdAtObj)
                    ? format(createdAtObj, "PPpp")
                    : "Invalid Date"}
                  {@const updatedAtObj = new Date(req.updatedAt)}
                  {@const formattedUpdatedAt = isValid(updatedAtObj)
                    ? format(updatedAtObj, "PPpp")
                    : "Invalid Date"}
                  <tr>
                    <td class="font-medium truncate max-w-xs"
                      >{req.fromUserId}</td
                    >
                    <td>
                      <span
                        class="badge badge-{req.status === 'pending'
                          ? 'secondary'
                          : 'primary'}"
                      >
                        {req.status}
                      </span>
                    </td>
                    <td>{formattedCreatedAt}</td>
                    <td>{formattedUpdatedAt}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
          <div class="grid gap-3 md:hidden">
            {#each requestsSortable.sortedItems as req}
              {@const createdAtObj = new Date(req.createdAt)}
              {@const formattedCreatedAt = isValid(createdAtObj)
                ? format(createdAtObj, "PPpp")
                : "Invalid Date"}
              <div class="rounded-lg border border-base-300 p-4">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="truncate font-mono text-sm font-medium">
                      {req.fromUserId}
                    </p>
                    <p class="mt-2 text-xs text-base-content/60">
                      Created {formattedCreatedAt}
                    </p>
                  </div>
                  <span
                    class="badge badge-{req.status === 'pending'
                      ? 'secondary'
                      : 'primary'} shrink-0"
                  >
                    {req.status}
                  </span>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <EmptyState
            icon={UserRoundPlus}
            title={requests.length === 0
              ? "No friend requests found"
              : "No requests match this search"}
            description={requests.length === 0
              ? "This export does not include friend request data."
              : "Try a different ID, status, or date."}
          />
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
</style>
