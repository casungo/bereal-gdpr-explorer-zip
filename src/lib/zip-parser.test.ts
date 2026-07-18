import JSZip from "jszip";
import pako from "pako";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { userMessageForArchiveError } from "./stores/app";
import { ArchiveParseError, parseBeRealZip } from "./zip-parser";

const bucketId = "abcdefghijklmnopqrstuvwxyz";

function makeFile(content: BlobPart, name: string, type: string): File {
  const file = new Blob([content], { type }) as File;
  Object.defineProperty(file, "name", { value: name });
  return file;
}

interface ArchiveOptions {
  wrapperPrefix?: string;
  sections?: Record<string, unknown>;
  media?: Record<string, Uint8Array>;
  absoluteSections?: Record<string, unknown>;
  rawSections?: Record<string, string>;
  leadingDirectories?: string[];
  analyticsLines?: unknown[];
  entryCount?: number;
}

async function makeArchive({
  wrapperPrefix,
  sections = {},
  media = {},
  absoluteSections = {},
  rawSections = {},
  leadingDirectories = [],
  analyticsLines,
  entryCount = 0,
}: ArchiveOptions = {}): Promise<{ zipFile: File; gzFile: File | null }> {
  const zip = new JSZip();
  for (const path of leadingDirectories) {
    zip.folder(path);
  }
  const root = wrapperPrefix ? zip.folder(wrapperPrefix) : zip;

  if (!root) {
    throw new Error("Could not create test zip folder");
  }

  for (const [path, value] of Object.entries(sections)) {
    root.file(path, JSON.stringify(value));
  }
  for (const [path, value] of Object.entries(media)) {
    root.file(path, value);
  }
  for (const [path, value] of Object.entries(absoluteSections)) {
    zip.file(path, JSON.stringify(value));
  }
  for (const [path, value] of Object.entries(rawSections)) {
    root.file(path, value);
  }
  for (let index = 0; index < entryCount; index++) {
    root.file(`entry-${index}`, "");
  }

  const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });
  const gzFile = analyticsLines
    ? makeFile(
        pako.gzip(
          analyticsLines.map((line) => JSON.stringify(line)).join("\n"),
        ),
        "analytics.json.gz",
        "application/gzip",
      )
    : null;

  return {
    zipFile: makeFile(zipBuffer, "bereal-export.zip", "application/zip"),
    gzFile,
  };
}

function withReportedSize(file: File, size: number): File {
  Object.defineProperty(file, "size", { value: size });
  return file;
}

function user(platform: "android" | "ios" = "android") {
  return {
    id: "user-1",
    username: "alice",
    fullname: "Alice Example",
    createdAt: "2026-01-01T10:00:00.000Z",
    platform,
  };
}

function image(path: string) {
  return {
    path,
    bucket: "photos",
    height: 1200,
    width: 900,
    mediaType: "image",
    mimeType: "image/jpeg",
  };
}

