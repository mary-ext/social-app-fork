import { device, useStorage } from '#/storage';

export function useSubtitlesEnabled() {
	const [subtitlesEnabled = true, setSubtitlesEnabled] = useStorage(device, ['subtitlesEnabled']);

	return [subtitlesEnabled, setSubtitlesEnabled] as const;
}
