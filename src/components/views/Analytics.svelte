<script lang="ts">
  import type { AnalyticsEvent } from "@lib/types";
  import { createSortableData } from "@lib/sortable.svelte.ts";
  import { exportToCsv } from "@lib/export";
  import { format, isValid } from "date-fns";
  import { ArrowUpDown, Download } from "@lucide/svelte";

  let { events = [] } = $props();

  const eventsSortable = createSortableData<AnalyticsEvent>(events);
  const eventsSortConfig = $derived(eventsSortable.sortConfig);

  function handleExport() {
    const dataToExport = eventsSortable.sortedItems.map((event) => ({
      event_type: event.event_type,
      event_time: isValid(new Date(event.event_time))
        ? format(new Date(event.event_time), "PPpp")
        : "Invalid Date",
      device_type: `${event.device_type} (${event.platform})`,
      location: `${event.city}, ${event.country}`,
    }));
    exportToCsv(dataToExport, "analytics_events.csv");
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
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <div class="flex justify-between items-center mb-4">
        <div>
          <h2 class="card-title">Analytics Events</h2>
          <p class="text-base-content/70">
            A log of {events.length} tracked events from your usage.
          </p>
        </div>
        <button
          class="btn btn-outline btn-sm"
          onclick={handleExport}
          disabled={events.length === 0}
        >
          <Download class="w-4 h-4 mr-2" />
          Export CSV
        </button>
      </div>

      {#if events.length > 0}
        <div class="overflow-x-auto">
          <table class="table table-zebra w-full">
            <thead>
              <tr>
                <th>
                  <button
                    class="btn btn-ghost btn-sm p-0 font-bold"
                    onclick={() => eventsSortable.requestSort("event_type")}
                  >
                    Event Type
                    <ArrowUpDown
                      class="w-4 h-4 {getSortIndicator(
                        'event_type',
                        eventsSortConfig
                      )}"
                    />
                  </button>
                </th>
                <th>
                  <button
                    class="btn btn-ghost btn-sm p-0 font-bold"
                    onclick={() => eventsSortable.requestSort("event_time")}
                  >
                    Time
                    <ArrowUpDown
                      class="w-4 h-4 {getSortIndicator(
                        'event_time',
                        eventsSortConfig
                      )}"
                    />
                  </button>
                </th>
                <th>
                  <button
                    class="btn btn-ghost btn-sm p-0 font-bold"
                    onclick={() => eventsSortable.requestSort("device_type")}
                  >
                    Device
                    <ArrowUpDown
                      class="w-4 h-4 {getSortIndicator(
                        'device_type',
                        eventsSortConfig
                      )}"
                    />
                  </button>
                </th>
                <th>
                  <button
                    class="btn btn-ghost btn-sm p-0 font-bold"
                    onclick={() => eventsSortable.requestSort("city")}
                  >
                    Location
                    <ArrowUpDown
                      class="w-4 h-4 {getSortIndicator(
                        'city',
                        eventsSortConfig
                      )}"
                    />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {#each eventsSortable.sortedItems as event}
                {@const eventTimeObj = new Date(event.event_time)}
                {@const formattedEventTime = isValid(eventTimeObj)
                  ? format(eventTimeObj, "PPpp")
                  : "Invalid Date"}
                <tr>
                  <td class="font-medium">{event.event_type}</td>
                  <td>{formattedEventTime}</td>
                  <td>{event.device_type} ({event.platform})</td>
                  <td>{event.city}, {event.country}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <div class="text-center py-8 text-base-content/50">
          <p>No analytics data found.</p>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
</style>
