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
		resultSummary?: string;
		downloadDisabled?: boolean;
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
		resultSummary,
		downloadDisabled = false,
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
				"LLL dd, y",
			)}`;
		}
		return format(dateRange.from, "LLL dd, y");
	}
</script>

<div class="rounded-lg border border-base-300 bg-base-100 p-3 shadow-sm sm:p-4">
	<div class="flex flex-col gap-3 xl:flex-row xl:items-center">
		<div
			class="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(11rem,14rem)_minmax(12rem,15rem)_auto]"
		>
			<div class="form-control min-w-0">
				<select
					class="select select-bordered select-sm w-full"
					value={sort}
					onchange={handleSortChange}
					aria-label="Sort items"
				>
					<option disabled>Sort by</option>
					{#each sortOptions as option}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
			</div>

			{#if showVisibilityFilter && onVisibilityChange}
				<div class="form-control min-w-0">
					<select
						class="select select-bordered select-sm w-full"
						value={visibility}
						onchange={handleVisibilityChange}
						aria-label="Filter audience"
					>
						<option value="all">All Audiences</option>
						<option value="friends">Friends Only</option>
						<option value="friends-of-friends">Friends of Friends</option>
					</select>
				</div>
			{/if}

			<div class="dropdown sm:col-span-2 lg:col-span-1">
				<div
					tabindex="0"
					role="button"
					class="btn btn-outline btn-sm w-full justify-start"
				>
					<CalendarIcon class="w-4 h-4 shrink-0" />
					<span class="truncate">{formatDateRange()}</span>
				</div>
				<div
					class="dropdown-content menu bg-base-100 rounded-box z-[1] w-[min(20rem,calc(100vw-2rem))] p-4 shadow-lg border border-base-300"
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
					class="btn btn-ghost btn-sm btn-circle self-start"
					onclick={clearDateRange}
					title="Clear date range"
					aria-label="Clear date range"
				>
					<X class="w-4 h-4" />
				</button>
			{/if}

			{#if resultSummary}
				<div class="text-sm text-base-content/60 sm:col-span-2 lg:col-span-3">
					{resultSummary}
				</div>
			{/if}
		</div>

		<div class="grid grid-cols-1 gap-2 sm:grid-cols-3 xl:w-auto">
			<button
				class="btn btn-outline btn-sm w-full"
				onclick={onDownloadAll}
				disabled={downloadDisabled}
			>
				<Download class="w-4 h-4 shrink-0" />
				<span class="truncate">Download All</span>
			</button>

			<button
				class="btn btn-ghost btn-sm w-full"
				onclick={onExpandAll}
				title="Expand All"
				aria-label="Expand all"
			>
				<ChevronsRight class="w-4 h-4 shrink-0" />
				<span class="truncate">Expand All</span>
			</button>

			<button
				class="btn btn-ghost btn-sm w-full"
				onclick={onCollapseAll}
				title="Collapse All"
				aria-label="Collapse all"
			>
				<ChevronsLeft class="w-4 h-4 shrink-0" />
				<span class="truncate">Collapse All</span>
			</button>
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
