import { describe, expect, it } from "vitest";
import { canDownloadVideo, downloadableVideoCount } from "./download";
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
