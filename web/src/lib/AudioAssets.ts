enum AudioAssetURL {
	WATER_A = 'assets/audio/water-a.ogg',
	WATER_B = 'assets/audio/water-b.ogg',
	RAINSTORM_A = 'assets/audio/rainstorm-a.ogg',
	RAINSTORM_B = 'assets/audio/rainstorm-b.ogg',
	THUNDERSTORM_A = 'assets/audio/thunderstorm-a.ogg',
	THUNDERSTORM_B = 'assets/audio/thunderstorm-b.ogg',
	RAIN_A = 'assets/audio/rain-a.ogg',
	RAIN_B = 'assets/audio/rain-b.ogg',
	LIGHT_RAIN_A = 'assets/audio/light-rain-a.ogg',
	LIGHT_RAIN_B = 'assets/audio/light-rain-b.ogg',
	HEAVY_RAIN_A = 'assets/audio/heavy-rain-a.ogg',
	HEAVY_RAIN_B = 'assets/audio/heavy-rain-b.ogg'
}

export enum AudioAssetID {
	WATER = 'water',
	RAINSTORM = 'rainstorm',
	THUNDERSTORM = 'thunderstorm',
	RAIN = 'rain'
}

export enum AudioAssetPlaybackState {
	PAUSED = 'paused',
	PLAYING = 'playing'
}

enum AudioAssetType {
	AUDIO_OGG = 'audio/ogg'
}

interface AudioAssetFile {
	url: AudioAssetURL;
	type: AudioAssetType;
}

interface AudioAssetIcons {
	string: string;
	svgURL: string;
}

interface AudioAsset {
	id: AudioAssetID;
	icons: AudioAssetIcons;
	name: string;
	files: AudioAssetFile[];
	playbackState: AudioAssetPlaybackState;
}

const audioAssets: AudioAsset[] = [
	{
		id: AudioAssetID.WATER,
		icons: {
			string: '💧',
			svgURL: 'assets/icons/water.svg'
		},
		name: 'Water',
		files: [
			{
				url: AudioAssetURL.WATER_A,
				type: AudioAssetType.AUDIO_OGG
			},
			{
				url: AudioAssetURL.WATER_B,
				type: AudioAssetType.AUDIO_OGG
			}
		],
		playbackState: AudioAssetPlaybackState.PAUSED
	},
	{
		id: AudioAssetID.RAINSTORM,
		icons: {
			string: '🌧️',
			svgURL: 'assets/icons/rainstorm.svg'
		},
		name: 'Rainstorm',
		files: [
			{
				url: AudioAssetURL.RAINSTORM_A,
				type: AudioAssetType.AUDIO_OGG
			},
			{
				url: AudioAssetURL.RAINSTORM_B,
				type: AudioAssetType.AUDIO_OGG
			}
		],
		playbackState: AudioAssetPlaybackState.PAUSED
	},
	{
		id: AudioAssetID.THUNDERSTORM,
		icons: {
			string: '⛈️',
			svgURL: 'assets/icons/thunderstorm.svg'
		},
		name: 'Thunderstorm',
		files: [
			{
				url: AudioAssetURL.THUNDERSTORM_A,
				type: AudioAssetType.AUDIO_OGG
			},
			{
				url: AudioAssetURL.THUNDERSTORM_B,
				type: AudioAssetType.AUDIO_OGG
			}
		],
		playbackState: AudioAssetPlaybackState.PAUSED
	},
	{
		id: AudioAssetID.RAIN,
		icons: {
			string: '🌦️',
			svgURL: 'assets/icons/rain.svg'
		},
		name: 'Rain',
		files: [
			{
				url: AudioAssetURL.RAIN_A,
				type: AudioAssetType.AUDIO_OGG
			},
			{
				url: AudioAssetURL.RAIN_B,
				type: AudioAssetType.AUDIO_OGG
			},
			{
				url: AudioAssetURL.HEAVY_RAIN_A,
				type: AudioAssetType.AUDIO_OGG
			},
			{
				url: AudioAssetURL.HEAVY_RAIN_B,
				type: AudioAssetType.AUDIO_OGG
			},
			{
				url: AudioAssetURL.LIGHT_RAIN_A,
				type: AudioAssetType.AUDIO_OGG
			},
			{
				url: AudioAssetURL.LIGHT_RAIN_B,
				type: AudioAssetType.AUDIO_OGG
			}
		],
		playbackState: AudioAssetPlaybackState.PAUSED
	}
];

export const getAudioAsset = (assetID: AudioAssetID): AudioAsset => {
	return audioAssets.find((asset) => asset.id === assetID)!;
};

export const getAudioAssets = (): AudioAsset[] => {
	return audioAssets;
};
