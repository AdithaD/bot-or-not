<script lang="ts">
	export let placeholder = '';
	export let value = '';
	export let maxLength: number | null = 500;

	export let onEnter = () => {};
</script>

<div class="relative">
	<input
		bind:value
		class="w-full h-full p-4 border-2 rounded-lg"
		type="text"
		{placeholder}
		on:keyup={(ev) => {
			if (ev.key == 'Enter') onEnter();
		}}
	/>
	{#if maxLength != null}
		<p
			class="absolute bottom-1 right-1 text-gray-400 {value.length > maxLength
				? 'text-red-500'
				: 'text-gray-400'}"
		>
			{value.length}/ {maxLength.toString()}
		</p>
	{/if}
</div>
