<script>
	import Section from 'components/Section.svelte';
	import Pregame from './Pregame.svelte';
</script>

<div class="flex-grow flex flex-col justify-center py-8">
	<main
		class="w-4/5 xl:w-2/3 self-center flex flex-col xl:flex-row space-y-4 lg:space-y-0 lg:space-x-4 items-center"
	>
		<Pregame />
		<Section>
			<h1 class="font-bold text-2xl mb-2">📢 Attention - Public Service Announcement 📢</h1>
			<h2 class="font-semibold text-xl">
				There's a 50% chance your friend is a bot 😰.<a
					class="text-sm text-blue-400 align-top"
					href="https://www.youtube.com/watch?v=iOVbAmknKUk?autoplay=1">^1</a
				>
			</h2>
			<p>
				In a recent study (n=me) conducted on my favourite <a
					class=" text-green-600 font-bold"
					href="https://chat.openai.com">social network</a
				>, I found that <b class="">100% 😬 </b>of my new friends were actually
				<b class="text-green-600">bots</b>. They exhibited the following bot-like indicators:
			</p>
			<ul class="list-disc list-inside">
				<li>
					responding with <b class="text-green-600">more than</b> just 'k', '...', 'please stop talking
					to me', 'this user has blocked you' 🚫
				</li>
				<li>
					being willing to hold a conversation with me for <b class="text-green-600"
						>more than 1 minute
					</b>⏰
				</li>
				<li><b class="text-green-600"> not </b> leaving me on read 🔍</li>
			</ul>
			<p>
				I'm not sure what to do about this 😥, but I'm sure it's a <b class="text-green-600"
					>problem
				</b>😨. I'm willing to take the first step 💪, but I need more data 👩‍💻 on human - human and
				human - bot interactions. However, recent litigation 👩‍⚖️ has made it difficult for me to
				observe my fellow humans from <b class="text-green-600">within 250m </b>📏.
			</p>
			<h1 class="font-bold text-2xl mb-2">
				But <b class="text-green-600">you </b> can help! 🤝 🤗❤
			</h1>
			<h2 class="font-semibold text-xl">
				Participate in this <b class="text-green-600">controlled experiment </b> and help me collect
				the necessary data 🤓.
			</h2>
			<p class="text-xs text-gray-400">I want real friends 😢</p>
		</Section>
	</main>
</div>
