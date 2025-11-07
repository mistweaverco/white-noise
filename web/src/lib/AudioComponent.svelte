<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { getAudioAssets, AudioAssetPlaybackState } from './AudioAssets';
	import { Logger } from '$lib';

	// Debounce delay for saving settings to localStorage
	const saveSettingsDebounceDelay = 500;

	let saveSettingsDebounceTimeout: number | undefined;
	let audioElements: HTMLAudioElement[] = $state([]);
	let isLoading = $state(true);
	let isAudioSupported: boolean | null = $state(null);
	let audioPlayersPlaybackStates: AudioAssetPlaybackState[] = $state([]);
	let volumeElement: HTMLInputElement | null = $state(null);
	const audioAssets = getAudioAssets();

	const getRandomInt = (min: number, max: number): number => {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	};

	const getRandomDelay = (): number => {
		const min = 1000; // 1 second
		const max = 2000; // 2 seconds
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
				Logger.info('💾 Settings saved:', newSettings);
			}, saveSettingsDebounceDelay);
		}
	};

	const getAudioElement = (audioIdx: number, fileIdx: number): HTMLAudioElement => {
		for (let i = 0; i < audioElements.length; i++) {
			const elem = audioElements[i];
			const dataAudioIdx = parseInt(elem.getAttribute('data-asset-idx') || '-1', 10);
			const dataFileIdx = parseInt(elem.getAttribute('data-file-idx') || '-1', 10);
			if (dataAudioIdx === audioIdx && dataFileIdx === fileIdx) {
				return elem;
			}
		}
		return {} as HTMLAudioElement;
	};

	interface AudioPlaySchedule {
		timeoutId: number;
		assetIdx: number;
		fileIdx: number;
	}

	const audioPlaySchedules: AudioPlaySchedule[] = [];

	const clearAudioPlaySchedulesForAssetFile = (assetIdx: number, fileIdx: number): void => {
		for (let i = audioPlaySchedules.length - 1; i >= 0; i--) {
			const schedule = audioPlaySchedules[i];
			if (schedule.assetIdx === assetIdx && schedule.fileIdx === fileIdx) {
				Logger.info(
					`🗑️ Clearing scheduled plays for audio asset index:`,
					audioAssets[schedule.assetIdx].files[schedule.fileIdx]
				);
				Logger.info(
					`🔍 Current scheduled plays:`,
					audioPlaySchedules.filter((s) => s.assetIdx === assetIdx).length
				);
				clearTimeout(schedule.timeoutId);
				audioPlaySchedules.splice(i, 1);
				Logger.info(
					`❌ Canceled scheduled play for audio asset:`,
					audioAssets[assetIdx].files[schedule.fileIdx],
					`🎵 audio tag:`,
					getAudioElement(assetIdx, schedule.fileIdx)
				);
			}
		}
	};

	const clearAudioPlaySchedulesForAsset = (assetIdx: number): void => {
		for (let i = audioPlaySchedules.length - 1; i >= 0; i--) {
			const schedule = audioPlaySchedules[i];
			if (schedule.assetIdx === assetIdx) {
				Logger.info(
					`🗑️ Clearing scheduled plays for audio asset index:`,
					audioAssets[schedule.assetIdx].files[schedule.fileIdx]
				);
				Logger.info(
					`🔍 Current scheduled plays:`,
					audioPlaySchedules.filter((s) => s.assetIdx === assetIdx).length
				);
				clearTimeout(schedule.timeoutId);
				audioPlaySchedules.splice(i, 1);
				Logger.info(
					`❌ Canceled scheduled play for audio asset:`,
					audioAssets[assetIdx].files[schedule.fileIdx],
					`🎵 audio tag:`,
					getAudioElement(assetIdx, schedule.fileIdx)
				);
			}
		}
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
			Logger.info('▶️ Playing audio asset:', files[fileIdxToggleNow], '🎵 audio tag:', audio);
			// Clear any scheduled plays for this asset
			clearAudioPlaySchedulesForAsset(assetIdx);
			for (let i = fileIdxsToggleLater.length - 1; i >= 0; i--) {
				const fileIdx = fileIdxsToggleLater[i];
				const delay = getRandomDelay();
				Logger.info(
					`⏱️ Scheduling play for audio asset:`,
					audioAssets[assetIdx].files[fileIdx],
					`after delay of ${delay} ms`
				);
				audioPlaySchedules.push({
					assetIdx,
					fileIdx,
					timeoutId: setTimeout(() => {
						const a = getAudioElement(assetIdx, fileIdx);
						a.play();
						Logger.info(
							'▶️ Playing audio asset:',
							audioAssets[assetIdx].files[fileIdx],
							'🎵 audio tag:',
							a
						);
						Logger.info(
							'🗑️ Removing scheduled self',
							audioPlaySchedules[audioPlaySchedules.length - 1]
						);
						audioPlaySchedules.splice(audioPlaySchedules.length - 1, 1);
					}, delay)
				});
			}
		} else {
			for (let i = filesCount - 1; i >= 0; i--) {
				const fileIdx = i;
				const a = getAudioElement(assetIdx, fileIdx);
				// Clear any scheduled plays for this asset file
				clearAudioPlaySchedulesForAssetFile(assetIdx, fileIdx);
				if (!a.paused) {
					a.pause();
					Logger.info('⏸️ Pausing audio asset:', files[fileIdx], '🎵 audio tag:', a);
				}
			}
		}
	};

	const addEventListeners = () => {
		for (let i = audioElements.length - 1; i >= 0; i--) {
			const audio = audioElements[i];
			audio.addEventListener('play', () => {
				const assetIdx = parseInt(audio.getAttribute('data-asset-idx') || '-1', 10);
				audioPlayersPlaybackStates[assetIdx] = AudioAssetPlaybackState.PLAYING;
			});
			audio.addEventListener('pause', () => {
				const assetIdx = parseInt(audio.getAttribute('data-asset-idx') || '-1', 10);
				audioPlayersPlaybackStates[assetIdx] = AudioAssetPlaybackState.PAUSED;
			});
		}
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
		Logger.info('🔊 Volume changed to:', volume);
		saveSettings({ volume });
	};

	const checkIsAudioSupported = (): void => {
		if (!browser) {
			isAudioSupported = null;
			return;
		}
		const audio = document.createElement('audio');
		const source = document.createElement('source');
		source.src = audioAssets[0].files[0].url;
		source.type = audioAssets[0].files[0].type;
		audio.appendChild(source);

		if (!audio.canPlayType) {
			Logger.warn('❌ Audio is not supported in this browser.');
			isAudioSupported = false;
			return;
		}

		Logger.info('✅ Audio is supported in this browser.');
		isAudioSupported = true;
	};

	const onAudioSupported = (): void => {
		if (isAudioSupported === null || isAudioSupported === false) {
			return;
		}
		audioPlayersPlaybackStates = audioAssets.map(() => AudioAssetPlaybackState.PAUSED);
		addEventListeners();
		restoreSettings();
	};

	$effect(() => {
		Logger.info('🎵 Audio elements updated:', audioElements);
		onAudioSupported();
	});

	onMount(() => {
		checkIsAudioSupported();
		isLoading = false;
	});
