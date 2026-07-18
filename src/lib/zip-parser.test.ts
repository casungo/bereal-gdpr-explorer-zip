import JSZip from "jszip";
import pako from "pako";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseBeRealZip } from "./zip-parser";

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
	analyticsLines?: unknown[];
}

async function makeArchive({
	wrapperPrefix,
	sections = {},
	media = {},
	analyticsLines,
}: ArchiveOptions = {}): Promise<{ zipFile: File; gzFile: File | null }> {
	const zip = new JSZip();
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

	const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });
	const gzFile = analyticsLines
		? makeFile(
				pako.gzip(analyticsLines.map((line) => JSON.stringify(line)).join("\n")),
				"analytics.json.gz",
				"application/gzip",
			)
		: null;

	return {
		zipFile: makeFile(zipBuffer, "bereal-export.zip", "application/zip"),
		gzFile,
	};
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

	it("leaves every optional JSON section absent when the archive omits it", async () => {
		const archive = await makeArchive({ wrapperPrefix: "bereal-export" });
		const { data } = await parseBeRealZip(
			archive.zipFile,
			archive.gzFile,
			vi.fn(),
		);

		expect(data).toEqual({ analytics: [], conversations: [] });
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
				"conversations/thread-1/chat_log.json": {
					participants: [{ id: "user-1", username: "alice" }],
					messages: [
						{
							userId: "user-1",
							message: "newer",
							createdAt: "2026-01-05T10:02:00.000Z",
						},
						{
							userId: "user-1",
							message: "older",
							createdAt: "2026-01-05T10:01:00.000Z",
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
			"older",
			"newer",
		]);
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
		expect(data.analytics).toEqual([
			{ event_type: "app_open", event_time: 1 },
		]);
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
