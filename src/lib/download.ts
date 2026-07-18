import { format } from "date-fns";
import JSZip from "jszip";
import type { Media, MediaMap, Memory, Post } from "@/lib/types";

export type DownloadType =
  | "primary"
  | "secondary"
  | "both"
  | "merged"
  | "video"
  | "complete";

export interface DownloadSelection {
  primary: boolean;
  secondary: boolean;
  merged: boolean;
  video: boolean;
}

export type DownloadRequest = DownloadType | DownloadSelection;

async function getBlobFromUrl(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch media: ${response.statusText}`);
  }
  return response.blob();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

async function createMergedImage(
  primaryUrl: string,
  secondaryUrl: string,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  const primaryImg = await loadImage(primaryUrl);
  const secondaryImg = await loadImage(secondaryUrl);

  const primaryWidth = primaryImg.naturalWidth || primaryImg.width;
  const primaryHeight = primaryImg.naturalHeight || primaryImg.height;
  const pipWidth = Math.floor(primaryWidth / 3.5);
  const pipHeight = Math.floor(pipWidth * (4 / 3));
  const margin = Math.floor(primaryWidth / 40);
  const borderRadius = Math.floor(primaryWidth / 50);

  canvas.width = primaryWidth;
  canvas.height = primaryHeight;

  ctx.drawImage(primaryImg, 0, 0, primaryWidth, primaryHeight);

  ctx.save();

  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = 15;
  ctx.shadowOffsetX = 5;
  ctx.shadowOffsetY = 5;

  roundRect(ctx, margin, margin, pipWidth, pipHeight, borderRadius);
  ctx.clip();

  ctx.drawImage(secondaryImg, margin, margin, pipWidth, pipHeight);

  ctx.restore();

  ctx.lineWidth = Math.max(4, primaryWidth / 200);
  ctx.strokeStyle = "black";
  roundRect(ctx, margin, margin, pipWidth, pipHeight, borderRadius);
  ctx.stroke();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas to Blob conversion failed"));
      },
      "image/jpeg",
      0.95,
    );
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

function getPostDate(post: Post | Memory): Date {
  const value =
    "takenAt" in post && post.takenAt
      ? post.takenAt
      : (post as Memory).takenTime;
  const date = new Date(value || Date.now());
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function getPostMetadata(post: Post | Memory) {
  const date = getPostDate(post);
  return {
    id: post.id,
    takenAt: date.toISOString(),
    location: post.location ?? null,
    caption: post.caption ?? null,
    isMemory: Boolean("frontImage" in post || post.isMemory),
  };
}

function formatExifDate(date: Date): string {
  return format(date, "yyyy:MM:dd HH:mm:ss");
}

function mediaExtension(media: Media, fallback = "jpg"): string {
  const mimeType = media.mimeType?.toLowerCase();
  if (mimeType?.includes("webp")) return "webp";
  if (mimeType?.includes("jpeg") || mimeType?.includes("jpg")) return "jpg";
  if (mimeType?.includes("png")) return "png";
  if (mimeType?.includes("heic")) return "heic";
  if (mimeType?.includes("mp4")) return "mp4";

  const extension = media.path.split(".").pop()?.toLowerCase();
  return extension && extension.length <= 5 ? extension : fallback;
}

function isImageMedia(media: Media): boolean {
  return media.mediaType === "image" || media.mimeType?.startsWith("image/");
}

function assertImageMedia(media: Media, label: string) {
  if (!isImageMedia(media)) {
    throw new Error(`${label} media is not an image`);
  }
}

function isVideoMedia(media: Media): boolean {
  return media.mediaType === "video" || media.mimeType?.startsWith("video/");
}

function assertVideoMedia(media: Media, label: string) {
  if (!isVideoMedia(media)) {
    throw new Error(`${label} media is not a video`);
  }
}

function getPostMedia(post: Post | Memory): {
  primaryMedia: Media;
  secondaryMedia: Media;
  btsMedia?: Media;
} {
  if ("primary" in post) {
    const postAsPost = post as Post;
    return {
      primaryMedia: postAsPost.primary,
      secondaryMedia: postAsPost.secondary,
      btsMedia: postAsPost.btsMedia,
    };
  }

  const postAsMemory = post as Memory;
  return {
    primaryMedia: postAsMemory.frontImage,
    secondaryMedia: postAsMemory.backImage,
    btsMedia: postAsMemory.btsMedia,
  };
}

export function canDownloadVideo(
  post: Post | Memory,
  mediaMap: MediaMap,
): boolean {
  const { btsMedia } = getPostMedia(post);
  return Boolean(btsMedia && mediaMap[btsMedia.path] && isVideoMedia(btsMedia));
}

export function downloadableVideoCount(
  posts: (Post | Memory)[],
  mediaMap: MediaMap,
): number {
  return posts.filter((post) => canDownloadVideo(post, mediaMap)).length;
}

function selectionFromRequest(request: DownloadRequest): DownloadSelection {
  if (typeof request !== "string") {
    return request;
  }

  switch (request) {
    case "primary":
      return { primary: true, secondary: false, merged: false, video: false };
    case "secondary":
      return { primary: false, secondary: true, merged: false, video: false };
    case "both":
      return { primary: true, secondary: true, merged: false, video: false };
    case "merged":
      return { primary: false, secondary: false, merged: true, video: false };
    case "video":
      return { primary: false, secondary: false, merged: false, video: true };
    case "complete":
      return { primary: true, secondary: true, merged: true, video: true };
  }
}

function isVideoOnly(selection: DownloadSelection): boolean {
  return (
    selection.video &&
    !selection.primary &&
    !selection.secondary &&
    !selection.merged
  );
}

function hasSelectedMedia(selection: DownloadSelection): boolean {
  return (
    selection.primary ||
    selection.secondary ||
    selection.merged ||
    selection.video
  );
}

function isJpegBlob(blob: Blob, filename: string): boolean {
  const type = blob.type.toLowerCase();
  return (
    type.includes("jpeg") ||
    type.includes("jpg") ||
    /\.(jpe?g)$/i.test(filename)
  );
}

async function readBlobHeader(blob: Blob, length = 16): Promise<Uint8Array> {
  return new Uint8Array(await blob.slice(0, length).arrayBuffer());
}

function sniffMediaExtensionFromHeader(header: Uint8Array): string | null {
  if (header[0] === 0xff && header[1] === 0xd8) return "jpg";
  if (
    header[0] === 0x89 &&
    header[1] === 0x50 &&
    header[2] === 0x4e &&
    header[3] === 0x47
  ) {
    return "png";
  }
  if (
    header[0] === 0x52 &&
    header[1] === 0x49 &&
    header[2] === 0x46 &&
    header[3] === 0x46 &&
    header[8] === 0x57 &&
    header[9] === 0x45 &&
    header[10] === 0x42 &&
    header[11] === 0x50
  ) {
    return "webp";
  }
  if (
    header[4] === 0x66 &&
    header[5] === 0x74 &&
    header[6] === 0x79 &&
    header[7] === 0x70
  ) {
    return "mp4";
  }
  return null;
}

export async function detectedMediaExtension(
  media: Media,
  blob: Blob,
  fallback = "jpg",
): Promise<string> {
  const detectedExtension = sniffMediaExtensionFromHeader(
    await readBlobHeader(blob),
  );
  return detectedExtension ?? mediaExtension(media, fallback);
}

function writeU16(view: DataView, offset: number, value: number) {
  view.setUint16(offset, value, false);
}

function writeU32(view: DataView, offset: number, value: number) {
  view.setUint32(offset, value, false);
}

function writeAscii(bytes: Uint8Array, offset: number, value: string) {
  for (let i = 0; i < value.length; i++) {
    bytes[offset + i] = value.charCodeAt(i);
  }
}

function writeIfdEntry(
  view: DataView,
  offset: number,
  tag: number,
  type: number,
  count: number,
  valueOrOffset: number,
) {
  writeU16(view, offset, tag);
  writeU16(view, offset + 2, type);
  writeU32(view, offset + 4, count);
  writeU32(view, offset + 8, valueOrOffset);
}

function coordinateToRationals(value: number): [number, number][] {
  const absolute = Math.abs(value);
  const degrees = Math.floor(absolute);
  const minutesFloat = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = Math.round((minutesFloat - minutes) * 60 * 10000);
  return [
    [degrees, 1],
    [minutes, 1],
    [seconds, 10000],
  ];
}

function createExifSegment(post: Post | Memory): Uint8Array {
  const metadata = getPostMetadata(post);
  const dateString = `${formatExifDate(getPostDate(post))}\0`;
  const hasLocation = Boolean(metadata.location);
  const entryCount0 = hasLocation ? 3 : 2;
  const exifIfdOffset = 8 + 2 + entryCount0 * 12 + 4;
  const gpsIfdOffset = exifIfdOffset + 2 + 2 * 12 + 4 + dateString.length * 2;
  const gpsDataOffset = gpsIfdOffset + (hasLocation ? 2 + 4 * 12 + 4 : 0);
  const tiffLength = hasLocation ? gpsDataOffset + 48 : gpsIfdOffset;
  const payloadLength = 6 + tiffLength;
  const segment = new Uint8Array(4 + payloadLength);
  const view = new DataView(segment.buffer);

  segment[0] = 0xff;
  segment[1] = 0xe1;
  writeU16(view, 2, payloadLength + 2);
  writeAscii(segment, 4, "Exif\0\0");

  const tiffStart = 10;
  writeAscii(segment, tiffStart, "MM");
  writeU16(view, tiffStart + 2, 42);
  writeU32(view, tiffStart + 4, 8);

  let entryOffset = tiffStart + 10;
  writeU16(view, tiffStart + 8, entryCount0);
  writeIfdEntry(
    view,
    entryOffset,
    0x0132,
    2,
    dateString.length,
    exifIfdOffset + 2 + 2 * 12 + 4,
  );
  entryOffset += 12;
  writeIfdEntry(view, entryOffset, 0x8769, 4, 1, exifIfdOffset);
  entryOffset += 12;
  if (hasLocation) {
    writeIfdEntry(view, entryOffset, 0x8825, 4, 1, gpsIfdOffset);
  }
  writeU32(view, tiffStart + 10 + entryCount0 * 12, 0);

  const exifStart = tiffStart + exifIfdOffset;
  const dateOffset = exifIfdOffset + 2 + 2 * 12 + 4;
  writeU16(view, exifStart, 2);
  writeIfdEntry(view, exifStart + 2, 0x9003, 2, dateString.length, dateOffset);
  writeIfdEntry(
    view,
    exifStart + 14,
    0x9004,
    2,
    dateString.length,
    dateOffset + dateString.length,
  );
  writeU32(view, exifStart + 26, 0);
  writeAscii(segment, tiffStart + dateOffset, dateString);
  writeAscii(segment, tiffStart + dateOffset + dateString.length, dateString);

  if (metadata.location) {
    const gpsStart = tiffStart + gpsIfdOffset;
    const latitude = coordinateToRationals(metadata.location.latitude);
    const longitude = coordinateToRationals(metadata.location.longitude);
    const latitudeOffset = gpsDataOffset;
    const longitudeOffset = gpsDataOffset + 24;
    writeU16(view, gpsStart, 4);
    writeIfdEntry(
      view,
      gpsStart + 2,
      0x0001,
      2,
      2,
      metadata.location.latitude >= 0 ? 0x4e000000 : 0x53000000,
    );
    writeIfdEntry(view, gpsStart + 14, 0x0002, 5, 3, latitudeOffset);
    writeIfdEntry(
      view,
      gpsStart + 26,
      0x0003,
      2,
      2,
      metadata.location.longitude >= 0 ? 0x45000000 : 0x57000000,
    );
    writeIfdEntry(view, gpsStart + 38, 0x0004, 5, 3, longitudeOffset);
    writeU32(view, gpsStart + 50, 0);

    [...latitude, ...longitude].forEach(([numerator, denominator], index) => {
      const offset = tiffStart + gpsDataOffset + index * 8;
      writeU32(view, offset, numerator);
      writeU32(view, offset + 4, denominator);
    });
  }

  return segment;
}

async function withEmbeddedJpegMetadata(
  blob: Blob,
  filename: string,
  post: Post | Memory,
): Promise<Blob> {
  if (!isJpegBlob(blob, filename)) return blob;

  const bytes = new Uint8Array(await blob.arrayBuffer());
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return blob;

  const exifSegment = createExifSegment(post);
  const output = new Uint8Array(bytes.length + exifSegment.length);
  output.set(bytes.slice(0, 2), 0);
  output.set(exifSegment, 2);
  output.set(bytes.slice(2), 2 + exifSegment.length);
  return new Blob([output], { type: blob.type || "image/jpeg" });
}

function createXmpSidecar(post: Post | Memory): string {
  const metadata = getPostMetadata(post);
  const latitude = metadata.location?.latitude ?? "";
  const longitude = metadata.location?.longitude ?? "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description
      xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/"
      xmlns:exif="http://ns.adobe.com/exif/1.0/"
      xmlns:xmp="http://ns.adobe.com/xap/1.0/"
      xmp:CreateDate="${metadata.takenAt}"
      photoshop:DateCreated="${metadata.takenAt}"
      exif:GPSLatitude="${latitude}"
      exif:GPSLongitude="${longitude}" />
  </rdf:RDF>
</x:xmpmeta>
`;
}

