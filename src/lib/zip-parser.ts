import JSZip from "jszip";
import pako from "pako";
import type {
	BeRealData,
	ChatMessage,
	Conversation,
	MediaMap,
	ProgressCallback,
	PushSettings,
	User,
} from "@/lib/types";

const PROGRESS_UPDATE_INTERVAL = 5;
const MEDIA_EXTRACTION_CONCURRENCY = 8;
const MEBIBYTE = 1024 * 1024;
const GIBIBYTE = 1024 * MEBIBYTE;
const MAX_ZIP_INPUT_BYTES = 500 * MEBIBYTE;
const MAX_ANALYTICS_GZIP_INPUT_BYTES = 100 * MEBIBYTE;
const MAX_ARCHIVE_ENTRIES = 20_000;
const MAX_ENTRY_UNCOMPRESSED_BYTES = 512 * MEBIBYTE;
const MAX_ARCHIVE_UNCOMPRESSED_BYTES = 2 * GIBIBYTE;
const MAX_ANALYTICS_UNCOMPRESSED_BYTES = 512 * MEBIBYTE;
const ALLOWED_MIME_TYPES = [
	"application/zip",
	"application/x-gzip",
	"application/gzip",
] as const;

export type ArchiveErrorCode =
	| "INVALID_FILE_TYPE"
	| "INPUT_TOO_LARGE"
	| "TOO_MANY_ENTRIES"
	| "ENTRY_TOO_LARGE"
	| "ARCHIVE_TOO_LARGE"
	| "INVALID_ARCHIVE"
	| "INVALID_ANALYTICS";

export class ArchiveParseError extends Error {
	constructor(
		public readonly code: ArchiveErrorCode,
		message: string,
	) {
		super(message);
		this.name = "ArchiveParseError";
	}
}

function archiveError(code: ArchiveErrorCode, message: string): never {
	throw new ArchiveParseError(code, message);
}

interface ZipObjectWithDeclaredSize extends JSZip.JSZipObject {
	_data?: { uncompressedSize?: number };
}

function declaredUncompressedSize(entry: JSZip.JSZipObject): number | null {
	const size = (entry as ZipObjectWithDeclaredSize)._data?.uncompressedSize;
	return typeof size === "number" && Number.isSafeInteger(size) && size >= 0
		? size
		: null;
}

async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
	if (
		!ALLOWED_MIME_TYPES.some(
			(type) =>
				file.type.includes(type) ||
				file.name.endsWith(type.includes("zip") ? ".zip" : ".gz"),
		)
	) {
		archiveError(
			"INVALID_FILE_TYPE",
			"Invalid file type. Expected a ZIP or GZ file.",
		);
	}

	if (typeof file.arrayBuffer === "function") {
		return file.arrayBuffer();
	}

	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as ArrayBuffer);
		reader.onerror = () =>
			reject(new ArchiveParseError("INVALID_ARCHIVE", "Failed to read file."));
		reader.readAsArrayBuffer(file);
	});
}

async function parseJsonSafe<T>(
	zip: JSZip,
	path: string,
): Promise<T | undefined> {
	const file = zip.file(path);
	if (!file) {
		return undefined;
	}
	try {
		const content = await file.async("string");
		return JSON.parse(content) as T;
	} catch (error) {
		return undefined;
	}
}

interface RawUser {
	id?: string;
	uid?: string;
	username: string;
	fullname: string;
	createdAt?: string;
	profilePicture?: {
		path: string;
		bucket: string;
		height: string;
		width: string;
	};
	platform?: "android" | "ios";
	deviceId?: string;
	biography?: string;
	location?: string;
	birthdate?: {
		year: number;
		month: number;
		day: number;
	};
	phoneNumber?: string;
	clientVersion?: string;
	timezone?: string;
	language?: string;
	countryCode?: string;
	region?: string;
}

interface RawFriend {
	friendUsername: string;
	friendFullname: string;
	createdAt: string;
}

interface RawFriendRequest {
	fromUserId?: string;
	status: string;
	createdAt: string;
	updatedAt: string;
}

interface RawPost {
	id?: string;
	primary: {
		path: string;
		bucket: string;
		height: number;
		width: number;
		mediaType: "image" | "video";
		mimeType: string;
	};
	secondary: {
		path: string;
		bucket: string;
		height: number;
		width: number;
		mediaType: "image" | "video";
		mimeType: string;
	};
	retakeCounter?: number;
	visibility?: string[];
	takenAt: string;
	caption?: string;
	location?: {
		latitude: number;
		longitude: number;
	};
	btsMedia?: {
		path: string;
		bucket: string;
		height: number;
		width: number;
		mediaType: "image" | "video";
		mimeType: string;
	};
}

