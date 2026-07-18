import JSZip from "jszip";
import { get } from "svelte/store";
import { afterEach, describe, expect, it, vi } from "vitest";
import { appStore } from "./app";

function file(content: BlobPart, name: string, type: string): File {
  const value = new Blob([content], { type }) as File;
  Object.defineProperty(value, "name", { value: name });
  return value;
}

describe("app import report lifecycle", () => {
  afterEach(() => {
    appStore.resetData();
    vi.restoreAllMocks();
  });

  it("sets the report with imported data and clears it on reset or failure", async () => {
    const zip = new JSZip();
    zip.file(
      "user.json",
      JSON.stringify({ username: "fixture", fullname: "Fixture User" }),
    );
    const zipFile = file(
      await zip.generateAsync({ type: "arraybuffer" }),
      "export.zip",
      "application/zip",
    );

    await appStore.loadFiles(zipFile, null);
    expect(get(appStore.report)?.sections[0]).toMatchObject({
      section: "user",
      status: "recognized",
    });
    expect(get(appStore.data)).not.toBeNull();

    appStore.resetData();
    expect(get(appStore.report)).toBeNull();

    await appStore.loadFiles(
      file("not a zip", "invalid.txt", "text/plain"),
      null,
    );
    expect(get(appStore.report)).toBeNull();
  });
});
