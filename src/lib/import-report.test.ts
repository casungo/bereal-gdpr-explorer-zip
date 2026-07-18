import { describe, expect, it } from "vitest";
import { serializeImportReport } from "./import-report";
import type { ImportCompatibilityReport } from "./types";

describe("serializeImportReport", () => {
  it("copies only the compatibility allowlist", () => {
    const report = {
      appVersion: "2.0.0",
      parserVersion: "1",
      sections: [
        {
          section: "posts",
          status: "recognized",
          acceptedRecords: 2,
          skippedRecords: 1,
          warningCodes: ["INVALID_RECORDS"],
          privateValue: "fixture-secret",
        },
      ],
      recognizedMedia: 4,
      invalidMedia: 0,
      unknownJsonFiles: 1,
      privateValue: "fixture-secret",
    } as unknown as ImportCompatibilityReport;

    const copied = JSON.parse(serializeImportReport(report));
    expect(Object.keys(copied)).toEqual([
      "appVersion",
      "parserVersion",
      "sections",
      "recognizedMedia",
      "invalidMedia",
      "unknownJsonFiles",
    ]);
    expect(Object.keys(copied.sections[0])).toEqual([
      "section",
      "status",
      "acceptedRecords",
      "skippedRecords",
      "warningCodes",
    ]);
    expect(JSON.stringify(copied)).not.toContain("fixture-secret");
  });
});
