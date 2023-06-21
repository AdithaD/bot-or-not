<script lang="ts">
	import Button from 'components/Button.svelte';
	import Section from 'components/Section.svelte';
</script>

<div class="flex-grow flex items-center justify-center">
	<div class="w-1/2 p-8">
		<Section>
			<div class="flex justify-between">
				<h1 class="text-4xl font-bold">Experimental Design 🧪🥼</h1>
				<div>
					<a href="/"><Button>Back to Control 🧪</Button></a>
				</div>
			</div>
			<p class="text-gray-400">Only for Nerds....</p>

			<h2 class="text-2xl font-bold">Phases</h2>
			<div
				class="flex flex-col lg:flex-row items-stretch lg:space-x-4 justify-evenly space-y-4 lg:space-y-0"
			>
				<div class="space-y-4">
					<div class="border-2 border-black rounded-xl p-4">
						<h3 class="font-bold text-xl">Lobby 🛋</h3>
						<ul>
							<li>👉 This is where you'll wait for all of your "friends" 😞 to join up.</li>
							<li>
								👉 Share the url of the game once you've created an experiment to your friends so
								they can join!
							</li>
							<li>👉 Press the start button to begin the experiment!</li>
						</ul>
					</div>
					<div class="border-2 border-black rounded-xl p-4">
						<h3 class="font-bold text-xl">Select 🤔</h3>
						<ul>
							<li>👉 Choose the participants you'd like to talk to in the next round!</li>
							<li>
								👉 Do <b>not</b> reveal who you selected! Otherwise, you'll ruin the experiment!
							</li>
							<li>
								👉 Submit your selection once you've decided! The experiment will move to the chat
								phase once everyone has selected
							</li>
						</ul>
					</div>
					<div class="border-2 border-black rounded-xl p-4">
						<h3 class="font-bold text-xl">Reveal 🔎</h3>
						<ul>
							<li>👉 Find out if you got fooled or not!</li>
							<li>👉 Start a new trial functionality to come soon!</li>
						</ul>
					</div>
				</div>
				<div class="space-y-4 flex flex-col">
					<div class="border-2 border-black rounded-xl h-full p-4">
						<h3 class="font-bold text-xl">Prompt 💭</h3>
						<ul>
							<li>👉 Create a short descriptions of your fellow participants.</li>
							<li>👉 Capture who they are and how they talk.</li>
							<li>👉 Submit when you're ready!</li>
							<li>👉 Make a convincing prompt! For example:</li>
							<li class="mt-4 font-semibold italic">
								[Insert Participant Name] is a total buffon, speaks like he knows everything, when
								obviously I'm more superior. Uses "lol!" and "xD" a lot when texting. Randomly makes
								sheep noises.
							</li>
						</ul>
					</div>
					<div class="border-2 border-black rounded-xl h-full p-4">
						<h3 class="font-bold text-xl">Chat 🤖/🕴</h3>
						<ul>
							<li>👉 Talk to the participants you have selected. Act like a bot to fool them!</li>
							<li>
								👉 If you suspect they are a bot, you can tick the bot checkbox and submit your
								assessment with the ✅ button. You can no longer talk once you've submitted your
								assessment.
							</li>
							<li>
								👉 Watch the 🕓. If you don't submit an assessment, it will default to <b>not</b> a bot!.
							</li>
						</ul>
					</div>
				</div>
			</div>
		</Section>
	</div>
</div>
