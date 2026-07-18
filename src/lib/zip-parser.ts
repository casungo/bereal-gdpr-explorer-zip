import JSZip from "jszip";
import pako from "pako";
import type {
  AnalyticsEvent,
  BeRealData,
  ChatMessage,
  Conversation,
  ImportWarning,
  ImportCompatibilityReport,
  ImportSectionReport,
  ImportSectionName,
  MediaMap,
  ProgressCallback,
  PushSettings,
} from "@/lib/types";
import { APP_VERSION } from "./version";

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
const EXPORT_METADATA_FILES = new Set([
  "user.json",
  "friends.json",
  "friend-requests.json",
  "posts.json",
  "memories.json",
  "comments.json",
  "realmojis.json",
  "push-settings.json",
  "push-tokens.json",
  "terms.json",
]);
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
  | "INVALID_ANALYTICS"
  | "INVALID_STRUCTURE";

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

function detectExportRoot(files: Record<string, JSZip.JSZipObject>): string {
  const scores = new Map<string, number>();

  for (const file of Object.values(files)) {
    if (file.dir) continue;
    const segments = file.name.split("/");
    const metadataFile = segments.at(-1);
    if (
      !metadataFile ||
      !EXPORT_METADATA_FILES.has(metadataFile) ||
      segments.length > 2
    ) {
      continue;
    }
    const candidate = segments.length === 1 ? "" : segments[0];
    scores.set(candidate, (scores.get(candidate) ?? 0) + 1);
  }

  const bestScore = Math.max(0, ...scores.values());
  if (bestScore === 0) {
    archiveError(
      "INVALID_ARCHIVE",
      "No supported BeReal metadata files were found.",
    );
  }
  const bestRoots = [...scores.entries()].filter(
    ([, score]) => score === bestScore,
  );
  if (bestRoots.length !== 1) {
    archiveError(
      "INVALID_ARCHIVE",
      "Multiple BeReal export roots contain the same amount of supported metadata.",
    );
  }
  return bestRoots[0][0];
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

interface ValidatedValue<T> {
  value: T;
  discardedRecords?: boolean;
}

interface SectionResult<T> {
  value?: T;
  state: "missing" | "valid" | "invalid";
  acceptedRecords: number;
  skippedRecords: number;
}

async function parseJsonSection<T>(
  zip: JSZip,
  path: string,
  section: string,
  validate: (value: unknown) => ValidatedValue<T> | null,
  warnings: ImportWarning[],
): Promise<SectionResult<T>> {
  const file = zip.file(path);
  if (!file) {
    return { state: "missing", acceptedRecords: 0, skippedRecords: 0 };
  }
  let parsed: unknown;
  try {
    const content = await file.async("string");
    parsed = JSON.parse(content);
  } catch {
    warnings.push({ section, code: "MALFORMED_JSON" });
    return { state: "invalid", acceptedRecords: 0, skippedRecords: 0 };
  }
  const validated = validate(parsed);
  if (!validated) {
    warnings.push({ section, code: "INVALID_SHAPE" });
    return {
      state: "invalid",
      acceptedRecords: 0,
      skippedRecords: Array.isArray(parsed) ? parsed.length : 1,
    };
  }
  if (validated.discardedRecords) {
    warnings.push({ section, code: "INVALID_RECORDS" });
  }
  const acceptedRecords = Array.isArray(validated.value)
    ? validated.value.length
    : 1;
  return {
    value: validated.value,
    state: "valid",
    acceptedRecords,
    skippedRecords: Array.isArray(parsed)
      ? Math.max(0, parsed.length - acceptedRecords)
      : 0,
  };
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

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function isDateString(value: unknown): value is string {
  return isString(value) && !Number.isNaN(Date.parse(value));
}

function optionalField(
  record: UnknownRecord,
  key: string,
  validate: (value: unknown) => boolean,
): boolean {
  return !(key in record) || record[key] === undefined || validate(record[key]);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function isLocation(value: unknown): boolean {
  return (
    isRecord(value) && isNumber(value.latitude) && isNumber(value.longitude)
  );
}

function isBirthdate(value: unknown): boolean {
  if (
    !isRecord(value) ||
    !isNumber(value.year) ||
    !isNumber(value.month) ||
    !isNumber(value.day) ||
    !Number.isInteger(value.year) ||
    !Number.isInteger(value.month) ||
    !Number.isInteger(value.day)
  ) {
    return false;
  }
  const date = new Date(Date.UTC(value.year, value.month - 1, value.day));
  return (
    date.getUTCFullYear() === value.year &&
    date.getUTCMonth() === value.month - 1 &&
    date.getUTCDate() === value.day
  );
}

function isRawMedia(value: unknown): boolean {
  return (
    isRecord(value) &&
    isString(value.path) &&
    isString(value.bucket) &&
    isNumber(value.height) &&
    isNumber(value.width) &&
    (value.mediaType === "image" || value.mediaType === "video") &&
    isString(value.mimeType)
  );
}

function validateRecordArray<T>(
  value: unknown,
  validate: (record: unknown) => record is T,
): ValidatedValue<T[]> | null {
  if (!Array.isArray(value)) return null;
  const records = value.filter(validate);
  if (value.length > 0 && records.length === 0) return null;
  return { value: records, discardedRecords: records.length !== value.length };
}

function isRawUser(value: unknown): value is RawUser {
  return (
    isRecord(value) &&
    isString(value.username) &&
    isString(value.fullname) &&
    optionalField(value, "id", isString) &&
    optionalField(value, "uid", isString) &&
    optionalField(value, "createdAt", isDateString) &&
    optionalField(
      value,
      "profilePicture",
      (profile) =>
        isRecord(profile) &&
        isString(profile.path) &&
        isString(profile.bucket) &&
        isString(profile.height) &&
        isString(profile.width),
    ) &&
    optionalField(
      value,
      "platform",
      (platform) => platform === "android" || platform === "ios",
    ) &&
    optionalField(value, "deviceId", isString) &&
    optionalField(value, "biography", isString) &&
    optionalField(value, "location", isString) &&
    optionalField(value, "birthdate", isBirthdate) &&
    optionalField(value, "phoneNumber", isString) &&
    optionalField(value, "clientVersion", isString) &&
    optionalField(value, "timezone", isString) &&
    optionalField(value, "language", isString) &&
    optionalField(value, "countryCode", isString) &&
    optionalField(value, "region", isString)
  );
}

function isRawFriend(value: unknown): value is RawFriend {
  return (
    isRecord(value) &&
    isString(value.friendUsername) &&
    isString(value.friendFullname) &&
    isDateString(value.createdAt)
  );
}

function isRawFriendRequest(value: unknown): value is RawFriendRequest {
  return (
    isRecord(value) &&
    optionalField(value, "fromUserId", isString) &&
    isString(value.status) &&
    isDateString(value.createdAt) &&
    isDateString(value.updatedAt)
  );
}

function isRawPost(value: unknown): value is RawPost {
  return (
    isRecord(value) &&
    optionalField(value, "id", isString) &&
    isRawMedia(value.primary) &&
    isRawMedia(value.secondary) &&
    optionalField(value, "retakeCounter", isNumber) &&
    optionalField(value, "visibility", isStringArray) &&
    isDateString(value.takenAt) &&
    optionalField(value, "caption", isString) &&
    optionalField(value, "location", isLocation) &&
    optionalField(value, "btsMedia", isRawMedia)
  );
}

function isRawMemory(value: unknown): value is RawMemory {
  return (
    isRecord(value) &&
    optionalField(value, "id", isString) &&
    isRawMedia(value.frontImage) &&
    isRawMedia(value.backImage) &&
    isBoolean(value.isLate) &&
    isDateString(value.date) &&
    isDateString(value.takenTime) &&
    isDateString(value.berealMoment) &&
    optionalField(value, "caption", isString) &&
    optionalField(value, "location", isLocation) &&
    optionalField(value, "btsMedia", isRawMedia) &&
    optionalField(
      value,
      "music",
      (music) =>
        isRecord(music) &&
        [
          "track",
          "artist",
          "openUrl",
          "artwork",
          "providerId",
          "isrc",
          "visibility",
          "audioType",
          "provider",
        ].every((key) => isString(music[key])),
    )
  );
}

function isRawComment(value: unknown): value is RawComment {
  return isRecord(value) && isString(value.postId) && isString(value.content);
}

function isRawRealmoji(value: unknown): value is RawRealmoji {
  return (
    isRecord(value) &&
    optionalField(value, "id", isString) &&
    isDateString(value.createdAt) &&
    isString(value.emoji) &&
    optionalField(
      value,
      "media",
      (media) =>
        isRecord(media) &&
        isString(media.bucket) &&
        isNumber(media.height) &&
        isNumber(media.width) &&
        isString(media.path) &&
        isString(media.mediaType),
    ) &&
    optionalField(value, "isEnabled", isBoolean) &&
    optionalField(value, "userId", isString) &&
    optionalField(value, "username", isString)
  );
}

function isRawPushToken(value: unknown): value is RawPushToken {
  return (
    isRecord(value) &&
    optionalField(value, "token", isString) &&
    optionalField(value, "deviceId", isString) &&
    optionalField(
      value,
      "platform",
      (platform) => platform === "ios" || platform === "android",
    ) &&
    optionalField(value, "clientVersion", isString) &&
    optionalField(value, "language", isString) &&
    optionalField(value, "region", isString) &&
    optionalField(value, "timezone", isString)
  );
}

function isRawTerm(value: unknown): value is RawTerm {
  return (
    isRecord(value) &&
    isString(value.code) &&
    isString(value.status) &&
    optionalField(value, "version", isNumber) &&
    isString(value.termUrl) &&
    optionalField(value, "signedAt", isDateString)
  );
}

function validatePushSettings(
  value: unknown,
): ValidatedValue<PushSettings> | null {
  return isRecord(value) && Object.values(value).every(isBoolean)
    ? { value: value as PushSettings }
    : null;
}

function isAnalyticsEvent(value: unknown): value is AnalyticsEvent {
  if (
    !isRecord(value) ||
    !isString(value.event_type) ||
    !isNumber(value.event_time)
  ) {
    return false;
  }
  for (const key of ["event_id", "client_event_time", "client_upload_time"]) {
    if (!optionalField(value, key, isNumber)) return false;
  }
  for (const key of [
    "user_id",
    "city",
    "country",
    "region",
    "device_type",
    "device_family",
    "device_id",
    "ip_address",
    "language",
    "platform",
    "version_name",
    "os_name",
  ]) {
    if (!optionalField(value, key, isString)) return false;
  }
  return optionalField(
    value,
    "user_properties",
    (properties) =>
      isRecord(properties) &&
      ["gender", "birthdayDate", "buildNumber", "countryCode"].every((key) =>
        optionalField(
          properties,
          key,
          (field) => field === null || isString(field),
        ),
      ),
  );
}

interface RawChatMessage {
  id?: string;
  userId: string;
  message: string;
  createdAt: string;
  media?: {
    path: string;
    width: number;
    height: number;
    mediaType?: "image" | "video";
  };
}

interface RawChatLog {
  participants?: { id: string; username: string }[];
  messages: RawChatMessage[];
}

function isChatParticipant(
  value: unknown,
): value is { id: string; username: string } {
  return isRecord(value) && isString(value.id) && isString(value.username);
}

function validateChatLog(value: unknown): ValidatedValue<RawChatLog> | null {
  if (!isRecord(value) || !Array.isArray(value.messages)) return null;
  if (
    !optionalField(
      value,
      "participants",
      (participants) =>
        Array.isArray(participants) && participants.every(isChatParticipant),
    )
  ) {
    return null;
  }
  const messages = value.messages.filter(
    (message): message is RawChatMessage =>
      isRecord(message) &&
      optionalField(message, "id", isString) &&
      isString(message.userId) &&
      isString(message.message) &&
      isDateString(message.createdAt) &&
      optionalField(
        message,
        "media",
        (media) =>
          isRecord(media) &&
          isString(media.path) &&
          isNumber(media.width) &&
          isNumber(media.height) &&
          optionalField(
            media,
            "mediaType",
            (type) => type === "image" || type === "video",
          ),
      ),
  );
  return {
    value: {
      participants: Array.isArray(value.participants)
        ? value.participants.filter(isChatParticipant)
        : undefined,
      messages,
    },
    discardedRecords: messages.length !== value.messages.length,
  };
}

async function parseConversations(
  zip: JSZip,
  warnings: ImportWarning[],
): Promise<Conversation[]> {
  const chatLogRegex = /^(?:[^/]+\/)?conversations\/([^/]+)\/chat_log\.json$/;

  const conversationPromises = Object.keys(zip.files)
    .filter((path) => chatLogRegex.test(path))
    .map(async (relativePath) => {
      const match = relativePath.match(chatLogRegex);
      if (match) {
        const conversationId = match[1];
        const chatLogResult = await parseJsonSection(
          zip,
          relativePath,
          "conversations",
          validateChatLog,
          warnings,
        );
        const chatLog = chatLogResult.value;

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
): Promise<{
  data: BeRealData;
  media: MediaMap;
  warnings: ImportWarning[];
  report: ImportCompatibilityReport;
}> {
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

  const warnings: ImportWarning[] = [];
  const analyticsData: AnalyticsEvent[] = [];
  let invalidAnalyticsRecords = 0;
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
        const event: unknown = JSON.parse(line);
        if (isAnalyticsEvent(event)) {
          analyticsData.push(event);
        } else {
          invalidAnalyticsRecords++;
        }
      } catch {
        archiveError(
          "INVALID_ANALYTICS",
          `Analytics data contains invalid JSON at line ${lineCount}.`,
        );
      }
    }
    if (invalidAnalyticsRecords > 0) {
      warnings.push({ section: "analytics", code: "INVALID_RECORDS" });
    }
  }

  const exportRoot = detectExportRoot(rawZip.files);
  const zip = exportRoot ? rawZip.folder(exportRoot)! : rawZip;

  if (!zip) {
    throw new Error("Could not access zip contents.");
  }

  const data: BeRealData = {
    analytics: analyticsData,
  };
  const media: MediaMap = {};

  onProgress({ total: 100, loaded: 25, message: "Parsing JSON files..." });
  const [
    userResult,
    friendsResult,
    friendRequestsResult,
    postsResult,
    memoriesResult,
    commentsResult,
    realmojisResult,
    pushSettingsResult,
    pushTokensResult,
    termsResult,
  ] = await Promise.all([
    parseJsonSection(
      zip,
      "user.json",
      "user",
      (value) => (isRawUser(value) ? { value } : null),
      warnings,
    ),
    parseJsonSection(
      zip,
      "friends.json",
      "friends",
      (value) => validateRecordArray(value, isRawFriend),
      warnings,
    ),
    parseJsonSection(
      zip,
      "friend-requests.json",
      "friendRequests",
      (value) => validateRecordArray(value, isRawFriendRequest),
      warnings,
    ),
    parseJsonSection(
      zip,
      "posts.json",
      "posts",
      (value) => validateRecordArray(value, isRawPost),
      warnings,
    ),
    parseJsonSection(
      zip,
      "memories.json",
      "memories",
      (value) => validateRecordArray(value, isRawMemory),
      warnings,
    ),
    parseJsonSection(
      zip,
      "comments.json",
      "comments",
      (value) => validateRecordArray(value, isRawComment),
      warnings,
    ),
    parseJsonSection(
      zip,
      "realmojis.json",
      "realmojis",
      (value) => validateRecordArray(value, isRawRealmoji),
      warnings,
    ),
    parseJsonSection(
      zip,
      "push-settings.json",
      "pushSettings",
      validatePushSettings,
      warnings,
    ),
    parseJsonSection(
      zip,
      "push-tokens.json",
      "pushTokens",
      (value) => validateRecordArray(value, isRawPushToken),
      warnings,
    ),
    parseJsonSection(
      zip,
      "terms.json",
      "terms",
      (value) => validateRecordArray(value, isRawTerm),
      warnings,
    ),
  ]);
  if (
    userResult.state !== "valid" &&
    postsResult.state !== "valid" &&
    memoriesResult.state !== "valid"
  ) {
    archiveError(
      "INVALID_STRUCTURE",
      "The export does not contain valid user, posts, or memories data.",
    );
  }
  const userRaw = userResult.value;
  const friendsRaw = friendsResult.value;
  const friendRequestsRaw = friendRequestsResult.value;
  const postsRaw = postsResult.value;
  const memoriesRaw = memoriesResult.value;
  const commentsRaw = commentsResult.value;
  const realmojisRaw = realmojisResult.value;
  const pushSettings = pushSettingsResult.value;
  const pushTokensRaw = pushTokensResult.value;
  const termsRaw = termsResult.value;
  onProgress({ total: 100, loaded: 40, message: "Mapping data structures..." });

  if (userRaw) {
    data.user = {
      id: userRaw.id || userRaw.uid,
      username: userRaw.username,
      fullname: userRaw.fullname,
      createdAt: userRaw.createdAt,
      profilePicture: userRaw.profilePicture
        ? {
            ...userRaw.profilePicture,
            path: normalizePath(userRaw.profilePicture.path),
          }
        : undefined,
      device:
        userRaw.platform === "android"
          ? "Android"
          : userRaw.platform === "ios"
            ? "iOS"
            : undefined,
      deviceId: userRaw.deviceId,
      biography: userRaw.biography,
      location: userRaw.location,
      birthdate: userRaw.birthdate,
      phoneNumber: userRaw.phoneNumber,
      clientVersion: userRaw.clientVersion,
      timezone: userRaw.timezone,
      language: userRaw.language,
      countryCode: userRaw.countryCode,
      region: userRaw.region,
      platform:
        userRaw.platform === "android"
          ? 2
          : userRaw.platform === "ios"
            ? 1
            : undefined,
      creationDate: userRaw.createdAt,
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
      fromUserId: fr.fromUserId,
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
      retakeCounter: p.retakeCounter,
      visibility: p.visibility,
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
    }));
  }

  if (commentsRaw) {
    data.comments = commentsRaw.map((c, i) => ({
      id: `comment-${i}`,
      postId: c.postId,
      text: c.content,
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
        : undefined,
      isEnabled: r.isEnabled,

      creationDate: r.createdAt,
      authorId: r.userId,
      username: r.username,
    }));
  }

  data.pushSettings = pushSettings;
  if (pushTokensRaw) {
    data.pushTokens = pushTokensRaw.map((t) => ({
      token: t.token ?? t.deviceId,
      os:
        t.platform === "ios"
          ? "iOS"
          : t.platform === "android"
            ? "Android"
            : undefined,
      clientVersion: t.clientVersion,
      language: t.language,
      region: t.region,
      timezone: t.timezone,
    }));
  }

  if (termsRaw) {
    data.terms = termsRaw.map((t) => ({
      code: t.code,
      status: t.status,
      version: t.version,
      termUrl: t.termUrl,
      signedAt: t.signedAt,

      url: t.termUrl,
      date: t.signedAt,
    }));
  }

  onProgress({ total: 100, loaded: 50, message: "Parsing conversations..." });
  data.conversations = await parseConversations(rawZip, warnings);
  const conversationFileCount = Object.keys(rawZip.files).filter((name) =>
    /^(?:[^/]+\/)?conversations\/[^/]+\/chat_log\.json$/.test(name),
  ).length;

  onProgress({ total: 100, loaded: 60, message: "Extracting media..." });

  const mediaFiles = Object.values(zip.files).filter((file) => {
    const relativePath =
      exportRoot && file.name.startsWith(`${exportRoot}/`)
        ? file.name.slice(exportRoot.length + 1)
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
          exportRoot && result.path.startsWith(`${exportRoot}/`)
            ? result.path.slice(exportRoot.length + 1)
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

  const sectionReport = <T>(
    section: ImportSectionName,
    result: SectionResult<T>,
  ): ImportSectionReport => ({
    section,
    status:
      result.state === "valid"
        ? "recognized"
        : result.state === "missing"
          ? "missing"
          : "invalid",
    acceptedRecords: result.acceptedRecords,
    skippedRecords: result.skippedRecords,
    warningCodes: warnings
      .filter((warning) => warning.section === section)
      .map((warning) => warning.code),
  });
  const relativeEntries = Object.values(zip.files).map((file) => ({
    file,
    name:
      exportRoot && file.name.startsWith(`${exportRoot}/`)
        ? file.name.slice(exportRoot.length + 1)
        : file.name,
  }));
  const unknownJsonFiles = relativeEntries.filter(
    ({ file, name }) =>
      !file.dir &&
      name.endsWith(".json") &&
      !EXPORT_METADATA_FILES.has(name) &&
      !/^conversations\/[^/]+\/chat_log\.json$/.test(name),
  ).length;
  const analyticsWarnings = warnings
    .filter((warning) => warning.section === "analytics")
    .map((warning) => warning.code);
  const conversationWarnings = warnings
    .filter((warning) => warning.section === "conversations")
    .map((warning) => warning.code);
  const report: ImportCompatibilityReport = {
    appVersion: APP_VERSION,
    parserVersion: "1",
    sections: [
      sectionReport("user", userResult),
      sectionReport("friends", friendsResult),
      sectionReport("friendRequests", friendRequestsResult),
      sectionReport("posts", postsResult),
      sectionReport("memories", memoriesResult),
      sectionReport("comments", commentsResult),
      sectionReport("realmojis", realmojisResult),
      sectionReport("pushSettings", pushSettingsResult),
      sectionReport("pushTokens", pushTokensResult),
      sectionReport("terms", termsResult),
      {
        section: "conversations",
        status:
          conversationFileCount === 0
            ? "missing"
            : data.conversations.length > 0
              ? "recognized"
              : "invalid",
        acceptedRecords: data.conversations.length,
        skippedRecords: Math.max(
          0,
          conversationFileCount - data.conversations.length,
        ),
        warningCodes: conversationWarnings,
      },
      {
        section: "analytics",
        status: gzFile ? "recognized" : "missing",
        acceptedRecords: analyticsData.length,
        skippedRecords: invalidAnalyticsRecords,
        warningCodes: analyticsWarnings,
      },
    ],
    recognizedMedia: mediaFiles.length,
    invalidMedia: 0,
    unknownJsonFiles,
  };

  return { data, media, warnings, report };
}