async function prepareMediaBlob(
  blob: Blob,
  filename: string,
  post: Post | Memory,
): Promise<Blob> {
  return withEmbeddedJpegMetadata(blob, filename, post);
}

async function needsXmpSidecar(blob: Blob): Promise<boolean> {
  const extension = sniffMediaExtensionFromHeader(await readBlobHeader(blob));
  return extension !== "jpg";
}

function triggerDownload(blob: Blob, filename: string, lastModified?: Date) {
  const downloadable = lastModified
    ? new File([blob], filename, {
        type: blob.type || "application/octet-stream",
        lastModified: lastModified.getTime(),
      })
    : blob;
  const url = URL.createObjectURL(downloadable);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface PreparedDownloadArtifact {
  blob: Blob;
  filename: string;
  lastModified?: Date;
}

export async function prepareDownloadArtifact(
  posts: (Post | Memory)[],
  mediaMap: MediaMap,
  request: DownloadRequest,
  zipName: string,
): Promise<PreparedDownloadArtifact> {
  const selection = selectionFromRequest(request);
  if (!hasSelectedMedia(selection)) {
    throw new Error("Choose at least one item to download");
  }

  if (
    posts.length === 1 &&
    typeof request === "string" &&
    request !== "both" &&
    request !== "complete"
  ) {
    const post = posts[0];
    const { primaryMedia, secondaryMedia, btsMedia } = getPostMedia(post);

    if (!primaryMedia || !secondaryMedia) {
      throw new Error("Missing required media for download");
    }

    const primaryUrl = mediaMap[primaryMedia.path];
    const secondaryUrl = mediaMap[secondaryMedia.path];

    if (request === "primary") {
      assertImageMedia(primaryMedia, "Primary");
      const sourceBlob = await getBlobFromUrl(primaryUrl);
      const filename = `${zipName}-primary.${await detectedMediaExtension(primaryMedia, sourceBlob)}`;
      const blob = await prepareMediaBlob(sourceBlob, filename, post);
      return { blob, filename, lastModified: getPostDate(post) };
    } else if (request === "secondary") {
      assertImageMedia(secondaryMedia, "Secondary");
      const sourceBlob = await getBlobFromUrl(secondaryUrl);
      const filename = `${zipName}-secondary.${await detectedMediaExtension(secondaryMedia, sourceBlob)}`;
      const blob = await prepareMediaBlob(sourceBlob, filename, post);
      return { blob, filename, lastModified: getPostDate(post) };
    } else if (request === "merged") {
      assertImageMedia(primaryMedia, "Primary");
      assertImageMedia(secondaryMedia, "Secondary");
      const blob = await prepareMediaBlob(
        await createMergedImage(primaryUrl, secondaryUrl),
        `${zipName}-merged.jpg`,
        post,
      );
      return {
        blob,
        filename: `${zipName}-merged.jpg`,
        lastModified: getPostDate(post),
      };
    } else if (request === "video") {
      if (!btsMedia || !mediaMap[btsMedia.path]) {
        throw new Error("No video is available for this post");
      }
      assertVideoMedia(btsMedia, "Video");
      const blob = await getBlobFromUrl(mediaMap[btsMedia.path]);
      const filename = `${zipName}-video.${await detectedMediaExtension(btsMedia, blob, "mp4")}`;
      return { blob, filename, lastModified: getPostDate(post) };
    }

    throw new Error("Unsupported single-file download request");
  } else {
    const zip = new JSZip();
    if (
      isVideoOnly(selection) &&
      downloadableVideoCount(posts, mediaMap) === 0
    ) {
      throw new Error("No videos are available for this selection");
    }

    for (const post of posts) {
      const { primaryMedia, secondaryMedia, btsMedia } = getPostMedia(post);

      if (!primaryMedia || !secondaryMedia) {
        continue;
      }

      if (isVideoOnly(selection) && !canDownloadVideo(post, mediaMap)) {
        continue;
      }

      const dateStr = format(getPostDate(post), "yyyy-MM-dd-HH-mm-ss");
      const postFolder = zip.folder(dateStr);
      const fileDate = getPostDate(post);
      postFolder?.file(
        `metadata.json`,
        JSON.stringify(getPostMetadata(post), null, 2),
        { date: fileDate },
      );

      if (selection.video && btsMedia && canDownloadVideo(post, mediaMap)) {
        assertVideoMedia(btsMedia, "Video");
        const videoBlob = await getBlobFromUrl(mediaMap[btsMedia.path]);
        const videoFilename = `video.${await detectedMediaExtension(btsMedia, videoBlob, "mp4")}`;
        postFolder?.file(videoFilename, await videoBlob.arrayBuffer(), {
          date: fileDate,
        });
        postFolder?.file(`video.xmp`, createXmpSidecar(post), {
          date: fileDate,
        });
        if (isVideoOnly(selection)) {
          continue;
        }
      }

      const needsPrimaryBlob = selection.primary;
      const needsSecondaryBlob = selection.secondary;
      const needsMerged = selection.merged;
      const primaryBlob = needsPrimaryBlob
        ? await getBlobFromUrl(mediaMap[primaryMedia.path])
        : null;
      const secondaryBlob = needsSecondaryBlob
        ? await getBlobFromUrl(mediaMap[secondaryMedia.path])
        : null;

      if (selection.primary && primaryBlob) {
        assertImageMedia(primaryMedia, "Primary");
        const primaryFilename = `primary.${await detectedMediaExtension(primaryMedia, primaryBlob)}`;
        const preparedBlob = await prepareMediaBlob(
          primaryBlob,
          primaryFilename,
          post,
        );
        postFolder?.file(primaryFilename, await preparedBlob.arrayBuffer(), {
          date: fileDate,
        });
        if (await needsXmpSidecar(primaryBlob)) {
          postFolder?.file(`primary.xmp`, createXmpSidecar(post), {
            date: fileDate,
          });
        }
      }
      if (selection.secondary && secondaryBlob) {
        assertImageMedia(secondaryMedia, "Secondary");
        const secondaryFilename = `secondary.${await detectedMediaExtension(secondaryMedia, secondaryBlob)}`;
        const preparedBlob = await prepareMediaBlob(
          secondaryBlob,
          secondaryFilename,
          post,
        );
        postFolder?.file(secondaryFilename, await preparedBlob.arrayBuffer(), {
          date: fileDate,
        });
        if (await needsXmpSidecar(secondaryBlob)) {
          postFolder?.file(`secondary.xmp`, createXmpSidecar(post), {
            date: fileDate,
          });
        }
      }
      if (needsMerged) {
        assertImageMedia(primaryMedia, "Primary");
        assertImageMedia(secondaryMedia, "Secondary");
        const mergedBlob = await prepareMediaBlob(
          await createMergedImage(
            mediaMap[primaryMedia.path],
            mediaMap[secondaryMedia.path],
          ),
          "merged.jpg",
          post,
        );
        postFolder?.file(`merged.jpg`, await mergedBlob.arrayBuffer(), {
          date: fileDate,
        });
      }
    }
    const zipBlob = await zip.generateAsync({ type: "blob" });
    return { blob: zipBlob, filename: `${zipName}.zip` };
  }
}

export async function downloadPosts(
  posts: (Post | Memory)[],
  mediaMap: MediaMap,
  request: DownloadRequest,
  zipName: string,
) {
  const artifact = await prepareDownloadArtifact(
    posts,
    mediaMap,
    request,
    zipName,
  );
  triggerDownload(artifact.blob, artifact.filename, artifact.lastModified);
}