interface RawMemory {
	id?: string;
	frontImage: {
		path: string;
		bucket: string;
		height: number;
		width: number;
		mediaType: "image" | "video";
		mimeType: string;
	};
	backImage: {
		path: string;
		bucket: string;
		height: number;
		width: number;
		mediaType: "image" | "video";
		mimeType: string;
	};
	isLate: boolean;
	date: string;
	takenTime: string;
	berealMoment: string;
	caption?: string;
	location?: {
		latitude: number;
		longitude: number;
	};
	btsMedia?: {
		path: string;
		bucket: string;
		height: number;
		width: number;
		mediaType: "image" | "video";
		mimeType: string;
	};
	music?: {
		track: string;
		artist: string;
		openUrl: string;
		artwork: string;
		providerId: string;
		isrc: string;
		visibility: string;
		audioType: string;
		provider: string;
	};
}

interface RawComment {
	postId: string;
	content: string;
}

interface RawRealmoji {
	id?: string;
	createdAt: string;
	emoji: string;
	media?: {
		bucket: string;
		height: number;
		width: number;
		path: string;
		mediaType: string;
	};
	isEnabled?: boolean;
	userId?: string;
	username?: string;
}

interface RawPushToken {
	token?: string;
	deviceId?: string;
	platform?: "ios" | "android";
	clientVersion?: string;
	language?: string;
	region?: string;
	timezone?: string;
}

interface RawTerm {
	code: string;
	status: string;
	version?: number;
	termUrl: string;
	signedAt?: string;
}

async function parseConversations(
	zip: JSZip,
	_user: User | undefined,
): Promise<Conversation[]> {
	const chatLogRegex = /^(?:[^/]+\/)?conversations\/([^/]+)\/chat_log\.json$/;

	const conversationPromises = Object.keys(zip.files)
		.filter((path) => chatLogRegex.test(path))
		.map(async (relativePath) => {
			const match = relativePath.match(chatLogRegex);
			if (match) {
				const conversationId = match[1];
				const chatLog = await parseJsonSafe<{
					participants?: { id: string; username: string }[];
					messages: any[];
				}>(zip, relativePath);

				if (chatLog && chatLog.messages) {
					const messages: ChatMessage[] = chatLog.messages
						.map((m, i) => ({
							id: m.id || `${conversationId}-msg-${i}`,
							senderId: m.userId,
							content: m.message,
							creationDate: m.createdAt,
							media: m.media
								? {
										...m.media,
										path: normalizePath(m.media.path),
										type:
											m.media.mediaType ||
											(m.media.path.endsWith("mp4") ? "video" : "image"),
									}
								: undefined,
						}))
						.sort(
							(a, b) =>
								new Date(a.creationDate).getTime() -
								new Date(b.creationDate).getTime(),
						);

					const conversation: Conversation = {
						id: conversationId,
						participants: chatLog.participants || [],
						messages: messages,
					};
					return conversation;
				}
			}
			return null;
		});

	const resolvedConversations = await Promise.all(conversationPromises);
	return resolvedConversations.filter((c): c is Conversation => c !== null);
}

function normalizePath(path: string | undefined): string {
	if (!path) return "";
	let cleanedPath = path;

	if (cleanedPath.startsWith("/")) {
		cleanedPath = cleanedPath.substring(1);
	}

	const pathSegments = cleanedPath.split("/");
	if (pathSegments.length > 2 && /^[a-zA-Z0-9]{20,}/.test(pathSegments[1])) {
		cleanedPath = [pathSegments[0], ...pathSegments.slice(2)].join("/");
	}

	return cleanedPath;
}

