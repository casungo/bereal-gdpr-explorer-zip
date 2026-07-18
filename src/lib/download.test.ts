import { format } from "date-fns";
import JSZip from "jszip";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  canDownloadVideo,
  detectedMediaExtension,
  downloadableVideoCount,
  prepareDownloadArtifact,
} from "./download";
import type { Media, Memory, Post } from "./types";

const primaryImage: Media = {
  bucket: "bucket",
  height: 1200,
  width: 900,
  path: "Photos/primary.jpg",
  mediaType: "image",
  mimeType: "image/jpeg",
};

const secondaryImage: Media = {
  bucket: "bucket",
  height: 1200,
  width: 900,
  path: "Photos/secondary.jpg",
  mediaType: "image",
  mimeType: "image/jpeg",
};

const btsVideo: Media = {
  bucket: "bucket",
  height: 1920,
  width: 1080,
  path: "Photos/bts.mp4",
  mediaType: "video",
  mimeType: "video/mp4",
};

const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
const webpBytes = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x18, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
  0x56, 0x50, 0x38, 0x20,
]);
const mp4Bytes = new Uint8Array([
  0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d,
]);

function mockMediaFetch(blobs: Record<string, Blob>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const blob = blobs[url];
      return blob
        ? new Response(blob, { status: 200 })
        : new Response(null, { status: 404, statusText: "Not Found" });
    }),
  );
}

function containsBytes(bytes: Uint8Array, expected: number[]): boolean {
  return bytes.some((_, start) =>
    expected.every((value, offset) => bytes[start + offset] === value),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

function makePost(overrides: Partial<Post> = {}): Post {
  return {
    id: "post-1",
    primary: primaryImage,
    secondary: secondaryImage,
    retakeCounter: 0,
    visibility: ["friends"],
    takenAt: "2026-01-01T12:00:00.000Z",
    ...overrides,
  };
}

function makeMemory(overrides: Partial<Memory> = {}): Memory {
  return {
    id: "memory-1",
    frontImage: primaryImage,
    backImage: secondaryImage,
    primary: primaryImage,
    secondary: secondaryImage,
    isLate: false,
    date: "2026-01-01",
    takenTime: "2026-01-01T12:00:00.000Z",
    berealMoment: "2026-01-01T12:00:00.000Z",
    ...overrides,
  };
}

describe("download video rules", () => {
  it("allows a post video only when bts media is present in the media map", () => {
    const post = makePost({ btsMedia: btsVideo });

    expect(canDownloadVideo(post, { [btsVideo.path]: "blob:video" })).toBe(
      true,
    );
    expect(canDownloadVideo(post, {})).toBe(false);
  });

  it("allows memory videos through the same bts media rule", () => {
    const memory = makeMemory({ btsMedia: btsVideo });

    expect(canDownloadVideo(memory, { [btsVideo.path]: "blob:video" })).toBe(
      true,
    );
  });

  it("rejects selections without video media", () => {
    const post = makePost();
    const fakeVideoPathImage = {
      ...btsVideo,
      mediaType: "image" as const,
      mimeType: "image/jpeg",
    };
    const invalidPost = makePost({ btsMedia: fakeVideoPathImage });

    expect(canDownloadVideo(post, { [btsVideo.path]: "blob:video" })).toBe(
      false,
    );
    expect(
      canDownloadVideo(invalidPost, {
        [fakeVideoPathImage.path]: "blob:image",
      }),
    ).toBe(false);
  });

  it("counts only posts with downloadable video media", () => {
    const posts = [
      makePost({ id: "with-video", btsMedia: btsVideo }),
      makePost({ id: "without-video" }),
      makeMemory({ id: "memory-with-video", btsMedia: btsVideo }),
    ];

    expect(
      downloadableVideoCount(posts, { [btsVideo.path]: "blob:video" }),
    ).toBe(2);
  });
});

describe("media extension detection", () => {
  it("uses actual WebP bytes even when export metadata says JPEG", async () => {
    const mislabeledWebp = {
      ...primaryImage,
      path: "Photos/primary.jpg",
      mimeType: "image/jpeg",
    };
    const webpHeader = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x18, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
      0x56, 0x50, 0x38, 0x20,
    ]);

    await expect(
      detectedMediaExtension(mislabeledWebp, new Blob([webpHeader])),
    ).resolves.toBe("webp");
  });

  it("uses actual JPEG bytes even when the path is misleading", async () => {
    const mislabeledJpeg = {
      ...primaryImage,
      path: "Photos/primary.webp",
      mimeType: "image/webp",
    };
    const jpegHeader = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);

    await expect(
      detectedMediaExtension(mislabeledJpeg, new Blob([jpegHeader])),
    ).resolves.toBe("jpg");
  });
});

