<script lang="ts">
  let {
    class: className = "",
    alt = "",
    priority = false,
  } = $props<{
    class?: string;
    alt?: string;
    priority?: boolean;
  }>();
</script>

<img
  src="/icon-192.png"
  width="192"
  height="192"
  {alt}
  class="brand-logo {className}"
  loading={priority ? "eager" : "lazy"}
  fetchpriority={priority ? "high" : "auto"}
  decoding="async"
  draggable="false"
/>

<style>
  .brand-logo {
    display: block;
    flex: none;
    border-radius: 18.75%;
    box-shadow: 0 2px 8px oklch(0.205 0.028 264 / 0.18);
    object-fit: cover;
  }
</style>
