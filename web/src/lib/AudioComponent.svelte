<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { getAudioAssets, AudioAssetPlaybackState, AudioAssetID } from './AudioAssets';

	// Debounce delay for saving settings to localStorage
	const saveSettingsDebounceDelay = 500;

	let saveSettingsDebounceTimeout: number | undefined;
	let audioElements: HTMLAudioElement[] = [];
	let audioPlayersPlaybackStates: AudioAssetPlaybackState[] = [];
	const audioAssets = getAudioAssets();
	let volumeElement: HTMLInputElement;
	let isLoading = true;

	const getRandomInt = (min: number, max: number): number => {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	};

	const getRandomDelay = (): number => {
		const min = 500; // 5 milliseconds
		const max = 1500; // 1.5 seconds
		return getRandomInt(min, max);
	};

	interface Settings {
		volume: number;
	}

	const defaultSettings: Settings = {
		volume: 1
	};

	const getSettings = (): Settings | null => {
		if (browser) {
			const settingsStr = localStorage.getItem('white-noise-settings');
			if (settingsStr) {
				return JSON.parse(settingsStr) as Settings;
			}
			return defaultSettings;
		}
		return null;
	};

	// debounce save to avoid multiple writes in a short time
	const saveSettings = (setting: Partial<Settings>): void => {
		if (browser) {
			if (saveSettingsDebounceTimeout) {
				clearTimeout(saveSettingsDebounceTimeout);
			}
			saveSettingsDebounceTimeout = setTimeout(() => {
				const currentSettings = getSettings() || defaultSettings;
				const newSettings = { ...currentSettings, ...setting };
				localStorage.setItem('white-noise-settings', JSON.stringify(newSettings));
				console.log('Settings saved:', newSettings);
			}, saveSettingsDebounceDelay);
		}
	};

	const getAudioElement = (audioIdx: number, fileIdx: number): HTMLAudioElement => {
		const audios = Array.from(audioElements);
		for (let i = 0; i < audios.length; i++) {
			const elem = audios[i];
			const dataAudioIdx = parseInt(elem.getAttribute('data-asset-idx') || '-1', 10);
			const dataFileIdx = parseInt(elem.getAttribute('data-file-idx') || '-1', 10);
			if (dataAudioIdx === audioIdx && dataFileIdx === fileIdx) {
				return elem;
			}
		}
		return {} as HTMLAudioElement;
	};

	const toggleAudio = (assetIdx: number) => {
		const files = audioAssets[assetIdx].files;
		const filesCount = files.length;
		const fileIdxToggleNow = getRandomInt(0, filesCount - 1);
		const fileIdxsToggleLater =
			filesCount > 1
				? Array.from({ length: filesCount - 1 }, (_, i) => i).filter((i) => i !== fileIdxToggleNow)
				: [];
		if (audioPlayersPlaybackStates[assetIdx] === AudioAssetPlaybackState.PAUSED) {
			const audio = getAudioElement(assetIdx, fileIdxToggleNow);
			audio.play();
			fileIdxsToggleLater.forEach((fileIdx) => {
				const delay = getRandomDelay();
				setTimeout(() => {
					getAudioElement(assetIdx, fileIdx).play();
				}, delay);
			});
		} else {
			audioAssets[assetIdx].files.forEach((_, fileIdx) => {
				getAudioElement(assetIdx, fileIdx).pause();
			});
		}
	};

	const addEventListeners = () => {
		audioElements.forEach((audio) => {
			audio.addEventListener('play', () => {
				const assetIdx = parseInt(audio.getAttribute('data-asset-idx') || '-1', 10);
				audioPlayersPlaybackStates[assetIdx] = AudioAssetPlaybackState.PLAYING;
			});
			audio.addEventListener('pause', () => {
				const assetIdx = parseInt(audio.getAttribute('data-asset-idx') || '-1', 10);
				audioPlayersPlaybackStates[assetIdx] = AudioAssetPlaybackState.PAUSED;
			});
		});
	};

	const restoreSettings = () => {
		const settings = getSettings();
		if (settings) {
			// Restore volume
			audioElements.forEach((audio) => {
				audio.volume = settings.volume;
			});
			if (volumeElement) {
				volumeElement.value = settings.volume.toString();
			}
		}
	};

	const onVolumeChange = (evt: Event) => {
		const target = evt.target as HTMLInputElement;
		// Limit to 2 decimal places
		const volume = parseFloat(parseFloat(target.value).toFixed(2));
		audioElements.forEach((audio) => {
			audio.volume = volume;
		});
		saveSettings({ volume });
	};

	onMount(() => {
		audioElements = document.querySelectorAll('audio') as unknown as HTMLAudioElement[];
		audioPlayersPlaybackStates = audioAssets.map(() => AudioAssetPlaybackState.PAUSED);
		addEventListeners();
		restoreSettings();
		isLoading = false;
	});
</script>

<div class="loading loading-spinner text-success center size-max {isLoading ? '' : 'hidden'}">
	Loading audio assets...
</div>

<div class="w-full {isLoading ? 'hidden' : ''}">
	<div class="card bg-base-100 w-full shadow-2xl">
		<div class="card-body">
			<fieldset class="fieldset">
				<div class="tooltip" data-tip="Volume">
					<input
						type="range"
						value="1"
						min="0"
						max="1"
						step="0.01"
						on:input={onVolumeChange}
						bind:this={volumeElement}
					/>
				</div>
				<!-- Audio Buttons, flex row -->
				<div class="align-center mt-4 flex flex-row flex-wrap justify-center gap-2">
					{#each audioAssets as asset, assetIdx}
						<div class="tooltip" data-tip={asset.name}>
							<button
								class="btn {audioPlayersPlaybackStates[assetIdx] === AudioAssetPlaybackState.PAUSED
									? 'btn-soft'
									: 'btn-active'}"
								on:click={() => toggleAudio(assetIdx)}
							>
								{asset.icons.string}
							</button>
						</div>
						{#each asset.files as file, fileIdx}
							<audio
								preload="none"
								loop
								class="hidden"
								data-asset-idx={assetIdx}
								data-file-idx={fileIdx}
							>
								<source src={file.url} type={file.type} />
								Your browser does not support the audio element.
							</audio>
						{/each}
					{/each}
				</div>
			</fieldset>
		</div>
	</div>
</div>

<style>
	.hidden {
		display: none;
	}
</style>
