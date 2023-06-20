<script>
	import Toaster from 'components/Toaster.svelte';
	import '../app.css';
</script>

<div class="appearance bg-green-400 min-h-screen flex flex-col relative overflow-x-hidden">
	<header
		class="shadow-md border-b-4 border-primary bg-green-300 w-full p-4 text-center flex justify-between relative"
	>
		<div />
		<h1 class="font-bold text-2xl">Buddy or Bot</h1>
		<div />
	</header>
	<div class="flex-grow flex flex-col">
		<slot />
	</div>
	<footer class="p-4 w-full">
		<div class="mx-auto w-fit flex flex-col items-center space-y-2">
			<p class="text-green-600">Made by Aditha Doratiyawa 😉</p>
			<div
				class="border-2 border-black rounded-xl hover:scale-105 transition transition-transform w-fit"
			>
				<a href="https://www.buymeacoffee.com/adithad">
					<img
						src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=adithad&button_colour=40DCA5&font_colour=ffffff&font_family=Lato&outline_colour=000000&coffee_colour=FFDD00"
						alt="buy me a coffee"
						class="h-10"
					/>
				</a>
			</div>
		</div>
	</footer>
	<Toaster />
</div>
<svelte:head>
	<title>Buddy or Bot!</title>
</svelte:head>
