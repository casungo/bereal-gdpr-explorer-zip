<script lang="ts">
  import type { Term } from "@lib/types";
  import { createSortableData } from "@lib/sortable.svelte.ts";
  import { exportToCsv } from "@lib/export";
  import { format, isValid } from "date-fns";
  import { ArrowUpDown, Download, ExternalLink } from "@lucide/svelte";

  let { terms = [] } = $props<{
    terms: Term[];
  }>();

  const termsSortable = createSortableData<Term>(terms, {
    key: "date",
    direction: "descending",
  });
  const termsSortConfig = $derived(termsSortable.sortConfig);

  function handleExport() {
    const dataToExport = termsSortable.sortedItems.map((term) => {
      const termDateObj = new Date(term.date || "");
      const formattedDate =
        isValid(termDateObj) && termDateObj.getFullYear() > 1970
          ? format(termDateObj, "PPpp")
          : "N/A";
      return {
        policy: term.code.replace(/_/g, " "),
        status: term.status.toLowerCase(),
        date: formattedDate,
        url: term.url,
      };
    });
    exportToCsv(dataToExport, "terms_and_consents.csv");
  }

  function getSortIndicator(
    key: string,
    currentConfig: { key: string; direction: string } | null
  ) {
    if (!currentConfig || currentConfig.key !== key) {
      return "opacity-50";
    }
    return currentConfig.direction === "ascending" ? "" : "rotate-180";
  }

  function getBadgeClass(status: string) {
    const statusLower = status.toLowerCase();
    if (statusLower === "accepted") return "badge-success";
    if (statusLower === "declined") return "badge-error";
    return "badge-neutral";
  }
</script>

<div class="p-4">
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <div class="flex justify-between items-center mb-4">
        <div>
          <h2 class="card-title">Terms & Consents</h2>
          <p class="text-base-content/70">
            A record of the terms and policies you've agreed to.
          </p>
        </div>
        <button
          class="btn btn-outline btn-sm"
          onclick={handleExport}
          disabled={terms.length === 0}
        >
          <Download class="w-4 h-4 mr-2" />
          Export CSV
        </button>
      </div>

      {#if terms.length > 0}
        <div class="overflow-x-auto">
          <table class="table table-zebra w-full">
            <thead>
              <tr>
                <th>
                  <button
                    class="btn btn-ghost btn-sm p-0 font-bold"
                    onclick={() => termsSortable.requestSort("code")}
                  >
                    Policy
                    <ArrowUpDown
                      class="w-4 h-4 {getSortIndicator(
                        'code',
                        termsSortConfig
                      )}"
                    />
                  </button>
                </th>
                <th>
                  <button
                    class="btn btn-ghost btn-sm p-0 font-bold"
                    onclick={() => termsSortable.requestSort("status")}
                  >
                    Status
                    <ArrowUpDown
                      class="w-4 h-4 {getSortIndicator(
                        'status',
                        termsSortConfig
                      )}"
                    />
                  </button>
                </th>
                <th>
                  <button
                    class="btn btn-ghost btn-sm p-0 font-bold"
                    onclick={() => termsSortable.requestSort("date")}
                  >
                    Date
                    <ArrowUpDown
                      class="w-4 h-4 {getSortIndicator(
                        'date',
                        termsSortConfig
                      )}"
                    />
                  </button>
                </th>
                <th>Link</th>
              </tr>
            </thead>
            <tbody>
              {#each termsSortable.sortedItems as term}
                {@const termDateObj = new Date(term.date || "")}
                {@const formattedDate =
                  isValid(termDateObj) && termDateObj.getFullYear() > 1970
                    ? format(termDateObj, "PPpp")
                    : "N/A"}
                <tr>
                  <td class="font-medium capitalize"
                    >{term.code.replace(/_/g, " ")}</td
                  >
                  <td>
                    <div class="badge {getBadgeClass(term.status)}">
                      {term.status.toLowerCase()}
                    </div>
                  </td>
                  <td>{formattedDate}</td>
                  <td>
                    <a
                      href={term.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="flex items-center gap-1 text-primary hover:underline"
                    >
                      View
                      <ExternalLink class="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <div class="text-center py-8 text-base-content/50">
          <p>No terms and consents data found.</p>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
</style>
