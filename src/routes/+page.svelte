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
		class="shadow-md border-b-4 border-primary bg-green-300 w-full p-4 text-center flex justify-between relative"
	>
		<div />
		<h1 class="font-bold text-2xl">Bot or Not</h1>
		<div />
		<div class="absolute right-4 top-3">
			<Button click={() => window.location.assign('https://www.buymeacoffee.com/adithad')}
				>Support Me!</Button
			>
		</div>
	</header>
	<main class="p-8 lg:grid lg:grid-rows-4 lg:gap-8 w-full flex-grow space-y-8 lg:space-y-0">
		<div class="">
			<Pregame />
		</div>
		<div>
			<Lobby />
		</div>
		<div>
			<Prompt />
		</div>
		<div>
			<Select />
		</div>
		<div class="col-span-2">
			<Chat />
		</div>
		<div class="col-span-3 row-span-2">
			<Reveal />
		</div>
	</main>
</div>