export async function parseBeRealZip(
	zipFile: File,
	gzFile: File | null,
	onProgress: ProgressCallback,
): Promise<{ data: BeRealData; media: MediaMap }> {
	if (!zipFile) {
		throw new Error("A zip file is required");
	}

	if (!onProgress || typeof onProgress !== "function") {
		throw new Error("Progress callback is required");
	}

	if (!zipFile.name.endsWith(".zip")) {
		archiveError("INVALID_FILE_TYPE", "First file must be a .zip file");
	}

	if (gzFile && !gzFile.name.endsWith(".gz")) {
		archiveError("INVALID_FILE_TYPE", "Second file must be a .gz file");
	}

	if (zipFile.size > MAX_ZIP_INPUT_BYTES) {
		archiveError("INPUT_TOO_LARGE", "ZIP input exceeds the 500 MiB limit.");
	}

	if (gzFile && gzFile.size > MAX_ANALYTICS_GZIP_INPUT_BYTES) {
		archiveError(
			"INPUT_TOO_LARGE",
			"Analytics input exceeds the 100 MiB limit.",
		);
	}

	onProgress({ total: 100, loaded: 2, message: "Starting data parsing..." });
	onProgress({ total: 100, loaded: 5, message: "Reading files..." });
	const [zipBuffer, gzBuffer] = await Promise.all([
		readFileAsArrayBuffer(zipFile),
		gzFile ? readFileAsArrayBuffer(gzFile) : Promise.resolve(null),
	]);

	onProgress({
		total: 100,
		loaded: 10,
		message: "Decompressing and parsing data...",
	});

	let rawZip: JSZip;
	try {
		rawZip = await JSZip.loadAsync(zipBuffer);
	} catch {
		archiveError("INVALID_ARCHIVE", "The ZIP archive is invalid or corrupted.");
	}

	const archiveEntries = Object.values(rawZip.files);
	if (archiveEntries.length > MAX_ARCHIVE_ENTRIES) {
		archiveError(
			"TOO_MANY_ENTRIES",
			"The ZIP archive contains more than 20,000 entries.",
		);
	}

	let declaredArchiveBytes = 0;
	for (const entry of archiveEntries) {
		if (entry.dir) continue;
		const declaredBytes = declaredUncompressedSize(entry);
		if (declaredBytes === null) continue;
		if (declaredBytes > MAX_ENTRY_UNCOMPRESSED_BYTES) {
			archiveError(
				"ENTRY_TOO_LARGE",
				"A ZIP entry exceeds the 512 MiB expanded limit.",
			);
		}
		declaredArchiveBytes += declaredBytes;
		if (declaredArchiveBytes > MAX_ARCHIVE_UNCOMPRESSED_BYTES) {
			archiveError(
				"ARCHIVE_TOO_LARGE",
				"The ZIP archive exceeds the 2 GiB expanded limit.",
			);
		}
	}

	const analyticsData: unknown[] = [];
	if (gzBuffer) {
		let analyticsText: string;
		try {
			analyticsText = pako.ungzip(gzBuffer, { to: "string" });
		} catch {
			archiveError(
				"INVALID_ANALYTICS",
				"The analytics GZ file is invalid or corrupted.",
			);
		}
		let lineStart = 0;
		let lineCount = 0;
		let analyticsBytes = 0;
		for (let index = 0; index <= analyticsText.length; index++) {
			if (index !== analyticsText.length && analyticsText[index] !== "\n")
				continue;
			const rawLine = analyticsText.slice(lineStart, index);
			lineCount++;
			analyticsBytes +=
				new Blob([rawLine]).size + (index < analyticsText.length ? 1 : 0);
			if (analyticsBytes > MAX_ANALYTICS_UNCOMPRESSED_BYTES) {
				archiveError(
					"ARCHIVE_TOO_LARGE",
					"Expanded analytics data exceeds the 512 MiB limit.",
				);
			}
			const line = rawLine.trim();
			lineStart = index + 1;
			if (!line) continue;
			try {
				analyticsData.push(JSON.parse(line));
			} catch {
				archiveError(
					"INVALID_ANALYTICS",
					`Analytics data contains invalid JSON at line ${lineCount}.`,
				);
			}
		}
	}

	const topLevelDir = Object.keys(rawZip.files)
		.find((p) => p.endsWith("/") && p.split("/").length === 2)
		?.split("/")[0];
	const zip = topLevelDir ? rawZip.folder(topLevelDir)! : rawZip;

	if (!zip) {
		throw new Error("Could not access zip contents.");
	}

	const data: BeRealData = {
		analytics: analyticsData as BeRealData["analytics"],
	};
	const media: MediaMap = {};

	onProgress({ total: 100, loaded: 25, message: "Parsing JSON files..." });
	const [
		userRaw,
		friendsRaw,
		friendRequestsRaw,
		postsRaw,
		memoriesRaw,
		commentsRaw,
		realmojisRaw,
		pushSettings,
		pushTokensRaw,
		termsRaw,
	] = await Promise.all([
		parseJsonSafe<RawUser>(zip, "user.json"),
		parseJsonSafe<RawFriend[]>(zip, "friends.json"),
		parseJsonSafe<RawFriendRequest[]>(zip, "friend-requests.json"),
		parseJsonSafe<RawPost[]>(zip, "posts.json"),
		parseJsonSafe<RawMemory[]>(zip, "memories.json"),
		parseJsonSafe<RawComment[]>(zip, "comments.json"),
		parseJsonSafe<RawRealmoji[]>(zip, "realmojis.json"),
		parseJsonSafe<PushSettings>(zip, "push-settings.json"),
		parseJsonSafe<RawPushToken[]>(zip, "push-tokens.json"),
		parseJsonSafe<RawTerm[]>(zip, "terms.json"),
	]);
	onProgress({ total: 100, loaded: 40, message: "Mapping data structures..." });

	if (userRaw) {
		data.user = {
			id: userRaw.id || userRaw.uid,
			username: userRaw.username,
			fullname: userRaw.fullname,
			createdAt: userRaw.createdAt || new Date().toISOString(),
			profilePicture: userRaw.profilePicture
				? {
						...userRaw.profilePicture,
						path: normalizePath(userRaw.profilePicture.path),
					}
				: {
						path: "",
						bucket: "",
						height: "0",
						width: "0",
					},
			device: userRaw.platform === "android" ? "Android" : "iOS",
			deviceId: userRaw.deviceId || "",
			biography: userRaw.biography || "",
			location: userRaw.location || "",
			birthdate: userRaw.birthdate || {
				year: 2000,
				month: 1,
				day: 1,
			},
			phoneNumber: userRaw.phoneNumber || "",
			clientVersion: userRaw.clientVersion || "",
			timezone: userRaw.timezone || "",
			language: userRaw.language || "",
			countryCode: userRaw.countryCode || "",
			region: userRaw.region || "",
			platform: userRaw.platform === "android" ? 2 : 1,
			creationDate: userRaw.createdAt || new Date().toISOString(),
		};
	}

	if (friendsRaw) {
		data.friends = friendsRaw.map((f, i) => ({
			id: f.friendUsername || `friend-${i}`,
			username: f.friendUsername,
			fullname: f.friendFullname,
			status: "friends",
			friendshipDate: f.createdAt,
		}));
	}

	if (friendRequestsRaw) {
		data.friendRequests = friendRequestsRaw.map((fr, i) => ({
			id: fr.fromUserId ? `${fr.fromUserId}-${fr.createdAt}` : `fr-${i}`,
			fromUserId: fr.fromUserId || "",
			status: fr.status,
			createdAt: fr.createdAt,
			updatedAt: fr.updatedAt,
		}));
	}

	if (postsRaw) {
		data.posts = postsRaw.map((p, i) => ({
			id: p.id || `post-${i}`,
			primary: {
				...p.primary,
				path: normalizePath(p.primary.path),
			},
			secondary: {
				...p.secondary,
				path: normalizePath(p.secondary.path),
			},
			retakeCounter: p.retakeCounter || 0,
			visibility: p.visibility || [],
			takenAt: p.takenAt,
			caption: p.caption,
			location: p.location,
			btsMedia: p.btsMedia
				? { ...p.btsMedia, path: normalizePath(p.btsMedia.path) }
				: undefined,

			video: p.btsMedia
				? { ...p.btsMedia, path: normalizePath(p.btsMedia.path) }
				: undefined,
			isMemory: false,
			lateInSeconds: 0,
			creationDate: p.takenAt,
		}));
	}

	if (memoriesRaw) {
		data.memories = memoriesRaw.map((m, i) => ({
			id: m.id || `memory-${i}`,
			frontImage: {
				...m.frontImage,
				path: normalizePath(m.frontImage.path),
			},
			backImage: {
				...m.backImage,
				path: normalizePath(m.backImage.path),
			},
			isLate: m.isLate,
			date: m.date,
			takenTime: m.takenTime,
			berealMoment: m.berealMoment,
			caption: m.caption,
			location: m.location,
			btsMedia: m.btsMedia
				? { ...m.btsMedia, path: normalizePath(m.btsMedia.path) }
				: undefined,
			music: m.music,

			primary: {
				...m.frontImage,
				path: normalizePath(m.frontImage.path),
			},
			secondary: {
				...m.backImage,
				path: normalizePath(m.backImage.path),
			},
			video: m.btsMedia
				? { ...m.btsMedia, path: normalizePath(m.btsMedia.path) }
				: undefined,
			takenAt: m.takenTime,
			creationDate: m.date,
			lateInSeconds:
				(new Date(m.takenTime).getTime() - new Date(m.berealMoment).getTime()) /
				1000,
			isMemory: true,
			visibility: [],
			retakeCounter: 0,
		}));
	}

	if (commentsRaw) {
		data.comments = commentsRaw.map((c, i) => ({
			id: `comment-${i}`,
			postId: c.postId,
			text: c.content,
			author: { id: data.user?.id || "", username: "unknown" },
			creationDate: new Date(0).toISOString(),
		}));
	}

	if (realmojisRaw) {
		data.realmojis = realmojisRaw.map((r, i) => ({
			id: r.id || `realmoji-${i}`,
			createdAt: r.createdAt,
			emoji: r.emoji,
			media: r.media
				? {
						...r.media,
						path: normalizePath(r.media.path),
					}
				: {
						bucket: "",
						height: 0,
						width: 0,
						path: "",
						mediaType: "",
					},
			isEnabled: r.isEnabled !== undefined ? r.isEnabled : true,

			creationDate: r.createdAt,
			isInstant: false,
			authorId: r.userId || "",
			username: r.username || "unknown",
		}));
	}

	data.pushSettings = pushSettings;
	if (pushTokensRaw) {
		data.pushTokens = pushTokensRaw.map((t) => ({
			token: t.token || t.deviceId || "",
			os: t.platform === "ios" ? "iOS" : "Android",
			clientVersion: t.clientVersion || "",
			language: t.language || "",
			region: t.region || "",
			timezone: t.timezone || "",
		}));
	}

	if (termsRaw) {
		data.terms = termsRaw.map((t) => ({
			code: t.code,
			status: t.status,
			version: t.version || 1,
			termUrl: t.termUrl,
			signedAt: t.signedAt || new Date(0).toISOString(),

			url: t.termUrl,
			date: t.signedAt || new Date(0).toISOString(),
		}));
	}

	onProgress({ total: 100, loaded: 50, message: "Parsing conversations..." });
	data.conversations = await parseConversations(rawZip, data.user);

	onProgress({ total: 100, loaded: 60, message: "Extracting media..." });

	const mediaFiles = Object.values(zip.files).filter((file) => {
		const relativePath =
			topLevelDir && file.name.startsWith(`${topLevelDir}/`)
				? file.name.slice(topLevelDir.length + 1)
				: file.name;
		return (
			!file.dir &&
			(relativePath.startsWith("Photos/") ||
				relativePath.startsWith("conversations/") ||
				relativePath.startsWith("profile-pictures/"))
		);
	});

	const totalMedia = mediaFiles.length;
	let loadedMedia = 0;
	const createdObjectUrls = new Set<string>();

	const processMediaFiles = async (
		files: JSZip.JSZipObject[],
	): Promise<void> => {
		for (let i = 0; i < files.length; i += MEDIA_EXTRACTION_CONCURRENCY) {
			const chunk = files.slice(i, i + MEDIA_EXTRACTION_CONCURRENCY);
			let completedInChunk = 0;

			const chunkPromises = chunk.map(async (file) => {
				const blob = await file.async("blob");
				const url = URL.createObjectURL(blob);
				createdObjectUrls.add(url);
				const result = { path: file.name, url };

				completedInChunk++;
				const currentLoaded = loadedMedia + completedInChunk;

				if (
					currentLoaded % PROGRESS_UPDATE_INTERVAL === 0 ||
					currentLoaded === totalMedia
				) {
					onProgress({
						total: 100,
						loaded: 60 + Math.round((currentLoaded / totalMedia) * 40),
						message: `Extracting media ${currentLoaded}/${totalMedia}`,
					});
				}

				return result;
			});

			const settledResults = await Promise.allSettled(chunkPromises);
			const failedResult = settledResults.find(
				(result) => result.status === "rejected",
			);
			if (failedResult?.status === "rejected") {
				throw failedResult.reason;
			}
			const results = settledResults
				.filter(
					(
						result,
					): result is PromiseFulfilledResult<
						Awaited<(typeof chunkPromises)[number]>
					> => result.status === "fulfilled",
				)
				.map((result) => result.value);

			results.forEach((result) => {
				media[result.path] = result.url;
				const relativePath =
					topLevelDir && result.path.startsWith(`${topLevelDir}/`)
						? result.path.slice(topLevelDir.length + 1)
						: result.path;
				if (relativePath !== result.path) {
					media[relativePath] = result.url;
				}

				const normalizedPath = normalizePath(relativePath);
				if (normalizedPath !== relativePath) {
					media[normalizedPath] = result.url;
				}
			});

			loadedMedia += chunk.length;

			if (i + MEDIA_EXTRACTION_CONCURRENCY < files.length) {
				await new Promise((resolve) => setTimeout(resolve, 1));
			}
		}
	};

	try {
		await processMediaFiles(mediaFiles);
	} catch {
		createdObjectUrls.forEach((url) => URL.revokeObjectURL(url));
		archiveError(
			"INVALID_ARCHIVE",
			"Could not extract media from the archive.",
		);
	}

	onProgress({ total: 100, loaded: 100, message: "Done!" });

	return { data, media };
}
