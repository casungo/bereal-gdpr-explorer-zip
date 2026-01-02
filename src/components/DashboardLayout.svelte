<script
  lang="ts"
>
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

<div
  class="drawer lg:drawer-open"
>
  <input
    id="drawer-toggle"
    type="checkbox"
    class="drawer-toggle"
    bind:checked={
      sidebarOpen
    }
  />

  <div
    class="drawer-content flex flex-col"
  >
    <!-- Mobile Header -->
    <header
      class="navbar bg-base-100 w-full border-b lg:hidden"
    >
      <div
        class="flex-none"
      >
        <label
          for="drawer-toggle"
          class="btn btn-square btn-ghost"
        >
          <Menu
            class="w-6 h-6"
          />
        </label>
      </div>
      <div
        class="flex-1"
      >
        <h1
          class="text-xl font-semibold"
        >
          {title}
        </h1>
      </div>
    </header>

    <!-- Desktop Header -->
    <header
      class="hidden lg:flex items-center h-14 px-6 border-b bg-base-100"
    >
      <h2
        class="text-xl font-semibold"
      >
        {title}
      </h2>
    </header>

    <main
      class="flex-1 p-4 md:p-6 bg-base-50"
    >
      {@render children()}
    </main>
  </div>

  <div
    class="drawer-side z-50"
  >
    <label
      for="drawer-toggle"
      aria-label="close sidebar"
      class="drawer-overlay"

    ></label>
    {@render sidebar()}
  </div>
</div>

<style
>
  main {
    min-height: calc(
      100vh -
        3.5rem
    );
  }
</style>
