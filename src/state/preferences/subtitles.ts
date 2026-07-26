import { device, useStorageValue } from '#/storage';

/**
 * returns whether video subtitles are enabled by default.
 *
 * @returns `true` if subtitles are enabled
 */
export function useSubtitlesEnabled() {
	return useStorageValue(device, ['subtitlesEnabled']) ?? true;
}

/**
 * sets whether video subtitles are enabled by default.
 *
 * @param value whether to enable subtitles
 */
export function setSubtitlesEnabled(value: boolean) {
	device.set(['subtitlesEnabled'], value);
}
