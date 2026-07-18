import type { AnalyticsEvent } from "@/lib/types";

export interface AnalyticsCount {
  label: string;
  count: number;
}

export interface AnalyticsSummary {
  validTotal: number;
  invalidTotal: number;
  activeDays: number;
  topEventTypes: AnalyticsCount[];
  hourlyCounts: number[];
  platformCounts: AnalyticsCount[];
  deviceCounts: AnalyticsCount[];
  countryCounts: AnalyticsCount[];
}

// Sanitized export fixtures contain Unix timestamps in both seconds and
// milliseconds. Values below 1e11 cannot yet be plausible millisecond dates.
export function normalizeAnalyticsTimestamp(value: number): Date | null {
  if (!Number.isFinite(value) || value < 0) return null;
  const date = new Date(value < 100_000_000_000 ? value * 1000 : value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function countBy(values: string[]): AnalyticsCount[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    const label = value.trim() || "Unknown";
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || (a.label < b.label ? -1 : 1));
}

function dateParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((candidate) => candidate.type === type)?.value ?? "00";
  return {
    day: `${part("year")}-${part("month")}-${part("day")}`,
    hour: Number(part("hour")) % 24,
  };
}

export function aggregateAnalytics(
  events: AnalyticsEvent[],
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
): AnalyticsSummary {
  const valid = events.flatMap((event) => {
    const date = normalizeAnalyticsTimestamp(event.event_time);
    return date ? [{ event, date }] : [];
  });
  const hourlyCounts = Array.from({ length: 24 }, () => 0);
  const activeDays = new Set<string>();

  for (const { date } of valid) {
    const parts = dateParts(date, timeZone);
    activeDays.add(parts.day);
    hourlyCounts[parts.hour]++;
  }

  return {
    validTotal: valid.length,
    invalidTotal: events.length - valid.length,
    activeDays: activeDays.size,
    topEventTypes: countBy(valid.map(({ event }) => event.event_type)).slice(
      0,
      5,
    ),
    hourlyCounts,
    platformCounts: countBy(
      valid.map(({ event }) => event.platform ?? "Unknown"),
    ),
    deviceCounts: countBy(
      valid.map(({ event }) => event.device_type ?? "Unknown"),
    ),
    countryCounts: countBy(
      valid.map(({ event }) => event.country ?? "Unknown"),
    ),
  };
}
