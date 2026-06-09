<script lang="ts">
	import type { Component } from "svelte";

	let { icon, title, description, actionLabel, onAction } = $props<{
		icon?: Component;
		title: string;
		description?: string;
		actionLabel?: string;
		onAction?: () => void;
	}>();
</script>

<div
	class="flex min-h-56 items-center justify-center rounded-lg border border-dashed border-base-300 bg-base-100 px-6 py-12 text-center"
>
	<div class="max-w-sm space-y-4">
		{#if icon}
			<div
				class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-base-200 text-base-content/60"
			>
				<svelte:component this={icon} class="h-7 w-7" />
			</div>
		{/if}
		<div>
			<h2 class="text-base font-semibold">{title}</h2>
			{#if description}
				<p class="mt-1 text-sm text-base-content/60">{description}</p>
			{/if}
		</div>
		{#if actionLabel && onAction}
			<button class="btn btn-outline btn-sm" onclick={onAction}>
				{actionLabel}
			</button>
		{/if}
	</div>
</div>
