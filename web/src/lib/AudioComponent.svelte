<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { getAudioAssets, AudioAssetPlaybackState } from './AudioAssets';
	import { Logger } from '$lib';

	// Debounce delay for saving settings to localStorage
	const saveSettingsDebounceDelay = 500;

	interface OmniMenuAction {
		name: string;
		description: string;
		icon: string;
		action: () => void;
	}

	let saveSettingsDebounceTimeout: number | undefined;
	let audioElements: HTMLAudioElement[] = $state([]);
	let isLoading = $state(true);
	let omniMenuOpen = $state(false);
	let omniMenuActions: OmniMenuAction[] = $state([]);
	let omniMenuFilteredActionsListButtons: HTMLButtonElement[] = $state([]);
	let omniMenuFilteredActions: OmniMenuAction[] = $state([]);
	let omniMenuInputFieldSearch: HTMLInputElement | null = $state(null);
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
			filesCount > 1 ? [...Array(filesCount).keys()].filter((idx) => idx !== fileIdxToggleNow) : [];
		if (
			audioPlayersPlaybackStates[assetIdx] === AudioAssetPlaybackState.STOPPED ||
			audioPlayersPlaybackStates[assetIdx] === AudioAssetPlaybackState.PAUSED
		) {
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

	const addAudioEventListeners = () => {
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

	const getBrowserPlatform = (): string => {
		if (!browser) return '';
		return navigator?.userAgentData?.platform || navigator?.platform || '';
	};

	const getIsMac = (): boolean => {
		if (!browser) return false;
		const platform = getBrowserPlatform();
		return platform.includes('Mac');
	};

	const togglePauseAllAudio = (): void => {
		if (!browser) return;
		for (let assetIdx = audioPlayersPlaybackStates.length - 1; assetIdx >= 0; assetIdx--) {
			const audioState = audioPlayersPlaybackStates[assetIdx];
			switch (audioState) {
				case AudioAssetPlaybackState.PAUSED:
				case AudioAssetPlaybackState.PLAYING:
					toggleAudio(assetIdx);
				case AudioAssetPlaybackState.PAUSED:
					audioPlayersPlaybackStates[assetIdx] = AudioAssetPlaybackState.PLAYING;
					break;
				case AudioAssetPlaybackState.PLAYING:
					audioPlayersPlaybackStates[assetIdx] = AudioAssetPlaybackState.PAUSED;
					break;
				default:
					break;
			}
		}
	};

	const omniMenuActionFocus = (dir: 'up' | 'down'): void => {
		if (!browser) return;
		Logger.info('🔍 Focusing omni menu action in direction:', dir);
		Logger.info('👀 Current active element:', document.activeElement);
		Logger.info('📋 Filtered actions count:', omniMenuFilteredActionsListButtons.length);
		if (omniMenuFilteredActionsListButtons.length === 0) return;

		let currentIndex = -1;
		omniMenuFilteredActionsListButtons.forEach((item, index) => {
			if (item === document.activeElement) {
				currentIndex = index;
			}
		});

		if (dir === 'down') {
			const nextIndex = (currentIndex + 1) % omniMenuFilteredActionsListButtons.length;
			const nextButton = omniMenuFilteredActionsListButtons[nextIndex];
			if (!nextButton) {
				Logger.warn('⚠️ Next button not found at index:', nextIndex);
				return;
			}
			(nextButton as HTMLElement).focus();
		} else if (dir === 'up') {
			const prevIndex =
				(currentIndex - 1 + omniMenuFilteredActionsListButtons.length) %
				omniMenuFilteredActionsListButtons.length;
			const prevButton = omniMenuFilteredActionsListButtons[prevIndex];
			if (!prevButton) {
				Logger.warn('⚠️ Previous button not found at index:', prevIndex);
				return;
			}
			(prevButton as HTMLElement).focus();
		}
	};

	const handleKeypress = (event: KeyboardEvent) => {
		if (!browser) return;
		const isMac = getIsMac();
		const metaKey = isMac ? event.metaKey : event.ctrlKey;

		if (event.key === 'Escape') {
			if (omniMenuOpen && document.activeElement === omniMenuInputFieldSearch) {
				event.preventDefault();
				omniMenuOpen = false;
				return;
			}
			if (omniMenuOpen && document.activeElement !== omniMenuInputFieldSearch) {
				event.preventDefault();
				omniMenuInputFieldSearch?.focus();
				return;
			}
			Logger.info('🔍 Active element on Escape key press:', document.activeElement);
			if (
				(document.activeElement !== volumeElement &&
					document.activeElement instanceof HTMLInputElement) ||
				document.activeElement instanceof HTMLTextAreaElement
			) {
				return; // Ignore when focused on input or textarea
			}
			if (
				document.activeElement !== document.body &&
				document.activeElement instanceof HTMLElement
			) {
				Logger.info('🚀 Blurring active element to remove focus:', document.activeElement);
				document.activeElement.blur();
				return;
			}
			Logger.info('⏸️ Escape key pressed - toggle all audio');
			togglePauseAllAudio();
		}

		if (omniMenuOpen === false && metaKey && event.key === 'k') {
			event.preventDefault();
			toggleOmniMenu(event);
			return;
		}

		if (omniMenuOpen) {
			if ((metaKey && event.key === 'j') || event.key === 'down') {
				event.preventDefault();
				omniMenuActionFocus('down');
			} else if ((metaKey && event.key === 'k') || event.key === 'up') {
				event.preventDefault();
				omniMenuActionFocus('up');
			}
			if (event.key === 'Enter') {
				event.preventDefault();
				const activeElement = document.activeElement;
				if (activeElement === omniMenuInputFieldSearch) {
					// If focus is on input field, focus the first action button
					if (omniMenuFilteredActionsListButtons.length > 0) {
						omniMenuFilteredActionsListButtons[0].click();
					}
					return;
				}
				omniMenuFilteredActionsListButtons.forEach((button, idx) => {
					if (button === activeElement) {
						const action = omniMenuFilteredActions[idx];
						if (action) {
							Logger.info('⚡ Triggering omni menu action via Enter key:', action.name);
							action.action();
							omniMenuOpen = false;
						}
					}
				});
			}
			return; // Do not handle other shortcuts when omni menu is open
		}

		if (volumeElement !== null && event.target === volumeElement) {
			if (event.key === 'j' || event.key === 'h') {
				event.preventDefault();
				let newValue = parseFloat(volumeElement.value) - 0.05;
				newValue = Math.max(0, newValue);
				volumeElement.value = newValue.toString();
				volumeElement.dispatchEvent(
					new Event('input', { bubbles: true, cancelable: true, composed: false })
				);
				return;
			} else if (event.key === 'k' || event.key === 'l') {
				event.preventDefault();
				let newValue = parseFloat(volumeElement.value) + 0.05;
				newValue = Math.min(1, newValue);
				volumeElement.value = newValue.toString();
				volumeElement.dispatchEvent(
					new Event('input', { bubbles: true, cancelable: true, composed: false })
				);
				return;
			}
			['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].forEach((numKey) => {
				if (event.key === numKey) {
					event.preventDefault();
					const volumeValue = parseInt(numKey, 10) * 0.1;
					if (volumeElement) {
						volumeElement.value = volumeValue.toString();
						volumeElement.dispatchEvent(
							new Event('input', { bubbles: true, cancelable: true, composed: false })
						);
					}
				}
			});
		}

		if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
			return; // Ignore keypresses when focused on input or textarea
		}

		if (event.key === 'v' || event.key === 'V') {
			if (volumeElement && volumeElement !== document.activeElement) {
				event.preventDefault();
				volumeElement.focus();
			} else if (volumeElement) {
				event.preventDefault();
				volumeElement.blur();
				Logger.info('🔊 Volume slider is already focused.');
			}
		}
	};

	const addGlobalKeypressListener = () => {
		if (!browser) return;
		window.addEventListener('keydown', handleKeypress);
	};

	const addOmniMenuActions = (): void => {
		omniMenuActions = [
			{
				name: 'Toggle play/pause',
				icon: 'pause',
				description: 'Toggle play/pause for all audio tracks',
				action: () => {
					togglePauseAllAudio();
				}
			},
			{
				name: 'Focus Volume Slider',
				description: 'Focus the volume slider for quick adjustments',
				icon: 'volume-high',
				action: () => {
					if (volumeElement && volumeElement !== document.activeElement) {
						volumeElement.focus();
					} else if (volumeElement) {
						volumeElement.blur();
						Logger.info('🔊 Volume slider is already focused.');
					}
				}
			}
		];
	};

	const omniMenuActionTrigger = (evt: Event): void => {
		const target = evt.currentTarget as HTMLButtonElement;
		const idx = parseInt(target.getAttribute('data-idx') || '-1', 10);
		if (idx === null || isNaN(idx)) {
			return;
		}
		const action = omniMenuFilteredActions[idx];
		if (action) {
			Logger.info('⚡ Triggering omni menu action:', action.name);
			action.action();
			omniMenuOpen = false;
		}
	};

	const onAudioSupported = (): void => {
		if (isAudioSupported === null || isAudioSupported === false) {
			return;
		}
		audioPlayersPlaybackStates = audioAssets.map(() => AudioAssetPlaybackState.STOPPED);
		addAudioEventListeners();
		addGlobalKeypressListener();
		restoreSettings();
		addOmniMenuActions();
	};

	$effect(() => {
		Logger.info('💥 state change detected');
		onAudioSupported();
		if (omniMenuOpen) omniMenuInputFieldSearch?.focus();
	});

	const filterOmniMenuActions = (evt: Event): void => {
		const target = evt.target as HTMLInputElement;
		const searchTerm = target.value;
		const lowerSearchTerm = searchTerm.toLowerCase();
		omniMenuFilteredActions = omniMenuActions.filter(
			(action) =>
				action.name.toLowerCase().includes(lowerSearchTerm) ||
				action.description.toLowerCase().includes(lowerSearchTerm)
		);
	};

	const toggleOmniMenu = (event: Event) => {
		if (!browser) return;
		event?.preventDefault();
		omniMenuOpen = !omniMenuOpen;
	};

	onMount(() => {
		checkIsAudioSupported();
		isLoading = false;
	});
