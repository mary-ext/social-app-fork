import { device, useStorage } from '#/storage';

export function useDebugFeedContextEnabled() {
	const [debugFeedContextEnabled = false, setDebugFeedContextEnabled] = useStorage(device, [
		'debugFeedContextEnabled',
	]);

	return [debugFeedContextEnabled, setDebugFeedContextEnabled] as const;
}
