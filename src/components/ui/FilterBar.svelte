<script lang="ts">
  import { format } from "date-fns";
  import {
    Calendar as CalendarIcon,
    ChevronsRight,
    ChevronsLeft,
    X,
    Download,
  } from "@lucide/svelte";

  export type SortOption = { value: string; label: string };

  interface Props {
    sortOptions: SortOption[];
    sort: string;
    onSortChange: (value: string) => void;
    dateRange?: { from: Date; to?: Date };
    onDateRangeChange: (range?: { from: Date; to?: Date }) => void;
    visibility?: string;
    onVisibilityChange?: (value: string) => void;
    onCollapseAll: () => void;
    onExpandAll: () => void;
    onDownloadAll: () => void;
    showVisibilityFilter: boolean;
  }

  let {
    sortOptions,
    sort,
    onSortChange,
    dateRange,
    onDateRangeChange,
    visibility = "all",
    onVisibilityChange,
    onCollapseAll,
    onExpandAll,
    onDownloadAll,
    showVisibilityFilter,
  }: Props = $props();

  let fromDateInput: HTMLInputElement;
  let toDateInput: HTMLInputElement;

  function handleSortChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    onSortChange(target.value);
  }

  function handleVisibilityChange(e: Event) {
    if (!onVisibilityChange) return;
    const target = e.target as HTMLSelectElement;
    onVisibilityChange(target.value);
  }

  function handleDateFromChange(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.value) {
      const fromDate = new Date(target.value);
      onDateRangeChange({
        from: fromDate,
        to: dateRange?.to,
      });
    }
  }

  function handleDateToChange(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.value && dateRange?.from) {
      const toDate = new Date(target.value);
      onDateRangeChange({
        from: dateRange.from,
        to: toDate,
      });
    }
  }

  function clearDateRange() {
    onDateRangeChange(undefined);
    if (fromDateInput) fromDateInput.value = "";
    if (toDateInput) toDateInput.value = "";
  }

  function formatDateRange() {
    if (!dateRange?.from) return "Pick a date range";

    if (dateRange.to) {
      return `${format(dateRange.from, "LLL dd, y")} - ${format(
        dateRange.to,
        "LLL dd, y"
      )}`;
    }
    return format(dateRange.from, "LLL dd, y");
  }
</script>

<div class="card bg-base-100 shadow-sm border border-base-300">
  <div class="card-body p-4">
    <div class="flex flex-wrap items-center gap-3">
      <div class="form-control">
        <select
          class="select select-bordered select-sm w-44"
          value={sort}
          onchange={handleSortChange}
        >
          <option disabled>Sort by</option>
          {#each sortOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </div>

      {#if showVisibilityFilter && onVisibilityChange}
        <div class="form-control">
          <select
            class="select select-bordered select-sm w-48"
            value={visibility}
            onchange={handleVisibilityChange}
          >
            <option value="all">All Audiences</option>
            <option value="friends">Friends Only</option>
            <option value="friends-of-friends">Friends of Friends</option>
          </select>
        </div>
      {/if}

      <div class="dropdown">
        <div tabindex="0" role="button" class="btn btn-outline btn-sm">
          <CalendarIcon class="w-4 h-4 mr-2" />
          {formatDateRange()}
        </div>
        <div
          class="dropdown-content menu bg-base-100 rounded-box z-[1] w-80 p-4 shadow-lg border border-base-300"
        >
          <div class="space-y-3">
            <div class="text-sm font-medium">Select Date Range</div>
            <div class="grid grid-cols-2 gap-3">
              <div class="form-control">
                <label for="from-date" class="label">
                  <span class="label-text text-xs">From</span>
                </label>
                <input
                  id="from-date"
                  bind:this={fromDateInput}
                  type="date"
                  class="input input-bordered input-sm"
                  value={dateRange?.from
                    ? format(dateRange.from, "yyyy-MM-dd")
                    : ""}
                  onchange={handleDateFromChange}
                />
              </div>
              <div class="form-control">
                <label for="to-date" class="label">
                  <span class="label-text text-xs">To</span>
                </label>
                <input
                  id="to-date"
                  bind:this={toDateInput}
                  type="date"
                  class="input input-bordered input-sm"
                  value={dateRange?.to
                    ? format(dateRange.to, "yyyy-MM-dd")
                    : ""}
                  onchange={handleDateToChange}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {#if dateRange}
        <button
          class="btn btn-ghost btn-sm btn-circle"
          onclick={clearDateRange}
          title="Clear date range"
        >
          <X class="w-4 h-4" />
        </button>
      {/if}

      <div class="flex-grow"></div>

      <div class="flex items-center gap-2">
        <button class="btn btn-outline btn-sm" onclick={onDownloadAll}>
          <Download class="w-4 h-4 mr-2" />
          Download All
        </button>

        <button
          class="btn btn-ghost btn-sm"
          onclick={onExpandAll}
          title="Expand All"
        >
          <ChevronsRight class="w-4 h-4 mr-2" />
          Expand All
        </button>

        <button
          class="btn btn-ghost btn-sm"
          onclick={onCollapseAll}
          title="Collapse All"
        >
          <ChevronsLeft class="w-4 h-4 mr-2" />
          Collapse All
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .dropdown-content {
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 4px;
  }
</style>
