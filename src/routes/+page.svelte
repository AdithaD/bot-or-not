<script>
	import Button from '../components/Button.svelte';
	import Chat from './Chat.svelte';
	import Lobby from './Lobby.svelte';
	import Pregame from './Pregame.svelte';
	import Prompt from './Prompt.svelte';
	import Reveal from './Reveal.svelte';
	import Select from './Select.svelte';
</script>

<div class="min-h-screen flex flex-col">
	<header
		class="shadow-md border-b-4 border-primary w-full p-4 text-center flex justify-between relative"
	>
		<div />
		<h1 class="font-bold text-2xl">Bot or Not</h1>
		<div />
		<div class="absolute right-4">
			<Button click={() => window.location.assign('https://www.buymeacoffee.com/adithad')}
				>Support Me!</Button
			>
		</div>
	</header>
	<main class="p-8 grid grid-cols-3 grid-rows-4 gap-8 w-full flex-grow">
		<Pregame />
		<Lobby />
		<Prompt />
		<Select />
		<div class="col-span-2">
			<Chat />
		</div>
		<div class="col-span-3 row-span-2">
			<Reveal />
		</div>
	</main>
</div>
