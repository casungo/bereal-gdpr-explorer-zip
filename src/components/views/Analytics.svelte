<script lang="ts">
  import type { AnalyticsEvent } from "@/lib/types";
  import {
    aggregateAnalytics,
    normalizeAnalyticsTimestamp,
  } from "@/lib/analytics";
  import { createSortableData } from "@/lib/sortable.svelte.ts";
  import { exportToCsv } from "@/lib/export";
  import { ArrowUpDown, Download } from "@lucide/svelte";

  let { events = [] }: { events?: AnalyticsEvent[] } = $props();

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone,
  });
  const eventsSortable = createSortableData<AnalyticsEvent>(() => events);
  const eventsSortConfig = $derived(eventsSortable.sortConfig);
  const summary = $derived(aggregateAnalytics(events, timeZone));
  const maxHourlyCount = $derived(Math.max(1, ...summary.hourlyCounts));

  function displayTime(value: number) {
    const date = normalizeAnalyticsTimestamp(value);
    return date ? dateFormatter.format(date) : "Invalid Date";
  }

  function displayValue(value: string | undefined) {
    return value?.trim() || "Unknown";
  }

  function handleExport() {
    const dataToExport = eventsSortable.sortedItems.map((event) => ({
      event_type: event.event_type,
      event_time: displayTime(event.event_time),
      device_type: `${displayValue(event.device_type)} (${displayValue(event.platform)})`,
      location: `${displayValue(event.city)}, ${displayValue(event.country)}`,
    }));
    exportToCsv(dataToExport, "analytics_events.csv");
  }

  function getSortIndicator(
    key: string,
    currentConfig: { key: string; direction: string } | null,
  ) {
    if (!currentConfig || currentConfig.key !== key) return "opacity-50";
    return currentConfig.direction === "ascending" ? "" : "rotate-180";
  }
</script>

<div class="p-4 space-y-6">
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <div class="flex flex-wrap justify-between items-start gap-4 mb-4">
        <div>
          <h2 class="card-title">Analytics Events</h2>
          <p class="text-base-content/70">
            A local summary of {events.length} events. Times and active days use
            {timeZone}.
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

      {#if events.length === 0}
        <div class="text-center py-8 text-base-content/50">
          <p>No analytics file or events were found.</p>
        </div>
      {:else if summary.validTotal === 0}
        <div class="alert alert-warning">
          None of the {summary.invalidTotal} analytics events had a usable timestamp.
          The raw rows remain available below.
        </div>
      {:else}
        <div class="stats stats-vertical sm:stats-horizontal bg-base-200 mb-6">
          <div class="stat">
            <div class="stat-title">Usable events</div>
            <div class="stat-value text-primary">{summary.validTotal}</div>
          </div>
          <div class="stat">
            <div class="stat-title">Active local days</div>
            <div class="stat-value">{summary.activeDays}</div>
          </div>
        </div>

        {#if summary.invalidTotal > 0}
          <div class="alert alert-warning mb-6">
            {summary.invalidTotal}
            {summary.invalidTotal === 1 ? "event has" : "events have"} an invalid
            timestamp and were excluded from the summary.
          </div>
        {/if}

        <div class="grid lg:grid-cols-2 gap-6">
          <section>
            <h3 class="font-semibold mb-3">Top event types</h3>
            <ol class="space-y-2">
              {#each summary.topEventTypes as item}
                <li class="flex justify-between gap-4">
                  <span class="truncate">{item.label}</span>
                  <span class="badge badge-ghost">{item.count}</span>
                </li>
              {/each}
            </ol>
          </section>

          <section>
            <h3 class="font-semibold mb-3">Events by local hour</h3>
            <div class="hour-chart" aria-label="Event counts for each hour">
              {#each summary.hourlyCounts as count, hour}
                <div class="hour-column" title={`${hour}:00 — ${count}`}>
                  <div
                    class="hour-bar"
                    style:height={`${(count / maxHourlyCount) * 100}%`}
                  ></div>
                  <span>{hour % 6 === 0 ? hour : ""}</span>
                </div>
              {/each}
            </div>
          </section>

          <section>
            <h3 class="font-semibold mb-3">Platforms</h3>
            <ul class="space-y-2">
              {#each summary.platformCounts as item}
                <li class="flex justify-between">
                  <span>{item.label}</span><span>{item.count}</span>
                </li>
              {/each}
            </ul>
          </section>

          <section>
            <h3 class="font-semibold mb-3">Devices</h3>
            <ul class="space-y-2">
              {#each summary.deviceCounts as item}
                <li class="flex justify-between">
                  <span>{item.label}</span><span>{item.count}</span>
                </li>
              {/each}
            </ul>
          </section>
        </div>

        <details class="mt-6">
          <summary class="cursor-pointer font-semibold">
            Country counts (sensitive)
          </summary>
          <p class="text-sm text-base-content/60 my-3">
            These values come directly from the local analytics export.
          </p>
          <ul class="max-w-md space-y-2">
            {#each summary.countryCounts as item}
              <li class="flex justify-between">
                <span>{item.label}</span><span>{item.count}</span>
              </li>
            {/each}
          </ul>
        </details>
      {/if}
    </div>
  </div>

  {#if events.length > 0}
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h3 class="card-title">Raw source events</h3>
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
                        eventsSortConfig,
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
                        eventsSortConfig,
                      )}"
                    />
                  </button>
                </th>
                <th>Device</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {#each eventsSortable.sortedItems as event}
                <tr>
                  <td class="font-medium">{event.event_type}</td>
                  <td>{displayTime(event.event_time)}</td>
                  <td>
                    {displayValue(event.device_type)} ({displayValue(
                      event.platform,
                    )})
                  </td>
                  <td>
                    {displayValue(event.city)}, {displayValue(event.country)}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .hour-chart {
    display: grid;
    grid-template-columns: repeat(24, minmax(0, 1fr));
    align-items: end;
    gap: 0.2rem;
    height: 9rem;
  }

  .hour-column {
    display: grid;
    grid-template-rows: 1fr auto;
    align-items: end;
    height: 100%;
    min-width: 0;
    font-size: 0.65rem;
    text-align: center;
  }

  .hour-bar {
    width: 100%;
    min-height: 0.15rem;
    border-radius: 0.2rem 0.2rem 0 0;
    background: var(--color-primary);
  }
</style>
