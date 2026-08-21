import JSZip from "jszip";
import { gzip } from "pako";
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

  it("accepts uppercase export and analytics extensions", async () => {
    const zip = new JSZip();
    zip.file(
      "user.json",
      JSON.stringify({ username: "fixture", fullname: "Fixture User" }),
    );
    const zipFile = file(
      await zip.generateAsync({ type: "arraybuffer" }),
      "BEREAL-EXPORT.ZIP",
      "application/zip",
    );
    const analyticsFile = file(
      gzip(JSON.stringify({ event_type: "opened", event_time: 1 })),
      "ANALYTICS.JSON.GZ",
      "application/gzip",
    );

    await appStore.loadFiles(zipFile, analyticsFile);

    expect(get(appStore.data)?.user?.username).toBe("fixture");
    expect(get(appStore.data)?.analytics).toHaveLength(1);
    expect(get(appStore.error)).toBeNull();
  });

  it("loads a populated demo across every dashboard collection", () => {
    appStore.loadDemoData();
    const data = get(appStore.data);

    expect(data).not.toBeNull();
    for (const section of [
      "friends",
      "friendRequests",
      "posts",
      "memories",
      "comments",
      "realmojis",
      "conversations",
      "analytics",
      "pushTokens",
      "terms",
    ] as const) {
      expect(data?.[section]?.length, section).toBeGreaterThanOrEqual(10);
    }
    expect(Object.keys(data?.pushSettings ?? {})).toHaveLength(10);
  });
});