describe("prepared download artifacts", () => {
  it("builds a selected-media ZIP with metadata, original extensions, sidecars, and dates", async () => {
    const post = makePost({
      caption: "Synthetic caption",
      location: { latitude: 45.5, longitude: 9.25 },
      btsMedia: btsVideo,
    });
    mockMediaFetch({
      "blob:primary": new Blob([jpegBytes], { type: "image/jpeg" }),
      "blob:secondary": new Blob([webpBytes], { type: "image/webp" }),
      "blob:video": new Blob([mp4Bytes], { type: "video/mp4" }),
    });

    const artifact = await prepareDownloadArtifact(
      [post],
      {
        [primaryImage.path]: "blob:primary",
        [secondaryImage.path]: "blob:secondary",
        [btsVideo.path]: "blob:video",
      },
      { primary: true, secondary: true, merged: false, video: true },
      "selected",
    );
    const zip = await JSZip.loadAsync(await artifact.blob.arrayBuffer());
    const folder = format(new Date(post.takenAt), "yyyy-MM-dd-HH-mm-ss");
    const names = Object.keys(zip.files).sort();

    expect(artifact.filename).toBe("selected.zip");
    expect(names).toEqual([
      `${folder}/`,
      `${folder}/metadata.json`,
      `${folder}/primary.jpg`,
      `${folder}/secondary.webp`,
      `${folder}/secondary.xmp`,
      `${folder}/video.mp4`,
      `${folder}/video.xmp`,
    ]);
    expect(names).not.toContain(`${folder}/merged.jpg`);
    expect(names).not.toContain(`${folder}/primary.xmp`);

    const metadata = JSON.parse(
      await zip.file(`${folder}/metadata.json`)!.async("string"),
    );
    expect(metadata).toEqual({
      id: "post-1",
      takenAt: "2026-01-01T12:00:00.000Z",
      location: { latitude: 45.5, longitude: 9.25 },
      caption: "Synthetic caption",
      isMemory: false,
    });
    expect(zip.file(`${folder}/primary.jpg`)!.date.getTime()).toBe(
      new Date(post.takenAt).getTime(),
    );
    for (const name of names.filter((name) => !name.endsWith("/"))) {
      expect(zip.file(name)!.date.getTime()).toBe(new Date(post.takenAt).getTime());
    }

    const expectedXmp = `<?xml version="1.0" encoding="UTF-8"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description
      xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/"
      xmlns:exif="http://ns.adobe.com/exif/1.0/"
      xmlns:xmp="http://ns.adobe.com/xap/1.0/"
      xmp:CreateDate="2026-01-01T12:00:00.000Z"
      photoshop:DateCreated="2026-01-01T12:00:00.000Z"
      exif:GPSLatitude="45.5"
      exif:GPSLongitude="9.25" />
  </rdf:RDF>
</x:xmpmeta>
`;
    expect(await zip.file(`${folder}/secondary.xmp`)!.async("string")).toBe(
      expectedXmp,
    );
    expect(await zip.file(`${folder}/video.xmp`)!.async("string")).toBe(
      expectedXmp,
    );
  });

  it("excludes unselected media from a DOM-free ZIP", async () => {
    const post = makePost({ btsMedia: btsVideo });
    mockMediaFetch({
      "blob:primary": new Blob([jpegBytes], { type: "image/jpeg" }),
    });

    const artifact = await prepareDownloadArtifact(
      [post],
      {
        [primaryImage.path]: "blob:primary",
        [secondaryImage.path]: "blob:secondary",
        [btsVideo.path]: "blob:video",
      },
      { primary: true, secondary: false, merged: false, video: false },
      "primary-only",
    );
    const zip = await JSZip.loadAsync(await artifact.blob.arrayBuffer());

    const folder = format(new Date(post.takenAt), "yyyy-MM-dd-HH-mm-ss");
    expect(Object.keys(zip.files).sort()).toEqual([
      `${folder}/`,
      `${folder}/metadata.json`,
      `${folder}/primary.jpg`,
    ]);
  });

  it("embeds EXIF timestamps and GPS only when location exists", async () => {
    mockMediaFetch({
      "blob:primary": new Blob([jpegBytes], { type: "image/jpeg" }),
    });
    const locatedPost = makePost({
      location: { latitude: 45.5, longitude: 9.25 },
    });
    const located = await prepareDownloadArtifact(
      [locatedPost],
      { [primaryImage.path]: "blob:primary" },
      "primary",
      "located",
    );
    const locatedBytes = new Uint8Array(await located.blob.arrayBuffer());
    const expectedDate = format(
      new Date(locatedPost.takenAt),
      "yyyy:MM:dd HH:mm:ss",
    );

    expect([...locatedBytes.slice(0, 4)]).toEqual([0xff, 0xd8, 0xff, 0xe1]);
    expect(new TextDecoder().decode(locatedBytes.slice(6, 12))).toBe(
      "Exif\0\0",
    );
    expect(new TextDecoder().decode(locatedBytes)).toContain(expectedDate);
    expect(containsBytes(locatedBytes, [0x90, 0x03])).toBe(true);
    expect(containsBytes(locatedBytes, [0x90, 0x04])).toBe(true);
    expect(containsBytes(locatedBytes, [0x88, 0x25])).toBe(true);
    expect(located.filename).toBe("located-primary.jpg");
    expect(located.lastModified?.getTime()).toBe(
      new Date(locatedPost.takenAt).getTime(),
    );

    const unlocatedPost = makePost({ location: undefined });
    const unlocated = await prepareDownloadArtifact(
      [unlocatedPost],
      { [primaryImage.path]: "blob:primary" },
      "primary",
      "unlocated",
    );
    const unlocatedBytes = new Uint8Array(await unlocated.blob.arrayBuffer());
    expect([...unlocatedBytes.slice(0, 4)]).toEqual([
      0xff, 0xd8, 0xff, 0xe1,
    ]);
    expect(containsBytes(unlocatedBytes, [0x88, 0x25])).toBe(false);
  });

  it.todo("verifies merged-image canvas pixels in a real browser");
});
