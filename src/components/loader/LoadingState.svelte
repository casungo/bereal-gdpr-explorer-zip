<script lang="ts">
import { Loader2 } from "@lucide/svelte";

let { progress } = $props<{
	progress: { total: number; loaded: number; message: string };
}>();
</script>

<div class="flex flex-col items-center space-y-4">
  <Loader2 class="w-12 h-12 animate-spin text-primary" />
  <div class="w-full max-w-md text-center">
    <p class="font-medium">{progress.message}</p>
    <progress
      class="progress progress-primary w-full mt-2"
      value={(progress.loaded / progress.total) * 100}
      max="100"
    ></progress>
    <p class="text-sm opacity-70 mt-1">
      Please keep this tab open while the supported archive is processed.
    </p>
  </div>
</div>
