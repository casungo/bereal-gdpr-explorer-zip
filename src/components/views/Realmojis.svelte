<script lang="ts">
  import type { Realmoji, MediaMap } from "@lib/types";

  let { realmojis, media } = $props<{
    realmojis: Realmoji[];
    media: MediaMap;
  }>();
</script>

<div class="p-4">
  <h1 class="text-2xl font-bold mb-4">Realmojis</h1>
  <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
    {#each realmojis as realmoji}
      <div class="card bg-base-200 shadow-xl">
        <figure class="relative">
          {#if realmoji.media && media[realmoji.media.path]}
            <img src={media[realmoji.media.path]} alt={realmoji.emoji} />
          {/if}
          <div class="absolute bottom-2 right-2 text-4xl">{realmoji.emoji}</div>
        </figure>
      </div>
    {/each}
  </div>
</div>
