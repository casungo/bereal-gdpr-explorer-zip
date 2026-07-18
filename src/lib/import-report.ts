import type { ImportCompatibilityReport } from "@/lib/types";

export function serializeImportReport(
  report: ImportCompatibilityReport,
): string {
  return JSON.stringify(
    {
      appVersion: report.appVersion,
      parserVersion: report.parserVersion,
      sections: report.sections.map((section) => ({
        section: section.section,
        status: section.status,
        acceptedRecords: section.acceptedRecords,
        skippedRecords: section.skippedRecords,
        warningCodes: [...section.warningCodes],
      })),
      recognizedMedia: report.recognizedMedia,
      invalidMedia: report.invalidMedia,
      unknownJsonFiles: report.unknownJsonFiles,
    },
    null,
    2,
  );
}
