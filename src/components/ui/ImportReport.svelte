<script lang="ts">
  import type { ImportCompatibilityReport } from "@/lib/types";
  import { serializeImportReport } from "@/lib/import-report";

  let { report }: { report: ImportCompatibilityReport } = $props();
  let copyState = $state("");

  const recognized = $derived(
    report.sections.filter((section) => section.status === "recognized").length,
  );

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(serializeImportReport(report));
      copyState = "Copied";
    } catch {
      copyState = "Copy unavailable";
    }
  }
</script>

<section
  class="card bg-base-100 shadow mb-4"
  aria-labelledby="import-report-title"
>
  <div class="card-body p-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 id="import-report-title" class="font-semibold">
          Import compatibility
        </h2>
        <p class="text-sm text-base-content/70">
          {recognized}/{report.sections.length} sections recognized · {report.recognizedMedia}
          media items
        </p>
      </div>
      <div class="flex items-center gap-2">
        {#if copyState}<span class="text-sm">{copyState}</span>{/if}
        <button class="btn btn-outline btn-sm" onclick={copyReport}>
          Copy report
        </button>
      </div>
    </div>

    <details class="mt-2">
      <summary class="cursor-pointer text-sm font-medium"
        >Section details</summary
      >
      <div class="overflow-x-auto mt-3">
        <table class="table table-sm">
          <thead>
            <tr>
              <th>Section</th>
              <th>Status</th>
              <th>Accepted</th>
              <th>Skipped</th>
              <th>Codes</th>
            </tr>
          </thead>
          <tbody>
            {#each report.sections as section}
              <tr>
                <td>{section.section}</td>
                <td>{section.status}</td>
                <td>{section.acceptedRecords}</td>
                <td>{section.skippedRecords}</td>
                <td>{section.warningCodes.join(", ") || "—"}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <p class="text-xs text-base-content/60 mt-3">
        Parser {report.parserVersion} · App {report.appVersion} · {report.unknownJsonFiles}
        unknown JSON files · {report.invalidMedia} invalid media items
      </p>
    </details>
  </div>
</section>
