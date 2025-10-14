import JSZip from "jszip";
import pako from "pako";
import type {
  BeRealData,
  MediaMap,
  User,
  PushSettings,
  Conversation,
  ChatMessage,
  ProgressCallback,
} from "@lib/types";

const PROGRESS_UPDATE_INTERVAL = 5;
const PARALLEL_CHUNK_SIZE = 100;
const ALLOWED_MIME_TYPES = [
  "application/zip",
  "application/x-gzip",
  "application/gzip",
] as const;

async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  if (
    !ALLOWED_MIME_TYPES.some(
      (type) =>
        file.type.includes(type) ||
        file.name.endsWith(type.includes("zip") ? ".zip" : ".gz")
    )
  ) {
    throw new Error(`Invalid file type. Expected .zip or .gz files.`);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () =>
      reject(new Error(`Failed to read file: ${file.name}`));
    reader.readAsArrayBuffer(file);
  });
}

async function parseJsonSafe<T>(
  zip: JSZip,
  path: string
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
  _user: User | undefined
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
                new Date(b.creationDate).getTime()
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
  gzFile: File,
  onProgress: ProgressCallback
): Promise<{ data: BeRealData; media: MediaMap }> {
  if (!zipFile || !gzFile) {
    throw new Error("Both zip and gz files are required");
  }

  if (!onProgress || typeof onProgress !== "function") {
    throw new Error("Progress callback is required");
  }

  if (!zipFile.name.endsWith(".zip")) {
    throw new Error("First file must be a .zip file");
  }

  if (!gzFile.name.endsWith(".gz")) {
    throw new Error("Second file must be a .gz file");
  }

  onProgress({ total: 100, loaded: 2, message: "Starting data parsing..." });
  onProgress({ total: 100, loaded: 5, message: "Reading files..." });
  const [zipBuffer, gzBuffer] = await Promise.all([
    readFileAsArrayBuffer(zipFile),
    readFileAsArrayBuffer(gzFile),
  ]);

  onProgress({
    total: 100,
    loaded: 10,
    message: "Decompressing and parsing data...",
  });

  const rawZip = await JSZip.loadAsync(zipBuffer);

  const analyticsString = pako.ungzip(gzBuffer, { to: "string" });
  const analyticsData = analyticsString
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => JSON.parse(line));

  const topLevelDir = Object.keys(rawZip.files)
    .find((p) => p.endsWith("/") && p.split("/").length === 2)
    ?.split("/")[0];
  const zip = topLevelDir ? rawZip.folder(topLevelDir)! : rawZip;

  if (!zip) {
    throw new Error("Could not access zip contents.");
  }

  const data: BeRealData = { analytics: analyticsData };
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

  const mediaFiles = Object.values(zip.files).filter(
    (file) =>
      !file.dir &&
      (file.name.startsWith("Photos/") ||
        file.name.startsWith("conversations/") ||
        file.name.startsWith("profile-pictures/"))
  );

  const totalMedia = mediaFiles.length;
  let loadedMedia = 0;

  const processMediaFiles = async (
    files: JSZip.JSZipObject[]
  ): Promise<void> => {
    for (let i = 0; i < files.length; i += PARALLEL_CHUNK_SIZE) {
      const chunk = files.slice(i, i + PARALLEL_CHUNK_SIZE);
      let completedInChunk = 0;

      const chunkPromises = chunk.map(async (file) => {
        try {
          const blob = await file.async("blob");
          const result = { path: file.name, url: URL.createObjectURL(blob) };

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
        } catch (e) {
          return null;
        }
      });

      const results = await Promise.all(chunkPromises);

      results.forEach((result) => {
        if (result) {
          media[result.path] = result.url;
        }
      });

      loadedMedia += chunk.length;

      if (i + PARALLEL_CHUNK_SIZE < files.length) {
        await new Promise((resolve) => setTimeout(resolve, 1));
      }
    }
  };

  await processMediaFiles(mediaFiles);

  onProgress({ total: 100, loaded: 100, message: "Done!" });

  return { data, media };
}
