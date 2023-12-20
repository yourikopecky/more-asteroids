<script lang="ts">
	import { onMount } from 'svelte';
	import { tweened } from 'svelte/motion';
	import { fade } from 'svelte/transition';

	let display = true;
	const translateValue = tweened(0, { duration: 1500 });

	onMount(() => {
		$translateValue = 30;

		const displayIntervalId = setInterval(() => {
			display = !display;
		}, 250);

		setTimeout(() => {
			clearInterval(displayIntervalId);
			display = false;
		}, 5000);
	});
</script>

{#if display}
	<div
		class="more-relative more-flex more-justify-center more-items-center more-animate-ping"
		out:fade|local
	>
		<div
			class="more-absolute more-w-4 more-h-1 more-bg-red-500 more-box-shadow"
			style="transform: translateX({$translateValue}px);"
		/>
		<div
			class="more-absolute more-w-4 more-h-1 more-bg-red-500 more-box-shadow"
			style="transform: rotate(45deg) translate({$translateValue}px);"
		/>
		<div
			class="more-absolute more-w-4 more-h-1 more-bg-red-500 more-box-shadow -rotate-45"
			style="transform: rotate(-45deg) translateX({$translateValue}px);"
		/>
		<div
			class="more-absolute more-w-4 more-h-1 more-bg-red-500 more-box-shadow"
			style="transform: rotate(135deg) translate({$translateValue}px);"
		/>
		<div
			class="more-absolute more-w-4 more-h-1 more-bg-red-500 more-box-shadow -rotate-45"
			style="transform: rotate(-135deg) translateX({$translateValue}px);"
		/>
		<div
			class="more-absolute more-w-4 more-h-1 more-bg-red-500 more-box-shadow"
			style="transform: rotate(90deg) translateX({$translateValue}px);"
		/>
		<div
			class="more-absolute more-w-4 more-h-1 more-bg-red-500 more-box-shadow -rotate-90"
			style="transform: rotate(-90deg) translateX({$translateValue}px);"
		/>
		<div
			class="more-absolute more-w-4 more-h-1 more-bg-red-500 more-box-shadow"
			style="transform: rotate(180deg) translateX({$translateValue}px);"
		/>
	</div>
{/if}
