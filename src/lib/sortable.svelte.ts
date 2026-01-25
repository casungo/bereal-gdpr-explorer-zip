type SortDirection = "ascending" | "descending";

interface SortConfig<T> {
	key: keyof T;
	direction: SortDirection;
}

export function createSortableData<T extends object>(
	itemsOrGetter: T[] | (() => T[]),
	initialConfig: SortConfig<T> | null = null,
) {
	let sortConfig = $state<SortConfig<T> | null>(initialConfig);

	const sortedItems = $derived.by(() => {
		const items = typeof itemsOrGetter === "function" ? (itemsOrGetter as () => T[])() : (itemsOrGetter as T[]);
		const sortableItems = [...items];
		const config = sortConfig;
		if (config !== null) {
			sortableItems.sort((a, b) => {
				const aValue = a[config.key];
				const bValue = b[config.key];

				if (aValue === undefined || aValue === null) return 1;
				if (bValue === undefined || bValue === null) return -1;

				// biome-ignore lint/suspicious/noExplicitAny: generic sorting needs any
				let valA: any = aValue;
				// biome-ignore lint/suspicious/noExplicitAny: generic sorting needs any
				let valB: any = bValue;

				if (typeof valA === "string" && typeof valB === "string") {
					valA = valA.toLowerCase();
					valB = valB.toLowerCase();
				}

				if (valA < valB) {
					return config.direction === "ascending" ? -1 : 1;
				}
				if (valA > valB) {
					return config.direction === "ascending" ? 1 : -1;
				}
				return 0;
			});
		}
		return sortableItems;
	});

	function requestSort(key: keyof T) {
		let direction: SortDirection = "ascending";
		const currentConfig = sortConfig;
		if (
			currentConfig &&
			currentConfig.key === key &&
			currentConfig.direction === "ascending"
		) {
			direction = "descending";
		}
		sortConfig = { key, direction };
	}

	return {
		get sortedItems() {
			return sortedItems;
		},
		get sortConfig() {
			return sortConfig;
		},
		requestSort,
	};
}
