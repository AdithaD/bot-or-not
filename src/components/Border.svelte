<script lang="ts">
	import { game, gameId, user } from '$lib/stores';
	import { getDatabase, ref, push } from 'firebase/database';
</script>

<div class="border-2 rounded-xl h-full w-full"><slot /></div>
