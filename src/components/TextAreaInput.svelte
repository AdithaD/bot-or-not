<script lang="ts">
	export let placeholder = '';
	export let value = '';
	export let maxLength: number | null = 500;
</script>

<div class="relative">
	<textarea maxlength={maxLength} class="w-full h-full p-4 rounded-lg" {placeholder} bind:value />
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
