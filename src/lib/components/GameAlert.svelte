<script lang="ts">
	import type { Alert } from '$lib/types/games.type.js';

	export let alert: Alert;

	$: {
		if (alert.display) {
			setTimeout(() => {
				alert.display = false;
			}, alert.duration);
		}
	}

	$: getAlertClass = () => {
		if (alert.color === 'red') {
			return 'alert-red';
		}

		if (alert.color === 'green') {
			return 'alert-green';
		}

		return 'alert-blue';
	};
</script>

{#if alert.display}
	<div
		class="more-absolute more-text-2xl more-z-10 more-left-1/2 more-top-1/2 more-p-5 more-z-20 more-text-center {getAlertClass()}"
	>
		{alert.message}
	</div>
{/if}

<style>
	@keyframes alert {
		0% {
			transform: translate(-50%, -50%);
			background-color: transparent;
		}
		25% {
			transform: translate(-52%, -50%);
		}
		50% {
			transform: translate(-50%, -50%);
		}
		75% {
			transform: translate(-48%, -50%);
		}
		100% {
			transform: translate(-50%, -50%);
			background-color: var(--color);
		}
	}

	.alert-red {
		--color: #ef4444;
		animation: alert 150ms infinite;
	}

	.alert-green {
		--color: #22c55e;
		animation: alert 150ms infinite;
	}

	.alert-blue {
		--color: #3b82f6;
		animation: alert 150ms infinite;
	}
</style>
