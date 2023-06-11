<script lang="ts">
	export let checked = false;

	export let toggledColour = 'bg-red-700';
	export let disabled = false;
	export let confirmed = false;
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
	class="block p-2 {disabled || confirmed ? 'bg-primarylight' : ''} {checked
		? `bg-primary ${toggledColour}`
		: 'bg-primary'} hover:translate-y-0.5 transition-[transform,colors] text-white font-bold rounded-xl text-center"
	on:click={() => {
		if (!disabled && !confirmed) checked = !checked;
	}}
>
	<label for="bot-selector"><slot /></label>
	<input type="checkbox" name="bot-selector" bind:checked disabled={disabled || confirmed} />
</div>
