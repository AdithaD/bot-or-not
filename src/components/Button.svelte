<script lang="ts">
	export let click = (event: MouseEvent) => {};
</script>

<button
	class="w-full p-2 bg-primary font-bold text-white rounded-xl shadow-md hover:translate-y-0.5 transition-transform"
	on:click={click}
>
	<slot />
</button>