describe("parseBeRealZip", () => {
  beforeEach(() => {
    let objectUrlIndex = 0;
    vi.spyOn(URL, "createObjectURL").mockImplementation(
      () => `blob:media-${++objectUrlIndex}`,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("parses a wrapped export without an analytics sidecar", async () => {
    const archive = await makeArchive({
      wrapperPrefix: "bereal-export",
      sections: {
        "user.json": {
          ...user(),
          profilePicture: {
            path: `/profile-pictures/${bucketId}/avatar.jpg`,
            bucket: "profile",
            height: "100",
            width: "100",
          },
        },
        "friends.json": [
          {
            friendUsername: "bob",
            friendFullname: "Bob Example",
            createdAt: "2026-01-02T10:00:00.000Z",
          },
        ],
        "posts.json": [
          {
            id: "post-1",
            primary: image(`/Photos/${bucketId}/primary.jpg`),
            secondary: image(`Photos/${bucketId}/secondary.jpg`),
            btsMedia: {
              ...image(`Photos/${bucketId}/bts.mp4`),
              mediaType: "video",
              mimeType: "video/mp4",
            },
            takenAt: "2026-01-03T10:00:00.000Z",
          },
        ],
        "memories.json": [
          {
            id: "memory-1",
            frontImage: image(`Photos/${bucketId}/memory-front.jpg`),
            backImage: image(`Photos/${bucketId}/memory-back.jpg`),
            isLate: true,
            date: "2026-01-04",
            takenTime: "2026-01-04T10:05:00.000Z",
            berealMoment: "2026-01-04T10:00:00.000Z",
          },
        ],
      },
      media: {
        [`Photos/${bucketId}/primary.jpg`]: new Uint8Array([1]),
        [`Photos/${bucketId}/secondary.jpg`]: new Uint8Array([2]),
        [`Photos/${bucketId}/bts.mp4`]: new Uint8Array([3]),
        [`Photos/${bucketId}/memory-front.jpg`]: new Uint8Array([4]),
        [`Photos/${bucketId}/memory-back.jpg`]: new Uint8Array([5]),
        [`profile-pictures/${bucketId}/avatar.jpg`]: new Uint8Array([6]),
      },
    });

    const result = await parseBeRealZip(
      archive.zipFile,
      archive.gzFile,
      vi.fn(),
    );

    expect(result.data.user?.username).toBe("alice");
    expect(result.data.friends).toHaveLength(1);
    expect(result.data.posts?.[0]).toMatchObject({
      id: "post-1",
      primary: { path: "Photos/primary.jpg" },
      secondary: { path: "Photos/secondary.jpg" },
      video: { path: "Photos/bts.mp4" },
    });
    expect(result.data.memories?.[0]).toMatchObject({
      id: "memory-1",
      primary: { path: "Photos/memory-front.jpg" },
      lateInSeconds: 300,
    });
    expect(result.media["profile-pictures/avatar.jpg"]).toBeDefined();
    expect(result.data.analytics).toEqual([]);
  });

  it("parses flat metadata, conversations, and root media together", async () => {
    const mediaPath = `Photos/${bucketId}/flat.jpg`;
    const archive = await makeArchive({
      sections: {
        "user.json": user(),
        "conversations/thread-flat/chat_log.json": {
          messages: [
            {
              userId: "user-1",
              message: "flat message",
              createdAt: "2026-01-05T10:01:00.000Z",
            },
          ],
        },
      },
      media: { [mediaPath]: new Uint8Array([1]) },
    });

    const { data, media } = await parseBeRealZip(
      archive.zipFile,
      archive.gzFile,
      vi.fn(),
    );

    expect(data.user?.username).toBe("alice");
    expect(data.conversations?.[0]?.messages[0]?.content).toBe("flat message");
    expect(media[mediaPath]).toBe(media["Photos/flat.jpg"]);
  });

  it("ignores a root __MACOSX directory beside a wrapped export", async () => {
    const archive = await makeArchive({
      leadingDirectories: ["__MACOSX"],
      wrapperPrefix: "bereal-export",
      sections: { "user.json": user() },
    });

    await expect(
      parseBeRealZip(archive.zipFile, archive.gzFile, vi.fn()),
    ).resolves.toMatchObject({ data: { user: { username: "alice" } } });
  });

  it("does not let leading directory entries override flat metadata", async () => {
    const archive = await makeArchive({
      leadingDirectories: ["Photos", "profile-pictures"],
      sections: { "user.json": user() },
    });

    await expect(
      parseBeRealZip(archive.zipFile, archive.gzFile, vi.fn()),
    ).resolves.toMatchObject({ data: { user: { username: "alice" } } });
  });

  it("rejects archives without supported metadata", async () => {
    const archive = await makeArchive({
      media: { "Photos/photo.jpg": new Uint8Array([1]) },
    });

    await expect(
      parseBeRealZip(archive.zipFile, archive.gzFile, vi.fn()),
    ).rejects.toThrow("No supported BeReal metadata files were found.");
  });

  it("rejects two equally complete wrapped exports", async () => {
    const archive = await makeArchive({
      absoluteSections: {
        "export-one/user.json": user(),
        "export-two/user.json": { ...user(), username: "bob" },
      },
    });

    await expect(
      parseBeRealZip(archive.zipFile, archive.gzFile, vi.fn()),
    ).rejects.toThrow(
      "Multiple BeReal export roots contain the same amount of supported metadata.",
    );
  });

  it("leaves every optional JSON section absent when the archive omits it", async () => {
    const archive = await makeArchive({
      wrapperPrefix: "bereal-export",
      sections: {
        "user.json": { username: "alice", fullname: "Alice Example" },
      },
    });
    const { data } = await parseBeRealZip(
      archive.zipFile,
      archive.gzFile,
      vi.fn(),
    );

    expect(data).toMatchObject({
      analytics: [],
      conversations: [],
      user: { username: "alice" },
    });
    expect(data.friends).toBeUndefined();
    expect(data.posts).toBeUndefined();
    expect(data.memories).toBeUndefined();
    expect(data.user).toMatchObject({
      username: "alice",
      createdAt: undefined,
      birthdate: undefined,
      platform: undefined,
      creationDate: undefined,
    });
  });

  it("warns about malformed optional records without including their values", async () => {
    const archive = await makeArchive({
      sections: {
        "user.json": user(),
        "friends.json": [
          {
            friendUsername: "bob",
            friendFullname: "Bob Example",
            createdAt: "2026-01-02T10:00:00.000Z",
          },
          {
            friendUsername: "private-invalid-record",
            friendFullname: "Private Invalid Record",
            createdAt: "not-a-date",
          },
        ],
        "friend-requests.json": {},
        "terms.json": [
          {
            code: "terms",
            status: "accepted",
            termUrl: "https://example.com/terms",
          },
          { code: "invalid", status: "accepted", termUrl: 42 },
        ],
      },
    });

    const result = await parseBeRealZip(
      archive.zipFile,
      archive.gzFile,
      vi.fn(),
    );

    expect(result.data.friends).toHaveLength(1);
    expect(result.data.terms).toHaveLength(1);
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        { section: "friends", code: "INVALID_RECORDS" },
        { section: "friendRequests", code: "INVALID_SHAPE" },
        { section: "terms", code: "INVALID_RECORDS" },
      ]),
    );
    expect(JSON.stringify(result.warnings)).not.toContain(
      "private-invalid-record",
    );
  });

  it("reports malformed optional JSON without exposing its contents", async () => {
    const archive = await makeArchive({
      sections: { "user.json": user() },
      rawSections: { "comments.json": '{"private":"unterminated"' },
    });

    const result = await parseBeRealZip(
      archive.zipFile,
      archive.gzFile,
      vi.fn(),
    );

    expect(result.warnings).toContainEqual({
      section: "comments",
      code: "MALFORMED_JSON",
    });
    expect(JSON.stringify(result.warnings)).not.toContain("private");
  });

  it("rejects invalid core records instead of dereferencing null media", async () => {
    const archive = await makeArchive({
      sections: {
        "posts.json": [
          {
            primary: null,
            secondary: image("Photos/secondary.jpg"),
            takenAt: "2026-01-03T10:00:00.000Z",
          },
        ],
      },
    });

    await expect(
      parseBeRealZip(archive.zipFile, archive.gzFile, vi.fn()),
    ).rejects.toMatchObject({ code: "INVALID_STRUCTURE" });
  });

  it("keeps comments without inventing an absent user or timestamp", async () => {
    const archive = await makeArchive({
      sections: {
        "posts.json": [],
        "comments.json": [{ postId: "post-1", content: "hello" }],
      },
    });

    const result = await parseBeRealZip(
      archive.zipFile,
      archive.gzFile,
      vi.fn(),
    );

    expect(result.data.user).toBeUndefined();
    expect(result.data.comments).toEqual([
      { id: "comment-0", postId: "post-1", text: "hello" },
    ]);
  });

  it("distinguishes valid empty arrays and preserves numeric zero", async () => {
    const archive = await makeArchive({
      sections: {
        "posts.json": [
          {
            primary: image("Photos/primary.jpg"),
            secondary: image("Photos/secondary.jpg"),
            takenAt: "2026-01-03T10:00:00.000Z",
            retakeCounter: 0,
          },
        ],
        "friends.json": [],
        "comments.json": [],
        "terms.json": [],
      },
    });

    const result = await parseBeRealZip(
      archive.zipFile,
      archive.gzFile,
      vi.fn(),
    );

    expect(result.data.posts?.[0]?.retakeCounter).toBe(0);
    expect(result.data.friends).toEqual([]);
    expect(result.data.comments).toEqual([]);
    expect(result.data.terms).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it.each([
    ["android", "Android", 2],
    ["ios", "iOS", 1],
  ] as const)("maps the %s platform", async (platform, device, platformId) => {
    const archive = await makeArchive({
      sections: { "user.json": user(platform) },
    });
    const { data } = await parseBeRealZip(
      archive.zipFile,
      archive.gzFile,
      vi.fn(),
    );

    expect(data.user).toMatchObject({ device, platform: platformId });
  });

  it("creates media aliases with and without bucket path segments", async () => {
    const bucketPath = `Photos/${bucketId}/bucket.jpg`;
    const plainPath = "Photos/plain.jpg";
    const archive = await makeArchive({
      wrapperPrefix: "bereal-export",
      sections: { "user.json": user() },
      media: {
        [bucketPath]: new Uint8Array([1]),
        [plainPath]: new Uint8Array([2]),
      },
    });

    const { media } = await parseBeRealZip(
      archive.zipFile,
      archive.gzFile,
      vi.fn(),
    );

    expect(URL.createObjectURL).toHaveBeenCalledTimes(2);
    expect(media[`bereal-export/${bucketPath}`]).toBe(media[bucketPath]);
    expect(media["Photos/bucket.jpg"]).toBe(media[bucketPath]);
    expect(media[`bereal-export/${plainPath}`]).toBe(media[plainPath]);
    expect(media[bucketPath]).not.toBe(media[plainPath]);
  });

  it("orders conversation messages from oldest to newest", async () => {
    const archive = await makeArchive({
      wrapperPrefix: "bereal-export",
      sections: {
        "user.json": user(),
        "conversations/thread-1/chat_log.json": {
          participants: [{ id: "user-1", username: "alice" }],
          messages: [
            {
              userId: "user-1",
              message: "ordinary Latin",
              createdAt: "2026-01-05T10:00:00.000Z",
            },
            {
              userId: "user-1",
              message: "你好",
              createdAt: "2026-01-05T10:01:00.000Z",
            },
            {
              userId: "user-1",
              message: "مرحبا",
              createdAt: "2026-01-05T10:02:00.000Z",
            },
            {
              userId: "user-1",
              message: "😀✨",
              createdAt: "2026-01-05T10:03:00.000Z",
            },
            {
              userId: "user-1",
              message: "",
              createdAt: "2026-01-05T10:04:00.000Z",
              media: {
                path: "conversations/shared.jpg",
                width: 640,
                height: 480,
                mediaType: "image",
              },
            },
            {
              userId: "user-1",
              message: "newer",
              createdAt: "2026-01-05T10:06:00.000Z",
            },
            {
              userId: "user-1",
              message: "older",
              createdAt: "2026-01-05T10:05:00.000Z",
            },
          ],
        },
      },
    });

    const { data } = await parseBeRealZip(
      archive.zipFile,
      archive.gzFile,
      vi.fn(),
    );

    expect(data.conversations?.[0]?.messages.map((m) => m.content)).toEqual([
      "ordinary Latin",
      "你好",
      "مرحبا",
      "😀✨",
      "",
      "older",
      "newer",
    ]);
    expect(data.conversations?.[0]?.messages[4]?.media).toMatchObject({
      path: "conversations/shared.jpg",
      type: "image",
    });
  });

  it("reports progress above zero and finishes at 100", async () => {
    const archive = await makeArchive({
      sections: { "user.json": user() },
      analyticsLines: [{ event_type: "app_open", event_time: 1 }],
    });
    const onProgress = vi.fn();

    const { data } = await parseBeRealZip(
      archive.zipFile,
      archive.gzFile,
      onProgress,
    );

    const updates = onProgress.mock.calls.map(([progress]) => progress.loaded);
    expect(updates[0]).toBeGreaterThan(0);
    expect(updates.at(-1)).toBe(100);
    expect(data.analytics).toEqual([{ event_type: "app_open", event_time: 1 }]);
  });

  it("filters malformed analytics records with a value-free warning", async () => {
    const archive = await makeArchive({
      sections: { "user.json": user() },
      analyticsLines: [
        { event_type: "app_open", event_time: 1 },
        { event_type: 42, event_time: 2, private: "do-not-report" },
      ],
    });

    const result = await parseBeRealZip(
      archive.zipFile,
      archive.gzFile,
      vi.fn(),
    );

    expect(result.data.analytics).toEqual([
      { event_type: "app_open", event_time: 1 },
    ]);
    expect(result.warnings).toContainEqual({
      section: "analytics",
      code: "INVALID_RECORDS",
    });
    expect(JSON.stringify(result.warnings)).not.toContain("do-not-report");
  });

  it("accepts compressed inputs exactly at their byte limits", async () => {
    const archive = await makeArchive({
      sections: { "user.json": user() },
      analyticsLines: [],
    });
    withReportedSize(archive.zipFile, 500 * 1024 * 1024);
    withReportedSize(archive.gzFile!, 100 * 1024 * 1024);

    await expect(
      parseBeRealZip(archive.zipFile, archive.gzFile, vi.fn()),
    ).resolves.toMatchObject({ data: { user: { username: "alice" } } });
  });

  it("rejects a compressed input one byte over its limit before extraction", async () => {
    const archive = await makeArchive({
      media: { "Photos/photo.jpg": new Uint8Array([1]) },
    });
    withReportedSize(archive.zipFile, 500 * 1024 * 1024 + 1);

    await expect(
      parseBeRealZip(archive.zipFile, archive.gzFile, vi.fn()),
    ).rejects.toMatchObject({ code: "INPUT_TOO_LARGE" });
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it("rejects an archive one entry over its limit before extraction", async () => {
    const archive = await makeArchive({ entryCount: 20_001 });

    await expect(
      parseBeRealZip(archive.zipFile, archive.gzFile, vi.fn()),
    ).rejects.toMatchObject({ code: "TOO_MANY_ENTRIES" });
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it("categorizes invalid gzip data without exposing a filename", async () => {
    const archive = await makeArchive();
    const invalidGzip = makeFile(
      "not gzip",
      "private-analytics.json.gz",
      "application/gzip",
    );

    const error = await parseBeRealZip(
      archive.zipFile,
      invalidGzip,
      vi.fn(),
    ).catch((caught: unknown) => caught);
    expect(error).toMatchObject({ code: "INVALID_ANALYTICS" });
    expect((error as Error).message).not.toContain("private-analytics");
  });

  it("revokes object URLs when later media extraction aborts", async () => {
    const archive = await makeArchive({
      wrapperPrefix: "bereal-export",
      sections: { "user.json": user() },
      media: {
        "Photos/first.jpg": new Uint8Array([1]),
        "Photos/second.jpg": new Uint8Array([2]),
      },
    });
    vi.mocked(URL.createObjectURL)
      .mockImplementationOnce(() => "blob:created-before-failure")
      .mockImplementationOnce(() => {
        throw new Error("browser allocation failed");
      });
    const revokeObjectUrl = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => undefined);

    await expect(
      parseBeRealZip(archive.zipFile, archive.gzFile, vi.fn()),
    ).rejects.toMatchObject({ code: "INVALID_ARCHIVE" });
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:created-before-failure");
  });

  it("maps stable parser error codes to UI categories", () => {
    expect(
      userMessageForArchiveError(
        new ArchiveParseError("ENTRY_TOO_LARGE", "internal detail"),
      ),
    ).toBe("This export exceeds the supported archive limits.");
    expect(
      userMessageForArchiveError(
        new ArchiveParseError("INVALID_ANALYTICS", "internal detail"),
      ),
    ).toBe("The analytics file appears to be corrupted or invalid.");
    expect(
      userMessageForArchiveError(
        new ArchiveParseError("INVALID_STRUCTURE", "internal detail"),
      ),
    ).toBe("The files do not contain a supported BeReal data structure.");
  });

  it("rejects a non-gzip analytics sidecar", async () => {
    const archive = await makeArchive({ sections: { "user.json": user() } });

    await expect(
      parseBeRealZip(
        archive.zipFile,
        makeFile("{}", "analytics.json", "application/json"),
        vi.fn(),
      ),
    ).rejects.toThrow("Second file must be a .gz file");
  });
});
