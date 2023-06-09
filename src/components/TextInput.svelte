<script>
	export let placeholder = '';
	export let value = '';
</script>

<input bind:value class="w-full h-full p-4 border-2 rounded-lg" type="text" {placeholder} />
