<script lang="ts">
	export let click = (event: MouseEvent) => {};
	export let expandh = true;
	export let disabled = false;
</script>

<button
	class="whitespace-nowrap {expandh
		? 'h-full'
		: ''} p-2 w-full border-2 border-black font-bold text-black rounded-xl shadow-md {!disabled
		? 'bg-green-400 hover:translate-y-0.5 transition-transform'
		: 'bg-green-200'} justify-center flex items-center"
	on:click={click}
	{disabled}
	tabindex="0"
>
	<slot />
</button>
