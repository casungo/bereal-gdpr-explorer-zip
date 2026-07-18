import { describe, expect, it } from "vitest";
import { aggregateAnalytics, normalizeAnalyticsTimestamp } from "./analytics";
import type { AnalyticsEvent } from "./types";

const event = (
  event_type: string,
  event_time: number,
  extra: Partial<AnalyticsEvent> = {},
): AnalyticsEvent => ({ event_type, event_time, ...extra });

describe("analytics timestamp normalization", () => {
  it("normalizes evidenced Unix seconds and milliseconds to UTC", () => {
    expect(normalizeAnalyticsTimestamp(1_704_067_200)?.toISOString()).toBe(
      "2024-01-01T00:00:00.000Z",
    );
    expect(normalizeAnalyticsTimestamp(1_704_067_200_000)?.toISOString()).toBe(
      "2024-01-01T00:00:00.000Z",
    );
  });

  it("rejects invalid numeric timestamps", () => {
    expect(normalizeAnalyticsTimestamp(Number.NaN)).toBeNull();
    expect(normalizeAnalyticsTimestamp(Number.POSITIVE_INFINITY)).toBeNull();
    expect(normalizeAnalyticsTimestamp(-1)).toBeNull();
  });
});

describe("aggregateAnalytics", () => {
  it("returns empty deterministic structures", () => {
    expect(aggregateAnalytics([], "UTC")).toEqual({
      validTotal: 0,
      invalidTotal: 0,
      activeDays: 0,
      topEventTypes: [],
      hourlyCounts: Array.from({ length: 24 }, () => 0),
      platformCounts: [],
      deviceCounts: [],
      countryCounts: [],
    });
  });

  it("counts UTC days and hours without mutating input", () => {
    const events = [
      event("open", Date.UTC(2024, 0, 1, 23) / 1000),
      event("close", Date.UTC(2024, 0, 2, 0)),
    ];
    const original = structuredClone(events);
    const result = aggregateAnalytics(events, "UTC");

    expect(result.activeDays).toBe(2);
    expect(result.hourlyCounts[23]).toBe(1);
    expect(result.hourlyCounts[0]).toBe(1);
    expect(events).toEqual(original);
  });

  it("sorts tied labels deterministically", () => {
    const result = aggregateAnalytics(
      [event("zeta", 1_704_067_200), event("alpha", 1_704_067_201)],
      "UTC",
    );
    expect(result.topEventTypes).toEqual([
      { label: "alpha", count: 1 },
      { label: "zeta", count: 1 },
    ]);
  });

  it("counts invalid timestamps without exposing their values", () => {
    const result = aggregateAnalytics(
      [event("valid", 1_704_067_200), event("bad", -1)],
      "UTC",
    );
    expect(result.validTotal).toBe(1);
    expect(result.invalidTotal).toBe(1);
    expect(result.topEventTypes).toEqual([{ label: "valid", count: 1 }]);
  });

  it("groups missing platform, device, and country strings as unknown", () => {
    const result = aggregateAnalytics(
      [
        event("open", 1_704_067_200),
        event("open", 1_704_067_201, {
          platform: "ios",
          device_type: "phone",
          country: "IT",
        }),
      ],
      "UTC",
    );
    expect(result.platformCounts).toEqual([
      { label: "Unknown", count: 1 },
      { label: "ios", count: 1 },
    ]);
    expect(result.deviceCounts).toEqual([
      { label: "Unknown", count: 1 },
      { label: "phone", count: 1 },
    ]);
    expect(result.countryCounts).toEqual([
      { label: "IT", count: 1 },
      { label: "Unknown", count: 1 },
    ]);
  });
});
