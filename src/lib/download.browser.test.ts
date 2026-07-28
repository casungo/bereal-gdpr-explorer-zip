import { describe, expect, it } from "vitest";
import { prepareDownloadArtifact } from "./download";
import type { Media, Post } from "./types";

const primaryMedia: Media = {
  bucket: "browser-test",
  height: 350,
  width: 350,
  path: "primary.jpg",
  mediaType: "image",
  mimeType: "image/jpeg",
};

const secondaryMedia: Media = {
  bucket: "browser-test",
  height: 400,
  width: 300,
  path: "secondary.jpg",
  mediaType: "image",
  mimeType: "image/jpeg",
};

const post: Post = {
  id: "browser-post",
  primary: primaryMedia,
  secondary: secondaryMedia,
  retakeCounter: 0,
  visibility: ["friends"],
  takenAt: "2026-01-01T12:00:00.000Z",
};

async function solidJpegUrl(
  width: number,
  height: number,
  color: string,
): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable");
  context.fillStyle = color;
  context.fillRect(0, 0, width, height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) =>
        result ? resolve(result) : reject(new Error("JPEG encoding failed")),
      "image/jpeg",
      1,
    );
  });
  return URL.createObjectURL(blob);
}

function pixelAt(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
): [number, number, number, number] {
  return [...context.getImageData(x, y, 1, 1).data] as [
    number,
    number,
    number,
    number,
  ];
}

describe("merged image rendering", () => {
  it("composes primary and secondary pixels in a real browser canvas", async () => {
    const primaryUrl = await solidJpegUrl(350, 350, "#ff0000");
    const secondaryUrl = await solidJpegUrl(300, 400, "#0000ff");

    try {
      const artifact = await prepareDownloadArtifact(
        [post],
        {
          [primaryMedia.path]: primaryUrl,
          [secondaryMedia.path]: secondaryUrl,
        },
        "merged",
        "pixel-check",
      );
      const bitmap = await createImageBitmap(artifact.blob);
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas is unavailable");
      context.drawImage(bitmap, 0, 0);

      expect(artifact.filename).toBe("pixel-check-merged.jpg");
      expect([bitmap.width, bitmap.height]).toEqual([350, 350]);

      const primaryPixel = pixelAt(context, 250, 250);
      expect(primaryPixel[0]).toBeGreaterThan(220);
      expect(primaryPixel[1]).toBeLessThan(40);
      expect(primaryPixel[2]).toBeLessThan(40);

      const secondaryPixel = pixelAt(context, 58, 70);
      expect(secondaryPixel[0]).toBeLessThan(40);
      expect(secondaryPixel[1]).toBeLessThan(40);
      expect(secondaryPixel[2]).toBeGreaterThan(220);
      expect(secondaryPixel[3]).toBe(255);
    } finally {
      URL.revokeObjectURL(primaryUrl);
      URL.revokeObjectURL(secondaryUrl);
    }
  });
});
