<script lang="ts">
  import DataLoader from "./DataLoader.svelte";
  import Dashboard from "@components/Sidebar.svelte";
  import { appStore } from "@lib/stores/app";

  const { data, media } = appStore;

  let showDashboard = $state(false);

  $effect(() => {
    showDashboard = $data !== null && $media !== null;
  });

  function resetData() {
    appStore.resetData();
    showDashboard = false;
  }
</script>

{#if showDashboard && $data && $media}
  <Dashboard data={$data} media={$media} {resetData} />
{:else}
  <DataLoader />
{/if}
