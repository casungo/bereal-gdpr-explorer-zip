<script lang="ts">
  import { Sun, Moon } from "@lucide/svelte";
  import { themeStore } from "@lib/stores/theme";
  import { onMount } from "svelte";

  let isDark = $state(false);

  onMount(() => {
    themeStore.init();

    const unsubscribe = themeStore.subscribe((theme) => {
      isDark = theme === "halloween";
    });

    return unsubscribe;
  });

  function toggleTheme() {
    themeStore.toggle();
  }
</script>

<button
  class="btn btn-ghost btn-circle"
  onclick={toggleTheme}
  aria-label="Toggle theme"
  title="Toggle between light and dark mode"
>
  {#if isDark}
    <Sun class="w-5 h-5" />
  {:else}
    <Moon class="w-5 h-5" />
  {/if}
</button>
