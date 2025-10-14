import { writable, get } from "svelte/store";
import { parseBeRealZip } from "@lib/zip-parser";
import type { BeRealData, MediaMap, ProgressCallback } from "@lib/types";

type ProgressInfo = { total: number; loaded: number; message: string };

interface AppStore {
  data: import("svelte/store").Writable<BeRealData | null>;
  media: import("svelte/store").Writable<MediaMap | null>;
  isLoading: import("svelte/store").Writable<boolean>;
  progress: import("svelte/store").Writable<ProgressInfo>;
  error: import("svelte/store").Writable<string | null>;
  loadFiles: (zipFile: File, gzFile: File) => Promise<void>;
  resetData: () => void;
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

  async function loadFiles(zipFile: File, gzFile: File): Promise<void> {
    if (!zipFile || !gzFile) {
      error.set("Please select both a ZIP file and a GZ file.");
      return;
    }

    if (!zipFile.name.endsWith(".zip")) {
      error.set("Please select a valid ZIP file.");
      return;
    }

    if (!gzFile.name.endsWith(".gz")) {
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
        }
      );

      if (!result || !result.data) {
        throw new Error("No valid data could be extracted from the files.");
      }

      data.set(result.data);
      media.set(result.media || {});
    } catch (e) {
      const errorMessage =
        e instanceof Error
          ? e.message
          : "An unknown error occurred during parsing.";

      let userMessage = errorMessage;
      if (errorMessage.includes("File size exceeds")) {
        userMessage = "File is too large. Please use files smaller than 500MB.";
      } else if (errorMessage.includes("Invalid file type")) {
        userMessage =
          "Invalid file format. Please select the correct BeReal export files.";
      } else if (errorMessage.includes("Failed to read file")) {
        userMessage =
          "Failed to read the file. Please try again or select a different file.";
      } else if (errorMessage.includes("Could not access zip contents")) {
        userMessage =
          "The ZIP file appears to be corrupted or invalid. Please try again.";
      }

      error.set(userMessage);
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

  return {
    data,
    media,
    isLoading,
    progress,
    error,
    loadFiles,
    resetData,
  };
}

export const appStore = createAppStore();
