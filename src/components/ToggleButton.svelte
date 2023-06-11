<script lang="ts">
	export let checked = false;
</script>

<div
	class="block p-2 {checked
		? 'bg-red-700'
		: 'bg-primary'} hover:translate-y-0.5 transition-transform transition-colors text-white font-bold rounded-xl text-center"
>
	<label for="bot-selector"><slot /></label>
	<input type="checkbox" name="bot-selector" bind:checked />
</div>
