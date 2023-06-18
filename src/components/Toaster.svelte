<script lang="ts">
	import { toasts } from '$lib/toasts';
	import { fade, fly } from 'svelte/transition';

	const colours = {
		success: 'bg-green-500',
		info: 'bg-yellow-500',
		error: 'bg-red-500'
	} as { [key: string]: string };

	const icons = {
		success: '✅',
		info: '✉',
		error: '❌'
	} as { [key: string]: string };
</script>

<div class="fixed top-0 pointer-events-none h-10">
	<div class="">
		{#each $toasts as toast}
			<div
				class="flex space-x-4 h-10 w-fit m-4 p-2 border-2 border-black rounded-xl font-bold align-middle {colours[
					toast.type
				] ?? 'bg-gray-500'}
        "
				in:fly={{ y: -10, duration: 200 }}
				out:fade
			>
				<div>
					{icons[toast.type]}
				</div>
				<div>
					{toast.text}
				</div>
			</div>
		{/each}
	</div>
</div>
