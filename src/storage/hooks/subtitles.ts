import { device, useStorageValue } from '#/storage';

/** whether video playback starts with subtitles turned on. */
export function useSubtitlesEnabled() {
	return useStorageValue(device, ['subtitlesEnabled']) ?? true;
}

export function setSubtitlesEnabled(value: boolean) {
	device.set(['subtitlesEnabled'], value);
}
