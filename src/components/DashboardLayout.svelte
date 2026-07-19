<script lang="ts">
  import { Menu } from "@lucide/svelte";

  let {
    sidebarOpen = $bindable(false),
    title,
    children,
    sidebar,
  } = $props<{
    sidebarOpen: boolean;
    title: string;
    children: any;
    sidebar: any;
  }>();
</script>

<div class="drawer lg:drawer-open">
  <input
    id="drawer-toggle"
    type="checkbox"
    class="drawer-toggle"
    bind:checked={sidebarOpen}
  />

  <div class="drawer-content flex flex-col">
    <!-- Mobile Header -->
    <header
      class="navbar w-full bg-base-100/90 shadow-[0_1px_0_oklch(0_0_0/0.06)] backdrop-blur-xl lg:hidden"
    >
      <div class="flex-none">
        <label for="drawer-toggle" class="btn btn-square btn-ghost">
          <Menu class="w-6 h-6" />
        </label>
      </div>
      <div class="flex-1">
        <h1 class="text-xl font-semibold">
          {title}
        </h1>
      </div>
    </header>

    <!-- Desktop Header -->
    <header
      class="hidden h-16 items-center bg-base-100/90 px-8 shadow-[0_1px_0_oklch(0_0_0/0.06)] backdrop-blur-xl lg:flex"
    >
      <h2 class="text-xl font-semibold">
        {title}
      </h2>
    </header>

    <main class="flex-1 bg-base-200 p-4 md:p-8">
      <div class="mx-auto max-w-[96rem]">
        {@render children()}
      </div>
    </main>
  </div>

  <div class="drawer-side z-50">
    <label for="drawer-toggle" aria-label="close sidebar" class="drawer-overlay"
    ></label>
    {@render sidebar()}
  </div>
</div>

<style>
  main {
    min-height: calc(100vh - 3.5rem);
  }
</style>
