<script lang="ts">
  import type { Friend, FriendRequest } from "@lib/types";
  import { createSortableData } from "@lib/sortable.svelte.ts";
  import { exportToCsv } from "@lib/export";
  import { format, isValid } from "date-fns";
  import { ArrowUpDown, Download } from "@lucide/svelte";

  let { friends = [], requests = [] } = $props<{
    friends?: Friend[];
    requests?: FriendRequest[];
  }>();

  let activeTab = $state("friends");

  const friendsSortable = createSortableData<Friend>(friends);
  const friendsSortConfig = $derived(friendsSortable.sortConfig);

  const requestsSortable = createSortableData<FriendRequest>(requests);
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
    currentConfig: { key: string; direction: string } | null
  ) {
    if (!currentConfig || currentConfig.key !== key) {
      return "opacity-50";
    }
    return currentConfig.direction === "ascending" ? "" : "rotate-180";
  }
</script>

<div class="p-4">
  <div class="tabs tabs-boxed mb-6">
    <a
      href="#friends"
      class="tab {activeTab === 'friends' ? 'tab-active' : ''}"
      role="tab"
      aria-selected={activeTab === "friends"}
      onclick={() => (activeTab = "friends")}
    >
      Friends ({friends.length})
    </a>
    <a
      href="#requests"
      class="tab {activeTab === 'requests' ? 'tab-active' : ''}"
      role="tab"
      aria-selected={activeTab === "requests"}
      onclick={() => (activeTab = "requests")}
    >
      Requests ({requests.length})
    </a>
  </div>

  {#if activeTab === "friends"}
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <div class="flex justify-between items-center mb-4">
          <h2 class="card-title">Your Friends</h2>
          <button
            class="btn btn-outline btn-sm"
            onclick={handleFriendsExport}
            disabled={friends.length === 0}
          >
            <Download class="w-4 h-4 mr-2" />
            Export CSV
          </button>
        </div>

        {#if friends.length > 0}
          <div class="overflow-x-auto">
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
                          friendsSortConfig
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
                          friendsSortConfig
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
                          friendsSortConfig
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
        {:else}
          <div class="text-center py-8 text-base-content/50">
            <p>No friend data found.</p>
          </div>
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
            disabled={requests.length === 0}
          >
            <Download class="w-4 h-4 mr-2" />
            Export CSV
          </button>
        </div>

        {#if requests.length > 0}
          <div class="overflow-x-auto">
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
                          requestsSortConfig
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
                          requestsSortConfig
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
                          requestsSortConfig
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
                          requestsSortConfig
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
        {:else}
          <div class="text-center py-8 text-base-content/50">
            <p>No friend request data found.</p>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
</style>
