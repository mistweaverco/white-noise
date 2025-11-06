<script lang="ts">
	import '@fortawesome/fontawesome-free/css/all.css';
	import HeadComponent from '$lib/HeadComponent.svelte';
	import AudioComponent from '$lib/AudioComponent.svelte';
	import { getCommitDate, getCommitHash, getCommitHashShort, getRepoURL } from '$lib';
</script>

<HeadComponent
	data={{
		title: 'White Noise',
		description: 'A white noise generator application to help you focus, relax, and sleep better.'
	}}
/>

<div id="start" class="hero bg-base-200 min-h-screen">
	<div class="hero-content text-center">
		<div class="max-w-md">
			<img src="/logo.svg" alt="White Noise logo" class="m-5 mx-auto w-64" />
			<h1 class="text-5xl font-bold">White Noise</h1>
			<p class="py-6">
				White Noise is a simple application that generates soothing white noise to help you focus,
				relax, and sleep better.
			</p>
			<AudioComponent />
			<div class="mt-10">
				<p class="text-sm text-gray-500">
					📌 <a class="link" href="{getRepoURL()}/commit/{getCommitHash()}"
						>{getCommitHashShort()}</a
					>
					📅 {getCommitDate()}
				</p>
			</div>
		</div>
	</div>
</div>
