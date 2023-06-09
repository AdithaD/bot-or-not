<script lang="ts">
	export let click = (event: MouseEvent) => {};
	export let expandh = true;
	export let disabled = false;
</script>

<button
	class="{expandh ? 'h-full' : ''} p-2 w-full font-bold text-white rounded-xl shadow-md {!disabled
		? 'bg-primary over:translate-y-0.5 transition-transform'
		: 'bg-primarylight'}"
	on:click={click}
	{disabled}
>
	<slot />
</button>
