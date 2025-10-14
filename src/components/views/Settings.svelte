<script lang="ts">
  import type { PushSettings, PushToken } from "@lib/types";
  import { createSortableData } from "@lib/sortable.svelte.ts";
  import { exportToCsv } from "@lib/export";
  import { ArrowUpDown, Download } from "@lucide/svelte";

  let { settings, tokens = [] } = $props<{
    settings?: PushSettings;
    tokens: PushToken[];
  }>();

  const tokensSortable = createSortableData<PushToken>(tokens);
  const tokensSortConfig = $derived(tokensSortable.sortConfig);

  function handleExport() {
    const dataToExport = tokensSortable.sortedItems.map((token) => ({
      os: token.os,
      clientVersion: token.clientVersion,
      language: token.language,
      timezone: token.timezone,
      token: token.token,
    }));
    exportToCsv(dataToExport, "registered_devices.csv");
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
  <div class="grid gap-6 lg:grid-cols-1">
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title">Push Notification Settings</h2>
        <p class="text-base-content/70 mb-4">
          Your saved notification preferences.
        </p>

        {#if settings && Object.keys(settings).length > 0}
          <div class="space-y-4">
            {#each Object.entries(settings) as [key, value]}
              <div
                class="flex items-center justify-between p-3 rounded-lg bg-base-200/50"
              >
                <label for={key} class="capitalize cursor-pointer"
                  >{key.replace(/_/g, " ")}</label
                >
                <input
                  type="checkbox"
                  id={key}
                  checked={Boolean(value)}
                  disabled
                  class="toggle toggle-primary"
                />
              </div>
            {/each}
          </div>
        {:else}
          <div class="text-center py-8 text-base-content/50">
            <p>No push notification settings found.</p>
          </div>
        {/if}
      </div>
    </div>

    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <div class="flex justify-between items-center mb-4">
          <div>
            <h2 class="card-title">Registered Devices</h2>
            <p class="text-base-content/70">
              Devices that have been registered to receive push notifications.
            </p>
          </div>
          <button
            class="btn btn-outline btn-sm"
            onclick={handleExport}
            disabled={!tokens || tokens.length === 0}
          >
            <Download class="w-4 h-4 mr-2" />
            Export CSV
          </button>
        </div>

        {#if tokens && tokens.length > 0}
          <div class="overflow-x-auto">
            <table class="table table-zebra w-full">
              <thead>
                <tr>
                  <th>
                    <button
                      class="btn btn-ghost btn-sm p-0 font-bold"
                      onclick={() => tokensSortable.requestSort("os")}
                    >
                      OS
                      <ArrowUpDown
                        class="w-4 h-4 {getSortIndicator(
                          'os',
                          tokensSortConfig
                        )}"
                      />
                    </button>
                  </th>
                  <th>
                    <button
                      class="btn btn-ghost btn-sm p-0 font-bold"
                      onclick={() =>
                        tokensSortable.requestSort("clientVersion")}
                    >
                      Version
                      <ArrowUpDown
                        class="w-4 h-4 {getSortIndicator(
                          'clientVersion',
                          tokensSortConfig
                        )}"
                      />
                    </button>
                  </th>
                  <th>
                    <button
                      class="btn btn-ghost btn-sm p-0 font-bold"
                      onclick={() => tokensSortable.requestSort("language")}
                    >
                      Language
                      <ArrowUpDown
                        class="w-4 h-4 {getSortIndicator(
                          'language',
                          tokensSortConfig
                        )}"
                      />
                    </button>
                  </th>
                  <th>
                    <button
                      class="btn btn-ghost btn-sm p-0 font-bold"
                      onclick={() => tokensSortable.requestSort("timezone")}
                    >
                      Timezone
                      <ArrowUpDown
                        class="w-4 h-4 {getSortIndicator(
                          'timezone',
                          tokensSortConfig
                        )}"
                      />
                    </button>
                  </th>
                  <th>
                    <button
                      class="btn btn-ghost btn-sm p-0 font-bold"
                      onclick={() => tokensSortable.requestSort("token")}
                    >
                      Token
                      <ArrowUpDown
                        class="w-4 h-4 {getSortIndicator(
                          'token',
                          tokensSortConfig
                        )}"
                      />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {#each tokensSortable.sortedItems as token}
                  <tr>
                    <td class="font-medium">{token.os}</td>
                    <td>{token.clientVersion}</td>
                    <td>{token.language}</td>
                    <td>{token.timezone}</td>
                    <td class="truncate max-w-xs text-base-content/50 text-xs">
                      <span class="tooltip" data-tip={token.token}>
                        {token.token.substring(0, 20)}...
                      </span>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {:else}
          <div class="text-center py-8 text-base-content/50">
            <p>No push token data found.</p>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
</style>
