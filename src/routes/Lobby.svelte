<script lang="ts">
	import { game } from '$lib/stores';

	$: users = Object.values($game?.users || {});
</script>

<div class="space-y-4 w-full">
	<h1 class="font-bold text-2xl mb-8">Lobby</h1>
	<div>
		<h2 class="font-bold text-xl">Connected Players</h2>
		<div class="border-2 rounded-xl">
			{#if $game}
				{#each users as user}
					<div class="p-2 font-bold">{user.username}</div>
				{/each}
			{/if}
		</div>
	</div>
</div>
