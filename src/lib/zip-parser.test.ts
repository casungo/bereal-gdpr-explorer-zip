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

	it("parses a top-level BeReal export and maps normalized media paths", async () => {
		const zip = new JSZip();
		const root = zip.folder("bereal-export");

		if (!root) {
			throw new Error("Could not create test zip folder");
		}

		root.file(
			"user.json",
			JSON.stringify({
				id: "user-1",
				username: "alice",
				fullname: "Alice Example",
				createdAt: "2026-01-01T10:00:00.000Z",
				platform: "android",
				profilePicture: {
					path: `/profile-pictures/${bucketId}/avatar.jpg`,
					bucket: "profile",
					height: "100",
					width: "100",
				},
			}),
		);
		root.file(
			"friends.json",
			JSON.stringify([
				{
					friendUsername: "bob",
					friendFullname: "Bob Example",
					createdAt: "2026-01-02T10:00:00.000Z",
				},
			]),
		);
		root.file(
			"posts.json",
			JSON.stringify([
				{
					id: "post-1",
					primary: {
						path: `/Photos/${bucketId}/primary.webp`,
						bucket: "photos",
						height: 1200,
						width: 900,
						mediaType: "image",
						mimeType: "image/webp",
					},
					secondary: {
						path: `Photos/${bucketId}/secondary.jpg`,
						bucket: "photos",
						height: 1200,
						width: 900,
						mediaType: "image",
						mimeType: "image/jpeg",
					},
					btsMedia: {
						path: `Photos/${bucketId}/bts.mp4`,
						bucket: "photos",
						height: 1920,
						width: 1080,
						mediaType: "video",
						mimeType: "video/mp4",
					},
					retakeCounter: 2,
					visibility: ["friends"],
					takenAt: "2026-01-03T10:00:00.000Z",
					caption: "hello",
				},
			]),
		);
		root.file(
			"memories.json",
			JSON.stringify([
				{
					id: "memory-1",
					frontImage: {
						path: `Photos/${bucketId}/memory-front.jpg`,
						bucket: "photos",
						height: 1200,
						width: 900,
						mediaType: "image",
						mimeType: "image/jpeg",
					},
					backImage: {
						path: `Photos/${bucketId}/memory-back.jpg`,
						bucket: "photos",
						height: 1200,
						width: 900,
						mediaType: "image",
						mimeType: "image/jpeg",
					},
					isLate: true,
					date: "2026-01-04",
					takenTime: "2026-01-04T10:05:00.000Z",
					berealMoment: "2026-01-04T10:00:00.000Z",
				},
			]),
		);
		root.file(
			"conversations/thread-1/chat_log.json",
			JSON.stringify({
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
						media: {
							path: `conversations/${bucketId}/chat.jpg`,
							width: 640,
							height: 480,
							mediaType: "image",
						},
					},
				],
			}),
		);
		root.file(`Photos/${bucketId}/primary.webp`, new Uint8Array([1, 2, 3]));
		root.file(`Photos/${bucketId}/secondary.jpg`, new Uint8Array([4, 5, 6]));
		root.file(`Photos/${bucketId}/bts.mp4`, new Uint8Array([7, 8, 9]));
		root.file(`Photos/${bucketId}/memory-front.jpg`, new Uint8Array([10]));
		root.file(`Photos/${bucketId}/memory-back.jpg`, new Uint8Array([11]));
		root.file(`profile-pictures/${bucketId}/avatar.jpg`, new Uint8Array([12]));
		root.file(`conversations/${bucketId}/chat.jpg`, new Uint8Array([13]));

		const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });
		const gzBuffer = pako.gzip(
			`${JSON.stringify({ event_type: "app_open", event_time: 1 })}\n`,
		);

		const result = await parseBeRealZip(
			makeFile(zipBuffer, "bereal-export.zip", "application/zip"),
			makeFile(gzBuffer, "analytics.json.gz", "application/gzip"),
			vi.fn(),
		);

		expect(result.data.user?.username).toBe("alice");
		expect(result.data.user?.device).toBe("Android");
		expect(result.data.friends).toHaveLength(1);
		expect(result.data.posts?.[0]).toMatchObject({
			id: "post-1",
			primary: { path: "Photos/primary.webp" },
			secondary: { path: "Photos/secondary.jpg" },
			video: { path: "Photos/bts.mp4" },
			retakeCounter: 2,
			caption: "hello",
		});
		expect(result.data.memories?.[0]).toMatchObject({
			id: "memory-1",
			primary: { path: "Photos/memory-front.jpg" },
			lateInSeconds: 300,
		});
		expect(
			result.data.conversations?.[0]?.messages.map((m) => m.content),
		).toEqual(["older", "newer"]);
		expect(result.data.analytics).toEqual([
			{ event_type: "app_open", event_time: 1 },
		]);
		expect(result.media[`Photos/${bucketId}/primary.webp`]).toBeDefined();
		expect(result.media["Photos/primary.webp"]).toBe(
			result.media[`Photos/${bucketId}/primary.webp`],
		);
		expect(result.media["profile-pictures/avatar.jpg"]).toBeDefined();
	});

	it("rejects a non-gzip analytics sidecar", async () => {
		const zip = new JSZip();
		zip.file(
			"user.json",
			JSON.stringify({ username: "alice", fullname: "Alice" }),
		);
		const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });

		await expect(
			parseBeRealZip(
				makeFile(zipBuffer, "bereal-export.zip", "application/zip"),
				makeFile("{}", "analytics.json", "application/json"),
				vi.fn(),
			),
		).rejects.toThrow("Second file must be a .gz file");
	});
});
