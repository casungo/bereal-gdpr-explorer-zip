import { get, writable } from "svelte/store";
import { demoData, demoMedia } from "../demo-data";
import type { BeRealData, MediaMap, ProgressCallback } from "../types";
import { ArchiveParseError, parseBeRealZip } from "../zip-parser";

type ProgressInfo = { total: number; loaded: number; message: string };

interface AppStore {
	data: import("svelte/store").Writable<BeRealData | null>;
	media: import("svelte/store").Writable<MediaMap | null>;
	isLoading: import("svelte/store").Writable<boolean>;
	progress: import("svelte/store").Writable<ProgressInfo>;
	error: import("svelte/store").Writable<string | null>;
	loadFiles: (zipFile: File, gzFile: File | null) => Promise<void>;
	loadDemoData: () => void;
	resetData: () => void;
}

export function userMessageForArchiveError(error: unknown): string {
	if (!(error instanceof ArchiveParseError)) {
		return "An unknown error occurred during parsing.";
	}

	switch (error.code) {
		case "INPUT_TOO_LARGE":
		case "TOO_MANY_ENTRIES":
		case "ENTRY_TOO_LARGE":
		case "ARCHIVE_TOO_LARGE":
			return "This export exceeds the supported archive limits.";
		case "INVALID_FILE_TYPE":
			return "Invalid file format. Please select the correct BeReal export files.";
		case "INVALID_ANALYTICS":
			return "The analytics file appears to be corrupted or invalid.";
		case "INVALID_STRUCTURE":
			return "The files do not contain a supported BeReal data structure.";
		case "INVALID_ARCHIVE":
			return "The ZIP file appears to be corrupted or invalid. Please try again.";
	}
}

function createAppStore(): AppStore {
	const data = writable<BeRealData | null>(null);
	const media = writable<MediaMap | null>(null);
	const isLoading = writable<boolean>(false);
	const progress = writable<ProgressInfo>({
		total: 100,
		loaded: 0,
		message: "",
	});
	const error = writable<string | null>(null);

	async function loadFiles(zipFile: File, gzFile: File | null): Promise<void> {
		if (!zipFile) {
			error.set("Please select a ZIP file.");
			return;
		}

		if (!zipFile.name.endsWith(".zip")) {
			error.set("Please select a valid ZIP file.");
			return;
		}

		if (gzFile && !gzFile.name.endsWith(".gz")) {
			error.set("Please select a valid GZ file.");
			return;
		}

		isLoading.set(true);
		error.set(null);
		progress.set({ total: 100, loaded: 0, message: "Starting..." });

		try {
			const result = await parseBeRealZip(
				zipFile,
				gzFile,
				(p: Parameters<ProgressCallback>[0]) => {
					progress.set(p);
				},
			);

			if (!result || !result.data) {
				throw new Error("No valid data could be extracted from the files.");
			}

			data.set(result.data);
			media.set(result.media || {});
		} catch (e) {
			error.set(userMessageForArchiveError(e));
			data.set(null);
			media.set(null);
		} finally {
			isLoading.set(false);
		}
	}

	function resetData(): void {
		const currentMedia = get(media);
		if (currentMedia) {
			Object.values(currentMedia).forEach((url: string) => {
				if (typeof url === "string" && url.startsWith("blob:")) {
					URL.revokeObjectURL(url);
				}
			});
		}

		data.set(null);
		media.set(null);
		error.set(null);
		progress.set({ total: 100, loaded: 0, message: "" });
	}

	function loadDemoData(): void {
		resetData();
		data.set(demoData);
		media.set(demoMedia);
	}

	return {
		data,
		media,
		isLoading,
		progress,
		error,
		loadFiles,
		loadDemoData,
		resetData,
	};
}

export const appStore = createAppStore();