</script>

<div class="fixed right-20 bottom-5 z-50">
	<div class="tooltip" data-tip="Omni Menu ({getIsMac() ? '⌘' : 'ctrl'} + k)">
		<button
			class="btn btn-circle btn-sm btn-ghost"
			onclick={toggleOmniMenu}
			aria-label="Toggle Omni Menu"
		>
			<span class="fa-solid fa-keyboard"></span>
		</button>
	</div>
</div>

{#if omniMenuOpen}
	<div class="bg-opacity-50 fixed inset-0 z-40 flex items-center justify-center bg-black">
		<div class="bg-base-100 w-96 rounded-lg p-6 shadow-lg">
			<label class="input">
				<span class="fa-solid fa-magnifying-glass mr-2"></span>
				<input
					type="search"
					oninput={filterOmniMenuActions}
					required
					placeholder="Action"
					bind:this={omniMenuInputFieldSearch}
				/>
			</label>
			<ul class="list bg-base-100 rounded-box mt-4 overflow-y-auto shadow-md">
				{#each omniMenuFilteredActions as action, actionIdx}
					<li class="list-row">
						<button
							onclick={omniMenuActionTrigger}
							data-idx={actionIdx}
							class="flex w-full items-center rounded p-2 hover:outline-1 hover:outline-gray-500"
							bind:this={omniMenuFilteredActionsListButtons[actionIdx]}
						>
							<span class="fa-solid fa-{action.icon || 'circle'} mr-4"></span>
							<div>
								<div>{action.name}</div>
								<div class="text-xs font-semibold uppercase opacity-60">{action.description}</div>
							</div>
						</button>
					</li>
				{/each}
			</ul>
		</div>
	</div>
{/if}

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
										AudioAssetPlaybackState.PAUSED ||
									audioPlayersPlaybackStates[assetIdx] === AudioAssetPlaybackState.STOPPED
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