</script>

<div class="w-full">
	<div class="card bg-base-100 w-full shadow-2xl">
		<div class="card-body">
			{#if isLoading}
				<fieldset class="fieldset {isLoading ? '' : 'hidden'}">
					<div class="loading loading-spinner text-success mx-auto size-max">
						<span aria-hidden="true">Loading</span>
					</div>
					<span class="info-text mt-2 block text-center text-sm text-gray-500">
						Setting up audio player...
					</span>
				</fieldset>
			{:else if isAudioSupported !== null && isAudioSupported === false}
				<fieldset class="fieldset">
					<div role="alert" class="alert alert-error width-min mx-auto">
						<span class="fa-solid fa-triangle-exclamation mr-2"></span>
						<span>Audio is not supported in your browser.</span>
					</div>
				</fieldset>
			{:else if isAudioSupported !== null && isAudioSupported === true}
				<fieldset class="fieldset {isLoading ? 'hidden' : ''}">
					<div class="tooltip" data-tip="Volume">
						<input
							class="range range-sm w-full"
							type="range"
							value="1"
							min="0"
							max="1"
							step="0.01"
							oninput={onVolumeChange}
							bind:this={volumeElement}
						/>
					</div>
					<!-- Audio Buttons -->
					<div class="align-center mt-4 flex flex-row flex-wrap justify-center gap-2">
						{#each audioAssets as asset, assetIdx}
							<div class="tooltip" data-tip={asset.name}>
								<button
									class="btn btn-circle {audioPlayersPlaybackStates[assetIdx] ===
									AudioAssetPlaybackState.PAUSED
										? 'btn-soft'
										: 'btn-outline btn-success bg-gray-700'}"
									onclick={() => toggleAudio(assetIdx)}
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
									bind:this={audioElements[audioElements.length]}
								>
									<source src={file.url} type={file.type} />
								</audio>
							{/each}
						{/each}
					</div>
				</fieldset>
			{/if}
		</div>
	</div>
</div>

<style>
	.hidden {
		display: none;
	}
</style>
