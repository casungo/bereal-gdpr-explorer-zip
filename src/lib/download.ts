import JSZip from "jszip";
import type { Post, Memory, Media, MediaMap } from "@lib/types";
import { format } from "date-fns";

export type DownloadType = "primary" | "secondary" | "both" | "merged";

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
  radius: number
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
  secondaryUrl: string
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  const primaryImg = await loadImage(primaryUrl);
  const secondaryImg = await loadImage(secondaryUrl);

  const pipWidth = Math.floor(primaryImg.width / 3.5);
  const pipHeight = Math.floor(pipWidth * (4 / 3));
  const margin = Math.floor(primaryImg.width / 40);
  const borderRadius = Math.floor(primaryImg.width / 50);

  canvas.width = primaryImg.width;
  canvas.height = primaryImg.height;

  ctx.drawImage(primaryImg, 0, 0);

  ctx.save();

  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = 15;
  ctx.shadowOffsetX = 5;
  ctx.shadowOffsetY = 5;

  roundRect(ctx, margin, margin, pipWidth, pipHeight, borderRadius);
  ctx.clip();

  ctx.drawImage(secondaryImg, margin, margin, pipWidth, pipHeight);

  ctx.restore();

  ctx.lineWidth = Math.max(4, primaryImg.width / 200);
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
      0.95
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

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadPosts(
  posts: (Post | Memory)[],
  mediaMap: MediaMap,
  type: DownloadType,
  zipName: string
) {
  if (posts.length === 1 && type !== "both") {
    const post = posts[0];
    let primaryMedia: Media;
    let secondaryMedia: Media;
    let btsMedia: Media | undefined;

    if ("primary" in post) {
      const postAsPost = post as Post;
      primaryMedia = postAsPost.primary;
      secondaryMedia = postAsPost.secondary;
      btsMedia = postAsPost.btsMedia;
    } else {
      const postAsMemory = post as Memory;
      primaryMedia = postAsMemory.frontImage;
      secondaryMedia = postAsMemory.backImage;
      btsMedia = postAsMemory.btsMedia;
    }

    if (!primaryMedia || !secondaryMedia) {
      throw new Error("Missing required media for download");
    }

    const primaryUrl = mediaMap[primaryMedia.path];
    const secondaryUrl = mediaMap[secondaryMedia.path];

    if (type === "primary") {
      const blob = await getBlobFromUrl(primaryUrl);
      triggerDownload(blob, `${zipName}-primary.jpg`);
    } else if (type === "secondary") {
      const blob = await getBlobFromUrl(secondaryUrl);
      triggerDownload(blob, `${zipName}-secondary.jpg`);
    } else if (type === "merged") {
      if (btsMedia && mediaMap[btsMedia.path]) {
        const blob = await getBlobFromUrl(mediaMap[btsMedia.path]);
        triggerDownload(blob, `${zipName}.mp4`);
      } else {
        const blob = await createMergedImage(primaryUrl, secondaryUrl);
        triggerDownload(blob, `${zipName}-merged.jpg`);
      }
    }
  } else {
    const zip = new JSZip();
    for (const post of posts) {
      let primaryMedia: Media;
      let secondaryMedia: Media;
      let btsMedia: Media | undefined;

      if ("primary" in post) {
        const postAsPost = post as Post;
        primaryMedia = postAsPost.primary;
        secondaryMedia = postAsPost.secondary;
        btsMedia = postAsPost.btsMedia;
      } else {
        const postAsMemory = post as Memory;
        primaryMedia = postAsMemory.frontImage;
        secondaryMedia = postAsMemory.backImage;
        btsMedia = postAsMemory.btsMedia;
      }

      if (!primaryMedia || !secondaryMedia) {
        continue;
      }

      const dateStr = format(
        new Date(
          "primary" in post
            ? (post as Post).takenAt || ""
            : (post as Memory).takenTime
        ),
        "yyyy-MM-dd-HH-mm-ss"
      );
      const postFolder = zip.folder(dateStr);

      if (btsMedia && mediaMap[btsMedia.path]) {
        const videoBlob = await getBlobFromUrl(mediaMap[btsMedia.path]);
        postFolder?.file(`video.mp4`, videoBlob);
      }

      const primaryBlob = await getBlobFromUrl(mediaMap[primaryMedia.path]);
      const secondaryBlob = await getBlobFromUrl(mediaMap[secondaryMedia.path]);

      if (type === "primary" || type === "both") {
        postFolder?.file(`primary.jpg`, primaryBlob);
      }
      if (type === "secondary" || type === "both") {
        postFolder?.file(`secondary.jpg`, secondaryBlob);
      }
      if (type === "merged") {
        if (!btsMedia) {
          const mergedBlob = await createMergedImage(
            mediaMap[primaryMedia.path],
            mediaMap[secondaryMedia.path]
          );
          postFolder?.file(`merged.jpg`, mergedBlob);
        }
      }
    }
    const zipBlob = await zip.generateAsync({ type: "blob" });
    triggerDownload(zipBlob, `${zipName}.zip`);
  }
}
